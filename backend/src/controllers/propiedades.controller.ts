import { Request, Response } from 'express';
import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../lib/prisma';
import cloudinary from '../lib/cloudinary';
import { TipoPropiedad } from '@prisma/client';

// ── Schemas ───────────────────────────────────────────────────────────────────

const crearPropiedadSchema = z.object({
  titulo: z.string().min(1, 'El título es requerido'),
  descripcionPublica: z.string().min(1, 'La descripción es requerida'),
  descripcionPrivada: z.string().optional(),
  tipo: z.enum(['VENTA', 'ALQUILER', 'OTRO']),
  precio: z.number().positive('El precio debe ser positivo'),
  ubicacion: z.string().min(1, 'La ubicación es requerida'),
  contacto: z.string().min(1, 'El contacto es requerido'),
  imagenBase64: z.string().optional(),
  imagenes: z.array(z.string()).default([]),
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
        imagenes: true,
        fechaPublicacion: true,
        activa: true, // Added 'activa' field
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
    const pagina = parseInt(req.query.pagina as string) || 1;
    const porPagina = parseInt(req.query.porPagina as string) || 10;

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
        imagenes: true,
        fechaPublicacion: true,
        activa: true, // Added 'activa' field
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
            precio: req.user.rol === 'ADMINISTRADOR',
            ubicacion: req.user.rol === 'ADMINISTRADOR',
            contacto: req.user.rol === 'ADMINISTRADOR',
            imagenes: true,
            fechaPublicacion: true,
            activa: true, // Added 'activa' field
          }
        : {
            id: true,
            titulo: true,
            descripcionPublica: true,
            tipo: true,
            imagenes: true,
            fechaPublicacion: true,
            activa: true, // Added 'activa' field
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
    const parsed = crearPropiedadSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { titulo, descripcionPublica, descripcionPrivada, tipo, precio, ubicacion, contacto, imagenBase64, imagenes } = parsed.data;
    const administradorId = req.user!.id;

    console.log('📝 Crear propiedad - Usuario:', {
      userId: administradorId,
      email: req.user?.email,
      rol: req.user?.rol,
      titulo,
    });

    // Verificar que el usuario existe en la BD
    const usuarioExiste = await prisma.usuario.findUnique({
      where: { id: administradorId },
    });

    if (!usuarioExiste) {
      console.error('❌ Usuario no encontrado en BD:', administradorId);
      res.status(401).json({ error: 'Usuario no encontrado. Por favor inicia sesión nuevamente.' });
      return;
    }

    if (usuarioExiste.rol !== 'ADMINISTRADOR') {
      console.error('❌ Usuario no es administrador:', administradorId);
      res.status(403).json({ error: 'Solo los administradores pueden crear propiedades.' });
      return;
    }

    // Procesar imagen base64 con Cloudinary si existe
    let imagenesFinales: string[] = imagenes || [];
    if (imagenBase64) {
      try {
        // Validar que Cloudinary esté configurado
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
          res.status(400).json({ error: 'Cloudinary no está configurado. Contacta al administrador.' });
          return;
        }

        console.log('Subiendo imagen a Cloudinary para:', titulo);
        const uploadResult = await cloudinary.uploader.upload(imagenBase64, {
          folder: 'inmobiliaria/propiedades',
          resource_type: 'auto',
          quality: 'auto',
        });
        imagenesFinales.push(uploadResult.secure_url);
        console.log('Imagen subida exitosamente:', uploadResult.secure_url);
      } catch (uploadError: any) {
        console.error('Error al subir imagen a Cloudinary:', uploadError);
        const errorMessage = uploadError?.message || 'Error desconocido en Cloudinary';
        res.status(400).json({ error: `Error al procesar la imagen: ${errorMessage}` });
        return;
      }
    }

    const propiedad = await prisma.propiedad.create({
      data: {
        titulo,
        descripcionPublica,
        descripcionPrivada,
        tipo,
        precio: new Decimal(precio),
        ubicacion,
        contacto,
        imagenes: imagenesFinales,
        administradorId,
      },
      include: {
        administrador: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    console.log('✅ Propiedad creada:', propiedad.id);
    res.status(201).json(propiedad);
  } catch (error: any) {
    console.error('❌ Error al crear propiedad:', error.message || error);
    res.status(500).json({ error: error?.message || 'Error interno del servidor' });
  }
}

export async function actualizar(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const parsed = actualizarPropiedadSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    // Verificar que la propiedad exista y pertenezca al usuario
    const propiedadExistente = await prisma.propiedad.findUnique({
      where: { id },
    });

    if (!propiedadExistente) {
      res.status(404).json({ error: 'Propiedad no encontrada' });
      return;
    }

    if (propiedadExistente.administradorId !== req.user!.id) {
      res.status(403).json({ error: 'No tienes permiso para actualizar esta propiedad' });
      return;
    }

    const propiedad = await prisma.propiedad.update({
      where: { id },
      data: parsed.data,
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
    console.error('Error al actualizar propiedad:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
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

export async function debugPropiedades(req: Request, res: Response): Promise<void> {
  try {
    const propiedades = await prisma.propiedad.findMany({
      select: {
        id: true,
        titulo: true,
        administrador: {
          select: {
            email: true,
            id: true,
          },
        },
      },
      orderBy: {
        titulo: 'asc',
      },
    });

    res.json(propiedades);
  } catch (error) {
    console.error('Error en debugPropiedades:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
