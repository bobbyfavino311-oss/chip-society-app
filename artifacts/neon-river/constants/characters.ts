// ─── CHIP SOCIETY — 40 Premium Character Portraits ────────────────────────────
// Each character is a fully illustrated cinematic portrait.
// Tiers: 10 COMMON · 10 RARE · 10 EPIC · 10 LEGENDARY

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
  RARE:      '#4db8ff',
  EPIC:      '#bf5fff',
  LEGENDARY: '#ffd700',
};

export const RARITY_GLOW: Record<Rarity, string> = {
  COMMON:    '#a0b8cc40',
  RARE:      '#4db8ff55',
  EPIC:      '#bf5fff66',
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

  // ── COMMON (1–10) — Early progression, easy to unlock ───────────────────────

  {
    id: 1, name: 'The Rookie', initials: 'RK', rarity: 'COMMON', unlockXP: 0,
    unlockCondition: 'Available from the start',
    bio: 'First night at the table. Every legend started exactly here.',
    portraitColors: ['#0a1018', '#141e28', '#1e2c38'],
    lightColor: '#00d4ff', accentColor: '#00d4ff',
  },
  {
    id: 2, name: 'The Sports Bettor', initials: 'SB', rarity: 'COMMON', unlockXP: 0,
    unlockCondition: 'Available from the start',
    bio: 'Read every spread. Now reading every face across the felt.',
    portraitColors: ['#0a1200', '#141e00', '#1e2c00'],
    lightColor: '#88cc00', accentColor: '#77bb00',
  },
  {
    id: 3, name: 'The Waitress', initials: 'WA', rarity: 'COMMON', unlockXP: 200,
    unlockCondition: 'Play your first hand',
    bio: 'Served every whale in Vegas. Now she\'s the one they have to beat.',
    portraitColors: ['#180010', '#280020', '#380030'],
    lightColor: '#ff66aa', accentColor: '#ff44aa',
  },
  {
    id: 4, name: 'The College Grinder', initials: 'CG', rarity: 'COMMON', unlockXP: 400,
    unlockCondition: 'Win your first hand',
    bio: 'Studied the odds before the exams. Poker is the real degree.',
    portraitColors: ['#001020', '#001830', '#002040'],
    lightColor: '#4499ff', accentColor: '#3388ff',
  },
  {
    id: 5, name: 'The Club Promoter', initials: 'CP', rarity: 'COMMON', unlockXP: 600,
    unlockCondition: 'Reach 600 XP',
    bio: 'Knows every door, every list, every VIP. The table is just another room to run.',
    portraitColors: ['#1a0018', '#280028', '#360038'],
    lightColor: '#ff44ff', accentColor: '#ee33ee',
  },
  {
    id: 6, name: 'The Poker Blogger', initials: 'PB', rarity: 'COMMON', unlockXP: 800,
    unlockCondition: 'Post to the social feed',
    bio: 'Documents every session for a million followers. Win or lose, it\'s content.',
    portraitColors: ['#001818', '#002828', '#003838'],
    lightColor: '#00cccc', accentColor: '#00bbbb',
  },
  {
    id: 7, name: 'The Local Regular', initials: 'LR', rarity: 'COMMON', unlockXP: 1000,
    unlockCondition: 'Reach level 3',
    bio: 'Every dealer knows the name. Every player knows the face. Still winning.',
    portraitColors: ['#100800', '#201400', '#302000'],
    lightColor: '#cc8800', accentColor: '#bb7700',
  },
  {
    id: 8, name: 'The Side Hustler', initials: 'SH', rarity: 'COMMON', unlockXP: 1200,
    unlockCondition: 'Reach 1 200 XP',
    bio: 'Street-smart with a second income. The table is the best side hustle there is.',
    portraitColors: ['#0c0c0c', '#181818', '#242424'],
    lightColor: '#cccccc', accentColor: '#bbbbbb',
  },
  {
    id: 9, name: 'The Bartender', initials: 'BT', rarity: 'COMMON', unlockXP: 1500,
    unlockCondition: 'Play 25 hands',
    bio: 'Mixed drinks for every high roller in the room. Now mixing up their games.',
    portraitColors: ['#0a0820', '#141233', '#1e1c46'],
    lightColor: '#8888ff', accentColor: '#7777ee',
  },
  {
    id: 10, name: 'The Weekend Warrior', initials: 'WW', rarity: 'COMMON', unlockXP: 2000,
    unlockCondition: 'Win 10 hands',
    bio: 'Monday through Friday is a job. The weekend is where real money moves.',
    portraitColors: ['#001a08', '#002812', '#00361c'],
    lightColor: '#00ee66', accentColor: '#00dd55',
  },

  // ── RARE (11–20) — Mid progression, moderate to unlock ──────────────────────

  {
    id: 11, name: 'The Bookie', initials: 'BK', rarity: 'RARE', unlockXP: 5000,
    unlockCondition: 'Win 50 hands',
    bio: 'Runs the action on three sports and a poker room. The house always wins — when it\'s his house.',
    portraitColors: ['#080812', '#10101e', '#18182a'],
    lightColor: '#9999ff', accentColor: '#8888ee',
  },
  {
    id: 12, name: 'The Car Dealer', initials: 'CD', rarity: 'RARE', unlockXP: 6000,
    unlockCondition: 'Reach level 10',
    bio: 'Moved Ferraris before lunch. Reads buyers the same way he reads poker tells.',
    portraitColors: ['#060606', '#101010', '#1a1a1a'],
    lightColor: '#dddddd', accentColor: '#cccccc',
  },
  {
    id: 13, name: 'The Watch Dealer', initials: 'WD', rarity: 'RARE', unlockXP: 7000,
    unlockCondition: 'Win 3 games in a row',
    bio: 'Every Rolex at this table came through him. His tells are as rare as his inventory.',
    portraitColors: ['#10080a', '#1e1012', '#2c181c'],
    lightColor: '#ffaaaa', accentColor: '#ff9999',
  },
  {
    id: 14, name: 'The Poker Streamer', initials: 'PS', rarity: 'RARE', unlockXP: 8500,
    unlockCondition: 'Reach 8 500 XP',
    bio: '200k live viewers every session. The chat never stops. Neither does he.',
    portraitColors: ['#160020', '#240030', '#320040'],
    lightColor: '#cc44ff', accentColor: '#bb22ee',
  },
  {
    id: 15, name: 'The Yacht Owner', initials: 'YO', rarity: 'RARE', unlockXP: 10000,
    unlockCondition: 'Accumulate 100 000 chips',
    bio: 'The real games happen on the water, past the harbor lights. No cameras. No limits.',
    portraitColors: ['#001020', '#001830', '#002040'],
    lightColor: '#55ccff', accentColor: '#44bbff',
  },
  {
    id: 16, name: 'The Casino Hostess', initials: 'CH', rarity: 'RARE', unlockXP: 11500,
    unlockCondition: 'Reach level 15',
    bio: 'Knows every whale\'s limit and every player\'s weakness. Tonight she uses both.',
    portraitColors: ['#1a0010', '#280018', '#360020'],
    lightColor: '#ff5599', accentColor: '#ff3388',
  },
  {
    id: 17, name: 'The Nightclub Manager', initials: 'NM', rarity: 'RARE', unlockXP: 13000,
    unlockCondition: 'Reach 13 000 XP',
    bio: 'Managed the most exclusive rooms in Miami. The poker table is just another velvet rope.',
    portraitColors: ['#0a0018', '#140028', '#1e0038'],
    lightColor: '#aa55ff', accentColor: '#9944ee',
  },
  {
    id: 18, name: 'The Crypto Investor', initials: 'CI', rarity: 'RARE', unlockXP: 14500,
    unlockCondition: 'Win 100 hands',
    bio: 'Turned digital assets into a lifestyle. Converting them one pot at a time.',
    portraitColors: ['#001428', '#001e3d', '#002852'],
    lightColor: '#0099ff', accentColor: '#0088ee',
  },
  {
    id: 19, name: 'The Real Estate Shark', initials: 'RS', rarity: 'RARE', unlockXP: 16000,
    unlockCondition: 'Reach 16 000 XP',
    bio: 'Closed deals worth more than most poker prize pools. Every bluff is a negotiation.',
    portraitColors: ['#0a0a14', '#141420', '#1e1e2c'],
    lightColor: '#8899cc', accentColor: '#7788bb',
  },
  {
    id: 20, name: 'The High Stakes Regular', initials: 'HR', rarity: 'RARE', unlockXP: 18000,
    unlockCondition: 'Reach level 20',
    bio: 'The minimum here is everyone else\'s maximum. He\'s been playing this level for years.',
    portraitColors: ['#001020', '#001830', '#002040'],
    lightColor: '#66aaff', accentColor: '#5599ff',
  },

  // ── EPIC (21–30) — Advanced progression, hard to unlock ─────────────────────

  {
    id: 21, name: 'The Bluff Artist', initials: 'BA', rarity: 'EPIC', unlockXP: 30000,
    unlockCondition: 'Win a tournament',
    bio: 'Every raise is theater. Every fold is a trap. Nobody has ever read him correctly.',
    portraitColors: ['#18001a', '#280028', '#380038'],
    lightColor: '#cc44cc', accentColor: '#bb33bb',
  },
  {
    id: 22, name: 'The Underground King', initials: 'UK', rarity: 'EPIC', unlockXP: 35000,
    unlockCondition: 'Accumulate 500 000 chips',
    bio: 'Owns the game below street level. Every chip in this room has his fingerprints on it.',
    portraitColors: ['#100818', '#1c1228', '#282038'],
    lightColor: '#9966ff', accentColor: '#8855ee',
  },
  {
    id: 23, name: 'The Tournament Crusher', initials: 'TC', rarity: 'EPIC', unlockXP: 40000,
    unlockCondition: 'Reach level 25',
    bio: 'Twelve final tables. Eight victories. The circuit knows not to put him on your table.',
    portraitColors: ['#100800', '#201200', '#301c00'],
    lightColor: '#ff8800', accentColor: '#ff7700',
  },
  {
    id: 24, name: 'The Diamond Club VIP', initials: 'DV', rarity: 'EPIC', unlockXP: 45000,
    unlockCondition: 'Reach 45 000 XP',
    bio: 'Invitation-only member. The diamond card opens doors most people don\'t know exist.',
    portraitColors: ['#001828', '#002038', '#002848'],
    lightColor: '#77ccff', accentColor: '#66bbff',
  },
  {
    id: 25, name: 'The Poker Influencer', initials: 'PI', rarity: 'EPIC', unlockXP: 50000,
    unlockCondition: 'Reach ranked elite status',
    bio: 'Ten million followers. Every session is a performance. Every pot is a headline.',
    portraitColors: ['#1a0008', '#280012', '#36001c'],
    lightColor: '#ff3388', accentColor: '#ff2277',
  },
  {
    id: 26, name: 'The Miami Millionaire', initials: 'MM', rarity: 'EPIC', unlockXP: 55000,
    unlockCondition: 'Win 500 hands total',
    bio: 'Built in Brickell. Built at the table. The tan never fades and neither does the bankroll.',
    portraitColors: ['#001818', '#002828', '#003838'],
    lightColor: '#00ddcc', accentColor: '#00ccbb',
  },
  {
    id: 27, name: 'The Penthouse Queen', initials: 'PQ', rarity: 'EPIC', unlockXP: 60000,
    unlockCondition: 'Reach 60 000 XP',
    bio: 'Sky-high stakes. Sky-high standards. Nobody walks away from her table without a lesson.',
    portraitColors: ['#1a0018', '#280028', '#360038'],
    lightColor: '#ff55ff', accentColor: '#ee44ee',
  },
  {
    id: 28, name: 'The Syndicate Boss', initials: 'SB', rarity: 'EPIC', unlockXP: 65000,
    unlockCondition: 'Win 5 tournaments',
    bio: 'The network runs through him. Every private game, every backroom deal. His.',
    portraitColors: ['#10000a', '#1e0012', '#2c001c'],
    lightColor: '#ff2244', accentColor: '#ff1133',
  },
  {
    id: 29, name: 'The Vegas Celebrity', initials: 'VC', rarity: 'EPIC', unlockXP: 70000,
    unlockCondition: 'Win 10 tournaments',
    bio: 'Billboard on the Strip. Face on the marquee. The felt is where the real fame happens.',
    portraitColors: ['#100a00', '#1e1400', '#2c1e00'],
    lightColor: '#ffcc00', accentColor: '#ffbb00',
  },
  {
    id: 30, name: 'The Black Card Holder', initials: 'BC', rarity: 'EPIC', unlockXP: 75000,
    unlockCondition: 'Complete all achievements',
    bio: 'No limit printed on the card. No limit visible at the table. Just results.',
    portraitColors: ['#060606', '#0e0e0e', '#161616'],
    lightColor: '#dddddd', accentColor: '#cccccc',
  },

  // ── LEGENDARY (31–40) — Elite progression, extremely hard to earn ────────────

  {
    id: 31, name: 'The Godfather', initials: 'GF', rarity: 'LEGENDARY', unlockXP: 100000,
    unlockCondition: 'Reach level 50',
    bio: 'The original architect. Every underground game in this city exists because of one decision he made.',
    portraitColors: ['#040404', '#080808', '#0c0c0c'],
    lightColor: '#ffd700', accentColor: '#ffcc00',
  },
  {
    id: 32, name: 'The Vegas Phantom', initials: 'VP', rarity: 'LEGENDARY', unlockXP: 125000,
    unlockCondition: 'Win the leaderboard',
    bio: 'No name on the records. No face on the cameras. Only the winnings remain as proof.',
    portraitColors: ['#060010', '#0c0020', '#120030'],
    lightColor: '#cc99ff', accentColor: '#bb88ff',
  },
  {
    id: 33, name: 'The Casino Emperor', initials: 'CE', rarity: 'LEGENDARY', unlockXP: 150000,
    unlockCondition: 'Reach 150 000 XP',
    bio: 'Owns the house. Sets the rules. Still plays every night because nobody else is worth watching.',
    portraitColors: ['#0a0500', '#141000', '#1e1500'],
    lightColor: '#ff8800', accentColor: '#ff7700',
  },
  {
    id: 34, name: 'The Billionaire Whale', initials: 'BW', rarity: 'LEGENDARY', unlockXP: 175000,
    unlockCondition: 'Win a championship',
    bio: 'The minimum buy-in here is everyone else\'s maximum. He\'s been here since opening.',
    portraitColors: ['#001428', '#001e3d', '#002852'],
    lightColor: '#55ddff', accentColor: '#44ccff',
  },
  {
    id: 35, name: 'The Diamond Emperor', initials: 'DE', rarity: 'LEGENDARY', unlockXP: 200000,
    unlockCondition: 'Reach 200 000 XP',
    bio: 'Empire built hand by hand. Diamond in every pocket. The crown is earned, not given.',
    portraitColors: ['#0c0800', '#181200', '#241c00'],
    lightColor: '#ffd700', accentColor: '#ffcc00',
  },
  {
    id: 36, name: 'The Midnight King', initials: 'MK', rarity: 'LEGENDARY', unlockXP: 225000,
    unlockCondition: 'Reach 225 000 XP',
    bio: 'Runs the only game that matters, the one nobody talks about after midnight.',
    portraitColors: ['#080018', '#100028', '#180038'],
    lightColor: '#9966ff', accentColor: '#8855ee',
  },
  {
    id: 37, name: 'The Final Bluff', initials: 'FB', rarity: 'LEGENDARY', unlockXP: 250000,
    unlockCondition: 'Long-term ranked progression',
    bio: 'One hand. Everything on the table. He moved all-in. Everyone else folded.',
    portraitColors: ['#001208', '#001e12', '#002a1c'],
    lightColor: '#00ff88', accentColor: '#00ee77',
  },
  {
    id: 38, name: 'The Society Founder', initials: 'SF', rarity: 'LEGENDARY', unlockXP: 300000,
    unlockCondition: 'Massive chip milestones',
    bio: 'Chip Society was built on his vision. The rules exist because he wrote them.',
    portraitColors: ['#0c0800', '#181200', '#241c00'],
    lightColor: '#ddbb44', accentColor: '#ccaa33',
  },
  {
    id: 39, name: 'The Table Tyrant', initials: 'TT', rarity: 'LEGENDARY', unlockXP: 375000,
    unlockCondition: 'Social prestige milestone',
    bio: 'Controls every table he sits at. The psychological pressure alone clears the room.',
    portraitColors: ['#080008', '#100010', '#180018'],
    lightColor: '#ff00ff', accentColor: '#ee00ee',
  },
  {
    id: 40, name: 'The Poker Community Legend', initials: 'PL', rarity: 'LEGENDARY', unlockXP: 500000,
    unlockCondition: 'The rarest character — maximum social prestige and XP',
    bio: 'The pinnacle of Chip Society. The rarest face at any table. Everyone knows the name. Nobody forgets the game.',
    portraitColors: ['#0a0800', '#141000', '#1e1800'],
    lightColor: '#ffd700', accentColor: '#ffcc00',
  },
];
