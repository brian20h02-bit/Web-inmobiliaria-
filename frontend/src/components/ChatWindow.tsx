import { useState, useEffect, useRef } from 'react'
import { useChat, Conversacion } from '../context/ChatContext'
import { useAuth } from '../context/AuthContext'
import '../styles/chat.css'

interface ChatWindowProps {
  conversacion: Conversacion
  onBack: () => void
  onClose: () => void
}

export default function ChatWindow({ conversacion, onBack, onClose }: ChatWindowProps) {
  const { enviarMensaje } = useChat()
  const { user } = useAuth()
  const [mensaje, setMensaje] = useState('')
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const otroUsuario = user?.rol === 'ADMINISTRADOR'
    ? conversacion.usuario
    : conversacion.admin

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversacion.mensajes])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleEnviar = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!mensaje.trim() || isSending) return

    const textoEnviar = mensaje.trim()
    setMensaje('')

    try {
      setIsSending(true)
      await enviarMensaje(conversacion.id, textoEnviar)
    } catch {
      setMensaje(textoEnviar)
    } finally {
      setIsSending(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleEnviar()
    }
  }

  return (
    <div className="chat-window">
      <div className="chat-window-header">
        <button className="btn-back" onClick={onBack} aria-label="Volver">←</button>
        <div className="chat-window-title">
          <h3>{otroUsuario?.nombre || 'Conversación'}</h3>
          <small>{otroUsuario?.email}</small>
        </div>
        <button className="btn-close-window" onClick={onClose} aria-label="Cerrar">✕</button>
      </div>

      {conversacion.propiedad && (
        <div className="chat-property-banner">
          <span className="chat-property-icon">🏠</span>
          <div className="chat-property-info">
            <strong>{conversacion.propiedad.titulo}</strong>
            <small>{conversacion.propiedad.tipo}</small>
          </div>
        </div>
      )}

      <div className="chat-messages">
        {conversacion.mensajes.length === 0 && (
          <div className="chat-empty-messages">
            <p>Envía un mensaje para comenzar la conversación</p>
          </div>
        )}
        {conversacion.mensajes.map(msg => {
          const esDelUsuario = msg.emisorId === user?.id
          return (
            <div key={msg.id} className={`chat-message ${esDelUsuario ? 'sent' : 'received'}`}>
              <div className="message-bubble">
                <p>{msg.contenido}</p>
                <small className="message-time">
                  {new Date(msg.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </small>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleEnviar}>
        <input
          ref={inputRef}
          type="text"
          value={mensaje}
          onChange={e => setMensaje(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe tu mensaje..."
          disabled={isSending}
          className="chat-input"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={isSending || !mensaje.trim()}
          className={`btn-send ${isSending ? 'sending' : ''}`}
        >
          {isSending ? '⏳' : '➤'}
        </button>
      </form>
    </div>
  )
}
