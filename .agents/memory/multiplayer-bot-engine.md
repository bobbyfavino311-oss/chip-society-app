---
name: Multiplayer bot engine
description: Server-side AI bots for multiplayer tables — architecture, trigger flow, and bot fill timing.
---

## Files
- `artifacts/api-server/src/poker/botEngine.ts` — decision engine (ROOKIE/SOLID/SHARK difficulties), hand strength heuristics, bot roster (8 named bots), `pickBot()`, `botBuyIn()`
- `artifacts/api-server/src/poker/room.ts` — `addBot()`, `isBotSeat()`, `getBotIds()`, `triggerBotTurn()` methods added to PokerRoom
- `artifacts/api-server/src/poker/roomManager.ts` — `scheduleBotFill(room, targetCount, delayMs)` method

## Bot seat sentinel
- Bot socketIds always start with `bot_` (e.g. `bot_bot_roboshark_342`)
- `isBotSeat(idx)` checks `seat.socketId.startsWith('bot_')`
- `broadcastState()` skips emit for bot seats (they have no real socket)

## Trigger flow
1. `broadcastState()` → if `activeSeat` is a bot → calls `triggerBotTurn()` inline
2. `triggerBotTurn()` → computes decision via `decideBotAction()` → fires after a difficulty-based delay via `setTimeout`
3. `handleAction(seat.socketId, decision)` — bot's synthetic socketId works because `handleAction` looks up by socketId in `this.seats`

## Bot thinking delay (must match AI Practice pacing)
`room.ts` has a `BOT_DELAY_MS: Record<BotDifficulty, [number, number]>` lookup — ROOKIE [1800,3500], SOLID [1300,2800], SHARK [1000,2200] ms — mirrored from the client's `lib/aiBot.ts` `DIFFICULTY_CONFIGS[*].delayMs`.

**Why:** an earlier version hardcoded a flat 300–900ms delay for all bots regardless of difficulty, which felt instant/robotic compared to AI Practice mode and was reported as a bug ("bots act far too fast").

**How to apply:** if AI Practice's `DIFFICULTY_CONFIGS` delay ranges change, update `BOT_DELAY_MS` in `room.ts` to match — the two are intentionally kept in the same relative shape but are separate constants (api-server can't import from the neon-river artifact).

## Auto-fill timing
- `quick_join` and `create_table` both call `manager.scheduleBotFill(room, 3, 8_000)` if <2 real players
- After 8 seconds, if still <targetCount real players, 2 bots join instantly
- Game starts 3s after 2nd player joins (HAND_START_DELAY_MS = 3000)

**Why:** A solo player who quick-joins would see "Need 2+ players" forever. 8s delay gives real players time to join first; bots guarantee the game always starts.

**How to apply:** Call `scheduleBotFill` after any join that might leave a table with only 1 real player. Don't call it after joins where real count is already ≥ 2.

## Difficulty mapping
Determined at `triggerBotTurn` by checking `seat.userId` string for keywords:
- contains 'robo', 'bluff', 'midnight' → SHARK
- contains 'fold', 'safe' → ROOKIE
- else → SOLID
