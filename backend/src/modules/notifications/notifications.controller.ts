import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../db/prisma.js';
import { notFound } from '../../utils/httpError.js';
import { notificationsQuerySchema } from '../../validators/schemas.js';

export async function listNotifications(req: Request, res: Response) {
  const query = req.query as z.infer<typeof notificationsQuerySchema>;
  const where: Record<string, unknown> = { userId: req.user!.userId };
  if (query.read !== undefined) where.read = query.read === 'true';
  if (query.type) where.type = query.type;

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json({ notifications });
}

export async function getUnreadCount(req: Request, res: Response) {
  const count = await prisma.notification.count({
    where: { userId: req.user!.userId, read: false },
  });
  res.json({ count });
}

export async function markNotificationRead(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const notification = await prisma.notification.findFirst({
    where: { id, userId: req.user!.userId },
  });
  if (!notification) throw notFound('Notification not found');

  await prisma.notification.update({
    where: { id },
    data: { read: true },
  });
  res.json({ message: 'Marked as read' });
}

export async function markAllNotificationsRead(req: Request, res: Response) {
  await prisma.notification.updateMany({
    where: { userId: req.user!.userId, read: false },
    data: { read: true },
  });
  res.json({ message: 'All notifications marked as read' });
}
