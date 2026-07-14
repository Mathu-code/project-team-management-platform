import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { Role } from '@prisma/client';
import { validate, asyncHandler } from '../../utils/express.js';
import {
  createProjectSchema,
  updateProjectSchema,
  addMemberSchema,
  projectIdParamSchema,
  memberIdParamSchema,
  createTaskSchema,
  taskListQuerySchema,
} from '../../validators/schemas.js';
import * as controller from './projects.controller.js';
import * as taskController from '../tasks/tasks.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', asyncHandler(controller.listProjects));
router.get('/:projectId', validate(projectIdParamSchema, 'params'), asyncHandler(controller.getProject));

// Create allowed for admins and project managers.
router.post(
  '/',
  requireRole(Role.ADMIN, Role.PROJECT_MANAGER),
  validate(createProjectSchema),
  asyncHandler(controller.createProject),
);

router.patch(
  '/:projectId',
  validate(projectIdParamSchema, 'params'),
  validate(updateProjectSchema),
  asyncHandler(controller.updateProject),
);
router.delete('/:projectId', validate(projectIdParamSchema, 'params'), asyncHandler(controller.deleteProject));
router.get('/:projectId/members', validate(projectIdParamSchema, 'params'), asyncHandler(controller.listMembers));
router.get('/:projectId/available-users', validate(projectIdParamSchema, 'params'), asyncHandler(controller.listAvailableUsers));
router.post(
  '/:projectId/members',
  validate(projectIdParamSchema, 'params'),
  validate(addMemberSchema),
  asyncHandler(controller.addMember),
);
router.delete(
  '/:projectId/members/:userId',
  validate(memberIdParamSchema, 'params'),
  asyncHandler(controller.removeMember),
);

// Project-scoped task routes.
router.get('/:projectId/tasks', validate(projectIdParamSchema, 'params'), validate(taskListQuerySchema, 'query'), asyncHandler(taskController.listTasks));
router.post(
  '/:projectId/tasks',
  validate(projectIdParamSchema, 'params'),
  validate(createTaskSchema),
  asyncHandler(taskController.createTask),
);

export default router;

