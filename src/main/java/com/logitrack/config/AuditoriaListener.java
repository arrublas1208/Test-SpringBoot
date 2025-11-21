package com.logitrack.config;

import com.logitrack.model.Auditoria;
import com.logitrack.service.AuditoriaService;
import jakarta.persistence.PreRemove;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.PostPersist;
import org.springframework.stereotype.Component;

@Component
public class AuditoriaListener {

    @PostPersist
    public void postPersist(Object entity) {
        registrar(entity, Auditoria.Operacion.INSERT, null, entity);
    }

    @PreUpdate
    public void preUpdate(Object entity) {
        registrar(entity, Auditoria.Operacion.UPDATE, null, entity);
    }

    @PreRemove
    public void preRemove(Object entity) {
        registrar(entity, Auditoria.Operacion.DELETE, entity, null);
    }

    private void registrar(Object entity, Auditoria.Operacion operacion, Object anterior, Object nuevo) {
        try {
            AuditoriaService service = ApplicationContextProvider.getBean(AuditoriaService.class);
            service.registrar(entity.getClass().getSimpleName(), getId(entity), operacion, anterior, nuevo);
        } catch (Exception ignored) {
        }
    }

    private Long getId(Object entity) {
        try {
            var method = entity.getClass().getMethod("getId");
            return (Long) method.invoke(entity);
        } catch (Exception e) {
            return null;
        }
    }
}