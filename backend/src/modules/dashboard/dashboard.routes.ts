import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import * as controller from './dashboard.controller.js';

const router = Router();

router.use(requireAuth);
router.get('/', controller.getDashboard);

export default router;
