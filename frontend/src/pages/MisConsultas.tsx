import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'

interface Consulta {
  id: string
  asunto: string
  estado: string
  leidoPorUsuario?: boolean
  fechaCreacion: string
  propiedad?: { titulo: string }
}

const ESTADO_LABEL: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  RESPONDIDA: 'Respondida',
  CERRADA: 'Cerrada',
}

export default function MisConsultas() {
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [loading, setLoading] = useState(true)

  const cargarConsultas = () => {
    api.get('/consultas/mis-consultas')
      .then((r) => {
        // Aplicar estado de lectura local desde localStorage
        const consultasLeidas = JSON.parse(localStorage.getItem('consultasLeidas') || '[]')
        console.log('Consultas leídas en localStorage:', consultasLeidas)
        
        const consultasActualizadas = r.data.map((c: Consulta) => {
          const esLeidaEnLocal = consultasLeidas.some((id: string) => id === c.id)
          const actual = {
            ...c,
            leidoPorUsuario: c.leidoPorUsuario === true || esLeidaEnLocal
          }
          if (esLeidaEnLocal && !c.leidoPorUsuario) {
            console.log(`Consulta ${c.id} (${c.asunto}) marcada como leída por localStorage`)
          }
          return actual
        })
        
        console.log('Consultas después de aplicar localStorage:', consultasActualizadas)
        setConsultas(consultasActualizadas)
      })
      .catch(() => setConsultas([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    cargarConsultas()

    // Recargar cuando el usuario vuelve de la pestaña
    const handleFocus = () => {
      console.log('[MisConsultas] Focus event - recargando consultas')
      cargarConsultas()
    }

    // Escuchar evento cuando se abre una consulta
    const handleConsultaAbierta = () => {
      console.log('[MisConsultas] consultaAbierta event - recargando')
      // Pequeño delay para asegurar que localStorage se actualizó
      setTimeout(() => cargarConsultas(), 100)
    }

    // Escuchar evento cuando una consulta es marcada como leída
    const handleConsultaLeida = () => {
      console.log('[MisConsultas] consultaLeida event - recargando')
      setTimeout(() => cargarConsultas(), 100)
    }

    window.addEventListener('focus', handleFocus)
    window.addEventListener('consultaAbierta', handleConsultaAbierta)
    window.addEventListener('consultaLeida', handleConsultaLeida)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('consultaAbierta', handleConsultaAbierta)
      window.removeEventListener('consultaLeida', handleConsultaLeida)
    }
  }, [])

  if (loading) return <div className="loading">Cargando consultas…</div>

  return (
    <div className="page-container">
      <h1 className="page-title">Mis consultas</h1>
      {consultas.length === 0 ? (
        <p className="empty">No tenés consultas aún. <Link to="/">Explorá propiedades</Link></p>
      ) : (
        <div className="consultas-list">
          {consultas.map((c) => (
            <div key={c.id} className="consulta-item">
              <div className="consulta-info">
                <h3 className="consulta-asunto">
                  {c.asunto}
                  {!c.leidoPorUsuario && <span className="unread-badge">●</span>}
                </h3>
                {c.propiedad && <p className="consulta-propiedad">Propiedad: {c.propiedad.titulo}</p>}
                <p className="consulta-fecha">{new Date(c.fechaCreacion).toLocaleDateString('es-AR')}</p>
              </div>
              <div className="consulta-actions">
                <span className={`estado-badge estado-${c.estado?.toLowerCase()}`}>{ESTADO_LABEL[c.estado] ?? c.estado}</span>
                <Link to={`/consultas/${c.id}`} className="btn btn-outline btn-sm">Ver hilo</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
