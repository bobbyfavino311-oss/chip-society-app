/** Returns the neon color for a chip balance amount */
export function getChipColor(chips: number): string {
  if (chips < 5_000)  return '#ff4444'; // critical red
  if (chips < 30_000) return '#ffd700'; // caution yellow
  return '#00d4aa';                     // healthy green
}

/** Compact chip formatter */
export function formatChips(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

/** Returns the label tier for accessibility / display */
export function getChipTier(chips: number): 'critical' | 'low' | 'healthy' {
  if (chips < 5_000)  return 'critical';
  if (chips < 30_000) return 'low';
  return 'healthy';
}
