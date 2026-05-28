---
name: Short Deck variant architecture
description: How GameVariant threads through the engine and hook without breaking existing code.
---

## Rule
`GameVariant` type is defined in `lib/pokerEngine.ts` (and mirrored in `constants/gameVariants.ts` for UI config).
`GameState` carries a `variant` field so all pure functions (`doShowdown`, `executeAIAction`) read it from state — no extra parameters needed on every call site.

## Why
Adding variant as a param to every pure function would require signature changes throughout a 700-line hook and multiple callers. Embedding it in state is cleaner and consistent with how `bigBlind` and other table config is handled.

## How to apply
- New variant functions in `lib/pokerEngine.ts`: `createShortDeck()`, `evaluate5CardsShortDeck()`, `getBestHandVariant()`, `determineWinnersVariant()`, `getPostflopStrengthVariant()`, `createVariantDeck()`
- `usePokerGame` hook accepts `variant?: GameVariant` as 6th param (default `'texas_holdem'`)
- `useTournamentGame.ts` INITIAL_GAME must include `variant: 'texas_holdem' as const`
- Short Deck ranking: Flush=rank6 beats Full House=rank5 (flipped from standard)
- No wheel straight in Short Deck (no 2–5 in deck), `isWheel` check simply never triggers
- Practice screen reads `variant` from `useLocalSearchParams` and passes to hook
- `CommunityCards` component in practice.tsx takes optional `variant` prop and uses `getBestHandVariant`
