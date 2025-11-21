package com.logitrack.service;

import com.logitrack.exception.ResourceNotFoundException;
import com.logitrack.exception.BusinessException;
import com.logitrack.model.Producto;
import com.logitrack.repository.ProductoRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ProductoService {
    private final ProductoRepository repository;
    private final com.logitrack.repository.UsuarioRepository usuarioRepository;

    private Long currentEmpresaId() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        String username = auth != null ? auth.getName() : null;
        if (username == null) return null;
        return usuarioRepository.findByUsername(username).map(u -> u.getEmpresa().getId()).orElse(null);
    }

    public List<Producto> findAll() {
        Long empresaId = currentEmpresaId();
        return repository.findByEmpresaId(empresaId, org.springframework.data.domain.PageRequest.of(0, Integer.MAX_VALUE)).getContent();
    }

    public Producto findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado: " + id));
    }

    public Producto save(Producto producto) {
        if (repository.existsByNombre(producto.getNombre())) {
            throw new BusinessException("Ya existe un producto con nombre: " + producto.getNombre());
        }
        if (producto.getCategoria() != null) {
            producto.setCategoria(producto.getCategoria().trim());
        }
        Long empresaId = currentEmpresaId();
        if (producto.getEmpresa() == null && empresaId != null) {
            com.logitrack.model.Empresa emp = new com.logitrack.model.Empresa();
            emp.setId(empresaId);
            producto.setEmpresa(emp);
        }
        return repository.save(producto);
    }

    public Producto update(Long id, Producto producto) {
        Producto existing = findById(id);
        if (!existing.getNombre().equals(producto.getNombre()) && repository.existsByNombre(producto.getNombre())) {
            throw new BusinessException("Nombre ya en uso");
        }
        if (producto.getCategoria() != null) {
            producto.setCategoria(producto.getCategoria().trim());
        }
        producto.setId(id);
        return repository.save(producto);
    }

    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Producto no encontrado: " + id);
        }
        repository.deleteById(id);
    }

    public List<Producto> findByStockLow(int threshold) {
        return repository.findByStockLessThan(threshold);
    }

    public List<Producto> findTopMovers() {
        return repository.findTopMovers();
    }

    public Page<Producto> search(String categoria, String nombreLike, Pageable pageable) {
        Long empresaId = currentEmpresaId();
        boolean hasCategoria = categoria != null && !categoria.isBlank();
        boolean hasNombre = nombreLike != null && !nombreLike.isBlank();
        if (hasCategoria && hasNombre) {
            return repository.findByEmpresaIdAndCategoriaContainingIgnoreCaseAndNombreContainingIgnoreCase(empresaId, categoria, nombreLike, pageable);
        }
        if (hasCategoria) {
            return repository.findByEmpresaIdAndCategoriaContainingIgnoreCase(empresaId, categoria, pageable);
        }
        if (hasNombre) {
            return repository.findByEmpresaIdAndNombreContainingIgnoreCase(empresaId, nombreLike, pageable);
        }
        return repository.findByEmpresaId(empresaId, pageable);
    }
}
