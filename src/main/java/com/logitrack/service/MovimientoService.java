package com.logitrack.service;

import com.logitrack.dto.MovimientoRequest;
import com.logitrack.dto.MovimientoResponse;
import com.logitrack.exception.BusinessException;
import com.logitrack.exception.ResourceNotFoundException;
import com.logitrack.model.*;
import com.logitrack.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class MovimientoService {

    private final MovimientoRepository movimientoRepository;
    private final MovimientoDetalleRepository detalleRepository;
    private final UsuarioRepository usuarioRepository;
    private final BodegaRepository bodegaRepository;
    private final ProductoRepository productoRepository;
    private final InventarioBodegaRepository inventarioBodegaRepository;

    private Long currentEmpresaId() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        String username = auth != null ? auth.getName() : null;
        if (username == null) return null;
        return usuarioRepository.findByUsername(username).map(u -> u.getEmpresa().getId()).orElse(null);
    }

    public List<MovimientoResponse> findAll() {
        Long empresaId = currentEmpresaId();
        java.util.List<Movimiento> lista = (empresaId != null)
                ? movimientoRepository.findByUsuarioEmpresaId(empresaId)
                : movimientoRepository.findAll();
        return lista.stream().map(this::toResponse).collect(Collectors.toList());
    }

    public MovimientoResponse findById(Long id) {
        Long empresaId = currentEmpresaId();
        Movimiento movimiento = movimientoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Movimiento no encontrado: " + id));
        if (empresaId != null) {
            if (movimiento.getUsuario() == null || movimiento.getUsuario().getEmpresa() == null || !movimiento.getUsuario().getEmpresa().getId().equals(empresaId)) {
                throw new BusinessException("Acceso denegado a movimiento de otra empresa");
            }
        }
        return toResponse(movimiento);
    }

    public List<MovimientoResponse> findByTipo(Movimiento.TipoMovimiento tipo) {
        Long empresaId = currentEmpresaId();
        java.util.List<Movimiento> lista = (empresaId != null)
                ? movimientoRepository.findByTipoAndUsuarioEmpresaId(tipo, empresaId)
                : movimientoRepository.findByTipo(tipo);
        return lista.stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<MovimientoResponse> findByBodega(Long bodegaId) {
        if (!bodegaRepository.existsById(bodegaId)) {
            throw new ResourceNotFoundException("Bodega no encontrada: " + bodegaId);
        }
        Long empresaId = currentEmpresaId();
        if (empresaId != null) {
            Bodega b = bodegaRepository.findById(bodegaId).orElseThrow(() -> new ResourceNotFoundException("Bodega no encontrada: " + bodegaId));
            if (b.getEmpresa() == null || !b.getEmpresa().getId().equals(empresaId)) {
                throw new BusinessException("Acceso denegado a bodega de otra empresa");
            }
            return movimientoRepository.findByBodegaOrigenOrDestinoAndEmpresa(bodegaId, empresaId).stream()
                    .map(this::toResponse)
                    .collect(Collectors.toList());
        }
        return movimientoRepository.findByBodegaOrigenOrDestino(bodegaId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<MovimientoResponse> findByUsuario(Long usuarioId) {
        if (!usuarioRepository.existsById(usuarioId)) {
            throw new ResourceNotFoundException("Usuario no encontrado: " + usuarioId);
        }
        Long empresaId = currentEmpresaId();
        if (empresaId != null) {
            com.logitrack.model.Usuario u = usuarioRepository.findById(usuarioId).orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + usuarioId));
            if (u.getEmpresa() == null || !u.getEmpresa().getId().equals(empresaId)) {
                throw new BusinessException("Acceso denegado a usuario de otra empresa");
            }
        }
        return movimientoRepository.findByUsuarioId(usuarioId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<MovimientoResponse> findByFechas(LocalDateTime inicio, LocalDateTime fin) {
        Long empresaId = currentEmpresaId();
        java.util.List<Movimiento> lista = (empresaId != null)
                ? movimientoRepository.findByFechaBetweenAndUsuarioEmpresaId(inicio, fin, empresaId)
                : movimientoRepository.findByFechaBetween(inicio, fin);
        return lista.stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<MovimientoResponse> search(Movimiento.TipoMovimiento tipo,
                                           Long usuarioId,
                                           Long bodegaId,
                                           LocalDateTime inicio,
                                           LocalDateTime fin) {
        Long empresaId = currentEmpresaId();
        List<Movimiento> base = (tipo != null)
                ? movimientoRepository.findByTipoAndUsuarioEmpresaId(tipo, empresaId)
                : movimientoRepository.findByUsuarioEmpresaId(empresaId);

        if (usuarioId != null) {
            com.logitrack.model.Usuario u = usuarioRepository.findById(usuarioId)
                    .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + usuarioId));
            if (u.getEmpresa() == null || !u.getEmpresa().getId().equals(empresaId)) {
                throw new BusinessException("Acceso denegado a usuario de otra empresa");
            }
            base = base.stream().filter(m -> m.getUsuario() != null && usuarioId.equals(m.getUsuario().getId())).collect(java.util.stream.Collectors.toList());
        }

        if (bodegaId != null) {
            Bodega b = bodegaRepository.findById(bodegaId)
                    .orElseThrow(() -> new ResourceNotFoundException("Bodega no encontrada: " + bodegaId));
            if (b.getEmpresa() == null || !b.getEmpresa().getId().equals(empresaId)) {
                throw new BusinessException("Acceso denegado a bodega de otra empresa");
            }
            base = base.stream().filter(m -> {
                Long origenId = m.getBodegaOrigen() != null ? m.getBodegaOrigen().getId() : null;
                Long destinoId = m.getBodegaDestino() != null ? m.getBodegaDestino().getId() : null;
                return (origenId != null && bodegaId.equals(origenId)) || (destinoId != null && bodegaId.equals(destinoId));
            }).collect(java.util.stream.Collectors.toList());
        }

        if (inicio != null || fin != null) {
            base = base.stream().filter(m -> {
                if (inicio != null && m.getFecha().isBefore(inicio)) return false;
                if (fin != null && m.getFecha().isAfter(fin)) return false;
                return true;
            }).collect(java.util.stream.Collectors.toList());
        }

        return base.stream().map(this::toResponse).collect(Collectors.toList());
    }

    public MovimientoResponse create(MovimientoRequest request) {
        log.info("Creando movimiento tipo: {}", request.getTipo());

        Long empresaIdFromAuth = currentEmpresaId();

        // Validar usuario
        Usuario usuario = usuarioRepository.findById(request.getUsuarioId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + request.getUsuarioId()));
        Long empresaId = (empresaIdFromAuth != null) ? empresaIdFromAuth : (usuario.getEmpresa() != null ? usuario.getEmpresa().getId() : null);

        // Validar bodegas según tipo de movimiento
        Bodega bodegaOrigen = null;
        Bodega bodegaDestino = null;

        switch (request.getTipo()) {
            case ENTRADA:
                if (request.getBodegaDestinoId() == null) {
                    throw new BusinessException("Para movimiento de ENTRADA debe especificar bodega destino");
                }
                if (request.getBodegaOrigenId() != null) {
                    throw new BusinessException("Para movimiento de ENTRADA no debe especificar bodega origen");
                }
                bodegaDestino = bodegaRepository.findById(request.getBodegaDestinoId())
                        .orElseThrow(() -> new ResourceNotFoundException("Bodega destino no encontrada"));
                if (bodegaDestino.getEmpresa() != null && !bodegaDestino.getEmpresa().getId().equals(empresaId)) {
                    throw new BusinessException("Bodega destino pertenece a otra empresa");
                }
                break;

            case SALIDA:
                if (request.getBodegaOrigenId() == null) {
                    throw new BusinessException("Para movimiento de SALIDA debe especificar bodega origen");
                }
                if (request.getBodegaDestinoId() != null) {
                    throw new BusinessException("Para movimiento de SALIDA no debe especificar bodega destino");
                }
                bodegaOrigen = bodegaRepository.findById(request.getBodegaOrigenId())
                        .orElseThrow(() -> new ResourceNotFoundException("Bodega origen no encontrada"));
                if (bodegaOrigen.getEmpresa() != null && !bodegaOrigen.getEmpresa().getId().equals(empresaId)) {
                    throw new BusinessException("Bodega origen pertenece a otra empresa");
                }
                break;

            case TRANSFERENCIA:
                if (request.getBodegaOrigenId() == null || request.getBodegaDestinoId() == null) {
                    throw new BusinessException("Para movimiento de TRANSFERENCIA debe especificar bodega origen y destino");
                }
                if (request.getBodegaOrigenId().equals(request.getBodegaDestinoId())) {
                    throw new BusinessException("La bodega origen y destino no pueden ser la misma");
                }
                bodegaOrigen = bodegaRepository.findById(request.getBodegaOrigenId())
                        .orElseThrow(() -> new ResourceNotFoundException("Bodega origen no encontrada"));
                bodegaDestino = bodegaRepository.findById(request.getBodegaDestinoId())
                        .orElseThrow(() -> new ResourceNotFoundException("Bodega destino no encontrada"));
                if ((bodegaOrigen.getEmpresa() != null && !bodegaOrigen.getEmpresa().getId().equals(empresaId)) ||
                    (bodegaDestino.getEmpresa() != null && !bodegaDestino.getEmpresa().getId().equals(empresaId))) {
                    throw new BusinessException("Las bodegas deben pertenecer a la empresa actual");
                }
                break;
        }

        // Crear movimiento
        Movimiento movimiento = new Movimiento();
        movimiento.setFecha(LocalDateTime.now());
        movimiento.setTipo(request.getTipo());
        movimiento.setUsuario(usuario);
        movimiento.setBodegaOrigen(bodegaOrigen);
        movimiento.setBodegaDestino(bodegaDestino);
        movimiento.setObservaciones(request.getObservaciones());

        // Validar y crear detalles
        java.util.Set<Long> productosVistos = new java.util.HashSet<>();
        java.util.List<MovimientoDetalle> detallesCreados = new java.util.ArrayList<>();
        for (MovimientoRequest.DetalleRequest detalleReq : request.getDetalles()) {
            if (!productosVistos.add(detalleReq.getProductoId())) {
                throw new BusinessException("Producto duplicado en detalles: " + detalleReq.getProductoId());
            }
            Producto producto = productoRepository.findById(detalleReq.getProductoId())
                    .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado: " + detalleReq.getProductoId()));
            if (producto.getEmpresa() != null && !producto.getEmpresa().getId().equals(empresaId)) {
                throw new BusinessException("Producto pertenece a otra empresa");
            }

            // Validar stock para SALIDA y TRANSFERENCIA
            if (request.getTipo() == Movimiento.TipoMovimiento.SALIDA ||
                request.getTipo() == Movimiento.TipoMovimiento.TRANSFERENCIA) {
                validarStockDisponible(bodegaOrigen, producto, detalleReq.getCantidad());
            }

            MovimientoDetalle detalle = new MovimientoDetalle();
            detalle.setProducto(producto);
            detalle.setCantidad(detalleReq.getCantidad());
            detallesCreados.add(detalle);
        }

        // Guardar movimiento (cascade guardará los detalles)
        try {
            Movimiento saved = movimientoRepository.save(movimiento);

            for (MovimientoDetalle d : detallesCreados) {
                d.setMovimiento(saved);
                detalleRepository.save(d);
            }

            // Actualizar inventario
            actualizarInventario(saved);

            log.info("Movimiento creado exitosamente: ID={}", saved.getId());
            return toResponse(saved);
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            throw new BusinessException("Violación de integridad de datos al registrar movimiento: " + ex.getMostSpecificCause().getMessage());
        } catch (RuntimeException ex) {
            throw new BusinessException("Error al registrar movimiento: " + String.valueOf(ex.getMessage()));
        } catch (Exception ex) {
            throw new BusinessException("Error inesperado al registrar movimiento");
        }
        
    }

    // Compatibilidad con especificación del documento (alias de create)
    public MovimientoResponse registrar(MovimientoRequest request) {
        return create(request);
    }

    private void validarStockDisponible(Bodega bodega, Producto producto, Integer cantidadRequerida) {
        InventarioBodega inventario = inventarioBodegaRepository
                .findByBodegaIdAndProductoId(bodega.getId(), producto.getId())
                .orElseThrow(() -> new BusinessException(
                        String.format("❌ El producto '%s' no existe en la BODEGA DE ORIGEN '%s'. Debe crear primero el inventario para este producto en esa bodega.",
                                producto.getNombre(), bodega.getNombre())));

        if (inventario.getStock() < cantidadRequerida) {
            throw new BusinessException(
                    String.format("❌ Stock insuficiente de '%s' en BODEGA DE ORIGEN '%s'. Disponible: %d, Requerido: %d",
                            producto.getNombre(), bodega.getNombre(), inventario.getStock(), cantidadRequerida));
        }
    }

    private void actualizarInventario(Movimiento movimiento) {
        log.info("Actualizando inventario para movimiento ID: {}", movimiento.getId());

        for (MovimientoDetalle detalle : movimiento.getDetalles()) {
            switch (movimiento.getTipo()) {
                case ENTRADA:
                    // Incrementar stock en bodega destino
                    ajustarInventario(movimiento.getBodegaDestino(), detalle.getProducto(), detalle.getCantidad());
                    log.info("ENTRADA: +{} {} a bodega {}",
                            detalle.getCantidad(), detalle.getProducto().getNombre(), movimiento.getBodegaDestino().getNombre());
                    break;

                case SALIDA:
                    // Decrementar stock en bodega origen
                    ajustarInventario(movimiento.getBodegaOrigen(), detalle.getProducto(), -detalle.getCantidad());
                    log.info("SALIDA: -{} {} de bodega {}",
                            detalle.getCantidad(), detalle.getProducto().getNombre(), movimiento.getBodegaOrigen().getNombre());
                    break;

                case TRANSFERENCIA:
                    // Decrementar en origen
                    ajustarInventario(movimiento.getBodegaOrigen(), detalle.getProducto(), -detalle.getCantidad());
                    // Incrementar en destino
                    ajustarInventario(movimiento.getBodegaDestino(), detalle.getProducto(), detalle.getCantidad());
                    log.info("TRANSFERENCIA: {} {} de bodega {} a bodega {}",
                            detalle.getCantidad(), detalle.getProducto().getNombre(),
                            movimiento.getBodegaOrigen().getNombre(), movimiento.getBodegaDestino().getNombre());
                    break;
            }
        }
    }

    private void ajustarInventario(Bodega bodega, Producto producto, Integer ajuste) {
        if (bodega == null) {
            throw new BusinessException("Bodega requerida para ajustar inventario");
        }
        if (producto == null) {
            throw new BusinessException("Producto requerido para ajustar inventario");
        }
        InventarioBodega inventario = inventarioBodegaRepository
                .findByBodegaIdAndProductoId(bodega.getId(), producto.getId())
                .orElseGet(() -> {
                    // Si no existe inventario, crear uno nuevo (útil para ENTRADA y TRANSFERENCIA)
                    log.info("✅ Creando automáticamente nuevo inventario para producto '{}' en bodega de DESTINO '{}'",
                            producto.getNombre(), bodega.getNombre());
                    InventarioBodega inv = new InventarioBodega();
                    inv.setBodega(bodega);
                    inv.setProducto(producto);
                    inv.setStock(0);
                    inv.setStockMinimo(10);
                    inv.setStockMaximo(1000);
                    return inv;
                });

        int stockAnterior = inventario.getStock();
        int nuevoStock = stockAnterior + ajuste;

        if (nuevoStock < 0) {
            throw new BusinessException(
                    String.format("❌ Stock no puede ser negativo para producto '%s' en bodega '%s'. Stock actual: %d, Intento de ajuste: %d",
                            producto.getNombre(), bodega.getNombre(), stockAnterior, ajuste));
        }

        if (nuevoStock > inventario.getStockMaximo()) {
            throw new BusinessException(
                    String.format("❌ Stock excede el máximo permitido (%d) para producto '%s' en bodega '%s'. Stock resultante sería: %d",
                            inventario.getStockMaximo(), producto.getNombre(), bodega.getNombre(), nuevoStock));
        }

        inventario.setStock(nuevoStock);
        inventarioBodegaRepository.save(inventario);

        log.info("✅ Stock actualizado: Producto '{}' en bodega '{}' → Antes: {}, Ajuste: {}{}, Después: {}",
                producto.getNombre(), bodega.getNombre(),
                stockAnterior, (ajuste > 0 ? "+" : ""), ajuste, nuevoStock);
    }

    private MovimientoResponse toResponse(Movimiento movimiento) {
        java.util.List<MovimientoDetalle> detalles = movimiento.getDetalles();
        if (detalles == null || detalles.isEmpty()) {
            detalles = detalleRepository.findByMovimientoId(movimiento.getId());
        }
        return MovimientoResponse.builder()
                .id(movimiento.getId())
                .fecha(movimiento.getFecha())
                .tipo(movimiento.getTipo())
                .usuario(movimiento.getUsuario().getNombreCompleto())
                .bodegaOrigen(movimiento.getBodegaOrigen() != null ? movimiento.getBodegaOrigen().getNombre() : null)
                .bodegaDestino(movimiento.getBodegaDestino() != null ? movimiento.getBodegaDestino().getNombre() : null)
                .detalles(detalles.stream()
                        .map(d -> MovimientoResponse.DetalleResponse.builder()
                                .id(d.getId())
                                .producto(d.getProducto().getNombre())
                                .cantidad(d.getCantidad())
                                .build())
                        .collect(Collectors.toList()))
                .observaciones(movimiento.getObservaciones())
                .build();
    }

    // Método de apoyo público para reusar el mapeo desde otros controladores
    public MovimientoResponse toResponsePublic(Movimiento movimiento) {
        return toResponse(movimiento);
    }

    public List<MovimientoResponse> findUltimos() {
        Long empresaId = currentEmpresaId();
        java.util.List<Movimiento> lista = (empresaId != null)
                ? movimientoRepository.findTop10ByUsuarioEmpresaIdOrderByFechaDesc(empresaId)
                : movimientoRepository.findTop10ByOrderByFechaDesc();
        return lista.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public void delete(Long id) {
        Long empresaId = currentEmpresaId();
        Movimiento movimiento = movimientoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Movimiento no encontrado: " + id));
        if (empresaId != null) {
            if (movimiento.getUsuario() == null || movimiento.getUsuario().getEmpresa() == null || !movimiento.getUsuario().getEmpresa().getId().equals(empresaId)) {
                throw new BusinessException("Acceso denegado a movimiento de otra empresa");
            }
        }
        movimientoRepository.deleteById(id);
        log.warn("Movimiento eliminado: ID={}. El inventario NO se revirtió.", id);
    }
}
