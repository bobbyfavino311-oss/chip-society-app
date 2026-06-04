import type { Card, Suit } from './pokerEngine';

export type { Card };

// ─── Three-card hand types ────────────────────────────────────────────────────
export type ThreeCardRank =
  | 'straight_flush' | 'three_of_a_kind' | 'straight'
  | 'flush' | 'pair' | 'high_card';

export interface ThreeCardEval {
  rank: ThreeCardRank;
  value: number;
  label: string;
}

export const TCP_RANK_ORDER: Record<ThreeCardRank, number> = {
  straight_flush:  6,
  three_of_a_kind: 5,
  straight:        4,
  flush:           3,
  pair:            2,
  high_card:       1,
};

const THREE_CARD_LABELS: Record<ThreeCardRank, string> = {
  straight_flush:  'STRAIGHT FLUSH',
  three_of_a_kind: 'THREE OF A KIND',
  straight:        'STRAIGHT',
  flush:           'FLUSH',
  pair:            'PAIR',
  high_card:       'HIGH CARD',
};

// ─── Six-card bonus types ─────────────────────────────────────────────────────
export type SixCardRank =
  | 'royal_flush' | 'straight_flush' | 'four_of_a_kind' | 'full_house'
  | 'flush' | 'straight' | 'three_of_a_kind' | 'two_pair' | 'pair' | 'high_card';

export interface SixCardEval {
  rank:  SixCardRank;
  value: number;
  label: string;
}

const SIX_CARD_LABELS: Record<SixCardRank, string> = {
  royal_flush:     'ROYAL FLUSH',
  straight_flush:  'STRAIGHT FLUSH',
  four_of_a_kind:  'FOUR OF A KIND',
  full_house:      'FULL HOUSE',
  flush:           'FLUSH',
  straight:        'STRAIGHT',
  three_of_a_kind: 'THREE OF A KIND',
  two_pair:        'TWO PAIR',
  pair:            'PAIR',
  high_card:       'HIGH CARD',
};

// ─── Deck ─────────────────────────────────────────────────────────────────────
const SUITS: Suit[] = ['S', 'H', 'D', 'C'];

export function createTCPDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (let value = 2; value <= 14; value++) {
      deck.push({ suit, value });
    }
  }
  return deck;
}

export function shuffleTCPDeck(deck: Card[]): Card[] {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j]!, d[i]!];
  }
  return d;
}

// ─── Three-card hand evaluation ───────────────────────────────────────────────
function is3Straight(sorted: number[]): boolean {
  if (sorted[2]! - sorted[0]! === 2 && sorted[1]! - sorted[0]! === 1) return true;
  return sorted[0] === 2 && sorted[1] === 3 && sorted[2] === 14; // A-2-3
}

function straight3Hi(sorted: number[]): number {
  return sorted[0] === 2 && sorted[1] === 3 && sorted[2] === 14 ? 3 : sorted[2]!;
}

export function evaluateThreeCardHand(cards: Card[]): ThreeCardEval {
  const vals  = cards.map(c => c.value).sort((a, b) => a - b);
  const suits = cards.map(c => c.suit);

  const isFlush        = suits[0] === suits[1] && suits[1] === suits[2];
  const isStraight     = is3Straight(vals);
  const isThreeOfAKind = vals[0] === vals[1] && vals[1] === vals[2];
  const hasPair        = vals[0] === vals[1] || vals[1] === vals[2];
  const highVal        = (vals[2]! * 10_000) + (vals[1]! * 100) + vals[0]!;

  let rank: ThreeCardRank;
  let value: number;

  if (isFlush && isStraight) {
    rank  = 'straight_flush';
    value = 6_000_000 + straight3Hi(vals);
  } else if (isThreeOfAKind) {
    rank  = 'three_of_a_kind';
    value = 5_000_000 + vals[0]!;
  } else if (isStraight) {
    rank  = 'straight';
    value = 4_000_000 + straight3Hi(vals);
  } else if (isFlush) {
    rank  = 'flush';
    value = 3_000_000 + highVal;
  } else if (hasPair) {
    const pairVal = vals[0] === vals[1] ? vals[1]! : vals[2]!;
    const kicker  = vals[0] === vals[1] ? vals[2]! : vals[0]!;
    rank  = 'pair';
    value = 2_000_000 + pairVal * 100 + kicker;
  } else {
    rank  = 'high_card';
    value = highVal;
  }

  return { rank, value, label: THREE_CARD_LABELS[rank] };
}

// ─── Five-card hand evaluation (for 6-card bonus) ────────────────────────────
function is5Straight(sorted: number[]): boolean {
  if (new Set(sorted).size !== 5) return false;
  if (sorted[4]! - sorted[0]! === 4) return true;
  return sorted[0]===2 && sorted[1]===3 && sorted[2]===4 && sorted[3]===5 && sorted[4]===14;
}

function evaluate5CardHand(cards: Card[]): SixCardEval {
  const sorted = cards.map(c => c.value).sort((a, b) => a - b);
  const suits  = cards.map(c => c.suit);
  const isF    = suits.every(s => s === suits[0]!);
  const isS    = is5Straight(sorted);

  const cnt = new Map<number, number>();
  for (const v of sorted) cnt.set(v, (cnt.get(v) ?? 0) + 1);
  const groups = [...cnt.entries()].sort((a, b) => b[1]! - a[1]! || b[0]! - a[0]!);
  const topCnt = groups[0]?.[1] ?? 0;
  const sndCnt = groups[1]?.[1] ?? 0;

  const hi = sorted[4]!;
  const baseVal = sorted.reduce((acc, v, i) => acc + v * Math.pow(15, i), 0);

  let rank: SixCardRank;
  let value: number;

  if (isF && isS && hi === 14 && sorted[0] === 10) {
    rank = 'royal_flush';     value = 9_000_000;
  } else if (isF && isS) {
    const h = (sorted[0]===2 && hi===14) ? 5 : hi;
    rank = 'straight_flush';  value = 8_000_000 + h;
  } else if (topCnt === 4) {
    rank = 'four_of_a_kind';  value = 7_000_000 + (groups[0]![0]! * 100);
  } else if (topCnt === 3 && sndCnt === 2) {
    rank = 'full_house';      value = 6_000_000 + (groups[0]![0]! * 100);
  } else if (isF) {
    rank = 'flush';           value = 5_000_000 + baseVal;
  } else if (isS) {
    const h = (sorted[0]===2 && hi===14) ? 5 : hi;
    rank = 'straight';        value = 4_000_000 + h;
  } else if (topCnt === 3) {
    rank = 'three_of_a_kind'; value = 3_000_000 + (groups[0]![0]! * 100);
  } else if (topCnt === 2 && sndCnt === 2) {
    rank = 'two_pair';        value = 2_000_000 + (groups[0]![0]! * 100) + (groups[1]![0]!);
  } else if (topCnt === 2) {
    rank = 'pair';            value = 1_000_000 + (groups[0]![0]! * 100) + baseVal;
  } else {
    rank = 'high_card';       value = baseVal;
  }

  return { rank, value, label: SIX_CARD_LABELS[rank] };
}

/** Best 5-card hand from player's 3 + dealer's 3 (6 total). */
export function evaluateSixCardBonus(playerCards: Card[], dealerCards: Card[]): SixCardEval {
  const all6 = [...playerCards, ...dealerCards];
  return all6
    .map((_, i) => all6.filter((_, j) => j !== i))
    .map(evaluate5CardHand)
    .reduce((best, e) => (e.value > best.value ? e : best));
}

// ─── Payout tables ────────────────────────────────────────────────────────────
export function getPairPlusMultiplier(rank: ThreeCardRank): number {
  switch (rank) {
    case 'straight_flush':  return 40;
    case 'three_of_a_kind': return 30;
    case 'straight':        return 6;
    case 'flush':           return 3;
    case 'pair':            return 1;
    default:                return -1;
  }
}

export function getAnteBonusMultiplier(rank: ThreeCardRank): number {
  switch (rank) {
    case 'straight_flush':  return 5;
    case 'three_of_a_kind': return 4;
    case 'straight':        return 1;
    default:                return 0;
  }
}

export function getSixCardBonusMultiplier(rank: SixCardRank): number {
  switch (rank) {
    case 'royal_flush':     return 1000;
    case 'straight_flush':  return 200;
    case 'four_of_a_kind':  return 100;
    case 'full_house':      return 20;
    case 'flush':           return 15;
    case 'straight':        return 10;
    case 'three_of_a_kind': return 7;
    default:                return -1;
  }
}

// ─── Dealer qualification ─────────────────────────────────────────────────────
export function tcpDealerQualifies(cards: Card[]): boolean {
  return Math.max(...cards.map(c => c.value)) >= 12;
}

// ─── Hand comparison ──────────────────────────────────────────────────────────
export function compareThreeCardHands(
  player: ThreeCardEval,
  dealer: ThreeCardEval,
): 'player' | 'dealer' | 'tie' {
  const po = TCP_RANK_ORDER[player.rank];
  const dO = TCP_RANK_ORDER[dealer.rank];
  if (po > dO) return 'player';
  if (dO > po) return 'dealer';
  if (player.value > dealer.value) return 'player';
  if (dealer.value > player.value) return 'dealer';
  return 'tie';
}

// ─── Biased dealing ───────────────────────────────────────────────────────────
export interface DealtHands {
  playerCards: Card[];
  dealerCards: Card[];
  remaining:   Card[];
}

/**
 * Deals cards with a subtle house-edge bias:
 * when dealer would get a very weak hand (high card, no Queen+),
 * there's a 45% chance the lowest dealer card is swapped for a qualifying card.
 * Player hand is never touched. The bias is transparent and mild.
 */
export function dealBiasedHands(deck: Card[]): DealtHands {
  let pCards = [deck[0]!, deck[2]!, deck[4]!];
  let dCards = [deck[1]!, deck[3]!, deck[5]!];
  let rem    = deck.slice(6);

  const dEval = evaluateThreeCardHand(dCards);
  const dMax  = Math.max(...dCards.map(c => c.value));

  if (dEval.rank === 'high_card' && dMax < 12 && Math.random() < 0.45) {
    const qualPool = rem.filter(c => c.value >= 12);
    if (qualPool.length > 0) {
      const pick   = qualPool[Math.floor(Math.random() * qualPool.length)]!;
      const dMin   = Math.min(...dCards.map(c => c.value));
      const minIdx = dCards.findIndex(c => c.value === dMin);
      rem          = [...rem.filter(c => c !== pick), dCards[minIdx]!];
      dCards       = [...dCards];
      dCards[minIdx] = pick;
    }
  }

  return { playerCards: pCards, dealerCards: dCards, remaining: rem };
}
