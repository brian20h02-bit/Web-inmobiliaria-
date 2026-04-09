import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'

interface Propiedad {
  id: string
  titulo: string
  descripcionPublica: string
  descripcionPrivada?: string
  tipo: string
  precio?: number
  ubicacion?: string
  contacto?: string
  imagenes: string[]
}

export default function PropiedadDetalle() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [propiedad, setPropiedad] = useState<Propiedad | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Consulta form
  const [asunto, setAsunto] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [consultaMsg, setConsultaMsg] = useState('')
  const [consultaError, setConsultaError] = useState('')

  useEffect(() => {
    setLoading(true)
    api.get(`/propiedades/${id}`)
      .then((r) => setPropiedad(r.data))
      .catch((e) => {
        if (e.response?.status === 404) setError('Propiedad no encontrada.')
        else setError('Error al cargar la propiedad.')
      })
      .finally(() => setLoading(false))
  }, [id, user])

  async function handleConsulta(e: React.FormEvent) {
    e.preventDefault()
    setConsultaError('')
    setConsultaMsg('')
    try {
      console.log(`[PropiedadDetalle] Enviando consulta a propiedad ${id}:`, { asunto, mensaje: mensaje.substring(0, 50) + '...' })
      const response = await api.post('/consultas', { propiedadId: id, asunto, mensaje })
      console.log('[PropiedadDetalle] ✅ Consulta enviada:', response.data.id)
      setConsultaMsg('Consulta enviada correctamente.')
      setAsunto('')
      setMensaje('')
    } catch (e: unknown) {
      const err = e as { response?: { status?: number; data?: { error?: string } } }
      console.error('[PropiedadDetalle] ❌ Error:', err.response?.status, err.response?.data?.error)
      if (err.response?.status === 409) {
        setConsultaError('Ya tenés una consulta abierta sobre esta propiedad.')
      } else {
        setConsultaError(err.response?.data?.error ?? 'Error al enviar la consulta.')
      }
    }
  }

  if (loading) return <div className="loading">Cargando…</div>
  if (error) return (
    <div className="error-page">
      <p>{error}</p>
      <button onClick={() => navigate('/')} className="btn btn-primary">Volver al inicio</button>
    </div>
  )
  if (!propiedad) return null

  return (
    <div className="detalle">
      <div className="detalle-galeria">
        {propiedad.imagenes?.map((img, i) => (
          <img key={i} src={img} alt={`${propiedad.titulo} ${i + 1}`} className="detalle-img" />
        ))}
        {(!propiedad.imagenes || propiedad.imagenes.length === 0) && (
          <div className="detalle-img-placeholder" />
        )}
      </div>

      <div className="detalle-info">
        <span className="badge">{propiedad.tipo}</span>
        <h1 className="detalle-titulo">{propiedad.titulo}</h1>
        <p className="detalle-desc">{propiedad.descripcionPublica}</p>

        {user ? (
          <div className="detalle-sensible">
            {propiedad.descripcionPrivada && (
              <p className="detalle-desc-privada">{propiedad.descripcionPrivada}</p>
            )}
            {propiedad.precio !== undefined && (
              <p className="detalle-precio">💰 Precio: <strong>${propiedad.precio.toLocaleString()}</strong></p>
            )}
            {propiedad.ubicacion && (
              <p className="detalle-ubicacion">📍 Ubicación: <strong>{propiedad.ubicacion}</strong></p>
            )}
            {propiedad.contacto && (
              <p className="detalle-contacto">📞 Contacto: <strong>{propiedad.contacto}</strong></p>
            )}
          </div>
        ) : (
          <div className="detalle-login-prompt">
            <p>🔒 Iniciá sesión para ver precio, ubicación y contacto.</p>
            <div className="detalle-login-btns">
              <Link to="/login" className="btn btn-primary">Iniciar sesión</Link>
              <Link to="/registro" className="btn btn-outline">Registrarse</Link>
            </div>
          </div>
        )}
      </div>

      {user && (
        <div className="detalle-consulta">
          <h2>Enviar consulta</h2>
          {consultaMsg && <p className="success-msg">{consultaMsg}</p>}
          {consultaError && <p className="error-msg">{consultaError}</p>}
          <form onSubmit={handleConsulta} className="form">
            <div className="form-group">
              <label htmlFor="asunto">Asunto</label>
              <input
                id="asunto"
                type="text"
                value={asunto}
                onChange={(e) => setAsunto(e.target.value)}
                required
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="mensaje">Mensaje</label>
              <textarea
                id="mensaje"
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                required
                rows={4}
                className="form-input"
              />
            </div>
            <button type="submit" className="btn btn-primary">Enviar consulta</button>
          </form>
        </div>
      )}
    </div>
  )
}
