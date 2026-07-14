import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate, asyncHandler } from '../../utils/express.js';
import { loginSchema } from '../../validators/schemas.js';
import * as controller from './auth.controller.js';

const router = Router();

router.post('/login', validate(loginSchema), asyncHandler(controller.login));
router.get('/me', requireAuth, asyncHandler(controller.getMe));
router.post('/change-password', requireAuth, asyncHandler(controller.changePassword));

export default router;
