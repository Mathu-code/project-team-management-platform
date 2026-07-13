'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { getStoredUser } from '@/lib/auth';
import { Project, User, ProjectStatus, PROJECT_STATUSES } from '@/lib/types';
import { Badge } from '@/components/badges';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('PLANNING');
  const [saving, setSaving] = useState(false);
  const user = getStoredUser<User>();

  const canCreate = user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER';

  async function load() {
    try {
      const data = await api.get<{ projects: Project[] }>('/projects');
      setProjects(data.projects);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load projects');
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.post('/projects', { name, description, status });
      setName('');
      setDescription('');
      setStatus('PLANNING');
      setShowForm(false);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to create project');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Projects</h1>
        {canCreate && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            New Project
          </button>
        )}
      </div>

      {error && <div className="mt-4 rounded-md bg-red-50 p-3 text-red-700">{error}</div>}

      {showForm && (
        <form onSubmit={create} className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-slate-700">Name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none">
              {PROJECT_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <button disabled={saving}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
            {saving ? 'Saving…' : 'Create'}
          </button>
        </form>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <Link key={p.id} href={`/projects/${p.id}`}
            className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-brand-300">
            <div className="flex items-start justify-between">
              <h2 className="font-semibold text-slate-800">{p.name}</h2>
              <Badge label={p.status} kind="project" />
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-slate-500">{p.description ?? 'No description'}</p>
            <div className="mt-4 flex gap-4 text-xs text-slate-500">
              <span>{p._count?.tasks ?? 0} tasks</span>
              <span>{p._count?.members ?? 0} members</span>
            </div>
          </Link>
        ))}
        {projects.length === 0 && (
          <p className="text-sm text-slate-500">No projects yet.</p>
        )}
      </div>
    </div>
  );
}
