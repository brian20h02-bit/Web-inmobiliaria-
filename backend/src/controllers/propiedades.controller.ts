import { Request, Response } from 'express';
import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../lib/prisma';
import cloudinary from '../lib/cloudinary';
import { TipoPropiedad } from '@prisma/client';

// ── Helpers ───────────────────────────────────────────────────────────────────

// Coerce FormData string values to number; returns null for empty/absent values
function toNum(v: unknown): number | null {
  if (v === '' || v == null || v === 'null' || v === 'undefined') return null
  const n = Number(v)
  return isNaN(n) ? null : n
}

// Upload a file Buffer to Cloudinary
function uploadBuffer(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: 'inmobiliaria/propiedades', resource_type: 'auto', quality: 'auto' },
      (err, result) => {
        if (err || !result) reject(err ?? new Error('Cloudinary upload failed'))
        else resolve(result.secure_url)
      }
    ).end(buffer)
  })
}

// ── Schemas ───────────────────────────────────────────────────────────────────

const crearPropiedadSchema = z.object({
  titulo: z.string().min(1, 'El título es requerido').max(200),
  descripcionPublica: z.string().min(1, 'La descripción es requerida').max(5000),
  descripcionPrivada: z.string().max(5000).optional(),
  tipo: z.enum(['VENTA', 'ALQUILER', 'OTRO']),
  precio: z.number().positive('El precio debe ser positivo').max(1_000_000_000),
  expensas: z.number().nonnegative().max(1_000_000_000).optional().nullable(),
  ubicacion: z.string().min(1, 'La ubicación es requerida').max(300),
  metrosCuadrados: z.number().int().positive().max(100_000).optional().nullable(),
  ambientes: z.number().int().nonnegative().max(100).optional().nullable(),
  banos: z.number().int().nonnegative().max(100).optional().nullable(),
  contacto: z.string().min(1, 'El contacto es requerido').max(200),
  lat: z.number().min(-90).max(90).optional().nullable(),
  lng: z.number().min(-180).max(180).optional().nullable(),
  houseTourUrl: z.string().url('URL de tour inválida').refine(
    (url) => url.startsWith('https://'),
    'Solo se permiten URLs HTTPS'
  ).optional().nullable(),
  existingImagenes: z.array(
    z.string().url().refine(
      (url) => url.startsWith('https://res.cloudinary.com/'),
      'URL de imagen debe ser de Cloudinary'
    )
  ).max(20).default([]),
});

const actualizarPropiedadSchema = crearPropiedadSchema.partial();

// ── Controllers ───────────────────────────────────────────────────────────────

export async function listarDestacadas(_req: Request, res: Response): Promise<void> {
  try {
    const propiedades = await prisma.propiedad.findMany({
      where: {
        destacada: true,
        activa: true,
      },
      select: {
        id: true,
        titulo: true,
        descripcionPublica: true,
        tipo: true,
        precio: true,
        expensas: true,
        ubicacion: true,
        metrosCuadrados: true,
        ambientes: true,
        banos: true,
        imagenes: true,
        fechaPublicacion: true,
        activa: true,
      },
      orderBy: {
        fechaPublicacion: 'desc',
      },
    });

    res.json(propiedades);
  } catch (error) {
    console.error('Error al listar propiedades destacadas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function listar(req: Request, res: Response): Promise<void> {
  try {
    const tipo = (req.query.tipo as string)?.toUpperCase();
    const tipoValido = (['VENTA', 'ALQUILER', 'OTRO'] as const).find(t => t === tipo) as TipoPropiedad | undefined;
    const pagina = Math.max(1, parseInt(req.query.pagina as string) || 1);
    const porPagina = Math.min(Math.max(1, parseInt(req.query.porPagina as string) || 10), 50);

    const propiedades = await prisma.propiedad.findMany({
      where: {
        tipo: tipoValido,
        activa: true,
      },
      select: {
        id: true,
        titulo: true,
        descripcionPublica: true,
        tipo: true,
        precio: true,
        expensas: true,
        ubicacion: true,
        metrosCuadrados: true,
        ambientes: true,
        banos: true,
        imagenes: true,
        fechaPublicacion: true,
        activa: true,
        destacada: true,
      },
      orderBy: {
        fechaPublicacion: 'desc',
      },
      skip: (pagina - 1) * porPagina,
      take: porPagina,
    });

    res.json(propiedades);
  } catch (error) {
    console.error('Error al listar propiedades:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function obtenerDetalle(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const propiedad = await prisma.propiedad.findUnique({
      where: { id },
      select: req.user
        ? {
            id: true,
            titulo: true,
            descripcionPublica: true,
            descripcionPrivada: req.user.rol === 'ADMINISTRADOR',
            tipo: true,
            precio: true,
            expensas: true,
            ubicacion: true,
            metrosCuadrados: true,
            ambientes: true,
            banos: true,
            contacto: req.user.rol === 'ADMINISTRADOR',
            imagenes: true,
            houseTourUrl: true,
            lat: true,
            lng: true,
            fechaPublicacion: true,
            activa: true,
          }
        : {
            id: true,
            titulo: true,
            descripcionPublica: true,
            tipo: true,
            precio: true,
            expensas: true,
            ubicacion: true,
            metrosCuadrados: true,
            ambientes: true,
            banos: true,
            imagenes: true,
            houseTourUrl: true,
            lat: true,
            lng: true,
            fechaPublicacion: true,
            activa: true,
          },
    });

    if (!propiedad || !propiedad.activa) {
      res.status(404).json({ error: 'Propiedad no encontrada' });
      return;
    }

    res.json(propiedad);
  } catch (error) {
    console.error('Error al obtener detalle de propiedad:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function crear(req: Request, res: Response): Promise<void> {
  try {
    const files = (req.files as Express.Multer.File[]) ?? []
    const raw = req.body

    // Coerce FormData string values to proper types before validation
    const bodyParsed = {
      ...raw,
      precio: toNum(raw.precio),
      expensas: toNum(raw.expensas),
      metrosCuadrados: toNum(raw.metrosCuadrados),
      ambientes: toNum(raw.ambientes),
      banos: toNum(raw.banos),
      lat: toNum(raw.lat),
      lng: toNum(raw.lng),
      existingImagenes: raw.existingImagenes == null
        ? []
        : Array.isArray(raw.existingImagenes) ? raw.existingImagenes : [raw.existingImagenes],
    }

    const parsed = crearPropiedadSchema.safeParse(bodyParsed)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message })
      return
    }

    const { titulo, descripcionPublica, descripcionPrivada, tipo, precio, expensas, ubicacion, metrosCuadrados, ambientes, banos, contacto, lat, lng, houseTourUrl } = parsed.data
    const administradorId = req.user!.id

    // Upload new files to Cloudinary
    let imagenesFinales: string[] = []
    if (files.length > 0) {
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        res.status(400).json({ error: 'Cloudinary no está configurado. Contacta al administrador.' })
        return
      }
      try {
        imagenesFinales = await Promise.all(files.map(f => uploadBuffer(f.buffer)))
      } catch (uploadError: any) {
        console.error('Error al subir imagen a Cloudinary:', uploadError)
        res.status(400).json({ error: `Error al procesar la imagen: ${uploadError?.message ?? 'Error desconocido'}` })
        return
      }
    }

    const propiedad = await prisma.propiedad.create({
      data: {
        titulo,
        descripcionPublica,
        descripcionPrivada,
        tipo,
        precio: new Decimal(precio),
        expensas: expensas != null ? new Decimal(expensas) : null,
        ubicacion,
        metrosCuadrados: metrosCuadrados ?? null,
        ambientes: ambientes ?? null,
        banos: banos ?? null,
        contacto,
        imagenes: imagenesFinales,
        houseTourUrl: houseTourUrl ?? null,
        lat: lat ?? null,
        lng: lng ?? null,
        administradorId,
      },
      include: {
        administrador: { select: { id: true, nombre: true } },
      },
    })

    res.status(201).json(propiedad)
  } catch (error: any) {
    console.error('Error al crear propiedad:', error.message || error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export async function actualizar(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params
    const files = (req.files as Express.Multer.File[]) ?? []
    const raw = req.body

    // Coerce FormData string values to proper types before validation
    const bodyParsed = {
      ...raw,
      precio: raw.precio != null && raw.precio !== '' ? toNum(raw.precio) : undefined,
      expensas: toNum(raw.expensas),
      metrosCuadrados: toNum(raw.metrosCuadrados),
      ambientes: toNum(raw.ambientes),
      banos: toNum(raw.banos),
      lat: toNum(raw.lat),
      lng: toNum(raw.lng),
      existingImagenes: raw.existingImagenes == null
        ? []
        : Array.isArray(raw.existingImagenes) ? raw.existingImagenes : [raw.existingImagenes],
    }

    const parsed = actualizarPropiedadSchema.safeParse(bodyParsed)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message })
      return
    }

    // Verificar que la propiedad exista y pertenezca al usuario
    const propiedadExistente = await prisma.propiedad.findUnique({ where: { id } })
    if (!propiedadExistente) {
      res.status(404).json({ error: 'Propiedad no encontrada' })
      return
    }
    if (propiedadExistente.administradorId !== req.user!.id) {
      res.status(403).json({ error: 'No tienes permiso para actualizar esta propiedad' })
      return
    }

    // Upload new files, merge with existing image URLs
    const existingImagenes = parsed.data.existingImagenes ?? []
    let newImageUrls: string[] = []
    if (files.length > 0) {
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        res.status(400).json({ error: 'Cloudinary no está configurado.' })
        return
      }
      try {
        newImageUrls = await Promise.all(files.map(f => uploadBuffer(f.buffer)))
      } catch (uploadError: any) {
        console.error('Error al subir imagen a Cloudinary:', uploadError)
        res.status(400).json({ error: `Error al procesar la imagen: ${uploadError?.message ?? 'Error desconocido'}` })
        return
      }
    }
    const imagenesFinales = [...existingImagenes, ...newImageUrls]

    const { existingImagenes: _ei, precio, expensas, houseTourUrl, ...rest } = parsed.data
    const updateData: Record<string, unknown> = { ...rest, imagenes: imagenesFinales }
    if (precio !== undefined) updateData.precio = new Decimal(precio)
    if (expensas !== undefined) updateData.expensas = expensas !== null ? new Decimal(expensas) : null
    if (houseTourUrl !== undefined) updateData.houseTourUrl = houseTourUrl ?? null

    const propiedad = await prisma.propiedad.update({
      where: { id },
      data: updateData,
      include: {
        administrador: { select: { id: true, nombre: true } },
      },
    })

    res.json(propiedad)
  } catch (error) {
    console.error('Error al actualizar propiedad:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export async function eliminar(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    // Verificar que la propiedad exista y pertenezca al usuario
    const propiedadExistente = await prisma.propiedad.findUnique({
      where: { id },
    });

    if (!propiedadExistente) {
      res.status(404).json({ error: 'Propiedad no encontrada' });
      return;
    }

    if (propiedadExistente.administradorId !== req.user!.id) {
      res.status(403).json({ error: 'No tienes permiso para eliminar esta propiedad' });
      return;
    }

    // Cambiar a inactiva en lugar de eliminar (soft delete)
    await prisma.propiedad.update({
      where: { id },
      data: { activa: false },
    });

    res.json({ message: 'Propiedad eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar propiedad:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function destacar(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    // Verificar que la propiedad exista
    const propiedadExistente = await prisma.propiedad.findUnique({
      where: { id },
    });

    if (!propiedadExistente) {
      res.status(404).json({ error: 'Propiedad no encontrada' });
      return;
    }

    // Toggle destacada
    const propiedad = await prisma.propiedad.update({
      where: { id },
      data: { destacada: !propiedadExistente.destacada },
      include: {
        administrador: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    res.json(propiedad);
  } catch (error) {
    console.error('Error al destacar propiedad:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function registrarVisita(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    // Increment visitas atomically
    await prisma.propiedad.update({
      where: { id },
      data: { visitas: { increment: 1 } },
    });

    // If user is authenticated, update their historial
    if (req.user) {
      const usuario = await prisma.usuario.findUnique({
        where: { id: req.user.id },
        select: { historial: true },
      });

      if (usuario) {
        const historial = (usuario.historial as Array<{ id: string; ts: number }>) || [];
        const filtered = historial.filter((h) => h.id !== id);
        const updated = [{ id, ts: Date.now() }, ...filtered].slice(0, 50);

        await prisma.usuario.update({
          where: { id: req.user.id },
          data: { historial: updated },
        });
      }
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Error al registrar visita:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function obtenerHistorial(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) { res.status(401).json({ error: 'No autenticado' }); return; }

    const usuario = await prisma.usuario.findUnique({
      where: { id: req.user.id },
      select: { historial: true },
    });

    const historial = (usuario?.historial as Array<{ id: string; ts: number }>) || [];
    if (historial.length === 0) { res.json([]); return; }

    const ids = historial.map((h) => h.id);
    const propiedades = await prisma.propiedad.findMany({
      where: { id: { in: ids }, activa: true },
      select: {
        id: true,
        titulo: true,
        descripcionPublica: true,
        tipo: true,
        precio: true,
        ubicacion: true,
        imagenes: true,
        metrosCuadrados: true,
        ambientes: true,
        banos: true,
      },
    });

    // Sort by historial order (most recent first) and include visitadoEn
    const sorted = ids
      .map((id) => {
        const prop = propiedades.find((p) => p.id === id)
        const entry = historial.find((h) => h.id === id)
        if (!prop) return null
        return { ...prop, visitadoEn: entry?.ts ?? null }
      })
      .filter(Boolean);

    res.json(sorted);
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function eliminarDeHistorial(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) { res.status(401).json({ error: 'No autenticado' }); return; }
    const { propId } = req.params;
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.user.id },
      select: { historial: true },
    });
    const historial = (usuario?.historial as Array<{ id: string; ts: number }>) || [];
    const updated = historial.filter((h) => h.id !== propId);
    await prisma.usuario.update({
      where: { id: req.user.id },
      data: { historial: updated },
    });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function limpiarHistorial(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) { res.status(401).json({ error: 'No autenticado' }); return; }
    await prisma.usuario.update({
      where: { id: req.user.id },
      data: { historial: [] },
    });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
