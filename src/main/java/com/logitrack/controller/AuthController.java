package com.logitrack.controller;

import com.logitrack.dto.JwtResponse;
import com.logitrack.dto.LoginRequest;
import com.logitrack.dto.RegisterRequest;
import com.logitrack.model.Usuario;
import com.logitrack.model.Empresa;
import com.logitrack.repository.UsuarioRepository;
import com.logitrack.security.JwtTokenProvider;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UsuarioRepository usuarioRepository;
    private final com.logitrack.repository.EmpresaRepository empresaRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(AuthenticationManager authenticationManager, JwtTokenProvider tokenProvider, UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder, com.logitrack.repository.EmpresaRepository empresaRepository) {
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.empresaRepository = empresaRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<JwtResponse> login(@Valid @RequestBody LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = tokenProvider.generateToken((org.springframework.security.core.userdetails.UserDetails) authentication.getPrincipal());
        Usuario u = usuarioRepository.findByUsername(request.getUsername()).orElseThrow();
        JwtResponse response = JwtResponse.builder()
                .accessToken(token)
                .username(u.getUsername())
                .rol(u.getRol().name())
                .id(u.getId())
                .empId(u.getEmpId())
                .nombreCompleto(u.getNombreCompleto())
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<Usuario> register(@Valid @RequestBody RegisterRequest request) {
        if (usuarioRepository.existsByUsername(request.getUsername())) {
            return ResponseEntity.badRequest().build();
        }
        if (usuarioRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().build();
        }
        if (usuarioRepository.existsByCedula(request.getCedula())) {
            return ResponseEntity.badRequest().build();
        }
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = auth != null ? auth.getName() : null;
        Usuario creador = currentUsername != null ? usuarioRepository.findByUsername(currentUsername).orElse(null) : null;
        if (creador == null || creador.getEmpresa() == null) {
            return ResponseEntity.badRequest().build();
        }
        String rolStr = request.getRol() != null && !request.getRol().isBlank() ? request.getRol().trim().toUpperCase() : "EMPLEADO";
        if (!rolStr.equals("EMPLEADO")) {
            return ResponseEntity.badRequest().build();
        }
        Usuario usuario = Usuario.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .rol(Usuario.Rol.valueOf(rolStr))
                .nombreCompleto(request.getNombreCompleto())
                .email(request.getEmail())
                .cedula(request.getCedula())
                .empId(request.getEmpId())
                .empresa(creador.getEmpresa())
                .build();
        Usuario saved = usuarioRepository.save(usuario);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/register-admin")
    public ResponseEntity<Usuario> registerAdmin(@Valid @RequestBody RegisterRequest request) {
        if (usuarioRepository.existsByUsername(request.getUsername())) {
            return ResponseEntity.badRequest().build();
        }
        if (usuarioRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().build();
        }
        if (usuarioRepository.existsByCedula(request.getCedula())) {
            return ResponseEntity.badRequest().build();
        }
        String nombreEmpresa = (request.getEmpresaNombre() != null && !request.getEmpresaNombre().isBlank()) ? request.getEmpresaNombre().trim() : (request.getUsername() + " Inc");
        Empresa empresa = empresaRepository.findByNombre(nombreEmpresa).orElseGet(() -> empresaRepository.save(Empresa.builder().nombre(nombreEmpresa).build()));
        Usuario usuario = Usuario.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .rol(Usuario.Rol.ADMIN)
                .nombreCompleto(request.getNombreCompleto())
                .email(request.getEmail())
                .cedula(request.getCedula())
                .empId(request.getEmpId())
                .empresa(empresa)
                .build();
        Usuario saved = usuarioRepository.save(usuario);
        return ResponseEntity.ok(saved);
    }
}