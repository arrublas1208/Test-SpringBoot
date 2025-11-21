package com.logitrack.service;

import com.logitrack.exception.ResourceNotFoundException;
import com.logitrack.model.*;
import com.logitrack.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificacionService {
    private final NotificacionRepository repository;
    private final com.logitrack.repository.UsuarioRepository usuarioRepository;

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

    public List<Notificacion> findAll() {
        Long empresaId = currentEmpresaId();
        Usuario usuario = currentUsuario();
        if (usuario != null) {
            return repository.findByEmpresaAndUsuario(empresaId, usuario.getId());
        }
        return repository.findByEmpresaIdOrderByCreatedAtDesc(empresaId);
    }

    public List<Notificacion> findNoLeidas() {
        Long empresaId = currentEmpresaId();
        Usuario usuario = currentUsuario();
        if (usuario != null) {
            return repository.findNoLeidasByEmpresaAndUsuario(empresaId, usuario.getId());
        }
        return repository.findByEmpresaIdOrderByCreatedAtDesc(empresaId).stream()
                .filter(n -> !n.getLeida())
                .toList();
    }

    public Long countNoLeidas() {
        Long empresaId = currentEmpresaId();
        Usuario usuario = currentUsuario();
        if (usuario != null) {
            return repository.countNoLeidasByEmpresaAndUsuario(empresaId, usuario.getId());
        }
        return 0L;
    }

    public List<Notificacion> findByTipo(Notificacion.TipoNotificacion tipo) {
        Long empresaId = currentEmpresaId();
        return repository.findByTipoAndEmpresaId(tipo, empresaId);
    }

    public Notificacion findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notificación no encontrada: " + id));
    }

    public Notificacion save(Notificacion notificacion) {
        Long empresaId = currentEmpresaId();

        // Asignar empresa
        if (notificacion.getEmpresa() == null && empresaId != null) {
            Empresa emp = new Empresa();
            emp.setId(empresaId);
            notificacion.setEmpresa(emp);
        }

        // Si tiene usuario específico, validarlo
        if (notificacion.getUsuario() != null && notificacion.getUsuario().getId() != null) {
            Usuario usuario = usuarioRepository.findById(notificacion.getUsuario().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
            notificacion.setUsuario(usuario);
        }

        return repository.save(notificacion);
    }

    public Notificacion marcarComoLeida(Long id) {
        Notificacion notificacion = findById(id);
        notificacion.setLeida(true);
        return repository.save(notificacion);
    }

    public void marcarTodasComoLeidas() {
        Long empresaId = currentEmpresaId();
        Usuario usuario = currentUsuario();
        if (usuario != null) {
            List<Notificacion> noLeidas = repository.findNoLeidasByEmpresaAndUsuario(empresaId, usuario.getId());
            noLeidas.forEach(n -> n.setLeida(true));
            repository.saveAll(noLeidas);
        }
    }

    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Notificación no encontrada: " + id);
        }
        repository.deleteById(id);
    }

    // Método helper para crear notificaciones desde otros servicios
    public void crearNotificacion(Notificacion.TipoNotificacion tipo, String titulo, String mensaje,
                                  String entidadTipo, Long entidadId, Long empresaId, Long usuarioId) {
        Notificacion notificacion = Notificacion.builder()
                .tipo(tipo)
                .titulo(titulo)
                .mensaje(mensaje)
                .entidadTipo(entidadTipo)
                .entidadId(entidadId)
                .leida(false)
                .build();

        Empresa emp = new Empresa();
        emp.setId(empresaId);
        notificacion.setEmpresa(emp);

        if (usuarioId != null) {
            Usuario usuario = new Usuario();
            usuario.setId(usuarioId);
            notificacion.setUsuario(usuario);
        }

        repository.save(notificacion);
    }
}
