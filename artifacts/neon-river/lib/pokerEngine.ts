export type Suit = 'S' | 'H' | 'D' | 'C';

export interface Card {
  suit: Suit;
  value: number; // 2-14, 11=J, 12=Q, 13=K, 14=A
}

export interface HandResult {
  rank: number; // 0=High Card .. 9=Royal Flush
  values: number[]; // tiebreaker values
  name: string;
  /** Omaha only — the 2 hole cards that formed this hand */
  usedHoleCards?: Card[];
  /** Omaha only — the 3 board cards that formed this hand */
  usedBoardCards?: Card[];
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

/** Returns true if a card is a Joker (value === 0) */
export function isJoker(card: Card): boolean { return card.value === 0; }

/** 54-card deck: standard 52 + 2 Jokers (value=0, suits S & H as sentinels) */
export function createJokerDeck(): Card[] {
  const deck = createDeck();
  deck.push({ suit: 'S', value: 0 });
  deck.push({ suit: 'H', value: 0 });
  return deck;
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

  return best ?? { rank: 0, values: [], name: 'High Card' };
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
  // Dispatch on name — NOT rank. Short Deck swaps ranks 5 & 6 (Flush > Full House),
  // so rank-based dispatch returns the wrong label for Short Deck hands.
  switch (result.name) {
    case 'Five of a Kind':   return `Five of a Kind — ${plural(result.values[0])}`;
    case 'Royal Flush':      return 'Royal Flush';
    case 'Straight Flush':   return `Straight Flush, ${vl(result.values[0])} high`;
    case 'Four of a Kind':   return `Four of a Kind — ${plural(result.values[0])}`;
    case 'Full House':       return `Full House — ${plural(result.values[0])} over ${plural(result.values[1])}`;
    case 'Flush':            return `Flush — ${vl(result.values[0])} high`;
    case 'Straight':         return `Straight — ${vl(result.values[0])} high`;
    case 'Three of a Kind':  return `Three of a Kind — ${plural(result.values[0])}`;
    case 'Two Pair':         return `Two Pair — ${plural(result.values[0])} & ${plural(result.values[1])}`;
    case 'One Pair':         return `Pair of ${plural(result.values[0])}`;
    default:                 return `${vl(result.values[0])} High`;
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

// ─── Short Deck Hold'em variant ──────────────────────────────────────────────

export type GameVariant = 'texas_holdem' | 'short_deck_holdem' | 'joker_holdem' | 'omaha_holdem';

/** 36-card deck: values 6–14, all 4 suits */
export function createShortDeck(): Card[] {
  const suits: Suit[] = ['S', 'H', 'D', 'C'];
  const deck: Card[] = [];
  for (const suit of suits) {
    for (let v = 6; v <= 14; v++) {
      deck.push({ suit, value: v });
    }
  }
  return deck;
}

/**
 * Short Deck hand evaluator.
 * Identical to evaluate5Cards except: Flush (rank 6) > Full House (rank 5).
 * No wheel straight — A-2-3-4-5 cannot occur with a 36-card deck.
 */
export function evaluate5CardsShortDeck(hand: Card[]): HandResult {
  const vals = hand.map(c => c.value).sort((a, b) => b - a);
  const suits = hand.map(c => c.suit);

  const counts: Record<number, number> = {};
  for (const v of vals) counts[v] = (counts[v] || 0) + 1;

  const countVals = Object.values(counts).sort((a, b) => b - a);
  const uniqueVals = Object.keys(counts)
    .map(Number)
    .sort((a, b) => b - a);

  const isFlush = suits.every(s => s === suits[0]);
  // No wheel possible in Short Deck (no 2–5)
  const isStraight = vals[0] - vals[4] === 4 && new Set(vals).size === 5;
  const straightHigh = vals[0];

  if (isFlush && isStraight) {
    if (straightHigh === 14) return { rank: 9, values: [14], name: 'Royal Flush' };
    return { rank: 8, values: [straightHigh], name: 'Straight Flush' };
  }

  if (countVals[0] === 4) {
    const quad = uniqueVals.find(v => counts[v] === 4)!;
    const kick = uniqueVals.find(v => counts[v] !== 4)!;
    return { rank: 7, values: [quad, kick], name: 'Four of a Kind' };
  }

  // Short Deck key difference: Flush (rank 6) beats Full House (rank 5)
  if (isFlush) return { rank: 6, values: vals, name: 'Flush' };

  if (countVals[0] === 3 && countVals[1] === 2) {
    const trips = uniqueVals.find(v => counts[v] === 3)!;
    const pair = uniqueVals.find(v => counts[v] === 2)!;
    return { rank: 5, values: [trips, pair], name: 'Full House' };
  }

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

/** Variant-aware best hand evaluator */
export function getBestHandVariant(
  holeCards: Card[],
  communityCards: Card[],
  variant: GameVariant = 'texas_holdem'
): HandResult {
  const all = [...holeCards, ...communityCards];
  const n = all.length;
  let best: HandResult | null = null;
  if (variant === 'joker_holdem') return getBestHandJoker(holeCards, communityCards);
  if (variant === 'omaha_holdem') return getBestHandOmaha(holeCards, communityCards);
  const eval5 = variant === 'short_deck_holdem' ? evaluate5CardsShortDeck : evaluate5Cards;

  for (let i = 0; i < n - 4; i++) {
    for (let j = i + 1; j < n - 3; j++) {
      for (let k = j + 1; k < n - 2; k++) {
        for (let l = k + 1; l < n - 1; l++) {
          for (let m = l + 1; m < n; m++) {
            const combo = [all[i], all[j], all[k], all[l], all[m]];
            const result = eval5(combo);
            if (!best || compareHands(result, best) > 0) best = result;
          }
        }
      }
    }
  }

  return best ?? { rank: 0, values: [], name: 'High Card' };
}

/**
 * Omaha Hold'em hand evaluator.
 * Players MUST use exactly 2 hole cards + exactly 3 community cards.
 * Enumerates all C(4,2) × C(5,3) = 60 combinations and returns the best legal hand.
 */
export function getBestHandOmaha(holeCards: Card[], communityCards: Card[]): HandResult {
  let best: HandResult | null = null;
  for (let hi = 0; hi < holeCards.length - 1; hi++) {
    for (let hj = hi + 1; hj < holeCards.length; hj++) {
      for (let ci = 0; ci < communityCards.length - 2; ci++) {
        for (let cj = ci + 1; cj < communityCards.length - 1; cj++) {
          for (let ck = cj + 1; ck < communityCards.length; ck++) {
            const hand = [holeCards[hi], holeCards[hj], communityCards[ci], communityCards[cj], communityCards[ck]];
            const result = evaluate5Cards(hand);
            if (!best || compareHands(result, best) > 0) {
              best = {
                ...result,
                usedHoleCards:  [holeCards[hi], holeCards[hj]],
                usedBoardCards: [communityCards[ci], communityCards[cj], communityCards[ck]],
              };
            }
          }
        }
      }
    }
  }
  return best ?? { rank: 0, values: [holeCards[0]?.value ?? 7], name: 'High Card' };
}

/** Variant-aware winner determination */
export function determineWinnersVariant(
  activePlayers: { id: string; holeCards: Card[] }[],
  communityCards: Card[],
  variant: GameVariant = 'texas_holdem'
): { winnerId: string; handResult: HandResult }[] {
  const evaluated = activePlayers.map(p => ({
    id: p.id,
    hand: getBestHandVariant(p.holeCards, communityCards, variant),
  }));

  evaluated.sort((a, b) => compareHands(b.hand, a.hand));
  const best = evaluated[0].hand;

  const winners = evaluated.filter(e => compareHands(e.hand, best) === 0);
  return winners.map(w => ({ winnerId: w.id, handResult: w.hand }));
}

/** Variant-aware postflop strength (normalises rank against the variant's max rank) */
export function getPostflopStrengthVariant(
  holeCards: Card[],
  communityCards: Card[],
  variant: GameVariant = 'texas_holdem'
): number {
  if (variant === 'joker_holdem') {
    if (communityCards.length === 0) {
      if (holeCards.some(isJoker)) return 0.90;
      return getPreflopStrength(holeCards);
    }
    const jr = getBestHandJoker(holeCards, communityCards);
    const jStrength = jr.rank / 10;
    const jTop = (jr.values[0] ?? 7) / 14;
    return Math.min(1, jStrength * 0.85 + jTop * 0.15);
  }
  if (communityCards.length === 0) return getPreflopStrength(holeCards);
  const result = getBestHandVariant(holeCards, communityCards, variant);
  const rankStrength = result.rank / 9;
  const topValue = (result.values[0] ?? 7) / 14;
  return Math.min(1, rankStrength * 0.85 + topValue * 0.15);
}

/** Create the right deck for the given variant */
export function createVariantDeck(variant: GameVariant = 'texas_holdem'): Card[] {
  if (variant === 'short_deck_holdem') return createShortDeck();
  if (variant === 'joker_holdem')      return createJokerDeck();
  return createDeck();
}

// ─── Joker Hold'em evaluator ─────────────────────────────────────────────────

/**
 * Like evaluate5Cards but also recognises Five of a Kind (rank 10).
 * Call this after joker substitution — hand must contain no actual Joker cards.
 */
export function evaluate5CardsWild(hand: Card[]): HandResult {
  const allVals = hand.map(c => c.value);
  if (new Set(allVals).size === 1) {
    return { rank: 10, values: [allVals[0]], name: 'Five of a Kind' };
  }
  return evaluate5Cards(hand);
}

/** Pick the best 5-card HandResult from an arbitrary-length set of cards */
function getBestFrom(cards: Card[], evalFn: (h: Card[]) => HandResult): HandResult {
  const n = cards.length;
  let best: HandResult | null = null;
  for (let a = 0; a < n - 4; a++)
    for (let b = a + 1; b < n - 3; b++)
      for (let c = b + 1; c < n - 2; c++)
        for (let d = c + 1; d < n - 1; d++)
          for (let e = d + 1; e < n; e++) {
            const r = evalFn([cards[a], cards[b], cards[c], cards[d], cards[e]]);
            if (!best || compareHands(r, best) > 0) best = r;
          }
  return best ?? { rank: 0, values: [], name: 'High Card' };
}

/**
 * Best hand evaluator for Joker Hold'em.
 * Brute-forces every valid joker substitution, picks the highest-ranked result.
 * Supports 0, 1, or 2 jokers. Five of a Kind is rank 10 (beats Royal Flush).
 */
export function getBestHandJoker(holeCards: Card[], communityCards: Card[]): HandResult {
  const all = [...holeCards, ...communityCards];
  const jokerCount = all.filter(isJoker).length;
  const natural = all.filter(c => !isJoker(c));

  if (jokerCount === 0) return getBestHand(holeCards, communityCards);
  if (all.length < 5)   return { rank: 0, values: [], name: 'High Card' };

  const SUITS: Suit[] = ['S', 'H', 'D', 'C'];
  const inHand = new Set(natural.map(c => `${c.suit}${c.value}`));
  const reps: Card[] = [];
  for (const suit of SUITS) {
    for (let v = 2; v <= 14; v++) {
      if (!inHand.has(`${suit}${v}`)) reps.push({ suit, value: v });
    }
  }

  let best: HandResult | null = null;
  const updateBest = (r: HandResult) => { if (!best || compareHands(r, best) > 0) best = r; };
  const evalCards = (cards: Card[]) =>
    cards.length === 5 ? evaluate5CardsWild(cards) : getBestFrom(cards, evaluate5CardsWild);

  if (jokerCount === 1) {
    for (const r1 of reps) updateBest(evalCards([...natural, r1]));
  } else {
    // 2 jokers — iterate all unique pairs of substitutions
    for (let i = 0; i < reps.length; i++) {
      for (let j = i + 1; j < reps.length; j++) {
        updateBest(evalCards([...natural, reps[i], reps[j]]));
      }
    }
  }

  return best ?? { rank: 0, values: [], name: 'High Card' };
}
