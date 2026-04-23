import { useEffect } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import Footer from './Footer'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [pathname])
  return null
}

export default function LegalLayout() {
  return (
    <div className="layout">
      <ScrollToTop />
      <Link to="/" className="legal-topbar-logo-sticky">
        <img src="/logo-paola-castillo.png" alt="PaolaVCastillo" className="legal-topbar-logo" />
      </Link>
      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
