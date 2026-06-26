export type StakeTierKey = 'micro' | 'low' | 'standard' | 'highroller' | 'vip' | 'elite' | 'elite_plus';

export interface StakeTier {
  key:         StakeTierKey;
  label:       string;
  sublabel:    string;
  minBankroll: number;
  ante:        number;
  color:       string;
}

export const STAKE_TIERS: StakeTier[] = [
  {
    key: 'micro', label: 'MICRO', sublabel: 'Entry Level',
    minBankroll:  25_000, ante:   5_000, color: '#8899bb',
  },
  {
    key: 'low', label: 'LOW STAKES', sublabel: 'Casual Play',
    minBankroll: 100_000, ante:  10_000, color: '#00d4ff',
  },
  {
    key: 'standard', label: 'STANDARD', sublabel: 'Regular Tables',
    minBankroll: 500_000, ante:  25_000, color: '#00ff88',
  },
  {
    key: 'highroller', label: 'HIGH ROLLER', sublabel: 'Serious Money',
    minBankroll: 1_000_000, ante: 50_000, color: '#ffd700',
  },
  {
    key: 'vip', label: 'VIP', sublabel: 'Elite Access',
    minBankroll: 5_000_000, ante: 100_000, color: '#ff0090',
  },
  {
    key: 'elite', label: 'ELITE', sublabel: 'Legends Only',
    minBankroll: 25_000_000, ante: 250_000, color: '#bf5fff',
  },
  {
    key: 'elite_plus', label: 'ELITE+', sublabel: 'Ultra High Stakes',
    minBankroll: 50_000_000, ante: 500_000, color: '#ffd700',
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
