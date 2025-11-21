package com.logitrack.controller;

import com.logitrack.model.Proveedor;
import com.logitrack.service.ProveedorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/proveedores")
@RequiredArgsConstructor
@Tag(name = "Proveedores", description = "Gestión de Proveedores")
public class ProveedorController {
    private final ProveedorService service;

    @GetMapping
    @Operation(summary = "Listar todos los proveedores")
    public ResponseEntity<List<Proveedor>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/activos")
    @Operation(summary = "Listar solo proveedores activos")
    public ResponseEntity<List<Proveedor>> getActivos() {
        return ResponseEntity.ok(service.findActivos());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener proveedor por ID")
    public ResponseEntity<Proveedor> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    @Operation(summary = "Crear nuevo proveedor")
    public ResponseEntity<Proveedor> create(@Valid @RequestBody Proveedor proveedor) {
        return new ResponseEntity<>(service.save(proveedor), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar proveedor existente")
    public ResponseEntity<Proveedor> update(@PathVariable Long id, @Valid @RequestBody Proveedor proveedor) {
        return ResponseEntity.ok(service.update(id, proveedor));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar proveedor")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
