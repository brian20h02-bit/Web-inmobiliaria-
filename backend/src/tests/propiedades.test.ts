/**
 * Tests unitarios y de propiedades para el módulo de propiedades.
 * Valida: Requisitos 4.1 – 4.9, Propiedades 10-15
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import type { Request, Response } from 'express';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../lib/prisma', () => ({
  default: {
    propiedad: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('../lib/cloudinary', () => ({
  default: {
    uploader: {
      upload_stream: vi.fn(),
    },
  },
}));

import prisma from '../lib/prisma';
import {
  obtenerDetalle,
  listar,
  listarDestacadas,
} from '../controllers/propiedades.controller';

// ── Helpers ───────────────────────────────────────────────────────────────────

function mockRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

function mockReq(
  params: Record<string, string> = {},
  query: Record<string, string> = {},
  user?: { id: string; email: string; rol: string }
): Request {
  return { params, query, user, body: {} } as unknown as Request;
}

const propiedadBase = {
  id: 'uuid-prop-1',
  titulo: 'Casa en el centro',
  descripcionPublica: 'Hermosa casa',
  descripcionPrivada: 'Detalles privados',
  tipo: 'VENTA',
  precio: 150000,
  ubicacion: 'Calle Falsa 123',
  contacto: '+54 11 1234-5678',
  imagenes: ['https://res.cloudinary.com/img1.jpg'],
  destacada: false,
  activa: true,
  fechaPublicacion: new Date('2024-01-15'),
  administradorId: 'admin-uuid',
};

// ── Tests unitarios: obtenerDetalle ───────────────────────────────────────────

describe('obtenerDetalle', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('sin token → solo datos públicos (sin precio, ubicacion, contacto)', async () => {
    vi.mocked(prisma.propiedad.findUnique).mockResolvedValue(propiedadBase as never);

    const req = mockReq({ id: 'uuid-prop-1' });
    const res = mockRes();

    await obtenerDetalle(req, res);

    expect(res.json).toHaveBeenCalled();
    const body = vi.mocked(res.json).mock.calls[0][0] as Record<string, unknown>;
    expect(body).toHaveProperty('titulo');
    expect(body).toHaveProperty('descripcionPublica');
    expect(body).not.toHaveProperty('precio');
    expect(body).not.toHaveProperty('ubicacion');
    expect(body).not.toHaveProperty('contacto');
    expect(body).not.toHaveProperty('descripcionPrivada');
  });

  it('con token válido → datos completos incluyendo precio, ubicacion, contacto', async () => {
    vi.mocked(prisma.propiedad.findUnique).mockResolvedValue(propiedadBase as never);

    const req = mockReq(
      { id: 'uuid-prop-1' },
      {},
      { id: 'user-1', email: 'user@example.com', rol: 'USUARIO' }
    );
    const res = mockRes();

    await obtenerDetalle(req, res);

    expect(res.json).toHaveBeenCalled();
    const body = vi.mocked(res.json).mock.calls[0][0] as Record<string, unknown>;
    expect(body).toHaveProperty('precio');
    expect(body).toHaveProperty('ubicacion');
    expect(body).toHaveProperty('contacto');
    expect(body).toHaveProperty('descripcionPrivada');
  });

  it('propiedad inexistente → 404', async () => {
    vi.mocked(prisma.propiedad.findUnique).mockResolvedValue(null);

    const req = mockReq({ id: 'no-existe' });
    const res = mockRes();

    await obtenerDetalle(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('propiedad inactiva → 403', async () => {
    vi.mocked(prisma.propiedad.findUnique).mockResolvedValue({ ...propiedadBase, activa: false } as never);

    const req = mockReq({ id: 'uuid-prop-1' });
    const res = mockRes();

    await obtenerDetalle(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});

// ── Tests unitarios: listar ───────────────────────────────────────────────────

describe('listar', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('filtro por tipo → solo propiedades del tipo solicitado', async () => {
    const propVenta = { ...propiedadBase, tipo: 'VENTA' };
    vi.mocked(prisma.propiedad.findMany).mockResolvedValue([propVenta] as never);

    const req = mockReq({}, { tipo: 'VENTA' });
    const res = mockRes();

    await listar(req, res);

    expect(prisma.propiedad.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tipo: 'VENTA' }) })
    );
    const body = vi.mocked(res.json).mock.calls[0][0] as Record<string, unknown>[];
    expect(body.every((p) => p.tipo === 'VENTA')).toBe(true);
  });

  it('paginación → máximo porPagina resultados', async () => {
    const props = Array.from({ length: 5 }, (_, i) => ({ ...propiedadBase, id: `id-${i}` }));
    vi.mocked(prisma.propiedad.findMany).mockResolvedValue(props as never);

    const req = mockReq({}, { porPagina: '5' });
    const res = mockRes();

    await listar(req, res);

    expect(prisma.propiedad.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5 })
    );
  });
});

// ── Property tests ────────────────────────────────────────────────────────────

describe('Property tests de propiedades', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  /**
   * Propiedad 10: Listado público nunca expone datos sensibles
   * Validates: Requisitos 4.1, 4.3, 4.4
   */
  it('Propiedad 10: listado público nunca expone precio, ubicacion, contacto', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.uuid(),
            titulo: fc.string({ minLength: 1 }),
            descripcionPublica: fc.string({ minLength: 1 }),
            tipo: fc.constantFrom('VENTA', 'ALQUILER', 'OTRO'),
            imagenes: fc.array(fc.webUrl()),
            destacada: fc.boolean(),
            fechaPublicacion: fc.date(),
          }),
          { minLength: 0, maxLength: 10 }
        ),
        async (props) => {
          vi.mocked(prisma.propiedad.findMany).mockResolvedValue(props as never);

          const req = mockReq();
          const res = mockRes();

          await listar(req, res);

          const body = vi.mocked(res.json).mock.calls[0][0] as Record<string, unknown>[];
          for (const p of body) {
            expect(p).not.toHaveProperty('precio');
            expect(p).not.toHaveProperty('ubicacion');
            expect(p).not.toHaveProperty('contacto');
            expect(p).not.toHaveProperty('descripcionPrivada');
          }
          vi.clearAllMocks();
        }
      )
    );
  });

  /**
   * Propiedad 11: Listado solo incluye propiedades activas
   * Validates: Requisito 4.2
   */
  it('Propiedad 11: listar siempre filtra por activa=true', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.uuid(),
            titulo: fc.string({ minLength: 1 }),
            descripcionPublica: fc.string({ minLength: 1 }),
            tipo: fc.constantFrom('VENTA', 'ALQUILER', 'OTRO'),
            imagenes: fc.constant([]),
            destacada: fc.boolean(),
            activa: fc.constant(true),
            fechaPublicacion: fc.date(),
          }),
          { minLength: 0, maxLength: 10 }
        ),
        async (props) => {
          vi.mocked(prisma.propiedad.findMany).mockResolvedValue(props as never);

          const req = mockReq();
          const res = mockRes();

          await listar(req, res);

          // Verifica que la query siempre incluye activa: true
          expect(prisma.propiedad.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: expect.objectContaining({ activa: true }) })
          );
          vi.clearAllMocks();
        }
      )
    );
  });

  /**
   * Propiedad 12: Filtro por tipo retorna solo propiedades del tipo solicitado
   * Validates: Requisito 4.5
   */
  it('Propiedad 12: filtro por tipo siempre pasa el tipo correcto a la query', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('VENTA', 'ALQUILER', 'OTRO'),
        async (tipo) => {
          vi.mocked(prisma.propiedad.findMany).mockResolvedValue([] as never);

          const req = mockReq({}, { tipo });
          const res = mockRes();

          await listar(req, res);

          expect(prisma.propiedad.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: expect.objectContaining({ tipo }) })
          );
          vi.clearAllMocks();
        }
      )
    );
  });

  /**
   * Propiedad 13: Paginación nunca excede el límite configurado
   * Validates: Requisito 4.6
   */
  it('Propiedad 13: paginación nunca excede porPagina', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 50 }),
        async (porPagina) => {
          vi.mocked(prisma.propiedad.findMany).mockResolvedValue([] as never);

          const req = mockReq({}, { porPagina: String(porPagina) });
          const res = mockRes();

          await listar(req, res);

          expect(prisma.propiedad.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ take: porPagina })
          );
          vi.clearAllMocks();
        }
      )
    );
  });

  /**
   * Propiedad 14: Usuario autenticado siempre recibe datos sensibles de propiedad activa
   * Validates: Requisitos 5.1, 5.4
   */
  it('Propiedad 14: usuario autenticado recibe datos sensibles de propiedad activa', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          email: fc.emailAddress(),
          rol: fc.constantFrom('USUARIO', 'ADMINISTRADOR'),
        }),
        async (user) => {
          vi.mocked(prisma.propiedad.findUnique).mockResolvedValue(propiedadBase as never);

          const req = mockReq({ id: propiedadBase.id }, {}, user);
          const res = mockRes();

          await obtenerDetalle(req, res);

          const body = vi.mocked(res.json).mock.calls[0][0] as Record<string, unknown>;
          expect(body).toHaveProperty('precio');
          expect(body).toHaveProperty('ubicacion');
          expect(body).toHaveProperty('contacto');
          vi.clearAllMocks();
        }
      )
    );
  });

  /**
   * Propiedad 15: Carrusel solo muestra propiedades destacadas y activas
   * Validates: Requisito 6.1
   */
  it('Propiedad 15: listarDestacadas siempre filtra por destacada=true y activa=true', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.uuid(),
            titulo: fc.string({ minLength: 1 }),
            descripcionPublica: fc.string({ minLength: 1 }),
            tipo: fc.constantFrom('VENTA', 'ALQUILER', 'OTRO'),
            imagenes: fc.constant([]),
            destacada: fc.constant(true),
            activa: fc.constant(true),
            fechaPublicacion: fc.date(),
          }),
          { minLength: 0, maxLength: 10 }
        ),
        async (props) => {
          vi.mocked(prisma.propiedad.findMany).mockResolvedValue(props as never);

          const req = mockReq();
          const res = mockRes();

          await listarDestacadas(req, res);

          expect(prisma.propiedad.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
              where: expect.objectContaining({ destacada: true, activa: true }),
            })
          );
          vi.clearAllMocks();
        }
      )
    );
  });
});
