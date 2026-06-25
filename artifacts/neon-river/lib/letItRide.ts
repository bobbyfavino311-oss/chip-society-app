/**
 * Let It Ride — pure game engine
 * Player builds a 5-card hand from 3 personal cards + 2 community cards.
 * No opponent. Pays based on hand strength (Pair of Tens or Better minimum).
 * Two optional withdrawal decisions reduce exposure before community reveals.
 */

import type { Suit } from './pokerEngine';
import { evaluate5Cards } from './pokerEngine';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LIRCard {
  suit: Suit;      // 'S' | 'H' | 'D' | 'C'
  value: number;   // 2-14
}

export type LIRPhase = 'stake' | 'betting' | 'decision1' | 'decision2' | 'showdown' | 'result';

/** Main payout multiplier per active bet. 0 = no qualifying hand (lose). */
export interface LIRHandResult {
  name: string;
  rank: number;      // 0-9 from pokerEngine
  mainMult: number;  // 0 = below Pair of Tens, otherwise see MAIN_PAYOUTS
  bonusMult: number; // 0 = below Three of a Kind
  qualifies: boolean;// true if mainMult > 0
}

export interface LIRResult {
  hand:         LIRHandResult;
  /** Number of active main bets at showdown (always 1-3) */
  activeBets:   number;
  ante:         number;
  bonusBet:     number;
  /** Net chip change from main bets (already accounts for stake loss) */
  mainNet:      number;
  /** Net chip change from bonus bet */
  bonusNet:     number;
  /** Total net chip change */
  netChips:     number;
}

// ─── Payout tables ───────────────────────────────────────────────────────────

/** Main payout multipliers (0 = losing hand) */
const MAIN_PAYOUTS: Record<string, number> = {
  'Royal Flush':     1000,
  'Straight Flush':   200,
  'Four of a Kind':    50,
  'Full House':        11,
  'Flush':              8,
  'Straight':           5,
  'Three of a Kind':    3,
  'Two Pair':           2,
  'One Pair':           1,   // only Pair of 10s or better, see qualifies guard
  'High Card':          0,
};

/** Bonus bet multipliers (Three of a Kind or better only) */
export const BONUS_PAYOUTS: Record<string, number> = {
  'Royal Flush':    20000,
  'Straight Flush':  2000,
  'Four of a Kind':   400,
  'Full House':       200,
  'Flush':             50,
  'Straight':          25,
  'Three of a Kind':    5,
};

/** Returns the main payout multiplier for a given hand.
 *  Pair is only qualifying if the pair value is 10 or higher. */
export function getMainMult(name: string, values: number[]): number {
  if (name === 'One Pair') {
    const pairVal = values[0];
    return pairVal >= 10 ? 1 : 0;
  }
  return MAIN_PAYOUTS[name] ?? 0;
}

export function getBonusMult(name: string): number {
  return BONUS_PAYOUTS[name] ?? 0;
}

// ─── Deck helpers ─────────────────────────────────────────────────────────────

const SUITS: Suit[]   = ['S', 'H', 'D', 'C'];
const VALUES: number[] = [2,3,4,5,6,7,8,9,10,11,12,13,14];

function buildDeck(): LIRCard[] {
  const deck: LIRCard[] = [];
  for (const suit of SUITS) {
    for (const value of VALUES) {
      deck.push({ suit, value });
    }
  }
  return deck;
}

function shuffle(deck: LIRCard[]): LIRCard[] {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Deal 3 player cards and 2 community cards from a fresh shuffled deck.
 * Community cards are dealt face-down — the screen reveals them progressively.
 */
export function dealLetItRide(): {
  playerCards: [LIRCard, LIRCard, LIRCard];
  communityCards: [LIRCard, LIRCard];
} {
  const deck = shuffle(buildDeck());
  return {
    playerCards:    [deck[0], deck[1], deck[2]],
    communityCards: [deck[3], deck[4]],
  };
}

/**
 * Evaluate the best 5-card hand using all player + community cards.
 */
export function evaluateLetItRide(
  playerCards: [LIRCard, LIRCard, LIRCard],
  communityCards: [LIRCard, LIRCard],
): LIRHandResult {
  const all5 = [...playerCards, ...communityCards];
  const result = evaluate5Cards(all5);
  const mainMult  = getMainMult(result.name, result.values);
  const bonusMult = getBonusMult(result.name);
  return {
    name:      result.name,
    rank:      result.rank,
    mainMult,
    bonusMult,
    qualifies: mainMult > 0,
  };
}

/**
 * Resolve the full round and compute chip changes.
 *
 * Chip accounting (ante = 100K for illustration, 3 bets active):
 *   All 3 bets active, wins Flush (8:1):
 *     mainNet = 3 × 100K × 8 = +2.4M
 *   2 bets active (took back Bet 1), wins Flush:
 *     mainNet = 2 × 100K × 8 = +1.6M
 *   Losing hand (High Card):
 *     mainNet = −(activeBets × ante)
 *
 *   Bonus Bet: always resolved independently.
 */
export function resolveLetItRide(params: {
  hand:       LIRHandResult;
  activeBets: number;
  ante:       number;
  bonusBet:   number;
}): LIRResult {
  const { hand, activeBets, ante, bonusBet } = params;

  const stakeAtRisk = activeBets * ante;
  const mainNet   = hand.mainMult > 0
    ? stakeAtRisk * hand.mainMult          // win: profit only (stake returned separately)
    : -stakeAtRisk;                        // loss: lose all active bets

  const bonusNet  = bonusBet > 0
    ? (hand.bonusMult > 0 ? bonusBet * hand.bonusMult : -bonusBet)
    : 0;

  return {
    hand,
    activeBets,
    ante,
    bonusBet,
    mainNet,
    bonusNet,
    netChips: mainNet + bonusNet,
  };
}
