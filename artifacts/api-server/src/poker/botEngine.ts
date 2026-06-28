/**
 * Server-side bot decision engine for multiplayer tables.
 * Runs entirely in-process — no external calls, no latency.
 *
 * Difficulty levels:
 *   ROOKIE  — mostly folds, occasional call, rare raise
 *   SOLID   — basic GTO: fold weak, call medium, raise strong
 *   SHARK   — positional awareness, aggression, semi-bluffs
 */

import type { Card, Seat, RoomConfig } from './types.js';

export type BotDifficulty = 'ROOKIE' | 'SOLID' | 'SHARK';

export interface BotProfile {
  userId:     string;  // prefix "bot_"
  username:   string;
  avatarId:   number;
  difficulty: BotDifficulty;
}

// ── Hand strength heuristic (0–1) ────────────────────────────────────────────

/** Preflop hand strength — simplified Chen formula approximation. */
function preflopStrength(cards: Card[]): number {
  if (cards.length !== 2) return 0.2;
  const [a, b] = cards;
  const hi  = Math.max(a!.value, b!.value);
  const lo  = Math.min(a!.value, b!.value);
  const gap = hi - lo;
  const paired  = hi === lo;
  const suited  = a!.suit === b!.suit;
  const conn    = gap <= 2;

  if (paired && hi >= 14) return 1.0;           // AA
  if (paired && hi >= 12) return 0.92;          // KK, QQ
  if (paired && hi >= 10) return 0.82;          // JJ, TT
  if (paired && hi >= 7)  return 0.65;          // 77–99
  if (paired)             return 0.50;          // 22–66
  if (hi === 14 && lo >= 13) return suited ? 0.90 : 0.85; // AK
  if (hi === 14 && lo >= 12) return suited ? 0.80 : 0.72; // AQ
  if (hi === 14 && lo >= 11) return suited ? 0.72 : 0.64; // AJ
  if (hi === 14 && lo >= 10) return suited ? 0.67 : 0.58; // AT
  if (hi === 13 && lo >= 12) return suited ? 0.72 : 0.64; // KQ
  if (hi >= 10 && lo >= 10)  return suited ? 0.62 : 0.55; // Broadway
  if (suited && conn && hi >= 9) return 0.55;   // suited connectors
  if (suited && hi >= 12)        return 0.48;   // suited broadways
  if (conn && hi >= 8)           return 0.40;   // connectors
  if (suited)                    return 0.35;
  return 0.2;
}

/** Post-flop: add community-card texture to the hand strength estimate. */
function postflopStrength(holeCards: Card[], community: Card[]): number {
  const all   = [...holeCards, ...community];
  const vals  = all.map(c => c.value);
  const suits = all.map(c => c.suit);

  // Count pairs / trips / quads among all cards
  const freq: Record<number, number> = {};
  for (const v of vals) freq[v] = (freq[v] ?? 0) + 1;
  const counts = Object.values(freq).sort((a, b) => b - a);

  // Flush / flush draw
  const suitFreq: Record<string, number> = {};
  for (const s of suits) suitFreq[s] = (suitFreq[s] ?? 0) + 1;
  const maxSuit = Math.max(...Object.values(suitFreq));
  const hasFlush     = maxSuit >= 5;
  const hasFlushDraw = maxSuit >= 4 && community.length < 5;

  // Straight
  const uniq = [...new Set(vals)].sort((a, b) => a - b);
  let maxRun = 1, run = 1;
  for (let i = 1; i < uniq.length; i++) {
    run = uniq[i]! - uniq[i - 1]! === 1 ? run + 1 : 1;
    if (run > maxRun) maxRun = run;
  }
  const hasStraight     = maxRun >= 5;
  const hasStraightDraw = maxRun >= 4 && community.length < 5;

  if (hasFlush && hasStraight)       return 0.98;
  if (hasFlush)                      return 0.90;
  if (hasStraight)                   return 0.85;
  if (counts[0]! >= 4)               return 0.97;           // quads
  if (counts[0]! >= 3 && counts[1]! >= 2) return 0.92;     // full house
  if (counts[0]! >= 3)               return 0.75;           // trips
  if (counts[0]! >= 2 && counts[1]! >= 2) return 0.60;     // two pair
  if (counts[0]! >= 2)               return 0.40;           // one pair
  if (hasFlushDraw || hasStraightDraw) return 0.35;         // draws
  const base = preflopStrength(holeCards);
  return base * 0.85;                                        // air
}

// ── Decision engine ──────────────────────────────────────────────────────────

export interface BotDecision {
  type:    'fold' | 'check' | 'call' | 'raise' | 'allin';
  amount?: number;
}

export function decideBotAction(params: {
  difficulty:   BotDifficulty;
  holeCards:    Card[];
  communityCards: Card[];
  toCall:       number;     // chips needed to call
  chips:        number;     // bot's remaining chips
  currentBet:   number;     // table's current bet
  minRaise:     number;
  bigBlind:     number;
  potSize:      number;
  isPreflop:    boolean;
  position:     'early' | 'middle' | 'late';  // rough seat position
}): BotDecision {
  const {
    difficulty, holeCards, communityCards, toCall, chips,
    minRaise, bigBlind, potSize, isPreflop, position,
  } = params;

  const strength = isPreflop
    ? preflopStrength(holeCards)
    : postflopStrength(holeCards, communityCards);

  // Add a small random jitter so bots don't play identically
  const jitter  = (Math.random() - 0.5) * 0.1;
  const eff     = Math.max(0, Math.min(1, strength + jitter));
  const canCheck = toCall === 0;
  const potOdds = toCall > 0 ? toCall / (potSize + toCall) : 0;

  if (difficulty === 'ROOKIE') {
    // Mostly cautious
    if (eff > 0.78) {
      const rAmt = Math.min(chips, minRaise + bigBlind * Math.floor(Math.random() * 3));
      return chips <= minRaise ? { type: 'allin' } : { type: 'raise', amount: rAmt };
    }
    if (eff > 0.45 || canCheck) {
      return toCall === 0 ? { type: 'check' } : { type: 'call' };
    }
    return { type: 'fold' };
  }

  if (difficulty === 'SOLID') {
    // Pot-odds aware, position-conscious
    const posBonus = position === 'late' ? 0.07 : position === 'middle' ? 0.03 : 0;
    const adjEff   = eff + posBonus;

    if (adjEff > 0.85) {
      const rAmt = Math.min(chips, minRaise + Math.floor(potSize * 0.6));
      return chips <= minRaise ? { type: 'allin' } : { type: 'raise', amount: rAmt };
    }
    if (adjEff > potOdds + 0.1 || (canCheck && adjEff > 0.3)) {
      return toCall === 0 ? { type: 'check' } : { type: 'call' };
    }
    if (adjEff > 0.3 && canCheck) return { type: 'check' };
    return { type: 'fold' };
  }

  // SHARK — aggressive, semi-bluffs, positional
  const posBonus = position === 'late' ? 0.12 : position === 'middle' ? 0.06 : 0;
  const adjEff   = eff + posBonus;

  // Pure bluff from late position
  if (position === 'late' && !isPreflop && Math.random() < 0.18 && canCheck) {
    const rAmt = Math.min(chips, minRaise + Math.floor(potSize * 0.5));
    return chips <= minRaise ? { type: 'allin' } : { type: 'raise', amount: rAmt };
  }

  if (adjEff > 0.80) {
    const mult = adjEff > 0.92 ? 1.0 : 0.65;
    const rAmt = Math.min(chips, minRaise + Math.floor(potSize * mult));
    return chips <= minRaise ? { type: 'allin' } : { type: 'raise', amount: rAmt };
  }
  if (adjEff > potOdds + 0.05 || (canCheck && adjEff > 0.25)) {
    return toCall === 0 ? { type: 'check' } : { type: 'call' };
  }
  return { type: 'fold' };
}

// ── Bot roster ────────────────────────────────────────────────────────────────

const BOT_ROSTER: Omit<BotProfile, 'userId'>[] = [
  { username: 'RoboShark',   avatarId: 11, difficulty: 'SHARK'  },
  { username: 'ChipBot_99',  avatarId: 9,  difficulty: 'SOLID'  },
  { username: 'FoldMaster',  avatarId: 13, difficulty: 'ROOKIE' },
  { username: 'VegasBot',    avatarId: 7,  difficulty: 'SOLID'  },
  { username: 'BluffAI',     avatarId: 15, difficulty: 'SHARK'  },
  { username: 'SafePlay',    avatarId: 12, difficulty: 'ROOKIE' },
  { username: 'CardBot',     avatarId: 6,  difficulty: 'SOLID'  },
  { username: 'MidnightBot', avatarId: 10, difficulty: 'SHARK'  },
];

/** Pick a bot profile that isn't already seated. */
export function pickBot(seated: Set<string>): BotProfile {
  const available = BOT_ROSTER.filter(b => !seated.has(b.username));
  const template  = available.length > 0
    ? available[Math.floor(Math.random() * available.length)]!
    : BOT_ROSTER[Math.floor(Math.random() * BOT_ROSTER.length)]!;
  const suffix = Math.floor(Math.random() * 900 + 100);
  return {
    ...template,
    userId:   `bot_${template.username.toLowerCase()}_${suffix}`,
    username: `${template.username}`,
  };
}

/** Compute a chip stack appropriate for the stake tier. */
export function botBuyIn(config: RoomConfig): number {
  // Buy in at 50–80 BB so bots feel realistic
  const bb       = config.bigBlind;
  const target   = bb * (50 + Math.floor(Math.random() * 30));
  return Math.min(Math.max(target, config.minBuyIn), config.maxBuyIn);
}
