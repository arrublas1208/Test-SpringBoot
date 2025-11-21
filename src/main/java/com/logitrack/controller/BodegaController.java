package com.logitrack.controller;

import com.logitrack.model.Bodega;
import com.logitrack.service.BodegaService;
import io.swagger.v3.oas.annotations.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/bodegas")
@RequiredArgsConstructor
@Tag(name = "Bodegas", description = "CRUD de Bodegas")
public class BodegaController {
    private final BodegaService service;

    @GetMapping
    @Operation(summary = "Obtener todas las bodegas")
    public ResponseEntity<List<Bodega>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener bodega por ID")
    public ResponseEntity<Bodega> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    @Operation(summary = "Crear nueva bodega")
    public ResponseEntity<Bodega> create(@Valid @RequestBody Bodega bodega) {
        return new ResponseEntity<>(service.save(bodega), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar bodega existente")
    public ResponseEntity<Bodega> update(@PathVariable Long id, @Valid @RequestBody Bodega bodega) {
        return ResponseEntity.ok(service.update(id, bodega));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar bodega")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
