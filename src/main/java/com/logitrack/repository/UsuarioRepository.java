package com.logitrack.repository;

import com.logitrack.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByUsername(String username);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    Optional<Usuario> findByCedula(String cedula);
    boolean existsByCedula(String cedula);
    Optional<Usuario> findByEmpIdAndEmpresaId(String empId, Long empresaId);
    java.util.List<Usuario> findByEmpresaIdAndRol(Long empresaId, Usuario.Rol rol);
}
