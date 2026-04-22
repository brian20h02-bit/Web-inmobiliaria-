import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string; rol: string };
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'inmobiliaria-secret-key-2024-min-32-chars-ok') as {
      id: string;
      email: string;
      rol: string;
    };
    req.user = { id: payload.id, email: payload.email, rol: payload.rol };
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
}

// Like authenticate but never rejects — for routes accessible to guests that
// also benefit from knowing who the logged-in user is (e.g. registrar visita).
export function authenticateOptional(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET || 'inmobiliaria-secret-key-2024-min-32-chars-ok') as {
        id: string; email: string; rol: string;
      };
      req.user = { id: payload.id, email: payload.email, rol: payload.rol };
    } catch { /* invalid/expired token — continue as guest */ }
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Autenticación requerida' });
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.rol !== 'ADMINISTRADOR') {
    res.status(403).json({ error: 'Acceso denegado: se requiere rol administrador' });
    return;
  }
  next();
}
