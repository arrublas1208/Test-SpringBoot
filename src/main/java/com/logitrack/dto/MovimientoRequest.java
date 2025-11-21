package com.logitrack.dto;

import com.logitrack.model.Movimiento;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MovimientoRequest {

    @NotNull(message = "El tipo de movimiento es obligatorio")
    private Movimiento.TipoMovimiento tipo;

    @NotNull(message = "El ID del usuario es obligatorio")
    private Long usuarioId;

    // Para SALIDA y TRANSFERENCIA
    private Long bodegaOrigenId;

    // Para ENTRADA y TRANSFERENCIA
    private Long bodegaDestinoId;

    @NotEmpty(message = "Debe incluir al menos un producto")
    @Valid
    private List<DetalleRequest> detalles;

    @Size(max = 500, message = "Las observaciones no pueden exceder 500 caracteres")
    private String observaciones;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DetalleRequest {
        @NotNull(message = "El ID del producto es obligatorio")
        private Long productoId;

        @Min(value = 1, message = "La cantidad debe ser al menos 1")
        @NotNull(message = "La cantidad es obligatoria")
        private Integer cantidad;
    }
}
