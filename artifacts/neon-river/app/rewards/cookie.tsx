/**
 * Fortune Cookie Bonus Screen
 * Premium casino-style animated fortune cookie reveal.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
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
import { formatChips } from '@/utils/chipColor';
import { SoundEngine } from '@/lib/soundEngine';

const { width: W } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────────────────

type CookieType = 'standard' | 'golden' | 'dragon';
type Phase = 'idle' | 'shaking' | 'cracked' | 'rising' | 'reveal';
type RewardTier = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

interface FortuneReward {
  tier: RewardTier;
  type: 'chips' | 'xp' | 'token';
  amount: number;
  label: string;
  color: string;
  icon: string;
}

// ─── Content ──────────────────────────────────────────────────────────────────

const FORTUNE_MESSAGES = [
  'Great wealth approaches.',
  'Luck favors the bold.',
  'A royal hand awaits.',
  'The dragon smiles upon you.',
  'A jackpot is in your future.',
  'Your next hand may change everything.',
  'Prosperity is near.',
  'The cards are aligned.',
  'Fortune follows confidence.',
  'A lucky streak begins today.',
];

const TIER_COLOR: Record<RewardTier, string> = {
  COMMON:    '#9CA3AF',
  RARE:      '#60A5FA',
  EPIC:      '#A855F7',
  LEGENDARY: '#F59E0B',
};

const TIER_REWARDS: Record<RewardTier, FortuneReward[]> = {
  COMMON: [
    { tier:'COMMON',    type:'chips', amount:5_000,   label:'+5,000 Chips',   color:'#9CA3AF', icon:'💰' },
    { tier:'COMMON',    type:'chips', amount:10_000,  label:'+10,000 Chips',  color:'#9CA3AF', icon:'💰' },
    { tier:'COMMON',    type:'xp',   amount:250,     label:'+250 XP',        color:'#9CA3AF', icon:'⚡' },
  ],
  RARE: [
    { tier:'RARE',      type:'chips', amount:25_000,  label:'+25,000 Chips',  color:'#60A5FA', icon:'💎' },
    { tier:'RARE',      type:'chips', amount:50_000,  label:'+50,000 Chips',  color:'#60A5FA', icon:'💎' },
    { tier:'RARE',      type:'xp',   amount:500,     label:'+500 XP',        color:'#60A5FA', icon:'⚡' },
  ],
  EPIC: [
    { tier:'EPIC',      type:'chips', amount:100_000, label:'+100,000 Chips', color:'#A855F7', icon:'⭐' },
    { tier:'EPIC',      type:'chips', amount:250_000, label:'+250,000 Chips', color:'#A855F7', icon:'⭐' },
    { tier:'EPIC',      type:'xp',   amount:1_000,   label:'+1,000 XP',      color:'#A855F7', icon:'⚡' },
  ],
  LEGENDARY: [
    { tier:'LEGENDARY', type:'chips', amount:500_000,   label:'+500,000 Chips',   color:'#F59E0B', icon:'👑' },
    { tier:'LEGENDARY', type:'chips', amount:1_000_000, label:'+1,000,000 Chips', color:'#F59E0B', icon:'👑' },
    { tier:'LEGENDARY', type:'chips', amount:2_500_000, label:'+2,500,000 Chips', color:'#F59E0B', icon:'👑' },
    { tier:'LEGENDARY', type:'xp',   amount:5_000,     label:'+5,000 XP',        color:'#F59E0B', icon:'⚡' },
  ],
};

function pickReward(type: CookieType): FortuneReward {
  const r = Math.random();
  let tier: RewardTier;
  if (type === 'dragon') {
    tier = r < 0.60 ? 'EPIC' : 'LEGENDARY';
  } else if (type === 'golden') {
    tier = r < 0.50 ? 'RARE' : r < 0.90 ? 'EPIC' : 'LEGENDARY';
  } else {
    tier = r < 0.60 ? 'COMMON' : r < 0.90 ? 'RARE' : r < 0.99 ? 'EPIC' : 'LEGENDARY';
  }
  const pool = TIER_REWARDS[tier];
  return pool[Math.floor(Math.random() * pool.length)];
}

// ─── Cookie SVG palette ───────────────────────────────────────────────────────

const COOKIE_PAL = {
  standard: { body: '#C4813A', dark: '#7A4E1E', light: '#E8A458', rim: '#D4A017' },
  golden:   { body: '#D4A017', dark: '#8A6808', light: '#FFE06A', rim: '#FFF08A' },
  dragon:   { body: '#8B1800', dark: '#4A0800', light: '#C44A1A', rim: '#D4A017' },
};

// ─── Cookie SVG (whole) ───────────────────────────────────────────────────────
function CookieSvg({ type, viewBoxX = 0, viewBoxW = 120, width = 180, height = 120 }: {
  type: CookieType; viewBoxX?: number; viewBoxW?: number; width?: number; height?: number;
}) {
  const c = COOKIE_PAL[type];
  const gid = `cg_${type}_${viewBoxX}`;
  return (
    <Svg width={width} height={height} viewBox={`${viewBoxX} 0 ${viewBoxW} 80`}>
      <Defs>
        <SvgGrad id={gid} x1="0.5" y1="0" x2="0.5" y2="1">
          <Stop offset="0%"   stopColor={c.light} />
          <Stop offset="45%"  stopColor={c.body}  />
          <Stop offset="100%" stopColor={c.dark}  />
        </SvgGrad>
      </Defs>
      {/* Main body */}
      <Path d="M 10 42 Q 60 4 110 42 Q 88 72 60 74 Q 32 72 10 42 Z" fill={`url(#${gid})`} />
      {/* Top rim */}
      <Path d="M 10 42 Q 60 4 110 42" stroke={c.rim} strokeWidth="2.5" fill="none" strokeOpacity="0.75" />
      {/* Horizontal fold */}
      <Path d="M 10 42 Q 60 50 110 42" stroke={c.dark} strokeWidth="2" fill="none" strokeOpacity="0.55" />
      {/* Vertical crease */}
      <Path d="M 60 4 Q 57 38 60 74" stroke={c.dark} strokeWidth="1.4" fill="none" strokeOpacity="0.30" />
      <Path d="M 60 4 Q 63 38 60 74" stroke={c.dark} strokeWidth="1.4" fill="none" strokeOpacity="0.30" />
      {/* Dragon: gold medallion */}
      {type === 'dragon' && (
        <G>
          <Circle cx={60} cy={37} r={9}  stroke="#D4A017" strokeWidth="1.5" fill="none" strokeOpacity="0.80" />
          <Circle cx={60} cy={37} r={3}  fill="#D4A017" fillOpacity="0.55" />
        </G>
      )}
      {/* Golden: sparkle dots */}
      {type === 'golden' && (
        <G>
          <Ellipse cx={60} cy={26} rx={5} ry={3}  fill="#FFF08A" fillOpacity="0.65" />
          <Circle cx={44} cy={46} r={2.5} fill="#FFF08A" fillOpacity="0.45" />
          <Circle cx={76} cy={46} r={2.5} fill="#FFF08A" fillOpacity="0.45" />
        </G>
      )}
    </Svg>
  );
}

// ─── Gold particle burst ──────────────────────────────────────────────────────
const N_PARTICLES = 10;
const PARTICLE_COLORS_STD = ['#D4A017','#E8A458','#FFD700','#FF6600','#C4813A'];
const PARTICLE_COLORS_GLD = ['#FFD700','#FFF08A','#FFEE55','#FFB800','#FFFACD'];
const PARTICLE_COLORS_DRG = ['#D4A017','#FF2200','#FF6600','#CC0000','#FFD700'];
const PARTICLE_SIZES = [7, 5, 9, 6, 8, 5, 7, 6, 9, 5];

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function FortuneCookieScreen() {
  const insets = useSafeAreaInsets();
  const {
    profile, addChips, addXP, consumeFortuneCookie,
    canClaimFreeCookie, claimFreeCookie, addFortuneCookies,
  } = useUser();

  // Determine best cookie type
  const bestType: CookieType = profile.dragonCookies > 0 ? 'dragon'
    : profile.goldenCookies > 0 ? 'golden'
    : 'standard';

  const hasCookies = profile.fortuneCookies > 0
    || profile.goldenCookies > 0
    || profile.dragonCookies > 0;

  const [cookieType, setCookieType]   = useState<CookieType>(bestType);
  const [phase,      setPhase]        = useState<Phase>('idle');
  const [reward,     setReward]       = useState<FortuneReward | null>(null);
  const [fortuneMsg, setFortuneMsg]   = useState('');

  // Auto-switch to best available type when selected type is depleted
  useEffect(() => {
    if (phase !== 'idle') return;
    const hasCurrent = cookieType === 'dragon' ? profile.dragonCookies > 0
      : cookieType === 'golden' ? profile.goldenCookies > 0
      : profile.fortuneCookies > 0;
    if (!hasCurrent) {
      const next: CookieType = profile.dragonCookies > 0 ? 'dragon'
        : profile.goldenCookies > 0 ? 'golden'
        : 'standard';
      setCookieType(next);
    }
  }, [profile.fortuneCookies, profile.goldenCookies, profile.dragonCookies, phase, cookieType]);

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

  const particles = useRef(
    Array.from({ length: N_PARTICLES }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
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

  const handleOpen = useCallback(async () => {
    if (phase !== 'idle') return;

    // Claim daily if available
    if (canClaimFreeCookie) await claimFreeCookie();

    // Use the player's selected cookie type
    const type = cookieType;

    const ok = await consumeFortuneCookie(type);
    if (!ok) return;

    const picked = pickReward(type);
    const msg    = FORTUNE_MESSAGES[Math.floor(Math.random() * FORTUNE_MESSAGES.length)];
    setCookieType(type);
    setReward(picked);
    setFortuneMsg(msg);

    // Apply reward immediately
    if (picked.type === 'chips') await addChips(picked.amount);
    if (picked.type === 'xp')    await addXP(picked.amount);

    // Phase: shake
    setPhase('shaking');
    breatheScale.setValue(1);

    const shakeSeq = Array.from({ length: 5 }, (_, i) => [
      Animated.timing(shakeX, { toValue: i % 2 === 0 ? 9 : -9, duration: 48, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 0,                     duration: 48, useNativeDriver: true }),
    ]).flat();

    Animated.sequence([
      ...shakeSeq,
      Animated.timing(cookieScale, { toValue: 1.18, duration: 90, useNativeDriver: true }),
    ]).start(() => {
      // Phase: cracked — 🥠 CRACK SOUND
      setPhase('cracked');
      SoundEngine.cookieCrack(type);
      cookieScale.setValue(1);

      // Flash
      Animated.sequence([
        Animated.timing(flashOp, { toValue: 0.90, duration: 110, useNativeDriver: true }),
        Animated.timing(flashOp, { toValue: 0,    duration: 260, useNativeDriver: true }),
      ]).start();

      // Halves spring apart
      Animated.parallel([
        Animated.spring(leftX,   { toValue: -80,  friction: 4, tension: 90, useNativeDriver: true }),
        Animated.spring(leftRot, { toValue: -1,   friction: 4, tension: 90, useNativeDriver: true }),
        Animated.spring(rightX,  { toValue:  80,  friction: 4, tension: 90, useNativeDriver: true }),
        Animated.spring(rightRot,{ toValue:  1,   friction: 4, tension: 90, useNativeDriver: true }),
      ]).start();

      // Particles burst
      const pCols = type === 'golden' ? PARTICLE_COLORS_GLD
        : type === 'dragon' ? PARTICLE_COLORS_DRG
        : PARTICLE_COLORS_STD;
      particles.forEach((p, i) => {
        const angle = (i * 36 * Math.PI) / 180;
        const dist  = 55 + Math.random() * 35;
        p.x.setValue(0); p.y.setValue(0); p.op.setValue(0);
        Animated.parallel([
          Animated.timing(p.op, { toValue: 1, duration: 80, useNativeDriver: true }),
          Animated.timing(p.x,  { toValue: Math.cos(angle) * dist, duration: 620, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(p.y,  { toValue: Math.sin(angle) * dist, duration: 620, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(p.op, { toValue: 0, duration: 500, delay: 180, useNativeDriver: true }),
        ]).start();
      });

      // Phase: fortune slip rises — ✨ RISE CHIME
      setTimeout(() => {
        setPhase('rising');
        SoundEngine.fortuneRise();
        slipY.setValue(50); slipOp.setValue(0);
        Animated.parallel([
          Animated.timing(slipY,  { toValue: 0, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(slipOp, { toValue: 1, duration: 320, useNativeDriver: true }),
        ]).start(() => {
          // Phase: reveal reward card — 🏮 PROSPERITY REWARD SOUND
          setTimeout(() => {
            setPhase('reveal');
            SoundEngine.fortuneReward(picked.tier);
            cardY.setValue(50); cardOp.setValue(0); rewardScale.setValue(0);
            Animated.parallel([
              Animated.timing(cardY,  { toValue: 0, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
              Animated.timing(cardOp, { toValue: 1, duration: 280, useNativeDriver: true }),
              Animated.spring(rewardScale, { toValue: 1, friction: 5, tension: 90, delay: 200, useNativeDriver: true }),
            ]).start();
          }, 320);
        });
      }, 380);
    });
  }, [phase, profile, canClaimFreeCookie]);

  const leftRotDeg = leftRot.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-32deg', '0deg', '32deg'] });
  const rightRotDeg = rightRot.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-32deg', '0deg', '32deg'] });

  const pColors = cookieType === 'golden' ? PARTICLE_COLORS_GLD
    : cookieType === 'dragon' ? PARTICLE_COLORS_DRG
    : PARTICLE_COLORS_STD;

  const bgColors = cookieType === 'dragon'
    ? (['#1A0000', '#0D0000', '#050000'] as const)
    : cookieType === 'golden'
    ? (['#1A0E00', '#0D0800', '#050300'] as const)
    : (['#1A0600', '#0D0400', '#060200'] as const);

  const glowColor = cookieType === 'dragon' ? '#8B1800'
    : cookieType === 'golden' ? '#D4A017'
    : '#C4813A';

  const totalCookies = profile.fortuneCookies + profile.goldenCookies + profile.dragonCookies;

  return (
    <View style={styles.container}>
      <LinearGradient colors={bgColors} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 60 : 8) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#D4A017" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>FORTUNE COOKIE</Text>
          <Text style={styles.headerSub}>
            {cookieType === 'dragon' ? '🥠 FOUR DRAGONS' : cookieType === 'golden' ? '🥠 GOLDEN FORTUNE' : 'CRACK OPEN YOUR FORTUNE'}
          </Text>
        </View>
        {/* Cookie count badge */}
        <View style={styles.countBadge}>
          <Text style={styles.countNum}>{totalCookies}</Text>
          <Text style={styles.countLbl}>🥠</Text>
        </View>
      </View>

      {/* ── Cookie arena ─────────────────────────────────────────────────────── */}
      <View style={styles.arena}>

        {/* Ambient glow */}
        <View style={[styles.glow, { backgroundColor: glowColor }]} />

        {/* Whole cookie (idle/shaking) */}
        {(phase === 'idle' || phase === 'shaking') && (
          <Animated.View style={{
            transform: [
              { translateX: shakeX },
              { scale: phase === 'idle' ? breatheScale : cookieScale },
            ],
          }}>
            <CookieSvg type={cookieType} />
          </Animated.View>
        )}

        {/* Cracked halves (cracked/rising/reveal) */}
        {(phase === 'cracked' || phase === 'rising' || phase === 'reveal') && (
          <>
            <Animated.View style={{
              position: 'absolute',
              transform: [{ translateX: leftX }, { rotate: leftRotDeg }],
            }}>
              <CookieSvg type={cookieType} viewBoxX={0} viewBoxW={60} width={90} height={120} />
            </Animated.View>
            <Animated.View style={{
              position: 'absolute',
              transform: [{ translateX: rightX }, { rotate: rightRotDeg }],
            }}>
              <CookieSvg type={cookieType} viewBoxX={60} viewBoxW={60} width={90} height={120} />
            </Animated.View>
          </>
        )}

        {/* Gold particles */}
        {particles.map((p, i) => (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              width: PARTICLE_SIZES[i],
              height: PARTICLE_SIZES[i],
              borderRadius: PARTICLE_SIZES[i] / 2,
              backgroundColor: pColors[i % pColors.length],
              opacity: p.op,
              transform: [{ translateX: p.x }, { translateY: p.y }],
            }}
          />
        ))}

        {/* Flash overlay */}
        <Animated.View
          style={[styles.flashOverlay, { opacity: flashOp }]}
          pointerEvents="none"
        />

        {/* Fortune slip (rising) */}
        {(phase === 'rising' || phase === 'reveal') && (
          <Animated.View style={[styles.slip, { opacity: slipOp, transform: [{ translateY: slipY }] }]}>
            <LinearGradient
              colors={['rgba(212,160,23,0.18)', 'rgba(212,160,23,0.06)']}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.slipHeader}>✦  LUCKY FORTUNE  ✦</Text>
            <Text style={styles.slipMsg}>{fortuneMsg}</Text>
          </Animated.View>
        )}
      </View>

      {/* ── Bottom area ───────────────────────────────────────────────────────── */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 24 }]}>

        {/* IDLE: Open button */}
        {phase === 'idle' && (
          <View style={styles.idleSection}>
            {/* Cookie type tabs — tap to select which cookie to open */}
            <View style={styles.cookieInventory}>
              {profile.fortuneCookies > 0 && (
                <TouchableOpacity
                  style={[styles.pill,
                    cookieType === 'standard' && styles.pillActive,
                    { borderColor: cookieType === 'standard' ? '#E8A458' : '#C4813A44' }]}
                  onPress={() => setCookieType('standard')}
                  activeOpacity={0.72}
                >
                  <Text style={[styles.pillNum, { color: '#E8A458' }]}>{profile.fortuneCookies}</Text>
                  <Text style={[styles.pillLbl, cookieType === 'standard' && { color: '#E8A458' }]}>Standard</Text>
                </TouchableOpacity>
              )}
              {profile.goldenCookies > 0 && (
                <TouchableOpacity
                  style={[styles.pill,
                    cookieType === 'golden' && styles.pillActive,
                    { borderColor: cookieType === 'golden' ? '#FFD700' : '#D4A01744' }]}
                  onPress={() => setCookieType('golden')}
                  activeOpacity={0.72}
                >
                  <Text style={[styles.pillNum, { color: '#FFD700' }]}>{profile.goldenCookies}</Text>
                  <Text style={[styles.pillLbl, cookieType === 'golden' && { color: '#FFD700' }]}>Golden</Text>
                </TouchableOpacity>
              )}
              {profile.dragonCookies > 0 && (
                <TouchableOpacity
                  style={[styles.pill,
                    cookieType === 'dragon' && styles.pillActive,
                    { borderColor: cookieType === 'dragon' ? '#FF6622' : '#8B180044' }]}
                  onPress={() => setCookieType('dragon')}
                  activeOpacity={0.72}
                >
                  <Text style={[styles.pillNum, { color: '#FF6622' }]}>{profile.dragonCookies}</Text>
                  <Text style={[styles.pillLbl, cookieType === 'dragon' && { color: '#FF6622' }]}>Dragon</Text>
                </TouchableOpacity>
              )}
            </View>

            {hasCookies ? (
              <TouchableOpacity style={styles.openBtn} onPress={handleOpen} activeOpacity={0.82}>
                <LinearGradient colors={['#F0B020', '#C4810A']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                <Text style={styles.openBtnText}>OPEN COOKIE</Text>
                <Ionicons name="chevron-forward" size={18} color="#050010" />
              </TouchableOpacity>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🥠</Text>
                <Text style={styles.emptyTitle}>No Cookies</Text>
                <Text style={styles.emptySub}>Spin the wheel or come back tomorrow for your free daily cookie.</Text>
              </View>
            )}

            <Text style={styles.hintText}>
              {cookieType === 'dragon'
                ? '🥠 Dragon Cookie: Epic or Legendary reward guaranteed'
                : cookieType === 'golden'
                ? '🥠 Golden Cookie: Rare reward or higher guaranteed'
                : 'Opening your best available cookie first'}
            </Text>
          </View>
        )}

        {/* REVEAL: Reward card */}
        {(phase === 'reveal') && reward && (
          <Animated.View style={[styles.rewardCard, { opacity: cardOp, transform: [{ translateY: cardY }] }]}>
            <LinearGradient
              colors={['rgba(212,160,23,0.14)', 'rgba(0,0,0,0.01)']}
              style={StyleSheet.absoluteFill}
            />
            {/* Tier badge */}
            <Animated.View style={[styles.tierBadge, { backgroundColor: TIER_COLOR[reward.tier], transform: [{ scale: rewardScale }] }]}>
              <Text style={styles.tierText}>{reward.tier}</Text>
            </Animated.View>

            {/* Reward display */}
            <Animated.View style={[styles.rewardRow, { transform: [{ scale: rewardScale }] }]}>
              <Text style={styles.rewardIcon}>{reward.icon}</Text>
              <Text style={[styles.rewardLabel, { color: reward.color }]}>{reward.label}</Text>
            </Animated.View>

            {reward.type === 'chips' && (
              <Text style={styles.rewardSub}>Added to your chip balance</Text>
            )}
            {reward.type === 'xp' && (
              <Text style={styles.rewardSub}>XP added to your profile</Text>
            )}
            {reward.type === 'token' && (
              <Text style={styles.rewardSub}>Special reward — check your profile</Text>
            )}

            {/* Stats footer */}
            <View style={styles.statsRow}>
              <Text style={styles.statLbl}>Cookies Opened</Text>
              <Text style={styles.statVal}>{profile.cookiesOpened}</Text>
            </View>

            <TouchableOpacity style={styles.collectBtn} onPress={() => router.back()} activeOpacity={0.82}>
              <LinearGradient colors={['#F0B020', '#C4810A']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
              <Text style={styles.collectText}>COLLECT</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* In-progress phases: show spinning indicator */}
        {(phase === 'shaking' || phase === 'cracked' || phase === 'rising') && (
          <View style={styles.openingMsg}>
            <Text style={styles.openingText}>Opening your fortune…</Text>
          </View>
        )}
      </View>
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
    color: '#D4A017', fontSize: 16, fontWeight: '900',
    fontFamily: 'Orbitron_900Black', letterSpacing: 2,
  },
  headerSub: {
    color: 'rgba(212,160,23,0.60)', fontSize: 10,
    fontFamily: 'Orbitron_400Regular', letterSpacing: 1, marginTop: 2,
  },
  countBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(212,160,23,0.12)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(212,160,23,0.30)',
    paddingHorizontal: 10, paddingVertical: 5,
  },
  countNum: { color: '#D4A017', fontSize: 14, fontWeight: '900', fontFamily: 'Inter_700Bold' },
  countLbl: { fontSize: 14 },

  arena: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    width: 260, height: 180, borderRadius: 130,
    opacity: 0.16,
  },
  flashOverlay: {
    position: 'absolute',
    width: 260, height: 180, borderRadius: 130,
    backgroundColor: '#FFFFFF',
  },
  slip: {
    position: 'absolute',
    bottom: -10,
    width: Math.min(W - 48, 300),
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(212,160,23,0.55)',
    backgroundColor: 'rgba(26,10,0,0.95)',
    padding: 16,
    alignItems: 'center',
    overflow: 'hidden',
    gap: 6,
  },
  slipHeader: {
    color: '#D4A017', fontSize: 9,
    fontFamily: 'Orbitron_400Regular', letterSpacing: 2.5,
  },
  slipMsg: {
    color: 'rgba(240,220,170,0.92)', fontSize: 15,
    fontFamily: 'Orbitron_400Regular', letterSpacing: 0.5,
    textAlign: 'center', lineHeight: 22, fontStyle: 'italic',
  },

  bottom: {
    paddingHorizontal: 20, paddingTop: 8,
  },

  idleSection: { gap: 14 },
  cookieInventory: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  pillActive: { backgroundColor: 'rgba(255,255,255,0.06)' },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  pillNum: { fontSize: 14, fontWeight: '900', fontFamily: 'Inter_700Bold' },
  pillLbl: { color: 'rgba(255,255,255,0.45)', fontSize: 10, fontFamily: 'Orbitron_400Regular', letterSpacing: 0.5 },

  openBtn: {
    height: 52, borderRadius: 14, overflow: 'hidden',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  openBtnText: {
    color: '#050010', fontSize: 15, fontWeight: '900',
    fontFamily: 'Orbitron_700Bold', letterSpacing: 2,
  },
  hintText: {
    color: 'rgba(212,160,23,0.45)', fontSize: 10,
    fontFamily: 'Orbitron_400Regular', letterSpacing: 0.5,
    textAlign: 'center',
  },

  emptyState: { alignItems: 'center', gap: 6, paddingVertical: 20 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { color: 'rgba(255,255,255,0.55)', fontSize: 14, fontWeight: '700', fontFamily: 'Orbitron_700Bold', letterSpacing: 1 },
  emptySub: { color: 'rgba(255,255,255,0.30)', fontSize: 11, textAlign: 'center', lineHeight: 16 },

  rewardCard: {
    borderRadius: 18, borderWidth: 1.5,
    borderColor: 'rgba(212,160,23,0.45)',
    backgroundColor: 'rgba(26,10,0,0.96)',
    padding: 20, gap: 12, overflow: 'hidden',
    alignItems: 'center',
  },
  tierBadge: {
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 4,
  },
  tierText: {
    color: '#050010', fontSize: 11, fontWeight: '900',
    fontFamily: 'Orbitron_900Black', letterSpacing: 2,
  },
  rewardRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rewardIcon: { fontSize: 32 },
  rewardLabel: { fontSize: 22, fontWeight: '900', fontFamily: 'Inter_700Bold' },
  rewardSub: {
    color: 'rgba(212,160,23,0.55)', fontSize: 10,
    fontFamily: 'Orbitron_400Regular', letterSpacing: 1,
  },
  statsRow: {
    flexDirection: 'row', justifyContent: 'space-between', width: '100%',
    borderTopWidth: 1, borderTopColor: 'rgba(212,160,23,0.15)', paddingTop: 10,
  },
  statLbl: { color: 'rgba(255,255,255,0.35)', fontSize: 11, fontFamily: 'Orbitron_400Regular', letterSpacing: 0.5 },
  statVal: { color: '#D4A017', fontSize: 12, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  collectBtn: {
    height: 48, width: '100%', borderRadius: 12, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  collectText: {
    color: '#050010', fontSize: 14, fontWeight: '900',
    fontFamily: 'Orbitron_700Bold', letterSpacing: 2,
  },

  openingMsg: { alignItems: 'center', paddingVertical: 16 },
  openingText: {
    color: 'rgba(212,160,23,0.55)', fontSize: 11,
    fontFamily: 'Orbitron_400Regular', letterSpacing: 1.5,
  },
});
