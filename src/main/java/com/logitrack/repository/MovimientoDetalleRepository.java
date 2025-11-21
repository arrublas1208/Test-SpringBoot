package com.logitrack.repository;

import com.logitrack.model.MovimientoDetalle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MovimientoDetalleRepository extends JpaRepository<MovimientoDetalle, Long> {

    // Buscar detalles por movimiento
    List<MovimientoDetalle> findByMovimientoId(Long movimientoId);

    // Buscar detalles por producto
    List<MovimientoDetalle> findByProductoId(Long productoId);

    // Productos más movidos
    @Query("SELECT d.producto.id, d.producto.nombre, SUM(d.cantidad) as total " +
           "FROM MovimientoDetalle d " +
           "GROUP BY d.producto.id, d.producto.nombre " +
           "ORDER BY total DESC")
    List<Object[]> findProductosMasMovidos();

    // Total de cantidad movida de un producto
    @Query("SELECT COALESCE(SUM(d.cantidad), 0) FROM MovimientoDetalle d WHERE d.producto.id = :productoId")
    Integer getTotalCantidadMovida(@Param("productoId") Long productoId);
}
