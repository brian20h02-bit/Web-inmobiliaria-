import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'

interface Mensaje {
  id: string
  contenido: string
  fecha: string
  autorId: string
  autor?: { nombre: string; email: string }
}

interface Consulta {
  id: string
  asunto: string
  estado: string
  leidoPorAdmin?: boolean
  leidoPorUsuario?: boolean
  propiedad?: { id: string; titulo: string }
}

export default function HiloConsulta() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [consulta, setConsulta] = useState<Consulta | null>(null)
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [nuevoMensaje, setNuevoMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([
      api.get(`/consultas/${id}`),
      api.get(`/consultas/${id}/hilo`),
    ])
      .then(([cRes, hRes]) => {
        setConsulta(cRes.data)
        setMensajes(hRes.data)
        
        // Marcar como leída inmediatamente en localStorage
        const consultasLeidas = JSON.parse(localStorage.getItem('consultasLeidas') || '[]')
        if (!consultasLeidas.includes(id)) {
          consultasLeidas.push(id)
          localStorage.setItem('consultasLeidas', JSON.stringify(consultasLeidas))
          console.log(`[localStorage] Consulta ${id} marcada como leída. Lista: ${JSON.stringify(consultasLeidas)}`)
        }

        // Intentar marcar en backend (no crítico)
        marcarComoLeida()
        
        // Notificar eventos para que otros componentes se refresque
        window.dispatchEvent(new Event('consultaAbierta'))
        window.dispatchEvent(new Event('consultaLeida'))
      })
      .catch(() => setError('No se pudo cargar el hilo de consulta.'))
      .finally(() => setLoading(false))
  }, [id, user])

  async function marcarComoLeida() {
    if (!id) return
    try {
      console.log(`[Backend] Marcando consulta ${id} como leída`)
      const response = await api.put(`/consultas/${id}/leer`)
      console.log('[Backend] Respuesta:', response.status, response.data)
    } catch (error: any) {
      // Esto es no-crítico - ya está en localStorage
      console.error('[Backend] Error no crítico al marcar como leída:', error.message)
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  async function handleEnviarMensaje(e: React.FormEvent) {
    e.preventDefault()
    if (!nuevoMensaje.trim()) return

    setEnviando(true)
    try {
      const response = await api.post(`/consultas/${id}/respuesta`, {
        contenido: nuevoMensaje,
      })
      
      setMensajes(response.data.mensajes || response.data.data || [])
      setConsulta(response.data)
      setNuevoMensaje('')
      
      // Disparar evento para notificar a ambos usuarios
      console.log('[HiloConsulta] Mensaje enviado - notificando a widget');
      window.dispatchEvent(new Event('respuestaEnviada'));
      
      // Si el usuario que responde es admin, también notifico
      // El widget escuchará y recargará para el otro usuario
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al enviar el mensaje')
    } finally {
      setEnviando(false)
    }
  }

  if (loading) return <div className="loading">Cargando hilo…</div>
  if (error) return <div className="error-page"><p>{error}</p><Link to="/mis-consultas" className="btn btn-primary">Volver</Link></div>

  return (
    <div className="page-container">
      <Link to="/mis-consultas" className="back-link">← Mis consultas</Link>
      {consulta && (
        <div className="hilo-header">
          <h1 className="page-title">{consulta.asunto}</h1>
          {consulta.propiedad && (
            <p>Propiedad: <Link to={`/propiedades/${consulta.propiedad.id}`}>{consulta.propiedad.titulo}</Link></p>
          )}
          <span className={`estado-badge estado-${consulta.estado}`}>{consulta.estado}</span>
        </div>
      )}

      <div className="hilo-mensajes">
        {mensajes.map((m) => {
          const esPropio = m.autorId === user?.id
          return (
            <div key={m.id} className={`mensaje ${esPropio ? 'mensaje-propio' : 'mensaje-otro'}`}>
              <p className="mensaje-autor">{m.autor?.nombre ?? m.autor?.email ?? (esPropio ? 'Vos' : 'Admin')}</p>
              <p className="mensaje-contenido">{m.contenido}</p>
              <p className="mensaje-fecha">{new Date(m.fecha).toLocaleString('es-AR')}</p>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleEnviarMensaje} className="hilo-form">
        <textarea
          value={nuevoMensaje}
          onChange={(e) => setNuevoMensaje(e.target.value)}
          placeholder="Escribe tu mensaje..."
          disabled={enviando}
          className="hilo-input"
        />
        <button
          type="submit"
          disabled={enviando || !nuevoMensaje.trim()}
          className="btn btn-primary"
        >
          {enviando ? 'Enviando...' : 'Enviar'}
        </button>
      </form>
    </div>
  )
}
