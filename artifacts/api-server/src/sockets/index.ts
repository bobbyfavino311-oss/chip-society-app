import { Server as SocketIOServer } from 'socket.io';
import type { Server as HttpServer } from 'http';
import { eq } from 'drizzle-orm';
import { db, playersTable, chipTransactionsTable } from '@workspace/db';
import { RoomManager } from '../poker/roomManager.js';
import { logger } from '../lib/logger.js';
import type { StakeTier, ChipSyncFn } from '../poker/types.js';

// ── Player presence registry ───────────────────────────────────────────────────
const playerSockets = new Map<string, string>(); // playerId → socketId
const socketPlayers = new Map<string, string>(); // socketId → playerId

// ── Chip session tracking ──────────────────────────────────────────────────────
// Tracks what chips each player had when they sat down.
// Used to compute the delta to write to the DB after each hand.
const sessionStartChips = new Map<string, number>(); // userId → chips at session join

let _io: SocketIOServer | null = null;

export function emitToPlayer(playerId: string, event: string, data: unknown): boolean {
  const socketId = playerSockets.get(playerId);
  if (!socketId || !_io) {
    logger.info({ playerId, event, socketFound: false }, 'emitToPlayer: player offline');
    return false;
  }
  _io.to(socketId).emit(event, data);
  logger.info({ playerId, socketId, event }, 'emitToPlayer: event emitted');
  return true;
}

// ── DB helpers ────────────────────────────────────────────────────────────────

async function loadPlayerChips(userId: string): Promise<number | null> {
  try {
    const rows = await db
      .select({ profileJson: playersTable.profileJson })
      .from(playersTable)
      .where(eq(playersTable.playerId, userId))
      .limit(1);
    if (!rows.length) return null;
    const chips = (rows[0]!.profileJson as Record<string, unknown>)?.chips;
    return typeof chips === 'number' ? chips : null;
  } catch (e) {
    logger.warn({ err: e, userId }, 'loadPlayerChips: DB error');
    return null;
  }
}

async function syncChipsToDb(userId: string, newChips: number): Promise<void> {
  try {
    const startChips = sessionStartChips.get(userId);
    if (startChips === undefined) return;
    const delta = newChips - startChips;
    if (delta === 0) return;

    // Load current profileJson and merge chips
    const rows = await db
      .select({ profileJson: playersTable.profileJson })
      .from(playersTable)
      .where(eq(playersTable.playerId, userId))
      .limit(1);
    if (!rows.length) return;

    const updated = { ...(rows[0]!.profileJson as Record<string, unknown>), chips: newChips };
    await db
      .update(playersTable)
      .set({ profileJson: updated, updatedAt: new Date() })
      .where(eq(playersTable.playerId, userId));

    await db.insert(chipTransactionsTable).values({
      txId:         `mp_${userId}_${Date.now()}`,
      playerId:     userId,
      type:         delta > 0 ? 'multiplayer_win' : 'multiplayer_loss',
      amount:       Math.abs(delta),
      balanceAfter: newChips,
      note:         'Multiplayer hand result',
    });

    // Update session baseline for the next hand
    sessionStartChips.set(userId, newChips);

    logger.info({ userId, delta, newChips }, 'Chip sync complete');
  } catch (e) {
    logger.error({ err: e, userId }, 'Chip sync failed');
  }
}

// ── Chip sync callback (passed to RoomManager → PokerRoom) ───────────────────
const onChipSync: ChipSyncFn = (seats) => {
  for (const { userId, chips } of seats) {
    // Fire-and-forget — don't block the game loop
    syncChipsToDb(userId, chips).catch((e) =>
      logger.error({ err: e, userId }, 'syncChipsToDb unhandled rejection')
    );
  }
};

export function setupSocketIO(httpServer: HttpServer): void {
  const io = new SocketIOServer(httpServer, {
    path: '/api/socket.io',
    cors: { origin: '*', methods: ['GET', 'POST'] },
    transports: ['websocket', 'polling'],
  });

  _io = io;

  const emit = (socketId: string, event: string, data: unknown) => {
    io.to(socketId).emit(event, data);
  };

  const broadcast = (roomId: string, _event: string, _data: unknown) => {
    io.emit('lobby_state', { tables: manager.getLobbyTables() });
  };

  const manager = new RoomManager(emit, broadcast, onChipSync);

  io.on('connection', (socket) => {
    logger.info({ socketId: socket.id }, 'Socket connected');

    // ─── Player presence registration ─────────────────────────────────────
    socket.on('register_player', (payload: { playerId: string; username?: string }) => {
      const { playerId } = payload;
      if (!playerId) return;
      const oldSocketId = playerSockets.get(playerId);
      if (oldSocketId && oldSocketId !== socket.id) {
        socketPlayers.delete(oldSocketId);
      }
      playerSockets.set(playerId, socket.id);
      socketPlayers.set(socket.id, playerId);
      socket.join(`player:${playerId}`);
      logger.info({ playerId, socketId: socket.id }, 'Player registered');
    });

    // ─── Lobby ────────────────────────────────────────────────────────────
    socket.on('get_lobby', () => {
      socket.emit('lobby_state', { tables: manager.getLobbyTables() });
    });

    // ─── Create table ─────────────────────────────────────────────────────
    socket.on('create_table', async (payload: {
      stakeTier: string;
      maxPlayers?: number;
      userId: string;
      username: string;
      avatarId: number;
      chips: number;
    }) => {
      try {
        const existing = manager.getRoomForSocket(socket.id);
        if (existing) {
          socket.emit('error', { message: 'Already seated at a table. Leave first.' });
          return;
        }

        // Load authoritative chips from DB (fall back to client value for guest accounts)
        const dbChips = await loadPlayerChips(payload.userId);
        const chips = dbChips !== null ? dbChips : payload.chips;

        const tier = payload.stakeTier as StakeTier;
        const room = manager.createRoom(tier, payload.maxPlayers ?? 5);
        const ok = manager.joinRoom(
          socket.id, room.id,
          payload.userId, payload.username, payload.avatarId, chips,
        );
        if (!ok) {
          manager.getRoom(room.id) && manager.cleanupEmpty();
          socket.emit('error', { message: 'Insufficient chips for this stake level.' });
          return;
        }

        sessionStartChips.set(payload.userId, chips);
        socket.join(room.id);
        socket.emit('joined_table', { tableId: room.id, state: room.getClientStateFor(socket.id) });
        io.emit('lobby_state', { tables: manager.getLobbyTables() });
        logger.info({ roomId: room.id, socketId: socket.id, userId: payload.userId }, 'Table created');
      } catch (e) {
        logger.error({ err: e }, 'create_table error');
        socket.emit('error', { message: 'Failed to create table.' });
      }
    });

    // ─── Join table ───────────────────────────────────────────────────────
    socket.on('join_table', async (payload: {
      tableId: string;
      userId: string;
      username: string;
      avatarId: number;
      chips: number;
    }) => {
      try {
        const existing = manager.getRoomForSocket(socket.id);
        if (existing) {
          socket.emit('error', { message: 'Already seated at a table. Leave first.' });
          return;
        }

        const dbChips = await loadPlayerChips(payload.userId);
        const chips = dbChips !== null ? dbChips : payload.chips;

        const ok = manager.joinRoom(
          socket.id, payload.tableId,
          payload.userId, payload.username, payload.avatarId, chips,
        );
        if (!ok) {
          socket.emit('error', { message: 'Cannot join table — full, closed, or insufficient chips.' });
          return;
        }

        const room = manager.getRoom(payload.tableId)!;
        sessionStartChips.set(payload.userId, chips);
        socket.join(payload.tableId);
        socket.emit('joined_table', { tableId: payload.tableId, state: room.getClientStateFor(socket.id) });
        io.emit('lobby_state', { tables: manager.getLobbyTables() });
        logger.info({ roomId: payload.tableId, socketId: socket.id, userId: payload.userId }, 'Joined table');
      } catch (e) {
        logger.error({ err: e }, 'join_table error');
        socket.emit('error', { message: 'Failed to join table.' });
      }
    });

    // ─── Quick join (matchmaking) ──────────────────────────────────────────
    socket.on('quick_join', async (payload: {
      stakeTier: string;
      userId: string;
      username: string;
      avatarId: number;
    }) => {
      try {
        const existing = manager.getRoomForSocket(socket.id);
        if (existing) {
          socket.emit('error', { message: 'Already seated at a table. Leave first.' });
          return;
        }

        const dbChips = await loadPlayerChips(payload.userId);
        if (dbChips === null) {
          socket.emit('error', { message: 'Account not found. Please log in again.' });
          return;
        }

        const tier = payload.stakeTier as StakeTier;
        const room = manager.findOrCreateRoom(tier, 5);
        const ok = manager.joinRoom(
          socket.id, room.id,
          payload.userId, payload.username, payload.avatarId, dbChips,
        );
        if (!ok) {
          socket.emit('error', { message: 'Could not find a suitable table. Try a different stake level.' });
          return;
        }

        sessionStartChips.set(payload.userId, dbChips);
        socket.join(room.id);
        socket.emit('joined_table', { tableId: room.id, state: room.getClientStateFor(socket.id) });
        io.emit('lobby_state', { tables: manager.getLobbyTables() });
        logger.info({ roomId: room.id, userId: payload.userId, tier }, 'Quick join');
      } catch (e) {
        logger.error({ err: e }, 'quick_join error');
        socket.emit('error', { message: 'Quick join failed. Please try again.' });
      }
    });

    // ─── Rejoin table (reconnect recovery) ────────────────────────────────
    socket.on('rejoin_table', (payload: {
      tableId: string;
      userId: string;
      username: string;
      avatarId: number;
    }) => {
      try {
        const room = manager.reconnectPlayer(payload.userId, socket.id);
        if (!room) {
          socket.emit('rejoin_failed', { message: 'Table no longer exists or seat expired.' });
          return;
        }

        // Re-register presence
        playerSockets.set(payload.userId, socket.id);
        socketPlayers.set(socket.id, payload.userId);
        socket.join(`player:${payload.userId}`);
        socket.join(room.id);

        socket.emit('joined_table', { tableId: room.id, state: room.getClientStateFor(socket.id) });
        io.emit('lobby_state', { tables: manager.getLobbyTables() });
        logger.info({ roomId: room.id, userId: payload.userId, socketId: socket.id }, 'Player reconnected');
      } catch (e) {
        logger.error({ err: e }, 'rejoin_table error');
        socket.emit('rejoin_failed', { message: 'Reconnect failed. Please rejoin manually.' });
      }
    });

    // ─── Leave table ──────────────────────────────────────────────────────
    socket.on('leave_table', () => {
      const room = manager.getRoomForSocket(socket.id);
      if (room) socket.leave(room.id);
      manager.leaveRoom(socket.id);
      socket.emit('left_table', {});
      io.emit('lobby_state', { tables: manager.getLobbyTables() });
    });

    // ─── Player action ────────────────────────────────────────────────────
    socket.on('player_action', (payload: { type: string; amount?: number }) => {
      const room = manager.getRoomForSocket(socket.id);
      if (!room) return;
      room.handleAction(socket.id, { type: payload.type as any, amount: payload.amount });
    });

    // ─── Chat ─────────────────────────────────────────────────────────────
    socket.on('send_chat', (payload: { text: string }) => {
      const room = manager.getRoomForSocket(socket.id) ?? manager.getSpectatingRoom(socket.id);
      if (!room || !payload.text) return;
      room.handleChat(socket.id, payload.text);
    });

    // ─── Spectate ─────────────────────────────────────────────────────────
    socket.on('spectate_table', (payload: { tableId: string }) => {
      const room = manager.getRoom(payload.tableId);
      if (!room) { socket.emit('error', { message: 'Table not found.' }); return; }
      socket.join(payload.tableId);
      room.addSpectator(socket.id);
      manager.registerSpectator(socket.id, payload.tableId);
      logger.info({ roomId: payload.tableId, socketId: socket.id }, 'Spectator joined');
    });

    socket.on('stop_spectating', () => {
      const roomId = manager.getSpectatingRoomId(socket.id);
      if (roomId) {
        manager.getRoom(roomId)?.removeSpectator(socket.id);
        manager.unregisterSpectator(socket.id);
        socket.leave(roomId);
      }
      socket.emit('stopped_spectating', {});
    });

    // ─── Sit out ──────────────────────────────────────────────────────────
    socket.on('sit_out', (payload: { sitOut: boolean }) => {
      const room = manager.getRoomForSocket(socket.id);
      if (!room) return;
      room.handleSitOut(socket.id, payload.sitOut);
    });

    // ─── Disconnect ───────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      logger.info({ socketId: socket.id }, 'Socket disconnected');

      // Remove presence
      const pid = socketPlayers.get(socket.id);
      if (pid) {
        playerSockets.delete(pid);
        socketPlayers.delete(socket.id);
      }

      // Clean up spectator
      const spectatingRoomId = manager.getSpectatingRoomId(socket.id);
      if (spectatingRoomId) {
        manager.getRoom(spectatingRoomId)?.removeSpectator(socket.id);
        manager.unregisterSpectator(socket.id);
      }

      // Soft-disconnect from poker table (60 s grace window)
      const room = manager.getRoomForSocket(socket.id);
      if (room) {
        socket.leave(room.id);
        manager.softDisconnect(socket.id);
      }

      io.emit('lobby_state', { tables: manager.getLobbyTables() });
    });
  });

  logger.info('Socket.IO attached at /api/socket.io');
}
