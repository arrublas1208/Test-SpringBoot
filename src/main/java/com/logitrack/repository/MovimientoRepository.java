package com.logitrack.repository;

import com.logitrack.model.Movimiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MovimientoRepository extends JpaRepository<Movimiento, Long> {

    // Buscar por tipo de movimiento
    List<Movimiento> findByTipo(Movimiento.TipoMovimiento tipo);

    // Buscar por bodega origen
    List<Movimiento> findByBodegaOrigenId(Long bodegaId);

    // Buscar por bodega destino
    List<Movimiento> findByBodegaDestinoId(Long bodegaId);

    // Buscar por usuario
    List<Movimiento> findByUsuarioId(Long usuarioId);

    // Buscar por rango de fechas
    List<Movimiento> findByFechaBetween(LocalDateTime inicio, LocalDateTime fin);

    // Movimientos de una bodega (origen o destino)
    @Query("SELECT m FROM Movimiento m WHERE m.bodegaOrigen.id = :bodegaId OR m.bodegaDestino.id = :bodegaId")
    List<Movimiento> findByBodegaOrigenOrDestino(@Param("bodegaId") Long bodegaId);

    // Últimos movimientos
    List<Movimiento> findTop10ByOrderByFechaDesc();

    // Movimientos de entrada a una bodega específica
    @Query("SELECT m FROM Movimiento m WHERE m.tipo = 'ENTRADA' AND m.bodegaDestino.id = :bodegaId ORDER BY m.fecha DESC")
    List<Movimiento> findEntradasByBodega(@Param("bodegaId") Long bodegaId);

    // Movimientos de salida de una bodega específica
    @Query("SELECT m FROM Movimiento m WHERE m.tipo = 'SALIDA' AND m.bodegaOrigen.id = :bodegaId ORDER BY m.fecha DESC")
    List<Movimiento> findSalidasByBodega(@Param("bodegaId") Long bodegaId);

    // Transferencias desde una bodega
    @Query("SELECT m FROM Movimiento m WHERE m.tipo = 'TRANSFERENCIA' AND m.bodegaOrigen.id = :bodegaId ORDER BY m.fecha DESC")
    List<Movimiento> findTransferenciasDesde(@Param("bodegaId") Long bodegaId);

    // Transferencias hacia una bodega
    @Query("SELECT m FROM Movimiento m WHERE m.tipo = 'TRANSFERENCIA' AND m.bodegaDestino.id = :bodegaId ORDER BY m.fecha DESC")
    List<Movimiento> findTransferenciasHacia(@Param("bodegaId") Long bodegaId);

    // ------ Filtros por empresa (via usuario.empresa) ------
    List<Movimiento> findByUsuarioEmpresaId(Long empresaId);

    List<Movimiento> findByTipoAndUsuarioEmpresaId(Movimiento.TipoMovimiento tipo, Long empresaId);

    List<Movimiento> findByFechaBetweenAndUsuarioEmpresaId(LocalDateTime inicio, LocalDateTime fin, Long empresaId);

    @Query("SELECT m FROM Movimiento m WHERE (m.bodegaOrigen.id = :bodegaId OR m.bodegaDestino.id = :bodegaId) AND m.usuario.empresa.id = :empresaId")
    List<Movimiento> findByBodegaOrigenOrDestinoAndEmpresa(@Param("bodegaId") Long bodegaId, @Param("empresaId") Long empresaId);

    List<Movimiento> findTop10ByUsuarioEmpresaIdOrderByFechaDesc(Long empresaId);
}
