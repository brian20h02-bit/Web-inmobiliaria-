import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', gap: '16px', textAlign: 'center', padding: '24px' }}>
      <h1 style={{ fontSize: '5rem', fontWeight: 800, color: 'var(--primary, #6E88B0)', lineHeight: 1, margin: 0 }}>404</h1>
      <h2 style={{ fontSize: '1.4rem', color: '#333', margin: 0 }}>Página no encontrada</h2>
      <p style={{ color: '#666', maxWidth: '360px' }}>La página que buscás no existe o fue movida.</p>
      <Link to="/" style={{ padding: '10px 28px', background: 'var(--primary, #6E88B0)', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>
        Volver al inicio
      </Link>
    </div>
  )
}
