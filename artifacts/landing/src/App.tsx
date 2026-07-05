import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaApple, FaTwitter, FaDiscord, FaInstagram } from 'react-icons/fa';
import {
  ChevronDown,
  Gamepad2,
  Coins,
  Trophy,
  User,
  Wrench,
  Shield,
  Users,
  Zap,
  Star,
  Crown,
} from 'lucide-react';

/* ─────────────────────────────────────────────
   GAME VARIANTS  (sourced from gameVariants.ts)
───────────────────────────────────────────── */
const GAMES = [
  {
    id: 'texas',
    label: "No Limit Hold'em",
    badge: 'Classic',
    deck: '52-card deck · 2 through Ace',
    tagline: "The gold standard of poker. Two hole cards, five community cards — your read of the table is everything.",
    color: '#00d4ff',
    border: 'border-[#00d4ff]/40',
    glow: 'shadow-[0_0_30px_rgba(0,212,255,0.25)]',
    badgeBg: 'bg-[#00d4ff]/10 text-[#00d4ff] border-[#00d4ff]/30',
    hand: ['2♠','K♥','A♦','J♣','Q♠'],
    rules: [
      { heading: 'The Deck', body: 'Full 52-card deck — 2 through Ace in all four suits.' },
      { heading: 'Hole Cards', body: 'Each player is dealt 2 private hole cards face-down that only they can see.' },
      { heading: 'Community Cards', body: 'Five community cards are dealt face-up in stages — Flop (3), Turn (1), River (1). All players share them.' },
      { heading: 'Making Your Hand', body: 'Combine any of your 2 hole cards with any of the 5 community cards to make the best possible 5-card hand. You can even play the board.' },
      { heading: 'Hand Rankings', body: 'Royal Flush › Straight Flush › Four of a Kind › Full House › Flush › Straight › Three of a Kind › Two Pair › Pair › High Card.' },
      { heading: 'Betting Structure', body: 'No Limit — you can bet any amount up to your entire stack at any time. Blinds rotate clockwise each hand.' },
      { heading: 'Winning', body: 'Win by having the best hand at showdown, or by making every other player fold before showdown.' },
    ],
  },
  {
    id: 'shortdeck',
    label: 'Short Deck Hold\'em',
    badge: 'Six-Plus',
    deck: '36-card deck · 6 through Ace only',
    tagline: "Strip out the low cards and watch hand frequencies flip. Flush beats Full House — classic strategy doesn't apply.",
    color: '#ff0090',
    border: 'border-[#ff0090]/40',
    glow: 'shadow-[0_0_30px_rgba(255,0,144,0.25)]',
    badgeBg: 'bg-[#ff0090]/10 text-[#ff0090] border-[#ff0090]/30',
    hand: ['6♦','8♣','9♥','J♠','A♦'],
    rules: [
      { heading: 'The Deck', body: 'Only 36 cards — all 2s, 3s, 4s, and 5s are removed. The deck runs 6 through Ace in all suits.' },
      { heading: 'Hole Cards', body: 'Each player receives 2 private hole cards, same as standard Hold\'em.' },
      { heading: 'Community Cards', body: 'Five community cards dealt in the same Flop/Turn/River structure.' },
      { heading: 'The Big Rule Change — Flush Beats Full House', body: 'Because flushes are rarer in a shorter deck, they rank above Full House. This completely changes post-flop strategy and draws.' },
      { heading: 'No Wheel Straight', body: 'A-2-3-4-5 is impossible since 2–5 are removed. The lowest possible straight is 6-7-8-9-10.' },
      { heading: 'Betting Structure', body: 'No Limit — any bet up to your full stack. Antes are used instead of blinds in many formats.' },
      { heading: 'Why It\'s Different', body: 'With fewer low cards, pairs are harder to conceal, draws come in more frequently, and aggression is rewarded even more than in standard Hold\'em.' },
    ],
  },
  {
    id: 'joker',
    label: "Joker Hold'em",
    badge: 'Wild Card',
    deck: '54-card deck · Two Wild Jokers added',
    tagline: "Two wild Jokers shuffle the deck. Five of a Kind is now the pinnacle — nothing is safe until the river.",
    color: '#ffd700',
    border: 'border-[#ffd700]/40',
    glow: 'shadow-[0_0_30px_rgba(255,215,0,0.2)]',
    badgeBg: 'bg-[#ffd700]/10 text-[#ffd700] border-[#ffd700]/30',
    hand: ['🃏','K♠','K♥','A♣','🃏'],
    rules: [
      { heading: 'The Deck', body: 'Standard 52-card deck plus two wild Jokers — 54 cards total.' },
      { heading: 'Jokers Are Always Wild', body: 'A Joker automatically takes the best possible rank and suit to complete or improve your hand. No choosing required.' },
      { heading: 'Five of a Kind — New Top Hand', body: 'Five cards of the same rank (possible with a Joker) is the highest hand in the game, beating even a Royal Flush.' },
      { heading: 'New Hand Rankings', body: 'Five of a Kind › Royal Flush › Straight Flush › Four of a Kind › Full House › Flush › Straight › Three of a Kind › Two Pair › Pair › High Card.' },
      { heading: 'Hole Cards', body: 'Each player gets 2 hole cards — community or hole cards may include Jokers.' },
      { heading: 'Community Cards', body: 'Five community cards dealt in the standard Flop/Turn/River structure, any of which may be a wild Joker.' },
      { heading: 'Betting Structure', body: 'Standard No Limit — but with Jokers on the board, pot sizes escalate fast. Expect big swings.' },
    ],
  },
  {
    id: 'omaha',
    label: "Omaha Hold'em",
    badge: 'Action Game',
    deck: '52-card deck · 4 hole cards',
    tagline: "Four hole cards means more possibilities — and one strict rule: you must always use exactly two of them.",
    color: '#00ff88',
    border: 'border-[#00ff88]/40',
    glow: 'shadow-[0_0_30px_rgba(0,255,136,0.2)]',
    badgeBg: 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/30',
    hand: ['A♠','K♥','Q♦','J♣'],
    rules: [
      { heading: 'The Deck', body: 'Full 52-card deck — same as standard Hold\'em.' },
      { heading: 'Four Hole Cards', body: 'Every player receives 4 private hole cards instead of 2. This dramatically increases the number of potential hand combinations.' },
      { heading: 'The Key Rule — Exactly 2 + 3', body: 'You MUST use exactly 2 of your hole cards AND exactly 3 of the 5 community cards. No exceptions — you cannot use 0, 1, 3, or 4 hole cards.' },
      { heading: 'Community Cards', body: 'Five community cards dealt in the standard Flop/Turn/River structure, shared by all players.' },
      { heading: 'Hand Rankings', body: 'Standard rankings — Royal Flush down to High Card. Full House beats Flush.' },
      { heading: 'Why It\'s Bigger', body: 'With 4 hole cards you have C(4,2) × C(5,3) = 60 possible hand combinations per player, versus 21 in Hold\'em. The average winning hand is significantly stronger — two pair rarely wins.' },
      { heading: 'Betting Structure', body: 'No Limit. Because the average hand strength is higher, drawing to the nuts (best possible hand) is far more important than in standard Hold\'em.' },
    ],
  },
];

/* ─────────────────────────────────────────────
   FAQ DATA
───────────────────────────────────────────── */
const FAQ_CATEGORIES = [
  {
    id: 'account',
    title: 'Account',
    icon: User,
    items: [
      { q: 'How do I create an account?', a: 'Choose a unique username and set a secure PIN on the login screen. No email address is required to start playing.' },
      { q: 'I forgot my PIN — how do I recover my account?', a: "On the login screen select 'Forgot PIN'. Enter your username and follow the recovery flow to verify your identity and reset your PIN." },
      { q: 'Can I change my username?', a: "Yes — navigate to the Profile tab, tap the settings icon, and select 'Change Username'. Your new username must be unique." },
      { q: 'How do I delete my account?', a: 'Contact us at support@chipsociety.app with your username and we will permanently delete your account and all associated data.' },
    ],
  },
  {
    id: 'gameplay',
    title: 'Gameplay',
    icon: Gamepad2,
    items: [
      { q: 'What AI difficulty levels are available?', a: '5 levels: Beginner, Novice, Regular, Tough, and Elite. Higher difficulties use more advanced betting strategies and hand reading.' },
      { q: 'How does the multiplayer work?', a: 'Join a live table from the Play tab to be matched with real players from around the world. Tables support 2–5 players with rotating dealer blinds.' },
      { q: 'What happens when I run out of chips?', a: "You receive a daily free chip bonus to replenish your stack. You can also purchase chip bundles in the Chip Store." },
      { q: 'How does the ranking system work?', a: 'Earn XP by playing hands and winning pots. Climb 7 prestige ranks from Bronze to Legend.' },
    ],
  },
  {
    id: 'chips',
    title: 'Chips & Purchases',
    icon: Coins,
    items: [
      { q: 'Are chips real money?', a: 'No. All chips are strictly virtual currency. Chip Society does not offer real-money gambling, and chips cannot be cashed out.' },
      { q: 'How do I get more chips?', a: 'Daily login bonus, winning at the tables, and purchasing bundles in the Chip Store.' },
      { q: 'Can I transfer chips to other players?', a: 'No — chip transfers between accounts are not permitted to maintain a fair economy.' },
      { q: 'Do purchased chips expire?', a: 'Never. Purchased and earned chips remain in your account indefinitely.' },
    ],
  },
  {
    id: 'tournaments',
    title: 'Tournaments',
    icon: Trophy,
    items: [
      { q: 'How do I enter a tournament?', a: "Navigate to the Tournaments tab, find an upcoming event, and tap 'Register' to pay the virtual chip buy-in and secure your seat." },
      { q: 'What are the prizes?', a: 'Virtual chip payouts and exclusive cosmetic rewards. No real money prizes.' },
      { q: 'What is the buy-in?', a: 'Virtual chips — the amount varies by tournament stakes and prestige.' },
    ],
  },
  {
    id: 'technical',
    title: 'Technical Issues',
    icon: Wrench,
    items: [
      { q: 'The app crashed — what do I do?', a: 'Update to the latest version first. If it persists, try reinstalling. Still crashing? Email support@chipsociety.app with your device model and OS version.' },
      { q: "My chips didn't update after winning?", a: 'Force close and restart the app — your balance will sync when you reconnect.' },
      { q: "I can't connect to multiplayer?", a: "Check your internet connection. If you're on a restricted network (school/work WiFi), try switching to mobile data." },
    ],
  },
  {
    id: 'community',
    title: 'Community & Safety',
    icon: Shield,
    items: [
      { q: 'How do I report a player?', a: "Tap the player's avatar at the table or on their profile to open their player card, then tap 'Report'." },
      { q: 'What happens to reported players?', a: 'Reports are reviewed within 48 hours. Violations result in warnings, suspensions, or permanent bans depending on severity.' },
      { q: 'How do I block a player?', a: "Block from their profile card. Blocked players cannot message you or join your private tables." },
    ],
  },
];

/* ─────────────────────────────────────────────
   COMPONENTS
───────────────────────────────────────────── */
function Dropdown({ trigger, children }: { trigger: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border rounded-lg overflow-hidden transition-colors duration-200 ${open ? 'border-white/25 bg-white/[0.04]' : 'border-white/10'}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left hover:bg-white/5 transition-colors"
      >
        {trigger}
        <ChevronDown className={`w-5 h-5 shrink-0 transition-transform duration-300 text-white/40 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function GameCard({ game }: { game: typeof GAMES[0] }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5 }}
      className={`rounded-2xl border bg-white/[0.03] overflow-hidden ${game.border} ${open ? game.glow : ''} transition-all duration-300`}
    >
      {/* Card header */}
      <div className="p-6 pb-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <span className={`inline-block px-3 py-1 rounded-full border text-xs font-display font-bold tracking-widest uppercase mb-3 ${game.badgeBg}`}>
              {game.badge}
            </span>
            <h3 className="font-display text-2xl font-black text-white uppercase tracking-tight">{game.label}</h3>
          </div>
          <div className="flex gap-1 mt-1">
            {game.hand.slice(0, 4).map((card, i) => (
              <div
                key={i}
                className="w-7 h-10 rounded text-[10px] font-bold flex items-center justify-center bg-white text-gray-800 border border-gray-200 shrink-0"
              >
                {card}
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-white/50 font-display tracking-widest uppercase mb-3">{game.deck}</p>
        <p className="text-gray-400 text-sm leading-relaxed">{game.tagline}</p>
      </div>

      {/* Rules toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-3 border-t border-white/10 hover:bg-white/5 transition-colors text-sm font-display font-bold tracking-wider uppercase"
        style={{ color: game.color }}
      >
        {open ? 'Hide Rules' : 'View Full Rules'}
        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="rules"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-4 space-y-4 border-t border-white/10">
              {game.rules.map((rule, i) => (
                <div key={i} className="flex gap-4">
                  <div
                    className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-xs font-display font-black mt-0.5"
                    style={{ backgroundColor: `${game.color}22`, color: game.color, border: `1px solid ${game.color}40` }}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm mb-0.5">{rule.heading}</p>
                    <p className="text-gray-400 text-sm leading-relaxed">{rule.body}</p>
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

/* ─────────────────────────────────────────────
   MAIN
───────────────────────────────────────────── */
export default function App() {
  return (
    <div className="min-h-screen bg-[#050010] text-white selection:bg-[#ff0090] selection:text-white">
      {/* Ambient glows */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#bf5fff] opacity-10 blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#00d4ff] opacity-10 blur-[120px] pointer-events-none z-0" />
      <div className="fixed top-[40%] right-[20%] w-[30%] h-[30%] rounded-full bg-[#ff0090] opacity-5 blur-[100px] pointer-events-none z-0" />

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-[#050010]/80 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-3">
          <img src={`${import.meta.env.BASE_URL}icon.png`} alt="Chip Society" className="w-9 h-9 rounded-xl" />
          <span className="font-display font-bold text-lg tracking-wider text-white">CHIP SOCIETY</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
          <a href="#games" className="hover:text-white transition-colors">Games</a>
          <a href="#play-modes" className="hover:text-white transition-colors">How to Play</a>
          <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
        </div>
        <a
          href="#"
          className="inline-flex items-center gap-2 px-5 py-2 bg-[#050010] border border-[#00d4ff] text-white text-sm font-display font-bold rounded-lg hover:bg-[#00d4ff] hover:text-[#050010] transition-all tracking-wider"
        >
          <FaApple className="text-base" />
          App Store
        </a>
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-36 pb-20 flex flex-col items-center text-center z-10 px-6">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="flex flex-col items-center max-w-3xl mx-auto"
        >
          <div className="mb-8 p-4 bg-[#050010] border border-[#ff0090]/40 rounded-2xl shadow-[0_0_50px_rgba(255,0,144,0.2)]">
            <img
              src={`${import.meta.env.BASE_URL}icon.png`}
              alt="Chip Society App Icon"
              className="w-28 h-28 rounded-xl object-contain"
            />
          </div>

          <h1 className="font-display text-6xl md:text-8xl font-black uppercase tracking-tighter mb-4 text-white">
            CHIP SOCIETY
          </h1>
          <p className="text-[#00d4ff] font-display font-bold text-base md:text-lg tracking-[0.25em] uppercase mb-6">
            Texas Hold'em & Poker Variants for iOS
          </p>
          <p className="text-gray-400 text-lg max-w-2xl leading-relaxed mb-10">
            A premium mobile poker experience featuring four distinct game variants, live
            multiplayer against real players worldwide, solo AI practice, and competitive
            tournaments — all with virtual chips. No real-money gambling, ever.
          </p>

          <a
            href="#"
            className="inline-flex items-center gap-3 px-10 py-4 bg-[#050010] border-2 border-[#00d4ff] text-white rounded-xl hover:bg-[#00d4ff] hover:text-[#050010] transition-all font-display font-bold tracking-wider text-lg shadow-[0_0_40px_rgba(0,212,255,0.2)]"
          >
            <FaApple className="text-2xl" />
            Download on the App Store
          </a>
          <p className="mt-5 text-xs text-gray-600 uppercase tracking-widest">
            Free to play · Virtual chips only · No real-money gambling
          </p>
        </motion.div>
      </section>

      {/* ── PLAY MODES ── */}
      <section id="play-modes" className="relative z-10 py-20 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <h2 className="font-display text-3xl md:text-5xl font-black uppercase tracking-tighter text-white mb-4">
              How You Play
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Two ways to sit down — solo practice on your schedule, or live tables with real players from around the world.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* AI Practice */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl border border-[#bf5fff]/30 bg-white/[0.03] p-8 shadow-[0_0_40px_rgba(191,95,255,0.1)]"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#bf5fff]/15 border border-[#bf5fff]/30 flex items-center justify-center">
                  <Gamepad2 className="w-6 h-6 text-[#bf5fff]" />
                </div>
                <div>
                  <p className="text-xs text-[#bf5fff] font-display font-bold tracking-widest uppercase">Solo Mode</p>
                  <h3 className="font-display font-black text-xl text-white uppercase tracking-tight">AI Practice</h3>
                </div>
              </div>
              <p className="text-gray-400 leading-relaxed mb-6">
                Sit down at a table with up to 4 AI-controlled opponents and play full Texas
                Hold'em in any of our four game variants. No internet required — ideal for
                learning, sharpening strategy, or just playing on the go.
              </p>
              <ul className="space-y-3">
                {[
                  '5 difficulty levels — Beginner to Elite',
                  'All 4 game variants available offline',
                  'Full hand history and session stats',
                  'No time pressure — play at your own pace',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#bf5fff] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Multiplayer */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl border border-[#00d4ff]/30 bg-white/[0.03] p-8 shadow-[0_0_40px_rgba(0,212,255,0.1)]"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#00d4ff]/15 border border-[#00d4ff]/30 flex items-center justify-center">
                  <Users className="w-6 h-6 text-[#00d4ff]" />
                </div>
                <div>
                  <p className="text-xs text-[#00d4ff] font-display font-bold tracking-widest uppercase">Live Mode</p>
                  <h3 className="font-display font-black text-xl text-white uppercase tracking-tight">Real Players</h3>
                </div>
              </div>
              <p className="text-gray-400 leading-relaxed mb-6">
                Join live tables and compete against real players worldwide. Tables seat 2 to
                5 players with rotating dealer blinds. Quick Play drops you into an open seat
                immediately — no lobby browsing required.
              </p>
              <ul className="space-y-3">
                {[
                  'Live matchmaking — join in seconds',
                  'Tables of 2–5 real players worldwide',
                  'Chat and social feed integration',
                  'XP, rank, and chip progression carry over',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Tournaments strip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-6 rounded-2xl border border-[#ff0090]/30 bg-white/[0.03] p-8 shadow-[0_0_40px_rgba(255,0,144,0.08)]"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="flex items-center gap-4 shrink-0">
                <div className="w-12 h-12 rounded-xl bg-[#ff0090]/15 border border-[#ff0090]/30 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-[#ff0090]" />
                </div>
                <div>
                  <p className="text-xs text-[#ff0090] font-display font-bold tracking-widest uppercase">Competitive</p>
                  <h3 className="font-display font-black text-xl text-white uppercase tracking-tight">Tournaments</h3>
                </div>
              </div>
              <div className="w-px h-12 bg-white/10 hidden md:block" />
              <p className="text-gray-400 leading-relaxed flex-1">
                Compete in scheduled multi-table tournaments with virtual chip prize pools.
                Earn XP, prestige ranks, and exclusive cosmetic rewards. Buy in with virtual
                chips — no real money involved. Results post to the social feed automatically.
              </p>
              <div className="flex gap-4 shrink-0">
                {['Bronze', 'Silver', 'Gold', 'Legend'].map((tier, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <Crown className="w-5 h-5 text-[#ff0090]/50" style={{ opacity: 0.3 + i * 0.2 }} />
                    <span className="text-[10px] text-gray-600 uppercase tracking-wider font-display">{tier}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── GAMES ── */}
      <section id="games" className="relative z-10 py-20 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <h2 className="font-display text-3xl md:text-5xl font-black uppercase tracking-tighter text-white mb-4">
              Game Variants
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Four distinct poker formats — same table, very different games. Expand any card to read the full rules.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {GAMES.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>

          {/* Hand rankings quick reference */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-8"
          >
            <Dropdown
              trigger={
                <div className="flex items-center gap-3">
                  <Star className="w-5 h-5 text-[#ffd700]" />
                  <span className="text-white font-display font-bold uppercase tracking-wider text-sm">Standard Hand Rankings (Best to Worst)</span>
                </div>
              }
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  { rank: 1, name: 'Royal Flush', desc: 'A K Q J 10 — same suit', color: '#ffd700' },
                  { rank: 2, name: 'Straight Flush', desc: '5 consecutive cards — same suit', color: '#ff0090' },
                  { rank: 3, name: 'Four of a Kind', desc: '4 cards of the same rank', color: '#bf5fff' },
                  { rank: 4, name: 'Full House', desc: 'Three of a Kind + a Pair', color: '#00d4ff' },
                  { rank: 5, name: 'Flush', desc: '5 cards of the same suit (not in sequence)', color: '#00ff88' },
                  { rank: 6, name: 'Straight', desc: '5 consecutive cards — any suits', color: '#00d4ff' },
                  { rank: 7, name: 'Three of a Kind', desc: '3 cards of the same rank', color: '#bf5fff' },
                  { rank: 8, name: 'Two Pair', desc: 'Two different pairs', color: '#ff0090' },
                  { rank: 9, name: 'Pair', desc: '2 cards of the same rank', color: '#ffffff' },
                  { rank: 10, name: 'High Card', desc: 'No combination — highest card plays', color: '#666' },
                ].map((hand) => (
                  <div key={hand.rank} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-white/[0.03] border border-white/5">
                    <span className="font-display font-black text-xs w-5 text-right shrink-0" style={{ color: hand.color }}>
                      #{hand.rank}
                    </span>
                    <div>
                      <p className="text-white text-sm font-semibold leading-none mb-0.5">{hand.name}</p>
                      <p className="text-gray-500 text-xs">{hand.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-4 italic">
                * Short Deck exception: Flush outranks Full House. · Joker exception: Five of a Kind is the highest hand.
              </p>
            </Dropdown>
          </motion.div>
        </div>
      </section>

      {/* ── HOW TO PLAY ── */}
      <section className="relative z-10 py-20 border-t border-white/5 bg-white/[0.015]">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <h2 className="font-display text-3xl md:text-5xl font-black uppercase tracking-tighter text-white mb-4">
              A Hand of Poker — Step by Step
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              New to poker? Here's how a hand plays out from deal to showdown.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                step: '01',
                title: 'The Deal',
                color: '#00d4ff',
                body: 'The dealer posts small and big blinds. Every player receives their hole cards face-down. In Hold\'em you get 2; in Omaha you get 4.',
              },
              {
                step: '02',
                title: 'Pre-Flop Betting',
                color: '#ff0090',
                body: 'Starting left of the big blind, each player calls, raises, or folds. Betting continues until all remaining players have acted and the bets are equal.',
              },
              {
                step: '03',
                title: 'Flop / Turn / River',
                color: '#bf5fff',
                body: 'The dealer reveals community cards — 3 on the Flop, 1 on the Turn, 1 on the River — with a betting round after each. Use them to build your best hand.',
              },
              {
                step: '04',
                title: 'Showdown',
                color: '#ffd700',
                body: 'If two or more players remain after the final bet, everyone shows their cards. The player with the strongest 5-card hand wins the pot.',
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="relative rounded-xl border border-white/10 bg-white/[0.02] p-6"
              >
                <div
                  className="font-display font-black text-5xl mb-4 leading-none"
                  style={{ color: `${step.color}30` }}
                >
                  {step.step}
                </div>
                <h3 className="font-display font-bold text-white uppercase tracking-wide text-sm mb-3" style={{ color: step.color }}>
                  {step.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">{step.body}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 grid md:grid-cols-3 gap-5">
            {[
              {
                icon: Zap,
                color: '#ff0090',
                title: 'Betting Actions',
                body: 'Check (pass if no bet), Call (match the current bet), Raise (increase the bet), or Fold (discard your cards and exit the hand).',
              },
              {
                icon: Coins,
                color: '#00ff88',
                title: 'The Pot',
                body: 'All chips bet during a hand go into the pot. The winner of the hand collects the entire pot. In all-in situations, side pots are created for any excess bets.',
              },
              {
                icon: Users,
                color: '#bf5fff',
                title: 'Position',
                body: 'The dealer button moves clockwise each hand. Acting last (being "in position") is a significant advantage — you see all opponents act before you.',
              },
            ].map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.08 }}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-6"
              >
                <card.icon className="w-7 h-7 mb-4" style={{ color: card.color }} />
                <h3 className="font-display font-bold text-white uppercase tracking-wide text-sm mb-2">{card.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{card.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="relative z-10 py-20 border-t border-white/5">
        <div className="max-w-3xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <h2 className="font-display text-3xl md:text-5xl font-black uppercase tracking-tighter text-white mb-4">
              FAQ
            </h2>
            <p className="text-gray-500 text-sm">
              Still have questions?{' '}
              <a href="mailto:support@chipsociety.app" className="text-[#00d4ff] hover:underline">
                support@chipsociety.app
              </a>
            </p>
          </motion.div>

          <div className="space-y-10">
            {FAQ_CATEGORIES.map((cat) => (
              <div key={cat.id}>
                <div className="flex items-center gap-3 mb-4">
                  <cat.icon className="w-5 h-5 text-[#bf5fff]" />
                  <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider">{cat.title}</h3>
                </div>
                <div className="space-y-2">
                  {cat.items.map((item, i) => (
                    <Dropdown
                      key={i}
                      trigger={<span className="text-white font-medium text-sm leading-snug">{item.q}</span>}
                    >
                      <p className="text-gray-400 text-sm leading-relaxed">{item.a}</p>
                    </Dropdown>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 py-12 border-t border-white/10 bg-black/40">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-3">
              <img src={`${import.meta.env.BASE_URL}icon.png`} alt="Chip Society" className="w-8 h-8 rounded-lg opacity-70" />
              <span className="font-display font-bold text-white/70 tracking-wider text-sm">CHIP SOCIETY</span>
            </div>
            <div className="flex gap-5 text-gray-500">
              <a href="#" className="hover:text-[#ff0090] transition-colors"><FaTwitter className="w-5 h-5" /></a>
              <a href="#" className="hover:text-[#bf5fff] transition-colors"><FaDiscord className="w-5 h-5" /></a>
              <a href="#" className="hover:text-[#00d4ff] transition-colors"><FaInstagram className="w-5 h-5" /></a>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-600 uppercase tracking-wider">
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              <a href="#" className="hover:text-gray-400 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-gray-400 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-gray-400 transition-colors">Community Guidelines</a>
              <a href="mailto:support@chipsociety.app" className="hover:text-[#00d4ff] transition-colors">Contact</a>
            </div>
            <div>&copy; 2026 Chip Society. All rights reserved.</div>
          </div>
          <p className="text-center text-xs text-gray-700 mt-6 uppercase tracking-widest">
            Virtual chips only · No real-money gambling · 18+ or 13+ with parental consent
          </p>
        </div>
      </footer>
    </div>
  );
}
