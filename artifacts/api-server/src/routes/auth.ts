import { Router } from 'express';
import {
  db, playersTable, chipTransactionsTable, playerReportsTable,
  playerNotificationsTable, moderationActionsTable, followsTable,
  conversationsTable, directMessagesTable, blocksTable, feedPostsTable,
  postLikesTable, postCommentsTable, postRepostsTable, bugReportsTable,
  referralsTable, playerPushTokensTable,
} from '@workspace/db';
import { eq, inArray, or, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const router = Router();

// ── FNV-1a 32-bit — must match client hashPin() exactly ──────────────────────
function hashPin(pin: string, salt: string): string {
  const input = `chip_society::${salt.toLowerCase()}::${pin}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

// ── Shared username validation ────────────────────────────────────────────────
const RESERVED_NAMES = new Set([
  'admin','administrator','support','system','moderator','staff','chipsociety',
  'chip_society','official','owner','developer','replit','null','undefined',
  'deleted','root','api','bot','test','guest','user','player','help','info',
  'contact','abuse','security',
]);

function validateUsername(username: string): string | null {
  if (username.length < 3 || username.length > 15) {
    return 'Use 3–15 letters, numbers, or underscores.';
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return 'Use 3–15 letters, numbers, or underscores.';
  }
  if (username.startsWith('_') || username.endsWith('_')) {
    return 'Username cannot start or end with an underscore.';
  }
  if (/__/.test(username)) {
    return 'Username cannot contain consecutive underscores.';
  }
  if (RESERVED_NAMES.has(username.toLowerCase())) {
    return 'That username is reserved.';
  }
  return null; // valid
}

// ── GET /api/auth/check-username/:username ────────────────────────────────────
router.get('/auth/check-username/:username', async (req, res) => {
  try {
    const raw    = (req.params['username'] ?? '').replace(/^@/, '').trim();
    const lower  = raw.toLowerCase();
    const rows   = await db
      .select({ playerId: playersTable.playerId })
      .from(playersTable)
      .where(eq(playersTable.usernameLower, lower))
      .limit(1);
    res.json({ available: rows.length === 0 });
  } catch (e) {
    req.log.error(e, 'check-username error');
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post('/auth/register', async (req, res) => {
  try {
    const { username: rawUsername, pin, email = '', avatarIndex = 1, profile } = req.body as {
      username: string;
      pin: string;
      email?: string;
      avatarIndex?: number;
      profile: Record<string, unknown>;
    };

    if (!rawUsername || !pin || !profile) {
      res.status(400).json({ error: 'username, pin, and profile are required.' });
      return;
    }

    // Strip leading @ and trim
    const username = rawUsername.replace(/^@/, '').trim();

    const usernameError = validateUsername(username);
    if (usernameError) {
      res.status(400).json({ error: usernameError });
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      res.status(400).json({ error: 'PIN must contain exactly four numbers.' });
      return;
    }

    const lower    = username.toLowerCase();
    const existing = await db
      .select({ playerId: playersTable.playerId })
      .from(playersTable)
      .where(eq(playersTable.usernameLower, lower))
      .limit(1);

    if (existing.length > 0) {
      res.status(409).json({ error: 'Username unavailable. Choose another username.' });
      return;
    }

    const playerId    = randomUUID();
    const pinHash     = hashPin(pin, username);
    // displayName defaults to username at registration; can be changed via profile editor
    const displayName = (profile['displayName'] as string | undefined) ?? username;
    const fullProfile = { ...profile, playerId, username, displayName };

    await db.insert(playersTable).values({
      playerId,
      username,
      usernameLower: lower,
      email,
      pinHash,
      profileJson: fullProfile,
    });

    req.log.info({ playerId, username }, 'Player registered');
    res.json({ success: true, playerId, profile: fullProfile });
  } catch (e) {
    req.log.error(e, 'register error');
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/auth/login', async (req, res) => {
  try {
    const { username: rawUsername, pin } = req.body as { username: string; pin: string };
    if (!rawUsername || !pin) {
      res.status(400).json({ error: 'username and pin are required.' });
      return;
    }

    const lower = rawUsername.replace(/^@/, '').trim().toLowerCase();
    const rows  = await db
      .select()
      .from(playersTable)
      .where(eq(playersTable.usernameLower, lower))
      .limit(1);

    // Generic error — do NOT reveal whether username or PIN was the failing field.
    if (rows.length === 0) {
      res.status(401).json({ error: 'Username or PIN is incorrect.' });
      return;
    }

    const player   = rows[0]!;
    const expected = hashPin(pin, player.username);
    if (player.pinHash !== expected) {
      res.status(401).json({ error: 'Username or PIN is incorrect.' });
      return;
    }

    // Check if banned
    if (player.status === 'banned') {
      res.status(403).json({
        error: 'ACCOUNT_BANNED',
        reason: player.banReason ?? 'Community violation',
      });
      return;
    }

    // Check if suspended — auto-restore if expired
    if (player.status === 'suspended') {
      const expiresAt = player.suspensionExpiresAt;
      if (expiresAt && new Date() < new Date(expiresAt)) {
        res.status(403).json({
          error: 'ACCOUNT_SUSPENDED',
          reason: player.banReason ?? 'Policy violation',
          expiresAt: expiresAt.toISOString(),
        });
        return;
      }
      // Suspension expired — auto-restore
      await db.update(playersTable)
        .set({ status: 'active', banReason: null, suspensionExpiresAt: null, updatedAt: new Date() })
        .where(eq(playersTable.playerId, player.playerId));
    }

    const loginAt = new Date();
    await db.update(playersTable)
      .set({
        loginCount: sql`${playersTable.loginCount} + 1`,
        lastLoginAt: loginAt,
        lastSeenAt: loginAt,
        updatedAt: loginAt,
      })
      .where(eq(playersTable.playerId, player.playerId));

    req.log.info({ playerId: player.playerId, username: player.username }, 'Player signed in');
    res.json({ success: true, playerId: player.playerId, profile: player.profileJson });
  } catch (e) {
    req.log.error(e, 'login error');
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// ── POST /api/activity ────────────────────────────────────────────────────────
// Records foreground app sessions and bounded heartbeat time. The session ID
// makes start events idempotent if React remounts or a request is retried.
router.post('/activity', async (req, res) => {
  try {
    const { playerId, sessionId, event, elapsedSeconds = 0 } = req.body as {
      playerId?: string;
      sessionId?: string;
      event?: 'start' | 'heartbeat';
      elapsedSeconds?: number;
    };

    if (!playerId || !sessionId || !['start', 'heartbeat'].includes(event ?? '')) {
      res.status(400).json({ error: 'playerId, sessionId, and a valid event are required.' });
      return;
    }
    if (sessionId.length > 100) {
      res.status(400).json({ error: 'Invalid sessionId.' });
      return;
    }

    const now = new Date();
    if (event === 'start') {
      const result = await db.update(playersTable)
        .set({
          sessionCount: sql`${playersTable.sessionCount} + CASE WHEN ${playersTable.lastSessionId} IS DISTINCT FROM ${sessionId} THEN 1 ELSE 0 END`,
          lastSessionId: sessionId,
          lastSeenAt: now,
          updatedAt: now,
        })
        .where(eq(playersTable.playerId, playerId))
        .returning({ playerId: playersTable.playerId });
      if (!result.length) {
        res.status(404).json({ error: 'Player not found.' });
        return;
      }
    } else {
      const seconds = Math.max(0, Math.min(120, Math.floor(Number(elapsedSeconds) || 0)));
      const result = await db.update(playersTable)
        .set({
          totalPlaySeconds: sql`${playersTable.totalPlaySeconds} + ${seconds}`,
          lastSeenAt: now,
          updatedAt: now,
        })
        .where(eq(playersTable.playerId, playerId))
        .returning({ playerId: playersTable.playerId });
      if (!result.length) {
        res.status(404).json({ error: 'Player not found.' });
        return;
      }
    }

    res.json({ success: true });
  } catch (e) {
    req.log.error(e, 'activity tracking error');
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── GET /api/auth/profile?playerId=xxx ────────────────────────────────────────
router.get('/auth/profile', async (req, res) => {
  try {
    const { playerId } = req.query as { playerId?: string };
    if (!playerId) {
      res.status(400).json({ error: 'playerId query param required.' });
      return;
    }
    const rows = await db
      .select()
      .from(playersTable)
      .where(eq(playersTable.playerId, playerId))
      .limit(1);
    if (rows.length === 0) {
      res.status(404).json({ error: 'Player not found.' });
      return;
    }
    res.json({ success: true, profile: rows[0]!.profileJson });
  } catch (e) {
    req.log.error(e, 'get profile error');
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── GET /api/auth/profile/:playerId ───────────────────────────────────────────
router.get('/auth/profile/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params as { playerId: string };
    const rows = await db
      .select()
      .from(playersTable)
      .where(eq(playersTable.playerId, playerId))
      .limit(1);
    if (rows.length === 0) {
      res.status(404).json({ error: 'Player not found.' });
      return;
    }
    res.json({ success: true, profile: rows[0]!.profileJson });
  } catch (e) {
    req.log.error(e, 'get profile by id error');
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── PUT /api/auth/profile ─────────────────────────────────────────────────────
// Merges client profile over the existing DB record so that server-only fields
// (isFounder, moderation flags) set by admins are never stomped by client syncs.
// NOTE: This endpoint must never update username/usernameLower — those changes
//       must go through PUT /auth/change-username (which requires PIN + cooldown).
router.put('/auth/profile', async (req, res) => {
  try {
    const { playerId, profile } = req.body as {
      playerId: string;
      profile: Record<string, unknown>;
    };
    if (!playerId || !profile) {
      res.status(400).json({ error: 'playerId and profile are required.' });
      return;
    }

    // Validate displayName before opening the transaction (no DB access needed)
    if (profile['displayName'] !== undefined) {
      const dn = (profile['displayName'] as string).trim().replace(/\s+/g, ' ');
      if (dn.length === 0 || dn.length > 15) {
        res.status(400).json({ error: 'Display name must be 1–15 characters.' });
        return;
      }
    }

    // Use a transaction with SELECT FOR UPDATE so the read-merge-write is atomic.
    // Without a row lock, a concurrent POST /api/avatars could write serverAvatarUrl
    // between this handler's read and write, and the profile sync would erase it.
    let notFound = false;

    await db.transaction(async (tx) => {
      const existing = await tx
        .select({ profileJson: playersTable.profileJson, username: playersTable.username })
        .from(playersTable)
        .where(eq(playersTable.playerId, playerId))
        .for('update')   // row-level lock — blocks concurrent avatar upload writes
        .limit(1);

      if (existing.length === 0) {
        notFound = true;
        return; // transaction auto-commits (no writes); caller checks notFound
      }

      const current    = (existing[0]?.profileJson ?? {}) as Record<string, unknown>;
      const dbUsername = existing[0]!.username; // authoritative username from DB

      // Server-authoritative fields that must survive client syncs
      const merged: Record<string, unknown> = {
        ...current,
        ...profile,
        // username must always match DB — client cannot change it via this endpoint
        username: dbUsername,
        // Never erase a server-set avatar URL — the client may sync before the upload finishes.
        // The FOR UPDATE lock ensures current['serverAvatarUrl'] is the latest DB value.
        serverAvatarUrl: profile['serverAvatarUrl'] ?? current['serverAvatarUrl'],
        // Preserve server-only flags — client cannot clear these
        isFounder: current['isFounder'] ?? profile['isFounder'] ?? false,
        // Preserve server-set usernameChangedAt (30-day cooldown clock)
        usernameChangedAt: current['usernameChangedAt'] ?? profile['usernameChangedAt'],
      };

      await tx
        .update(playersTable)
        .set({ profileJson: merged, updatedAt: new Date() })
        .where(eq(playersTable.playerId, playerId));
    });

    if (notFound) {
      res.status(404).json({ error: 'Player not found.' });
      return;
    }

    res.json({ success: true });
  } catch (e) {
    req.log.error(e, 'profile update error');
    res.status(500).json({ error: 'Server error updating profile.' });
  }
});

// ── PUT /api/auth/change-pin ──────────────────────────────────────────────────
router.put('/auth/change-pin', async (req, res) => {
  try {
    const { playerId, oldPin, currentPin, newPin } = req.body as {
      playerId: string;
      oldPin?: string;    // preferred
      currentPin?: string; // legacy field name from some clients
      newPin: string;
    };

    const presentedPin = oldPin ?? currentPin ?? '';

    if (!playerId || !presentedPin || !newPin) {
      res.status(400).json({ error: 'playerId, oldPin, and newPin are required.' });
      return;
    }

    if (!/^\d{4}$/.test(newPin)) {
      res.status(400).json({ error: 'PIN must contain exactly four numbers.' });
      return;
    }

    const rows = await db
      .select()
      .from(playersTable)
      .where(eq(playersTable.playerId, playerId))
      .limit(1);

    if (rows.length === 0) {
      res.status(404).json({ error: 'Account not found.' });
      return;
    }

    const player   = rows[0]!;
    const expected = hashPin(presentedPin, player.username);
    if (player.pinHash !== expected) {
      res.status(401).json({ error: 'Incorrect PIN. No changes were made.' });
      return;
    }

    await db
      .update(playersTable)
      .set({ pinHash: hashPin(newPin, player.username), updatedAt: new Date() })
      .where(eq(playersTable.playerId, player.playerId));

    req.log.info({ playerId }, 'PIN changed');
    res.json({ success: true });
  } catch (e) {
    req.log.error(e, 'change-pin error');
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── POST /api/auth/forgot-pin ─────────────────────────────────────────────────
// NOTE: The forgot-pin flow is now primarily a support redirect.
// This endpoint still exists for apps that implement email-based recovery,
// but the recommended recovery path is contacting realbobbyf@chipsocietyapp.com.
router.post('/auth/forgot-pin', async (req, res) => {
  try {
    const { username, email, newPin } = req.body as {
      username: string;
      email: string;
      newPin: string;
    };

    const lower = username.replace(/^@/, '').trim().toLowerCase();
    const rows  = await db
      .select()
      .from(playersTable)
      .where(eq(playersTable.usernameLower, lower))
      .limit(1);

    if (rows.length === 0) {
      res.status(404).json({ error: 'No account found with that username.' });
      return;
    }

    const player = rows[0]!;
    if (player.email && player.email.toLowerCase() !== email.toLowerCase()) {
      res.status(401).json({ error: 'Email does not match our records.' });
      return;
    }

    if (!/^\d{4}$/.test(newPin)) {
      res.status(400).json({ error: 'PIN must contain exactly four numbers.' });
      return;
    }

    await db
      .update(playersTable)
      .set({ pinHash: hashPin(newPin, player.username), updatedAt: new Date() })
      .where(eq(playersTable.playerId, player.playerId));

    req.log.info({ playerId: player.playerId }, 'PIN reset via forgot-pin');
    res.json({ success: true });
  } catch (e) {
    req.log.error(e, 'forgot-pin error');
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── PUT /api/auth/change-username ─────────────────────────────────────────────
// Requires: current PIN for security verification.
// Enforces: 30-day cooldown (server time is authoritative).
// Validates: same rules as registration.
router.put('/auth/change-username', async (req, res) => {
  try {
    const { playerId, newUsername: rawNew, pin } = req.body as {
      playerId: string;
      newUsername: string;
      pin: string;
    };

    if (!playerId || !rawNew || !pin) {
      res.status(400).json({ error: 'playerId, newUsername, and pin are required.' });
      return;
    }

    // Strip leading @ and trim
    const newUsername = rawNew.replace(/^@/, '').trim();

    // Validate format
    const usernameError = validateUsername(newUsername);
    if (usernameError) {
      res.status(400).json({ error: usernameError });
      return;
    }

    // Get current player record
    const rows = await db.select().from(playersTable).where(eq(playersTable.playerId, playerId)).limit(1);
    if (rows.length === 0) {
      res.status(404).json({ error: 'Account not found.' });
      return;
    }
    const player = rows[0]!;

    // ── Step 1: Verify current PIN ────────────────────────────────────────────
    const expected = hashPin(pin, player.username);
    if (player.pinHash !== expected) {
      res.status(401).json({ error: 'Incorrect PIN. No changes were made.' });
      return;
    }

    // ── Step 2: Enforce 30-day cooldown (server time) ─────────────────────────
    const currentProfile = (player.profileJson ?? {}) as Record<string, unknown>;
    const lastChanged    = currentProfile['usernameChangedAt'] as string | undefined;
    if (lastChanged) {
      const lastChangedMs   = new Date(lastChanged).getTime();
      const thirtyDaysMs    = 30 * 24 * 60 * 60 * 1000;
      const nextEligibleMs  = lastChangedMs + thirtyDaysMs;
      const nowMs           = Date.now();

      if (nowMs < nextEligibleMs) {
        const nextEligibleAt = new Date(nextEligibleMs).toISOString();
        const nextDate       = new Date(nextEligibleMs).toLocaleDateString('en-US', {
          month: 'long', day: 'numeric', year: 'numeric',
        });
        res.status(429).json({
          error: `You can change your username again on ${nextDate}.`,
          nextEligibleAt,
        });
        return;
      }
    }

    // ── Step 3: Uniqueness check ──────────────────────────────────────────────
    const lower = newUsername.toLowerCase();
    const taken = await db
      .select({ playerId: playersTable.playerId })
      .from(playersTable)
      .where(eq(playersTable.usernameLower, lower))
      .limit(1);

    if (taken.length > 0 && taken[0]!.playerId !== playerId) {
      res.status(409).json({ error: 'Username unavailable. Choose another username.' });
      return;
    }

    // ── Step 4: Atomic update ─────────────────────────────────────────────────
    const nowIso = new Date().toISOString();
    const updatedProfile: Record<string, unknown> = {
      ...currentProfile,
      username: newUsername,
      usernameChangedAt: nowIso,
    };

    await db.update(playersTable)
      .set({
        username:      newUsername,
        usernameLower: lower,
        profileJson:   updatedProfile,
        updatedAt:     new Date(),
      })
      .where(eq(playersTable.playerId, playerId));

    req.log.info({
      playerId,
      previousUsername: player.username,
      newUsername,
      timestamp: nowIso,
    }, 'Username changed');

    res.json({
      success: true,
      username: newUsername,
      usernameChangedAt: nowIso,
    });
  } catch (e) {
    req.log.error(e, 'change-username error');
    res.status(500).json({ error: 'Unable to update your account. Check your connection and try again.' });
  }
});

// ── DELETE /api/auth/account ──────────────────────────────────────────────────
// Account deletion is deliberately authenticated with both the existing player
// identity header and the account PIN.  The header alone is only an identity
// convention used by older clients and must never authorize this destructive
// operation.
router.delete('/auth/account', async (req, res) => {
  try {
    const headerPlayerId = req.headers['x-player-id'] as string | undefined;
    const { playerId, pin } = req.body as { playerId?: string; pin?: string };
    if (!headerPlayerId || !playerId || headerPlayerId !== playerId || !pin) {
      res.status(400).json({ error: 'Authenticated playerId and PIN are required.' });
      return;
    }

    const rows = await db.select().from(playersTable)
      .where(eq(playersTable.playerId, playerId)).limit(1);
    if (!rows[0]) {
      res.status(404).json({ error: 'Account not found.' });
      return;
    }
    const player = rows[0];
    if (!/^\d{4}$/.test(pin) || player.pinHash !== hashPin(pin, player.username)) {
      res.status(401).json({ error: 'Incorrect PIN. Account was not deleted.' });
      return;
    }

    // Production has existed across several schema revisions. Detect the
    // account-owned tables before entering the transaction so deletion also
    // works for older databases that predate newer optional tables.
    const tableRows = await db.execute(sql`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_name in (
          'feed_posts', 'post_likes', 'post_reposts', 'post_comments',
          'player_reports', 'bug_reports', 'chip_transactions',
          'player_notifications', 'moderation_actions', 'referrals',
          'player_push_tokens', 'follows', 'blocks', 'conversations',
          'direct_messages', 'players'
        )
    `);
    const existingTables = new Set(
      tableRows.rows.map((row) => String((row as { table_name: string }).table_name)),
    );
    const hasTable = (name: string) => existingTables.has(name);

    await db.transaction(async (tx) => {
      // Delete records whose schemas predate/omit foreign-key cascade rules.
      // Production has existed across several schema revisions, so explicitly
      // remove child rows instead of relying only on newer ON DELETE CASCADE
      // constraints.
      const ownedPosts = hasTable('feed_posts')
        ? await tx
            .select({ id: feedPostsTable.id })
            .from(feedPostsTable)
            .where(eq(feedPostsTable.authorId, playerId))
        : [];
      const ownedPostIds = ownedPosts.map((post) => post.id);
      if (ownedPostIds.length > 0) {
        if (hasTable('post_likes')) {
          await tx.delete(postLikesTable).where(inArray(postLikesTable.postId, ownedPostIds));
        }
        if (hasTable('post_reposts')) {
          await tx.delete(postRepostsTable).where(inArray(postRepostsTable.postId, ownedPostIds));
        }
        if (hasTable('post_comments')) {
          await tx.delete(postCommentsTable).where(inArray(postCommentsTable.postId, ownedPostIds));
        }
      }
      if (hasTable('post_likes')) {
        await tx.delete(postLikesTable).where(eq(postLikesTable.playerId, playerId));
      }
      if (hasTable('post_reposts')) {
        await tx.delete(postRepostsTable).where(eq(postRepostsTable.playerId, playerId));
      }
      if (hasTable('post_comments')) {
        await tx.delete(postCommentsTable).where(eq(postCommentsTable.authorId, playerId));
      }
      if (hasTable('feed_posts')) {
        await tx.delete(feedPostsTable).where(eq(feedPostsTable.authorId, playerId));
      }
      if (hasTable('player_reports')) {
        await tx.delete(playerReportsTable).where(eq(playerReportsTable.reporterId, playerId));
        await tx.delete(playerReportsTable).where(eq(playerReportsTable.reportedId, playerId));
      }
      if (hasTable('bug_reports')) {
        await tx.delete(bugReportsTable).where(eq(bugReportsTable.playerId, playerId));
      }
      if (hasTable('chip_transactions')) {
        await tx.delete(chipTransactionsTable).where(eq(chipTransactionsTable.playerId, playerId));
      }
      if (hasTable('player_notifications')) {
        await tx.delete(playerNotificationsTable).where(eq(playerNotificationsTable.playerId, playerId));
      }
      if (hasTable('moderation_actions')) {
        await tx.delete(moderationActionsTable).where(eq(moderationActionsTable.playerId, playerId));
      }
      if (hasTable('referrals')) {
        await tx.delete(referralsTable).where(
          or(eq(referralsTable.referrerId, playerId), eq(referralsTable.refereeId, playerId)),
        );
      }
      if (hasTable('player_push_tokens')) {
        await tx.delete(playerPushTokensTable).where(eq(playerPushTokensTable.playerId, playerId));
      }
      if (hasTable('follows')) {
        await tx.delete(followsTable).where(
          or(eq(followsTable.followerId, playerId), eq(followsTable.followingId, playerId)),
        );
      }
      if (hasTable('blocks')) {
        await tx.delete(blocksTable).where(
          or(eq(blocksTable.blockerId, playerId), eq(blocksTable.blockedId, playerId)),
        );
      }
      const conversations = hasTable('conversations')
        ? await tx
            .select({ id: conversationsTable.id })
            .from(conversationsTable)
            .where(or(eq(conversationsTable.p1Id, playerId), eq(conversationsTable.p2Id, playerId)))
        : [];
      const conversationIds = conversations.map((conversation) => conversation.id);
      if (hasTable('direct_messages')) {
        if (conversationIds.length > 0) {
          await tx.delete(directMessagesTable).where(
            inArray(directMessagesTable.conversationId, conversationIds),
          );
        }
        await tx.delete(directMessagesTable).where(eq(directMessagesTable.senderId, playerId));
      }
      if (hasTable('conversations')) {
        await tx.delete(conversationsTable).where(
          or(eq(conversationsTable.p1Id, playerId), eq(conversationsTable.p2Id, playerId)),
        );
      }
      await tx.delete(playersTable).where(eq(playersTable.playerId, playerId));
    });

    req.log.info({ playerId }, 'Player account permanently deleted');
    res.json({ success: true });
  } catch (e) {
    req.log.error(e, 'account deletion error');
    res.status(500).json({ error: 'Unable to delete account. No changes were made.' });
  }
});

export default router;
