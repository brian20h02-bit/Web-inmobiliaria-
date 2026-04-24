import { Router } from 'express';
import { registro, login, verifyEmail, resendVerification, googleAuth, deleteAccount } from '../controllers/auth.controller';
import { authenticate, requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.post('/registro', registro);
router.post('/login', login);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/google', googleAuth);
router.delete('/cuenta', authenticate, requireAuth, deleteAccount);

export default router;
