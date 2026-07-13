import { Request, Response } from 'express';
import { prisma } from '../db/prisma.js';
import { comparePassword, hashPassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';
import { badRequest, unauthorized, notFound } from '../utils/httpError.js';
import { loginSchema } from '../validators/schemas.js';

function publicUser(user: { id: string; email: string; name: string; role: string; isActive: boolean; createdAt: Date }) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as z.infer<typeof loginSchema>;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    throw unauthorized('Invalid credentials');
  }
  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) {
    throw unauthorized('Invalid credentials');
  }
  const token = signToken({ userId: user.id, role: user.role });
  res.json({ token, user: publicUser(user) });
}

export async function getMe(req: Request, res: Response) {
  if (!req.user) throw unauthorized();
  const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
  if (!user) throw notFound('User not found');
  res.json({ user: publicUser(user) });
}

export async function changePassword(req: Request, res: Response) {
  if (!req.user) throw unauthorized();
  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
  };
  if (!currentPassword || !newPassword) {
    throw badRequest('currentPassword and newPassword are required');
  }
  if (newPassword.length < 8) {
    throw badRequest('New password must be at least 8 characters');
  }
  const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
  if (!user) throw notFound('User not found');
  const ok = await comparePassword(currentPassword, user.passwordHash);
  if (!ok) throw badRequest('Current password is incorrect');
  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  res.json({ message: 'Password updated successfully' });
}
