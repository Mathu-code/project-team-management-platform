import { Router } from 'express';
import healthRouter from './index.js';
import authRouter from '../modules/auth/auth.routes.js';
import usersRouter from '../modules/users/users.routes.js';
import projectsRouter from '../modules/projects/projects.routes.js';
import tasksRouter from '../modules/tasks/tasks.routes.js';
import dashboardRouter from '../modules/dashboard/dashboard.routes.js';
import notificationsRouter from '../modules/notifications/notifications.routes.js';
import attachmentsRouter from '../modules/attachments/attachments.routes.js';
import searchRouter from '../modules/search/search.routes.js';

const router = Router();

router.use('/', healthRouter);
router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/projects', projectsRouter);
router.use('/', tasksRouter);
router.use('/dashboard', dashboardRouter);
router.use('/notifications', notificationsRouter);
router.use('/', attachmentsRouter);
router.use('/search', searchRouter);

export default router;
