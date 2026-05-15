export type Suit = 'S' | 'H' | 'D' | 'C';

export interface Card {
  suit: Suit;
  value: number; // 2-14, 11=J, 12=Q, 13=K, 14=A
}

export interface HandResult {
  rank: number; // 0=High Card .. 9=Royal Flush
  values: number[]; // tiebreaker values
  name: string;
}

const SUIT_SYMBOLS: Record<Suit, string> = { S: '♠', H: '♥', D: '♦', C: '♣' };
const VALUE_LABELS: Record<number, string> = {
  2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9',
  10: '10', 11: 'J', 12: 'Q', 13: 'K', 14: 'A',
};

export function suitSymbol(suit: Suit): string {
  return SUIT_SYMBOLS[suit];
}

export function valueLabel(value: number): string {
  return VALUE_LABELS[value] ?? String(value);
}

export function isRedSuit(suit: Suit): boolean {
  return suit === 'H' || suit === 'D';
}

export function createDeck(): Card[] {
  const suits: Suit[] = ['S', 'H', 'D', 'C'];
  const deck: Card[] = [];
  for (const suit of suits) {
    for (let v = 2; v <= 14; v++) {
      deck.push({ suit, value: v });
    }
  }
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

export function evaluate5Cards(hand: Card[]): HandResult {
  const vals = hand.map(c => c.value).sort((a, b) => b - a);
  const suits = hand.map(c => c.suit);

  const counts: Record<number, number> = {};
  for (const v of vals) counts[v] = (counts[v] || 0) + 1;

  const countVals = Object.values(counts).sort((a, b) => b - a);
  const uniqueVals = Object.keys(counts)
    .map(Number)
    .sort((a, b) => b - a);

  const isFlush = suits.every(s => s === suits[0]);
  const isNormalStraight = vals[0] - vals[4] === 4 && new Set(vals).size === 5;
  const isWheel =
    vals[0] === 14 && vals[1] === 5 && vals[2] === 4 && vals[3] === 3 && vals[4] === 2;
  const isStraight = isNormalStraight || isWheel;
  const straightHigh = isWheel ? 5 : vals[0];

  if (isFlush && isStraight) {
    if (straightHigh === 14) return { rank: 9, values: [14], name: 'Royal Flush' };
    return { rank: 8, values: [straightHigh], name: 'Straight Flush' };
  }

  if (countVals[0] === 4) {
    const quad = uniqueVals.find(v => counts[v] === 4)!;
    const kick = uniqueVals.find(v => counts[v] !== 4)!;
    return { rank: 7, values: [quad, kick], name: 'Four of a Kind' };
  }

  if (countVals[0] === 3 && countVals[1] === 2) {
    const trips = uniqueVals.find(v => counts[v] === 3)!;
    const pair = uniqueVals.find(v => counts[v] === 2)!;
    return { rank: 6, values: [trips, pair], name: 'Full House' };
  }

  if (isFlush) return { rank: 5, values: vals, name: 'Flush' };
  if (isStraight) return { rank: 4, values: [straightHigh], name: 'Straight' };

  if (countVals[0] === 3) {
    const trips = uniqueVals.find(v => counts[v] === 3)!;
    const kickers = uniqueVals.filter(v => counts[v] !== 3);
    return { rank: 3, values: [trips, ...kickers], name: 'Three of a Kind' };
  }

  if (countVals[0] === 2 && countVals[1] === 2) {
    const pairs = uniqueVals.filter(v => counts[v] === 2).sort((a, b) => b - a);
    const kick = uniqueVals.find(v => counts[v] === 1)!;
    return { rank: 2, values: [...pairs, kick], name: 'Two Pair' };
  }

  if (countVals[0] === 2) {
    const pairVal = uniqueVals.find(v => counts[v] === 2)!;
    const kickers = uniqueVals.filter(v => counts[v] !== 2);
    return { rank: 1, values: [pairVal, ...kickers], name: 'One Pair' };
  }

  return { rank: 0, values: vals, name: 'High Card' };
}

export function compareHands(a: HandResult, b: HandResult): number {
  if (a.rank !== b.rank) return a.rank - b.rank;
  for (let i = 0; i < Math.max(a.values.length, b.values.length); i++) {
    const diff = (a.values[i] ?? 0) - (b.values[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export function getBestHand(holeCards: Card[], communityCards: Card[]): HandResult {
  const all = [...holeCards, ...communityCards];
  const n = all.length;
  let best: HandResult | null = null;

  for (let i = 0; i < n - 4; i++) {
    for (let j = i + 1; j < n - 3; j++) {
      for (let k = j + 1; k < n - 2; k++) {
        for (let l = k + 1; l < n - 1; l++) {
          for (let m = l + 1; m < n; m++) {
            const combo = [all[i], all[j], all[k], all[l], all[m]];
            const result = evaluate5Cards(combo);
            if (!best || compareHands(result, best) > 0) {
              best = result;
            }
          }
        }
      }
    }
  }

  return best!;
}

export function getPreflopStrength(holeCards: Card[]): number {
  const [c1, c2] = [...holeCards].sort((a, b) => b.value - a.value);
  const hi = c1.value;
  const lo = c2.value;
  const suited = c1.suit === c2.suit;
  const paired = hi === lo;
  const gap = hi - lo;

  if (paired) {
    if (hi >= 14) return 0.98;
    if (hi >= 13) return 0.94;
    if (hi >= 12) return 0.89;
    if (hi >= 11) return 0.84;
    if (hi >= 10) return 0.76;
    if (hi >= 9) return 0.68;
    if (hi >= 7) return 0.60;
    return 0.52;
  }

  const base = (hi + lo - 4) / 22;
  const suitedBonus = suited ? 0.04 : 0;
  const gapPenalty = gap === 1 ? 0 : gap === 2 ? -0.03 : gap === 3 ? -0.06 : -0.10;

  return Math.max(0.1, Math.min(0.85, base + suitedBonus + gapPenalty));
}

export function getPostflopStrength(holeCards: Card[], communityCards: Card[]): number {
  if (communityCards.length === 0) return getPreflopStrength(holeCards);
  const result = getBestHand(holeCards, communityCards);
  const rankStrength = result.rank / 9;
  const topValue = (result.values[0] ?? 7) / 14;
  return Math.min(1, rankStrength * 0.85 + topValue * 0.15);
}

export function describeHand(result: HandResult): string {
  const vl = (v: number) => VALUE_LABELS[v] ?? String(v);
  const plural = (v: number) => {
    const l = vl(v);
    if (l === 'A') return 'Aces';
    if (l === 'K') return 'Kings';
    if (l === 'Q') return 'Queens';
    if (l === 'J') return 'Jacks';
    return `${l}s`;
  };
  switch (result.rank) {
    case 9: return 'Royal Flush';
    case 8: return `Straight Flush, ${vl(result.values[0])} high`;
    case 7: return `Four of a Kind — ${plural(result.values[0])}`;
    case 6: return `Full House — ${plural(result.values[0])} over ${plural(result.values[1])}`;
    case 5: return `Flush — ${vl(result.values[0])} high`;
    case 4: return `Straight — ${vl(result.values[0])} high`;
    case 3: return `Three of a Kind — ${plural(result.values[0])}`;
    case 2: return `Two Pair — ${plural(result.values[0])} & ${plural(result.values[1])}`;
    case 1: return `Pair of ${plural(result.values[0])}`;
    default: return `${vl(result.values[0])} High`;
  }
}

export function determineWinners(
  activePlayers: { id: string; holeCards: Card[] }[],
  communityCards: Card[]
): { winnerId: string; handResult: HandResult }[] {
  const evaluated = activePlayers.map(p => ({
    id: p.id,
    hand: getBestHand(p.holeCards, communityCards),
  }));

  evaluated.sort((a, b) => compareHands(b.hand, a.hand));
  const best = evaluated[0].hand;

  const winners = evaluated.filter(e => compareHands(e.hand, best) === 0);
  return winners.map(w => ({ winnerId: w.id, handResult: w.hand }));
}
