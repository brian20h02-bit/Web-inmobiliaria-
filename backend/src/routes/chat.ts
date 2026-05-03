import express, { Request, Response } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import prisma from '../lib/prisma'

const router = express.Router()

interface AuthRequest extends Request {
  user?: { id: string; email: string; rol: string }
}

// GET /conversaciones - Listar conversaciones del usuario
router.get('/conversaciones', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ error: 'No autenticado' })

    const user = await prisma.usuario.findUnique({ where: { id: userId } })
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })

    const esAdmin = user.rol === 'ADMINISTRADOR'

    const conversaciones = await prisma.conversacion.findMany({
      where: esAdmin ? { adminId: userId } : { usuarioId: userId },
      include: {
        usuario: { select: { id: true, nombre: true, email: true } },
        admin: { select: { id: true, nombre: true, email: true } },
        propiedad: { select: { id: true, titulo: true, tipo: true, imagenes: true } },
        mensajes: {
          orderBy: { fecha: 'desc' },
          take: 1,
          include: { emisor: { select: { id: true, nombre: true } } },
        },
      },
      orderBy: { fechaActualiza: 'desc' },
    })

    // Contar no leídos para cada conversación
    const result = await Promise.all(
      conversaciones.map(async (conv) => {
        const noLeidos = await prisma.mensajeChat.count({
          where: {
            conversacionId: conv.id,
            leido: false,
            emisorId: { not: userId },
          },
        })
        return {
          ...conv,
          noLeidos,
          ultimoMensaje: conv.mensajes[0] || null,
        }
      })
    )

    res.json(result)
  } catch (error) {
    console.error('Error al obtener conversaciones:', error)
    res.status(500).json({ error: 'Error al obtener conversaciones' })
  }
})

// GET /conversaciones/:id/mensajes - Obtener mensajes
router.get('/conversaciones/:conversacionId/mensajes', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { conversacionId } = req.params
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ error: 'No autenticado' })

    const conversacion = await prisma.conversacion.findUnique({
      where: { id: conversacionId },
    })
    if (!conversacion) return res.status(404).json({ error: 'Conversación no encontrada' })
    if (conversacion.usuarioId !== userId && conversacion.adminId !== userId) {
      return res.status(403).json({ error: 'No tienes acceso' })
    }

    const mensajes = await prisma.mensajeChat.findMany({
      where: { conversacionId },
      include: { emisor: { select: { id: true, nombre: true, email: true } } },
      orderBy: { fecha: 'asc' },
    })

    // Marcar como leídos
    await prisma.mensajeChat.updateMany({
      where: {
        conversacionId,
        leido: false,
        emisorId: { not: userId },
      },
      data: { leido: true },
    })

    res.json(mensajes)
  } catch (error) {
    console.error('Error al obtener mensajes:', error)
    res.status(500).json({ error: 'Error al obtener mensajes' })
  }
})

// POST /conversaciones/:id/mensajes - Enviar mensaje
router.post('/conversaciones/:conversacionId/mensajes', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { conversacionId } = req.params
    const { contenido } = req.body
    const userId = req.user?.id

    if (!userId) return res.status(401).json({ error: 'No autenticado' })
    if (!contenido?.trim()) return res.status(400).json({ error: 'Mensaje vacío' })
    if (contenido.length > 5000) return res.status(400).json({ error: 'Mensaje demasiado largo (máx. 5000 caracteres)' })

    const conversacion = await prisma.conversacion.findUnique({ where: { id: conversacionId } })
    if (!conversacion) return res.status(404).json({ error: 'Conversación no encontrada' })
    if (conversacion.usuarioId !== userId && conversacion.adminId !== userId) {
      return res.status(403).json({ error: 'No tienes acceso' })
    }

    const mensaje = await prisma.mensajeChat.create({
      data: { conversacionId, emisorId: userId, contenido: contenido.trim() },
      include: { emisor: { select: { id: true, nombre: true, email: true } } },
    })

    await prisma.conversacion.update({
      where: { id: conversacionId },
      data: { fechaActualiza: new Date() },
    })

    res.status(201).json(mensaje)
  } catch (error) {
    console.error('Error al enviar mensaje:', error)
    res.status(500).json({ error: 'Error al enviar mensaje' })
  }
})

// POST /conversaciones - Crear conversación (general o por propiedad)
router.post('/conversaciones', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { propiedadId, mensajeInicial } = req.body

    if (!userId) return res.status(401).json({ error: 'No autenticado' })

    // Validate mensajeInicial if provided
    if (mensajeInicial && mensajeInicial.trim().length > 5000) {
      return res.status(400).json({ error: 'Mensaje inicial demasiado largo (máx. 5000 caracteres)' })
    }

    const user = await prisma.usuario.findUnique({ where: { id: userId } })
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })

    if (user.rol !== 'USUARIO') {
      return res.status(400).json({ error: 'Solo los usuarios pueden iniciar conversaciones' })
    }

    // Buscar un admin disponible
    const admin = await prisma.usuario.findFirst({
      where: { rol: 'ADMINISTRADOR', activo: true },
    })
    if (!admin) return res.status(404).json({ error: 'No hay administradores disponibles' })

    // Verificar propiedad si se proporciona
    let propiedad = null
    if (propiedadId) {
      propiedad = await prisma.propiedad.findUnique({ where: { id: propiedadId } })
      if (!propiedad) return res.status(404).json({ error: 'Propiedad no encontrada' })
    }

    // Buscar conversación existente
    const conversacionExistente = await prisma.conversacion.findFirst({
      where: {
        usuarioId: userId,
        adminId: admin.id,
        propiedadId: propiedadId || null,
      },
      include: {
        usuario: { select: { id: true, nombre: true, email: true } },
        admin: { select: { id: true, nombre: true, email: true } },
        propiedad: { select: { id: true, titulo: true, tipo: true, imagenes: true } },
        mensajes: { orderBy: { fecha: 'desc' }, take: 1 },
      },
    })

    if (conversacionExistente) {
      return res.status(200).json(conversacionExistente)
    }

    // Crear nueva conversación
    const nuevaConversacion = await prisma.conversacion.create({
      data: {
        usuarioId: userId,
        adminId: admin.id,
        propiedadId: propiedadId || null,
      },
      include: {
        usuario: { select: { id: true, nombre: true, email: true } },
        admin: { select: { id: true, nombre: true, email: true } },
        propiedad: { select: { id: true, titulo: true, tipo: true, imagenes: true } },
      },
    })

    // Enviar mensaje inicial automático
    if (mensajeInicial?.trim()) {
      await prisma.mensajeChat.create({
        data: {
          conversacionId: nuevaConversacion.id,
          emisorId: userId,
          contenido: mensajeInicial.trim(),
        },
      })
      await prisma.conversacion.update({
        where: { id: nuevaConversacion.id },
        data: { fechaActualiza: new Date() },
      })
    }

    res.status(201).json(nuevaConversacion)
  } catch (error) {
    console.error('Error al crear conversación:', error)
    res.status(500).json({ error: 'Error al crear conversación' })
  }
})

// GET /noLeidos - Total de mensajes no leídos
router.get('/noLeidos', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ error: 'No autenticado' })

    const total = await prisma.mensajeChat.count({
      where: {
        leido: false,
        emisorId: { not: userId },
        conversacion: {
          OR: [{ usuarioId: userId }, { adminId: userId }],
        },
      },
    })

    res.json({ noLeidos: total })
  } catch (error) {
    console.error('Error al contar no leídos:', error)
    res.status(500).json({ error: 'Error al contar mensajes' })
  }
})

export default router
