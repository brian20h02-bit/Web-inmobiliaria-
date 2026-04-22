import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../context/AuthContext'
import { useChat } from '../context/ChatContext'
import { usePropiedadModal } from '../context/PropiedadModalContext'
import api from '../lib/api'

interface PropiedadDetalle {
  id: string
  titulo: string
  descripcionPublica: string
  tipo: string
  precio?: number | string
  expensas?: number | string | null
  ubicacion?: string
  metrosCuadrados?: number | null
  ambientes?: number | null
  banos?: number | null
  contacto?: string
  imagenes: string[]
}

function formatPrecio(precio: number | string | undefined): string {
  if (!precio) return ''
  const num = typeof precio === 'string' ? parseFloat(precio) : precio
  if (isNaN(num)) return ''
  return 'US$ ' + num.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function formatExpensas(expensas: number | string | null | undefined): string {
  if (expensas == null) return ''
  const num = typeof expensas === 'string' ? parseFloat(expensas) : expensas
  if (isNaN(num) || num === 0) return ''
  return '$ ' + num.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' ARS'
}

export default function PropiedadModal() {
  const { selectedId: propiedadId, closeModal } = usePropiedadModal()

  // ── ALL hooks must be called unconditionally (Rules of Hooks) ──
  const [prop, setProp] = useState<PropiedadDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [imgIdx, setImgIdx] = useState(0)
  const [consultaEnviada, setConsultaEnviada] = useState(false)
  const [closing, setClosing] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const { consultarPropiedad, isLoading: chatLoading } = useChat()

  // Animated close helper
  const animatedClose = useCallback(() => {
    setClosing(true)
    setTimeout(closeModal, 280)
  }, [closeModal])

  // Fetch property detail — only when modal is open
  useEffect(() => {
    if (!propiedadId) return
    setLoading(true)
    setImgIdx(0)
    setConsultaEnviada(false)
    setClosing(false)
    api.get(`/propiedades/${propiedadId}`)
      .then((r) => setProp(r.data))
      .catch(() => setProp(null))
      .finally(() => setLoading(false))
    api.post(`/propiedades/${propiedadId}/visita`).catch(() => null)
  }, [propiedadId])

  // Lock body scroll — tied to propiedadId so cleanup always fires on close
  useEffect(() => {
    if (!propiedadId) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = original }
  }, [propiedadId])

  // ESC to close
  useEffect(() => {
    if (!propiedadId) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') animatedClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [propiedadId, animatedClose])

  // Focus trap
  useEffect(() => {
    if (!propiedadId || loading) return
    const el = modalRef.current
    if (!el) return
    const focusable = el.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    if (focusable.length) focusable[0].focus()
  }, [propiedadId, loading])

  // Preload adjacent images
  useEffect(() => {
    if (!prop || prop.imagenes.length <= 1) return
    const next = (imgIdx + 1) % prop.imagenes.length
    const prev = (imgIdx - 1 + prop.imagenes.length) % prop.imagenes.length
    ;[next, prev].forEach((i) => {
      const img = new Image()
      img.src = prop.imagenes[i]
    })
  }, [imgIdx, prop])

  const handleBackdrop = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) animatedClose()
  }, [animatedClose])

  const prevImg = useCallback(() => {
    if (!prop) return
    setImgIdx((i) => (i - 1 + prop.imagenes.length) % prop.imagenes.length)
  }, [prop])

  const nextImg = useCallback(() => {
    if (!prop) return
    setImgIdx((i) => (i + 1) % prop.imagenes.length)
  }, [prop])

  // Keyboard arrow navigation for images
  useEffect(() => {
    if (!propiedadId) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') prevImg()
      if (e.key === 'ArrowRight') nextImg()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [propiedadId, prevImg, nextImg])

  async function handleConsultar() {
    if (!prop) return
    setConsultaEnviada(true)
    const tipoLabel = prop.tipo === 'VENTA' ? 'venta' : prop.tipo === 'ALQUILER' ? 'alquiler' : prop.tipo?.toLowerCase() || ''
    const mensaje = `Hola, estoy interesado/a en la propiedad '${prop.titulo}'${prop.ubicacion ? ` en ${prop.ubicacion}` : ''}${precioStr ? ` por ${precioStr}` : ''} (${tipoLabel}). ¿Podrían brindarme más información?`
    await consultarPropiedad(prop.id, prop.titulo, mensaje)
  }

  // ── Early return AFTER all hooks — this is the correct pattern ──
  if (!propiedadId) return null

  const badgeClass = prop?.tipo === 'VENTA' ? 'badge-venta' : prop?.tipo === 'ALQUILER' ? 'badge-alquiler' : 'badge-otro'
  const badgeLabel = prop?.tipo === 'VENTA' ? 'Venta' : prop?.tipo === 'ALQUILER' ? 'Alquiler' : prop?.tipo
  const precioStr = formatPrecio(prop?.precio)
  const expensasStr = prop?.tipo === 'ALQUILER' ? formatExpensas(prop?.expensas) : ''
  const hasMultiple = prop && prop.imagenes && prop.imagenes.length > 1
  const ambientesLabel = prop?.ambientes === 0 ? 'Monoambiente' : prop?.ambientes ? `${prop.ambientes} amb.` : null
  const banosLabel = prop?.banos != null ? `${prop.banos} ${prop.banos === 1 ? 'baño' : 'baños'}` : null
  const m2Label = prop?.metrosCuadrados ? `${prop.metrosCuadrados} m²` : null

  return createPortal(
    <div
      className={`pm-overlay${closing ? ' pm-closing' : ''}`}
      onClick={handleBackdrop}
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pm-title"
    >
      <div className="pm-modal" ref={modalRef}>
        {/* Close button */}
        <button className="pm-close" onClick={animatedClose} aria-label="Cerrar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {loading ? (
          <div className="pm-loading">
            <div className="pm-spinner" />
            <p>Cargando propiedad…</p>
          </div>
        ) : !prop ? (
          <div className="pm-error">
            <p>No se pudo cargar la propiedad.</p>
            <button className="pm-btn pm-btn-primary" onClick={animatedClose}>Cerrar</button>
          </div>
        ) : (
          <div className="pm-content">
            {/* ── Gallery ── */}
            <div className="pm-gallery">
              <div className="pm-gallery-main">
                {prop.imagenes?.[imgIdx] ? (
                  <img src={prop.imagenes[imgIdx]} alt={prop.titulo} className="pm-gallery-img" key={imgIdx} />
                ) : (
                  <div className="pm-gallery-placeholder">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.25">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                  </div>
                )}

                {/* Image counter */}
                {prop.imagenes.length > 0 && (
                  <span className="pm-img-counter">{imgIdx + 1} / {prop.imagenes.length}</span>
                )}

                {/* Arrows */}
                {hasMultiple && (
                  <>
                    <button className="pm-gallery-arrow pm-gallery-arrow-l" onClick={prevImg} aria-label="Imagen anterior">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                    </button>
                    <button className="pm-gallery-arrow pm-gallery-arrow-r" onClick={nextImg} aria-label="Imagen siguiente">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {prop.imagenes.length > 1 && (
                <div className="pm-thumbs">
                  {prop.imagenes.map((img, i) => (
                    <button
                      key={i}
                      className={`pm-thumb${i === imgIdx ? ' active' : ''}`}
                      onClick={() => setImgIdx(i)}
                      aria-label={`Imagen ${i + 1}`}
                    >
                      <img src={img} alt="" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Details ── */}
            <div className="pm-details">
              <div className="pm-details-header">
                <span className={`pm-badge ${badgeClass}`}>{badgeLabel}</span>
                <h2 id="pm-title" className="pm-title">{prop.titulo}</h2>
              </div>

              {/* Price */}
              <div className="pm-price-block">
                <span className="pm-price">{precioStr || 'Consultar'}</span>
                {prop.tipo === 'ALQUILER' && <span className="pm-price-period">/mes</span>}
              </div>
              {expensasStr && <p className="pm-expensas">Expensas: {expensasStr}</p>}

              {/* Features */}
              <div className="pm-features">
                {prop.ubicacion && (
                  <div className="pm-feat-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <span>{prop.ubicacion}</span>
                  </div>
                )}
                {m2Label && (
                  <div className="pm-feat-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
                    <span>{m2Label}</span>
                  </div>
                )}
                {ambientesLabel && (
                  <div className="pm-feat-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                    <span>{ambientesLabel}</span>
                  </div>
                )}
                {banosLabel && (
                  <div className="pm-feat-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12h16M4 12v4a4 4 0 004 4h8a4 4 0 004-4v-4M6 12V5a2 2 0 012-2h1"/></svg>
                    <span>{banosLabel}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {prop.descripcionPublica && (
                <div className="pm-desc-wrap">
                  <h4 className="pm-desc-title">Descripción</h4>
                  <p className="pm-desc">{prop.descripcionPublica}</p>
                </div>
              )}

              {/* Actions */}
              <div className="pm-actions">
                {user && user.rol === 'USUARIO' && (
                  <button
                    className="pm-btn pm-btn-primary"
                    onClick={handleConsultar}
                    disabled={consultaEnviada || chatLoading}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    {consultaEnviada ? '✓ Mensaje enviado' : chatLoading ? 'Enviando…' : 'Contactar'}
                  </button>
                )}
                <a
                  href={`/propiedades/${prop.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pm-btn pm-btn-outline"
                >
                  Ver más detalle
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
