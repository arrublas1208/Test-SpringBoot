package com.logitrack.repository;

import com.logitrack.model.Bodega;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BodegaRepository extends JpaRepository<Bodega, Long> {
    boolean existsByNombre(String nombre);
    java.util.List<Bodega> findByEmpresaId(Long empresaId);
}
