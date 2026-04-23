import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'
import Footer from '../components/Footer'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [unverifiedEmail, setUnverifiedEmail] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendDone, setResendDone] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setUnverifiedEmail('')

    if (!email || !password) {
      setError('Por favor completá todos los campos.')
      return
    }

    setLoading(true)
    try {
      const res = await api.post('/auth/login', { email, password })
      login(res.data.token)
      navigate('/')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string; code?: string; email?: string } } }
      const data = e.response?.data
      if (data?.code === 'EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(data.email || email)
        setError(data.error || 'Debes verificar tu email antes de continuar')
      } else {
        setError(data?.error || 'Credenciales incorrectas. Verificá tu email y contraseña.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setResendLoading(true)
    try {
      await api.post('/auth/resend-verification', { email: unverifiedEmail })
      setResendDone(true)
    } catch {
      setResendDone(true)
    } finally {
      setResendLoading(false)
    }
  }

  async function handleGoogleSuccess(credentialResponse: { credential?: string }) {
    if (!credentialResponse.credential) return
    setError('')
    try {
      const res = await api.post('/auth/google', { credential: credentialResponse.credential })
      login(res.data.token)
      navigate('/')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error || 'Error al iniciar sesión con Google.')
    }
  }

  return (
    <>
    <div className="auth-page">
      <div className="auth-logo-wrap">
        <Link to="/"><img src="/logo-paola-castillo.png" alt="Paola Castillo Inmobiliaria" className="auth-logo" /></Link>
      </div>
      <div className="auth-card">
        <h1 className="auth-title">Iniciar sesión</h1>
        {error && <p className="error-msg">{error}</p>}

        {unverifiedEmail && !resendDone && (
          <button
            className="btn btn-primary btn-full"
            onClick={handleResend}
            disabled={resendLoading}
            style={{ marginBottom: '12px' }}
          >
            {resendLoading ? 'Enviando…' : 'Reenviar email de verificación'}
          </button>
        )}
        {resendDone && (
          <p className="success-msg" style={{ marginBottom: '12px' }}>
            Te enviamos un nuevo link. Revisá tu bandeja de entrada.
          </p>
        )}

        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="form-input"
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary btn-full">
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <div className="auth-divider">
          <span>o</span>
        </div>

        <div className="auth-google-wrap">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('No se pudo iniciar sesión con Google.')}
            width="100%"
            text="signin_with"
          />
        </div>

        <p className="auth-footer">
          ¿No tenés cuenta? <Link to="/registro">Registrate</Link>
        </p>
      </div>
    </div>
    <Footer />
    </>
  )
}
