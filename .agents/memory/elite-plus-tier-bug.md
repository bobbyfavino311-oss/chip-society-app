---
name: ELITE_PLUS tier mismatch causes NaN chips
description: Root cause of chips=0/NaN in multiplayer — client sends 'ELITE_PLUS' tier unknown to server STAKE_CONFIG
---

# Root Cause: ELITE_PLUS tier unknown to server

## The bug
Multiplayer chips show 0 / "VegasBot calls NaN" from the very first hand.

## Confirmed root cause (Railway diagnostic logs)
```
[quick_join] payload.stakeTier= ELITE_PLUS  room.config.minBuyIn= undefined
[startHand] chips=null (NaN)   amount=undefined
```

`STAKE_CONFIG['ELITE_PLUS'] = undefined` → `{ ...undefined, maxPlayers:5, variant }` → all numeric fields are `undefined` → `Math.min(chips, undefined) = NaN` → NaN propagates everywhere.

## Why ELITE_PLUS was sent
The user's Expo Go app had a **stale cached bundle** from an older version of the app that had 'ELITE_PLUS' in the lobby TIERS array. The user had that tier selected. The component state persisted between app sessions (no full remount = no useState reset).

## Fix applied (client side)
`MultiplayerContext.tsx` — both `quickJoin` and `createTable` now have a `VALID_SERVER_TIERS` guard:
```typescript
const VALID_SERVER_TIERS = new Set(['MICRO','LOW','STANDARD','HIGH_ROLLER','VIP','ELITE']);
const safeTier = VALID_SERVER_TIERS.has(stakeTier) ? stakeTier : 'ELITE';
```
Old bundles sending unknown tiers get clamped to 'ELITE' before hitting the server.

## Fix applied (server side — pending Railway deploy)
`artifacts/api-server/src/poker/types.ts` — added ELITE_PLUS and STARTER to STAKE_CONFIG and StakeTier union.
`artifacts/api-server/src/sockets/index.ts` — added `resolveTier()` function that falls back unknown tiers to 'ELITE'.
Code is in GitHub at commit `68a24ea` but Railway API token lost serviceInstanceDeployV2 permission mid-session. Use `deploymentRedeploy` to trigger or regenerate RAILWAY_API_TOKEN in secrets and use `serviceInstanceDeployV2`.

**Why:** `STAKE_CONFIG[unknownKey] = undefined`. Spreading undefined gives `{}`. All number fields stay undefined. Math.min/subtract with undefined = NaN. Every downstream op becomes NaN.

**How to apply:** Any time a new tier is added to the client, it MUST be added to server STAKE_CONFIG at the same time. The `resolveTier()` guard is the last line of defense.
