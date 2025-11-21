package com.logitrack.model;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "auditoria")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Auditoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "operacion", nullable = false)
    private Operacion operacion;

    @Column(name = "fecha", nullable = false)
    private LocalDateTime fecha = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    @JsonIgnore
    private Usuario usuario;

    @Column(name = "entidad", nullable = false)
    private String entidad;

    @Column(name = "entidad_id", nullable = false)
    private Long entidadId;

    @Lob
    @Column(name = "valores_anteriores")
    private String valoresAnteriores;

    @Lob
    @Column(name = "valores_nuevos")
    private String valoresNuevos;

    public enum Operacion {
        INSERT,
        UPDATE,
        DELETE
    }

    private static final ObjectMapper mapper = new ObjectMapper();

    public void setValoresAnteriores(Object obj) {
        try {
            this.valoresAnteriores = (obj == null) ? null : mapper.writeValueAsString(obj);
        } catch (Exception e) {
            this.valoresAnteriores = "{}";
        }
    }

    public void setValoresNuevos(Object obj) {
        try {
            this.valoresNuevos = (obj == null) ? null : mapper.writeValueAsString(obj);
        } catch (Exception e) {
            this.valoresNuevos = "{}";
        }
    }
}