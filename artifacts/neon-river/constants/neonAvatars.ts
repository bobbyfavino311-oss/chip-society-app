// ─── CHIP SOCIETY — 30 Collectible Scene Avatars ─────────────────────────────
// IDs 1-15: original set  |  IDs 16-30: premium vaporwave expansion

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
  { id: 1,  name: 'MARTINI',        rarity: 'COMMON',    unlockXP: 0,      unlockCondition: '',                  color: '#00d4ff', bgColor: '#001822' },
  { id: 2,  name: 'PALM',           rarity: 'COMMON',    unlockXP: 0,      unlockCondition: '',                  color: '#ff0090', bgColor: '#1a0012' },
  { id: 3,  name: 'DICE',           rarity: 'COMMON',    unlockXP: 0,      unlockCondition: '',                  color: '#8b5cf6', bgColor: '#0e0018' },
  { id: 4,  name: 'CASSETTE',       rarity: 'COMMON',    unlockXP: 0,      unlockCondition: '',                  color: '#00d4ff', bgColor: '#001822' },
  // ── RARE (5–9) ────────────────────────────────────────────────────────────────
  { id: 5,  name: 'SATURN',         rarity: 'RARE',      unlockXP: 5000,   unlockCondition: 'Reach 5,000 XP',   color: '#a855f7', bgColor: '#0f001e' },
  { id: 6,  name: 'VINYL',          rarity: 'RARE',      unlockXP: 10000,  unlockCondition: 'Reach 10,000 XP',  color: '#ff1a6e', bgColor: '#1a000e' },
  { id: 7,  name: 'CHERRY',         rarity: 'RARE',      unlockXP: 16000,  unlockCondition: 'Reach 16,000 XP',  color: '#ff3344', bgColor: '#1a0008' },
  { id: 8,  name: 'FLAMINGO',       rarity: 'RARE',      unlockXP: 22000,  unlockCondition: 'Reach 22,000 XP',  color: '#ff69b4', bgColor: '#1a000f' },
  { id: 9,  name: 'SUNSET',         rarity: 'RARE',      unlockXP: 30000,  unlockCondition: 'Reach 30,000 XP',  color: '#ff6b35', bgColor: '#1a0600' },
  // ── EPIC (10–13) ──────────────────────────────────────────────────────────────
  { id: 10, name: 'ACE',            rarity: 'EPIC',      unlockXP: 50000,  unlockCondition: 'Reach 50,000 XP',  color: '#ffd700', bgColor: '#1a1100' },
  { id: 11, name: 'HOURGLASS',      rarity: 'EPIC',      unlockXP: 70000,  unlockCondition: 'Reach 70,000 XP',  color: '#bf5fff', bgColor: '#120020' },
  { id: 12, name: 'DRAGON',         rarity: 'EPIC',      unlockXP: 100000, unlockCondition: 'Reach 100,000 XP', color: '#00ff88', bgColor: '#001a0a' },
  { id: 13, name: 'CHIP',           rarity: 'EPIC',      unlockXP: 130000, unlockCondition: 'Reach 130,000 XP', color: '#bf5fff', bgColor: '#120020' },
  // ── LEGENDARY (14–15) ─────────────────────────────────────────────────────────
  { id: 14, name: 'CHAMPAGNE',      rarity: 'LEGENDARY', unlockXP: 200000, unlockCondition: 'Reach 200,000 XP', color: '#ffaa00', bgColor: '#1a0d00' },
  { id: 15, name: 'MOON',           rarity: 'LEGENDARY', unlockXP: 300000, unlockCondition: 'Reach 300,000 XP', color: '#a855f7', bgColor: '#0f001e' },

  // ── COMMON expansion (16–18) ──────────────────────────────────────────────────
  { id: 16, name: 'YACHT',          rarity: 'COMMON',    unlockXP: 0,      unlockCondition: '',                  color: '#00d4ff', bgColor: '#001422' },
  { id: 17, name: 'VICE SKYLINE',   rarity: 'COMMON',    unlockXP: 0,      unlockCondition: '',                  color: '#ff0090', bgColor: '#12001a' },
  { id: 18, name: 'PALM PARADISE',  rarity: 'COMMON',    unlockXP: 0,      unlockCondition: '',                  color: '#ff6b35', bgColor: '#1a0800' },
  // ── RARE expansion (19–22) ────────────────────────────────────────────────────
  { id: 19, name: 'FERRARI',        rarity: 'RARE',      unlockXP: 8000,   unlockCondition: 'Reach 8,000 XP',   color: '#ff1a1a', bgColor: '#1a0000' },
  { id: 20, name: 'OCEAN DRIVE',    rarity: 'RARE',      unlockXP: 14000,  unlockCondition: 'Reach 14,000 XP',  color: '#00d4ff', bgColor: '#001422' },
  { id: 21, name: 'CONVERTIBLE',    rarity: 'RARE',      unlockXP: 20000,  unlockCondition: 'Reach 20,000 XP',  color: '#ff6b35', bgColor: '#1a0600' },
  { id: 22, name: 'SYNTHWAVE MOON', rarity: 'RARE',      unlockXP: 28000,  unlockCondition: 'Reach 28,000 XP',  color: '#bf5fff', bgColor: '#0f001e' },
  // ── EPIC expansion (23–27) ────────────────────────────────────────────────────
  { id: 23, name: 'PENTHOUSE',      rarity: 'EPIC',      unlockXP: 45000,  unlockCondition: 'Reach 45,000 XP',  color: '#a855f7', bgColor: '#0f001e' },
  { id: 24, name: 'TIGER',          rarity: 'EPIC',      unlockXP: 60000,  unlockCondition: 'Reach 60,000 XP',  color: '#00d4ff', bgColor: '#001422' },
  { id: 25, name: 'ROYAL FLUSH',    rarity: 'EPIC',      unlockXP: 80000,  unlockCondition: 'Reach 80,000 XP',  color: '#ffd700', bgColor: '#1a1100' },
  { id: 26, name: 'MILLION POT',    rarity: 'EPIC',      unlockXP: 110000, unlockCondition: 'Reach 110,000 XP', color: '#bf5fff', bgColor: '#120020' },
  { id: 27, name: 'ROULETTE',       rarity: 'EPIC',      unlockXP: 140000, unlockCondition: 'Reach 140,000 XP', color: '#ff0090', bgColor: '#1a0012' },
  // ── LEGENDARY expansion (28–30) ───────────────────────────────────────────────
  { id: 28, name: 'CASINO CROWN',   rarity: 'LEGENDARY', unlockXP: 175000, unlockCondition: 'Reach 175,000 XP', color: '#ffd700', bgColor: '#1a1100' },
  { id: 29, name: 'POKER KING',     rarity: 'LEGENDARY', unlockXP: 250000, unlockCondition: 'Reach 250,000 XP', color: '#ffaa00', bgColor: '#1a0d00' },
  { id: 30, name: 'MIDNIGHT MIRAGE',rarity: 'LEGENDARY', unlockXP: 400000, unlockCondition: 'Reach 400,000 XP', color: '#a855f7', bgColor: '#0f001e' },
];

/** Returns a valid NeonAvatar, always clamped to IDs 1-30. */
export function getNeonAvatar(id: number): NeonAvatar {
  const safe = Math.min(30, Math.max(1, Math.round(id || 1)));
  return NEON_AVATARS.find(a => a.id === safe) ?? NEON_AVATARS[0];
}

export function isNeonAvatarUnlocked(_avatar: NeonAvatar, _xp: number): boolean {
  return true; // XP gating will be re-enabled in a later phase
}

export const COMMON_AVATARS  = NEON_AVATARS.filter(a => a.rarity === 'COMMON');
export const STARTER_AVATARS = COMMON_AVATARS;
