package com.logitrack.service;

import com.logitrack.exception.ResourceNotFoundException;
import com.logitrack.exception.BusinessException;
import com.logitrack.model.Bodega;
import com.logitrack.model.InventarioBodega;
import com.logitrack.model.Producto;
import com.logitrack.model.Auditoria;
import com.logitrack.repository.BodegaRepository;
import com.logitrack.repository.InventarioBodegaRepository;
import com.logitrack.repository.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class InventarioBodegaService {
    private final InventarioBodegaRepository repository;
    private final BodegaRepository bodegaRepository;
    private final ProductoRepository productoRepository;
    private final AuditoriaService auditoriaService;
    private final com.logitrack.repository.UsuarioRepository usuarioRepository;

    private Long currentEmpresaId() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        String username = auth != null ? auth.getName() : null;
        if (username == null) return null;
        return usuarioRepository.findByUsername(username).map(u -> u.getEmpresa().getId()).orElse(null);
    }

    public Page<InventarioBodega> findAll(Pageable pageable, Integer stockMinimo) {
        Long empresaId = currentEmpresaId();
        if (stockMinimo != null) {
            return repository.findByStockMinimoFilterEmpresa(empresaId, stockMinimo, pageable);
        }
        return repository.findAllPageableByEmpresa(empresaId, pageable);
    }

    public InventarioBodega findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inventario no encontrado: " + id));
    }

    public Page<InventarioBodega> findByBodega(Long bodegaId, Pageable pageable) {
        if (!bodegaRepository.existsById(bodegaId)) {
            throw new ResourceNotFoundException("Bodega no encontrada: " + bodegaId);
        }
        // Validar empresa del usuario
        Long empresaId = currentEmpresaId();
        com.logitrack.model.Bodega b = bodegaRepository.findById(bodegaId).orElseThrow(() -> new ResourceNotFoundException("Bodega no encontrada: " + bodegaId));
        if (!b.getEmpresa().getId().equals(empresaId)) {
            throw new BusinessException("Acceso denegado a bodega de otra empresa");
        }
        return repository.findByBodegaId(bodegaId, pageable);
    }

    public Page<InventarioBodega> findByProducto(Long productoId, Pageable pageable) {
        if (!productoRepository.existsById(productoId)) {
            throw new ResourceNotFoundException("Producto no encontrado: " + productoId);
        }
        Long empresaId = currentEmpresaId();
        com.logitrack.model.Producto p = productoRepository.findById(productoId).orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado: " + productoId));
        if (!p.getEmpresa().getId().equals(empresaId)) {
            throw new BusinessException("Acceso denegado a producto de otra empresa");
        }
        return repository.findByProductoId(productoId, pageable);
    }

    public InventarioBodega findByBodegaAndProducto(Long bodegaId, Long productoId) {
        return repository.findByBodegaIdAndProductoId(bodegaId, productoId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Inventario no encontrado para bodega " + bodegaId + " y producto " + productoId));
    }

    public List<InventarioBodega> findStockBajo() {
        return repository.findAllStockBajo();
    }

    public List<InventarioBodega> findStockBajoByBodega(Long bodegaId) {
        if (!bodegaRepository.existsById(bodegaId)) {
            throw new ResourceNotFoundException("Bodega no encontrada: " + bodegaId);
        }
        Long empresaId = currentEmpresaId();
        com.logitrack.model.Bodega b = bodegaRepository.findById(bodegaId).orElseThrow(() -> new ResourceNotFoundException("Bodega no encontrada: " + bodegaId));
        if (!b.getEmpresa().getId().equals(empresaId)) {
            throw new BusinessException("Acceso denegado a bodega de otra empresa");
        }
        return repository.findStockBajoByBodega(bodegaId);
    }

    public Integer getTotalStockByProducto(Long productoId) {
        if (!productoRepository.existsById(productoId)) {
            throw new ResourceNotFoundException("Producto no encontrado: " + productoId);
        }
        Long empresaId = currentEmpresaId();
        return repository.getTotalStockByProducto(productoId, empresaId);
    }

    public InventarioBodega save(InventarioBodega inventario) {
        // Validar que la bodega existe
        Long empresaId = currentEmpresaId();
        Bodega bodega = bodegaRepository.findById(inventario.getBodega().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Bodega no encontrada"));

        // Validar que el producto existe
        Producto producto = productoRepository.findById(inventario.getProducto().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado"));

        if (!bodega.getEmpresa().getId().equals(empresaId) || !producto.getEmpresa().getId().equals(empresaId)) {
            throw new BusinessException("Solo se permite administrar inventario dentro de la misma empresa");
        }

        // Validar que no exista ya un registro para esta combinación
        if (repository.existsByBodegaIdAndProductoId(bodega.getId(), producto.getId())) {
            throw new BusinessException("Ya existe inventario para este producto en esta bodega");
        }

        // Validar stock mínimo <= stock máximo
        if (inventario.getStockMinimo() > inventario.getStockMaximo()) {
            throw new BusinessException("El stock mínimo no puede ser mayor al stock máximo");
        }

        inventario.setBodega(bodega);
        inventario.setProducto(producto);
        InventarioBodega saved = repository.save(inventario);
        auditoriaService.registrar("InventarioBodega", saved.getId(), Auditoria.Operacion.INSERT, null, saved);
        return saved;
    }

    public InventarioBodega update(Long id, InventarioBodega inventario) {
        InventarioBodega existing = findById(id);

        // Validar stock mínimo <= stock máximo
        if (inventario.getStockMinimo() > inventario.getStockMaximo()) {
            throw new BusinessException("El stock mínimo no puede ser mayor al stock máximo");
        }

        InventarioBodega prev = InventarioBodega.builder()
                .id(existing.getId())
                .bodega(existing.getBodega())
                .producto(existing.getProducto())
                .stock(existing.getStock())
                .stockMinimo(existing.getStockMinimo())
                .stockMaximo(existing.getStockMaximo())
                .ultimaActualizacion(existing.getUltimaActualizacion())
                .build();
        existing.setStock(inventario.getStock());
        existing.setStockMinimo(inventario.getStockMinimo());
        existing.setStockMaximo(inventario.getStockMaximo());
        InventarioBodega saved = repository.save(existing);
        auditoriaService.registrar("InventarioBodega", saved.getId(), Auditoria.Operacion.UPDATE, prev, saved);
        return saved;
    }

    public InventarioBodega ajustarStock(Long bodegaId, Long productoId, Integer cantidad) {
        InventarioBodega inventario = findByBodegaAndProducto(bodegaId, productoId);
        int nuevoStock = inventario.getStock() + cantidad;

        if (nuevoStock < 0) {
            throw new BusinessException("Stock insuficiente. Stock actual: " + inventario.getStock() +
                    ", cantidad solicitada: " + Math.abs(cantidad));
        }

        if (nuevoStock > inventario.getStockMaximo()) {
            throw new BusinessException("El stock excedería el máximo permitido: " + inventario.getStockMaximo());
        }

        InventarioBodega prev = InventarioBodega.builder()
                .id(inventario.getId())
                .bodega(inventario.getBodega())
                .producto(inventario.getProducto())
                .stock(inventario.getStock())
                .stockMinimo(inventario.getStockMinimo())
                .stockMaximo(inventario.getStockMaximo())
                .ultimaActualizacion(inventario.getUltimaActualizacion())
                .build();
        inventario.setStock(nuevoStock);
        InventarioBodega saved = repository.save(inventario);
        auditoriaService.registrar("InventarioBodega", saved.getId(), Auditoria.Operacion.UPDATE, prev, saved);
        return saved;
    }

    public void delete(Long id) {
        InventarioBodega prev = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inventario no encontrado: " + id));
        repository.deleteById(id);
        auditoriaService.registrar("InventarioBodega", prev.getId(), Auditoria.Operacion.DELETE, prev, null);
    }
}
