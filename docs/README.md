# Documentación LogiTrack

Bienvenido a la documentación técnica del sistema LogiTrack.

## 📚 Documentos Disponibles

### 1. [Diagrama de Clases](DIAGRAMA_CLASES.md)
Diagrama UML completo de todas las entidades del dominio, sus relaciones, métodos y validaciones. Incluye:
- Diagrama de clases con Mermaid
- Descripción detallada de cada entidad
- Enumeraciones (Rol, TipoMovimiento, TipoOperacion)
- Patrones de diseño utilizados
- Diagrama de secuencia de operaciones clave
- Validaciones por capa

### 2. [Arquitectura del Sistema](ARQUITECTURA.md)
Descripción completa de la arquitectura en capas del sistema. Incluye:
- Arquitectura general del sistema
- Arquitectura en capas detallada
- Flujo de peticiones HTTP completo
- Componentes principales por capa
- Patrones arquitectónicos implementados
- Diagrama de despliegue
- Flujo de autenticación JWT
- Configuración de CORS
- Métricas y consideraciones de rendimiento

### 3. [Diagrama de Base de Datos](DIAGRAMA_BD.md)
Esquema completo de la base de datos MySQL. Incluye:
- Diagrama Entidad-Relación (ERD)
- Descripción detallada de las 8 tablas
- Relaciones y cardinalidades
- Constraints y validaciones
- Triggers implementados
- Estrategia de índices
- Scripts SQL de creación
- Diagrama de flujo de datos
- Estrategia de backup
- Estimación de tamaño de tablas

### 4. [Capturas de Pantalla](screenshots/)
Carpeta que contiene (o debe contener) las capturas de pantalla del sistema:
- Swagger UI
- Dashboard del frontend
- Gestión de movimientos
- Reportes
- Auditoría
- Login
- Inventario

---

## 🚀 Inicio Rápido

Si es tu primera vez con LogiTrack, sigue este orden:

1. **[README principal](../README.md)**: Descripción general, instalación y configuración
2. **[Arquitectura](ARQUITECTURA.md)**: Entender cómo funciona el sistema
3. **[Diagrama de Base de Datos](DIAGRAMA_BD.md)**: Conocer el modelo de datos
4. **[Diagrama de Clases](DIAGRAMA_CLASES.md)**: Profundizar en las entidades

---

## 📖 Navegación

Todos los documentos están interconectados y tienen un enlace "Volver al README principal" al final.

**Formatos de Diagramas:**
- Los diagramas están escritos en **Mermaid**, un lenguaje de diagramas compatible con Markdown
- Se visualizan automáticamente en GitHub, VS Code (con extensión), y la mayoría de visualizadores Markdown modernos

---

## 🔗 Enlaces Externos

- [README Principal del Proyecto](../README.md)
- [Swagger UI Local](http://localhost:8081/swagger-ui.html) (requiere backend corriendo)
- [OpenAPI Spec](http://localhost:8081/v3/api-docs) (requiere backend corriendo)

---

## 📝 Contribuir a la Documentación

Si encuentras errores o deseas mejorar la documentación:

1. Edita el archivo Markdown correspondiente
2. Asegúrate de que los diagramas Mermaid sigan siendo válidos
3. Verifica los enlaces internos
4. Actualiza este índice si agregas nuevos documentos

---

## 🛠️ Herramientas Recomendadas

### Visualizadores de Mermaid
- [Mermaid Live Editor](https://mermaid.live/) - Editor online
- VS Code: Extensión "Markdown Preview Mermaid Support"
- IntelliJ IDEA: Plugin "Mermaid"

### Editores de Markdown
- VS Code (recomendado)
- IntelliJ IDEA / WebStorm
- Typora
- Obsidian

---

[⬅ Volver al README principal](../README.md)
