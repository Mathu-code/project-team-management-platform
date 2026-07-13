import { Request, Response } from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { hashPassword } from '../utils/password.js';
import { conflict, notFound } from '../utils/httpError.js';
import {
  createUserSchema,
  updateUserSchema,
  idParamSchema,
} from '../validators/schemas.js';

function publicUser(u: {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
}) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    isActive: u.isActive,
    createdAt: u.createdAt,
  };
}

export async function listUsers(_req: Request, res: Response) {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
  res.json({ users });
}

export async function getUser(req: Request, res: Response) {
  const { id } = req.params as z.infer<typeof idParamSchema>;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw notFound('User not found');
  res.json({ user: publicUser(user) });
}

export async function createUser(req: Request, res: Response) {
  const data = req.body as z.infer<typeof createUserSchema>;
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw conflict('Email already in use');
  const passwordHash = await hashPassword(data.password);
  const user = await prisma.user.create({
    data: { email: data.email, name: data.name, role: data.role, passwordHash },
  });
  res.status(201).json({ user: publicUser(user) });
}

export async function updateUser(req: Request, res: Response) {
  const { id } = req.params as z.infer<typeof idParamSchema>;
  const data = req.body as z.infer<typeof updateUserSchema>;
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw notFound('User not found');

  if (data.email && data.email !== existing.email) {
    const dup = await prisma.user.findUnique({ where: { email: data.email } });
    if (dup) throw conflict('Email already in use');
  }

  const updateData: Record<string, unknown> = { ...data };
  if (data.password) {
    updateData.passwordHash = await hashPassword(data.password);
    delete updateData.password;
  }

  const user = await prisma.user.update({ where: { id }, data: updateData });
  res.json({ user: publicUser(user) });
}

export async function deleteUser(req: Request, res: Response) {
  const { id } = req.params as z.infer<typeof idParamSchema>;
  if (req.user?.userId === id) {
    res.status(400).json({ error: 'You cannot delete your own account' });
    return;
  }
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw notFound('User not found');
  await prisma.user.delete({ where: { id } });
  res.json({ message: 'User deleted' });
}
