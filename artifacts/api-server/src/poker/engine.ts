import type { Card, HandResult, Suit } from './types.js';

export function createDeck(): Card[] {
  const suits: Suit[] = ['S', 'H', 'D', 'C'];
  const deck: Card[] = [];
  for (const suit of suits) {
    for (let v = 2; v <= 14; v++) deck.push({ suit, value: v });
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
  const uniqueVals = Object.keys(counts).map(Number).sort((a, b) => b - a);

  const isFlush = suits.every(s => s === suits[0]);
  const isNormalStraight = vals[0] - vals[4] === 4 && new Set(vals).size === 5;
  const isWheel = vals[0] === 14 && vals[1] === 5 && vals[2] === 4 && vals[3] === 3 && vals[4] === 2;
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
  for (let i = 0; i < n - 4; i++)
    for (let j = i + 1; j < n - 3; j++)
      for (let k = j + 1; k < n - 2; k++)
        for (let l = k + 1; l < n - 1; l++)
          for (let m = l + 1; m < n; m++) {
            const r = evaluate5Cards([all[i], all[j], all[k], all[l], all[m]]);
            if (!best || compareHands(r, best) > 0) best = r;
          }
  return best ?? { rank: 0, values: [], name: 'High Card' };
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
  return evaluated
    .filter(e => compareHands(e.hand, best) === 0)
    .map(w => ({ winnerId: w.id, handResult: w.hand }));
}
