package com.logitrack.repository;

import com.logitrack.model.Notificacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotificacionRepository extends JpaRepository<Notificacion, Long> {
    List<Notificacion> findByEmpresaIdOrderByCreatedAtDesc(Long empresaId);

    @Query("SELECT n FROM Notificacion n WHERE n.empresa.id = ?1 AND (n.usuario IS NULL OR n.usuario.id = ?2) ORDER BY n.createdAt DESC")
    List<Notificacion> findByEmpresaAndUsuario(Long empresaId, Long usuarioId);

    @Query("SELECT n FROM Notificacion n WHERE n.empresa.id = ?1 AND (n.usuario IS NULL OR n.usuario.id = ?2) AND n.leida = false ORDER BY n.createdAt DESC")
    List<Notificacion> findNoLeidasByEmpresaAndUsuario(Long empresaId, Long usuarioId);

    @Query("SELECT COUNT(n) FROM Notificacion n WHERE n.empresa.id = ?1 AND (n.usuario IS NULL OR n.usuario.id = ?2) AND n.leida = false")
    Long countNoLeidasByEmpresaAndUsuario(Long empresaId, Long usuarioId);

    List<Notificacion> findByTipoAndEmpresaId(Notificacion.TipoNotificacion tipo, Long empresaId);
}
