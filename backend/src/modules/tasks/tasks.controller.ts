import { Request, Response } from 'express';
import { Role, TaskStatus, TaskPriority } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../db/prisma.js';
import { forbidden, notFound } from '../../utils/httpError.js';
import {
  createTaskSchema,
  updateTaskSchema,
  createCommentSchema,
  projectIdParamSchema,
  taskIdParamSchema,
  taskListQuerySchema,
  myTasksQuerySchema,
} from '../../validators/schemas.js';
import { assertProjectManager, getViewableProject } from '../projects/projectAccess.js';

const taskInclude = {
  assignee: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
  project: { select: { id: true, name: true } },
};

function buildTaskWhere(projectId: string, query: z.infer<typeof taskListQuerySchema>) {
  const where: Record<string, unknown> = { projectId };
  if (query.status) where.status = query.status;
  if (query.priority) where.priority = query.priority;
  if (query.assigneeId) where.assigneeId = query.assigneeId;
  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  if (query.overdue === 'true') {
    where.dueDate = { lt: new Date() };
    where.status = { not: TaskStatus.DONE };
  } else if (query.overdue === 'false') {
    where.OR = [{ dueDate: null }, { dueDate: { gte: new Date() } }];
  }
  return where;
}

function buildTaskOrderBy(query: z.infer<typeof taskListQuerySchema>): Record<string, string> {
  const sortBy = query.sortBy ?? 'createdAt';
  const sortOrder = query.sortOrder ?? 'desc';
  return { [sortBy]: sortOrder };
}

export async function listTasks(req: Request, res: Response) {
  const { projectId } = req.params as z.infer<typeof projectIdParamSchema>;
  await getViewableProject(projectId, req.user!.userId, req.user!.role);
  const query = req.query as z.infer<typeof taskListQuerySchema>;

  const where = buildTaskWhere(projectId, query);
  const orderBy = buildTaskOrderBy(query);

  const tasks = await prisma.task.findMany({
    where,
    include: taskInclude,
    orderBy,
  });
  res.json({ tasks });
}

export async function createTask(req: Request, res: Response) {
  const { projectId } = req.params as z.infer<typeof projectIdParamSchema>;
  const data = req.body as z.infer<typeof createTaskSchema>;
  const project = await getViewableProject(projectId, req.user!.userId, req.user!.role);
  assertProjectManager(project, req.user!.userId, req.user!.role);

  if (data.assigneeId) {
    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: data.assigneeId } },
    });
    if (!member) throw forbidden('Assignee must be a member of the project');
  }

  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      projectId,
      assigneeId: data.assigneeId ?? null,
      createdById: req.user!.userId,
    },
    include: taskInclude,
  });

  if (data.assigneeId) {
    await prisma.notification.create({
      data: {
        userId: data.assigneeId,
        type: 'TASK_ASSIGNED',
        title: 'New task assigned',
        message: `You have been assigned to "${task.title}"`,
        entityId: task.id,
      },
    });
  }

  res.status(201).json({ task });
}

export async function getTask(req: Request, res: Response) {
  const { taskId } = req.params as z.infer<typeof taskIdParamSchema>;
  const task = await prisma.task.findUnique({ where: { id: taskId }, include: taskInclude });
  if (!task) throw notFound('Task not found');
  await getViewableProject(task.projectId, req.user!.userId, req.user!.role);

  const full = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      ...taskInclude,
      comments: {
        orderBy: { createdAt: 'asc' },
        include: { user: { select: { id: true, name: true } } },
      },
      attachments: {
        orderBy: { createdAt: 'desc' },
        include: { uploadedBy: { select: { id: true, name: true } } },
      },
    },
  });
  res.json({ task: full });
}

export async function updateTask(req: Request, res: Response) {
  const { taskId } = req.params as z.infer<typeof taskIdParamSchema>;
  const data = req.body as z.infer<typeof updateTaskSchema>;
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw notFound('Task not found');

  const project = await getViewableProject(task.projectId, req.user!.userId, req.user!.role);
  const role = req.user!.role;
  const userId = req.user!.userId;

  const isManager = role === Role.ADMIN || project.createdById === userId;

  if (!isManager) {
    if (task.assigneeId !== userId) {
      throw forbidden('You can only update tasks assigned to you');
    }
    const extra = Object.keys(data).filter((k) => k !== 'status');
    if (extra.length > 0) {
      throw forbidden('Team members may only update task status');
    }
    if (!data.status) {
      throw forbidden('No updatable fields provided');
    }
  }

  if (data.assigneeId && isManager) {
    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: task.projectId, userId: data.assigneeId } },
    });
    if (!member) throw forbidden('Assignee must be a member of the project');
  }

  const previousAssigneeId = task.assigneeId;
  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      dueDate: data.dueDate === undefined ? undefined : data.dueDate ? new Date(data.dueDate) : null,
      assigneeId: data.assigneeId === undefined ? undefined : data.assigneeId ?? null,
    },
    include: taskInclude,
  });

  if (data.assigneeId && data.assigneeId !== previousAssigneeId) {
    await prisma.notification.create({
      data: {
        userId: data.assigneeId,
        type: 'TASK_ASSIGNED',
        title: 'Task reassigned',
        message: `You have been assigned to "${updated.title}"`,
        entityId: updated.id,
      },
    });
  }

  res.json({ task: updated });
}

export async function deleteTask(req: Request, res: Response) {
  const { taskId } = req.params as z.infer<typeof taskIdParamSchema>;
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw notFound('Task not found');
  const project = await getViewableProject(task.projectId, req.user!.userId, req.user!.role);
  assertProjectManager(project, req.user!.userId, req.user!.role);
  await prisma.task.delete({ where: { id: taskId } });
  res.json({ message: 'Task deleted' });
}

export async function getMyTasks(req: Request, res: Response) {
  const query = req.query as z.infer<typeof myTasksQuerySchema>;
  const where: Record<string, unknown> = { assigneeId: req.user!.userId };
  if (query.status) where.status = query.status;
  if (query.priority) where.priority = query.priority;
  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  if (query.overdue === 'true') {
    where.dueDate = { lt: new Date() };
    where.status = { not: TaskStatus.DONE };
  } else if (query.overdue === 'false') {
    where.OR = [{ dueDate: null }, { dueDate: { gte: new Date() } }];
  }

  const sortBy = query.sortBy ?? 'createdAt';
  const sortOrder = query.sortOrder ?? 'desc';
  const orderBy = { [sortBy]: sortOrder } as Record<string, string>;

  const tasks = await prisma.task.findMany({
    where,
    include: taskInclude,
    orderBy,
  });
  res.json({ tasks });
}

export async function listComments(req: Request, res: Response) {
  const { taskId } = req.params as z.infer<typeof taskIdParamSchema>;
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw notFound('Task not found');
  await getViewableProject(task.projectId, req.user!.userId, req.user!.role);
  const comments = await prisma.comment.findMany({
    where: { taskId },
    orderBy: { createdAt: 'asc' },
    include: { user: { select: { id: true, name: true } } },
  });
  res.json({ comments });
}

export async function addComment(req: Request, res: Response) {
  const { taskId } = req.params as z.infer<typeof taskIdParamSchema>;
  const data = req.body as z.infer<typeof createCommentSchema>;
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw notFound('Task not found');
  await getViewableProject(task.projectId, req.user!.userId, req.user!.role);
  const comment = await prisma.comment.create({
    data: { content: data.content, taskId, userId: req.user!.userId },
    include: { user: { select: { id: true, name: true } } },
  });

  const projectMembers = await prisma.projectMember.findMany({
    where: { projectId: task.projectId, userId: { not: req.user!.userId } },
  });
  for (const member of projectMembers) {
    await prisma.notification.create({
      data: {
        userId: member.userId,
        type: 'COMMENT_ADDED',
        title: 'New comment',
        message: `A new comment was added on "${task.title}"`,
        entityId: taskId,
      },
    });
  }

  res.status(201).json({ comment });
}
