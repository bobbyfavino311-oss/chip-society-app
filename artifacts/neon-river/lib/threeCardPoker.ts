import type { Card, Suit } from './pokerEngine';

export type { Card };

// ─── Types ────────────────────────────────────────────────────────────────────
export type ThreeCardRank =
  | 'straight_flush' | 'three_of_a_kind' | 'straight'
  | 'flush' | 'pair' | 'high_card';

export interface ThreeCardEval {
  rank: ThreeCardRank;
  value: number;
  label: string;
}

// Rank order (higher = better hand)
export const TCP_RANK_ORDER: Record<ThreeCardRank, number> = {
  straight_flush:  6,
  three_of_a_kind: 5,
  straight:        4,
  flush:           3,
  pair:            2,
  high_card:       1,
};

const RANK_LABELS: Record<ThreeCardRank, string> = {
  straight_flush:  'STRAIGHT FLUSH',
  three_of_a_kind: 'THREE OF A KIND',
  straight:        'STRAIGHT',
  flush:           'FLUSH',
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

// ─── Hand evaluation ──────────────────────────────────────────────────────────
function isStraight(sorted: number[]): boolean {
  if (sorted[2]! - sorted[0]! === 2 && sorted[1]! - sorted[0]! === 1) return true;
  return sorted[0] === 2 && sorted[1] === 3 && sorted[2] === 14; // A-2-3
}

function straightHighCard(sorted: number[]): number {
  if (sorted[0] === 2 && sorted[1] === 3 && sorted[2] === 14) return 3;
  return sorted[2]!;
}

export function evaluateThreeCardHand(cards: Card[]): ThreeCardEval {
  const vals = cards.map(c => c.value).sort((a, b) => a - b);
  const suits = cards.map(c => c.suit);

  const isFlush = suits[0] === suits[1] && suits[1] === suits[2];
  const straight = isStraight(vals);
  const isThreeOfAKind = vals[0] === vals[1] && vals[1] === vals[2];
  const hasPair = vals[0] === vals[1] || vals[1] === vals[2];

  const highVal = (vals[2]! * 10_000) + (vals[1]! * 100) + vals[0]!;

  let rank: ThreeCardRank;
  let value: number;

  if (isFlush && straight) {
    rank  = 'straight_flush';
    value = 6_000_000 + straightHighCard(vals);
  } else if (isThreeOfAKind) {
    rank  = 'three_of_a_kind';
    value = 5_000_000 + vals[0]!;
  } else if (straight) {
    rank  = 'straight';
    value = 4_000_000 + straightHighCard(vals);
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

  return { rank, value, label: RANK_LABELS[rank] };
}

// ─── Dealer qualification ─────────────────────────────────────────────────────
export function tcpDealerQualifies(cards: Card[]): boolean {
  return Math.max(...cards.map(c => c.value)) >= 12; // Q or better
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

// ─── Payouts ──────────────────────────────────────────────────────────────────
// Returns the WIN multiplier (positive = win, -1 = loss, 0 = push)
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

// Ante Bonus multiplier (pays regardless of dealer outcome; 0 = no bonus)
export function getAnteBonusMultiplier(rank: ThreeCardRank): number {
  switch (rank) {
    case 'straight_flush':  return 5;
    case 'three_of_a_kind': return 4;
    case 'straight':        return 1;
    default:                return 0;
  }
}
