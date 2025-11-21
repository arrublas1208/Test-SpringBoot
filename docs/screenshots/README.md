# Screenshots - LogiTrack

Esta carpeta contiene las capturas de pantalla del sistema LogiTrack.

## Capturas Requeridas

Para completar la documentación, agrega las siguientes capturas de pantalla:

### 1. swagger-ui.png
**Descripción**: Captura de la interfaz de Swagger UI mostrando los endpoints documentados.

**Cómo obtenerla**:
1. Ejecuta el backend: `./mvnw spring-boot:run`
2. Accede a: `http://localhost:8081/swagger-ui.html`
3. Toma una captura de pantalla completa de la página

**Contenido sugerido**:
- Vista general de todos los controladores (tags)
- Al menos un endpoint expandido mostrando parámetros
- El botón "Authorize" visible

---

### 2. dashboard.png
**Descripción**: Captura del dashboard principal del frontend.

**Cómo obtenerla**:
1. Ejecuta el backend y frontend
2. Inicia sesión con usuario admin
3. Navega al Dashboard
4. Toma una captura mostrando:
   - Contadores (bodegas, productos, stock bajo, movimientos)
   - Tabla de últimos movimientos
   - Gráficos o resúmenes

---

### 3. movimientos.png
**Descripción**: Captura de la vista de gestión de movimientos.

**Cómo obtenerla**:
1. Navega a la sección "Movimientos"
2. Muestra el formulario de creación o la lista de movimientos
3. Captura mostrando:
   - Filtros de búsqueda
   - Lista de movimientos con tipos (ENTRADA/SALIDA/TRANSFERENCIA)
   - Detalles de productos

---

### 4. reportes.png
**Descripción**: Captura de la vista de reportes.

**Cómo obtenerla**:
1. Navega a la sección "Reportes"
2. Toma una captura mostrando:
   - Resumen de stock bajo
   - Stock por bodega
   - Productos más movidos
   - Filtros y controles

---

### 5. auditoria.png (Opcional)
**Descripción**: Captura de la vista de auditoría (solo ADMIN).

**Cómo obtenerla**:
1. Inicia sesión como admin
2. Navega a "Auditoría"
3. Muestra el historial de cambios con operaciones INSERT/UPDATE/DELETE

---

### 6. login.png (Opcional)
**Descripción**: Captura de la pantalla de login.

---

### 7. inventario.png (Opcional)
**Descripción**: Captura de la vista de inventario por bodegas.

---

## Formato Recomendado

- **Formato**: PNG (mejor calidad) o JPG
- **Resolución**: 1920x1080 o superior
- **Tamaño**: < 2 MB por imagen
- **Nombres**: Usar los nombres exactos mencionados arriba

## Herramientas Sugeridas

- **Windows**: Recortes (Win + Shift + S)
- **Mac**: Cmd + Shift + 4
- **Linux**: gnome-screenshot o Flameshot

## Notas

- Las capturas deben mostrar datos reales del sistema
- Evitar información sensible (contraseñas, datos personales reales)
- Usar los datos de prueba incluidos en `data.sql`
- Asegúrate de que las capturas sean claras y legibles

---

Una vez agregadas las capturas, elimina este archivo README.md de la carpeta screenshots.
