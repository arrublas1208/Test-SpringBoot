package com.logitrack.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;
import java.util.Map;

@Schema(description = "Formato estándar de errores de la API")
public class ErrorResponseDTO {

    @Schema(description = "Código del tipo de error", example = "BUSINESS_ERROR")
    private String code;

    @Schema(description = "Detalles del error por campo o mensaje", example = "{\"message\": \"El parámetro 'threshold' no debe ser mayor a 1000\"}")
    private Map<String, String> details;

    @Schema(description = "Marca de tiempo del error", example = "2025-11-10T12:34:56")
    private LocalDateTime timestamp;

    public ErrorResponseDTO() {}

    public ErrorResponseDTO(String code, Map<String, String> details, LocalDateTime timestamp) {
        this.code = code;
        this.details = details;
        this.timestamp = timestamp;
    }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public Map<String, String> getDetails() { return details; }
    public void setDetails(Map<String, String> details) { this.details = details; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}