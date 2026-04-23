import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const DEV_INFO = {
  nombre: 'Brian Exequiel Harrison',
  email: 'brian20h02@gmail.com',
  telefono: '3874027542',
  linkedin: 'https://www.linkedin.com/in/brian-exequiel-harrison',
}

export default function Footer() {
  const [devOpen, setDevOpen] = useState(false)

  return (
    <footer className="footer-v2">
      <div className="footer-v2-inner">

        {/* ── Col 1: Brand ── */}
        <div className="footer-v2-brand">
          <img src="/logo-simple.png" alt="PaolaVCastillo" className="footer-v2-logo" />
          <p className="footer-v2-tagline">Asesora de confianza.<br />Tu próxima propiedad, aquí.</p>
        </div>

        {/* ── Col 2: Legal links ── */}
        <div className="footer-v2-links">
          <p className="footer-v2-col-title">Legal</p>
          <Link to="/privacidad" className="footer-v2-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Política de Privacidad
          </Link>
          <Link to="/terminos" className="footer-v2-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            Términos y Condiciones
          </Link>
          <Link to="/cookies" className="footer-v2-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="1" fill="currentColor"/><circle cx="8" cy="14" r="1" fill="currentColor"/><circle cx="16" cy="14" r="1" fill="currentColor"/></svg>
            Política de Cookies
          </Link>
        </div>

        {/* ── Col 3: Developer ── */}
        <div className="footer-v2-dev">
          <p className="footer-v2-col-title">Créditos</p>
          <button
            className="footer-v2-dev-btn"
            onClick={() => setDevOpen(o => !o)}
            aria-expanded={devOpen}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            Desarrollado por
            <motion.span
              animate={{ rotate: devOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'inline-flex' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </motion.span>
          </button>

          <AnimatePresence>
            {devOpen && (
              <motion.div
                className="footer-v2-dev-card"
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <p className="footer-v2-dev-name">{DEV_INFO.nombre}</p>
                <a href={`mailto:${DEV_INFO.email}`} className="footer-v2-dev-row">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  {DEV_INFO.email}
                </a>
                <a href={`tel:${DEV_INFO.telefono}`} className="footer-v2-dev-row">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.59 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  {DEV_INFO.telefono}
                </a>
                <a href={DEV_INFO.linkedin} target="_blank" rel="noopener noreferrer" className="footer-v2-dev-row">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                  LinkedIn
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      <div className="footer-v2-bottom">
        <span>© {new Date().getFullYear()} PaolaVCastillo. Todos los derechos reservados.</span>
      </div>
    </footer>
  )
}

