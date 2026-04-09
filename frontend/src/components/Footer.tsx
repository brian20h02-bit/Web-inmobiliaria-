import { Link } from 'react-router-dom'
import logoSecundario from '../assets/images/logo-secundario.png'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <img src={logoSecundario} alt="PC Logo" style={{ height: '50px' }} className="footer-logo" />
        <div className="footer-info">
          <span>📧 info@inmobiliariaweb.com</span>
          <span>📞 +54 11 1234-5678</span>
        </div>
        <Link to="/privacidad" className="footer-link">Política de Privacidad</Link>
      </div>
    </footer>
  )
}
