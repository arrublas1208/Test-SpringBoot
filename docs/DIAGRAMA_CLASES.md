# Diagrama de Clases - LogiTrack

Este diagrama muestra las principales entidades del dominio y sus relaciones en el sistema LogiTrack.

## Diagrama UML de Clases

```mermaid
classDiagram
    class Empresa {
        +Long id
        +String nombre
        +List~Usuario~ usuarios
        +List~Bodega~ bodegas
        +List~Producto~ productos
    }

    class Usuario {
        +Long id
        +String username
        +String password
        +Rol rol
        +String nombreCompleto
        +String email
        +String cedula
        +Empresa empresa
        +List~Movimiento~ movimientos
        +List~Auditoria~ auditorias
        +Collection~GrantedAuthority~ getAuthorities()
    }

    class Bodega {
        +Long id
        +String nombre
        +String ubicacion
        +Integer capacidad
        +Usuario encargado
        +Empresa empresa
        +List~InventarioBodega~ inventarios
        +List~Movimiento~ movimientosOrigen
        +List~Movimiento~ movimientosDestino
    }

    class Producto {
        +Long id
        +String nombre
        +String categoria
        +Integer stock
        +BigDecimal precio
        +Empresa empresa
        +List~InventarioBodega~ inventarios
        +List~MovimientoDetalle~ detallesMovimiento
    }

    class InventarioBodega {
        +Long id
        +Bodega bodega
        +Producto producto
        +Integer stock
        +Integer stockMinimo
        +Integer stockMaximo
        +LocalDateTime ultimaActualizacion
        +boolean isStockBajo()
        +boolean isStockAlto()
        +Integer getEspacioDisponible()
        +Integer getDeficitStock()
        +void actualizarTimestamp()
    }

    class Movimiento {
        +Long id
        +LocalDateTime fecha
        +TipoMovimiento tipo
        +Usuario usuario
        +Bodega bodegaOrigen
        +Bodega bodegaDestino
        +String observaciones
        +List~MovimientoDetalle~ detalles
        +boolean isEntrada()
        +boolean isSalida()
        +boolean isTransferencia()
    }

    class MovimientoDetalle {
        +Long id
        +Movimiento movimiento
        +Producto producto
        +Integer cantidad
    }

    class Auditoria {
        +Long id
        +TipoOperacion operacion
        +LocalDateTime fecha
        +Usuario usuario
        +String entidad
        +Long entidadId
        +String valoresAnteriores
        +String valoresNuevos
    }

    class Rol {
        <<enumeration>>
        ADMIN
        EMPLEADO
    }

    class TipoMovimiento {
        <<enumeration>>
        ENTRADA
        SALIDA
        TRANSFERENCIA
    }

    class TipoOperacion {
        <<enumeration>>
        INSERT
        UPDATE
        DELETE
    }

    %% Relaciones Empresa
    Empresa "1" --> "*" Usuario : tiene
    Empresa "1" --> "*" Bodega : posee
    Empresa "1" --> "*" Producto : gestiona

    %% Relaciones Usuario
    Usuario "*" --> "1" Empresa : pertenece
    Usuario "1" --> "*" Movimiento : realiza
    Usuario "1" --> "*" Auditoria : genera
    Usuario --> Rol : tiene
    Usuario "1" --> "*" Bodega : encarga

    %% Relaciones Bodega
    Bodega "*" --> "1" Empresa : pertenece
    Bodega "*" --> "1" Usuario : encargado
    Bodega "1" --> "*" InventarioBodega : contiene
    Bodega "1" --> "*" Movimiento : origen
    Bodega "1" --> "*" Movimiento : destino

    %% Relaciones Producto
    Producto "*" --> "1" Empresa : pertenece
    Producto "1" --> "*" InventarioBodega : almacenado
    Producto "1" --> "*" MovimientoDetalle : incluido

    %% Relaciones InventarioBodega
    InventarioBodega "*" --> "1" Bodega : ubicado
    InventarioBodega "*" --> "1" Producto : referencia

    %% Relaciones Movimiento
    Movimiento "*" --> "1" Usuario : ejecutado por
    Movimiento "*" --> "0..1" Bodega : desde
    Movimiento "*" --> "0..1" Bodega : hacia
    Movimiento --> TipoMovimiento : tipo
    Movimiento "1" --> "*" MovimientoDetalle : contiene

    %% Relaciones MovimientoDetalle
    MovimientoDetalle "*" --> "1" Movimiento : pertenece
    MovimientoDetalle "*" --> "1" Producto : incluye

    %% Relaciones Auditoria
    Auditoria "*" --> "1" Usuario : realizada por
    Auditoria --> TipoOperacion : tipo
```

## Descripción de las Clases Principales

### Entidades de Negocio

#### Empresa
- **Propósito**: Multitenancy, permite aislar datos por empresa
- **Relaciones**: Contiene Usuarios, Bodegas y Productos
- **Validaciones**: Nombre único, no nulo

#### Usuario
- **Propósito**: Usuarios del sistema con autenticación
- **Roles**: ADMIN o EMPLEADO
- **Seguridad**: Implementa UserDetails para Spring Security
- **Validaciones**: Username único, email válido, contraseña BCrypt
- **Campos especiales**:
  - `cedula`: Identificación única (6-20 dígitos)
  - `password`: Hash BCrypt

#### Bodega
- **Propósito**: Almacenes físicos distribuidos geográficamente
- **Campos clave**:
  - `ubicacion`: Dirección física
  - `capacidad`: Máxima cantidad de productos
  - `encargado`: Usuario responsable
- **Validaciones**: Capacidad > 0, nombre único por empresa

#### Producto
- **Propósito**: Catálogo de productos comercializados
- **Campos clave**:
  - `categoria`: Clasificación del producto
  - `stock`: Stock global (calculado)
  - `precio`: Precio unitario
- **Validaciones**: Precio >= 0.01, stock >= 0, nombre único por empresa

#### InventarioBodega
- **Propósito**: Stock real de cada producto en cada bodega
- **Campos clave**:
  - `stock`: Cantidad actual
  - `stockMinimo`: Umbral para alertas
  - `stockMaximo`: Capacidad máxima
- **Métodos útiles**:
  - `isStockBajo()`: Stock < stockMinimo
  - `isStockAlto()`: Stock > stockMaximo
  - `getEspacioDisponible()`: stockMaximo - stock
- **Validaciones**: Stock >= 0, unique(bodega, producto)

#### Movimiento
- **Propósito**: Registro de transacciones de inventario
- **Tipos**:
  - `ENTRADA`: bodegaOrigen = null, bodegaDestino != null
  - `SALIDA`: bodegaOrigen != null, bodegaDestino = null
  - `TRANSFERENCIA`: ambas bodegas != null
- **Actualización automática**: Modifica InventarioBodega al crearse
- **Validaciones**: Lógica según tipo, stock suficiente

#### MovimientoDetalle
- **Propósito**: Productos incluidos en cada movimiento
- **Campos**: Producto, cantidad
- **Validaciones**: Cantidad > 0, unique(movimiento, producto)

#### Auditoria
- **Propósito**: Trazabilidad completa de cambios
- **Tipos de operación**: INSERT, UPDATE, DELETE
- **Registro automático**: Via @EntityListeners
- **Campos JSON**:
  - `valoresAnteriores`: Serialización del objeto antes del cambio
  - `valoresNuevos`: Serialización del objeto después del cambio

### Enumeraciones

#### Rol
- `ADMIN`: Acceso completo al sistema
- `EMPLEADO`: Acceso limitado a operaciones

#### TipoMovimiento
- `ENTRADA`: Ingreso de mercancía desde proveedor
- `SALIDA`: Despacho de mercancía a cliente
- `TRANSFERENCIA`: Movimiento entre bodegas

#### TipoOperacion
- `INSERT`: Creación de registro
- `UPDATE`: Modificación de registro
- `DELETE`: Eliminación de registro

## Patrones de Diseño Utilizados

### 1. Repository Pattern
- Interfaces que extienden `JpaRepository<T, ID>`
- Abstracción del acceso a datos
- Métodos de consulta personalizados

### 2. Service Layer Pattern
- Capa de lógica de negocio independiente
- Transacciones manejadas con `@Transactional`
- Validaciones de negocio

### 3. DTO Pattern
- Objetos de transferencia de datos
- Separación entre entidades y API
- Ejemplos: `LoginRequest`, `MovimientoRequest`, `ReporteResumen`

### 4. Entity Listener Pattern
- `AuditoriaListener` escucha eventos JPA
- Registro automático de auditoría
- Métodos: `@PostPersist`, `@PreUpdate`, `@PreRemove`

### 5. Strategy Pattern (implícito)
- Diferentes estrategias según `TipoMovimiento`
- Validaciones específicas por tipo
- Actualización de inventario según tipo

## Validaciones por Capa

### Nivel de Entidad (Bean Validation)
```java
@NotNull
@NotBlank
@Size(min, max)
@Min, @Max
@DecimalMin
@Email
@Pattern
@Column(unique=true)
```

### Nivel de Negocio (Services)
- Stock suficiente para salidas/transferencias
- Bodegas correctas según tipo de movimiento
- Capacidad de bodega no excedida
- Usuario pertenece a la misma empresa
- Bodegas diferentes en transferencias

### Nivel de Base de Datos
- Constraints CHECK
- Foreign Keys con cascadas
- Unique constraints
- Triggers de actualización

## Diagrama de Secuencia: Crear Movimiento de Transferencia

```mermaid
sequenceDiagram
    actor Usuario
    participant Controller
    participant Service
    participant InventarioService
    participant Repository
    participant AuditoriaListener
    participant Database

    Usuario->>Controller: POST /api/movimientos (TRANSFERENCIA)
    Controller->>Service: crearMovimiento(request)

    Service->>Service: Validar tipo = TRANSFERENCIA
    Service->>Service: Validar bodegas diferentes
    Service->>Repository: findById(bodegaOrigen)
    Repository-->>Service: Bodega origen
    Service->>Repository: findById(bodegaDestino)
    Repository-->>Service: Bodega destino

    Service->>InventarioService: validarYActualizarStock()
    InventarioService->>Repository: getInventario(origen, producto)
    Repository-->>InventarioService: Inventario origen
    InventarioService->>InventarioService: Validar stock >= cantidad
    InventarioService->>Repository: getInventario(destino, producto)
    Repository-->>InventarioService: Inventario destino

    InventarioService->>Repository: save(inventarioOrigen - cantidad)
    Repository->>AuditoriaListener: @PreUpdate
    AuditoriaListener->>Database: INSERT auditoria (UPDATE)
    Repository-->>InventarioService: OK

    InventarioService->>Repository: save(inventarioDestino + cantidad)
    Repository->>AuditoriaListener: @PreUpdate
    AuditoriaListener->>Database: INSERT auditoria (UPDATE)
    Repository-->>InventarioService: OK

    InventarioService-->>Service: Stock actualizado

    Service->>Repository: save(movimiento)
    Repository->>AuditoriaListener: @PostPersist
    AuditoriaListener->>Database: INSERT auditoria (INSERT)
    Repository-->>Service: Movimiento guardado

    Service-->>Controller: MovimientoResponse
    Controller-->>Usuario: 201 Created + Movimiento
```

## Notas de Implementación

### Auditoría Automática
Todas las entidades principales tienen `@EntityListeners(AuditoriaListener.class)`:
- Bodega
- Producto
- Usuario
- InventarioBodega
- Movimiento
- MovimientoDetalle
- Auditoria (auto-auditoría)
- Empresa

### Lazy vs Eager Loading
- **Eager**: Relaciones frecuentemente accedidas (Usuario en Bodega, Producto en InventarioBodega)
- **Lazy**: Relaciones grandes o poco frecuentes (listas de movimientos, detalles)

### Índices de Base de Datos
- Primary Keys: Automáticos
- Foreign Keys: Automáticos
- Unique constraints: (bodega_id, producto_id) en inventario_bodega
- Unique constraints: (movimiento_id, producto_id) en movimiento_detalle

### Transaccionalidad
- Servicios marcados con `@Transactional`
- Rollback automático en excepciones
- Aislamiento de transacciones por empresa

---

[⬅ Volver al README principal](../README.md)
