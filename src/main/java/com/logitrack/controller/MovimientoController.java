package com.logitrack.controller;

import com.logitrack.dto.MovimientoRequest;
import com.logitrack.dto.MovimientoResponse;
import com.logitrack.model.Movimiento;
import com.logitrack.service.MovimientoService;
import io.swagger.v3.oas.annotations.*;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import com.logitrack.dto.ErrorResponseDTO;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/movimientos")
@RequiredArgsConstructor
@Tag(name = "Movimientos", description = "Gestión de Movimientos de Inventario (Entrada/Salida/Transferencia)")
public class MovimientoController {

    private final MovimientoService service;

    @GetMapping
    @Operation(summary = "Obtener todos los movimientos")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "OK - Lista de movimientos",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = MovimientoResponse.class)))
    })
    public ResponseEntity<List<MovimientoResponse>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener movimiento por ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "OK - Movimiento encontrado",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = MovimientoResponse.class))),
            @ApiResponse(responseCode = "404", description = "NOT FOUND - Movimiento no encontrado",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ErrorResponseDTO.class)))
    })
    public ResponseEntity<MovimientoResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @GetMapping("/tipo/{tipo}")
    @Operation(summary = "Obtener movimientos por tipo (ENTRADA, SALIDA, TRANSFERENCIA)")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "OK - Lista de movimientos por tipo",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = MovimientoResponse.class)))
    })
    public ResponseEntity<List<MovimientoResponse>> getByTipo(@PathVariable String tipo) {
        Movimiento.TipoMovimiento t = Movimiento.TipoMovimiento.valueOf(tipo.toUpperCase());
        return ResponseEntity.ok(service.findByTipo(t));
    }

    @GetMapping("/bodega/{bodegaId}")
    @Operation(summary = "Obtener movimientos de una bodega (origen o destino)")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "OK - Lista de movimientos por bodega",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = MovimientoResponse.class)))
    })
    public ResponseEntity<List<MovimientoResponse>> getByBodega(@PathVariable Long bodegaId) {
        return ResponseEntity.ok(service.findByBodega(bodegaId));
    }

    @GetMapping("/usuario/{usuarioId}")
    @Operation(summary = "Obtener movimientos realizados por un usuario")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "OK - Lista de movimientos por usuario",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = MovimientoResponse.class)))
    })
    public ResponseEntity<List<MovimientoResponse>> getByUsuario(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(service.findByUsuario(usuarioId));
    }

    @GetMapping("/rango-fechas")
    @Operation(summary = "Obtener movimientos por rango de fechas")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "OK - Lista de movimientos en rango",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = MovimientoResponse.class)))
    })
    public ResponseEntity<List<MovimientoResponse>> getByFechas(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fin) {
        return ResponseEntity.ok(service.findByFechas(inicio, fin));
    }

    @GetMapping("/search")
    @Operation(summary = "Buscar movimientos con filtros combinados")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "OK - Lista de movimientos filtrados",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = MovimientoResponse.class))),
            @ApiResponse(responseCode = "400", description = "BAD REQUEST - Parámetros de búsqueda inválidos",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ErrorResponseDTO.class)))
    })
    public ResponseEntity<List<MovimientoResponse>> search(
            @RequestParam(required = false) Movimiento.TipoMovimiento tipo,
            @RequestParam(required = false) Long usuarioId,
            @RequestParam(required = false) Long bodegaId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fin) {
        return ResponseEntity.ok(service.search(tipo, usuarioId, bodegaId, inicio, fin));
    }

    @PostMapping
    @Operation(summary = "Crear nuevo movimiento (ENTRADA/SALIDA/TRANSFERENCIA)")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "CREATED - Movimiento creado",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = MovimientoResponse.class))),
            @ApiResponse(responseCode = "400", description = "BAD REQUEST - Error de negocio/validación",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ErrorResponseDTO.class))),
            @ApiResponse(responseCode = "404", description = "NOT FOUND - Entidades relacionadas no encontradas",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ErrorResponseDTO.class)))
    })
    public ResponseEntity<MovimientoResponse> create(@Valid @RequestBody MovimientoRequest request) {
        MovimientoResponse response = service.create(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar movimiento (NO revierte el inventario)",
               description = "ADVERTENCIA: Eliminar un movimiento NO revierte los cambios en el inventario. " +
                             "Use esta función solo para corrección de errores de captura.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "NO CONTENT - Movimiento eliminado"),
            @ApiResponse(responseCode = "404", description = "NOT FOUND - Movimiento no encontrado",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ErrorResponseDTO.class)))
    })
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
