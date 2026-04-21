import { Link } from 'react-router-dom'
import UserMenu from './UserMenu'

interface User {
  email: string
  nombre?: string
  rol?: string
}

interface HeroSectionProps {
  onComprarClick?: () => void
  onAlquilarClick?: () => void
  onDescubreClick?: () => void
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
  onDescubreClick,
  heroImage = 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=1200&h=900&fit=crop',
  logoUrl,
  title = "Encontrá el hogar que siempre soñaste",
  subtitle = "Te acompañamos en cada paso para hacer realidad tu próximo hogar",
  user,
  onLogout,
}: HeroSectionProps) {
  const esAdmin = user?.rol === 'ADMINISTRADOR'

  return (
    <section 
      className="hero-section" 
      style={{ backgroundImage: `url(${heroImage})` }}
      role="banner"
    >
      <div className="hero-overlay" aria-hidden="true" />

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

      {/* Menú de usuario / auth — top right */}
      <div className="hero-user-section">
        {!user && (
          <div className="hero-user-info">
            <Link to="/login" className="btn-hero-outline">Iniciar sesión</Link>
            <Link to="/registro" className="btn-hero-outline">Registrarse</Link>
          </div>
        )}
        {user && (
          <UserMenu
            email={user.email}
            onLogout={onLogout ?? (() => {})}
            isAdmin={esAdmin}
          />
        )}
      </div>

      <div className="hero-content">
        <h1 className="hero-title">{title}</h1>
        <p className="hero-subtitle">{subtitle}</p>

        <div className="hero-buttons-wrapper">
          <div className="hero-buttons">
            <button className="btn-hero btn-hero-primary" onClick={onComprarClick} aria-label="Buscar propiedades en venta">
              Comprar
            </button>
            <button className="btn-hero btn-hero-secondary" onClick={onAlquilarClick} aria-label="Buscar propiedades en alquiler">
              Alquilar
            </button>
          </div>
        </div>

        <button className="hero-scroll-indicator" onClick={onDescubreClick} aria-label="Descubre propiedades">
          <span className="scroll-text">Descubre propiedades</span>
          <div className="scroll-arrow">↓</div>
        </button>
      </div>
    </section>
  )
}
