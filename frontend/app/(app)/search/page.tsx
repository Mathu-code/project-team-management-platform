'use client';

import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { User, Project, TASK_STATUSES, TASK_PRIORITIES } from '@/lib/types';
import { Badge } from '@/components/badges';

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [type, setType] = useState<'users' | 'projects' | 'all'>('all');
  const [results, setResults] = useState<{ users: User[]; projects: Project[] }>({ users: [], projects: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function doSearch(term: string) {
    if (!term.trim()) {
      setResults({ users: [], projects: [] });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<{ users: User[]; projects: Project[] }>('/search', { q: term, type });
      setResults(data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => doSearch(q), 300);
    return () => clearTimeout(timer);
  }, [q, type]);

  if (error) return <div className="rounded-md bg-red-50 p-3 text-red-700">{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Search</h1>
      <p className="mt-1 text-sm text-slate-500">Find users and projects across the platform.</p>

      <div className="mt-4 flex gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search users or projects..."
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as 'users' | 'projects' | 'all')}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="all">All</option>
          <option value="users">Users</option>
          <option value="projects">Projects</option>
        </select>
      </div>

      {loading && <p className="mt-4 text-sm text-slate-400">Searching…</p>}

      {(results.users.length > 0 || results.projects.length > 0) && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {results.users.length > 0 && (
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-slate-800">Users</h2>
              <ul className="mt-3 space-y-2">
                {results.users.map((u) => (
                  <li key={u.id} className="flex items-center justify-between rounded-md bg-slate-50 p-3 text-sm">
                    <div>
                      <div className="font-medium text-slate-800">{u.name}</div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                    </div>
                    <span className="text-xs text-slate-400">{u.role.replace(/_/g, ' ')}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {results.projects.length > 0 && (
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-slate-800">Projects</h2>
              <ul className="mt-3 space-y-2">
                {results.projects.map((p) => (
                  <li key={p.id} className="rounded-md bg-slate-50 p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-800">{p.name}</span>
                      <Badge label={p.status} kind="project" />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{p.description ?? 'No description'}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {!loading && q && results.users.length === 0 && results.projects.length === 0 && (
        <p className="mt-6 text-sm text-slate-500">No results found.</p>
      )}
    </div>
  );
}
