import { Request, Response } from 'express';
import { prisma } from '../../db/prisma.js';
import { searchQuerySchema } from '../../validators/schemas.js';

export async function search(req: Request, res: Response) {
  const query = req.query as z.infer<typeof searchQuerySchema>;
  const term = `%${query.q.toLowerCase()}%`;
  const type = query.type ?? 'all';

  const [users, projects] = await Promise.all([
    type === 'all' || type === 'users'
      ? prisma.user.findMany({
          where: { OR: [{ name: { contains: query.q, mode: 'insensitive' } }, { email: { contains: query.q, mode: 'insensitive' } }] },
          select: { id: true, name: true, email: true, role: true, isActive: true },
          take: 20,
        })
      : Promise.resolve([]),
    type === 'all' || type === 'projects'
      ? prisma.project.findMany({
          where: { OR: [{ name: { contains: query.q, mode: 'insensitive' } }, { description: { contains: query.q, mode: 'insensitive' } }] },
          select: { id: true, name: true, description: true, status: true, createdBy: { select: { id: true, name: true } } },
          take: 20,
        })
      : Promise.resolve([]),
  ]);

  res.json({ users, projects });
}
