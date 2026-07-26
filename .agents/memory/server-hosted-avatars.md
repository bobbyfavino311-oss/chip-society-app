---
name: Server-hosted avatar photos
description: How custom profile photos are stored on GCS and served to all users in the feed
---

## How it works

When a user picks a custom photo:
1. `photo-select.tsx` copies it locally (for instant display to the owner)
2. Calls `uploadAvatarPhoto(playerId, localUri)` from `socialApi.ts`
3. That function: POST `/api/avatars/upload-url` → gets presigned GCS PUT URL + serveUrl
4. PUTs image blob directly to GCS (presigned URL, bypasses our server)
5. Calls `updateProfile({ serverAvatarUrl: serveUrl })` → saves to AsyncStorage + Railway DB

Server stores `serverAvatarUrl` in `playersTable.profileJson`.

Feed endpoint (`GET /api/social/feed`) returns `authorAvatarUrl` from the live profile map for each post — so all users in the feed get the server-hosted URL.

## GCS bucket

- Bucket: `replit-objstore-c05c00bb-cb23-4ee9-b12e-7b909848759a`
- Avatar objects stored at: `avatars/{playerId}-{timestamp}.jpg`
- Env vars: `DEFAULT_OBJECT_STORAGE_BUCKET_ID`, `PRIVATE_OBJECT_DIR`, `PUBLIC_OBJECT_SEARCH_PATHS`

## Serving

`GET /api/avatars/:objectId` — public endpoint (no auth), streams from GCS with 24h cache.
The objectId is `{playerId}-{timestamp}.jpg` (no slashes).

## UserProfile type

Added `serverAvatarUrl?: string` to `UserProfile` in `UserContext.tsx`.

## Feed rendering (LivePostCard)

For own posts: prefer local `profile.avatarUri` (instant) falling back to `profile.serverAvatarUrl`
For others: use `post.authorAvatarUrl` (from server)
Falls back to NeonAvatar if no URL or image fails to load.

**Why:** local URI is device-only (other users can't load it). Server-hosted URL is the same HTTPS URL for everyone.

## Key files

- `artifacts/api-server/src/routes/avatars.ts` — upload-url + serve endpoints
- `artifacts/api-server/src/lib/objectStorage.ts` — GCS client (copied from skill template)
- `artifacts/neon-river/lib/socialApi.ts` — `uploadAvatarPhoto()` function
- `artifacts/neon-river/app/profile/photo-select.tsx` — triggers upload after local copy
- `artifacts/neon-river/app/(tabs)/feed.tsx` — LivePostCard renders `post.authorAvatarUrl`
