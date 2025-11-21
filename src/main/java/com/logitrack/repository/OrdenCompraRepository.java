package com.logitrack.repository;

import com.logitrack.model.OrdenCompra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrdenCompraRepository extends JpaRepository<OrdenCompra, Long> {
    List<OrdenCompra> findByEmpresaIdOrderByFechaOrdenDesc(Long empresaId);
    List<OrdenCompra> findByProveedorIdOrderByFechaOrdenDesc(Long proveedorId);
    List<OrdenCompra> findByEmpresaIdAndEstado(Long empresaId, OrdenCompra.EstadoOrden estado);
    Optional<OrdenCompra> findByNumeroOrden(String numeroOrden);

    @Query("SELECT o FROM OrdenCompra o WHERE o.empresa.id = ?1 AND o.estado IN ('PENDIENTE', 'APROBADA', 'ENVIADA') ORDER BY o.fechaOrden DESC")
    List<OrdenCompra> findPendientesOrAprobadas(Long empresaId);
}
