import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate, asyncHandler } from '../../utils/express.js';
import { createAttachmentSchema, taskIdParamSchema } from '../../validators/schemas.js';
import * as controller from './attachments.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/tasks/:taskId/attachments', validate(taskIdParamSchema, 'params'), asyncHandler(controller.listAttachments));
router.post('/tasks/:taskId/attachments', validate(taskIdParamSchema, 'params'), validate(createAttachmentSchema), asyncHandler(controller.createAttachment));
router.delete('/tasks/:taskId/attachments/:attachmentId', validate(taskIdParamSchema, 'params'), asyncHandler(controller.deleteAttachment));

export default router;
