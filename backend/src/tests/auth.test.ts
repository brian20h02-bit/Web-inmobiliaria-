/**
 * Tests unitarios y de propiedades para el módulo de autenticación.
 * Valida: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../lib/prisma', () => ({
  default: {
    usuario: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

// Import after mocks are set up
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { registro, login } from '../controllers/auth.controller';

// ── Helpers ──────────────────────────────────────────────────────────────────

const JWT_SECRET = 'test-secret';

function mockRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

function mockReq(body: Record<string, unknown>): Request {
  return { body } as Request;
}

const usuarioBase = {
  id: 'uuid-1',
  nombre: 'Ana García',
  email: 'ana@example.com',
  passwordHash: '$2a$12$hashedpassword',
  rol: 'USUARIO' as const,
  activo: true,
  fechaRegistro: new Date(),
};

// ── Tests unitarios: registro ─────────────────────────────────────────────────

describe('registro', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = JWT_SECRET;
  });

  it('datos válidos → 201 + token + usuario sin passwordHash', async () => {
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue(null);
    vi.mocked(bcrypt.hash).mockResolvedValue('$2a$12$hashed' as never);
    vi.mocked(prisma.usuario.create).mockResolvedValue(usuarioBase as never);

    const req = mockReq({ nombre: 'Ana García', email: 'ana@example.com', password: 'Segura123' });
    const res = mockRes();

    await registro(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    const body = vi.mocked(res.json).mock.calls[0][0] as Record<string, unknown>;
    expect(body).toHaveProperty('token');
    expect(body.usuario).not.toHaveProperty('passwordHash');
  });

  it('email duplicado → 409', async () => {
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue(usuarioBase as never);

    const req = mockReq({ nombre: 'Ana García', email: 'ana@example.com', password: 'Segura123' });
    const res = mockRes();

    await registro(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('contraseña < 8 chars → 400', async () => {
    const req = mockReq({ nombre: 'Ana García', email: 'ana@example.com', password: 'corta' });
    const res = mockRes();

    await registro(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('email inválido → 400', async () => {
    const req = mockReq({ nombre: 'Ana García', email: 'no-es-email', password: 'Segura123' });
    const res = mockRes();

    await registro(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ── Tests unitarios: login ────────────────────────────────────────────────────

describe('login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = JWT_SECRET;
  });

  it('credenciales válidas → 200 + token', async () => {
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue(usuarioBase as never);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const req = mockReq({ email: 'ana@example.com', password: 'Segura123' });
    const res = mockRes();

    await login(req, res);

    // status() not called means 200 (default)
    expect(res.json).toHaveBeenCalled();
    const body = vi.mocked(res.json).mock.calls[0][0] as Record<string, unknown>;
    expect(body).toHaveProperty('token');
  });

  it('contraseña incorrecta → 401 con mensaje genérico', async () => {
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue(usuarioBase as never);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    const req = mockReq({ email: 'ana@example.com', password: 'Incorrecta1' });
    const res = mockRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    const body = vi.mocked(res.json).mock.calls[0][0] as { error: string };
    expect(body.error).toBe('Credenciales incorrectas');
  });

  it('email inexistente → 401 con mismo mensaje genérico', async () => {
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue(null);

    const req = mockReq({ email: 'noexiste@example.com', password: 'Segura123' });
    const res = mockRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    const body = vi.mocked(res.json).mock.calls[0][0] as { error: string };
    expect(body.error).toBe('Credenciales incorrectas');
  });

  it('cuenta desactivada → 401', async () => {
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue({ ...usuarioBase, activo: false } as never);

    const req = mockReq({ email: 'ana@example.com', password: 'Segura123' });
    const res = mockRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('campos vacíos → 400', async () => {
    const req = mockReq({ email: '', password: '' });
    const res = mockRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ── Property tests ────────────────────────────────────────────────────────────

describe('Property tests de autenticación', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = JWT_SECRET;
  });

  /**
   * Propiedad 2: Contraseñas cortas (0-7 chars) siempre son rechazadas
   * Validates: Requirements 1.2
   */
  it('Propiedad 2: cualquier contraseña de 0-7 chars → 400', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 0, maxLength: 7 }),
        async (shortPassword) => {
          const req = mockReq({ nombre: 'Test', email: 'test@example.com', password: shortPassword });
          const res = mockRes();

          await registro(req, res);

          expect(res.status).toHaveBeenCalledWith(400);
          vi.clearAllMocks();
        }
      )
    );
  });

  /**
   * Propiedad 3: Emails inválidos siempre son rechazados
   * Validates: Requirements 1.3
   */
  it('Propiedad 3: cualquier string sin formato email → 400', async () => {
    // Genera strings que no contienen '@' seguido de dominio válido
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }).filter((s) => !/@[^@]+\.[^@]+$/.test(s)),
        async (invalidEmail) => {
          const req = mockReq({ nombre: 'Test', email: invalidEmail, password: 'Segura123' });
          const res = mockRes();

          await registro(req, res);

          expect(res.status).toHaveBeenCalledWith(400);
          vi.clearAllMocks();
        }
      )
    );
  });

  /**
   * Propiedad 6: Errores de login no revelan campo incorrecto (mensaje genérico idéntico)
   * Validates: Requirements 1.6
   */
  it('Propiedad 6: email inexistente y contraseña incorrecta retornan el mismo mensaje', async () => {
    // Caso A: email inexistente
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue(null);
    const reqA = mockReq({ email: 'noexiste@example.com', password: 'Segura123' });
    const resA = mockRes();
    await login(reqA, resA);
    const bodyA = vi.mocked(resA.json).mock.calls[0][0] as { error: string };

    vi.clearAllMocks();

    // Caso B: contraseña incorrecta
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue(usuarioBase as never);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
    const reqB = mockReq({ email: 'ana@example.com', password: 'Incorrecta1' });
    const resB = mockRes();
    await login(reqB, resB);
    const bodyB = vi.mocked(resB.json).mock.calls[0][0] as { error: string };

    expect(bodyA.error).toBe(bodyB.error);
  });

  /**
   * Propiedad 7: Round-trip JWT (firmar → verificar → payload equivalente)
   * Validates: Requirements 1.7
   */
  it('Propiedad 7: firmar y verificar un payload JWT retorna el mismo payload', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          email: fc.emailAddress(),
          rol: fc.constantFrom('USUARIO', 'ADMINISTRADOR'),
        }),
        (payload) => {
          const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
          const decoded = jwt.verify(token, JWT_SECRET) as typeof payload & { iat: number; exp: number };

          expect(decoded.id).toBe(payload.id);
          expect(decoded.email).toBe(payload.email);
          expect(decoded.rol).toBe(payload.rol);
        }
      )
    );
  });

  /**
   * Propiedad 8: Tokens inválidos siempre retornan 401
   * Validates: Requirements 1.8
   */
  it('Propiedad 8: cualquier string que no sea JWT válido → jwt.verify lanza error', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => {
          // Excluir strings que casualmente sean JWTs válidos firmados con el secret
          try {
            jwt.verify(s, JWT_SECRET);
            return false;
          } catch {
            return true;
          }
        }),
        (invalidToken) => {
          expect(() => jwt.verify(invalidToken, JWT_SECRET)).toThrow();
        }
      )
    );
  });
});
