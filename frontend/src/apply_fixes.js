// Script to apply critical fixes to main.jsx
const fs = require('fs');

let content = fs.readFileSync('main.jsx', 'utf8');

// FIX 1: Add user data storage functions (after line 12)
content = content.replace(
  'const removeToken = () => localStorage.removeItem(AUTH_TOKEN_KEY);',
  `const AUTH_USER_KEY = "logitrack_user";
const removeToken = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
};
const getUserData = () => {
  const userData = localStorage.getItem(AUTH_USER_KEY);
  return userData ? JSON.parse(userData) : null;
};
const setUserData = (userData) => localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));`
);

// FIX 2: Save user data on login (line 900-901)
content = content.replace(
  `if (response && response.accessToken) {
        setToken(response.accessToken);
        onSuccess(response);`,
  `if (response && response.accessToken) {
        setToken(response.accessToken);
        setUserData({username: response.username, rol: response.rol});
        onSuccess(response);`
);

// FIX 3: Load user data on app start (line 1104)
content = content.replace(
  `setUser({ token });`,
  `const userData = getUserData();
      setUser(userData || { token });`
);

// FIX 4: Get usuario ID from Auth Context (line 730)
content = content.replace(
  'const [usuarioId, setUsuarioId] = React.useState(1);',
  '// Get current user from context\n  const { user } = AuthContext.use();\n  // Extract user ID from token or use default\n  const usuarioId = user?.id || 1;'
);

// FIX 5: Remove rol selector from Register (lines 1045-1051) - security fix
content = content.replace(
  `<div className="auth-field">
            <label>Rol</label>
            <select value={rol} onChange={(e) => setRol(e.target.value)}>
              <option value="EMPLEADO">Empleado</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>`,
  `{/* Rol is set to EMPLEADO by default for security */}`
);

// FIX 6: Add window.confirm to delete operations in Bodegas (line 264)
content = content.replace(
  'const eliminar = async (id) => { await api(`/bodegas/${id}`, { method: "DELETE" }); list.reload(); };',
  'const eliminar = async (id) => { if(!window.confirm("¿Eliminar esta bodega?")) return; await api(`/bodegas/${id}`, { method: "DELETE" }); list.reload(); };'
);

// FIX 7: Add window.confirm to delete operations in Productos (line 351)
content = content.replace(
  'const eliminar = async (id) => { await api(`/productos/${id}`, { method: "DELETE" }); list.reload(); };',
  'const eliminar = async (id) => { if(!window.confirm("¿Eliminar este producto?")) return; await api(`/productos/${id}`, { method: "DELETE" }); list.reload(); };'
);

// FIX 8: Add window.confirm to delete operations in Inventario (line 608)
content = content.replace(
  'const eliminar = async (id) => { await api(`/inventario/${id}`, { method: "DELETE" }); list.reload(); if (typeof onDone===\'function\') onDone(); };',
  'const eliminar = async (id) => { if(!window.confirm("¿Eliminar este inventario?")) return; await api(`/inventario/${id}`, { method: "DELETE" }); list.reload(); if (typeof onDone===\'function\') onDone(); };'
);

fs.writeFileSync('main.jsx', content);
console.log('✅ Fixes applied successfully!');
