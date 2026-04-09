import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'
import { playNotificationSound } from '../lib/notification-sound'

interface Consulta {
  id: string
  asunto: string
  estado: string
  leidoPorAdmin: boolean
  leidoPorUsuario: boolean
  fechaCreacion: string
  usuario?: { nombre: string; email: string }
  propiedad?: { id: string; titulo: string }
  mensajes?: Array<{ id: string; contenido: string }>
}

export default function NotificacionesWidget() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [mostrarPanel, setMostrarPanel] = useState(false)
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [consultasNoLeidas, setConsultasNoLeidas] = useState<Consulta[]>([])
  const [totalNoLeidas, setTotalNoLeidas] = useState(0)
  const [conteoAnterior, setConteoAnterior] = useState(0)
  const [loading, setLoading] = useState(false)
  const [filtro, setFiltro] = useState<'todas' | 'no-leidas'>('todas')

  useEffect(() => {
    if (!user) return

    cargarConsultas()
    
    // Polling cada 3 segundos
    const interval = setInterval(cargarConsultas, 3000)
    
    // Recargar cuando vuelve el focus
    const handleFocus = () => {
      console.log('[NotificacionesWidget] Focus - recargando')
      cargarConsultas()
    }
    
    const handleConsultaLeida = () => {
      console.log('[NotificacionesWidget] Event consultaLeida - recargando')
      setTimeout(() => cargarConsultas(), 100)
    }

    const handleConsultaAbierta = () => {
      console.log('[NotificacionesWidget] Event consultaAbierta - recargando')
      setTimeout(() => cargarConsultas(), 100)
    }

    const handleRespuestaEnviada = () => {
      console.log('[NotificacionesWidget] Event respuestaEnviada - recargando')
      setTimeout(() => cargarConsultas(), 100)
    }
    
    window.addEventListener('focus', handleFocus)
    window.addEventListener('consultaLeida', handleConsultaLeida)
    window.addEventListener('consultaAbierta', handleConsultaAbierta)
    window.addEventListener('respuestaEnviada', handleRespuestaEnviada)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('consultaLeida', handleConsultaLeida)
      window.removeEventListener('consultaAbierta', handleConsultaAbierta)
      window.removeEventListener('respuestaEnviada', handleRespuestaEnviada)
    }
  }, [user])

  async function cargarConsultas() {
    if (!user) return
    
    setLoading(true)
    try {
      const response = await api.get('/consultas/mis-notificaciones')
      const todasLasConsultas = response.data.consultas || []
      
      // Calcular no leídas
      const esAdmin = user.rol === 'ADMINISTRADOR'
      const noLeidas = todasLasConsultas.filter((c: Consulta) =>
        esAdmin ? !c.leidoPorAdmin : !c.leidoPorUsuario
      )
      
      const totalNuevo = noLeidas.length

      console.log(`[NotificacionesWidget] ${esAdmin ? 'ADMIN' : 'USUARIO'} ${user.email}: ${totalNuevo} no leídas (anterior: ${conteoAnterior}), total: ${todasLasConsultas.length}`)
      
      // Debug: mostrar detalles de las no leídas
      if (esAdmin && totalNuevo > 0) {
        console.log('[NotificacionesWidget] Consultas sin leer para admin:', noLeidas.map((c: Consulta) => ({ id: c.id, asunto: c.asunto, leidoPorAdmin: c.leidoPorAdmin })))
      }

      // Si hay nuevas consultas, reproducir sonido
      if (totalNuevo > conteoAnterior && conteoAnterior > 0) {
        console.log('[NotificacionesWidget] 🔔 Reproducing notification sound...')
        try {
          playNotificationSound()
        } catch (error) {
          console.error('[NotificacionesWidget] Error playing sound:', error)
        }
      }

      setConsultas(todasLasConsultas)
      setConsultasNoLeidas(noLeidas)
      setTotalNoLeidas(totalNuevo)
      setConteoAnterior(totalNuevo)
    } catch (error: any) {
      console.error('[NotificacionesWidget] ❌ Error:', error.response?.data || error.message)
      setConsultas([])
      setConsultasNoLeidas([])
      setTotalNoLeidas(0)
    } finally {
      setLoading(false)
    }
  }

  function irAConsulta(consultaId: string) {
    navigate(`/consultas/${consultaId}`)
    setMostrarPanel(false)
  }

  const consultasMostradas = filtro === 'no-leidas' ? consultasNoLeidas : consultas

  if (!user) return null

  return (
    <div className="notificaciones-widget">
      <button
        className="notificaciones-btn"
        onClick={() => setMostrarPanel(!mostrarPanel)}
      >
        Consultas
        {totalNoLeidas > 0 && (
          <span className="notificaciones-badge">{totalNoLeidas}</span>
        )}
      </button>

      {mostrarPanel && (
        <div className="notificaciones-panel">
          <div className="notificaciones-header">
            <h3>
              {user.rol === 'ADMINISTRADOR' ? 'Consultas de Clientes' : 'Mis Consultas'}
            </h3>
            <button
              className="btn-close"
              onClick={() => setMostrarPanel(false)}
            >
              ✕
            </button>
          </div>

          <div className="notificaciones-filtros">
            <button
              className={`filtro-tab ${filtro === 'todas' ? 'activo' : ''}`}
              onClick={() => setFiltro('todas')}
            >
              Todas ({consultas.length})
            </button>
            <button
              className={`filtro-tab ${filtro === 'no-leidas' ? 'activo' : ''}`}
              onClick={() => setFiltro('no-leidas')}
            >
              {user.rol === 'ADMINISTRADOR' ? 'Sin leer' : 'Sin responder'} ({totalNoLeidas})
            </button>
          </div>

          <div className="notificaciones-list">
            {loading ? (
              <p className="text-center">Cargando...</p>
            ) : consultasMostradas.length === 0 ? (
              <p className="text-center">
                {filtro === 'no-leidas' 
                  ? 'No hay consultas sin leer' 
                  : 'No hay consultas'}
              </p>
            ) : (
              consultasMostradas.map((consulta) => {
                const esNoLeida = user.rol === 'ADMINISTRADOR' 
                  ? !consulta.leidoPorAdmin 
                  : !consulta.leidoPorUsuario
                return (
                  <div
                    key={consulta.id}
                    className={`notificacion-item ${esNoLeida ? 'no-leida' : 'leida'}`}
                    onClick={() => irAConsulta(consulta.id)}
                  >
                    <div className="notificacion-item-header">
                      <h4>{consulta.asunto}</h4>
                      {esNoLeida && <span className="badge">●</span>}
                    </div>
                    <p className="notificacion-propiedad">
                      {consulta.propiedad?.titulo}
                    </p>
                    {user.rol === 'ADMINISTRADOR' && consulta.usuario && (
                      <p className="notificacion-usuario">
                        De: {consulta.usuario.nombre || consulta.usuario.email}
                      </p>
                    )}
                    <p className="notificacion-fecha">
                      {new Date(consulta.fechaCreacion).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                )
              })
            )}
          </div>

          {consultas.length > 0 && (
            <div className="notificaciones-footer">
              <button
                className="btn-ver-todos"
                onClick={() => {
                  navigate('/consultas-panel')
                  setMostrarPanel(false)
                }}
              >
                Ver todas en detalle
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        .notificaciones-widget {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 9999;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .notificaciones-btn {
          background: #007bff;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 50px;
          cursor: pointer;
          font-weight: 600;
          position: relative;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s;
          box-shadow: 0 4px 12px rgba(0, 123, 255, 0.4);
          font-size: 15px;
        }

        .notificaciones-btn:hover {
          background: #0056b3;
          box-shadow: 0 6px 16px rgba(0, 123, 255, 0.6);
          transform: translateY(-2px);
        }

        .notificaciones-btn:active {
          transform: translateY(0);
        }

        .notificaciones-badge {
          background: #dc3545;
          color: white;
          border-radius: 50%;
          padding: 4px 8px;
          font-size: 12px;
          min-width: 24px;
          text-align: center;
          animation: pulse 2s infinite;
          font-weight: bold;
        }

        @keyframes pulse {
          0%, 100% { 
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.7);
          }
          50% { 
            transform: scale(1.1);
            box-shadow: 0 0 0 8px rgba(220, 53, 69, 0);
          }
        }

        .notificaciones-panel {
          position: absolute;
          bottom: 100%;
          right: 0;
          background: white;
          border: 1px solid #ddd;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
          width: 400px;
          max-height: 600px;
          margin-bottom: 12px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .notificaciones-header {
          padding: 16px;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(to right, #f8f9fa, #fff);
        }

        .notificaciones-header h3 {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
          color: #333;
        }

        .btn-close {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #999;
          padding: 0;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .btn-close:hover {
          color: #333;
          background: #f0f0f0;
        }

        .notificaciones-filtros {
          display: flex;
          padding: 8px;
          border-bottom: 1px solid #eee;
          gap: 8px;
          background: #f8f9fa;
        }

        .filtro-tab {
          flex: 1;
          padding: 8px 12px;
          border: none;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          color: #666;
          transition: all 0.2s;
          border: 1px solid #ddd;
        }

        .filtro-tab:hover {
          border-color: #007bff;
          color: #007bff;
        }

        .filtro-tab.activo {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }

        .notificaciones-list {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
        }

        .notificaciones-list::-webkit-scrollbar {
          width: 6px;
        }

        .notificaciones-list::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }

        .notificaciones-list::-webkit-scrollbar-thumb {
          background: #bbb;
          border-radius: 10px;
        }

        .notificaciones-list::-webkit-scrollbar-thumb:hover {
          background: #888;
        }

        .notificacion-item {
          padding: 12px;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: all 0.2s;
          background: white;
        }

        .notificacion-item:hover {
          background: #f8f9fa;
          border-color: #007bff;
          box-shadow: 0 2px 8px rgba(0, 123, 255, 0.15);
        }

        .notificacion-item.no-leida {
          border-left: 4px solid #dc3545;
          background: #fff8f9;
        }

        .notificacion-item.leida {
          border-left: 4px solid #28a745;
          opacity: 0.8;
        }

        .notificacion-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }

        .notificacion-item-header h4 {
          margin: 0;
          font-size: 13px;
          font-weight: 700;
          color: #333;
          flex: 1;
        }

        .badge {
          color: #dc3545;
          font-size: 16px;
          animation: pulse 2s infinite;
        }

        .notificacion-propiedad {
          margin: 4px 0;
          font-size: 12px;
          color: #666;
          font-weight: 500;
        }

        .notificacion-usuario {
          margin: 2px 0;
          font-size: 11px;
          color: #999;
        }

        .notificacion-fecha {
          margin: 4px 0 0 0;
          font-size: 11px;
          color: #bbb;
        }

        .notificaciones-footer {
          padding: 12px;
          border-top: 1px solid #eee;
          background: #f8f9fa;
        }

        .btn-ver-todos {
          width: 100%;
          padding: 10px;
          background: #28a745;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: background 0.2s;
          font-size: 12px;
        }

        .btn-ver-todos:hover {
          background: #218838;
        }

        .text-center {
          text-align: center;
          padding: 24px;
          color: #999;
          font-size: 12px;
        }

        @media (max-width: 480px) {
          .notificaciones-widget {
            bottom: 16px;
            right: 16px;
          }
          
          .notificaciones-panel {
            width: 90vw;
            max-width: 400px;
          }
        }
      `}</style>
    </div>
  )
}
