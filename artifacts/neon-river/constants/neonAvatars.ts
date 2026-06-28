// ─── CHIP SOCIETY — Collectible Scene Avatars ────────────────────────────────
// IDs 1-9: free from the start  |  all others unlock by level

export type NeonRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export interface NeonAvatar {
  id: number;
  name: string;
  rarity: NeonRarity;
  unlockLevel: number;   // 0 = free; >0 = level required
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
  // ── FREE STARTERS (1–9) — first 9 always unlocked ────────────────────────
  { id: 1,  name: 'MARTINI',        rarity: 'COMMON',    unlockLevel: 0,   unlockCondition: 'Free starter avatar',     color: '#00d4ff', bgColor: '#001822' },
  { id: 2,  name: 'PALM',           rarity: 'COMMON',    unlockLevel: 0,   unlockCondition: 'Free starter avatar',     color: '#ff0090', bgColor: '#1a0012' },
  { id: 3,  name: 'DICE',           rarity: 'COMMON',    unlockLevel: 0,   unlockCondition: 'Free starter avatar',     color: '#8b5cf6', bgColor: '#0e0018' },
  { id: 4,  name: 'CASSETTE',       rarity: 'COMMON',    unlockLevel: 0,   unlockCondition: 'Free starter avatar',     color: '#00d4ff', bgColor: '#001822' },
  { id: 5,  name: 'SATURN',         rarity: 'RARE',      unlockLevel: 0,   unlockCondition: 'Free starter avatar',     color: '#a855f7', bgColor: '#0f001e' },
  { id: 6,  name: 'VINYL',          rarity: 'RARE',      unlockLevel: 0,   unlockCondition: 'Free starter avatar',     color: '#ff1a6e', bgColor: '#1a000e' },
  { id: 7,  name: 'CHERRY',         rarity: 'RARE',      unlockLevel: 0,   unlockCondition: 'Free starter avatar',     color: '#ff3344', bgColor: '#1a0008' },
  { id: 8,  name: 'FLAMINGO',       rarity: 'RARE',      unlockLevel: 0,   unlockCondition: 'Free starter avatar',     color: '#ff69b4', bgColor: '#1a000f' },
  { id: 9,  name: 'SUNSET',         rarity: 'RARE',      unlockLevel: 0,   unlockCondition: 'Free starter avatar',     color: '#ff6b35', bgColor: '#1a0600' },

  // ── LEVEL-GATED — unlocks every ~5-10 levels through progression ─────────
  { id: 16, name: 'YACHT',          rarity: 'COMMON',    unlockLevel: 10,  unlockCondition: 'Reach Level 10',          color: '#00d4ff', bgColor: '#001422' },
  { id: 17, name: 'VICE SKYLINE',   rarity: 'COMMON',    unlockLevel: 12,  unlockCondition: 'Reach Level 12',          color: '#ff0090', bgColor: '#12001a' },
  { id: 18, name: 'PALM PARADISE',  rarity: 'COMMON',    unlockLevel: 15,  unlockCondition: 'Reach Level 15',          color: '#ff6b35', bgColor: '#1a0800' },
  { id: 31, name: 'BRASS KNUCKLES', rarity: 'COMMON',    unlockLevel: 18,  unlockCondition: 'Reach Level 18',          color: '#00d4ff', bgColor: '#001822' },
  { id: 49, name: 'SPRAY CAN',      rarity: 'COMMON',    unlockLevel: 20,  unlockCondition: 'Reach Level 20',          color: '#ff0090', bgColor: '#1a0012' },

  { id: 19, name: 'SPORTS CAR',     rarity: 'RARE',      unlockLevel: 22,  unlockCondition: 'Reach Level 22',          color: '#ff1a1a', bgColor: '#1a0000' },
  { id: 66, name: 'JACK OF SPADES', rarity: 'COMMON',    unlockLevel: 25,  unlockCondition: 'Reach Level 25',          color: '#00d4ff', bgColor: '#001422' },
  { id: 67, name: 'JACK OF HEARTS', rarity: 'COMMON',    unlockLevel: 27,  unlockCondition: 'Reach Level 27',          color: '#ff0090', bgColor: '#1a0012' },
  { id: 68, name: 'JACK OF DIAMONDS',rarity: 'COMMON',   unlockLevel: 29,  unlockCondition: 'Reach Level 29',          color: '#ffd700', bgColor: '#1a1100' },
  { id: 69, name: 'JACK OF CLUBS',  rarity: 'COMMON',    unlockLevel: 30,  unlockCondition: 'Reach Level 30',          color: '#00ff88', bgColor: '#001a0a' },

  { id: 20, name: 'OCEAN DRIVE',    rarity: 'RARE',      unlockLevel: 33,  unlockCondition: 'Reach Level 33',          color: '#00d4ff', bgColor: '#001422' },
  { id: 51, name: 'RADIO DEVICE',   rarity: 'RARE',      unlockLevel: 35,  unlockCondition: 'Reach Level 35',          color: '#ffd700', bgColor: '#1a1100' },
  { id: 40, name: 'COMPACT SMG',    rarity: 'RARE',      unlockLevel: 38,  unlockCondition: 'Reach Level 38',          color: '#ff0090', bgColor: '#1a0012' },
  { id: 21, name: 'CONVERTIBLE',    rarity: 'RARE',      unlockLevel: 40,  unlockCondition: 'Reach Level 40',          color: '#ff6b35', bgColor: '#1a0600' },
  { id: 37, name: 'COMPACT PISTOL', rarity: 'RARE',      unlockLevel: 43,  unlockCondition: 'Reach Level 43',          color: '#00d4ff', bgColor: '#001422' },
  { id: 46, name: 'FLASHBANG',      rarity: 'RARE',      unlockLevel: 45,  unlockCondition: 'Reach Level 45',          color: '#00d4ff', bgColor: '#001422' },
  { id: 22, name: 'SYNTHWAVE MOON', rarity: 'RARE',      unlockLevel: 48,  unlockCondition: 'Reach Level 48',          color: '#bf5fff', bgColor: '#0f001e' },
  { id: 38, name: 'TACTICAL PISTOL',rarity: 'RARE',      unlockLevel: 50,  unlockCondition: 'Reach Level 50',          color: '#8b5cf6', bgColor: '#0e0018' },

  { id: 58, name: 'KING OF SPADES', rarity: 'RARE',      unlockLevel: 55,  unlockCondition: 'Reach Level 55',          color: '#8b5cf6', bgColor: '#0e0018' },
  { id: 59, name: 'KING OF HEARTS', rarity: 'RARE',      unlockLevel: 58,  unlockCondition: 'Reach Level 58',          color: '#ff0090', bgColor: '#1a0012' },
  { id: 60, name: 'KING OF DIAMONDS',rarity: 'RARE',     unlockLevel: 60,  unlockCondition: 'Reach Level 60',          color: '#ff8800', bgColor: '#1a0900' },
  { id: 61, name: 'KING OF CLUBS',  rarity: 'RARE',      unlockLevel: 63,  unlockCondition: 'Reach Level 63',          color: '#00d4ff', bgColor: '#001822' },
  { id: 62, name: 'QUEEN OF SPADES',rarity: 'RARE',      unlockLevel: 65,  unlockCondition: 'Reach Level 65',          color: '#bf5fff', bgColor: '#120020' },
  { id: 63, name: 'QUEEN OF HEARTS',rarity: 'RARE',      unlockLevel: 68,  unlockCondition: 'Reach Level 68',          color: '#ff69b4', bgColor: '#1a000f' },
  { id: 64, name: 'QUEEN OF DIAMONDS',rarity: 'RARE',    unlockLevel: 70,  unlockCondition: 'Reach Level 70',          color: '#ff6b35', bgColor: '#1a0600' },
  { id: 65, name: 'QUEEN OF CLUBS', rarity: 'RARE',      unlockLevel: 73,  unlockCondition: 'Reach Level 73',          color: '#00d4ff', bgColor: '#001822' },

  { id: 10, name: 'ACE',            rarity: 'EPIC',      unlockLevel: 75,  unlockCondition: 'Reach Level 75',          color: '#ffd700', bgColor: '#1a1100' },
  { id: 23, name: 'PENTHOUSE',      rarity: 'EPIC',      unlockLevel: 80,  unlockCondition: 'Reach Level 80',          color: '#a855f7', bgColor: '#0f001e' },
  { id: 39, name: 'SMG',            rarity: 'EPIC',      unlockLevel: 85,  unlockCondition: 'Reach Level 85',          color: '#00d4ff', bgColor: '#001422' },
  { id: 45, name: 'FRAG GRENADE',   rarity: 'EPIC',      unlockLevel: 88,  unlockCondition: 'Reach Level 88',          color: '#00ff88', bgColor: '#001a0a' },
  { id: 24, name: 'TIGER',          rarity: 'EPIC',      unlockLevel: 90,  unlockCondition: 'Reach Level 90',          color: '#00d4ff', bgColor: '#001422' },
  { id: 54, name: 'ACE OF SPADES',  rarity: 'EPIC',      unlockLevel: 93,  unlockCondition: 'Reach Level 93',          color: '#00d4ff', bgColor: '#001822' },
  { id: 55, name: 'ACE OF HEARTS',  rarity: 'EPIC',      unlockLevel: 95,  unlockCondition: 'Reach Level 95',          color: '#ff0090', bgColor: '#1a0012' },
  { id: 56, name: 'ACE OF DIAMONDS',rarity: 'EPIC',      unlockLevel: 98,  unlockCondition: 'Reach Level 98',          color: '#ff4444', bgColor: '#1a0008' },
  { id: 57, name: 'ACE OF CLUBS',   rarity: 'EPIC',      unlockLevel: 100, unlockCondition: 'Reach Level 100',         color: '#00ff88', bgColor: '#001a0a' },
  { id: 41, name: 'ASSAULT RIFLE',  rarity: 'EPIC',      unlockLevel: 105, unlockCondition: 'Reach Level 105',         color: '#00ff88', bgColor: '#001a0a' },
  { id: 11, name: 'HOURGLASS',      rarity: 'EPIC',      unlockLevel: 110, unlockCondition: 'Reach Level 110',         color: '#bf5fff', bgColor: '#120020' },
  { id: 25, name: 'ROYAL FLUSH',    rarity: 'EPIC',      unlockLevel: 115, unlockCondition: 'Reach Level 115',         color: '#ffd700', bgColor: '#1a1100' },
  { id: 42, name: 'AK PLATFORM',    rarity: 'EPIC',      unlockLevel: 120, unlockCondition: 'Reach Level 120',         color: '#ff6b35', bgColor: '#1a0600' },
  { id: 47, name: 'SMOKE GRENADE',  rarity: 'EPIC',      unlockLevel: 125, unlockCondition: 'Reach Level 125',         color: '#bf5fff', bgColor: '#120020' },
  { id: 44, name: 'SNIPER RIFLE',   rarity: 'EPIC',      unlockLevel: 130, unlockCondition: 'Reach Level 130',         color: '#a855f7', bgColor: '#0f001e' },
  { id: 26, name: 'MILLION POT',    rarity: 'EPIC',      unlockLevel: 140, unlockCondition: 'Reach Level 140',         color: '#bf5fff', bgColor: '#120020' },
  { id: 12, name: 'DRAGON',         rarity: 'EPIC',      unlockLevel: 150, unlockCondition: 'Reach Level 150',         color: '#00ff88', bgColor: '#001a0a' },
  { id: 52, name: '80S CAMERA',     rarity: 'EPIC',      unlockLevel: 160, unlockCondition: 'Reach Level 160',         color: '#a855f7', bgColor: '#0f001e' },
  { id: 27, name: 'ROULETTE',       rarity: 'EPIC',      unlockLevel: 170, unlockCondition: 'Reach Level 170',         color: '#ff0090', bgColor: '#1a0012' },
  { id: 13, name: 'CHIP',           rarity: 'EPIC',      unlockLevel: 180, unlockCondition: 'Reach Level 180',         color: '#bf5fff', bgColor: '#120020' },
  { id: 71, name: 'RAZOR BLADE',    rarity: 'EPIC',      unlockLevel: 190, unlockCondition: 'Reach Level 190',         color: '#00d4ff', bgColor: '#001422' },

  { id: 28, name: 'CASINO CROWN',   rarity: 'LEGENDARY', unlockLevel: 200, unlockCondition: 'Reach Level 200',         color: '#ffd700', bgColor: '#1a1100' },
  { id: 14, name: 'CHAMPAGNE',      rarity: 'LEGENDARY', unlockLevel: 225, unlockCondition: 'Reach Level 225',         color: '#ffaa00', bgColor: '#1a0d00' },
  { id: 15, name: 'MOON',           rarity: 'LEGENDARY', unlockLevel: 250, unlockCondition: 'Reach Level 250',         color: '#a855f7', bgColor: '#0f001e' },
  { id: 29, name: 'POKER KING',     rarity: 'LEGENDARY', unlockLevel: 300, unlockCondition: 'Reach Level 300',         color: '#ffaa00', bgColor: '#1a0d00' },
  { id: 70, name: 'JOKER',          rarity: 'LEGENDARY', unlockLevel: 350, unlockCondition: 'Reach Level 350',         color: '#bf5fff', bgColor: '#120020' },
  { id: 30, name: 'MIDNIGHT MIRAGE',rarity: 'LEGENDARY', unlockLevel: 400, unlockCondition: 'Reach Level 400',         color: '#a855f7', bgColor: '#0f001e' },
  { id: 53, name: 'GOLDEN TIKI',    rarity: 'LEGENDARY', unlockLevel: 500, unlockCondition: 'Reach Level 500',         color: '#ffd700', bgColor: '#1a1100' },
];

/** Returns the NeonAvatar for a given id, falling back to id 1. */
export function getNeonAvatar(id: number): NeonAvatar {
  return NEON_AVATARS.find(a => a.id === Math.round(id || 1)) ?? NEON_AVATARS[0]!;
}

/** True if the player's level meets the avatar's unlock requirement. */
export function isNeonAvatarUnlocked(avatar: NeonAvatar, _xp: number, level: number): boolean {
  return level >= (avatar.unlockLevel ?? 0);
}

export const STARTER_AVATARS = NEON_AVATARS.filter(a => a.unlockLevel === 0);
export const COMMON_AVATARS  = NEON_AVATARS.filter(a => a.rarity === 'COMMON');
