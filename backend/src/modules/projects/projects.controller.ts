import { Request, Response } from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../../db/prisma.js';
import { conflict, notFound } from '../../utils/httpError.js';
import {
  createProjectSchema,
  updateProjectSchema,
  addMemberSchema,
  projectIdParamSchema,
  memberIdParamSchema,
} from '../../validators/schemas.js';
import { assertProjectManager, getViewableProject } from './projectAccess.js';

export async function listProjects(req: Request, res: Response) {
  const userId = req.user!.userId;
  const role = req.user!.role;

  let projects;
  if (role === Role.ADMIN) {
    projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { tasks: true, members: true } }, createdBy: { select: { id: true, name: true } } },
    });
  } else if (role === Role.PROJECT_MANAGER) {
    projects = await prisma.project.findMany({
      where: { createdById: userId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { tasks: true, members: true } }, createdBy: { select: { id: true, name: true } } },
    });
  } else {
    projects = await prisma.project.findMany({
      where: { members: { some: { userId } } },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { tasks: true, members: true } }, createdBy: { select: { id: true, name: true } } },
    });
  }
  res.json({ projects });
}

export async function getProject(req: Request, res: Response) {
  const { projectId } = req.params as z.infer<typeof projectIdParamSchema>;
  const project = await getViewableProject(projectId, req.user!.userId, req.user!.role);
  const full = await prisma.project.findUnique({
    where: { id: project.id },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
      },
      tasks: {
        include: { assignee: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  res.json({ project: full });
}

export async function createProject(req: Request, res: Response) {
  const data = req.body as z.infer<typeof createProjectSchema>;
  const project = await prisma.project.create({
    data: {
      name: data.name,
      description: data.description,
      status: data.status,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      createdById: req.user!.userId,
    },
  });
  // Creator is automatically a MANAGER member.
  await prisma.projectMember.create({
    data: { projectId: project.id, userId: req.user!.userId, role: 'MANAGER' },
  });
  res.status(201).json({ project });
}

export async function updateProject(req: Request, res: Response) {
  const { projectId } = req.params as z.infer<typeof projectIdParamSchema>;
  const data = req.body as z.infer<typeof updateProjectSchema>;
  const project = await getViewableProject(projectId, req.user!.userId, req.user!.role);
  assertProjectManager(project, req.user!.userId, req.user!.role);

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: {
      name: data.name,
      description: data.description,
      status: data.status,
      startDate: data.startDate === undefined ? undefined : data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate === undefined ? undefined : data.endDate ? new Date(data.endDate) : null,
    },
  });
  res.json({ project: updated });
}

export async function deleteProject(req: Request, res: Response) {
  const { projectId } = req.params as z.infer<typeof projectIdParamSchema>;
  const project = await getViewableProject(projectId, req.user!.userId, req.user!.role);
  assertProjectManager(project, req.user!.userId, req.user!.role);
  await prisma.project.delete({ where: { id: projectId } });
  res.json({ message: 'Project deleted' });
}

export async function listMembers(req: Request, res: Response) {
  const { projectId } = req.params as z.infer<typeof projectIdParamSchema>;
  await getViewableProject(projectId, req.user!.userId, req.user!.role);
  const members = await prisma.projectMember.findMany({
    where: { projectId },
    include: { user: { select: { id: true, name: true, email: true, role: true, isActive: true } } },
    orderBy: { assignedAt: 'asc' },
  });
  res.json({ members });
}

export async function listAvailableUsers(req: Request, res: Response) {
  const { projectId } = req.params as z.infer<typeof projectIdParamSchema>;
  await getViewableProject(projectId, req.user!.userId, req.user!.role);
  const existing = await prisma.projectMember.findMany({
    where: { projectId },
    select: { userId: true },
  });
  const ids = existing.map((m) => m.userId);
  const users = await prisma.user.findMany({
    where: { id: { notIn: ids }, isActive: true, role: { in: [Role.PROJECT_MANAGER, Role.TEAM_MEMBER] } },
    select: { id: true, name: true, email: true, role: true },
  });
  res.json({ users });
}

export async function addMember(req: Request, res: Response) {
  const { projectId } = req.params as z.infer<typeof projectIdParamSchema>;
  const data = req.body as z.infer<typeof addMemberSchema>;
  const project = await getViewableProject(projectId, req.user!.userId, req.user!.role);
  assertProjectManager(project, req.user!.userId, req.user!.role);

  const user = await prisma.user.findUnique({ where: { id: data.userId } });
  if (!user) throw notFound('User not found');
  if (!user.isActive) throw conflict('Cannot add an inactive user');

  const existing = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: data.userId } },
  });
  if (existing) throw conflict('User is already a member of this project');

  const member = await prisma.projectMember.create({
    data: { projectId, userId: data.userId, role: data.role ?? 'MEMBER' },
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
  });
  res.status(201).json({ member });
}

export async function removeMember(req: Request, res: Response) {
  const { projectId, userId } = req.params as z.infer<typeof memberIdParamSchema>;
  const project = await getViewableProject(projectId, req.user!.userId, req.user!.role);
  assertProjectManager(project, req.user!.userId, req.user!.role);

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (!member) throw notFound('Membership not found');
  if (member.role === 'MANAGER' && project.createdById === userId) {
    res.status(400).json({ error: 'Cannot remove the project owner' });
    return;
  }
  await prisma.projectMember.delete({ where: { projectId_userId: { projectId, userId } } });
  res.json({ message: 'Member removed' });
}
