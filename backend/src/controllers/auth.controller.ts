import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../lib/prisma';

const registroSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

function signToken(payload: { id: string; email: string; rol: string }): string {
  return jwt.sign(payload, process.env.JWT_SECRET || 'inmobiliaria-secret-key-2024-min-32-chars-ok', { expiresIn: '7d' });
}

export async function registro(req: Request, res: Response): Promise<void> {
  const parsed = registroSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  const { nombre, email, password } = parsed.data;

  try {
    const existing = await prisma.usuario.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'El email ya está registrado' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const usuario = await prisma.usuario.create({
      data: { nombre, email, passwordHash },
    });

    const token = signToken({ id: usuario.id, email: usuario.email, rol: usuario.rol });

    res.status(201).json({
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
    });
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }

  const { email, password } = parsed.data;

  try {
    const usuario = await prisma.usuario.findUnique({ where: { email } });

    if (!usuario || !usuario.activo) {
      res.status(401).json({ error: 'Credenciales incorrectas' });
      return;
    }

    const valid = await bcrypt.compare(password, usuario.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Credenciales incorrectas' });
      return;
    }

    const token = signToken({ id: usuario.id, email: usuario.email, rol: usuario.rol });

    res.json({
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
    });
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
