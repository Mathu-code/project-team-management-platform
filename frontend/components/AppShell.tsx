'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getToken, getStoredUser, clearSession } from '@/lib/auth';
import { User, Role, Notification } from '@/lib/types';
import { api, ApiError } from '@/lib/api';
import { Badge, RoleBadge } from './badges';

function navItems(role: Role) {
  const items: { href: string; label: string }[] = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/projects', label: 'Projects' },
    { href: '/search', label: 'Search' },
  ];
  if (role === 'TEAM_MEMBER') {
    items.push({ href: '/my-tasks', label: 'My Tasks' });
  }
  if (role === 'ADMIN') {
    items.push({ href: '/users', label: 'Users' });
  }
  return items;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const token = getToken();
    const stored = getStoredUser<User>();
    if (!token || !stored) {
      router.replace('/login');
      return;
    }
    setUser(stored);
    setReady(true);
  }, [router]);

  useEffect(() => {
    if (!user) return;
    api.get<{ notifications: Notification[] }>('/notifications?read=false').then((data) => {
      setNotifications(data.notifications);
      setUnreadCount(data.notifications.length);
    }).catch(() => {});
  }, [user]);

  function logout() {
    clearSession();
    router.replace('/login');
  }

  async function markRead(id: string) {
    await api.patch(`/notifications/${id}/read`);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  async function markAllRead() {
    await api.patch('/notifications/read-all');
    setNotifications([]);
    setUnreadCount(0);
  }

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400">
        Loading…
      </div>
    );
  }

  const items = navItems(user.role);

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 flex-col border-r border-slate-200 bg-white">
        <div className="flex h-16 items-center px-6 text-lg font-bold text-brand-700">
          PTMP
        </div>
        <nav className="flex-1 space-y-1 px-3 py-2">
          {items.map((it) => {
            const active = pathname === it.href;
            return (
              <Link
                key={it.href}
                href={it.href}
                className={
                  'block rounded-md px-3 py-2 text-sm font-medium ' +
                  (active
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-50')
                }
              >
                {it.label}
              </Link>
            );
          })}
          <button
            onClick={() => setShowNotifications((v) => !v)}
            className="relative flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-semibold text-white">
                {unreadCount}
              </span>
            )}
          </button>
        </nav>
        <div className="border-t border-slate-200 p-4">
          <div className="mb-2 text-sm">
            <div className="font-medium text-slate-800">{user.name}</div>
            <div className="text-xs text-slate-500">{user.email}</div>
            <div className="mt-1">
              <RoleBadge role={user.role} />
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8">{children}</main>

      {/* Notification panel */}
      {showNotifications && (
        <div className="fixed inset-0 z-50" onClick={() => setShowNotifications(false)}>
          <div className="absolute right-0 top-0 h-full w-80 max-w-full border-l border-slate-200 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
              <h3 className="font-semibold text-slate-800">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-brand-600 hover:underline">Mark all read</button>
                )}
                <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>
            </div>
            <div className="h-full overflow-auto p-4">
              {notifications.length === 0 && <p className="text-sm text-slate-500">No unread notifications.</p>}
              <ul className="space-y-3">
                {notifications.map((n) => (
                  <li key={n.id} className="rounded-md border border-slate-100 p-3 text-sm hover:bg-slate-50">
                    <div className="font-medium text-slate-800">{n.title}</div>
                    <p className="mt-1 text-slate-600">{n.message}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</span>
                      <button onClick={() => markRead(n.id)} className="text-xs text-brand-600 hover:underline">Dismiss</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
