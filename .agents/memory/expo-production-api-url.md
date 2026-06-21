---
name: Expo production API URL resolution
description: How to reliably get the correct API URL in a Replit-published Expo Go native app
---

## The problem

During Replit's **production build step** (`pnpm run build`), `REPLIT_DOMAINS` is set to `replit.com` — the Expo routing proxy host — NOT the actual deployed app domain (`chip-society.replit.app`). This infects anything computed from `REPLIT_DOMAINS` at build time.

What breaks:
- `process.env.EXPO_PUBLIC_API_URL` baked into the bundle = `https://replit.com/api` (wrong)
- `Constants.linkingUri` at runtime = `exp://replit.com` (wrong)
- Any manifest field derived from `baseUrl = https://replit.com` = wrong

What works at runtime:
- `REPLIT_DOMAINS` in the **running** production container = `chip-society.replit.app` (correct)
- The **manifest** (`static-build/ios/manifest.json`) is re-fetched by Expo Go on every open, even when the JS bundle is cached

## The fix (implemented)

**`build.js` → `updateManifests()`**: inject `apiUrl` as a hardcoded constant in `manifest.extra.expoClient.extra`:
```javascript
manifest.extra.expoClient.extra.apiUrl = 'https://chip-society.replit.app/api';
```
Do NOT derive from `baseUrl` — it's `replit.com` at build time.

**`UserContext.tsx` → `getApiBase()`**: read from `Constants.expoConfig.extra.apiUrl` first:
```javascript
const fromManifest = (Constants.expoConfig?.extra as Record<string,unknown>|undefined)?.apiUrl;
if (typeof fromManifest === 'string' && fromManifest.startsWith('https://')) return fromManifest;
return 'https://chip-society.replit.app/api'; // hardcoded fallback
```

## Why this works

Expo Go always re-fetches the manifest before loading the app. `Constants.expoConfig` is populated from the fresh manifest, not the cached bundle. So even if the JS bundle is stale, `getApiBase()` sees the correct production URL from the manifest.

**Why:** `REPLIT_DOMAINS` at build time ≠ actual app domain. Cannot trust any build-time computation of the API domain. Must hardcode `chip-society.replit.app` or use a manifest-injected value that's also hardcoded.

**How to apply:** Any time you need the production API URL in an Expo native app on Replit, use `Constants.expoConfig.extra.apiUrl` (injected via manifest) with `chip-society.replit.app/api` as the hardcoded value — never `REPLIT_DOMAINS` or `Constants.linkingUri`.
