package com.logitrack.service;

import com.logitrack.exception.ResourceNotFoundException;
import com.logitrack.exception.BusinessException;
import com.logitrack.model.Proveedor;
import com.logitrack.repository.ProveedorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ProveedorService {
    private final ProveedorRepository repository;
    private final com.logitrack.repository.UsuarioRepository usuarioRepository;

    private Long currentEmpresaId() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        String username = auth != null ? auth.getName() : null;
        if (username == null) return null;
        return usuarioRepository.findByUsername(username).map(u -> u.getEmpresa().getId()).orElse(null);
    }

    public List<Proveedor> findAll() {
        Long empresaId = currentEmpresaId();
        return repository.findByEmpresaId(empresaId);
    }

    public List<Proveedor> findActivos() {
        Long empresaId = currentEmpresaId();
        return repository.findByEmpresaIdAndActivoTrue(empresaId);
    }

    public Proveedor findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Proveedor no encontrado: " + id));
    }

    public Proveedor save(Proveedor proveedor) {
        Long empresaId = currentEmpresaId();
        if (repository.existsByNombreAndEmpresaId(proveedor.getNombre(), empresaId)) {
            throw new BusinessException("Ya existe un proveedor con ese nombre");
        }
        if (proveedor.getEmpresa() == null && empresaId != null) {
            com.logitrack.model.Empresa emp = new com.logitrack.model.Empresa();
            emp.setId(empresaId);
            proveedor.setEmpresa(emp);
        }
        return repository.save(proveedor);
    }

    public Proveedor update(Long id, Proveedor proveedor) {
        Proveedor existing = findById(id);
        if (!existing.getNombre().equals(proveedor.getNombre()) &&
            repository.existsByNombreAndEmpresaId(proveedor.getNombre(), currentEmpresaId())) {
            throw new BusinessException("Nombre ya en uso");
        }
        proveedor.setId(id);
        proveedor.setEmpresa(existing.getEmpresa());
        return repository.save(proveedor);
    }

    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Proveedor no encontrado: " + id);
        }
        repository.deleteById(id);
    }
}
