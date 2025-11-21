package com.logitrack.controller;

import com.logitrack.repository.ProductoRepository;
import com.logitrack.repository.UsuarioRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/categorias")
public class CategoriaController {

    private final ProductoRepository productoRepository;
    private final UsuarioRepository usuarioRepository;

    public CategoriaController(ProductoRepository productoRepository, UsuarioRepository usuarioRepository) {
        this.productoRepository = productoRepository;
        this.usuarioRepository = usuarioRepository;
    }

    private Long currentEmpresaId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth != null ? auth.getName() : null;
        if (username == null) return null;
        return usuarioRepository.findByUsername(username).map(u -> u.getEmpresa().getId()).orElse(null);
    }

    @GetMapping
    public ResponseEntity<List<String>> getCategorias() {
        Long empresaId = currentEmpresaId();
        return ResponseEntity.ok(productoRepository.findDistinctCategoriasByEmpresaId(empresaId));
    }
}