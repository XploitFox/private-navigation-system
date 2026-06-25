import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { loginRateLimit } from '../middleware/loginRateLimit.js';

const router = Router();

router.post('/login', loginRateLimit, AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);

export default router;
