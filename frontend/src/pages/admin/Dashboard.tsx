import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'

interface Resumen {
  propiedadesActivas: number
  totalUsuarios: number
  consultasPendientes: number
  totalVisitas: number
}

const NAV_ITEMS = [
  {
    to: '/admin/propiedades',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    label: 'Propiedades',
    desc: 'Crear, editar, destacar y eliminar propiedades',
    accent: '#5B7FA3',
  },
  {
    to: '/admin/usuarios',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    label: 'Usuarios',
    desc: 'Ver y gestionar usuarios registrados',
    accent: '#7BA39E',
  },
  {
    to: '/admin/metricas',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
    label: 'Métricas',
    desc: 'Propiedades más y menos vistas',
    accent: '#A38B5B',
  },
  {
    to: '/admin/consultas',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    label: 'Consultas',
    desc: 'Gestionar mensajes y consultas de usuarios',
    accent: '#8B7BA3',
  },
]

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
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Panel de Administración</h1>
          <p className="dash-subtitle">Resumen general del sistema</p>
        </div>
      </div>

      {/* ── Métricas rápidas ── */}
      {loading ? (
        <div className="loading">Cargando resumen…</div>
      ) : resumen ? (
        <div className="dash-stats-grid">
          <div className="dash-stat-card">
            <div className="dash-stat-icon" style={{ background: 'rgba(91,127,163,0.12)', color: '#5B7FA3' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
            </div>
            <div>
              <p className="dash-stat-num">{resumen.propiedadesActivas}</p>
              <p className="dash-stat-lbl">Propiedades activas</p>
            </div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-icon" style={{ background: 'rgba(123,163,158,0.12)', color: '#7BA39E' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            </div>
            <div>
              <p className="dash-stat-num">{resumen.totalUsuarios}</p>
              <p className="dash-stat-lbl">Usuarios registrados</p>
            </div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-icon" style={{ background: 'rgba(163,139,91,0.12)', color: '#A38B5B' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <div>
              <p className="dash-stat-num">{resumen.consultasPendientes}</p>
              <p className="dash-stat-lbl">Consultas pendientes</p>
            </div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-icon" style={{ background: 'rgba(139,123,163,0.12)', color: '#8B7BA3' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </div>
            <div>
              <p className="dash-stat-num">{resumen.totalVisitas.toLocaleString()}</p>
              <p className="dash-stat-lbl">Total visitas</p>
            </div>
          </div>
        </div>
      ) : (
        <p className="error-msg">No se pudo cargar el resumen.</p>
      )}

      {/* ── Navegación principal ── */}
      <div className="dash-nav-grid">
        {NAV_ITEMS.map((item) => (
          <Link key={item.to} to={item.to} className="dash-nav-card">
            <div className="dash-nav-icon" style={{ background: `${item.accent}18`, color: item.accent }}>
              {item.icon}
            </div>
            <div className="dash-nav-content">
              <p className="dash-nav-label">{item.label}</p>
              <p className="dash-nav-desc">{item.desc}</p>
            </div>
            <svg className="dash-nav-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </Link>
        ))}
      </div>
    </div>
  )
}
