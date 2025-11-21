package com.logitrack.repository;

import com.logitrack.model.Auditoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditoriaRepository extends JpaRepository<Auditoria, Long> {

    List<Auditoria> findByEntidad(String entidad);

    List<Auditoria> findByEntidadAndEntidadId(String entidad, Long entidadId);

    List<Auditoria> findByUsuarioId(Long usuarioId);

    List<Auditoria> findByOperacion(Auditoria.Operacion operacion);

    List<Auditoria> findByFechaBetween(LocalDateTime inicio, LocalDateTime fin);

    List<Auditoria> findTop20ByOrderByFechaDesc();

    org.springframework.data.domain.Page<Auditoria> findByUsuarioEmpresaId(Long empresaId, org.springframework.data.domain.Pageable pageable);

    List<Auditoria> findTop20ByUsuarioEmpresaIdOrderByFechaDesc(Long empresaId);

    org.springframework.data.domain.Page<Auditoria> findByEntidadAndUsuarioEmpresaId(String entidad, Long empresaId, org.springframework.data.domain.Pageable pageable);

    org.springframework.data.domain.Page<Auditoria> findByEntidadAndEntidadIdAndUsuarioEmpresaId(String entidad, Long entidadId, Long empresaId, org.springframework.data.domain.Pageable pageable);

    org.springframework.data.domain.Page<Auditoria> findByOperacionAndUsuarioEmpresaId(Auditoria.Operacion operacion, Long empresaId, org.springframework.data.domain.Pageable pageable);

    org.springframework.data.domain.Page<Auditoria> findByFechaBetweenAndUsuarioEmpresaId(LocalDateTime inicio, LocalDateTime fin, Long empresaId, org.springframework.data.domain.Pageable pageable);
}