import { Router } from 'express'
import { authenticate, requireAuth } from '../middleware/auth.middleware'
import { getMe, updateFavoritos, updateGuardados } from '../controllers/usuario.controller'

const router = Router()

router.get('/me', authenticate, requireAuth, getMe)
router.put('/favoritos', authenticate, requireAuth, updateFavoritos)
router.put('/guardados', authenticate, requireAuth, updateGuardados)

export default router
