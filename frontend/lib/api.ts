'use client';

import { getToken } from './auth';

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:4000/api';

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(
      res.status,
      body?.error ?? 'Request failed',
      body?.details,
    );
  }
  return body as T;
}

export const api = {
  get: <T,>(path: string, query?: Record<string, string | number | boolean | undefined>) => {
    const qs = query
      ? '?' + new URLSearchParams(
          Object.entries(query).filter(([, v]) => v !== undefined && v !== '').reduce((a, [k, v]) => ({ ...a, [k]: String(v) }), {} as Record<string, string>)
        ).toString()
      : '';
    return request<T>(`${path}${qs}`);
  },
  post: <T,>(path: string, data?: unknown) =>
    request<T>(path, { method: 'POST', body: data ? JSON.stringify(data) : undefined }),
  patch: <T,>(path: string, data?: unknown) =>
    request<T>(path, { method: 'PATCH', body: data ? JSON.stringify(data) : undefined }),
  delete: <T,>(path: string) => request<T>(path, { method: 'DELETE' }),
};
