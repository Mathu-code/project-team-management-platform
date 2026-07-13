import { Router } from 'express';
import healthRouter from './index.js';
import authRouter from '../modules/auth/auth.routes.js';
import usersRouter from '../modules/users/users.routes.js';
import projectsRouter from '../modules/projects/projects.routes.js';
import tasksRouter from '../modules/tasks/tasks.routes.js';
import dashboardRouter from '../modules/dashboard/dashboard.routes.js';

const router = Router();

router.use('/', healthRouter);
router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/projects', projectsRouter);
router.use('/', tasksRouter);
router.use('/dashboard', dashboardRouter);

export default router;
