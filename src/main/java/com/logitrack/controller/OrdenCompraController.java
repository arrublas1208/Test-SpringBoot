package com.logitrack.controller;

import com.logitrack.model.OrdenCompra;
import com.logitrack.service.OrdenCompraService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ordenes-compra")
@RequiredArgsConstructor
@Tag(name = "Órdenes de Compra", description = "Gestión de Órdenes de Compra")
public class OrdenCompraController {
    private final OrdenCompraService service;

    @GetMapping
    @Operation(summary = "Listar todas las órdenes de compra")
    public ResponseEntity<List<OrdenCompra>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/pendientes")
    @Operation(summary = "Listar órdenes pendientes o aprobadas")
    public ResponseEntity<List<OrdenCompra>> getPendientes() {
        return ResponseEntity.ok(service.findPendientes());
    }

    @GetMapping("/estado/{estado}")
    @Operation(summary = "Listar órdenes por estado")
    public ResponseEntity<List<OrdenCompra>> getByEstado(@PathVariable OrdenCompra.EstadoOrden estado) {
        return ResponseEntity.ok(service.findByEstado(estado));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener orden de compra por ID")
    public ResponseEntity<OrdenCompra> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    @Operation(summary = "Crear nueva orden de compra")
    public ResponseEntity<OrdenCompra> create(@Valid @RequestBody OrdenCompra ordenCompra) {
        return new ResponseEntity<>(service.save(ordenCompra), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar orden de compra existente")
    public ResponseEntity<OrdenCompra> update(@PathVariable Long id, @Valid @RequestBody OrdenCompra ordenCompra) {
        return ResponseEntity.ok(service.update(id, ordenCompra));
    }

    @PutMapping("/{id}/estado")
    @Operation(summary = "Cambiar estado de la orden")
    public ResponseEntity<OrdenCompra> cambiarEstado(@PathVariable Long id, @RequestBody Map<String, String> body) {
        OrdenCompra.EstadoOrden nuevoEstado = OrdenCompra.EstadoOrden.valueOf(body.get("estado"));
        return ResponseEntity.ok(service.cambiarEstado(id, nuevoEstado));
    }

    @PostMapping("/{id}/recibir")
    @Operation(summary = "Recibir orden de compra y actualizar inventario")
    public ResponseEntity<OrdenCompra> recibir(@PathVariable Long id) {
        return ResponseEntity.ok(service.recibirOrden(id));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar orden de compra")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
