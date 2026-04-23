import { Router } from 'express';
import { registro, login, verifyEmail, resendVerification, googleAuth } from '../controllers/auth.controller';

const router = Router();

router.post('/registro', registro);
router.post('/login', login);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/google', googleAuth);

export default router;
