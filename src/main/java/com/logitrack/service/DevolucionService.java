package com.logitrack.service;

import com.logitrack.exception.ResourceNotFoundException;
import com.logitrack.exception.BusinessException;
import com.logitrack.model.*;
import com.logitrack.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class DevolucionService {
    private final DevolucionRepository repository;
    private final com.logitrack.repository.UsuarioRepository usuarioRepository;
    private final ProveedorRepository proveedorRepository;
    private final BodegaRepository bodegaRepository;
    private final ProductoRepository productoRepository;
    private final InventarioBodegaRepository inventarioBodegaRepository;

    private Long currentEmpresaId() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        String username = auth != null ? auth.getName() : null;
        if (username == null) return null;
        return usuarioRepository.findByUsername(username).map(u -> u.getEmpresa().getId()).orElse(null);
    }

    private Usuario currentUsuario() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        String username = auth != null ? auth.getName() : null;
        if (username == null) return null;
        return usuarioRepository.findByUsername(username).orElse(null);
    }

    public List<Devolucion> findAll() {
        Long empresaId = currentEmpresaId();
        return repository.findByEmpresaIdOrderByFechaDevolucionDesc(empresaId);
    }

    public List<Devolucion> findByTipo(Devolucion.TipoDevolucion tipo) {
        Long empresaId = currentEmpresaId();
        return repository.findByTipoAndEmpresaId(tipo, empresaId);
    }

    public List<Devolucion> findByProveedor(Long proveedorId) {
        return repository.findByProveedorIdOrderByFechaDevolucionDesc(proveedorId);
    }

    public List<Devolucion> findByBodega(Long bodegaId) {
        return repository.findByBodegaId(bodegaId);
    }

    public Devolucion findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Devolución no encontrada: " + id));
    }

    public Devolucion save(Devolucion devolucion) {
        Long empresaId = currentEmpresaId();
        Usuario usuario = currentUsuario();

        // Validar número de devolución único
        if (devolucion.getNumeroDevolucion() != null &&
            repository.findByNumeroDevolucion(devolucion.getNumeroDevolucion()).isPresent()) {
            throw new BusinessException("Ya existe una devolución con ese número");
        }

        // Generar número de devolución si no existe
        if (devolucion.getNumeroDevolucion() == null || devolucion.getNumeroDevolucion().isEmpty()) {
            String prefix = devolucion.getTipo() == Devolucion.TipoDevolucion.A_PROVEEDOR ? "DP-" : "DC-";
            devolucion.setNumeroDevolucion(prefix + System.currentTimeMillis());
        }

        // Validar proveedor (solo para devoluciones a proveedor)
        if (devolucion.getTipo() == Devolucion.TipoDevolucion.A_PROVEEDOR) {
            if (devolucion.getProveedor() == null || devolucion.getProveedor().getId() == null) {
                throw new BusinessException("Debe especificar un proveedor para devoluciones a proveedor");
            }
            Proveedor proveedor = proveedorRepository.findById(devolucion.getProveedor().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Proveedor no encontrado"));
            devolucion.setProveedor(proveedor);
        }

        // Validar bodega
        if (devolucion.getBodega() != null && devolucion.getBodega().getId() != null) {
            Bodega bodega = bodegaRepository.findById(devolucion.getBodega().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Bodega no encontrada"));
            devolucion.setBodega(bodega);
        }

        // Asignar empresa y usuario
        if (empresaId != null) {
            Empresa emp = new Empresa();
            emp.setId(empresaId);
            devolucion.setEmpresa(emp);
        }
        devolucion.setUsuario(usuario);

        // Asignar la devolución a cada detalle
        devolucion.getDetalles().forEach(detalle -> {
            detalle.setDevolucion(devolucion);
            // Validar producto
            if (detalle.getProducto() != null && detalle.getProducto().getId() != null) {
                Producto producto = productoRepository.findById(detalle.getProducto().getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado"));
                detalle.setProducto(producto);
            }
        });

        return repository.save(devolucion);
    }

    public Devolucion update(Long id, Devolucion devolucion) {
        Devolucion existing = findById(id);

        if (existing.getEstado() == Devolucion.EstadoDevolucion.COMPLETADA) {
            throw new BusinessException("No se puede modificar una devolución completada");
        }

        if (!existing.getNumeroDevolucion().equals(devolucion.getNumeroDevolucion()) &&
            repository.findByNumeroDevolucion(devolucion.getNumeroDevolucion()).isPresent()) {
            throw new BusinessException("Número de devolución ya en uso");
        }

        devolucion.setId(id);
        devolucion.setEmpresa(existing.getEmpresa());
        devolucion.setUsuario(existing.getUsuario());

        return repository.save(devolucion);
    }

    public Devolucion aprobar(Long id) {
        Devolucion devolucion = findById(id);

        if (devolucion.getEstado() != Devolucion.EstadoDevolucion.PENDIENTE) {
            throw new BusinessException("Solo se pueden aprobar devoluciones pendientes");
        }

        devolucion.setEstado(Devolucion.EstadoDevolucion.APROBADA);
        return repository.save(devolucion);
    }

    public Devolucion completar(Long id) {
        Devolucion devolucion = findById(id);

        if (devolucion.getEstado() != Devolucion.EstadoDevolucion.APROBADA) {
            throw new BusinessException("Solo se pueden completar devoluciones aprobadas");
        }

        // Actualizar inventario según el tipo de devolución
        for (DevolucionDetalle detalle : devolucion.getDetalles()) {
            InventarioBodega inventario = inventarioBodegaRepository
                    .findByBodegaIdAndProductoId(devolucion.getBodega().getId(), detalle.getProducto().getId())
                    .orElseThrow(() -> new BusinessException(
                            "No existe inventario para el producto en la bodega"));

            if (devolucion.getTipo() == Devolucion.TipoDevolucion.A_PROVEEDOR) {
                // Devolución a proveedor: disminuir stock
                if (inventario.getStock() < detalle.getCantidad()) {
                    throw new BusinessException(
                            "Stock insuficiente para devolver el producto: " + detalle.getProducto().getNombre());
                }
                inventario.setStock(inventario.getStock() - detalle.getCantidad());
            } else {
                // Devolución de cliente: aumentar stock
                inventario.setStock(inventario.getStock() + detalle.getCantidad());
            }

            inventarioBodegaRepository.save(inventario);
        }

        devolucion.setEstado(Devolucion.EstadoDevolucion.COMPLETADA);
        return repository.save(devolucion);
    }

    public Devolucion rechazar(Long id, String motivo) {
        Devolucion devolucion = findById(id);

        if (devolucion.getEstado() == Devolucion.EstadoDevolucion.COMPLETADA) {
            throw new BusinessException("No se puede rechazar una devolución completada");
        }

        devolucion.setEstado(Devolucion.EstadoDevolucion.RECHAZADA);
        if (motivo != null && !motivo.isEmpty()) {
            devolucion.setObservaciones(
                    (devolucion.getObservaciones() != null ? devolucion.getObservaciones() + "\n" : "") +
                    "Motivo de rechazo: " + motivo);
        }
        return repository.save(devolucion);
    }

    public void delete(Long id) {
        Devolucion devolucion = findById(id);

        if (devolucion.getEstado() == Devolucion.EstadoDevolucion.COMPLETADA) {
            throw new BusinessException("No se puede eliminar una devolución completada");
        }

        repository.deleteById(id);
    }
}
