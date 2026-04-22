import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import api from '../lib/api'
import { useAuth } from './AuthContext'

export interface Usuario {
  id: string
  nombre: string
  email: string
}

export interface PropiedadRef {
  id: string
  titulo: string
  tipo: string
  imagenes: string[]
}

export interface MensajeChat {
  id: string
  conversacionId: string
  emisorId: string
  contenido: string
  leido: boolean
  fecha: string
  emisor: Usuario
}

export interface Conversacion {
  id: string
  usuarioId: string
  adminId: string
  propiedadId?: string | null
  usuario?: Usuario
  admin?: Usuario
  propiedad?: PropiedadRef | null
  mensajes: MensajeChat[]
  noLeidos: number
  ultimoMensaje: MensajeChat | null
  fechaCreacion: string
  fechaActualiza: string
}

interface ChatContextType {
  conversaciones: Conversacion[]
  conversacionActual: Conversacion | null
  noLeidosTotal: number
  chatAbierto: boolean
  abrirChat: () => void
  cerrarChat: () => void
  abrirConversacion: (conversacionId: string) => Promise<void>
  cerrarConversacion: () => void
  enviarMensaje: (conversacionId: string, contenido: string) => Promise<void>
   consultarPropiedad: (propiedadId: string, tituloProp: string, mensajePersonalizado?: string) => Promise<void>
  crearConversacionGeneral: () => Promise<void>
  cargarConversaciones: () => Promise<void>
  cargarNoLeidos: () => Promise<void>
  isLoading: boolean
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([])
  const [conversacionActual, setConversacionActual] = useState<Conversacion | null>(null)
  const [noLeidosTotal, setNoLeidosTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [chatAbierto, setChatAbierto] = useState(false)

  const shouldLoadChat = !!user

  const abrirChat = useCallback(() => setChatAbierto(true), [])
  const cerrarChat = useCallback(() => {
    setChatAbierto(false)
    setConversacionActual(null)
  }, [])

  const cargarConversaciones = useCallback(async () => {
    try {
      const response = await api.get('/chat/conversaciones')
      setConversaciones(response.data)
    } catch (error) {
      console.error('Error cargando conversaciones:', error)
    }
  }, [])

  const cargarNoLeidos = useCallback(async () => {
    try {
      const response = await api.get('/chat/noLeidos')
      setNoLeidosTotal(response.data.noLeidos)
    } catch (error) {
      console.error('Error cargando no leídos:', error)
    }
  }, [])

  const abrirConversacion = useCallback(async (conversacionId: string) => {
    if (!conversacionId) {
      setConversacionActual(null)
      return
    }
    try {
      setIsLoading(true)
      const response = await api.get(`/chat/conversaciones/${conversacionId}/mensajes`)
      const conversacion = conversaciones.find(c => c.id === conversacionId)
      if (conversacion) {
        setConversacionActual({
          ...conversacion,
          mensajes: response.data,
          noLeidos: 0,
        })
        setConversaciones(prev =>
          prev.map(c => c.id === conversacionId ? { ...c, noLeidos: 0 } : c)
        )
      }
      cargarNoLeidos()
    } catch (error) {
      console.error('Error abriendo conversación:', error)
    } finally {
      setIsLoading(false)
    }
  }, [conversaciones, cargarNoLeidos])

  const cerrarConversacion = useCallback(() => {
    setConversacionActual(null)
  }, [])

  const enviarMensaje = useCallback(async (conversacionId: string, contenido: string) => {
    try {
      const response = await api.post(`/chat/conversaciones/${conversacionId}/mensajes`, { contenido })
      const nuevoMensaje: MensajeChat = response.data

      if (conversacionActual?.id === conversacionId) {
        setConversacionActual(prev =>
          prev ? { ...prev, mensajes: [...prev.mensajes, nuevoMensaje] } : null
        )
      }

      setConversaciones(prev =>
        prev.map(c =>
          c.id === conversacionId
            ? { ...c, ultimoMensaje: nuevoMensaje, fechaActualiza: new Date().toISOString() }
            : c
        )
      )
    } catch (error) {
      console.error('Error enviando mensaje:', error)
      throw error
    }
  }, [conversacionActual])

  // Consultar por una propiedad: crea conversación + mensaje inicial + abre chat
  const consultarPropiedad = useCallback(async (propiedadId: string, tituloProp: string, mensajePersonalizado?: string) => {
    try {
      setIsLoading(true)
      const mensajeInicial = mensajePersonalizado || `Hola, estoy interesado/a en la propiedad: ${tituloProp} (ID: ${propiedadId})`

      const response = await api.post('/chat/conversaciones', {
        propiedadId,
        mensajeInicial,
      })

      const conversacion = response.data as Conversacion

      // Recargar conversaciones para tener la lista actualizada
      await cargarConversaciones()

      // Abrir el chat y la conversación
      setChatAbierto(true)

      // Cargar mensajes de la conversación
      const msgResponse = await api.get(`/chat/conversaciones/${conversacion.id}/mensajes`)
      setConversacionActual({
        ...conversacion,
        mensajes: msgResponse.data,
        noLeidos: 0,
        ultimoMensaje: msgResponse.data[msgResponse.data.length - 1] || null,
      })
    } catch (error) {
      console.error('Error consultando propiedad:', error)
    } finally {
      setIsLoading(false)
    }
  }, [cargarConversaciones])

  // Crear conversación general (sin propiedad)
  const crearConversacionGeneral = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await api.post('/chat/conversaciones', {})
      const conversacion = response.data as Conversacion

      await cargarConversaciones()
      setChatAbierto(true)

      setConversacionActual({
        ...conversacion,
        mensajes: [],
        noLeidos: 0,
        ultimoMensaje: null,
      })
    } catch (error) {
      console.error('Error creando conversación:', error)
    } finally {
      setIsLoading(false)
    }
  }, [cargarConversaciones])

  // Polling
  useEffect(() => {
    if (!shouldLoadChat) return

    cargarConversaciones()
    cargarNoLeidos()

    const interval = setInterval(() => {
      cargarConversaciones()
      cargarNoLeidos()

      // Refrescar mensajes de la conversación activa
      if (conversacionActual) {
        api.get(`/chat/conversaciones/${conversacionActual.id}/mensajes`)
          .then(res => {
            setConversacionActual(prev =>
              prev && prev.id === conversacionActual.id
                ? { ...prev, mensajes: res.data }
                : prev
            )
          })
          .catch(() => {})
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [cargarConversaciones, cargarNoLeidos, shouldLoadChat, conversacionActual?.id])

  const value: ChatContextType = {
    conversaciones,
    conversacionActual,
    noLeidosTotal,
    chatAbierto,
    abrirChat,
    cerrarChat,
    abrirConversacion,
    cerrarConversacion,
    enviarMensaje,
    consultarPropiedad,
    crearConversacionGeneral,
    cargarConversaciones,
    cargarNoLeidos,
    isLoading,
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat debe usarse dentro de ChatProvider')
  }
  return context
}
