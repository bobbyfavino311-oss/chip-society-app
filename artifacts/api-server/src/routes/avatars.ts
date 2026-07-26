// ─── Avatar upload + serving ──────────────────────────────────────────────────
// POST /api/avatars/upload-url  — returns a short-lived presigned PUT URL
//                                 the mobile client uploads directly to GCS.
// GET  /api/avatars/:objectId   — proxies the image from GCS, publicly (no auth).

import { Router } from 'express';
import { db, playersTable } from '@workspace/db';
import { eq } from 'drizzle-orm';
import { objectStorageClient } from '../lib/objectStorage.js';

const router = Router();

const BUCKET = () => {
  const id = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
  if (!id) throw new Error('DEFAULT_OBJECT_STORAGE_BUCKET_ID not set');
  return objectStorageClient.bucket(id);
};

const RAILWAY_API = 'https://api-server-production-bbc2.up.railway.app/api';

// ── POST /api/avatars/upload-url ──────────────────────────────────────────────
router.post('/avatars/upload-url', async (req: any, res: any) => {
  const playerId = req.headers['x-player-id'] as string | undefined;
  if (!playerId) {
    res.status(401).json({ error: 'x-player-id header required' });
    return;
  }

  try {
    const objectId = `${playerId}-${Date.now()}.jpg`;
    const file = BUCKET().file(`avatars/${objectId}`);

    const [uploadUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 min
      contentType: 'image/jpeg',
    });

    const serveUrl = `${RAILWAY_API}/avatars/${objectId}`;

    // Optimistically save the serveUrl into the player's profileJson so the
    // feed starts returning it immediately (upload happens client-side).
    const rows = await db
      .select({ profileJson: playersTable.profileJson })
      .from(playersTable)
      .where(eq(playersTable.playerId, playerId))
      .limit(1);
    if (rows[0]) {
      const current = (rows[0].profileJson ?? {}) as Record<string, unknown>;
      await db
        .update(playersTable)
        .set({ profileJson: { ...current, serverAvatarUrl: serveUrl }, updatedAt: new Date() })
        .where(eq(playersTable.playerId, playerId));
    }

    res.json({ uploadUrl, serveUrl, objectId });
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? 'Failed to generate upload URL' });
  }
});

// ── GET /api/avatars/:objectId — public, no auth ──────────────────────────────
router.get('/avatars/:objectId', async (req: any, res: any) => {
  const { objectId } = req.params as { objectId: string };
  // Reject path traversal attempts
  if (!objectId || objectId.includes('/') || objectId.includes('..')) {
    res.status(400).json({ error: 'Invalid object ID' });
    return;
  }
  try {
    const file = BUCKET().file(`avatars/${objectId}`);
    const [exists] = await file.exists();
    if (!exists) {
      res.status(404).json({ error: 'Avatar not found' });
      return;
    }
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    file.createReadStream().pipe(res);
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? 'Failed to serve avatar' });
  }
});

export default router;
