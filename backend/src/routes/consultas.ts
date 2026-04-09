import { Router } from 'express';
import { authenticate, requireAuth, requireAdmin } from '../middleware/auth.middleware';
import { crear, listarTodas, misConsultas, obtenerDetalle, obtenerHilo, responder, obtenerNotificaciones, marcarComoLeida, misNotificaciones, contarNotificacionesPorPropiedad } from '../controllers/consultas.controller';

const router = Router();

router.post('/', authenticate, requireAuth, crear);
router.get('/mis-notificaciones', authenticate, requireAuth, misNotificaciones);
router.get('/notificaciones/contar', authenticate, requireAuth, contarNotificacionesPorPropiedad);
router.get('/notificaciones', authenticate, requireAdmin, obtenerNotificaciones);
router.get('/', authenticate, requireAdmin, listarTodas);
router.get('/mis-consultas', authenticate, requireAuth, misConsultas);
router.get('/:id', authenticate, requireAuth, obtenerDetalle);
router.get('/:id/hilo', authenticate, requireAuth, obtenerHilo);
router.post('/:id/respuesta', authenticate, requireAuth, responder);
router.put('/:id/leer', authenticate, requireAuth, marcarComoLeida);

export default router;
