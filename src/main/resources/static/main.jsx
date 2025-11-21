/* global React, ReactDOM */
const API_BASE = window.location.origin + "/api";

async function api(path, options = {}) {
  const res = await fetch(API_BASE + path, Object.assign({
    headers: { "Content-Type": "application/json" }
  }, options || {}));
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    const msg = (err && err.details && err.details.message) || (err && err.message) || ('Error ' + res.status);
    throw new Error(msg);
  }
  // 204 No Content
  if (res.status === 204) return null;
  return await res.json();
}

function useFetch(getter, deps = []) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const run = React.useCallback(() => {
    const controller = new AbortController();
    setLoading(true); setError(null);
    Promise.resolve(getter(controller.signal))
      .then(res => { if (!controller.signal.aborted) setData(res); })
      .catch(e => { if (e && e.name === 'AbortError') return; setError(e); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return controller;
  }, deps);
  React.useEffect(() => {
    const controller = run();
    return () => { controller.abort(); };
  }, [run]);
  return { data, loading, error, reload: run };
}

// Búsqueda global
const SearchContext = {
  Context: React.createContext({ query: "", setQuery: () => {} }),
  use() { return React.useContext(this.Context); }
};
function normalize(v) { return (v == null ? "" : v).toString().toLowerCase(); }

function Sidebar({ route, setRoute }) {
  const items = [
    { key: "dashboard", label: "Dashboard", icon: "fa-chart-line" },
    { key: "bodegas", label: "Bodegas", icon: "fa-warehouse" },
    { key: "productos", label: "Productos", icon: "fa-box" },
    { key: "movimientos", label: "Movimientos", icon: "fa-arrows-left-right" },
    { key: "inventario", label: "Inventario", icon: "fa-clipboard-list" },
    { key: "reportes", label: "Reportes", icon: "fa-file-lines" },
    { key: "auditoria", label: "Auditoría", icon: "fa-list-check" },
  ];
  return (
    <aside className="sidebar">
      <div className="brand">LT</div>
      <div className="nav">
        {items.map(it => (
          <button key={it.key} className={route===it.key?"active":""} onClick={() => setRoute(it.key)}>
            <i className={`fa-solid ${it.icon}`} /> {it.label}
          </button>
        ))}
      </div>
    </aside>
  );
}

function Header({ title, right }) {
  const { query, setQuery } = SearchContext.use();
  return (
    <div className="header">
      <div className="search-box"><input placeholder="Buscar..." value={query} onChange={e=>setQuery(e.target.value)} /></div>
      <div className="toolbar"><span className="profile">Admin</span>{right}</div>
    </div>
  );
}

function Dashboard() {
  const resumen = useFetch(() => api("/reportes/resumen"), []);
  const ultimos = useFetch(() => api("/reportes/movimientos/ultimos"), []);
  const bodegas = useFetch(() => api("/bodegas"), []);
  const productos = useFetch(() => api("/productos"), []);
  return (
    <div>
      <Header title="Dashboard" right={<span className="status">Actualizado</span>} />
      <div className="cards">
        <div className="card"><div className="label">Bodegas</div><div className="value">{Array.isArray(bodegas.data) ? bodegas.data.length : '—'}</div></div>
        <div className="card"><div className="label">Productos</div><div className="value">{Array.isArray(productos.data) ? productos.data.length : '—'}</div></div>
        <div className="card"><div className="label">Stock Bajo</div><div className="value">{Array.isArray(resumen.data && resumen.data.stockBajo) ? resumen.data.stockBajo.length : '—'}</div></div>
        <div className="card"><div className="label">Movimientos (10 últimos)</div><div className="value">{Array.isArray(ultimos.data) ? ultimos.data.length : '—'}</div></div>
      </div>
      <div className="panel mt-16">
        <div className="panel-header"><strong>Últimos movimientos</strong>
          <button className="btn secondary" onClick={ultimos.reload}><i className="fa-solid fa-rotate"/>Refrescar</button>
        </div>
        <div className="panel-body">
          <MovimientosTable movimientos={ultimos.data || []} />
        </div>
      </div>
      <div className="grid-2 mt-16">
        <div className="panel">
          <div className="panel-header"><strong>Productos más movidos</strong></div>
          <div className="panel-body">
            <TopProductos />
          </div>
        </div>
        <div className="panel">
          <div className="panel-header"><strong>Stock por bodega</strong></div>
          <div className="panel-body">
            <StockPorBodega resumen={resumen.data} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MovimientosTable({ movimientos }) {
  const { query } = SearchContext.use();
  const q = normalize(query);
  const filtered = (movimientos||[]).filter(m => {
    const base = [m.usuario, m.tipo, m.bodegaOrigen, m.bodegaDestino].map(normalize).join(" ");
    const dets = (m.detalles||[]).map(d=>[d.producto, d.cantidad].map(normalize).join(" ")).join(" ");
    return (base + " " + dets).includes(q);
  });
  return (
    <table>
      <thead>
        <tr>
          <th>Fecha</th><th>Tipo</th><th>Usuario</th><th>Producto</th><th>Cantidad</th><th>Origen</th><th>Destino</th>
        </tr>
      </thead>
      <tbody>
        {filtered.map(m => (
          (m.detalles && m.detalles.length) ? m.detalles.map(d => (
            <tr key={`${m.id}-${d.id}`}>
              <td>{new Date(m.fecha).toLocaleString()}</td>
              <td><span className={`badge ${m.tipo==='ENTRADA'?'success':(m.tipo==='SALIDA'?'warn':'')}`}>{m.tipo}</span></td>
              <td>{m.usuario}</td>
              <td>{d.producto}</td>
              <td>{d.cantidad}</td>
              <td>{m.bodegaOrigen || '—'}</td>
              <td>{m.bodegaDestino || '—'}</td>
            </tr>
          )) : (
            <tr key={m.id}>
              <td>{new Date(m.fecha).toLocaleString()}</td>
              <td>{m.tipo}</td>
              <td>{m.usuario}</td>
              <td>—</td><td>—</td>
              <td>{m.bodegaOrigen || '—'}</td>
              <td>{m.bodegaDestino || '—'}</td>
            </tr>
          )
        ))}
      </tbody>
    </table>
  );
}

function TopProductos() {
  const { data } = useFetch(() => api("/reportes/movimientos/top-productos"), []);
  const { query } = SearchContext.use();
  const q = normalize(query);
  const rows = (data||[]).filter(r => normalize(r.producto).includes(q));
  return (
    <table>
      <thead><tr><th>Producto</th><th>Total movido</th></tr></thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}><td>{r.producto}</td><td>{r.totalMovido}</td></tr>
        ))}
      </tbody>
    </table>
  );
}

function StockPorBodega({ resumen }) {
  const { query } = SearchContext.use();
  const q = normalize(query);
  const rows = ((resumen && resumen.stockPorBodega) ? resumen.stockPorBodega : []).filter(r => normalize(r.bodega).includes(q));
  return (
    <table>
      <thead><tr><th>Bodega</th><th>Total productos</th><th>Valor total</th></tr></thead>
      <tbody>
        {rows.map((r,i) => (
          <tr key={i}><td>{r.bodega}</td><td>{r.totalProductos}</td><td>${String(r.valorTotal)}</td></tr>
        ))}
      </tbody>
    </table>
  );
}

function BodegasView() {
  const list = useFetch(() => api("/bodegas"), []);
  const { query } = SearchContext.use();
  const q = normalize(query);
  const [nombre, setNombre] = React.useState("");
  const [direccion, setDireccion] = React.useState("");
  const [capacidad, setCapacidad] = React.useState("");
  const [editId, setEditId] = React.useState(null);
  const [editNombre, setEditNombre] = React.useState("");
  const [editDireccion, setEditDireccion] = React.useState("");
  const [editCapacidad, setEditCapacidad] = React.useState("");
  const [status, setStatus] = React.useState("");
  const crear = async () => {
    if (!nombre.trim() || !direccion.trim()) { setStatus("Complete nombre y dirección"); return; }
    await api("/bodegas", { method: "POST", body: JSON.stringify({ nombre, direccion, capacidad: Number(capacidad) || 0 }) });
    setNombre(""); setDireccion(""); setCapacidad(""); setStatus("Bodega creada"); list.reload();
  };
  const eliminar = async (id) => { await api(`/bodegas/${id}`, { method: "DELETE" }); list.reload(); };
  const startEdit = (b) => { setEditId(b.id); setEditNombre(b.nombre); setEditDireccion(b.direccion||""); setEditCapacidad(String(b.capacidad||0)); };
  const cancelEdit = () => { setEditId(null); setEditNombre(""); setEditDireccion(""); setEditCapacidad(""); };
  const guardarEdit = async () => {
    if (!editNombre.trim() || !editDireccion.trim()) { setStatus("Complete nombre y dirección"); return; }
    await api(`/bodegas/${editId}`, { method: "PUT", body: JSON.stringify({ nombre: editNombre, direccion: editDireccion, capacidad: Number(editCapacidad)||0 }) });
    setStatus("Bodega actualizada"); cancelEdit(); list.reload();
  };
  return (
    <div>
      <Header title="Bodegas" right={<><span className="status muted">{status}</span><button className="btn" onClick={list.reload}><i className="fa-solid fa-rotate"/>Refrescar</button></>} />
      <div className="panel">
        <div className="panel-header"><strong>Crear bodega</strong></div>
        <div className="panel-body">
          <div className="form">
            <div className="field"><label>Nombre</label><input value={nombre} onChange={e=>setNombre(e.target.value)} /></div>
            <div className="field"><label>Dirección</label><input value={direccion} onChange={e=>setDireccion(e.target.value)} /></div>
            <div className="field"><label>Capacidad</label><input type="number" value={capacidad} onChange={e=>setCapacidad(e.target.value)} /></div>
            <div className="actions"><button className="btn" onClick={crear}><i className="fa-solid fa-plus"/>Crear</button></div>
          </div>
        </div>
      </div>
      <div className="panel mt-16">
        <div className="panel-header"><strong>Listado</strong></div>
        <div className="panel-body">
          <table>
            <thead><tr><th>ID</th><th>Nombre</th><th>Dirección</th><th>Capacidad</th><th></th></tr></thead>
            <tbody>
              {(list.data||[]).filter(b => (normalize(b.nombre)+" "+normalize(b.direccion)).includes(q)).map(b => (
                <tr key={b.id}>
                  <td>{b.id}</td>
                  <td>{editId===b.id ? (<input value={editNombre} onChange={e=>setEditNombre(e.target.value)} />) : b.nombre}</td>
                  <td>{editId===b.id ? (<input value={editDireccion} onChange={e=>setEditDireccion(e.target.value)} />) : (b.direccion||'')}</td>
                  <td>{editId===b.id ? (<input type="number" value={editCapacidad} onChange={e=>setEditCapacidad(e.target.value)} />) : b.capacidad}</td>
                  <td>
                    {editId===b.id ? (
                      <>
                        <button className="btn" onClick={guardarEdit}><i className="fa-solid fa-check"/>Guardar</button>
                        <button className="btn secondary" onClick={cancelEdit}><i className="fa-solid fa-xmark"/>Cancelar</button>
                      </>
                    ) : (
                      <>
                        <button className="btn" onClick={()=>startEdit(b)}><i className="fa-solid fa-pen"/>Editar</button>
                        <button className="btn danger" onClick={()=>eliminar(b.id)}><i className="fa-solid fa-trash"/>Eliminar</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ProductosView() {
  const list = useFetch(() => api("/productos"), []);
  const { query } = SearchContext.use();
  const q = normalize(query);
  const [nombre, setNombre] = React.useState("");
  const [categoria, setCategoria] = React.useState("");
  const [precio, setPrecio] = React.useState("");
  const [stock, setStock] = React.useState("");
  const [editId, setEditId] = React.useState(null);
  const [editNombre, setEditNombre] = React.useState("");
  const [editCategoria, setEditCategoria] = React.useState("");
  const [editPrecio, setEditPrecio] = React.useState("");
  const [editStock, setEditStock] = React.useState("");
  const [status, setStatus] = React.useState("");
  const crear = async () => {
    if (!nombre.trim()) { setStatus("Nombre es obligatorio"); return; }
    await api("/productos", { method: "POST", body: JSON.stringify({ nombre, categoria, precio: Number(precio)||0, stock: Number(stock)||0 }) });
    setNombre(""); setCategoria(""); setPrecio(""); setStock(""); setStatus("Producto creado"); list.reload();
  };
  const eliminar = async (id) => { await api(`/productos/${id}`, { method: "DELETE" }); list.reload(); };
  const startEdit = (p) => { setEditId(p.id); setEditNombre(p.nombre); setEditCategoria(p.categoria||""); setEditPrecio(String(p.precio||0)); setEditStock(String(p.stock||0)); };
  const cancelEdit = () => { setEditId(null); setEditNombre(""); setEditCategoria(""); setEditPrecio(""); setEditStock(""); };
  const guardarEdit = async () => {
    if (!editNombre.trim()) { setStatus("Nombre es obligatorio"); return; }
    await api(`/productos/${editId}`, { method: "PUT", body: JSON.stringify({ nombre: editNombre, categoria: editCategoria, precio: Number(editPrecio)||0, stock: Number(editStock)||0 }) });
    setStatus("Producto actualizado"); cancelEdit(); list.reload();
  };
  return (
    <div>
      <Header title="Productos" right={<><span className="status muted">{status}</span><button className="btn" onClick={list.reload}><i className="fa-solid fa-rotate"/>Refrescar</button></>} />
      <div className="panel">
        <div className="panel-header"><strong>Crear producto</strong></div>
        <div className="panel-body">
          <div className="form">
            <div className="field"><label>Nombre</label><input value={nombre} onChange={e=>setNombre(e.target.value)} /></div>
            <div className="field"><label>Categoría</label><input value={categoria} onChange={e=>setCategoria(e.target.value)} /></div>
            <div className="field"><label>Precio</label><input type="number" value={precio} onChange={e=>setPrecio(e.target.value)} /></div>
            <div className="field"><label>Stock</label><input type="number" value={stock} onChange={e=>setStock(e.target.value)} /></div>
            <div className="actions"><button className="btn" onClick={crear}><i className="fa-solid fa-plus"/>Crear</button></div>
          </div>
        </div>
      </div>
      <div className="panel mt-16">
        <div className="panel-header"><strong>Listado</strong></div>
        <div className="panel-body">
          <table>
            <thead><tr><th>ID</th><th>Nombre</th><th>Categoría</th><th>Precio</th><th>Stock</th><th></th></tr></thead>
            <tbody>
              {(list.data||[]).filter(p => (normalize(p.nombre)+" "+normalize(p.categoria)).includes(q)).map(p => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{editId===p.id ? (<input value={editNombre} onChange={e=>setEditNombre(e.target.value)} />) : p.nombre}</td>
                  <td>{editId===p.id ? (<input value={editCategoria} onChange={e=>setEditCategoria(e.target.value)} />) : (p.categoria||'')}</td>
                  <td>{editId===p.id ? (<input type="number" value={editPrecio} onChange={e=>setEditPrecio(e.target.value)} />) : `$${String(p.precio||0)}`}</td>
                  <td>{editId===p.id ? (<input type="number" value={editStock} onChange={e=>setEditStock(e.target.value)} />) : p.stock}</td>
                  <td>
                    {editId===p.id ? (
                      <>
                        <button className="btn" onClick={guardarEdit}><i className="fa-solid fa-check"/>Guardar</button>
                        <button className="btn secondary" onClick={cancelEdit}><i className="fa-solid fa-xmark"/>Cancelar</button>
                      </>
                    ) : (
                      <>
                        <button className="btn" onClick={()=>startEdit(p)}><i className="fa-solid fa-pen"/>Editar</button>
                        <button className="btn danger" onClick={()=>eliminar(p.id)}><i className="fa-solid fa-trash"/>Eliminar</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function InventarioView() {
  const bodegas = useFetch((signal) => api("/bodegas", { signal }), []);
  const [bodegaId, setBodegaId] = React.useState("");
  const { data, reload } = useFetch((signal) => bodegaId ? api(`/inventario/bodega/${bodegaId}`, { signal }) : api("/inventario", { signal }), [bodegaId]);
  const { query } = SearchContext.use();
  const q = normalize(query);
  return (
    <div>
      <Header title="Inventario" right={
        <>
          <select value={bodegaId} onChange={e=>setBodegaId(e.target.value)}>
            <option value="">Todas las bodegas</option>
            {(bodegas.data||[]).map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
          </select>
          <button className="btn secondary" onClick={reload}><i className="fa-solid fa-rotate"/>Refrescar</button>
        </>
      } />
      <div className="panel">
        <div className="panel-header"><strong>Listado de inventario</strong></div>
        <div className="panel-body">
          <table>
            <thead><tr><th>Bodega</th><th>Producto</th><th>Stock</th><th>Mínimo</th></tr></thead>
            <tbody>
              {(data||[]).filter(i => { const pn = normalize(((i&&i.producto&&i.producto.nombre) ? i.producto.nombre : (i&&i.producto) || "")); const bn = normalize(((i&&i.bodega&&i.bodega.nombre) ? i.bodega.nombre : (i&&i.bodega) || "")); return (pn+" "+bn).includes(q); }).map(i => (
                <tr key={i.id}><td>{(i.bodega && i.bodega.nombre) ? i.bodega.nombre : i.bodega}</td><td>{(i.producto && i.producto.nombre) ? i.producto.nombre : i.producto}</td><td>{i.stock}</td><td>{i.stockMinimo}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ReportesView() {
  const [threshold, setThreshold] = React.useState("");
  const resumen = useFetch(() => threshold ? api(`/reportes/resumen?threshold=${threshold}`) : api("/reportes/resumen"), [threshold]);
  const { query } = SearchContext.use();
  const q = normalize(query);
  return (
    <div>
      <Header title="Reportes" right={
        <>
          <input type="number" placeholder="Umbral (threshold)" value={threshold} onChange={e=>setThreshold(e.target.value)} />
          <button className="btn secondary" onClick={resumen.reload}><i className="fa-solid fa-rotate"/>Aplicar</button>
        </>
      } />
      <div className="grid-2">
        <div className="panel">
          <div className="panel-header"><strong>Stock bajo (threshold { (resumen.data && resumen.data.threshold != null ? resumen.data.threshold : '—') })</strong></div>
          <div className="panel-body">
            <table>
              <thead><tr><th>Producto</th><th>Categoría</th><th>Precio</th><th>Stock</th></tr></thead>
              <tbody>
                {((resumen.data && resumen.data.stockBajo) ? resumen.data.stockBajo : []).filter(p => (normalize(p.nombre)+" "+normalize(p.categoria)).includes(q)).map(p => (
                  <tr key={p.id}><td>{p.nombre}</td><td>{p.categoria||'—'}</td><td>${String(p.precio||0)}</td><td>{p.stock}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="panel">
          <div className="panel-header"><strong>Resumen por categoría</strong></div>
          <div className="panel-body">
            <table>
              <thead><tr><th>Categoría</th><th>Stock total</th><th>Valor total</th></tr></thead>
              <tbody>
                {((resumen.data && resumen.data.resumenPorCategoria) ? resumen.data.resumenPorCategoria : []).filter(c => normalize(c.categoria).includes(q)).map((c,i) => (
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
  const movimientos = useFetch(() => api("/movimientos"), []);
  const bodegas = useFetch(() => api("/bodegas"), []);
  const productos = useFetch(() => api("/productos"), []);
  const [tipo, setTipo] = React.useState("ENTRADA");
  const [usuarioId, setUsuarioId] = React.useState(1); // usando usuario inicial de data.sql
  const [bodegaOrigenId, setBodegaOrigenId] = React.useState("");
  const [bodegaDestinoId, setBodegaDestinoId] = React.useState("");
  const [detalles, setDetalles] = React.useState([]);
  const [observaciones, setObservaciones] = React.useState("");

  const addDetalle = () => setDetalles(detalles.concat([{ productoId: (productos.data && productos.data[0]) ? productos.data[0].id : 1, cantidad: 1 }]));
  const updateDetalle = (idx, patch) => setDetalles(detalles.map(function(d,i){ return i===idx ? Object.assign({}, d, patch) : d; }));
  const removeDetalle = (idx) => setDetalles(detalles.filter((_,i)=> i!==idx));

  const crear = async () => {
    const body = { tipo, usuarioId, detalles, observaciones };
    if (tipo === 'SALIDA') body.bodegaOrigenId = Number(bodegaOrigenId);
    if (tipo === 'ENTRADA') body.bodegaDestinoId = Number(bodegaDestinoId);
    if (tipo === 'TRANSFERENCIA') { body.bodegaOrigenId = Number(bodegaOrigenId); body.bodegaDestinoId = Number(bodegaDestinoId); }
    await api("/movimientos", { method: "POST", body: JSON.stringify(body) });
    setDetalles([]); setObservaciones(""); movimientos.reload();
  };

  return (
    <div>
      <Header title="Movimientos" right={<button className="btn" onClick={movimientos.reload}><i className="fa-solid fa-rotate"/>Refrescar</button>} />
      <div className="panel">
        <div className="panel-header"><strong>Registrar movimiento</strong></div>
        <div className="panel-body">
          <div className="form">
            <div className="field"><label>Tipo</label>
              <select value={tipo} onChange={e=>setTipo(e.target.value)}>
                <option>ENTRADA</option><option>SALIDA</option><option>TRANSFERENCIA</option>
              </select>
            </div>
            {(tipo==='SALIDA' || tipo==='TRANSFERENCIA') && (
              <div className="field"><label>Bodega origen</label>
                <select value={bodegaOrigenId} onChange={e=>setBodegaOrigenId(e.target.value)}>
                  <option value="">Seleccione…</option>
                  {(bodegas.data||[]).map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                </select>
              </div>
            )}
            {(tipo==='ENTRADA' || tipo==='TRANSFERENCIA') && (
              <div className="field"><label>Bodega destino</label>
                <select value={bodegaDestinoId} onChange={e=>setBodegaDestinoId(e.target.value)}>
                  <option value="">Seleccione…</option>
                  {(bodegas.data||[]).map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                </select>
              </div>
            )}
            <div className="field" style={{gridColumn:'1/-1'}}>
              <label>Observaciones</label>
              <textarea value={observaciones} onChange={e=>setObservaciones(e.target.value)} />
            </div>
            <div className="actions">
              <button className="btn secondary" onClick={addDetalle}><i className="fa-solid fa-plus"/> Añadir producto</button>
              <button className="btn" onClick={crear}><i className="fa-solid fa-check"/> Registrar</button>
            </div>
          </div>
          {detalles.length>0 && (
            <div className="panel mt-8">
              <div className="panel-header"><strong>Detalles</strong></div>
              <div className="panel-body">
                {(detalles).map((d,idx)=> (
                  <div key={idx} className="form" style={{gridTemplateColumns:'2fr 1fr auto'}}>
                    <div className="field"><label>Producto</label>
                      <select value={d.productoId} onChange={e=>updateDetalle(idx,{productoId:Number(e.target.value)})}>
                        {(productos.data||[]).map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                      </select>
                    </div>
                    <div className="field"><label>Cantidad</label>
                      <input type="number" value={d.cantidad} onChange={e=>updateDetalle(idx,{cantidad:Number(e.target.value)})} />
                    </div>
                    <div className="actions"><button className="btn danger" onClick={()=>removeDetalle(idx)}><i className="fa-solid fa-xmark"/>Quitar</button></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="panel mt-16">
        <div className="panel-header"><strong>Listado de movimientos</strong></div>
        <div className="panel-body">
          <MovimientosTable movimientos={movimientos.data||[]} />
        </div>
      </div>
    </div>
  );
}

function AuditoriaView() {
  const { data, reload } = useFetch(() => api("/auditoria/ultimas"), []);
  const { query } = SearchContext.use();
  const q = normalize(query);
  return (
    <div>
      <Header title="Auditoría" right={<button className="btn" onClick={reload}><i className="fa-solid fa-rotate"/>Refrescar</button>} />
      <div className="panel">
        <div className="panel-header"><strong>Últimas operaciones</strong></div>
        <div className="panel-body">
          <table>
            <thead><tr><th>Fecha</th><th>Entidad</th><th>Operación</th><th>Usuario</th></tr></thead>
            <tbody>
              {(data||[]).filter(a => (normalize(a.entidad)+" "+normalize(a.operacion)+" "+normalize(a.usuario && a.usuario.nombreCompleto ? a.usuario.nombreCompleto : '')).includes(q)).map(a => (
                <tr key={a.id}><td>{new Date(a.fecha).toLocaleString()}</td><td>{a.entidad}</td><td>{a.operacion}</td><td>{(a.usuario && a.usuario.nombreCompleto) ? a.usuario.nombreCompleto : '—'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [route, setRoute] = React.useState("dashboard");
  const [query, setQuery] = React.useState("");
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
          {route === 'reportes' && <ReportesView />}
          {route === 'auditoria' && <AuditoriaView />}
        </main>
      </div>
    </SearchContext.Context.Provider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
// Señal para diagnóstico de carga en index.html
window.__APP_BOOTED__ = true;