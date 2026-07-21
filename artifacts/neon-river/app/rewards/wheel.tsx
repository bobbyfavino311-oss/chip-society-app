import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useRef, useState, useCallback, useEffect } from 'react';
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
import Svg, { Path, Circle, G, Text as SvgText, Line } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/colors';
import { useUser } from '@/context/UserContext';
import { SoundEngine } from '@/lib/soundEngine';
import { formatChips } from '@/utils/chipColor';
import ChipIcon from '@/components/ChipIcon';
import ChipAmount from '@/components/ChipAmount';

// ─── Config ───────────────────────────────────────────────────────────────────

const { width: SCREEN_W } = Dimensions.get('window');
const WHEEL_SIZE = Math.min(SCREEN_W - 32, 320);
const CX = 150, CY = 150;
const R_OUTER = 136, R_INNER = 42, R_TEXT = 96, R_ICON = 118;

// ─── Segments ─────────────────────────────────────────────────────────────────
// arc  = visual slice angle (degrees). All arcs must sum to 360.
// prob = actual win probability weight (independent of arc).
//        pickWinner() normalises these — do not need to sum to 1.
//
// Rarity colors:
//   COMMON   → blue   #00d4ff
//   UNCOMMON → green  #00cc66
//   RARE     → gold   #D4A017
//   EPIC     → gold+white bright
//   MYTHIC   → purple+cyan #bf5fff / #00d4ff

const SEGMENTS = [
  { label: '2.5K XP', rarity: 'COMMON',   arc: 30, prob: 0.170, chips: 0,          xp: 2_500,  ticket: 0, cookie: 0, mythicCookie: 0, col: '#00d4ff', dim: '#001022', icon: '⚡' },
  { label: '10K',     rarity: 'COMMON',   arc: 30, prob: 0.160, chips: 10_000,      xp: 0,      ticket: 0, cookie: 0, mythicCookie: 0, col: '#00d4ff', dim: '#001a26', icon: '💰' },
  { label: '5K XP',   rarity: 'COMMON',   arc: 30, prob: 0.155, chips: 0,          xp: 5_000,  ticket: 0, cookie: 0, mythicCookie: 0, col: '#00d4ff', dim: '#001022', icon: '⚡' },
  { label: 'COOKIE',  rarity: 'RARE',     arc: 30, prob: 0.040, chips: 0,          xp: 0,      ticket: 0, cookie: 1, mythicCookie: 0, col: '#D4A017', dim: '#1a0e00', icon: '🥠' },
  { label: '50K',     rarity: 'COMMON',   arc: 30, prob: 0.145, chips: 50_000,      xp: 0,      ticket: 0, cookie: 0, mythicCookie: 0, col: '#00d4ff', dim: '#001530', icon: '💰' },
  { label: '10K XP',  rarity: 'COMMON',   arc: 30, prob: 0.110, chips: 0,          xp: 10_000, ticket: 0, cookie: 0, mythicCookie: 0, col: '#00d4ff', dim: '#001022', icon: '💎' },
  { label: '25K XP',  rarity: 'COMMON',   arc: 30, prob: 0.100, chips: 0,          xp: 25_000, ticket: 0, cookie: 0, mythicCookie: 0, col: '#00cc66', dim: '#001a0e', icon: '⚡' },
  { label: '100K',    rarity: 'COMMON',   arc: 30, prob: 0.090, chips: 100_000,     xp: 0,      ticket: 0, cookie: 0, mythicCookie: 0, col: '#00cc66', dim: '#001810', icon: '💰' },
  { label: '50K XP',  rarity: 'UNCOMMON', arc: 30, prob: 0.060, chips: 0,          xp: 50_000, ticket: 0, cookie: 0, mythicCookie: 0, col: '#00cc66', dim: '#001208', icon: '⚡' },
  { label: '250K',    rarity: 'UNCOMMON', arc: 30, prob: 0.050, chips: 250_000,     xp: 0,      ticket: 0, cookie: 0, mythicCookie: 0, col: '#D4A017', dim: '#1a0e00', icon: '💰' },
  { label: 'MYTHIC',  rarity: 'MYTHIC',   arc: 30, prob: 0.005, chips: 0,          xp: 0,      ticket: 0, cookie: 0, mythicCookie: 1, col: '#bf5fff', dim: '#1a0038', icon: '🥠' },
  { label: '1M',      rarity: 'EPIC',     arc: 30, prob: 0.005, chips: 1_000_000,   xp: 0,      ticket: 0, cookie: 0, mythicCookie: 0, col: '#ffd700', dim: '#2a1a00', icon: '💰' },
] as const;

type Seg = (typeof SEGMENTS)[number];
const N = SEGMENTS.length;

// Precompute cumulative start angles
const START_ANGLES: number[] = [];
let _cum = 0;
for (const seg of SEGMENTS) { START_ANGLES.push(_cum); _cum += seg.arc; }

// ─── Winner selection — weighted by prob, independent of arc ──────────────────

function pickWinner(): number {
  const total = SEGMENTS.reduce((s, sg) => s + sg.prob, 0);
  const r = Math.random() * total;
  let cum = 0;
  for (let i = 0; i < N; i++) {
    cum += SEGMENTS[i].prob;
    if (r <= cum) return i;
  }
  return 0;
}

// ─── Geometry ─────────────────────────────────────────────────────────────────

function toRad(deg: number) { return (deg * Math.PI) / 180; }

function slicePath(startDeg: number, endDeg: number): string {
  const s    = -90 + startDeg;
  const e    = -90 + endDeg;
  const large = endDeg - startDeg > 180 ? 1 : 0;
  const x1 = CX + R_OUTER * Math.cos(toRad(s));
  const y1 = CY + R_OUTER * Math.sin(toRad(s));
  const x2 = CX + R_OUTER * Math.cos(toRad(e));
  const y2 = CY + R_OUTER * Math.sin(toRad(e));
  const x3 = CX + R_INNER * Math.cos(toRad(e));
  const y3 = CY + R_INNER * Math.sin(toRad(e));
  const x4 = CX + R_INNER * Math.cos(toRad(s));
  const y4 = CY + R_INNER * Math.sin(toRad(s));
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R_OUTER} ${R_OUTER} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} L ${x3.toFixed(2)} ${y3.toFixed(2)} A ${R_INNER} ${R_INNER} 0 ${large} 0 ${x4.toFixed(2)} ${y4.toFixed(2)} Z`;
}

function midPos(startDeg: number, arc: number) {
  const mid = -90 + startDeg + arc / 2;
  return {
    x:   CX + R_TEXT * Math.cos(toRad(mid)),
    y:   CY + R_TEXT * Math.sin(toRad(mid)),
    xi:  CX + R_ICON * Math.cos(toRad(mid)),
    yi:  CY + R_ICON * Math.sin(toRad(mid)),
    rot: mid + 90,
  };
}

// ─── Landing sounds ───────────────────────────────────────────────────────────

function playLandSound(seg: Seg) {
  switch (seg.rarity) {
    case 'COMMON':   SoundEngine.chipCollect(); break;
    case 'UNCOMMON': SoundEngine.prizeCollect(); break;
    case 'RARE':
      SoundEngine.cookieCrack('common');
      setTimeout(() => SoundEngine.fortuneRise(), 400);
      break;
    case 'EPIC':
      SoundEngine.win();
      break;
    case 'MYTHIC':
      SoundEngine.cookieCrack('mythic');
      setTimeout(() => SoundEngine.achievementUnlock(), 700);
      break;
  }
}

// ─── Confetti ─────────────────────────────────────────────────────────────────

interface Particle {
  x: number; y: number; vx: number; vy: number;
  color: string; rot: number;
  scale: Animated.Value; opacity: Animated.Value; ty: Animated.Value;
}

function useConfetti(active: boolean, big = false) {
  const particles = useRef<Particle[]>([]);
  const [, tick] = useState(0);
  useEffect(() => {
    if (!active) { particles.current = []; return; }
    const count = big ? 44 : 22;
    const cols  = big
      ? ['#ffd700', '#bf5fff', '#00d4ff', '#ff0090', '#fff', '#ffaa00', '#00cc66']
      : ['#ffd700', '#00d4ff', '#00cc66', '#bf5fff', '#ff0090'];
    particles.current = Array.from({ length: count }, (_, i) => ({
      x: SCREEN_W * 0.1 + Math.random() * SCREEN_W * 0.8,
      y: 200,
      vx: (Math.random() - 0.5) * 220,
      vy: -140 - Math.random() * 110,
      color: cols[i % cols.length],
      rot: Math.random() * 360,
      scale:   new Animated.Value(1),
      opacity: new Animated.Value(1),
      ty:      new Animated.Value(0),
    }));
    particles.current.forEach(p => {
      Animated.parallel([
        Animated.timing(p.opacity, { toValue: 0, duration: big ? 2400 : 1700, useNativeDriver: false }),
        Animated.timing(p.ty, { toValue: 200 + Math.random() * 130, duration: big ? 2400 : 1700, easing: Easing.out(Easing.quad), useNativeDriver: false }),
        Animated.timing(p.scale,   { toValue: 0.2, duration: big ? 2400 : 1700, useNativeDriver: false }),
      ]).start();
    });
    tick(v => v + 1);
  }, [active, big]);
  return particles.current;
}

// ─── Countdown ────────────────────────────────────────────────────────────────

function Countdown({ seconds }: { seconds: number }) {
  const [s, setS] = useState(seconds);
  useEffect(() => { setS(seconds); }, [seconds]);
  useEffect(() => {
    const t = setInterval(() => setS(prev => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return (
    <Text style={ct.text}>
      Next spin in{' '}
      <Text style={ct.value}>{h > 0 ? `${h}h ` : ''}{m}m {String(sec).padStart(2, '0')}s</Text>
    </Text>
  );
}
const ct = StyleSheet.create({
  text:  { color: colors.textMuted, fontSize: 11, marginTop: 2, textAlign: 'center' },
  value: { color: colors.primary, fontWeight: '700' },
});

// ─── Rarity metadata ──────────────────────────────────────────────────────────

const RARITY_COLOR: Record<string, string> = {
  COMMON:   '#00d4ff',
  UNCOMMON: '#00cc66',
  RARE:     '#D4A017',
  EPIC:     '#ffd700',
  MYTHIC:   '#bf5fff',
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function WheelScreen() {
  const insets = useSafeAreaInsets();
  const { canClaimWheel, nextWheelIn, claimWheelSpin, addFortuneCookies, profile, updateProfile } = useUser();

  const rotAnim       = useRef(new Animated.Value(0)).current;
  const totalRot      = useRef(0);
  const [spinning,    setSpinning]   = useState(false);
  const [winner,      setWinner]     = useState<number | null>(null);
  const [showResult,  setShowResult] = useState(false);
  const [claimed,     setClaimed]    = useState(false);
  const resultScale   = useRef(new Animated.Value(0)).current;
  const glowAnim      = useRef(new Animated.Value(0.4)).current;
  const pointerBounce = useRef(new Animated.Value(1)).current;
  const bgPulse       = useRef(new Animated.Value(0)).current;
  const mythicOverlay = useRef(new Animated.Value(0)).current;
  const mythicCookieY = useRef(new Animated.Value(60)).current;
  const mythicCookieS = useRef(new Animated.Value(0.4)).current;
  const spotlightAnim = useRef(new Animated.Value(0)).current; // 0=normal 1=spotlight

  const isMythic  = winner !== null && SEGMENTS[winner].rarity === 'MYTHIC';
  const isBigWin  = winner !== null && (SEGMENTS[winner].chips >= 50_000 || isMythic);
  const confetti  = useConfetti(isBigWin && showResult, isMythic);

  const rotation = rotAnim.interpolate({
    inputRange: [0, 360], outputRange: ['0deg', '360deg'], extrapolate: 'extend',
  });
  const spotlightDim = spotlightAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.28] });

  const tickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopTick  = () => { if (tickTimer.current) { clearTimeout(tickTimer.current); tickTimer.current = null; } };
  useEffect(() => () => stopTick(), []);

  const spin = useCallback(() => {
    if (!canClaimWheel || spinning) return;
    const w = pickWinner();
    setWinner(w);
    setShowResult(false);
    setClaimed(false);
    setSpinning(true);
    spotlightAnim.setValue(0);
    mythicOverlay.setValue(0);
    mythicCookieY.setValue(60);
    mythicCookieS.setValue(0.4);
    SoundEngine.button();

    // Cascading tick rhythm: fast → light → heavy thuds
    let interval = 52;
    let elapsed  = 0;
    stopTick();
    const fireTick = () => {
      SoundEngine.chip();
      elapsed += interval;
      if (elapsed < 1200)       interval = Math.max(50, interval - 1);
      else if (elapsed > 3000)  interval = Math.min(420, interval + 18);
      if (elapsed < 5200) { tickTimer.current = setTimeout(fireTick, interval); }
    };
    tickTimer.current = setTimeout(fireTick, interval);

    // Background pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgPulse, { toValue: 1, duration: 650, useNativeDriver: false }),
        Animated.timing(bgPulse, { toValue: 0, duration: 650, useNativeDriver: false }),
      ]),
      { iterations: 6 },
    ).start();

    // Precise landing — bring segment center to pointer
    const centerAngle = START_ANGLES[w] + SEGMENTS[w].arc / 2;
    const alignAngle  = ((360 - centerAngle % 360) + 360) % 360;
    const spins  = 5 + Math.floor(Math.random() * 3);
    const target = totalRot.current + spins * 360 + alignAngle - (totalRot.current % 360);
    totalRot.current = target;

    Animated.timing(rotAnim, {
      toValue:  target,
      duration: 4500 + Math.random() * 1200,
      easing:   Easing.out(Easing.bezier(0.16, 0.68, 0.28, 1.0)),
      useNativeDriver: false,
    }).start(() => {
      stopTick();
      setSpinning(false);

      // Pointer bounce
      Animated.sequence([
        Animated.timing(pointerBounce, { toValue: 2.1, duration: 70,  useNativeDriver: false }),
        Animated.timing(pointerBounce, { toValue: 0.5, duration: 65,  useNativeDriver: false }),
        Animated.timing(pointerBounce, { toValue: 1.6, duration: 55,  useNativeDriver: false }),
        Animated.timing(pointerBounce, { toValue: 0.8, duration: 45,  useNativeDriver: false }),
        Animated.timing(pointerBounce, { toValue: 1.0, duration: 40,  useNativeDriver: false }),
      ]).start();

      // Spotlight: dim all non-winning slices
      Animated.timing(spotlightAnim, { toValue: 1, duration: 350, useNativeDriver: false }).start();

      // Play landing sound
      playLandSound(SEGMENTS[w]);

      // Mythic reveal
      if (SEGMENTS[w].rarity === 'MYTHIC') {
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(mythicOverlay, { toValue: 0.82, duration: 600, useNativeDriver: false }),
            Animated.spring(mythicCookieY, { toValue: 0, tension: 50, friction: 9, useNativeDriver: false }),
            Animated.spring(mythicCookieS, { toValue: 1,   tension: 50, friction: 8, useNativeDriver: false }),
          ]).start();
        }, 280);
      }

      // Result card spring in
      setShowResult(true);
      resultScale.setValue(0);
      Animated.spring(resultScale, { toValue: 1, tension: 72, friction: 7, useNativeDriver: false }).start();

      // Glow pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1,   duration: 400, useNativeDriver: false }),
          Animated.timing(glowAnim, { toValue: 0.25, duration: 400, useNativeDriver: false }),
        ]),
        { iterations: 12 },
      ).start();
    });
  }, [canClaimWheel, spinning, rotAnim, resultScale, glowAnim, pointerBounce, bgPulse, spotlightAnim, mythicOverlay, mythicCookieY, mythicCookieS]);

  const handleClaim = useCallback(async () => {
    if (winner === null || claimed) return;
    setClaimed(true);
    const seg = SEGMENTS[winner];
    await claimWheelSpin(seg.chips, seg.ticket);
    if (seg.xp > 0)            await updateProfile({ xp: profile.xp + seg.xp });
    if (seg.cookie > 0)        await addFortuneCookies(seg.cookie, 0, 0, 0, 0, 'daily_wheel');
    if (seg.mythicCookie > 0)  await addFortuneCookies(0, 0, 0, 0, seg.mythicCookie, 'daily_wheel_mythic');
    SoundEngine.prizeCollect();
  }, [winner, claimed, claimWheelSpin, updateProfile, profile.xp, addFortuneCookies]);

  const seg     = winner !== null ? SEGMENTS[winner] : null;
  const bgColor = bgPulse.interpolate({ inputRange: [0, 1], outputRange: ['#050010', '#0c0022'] });

  const RARITY_ROWS = [
    { tier: 'COMMON',   items: SEGMENTS.filter(s => s.rarity === 'COMMON') },
    { tier: 'UNCOMMON', items: SEGMENTS.filter(s => s.rarity === 'UNCOMMON') },
    { tier: 'RARE',     items: SEGMENTS.filter(s => s.rarity === 'RARE') },
    { tier: 'EPIC',     items: SEGMENTS.filter(s => s.rarity === 'EPIC') },
    { tier: 'MYTHIC',   items: SEGMENTS.filter(s => s.rarity === 'MYTHIC') },
  ] as const;

  return (
    <Animated.View style={[s.container, { backgroundColor: bgColor }]}>
      <LinearGradient colors={['#0d001f', '#050010', '#050010']} style={StyleSheet.absoluteFill} />
      <View style={s.glow1} /><View style={s.glow2} />

      {/* Mythic dark overlay — separate from wheel */}
      {isMythic && (
        <Animated.View style={[s.mythicDark, { opacity: mythicOverlay }]} pointerEvents="none" />
      )}

      <ScrollView
        style={{ flex: 1, width: '100%' }}
        contentContainerStyle={{ alignItems: 'center', paddingBottom: insets.bottom + 28 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[s.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 20 : 16) }]}>
          <TouchableOpacity onPress={() => router.back()} style={s.closeBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={20} color={colors.textMuted} />
          </TouchableOpacity>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={s.title}>DAILY SPIN</Text>
            {!canClaimWheel
              ? <Countdown seconds={nextWheelIn * 60} />
              : <Text style={s.readyText}>✨ Free spin ready!</Text>}
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Balance */}
        <View style={s.balanceRow}>
          <ChipIcon variant="gold" size={16} />
          <Text style={s.balanceText}>{formatChips(profile.chips)} chips</Text>
        </View>

        {/* Pointer */}
        <View style={s.pointerWrap}>
          <Animated.View style={{ transform: [{ scaleY: pointerBounce }] }}>
            <View style={s.pointer} />
            <View style={s.pointerShadow} />
          </Animated.View>
        </View>

        {/* ── Wheel ── */}
        <Animated.View style={[s.wheelAnim, { transform: [{ rotate: rotation }] }]}>
          <Svg width={WHEEL_SIZE} height={WHEEL_SIZE} viewBox="0 0 300 300">

            {/* Base */}
            <Circle cx={CX} cy={CY} r={R_OUTER + 10} fill="#050010" />

            {/* Segments */}
            {SEGMENTS.map((sg, i) => {
              const start = START_ANGLES[i];
              const end   = start + sg.arc;
              const p     = midPos(start, sg.arc);
              const isW   = winner === i && showResult;
              const isMy  = sg.rarity === 'MYTHIC';

              // Spotlight dimming — all non-winners dim when spotlight active
              const fillOpacity   = isW ? 1 : 0.9;
              const strokeOpacity = isW ? 1 : 0.55;

              return (
                <G key={i}>
                  {/* Spotlight dim layer for non-winners */}
                  {showResult && !isW && (
                    <Path
                      d={slicePath(start, end)}
                      fill="#050010"
                      fillOpacity={0.55}
                    />
                  )}

                  <Path
                    d={slicePath(start, end)}
                    fill={isW ? sg.col + '55' : isMy ? '#2a0055' : sg.dim}
                    stroke={isMy ? '#bf5fff' : sg.col}
                    strokeWidth={isMy ? 2.2 : isW ? 2.0 : 0.6}
                    strokeOpacity={isMy ? 1 : strokeOpacity}
                    opacity={fillOpacity}
                  />

                  {/* Divider */}
                  <Line
                    x1={CX} y1={CY}
                    x2={(CX + R_OUTER * Math.cos(toRad(-90 + start))).toFixed(2)}
                    y2={(CY + R_OUTER * Math.sin(toRad(-90 + start))).toFixed(2)}
                    stroke="rgba(255,255,255,0.07)" strokeWidth={0.5}
                  />

                  {/* Icon — skip for arc < 8 */}
                  {sg.arc >= 8 && (
                    <SvgText
                      x={p.xi.toFixed(2)} y={(p.yi + 5).toFixed(2)}
                      textAnchor="middle"
                      fontSize={sg.arc >= 30 ? 13 : sg.arc >= 17 ? 11 : 9}
                      transform={`rotate(${p.rot.toFixed(1)}, ${p.xi.toFixed(2)}, ${p.yi.toFixed(2)})`}
                    >{sg.icon}</SvgText>
                  )}

                  {/* Label — skip for arc < 8 */}
                  {sg.arc >= 8 && (
                    <SvgText
                      x={p.x.toFixed(2)} y={(p.y + 4).toFixed(2)}
                      textAnchor="middle"
                      fill={isW ? '#fff' : isMy ? '#00d4ff' : sg.col}
                      fillOpacity={isW ? 1 : 0.9}
                      fontSize={sg.arc >= 36 ? 11 : sg.arc >= 17 ? 9 : 7}
                      fontWeight="bold"
                      transform={`rotate(${p.rot.toFixed(1)}, ${p.x.toFixed(2)}, ${p.y.toFixed(2)})`}
                    >{sg.label}</SvgText>
                  )}
                </G>
              );
            })}

            {/* Outer border */}
            <Circle cx={CX} cy={CY} r={R_OUTER + 1} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth={1.5} />

            {/* ── Center hub ── */}
            <Circle cx={CX} cy={CY} r={R_INNER + 2} fill="#050010" stroke="rgba(255,255,255,0.18)" strokeWidth={1.5} />
            {/* ♠ spade */}
            <SvgText x={CX} y={CY + 8} textAnchor="middle" fill="#ffffff" fontSize={22} fontWeight="bold">♠</SvgText>

          </Svg>
        </Animated.View>

        {/* Mythic cookie rise — floats up when mythic wins */}
        {isMythic && showResult && (
          <Animated.View
            style={[s.mythicCookieFloat, {
              opacity: mythicOverlay,
              transform: [{ translateY: mythicCookieY }, { scale: mythicCookieS }],
            }]}
            pointerEvents="none"
          >
            <Text style={s.mythicCookieEmoji}>🥠</Text>
            <Text style={s.mythicCookieLabel}>MYTHIC</Text>
          </Animated.View>
        )}

        {/* ── Result card ── */}
        {showResult && seg && (
          <Animated.View style={[
            s.resultCard,
            isMythic && s.resultCardMythic,
            { borderColor: seg.col + '90', transform: [{ scale: resultScale }] },
          ]}>
            {isMythic
              ? <LinearGradient colors={['#3d006088', '#1a003060', '#0a001835']} style={StyleSheet.absoluteFill} />
              : <LinearGradient colors={[`${seg.col}30`, `${seg.col}06`]} style={StyleSheet.absoluteFill} />
            }
            <Animated.View style={[s.resultGlow, { opacity: glowAnim, shadowColor: seg.col }]} />

            <View style={[s.rarityBadge, { borderColor: seg.col + '60', backgroundColor: seg.col + '18' }]}>
              <Text style={[s.rarityBadgeText, { color: seg.col }]}>{seg.rarity}</Text>
            </View>

            <Text style={s.resultIcon}>{seg.icon}</Text>

            {seg.chips > 0 ? (
              <ChipAmount amount={seg.chips} variant={seg.rarity === 'EPIC' ? 'gold' : 'green'} prefix="+" size="lg" />
            ) : seg.ticket ? (
              <Text style={[s.resultAmount, { color: seg.col }]}>+1 SCRATCH TICKET</Text>
            ) : seg.xp > 0 ? (
              <Text style={[s.resultAmount, { color: seg.col }]}>+{seg.xp >= 1000 ? `${(seg.xp / 1000).toFixed(0)}K` : seg.xp} XP</Text>
            ) : seg.mythicCookie ? (
              <Text style={[s.resultAmount, s.mythicCookieText]}>MYTHIC FORTUNE{'\n'}COOKIE</Text>
            ) : (
              <Text style={[s.resultAmount, { color: seg.col }]}>FORTUNE COOKIE</Text>
            )}

            {!claimed ? (
              <TouchableOpacity style={[s.claimBtn, { borderColor: seg.col }]} onPress={handleClaim} activeOpacity={0.8}>
                <LinearGradient colors={[`${seg.col}50`, `${seg.col}1a`]} style={StyleSheet.absoluteFill} />
                <Ionicons name="checkmark-circle" size={16} color={seg.col} />
                <Text style={[s.claimBtnText, { color: seg.col }]}>CLAIM REWARD</Text>
              </TouchableOpacity>
            ) : (
              <View style={s.claimedRow}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={s.claimedText}>
                  {seg?.xp ? '⚡ KEEP LEVELING UP!' : 'Added to your balance!'}
                </Text>
              </View>
            )}
          </Animated.View>
        )}

        {/* Confetti */}
        {confetti.map((p, i) => (
          <Animated.View
            key={i}
            pointerEvents="none"
            style={{
              position: 'absolute', left: p.x, top: p.y,
              width: isMythic ? 10 : 8, height: isMythic ? 10 : 8,
              borderRadius: 2, backgroundColor: p.color,
              opacity: p.opacity,
              transform: [
                { translateX: p.vx * 0.01 }, { translateY: p.ty },
                { scale: p.scale }, { rotate: `${p.rot}deg` },
              ],
            }}
          />
        ))}

        {/* Spin button */}
        <TouchableOpacity
          style={[s.spinBtn, (!canClaimWheel || spinning) && s.spinBtnDis]}
          onPress={spin}
          disabled={!canClaimWheel || spinning}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={spinning
              ? ['#1a1a2e', '#0d0d1a']
              : canClaimWheel ? ['#5500bb', '#bf5fff'] : ['#1a1a2e', '#0d0d1a']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          />
          <Ionicons name={spinning ? 'time-outline' : 'refresh'} size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={s.spinBtnText}>
            {spinning ? 'SPINNING…' : canClaimWheel ? 'SPIN THE WHEEL' : 'COME BACK LATER'}
          </Text>
        </TouchableOpacity>

        {/* ── Rarity reward legend ── */}
        <View style={s.legendWrap}>
          <Text style={s.legendTitle}>POSSIBLE REWARDS</Text>
          {RARITY_ROWS.map(({ tier, items }) => (
            <View key={tier} style={s.rarityRow}>
              <View style={[s.rarityRowHeader, { borderColor: RARITY_COLOR[tier] + '45' }]}>
                <View style={[s.rarityDot, { backgroundColor: RARITY_COLOR[tier] }]} />
                <Text style={[s.rarityRowLabel, { color: RARITY_COLOR[tier] }]}>{tier}</Text>
              </View>
              <View style={s.rarityItems}>
                {items.map(item => (
                  <View key={item.label} style={[s.legendItem, { borderColor: item.col + '35', backgroundColor: item.col + '12' }]}>
                    <Text style={{ fontSize: 12 }}>{item.icon}</Text>
                    <Text style={[s.legendText, { color: item.col }]}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
          <Text style={s.mythicHint}>
            🥠 Mythic Fortune Cookie — rarest prize on the wheel
          </Text>
        </View>

      </ScrollView>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050010' },
  glow1: { position: 'absolute', top: -60, left: -80, width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(191,95,255,0.08)' },
  glow2: { position: 'absolute', bottom: 60, right: -80, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(0,212,255,0.05)' },

  mythicDark: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#08001a', zIndex: 5 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 16, paddingBottom: 6 },
  closeBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: colors.border },
  title:     { color: '#fff', fontSize: 17, fontFamily: 'Orbitron_900Black', letterSpacing: 2 },
  readyText: { color: colors.success, fontSize: 10, marginTop: 2 },

  balanceRow:  { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  balanceText: { color: '#ffd700', fontSize: 13, fontWeight: '700' },

  pointerWrap: { alignItems: 'center', marginBottom: -10, zIndex: 10 },
  pointer: {
    width: 0, height: 0,
    borderLeftWidth: 11, borderRightWidth: 11, borderTopWidth: 22,
    borderStyle: 'solid',
    borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#ffffff',
  },
  pointerShadow: {
    width: 0, height: 0,
    borderLeftWidth: 7, borderRightWidth: 7, borderTopWidth: 14,
    borderStyle: 'solid',
    borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: 'rgba(191,95,255,0.6)',
    alignSelf: 'center', marginTop: -7,
  },

  wheelAnim: { width: WHEEL_SIZE, height: WHEEL_SIZE, backgroundColor: 'transparent' },

  mythicCookieFloat: {
    position: 'absolute', alignItems: 'center', justifyContent: 'center',
    top: '28%', alignSelf: 'center', zIndex: 20,
  },
  mythicCookieEmoji: { fontSize: 64, textAlign: 'center' },
  mythicCookieLabel: {
    color: '#bf5fff', fontSize: 14, fontFamily: 'Orbitron_700Bold',
    letterSpacing: 4, marginTop: 6, textAlign: 'center',
  },

  resultCard: {
    width: '88%', borderRadius: 20, borderWidth: 1.5,
    padding: 20, alignItems: 'center', gap: 10,
    overflow: 'hidden', marginTop: 10, marginBottom: 6, position: 'relative',
  },
  resultCardMythic: {
    borderWidth: 2, borderRadius: 24,
    shadowColor: '#bf5fff', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.85, shadowRadius: 28,
  },
  resultGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 20,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 24,
  },
  rarityBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  rarityBadgeText: { fontSize: 9, fontFamily: 'Orbitron_700Bold', letterSpacing: 2 },
  resultIcon:    { fontSize: 46 },
  resultAmount:  { fontSize: 20, fontWeight: '900', fontFamily: 'Inter_700Bold', letterSpacing: 1, color: '#fff', textAlign: 'center' },
  mythicCookieText: { color: '#bf5fff', fontSize: 18, letterSpacing: 2, lineHeight: 28 },
  claimBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderRadius: 24, overflow: 'hidden',
    paddingHorizontal: 28, paddingVertical: 13, marginTop: 4,
  },
  claimBtnText: { fontSize: 13, fontFamily: 'Orbitron_700Bold', letterSpacing: 1 },
  claimedRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  claimedText: { color: colors.success, fontSize: 12, fontWeight: '600' },

  spinBtn: {
    width: '88%', height: 56, borderRadius: 16, overflow: 'hidden',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 6, marginBottom: 20,
  },
  spinBtnDis:  { opacity: 0.45 },
  spinBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Orbitron_700Bold', letterSpacing: 1 },

  legendWrap: { width: '88%', gap: 10, marginBottom: 8 },
  legendTitle: { color: 'rgba(255,255,255,0.38)', fontSize: 10, fontFamily: 'Orbitron_700Bold', letterSpacing: 3, textAlign: 'center', marginBottom: 4 },
  rarityRow:       { gap: 6 },
  rarityRowHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingBottom: 4, borderBottomWidth: 1 },
  rarityDot:       { width: 6, height: 6, borderRadius: 3 },
  rarityRowLabel:  { fontSize: 9, fontFamily: 'Orbitron_700Bold', letterSpacing: 2 },
  rarityItems:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  legendItem:      { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  legendText:      { fontSize: 11, fontWeight: '700' },
  mythicHint:      { fontSize: 10, color: 'rgba(191,95,255,0.55)', textAlign: 'center', marginTop: 6, letterSpacing: 0.5, fontStyle: 'italic' },

});
