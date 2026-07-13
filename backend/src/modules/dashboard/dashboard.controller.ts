import { Request, Response } from 'express';
import { Role, TaskStatus } from '@prisma/client';
import { prisma } from '../../db/prisma.js';

export async function getDashboard(req: Request, res: Response) {
  const userId = req.user!.userId;
  const role = req.user!.role;

  if (role === Role.ADMIN) {
    const [users, projects, tasks, tasksByStatus] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.task.count(),
      prisma.task.groupBy({ by: ['status'], _count: { _all: true } }),
    ]);
    res.json({
      role,
      stats: {
        users,
        projects,
        tasks,
        tasksByStatus: countMap(tasksByStatus),
      },
    });
    return;
  }

  if (role === Role.PROJECT_MANAGER) {
    const [projects, tasks, tasksByStatus, overdue] = await Promise.all([
      prisma.project.count({ where: { createdById: userId } }),
      prisma.task.count({ where: { project: { createdById: userId } } }),
      prisma.task.groupBy({
        by: ['status'],
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
      stats: { projects, tasks, overdueTasks: overdue, tasksByStatus: countMap(tasksByStatus) },
    });
    return;
  }

  // TEAM_MEMBER
  const [projects, assigned, tasksByStatus, overdue] = await Promise.all([
    prisma.project.count({ where: { members: { some: { userId } } } }),
    prisma.task.count({ where: { assigneeId: userId } }),
    prisma.task.groupBy({
      by: ['status'],
      where: { assigneeId: userId },
      _count: { _all: true },
    }),
    prisma.task.count({
      where: { assigneeId: userId, dueDate: { lt: new Date() }, status: { not: TaskStatus.DONE } },
    }),
  ]);
  res.json({
    role,
    stats: { projects, assignedTasks: assigned, overdueTasks: overdue, tasksByStatus: countMap(tasksByStatus) },
  });
}

function countMap(rows: { status: string; _count: { _all: number } }[]) {
  const map: Record<string, number> = {};
  for (const r of rows) map[r.status] = r._count._all;
  return map;
}
