import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../db/prisma.js';
import { notFound, forbidden } from '../../utils/httpError.js';
import { taskIdParamSchema } from '../../validators/schemas.js';
import { getViewableProject } from '../projects/projectAccess.js';
import { getPublicUrl } from '../../utils/upload.js';

export async function listAttachments(req: Request, res: Response) {
  const { taskId } = req.params as z.infer<typeof taskIdParamSchema>;
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw notFound('Task not found');
  await getViewableProject(task.projectId, req.user!.userId, req.user!.role);

  const attachments = await prisma.attachment.findMany({
    where: { taskId },
    include: { uploadedBy: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ attachments });
}

export async function createAttachment(req: Request, res: Response) {
  const { taskId } = req.params as z.infer<typeof taskIdParamSchema>;
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw notFound('Task not found');

  const project = await getViewableProject(task.projectId, req.user!.userId, req.user!.role);
  const role = req.user!.role;
  const userId = req.user!.userId;
  const isManager = role === 'ADMIN' || project.createdById === userId;

  if (!isManager && task.assigneeId !== userId) {
    throw forbidden('You can only add attachments to tasks assigned to you');
  }

  const file = req.file;
  if (!file) {
    throw forbidden('File is required');
  }

  const attachment = await prisma.attachment.create({
    data: {
      filename: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: getPublicUrl(file.filename),
      taskId,
      uploadedById: userId,
    },
    include: { uploadedBy: { select: { id: true, name: true } } },
  });

  await prisma.notification.create({
    data: {
      userId: task.assigneeId ?? task.createdById,
      type: 'TASK_UPDATED',
      title: 'New attachment added',
      message: `A new file was attached to "${task.title}"`,
      entityId: taskId,
    },
  });

  res.status(201).json({ attachment });
}

export async function deleteAttachment(req: Request, res: Response) {
  const { taskId, attachmentId } = req.params as { taskId: string; attachmentId: string };
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw notFound('Task not found');

  const project = await getViewableProject(task.projectId, req.user!.userId, req.user!.role);
  const role = req.user!.role;
  const userId = req.user!.userId;
  const isManager = role === 'ADMIN' || project.createdById === userId;

  const attachment = await prisma.attachment.findFirst({
    where: { id: attachmentId, taskId },
  });
  if (!attachment) throw notFound('Attachment not found');

  if (!isManager && attachment.uploadedById !== userId) {
    throw forbidden('You can only delete your own attachments');
  }

  await prisma.attachment.delete({ where: { id: attachmentId } });
  res.json({ message: 'Attachment deleted' });
}
