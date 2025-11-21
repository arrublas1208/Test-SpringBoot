package com.logitrack.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import com.logitrack.config.AuditoriaListener;
import com.logitrack.model.Empresa;

@Entity
@Table(name = "bodega")
@EntityListeners(AuditoriaListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bodega {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 100)
    @Column(unique = true, nullable = false)
    private String nombre;

    @NotBlank
    @Size(max = 150)
    @Column(nullable = false)
    private String ubicacion;

    @NotNull
    @Min(1)
    @Column(nullable = false)
    private Integer capacidad;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "bodega_encargado",
        joinColumns = @JoinColumn(name = "bodega_id"),
        inverseJoinColumns = @JoinColumn(name = "encargado_id")
    )
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"password", "empresa", "email", "cedula", "hibernateLazyInitializer", "handler"})
    @Builder.Default
    private java.util.List<Usuario> encargados = new java.util.ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Empresa empresa;
}
