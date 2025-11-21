package com.logitrack.service;

import com.logitrack.model.Auditoria;
import com.logitrack.model.Usuario;
import com.logitrack.repository.AuditoriaRepository;
import com.logitrack.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuditoriaService {

    private final AuditoriaRepository repository;
    private final UsuarioRepository usuarioRepository;

    private Long currentEmpresaId() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        String username = auth != null ? auth.getName() : null;
        if (username == null) return null;
        return usuarioRepository.findByUsername(username).map(u -> u.getEmpresa().getId()).orElse(null);
    }

    public List<Auditoria> findAll() {
        Long empresaId = currentEmpresaId();
        return repository.findTop20ByUsuarioEmpresaIdOrderByFechaDesc(empresaId);
    }

    public List<Auditoria> findUltimas(Integer limite) {
        Long empresaId = currentEmpresaId();
        List<Auditoria> ultimas = repository.findTop20ByUsuarioEmpresaIdOrderByFechaDesc(empresaId);
        if (limite == null || limite >= ultimas.size()) {
            return ultimas;
        }
        return ultimas.subList(0, Math.max(0, limite));
    }

    public List<Auditoria> findByEntidad(String entidad) {
        Long empresaId = currentEmpresaId();
        return repository.findByEntidadAndUsuarioEmpresaId(entidad, empresaId, org.springframework.data.domain.PageRequest.of(0, Integer.MAX_VALUE)).getContent();
    }

    public List<Auditoria> findByEntidadAndId(String entidad, Long entidadId) {
        Long empresaId = currentEmpresaId();
        return repository.findByEntidadAndEntidadIdAndUsuarioEmpresaId(entidad, entidadId, empresaId, org.springframework.data.domain.PageRequest.of(0, Integer.MAX_VALUE)).getContent();
    }

    public List<Auditoria> findByUsuario(Long usuarioId) {
        Long empresaId = currentEmpresaId();
        return repository.findByUsuarioId(usuarioId).stream()
                .filter(a -> a.getUsuario() != null && a.getUsuario().getEmpresa() != null && a.getUsuario().getEmpresa().getId().equals(empresaId))
                .collect(java.util.stream.Collectors.toList());
    }

    public List<Auditoria> findByOperacion(Auditoria.Operacion operacion) {
        Long empresaId = currentEmpresaId();
        return repository.findByOperacionAndUsuarioEmpresaId(operacion, empresaId, org.springframework.data.domain.PageRequest.of(0, Integer.MAX_VALUE)).getContent();
    }

    public List<Auditoria> findByFechas(LocalDateTime inicio, LocalDateTime fin) {
        Long empresaId = currentEmpresaId();
        return repository.findByFechaBetweenAndUsuarioEmpresaId(inicio, fin, empresaId, org.springframework.data.domain.PageRequest.of(0, Integer.MAX_VALUE)).getContent();
    }

    public org.springframework.data.domain.Page<Auditoria> findAllPage(org.springframework.data.domain.Pageable pageable) {
        Long empresaId = currentEmpresaId();
        return repository.findByUsuarioEmpresaId(empresaId, pageable);
    }

    public Auditoria registrar(String entidad, Long entidadId, Auditoria.Operacion operacion, Object anteriores, Object nuevos) {
        Auditoria a = new Auditoria();
        a.setEntidad(entidad);
        a.setEntidadId(entidadId);
        a.setOperacion(operacion);
        a.setValoresAnteriores(anteriores);
        a.setValoresNuevos(nuevos);
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            usuarioRepository.findByUsername(auth.getName()).ifPresent(a::setUsuario);
        }
        return repository.save(a);
    }
}