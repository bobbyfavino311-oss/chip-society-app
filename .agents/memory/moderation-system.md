---
name: Moderation system architecture
description: Full admin moderation system — warn/suspend/ban with real-time Socket.IO delivery, DB schema, login gate, admin panel UI, and mobile modal.
---

## DB Schema additions
- `suspension_expires_at` column added to `playersTable` (timestamp with timezone)
- New `moderation_actions` table: id, playerId, adminId, type (warning/suspension/ban/unban), reason, message, durationHours, expiresAt, createdAt
- After schema changes: run `pnpm run typecheck:libs` to rebuild declarations before api-server typecheck

## API endpoints (admin.ts)
- `POST /api/admin/players/:id/warn` — sets status=warned, logs action, sends notification, emits `player_warning`
- `POST /api/admin/players/:id/suspend` — sets status=suspended + expiresAt, emits `player_suspension`
- `POST /api/admin/players/:id/ban` — sets status=banned, emits `player_ban`
- `POST /api/admin/players/:id/unban` — restores to active, emits `player_unbanned`
- `GET /api/admin/moderation` — moderation history (last 200 actions, with username joined)

## Auth login gate (auth.ts)
- After PIN check: banned → 403 ACCOUNT_BANNED; suspended+not-expired → 403 ACCOUNT_SUSPENDED with expiresAt; suspension expired → auto-restore to active

## Mobile (neon-river)
- `ModerationModal.tsx` — full-screen modal, 3 variants (warning=yellow, suspension=orange, ban=red); ban/suspension auto-trigger signOut via onForceSignOut callback
- `UserContext.tsx`: `PendingModeration` interface, `pendingModeration` state, `dismissModeration`; socket listeners for `player_warning/suspension/ban` inside existing notifSocketRef useEffect; `signIn` returns `ACCOUNT_BANNED::reason` or `ACCOUNT_SUSPENDED::reason::isoDate` error strings
- `_layout.tsx`: `ModerationModalRenderer` renders inside `RootLayoutNav` alongside `BonusNotificationRenderer`
- `auth/signin.tsx`: parses ACCOUNT_BANNED:: and ACCOUNT_SUSPENDED:: error prefixes and shows friendly date-formatted messages

## Admin panel (PlayerDetail.tsx)
- Replaced single StatusModal with dedicated WarnModal (yellow), SuspendModal (orange, duration picker: 1h/24h/7d/30d/custom), BanModal (red, requires typing username to confirm)
- Unban/Restore button appears when player is banned or suspended
- Moderation history table loads via `api.moderationHistory()` filtered by playerId
- Imports: added `TriangleAlert, History, ShieldBan, ShieldX, ShieldCheck` from lucide-react

**Why:** Real-time delivery (Socket.IO) + server-authoritative login gate ensures moderation actions have actual consequences, not just a status label change.
