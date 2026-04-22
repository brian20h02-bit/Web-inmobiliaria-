import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../lib/api'

interface PropiedadHistorial {
  id: string
  titulo: string
  descripcionPublica: string
  tipo: string
  precio: number
  ubicacion?: string
  imagenes: string[]
  metrosCuadrados?: number | null
  ambientes?: number | null
  banos?: number | null
  visitadoEn?: number | null
}

interface Toast {
  id: number
  msg: string
  type: 'success' | 'info'
}

function timeAgo(ts: number | null | undefined): string {
  if (!ts) return ''
  const diff = Date.now() - ts
  const minutes = Math.floor(diff / 60000)
  if (minutes < 2) return 'Hace un momento'
  if (minutes < 60) return `Hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `Hace ${days} ${days === 1 ? 'día' : 'días'}`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `Hace ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`
  const months = Math.floor(days / 30)
  return `Hace ${months} ${months === 1 ? 'mes' : 'meses'}`
}

function SkeletonCard() {
  return (
    <div className="hist-card hist-card--skeleton">
      <div className="hist-skel-img" />
      <div className="hist-card-body">
        <div className="hist-skel-line" style={{ width: '45%', height: 22, marginBottom: 10 }} />
        <div className="hist-skel-line" style={{ width: '80%', height: 14, marginBottom: 6 }} />
        <div className="hist-skel-line" style={{ width: '55%', height: 12, marginBottom: 16 }} />
        <div className="hist-skel-line" style={{ width: '40%', height: 10 }} />
      </div>
    </div>
  )
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] as any } },
}

export default function Historial() {
  const [propiedades, setPropiedades] = useState<PropiedadHistorial[]>([])
  const [loading, setLoading] = useState(true)
  const [limpiando, setLimpiando] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [toastId, setToastId] = useState(0)
  const navigate = useNavigate()

  function addToast(msg: string, type: Toast['type'] = 'success') {
    const id = toastId + 1
    setToastId(id)
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3400)
  }

  useEffect(() => {
    api.get('/propiedades/historial')
      .then((r) => setPropiedades(r.data))
      .catch(() => setPropiedades([]))
      .finally(() => setLoading(false))
  }, [])

  async function eliminarUno(id: string, titulo: string, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setPropiedades(prev => prev.filter(p => p.id !== id))
    await api.delete(`/propiedades/historial/${id}`).catch(() => null)
    addToast(`Eliminado del historial`)
  }

  async function limpiarHistorial() {
    if (!confirm('¿Limpiar todo el historial de visitas?')) return
    setLimpiando(true)
    await api.delete('/propiedades/historial').catch(() => null)
    setPropiedades([])
    setLimpiando(false)
    addToast('Historial limpiado', 'info')
  }

  return (
    <div className="hist-page">

      {/* ── Header ── */}
      <div className="hist-header">
        <div>
          <h1 className="hist-title">Historial de visitas</h1>
          {!loading && (
            <p className="hist-subtitle">
              {propiedades.length === 0
                ? 'No visitaste ninguna propiedad aún'
                : `${propiedades.length} propiedad${propiedades.length !== 1 ? 'es' : ''} vista${propiedades.length !== 1 ? 's' : ''}`}
            </p>
          )}
        </div>
        {!loading && propiedades.length > 0 && (
          <motion.button
            className="hist-clear-btn"
            onClick={limpiarHistorial}
            disabled={limpiando}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
            {limpiando ? 'Limpiando…' : 'Limpiar todo'}
          </motion.button>
        )}
      </div>

      {/* ── Skeleton ── */}
      {loading && (
        <div className="hist-grid">
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && propiedades.length === 0 && (
        <motion.div
          className="hist-empty"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className="hist-empty-icon">
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
          <p className="hist-empty-title">Sin historial todavía</p>
          <p className="hist-empty-desc">Explorá propiedades y las verás aparecer acá automáticamente</p>
          <button className="hist-explore-btn" onClick={() => navigate('/')}>
            Explorar propiedades
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </motion.div>
      )}

      {/* ── Grid ── */}
      {!loading && propiedades.length > 0 && (
        <motion.div
          className="hist-grid"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence mode="popLayout">
            {propiedades.map((p) => (
              <motion.div
                key={p.id}
                className="hist-card"
                variants={cardVariants}
                layout
                exit={{ opacity: 0, scale: 0.88, transition: { duration: 0.2 } }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                onClick={() => navigate(`/propiedades/${p.id}`)}
                style={{ cursor: 'pointer' }}
              >
                {/* Image */}
                <div className="hist-card-img-wrap">
                  {p.imagenes?.[0] ? (
                    <img className="hist-card-img" src={p.imagenes[0]} alt={p.titulo} loading="lazy" />
                  ) : (
                    <div className="hist-card-img-empty">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" opacity="0.3" strokeLinecap="round">
                        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                      </svg>
                    </div>
                  )}

                  {/* Overlay: tipo badge + time */}
                  <div className="hist-card-overlay">
                    <span className={`hist-tipo-badge ${p.tipo === 'VENTA' ? 'hist-tipo-badge--venta' : 'hist-tipo-badge--alquiler'}`}>
                      {p.tipo === 'VENTA' ? 'Venta' : 'Alquiler'}
                    </span>
                    {p.visitadoEn && (
                      <span className="hist-time-badge">
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                        </svg>
                        {timeAgo(p.visitadoEn)}
                      </span>
                    )}
                  </div>

                  {/* Remove button */}
                  <button
                    className="hist-remove-btn"
                    onClick={(e) => eliminarUno(p.id, p.titulo, e)}
                    title="Quitar del historial"
                    aria-label="Quitar del historial"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>

                {/* Body */}
                <div className="hist-card-body">
                  <p className="hist-card-price">
                    {p.precio ? `US$ ${Number(p.precio).toLocaleString('es-AR')}` : 'Consultar'}
                    {p.tipo === 'ALQUILER' && p.precio ? <span className="hist-card-price-mo">/mes</span> : null}
                  </p>
                  <p className="hist-card-titulo">{p.titulo}</p>
                  {p.ubicacion && (
                    <p className="hist-card-ubicacion">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                      {p.ubicacion}
                    </p>
                  )}

                  {(p.metrosCuadrados || p.ambientes != null || p.banos != null) && (
                    <div className="hist-card-feats">
                      {p.metrosCuadrados && <span className="hist-card-feat">{p.metrosCuadrados} m²</span>}
                      {p.ambientes != null && <span className="hist-card-feat">{p.ambientes === 0 ? 'Mono' : `${p.ambientes} amb.`}</span>}
                      {p.banos != null && <span className="hist-card-feat">{p.banos} {p.banos === 1 ? 'baño' : 'baños'}</span>}
                    </div>
                  )}

                  <button
                    className="hist-card-cta"
                    onClick={(e) => { e.stopPropagation(); navigate(`/propiedades/${p.id}`) }}
                  >
                    Ver propiedad
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Toast notifications ── */}
      <div className="hist-toasts" aria-live="polite">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              className={`hist-toast${t.type === 'info' ? ' hist-toast--info' : ''}`}
              initial={{ opacity: 0, x: 60, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.9 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {t.type === 'success' ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
              )}
              {t.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
