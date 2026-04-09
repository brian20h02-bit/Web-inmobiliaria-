import { useState, useEffect } from 'react'
import api from '../../lib/api'

interface Usuario {
  id: string
  nombre: string
  email: string
  rol: string
  fecha_registro: string
  activo: boolean
}

export default function UsuariosAdmin() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/usuarios')
      .then((r) => setUsuarios(r.data))
      .catch(() => setUsuarios([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading">Cargando usuarios…</div>

  return (
    <div className="page-container">
      <h1 className="page-title">Usuarios registrados</h1>
      {usuarios.length === 0 ? (
        <p className="empty">No hay usuarios registrados.</p>
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
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td>{u.nombre}</td>
                <td>{u.email}</td>
                <td><span className="badge">{u.rol}</span></td>
                <td>{new Date(u.fecha_registro).toLocaleDateString('es-AR')}</td>
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
