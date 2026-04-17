import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useChat } from '../context/ChatContext'
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
  const { consultarPropiedad, isLoading: chatLoading } = useChat()
  const navigate = useNavigate()
  const [propiedad, setPropiedad] = useState<Propiedad | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [consultaEnviada, setConsultaEnviada] = useState(false)

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

  async function handleConsultarPropiedad() {
    if (!propiedad || !id) return
    setConsultaEnviada(true)
    await consultarPropiedad(id, propiedad.titulo)
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

      {user && user.rol === 'USUARIO' && (
        <div className="detalle-consulta-chat">
          {consultaEnviada ? (
            <div className="consulta-enviada-msg">
              <span className="consulta-check">✓</span>
              <p>Tu consulta fue enviada. Revisá el chat para seguir la conversación.</p>
            </div>
          ) : (
            <button
              className="btn-consultar-propiedad"
              onClick={handleConsultarPropiedad}
              disabled={chatLoading}
            >
              {chatLoading ? (
                <span>Abriendo chat...</span>
              ) : (
                <>
                  <span className="btn-consultar-icon">💬</span>
                  <span>Consultar por esta propiedad</span>
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
