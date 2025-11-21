package com.logitrack.dto;

import com.logitrack.model.Producto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReporteResumen {

    private List<StockPorBodega> stockPorBodega;
    private List<ProductoMovido> productosMasMovidos;
    private List<Producto> stockBajo;
    private List<CategoriaResumen> resumenPorCategoria;
    @Schema(description = "Umbral aplicado para considerar stock bajo", example = "10")
    private Integer threshold;
    @Schema(description = "Límite máximo permitido para el umbral", example = "1000")
    private Integer maxThreshold;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StockPorBodega {
        private String bodega;
        private Integer totalProductos;
        private BigDecimal valorTotal;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductoMovido {
        private String nombre;
        private Integer movimientos;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoriaResumen {
        private String categoria;
        private Integer stockTotal;
        private BigDecimal valorTotal;
    }
}