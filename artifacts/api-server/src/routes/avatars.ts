// ─── Avatar upload + serving ──────────────────────────────────────────────────
// POST /api/avatars   — accepts { imageBase64 } JSON, stores in DB.
// GET  /api/avatars/:playerId — serves the stored image publicly (no auth).
//
// Intentionally uses DB storage (not GCS) so this works on Railway without
// requiring the Replit sidecar auth endpoint that only exists in Replit's own
// hosting environment.

import { Router } from 'express';
import { db, playersTable } from '@workspace/db';
import { eq } from 'drizzle-orm';

const router = Router();

const RAILWAY_API = 'https://api-server-production-bbc2.up.railway.app/api';

// ── POST /api/avatars — upload avatar photo ───────────────────────────────────
router.post('/avatars', async (req: any, res: any) => {
  const playerId = req.headers['x-player-id'] as string | undefined;
  if (!playerId) {
    res.status(401).json({ error: 'x-player-id header required' });
    return;
  }

  const { imageBase64 } = req.body as { imageBase64?: string };
  if (!imageBase64 || typeof imageBase64 !== 'string') {
    res.status(400).json({ error: 'imageBase64 is required' });
    return;
  }

  // Sanity-check size: reject anything over 2 MB of base64 (~1.5 MB image)
  if (imageBase64.length > 2_100_000) {
    res.status(413).json({ error: 'Image too large (max ~1.5 MB)' });
    return;
  }

  try {
    const serveUrl = `${RAILWAY_API}/avatars/${playerId}`;

    // Store the base64 image and save the serve URL into profileJson
    const rows = await db
      .select({ profileJson: playersTable.profileJson })
      .from(playersTable)
      .where(eq(playersTable.playerId, playerId))
      .limit(1);

    if (!rows[0]) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }

    const current = (rows[0].profileJson ?? {}) as Record<string, unknown>;
    await db
      .update(playersTable)
      .set({
        avatarData: imageBase64,
        profileJson: { ...current, serverAvatarUrl: serveUrl },
        updatedAt: new Date(),
      })
      .where(eq(playersTable.playerId, playerId));

    res.json({ serveUrl });
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? 'Upload failed' });
  }
});

// ── GET /api/avatars/:playerId — serve avatar publicly ────────────────────────
router.get('/avatars/:playerId', async (req: any, res: any) => {
  const { playerId } = req.params as { playerId: string };
  try {
    const rows = await db
      .select({ avatarData: playersTable.avatarData })
      .from(playersTable)
      .where(eq(playersTable.playerId, playerId))
      .limit(1);

    const b64 = rows[0]?.avatarData;
    if (!b64) {
      res.status(404).json({ error: 'No avatar found' });
      return;
    }

    const buf = Buffer.from(b64, 'base64');
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.end(buf);
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? 'Failed to serve avatar' });
  }
});

export default router;
