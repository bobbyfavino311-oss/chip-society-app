// AI Social Engine — generates authentic poker social content
// Pure in-memory generation — no API calls, no network latency

export interface AIPersonality {
  id: string;
  username: string;
  handle: string;
  avatarInitials: string;
  avatarColor: string;
  avatarId: number;
  rank: string;
  bio: string;
  style: 'aggro' | 'grinder' | 'funny' | 'tilted' | 'braggart';
  favoriteHands: string[];
  catchphrase: string;
}

export type AIPostType = 'BIG_WIN' | 'BAD_BEAT' | 'BLUFF' | 'JACKPOT_WIN' | 'TILT' | 'FUNNY' | 'SHORT_DECK';

export interface AIPost {
  id: string;
  type: AIPostType;
  tag: string;
  tagColor: string;
  personality: AIPersonality;
  content: string;
  pot?: string;
  handRank?: string;
  likes: number;
  comments: number;
  reactions: { fire: number; spade: number; money: number; wow: number; crown: number };
  timestamp: number;
  timeAgo: string;
}

// ─── 10 AI Personalities ───────────────────────────────────────────────────────

export const AI_PERSONALITIES: AIPersonality[] = [
  {
    id: 'ai_01', username: 'NightShark99', handle: '@nightshark99',
    avatarInitials: 'NS', avatarColor: '#00d4ff', avatarId: 12,
    rank: 'Neon Legend', bio: 'Hunting pots since day one.',
    style: 'aggro', favoriteHands: ['Pocket Aces', 'A-K Suited', 'Royal Flush'],
    catchphrase: 'Table went silent.',
  },
  {
    id: 'ai_02', username: 'VegasMirage', handle: '@vegasmirage',
    avatarInitials: 'VM', avatarColor: '#ff0090', avatarId: 15,
    rank: 'Neon Elite', bio: 'The art of the fold.',
    style: 'braggart', favoriteHands: ['7-2 Offsuit', 'Bluff hands', 'Any two cards'],
    catchphrase: 'They never saw it coming.',
  },
  {
    id: 'ai_03', username: 'ShadowKing', handle: '@shadowking',
    avatarInitials: 'SK', avatarColor: '#bf5fff', avatarId: 13,
    rank: 'Neon Legend', bio: 'Aggression is a language.',
    style: 'aggro', favoriteHands: ['Pocket Kings', 'A-Q Suited', 'Suited Connectors'],
    catchphrase: 'Fold equity is real.',
  },
  {
    id: 'ai_04', username: 'ChipBandit', handle: '@chipbandit',
    avatarInitials: 'CB', avatarColor: '#ffd700', avatarId: 10,
    rank: 'Neon Gold', bio: 'Your chips are my chips.',
    style: 'braggart', favoriteHands: ['Any pair', 'Suited Aces', 'Pocket Nines'],
    catchphrase: 'Stack secured.',
  },
  {
    id: 'ai_05', username: 'BluffMachine', handle: '@bluffmachine',
    avatarInitials: 'BM', avatarColor: '#ff6600', avatarId: 9,
    rank: 'Neon Platinum', bio: 'Triple barrel or fold.',
    style: 'aggro', favoriteHands: ['T-9 Suited', 'J-10', 'Any two suited'],
    catchphrase: 'FOLD.',
  },
  {
    id: 'ai_06', username: 'RoyalRiver', handle: '@royalriver',
    avatarInitials: 'RR', avatarColor: '#00ff88', avatarId: 6,
    rank: 'Neon Diamond', bio: 'The river is my best friend.',
    style: 'funny', favoriteHands: ['Pocket Aces', 'Royal Flush dream', 'Suited Connectors'],
    catchphrase: 'And then the river came.',
  },
  {
    id: 'ai_07', username: 'AceHunter', handle: '@acehunter',
    avatarInitials: 'AH', avatarColor: '#00aaff', avatarId: 1,
    rank: 'Neon Elite', bio: 'All aces, all the time.',
    style: 'grinder', favoriteHands: ['Pocket Aces', 'A-K', 'A-Q'],
    catchphrase: 'Aces do not lie.',
  },
  {
    id: 'ai_08', username: 'TiltDealer', handle: '@tiltdealer',
    avatarInitials: 'TD', avatarColor: '#ff3355', avatarId: 11,
    rank: 'Neon Silver', bio: 'Currently on tilt. Always.',
    style: 'tilted', favoriteHands: ['Pocket Aces (they always get cracked)', 'KK', 'QQ'],
    catchphrase: 'I quit. Back tomorrow.',
  },
  {
    id: 'ai_09', username: 'RiverRat', handle: '@riverrat',
    avatarInitials: 'RR', avatarColor: '#aaffaa', avatarId: 7,
    rank: 'Neon Bronze', bio: 'I catch on the river or I die.',
    style: 'tilted', favoriteHands: ['Any draw', 'Gutshot straights', '2-outer situations'],
    catchphrase: 'One time!',
  },
  {
    id: 'ai_10', username: 'PokerPhantom', handle: '@pokerphantom',
    avatarInitials: 'PP', avatarColor: '#cc88ff', avatarId: 8,
    rank: 'Neon Legend', bio: 'You will not see me coming.',
    style: 'grinder', favoriteHands: ['Suited Connectors', 'Pocket Pairs', 'Position hands'],
    catchphrase: 'GTO says fold. I say raise.',
  },
];

// ─── Post templates by type ────────────────────────────────────────────────────

const WIN_TEMPLATES = [
  (pot: string, hand: string) => `Turned ${hand} into a ${pot} pot. ${pick(['Table went silent.', 'Nobody saw it coming.', 'Stacks secured.', 'Easy game.'])}`,
  (pot: string, hand: string) => `${hand} on the river. ${pot} pot my way. ${pick(['Run good.', 'This is the life.', 'Variance finally hit different.', 'Session saved.'])}`,
  (pot: string, hand: string) => `Just stacked the table captain with ${hand}. ${pot} shipped. ${pick(['Not sorry.', 'Good game.', 'Stack transferred successfully.', 'Their loss.'])}`,
  (pot: string, hand: string) => `${hand} holds up. ${pot} in the middle. This is what we grind for.`,
  (pot: string, hand: string) => `Hit ${hand} for ${pot}. ${pick(['Running hot.', 'When the cards align.', 'Session of the year.', 'Poker is easy.'])}`,
];

const BAD_BEAT_TEMPLATES = [
  (hand: string) => `${hand} cracked by a two-outer on the river. This game is rigged.`,
  (hand: string) => `Had ${hand}. They called with garbage. Bricked the flop AND river. Unbelievable.`,
  (hand: string) => `${hand} vs their 7-2 offsuit. They hit two pair. I am done with poker forever.`,
  (hand: string) => `Lost with ${hand} to runner-runner flush. This is a statistical impossibility.`,
  (hand: string) => `${hand} on the flop. Got it in good. Got outdrawn. Poker is not real.`,
];

const BLUFF_TEMPLATES = [
  (pot: string) => `Triple-barreled the whole street. ${pot} pot. They finally folded. GTO certified.`,
  (pot: string) => `Complete air. Bet every street. ${pot} collected. Read them perfectly.`,
  (pot: string) => `Turned nothing into ${pot}. Poker is an art form.`,
  (pot: string) => `They snap-called my bluff. ${pot} gone. Recalibrating.`,
  (pot: string) => `Pure bluff for ${pot}. Heart was pounding. They folded. I am a genius.`,
];

const FUNNY_TEMPLATES = [
  () => `Folded pocket aces preflop. The board ran out AAAK. I am never playing poker again.`,
  () => `Called an all-in with 7-2 offsuit just to see what would happen. Won. Do not recommend.`,
  () => `My read was wrong. My call was wrong. My stack is wrong. Everything is fine.`,
  () => `Misclicked all-in with 2-7. They called with Kings. I flopped quads. This game.`,
  () => `Slowplayed quads into a river bet that was actually a bluff. Sometimes you just lose.`,
  () => `Told myself one more hand two hours ago. Still here. The table is my home now.`,
];

const TILT_TEMPLATES = [
  () => `Three bad beats in a row. My bankroll has left the building. Taking a five-minute break that will be three hours.`,
  () => `I had the nuts. They rivered a straight flush. A STRAIGHT FLUSH. I need air.`,
  () => `Called a raise with 7-2 offsuit. Hit two pair. Raised again. Lost to a flush. I deserve this.`,
  () => `Poker is a game of skill they said. It will be fun they said. Running 0 for 11 on coin flips.`,
  () => `Lost four buy-ins to the same player. They just call everything and somehow win. Is this legal?`,
];

const JACKPOT_WIN_TEMPLATES = [
  (pot: string) => `Daily spin just hit ${pot}. Did not even see it coming. The neon gods smiled today.`,
  (pot: string) => `Fortune cookie cracked for ${pot} chips. Luck or skill? At this point, both.`,
  (pot: string) => `Jackpot wheel landed on ${pot}. ${pick(['Screen shook.', 'Chat went wild.', 'Lobby exploded.', 'Still shaking.'])}`,
  (pot: string) => `Scratched the ${pot} prize on the bonus wheel. This game is giving tonight.`,
  (pot: string) => `Hit the ${pot} jackpot after a 4-hour grind. Variance paid the bills today.`,
];

const SHORT_DECK_TEMPLATES = [
  (hand: string) => `Short Deck changed everything. ${hand} hits so differently with 36 cards.`,
  (hand: string) => `Flush beats full house in Short Deck. Flopped ${hand}. Table chaos.`,
  (hand: string) => `${hand} in Short Deck is basically the nuts. Played it perfectly.`,
];

// ─── Utility ────────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function _fmtChip(n: number): string {
  const v = (x: number) => x % 1 === 0 ? x.toFixed(0) : x.toFixed(1);
  if (n >= 1_000_000_000) return v(n / 1_000_000_000) + 'B';
  if (n >= 1_000_000)     return v(n / 1_000_000) + 'M';
  if (n >= 1_000)         return v(n / 1_000) + 'K';
  return String(n);
}
function randomPot(): string {
  const amount = pick([12500, 25000, 50000, 75000, 100000, 150000, 200000, 250000, 350000, 500000]);
  return _fmtChip(amount);
}

function timeAgo(ms: number): string {
  const minutes = Math.floor((Date.now() - ms) / 60000);
  if (minutes < 1)  return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function formatTimeAgo(ms: number): string { return timeAgo(ms); }

// ─── Post generation ─────────────────────────────────────────────────────────────

const HAND_RANKS = ['Pocket Aces', 'Pocket Kings', 'Royal Flush', 'Straight Flush', 'Quads', 'Full House', 'Flush', 'Set of Nines', 'Nut Straight', 'Pocket Queens', 'A-K Suited'];

const TAG_MAP: Record<AIPostType, { tag: string; color: string }> = {
  BIG_WIN:     { tag: 'WIN',      color: '#00ff88' },
  BAD_BEAT:    { tag: 'BAD BEAT', color: '#ff3355' },
  BLUFF:       { tag: 'BLUFF',    color: '#ffd700' },
  JACKPOT_WIN: { tag: 'JACKPOT',  color: '#bf5fff' },
  TILT:        { tag: 'ALL-IN',   color: '#ff6600' },
  FUNNY:       { tag: 'JACKPOT',  color: '#00d4ff' },
  SHORT_DECK:  { tag: 'WIN',      color: '#00ff88' },
};

export function seedAIPosts(count = 8): AIPost[] {
  return Array.from({ length: count }, (_, i) => generateAIPost(String(i)));
}

export function generateAIPost(idSuffix = String(Date.now())): AIPost {
  const personality = pick(AI_PERSONALITIES);
  const type = pick<AIPostType>(['BIG_WIN', 'BAD_BEAT', 'BLUFF', 'JACKPOT_WIN', 'TILT', 'FUNNY', 'SHORT_DECK']);
  const hand = pick(HAND_RANKS);
  const pot  = randomPot();
  const { tag, color: tagColor } = TAG_MAP[type];

  let content: string;
  switch (type) {
    case 'BIG_WIN':    content = pick(WIN_TEMPLATES)(pot, hand);       break;
    case 'BAD_BEAT':   content = pick(BAD_BEAT_TEMPLATES)(hand);       break;
    case 'BLUFF':      content = pick(BLUFF_TEMPLATES)(pot);           break;
    case 'FUNNY':      content = pick(FUNNY_TEMPLATES)();              break;
    case 'TILT':       content = pick(TILT_TEMPLATES)();               break;
    case 'SHORT_DECK':  content = pick(SHORT_DECK_TEMPLATES)(hand);          break;
    case 'JACKPOT_WIN': content = pick(JACKPOT_WIN_TEMPLATES)(randomPot());  break;
    default: content = '';
  }

  const timestamp = Date.now() - Math.floor(Math.random() * 4 * 60 * 60 * 1000);

  return {
    id: `ai_${idSuffix}_${Date.now()}`,
    type,
    tag,
    tagColor,
    personality,
    content,
    pot:      type === 'BIG_WIN' || type === 'BLUFF' ? pot  : undefined,
    handRank: type === 'BIG_WIN' || type === 'BAD_BEAT' ? hand : undefined,
    likes:    Math.floor(Math.random() * 4800) + 50,
    comments: Math.floor(Math.random() * 320) + 5,
    reactions: {
      fire:  Math.floor(Math.random() * 1200),
      spade: Math.floor(Math.random() * 800),
      money: Math.floor(Math.random() * 600),
      wow:   Math.floor(Math.random() * 400),
      crown: Math.floor(Math.random() * 200),
    },
    timestamp,
    timeAgo: timeAgo(timestamp),
  };
}
