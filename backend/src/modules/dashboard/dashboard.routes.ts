import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/express.js';
import * as controller from './dashboard.controller.js';

const router = Router();

router.use(requireAuth);
router.get('/', asyncHandler(controller.getDashboard));

export default router;
