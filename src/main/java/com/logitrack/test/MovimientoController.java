package com.logitrack.test;
import com.logitrack.dto.MovimientoRequest;
import com.logitrack.dto.MovimientoDto;
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
@GetMappping("api/movimientos/recientes")
@Tag(name = "Movimientos", description = "Gestión de Movimientos de Inventario (Entrada/Salida/Transferencia)")
public class MovimientoController {
    private final MovimientoService service;

    @GetMapping
    @Operation(summary = "Obtener los ultimos 10 movimientos")
    @ApiResponses({
        @ApiResponse (responseCode = "200", description "OK - Lista Movimientos",
            content = @Content(mediaType = "application/json",
                schema = @Schema(implementation = MovimientoDto.class)))
    })
    public ResponseEntity<List<MovimientoDto>> getAll() {
        return ResponseEntity.ok(service.findAll())
    }
}