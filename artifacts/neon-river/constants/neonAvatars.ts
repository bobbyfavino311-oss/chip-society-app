// ─── CHIP SOCIETY — 15 Neon Symbol Avatars (Phase 1) ─────────────────────────
// Programmatic SVG icons. No PNGs. Always renders.
// IDs 1-15 map to NeonAvatarSymbol.tsx icon components.

export type NeonRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export interface NeonAvatar {
  id: number;
  name: string;
  rarity: NeonRarity;
  unlockXP: number;
  unlockCondition: string;
  color: string;
  bgColor: string;
}

export const NEON_RARITY_COLORS: Record<NeonRarity, string> = {
  COMMON:    '#00d4ff',
  RARE:      '#8b5cf6',
  EPIC:      '#ff0090',
  LEGENDARY: '#ffd700',
};

export const NEON_RARITY_GLOW: Record<NeonRarity, string> = {
  COMMON:    'rgba(0,212,255,0.30)',
  RARE:      'rgba(139,92,246,0.45)',
  EPIC:      'rgba(255,0,144,0.55)',
  LEGENDARY: 'rgba(255,215,0,0.75)',
};

export const NEON_RARITY_BORDER: Record<NeonRarity, number> = {
  COMMON: 1.5, RARE: 2, EPIC: 2, LEGENDARY: 2.5,
};

export const NEON_AVATARS: NeonAvatar[] = [
  // ── COMMON (1–4) — unlocked from the start ───────────────────────────────────
  { id: 1,  name: 'MARTINI',   rarity: 'COMMON',    unlockXP: 0,      unlockCondition: '', color: '#00d4ff', bgColor: '#001822' },
  { id: 2,  name: 'PALM',      rarity: 'COMMON',    unlockXP: 0,      unlockCondition: '', color: '#ff0090', bgColor: '#1a0012' },
  { id: 3,  name: 'DICE',      rarity: 'COMMON',    unlockXP: 0,      unlockCondition: '', color: '#8b5cf6', bgColor: '#0e0018' },
  { id: 4,  name: 'CASSETTE',  rarity: 'COMMON',    unlockXP: 0,      unlockCondition: '', color: '#00d4ff', bgColor: '#001822' },
  // ── RARE (5–9) ────────────────────────────────────────────────────────────────
  { id: 5,  name: 'SATURN',    rarity: 'RARE',      unlockXP: 5000,   unlockCondition: 'Reach 5,000 XP',   color: '#a855f7', bgColor: '#0f001e' },
  { id: 6,  name: 'VINYL',     rarity: 'RARE',      unlockXP: 10000,  unlockCondition: 'Reach 10,000 XP',  color: '#ff1a6e', bgColor: '#1a000e' },
  { id: 7,  name: 'CHERRY',    rarity: 'RARE',      unlockXP: 16000,  unlockCondition: 'Reach 16,000 XP',  color: '#ff3344', bgColor: '#1a0008' },
  { id: 8,  name: 'FLAMINGO',  rarity: 'RARE',      unlockXP: 22000,  unlockCondition: 'Reach 22,000 XP',  color: '#ff69b4', bgColor: '#1a000f' },
  { id: 9,  name: 'SUNSET',    rarity: 'RARE',      unlockXP: 30000,  unlockCondition: 'Reach 30,000 XP',  color: '#ff6b35', bgColor: '#1a0600' },
  // ── EPIC (10–13) ──────────────────────────────────────────────────────────────
  { id: 10, name: 'ACE',       rarity: 'EPIC',      unlockXP: 50000,  unlockCondition: 'Reach 50,000 XP',  color: '#ffd700', bgColor: '#1a1100' },
  { id: 11, name: 'HOURGLASS', rarity: 'EPIC',      unlockXP: 70000,  unlockCondition: 'Reach 70,000 XP',  color: '#bf5fff', bgColor: '#120020' },
  { id: 12, name: 'DRAGON',    rarity: 'EPIC',      unlockXP: 100000, unlockCondition: 'Reach 100,000 XP', color: '#00ff88', bgColor: '#001a0a' },
  { id: 13, name: 'CHIP',      rarity: 'EPIC',      unlockXP: 130000, unlockCondition: 'Reach 130,000 XP', color: '#bf5fff', bgColor: '#120020' },
  // ── LEGENDARY (14–15) ─────────────────────────────────────────────────────────
  { id: 14, name: 'CHAMPAGNE', rarity: 'LEGENDARY', unlockXP: 200000, unlockCondition: 'Reach 200,000 XP', color: '#ffaa00', bgColor: '#1a0d00' },
  { id: 15, name: 'MOON',      rarity: 'LEGENDARY', unlockXP: 300000, unlockCondition: 'Reach 300,000 XP', color: '#a855f7', bgColor: '#0f001e' },
];

/** Returns a valid NeonAvatar, always clamped to IDs 1-15. */
export function getNeonAvatar(id: number): NeonAvatar {
  const safe = Math.min(15, Math.max(1, Math.round(id || 1)));
  return NEON_AVATARS.find(a => a.id === safe) ?? NEON_AVATARS[0];
}

export function isNeonAvatarUnlocked(_avatar: NeonAvatar, _xp: number): boolean {
  return true; // XP gating will be re-enabled in a later phase
}

export const COMMON_AVATARS  = NEON_AVATARS.filter(a => a.rarity === 'COMMON');
export const STARTER_AVATARS = COMMON_AVATARS;
