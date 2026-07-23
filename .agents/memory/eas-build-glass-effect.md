---
name: EAS build — expo-glass-effect incompatible
description: expo-glass-effect@0.1.x breaks EAS iOS builds for SDK 54 / RN 0.81 — Swift override errors in GlassContainer.swift and GlassView.swift
---

## The rule
Do not use `expo-glass-effect` in this project. Remove it if it ever reappears.

**Why:** `expo-glass-effect@0.1.10` (the version ~0.1.4 resolves to) contains Swift files `GlassContainer.swift` and `GlassView.swift` that call `mountChildComponentView` and `unmountChildComponentView` as `override` methods. These methods were renamed/removed in Expo Modules Core for SDK 54 (RN 0.81). EAS build server (Xcode 26 / iPhoneOS26.0.sdk) fails to compile them with 4 "method does not override any method from its superclass" errors.

**How to apply:** If you see 4 "method does not override" Swift errors in an EAS build, check for `expo-glass-effect` in package.json first. Also: the package was installed but **never imported** in app code — so removing it has zero visual impact. Use `expo-blur` for glass/blur effects instead (already a dependency).

## EAS build debugging process learned
- The EAS build log is the critical artifact — always get the user to share it or read the attached log file to line 1400+.
- `expo install --check` only validates JS-layer version compatibility; it cannot detect broken Swift/ObjC native code.
- Small archive (22.5 MB, no node_modules): EAS does a fresh `pnpm install --frozen-lockfile` on their macOS server.
- To fix: remove offending package from package.json, run `pnpm install` locally to update lockfile, push both to GitHub via the Python/GitHub API script (lockfile is too large for curl).
- User must run `git fetch origin && git checkout origin/main -- ../../pnpm-lock.yaml ../../artifacts/neon-river/package.json` before each `eas build` to pick up Replit fixes.
