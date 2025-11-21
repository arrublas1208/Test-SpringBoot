package com.logitrack.test;
import com.logitrack.model.Movimiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

public class MovimientoRepository extends JpaRepository<Movimiento, Long>{
    
    List<Movimiento> findTop10ByOrderByFechaDesc();
}
