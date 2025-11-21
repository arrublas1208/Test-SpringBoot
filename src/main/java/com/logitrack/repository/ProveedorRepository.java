package com.logitrack.repository;

import com.logitrack.model.Proveedor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProveedorRepository extends JpaRepository<Proveedor, Long> {
    List<Proveedor> findByEmpresaId(Long empresaId);
    List<Proveedor> findByEmpresaIdAndActivoTrue(Long empresaId);
    Optional<Proveedor> findByNombreAndEmpresaId(String nombre, Long empresaId);
    boolean existsByNombreAndEmpresaId(String nombre, Long empresaId);
}
