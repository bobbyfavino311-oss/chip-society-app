import { createDeck, shuffleDeck, getBestHand, compareHands } from './engine.js';
import type {
  Card, Seat, RoomPhase, RoomConfig, GameMessage,
  ClientGameState, SeatView, WinnerInfo, PlayerAction,
} from './types.js';

const TURN_TIMEOUT_MS = 30_000;
const SHOWDOWN_DELAY_MS = 5_000;
const HAND_START_DELAY_MS = 3_000;

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

  private actedThisRound = new Set<number>();
  private turnTimer: ReturnType<typeof setTimeout> | null = null;
  private handTimer: ReturnType<typeof setTimeout> | null = null;
  turnTimeoutAt: number | null = null;

  private emit: EmitFn;
  private broadcast: BroadcastFn;

  constructor(id: string, config: RoomConfig, emit: EmitFn, broadcast: BroadcastFn) {
    this.id = id;
    this.config = config;
    this.seats = new Array(config.maxPlayers).fill(null);
    this.emit = emit;
    this.broadcast = broadcast;
  }

  // ─── Player management ────────────────────────────────────────────────────

  findSeatBySocketId(socketId: string): number {
    return this.seats.findIndex(s => s?.socketId === socketId);
  }

  addPlayer(socketId: string, userId: string, username: string, avatarId: number, chips: number): number {
    const emptyIdx = this.seats.findIndex(s => s === null);
    if (emptyIdx === -1) return -1;
    this.seats[emptyIdx] = {
      socketId, userId, username, avatarId,
      chips, cards: [], currentBet: 0, totalBet: 0, status: 'sitting_out',
    };
    this.addMessage(`${username} joined the table`, 'info');
    this.broadcastState();
    this.maybeScheduleHandStart();
    return emptyIdx;
  }

  removePlayer(socketId: string): void {
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

  private maybeScheduleHandStart(): void {
    if (this.phase !== 'waiting') return;
    if (this.playerCount < 2) return;
    if (this.handTimer) return;
    this.handTimer = setTimeout(() => {
      this.handTimer = null;
      this.startHand();
    }, HAND_START_DELAY_MS);
  }

  private startHand(): void {
    const activePlayers = this.seats.map((s, i) => ({ s, i })).filter(x => x.s !== null);
    if (activePlayers.length < 2) {
      this.phase = 'waiting';
      this.broadcastState();
      return;
    }

    this.deck = shuffleDeck(createDeck());
    this.communityCards = [];
    this.pot = 0;
    this.currentBet = 0;
    this.winners = [];
    this.messages = [];
    this.actedThisRound.clear();

    for (const { s } of activePlayers) {
      if (s) { s.cards = []; s.currentBet = 0; s.totalBet = 0; s.status = 'active'; }
    }

    // Advance dealer
    this.dealerSeat = this.nextActiveSeatFrom(this.dealerSeat === -1 ? 0 : this.dealerSeat, true);

    // Deal hole cards
    for (const { s } of activePlayers) {
      s!.cards = [this.deck.pop()!, this.deck.pop()!];
    }

    // Post blinds
    const isHeadsUp = activePlayers.length === 2;
    const sbSeat = isHeadsUp ? this.dealerSeat : this.nextActiveSeatFrom(this.dealerSeat);
    const bbSeat = this.nextActiveSeatFrom(sbSeat);

    this.postBlind(sbSeat, this.config.smallBlind);
    this.postBlind(bbSeat, this.config.bigBlind);
    this.currentBet = this.config.bigBlind;

    this.phase = 'preflop';
    this.addMessage('New hand started', 'info');

    // UTG acts first preflop (player after BB); in heads-up dealer=SB acts first
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
      // Must call — treat as call
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
    // Check if only one non-folded player remains
    const nonFolded = this.seats.filter(s => s !== null && s.status !== 'folded');
    if (nonFolded.length === 1) {
      this.endHand();
      return;
    }

    // Check if betting round is complete
    if (this.isBettingRoundComplete()) {
      this.nextPhase();
      return;
    }

    // Find next active player
    const next = this.nextActiveSeatFrom(this.activeSeat);
    if (next === this.activeSeat) {
      // No other active player — move to next phase
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
    // Reset per-round bets
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

    // If ≤1 active (non-folded, non-allin) players, run out the board and go to showdown
    if (canBetPlayers.length <= 1) {
      while (this.communityCards.length < 5) this.communityCards.push(this.deck.pop()!);
      this.endHand();
      return;
    }

    this.activeSeat = this.nextActiveSeatFrom(this.dealerSeat);
    this.broadcastState();
    this.startTurnTimer();
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
      // Evaluate hands
      const evaluated = nonFolded.map(({ s, i }) => ({
        i,
        s: s!,
        hand: getBestHand(s!.cards, this.communityCards),
      }));
      evaluated.sort((a, b) => compareHands(b.hand, a.hand));
      const bestHand = evaluated[0].hand;
      const winners = evaluated.filter(e => compareHands(e.hand, bestHand) === 0);
      const split = Math.floor(this.pot / winners.length);
      this.winners = [];
      for (const w of winners) {
        w.s.chips += split;
        this.winners.push({
          seatIndex: w.i,
          username: w.s.username,
          amount: split,
          handRank: w.hand.name,
          cards: w.s.cards,
        });
        this.addMessage(`${w.s.username} wins ${split.toLocaleString()} with ${w.hand.name}!`, 'result');
      }
      this.pot = 0;
    }

    this.broadcastState();

    // Schedule next hand or go back to waiting
    this.handTimer = setTimeout(() => {
      this.handTimer = null;
      // Remove broke players
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
      turnTimeoutAt: isMyTurn ? this.turnTimeoutAt : null,
      messages: this.messages,
      winners: this.phase === 'showdown' ? this.winners : undefined,
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
    };
  }

  private broadcastState(): void {
    for (const seat of this.seats) {
      if (seat) {
        const state = this.getClientStateFor(seat.socketId);
        this.emit(seat.socketId, 'game_state', state);
      }
    }
    this.broadcast(this.id, 'lobby_update', null);
  }
}
