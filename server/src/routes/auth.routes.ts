import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { sendOTP, verifyOTP, register, login, logout, getMe } from '../controllers/auth.controller';

const router = Router();

router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', requireAuth, getMe);

export default router;
