import { useChat } from '../context/ChatContext'
import { useAuth } from '../context/AuthContext'
import ConversationsList from './ConversationsList'
import '../styles/chat.css'

export default function ChatButton() {
  const { noLeidosTotal, chatAbierto, abrirChat, cerrarChat } = useChat()
  const { user } = useAuth()

  if (!user) return null

  return (
    <>
      <button
        className="chat-button"
        onClick={() => chatAbierto ? cerrarChat() : abrirChat()}
        title="Mensajes"
        aria-label="Abrir chat"
      >
        <span className="chat-icon">{chatAbierto ? '✕' : '💬'}</span>
        {!chatAbierto && noLeidosTotal > 0 && (
          <span className="chat-badge">{noLeidosTotal > 99 ? '99+' : noLeidosTotal}</span>
        )}
      </button>

      {chatAbierto && (
        <div className="chat-panel-container">
          <ConversationsList onClose={cerrarChat} />
        </div>
      )}
    </>
  )
}
