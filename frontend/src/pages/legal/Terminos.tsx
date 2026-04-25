import { motion } from 'framer-motion'

const sections = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
    ),
    title: 'Uso del sitio',
    content: 'El usuario se compromete a utilizar este sitio web de manera responsable, ética y conforme a la legislación vigente. Queda prohibido el uso del sitio para actividades ilícitas, fraudulentas o que perjudiquen a terceros.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
    ),
    title: 'Información publicada',
    content: 'La información sobre propiedades es meramente informativa y puede estar sujeta a modificaciones, actualizaciones o retiro sin previo aviso. PaolaVCastillo no garantiza la disponibilidad permanente de ninguna propiedad publicada.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    ),
    title: 'Responsabilidad',
    content: 'PaolaVCastillo no se responsabiliza por errores u omisiones en los contenidos del sitio, ni por daños directos o indirectos derivados del uso o imposibilidad de uso de la plataforma.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
    ),
    title: 'Propiedad intelectual',
    content: 'Todos los contenidos del sitio —incluyendo textos, imágenes, logotipos y diseño— son propiedad de PaolaVCastillo y están protegidos por las leyes de propiedad intelectual. Su reproducción sin autorización expresa está prohibida.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
    ),
    title: 'Modificaciones',
    content: 'Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán en vigencia a partir de su publicación en el sitio. El uso continuado del sitio implica la aceptación de los términos actualizados.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
    ),
    title: 'Legislación aplicable',
    content: 'Estos términos se rigen por las leyes de la República Argentina. Cualquier disputa derivada del uso del sitio será sometida a la jurisdicción de los tribunales competentes.',
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.45, ease: 'easeOut' as const } }),
}

export default function Terminos() {
  return (
    <div className="legal-page">
      <motion.div
        className="legal-hero"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="legal-hero-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        </div>
        <h1 className="legal-hero-title">Términos y Condiciones</h1>
        <p className="legal-hero-sub">El presente sitio web pertenece a PaolaVCastillo. Al utilizarlo aceptás los siguientes términos.</p>
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
              <div className="legal-card-content"><p>{s.content}</p></div>
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
        <p>¿Tenés preguntas sobre estos términos? Escribinos a <a href="mailto:paolavcastilloinm@gmail.com" className="legal-link">paolavcastilloinm@gmail.com</a></p>
      </motion.div>
    </div>
  )
}
