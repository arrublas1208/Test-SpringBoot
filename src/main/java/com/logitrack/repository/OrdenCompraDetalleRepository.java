package com.logitrack.repository;

import com.logitrack.model.OrdenCompraDetalle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OrdenCompraDetalleRepository extends JpaRepository<OrdenCompraDetalle, Long> {
    List<OrdenCompraDetalle> findByOrdenCompraId(Long ordenCompraId);
}
