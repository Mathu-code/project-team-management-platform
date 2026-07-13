import { Role } from '@prisma/client';
import { prisma } from '../../db/prisma.js';
import { forbidden, notFound } from '../../utils/httpError.js';

/**
 * Returns the project if the requesting user is permitted to VIEW it:
 *  - ADMIN: any project
 *  - PROJECT_MANAGER: projects they created
 *  - TEAM_MEMBER: projects they are a member of
 * Otherwise throws 403/404.
 */
export async function getViewableProject(projectId: string, userId: string, role: Role) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: { where: { userId } } },
  });
  if (!project) throw notFound('Project not found');

  if (role === Role.ADMIN) return project;
  if (project.createdById === userId) return project;
  if (role === Role.TEAM_MEMBER && project.members.length === 0) {
    throw forbidden('You are not a member of this project');
  }
  return project;
}

/**
 * Ensures the requesting user may MODIFY the project (ADMIN or the owning PM).
 */
export function assertProjectManager(project: { createdById: string }, userId: string, role: Role) {
  if (role === Role.ADMIN) return;
  if (project.createdById === userId) return;
  throw forbidden('Only the project manager or an admin can modify this project');
}
