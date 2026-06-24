export type Suit = 'S' | 'H' | 'D' | 'C';

export interface Card {
  suit: Suit;
  value: number;
}

export type RoomPhase = 'waiting' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
export type SeatStatus = 'active' | 'folded' | 'allin' | 'sitting_out';
export type StakeTier = 'MICRO' | 'LOW' | 'STANDARD' | 'HIGH_ROLLER' | 'VIP' | 'ELITE';
export type PlayerActionType = 'fold' | 'check' | 'call' | 'raise' | 'allin';

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

export interface GameMessage {
  text: string;
  type: 'action' | 'result' | 'info';
  timestamp: number;
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

export const STAKE_LABELS: Record<StakeTier, string> = {
  MICRO:       'MICRO',
  LOW:         'LOW',
  STANDARD:    'STANDARD',
  HIGH_ROLLER: 'HIGH ROLLER',
  VIP:         'VIP',
  ELITE:       'ELITE',
};

export const STAKE_COLORS: Record<StakeTier, string> = {
  MICRO:       '#00d4ff',
  LOW:         '#00ff88',
  STANDARD:    '#ffcc00',
  HIGH_ROLLER: '#ff6600',
  VIP:         '#bf5fff',
  ELITE:       '#ff0090',
};

export const VALUE_LABELS: Record<number, string> = {
  2:'2',3:'3',4:'4',5:'5',6:'6',7:'7',8:'8',9:'9',
  10:'10',11:'J',12:'Q',13:'K',14:'A',
};

function _fmtVal(v: number): string {
  return v % 1 === 0 ? v.toFixed(0) : v.toFixed(1);
}
export function formatChips(n: number): string {
  if (n >= 1_000_000_000) return `${_fmtVal(n / 1_000_000_000)}B`;
  if (n >= 1_000_000)     return `${_fmtVal(n / 1_000_000)}M`;
  if (n >= 1_000)         return `${_fmtVal(n / 1_000)}K`;
  return String(n);
}

export function cardLabel(card: Card): string {
  return `${VALUE_LABELS[card.value] ?? card.value}${card.suit}`;
}
