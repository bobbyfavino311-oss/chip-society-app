import { Card, getPreflopStrength, getPostflopStrength } from './pokerEngine';

export type AIDifficulty  = 'beginner' | 'casual' | 'competitive' | 'shark' | 'elite';
export type AIPersonality = 'tight' | 'loose' | 'aggressive' | 'passive' | 'unpredictable';
export type AIAction      = 'fold' | 'check' | 'call' | 'raise' | 'allin';

// ─── Input ────────────────────────────────────────────────────────────────────

export interface AIDecisionInput {
  holeCards: Card[];
  communityCards: Card[];
  myChips: number;
  pot: number;
  currentBet: number;
  myBetInRound: number;
  minRaise: number;
  difficulty: AIDifficulty;
  personality: AIPersonality;
  phase: 'preflop' | 'flop' | 'turn' | 'river';
  numActivePlayers: number;
  // Position relative to dealer: 0=early, 1=middle, 2=late/button
  positionAdvantage: number;
}

// ─── Board texture ─────────────────────────────────────────────────────────────

export interface BoardTexture {
  flushDraw: boolean;    // 3+ of one suit on board
  straightDraw: boolean; // 3+ connected values (within gap of 2)
  paired: boolean;       // pair or better on board
  rainbow: boolean;      // all different suits (no flush draw possible)
  highCard: boolean;     // ace or king on board
  wetness: number;       // 0 = dry/static, 1 = very dynamic/draw-heavy
}

export function analyzeBoardTexture(communityCards: Card[]): BoardTexture {
  if (communityCards.length === 0) {
    return { flushDraw: false, straightDraw: false, paired: false, rainbow: true, highCard: false, wetness: 0 };
  }

  const suits  = communityCards.map(c => c.suit);
  const values = communityCards.map(c => c.value);

  // Flush draw: 3+ same suit
  const suitCounts: Record<string, number> = {};
  for (const s of suits) suitCounts[s] = (suitCounts[s] ?? 0) + 1;
  const flushDraw = Object.values(suitCounts).some(n => n >= 3);
  const rainbow   = Object.values(suitCounts).every(n => n <= 1);

  // Straight draw: 3+ connected values within gap ≤ 2
  const uniqueVals = [...new Set(values)].sort((a, b) => a - b);
  let maxRun = 1, curRun = 1;
  for (let i = 1; i < uniqueVals.length; i++) {
    if (uniqueVals[i] - uniqueVals[i - 1] <= 2) { curRun++; maxRun = Math.max(maxRun, curRun); }
    else curRun = 1;
  }
  const straightDraw = maxRun >= 3;

  // Paired board
  const valCounts: Record<number, number> = {};
  for (const v of values) valCounts[v] = (valCounts[v] ?? 0) + 1;
  const paired = Object.values(valCounts).some(n => n >= 2);

  // High-card presence (A or K)
  const highCard = values.some(v => v >= 13);

  // Wetness score
  let wetness = 0;
  if (flushDraw)   wetness += 0.38;
  if (straightDraw) wetness += 0.35;
  if (paired)       wetness += 0.12;
  if (highCard)     wetness += 0.08;
  wetness = Math.min(1, wetness);

  return { flushDraw, straightDraw, paired, rainbow, highCard, wetness };
}

// ─── Difficulty (controls SKILL — how well they read equity & timing) ─────────

interface DifficultyConfig {
  skillAccuracy: number;     // 0–1: how accurately they evaluate hand strength
  bluffChance: number;       // base bluff frequency per street
  foldThreshold: number;     // minimum perceived strength to continue facing a bet
  raiseThreshold: number;    // perceived strength required to voluntarily bet/raise
  aggressionMultiplier: number; // scales bet sizes
  delayMs: [number, number];
}

const DIFFICULTY_CONFIGS: Record<AIDifficulty, DifficultyConfig> = {
  beginner: {
    skillAccuracy: 0.45, bluffChance: 0.00, foldThreshold: 0.28,
    raiseThreshold: 0.78, aggressionMultiplier: 0.5, delayMs: [2200, 4200],
  },
  casual: {
    skillAccuracy: 0.62, bluffChance: 0.04, foldThreshold: 0.22,
    raiseThreshold: 0.65, aggressionMultiplier: 0.7, delayMs: [1800, 3500],
  },
  competitive: {
    skillAccuracy: 0.77, bluffChance: 0.09, foldThreshold: 0.17,
    raiseThreshold: 0.54, aggressionMultiplier: 0.95, delayMs: [1300, 2800],
  },
  shark: {
    skillAccuracy: 0.88, bluffChance: 0.15, foldThreshold: 0.13,
    raiseThreshold: 0.44, aggressionMultiplier: 1.25, delayMs: [1000, 2200],
  },
  elite: {
    skillAccuracy: 0.97, bluffChance: 0.21, foldThreshold: 0.10,
    raiseThreshold: 0.37, aggressionMultiplier: 1.55, delayMs: [800, 1900],
  },
};

// ─── Personality (controls STYLE — how they express their hands) ──────────────

interface PersonalityConfig {
  // VPIP-like: willingness to enter/stay in pots (1 = very willing)
  vpip: number;
  // Pre-flop raise frequency multiplier
  pfrMult: number;
  // Post-flop aggression multiplier on bet/raise decisions
  aggression: number;
  // Multiplier on top of skill bluffChance
  bluffMult: number;
  // Bet sizing multiplier (vs pot)
  betSizeMult: number;
  // 0 = ignores pot odds, 1 = perfectly pot-odds aware
  potOddsWeight: number;
  // Slow-play chance: check strong hands to trap (0–1)
  slowPlayChance: number;
  // 3-bet re-raise frequency multiplier
  threeBetMult: number;
}

const PERSONALITY_CONFIGS: Record<AIPersonality, PersonalityConfig> = {
  tight: {
    vpip: 0.20, pfrMult: 1.1, aggression: 0.8, bluffMult: 0.4,
    betSizeMult: 1.1, potOddsWeight: 0.85, slowPlayChance: 0.10, threeBetMult: 0.6,
  },
  loose: {
    vpip: 0.55, pfrMult: 0.85, aggression: 0.9, bluffMult: 1.1,
    betSizeMult: 0.85, potOddsWeight: 0.35, slowPlayChance: 0.08, threeBetMult: 0.9,
  },
  aggressive: {
    vpip: 0.38, pfrMult: 1.5, aggression: 1.6, bluffMult: 1.3,
    betSizeMult: 1.45, potOddsWeight: 0.5, slowPlayChance: 0.05, threeBetMult: 1.8,
  },
  passive: {
    vpip: 0.42, pfrMult: 0.5, aggression: 0.45, bluffMult: 0.25,
    betSizeMult: 0.65, potOddsWeight: 0.90, slowPlayChance: 0.30, threeBetMult: 0.3,
  },
  unpredictable: {
    vpip: 0.42, pfrMult: 1.1, aggression: 1.05, bluffMult: 1.5,
    betSizeMult: 1.15, potOddsWeight: 0.20, slowPlayChance: 0.20, threeBetMult: 1.2,
  },
};

// ─── Main decision function ───────────────────────────────────────────────────

export function getAIDecision(input: AIDecisionInput): AIAction {
  const {
    holeCards, communityCards, myChips, pot, currentBet, myBetInRound,
    minRaise, difficulty, personality, phase, numActivePlayers, positionAdvantage,
  } = input;

  const dCfg = DIFFICULTY_CONFIGS[difficulty];
  const pCfg = PERSONALITY_CONFIGS[personality];
  const board = analyzeBoardTexture(communityCards);

  // ── 1. Evaluate hand strength with skill-based noise ───────────────────────
  const trueStrength = phase === 'preflop'
    ? getPreflopStrength(holeCards)
    : getPostflopStrength(holeCards, communityCards);

  // Beginners see their hand through a noisy lens
  const noise = (1 - dCfg.skillAccuracy) * (Math.random() - 0.5) * 0.28;
  let perceived = Math.max(0.02, Math.min(0.98, trueStrength + noise));

  // ── 2. Multi-way adjustment — tighten range with more players ──────────────
  const multiWayPenalty = (numActivePlayers - 2) * 0.022 * (1 / pCfg.vpip);
  perceived -= multiWayPenalty;

  // ── 3. Position bonus — late position = wider play ────────────────────────
  const positionBonus = positionAdvantage * 0.025 * dCfg.skillAccuracy;
  perceived += positionBonus;
  perceived = Math.max(0, Math.min(1, perceived));

  // ── 4. Pot-odds and stack metrics ─────────────────────────────────────────
  const callAmount   = Math.max(0, currentBet - myBetInRound);
  const canCheck     = callAmount <= 0;
  const totalPot     = pot + callAmount;
  const potOdds      = totalPot > 0 ? callAmount / totalPot : 0;
  const callFraction = myChips > 0 ? callAmount / myChips : 1;
  const shortStack   = callFraction > 0.65 || myChips < minRaise * 3;

  // ── 5. Bluffing — semi-bluff on wet boards with draws ─────────────────────
  const hasDraw           = board.flushDraw || board.straightDraw;
  const bluffWindow       = hasDraw ? 0.42 : 0.30;  // wider window on wet boards
  const bluffEligible     = trueStrength < bluffWindow && trueStrength > 0.08 && !shortStack;
  const bluffRoll         = Math.random() < (dCfg.bluffChance * pCfg.bluffMult);
  const semiBluffBonus    = hasDraw ? 0.18 : 0;     // extra credit for drawing hands
  const isBluffing        = bluffEligible && bluffRoll;
  if (isBluffing) perceived = Math.min(0.92, perceived + 0.30 + semiBluffBonus);

  // ── 6. Unpredictable: chaos factor — random action with low probability ───
  if (personality === 'unpredictable' && Math.random() < 0.10) {
    if (canCheck) return Math.random() < 0.55 ? 'check' : 'raise';
    const chaosRoll = Math.random();
    if (chaosRoll < 0.30) return 'fold';
    if (chaosRoll < 0.60) return 'call';
    return 'raise';
  }

  // ── 7. Dynamic thresholds ─────────────────────────────────────────────────
  // Fold threshold scales with personality's willingness to enter pots
  const foldThreshold = dCfg.foldThreshold * (0.5 / pCfg.vpip);
  // Raise threshold scales inversely with aggression
  const raiseThreshold = dCfg.raiseThreshold / (pCfg.aggression * pCfg.pfrMult * 0.7);

  // ── 8. CHECK OPTION ───────────────────────────────────────────────────────
  if (canCheck) {
    // Very strong hand — bet for value
    if (perceived >= raiseThreshold) {
      // Passive / slow-play: sometimes check to trap
      if (Math.random() < pCfg.slowPlayChance) return 'check';
      if (shortStack || myChips <= minRaise * 2) return 'allin';
      return 'raise';
    }
    // Moderate hand on wet board — semi-bluff bet
    if (perceived > 0.38 && hasDraw && Math.random() < pCfg.aggression * 0.45) {
      if (myChips <= minRaise * 2) return 'allin';
      return 'raise';
    }
    // C-bet: aggressive players bet missed flops sometimes
    if (perceived < 0.30 && phase !== 'preflop' && Math.random() < pCfg.bluffMult * dCfg.bluffChance * 2) {
      return 'raise';
    }
    return 'check';
  }

  // ── 9. FACING A BET — call / raise / fold ────────────────────────────────

  // Hard fold: hand clearly too weak
  if (perceived < foldThreshold) return 'fold';

  // Stack protection: can't justify calling big bet with marginal hand
  if (callFraction > 0.45 && perceived < 0.58) return 'fold';

  // Going all-in: calling big with strong hand — commit
  if (callFraction > 0.65 && perceived >= 0.65) return 'allin';

  // Pot odds check (weighted by personality — passive players honor pot odds more)
  const potOddsMet = potOdds < perceived;
  const usesPotOdds = Math.random() < pCfg.potOddsWeight;
  if (!potOddsMet && usesPotOdds && perceived < 0.48) return 'fold';

  // 3-bet / re-raise with strong hand
  if (perceived >= raiseThreshold * 0.92) {
    if (shortStack || myChips <= minRaise * 2) return 'allin';
    // Passive players call even premium hands
    if (Math.random() < (1 - pCfg.threeBetMult * 0.55)) return 'call';
    if (callAmount < myChips * 0.3) return 'raise';
  }

  return 'call';
}

// ─── Raise sizing ─────────────────────────────────────────────────────────────

export function getRaiseAmount(
  difficulty: AIDifficulty,
  pot: number,
  myChips: number,
  minRaise: number,
  strength: number,
  personality: AIPersonality = 'passive',
  boardWetness: number = 0,
): number {
  const dCfg = DIFFICULTY_CONFIGS[difficulty];
  const pCfg = PERSONALITY_CONFIGS[personality];

  // Skilled players use smaller bets on wet boards (pot control / protection)
  const wetAdjust = dCfg.skillAccuracy > 0.7 ? (1 - boardWetness * 0.22) : 1;

  // Base sizing: stronger hand → bigger bet (value range)
  const baseMult = 0.45 + strength * 1.3;
  const finalMult = baseMult * pCfg.betSizeMult * wetAdjust * dCfg.aggressionMultiplier;

  const raise = Math.floor(pot * finalMult);
  return Math.max(minRaise, Math.min(raise, myChips));
}

// ─── AI delay ─────────────────────────────────────────────────────────────────

export function getAIDelay(difficulty: AIDifficulty): number {
  const [min, max] = DIFFICULTY_CONFIGS[difficulty].delayMs;
  return min + Math.random() * (max - min);
}

// ─── Personality assignment for bots (varied per seat, deterministic) ─────────

const BOT_PERSONALITY_ROTATION: AIPersonality[] = [
  'tight', 'aggressive', 'loose', 'passive', 'unpredictable',
];

export function getBotPersonality(seatIndex: number): AIPersonality {
  return BOT_PERSONALITY_ROTATION[seatIndex % BOT_PERSONALITY_ROTATION.length];
}
