import { useState, useEffect } from 'react'
import api from '../../lib/api'

interface PropiedadMetrica {
  id: string
  titulo: string
  tipo: string
  ubicacion?: string
  imagenes: string[]
  visitas: number
  destacada: boolean
}

type Orden = 'mas-vistas' | 'menos-vistas'

export default function MetricasAdmin() {
  const [propiedades, setPropiedades] = useState<PropiedadMetrica[]>([])
  const [loading, setLoading] = useState(true)
  const [orden, setOrden] = useState<Orden>('mas-vistas')
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    api.get('/admin/metricas')
      .then((r) => setPropiedades(r.data))
      .catch(() => setPropiedades([]))
      .finally(() => setLoading(false))
  }, [])

  const filtradas = propiedades
    .filter((p) => {
      const q = busqueda.toLowerCase()
      return p.titulo.toLowerCase().includes(q) || (p.ubicacion || '').toLowerCase().includes(q)
    })
    .sort((a, b) => orden === 'mas-vistas' ? b.visitas - a.visitas : a.visitas - b.visitas)

  const totalVisitas = propiedades.reduce((sum, p) => sum + p.visitas, 0)
  const maxVisitas = Math.max(...propiedades.map((p) => p.visitas), 1)

  if (loading) return <div className="loading">Cargando métricas…</div>

  return (
    <div className="page-container">
      <div style={{ marginBottom: 24 }}>
        <h1 className="page-title" style={{ marginBottom: 2 }}>Métricas de propiedades</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {totalVisitas.toLocaleString()} visitas totales en {propiedades.length} propiedades
        </p>
      </div>

      {/* Filtros */}
      <div className="admin-filters-bar">
        <div className="admin-search-wrap">
          <svg className="admin-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            className="admin-search-input"
            type="text"
            placeholder="Buscar propiedad…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          {busqueda && (
            <button className="admin-search-clear" onClick={() => setBusqueda('')}>✕</button>
          )}
        </div>
        <div className="admin-filter-tabs">
          <button
            className={`admin-filter-tab${orden === 'mas-vistas' ? ' active' : ''}`}
            onClick={() => setOrden('mas-vistas')}
          >
            ↓ Más vistas
          </button>
          <button
            className={`admin-filter-tab${orden === 'menos-vistas' ? ' active' : ''}`}
            onClick={() => setOrden('menos-vistas')}
          >
            ↑ Menos vistas
          </button>
        </div>
      </div>

      {filtradas.length === 0 ? (
        <p className="empty">No se encontraron propiedades.</p>
      ) : (
        <div className="metricas-list">
          {filtradas.map((p, idx) => (
            <div key={p.id} className="metrica-row">
              {/* Ranking number */}
              <div className={`metrica-rank${idx < 3 && orden === 'mas-vistas' ? ' metrica-rank--top' : ''}`}>
                {idx + 1}
              </div>

              {/* Thumbnail */}
              <div className="metrica-thumb">
                {p.imagenes?.[0] ? (
                  <img src={p.imagenes[0]} alt={p.titulo} />
                ) : (
                  <div className="metrica-thumb-placeholder">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.35"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="metrica-info">
                <p className="metrica-titulo">{p.titulo}</p>
                {p.ubicacion && (
                  <p className="metrica-ubicacion">{p.ubicacion}</p>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <span className="badge" style={{ fontSize: '0.7rem' }}>{p.tipo}</span>
                  {p.destacada && (
                    <span style={{ fontSize: '0.7rem', color: '#f5c518', fontWeight: 600 }}>★ Destacada</span>
                  )}
                </div>
              </div>

              {/* Barra + visitas */}
              <div className="metrica-bar-wrap">
                <div className="metrica-bar">
                  <div
                    className="metrica-bar-fill"
                    style={{ width: `${Math.max((p.visitas / maxVisitas) * 100, 3)}%` }}
                  />
                </div>
                <span className="metrica-visitas">
                  {p.visitas.toLocaleString()} {p.visitas === 1 ? 'visita' : 'visitas'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
