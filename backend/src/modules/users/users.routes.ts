import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { Role } from '@prisma/client';
import { validate } from '../../utils/express.js';
import {
  createUserSchema,
  updateUserSchema,
  idParamSchema,
} from '../../validators/schemas.js';
import * as controller from './users.controller.js';

const router = Router();

// All user-management endpoints require an authenticated ADMIN.
router.use(requireAuth, requireRole(Role.ADMIN));

router.get('/', controller.listUsers);
router.get('/:id', validate(idParamSchema, 'params'), controller.getUser);
router.post('/', validate(createUserSchema), controller.createUser);
router.patch('/:id', validate(idParamSchema, 'params'), validate(updateUserSchema), controller.updateUser);
router.delete('/:id', validate(idParamSchema, 'params'), controller.deleteUser);

export default router;
