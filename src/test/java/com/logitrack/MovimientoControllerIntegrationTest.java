package com.logitrack;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
class MovimientoControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void crearEntradaDebeResponder201() throws Exception {
        String payload = "{\n" +
                "  \"tipo\": \"ENTRADA\",\n" +
                "  \"usuarioId\": 1,\n" +
                "  \"bodegaDestinoId\": 1,\n" +
                "  \"detalles\": [ { \"productoId\": 1, \"cantidad\": 1 } ],\n" +
                "  \"observaciones\": \"Test ENTRADA\"\n" +
                "}";

        mockMvc.perform(post("/api/movimientos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tipo").value("ENTRADA"))
                .andExpect(jsonPath("$.bodegaDestino").value("Bodega Central"))
                .andExpect(jsonPath("$.detalles[0].producto").value("Laptop Dell"));
    }

    @Test
    void salidaConStockInsuficienteDebeResponder400() throws Exception {
        String payload = "{\n" +
                "  \"tipo\": \"SALIDA\",\n" +
                "  \"usuarioId\": 1,\n" +
                "  \"bodegaOrigenId\": 1,\n" +
                "  \"detalles\": [ { \"productoId\": 1, \"cantidad\": 9999 } ],\n" +
                "  \"observaciones\": \"Test SALIDA insuficiente\"\n" +
                "}";

        mockMvc.perform(post("/api/movimientos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BUSINESS_ERROR"))
                .andExpect(jsonPath("$.details.message").exists());
    }

    @Test
    void transferenciaMismaBodegaDebeResponder400() throws Exception {
        String payload = "{\n" +
                "  \"tipo\": \"TRANSFERENCIA\",\n" +
                "  \"usuarioId\": 1,\n" +
                "  \"bodegaOrigenId\": 1,\n" +
                "  \"bodegaDestinoId\": 1,\n" +
                "  \"detalles\": [ { \"productoId\": 1, \"cantidad\": 1 } ],\n" +
                "  \"observaciones\": \"Test TRANSFERENCIA misma bodega\"\n" +
                "}";

        mockMvc.perform(post("/api/movimientos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BUSINESS_ERROR"))
                .andExpect(jsonPath("$.details.message").value("La bodega origen y destino no pueden ser la misma"));
    }

    @Test
    void detallesDuplicadosDebeResponder400() throws Exception {
        String payload = "{\n" +
                "  \"tipo\": \"ENTRADA\",\n" +
                "  \"usuarioId\": 1,\n" +
                "  \"bodegaDestinoId\": 1,\n" +
                "  \"detalles\": [ { \"productoId\": 1, \"cantidad\": 1 }, { \"productoId\": 1, \"cantidad\": 2 } ],\n" +
                "  \"observaciones\": \"Test duplicados\"\n" +
                "}";

        mockMvc.perform(post("/api/movimientos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BUSINESS_ERROR"));
    }

    @Test
    void entradaExcedeStockMaximoDebeResponder400() throws Exception {
        String payload = "{\n" +
                "  \"tipo\": \"ENTRADA\",\n" +
                "  \"usuarioId\": 1,\n" +
                "  \"bodegaDestinoId\": 1,\n" +
                "  \"detalles\": [ { \"productoId\": 1, \"cantidad\": 80 } ],\n" +
                "  \"observaciones\": \"Test ENTRADA excede max\"\n" +
                "}";

        mockMvc.perform(post("/api/movimientos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BUSINESS_ERROR"));
    }

    @Test
    void buscarMovimientosPorTipoDebeResponder200() throws Exception {
        mockMvc.perform(get("/api/movimientos/search").param("tipo", "ENTRADA"))
                .andExpect(status().isOk());
    }
}