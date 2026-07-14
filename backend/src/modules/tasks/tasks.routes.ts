import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate, asyncHandler } from '../../utils/express.js';
import {
  updateTaskSchema,
  createCommentSchema,
  taskIdParamSchema,
  myTasksQuerySchema,
  createAttachmentSchema,
} from '../../validators/schemas.js';
import * as controller from './tasks.controller.js';
import * as attachmentController from '../attachments/attachments.controller.js';

const router = Router();

router.use(requireAuth);

// Task-scoped routes.
router.get('/tasks/mine', validate(myTasksQuerySchema, 'query'), asyncHandler(controller.getMyTasks));
router.get('/tasks/:taskId', validate(taskIdParamSchema, 'params'), asyncHandler(controller.getTask));
router.patch(
  '/tasks/:taskId',
  validate(taskIdParamSchema, 'params'),
  validate(updateTaskSchema),
  asyncHandler(controller.updateTask),
);
router.delete('/tasks/:taskId', validate(taskIdParamSchema, 'params'), asyncHandler(controller.deleteTask));
router.get('/tasks/:taskId/comments', validate(taskIdParamSchema, 'params'), asyncHandler(controller.listComments));
router.post(
  '/tasks/:taskId/comments',
  validate(taskIdParamSchema, 'params'),
  validate(createCommentSchema),
  asyncHandler(controller.addComment),
);

// Attachment routes nested under tasks.
router.get('/tasks/:taskId/attachments', validate(taskIdParamSchema, 'params'), asyncHandler(attachmentController.listAttachments));
router.post(
  '/tasks/:taskId/attachments',
  validate(taskIdParamSchema, 'params'),
  validate(createAttachmentSchema),
  asyncHandler(attachmentController.createAttachment),
);
router.delete('/tasks/:taskId/attachments/:attachmentId', validate(taskIdParamSchema, 'params'), asyncHandler(attachmentController.deleteAttachment));

export default router;
