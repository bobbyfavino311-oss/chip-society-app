import type { Card, HandResult, Suit, GameVariant } from './types.js';

export function createDeck(): Card[] {
  const suits: Suit[] = ['S', 'H', 'D', 'C'];
  const deck: Card[] = [];
  for (const suit of suits) {
    for (let v = 2; v <= 14; v++) deck.push({ suit, value: v });
  }
  return deck;
}

/** 36-card deck: values 6–14, all 4 suits (Short Deck Hold'em) */
export function createShortDeck(): Card[] {
  const suits: Suit[] = ['S', 'H', 'D', 'C'];
  const deck: Card[] = [];
  for (const suit of suits) {
    for (let v = 6; v <= 14; v++) deck.push({ suit, value: v });
  }
  return deck;
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

/** Create the right deck for the given variant */
export function createDeckForVariant(variant: GameVariant): Card[] {
  if (variant === 'short_deck_holdem') return createShortDeck();
  if (variant === 'joker_holdem')      return createJokerDeck();
  return createDeck();
}

/** Number of hole cards dealt to each player for the given variant */
export function holeCardCountForVariant(variant: GameVariant): number {
  return variant === 'omaha_holdem' ? 4 : 2;
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

// ─── Short Deck Hold'em variant ──────────────────────────────────────────────

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
  const uniqueVals = Object.keys(counts).map(Number).sort((a, b) => b - a);

  const isFlush = suits.every(s => s === suits[0]);
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

// ─── Omaha Hold'em variant ────────────────────────────────────────────────────

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
            const hand = [holeCards[hi]!, holeCards[hj]!, communityCards[ci]!, communityCards[cj]!, communityCards[ck]!];
            const result = evaluate5Cards(hand);
            if (!best || compareHands(result, best) > 0) best = result;
          }
        }
      }
    }
  }
  return best ?? { rank: 0, values: [holeCards[0]?.value ?? 7], name: 'High Card' };
}

// ─── Joker Hold'em variant ────────────────────────────────────────────────────

/**
 * Like evaluate5Cards but also recognises Five of a Kind (rank 10).
 * Call this after joker substitution — hand must contain no actual Joker cards.
 */
export function evaluate5CardsWild(hand: Card[]): HandResult {
  const allVals = hand.map(c => c.value);
  if (new Set(allVals).size === 1) {
    return { rank: 10, values: [allVals[0]!], name: 'Five of a Kind' };
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
            const r = evalFn([cards[a]!, cards[b]!, cards[c]!, cards[d]!, cards[e]!]);
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
        updateBest(evalCards([...natural, reps[i]!, reps[j]!]));
      }
    }
  }

  return best ?? { rank: 0, values: [], name: 'High Card' };
}

// ─── Variant dispatch ────────────────────────────────────────────────────────

/** Variant-aware best hand evaluator */
export function getBestHandForVariant(
  variant: GameVariant,
  holeCards: Card[],
  communityCards: Card[]
): HandResult {
  if (variant === 'joker_holdem') return getBestHandJoker(holeCards, communityCards);
  if (variant === 'omaha_holdem') return getBestHandOmaha(holeCards, communityCards);

  const all = [...holeCards, ...communityCards];
  const n = all.length;
  const eval5 = variant === 'short_deck_holdem' ? evaluate5CardsShortDeck : evaluate5Cards;
  let best: HandResult | null = null;
  for (let i = 0; i < n - 4; i++)
    for (let j = i + 1; j < n - 3; j++)
      for (let k = j + 1; k < n - 2; k++)
        for (let l = k + 1; l < n - 1; l++)
          for (let m = l + 1; m < n; m++) {
            const r = eval5([all[i]!, all[j]!, all[k]!, all[l]!, all[m]!]);
            if (!best || compareHands(r, best) > 0) best = r;
          }
  return best ?? { rank: 0, values: [], name: 'High Card' };
}

/** Variant-aware winner determination */
export function determineWinnersForVariant(
  variant: GameVariant,
  activePlayers: { id: string; holeCards: Card[] }[],
  communityCards: Card[]
): { winnerId: string; handResult: HandResult }[] {
  const evaluated = activePlayers.map(p => ({
    id: p.id,
    hand: getBestHandForVariant(variant, p.holeCards, communityCards),
  }));
  evaluated.sort((a, b) => compareHands(b.hand, a.hand));
  const best = evaluated[0].hand;
  return evaluated
    .filter(e => compareHands(e.hand, best) === 0)
    .map(w => ({ winnerId: w.id, handResult: w.hand }));
}
