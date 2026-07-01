import { Router } from 'express';
import { randomUUID } from 'crypto';
import { db, playersTable, referralsTable, chipTransactionsTable } from '@workspace/db';
import { eq } from 'drizzle-orm';

const router = Router();

const REFERRER_BONUS = 10_000;
const REFEREE_BONUS = 5_000;

// ── GET /api/referrals/lookup?username=xxx ─────────────────────────────────
// Validates an invite code (a username) before the signup form submits it.
router.get('/referrals/lookup', async (req: any, res: any) => {
  const { username } = req.query as Record<string, string>;
  if (!username?.trim()) {
    return res.status(400).json({ error: 'username query param required.' });
  }
  try {
    const rows = await db
      .select({ playerId: playersTable.playerId, username: playersTable.username, status: playersTable.status })
      .from(playersTable)
      .where(eq(playersTable.usernameLower, username.trim().toLowerCase()))
      .limit(1);
    if (rows.length === 0 || rows[0]!.status === 'banned') {
      return res.json({ valid: false });
    }
    return res.json({ valid: true, referrerUsername: rows[0]!.username });
  } catch (err) {
    req.log?.error({ err }, 'referral lookup failed');
    return res.status(500).json({ error: 'Server error.' });
  }
});

// ── POST /api/referrals/claim ───────────────────────────────────────────────
// Called right after a brand-new account finishes registering with an invite
// code. Credits both the new player and the referrer with a one-time chip
// bonus. Idempotent per referee (refereeId is unique in the DB).
router.post('/referrals/claim', async (req: any, res: any) => {
  const { refereeId, referrerUsername } = req.body as { refereeId?: string; referrerUsername?: string };
  if (!refereeId || !referrerUsername?.trim()) {
    return res.status(400).json({ error: 'refereeId and referrerUsername are required.' });
  }

  try {
    const refereeRows = await db.select().from(playersTable).where(eq(playersTable.playerId, refereeId)).limit(1);
    if (refereeRows.length === 0) return res.status(404).json({ error: 'Referee not found.' });
    const referee = refereeRows[0]!;

    const referrerRows = await db
      .select()
      .from(playersTable)
      .where(eq(playersTable.usernameLower, referrerUsername.trim().toLowerCase()))
      .limit(1);
    if (referrerRows.length === 0) return res.status(404).json({ error: 'Invite code not found.' });
    const referrer = referrerRows[0]!;

    if (referrer.playerId === referee.playerId) {
      return res.status(400).json({ error: 'You cannot use your own invite code.' });
    }

    const existing = await db.select().from(referralsTable).where(eq(referralsTable.refereeId, refereeId)).limit(1);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'A referral bonus has already been claimed on this account.' });
    }

    const referralId = randomUUID();
    await db.insert(referralsTable).values({
      referralId,
      referrerId: referrer.playerId,
      refereeId: referee.playerId,
      referrerBonus: REFERRER_BONUS,
      refereeBonus: REFEREE_BONUS,
    });

    const refereeProfile = { ...(referee.profileJson as Record<string, unknown>) };
    refereeProfile['chips'] = (Number(refereeProfile['chips']) || 0) + REFEREE_BONUS;
    await db.update(playersTable)
      .set({ profileJson: refereeProfile, updatedAt: new Date() })
      .where(eq(playersTable.playerId, referee.playerId));

    const referrerProfile = { ...(referrer.profileJson as Record<string, unknown>) };
    referrerProfile['chips'] = (Number(referrerProfile['chips']) || 0) + REFERRER_BONUS;
    await db.update(playersTable)
      .set({ profileJson: referrerProfile, updatedAt: new Date() })
      .where(eq(playersTable.playerId, referrer.playerId));

    await db.insert(chipTransactionsTable).values([
      {
        txId: randomUUID(),
        playerId: referee.playerId,
        type: 'referral_bonus',
        amount: REFEREE_BONUS,
        balanceAfter: Number(refereeProfile['chips']) || 0,
        note: `Welcome bonus for using ${referrer.username}'s invite code`,
      },
      {
        txId: randomUUID(),
        playerId: referrer.playerId,
        type: 'referral_bonus',
        amount: REFERRER_BONUS,
        balanceAfter: Number(referrerProfile['chips']) || 0,
        note: `Referral bonus for inviting ${referee.username}`,
      },
    ]);

    req.log?.info({ referrerId: referrer.playerId, refereeId: referee.playerId }, 'Referral claimed');
    return res.json({
      success: true,
      refereeBonus: REFEREE_BONUS,
      refereeProfile,
    });
  } catch (err) {
    req.log?.error({ err }, 'referral claim failed');
    return res.status(500).json({ error: 'Server error while claiming referral.' });
  }
});

// ── GET /api/referrals/stats?playerId=xxx ──────────────────────────────────
router.get('/referrals/stats', async (req: any, res: any) => {
  const { playerId } = req.query as Record<string, string>;
  if (!playerId) return res.status(400).json({ error: 'playerId query param required.' });
  try {
    const rows = await db.select().from(referralsTable).where(eq(referralsTable.referrerId, playerId));
    const totalBonus = rows.reduce((sum, r) => sum + r.referrerBonus, 0);
    return res.json({ count: rows.length, totalBonus });
  } catch (err) {
    req.log?.error({ err }, 'referral stats failed');
    return res.status(500).json({ error: 'Server error.' });
  }
});

export default router;
