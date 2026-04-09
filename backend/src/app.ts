import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRouter from './routes/auth';
import propiedadesRouter from './routes/propiedades';
import consultasRouter from './routes/consultas';
import adminRouter from './routes/admin';

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
        scriptSrc: ["'self'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

// ── CORS ──────────────────────────────────────────────────────────────────────
const corsOrigin = process.env.CORS_ORIGIN ?? '*';
app.use(
  cors({
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: corsOrigin !== '*',
  })
);

// ── Parser con límite aumentado para imágenes en base64 ──────────────────────
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ── Rutas ─────────────────────────────────────────────────────────────────────
app.use('/auth', authRouter);
app.use('/propiedades', propiedadesRouter);
app.use('/consultas', consultasRouter);
app.use('/admin', adminRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

export default app;
