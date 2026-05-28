import type { GameVariant } from './gameVariants';

export type TournamentType =
  | 'beginner' | 'sitandgo' | 'turbo' | 'highroller'
  | 'sd_lounge' | 'sd_showdown' | 'sd_rush' | 'sd_royal';

export interface TournamentConfig {
  type: TournamentType;
  name: string;
  subtitle: string;
  description: string;
  buyIn: number;
  startingChips: number;
  numPlayers: 4 | 5 | 6;
  handsPerLevel: number;
  color: string;
  icon: string;
  prizeLabel: string;
  variant: GameVariant;
}

export const TOURNAMENT_CONFIGS: Record<TournamentType, TournamentConfig> = {
  beginner: {
    type: 'beginner',
    name: 'LOW STAKES LOUNGE',
    subtitle: '5 players · Entry level',
    description: 'Perfect for new players. Gentle blind increases, relaxed pacing.',
    buyIn: 5_000,
    startingChips: 10_000,
    numPlayers: 5,
    handsPerLevel: 5,
    color: '#00ff88',
    icon: 'school-outline',
    prizeLabel: '1st: 70%  ·  2nd: 30%',
    variant: 'texas_holdem',
  },
  sitandgo: {
    type: 'sitandgo',
    name: 'SIT & GO RUSH',
    subtitle: '5 players · Classic format',
    description: 'Single-table tournament, starts immediately. Fast, competitive poker.',
    buyIn: 15_000,
    startingChips: 25_000,
    numPlayers: 5,
    handsPerLevel: 4,
    color: '#00d4ff',
    icon: 'flash-outline',
    prizeLabel: '1st: 50%  ·  2nd: 30%  ·  3rd: 20%',
    variant: 'texas_holdem',
  },
  turbo: {
    type: 'turbo',
    name: 'TURBO HEAT',
    subtitle: '6 players · Fast blinds',
    description: 'Rapid blind increases ramp up the pressure. Every chip counts.',
    buyIn: 25_000,
    startingChips: 50_000,
    numPlayers: 6,
    handsPerLevel: 3,
    color: '#ff0090',
    icon: 'speedometer-outline',
    prizeLabel: '1st: 50%  ·  2nd: 30%  ·  3rd: 20%',
    variant: 'texas_holdem',
  },
  highroller: {
    type: 'highroller',
    name: 'BLACK CARD SERIES',
    subtitle: '6 players · VIP stakes',
    description: 'Big stacks, deep blinds, maximum prestige. For elite players only.',
    buyIn: 100_000,
    startingChips: 200_000,
    numPlayers: 6,
    handsPerLevel: 8,
    color: '#ffd700',
    icon: 'diamond-outline',
    prizeLabel: '1st: 50%  ·  2nd: 30%  ·  3rd: 20%',
    variant: 'texas_holdem',
  },
  sd_lounge: {
    type: 'sd_lounge',
    name: 'SHORT DECK LOUNGE',
    subtitle: '5 players · 36-card entry',
    description: 'Entry-level Short Deck Hold\'em. Flush beats Full House — 36-card deck.',
    buyIn: 5_000,
    startingChips: 10_000,
    numPlayers: 5,
    handsPerLevel: 5,
    color: '#ff0090',
    icon: 'layers-outline',
    prizeLabel: '1st: 70%  ·  2nd: 30%',
    variant: 'short_deck_holdem',
  },
  sd_showdown: {
    type: 'sd_showdown',
    name: 'SIX PLUS SHOWDOWN',
    subtitle: '5 players · Short Deck NL',
    description: 'Classic Short Deck tournament. 36 cards, elevated hand rankings.',
    buyIn: 15_000,
    startingChips: 25_000,
    numPlayers: 5,
    handsPerLevel: 4,
    color: '#bf5fff',
    icon: 'shuffle-outline',
    prizeLabel: '1st: 50%  ·  2nd: 30%  ·  3rd: 20%',
    variant: 'short_deck_holdem',
  },
  sd_rush: {
    type: 'sd_rush',
    name: '36-CARD RUSH',
    subtitle: '6 players · Fast Short Deck',
    description: 'Turbo-paced Short Deck Hold\'em. Rapid blinds, maximum action.',
    buyIn: 25_000,
    startingChips: 50_000,
    numPlayers: 6,
    handsPerLevel: 3,
    color: '#ff8800',
    icon: 'flash-outline',
    prizeLabel: '1st: 50%  ·  2nd: 30%  ·  3rd: 20%',
    variant: 'short_deck_holdem',
  },
  sd_royal: {
    type: 'sd_royal',
    name: 'ROYAL SHORT DECK',
    subtitle: '6 players · Premium Short Deck',
    description: 'High-stakes Short Deck Hold\'em for experienced players. Big stacks, prestige.',
    buyIn: 100_000,
    startingChips: 200_000,
    numPlayers: 6,
    handsPerLevel: 8,
    color: '#ffd700',
    icon: 'star-outline',
    prizeLabel: '1st: 50%  ·  2nd: 30%  ·  3rd: 20%',
    variant: 'short_deck_holdem',
  },
};

export function getPrizePool(config: TournamentConfig): number {
  return config.numPlayers * config.buyIn;
}

export const TEXAS_TOURNAMENTS: TournamentType[] = ['beginner', 'sitandgo', 'turbo', 'highroller'];
export const SHORT_DECK_TOURNAMENTS: TournamentType[] = ['sd_lounge', 'sd_showdown', 'sd_rush', 'sd_royal'];
