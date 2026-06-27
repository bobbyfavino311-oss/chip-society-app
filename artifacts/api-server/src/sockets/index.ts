import { Server as SocketIOServer } from 'socket.io';
import type { Server as HttpServer } from 'http';
import { RoomManager } from '../poker/roomManager.js';
import { logger } from '../lib/logger.js';

// ── Player presence registry ───────────────────────────────────────────────────
// Maps playerId → socketId so admin routes can push events to a specific player.
const playerSockets = new Map<string, string>(); // playerId → socketId
const socketPlayers = new Map<string, string>(); // socketId → playerId (for disconnect cleanup)

let _io: SocketIOServer | null = null;

/**
 * Emit a real-time event to a specific online player by playerId.
 * Returns true if the player was online and the event was delivered.
 */
export function emitToPlayer(playerId: string, event: string, data: unknown): boolean {
  const socketId = playerSockets.get(playerId);
  if (!socketId || !_io) {
    logger.info({ playerId, event, socketFound: false }, 'emitToPlayer: player offline or server not ready');
    return false;
  }
  _io.to(socketId).emit(event, data);
  logger.info({ playerId, socketId, event, socketFound: true }, 'emitToPlayer: event emitted');
  return true;
}

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
    const tables = manager.getLobbyTables();
    io.emit('lobby_state', { tables });
  };

  const manager = new RoomManager(emit, broadcast);

  io.on('connection', (socket) => {
    logger.info({ socketId: socket.id }, 'Socket connected');

    // ─── Player presence registration ─────────────────────────────────────
    // Called immediately after login so admin routes can push events to the right player.
    socket.on('register_player', (payload: { playerId: string; username?: string }) => {
      const { playerId } = payload;
      if (!playerId) return;
      // Evict any stale socket for this player (e.g. reconnect)
      const oldSocketId = playerSockets.get(playerId);
      if (oldSocketId && oldSocketId !== socket.id) {
        socketPlayers.delete(oldSocketId);
      }
      playerSockets.set(playerId, socket.id);
      socketPlayers.set(socket.id, playerId);
      socket.join(`player:${playerId}`);
      logger.info({ playerId, socketId: socket.id, username: payload.username ?? 'unknown' }, 'Player registered for push notifications');
    });

    // ─── Lobby ────────────────────────────────────────────────────────────
    socket.on('get_lobby', () => {
      socket.emit('lobby_state', { tables: manager.getLobbyTables() });
    });

    // ─── Create table ─────────────────────────────────────────────────────
    socket.on('create_table', (payload: {
      stakeTier: string;
      maxPlayers?: number;
      userId: string;
      username: string;
      avatarId: number;
      chips: number;
    }) => {
      try {
        const tier = payload.stakeTier as any;
        const room = manager.createRoom(tier, payload.maxPlayers ?? 5);
        const ok = manager.joinRoom(
          socket.id, room.id,
          payload.userId, payload.username, payload.avatarId, payload.chips
        );
        if (!ok) {
          socket.emit('error', { message: 'Could not join created table — check chip balance.' });
          return;
        }
        socket.join(room.id);
        socket.emit('joined_table', { tableId: room.id, state: room.getClientStateFor(socket.id) });
        io.emit('lobby_state', { tables: manager.getLobbyTables() });
        logger.info({ roomId: room.id, socketId: socket.id }, 'Table created');
      } catch (e) {
        socket.emit('error', { message: 'Failed to create table.' });
      }
    });

    // ─── Join table ───────────────────────────────────────────────────────
    socket.on('join_table', (payload: {
      tableId: string;
      userId: string;
      username: string;
      avatarId: number;
      chips: number;
    }) => {
      const existing = manager.getRoomForSocket(socket.id);
      if (existing) {
        socket.emit('error', { message: 'Already seated at a table. Leave first.' });
        return;
      }
      const ok = manager.joinRoom(
        socket.id, payload.tableId,
        payload.userId, payload.username, payload.avatarId, payload.chips
      );
      if (!ok) {
        socket.emit('error', { message: 'Cannot join table — full or insufficient chips.' });
        return;
      }
      const room = manager.getRoom(payload.tableId)!;
      socket.join(payload.tableId);
      socket.emit('joined_table', { tableId: payload.tableId, state: room.getClientStateFor(socket.id) });
      io.emit('lobby_state', { tables: manager.getLobbyTables() });
      logger.info({ roomId: payload.tableId, socketId: socket.id }, 'Joined table');
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
      const pid = socketPlayers.get(socket.id);
      if (pid) {
        playerSockets.delete(pid);
        socketPlayers.delete(socket.id);
        logger.info({ playerId: pid, socketId: socket.id }, 'Player presence removed on disconnect');
      }
      // Clean up spectator registration
      const spectatingRoomId = manager.getSpectatingRoomId(socket.id);
      if (spectatingRoomId) {
        manager.getRoom(spectatingRoomId)?.removeSpectator(socket.id);
        manager.unregisterSpectator(socket.id);
      }
      const room = manager.getRoomForSocket(socket.id);
      if (room) socket.leave(room.id);
      manager.leaveRoom(socket.id);
      io.emit('lobby_state', { tables: manager.getLobbyTables() });
    });
  });

  logger.info('Socket.IO attached at /api/socket.io');
}
