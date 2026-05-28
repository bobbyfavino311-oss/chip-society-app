// ── Social data layer — mock players, posts, leaderboard, live events ─────────

export type PlayerStatus = 'online' | 'in_game' | 'offline';

export type PostTag =
  | 'WIN' | 'BLUFF' | 'BAD BEAT' | 'ALL-IN'
  | 'HIGHLIGHT' | 'JACKPOT' | 'LEVEL UP' | 'TOURNAMENT';

export type FeedTab = 'trending' | 'following' | 'pots' | 'highlights';

export interface Badge {
  id: string;
  label: string;
  icon: string;
  color: string;
}

export interface MockPlayer {
  id: string;
  username: string;
  handle: string;
  avatar: string;
  avatarColor: string;
  avatarId?: number;
  bannerColors: [string, string];
  rank: string;
  level: number;
  chips: number;
  winRate: number;
  handsPlayed: number;
  biggestPot: number;
  tournamentWins: number;
  achievementCount: number;
  followers: number;
  following: number;
  status: PlayerStatus;
  badges: Badge[];
  bio: string;
}

export interface PostReactions {
  fire: number;
  spade: number;
  money: number;
  wow: number;
  crown: number;
}

export interface SocialPost {
  id: string;
  playerId: string;
  tag: PostTag;
  content: string;
  pot?: string;
  handRank?: string;
  likes: number;
  comments: number;
  reactions: PostReactions;
  timeAgo: string;
  tab: FeedTab;
}

export interface LiveEvent {
  id: string;
  playerId: string;
  text: string;
  color: string;
}

// ── Mock players ──────────────────────────────────────────────────────────────

export const MOCK_PLAYERS: MockPlayer[] = [
  {
    id: 'p1', username: 'NightShark99', handle: '@nightshark99',
    avatar: '♠', avatarColor: '#00d4ff', avatarId: 25, bannerColors: ['#001a40', '#000d20'],
    rank: 'Neon Legend', level: 99, chips: 4_280_000, winRate: 68,
    handsPlayed: 12_401, biggestPot: 1_240_000, tournamentWins: 14,
    achievementCount: 48, followers: 12_400, following: 892,
    status: 'in_game',
    badges: [
      { id: 'top_ranked', label: 'Top Ranked', icon: '🏆', color: '#ffd700' },
      { id: 'high_roller', label: 'High Roller', icon: '💰', color: '#00d4ff' },
      { id: 'tournament_winner', label: 'Tournament Winner', icon: '🎯', color: '#bf5fff' },
    ],
    bio: 'Hunting pots since 2021. Royal Flush collector. Sleep is for fish.',
  },
  {
    id: 'p2', username: 'VegasMirage', handle: '@vegasmirage',
    avatar: '♥', avatarColor: '#ff0090', avatarId: 27, bannerColors: ['#3d0020', '#1a0010'],
    rank: 'Neon Elite', level: 82, chips: 2_910_000, winRate: 61,
    handsPlayed: 9_808, biggestPot: 820_000, tournamentWins: 7,
    achievementCount: 36, followers: 8_770, following: 1_204,
    status: 'online',
    badges: [
      { id: 'bluff_master', label: 'Bluff Master', icon: '🎭', color: '#ff0090' },
      { id: 'vip', label: 'VIP', icon: '💎', color: '#b8f0ff' },
    ],
    bio: 'The art of the fold. Three-barrel or bust. Vegas never sleeps.',
  },
  {
    id: 'p3', username: 'NeonAce_', handle: '@neonace_',
    avatar: '♦', avatarColor: '#ffd700', avatarId: 17, bannerColors: ['#2a1a00', '#110d00'],
    rank: 'Neon Diamond', level: 71, chips: 1_650_000, winRate: 55,
    handsPlayed: 7_302, biggestPot: 520_000, tournamentWins: 4,
    achievementCount: 29, followers: 5_420, following: 778,
    status: 'offline',
    badges: [
      { id: 'early_beta', label: 'Early Beta', icon: '⚡', color: '#ffd700' },
    ],
    bio: 'Bad beats make champions. Quad aces survivor. Running good since never.',
  },
  {
    id: 'p4', username: 'ShadowKing', handle: '@shadowking',
    avatar: '♣', avatarColor: '#bf5fff', avatarId: 20, bannerColors: ['#1e0040', '#0d001f'],
    rank: 'Neon Legend', level: 95, chips: 3_740_000, winRate: 72,
    handsPlayed: 11_200, biggestPot: 980_000, tournamentWins: 11,
    achievementCount: 44, followers: 10_900, following: 640,
    status: 'in_game',
    badges: [
      { id: 'top_ranked', label: 'Top Ranked', icon: '🏆', color: '#ffd700' },
      { id: 'tournament_winner', label: 'Tournament Winner', icon: '🎯', color: '#bf5fff' },
    ],
    bio: 'Aggression is a language. Speak it fluently. Bankroll management is for losers who want to stay losers.',
  },
  {
    id: 'p5', username: 'MiamiDreams', handle: '@miamidreams',
    avatar: '★', avatarColor: '#00ff88', avatarId: 8, bannerColors: ['#003322', '#001510'],
    rank: 'Neon Platinum', level: 58, chips: 890_000, winRate: 49,
    handsPlayed: 4_500, biggestPot: 210_000, tournamentWins: 2,
    achievementCount: 18, followers: 2_100, following: 890,
    status: 'online',
    badges: [
      { id: 'early_beta', label: 'Early Beta', icon: '⚡', color: '#ffd700' },
    ],
    bio: 'Still learning. Still grinding. The comeback is always bigger than the setback.',
  },
  {
    id: 'p6', username: 'BlazeFire77', handle: '@blazefire77',
    avatar: '♥', avatarColor: '#ff6600', avatarId: 15, bannerColors: ['#301000', '#160800'],
    rank: 'Neon Gold', level: 44, chips: 540_000, winRate: 42,
    handsPlayed: 3_100, biggestPot: 140_000, tournamentWins: 1,
    achievementCount: 12, followers: 980, following: 420,
    status: 'online',
    badges: [],
    bio: 'On tilt? Never. Just recalibrating my aggression levels.',
  },
  {
    id: 'p7', username: 'PokerPhantom', handle: '@pokerphantom',
    avatar: '♠', avatarColor: '#bf5fff', avatarId: 24, bannerColors: ['#150030', '#080018'],
    rank: 'Neon Elite', level: 77, chips: 2_200_000, winRate: 64,
    handsPlayed: 8_800, biggestPot: 710_000, tournamentWins: 6,
    achievementCount: 33, followers: 6_800, following: 910,
    status: 'in_game',
    badges: [
      { id: 'vip', label: 'VIP', icon: '💎', color: '#b8f0ff' },
      { id: 'high_roller', label: 'High Roller', icon: '💰', color: '#00d4ff' },
    ],
    bio: 'Ghost at the table. Every bet tells a story. Make sure yours is a lie.',
  },
  {
    id: 'p8', username: 'GlacierGhost', handle: '@glacierghost',
    avatar: '♦', avatarColor: '#00d4ff', avatarId: 12, bannerColors: ['#001433', '#000a1a'],
    rank: 'Neon Diamond', level: 65, chips: 1_120_000, winRate: 58,
    handsPlayed: 5_900, biggestPot: 380_000, tournamentWins: 3,
    achievementCount: 22, followers: 3_200, following: 560,
    status: 'offline',
    badges: [],
    bio: 'Patient as ice. Cold as the flop. Grind sessions 5+ hours daily.',
  },
  {
    id: 'p9', username: 'NeonWitch', handle: '@neonwitch',
    avatar: '♥', avatarColor: '#ff0090', avatarId: 22, bannerColors: ['#2d0022', '#150010'],
    rank: 'Neon Elite', level: 80, chips: 2_750_000, winRate: 66,
    handsPlayed: 9_200, biggestPot: 890_000, tournamentWins: 9,
    achievementCount: 38, followers: 9_100, following: 1_050,
    status: 'online',
    badges: [
      { id: 'tournament_winner', label: 'Tournament Winner', icon: '🎯', color: '#bf5fff' },
      { id: 'vip', label: 'VIP', icon: '💎', color: '#b8f0ff' },
    ],
    bio: 'Reading souls across the felt. Your tells are showing. 9 tournament wins and counting.',
  },
  {
    id: 'p10', username: 'CryptoKid', handle: '@cryptokid',
    avatar: '♣', avatarColor: '#ffd700', avatarId: 3, bannerColors: ['#1a1400', '#0d0a00'],
    rank: 'Neon Gold', level: 38, chips: 320_000, winRate: 37,
    handsPlayed: 1_800, biggestPot: 82_000, tournamentWins: 0,
    achievementCount: 8, followers: 540, following: 1_200,
    status: 'offline',
    badges: [
      { id: 'early_beta', label: 'Early Beta', icon: '⚡', color: '#ffd700' },
    ],
    bio: 'Degenerate gambler speedrun. Currently in the red. Soon to be legendary.',
  },
  {
    id: 'p11', username: 'RiverRuler', handle: '@riverruler',
    avatar: '★', avatarColor: '#00d4ff', avatarId: 29, bannerColors: ['#001830', '#000b17'],
    rank: 'Neon Platinum', level: 54, chips: 760_000, winRate: 51,
    handsPlayed: 4_200, biggestPot: 190_000, tournamentWins: 1,
    achievementCount: 16, followers: 1_600, following: 700,
    status: 'in_game',
    badges: [],
    bio: 'Living on the river card. Heart still pounding on every turn.',
  },
  {
    id: 'p12', username: 'AceHunter', handle: '@acehunter',
    avatar: '♠', avatarColor: '#ff6600', avatarId: 19, bannerColors: ['#301000', '#180700'],
    rank: 'Neon Diamond', level: 62, chips: 980_000, winRate: 53,
    handsPlayed: 5_400, biggestPot: 290_000, tournamentWins: 2,
    achievementCount: 20, followers: 2_800, following: 660,
    status: 'online',
    badges: [],
    bio: 'Aces or nothing. Shove or fold. The middle path is for amateurs.',
  },
];

// ── Mock posts ────────────────────────────────────────────────────────────────

export const SOCIAL_POSTS: SocialPost[] = [
  {
    id: 'sp1', playerId: 'p1', tag: 'WIN',
    content: 'Royal Flush on the river. The whole table went silent. 🃏🔥 I just sat there and let it breathe.',
    pot: '42,400', handRank: 'Royal Flush', likes: 1240, comments: 87,
    reactions: { fire: 842, spade: 210, money: 398, wow: 560, crown: 312 },
    timeAgo: '2h', tab: 'trending',
  },
  {
    id: 'sp2', playerId: 'p2', tag: 'BLUFF',
    content: 'Triple-barrel bluffed with 7-2 offsuit on a KQ4 paired board. They had a set and they folded it. This is art.',
    pot: '18,200', handRank: '7-2 Offsuit', likes: 887, comments: 142,
    reactions: { fire: 620, spade: 180, money: 240, wow: 450, crown: 190 },
    timeAgo: '4h', tab: 'trending',
  },
  {
    id: 'sp3', playerId: 'p3', tag: 'BAD BEAT',
    content: 'Quad Aces cracked by a straight flush. I need a moment. The odds of that happening are 0.000000001%.',
    pot: '91,000', handRank: 'Quad Aces', likes: 2103, comments: 318,
    reactions: { fire: 1100, spade: 450, money: 820, wow: 1800, crown: 220 },
    timeAgo: '6h', tab: 'pots',
  },
  {
    id: 'sp4', playerId: 'p4', tag: 'ALL-IN',
    content: 'Five-way all-in pre-flop. I had AA. Flopped a set. Turned quads. River was irrelevant.',
    pot: '62,500', handRank: 'Quad Aces', likes: 1876, comments: 204,
    reactions: { fire: 1200, spade: 560, money: 900, wow: 1400, crown: 700 },
    timeAgo: '8h', tab: 'pots',
  },
  {
    id: 'sp5', playerId: 'p5', tag: 'HIGHLIGHT',
    content: 'Finished 3rd in the Neon Championship last night. 128-player field. Proud of the run. Thanks for the rail!',
    pot: '15,000', likes: 432, comments: 56,
    reactions: { fire: 320, spade: 100, money: 180, wow: 220, crown: 280 },
    timeAgo: '12h', tab: 'highlights',
  },
  {
    id: 'sp6', playerId: 'p6', tag: 'WIN',
    content: 'Coolered the table captain with KK vs QQ. He had 3-bet/4-bet/shoved and I snap called. GG.',
    pot: '28,800', handRank: 'Pair of Kings', likes: 654, comments: 91,
    reactions: { fire: 480, spade: 150, money: 290, wow: 310, crown: 160 },
    timeAgo: '1d', tab: 'following',
  },
  {
    id: 'sp7', playerId: 'p7', tag: 'BLUFF',
    content: 'Check-raised the flop, barreled turn, shoved river with air. They tanked 3 minutes and folded top pair top kicker. 😤',
    pot: '33,600', likes: 1109, comments: 177,
    reactions: { fire: 780, spade: 260, money: 340, wow: 620, crown: 200 },
    timeAgo: '1d', tab: 'following',
  },
  {
    id: 'sp8', playerId: 'p8', tag: 'HIGHLIGHT',
    content: 'Won a 5-hour session grinding cash. Up 12 buy-ins. The patience game is everything.',
    pot: '48,000', likes: 789, comments: 63,
    reactions: { fire: 540, spade: 190, money: 420, wow: 280, crown: 150 },
    timeAgo: '2d', tab: 'highlights',
  },
  {
    id: 'sp9', playerId: 'p9', tag: 'TOURNAMENT',
    content: 'Just won the midnight invitational. 64 players. Final table lasted 4 hours. The last hand was pure ice. 👑',
    pot: '480,000', handRank: 'Full House', likes: 3200, comments: 480,
    reactions: { fire: 2100, spade: 800, money: 1400, wow: 2800, crown: 1600 },
    timeAgo: '3h', tab: 'trending',
  },
  {
    id: 'sp10', playerId: 'p1', tag: 'JACKPOT',
    content: 'Lucky wheel hit the 500K jackpot on my first spin of the day. Some days the universe just vibes with you.',
    likes: 1840, comments: 210,
    reactions: { fire: 1200, spade: 400, money: 1600, wow: 1400, crown: 600 },
    timeAgo: '5h', tab: 'trending',
  },
  {
    id: 'sp11', playerId: 'p4', tag: 'WIN',
    content: 'Four consecutive pots taken down without a showdown. When your image is printing money.',
    pot: '156,000', likes: 2100, comments: 290,
    reactions: { fire: 1500, spade: 700, money: 1800, wow: 900, crown: 1100 },
    timeAgo: '1d', tab: 'pots',
  },
  {
    id: 'sp12', playerId: 'p9', tag: 'BLUFF',
    content: 'Rivered a soul-read bluff-raise on the bubble. Folded into the money. Ice in the veins.',
    pot: '72,000', likes: 1450, comments: 188,
    reactions: { fire: 980, spade: 340, money: 560, wow: 1100, crown: 420 },
    timeAgo: '18h', tab: 'following',
  },
  {
    id: 'sp13', playerId: 'p11', tag: 'WIN',
    content: 'Runner-runner flush to scoop a monster pot. I know. I know. Still counts.',
    pot: '98,000', handRank: 'Flush', likes: 1020, comments: 140,
    reactions: { fire: 700, spade: 280, money: 680, wow: 900, crown: 180 },
    timeAgo: '7h', tab: 'pots',
  },
  {
    id: 'sp14', playerId: 'p12', tag: 'ALL-IN',
    content: 'Pre-flop shove with A2s vs AK. Flopped the flush draw. Turned the flush. They never saw it coming.',
    pot: '44,000', handRank: 'Flush', likes: 678, comments: 82,
    reactions: { fire: 480, spade: 200, money: 320, wow: 550, crown: 140 },
    timeAgo: '9h', tab: 'following',
  },
  {
    id: 'sp15', playerId: 'p7', tag: 'LEVEL UP',
    content: 'Hit Neon Elite rank. 8 months of grinding. Every bad beat was a lesson. Onwards to Legend. 💜',
    likes: 2400, comments: 356,
    reactions: { fire: 1600, spade: 600, money: 900, wow: 1200, crown: 2000 },
    timeAgo: '2d', tab: 'highlights',
  },
];

// ── Leaderboard entries ───────────────────────────────────────────────────────

export function getLeaderboard(
  category: 'chips' | 'winrate' | 'pots' | 'xp' | 'tournaments',
): Array<{ player: MockPlayer; value: number; label: string }> {
  const sorted = [...MOCK_PLAYERS].sort((a, b) => {
    if (category === 'chips')       return b.chips - a.chips;
    if (category === 'winrate')     return b.winRate - a.winRate;
    if (category === 'pots')        return b.biggestPot - a.biggestPot;
    if (category === 'xp')          return b.level - a.level;
    if (category === 'tournaments') return b.tournamentWins - a.tournamentWins;
    return 0;
  });

  return sorted.map(p => {
    let value = 0;
    let label = '';
    if (category === 'chips')       { value = p.chips;         label = formatBigNum(p.chips) + ' chips'; }
    if (category === 'winrate')     { value = p.winRate;       label = p.winRate + '% win rate'; }
    if (category === 'pots')        { value = p.biggestPot;    label = formatBigNum(p.biggestPot) + ' biggest pot'; }
    if (category === 'xp')          { value = p.level;         label = 'Level ' + p.level; }
    if (category === 'tournaments') { value = p.tournamentWins; label = p.tournamentWins + ' wins'; }
    return { player: p, value, label };
  });
}

function formatBigNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return String(n);
}

// ── Live events ───────────────────────────────────────────────────────────────

export const LIVE_EVENTS: LiveEvent[] = [
  { id: 'le1',  playerId: 'p4', text: 'ShadowKing won a 980K pot 👑', color: '#bf5fff' },
  { id: 'le2',  playerId: 'p1', text: 'NightShark99 hit a Royal Flush 🃏', color: '#00d4ff' },
  { id: 'le3',  playerId: 'p9', text: 'NeonWitch won the Midnight Invitational 🏆', color: '#ff0090' },
  { id: 'le4',  playerId: 'p7', text: 'PokerPhantom reached Neon Elite ⚡', color: '#bf5fff' },
  { id: 'le5',  playerId: 'p2', text: 'VegasMirage bluffed a full house 🎭', color: '#ff0090' },
  { id: 'le6',  playerId: 'p11', text: 'RiverRuler is on a 7-game win streak 🔥', color: '#00d4ff' },
  { id: 'le7',  playerId: 'p3', text: 'NeonAce_ survived a bad beat of the year 😮', color: '#ffd700' },
  { id: 'le8',  playerId: 'p1', text: 'NightShark99 jackpot: 500K chips 💰', color: '#ffd700' },
  { id: 'le9',  playerId: 'p4', text: 'ShadowKing is now #1 on the leaderboard 👑', color: '#ffd700' },
  { id: 'le10', playerId: 'p5', text: 'MiamiDreams just levelled up to Platinum ✨', color: '#00ff88' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getPlayer(id: string): MockPlayer | undefined {
  return MOCK_PLAYERS.find(p => p.id === id);
}

export function getPlayerPosts(playerId: string): SocialPost[] {
  return SOCIAL_POSTS.filter(p => p.playerId === playerId);
}

export const POKER_REACTIONS: Array<{ key: keyof PostReactions; emoji: string; color: string }> = [
  { key: 'fire',  emoji: '🔥', color: '#ff6600' },
  { key: 'spade', emoji: '♠️', color: '#00d4ff' },
  { key: 'money', emoji: '💰', color: '#ffd700' },
  { key: 'wow',   emoji: '😮', color: '#ff0090' },
  { key: 'crown', emoji: '👑', color: '#bf5fff' },
];

export const AVATAR_SYMBOLS = ['♠', '♥', '♦', '♣', '★'];
export const AVATAR_COLORS  = ['#00d4ff', '#ff0090', '#ffd700', '#bf5fff', '#00ff88'];

export const POST_TAG_COLORS: Record<PostTag, string> = {
  WIN:        '#00d4ff',
  BLUFF:      '#bf5fff',
  'BAD BEAT': '#ff8800',
  'ALL-IN':   '#ff0090',
  HIGHLIGHT:  '#00ff88',
  JACKPOT:    '#ffd700',
  'LEVEL UP': '#bf5fff',
  TOURNAMENT: '#ff0090',
};
