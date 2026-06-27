import { PokerRoom } from './room.js';
import { STAKE_CONFIG } from './types.js';
import type { StakeTier, LobbyTable } from './types.js';
import type { EmitFn, BroadcastFn } from './room.js';

export class RoomManager {
  private rooms = new Map<string, PokerRoom>();
  private socketRoom = new Map<string, string>();       // socketId → roomId (seated)
  private spectatorRoom = new Map<string, string>();    // socketId → roomId (spectating)
  private counter = 0;

  constructor(private emit: EmitFn, private broadcast: BroadcastFn) {}

  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return this.rooms.has(code) ? this.generateCode() : code;
  }

  createRoom(stakeTier: StakeTier, maxPlayers = 5): PokerRoom {
    const id = this.generateCode();
    const config = { ...STAKE_CONFIG[stakeTier], maxPlayers };
    const room = new PokerRoom(id, config, this.emit, this.broadcast);
    this.rooms.set(id, room);
    return room;
  }

  getRoom(roomId: string): PokerRoom | undefined {
    return this.rooms.get(roomId);
  }

  getRoomForSocket(socketId: string): PokerRoom | undefined {
    const roomId = this.socketRoom.get(socketId);
    return roomId ? this.rooms.get(roomId) : undefined;
  }

  joinRoom(socketId: string, roomId: string, userId: string, username: string, avatarId: number, chips: number): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    if (room.playerCount >= room.config.maxPlayers) return false;
    if (chips < room.config.minBuyIn) return false;
    const seatIdx = room.addPlayer(socketId, userId, username, avatarId, Math.min(chips, room.config.maxBuyIn));
    if (seatIdx === -1) return false;
    this.socketRoom.set(socketId, roomId);
    return true;
  }

  leaveRoom(socketId: string): void {
    const room = this.getRoomForSocket(socketId);
    if (!room) return;
    room.removePlayer(socketId);
    this.socketRoom.delete(socketId);
    if (room.isEmpty()) {
      this.rooms.delete(room.id);
    }
  }

  findOrCreateRoom(stakeTier: StakeTier, maxPlayers: number): PokerRoom {
    // Find existing open room for this tier
    for (const room of this.rooms.values()) {
      if (
        room.config.stakeTier === stakeTier &&
        room.config.maxPlayers === maxPlayers &&
        room.playerCount < room.config.maxPlayers
      ) {
        return room;
      }
    }
    return this.createRoom(stakeTier, maxPlayers);
  }

  getLobbyTables(): LobbyTable[] {
    return [...this.rooms.values()]
      .map(r => r.getLobbyInfo())
      .sort((a, b) => a.smallBlind - b.smallBlind);
  }

  // ─── Spectator tracking ───────────────────────────────────────────────────

  registerSpectator(socketId: string, roomId: string): void {
    this.spectatorRoom.set(socketId, roomId);
  }

  unregisterSpectator(socketId: string): void {
    this.spectatorRoom.delete(socketId);
  }

  getSpectatingRoomId(socketId: string): string | undefined {
    return this.spectatorRoom.get(socketId);
  }

  getSpectatingRoom(socketId: string): PokerRoom | undefined {
    const roomId = this.spectatorRoom.get(socketId);
    return roomId ? this.rooms.get(roomId) : undefined;
  }

  cleanupEmpty(): void {
    for (const [id, room] of this.rooms.entries()) {
      if (room.isEmpty()) this.rooms.delete(id);
    }
  }
}
