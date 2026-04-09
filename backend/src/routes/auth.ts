import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { registro, login } from '../controllers/auth.controller';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,
  message: { error: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

router.post('/registro', authLimiter, registro);
router.post('/login', authLimiter, login);

export default router;
