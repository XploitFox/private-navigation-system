import { Router } from 'express';
import { MetaController } from '../controllers/metaController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', authenticateToken, MetaController.get);

export default router;

