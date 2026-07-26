import { Router } from 'express';
import { db, playersTable } from '@workspace/db';
import { eq } from 'drizzle-orm';
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

    req.log.info({ playerId: player.playerId, username: player.username }, 'Player signed in');
    res.json({ success: true, playerId: player.playerId, profile: player.profileJson });
  } catch (e) {
    req.log.error(e, 'login error');
    res.status(500).json({ error: 'Server error during login.' });
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

    // Read existing record to preserve server-controlled fields
    const existing = await db
      .select({ profileJson: playersTable.profileJson, username: playersTable.username })
      .from(playersTable)
      .where(eq(playersTable.playerId, playerId))
      .limit(1);

    if (existing.length === 0) {
      res.status(404).json({ error: 'Player not found.' });
      return;
    }

    const current     = (existing[0]?.profileJson ?? {}) as Record<string, unknown>;
    const dbUsername  = existing[0]!.username; // authoritative username from DB

    // Validate displayName if provided
    if (profile['displayName'] !== undefined) {
      const dn = (profile['displayName'] as string).trim().replace(/\s+/g, ' ');
      if (dn.length === 0 || dn.length > 15) {
        res.status(400).json({ error: 'Display name must be 1–15 characters.' });
        return;
      }
    }

    // Server-authoritative fields that must survive client syncs
    const merged: Record<string, unknown> = {
      ...profile,
      // username must always match DB — client cannot change it via this endpoint
      username: dbUsername,
      // Preserve server-only flags — client cannot clear these
      isFounder: current['isFounder'] ?? profile['isFounder'] ?? false,
      // Preserve server-set usernameChangedAt (30-day cooldown clock)
      usernameChangedAt: current['usernameChangedAt'] ?? profile['usernameChangedAt'],
    };

    await db
      .update(playersTable)
      .set({ profileJson: merged, updatedAt: new Date() })
      .where(eq(playersTable.playerId, playerId));

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

export default router;
