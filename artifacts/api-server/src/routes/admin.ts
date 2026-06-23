import { Router } from 'express';
import { db, playersTable, chipTransactionsTable, playerReportsTable } from '@workspace/db';
import { eq, ilike, or, desc, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

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

    // Attach reporter/reported usernames
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

export default router;
