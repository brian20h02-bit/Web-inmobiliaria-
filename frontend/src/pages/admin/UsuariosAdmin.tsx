import { useState, useEffect } from 'react'
import api from '../../lib/api'

interface Usuario {
  id: string
  nombre: string
  email: string
  rol: string
  fechaRegistro: string
  activo: boolean
}

export default function UsuariosAdmin() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroRol, setFiltroRol] = useState<'TODOS' | 'USUARIO' | 'ADMINISTRADOR'>('TODOS')

  useEffect(() => {
    api.get('/admin/usuarios')
      .then((r) => setUsuarios(r.data))
      .catch(() => setUsuarios([]))
      .finally(() => setLoading(false))
  }, [])

  const filtrados = usuarios.filter((u) => {
    const q = busqueda.toLowerCase()
    const matchSearch = u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    const matchRol = filtroRol === 'TODOS' || u.rol === filtroRol
    return matchSearch && matchRol
  })

  if (loading) return <div className="loading">Cargando usuarios…</div>

  return (
    <div className="page-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 2 }}>Usuarios registrados</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{filtrados.length} usuario{filtrados.length !== 1 ? 's' : ''} encontrado{filtrados.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Buscador + filtros */}
      <div className="admin-filters-bar">
        <div className="admin-search-wrap">
          <svg className="admin-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            className="admin-search-input"
            type="text"
            placeholder="Buscar por nombre o email…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          {busqueda && (
            <button className="admin-search-clear" onClick={() => setBusqueda('')} aria-label="Limpiar">✕</button>
          )}
        </div>
        <div className="admin-filter-tabs">
          {(['TODOS', 'USUARIO', 'ADMINISTRADOR'] as const).map((r) => (
            <button
              key={r}
              className={`admin-filter-tab${filtroRol === r ? ' active' : ''}`}
              onClick={() => setFiltroRol(r)}
            >
              {r === 'TODOS' ? 'Todos' : r === 'USUARIO' ? 'Usuarios' : 'Admins'}
            </button>
          ))}
        </div>
      </div>

      {filtrados.length === 0 ? (
        <p className="empty">No se encontraron usuarios.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Registro</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((u) => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="user-avatar-mini">{u.nombre.charAt(0).toUpperCase()}</div>
                    {u.nombre}
                  </div>
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{u.email}</td>
                <td><span className={`badge ${u.rol === 'ADMINISTRADOR' ? 'badge-admin' : ''}`}>{u.rol}</span></td>
                <td style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>{new Date(u.fechaRegistro).toLocaleDateString('es-AR')}</td>
                <td>
                  <span className={`estado-badge ${u.activo ? 'estado-respondida' : 'estado-cerrada'}`}>
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
