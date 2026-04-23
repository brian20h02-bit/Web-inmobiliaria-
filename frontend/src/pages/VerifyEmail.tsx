import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'
import Footer from '../components/Footer'

type Status = 'loading' | 'success' | 'error' | 'expired'

export default function VerifyEmail() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const navigate = useNavigate()
  const { login } = useAuth()
  const [status, setStatus] = useState<Status>('loading')
  const [message, setMessage] = useState('')
  const [expiredEmail, setExpiredEmail] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendDone, setResendDone] = useState(false)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No se encontró un token de verificación.')
      return
    }

    api
      .get(`/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((res) => {
        login(res.data.token)
        setStatus('success')
        setTimeout(() => navigate('/'), 2500)
      })
      .catch((err) => {
        const data = err.response?.data
        if (data?.code === 'TOKEN_EXPIRED') {
          setStatus('expired')
          setExpiredEmail(data.email || '')
          setMessage(data.error)
        } else {
          setStatus('error')
          setMessage(data?.error || 'El link es inválido o ya fue utilizado.')
        }
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  async function handleResend() {
    setResendLoading(true)
    try {
      await api.post('/auth/resend-verification', { email: expiredEmail })
      setResendDone(true)
    } catch {
      setResendDone(true) // show generic message either way
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <>
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Verificación de email</h1>

        {status === 'loading' && (
          <p className="auth-footer">Verificando tu cuenta…</p>
        )}

        {status === 'success' && (
          <>
            <p className="success-msg">¡Email verificado correctamente! Bienvenido/a.</p>
            <p className="auth-footer">Redirigiendo al inicio…</p>
          </>
        )}

        {status === 'error' && (
          <>
            <p className="error-msg">{message}</p>
            <p className="auth-footer">
              <Link to="/login">Volver al inicio de sesión</Link>
            </p>
          </>
        )}

        {status === 'expired' && (
          <>
            <p className="error-msg">{message}</p>
            {!resendDone ? (
              <button
                className="btn btn-primary btn-full"
                onClick={handleResend}
                disabled={resendLoading}
                style={{ marginTop: '12px' }}
              >
                {resendLoading ? 'Enviando…' : 'Reenviar link de verificación'}
              </button>
            ) : (
              <p className="success-msg">
                Te enviamos un nuevo link. Revisá tu bandeja de entrada.
              </p>
            )}
            <p className="auth-footer" style={{ marginTop: '12px' }}>
              <Link to="/login">Volver al inicio de sesión</Link>
            </p>
          </>
        )}
      </div>
    </div>
    <Footer />
    </>
  )
}
