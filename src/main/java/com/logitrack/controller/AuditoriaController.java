package com.logitrack.controller;

import com.logitrack.model.Auditoria;
import com.logitrack.service.AuditoriaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/auditoria")
@RequiredArgsConstructor
@Tag(name = "Auditoría", description = "Registro y consulta de auditoría de entidades")
public class AuditoriaController {

    private final AuditoriaService service;

    @GetMapping
    @Operation(summary = "Obtener todo el historial de auditoría")
    public ResponseEntity<List<Auditoria>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/ultimas")
    @Operation(summary = "Obtener últimas operaciones (por defecto 20)")
    public ResponseEntity<List<Auditoria>> getUltimas(@RequestParam(required = false) Integer limite) {
        return ResponseEntity.ok(service.findUltimas(limite));
    }

    @GetMapping("/entidad/{entidad}")
    @Operation(summary = "Obtener auditoría por nombre de entidad")
    public ResponseEntity<List<Auditoria>> getByEntidad(@PathVariable String entidad) {
        return ResponseEntity.ok(service.findByEntidad(entidad));
    }

    @GetMapping("/entidad/{entidad}/{entidadId}")
    @Operation(summary = "Obtener auditoría por entidad e ID")
    public ResponseEntity<List<Auditoria>> getByEntidadAndId(@PathVariable String entidad, @PathVariable Long entidadId) {
        return ResponseEntity.ok(service.findByEntidadAndId(entidad, entidadId));
    }

    @GetMapping("/usuario/{usuarioId}")
    @Operation(summary = "Obtener auditoría por usuario")
    public ResponseEntity<List<Auditoria>> getByUsuario(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(service.findByUsuario(usuarioId));
    }

    @GetMapping("/operacion/{operacion}")
    @Operation(summary = "Obtener auditoría por tipo de operación")
    public ResponseEntity<List<Auditoria>> getByOperacion(@PathVariable String operacion) {
        Auditoria.Operacion op = Auditoria.Operacion.valueOf(operacion.toUpperCase());
        return ResponseEntity.ok(service.findByOperacion(op));
    }

    @GetMapping("/rango-fechas")
    @Operation(summary = "Obtener auditoría por rango de fechas")
    public ResponseEntity<List<Auditoria>> getByFechas(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fin) {
        return ResponseEntity.ok(service.findByFechas(inicio, fin));
    }

    @GetMapping("/page")
    @Operation(summary = "Obtener auditoría paginada")
    public ResponseEntity<org.springframework.data.domain.Page<Auditoria>> getAllPage(
            @org.springframework.data.web.PageableDefault(size = 20) org.springframework.data.domain.Pageable pageable) {
        return ResponseEntity.ok(service.findAllPage(pageable));
    }
}