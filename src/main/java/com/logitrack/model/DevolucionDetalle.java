package com.logitrack.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

@Entity
@Table(name = "devolucion_detalle")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DevolucionDetalle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "devolucion_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Devolucion devolucion;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "lote_id")
    private Lote lote;

    @Min(1)
    @Column(nullable = false)
    private Integer cantidad;

    @Size(max = 200)
    private String motivo;
}
