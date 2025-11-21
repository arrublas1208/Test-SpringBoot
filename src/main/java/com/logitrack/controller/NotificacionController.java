package com.logitrack.controller;

import com.logitrack.model.Notificacion;
import com.logitrack.service.NotificacionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notificaciones")
@RequiredArgsConstructor
@Tag(name = "Notificaciones", description = "Gestión de Notificaciones y Alertas")
public class NotificacionController {
    private final NotificacionService service;

    @GetMapping
    @Operation(summary = "Listar todas las notificaciones del usuario actual")
    public ResponseEntity<List<Notificacion>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/no-leidas")
    @Operation(summary = "Listar notificaciones no leídas")
    public ResponseEntity<List<Notificacion>> getNoLeidas() {
        return ResponseEntity.ok(service.findNoLeidas());
    }

    @GetMapping("/count")
    @Operation(summary = "Contar notificaciones no leídas")
    public ResponseEntity<Map<String, Long>> countNoLeidas() {
        return ResponseEntity.ok(Map.of("count", service.countNoLeidas()));
    }

    @GetMapping("/tipo/{tipo}")
    @Operation(summary = "Listar notificaciones por tipo")
    public ResponseEntity<List<Notificacion>> getByTipo(@PathVariable Notificacion.TipoNotificacion tipo) {
        return ResponseEntity.ok(service.findByTipo(tipo));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener notificación por ID")
    public ResponseEntity<Notificacion> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    @Operation(summary = "Crear nueva notificación")
    public ResponseEntity<Notificacion> create(@Valid @RequestBody Notificacion notificacion) {
        return new ResponseEntity<>(service.save(notificacion), HttpStatus.CREATED);
    }

    @PutMapping("/{id}/leer")
    @Operation(summary = "Marcar notificación como leída")
    public ResponseEntity<Notificacion> marcarComoLeida(@PathVariable Long id) {
        return ResponseEntity.ok(service.marcarComoLeida(id));
    }

    @PutMapping("/leer-todas")
    @Operation(summary = "Marcar todas las notificaciones como leídas")
    public ResponseEntity<Void> marcarTodasComoLeidas() {
        service.marcarTodasComoLeidas();
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar notificación")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
