// ─── CHIP SOCIETY — 80 Premium Character Portraits ────────────────────────────
// Each character renders as a fully illustrated SVG portrait:
// face shape, skin tone, hair style & colour, eyes, clothing, accessories.
// NO emoji. NO initials. Real illustrated characters.

export type Rarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export type FaceShape    = 'oval' | 'square' | 'angular' | 'round' | 'heart';
export type HairStyle    = 'slicked' | 'undercut' | 'curly' | 'mohawk' | 'long' | 'buzz' | 'bald' | 'waves' | 'dreads' | 'ponytail' | 'bob' | 'fauxhawk';
export type EyeStyle     = 'normal' | 'hooded' | 'wide' | 'sharp' | 'almond';
export type FacialHair   = 'none' | 'stubble' | 'beard' | 'mustache' | 'goatee' | 'full_beard';
export type ClothingStyle = 'suit' | 'leather_jacket' | 'turtleneck' | 'hoodie' | 'blazer' | 'open_shirt';
export type AccessoryType = 'glasses' | 'sunglasses' | 'cyberpunk_visor' | 'earring' | 'chain' | 'fedora' | 'snapback' | 'crown' | 'headset';

export interface CharacterVisuals {
  faceShape:    FaceShape;
  skinTone:     string;
  hairStyle:    HairStyle;
  hairColor:    string;
  eyeStyle:     EyeStyle;
  eyeColor:     string;
  facialHair:   FacialHair;
  clothing:     ClothingStyle;
  clothingColor: string;
  accessories:  AccessoryType[];
  neonCast:     string;
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

  // ── COMMON (1–20) — Unlock: 0–4 500 XP ─────────────────────────────────────

  {
    id: 1, name: 'Neon Rookie', initials: 'NR', rarity: 'COMMON', unlockXP: 0,
    unlockCondition: 'Available from the start',
    bio: 'Every legend was a rookie once. The felt is calling.',
    portraitColors: ['#000d1a', '#001833', '#00274d'],
    lightColor: '#00d4ff', accentColor: '#00d4ff',
    visuals: { faceShape:'oval', skinTone:'#f5c99a', hairStyle:'buzz', hairColor:'#1a0f08', eyeStyle:'normal', eyeColor:'#4060a0', facialHair:'none', clothing:'hoodie', clothingColor:'#1a1a2e', accessories:[], neonCast:'#00d4ff' },
  },
  {
    id: 2, name: 'Sunset Dealer', initials: 'SD', rarity: 'COMMON', unlockXP: 0,
    unlockCondition: 'Available from the start',
    bio: 'Professional to the bone. Every deal is theater.',
    portraitColors: ['#1a0030', '#2d004d', '#440066'],
    lightColor: '#ff69b4', accentColor: '#ff69b4',
    visuals: { faceShape:'oval', skinTone:'#d4956a', hairStyle:'bob', hairColor:'#3b200f', eyeStyle:'normal', eyeColor:'#6b4020', facialHair:'none', clothing:'blazer', clothingColor:'#1a1a1a', accessories:['earring'], neonCast:'#ff6600' },
  },
  {
    id: 3, name: 'Midnight Tourist', initials: 'MT', rarity: 'COMMON', unlockXP: 200,
    unlockCondition: 'Play your first hand',
    bio: 'Just passing through. Leaving with everyone\'s chips.',
    portraitColors: ['#080820', '#0f0f35', '#16164a'],
    lightColor: '#9090ff', accentColor: '#7b68ee',
    visuals: { faceShape:'square', skinTone:'#e8b87a', hairStyle:'waves', hairColor:'#6b3a1f', eyeStyle:'normal', eyeColor:'#4a7040', facialHair:'stubble', clothing:'leather_jacket', clothingColor:'#1a1a1a', accessories:[], neonCast:'#9090ff' },
  },
  {
    id: 4, name: 'Card Shark Rookie', initials: 'CS', rarity: 'COMMON', unlockXP: 400,
    unlockCondition: 'Win your first hand',
    bio: 'Sharp instincts. Sharper reads. Still learning to hide it.',
    portraitColors: ['#001a1a', '#002d2d', '#004040'],
    lightColor: '#00ffcc', accentColor: '#00ffcc',
    visuals: { faceShape:'round', skinTone:'#9a5e2a', hairStyle:'slicked', hairColor:'#1a0f08', eyeStyle:'wide', eyeColor:'#6b4020', facialHair:'none', clothing:'leather_jacket', clothingColor:'#0a0a14', accessories:['chain'], neonCast:'#00ffcc' },
  },
  {
    id: 5, name: 'Ocean Drive Player', initials: 'OD', rarity: 'COMMON', unlockXP: 600,
    unlockCondition: 'Reach 600 XP',
    bio: 'Miami nights, chrome shades, six-figure pots.',
    portraitColors: ['#001428', '#001f3d', '#002952'],
    lightColor: '#4db8ff', accentColor: '#4db8ff',
    visuals: { faceShape:'heart', skinTone:'#f5c99a', hairStyle:'long', hairColor:'#e8e0cc', eyeStyle:'normal', eyeColor:'#4060a0', facialHair:'none', clothing:'open_shirt', clothingColor:'#3a2a1a', accessories:['earring'], neonCast:'#4db8ff' },
  },
  {
    id: 6, name: 'Neon Hoodie', initials: 'NH', rarity: 'COMMON', unlockXP: 800,
    unlockCondition: 'Reach 800 XP',
    bio: 'Underground circuit regular. Glowing trim, cold stare.',
    portraitColors: ['#160028', '#220040', '#2e0058'],
    lightColor: '#cc66ff', accentColor: '#cc66ff',
    visuals: { faceShape:'angular', skinTone:'#c07840', hairStyle:'fauxhawk', hairColor:'#1a0f08', eyeStyle:'sharp', eyeColor:'#6b4020', facialHair:'none', clothing:'hoodie', clothingColor:'#1a0a1a', accessories:[], neonCast:'#cc66ff' },
  },
  {
    id: 7, name: 'Beginner Bluff', initials: 'BB', rarity: 'COMMON', unlockXP: 1000,
    unlockCondition: 'Reach level 3',
    bio: 'The bluff that started everything. Confidence is a skill.',
    portraitColors: ['#001208', '#001f0f', '#002c16'],
    lightColor: '#00ff88', accentColor: '#00ff66',
    visuals: { faceShape:'oval', skinTone:'#7a3e18', hairStyle:'waves', hairColor:'#3b200f', eyeStyle:'normal', eyeColor:'#6b4020', facialHair:'none', clothing:'hoodie', clothingColor:'#0f1a0f', accessories:[], neonCast:'#00ff88' },
  },
  {
    id: 8, name: 'Velvet Visitor', initials: 'VV', rarity: 'COMMON', unlockXP: 1200,
    unlockCondition: 'Reach 1 200 XP',
    bio: 'Dressed for success. Lingering in the best lounges.',
    portraitColors: ['#18000d', '#2a0016', '#3c001f'],
    lightColor: '#ff4da6', accentColor: '#ff1a8c',
    visuals: { faceShape:'round', skinTone:'#e8b87a', hairStyle:'curly', hairColor:'#1a0f08', eyeStyle:'wide', eyeColor:'#6b4020', facialHair:'none', clothing:'blazer', clothingColor:'#6b0000', accessories:['earring'], neonCast:'#ff4da6' },
  },
  {
    id: 9, name: 'Casual High Roller', initials: 'CH', rarity: 'COMMON', unlockXP: 1500,
    unlockCondition: 'Accumulate 10 000 chips',
    bio: 'Luxury casualwear. Showing up like every pot is pocket change.',
    portraitColors: ['#1a1000', '#2d1c00', '#402800'],
    lightColor: '#ffd700', accentColor: '#ffd700',
    visuals: { faceShape:'square', skinTone:'#d4956a', hairStyle:'undercut', hairColor:'#b57830', eyeStyle:'hooded', eyeColor:'#c0a000', facialHair:'goatee', clothing:'blazer', clothingColor:'#4a3a00', accessories:[], neonCast:'#ffd700' },
  },
  {
    id: 10, name: 'Skyline Grinder', initials: 'SG', rarity: 'COMMON', unlockXP: 1800,
    unlockCondition: 'Play 25 hands',
    bio: 'Up before the city wakes. Grinding while everyone sleeps.',
    portraitColors: ['#040d18', '#081a2f', '#0c2646'],
    lightColor: '#6699ff', accentColor: '#66b3ff',
    visuals: { faceShape:'oval', skinTone:'#9a5e2a', hairStyle:'buzz', hairColor:'#3b200f', eyeStyle:'normal', eyeColor:'#6b4020', facialHair:'none', clothing:'suit', clothingColor:'#1a1a2e', accessories:[], neonCast:'#6699ff' },
  },
  {
    id: 11, name: 'Neon Shades', initials: 'NS', rarity: 'COMMON', unlockXP: 2000,
    unlockCondition: 'Reach 2 000 XP',
    bio: 'The shades stay on. Nobody reads what they can\'t see.',
    portraitColors: ['#0c001a', '#170033', '#22004d'],
    lightColor: '#dd88ff', accentColor: '#e066ff',
    visuals: { faceShape:'angular', skinTone:'#e8b87a', hairStyle:'slicked', hairColor:'#1a0f08', eyeStyle:'sharp', eyeColor:'#505050', facialHair:'none', clothing:'suit', clothingColor:'#1a1a1a', accessories:['sunglasses'], neonCast:'#dd88ff' },
  },
  {
    id: 12, name: 'Downtown Gambler', initials: 'DG', rarity: 'COMMON', unlockXP: 2200,
    unlockCondition: 'Reach 2 200 XP',
    bio: 'Vegas-bred. Downtown bones. Seen it all, still standing.',
    portraitColors: ['#1a0000', '#2d0000', '#400000'],
    lightColor: '#ff4444', accentColor: '#ff3333',
    visuals: { faceShape:'round', skinTone:'#c07840', hairStyle:'waves', hairColor:'#1a0f08', eyeStyle:'hooded', eyeColor:'#6b4020', facialHair:'stubble', clothing:'leather_jacket', clothingColor:'#0a0a14', accessories:[], neonCast:'#ff4444' },
  },
  {
    id: 13, name: 'Low Stakes Legend', initials: 'LL', rarity: 'COMMON', unlockXP: 2500,
    unlockCondition: 'Win 10 hands',
    bio: 'Small pots, maximum presence. Every table, every room.',
    portraitColors: ['#001210', '#001f1b', '#002d26'],
    lightColor: '#00e6cc', accentColor: '#00e6cc',
    visuals: { faceShape:'heart', skinTone:'#d4956a', hairStyle:'ponytail', hairColor:'#3b200f', eyeStyle:'normal', eyeColor:'#308060', facialHair:'none', clothing:'turtleneck', clothingColor:'#001f1b', accessories:[], neonCast:'#00e6cc' },
  },
  {
    id: 14, name: 'Blue Glow Dealer', initials: 'BG', rarity: 'COMMON', unlockXP: 2800,
    unlockCondition: 'Reach 2 800 XP',
    bio: 'The house dealer you never want across the table.',
    portraitColors: ['#000d1f', '#001a3d', '#00275c'],
    lightColor: '#4499ff', accentColor: '#0066ff',
    visuals: { faceShape:'square', skinTone:'#f5c99a', hairStyle:'slicked', hairColor:'#3b200f', eyeStyle:'normal', eyeColor:'#4060a0', facialHair:'none', clothing:'suit', clothingColor:'#1a1a2e', accessories:[], neonCast:'#4499ff' },
  },
  {
    id: 15, name: 'Syndicate Rookie', initials: 'SR', rarity: 'COMMON', unlockXP: 3000,
    unlockCondition: 'Reach level 5',
    bio: 'Entry pass earned. Now prove you belong in the room.',
    portraitColors: ['#1a1a00', '#2d2d00', '#404000'],
    lightColor: '#ffff33', accentColor: '#ffff00',
    visuals: { faceShape:'angular', skinTone:'#7a3e18', hairStyle:'mohawk', hairColor:'#6b3a1f', eyeStyle:'sharp', eyeColor:'#c0a000', facialHair:'none', clothing:'hoodie', clothingColor:'#1a1a00', accessories:[], neonCast:'#ffff33' },
  },
  {
    id: 16, name: 'Silver Card Player', initials: 'SC', rarity: 'COMMON', unlockXP: 3200,
    unlockCondition: 'Reach 3 200 XP',
    bio: 'Silver is the new gold in the underground circuit.',
    portraitColors: ['#0c0c0c', '#161616', '#202020'],
    lightColor: '#d0d0d0', accentColor: '#cccccc',
    visuals: { faceShape:'oval', skinTone:'#e8b87a', hairStyle:'slicked', hairColor:'#6b3a1f', eyeStyle:'normal', eyeColor:'#505050', facialHair:'mustache', clothing:'suit', clothingColor:'#1a1a1a', accessories:[], neonCast:'#d0d0d0' },
  },
  {
    id: 17, name: 'The Quiet Caller', initials: 'QC', rarity: 'COMMON', unlockXP: 3500,
    unlockCondition: 'Play 50 hands',
    bio: 'Never raises. Never folds. Just calls. Until he doesn\'t.',
    portraitColors: ['#040a18', '#081733', '#0c234d'],
    lightColor: '#4466ff', accentColor: '#3380ff',
    visuals: { faceShape:'square', skinTone:'#d4956a', hairStyle:'buzz', hairColor:'#1a0f08', eyeStyle:'hooded', eyeColor:'#4060a0', facialHair:'none', clothing:'suit', clothingColor:'#1a1a2e', accessories:[], neonCast:'#4466ff' },
  },
  {
    id: 18, name: 'Midnight Regular', initials: 'MR', rarity: 'COMMON', unlockXP: 3800,
    unlockCondition: 'Reach 3 800 XP',
    bio: 'Last one at the table. First one back tomorrow.',
    portraitColors: ['#0a0010', '#14001f', '#1e002e'],
    lightColor: '#aa44dd', accentColor: '#9900cc',
    visuals: { faceShape:'oval', skinTone:'#c07840', hairStyle:'bob', hairColor:'#1a0f08', eyeStyle:'almond', eyeColor:'#6b4020', facialHair:'none', clothing:'turtleneck', clothingColor:'#1a0a1a', accessories:[], neonCast:'#aa44dd' },
  },
  {
    id: 19, name: 'Vice Lounge Rookie', initials: 'VL', rarity: 'COMMON', unlockXP: 4000,
    unlockCondition: 'Reach 4 000 XP',
    bio: 'First time in the lounge. Not the last.',
    portraitColors: ['#0c1800', '#162600', '#203400'],
    lightColor: '#88ff00', accentColor: '#66ff00',
    visuals: { faceShape:'heart', skinTone:'#9a5e2a', hairStyle:'waves', hairColor:'#6b3a1f', eyeStyle:'normal', eyeColor:'#308060', facialHair:'none', clothing:'leather_jacket', clothingColor:'#0f1a0f', accessories:[], neonCast:'#88ff00' },
  },
  {
    id: 20, name: 'Community Member', initials: 'CM', rarity: 'COMMON', unlockXP: 4500,
    unlockCondition: 'Post to the social feed',
    bio: 'Part of something bigger. The grind is communal.',
    portraitColors: ['#001820', '#00263a', '#003354'],
    lightColor: '#33bbdd', accentColor: '#00aadd',
    visuals: { faceShape:'round', skinTone:'#f5c99a', hairStyle:'long', hairColor:'#3b200f', eyeStyle:'wide', eyeColor:'#4060a0', facialHair:'none', clothing:'blazer', clothingColor:'#1a1a2e', accessories:['earring'], neonCast:'#33bbdd' },
  },

  // ── RARE (21–40) — Unlock: 5 000–25 000 XP ──────────────────────────────────

  {
    id: 21, name: 'Neon Syndicate Boss', initials: 'NB', rarity: 'RARE', unlockXP: 5000,
    unlockCondition: 'Reach level 10',
    bio: 'Runs the underground network. Every game is his game.',
    portraitColors: ['#1a001a', '#330033', '#4d004d'],
    lightColor: '#ff66ff', accentColor: '#ff00ff',
    visuals: { faceShape:'angular', skinTone:'#e8b87a', hairStyle:'slicked', hairColor:'#c8c8c8', eyeStyle:'hooded', eyeColor:'#505050', facialHair:'goatee', clothing:'suit', clothingColor:'#0a0a14', accessories:['chain'], neonCast:'#ff66ff' },
  },
  {
    id: 22, name: 'Chrome Blazer Shark', initials: 'CB', rarity: 'RARE', unlockXP: 6000,
    unlockCondition: 'Win 50 hands',
    bio: 'Chrome lining on everything. Sharp as the suit.',
    portraitColors: ['#0c1820', '#19303f', '#26485e'],
    lightColor: '#88ccff', accentColor: '#80d4ff',
    visuals: { faceShape:'oval', skinTone:'#9a5e2a', hairStyle:'waves', hairColor:'#1a0f08', eyeStyle:'normal', eyeColor:'#6b4020', facialHair:'stubble', clothing:'blazer', clothingColor:'#1a1a1a', accessories:['sunglasses'], neonCast:'#88ccff' },
  },
  {
    id: 23, name: 'Tokyo Heat Gambler', initials: 'TH', rarity: 'RARE', unlockXP: 7000,
    unlockCondition: 'Win 3 games in a row',
    bio: 'Cyber-lounge legend from the Far East circuits.',
    portraitColors: ['#1a0010', '#330020', '#4c0030'],
    lightColor: '#ff55aa', accentColor: '#ff3399',
    visuals: { faceShape:'heart', skinTone:'#f5c99a', hairStyle:'long', hairColor:'#cc0077', eyeStyle:'almond', eyeColor:'#4060a0', facialHair:'none', clothing:'blazer', clothingColor:'#1a0a1a', accessories:['earring'], neonCast:'#ff55aa' },
  },
  {
    id: 24, name: 'Diamond Club Member', initials: 'DC', rarity: 'RARE', unlockXP: 8000,
    unlockCondition: 'Reach 8 000 XP',
    bio: 'Invitation-only club. You earned it. Now use it.',
    portraitColors: ['#001226', '#001e3d', '#002a54'],
    lightColor: '#77bbff', accentColor: '#66b3ff',
    visuals: { faceShape:'square', skinTone:'#c07840', hairStyle:'undercut', hairColor:'#1a0f08', eyeStyle:'sharp', eyeColor:'#505050', facialHair:'none', clothing:'turtleneck', clothingColor:'#1a1a2e', accessories:[], neonCast:'#77bbff' },
  },
  {
    id: 25, name: 'Black Card Player', initials: 'BP', rarity: 'RARE', unlockXP: 9000,
    unlockCondition: 'Accumulate 100 000 chips',
    bio: 'No limit on the card. No limit at the table.',
    portraitColors: ['#050507', '#0a0a0e', '#0f0f15'],
    lightColor: '#ccccdd', accentColor: '#c0c0c0',
    visuals: { faceShape:'oval', skinTone:'#7a3e18', hairStyle:'slicked', hairColor:'#1a0f08', eyeStyle:'hooded', eyeColor:'#6b4020', facialHair:'beard', clothing:'suit', clothingColor:'#1a1a1a', accessories:['chain'], neonCast:'#ccccdd' },
  },
  {
    id: 26, name: 'Skyline High Roller', initials: 'SH', rarity: 'RARE', unlockXP: 10000,
    unlockCondition: 'Reach level 15',
    bio: 'Penthouse suite. Penthouse stakes. Penthouse attitude.',
    portraitColors: ['#001428', '#001e3d', '#002852'],
    lightColor: '#3399ff', accentColor: '#0099ff',
    visuals: { faceShape:'square', skinTone:'#d4956a', hairStyle:'waves', hairColor:'#b57830', eyeStyle:'normal', eyeColor:'#c0a000', facialHair:'stubble', clothing:'blazer', clothingColor:'#1a1a2e', accessories:[], neonCast:'#3399ff' },
  },
  {
    id: 27, name: 'Velvet Suit Hustler', initials: 'VS', rarity: 'RARE', unlockXP: 11000,
    unlockCondition: 'Reach 11 000 XP',
    bio: 'Smooth operator. The velvet never wrinkles.',
    portraitColors: ['#18001f', '#2d003a', '#420055'],
    lightColor: '#cc55ff', accentColor: '#cc33ff',
    visuals: { faceShape:'angular', skinTone:'#e8b87a', hairStyle:'fauxhawk', hairColor:'#3b200f', eyeStyle:'sharp', eyeColor:'#4060a0', facialHair:'goatee', clothing:'suit', clothingColor:'#1a0a1a', accessories:[], neonCast:'#cc55ff' },
  },
  {
    id: 28, name: 'The River Hunter', initials: 'RH', rarity: 'RARE', unlockXP: 12000,
    unlockCondition: 'Win 5 hands on the river card',
    bio: 'Waits for the river. Then strikes.',
    portraitColors: ['#001808', '#00280f', '#003816'],
    lightColor: '#33ff88', accentColor: '#00ff66',
    visuals: { faceShape:'oval', skinTone:'#9a5e2a', hairStyle:'dreads', hairColor:'#3b200f', eyeStyle:'wide', eyeColor:'#308060', facialHair:'none', clothing:'leather_jacket', clothingColor:'#0f1a0f', accessories:[], neonCast:'#33ff88' },
  },
  {
    id: 29, name: 'Gold Chain Gambler', initials: 'GC', rarity: 'RARE', unlockXP: 13000,
    unlockCondition: 'Reach 13 000 XP',
    bio: 'Street-casino aesthetic. The chain is real. The bluffs are not.',
    portraitColors: ['#1a1000', '#2d1c00', '#403300'],
    lightColor: '#ffdd33', accentColor: '#ffcc00',
    visuals: { faceShape:'round', skinTone:'#7a3e18', hairStyle:'slicked', hairColor:'#1a0f08', eyeStyle:'normal', eyeColor:'#c0a000', facialHair:'mustache', clothing:'open_shirt', clothingColor:'#3a2a1a', accessories:['chain'], neonCast:'#ffdd33' },
  },
  {
    id: 30, name: 'Mirage Casino VIP', initials: 'MV', rarity: 'RARE', unlockXP: 14000,
    unlockCondition: 'Win a tournament',
    bio: 'The Mirage gave him a suite. He gave them a spectacle.',
    portraitColors: ['#1a1a00', '#303000', '#454500'],
    lightColor: '#ffff88', accentColor: '#ffff66',
    visuals: { faceShape:'heart', skinTone:'#f5c99a', hairStyle:'ponytail', hairColor:'#e8e0cc', eyeStyle:'normal', eyeColor:'#4060a0', facialHair:'none', clothing:'blazer', clothingColor:'#d4c090', accessories:['earring'], neonCast:'#ffff88' },
  },
  {
    id: 31, name: 'Sapphire Lounge King', initials: 'SK', rarity: 'RARE', unlockXP: 15000,
    unlockCondition: 'Reach level 20',
    bio: 'Owns the lounge. Every corner, every table, every player.',
    portraitColors: ['#001428', '#001f3d', '#002a52'],
    lightColor: '#5599ff', accentColor: '#3399ff',
    visuals: { faceShape:'square', skinTone:'#c07840', hairStyle:'undercut', hairColor:'#3b200f', eyeStyle:'hooded', eyeColor:'#4060a0', facialHair:'stubble', clothing:'suit', clothingColor:'#1a1a2e', accessories:['chain'], neonCast:'#5599ff' },
  },
  {
    id: 32, name: 'Crimson Bluff Artist', initials: 'CA', rarity: 'RARE', unlockXP: 16000,
    unlockCondition: 'Bluff successfully 20 times',
    bio: 'The art form of misdirection. Crimson is the colour of nerve.',
    portraitColors: ['#200000', '#3d0000', '#5a0000'],
    lightColor: '#ff5555', accentColor: '#ff3333',
    visuals: { faceShape:'angular', skinTone:'#d4956a', hairStyle:'buzz', hairColor:'#1a0f08', eyeStyle:'sharp', eyeColor:'#6b4020', facialHair:'mustache', clothing:'suit', clothingColor:'#6b0000', accessories:[], neonCast:'#ff5555' },
  },
  {
    id: 33, name: 'Neon Cigar Player', initials: 'NC', rarity: 'RARE', unlockXP: 17000,
    unlockCondition: 'Reach 17 000 XP',
    bio: 'Classic Vegas high roller. The cigar never leaves.',
    portraitColors: ['#1a0d00', '#2d1800', '#402300'],
    lightColor: '#ff9944', accentColor: '#ff8800',
    visuals: { faceShape:'oval', skinTone:'#e8b87a', hairStyle:'waves', hairColor:'#cc4400', eyeStyle:'normal', eyeColor:'#c0a000', facialHair:'goatee', clothing:'open_shirt', clothingColor:'#4a3a00', accessories:[], neonCast:'#ff9944' },
  },
  {
    id: 34, name: 'Platinum Grinder', initials: 'PG', rarity: 'RARE', unlockXP: 18000,
    unlockCondition: 'Play 200 hands',
    bio: 'Platinum patience. Grinding out edges nobody else sees.',
    portraitColors: ['#0d0d0d', '#1a1a1a', '#272727'],
    lightColor: '#eeeeee', accentColor: '#e6e6e6',
    visuals: { faceShape:'oval', skinTone:'#f5c99a', hairStyle:'bob', hairColor:'#c8c8c8', eyeStyle:'normal', eyeColor:'#505050', facialHair:'none', clothing:'turtleneck', clothingColor:'#0a0a14', accessories:[], neonCast:'#eeeeee' },
  },
  {
    id: 35, name: 'Midnight Executive', initials: 'ME', rarity: 'RARE', unlockXP: 20000,
    unlockCondition: 'Reach level 22',
    bio: 'Boardroom by day. High-stakes table by night.',
    portraitColors: ['#080c18', '#0f182d', '#162442'],
    lightColor: '#5577dd', accentColor: '#4466cc',
    visuals: { faceShape:'square', skinTone:'#e8b87a', hairStyle:'slicked', hairColor:'#888880', eyeStyle:'hooded', eyeColor:'#4060a0', facialHair:'none', clothing:'suit', clothingColor:'#1a1a2e', accessories:['glasses'], neonCast:'#5577dd' },
  },
  {
    id: 36, name: 'Penthouse Gambler', initials: 'PH', rarity: 'RARE', unlockXP: 21000,
    unlockCondition: 'Reach 21 000 XP',
    bio: 'Top floor. Top table. No reservations.',
    portraitColors: ['#1a1400', '#2e2400', '#423400'],
    lightColor: '#eebb00', accentColor: '#e6b800',
    visuals: { faceShape:'round', skinTone:'#9a5e2a', hairStyle:'waves', hairColor:'#b57830', eyeStyle:'normal', eyeColor:'#c0a000', facialHair:'goatee', clothing:'blazer', clothingColor:'#4a3a00', accessories:['chain'], neonCast:'#eebb00' },
  },
  {
    id: 37, name: 'Cyber Lounge Dealer', initials: 'CL', rarity: 'RARE', unlockXP: 22000,
    unlockCondition: 'Reach 22 000 XP',
    bio: 'Futuristic casino aesthetics. The future of dealing.',
    portraitColors: ['#001a1a', '#003030', '#004646'],
    lightColor: '#00eeee', accentColor: '#00e6e6',
    visuals: { faceShape:'heart', skinTone:'#f5c99a', hairStyle:'long', hairColor:'#00a8e0', eyeStyle:'almond', eyeColor:'#00a8c8', facialHair:'none', clothing:'turtleneck', clothingColor:'#001a1a', accessories:[], neonCast:'#00eeee' },
  },
  {
    id: 38, name: 'Oceanfront Millionaire', initials: 'OM', rarity: 'RARE', unlockXP: 23000,
    unlockCondition: 'Accumulate 500 000 chips',
    bio: 'Yacht poker. Miami dockside. Liquid assets.',
    portraitColors: ['#00141a', '#002233', '#003048'],
    lightColor: '#00ddee', accentColor: '#00ccdd',
    visuals: { faceShape:'angular', skinTone:'#d4956a', hairStyle:'undercut', hairColor:'#3b200f', eyeStyle:'sharp', eyeColor:'#4060a0', facialHair:'stubble', clothing:'blazer', clothingColor:'#1a1a2e', accessories:[], neonCast:'#00ddee' },
  },
  {
    id: 39, name: 'Vice Syndicate Player', initials: 'VZ', rarity: 'RARE', unlockXP: 24000,
    unlockCondition: 'Reach 24 000 XP',
    bio: 'The syndicate vouches for him. That\'s all you need to know.',
    portraitColors: ['#0a0018', '#15002d', '#200042'],
    lightColor: '#9944ff', accentColor: '#8000ff',
    visuals: { faceShape:'oval', skinTone:'#7a3e18', hairStyle:'fauxhawk', hairColor:'#1a0f08', eyeStyle:'sharp', eyeColor:'#6b4020', facialHair:'none', clothing:'suit', clothingColor:'#1a0a1a', accessories:[], neonCast:'#9944ff' },
  },
  {
    id: 40, name: 'Neon Skyline Boss', initials: 'NS', rarity: 'RARE', unlockXP: 25000,
    unlockCondition: 'Reach level 25',
    bio: 'City nightlife belongs to him. Neon everywhere.',
    portraitColors: ['#001428', '#001e3d', '#002852'],
    lightColor: '#00ddff', accentColor: '#00ccff',
    visuals: { faceShape:'round', skinTone:'#c07840', hairStyle:'curly', hairColor:'#1a0f08', eyeStyle:'wide', eyeColor:'#308060', facialHair:'none', clothing:'blazer', clothingColor:'#1a1a2e', accessories:['earring'], neonCast:'#00ddff' },
  },

  // ── EPIC (41–60) — Unlock: 30 000–80 000 XP ─────────────────────────────────

  {
    id: 41, name: 'Diamond Syndicate King', initials: 'DK', rarity: 'EPIC', unlockXP: 30000,
    unlockCondition: 'Reach level 30',
    bio: 'The diamond network spans every city. He built it.',
    portraitColors: ['#001030', '#001a50', '#002470'],
    lightColor: '#7799ff', accentColor: '#6699ff',
    visuals: { faceShape:'square', skinTone:'#e8b87a', hairStyle:'undercut', hairColor:'#3b200f', eyeStyle:'sharp', eyeColor:'#505050', facialHair:'none', clothing:'suit', clothingColor:'#0a0a14', accessories:['cyberpunk_visor'], neonCast:'#7799ff' },
  },
  {
    id: 42, name: 'The Neon Emperor', initials: 'NE', rarity: 'EPIC', unlockXP: 35000,
    unlockCondition: 'Win 200 hands total',
    bio: 'Futuristic Vegas royalty. The emperor\'s word is law.',
    portraitColors: ['#18002a', '#30004e', '#480072'],
    lightColor: '#dd33ff', accentColor: '#cc00ff',
    visuals: { faceShape:'angular', skinTone:'#d4956a', hairStyle:'slicked', hairColor:'#1a0f08', eyeStyle:'hooded', eyeColor:'#505050', facialHair:'none', clothing:'suit', clothingColor:'#1a0a1a', accessories:['sunglasses', 'chain'], neonCast:'#dd33ff' },
  },
  {
    id: 43, name: 'Royal Flush Assassin', initials: 'RA', rarity: 'EPIC', unlockXP: 40000,
    unlockCondition: 'Hit 3 royal flushes',
    bio: 'Cold. Calculated. Makes a royal flush look routine.',
    portraitColors: ['#180000', '#2f0000', '#460000'],
    lightColor: '#ff3333', accentColor: '#ff0000',
    visuals: { faceShape:'heart', skinTone:'#f5c99a', hairStyle:'long', hairColor:'#00a8e0', eyeStyle:'almond', eyeColor:'#00a8c8', facialHair:'none', clothing:'leather_jacket', clothingColor:'#0a0a14', accessories:['earring'], neonCast:'#ff3333' },
  },
  {
    id: 44, name: 'Crimson Casino Ghost', initials: 'CG', rarity: 'EPIC', unlockXP: 42000,
    unlockCondition: 'Reach 42 000 XP',
    bio: 'Appears from nowhere. Wins everything. Vanishes.',
    portraitColors: ['#1c0010', '#380020', '#540030'],
    lightColor: '#ff3377', accentColor: '#ff0066',
    visuals: { faceShape:'oval', skinTone:'#f5c99a', hairStyle:'waves', hairColor:'#c8c8c8', eyeStyle:'normal', eyeColor:'#505050', facialHair:'none', clothing:'suit', clothingColor:'#0a0a14', accessories:['glasses'], neonCast:'#ff3377' },
  },
  {
    id: 45, name: 'Midnight Penthouse Boss', initials: 'MP', rarity: 'EPIC', unlockXP: 45000,
    unlockCondition: 'Accumulate 1 000 000 chips',
    bio: 'The penthouse never closes. The game never ends.',
    portraitColors: ['#0d001c', '#1c0038', '#2b0054'],
    lightColor: '#aa55ff', accentColor: '#9933ff',
    visuals: { faceShape:'square', skinTone:'#9a5e2a', hairStyle:'slicked', hairColor:'#1a0f08', eyeStyle:'hooded', eyeColor:'#6b4020', facialHair:'goatee', clothing:'suit', clothingColor:'#1a0a1a', accessories:['chain'], neonCast:'#aa55ff' },
  },
  {
    id: 46, name: 'Cyber Mirage Tycoon', initials: 'CT', rarity: 'EPIC', unlockXP: 48000,
    unlockCondition: 'Reach level 35',
    bio: 'The casino is a hologram. The chips are very real.',
    portraitColors: ['#001a1c', '#003338', '#004c54'],
    lightColor: '#00ffee', accentColor: '#00ffe6',
    visuals: { faceShape:'round', skinTone:'#c07840', hairStyle:'bald', hairColor:'#1a0f08', eyeStyle:'normal', eyeColor:'#00a8c8', facialHair:'goatee', clothing:'leather_jacket', clothingColor:'#001a1a', accessories:['headset'], neonCast:'#00ffee' },
  },
  {
    id: 47, name: 'Chrome Phantom', initials: 'CP', rarity: 'EPIC', unlockXP: 50000,
    unlockCondition: 'Win 5 tournaments',
    bio: 'A legend with no face. Chrome everywhere. Identity: none.',
    portraitColors: ['#0a0a12', '#131323', '#1c1c34'],
    lightColor: '#aaaaff', accentColor: '#9999ff',
    visuals: { faceShape:'angular', skinTone:'#d4956a', hairStyle:'fauxhawk', hairColor:'#cc4400', eyeStyle:'sharp', eyeColor:'#c0a000', facialHair:'none', clothing:'leather_jacket', clothingColor:'#0a0a14', accessories:['cyberpunk_visor'], neonCast:'#aaaaff' },
  },
  {
    id: 48, name: 'The Silent Shark', initials: 'TS', rarity: 'EPIC', unlockXP: 52000,
    unlockCondition: 'Reach 52 000 XP',
    bio: 'Zero words. Maximum damage. The silence is the tell.',
    portraitColors: ['#05050f', '#0a0a1e', '#0f0f2d'],
    lightColor: '#7777ff', accentColor: '#6666ff',
    visuals: { faceShape:'oval', skinTone:'#e8b87a', hairStyle:'slicked', hairColor:'#c8c8c8', eyeStyle:'hooded', eyeColor:'#505050', facialHair:'mustache', clothing:'suit', clothingColor:'#1a1a1a', accessories:['chain'], neonCast:'#7777ff' },
  },
  {
    id: 49, name: 'Holographic Kingpin', initials: 'HK', rarity: 'EPIC', unlockXP: 55000,
    unlockCondition: 'Reach level 38',
    bio: 'Projects a different persona at every table. All of them win.',
    portraitColors: ['#001a2f', '#003358', '#004c81'],
    lightColor: '#00ffcc', accentColor: '#00ffcc',
    visuals: { faceShape:'square', skinTone:'#7a3e18', hairStyle:'dreads', hairColor:'#1a0f08', eyeStyle:'normal', eyeColor:'#308060', facialHair:'none', clothing:'blazer', clothingColor:'#0a0a14', accessories:['sunglasses'], neonCast:'#00ffcc' },
  },
  {
    id: 50, name: 'Neon Fortune Collector', initials: 'NF', rarity: 'EPIC', unlockXP: 58000,
    unlockCondition: 'Accumulate 2 000 000 chips',
    bio: 'Chips are trophies. He has the biggest collection.',
    portraitColors: ['#1a1200', '#332400', '#4c3600'],
    lightColor: '#ffee33', accentColor: '#ffdd00',
    visuals: { faceShape:'heart', skinTone:'#f5c99a', hairStyle:'curly', hairColor:'#d4b040', eyeStyle:'wide', eyeColor:'#4060a0', facialHair:'none', clothing:'blazer', clothingColor:'#4a3a00', accessories:['earring', 'crown'], neonCast:'#ffee33' },
  },
  {
    id: 51, name: 'Platinum Bluff Master', initials: 'PB', rarity: 'EPIC', unlockXP: 60000,
    unlockCondition: 'Reach 60 000 XP',
    bio: 'Every bet is a lie. Every lie is art.',
    portraitColors: ['#080808', '#141414', '#202020'],
    lightColor: '#ffffff', accentColor: '#ffffff',
    visuals: { faceShape:'oval', skinTone:'#f5c99a', hairStyle:'bob', hairColor:'#e8e0cc', eyeStyle:'almond', eyeColor:'#505050', facialHair:'none', clothing:'turtleneck', clothingColor:'#0a0a14', accessories:['glasses'], neonCast:'#ffffff' },
  },
  {
    id: 52, name: 'Royal Skyline Gambler', initials: 'RS', rarity: 'EPIC', unlockXP: 63000,
    unlockCondition: 'Win 10 tournaments',
    bio: 'High-rise luxury. Sky-high stakes. Royalty on every street.',
    portraitColors: ['#001026', '#001a40', '#00245a'],
    lightColor: '#2288ff', accentColor: '#0077ff',
    visuals: { faceShape:'angular', skinTone:'#c07840', hairStyle:'waves', hairColor:'#1a0f08', eyeStyle:'sharp', eyeColor:'#4060a0', facialHair:'stubble', clothing:'suit', clothingColor:'#1a1a2e', accessories:['sunglasses'], neonCast:'#2288ff' },
  },
  {
    id: 53, name: 'Diamond Lounge Predator', initials: 'DP', rarity: 'EPIC', unlockXP: 65000,
    unlockCondition: 'Reach level 42',
    bio: 'Hunts in the VIP lounge. Nobody safe at his table.',
    portraitColors: ['#001820', '#00303d', '#00485a'],
    lightColor: '#22bbee', accentColor: '#00b3e6',
    visuals: { faceShape:'square', skinTone:'#9a5e2a', hairStyle:'slicked', hairColor:'#888880', eyeStyle:'hooded', eyeColor:'#505050', facialHair:'beard', clothing:'suit', clothingColor:'#1a1a1a', accessories:[], neonCast:'#22bbee' },
  },
  {
    id: 54, name: 'Ocean Drive Emperor', initials: 'OE', rarity: 'EPIC', unlockXP: 67000,
    unlockCondition: 'Reach 67 000 XP',
    bio: 'Miami-bred empire. Ocean Drive is his kingdom.',
    portraitColors: ['#001428', '#001e3d', '#002852'],
    lightColor: '#1177ee', accentColor: '#0066cc',
    visuals: { faceShape:'oval', skinTone:'#d4956a', hairStyle:'undercut', hairColor:'#6b3a1f', eyeStyle:'normal', eyeColor:'#4060a0', facialHair:'none', clothing:'blazer', clothingColor:'#1a1a2e', accessories:['chain'], neonCast:'#1177ee' },
  },
  {
    id: 55, name: 'The Velvet Baron', initials: 'VB', rarity: 'EPIC', unlockXP: 70000,
    unlockCondition: 'Reach level 45',
    bio: 'Elegance is the ultimate weapon. He never shows a hand.',
    portraitColors: ['#1a001f', '#33003d', '#4c005c'],
    lightColor: '#cc33ff', accentColor: '#b300ff',
    visuals: { faceShape:'heart', skinTone:'#7a3e18', hairStyle:'slicked', hairColor:'#1a0f08', eyeStyle:'hooded', eyeColor:'#6b4020', facialHair:'goatee', clothing:'suit', clothingColor:'#1a0a1a', accessories:['chain'], neonCast:'#cc33ff' },
  },
  {
    id: 56, name: 'Blackout Syndicate Leader', initials: 'BL', rarity: 'EPIC', unlockXP: 72000,
    unlockCondition: 'Reach 72 000 XP',
    bio: 'The syndicate operates in total darkness. He is the darkness.',
    portraitColors: ['#000000', '#080808', '#101010'],
    lightColor: '#dd00dd', accentColor: '#cc00cc',
    visuals: { faceShape:'angular', skinTone:'#7a3e18', hairStyle:'bald', hairColor:'#1a0f08', eyeStyle:'sharp', eyeColor:'#505050', facialHair:'full_beard', clothing:'leather_jacket', clothingColor:'#0a0a14', accessories:['cyberpunk_visor'], neonCast:'#dd00dd' },
  },
  {
    id: 57, name: 'Future Vegas Legend', initials: 'FV', rarity: 'EPIC', unlockXP: 74000,
    unlockCondition: 'Reach 74 000 XP',
    bio: 'Retro-futuristic. The past and future collide at the table.',
    portraitColors: ['#001820', '#002e3d', '#00445a'],
    lightColor: '#00ccff', accentColor: '#00d4ff',
    visuals: { faceShape:'round', skinTone:'#e8b87a', hairStyle:'long', hairColor:'#cc0077', eyeStyle:'wide', eyeColor:'#4060a0', facialHair:'none', clothing:'open_shirt', clothingColor:'#001a1a', accessories:['earring'], neonCast:'#00ccff' },
  },
  {
    id: 58, name: 'Sapphire Card Assassin', initials: 'SA', rarity: 'EPIC', unlockXP: 76000,
    unlockCondition: 'Win 500 hands total',
    bio: 'Precision poker. Every decision, an elimination.',
    portraitColors: ['#000018', '#000030', '#000048'],
    lightColor: '#2255ff', accentColor: '#0044ff',
    visuals: { faceShape:'oval', skinTone:'#d4956a', hairStyle:'bob', hairColor:'#1a0f08', eyeStyle:'almond', eyeColor:'#4060a0', facialHair:'none', clothing:'turtleneck', clothingColor:'#001028', accessories:['glasses'], neonCast:'#2255ff' },
  },
  {
    id: 59, name: 'Neon Noir Millionaire', initials: 'NN', rarity: 'EPIC', unlockXP: 78000,
    unlockCondition: 'Reach level 48',
    bio: 'Dark cinematic persona. The millionaire you never see coming.',
    portraitColors: ['#0d000d', '#1f001f', '#310031'],
    lightColor: '#ff33ee', accentColor: '#ff00cc',
    visuals: { faceShape:'angular', skinTone:'#c07840', hairStyle:'fauxhawk', hairColor:'#9900cc', eyeStyle:'sharp', eyeColor:'#00a8c8', facialHair:'none', clothing:'leather_jacket', clothingColor:'#0d000d', accessories:['sunglasses'], neonCast:'#ff33ee' },
  },
  {
    id: 60, name: 'Chip Society Elite', initials: 'CE', rarity: 'EPIC', unlockXP: 80000,
    unlockCondition: 'Reach 80 000 XP',
    bio: 'The community recognizes greatness. This is yours.',
    portraitColors: ['#1a1100', '#332200', '#4c3300'],
    lightColor: '#ffaa33', accentColor: '#ff9900',
    visuals: { faceShape:'square', skinTone:'#9a5e2a', hairStyle:'slicked', hairColor:'#b57830', eyeStyle:'normal', eyeColor:'#c0a000', facialHair:'beard', clothing:'blazer', clothingColor:'#4a3a00', accessories:['chain'], neonCast:'#ffaa33' },
  },

  // ── LEGENDARY (61–80) — Unlock: 100 000–500 000 XP ──────────────────────────

  {
    id: 61, name: 'The Neon Godfather', initials: 'TG', rarity: 'LEGENDARY', unlockXP: 100000,
    unlockCondition: 'Reach level 50',
    bio: 'Every game in the city runs through him. Every single one.',
    portraitColors: ['#1a0900', '#3d1500', '#602100'],
    lightColor: '#ff7722', accentColor: '#ff6600',
    visuals: { faceShape:'angular', skinTone:'#e8b87a', hairStyle:'slicked', hairColor:'#c8c8c8', eyeStyle:'hooded', eyeColor:'#505050', facialHair:'goatee', clothing:'suit', clothingColor:'#d4c090', accessories:['sunglasses', 'chain'], neonCast:'#ff7722' },
  },
  {
    id: 62, name: 'Casino Empire Founder', initials: 'EF', rarity: 'LEGENDARY', unlockXP: 120000,
    unlockCondition: 'Reach 120 000 XP',
    bio: 'He didn\'t inherit the empire. He built it hand by hand.',
    portraitColors: ['#1a1100', '#4c3000', '#7f4f00'],
    lightColor: '#ffcc22', accentColor: '#ffbb00',
    visuals: { faceShape:'square', skinTone:'#c07840', hairStyle:'bald', hairColor:'#1a0f08', eyeStyle:'hooded', eyeColor:'#c0a000', facialHair:'full_beard', clothing:'suit', clothingColor:'#4a3a00', accessories:['crown'], neonCast:'#ffcc22' },
  },
  {
    id: 63, name: 'The Final Bluff', initials: 'FB', rarity: 'LEGENDARY', unlockXP: 140000,
    unlockCondition: 'Reach 140 000 XP',
    bio: 'Mythic. Undefeated. The bluff that ended careers.',
    portraitColors: ['#0d0000', '#280000', '#430000'],
    lightColor: '#ff3311', accentColor: '#ff2200',
    visuals: { faceShape:'oval', skinTone:'#f5c99a', hairStyle:'waves', hairColor:'#f0f0f0', eyeStyle:'hooded', eyeColor:'#505050', facialHair:'none', clothing:'suit', clothingColor:'#0a0a14', accessories:['cyberpunk_visor', 'chain'], neonCast:'#ff3311' },
  },
  {
    id: 64, name: 'Diamond Phantom King', initials: 'DK', rarity: 'LEGENDARY', unlockXP: 160000,
    unlockCondition: 'Win 1 000 hands total',
    bio: 'The ghost of diamond row. His presence alone empties tables.',
    portraitColors: ['#000e28', '#001c50', '#002a78'],
    lightColor: '#22aaff', accentColor: '#00aaff',
    visuals: { faceShape:'angular', skinTone:'#d4956a', hairStyle:'slicked', hairColor:'#f0f0f0', eyeStyle:'hooded', eyeColor:'#4060a0', facialHair:'full_beard', clothing:'suit', clothingColor:'#1a1a2e', accessories:['sunglasses', 'chain'], neonCast:'#22aaff' },
  },
  {
    id: 65, name: 'Royal Flush Emperor', initials: 'RE', rarity: 'LEGENDARY', unlockXP: 180000,
    unlockCondition: 'Reach level 55',
    bio: 'The Royal Flush is his signature. He signs every session.',
    portraitColors: ['#1a1200', '#4a3400', '#795600'],
    lightColor: '#ffe033', accentColor: '#ffd700',
    visuals: { faceShape:'square', skinTone:'#9a5e2a', hairStyle:'slicked', hairColor:'#d4b040', eyeStyle:'normal', eyeColor:'#c0a000', facialHair:'beard', clothing:'suit', clothingColor:'#4a3a00', accessories:['crown', 'chain'], neonCast:'#ffe033' },
  },
  {
    id: 66, name: 'Hologram Syndicate Boss', initials: 'HS', rarity: 'LEGENDARY', unlockXP: 200000,
    unlockCondition: 'Reach 200 000 XP',
    bio: 'Part man, part hologram. The cyberpunk overlord of poker.',
    portraitColors: ['#001a1a', '#004040', '#006666'],
    lightColor: '#00ffff', accentColor: '#00ffff',
    visuals: { faceShape:'heart', skinTone:'#f5c99a', hairStyle:'bob', hairColor:'#9900cc', eyeStyle:'almond', eyeColor:'#00a8c8', facialHair:'none', clothing:'turtleneck', clothingColor:'#001a1a', accessories:['cyberpunk_visor'], neonCast:'#00ffff' },
  },
  {
    id: 67, name: 'Black Diamond Shark', initials: 'BD', rarity: 'LEGENDARY', unlockXP: 220000,
    unlockCondition: 'Reach 220 000 XP',
    bio: 'The rarest gem. The deadliest predator. Black diamond standard.',
    portraitColors: ['#000000', '#080810', '#101020'],
    lightColor: '#9999ff', accentColor: '#8888ff',
    visuals: { faceShape:'angular', skinTone:'#7a3e18', hairStyle:'dreads', hairColor:'#c8c8c8', eyeStyle:'sharp', eyeColor:'#505050', facialHair:'goatee', clothing:'leather_jacket', clothingColor:'#0a0a14', accessories:[], neonCast:'#9999ff' },
  },
  {
    id: 68, name: 'Neon Casino Monarch', initials: 'NM', rarity: 'LEGENDARY', unlockXP: 250000,
    unlockCondition: 'Win 20 tournaments',
    bio: 'The neon crown is real. The kingdom is the entire strip.',
    portraitColors: ['#1c0038', '#3a0070', '#5800a8'],
    lightColor: '#dd44ff', accentColor: '#cc33ff',
    visuals: { faceShape:'round', skinTone:'#d4956a', hairStyle:'slicked', hairColor:'#9900cc', eyeStyle:'hooded', eyeColor:'#00a8c8', facialHair:'none', clothing:'suit', clothingColor:'#1a0a1a', accessories:['crown', 'chain'], neonCast:'#dd44ff' },
  },
  {
    id: 69, name: 'Infinite Chip Tycoon', initials: 'IC', rarity: 'LEGENDARY', unlockXP: 280000,
    unlockCondition: 'Accumulate 10 000 000 chips',
    bio: 'The stack never ends. Infinite patience. Infinite chips.',
    portraitColors: ['#1a1400', '#503d00', '#866600'],
    lightColor: '#ffdd22', accentColor: '#ffcc00',
    visuals: { faceShape:'square', skinTone:'#c07840', hairStyle:'undercut', hairColor:'#d4b040', eyeStyle:'normal', eyeColor:'#c0a000', facialHair:'beard', clothing:'blazer', clothingColor:'#4a3a00', accessories:['crown', 'chain'], neonCast:'#ffdd22' },
  },
  {
    id: 70, name: 'Crimson Skyline King', initials: 'CK', rarity: 'LEGENDARY', unlockXP: 300000,
    unlockCondition: 'Reach 300 000 XP',
    bio: 'The city bleeds red when he wins. He always wins.',
    portraitColors: ['#1e0000', '#600000', '#9c0000'],
    lightColor: '#ff2200', accentColor: '#ff1100',
    visuals: { faceShape:'angular', skinTone:'#e8b87a', hairStyle:'slicked', hairColor:'#8b2500', eyeStyle:'sharp', eyeColor:'#c0a000', facialHair:'mustache', clothing:'suit', clothingColor:'#6b0000', accessories:['sunglasses', 'chain'], neonCast:'#ff2200' },
  },
  {
    id: 71, name: 'Vice City Legend', initials: 'VG', rarity: 'LEGENDARY', unlockXP: 320000,
    unlockCondition: 'Reach level 65',
    bio: 'The retro-nightlife icon. Vice City made him. He made Vice City.',
    portraitColors: ['#0d0018', '#260040', '#3f0068'],
    lightColor: '#aa22ff', accentColor: '#9900ff',
    visuals: { faceShape:'oval', skinTone:'#9a5e2a', hairStyle:'fauxhawk', hairColor:'#9900cc', eyeStyle:'hooded', eyeColor:'#6b4020', facialHair:'none', clothing:'leather_jacket', clothingColor:'#0a0a14', accessories:['chain'], neonCast:'#aa22ff' },
  },
  {
    id: 72, name: 'Sapphire Mirage Emperor', initials: 'SM', rarity: 'LEGENDARY', unlockXP: 350000,
    unlockCondition: 'Reach 350 000 XP',
    bio: 'Holographic luxury. The mirage is real to everyone but him.',
    portraitColors: ['#00081f', '#001060', '#0018a0'],
    lightColor: '#2255ff', accentColor: '#0044ff',
    visuals: { faceShape:'square', skinTone:'#c07840', hairStyle:'bald', hairColor:'#1a0f08', eyeStyle:'hooded', eyeColor:'#4060a0', facialHair:'full_beard', clothing:'suit', clothingColor:'#001028', accessories:['cyberpunk_visor', 'chain'], neonCast:'#2255ff' },
  },
  {
    id: 73, name: 'The Last High Roller', initials: 'LH', rarity: 'LEGENDARY', unlockXP: 370000,
    unlockCondition: 'Play 2 000 hands total',
    bio: 'When the last table closes, he\'s still playing.',
    portraitColors: ['#1a1a00', '#4d4d00', '#808000'],
    lightColor: '#ffff33', accentColor: '#ffff00',
    visuals: { faceShape:'heart', skinTone:'#d4956a', hairStyle:'waves', hairColor:'#b57830', eyeStyle:'normal', eyeColor:'#c0a000', facialHair:'goatee', clothing:'blazer', clothingColor:'#4a3a00', accessories:['crown', 'sunglasses'], neonCast:'#ffff33' },
  },
  {
    id: 74, name: 'Platinum Empire Boss', initials: 'PE', rarity: 'LEGENDARY', unlockXP: 390000,
    unlockCondition: 'Reach 390 000 XP',
    bio: 'Platinum-plated everything. The empire runs on precision.',
    portraitColors: ['#0a0a0a', '#181818', '#262626'],
    lightColor: '#eeeeee', accentColor: '#e6e6e6',
    visuals: { faceShape:'oval', skinTone:'#f5c99a', hairStyle:'slicked', hairColor:'#c8c8c8', eyeStyle:'hooded', eyeColor:'#505050', facialHair:'mustache', clothing:'suit', clothingColor:'#1a1a1a', accessories:['headset', 'chain'], neonCast:'#eeeeee' },
  },
  {
    id: 75, name: 'Cyber Vegas Overlord', initials: 'CV', rarity: 'LEGENDARY', unlockXP: 400000,
    unlockCondition: 'Reach level 70',
    bio: 'The future of Vegas is neon and chrome. He designed it.',
    portraitColors: ['#001428', '#003a73', '#006bbf'],
    lightColor: '#22aaff', accentColor: '#0099ff',
    visuals: { faceShape:'angular', skinTone:'#9a5e2a', hairStyle:'undercut', hairColor:'#00a8e0', eyeStyle:'sharp', eyeColor:'#00a8c8', facialHair:'none', clothing:'suit', clothingColor:'#1a1a2e', accessories:['cyberpunk_visor', 'chain'], neonCast:'#22aaff' },
  },
  {
    id: 76, name: 'Emerald Cartel Boss', initials: 'EB', rarity: 'LEGENDARY', unlockXP: 420000,
    unlockCondition: 'Win 500 hands in ranked',
    bio: 'The emerald empire spans six continents. She built every last club.',
    portraitColors: ['#001a0d', '#003319', '#004d26'],
    lightColor: '#00ff88', accentColor: '#00ee77',
    visuals: { faceShape:'round', skinTone:'#7a3e18', hairStyle:'curly', hairColor:'#00aa44', eyeStyle:'wide', eyeColor:'#308060', facialHair:'none', clothing:'blazer', clothingColor:'#0a0a14', accessories:['crown', 'earring'], neonCast:'#00ff88' },
  },
  {
    id: 77, name: 'Gold Rush Sovereign', initials: 'GS', rarity: 'LEGENDARY', unlockXP: 440000,
    unlockCondition: 'Reach 440 000 XP',
    bio: 'Gold in every pocket. Royalty in every movement.',
    portraitColors: ['#1a1400', '#5c4a00', '#9e8000'],
    lightColor: '#ffe066', accentColor: '#ffd700',
    visuals: { faceShape:'heart', skinTone:'#f5c99a', hairStyle:'long', hairColor:'#e8e0cc', eyeStyle:'wide', eyeColor:'#4060a0', facialHair:'none', clothing:'blazer', clothingColor:'#d4c090', accessories:['crown', 'chain', 'earring'], neonCast:'#ffe066' },
  },
  {
    id: 78, name: 'Shadow Overlord', initials: 'SO', rarity: 'LEGENDARY', unlockXP: 460000,
    unlockCondition: 'Win every game mode at least once',
    bio: 'Commands the darkness. Neon blue streak cuts through the night.',
    portraitColors: ['#000818', '#001030', '#001848'],
    lightColor: '#0044ff', accentColor: '#0033ff',
    visuals: { faceShape:'square', skinTone:'#d4956a', hairStyle:'mohawk', hairColor:'#00a8e0', eyeStyle:'sharp', eyeColor:'#00a8c8', facialHair:'none', clothing:'leather_jacket', clothingColor:'#0a0a14', accessories:['headset', 'chain'], neonCast:'#0044ff' },
  },
  {
    id: 79, name: 'The Eternal Dealer', initials: 'ED', rarity: 'LEGENDARY', unlockXP: 480000,
    unlockCondition: 'Reach 480 000 XP',
    bio: 'Has dealt every hand. Has seen every face. Still here.',
    portraitColors: ['#1a1500', '#4a3c00', '#7a6300'],
    lightColor: '#ffcc00', accentColor: '#ffbb00',
    visuals: { faceShape:'angular', skinTone:'#e8b87a', hairStyle:'slicked', hairColor:'#f0f0f0', eyeStyle:'hooded', eyeColor:'#c0a000', facialHair:'full_beard', clothing:'suit', clothingColor:'#d4c090', accessories:['crown', 'chain'], neonCast:'#ffcc00' },
  },
  {
    id: 80, name: 'Neon Dynasty Queen', initials: 'NQ', rarity: 'LEGENDARY', unlockXP: 500000,
    unlockCondition: 'Reach 500 000 XP — the absolute peak',
    bio: 'The dynasty ends and begins with her. Neon pink. Absolute power.',
    portraitColors: ['#1a0010', '#4d0030', '#800050'],
    lightColor: '#ff0090', accentColor: '#ff0090',
    visuals: { faceShape:'oval', skinTone:'#f5c99a', hairStyle:'long', hairColor:'#cc0077', eyeStyle:'almond', eyeColor:'#cc0066', facialHair:'none', clothing:'blazer', clothingColor:'#0a0a14', accessories:['crown', 'chain', 'earring'], neonCast:'#ff0090' },
  },
];
