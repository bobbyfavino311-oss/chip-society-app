// ─── Casino Table Limits ───────────────────────────────────────────────────────
// Separate from poker stake tiers. Casino games never use blinds.
// All casino games read minBet / maxBet / minBuyIn from this config only.

export type CasinoTableKey =
  | 'starter_casino'
  | 'casual_casino'
  | 'standard_casino'
  | 'highroller_casino'
  | 'vip_casino'
  | 'elite_casino';

export interface CasinoTableLimit {
  key:         CasinoTableKey;
  label:       string;
  description: string;
  minBuyIn:    number;
  maxBuyIn:    number;
  minBet:      number;
  maxBet:      number;
  color:       string;
}

export const CASINO_TABLE_LIMITS: CasinoTableLimit[] = [
  {
    key: 'starter_casino',    label: 'STARTER',     color: '#8899bb',
    description: 'Learn the games at low stakes.',
    minBuyIn:    25_000, maxBuyIn:   100_000,
    minBet:       1_000, maxBet:      10_000,
  },
  {
    key: 'casual_casino',     label: 'CASUAL',      color: '#00e887',
    description: 'Casual play with comfortable limits.',
    minBuyIn:   100_000, maxBuyIn:   500_000,
    minBet:       5_000, maxBet:      50_000,
  },
  {
    key: 'standard_casino',   label: 'STANDARD',    color: '#00d4ff',
    description: 'Standard table action.',
    minBuyIn:   500_000, maxBuyIn: 2_000_000,
    minBet:      10_000, maxBet:     100_000,
  },
  {
    key: 'highroller_casino', label: 'HIGH ROLLER', color: '#ffd700',
    description: 'For experienced high-stakes players.',
    minBuyIn: 2_000_000, maxBuyIn: 10_000_000,
    minBet:      50_000, maxBet:     500_000,
  },
  {
    key: 'vip_casino',        label: 'VIP',         color: '#ff0090',
    description: 'Premium tables with serious limits.',
    minBuyIn: 10_000_000, maxBuyIn: 50_000_000,
    minBet:     100_000,  maxBet:   1_000_000,
  },
  {
    key: 'elite_casino',      label: 'ELITE',       color: '#bf5fff',
    description: 'The highest stakes in the house.',
    minBuyIn: 50_000_000, maxBuyIn: 100_000_000,
    minBet:      250_000, maxBet:     2_500_000,
  },
];

export function fmtCasino(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

/**
 * Returns 5 bonus-bet steps scaled to this table's limits.
 * [0, 1×min, 2×min, 5×min, max]
 * Keeps side-bet options proportional to the chosen table size.
 */
export function buildBonusSteps(limit: CasinoTableLimit): [0, number, number, number, number] {
  const { minBet, maxBet } = limit;
  return [0, minBet, minBet * 2, minBet * 5, maxBet];
}
