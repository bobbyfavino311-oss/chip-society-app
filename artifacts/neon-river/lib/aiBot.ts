import { Card, getPreflopStrength, getPostflopStrength } from './pokerEngine';

export type AIDifficulty = 'beginner' | 'casual' | 'competitive' | 'shark' | 'elite';
export type AIAction = 'fold' | 'check' | 'call' | 'raise' | 'allin';

export interface AIDecisionInput {
  holeCards: Card[];
  communityCards: Card[];
  myChips: number;
  pot: number;
  currentBet: number;   // amount I need to call
  myBetInRound: number; // what I've already put in this round
  minRaise: number;
  difficulty: AIDifficulty;
  phase: 'preflop' | 'flop' | 'turn' | 'river';
  numActivePlayers: number;
}

interface DifficultyConfig {
  bluffChance: number;
  foldThreshold: number;
  raiseThreshold: number;
  aggressionMultiplier: number;
  delayMs: [number, number]; // [min, max]
}

const DIFFICULTY_CONFIGS: Record<AIDifficulty, DifficultyConfig> = {
  beginner: {
    bluffChance: 0,
    foldThreshold: 0.25,
    raiseThreshold: 0.75,
    aggressionMultiplier: 0.5,
    delayMs: [800, 1800],
  },
  casual: {
    bluffChance: 0.05,
    foldThreshold: 0.22,
    raiseThreshold: 0.65,
    aggressionMultiplier: 0.7,
    delayMs: [600, 1500],
  },
  competitive: {
    bluffChance: 0.10,
    foldThreshold: 0.18,
    raiseThreshold: 0.55,
    aggressionMultiplier: 0.9,
    delayMs: [500, 1200],
  },
  shark: {
    bluffChance: 0.15,
    foldThreshold: 0.15,
    raiseThreshold: 0.48,
    aggressionMultiplier: 1.2,
    delayMs: [400, 1000],
  },
  elite: {
    bluffChance: 0.20,
    foldThreshold: 0.12,
    raiseThreshold: 0.42,
    aggressionMultiplier: 1.5,
    delayMs: [300, 900],
  },
};

export function getAIDecision(input: AIDecisionInput): AIAction {
  const { holeCards, communityCards, myChips, pot, currentBet, myBetInRound, minRaise, difficulty, phase, numActivePlayers } = input;
  const config = DIFFICULTY_CONFIGS[difficulty];

  const strength =
    phase === 'preflop'
      ? getPreflopStrength(holeCards)
      : getPostflopStrength(holeCards, communityCards);

  const callAmount = currentBet - myBetInRound;
  const canCheck = callAmount <= 0;
  const potOdds = pot > 0 ? callAmount / (pot + callAmount) : 0;

  // Bluff decision (occasional)
  const isBluffing = Math.random() < config.bluffChance && strength < 0.35;
  const effectiveStrength = isBluffing ? 0.7 : strength;

  // Adjust for number of players (tighten up with more players)
  const playerAdjusted = effectiveStrength - (numActivePlayers - 2) * 0.03;

  if (canCheck) {
    if (playerAdjusted < 0.25) {
      return 'check';
    } else if (playerAdjusted >= config.raiseThreshold) {
      if (myChips <= minRaise * 2) return 'allin';
      return 'raise';
    } else {
      return 'check';
    }
  }

  // Need to call or fold
  if (playerAdjusted < config.foldThreshold) {
    return 'fold';
  }

  // If calling would cost more than 40% of chips
  const callFraction = callAmount / myChips;
  if (callFraction > 0.5 && playerAdjusted < 0.65) {
    return 'fold';
  }

  if (callFraction > 0.8 && playerAdjusted >= 0.60) {
    return 'allin';
  }

  // Pot odds check: if pot odds are better than strength, we should call
  if (potOdds < playerAdjusted || playerAdjusted > 0.55) {
    if (playerAdjusted >= config.raiseThreshold && callAmount < myChips * 0.3) {
      if (myChips <= minRaise * 2) return 'allin';
      return 'raise';
    }
    return 'call';
  }

  return 'fold';
}

export function getAIDelay(difficulty: AIDifficulty): number {
  const [min, max] = DIFFICULTY_CONFIGS[difficulty].delayMs;
  return min + Math.random() * (max - min);
}

export function getRaiseAmount(
  difficulty: AIDifficulty,
  pot: number,
  myChips: number,
  minRaise: number,
  strength: number
): number {
  const config = DIFFICULTY_CONFIGS[difficulty];
  const baseMult = 0.5 + strength * 1.5 * config.aggressionMultiplier;
  const raise = Math.floor(pot * baseMult);
  const clamped = Math.max(minRaise, Math.min(raise, myChips));
  return clamped;
}
