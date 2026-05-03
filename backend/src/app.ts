import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRouter from './routes/auth';
import propiedadesRouter from './routes/propiedades';
import consultasRouter from './routes/consultas';
import adminRouter from './routes/admin';
import chatRouter from './routes/chat';
import usuarioRouter from './routes/usuario';

const app = express();

// ── HTTPS redirect en producción ──────────────────────────────────────────────
app.use((req: Request, res: Response, next: NextFunction) => {
  if (
    process.env.NODE_ENV === 'production' &&
    req.headers['x-forwarded-proto'] !== 'https'
  ) {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  next();
});

// ── Seguridad ─────────────────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
        scriptSrc: ["'self'"],        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins: string[] = (process.env.CORS_ORIGIN ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Permitir requests sin origin (Postman, llamadas server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`Origin no permitido por CORS: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

// Responder preflight OPTIONS antes que cualquier otro middleware
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

// ── Rate limiting ─────────────────────────────────────────────────────
// Global: 120 req/min por IP sobre todo /api
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { error: 'Demasiadas solicitudes. Intentá en 1 minuto.' },
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api', globalLimiter)

// Auth endpoints sensibles: 15 req / 15 min
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 15,
  message: { error: 'Demasiados intentos. Intentá en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/registro', authLimiter)
app.use('/api/auth/google', authLimiter)
app.use('/api/auth/resend-verification', authLimiter)

// Consultas (formulario de contacto): 20 por hora por IP
const consultasLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: 'Límite de consultas alcanzado. Intentá en 1 hora.' },
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api/consultas', consultasLimiter)

// ── Parsers ───────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

// ── Rutas ─────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/propiedades', propiedadesRouter);
app.use('/api/consultas', consultasRouter);
app.use('/api/admin', adminRouter);
app.use('/api/chat', chatRouter);
app.use('/api/usuario', usuarioRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Recurso no encontrado' });
});

// ── Global error handler (safety net para errores no capturados) ──────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  const message = err instanceof Error ? err.message : 'Error interno del servidor';
  res.status(500).json({ error: message });
});

export default app;
