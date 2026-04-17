import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'

interface Consulta {
  id: string
  asunto: string
  estado: string
  leidoPorAdmin: boolean
  leidoPorUsuario: boolean
  fechaCreacion: string
  usuario?: { nombre: string; email: string }
  propiedad?: { id: string; titulo: string }
  mensajes?: Array<{ id: string; contenido: string; fecha: string; leidoPorAdmin: boolean }>
}

export default function ConsultasPanel() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [noLeidasCount, setNoLeidasCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [filtro, setFiltro] = useState<'todas' | 'no-leidas'>('todas')
  
  const propiedadFiltro = searchParams.get('propiedad')

  useEffect(() => {
    cargarConsultas()
    
    // Polling cada 3 segundos
    const interval = setInterval(cargarConsultas, 3000)
    
    // Eventos para recargar
    const handleFocus = () => cargarConsultas()
    const handleConsultaLeida = () => cargarConsultas()
    window.addEventListener('focus', handleFocus)
    window.addEventListener('consultaLeida', handleConsultaLeida)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('consultaLeida', handleConsultaLeida)
    }
  }, [user, propiedadFiltro])

  async function cargarConsultas() {
    if (!user) return

    setLoading(true)
    try {
      const response = await api.get('/consultas/mis-notificaciones')
      let todasLasConsultas = response.data.consultas || []

      // Mapear mensajes
      let consultasConMensajes = todasLasConsultas.map((consulta: Consulta) => ({
        ...consulta,
        mensajes: consulta.mensajes || [],
      }))

      // Filtrar por propiedad si se proporciona parámetro
      if (propiedadFiltro) {
        consultasConMensajes = consultasConMensajes.filter((c: Consulta) => c.propiedad?.id === propiedadFiltro)
      }

      setConsultas(consultasConMensajes)
      setNoLeidasCount(response.data.noLeidasCount || 0)
    } catch (error) {
      console.error('[ConsultasPanel] Error:', error)
      setConsultas([])
      setNoLeidasCount(0)
    } finally {
      setLoading(false)
    }
  }

  async function handleConsultaClick(consultaId: string) {
    if (user?.rol === 'USUARIO') {
      try {
        await api.put(`/consultas/${consultaId}/leer`)
        await cargarConsultas()
        window.dispatchEvent(new Event('consultaLeida'))
      } catch (error) {
        console.error('[ConsultasPanel] Error al marcar como leída:', error)
      }
    }
    navigate(`/consultas/${consultaId}`)
  }

  const consultasFiltradas = filtro === 'no-leidas'
    ? consultas.filter(c => {
        const esAdmin = user?.rol === 'ADMINISTRADOR'
        return esAdmin ? !c.leidoPorAdmin : !c.leidoPorUsuario
      })
    : consultas

  return (
    <div className="consultas-panel-container">
      <div className="consultas-panel-header">
        <button className="btn-volver" onClick={() => navigate('/')}>
          ← Volver
        </button>
        <h1>{user?.rol === 'ADMINISTRADOR' ? 'Consultas de Clientes' : 'Mis Consultas'}</h1>
        <div className="filtros">
          <button
            className={`filtro-btn ${filtro === 'todas' ? 'activo' : ''}`}
            onClick={() => setFiltro('todas')}
          >
            Todas ({consultas.length})
          </button>
          <button
            className={`filtro-btn ${filtro === 'no-leidas' ? 'activo' : ''}`}
            onClick={() => setFiltro('no-leidas')}
          >
            {user?.rol === 'ADMINISTRADOR' ? 'Sin leer' : 'Sin responder'} ({noLeidasCount})
          </button>
        </div>
      </div>

      <div className="consultas-panel-content">
        {loading ? (
          <p className="cargando">Cargando consultas...</p>
        ) : consultasFiltradas.length === 0 ? (
          <p className="sin-consultas">
            {filtro === 'no-leidas' 
              ? (user?.rol === 'ADMINISTRADOR' ? 'No hay consultas sin leer' : 'No hay consultas sin responder')
              : 'No hay consultas'
            }
          </p>
        ) : (
          <div className="consultas-grid">
            {consultasFiltradas.map((c) => {
              const esNoLeida = user?.rol === 'ADMINISTRADOR' ? !c.leidoPorAdmin : !c.leidoPorUsuario
              return (
                <div
                  key={c.id}
                  className={`consulta-card ${esNoLeida ? 'no-leida' : 'leida'}`}
                  onClick={() => handleConsultaClick(c.id)}
                >
                  <div className="consulta-card-header">
                    <h3>{c.asunto}</h3>
                    {esNoLeida && <span className="badge-no-leida">●</span>}
                  </div>
                  
                  <div className="consulta-card-body">
                    <div className="campo">
                      <span className="label">
                        {user?.rol === 'ADMINISTRADOR' ? 'Cliente:' : 'Estado:'}
                      </span>
                      <span className="valor">
                        {user?.rol === 'ADMINISTRADOR' 
                          ? c.usuario?.nombre ?? c.usuario?.email
                          : <span className={`estado estado-${c.estado.toLowerCase()}`}>{c.estado}</span>
                        }
                      </span>
                    </div>
                    
                    <div className="campo">
                      <span className="label">Propiedad:</span>
                      <span className="valor">{c.propiedad?.titulo}</span>
                    </div>
                    
                    <div className="campo">
                      <span className="label">Fecha:</span>
                      <span className="valor">
                        {new Date(c.fechaCreacion).toLocaleDateString('es-AR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    
                    {c.mensajes && c.mensajes.length > 0 && (
                      <div className="campo mensaje-preview">
                        <span className="label">Último mensaje:</span>
                        <p className="valor">"{c.mensajes[c.mensajes.length - 1].contenido.substring(0, 100)}{c.mensajes[c.mensajes.length - 1].contenido.length > 100 ? '...' : ''}"</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="consulta-card-footer">
                    <button className="btn-ver-detalles">Ver detalles →</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <style>{`
        .consultas-panel-container {
          padding: 24px;
          background: linear-gradient(to bottom, #E8D4BE, #F2E0D0);
          min-height: 100vh;
        }

        .consultas-panel-header {
          margin-bottom: 32px;
        }

        .btn-volver {
          background: none;
          border: none;
          color: #6E88B0;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          padding: 8px 0;
          margin-bottom: 16px;
          transition: color 0.2s;
        }

        .btn-volver:hover {
          color: #4A5F85;
        }

        .consultas-panel-header h1 {
          font-size: 28px;
          font-weight: 700;
          color: #333;
          margin: 0 0 20px 0;
        }

        .filtros {
          display: flex;
          gap: 12px;
        }

        .filtro-btn {
          padding: 8px 16px;
          border: 2px solid #ddd;
          border-radius: 6px;
          background: #F2E0D0;
          cursor: pointer;
          font-weight: 500;
          font-size: 13px;
          transition: all 0.2s;
          color: #666;
        }

        .filtro-btn:hover {
          border-color: #6E88B0;
          color: #6E88B0;
        }

        .filtro-btn.activo {
          background: #6E88B0;
          border-color: #6E88B0;
          color: #F2E0D0;
        }

        .consultas-panel-content {
          display: flex;
          flex-direction: column;
        }

        .cargando, .sin-consultas {
          text-align: center;
          padding: 40px;
          color: #999;
          font-size: 14px;
        }

        .consultas-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 20px;
        }

        .consulta-card {
          background: #F2E0D0;
          border: 2px solid #e9ecef;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          flex-direction: column;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }

        .consulta-card:hover {
          border-color: #6E88B0;
          box-shadow: 0 4px 16px rgba(110, 136, 176, 0.15);
          transform: translateY(-2px);
        }

        .consulta-card.no-leida {
          border-left: 4px solid #dc3545;
          background: #fff8f9;
        }

        .consulta-card.leida {
          border-left: 4px solid #28a745;
          opacity: 0.85;
        }

        .consulta-card-header {
          padding: 16px;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }

        .consulta-card-header h3 {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
          color: #333;
          flex: 1;
        }

        .badge-no-leida {
          color: #dc3545;
          font-size: 24px;
          line-height: 1;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        .consulta-card-body {
          padding: 16px;
          flex: 1;
        }

        .campo {
          margin-bottom: 12px;
          display: flex;
          flex-direction: column;
        }

        .campo:last-child {
          margin-bottom: 0;
        }

        .label {
          font-size: 12px;
          font-weight: 600;
          color: #666;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .valor {
          font-size: 13px;
          color: #333;
          line-height: 1.4;
        }

        .estado {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }

        .estado-pendiente {
          background: #fff3cd;
          color: #856404;
        }

        .estado-respondida {
          background: #d4edda;
          color: #155724;
        }

        .estado-cerrada {
          background: #d6d8db;
          color: #383d41;
        }

        .mensaje-preview {
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid #eee;
        }

        .mensaje-preview .valor {
          font-size: 12px;
          color: #666;
          font-style: italic;
          margin: 0;
          line-height: 1.5;
        }

        .consulta-card-footer {
          padding: 12px 16px;
          background: #E8D4BE;
          border-top: 1px solid #eee;
        }

        .btn-ver-detalles {
          width: 100%;
          padding: 10px;
          background: #6E88B0;
          color: #F2E0D0;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          transition: background 0.2s;
        }

        .btn-ver-detalles:hover {
          background: #4A5F85;
        }

        @media (max-width: 768px) {
          .consultas-grid {
            grid-template-columns: 1fr;
          }

          .consultas-panel-header h1 {
            font-size: 22px;
          }
        }
      `}</style>
    </div>
  )
}
