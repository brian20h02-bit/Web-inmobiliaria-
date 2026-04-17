import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

interface User {
  email: string
  rol?: string
}

interface HeroSectionProps {
  onComprarClick?: () => void
  onAlquilarClick?: () => void
  heroImage?: string
  logoUrl?: string
  title?: string
  subtitle?: string
  user?: User | null
  onLogout?: () => void
}

export default function HeroSection({
  onComprarClick,
  onAlquilarClick,
  heroImage = 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=1200&h=900&fit=crop',
  logoUrl,
  title = "Encontrá el hogar que siempre soñaste",
  subtitle = "Te acompañamos en cada paso para hacer realidad tu próximo hogar",
  user,
  onLogout,
}: HeroSectionProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const esAdmin = user?.rol === 'ADMINISTRADOR'

  return (
    <section 
      className="hero-section" 
      style={{
        backgroundImage: `url(${heroImage})`,
      }}
      role="banner"
    >
      {/* Overlay oscuro para mejorar legibilidad */}
      <div className="hero-overlay" aria-hidden="true" />

      {/* LOGO - ARRIBA A LA IZQUIERDA (DISCRETO) */}
      {logoUrl && (
        <div className="hero-logo-minimal-wrapper">
          <img 
            src={logoUrl} 
            alt="PAOLA V CASTILLO - Inmobiliaria" 
            className="hero-logo-minimal"
            loading="lazy"
          />
        </div>
      )}

      {/* BLOQUE DE USUARIO CON LÓGICA CONDICIONAL */}
      <div className="hero-user-section">
        {/* CASO 1: No hay usuario logueado */}
        {!user && (
          <div className="hero-user-info">
            <Link to="/login" className="btn-hero-outline">
              Iniciar sesión
            </Link>
            <Link to="/registro" className="btn-hero-outline">
              Registrarse
            </Link>
          </div>
        )}

        {/* CASO 2: Usuario logueado (no admin) */}
        {user && !esAdmin && (
          <div className="hero-user-info">
            <span className="hero-user-email">{user.email}</span>
            <button onClick={onLogout} className="btn-hero-outline">
              Cerrar sesión
            </button>
          </div>
        )}

        {/* CASO 3: Usuario ADMIN */}
        {esAdmin && (
          <>
            <div className="hero-user-info">
              <span className="hero-user-email">{user.email}</span>
              <button onClick={onLogout} className="btn-hero-outline">
                Cerrar sesión
              </button>
            </div>
            <div className="hero-admin-menu">
              <button
                className="btn-hero-outline btn-admin-toggle"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                Panel Admin ▾
              </button>
              {menuOpen && (
                <div className="hero-admin-dropdown" onClick={() => setMenuOpen(false)}>
                  <Link to="/admin" className="hero-admin-link">Dashboard</Link>
                  <Link to="/admin/propiedades" className="hero-admin-link">Propiedades</Link>
                  <Link to="/admin/consultas" className="hero-admin-link">Consultas</Link>
                  <Link to="/admin/usuarios" className="hero-admin-link">Usuarios</Link>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Contenedor de contenido */}
      <div className="hero-content">
        {/* Título principal */}
        <h1 className="hero-title">
          {title}
        </h1>

        {/* Subtítulo */}
        <p className="hero-subtitle">
          {subtitle}
        </p>

        {/* Botones principales */}
        <div className="hero-buttons-wrapper">
          <div className="hero-buttons">
            <button
              className="btn-hero btn-hero-primary"
              onClick={onComprarClick}
              aria-label="Buscar propiedades en venta"
            >
              Comprar
            </button>
            <button
              className="btn-hero btn-hero-secondary"
              onClick={onAlquilarClick}
              aria-label="Buscar propiedades en alquiler"
            >
              Alquilar
            </button>
          </div>
        </div>

        {/* Indicador de scroll - DENTRO del hero-content para alineación unificada */}
        <div className="hero-scroll-indicator" aria-hidden="true">
          <span className="scroll-text">Descubre propiedades</span>
          <div className="scroll-arrow">↓</div>
        </div>
      </div>
    </section>
  )
}
