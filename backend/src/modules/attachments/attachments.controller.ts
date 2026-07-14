import { Request, Response } from 'express';
import { prisma } from '../../db/prisma.js';
import { notFound, forbidden } from '../../utils/httpError.js';
import { createAttachmentSchema, taskIdParamSchema } from '../../validators/schemas.js';
import { getViewableProject } from '../projects/projectAccess.js';

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
  const data = req.body as z.infer<typeof createAttachmentSchema>;
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw notFound('Task not found');

  const project = await getViewableProject(task.projectId, req.user!.userId, req.user!.role);
  const role = req.user!.role;
  const userId = req.user!.userId;
  const isManager = role === 'ADMIN' || project.createdById === userId;

  if (!isManager && task.assigneeId !== userId) {
    throw forbidden('You can only add attachments to tasks assigned to you');
  }

  const attachment = await prisma.attachment.create({
    data: {
      filename: data.filename,
      mimeType: data.mimeType,
      size: data.size,
      url: data.url,
      taskId,
      uploadedById: userId,
    },
    include: { uploadedBy: { select: { id: true, name: true } } },
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
