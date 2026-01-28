import { Router } from 'express';
import { NavController } from '../controllers/navController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', authenticateToken, NavController.getAll);
router.post('/', authenticateToken, NavController.update);

export default router;
