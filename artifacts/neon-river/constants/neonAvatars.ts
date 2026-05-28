// ─── CHIP SOCIETY — 30 Neon Symbol Avatars ────────────────────────────────────
// Pure SVG neon icons. No portraits. No faces. No emojis.
// Unlock through XP progression.

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
  COMMON:    '#a0b8cc',
  RARE:      '#4db8ff',
  EPIC:      '#bf5fff',
  LEGENDARY: '#ffd700',
};

export const NEON_RARITY_GLOW: Record<NeonRarity, string> = {
  COMMON:    'rgba(160,184,204,0.35)',
  RARE:      'rgba(77,184,255,0.50)',
  EPIC:      'rgba(191,95,255,0.60)',
  LEGENDARY: 'rgba(255,215,0,0.80)',
};

export const NEON_RARITY_BORDER: Record<NeonRarity, number> = {
  COMMON: 1.5, RARE: 2, EPIC: 2.5, LEGENDARY: 3,
};

export const NEON_AVATARS: NeonAvatar[] = [
  // ── COMMON (1–8) ────────────────────────────────────────────────────────────
  { id: 1,  name: 'MARTINI GLASS',  rarity: 'COMMON',    unlockXP: 0,      unlockCondition: 'Available from the start', color: '#00d4ff', bgColor: '#001822' },
  { id: 2,  name: 'LIGHTNING BOLT', rarity: 'COMMON',    unlockXP: 0,      unlockCondition: 'Available from the start', color: '#4080ff', bgColor: '#000c20' },
  { id: 3,  name: 'POKER CHIP',     rarity: 'COMMON',    unlockXP: 0,      unlockCondition: 'Available from the start', color: '#bf5fff', bgColor: '#120020' },
  { id: 4,  name: 'ACE CARD',       rarity: 'COMMON',    unlockXP: 0,      unlockCondition: 'Available from the start', color: '#ff6b35', bgColor: '#1a0800' },
  { id: 5,  name: 'DICE STACK',     rarity: 'COMMON',    unlockXP: 0,      unlockCondition: 'Available from the start', color: '#8b5cf6', bgColor: '#0e0018' },
  { id: 6,  name: 'MOON PHASE',     rarity: 'COMMON',    unlockXP: 0,      unlockCondition: 'Available from the start', color: '#a855f7', bgColor: '#120020' },
  { id: 7,  name: 'FIRE',           rarity: 'COMMON',    unlockXP: 0,      unlockCondition: 'Available from the start', color: '#ff6600', bgColor: '#1a0700' },
  { id: 8,  name: 'CROWN',          rarity: 'COMMON',    unlockXP: 0,      unlockCondition: 'Available from the start', color: '#ffd700', bgColor: '#1a1100' },

  // ── RARE (9–16) ─────────────────────────────────────────────────────────────
  { id: 9,  name: 'NEON PALM',      rarity: 'RARE',      unlockXP: 5000,   unlockCondition: 'Reach 5,000 XP',  color: '#ff0090', bgColor: '#1a0012' },
  { id: 10, name: 'CASSETTE',       rarity: 'RARE',      unlockXP: 8000,   unlockCondition: 'Reach 8,000 XP',  color: '#00d4ff', bgColor: '#001820' },
  { id: 11, name: 'FLAMINGO',       rarity: 'RARE',      unlockXP: 12000,  unlockCondition: 'Reach 12,000 XP', color: '#ff69b4', bgColor: '#1a000f' },
  { id: 12, name: 'CHAMPAGNE',      rarity: 'RARE',      unlockXP: 16000,  unlockCondition: 'Reach 16,000 XP', color: '#ffd700', bgColor: '#1a1100' },
  { id: 13, name: 'SHARK FIN',      rarity: 'RARE',      unlockXP: 20000,  unlockCondition: 'Reach 20,000 XP', color: '#00c8ff', bgColor: '#001420' },
  { id: 14, name: 'NEON ROSE',      rarity: 'RARE',      unlockXP: 25000,  unlockCondition: 'Reach 25,000 XP', color: '#ff0090', bgColor: '#1a0012' },
  { id: 15, name: 'EIGHT BALL',     rarity: 'RARE',      unlockXP: 30000,  unlockCondition: 'Reach 30,000 XP', color: '#00d4ff', bgColor: '#001420' },
  { id: 16, name: 'ANCHOR',         rarity: 'RARE',      unlockXP: 35000,  unlockCondition: 'Reach 35,000 XP', color: '#4db8ff', bgColor: '#001422' },

  // ── EPIC (17–24) ────────────────────────────────────────────────────────────
  { id: 17, name: 'SUNSET GRID',    rarity: 'EPIC',      unlockXP: 40000,  unlockCondition: 'Reach 40,000 XP',  color: '#ff6b35', bgColor: '#1a0600' },
  { id: 18, name: 'SNAKE',          rarity: 'EPIC',      unlockXP: 50000,  unlockCondition: 'Reach 50,000 XP',  color: '#00ff88', bgColor: '#001a0a' },
  { id: 19, name: 'KATANA',         rarity: 'EPIC',      unlockXP: 60000,  unlockCondition: 'Reach 60,000 XP',  color: '#00d4ff', bgColor: '#001420' },
  { id: 20, name: 'SKULL',          rarity: 'EPIC',      unlockXP: 70000,  unlockCondition: 'Reach 70,000 XP',  color: '#bf5fff', bgColor: '#120020' },
  { id: 21, name: 'SATURN',         rarity: 'EPIC',      unlockXP: 80000,  unlockCondition: 'Reach 80,000 XP',  color: '#a855f7', bgColor: '#0f001e' },
  { id: 22, name: 'VINYL RECORD',   rarity: 'EPIC',      unlockXP: 90000,  unlockCondition: 'Reach 90,000 XP',  color: '#ff0090', bgColor: '#1a0010' },
  { id: 23, name: 'SPORTS CAR',     rarity: 'EPIC',      unlockXP: 100000, unlockCondition: 'Reach 100,000 XP', color: '#00d4ff', bgColor: '#001420' },
  { id: 24, name: 'SCORPION',       rarity: 'EPIC',      unlockXP: 120000, unlockCondition: 'Reach 120,000 XP', color: '#ff0090', bgColor: '#1a0010' },

  // ── LEGENDARY (25–30) ───────────────────────────────────────────────────────
  { id: 25, name: 'DRAGON',         rarity: 'LEGENDARY', unlockXP: 150000, unlockCondition: 'Reach 150,000 XP', color: '#ffd700', bgColor: '#1a1100' },
  { id: 26, name: 'HOURGLASS',      rarity: 'LEGENDARY', unlockXP: 200000, unlockCondition: 'Reach 200,000 XP', color: '#bf5fff', bgColor: '#120020' },
  { id: 27, name: 'STARBURST',      rarity: 'LEGENDARY', unlockXP: 300000, unlockCondition: 'Reach 300,000 XP', color: '#ffd700', bgColor: '#1a1100' },
  { id: 28, name: 'TIGER EYE',      rarity: 'LEGENDARY', unlockXP: 400000, unlockCondition: 'Reach 400,000 XP', color: '#ff8c00', bgColor: '#1a0900' },
  { id: 29, name: 'WOLF HEAD',      rarity: 'LEGENDARY', unlockXP: 500000, unlockCondition: 'Reach 500,000 XP', color: '#00bfff', bgColor: '#001420' },
  { id: 30, name: 'CHERRY',         rarity: 'LEGENDARY', unlockXP: 600000, unlockCondition: 'Reach 600,000 XP', color: '#ff3366', bgColor: '#1a000f' },
];

export function getNeonAvatar(id: number): NeonAvatar {
  return NEON_AVATARS.find(a => a.id === id) ?? NEON_AVATARS[0];
}

export function isNeonAvatarUnlocked(avatar: NeonAvatar, xp: number): boolean {
  return xp >= avatar.unlockXP;
}

export const COMMON_AVATARS  = NEON_AVATARS.filter(a => a.rarity === 'COMMON');
export const STARTER_AVATARS = COMMON_AVATARS; // all 8 commons available from start
