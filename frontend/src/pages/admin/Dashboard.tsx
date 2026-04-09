import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'

interface Resumen {
  propiedades_activas: number
  usuarios_registrados: number
  consultas_pendientes: number
}

export default function Dashboard() {
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/resumen')
      .then((r) => setResumen(r.data))
      .catch(() => setResumen(null))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page-container">
      <h1 className="page-title">Panel de Administración</h1>

      {loading ? (
        <div className="loading">Cargando resumen…</div>
      ) : resumen ? (
        <div className="dashboard-cards">
          <div className="dashboard-card">
            <span className="dashboard-num">{resumen.propiedades_activas}</span>
            <span className="dashboard-label">Propiedades activas</span>
          </div>
          <div className="dashboard-card">
            <span className="dashboard-num">{resumen.usuarios_registrados}</span>
            <span className="dashboard-label">Usuarios registrados</span>
          </div>
          <div className="dashboard-card">
            <span className="dashboard-num">{resumen.consultas_pendientes}</span>
            <span className="dashboard-label">Consultas pendientes</span>
          </div>
        </div>
      ) : (
        <p className="error-msg">No se pudo cargar el resumen.</p>
      )}

      <div className="admin-nav">
        <Link to="/admin/propiedades" className="btn btn-primary">Gestionar Propiedades</Link>
        <Link to="/admin/usuarios" className="btn btn-outline">Ver Usuarios</Link>
      </div>
    </div>
  )
}
