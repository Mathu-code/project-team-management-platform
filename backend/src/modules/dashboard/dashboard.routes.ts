import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate, asyncHandler } from '../../utils/express.js';
import { projectIdParamSchema, analyticsQuerySchema } from '../../validators/schemas.js';
import * as controller from './dashboard.controller.js';

const router = Router();

router.use(requireAuth);
router.get('/', asyncHandler(controller.getDashboard));
router.get('/projects/:projectId/analytics', validate(projectIdParamSchema, 'params'), asyncHandler(controller.getProjectAnalytics));
router.get('/analytics', validate(analyticsQuerySchema, 'query'), asyncHandler(controller.getGlobalAnalytics));

export default router;
