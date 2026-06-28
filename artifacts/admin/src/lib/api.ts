const BASE = 'https://api-server-production-bbc2.up.railway.app/api';

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
  stats:             ()                            => req<any>('GET',  '/admin/stats'),
  players:           (q?: string, status?: string) => req<any>('GET',  `/admin/players?q=${q??''}&status=${status??'all'}`),
  player:            (id: string)                  => req<any>('GET',  `/admin/players/${id}`),
  adjustChips:       (id: string, b: any)          => req<any>('POST', `/admin/players/${id}/chips`, b),
  giveBonus:         (id: string, b: any)          => req<any>('POST', `/admin/players/${id}/bonus`, b),
  setStatus:         (id: string, b: any)          => req<any>('POST', `/admin/players/${id}/status`, b),
  warn:              (id: string, b: any)          => req<any>('POST', `/admin/players/${id}/warn`, b),
  suspend:           (id: string, b: any)          => req<any>('POST', `/admin/players/${id}/suspend`, b),
  ban:               (id: string, b: any)          => req<any>('POST', `/admin/players/${id}/ban`, b),
  unban:             (id: string)                  => req<any>('POST', `/admin/players/${id}/unban`, {}),
  unwarn:            (id: string)                  => req<any>('POST', `/admin/players/${id}/unwarn`, {}),
  moderationHistory: ()                            => req<any>('GET',  '/admin/moderation'),
  reports:           (status?: string)             => req<any>('GET',  `/admin/reports?status=${status??'open'}`),
  resolveReport:     (id: string, b: any)          => req<any>('PUT',  `/admin/reports/${id}`, b),
  bugReports:        (status?: string, category?: string) => req<any>('GET', `/admin/bug-reports?status=${status??'all'}&category=${category??'all'}`),
  updateBugReport:   (id: string, b: any)          => req<any>('PATCH', `/admin/bug-reports/${id}`, b),
  toggleFounder:        (id: string, isFounder: boolean) => req<any>('PUT',    `/admin/players/${id}/founder`, { isFounder }),
  getAnnouncements:     ()                              => req<any>('GET',    '/admin/announcements'),
  postAnnouncement:     (b: { title: string; body: string }) => req<any>('POST', '/admin/announcements', b),
  deleteAnnouncement:   (id: string)                    => req<any>('DELETE', `/admin/announcements/${id}`),
};
