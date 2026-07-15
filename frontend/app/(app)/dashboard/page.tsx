'use client';

import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { DashboardStats, GlobalAnalytics, ProjectAnalytics, Project, TASK_STATUSES, TASK_PRIORITIES, Notification } from '@/lib/types';
import { Badge } from '@/components/badges';

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
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

const priorityColors: Record<string, string> = {
  LOW: 'bg-slate-400',
  MEDIUM: 'bg-sky-400',
  HIGH: 'bg-orange-400',
  URGENT: 'bg-red-400',
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<GlobalAnalytics | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectAnalytics, setProjectAnalytics] = useState<ProjectAnalytics | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<DashboardStats>('/dashboard')
      .then((d) => {
        setData(d);
        return api.get<GlobalAnalytics>('/dashboard/analytics');
      })
      .then((a) => setAnalytics(a))
      .then(() => api.get<{ notifications: Notification[] }>('/notifications?limit=5'))
      .then((n) => setNotifications(n.notifications))
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Failed to load'));
  }, []);

  useEffect(() => {
    if (!data) return;
    api.get<{ projects: Project[] }>('/projects').then((r) => setProjects(r.projects)).catch(() => {});
  }, [data]);

  async function loadProjectAnalytics(projectId: string) {
    try {
      const a = await api.get<ProjectAnalytics>(`/dashboard/projects/${projectId}/analytics`);
      setProjectAnalytics(a);
    } catch {
      setProjectAnalytics(null);
    }
  }

  if (error) return <div className="rounded-md bg-red-50 p-3 text-red-700">{error}</div>;
  if (!data || !analytics) return <div className="text-slate-400">Loading…</div>;

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

      {/* Analytics Section */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Status Chart */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800">Tasks by Status</h2>
          <div className="mt-4 space-y-3">
            {TASK_STATUSES.map((s) => {
              const count = analytics.tasksByStatus[s] || 0;
              const max = Math.max(...Object.values(analytics.tasksByStatus), 1);
              const pct = (count / max) * 100;
              return (
                <div key={s} className="flex items-center gap-3">
                  <span className="w-24 text-sm text-slate-600">{labels[s]}</span>
                  <div className="flex-1 rounded-full bg-slate-100 h-4 overflow-hidden">
                    <div className="h-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 text-right text-sm text-slate-700">{count}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Priority Chart */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800">Tasks by Priority</h2>
          <div className="mt-4 space-y-3">
            {TASK_PRIORITIES.map((p) => {
              const count = analytics.tasksByPriority[p] || 0;
              const max = Math.max(...Object.values(analytics.tasksByPriority), 1);
              const pct = (count / max) * 100;
              return (
                <div key={p} className="flex items-center gap-3">
                  <span className="w-24 text-sm text-slate-600">{labels[p]}</span>
                  <div className="flex-1 rounded-full bg-slate-100 h-4 overflow-hidden">
                    <div className={`h-full ${priorityColors[p]} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 text-right text-sm text-slate-700">{count}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Completion Rate */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800">Completion Rate</h2>
          <div className="mt-4 flex items-center gap-4">
            <div className="relative h-24 w-24">
              <svg viewBox="0 0 36 36" className="h-full w-full">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="4"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#0d9488"
                  strokeWidth="4"
                  strokeDasharray={`${analytics.completionRate}, 100`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-800">
                {analytics.completionRate}%
              </div>
            </div>
            <div className="text-sm text-slate-600">
              <div>{analytics.completed} of {analytics.total} tasks completed</div>
              <div className="mt-1 text-red-600">{analytics.overdue} overdue</div>
            </div>
          </div>
        </section>

        {/* Assignee breakdown */}
        {Object.keys(analytics.byAssignee).length > 0 && (
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-800">Tasks by Assignee</h2>
            <ul className="mt-4 space-y-2">
              {Object.entries(analytics.byAssignee).map(([id, info]) => (
                <li key={id} className="flex items-center justify-between rounded-md bg-slate-50 p-3 text-sm">
                  <span className="font-medium text-slate-800">{info.name}</span>
                  <span className="text-slate-600">{info.count} tasks</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* Project Analytics Selector */}
      {projects.length > 0 && (
        <div className="mt-8">
          <h2 className="font-semibold text-slate-800">Project Analytics</h2>
          <select
            value={selectedProject?.id ?? ''}
            onChange={(e) => {
              const pid = e.target.value;
              if (pid) {
                const p = projects.find((pr) => pr.id === pid) || null;
                setSelectedProject(p);
                if (p) loadProjectAnalytics(p.id);
                else setProjectAnalytics(null);
              }
            }}
            className="mt-2 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          >
            <option value="">Select a project…</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {projectAnalytics && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-2xl font-bold text-brand-700">{projectAnalytics.total}</div>
                <div className="text-sm text-slate-500">Total Tasks</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-2xl font-bold text-emerald-700">{projectAnalytics.completed}</div>
                <div className="text-sm text-slate-500">Completed</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-2xl font-bold text-red-700">{projectAnalytics.overdue}</div>
                <div className="text-sm text-slate-500">Overdue</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-2xl font-bold text-brand-700">{projectAnalytics.completionRate}%</div>
                <div className="text-sm text-slate-500">Completion Rate</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
