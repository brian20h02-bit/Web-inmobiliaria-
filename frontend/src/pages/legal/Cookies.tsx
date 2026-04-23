import { motion } from 'framer-motion'

const cookieTypes = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
    ),
    name: 'Cookies esenciales',
    description: 'Necesarias para el funcionamiento básico del sitio. Sin estas cookies, el sitio no puede funcionar correctamente. No requieren consentimiento.',
    badge: 'Siempre activas',
    badgeColor: '#16a34a',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
    ),
    name: 'Cookies analíticas',
    description: 'Nos permiten analizar el tráfico del sitio y entender cómo los usuarios interactúan con el contenido para mejorar la experiencia.',
    badge: 'Opcionales',
    badgeColor: '#6E88B0',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
    ),
    name: 'Cookies de preferencias',
    description: 'Permiten recordar tus preferencias y configuraciones para ofrecerte una experiencia más personalizada.',
    badge: 'Opcionales',
    badgeColor: '#6E88B0',
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.45, ease: 'easeOut' } }),
}

export default function Cookies() {
  return (
    <div className="legal-page">
      <motion.div
        className="legal-hero"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="legal-hero-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="1" fill="currentColor"/><circle cx="8" cy="14" r="1" fill="currentColor"/><circle cx="16" cy="14" r="1" fill="currentColor"/></svg>
        </div>
        <h1 className="legal-hero-title">Política de Cookies</h1>
        <p className="legal-hero-sub">Cómo y por qué utilizamos cookies para mejorar tu experiencia en nuestro sitio.</p>
        <span className="legal-updated">Última actualización: Abril 2026</span>
      </motion.div>

      <div className="legal-cookies-intro">
        <motion.div
          className="legal-card"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
        >
          <div className="legal-card-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div className="legal-card-body">
            <h2 className="legal-card-title">¿Qué son las cookies?</h2>
            <div className="legal-card-content">
              <p>Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitás un sitio web. Permiten que el sitio recuerde información sobre tu visita para facilitar tu próxima experiencia.</p>
            </div>
          </div>
        </motion.div>
      </div>

      <h2 className="legal-section-subtitle">Tipos de cookies que utilizamos</h2>

      <div className="legal-cookies-grid">
        {cookieTypes.map((c, i) => (
          <motion.div
            key={c.name}
            className="legal-cookie-card"
            custom={i}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            <div className="legal-cookie-card-top">
              <div className="legal-cookie-icon">{c.icon}</div>
              <span className="legal-cookie-badge" style={{ background: c.badgeColor + '1a', color: c.badgeColor, border: `1px solid ${c.badgeColor}40` }}>
                {c.badge}
              </span>
            </div>
            <h3 className="legal-cookie-name">{c.name}</h3>
            <p className="legal-cookie-desc">{c.description}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="legal-card"
        style={{ marginTop: '16px' }}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.45 }}
      >
        <div className="legal-card-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <div className="legal-card-body">
          <h2 className="legal-card-title">Control de cookies</h2>
          <div className="legal-card-content">
            <p>Podés configurar tu navegador para rechazar o eliminar cookies en cualquier momento. Ten en cuenta que deshabilitar ciertas cookies puede afectar la funcionalidad del sitio. Cada navegador tiene su propio procedimiento para gestionar cookies en las opciones de configuración o privacidad.</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="legal-contact-box"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <p>¿Preguntas sobre nuestra política de cookies? Contactanos en <a href="mailto:paolavcastilloinm@gmail.com" className="legal-link">paolavcastilloinm@gmail.com</a></p>
      </motion.div>
    </div>
  )
}
