package com.logitrack.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.logitrack.config.AuditoriaListener;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "movimiento")
@EntityListeners(AuditoriaListener.class)
@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@NoArgsConstructor
@AllArgsConstructor
public class Movimiento {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @Column(nullable = false)
    private LocalDateTime fecha;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @NotNull
    private TipoMovimiento tipo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    @NotNull
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bodega_origen_id")
    private Bodega bodegaOrigen;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bodega_destino_id")
    private Bodega bodegaDestino;

    @OneToMany(mappedBy = "movimiento", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<MovimientoDetalle> detalles = new ArrayList<>();

    @Column(length = 500)
    private String observaciones;

    public enum TipoMovimiento {
        ENTRADA,      // Ingreso de mercancía a una bodega (proveedor → bodega)
        SALIDA,       // Salida de mercancía de una bodega (bodega → cliente/venta)
        TRANSFERENCIA // Transferencia entre bodegas (bodega → bodega)
    }

    @PrePersist
    protected void onCreate() {
        if (this.fecha == null) {
            this.fecha = LocalDateTime.now();
        }
    }

    // Métodos de utilidad
    public void addDetalle(MovimientoDetalle detalle) {
        detalles.add(detalle);
        detalle.setMovimiento(this);
    }

    public void removeDetalle(MovimientoDetalle detalle) {
        detalles.remove(detalle);
        detalle.setMovimiento(null);
    }

    public boolean isEntrada() {
        return this.tipo == TipoMovimiento.ENTRADA;
    }

    public boolean isSalida() {
        return this.tipo == TipoMovimiento.SALIDA;
    }

    public boolean isTransferencia() {
        return this.tipo == TipoMovimiento.TRANSFERENCIA;
    }
}
