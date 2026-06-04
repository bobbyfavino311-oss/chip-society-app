---
name: SVG Avatar System
description: Why PNG avatars were replaced with 15 programmatic SVG icons, and the architecture of the replacement.
---

## Rule
All player avatars are drawn programmatically via `NeonAvatarSymbol.tsx`. There are exactly 15 avatars (IDs 1–15). No PNG image files. No network requests. Always renders.

**Why:** PNG avatar extraction from the reference sprite sheet produced black/corrupted circles in Expo web preview due to alpha channel issues in ImageMagick 7 + React Native Image. SVG via `react-native-svg` always renders correctly with zero loading latency.

## How to apply
- Add new avatars only to `NeonAvatarSymbol.tsx` (new icon component) + `neonAvatars.ts` (new entry), bump the max ID.
- `getNeonAvatar(id)` in `neonAvatars.ts` clamps any ID to 1–15 — safe to call with user-provided or bot-assigned values.
- `renderAvatarIcon(id, color, size)` in `NeonAvatarSymbol.tsx` renders the SVG for that ID.
- `NeonAvatar.tsx` is the canonical display component: dark bg + circular clip + rarity border ring + optional glow + lock overlay + equipped dot.
- `profile.symbolIndex` (default 1) is the canonical selected avatar ID for the local player.
- AI bots in `usePokerGame.ts` use `avatarIndex: [9, 13, 12, 15, 7][i % 5]` — all in range.
- All 12 `MOCK_PLAYERS` in `socialData.ts` have `avatarId` values 1–15.
- `AIPostMiniCard` in `feed.tsx` uses `avatarInitials` text — that's a separate AI-personality system, not the player avatar system, and is intentional.
