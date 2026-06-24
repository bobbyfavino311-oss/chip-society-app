import { type Card, type Suit } from './pokerEngine';

export type { Card };

const SUITS: Suit[] = ['S', 'H', 'D', 'C'];
export const NUM_DECKS        = 6;
export const SHOE_SIZE        = NUM_DECKS * 52;           // 312
export const RESHUFFLE_AT     = Math.floor(SHOE_SIZE * 0.75); // 234 — reshuffle at 75%

// ─── Shoe ─────────────────────────────────────────────────────────────────────

export function createShoe(numDecks: number): Card[] {
  const cards: Card[] = [];
  for (let d = 0; d < numDecks; d++) {
    for (const suit of SUITS) {
      for (let v = 2; v <= 14; v++) {
        cards.push({ suit, value: v });
      }
    }
  }
  return shuffleCards(cards);
}

export function createSixDeckShoe(): Card[] {
  return createShoe(NUM_DECKS);
}

export function shuffleCards(cards: Card[]): Card[] {
  const d = [...cards];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

// ─── Hand values ──────────────────────────────────────────────────────────────

/** Blackjack point value: J/Q/K → 10, Ace → 11, others → face value */
export function cardBJValue(card: Card): number {
  if (card.value >= 11 && card.value <= 13) return 10;
  if (card.value === 14) return 11;
  return card.value;
}

/** Best possible total ≤ 21 (aces counted as 1 when needed) */
export function handTotal(cards: Card[]): number {
  let total = 0;
  let aces  = 0;
  for (const c of cards) {
    total += cardBJValue(c);
    if (c.value === 14) aces++;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

/** Natural blackjack: exactly 2 cards, total 21 */
export function isBlackjack(cards: Card[]): boolean {
  return cards.length === 2 && handTotal(cards) === 21;
}

export function isBust(cards: Card[]): boolean {
  return handTotal(cards) > 21;
}

/** Ace is counted as 11 (at least one ace still acting as 11) */
export function isSoftHand(cards: Card[]): boolean {
  let total = 0;
  let aces  = 0;
  for (const c of cards) {
    total += cardBJValue(c);
    if (c.value === 14) aces++;
  }
  // reduce aces until ≤ 21 or out of aces
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  // soft = at least one ace still counted as 11
  const aceCount = cards.filter(c => c.value === 14).length;
  return aceCount > 0 && total <= 21 && total + 10 <= 21;
}

/** Dealer rule: hit on ≤ 16, stand on ≥ 17 (stand on soft 17) */
export function dealerShouldHit(cards: Card[]): boolean {
  return handTotal(cards) < 17;
}

/** Two cards with identical BJ value → can split */
export function canSplit(cards: Card[]): boolean {
  if (cards.length !== 2) return false;
  return cardBJValue(cards[0]) === cardBJValue(cards[1]);
}

// ─── Display helpers ──────────────────────────────────────────────────────────

function _fmtVal(v: number): string {
  return v % 1 === 0 ? v.toFixed(0) : v.toFixed(1);
}
export function fmt(n: number): string {
  if (n >= 1_000_000_000) return `${_fmtVal(n / 1_000_000_000)}B`;
  if (n >= 1_000_000)     return `${_fmtVal(n / 1_000_000)}M`;
  if (n >= 1_000)         return `${_fmtVal(n / 1_000)}K`;
  return String(n);
}
