/**
 * Tests de integración usando supertest + vitest + mocks de Prisma.
 * Valida flujos completos de la API sin base de datos real.
 *
 * 11.1 - Flujo visitante → registro → login → ver propiedad → crear consulta
 * 11.2 - Flujo admin → login → crear propiedad → marcar destacada → responder consulta
 * 11.3 - Carrusel solo muestra propiedades con destacada=true y activa=true
 * 11.4 - Datos sensibles nunca aparecen en respuestas públicas
 */
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../lib/prisma', () => ({
  default: {
    usuario: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    propiedad: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    consulta: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    mensaje: {
      create: vi.fn(),
    },
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('$2a$12$hashed'),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

// Cloudinary mock para evitar llamadas reales
vi.mock('../lib/cloudinary', () => ({
  default: {
    uploader: {
      upload_stream: vi.fn(),
    },
  },
}));

import prisma from '../lib/prisma';
import app from '../app';

// ── Constantes ────────────────────────────────────────────────────────────────

const JWT_SECRET = 'test-secret';

beforeAll(() => {
  process.env.JWT_SECRET = JWT_SECRET;
});

beforeEach(() => {
  vi.clearAllMocks();
});

function makeToken(payload: { id: string; email: string; rol: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const usuarioFix = {
  id: 'user-uuid-1',
  nombre: 'María López',
  email: 'maria@example.com',
  passwordHash: '$2a$12$hashed',
  rol: 'USUARIO',
  activo: true,
  fechaRegistro: new Date(),
};

const adminFix = {
  id: 'admin-uuid-1',
  nombre: 'Admin Principal',
  email: 'admin@example.com',
  passwordHash: '$2a$12$hashed',
  rol: 'ADMINISTRADOR',
  activo: true,
  fechaRegistro: new Date(),
};

const propiedadFix = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  titulo: 'Casa en el centro',
  descripcionPublica: 'Hermosa casa',
  tipo: 'VENTA',
  precio: 150000,
  ubicacion: 'Calle Falsa 123',
  contacto: '+54 11 1234-5678',
  descripcionPrivada: 'Notas internas',
  imagenes: [],
  destacada: true,
  activa: true,
  fechaPublicacion: new Date(),
  administradorId: 'admin-uuid-1',
};

// Versión pública (sin campos sensibles) — simula lo que Prisma devuelve con select: CAMPOS_PUBLICOS
const propiedadPublicaFix = {
  id: propiedadFix.id,
  titulo: propiedadFix.titulo,
  descripcionPublica: propiedadFix.descripcionPublica,
  tipo: propiedadFix.tipo,
  imagenes: propiedadFix.imagenes,
  destacada: propiedadFix.destacada,
  fechaPublicacion: propiedadFix.fechaPublicacion,
};

const consultaFix = {
  id: 'consulta-uuid-1',
  propiedadId: '550e8400-e29b-41d4-a716-446655440001',
  usuarioId: 'user-uuid-1',
  asunto: 'Consulta sobre precio',
  estado: 'PENDIENTE',
  fechaCreacion: new Date(),
  mensajes: [
    {
      id: 'msg-uuid-1',
      consultaId: 'consulta-uuid-1',
      autorId: 'user-uuid-1',
      contenido: 'Hola, ¿cuál es el precio final?',
      fecha: new Date(),
    },
  ],
};

// ── 11.1 Flujo visitante completo ─────────────────────────────────────────────

describe('11.1 Flujo visitante → registro → login → ver propiedad → crear consulta', () => {
  it('POST /auth/registro → 201 + token', async () => {
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.usuario.create).mockResolvedValue(usuarioFix as never);

    const res = await request(app)
      .post('/auth/registro')
      .send({ nombre: 'María López', email: 'maria@example.com', password: 'Segura123' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.usuario).not.toHaveProperty('passwordHash');
  });

  it('POST /auth/login → 200 + token', async () => {
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue(usuarioFix as never);

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'maria@example.com', password: 'Segura123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('GET /propiedades/:id sin token → 200 solo datos públicos (sin precio, ubicacion, contacto)', async () => {
    vi.mocked(prisma.propiedad.findUnique).mockResolvedValue(propiedadFix as never);

    const res = await request(app).get(`/propiedades/${propiedadFix.id}`);

    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty('precio');
    expect(res.body).not.toHaveProperty('ubicacion');
    expect(res.body).not.toHaveProperty('contacto');
    expect(res.body).toHaveProperty('titulo');
  });

  it('GET /propiedades/:id con token → 200 con datos completos', async () => {
    vi.mocked(prisma.propiedad.findUnique).mockResolvedValue(propiedadFix as never);
    const token = makeToken({ id: usuarioFix.id, email: usuarioFix.email, rol: usuarioFix.rol });

    const res = await request(app)
      .get(`/propiedades/${propiedadFix.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('precio');
    expect(res.body).toHaveProperty('ubicacion');
    expect(res.body).toHaveProperty('contacto');
  });

  it('POST /consultas con token → 201 + consulta con estado PENDIENTE', async () => {
    vi.mocked(prisma.propiedad.findUnique).mockResolvedValue(propiedadFix as never);
    vi.mocked(prisma.consulta.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.consulta.create).mockResolvedValue(consultaFix as never);

    const token = makeToken({ id: usuarioFix.id, email: usuarioFix.email, rol: usuarioFix.rol });

    const res = await request(app)
      .post('/consultas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        propiedadId: propiedadFix.id,
        asunto: 'Consulta sobre precio',
        mensaje: 'Hola, ¿cuál es el precio final?',
      });

    expect(res.status).toBe(201);
    expect(res.body.estado).toBe('PENDIENTE');
  });
});

// ── 11.2 Flujo admin completo ─────────────────────────────────────────────────

describe('11.2 Flujo admin → login → crear propiedad → marcar destacada → responder consulta', () => {
  it('POST /auth/login con admin → 200 + token admin', async () => {
    vi.mocked(prisma.usuario.findUnique).mockResolvedValue(adminFix as never);

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@example.com', password: 'Admin1234' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.usuario.rol).toBe('ADMINISTRADOR');
  });

  it('POST /propiedades con token admin → 201 + propiedad creada', async () => {
    vi.mocked(prisma.propiedad.create).mockResolvedValue(propiedadFix as never);
    const token = makeToken({ id: adminFix.id, email: adminFix.email, rol: adminFix.rol });

    const res = await request(app)
      .post('/propiedades')
      .set('Authorization', `Bearer ${token}`)
      .send({
        titulo: 'Casa en el centro',
        descripcionPublica: 'Hermosa casa',
        tipo: 'VENTA',
        precio: 150000,
        ubicacion: 'Calle Falsa 123',
        contacto: '+54 11 1234-5678',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
  });

  it('PATCH /propiedades/:id/destacar con token admin → 200 + propiedad con destacada=true', async () => {
    vi.mocked(prisma.propiedad.findUnique).mockResolvedValue(propiedadFix as never);
    vi.mocked(prisma.propiedad.update).mockResolvedValue({ ...propiedadFix, destacada: true } as never);
    const token = makeToken({ id: adminFix.id, email: adminFix.email, rol: adminFix.rol });

    const res = await request(app)
      .patch(`/propiedades/${propiedadFix.id}/destacar`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.destacada).toBe(true);
  });

  it('POST /consultas/:id/respuesta con token admin → 200 + consulta con estado RESPONDIDA', async () => {
    vi.mocked(prisma.consulta.findUnique).mockResolvedValue(consultaFix as never);
    vi.mocked(prisma.mensaje.create).mockResolvedValue({} as never);
    vi.mocked(prisma.consulta.update).mockResolvedValue({
      ...consultaFix,
      estado: 'RESPONDIDA',
      mensajes: [...consultaFix.mensajes, { id: 'msg-uuid-2', contenido: 'Gracias por consultar', autorId: adminFix.id, consultaId: consultaFix.id, fecha: new Date() }],
    } as never);

    const token = makeToken({ id: adminFix.id, email: adminFix.email, rol: adminFix.rol });

    const res = await request(app)
      .post('/consultas/consulta-uuid-1/respuesta')
      .set('Authorization', `Bearer ${token}`)
      .send({ contenido: 'Gracias por consultar' });

    expect(res.status).toBe(200);
    expect(res.body.estado).toBe('RESPONDIDA');
  });
});

// ── 11.3 Carrusel solo muestra destacadas y activas ───────────────────────────

describe('11.3 Carrusel solo muestra propiedades con destacada=true y activa=true', () => {
  it('GET /propiedades/destacadas → query Prisma incluye { destacada: true, activa: true }', async () => {
    vi.mocked(prisma.propiedad.findMany).mockResolvedValue([propiedadPublicaFix] as never);

    await request(app).get('/propiedades/destacadas');

    expect(prisma.propiedad.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ destacada: true, activa: true }),
      })
    );
  });

  it('GET /propiedades/destacadas → respuesta no incluye propiedades con activa=false', async () => {
    // El mock simula que Prisma ya filtró correctamente (solo devuelve activas y destacadas)
    vi.mocked(prisma.propiedad.findMany).mockResolvedValue([propiedadPublicaFix] as never);

    const res = await request(app).get('/propiedades/destacadas');

    expect(res.status).toBe(200);
    // Verificar que la query fue llamada con el filtro correcto
    expect(prisma.propiedad.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ activa: true }),
      })
    );
    // Ningún resultado tiene activa=false
    const propiedades = res.body as Record<string, unknown>[];
    propiedades.forEach((p) => {
      if ('activa' in p) expect(p.activa).not.toBe(false);
    });
  });

  it('GET /propiedades/destacadas → respuesta no incluye propiedades con destacada=false', async () => {
    vi.mocked(prisma.propiedad.findMany).mockResolvedValue([propiedadPublicaFix] as never);

    const res = await request(app).get('/propiedades/destacadas');

    expect(res.status).toBe(200);
    expect(prisma.propiedad.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ destacada: true }),
      })
    );
    const propiedades = res.body as Record<string, unknown>[];
    propiedades.forEach((p) => {
      if ('destacada' in p) expect(p.destacada).not.toBe(false);
    });
  });
});

// ── 11.4 Seguridad: datos sensibles nunca en respuestas públicas ──────────────

describe('11.4 Datos sensibles nunca aparecen en respuestas públicas', () => {
  const CAMPOS_SENSIBLES = ['precio', 'ubicacion', 'contacto', 'descripcionPrivada'];

  it('GET /propiedades sin token → ninguna propiedad tiene datos sensibles', async () => {
    vi.mocked(prisma.propiedad.findMany).mockResolvedValue([propiedadPublicaFix] as never);

    const res = await request(app).get('/propiedades');

    expect(res.status).toBe(200);
    const propiedades = res.body as Record<string, unknown>[];
    propiedades.forEach((p) => {
      CAMPOS_SENSIBLES.forEach((campo) => {
        expect(p).not.toHaveProperty(campo);
      });
    });
  });

  it('GET /propiedades/:id sin token → respuesta no tiene datos sensibles', async () => {
    vi.mocked(prisma.propiedad.findUnique).mockResolvedValue(propiedadFix as never);

    const res = await request(app).get(`/propiedades/${propiedadFix.id}`);

    expect(res.status).toBe(200);
    CAMPOS_SENSIBLES.forEach((campo) => {
      expect(res.body).not.toHaveProperty(campo);
    });
  });

  it('GET /propiedades/destacadas → ninguna propiedad tiene datos sensibles', async () => {
    vi.mocked(prisma.propiedad.findMany).mockResolvedValue([propiedadPublicaFix] as never);

    const res = await request(app).get('/propiedades/destacadas');

    expect(res.status).toBe(200);
    const propiedades = res.body as Record<string, unknown>[];
    propiedades.forEach((p) => {
      CAMPOS_SENSIBLES.forEach((campo) => {
        expect(p).not.toHaveProperty(campo);
      });
    });
  });
});
