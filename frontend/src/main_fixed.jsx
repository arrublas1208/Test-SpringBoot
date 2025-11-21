import React from 'react'
import ReactDOM from 'react-dom/client'
import './style.css'
import { Icon } from './icons.jsx'
import { t } from './i18n.js'

const API_BASE = window.location.origin + "/logitrack/api";

// Auth utilities - FIXED P47: Store complete user data
const AUTH_TOKEN_KEY = "logitrack_jwt";
const AUTH_USER_KEY = "logitrack_user";
const getToken = () => localStorage.getItem(AUTH_TOKEN_KEY);
const setToken = (token) => localStorage.setItem(AUTH_TOKEN_KEY, token);
const removeToken = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
};
const getUser = () => {
  const userData = localStorage.getItem(AUTH_USER_KEY);
  return userData ? JSON.parse(userData) : null;
};
const setUser = (userData) => localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));

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

function normalize(v) { return (v == null ? "" : v).toString().toLowerCase(); }

function Sidebar({ route, setRoute }) {
  const { logout, user } = AuthContext.use();
  const items = [
    { key: "dashboard", label: t('dashboard'), icon: "chart-line" },
    { key: "bodegas", label: t('bodegas'), icon: "warehouse" },
    { key: "productos", label: t('productos'), icon: "box" },
    { key: "movimientos", label: t('movimientos'), icon: "arrows-left-right" },
    { key: "inventario", label: t('inventario'), icon: "clipboard-list" },
    { key: "reportes", label: t('reportes'), icon: "file-lines" },
    { key: "auditoria", label: t('auditoria'), icon: "list-check" },
  ];

  // Filter menu items based on role
  const filteredItems = user?.rol === 'ADMIN' ? items : items.filter(it => it.key !== 'auditoria' && it.key !== 'bodegas');

  return (
    <aside className="sidebar">
      <div className="brand">
        <div style={{fontSize: '24px', fontWeight: 'bold'}}>LT</div>
        <div style={{fontSize: '10px', opacity: 0.7, marginTop: '4px'}}>{user?.rol || ''}</div>
      </div>
      <div className="nav">
        {filteredItems.map(it => (
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
  return (
    <div className="header">
      <div className="search-box"><input placeholder={t('buscar')} value={query} onChange={e=>setQuery(e.target.value)} /></div>
      <div className="toolbar">
        <span className="profile" style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <Icon name="user" />
          <span>{user?.username || 'Usuario'}</span>
          {user?.rol && <span className="badge" style={{fontSize: '11px', padding: '2px 6px'}}>{user.rol}</span>}
        </span>
        {right}
      </div>
    </div>
  );
}

// IMPROVED VISUAL: Loading component with spinner
function Loading() {
  return (
    <div className="panel">
      <div className="panel-body" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '32px'}}>
        <div className="spinner"></div>
        <span>{t('cargando')}</span>
      </div>
    </div>
  );
}

// IMPROVED VISUAL: Error state with icon
function ErrorState({ error, onRetry }) {
  return (
    <div className="panel">
      <div className="panel-body" style={{textAlign: 'center', padding: '32px'}}>
        <Icon name="exclamation-triangle" style={{fontSize: '48px', color: 'var(--danger)', marginBottom: '16px'}} />
        <div style={{marginBottom: '16px'}}>{String(error && error.message || t('error'))}</div>
        <div className="form actions">
          <button className="btn" onClick={onRetry}>
            <Icon name="rotate" />{t('reintentar')}
          </button>
        </div>
      </div>
    </div>
  );
}

// IMPROVED VISUAL: Empty state with icon
function EmptyState({ message, icon }) {
  return (
    <div className="panel">
      <div className="panel-body" style={{textAlign: 'center', padding: '32px'}}>
        <Icon name={icon || "inbox"} style={{fontSize: '48px', opacity: 0.3, marginBottom: '16px'}} />
        <div style={{opacity: 0.7}}>{message || t('sin_datos')}</div>
      </div>
    </div>
  );
}

function Dashboard() {
  const resumen = useFetch((signal) => api("/reportes/resumen", { signal }), []);
  const ultimos = useFetch((signal) => api("/reportes/movimientos/ultimos", { signal }), []);
  const bodegas = useFetch((signal) => api("/bodegas", { signal }), []);
  const productos = useFetch((signal) => api("/productos", { signal }), []);

  // Show loading state for cards
  const isLoadingCards = bodegas.loading || productos.loading || resumen.loading;

  return (
    <div>
      <Header title={t('dashboard')} right={<span className="status">{new Date().toLocaleTimeString()}</span>} />
      <div className="cards">
        <div className="card">
          <div className="label"><Icon name="warehouse" /> {t('bodegas')}</div>
          <div className="value">{isLoadingCards ? <div className="spinner-small"></div> : (Array.isArray(bodegas.data) ? bodegas.data.length : '—')}</div>
        </div>
        <div className="card">
          <div className="label"><Icon name="box" /> {t('productos')}</div>
          <div className="value">{isLoadingCards ? <div className="spinner-small"></div> : (Array.isArray(productos.data) ? productos.data.length : '—')}</div>
        </div>
        <div className="card">
          <div className="label"><Icon name="exclamation-triangle" /> {t('stock_bajo')}</div>
          <div className="value">{isLoadingCards ? <div className="spinner-small"></div> : (Array.isArray(resumen.data && resumen.data.stockBajo) ? resumen.data.stockBajo.length : '—')}</div>
        </div>
        <div className="card">
          <div className="label"><Icon name="arrows-left-right" /> {t('ultimos_mov')}</div>
          <div className="value">{ultimos.loading ? <div className="spinner-small"></div> : (Array.isArray(ultimos.data) ? ultimos.data.length : '—')}</div>
        </div>
      </div>
      <div className="panel mt-16">
        <div className="panel-header"><strong>{t('ultimos_mov')}</strong>
          <button className="btn secondary" onClick={ultimos.reload} disabled={ultimos.loading}>
            <Icon name="rotate" />{t('refrescar')}
          </button>
        </div>
        <div className="panel-body">
          {ultimos.loading && <Loading/>}
          {ultimos.error && <ErrorState error={ultimos.error} onRetry={ultimos.reload} />}
          {!ultimos.loading && !ultimos.error && (Array.isArray(ultimos.data) && ultimos.data.length === 0) && <EmptyState message="No hay movimientos recientes" icon="arrows-left-right"/>}
          {!ultimos.loading && !ultimos.error && Array.isArray(ultimos.data) && ultimos.data.length > 0 && <MovimientosTable movimientos={ultimos.data || []} />}
        </div>
      </div>
      <div className="grid-2 mt-16">
        <div className="panel">
          <div className="panel-header"><strong>{t('top_productos')}</strong></div>
          <div className="panel-body">
            <TopProductos />
          </div>
        </div>
        <div className="panel">
          <div className="panel-header"><strong>{t('stock_por_bodega')}</strong></div>
          <div className="panel-body">
            <StockPorBodega resumen={resumen.data} />
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
          <th>Fecha</th><th>Tipo</th><th>Usuario</th><th>Producto</th><th>Cantidad</th><th>Origen</th><th>Destino</th>{onDelete && <th></th>}
        </tr>
      </thead>
      <tbody>
        {filtered.map(m => (
          (m.detalles && m.detalles.length) ? m.detalles.map((d,i)=>(
            <tr key={m.id+"-"+i}>
              <td>{new Date(m.fecha).toLocaleString()}</td>
              <td>
                <span className={`badge ${m.tipo==='ENTRADA'?'success':(m.tipo==='SALIDA'?'danger':'info')}`}>
                  {m.tipo}
                </span>
              </td>
              <td>{m.usuario}</td>
              <td>{d.producto}</td>
              <td><strong>{d.cantidad}</strong></td>
              <td>{m.bodegaOrigen || '—'}</td>
              <td>{m.bodegaDestino || '—'}</td>
              {onDelete && <td>{i===0 ? (<button className="btn danger" onClick={()=>{if(window.confirm('¿Eliminar este movimiento?')) onDelete(m.id)}}><Icon name="trash" /></button>) : null}</td>}
            </tr>
          )) : (
            <tr key={m.id}>
              <td>{new Date(m.fecha).toLocaleString()}</td>
              <td><span className={`badge ${m.tipo==='ENTRADA'?'success':(m.tipo==='SALIDA'?'danger':'info')}`}>{m.tipo}</span></td>
              <td>{m.usuario}</td>
              <td>—</td><td>—</td>
              <td>{m.bodegaOrigen || '—'}</td>
              <td>{m.bodegaDestino || '—'}</td>
              {onDelete && <td><button className="btn danger" onClick={()=>{if(window.confirm('¿Eliminar este movimiento?')) onDelete(m.id)}}><Icon name="trash" /></button></td>}
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
        {loading && <tr><td colSpan="2"><div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><div className="spinner-small"></div>{t('cargando')}</div></td></tr>}
        {error && <tr><td colSpan="2">{String(error.message)} <button className="btn" onClick={reload}><Icon name="rotate" /></button></td></tr>}
        {!loading && !error && (data||[]).length === 0 && <tr><td colSpan="2" style={{textAlign: 'center', opacity: 0.5}}>Sin datos</td></tr>}
        {!loading && !error && (data||[]).map((r,i)=> (
          <tr key={i}><td>{r.producto}</td><td><strong>{r.totalMovido}</strong></td></tr>
        ))}
      </tbody>
    </table>
  );
}

function StockPorBodega({ resumen }) {
  const data = (resumen && resumen.stockPorBodega) ? resumen.stockPorBodega : [];
  return (
    <table>
      <thead><tr><th>Bodega</th><th>Total productos</th><th>Valor total</th></tr></thead>
      <tbody>
        {data.length === 0 && <tr><td colSpan="3" style={{textAlign: 'center', opacity: 0.5}}>Sin datos</td></tr>}
        {(data||[]).map((r,i)=> (
          <tr key={i}><td>{r.bodega}</td><td>{r.totalProductos}</td><td><strong>${String(r.valorTotal)}</strong></td></tr>
        ))}
      </tbody>
    </table>
  );
}

function BodegasView() {
  const list = useFetch((signal) => api("/bodegas", { signal }), []);
  const [nombre, setNombre] = React.useState("");
  const [direccion, setDireccion] = React.useState("");
  const [capacidad, setCapacidad] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [editId, setEditId] = React.useState(null);
  const [editNombre, setEditNombre] = React.useState("");
  const [editDireccion, setEditDireccion] = React.useState("");
  const [editCapacidad, setEditCapacidad] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  // FIXED P9: Clear status after 3 seconds
  React.useEffect(() => {
    if (status) {
      const timer = setTimeout(() => setStatus(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const crear = async () => {
    // FIXED P7: Add validation
    if (!nombre.trim()) {
      setStatus("❌ El nombre es requerido");
      return;
    }

    // FIXED P10: Prevent double submit
    if (submitting) return;
    setSubmitting(true);

    try {
      await api("/bodegas", { method: "POST", body: JSON.stringify({ nombre, direccion, capacidad: Number(capacidad) || 0 }) });
      setNombre(""); setDireccion(""); setCapacidad("");
      list.reload();
      setStatus("✅ Bodega creada exitosamente");
    } catch (e) {
      setStatus("❌ " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // FIXED P6: Add confirmation
  const eliminar = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar esta bodega?')) return;
    try {
      await api(`/bodegas/${id}`, { method: "DELETE" });
      list.reload();
      setStatus("✅ Bodega eliminada");
    } catch (e) {
      setStatus("❌ " + e.message);
    }
  };

  const startEdit = (b) => { setEditId(b.id); setEditNombre(b.nombre||""); setEditDireccion(b.direccion||""); setEditCapacidad(String(b.capacidad||0)); };
  const cancelEdit = () => { setEditId(null); setEditNombre(""); setEditDireccion(""); setEditCapacidad(""); };

  const guardarEdit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await api(`/bodegas/${editId}`, { method: "PUT", body: JSON.stringify({ nombre: editNombre, direccion: editDireccion, capacidad: Number(editCapacidad)||0 }) });
      list.reload();
      cancelEdit();
      setStatus("✅ Bodega actualizada");
    } catch (e) {
      setStatus("❌ " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Header title={t('bodegas')} right={<>
        {status && <span className="status" style={{color: status.startsWith('✅') ? 'var(--success)' : 'var(--danger)'}}>{status}</span>}
        <button className="btn" onClick={list.reload} disabled={list.loading}>
          <Icon name="rotate" />{t('refrescar')}
        </button>
      </>} />
      <div className="grid-2">
        <div className="panel">
          <div className="panel-header"><strong><Icon name="plus" /> {t('crear_bodega')}</strong></div>
          <div className="panel-body">
            <div className="form">
              <div className="field"><label>{t('nombre')} *</label><input value={nombre} onChange={e=>setNombre(e.target.value)} required /></div>
              <div className="field"><label>{t('direccion')}</label><input value={direccion} onChange={e=>setDireccion(e.target.value)} /></div>
              <div className="field"><label>{t('capacidad')}</label><input type="number" value={capacidad} onChange={e=>setCapacidad(e.target.value)} /></div>
              <div className="actions">
                <button className="btn" onClick={crear} disabled={submitting}>
                  {submitting ? <><div className="spinner-small"></div> Creando...</> : <><Icon name="plus" />{t('crear')}</>}
                </button>
              </div>
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
            })() && <EmptyState message="No hay bodegas registradas" icon="warehouse"/>}
            {!list.loading && !list.error && (
              <table>
                <thead><tr><th>ID</th><th>{t('nombre')}</th><th>{t('direccion')}</th><th>{t('capacidad')}</th><th></th></tr></thead>
                <tbody>
                  {(list.data||[]).map(b => (
                    <tr key={b.id} style={editId===b.id ? {backgroundColor: 'rgba(56, 248, 182, 0.05)'} : {}}>
                      <td>{b.id}</td>
                      <td>{editId===b.id ? (<input value={editNombre} onChange={e=>setEditNombre(e.target.value)} />) : b.nombre}</td>
                      <td>{editId===b.id ? (<input value={editDireccion} onChange={e=>setEditDireccion(e.target.value)} />) : (b.direccion||'—')}</td>
                      <td>{editId===b.id ? (<input type="number" value={editCapacidad} onChange={e=>setEditCapacidad(e.target.value)} />) : b.capacidad}</td>
                      <td>{editId===b.id ? (<>
                        <button className="btn" onClick={guardarEdit} disabled={submitting}>
                          {submitting ? <div className="spinner-small"></div> : <Icon name="check" />}
                        </button>
                        <button className="btn secondary" onClick={cancelEdit}><Icon name="xmark" /></button>
                      </>) : (<>
                        <button className="btn" onClick={()=>startEdit(b)}><Icon name="pen" /></button>
                        <button className="btn danger" onClick={()=>eliminar(b.id)}><Icon name="trash" /></button>
                      </>)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// I'll continue with productos, inventario and movimientos in the next section...
// Due to character limits, I'll create the complete file by writing the rest

