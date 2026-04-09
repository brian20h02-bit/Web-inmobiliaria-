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
    <header className="header">
      <nav className="header-nav-top">
        {user ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="header-username">{user.email}</span>
              <button onClick={handleLogout} className="btn btn-outline">Cerrar sesión</button>
            </div>
            {esAdmin && (
              <div className="admin-menu-wrapper">
                <button
                  className="filtro-btn"
                  onClick={() => setMenuOpen(!menuOpen)}
                >
                  Panel Admin ▾
                </button>
                {menuOpen && (
                  <div className="admin-dropdown" onClick={() => setMenuOpen(false)}>
                    <Link to="/admin" className="admin-dropdown-item">Dashboard</Link>
                    <Link to="/admin/propiedades" className="admin-dropdown-item">Propiedades</Link>
                    <Link to="/admin/consultas" className="admin-dropdown-item">Consultas</Link>
                    <Link to="/admin/usuarios" className="admin-dropdown-item">Usuarios</Link>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <>
            <Link to="/login" className="btn btn-outline">Login</Link>
            <Link to="/registro" className="btn btn-primary">Registro</Link>
          </>
        )}
      </nav>
      <div className="header-logo-container">
        <Link to="/" className="header-logo">
          <img src={logoPrincipal} alt="Paola V Castillo" className="header-logo-img" />
        </Link>
      </div>
    </header>
  )
}
