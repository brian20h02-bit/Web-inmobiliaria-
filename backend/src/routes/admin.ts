import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { resumen, listarUsuarios, metricas } from '../controllers/admin.controller';

const router = Router();

router.get('/resumen', authenticate, requireAdmin, resumen);
router.get('/usuarios', authenticate, requireAdmin, listarUsuarios);
router.get('/metricas', authenticate, requireAdmin, metricas);

export default router;
