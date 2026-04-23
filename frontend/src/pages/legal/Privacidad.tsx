import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const sections = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
    ),
    title: 'Información que recopilamos',
    content: (
      <ul className="legal-list">
        <li>Nombre y apellido</li>
        <li>Dirección de correo electrónico</li>
        <li>Número de teléfono</li>
        <li>Información relacionada con consultas inmobiliarias</li>
      </ul>
    ),
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
    ),
    title: 'Uso de la información',
    content: (
      <ul className="legal-list">
        <li>Responder consultas realizadas a través del sitio web</li>
        <li>Brindar información sobre propiedades</li>
        <li>Contactar a los usuarios por medios electrónicos o telefónicos</li>
      </ul>
    ),
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
    ),
    title: 'Protección de datos',
    content: (
      <p>Implementamos medidas de seguridad técnicas y organizativas adecuadas para proteger la información personal de nuestros usuarios contra accesos no autorizados, alteración, divulgación o destrucción.</p>
    ),
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    ),
    title: 'Compartición de datos',
    content: (
      <p>No compartimos datos personales con terceros, salvo obligación legal o cuando sea necesario para la prestación del servicio (por ejemplo, plataformas de mensajería o CRM). En tales casos, exigimos que dichos terceros mantengan la confidencialidad de la información.</p>
    ),
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
    ),
    title: 'Derechos del usuario',
    content: (
      <p>El usuario puede solicitar en cualquier momento el acceso, rectificación o eliminación de sus datos personales enviando un correo a: <a href="mailto:paolavcastilloinm@gmail.com" className="legal-link">paolavcastilloinm@gmail.com</a></p>
    ),
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="1" fill="currentColor"/><circle cx="8" cy="14" r="1" fill="currentColor"/><circle cx="16" cy="14" r="1" fill="currentColor"/></svg>
    ),
    title: 'Cookies',
    content: (
      <p>Este sitio puede utilizar cookies para mejorar la experiencia del usuario. Podés consultar nuestra <Link to="/cookies" className="legal-link">Política de Cookies</Link> para más información.</p>
    ),
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.45, ease: 'easeOut' } }),
}

export default function Privacidad() {
  return (
    <div className="legal-page">
      <motion.div
        className="legal-hero"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="legal-hero-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <h1 className="legal-hero-title">Política de Privacidad</h1>
        <p className="legal-hero-sub">En PaolaVCastillo nos comprometemos a proteger tu privacidad y tus datos personales.</p>
        <span className="legal-updated">Última actualización: Abril 2026</span>
      </motion.div>

      <div className="legal-sections">
        {sections.map((s, i) => (
          <motion.div
            key={s.title}
            className="legal-card"
            custom={i}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            <div className="legal-card-icon">{s.icon}</div>
            <div className="legal-card-body">
              <h2 className="legal-card-title">{s.title}</h2>
              <div className="legal-card-content">{s.content}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="legal-contact-box"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <p>¿Tenés dudas sobre esta política? Contactanos en <a href="mailto:paolavcastilloinm@gmail.com" className="legal-link">paolavcastilloinm@gmail.com</a></p>
      </motion.div>
    </div>
  )
}
