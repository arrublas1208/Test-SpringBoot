package com.logitrack.repository;

import com.logitrack.model.Devolucion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface DevolucionRepository extends JpaRepository<Devolucion, Long> {
    List<Devolucion> findByEmpresaIdOrderByFechaDevolucionDesc(Long empresaId);
    List<Devolucion> findByTipoAndEmpresaId(Devolucion.TipoDevolucion tipo, Long empresaId);
    List<Devolucion> findByProveedorIdOrderByFechaDevolucionDesc(Long proveedorId);
    List<Devolucion> findByBodegaId(Long bodegaId);
    Optional<Devolucion> findByNumeroDevolucion(String numeroDevolucion);
}
