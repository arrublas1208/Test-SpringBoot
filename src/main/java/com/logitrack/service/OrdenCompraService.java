package com.logitrack.service;

import com.logitrack.exception.ResourceNotFoundException;
import com.logitrack.exception.BusinessException;
import com.logitrack.model.*;
import com.logitrack.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class OrdenCompraService {
    private final OrdenCompraRepository repository;
    private final com.logitrack.repository.UsuarioRepository usuarioRepository;
    private final ProveedorRepository proveedorRepository;
    private final BodegaRepository bodegaRepository;
    private final ProductoRepository productoRepository;
    private final InventarioBodegaRepository inventarioBodegaRepository;

    private Long currentEmpresaId() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        String username = auth != null ? auth.getName() : null;
        if (username == null) return null;
        return usuarioRepository.findByUsername(username).map(u -> u.getEmpresa().getId()).orElse(null);
    }

    private Usuario currentUsuario() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        String username = auth != null ? auth.getName() : null;
        if (username == null) return null;
        return usuarioRepository.findByUsername(username).orElse(null);
    }

    public List<OrdenCompra> findAll() {
        Long empresaId = currentEmpresaId();
        return repository.findByEmpresaIdOrderByFechaOrdenDesc(empresaId);
    }

    public List<OrdenCompra> findPendientes() {
        Long empresaId = currentEmpresaId();
        return repository.findPendientesOrAprobadas(empresaId);
    }

    public List<OrdenCompra> findByEstado(OrdenCompra.EstadoOrden estado) {
        Long empresaId = currentEmpresaId();
        return repository.findByEmpresaIdAndEstado(empresaId, estado);
    }

    public OrdenCompra findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Orden de compra no encontrada: " + id));
    }

    public OrdenCompra save(OrdenCompra ordenCompra) {
        Long empresaId = currentEmpresaId();
        Usuario usuario = currentUsuario();

        if (ordenCompra.getNumeroOrden() != null && repository.findByNumeroOrden(ordenCompra.getNumeroOrden()).isPresent()) {
            throw new BusinessException("Ya existe una orden con ese número");
        }

        // Generar número de orden si no existe
        if (ordenCompra.getNumeroOrden() == null || ordenCompra.getNumeroOrden().isEmpty()) {
            ordenCompra.setNumeroOrden("OC-" + System.currentTimeMillis());
        }

        // Validar proveedor
        if (ordenCompra.getProveedor() != null && ordenCompra.getProveedor().getId() != null) {
            Proveedor proveedor = proveedorRepository.findById(ordenCompra.getProveedor().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Proveedor no encontrado"));
            ordenCompra.setProveedor(proveedor);
        }

        // Validar bodega destino
        if (ordenCompra.getBodegaDestino() != null && ordenCompra.getBodegaDestino().getId() != null) {
            Bodega bodega = bodegaRepository.findById(ordenCompra.getBodegaDestino().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Bodega no encontrada"));
            ordenCompra.setBodegaDestino(bodega);
        }

        // Asignar empresa y usuario
        if (empresaId != null) {
            Empresa emp = new Empresa();
            emp.setId(empresaId);
            ordenCompra.setEmpresa(emp);
        }
        ordenCompra.setUsuario(usuario);

        // Calcular total de los detalles
        BigDecimal total = ordenCompra.getDetalles().stream()
                .map(d -> d.getPrecioUnitario().multiply(BigDecimal.valueOf(d.getCantidad())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        ordenCompra.setTotal(total);

        // Asignar la orden a cada detalle
        ordenCompra.getDetalles().forEach(detalle -> {
            detalle.setOrdenCompra(ordenCompra);
            // Validar producto
            if (detalle.getProducto() != null && detalle.getProducto().getId() != null) {
                Producto producto = productoRepository.findById(detalle.getProducto().getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado"));
                detalle.setProducto(producto);
            }
        });

        return repository.save(ordenCompra);
    }

    public OrdenCompra update(Long id, OrdenCompra ordenCompra) {
        OrdenCompra existing = findById(id);

        if (!existing.getNumeroOrden().equals(ordenCompra.getNumeroOrden()) &&
            repository.findByNumeroOrden(ordenCompra.getNumeroOrden()).isPresent()) {
            throw new BusinessException("Número de orden ya en uso");
        }

        ordenCompra.setId(id);
        ordenCompra.setEmpresa(existing.getEmpresa());
        ordenCompra.setUsuario(existing.getUsuario());

        // Calcular total
        BigDecimal total = ordenCompra.getDetalles().stream()
                .map(d -> d.getPrecioUnitario().multiply(BigDecimal.valueOf(d.getCantidad())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        ordenCompra.setTotal(total);

        return repository.save(ordenCompra);
    }

    public OrdenCompra cambiarEstado(Long id, OrdenCompra.EstadoOrden nuevoEstado) {
        OrdenCompra orden = findById(id);

        // Validar transiciones de estado
        if (orden.getEstado() == OrdenCompra.EstadoOrden.CANCELADA) {
            throw new BusinessException("No se puede cambiar el estado de una orden cancelada");
        }
        if (orden.getEstado() == OrdenCompra.EstadoOrden.RECIBIDA) {
            throw new BusinessException("No se puede cambiar el estado de una orden ya recibida");
        }

        orden.setEstado(nuevoEstado);
        return repository.save(orden);
    }

    public OrdenCompra recibirOrden(Long id) {
        OrdenCompra orden = findById(id);

        if (orden.getEstado() == OrdenCompra.EstadoOrden.RECIBIDA) {
            throw new BusinessException("La orden ya fue recibida");
        }
        if (orden.getEstado() == OrdenCompra.EstadoOrden.CANCELADA) {
            throw new BusinessException("No se puede recibir una orden cancelada");
        }

        // Actualizar inventario con los productos recibidos
        for (OrdenCompraDetalle detalle : orden.getDetalles()) {
            InventarioBodega inventario = inventarioBodegaRepository
                    .findByBodegaIdAndProductoId(orden.getBodegaDestino().getId(), detalle.getProducto().getId())
                    .orElseGet(() -> {
                        InventarioBodega nuevo = new InventarioBodega();
                        nuevo.setProducto(detalle.getProducto());
                        nuevo.setBodega(orden.getBodegaDestino());
                        nuevo.setStock(0);
                        nuevo.setStockMinimo(10);
                        return nuevo;
                    });

            inventario.setStock(inventario.getStock() + detalle.getCantidad());
            inventarioBodegaRepository.save(inventario);
        }

        orden.setEstado(OrdenCompra.EstadoOrden.RECIBIDA);
        orden.setFechaRecepcion(LocalDate.now());
        return repository.save(orden);
    }

    public void delete(Long id) {
        OrdenCompra orden = findById(id);

        if (orden.getEstado() == OrdenCompra.EstadoOrden.RECIBIDA) {
            throw new BusinessException("No se puede eliminar una orden ya recibida");
        }

        repository.deleteById(id);
    }
}
