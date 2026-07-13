'use client';

import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { DashboardStats } from '@/lib/types';

const labels: Record<string, string> = {
  users: 'Users',
  projects: 'Projects',
  tasks: 'Tasks',
  assignedTasks: 'My Tasks',
  overdueTasks: 'Overdue Tasks',
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  REVIEW: 'In Review',
  DONE: 'Done',
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<DashboardStats>('/dashboard')
      .then(setData)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Failed to load'));
  }, []);

  if (error) return <div className="rounded-md bg-red-50 p-3 text-red-700">{error}</div>;
  if (!data) return <div className="text-slate-400">Loading…</div>;

  // Flatten nested objects (e.g. tasksByStatus) into individual numeric cards.
  const cards: { key: string; value: number }[] = [];
  for (const [key, value] of Object.entries(data.stats)) {
    if (typeof value === 'number') {
      cards.push({ key, value });
    } else if (value && typeof value === 'object') {
      for (const [subKey, subValue] of Object.entries(value as Record<string, number>)) {
        cards.push({ key: subKey, value: subValue });
      }
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">
        Overview for your role: <span className="font-medium">{data.role.replace(/_/g, ' ')}</span>
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map(({ key, value }) => (
          <div key={key} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-3xl font-bold text-brand-700">{value}</div>
            <div className="mt-1 text-sm text-slate-500">{labels[key] ?? key}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
