-- Empresa inicial
INSERT INTO empresa (id, nombre) VALUES (1, 'Empresa Demo')
ON DUPLICATE KEY UPDATE nombre=nombre;

-- Usuarios iniciales
-- Contraseña para 'admin': Admin123.
-- contraseña para 'juan': Juan123**
-- Hash BCrypt generado: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

INSERT INTO usuario (username, password, rol, nombre_completo, email, empresa_id, cedula) VALUES
('admin', '$2a$12$HbeTC7hGDZXV/l5lmWdYYOkBrsMggIw2HAgTRhMIWViQdUq5drUrq', 'ADMIN', 'Administrador Sistema', 'admin@logitrack.com', 1, '1000000000'),
('juan', '$2a$12$A6Nynlh2ifWven1JnKJ/QO5X9pzvwlUcgPhBmIzMXlYBlInRHKCwS', 'EMPLEADO', 'Juan Pérez', 'juan@logitrack.com', 1, '1010101010')
ON DUPLICATE KEY UPDATE username=username;

-- Bodegas iniciales (encargado_id=2 corresponde a 'juan')
INSERT INTO bodega (nombre, ubicacion, capacidad, empresa_id, encargado_id) VALUES
('Bodega Central', 'Bogotá D.C.', 5000, 1, 2),
('Bodega Norte', 'Medellín', 3000, 1, 2),
('Bodega Sur', 'Cali', 2500, 1, 2)
ON DUPLICATE KEY UPDATE nombre=nombre;

-- Productos iniciales
INSERT INTO producto (nombre, categoria, stock, precio, empresa_id) VALUES
('Laptop Dell', 'Electrónicos', 50, 3500000.00, 1),
('Silla Oficina', 'Muebles', 120, 450000.00, 1),
('Teclado RGB', 'Electrónicos', 200, 150000.00, 1),
('Escritorio', 'Muebles', 80, 1200000.00, 1)
ON DUPLICATE KEY UPDATE nombre=nombre;

-- Inventario por Bodega (Stock real distribuido)
-- Bodega Central (ID=1): Bodega principal
INSERT INTO inventario_bodega (bodega_id, producto_id, stock, stock_minimo, stock_maximo) VALUES
(1, 1, 30, 10, 100),  -- Laptop Dell: 30 unidades
(1, 2, 50, 20, 200),  -- Silla Oficina: 50 unidades
(1, 3, 100, 30, 300), -- Teclado RGB: 100 unidades
(1, 4, 40, 15, 150)   -- Escritorio: 40 unidades
ON DUPLICATE KEY UPDATE stock=stock;

-- Bodega Norte (ID=2): Bodega secundaria
INSERT INTO inventario_bodega (bodega_id, producto_id, stock, stock_minimo, stock_maximo) VALUES
(2, 1, 15, 5, 50),    -- Laptop Dell: 15 unidades
(2, 2, 40, 15, 150),  -- Silla Oficina: 40 unidades
(2, 3, 60, 20, 200),  -- Teclado RGB: 60 unidades
(2, 4, 25, 10, 100)   -- Escritorio: 25 unidades
ON DUPLICATE KEY UPDATE stock=stock;

-- Bodega Sur (ID=3): Bodega pequeña
INSERT INTO inventario_bodega (bodega_id, producto_id, stock, stock_minimo, stock_maximo) VALUES
(3, 1, 5, 5, 30),     -- Laptop Dell: 5 unidades
(3, 2, 30, 10, 100),  -- Silla Oficina: 30 unidades
(3, 3, 40, 15, 150),  -- Teclado RGB: 40 unidades
(3, 4, 15, 5, 80)     -- Escritorio: 15 unidades
ON DUPLICATE KEY UPDATE stock=stock;

-- ========================================
-- MOVIMIENTOS (10 registros)
-- ========================================
-- Mezcla de ENTRADA, SALIDA y TRANSFERENCIA

INSERT INTO movimiento (fecha, tipo, usuario_id, bodega_origen_id, bodega_destino_id, observaciones) VALUES
-- Entradas a Bodega Central
('2025-11-01 08:30:00', 'ENTRADA', 1, NULL, 1, 'Compra inicial de inventario - Proveedor TechSupply'),
('2025-11-05 10:15:00', 'ENTRADA', 2, NULL, 1, 'Reabastecimiento mensual de productos electrónicos'),

-- Salidas desde Bodega Central
('2025-11-08 14:20:00', 'SALIDA', 2, 1, NULL, 'Venta a cliente corporativo - Factura #001'),
('2025-11-12 09:45:00', 'SALIDA', 2, 1, NULL, 'Pedido especial para oficina regional'),

-- Transferencias entre bodegas
('2025-11-10 11:00:00', 'TRANSFERENCIA', 1, 1, 2, 'Redistribución de stock - Bodega Norte requiere reposición'),
('2025-11-15 16:30:00', 'TRANSFERENCIA', 2, 2, 3, 'Envío de productos a Bodega Sur por demanda'),
('2025-11-18 13:10:00', 'TRANSFERENCIA', 1, 1, 3, 'Traslado de excedente a Bodega Sur'),

-- Más movimientos variados
('2025-11-20 08:00:00', 'ENTRADA', 1, NULL, 2, 'Llegada de pedido especial a Bodega Norte'),
('2025-11-22 15:45:00', 'SALIDA', 2, 2, NULL, 'Venta local desde Bodega Norte'),
('2025-11-25 10:30:00', 'TRANSFERENCIA', 2, 3, 1, 'Retorno de productos no vendidos a Central')
ON DUPLICATE KEY UPDATE fecha=fecha;

-- ========================================
-- AUDITORÍA (10 registros)
-- ========================================
-- Registro de operaciones críticas en el sistema

INSERT INTO auditoria (operacion, fecha, usuario_id, entidad, entidad_id, valores_anteriores, valores_nuevos) VALUES
-- Auditoría de creación de productos
('INSERT', '2025-10-28 09:00:00', 1, 'producto', 1, NULL, 
 '{"nombre":"Laptop Dell","categoria":"Electrónicos","stock":50,"precio":3500000.00}'),

('INSERT', '2025-10-28 09:15:00', 1, 'producto', 2, NULL,
 '{"nombre":"Silla Oficina","categoria":"Muebles","stock":120,"precio":450000.00}'),

-- Auditoría de actualización de inventario
('UPDATE', '2025-11-01 08:35:00', 1, 'inventario_bodega', 1,
 '{"stock":10}', '{"stock":30}'),

('UPDATE', '2025-11-05 10:20:00', 2, 'inventario_bodega', 3,
 '{"stock":80}', '{"stock":100}'),

-- Auditoría de movimientos realizados
('INSERT', '2025-11-08 14:25:00', 2, 'movimiento', 3, NULL,
 '{"tipo":"SALIDA","bodega_origen_id":1,"cantidad_total":30}'),

('INSERT', '2025-11-10 11:05:00', 1, 'movimiento', 5, NULL,
 '{"tipo":"TRANSFERENCIA","bodega_origen_id":1,"bodega_destino_id":2}'),

-- Auditoría de actualización de precios
('UPDATE', '2025-11-15 12:00:00', 1, 'producto', 3,
 '{"precio":150000.00}', '{"precio":165000.00}'),

-- Auditoría de cambios en bodegas
('UPDATE', '2025-11-18 10:30:00', 1, 'bodega', 2,
 '{"capacidad":3000}', '{"capacidad":3500}'),

-- Auditoría de eliminación (ejemplo hipotético)
('DELETE', '2025-11-20 16:00:00', 1, 'movimiento_detalle', 99,
 '{"movimiento_id":99,"producto_id":1,"cantidad":5}', NULL),

-- Auditoría de actualización de usuario
('UPDATE', '2025-11-22 08:45:00', 1, 'usuario', 2,
 '{"email":"juan@logitrack.com"}', '{"email":"juan.perez@logitrack.com"}')
ON DUPLICATE KEY UPDATE fecha=fecha;


-- Asegurar empresa para bodegas y productos existentes
UPDATE bodega SET empresa_id = 1 WHERE empresa_id IS NULL;
UPDATE producto SET empresa_id = 1 WHERE empresa_id IS NULL;
-- Empresa inicial
INSERT INTO empresa (id, nombre) VALUES (1, 'Empresa Demo')
ON DUPLICATE KEY UPDATE nombre=nombre;

-- Usuarios iniciales
-- Contraseña para 'admin' y 'juan': admin123
-- Hash BCrypt generado: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

INSERT INTO usuario (username, password, rol, nombre_completo, email, empresa_id, cedula) VALUES
('admin', '$2a$12$HbeTC7hGDZXV/l5lmWdYYOkBrsMggIw2HAgTRhMIWViQdUq5drUrq', 'ADMIN', 'Administrador Sistema', 'admin@logitrack.com', 1, '1000000000'),
('juan', '$2a$12$A6Nynlh2ifWven1JnKJ/QO5X9pzvwlUcgPhBmIzMXlYBlInRHKCwS', 'EMPLEADO', 'Juan Pérez', 'juan@logitrack.com', 1, '1010101010')
ON DUPLICATE KEY UPDATE username=username;

-- Bodegas iniciales (encargado_id=2 corresponde a 'juan')
INSERT INTO bodega (nombre, ubicacion, capacidad, empresa_id, encargado_id) VALUES
('Bodega Central', 'Bogotá D.C.', 5000, 1, 2),
('Bodega Norte', 'Medellín', 3000, 1, 2),
('Bodega Sur', 'Cali', 2500, 1, 2)
ON DUPLICATE KEY UPDATE nombre=nombre;

-- Productos iniciales
INSERT INTO producto (nombre, categoria, stock, precio, empresa_id) VALUES
('Laptop Dell', 'Electrónicos', 50, 3500000.00, 1),
('Silla Oficina', 'Muebles', 120, 450000.00, 1),
('Teclado RGB', 'Electrónicos', 200, 150000.00, 1),
('Escritorio', 'Muebles', 80, 1200000.00, 1)
ON DUPLICATE KEY UPDATE nombre=nombre;

-- Inventario por Bodega (Stock real distribuido)
-- Bodega Central (ID=1): Bodega principal
INSERT INTO inventario_bodega (bodega_id, producto_id, stock, stock_minimo, stock_maximo) VALUES
(1, 1, 30, 10, 100),  -- Laptop Dell: 30 unidades
(1, 2, 50, 20, 200),  -- Silla Oficina: 50 unidades
(1, 3, 100, 30, 300), -- Teclado RGB: 100 unidades
(1, 4, 40, 15, 150)   -- Escritorio: 40 unidades
ON DUPLICATE KEY UPDATE stock=stock;

-- Bodega Norte (ID=2): Bodega secundaria
INSERT INTO inventario_bodega (bodega_id, producto_id, stock, stock_minimo, stock_maximo) VALUES
(2, 1, 15, 5, 50),    -- Laptop Dell: 15 unidades
(2, 2, 40, 15, 150),  -- Silla Oficina: 40 unidades
(2, 3, 60, 20, 200),  -- Teclado RGB: 60 unidades
(2, 4, 25, 10, 100)   -- Escritorio: 25 unidades
ON DUPLICATE KEY UPDATE stock=stock;

-- Bodega Sur (ID=3): Bodega pequeña
INSERT INTO inventario_bodega (bodega_id, producto_id, stock, stock_minimo, stock_maximo) VALUES
(3, 1, 5, 5, 30),     -- Laptop Dell: 5 unidades
(3, 2, 30, 10, 100),  -- Silla Oficina: 30 unidades
(3, 3, 40, 15, 150),  -- Teclado RGB: 40 unidades
(3, 4, 15, 5, 80)     -- Escritorio: 15 unidades
ON DUPLICATE KEY UPDATE stock=stock;

-- ========================================
-- MOVIMIENTOS (10 registros)
-- ========================================
-- Mezcla de ENTRADA, SALIDA y TRANSFERENCIA

INSERT INTO movimiento (fecha, tipo, usuario_id, bodega_origen_id, bodega_destino_id, observaciones) VALUES
-- Entradas a Bodega Central
('2025-11-01 08:30:00', 'ENTRADA', 1, NULL, 1, 'Compra inicial de inventario - Proveedor TechSupply'),
('2025-11-05 10:15:00', 'ENTRADA', 2, NULL, 1, 'Reabastecimiento mensual de productos electrónicos'),

-- Salidas desde Bodega Central
('2025-11-08 14:20:00', 'SALIDA', 2, 1, NULL, 'Venta a cliente corporativo - Factura #001'),
('2025-11-12 09:45:00', 'SALIDA', 2, 1, NULL, 'Pedido especial para oficina regional'),

-- Transferencias entre bodegas
('2025-11-10 11:00:00', 'TRANSFERENCIA', 1, 1, 2, 'Redistribución de stock - Bodega Norte requiere reposición'),
('2025-11-15 16:30:00', 'TRANSFERENCIA', 2, 2, 3, 'Envío de productos a Bodega Sur por demanda'),
('2025-11-18 13:10:00', 'TRANSFERENCIA', 1, 1, 3, 'Traslado de excedente a Bodega Sur'),

-- Más movimientos variados
('2025-11-20 08:00:00', 'ENTRADA', 1, NULL, 2, 'Llegada de pedido especial a Bodega Norte'),
('2025-11-22 15:45:00', 'SALIDA', 2, 2, NULL, 'Venta local desde Bodega Norte'),
('2025-11-25 10:30:00', 'TRANSFERENCIA', 2, 3, 1, 'Retorno de productos no vendidos a Central')
ON DUPLICATE KEY UPDATE fecha=fecha;

-- ========================================
-- AUDITORÍA (10 registros)
-- ========================================
-- Registro de operaciones críticas en el sistema

INSERT INTO auditoria (operacion, fecha, usuario_id, entidad, entidad_id, valores_anteriores, valores_nuevos) VALUES
-- Auditoría de creación de productos
('INSERT', '2025-10-28 09:00:00', 1, 'producto', 1, NULL, 
 '{"nombre":"Laptop Dell","categoria":"Electrónicos","stock":50,"precio":3500000.00}'),

('INSERT', '2025-10-28 09:15:00', 1, 'producto', 2, NULL,
 '{"nombre":"Silla Oficina","categoria":"Muebles","stock":120,"precio":450000.00}'),

-- Auditoría de actualización de inventario
('UPDATE', '2025-11-01 08:35:00', 1, 'inventario_bodega', 1,
 '{"stock":10}', '{"stock":30}'),

('UPDATE', '2025-11-05 10:20:00', 2, 'inventario_bodega', 3,
 '{"stock":80}', '{"stock":100}'),

-- Auditoría de movimientos realizados
('INSERT', '2025-11-08 14:25:00', 2, 'movimiento', 3, NULL,
 '{"tipo":"SALIDA","bodega_origen_id":1,"cantidad_total":30}'),

('INSERT', '2025-11-10 11:05:00', 1, 'movimiento', 5, NULL,
 '{"tipo":"TRANSFERENCIA","bodega_origen_id":1,"bodega_destino_id":2}'),

-- Auditoría de actualización de precios
('UPDATE', '2025-11-15 12:00:00', 1, 'producto', 3,
 '{"precio":150000.00}', '{"precio":165000.00}'),

-- Auditoría de cambios en bodegas
('UPDATE', '2025-11-18 10:30:00', 1, 'bodega', 2,
 '{"capacidad":3000}', '{"capacidad":3500}'),

-- Auditoría de eliminación (ejemplo hipotético)
('DELETE', '2025-11-20 16:00:00', 1, 'movimiento_detalle', 99,
 '{"movimiento_id":99,"producto_id":1,"cantidad":5}', NULL),

-- Auditoría de actualización de usuario
('UPDATE', '2025-11-22 08:45:00', 1, 'usuario', 2,
 '{"email":"juan@logitrack.com"}', '{"email":"juan.perez@logitrack.com"}')
ON DUPLICATE KEY UPDATE fecha=fecha;


-- Asegurar empresa para bodegas y productos existentes
UPDATE bodega SET empresa_id = 1 WHERE empresa_id IS NULL;
UPDATE producto SET empresa_id = 1 WHERE empresa_id IS NULL;
