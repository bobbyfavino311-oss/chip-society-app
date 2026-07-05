import { createDeckForVariant, holeCardCountForVariant, shuffleDeck, getBestHandForVariant, compareHands } from './engine.js';
import type {
  Card, Seat, RoomPhase, RoomConfig, GameMessage,
  ClientGameState, SeatView, WinnerInfo, PlayerAction, ChipSyncFn,
} from './types.js';
import { decideBotAction } from './botEngine.js';
import type { BotProfile, BotDifficulty } from './botEngine.js';

const TURN_TIMEOUT_MS = 30_000;
const SHOWDOWN_DELAY_MS = 5_000;
const HAND_START_DELAY_MS = 3_000;

// Bot "thinking" delay ranges, mirrored from AI Practice mode's
// DIFFICULTY_CONFIGS[*].delayMs (lib/aiBot.ts) so multiplayer bots feel
// identical in pacing to practice-mode bots instead of acting instantly.
const BOT_DELAY_MS: Record<BotDifficulty, [number, number]> = {
  ROOKIE: [1800, 3500],
  SOLID:  [1300, 2800],
  SHARK:  [1000, 2200],
};

export type EmitFn = (socketId: string, event: string, data: unknown) => void;
export type BroadcastFn = (roomId: string, event: string, data: unknown) => void;

export class PokerRoom {
  readonly id: string;
  readonly config: RoomConfig;

  seats: (Seat | null)[];
  deck: Card[] = [];
  communityCards: Card[] = [];
  pot: number = 0;
  phase: RoomPhase = 'waiting';
  dealerSeat: number = -1;
  activeSeat: number = -1;
  currentBet: number = 0;
  winners: WinnerInfo[] = [];
  messages: GameMessage[] = [];

  spectators = new Set<string>();
  private requestedSitOut = new Set<string>();

  private actedThisRound = new Set<number>();
  private turnTimer: ReturnType<typeof setTimeout> | null = null;
  private handTimer: ReturnType<typeof setTimeout> | null = null;
  turnTimeoutAt: number | null = null;

  private emit: EmitFn;
  private broadcast: BroadcastFn;
  private onChipSync: ChipSyncFn | null;

  constructor(
    id: string,
    config: RoomConfig,
    emit: EmitFn,
    broadcast: BroadcastFn,
    onChipSync?: ChipSyncFn,
  ) {
    this.id = id;
    this.config = config;
    this.seats = new Array(config.maxPlayers).fill(null);
    this.emit = emit;
    this.broadcast = broadcast;
    this.onChipSync = onChipSync ?? null;
  }

  // ─── Player management ────────────────────────────────────────────────────

  findSeatBySocketId(socketId: string): number {
    return this.seats.findIndex(s => s?.socketId === socketId);
  }

  findSeatByUserId(userId: string): number {
    return this.seats.findIndex(s => s?.userId === userId);
  }

  addPlayer(socketId: string, userId: string, username: string, avatarId: number, chips: number): number {
    const emptyIdx = this.seats.findIndex(s => s === null);
    if (emptyIdx === -1) return -1;
    this.seats[emptyIdx] = {
      socketId, userId, username, avatarId,
      chips, startingChips: chips,
      cards: [], currentBet: 0, totalBet: 0, status: 'active',
    };
    this.addMessage(`${username} joined the table`, 'info');
    this.broadcastState();
    this.maybeScheduleHandStart();
    return emptyIdx;
  }

  // ─── Bot management ───────────────────────────────────────────────────────

  /** Add a bot to an empty seat. Returns the seat index, or -1 if table is full. */
  addBot(profile: BotProfile, chips: number): number {
    const emptyIdx = this.seats.findIndex(s => s === null);
    if (emptyIdx === -1) return -1;
    const socketId = `bot_${profile.userId}`;
    this.seats[emptyIdx] = {
      socketId,
      userId:   profile.userId,
      username: profile.username,
      avatarId: profile.avatarId,
      chips,
      startingChips: chips,
      cards: [], currentBet: 0, totalBet: 0, status: 'active',
    };
    this.addMessage(`${profile.username} joined the table`, 'info');
    this.broadcastState();
    this.maybeScheduleHandStart();
    return emptyIdx;
  }

  isBotSeat(seatIdx: number): boolean {
    const seat = this.seats[seatIdx];
    return seat?.socketId.startsWith('bot_') ?? false;
  }

  getBotIds(): string[] {
    return this.seats
      .filter(s => s?.socketId.startsWith('bot_'))
      .map(s => s!.userId);
  }

  /** Remove all bots. Called when enough real players have joined. */
  removeBotsWhenFull(): void {
    // Only remove bots if we'd still have 2+ real players after removal — but
    // we never forcibly remove bots mid-hand; wait until a natural seat-exit.
    // For now this is a no-op — bots stay for the duration of their "session."
  }

  /**
   * Fire bot decisions for the active seat if it belongs to a bot.
   * Called by RoomManager after every broadcastState if activeSeat is a bot.
   */
  triggerBotTurn(): void {
    if (this.phase === 'waiting' || this.phase === 'showdown') return;
    const idx = this.activeSeat;
    if (idx < 0 || !this.isBotSeat(idx)) return;
    const seat = this.seats[idx];
    if (!seat || seat.status !== 'active') return;

    // Pull difficulty from userId tag if present
    const uid = seat.userId;
    const diff = uid.includes('robo') || uid.includes('bluff') || uid.includes('midnight')
      ? 'SHARK'
      : uid.includes('fold') || uid.includes('safe')
      ? 'ROOKIE'
      : 'SOLID';

    const position: 'early' | 'middle' | 'late' =
      idx < this.config.maxPlayers / 3 ? 'early'
      : idx < (this.config.maxPlayers * 2) / 3 ? 'middle'
      : 'late';

    const toCall = Math.min(
      Math.max(0, this.currentBet - seat.currentBet),
      seat.chips,
    );

    const decision = decideBotAction({
      difficulty:     diff,
      holeCards:      seat.cards,
      communityCards: this.communityCards,
      toCall,
      chips:          seat.chips,
      currentBet:     this.currentBet,
      minRaise:       this.currentBet + this.config.bigBlind,
      bigBlind:       this.config.bigBlind,
      potSize:        this.pot,
      isPreflop:      this.phase === 'preflop',
      position,
    });

    // Thinking delay — matches AI Practice mode's per-difficulty pacing so
    // multiplayer bots feel identical to practice bots, not instant/robotic.
    const [minDelay, maxDelay] = BOT_DELAY_MS[diff];
    const delay = minDelay + Math.floor(Math.random() * (maxDelay - minDelay));
    setTimeout(() => {
      // Re-verify bot is still active (hand state may have changed)
      if (this.activeSeat !== idx || !this.isBotSeat(idx)) return;
      const s = this.seats[idx];
      if (!s || s.status !== 'active') return;
      this.clearTurnTimer();
      this.handleAction(seat.socketId, decision);
    }, delay);
  }

  // ─── Soft disconnect (60 s reconnect window, handled by RoomManager) ──────

  /**
   * Mark a player as disconnected. Auto-folds their turn if active.
   * Returns the player's userId so the caller can schedule a hard-remove timer.
   */
  markDisconnected(socketId: string): string | null {
    const idx = this.findSeatBySocketId(socketId);
    if (idx === -1) return null;
    const seat = this.seats[idx]!;
    seat.isDisconnected = true;
    seat.disconnectedAt = Date.now();
    this.addMessage(`${seat.username} disconnected — 60s to rejoin`, 'info');

    if (
      this.phase !== 'waiting' &&
      this.phase !== 'showdown' &&
      idx === this.activeSeat &&
      seat.status === 'active'
    ) {
      this.clearTurnTimer();
      seat.status = 'folded';
      this.actedThisRound.add(idx);
      this.broadcastState();
      this.advanceAfterAction();
    } else {
      this.broadcastState();
    }

    return seat.userId;
  }

  /** Restore a player's socket after they reconnect. */
  reconnectPlayer(userId: string, newSocketId: string): boolean {
    const idx = this.findSeatByUserId(userId);
    if (idx === -1) return false;
    const seat = this.seats[idx]!;

    seat.socketId = newSocketId;
    seat.isDisconnected = false;
    delete seat.disconnectedAt;

    this.addMessage(`${seat.username} reconnected`, 'info');
    this.broadcastState();
    return true;
  }

  /** Hard-remove a player by userId (called after the 60 s grace period). */
  removePlayerByUserId(userId: string): void {
    const idx = this.findSeatByUserId(userId);
    if (idx === -1) return;
    const seat = this.seats[idx]!;
    this.addMessage(`${seat.username} removed (timed out)`, 'info');
    if (
      this.phase !== 'waiting' &&
      this.phase !== 'showdown' &&
      idx === this.activeSeat
    ) {
      this.seats[idx]!.status = 'folded';
      this.seats[idx] = null;
      this.broadcastState();
      this.advanceAfterAction();
    } else {
      this.seats[idx] = null;
      this.broadcastState();
    }
    this.checkTableVacant();
  }

  // ─── Spectator management ─────────────────────────────────────────────────

  addSpectator(socketId: string): void {
    this.spectators.add(socketId);
    this.emit(socketId, 'game_state', this.getClientStateFor(socketId));
  }

  removeSpectator(socketId: string): void {
    this.spectators.delete(socketId);
  }

  // ─── Sit-out toggle ───────────────────────────────────────────────────────

  handleSitOut(socketId: string, wantsSitOut: boolean): void {
    const seat = this.seats[this.findSeatBySocketId(socketId)];
    if (!seat) return;
    if (wantsSitOut) {
      this.requestedSitOut.add(socketId);
      if (this.phase === 'waiting') seat.status = 'sitting_out';
      this.addMessage(`${seat.username} is sitting out next hand`, 'info');
    } else {
      this.requestedSitOut.delete(socketId);
      if (seat.status === 'sitting_out') seat.status = 'active';
      this.addMessage(`${seat.username} is back in`, 'info');
      if (this.phase === 'waiting') this.maybeScheduleHandStart();
    }
    this.broadcastState();
  }

  // ─── Chat ─────────────────────────────────────────────────────────────────

  handleChat(socketId: string, text: string): void {
    const seat = this.seats[this.findSeatBySocketId(socketId)];
    const spectator = this.spectators.has(socketId);
    if (!seat && !spectator) return;
    const username = seat?.username ?? 'Spectator';
    const userId   = seat?.userId   ?? socketId;
    const ts       = Date.now();
    const cleaned  = text.replace(/\b(fuck|shit|bitch|cunt|cock|ass)\b/gi, m => '*'.repeat(m.length))
                        .trim().slice(0, 100);
    if (!cleaned) return;
    const payload = { playerId: userId, playerName: username, text: cleaned, ts };
    for (const s of this.seats) {
      if (s) this.emit(s.socketId, 'chat_message', payload);
    }
    for (const sid of this.spectators) {
      this.emit(sid, 'chat_message', payload);
    }
  }

  removePlayer(socketId: string): void {
    this.requestedSitOut.delete(socketId);
    const idx = this.findSeatBySocketId(socketId);
    if (idx === -1) return;
    const seat = this.seats[idx]!;
    this.addMessage(`${seat.username} left the table`, 'info');
    if (this.phase !== 'waiting' && this.phase !== 'showdown' && idx === this.activeSeat) {
      this.seats[idx]!.status = 'folded';
      this.seats[idx] = null;
      this.broadcastState();
      this.advanceAfterAction();
    } else {
      this.seats[idx] = null;
      this.broadcastState();
    }
    this.checkTableVacant();
  }

  get playerCount(): number {
    return this.seats.filter(s => s !== null).length;
  }

  isEmpty(): boolean {
    return this.playerCount === 0;
  }

  // ─── Hand lifecycle ───────────────────────────────────────────────────────

  private readyCount(): number {
    return this.seats.filter(
      s => s !== null && !this.requestedSitOut.has(s.socketId) && !s.isDisconnected
    ).length;
  }

  private maybeScheduleHandStart(): void {
    if (this.phase !== 'waiting') return;
    if (this.readyCount() < 2) return;
    if (this.handTimer) return;
    this.handTimer = setTimeout(() => {
      this.handTimer = null;
      this.startHand();
    }, HAND_START_DELAY_MS);
  }

  private startHand(): void {
    const allSeated = this.seats.map((s, i) => ({ s, i })).filter(x => x.s !== null);
    const activePlayers = allSeated.filter(
      x => !this.requestedSitOut.has(x.s!.socketId) && !x.s!.isDisconnected
    );

    if (activePlayers.length < 2) {
      this.phase = 'waiting';
      this.broadcastState();
      return;
    }

    this.deck = shuffleDeck(createDeckForVariant(this.config.variant));
    this.communityCards = [];
    this.pot = 0;
    this.currentBet = 0;
    this.winners = [];
    this.messages = [];
    this.actedThisRound.clear();

    for (const { s } of allSeated) {
      if (!s) continue;
      if (this.requestedSitOut.has(s.socketId) || s.isDisconnected) {
        s.status = 'sitting_out';
      } else {
        s.cards = []; s.currentBet = 0; s.totalBet = 0; s.status = 'active';
        s.startingChips = s.chips;
      }
    }

    this.dealerSeat = this.nextActiveSeatFrom(this.dealerSeat === -1 ? 0 : this.dealerSeat, true);

    const numHoleCards = holeCardCountForVariant(this.config.variant);
    for (const { s } of activePlayers) {
      const cards: Card[] = [];
      for (let n = 0; n < numHoleCards; n++) cards.push(this.deck.pop()!);
      s!.cards = cards;
    }

    const isHeadsUp = activePlayers.length === 2;
    const sbSeat = isHeadsUp ? this.dealerSeat : this.nextActiveSeatFrom(this.dealerSeat);
    const bbSeat = this.nextActiveSeatFrom(sbSeat);

    this.postBlind(sbSeat, this.config.smallBlind);
    this.postBlind(bbSeat, this.config.bigBlind);
    this.currentBet = this.config.bigBlind;

    this.phase = 'preflop';
    this.addMessage('New hand started', 'info');

    const utg = this.nextActiveSeatFrom(bbSeat);
    this.activeSeat = utg;

    this.broadcastState();
    this.startTurnTimer();
  }

  private postBlind(seatIdx: number, amount: number): void {
    const seat = this.seats[seatIdx];
    if (!seat) return;
    const actual = Math.min(amount, seat.chips);
    seat.chips -= actual;
    seat.currentBet = actual;
    seat.totalBet = actual;
    this.pot += actual;
    if (seat.chips === 0) seat.status = 'allin';
  }

  // ─── Action handling ──────────────────────────────────────────────────────

  handleAction(socketId: string, action: PlayerAction): void {
    const seatIdx = this.findSeatBySocketId(socketId);
    if (seatIdx === -1 || seatIdx !== this.activeSeat) return;
    const seat = this.seats[seatIdx];
    if (!seat || seat.status !== 'active') return;

    this.clearTurnTimer();

    switch (action.type) {
      case 'fold':   this.doFold(seat, seatIdx);                    break;
      case 'check':  this.doCheck(seat, seatIdx);                   break;
      case 'call':   this.doCall(seat, seatIdx);                    break;
      case 'raise':  this.doRaise(seat, seatIdx, action.amount);    break;
      case 'allin':  this.doAllin(seat, seatIdx);                   break;
    }
  }

  private doFold(seat: Seat, seatIdx: number): void {
    seat.status = 'folded';
    this.addMessage(`${seat.username} folds`, 'action');
    this.actedThisRound.add(seatIdx);
    this.advanceAfterAction();
  }

  private doCheck(seat: Seat, seatIdx: number): void {
    if (seat.currentBet < this.currentBet) {
      this.doCall(seat, seatIdx);
      return;
    }
    this.addMessage(`${seat.username} checks`, 'action');
    this.actedThisRound.add(seatIdx);
    this.advanceAfterAction();
  }

  private doCall(seat: Seat, seatIdx: number): void {
    const toCall = Math.min(this.currentBet - seat.currentBet, seat.chips);
    seat.chips -= toCall;
    seat.currentBet += toCall;
    seat.totalBet += toCall;
    this.pot += toCall;
    if (seat.chips === 0) {
      seat.status = 'allin';
      this.addMessage(`${seat.username} calls ${toCall} and is all-in`, 'action');
    } else {
      this.addMessage(`${seat.username} calls ${toCall}`, 'action');
    }
    this.actedThisRound.add(seatIdx);
    this.advanceAfterAction();
  }

  private doRaise(seat: Seat, seatIdx: number, raiseToAmount?: number): void {
    const minRaise = this.currentBet + this.config.bigBlind;
    const target = Math.max(minRaise, Math.min(raiseToAmount ?? minRaise, seat.chips + seat.currentBet));
    if (target >= seat.chips + seat.currentBet) {
      this.doAllin(seat, seatIdx);
      return;
    }
    const toAdd = target - seat.currentBet;
    seat.chips -= toAdd;
    seat.currentBet = target;
    seat.totalBet += toAdd;
    this.pot += toAdd;
    this.currentBet = target;
    this.actedThisRound.clear();
    this.actedThisRound.add(seatIdx);
    this.addMessage(`${seat.username} raises to ${target.toLocaleString()}`, 'action');
    this.advanceAfterAction();
  }

  private doAllin(seat: Seat, seatIdx: number): void {
    const allIn = seat.chips;
    seat.currentBet += allIn;
    seat.totalBet += allIn;
    this.pot += allIn;
    seat.chips = 0;
    seat.status = 'allin';
    if (seat.currentBet > this.currentBet) {
      this.currentBet = seat.currentBet;
      this.actedThisRound.clear();
    }
    this.actedThisRound.add(seatIdx);
    this.addMessage(`${seat.username} is all-in for ${seat.currentBet.toLocaleString()}`, 'action');
    this.advanceAfterAction();
  }

  // ─── Betting round progression ────────────────────────────────────────────

  private advanceAfterAction(): void {
    const nonFolded = this.seats.filter(s => s !== null && s.status !== 'folded');
    if (nonFolded.length === 1) {
      this.endHand();
      return;
    }

    if (this.isBettingRoundComplete()) {
      this.nextPhase();
      return;
    }

    const next = this.nextActiveSeatFrom(this.activeSeat);
    if (next === this.activeSeat) {
      this.nextPhase();
      return;
    }
    this.activeSeat = next;
    this.broadcastState();
    this.startTurnTimer();
  }

  private isBettingRoundComplete(): boolean {
    const activePlayers = this.seats
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => s?.status === 'active');
    if (activePlayers.length === 0) return true;
    return activePlayers.every(
      ({ s, i }) => this.actedThisRound.has(i) && s!.currentBet === this.currentBet
    );
  }

  private nextPhase(): void {
    for (const seat of this.seats) {
      if (seat) seat.currentBet = 0;
    }
    this.currentBet = 0;
    this.actedThisRound.clear();

    const activePlayers = this.seats.filter(s => s !== null && s.status !== 'folded');
    const canBetPlayers = activePlayers.filter(s => s!.status === 'active');

    switch (this.phase) {
      case 'preflop':
        this.communityCards = [this.deck.pop()!, this.deck.pop()!, this.deck.pop()!];
        this.phase = 'flop';
        break;
      case 'flop':
        this.communityCards.push(this.deck.pop()!);
        this.phase = 'turn';
        break;
      case 'turn':
        this.communityCards.push(this.deck.pop()!);
        this.phase = 'river';
        break;
      case 'river':
        this.endHand();
        return;
      default:
        return;
    }

    if (canBetPlayers.length <= 1) {
      while (this.communityCards.length < 5) this.communityCards.push(this.deck.pop()!);
      this.endHand();
      return;
    }

    this.activeSeat = this.nextActiveSeatFrom(this.dealerSeat);
    this.broadcastState();
    this.startTurnTimer();
  }

  // ─── Side pot calculation ─────────────────────────────────────────────────

  private awardSidePots(): void {
    const contributors = this.seats
      .map((s, i) => ({ seat: s!, idx: i }))
      .filter(x => x.seat !== null && x.seat.totalBet > 0);

    if (contributors.length === 0) return;

    const levels = [...new Set(contributors.map(c => c.seat.totalBet))].sort((a, b) => a - b);

    this.winners = [];
    let prevLevel = 0;

    for (const level of levels) {
      const perPlayer = level - prevLevel;

      let potAmount = 0;
      for (const c of contributors) {
        potAmount += Math.min(Math.max(0, c.seat.totalBet - prevLevel), perPlayer);
      }

      const eligible = contributors.filter(
        c => c.seat.status !== 'folded' && c.seat.totalBet >= level
      );

      if (potAmount > 0 && eligible.length === 1) {
        eligible[0].seat.chips += potAmount;
      } else if (potAmount > 0 && eligible.length > 1) {
        const evaluated = eligible.map(e => ({
          idx: e.idx,
          seat: e.seat,
          hand: getBestHandForVariant(this.config.variant, e.seat.cards, this.communityCards),
        }));
        evaluated.sort((a, b) => compareHands(b.hand, a.hand));
        const best = evaluated[0].hand;
        const potWinners = evaluated.filter(e => compareHands(e.hand, best) === 0);
        const share = Math.floor(potAmount / potWinners.length);

        for (const w of potWinners) {
          w.seat.chips += share;
          const existing = this.winners.find(x => x.seatIndex === w.idx);
          if (existing) {
            existing.amount += share;
          } else {
            this.winners.push({
              seatIndex: w.idx,
              username: w.seat.username,
              amount: share,
              handRank: w.hand.name,
              cards: w.seat.cards,
            });
          }
        }
      }

      prevLevel = level;
    }

    for (const w of this.winners) {
      this.addMessage(
        `${w.username} wins ${w.amount.toLocaleString()}${w.handRank ? ` with ${w.handRank}` : ''}!`,
        'result'
      );
    }

    this.pot = 0;
  }

  private endHand(): void {
    this.clearTurnTimer();
    this.phase = 'showdown';

    const nonFolded = this.seats
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => s !== null && s.status !== 'folded');

    if (nonFolded.length === 1) {
      const { s, i } = nonFolded[0];
      s!.chips += this.pot;
      this.winners = [{ seatIndex: i, username: s!.username, amount: this.pot }];
      this.addMessage(`${s!.username} wins ${this.pot.toLocaleString()} (uncontested)`, 'result');
      this.pot = 0;
    } else {
      this.awardSidePots();
    }

    this.broadcastState();

    // Sync chip counts to DB after pots are distributed
    this.fireChipSync();

    this.handTimer = setTimeout(() => {
      this.handTimer = null;
      for (let i = 0; i < this.seats.length; i++) {
        if (this.seats[i] && this.seats[i]!.chips <= 0) {
          this.addMessage(`${this.seats[i]!.username} is out of chips and leaves`, 'info');
          this.seats[i] = null;
        }
      }
      if (this.playerCount >= 2) {
        this.startHand();
      } else {
        this.phase = 'waiting';
        this.broadcastState();
      }
    }, SHOWDOWN_DELAY_MS);
  }

  private fireChipSync(): void {
    if (!this.onChipSync) return;
    const seated = this.seats
      .filter(s => s !== null)
      .map(s => ({ userId: s!.userId, chips: s!.chips }));
    this.onChipSync(seated);
  }

  // ─── Turn timer ───────────────────────────────────────────────────────────

  private startTurnTimer(): void {
    this.clearTurnTimer();
    this.turnTimeoutAt = Date.now() + TURN_TIMEOUT_MS;
    this.turnTimer = setTimeout(() => {
      const seat = this.seats[this.activeSeat];
      if (seat) {
        this.addMessage(`${seat.username} timed out — auto fold`, 'action');
        this.doFold(seat, this.activeSeat);
      }
    }, TURN_TIMEOUT_MS);
  }

  private clearTurnTimer(): void {
    if (this.turnTimer) { clearTimeout(this.turnTimer); this.turnTimer = null; }
    this.turnTimeoutAt = null;
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private nextActiveSeatFrom(fromSeat: number, skipSelf = false): number {
    const start = skipSelf ? (fromSeat + 1) % this.config.maxPlayers : (fromSeat + 1) % this.config.maxPlayers;
    let cur = start;
    for (let i = 0; i < this.config.maxPlayers; i++) {
      const s = this.seats[cur];
      if (s && s.status === 'active') return cur;
      cur = (cur + 1) % this.config.maxPlayers;
    }
    return fromSeat;
  }

  private checkTableVacant(): void {
    if (this.playerCount < 2 && this.phase !== 'waiting') {
      this.clearTurnTimer();
      if (this.handTimer) { clearTimeout(this.handTimer); this.handTimer = null; }
      this.phase = 'waiting';
      this.broadcastState();
    }
    if (this.playerCount < 2 && this.handTimer) {
      clearTimeout(this.handTimer);
      this.handTimer = null;
    }
  }

  private addMessage(text: string, type: 'action' | 'result' | 'info'): void {
    this.messages = [{ text, type, timestamp: Date.now() }, ...this.messages].slice(0, 20);
  }

  // ─── State serialization ──────────────────────────────────────────────────

  getClientStateFor(socketId: string): ClientGameState {
    const mySeat = this.findSeatBySocketId(socketId);
    const mySeatData = mySeat !== -1 ? this.seats[mySeat] : null;
    const isMyTurn = mySeat === this.activeSeat;
    const callAmount = mySeatData
      ? Math.min(Math.max(0, this.currentBet - mySeatData.currentBet), mySeatData.chips)
      : 0;
    const minRaise = this.currentBet + this.config.bigBlind;
    const maxRaise = mySeatData ? mySeatData.chips + mySeatData.currentBet : 0;

    const seats: (SeatView | null)[] = this.seats.map((s, i) => {
      if (!s) return null;
      const isWinner = this.winners.some(w => w.seatIndex === i);
      return {
        seatIndex: i,
        userId: s.userId,
        username: s.username,
        avatarId: s.avatarId,
        chips: s.chips,
        currentBet: s.currentBet,
        totalBet: s.totalBet,
        status: s.status,
        isDealer: i === this.dealerSeat,
        isTurn: i === this.activeSeat,
        cardCount: s.cards.length,
        cards: s.socketId === socketId ? s.cards : undefined,
        revealedCards: this.phase === 'showdown' && s.status !== 'folded' ? s.cards : undefined,
        revealedHand: this.phase === 'showdown' && isWinner
          ? (this.winners.find(w => w.seatIndex === i)?.handRank)
          : undefined,
        isDisconnected: s.isDisconnected,
      };
    });

    return {
      tableId: this.id,
      phase: this.phase,
      seats,
      communityCards: this.communityCards,
      pot: this.pot,
      currentBet: this.currentBet,
      dealerSeat: this.dealerSeat,
      activeSeat: this.activeSeat,
      smallBlind: this.config.smallBlind,
      bigBlind: this.config.bigBlind,
      mySeat,
      myCards: mySeatData?.cards ?? [],
      isMyTurn,
      callAmount,
      minRaise,
      maxRaise,
      turnTimeoutAt: this.turnTimeoutAt,
      messages: this.messages,
      winners: this.phase === 'showdown' ? this.winners : undefined,
      variant: this.config.variant,
    };
  }

  getLobbyInfo() {
    return {
      id: this.id,
      stakeTier: this.config.stakeTier,
      smallBlind: this.config.smallBlind,
      bigBlind: this.config.bigBlind,
      playerCount: this.playerCount,
      maxPlayers: this.config.maxPlayers,
      phase: this.phase,
      minBuyIn: this.config.minBuyIn,
      variant: this.config.variant,
    };
  }

  private broadcastState(): void {
    for (const seat of this.seats) {
      if (seat && !seat.isDisconnected && !seat.socketId.startsWith('bot_')) {
        const state = this.getClientStateFor(seat.socketId);
        this.emit(seat.socketId, 'game_state', state);
      }
    }
    for (const sid of this.spectators) {
      this.emit(sid, 'game_state', this.getClientStateFor(sid));
    }
    this.broadcast(this.id, 'lobby_update', null);

    // If the active seat is a bot, schedule their decision
    if (this.activeSeat >= 0 && this.isBotSeat(this.activeSeat)) {
      this.triggerBotTurn();
    }
  }
}
