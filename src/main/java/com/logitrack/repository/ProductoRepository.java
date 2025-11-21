package com.logitrack.repository;

import com.logitrack.model.Producto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {
    List<Producto> findByStockLessThan(int stock);

    @Query("SELECT p FROM Producto p ORDER BY p.stock DESC")
    List<Producto> findTopMovers();

    boolean existsByNombre(String nombre);

    Page<Producto> findByEmpresaId(Long empresaId, Pageable pageable);
    Page<Producto> findByEmpresaIdAndCategoriaContainingIgnoreCase(Long empresaId, String categoria, Pageable pageable);
    Page<Producto> findByEmpresaIdAndNombreContainingIgnoreCase(Long empresaId, String nombre, Pageable pageable);
    Page<Producto> findByEmpresaIdAndCategoriaContainingIgnoreCaseAndNombreContainingIgnoreCase(Long empresaId, String categoria, String nombre, Pageable pageable);
    @Query("SELECT DISTINCT p.categoria FROM Producto p WHERE p.empresa.id = :empresaId ORDER BY p.categoria")
    java.util.List<String> findDistinctCategoriasByEmpresaId(Long empresaId);
}
