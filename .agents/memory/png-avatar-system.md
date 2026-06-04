---
name: PNG avatar system
description: NeonAvatar.tsx uses static require() PNG map — type and crop details.
---

## Rule
NeonAvatar.tsx uses a static `Record<number, any>` require() map for 15 PNG crops.
Type must be `any`, NOT `ReturnType<typeof require>` — the latter causes TS2769 because
React Native's ImageSourcePropType doesn't accept the inferred `unknown`.

## PNG crop details
Source: `attached_assets/51881b7f-...png` (1254×1254px, 3col×5row grid)
- Col width: 418px · x offsets: col0=84, col1=502, col2=920
- Row y positions: 0, 251, 502, 753, 1004 · Crop size: 250×250

Crops saved to: `artifacts/neon-river/assets/avatars/avatar_1.png` – `avatar_15.png`

## Bot avatarIds
usePokerGame.ts bot indices: [9, 13, 12, 15, 7] (all in range 1–15)

## AI personality avatarIds
ai_01 NightShark=12, ai_02 VegasMirage=15, ai_03 ShadowKing=13, ai_04 ChipBandit=10,
ai_05 BluffMachine=9, ai_06 RoyalRiver=6, ai_07 AceHunter=1, ai_08 TiltDealer=11,
ai_09 RiverRat=7, ai_10 PokerPhantom=8

**Why:** Metro bundler requires static literal require() calls — no computed paths.
**How to apply:** Any new avatar PNG must be added to the AVATAR_IMAGES map with a literal require().
