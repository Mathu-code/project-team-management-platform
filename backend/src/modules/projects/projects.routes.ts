import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { Role } from '@prisma/client';
import { validate } from '../../utils/express.js';
import {
  createProjectSchema,
  updateProjectSchema,
  addMemberSchema,
  projectIdParamSchema,
  memberIdParamSchema,
} from '../../validators/schemas.js';
import * as controller from './projects.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', controller.listProjects);
router.get('/:projectId', validate(projectIdParamSchema, 'params'), controller.getProject);

// Create allowed for admins and project managers.
router.post(
  '/',
  requireRole(Role.ADMIN, Role.PROJECT_MANAGER),
  validate(createProjectSchema),
  controller.createProject,
);

router.patch(
  '/:projectId',
  validate(projectIdParamSchema, 'params'),
  validate(updateProjectSchema),
  controller.updateProject,
);
router.delete('/:projectId', validate(projectIdParamSchema, 'params'), controller.deleteProject);

router.get('/:projectId/members', validate(projectIdParamSchema, 'params'), controller.listMembers);
router.get('/:projectId/available-users', validate(projectIdParamSchema, 'params'), controller.listAvailableUsers);
router.post(
  '/:projectId/members',
  validate(projectIdParamSchema, 'params'),
  validate(addMemberSchema),
  controller.addMember,
);
router.delete(
  '/:projectId/members/:userId',
  validate(memberIdParamSchema, 'params'),
  controller.removeMember,
);

export default router;
