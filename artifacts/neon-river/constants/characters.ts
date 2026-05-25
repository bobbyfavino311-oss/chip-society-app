// ─── CHIP SOCIETY — 40 Premium Character Portraits ────────────────────────────
// Each character is a fully illustrated SVG portrait:
// face shape, skin tone, hair style & colour, eyes, clothing, accessories.
// NO emoji. NO initials. Real illustrated human characters.

export type Rarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export type FaceShape    = 'oval' | 'square' | 'angular' | 'round' | 'heart';
export type HairStyle    = 'slicked' | 'undercut' | 'curly' | 'mohawk' | 'long' | 'buzz' | 'bald' | 'waves' | 'dreads' | 'ponytail' | 'bob' | 'fauxhawk';
export type EyeStyle     = 'normal' | 'hooded' | 'wide' | 'sharp' | 'almond';
export type FacialHair   = 'none' | 'stubble' | 'beard' | 'mustache' | 'goatee' | 'full_beard';
export type ClothingStyle = 'suit' | 'leather_jacket' | 'turtleneck' | 'hoodie' | 'blazer' | 'open_shirt';
export type AccessoryType = 'glasses' | 'sunglasses' | 'cyberpunk_visor' | 'earring' | 'chain' | 'fedora' | 'snapback' | 'crown' | 'headset';

export interface CharacterVisuals {
  faceShape:     FaceShape;
  skinTone:      string;
  hairStyle:     HairStyle;
  hairColor:     string;
  eyeStyle:      EyeStyle;
  eyeColor:      string;
  facialHair:    FacialHair;
  clothing:      ClothingStyle;
  clothingColor: string;
  accessories:   AccessoryType[];
  neonCast:      string;
}

export interface Character {
  id: number;
  name: string;
  initials: string;
  rarity: Rarity;
  unlockXP: number;
  unlockCondition: string;
  bio: string;
  portraitColors: [string, string, string];
  lightColor: string;
  accentColor: string;
  visuals?: CharacterVisuals;
}

export const RARITY_COLORS: Record<Rarity, string> = {
  COMMON:    '#a0b8cc',
  RARE:      '#bf5fff',
  EPIC:      '#ff6600',
  LEGENDARY: '#ffd700',
};

export const RARITY_GLOW: Record<Rarity, string> = {
  COMMON:    '#a0b8cc40',
  RARE:      '#bf5fff55',
  EPIC:      '#ff660066',
  LEGENDARY: '#ffd70099',
};

export const RARITY_BORDER_WIDTH: Record<Rarity, number> = {
  COMMON: 1.5, RARE: 2, EPIC: 2.5, LEGENDARY: 3,
};

export function getCharacter(id: number): Character {
  return CHARACTERS.find(c => c.id === id) ?? CHARACTERS[0];
}

export function isUnlocked(char: Character, xp: number): boolean {
  return xp >= char.unlockXP;
}

export const CHARACTERS: Character[] = [

  // ── COMMON (1–10) — Grounded, beginner-level, relatable ─────────────────────

  {
    id: 1, name: 'The Rookie', initials: 'RK', rarity: 'COMMON', unlockXP: 0,
    unlockCondition: 'Available from the start',
    bio: 'First night at the table. Heart pounding. Chips stacked. Every legend started here.',
    portraitColors: ['#000d1a', '#001833', '#00274d'],
    lightColor: '#00d4ff', accentColor: '#00d4ff',
    visuals: {
      faceShape: 'oval', skinTone: '#f0b885', hairStyle: 'buzz', hairColor: '#2a1a0a',
      eyeStyle: 'wide', eyeColor: '#5a7ab0', facialHair: 'none',
      clothing: 'hoodie', clothingColor: '#1a1a2e',
      accessories: [], neonCast: '#00d4ff',
    },
  },
  {
    id: 2, name: 'The Bartender', initials: 'BT', rarity: 'COMMON', unlockXP: 0,
    unlockCondition: 'Available from the start',
    bio: 'Seen every whale, every bluff, every breakdown. Now it\'s his turn to play.',
    portraitColors: ['#0d0018', '#1a0030', '#270048'],
    lightColor: '#cc55ff', accentColor: '#bb33ff',
    visuals: {
      faceShape: 'square', skinTone: '#c87840', hairStyle: 'undercut', hairColor: '#1a0f08',
      eyeStyle: 'normal', eyeColor: '#6b4020', facialHair: 'stubble',
      clothing: 'blazer', clothingColor: '#1a1020',
      accessories: [], neonCast: '#cc55ff',
    },
  },
  {
    id: 3, name: 'The Tourist', initials: 'TR', rarity: 'COMMON', unlockXP: 200,
    unlockCondition: 'Play your first hand',
    bio: 'Came for the Vegas nightlife. Stayed for the tables. Leaving with a story.',
    portraitColors: ['#0a0820', '#14133a', '#1e1e54'],
    lightColor: '#8888ff', accentColor: '#7777ee',
    visuals: {
      faceShape: 'round', skinTone: '#f5c99a', hairStyle: 'waves', hairColor: '#6b3a1f',
      eyeStyle: 'normal', eyeColor: '#3a6040', facialHair: 'none',
      clothing: 'open_shirt', clothingColor: '#2a1a3a',
      accessories: ['sunglasses'], neonCast: '#8888ff',
    },
  },
  {
    id: 4, name: 'The Club Kid', initials: 'CK', rarity: 'COMMON', unlockXP: 400,
    unlockCondition: 'Win your first hand',
    bio: 'Nightlife runs through his veins. The poker table is just another dance floor.',
    portraitColors: ['#1a0010', '#330020', '#4c0030'],
    lightColor: '#ff3399', accentColor: '#ff1a8c',
    visuals: {
      faceShape: 'heart', skinTone: '#9a5e2a', hairStyle: 'fauxhawk', hairColor: '#cc0077',
      eyeStyle: 'sharp', eyeColor: '#4060a0', facialHair: 'none',
      clothing: 'leather_jacket', clothingColor: '#0a0a14',
      accessories: ['earring'], neonCast: '#ff3399',
    },
  },
  {
    id: 5, name: 'The College Grinder', initials: 'CG', rarity: 'COMMON', unlockXP: 600,
    unlockCondition: 'Reach 600 XP',
    bio: 'Studied the odds in between lectures. Poker is his real major.',
    portraitColors: ['#001a10', '#003020', '#004530'],
    lightColor: '#00ff88', accentColor: '#00dd77',
    visuals: {
      faceShape: 'oval', skinTone: '#e8b87a', hairStyle: 'curly', hairColor: '#2a1a0a',
      eyeStyle: 'normal', eyeColor: '#3a7060', facialHair: 'none',
      clothing: 'hoodie', clothingColor: '#0f2010',
      accessories: ['snapback'], neonCast: '#00ff88',
    },
  },
  {
    id: 6, name: 'The Sports Fan', initials: 'SF', rarity: 'COMMON', unlockXP: 800,
    unlockCondition: 'Reach 800 XP',
    bio: 'Made his living reading games. Poker is just another sport to master.',
    portraitColors: ['#1a0a00', '#301500', '#452000'],
    lightColor: '#ff9933', accentColor: '#ff8800',
    visuals: {
      faceShape: 'square', skinTone: '#d4956a', hairStyle: 'waves', hairColor: '#3b200f',
      eyeStyle: 'normal', eyeColor: '#6b4020', facialHair: 'stubble',
      clothing: 'blazer', clothingColor: '#1a1000',
      accessories: [], neonCast: '#ff9933',
    },
  },
  {
    id: 7, name: 'The Side Hustler', initials: 'SH', rarity: 'COMMON', unlockXP: 1000,
    unlockCondition: 'Reach level 3',
    bio: 'Low stakes, high hustle. Street-smart instincts built at the table.',
    portraitColors: ['#0c0c0c', '#161616', '#202020'],
    lightColor: '#d0d0d0', accentColor: '#cccccc',
    visuals: {
      faceShape: 'angular', skinTone: '#7a3e18', hairStyle: 'waves', hairColor: '#3b200f',
      eyeStyle: 'hooded', eyeColor: '#6b4020', facialHair: 'goatee',
      clothing: 'leather_jacket', clothingColor: '#0a0a0a',
      accessories: ['chain'], neonCast: '#d0d0d0',
    },
  },
  {
    id: 8, name: 'The Local Regular', initials: 'LR', rarity: 'COMMON', unlockXP: 1200,
    unlockCondition: 'Reach 1 200 XP',
    bio: 'Every casino knows his face. Every dealer knows his tells. He\'s still here.',
    portraitColors: ['#001228', '#001e3d', '#002a52'],
    lightColor: '#4499ff', accentColor: '#3388ff',
    visuals: {
      faceShape: 'round', skinTone: '#c07840', hairStyle: 'slicked', hairColor: '#1a0f08',
      eyeStyle: 'hooded', eyeColor: '#4060a0', facialHair: 'mustache',
      clothing: 'suit', clothingColor: '#0a0a1a',
      accessories: [], neonCast: '#4499ff',
    },
  },
  {
    id: 9, name: 'The Poker Blogger', initials: 'PB', rarity: 'COMMON', unlockXP: 1500,
    unlockCondition: 'Post to the social feed',
    bio: 'Documents every session. Millions of followers watch him grind.',
    portraitColors: ['#001818', '#002828', '#003838'],
    lightColor: '#00e6cc', accentColor: '#00ccbb',
    visuals: {
      faceShape: 'heart', skinTone: '#f0b885', hairStyle: 'undercut', hairColor: '#1a0f08',
      eyeStyle: 'normal', eyeColor: '#4060a0', facialHair: 'none',
      clothing: 'turtleneck', clothingColor: '#002020',
      accessories: ['glasses'], neonCast: '#00e6cc',
    },
  },
  {
    id: 10, name: 'The Community Player', initials: 'CP', rarity: 'COMMON', unlockXP: 2000,
    unlockCondition: 'Play 25 hands',
    bio: 'Part of something bigger. The grind is communal. Every table is family.',
    portraitColors: ['#001020', '#001a33', '#002446'],
    lightColor: '#33bbdd', accentColor: '#22aacc',
    visuals: {
      faceShape: 'oval', skinTone: '#9a5e2a', hairStyle: 'bob', hairColor: '#3b200f',
      eyeStyle: 'almond', eyeColor: '#6b4020', facialHair: 'none',
      clothing: 'blazer', clothingColor: '#001428',
      accessories: ['earring'], neonCast: '#33bbdd',
    },
  },

  // ── RARE (11–20) — Wealthy, stylish, socially known ─────────────────────────

  {
    id: 11, name: 'The Bookie', initials: 'BK', rarity: 'RARE', unlockXP: 5000,
    unlockCondition: 'Win 50 hands',
    bio: 'Knows the spread on every sport. Now he\'s running the action at the felt.',
    portraitColors: ['#0c0c14', '#161620', '#20202c'],
    lightColor: '#9999ff', accentColor: '#8888ee',
    visuals: {
      faceShape: 'angular', skinTone: '#e8b87a', hairStyle: 'slicked', hairColor: '#1a0f08',
      eyeStyle: 'sharp', eyeColor: '#505070', facialHair: 'goatee',
      clothing: 'suit', clothingColor: '#0a0a14',
      accessories: ['glasses'], neonCast: '#9999ff',
    },
  },
  {
    id: 12, name: 'The VIP Hostess', initials: 'VH', rarity: 'RARE', unlockXP: 6000,
    unlockCondition: 'Reach level 10',
    bio: 'Knows every VIP by name. Runs the room before the room runs her.',
    portraitColors: ['#1a0018', '#30002e', '#460044'],
    lightColor: '#ff66cc', accentColor: '#ff33bb',
    visuals: {
      faceShape: 'heart', skinTone: '#d4956a', hairStyle: 'long', hairColor: '#1a0f08',
      eyeStyle: 'almond', eyeColor: '#8b3060', facialHair: 'none',
      clothing: 'blazer', clothingColor: '#1a0010',
      accessories: ['earring', 'chain'], neonCast: '#ff66cc',
    },
  },
  {
    id: 13, name: 'The Crypto Bro', initials: 'CB', rarity: 'RARE', unlockXP: 7000,
    unlockCondition: 'Win 3 games in a row',
    bio: 'Made his first million in digital assets. Now converting them to chips.',
    portraitColors: ['#001028', '#001a3d', '#002452'],
    lightColor: '#00aaff', accentColor: '#0088ff',
    visuals: {
      faceShape: 'square', skinTone: '#f5c99a', hairStyle: 'undercut', hairColor: '#3b200f',
      eyeStyle: 'normal', eyeColor: '#4080c0', facialHair: 'stubble',
      clothing: 'turtleneck', clothingColor: '#001020',
      accessories: ['cyberpunk_visor'], neonCast: '#00aaff',
    },
  },
  {
    id: 14, name: 'The Lounge Owner', initials: 'LO', rarity: 'RARE', unlockXP: 8500,
    unlockCondition: 'Reach 8 500 XP',
    bio: 'Owns the best seat in every room — because it\'s his room.',
    portraitColors: ['#1a0a00', '#2e1600', '#422200'],
    lightColor: '#ffaa44', accentColor: '#ff9900',
    visuals: {
      faceShape: 'oval', skinTone: '#7a3e18', hairStyle: 'waves', hairColor: '#1a0f08',
      eyeStyle: 'hooded', eyeColor: '#6b4020', facialHair: 'beard',
      clothing: 'suit', clothingColor: '#1a0800',
      accessories: ['fedora'], neonCast: '#ffaa44',
    },
  },
  {
    id: 15, name: 'The Yacht Gambler', initials: 'YG', rarity: 'RARE', unlockXP: 10000,
    unlockCondition: 'Accumulate 100 000 chips',
    bio: 'Miami harbor, midnight. Where the real games happen.',
    portraitColors: ['#000e1a', '#001628', '#001e36'],
    lightColor: '#66ccff', accentColor: '#44bbff',
    visuals: {
      faceShape: 'oval', skinTone: '#c87840', hairStyle: 'slicked', hairColor: '#8b5a2b',
      eyeStyle: 'normal', eyeColor: '#3a7060', facialHair: 'stubble',
      clothing: 'open_shirt', clothingColor: '#001428',
      accessories: ['chain', 'sunglasses'], neonCast: '#66ccff',
    },
  },
  {
    id: 16, name: 'The Ex-Athlete', initials: 'EA', rarity: 'RARE', unlockXP: 11500,
    unlockCondition: 'Reach level 15',
    bio: 'Retired from the field. The poker table is the new arena.',
    portraitColors: ['#001808', '#002812', '#00381c'],
    lightColor: '#33ff88', accentColor: '#22ee77',
    visuals: {
      faceShape: 'square', skinTone: '#9a5e2a', hairStyle: 'buzz', hairColor: '#1a0f08',
      eyeStyle: 'wide', eyeColor: '#4060a0', facialHair: 'none',
      clothing: 'blazer', clothingColor: '#001808',
      accessories: [], neonCast: '#33ff88',
    },
  },
  {
    id: 17, name: 'The Poker Streamer', initials: 'PS', rarity: 'RARE', unlockXP: 13000,
    unlockCondition: 'Reach 13 000 XP',
    bio: '200k viewers live every session. The chat is always right behind him.',
    portraitColors: ['#1a001a', '#2d002d', '#400040'],
    lightColor: '#ff55ff', accentColor: '#ee33ee',
    visuals: {
      faceShape: 'round', skinTone: '#f0b885', hairStyle: 'fauxhawk', hairColor: '#cc0077',
      eyeStyle: 'normal', eyeColor: '#5050a0', facialHair: 'none',
      clothing: 'hoodie', clothingColor: '#1a001a',
      accessories: ['headset', 'snapback'], neonCast: '#ff55ff',
    },
  },
  {
    id: 18, name: 'The Miami Hustler', initials: 'MH', rarity: 'RARE', unlockXP: 14500,
    unlockCondition: 'Win 100 hands',
    bio: 'South Beach to Brickell. Every game is a transaction.',
    portraitColors: ['#1a0010', '#2e001c', '#420028'],
    lightColor: '#ff4488', accentColor: '#ff2266',
    visuals: {
      faceShape: 'angular', skinTone: '#d4956a', hairStyle: 'slicked', hairColor: '#1a0f08',
      eyeStyle: 'sharp', eyeColor: '#6b4020', facialHair: 'goatee',
      clothing: 'leather_jacket', clothingColor: '#100008',
      accessories: ['earring', 'chain'], neonCast: '#ff4488',
    },
  },
  {
    id: 19, name: 'The Car Dealer', initials: 'CD', rarity: 'RARE', unlockXP: 16000,
    unlockCondition: 'Reach 16 000 XP',
    bio: 'Sold Ferraris before breakfast. Reads buyers the same way he reads poker tells.',
    portraitColors: ['#0c0c0c', '#181818', '#242424'],
    lightColor: '#cccccc', accentColor: '#bbbbbb',
    visuals: {
      faceShape: 'square', skinTone: '#e8b87a', hairStyle: 'slicked', hairColor: '#1a0f08',
      eyeStyle: 'hooded', eyeColor: '#505050', facialHair: 'mustache',
      clothing: 'suit', clothingColor: '#0a0a0a',
      accessories: ['sunglasses'], neonCast: '#cccccc',
    },
  },
  {
    id: 20, name: 'The Poolside Millionaire', initials: 'PM', rarity: 'RARE', unlockXP: 18000,
    unlockCondition: 'Reach level 20',
    bio: 'Penthouse resort, permanent resident. Every chip is just pocket change.',
    portraitColors: ['#001222', '#001c35', '#002648'],
    lightColor: '#4db8ff', accentColor: '#33aaff',
    visuals: {
      faceShape: 'oval', skinTone: '#c87840', hairStyle: 'waves', hairColor: '#8b5a2b',
      eyeStyle: 'normal', eyeColor: '#3a6080', facialHair: 'stubble',
      clothing: 'open_shirt', clothingColor: '#001222',
      accessories: ['chain'], neonCast: '#4db8ff',
    },
  },

  // ── EPIC (21–30) — Prestigious, intimidating, cinematic ─────────────────────

  {
    id: 21, name: 'The Casino Shark', initials: 'CS', rarity: 'EPIC', unlockXP: 30000,
    unlockCondition: 'Win a tournament',
    bio: 'The apex predator of the felt. Every table goes quiet when he sits down.',
    portraitColors: ['#001020', '#001c38', '#002850'],
    lightColor: '#0099ff', accentColor: '#0077ee',
    visuals: {
      faceShape: 'angular', skinTone: '#e8b87a', hairStyle: 'slicked', hairColor: '#c8c8c8',
      eyeStyle: 'hooded', eyeColor: '#104080', facialHair: 'goatee',
      clothing: 'suit', clothingColor: '#000a18',
      accessories: ['chain', 'sunglasses'], neonCast: '#0099ff',
    },
  },
  {
    id: 22, name: 'The Penthouse Millionaire', initials: 'PM', rarity: 'EPIC', unlockXP: 35000,
    unlockCondition: 'Accumulate 500 000 chips',
    bio: 'The skyline view never gets old. Neither does winning.',
    portraitColors: ['#0a0a14', '#14141e', '#1e1e28'],
    lightColor: '#aaaaff', accentColor: '#9999ff',
    visuals: {
      faceShape: 'square', skinTone: '#f5c99a', hairStyle: 'undercut', hairColor: '#1a0f08',
      eyeStyle: 'normal', eyeColor: '#4460a0', facialHair: 'stubble',
      clothing: 'turtleneck', clothingColor: '#0a0a14',
      accessories: ['glasses'], neonCast: '#aaaaff',
    },
  },
  {
    id: 23, name: 'The Underground King', initials: 'UK', rarity: 'EPIC', unlockXP: 40000,
    unlockCondition: 'Reach level 25',
    bio: 'His game runs below street level. Above the law. Above the table.',
    portraitColors: ['#1a0028', '#2a0040', '#3a0058'],
    lightColor: '#cc44ff', accentColor: '#bb22ee',
    visuals: {
      faceShape: 'round', skinTone: '#7a3e18', hairStyle: 'bald', hairColor: '#000000',
      eyeStyle: 'sharp', eyeColor: '#6b4020', facialHair: 'full_beard',
      clothing: 'suit', clothingColor: '#0e0018',
      accessories: ['chain', 'crown'], neonCast: '#cc44ff',
    },
  },
  {
    id: 24, name: 'The Poker Influencer', initials: 'PI', rarity: 'EPIC', unlockXP: 45000,
    unlockCondition: 'Reach 45 000 XP',
    bio: 'Ten million followers and every one of them wants to be at her table.',
    portraitColors: ['#1a000e', '#2e001c', '#42002a'],
    lightColor: '#ff3399', accentColor: '#ff1188',
    visuals: {
      faceShape: 'heart', skinTone: '#d4956a', hairStyle: 'long', hairColor: '#9900cc',
      eyeStyle: 'almond', eyeColor: '#cc0066', facialHair: 'none',
      clothing: 'blazer', clothingColor: '#1a000e',
      accessories: ['earring', 'chain'], neonCast: '#ff3399',
    },
  },
  {
    id: 25, name: 'The Diamond Club VIP', initials: 'DV', rarity: 'EPIC', unlockXP: 50000,
    unlockCondition: 'Reach ranked elite status',
    bio: 'The list has a list. He\'s on it. The diamond card opens every door.',
    portraitColors: ['#001020', '#001830', '#002040'],
    lightColor: '#88ccff', accentColor: '#77bbff',
    visuals: {
      faceShape: 'oval', skinTone: '#9a5e2a', hairStyle: 'slicked', hairColor: '#1a0f08',
      eyeStyle: 'hooded', eyeColor: '#5080b0', facialHair: 'none',
      clothing: 'suit', clothingColor: '#000a18',
      accessories: ['glasses', 'chain'], neonCast: '#88ccff',
    },
  },
  {
    id: 26, name: 'The Bluff Master', initials: 'BM', rarity: 'EPIC', unlockXP: 55000,
    unlockCondition: 'Win 500 hands total',
    bio: 'His face reveals nothing. His eyes reveal everything. Read at your own risk.',
    portraitColors: ['#050508', '#0a0a10', '#0f0f18'],
    lightColor: '#ddddff', accentColor: '#ccccff',
    visuals: {
      faceShape: 'angular', skinTone: '#c07840', hairStyle: 'slicked', hairColor: '#1a0f08',
      eyeStyle: 'sharp', eyeColor: '#303050', facialHair: 'goatee',
      clothing: 'turtleneck', clothingColor: '#050508',
      accessories: ['sunglasses'], neonCast: '#ddddff',
    },
  },
  {
    id: 27, name: 'The Syndicate Boss', initials: 'SB', rarity: 'EPIC', unlockXP: 60000,
    unlockCondition: 'Reach 60 000 XP',
    bio: 'The underground network runs through him. Every private game is his game.',
    portraitColors: ['#100008', '#1e0012', '#2c001c'],
    lightColor: '#ff2266', accentColor: '#ff0044',
    visuals: {
      faceShape: 'square', skinTone: '#7a3e18', hairStyle: 'waves', hairColor: '#1a0f08',
      eyeStyle: 'hooded', eyeColor: '#6b2020', facialHair: 'full_beard',
      clothing: 'suit', clothingColor: '#0a0005',
      accessories: ['fedora', 'chain'], neonCast: '#ff2266',
    },
  },
  {
    id: 28, name: 'The High Roller Queen', initials: 'HQ', rarity: 'EPIC', unlockXP: 65000,
    unlockCondition: 'Win 5 tournaments',
    bio: 'She walks in, everyone adjusts their bets. Nobody wins gracefully against her.',
    portraitColors: ['#1a0018', '#2e002e', '#420044'],
    lightColor: '#ff55ff', accentColor: '#ee33ee',
    visuals: {
      faceShape: 'oval', skinTone: '#f0b885', hairStyle: 'long', hairColor: '#1a0f08',
      eyeStyle: 'almond', eyeColor: '#8030a0', facialHair: 'none',
      clothing: 'blazer', clothingColor: '#120010',
      accessories: ['earring', 'chain', 'sunglasses'], neonCast: '#ff55ff',
    },
  },
  {
    id: 29, name: 'The Tournament Killer', initials: 'TK', rarity: 'EPIC', unlockXP: 70000,
    unlockCondition: 'Win 10 tournaments',
    bio: 'Traveled every circuit. Never came second. The final table is his home.',
    portraitColors: ['#0c1400', '#162000', '#202c00'],
    lightColor: '#aaff00', accentColor: '#99ee00',
    visuals: {
      faceShape: 'angular', skinTone: '#e8b87a', hairStyle: 'mohawk', hairColor: '#00aa44',
      eyeStyle: 'sharp', eyeColor: '#407020', facialHair: 'stubble',
      clothing: 'leather_jacket', clothingColor: '#080c00',
      accessories: ['chain'], neonCast: '#aaff00',
    },
  },
  {
    id: 30, name: 'The Society Elite', initials: 'SE', rarity: 'EPIC', unlockXP: 75000,
    unlockCondition: 'Complete all achievements',
    bio: 'Top tier of Chip Society. Known in every private room on every coast.',
    portraitColors: ['#0a0a00', '#141400', '#1e1e00'],
    lightColor: '#ffee00', accentColor: '#ffdd00',
    visuals: {
      faceShape: 'square', skinTone: '#d4956a', hairStyle: 'slicked', hairColor: '#1a0f08',
      eyeStyle: 'hooded', eyeColor: '#a08020', facialHair: 'mustache',
      clothing: 'suit', clothingColor: '#080800',
      accessories: ['glasses', 'chain'], neonCast: '#ffee00',
    },
  },

  // ── LEGENDARY (31–40) — Iconic. Extremely difficult to earn. ────────────────

  {
    id: 31, name: 'The Godfather', initials: 'GF', rarity: 'LEGENDARY', unlockXP: 100000,
    unlockCondition: 'Reach level 50',
    bio: 'The original. The architect. Every underground game exists because of him.',
    portraitColors: ['#050505', '#0a0a0a', '#0f0f0f'],
    lightColor: '#ffd700', accentColor: '#ffcc00',
    visuals: {
      faceShape: 'round', skinTone: '#c07840', hairStyle: 'bald', hairColor: '#000000',
      eyeStyle: 'hooded', eyeColor: '#5a3000', facialHair: 'full_beard',
      clothing: 'suit', clothingColor: '#050505',
      accessories: ['chain', 'glasses'], neonCast: '#ffd700',
    },
  },
  {
    id: 32, name: 'The Vegas Phantom', initials: 'VP', rarity: 'LEGENDARY', unlockXP: 125000,
    unlockCondition: 'Win the leaderboard',
    bio: 'No name on the records. No face on the cameras. Only the winnings remain.',
    portraitColors: ['#080010', '#10001a', '#180024'],
    lightColor: '#c8a0ff', accentColor: '#bb88ff',
    visuals: {
      faceShape: 'angular', skinTone: '#e8b87a', hairStyle: 'long', hairColor: '#1a1a1a',
      eyeStyle: 'sharp', eyeColor: '#7050c0', facialHair: 'none',
      clothing: 'turtleneck', clothingColor: '#050008',
      accessories: ['fedora', 'glasses'], neonCast: '#c8a0ff',
    },
  },
  {
    id: 33, name: 'The Black Card Boss', initials: 'BC', rarity: 'LEGENDARY', unlockXP: 150000,
    unlockCondition: 'Reach 150 000 XP',
    bio: 'The card has no limit. The man behind it has no ceiling.',
    portraitColors: ['#040404', '#080808', '#0c0c0c'],
    lightColor: '#ffffff', accentColor: '#eeeeee',
    visuals: {
      faceShape: 'square', skinTone: '#7a3e18', hairStyle: 'slicked', hairColor: '#080808',
      eyeStyle: 'sharp', eyeColor: '#404040', facialHair: 'goatee',
      clothing: 'suit', clothingColor: '#040404',
      accessories: ['sunglasses', 'chain'], neonCast: '#ffffff',
    },
  },
  {
    id: 34, name: 'The Diamond Emperor', initials: 'DE', rarity: 'LEGENDARY', unlockXP: 175000,
    unlockCondition: 'Win a championship',
    bio: 'Empire built hand by hand. Diamond in every pocket. Crown on every head.',
    portraitColors: ['#0c0a00', '#181400', '#241e00'],
    lightColor: '#ffe44d', accentColor: '#ffdd00',
    visuals: {
      faceShape: 'oval', skinTone: '#9a5e2a', hairStyle: 'waves', hairColor: '#2a1a0a',
      eyeStyle: 'hooded', eyeColor: '#805010', facialHair: 'full_beard',
      clothing: 'suit', clothingColor: '#080600',
      accessories: ['crown', 'chain', 'glasses'], neonCast: '#ffe44d',
    },
  },
  {
    id: 35, name: 'The Society Founder', initials: 'SF', rarity: 'LEGENDARY', unlockXP: 200000,
    unlockCondition: 'Reach 200 000 XP',
    bio: 'Built Chip Society from nothing. The rules were written in his handwriting.',
    portraitColors: ['#001420', '#001e30', '#002840'],
    lightColor: '#44aaff', accentColor: '#33aaff',
    visuals: {
      faceShape: 'oval', skinTone: '#f5c99a', hairStyle: 'slicked', hairColor: '#c8c8c8',
      eyeStyle: 'normal', eyeColor: '#3060a0', facialHair: 'beard',
      clothing: 'turtleneck', clothingColor: '#001018',
      accessories: ['glasses'], neonCast: '#44aaff',
    },
  },
  {
    id: 36, name: 'The Final Bluff', initials: 'FB', rarity: 'LEGENDARY', unlockXP: 225000,
    unlockCondition: 'Reach 225 000 XP',
    bio: 'One hand. Everything on the table. He raised. Nobody called.',
    portraitColors: ['#001000', '#001c00', '#002800'],
    lightColor: '#00ff66', accentColor: '#00ee55',
    visuals: {
      faceShape: 'heart', skinTone: '#c07840', hairStyle: 'mohawk', hairColor: '#00a8e0',
      eyeStyle: 'wide', eyeColor: '#20a040', facialHair: 'stubble',
      clothing: 'leather_jacket', clothingColor: '#000c00',
      accessories: ['cyberpunk_visor', 'chain'], neonCast: '#00ff66',
    },
  },
  {
    id: 37, name: 'The Casino Emperor', initials: 'CE', rarity: 'LEGENDARY', unlockXP: 250000,
    unlockCondition: 'Long-term ranked progression',
    bio: 'Owns the house. Runs the lights. Sets the rules. Still plays every night.',
    portraitColors: ['#0a0500', '#140a00', '#1e0f00'],
    lightColor: '#ff8800', accentColor: '#ff7700',
    visuals: {
      faceShape: 'round', skinTone: '#e8b87a', hairStyle: 'bald', hairColor: '#000000',
      eyeStyle: 'hooded', eyeColor: '#604010', facialHair: 'full_beard',
      clothing: 'suit', clothingColor: '#080300',
      accessories: ['crown', 'chain'], neonCast: '#ff8800',
    },
  },
  {
    id: 38, name: 'The Billionaire Whale', initials: 'BW', rarity: 'LEGENDARY', unlockXP: 300000,
    unlockCondition: 'Massive chip milestones',
    bio: 'Flies in private. Plays in private. The minimum buy-in is everyone else\'s maximum.',
    portraitColors: ['#001420', '#001e30', '#002840'],
    lightColor: '#66ddff', accentColor: '#55ccff',
    visuals: {
      faceShape: 'square', skinTone: '#d4956a', hairStyle: 'slicked', hairColor: '#3b200f',
      eyeStyle: 'hooded', eyeColor: '#306080', facialHair: 'full_beard',
      clothing: 'suit', clothingColor: '#00080e',
      accessories: ['chain', 'glasses'], neonCast: '#66ddff',
    },
  },
  {
    id: 39, name: 'The Neon Legend', initials: 'NL', rarity: 'LEGENDARY', unlockXP: 375000,
    unlockCondition: 'Social prestige milestone',
    bio: 'The most recognized face in the neon underground. The lights dim when he enters.',
    portraitColors: ['#10001a', '#1a002e', '#240042'],
    lightColor: '#ff00ff', accentColor: '#ee00ee',
    visuals: {
      faceShape: 'angular', skinTone: '#7a3e18', hairStyle: 'dreads', hairColor: '#9900cc',
      eyeStyle: 'sharp', eyeColor: '#9000cc', facialHair: 'none',
      clothing: 'leather_jacket', clothingColor: '#08000e',
      accessories: ['earring', 'chain', 'sunglasses'], neonCast: '#ff00ff',
    },
  },
  {
    id: 40, name: 'The Poker Community Legend', initials: 'PL', rarity: 'LEGENDARY', unlockXP: 500000,
    unlockCondition: 'The rarest character — maximum social prestige',
    bio: 'The pinnacle of Chip Society. No one has fully documented how he got here. But everyone knows the name.',
    portraitColors: ['#0a0800', '#141000', '#1e1800'],
    lightColor: '#ffd700', accentColor: '#ffcc00',
    visuals: {
      faceShape: 'oval', skinTone: '#9a5e2a', hairStyle: 'ponytail', hairColor: '#c8a000',
      eyeStyle: 'hooded', eyeColor: '#806010', facialHair: 'full_beard',
      clothing: 'suit', clothingColor: '#060400',
      accessories: ['crown', 'chain', 'fedora'], neonCast: '#ffd700',
    },
  },
];
