package com.logitrack.controller;

import com.logitrack.model.Devolucion;
import com.logitrack.service.DevolucionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/devoluciones")
@RequiredArgsConstructor
@Tag(name = "Devoluciones", description = "Gestión de Devoluciones")
public class DevolucionController {
    private final DevolucionService service;

    @GetMapping
    @Operation(summary = "Listar todas las devoluciones")
    public ResponseEntity<List<Devolucion>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/tipo/{tipo}")
    @Operation(summary = "Listar devoluciones por tipo")
    public ResponseEntity<List<Devolucion>> getByTipo(@PathVariable Devolucion.TipoDevolucion tipo) {
        return ResponseEntity.ok(service.findByTipo(tipo));
    }

    @GetMapping("/proveedor/{proveedorId}")
    @Operation(summary = "Listar devoluciones por proveedor")
    public ResponseEntity<List<Devolucion>> getByProveedor(@PathVariable Long proveedorId) {
        return ResponseEntity.ok(service.findByProveedor(proveedorId));
    }

    @GetMapping("/bodega/{bodegaId}")
    @Operation(summary = "Listar devoluciones por bodega")
    public ResponseEntity<List<Devolucion>> getByBodega(@PathVariable Long bodegaId) {
        return ResponseEntity.ok(service.findByBodega(bodegaId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener devolución por ID")
    public ResponseEntity<Devolucion> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    @Operation(summary = "Crear nueva devolución")
    public ResponseEntity<Devolucion> create(@Valid @RequestBody Devolucion devolucion) {
        return new ResponseEntity<>(service.save(devolucion), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar devolución existente")
    public ResponseEntity<Devolucion> update(@PathVariable Long id, @Valid @RequestBody Devolucion devolucion) {
        return ResponseEntity.ok(service.update(id, devolucion));
    }

    @PutMapping("/{id}/aprobar")
    @Operation(summary = "Aprobar devolución")
    public ResponseEntity<Devolucion> aprobar(@PathVariable Long id) {
        return ResponseEntity.ok(service.aprobar(id));
    }

    @PutMapping("/{id}/completar")
    @Operation(summary = "Completar devolución y actualizar inventario")
    public ResponseEntity<Devolucion> completar(@PathVariable Long id) {
        return ResponseEntity.ok(service.completar(id));
    }

    @PutMapping("/{id}/rechazar")
    @Operation(summary = "Rechazar devolución")
    public ResponseEntity<Devolucion> rechazar(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String motivo = body.get("motivo");
        return ResponseEntity.ok(service.rechazar(id, motivo));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar devolución")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
