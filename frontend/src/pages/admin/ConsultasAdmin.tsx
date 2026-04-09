import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../lib/api'

interface Consulta {
  id: string
  asunto: string
  estado: string
  leidoPorAdmin?: boolean
  fechaCreacion: string
  usuario?: { nombre: string; email: string }
  propiedad?: { titulo: string }
}

const ESTADO_LABEL: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  RESPONDIDA: 'Respondida',
  CERRADA: 'Cerrada',
}

export default function ConsultasAdmin() {
  const navigate = useNavigate()
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [loading, setLoading] = useState(true)

  const cargarConsultas = () => {
    api.get('/consultas')
      .then((r) => {
        // Aplicar estado de lectura local desde localStorage
        const consultasLeidas = JSON.parse(localStorage.getItem('consultasLeidas') || '[]')
        console.log('Consultas leídas en localStorage (admin):', consultasLeidas)
        
        const consultasActualizadas = r.data.map((c: Consulta) => {
          const esLeidaEnLocal = consultasLeidas.some((id: string) => id === c.id)
          const actual = {
            ...c,
            leidoPorAdmin: c.leidoPorAdmin === true || esLeidaEnLocal
          }
          if (esLeidaEnLocal && !c.leidoPorAdmin) {
            console.log(`Consulta ${c.id} (${c.asunto}) marcada como leída por localStorage (admin)`)
          }
          return actual
        })
        
        console.log('Consultas después de aplicar localStorage (admin):', consultasActualizadas)
        setConsultas(consultasActualizadas)
      })
      .catch(() => setConsultas([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    cargarConsultas()

    // Recargar cada 10 segundos para ver nuevas consultas en tiempo quasi-real
    const interval = setInterval(cargarConsultas, 10000)

    // Recargar cuando el usuario vuelve de la pestaña
    const handleFocus = () => {
      console.log('[ConsultasAdmin] Focus event - recargando consultas')
      cargarConsultas()
    }

    // Escuchar evento cuando se abre una consulta
    const handleConsultaAbierta = () => {
      console.log('[ConsultasAdmin] consultaAbierta event - recargando')
      setTimeout(() => cargarConsultas(), 100)
    }

    // Escuchar evento cuando una consulta es marcada como leída
    const handleConsultaLeida = () => {
      console.log('[ConsultasAdmin] consultaLeida event - recargando')
      setTimeout(() => cargarConsultas(), 100)
    }

    window.addEventListener('focus', handleFocus)
    window.addEventListener('consultaAbierta', handleConsultaAbierta)
    window.addEventListener('consultaLeida', handleConsultaLeida)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('consultaAbierta', handleConsultaAbierta)
      window.removeEventListener('consultaLeida', handleConsultaLeida)
    }
  }, [])

  function handleResponder(consultaId: string) {
    navigate(`/consultas/${consultaId}`)
  }

  if (loading) return <div className="loading">Cargando consultas…</div>

  return (
    <div className="page-container">
      <h1 className="page-title">Consultas</h1>
      {consultas.length === 0 ? (
        <p className="empty">No hay consultas.</p>
      ) : (
        <div className="consultas-list">
          {consultas.map((c) => (
            <div key={c.id} className="consulta-item">
              <div className="consulta-info">
                <h3 className="consulta-asunto">
                  {c.asunto}
                  {!c.leidoPorAdmin && <span className="unread-badge">●</span>}
                </h3>
                {c.usuario && <p className="consulta-usuario">Usuario: {c.usuario.nombre ?? c.usuario.email}</p>}
                {c.propiedad && <p className="consulta-propiedad">Propiedad: {c.propiedad.titulo}</p>}
                <p className="consulta-fecha">{new Date(c.fechaCreacion).toLocaleDateString('es-AR')}</p>
              </div>
              <div className="consulta-actions">
                <span className={`estado-badge estado-${c.estado}`}>{ESTADO_LABEL[c.estado] ?? c.estado}</span>
                <button
                  onClick={() => handleResponder(c.id)}
                  className="btn btn-primary btn-sm"
                >
                  Responder
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
