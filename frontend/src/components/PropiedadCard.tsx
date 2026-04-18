import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'

interface PropiedadCardProps {
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
  imagenes: string[]
  onPreview?: (id: string) => void
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

export default function PropiedadCard({ id, titulo, descripcionPublica, tipo, precio, expensas, ubicacion, metrosCuadrados, ambientes, banos, imagenes, onPreview }: PropiedadCardProps) {
  const [fav, setFav] = useState(false)
  const [imgIdx, setImgIdx] = useState(0)
  const badgeClass = tipo === 'VENTA' ? 'badge-venta' : tipo === 'ALQUILER' ? 'badge-alquiler' : 'badge-otro'
  const precioStr = formatPrecio(precio)
  const expensasStr = tipo === 'ALQUILER' ? formatExpensas(expensas) : ''
  const hasMultiple = imagenes && imagenes.length > 1

  const prevImg = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    setImgIdx(i => (i - 1 + imagenes.length) % imagenes.length)
  }, [imagenes.length])

  const nextImg = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    setImgIdx(i => (i + 1) % imagenes.length)
  }, [imagenes.length])

  function toggleFav(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    setFav(prev => !prev)
  }

  const ambientesLabel = ambientes === 0 ? 'Monoambiente' : ambientes ? `${ambientes} amb.` : null
  const banosLabel = banos != null ? `${banos} ${banos === 1 ? 'baño' : 'baños'}` : null
  const m2Label = metrosCuadrados ? `${metrosCuadrados} m²` : null

  const Wrapper = onPreview ? 'div' : Link
  const wrapperProps = onPreview
    ? { className: 'prop-card', onClick: () => onPreview(id), role: 'button' as const, tabIndex: 0, style: { cursor: 'pointer' } }
    : { to: `/propiedades/${id}`, className: 'prop-card' }

  return (
    <Wrapper {...(wrapperProps as any)}>
      {/* ── Image section ── */}
      <div className="prop-card-image-wrap">
        {imagenes?.[imgIdx] ? (
          <img src={imagenes[imgIdx]} alt={titulo} className="prop-card-img" loading="lazy" />
        ) : (
          <div className="prop-card-img-placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.3"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </div>
        )}

        {/* Carousel arrows */}
        {hasMultiple && (
          <>
            <button className="prop-card-arrow prop-card-arrow-l" onClick={prevImg} aria-label="Anterior">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button className="prop-card-arrow prop-card-arrow-r" onClick={nextImg} aria-label="Siguiente">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            <div className="prop-card-dots">
              {imagenes.map((_, i) => (
                <span key={i} className={`prop-card-dot${i === imgIdx ? ' active' : ''}`} />
              ))}
            </div>
          </>
        )}

        {/* Badge */}
        <span className={`prop-card-badge ${badgeClass}`}>
          {tipo === 'VENTA' ? 'Venta' : tipo === 'ALQUILER' ? 'Alquiler' : tipo}
        </span>

        {/* Fav */}
        <button className={`prop-card-fav${fav ? ' active' : ''}`} onClick={toggleFav} aria-label={fav ? 'Quitar de favoritos' : 'Agregar a favoritos'}>
          <svg viewBox="0 0 24 24" fill={fav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>

      {/* ── Body section ── */}
      <div className="prop-card-body">
        {/* Price */}
        <div className="prop-card-price-block">
          <span className="prop-card-price">{precioStr || 'Consultar'}</span>
          {tipo === 'ALQUILER' && <span className="prop-card-price-period">/mes</span>}
        </div>
        {expensasStr && <p className="prop-card-expensas">Expensas: {expensasStr}</p>}

        {/* Location */}
        {ubicacion && (
          <p className="prop-card-location">
            <svg className="prop-card-loc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {ubicacion}
          </p>
        )}

        {/* Features row */}
        {(m2Label || ambientesLabel || banosLabel) && (
          <div className="prop-card-features">
            {m2Label && <span className="prop-card-feat"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="12" y1="3" x2="12" y2="21"/></svg>{m2Label}</span>}
            {ambientesLabel && <span className="prop-card-feat"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>{ambientesLabel}</span>}
            {banosLabel && <span className="prop-card-feat"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12h16M4 12v4a4 4 0 004 4h8a4 4 0 004-4v-4M6 12V5a2 2 0 012-2h1"/></svg>{banosLabel}</span>}
          </div>
        )}

        {/* Title */}
        <h3 className="prop-card-title">{titulo}</h3>

        {/* Description */}
        {descripcionPublica && (
          <p className="prop-card-desc">{descripcionPublica}</p>
        )}
      </div>
    </Wrapper>
  )
}
