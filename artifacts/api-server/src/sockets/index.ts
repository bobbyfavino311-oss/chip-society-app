import { Server as SocketIOServer } from 'socket.io';
import type { Server as HttpServer } from 'http';
import { eq } from 'drizzle-orm';
import { db, playersTable } from '@workspace/db';
import { RoomManager } from '../poker/roomManager.js';
import { logger } from '../lib/logger.js';
import type { StakeTier, GameVariant } from '../poker/types.js';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';

const VALID_VARIANTS: ReadonlySet<string> = new Set([
  'texas_holdem', 'short_deck_holdem', 'joker_holdem', 'omaha_holdem',
]);

function resolveVariant(v: unknown): GameVariant {
  return typeof v === 'string' && VALID_VARIANTS.has(v) ? (v as GameVariant) : 'texas_holdem';
}

// ── Player presence registry ───────────────────────────────────────────────────
const playerSockets = new Map<string, string>(); // playerId → socketId
const socketPlayers = new Map<string, string>(); // socketId → playerId

// NOTE: Chip persistence is client-authoritative, exactly like AI Practice mode.
// The client debits the buy-in via removeChips() before joining (see
// app/multiplayer/lobby.tsx) and credits the final table stack back via
// addChips() on leave (see app/multiplayer/game.tsx doLeave()). The server used
// to also overwrite the player's DB bankroll after every hand via a
// sessionStartChips/syncChipsToDb mechanism — that wrote the seat's small table
// stack directly over the player's full bankroll (using the pre-buy-in DB value
// as a stale baseline), destroying the rest of their balance after the very
// first hand. That mechanism has been removed; the room only tracks chips
// in-memory for the duration of the session.

let _io: SocketIOServer | null = null;

export function emitToAll(event: string, data: unknown): void {
  if (!_io) return;
  _io.emit(event, data);
}

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

export function setupSocketIO(httpServer: HttpServer): void {
  const io = new SocketIOServer(httpServer, {
    path: '/api/socket.io',
    cors: { origin: '*', methods: ['GET', 'POST'] },
    transports: ['websocket', 'polling'],
  });

  // ── Redis adapter (horizontal scaling) ────────────────────────────────────
  // When REDIS_URL is set (Railway Redis plugin or Upstash), Socket.IO will
  // fan out all broadcasts (lobby_state, game_state, etc.) across every node
  // instance via Redis pub/sub. Without it the server runs single-process with
  // the default in-memory adapter — safe for dev and low traffic.
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    try {
      const pubClient = new Redis(redisUrl, {
        maxRetriesPerRequest: null,   // required by @socket.io/redis-adapter
        enableReadyCheck: false,
        lazyConnect: false,
      });
      const subClient = pubClient.duplicate();

      pubClient.on('error', (err) => logger.error({ err }, 'Redis pub client error'));
      subClient.on('error', (err) => logger.error({ err }, 'Redis sub client error'));

      io.adapter(createAdapter(pubClient, subClient));
      logger.info({ redisUrl: redisUrl.replace(/:\/\/.*@/, '://***@') }, 'Socket.IO Redis adapter attached');
    } catch (err) {
      logger.error({ err }, 'Failed to attach Redis adapter — falling back to in-memory');
    }
  } else {
    logger.warn('REDIS_URL not set — Socket.IO running with single-process in-memory adapter');
  }

  _io = io;

  const emit = (socketId: string, event: string, data: unknown) => {
    io.to(socketId).emit(event, data);
  };

  const broadcast = (roomId: string, _event: string, _data: unknown) => {
    io.emit('lobby_state', { tables: manager.getLobbyTables() });
  };

  const manager = new RoomManager(emit, broadcast);

  io.on('connection', (socket) => {
    logger.info({ socketId: socket.id, transport: socket.conn.transport.name }, 'Socket connected');

    socket.conn.on('upgrade', (transport) => {
      logger.info({ socketId: socket.id, transport: transport.name }, 'Socket transport upgraded');
    });

    socket.on('disconnect', (reason) => {
      logger.info({ socketId: socket.id, reason, transport: socket.conn.transport.name }, 'Socket disconnected (reason)');
    });

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
      variant?: string;
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
        const variant = resolveVariant(payload.variant);
        const room = manager.createRoom(tier, payload.maxPlayers ?? 5, variant);
        const ok = manager.joinRoom(
          socket.id, room.id,
          payload.userId, payload.username, payload.avatarId, chips,
        );
        if (!ok) {
          manager.getRoom(room.id) && manager.cleanupEmpty();
          socket.emit('error', { message: 'Insufficient chips for this stake level.' });
          return;
        }

        socket.join(room.id);
        socket.emit('joined_table', { tableId: room.id, state: room.getClientStateFor(socket.id) });
        io.emit('lobby_state', { tables: manager.getLobbyTables() });
        logger.info({ roomId: room.id, socketId: socket.id, userId: payload.userId }, 'Table created');

        // Auto-fill with bots after 8 s if no other real players join
        manager.scheduleBotFill(room, 3, 8_000);
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
      variant?: string;
      userId: string;
      username: string;
      avatarId: number;
      chips?: number;
    }) => {
      try {
        const existing = manager.getRoomForSocket(socket.id);
        if (existing) {
          socket.emit('error', { message: 'Already seated at a table. Leave first.' });
          return;
        }

        // Fall back to client-supplied chips for guest accounts (same as create_table/join_table)
        const dbChips = await loadPlayerChips(payload.userId);
        const chips = dbChips !== null ? dbChips : (payload.chips ?? 500_000);

        const tier = payload.stakeTier as StakeTier;
        const variant = resolveVariant(payload.variant);
        const room = manager.findOrCreateRoom(tier, 5, variant);
        const ok = manager.joinRoom(
          socket.id, room.id,
          payload.userId, payload.username, payload.avatarId, chips,
        );
        if (!ok) {
          socket.emit('error', { message: 'Could not find a suitable table. Try a different stake level.' });
          return;
        }

        socket.join(room.id);
        socket.emit('joined_table', { tableId: room.id, state: room.getClientStateFor(socket.id) });
        io.emit('lobby_state', { tables: manager.getLobbyTables() });
        logger.info({ roomId: room.id, userId: payload.userId, tier }, 'Quick join');

        // If only one real player so far, schedule bot fill after 8 s
        const realCount = room.seats.filter(s => s && !s.socketId.startsWith('bot_')).length;
        if (realCount < 2) manager.scheduleBotFill(room, 3, 8_000);
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
