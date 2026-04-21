import { Request, Response } from 'express'
import { z } from 'zod'
import prisma from '../lib/prisma'

// ── Schema de validación ──────────────────────────────────────────────────────

const propiedadResumenSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  tipo: z.string(),
  ubicacion: z.string().optional(),
  imagenUrl: z.string().optional(),
  precio: z.union([z.number(), z.string()]).optional(),
})

const coleccionSchema = z.array(propiedadResumenSchema).max(500)

// ── GET /usuario/me ───────────────────────────────────────────────────────────

export async function getMe(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'No autenticado' })
    return
  }

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        favoritos: true,
        guardados: true,
      },
    })

    if (!usuario) {
      res.status(404).json({ error: 'Usuario no encontrado' })
      return
    }

    res.json(usuario)
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// ── PUT /usuario/favoritos ────────────────────────────────────────────────────

export async function updateFavoritos(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'No autenticado' })
    return
  }

  const parsed = coleccionSchema.safeParse(req.body.favoritos)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos de favoritos inválidos' })
    return
  }

  try {
    await prisma.usuario.update({
      where: { id: req.user.id },
      data: { favoritos: parsed.data },
    })
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// ── PUT /usuario/guardados ────────────────────────────────────────────────────

export async function updateGuardados(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'No autenticado' })
    return
  }

  const parsed = coleccionSchema.safeParse(req.body.guardados)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos de guardados inválidos' })
    return
  }

  try {
    await prisma.usuario.update({
      where: { id: req.user.id },
      data: { guardados: parsed.data },
    })
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}
