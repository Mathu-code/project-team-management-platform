'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { getStoredUser } from '@/lib/auth';
import { Task, User, TaskStatus, TASK_STATUSES } from '@/lib/types';
import { Badge } from '@/components/badges';

export default function MyTasksPage() {
  const user = getStoredUser<User>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  async function load() {
    try {
      const data = await api.get<{ tasks: Task[] }>('/tasks/mine');
      setTasks(data.tasks);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load tasks');
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  if (error) return <div className="rounded-md bg-red-50 p-3 text-red-700">{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">My Tasks</h1>
      <p className="mt-1 text-sm text-slate-500">Tasks assigned to you across all projects.</p>

      <div className="mt-6 space-y-3">
        {tasks.map((t) => (
          <div key={t.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div>
              <Link href={`/projects/${t.projectId}`} className="font-medium text-slate-800 hover:text-brand-700">
                {t.title}
              </Link>
              <div className="mt-1 flex items-center gap-2">
                <Badge label={t.priority} kind="priority" />
                <span className="text-xs text-slate-400">{t.project?.name}</span>
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
        {tasks.length === 0 && <p className="text-sm text-slate-500">No tasks assigned to you.</p>}
      </div>
    </div>
  );
}
