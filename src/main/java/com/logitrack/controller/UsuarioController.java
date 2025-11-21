package com.logitrack.controller;

import com.logitrack.dto.UsuarioResponse;
import com.logitrack.model.Usuario;
import com.logitrack.repository.UsuarioRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioRepository usuarioRepository;

    public UsuarioController(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    private Long currentEmpresaId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth != null ? auth.getName() : null;
        if (username == null) return null;
        return usuarioRepository.findByUsername(username).map(u -> u.getEmpresa().getId()).orElse(null);
    }

    @GetMapping("/non-admin")
    public ResponseEntity<List<UsuarioResponse>> getNonAdmin() {
        Long empresaId = currentEmpresaId();
        List<Usuario> lista = usuarioRepository.findByEmpresaIdAndRol(empresaId, Usuario.Rol.EMPLEADO);
        List<UsuarioResponse> res = lista.stream()
                .map(u -> UsuarioResponse.builder()
                        .id(u.getId())
                        .username(u.getUsername())
                        .nombreCompleto(u.getNombreCompleto())
                        .email(u.getEmail())
                        .empId(u.getEmpId())
                        .cedula(u.getCedula())
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(res);
    }

    @GetMapping("/by-cedula/{cedula}")
    public ResponseEntity<UsuarioResponse> getByCedula(@PathVariable String cedula) {
        Long empresaId = currentEmpresaId();
        return usuarioRepository.findByCedula(cedula)
                .filter(u -> u.getEmpresa() != null && u.getEmpresa().getId().equals(empresaId))
                .map(u -> ResponseEntity.ok(UsuarioResponse.builder()
                        .id(u.getId())
                        .username(u.getUsername())
                        .nombreCompleto(u.getNombreCompleto())
                        .email(u.getEmail())
                        .empId(u.getEmpId())
                        .cedula(u.getCedula())
                        .build()))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/by-empid/{empid}")
    public ResponseEntity<UsuarioResponse> getByEmpId(@PathVariable String empid) {
        Long empresaId = currentEmpresaId();
        return usuarioRepository.findByEmpIdAndEmpresaId(empid, empresaId)
                .map(u -> ResponseEntity.ok(UsuarioResponse.builder()
                        .id(u.getId())
                        .username(u.getUsername())
                        .nombreCompleto(u.getNombreCompleto())
                        .email(u.getEmail())
                        .empId(u.getEmpId())
                        .cedula(u.getCedula())
                        .build()))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}