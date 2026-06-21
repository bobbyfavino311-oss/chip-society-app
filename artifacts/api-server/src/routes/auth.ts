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

// ── POST /api/auth/check-username ─────────────────────────────────────────────
router.get('/auth/check-username/:username', async (req, res) => {
  try {
    const lower = req.params['username']?.toLowerCase() ?? '';
    const rows = await db
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
    const { username, pin, email = '', avatarIndex = 1, profile } = req.body as {
      username: string;
      pin: string;
      email?: string;
      avatarIndex?: number;
      profile: Record<string, unknown>;
    };

    if (!username || !pin || !profile) {
      res.status(400).json({ error: 'username, pin, and profile are required.' });
      return;
    }

    const lower = username.toLowerCase();
    const existing = await db
      .select({ playerId: playersTable.playerId })
      .from(playersTable)
      .where(eq(playersTable.usernameLower, lower))
      .limit(1);

    if (existing.length > 0) {
      res.status(409).json({ error: 'Username is already taken.' });
      return;
    }

    const playerId  = randomUUID();
    const pinHash   = hashPin(pin, username);
    const fullProfile = { ...profile, playerId };

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
    const { username, pin } = req.body as { username: string; pin: string };
    if (!username || !pin) {
      res.status(400).json({ error: 'username and pin are required.' });
      return;
    }

    const lower = username.toLowerCase();
    const rows = await db
      .select()
      .from(playersTable)
      .where(eq(playersTable.usernameLower, lower))
      .limit(1);

    if (rows.length === 0) {
      res.status(404).json({ error: 'No account found with that username.' });
      return;
    }

    const player = rows[0]!;
    const expected = hashPin(pin, player.username);
    if (player.pinHash !== expected) {
      res.status(401).json({ error: 'Incorrect PIN.' });
      return;
    }

    req.log.info({ playerId: player.playerId, username }, 'Player signed in');
    res.json({ success: true, playerId: player.playerId, profile: player.profileJson });
  } catch (e) {
    req.log.error(e, 'login error');
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// ── PUT /api/auth/profile ─────────────────────────────────────────────────────
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

    await db
      .update(playersTable)
      .set({ profileJson: profile, updatedAt: new Date() })
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
    const { playerId, oldPin, newPin } = req.body as {
      playerId: string;
      oldPin: string;
      newPin: string;
    };

    const rows = await db
      .select()
      .from(playersTable)
      .where(eq(playersTable.playerId, playerId))
      .limit(1);

    if (rows.length === 0) {
      res.status(404).json({ error: 'Account not found.' });
      return;
    }

    const player = rows[0]!;
    const expected = hashPin(oldPin, player.username);
    if (player.pinHash !== expected) {
      res.status(401).json({ error: 'Current PIN is incorrect.' });
      return;
    }

    await db
      .update(playersTable)
      .set({ pinHash: hashPin(newPin, player.username), updatedAt: new Date() })
      .where(eq(playersTable.playerId, playerId));

    res.json({ success: true });
  } catch (e) {
    req.log.error(e, 'change-pin error');
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── POST /api/auth/forgot-pin ─────────────────────────────────────────────────
router.post('/auth/forgot-pin', async (req, res) => {
  try {
    const { username, email, newPin } = req.body as {
      username: string;
      email: string;
      newPin: string;
    };

    const lower = username.toLowerCase();
    const rows = await db
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

    await db
      .update(playersTable)
      .set({ pinHash: hashPin(newPin, player.username), updatedAt: new Date() })
      .where(eq(playersTable.playerId, player.playerId));

    res.json({ success: true });
  } catch (e) {
    req.log.error(e, 'forgot-pin error');
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── DELETE /api/auth/admin/player/:username — TEMPORARY, remove after use ─────
router.delete('/auth/admin/player/:username', async (req, res) => {
  if (req.headers['x-admin-secret'] !== 'chip-society-admin-2026') {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  try {
    const lower = (req.params['username'] ?? '').toLowerCase();
    const result = await db
      .delete(playersTable)
      .where(eq(playersTable.usernameLower, lower))
      .returning({ playerId: playersTable.playerId, username: playersTable.username });
    if (result.length === 0) {
      res.status(404).json({ error: 'Player not found.' });
      return;
    }
    req.log.warn({ username: lower }, 'Admin deleted player');
    res.json({ success: true, deleted: result[0] });
  } catch (e) {
    req.log.error(e, 'admin delete error');
    res.status(500).json({ error: 'Server error.' });
  }
});

export default router;
