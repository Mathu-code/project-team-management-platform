'use client';

import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { getStoredUser } from '@/lib/auth';
import { User, Role, ROLES } from '@/lib/types';
import { RoleBadge } from '@/components/badges';

export default function UsersPage() {
  const me = getStoredUser<User>();
  const isAdmin = me?.role === 'ADMIN';
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'TEAM_MEMBER' as Role,
  });
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const data = await api.get<{ users: User[] }>('/users');
      setUsers(data.users);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load users');
    }
  }

  useEffect(() => {
    if (isAdmin) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  if (!isAdmin) {
    return <div className="rounded-md bg-red-50 p-3 text-red-700">Admins only.</div>;
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.post('/users', form);
      setForm({ name: '', email: '', password: '', role: 'TEAM_MEMBER' });
      setShowForm(false);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to create user');
    } finally {
      setSaving(false);
    }
  }

  async function updateUser(u: User, patch: Partial<User>) {
    try {
      await api.patch(`/users/${u.id}`, patch);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to update');
    }
  }

  async function remove(u: User) {
    if (u.id === me?.id) return;
    if (!confirm(`Delete ${u.name}?`)) return;
    try {
      await api.delete(`/users/${u.id}`);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to delete');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Users</h1>
        <button onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          New User
        </button>
      </div>

      {error && <div className="mt-4 rounded-md bg-red-50 p-3 text-red-700">{error}</div>}

      {showForm && (
        <form onSubmit={create} className="mt-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">Name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <button disabled={saving}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
              {saving ? 'Saving…' : 'Create User'}
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium text-slate-800">{u.name}</td>
                <td className="px-4 py-3 text-slate-600">{u.email}</td>
                <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                <td className="px-4 py-3">
                  <input type="checkbox" checked={u.isActive}
                    onChange={(e) => updateUser(u, { isActive: e.target.checked })} />
                </td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    disabled={u.id === me?.id}
                    onChange={(e) => updateUser(u, { role: e.target.value as Role })}
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                  >
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  {u.id !== me?.id && (
                    <button onClick={() => remove(u)} className="ml-2 text-xs text-red-600 hover:underline">
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
