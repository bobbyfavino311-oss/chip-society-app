const BASE = '/api';

export function adminHeaders(): Record<string, string> {
  const key = localStorage.getItem('admin_key') ?? '';
  return { 'Content-Type': 'application/json', 'x-admin-key': key };
}

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: adminHeaders(),
    body: body != null ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as any).error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

export const api = {
  stats:          ()                          => req<any>('GET',  '/admin/stats'),
  players:        (q?: string, status?: string) => req<any>('GET',  `/admin/players?q=${q??''}&status=${status??'all'}`),
  player:         (id: string)                => req<any>('GET',  `/admin/players/${id}`),
  adjustChips:    (id: string, b: any)        => req<any>('POST', `/admin/players/${id}/chips`, b),
  setStatus:      (id: string, b: any)        => req<any>('POST', `/admin/players/${id}/status`, b),
  reports:        (status?: string)           => req<any>('GET',  `/admin/reports?status=${status??'open'}`),
  resolveReport:  (id: string, b: any)        => req<any>('PUT',  `/admin/reports/${id}`, b),
};
