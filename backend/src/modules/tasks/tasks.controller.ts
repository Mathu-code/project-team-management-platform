import { Request, Response } from 'express';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../db/prisma.js';
import { forbidden, notFound } from '../../utils/httpError.js';
import {
  createTaskSchema,
  updateTaskSchema,
  createCommentSchema,
  projectIdParamSchema,
  taskIdParamSchema,
} from '../../validators/schemas.js';
import { assertProjectManager, getViewableProject } from '../projects/projectAccess.js';

const taskInclude = {
  assignee: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
  project: { select: { id: true, name: true } },
};

export async function listTasks(req: Request, res: Response) {
  const { projectId } = req.params as z.infer<typeof projectIdParamSchema>;
  await getViewableProject(projectId, req.user!.userId, req.user!.role);
  const tasks = await prisma.task.findMany({
    where: { projectId },
    include: taskInclude,
    orderBy: { createdAt: 'desc' },
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
  res.status(201).json({ comment });
}
