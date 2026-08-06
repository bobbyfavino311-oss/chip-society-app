---
name: EAS OTA updates vs compiled builds
description: Why Expo Go shows fixes that TestFlight doesn't, and how to sync them
---

## The rule
Expo Go (dev) runs the **live dev server bundle** — it always reflects the current code. TestFlight runs the **compiled JS bundle** from the EAS build. If you fix bugs after a build, TestFlight users won't see them until either a new build OR an OTA update.

## OTA update command
```bash
eas update --channel production --message "fix: description"
```
Run from the app directory. Users get the update on next app launch — no App Store submission required.

## Why OTA works
expo-updates is installed and `runtimeVersion: { policy: "appVersion" }` is set. As long as the native code hasn't changed (no new native modules, no Podfile changes), OTA updates work for any JS-only fix.

## When OTA is NOT enough
- Added a new native module (requires new build + App Store submission)
- Changed app.json `ios` settings that affect native code
- Changed Podfile dependencies

**Why:** User reported TestFlight showing old bugs that Expo Go had fixed — the compiled build had older code from the Mac at build time, not the current Replit code.

**How to apply:** Whenever a bug is "fixed in Expo Go but not TestFlight", push an OTA update first before assuming a new build is needed.
