package com.logitrack.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDateTime;
import com.logitrack.config.AuditoriaListener;

@Entity
@Table(name = "inventario_bodega",
       uniqueConstraints = @UniqueConstraint(columnNames = {"bodega_id", "producto_id"}))
@EntityListeners(AuditoriaListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventarioBodega {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "bodega_id", nullable = false)
    @NotNull
    private Bodega bodega;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "producto_id", nullable = false)
    @NotNull
    private Producto producto;

    @Min(0)
    @Column(nullable = false)
    @Builder.Default
    private Integer stock = 0;

    @Min(0)
    @Column(name = "stock_minimo", nullable = false)
    @Builder.Default
    private Integer stockMinimo = 10;

    @Min(0)
    @Column(name = "stock_maximo", nullable = false)
    @Builder.Default
    private Integer stockMaximo = 1000;

    @Column(name = "ultima_actualizacion", nullable = false)
    private LocalDateTime ultimaActualizacion;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        this.ultimaActualizacion = LocalDateTime.now();
    }

    // Métodos de utilidad
    public boolean isStockBajo() {
        return this.stock <= this.stockMinimo;
    }

    public boolean isStockAlto() {
        return this.stock >= this.stockMaximo;
    }

    public int getEspacioDisponible() {
        return this.stockMaximo - this.stock;
    }

    public int getDeficitStock() {
        return Math.max(0, this.stockMinimo - this.stock);
    }
}
