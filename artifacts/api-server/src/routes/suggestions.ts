import { Router } from 'express';
import { randomUUID } from 'crypto';
import { db, announcementsTable, playerSuggestionsTable, playersTable } from '@workspace/db';
import { desc, eq } from 'drizzle-orm';
import { verifyPlayerSession } from '../lib/playerSession.js';

const router = Router();

const PATCHABLE_STATUSES = ['open', 'in_progress', 'approved', 'rejected'] as const;
type PatchableStatus = (typeof PATCHABLE_STATUSES)[number];

function requireAdmin(req: any, res: any, next: any) {
  const key = req.headers['x-admin-key'];
  if (!key || key !== process.env['ADMIN_SECRET']) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return next();
}

// ── Submit player suggestion (public — no auth required) ──────────────────────
router.post('/player-suggestions', async (req: any, res: any) => {
  const { title, description, deviceInfo } = req.body as Record<string, unknown>;
  const authorization = req.headers.authorization;
  const token = typeof authorization === 'string' && authorization.startsWith('Bearer ')
    ? authorization.slice(7)
    : '';
  const playerId = token ? verifyPlayerSession(token) : null;

  if (!playerId) {
    return res.status(401).json({ error: 'Valid player session required' });
  }
  if (typeof title !== 'string' || title.trim().length < 3 || title.trim().length > 120) {
    return res.status(400).json({ error: 'Title must be between 3 and 120 characters' });
  }
  if (typeof description !== 'string' || description.trim().length < 10 || description.trim().length > 1000) {
    return res.status(400).json({ error: 'Description must be between 10 and 1000 characters' });
  }
  if (deviceInfo && (typeof deviceInfo !== 'object' || JSON.stringify(deviceInfo).length > 2000)) {
    return res.status(400).json({ error: 'Invalid device information' });
  }

  const id = randomUUID();

  try {
    const players = await db
      .select({ username: playersTable.username, status: playersTable.status })
      .from(playersTable)
      .where(eq(playersTable.playerId, playerId))
      .limit(1);
    const player = players[0];
    if (!player || player.status !== 'active') {
      return res.status(401).json({ error: 'Active player account required' });
    }

    await db.insert(playerSuggestionsTable).values({
      id,
      playerId,
      username: player.username,
      title: title.trim(),
      description: description.trim(),
      deviceInfo: deviceInfo && typeof deviceInfo === 'object' ? deviceInfo : {},
      status: 'open',
    });

    req.log?.info({ id }, 'Player suggestion submitted');
    return res.json({ ok: true, id });
  } catch (err) {
    req.log?.error({ err }, 'Failed to save player suggestion');
    return res.status(500).json({ error: 'Failed to submit player suggestion' });
  }
});

// ── Admin: list player suggestions ────────────────────────────────────────────
router.get('/admin/player-suggestions', requireAdmin, async (req: any, res: any) => {
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;

  try {
    const query = db
      .select()
      .from(playerSuggestionsTable)
      .orderBy(desc(playerSuggestionsTable.createdAt));
    const rows = status && status !== 'all'
      ? await query.where(eq(playerSuggestionsTable.status, status))
      : await query;

    return res.json({ suggestions: rows });
  } catch (err) {
    req.log?.error({ err }, 'Failed to fetch player suggestions');
    return res.status(500).json({ error: 'Failed to fetch player suggestions' });
  }
});

// ── Admin: update player suggestion ──────────────────────────────────────────
router.patch('/admin/player-suggestions/:id', requireAdmin, async (req: any, res: any) => {
  const { id } = req.params as { id: string };
  const { status, adminNotes } = req.body as Record<string, unknown>;

  if (status !== undefined &&
      (typeof status !== 'string' || !PATCHABLE_STATUSES.includes(status as PatchableStatus))) {
    return res.status(400).json({
      error: `status must be one of: ${PATCHABLE_STATUSES.join(', ')}`,
    });
  }
  if (adminNotes !== undefined && adminNotes !== null && typeof adminNotes !== 'string') {
    return res.status(400).json({ error: 'adminNotes must be a string or null' });
  }

  const updates: {
    status?: PatchableStatus;
    adminNotes?: string | null;
    updatedAt: Date;
  } = { updatedAt: new Date() };
  if (status !== undefined) updates.status = status as PatchableStatus;
  if (adminNotes !== undefined) {
    updates.adminNotes = typeof adminNotes === 'string' ? adminNotes.trim() : null;
  }

  try {
    const rows = await db
      .update(playerSuggestionsTable)
      .set(updates)
      .where(eq(playerSuggestionsTable.id, id))
      .returning();
    if (!rows[0]) return res.status(404).json({ error: 'Player suggestion not found' });
    return res.json({ ok: true, suggestion: rows[0] });
  } catch (err) {
    req.log?.error({ err, id }, 'Failed to update player suggestion');
    return res.status(500).json({ error: 'Failed to update player suggestion' });
  }
});

// ── Admin: announce a player suggestion ───────────────────────────────────────
router.post('/admin/player-suggestions/:id/announce', requireAdmin, async (req: any, res: any) => {
  const { id } = req.params as { id: string };
  const { title, body } = req.body as { title?: unknown; body?: unknown };

  if (typeof title !== 'string' || !title.trim() ||
      typeof body !== 'string' || !body.trim()) {
    return res.status(400).json({ error: 'title and body are required' });
  }

  try {
    const result = await db.transaction(async (tx) => {
      const suggestions = await tx
        .select()
        .from(playerSuggestionsTable)
        .where(eq(playerSuggestionsTable.id, id))
        .limit(1)
        .for('update');
      const suggestion = suggestions[0];
      if (!suggestion) return null;
      if (suggestion.status === 'announced' || suggestion.announcementId) {
        return { alreadyAnnounced: true, announcementId: suggestion.announcementId };
      }
      if (suggestion.status !== 'approved') {
        return { notApproved: true };
      }

      const announcementId = randomUUID();
      const announcedAt = new Date();
      await tx.insert(announcementsTable).values({
        id: announcementId,
        title: title.trim(),
        body: body.trim(),
        postedBy: 'Dev Team',
        pinned: true,
      });
      await tx
        .update(playerSuggestionsTable)
        .set({ status: 'announced', announcementId, announcedAt, updatedAt: announcedAt })
        .where(eq(playerSuggestionsTable.id, id));

      return { alreadyAnnounced: false, announcementId };
    });

    if (!result) return res.status(404).json({ error: 'Player suggestion not found' });
    if (result.alreadyAnnounced) {
      return res.status(409).json({ error: 'Player suggestion has already been announced', announcementId: result.announcementId });
    }
    if ('notApproved' in result && result.notApproved) {
      return res.status(409).json({ error: 'Player suggestion must be approved before it can be announced' });
    }
    return res.json({ ok: true, success: true, announcementId: result.announcementId });
  } catch (err) {
    req.log?.error({ err, id }, 'Failed to announce player suggestion');
    return res.status(500).json({ error: 'Failed to announce player suggestion' });
  }
});

export default router;