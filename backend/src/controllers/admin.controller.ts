import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export async function resumen(_req: Request, res: Response): Promise<void> {
  try {
    const [propiedadesActivas, totalUsuarios, consultasPendientes, totalVisitas] = await Promise.all([
      prisma.propiedad.count({ where: { activa: true } }),
      prisma.usuario.count(),
      prisma.consulta.count({ where: { estado: 'PENDIENTE' } }),
      prisma.propiedad.aggregate({ where: { activa: true }, _sum: { visitas: true } }),
    ]);

    res.json({
      propiedadesActivas,
      totalUsuarios,
      consultasPendientes,
      totalVisitas: totalVisitas._sum.visitas ?? 0,
    });
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
      orderBy: { fechaRegistro: 'desc' },
    });

    res.json(usuarios);
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function metricas(_req: Request, res: Response): Promise<void> {
  try {
    const propiedades = await prisma.propiedad.findMany({
      where: { activa: true },
      select: {
        id: true,
        titulo: true,
        tipo: true,
        ubicacion: true,
        imagenes: true,
        visitas: true,
        destacada: true,
      },
      orderBy: { visitas: 'desc' },
    });

    res.json(propiedades);
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
