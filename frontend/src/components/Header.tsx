import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logoPrincipal from '../assets/images/logo-principal.png'

export default function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const esAdmin = user?.rol === 'ADMINISTRADOR'

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <header className="site-header">

      {/* ── Logo ── */}
      <div className="site-header-logo">
        <Link to="/">
          <img src={logoPrincipal} alt="Paola V Castillo Inmobiliaria" className="site-header-logo-img" />
        </Link>
      </div>

      {/* ── Nav central ── */}
      <nav className="site-header-nav">
        <Link to="/" className="site-header-nav-link">Inicio</Link>
        <Link to="/?tipo=venta" className="site-header-nav-link">Comprar</Link>
        <Link to="/?tipo=alquiler" className="site-header-nav-link">Alquilar</Link>
      </nav>

      {/* ── Usuario ── */}
      <div className="site-header-user">
        {user ? (
          <div className="site-header-user-inner">
            <span className="site-header-username">{user.nombre ?? user.email}</span>
            {!esAdmin && (
              <Link to="/mis-consultas" className="site-header-link-btn">Mis consultas</Link>
            )}
            {esAdmin && (
              <div className="site-header-admin-wrap">
                <button
                  className="site-header-admin-btn"
                  onClick={() => setMenuOpen(o => !o)}
                >
                  Panel Admin
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                {menuOpen && (
                  <div className="site-header-dropdown" onClick={() => setMenuOpen(false)}>
                    <Link to="/admin" className="site-header-dropdown-item">Dashboard</Link>
                    <Link to="/admin/propiedades" className="site-header-dropdown-item">Propiedades</Link>
                    <Link to="/admin/consultas" className="site-header-dropdown-item">Consultas</Link>
                    <Link to="/admin/usuarios" className="site-header-dropdown-item">Usuarios</Link>
                  </div>
                )}
              </div>
            )}
            <button onClick={handleLogout} className="site-header-logout-btn">Salir</button>
          </div>
        ) : (
          <div className="site-header-auth">
            <Link to="/login" className="site-header-login-btn">Iniciar sesión</Link>
            <Link to="/registro" className="site-header-register-btn">Registrarse</Link>
          </div>
        )}
      </div>

    </header>
  )
}
