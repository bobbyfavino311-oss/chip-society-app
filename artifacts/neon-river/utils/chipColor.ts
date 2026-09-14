/** Returns the neon color for a chip balance amount */
export function getChipColor(chips: number): string {
  if (chips < 5_000)  return '#ff4444'; // critical red
  if (chips < 30_000) return '#ffd700'; // caution yellow
  return '#00d4aa';                     // healthy green
}

/** Exact chip formatter — always shows full value with commas */
export function formatChips(n: number): string {
  return n.toLocaleString('en-US');
}

/** Compact chip formatter for constrained UI surfaces (for example, 3.7B). */
export function formatCompactChips(n: number): string {
  if (!Number.isFinite(n)) return String(n);

  const sign = n < 0 ? '-' : '';
  const value = Math.abs(n);
  const formatValue = (divisor: number, suffix: string): string => {
    const scaled = value / divisor;
    const rounded = Number(scaled.toFixed(1));
    return `${sign}${rounded}${suffix}`;
  };

  // Promote values that round to 1000 into the next suffix.
  if (value >= 999_950_000) return formatValue(1_000_000_000, 'B');
  if (value >= 999_950) return formatValue(1_000_000, 'M');
  if (value >= 1_000) return formatValue(1_000, 'K');
  return `${sign}${value}`;
}

/** Returns the label tier for accessibility / display */
export function getChipTier(chips: number): 'critical' | 'low' | 'healthy' {
  if (chips < 5_000)  return 'critical';
  if (chips < 30_000) return 'low';
  return 'healthy';
}
