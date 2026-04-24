import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';

const isDev = process.env.NODE_ENV !== 'production'

// ── Schemas ───────────────────────────────────────────────────────────────────

const crearSchema = z.object({
  propiedadId: z.string().uuid('propiedad_id debe ser un UUID válido'),
  asunto: z.string().min(1, 'El asunto es requerido'),
  mensaje: z.string().min(1, 'El mensaje es requerido'),
});

const responderSchema = z.object({
  contenido: z.string().min(1, 'El contenido es requerido'),
});

// ── Controllers ───────────────────────────────────────────────────────────────

export async function crear(req: Request, res: Response): Promise<void> {
  try {
    const parsed = crearSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { propiedadId, asunto, mensaje } = parsed.data;
    const usuarioId = req.user!.id;

    // Verificar que la propiedad exista y esté activa
    const propiedad = await prisma.propiedad.findUnique({ 
      where: { id: propiedadId },
      include: { administrador: { select: { email: true } } }
    });
    if (!propiedad || !propiedad.activa) {
      res.status(404).json({ error: 'Propiedad no encontrada o no disponible' });
      return;
    }

    isDev && console.log(`[crear] Consulta en propiedad "${propiedad.titulo}" (ID:${propiedadId}) | Admin: ${propiedad.administrador.email} | Usuario: ${usuarioId}`);

    // Crear consulta con primer mensaje
    const consulta = await prisma.consulta.create({
      data: {
        propiedadId,
        usuarioId,
        asunto,
        estado: 'PENDIENTE',
        leidoPorAdmin: false, // Admin no la ha leído aún
        leidoPorUsuario: true, // El usuario que la crea ya la conoce
        mensajes: {
          create: {
            autorId: usuarioId,
            contenido: mensaje,
          },
        },
      },
      include: { 
        mensajes: true,
        propiedad: { select: { titulo: true, administrador: { select: { email: true } } } }
      },
    });

    isDev && console.log(`[crear] ✅ Nueva consulta creada ID:${consulta.id} | Usuario:${usuarioId} | Propiedad:${propiedadId} | Admin:${propiedad.administradorId} | Asunto:"${asunto}"`);

    res.status(201).json(consulta);
  } catch (error) {
    console.error('[crear] ❌ Error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function listarTodas(req: Request, res: Response): Promise<void> {
  try {
    const adminId = req.user!.id;
    
    isDev && console.log(`[listarTodas] Admin ${adminId} solicitando sus consultas`)
    
    // Admin ve SOLO las consultas sobre sus propiedades
    const consultas = await prisma.consulta.findMany({
      where: {
        propiedad: {
          administradorId: adminId
        }
      },
      select: {
        id: true,
        asunto: true,
        estado: true,
        leidoPorAdmin: true,
        leidoPorUsuario: true,
        fechaCreacion: true,
        usuario: { select: { id: true, nombre: true, email: true } },
        propiedad: { select: { id: true, titulo: true } },
      },
      orderBy: { fechaCreacion: 'desc' },
    });
    
    isDev && console.log(`[listarTodas] Admin ${adminId} tiene ${consultas.length} consultas`)
    res.json(consultas);
  } catch (error) {
    console.error('[listarTodas] Error:', error)
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function misConsultas(req: Request, res: Response): Promise<void> {
  try {
    const usuarioId = req.user!.id;
    const consultas = await prisma.consulta.findMany({
      where: { usuarioId },
      select: {
        id: true,
        asunto: true,
        estado: true,
        leidoPorAdmin: true,
        leidoPorUsuario: true,
        fechaCreacion: true,
        propiedad: { select: { id: true, titulo: true } },
        mensajes: {
          select: { id: true, contenido: true, fecha: true, autorId: true },
          orderBy: { fecha: 'asc' },
        },
      },
      orderBy: { fechaCreacion: 'desc' },
    });
    res.json(consultas);
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function obtenerDetalle(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const usuarioId = req.user!.id;
    const esAdmin = req.user!.rol === 'ADMINISTRADOR';

    const consulta = await prisma.consulta.findUnique({
      where: { id },
      select: {
        id: true,
        usuarioId: true,
        asunto: true,
        estado: true,
        leidoPorAdmin: true,
        leidoPorUsuario: true,
        fechaCreacion: true,
        usuario: { select: { id: true, nombre: true, email: true } },
        propiedad: { select: { id: true, titulo: true } },
      },
    });

    if (!consulta) {
      res.status(404).json({ error: 'Consulta no encontrada' });
      return;
    }

    if (!esAdmin && consulta.usuarioId !== usuarioId) {
      res.status(403).json({ error: 'Acceso denegado' });
      return;
    }

    res.json(consulta);
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function obtenerHilo(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const usuarioId = req.user!.id;
    const esAdmin = req.user!.rol === 'ADMINISTRADOR';

    const consulta = await prisma.consulta.findUnique({ where: { id } });
    if (!consulta) {
      res.status(404).json({ error: 'Consulta no encontrada' });
      return;
    }

    if (!esAdmin && consulta.usuarioId !== usuarioId) {
      res.status(403).json({ error: 'Acceso denegado' });
      return;
    }

    const mensajes = await prisma.mensaje.findMany({
      where: { consultaId: id },
      include: {
        autor: { select: { nombre: true, email: true } },
      },
      orderBy: { fecha: 'asc' },
    });

    res.json(mensajes);
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function responder(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const parsed = responderSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const consulta = await prisma.consulta.findUnique({ where: { id } });
    if (!consulta) {
      res.status(404).json({ error: 'Consulta no encontrada' });
      return;
    }

    // Verificar que el usuario tenga acceso
    const usuarioId = req.user!.id;
    const esAdmin = req.user!.rol === 'ADMINISTRADOR';
    if (!esAdmin && consulta.usuarioId !== usuarioId) {
      res.status(403).json({ error: 'Acceso denegado' });
      return;
    }

    // Agregar mensaje
    await prisma.mensaje.create({
      data: {
        consultaId: id,
        autorId: usuarioId,
        contenido: parsed.data.contenido,
      },
    });

    // Actualizar estado a RESPONDIDA solo si es admin
    const nuevoEstado = esAdmin ? 'RESPONDIDA' : consulta.estado;
    const updateData: any = { estado: nuevoEstado };
    
    // Marcar como no leída para el usuario si el admin responde
    if (esAdmin) {
      updateData.leidoPorUsuario = false;
      isDev && console.log(`[responder] Admin respondiendo consulta ${id}. Marcando como no leída para usuario.`);
    }
    
    const consultaActualizada = await prisma.consulta.update({
      where: { id },
      data: updateData,
      include: { mensajes: { orderBy: { fecha: 'asc' } } },
    });

    isDev && console.log(`[responder] ✅ Respuesta agregada a consulta ${id} | Estado: ${consultaActualizada.estado}`);

    res.json(consultaActualizada);
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function misNotificaciones(req: Request, res: Response): Promise<void> {
  try {
    const usuarioId = req.user!.id;
    const esAdmin = req.user!.rol === 'ADMINISTRADOR';

    isDev && console.log(`[misNotificaciones] ${esAdmin ? '👨‍💼 ADMIN' : '👤 USUARIO'} ${usuarioId} solicitando notificaciones...`)

    let consultas: any[];

    if (esAdmin) {
      // Admin ve SOLO las consultas sobre sus PROPIAS propiedades
      consultas = await prisma.consulta.findMany({
        where: {
          propiedad: {
            administradorId: usuarioId
          }
        },
        select: {
          id: true,
          asunto: true,
          estado: true,
          leidoPorAdmin: true,
          leidoPorUsuario: true,
          fechaCreacion: true,
          usuario: { select: { id: true, nombre: true, email: true } },
          propiedad: { select: { id: true, titulo: true } },
          mensajes: {
            select: { id: true, contenido: true, fecha: true, autorId: true },
            orderBy: { fecha: 'asc' },
          },
        },
        orderBy: { fechaCreacion: 'desc' },
      });
    } else {
      // Usuario ve sus propias consultas con todos los mensajes
      consultas = await prisma.consulta.findMany({
        where: { usuarioId },
        select: {
          id: true,
          asunto: true,
          estado: true,
          leidoPorAdmin: true,
          leidoPorUsuario: true,
          fechaCreacion: true,
          propiedad: { select: { id: true, titulo: true } },
          mensajes: {
            select: { id: true, contenido: true, fecha: true, autorId: true },
            orderBy: { fecha: 'asc' },
          },
        },
        orderBy: { fechaCreacion: 'desc' },
      });
    }

    // Contar las no leídas
    const noLeidasCount = esAdmin
      ? consultas.filter((c) => !c.leidoPorAdmin).length
      : consultas.filter((c) => !c.leidoPorUsuario).length;

    isDev && console.log(`[misNotificaciones] ${esAdmin ? '👨‍💼' : '👤'} ${usuarioId} tiene ${consultas.length} consultas totales, ${noLeidasCount} sin leer`)
    
    // Log detallado de sin leer
    if (noLeidasCount > 0) {
      const noLeidasDetalle = esAdmin 
        ? consultas.filter(c => !c.leidoPorAdmin).map(c => `"${c.asunto}"`)
        : consultas.filter(c => !c.leidoPorUsuario).map(c => `"${c.asunto}"`)
      isDev && console.log(`   ├─ Sin leer: ${noLeidasDetalle.join(', ')}`)
    }

    res.json({ consultas, noLeidasCount });
  } catch (error) {
    console.error('[misNotificaciones] ❌ Error:', error)
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function obtenerNotificaciones(req: Request, res: Response): Promise<void> {
  try {
    const adminId = req.user!.id;
    
    isDev && console.log(`[obtenerNotificaciones] Admin ${adminId} solicitando notificaciones`)
    
    // Admin ve SOLO las consultas SIN LEER sobre sus propiedades
    const consultas = await prisma.consulta.findMany({
      where: {
        propiedad: {
          administradorId: adminId
        },
        leidoPorAdmin: false
      },
      select: {
        id: true,
        asunto: true,
        estado: true,
        leidoPorAdmin: true,
        leidoPorUsuario: true,
        fechaCreacion: true,
        usuario: { select: { id: true, nombre: true, email: true } },
        propiedad: { select: { id: true, titulo: true } },
      },
      orderBy: { fechaCreacion: 'desc' },
    });

    isDev && console.log(`[obtenerNotificaciones] Admin ${adminId} tiene ${consultas.length} consultas sin leer`)
    res.json({ consultas, noLeidasCount: consultas.length });
  } catch (error) {
    console.error('[obtenerNotificaciones] Error:', error)
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function contarNotificacionesPorPropiedad(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const esAdmin = req.user!.rol === 'ADMINISTRADOR';

    if (esAdmin) {
      // Admin ve conteo de consultas sin leer por propiedad
      const conteosPorPropiedad = await prisma.propiedad.findMany({
        where: { administradorId: userId },
        select: {
          id: true,
          titulo: true,
          _count: {
            select: {
              consultas: {
                where: { leidoPorAdmin: false }
              }
            }
          }
        }
      });

      const resultado = conteosPorPropiedad.map(p => ({
        propiedadId: p.id,
        propiedadTitulo: p.titulo,
        noLeidasCount: p._count.consultas
      }));

      isDev && console.log(`[contarNotificacionesPorPropiedad] Admin ${userId} tiene ${resultado.reduce((sum, p) => sum + p.noLeidasCount, 0)} consultas sin leer`);
      res.json(resultado);
    } else {
      // Usuario ve conteo de respuestas sin leer por propiedad
      const conteosPorPropiedad = await prisma.propiedad.findMany({
        select: {
          id: true,
          titulo: true,
          _count: {
            select: {
              consultas: {
                where: {
                  usuarioId: userId,
                  leidoPorUsuario: false
                }
              }
            }
          }
        }
      });

      const resultado = conteosPorPropiedad
        .filter(p => p._count.consultas > 0)
        .map(p => ({
          propiedadId: p.id,
          propiedadTitulo: p.titulo,
          noLeidasCount: p._count.consultas
        }));

      isDev && console.log(`[contarNotificacionesPorPropiedad] Usuario ${userId} tiene ${resultado.reduce((sum, p) => sum + p.noLeidasCount, 0)} respuestas sin leer`);
      res.json(resultado);
    }
  } catch (error) {
    console.error('[contarNotificacionesPorPropiedad] Error:', error);
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
}

export async function marcarComoLeida(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const esAdmin = req.user!.rol === 'ADMINISTRADOR';

    isDev && console.log(`[marcarComoLeida] ID: ${id}, User: ${userId}, EsAdmin: ${esAdmin}`)

    // Verificar que la consulta existe y obtener datos
    const consulta = await prisma.consulta.findUnique({
      where: { id },
      select: {
        usuarioId: true,
        propiedad: { select: { administradorId: true } }
      }
    });

    if (!consulta) {
      isDev && console.log(`[marcarComoLeida] Consulta ${id} no encontrada`)
      res.status(404).json({ error: 'Consulta no encontrada' });
      return;
    }

    isDev && console.log(`[marcarComoLeida] Consulta encontrada. UsuarioId: ${consulta.usuarioId}, AdminId: ${consulta.propiedad.administradorId}`)

    // Validar permisos
    if (esAdmin) {
      // Admin solo puede marcar sus propias consultas
      if (consulta.propiedad.administradorId !== userId) {
        isDev && console.log(`[marcarComoLeida] Admin ${userId} intenta marcar consulta de admin ${consulta.propiedad.administradorId} - DENEGADO`)
        res.status(403).json({ error: 'No tienes permiso sobre esta consulta' });
        return;
      }
    } else {
      // Usuario solo puede marcar sus propias consultas
      if (consulta.usuarioId !== userId) {
        isDev && console.log(`[marcarComoLeida] Usuario ${userId} intenta marcar consulta de usuario ${consulta.usuarioId} - DENEGADO`)
        res.status(403).json({ error: 'No tienes permiso para realizar esta acción' });
        return;
      }
    }

    isDev && console.log(`[marcarComoLeida] Validación pasada. Marcando como leída...`)

    // Preparar los datos a actualizar
    const updateData: any = {};
    if (esAdmin) {
      updateData.leidoPorAdmin = true;
    } else {
      updateData.leidoPorUsuario = true;
    }

    // Actualizar consulta
    const consultaActualizada = await prisma.consulta.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        asunto: true,
        estado: true,
        leidoPorAdmin: true,
        leidoPorUsuario: true,
        usuarioId: true,
        fechaCreacion: true,
        usuario: { select: { id: true, nombre: true, email: true } },
        propiedad: { select: { id: true, titulo: true } },
      },
    });

    isDev && console.log(`[marcarComoLeida] Consulta ${id} marcada correctamente`)
    res.json(consultaActualizada);
  } catch (error: any) {
    console.error(`[marcarComoLeida] Error:`, error)
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Consulta no encontrada' });
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}
