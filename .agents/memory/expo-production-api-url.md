---
name: Expo API URL resolution (native vs. web preview)
description: How the app picks its API/socket server URL, and the platform-detection bug that broke it for native Expo Go clients
---

## Current architecture (superseded the old manifest-injection approach)

The API server now runs on Railway (24/7, independent of Replit), not on Replit Deployments. So the old approach of injecting `apiUrl` into the Expo manifest and reading `Constants.expoConfig.extra.apiUrl` is **no longer used** — native clients simply hardcode the Railway URL:

```javascript
return 'https://api-server-production-bbc2.up.railway.app/api';
```

Web preview (running inside the Replit workspace / canvas iframe) intentionally uses the local dev api-server instead, via `window.location.origin`, so that sockets/matchmaking and the API stay on the same server within that environment.

## Bug: `typeof window !== 'undefined'` is not a reliable native/web check

Three places branched on `typeof window !== 'undefined' && window.location?.origin` to decide "am I in web preview or native": `UserContext.getApiBase()`, `UserContext.getNotificationSocketUrl()`, `MultiplayerContext.getSocketUrl()`. `socialApi.ts` had an analogous leak via unconditionally reading `process.env.EXPO_PUBLIC_API_URL` (baked into the bundle as the local Replit dev domain).

In practice, native Expo Go (physical device, QR/tunnel) can still end up with `window`/`window.location` defined (dev-mode polyfills/HMR tooling), and `EXPO_PUBLIC_API_URL` gets baked into the same JS bundle the phone loads over the tunnel — so native devices silently hit the local dev server/DB instead of Railway. Symptom: a real, verified-working production account gets "No account found" or PIN mismatches on a physical phone, while the exact same login succeeds via direct `curl` against Railway.

**Fix:** gate all four call sites on `Platform.OS === 'web'` in addition to the `window` check (and gate the `EXPO_PUBLIC_API_URL` read in `socialApi.ts` the same way).

**Why:** `typeof window !== 'undefined'` alone is not sufficient to detect "real browser" in Expo/Metro — treat `Platform.OS === 'web'` as the authoritative signal, and never trust `EXPO_PUBLIC_*` bundle-time env vars unconditionally on native.

**How to apply:** Any new client → server URL resolution added to this app (API base, socket URL, notification socket, etc.) must copy this exact `Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin` pattern — don't reintroduce a bare `typeof window` check.
