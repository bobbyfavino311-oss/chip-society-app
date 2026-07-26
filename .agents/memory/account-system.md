---
name: Account system status
description: Auth system architecture — what exists, where it lives, known constraints.
---

## Core architecture
- Single canonical account record in `playersTable` (DB)
- Fields: `playerId`, `username`, `usernameLower` (unique), `email`, `pinHash`, `profileJson`, `status`, `banReason`, `suspensionExpiresAt`, `createdAt`, `updatedAt`
- `displayName` and `usernameChangedAt` live in `profileJson` (JSONB) — not as first-class columns
- PIN hashed with FNV-1a 32-bit: `chip_society::${username.toLowerCase()}::${pin}` — must match on both client and server

## What was rebuilt (account system overhaul)
- `auth.ts`: max username length 20 → 15; generic login errors (no field revelation); PIN verification required on change-username; 30-day cooldown returns exact ISO `nextEligibleAt`; `validateUsername()` shared fn with underscore rules + extended reserved list; `currentPin` AND `oldPin` both accepted in change-pin body
- `UserContext.tsx`: `changeUsername(newUsername, pin)` added to context; max length check 20 → 15; updates both AsyncStorage profile + LOCAL_CREDS_KEY on success
- `profile.tsx`: username editing removed; shows `displayName || username` prominently + `@username` as read-only subtitle; Change Username row added (→ `/profile/change-username`)
- `app/profile/change-username.tsx`: new screen — 2-phase (form → PIN numpad) with 30-day cooldown display, format validation, PIN verification, done state

## Social profile editor (feed.tsx `SocialProfileEditorSheet`)
- Edits: `displayName`, `bio` only
- Username is read-only with lock icon + helper text directing to Account Settings
- `updateProfile({ displayName, bio })` — never touches username/usernameLower

## Forgotten PIN / account recovery
- `forgot-pin.tsx` screen: username → email → new PIN → confirm flow
- Support email: `realbobbyf@chipsocietyapp.com` (displayed on username phase)
- Server endpoint still exists but primary path is support email

## Security constraints
- Login: always returns 401 with "Username or PIN is incorrect." — no field discrimination
- Registration dupe: "Username unavailable. Choose another username."
- 30-day cooldown: server-authoritative (`Date.now()` vs `usernameChangedAt` in profileJson) — not bypassable by client
- PIN change: accepts both `oldPin` and `currentPin` body field names for compatibility

**Why:** Previous implementation had username editing inline on profile screen (wrong), login revealed which field failed (security hole), and change-username had no PIN gate (critical gap). All fixed in overhaul.
