package com.logitrack.controller;

import com.logitrack.model.Lote;
import com.logitrack.service.LoteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/lotes")
@RequiredArgsConstructor
@Tag(name = "Lotes", description = "Gestión de Lotes con tracking de vencimiento")
public class LoteController {
    private final LoteService service;

    @GetMapping
    @Operation(summary = "Listar todos los lotes")
    public ResponseEntity<List<Lote>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/producto/{productoId}")
    @Operation(summary = "Listar lotes por producto")
    public ResponseEntity<List<Lote>> getByProducto(@PathVariable Long productoId) {
        return ResponseEntity.ok(service.findByProducto(productoId));
    }

    @GetMapping("/bodega/{bodegaId}")
    @Operation(summary = "Listar lotes por bodega")
    public ResponseEntity<List<Lote>> getByBodega(@PathVariable Long bodegaId) {
        return ResponseEntity.ok(service.findByBodega(bodegaId));
    }

    @GetMapping("/vencidos")
    @Operation(summary = "Listar lotes vencidos")
    public ResponseEntity<List<Lote>> getVencidos() {
        return ResponseEntity.ok(service.findVencidos());
    }

    @GetMapping("/proximos-vencer")
    @Operation(summary = "Listar lotes próximos a vencer (30 días)")
    public ResponseEntity<List<Lote>> getProximosAVencer(@RequestParam(defaultValue = "30") int dias) {
        return ResponseEntity.ok(service.findProximosAVencer(dias));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener lote por ID")
    public ResponseEntity<Lote> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    @Operation(summary = "Crear nuevo lote")
    public ResponseEntity<Lote> create(@Valid @RequestBody Lote lote) {
        return new ResponseEntity<>(service.save(lote), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar lote existente")
    public ResponseEntity<Lote> update(@PathVariable Long id, @Valid @RequestBody Lote lote) {
        return ResponseEntity.ok(service.update(id, lote));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar lote")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
