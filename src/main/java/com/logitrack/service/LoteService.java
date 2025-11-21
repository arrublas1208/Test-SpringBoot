package com.logitrack.service;

import com.logitrack.exception.ResourceNotFoundException;
import com.logitrack.exception.BusinessException;
import com.logitrack.model.*;
import com.logitrack.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class LoteService {
    private final LoteRepository repository;
    private final com.logitrack.repository.UsuarioRepository usuarioRepository;
    private final ProductoRepository productoRepository;
    private final BodegaRepository bodegaRepository;
    private final ProveedorRepository proveedorRepository;

    private Long currentEmpresaId() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        String username = auth != null ? auth.getName() : null;
        if (username == null) return null;
        return usuarioRepository.findByUsername(username).map(u -> u.getEmpresa().getId()).orElse(null);
    }

    public List<Lote> findAll() {
        Long empresaId = currentEmpresaId();
        // Buscar todos los lotes de las bodegas de la empresa
        return repository.findAll().stream()
                .filter(l -> l.getBodega() != null &&
                           l.getBodega().getEmpresa() != null &&
                           empresaId.equals(l.getBodega().getEmpresa().getId()))
                .toList();
    }

    public List<Lote> findByProducto(Long productoId) {
        return repository.findByProductoId(productoId);
    }

    public List<Lote> findByBodega(Long bodegaId) {
        return repository.findByBodegaId(bodegaId);
    }

    public List<Lote> findVencidos() {
        Long empresaId = currentEmpresaId();
        return repository.findVencidos(empresaId, LocalDate.now());
    }

    public List<Lote> findProximosAVencer(int dias) {
        Long empresaId = currentEmpresaId();
        LocalDate desde = LocalDate.now();
        LocalDate hasta = LocalDate.now().plusDays(dias);
        return repository.findProximosAVencer(empresaId, desde, hasta);
    }

    public Lote findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lote no encontrado: " + id));
    }

    public Lote save(Lote lote) {
        // Validar producto
        if (lote.getProducto() != null && lote.getProducto().getId() != null) {
            Producto producto = productoRepository.findById(lote.getProducto().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado"));
            lote.setProducto(producto);
        } else {
            throw new BusinessException("Debe especificar un producto");
        }

        // Validar bodega
        if (lote.getBodega() != null && lote.getBodega().getId() != null) {
            Bodega bodega = bodegaRepository.findById(lote.getBodega().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Bodega no encontrada"));
            lote.setBodega(bodega);
        } else {
            throw new BusinessException("Debe especificar una bodega");
        }

        // Validar proveedor si está presente
        if (lote.getProveedor() != null && lote.getProveedor().getId() != null) {
            Proveedor proveedor = proveedorRepository.findById(lote.getProveedor().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Proveedor no encontrado"));
            lote.setProveedor(proveedor);
        }

        // Validar fechas
        if (lote.getFechaFabricacion() != null && lote.getFechaVencimiento() != null) {
            if (lote.getFechaVencimiento().isBefore(lote.getFechaFabricacion())) {
                throw new BusinessException("La fecha de vencimiento no puede ser anterior a la fecha de fabricación");
            }
        }

        // Validar que no exista lote duplicado
        if (repository.findByNumeroLoteAndProductoIdAndBodegaId(
                lote.getNumeroLote(),
                lote.getProducto().getId(),
                lote.getBodega().getId()).isPresent()) {
            throw new BusinessException("Ya existe un lote con ese número para este producto y bodega");
        }

        return repository.save(lote);
    }

    public Lote update(Long id, Lote lote) {
        Lote existing = findById(id);

        // Validar producto
        if (lote.getProducto() != null && lote.getProducto().getId() != null) {
            Producto producto = productoRepository.findById(lote.getProducto().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado"));
            lote.setProducto(producto);
        } else {
            lote.setProducto(existing.getProducto());
        }

        // Validar bodega
        if (lote.getBodega() != null && lote.getBodega().getId() != null) {
            Bodega bodega = bodegaRepository.findById(lote.getBodega().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Bodega no encontrada"));
            lote.setBodega(bodega);
        } else {
            lote.setBodega(existing.getBodega());
        }

        // Validar fechas
        if (lote.getFechaFabricacion() != null && lote.getFechaVencimiento() != null) {
            if (lote.getFechaVencimiento().isBefore(lote.getFechaFabricacion())) {
                throw new BusinessException("La fecha de vencimiento no puede ser anterior a la fecha de fabricación");
            }
        }

        lote.setId(id);
        lote.setCreatedAt(existing.getCreatedAt());
        return repository.save(lote);
    }

    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Lote no encontrado: " + id);
        }
        repository.deleteById(id);
    }
}
