import React from 'react'
import ReactDOM from 'react-dom/client'
import './style.css'
import { Icon } from './icons.jsx'
import { t } from './i18n.js'

const segs = window.location.pathname.split('/').filter(Boolean);
const ctx = segs.length ? ('/' + segs[0] + '/') : '/';
const API_BASE = window.location.origin + ctx + "api";

// Auth utilities
const AUTH_USER_KEY = "logitrack_user";
const AUTH_TOKEN_KEY = "logitrack_jwt";
const getToken = () => localStorage.getItem(AUTH_TOKEN_KEY);
const setToken = (token) => localStorage.setItem(AUTH_TOKEN_KEY, token);
const removeToken = () => { localStorage.removeItem(AUTH_TOKEN_KEY); localStorage.removeItem(AUTH_USER_KEY); };
const getUserData = () => { const userData = localStorage.getItem(AUTH_USER_KEY); return userData ? JSON.parse(userData) : null; };
const setUserData = (userData) => localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
function parseJwt(token) { try { const base64 = token.split('.')[1]; const json = JSON.parse(atob(base64)); return json; } catch (_) { return null; } }

async function api(path, options = {}) {
  const controller = new AbortController();
  const timeout = options.timeoutMs != null ? options.timeoutMs : 15000;
  const id = setTimeout(() => controller.abort(), timeout);
  const merged = Object.assign({
    headers: { "Content-Type": "application/json" }
  }, options || {});

  // Add Authorization header if token exists
  const token = getToken();
  if (token) {
    merged.headers["Authorization"] = `Bearer ${token}`;
  }

  merged.signal = merged.signal || controller.signal;
  try {
    const res = await fetch(API_BASE + path, merged);
    if (!res.ok) {
      // Handle 401 Unauthorized
      if (res.status === 401) {
        removeToken();
        window.location.reload();
      }
      let errObj = null;
      try { errObj = await res.json(); } catch (_) { errObj = { message: res.statusText }; }
      const msg = (errObj && errObj.details && errObj.details.message) || (errObj && errObj.message) || ("Error " + res.status);
      throw new Error(msg);
    }
    if (res.status === 204) return null;
    return await res.json();
  } finally {
    clearTimeout(id);
  }
}

function useFetch(getter, deps = []) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const current = React.useRef(null);
  const run = React.useCallback(async () => {
    if (current.current) current.current.abort();
    const ac = new AbortController();
    current.current = ac;
    setLoading(true);
    setError(null);
    try {
      const next = await getter(ac.signal);
      setData(next);
    } catch (e) {
      if (e.name !== 'AbortError') setError(e);
    } finally {
      setLoading(false);
    }
  }, deps);
  React.useEffect(() => { run(); return () => { if (current.current) current.current.abort(); }; }, [run]);
  return { data, loading, error, reload: run };
}

const SearchContext = {
  Context: React.createContext({ query: "", setQuery: () => {} }),
  use() { return React.useContext(this.Context); }
};

const AuthContext = {
  Context: React.createContext({ user: null, setUser: () => {}, logout: () => {} }),
  use() { return React.useContext(this.Context); }
};

const ThemeContext = {
  Context: React.createContext({ darkMode: false, toggleDarkMode: () => {} }),
  use() { return React.useContext(this.Context); }
};

function normalize(v) { return (v == null ? "" : v).toString().toLowerCase(); }

function Sidebar({ route, setRoute }) {
  const { logout, user } = AuthContext.use();
  const items = [
    { key: "dashboard", label: t('dashboard'), icon: "chart-line" },
    { key: "bodegas", label: t('bodegas'), icon: "warehouse" },
    { key: "productos", label: t('productos'), icon: "box" },
    { key: "movimientos", label: t('movimientos'), icon: "arrows-left-right" },
    { key: "inventario", label: t('inventario'), icon: "clipboard-list" },
    { key: "proveedores", label: "Proveedores", icon: "building" },
    { key: "ordenes", label: "Órdenes", icon: "file-invoice" },
    { key: "lotes", label: "Lotes", icon: "barcode" },
    { key: "devoluciones", label: "Devoluciones", icon: "rotate-left" },
    { key: "notificaciones", label: "Alertas", icon: "bell" },
    { key: "reportes", label: t('reportes'), icon: "file-lines" },
    { key: "auditoria", label: t('auditoria'), icon: "list-check" },
    ...(user?.rol === 'ADMIN' ? [{ key: "usuarios", label: "Usuarios", icon: "user-plus" }] : [])
  ];
  return (
    <aside className="sidebar">
      <div className="brand">LT</div>
      <div className="nav">
        {items.map(it => (
          <button key={it.key} className={route===it.key?"active":""} onClick={() => setRoute(it.key)}>
            <Icon name={it.icon} /> {it.label}
          </button>
        ))}
        <button onClick={logout} style={{marginTop: 'auto', borderTop: '1px solid rgba(56, 248, 182, 0.25)'}}>
          <Icon name="arrow-right-from-bracket" /> Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

function Header({ title, right }) {
  const { query, setQuery } = SearchContext.use();
  const { user } = AuthContext.use();
  const { darkMode, toggleDarkMode } = ThemeContext.use();
  return (
    <div className="header">
      <div className="search-box"><input placeholder={t('buscar')} value={query} onChange={e=>setQuery(e.target.value)} /></div>
      <div className="toolbar">
        <button onClick={toggleDarkMode} className="theme-toggle" title={darkMode ? "Modo claro" : "Modo oscuro"}>
          <Icon name={darkMode ? "sun" : "moon"} />
        </button>
        <span className="profile" style={{display: 'flex', alignItems: 'center', gap: '8px'}}><span>👤</span><span>{user?.username || 'Usuario'}</span></span>
        {right}
      </div>
    </div>
  );
}

function Loading() { return <div className="panel"><div className="panel-body" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '32px'}}><div className="spinner"></div><span>{t('cargando')}</span></div></div>; }
function ErrorState({ error, onRetry }) { return <div className="panel"><div className="panel-body">{String(error && error.message || t('error'))}<div className="form actions"><button className="btn" onClick={onRetry}><Icon name="rotate" />{t('reintentar')}</button></div></div></div>; }
function EmptyState({ message }) { return <div className="panel"><div className="panel-body empty-state"><div style={{fontSize: '48px', opacity: 0.3, marginBottom: '16px'}}>📦</div><div>{message || t('sin_datos')}</div></div></div>; }

function Dashboard() {
  const resumen = useFetch((signal) => api("/reportes/resumen", { signal }), []);
  const ultimos = useFetch((signal) => api("/reportes/movimientos/ultimos", { signal }), []);
  const bodegas = useFetch((signal) => api("/bodegas", { signal }), []);
  const productos = useFetch((signal) => api("/productos", { signal }), []);

  const refreshAll = () => {
    resumen.reload();
    ultimos.reload();
    bodegas.reload();
    productos.reload();
  };

  return (
    <div>
      <Header title={t('dashboard')} right={<>
        <span className="status">{t('actualizado')}</span>
        <button className="btn" onClick={refreshAll}><Icon name="rotate" /> Actualizar todo</button>
      </>} />
      <div className="cards">
        <div className="card"><div className="label">{t('bodegas')}</div><div className="value">{bodegas.loading ? <div className="spinner-small"></div> : (Array.isArray(bodegas.data) ? bodegas.data.length : '—')}</div></div>
        <div className="card"><div className="label">{t('productos')}</div><div className="value">{productos.loading ? <div className="spinner-small"></div> : (() => {
          if (Array.isArray(productos.data)) return productos.data.length;
          if (productos.data && typeof productos.data.totalElements === 'number') return productos.data.totalElements;
          if (productos.data && Array.isArray(productos.data.content)) return productos.data.content.length;
          return '—';
        })()}</div></div>
        <div className="card"><div className="label">{t('stock_bajo')}</div><div className="value">{(!resumen.loading && resumen.data && Array.isArray(resumen.data.stockBajo)) ? resumen.data.stockBajo.length : (resumen.loading ? <div className="spinner-small"></div> : '0')}</div></div>
        <div className="card"><div className="label">{t('ultimos_mov')}</div><div className="value">{ultimos.loading ? <div className="spinner-small"></div> : (Array.isArray(ultimos.data) ? ultimos.data.length : '0')}</div></div>
      </div>
      <div className="panel mt-16">
        <div className="panel-header"><strong>{t('ultimos_mov')}</strong>
          <button className="btn secondary" onClick={ultimos.reload} disabled={ultimos.loading}><Icon name="rotate" />{t('refrescar')}</button>
        </div>
        <div className="panel-body">
          {ultimos.loading && <Loading/>}
          {ultimos.error && <ErrorState error={ultimos.error} onRetry={ultimos.reload} />}
          {!ultimos.loading && !ultimos.error && (Array.isArray(ultimos.data) && ultimos.data.length === 0) && <EmptyState/>}
          {!ultimos.loading && !ultimos.error && Array.isArray(ultimos.data) && ultimos.data.length > 0 && <MovimientosTable movimientos={ultimos.data || []} />}
        </div>
      </div>
      <div className="grid-2 mt-16">
        <div className="panel">
          <div className="panel-header"><strong>{t('top_productos')}</strong>
            <button className="btn secondary" onClick={resumen.reload} disabled={resumen.loading}><Icon name="rotate" />{t('refrescar')}</button>
          </div>
          <div className="panel-body">
            <TopProductos />
          </div>
        </div>
        <div className="panel">
          <div className="panel-header"><strong>{t('stock_por_bodega')}</strong>
            <button className="btn secondary" onClick={resumen.reload} disabled={resumen.loading}><Icon name="rotate" />{t('refrescar')}</button>
          </div>
          <div className="panel-body">
            <StockPorBodega resumen={resumen.data} loading={resumen.loading} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MovimientosTable({ movimientos, onDelete }) {
  const { query } = SearchContext.use();
  const q = normalize(query);
  const filtered = React.useMemo(() => {
    return (movimientos||[]).filter(m => {
      const base = [m.usuario, m.tipo, m.bodegaOrigen, m.bodegaDestino].map(normalize).join(" ");
      const dets = (m.detalles||[]).map(d=>[d.producto, d.cantidad].map(normalize).join(" ")).join(" ");
      return (base + " " + dets).includes(q);
    });
  }, [movimientos, q]);
  return (
    <table>
      <thead>
        <tr>
          <th>Fecha</th><th>Tipo</th><th>Usuario</th><th>Producto</th><th>Cantidad</th><th>Origen</th><th>Destino</th><th></th>
        </tr>
      </thead>
      <tbody>
        {filtered.map(m => (
          (m.detalles && m.detalles.length) ? m.detalles.map((d,i)=>(
            <tr key={m.id+"-"+i}>
              <td>{new Date(m.fecha).toLocaleString()}</td>
              <td><span className={`badge ${m.tipo==='ENTRADA'?'success':(m.tipo==='SALIDA'?'danger':'info')}`}>{m.tipo}</span></td>
              <td>{m.usuario}</td>
              <td>{d.producto}</td>
              <td>{d.cantidad}</td>
              <td>{m.bodegaOrigen || '—'}</td>
              <td>{m.bodegaDestino || '—'}</td>
              <td>{onDelete && i===0 ? (<button className="btn danger" onClick={()=>onDelete(m.id)}><Icon name="trash" />{t('eliminar')}</button>) : null}</td>
            </tr>
          )) : (
            <tr key={m.id}>
              <td>{new Date(m.fecha).toLocaleString()}</td>
              <td>{m.tipo}</td>
              <td>{m.usuario}</td>
              <td>—</td><td>—</td>
              <td>{m.bodegaOrigen || '—'}</td>
              <td>{m.bodegaDestino || '—'}</td>
              <td>{onDelete ? (<button className="btn danger" onClick={()=>onDelete(m.id)}><Icon name="trash" />{t('eliminar')}</button>) : null}</td>
            </tr>
          )
        ))}
      </tbody>
    </table>
  );
}

function TopProductos() {
  const { data, loading, error, reload } = useFetch((signal) => api("/reportes/movimientos/top-productos", { signal }), []);
  return (
    <table>
      <thead><tr><th>Producto</th><th>Total movido</th></tr></thead>
      <tbody>
        {loading && <tr><td colSpan="2">{t('cargando')}</td></tr>}
        {error && <tr><td colSpan="2">{String(error.message)} <button className="btn" onClick={reload}><Icon name="rotate" />{t('reintentar')}</button></td></tr>}
        {!loading && !error && Array.isArray(data) && data.length === 0 && <tr><td colSpan="2" style={{textAlign:'center', opacity:0.5}}>No hay movimientos registrados</td></tr>}
        {!loading && !error && (data||[]).map((r,i)=> (
          <tr key={i}><td>{r.producto}</td><td>{r.totalMovido}</td></tr>
        ))}
      </tbody>
    </table>
  );
}

function StockPorBodega({ resumen, loading: parentLoading }) {
  const data = (resumen && resumen.stockPorBodega) ? resumen.stockPorBodega : [];
  const loading = parentLoading || !resumen;
  return (
    <table>
      <thead><tr><th>Bodega</th><th>Total productos</th><th>Valor total</th></tr></thead>
      <tbody>
        {loading && <tr><td colSpan="3">{t('cargando')}</td></tr>}
        {!loading && data.length === 0 && <tr><td colSpan="3" style={{textAlign:'center', opacity:0.5}}>No hay bodegas con inventario</td></tr>}
        {!loading && (data||[]).map((r,i)=> (
          <tr key={i}><td>{r.bodega}</td><td>{r.totalProductos}</td><td>${String(r.valorTotal)}</td></tr>
        ))}
      </tbody>
    </table>
  );
}

function BodegasView() {
  const list = useFetch((signal) => api("/bodegas", { signal }), []);
  const usuarios = useFetch((signal) => api("/usuarios/non-admin", { signal }), []);
  const [nombre, setNombre] = React.useState("");
  const [ubicacion, setUbicacion] = React.useState("");
  const [encargadosIds, setEncargadosIds] = React.useState([]);
  const [cedulaEncargado, setCedulaEncargado] = React.useState("");
  const [encargadoNombre, setEncargadoNombre] = React.useState("");
  const [capacidad, setCapacidad] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [editId, setEditId] = React.useState(null);
  const [editNombre, setEditNombre] = React.useState("");
  const [editUbicacion, setEditUbicacion] = React.useState("");
  const [editEncargadosIds, setEditEncargadosIds] = React.useState([]);
  const [editCapacidad, setEditCapacidad] = React.useState("");

  const crear = async () => {
    try {
      const encargados = encargadosIds.map(id => ({ id: Number(id) }));
      const body = { nombre, ubicacion, capacidad: (Number(capacidad) && Number(capacidad) > 0 ? Number(capacidad) : 1), encargados };
      await api("/bodegas", { method: "POST", body: JSON.stringify(body) });
      setNombre(""); setUbicacion(""); setEncargadosIds([]); setCedulaEncargado(""); setEncargadoNombre(""); setCapacidad(""); list.reload(); setStatus("✅ Bodega creada exitosamente");
      setTimeout(() => setStatus(""), 3000);
    } catch (e) {
      const msg = String(e && e.message || "Error");
      setStatus(msg.includes("403") ? "❌ 403 - Acceso restringido a ADMIN" : "❌ " + msg);
      setTimeout(() => setStatus(""), 5000);
    }
  };
  const eliminar = async (id) => { if(!window.confirm("¿Eliminar esta bodega?")) return; await api(`/bodegas/${id}`, { method: "DELETE" }); list.reload(); };
  const startEdit = (b) => {
    setEditId(b.id);
    setEditNombre(b.nombre||"");
    setEditUbicacion(b.ubicacion||"");
    setEditEncargadosIds(Array.isArray(b.encargados) ? b.encargados.map(e => String(e.id)) : []);
    setEditCapacidad(String(b.capacidad||0));
  };
  const cancelEdit = () => { setEditId(null); setEditNombre(""); setEditUbicacion(""); setEditEncargadosIds([]); setEditCapacidad(""); };
  const guardarEdit = async () => {
    try {
      const encargados = editEncargadosIds.map(id => ({ id: Number(id) }));
      await api(`/bodegas/${editId}`, { method: "PUT", body: JSON.stringify({ nombre: editNombre, ubicacion: editUbicacion, capacidad: (Number(editCapacidad)&&Number(editCapacidad)>0?Number(editCapacidad):1), encargados }) });
      list.reload(); cancelEdit();
    } catch (e) {
      setStatus(String(e && e.message || "Error"));
    }
  };

  return (
    <div>
      <Header title={t('bodegas')} right={<><span className="status muted">{status}</span><button className="btn" onClick={list.reload}><Icon name="rotate" />{t('refrescar')}</button></>} />
      <div className="grid-2">
        <div className="panel">
          <div className="panel-header"><strong>{t('crear_bodega')}</strong></div>
          <div className="panel-body">
          <div className="form">
            <div className="field"><label>{t('nombre')}</label><input value={nombre} onChange={e=>setNombre(e.target.value)} /></div>
            <div className="field"><label>{t('ubicacion')}</label><input value={ubicacion} onChange={e=>setUbicacion(e.target.value)} /></div>
            <div className="field" style={{gridColumn:'1/-1'}}><label>{t('encargados')} (seleccione múltiples)</label>
              <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
                {Array.isArray(usuarios.data) && usuarios.data.map(u => (
                  <label key={u.id} style={{display:'flex', alignItems:'center', gap:'4px', padding:'4px 8px', border:'1px solid rgba(56, 248, 182, 0.25)', borderRadius:'4px', cursor:'pointer'}}>
                    <input type="checkbox" checked={encargadosIds.includes(String(u.id))} onChange={e => {
                      if (e.target.checked) {
                        setEncargadosIds([...encargadosIds, String(u.id)]);
                      } else {
                        setEncargadosIds(encargadosIds.filter(id => id !== String(u.id)));
                      }
                    }} />
                    <span>{u.nombreCompleto}</span>
                    {u.empId && <span style={{fontSize:'11px', opacity:0.7}}>({u.empId})</span>}
                  </label>
                ))}
              </div>
            </div>
            <div className="field"><label>Buscar encargado por cédula o ID empleado</label>
              <div style={{display:'flex', gap:'8px'}}>
                <input value={cedulaEncargado} onChange={e=>setCedulaEncargado(e.target.value)} placeholder="Cédula o ID de empleado" />
                <button className="btn" onClick={async ()=>{
                  try {
                    let u = null;
                    // Intentar buscar por cédula primero
                    try {
                      u = await api(`/usuarios/by-cedula/${encodeURIComponent(cedulaEncargado)}`);
                    } catch (_) {
                      // Si falla, intentar por empId
                      try {
                        u = await api(`/usuarios/by-empid/${encodeURIComponent(cedulaEncargado)}`);
                      } catch (_) {}
                    }
                    if (u && u.id) {
                      if (!encargadosIds.includes(String(u.id))) {
                        setEncargadosIds([...encargadosIds, String(u.id)]);
                      }
                      setEncargadoNombre(`${u.nombreCompleto}${u.empId ? ' (' + u.empId + ')' : ''}`);
                    } else {
                      setEncargadoNombre('❌ No encontrado');
                      setTimeout(() => setEncargadoNombre(''), 3000);
                    }
                  } catch(_){
                    setEncargadoNombre('❌ No encontrado');
                    setTimeout(() => setEncargadoNombre(''), 3000);
                  }
                }}><Icon name="magnifying-glass" />Buscar y agregar</button>
              </div>
              {encargadoNombre && <div className="status">{encargadoNombre}</div>}
            </div>
            <div className="field"><label>{t('capacidad')}</label><input type="number" placeholder={t('capacidad')} value={capacidad} onChange={e=>setCapacidad(e.target.value)} /></div>
            <div className="actions"><button className="btn" onClick={crear}><Icon name="plus" />{t('crear')}</button></div>
          </div>
        </div>
      </div>
        <div className="panel">
          <div className="panel-header"><strong>{t('listado')}</strong></div>
          <div className="panel-body">
            {list.loading && <Loading/>}
            {list.error && <ErrorState error={list.error} onRetry={list.reload} />}
            {!list.loading && !list.error && (()=>{
              const arr = Array.isArray(list.data) ? list.data : (list.data && Array.isArray(list.data.content) ? list.data.content : []);
              return arr.length===0;
            })() && <EmptyState/>}
            <table>
              <thead><tr><th>ID</th><th>{t('nombre')}</th><th>{t('ubicacion')}</th><th>{t('encargados')}</th><th>{t('capacidad')}</th><th></th></tr></thead>
              <tbody>
                {(Array.isArray(list.data) ? list.data : (list.data && Array.isArray(list.data.content) ? list.data.content : [])).map(b => (
                  <tr key={b.id}>
                    <td>{b.id}</td>
                    <td>{editId===b.id ? (<input value={editNombre} onChange={e=>setEditNombre(e.target.value)} />) : b.nombre}</td>
                    <td>{editId===b.id ? (<input value={editUbicacion} onChange={e=>setEditUbicacion(e.target.value)} />) : (b.ubicacion||'')}</td>
                    <td>{editId===b.id ? (
                      <div style={{display:'flex', gap:'4px', flexWrap:'wrap'}}>
                        {Array.isArray(usuarios.data) && usuarios.data.map(u => (
                          <label key={u.id} style={{display:'flex', alignItems:'center', gap:'2px', fontSize:'12px'}}>
                            <input type="checkbox" checked={editEncargadosIds.includes(String(u.id))} onChange={e => {
                              if (e.target.checked) {
                                setEditEncargadosIds([...editEncargadosIds, String(u.id)]);
                              } else {
                                setEditEncargadosIds(editEncargadosIds.filter(id => id !== String(u.id)));
                              }
                            }} />
                            {u.nombreCompleto} {u.empId && `(${u.empId})`}
                          </label>
                        ))}
                      </div>
                    ) : (Array.isArray(b.encargados) && b.encargados.length > 0 ? b.encargados.map(e => `${e.nombreCompleto}${e.empId ? ' (' + e.empId + ')' : ''}`).join(', ') : '—')}</td>
                    <td>{editId===b.id ? (<input type="number" value={editCapacidad} onChange={e=>setEditCapacidad(e.target.value)} />) : b.capacidad}</td>
                    <td>{editId===b.id ? (<>
                      <button className="btn" onClick={guardarEdit}><Icon name="check" />{t('guardar')}</button>
                      <button className="btn secondary" onClick={cancelEdit}><Icon name="xmark" />{t('cancelar')}</button>
                    </>) : (<>
                      <button className="btn" onClick={()=>startEdit(b)}><Icon name="pen" />{t('editar')}</button>
                      <button className="btn danger" onClick={()=>eliminar(b.id)}><Icon name="trash" />{t('eliminar')}</button>
                    </>)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductosView() {
  const categorias = useFetch((signal) => api("/categorias", { signal }), []);
  const [categoriaFiltro, setCategoriaFiltro] = React.useState("");
  const [nombreLikeFiltro, setNombreLikeFiltro] = React.useState("");
  const [page, setPage] = React.useState(0);
  const [size, setSize] = React.useState(20);
  const [sort, setSort] = React.useState("nombre,asc");
  const list = useFetch((signal) => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('size', String(size));
    params.set('sort', sort);
    if (categoriaFiltro) params.set('categoria', categoriaFiltro);
    if (nombreLikeFiltro) params.set('nombreLike', nombreLikeFiltro);
    return api(`/productos?${params.toString()}`, { signal });
  }, [categoriaFiltro, nombreLikeFiltro, page, size, sort]);
  const [nombre, setNombre] = React.useState("");
  const [categoria, setCategoria] = React.useState("");
  const [nuevaCategoria, setNuevaCategoria] = React.useState("");
  const [precio, setPrecio] = React.useState("");
  const [stock, setStock] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [editId, setEditId] = React.useState(null);
  const [editNombre, setEditNombre] = React.useState("");
  const [editCategoria, setEditCategoria] = React.useState("");
  const [editPrecio, setEditPrecio] = React.useState("");
  const [editStock, setEditStock] = React.useState("");

  const crear = async () => {
    try {
      const cat = (nuevaCategoria && nuevaCategoria.trim()) ? nuevaCategoria.trim() : categoria;
      await api("/productos", { method: "POST", body: JSON.stringify({ nombre, categoria: cat, precio: Number(precio)||0, stock: Number(stock)||0 }) });
      setNombre(""); setCategoria(""); setNuevaCategoria(""); setPrecio(""); setStock(""); list.reload(); categorias.reload(); setStatus("✅ Producto creado exitosamente");
      setTimeout(() => setStatus(""), 3000);
    } catch (e) {
      setStatus("❌ " + String(e && e.message || "Error al crear producto"));
      setTimeout(() => setStatus(""), 5000);
    }
  };
  const eliminar = async (id) => { if(!window.confirm("¿Eliminar este producto?")) return; await api(`/productos/${id}`, { method: "DELETE" }); list.reload(); };
  const startEdit = (p) => { setEditId(p.id); setEditNombre(p.nombre||""); setEditCategoria(p.categoria||""); setEditPrecio(String(p.precio||0)); setEditStock(String(p.stock||0)); };
  const cancelEdit = () => { setEditId(null); setEditNombre(""); setEditCategoria(""); setEditPrecio(""); setEditStock(""); };
  const guardarEdit = async () => { await api(`/productos/${editId}`, { method: "PUT", body: JSON.stringify({ nombre: editNombre, categoria: editCategoria, precio: Number(editPrecio)||0, stock: Number(editStock)||0 }) }); list.reload(); cancelEdit(); };

  return (
    <div>
      <Header title={t('productos')} right={<><span className="status muted">{status}</span><button className="btn" onClick={list.reload}><Icon name="rotate" />{t('refrescar')}</button></>} />
      <div className="grid-2">
        <div className="panel">
          <div className="panel-header"><strong>{t('crear_producto')}</strong></div>
          <div className="panel-body">
            <div className="form">
              <div className="field"><label>{t('nombre')}</label><input value={nombre} onChange={e=>setNombre(e.target.value)} /></div>
              <div className="field"><label>{t('categoria')}</label>
                <select value={categoria} onChange={e=>setCategoria(e.target.value)}>
                  <option value="">{t('seleccione')}</option>
                  {Array.isArray(categorias.data) && categorias.data.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="field"><label>Nueva categoría</label><input value={nuevaCategoria} onChange={e=>setNuevaCategoria(e.target.value)} placeholder="Escriba una nueva categoría" /></div>
              <div className="field"><label>{t('precio')}</label><input type="number" value={precio} onChange={e=>setPrecio(e.target.value)} /></div>
              <div className="field"><label>{t('stock')}</label><input type="number" value={stock} onChange={e=>setStock(e.target.value)} /></div>
              <div className="actions"><button className="btn" onClick={crear}><Icon name="plus" />{t('crear')}</button></div>
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-header"><strong>{t('listado')}</strong><div className="toolbar"><input placeholder={t('filtro_nombre')} value={nombreLikeFiltro} onChange={e=>setNombreLikeFiltro(e.target.value)} /><select value={categoriaFiltro} onChange={e=>setCategoriaFiltro(e.target.value)}><option value="">{t('filtro_categoria')}</option>{Array.isArray(categorias.data) && categorias.data.map(c => (<option key={c} value={c}>{c}</option>))}</select><select value={sort} onChange={e=>setSort(e.target.value)}><option value="nombre,asc">{t('orden_nombre_asc')}</option><option value="nombre,desc">{t('orden_nombre_desc')}</option><option value="precio,asc">{t('orden_precio_asc')}</option><option value="precio,desc">{t('orden_precio_desc')}</option></select></div></div>
          <div className="panel-body">
            {list.loading && <Loading/>}
            {list.error && <ErrorState error={list.error} onRetry={list.reload} />}
            {!list.loading && !list.error && (() => {
              const base = Array.isArray(list.data) ? list.data : (list.data && Array.isArray(list.data.content) ? list.data.content : []);
              return base.length === 0;
            })() && <EmptyState/>}
            {!list.loading && !list.error && (() => {
              const base = Array.isArray(list.data) ? list.data : (list.data && Array.isArray(list.data.content) ? list.data.content : []);
              return base.length > 0;
            })() && (
            <table>
              <thead><tr><th>ID</th><th>{t('nombre')}</th><th>{t('categoria')}</th><th>{t('precio')}</th><th>{t('stock')}</th><th></th></tr></thead>
              <tbody>
                {(() => {
                  const base = Array.isArray(list.data) ? list.data : (list.data && Array.isArray(list.data.content) ? list.data.content : []);
                  return base.map(p => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{editId===p.id ? (<input value={editNombre} onChange={e=>setEditNombre(e.target.value)} />) : p.nombre}</td>
                    <td>{editId===p.id ? (
                      <select value={editCategoria} onChange={e=>setEditCategoria(e.target.value)}>
                        <option value="">{t('seleccione')}</option>
                        {Array.isArray(categorias.data) && categorias.data.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    ) : (p.categoria||'')}</td>
                    <td>{editId===p.id ? (<input type="number" value={editPrecio} onChange={e=>setEditPrecio(e.target.value)} />) : `$${String(p.precio||0)}`}</td>
                    <td>{editId===p.id ? (<input type="number" value={editStock} onChange={e=>setEditStock(e.target.value)} />) : p.stock}</td>
                    <td>{editId===p.id ? (<>
                      <button className="btn" onClick={guardarEdit}><Icon name="check" />{t('guardar')}</button>
                      <button className="btn secondary" onClick={cancelEdit}><Icon name="xmark" />{t('cancelar')}</button>
                    </>) : (<>
                      <button className="btn" onClick={()=>startEdit(p)}><Icon name="pen" />{t('editar')}</button>
                      <button className="btn danger" onClick={()=>eliminar(p.id)}><Icon name="trash" />{t('eliminar')}</button>
                    </>)}
                    </td>
                  </tr>
                  ));
                })()}
              </tbody>
            </table>
            )}
            <div className="toolbar" style={{justifyContent:'flex-end', marginTop:8}}>
              <button className="btn secondary" onClick={()=>setPage(Math.max(0, page-1))}>{t('prev')}</button>
              <span className="status">{t('pagina')} {page+1}</span>
              {(!Array.isArray(list.data) && list.data && typeof list.data.totalElements === 'number') && <span className="status">{String(list.data.totalElements)}</span>}
              <button className="btn secondary" onClick={()=>setPage(page+1)}>{t('next')}</button>
              <select value={size} onChange={e=>setSize(Number(e.target.value))}>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InventarioView() {
  const bodegas = useFetch((signal) => api("/bodegas", { signal }), []);
  const productos = useFetch((signal) => api("/productos", { signal }), []);
  const [bodegaId, setBodegaId] = React.useState("");
  const [productoId, setProductoId] = React.useState("");
  const [stockMinimo, setStockMinimo] = React.useState("");
  const [page, setPage] = React.useState(0);
  const [size, setSize] = React.useState(20);
  const [sort, setSort] = React.useState("stock,desc");
  const { data, loading, error, reload } = useFetch((signal) => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('size', String(size));
    params.set('sort', sort);
    if (productoId) params.set('productoId', String(productoId));
    if (stockMinimo) params.set('stockMinimo', String(stockMinimo));
    if (bodegaId && productoId) return api(`/inventario/bodega/${bodegaId}/producto/${productoId}?${params.toString()}`, { signal });
    if (productoId && !bodegaId) return api(`/inventario/producto/${productoId}?${params.toString()}`, { signal });
    if (bodegaId) return api(`/inventario/bodega/${bodegaId}?${params.toString()}`, { signal });
    return api(`/inventario?${params.toString()}`, { signal });
  }, [bodegaId, productoId, stockMinimo, page, size, sort]);
  const totalStock = useFetch((signal) => {
    if (productoId) return api(`/inventario/producto/${productoId}/total-stock`, { signal });
    return Promise.resolve(null);
  }, [productoId]);
  const displayData = React.useMemo(() => {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.content)) return data.content;
    if (data && typeof data === 'object' && data.id != null) return [data];
    return [];
  }, [data]);
  const bodegasList = React.useMemo(() => {
    if (Array.isArray(bodegas.data)) return bodegas.data;
    if (bodegas.data && Array.isArray(bodegas.data.content)) return bodegas.data.content;
    return [];
  }, [bodegas.data]);
  const productosList = React.useMemo(() => {
    if (Array.isArray(productos.data)) return productos.data;
    if (productos.data && Array.isArray(productos.data.content)) return productos.data.content;
    return [];
  }, [productos.data]);
  return (
    <div>
      <Header title={t('inventario')} right={<>
        <select value={bodegaId} onChange={e=>setBodegaId(e.target.value)}>
          <option value="">{t('todas_bodegas')}</option>
          {(bodegasList||[]).map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
        </select>
        <select value={productoId} onChange={e=>setProductoId(e.target.value)}>
          <option value="">{t('todos_productos')}</option>
          {(productosList||[]).map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
        {productoId && totalStock.data && (typeof totalStock.data.totalStock !== 'undefined') && <span className="status">{t('stock_total')}: {totalStock.data.totalStock}</span>}
        <input type="number" placeholder={t('stock_minimo')} value={stockMinimo} onChange={e=>setStockMinimo(e.target.value)} />
        <select value={sort} onChange={e=>setSort(e.target.value)}>
          <option value="stock,desc">{t('orden_stock_desc')}</option>
          <option value="stock,asc">{t('orden_stock_asc')}</option>
        </select>
        <button className="btn secondary" onClick={reload}><Icon name="rotate" />{t('refrescar')}</button>
      </>} />
      <div className="panel">
        <div className="panel-header"><strong>{t('listado_inventario')}</strong></div>
        <div className="panel-body">
          {loading && <Loading/>}
          {error && <ErrorState error={error} onRetry={reload} />}
          <table>
            <thead><tr><th>Bodega</th><th>Producto</th><th>Stock</th><th>Mínimo</th></tr></thead>
            <tbody>
              {(displayData||[]).map(i => (
                <tr key={i.id}><td>{(i.bodega && i.bodega.nombre) ? i.bodega.nombre : i.bodega}</td><td>{(i.producto && i.producto.nombre) ? i.producto.nombre : i.producto}</td><td>{i.stock}</td><td>{i.stockMinimo}</td></tr>
              ))}
            </tbody>
          </table>
          <div className="toolbar" style={{justifyContent:'flex-end', marginTop:8}}>
            <button className="btn secondary" onClick={()=>setPage(Math.max(0, page-1))}>{t('prev')}</button>
            <span className="status">{t('pagina')} {page+1}</span>
            {(!Array.isArray(data) && data && typeof data.totalElements === 'number') && <span className="status">{String(data.totalElements)}</span>}
            <button className="btn secondary" onClick={()=>setPage(page+1)}>{t('next')}</button>
            <select value={size} onChange={e=>setSize(Number(e.target.value))}>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>
      <div className="panel mt-8">
        <div className="panel-header"><strong>{t('ajustar_inventario')}</strong></div>
        <div className="panel-body">
          <AjusteInventario bodegas={bodegas.data||[]} productos={productos.data||[]} onDone={reload} />
        </div>
      </div>
      <div className="grid-2 mt-8">
        <div className="panel">
          <div className="panel-header"><strong>{t(bodegaId? 'stock_bajo_bodega' : 'stock_bajo_global')}</strong></div>
          <div className="panel-body">
            <StockBajoPanel bodegaId={bodegaId} />
          </div>
        </div>
        <div className="panel">
          <div className="panel-header"><strong>{t('administrar_inventario')}</strong></div>
          <div className="panel-body">
            <InventarioCRUD bodegas={bodegasList} productos={productosList} onDone={reload} />
          </div>
        </div>
      </div>
    </div>
  );
}

function AjusteInventario({ bodegas, productos, onDone }) {
  const bodegasArr = React.useMemo(() => {
    if (Array.isArray(bodegas)) return bodegas;
    if (bodegas && Array.isArray(bodegas.content)) return bodegas.content;
    return [];
  }, [bodegas]);
  const productosArr = React.useMemo(() => {
    if (Array.isArray(productos)) return productos;
    if (productos && Array.isArray(productos.content)) return productos.content;
    return [];
  }, [productos]);
  const [bodegaId, setBodegaId] = React.useState("");
  const [productoId, setProductoId] = React.useState("");
  const [cantidad, setCantidad] = React.useState("");
  const [motivo, setMotivo] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [error, setError] = React.useState("");
  const ajustar = async () => {
    setError("");
    if (!bodegaId || !productoId) { setError(t('error_seleccione_bodega_producto')); return; }
    if (cantidad === "" || Number(cantidad) === 0) { setError(t('error_cantidad')); return; }
    try {
      const qs = new URLSearchParams();
      qs.set('cantidad', String(Number(cantidad)));
      await api(`/inventario/bodega/${bodegaId}/producto/${productoId}/ajustar?` + qs.toString(), { method: 'PATCH' });
      setStatus(t('ajuste_ok'));
      setBodegaId(""); setProductoId(""); setCantidad(""); setMotivo("");
      if (typeof onDone === 'function') onDone();
    } catch (e) { setError(String(e.message)); }
  };
  return (
    <div className="form">
      <div className="field"><label>{t('bodega')}</label>
        <select value={bodegaId} onChange={e=>setBodegaId(e.target.value)}>
          <option value="">{t('seleccione')}</option>
          {(bodegasArr||[]).map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
        </select>
      </div>
      <div className="field"><label>{t('producto')}</label>
        <select value={productoId} onChange={e=>setProductoId(e.target.value)}>
          <option value="">{t('seleccione')}</option>
          {(productosArr||[]).map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
      </div>
      <div className="field"><label>{t('cantidad')}</label>
        <input type="number" value={cantidad} onChange={e=>setCantidad(e.target.value)} />
      </div>
      <div className="field" style={{gridColumn:'1/-1'}}><label>{t('motivo')}</label>
        <input value={motivo} onChange={e=>setMotivo(e.target.value)} />
      </div>
      <div className="actions">
        <button className="btn" onClick={ajustar}><Icon name="check" />{t('ajustar')}</button>
        <span className="status muted">{status}</span>
        {error && <span className="status" style={{color:'var(--danger)'}}>{error}</span>}
      </div>
    </div>
  );
}

function StockBajoPanel({ bodegaId }) {
  const list = useFetch((signal) => {
    if (bodegaId) return api(`/inventario/bodega/${bodegaId}/stock-bajo`, { signal });
    return api('/inventario/stock-bajo', { signal });
  }, [bodegaId]);
  return (
    <table>
      <thead><tr><th>Bodega</th><th>Producto</th><th>Stock</th><th>Mínimo</th></tr></thead>
      <tbody>
        {list.loading && <tr><td colSpan="4">{t('cargando')}</td></tr>}
        {list.error && <tr><td colSpan="4">{String(list.error.message)}</td></tr>}
        {!list.loading && !list.error && (list.data||[]).map(i => (
          <tr key={i.id}><td>{(i.bodega && i.bodega.nombre) ? i.bodega.nombre : i.bodega}</td><td>{(i.producto && i.producto.nombre) ? i.producto.nombre : i.producto}</td><td>{i.stock}</td><td>{i.stockMinimo}</td></tr>
        ))}
      </tbody>
    </table>
  );
}

function InventarioCRUD({ bodegas, productos, onDone }) {
  const list = useFetch((signal) => api('/inventario', { signal }), []);
  const [bodegaId, setBodegaId] = React.useState("");
  const [productoId, setProductoId] = React.useState("");
  const [stock, setStock] = React.useState("");
  const [stockMinimo, setStockMinimo] = React.useState("");
  const [stockMaximo, setStockMaximo] = React.useState("");
  const crear = async () => {
    if (!bodegaId || !productoId) return;
    const body = { bodega: { id: Number(bodegaId) }, producto: { id: Number(productoId) }, stock: Number(stock)||0, stockMinimo: Number(stockMinimo)||0, stockMaximo: Number(stockMaximo)||0 };
    await api('/inventario', { method: 'POST', body: JSON.stringify(body) });
    setBodegaId(""); setProductoId(""); setStock(""); setStockMinimo(""); setStockMaximo("");
    list.reload(); if (typeof onDone==='function') onDone();
  };
  const guardar = async (row) => {
    const body = { stock: Number(row.stock)||0, stockMinimo: Number(row.stockMinimo)||0, stockMaximo: Number(row.stockMaximo)||0 };
    await api(`/inventario/${row.id}`, { method: 'PUT', body: JSON.stringify(body) });
    list.reload(); if (typeof onDone==='function') onDone();
  };
  const eliminar = async (id) => { if(!window.confirm('¿Eliminar este inventario?')) return; await api(`/inventario/${id}`, { method: 'DELETE' }); list.reload(); if (typeof onDone==='function') onDone(); };
  return (
    <div>
      <div className="form">
        <div className="field"><label>{t('bodega')}</label>
          <select value={bodegaId} onChange={e=>setBodegaId(e.target.value)}>
            <option value="">{t('seleccione')}</option>
            {(bodegas||[]).map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
          </select>
        </div>
        <div className="field"><label>{t('producto')}</label>
          <select value={productoId} onChange={e=>setProductoId(e.target.value)}>
            <option value="">{t('seleccione')}</option>
            {(productos||[]).map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>
        <div className="field"><label>{t('stock')}</label><input type="number" value={stock} onChange={e=>setStock(e.target.value)} /></div>
        <div className="field"><label>{t('stock_minimo_label')}</label><input type="number" value={stockMinimo} onChange={e=>setStockMinimo(e.target.value)} /></div>
        <div className="field"><label>{t('stock_maximo_label')}</label><input type="number" value={stockMaximo} onChange={e=>setStockMaximo(e.target.value)} /></div>
        <div className="actions"><button className="btn" onClick={crear}><Icon name="plus" />{t('crear_inventario')}</button></div>
      </div>
      <table className="mt-8">
        <thead><tr><th>ID</th><th>{t('bodega')}</th><th>{t('producto')}</th><th>{t('stock')}</th><th>{t('stock_minimo_label')}</th><th>{t('stock_maximo_label')}</th><th></th></tr></thead>
        <tbody>
          {(Array.isArray(list.data) ? list.data : (list.data && Array.isArray(list.data.content) ? list.data.content : [])).map(i => (
            <tr key={i.id}>
              <td>{i.id}</td>
              <td>{(i.bodega && i.bodega.nombre) ? i.bodega.nombre : i.bodega}</td>
              <td>{(i.producto && i.producto.nombre) ? i.producto.nombre : i.producto}</td>
              <td><input type="number" value={i.stock} onChange={e=>{ i.stock = Number(e.target.value)||0; }} /></td>
              <td><input type="number" value={i.stockMinimo} onChange={e=>{ i.stockMinimo = Number(e.target.value)||0; }} /></td>
              <td><input type="number" value={i.stockMaximo} onChange={e=>{ i.stockMaximo = Number(e.target.value)||0; }} /></td>
              <td>
                <button className="btn" onClick={()=>guardar(i)}><Icon name="check" />{t('guardar')}</button>
                <button className="btn danger" onClick={()=>eliminar(i.id)}><Icon name="trash" />{t('eliminar')}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReportesView() {
  const [threshold, setThreshold] = React.useState("");
  const resumen = useFetch((signal) => threshold ? api(`/reportes/resumen?threshold=${threshold}`, { signal }) : api("/reportes/resumen", { signal }), [threshold]);
  const stockBajo = ((resumen.data && resumen.data.stockBajo) ? resumen.data.stockBajo : []).filter(p => p.stock <= (resumen.data && resumen.data.threshold != null ? resumen.data.threshold : -Infinity));
  const resumenPorCategoria = ((resumen.data && resumen.data.resumenPorCategoria) ? resumen.data.resumenPorCategoria : []).filter(c => c.stockTotal <= (resumen.data && resumen.data.threshold != null ? resumen.data.threshold : -Infinity));
  return (
    <div>
      <Header title={t('reportes')} right={<>
        <input type="number" placeholder={t('umbral')} value={threshold} onChange={e=>setThreshold(e.target.value)} />
        <button className="btn secondary" onClick={resumen.reload}><Icon name="rotate" />{t('aplicar')}</button>
      </>} />
      <div className="grid-2">
        <div className="panel">
          <div className="panel-header"><strong>{t('stock_bajo_label')} { (resumen.data && resumen.data.threshold != null ? resumen.data.threshold : '—') }</strong></div>
          <div className="panel-body">
            <table>
              <thead><tr><th>Producto</th><th>Categoría</th><th>Precio</th><th>Stock</th></tr></thead>
              <tbody>
                {stockBajo.map(p => (
                  <tr key={p.id}><td>{p.nombre}</td><td>{p.categoria||'—'}</td><td>${String(p.precio||0)}</td><td>{p.stock}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="panel">
          <div className="panel-header"><strong>{t('resumen_por_categoria')}</strong></div>
          <div className="panel-body">
            <table>
              <thead><tr><th>Categoría</th><th>Stock total</th><th>Valor total</th></tr></thead>
              <tbody>
                {resumenPorCategoria.map((c,i) => (
                  <tr key={i}><td>{c.categoria}</td><td>{c.stockTotal}</td><td>${String(c.valorTotal)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function MovimientosView() {
  const [tipoFiltro, setTipoFiltro] = React.useState("");
  const [fechaDesde, setFechaDesde] = React.useState("");
  const [fechaHasta, setFechaHasta] = React.useState("");
  const [bodegaOrigenFiltro, setBodegaOrigenFiltro] = React.useState("");
  const [bodegaDestinoFiltro, setBodegaDestinoFiltro] = React.useState("");
  const [usuarioIdFiltro, setUsuarioIdFiltro] = React.useState("");
  const movimientos = useFetch((signal) => {
    const origenODestino = bodegaOrigenFiltro || bodegaDestinoFiltro;
    const params = new URLSearchParams();
    if (tipoFiltro) params.set('tipo', tipoFiltro);
    if (usuarioIdFiltro) params.set('usuarioId', String(usuarioIdFiltro));
    if (origenODestino) params.set('bodegaId', String(origenODestino));
    if (fechaDesde) params.set('inicio', `${fechaDesde}T00:00:00`);
    if (fechaHasta) params.set('fin', `${fechaHasta}T23:59:59`);
    const qs = params.toString();
    if (qs) return api(`/movimientos/search?${qs}`, { signal });
    return api(`/movimientos`, { signal });
  }, [tipoFiltro, fechaDesde, fechaHasta, bodegaOrigenFiltro, bodegaDestinoFiltro, usuarioIdFiltro]);
  const bodegas = useFetch((signal) => api("/bodegas", { signal }), []);
  const productos = useFetch((signal) => api("/productos", { signal }), []);
  const [movId, setMovId] = React.useState("");
  const movById = useFetch((signal) => {
    if (!movId) return Promise.resolve(null);
    return api(`/movimientos/${movId}`, { signal });
  }, [movId]);
  const [tipo, setTipo] = React.useState("ENTRADA");
  const { user } = AuthContext.use();
  const usuarioId = user?.id || 1;
  const [bodegaOrigenId, setBodegaOrigenId] = React.useState("");
  const [bodegaDestinoId, setBodegaDestinoId] = React.useState("");
  const [detalles, setDetalles] = React.useState([]);
  const [observaciones, setObservaciones] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState("");

  const productosList = React.useMemo(() => {
    if (Array.isArray(productos.data)) return productos.data;
    if (productos.data && Array.isArray(productos.data.content)) return productos.data.content;
    return [];
  }, [productos.data]);
  const bodegasList = React.useMemo(() => {
    if (Array.isArray(bodegas.data)) return bodegas.data;
    if (bodegas.data && Array.isArray(bodegas.data.content)) return bodegas.data.content;
    return [];
  }, [bodegas.data]);
  const addDetalle = () => {
    const firstId = (productosList[0] && productosList[0].id) ? productosList[0].id : 1;
    setDetalles(detalles.concat([{ productoId: firstId, cantidad: 1 }]));
  };
  const updateDetalle = (idx, patch) => setDetalles(detalles.map(function(d,i){ return i===idx ? Object.assign({}, d, patch) : d; }));
  const removeDetalle = (idx) => setDetalles(detalles.filter((_,i)=> i!==idx));

  const crear = async () => {
    setFormError("");
    if (!tipo) { setFormError("❌ " + t('error_tipo')); return; }
    if ((tipo === 'SALIDA' || tipo === 'TRANSFERENCIA') && !bodegaOrigenId) { setFormError("❌ Debe seleccionar una bodega de origen"); return; }
    if ((tipo === 'ENTRADA' || tipo === 'TRANSFERENCIA') && !bodegaDestinoId) { setFormError("❌ Debe seleccionar una bodega de destino"); return; }
    if (!detalles.length) { setFormError("❌ Debe agregar al menos un producto"); return; }
    if (detalles.some(d => !d.productoId || !d.cantidad || d.cantidad <= 0)) { setFormError("❌ Todos los productos deben tener cantidad válida"); return; }
    const body = { tipo, usuarioId, detalles, observaciones };
    if (tipo === 'SALIDA') body.bodegaOrigenId = Number(bodegaOrigenId);
    if (tipo === 'ENTRADA') body.bodegaDestinoId = Number(bodegaDestinoId);
    if (tipo === 'TRANSFERENCIA') { body.bodegaOrigenId = Number(bodegaOrigenId); body.bodegaDestinoId = Number(bodegaDestinoId); }
    try {
      setSubmitting(true);
      await api("/movimientos", { method: "POST", body: JSON.stringify(body) });
      setDetalles([]); setObservaciones(""); setBodegaOrigenId(""); setBodegaDestinoId(""); movimientos.reload();
      setFormError("✅ Movimiento registrado exitosamente");
      setTimeout(() => setFormError(""), 3000);
    } catch (e) {
      setFormError("❌ " + String(e.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Header title={t('movimientos')} right={<button className="btn" onClick={movimientos.reload}><Icon name="rotate" />{t('refrescar')}</button>} />
      <div className="panel">
        <div className="panel-header"><strong>{t('registrar_movimiento')}</strong></div>
        <div className="panel-body">
          <div className="form">
            <div className="field"><label>Tipo</label>
              <select value={tipo} onChange={e=>setTipo(e.target.value)}>
                <option>ENTRADA</option><option>SALIDA</option><option>TRANSFERENCIA</option>
              </select>
            </div>
            <div className="field"><label>Bodega origen</label>
              <select value={bodegaOrigenId} onChange={e=>setBodegaOrigenId(e.target.value)}>
                <option value="">Seleccione…</option>
                {(bodegasList||[]).map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
              </select>
            </div>
            <div className="field"><label>Bodega destino</label>
              <select value={bodegaDestinoId} onChange={e=>setBodegaDestinoId(e.target.value)}>
                <option value="">Seleccione…</option>
                {(bodegasList||[]).map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
              </select>
            </div>
            <div className="field" style={{gridColumn:'1/-1'}}>
              <label>Observaciones</label>
              <textarea value={observaciones} onChange={e=>setObservaciones(e.target.value)} />
            </div>
            <div className="actions">
              <button className="btn secondary" onClick={addDetalle}><Icon name="plus" /> {t('anadir_producto')}</button>
              <button className="btn" disabled={submitting} onClick={crear}><Icon name="check" /> {t('registrar')}</button>
            </div>
            {formError && <div className="status" style={{color:'var(--danger)'}}>{formError}</div>}
          </div>
        </div>
      </div>
      <div className="panel mt-8">
        <div className="panel-header"><strong>{t('detalles')}</strong></div>
        <div className="panel-body">
          {(detalles||[]).map((d,idx)=> (
            <div className="form" key={idx}>
              <div className="field"><label>Producto</label>
                <select value={d.productoId} onChange={e=>updateDetalle(idx,{productoId:Number(e.target.value)})}>
                  {(productosList||[]).map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div className="field"><label>Cantidad</label>
                <input type="number" value={d.cantidad} onChange={e=>updateDetalle(idx,{cantidad:Number(e.target.value)})} />
              </div>
              <div className="actions"><button className="btn danger" onClick={()=>removeDetalle(idx)}><Icon name="xmark" />{t('quitar')}</button></div>
            </div>
          ))}
        </div>
      </div>
      <div className="panel">
        <div className="panel-header"><strong>{t('listado_movimientos')}</strong><div className="toolbar">
          <select value={tipoFiltro} onChange={e=>setTipoFiltro(e.target.value)}>
            <option value="">{t('todos')}</option>
            <option value="ENTRADA">ENTRADA</option>
            <option value="SALIDA">SALIDA</option>
            <option value="TRANSFERENCIA">TRANSFERENCIA</option>
          </select>
          <input type="date" value={fechaDesde} onChange={e=>setFechaDesde(e.target.value)} />
          <input type="date" value={fechaHasta} onChange={e=>setFechaHasta(e.target.value)} />
          <select value={bodegaOrigenFiltro} onChange={e=>setBodegaOrigenFiltro(e.target.value)}>
            <option value="">{t('origen')}</option>
            {(bodegasList||[]).map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
          </select>
          <select value={bodegaDestinoFiltro} onChange={e=>setBodegaDestinoFiltro(e.target.value)}>
            <option value="">{t('destino')}</option>
            {(bodegasList||[]).map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
          </select>
          <input type="number" placeholder={t('usuario_id')} value={usuarioIdFiltro} onChange={e=>setUsuarioIdFiltro(e.target.value)} />
          <span className="status">{t('orden_fecha_desc')}</span>
          <input type="number" placeholder={t('movimiento_id')} value={movId} onChange={e=>setMovId(e.target.value)} />
          <button className="btn secondary" onClick={movimientos.reload}><Icon name="rotate" />{t('refrescar')}</button>
        </div></div>
        <div className="panel-body">
          {movimientos.loading && <Loading/>}
          {movimientos.error && <ErrorState error={movimientos.error} onRetry={movimientos.reload} />}
          {!movimientos.loading && !movimientos.error && (Array.isArray(movimientos.data) && movimientos.data.length === 0) && <EmptyState/>}
          {!movimientos.loading && !movimientos.error && <MovimientosTable movimientos={movimientos.data||[]} onDelete={async (id)=>{ if(!window.confirm("¿Eliminar este movimiento?")) return; await api(`/movimientos/${id}`, { method: 'DELETE' }); movimientos.reload(); }} />}
          {movId && movById.data && (
            <div className="panel mt-8"><div className="panel-header"><strong>{t('buscar_por_id')}</strong></div><div className="panel-body">
              <MovimientosTable movimientos={[movById.data]} onDelete={async (id)=>{ if(!window.confirm("¿Eliminar este movimiento?")) return; await api(`/movimientos/${id}`, { method: 'DELETE' }); movimientos.reload(); }} />
            </div></div>
          )}
        </div>
      </div>
    </div>
  );
}

function AuditoriaView() {
  const { data, loading, error, reload } = useFetch((signal) => api("/auditoria", { signal }), []);
  return (
    <div>
      <Header title={t('auditoria')} right={<button className="btn" onClick={reload}><Icon name="rotate" />{t('refrescar')}</button>} />
      <div className="panel">
        <div className="panel-header"><strong>{t('ultimas_operaciones')}</strong></div>
        <div className="panel-body">
          <table>
            <thead><tr><th>Fecha</th><th>Entidad</th><th>Operación</th><th>Usuario</th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan="4">{t('cargando')}</td></tr>}
              {error && <tr><td colSpan="4">{String(error.message).includes('403') ? '403 - Acceso restringido a ADMIN' : String(error.message)} <button className="btn" onClick={reload}><Icon name="rotate" />{t('reintentar')}</button></td></tr>}
              {!loading && !error && (data||[]).map(a => (
                <tr key={a.id}><td>{new Date(a.fecha).toLocaleString()}</td><td>{a.entidad}</td><td>{a.operacion}</td><td>{(a.usuario && a.usuario.nombreCompleto) ? a.usuario.nombreCompleto : '—'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Login Component
function Login({ onSuccess, onRegisterClick }) {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password })
      });

      if (response && response.accessToken) {
        setToken(response.accessToken); setUserData({id: response.id, username: response.username, rol: response.rol});
        onSuccess(response);
      } else {
        setError("Error al iniciar sesión");
      }
    } catch (err) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-logo">LT</div>
        <h1 className="auth-title">Bienvenido a LogiTrack</h1>
        <p className="auth-subtitle">Sistema de Gestión de Bodegas</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label>Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ingrese su usuario"
              required
              autoFocus
            />
          </div>

          <div className="auth-field">
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingrese su contraseña"
              required
            />
          </div>

        {error && <div className="auth-error">{error}</div>}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
        </button>
      </form>
        <div className="auth-footer"><button className="auth-link" onClick={onRegisterClick}>Crear cuenta (Admin)</button></div>
      </div>
    </div>
  );
}

// Register Component
function Register({ onSuccess, onLoginClick, submitPath = "/auth/register", defaultRol = "EMPLEADO", allowRoleSelect = true }) {
  const [username, setUsername] = React.useState("");
  const [nombreCompleto, setNombreCompleto] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [cedula, setCedula] = React.useState("");
  const [empId, setEmpId] = React.useState("");
  const [rol, setRol] = React.useState(defaultRol);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validación de cédula
      if (!/^\d{6,20}$/.test(cedula)) {
        setError("Cédula inválida. Debe tener 6-20 dígitos.");
        setLoading(false);
        return;
      }

      // Validación de contraseña fuerte
      if (password.length < 8) {
        setError("La contraseña debe tener al menos 8 caracteres.");
        setLoading(false);
        return;
      }
      if (!/[A-Z]/.test(password)) {
        setError("La contraseña debe contener al menos una letra mayúscula.");
        setLoading(false);
        return;
      }
      if (!/[a-z]/.test(password)) {
        setError("La contraseña debe contener al menos una letra minúscula.");
        setLoading(false);
        return;
      }
      if (!/[0-9]/.test(password)) {
        setError("La contraseña debe contener al menos un número.");
        setLoading(false);
        return;
      }
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        setError("La contraseña debe contener al menos un carácter especial.");
        setLoading(false);
        return;
      }
      const response = await api(submitPath, {
        method: "POST",
        body: JSON.stringify({ username, nombreCompleto, email, password, rol, cedula, empId })
      });

      if (response) {
        setError("");
        alert("✅ Usuario creado exitosamente");
        setUsername(""); setNombreCompleto(""); setEmail(""); setPassword(""); setCedula(""); setEmpId(""); setRol(defaultRol);
        if (submitPath === "/auth/register") {
          // Si es desde el panel de admin, no redirigir
          setTimeout(() => {
            setUsername(""); setNombreCompleto(""); setEmail(""); setPassword(""); setCedula(""); setEmpId(""); setRol(defaultRol);
          }, 100);
        } else {
          onLoginClick();
        }
      }
    } catch (err) {
      setError(err.message || "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-logo">LT</div>
        <h1 className="auth-title">Crear Cuenta</h1>
        <p className="auth-subtitle">Registrarse en LogiTrack</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label>Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Elija un nombre de usuario"
              required
              autoFocus
            />
          </div>

          <div className="auth-field">
            <label>Nombre Completo</label>
            <input
              type="text"
              value={nombreCompleto}
              onChange={(e) => setNombreCompleto(e.target.value)}
              placeholder="Ingrese su nombre completo"
              required
            />
          </div>

          <div className="auth-field">
            <label>Cédula</label>
            <input
              type="text"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              placeholder="Documento de identidad"
              required
            />
          </div>

          <div className="auth-field">
            <label>ID de Empleado (opcional)</label>
            <input
              type="text"
              value={empId}
              onChange={(e) => setEmpId(e.target.value)}
              placeholder="Código de empleado"
            />
          </div>

          <div className="auth-field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              required
            />
          </div>

          <div className="auth-field">
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Elija una contraseña"
              required
            />
          </div>

          {allowRoleSelect && (
            <div className="auth-field">
              <label>Rol</label>
              <select value={rol} onChange={(e) => setRol(e.target.value)}>
                <option value="EMPLEADO">Empleado</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
          )}

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Creando cuenta..." : "Registrarse"}
          </button>
        </form>

        <div className="auth-footer">
          <p>¿Ya tienes cuenta?</p>
          <button className="auth-link" onClick={onLoginClick}>
            Iniciar sesión
          </button>
        </div>
      </div>
    </div>
  );
}

// ========================================
// NUEVOS MÓDULOS
// ========================================

function ProveedoresView() {
  const list = useFetch((signal) => api("/proveedores", { signal }), []);
  const [nombre, setNombre] = React.useState("");
  const [contacto, setContacto] = React.useState("");
  const [telefono, setTelefono] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [direccion, setDireccion] = React.useState("");
  const [activo, setActivo] = React.useState(true);
  const [status, setStatus] = React.useState("");
  const [editId, setEditId] = React.useState(null);

  const crear = async () => {
    try {
      await api("/proveedores", {
        method: "POST",
        body: JSON.stringify({ nombre, contacto, telefono, email, direccion, activo })
      });
      setNombre(""); setContacto(""); setTelefono(""); setEmail(""); setDireccion("");
      list.reload();
      setStatus("✅ Proveedor creado exitosamente");
      setTimeout(() => setStatus(""), 3000);
    } catch (e) {
      setStatus("❌ " + String(e.message));
      setTimeout(() => setStatus(""), 5000);
    }
  };

  const eliminar = async (id) => {
    if (!window.confirm("¿Eliminar este proveedor?")) return;
    await api(`/proveedores/${id}`, { method: "DELETE" });
    list.reload();
  };

  return (
    <div>
      <Header title="Proveedores" right={<><span className="status muted">{status}</span><button className="btn" onClick={list.reload}><Icon name="rotate" />Refrescar</button></>} />
      <div className="panel">
        <div className="panel-header"><strong>Crear Proveedor</strong></div>
        <div className="panel-body">
          <div className="form">
            <div className="field"><label>Nombre*</label><input value={nombre} onChange={e=>setNombre(e.target.value)} /></div>
            <div className="field"><label>Contacto</label><input value={contacto} onChange={e=>setContacto(e.target.value)} /></div>
            <div className="field"><label>Teléfono</label><input value={telefono} onChange={e=>setTelefono(e.target.value)} /></div>
            <div className="field"><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} /></div>
            <div className="field" style={{gridColumn:'1/-1'}}><label>Dirección</label><input value={direccion} onChange={e=>setDireccion(e.target.value)} /></div>
            <div className="field"><label style={{display:'flex', alignItems:'center', gap:'8px'}}><input type="checkbox" checked={activo} onChange={e=>setActivo(e.target.checked)} />Activo</label></div>
            <div className="actions"><button className="btn" onClick={crear}><Icon name="plus" />Crear</button></div>
          </div>
        </div>
      </div>
      <div className="panel mt-8">
        <div className="panel-header"><strong>Listado de Proveedores</strong></div>
        <div className="panel-body">
          {list.loading && <Loading/>}
          {list.error && <ErrorState error={list.error} onRetry={list.reload} />}
          {!list.loading && !list.error && (Array.isArray(list.data) && list.data.length === 0) && <EmptyState/>}
          {!list.loading && !list.error && Array.isArray(list.data) && list.data.length > 0 && (
            <table>
              <thead><tr><th>ID</th><th>Nombre</th><th>Contacto</th><th>Teléfono</th><th>Email</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                {list.data.map(p => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{p.nombre}</td>
                    <td>{p.contacto || '—'}</td>
                    <td>{p.telefono || '—'}</td>
                    <td>{p.email || '—'}</td>
                    <td>{p.activo ? '✅ Activo' : '❌ Inactivo'}</td>
                    <td>
                      <button className="btn danger" onClick={()=>eliminar(p.id)}><Icon name="trash" />Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function OrdenesCompraView() {
  const list = useFetch((signal) => api("/ordenes-compra", { signal }), []);
  const proveedores = useFetch((signal) => api("/proveedores/activos", { signal }), []);
  const bodegas = useFetch((signal) => api("/bodegas", { signal }), []);
  const productos = useFetch((signal) => api("/productos", { signal }), []);

  const [numeroOrden, setNumeroOrden] = React.useState("");
  const [proveedorId, setProveedorId] = React.useState("");
  const [bodegaDestinoId, setBodegaDestinoId] = React.useState("");
  const [fechaEntregaEstimada, setFechaEntregaEstimada] = React.useState("");
  const [observaciones, setObservaciones] = React.useState("");
  const [detalles, setDetalles] = React.useState([]);
  const [status, setStatus] = React.useState("");
  const [verDetalle, setVerDetalle] = React.useState(null);

  const agregarDetalle = () => {
    setDetalles([...detalles, { productoId: "", cantidad: 1, precioUnitario: 0 }]);
  };

  const actualizarDetalle = (index, field, value) => {
    const nuevos = [...detalles];
    nuevos[index][field] = value;
    setDetalles(nuevos);
  };

  const eliminarDetalle = (index) => {
    setDetalles(detalles.filter((_, i) => i !== index));
  };

  const crear = async () => {
    try {
      if (!proveedorId || !bodegaDestinoId || detalles.length === 0) {
        setStatus("❌ Complete todos los campos requeridos y agregue al menos un producto");
        return;
      }

      const detallesParaEnviar = detalles.map(d => ({
        producto: { id: parseInt(d.productoId) },
        cantidad: parseInt(d.cantidad),
        precioUnitario: parseFloat(d.precioUnitario)
      }));

      await api("/ordenes-compra", {
        method: "POST",
        body: JSON.stringify({
          numeroOrden: numeroOrden || undefined,
          proveedor: { id: parseInt(proveedorId) },
          bodegaDestino: { id: parseInt(bodegaDestinoId) },
          fechaEntregaEstimada: fechaEntregaEstimada || undefined,
          observaciones,
          detalles: detallesParaEnviar
        })
      });

      setNumeroOrden(""); setProveedorId(""); setBodegaDestinoId("");
      setFechaEntregaEstimada(""); setObservaciones(""); setDetalles([]);
      list.reload();
      setStatus("✅ Orden de compra creada exitosamente");
      setTimeout(() => setStatus(""), 3000);
    } catch (e) {
      setStatus("❌ " + String(e.message));
    }
  };

  const recibirOrden = async (id) => {
    try {
      await api(`/ordenes-compra/${id}/recibir`, { method: "POST" });
      list.reload();
      setStatus("✅ Orden recibida e inventario actualizado");
      setTimeout(() => setStatus(""), 3000);
    } catch (e) {
      setStatus("❌ " + String(e.message));
    }
  };

  const calcularTotal = () => {
    return detalles.reduce((sum, d) => sum + (parseFloat(d.precioUnitario || 0) * parseInt(d.cantidad || 0)), 0);
  };

  return (
    <div>
      <Header title="Órdenes de Compra" right={<><span className="status">{status}</span><button className="btn" onClick={list.reload}><Icon name="rotate" />Refrescar</button></>} />

      <div className="panel">
        <div className="panel-header"><strong>Registrar Orden de Compra</strong></div>
        <div className="panel-body">
          <div className="form">
            <div className="field"><label>Número de Orden (opcional)</label><input value={numeroOrden} onChange={e=>setNumeroOrden(e.target.value)} placeholder="Se genera automáticamente" /></div>
            <div className="field">
              <label>Proveedor*</label>
              <select value={proveedorId} onChange={e=>setProveedorId(e.target.value)}>
                <option value="">Seleccione...</option>
                {Array.isArray(proveedores.data) && proveedores.data.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Bodega Destino*</label>
              <select value={bodegaDestinoId} onChange={e=>setBodegaDestinoId(e.target.value)}>
                <option value="">Seleccione...</option>
                {Array.isArray(bodegas.data) && bodegas.data.map(b => (
                  <option key={b.id} value={b.id}>{b.nombre}</option>
                ))}
              </select>
            </div>
            <div className="field"><label>Fecha Entrega Estimada</label><input type="date" value={fechaEntregaEstimada} onChange={e=>setFechaEntregaEstimada(e.target.value)} /></div>
            <div className="field"><label>Observaciones</label><textarea value={observaciones} onChange={e=>setObservaciones(e.target.value)} rows="2" /></div>

            <div style={{marginTop:'20px', padding:'15px', backgroundColor:'#f8f9fa', borderRadius:'4px'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px'}}>
                <strong>Detalles de Productos</strong>
                <button className="btn btn-sm" onClick={agregarDetalle}><Icon name="plus" />Agregar Producto</button>
              </div>
              {detalles.map((det, idx) => (
                <div key={idx} style={{display:'flex', gap:'10px', marginBottom:'10px', alignItems:'center'}}>
                  <select value={det.productoId} onChange={e=>actualizarDetalle(idx, 'productoId', e.target.value)} style={{flex:2}}>
                    <option value="">Seleccione producto...</option>
                    {Array.isArray(productos.data?.content || productos.data) && (productos.data?.content || productos.data).map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                  <input type="number" placeholder="Cantidad" value={det.cantidad} onChange={e=>actualizarDetalle(idx, 'cantidad', e.target.value)} style={{width:'100px'}} min="1" />
                  <input type="number" placeholder="Precio Unit." value={det.precioUnitario} onChange={e=>actualizarDetalle(idx, 'precioUnitario', e.target.value)} style={{width:'120px'}} step="0.01" min="0" />
                  <button className="btn btn-sm" onClick={()=>eliminarDetalle(idx)} style={{backgroundColor:'#dc3545', color:'white'}}><Icon name="trash" /></button>
                </div>
              ))}
              {detalles.length > 0 && (
                <div style={{marginTop:'15px', paddingTop:'15px', borderTop:'1px solid #dee2e6', textAlign:'right'}}>
                  <strong>Total: ${calcularTotal().toFixed(2)}</strong>
                </div>
              )}
            </div>

            <div className="actions"><button className="btn" onClick={crear}><Icon name="plus" />Crear Orden</button></div>
          </div>
        </div>
      </div>

      <div className="panel mt-8">
        <div className="panel-header"><strong>Listado de Órdenes de Compra</strong></div>
        <div className="panel-body">
          {list.loading && <Loading/>}
          {list.error && <ErrorState error={list.error} onRetry={list.reload} />}
          {!list.loading && !list.error && Array.isArray(list.data) && list.data.length > 0 && (
            <table>
              <thead>
                <tr><th>Número</th><th>Proveedor</th><th>Bodega</th><th>Total</th><th>Estado</th><th>Fecha</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {list.data.map(o => (
                  <tr key={o.id}>
                    <td>{o.numeroOrden}</td>
                    <td>{o.proveedor?.nombre || '—'}</td>
                    <td>{o.bodegaDestino?.nombre || '—'}</td>
                    <td>${o.total?.toFixed(2) || '0.00'}</td>
                    <td><span className={`badge ${o.estado === 'RECIBIDA' ? 'badge-success' : o.estado === 'CANCELADA' ? 'badge-danger' : 'badge-warning'}`}>{o.estado}</span></td>
                    <td>{new Date(o.fechaOrden).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-sm" onClick={()=>setVerDetalle(o)}><Icon name="eye" /></button>
                      {o.estado !== 'RECIBIDA' && o.estado !== 'CANCELADA' && (
                        <button className="btn btn-sm" onClick={()=>recibirOrden(o.id)} style={{marginLeft:'5px', backgroundColor:'#28a745', color:'white'}}>Recibir</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!list.loading && !list.error && Array.isArray(list.data) && list.data.length === 0 && (
            <p style={{textAlign:'center', padding:'20px', color:'#6c757d'}}>No hay órdenes de compra registradas</p>
          )}
        </div>
      </div>

      {verDetalle && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000}} onClick={()=>setVerDetalle(null)}>
          <div style={{backgroundColor:'white', borderRadius:'8px', padding:'24px', maxWidth:'600px', width:'90%', maxHeight:'80vh', overflow:'auto'}} onClick={e=>e.stopPropagation()}>
            <h3>Detalle de Orden {verDetalle.numeroOrden}</h3>
            <div style={{marginTop:'15px'}}>
              <p><strong>Proveedor:</strong> {verDetalle.proveedor?.nombre}</p>
              <p><strong>Bodega Destino:</strong> {verDetalle.bodegaDestino?.nombre}</p>
              <p><strong>Estado:</strong> <span className={`badge ${verDetalle.estado === 'RECIBIDA' ? 'badge-success' : 'badge-warning'}`}>{verDetalle.estado}</span></p>
              <p><strong>Fecha Orden:</strong> {new Date(verDetalle.fechaOrden).toLocaleString()}</p>
              {verDetalle.fechaEntregaEstimada && <p><strong>Entrega Estimada:</strong> {new Date(verDetalle.fechaEntregaEstimada).toLocaleDateString()}</p>}
              {verDetalle.fechaRecepcion && <p><strong>Fecha Recepción:</strong> {new Date(verDetalle.fechaRecepcion).toLocaleDateString()}</p>}
              {verDetalle.observaciones && <p><strong>Observaciones:</strong> {verDetalle.observaciones}</p>}

              <h4 style={{marginTop:'20px', marginBottom:'10px'}}>Productos:</h4>
              <table style={{width:'100%'}}>
                <thead><tr><th>Producto</th><th>Cantidad</th><th>Precio Unit.</th><th>Subtotal</th></tr></thead>
                <tbody>
                  {verDetalle.detalles && verDetalle.detalles.map((d, idx) => (
                    <tr key={idx}>
                      <td>{d.producto?.nombre}</td>
                      <td>{d.cantidad}</td>
                      <td>${d.precioUnitario?.toFixed(2)}</td>
                      <td>${(d.cantidad * d.precioUnitario).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr><td colSpan="3" style={{textAlign:'right'}}><strong>Total:</strong></td><td><strong>${verDetalle.total?.toFixed(2)}</strong></td></tr></tfoot>
              </table>
            </div>
            <button className="btn" onClick={()=>setVerDetalle(null)} style={{marginTop:'20px'}}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}

function LotesView() {
  const list = useFetch((signal) => api("/lotes", { signal }), []);
  const productos = useFetch((signal) => api("/productos", { signal }), []);
  const bodegas = useFetch((signal) => api("/bodegas", { signal }), []);
  const proveedores = useFetch((signal) => api("/proveedores/activos", { signal }), []);

  const [numeroLote, setNumeroLote] = React.useState("");
  const [productoId, setProductoId] = React.useState("");
  const [bodegaId, setBodegaId] = React.useState("");
  const [proveedorId, setProveedorId] = React.useState("");
  const [cantidad, setCantidad] = React.useState("");
  const [fechaFabricacion, setFechaFabricacion] = React.useState("");
  const [fechaVencimiento, setFechaVencimiento] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [filtro, setFiltro] = React.useState("todos");

  const crear = async () => {
    try {
      if (!numeroLote || !productoId || !bodegaId || !cantidad) {
        setStatus("❌ Complete todos los campos requeridos");
        return;
      }

      await api("/lotes", {
        method: "POST",
        body: JSON.stringify({
          numeroLote,
          producto: { id: parseInt(productoId) },
          bodega: { id: parseInt(bodegaId) },
          proveedor: proveedorId ? { id: parseInt(proveedorId) } : null,
          cantidad: parseInt(cantidad),
          fechaFabricacion: fechaFabricacion || null,
          fechaVencimiento: fechaVencimiento || null
        })
      });

      setNumeroLote(""); setProductoId(""); setBodegaId(""); setProveedorId("");
      setCantidad(""); setFechaFabricacion(""); setFechaVencimiento("");
      list.reload();
      setStatus("✅ Lote creado exitosamente");
      setTimeout(() => setStatus(""), 3000);
    } catch (e) {
      setStatus("❌ " + String(e.message));
    }
  };

  const cargarVencidos = async () => {
    try {
      const data = await api("/lotes/vencidos");
      list.setData(data);
      setFiltro("vencidos");
    } catch (e) {
      setStatus("❌ " + String(e.message));
    }
  };

  const cargarProximosVencer = async () => {
    try {
      const data = await api("/lotes/proximos-vencer?dias=30");
      list.setData(data);
      setFiltro("proximos");
    } catch (e) {
      setStatus("❌ " + String(e.message));
    }
  };

  const cargarTodos = () => {
    setFiltro("todos");
    list.reload();
  };

  const lotesAMostrar = Array.isArray(list.data) ? list.data : [];

  return (
    <div>
      <Header title="Lotes" right={<><span className="status">{status}</span><button className="btn" onClick={list.reload}><Icon name="rotate" />Refrescar</button></>} />

      <div className="panel">
        <div className="panel-header"><strong>Registrar Lote</strong></div>
        <div className="panel-body">
          <div className="form">
            <div className="field"><label>Número de Lote*</label><input value={numeroLote} onChange={e=>setNumeroLote(e.target.value)} placeholder="Ej: LOTE-001" /></div>
            <div className="field">
              <label>Producto*</label>
              <select value={productoId} onChange={e=>setProductoId(e.target.value)}>
                <option value="">Seleccione...</option>
                {Array.isArray(productos.data?.content || productos.data) && (productos.data?.content || productos.data).map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Bodega*</label>
              <select value={bodegaId} onChange={e=>setBodegaId(e.target.value)}>
                <option value="">Seleccione...</option>
                {Array.isArray(bodegas.data) && bodegas.data.map(b => (
                  <option key={b.id} value={b.id}>{b.nombre}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Proveedor (opcional)</label>
              <select value={proveedorId} onChange={e=>setProveedorId(e.target.value)}>
                <option value="">Seleccione...</option>
                {Array.isArray(proveedores.data) && proveedores.data.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>
            <div className="field"><label>Cantidad*</label><input type="number" value={cantidad} onChange={e=>setCantidad(e.target.value)} min="1" /></div>
            <div className="field"><label>Fecha Fabricación</label><input type="date" value={fechaFabricacion} onChange={e=>setFechaFabricacion(e.target.value)} /></div>
            <div className="field"><label>Fecha Vencimiento</label><input type="date" value={fechaVencimiento} onChange={e=>setFechaVencimiento(e.target.value)} /></div>
            <div className="actions"><button className="btn" onClick={crear}><Icon name="plus" />Crear Lote</button></div>
          </div>
        </div>
      </div>

      <div className="panel mt-8">
        <div className="panel-header">
          <strong>Listado de Lotes</strong>
          <div style={{marginLeft:'auto', display:'flex', gap:'10px'}}>
            <button className={`btn btn-sm ${filtro === 'todos' ? 'btn-primary' : ''}`} onClick={cargarTodos}>Todos</button>
            <button className={`btn btn-sm ${filtro === 'vencidos' ? 'btn-primary' : ''}`} onClick={cargarVencidos}>Vencidos</button>
            <button className={`btn btn-sm ${filtro === 'proximos' ? 'btn-primary' : ''}`} onClick={cargarProximosVencer}>Próximos a Vencer</button>
          </div>
        </div>
        <div className="panel-body">
          {list.loading && <Loading/>}
          {list.error && <ErrorState error={list.error} onRetry={list.reload} />}
          {!list.loading && !list.error && lotesAMostrar.length > 0 && (
            <table>
              <thead>
                <tr><th>Número</th><th>Producto</th><th>Bodega</th><th>Proveedor</th><th>Cantidad</th><th>Fabricación</th><th>Vencimiento</th><th>Estado</th></tr>
              </thead>
              <tbody>
                {lotesAMostrar.map(l => {
                  const hoy = new Date();
                  const vencimiento = l.fechaVencimiento ? new Date(l.fechaVencimiento) : null;
                  const estaVencido = vencimiento && vencimiento < hoy;
                  const proximoVencer = vencimiento && !estaVencido && (vencimiento - hoy) / (1000 * 60 * 60 * 24) <= 30;

                  return (
                    <tr key={l.id} style={estaVencido ? {backgroundColor:'#ffe0e0'} : proximoVencer ? {backgroundColor:'#fff9e0'} : {}}>
                      <td>{l.numeroLote}</td>
                      <td>{l.producto?.nombre || '—'}</td>
                      <td>{l.bodega?.nombre || '—'}</td>
                      <td>{l.proveedor?.nombre || '—'}</td>
                      <td>{l.cantidad}</td>
                      <td>{l.fechaFabricacion ? new Date(l.fechaFabricacion).toLocaleDateString() : '—'}</td>
                      <td>{l.fechaVencimiento ? new Date(l.fechaVencimiento).toLocaleDateString() : '—'}</td>
                      <td>
                        {estaVencido ? <span style={{color:'#dc3545', fontWeight:'bold'}}>❌ Vencido</span> :
                         proximoVencer ? <span style={{color:'#ffc107', fontWeight:'bold'}}>⚠️ Por vencer</span> :
                         <span style={{color:'#28a745'}}>✅ Vigente</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {!list.loading && !list.error && lotesAMostrar.length === 0 && (
            <p style={{textAlign:'center', padding:'20px', color:'#6c757d'}}>No hay lotes registrados</p>
          )}
        </div>
      </div>
    </div>
  );
}

function DevolucionesView() {
  const list = useFetch((signal) => api("/devoluciones", { signal }), []);
  const productos = useFetch((signal) => api("/productos", { signal }), []);
  const bodegas = useFetch((signal) => api("/bodegas", { signal }), []);
  const proveedores = useFetch((signal) => api("/proveedores/activos", { signal }), []);

  const [numeroDevolucion, setNumeroDevolucion] = React.useState("");
  const [tipo, setTipo] = React.useState("A_PROVEEDOR");
  const [proveedorId, setProveedorId] = React.useState("");
  const [bodegaId, setBodegaId] = React.useState("");
  const [motivo, setMotivo] = React.useState("");
  const [observaciones, setObservaciones] = React.useState("");
  const [detalles, setDetalles] = React.useState([]);
  const [status, setStatus] = React.useState("");
  const [verDetalle, setVerDetalle] = React.useState(null);

  const agregarDetalle = () => {
    setDetalles([...detalles, { productoId: "", cantidad: 1 }]);
  };

  const actualizarDetalle = (index, field, value) => {
    const nuevos = [...detalles];
    nuevos[index][field] = value;
    setDetalles(nuevos);
  };

  const eliminarDetalle = (index) => {
    setDetalles(detalles.filter((_, i) => i !== index));
  };

  const crear = async () => {
    try {
      if (!bodegaId || detalles.length === 0) {
        setStatus("❌ Complete todos los campos requeridos y agregue al menos un producto");
        return;
      }
      if (tipo === "A_PROVEEDOR" && !proveedorId) {
        setStatus("❌ Debe seleccionar un proveedor para devoluciones a proveedor");
        return;
      }

      const detallesParaEnviar = detalles.map(d => ({
        producto: { id: parseInt(d.productoId) },
        cantidad: parseInt(d.cantidad)
      }));

      await api("/devoluciones", {
        method: "POST",
        body: JSON.stringify({
          numeroDevolucion: numeroDevolucion || undefined,
          tipo,
          proveedor: tipo === "A_PROVEEDOR" && proveedorId ? { id: parseInt(proveedorId) } : null,
          bodega: { id: parseInt(bodegaId) },
          motivo,
          observaciones,
          detalles: detallesParaEnviar
        })
      });

      setNumeroDevolucion(""); setTipo("A_PROVEEDOR"); setProveedorId(""); setBodegaId("");
      setMotivo(""); setObservaciones(""); setDetalles([]);
      list.reload();
      setStatus("✅ Devolución creada exitosamente");
      setTimeout(() => setStatus(""), 3000);
    } catch (e) {
      setStatus("❌ " + String(e.message));
    }
  };

  const aprobar = async (id) => {
    try {
      await api(`/devoluciones/${id}/aprobar`, { method: "PUT" });
      list.reload();
      setStatus("✅ Devolución aprobada");
      setTimeout(() => setStatus(""), 3000);
    } catch (e) {
      setStatus("❌ " + String(e.message));
    }
  };

  const completar = async (id) => {
    try {
      await api(`/devoluciones/${id}/completar`, { method: "PUT" });
      list.reload();
      setStatus("✅ Devolución completada e inventario actualizado");
      setTimeout(() => setStatus(""), 3000);
    } catch (e) {
      setStatus("❌ " + String(e.message));
    }
  };

  return (
    <div>
      <Header title="Devoluciones" right={<><span className="status">{status}</span><button className="btn" onClick={list.reload}><Icon name="rotate" />Refrescar</button></>} />

      <div className="panel">
        <div className="panel-header"><strong>Registrar Devolución</strong></div>
        <div className="panel-body">
          <div className="form">
            <div className="field"><label>Número de Devolución (opcional)</label><input value={numeroDevolucion} onChange={e=>setNumeroDevolucion(e.target.value)} placeholder="Se genera automáticamente" /></div>
            <div className="field">
              <label>Tipo*</label>
              <select value={tipo} onChange={e=>{setTipo(e.target.value); if(e.target.value === "DE_CLIENTE") setProveedorId("");}}>
                <option value="A_PROVEEDOR">A Proveedor</option>
                <option value="DE_CLIENTE">De Cliente</option>
              </select>
            </div>
            {tipo === "A_PROVEEDOR" && (
              <div className="field">
                <label>Proveedor*</label>
                <select value={proveedorId} onChange={e=>setProveedorId(e.target.value)}>
                  <option value="">Seleccione...</option>
                  {Array.isArray(proveedores.data) && proveedores.data.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="field">
              <label>Bodega*</label>
              <select value={bodegaId} onChange={e=>setBodegaId(e.target.value)}>
                <option value="">Seleccione...</option>
                {Array.isArray(bodegas.data) && bodegas.data.map(b => (
                  <option key={b.id} value={b.id}>{b.nombre}</option>
                ))}
              </select>
            </div>
            <div className="field"><label>Motivo</label><input value={motivo} onChange={e=>setMotivo(e.target.value)} placeholder="Ej: Producto defectuoso" /></div>
            <div className="field"><label>Observaciones</label><textarea value={observaciones} onChange={e=>setObservaciones(e.target.value)} rows="2" /></div>

            <div style={{marginTop:'20px', padding:'15px', backgroundColor:'#f8f9fa', borderRadius:'4px'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px'}}>
                <strong>Productos a Devolver</strong>
                <button className="btn btn-sm" onClick={agregarDetalle}><Icon name="plus" />Agregar Producto</button>
              </div>
              {detalles.map((det, idx) => (
                <div key={idx} style={{display:'flex', gap:'10px', marginBottom:'10px', alignItems:'center'}}>
                  <select value={det.productoId} onChange={e=>actualizarDetalle(idx, 'productoId', e.target.value)} style={{flex:2}}>
                    <option value="">Seleccione producto...</option>
                    {Array.isArray(productos.data?.content || productos.data) && (productos.data?.content || productos.data).map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                  <input type="number" placeholder="Cantidad" value={det.cantidad} onChange={e=>actualizarDetalle(idx, 'cantidad', e.target.value)} style={{width:'120px'}} min="1" />
                  <button className="btn btn-sm" onClick={()=>eliminarDetalle(idx)} style={{backgroundColor:'#dc3545', color:'white'}}><Icon name="trash" /></button>
                </div>
              ))}
            </div>

            <div className="actions"><button className="btn" onClick={crear}><Icon name="plus" />Crear Devolución</button></div>
          </div>
        </div>
      </div>

      <div className="panel mt-8">
        <div className="panel-header"><strong>Listado de Devoluciones</strong></div>
        <div className="panel-body">
          {list.loading && <Loading/>}
          {list.error && <ErrorState error={list.error} onRetry={list.reload} />}
          {!list.loading && !list.error && Array.isArray(list.data) && list.data.length > 0 && (
            <table>
              <thead>
                <tr><th>Número</th><th>Tipo</th><th>Proveedor</th><th>Bodega</th><th>Estado</th><th>Fecha</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {list.data.map(d => (
                  <tr key={d.id}>
                    <td>{d.numeroDevolucion}</td>
                    <td><span className="badge">{d.tipo === 'A_PROVEEDOR' ? 'A Proveedor' : 'De Cliente'}</span></td>
                    <td>{d.proveedor?.nombre || '—'}</td>
                    <td>{d.bodega?.nombre || '—'}</td>
                    <td>
                      <span className={`badge ${
                        d.estado === 'COMPLETADA' ? 'badge-success' :
                        d.estado === 'APROBADA' ? 'badge-info' :
                        d.estado === 'RECHAZADA' ? 'badge-danger' :
                        'badge-warning'
                      }`}>{d.estado}</span>
                    </td>
                    <td>{new Date(d.fechaDevolucion).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-sm" onClick={()=>setVerDetalle(d)}><Icon name="eye" /></button>
                      {d.estado === 'PENDIENTE' && (
                        <button className="btn btn-sm" onClick={()=>aprobar(d.id)} style={{marginLeft:'5px', backgroundColor:'#17a2b8', color:'white'}}>Aprobar</button>
                      )}
                      {d.estado === 'APROBADA' && (
                        <button className="btn btn-sm" onClick={()=>completar(d.id)} style={{marginLeft:'5px', backgroundColor:'#28a745', color:'white'}}>Completar</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!list.loading && !list.error && Array.isArray(list.data) && list.data.length === 0 && (
            <p style={{textAlign:'center', padding:'20px', color:'#6c757d'}}>No hay devoluciones registradas</p>
          )}
        </div>
      </div>

      {verDetalle && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000}} onClick={()=>setVerDetalle(null)}>
          <div style={{backgroundColor:'white', borderRadius:'8px', padding:'24px', maxWidth:'600px', width:'90%', maxHeight:'80vh', overflow:'auto'}} onClick={e=>e.stopPropagation()}>
            <h3>Detalle de Devolución {verDetalle.numeroDevolucion}</h3>
            <div style={{marginTop:'15px'}}>
              <p><strong>Tipo:</strong> {verDetalle.tipo === 'A_PROVEEDOR' ? 'A Proveedor' : 'De Cliente'}</p>
              {verDetalle.proveedor && <p><strong>Proveedor:</strong> {verDetalle.proveedor.nombre}</p>}
              <p><strong>Bodega:</strong> {verDetalle.bodega?.nombre}</p>
              <p><strong>Estado:</strong> <span className={`badge ${verDetalle.estado === 'COMPLETADA' ? 'badge-success' : 'badge-warning'}`}>{verDetalle.estado}</span></p>
              <p><strong>Fecha:</strong> {new Date(verDetalle.fechaDevolucion).toLocaleString()}</p>
              {verDetalle.motivo && <p><strong>Motivo:</strong> {verDetalle.motivo}</p>}
              {verDetalle.observaciones && <p><strong>Observaciones:</strong> {verDetalle.observaciones}</p>}

              <h4 style={{marginTop:'20px', marginBottom:'10px'}}>Productos:</h4>
              <table style={{width:'100%'}}>
                <thead><tr><th>Producto</th><th>Cantidad</th></tr></thead>
                <tbody>
                  {verDetalle.detalles && verDetalle.detalles.map((d, idx) => (
                    <tr key={idx}>
                      <td>{d.producto?.nombre}</td>
                      <td>{d.cantidad}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="btn" onClick={()=>setVerDetalle(null)} style={{marginTop:'20px'}}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}

function NotificacionesView() {
  const list = useFetch((signal) => api("/notificaciones", { signal }), []);
  const count = useFetch((signal) => api("/notificaciones/count", { signal }), []);

  const [titulo, setTitulo] = React.useState("");
  const [mensaje, setMensaje] = React.useState("");
  const [tipo, setTipo] = React.useState("OTRO");
  const [status, setStatus] = React.useState("");
  const [filtro, setFiltro] = React.useState("todas");

  const crear = async () => {
    try {
      if (!titulo || !mensaje) {
        setStatus("❌ Complete todos los campos requeridos");
        return;
      }

      await api("/notificaciones", {
        method: "POST",
        body: JSON.stringify({ titulo, mensaje, tipo })
      });

      setTitulo(""); setMensaje(""); setTipo("OTRO");
      list.reload();
      count.reload();
      setStatus("✅ Notificación creada exitosamente");
      setTimeout(() => setStatus(""), 3000);
    } catch (e) {
      setStatus("❌ " + String(e.message));
    }
  };

  const marcarComoLeida = async (id) => {
    try {
      await api(`/notificaciones/${id}/leer`, { method: "PUT" });
      list.reload();
      count.reload();
    } catch (e) {
      setStatus("❌ " + String(e.message));
    }
  };

  const marcarTodasLeidas = async () => {
    try {
      await api("/notificaciones/leer-todas", { method: "PUT" });
      list.reload();
      count.reload();
      setStatus("✅ Todas las notificaciones marcadas como leídas");
      setTimeout(() => setStatus(""), 3000);
    } catch (e) {
      setStatus("❌ " + String(e.message));
    }
  };

  const cargarNoLeidas = async () => {
    try {
      const data = await api("/notificaciones/no-leidas");
      list.setData(data);
      setFiltro("no-leidas");
    } catch (e) {
      setStatus("❌ " + String(e.message));
    }
  };

  const cargarTodas = () => {
    setFiltro("todas");
    list.reload();
  };

  const notificacionesAMostrar = Array.isArray(list.data) ? list.data : [];

  const getIconoTipo = (tipo) => {
    switch(tipo) {
      case 'STOCK_BAJO': return '⚠️';
      case 'PRODUCTO_VENCIDO': return '❌';
      case 'PRODUCTO_POR_VENCER': return '⏰';
      case 'ORDEN_RECIBIDA': return '📦';
      default: return '🔔';
    }
  };

  const getTipoLabel = (tipo) => {
    switch(tipo) {
      case 'STOCK_BAJO': return 'Stock Bajo';
      case 'PRODUCTO_VENCIDO': return 'Producto Vencido';
      case 'PRODUCTO_POR_VENCER': return 'Por Vencer';
      case 'ORDEN_RECIBIDA': return 'Orden Recibida';
      default: return 'Otro';
    }
  };

  return (
    <div>
      <Header title="Notificaciones y Alertas" right={
        <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
          <span className="status">{status}</span>
          {count.data?.count > 0 && (
            <span style={{padding:'4px 8px', backgroundColor:'#dc3545', color:'white', borderRadius:'12px', fontSize:'12px', fontWeight:'bold'}}>
              {count.data.count} sin leer
            </span>
          )}
          <button className="btn" onClick={list.reload}><Icon name="rotate" />Refrescar</button>
        </div>
      } />

      <div className="panel">
        <div className="panel-header"><strong>Crear Notificación</strong></div>
        <div className="panel-body">
          <div className="form">
            <div className="field">
              <label>Tipo*</label>
              <select value={tipo} onChange={e=>setTipo(e.target.value)}>
                <option value="STOCK_BAJO">Stock Bajo</option>
                <option value="PRODUCTO_VENCIDO">Producto Vencido</option>
                <option value="PRODUCTO_POR_VENCER">Por Vencer</option>
                <option value="ORDEN_RECIBIDA">Orden Recibida</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>
            <div className="field"><label>Título*</label><input value={titulo} onChange={e=>setTitulo(e.target.value)} placeholder="Ej: Alerta de inventario" /></div>
            <div className="field"><label>Mensaje*</label><textarea value={mensaje} onChange={e=>setMensaje(e.target.value)} rows="3" placeholder="Descripción de la notificación..." /></div>
            <div className="actions"><button className="btn" onClick={crear}><Icon name="plus" />Crear Notificación</button></div>
          </div>
        </div>
      </div>

      <div className="panel mt-8">
        <div className="panel-header">
          <strong>Listado de Notificaciones</strong>
          <div style={{marginLeft:'auto', display:'flex', gap:'10px'}}>
            <button className={`btn btn-sm ${filtro === 'todas' ? 'btn-primary' : ''}`} onClick={cargarTodas}>Todas</button>
            <button className={`btn btn-sm ${filtro === 'no-leidas' ? 'btn-primary' : ''}`} onClick={cargarNoLeidas}>No Leídas</button>
            <button className="btn btn-sm" onClick={marcarTodasLeidas}>Marcar Todas Leídas</button>
          </div>
        </div>
        <div className="panel-body">
          {list.loading && <Loading/>}
          {list.error && <ErrorState error={list.error} onRetry={list.reload} />}
          {!list.loading && !list.error && notificacionesAMostrar.length > 0 && (
            <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
              {notificacionesAMostrar.map(n => (
                <div
                  key={n.id}
                  style={{
                    padding:'16px',
                    border:'1px solid #dee2e6',
                    borderRadius:'8px',
                    backgroundColor: n.leida ? '#f8f9fa' : '#fff',
                    borderLeft: n.leida ? '4px solid #6c757d' : '4px solid #007bff',
                    cursor: !n.leida ? 'pointer' : 'default',
                    transition:'all 0.2s'
                  }}
                  onClick={() => !n.leida && marcarComoLeida(n.id)}
                >
                  <div style={{display:'flex', alignItems:'start', gap:'12px'}}>
                    <span style={{fontSize:'24px'}}>{getIconoTipo(n.tipo)}</span>
                    <div style={{flex:1}}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'start', marginBottom:'4px'}}>
                        <div>
                          <strong style={{fontSize:'16px'}}>{n.titulo}</strong>
                          {!n.leida && <span style={{marginLeft:'8px', padding:'2px 6px', backgroundColor:'#007bff', color:'white', borderRadius:'4px', fontSize:'10px'}}>NUEVA</span>}
                        </div>
                        <span style={{fontSize:'12px', color:'#6c757d'}}>{new Date(n.createdAt).toLocaleString()}</span>
                      </div>
                      <p style={{margin:'4px 0', color:'#495057'}}>{n.mensaje}</p>
                      <div style={{display:'flex', gap:'8px', marginTop:'8px'}}>
                        <span className="badge">{getTipoLabel(n.tipo)}</span>
                        {n.leida && <span className="badge badge-success">Leída</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!list.loading && !list.error && notificacionesAMostrar.length === 0 && (
            <p style={{textAlign:'center', padding:'20px', color:'#6c757d'}}>No hay notificaciones</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Main App with authentication
function App() {
  const [route, setRoute] = React.useState("dashboard");
  const [query, setQuery] = React.useState("");
  const { user } = AuthContext.use();
  return (
    <SearchContext.Context.Provider value={{ query, setQuery }}>
      <div className="layout">
        <Sidebar route={route} setRoute={setRoute} />
        <main className="content">
          {route === 'dashboard' && <Dashboard />}
          {route === 'bodegas' && <BodegasView />}
          {route === 'productos' && <ProductosView />}
          {route === 'movimientos' && <MovimientosView />}
          {route === 'inventario' && <InventarioView />}
          {route === 'proveedores' && <ProveedoresView />}
          {route === 'ordenes' && <OrdenesCompraView />}
          {route === 'lotes' && <LotesView />}
          {route === 'devoluciones' && <DevolucionesView />}
          {route === 'notificaciones' && <NotificacionesView />}
          {route === 'reportes' && <ReportesView />}
          {route === 'auditoria' && <AuditoriaView />}
          {route === 'usuarios' && (user?.rol === 'ADMIN' ? <Register submitPath="/auth/register" defaultRol="EMPLEADO" allowRoleSelect={true} onSuccess={()=>{}} onLoginClick={()=>setRoute('dashboard')} /> : <div className="panel"><div className="panel-body">403</div></div>)}
        </main>
      </div>
    </SearchContext.Context.Provider>
  );
}

// Root component with authentication check
function Root() {
  const [user, setUser] = React.useState(null);
  const [isChecking, setIsChecking] = React.useState(true);
  const [authView, setAuthView] = React.useState("login");
  const [darkMode, setDarkMode] = React.useState(() => {
    const saved = localStorage.getItem("logitrack_theme");
    return saved === "dark";
  });

  React.useEffect(() => {
    // Check if user is already logged in
    const token = getToken();
    if (token) {
      // Optionally verify token with backend
      const userData = getUserData();
      if (userData) { setUser(userData); }
      else {
        const claims = parseJwt(token) || {};
        const roles = Array.isArray(claims.roles) ? claims.roles : [];
        const rol = roles.length ? String(roles[0]).replace('ROLE_','') : undefined;
        setUser({ token, username: claims.sub, rol });
      }
    }
    setIsChecking(false);
  }, []);

  React.useEffect(() => {
    // Apply dark mode class to body
    if (darkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem("logitrack_theme", "dark");
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem("logitrack_theme", "light");
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    removeToken();
    setUser(null);
  };

  if (isChecking) {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <div className="auth-logo">LT</div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <ThemeContext.Context.Provider value={{ darkMode, toggleDarkMode }}>
        {authView === "register-admin" ? (
          <Register submitPath="/auth/register-admin" defaultRol="ADMIN" allowRoleSelect={false} onSuccess={handleLoginSuccess} onLoginClick={() => setAuthView("login")} />
        ) : (
          <Login onSuccess={handleLoginSuccess} onRegisterClick={() => setAuthView("register-admin")} />
        )}
      </ThemeContext.Context.Provider>
    );
  }

  return (
    <ThemeContext.Context.Provider value={{ darkMode, toggleDarkMode }}>
      <AuthContext.Context.Provider value={{ user, setUser, logout: handleLogout }}>
        <App />
      </AuthContext.Context.Provider>
    </ThemeContext.Context.Provider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root/>);
