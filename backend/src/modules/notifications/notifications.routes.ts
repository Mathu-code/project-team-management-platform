import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate, asyncHandler } from '../../utils/express.js';
import { notificationsQuerySchema, idParamSchema } from '../../validators/schemas.js';
import * as controller from './notifications.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', validate(notificationsQuerySchema, 'query'), asyncHandler(controller.listNotifications));
router.get('/unread-count', asyncHandler(controller.getUnreadCount));
router.patch('/:id/read', validate(idParamSchema, 'params'), asyncHandler(controller.markNotificationRead));
router.patch('/read-all', asyncHandler(controller.markAllNotificationsRead));

export default router;
