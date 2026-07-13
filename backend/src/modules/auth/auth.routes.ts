import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../utils/express.js';
import { loginSchema } from '../validators/schemas.js';
import * as controller from './auth.controller.js';

const router = Router();

router.post('/login', validate(loginSchema), controller.login);
router.get('/me', requireAuth, controller.getMe);
router.post('/change-password', requireAuth, controller.changePassword);

export default router;
