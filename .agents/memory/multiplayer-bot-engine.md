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
2. `triggerBotTurn()` → computes decision via `decideBotAction()` → fires after 300–900ms random delay via `setTimeout`
3. `handleAction(seat.socketId, decision)` — bot's synthetic socketId works because `handleAction` looks up by socketId in `this.seats`

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
