import { useChat } from '../context/ChatContext'
import { useAuth } from '../context/AuthContext'
import ChatWindow from './ChatWindow'
import '../styles/chat.css'

interface ConversationsListProps {
  onClose: () => void
}

export default function ConversationsList({ onClose }: ConversationsListProps) {
  const { conversaciones, conversacionActual, abrirConversacion, crearConversacionGeneral, isLoading } = useChat()
  const { user } = useAuth()

  if (conversacionActual) {
    return (
      <ChatWindow
        conversacion={conversacionActual}
        onBack={() => abrirConversacion('')}
        onClose={onClose}
      />
    )
  }

  return (
    <div className="conversations-panel">
      <div className="conversations-header">
        <h2>Mensajes</h2>
        <button className="btn-close-chat" onClick={onClose} aria-label="Cerrar">✕</button>
      </div>

      {user?.rol === 'USUARIO' && (
        <div className="conversations-actions">
          <button className="btn-new-chat" onClick={crearConversacionGeneral}>
            + Nueva conversación
          </button>
        </div>
      )}

      <div className="conversations-list">
        {isLoading && conversaciones.length === 0 ? (
          <div className="chat-empty-state">Cargando...</div>
        ) : conversaciones.length === 0 ? (
          <div className="chat-empty-state">
            <span className="chat-empty-icon">💬</span>
            <p>No hay conversaciones</p>
            <small>
              {user?.rol === 'USUARIO'
                ? 'Consultá por una propiedad o iniciá una conversación'
                : 'Las conversaciones de clientes aparecerán aquí'}
            </small>
          </div>
        ) : (
          conversaciones.map(conv => {
            const otroUsuario = user?.rol === 'ADMINISTRADOR' ? conv.usuario : conv.admin
            const ultimoMsg = conv.ultimoMensaje
            const timestamp = ultimoMsg ? new Date(ultimoMsg.fecha) : new Date(conv.fechaCreacion)
            const hora = timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
            const dia = timestamp.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })

            return (
              <div
                key={conv.id}
                className={`conversation-item ${conv.noLeidos > 0 ? 'unread' : ''}`}
                onClick={() => abrirConversacion(conv.id)}
              >
                <div className="conversation-avatar">
                  <span>{otroUsuario?.nombre?.[0]?.toUpperCase() || '?'}</span>
                </div>

                <div className="conversation-content">
                  <div className="conversation-header-item">
                    <span className="conversation-name">
                      {otroUsuario?.nombre || otroUsuario?.email || 'Usuario'}
                    </span>
                    <span className="conversation-time">{dia} {hora}</span>
                  </div>
                  {conv.propiedad && (
                    <p className="conversation-property">
                      🏠 {conv.propiedad.titulo}
                    </p>
                  )}
                  <p className="conversation-preview">
                    {ultimoMsg?.contenido || 'Sin mensajes aún'}
                  </p>
                </div>

                {conv.noLeidos > 0 && (
                  <div className="unread-badge">{conv.noLeidos}</div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
