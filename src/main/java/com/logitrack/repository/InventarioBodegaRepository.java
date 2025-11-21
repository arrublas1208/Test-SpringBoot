package com.logitrack.repository;

import com.logitrack.model.InventarioBodega;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface InventarioBodegaRepository extends JpaRepository<InventarioBodega, Long> {

    // Buscar inventario por bodega y producto
    Optional<InventarioBodega> findByBodegaIdAndProductoId(Long bodegaId, Long productoId);

    // Listar todo el inventario de una bodega
    List<InventarioBodega> findByBodegaId(Long bodegaId);
    Page<InventarioBodega> findByBodegaId(Long bodegaId, Pageable pageable);

    // Listar todas las bodegas que tienen un producto
    List<InventarioBodega> findByProductoId(Long productoId);
    Page<InventarioBodega> findByProductoId(Long productoId, Pageable pageable);

    // Productos con stock bajo en una bodega
    @Query("SELECT i FROM InventarioBodega i WHERE i.bodega.id = :bodegaId AND i.stock <= i.stockMinimo")
    List<InventarioBodega> findStockBajoByBodega(@Param("bodegaId") Long bodegaId);

    // Todos los productos con stock bajo en todas las bodegas
    @Query("SELECT i FROM InventarioBodega i WHERE i.stock <= i.stockMinimo ORDER BY i.stock ASC")
    List<InventarioBodega> findAllStockBajo();

    @Query("SELECT i FROM InventarioBodega i WHERE i.bodega.empresa.id = :empresaId")
    Page<InventarioBodega> findAllPageableByEmpresa(@Param("empresaId") Long empresaId, Pageable pageable);

    @Query("SELECT i FROM InventarioBodega i WHERE i.bodega.empresa.id = :empresaId AND (:stockMinimo IS NULL OR i.stock <= :stockMinimo)")
    Page<InventarioBodega> findByStockMinimoFilterEmpresa(@Param("empresaId") Long empresaId, @Param("stockMinimo") Integer stockMinimo, Pageable pageable);

    // Verificar si existe inventario para bodega y producto
    boolean existsByBodegaIdAndProductoId(Long bodegaId, Long productoId);

    // Stock total de un producto en todas las bodegas
    @Query("SELECT COALESCE(SUM(i.stock), 0) FROM InventarioBodega i WHERE i.producto.id = :productoId AND i.producto.empresa.id = :empresaId")
    Integer getTotalStockByProducto(@Param("productoId") Long productoId, @Param("empresaId") Long empresaId);

    // Stock disponible de un producto en una bodega específica
    @Query("SELECT COALESCE(i.stock, 0) FROM InventarioBodega i WHERE i.bodega.id = :bodegaId AND i.producto.id = :productoId")
    Integer getStockByBodegaAndProducto(@Param("bodegaId") Long bodegaId, @Param("productoId") Long productoId);
}
