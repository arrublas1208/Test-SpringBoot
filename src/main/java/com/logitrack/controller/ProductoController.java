package com.logitrack.controller;

import com.logitrack.model.Producto;
import com.logitrack.service.ProductoService;
import io.swagger.v3.oas.annotations.*;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import com.logitrack.dto.ErrorResponseDTO;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/productos")
@RequiredArgsConstructor
@Tag(name = "Productos", description = "CRUD de Productos")
public class ProductoController {
    private final ProductoService service;

    @GetMapping
    @Operation(summary = "Listar productos con paginación/orden y filtros opcionales")
    public ResponseEntity<Page<Producto>> getAll(
            @RequestParam(required = false) String categoria,
            @RequestParam(required = false) String nombreLike,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(service.search(categoria, nombreLike, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener producto por ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "OK - Producto encontrado",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = Producto.class))),
            @ApiResponse(responseCode = "404", description = "NOT FOUND - Producto no encontrado",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ErrorResponseDTO.class)))
    })
    public ResponseEntity<Producto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @GetMapping("/stock-bajo")
    @Operation(summary = "Obtener productos con stock bajo")
    public ResponseEntity<List<Producto>> getStockBajo(@RequestParam(defaultValue = "10") int threshold) {
        return ResponseEntity.ok(service.findByStockLow(threshold));
    }

    @GetMapping("/top-movers")
    @Operation(summary = "Obtener productos más solicitados")
    public ResponseEntity<List<Producto>> getTopMovers() {
        return ResponseEntity.ok(service.findTopMovers());
    }

    @PostMapping
    @Operation(summary = "Crear nuevo producto")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "CREATED - Producto creado",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = Producto.class))),
            @ApiResponse(responseCode = "400", description = "BAD REQUEST - Error de negocio/validación",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ErrorResponseDTO.class)))
    })
    public ResponseEntity<Producto> create(@Valid @RequestBody Producto producto) {
        if (producto.getCategoria() == null || producto.getCategoria().isBlank()) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
        return new ResponseEntity<>(service.save(producto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar producto existente")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "OK - Producto actualizado",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = Producto.class))),
            @ApiResponse(responseCode = "400", description = "BAD REQUEST - Error de negocio/validación",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ErrorResponseDTO.class))),
            @ApiResponse(responseCode = "404", description = "NOT FOUND - Producto no encontrado",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ErrorResponseDTO.class)))
    })
    public ResponseEntity<Producto> update(@PathVariable Long id, @Valid @RequestBody Producto producto) {
        return ResponseEntity.ok(service.update(id, producto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar producto")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "NO CONTENT - Producto eliminado"),
            @ApiResponse(responseCode = "404", description = "NOT FOUND - Producto no encontrado",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ErrorResponseDTO.class)))
    })
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
