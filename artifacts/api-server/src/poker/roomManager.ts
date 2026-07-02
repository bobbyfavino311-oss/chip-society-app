import { PokerRoom } from './room.js';
import { STAKE_CONFIG } from './types.js';
import type { StakeTier, LobbyTable, ChipSyncFn, GameVariant } from './types.js';
import type { EmitFn, BroadcastFn } from './room.js';
import { pickBot, botBuyIn } from './botEngine.js';

export class RoomManager {
  private rooms        = new Map<string, PokerRoom>();
  private socketRoom   = new Map<string, string>();  // socketId → roomId (seated)
  private userIdRoom   = new Map<string, string>();  // userId   → roomId (for reconnect)
  private spectatorRoom = new Map<string, string>(); // socketId → roomId (spectating)
  private disconnectTimers = new Map<string, ReturnType<typeof setTimeout>>(); // userId → timer

  constructor(
    private emit: EmitFn,
    private broadcast: BroadcastFn,
    private onChipSync?: ChipSyncFn,
  ) {}

  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return this.rooms.has(code) ? this.generateCode() : code;
  }

  createRoom(stakeTier: StakeTier, maxPlayers = 5, variant: GameVariant = 'texas_holdem'): PokerRoom {
    const id = this.generateCode();
    const config = { ...STAKE_CONFIG[stakeTier], maxPlayers, variant };
    const room = new PokerRoom(id, config, this.emit, this.broadcast, this.onChipSync);
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

  getRoomForUser(userId: string): PokerRoom | undefined {
    const roomId = this.userIdRoom.get(userId);
    return roomId ? this.rooms.get(roomId) : undefined;
  }

  joinRoom(
    socketId: string,
    roomId: string,
    userId: string,
    username: string,
    avatarId: number,
    chips: number,
  ): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    if (room.playerCount >= room.config.maxPlayers) return false;
    if (chips < room.config.minBuyIn) return false;
    const seatIdx = room.addPlayer(socketId, userId, username, avatarId, Math.min(chips, room.config.maxBuyIn));
    if (seatIdx === -1) return false;
    this.socketRoom.set(socketId, roomId);
    this.userIdRoom.set(userId, roomId);
    return true;
  }

  leaveRoom(socketId: string): void {
    const room = this.getRoomForSocket(socketId);
    if (!room) return;
    const seatIdx = room.findSeatBySocketId(socketId);
    const userId = seatIdx !== -1 ? room.seats[seatIdx]?.userId : undefined;
    room.removePlayer(socketId);
    this.socketRoom.delete(socketId);
    if (userId) {
      this.userIdRoom.delete(userId);
      const timer = this.disconnectTimers.get(userId);
      if (timer) { clearTimeout(timer); this.disconnectTimers.delete(userId); }
    }
    if (room.isEmpty()) {
      this.rooms.delete(room.id);
    }
  }

  /**
   * Soft-disconnect: marks the seat as disconnected (auto-folds if their turn),
   * removes the socket mapping, and schedules a 60 s hard-remove timer.
   * The userId → roomId mapping is preserved so reconnectPlayer() can find the seat.
   */
  softDisconnect(socketId: string): void {
    const room = this.getRoomForSocket(socketId);
    if (!room) return;

    const userId = room.markDisconnected(socketId);
    this.socketRoom.delete(socketId);

    if (!userId) return;

    // Cancel any existing timer for this user
    const existing = this.disconnectTimers.get(userId);
    if (existing) clearTimeout(existing);

    // Hard-remove after 60 s if player hasn't reconnected
    const timer = setTimeout(() => {
      this.disconnectTimers.delete(userId);
      this.userIdRoom.delete(userId);
      room.removePlayerByUserId(userId);
      if (room.isEmpty()) this.rooms.delete(room.id);
    }, 60_000);
    this.disconnectTimers.set(userId, timer);
  }

  /**
   * Reconnect a player who lost their socket connection.
   * Cancels their disconnect timer, updates the seat's socketId, and
   * re-registers the socket → room mapping.
   */
  reconnectPlayer(userId: string, newSocketId: string): PokerRoom | null {
    const roomId = this.userIdRoom.get(userId);
    if (!roomId) return null;
    const room = this.rooms.get(roomId);
    if (!room) { this.userIdRoom.delete(userId); return null; }

    // Cancel the hard-remove timer
    const timer = this.disconnectTimers.get(userId);
    if (timer) { clearTimeout(timer); this.disconnectTimers.delete(userId); }

    const ok = room.reconnectPlayer(userId, newSocketId);
    if (!ok) return null;

    this.socketRoom.set(newSocketId, roomId);
    return room;
  }

  findOrCreateRoom(stakeTier: StakeTier, maxPlayers: number, variant: GameVariant = 'texas_holdem'): PokerRoom {
    for (const room of this.rooms.values()) {
      if (
        room.config.stakeTier === stakeTier &&
        room.config.maxPlayers === maxPlayers &&
        room.config.variant === variant &&
        room.playerCount < room.config.maxPlayers
      ) {
        return room;
      }
    }
    return this.createRoom(stakeTier, maxPlayers, variant);
  }

  /**
   * Fill empty seats with bots after a delay.
   * Called when a real player joins and the room still needs more players.
   * Bots are added immediately (one bot) so the game starts quickly, then
   * optionally more bots fill remaining empty seats.
   *
   * @param room        The room to fill
   * @param targetCount Desired total player count (capped at maxPlayers)
   * @param delayMs     How long to wait before adding the first bot (default 8 s)
   */
  scheduleBotFill(room: PokerRoom, targetCount = 3, delayMs = 8_000): void {
    const roomId = room.id;

    const doFill = () => {
      const r = this.rooms.get(roomId);
      if (!r) return; // room was cleaned up

      const currentCount = r.playerCount;
      if (currentCount >= targetCount) return; // enough real players joined

      const seated = new Set(
        r.seats.filter(Boolean).map(s => s!.username)
      );
      const toAdd = Math.min(targetCount - currentCount, r.config.maxPlayers - currentCount);

      for (let i = 0; i < toAdd; i++) {
        const bot   = pickBot(seated);
        const chips = botBuyIn(r.config);
        const idx   = r.addBot(bot, chips);
        if (idx === -1) break;
        seated.add(bot.username);
      }
    };

    setTimeout(doFill, delayMs);
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
