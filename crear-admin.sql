-- Script para crear usuario admin inicial en LogiTrack
-- Uso: mysql -u campus2023 -p logitrack_db < crear-admin.sql

-- IMPORTANTE: Ejecutar DESPUÉS de que las tablas se hayan creado

-- Insertar empresa si no existe
INSERT IGNORE INTO empresa (id, nombre)
VALUES (1, 'Mi Empresa');

-- Insertar usuario admin
-- Contraseña: Admin123! (hasheada con BCrypt)
INSERT IGNORE INTO usuario (
  username,
  password,
  rol,
  nombre_completo,
  email,
  cedula,
  empresa_id
) VALUES (
  'admin',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'ADMIN',
  'Administrador Principal',
  'admin@logitrack.com',
  '1234567890',
  1
);

-- Verificar
SELECT
  'Usuario admin creado:' AS Status,
  username,
  rol,
  nombre_completo,
  email
FROM usuario
WHERE username = 'admin';

-- Mostrar instrucciones
SELECT '========================' AS '';
SELECT 'CREDENCIALES DEL ADMIN:' AS '';
SELECT '========================' AS '';
SELECT 'Usuario: admin' AS '';
SELECT 'Contraseña: Admin123!' AS '';
SELECT '' AS '';
SELECT '⚠️  CAMBIAR esta contraseña después del primer login!' AS '';
SELECT '' AS '';
