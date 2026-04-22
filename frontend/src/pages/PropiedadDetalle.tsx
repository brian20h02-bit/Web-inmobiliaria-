import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useChat } from '../context/ChatContext'
import { useFavoritos } from '../context/FavoritosContext'
import { useGuardados } from '../context/GuardadosContext'

import api from '../lib/api'

interface Propiedad {
  id: string
  titulo: string
  descripcionPublica: string
  descripcionPrivada?: string
  tipo: string
  precio?: number
  expensas?: number | null
  ubicacion?: string
  metrosCuadrados?: number | null
  ambientes?: number | null
  banos?: number | null
  contacto?: string
  imagenes: string[]
  houseTourUrl?: string | null
  lat?: number | null
  lng?: number | null
  fechaPublicacion?: string
}

function formatPrecio(precio?: number): string {
  if (!precio) return 'Consultar precio'
  return 'US$ ' + precio.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function formatExpensas(expensas?: number | null): string {
  if (!expensas || expensas === 0) return ''
  return '$ ' + expensas.toLocaleString('es-AR', { minimumFractionDigits: 0 }) + ' ARS'
}

export default function PropiedadDetalle() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { consultarPropiedad, isLoading: chatLoading } = useChat()
  const { isFavorito, toggleFavorito } = useFavoritos()
  const { isGuardado, toggleGuardado } = useGuardados()

  const [propiedad, setPropiedad] = useState<Propiedad | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [imgIdx, setImgIdx] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [houseTourOpen, setHouseTourOpen] = useState(false)

  const [consultaEnviada, setConsultaEnviada] = useState(false)

  useEffect(() => {
    setLoading(true)
    setImgIdx(0)
    api.get(`/propiedades/${id}`)
      .then(r => setPropiedad(r.data))
      .catch(e => {
        if (e.response?.status === 404) setError('Propiedad no encontrada.')
        else setError('Error al cargar la propiedad.')
      })
      .finally(() => setLoading(false))
    api.post(`/propiedades/${id}/visita`).catch(() => null)
  }, [id])

  useEffect(() => {
    if (!lightboxOpen || !propiedad?.imagenes?.length) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') setImgIdx(i => (i + 1) % propiedad!.imagenes.length)
      if (e.key === 'ArrowLeft') setImgIdx(i => (i - 1 + propiedad!.imagenes.length) % propiedad!.imagenes.length)
      if (e.key === 'Escape') setLightboxOpen(false)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [lightboxOpen, propiedad])

  useEffect(() => {
    if (!houseTourOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setHouseTourOpen(false)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [houseTourOpen])

  const prevImg = useCallback(() => {
    if (!propiedad?.imagenes?.length) return
    setImgIdx(i => (i - 1 + propiedad.imagenes.length) % propiedad.imagenes.length)
  }, [propiedad])

  const nextImg = useCallback(() => {
    if (!propiedad?.imagenes?.length) return
    setImgIdx(i => (i + 1) % propiedad.imagenes.length)
  }, [propiedad])

  async function handleConsultar() {
    if (!propiedad || !id) return
    setConsultaEnviada(true)
    await consultarPropiedad(id, propiedad.titulo)
  }

  if (loading) return (
    <div className="pd-loading">
      <div className="pd-spinner" />
      <p>Cargando propiedad…</p>
    </div>
  )

  if (error || !propiedad) return (
    <div className="pd-error-page">
      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.3"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      <p className="pd-error-text">{error || 'Propiedad no encontrada.'}</p>
      <Link to="/" className="pd-btn pd-btn-outline">← Volver al inicio</Link>
    </div>
  )

  const fav = isFavorito(propiedad.id)
  const saved = isGuardado(propiedad.id)
  const hasImages = (propiedad.imagenes?.length ?? 0) > 0
  const hasMultiple = (propiedad.imagenes?.length ?? 0) > 1
  const tipoLabel = propiedad.tipo === 'VENTA' ? 'Venta' : propiedad.tipo === 'ALQUILER' ? 'Alquiler' : propiedad.tipo
  const badgeClass = propiedad.tipo === 'VENTA' ? 'pd-badge-venta' : propiedad.tipo === 'ALQUILER' ? 'pd-badge-alquiler' : 'pd-badge-otro'
  const hasMap = !!(propiedad.lat && propiedad.lng)
  const expensasStr = formatExpensas(propiedad.expensas)

  const propResumen = {
    id: propiedad.id,
    titulo: propiedad.titulo,
    tipo: propiedad.tipo,
    ubicacion: propiedad.ubicacion,
    imagenUrl: propiedad.imagenes?.[0],
    precio: propiedad.precio,
  }

  return (
    <div className="pd-root">

      {/* ── GALERÍA HERO ──────────────────────────────────────────────── */}
      <motion.div
        className="pd-gallery"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease: 'easeOut' }}
      >
        <div className="pd-gallery-grid">
          <div
            className="pd-gallery-main"
            onClick={() => hasImages && setLightboxOpen(true)}
            role={hasImages ? 'button' : undefined}
            aria-label={hasImages ? 'Ampliar galería' : undefined}
          >
            {hasImages ? (
              <AnimatePresence mode="wait">
                <motion.img
                  key={imgIdx}
                  src={propiedad.imagenes[imgIdx]}
                  alt={propiedad.titulo}
                  className="pd-gallery-main-img"
                  loading="lazy"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.12}
                  onDragEnd={(_e, { offset }) => {
                    if (offset.x > 80) prevImg()
                    if (offset.x < -80) nextImg()
                  }}
                  onClick={e => e.stopPropagation()}
                  style={{ cursor: hasMultiple ? 'grab' : 'zoom-in' }}
                  whileDrag={{ cursor: 'grabbing' }}
                />
              </AnimatePresence>
            ) : (
              <div className="pd-gallery-placeholder">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.25"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                <span>Sin imágenes</span>
              </div>
            )}

            {hasMultiple && (
              <>
                <motion.button
                  className="pd-arrow pd-arrow-l"
                  onClick={e => { e.stopPropagation(); prevImg() }}
                  aria-label="Anterior"
                  whileHover={{ scale: 1.12 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </motion.button>
                <motion.button
                  className="pd-arrow pd-arrow-r"
                  onClick={e => { e.stopPropagation(); nextImg() }}
                  aria-label="Siguiente"
                  whileHover={{ scale: 1.12 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </motion.button>
              </>
            )}

            <span className="pd-badge">{tipoLabel}</span>

            {hasImages && (
              <span className="pd-expand-hint">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
                Ampliar
              </span>
            )}

            {hasMultiple && (
              <div className="pd-image-counter">{imgIdx + 1} / {propiedad.imagenes.length}</div>
            )}

            {/* ── House Tour overlay button ── */}
            {propiedad.houseTourUrl && (
              <motion.button
                className="pd-house-tour-overlay-btn"
                onClick={e => { e.stopPropagation(); setHouseTourOpen(true) }}
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(0,0,0,0.82)' }}
                whileTap={{ scale: 0.97 }}
                aria-label="Ver House Tour"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                House Tour
              </motion.button>
            )}
          </div>

          {hasMultiple && (
            <div className="pd-thumbs-col">
              {propiedad.imagenes.map((img, i) => (
                <motion.button
                  key={i}
                  className={`pd-thumb${i === imgIdx ? ' active' : ''}`}
                  onClick={() => setImgIdx(i)}
                  aria-label={`Ver imagen ${i + 1}`}
                  whileHover={{ scale: 1.05, opacity: 0.92 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                >
                  <img src={img} alt="" loading="lazy" />
                </motion.button>
              ))}

              {/* Video thumbnail — último en la columna */}
              {propiedad.houseTourUrl && (
                <motion.button
                  className="pd-thumb pd-thumb-video"
                  onClick={() => setHouseTourOpen(true)}
                  aria-label="Ver House Tour"
                  whileHover={{ scale: 1.05, opacity: 0.92 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                >
                  <img src={propiedad.imagenes[0]} alt="House Tour" loading="lazy" />
                  <div className="pd-thumb-video-overlay">
                    <div className="pd-thumb-video-play">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                    <span className="pd-thumb-video-label">Tour</span>
                  </div>
                </motion.button>
              )}
            </div>
          )}
        </div>
      </motion.div>


      {/* ── CONTENIDO + SIDEBAR ───────────────────────────────────────── */}
      <div className="pd-content">

        {/* ── IZQUIERDA: Info principal ── */}
        <main className="pd-main">

          {/* Título */}
          <div className="pd-title-block">
            <span className="pd-badge-sm">{tipoLabel}</span>
            <h1 className="pd-titulo">{propiedad.titulo}</h1>
            {propiedad.ubicacion && (
              <p className="pd-ubicacion-txt">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {propiedad.ubicacion}
              </p>
            )}
          </div>

          {/* Precio (mobile) */}
          {user && (
            <div className="pd-price-mobile">
              <span className="pd-price-num">{formatPrecio(propiedad.precio)}</span>
              {propiedad.tipo === 'ALQUILER' && <span className="pd-price-period">/mes</span>}
              {propiedad.tipo === 'ALQUILER' && expensasStr && (
                <span className="pd-expensas-txt">+ Expensas: {expensasStr}</span>
              )}
            </div>
          )}

          {/* Características */}
          {(propiedad.metrosCuadrados || propiedad.ambientes != null || propiedad.banos != null) && (
            <div className="pd-features-grid">
              {propiedad.metrosCuadrados && (
                <div className="pd-feature-item">
                  <div className="pd-feature-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
                  </div>
                  <span className="pd-feature-val">{propiedad.metrosCuadrados} m²</span>
                  <span className="pd-feature-lbl">Superficie</span>
                </div>
              )}
              {propiedad.ambientes != null && (
                <div className="pd-feature-item">
                  <div className="pd-feature-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  </div>
                  <span className="pd-feature-val">{propiedad.ambientes === 0 ? '1' : propiedad.ambientes}</span>
                  <span className="pd-feature-lbl">{propiedad.ambientes === 0 ? 'Monoambiente' : 'Ambientes'}</span>
                </div>
              )}
              {propiedad.banos != null && (
                <div className="pd-feature-item">
                  <div className="pd-feature-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 12h16M4 12v4a4 4 0 004 4h8a4 4 0 004-4v-4M6 12V5a2 2 0 012-2h1"/></svg>
                  </div>
                  <span className="pd-feature-val">{propiedad.banos}</span>
                  <span className="pd-feature-lbl">{propiedad.banos === 1 ? 'Baño' : 'Baños'}</span>
                </div>
              )}
            </div>
          )}

          {/* Descripción */}
          <section className="pd-section">
            <h2 className="pd-section-title">Descripción</h2>
            <p className="pd-desc-text">{propiedad.descripcionPublica}</p>
            {user && propiedad.descripcionPrivada && propiedad.descripcionPrivada !== propiedad.descripcionPublica && (
              <div className="pd-desc-private">
                <p className="pd-desc-private-label">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  Información adicional (privada)
                </p>
                <p className="pd-desc-text">{propiedad.descripcionPrivada}</p>
              </div>
            )}
          </section>

          {/* Mapa */}
          {hasMap && (
            <section className="pd-section">
              <h2 className="pd-section-title">Ubicación en el mapa</h2>
              <div className="pd-map-wrap">
                <iframe
                  title="Ubicación de la propiedad"
                  src={`https://maps.google.com/maps?q=${propiedad.lat},${propiedad.lng}&z=15&output=embed`}
                  className="pd-map"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            </section>
          )}
        </main>

        {/* ── DERECHA: Sidebar ── */}
        <aside className="pd-sidebar">
          <div className="pd-sidebar-card">
            {!user ? (
              <div className="pd-lock-block">
                <div className="pd-lock-icon">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <p className="pd-lock-title">Información protegida</p>
                <p className="pd-lock-sub">Iniciá sesión para ver precio, ubicación completa y contactar al vendedor</p>
                <Link to="/login" className="pd-btn pd-btn-primary">Iniciar sesión</Link>
                <Link to="/registro" className="pd-btn pd-btn-outline" style={{ marginTop: 8 }}>Registrarse gratis</Link>
              </div>
            ) : (
              <>
                {/* Precio */}
                <div className="pd-sidebar-price-block">
                  <p className="pd-sidebar-label">Precio</p>
                  <div className="pd-sidebar-price-row">
                    <span className="pd-sidebar-precio pd-sidebar-precio--dark">{formatPrecio(propiedad.precio)}</span>
                    {propiedad.tipo === 'ALQUILER' && <span className="pd-sidebar-period">/mes</span>}
                  </div>
                  {propiedad.tipo === 'ALQUILER' && expensasStr && (
                    <p className="pd-sidebar-expensas">+ Expensas: {expensasStr}</p>
                  )}
                </div>

                <div className="pd-sidebar-divider" />

                {/* CTA único */}
                {user.rol === 'USUARIO' && (
                  consultaEnviada ? (
                    <div className="pd-consulta-ok">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      <span>Consulta enviada. Revisá el chat.</span>
                    </div>
                  ) : (
                    <button
                      className="pd-btn pd-btn-primary pd-btn-cta"
                      onClick={handleConsultar}
                      disabled={chatLoading}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      {chatLoading ? 'Enviando…' : 'Contactar propiedad'}
                    </button>
                  )
                )}
                {user.rol === 'ADMINISTRADOR' && (
                  <p className="pd-trust-text">Sesión como administrador</p>
                )}
                <p className="pd-trust-text">Respondemos en menos de 24hs</p>

                <div className="pd-sidebar-divider" />

                {/* Favoritos y Guardados */}
                <div className="pd-sidebar-actions">
                  <button
                    className={`pd-action-btn${fav ? ' active-fav' : ''}`}
                    onClick={() => toggleFavorito(propResumen)}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill={fav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    {fav ? 'En favoritos' : 'Agregar a favoritos'}
                  </button>
                  <button
                    className={`pd-action-btn${saved ? ' active-save' : ''}`}
                    onClick={() => toggleGuardado(propResumen)}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                    {saved ? 'Guardado' : 'Guardar propiedad'}
                  </button>
                </div>
              </>
            )}
          </div>
        </aside>
      </div>

      {/* ── LIGHTBOX ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            className="pd-lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setLightboxOpen(false)}
          >
            <button className="pd-lb-close" aria-label="Cerrar" onClick={() => setLightboxOpen(false)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>

            {hasMultiple && (
              <>
                <button className="pd-lb-arrow pd-lb-arrow-l" onClick={e => { e.stopPropagation(); prevImg() }} aria-label="Anterior">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <button className="pd-lb-arrow pd-lb-arrow-r" onClick={e => { e.stopPropagation(); nextImg() }} aria-label="Siguiente">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </>
            )}

            <motion.img
              key={imgIdx}
              src={propiedad.imagenes[imgIdx]}
              alt={propiedad.titulo}
              className="pd-lb-img"
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.16 }}
            />

            <div className="pd-lb-counter">{imgIdx + 1} / {propiedad.imagenes.length}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HOUSE TOUR MODAL ───────────────────────────────────────────── */}
      <AnimatePresence>
        {houseTourOpen && propiedad.houseTourUrl && (
          <motion.div
            className="pd-house-tour-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={() => setHouseTourOpen(false)}
          >
            <motion.div
              className="pd-house-tour-inner"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ duration: 0.22 }}
              onClick={e => e.stopPropagation()}
            >
              <button
                className="pd-house-tour-close"
                aria-label="Cerrar"
                onClick={() => setHouseTourOpen(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
              <div className="pd-house-tour-video-wrap">
                {(propiedad.houseTourUrl.includes('youtube.com') || propiedad.houseTourUrl.includes('youtu.be')) ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${
                      propiedad.houseTourUrl.includes('youtu.be')
                        ? propiedad.houseTourUrl.split('youtu.be/')[1]?.split('?')[0]
                        : new URLSearchParams(propiedad.houseTourUrl.split('?')[1]).get('v') || ''
                    }?autoplay=1&rel=0`}
                    title="House Tour"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    className="pd-house-tour-iframe"
                  />
                ) : (
                  <video
                    src={propiedad.houseTourUrl}
                    controls
                    autoPlay
                    className="pd-house-tour-video"
                  />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
