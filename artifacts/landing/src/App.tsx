import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { FaApple, FaTwitter, FaDiscord, FaInstagram } from 'react-icons/fa';
import {
  ChevronDown, ChevronLeft, ChevronRight,
  Zap, Trophy, Users, Star, Shield, Coins,
  Target, Gift, Flame, Calendar, BarChart2,
  Palette, Bell, Award, Sparkles,
} from 'lucide-react';

const BASE = import.meta.env.BASE_URL;

/* ── Particles ─────────────────────────────────────────────────────────────── */
function Particles() {
  const count = 28;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: count }).map((_, i) => {
        const x  = Math.random() * 100;
        const y  = Math.random() * 100;
        const d  = 6 + Math.random() * 20;
        const s  = 0.5 + Math.random() * 1.5;
        const c  = ['#00d4ff', '#bf5fff', '#ff0090', '#ffd700'][i % 4];
        return (
          <motion.div
            key={i}
            className="absolute rounded-full opacity-30"
            style={{ left: `${x}%`, top: `${y}%`, width: s, height: s, backgroundColor: c }}
            animate={{ y: [0, -30, 0], opacity: [0.15, 0.45, 0.15] }}
            transition={{ duration: d, repeat: Infinity, ease: 'easeInOut', delay: Math.random() * 10 }}
          />
        );
      })}
    </div>
  );
}

/* ── Ambient glow orbs ─────────────────────────────────────────────────────── */
function AmbientOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-[#bf5fff]/8 blur-[120px]" />
      <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#00d4ff]/7 blur-[120px]" />
      <div className="absolute bottom-[10%] left-[20%] w-[400px] h-[400px] rounded-full bg-[#ff0090]/6 blur-[100px]" />
    </div>
  );
}

/* ── Section heading ───────────────────────────────────────────────────────── */
function SectionHeading({ label, title, sub, color = '#00d4ff' }: { label: string; title: string; sub?: string; color?: string }) {
  return (
    <div className="text-center mb-14">
      <span className="inline-block px-4 py-1.5 rounded-full border text-[11px] font-display font-black tracking-[0.2em] uppercase mb-4"
        style={{ color, borderColor: `${color}40`, backgroundColor: `${color}12` }}>
        {label}
      </span>
      <h2 className="font-display text-4xl md:text-5xl font-black text-white uppercase tracking-tight leading-none mb-4">{title}</h2>
      {sub && <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">{sub}</p>}
    </div>
  );
}

/* ── Chevron Dropdown ──────────────────────────────────────────────────────── */
function Dropdown({ trigger, children }: { trigger: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border rounded-xl overflow-hidden transition-all duration-200 ${open ? 'border-white/20 bg-white/[0.04]' : 'border-white/10 bg-white/[0.02]'}`}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left hover:bg-white/5 transition-colors">
        {trigger}
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-300 text-white/40 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="b" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="px-6 pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── GAME DATA ─────────────────────────────────────────────────────────────── */
const POKER_GAMES = [
  {
    id: 'texas', label: "Traditional Hold'em", badge: 'Classic', color: '#00d4ff',
    deck: '52-card deck · Standard rankings · Full House beats Flush',
    tagline: "The gold standard of poker. Two hole cards, five community cards — your read of the table is everything.",
    features: ['Cash Games', 'Multiplayer', 'AI Bots', 'Achievements', 'Daily Missions', 'Social Posting'],
    rules: [
      { h: 'The Deck', b: 'Full 52-card deck — 2 through Ace in all four suits.' },
      { h: 'Hole Cards', b: 'Each player is dealt 2 private hole cards face-down.' },
      { h: 'Community Cards', b: 'Five shared cards: Flop (3), Turn (1), River (1).' },
      { h: 'Hand Rankings', b: 'Royal Flush › Straight Flush › Four of a Kind › Full House › Flush › Straight › Three of a Kind › Two Pair › Pair › High Card.' },
      { h: 'Betting', b: 'No Limit — bet any amount up to your entire stack at any time.' },
    ],
  },
  {
    id: 'omaha', label: "Omaha Hold'em", badge: 'Action Game', color: '#00ff88',
    deck: '52-card deck · 4 hole cards · Must use exactly 2',
    tagline: "Four hole cards means more possibilities — and one strict rule: you must always use exactly two of them.",
    features: ['4 Hole Cards', 'Bigger Pots', 'AI Bots', 'Achievements', 'Daily Missions', 'Quick Play'],
    rules: [
      { h: 'Four Hole Cards', b: 'Every player receives 4 private hole cards instead of 2.' },
      { h: 'The Key Rule', b: 'You MUST use exactly 2 hole cards AND exactly 3 community cards — no exceptions.' },
      { h: '60 Combinations', b: 'C(4,2) × C(5,3) = 60 possible hands per player vs 21 in Hold\'em.' },
      { h: 'Stronger Average Hands', b: 'Two pair rarely wins. Drawing to the nuts is critical.' },
    ],
  },
  {
    id: 'shortdeck', label: "Short Deck Hold'em", badge: 'Six-Plus', color: '#ff0090',
    deck: '36-card deck · 6 through Ace only · Flush beats Full House',
    tagline: "Strip out the low cards and watch hand frequencies flip. Classic strategy doesn't apply.",
    features: ['36-Card Deck', 'Flush > Full House', 'AI Bots', 'Achievements', 'Daily Missions', 'Quick Play'],
    rules: [
      { h: 'The Deck', b: '36 cards — all 2s, 3s, 4s, and 5s removed. Runs 6 through Ace.' },
      { h: 'Flush Beats Full House', b: 'Flushes are rarer in a shorter deck — they outrank Full House.' },
      { h: 'No Wheel Straight', b: 'A-2-3-4-5 is impossible. Lowest straight is 6-7-8-9-10.' },
      { h: 'Antes', b: 'Antes are used instead of blinds in most formats.' },
    ],
  },
  {
    id: 'joker', label: "Joker Hold'em", badge: 'Wild Card', color: '#ffd700',
    deck: '54-card deck · Two Wild Jokers · Five of a Kind beats Royal Flush',
    tagline: "Two wild Jokers shuffle everything. Five of a Kind is now the pinnacle — nothing is safe until the river.",
    features: ['Wild Jokers', 'Five of a Kind', 'AI Bots', 'Achievements', 'Daily Missions', 'Big Swings'],
    rules: [
      { h: 'Wild Jokers', b: 'A Joker automatically becomes the best possible rank and suit for your hand.' },
      { h: 'Five of a Kind', b: 'The new top hand — five cards of the same rank, beating even a Royal Flush.' },
      { h: 'Hand Rankings', b: 'Five of a Kind › Royal Flush › Straight Flush › Four of a Kind › …' },
      { h: 'Escalating Pots', b: 'With Jokers on the board, pot sizes climb fast. Expect big swings.' },
    ],
  },
];

const CASINO_GAMES = [
  { id: 'blackjack', label: 'Blackjack', color: '#00d4ff', icon: '🃏', desc: 'Six Deck · Beat the dealer', detail: 'Classic six-deck blackjack. Hit, Stand, Double Down, or Split — get closer to 21 than the dealer without busting.' },
  { id: 'three', label: 'Three Card Poker', color: '#bf5fff', icon: '♠', desc: 'Ante · Pair Plus · 6 Card Bonus', detail: 'Ante and Pair Plus bets. Beat the dealer\'s three-card hand or collect on pair or better. Optional 6 Card Bonus side bet.' },
  { id: 'uth', label: 'Ultimate Texas Hold\'em', color: '#ff0090', icon: '♥', desc: 'Ante · Blind · Trips Bonus · Play up to 4x', detail: 'Bet against the dealer — not other players. Trips Bonus pays regardless of the dealer\'s hand. Play 4x before the flop.' },
  { id: 'war', label: 'Casino War', color: '#ffd700', icon: '⚔️', desc: 'Instant action · Tie pays 10:1', detail: 'Pure instant action. Player vs dealer — high card wins. Tie? Go to War or surrender. No skill required, all drama.' },
  { id: 'hcf', label: 'High Card Flush', color: '#00ff88', icon: '♦', desc: '7 cards · Longest flush wins', detail: 'Seven cards, best flush hand wins. Ante and Flush bets — the more cards in your flush, the bigger the payout.' },
  { id: 'letitride', label: 'Let It Ride', color: '#ff6b35', icon: '🎰', desc: 'Three bets · Pull back two · Pair of 10s wins', detail: 'Three equal bets on the table. Pull back up to two of them as community cards reveal. Pair of 10s or better wins.' },
  { id: 'stud', label: 'Mississippi Stud', color: '#a78bfa', icon: '★', desc: '2 hole cards + 3 community · Jacks or better', detail: '2 hole cards and 3 community cards. Place ante then raise or fold at each street. Pair of Jacks or better pays out.' },
];

const FEATURES = [
  { icon: Users, label: 'Social Feed', color: '#00d4ff', desc: 'Post big wins, bad beats, royal flushes. Like, comment, and repost from players worldwide.' },
  { icon: Zap, label: 'AI Players', color: '#bf5fff', desc: '5 difficulty levels from Beginner to Elite. Play offline against intelligent bots anytime.' },
  { icon: Target, label: 'Daily Missions', color: '#ff0090', desc: '5 fresh missions every day. Earn chips, XP, and the Legendary Fortune Cookie grand reward.' },
  { icon: Award, label: 'Achievements', color: '#ffd700', desc: 'Dozens of achievement cards for royal flushes, tournament wins, bluffs, and more.' },
  { icon: Gift, label: 'Fortune Cookies', color: '#ff6b35', desc: 'Common, Rare, Epic, Legendary, and Theme cookies — each with unique chip prizes and surprises.' },
  { icon: Trophy, label: 'Tournaments', color: '#00ff88', desc: 'Daily and weekly tournaments with massive virtual chip prize pools. Crown a champion.' },
  { icon: BarChart2, label: 'Leaderboards', color: '#00d4ff', desc: 'Global and friend leaderboards. Track weekly chip leaders and tournament champions.' },
  { icon: Star, label: 'Profile Levels', color: '#bf5fff', desc: '7 prestige ranks from Neon Bronze to Neon Legend. Show your rank everywhere.' },
  { icon: Sparkles, label: 'Scratch Tickets', color: '#ff0090', desc: 'Scratch tickets with instant chip prizes. Daily free tickets, plus packs in the store.' },
  { icon: Palette, label: 'Multiple Themes', color: '#ffd700', desc: 'Dark synthwave, neon casino, retro arcade — unlock new table themes as you play.' },
  { icon: Flame, label: 'Daily Streak', color: '#ff6b35', desc: 'Log in every day to claim streak rewards. Longer streaks mean bigger daily chip bonuses.' },
  { icon: Calendar, label: 'Daily Spin', color: '#00ff88', desc: 'Free daily spin wheel with chip prizes up to 100K. Spin every 24 hours.' },
  { icon: Bell, label: 'Custom Avatars', color: '#00d4ff', desc: '80 cinematic character portraits across Common, Rare, Epic and Legendary tiers.' },
  { icon: Shield, label: 'Secure Accounts', color: '#bf5fff', desc: 'Username + PIN authentication. No email required to start. Optional account recovery.' },
];

const FEED_POSTS = [
  { user: 'NightShark99', tag: 'WIN', tagColor: '#00ff88', time: '2h ago', content: 'Royal Flush on the river. The whole table went silent. I just sat there and let it breathe.', pot: '42,400', hand: 'Royal Flush', likes: 1240, comments: 87 },
  { user: 'VegasMirage', tag: 'BLUFF', tagColor: '#ff0090', time: '4h ago', content: 'Triple-barrel bluffed with 7-2 offsuit on a KQ4 paired board. They had a set and they folded. This is art.', pot: '18,200', hand: '7-2 Offsuit', likes: 887, comments: 142 },
  { user: 'AceHunter', tag: 'ALL-IN', tagColor: '#ffd700', time: '1h ago', content: 'Shoved all-in with pocket aces pre-flop. Three callers. Board ran out J-J-J-J-2. Lost to quad jacks. I quit.', pot: '95,000', hand: 'Pocket Aces', likes: 3421, comments: 214 },
  { user: 'ChipBaron', tag: 'JACKPOT', tagColor: '#bf5fff', time: '30m ago', content: 'Daily spin just hit 12.5K. Did not even see it coming. The neon gods smiled today.', pot: '12,500', hand: 'Daily Spin', likes: 3002, comments: 76 },
];

const COOKIE_TIERS = [
  { label: 'Common', color: '#888aaa', range: '0–500 chips', desc: 'Small chip prizes, daily mission base reward.' },
  { label: 'Rare', color: '#00d4ff', range: '1K–10K chips', desc: 'Bonus chips + XP boost.' },
  { label: 'Epic', color: '#bf5fff', range: '10K–50K chips', desc: 'Big chip reward + cosmetic prizes.' },
  { label: 'Legendary', color: '#ffd700', range: '50K–200K chips', desc: 'Massive reward + exclusive unlocks. Grand Reward for completing all 5 daily missions.' },
  { label: 'Mythic', color: '#ff0090', range: 'Ultra Rare', desc: 'Rarest tier. Exclusive table themes, animated frames, and legendary chip prizes.' },
];

const MISSIONS_PREVIEW = [
  { title: 'Win a Hand', desc: 'Win any hand in Texas Hold\'em', progress: 1, target: 1, rarity: 'COMMON', color: '#888aaa', reward: '250 chips' },
  { title: 'Play 5 Games', desc: 'Play 5 games in Short Deck', progress: 3, target: 5, rarity: 'COMMON', color: '#888aaa', reward: '500 chips' },
  { title: 'Hit a Flush', desc: 'Win with a Flush or better', progress: 1, target: 1, rarity: 'RARE', color: '#00d4ff', reward: '1,500 chips' },
  { title: 'Bluff & Win', desc: 'Win a hand by making everyone fold', progress: 0, target: 1, rarity: 'RARE', color: '#00d4ff', reward: '2,000 chips' },
  { title: 'Win 5K+ Pot', desc: 'Win a pot of 5,000 chips or more', progress: 0, target: 1, rarity: 'EPIC', color: '#bf5fff', reward: '5,000 chips' },
];

const FAQ_DATA = [
  { q: 'What is Chip Society?', a: 'Chip Society is a premium social casino gaming platform for iOS. Play Texas Hold\'em, Omaha, Short Deck, Joker Hold\'em, Blackjack, Three Card Poker, Ultimate Texas Hold\'em, and more — all with virtual chips.' },
  { q: 'Is it free to play?', a: 'Yes. Chip Society is free to download and play. You start with 50,000 virtual chips. Optional chip bundles are available in the store, but you can enjoy every game mode for free.' },
  { q: 'What games are included?', a: 'Poker: Traditional Hold\'em, Omaha, Short Deck, Joker Hold\'em. Casino: Blackjack, Three Card Poker, Ultimate Texas Hold\'em, Casino War, High Card Flush, Let It Ride, Mississippi Stud.' },
  { q: 'How do tournaments work?', a: 'Daily and weekly tournaments run in the Tournaments tab. Pay the virtual chip buy-in, compete against other players, and win chip prizes and exclusive cosmetics.' },
  { q: 'How do Fortune Cookies work?', a: 'Fortune Cookies come in 5 tiers: Common, Rare, Epic, Legendary, and Theme. Open them for chip prizes. Complete all 5 daily missions to earn a Legendary Fortune Cookie as the grand reward.' },
  { q: 'Can I play with friends?', a: 'Yes — invite friends via the social feed, follow each other, and join multiplayer Quick Play tables where you can be matched together.' },
  { q: 'How do Daily Missions work?', a: 'Every day at midnight you get 5 fresh missions with varying difficulty. Claim each reward as you complete them. Claim all 5 to earn a Legendary Fortune Cookie grand reward.' },
  { q: 'Is there real money involved?', a: 'No. Chip Society uses virtual chips only. There is no real-money gambling, no real-money prizes, and chips cannot be cashed out. Ever.' },
  { q: 'What is the social feed?', a: 'The Feed is a built-in social network for poker players. Post your big wins, bad beats, and bluffs. Follow players, like and comment on posts, and see trending hands from around the world.' },
];

/* ── App screenshots ───────────────────────────────────────────────────────── */
const SCREENSHOTS = [
  { src: `${BASE}screen-home.jpeg`,     label: 'Home',      sub: 'Daily rewards, trending feed, quick play' },
  { src: `${BASE}screen-gameplay.png`,  label: 'Gameplay',  sub: 'Sleek, focused table design' },
  { src: `${BASE}screen-play.jpeg`,     label: 'Play',      sub: 'All poker variants in one place' },
  { src: `${BASE}screen-casino.jpeg`,   label: 'Casino',    sub: '7 premium casino table games' },
  { src: `${BASE}screen-feed.jpeg`,     label: 'Feed',      sub: 'Social network for poker players' },
];

/* ── Screenshot carousel ───────────────────────────────────────────────────── */
function ScreenshotCarousel() {
  const [active, setActive] = useState(0);
  const prev = () => setActive(a => (a - 1 + SCREENSHOTS.length) % SCREENSHOTS.length);
  const next = () => setActive(a => (a + 1) % SCREENSHOTS.length);

  useEffect(() => {
    const id = setInterval(() => setActive(a => (a + 1) % SCREENSHOTS.length), 3500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-center gap-8">
      {/* phones row */}
      <div className="flex items-end justify-center gap-4 md:gap-6">
        {SCREENSHOTS.map((s, i) => {
          const dist = Math.abs(i - active);
          const scale = dist === 0 ? 1 : dist === 1 ? 0.82 : 0.68;
          const opacity = dist === 0 ? 1 : dist === 1 ? 0.6 : 0.35;
          const zIndex = dist === 0 ? 10 : dist === 1 ? 5 : 1;
          return (
            <motion.div key={i} animate={{ scale, opacity, y: dist === 0 ? 0 : dist === 1 ? 16 : 28 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              style={{ zIndex }}
              className="cursor-pointer shrink-0"
              onClick={() => setActive(i)}
            >
              {/* phone shell */}
              <div className="relative" style={{ width: dist === 0 ? 220 : dist === 1 ? 180 : 150 }}>
                <div className="rounded-[32px] border-[3px] border-white/20 bg-black overflow-hidden shadow-2xl"
                  style={{ boxShadow: dist === 0 ? '0 0 60px rgba(191,95,255,0.35), 0 30px 60px rgba(0,0,0,0.8)' : 'none' }}>
                  {/* notch */}
                  <div className="bg-black flex justify-center pt-2 pb-1">
                    <div className="w-20 h-5 rounded-full bg-black border border-white/10" />
                  </div>
                  <img src={s.src} alt={s.label} className="w-full object-cover" style={{ aspectRatio: '9/19' }} />
                  <div className="bg-black h-4" />
                </div>
                {/* glow under active */}
                {dist === 0 && (
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-6 rounded-full bg-[#bf5fff]/30 blur-xl" />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* label */}
      <AnimatePresence mode="wait">
        <motion.div key={active} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="text-center">
          <p className="font-display font-black text-xl text-white tracking-wider uppercase">{SCREENSHOTS[active].label}</p>
          <p className="text-gray-500 text-sm mt-1">{SCREENSHOTS[active].sub}</p>
        </motion.div>
      </AnimatePresence>

      {/* nav dots + arrows */}
      <div className="flex items-center gap-4">
        <button onClick={prev} className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center hover:border-white/40 transition-colors">
          <ChevronLeft className="w-4 h-4 text-white/60" />
        </button>
        <div className="flex gap-2">
          {SCREENSHOTS.map((_, i) => (
            <button key={i} onClick={() => setActive(i)}
              className="rounded-full transition-all duration-300"
              style={{ width: i === active ? 24 : 8, height: 8, backgroundColor: i === active ? '#bf5fff' : 'rgba(255,255,255,0.2)' }} />
          ))}
        </div>
        <button onClick={next} className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center hover:border-white/40 transition-colors">
          <ChevronRight className="w-4 h-4 text-white/60" />
        </button>
      </div>
    </div>
  );
}

/* ── Poker game card ───────────────────────────────────────────────────────── */
function PokerGameCard({ game }: { game: typeof POKER_GAMES[0] }) {
  const [rulesOpen, setRulesOpen] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.5 }}
      className="rounded-2xl border bg-white/[0.025] overflow-hidden transition-all duration-300"
      style={{ borderColor: `${game.color}35` }}
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <span className="inline-block px-3 py-1 rounded-full border text-[10px] font-display font-black tracking-widest uppercase mb-3"
              style={{ color: game.color, borderColor: `${game.color}40`, backgroundColor: `${game.color}12` }}>
              {game.badge}
            </span>
            <h3 className="font-display text-2xl font-black text-white uppercase tracking-tight">{game.label}</h3>
            <p className="text-[11px] text-white/40 font-display tracking-wider uppercase mt-1">{game.deck}</p>
          </div>
        </div>
        <p className="text-gray-400 text-sm leading-relaxed mb-5">{game.tagline}</p>
        <div className="flex flex-wrap gap-2">
          {game.features.map(f => (
            <span key={f} className="text-[10px] font-display font-bold tracking-wider px-2.5 py-1 rounded-full"
              style={{ color: game.color, backgroundColor: `${game.color}12`, border: `1px solid ${game.color}25` }}>
              {f}
            </span>
          ))}
        </div>
      </div>
      <button onClick={() => setRulesOpen(!rulesOpen)}
        className="w-full flex items-center justify-between px-6 py-3 border-t transition-colors text-sm font-display font-bold tracking-wider uppercase hover:bg-white/5"
        style={{ borderColor: `${game.color}20`, color: game.color }}>
        {rulesOpen ? 'Hide Rules' : 'View Full Rules'}
        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${rulesOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {rulesOpen && (
          <motion.div key="r" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
            <div className="px-6 pb-6 pt-4 space-y-3 border-t" style={{ borderColor: `${game.color}15` }}>
              {game.rules.map((rule, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[10px] font-display font-black mt-0.5"
                    style={{ backgroundColor: `${game.color}20`, color: game.color, border: `1px solid ${game.color}35` }}>
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{rule.h}</p>
                    <p className="text-gray-500 text-sm leading-relaxed">{rule.b}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Casino game card ──────────────────────────────────────────────────────── */
function CasinoGameCard({ game, delay }: { game: typeof CASINO_GAMES[0]; delay: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }} transition={{ duration: 0.4, delay }}
      className="rounded-xl border bg-white/[0.025] p-5 flex items-center gap-4 transition-all duration-300"
      style={{ borderColor: `${game.color}25` }}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 transition-transform duration-300 group-hover:scale-110"
        style={{ backgroundColor: `${game.color}15`, border: `1px solid ${game.color}30` }}>
        {game.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display font-black text-white text-sm uppercase tracking-wide">{game.label}</p>
        <p className="text-gray-500 text-xs mt-0.5">{game.desc}</p>
        <p className="text-gray-600 text-xs mt-1 leading-snug line-clamp-1">{game.detail}</p>
      </div>
    </motion.div>
  );
}

/* ── Feature card ──────────────────────────────────────────────────────────── */
function FeatureCard({ feat, delay }: { feat: typeof FEATURES[0]; delay: number }) {
  const Icon = feat.icon;
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }} transition={{ duration: 0.4, delay }}
      className="rounded-xl border bg-white/[0.025] p-5 hover:bg-white/[0.05] transition-all duration-300 group"
      style={{ borderColor: `${feat.color}22` }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110"
        style={{ backgroundColor: `${feat.color}15`, border: `1px solid ${feat.color}30` }}>
        <Icon className="w-5 h-5" style={{ color: feat.color }} />
      </div>
      <p className="font-display font-black text-white text-sm uppercase tracking-wide mb-1">{feat.label}</p>
      <p className="text-gray-500 text-xs leading-relaxed">{feat.desc}</p>
    </motion.div>
  );
}

/* ── Main App ──────────────────────────────────────────────────────────────── */
export default function App() {
  const [navScrolled, setNavScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 600], [0, 120]);

  useEffect(() => {
    const unsub = scrollY.on('change', v => setNavScrolled(v > 40));
    return unsub;
  }, [scrollY]);

  return (
    <div className="min-h-screen bg-[#050010] text-white font-sans overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navScrolled ? 'bg-[#050010]/95 backdrop-blur-md border-b border-white/8' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={`${BASE}icon.png`} alt="Chip Society" className="w-8 h-8 rounded-lg" />
            <span className="font-display font-black text-white tracking-widest text-sm uppercase">Chip Society</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-xs font-display font-bold tracking-widest uppercase text-white/50">
            <a href="#games" className="hover:text-[#00d4ff] transition-colors">Games</a>
            <a href="#features" className="hover:text-[#bf5fff] transition-colors">Features</a>
            <a href="#social" className="hover:text-[#ff0090] transition-colors">Social</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>
          <a href="#download"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#bf5fff]/15 border border-[#bf5fff]/40 text-[#bf5fff] text-xs font-display font-black tracking-widest uppercase hover:bg-[#bf5fff]/25 transition-all">
            <FaApple className="w-3.5 h-3.5" /> Download
          </a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-24 pb-20">
        <AmbientOrbs />
        <Particles />
        {/* Miami skyline gradient horizon */}
        <div className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(5,0,16,1) 0%, rgba(30,0,60,0.4) 50%, transparent 100%)' }} />
        {/* Horizontal neon horizon line */}
        <div className="absolute bottom-32 left-0 right-0 h-px pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent 0%, #bf5fff44 30%, #ff009044 50%, #00d4ff44 70%, transparent 100%)' }} />

        <motion.div style={{ y: heroY }} className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          {/* Logo */}
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: 'easeOut' }} className="mb-8">
            <img src={`${BASE}icon.png`} alt="Chip Society" className="w-20 h-20 rounded-2xl mx-auto mb-6 shadow-[0_0_50px_rgba(191,95,255,0.5)]" />
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#bf5fff]/60" />
              <span className="font-display text-[11px] font-black tracking-[0.35em] uppercase text-[#bf5fff]/80">Social Poker Network</span>
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#bf5fff]/60" />
            </div>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="font-display font-black leading-[0.9] uppercase tracking-tight mb-6">
            <span className="block text-6xl md:text-8xl text-white">The Ultimate</span>
            <span className="block text-6xl md:text-8xl"
              style={{ background: 'linear-gradient(135deg, #00d4ff 0%, #bf5fff 50%, #ff0090 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Social Casino
            </span>
            <span className="block text-6xl md:text-8xl text-white">Network</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-gray-400 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed mb-10">
            Play Texas Hold'em, Omaha, Blackjack, Three Card Poker, Ultimate Texas Hold'em,<br className="hidden md:block" />
            Short Deck, Joker Hold'em, tournaments, achievements, daily missions, social feed and more.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <a id="download" href="#"
              className="flex items-center gap-3 px-8 py-4 rounded-2xl font-display font-black text-sm tracking-widest uppercase transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(191,95,255,0.5)]"
              style={{ background: 'linear-gradient(135deg, #bf5fff 0%, #8b3adb 100%)', boxShadow: '0 0 30px rgba(191,95,255,0.35)' }}>
              <FaApple className="w-5 h-5" /> Download Now
            </a>
            <a href="#games"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl border border-white/20 font-display font-black text-sm tracking-widest uppercase text-white/70 hover:border-white/40 hover:text-white transition-all">
              View Games
            </a>
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
            className="text-xs text-gray-600 font-display tracking-widest uppercase">
            Virtual chips only · No real-money gambling · Free to play
          </motion.p>
        </motion.div>

        {/* scroll indicator */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <div className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center pt-1.5">
            <motion.div className="w-1 h-1.5 rounded-full bg-white/60"
              animate={{ y: [0, 12, 0] }} transition={{ duration: 1.5, repeat: Infinity }} />
          </div>
        </motion.div>
      </section>

      {/* ── APP SCREENSHOTS ── */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-[#bf5fff]/5 blur-[100px]" />
        </div>
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <SectionHeading label="See It In Action" title="The App" sub="Real screenshots from the live Chip Society app on iOS." color="#bf5fff" />
          <ScreenshotCarousel />
        </div>
      </section>

      {/* ── POKER GAMES ── */}
      <section id="games" className="relative py-24">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[#00d4ff]/5 blur-[120px]" />
        </div>
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <SectionHeading label="Poker Variants" title="Play Poker" sub="Four distinct Texas Hold'em variants — each with its own strategy, hand rankings, and pace." color="#00d4ff" />
          <div className="grid md:grid-cols-2 gap-6">
            {POKER_GAMES.map(g => <PokerGameCard key={g.id} game={g} />)}
          </div>
        </div>
      </section>

      {/* ── CASINO GAMES ── */}
      <section className="relative py-24">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-[#ffd700]/4 blur-[120px]" />
        </div>
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <SectionHeading label="Casino Table Games" title="Bet Against The Dealer" sub="Seven premium casino games — from Blackjack to Mississippi Stud. All with virtual chips." color="#ffd700" />
          <div className="grid md:grid-cols-2 gap-4">
            {CASINO_GAMES.map((g, i) => <CasinoGameCard key={g.id} game={g} delay={i * 0.06} />)}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="relative py-24">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#ff0090]/4 blur-[120px]" />
        </div>
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <SectionHeading label="Platform Features" title="Everything You Need" sub="A complete casino gaming ecosystem — not just a poker app." color="#ff0090" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {FEATURES.map((f, i) => <FeatureCard key={f.label} feat={f} delay={i * 0.04} />)}
          </div>
        </div>
      </section>

      {/* ── SOCIAL FEED ── */}
      <section id="social" className="relative py-24">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-[#00d4ff]/5 blur-[100px]" />
        </div>
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <SectionHeading label="Social Casino" title="Connect Worldwide" sub="The built-in social network for poker players. Post your hands, follow the action, build your legend." color="#00d4ff" />
          <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {FEED_POSTS.map((post, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }} transition={{ duration: 0.4, delay: i * 0.08 }}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:bg-white/[0.05] transition-colors">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#bf5fff] to-[#00d4ff] flex items-center justify-center text-xs font-black text-black shrink-0">
                    {post.user[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-white text-sm">{post.user}</p>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full font-display tracking-wider"
                        style={{ backgroundColor: `${post.tagColor}20`, color: post.tagColor, border: `1px solid ${post.tagColor}40` }}>
                        {post.tag}
                      </span>
                    </div>
                    <p className="text-gray-600 text-xs">{post.time}</p>
                  </div>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-3">{post.content}</p>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#ffd700]/10 text-[#ffd700] border border-[#ffd700]/25 font-bold">
                    🪙 {post.pot}
                  </span>
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/25 font-bold">
                    ♠ {post.hand}
                  </span>
                </div>
                <div className="flex items-center gap-5 text-xs text-gray-600">
                  <span>♥ {post.likes.toLocaleString()}</span>
                  <span>💬 {post.comments}</span>
                  <span>↗ Share</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DAILY MISSIONS ── */}
      <section className="relative py-24">
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <SectionHeading label="Daily Challenges" title="Daily Missions" sub="5 fresh missions every day. Complete them all to earn a Legendary Fortune Cookie." color="#bf5fff" />
          <div className="max-w-xl mx-auto rounded-2xl border border-[#bf5fff]/25 bg-white/[0.025] overflow-hidden">
            {/* header */}
            <div className="p-5 border-b border-white/8 flex items-center justify-between">
              <div>
                <p className="font-display font-black text-white text-sm uppercase tracking-widest">Daily Missions</p>
                <p className="text-gray-600 text-xs mt-0.5">Resets at midnight</p>
              </div>
              <div className="flex items-center gap-2 text-xs bg-[#ffd700]/10 border border-[#ffd700]/30 rounded-xl px-3 py-1.5 text-[#ffd700] font-display font-black">
                <Trophy className="w-3.5 h-3.5" /> Grand Reward
              </div>
            </div>
            {/* missions */}
            {MISSIONS_PREVIEW.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="p-4 border-b border-white/5 last:border-b-0">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-white font-bold text-sm">{m.title}</p>
                      <span className="text-[9px] font-display font-black px-2 py-0.5 rounded-full tracking-widest"
                        style={{ color: m.color, backgroundColor: `${m.color}15`, border: `1px solid ${m.color}30` }}>
                        {m.rarity}
                      </span>
                    </div>
                    <p className="text-gray-600 text-xs">{m.desc}</p>
                  </div>
                  <span className="text-xs text-[#00ff88] font-bold shrink-0">{m.reward}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                  <motion.div initial={{ width: 0 }} whileInView={{ width: `${(m.progress / m.target) * 100}%` }}
                    viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
                    className="h-full rounded-full" style={{ backgroundColor: m.color }} />
                </div>
                <p className="text-right text-[10px] text-gray-700 mt-1">{m.progress}/{m.target}</p>
              </motion.div>
            ))}
            {/* grand reward */}
            <div className="p-5 bg-gradient-to-r from-[#ffd700]/8 to-transparent border-t border-[#ffd700]/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#ffd700]/15 border border-[#ffd700]/35 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-[#ffd700]" />
                </div>
                <div>
                  <p className="font-display font-black text-[#ffd700] text-sm uppercase tracking-wide">Legendary Fortune Cookie</p>
                  <p className="text-gray-600 text-xs">Complete all 5 missions to unlock</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FORTUNE COOKIES ── */}
      <section className="relative py-24">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-[#ffd700]/4 blur-[120px]" />
        </div>
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <SectionHeading label="Collectibles" title="Fortune Cookies" sub="Five rarity tiers — each cookie holds chip prizes, cosmetics, and surprises. Collect them all." color="#ffd700" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
            {COOKIE_TIERS.map((tier, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 24, scale: 0.9 }} whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.07 }}
                className="rounded-2xl border p-5 text-center flex flex-col items-center gap-3 hover:scale-105 transition-transform duration-300 cursor-pointer"
                style={{ borderColor: `${tier.color}35`, background: `linear-gradient(135deg, ${tier.color}08 0%, transparent 100%)` }}>
                <div className="text-4xl">🥠</div>
                <p className="font-display font-black text-sm uppercase tracking-wide" style={{ color: tier.color }}>{tier.label}</p>
                <p className="text-[11px] font-bold" style={{ color: tier.color }}>{tier.range}</p>
                <p className="text-gray-600 text-[11px] leading-snug">{tier.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TOURNAMENTS ── */}
      <section className="relative py-24">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 right-0 w-[400px] h-[400px] rounded-full bg-[#00ff88]/4 blur-[100px]" />
        </div>
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <SectionHeading label="Compete" title="Tournaments" sub="Daily and weekly tournaments with massive virtual chip prize pools. Enter the arena." color="#00ff88" />
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { title: 'Daily Knockout', type: 'Daily', prize: '500K chips', buy: '5,000', players: 64, color: '#00d4ff' },
              { title: 'Weekend Championship', type: 'Weekly', prize: '2M chips', buy: '25,000', players: 128, color: '#bf5fff' },
              { title: 'High Roller Invitational', type: 'Special', prize: '5M chips', buy: '100,000', players: 32, color: '#ffd700' },
            ].map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.1 }}
                className="rounded-2xl border p-6 text-center hover:scale-[1.02] transition-transform duration-300 cursor-pointer"
                style={{ borderColor: `${t.color}30`, background: `linear-gradient(135deg, ${t.color}08 0%, transparent 100%)` }}>
                <span className="inline-block px-3 py-1 rounded-full text-[10px] font-display font-black tracking-widest uppercase mb-4"
                  style={{ color: t.color, backgroundColor: `${t.color}15`, border: `1px solid ${t.color}30` }}>
                  {t.type}
                </span>
                <h3 className="font-display font-black text-white text-lg uppercase tracking-tight mb-4">{t.title}</h3>
                <div className="space-y-2 text-sm mb-5">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Prize Pool</span>
                    <span className="font-bold" style={{ color: t.color }}>{t.prize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Buy-In</span>
                    <span className="text-white font-bold">{t.buy} chips</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Players</span>
                    <span className="text-white font-bold">{t.players}</span>
                  </div>
                </div>
                <button className="w-full py-2.5 rounded-xl font-display font-black text-xs tracking-widest uppercase transition-all hover:opacity-90"
                  style={{ backgroundColor: `${t.color}20`, color: t.color, border: `1px solid ${t.color}40` }}>
                  Register
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST ── */}
      <section className="relative py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-10">
            <p className="text-center text-xs font-display font-black tracking-[0.3em] uppercase text-white/40 mb-8">Why Players Trust Chip Society</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { n: '11+', l: 'Casino Games' },
                { n: '80', l: 'Character Avatars' },
                { n: '5', l: 'Poker Variants' },
                { n: '∞', l: 'Daily Missions' },
              ].map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="text-center">
                  <p className="font-display font-black text-4xl md:text-5xl text-white mb-2"
                    style={{ background: 'linear-gradient(135deg, #00d4ff, #bf5fff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {s.n}
                  </p>
                  <p className="text-gray-600 text-xs font-display uppercase tracking-wider">{s.l}</p>
                </motion.div>
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
              {['Virtual Chips Only', 'No Real Money', 'Fair Gameplay', 'Frequent Updates', 'Secure Accounts', 'Multiplayer Ready', 'Daily Tournaments', 'Premium UI'].map((t, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                  <Shield className="w-3 h-3 text-[#00d4ff] shrink-0" /> {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── COMMUNITY GUIDELINES ── */}
      <section className="relative py-24">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-[#ff0090]/4 blur-[100px]" />
        </div>
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <SectionHeading label="Community" title="Community Guidelines" sub="Chip Society is a place for competitive, high-stakes fun. We expect all players to treat the tables with respect." color="#ff0090" />
          <div className="grid md:grid-cols-2 gap-5 mb-6">
            {[
              {
                icon: '🚫', color: '#ff0090', title: 'Zero Tolerance for Hate',
                body: 'Hate speech, discrimination, racism, sexism, and targeted harassment have absolutely no place in Chip Society. Any player found using chat or usernames to spread hate will face immediate and permanent bans without warning.',
              },
              {
                icon: '🎰', color: '#ffd700', title: 'No Cheating or Collusion',
                body: 'Chip dumping, table collusion, botting, or exploiting bugs ruins the game for everyone. Our systems actively monitor for suspicious betting patterns. Cheaters will have their accounts wiped and permanently banned.',
              },
              {
                icon: '🤝', color: '#00d4ff', title: 'Sportsmanship',
                body: 'Poker is a game of skill and variance. Keep the table talk civil. Trash talk is part of the game, but excessive hostility, spamming the chat, or berating other players crosses the line into harassment.',
              },
              {
                icon: '🛡️', color: '#bf5fff', title: 'Reporting Abuse',
                body: 'If you encounter players violating these guidelines, use the in-game Report button on their player profile. We review all reports and take necessary action to keep the tables clean.',
              },
            ].map((rule, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }} transition={{ duration: 0.4, delay: i * 0.08 }}
                className="rounded-2xl border bg-white/[0.025] p-6"
                style={{ borderColor: `${rule.color}25` }}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ backgroundColor: `${rule.color}15`, border: `1px solid ${rule.color}30` }}>
                    {rule.icon}
                  </div>
                  <div>
                    <p className="font-display font-black text-white text-sm uppercase tracking-wide mb-2">{rule.title}</p>
                    <p className="text-gray-500 text-sm leading-relaxed">{rule.body}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="rounded-xl border border-red-500/20 bg-red-500/5 p-5 text-center">
            <p className="font-display font-black text-red-400 text-sm uppercase tracking-wide mb-1">Enforcement</p>
            <p className="text-gray-500 text-sm leading-relaxed max-w-2xl mx-auto">
              Violations may result in chat mutes, temporary suspensions, or permanent account bans at the sole discretion of the Chip Society moderation team. Virtual chips are forfeit upon a permanent ban.
            </p>
            <a href="/support/community-guidelines" className="inline-block mt-3 text-xs font-display font-black tracking-widest uppercase text-[#ff0090] hover:underline">
              Read Full Guidelines →
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="relative py-24">
        <div className="max-w-3xl mx-auto px-6">
          <SectionHeading label="Questions" title="FAQ" color="#bf5fff" />
          <div className="space-y-3">
            {FAQ_DATA.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }} transition={{ duration: 0.35, delay: i * 0.04 }}>
                <Dropdown trigger={<span className="text-white font-semibold text-sm">{item.q}</span>}>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.a}</p>
                </Dropdown>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DOWNLOAD CTA ── */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-[#bf5fff]/10 blur-[100px]" />
        </div>
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-display font-black text-5xl md:text-6xl text-white uppercase tracking-tight mb-6 leading-none">
              Ready to<br />
              <span style={{ background: 'linear-gradient(135deg, #bf5fff, #ff0090)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Play?</span>
            </h2>
            <p className="text-gray-400 text-lg mb-10">Download free on iOS. Start with 50,000 chips. No real money, ever.</p>
            <a href="#"
              className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl font-display font-black text-base tracking-widest uppercase transition-all duration-300 hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #bf5fff 0%, #8b3adb 100%)', boxShadow: '0 0 50px rgba(191,95,255,0.4)' }}>
              <FaApple className="w-6 h-6" /> Download on the App Store
            </a>
            <p className="text-gray-700 text-xs mt-5 font-display tracking-widest uppercase">Free · iOS 16+ · Virtual chips only</p>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 py-14 border-t border-white/8 bg-black/40">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
            <div className="flex items-center gap-3">
              <img src={`${BASE}icon.png`} alt="Chip Society" className="w-8 h-8 rounded-lg opacity-70" />
              <span className="font-display font-black text-white/60 tracking-widest text-sm uppercase">Chip Society</span>
            </div>
            <div className="flex gap-5 text-gray-600">
              <a href="#" className="hover:text-[#ff0090] transition-colors" aria-label="Twitter"><FaTwitter className="w-5 h-5" /></a>
              <a href="#" className="hover:text-[#bf5fff] transition-colors" aria-label="Discord"><FaDiscord className="w-5 h-5" /></a>
              <a href="#" className="hover:text-[#00d4ff] transition-colors" aria-label="Instagram"><FaInstagram className="w-5 h-5" /></a>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-700 uppercase tracking-wider">
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              <a href="/support/terms" className="hover:text-gray-400 transition-colors">Terms of Service</a>
              <a href="/support/privacy" className="hover:text-gray-400 transition-colors">Privacy Policy</a>
              <a href="/support/" className="hover:text-[#00d4ff] transition-colors">Support</a>
              <a href="/support/community-guidelines" className="hover:text-gray-400 transition-colors">Community Guidelines</a>
              <a href="mailto:realbobbyf@chipsocietyapp.com" className="hover:text-[#00d4ff] transition-colors">Contact</a>
            </div>
            <div>&copy; 2026 Chip Society LLC. All rights reserved.</div>
          </div>
          <p className="text-center text-xs text-gray-800 mt-6 uppercase tracking-widest">
            Virtual chips only · No real-money gambling · 18+ or 13+ with parental consent
          </p>
        </div>
      </footer>
    </div>
  );
}
