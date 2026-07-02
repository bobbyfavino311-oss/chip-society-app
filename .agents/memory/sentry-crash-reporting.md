---
name: Sentry crash reporting in neon-river
description: How Sentry is wired into the Expo app, and the env var pattern used to get a plain secret into the client bundle.
---

`@sentry/react-native` is pinned to `~7.2.0` (not the default `^8.x` from `pnpm add`) because Expo's compatibility check for SDK 54 expects 7.2.x; installing 8.x triggers a "should be updated" warning from `expo start`.

**Why:** Expo's own compatibility table flags mismatched native module versions; ignoring it risks silent native-build breakage on Expo Launch, where there's no way to quickly patch afterward (App Store review cycle).

The DSN was requested as a plain secret `SENTRY_DSN` (not `EXPO_PUBLIC_`-prefixed), but Expo only inlines `EXPO_PUBLIC_*` vars into the client bundle at Metro bundle time. Fix: alias it at the process-spawn boundary rather than duplicating the secret — `EXPO_PUBLIC_SENTRY_DSN=$SENTRY_DSN` in the `dev` script's env prefix, and `EXPO_PUBLIC_SENTRY_DSN: process.env.SENTRY_DSN` in `scripts/build.js`'s Metro spawn env. Same pattern already used there for `EXPO_PUBLIC_DOMAIN`/`EXPO_PUBLIC_API_URL`.

**How to apply:** Any future plain secret that needs to reach client JS in this app must be aliased the same way in both `package.json`'s `dev` script and `scripts/build.js`'s `startMetro` env — never assume a bare secret name is visible at runtime.

Sentry is initialized in `lib/sentry.tsx` (`initializeSentry()` called at module scope in `app/_layout.tsx`, before provider tree) with `enabled: !__DEV__` so dev sessions never send events. `ErrorBoundary`'s `onError` prop calls `reportError(error)` → `Sentry.captureException`. Sentry's own global handlers (unhandled promise rejections, JS-thread errors outside React) are patched automatically by `Sentry.init()` — no extra wiring needed.
