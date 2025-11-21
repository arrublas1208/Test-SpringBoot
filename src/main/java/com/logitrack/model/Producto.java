package com.logitrack.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import com.logitrack.config.AuditoriaListener;
import java.math.BigDecimal;
import com.logitrack.model.Empresa;

@Entity
@Table(name = "producto")
@EntityListeners(AuditoriaListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Producto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 100)
    @Column(unique = true, nullable = false)
    private String nombre;

    @NotBlank
    @Size(max = 50)
    @Column(nullable = false)
    private String categoria;

    @NotNull
    @Min(0)
    @Column(nullable = false)
    @Builder.Default
    private Integer stock = 0;

    @NotNull
    @DecimalMin("0.01")
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal precio;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Empresa empresa;
}
