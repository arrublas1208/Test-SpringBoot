package com.logitrack.test;

package com.logitrack.service;

import com.logitrack.dto.ReporteResumen;
import com.logitrack.model.MovimientoDetalle;
import com.logitrack.model.Producto;
import com.logitrack.repository.BodegaRepository;
import com.logitrack.repository.MovimientoDetalleRepository;
import com.logitrack.repository.ProductoRepository;
import com.logitrack.repository.InventarioBodegaRepository;
import com.logitrack.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

import java.util.List;
import java.util.Map;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReporteService {

    private final ProductoRepository productoRepository;
    private final MovimientoDetalleRepository detalleRepository;
    private final BodegaRepository bodegaRepository;
    private final InventarioBodegaRepository inventarioBodegaRepository;
    private final com.logitrack.repository.UsuarioRepository usuarioRepository;
    private final com.logitrack.repository.MovimientoRepository movimientoRepository;



    private Long currentEmpresaId() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        String username = auth != null ? auth.getName() : null;
        if (username == null) return null;
        return usuarioRepository.findByUsername(username).map(u -> u.getEmpresa().getId()).orElse(null);
    }

    public ReporteResumen generarResumen() {
        return generarResumen(defaultThreshold);
    }


}