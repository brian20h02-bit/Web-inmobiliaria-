import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export async function resumen(_req: Request, res: Response): Promise<void> {
  try {
    const [propiedadesActivas, totalUsuarios, consultasPendientes] = await Promise.all([
      prisma.propiedad.count({ where: { activa: true } }),
      prisma.usuario.count(),
      prisma.consulta.count({ where: { estado: 'PENDIENTE' } }),
    ]);

    res.json({ propiedadesActivas, totalUsuarios, consultasPendientes });
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function listarUsuarios(_req: Request, res: Response): Promise<void> {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        fechaRegistro: true,
        activo: true,
      },
    });

    res.json(usuarios);
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
