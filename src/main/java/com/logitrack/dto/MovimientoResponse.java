package com.logitrack.dto;

import com.logitrack.model.Movimiento;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MovimientoResponse {

    private Long id;
    private LocalDateTime fecha;
    private Movimiento.TipoMovimiento tipo;
    private String usuario;
    private String bodegaOrigen;
    private String bodegaDestino;
    private List<DetalleResponse> detalles;
    private String observaciones;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DetalleResponse {
        private Long id;
        private String producto;
        private Integer cantidad;
    }
}
