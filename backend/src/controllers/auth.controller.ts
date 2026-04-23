import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { z } from 'zod'
import { OAuth2Client } from 'google-auth-library'
import prisma from '../lib/prisma'
import { sendVerificationEmail } from '../lib/email'

const JWT_SECRET = process.env.JWT_SECRET || 'inmobiliaria-secret-key-2024-min-32-chars-ok'
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID)

// ── Validation schemas ──────────────────────────────────────────────────────

const registroSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'La contraseña debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'La contraseña debe contener al menos una minúscula')
    .regex(/[0-9]/, 'La contraseña debe contener al menos un número')
    .regex(/[^A-Za-z0-9]/, 'La contraseña debe contener al menos un carácter especial'),
})

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
})

const googleAuthSchema = z.object({
  credential: z.string().min(1, 'Token de Google requerido'),
})

// ── Helpers ─────────────────────────────────────────────────────────────────

function signToken(payload: { id: string; email: string; rol: string; nombre: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

function generateVerificationToken(): { token: string; expiry: Date } {
  const token = crypto.randomBytes(32).toString('hex')
  const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 h
  return { token, expiry }
}

// ── POST /auth/registro ──────────────────────────────────────────────────────

export async function registro(req: Request, res: Response): Promise<void> {
  const parsed = registroSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message })
    return
  }

  const { nombre, email, password } = parsed.data

  try {
    const existing = await prisma.usuario.findUnique({ where: { email } })
    if (existing) {
      res.status(409).json({ error: 'El email ya está registrado' })
      return
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const { token: verificationToken, expiry } = generateVerificationToken()

    await prisma.usuario.create({
      data: {
        nombre,
        email,
        passwordHash,
        provider: 'email',
        emailVerified: false,
        verificationToken,
        verificationTokenExpiry: expiry,
      },
    })

    // Fire and forget — don't block the response
    sendVerificationEmail(email, nombre, verificationToken).catch((err) =>
      console.error('Error sending verification email:', err),
    )

    res.status(201).json({
      message: 'Cuenta creada. Revisá tu email para verificar tu cuenta.',
      email,
    })
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// ── POST /auth/login ─────────────────────────────────────────────────────────

export async function login(req: Request, res: Response): Promise<void> {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message })
    return
  }

  const { email, password } = parsed.data

  try {
    const usuario = await prisma.usuario.findUnique({ where: { email } })

    if (!usuario || !usuario.activo) {
      res.status(401).json({ error: 'Credenciales incorrectas' })
      return
    }

    // Users registered via Google have no password
    if (!usuario.passwordHash) {
      res.status(401).json({ error: 'Esta cuenta usa Google para iniciar sesión' })
      return
    }

    const valid = await bcrypt.compare(password, usuario.passwordHash)
    if (!valid) {
      res.status(401).json({ error: 'Credenciales incorrectas' })
      return
    }

    if (!usuario.emailVerified) {
      res.status(403).json({
        error: 'Debes verificar tu email antes de continuar',
        code: 'EMAIL_NOT_VERIFIED',
        email: usuario.email,
      })
      return
    }

    const token = signToken({
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
      nombre: usuario.nombre,
    })

    res.json({
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
    })
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// ── GET /auth/verify-email?token=XYZ ────────────────────────────────────────

export async function verifyEmail(req: Request, res: Response): Promise<void> {
  const { token } = req.query

  if (typeof token !== 'string' || !token) {
    res.status(400).json({ error: 'Token inválido' })
    return
  }

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { verificationToken: token },
    })

    if (!usuario) {
      res.status(400).json({ error: 'Token de verificación inválido o ya utilizado' })
      return
    }

    if (usuario.verificationTokenExpiry && usuario.verificationTokenExpiry < new Date()) {
      res.status(400).json({
        error: 'El link de verificación expiró. Solicitá uno nuevo.',
        code: 'TOKEN_EXPIRED',
        email: usuario.email,
      })
      return
    }

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      },
    })

    // Auto-login after verification
    const jwtToken = signToken({
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
      nombre: usuario.nombre,
    })

    res.json({
      message: '¡Email verificado correctamente! Ya podés ingresar.',
      token: jwtToken,
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
    })
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// ── POST /auth/resend-verification ──────────────────────────────────────────

export async function resendVerification(req: Request, res: Response): Promise<void> {
  const { email } = req.body

  if (typeof email !== 'string' || !email) {
    res.status(400).json({ error: 'Email requerido' })
    return
  }

  // Generic response to prevent user enumeration
  const genericOk = { message: 'Si el email existe, recibirás un nuevo link de verificación.' }

  try {
    const usuario = await prisma.usuario.findUnique({ where: { email } })

    if (!usuario || usuario.emailVerified) {
      res.json(genericOk)
      return
    }

    const { token: verificationToken, expiry } = generateVerificationToken()

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { verificationToken, verificationTokenExpiry: expiry },
    })

    sendVerificationEmail(usuario.email, usuario.nombre, verificationToken).catch((err) =>
      console.error('Error sending verification email:', err),
    )

    res.json(genericOk)
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// ── POST /auth/google ────────────────────────────────────────────────────────

export async function googleAuth(req: Request, res: Response): Promise<void> {
  const parsed = googleAuthSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Token de Google requerido' })
    return
  }

  if (!GOOGLE_CLIENT_ID) {
    res.status(500).json({ error: 'Google OAuth no está configurado en el servidor' })
    return
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: parsed.data.credential,
      audience: GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()
    if (!payload?.email) {
      res.status(400).json({ error: 'No se pudo obtener información de Google' })
      return
    }

    const { sub: googleId, email, name, picture } = payload

    // Find by googleId first, then by email (handles account linking)
    let usuario = await prisma.usuario.findFirst({
      where: { OR: [{ googleId }, { email }] },
    })

    if (!usuario) {
      usuario = await prisma.usuario.create({
        data: {
          nombre: name || email.split('@')[0],
          email,
          googleId,
          foto: picture ?? null,
          provider: 'google',
          emailVerified: true,
          passwordHash: null,
        },
      })
    } else if (!usuario.googleId) {
      // Existing email/password user — link Google account
      usuario = await prisma.usuario.update({
        where: { id: usuario.id },
        data: { googleId, foto: picture ?? null, emailVerified: true },
      })
    }

    if (!usuario.activo) {
      res.status(403).json({ error: 'Cuenta desactivada' })
      return
    }

    const token = signToken({
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
      nombre: usuario.nombre,
    })

    res.json({
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
    })
  } catch (err) {
    console.error('Google auth error:', err)
    res.status(401).json({ error: 'Token de Google inválido' })
  }
}

// ── DELETE /auth/cuenta ──────────────────────────────────────────────────────

export async function deleteAccount(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'No autorizado' })
    return
  }

  const userId = req.user.id

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Mensajes en consultas del usuario
      await tx.mensaje.deleteMany({ where: { consulta: { usuarioId: userId } } })
      // 2. Mensajes escritos por el usuario en cualquier consulta
      await tx.mensaje.deleteMany({ where: { autorId: userId } })
      // 3. Consultas del usuario
      await tx.consulta.deleteMany({ where: { usuarioId: userId } })
      // 4. MensajeChat emitidos por el usuario
      await tx.mensajeChat.deleteMany({ where: { emisorId: userId } })
      // 5. MensajeChat en conversaciones del usuario (emitidos por otros)
      await tx.mensajeChat.deleteMany({
        where: { conversacion: { OR: [{ usuarioId: userId }, { adminId: userId }] } }
      })
      // 6. Conversaciones
      await tx.conversacion.deleteMany({
        where: { OR: [{ usuarioId: userId }, { adminId: userId }] }
      })
      // 7. Propiedades del usuario (si es admin) — primero sus consultas/mensajes
      const props = await tx.propiedad.findMany({ where: { administradorId: userId }, select: { id: true } })
      if (props.length > 0) {
        const propIds = props.map(p => p.id)
        await tx.mensaje.deleteMany({ where: { consulta: { propiedadId: { in: propIds } } } })
        await tx.consulta.deleteMany({ where: { propiedadId: { in: propIds } } })
        await tx.conversacion.deleteMany({ where: { propiedadId: { in: propIds } } })
        await tx.propiedad.deleteMany({ where: { id: { in: propIds } } })
      }
      // 8. El usuario
      await tx.usuario.delete({ where: { id: userId } })
    })
    res.json({ message: 'Cuenta eliminada correctamente' })
  } catch (err) {
    console.error('Error deleting account:', JSON.stringify(err, null, 2))
    res.status(500).json({ error: 'Error al eliminar la cuenta' })
  }
}
