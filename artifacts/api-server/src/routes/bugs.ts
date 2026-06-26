import { Router } from 'express';
import { randomUUID } from 'crypto';
import { db, bugReportsTable } from '@workspace/db';
import { eq, desc } from 'drizzle-orm';

const router = Router();

function requireAdmin(req: any, res: any, next: any) {
  const key = req.headers['x-admin-key'];
  if (!key || key !== process.env['ADMIN_KEY']) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return next();
}

// ── Submit bug report (public — no auth required) ──────────────────────────
router.post('/bug-reports', async (req: any, res: any) => {
  const { category, title, description, deviceInfo, playerId, username } = req.body as Record<string, any>;

  if (!title?.trim() || !description?.trim()) {
    return res.status(400).json({ error: 'Title and description are required' });
  }

  const id = randomUUID();

  try {
    await db.insert(bugReportsTable).values({
      id,
      playerId: playerId || null,
      username: username || 'Anonymous',
      category: category || 'other',
      title: title.trim(),
      description: description.trim(),
      deviceInfo: deviceInfo || {},
      status: 'open',
      priority: 'medium',
    });

    req.log?.info({ id, category }, 'Bug report submitted');
    return res.json({ ok: true, id });
  } catch (err) {
    req.log?.error({ err }, 'Failed to save bug report');
    return res.status(500).json({ error: 'Failed to submit bug report' });
  }
});

// ── Admin: list bug reports ────────────────────────────────────────────────
router.get('/admin/bug-reports', requireAdmin, async (req: any, res: any) => {
  const { status, category } = req.query as Record<string, string>;

  try {
    const all = await db
      .select()
      .from(bugReportsTable)
      .orderBy(desc(bugReportsTable.createdAt));

    const filtered = all.filter(r => {
      if (status && status !== 'all' && r.status !== status) return false;
      if (category && category !== 'all' && r.category !== category) return false;
      return true;
    });

    return res.json({ reports: filtered });
  } catch (err) {
    req.log?.error({ err }, 'Failed to fetch bug reports');
    return res.status(500).json({ error: 'Failed to fetch bug reports' });
  }
});

// ── Admin: update bug report ───────────────────────────────────────────────
router.patch('/admin/bug-reports/:id', requireAdmin, async (req: any, res: any) => {
  const { id } = req.params as { id: string };
  const { status, priority, adminNotes } = req.body as Record<string, any>;

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (status)              updates['status']     = status;
  if (priority)            updates['priority']   = priority;
  if (adminNotes !== undefined) updates['adminNotes'] = adminNotes;

  try {
    await db.update(bugReportsTable).set(updates as any).where(eq(bugReportsTable.id, id));
    return res.json({ ok: true });
  } catch (err) {
    req.log?.error({ err }, 'Failed to update bug report');
    return res.status(500).json({ error: 'Failed to update bug report' });
  }
});

export default router;
