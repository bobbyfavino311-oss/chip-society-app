---
name: Quick Play live matchmaking wiring
description: Two bugs fixed when wiring QuickPlayModal's "LIVE PLAYERS" option to real Socket.IO matchmaking instead of the manual create/join lobby.
---

## Bug 1: dev/prod API base URL split caused "Account not found"

`UserContext.getApiBase()` always pointed at the Railway production server, while `MultiplayerContext.getSocketUrl()` used `window.location.origin` in web preview (the local dev api-server). Registering an account hit one DB, `quick_join`'s `loadPlayerChips` lookup hit the other → immediate "Account not found" error.

**Fix:** `getApiBase()` (and `getNotificationSocketUrl()`) now also branch on `window.location.origin` in web preview, matching `getSocketUrl()`.

**Why:** Any client-side function that talks to "the API server" must resolve to the exact same server instance as the Socket.IO connection in the same environment (dev vs. native/prod), or account/session lookups silently diverge across two separate databases.

**How to apply:** When adding a new client → server call in this app, mirror the existing `window.location.origin` (web preview) / hardcoded Railway URL (native) branching pattern already used by `getSocketUrl()`, `getApiBase()`, and `socialApi.ts` — don't hardcode Railway unconditionally.

**Update:** the `window.location.origin` branch alone was later found to leak into native Expo Go too (see `expo-production-api-url.md`) — it must also be gated on `Platform.OS === 'web'`.

## Bug 2: self-referential useEffect dependency canceled its own timer

An effect that both set `found=true` (via `celebrate()`) and depended on `found` in its own dependency array caused the effect to immediately re-run and clean up (via `clearTimeout`) the just-scheduled navigation timer, before it could fire. Symptom: modal stuck forever on "MATCH FOUND!" with no navigation, no error.

**Fix:** Guard with a ref (`celebratedRef`) instead of the state value itself, and exclude `found` from the dependency array.

**Why:** Any effect that sets a piece of state used purely for a "have I already fired" guard must not include that state in its own deps — React will replay the effect (and run its cleanup) the instant the state updates, canceling anything scheduled in the same effect body.

**How to apply:** For "run once, then schedule a delayed side effect" patterns, prefer a ref flag over a state flag in the same effect's dependency array.
