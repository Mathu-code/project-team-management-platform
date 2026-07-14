import { Request, Response } from 'express';
import { Role, TaskStatus, TaskPriority } from '@prisma/client';
import { prisma } from '../../db/prisma.js';
import { getViewableProject } from '../projects/projectAccess.js';

export async function getDashboard(req: Request, res: Response) {
  const userId = req.user!.userId;
  const role = req.user!.role;

  if (role === Role.ADMIN) {
    const [users, projects, tasks, tasksByStatus, tasksByPriority, overdue] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.task.count(),
      prisma.task.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.task.groupBy({ by: ['priority'], _count: { _all: true } }),
      prisma.task.count({
        where: { dueDate: { lt: new Date() }, status: { not: TaskStatus.DONE } },
      }),
    ]);
    res.json({
      role,
      stats: {
        users,
        projects,
        tasks,
        overdueTasks: overdue,
        tasksByStatus: countMap(tasksByStatus),
        tasksByPriority: countMap(tasksByPriority),
      },
    });
    return;
  }

  if (role === Role.PROJECT_MANAGER) {
    const [projects, tasks, tasksByStatus, tasksByPriority, overdue] = await Promise.all([
      prisma.project.count({ where: { createdById: userId } }),
      prisma.task.count({ where: { project: { createdById: userId } } }),
      prisma.task.groupBy({
        by: ['status'],
        where: { project: { createdById: userId } },
        _count: { _all: true },
      }),
      prisma.task.groupBy({
        by: ['priority'],
        where: { project: { createdById: userId } },
        _count: { _all: true },
      }),
      prisma.task.count({
        where: {
          project: { createdById: userId },
          dueDate: { lt: new Date() },
          status: { not: TaskStatus.DONE },
        },
      }),
    ]);
    res.json({
      role,
      stats: { projects, tasks, overdueTasks: overdue, tasksByStatus: countMap(tasksByStatus), tasksByPriority: countMap(tasksByPriority) },
    });
    return;
  }

  // TEAM_MEMBER
  const [projects, assigned, tasksByStatus, tasksByPriority, overdue] = await Promise.all([
    prisma.project.count({ where: { members: { some: { userId } } } }),
    prisma.task.count({ where: { assigneeId: userId } }),
    prisma.task.groupBy({
      by: ['status'],
      where: { assigneeId: userId },
      _count: { _all: true },
    }),
    prisma.task.groupBy({
      by: ['priority'],
      where: { assigneeId: userId },
      _count: { _all: true },
    }),
    prisma.task.count({
      where: { assigneeId: userId, dueDate: { lt: new Date() }, status: { not: TaskStatus.DONE } },
    }),
  ]);
  res.json({
    role,
    stats: { projects, assignedTasks: assigned, overdueTasks: overdue, tasksByStatus: countMap(tasksByStatus), tasksByPriority: countMap(tasksByPriority) },
  });
}

function countMap(rows: { status?: string; priority?: string; _count: { _all: number } }[]) {
  const map: Record<string, number> = {};
  for (const r of rows) map[r.status ?? r.priority ?? ''] = r._count._all;
  return map;
}

export async function getProjectAnalytics(req: Request, res: Response) {
  const { projectId } = req.params as { projectId: string };
  await getViewableProject(projectId, req.user!.userId, req.user!.role);

  const [tasksByStatus, tasksByPriority, overdue, total, completed] = await Promise.all([
    prisma.task.groupBy({ by: ['status'], where: { projectId }, _count: { _all: true } }),
    prisma.task.groupBy({ by: ['priority'], where: { projectId }, _count: { _all: true } }),
    prisma.task.count({ where: { projectId, dueDate: { lt: new Date() }, status: { not: TaskStatus.DONE } } }),
    prisma.task.count({ where: { projectId } }),
    prisma.task.count({ where: { projectId, status: TaskStatus.DONE } }),
  ]);

  res.json({
    projectId,
    total,
    completed,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    overdue,
    tasksByStatus: countMap(tasksByStatus),
    tasksByPriority: countMap(tasksByPriority),
  });
}

export async function getGlobalAnalytics(req: Request, res: Response) {
  const userId = req.user!.userId;
  const role = req.user!.role;

  const where = role === Role.ADMIN ? {} : { project: { createdById: userId } };

  const [tasksByStatus, tasksByPriority, overdue, total, completed, byAssignee] = await Promise.all([
    prisma.task.groupBy({ by: ['status'], where, _count: { _all: true } }),
    prisma.task.groupBy({ by: ['priority'], where, _count: { _all: true } }),
    prisma.task.count({ where: { ...where, dueDate: { lt: new Date() }, status: { not: TaskStatus.DONE } } }),
    prisma.task.count({ where }),
    prisma.task.count({ where: { ...where, status: TaskStatus.DONE } }),
    prisma.task.findMany({
      where: { ...where, assigneeId: { not: null } },
      select: { assigneeId: true, assignee: { select: { name: true } } },
    }),
  ]);

  const assigneeMap: Record<string, { name: string; count: number }> = {};
  for (const t of byAssignee) {
    if (t.assignee && t.assigneeId) {
      assigneeMap[t.assigneeId] = { name: t.assignee.name, count: (assigneeMap[t.assigneeId]?.count ?? 0) + 1 };
    }
  }

  res.json({
    role,
    total,
    completed,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    overdue,
    tasksByStatus: countMap(tasksByStatus),
    tasksByPriority: countMap(tasksByPriority),
    byAssignee: assigneeMap,
  });
}
