// ─── Premium Avatar System — 100 collectible player portraits ─────────────────

export type AvatarRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export type AvatarCategory =
  | 'High Rollers'
  | 'Poker Sharks'
  | 'Casino Bosses'
  | 'Neon Cyberpunk'
  | 'Luxury VIP'
  | 'Underground Legends'
  | 'Retro 80s'
  | 'Modern Influencers'
  | 'Elite Bluff Masters'
  | 'Vegas Nightlife';

export interface PremiumAvatar {
  id: number;
  name: string;
  emoji: string;
  category: AvatarCategory;
  rarity: AvatarRarity;
  gradient: [string, string, string];
  accentColor: string;
  unlockXP: number;
}

export const RARITY_COLORS: Record<AvatarRarity, string> = {
  COMMON:    '#a0b0c0',
  RARE:      '#bf5fff',
  EPIC:      '#ff6600',
  LEGENDARY: '#ffd700',
};

export const RARITY_GLOW: Record<AvatarRarity, string> = {
  COMMON:    '#a0b0c040',
  RARE:      '#bf5fff55',
  EPIC:      '#ff660066',
  LEGENDARY: '#ffd70088',
};

export const UNLOCK_XP: Record<AvatarRarity, number> = {
  COMMON:    0,
  RARE:      500,
  EPIC:      2000,
  LEGENDARY: 8000,
};

export const AVATAR_CATEGORIES: AvatarCategory[] = [
  'High Rollers', 'Poker Sharks', 'Casino Bosses', 'Neon Cyberpunk',
  'Luxury VIP', 'Underground Legends', 'Retro 80s', 'Modern Influencers',
  'Elite Bluff Masters', 'Vegas Nightlife',
];

export const PREMIUM_AVATARS: PremiumAvatar[] = [
  // ── High Rollers ────────────────────────────────────────────────────────────
  { id:  0, name: 'Neon Aviator',          emoji: '🕶️',  category: 'High Rollers',       rarity: 'COMMON',    gradient: ['#1a1200', '#2c1e00', '#3a2800'], accentColor: '#ffd700', unlockXP: 0    },
  { id:  1, name: 'High-Stakes CEO',        emoji: '💼',  category: 'High Rollers',       rarity: 'COMMON',    gradient: ['#120a00', '#201400', '#2e1e00'], accentColor: '#e8a020', unlockXP: 0    },
  { id:  2, name: 'Silver Fox',             emoji: '🎩',  category: 'High Rollers',       rarity: 'COMMON',    gradient: ['#181820', '#222235', '#2c2c45'], accentColor: '#a0c0ff', unlockXP: 0    },
  { id:  3, name: 'Gold Chain Gambler',     emoji: '⛓️',  category: 'High Rollers',       rarity: 'RARE',      gradient: ['#1a1000', '#2a1800', '#3a2200'], accentColor: '#ffd700', unlockXP: 500  },
  { id:  4, name: 'Diamond Ring Roller',   emoji: '💍',  category: 'High Rollers',       rarity: 'RARE',      gradient: ['#0a1020', '#10182e', '#162040'], accentColor: '#80d0ff', unlockXP: 500  },
  { id:  5, name: 'Ocean Drive Millionaire',emoji: '🛥️',  category: 'High Rollers',       rarity: 'RARE',      gradient: ['#001428', '#001e3a', '#002850'], accentColor: '#00c8ff', unlockXP: 500  },
  { id:  6, name: 'Jetsetter Poker Pro',   emoji: '✈️',  category: 'High Rollers',       rarity: 'EPIC',      gradient: ['#0a0820', '#100c30', '#181240'], accentColor: '#bf5fff', unlockXP: 2000 },
  { id:  7, name: 'Platinum Roller',        emoji: '🏆',  category: 'High Rollers',       rarity: 'EPIC',      gradient: ['#101828', '#182438', '#202e48'], accentColor: '#a0f0ff', unlockXP: 2000 },
  { id:  8, name: 'Billion Dollar Gambler', emoji: '💎',  category: 'High Rollers',       rarity: 'LEGENDARY', gradient: ['#1a1400', '#2c2200', '#3e3000'], accentColor: '#ffd700', unlockXP: 8000 },
  { id:  9, name: 'Chip Society Founder',  emoji: '♠️',  category: 'High Rollers',       rarity: 'LEGENDARY', gradient: ['#0a0018', '#140028', '#1e003a'], accentColor: '#ffd700', unlockXP: 8000 },

  // ── Poker Sharks ────────────────────────────────────────────────────────────
  { id: 10, name: 'River King',            emoji: '🃏',  category: 'Poker Sharks',       rarity: 'COMMON',    gradient: ['#001828', '#002038', '#002848'], accentColor: '#00d4ff', unlockXP: 0    },
  { id: 11, name: 'Card Hustler',          emoji: '🎴',  category: 'Poker Sharks',       rarity: 'COMMON',    gradient: ['#001020', '#00182e', '#00203c'], accentColor: '#00b8e8', unlockXP: 0    },
  { id: 12, name: 'Ice-Cold Bluff',        emoji: '🧊',  category: 'Poker Sharks',       rarity: 'COMMON',    gradient: ['#002838', '#003448', '#004058'], accentColor: '#60e8ff', unlockXP: 0    },
  { id: 13, name: 'All-In Maverick',       emoji: '🤞',  category: 'Poker Sharks',       rarity: 'RARE',      gradient: ['#001418', '#001e24', '#002830'], accentColor: '#00ccaa', unlockXP: 500  },
  { id: 14, name: 'Velvet Suit Shark',     emoji: '🦈',  category: 'Poker Sharks',       rarity: 'RARE',      gradient: ['#00101a', '#001a28', '#002436'], accentColor: '#00d4ff', unlockXP: 500  },
  { id: 15, name: 'Elite Grinder',         emoji: '🎯',  category: 'Poker Sharks',       rarity: 'RARE',      gradient: ['#001020', '#001830', '#002040'], accentColor: '#4080ff', unlockXP: 500  },
  { id: 16, name: 'Silent Caller',         emoji: '🤫',  category: 'Poker Sharks',       rarity: 'EPIC',      gradient: ['#000c18', '#001020', '#001830'], accentColor: '#00d4ff', unlockXP: 2000 },
  { id: 17, name: 'Holographic Master',   emoji: '🔮',  category: 'Poker Sharks',       rarity: 'EPIC',      gradient: ['#0a0018', '#100028', '#180038'], accentColor: '#bf5fff', unlockXP: 2000 },
  { id: 18, name: 'Poker Night Phantom',  emoji: '👤',  category: 'Poker Sharks',       rarity: 'LEGENDARY', gradient: ['#000810', '#000c18', '#001020'], accentColor: '#00ffee', unlockXP: 8000 },
  { id: 19, name: 'The Last River',       emoji: '🌊',  category: 'Poker Sharks',       rarity: 'LEGENDARY', gradient: ['#000a20', '#001030', '#001840'], accentColor: '#00d4ff', unlockXP: 8000 },

  // ── Casino Bosses ────────────────────────────────────────────────────────────
  { id: 20, name: 'Luxury Casino Host',   emoji: '🎰',  category: 'Casino Bosses',      rarity: 'COMMON',    gradient: ['#1a0008', '#260010', '#320018'], accentColor: '#ff2244', unlockXP: 0    },
  { id: 21, name: 'Miami Vice Dealer',    emoji: '🌴',  category: 'Casino Bosses',      rarity: 'COMMON',    gradient: ['#0e0010', '#160018', '#200024'], accentColor: '#ff0090', unlockXP: 0    },
  { id: 22, name: 'Black Suit Assassin',  emoji: '🖤',  category: 'Casino Bosses',      rarity: 'COMMON',    gradient: ['#100010', '#180018', '#200020'], accentColor: '#cc0055', unlockXP: 0    },
  { id: 23, name: 'Vintage Mob Boss',     emoji: '🤵',  category: 'Casino Bosses',      rarity: 'RARE',      gradient: ['#140008', '#200010', '#2c0018'], accentColor: '#ff4466', unlockXP: 500  },
  { id: 24, name: 'Casino Architect',     emoji: '🏗️',  category: 'Casino Bosses',      rarity: 'RARE',      gradient: ['#100008', '#1c0010', '#280018'], accentColor: '#ee2244', unlockXP: 500  },
  { id: 25, name: 'Shadow Syndicate',     emoji: '🌑',  category: 'Casino Bosses',      rarity: 'RARE',      gradient: ['#0c0008', '#180012', '#24001c'], accentColor: '#aa0044', unlockXP: 500  },
  { id: 26, name: 'Crimson Blazer Player',emoji: '🔴',  category: 'Casino Bosses',      rarity: 'EPIC',      gradient: ['#1a0004', '#280008', '#36000c'], accentColor: '#ff0033', unlockXP: 2000 },
  { id: 27, name: 'Royal Flush Gent',     emoji: '♥️',  category: 'Casino Bosses',      rarity: 'EPIC',      gradient: ['#1a0010', '#280018', '#360020'], accentColor: '#ff2255', unlockXP: 2000 },
  { id: 28, name: 'Vegas Phantom',        emoji: '👻',  category: 'Casino Bosses',      rarity: 'LEGENDARY', gradient: ['#0e0008', '#180010', '#22001a'], accentColor: '#ff0090', unlockXP: 8000 },
  { id: 29, name: 'Poker Empire Founder', emoji: '👑',  category: 'Casino Bosses',      rarity: 'LEGENDARY', gradient: ['#1a0004', '#2a0008', '#3a000c'], accentColor: '#ffd700', unlockXP: 8000 },

  // ── Neon Cyberpunk ────────────────────────────────────────────────────────────
  { id: 30, name: 'Cyber Poker King',     emoji: '🤖',  category: 'Neon Cyberpunk',     rarity: 'COMMON',    gradient: ['#080018', '#0e0028', '#140038'], accentColor: '#bf5fff', unlockXP: 0    },
  { id: 31, name: 'Hologram Hustler',     emoji: '👾',  category: 'Neon Cyberpunk',     rarity: 'COMMON',    gradient: ['#060014', '#0c001e', '#120028'], accentColor: '#a040ff', unlockXP: 0    },
  { id: 32, name: 'Electric Blue Shark',  emoji: '⚡',  category: 'Neon Cyberpunk',     rarity: 'COMMON',    gradient: ['#000a18', '#001020', '#001828'], accentColor: '#00d4ff', unlockXP: 0    },
  { id: 33, name: 'Neon Samurai',         emoji: '⚔️',  category: 'Neon Cyberpunk',     rarity: 'RARE',      gradient: ['#0a0020', '#100030', '#180040'], accentColor: '#ff00aa', unlockXP: 500  },
  { id: 34, name: 'Crypto Casino King',   emoji: '₿',   category: 'Neon Cyberpunk',     rarity: 'RARE',      gradient: ['#0a0018', '#100024', '#180030'], accentColor: '#ffa000', unlockXP: 500  },
  { id: 35, name: 'Neon Tiger',           emoji: '🐯',  category: 'Neon Cyberpunk',     rarity: 'RARE',      gradient: ['#1a0800', '#281000', '#361800'], accentColor: '#ff6600', unlockXP: 500  },
  { id: 36, name: 'Futuristic Tycoon',    emoji: '🦾',  category: 'Neon Cyberpunk',     rarity: 'EPIC',      gradient: ['#060010', '#0c001a', '#120024'], accentColor: '#bf5fff', unlockXP: 2000 },
  { id: 37, name: 'Tokyo Heat Player',    emoji: '🗼',  category: 'Neon Cyberpunk',     rarity: 'EPIC',      gradient: ['#18000c', '#260010', '#340014'], accentColor: '#ff0090', unlockXP: 2000 },
  { id: 38, name: 'Cyberpunk Millionaire',emoji: '💜',  category: 'Neon Cyberpunk',     rarity: 'LEGENDARY', gradient: ['#080018', '#100028', '#180038'], accentColor: '#bf5fff', unlockXP: 8000 },
  { id: 39, name: 'Chrome Casino Phantom',emoji: '🔆',  category: 'Neon Cyberpunk',     rarity: 'LEGENDARY', gradient: ['#101020', '#181830', '#202040'], accentColor: '#80c0ff', unlockXP: 8000 },

  // ── Luxury VIP ────────────────────────────────────────────────────────────────
  { id: 40, name: 'VIP Lounge Dealer',    emoji: '🥂',  category: 'Luxury VIP',         rarity: 'COMMON',    gradient: ['#140020', '#1e0030', '#280040'], accentColor: '#c060ff', unlockXP: 0    },
  { id: 41, name: 'Palm Beach Millionaire',emoji: '🌊', category: 'Luxury VIP',         rarity: 'COMMON',    gradient: ['#001420', '#001e2e', '#00283c'], accentColor: '#40c8ff', unlockXP: 0    },
  { id: 42, name: 'Luxury Club Owner',    emoji: '🏛️',  category: 'Luxury VIP',         rarity: 'COMMON',    gradient: ['#100018', '#180024', '#200030'], accentColor: '#aa60ff', unlockXP: 0    },
  { id: 43, name: 'Casino Penthouse VIP', emoji: '🌆',  category: 'Luxury VIP',         rarity: 'RARE',      gradient: ['#0e001e', '#160028', '#1e0034'], accentColor: '#dd80ff', unlockXP: 500  },
  { id: 44, name: 'Gold Watch Shark',     emoji: '⌚',  category: 'Luxury VIP',         rarity: 'RARE',      gradient: ['#1a1400', '#261e00', '#322800'], accentColor: '#ffd700', unlockXP: 500  },
  { id: 45, name: 'Velvet Rope VIP',      emoji: '🎭',  category: 'Luxury VIP',         rarity: 'RARE',      gradient: ['#120020', '#1a002e', '#22003c'], accentColor: '#cc66ff', unlockXP: 500  },
  { id: 46, name: 'Luxury Yacht Gambler', emoji: '⛵',  category: 'Luxury VIP',         rarity: 'EPIC',      gradient: ['#00101e', '#001828', '#002032'], accentColor: '#00c8ff', unlockXP: 2000 },
  { id: 47, name: 'Black Card Elite',     emoji: '💳',  category: 'Luxury VIP',         rarity: 'EPIC',      gradient: ['#080010', '#0e0018', '#140020'], accentColor: '#a0d0ff', unlockXP: 2000 },
  { id: 48, name: 'Diamond Club President',emoji: '💠', category: 'Luxury VIP',         rarity: 'LEGENDARY', gradient: ['#080818', '#100e28', '#181438'], accentColor: '#80d8ff', unlockXP: 8000 },
  { id: 49, name: 'Royal Casino Emperor', emoji: '🫅',  category: 'Luxury VIP',         rarity: 'LEGENDARY', gradient: ['#1a1200', '#261c00', '#322600'], accentColor: '#ffd700', unlockXP: 8000 },

  // ── Underground Legends ───────────────────────────────────────────────────────
  { id: 50, name: 'Underground Pro',      emoji: '🎲',  category: 'Underground Legends', rarity: 'COMMON',   gradient: ['#001408', '#001e10', '#002818'], accentColor: '#00cc66', unlockXP: 0    },
  { id: 51, name: 'Midnight Gambler',     emoji: '🌙',  category: 'Underground Legends', rarity: 'COMMON',   gradient: ['#00100c', '#001814', '#00201c'], accentColor: '#00ff88', unlockXP: 0    },
  { id: 52, name: 'Back Room Hustler',    emoji: '🚪',  category: 'Underground Legends', rarity: 'COMMON',   gradient: ['#000e08', '#001410', '#001a18'], accentColor: '#00cc88', unlockXP: 0    },
  { id: 53, name: 'Casino Rebel',         emoji: '🤘',  category: 'Underground Legends', rarity: 'RARE',     gradient: ['#0a1008', '#101810', '#182018'], accentColor: '#44ff88', unlockXP: 500  },
  { id: 54, name: 'Poker Night Racer',    emoji: '🏎️',  category: 'Underground Legends', rarity: 'RARE',     gradient: ['#140800', '#1e1000', '#281800'], accentColor: '#ff6600', unlockXP: 500  },
  { id: 55, name: 'Midnight Lounge Owner',emoji: '🍸',  category: 'Underground Legends', rarity: 'RARE',     gradient: ['#001208', '#001a0c', '#002210'], accentColor: '#00ee66', unlockXP: 500  },
  { id: 56, name: 'Sunset Strip Hustler', emoji: '🌅',  category: 'Underground Legends', rarity: 'EPIC',     gradient: ['#180800', '#241000', '#301800'], accentColor: '#ff8800', unlockXP: 2000 },
  { id: 57, name: 'Neon Mirage VIP',      emoji: '🌵',  category: 'Underground Legends', rarity: 'EPIC',     gradient: ['#001408', '#002010', '#002c18'], accentColor: '#00ff88', unlockXP: 2000 },
  { id: 58, name: 'High Society Hustler', emoji: '🎪',  category: 'Underground Legends', rarity: 'LEGENDARY',gradient: ['#001008', '#001810', '#002018'], accentColor: '#00ffaa', unlockXP: 8000 },
  { id: 59, name: 'Modern Mafia Gambler', emoji: '🌹',  category: 'Underground Legends', rarity: 'LEGENDARY',gradient: ['#120008', '#1c0010', '#260018'], accentColor: '#ff2244', unlockXP: 8000 },

  // ── Retro 80s ────────────────────────────────────────────────────────────────
  { id: 60, name: 'Retro Card Hustler',   emoji: '🎮',  category: 'Retro 80s',          rarity: 'COMMON',    gradient: ['#1a0010', '#260018', '#320020'], accentColor: '#ff0090', unlockXP: 0    },
  { id: 61, name: 'Neon Cowboy',          emoji: '🤠',  category: 'Retro 80s',          rarity: 'COMMON',    gradient: ['#1a0808', '#261010', '#321818'], accentColor: '#ff4455', unlockXP: 0    },
  { id: 62, name: 'Retro Ferrari Driver', emoji: '🏁',  category: 'Retro 80s',          rarity: 'COMMON',    gradient: ['#1a0600', '#260e00', '#321600'], accentColor: '#ff3300', unlockXP: 0    },
  { id: 63, name: 'Pink Neon Dealer',     emoji: '💗',  category: 'Retro 80s',          rarity: 'RARE',      gradient: ['#200010', '#2e0018', '#3c0020'], accentColor: '#ff4499', unlockXP: 500  },
  { id: 64, name: 'Casino Legend 1987',   emoji: '📼',  category: 'Retro 80s',          rarity: 'RARE',      gradient: ['#18001a', '#240028', '#300036'], accentColor: '#cc44ff', unlockXP: 500  },
  { id: 65, name: 'Purple Smoke Gambler', emoji: '💨',  category: 'Retro 80s',          rarity: 'RARE',      gradient: ['#10001a', '#180026', '#200032'], accentColor: '#aa44ff', unlockXP: 500  },
  { id: 66, name: 'Neon Noir Gambler',    emoji: '🌃',  category: 'Retro 80s',          rarity: 'EPIC',      gradient: ['#18000e', '#240018', '#300022'], accentColor: '#ff2288', unlockXP: 2000 },
  { id: 67, name: 'Sunset Boulevard',     emoji: '🎬',  category: 'Retro 80s',          rarity: 'EPIC',      gradient: ['#1a0800', '#281000', '#361800'], accentColor: '#ff8800', unlockXP: 2000 },
  { id: 68, name: 'Neon Collector',       emoji: '🌺',  category: 'Retro 80s',          rarity: 'LEGENDARY', gradient: ['#1e0010', '#2c0018', '#3a0020'], accentColor: '#ff0090', unlockXP: 8000 },
  { id: 69, name: 'Retro Luxury Gambler', emoji: '🪩',  category: 'Retro 80s',          rarity: 'LEGENDARY', gradient: ['#180018', '#240024', '#300030'], accentColor: '#ff44ff', unlockXP: 8000 },

  // ── Modern Influencers ────────────────────────────────────────────────────────
  { id: 70, name: 'Modern Casino Influencer',emoji: '📱',category: 'Modern Influencers', rarity: 'COMMON',   gradient: ['#001818', '#002022', '#00282c'], accentColor: '#00ccaa', unlockXP: 0    },
  { id: 71, name: 'Crypto Poker Racer',   emoji: '🚀',  category: 'Modern Influencers', rarity: 'COMMON',    gradient: ['#080018', '#100022', '#18002c'], accentColor: '#8844ff', unlockXP: 0    },
  { id: 72, name: 'Poker Room Streamer',  emoji: '🎙️',  category: 'Modern Influencers', rarity: 'COMMON',    gradient: ['#001020', '#001828', '#002030'], accentColor: '#00bbcc', unlockXP: 0    },
  { id: 73, name: 'Neon Brand Builder',   emoji: '✨',  category: 'Modern Influencers', rarity: 'RARE',      gradient: ['#001414', '#001e1e', '#002828'], accentColor: '#00ddbb', unlockXP: 500  },
  { id: 74, name: 'Luxury Lifestyle Pro', emoji: '🛍️',  category: 'Modern Influencers', rarity: 'RARE',      gradient: ['#0e001c', '#160028', '#1e0034'], accentColor: '#cc66ff', unlockXP: 500  },
  { id: 75, name: 'Table Stakes Creator', emoji: '📸',  category: 'Modern Influencers', rarity: 'RARE',      gradient: ['#001818', '#001e22', '#00242c'], accentColor: '#00c8aa', unlockXP: 500  },
  { id: 76, name: 'Digital Card King',    emoji: '🖥️',  category: 'Modern Influencers', rarity: 'EPIC',      gradient: ['#080018', '#0e0020', '#140028'], accentColor: '#9966ff', unlockXP: 2000 },
  { id: 77, name: 'Future Vegas Icon',    emoji: '🌐',  category: 'Modern Influencers', rarity: 'EPIC',      gradient: ['#001010', '#001818', '#002020'], accentColor: '#00ffcc', unlockXP: 2000 },
  { id: 78, name: 'Neon Empire Shark',    emoji: '📡',  category: 'Modern Influencers', rarity: 'LEGENDARY', gradient: ['#001818', '#001e20', '#002428'], accentColor: '#00ffdd', unlockXP: 8000 },
  { id: 79, name: 'Infinite Chips Tycoon',emoji: '♾️',  category: 'Modern Influencers', rarity: 'LEGENDARY', gradient: ['#0a0018', '#100020', '#160028'], accentColor: '#aa88ff', unlockXP: 8000 },

  // ── Elite Bluff Masters ───────────────────────────────────────────────────────
  { id: 80, name: 'Ice Bluff Artist',     emoji: '🧊',  category: 'Elite Bluff Masters', rarity: 'COMMON',   gradient: ['#0c1020', '#121830', '#182040'], accentColor: '#80c0ff', unlockXP: 0    },
  { id: 81, name: 'Poker Prince',         emoji: '🃏',  category: 'Elite Bluff Masters', rarity: 'COMMON',   gradient: ['#100820', '#180e30', '#201440'], accentColor: '#9988cc', unlockXP: 0    },
  { id: 82, name: 'Bluff Architect',      emoji: '🎭',  category: 'Elite Bluff Masters', rarity: 'COMMON',   gradient: ['#0a0c20', '#10122e', '#16183c'], accentColor: '#7080ff', unlockXP: 0    },
  { id: 83, name: 'The River Calculator', emoji: '🧮',  category: 'Elite Bluff Masters', rarity: 'RARE',     gradient: ['#080e1e', '#0e142a', '#141a36'], accentColor: '#6090ff', unlockXP: 500  },
  { id: 84, name: 'Platinum Bluff Artist',emoji: '🎖️',  category: 'Elite Bluff Masters', rarity: 'RARE',     gradient: ['#0e1020', '#14162c', '#1a1c38'], accentColor: '#90b0ff', unlockXP: 500  },
  { id: 85, name: 'Diamond Bluff Master', emoji: '💎',  category: 'Elite Bluff Masters', rarity: 'RARE',     gradient: ['#080c18', '#0e1224', '#141830'], accentColor: '#80d0ff', unlockXP: 500  },
  { id: 86, name: 'Sapphire Table King',  emoji: '🔷',  category: 'Elite Bluff Masters', rarity: 'EPIC',     gradient: ['#060c1a', '#0c1226', '#121832'], accentColor: '#4488ff', unlockXP: 2000 },
  { id: 87, name: 'Royal Velvet Gambler', emoji: '👒',  category: 'Elite Bluff Masters', rarity: 'EPIC',     gradient: ['#100a20', '#18102e', '#20163c'], accentColor: '#aa88ff', unlockXP: 2000 },
  { id: 88, name: 'Neon Baron',           emoji: '🎩',  category: 'Elite Bluff Masters', rarity: 'LEGENDARY',gradient: ['#0c1020', '#121830', '#182040'], accentColor: '#60aaff', unlockXP: 8000 },
  { id: 89, name: 'Billionaire Bluffer',  emoji: '🫦',  category: 'Elite Bluff Masters', rarity: 'LEGENDARY',gradient: ['#0e0c1e', '#16122c', '#1e183a'], accentColor: '#9966ff', unlockXP: 8000 },

  // ── Vegas Nightlife ────────────────────────────────────────────────────────────
  { id: 90, name: 'Vegas Strip Gambler',  emoji: '🎠',  category: 'Vegas Nightlife',    rarity: 'COMMON',    gradient: ['#1a0800', '#261200', '#321c00'], accentColor: '#ff8800', unlockXP: 0    },
  { id: 91, name: 'Neon Lounge King',     emoji: '🎵',  category: 'Vegas Nightlife',    rarity: 'COMMON',    gradient: ['#16000c', '#220010', '#2e0014'], accentColor: '#ff4466', unlockXP: 0    },
  { id: 92, name: 'The After Party',      emoji: '🪩',  category: 'Vegas Nightlife',    rarity: 'COMMON',    gradient: ['#120018', '#1a0022', '#22002c'], accentColor: '#ee44ff', unlockXP: 0    },
  { id: 93, name: 'Crimson Neon Hustler', emoji: '🌹',  category: 'Vegas Nightlife',    rarity: 'RARE',      gradient: ['#1a0004', '#260008', '#32000c'], accentColor: '#ff2244', unlockXP: 500  },
  { id: 94, name: 'Vice Lounge Millionaire',emoji: '🍾',category: 'Vegas Nightlife',    rarity: 'RARE',      gradient: ['#180a00', '#241400', '#301e00'], accentColor: '#ffaa00', unlockXP: 500  },
  { id: 95, name: 'Oceanfront Roller',    emoji: '🏖️',  category: 'Vegas Nightlife',    rarity: 'RARE',      gradient: ['#001420', '#001e2e', '#00283c'], accentColor: '#00c8ff', unlockXP: 500  },
  { id: 96, name: 'Skyline Syndicate',    emoji: '🌃',  category: 'Vegas Nightlife',    rarity: 'EPIC',      gradient: ['#080010', '#0e0018', '#140020'], accentColor: '#cc00ff', unlockXP: 2000 },
  { id: 97, name: 'Neon Cigar Boss',      emoji: '🚬',  category: 'Vegas Nightlife',    rarity: 'EPIC',      gradient: ['#180600', '#240e00', '#301600'], accentColor: '#ff6600', unlockXP: 2000 },
  { id: 98, name: 'Royal Syndicate Boss', emoji: '🎱',  category: 'Vegas Nightlife',    rarity: 'LEGENDARY', gradient: ['#100010', '#180018', '#200020'], accentColor: '#ff00ff', unlockXP: 8000 },
  { id: 99, name: 'Midnight Ace',         emoji: '🂡',  category: 'Vegas Nightlife',    rarity: 'LEGENDARY', gradient: ['#000010', '#000018', '#000020'], accentColor: '#ffd700', unlockXP: 8000 },
];

export function getAvatar(id: number): PremiumAvatar {
  return PREMIUM_AVATARS[id] ?? PREMIUM_AVATARS[0];
}

export function isAvatarUnlocked(avatar: PremiumAvatar, xp: number): boolean {
  return xp >= avatar.unlockXP;
}
