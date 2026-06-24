import { Router } from 'express';
import { db, playersTable, followsTable, conversationsTable, directMessagesTable, blocksTable } from '@workspace/db';
import { eq, or, and, ilike, ne, desc, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { emitToPlayer } from '../sockets/index.js';

const router = Router();

// ── Auth middleware ────────────────────────────────────────────────────────────

function requirePlayer(req: any, res: any, next: any) {
  const pid = req.headers['x-player-id'] as string | undefined;
  if (!pid) {
    res.status(401).json({ error: 'x-player-id header required' });
    return;
  }
  req.playerId = pid;
  next();
}

// ── Rate limiting (simple in-memory) ─────────────────────────────────────────

const messageTimes = new Map<string, number[]>();

function checkMessageRate(playerId: string): boolean {
  const now = Date.now();
  const times = (messageTimes.get(playerId) ?? []).filter(t => now - t < 10_000);
  if (times.length >= 5) return false;
  times.push(now);
  messageTimes.set(playerId, times);
  return true;
}

// ── GET /api/social/search?q= ─────────────────────────────────────────────────

router.get('/social/search', async (req, res) => {
  try {
    const q = ((req.query['q'] as string) ?? '').trim();
    if (!q || q.length < 2) {
      res.json({ players: [] });
      return;
    }

    const rows = await db
      .select({
        playerId:    playersTable.playerId,
        username:    playersTable.username,
        profileJson: playersTable.profileJson,
        status:      playersTable.status,
      })
      .from(playersTable)
      .where(
        and(
          ilike(playersTable.username, `%${q}%`),
          ne(playersTable.status, 'banned'),
        )
      )
      .limit(20);

    const players = rows.map(r => ({
      playerId:    r.playerId,
      username:    r.username,
      level:       (r.profileJson as any)?.level ?? 1,
      chips:       (r.profileJson as any)?.chips ?? 0,
      avatarIndex: (r.profileJson as any)?.avatarIndex ?? 1,
      rank:        (r.profileJson as any)?.rank ?? 'Neon Bronze',
      status:      r.status,
    }));

    res.json({ players });
  } catch (e) {
    req.log.error(e, 'social search error');
    res.status(500).json({ error: 'Search failed' });
  }
});

// ── GET /api/social/players/:id — public player profile ──────────────────────

router.get('/social/players/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await db
      .select({ playerId: playersTable.playerId, username: playersTable.username, profileJson: playersTable.profileJson, status: playersTable.status })
      .from(playersTable)
      .where(eq(playersTable.playerId, id))
      .limit(1);
    if (!rows.length) { res.status(404).json({ error: 'Player not found' }); return; }
    const r = rows[0]!;
    const pj = r.profileJson as any;
    res.json({
      player: {
        playerId:    r.playerId,
        username:    r.username,
        level:       pj?.level ?? 1,
        chips:       pj?.chips ?? 0,
        avatarIndex: pj?.avatarIndex ?? 1,
        rank:        pj?.rank ?? 'Neon Bronze',
        winRate:     pj?.winRate ?? 0,
        handsPlayed: pj?.handsPlayed ?? 0,
        status:      r.status,
      },
    });
  } catch (e) {
    req.log.error(e, 'social player profile error');
    res.status(500).json({ error: 'Failed' });
  }
});

// ── POST /api/social/follow/:targetId ─────────────────────────────────────────

router.post('/social/follow/:targetId', requirePlayer, async (req: any, res) => {
  try {
    const { playerId } = req;
    const { targetId } = req.params;
    if (playerId === targetId) { res.status(400).json({ error: 'Cannot follow yourself' }); return; }

    await db.insert(followsTable).values({ followerId: playerId, followingId: targetId }).onConflictDoNothing();
    res.json({ ok: true });
  } catch (e) {
    req.log.error(e, 'follow error');
    res.status(500).json({ error: 'Follow failed' });
  }
});

// ── DELETE /api/social/follow/:targetId ───────────────────────────────────────

router.delete('/social/follow/:targetId', requirePlayer, async (req: any, res) => {
  try {
    const { playerId } = req;
    const { targetId } = req.params;
    await db.delete(followsTable).where(
      and(eq(followsTable.followerId, playerId), eq(followsTable.followingId, targetId))
    );
    res.json({ ok: true });
  } catch (e) {
    req.log.error(e, 'unfollow error');
    res.status(500).json({ error: 'Unfollow failed' });
  }
});

// ── GET /api/social/following — IDs the current player follows ────────────────

router.get('/social/following', requirePlayer, async (req: any, res) => {
  try {
    const { playerId } = req;
    const rows = await db
      .select({ followingId: followsTable.followingId })
      .from(followsTable)
      .where(eq(followsTable.followerId, playerId));
    res.json({ following: rows.map(r => r.followingId) });
  } catch (e) {
    req.log.error(e, 'following error');
    res.status(500).json({ error: 'Failed' });
  }
});

// ── GET /api/social/conversations ─────────────────────────────────────────────

router.get('/social/conversations', requirePlayer, async (req: any, res) => {
  try {
    const { playerId } = req;

    const rows = await db
      .select()
      .from(conversationsTable)
      .where(
        or(eq(conversationsTable.p1Id, playerId), eq(conversationsTable.p2Id, playerId))
      )
      .orderBy(desc(conversationsTable.lastAt));

    const othersIds = rows.map(r => r.p1Id === playerId ? r.p2Id : r.p1Id);
    const playerRows = othersIds.length > 0
      ? await db
          .select({ playerId: playersTable.playerId, username: playersTable.username, profileJson: playersTable.profileJson })
          .from(playersTable)
          .where(sql`${playersTable.playerId} = ANY(${sql.raw(`ARRAY[${othersIds.map(id => `'${id.replace(/'/g,"''")}'`).join(',')}]`)})`)
      : [];

    const playerMap = Object.fromEntries(playerRows.map(p => [p.playerId, p]));

    const conversations = rows.map(r => {
      const otherId = r.p1Id === playerId ? r.p2Id : r.p1Id;
      const isP1 = r.p1Id === playerId;
      const other = playerMap[otherId];
      return {
        id:          r.id,
        otherId,
        otherUsername: other?.username ?? 'Unknown',
        otherAvatarIndex: (other?.profileJson as any)?.avatarIndex ?? 1,
        lastPreview: r.lastPreview,
        lastAt:      r.lastAt,
        unread:      isP1 ? r.unread1 : r.unread2,
      };
    });

    res.json({ conversations });
  } catch (e) {
    req.log.error(e, 'conversations error');
    res.status(500).json({ error: 'Failed to load conversations' });
  }
});

// ── POST /api/social/conversations/start ──────────────────────────────────────

router.post('/social/conversations/start', requirePlayer, async (req: any, res) => {
  try {
    const { playerId } = req;
    const { targetId } = req.body as { targetId: string };
    if (!targetId) { res.status(400).json({ error: 'targetId required' }); return; }
    if (playerId === targetId) { res.status(400).json({ error: 'Cannot message yourself' }); return; }

    // Check block
    const blocked = await db.select().from(blocksTable).where(
      or(
        and(eq(blocksTable.blockerId, targetId), eq(blocksTable.blockedId, playerId)),
        and(eq(blocksTable.blockerId, playerId), eq(blocksTable.blockedId, targetId)),
      )
    ).limit(1);
    if (blocked.length > 0) { res.status(403).json({ error: 'Cannot message this player' }); return; }

    // Find existing conversation (both orderings)
    const existing = await db.select().from(conversationsTable).where(
      or(
        and(eq(conversationsTable.p1Id, playerId), eq(conversationsTable.p2Id, targetId)),
        and(eq(conversationsTable.p1Id, targetId), eq(conversationsTable.p2Id, playerId)),
      )
    ).limit(1);

    if (existing[0]) {
      res.json({ conversationId: existing[0].id });
      return;
    }

    const id = randomUUID();
    await db.insert(conversationsTable).values({ id, p1Id: playerId, p2Id: targetId });
    res.json({ conversationId: id });
  } catch (e) {
    req.log.error(e, 'start conversation error');
    res.status(500).json({ error: 'Failed to start conversation' });
  }
});

// ── GET /api/social/conversations/:id/messages ────────────────────────────────

router.get('/social/conversations/:id/messages', requirePlayer, async (req: any, res) => {
  try {
    const { playerId } = req;
    const { id } = req.params;

    const conv = await db.select().from(conversationsTable).where(eq(conversationsTable.id, id)).limit(1);
    if (!conv[0] || (conv[0].p1Id !== playerId && conv[0].p2Id !== playerId)) {
      res.status(403).json({ error: 'Not in this conversation' });
      return;
    }

    const messages = await db
      .select()
      .from(directMessagesTable)
      .where(eq(directMessagesTable.conversationId, id))
      .orderBy(directMessagesTable.createdAt)
      .limit(100);

    // Mark unread as read
    const isP1 = conv[0].p1Id === playerId;
    await db.update(conversationsTable)
      .set(isP1 ? { unread1: 0 } : { unread2: 0 })
      .where(eq(conversationsTable.id, id));

    res.json({ messages });
  } catch (e) {
    req.log.error(e, 'get messages error');
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

// ── POST /api/social/conversations/:id/messages ───────────────────────────────

router.post('/social/conversations/:id/messages', requirePlayer, async (req: any, res) => {
  try {
    const { playerId } = req;
    const { id } = req.params;
    const { text } = req.body as { text: string };

    if (!text || typeof text !== 'string' || !text.trim()) {
      res.status(400).json({ error: 'Message text required' });
      return;
    }
    if (text.length > 500) {
      res.status(400).json({ error: 'Message too long (max 500 characters)' });
      return;
    }

    // Rate limit
    if (!checkMessageRate(playerId)) {
      res.status(429).json({ error: 'Please slow down before sending another message.' });
      return;
    }

    const conv = await db.select().from(conversationsTable).where(eq(conversationsTable.id, id)).limit(1);
    if (!conv[0] || (conv[0].p1Id !== playerId && conv[0].p2Id !== playerId)) {
      res.status(403).json({ error: 'Not in this conversation' });
      return;
    }

    const isP1 = conv[0].p1Id === playerId;
    const recipientId = isP1 ? conv[0].p2Id : conv[0].p1Id;

    const msgId = randomUUID();
    const trimmed = text.trim();
    const [msg] = await db.insert(directMessagesTable).values({
      id: msgId,
      conversationId: id,
      senderId: playerId,
      text: trimmed,
    }).returning();

    // Update conversation preview + increment recipient's unread
    await db.update(conversationsTable).set({
      lastPreview: trimmed.length > 60 ? trimmed.slice(0, 60) + '…' : trimmed,
      lastAt: new Date(),
      ...(isP1 ? { unread2: sql`unread2 + 1` } : { unread1: sql`unread1 + 1` }),
    }).where(eq(conversationsTable.id, id));

    // Real-time push to recipient
    const senderRow = await db.select({ username: playersTable.username, profileJson: playersTable.profileJson })
      .from(playersTable).where(eq(playersTable.playerId, playerId)).limit(1);
    const senderName = senderRow[0]?.username ?? 'Someone';
    const senderAvatar = (senderRow[0]?.profileJson as any)?.avatarIndex ?? 1;

    emitToPlayer(recipientId, 'dm_received', {
      conversationId: id,
      messageId: msgId,
      senderId: playerId,
      senderUsername: senderName,
      senderAvatarIndex: senderAvatar,
      text: trimmed,
      createdAt: msg?.createdAt ?? new Date(),
    });

    res.json({ message: msg });
  } catch (e) {
    req.log.error(e, 'send message error');
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// ── GET /api/social/inbox/unread ──────────────────────────────────────────────

router.get('/social/inbox/unread', requirePlayer, async (req: any, res) => {
  try {
    const { playerId } = req;
    const rows = await db.select({ unread1: conversationsTable.unread1, unread2: conversationsTable.unread2, p1Id: conversationsTable.p1Id })
      .from(conversationsTable)
      .where(or(eq(conversationsTable.p1Id, playerId), eq(conversationsTable.p2Id, playerId)));

    const total = rows.reduce((sum, r) => sum + (r.p1Id === playerId ? r.unread1 : r.unread2), 0);
    res.json({ unread: total });
  } catch (e) {
    req.log.error(e, 'unread error');
    res.status(500).json({ error: 'Failed' });
  }
});

// ── POST /api/social/block/:targetId ─────────────────────────────────────────

router.post('/social/block/:targetId', requirePlayer, async (req: any, res) => {
  try {
    const { playerId } = req;
    const { targetId } = req.params;
    await db.insert(blocksTable).values({ blockerId: playerId, blockedId: targetId }).onConflictDoNothing();
    // Also remove any follow relationship
    await db.delete(followsTable).where(
      or(
        and(eq(followsTable.followerId, playerId), eq(followsTable.followingId, targetId)),
        and(eq(followsTable.followerId, targetId), eq(followsTable.followingId, playerId)),
      )
    );
    res.json({ ok: true });
  } catch (e) {
    req.log.error(e, 'block error');
    res.status(500).json({ error: 'Block failed' });
  }
});

// ── DELETE /api/social/block/:targetId ───────────────────────────────────────

router.delete('/social/block/:targetId', requirePlayer, async (req: any, res) => {
  try {
    const { playerId } = req;
    const { targetId } = req.params;
    await db.delete(blocksTable).where(
      and(eq(blocksTable.blockerId, playerId), eq(blocksTable.blockedId, targetId))
    );
    res.json({ ok: true });
  } catch (e) {
    req.log.error(e, 'unblock error');
    res.status(500).json({ error: 'Unblock failed' });
  }
});

// ── GET /api/social/blocks ────────────────────────────────────────────────────

router.get('/social/blocks', requirePlayer, async (req: any, res) => {
  try {
    const { playerId } = req;
    const rows = await db.select({ blockedId: blocksTable.blockedId }).from(blocksTable).where(eq(blocksTable.blockerId, playerId));
    res.json({ blocks: rows.map(r => r.blockedId) });
  } catch (e) {
    req.log.error(e, 'blocks error');
    res.status(500).json({ error: 'Failed' });
  }
});

export default router;
