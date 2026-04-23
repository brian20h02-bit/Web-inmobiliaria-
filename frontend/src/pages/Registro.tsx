import { useState, FormEvent, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'

export default function Registro() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingVerification, setPendingVerification] = useState(false)

  const passwordRules = useMemo(() => [
    { label: 'Mínimo 8 caracteres',         met: password.length >= 8 },
    { label: 'Al menos una mayúscula',       met: /[A-Z]/.test(password) },
    { label: 'Al menos una minúscula',       met: /[a-z]/.test(password) },
    { label: 'Al menos un número',           met: /[0-9]/.test(password) },
    { label: 'Al menos un carácter especial', met: /[^A-Za-z0-9]/.test(password) },
  ], [password])

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!nombre.trim()) e.nombre = 'El nombre completo es requerido.'
    if (!email.trim()) e.email = 'El email es requerido.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'El email no tiene un formato válido.'
    if (!password) {
      e.password = 'La contraseña es requerida.'
    } else if (password.length < 8) {
      e.password = 'La contraseña debe tener al menos 8 caracteres.'
    } else if (!/[A-Z]/.test(password)) {
      e.password = 'La contraseña debe contener al menos una mayúscula.'
    } else if (!/[a-z]/.test(password)) {
      e.password = 'La contraseña debe contener al menos una minúscula.'
    } else if (!/[0-9]/.test(password)) {
      e.password = 'La contraseña debe contener al menos un número.'
    } else if (!/[^A-Za-z0-9]/.test(password)) {
      e.password = 'La contraseña debe contener al menos un carácter especial.'
    }
    if (!confirmPassword) {
      e.confirmPassword = 'Confirmá tu contraseña.'
    } else if (password !== confirmPassword) {
      e.confirmPassword = 'Las contraseñas no coinciden.'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setServerError('')
    if (!validate()) return

    setLoading(true)
    try {
      await api.post('/auth/registro', { nombre, email, password })
      setPendingVerification(true)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setServerError(e.response?.data?.error ?? 'Error al registrarse. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSuccess(credentialResponse: { credential?: string }) {
    if (!credentialResponse.credential) return
    setServerError('')
    try {
      const res = await api.post('/auth/google', { credential: credentialResponse.credential })
      login(res.data.token)
      navigate('/')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setServerError(e.response?.data?.error || 'Error al continuar con Google.')
    }
  }

  if (pendingVerification) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1 className="auth-title">Revisá tu email</h1>
          <p className="success-msg">
            Te enviamos un link de verificación a <strong>{email}</strong>.
            Hacé clic en el link para activar tu cuenta.
          </p>
          <p className="auth-footer">
            ¿Ya verificaste? <Link to="/login">Iniciá sesión</Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Crear cuenta</h1>
        {serverError && <p className="error-msg">{serverError}</p>}
        <form onSubmit={handleSubmit} className="form" noValidate>
          <div className="form-group">
            <label htmlFor="nombre">Nombre completo</label>
            <input
              id="nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="form-input"
              placeholder="Ej: María González"
            />
            {errors.nombre && <span className="field-error">{errors.nombre}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
            />
            <ul className="password-rules">
              {passwordRules.map((rule) => (
                <li key={rule.label} style={{ color: rule.met ? '#16a34a' : '#dc2626' }}>
                  <span>{rule.met ? '✓' : '✗'}</span> {rule.label}
                </li>
              ))}
            </ul>
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar contraseña</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="form-input"
            />
            {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary btn-full">
            {loading ? 'Registrando…' : 'Crear cuenta'}
          </button>
        </form>

        <div className="auth-divider">
          <span>o</span>
        </div>

        <div className="auth-google-wrap">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setServerError('No se pudo continuar con Google.')}
            width="100%"
            text="signup_with"
          />
        </div>

        <p className="auth-footer">
          ¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link>
        </p>
      </div>
    </div>
  )
}
