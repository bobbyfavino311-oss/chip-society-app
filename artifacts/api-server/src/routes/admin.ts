import { Router } from 'express';
import { db, playersTable, chipTransactionsTable, playerReportsTable, playerNotificationsTable, moderationActionsTable } from '@workspace/db';
import { eq, or, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { emitToPlayer } from '../sockets/index.js';

const router = Router();

// ── Admin auth middleware ─────────────────────────────────────────────────────
function requireAdmin(req: any, res: any, next: any) {
  const key = req.headers['x-admin-key'];
  if (!key || key !== process.env['ADMIN_SECRET']) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

router.use('/admin', requireAdmin);

// ── GET /api/admin/players ────────────────────────────────────────────────────
router.get('/admin/players', async (req, res) => {
  try {
    const q = (req.query['q'] as string | undefined)?.trim() ?? '';
    const status = (req.query['status'] as string | undefined) ?? 'all';

    let rows = await db
      .select({
        playerId:   playersTable.playerId,
        username:   playersTable.username,
        email:      playersTable.email,
        status:     playersTable.status,
        banReason:  playersTable.banReason,
        profileJson: playersTable.profileJson,
        createdAt:  playersTable.createdAt,
        updatedAt:  playersTable.updatedAt,
      })
      .from(playersTable)
      .orderBy(desc(playersTable.createdAt));

    if (q) {
      rows = rows.filter(r =>
        r.username.toLowerCase().includes(q.toLowerCase()) ||
        r.email.toLowerCase().includes(q.toLowerCase())
      );
    }
    if (status !== 'all') {
      rows = rows.filter(r => r.status === status);
    }

    res.json({ players: rows, total: rows.length });
  } catch (e) {
    req.log.error(e, 'admin/players list error');
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/admin/players/:id ────────────────────────────────────────────────
router.get('/admin/players/:id', async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(playersTable)
      .where(eq(playersTable.playerId, req.params['id']!))
      .limit(1);

    if (!rows.length) { res.status(404).json({ error: 'Player not found' }); return; }

    const txs = await db
      .select()
      .from(chipTransactionsTable)
      .where(eq(chipTransactionsTable.playerId, req.params['id']!))
      .orderBy(desc(chipTransactionsTable.createdAt))
      .limit(50);

    const reports = await db
      .select()
      .from(playerReportsTable)
      .where(eq(playerReportsTable.reportedId, req.params['id']!))
      .orderBy(desc(playerReportsTable.createdAt));

    res.json({ player: rows[0], transactions: txs, reports });
  } catch (e) {
    req.log.error(e, 'admin/player detail error');
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/admin/players/:id/chips ─────────────────────────────────────────
router.post('/admin/players/:id/chips', async (req, res) => {
  try {
    const { type, amount, note } = req.body as {
      type: 'refund' | 'bonus' | 'deduction' | 'adjustment';
      amount: number;
      note: string;
    };

    if (!type || amount == null || !note) {
      res.status(400).json({ error: 'type, amount, and note are required' });
      return;
    }

    const rows = await db
      .select()
      .from(playersTable)
      .where(eq(playersTable.playerId, req.params['id']!))
      .limit(1);

    if (!rows.length) { res.status(404).json({ error: 'Player not found' }); return; }

    const player = rows[0]!;
    const profile = player.profileJson as Record<string, unknown>;
    const currentChips = typeof profile['chips'] === 'number' ? profile['chips'] : 0;
    const delta = (type === 'deduction') ? -Math.abs(amount) : Math.abs(amount);
    const newBalance = Math.max(0, currentChips + delta);

    const updatedProfile = { ...profile, chips: newBalance };
    await db.update(playersTable)
      .set({ profileJson: updatedProfile, updatedAt: new Date() })
      .where(eq(playersTable.playerId, player.playerId));

    await db.insert(chipTransactionsTable).values({
      txId:         randomUUID(),
      playerId:     player.playerId,
      type,
      amount:       delta,
      balanceAfter: newBalance,
      note,
      adminId:      'admin',
    });

    req.log.info({ playerId: player.playerId, type, amount: delta, newBalance }, 'chip adjustment');
    res.json({ success: true, newBalance });
  } catch (e) {
    req.log.error(e, 'admin/chips error');
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/admin/players/:id/bonus ─────────────────────────────────────────
// Casino bonus: adds chips + creates a push notification for the player
router.post('/admin/players/:id/bonus', async (req, res) => {
  try {
    const { amount, reason, message } = req.body as {
      amount: number;
      reason: string;
      message?: string;
    };

    if (!amount || amount <= 0) {
      res.status(400).json({ error: 'amount must be a positive number' });
      return;
    }
    if (!reason) {
      res.status(400).json({ error: 'reason is required' });
      return;
    }

    const rows = await db
      .select()
      .from(playersTable)
      .where(eq(playersTable.playerId, req.params['id']!))
      .limit(1);

    if (!rows.length) { res.status(404).json({ error: 'Player not found' }); return; }

    const player = rows[0]!;
    const profile = player.profileJson as Record<string, unknown>;
    const currentChips = typeof profile['chips'] === 'number' ? profile['chips'] : 0;
    const newBalance = currentChips + Math.abs(amount);
    const updatedProfile = { ...profile, chips: newBalance };

    await db.update(playersTable)
      .set({ profileJson: updatedProfile, updatedAt: new Date() })
      .where(eq(playersTable.playerId, player.playerId));

    const txId = randomUUID();
    await db.insert(chipTransactionsTable).values({
      txId,
      playerId:     player.playerId,
      type:         'bonus',
      amount:       Math.abs(amount),
      balanceAfter: newBalance,
      note:         `${reason}${message ? ` — ${message}` : ''}`,
      adminId:      'admin',
    });

    const notificationId = randomUUID();
    await db.insert(playerNotificationsTable).values({
      notificationId,
      playerId: player.playerId,
      type:     'bonus',
      title:    reason,
      amount:   Math.abs(amount),
      message:  message ?? null,
      reason,
      read:     false,
    });

    // Push real-time event to the player if they're currently online
    const online = emitToPlayer(player.playerId, 'casino_bonus_received', {
      playerId:        player.playerId,
      username:        player.username,
      amount:          Math.abs(amount),
      message:         message ?? null,
      reason,
      previousBalance: currentChips,
      newBalance,
      transactionId:   txId,
      notificationId,
      timestamp:       new Date().toISOString(),
    });

    req.log.info({ playerId: player.playerId, amount, reason, notificationId, playerOnline: online }, 'casino bonus awarded');
    res.json({ success: true, newBalance, notificationId, txId, playerOnline: online });
  } catch (e) {
    req.log.error(e, 'admin/bonus error');
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/admin/players/:id/status ────────────────────────────────────────
router.post('/admin/players/:id/status', async (req, res) => {
  try {
    const { status, reason } = req.body as {
      status: 'active' | 'warned' | 'suspended' | 'banned';
      reason?: string;
    };

    const allowed = ['active', 'warned', 'suspended', 'banned'];
    if (!allowed.includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    await db.update(playersTable)
      .set({ status, banReason: reason ?? null, updatedAt: new Date() })
      .where(eq(playersTable.playerId, req.params['id']!));

    req.log.info({ playerId: req.params['id'], status }, 'player status updated');
    res.json({ success: true });
  } catch (e) {
    req.log.error(e, 'admin/status error');
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/admin/players/:id/warn ─────────────────────────────────────────
router.post('/admin/players/:id/warn', async (req, res) => {
  try {
    const { reason, message, adminId = 'admin' } = req.body as { reason: string; message?: string; adminId?: string };
    if (!reason) { res.status(400).json({ error: 'reason is required' }); return; }
    const pid = req.params['id']!;

    await db.update(playersTable)
      .set({ status: 'warned', banReason: reason, updatedAt: new Date() })
      .where(eq(playersTable.playerId, pid));

    const actionId = randomUUID();
    await db.insert(moderationActionsTable).values({ id: actionId, playerId: pid, adminId, type: 'warning', reason, message: message ?? null });
    await db.insert(playerNotificationsTable).values({ notificationId: randomUUID(), playerId: pid, type: 'moderation', title: '⚠️ Warning Received', amount: 0, message: message ?? null, reason, read: false });

    const online = emitToPlayer(pid, 'player_warning', { actionId, reason, message: message ?? null, timestamp: new Date().toISOString() });
    req.log.info({ playerId: pid, reason, online }, 'player warned');
    res.json({ success: true, online, actionId });
  } catch (e) { req.log.error(e, 'admin/warn error'); res.status(500).json({ error: 'Server error' }); }
});

// ── POST /api/admin/players/:id/suspend ───────────────────────────────────────
router.post('/admin/players/:id/suspend', async (req, res) => {
  try {
    const { reason, message, durationHours = 24, adminId = 'admin' } = req.body as { reason: string; message?: string; durationHours?: number; adminId?: string };
    if (!reason) { res.status(400).json({ error: 'reason is required' }); return; }
    const pid = req.params['id']!;
    const expiresAt = new Date(Date.now() + Number(durationHours) * 60 * 60 * 1000);

    await db.update(playersTable)
      .set({ status: 'suspended', banReason: reason, suspensionExpiresAt: expiresAt, updatedAt: new Date() })
      .where(eq(playersTable.playerId, pid));

    const actionId = randomUUID();
    await db.insert(moderationActionsTable).values({ id: actionId, playerId: pid, adminId, type: 'suspension', reason, message: message ?? null, durationHours: Number(durationHours), expiresAt });
    await db.insert(playerNotificationsTable).values({ notificationId: randomUUID(), playerId: pid, type: 'moderation', title: '⛔ Account Suspended', amount: 0, message: message ?? null, reason, read: false });

    const online = emitToPlayer(pid, 'player_suspension', { actionId, reason, message: message ?? null, durationHours: Number(durationHours), expiresAt: expiresAt.toISOString(), timestamp: new Date().toISOString() });
    req.log.info({ playerId: pid, reason, durationHours, online }, 'player suspended');
    res.json({ success: true, online, actionId, expiresAt: expiresAt.toISOString() });
  } catch (e) { req.log.error(e, 'admin/suspend error'); res.status(500).json({ error: 'Server error' }); }
});

// ── POST /api/admin/players/:id/ban ──────────────────────────────────────────
router.post('/admin/players/:id/ban', async (req, res) => {
  try {
    const { reason, message, adminId = 'admin' } = req.body as { reason: string; message?: string; adminId?: string };
    if (!reason) { res.status(400).json({ error: 'reason is required' }); return; }
    const pid = req.params['id']!;

    await db.update(playersTable)
      .set({ status: 'banned', banReason: reason, suspensionExpiresAt: null, updatedAt: new Date() })
      .where(eq(playersTable.playerId, pid));

    const actionId = randomUUID();
    await db.insert(moderationActionsTable).values({ id: actionId, playerId: pid, adminId, type: 'ban', reason, message: message ?? null });
    await db.insert(playerNotificationsTable).values({ notificationId: randomUUID(), playerId: pid, type: 'moderation', title: '🚫 Account Banned', amount: 0, message: message ?? null, reason, read: false });

    const online = emitToPlayer(pid, 'player_ban', { actionId, reason, message: message ?? null, timestamp: new Date().toISOString() });
    req.log.info({ playerId: pid, reason, online }, 'player banned');
    res.json({ success: true, online, actionId });
  } catch (e) { req.log.error(e, 'admin/ban error'); res.status(500).json({ error: 'Server error' }); }
});

// ── POST /api/admin/players/:id/unban ────────────────────────────────────────
router.post('/admin/players/:id/unban', async (req, res) => {
  try {
    const pid = req.params['id']!;
    await db.update(playersTable)
      .set({ status: 'active', banReason: null, suspensionExpiresAt: null, updatedAt: new Date() })
      .where(eq(playersTable.playerId, pid));

    const actionId = randomUUID();
    await db.insert(moderationActionsTable).values({ id: actionId, playerId: pid, adminId: 'admin', type: 'unban', reason: 'Account restored by admin', message: null });
    emitToPlayer(pid, 'player_unbanned', { timestamp: new Date().toISOString() });
    res.json({ success: true });
  } catch (e) { req.log.error(e, 'admin/unban error'); res.status(500).json({ error: 'Server error' }); }
});

// ── GET /api/admin/moderation ─────────────────────────────────────────────────
router.get('/admin/moderation', async (req, res) => {
  try {
    const rows = await db.select().from(moderationActionsTable).orderBy(desc(moderationActionsTable.createdAt)).limit(200);
    const playerIds = [...new Set(rows.map(r => r.playerId))];
    const players = playerIds.length > 0
      ? await db.select({ playerId: playersTable.playerId, username: playersTable.username }).from(playersTable).where(or(...playerIds.map(id => eq(playersTable.playerId, id))))
      : [];
    const pm = Object.fromEntries(players.map(p => [p.playerId, p.username]));
    res.json({ actions: rows.map(r => ({ ...r, username: pm[r.playerId] ?? 'Unknown' })), total: rows.length });
  } catch (e) { req.log.error(e, 'admin/moderation error'); res.status(500).json({ error: 'Server error' }); }
});

// ── GET /api/admin/reports ────────────────────────────────────────────────────
router.get('/admin/reports', async (req, res) => {
  try {
    const statusFilter = (req.query['status'] as string | undefined) ?? 'open';

    let rows = await db
      .select()
      .from(playerReportsTable)
      .orderBy(desc(playerReportsTable.createdAt));

    if (statusFilter !== 'all') {
      rows = rows.filter(r => r.status === statusFilter);
    }

    const playerIds = [...new Set([
      ...rows.map(r => r.reportedId),
      ...rows.map(r => r.reporterId).filter(Boolean),
    ])] as string[];

    const players = playerIds.length > 0
      ? await db.select({ playerId: playersTable.playerId, username: playersTable.username })
          .from(playersTable)
          .where(or(...playerIds.map(id => eq(playersTable.playerId, id))))
      : [];

    const playerMap = Object.fromEntries(players.map(p => [p.playerId, p.username]));

    const enriched = rows.map(r => ({
      ...r,
      reportedUsername: playerMap[r.reportedId] ?? 'Unknown',
      reporterUsername: r.reporterId ? (playerMap[r.reporterId] ?? 'Unknown') : 'Anonymous',
    }));

    res.json({ reports: enriched, total: enriched.length });
  } catch (e) {
    req.log.error(e, 'admin/reports error');
    res.status(500).json({ error: 'Server error' });
  }
});

// ── PUT /api/admin/reports/:id ────────────────────────────────────────────────
router.put('/admin/reports/:id', async (req, res) => {
  try {
    const { status, resolution } = req.body as { status: string; resolution?: string };

    await db.update(playerReportsTable)
      .set({ status, resolution: resolution ?? null, resolvedAt: new Date() })
      .where(eq(playerReportsTable.reportId, req.params['id']!));

    res.json({ success: true });
  } catch (e) {
    req.log.error(e, 'admin/report resolve error');
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/admin/stats ──────────────────────────────────────────────────────
router.get('/admin/stats', async (req, res) => {
  try {
    const allPlayers = await db.select({
      status: playersTable.status,
      createdAt: playersTable.createdAt,
    }).from(playersTable);

    const allReports = await db.select({
      status: playerReportsTable.status,
    }).from(playerReportsTable);

    const now = new Date();
    const dayAgo = new Date(now.getTime() - 86400000);
    const weekAgo = new Date(now.getTime() - 7 * 86400000);

    res.json({
      players: {
        total:     allPlayers.length,
        active:    allPlayers.filter(p => p.status === 'active').length,
        banned:    allPlayers.filter(p => p.status === 'banned').length,
        suspended: allPlayers.filter(p => p.status === 'suspended').length,
        warned:    allPlayers.filter(p => p.status === 'warned').length,
        newToday:  allPlayers.filter(p => p.createdAt && p.createdAt > dayAgo).length,
        newWeek:   allPlayers.filter(p => p.createdAt && p.createdAt > weekAgo).length,
      },
      reports: {
        total:    allReports.length,
        open:     allReports.filter(r => r.status === 'open').length,
        resolved: allReports.filter(r => r.status === 'resolved').length,
        dismissed: allReports.filter(r => r.status === 'dismissed').length,
      },
    });
  } catch (e) {
    req.log.error(e, 'admin/stats error');
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/players/:id/report  (public — in-game reporting) ────────────────
router.post('/players/:id/report', async (req, res) => {
  try {
    const { reporterId, reason, details } = req.body as {
      reporterId?: string;
      reason: string;
      details?: string;
    };

    if (!reason) { res.status(400).json({ error: 'reason is required' }); return; }

    await db.insert(playerReportsTable).values({
      reportId:   randomUUID(),
      reportedId: req.params['id']!,
      reporterId: reporterId ?? null,
      reason,
      details:    details ?? '',
    });

    res.json({ success: true });
  } catch (e) {
    req.log.error(e, 'report player error');
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/players/:id/notifications  (player polling) ─────────────────────
router.get('/players/:id/notifications', async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(playerNotificationsTable)
      .where(eq(playerNotificationsTable.playerId, req.params['id']!))
      .orderBy(desc(playerNotificationsTable.createdAt))
      .limit(20);

    res.json({ notifications: rows });
  } catch (e) {
    req.log.error(e, 'player notifications error');
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/players/:id/notifications/read  (mark as read) ─────────────────
router.post('/players/:id/notifications/read', async (req, res) => {
  try {
    const { notificationIds } = req.body as { notificationIds: string[] };
    if (!Array.isArray(notificationIds) || !notificationIds.length) {
      res.status(400).json({ error: 'notificationIds array is required' });
      return;
    }

    for (const nid of notificationIds) {
      await db.update(playerNotificationsTable)
        .set({ read: true })
        .where(eq(playerNotificationsTable.notificationId, nid));
    }

    res.json({ success: true });
  } catch (e) {
    req.log.error(e, 'mark notification read error');
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
