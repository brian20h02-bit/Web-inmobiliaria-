/**
 * Tests de integración para el módulo de administración.
 * Valida: Requisitos 6.1, 6.2, 6.3
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../lib/prisma', () => ({
  default: {
    propiedad: {
      count: vi.fn(),
    },
    usuario: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    consulta: {
      count: vi.fn(),
    },
  },
}));

import prisma from '../lib/prisma';
import { resumen, listarUsuarios } from '../controllers/admin.controller';
import { requireAdmin } from '../middleware/auth.middleware';

// ── Helpers ───────────────────────────────────────────────────────────────────

function mockRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

function mockReq(user?: { id: string; email: string; rol: string }): Request {
  return { user } as unknown as Request;
}

// ── Tests: GET /admin/resumen ─────────────────────────────────────────────────

describe('resumen', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('token admin → retorna propiedadesActivas, totalUsuarios, consultasPendientes', async () => {
    vi.mocked(prisma.propiedad.count).mockResolvedValue(10);
    vi.mocked(prisma.usuario.count).mockResolvedValue(5);
    vi.mocked(prisma.consulta.count).mockResolvedValue(3);

    const req = mockReq({ id: 'uuid-1', email: 'admin@example.com', rol: 'ADMINISTRADOR' });
    const res = mockRes();

    await resumen(req, res);

    expect(res.json).toHaveBeenCalledWith({
      propiedadesActivas: 10,
      totalUsuarios: 5,
      consultasPendientes: 3,
    });
  });

  it('usuario normal → requireAdmin retorna 403', () => {
    const req = mockReq({ id: 'uuid-2', email: 'user@example.com', rol: 'USUARIO' });
    const res = mockRes();
    const next = vi.fn();

    requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('sin usuario → requireAdmin retorna 403', () => {
    const req = mockReq(undefined);
    const res = mockRes();
    const next = vi.fn();

    requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});

// ── Tests: GET /admin/usuarios ────────────────────────────────────────────────

describe('listarUsuarios', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('token admin → lista de usuarios sin passwordHash', async () => {
    const usuarios = [
      { id: 'uuid-1', nombre: 'Ana', email: 'ana@example.com', rol: 'USUARIO', fechaRegistro: new Date(), activo: true },
      { id: 'uuid-2', nombre: 'Carlos', email: 'carlos@example.com', rol: 'ADMINISTRADOR', fechaRegistro: new Date(), activo: true },
    ];
    vi.mocked(prisma.usuario.findMany).mockResolvedValue(usuarios as never);

    const req = mockReq({ id: 'uuid-admin', email: 'admin@example.com', rol: 'ADMINISTRADOR' });
    const res = mockRes();

    await listarUsuarios(req, res);

    expect(res.json).toHaveBeenCalled();
    const body = vi.mocked(res.json).mock.calls[0][0] as Record<string, unknown>[];
    expect(Array.isArray(body)).toBe(true);
    for (const u of body) {
      expect(u).not.toHaveProperty('passwordHash');
      expect(u).toHaveProperty('id');
      expect(u).toHaveProperty('nombre');
      expect(u).toHaveProperty('email');
      expect(u).toHaveProperty('rol');
    }
  });

  it('sin token → requireAdmin retorna 403', () => {
    const req = mockReq(undefined);
    const res = mockRes();
    const next = vi.fn();

    requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('usuario normal → requireAdmin retorna 403', () => {
    const req = mockReq({ id: 'uuid-2', email: 'user@example.com', rol: 'USUARIO' });
    const res = mockRes();
    const next = vi.fn();

    requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});

// ── Tests: validación de rol admin en todos los endpoints ─────────────────────

describe('requireAdmin middleware', () => {
  it('rol ADMINISTRADOR → llama next()', () => {
    const req = mockReq({ id: 'uuid-1', email: 'admin@example.com', rol: 'ADMINISTRADOR' });
    const res = mockRes();
    const next = vi.fn();

    requireAdmin(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rol USUARIO → 403', () => {
    const req = mockReq({ id: 'uuid-2', email: 'user@example.com', rol: 'USUARIO' });
    const res = mockRes();
    const next = vi.fn();

    requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('sin usuario (sin token) → 403', () => {
    const req = mockReq(undefined);
    const res = mockRes();
    const next = vi.fn();

    requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
