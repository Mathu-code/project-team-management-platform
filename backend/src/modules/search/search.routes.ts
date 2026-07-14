import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate, asyncHandler } from '../../utils/express.js';
import { searchQuerySchema } from '../../validators/schemas.js';
import * as controller from './search.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', validate(searchQuerySchema, 'query'), asyncHandler(controller.search));

export default router;
