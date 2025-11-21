package com.logitrack.service;

import com.logitrack.dto.ReporteResumen;
import com.logitrack.model.MovimientoDetalle;
import com.logitrack.model.Producto;
import com.logitrack.repository.BodegaRepository;
import com.logitrack.repository.MovimientoDetalleRepository;
import com.logitrack.repository.ProductoRepository;
import com.logitrack.repository.InventarioBodegaRepository;
import com.logitrack.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

import java.util.List;
import java.util.Map;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReporteService {

    private final ProductoRepository productoRepository;
    private final MovimientoDetalleRepository detalleRepository;
    private final BodegaRepository bodegaRepository;
    private final InventarioBodegaRepository inventarioBodegaRepository;
    private final com.logitrack.repository.UsuarioRepository usuarioRepository;
    private final com.logitrack.repository.MovimientoRepository movimientoRepository;

    @Value("${reportes.stock-bajo.threshold:10}")
    private int defaultThreshold;

    @Value("${reportes.stock-bajo.max-threshold:1000}")
    private int maxThreshold;

    private Long currentEmpresaId() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        String username = auth != null ? auth.getName() : null;
        if (username == null) return null;
        return usuarioRepository.findByUsername(username).map(u -> u.getEmpresa().getId()).orElse(null);
    }

    public ReporteResumen generarResumen() {
        return generarResumen(defaultThreshold);
    }

    public ReporteResumen generarResumen(int threshold) {
        if (threshold < 0) {
            throw new BusinessException("El parámetro 'threshold' debe ser mayor o igual a 0");
        }
        if (threshold > maxThreshold) {
            throw new BusinessException("El parámetro 'threshold' no debe ser mayor a " + maxThreshold);
        }
        Long empresaId = currentEmpresaId();

        // Stock bajo (productos con stock < threshold) filtrado por empresa
        List<Producto> productosEmpresa = productoRepository.findByEmpresaId(empresaId, org.springframework.data.domain.PageRequest.of(0, Integer.MAX_VALUE)).getContent();
        List<Producto> stockBajo = productosEmpresa.stream()
                .filter(p -> (p.getStock() != null ? p.getStock() : 0) < threshold)
                .collect(java.util.stream.Collectors.toList());

        // Productos más movidos (por cantidad total en movimientos) filtrado por empresa
        java.util.List<com.logitrack.model.Movimiento> movimientosEmpresa = movimientoRepository.findByUsuarioEmpresaId(empresaId);
        java.util.List<MovimientoDetalle> detallesEmpresa = movimientosEmpresa.stream()
                .flatMap(m -> detalleRepository.findByMovimientoId(m.getId()).stream())
                .collect(java.util.stream.Collectors.toList());
        List<ReporteResumen.ProductoMovido> masMovidos = detallesEmpresa.stream()
                .collect(Collectors.groupingBy(
                        MovimientoDetalle::getProducto,
                        Collectors.summingInt(MovimientoDetalle::getCantidad)
                ))
                .entrySet().stream()
                .sorted((a, b) -> Integer.compare(b.getValue(), a.getValue()))
                .limit(5)
                .map(e -> new ReporteResumen.ProductoMovido(e.getKey().getNombre(), e.getValue()))
                .collect(Collectors.toList());

        // Stock por bodega (real): sumar inventarios por bodega de la empresa
        List<ReporteResumen.StockPorBodega> stockPorBodega = bodegaRepository.findByEmpresaId(empresaId).stream()
                .map(b -> {
                    var inventarios = inventarioBodegaRepository.findByBodegaId(b.getId());
                    int totalProductos = inventarios.stream()
                            .mapToInt(inv -> inv.getStock() != null ? inv.getStock() : 0)
                            .sum();
                    BigDecimal valorTotal = inventarios.stream()
                            .map(inv -> {
                                int stock = inv.getStock() != null ? inv.getStock() : 0;
                                BigDecimal precio = inv.getProducto() != null && inv.getProducto().getPrecio() != null
                                        ? inv.getProducto().getPrecio() : BigDecimal.ZERO;
                                return precio.multiply(BigDecimal.valueOf(stock));
                            })
                            .reduce(BigDecimal.ZERO, BigDecimal::add)
                            .setScale(2, RoundingMode.HALF_UP);
                    return new ReporteResumen.StockPorBodega(b.getNombre(), totalProductos, valorTotal);
                })
                .collect(Collectors.toList());

        // Resumen por categoría (por empresa): stock y valor total
        Map<String, List<Producto>> productosPorCategoria = productosEmpresa.stream()
                .collect(Collectors.groupingBy(p -> p.getCategoria() != null ? p.getCategoria() : "Sin categoría"));

        List<ReporteResumen.CategoriaResumen> resumenPorCategoria = productosPorCategoria.entrySet().stream()
                .map(e -> {
                    String categoria = e.getKey();
                    int stockTotal = e.getValue().stream()
                            .mapToInt(p -> p.getStock() != null ? p.getStock() : 0)
                            .sum();
                    BigDecimal valorTotal = e.getValue().stream()
                            .map(p -> {
                                int stock = p.getStock() != null ? p.getStock() : 0;
                                BigDecimal precio = p.getPrecio() != null ? p.getPrecio() : BigDecimal.ZERO;
                                return precio.multiply(BigDecimal.valueOf(stock));
                            })
                            .reduce(BigDecimal.ZERO, BigDecimal::add)
                            .setScale(2, RoundingMode.HALF_UP);
                    return new ReporteResumen.CategoriaResumen(categoria, stockTotal, valorTotal);
                })
                .sorted((a, b) -> b.getValorTotal().compareTo(a.getValorTotal()))
                .collect(Collectors.toList());

        return ReporteResumen.builder()
                .stockPorBodega(stockPorBodega)
                .productosMasMovidos(masMovidos)
                .stockBajo(stockBajo)
                .resumenPorCategoria(resumenPorCategoria)
                .threshold(threshold)
                .maxThreshold(maxThreshold)
                .build();
    }
}