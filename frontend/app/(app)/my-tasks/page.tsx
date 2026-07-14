'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { getStoredUser } from '@/lib/auth';
import { Task, User, TaskStatus, TaskPriority, TASK_STATUSES, TASK_PRIORITIES } from '@/lib/types';
import { Badge } from '@/components/badges';

export default function MyTasksPage() {
  const user = getStoredUser<User>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | ''>('');
  const [searchFilter, setSearchFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showOverdue, setShowOverdue] = useState(false);

  async function load() {
    try {
      const q: Record<string, string> = {};
      if (statusFilter) q.status = statusFilter;
      if (priorityFilter) q.priority = priorityFilter;
      if (searchFilter) q.search = searchFilter;
      if (sortBy) q.sortBy = sortBy;
      if (sortOrder) q.sortOrder = sortOrder;
      if (showOverdue) q.overdue = 'true';
      const data = await api.get<{ tasks: Task[] }>('/tasks/mine', q);
      setTasks(data.tasks);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load tasks');
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, priorityFilter, searchFilter, sortBy, sortOrder, showOverdue]);

  async function update(id: string, status: TaskStatus) {
    setUpdating(id);
    try {
      const data = await api.patch<{ task: Task }>(`/tasks/${id}`, { status });
      setTasks((prev) => prev.map((t) => (t.id === id ? data.task : t)));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to update');
    } finally {
      setUpdating(null);
    }
  }

  const isOverdue = (t: Task) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE';

  if (error) return <div className="rounded-md bg-red-50 p-3 text-red-700">{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">My Tasks</h1>
      <p className="mt-1 text-sm text-slate-500">Tasks assigned to you across all projects.</p>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as TaskStatus | '')}
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
          <option value="">All Statuses</option>
          {TASK_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | '')}
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
          <option value="">All Priorities</option>
          {TASK_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <input
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          placeholder="Search tasks..."
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
          <option value="createdAt">Sort: Created</option>
          <option value="dueDate">Sort: Due Date</option>
          <option value="priority">Sort: Priority</option>
          <option value="status">Sort: Status</option>
        </select>
        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm">
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </select>
        <label className="flex items-center gap-1 text-sm text-slate-600">
          <input type="checkbox" checked={showOverdue} onChange={(e) => setShowOverdue(e.target.checked)} />
          Overdue
        </label>
      </div>

      <div className="mt-6 space-y-3">
        {tasks.map((t) => (
          <div key={t.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <Link href={`/projects/${t.projectId}`} className="font-medium text-slate-800 hover:text-brand-700">
                  {t.title}
                </Link>
                {isOverdue(t) && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Overdue</span>
                )}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <Badge label={t.priority} kind="priority" />
                <span className="text-xs text-slate-400">{t.project?.name}</span>
                {t.dueDate && (
                  <span className="text-xs text-slate-400">Due: {new Date(t.dueDate).toLocaleDateString()}</span>
                )}
              </div>
            </div>
            <select
              value={t.status}
              disabled={updating === t.id}
              onChange={(e) => update(t.id, e.target.value as TaskStatus)}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            >
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        ))}
        {tasks.length === 0 && <p className="text-sm text-slate-500">No tasks match the current filters.</p>}
      </div>
    </div>
  );
}
