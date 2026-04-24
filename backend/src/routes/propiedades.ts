import { Router } from 'express';
import { authenticate, authenticateOptional, requireAdmin } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload';
import {
  listarDestacadas,
  listar,
  obtenerDetalle,
  crear,
  actualizar,
  eliminar,
  destacar,
  registrarVisita,
  obtenerHistorial,
  limpiarHistorial,
  eliminarDeHistorial,
} from '../controllers/propiedades.controller';

const router = Router();

router.get('/destacadas', listarDestacadas);
router.get('/historial', authenticate, obtenerHistorial);
router.delete('/historial', authenticate, limpiarHistorial);
router.delete('/historial/:propId', authenticate, eliminarDeHistorial);
router.get('/', listar);
router.get('/:id', obtenerDetalle);
router.post('/:id/visita', authenticateOptional, registrarVisita);
router.post('/', authenticate, requireAdmin, upload, crear);
router.put('/:id', authenticate, requireAdmin, upload, actualizar);
router.delete('/:id', authenticate, requireAdmin, eliminar);
router.patch('/:id/destacar', authenticate, requireAdmin, destacar);

export default router;
