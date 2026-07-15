import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate, asyncHandler } from '../../utils/express.js';
import { taskIdParamSchema } from '../../validators/schemas.js';
import { upload } from '../../utils/upload.js';
import * as controller from './attachments.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/tasks/:taskId/attachments', validate(taskIdParamSchema, 'params'), asyncHandler(controller.listAttachments));
router.post('/tasks/:taskId/attachments', validate(taskIdParamSchema, 'params'), upload.single('file'), asyncHandler(controller.createAttachment));
router.delete('/tasks/:taskId/attachments/:attachmentId', validate(taskIdParamSchema, 'params'), asyncHandler(controller.deleteAttachment));

export default router;
