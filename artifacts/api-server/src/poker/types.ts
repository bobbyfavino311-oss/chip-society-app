export type Suit = 'S' | 'H' | 'D' | 'C';

export interface Card {
  suit: Suit;
  value: number;
}

export interface HandResult {
  rank: number;
  values: number[];
  name: string;
}

export type RoomPhase = 'waiting' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
export type SeatStatus = 'active' | 'folded' | 'allin' | 'sitting_out';
export type StakeTier = 'MICRO' | 'LOW' | 'STANDARD' | 'HIGH_ROLLER' | 'VIP' | 'ELITE';
export type PlayerActionType = 'fold' | 'check' | 'call' | 'raise' | 'allin';

export interface PlayerAction {
  type: PlayerActionType;
  amount?: number;
}

export interface Seat {
  socketId: string;
  userId: string;
  username: string;
  avatarId: number;
  chips: number;
  cards: Card[];
  currentBet: number;
  totalBet: number;
  status: SeatStatus;
}

export interface GameMessage {
  text: string;
  type: 'action' | 'result' | 'info';
  timestamp: number;
}

export interface RoomConfig {
  stakeTier: StakeTier;
  maxPlayers: number;
  smallBlind: number;
  bigBlind: number;
  minBuyIn: number;
  maxBuyIn: number;
}

export interface SeatView {
  seatIndex: number;
  userId: string;
  username: string;
  avatarId: number;
  chips: number;
  currentBet: number;
  totalBet: number;
  status: SeatStatus;
  isDealer: boolean;
  isTurn: boolean;
  cardCount: number;
  cards?: Card[];
  revealedCards?: Card[];
  revealedHand?: string;
}

export interface WinnerInfo {
  seatIndex: number;
  username: string;
  amount: number;
  handRank?: string;
  cards?: Card[];
}

export interface ClientGameState {
  tableId: string;
  phase: RoomPhase;
  seats: (SeatView | null)[];
  communityCards: Card[];
  pot: number;
  currentBet: number;
  dealerSeat: number;
  activeSeat: number;
  smallBlind: number;
  bigBlind: number;
  mySeat: number;
  myCards: Card[];
  isMyTurn: boolean;
  callAmount: number;
  minRaise: number;
  maxRaise: number;
  turnTimeoutAt: number | null;
  messages: GameMessage[];
  winners?: WinnerInfo[];
}

export interface LobbyTable {
  id: string;
  stakeTier: StakeTier;
  smallBlind: number;
  bigBlind: number;
  playerCount: number;
  maxPlayers: number;
  phase: RoomPhase;
  minBuyIn: number;
}

export const STAKE_CONFIG: Record<StakeTier, RoomConfig> = {
  MICRO:       { stakeTier: 'MICRO',       maxPlayers: 5, smallBlind: 25,    bigBlind: 50,    minBuyIn: 1_000,   maxBuyIn: 5_000   },
  LOW:         { stakeTier: 'LOW',         maxPlayers: 5, smallBlind: 100,   bigBlind: 200,   minBuyIn: 4_000,   maxBuyIn: 20_000  },
  STANDARD:    { stakeTier: 'STANDARD',    maxPlayers: 5, smallBlind: 500,   bigBlind: 1_000, minBuyIn: 20_000,  maxBuyIn: 100_000 },
  HIGH_ROLLER: { stakeTier: 'HIGH_ROLLER', maxPlayers: 5, smallBlind: 2_500, bigBlind: 5_000, minBuyIn: 100_000, maxBuyIn: 500_000 },
  VIP:         { stakeTier: 'VIP',         maxPlayers: 5, smallBlind: 10_000,bigBlind: 20_000,minBuyIn: 400_000, maxBuyIn: 2_000_000},
  ELITE:       { stakeTier: 'ELITE',       maxPlayers: 5, smallBlind: 50_000,bigBlind: 100_000,minBuyIn:2_000_000,maxBuyIn:10_000_000},
};
