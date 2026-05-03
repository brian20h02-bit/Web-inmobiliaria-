import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import UserMenu from './UserMenu'
import FiltrosFlotantes, { type FiltrosState } from './FiltrosFlotantes'

const EMPTY_FILTROS: FiltrosState = {
  tipo: 'todo',
  ciudad: '',
  tipoPropiedad: '',
  ambientes: '',
  banos: '',
}

export default function PropertyHeader() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [filtros, setFiltros] = useState<FiltrosState>(EMPTY_FILTROS)

  const showBack = !/^\/propiedades\//.test(location.pathname)

  function handleLogout() {
    logout()
    navigate('/')
  }

  function handleFiltrosChange(f: FiltrosState) {
    setFiltros(f)
    const params = new URLSearchParams()
    if (f.tipo !== 'todo') params.set('tipo', f.tipo)
    if (f.ciudad) params.set('ciudad', f.ciudad)
    if (f.tipoPropiedad) params.set('tipoPropiedad', f.tipoPropiedad)
    if (f.ambientes) params.set('ambientes', f.ambientes)
    if (f.banos) params.set('banos', f.banos)
    navigate(`/?${params.toString()}`)
  }

  return (
    <>
      {/* ── Logo fijo top-left + botón volver ── */}
      <div className="pd-fixed-logo">
        <Link to="/">
          <img
            src="/logo-paola-castillo.png"
            alt="Paola V Castillo Inmobiliaria"
            className="pd-fixed-logo-img"
          />
        </Link>
        <button className="ph-back-btn" onClick={() => navigate(-1)} aria-label="Volver" style={{ display: showBack ? 'flex' : 'none' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Volver
        </button>
      </div>

      {/* ── Filtros sticky centrados ── */}
      <div className={`pd-sticky-filters${!showBack ? ' pd-sticky-filters--detail' : ''}`}>
        <FiltrosFlotantes filtros={filtros} onChange={handleFiltrosChange} />
      </div>

      {/* ── UserMenu fijo top-right ── */}
      {user ? (
        <div className="pd-fixed-user">
          <UserMenu
            email={user.email}
            onLogout={handleLogout}
            isAdmin={user.rol === 'ADMINISTRADOR'}
          />
        </div>
      ) : (
        <div className="pd-fixed-user pd-fixed-user--auth">
          <Link to="/login" className="pd-topnav-auth-link">Iniciar sesión</Link>
          <Link to="/registro" className="pd-topnav-auth-link pd-topnav-auth-link--primary">Registrarse</Link>
        </div>
      )}
    </>
  )
}
