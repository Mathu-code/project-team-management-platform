export type Role = 'ADMIN' | 'PROJECT_MANAGER' | 'TEAM_MEMBER';

export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type MemberRole = 'MANAGER' | 'MEMBER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  startDate: string | null;
  endDate: string | null;
  createdById: string;
  createdBy?: { id: string; name: string; email?: string };
  createdAt: string;
  updatedAt: string;
  _count?: { tasks: number; members: number };
  members?: ProjectMember[];
  tasks?: Task[];
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: MemberRole;
  assignedAt: string;
  user: User;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  projectId: string;
  assigneeId: string | null;
  assignee?: { id: string; name: string } | null;
  createdBy?: { id: string; name: string };
  project?: { id: string; name: string };
  createdById: string;
  createdAt: string;
  updatedAt: string;
  comments?: Comment[];
}

export interface Comment {
  id: string;
  content: string;
  taskId: string;
  userId: string;
  user: { id: string; name: string };
  createdAt: string;
}

export interface DashboardStats {
  role: Role;
  stats: Record<string, number>;
}

export const PROJECT_STATUSES: ProjectStatus[] = ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED'];
export const TASK_STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];
export const TASK_PRIORITIES: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
export const ROLES: Role[] = ['ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER'];
