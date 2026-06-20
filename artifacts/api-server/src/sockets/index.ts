import { Server as SocketIOServer } from 'socket.io';
import type { Server as HttpServer } from 'http';
import { RoomManager } from '../poker/roomManager.js';
import { logger } from '../lib/logger.js';

export function setupSocketIO(httpServer: HttpServer): void {
  const io = new SocketIOServer(httpServer, {
    path: '/api/socket.io',
    cors: { origin: '*', methods: ['GET', 'POST'] },
    transports: ['websocket', 'polling'],
  });

  const emit = (socketId: string, event: string, data: unknown) => {
    io.to(socketId).emit(event, data);
  };

  const broadcast = (roomId: string, _event: string, _data: unknown) => {
    // Notify lobby watchers (non-table sockets) of lobby update
    const tables = manager.getLobbyTables();
    io.emit('lobby_state', { tables });
  };

  const manager = new RoomManager(emit, broadcast);

  io.on('connection', (socket) => {
    logger.info({ socketId: socket.id }, 'Socket connected');

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

    // ─── Disconnect ───────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      logger.info({ socketId: socket.id }, 'Socket disconnected');
      const room = manager.getRoomForSocket(socket.id);
      if (room) socket.leave(room.id);
      manager.leaveRoom(socket.id);
      io.emit('lobby_state', { tables: manager.getLobbyTables() });
    });
  });

  logger.info('Socket.IO attached at /api/socket.io');
}
