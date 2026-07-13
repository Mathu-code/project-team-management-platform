import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../utils/express.js';
import {
  createTaskSchema,
  updateTaskSchema,
  createCommentSchema,
  projectIdParamSchema,
  taskIdParamSchema,
} from '../../validators/schemas.js';
import * as controller from './tasks.controller.js';

const router = Router();

router.use(requireAuth);

// Project-scoped task routes.
router.get('/:projectId/tasks', validate(projectIdParamSchema, 'params'), controller.listTasks);
router.post(
  '/:projectId/tasks',
  validate(projectIdParamSchema, 'params'),
  validate(createTaskSchema),
  controller.createTask,
);

// Task-scoped routes.
router.get('/tasks/:taskId', validate(taskIdParamSchema, 'params'), controller.getTask);
router.patch(
  '/tasks/:taskId',
  validate(taskIdParamSchema, 'params'),
  validate(updateTaskSchema),
  controller.updateTask,
);
router.delete('/tasks/:taskId', validate(taskIdParamSchema, 'params'), controller.deleteTask);
router.get('/tasks/:taskId/comments', validate(taskIdParamSchema, 'params'), controller.listComments);
router.post(
  '/tasks/:taskId/comments',
  validate(taskIdParamSchema, 'params'),
  validate(createCommentSchema),
  controller.addComment,
);

export default router;
