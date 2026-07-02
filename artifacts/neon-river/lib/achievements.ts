export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type AchievementCategory = 'hands' | 'milestone' | 'streak' | 'bankroll' | 'omaha' | 'tournament';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  rarity: AchievementRarity;
  icon: string;
  chipReward: number;
  xpReward: number;
  category: AchievementCategory;
  /** For count-based achievements, the target count */
  target?: number;
}

export const RARITY_COLORS: Record<AchievementRarity, string> = {
  common:    '#00d4ff',
  rare:      '#bf5fff',
  epic:      '#ff0090',
  legendary: '#ffd700',
};

export const RARITY_LABELS: Record<AchievementRarity, string> = {
  common:    'COMMON',
  rare:      'RARE',
  epic:      'EPIC',
  legendary: 'LEGENDARY',
};

export const ALL_ACHIEVEMENTS: Achievement[] = [
  // ── Poker hands ────────────────────────────────────────────────────────────
  {
    id: 'hand_pair',
    name: 'Pocket Rockets',
    description: 'Win 10 hands with One Pair.',
    rarity: 'common', icon: '🃏', chipReward: 200, xpReward: 30,
    category: 'hands', target: 10,
  },
  {
    id: 'hand_two_pair',
    name: 'Double Down',
    description: 'Win 10 hands with Two Pair.',
    rarity: 'common', icon: '✌️', chipReward: 400, xpReward: 60,
    category: 'hands', target: 10,
  },
  {
    id: 'hand_three_kind',
    name: 'Set the Table',
    description: 'Win 10 hands with Three of a Kind.',
    rarity: 'common', icon: '🎰', chipReward: 800, xpReward: 100,
    category: 'hands', target: 10,
  },
  {
    id: 'hand_straight',
    name: 'Straight Shooter',
    description: 'Win 10 hands with a Straight.',
    rarity: 'rare', icon: '➡️', chipReward: 1_500, xpReward: 200,
    category: 'hands', target: 10,
  },
  {
    id: 'hand_flush',
    name: 'Suited Up',
    description: 'Win 10 hands with a Flush.',
    rarity: 'rare', icon: '♠️', chipReward: 1_500, xpReward: 200,
    category: 'hands', target: 10,
  },
  {
    id: 'hand_full_house',
    name: 'Full House',
    description: 'Win 10 hands with a Full House.',
    rarity: 'rare', icon: '🏠', chipReward: 3_000, xpReward: 400,
    category: 'hands', target: 10,
  },
  {
    id: 'hand_four_kind',
    name: 'Quad Squad',
    description: 'Win 10 hands with Four of a Kind.',
    rarity: 'epic', icon: '💎', chipReward: 6_000, xpReward: 800,
    category: 'hands', target: 10,
  },
  {
    id: 'hand_straight_flush',
    name: 'Straight to Glory',
    description: 'Win 10 hands with a Straight Flush.',
    rarity: 'epic', icon: '⚡', chipReward: 12_000, xpReward: 1_500,
    category: 'hands', target: 10,
  },
  {
    id: 'hand_royal_flush',
    name: 'Royalty',
    description: 'Win a hand with a Royal Flush.',
    rarity: 'legendary', icon: '👑', chipReward: 25_000, xpReward: 3_000,
    category: 'hands', target: 1,
  },

  // ── Milestones ─────────────────────────────────────────────────────────────
  {
    id: 'first_win',
    name: 'First Blood',
    description: 'Win your very first hand.',
    rarity: 'common', icon: '🏆', chipReward: 500, xpReward: 50,
    category: 'milestone',
  },
  {
    id: 'wins_10',
    name: 'On a Roll',
    description: 'Win 10 hands total.',
    rarity: 'common', icon: '🎯', chipReward: 1_000, xpReward: 150,
    category: 'milestone', target: 10,
  },
  {
    id: 'wins_50',
    name: 'Hustler',
    description: 'Win 50 hands total.',
    rarity: 'rare', icon: '🔥', chipReward: 4_000, xpReward: 600,
    category: 'milestone', target: 50,
  },
  {
    id: 'wins_100',
    name: 'Syndicate Pro',
    description: 'Win 100 hands total.',
    rarity: 'epic', icon: '🌟', chipReward: 10_000, xpReward: 1_500,
    category: 'milestone', target: 100,
  },
  {
    id: 'allin_win',
    name: 'All or Nothing',
    description: 'Win a hand while going all-in.',
    rarity: 'rare', icon: '💥', chipReward: 2_000, xpReward: 300,
    category: 'milestone',
  },
  {
    id: 'comeback',
    name: 'Comeback Kid',
    description: 'Win a hand immediately after losing one.',
    rarity: 'rare', icon: '⬆️', chipReward: 2_000, xpReward: 300,
    category: 'milestone',
  },
  {
    id: 'big_pot',
    name: 'Big Pot',
    description: 'Win a pot of 50,000 chips or more.',
    rarity: 'epic', icon: '💰', chipReward: 5_000, xpReward: 700,
    category: 'milestone',
  },

  // ── Win streaks ────────────────────────────────────────────────────────────
  {
    id: 'streak_3',
    name: 'Hot Hand',
    description: 'Win 3 hands in a row.',
    rarity: 'common', icon: '🌡️', chipReward: 600, xpReward: 80,
    category: 'streak', target: 3,
  },
  {
    id: 'streak_5',
    name: 'Win Streak',
    description: 'Win 5 hands in a row.',
    rarity: 'rare', icon: '⚡', chipReward: 2_500, xpReward: 350,
    category: 'streak', target: 5,
  },
  {
    id: 'streak_10',
    name: 'Unstoppable',
    description: 'Win 10 hands in a row.',
    rarity: 'legendary', icon: '🔱', chipReward: 10_000, xpReward: 1_500,
    category: 'streak', target: 10,
  },
  {
    id: 'daily_3',
    name: '3-Day Player',
    description: 'Log in 3 days in a row.',
    rarity: 'common', icon: '📅', chipReward: 800, xpReward: 100,
    category: 'streak', target: 3,
  },
  {
    id: 'daily_7',
    name: 'Weekly Warrior',
    description: 'Log in 7 days in a row.',
    rarity: 'rare', icon: '🗓️', chipReward: 3_000, xpReward: 450,
    category: 'streak', target: 7,
  },
  {
    id: 'daily_30',
    name: 'Monthly Master',
    description: 'Log in 30 days in a row.',
    rarity: 'epic', icon: '🏅', chipReward: 15_000, xpReward: 2_000,
    category: 'streak', target: 30,
  },

  // ── Bankroll ───────────────────────────────────────────────────────────────
  {
    id: 'chips_100k',
    name: 'Six Figures',
    description: 'Reach a chip balance of 100,000.',
    rarity: 'common', icon: '💵', chipReward: 1_000, xpReward: 150,
    category: 'bankroll', target: 100_000,
  },
  {
    id: 'chips_500k',
    name: 'High Roller',
    description: 'Reach a chip balance of 500,000.',
    rarity: 'rare', icon: '💳', chipReward: 3_000, xpReward: 500,
    category: 'bankroll', target: 500_000,
  },
  {
    id: 'chips_1m',
    name: 'Millionaire',
    description: 'Reach a chip balance of 1,000,000.',
    rarity: 'epic', icon: '💎', chipReward: 8_000, xpReward: 1_200,
    category: 'bankroll', target: 1_000_000,
  },
  {
    id: 'chips_10m',
    name: 'Legend',
    description: 'Reach a chip balance of 10,000,000.',
    rarity: 'legendary', icon: '🌌', chipReward: 25_000, xpReward: 3_000,
    category: 'bankroll', target: 10_000_000,
  },

  // ── Omaha Hold'em ──────────────────────────────────────────────────────────
  {
    id: 'omaha_first_hand',
    name: 'Omaha Initiate',
    description: 'Play your first Omaha Hold\'em hand.',
    rarity: 'common', icon: '🃏', chipReward: 500, xpReward: 50,
    category: 'omaha',
  },
  {
    id: 'omaha_first_win',
    name: 'Omaha Opener',
    description: 'Win your first Omaha Hold\'em hand.',
    rarity: 'common', icon: '🏆', chipReward: 1_000, xpReward: 100,
    category: 'omaha',
  },
  {
    id: 'omaha_full_house',
    name: 'Omaha House',
    description: 'Win an Omaha hand with a Full House.',
    rarity: 'common', icon: '🏠', chipReward: 2_000, xpReward: 200,
    category: 'omaha',
  },
  {
    id: 'omaha_flush',
    name: 'Omaha Flush',
    description: 'Win an Omaha hand with a Flush.',
    rarity: 'rare', icon: '♠️', chipReward: 3_000, xpReward: 350,
    category: 'omaha',
  },
  {
    id: 'omaha_straight',
    name: 'Omaha Straight',
    description: 'Win an Omaha hand with a Straight.',
    rarity: 'rare', icon: '➡️', chipReward: 3_000, xpReward: 350,
    category: 'omaha',
  },
  {
    id: 'omaha_quads',
    name: 'Omaha Quads',
    description: 'Win an Omaha hand with Four of a Kind.',
    rarity: 'epic', icon: '💎', chipReward: 8_000, xpReward: 1_000,
    category: 'omaha',
  },
  {
    id: 'omaha_royal_flush',
    name: 'Omaha Royalty',
    description: 'Win an Omaha hand with a Royal Flush.',
    rarity: 'legendary', icon: '👑', chipReward: 30_000, xpReward: 4_000,
    category: 'omaha',
  },
  {
    id: 'omaha_grinder',
    name: 'Omaha Grinder',
    description: 'Play 100 Omaha Hold\'em hands.',
    rarity: 'rare', icon: '🔥', chipReward: 5_000, xpReward: 700,
    category: 'omaha', target: 100,
  },
  {
    id: 'omaha_specialist',
    name: 'Omaha Specialist',
    description: 'Play 500 Omaha Hold\'em hands.',
    rarity: 'legendary', icon: '🌟', chipReward: 20_000, xpReward: 3_000,
    category: 'omaha', target: 500,
  },

  // ── Multi-variant tournaments ──────────────────────────────────────────────
  {
    id: 'omaha_champion',
    name: 'Omaha Champion',
    description: 'Win an Omaha Hold\'em tournament.',
    rarity: 'epic', icon: '🂠', chipReward: 15_000, xpReward: 1_500,
    category: 'tournament',
  },
  {
    id: 'joker_champion',
    name: 'Joker Champion',
    description: 'Win a Joker Hold\'em tournament.',
    rarity: 'epic', icon: '🃏', chipReward: 15_000, xpReward: 1_500,
    category: 'tournament',
  },
  {
    id: 'variant_master',
    name: 'Variant Master',
    description: 'Win a tournament in 3 different game variants.',
    rarity: 'legendary', icon: '🎭', chipReward: 30_000, xpReward: 3_000,
    category: 'tournament', target: 3,
  },
  {
    id: 'triple_crown',
    name: 'Triple Crown',
    description: 'Win a tournament in every game variant: Hold\'em, Short Deck, Omaha, and Joker.',
    rarity: 'legendary', icon: '👑', chipReward: 50_000, xpReward: 5_000,
    category: 'tournament', target: 4,
  },
];

export const ACHIEVEMENT_MAP: Record<string, Achievement> =
  Object.fromEntries(ALL_ACHIEVEMENTS.map(a => [a.id, a]));

export const HAND_TO_ACHIEVEMENT: Record<string, string> = {
  'One Pair':        'hand_pair',
  'Two Pair':        'hand_two_pair',
  'Three of a Kind': 'hand_three_kind',
  'Straight':        'hand_straight',
  'Flush':           'hand_flush',
  'Full House':      'hand_full_house',
  'Four of a Kind':  'hand_four_kind',
  'Straight Flush':  'hand_straight_flush',
  'Royal Flush':     'hand_royal_flush',
};

export const OMAHA_HAND_TO_ACHIEVEMENT: Record<string, string> = {
  'Full House':      'omaha_full_house',
  'Flush':           'omaha_flush',
  'Straight':        'omaha_straight',
  'Four of a Kind':  'omaha_quads',
  'Straight Flush':  'omaha_royal_flush',
  'Royal Flush':     'omaha_royal_flush',
};
