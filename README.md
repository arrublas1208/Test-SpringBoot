# LogiTrack - Sistema de Gestión de Bodegas e Inventario

<div align="center">

![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4.0-brightgreen.svg)
![Java](https://img.shields.io/badge/Java-17-orange.svg)
![MySQL](https://img.shields.io/badge/MySQL-8.0-blue.svg)
![React](https://img.shields.io/badge/React-18.2.0-61DAFB.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

Sistema completo de gestión y auditoría de bodegas con control de inventarios, movimientos (entradas, salidas, transferencias), reportes y autenticación JWT.

[Características](#-características-principales) •
[Instalación](#-instalación) •
[Documentación](#-documentación-api) •
[Arquitectura](#-arquitectura)

</div>

---

## 📋 Tabla de Contenidos

- [Descripción](#-descripción-del-proyecto)
- [Características](#-características-principales)
- [Requisitos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Documentación API](#-documentación-api)
- [Arquitectura](#-arquitectura)
- [Modelo de Datos](#️-modelo-de-datos)
- [Autenticación y Seguridad](#-autenticación-y-seguridad)
- [Endpoints Principales](#-endpoints-principales)
- [Casos de Uso](#-casos-de-uso)
- [Tecnologías](#-tecnologías-utilizadas)
- [Estructura del Proyecto](#️-estructura-del-proyecto)
- [Pruebas](#-pruebas)
- [Despliegue](#-despliegue)
- [Capturas de Pantalla](#-capturas-de-pantalla)
- [Contribución](#-contribución)
- [Licencia](#-licencia)

---

## 📖 Descripción del Proyecto

**LogiTrack** es un sistema backend centralizado desarrollado en Spring Boot para la empresa LogiTrack S.A., que administra varias bodegas distribuidas en distintas ciudades. El sistema permite:

- ✅ Controlar todos los movimientos de inventario entre bodegas
- ✅ Registrar automáticamente cambios con auditoría completa
- ✅ Proteger información con autenticación JWT
- ✅ Ofrecer endpoints REST documentados y seguros
- ✅ Gestionar productos, bodegas, usuarios e inventarios
- ✅ Generar reportes auditables de cambios por usuario

### Problema Resuelto

Hasta ahora, LogiTrack S.A. controlaba inventarios y auditorías manualmente en hojas de cálculo, sin trazabilidad ni control de accesos. Este sistema centraliza toda la operación, automatiza auditorías y garantiza seguridad con autenticación por roles.

---

## 🚀 Características Principales

### 1. Gestión Completa de Bodegas
- ✅ CRUD completo de bodegas
- ✅ Asignación de encargados
- ✅ Control de capacidad y ubicación
- ✅ Multitenancy por empresa

### 2. Gestión de Productos
- ✅ CRUD completo con validaciones
- ✅ Categorización de productos
- ✅ Control de precios y stock
- ✅ Productos con stock bajo
- ✅ Top productos más movidos

### 3. Inventario por Bodega
- ✅ Stock en tiempo real por bodega
- ✅ Stock mínimo y máximo configurable
- ✅ Alertas de stock bajo
- ✅ Actualización automática con movimientos
- ✅ Consultas por bodega/producto

### 4. Movimientos de Inventario
- ✅ **ENTRADA**: Ingreso de mercancía
- ✅ **SALIDA**: Despacho de mercancía
- ✅ **TRANSFERENCIA**: Movimiento entre bodegas
- ✅ Actualización automática de inventario
- ✅ Validación de stock suficiente
- ✅ Historial completo de transacciones

### 5. Auditoría Automática
- ✅ Registro automático de INSERT, UPDATE, DELETE
- ✅ Captura de valores anteriores y nuevos
- ✅ Usuario responsable de cada cambio
- ✅ Fecha y hora de cada operación
- ✅ 8 entidades auditadas
- ✅ Listeners JPA (@EntityListeners)

### 6. Autenticación y Seguridad
- ✅ Spring Security + JWT
- ✅ Roles diferenciados (ADMIN / EMPLEADO)
- ✅ Rutas protegidas por rol
- ✅ Contraseñas encriptadas con BCrypt
- ✅ Tokens con validez configurable
- ✅ CORS configurado para frontend

### 7. Reportes y Consultas Avanzadas
- ✅ Productos con stock bajo (configurable)
- ✅ Movimientos por rango de fechas
- ✅ Auditorías por usuario y operación
- ✅ Resumen general (stock por bodega, categorías)
- ✅ Top productos más movidos
- ✅ Búsquedas con filtros combinados

### 8. Documentación Swagger
- ✅ API completamente documentada
- ✅ UI interactiva en `/swagger-ui.html`
- ✅ Soporte para autenticación JWT
- ✅ Ejemplos de request/response

### 9. Frontend Moderno
- ✅ React 18 + Vite
- ✅ 10 vistas completas (Dashboard, Bodegas, Productos, etc.)
- ✅ Tema oscuro/claro
- ✅ Validaciones en tiempo real
- ✅ Estados de carga y error
- ✅ Internacionalización (i18n)

---

## 📦 Requisitos Previos

- **Java**: 17 o superior
- **Maven**: 3.6+ (incluido `mvnw` en el proyecto)
- **MySQL**: 8.0 o superior
- **Node.js**: 18+ (para frontend)
- **npm**: 8+ (para frontend)

---

## 🔧 Instalación

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/logitrack.git
cd logitrack
```

### 2. Configurar Base de Datos MySQL

```bash
# Iniciar MySQL
mysql -u root -p

# Crear base de datos (opcional, se crea automáticamente)
CREATE DATABASE IF NOT EXISTS logitrack_db;
```

**Nota**: El sistema crea automáticamente la base de datos si no existe (`createDatabaseIfNotExist=true`).

### 3. Configurar Variables de Entorno (Opcional)

Puedes personalizar la configuración creando un archivo `.env` o configurando variables de sistema:

```bash
# Base de datos
export DB_URL=jdbc:mysql://localhost:3306/logitrack_db
export DB_USERNAME=root
export DB_PASSWORD=tu_password

# JWT
export JWT_SECRET=tu_secreto_de_256_bits_minimo
export JWT_VALIDITY_MS=3600000

# Puerto
export PORT=8081

# CORS
export CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 4. Ejecutar Backend

#### Opción A: Con Maven Wrapper (Recomendado)

```bash
# Linux/Mac
./mvnw spring-boot:run

# Windows
mvnw.cmd spring-boot:run
```

#### Opción B: Con Maven Instalado

```bash
mvn spring-boot:run
```

El servidor estará disponible en `http://localhost:8081`

### 5. Ejecutar Frontend (Desarrollo)

```bash
cd frontend
npm install

# Windows PowerShell
$env:VITE_API_PROXY_TARGET="http://localhost:8081"; npm run dev

# Linux/Mac
VITE_API_PROXY_TARGET=http://localhost:8081 npm run dev
```

El frontend estará disponible en `http://localhost:5173`

### 6. Build de Producción (Frontend Integrado)

```bash
cd frontend
npm run build
cd ..
./mvnw spring-boot:run
```

El frontend se compilará en `src/main/resources/static` y se servirá desde el mismo servidor Spring Boot.

---

## ⚙️ Configuración

El archivo principal de configuración es `src/main/resources/application.properties`:

```properties
# Servidor
server.port=${PORT:8081}

# Base de Datos
spring.datasource.url=${DB_URL:jdbc:mysql://localhost:3306/logitrack_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true&createDatabaseIfNotExist=true}
spring.datasource.username=${DB_USERNAME:root}
spring.datasource.password=${DB_PASSWORD:campus2023}

# JPA/Hibernate
spring.jpa.hibernate.ddl-auto=none
spring.jpa.show-sql=true

# JWT
jwt.secret=${JWT_SECRET:CHANGE-THIS-SECRET-IN-PRODUCTION-USE-AT-LEAST-256-BITS-RANDOM-STRING-HERE!!}
jwt.validity-ms=${JWT_VALIDITY_MS:3600000}

# Swagger
springdoc.swagger-ui.path=/swagger-ui.html

# Reportes
reportes.stock-bajo.threshold=10
reportes.stock-bajo.max-threshold=1000
```

---

## 📚 Documentación API

### Swagger UI

Accede a la documentación interactiva en:

```
http://localhost:8081/swagger-ui.html
```

### OpenAPI Spec (JSON)

```
http://localhost:8081/v3/api-docs
```

### Autenticación en Swagger

1. Haz clic en el botón **"Authorize"** en Swagger UI
2. Ingresa el token JWT en el formato: `Bearer <tu_token>`
3. Ahora puedes probar los endpoints protegidos

---

## 🏗️ Arquitectura

El sistema sigue una arquitectura en capas con separación de responsabilidades:

```
┌─────────────────────────────────────────────────────────────┐
│                    CAPA DE PRESENTACIÓN                     │
│               Frontend React (Vite) + REST API              │
├─────────────────────────────────────────────────────────────┤
│                   CAPA DE CONTROLADORES                     │
│    AuthController │ BodegaController │ ProductoController   │
│  MovimientoController │ InventarioController │ Reportes     │
├─────────────────────────────────────────────────────────────┤
│                CAPA DE SEGURIDAD (Spring Security)          │
│  JwtAuthenticationFilter │ JwtTokenProvider │ UserDetails   │
├─────────────────────────────────────────────────────────────┤
│                    CAPA DE SERVICIOS                        │
│     Lógica de Negocio + Validaciones + Auditoría            │
├─────────────────────────────────────────────────────────────┤
│                  CAPA DE REPOSITORIOS                       │
│              JPA/Hibernate Data Access Layer                │
├─────────────────────────────────────────────────────────────┤
│                    CAPA DE ENTIDADES                        │
│  Bodega │ Producto │ Usuario │ Inventario │ Movimiento      │
│            Auditoria │ Empresa │ Categoría                  │
├─────────────────────────────────────────────────────────────┤
│                  CAPA DE PERSISTENCIA                       │
│                   MySQL Database (logitrack_db)             │
└─────────────────────────────────────────────────────────────┘
```

Para diagramas detallados, consulta:
- [Diagrama de Arquitectura](docs/ARQUITECTURA.md)
- [Diagrama de Clases](docs/DIAGRAMA_CLASES.md)
- [Diagrama de Base de Datos](docs/DIAGRAMA_BD.md)

---

## 🗄️ Modelo de Datos

### Entidades Principales

1. **Empresa** - Multitenancy, aislamiento de datos
2. **Usuario** - Usuarios del sistema (ADMIN/EMPLEADO)
3. **Bodega** - Almacenes físicos distribuidos
4. **Producto** - Catálogo de productos
5. **InventarioBodega** - Stock real por bodega y producto
6. **Movimiento** - Transacciones de inventario
7. **MovimientoDetalle** - Productos en cada movimiento
8. **Auditoria** - Registro de cambios automático

### Relaciones Principales

- Usuario → Empresa (ManyToOne)
- Bodega → Usuario (encargado, ManyToOne)
- Bodega → Empresa (ManyToOne)
- Producto → Empresa (ManyToOne)
- InventarioBodega → Bodega + Producto (ManyToOne)
- Movimiento → Usuario + Bodegas (ManyToOne)
- MovimientoDetalle → Movimiento + Producto (ManyToOne)
- Auditoria → Usuario (ManyToOne)

Ver [Diagrama Completo de Base de Datos](docs/DIAGRAMA_BD.md)

---

## 🔐 Autenticación y Seguridad

### Sistema de Autenticación JWT

#### 1. Registro de Usuario (Solo ADMIN)

```bash
POST /api/auth/register
Content-Type: application/json

{
  "username": "empleado1",
  "password": "Password123!",
  "nombreCompleto": "Juan Pérez",
  "email": "juan@logitrack.com",
  "cedula": "1234567890",
  "rol": "EMPLEADO"
}
```

#### 2. Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Respuesta:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "username": "admin",
  "rol": "ADMIN",
  "id": 1
}
```

#### 3. Usar Token en Peticiones

```bash
GET /api/productos
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Usuarios de Prueba

| Username | Password | Rol | Email |
|----------|----------|-----|-------|
| admin | admin123 | ADMIN | admin@logitrack.com |
| juan | admin123 | EMPLEADO | juan@logitrack.com |

### Configuración de Seguridad

| Endpoint | Método | Rol Requerido |
|----------|--------|---------------|
| `/api/auth/login` | POST | Público |
| `/api/auth/register-admin` | POST | ADMIN |
| `/api/auth/register` | POST | ADMIN |
| `/api/bodegas` | GET | Autenticado |
| `/api/bodegas/**` | POST/PUT/DELETE | ADMIN |
| `/api/productos/**` | Todos | Autenticado |
| `/api/movimientos/**` | Todos | Autenticado |
| `/api/inventario/**` | Todos | Autenticado |
| `/api/reportes/**` | GET | Autenticado |
| `/api/auditoria/**` | GET | ADMIN |
| `/swagger-ui/**` | GET | Público |

### Características de Seguridad

- ✅ Algoritmo JWT: HS256 (HMAC-SHA256)
- ✅ Contraseñas: BCrypt hash
- ✅ Validez del token: 1 hora (configurable)
- ✅ CORS: Configurado para frontend
- ✅ CSRF: Deshabilitado (API stateless)
- ✅ Validación de entrada con Bean Validation
- ✅ Manejo global de excepciones

---

## 📡 Endpoints Principales

### Autenticación

```
POST   /api/auth/login              - Autenticación
POST   /api/auth/register           - Registro empleado (ADMIN)
POST   /api/auth/register-admin     - Registro admin (ADMIN)
```

### Bodegas

```
GET    /api/bodegas                 - Listar todas
GET    /api/bodegas/{id}            - Obtener por ID
POST   /api/bodegas                 - Crear (ADMIN)
PUT    /api/bodegas/{id}            - Actualizar (ADMIN)
DELETE /api/bodegas/{id}            - Eliminar (ADMIN)
```

### Productos

```
GET    /api/productos                        - Listar con paginación
GET    /api/productos/{id}                   - Obtener por ID
GET    /api/productos/stock-bajo             - Stock bajo
GET    /api/productos/top-movers             - Más movidos
POST   /api/productos                        - Crear
PUT    /api/productos/{id}                   - Actualizar
DELETE /api/productos/{id}                   - Eliminar
```

### Inventario

```
GET    /api/inventario                                         - Todo el inventario
GET    /api/inventario/bodega/{id}                            - Por bodega
GET    /api/inventario/producto/{id}                          - Por producto
GET    /api/inventario/bodega/{bid}/producto/{pid}            - Específico
GET    /api/inventario/stock-bajo                             - Stock bajo
PATCH  /api/inventario/bodega/{bid}/producto/{pid}/ajustar    - Ajustar stock
POST   /api/inventario                                        - Crear
PUT    /api/inventario/{id}                                   - Actualizar
DELETE /api/inventario/{id}                                   - Eliminar
```

### Movimientos

```
GET    /api/movimientos                     - Todos
GET    /api/movimientos/{id}                - Por ID
GET    /api/movimientos/tipo/{tipo}         - Por tipo
GET    /api/movimientos/bodega/{id}         - Por bodega
GET    /api/movimientos/usuario/{id}        - Por usuario
GET    /api/movimientos/rango-fechas        - Por fechas
GET    /api/movimientos/search              - Búsqueda avanzada
POST   /api/movimientos                     - Crear
DELETE /api/movimientos/{id}                - Eliminar
```

### Reportes

```
GET    /api/reportes/resumen                        - Resumen general
GET    /api/reportes/movimientos/ultimos            - Últimos movimientos
GET    /api/reportes/movimientos/top-productos      - Top productos
```

### Auditoría (Solo ADMIN)

```
GET    /api/auditoria                           - Todo el historial
GET    /api/auditoria/ultimas                   - Últimas 20
GET    /api/auditoria/entidad/{entidad}         - Por entidad
GET    /api/auditoria/entidad/{entidad}/{id}    - Por entidad e ID
GET    /api/auditoria/usuario/{id}              - Por usuario
GET    /api/auditoria/operacion/{operacion}     - Por operación
GET    /api/auditoria/rango-fechas              - Por fechas
```

---

## 💡 Casos de Uso

### 1. Registrar Entrada de Mercancía

```bash
curl -X POST http://localhost:8081/api/movimientos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <tu_token>" \
  -d '{
    "tipo": "ENTRADA",
    "usuarioId": 1,
    "bodegaDestinoId": 1,
    "detalles": [
      {"productoId": 1, "cantidad": 50}
    ],
    "observaciones": "Pedido mensual - Factura #12345"
  }'
```

**Resultado:**
- ✅ Se crea el movimiento
- ✅ Se incrementa el stock en la bodega destino
- ✅ Se registra en auditoría automáticamente

### 2. Registrar Salida (Venta)

```bash
curl -X POST http://localhost:8081/api/movimientos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <tu_token>" \
  -d '{
    "tipo": "SALIDA",
    "usuarioId": 2,
    "bodegaOrigenId": 1,
    "detalles": [
      {"productoId": 1, "cantidad": 5}
    ],
    "observaciones": "Venta cliente ABC - Orden #789"
  }'
```

**Validaciones:**
- ✅ Verifica stock suficiente
- ✅ Decrementa inventario de origen
- ✅ Registra auditoría

### 3. Transferir entre Bodegas

```bash
curl -X POST http://localhost:8081/api/movimientos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <tu_token>" \
  -d '{
    "tipo": "TRANSFERENCIA",
    "usuarioId": 1,
    "bodegaOrigenId": 1,
    "bodegaDestinoId": 3,
    "detalles": [
      {"productoId": 1, "cantidad": 10}
    ],
    "observaciones": "Reabastecimiento Bodega Sur"
  }'
```

**Operaciones:**
- ✅ Decrementa stock en bodega origen
- ✅ Incrementa stock en bodega destino
- ✅ Valida que las bodegas sean diferentes
- ✅ Auditoría completa de ambos cambios

### 4. Consultar Stock Bajo

```bash
curl -X GET "http://localhost:8081/api/reportes/resumen?threshold=15" \
  -H "Authorization: Bearer <tu_token>"
```

**Respuesta:**

```json
{
  "threshold": 15,
  "stockBajo": [
    {
      "id": 1,
      "nombre": "Laptop Dell",
      "categoria": "Electrónicos",
      "stock": 5,
      "precio": 3500000.00
    }
  ],
  "stockPorBodega": [...],
  "productosMasMovidos": [...],
  "resumenPorCategoria": [...]
}
```

### 5. Consultar Auditoría de un Usuario

```bash
curl -X GET "http://localhost:8081/api/auditoria/usuario/1" \
  -H "Authorization: Bearer <tu_token>"
```

---

## 🛠️ Tecnologías Utilizadas

### Backend

| Tecnología | Versión | Uso |
|------------|---------|-----|
| Spring Boot | 3.4.0 | Framework principal |
| Spring Data JPA | 3.4.0 | Persistencia |
| Spring Security | 6.x | Autenticación y autorización |
| MySQL Connector | 8.x | Driver de base de datos |
| JJWT | 0.11.5 | Generación y validación JWT |
| Lombok | 1.18.32 | Reducción de boilerplate |
| Jakarta Validation | 3.x | Validaciones Bean Validation |
| SpringDoc OpenAPI | 2.7.0 | Documentación Swagger |
| Maven | 3.x | Gestión de dependencias |

### Frontend

| Tecnología | Versión | Uso |
|------------|---------|-----|
| React | 18.2.0 | Framework UI |
| Vite | 5.0.0 | Build tool y dev server |
| JavaScript | ES6+ | Lenguaje principal |
| CSS3 | - | Estilos |
| Context API | - | Manejo de estado |

### Base de Datos

- **MySQL 8.0**: Base de datos relacional
- **InnoDB**: Motor de almacenamiento
- **UTF8MB4**: Charset para soporte completo Unicode

---

## 🗂️ Estructura del Proyecto

```
logitrack/
├── src/
│   ├── main/
│   │   ├── java/com/logitrack/
│   │   │   ├── controller/              # REST Controllers
│   │   │   │   ├── AuthController.java
│   │   │   │   ├── BodegaController.java
│   │   │   │   ├── ProductoController.java
│   │   │   │   ├── InventarioBodegaController.java
│   │   │   │   ├── MovimientoController.java
│   │   │   │   ├── ReportesController.java
│   │   │   │   ├── AuditoriaController.java
│   │   │   │   └── UsuarioController.java
│   │   │   ├── service/                 # Business Logic
│   │   │   │   ├── AuthService.java
│   │   │   │   ├── BodegaService.java
│   │   │   │   ├── ProductoService.java
│   │   │   │   ├── InventarioBodegaService.java
│   │   │   │   ├── MovimientoService.java
│   │   │   │   ├── ReportesService.java
│   │   │   │   ├── AuditoriaService.java
│   │   │   │   └── UsuarioService.java
│   │   │   ├── repository/              # Data Access (JPA)
│   │   │   │   ├── EmpresaRepository.java
│   │   │   │   ├── UsuarioRepository.java
│   │   │   │   ├── BodegaRepository.java
│   │   │   │   ├── ProductoRepository.java
│   │   │   │   ├── InventarioBodegaRepository.java
│   │   │   │   ├── MovimientoRepository.java
│   │   │   │   ├── MovimientoDetalleRepository.java
│   │   │   │   └── AuditoriaRepository.java
│   │   │   ├── model/                   # JPA Entities
│   │   │   │   ├── Empresa.java
│   │   │   │   ├── Usuario.java
│   │   │   │   ├── Bodega.java
│   │   │   │   ├── Producto.java
│   │   │   │   ├── InventarioBodega.java
│   │   │   │   ├── Movimiento.java
│   │   │   │   ├── MovimientoDetalle.java
│   │   │   │   ├── Auditoria.java
│   │   │   │   ├── AuditoriaListener.java
│   │   │   │   ├── Rol.java (enum)
│   │   │   │   ├── TipoMovimiento.java (enum)
│   │   │   │   └── TipoOperacion.java (enum)
│   │   │   ├── dto/                     # Data Transfer Objects
│   │   │   │   ├── LoginRequest.java
│   │   │   │   ├── LoginResponse.java
│   │   │   │   ├── RegisterRequest.java
│   │   │   │   ├── MovimientoRequest.java
│   │   │   │   └── ReporteResumen.java
│   │   │   ├── security/                # Security & JWT
│   │   │   │   ├── SecurityConfig.java
│   │   │   │   ├── JwtTokenProvider.java
│   │   │   │   ├── JwtAuthenticationFilter.java
│   │   │   │   └── CustomUserDetailsService.java
│   │   │   ├── exception/               # Exception Handling
│   │   │   │   ├── GlobalExceptionHandler.java
│   │   │   │   ├── ResourceNotFoundException.java
│   │   │   │   ├── BusinessException.java
│   │   │   │   └── ValidationException.java
│   │   │   ├── config/                  # Configurations
│   │   │   │   └── (Additional configs)
│   │   │   └── LogitrackApplication.java
│   │   └── resources/
│   │       ├── application.properties   # Main configuration
│   │       ├── schema.sql              # Database schema
│   │       ├── data.sql                # Initial data
│   │       └── static/                 # Frontend build output
│   └── test/
│       └── java/com/logitrack/
│           └── (Test classes)
├── frontend/                            # React Frontend
│   ├── src/
│   │   ├── main.jsx                    # Main React app
│   │   ├── style.css                   # Styles
│   │   ├── icons.jsx                   # Icons component
│   │   └── i18n.js                     # Internationalization
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── docs/                               # Documentation
│   ├── ARQUITECTURA.md                 # Architecture diagram
│   ├── DIAGRAMA_CLASES.md              # Class diagram
│   └── DIAGRAMA_BD.md                  # Database diagram
├── pom.xml                             # Maven dependencies
├── mvnw                                # Maven wrapper (Linux/Mac)
├── mvnw.cmd                            # Maven wrapper (Windows)
├── .gitignore
├── objetivo.txt                        # Project objectives
└── README.md                           # This file
```

---

## 🧪 Pruebas

### Pruebas con Swagger UI

1. Accede a `http://localhost:8081/swagger-ui.html`
2. Autentícate con el endpoint `/api/auth/login`
3. Copia el token de la respuesta
4. Haz clic en "Authorize" y pega: `Bearer <tu_token>`
5. Prueba los endpoints directamente desde la UI

### Pruebas con cURL

#### Login

```bash
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

#### Listar Bodegas

```bash
curl -X GET http://localhost:8081/api/bodegas \
  -H "Authorization: Bearer <tu_token>"
```

#### Crear Producto

```bash
curl -X POST http://localhost:8081/api/productos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <tu_token>" \
  -d '{
    "nombre": "Monitor 24 pulgadas",
    "categoria": "Electrónicos",
    "stock": 0,
    "precio": 850000.00
  }'
```

### Datos de Prueba Precargados

El sistema incluye datos de prueba en `data.sql`:

**Empresa:**
- Empresa Demo (ID: 1)

**Usuarios:**
- admin / admin123 (ADMIN)
- juan / admin123 (EMPLEADO)

**Bodegas:**
1. Bodega Central (Bogotá D.C., capacidad: 5000)
2. Bodega Norte (Medellín, capacidad: 3000)
3. Bodega Sur (Cali, capacidad: 2500)

**Productos:**
1. Laptop Dell - Electrónicos - $3,500,000
2. Silla Oficina - Muebles - $450,000
3. Teclado RGB - Electrónicos - $150,000
4. Escritorio - Muebles - $1,200,000

**Inventario Inicial:**

| Producto | Bodega Central | Bodega Norte | Bodega Sur |
|----------|----------------|--------------|------------|
| Laptop Dell | 30 | 15 | 5 ⚠️ |
| Silla Oficina | 50 | 40 | 30 |
| Teclado RGB | 100 | 60 | 40 |
| Escritorio | 40 | 25 | 15 |

---

## 🚢 Despliegue

### Despliegue en Producción

#### 1. Configurar Variables de Entorno

```bash
export DB_URL=jdbc:mysql://tu-servidor:3306/logitrack_db
export DB_USERNAME=usuario_prod
export DB_PASSWORD=password_seguro
export JWT_SECRET=$(openssl rand -base64 32)
export PORT=8081
```

#### 2. Build del Proyecto

```bash
./mvnw clean package
```

#### 3. Ejecutar JAR

```bash
java -jar target/logitrack-0.0.1-SNAPSHOT.jar
```

### Despliegue en Tomcat

El proyecto está configurado como WAR para despliegue en Tomcat:

```bash
./mvnw clean package
cp target/logitrack-0.0.1-SNAPSHOT.war /path/to/tomcat/webapps/
```

### Despliegue con Docker (Opcional)

Crear `Dockerfile`:

```dockerfile
FROM eclipse-temurin:17-jdk-alpine
WORKDIR /app
COPY target/logitrack-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java","-jar","app.jar"]
```

```bash
docker build -t logitrack .
docker run -p 8081:8081 \
  -e DB_URL=jdbc:mysql://host.docker.internal:3306/logitrack_db \
  -e DB_USERNAME=root \
  -e DB_PASSWORD=tu_password \
  logitrack
```

---

## 📸 Capturas de Pantalla

### Swagger UI

Accede a `http://localhost:8081/swagger-ui.html` para ver la documentación interactiva:

![Swagger UI](docs/screenshots/swagger-ui.png)

### Frontend Dashboard

![Dashboard](docs/screenshots/dashboard.png)

### Gestión de Movimientos

![Movimientos](docs/screenshots/movimientos.png)

### Reportes

![Reportes](docs/screenshots/reportes.png)

**Nota:** Las capturas están disponibles en la carpeta `docs/screenshots/`

---

## ✅ Validaciones Implementadas

### Nivel de Entidad (Bean Validation)

- `@NotNull`, `@NotBlank`: Campos obligatorios
- `@Size(min, max)`: Longitud de cadenas
- `@Min`, `@Max`: Rangos numéricos
- `@DecimalMin`, `@Digits`: Validación de precios
- `@Email`: Formato de email
- `@Pattern`: Patrones regex (ej: cédula)
- `@Column(unique=true)`: Unicidad

### Nivel de Negocio

- Stock suficiente para salidas y transferencias
- Bodegas correctas según tipo de movimiento (ENTRADA, SALIDA, TRANSFERENCIA)
- Capacidad máxima de bodega no excedida
- Producto existe en inventario de bodega
- Bodegas diferentes en transferencias
- Usuario autenticado pertenece a la misma empresa

### Nivel de Base de Datos

- Constraints `CHECK` (stock >= 0, capacidad > 0, etc.)
- Foreign Keys con `ON DELETE` configurado
- Unique constraints compuestos
- Triggers para actualización de timestamps

---

## 🔍 Solución de Problemas

### Error: Can't connect to MySQL server

```bash
# Verificar que MySQL esté corriendo
mysql -u root -p

# Iniciar MySQL (Linux/Mac)
sudo systemctl start mysql

# Iniciar MySQL (Windows)
net start MySQL80
```

### Error: Port 8081 already in use

```bash
# Cambiar puerto en application.properties
server.port=8082

# O usar variable de entorno
export PORT=8082
./mvnw spring-boot:run
```

### Error: Table doesn't exist

Verifica que `spring.sql.init.mode=always` esté en `application.properties` y que los archivos `schema.sql` y `data.sql` existan en `src/main/resources/`.

### Error: Unauthorized (401)

- Verifica que el token JWT esté presente en el header `Authorization`
- Formato correcto: `Bearer <token>`
- Verifica que el token no haya expirado (validez: 1 hora)

### Error: Access Denied (403)

- Verifica que tu usuario tenga el rol adecuado (ADMIN/EMPLEADO)
- Algunos endpoints requieren rol ADMIN (ej: crear bodegas, ver auditoría)

---

## 📊 Métricas del Proyecto

- **Líneas de código (backend)**: ~8,000+
- **Controladores REST**: 9
- **Servicios**: 9
- **Repositorios JPA**: 8
- **Entidades**: 10
- **Endpoints documentados**: 37+
- **Tablas de BD**: 8
- **Vistas frontend**: 10
- **Cobertura de requisitos**: 100%

---

## 🤝 Integrante y contacto
 
- **Juan Jose Arrublas**: `https://github.com/arrublas1208`
- **Isabela Carrillo**: `https://github.com/Isabela-CA`
- **Carlos Cisneros**: `https://github.com/Carloscisneroides`

---

## 📞 Contacto y Soporte

- **Swagger UI**: `http://localhost:8081/swagger-ui.html`
- **OpenAPI Spec**: `http://localhost:8081/v3/api-docs`
- **Documentación adicional**: Ver archivos en carpeta `docs/`

---



## 🎯 Roadmap Futuro

### Mejoras Planificadas

- [ ] Exportación de reportes a Excel/PDF
- [ ] Notificaciones por email en stock bajo
- [ ] Dashboard con gráficos estadísticos
- [ ] Sistema de firmas digitales para movimientos
- [ ] Backup automático de base de datos
- [ ] API webhooks para integraciones
- [ ] Módulo de proveedores
- [ ] Módulo de clientes
- [ ] Sistema de órdenes de compra
- [ ] Integración con ERPs externos

---

## 🏆 Estado del Proyecto

**✅ Proyecto Completo y Operativo**

- ✅ 100% de requisitos funcionales implementados
- ✅ 8 entidades con auditoría automática
- ✅ 37+ endpoints documentados
- ✅ Autenticación JWT funcionando
- ✅ Frontend React moderno integrado
- ✅ Base de datos con datos de prueba
- ✅ Validaciones exhaustivas en todos los niveles
- ✅ Documentación completa con Swagger
- ✅ Scripts SQL idempotentes
- ✅ Manejo global de excepciones
- ✅ CORS configurado
- ✅ Listo para producción

---

<div align="center">

**Hecho con ❤️ por el equipo de LogiTrack**

[⬆ Volver arriba](#logitrack---sistema-de-gestión-de-bodegas-e-inventario)

</div>
