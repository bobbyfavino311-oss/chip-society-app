---
name: Player profile canonical architecture
description: Why public and own-profile views showed different data, and what was fixed.
---

## Rule
`GET /api/social/players/:id` MUST compute `winRate` server-side from stored `wins` / `handsPlayed` — NOT from `pj?.winRate`. The client-side `winRate` is a derived getter (never serialised into profileJson), so `pj.winRate` is always undefined → 0.

```js
const winRate = hands > 0 ? Math.round((wins / hands) * 100) : 0;
```

**Why:** UserContext exposes `winRate` as a computed getter on the context value (line ~1381 of UserContext.tsx), not a stored field. `PUT /api/auth/profile` receives the profile spread but the getter is not own-enumerable, so it never lands in profileJson.

## Rule
The Founder badge is stored as `profileJson.isFounder` (set by `PUT /api/admin/players/:id/founder`). Read it as `pj?.isFounder ?? pj?.founderBadge ?? false`. Never query only `pj?.founderBadge` — that key does not exist.

## Rule
`PUT /api/auth/profile` (called by `serverSaveProfile` in UserContext via 3-second debounce) IS the sync path — all profile fields that UserContext stores (bio, displayName, symbolIndex, handsPlayed, wins, losses, tournament stats, etc.) DO land in the server's profileJson. The pipeline is:
1. `updateProfile(delta)` → merge + recompute level/rank → `save()`
2. `save()` → write AsyncStorage + `scheduleSyncToServer()`
3. `scheduleSyncToServer()` → debounce 3 s → `serverSaveProfile()` → `PUT /api/auth/profile`

So the public profile endpoint does NOT need to re-derive anything except `winRate` — every other stored field is present.

## Rule
`GET /api/social/players/:id` must return all fields for canonical public profile:
`bio`, `displayName`, `serverAvatarUrl`, `founderBadge` (from `isFounder`), `tournamentWins`, `tournamentsPlayed`, `tournamentFinalTables`, `itmFinishes`, `biggestTournamentPrize`, `totalTournamentPrizesWon`, `tournamentBuyInsSpent`.

## Rule
`lib/db/dist/schema/index.d.ts` is a hand-maintained compiled type file (no build script). When adding a column to `lib/db/src/schema/index.ts`, ALSO add the matching `PgColumn` entry to the dist `.d.ts` file or api-server will get TS2339 errors. Use `notNull: false`, `hasDefault: false` for nullable text columns.

## Rule
Avatar cache policy: use `cachePolicy="none"` (not `"no-cache"` — that value is not in the expo-image type union for this SDK version). Valid values: `"none" | "memory" | "disk" | "memory-disk"`.
