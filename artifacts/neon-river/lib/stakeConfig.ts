export type StakeTierKey =
  | 'starter'
  | 'micro'
  | 'low'
  | 'standard'
  | 'highroller'
  | 'vip'
  | 'elite'
  | 'elite_plus';

export interface StakeTier {
  key:         StakeTierKey;
  label:       string;
  sublabel:    string;
  description: string;
  smallBlind:  number;
  bigBlind:    number;
  ante:        number;   // = smallBlind; used by casino games for min bet sizing
  minBuyIn:    number;
  maxBuyIn:    number;
  color:       string;
}

export const STAKE_TIERS: StakeTier[] = [
  {
    key: 'starter',    label: 'STARTER',     sublabel: 'New Players',
    description: 'Perfect for new players building their bankroll.',
    smallBlind:   1_000, bigBlind:   2_000, ante:   1_000,
    minBuyIn:    25_000, maxBuyIn:  50_000, color: '#8899bb',
  },
  {
    key: 'micro',      label: 'MICRO',       sublabel: 'Entry Level',
    description: 'Beginner cash games.',
    smallBlind:   5_000, bigBlind:  10_000, ante:   5_000,
    minBuyIn:   100_000, maxBuyIn: 250_000, color: '#00e887',
  },
  {
    key: 'low',        label: 'LOW STAKES',  sublabel: 'Casual Play',
    description: 'Casual everyday action.',
    smallBlind:  10_000, bigBlind:  20_000, ante:  10_000,
    minBuyIn:   250_000, maxBuyIn: 500_000, color: '#00d4ff',
  },
  {
    key: 'standard',   label: 'STANDARD',    sublabel: 'Regular Tables',
    description: 'Balanced gameplay.',
    smallBlind:  25_000, bigBlind:  50_000, ante:  25_000,
    minBuyIn:   500_000, maxBuyIn: 1_000_000, color: '#00ff88',
  },
  {
    key: 'highroller', label: 'HIGH ROLLER', sublabel: 'Experienced Players',
    description: 'For experienced players.',
    smallBlind:  50_000, bigBlind: 100_000, ante:  50_000,
    minBuyIn: 1_000_000, maxBuyIn: 2_000_000, color: '#ffd700',
  },
  {
    key: 'vip',        label: 'VIP',         sublabel: 'Premium Tables',
    description: 'Premium tables.',
    smallBlind: 100_000, bigBlind: 200_000, ante: 100_000,
    minBuyIn: 2_000_000, maxBuyIn: 5_000_000, color: '#ff0090',
  },
  {
    key: 'elite',      label: 'ELITE',       sublabel: 'High Bankroll',
    description: 'High bankroll games.',
    smallBlind: 250_000, bigBlind: 500_000, ante: 250_000,
    minBuyIn:  5_000_000, maxBuyIn: 10_000_000, color: '#bf5fff',
  },
  {
    key: 'elite_plus', label: 'ELITE+',      sublabel: 'Highest Stakes',
    description: 'Highest public stakes.',
    smallBlind: 500_000, bigBlind: 1_000_000, ante: 500_000,
    minBuyIn: 10_000_000, maxBuyIn: 20_000_000, color: '#ffd700',
  },
];

function _fmtVal(v: number): string {
  return v % 1 === 0 ? v.toFixed(0) : v.toFixed(1);
}
export function fmtBankroll(n: number): string {
  if (n >= 1_000_000_000) return `${_fmtVal(n / 1_000_000_000)}B`;
  if (n >= 1_000_000)     return `${_fmtVal(n / 1_000_000)}M`;
  if (n >= 1_000)         return `${_fmtVal(n / 1_000)}K`;
  return String(n);
}
