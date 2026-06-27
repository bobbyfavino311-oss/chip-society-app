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
  emoji: string;
  format: string;
  prizeLabel: string;
  variant: GameVariant;
  capacityMax: number;
  scheduleIntervalMin: number;
  scheduleOffsetMin: number;
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
    color: '#00d4ff',
    icon: 'school-outline',
    emoji: '🎰',
    format: 'Freezeout · Easy Blinds',
    prizeLabel: '1st: 70%  ·  2nd: 30%',
    variant: 'texas_holdem',
    capacityMax: 5,
    scheduleIntervalMin: 15,
    scheduleOffsetMin: 0,
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
    color: '#00e887',
    icon: 'flash-outline',
    emoji: '⚡',
    format: 'Freezeout · Starts Instantly',
    prizeLabel: '1st: 50%  ·  2nd: 30%  ·  3rd: 20%',
    variant: 'texas_holdem',
    capacityMax: 5,
    scheduleIntervalMin: 30,
    scheduleOffsetMin: 7,
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
    color: '#ff6600',
    icon: 'speedometer-outline',
    emoji: '🔥',
    format: 'Turbo · Fast Blind Levels',
    prizeLabel: '1st: 50%  ·  2nd: 30%  ·  3rd: 20%',
    variant: 'texas_holdem',
    capacityMax: 6,
    scheduleIntervalMin: 45,
    scheduleOffsetMin: 18,
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
    emoji: '👑',
    format: 'Deep Stack · VIP Entry',
    prizeLabel: '1st: 50%  ·  2nd: 30%  ·  3rd: 20%',
    variant: 'texas_holdem',
    capacityMax: 6,
    scheduleIntervalMin: 60,
    scheduleOffsetMin: 34,
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
    color: '#bf5fff',
    icon: 'layers-outline',
    emoji: '🃏',
    format: 'Short Deck · Freezeout',
    prizeLabel: '1st: 70%  ·  2nd: 30%',
    variant: 'short_deck_holdem',
    capacityMax: 5,
    scheduleIntervalMin: 20,
    scheduleOffsetMin: 4,
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
    color: '#ff0090',
    icon: 'shuffle-outline',
    emoji: '🎯',
    format: 'Short Deck · Classic Format',
    prizeLabel: '1st: 50%  ·  2nd: 30%  ·  3rd: 20%',
    variant: 'short_deck_holdem',
    capacityMax: 5,
    scheduleIntervalMin: 35,
    scheduleOffsetMin: 12,
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
    emoji: '💨',
    format: 'Short Deck · Turbo',
    prizeLabel: '1st: 50%  ·  2nd: 30%  ·  3rd: 20%',
    variant: 'short_deck_holdem',
    capacityMax: 6,
    scheduleIntervalMin: 50,
    scheduleOffsetMin: 23,
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
    emoji: '💎',
    format: 'Short Deck · Deep Stack VIP',
    prizeLabel: '1st: 50%  ·  2nd: 30%  ·  3rd: 20%',
    variant: 'short_deck_holdem',
    capacityMax: 6,
    scheduleIntervalMin: 70,
    scheduleOffsetMin: 41,
  },
};

export function getPrizePool(config: TournamentConfig): number {
  return config.numPlayers * config.buyIn;
}

export const TEXAS_TOURNAMENTS: TournamentType[] = ['beginner', 'sitandgo', 'turbo', 'highroller'];
export const SHORT_DECK_TOURNAMENTS: TournamentType[] = ['sd_lounge', 'sd_showdown', 'sd_rush', 'sd_royal'];
export const ALL_TOURNAMENTS: TournamentType[] = [...TEXAS_TOURNAMENTS, ...SHORT_DECK_TOURNAMENTS];
