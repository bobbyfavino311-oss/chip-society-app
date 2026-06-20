---
name: Multiplayer architecture
description: Socket.IO real-time multiplayer setup — server paths, room design, and client connection pattern.
---

## Socket.IO path
- Server configured with `path: '/api/socket.io'` (not the default `/socket.io`)
- Reason: Replit proxy routes `/api/*` to the api-server WITHOUT rewriting paths, so the api-server sees the full `/api/socket.io/...` path
- Client must also use `path: '/api/socket.io'`

## Socket URL from Expo app
- Web preview: `window.location.origin` (same domain via Replit proxy)
- Native: `process.env.EXPO_PUBLIC_SOCKET_URL`
- Helper in `context/MultiplayerContext.tsx`: `getSocketUrl()`

## Server structure
- `artifacts/api-server/src/poker/types.ts` — all shared types + STAKE_CONFIG
- `artifacts/api-server/src/poker/engine.ts` — pure poker functions (createDeck, evaluate, getBestHand, determineWinners)
- `artifacts/api-server/src/poker/room.ts` — PokerRoom class (state machine, betting rounds, 30s turn timer, auto-fold)
- `artifacts/api-server/src/poker/roomManager.ts` — in-memory map of rooms, socketId→roomId
- `artifacts/api-server/src/sockets/index.ts` — Socket.IO event handlers
- `artifacts/api-server/src/index.ts` — uses `http.createServer(app)` + `setupSocketIO(httpServer)` (NOT `app.listen()`)

**Why:** Socket.IO must attach to the raw http.Server before listen() is called. Express v5 `app.listen()` creates an internal server, so we switched to `createServer(app)`.

## Client structure (neon-river)
- `lib/multiplayerTypes.ts` — all client-side types (Card, SeatView, ClientGameState, LobbyTable, etc.)
- `context/MultiplayerContext.tsx` — socket lifecycle, state, action dispatch
- `app/multiplayer/lobby.tsx` — table list + create modal
- `app/multiplayer/game.tsx` — full game screen (no PlayerSeat import — safe)
- MultiplayerProvider added to root layout provider tree

## Game state design
- Server sends per-player view via `getClientStateFor(socketId)` — each player only gets their own hole cards; opponents show face-down cardCount
- Showdown: `revealedCards` and `revealedHand` are added to SeatView for non-folded players
- `turnTimeoutAt` (epoch ms) is only non-null for the active player's view, so only they see the countdown timer

## UserProfile mapping
- No `userId` field — use `profile.username` as the player ID
- No `avatarId` field — use `profile.avatarIndex`

## In-memory only (no DB)
- All room state lives in RoomManager's Map. Chips lost on server restart.
- Players kicked if chips drop to 0 between hands.
- DATABASE_URL not provisioned yet — add Drizzle persistence when ready.
