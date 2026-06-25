import type { Suit } from './pokerEngine';

// ─── Types ────────────────────────────────────────────────────────────────────

export type HCFCard = { suit: Suit; value: number };

export type HCFPhase = 'stake' | 'betting' | 'decision' | 'reveal' | 'result';

export interface HCFFlush {
  suit: Suit;
  cards: HCFCard[];  // sorted highest to lowest
  length: number;
}

export interface HCFResult {
  playerFlush: HCFFlush;
  dealerFlush: HCFFlush;
  dealerQualified: boolean;
  comparison: 'player' | 'dealer' | 'push';
  folded: boolean;
  raiseMult: number;
  flushBonusMult: number;
  sfBonusMult: number;
  anteNet: number;
  raiseNet: number;
  flushBonusNet: number;
  sfBonusNet: number;
  netChips: number;
}

// ─── Deck ─────────────────────────────────────────────────────────────────────

const SUITS: Suit[] = ['S', 'H', 'D', 'C'];

export function dealHighCardFlush(): { playerCards: HCFCard[]; dealerCards: HCFCard[] } {
  const deck: HCFCard[] = [];
  for (const suit of SUITS) {
    for (let v = 2; v <= 14; v++) deck.push({ suit, value: v });
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return { playerCards: deck.slice(0, 7), dealerCards: deck.slice(7, 14) };
}

// ─── Flush evaluation ─────────────────────────────────────────────────────────

function groupBySuit(cards: HCFCard[]): Map<Suit, HCFCard[]> {
  const m = new Map<Suit, HCFCard[]>();
  for (const c of cards) {
    const arr = m.get(c.suit) ?? [];
    arr.push(c);
    m.set(c.suit, arr);
  }
  return m;
}

function flushScore(f: HCFFlush): number[] {
  return [f.length, ...f.cards.map(c => c.value)];
}

function compareScore(a: number[], b: number[]): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const av = a[i] ?? -Infinity;
    const bv = b[i] ?? -Infinity;
    if (av !== bv) return av - bv;
  }
  return 0;
}

export function getBestFlush(cards: HCFCard[]): HCFFlush {
  const bysuit = groupBySuit(cards);
  let best: HCFFlush | null = null;
  for (const [suit, suitCards] of bysuit.entries()) {
    const sorted = [...suitCards].sort((a, b) => b.value - a.value);
    const candidate: HCFFlush = { suit, cards: sorted, length: sorted.length };
    if (!best || compareScore(flushScore(candidate), flushScore(best)) > 0) {
      best = candidate;
    }
  }
  return best!;
}

export function compareFlushes(a: HCFFlush, b: HCFFlush): 'player' | 'dealer' | 'push' {
  const cmp = compareScore(flushScore(a), flushScore(b));
  if (cmp > 0) return 'player';
  if (cmp < 0) return 'dealer';
  return 'push';
}

export function dealerQualifies(flush: HCFFlush): boolean {
  return flush.length >= 3 && flush.cards[0].value >= 9;
}

export function getRaiseMultiplier(flushLength: number): 1 | 2 | 3 {
  if (flushLength >= 6) return 3;
  if (flushLength === 5) return 2;
  return 1;
}

// ─── Flush bonus ──────────────────────────────────────────────────────────────

export const FLUSH_BONUS_TABLE: { min: number; mult: number; label: string }[] = [
  { min: 7, mult: 300,  label: '7-Card Flush' },
  { min: 6, mult: 100,  label: '6-Card Flush' },
  { min: 5, mult: 10,   label: '5-Card Flush' },
  { min: 4, mult: 1,    label: '4-Card Flush' },
];

export function evaluateFlushBonus(cards: HCFCard[]): number {
  const bysuit = groupBySuit(cards);
  const best = Math.max(...[...bysuit.values()].map(c => c.length));
  for (const { min, mult } of FLUSH_BONUS_TABLE) {
    if (best >= min) return mult;
  }
  return 0;
}

// ─── Straight flush bonus ─────────────────────────────────────────────────────

export const SF_BONUS_TABLE: { min: number; mult: number; label: string }[] = [
  { min: 7, mult: 8000, label: '7-Card Straight Flush' },
  { min: 6, mult: 1000, label: '6-Card Straight Flush' },
  { min: 5, mult: 100,  label: '5-Card Straight Flush' },
  { min: 4, mult: 60,   label: '4-Card Straight Flush' },
  { min: 3, mult: 7,    label: '3-Card Straight Flush' },
];

function longestConsecutive(vals: number[]): number {
  const sorted = [...new Set(vals)].sort((a, b) => a - b);
  if (sorted.length === 0) return 0;
  let max = 1, cur = 1;
  for (let i = 1; i < sorted.length; i++) {
    cur = sorted[i] === sorted[i - 1] + 1 ? cur + 1 : 1;
    if (cur > max) max = cur;
  }
  return max;
}

function longestStraightFlushInSuit(suitCards: HCFCard[]): number {
  if (suitCards.length < 3) return 0;
  const vals = suitCards.map(c => c.value);
  let best = longestConsecutive(vals);
  if (vals.includes(14)) {
    best = Math.max(best, longestConsecutive(vals.map(v => (v === 14 ? 1 : v))));
  }
  return best;
}

export function evaluateSFBonus(cards: HCFCard[]): number {
  const bysuit = groupBySuit(cards);
  let best = 0;
  for (const suitCards of bysuit.values()) {
    best = Math.max(best, longestStraightFlushInSuit(suitCards));
  }
  for (const { min, mult } of SF_BONUS_TABLE) {
    if (best >= min) return mult;
  }
  return 0;
}

// ─── Resolution ───────────────────────────────────────────────────────────────

export interface ResolveParams {
  playerCards: HCFCard[];
  dealerCards: HCFCard[];
  folded: boolean;
  ante: number;
  raiseMult: number;       // 0 if folded
  flushBonusBet: number;   // 0 if not placed
  sfBonusBet: number;      // 0 if not placed
}

export function resolveHighCardFlush(p: ResolveParams): HCFResult {
  const playerFlush = getBestFlush(p.playerCards);
  const dealerFlush = getBestFlush(p.dealerCards);
  const dealerQualified = dealerQualifies(dealerFlush);
  const comparison = compareFlushes(playerFlush, dealerFlush);

  const flushBonusMult = evaluateFlushBonus(p.playerCards);
  const flushBonusNet = p.flushBonusBet > 0
    ? (flushBonusMult > 0 ? p.flushBonusBet * flushBonusMult : -p.flushBonusBet)
    : 0;

  const sfBonusMult = evaluateSFBonus(p.playerCards);
  const sfBonusNet = p.sfBonusBet > 0
    ? (sfBonusMult > 0 ? p.sfBonusBet * sfBonusMult : -p.sfBonusBet)
    : 0;

  let anteNet = 0;
  let raiseNet = 0;

  if (p.folded) {
    anteNet = -p.ante;
    raiseNet = 0;
  } else {
    const raiseAmt = p.raiseMult * p.ante;
    if (!dealerQualified) {
      anteNet = p.ante;    // ante wins
      raiseNet = 0;        // raise pushes (returned, net 0)
    } else if (comparison === 'player') {
      anteNet = p.ante;
      raiseNet = raiseAmt;
    } else if (comparison === 'dealer') {
      anteNet = -p.ante;
      raiseNet = -raiseAmt;
    } else {
      anteNet = 0;
      raiseNet = 0;
    }
  }

  const netChips = anteNet + raiseNet + flushBonusNet + sfBonusNet;

  return {
    playerFlush, dealerFlush, dealerQualified, comparison, folded: p.folded,
    raiseMult: p.raiseMult, flushBonusMult, sfBonusMult,
    anteNet, raiseNet, flushBonusNet, sfBonusNet, netChips,
  };
}
