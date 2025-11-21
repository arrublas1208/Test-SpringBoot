package com.logitrack.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class JwtResponse {
    private String accessToken;
    private String username;
    private String rol;
    private Long id;
    private String empId;
    private String nombreCompleto;
}