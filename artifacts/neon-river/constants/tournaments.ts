export type TournamentType = 'beginner' | 'sitandgo' | 'turbo' | 'highroller';

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
  },
};

export function getPrizePool(config: TournamentConfig): number {
  return config.numPlayers * config.buyIn;
}
