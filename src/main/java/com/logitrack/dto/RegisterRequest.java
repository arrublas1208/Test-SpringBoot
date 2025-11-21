package com.logitrack.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank
    @Size(min = 3, max = 50, message = "El nombre de usuario debe tener entre 3 y 50 caracteres")
    private String username;

    @NotBlank
    @Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&+\\-=\\[\\]{}();':\"\\\\|,.<>/?])[A-Za-z\\d@$!%*?&+\\-=\\[\\]{}();':\"\\\\|,.<>/?]{8,}$",
        message = "La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial"
    )
    private String password;
    private String rol;
    @NotBlank
    private String nombreCompleto;
    @Email
    @NotBlank
    private String email;
    @NotBlank
    private String cedula;
    private String empId; // ID de empleado dentro de la empresa
    private String empresaNombre;
}