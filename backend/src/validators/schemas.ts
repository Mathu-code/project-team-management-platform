import { z } from 'zod';
import { Role, ProjectStatus, TaskStatus, TaskPriority, MemberRole, NotificationType } from '@prisma/client';

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export const createUserSchema = z.object({
  email: z.string().email('Invalid email'),
  name: z.string().min(1, 'Name is required').max(120),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .max(100)
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[a-z]/, 'Must contain a lowercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  role: z.nativeEnum(Role),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  email: z.string().email('Invalid email').optional(),
  role: z.nativeEnum(Role).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).max(100).optional(),
});

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(160),
  description: z.string().max(2000).optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(160).optional(),
  description: z.string().max(2000).optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
});

export const addMemberSchema = z.object({
  userId: z.string().min(1),
  role: z.nativeEnum(MemberRole).optional(),
});

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  assigneeId: z.string().min(1).optional().nullable(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  assigneeId: z.string().min(1).optional().nullable(),
});

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(2000),
});

export const createAttachmentSchema = z.object({
  filename: z.string().min(1, 'Filename is required').max(255),
  mimeType: z.string().min(1, 'Mime type is required').max(100),
  size: z.number().int().positive('Size must be positive'),
  url: z.string().url('Invalid URL'),
});

export const idParamSchema = z.object({
  id: z.string().min(1),
});

export const projectIdParamSchema = z.object({
  projectId: z.string().min(1),
});

export const taskIdParamSchema = z.object({
  taskId: z.string().min(1),
});

export const memberIdParamSchema = z.object({
  projectId: z.string().min(1),
  userId: z.string().min(1),
});

export const taskListQuerySchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  assigneeId: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'dueDate', 'priority', 'status']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  overdue: z.enum(['true', 'false']).optional(),
});

export const myTasksQuerySchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'dueDate', 'priority', 'status']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  overdue: z.enum(['true', 'false']).optional(),
});

export const notificationsQuerySchema = z.object({
  read: z.enum(['true', 'false']).optional(),
  type: z.nativeEnum(NotificationType).optional(),
});

export const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  type: z.enum(['users', 'projects', 'all']).optional(),
});

export const analyticsQuerySchema = z.object({
  range: z.enum(['7d', '30d', '90d']).optional(),
});
