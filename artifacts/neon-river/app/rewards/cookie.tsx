/**
 * Fortune Cookie — 5-tier reward system
 *
 * Architecture: Each tier has a SEPARATE reward pool with hard caps.
 * No cross-tier fallback. No shared reward table. pickReward() reads
 * only from the tier it receives. Hard caps enforce limits even if
 * config is somehow wrong.
 *
 * Tier hierarchy: COMMON → RARE → EPIC → LEGENDARY → MYTHIC (Wheel-only)
 * Drop rates:      75%      15%   7%      2.5%        0.5%
 */
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient as SvgGrad,
  Path,
  Stop,
} from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@/context/UserContext';
import type { CookieTier } from '@/context/UserContext';
import { formatChips } from '@/utils/chipColor';
import { SoundEngine } from '@/lib/soundEngine';

const { width: W } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'idle' | 'shaking' | 'cracked' | 'rising' | 'reveal';
type RewardType = 'chips' | 'tickets' | 'xp';

interface FortuneReward {
  type: RewardType;
  amount: number;
  label: string;
  color: string;
  tier: CookieTier;
}

// ─── Tier Configuration — STRICT separate pools ───────────────────────────────

interface TierCfg {
  color: string;
  label: string;
  dropRate: string;
  chipRange:   [number, number];
  ticketRange: [number, number];
  xpRange:     [number, number];
  // Hard caps (enforced after random draw, BUG PREVENTION)
  maxChips:   number;
  maxTickets: number;
}

const TIER_CFG: Record<CookieTier, TierCfg> = {
  common: {
    color: '#9CA3AF', label: 'COMMON', dropRate: 'Very Common',
    chipRange:   [5_000,       25_000],
    ticketRange: [0,           0],
    xpRange:     [100,         500],
    maxChips: 25_000, maxTickets: 0,
  },
  rare: {
    color: '#60A5FA', label: 'RARE', dropRate: 'Uncommon',
    chipRange:   [25_000,      150_000],
    ticketRange: [0,           1],
    xpRange:     [1_000,       5_000],
    maxChips: 150_000, maxTickets: 1,
  },
  epic: {
    color: '#A855F7', label: 'EPIC', dropRate: 'Rare',
    chipRange:   [150_000,     750_000],
    ticketRange: [1,           5],
    xpRange:     [5_000,       25_000],
    maxChips: 750_000, maxTickets: 5,
  },
  legendary: {
    color: '#F59E0B', label: 'LEGENDARY', dropRate: 'Very Rare',
    chipRange:   [750_000,     2_000_000],
    ticketRange: [5,           25],
    xpRange:     [25_000,      100_000],
    maxChips: 2_000_000, maxTickets: 25,
  },
  mythic: {
    color: '#FF0090', label: 'MYTHIC', dropRate: 'Daily Wheel Only',
    chipRange:   [500_000,     10_000_000],
    ticketRange: [15,          50],
    xpRange:     [100_000,     500_000],
    maxChips: 10_000_000, maxTickets: 50,
  },
};

// Ordered from highest to lowest for "best available" auto-select
const TIER_ORDER: CookieTier[] = ['mythic', 'legendary', 'epic', 'rare', 'common'];

// Level required to unlock each cookie tier (null = Daily Wheel exclusive, not level-gated)
const TIER_UNLOCK_LEVEL: Record<CookieTier, number | null> = {
  common:    0,
  rare:      25,
  epic:      50,
  legendary: 100,
  mythic:    null,
};

const TIER_DESCRIPTIONS: Record<CookieTier, string> = {
  common:    'A simple fortune containing small chip rewards and a little extra experience.',
  rare:      'A rarer fortune offering better chip rewards and occasional premium items.',
  epic:      'Epic fortunes contain premium rewards for experienced players.',
  legendary: "Legendary fortunes are exceptionally rare and contain Chip Society's most valuable standard rewards.",
  mythic:    'The Mythic Fortune Cookie can only be won from the Daily Wheel jackpot.',
};

// Info cards show 4 standard tiers (Mythic is wheel-only, shown separately)
const CHART_TIERS: CookieTier[] = ['common', 'rare', 'epic', 'legendary'];

const UNLOCK_SEEN_KEY = '@cs_cookie_unlock_seen_v1';

// ─── Reward picker — ONLY uses that tier's pool, enforces hard caps ────────────

function pickReward(tier: CookieTier): FortuneReward {
  const cfg = TIER_CFG[tier];
  const color = cfg.color;

  // Weight: 70% chips, 20% tickets, 10% XP
  const roll = Math.random();

  if (roll < 0.70) {
    // ── Chips ──────────────────────────────────────────────────────────────
    const [min, max] = cfg.chipRange;
    const raw    = Math.round(min + Math.random() * (max - min));
    const amount = Math.min(raw, cfg.maxChips); // hard cap
    return { type: 'chips', amount, label: `+${formatChips(amount)} Chips`, color, tier };

  } else if (roll < 0.90 && cfg.maxTickets > 0) {
    // ── Lottery tickets (skip for tiers with no ticket range) ──────────────
    const [min, max] = cfg.ticketRange;
    const raw    = Math.floor(min + Math.random() * (max - min + 1));
    const amount = Math.min(Math.max(raw, 1), cfg.maxTickets); // at least 1 if we're here
    return { type: 'tickets', amount, label: `+${amount} Lottery Ticket${amount !== 1 ? 's' : ''}`, color, tier };

  } else {
    // ── XP ─────────────────────────────────────────────────────────────────
    const [min, max] = cfg.xpRange;
    const amount = Math.round(min + Math.random() * (max - min));
    return { type: 'xp', amount, label: `+${amount.toLocaleString()} XP`, color, tier };
  }
}

// ─── Fortune messages ─────────────────────────────────────────────────────────

const FORTUNE_MESSAGES = [
  'Great wealth approaches.',
  'Luck favors the bold.',
  'A royal hand awaits.',
  'The next hand may change everything.',
  'Prosperity is near.',
  'The cards are aligned.',
  'Fortune follows confidence.',
  'A lucky streak begins today.',
  'The chips are in your favor.',
  'Destiny smiles upon the patient.',
];

const MYTHIC_MESSAGES = [
  'The universe has chosen you.',
  'This moment will be remembered.',
  'Legends are born from moments like this.',
  'Fortune has never been so generous.',
  'The rarest reward. The greatest win.',
];

// ─── Cookie SVG palettes — one per tier ───────────────────────────────────────

const COOKIE_PAL: Record<CookieTier, { body: string; dark: string; light: string; rim: string }> = {
  common:    { body: '#C4813A', dark: '#7A4E1E', light: '#E8A458', rim: '#D4A017' },
  rare:      { body: '#1E40AF', dark: '#1e3a8a', light: '#60A5FA', rim: '#93C5FD' },
  epic:      { body: '#6B21A8', dark: '#3b0764', light: '#A855F7', rim: '#C084FC' },
  legendary: { body: '#D4A017', dark: '#8A6808', light: '#FFE06A', rim: '#FFF08A' },
  mythic:    { body: '#831843', dark: '#3d0720', light: '#FF0090', rim: '#FFD700' },
};

// ─── Particle configs ─────────────────────────────────────────────────────────

const PARTICLE_COLORS: Record<CookieTier, string[]> = {
  common:    ['#D4A017','#E8A458','#FFD700','#C4813A','#F0B020'],
  rare:      ['#60A5FA','#93C5FD','#3B82F6','#BFDBFE','#2563EB'],
  epic:      ['#A855F7','#C084FC','#7C3AED','#DDD6FE','#8B5CF6'],
  legendary: ['#FFD700','#FFF08A','#F59E0B','#FBBF24','#FDE68A'],
  mythic:    ['#FF0090','#FFD700','#FF69B4','#FFA500','#FF1493',
              '#FFE000','#FF00CC','#FFAA00','#FF0066','#FFCC00',
              '#FF0090','#FFD700','#FF69B4','#FFA500','#FF1493',
              '#FFE000','#FF00CC','#FFAA00','#FF0066','#FFCC00'],
};

const N_PARTICLES_NORMAL = 10;
const N_PARTICLES_MYTHIC  = 20;
const PARTICLE_SIZES = [7, 5, 9, 6, 8, 5, 7, 6, 9, 5, 8, 6, 7, 5, 9, 6, 8, 5, 7, 6];

// ─── Cookie SVG ───────────────────────────────────────────────────────────────

function CookieSvg({ tier, viewBoxX = 0, viewBoxW = 120, width = 180, height = 120 }: {
  tier: CookieTier; viewBoxX?: number; viewBoxW?: number; width?: number; height?: number;
}) {
  const c = COOKIE_PAL[tier];
  const gid = `cg_${tier}_${viewBoxX}`;
  return (
    <Svg width={width} height={height} viewBox={`${viewBoxX} 0 ${viewBoxW} 80`}>
      <Defs>
        <SvgGrad id={gid} x1="0.5" y1="0" x2="0.5" y2="1">
          <Stop offset="0%"   stopColor={c.light} />
          <Stop offset="45%"  stopColor={c.body}  />
          <Stop offset="100%" stopColor={c.dark}  />
        </SvgGrad>
      </Defs>
      <Path d="M 10 42 Q 60 4 110 42 Q 88 72 60 74 Q 32 72 10 42 Z" fill={`url(#${gid})`} />
      <Path d="M 10 42 Q 60 4 110 42" stroke={c.rim} strokeWidth="2.5" fill="none" strokeOpacity="0.75" />
      <Path d="M 10 42 Q 60 50 110 42" stroke={c.dark} strokeWidth="2" fill="none" strokeOpacity="0.55" />
      <Path d="M 60 4 Q 57 38 60 74" stroke={c.dark} strokeWidth="1.4" fill="none" strokeOpacity="0.30" />
      <Path d="M 60 4 Q 63 38 60 74" stroke={c.dark} strokeWidth="1.4" fill="none" strokeOpacity="0.30" />

      {/* Tier-specific embellishments */}
      {tier === 'mythic' && (
        <G>
          <Circle cx={60} cy={37} r={9}  stroke="#FFD700" strokeWidth="2" fill="none" strokeOpacity="0.90" />
          <Circle cx={60} cy={37} r={4}  fill="#FF0090" fillOpacity="0.70" />
          <Circle cx={60} cy={37} r={2}  fill="#FFD700" fillOpacity="0.90" />
        </G>
      )}
      {tier === 'legendary' && (
        <G>
          <Ellipse cx={60} cy={26} rx={5} ry={3}  fill="#FFF08A" fillOpacity="0.65" />
          <Circle cx={44} cy={46} r={2.5} fill="#FFF08A" fillOpacity="0.45" />
          <Circle cx={76} cy={46} r={2.5} fill="#FFF08A" fillOpacity="0.45" />
        </G>
      )}
      {tier === 'epic' && (
        <G>
          <Circle cx={60} cy={35} r={7} stroke="#C084FC" strokeWidth="1.5" fill="none" strokeOpacity="0.75" />
          <Circle cx={60} cy={35} r={2.5} fill="#A855F7" fillOpacity="0.60" />
        </G>
      )}
      {tier === 'rare' && (
        <G>
          <Circle cx={60} cy={36} r={6} stroke="#93C5FD" strokeWidth="1.5" fill="none" strokeOpacity="0.70" />
          <Ellipse cx={60} cy={26} rx={4} ry={2.5} fill="#BFDBFE" fillOpacity="0.50" />
        </G>
      )}
    </Svg>
  );
}

// ─── Background colors per tier ───────────────────────────────────────────────

const TIER_BG: Record<CookieTier, readonly [string, string, string]> = {
  common:    ['#1A0600', '#0D0400', '#060200'],
  rare:      ['#00061A', '#00030D', '#000206'],
  epic:      ['#0D001A', '#06000D', '#030006'],
  legendary: ['#1A0E00', '#0D0800', '#050300'],
  mythic:    ['#1A0010', '#0D0008', '#060004'],
};

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function FortuneCookieScreen() {
  const insets = useSafeAreaInsets();
  const {
    profile, addChips, addXP, addScratchTickets,
    consumeFortuneCookie, consumeFortuneCookieBulk, canClaimFreeCookie, claimFreeCookie,
  } = useUser();

  // ── Cookie inventory totals ────────────────────────────────────────────────
  const inv: Record<CookieTier, number> = {
    common:    profile.commonCookies    ?? 0,
    rare:      profile.rareCookies      ?? 0,
    epic:      profile.epicCookies      ?? 0,
    legendary: profile.legendaryCookies ?? 0,
    mythic:    profile.mythicCookies    ?? 0,
  };
  const totalCookies = Object.values(inv).reduce((s, n) => s + n, 0);
  const hasCookies   = totalCookies > 0;

  // Best available tier = highest non-zero tier (or 'common' as fallback)
  const bestTier: CookieTier = TIER_ORDER.find(t => inv[t] > 0) ?? 'common';

  const [cookieTier, setCookieTier] = useState<CookieTier>(bestTier);
  const [phase,      setPhase]      = useState<Phase>('idle');
  const [reward,     setReward]     = useState<FortuneReward | null>(null);
  const [fortuneMsg, setFortuneMsg] = useState('');
  const [unlockPopup, setUnlockPopup] = useState<CookieTier | null>(null);

  // Bulk open state
  interface BulkSummary { tier: CookieTier; count: number; chips: number; xp: number; tickets: number }
  const [bulkSummary,   setBulkSummary]   = useState<BulkSummary | null>(null);
  const [bulkAnimating, setBulkAnimating] = useState(false);

  // Check for newly unlocked cookie tiers on each level-up
  useEffect(() => {
    AsyncStorage.getItem(UNLOCK_SEEN_KEY).then(raw => {
      const seen = new Set<string>(raw ? (JSON.parse(raw) as string[]) : []);
      const toShow = (['rare', 'epic', 'legendary'] as CookieTier[]).find(t => {
        const lv = TIER_UNLOCK_LEVEL[t];
        return lv !== null && profile.level >= lv && !seen.has(t);
      });
      if (toShow) {
        seen.add(toShow);
        AsyncStorage.setItem(UNLOCK_SEEN_KEY, JSON.stringify([...seen])).catch(() => {});
        setUnlockPopup(toShow);
      }
    }).catch(() => {});
  }, [profile.level]);

  // No auto-switch effect — tier selection is fully manual.
  // Auto-switch only happens inside handleOpen after a tier is depleted.

  // ── Animations ──────────────────────────────────────────────────────────────
  const shakeX       = useRef(new Animated.Value(0)).current;
  const cookieScale  = useRef(new Animated.Value(1)).current;
  const breatheScale = useRef(new Animated.Value(1)).current;
  const leftX        = useRef(new Animated.Value(0)).current;
  const leftRot      = useRef(new Animated.Value(0)).current;
  const rightX       = useRef(new Animated.Value(0)).current;
  const rightRot     = useRef(new Animated.Value(0)).current;
  const flashOp      = useRef(new Animated.Value(0)).current;
  const slipY        = useRef(new Animated.Value(50)).current;
  const slipOp       = useRef(new Animated.Value(0)).current;
  const cardY        = useRef(new Animated.Value(60)).current;
  const cardOp       = useRef(new Animated.Value(0)).current;
  const rewardScale  = useRef(new Animated.Value(0)).current;
  const mythicGlow   = useRef(new Animated.Value(0)).current;
  const announceBannerOp = useRef(new Animated.Value(0)).current;

  // Particle pool — always allocate maximum (mythic size = 20)
  const particles = useRef(
    Array.from({ length: N_PARTICLES_MYTHIC }, () => ({
      x:  new Animated.Value(0),
      y:  new Animated.Value(0),
      op: new Animated.Value(0),
    }))
  ).current;

  // Breathing idle animation
  useEffect(() => {
    if (phase !== 'idle') return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(breatheScale, { toValue: 1.06, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(breatheScale, { toValue: 1.00, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [phase]);

  // Mythic glow pulse (runs when MYTHIC is selected in idle)
  useEffect(() => {
    if (phase !== 'idle' || cookieTier !== 'mythic') return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(mythicGlow, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      Animated.timing(mythicGlow, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
    ]));
    loop.start();
    return () => { loop.stop(); mythicGlow.setValue(0); };
  }, [phase, cookieTier]);

  const handleOpen = useCallback(async () => {
    if (phase !== 'idle') return;

    let tierToOpen = cookieTier;

    // Claim daily if no cookies in inventory — auto-open the claimed tier
    if (canClaimFreeCookie && !hasCookies) {
      const claimed = await claimFreeCookie();
      if (claimed) {
        tierToOpen = claimed;
        setCookieTier(claimed);
      }
    } else if (canClaimFreeCookie) {
      // Has cookies already — just claim the daily (adds to inventory silently)
      await claimFreeCookie();
    }

    // Consume one cookie of the selected tier
    const ok = await consumeFortuneCookie(tierToOpen);
    if (!ok) return;

    // After consuming, if this tier is now empty switch to the next available tier
    const remainingAfterOpen = inv[tierToOpen] - 1;
    if (remainingAfterOpen <= 0) {
      const allTiers: CookieTier[] = ['common', 'rare', 'epic', 'legendary', 'mythic'];
      const next = allTiers.find(t => t !== tierToOpen && inv[t] > 0);
      if (next) setCookieTier(next);
      // else stay on current tier (shows "NO X COOKIES" disabled state)
    }

    // Pick reward STRICTLY from this tier's pool
    const picked = pickReward(tierToOpen);
    const isMythic = tierToOpen === 'mythic';
    const msgs = isMythic ? MYTHIC_MESSAGES : FORTUNE_MESSAGES;
    const msg  = msgs[Math.floor(Math.random() * msgs.length)];

    setReward(picked);
    setFortuneMsg(msg);

    // Apply reward immediately (server-side validation would go here in production)
    if (picked.type === 'chips')   await addChips(picked.amount);
    if (picked.type === 'xp')      await addXP(picked.amount);
    if (picked.type === 'tickets') await addScratchTickets(picked.amount);

    // ── Phase: SHAKE ──────────────────────────────────────────────────────
    setPhase('shaking');
    breatheScale.setValue(1);
    mythicGlow.setValue(0);

    const shakeCount = isMythic ? 8 : 5;
    const shakeSeq = Array.from({ length: shakeCount }, (_, i) => [
      Animated.timing(shakeX, { toValue: i % 2 === 0 ? 11 : -11, duration: 44, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 0,                       duration: 44, useNativeDriver: true }),
    ]).flat();

    Animated.sequence([
      ...shakeSeq,
      Animated.timing(cookieScale, { toValue: 1.22, duration: 90, useNativeDriver: true }),
    ]).start(() => {
      // ── Phase: CRACKED ────────────────────────────────────────────────
      setPhase('cracked');
      SoundEngine.cookieCrack(tierToOpen);
      cookieScale.setValue(1);

      // Flash
      Animated.sequence([
        Animated.timing(flashOp, { toValue: isMythic ? 1.0 : 0.90, duration: isMythic ? 150 : 110, useNativeDriver: true }),
        Animated.timing(flashOp, { toValue: 0, duration: isMythic ? 400 : 260, useNativeDriver: true }),
      ]).start();

      // Cookie halves spring apart
      Animated.parallel([
        Animated.spring(leftX,    { toValue: -80, friction: 4, tension: 90, useNativeDriver: true }),
        Animated.spring(leftRot,  { toValue: -1,  friction: 4, tension: 90, useNativeDriver: true }),
        Animated.spring(rightX,   { toValue:  80, friction: 4, tension: 90, useNativeDriver: true }),
        Animated.spring(rightRot, { toValue:  1,  friction: 4, tension: 90, useNativeDriver: true }),
      ]).start();

      // Particle burst
      const pColors = PARTICLE_COLORS[tierToOpen];
      const nParticles = isMythic ? N_PARTICLES_MYTHIC : N_PARTICLES_NORMAL;
      const burstDist  = isMythic ? 80 : 55;

      particles.slice(0, nParticles).forEach((p, i) => {
        const angle = (i * (360 / nParticles) * Math.PI) / 180;
        const dist  = burstDist + Math.random() * (isMythic ? 50 : 35);
        p.x.setValue(0); p.y.setValue(0); p.op.setValue(0);
        Animated.parallel([
          Animated.timing(p.op, { toValue: 1, duration: 80, useNativeDriver: true }),
          Animated.timing(p.x,  { toValue: Math.cos(angle) * dist, duration: isMythic ? 820 : 620, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(p.y,  { toValue: Math.sin(angle) * dist, duration: isMythic ? 820 : 620, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(p.op, { toValue: 0, duration: isMythic ? 650 : 500, delay: isMythic ? 220 : 180, useNativeDriver: true }),
        ]).start();
      });

      // ── Phase: RISING fortune slip ─────────────────────────────────────
      const riseDelay = isMythic ? 500 : 380;
      setTimeout(() => {
        setPhase('rising');
        SoundEngine.fortuneRise();
        slipY.setValue(50); slipOp.setValue(0);
        Animated.parallel([
          Animated.timing(slipY,  { toValue: 0, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(slipOp, { toValue: 1, duration: 320, useNativeDriver: true }),
        ]).start(() => {
          // ── Phase: REVEAL reward card ────────────────────────────────
          const revealDelay = isMythic ? 500 : 320;
          setTimeout(() => {
            setPhase('reveal');
            SoundEngine.fortuneReward(tierToOpen.toUpperCase() as any);
            cardY.setValue(50); cardOp.setValue(0); rewardScale.setValue(0);
            Animated.parallel([
              Animated.timing(cardY,  { toValue: 0, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
              Animated.timing(cardOp, { toValue: 1, duration: 280, useNativeDriver: true }),
              Animated.spring(rewardScale, { toValue: 1, friction: 5, tension: 90, delay: 200, useNativeDriver: true }),
            ]).start(() => {
              if (isMythic) {
                // MYTHIC social announcement banner fade-in
                Animated.timing(announceBannerOp, { toValue: 1, duration: 600, delay: 400, useNativeDriver: true }).start();
              }
            });
          }, revealDelay);
        });
      }, riseDelay);
    });
  }, [phase, cookieTier, hasCookies, canClaimFreeCookie, profile]);

  // ── Open All ──────────────────────────────────────────────────────────────
  const handleOpenAll = useCallback(async () => {
    if (phase !== 'idle' || bulkAnimating || bulkSummary) return;
    const count = inv[cookieTier];
    if (count <= 0) return;

    // Pick rewards for every cookie upfront
    const rewards = Array.from({ length: count }, () => pickReward(cookieTier));
    let totalChips = 0, totalXp = 0, totalTickets = 0;
    for (const r of rewards) {
      if (r.type === 'chips')   totalChips   += r.amount;
      else if (r.type === 'xp')      totalXp      += r.amount;
      else if (r.type === 'tickets') totalTickets += r.amount;
    }

    // Consume all in a single profile update
    const consumed = await consumeFortuneCookieBulk(cookieTier, count);
    if (!consumed) return;

    // Apply totals
    if (totalChips   > 0) await addChips(totalChips);
    if (totalXp      > 0) await addXP(totalXp);
    if (totalTickets > 0) await addScratchTickets(totalTickets);

    // Auto-switch to next non-empty tier
    const nextTier = (['mythic','legendary','epic','rare','common'] as CookieTier[])
      .find(t => t !== cookieTier && inv[t] > 0);
    if (nextTier) setCookieTier(nextTier);

    // Capture tier before async state changes
    const openedTier = cookieTier;

    // Quick multi-burst animation
    setBulkAnimating(true);
    SoundEngine.cookieCrack(openedTier);
    breatheScale.setValue(1);

    flashOp.setValue(0);
    Animated.sequence([
      Animated.timing(flashOp, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(flashOp, { toValue: 0,    duration: 300, useNativeDriver: true }),
    ]).start();

    particles.forEach((p, i) => {
      const angle = (i / N_PARTICLES_MYTHIC) * 2 * Math.PI;
      const dist  = 65 + Math.random() * 70;
      p.x.setValue(0); p.y.setValue(0); p.op.setValue(0);
      Animated.parallel([
        Animated.timing(p.op, { toValue: 1, duration: 60, useNativeDriver: true }),
        Animated.timing(p.x,  { toValue: Math.cos(angle) * dist, duration: 560, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(p.y,  { toValue: Math.sin(angle) * dist, duration: 560, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(p.op, { toValue: 0, duration: 420, delay: 170, useNativeDriver: true }),
      ]).start();
    });

    setTimeout(() => {
      setBulkAnimating(false);
      SoundEngine.fortuneReward(openedTier.toUpperCase() as any);
      setBulkSummary({ tier: openedTier, count, chips: totalChips, xp: totalXp, tickets: totalTickets });
    }, 700);
  }, [phase, bulkAnimating, bulkSummary, cookieTier, inv,
      consumeFortuneCookieBulk, addChips, addXP, addScratchTickets]);

  const leftRotDeg  = leftRot.interpolate({ inputRange: [-1,0,1], outputRange: ['-32deg','0deg','32deg'] });
  const rightRotDeg = rightRot.interpolate({ inputRange: [-1,0,1], outputRange: ['-32deg','0deg','32deg'] });

  const cfg        = TIER_CFG[cookieTier];
  const pColors    = PARTICLE_COLORS[cookieTier];
  const bgColors   = TIER_BG[cookieTier];
  const glowColor  = cfg.color;
  const isMythicSelected = cookieTier === 'mythic';

  // Mythic animated glow radius
  const mythicGlowSize = mythicGlow.interpolate({ inputRange: [0,1], outputRange: [260, 320] });

  return (
    <View style={styles.container}>
      <LinearGradient colors={bgColors} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 60 : 8) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={cfg.color} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: cfg.color }]}>FORTUNE COOKIE</Text>
          <Text style={[styles.headerSub, { color: cfg.color + '99' }]}>
            {isMythicSelected ? '✦ MYTHIC TIER — ULTRA RARE ✦' : `${cfg.label} · ${cfg.dropRate} DROP RATE`}
          </Text>
        </View>
        <View style={[styles.countBadge, { borderColor: cfg.color + '50', backgroundColor: cfg.color + '18' }]}>
          <Text style={[styles.countNum, { color: cfg.color }]}>{totalCookies}</Text>
          <Text style={styles.countLbl}>🥠</Text>
        </View>
      </View>

      {/* ── Cookie arena ─────────────────────────────────────────────────────── */}
      <View style={styles.arena}>

        {/* Ambient glow */}
        {isMythicSelected ? (
          <Animated.View style={[styles.glow, { backgroundColor: glowColor, width: mythicGlowSize, height: mythicGlowSize, borderRadius: 999 }]} />
        ) : (
          <View style={[styles.glow, { backgroundColor: glowColor }]} />
        )}

        {/* Whole cookie (idle/shaking) */}
        {(phase === 'idle' || phase === 'shaking') && (
          <Animated.View style={{
            transform: [
              { translateX: shakeX },
              { scale: phase === 'idle' ? breatheScale : cookieScale },
            ],
          }}>
            <CookieSvg tier={cookieTier} />
          </Animated.View>
        )}

        {/* Cracked halves */}
        {(phase === 'cracked' || phase === 'rising' || phase === 'reveal') && (
          <>
            <Animated.View style={{ position: 'absolute', transform: [{ translateX: leftX }, { rotate: leftRotDeg }] }}>
              <CookieSvg tier={reward?.tier ?? cookieTier} viewBoxX={0} viewBoxW={60} width={90} height={120} />
            </Animated.View>
            <Animated.View style={{ position: 'absolute', transform: [{ translateX: rightX }, { rotate: rightRotDeg }] }}>
              <CookieSvg tier={reward?.tier ?? cookieTier} viewBoxX={60} viewBoxW={60} width={90} height={120} />
            </Animated.View>
          </>
        )}

        {/* Particles */}
        {particles.map((p, i) => (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              width:  PARTICLE_SIZES[i % PARTICLE_SIZES.length],
              height: PARTICLE_SIZES[i % PARTICLE_SIZES.length],
              borderRadius: PARTICLE_SIZES[i % PARTICLE_SIZES.length] / 2,
              backgroundColor: pColors[i % pColors.length],
              opacity: p.op,
              transform: [{ translateX: p.x }, { translateY: p.y }],
            }}
          />
        ))}

        {/* Flash overlay */}
        <Animated.View style={[styles.flashOverlay, { opacity: flashOp }]} pointerEvents="none" />

        {/* Fortune slip */}
        {(phase === 'rising' || phase === 'reveal') && (
          <Animated.View style={[styles.slip, { borderColor: cfg.color + '88', opacity: slipOp, transform: [{ translateY: slipY }] }]}>
            <LinearGradient
              colors={[cfg.color + '28', cfg.color + '08']}
              style={StyleSheet.absoluteFill}
            />
            <Text style={[styles.slipHeader, { color: cfg.color }]}>✦  LUCKY FORTUNE  ✦</Text>
            <Text style={styles.slipMsg}>{fortuneMsg}</Text>
          </Animated.View>
        )}
      </View>

      {/* ── Bottom area ───────────────────────────────────────────────────────── */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 24 }]}>

        {/* IDLE: tier selector + open button */}
        {phase === 'idle' && (
          <View style={styles.idleSection}>

            {/* ── Rarity selector tabs ── */}
            <View style={styles.tierTabRow}>
              {(CHART_TIERS as CookieTier[])
                .concat(inv.mythic > 0 ? (['mythic'] as CookieTier[]) : [])
                .map(t => {
                  const c        = TIER_CFG[t];
                  const qty      = inv[t];
                  const isActive = cookieTier === t;
                  const hasDaily = t === 'common' && canClaimFreeCookie;
                  return (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.tierTab,
                        isActive
                          ? { borderColor: c.color, backgroundColor: `${c.color}20` }
                          : { borderColor: `${c.color}25`, backgroundColor: 'transparent' },
                      ]}
                      onPress={() => setCookieTier(t)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.tierTabLabel, { color: isActive ? c.color : `${c.color}60` }]}>
                        {c.label}
                      </Text>
                      <Text style={[styles.tierTabCount, { color: isActive ? c.color : 'rgba(255,255,255,0.25)' }]}>
                        {hasDaily && qty === 0 ? '✦' : `×${qty}`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
            </View>

            {/* ── Open / Open All buttons — controlled by selected tab ── */}
            {(() => {
              const tierQty   = inv[cookieTier];
              const isDailyOk = cookieTier === 'common' && canClaimFreeCookie;
              const canOpenThis = tierQty > 0 || isDailyOk;
              const isBusy = bulkAnimating || !!bulkSummary;

              if (!hasCookies && !canClaimFreeCookie) {
                return (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>🥠</Text>
                    <Text style={styles.emptyTitle}>No Cookies</Text>
                    <Text style={styles.emptySub}>Spin the wheel or come back tomorrow for your free daily cookie.</Text>
                  </View>
                );
              }

              if (!canOpenThis) {
                return (
                  <View style={[styles.openBtn, styles.openBtnDisabled]}>
                    <Text style={styles.openBtnDisabledText}>NO {cfg.label} COOKIES</Text>
                  </View>
                );
              }

              return (
                <View style={styles.openBtnRow}>
                  {/* OPEN (single) */}
                  <TouchableOpacity
                    style={[styles.openBtn, { overflow: 'hidden', flex: 1 }]}
                    onPress={handleOpen}
                    activeOpacity={0.82}
                    disabled={isBusy}
                  >
                    <LinearGradient
                      colors={isMythicSelected ? ['#FF0090', '#FF69B4', '#FFD700'] : [cfg.color, cfg.color + 'cc']}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    />
                    <Text style={[styles.openBtnText, { color: isMythicSelected ? '#fff' : '#050010', fontSize: 11 }]}>
                      {isDailyOk && tierQty === 0 ? `CLAIM & OPEN` : `OPEN ${cfg.label}`}
                    </Text>
                  </TouchableOpacity>

                  {/* OPEN ALL (only shown when 2+ cookies) */}
                  {tierQty >= 2 && (
                    <TouchableOpacity
                      style={[styles.openAllBtn, {
                        borderColor: isBusy ? 'rgba(255,255,255,0.10)' : cfg.color + '55',
                        opacity: isBusy ? 0.38 : 1,
                      }]}
                      onPress={handleOpenAll}
                      activeOpacity={0.80}
                      disabled={isBusy}
                    >
                      <Text style={[styles.openAllBtnLabel, { color: isBusy ? 'rgba(255,255,255,0.30)' : cfg.color }]}>
                        OPEN ALL
                      </Text>
                      <Text style={[styles.openAllBtnCount, { color: isBusy ? 'rgba(255,255,255,0.20)' : cfg.color + 'aa' }]}>
                        ×{tierQty}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })()}

            {/* ── Tier info cards ─────────────────────────────────────────── */}
            <Text style={styles.infoLabel}>FORTUNE COOKIE REWARDS</Text>
            <View style={styles.infoGrid}>
              {CHART_TIERS.map(t => {
                const c = TIER_CFG[t];
                const ranges: Record<string, string> = {
                  common:    '5K–25K Chips',
                  rare:      '25K–150K Chips',
                  epic:      '150K–750K Chips',
                  legendary: '750K–2M Chips',
                };
                return (
                  <View key={t} style={[styles.infoCard, { borderColor: `${c.color}30`, backgroundColor: `${c.color}0a` }]}>
                    <View style={[styles.infoCardDot, { backgroundColor: c.color }]} />
                    <Text style={[styles.infoCardTier, { color: c.color }]}>{c.label}</Text>
                    <Text style={styles.infoCardRange}>{ranges[t]}</Text>
                  </View>
                );
              })}
            </View>

            {/* Mythic — wheel-only badge (always shown at bottom) */}
            <View style={styles.mythicBadge}>
              <Text style={styles.mythicBadgeStar}>⭐</Text>
              <View style={styles.mythicBadgeText}>
                <Text style={styles.mythicBadgeTitle}>DAILY WHEEL EXCLUSIVE</Text>
                <Text style={styles.mythicBadgeSub}>The Mythic Fortune Cookie can only be won from the Daily Wheel.</Text>
              </View>
            </View>
          </View>
        )}

        {/* REVEAL: reward card */}
        {phase === 'reveal' && reward && (
          <Animated.View style={[styles.rewardCard, { opacity: cardOp, transform: [{ translateY: cardY }] }]}>
            <LinearGradient
              colors={[reward.color + '22', 'transparent']}
              style={StyleSheet.absoluteFill}
            />

            {/* Tier badge */}
            <Animated.View style={[styles.tierBadge, { backgroundColor: reward.color + '22', borderColor: reward.color, transform: [{ scale: rewardScale }] }]}>
              <Text style={[styles.tierText, { color: reward.color }]}>{TIER_CFG[reward.tier].label}</Text>
            </Animated.View>

            {/* Reward amount */}
            <Animated.View style={[styles.rewardRow, { transform: [{ scale: rewardScale }] }]}>
              <Text style={styles.rewardIcon}>
                {reward.type === 'chips' ? '💰' : reward.type === 'tickets' ? '🎟️' : '⚡'}
              </Text>
              <Text style={[styles.rewardLabel, { color: reward.color }]}>{reward.label}</Text>
            </Animated.View>

            <Text style={styles.rewardSub}>
              {reward.type === 'chips'   ? 'Added to your chip balance'   :
               reward.type === 'tickets' ? 'Lottery tickets added'        :
                                           '⚡ KEEP LEVELING UP!'}
            </Text>

            {/* Stats */}
            <View style={styles.statsRow}>
              <Text style={styles.statLbl}>Cookies Opened</Text>
              <Text style={styles.statVal}>{profile.cookiesOpened}</Text>
            </View>

            {/* MYTHIC: global social announcement banner */}
            {reward.tier === 'mythic' && (
              <Animated.View style={[styles.mythicAnnounce, { opacity: announceBannerOp }]}>
                <LinearGradient
                  colors={['rgba(255,0,144,0.20)', 'rgba(255,215,0,0.12)', 'rgba(255,0,144,0.20)']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                />
                <Text style={styles.mythicAnnounceIcon}>🌐</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mythicAnnounceLabel}>GLOBAL ANNOUNCEMENT</Text>
                  <Text style={styles.mythicAnnounceText}>
                    <Text style={{ color: '#FFD700' }}>{profile.username}</Text>
                    {' just cracked a '}
                    <Text style={{ color: '#FF0090' }}>MYTHIC Fortune Cookie</Text>
                    {reward.type === 'chips' ? ` and won ${formatChips(reward.amount)} chips!` : '!'}
                  </Text>
                </View>
              </Animated.View>
            )}

            <TouchableOpacity style={[styles.collectBtn, { overflow: 'hidden' }]} onPress={() => router.back()} activeOpacity={0.82}>
              <LinearGradient
                colors={reward.tier === 'mythic' ? ['#FF0090','#FFD700'] : [reward.color, reward.color + 'aa']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              />
              <Text style={[styles.collectText, { color: reward.tier === 'mythic' ? '#fff' : '#050010' }]}>COLLECT</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Opening in progress — spacer */}
        {(phase === 'shaking' || phase === 'cracked' || phase === 'rising') && (
          <View style={styles.openingMsg}>
            <Text style={[styles.openingText, { color: cfg.color }]}>Opening your fortune…</Text>
          </View>
        )}
      </View>

      {/* ── Bulk Open Summary Overlay ─────────────────────────────────────────── */}
      {bulkSummary && (() => {
        const bc = TIER_CFG[bulkSummary.tier];
        return (
          <View style={styles.unlockOverlay}>
            <View style={styles.unlockBackdrop} />
            <View style={[styles.bulkCard, { borderColor: bc.color + '88' }]}>
              <LinearGradient
                colors={[bc.color + '28', 'transparent', bc.color + '10']}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.bulkCookieEmoji}>🥠</Text>
              <Text style={[styles.bulkTitle, { color: bc.color }]}>
                {bulkSummary.count} {bc.label} {bulkSummary.count === 1 ? 'COOKIE' : 'COOKIES'} OPENED
              </Text>

              <View style={styles.bulkDivider} />
              <Text style={styles.bulkRewardsLabel}>REWARDS</Text>

              {bulkSummary.chips > 0 && (
                <View style={styles.bulkRewardRow}>
                  <Text style={styles.bulkRewardIcon}>💰</Text>
                  <Text style={[styles.bulkRewardText, { color: bc.color }]}>
                    Chips: +{formatChips(bulkSummary.chips)}
                  </Text>
                </View>
              )}
              {bulkSummary.tickets > 0 && (
                <View style={styles.bulkRewardRow}>
                  <Text style={styles.bulkRewardIcon}>🎟️</Text>
                  <Text style={[styles.bulkRewardText, { color: bc.color }]}>
                    Tickets: +{bulkSummary.tickets}
                  </Text>
                </View>
              )}
              {bulkSummary.xp > 0 && (
                <View style={styles.bulkRewardRow}>
                  <Text style={styles.bulkRewardIcon}>⚡</Text>
                  <Text style={[styles.bulkRewardText, { color: bc.color }]}>
                    XP: +{bulkSummary.xp.toLocaleString()}
                  </Text>
                </View>
              )}
              {bulkSummary.chips === 0 && bulkSummary.tickets === 0 && bulkSummary.xp === 0 && (
                <Text style={styles.bulkRewardText}>Rewards applied!</Text>
              )}

              <View style={styles.bulkStatRow}>
                <Text style={styles.bulkStatLbl}>Total Cookies Opened</Text>
                <Text style={styles.bulkStatVal}>{profile.cookiesOpened}</Text>
              </View>

              <TouchableOpacity
                style={[styles.unlockBtn, { backgroundColor: bc.color, marginTop: 4 }]}
                onPress={() => { setBulkSummary(null); router.back(); }}
                activeOpacity={0.85}
              >
                <Text style={styles.unlockBtnText}>COLLECT</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })()}

      {/* ── Cookie Tier Unlock Popup ──────────────────────────────────────────── */}
      {unlockPopup && (() => {
        const pc = TIER_CFG[unlockPopup];
        return (
          <View style={styles.unlockOverlay}>
            <TouchableOpacity style={styles.unlockBackdrop} onPress={() => setUnlockPopup(null)} activeOpacity={1} />
            <View style={[styles.unlockCard, { borderColor: pc.color + '88' }]}>
              <LinearGradient
                colors={[pc.color + '28', 'transparent', pc.color + '10']}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.unlockBigEmoji}>🥠</Text>
              <Text style={styles.unlockHeadline}>NEW COOKIE UNLOCKED</Text>
              <Text style={[styles.unlockTierName, { color: pc.color }]}>
                {pc.label} FORTUNE COOKIE
              </Text>
              <Text style={styles.unlockDesc}>{TIER_DESCRIPTIONS[unlockPopup]}</Text>
              <Text style={[styles.unlockRange, { color: pc.color + '99' }]}>
                {formatChips(pc.chipRange[0])}–{formatChips(pc.chipRange[1])} chips per opening
              </Text>
              <TouchableOpacity
                style={[styles.unlockBtn, { backgroundColor: pc.color }]}
                onPress={() => setUnlockPopup(null)}
                activeOpacity={0.85}
              >
                <Text style={styles.unlockBtnText}>AWESOME!</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })()}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0400' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 8, gap: 10,
  },
  backBtn: { padding: 6, borderRadius: 20 },
  headerCenter: { flex: 1 },
  headerTitle: {
    fontSize: 16, fontWeight: '900',
    fontFamily: 'Orbitron_900Black', letterSpacing: 2,
  },
  headerSub: {
    fontSize: 9, fontFamily: 'Orbitron_400Regular',
    letterSpacing: 1, marginTop: 2,
  },
  countBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  countNum: { fontSize: 14, fontWeight: '900', fontFamily: 'Inter_700Bold' },
  countLbl: { fontSize: 14 },

  arena: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    width: 260, height: 180, borderRadius: 130,
    opacity: 0.18,
  },
  flashOverlay: {
    position: 'absolute',
    width: 300, height: 220, borderRadius: 150,
    backgroundColor: '#FFFFFF',
  },
  slip: {
    position: 'absolute', bottom: -10,
    width: Math.min(W - 48, 300),
    borderRadius: 12, borderWidth: 1.5,
    backgroundColor: 'rgba(5,0,16,0.95)',
    padding: 16, alignItems: 'center',
    overflow: 'hidden', gap: 6,
  },
  slipHeader: {
    fontSize: 9, fontFamily: 'Orbitron_400Regular', letterSpacing: 2.5,
  },
  slipMsg: {
    color: 'rgba(240,220,200,0.92)', fontSize: 15,
    fontFamily: 'Orbitron_400Regular', letterSpacing: 0.5,
    textAlign: 'center', lineHeight: 22, fontStyle: 'italic',
  },

  bottom: { paddingHorizontal: 20 },

  idleSection: { gap: 12 },
  openBtn: {
    borderRadius: 14, height: 52,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  openBtnText: { fontSize: 13, fontWeight: '900', fontFamily: 'Orbitron_900Black', letterSpacing: 2 },
  openBtnDisabled: {
    borderRadius: 14, height: 52,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  openBtnDisabledText: {
    fontSize: 11, fontFamily: 'Orbitron_700Bold',
    color: 'rgba(255,255,255,0.25)', letterSpacing: 1.5,
  },

  emptyState: { alignItems: 'center', gap: 8 },
  emptyIcon:  { fontSize: 48 },
  emptyTitle: { color: '#555', fontSize: 16, fontFamily: 'Orbitron_700Bold', letterSpacing: 2 },
  emptySub:   { color: '#333', fontSize: 12, fontFamily: 'Orbitron_400Regular', textAlign: 'center', lineHeight: 18 },

  openBtnRow: { flexDirection: 'row', gap: 8, alignItems: 'stretch' },
  openAllBtn: {
    borderRadius: 14, borderWidth: 1.5,
    paddingHorizontal: 14, paddingVertical: 0,
    alignItems: 'center', justifyContent: 'center',
    minWidth: 90,
  },
  openAllBtnLabel: {
    fontSize: 10, fontFamily: 'Orbitron_900Black', letterSpacing: 1.5,
  },
  openAllBtnCount: {
    fontSize: 13, fontFamily: 'Inter_700Bold', marginTop: 1,
  },

  bulkCard: {
    width: Math.min(W - 40, 340),
    borderRadius: 20, borderWidth: 1.5,
    backgroundColor: 'rgba(5,0,16,0.97)',
    padding: 24, alignItems: 'center', gap: 10,
    overflow: 'hidden',
  },
  bulkCookieEmoji: { fontSize: 40 },
  bulkTitle: {
    fontSize: 13, fontFamily: 'Orbitron_900Black',
    letterSpacing: 1.5, textAlign: 'center', lineHeight: 20,
  },
  bulkDivider: {
    width: '80%', height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 2,
  },
  bulkRewardsLabel: {
    color: 'rgba(255,255,255,0.30)', fontSize: 9,
    fontFamily: 'Orbitron_700Bold', letterSpacing: 2.5,
  },
  bulkRewardRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    width: '100%',
  },
  bulkRewardIcon: { fontSize: 22, width: 30, textAlign: 'center' },
  bulkRewardText: {
    fontSize: 16, fontFamily: 'Inter_700Bold', flex: 1,
    color: 'rgba(255,255,255,0.80)',
  },
  bulkStatRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    width: '100%', paddingTop: 10, marginTop: 2,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
  },
  bulkStatLbl: {
    color: '#555', fontSize: 10,
    fontFamily: 'Orbitron_400Regular', letterSpacing: 1,
  },
  bulkStatVal: {
    color: '#ccc', fontSize: 13, fontFamily: 'Inter_700Bold',
  },

  // ── Tier selector tabs ──────────────────────────────────────────────────────
  tierTabRow: { flexDirection: 'row', gap: 6 },
  tierTab: {
    flex: 1, borderRadius: 10, borderWidth: 1,
    paddingVertical: 8, paddingHorizontal: 4,
    alignItems: 'center', gap: 3,
  },
  tierTabLabel: {
    fontSize: 8, fontFamily: 'Orbitron_700Bold', letterSpacing: 0.5,
  },
  tierTabCount: {
    fontSize: 11, fontFamily: 'Inter_700Bold',
  },

  // ── Mythic owned open button ─────────────────────────────────────────────
  mythicOpenBtn: {
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,0,144,0.50)',
    paddingVertical: 10, paddingHorizontal: 16,
    alignItems: 'center', gap: 2,
  },
  mythicOpenLabel: {
    fontSize: 12, fontWeight: '900', fontFamily: 'Orbitron_900Black',
    color: '#fff', letterSpacing: 1.5,
  },
  mythicOpenSub: {
    fontSize: 9, fontFamily: 'Orbitron_400Regular',
    color: 'rgba(255,255,255,0.70)', letterSpacing: 0.5,
  },

  infoLabel: {
    color: 'rgba(255,255,255,0.25)', fontSize: 9,
    fontFamily: 'Orbitron_700Bold', letterSpacing: 2, marginTop: 4,
  },
  infoGrid: { flexDirection: 'row', gap: 6 },
  infoCard: {
    flex: 1, borderRadius: 10, borderWidth: 1,
    paddingVertical: 10, paddingHorizontal: 8,
    alignItems: 'center', gap: 4,
  },
  infoCardDot: { width: 6, height: 6, borderRadius: 3 },
  infoCardTier: {
    fontSize: 8, fontFamily: 'Orbitron_700Bold',
    letterSpacing: 0.5, textAlign: 'center',
  },
  infoCardRange: {
    color: 'rgba(255,255,255,0.50)', fontSize: 9,
    fontFamily: 'Inter_700Bold', textAlign: 'center',
  },
  mythicBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 10, borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.25)', backgroundColor: 'rgba(255,215,0,0.06)',
    paddingVertical: 9, paddingHorizontal: 12,
  },
  mythicBadgeStar: { fontSize: 18, flexShrink: 0 },
  mythicBadgeText: { flex: 1 },
  mythicBadgeTitle: {
    color: '#FFD700', fontSize: 9,
    fontFamily: 'Orbitron_700Bold', letterSpacing: 1.5, marginBottom: 2,
  },
  mythicBadgeSub: {
    color: 'rgba(255,255,255,0.45)', fontSize: 10,
    fontFamily: 'Orbitron_400Regular', lineHeight: 14, flexWrap: 'wrap',
  },

  rewardCard: {
    borderRadius: 20, borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(5,0,16,0.95)',
    padding: 20, alignItems: 'center',
    overflow: 'hidden', gap: 10,
  },
  tierBadge: {
    borderRadius: 8, borderWidth: 1.5,
    paddingHorizontal: 16, paddingVertical: 5,
  },
  tierText: { fontSize: 11, fontFamily: 'Orbitron_700Bold', letterSpacing: 2 },

  rewardRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rewardIcon: { fontSize: 32 },
  rewardLabel:{ fontSize: 22, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  rewardSub:  { color: 'rgba(255,255,255,0.45)', fontSize: 11, fontFamily: 'Orbitron_400Regular', letterSpacing: 0.5 },

  statsRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    width: '100%', paddingTop: 8,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
  },
  statLbl: { color: '#555', fontSize: 10, fontFamily: 'Orbitron_400Regular', letterSpacing: 1 },
  statVal: { color: '#ccc', fontSize: 13, fontFamily: 'Inter_700Bold' },

  mythicAnnounce: {
    width: '100%', borderRadius: 10, borderWidth: 1,
    borderColor: 'rgba(255,0,144,0.40)',
    paddingVertical: 10, paddingHorizontal: 12,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    overflow: 'hidden',
  },
  mythicAnnounceIcon:  { fontSize: 18 },
  mythicAnnounceLabel: {
    color: '#FF0090', fontSize: 8, fontFamily: 'Orbitron_700Bold',
    letterSpacing: 2, marginBottom: 3,
  },
  mythicAnnounceText: {
    color: 'rgba(255,255,255,0.85)', fontSize: 11,
    fontFamily: 'Orbitron_400Regular', letterSpacing: 0.3, lineHeight: 16,
  },

  collectBtn: {
    width: '100%', height: 48, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  collectText: { fontSize: 13, fontWeight: '900', fontFamily: 'Orbitron_900Black', letterSpacing: 2 },

  openingMsg:  { alignItems: 'center', paddingVertical: 20 },
  openingText: { fontSize: 13, fontFamily: 'Orbitron_400Regular', letterSpacing: 1.5 },

  // Unlock popup overlay
  unlockOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  unlockBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.80)',
  },
  unlockCard: {
    width: '85%',
    borderRadius: 22, borderWidth: 1.5,
    backgroundColor: 'rgba(5,0,16,0.97)',
    padding: 26, alignItems: 'center',
    gap: 6, overflow: 'hidden',
  },
  unlockBigEmoji:  { fontSize: 54 },
  unlockHeadline: {
    color: '#ffffff', fontSize: 11,
    fontFamily: 'Orbitron_700Bold', letterSpacing: 3,
    marginTop: 2,
  },
  unlockTierName: {
    fontSize: 17, fontFamily: 'Orbitron_900Black',
    letterSpacing: 1, marginBottom: 2, textAlign: 'center',
  },
  unlockDesc: {
    color: 'rgba(255,255,255,0.60)', fontSize: 12,
    fontFamily: 'Orbitron_400Regular',
    textAlign: 'center', lineHeight: 18,
  },
  unlockRange: {
    fontSize: 11, fontFamily: 'Orbitron_400Regular', letterSpacing: 0.5,
  },
  unlockBtn: {
    marginTop: 10, borderRadius: 12,
    paddingHorizontal: 36, paddingVertical: 13,
  },
  unlockBtnText: {
    color: '#050010', fontSize: 13,
    fontFamily: 'Orbitron_900Black', letterSpacing: 2,
  },
});
