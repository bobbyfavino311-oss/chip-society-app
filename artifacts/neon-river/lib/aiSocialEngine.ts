// AI Social Engine — generates authentic poker social content
// Pure in-memory generation — no API calls, no network latency

export interface AIPersonality {
  id: string;
  username: string;
  handle: string;
  avatarInitials: string;
  avatarColor: string;
  rank: string;
  bio: string;
  style: 'aggro' | 'grinder' | 'funny' | 'tilted' | 'braggart';
  favoriteHands: string[];
  catchphrase: string;
}

export type AIPostType = 'BIG_WIN' | 'BAD_BEAT' | 'BLUFF' | 'TOURNAMENT' | 'TILT' | 'FUNNY' | 'SHORT_DECK';

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
    avatarInitials: 'NS', avatarColor: '#00d4ff',
    rank: 'Neon Legend', bio: 'Hunting pots since day one.',
    style: 'aggro', favoriteHands: ['Pocket Aces', 'A-K Suited', 'Royal Flush'],
    catchphrase: 'Table went silent.',
  },
  {
    id: 'ai_02', username: 'VegasMirage', handle: '@vegasmirage',
    avatarInitials: 'VM', avatarColor: '#ff0090',
    rank: 'Neon Elite', bio: 'The art of the fold.',
    style: 'braggart', favoriteHands: ['7-2 Offsuit', 'Bluff hands', 'Any two cards'],
    catchphrase: 'They never saw it coming.',
  },
  {
    id: 'ai_03', username: 'ShadowKing', handle: '@shadowking',
    avatarInitials: 'SK', avatarColor: '#bf5fff',
    rank: 'Neon Legend', bio: 'Aggression is a language.',
    style: 'aggro', favoriteHands: ['Pocket Kings', 'A-Q Suited', 'Suited Connectors'],
    catchphrase: 'Fold equity is real.',
  },
  {
    id: 'ai_04', username: 'ChipBandit', handle: '@chipbandit',
    avatarInitials: 'CB', avatarColor: '#ffd700',
    rank: 'Neon Gold', bio: 'Your chips are my chips.',
    style: 'braggart', favoriteHands: ['Any pair', 'Suited Aces', 'Pocket Nines'],
    catchphrase: 'Stack secured.',
  },
  {
    id: 'ai_05', username: 'BluffMachine', handle: '@bluffmachine',
    avatarInitials: 'BM', avatarColor: '#ff6600',
    rank: 'Neon Platinum', bio: 'Triple barrel or fold.',
    style: 'aggro', favoriteHands: ['T-9 Suited', 'J-10', 'Any two suited'],
    catchphrase: 'FOLD.',
  },
  {
    id: 'ai_06', username: 'RoyalRiver', handle: '@royalriver',
    avatarInitials: 'RR', avatarColor: '#00ff88',
    rank: 'Neon Diamond', bio: 'The river is my best friend.',
    style: 'funny', favoriteHands: ['Pocket Aces', 'Royal Flush dream', 'Suited Connectors'],
    catchphrase: 'And then the river came.',
  },
  {
    id: 'ai_07', username: 'AceHunter', handle: '@acehunter',
    avatarInitials: 'AH', avatarColor: '#00aaff',
    rank: 'Neon Elite', bio: 'All aces, all the time.',
    style: 'grinder', favoriteHands: ['Pocket Aces', 'A-K', 'A-Q'],
    catchphrase: 'Aces do not lie.',
  },
  {
    id: 'ai_08', username: 'TiltDealer', handle: '@tiltdealer',
    avatarInitials: 'TD', avatarColor: '#ff3355',
    rank: 'Neon Silver', bio: 'Currently on tilt. Always.',
    style: 'tilted', favoriteHands: ['Pocket Aces (they always get cracked)', 'KK', 'QQ'],
    catchphrase: 'I quit. Back tomorrow.',
  },
  {
    id: 'ai_09', username: 'RiverRat', handle: '@riverrat',
    avatarInitials: 'RR', avatarColor: '#aaffaa',
    rank: 'Neon Bronze', bio: 'I catch on the river or I die.',
    style: 'tilted', favoriteHands: ['Any draw', 'Gutshot straights', '2-outer situations'],
    catchphrase: 'One time!',
  },
  {
    id: 'ai_10', username: 'PokerPhantom', handle: '@pokerphantom',
    avatarInitials: 'PP', avatarColor: '#cc88ff',
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
  (pot: string) => `${pot} pot and I was never behind. ${pick(['Feels different when you run good.', 'Pure.', 'This is what we grind for.'])}`,
  (pot: string, hand: string) => `${hand} held. ${pot} pot. ${pick(['Finally.', 'As it should be.', 'Variance is a myth when you run hot.'])}`,
];

const BAD_BEAT_TEMPLATES = [
  (hand: string) => `${hand} cracked on the river. ${pick(['I need a moment.', 'Unbelievable.', 'How.', 'Poker is rigged.', 'This game hates me.'])}`,
  (_hand: string) => `Lost with ${pick(['pocket aces', 'KK', 'a set', 'top two pair', 'a flopped flush'])} again. ${pick(['I am cursed.', 'Statistically impossible. Yet here we are.', 'The universe owes me.', 'Please send help.'])}`,
  () => `${pick(['Flopped a set', 'Turned the nut flush', 'Had top two pair', 'Pocket rockets'])}. River ${pick(['paired the board', 'put out a straight', 'gave them a flush', 'made their gutshot'])}. ${pick(['Classic.', 'Cool.', 'Fine.', 'I am fine.'])}`,
  (hand: string) => `Hero fold? No, ${hand}. They rivered it. ${pick(['I need a walk.', 'Thinking of becoming a farmer.', 'See you tomorrow.'])}`,
];

const BLUFF_TEMPLATES = [
  (pot: string) => `Triple-barreled with ${pick(['7-2 offsuit', '8-3 suited', 'complete air', '9-4 off', 'the bluff hand'])} on a ${pick(['scary', 'dry', 'paired', 'coordinated', 'wet'])} board. They folded ${pick(['top pair', 'a set', 'two pair', 'the flush', 'the nuts'])}. ${pot} pot. ${pick(['Art.', 'Chef kiss.', "GTO doesn't cover this.", 'Pure psychology.'])}`,
  (pot: string) => `${pick(['Check-raised', 'Donk-bet', 'Three-bet jammed', 'Fired three barrels'])} as a complete bluff. ${pot} pot. They folded. ${pick(['I will not apologize.', 'Easy game when you know the read.', 'Villain on life tilt now.', 'Respect the range.'])}`,
  () => `Raised the river with ${pick(['nothing', 'seven high', 'a bluff catcher at best', 'pure air'])}. They tanked for ${pick(['2 minutes', '5 minutes', '8 minutes', '3 minutes'])} and folded. ${pick(['Beautiful.', 'Worth every second.', 'This is the game.', 'They knew. They still folded.'])}`,
];

const TOURNAMENT_TEMPLATES = [
  (name: string) => `Final table reached in ${name}. ${pick(['Time to play real poker.', 'Top 3 or bust.', "Let's go.", 'Chip leader. No mercy.'])}`,
  (name: string) => `Bubbled ${name}. ${pick(['Next time.', 'The pain is real.', 'Shoutout to the variance gods.', 'Built character I guess.'])}`,
  (name: string) => `Won ${name}. ${pick(['Unreal.', 'Biggest score of my life.', 'We go again tomorrow.', 'This one is for the grinders.'])}`,
  (name: string) => `Deep run in ${name}. ${pick(['Grinding every hand.', 'Short stacked but alive.', 'Every chip counts now.', 'Running hot at the right time.'])}`,
  (name: string) => `Registered for ${name}. ${pick(['Let the hunt begin.', 'Time to cook.', 'Running it up.', 'Bag it and tag it.'])}`,
];

const TILT_TEMPLATES = [
  () => `${pick(['I need a break', 'That river destroyed me', 'I should not be playing right now', 'Three sessions in a row', 'Four hours of bad beats'])} after that. ${pick(['See you tomorrow.', 'Closing the app.', 'Breathing exercises.', 'I am logging off. For real this time.'])}`,
  () => `${pick(['Pocket aces cracked three times today', 'Lost five flips in a row', 'Set over set twice in one session', 'AA vs KK and KK rivers a set'])}. ${pick(['Totally normal variance.', 'Poker is perfectly balanced.', 'This game is fine.', 'I am fine. Everything is fine.'])}`,
  () => `${pick(['How', 'WHY', 'Explain this', 'Someone help me understand', 'Is this real'])} — ${pick(['they called with J-3', 'they called off their stack with third pair', 'they shoved 72o into my aces', 'they river-jammed with a busted draw that hit'])}. ${pick(['?????', 'I am done.', 'FINE.', 'Absolutely cooked.'])}`,
];

const FUNNY_TEMPLATES = [
  () => `If you ${pick(['limp aces preflop', 'slowplay flopped quads', 'call a 3-bet with 94 offsuit', 'min-raise the river as a bluff', 'open-limp then fold to a raise'])} we cannot be friends.`,
  () => `Poker study tip: ${pick(['watching others play is called research not procrastination', 'variance is just winning and losing in the wrong order', 'GTO is what you call it when you have no idea', 'a bad beat story IS a strategy', 'folding is the only unexploitable move'])}. You are welcome.`,
  () => `${pick(['The table regular just told me about a bad beat from 2019.', 'My opponent tanked for 10 minutes on the flop with air.', 'Villain took three timebanks before folding preflop.', 'They talked me through their entire range analysis. Then shoved with 7-2.'])} ${pick(['This game.', 'Love this.', 'We keep playing.', 'Incredible scenes.'])}`,
  () => `Asked myself ${pick(['what GTO would do', 'what the solver says', 'what the best player at the table would do', "what I'd do with my best hand"])}. Closed the app. Opened it again. Made the same mistake. ${pick(['Consistent.', 'At least I am reliable.', 'Growth.', 'Process.'])}`,
];

const SHORT_DECK_TEMPLATES = [
  (pot: string) => `Short deck is not poker — short deck is ${pick(['art', 'war', 'therapy', 'chaos with rules'])}. ${pot} pot. Flush beat the full house. ${pick(['As it should be.', 'Six-plus supremacy.', 'Regular deck feels slow now.', 'Never going back.'])}`,
  (pot: string) => `Six-plus ${pick(['Flush over Full House', 'set over set over set', 'straight flush on a paired board', 'pocket sixes into quad sixes'])} for a ${pot} pot. ${pick(['This deck is alive.', '36 cards and infinite chaos.', 'Short deck giveth.', 'Run good is amplified here.'])}`,
  () => `${pick(['Flopped trips with 66 in short deck.', 'Three players flopped sets.', 'Four people had flushes at showdown.', 'The board ran out all clubs. Five players in. Chaos.'])} ${pick(['This is why we play.', 'Short deck is different.', 'The 36-card experience.', 'Nothing hits different in six-plus.'])}`,
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPot(): string {
  const amounts = [8, 12, 18, 22, 28, 35, 42, 58, 76, 85, 120, 160, 200, 240, 280, 320, 420, 500];
  const v = amounts[Math.floor(Math.random() * amounts.length)];
  return v >= 1000 ? `${(v / 1000).toFixed(1)}M` : `${v}K`;
}

function randomHand(): string {
  return pick([
    'pocket aces', 'pocket kings', 'pocket queens', 'A-K suited',
    'a flopped set', 'the nut flush', 'four of a kind', 'a full house',
    'a straight flush', 'top two pair', 'a straight', 'trip aces',
  ]);
}

function randomTournament(): string {
  return pick([
    'the Chrome Series', 'Vice City Classic', 'the Midnight Showdown',
    'Royal Circuit', 'Laser Stack Open', 'Short Deck Showdown',
    'the Turbo Heat Cup', 'Black Card Invitational', 'the Cyber Sunday Classic',
    'Vapor Wave Cup', 'Six Plus Showdown', 'the Electric Sunset Open',
  ]);
}

const TAG_MAP: Record<AIPostType, { tag: string; color: string }> = {
  BIG_WIN:     { tag: 'BIG WIN',    color: '#00ff88' },
  BAD_BEAT:    { tag: 'BAD BEAT',   color: '#ffd700' },
  BLUFF:       { tag: 'BLUFF',      color: '#bf5fff' },
  TOURNAMENT:  { tag: 'TOURNAMENT', color: '#00d4ff' },
  TILT:        { tag: 'TILT',       color: '#ff6600' },
  FUNNY:       { tag: 'FUNNY',      color: '#ff0090' },
  SHORT_DECK:  { tag: 'SHORT DECK', color: '#ff0090' },
};

function formatTimeAgo(ts: number): string {
  const diffMin = Math.floor((Date.now() - ts) / 60_000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return `${Math.floor(diffH / 24)}d ago`;
}

let _postCounter = 1000;

export function generateAIPost(): AIPost {
  const personality = pick(AI_PERSONALITIES);
  const type = pick<AIPostType>(['BIG_WIN', 'BIG_WIN', 'BAD_BEAT', 'BLUFF', 'TOURNAMENT', 'TILT', 'FUNNY', 'SHORT_DECK']);
  const pot = randomPot();
  const hand = randomHand();
  const tournament = randomTournament();

  let content: string;
  switch (type) {
    case 'BIG_WIN':    content = pick(WIN_TEMPLATES)(pot, hand); break;
    case 'BAD_BEAT':   content = pick(BAD_BEAT_TEMPLATES)(hand); break;
    case 'BLUFF':      content = pick(BLUFF_TEMPLATES)(pot); break;
    case 'TOURNAMENT': content = pick(TOURNAMENT_TEMPLATES)(tournament); break;
    case 'TILT':       content = pick(TILT_TEMPLATES)(); break;
    case 'FUNNY':      content = pick(FUNNY_TEMPLATES)(); break;
    case 'SHORT_DECK': content = pick(SHORT_DECK_TEMPLATES)(pot); break;
    default:           content = pick(WIN_TEMPLATES)(pot, hand);
  }

  const { tag, color: tagColor } = TAG_MAP[type];
  const likes = Math.floor(Math.random() * 2400) + 50;
  const comments = Math.floor(likes * (0.05 + Math.random() * 0.18));

  return {
    id: `ai_${++_postCounter}_${Date.now()}`,
    type,
    tag,
    tagColor,
    personality,
    content,
    pot: type === 'BIG_WIN' || type === 'BLUFF' || type === 'SHORT_DECK' ? pot : undefined,
    handRank: type === 'BIG_WIN' ? hand : undefined,
    likes,
    comments,
    reactions: {
      fire:  Math.floor(Math.random() * 800) + 10,
      spade: Math.floor(Math.random() * 400) + 5,
      money: Math.floor(Math.random() * 600) + 5,
      wow:   Math.floor(Math.random() * 300) + 2,
      crown: Math.floor(Math.random() * 200) + 2,
    },
    timestamp: Date.now(),
    timeAgo: 'just now',
  };
}

export function seedAIPosts(count = 8): AIPost[] {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => {
    const post = generateAIPost();
    const minsAgo = (count - i) * (7 + Math.floor(Math.random() * 18));
    const ts = now - minsAgo * 60_000;
    return { ...post, timestamp: ts, timeAgo: formatTimeAgo(ts) };
  }).reverse();
}

export { formatTimeAgo };
