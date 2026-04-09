import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import {
  listarDestacadas,
  listar,
  obtenerDetalle,
  crear,
  actualizar,
  eliminar,
  destacar,
  debugPropiedades,
} from '../controllers/propiedades.controller';

const router = Router();

router.get('/debug/propiedades', debugPropiedades);
router.get('/destacadas', listarDestacadas);
router.get('/', listar);
router.get('/:id', obtenerDetalle);
router.post('/', authenticate, requireAdmin, crear);
router.put('/:id', authenticate, requireAdmin, actualizar);
router.delete('/:id', authenticate, requireAdmin, eliminar);
router.patch('/:id/destacar', authenticate, requireAdmin, destacar);

export default router;
