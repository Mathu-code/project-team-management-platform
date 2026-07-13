'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getToken, getStoredUser, clearSession } from '@/lib/auth';
import { User, Role } from '@/lib/types';
import { RoleBadge } from './badges';

function navItems(role: Role) {
  const items: { href: string; label: string }[] = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/projects', label: 'Projects' },
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

  function logout() {
    clearSession();
    router.replace('/login');
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
    </div>
  );
}
