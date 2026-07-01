---
name: Shared poker game chrome
description: How AI Practice and Multiplayer game screens share visual chrome, and how to keep them in sync.
---

`components/PokerChrome.tsx` is the single source of truth for the gameplay-screen chrome shared by
`app/game/practice.tsx` (AI Practice) and `app/multiplayer/game.tsx` (live Multiplayer): `CompactAISeat`,
`CommunityCards`, `ActionFeed`, `PHASE_LABELS`, `HAND_COLORS`, `formatChips`, and the `chrome`/`seat`/`table`
style objects (header, table felt, floating pot, human strip, waiting panel, exit-confirm modal, etc).

**Why:** the user explicitly rejected an earlier multiplayer screen that used its own header (loud red
"LEAVE" pill + gray "SIT OUT" pill), always-face-down community card backs, an inline SB/BB row inside the
felt, and an absolutely-positioned pot badge overlapping the table edge — all of which made multiplayer feel
like "its own separate entity" rather than a regular mode of the same app. Duplicating the literal JSX/styles
from practice.tsx (rather than approximating them) was required to get pixel parity.

**How to apply:** `practice.tsx` still owns its own local copies of these pieces (not migrated, to avoid
regressing the working AI mode) — `PokerChrome.tsx` was extracted as a byte-for-byte copy of practice.tsx's
versions. When editing shared visual chrome (header layout, seat rendering, table felt, pot badge, waiting
panel), **update both practice.tsx's local definitions and PokerChrome.tsx together**, or migrate practice.tsx
to import from PokerChrome.tsx to remove the duplication. Multiplayer's `SeatView` (from
`lib/multiplayerTypes.ts`) is adapted to the normalized `player` shape `CompactAISeat` expects via a small
`toChromePlayer()` mapper in `multiplayer/game.tsx` — extend that mapper, not `CompactAISeat`, when multiplayer
needs seat fields AI practice doesn't have.
