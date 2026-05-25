# CHIP SOCIETY — Texas Hold'em Poker

A premium iOS multiplayer Texas Hold'em poker app with a retro 1980s synthwave / neon-casino aesthetic. Virtual chips only, no real-money gambling.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- **Mobile**: Expo (React Native) — `artifacts/neon-river/`
- **API**: Express 5 (stubbed, ready for multiplayer)
- **DB**: PostgreSQL + Drizzle ORM (not yet provisioned)
- **Fonts**: Orbitron (neon display), Inter (body)
- **Libraries**: expo-linear-gradient, react-native-svg, @react-native-async-storage/async-storage

## Avatar System

- `constants/premiumAvatars.ts` — 100 avatar definitions (id, name, emoji, category, rarity, gradient, accentColor, unlockXP)
- `components/AvatarFrame.tsx` — reusable avatar display with rarity glow, Legendary animated pulse, lock overlay, equipped dot
- `app/profile/avatar-select.tsx` — full avatar selection screen (category tabs, rarity filter, 3-col grid, XP-gated unlocks)
- Avatars used in: Profile tab, Social Feed posts; feed PostCard uses `avatarId` from MOCK_PLAYERS
- Rarity tiers: COMMON (0 XP), RARE (500 XP), EPIC (2000 XP), LEGENDARY (8000 XP)
- 10 categories × 10 avatars: High Rollers, Poker Sharks, Casino Bosses, Neon Cyberpunk, Luxury VIP, Underground Legends, Retro 80s, Modern Influencers, Elite Bluff Masters, Vegas Nightlife
- Profile avatar tap navigates to `/profile/avatar-select`

## Where things live

- `artifacts/neon-river/` — the full Expo mobile app
- `artifacts/neon-river/app/(tabs)/index.tsx` — Home screen (logo, quick play, trending, featured tournament)
- `artifacts/neon-river/app/(tabs)/play.tsx` — Play screen (game mode selection)
- `artifacts/neon-river/app/(tabs)/feed.tsx` — Social feed (poker posts, reactions)
- `artifacts/neon-river/app/(tabs)/tournaments.tsx` — Tournaments listing
- `artifacts/neon-river/app/(tabs)/profile.tsx` — Player profile & stats
- `artifacts/neon-river/lib/pokerEngine.ts` — server-authoritative poker hand evaluator (all rankings, getBestHand, determineWinners)
- `artifacts/neon-river/lib/aiBot.ts` — AI decision engine (5 difficulty levels)
- `artifacts/neon-river/hooks/usePokerGame.ts` — full game state machine (betting rounds, phase progression, showdown, skipBotTurn)
- `artifacts/neon-river/context/UserContext.tsx` — player profile persistence (AsyncStorage)
- `artifacts/neon-river/constants/colors.ts` — neon design tokens
- `artifacts/neon-river/components/DotTimer.tsx` — animated dot-based turn timer
- `lib/api-spec/openapi.yaml` — OpenAPI spec (health check only; extend for multiplayer)

## Architecture decisions

- Poker engine runs client-side for AI Practice mode (zero latency, fully offline)
- Server-authoritative design is the intent for multiplayer — hook up Socket.IO to `api-server` when needed
- AsyncStorage for all profile/progression persistence on the first build (no DB required)
- Game state managed via `usePokerGame` hook (useReducer-style pure state transitions)
- Orbitron font gives the neon casino identity; falls back gracefully if loading fails

## Product

**5-tab navigation**: Home · Play · Feed · Tournaments · Profile

- **Home**: Compact profile bar, ACE SOCIAL neon logo, Quick Play CTA, Trending Now horizontal feed preview, Featured Tournament card, stat snapshot
- **Play**: AI Practice (primary CTA) + coming-soon game modes (Ranked, Friends, Quick Match, Tournament)
- **Feed**: Social poker feed with tabs (Trending / Following / Biggest Pots / Highlights), like/repost/comment actions, hand stats per post
- **Tournaments**: Featured tournament with registration + progress bar; filterable list (Open / Live / Upcoming); prize pools up to 2M
- **Profile**: Username editing, XP/rank progression (7 ranks: Neon Bronze → Neon Legend), win rate, chip balance
- **AI Practice**: Full Texas Hold'em vs 4 AI bots (5 difficulty levels), dot-based turn timer, Skip Turn button
- **Poker Engine**: Royal Flush → High Card, kickers, side pots, all-in, blinds, dealer rotation, 30s dot timer with auto-fold

## User preferences

- Neon-synthwave 1980s Miami aesthetic
- Dark background (#050010), electric blue (#00d4ff), neon pink (#ff0090), purple (#bf5fff)
- Virtual chips only — NO real money
- Max 5 players per table, min 2
- Orbitron font for display text

## Gotchas

- textShadow* and shadow* props produce web deprecation warnings — harmless on native iOS
- useNativeDriver is not available in Expo Go web preview — normal for development
- Always add new screens to the Stack in `app/_layout.tsx` before linking from other screens
- Install new packages with `pnpm add` from the `artifacts/neon-river/` directory

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
