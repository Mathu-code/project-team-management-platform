import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate, asyncHandler } from '../../utils/express.js';
import {
  updateTaskSchema,
  createCommentSchema,
  taskIdParamSchema,
} from '../../validators/schemas.js';
import * as controller from './tasks.controller.js';

const router = Router();

router.use(requireAuth);

// Task-scoped routes.
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

export default router;
