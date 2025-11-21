-- Script para crear base de datos y usuario de LogiTrack
-- Uso: mysql -u campus2023 -p < crear-bd.sql

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS logitrack_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Crear usuario (CAMBIAR contraseña en producción)
CREATE USER IF NOT EXISTS 'logitrack_user'@'localhost'
  IDENTIFIED BY 'campus2023';

-- Otorgar todos los permisos
GRANT ALL PRIVILEGES ON logitrack_db.* TO 'logitrack_user'@'localhost';
FLUSH PRIVILEGES;

-- Verificar que se creó
SELECT
  'Base de datos creada:' AS Status,
  SCHEMA_NAME AS Database_Name,
  DEFAULT_CHARACTER_SET_NAME AS Charset,
  DEFAULT_COLLATION_NAME AS Collation
FROM information_schema.SCHEMATA
WHERE SCHEMA_NAME = 'logitrack_db';

-- Verificar usuario
SELECT
  'Usuario creado:' AS Status,
  User,
  Host
FROM mysql.user
WHERE User = 'logitrack_user';

-- Mostrar permisos
SHOW GRANTS FOR 'logitrack_user'@'localhost';
