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

/** Returns the label tier for accessibility / display */
export function getChipTier(chips: number): 'critical' | 'low' | 'healthy' {
  if (chips < 5_000)  return 'critical';
  if (chips < 30_000) return 'low';
  return 'healthy';
}
