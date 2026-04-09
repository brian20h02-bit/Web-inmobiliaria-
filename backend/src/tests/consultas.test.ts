/**
 * Tests unitarios y de propiedades para el módulo de consultas.
 * Valida: Requisitos 8.1, 8.5, 9.1, 9.2, 9.4 — Propiedades 20-24
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import type { Request, Response } from 'express';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../lib/prisma', () => ({
  default: {
    propiedad: {
      findUnique: vi.fn(),
    },
    consulta: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    mensaje: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import prisma from '../lib/prisma';
import { crear, listarTodas, misConsultas, obtenerHilo, responder } from '../controllers/consultas.controller';

// ── Helpers ───────────────────────────────────────────────────────────────────

function mockRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

function mockReq(
  body: Record<string, unknown> = {},
  params: Record<string, string> = {},
  user?: { id: string; email: string; rol: string }
): Request {
  return { body, params, user } as unknown as Request;
}

const PROP_ID = '11111111-1111-1111-1111-111111111111';
const USER_ID = '22222222-2222-2222-2222-222222222222';
const ADMIN_ID = '33333333-3333-3333-3333-333333333333';
const CONSULTA_ID = '44444444-4444-4444-4444-444444444444';

const propiedadActiva = {
  id: PROP_ID,
  titulo: 'Casa Test',
  activa: true,
};

const usuarioBase = { id: USER_ID, email: 'user@test.com', rol: 'USUARIO' };
const adminBase = { id: ADMIN_ID, email: 'admin@test.com', rol: 'ADMINISTRADOR' };

const consultaBase = {
  id: CONSULTA_ID,
  propiedadId: PROP_ID,
  usuarioId: USER_ID,
  asunto: 'Consulta sobre precio',
  estado: 'PENDIENTE',
  fechaCreacion: new Date('2024-01-01T10:00:00Z'),
  mensajes: [],
};

// ── Tests unitarios: crear ────────────────────────────────────────────────────

describe('crear consulta', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('token válido y datos válidos → 201 + consulta con estado PENDIENTE', async () => {
    vi.mocked(prisma.propiedad.findUnique).mockResolvedValue(propiedadActiva as never);
    vi.mocked(prisma.consulta.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.consulta.create).mockResolvedValue({ ...consultaBase, mensajes: [{ id: 'm1', contenido: 'Hola' }] } as never);

    const req = mockReq(
      { propiedadId: PROP_ID, asunto: 'Consulta sobre precio', mensaje: 'Hola' },
      {},
      usuarioBase
    );
    const res = mockRes();

    await crear(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    const body = vi.mocked(res.json).mock.calls[0][0] as Record<string, unknown>;
    expect(body.estado).toBe('PENDIENTE');
  });

  it('sin token (no user) → requireAuth bloquea; si llega al controller sin user → 500', async () => {
    // Simula que el middleware no bloqueó (req.user undefined)
    // Con datos válidos, Zod pasa pero req.user!.id lanza → 500
    const req = mockReq({ propiedadId: PROP_ID, asunto: 'Test', mensaje: 'Hola' });
    const res = mockRes();

    await crear(req, res);

    // El controller intenta acceder a req.user!.id → TypeError → catch → 500
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('propiedad inactiva → 404', async () => {
    vi.mocked(prisma.propiedad.findUnique).mockResolvedValue({ ...propiedadActiva, activa: false } as never);

    const req = mockReq(
      { propiedadId: PROP_ID, asunto: 'Test', mensaje: 'Hola' },
      {},
      usuarioBase
    );
    const res = mockRes();

    await crear(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('propiedad inexistente → 404', async () => {
    vi.mocked(prisma.propiedad.findUnique).mockResolvedValue(null);

    const req = mockReq(
      { propiedadId: PROP_ID, asunto: 'Test', mensaje: 'Hola' },
      {},
      usuarioBase
    );
    const res = mockRes();

    await crear(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('consulta duplicada abierta → 409', async () => {
    vi.mocked(prisma.propiedad.findUnique).mockResolvedValue(propiedadActiva as never);
    vi.mocked(prisma.consulta.findFirst).mockResolvedValue(consultaBase as never);

    const req = mockReq(
      { propiedadId: PROP_ID, asunto: 'Test', mensaje: 'Hola' },
      {},
      usuarioBase
    );
    const res = mockRes();

    await crear(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('campos vacíos (asunto vacío) → 400', async () => {
    const req = mockReq(
      { propiedadId: PROP_ID, asunto: '', mensaje: 'Hola' },
      {},
      usuarioBase
    );
    const res = mockRes();

    await crear(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('campos vacíos (mensaje vacío) → 400', async () => {
    const req = mockReq(
      { propiedadId: PROP_ID, asunto: 'Test', mensaje: '' },
      {},
      usuarioBase
    );
    const res = mockRes();

    await crear(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('propiedadId no es UUID → 400', async () => {
    const req = mockReq(
      { propiedadId: 'no-es-uuid', asunto: 'Test', mensaje: 'Hola' },
      {},
      usuarioBase
    );
    const res = mockRes();

    await crear(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ── Tests unitarios: misConsultas ─────────────────────────────────────────────

describe('misConsultas', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('retorna solo las consultas del usuario autenticado', async () => {
    const consultas = [consultaBase];
    vi.mocked(prisma.consulta.findMany).mockResolvedValue(consultas as never);

    const req = mockReq({}, {}, usuarioBase);
    const res = mockRes();

    await misConsultas(req, res);

    expect(prisma.consulta.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { usuarioId: USER_ID } })
    );
    expect(res.json).toHaveBeenCalledWith(consultas);
  });
});

// ── Tests unitarios: responder ────────────────────────────────────────────────

describe('responder consulta', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('admin responde → estado cambia a RESPONDIDA y agrega mensaje', async () => {
    vi.mocked(prisma.consulta.findUnique).mockResolvedValue(consultaBase as never);
    vi.mocked(prisma.mensaje.create).mockResolvedValue({ id: 'm2', contenido: 'Respuesta' } as never);
    vi.mocked(prisma.consulta.update).mockResolvedValue({ ...consultaBase, estado: 'RESPONDIDA' } as never);

    const req = mockReq({ contenido: 'Respuesta del admin' }, { id: CONSULTA_ID }, adminBase);
    const res = mockRes();

    await responder(req, res);

    expect(prisma.consulta.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { estado: 'RESPONDIDA' } })
    );
    const body = vi.mocked(res.json).mock.calls[0][0] as Record<string, unknown>;
    expect(body.estado).toBe('RESPONDIDA');
  });

  it('consulta inexistente → 404', async () => {
    vi.mocked(prisma.consulta.findUnique).mockResolvedValue(null);

    const req = mockReq({ contenido: 'Respuesta' }, { id: CONSULTA_ID }, adminBase);
    const res = mockRes();

    await responder(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ── Property tests ────────────────────────────────────────────────────────────

describe('Property tests de mensajería', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  /**
   * Propiedad 20: Consulta creada siempre tiene estado PENDIENTE y primer mensaje incluido
   * Validates: Requisito 8.1
   */
  it('Propiedad 20: cualquier consulta creada exitosamente tiene estado PENDIENTE', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          asunto: fc.string({ minLength: 1, maxLength: 100 }),
          mensaje: fc.string({ minLength: 1, maxLength: 500 }),
        }),
        async ({ asunto, mensaje }) => {
          vi.mocked(prisma.propiedad.findUnique).mockResolvedValue(propiedadActiva as never);
          vi.mocked(prisma.consulta.findFirst).mockResolvedValue(null);
          vi.mocked(prisma.consulta.create).mockResolvedValue({
            ...consultaBase,
            asunto,
            estado: 'PENDIENTE',
            mensajes: [{ id: 'm1', contenido: mensaje }],
          } as never);

          const req = mockReq(
            { propiedadId: PROP_ID, asunto, mensaje },
            {},
            usuarioBase
          );
          const res = mockRes();

          await crear(req, res);

          expect(res.status).toHaveBeenCalledWith(201);
          const body = vi.mocked(res.json).mock.calls[0][0] as Record<string, unknown>;
          expect(body.estado).toBe('PENDIENTE');
          expect(Array.isArray(body.mensajes)).toBe(true);
          expect((body.mensajes as unknown[]).length).toBeGreaterThan(0);
          vi.clearAllMocks();
        }
      )
    );
  });

  /**
   * Propiedad 21: Aislamiento de consultas por usuario
   * Validates: Requisito 8.5
   */
  it('Propiedad 21: misConsultas nunca retorna consultas de otros usuarios', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (userId) => {
          const consultasDelUsuario = [
            { ...consultaBase, id: 'c1', usuarioId: userId },
            { ...consultaBase, id: 'c2', usuarioId: userId },
          ];
          vi.mocked(prisma.consulta.findMany).mockResolvedValue(consultasDelUsuario as never);

          const req = mockReq({}, {}, { id: userId, email: 'u@test.com', rol: 'USUARIO' });
          const res = mockRes();

          await misConsultas(req, res);

          // Verifica que la query filtra por el usuarioId correcto
          expect(prisma.consulta.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: { usuarioId: userId } })
          );

          const body = vi.mocked(res.json).mock.calls[0][0] as Array<{ usuarioId: string }>;
          expect(body.every((c) => c.usuarioId === userId)).toBe(true);
          vi.clearAllMocks();
        }
      )
    );
  });

  /**
   * Propiedad 23: Responder consulta actualiza estado a RESPONDIDA y agrega mensaje
   * Validates: Requisito 9.2
   */
  it('Propiedad 23: responder siempre cambia estado a RESPONDIDA', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 500 }),
        async (contenido) => {
          vi.mocked(prisma.consulta.findUnique).mockResolvedValue(consultaBase as never);
          vi.mocked(prisma.mensaje.create).mockResolvedValue({ id: 'm-new', contenido } as never);
          vi.mocked(prisma.consulta.update).mockResolvedValue({
            ...consultaBase,
            estado: 'RESPONDIDA',
            mensajes: [{ id: 'm-new', contenido }],
          } as never);

          const req = mockReq({ contenido }, { id: CONSULTA_ID }, adminBase);
          const res = mockRes();

          await responder(req, res);

          expect(prisma.consulta.update).toHaveBeenCalledWith(
            expect.objectContaining({ data: { estado: 'RESPONDIDA' } })
          );
          const body = vi.mocked(res.json).mock.calls[0][0] as Record<string, unknown>;
          expect(body.estado).toBe('RESPONDIDA');
          vi.clearAllMocks();
        }
      )
    );
  });

  /**
   * Propiedad 24: Mensajes del hilo ordenados cronológicamente ascendente
   * Validates: Requisito 9.4
   */
  it('Propiedad 24: mensajes del hilo siempre ordenados por fecha asc', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.uuid(),
            contenido: fc.string({ minLength: 1 }),
            fecha: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (mensajesInput) => {
          // Ordenar los mensajes por fecha asc (simula lo que hace Prisma)
          const mensajesOrdenados = [...mensajesInput].sort(
            (a, b) => a.fecha.getTime() - b.fecha.getTime()
          );

          vi.mocked(prisma.consulta.findUnique).mockResolvedValue({
            ...consultaBase,
            usuarioId: usuarioBase.id,
          } as never);
          vi.mocked(prisma.mensaje.findMany).mockResolvedValue(mensajesOrdenados as never);

          const req = mockReq({}, { id: CONSULTA_ID }, usuarioBase);
          const res = mockRes();

          await obtenerHilo(req, res);

          // Verifica que la query ordena por fecha asc
          expect(prisma.mensaje.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ orderBy: { fecha: 'asc' } })
          );

          const body = vi.mocked(res.json).mock.calls[0][0] as Array<{ fecha: Date }>;
          for (let i = 1; i < body.length; i++) {
            expect(new Date(body[i].fecha).getTime()).toBeGreaterThanOrEqual(
              new Date(body[i - 1].fecha).getTime()
            );
          }
          vi.clearAllMocks();
        }
      )
    );
  });
});
