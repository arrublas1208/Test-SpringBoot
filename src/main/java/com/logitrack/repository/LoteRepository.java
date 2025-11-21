package com.logitrack.repository;

import com.logitrack.model.Lote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface LoteRepository extends JpaRepository<Lote, Long> {
    List<Lote> findByProductoId(Long productoId);
    List<Lote> findByBodegaId(Long bodegaId);
    List<Lote> findByProveedorId(Long proveedorId);
    List<Lote> findByOrdenCompraId(Long ordenCompraId);
    Optional<Lote> findByNumeroLoteAndProductoIdAndBodegaId(String numeroLote, Long productoId, Long bodegaId);

    @Query("SELECT l FROM Lote l WHERE l.bodega.empresa.id = ?1 AND l.fechaVencimiento < ?2 AND l.cantidad > 0")
    List<Lote> findVencidos(Long empresaId, LocalDate fecha);

    @Query("SELECT l FROM Lote l WHERE l.bodega.empresa.id = ?1 AND l.fechaVencimiento BETWEEN ?2 AND ?3 AND l.cantidad > 0")
    List<Lote> findProximosAVencer(Long empresaId, LocalDate desde, LocalDate hasta);
}
