import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import PropiedadCard from '../components/PropiedadCard'
import HeroSection from '../components/HeroSection'
import FiltrosFlotantes, { type FiltrosState } from '../components/FiltrosFlotantes'
import SectionTitle from '../components/SectionTitle'
import { useAuth } from '../context/AuthContext'
import { usePropiedadModal } from '../context/PropiedadModalContext'
import api from '../lib/api'

const FILTROS_INIT: FiltrosState = { tipo: 'todo', ciudad: '', tipoPropiedad: '', ambientes: '', banos: '' }

interface Propiedad {
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
  destacada: boolean
}

export default function Home() {
  const [destacadas, setDestacadas] = useState<Propiedad[]>([])
  const [propiedades, setPropiedades] = useState<Propiedad[]>([])
  const [filtros, setFiltros] = useState<FiltrosState>(FILTROS_INIT)
  const [loading, setLoading] = useState(true)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const filtrosSectionRef = useRef<HTMLElement>(null)
  const [isSticky, setIsSticky] = useState(false)

  /* ── Showcase carousel state ── */
  const [slideIdx, setSlideIdx] = useState(0)
  const [isHovering, setIsHovering] = useState(false)
  const [slideDir, setSlideDir] = useState<'next' | 'prev'>('next')
  const { openModal } = usePropiedadModal()
  const SLIDE_SIZE = 3

  const totalSlides = Math.max(1, Math.ceil(destacadas.length / SLIDE_SIZE))

  const goNext = useCallback(() => {
    setSlideDir('next')
    setSlideIdx((i) => (i + 1) % totalSlides)
  }, [totalSlides])

  const goPrev = useCallback(() => {
    setSlideDir('prev')
    setSlideIdx((i) => (i - 1 + totalSlides) % totalSlides)
  }, [totalSlides])

  // Autoplay (5s)
  useEffect(() => {
    if (isHovering || totalSlides <= 1) return
    const timer = setInterval(goNext, 5000)
    return () => clearInterval(timer)
  }, [isHovering, totalSlides, goNext])

  // Suppress site-header on Home (HeroSection handles navigation)
  useEffect(() => {
    document.body.classList.add('home-page-active')
    return () => document.body.classList.remove('home-page-active')
  }, [])

  function handleLogout() {
    logout()
    navigate('/')
  }

  // Sticky detection via IntersectionObserver
  useEffect(() => {
    const el = filtrosSectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setIsSticky(entry.intersectionRatio < 1),
      { threshold: [1], rootMargin: '-1px 0px 0px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  function scrollToProperties() {
    const el = document.getElementById('propiedades')
    if (!el) return
    const offset = 72
    const top = el.getBoundingClientRect().top + window.scrollY - offset
    window.scrollTo({ top, behavior: 'smooth' })
  }

  function scrollToDestacadas() {
    const el = document.getElementById('destacadas')
    if (!el) return
    const offset = 72
    const top = el.getBoundingClientRect().top + window.scrollY - offset
    window.scrollTo({ top, behavior: 'smooth' })
  }

  useEffect(() => {
    api.get('/propiedades/destacadas')
      .then((r) => setDestacadas(r.data))
      .catch(() => setDestacadas([]))
  }, [])

  useEffect(() => {
    setLoading(true)
    const params: Record<string, string> = {}
    if (filtros.tipo !== 'todo') params.tipo = filtros.tipo.toUpperCase()
    api.get('/propiedades', { params })
      .then((r) => {
        const data = r.data
        let list: Propiedad[] = Array.isArray(data) ? data : data.propiedades ?? []

        // Client-side sub-filters
        if (filtros.ciudad) {
          const q = filtros.ciudad.toLowerCase()
          list = list.filter((p) => p.ubicacion?.toLowerCase().includes(q))
        }
        if (filtros.ambientes) {
          const n = parseInt(filtros.ambientes)
          list = list.filter((p) => p.ambientes === n)
        }
        if (filtros.banos) {
          const n = parseInt(filtros.banos)
          list = list.filter((p) => p.banos === n)
        }

        setPropiedades(list)
      })
      .catch(() => setPropiedades([]))
      .finally(() => setLoading(false))
  }, [filtros])

  // Current slide items
  const slideItems = destacadas.slice(slideIdx * SLIDE_SIZE, slideIdx * SLIDE_SIZE + SLIDE_SIZE)

  return (
    <div>
      {/* HERO SECTION */}
      <HeroSection 
        onComprarClick={() => { setFiltros({ ...FILTROS_INIT, tipo: 'venta' }); scrollToProperties() }}
        onAlquilarClick={() => { setFiltros({ ...FILTROS_INIT, tipo: 'alquiler' }); scrollToProperties() }}
        onDescubreClick={scrollToDestacadas}
        heroImage="/hero-family.jpg"
        logoUrl="/logo-paola-castillo.png"
        user={user}
        onLogout={handleLogout}
      />

      {/* SHOWCASE CAROUSEL */}
      {destacadas.length > 0 && (
        <section
          id="destacadas"
          className="showcase-section"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <div className="showcase-container">
            <div className="showcase-header">
              <SectionTitle title="Propiedades destacadas" />
              {totalSlides > 1 && (
                <div className="showcase-nav-dots">
                  {Array.from({ length: totalSlides }).map((_, i) => (
                    <button
                      key={i}
                      className={`showcase-dot${i === slideIdx ? ' active' : ''}`}
                      onClick={() => { setSlideDir(i > slideIdx ? 'next' : 'prev'); setSlideIdx(i) }}
                      aria-label={`Slide ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="showcase-viewport">
              {/* Arrows */}
              {totalSlides > 1 && (
                <>
                  <button className="showcase-arrow showcase-arrow-l" onClick={goPrev} aria-label="Anterior">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  <button className="showcase-arrow showcase-arrow-r" onClick={goNext} aria-label="Siguiente">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                </>
              )}

              <div className={`showcase-grid showcase-slide-${slideDir}`} key={slideIdx}>
                {/* Main card */}
                {slideItems[0] && (
                  <div onClick={() => openModal(slideItems[0].id)} className="showcase-card showcase-card-main" role="button" tabIndex={0}>
                    <div className="showcase-card-img-wrap">
                      {slideItems[0].imagenes?.[0] && <img src={slideItems[0].imagenes[0]} alt={slideItems[0].titulo} className="showcase-card-img" loading="lazy" />}
                      <div className="showcase-card-overlay" />
                    </div>
                    <div className="showcase-card-info">
                      <span className={`showcase-badge ${slideItems[0].tipo === 'VENTA' ? 'badge-venta' : slideItems[0].tipo === 'ALQUILER' ? 'badge-alquiler' : 'badge-otro'}`}>
                        {slideItems[0].tipo === 'VENTA' ? 'Venta' : slideItems[0].tipo === 'ALQUILER' ? 'Alquiler' : slideItems[0].tipo}
                      </span>
                      <h3 className="showcase-card-title">{slideItems[0].titulo}</h3>
                      {slideItems[0].ubicacion && <p className="showcase-card-loc">{slideItems[0].ubicacion}</p>}
                    </div>
                  </div>
                )}

                {/* Side stack */}
                {slideItems.length > 1 && (
                  <div className="showcase-side">
                    {slideItems.slice(1, 3).map((d) => (
                      <div onClick={() => openModal(d.id)} className="showcase-card showcase-card-small" key={d.id} role="button" tabIndex={0}>
                        <div className="showcase-card-img-wrap">
                          {d.imagenes?.[0] && <img src={d.imagenes[0]} alt={d.titulo} className="showcase-card-img" loading="lazy" />}
                          <div className="showcase-card-overlay" />
                        </div>
                        <div className="showcase-card-info">
                          <span className={`showcase-badge ${d.tipo === 'VENTA' ? 'badge-venta' : d.tipo === 'ALQUILER' ? 'badge-alquiler' : 'badge-otro'}`}>
                            {d.tipo === 'VENTA' ? 'Venta' : d.tipo === 'ALQUILER' ? 'Alquiler' : d.tipo}
                          </span>
                          <h3 className="showcase-card-title">{d.titulo}</h3>
                          {d.ubicacion && <p className="showcase-card-loc">{d.ubicacion}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* FILTROS SECTION */}
      <section ref={filtrosSectionRef} className={`filtros-section${isSticky ? ' is-sticky' : ''}`}>
        <div className="filtros-container">
          <FiltrosFlotantes filtros={filtros} onChange={setFiltros} />
        </div>
      </section>

      {/* PROPIEDADES GRID SECTION */}
      <section id="propiedades" className="propiedades-section">
        <div className="propiedades-container">
          <SectionTitle title="Propiedades disponibles" />
          {loading ? (
            <div className="loading">Cargando propiedades…</div>
          ) : propiedades.length === 0 ? (
            <div className="empty">No hay propiedades disponibles.</div>
          ) : (
            <div className="grid">
              {propiedades.map((p) => (
                <PropiedadCard key={p.id} {...p} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
