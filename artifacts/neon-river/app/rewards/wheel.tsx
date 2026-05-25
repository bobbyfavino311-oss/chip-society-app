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

// ─── Config ───────────────────────────────────────────────────────────────────

const { width: SCREEN_W } = Dimensions.get('window');
const WHEEL_SIZE = Math.min(SCREEN_W - 32, 320);
const CX = 150, CY = 150, R = WHEEL_SIZE / 2;
const R_OUTER = 136, R_INNER = 38, R_TEXT = 98, R_ICON = 116;

const SEGMENTS = [
  { label: '2K',    emoji: '💰', chips: 2_000,   xp: 0,   ticket: 0, prob: 0.22, col: '#00d4ff', dim: '#001830' },
  { label: '5K',    emoji: '🎰', chips: 5_000,   xp: 0,   ticket: 0, prob: 0.16, col: '#bf5fff', dim: '#150030' },
  { label: '2K',    emoji: '💰', chips: 2_000,   xp: 0,   ticket: 0, prob: 0.15, col: '#00d4ff', dim: '#001830' },
  { label: '10K',   emoji: '💎', chips: 10_000,  xp: 0,   ticket: 0, prob: 0.12, col: '#ff0090', dim: '#200016' },
  { label: '5K',    emoji: '🎰', chips: 5_000,   xp: 0,   ticket: 0, prob: 0.10, col: '#bf5fff', dim: '#150030' },
  { label: '+XP',   emoji: '⚡', chips: 0,       xp: 500, ticket: 0, prob: 0.08, col: '#00ff88', dim: '#001f14' },
  { label: '25K',   emoji: '⭐', chips: 25_000,  xp: 0,   ticket: 0, prob: 0.07, col: '#ffd700', dim: '#1e1600' },
  { label: '10K',   emoji: '💎', chips: 10_000,  xp: 0,   ticket: 0, prob: 0.04, col: '#ff0090', dim: '#200016' },
  { label: 'TICKET',emoji: '🎟', chips: 0,       xp: 0,   ticket: 1, prob: 0.03, col: '#00ccaa', dim: '#001a16' },
  { label: '50K',   emoji: '🔥', chips: 50_000,  xp: 0,   ticket: 0, prob: 0.02, col: '#ff6600', dim: '#1e0c00' },
  { label: '2K',    emoji: '💰', chips: 2_000,   xp: 0,   ticket: 0, prob: 0.009,col: '#00d4ff', dim: '#001830' },
  { label: '100K!', emoji: '👑', chips: 100_000, xp: 0,   ticket: 0, prob: 0.001,col: '#ffd700', dim: '#1e1600' },
];

const N   = SEGMENTS.length;
const ARC = 360 / N;

function pickWinner(): number {
  const r = Math.random();
  let cum = 0;
  for (let i = 0; i < N; i++) {
    cum += SEGMENTS[i].prob;
    if (r <= cum) return i;
  }
  return 0;
}

function toRad(deg: number) { return (deg * Math.PI) / 180; }

function slicePath(i: number): string {
  const start = -90 + i * ARC;
  const end   = -90 + (i + 1) * ARC;
  const x1 = CX + R_OUTER * Math.cos(toRad(start));
  const y1 = CY + R_OUTER * Math.sin(toRad(start));
  const x2 = CX + R_OUTER * Math.cos(toRad(end));
  const y2 = CY + R_OUTER * Math.sin(toRad(end));
  const x3 = CX + R_INNER * Math.cos(toRad(end));
  const y3 = CY + R_INNER * Math.sin(toRad(end));
  const x4 = CX + R_INNER * Math.cos(toRad(start));
  const y4 = CY + R_INNER * Math.sin(toRad(start));
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R_OUTER} ${R_OUTER} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)} L ${x3.toFixed(2)} ${y3.toFixed(2)} A ${R_INNER} ${R_INNER} 0 0 0 ${x4.toFixed(2)} ${y4.toFixed(2)} Z`;
}

function textPos(i: number) {
  const mid = -90 + (i + 0.5) * ARC;
  return {
    x: CX + R_TEXT  * Math.cos(toRad(mid)),
    y: CY + R_TEXT  * Math.sin(toRad(mid)),
    xi: CX + R_ICON * Math.cos(toRad(mid)),
    yi: CY + R_ICON * Math.sin(toRad(mid)),
    rot: mid + 90,
  };
}

// ─── Confetti particle ────────────────────────────────────────────────────────

interface Particle { x: number; y: number; vx: number; vy: number; color: string; rot: number; scale: Animated.Value; opacity: Animated.Value; ty: Animated.Value }

function useConfetti(active: boolean) {
  const particles = useRef<Particle[]>([]);
  const [, tick] = useState(0);

  useEffect(() => {
    if (!active) { particles.current = []; return; }
    const cols = ['#ffd700', '#00d4ff', '#ff0090', '#bf5fff', '#00ff88', '#ff6600'];
    particles.current = Array.from({ length: 24 }, (_, i) => ({
      x: SCREEN_W * 0.3 + Math.random() * SCREEN_W * 0.4,
      y: 180,
      vx: (Math.random() - 0.5) * 160,
      vy: -120 - Math.random() * 80,
      color: cols[i % cols.length],
      rot: Math.random() * 360,
      scale: new Animated.Value(1),
      opacity: new Animated.Value(1),
      ty: new Animated.Value(0),
    }));
    particles.current.forEach(p => {
      Animated.parallel([
        Animated.timing(p.opacity, { toValue: 0, duration: 1600, useNativeDriver: false }),
        Animated.timing(p.ty,      { toValue: 180 + Math.random() * 80, duration: 1600, easing: Easing.out(Easing.quad), useNativeDriver: false }),
        Animated.timing(p.scale,   { toValue: 0.2, duration: 1600, useNativeDriver: false }),
      ]).start();
    });
    tick(v => v + 1);
  }, [active]);

  return particles.current;
}

// ─── Live Countdown ───────────────────────────────────────────────────────────

function Countdown({ seconds }: { seconds: number }) {
  const [s, setS] = useState(seconds);
  useEffect(() => { setS(seconds); }, [seconds]);
  useEffect(() => {
    const t = setInterval(() => setS(prev => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return (
    <Text style={ct.text}>
      Next spin in{' '}
      <Text style={ct.value}>{h > 0 ? `${h}h ` : ''}{m}m {String(sec).padStart(2, '0')}s</Text>
    </Text>
  );
}
const ct = StyleSheet.create({
  text: { color: colors.textMuted, fontSize: 11, marginTop: 2, textAlign: 'center' },
  value: { color: colors.primary, fontWeight: '700' },
});

// ─── Main component ───────────────────────────────────────────────────────────

export default function WheelScreen() {
  const insets = useSafeAreaInsets();
  const { canClaimWheel, nextWheelIn, claimWheelSpin, profile, updateProfile } = useUser();

  const rotAnim      = useRef(new Animated.Value(0)).current;
  const totalRot     = useRef(0);
  const [spinning,   setSpinning]   = useState(false);
  const [winner,     setWinner]     = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [claimed,    setClaimed]    = useState(false);
  const resultScale  = useRef(new Animated.Value(0)).current;
  const glowAnim     = useRef(new Animated.Value(0.5)).current;
  const pointerBounce= useRef(new Animated.Value(1)).current;
  const bgPulse      = useRef(new Animated.Value(0)).current;

  const isBigWin = winner !== null && (SEGMENTS[winner].chips >= 50_000 || SEGMENTS[winner].chips === 100_000);
  const confettiParticles = useConfetti(isBigWin && showResult);

  const rotation = rotAnim.interpolate({
    inputRange:  [0, 360],
    outputRange: ['0deg', '360deg'],
    extrapolate: 'extend',
  });

  const tickInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopTick = () => { if (tickInterval.current) { clearInterval(tickInterval.current); tickInterval.current = null; } };
  useEffect(() => () => stopTick(), []);

  const spin = useCallback(() => {
    if (!canClaimWheel || spinning) return;
    const w = pickWinner();
    setWinner(w);
    setShowResult(false);
    setClaimed(false);
    setSpinning(true);
    SoundEngine.button();

    // Tick sounds — speed up then slow down
    let tickInterval_ = 60;
    let elapsed = 0;
    stopTick();
    tickInterval.current = setInterval(() => {
      elapsed += tickInterval_;
      SoundEngine.chip();
      if (elapsed < 1500) tickInterval_ = Math.max(55, tickInterval_ - 1);
      else if (elapsed > 3000) tickInterval_ = Math.min(320, tickInterval_ + 12);
      if (elapsed > 4500) stopTick();
    }, tickInterval_);

    // Precise landing calculation
    // Segment i center is at: -90 + (i + 0.5) * ARC degrees from top (in wheel's local frame)
    // To bring segment w to the pointer (top), wheel must rotate by:
    // alignAngle = (360 - (w * ARC)) % 360
    const alignAngle = ((360 - w * ARC) % 360 + 360) % 360;
    const spins = 5 + Math.floor(Math.random() * 3);
    const target = totalRot.current + spins * 360 + alignAngle - (totalRot.current % 360);
    totalRot.current = target;

    // Background pulse during spin
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgPulse, { toValue: 1, duration: 800, useNativeDriver: false }),
        Animated.timing(bgPulse, { toValue: 0, duration: 800, useNativeDriver: false }),
      ]),
      { iterations: 4 },
    ).start();

    Animated.timing(rotAnim, {
      toValue: target,
      duration: 4200 + Math.random() * 1400,
      easing: Easing.out(Easing.bezier(0.17, 0.67, 0.31, 1.0)),
      useNativeDriver: false,
    }).start(() => {
      stopTick();
      setSpinning(false);

      // Pointer bounce
      Animated.sequence([
        Animated.timing(pointerBounce, { toValue: 1.8, duration: 80,  useNativeDriver: false }),
        Animated.timing(pointerBounce, { toValue: 0.6, duration: 70,  useNativeDriver: false }),
        Animated.timing(pointerBounce, { toValue: 1.4, duration: 60,  useNativeDriver: false }),
        Animated.timing(pointerBounce, { toValue: 0.85,duration: 50,  useNativeDriver: false }),
        Animated.timing(pointerBounce, { toValue: 1.0, duration: 40,  useNativeDriver: false }),
      ]).start();

      setShowResult(true);
      resultScale.setValue(0);
      Animated.spring(resultScale, { toValue: 1, tension: 70, friction: 7, useNativeDriver: false }).start();

      // Glow pulse on result
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1,   duration: 450, useNativeDriver: false }),
          Animated.timing(glowAnim, { toValue: 0.4, duration: 450, useNativeDriver: false }),
        ]),
        { iterations: 8 },
      ).start();
    });
  }, [canClaimWheel, spinning, rotAnim, resultScale, glowAnim, pointerBounce, bgPulse]);

  const handleClaim = useCallback(async () => {
    if (winner === null || claimed) return;
    setClaimed(true);
    const seg = SEGMENTS[winner];
    await claimWheelSpin(seg.chips, seg.ticket);
    if (seg.xp > 0) await updateProfile({ xp: profile.xp + seg.xp });
    SoundEngine.claim();
  }, [winner, claimed, claimWheelSpin, updateProfile, profile.xp]);

  const seg = winner !== null ? SEGMENTS[winner] : null;

  const bgColor = bgPulse.interpolate({ inputRange: [0, 1], outputRange: ['#050010', '#0a0020'] });

  return (
    <Animated.View style={[s.container, { backgroundColor: bgColor }]}>
      <LinearGradient colors={['#0d001f', '#050010', '#050010']} style={StyleSheet.absoluteFill} />
      {/* Ambient glows */}
      <View style={s.glow1} />
      <View style={s.glow2} />

      <ScrollView
        style={{ flex: 1, width: '100%' }}
        contentContainerStyle={{ alignItems: 'center', paddingBottom: insets.bottom + 20 }}
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
              : <Text style={s.readyText}>✨ Free spin available!</Text>
            }
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Balance row */}
        <View style={s.balanceRow}>
          <Ionicons name="logo-bitcoin" size={13} color="#ffd700" />
          <Text style={s.balanceText}>{formatChips(profile.chips)} chips</Text>
        </View>

        {/* Pointer */}
        <View style={s.pointerWrap}>
          <Animated.View style={{ transform: [{ scaleY: pointerBounce }] }}>
            <View style={s.pointer} />
            <View style={s.pointerShadow} />
          </Animated.View>
        </View>

        {/* Wheel */}
        <Animated.View style={[s.wheelAnim, { transform: [{ rotate: rotation }] }]}>
          <Svg
            width={WHEEL_SIZE} height={WHEEL_SIZE}
            viewBox="0 0 300 300"
            style={{ backgroundColor: 'transparent' }}
          >
            {/* Background circle — solid fill, no gradients (iOS SVG gradient compat) */}
            <Circle cx={CX} cy={CY} r={R_OUTER + 2} fill="#050010" />

            {/* Segments */}
            {SEGMENTS.map((sg, i) => {
              const p   = textPos(i);
              const isW = winner === i && showResult;
              return (
                <G key={i}>
                  <Path
                    d={slicePath(i)}
                    fill={isW ? sg.col + '55' : sg.dim}
                    stroke={sg.col}
                    strokeWidth={isW ? 1.8 : 0.6}
                    strokeOpacity={isW ? 1 : 0.45}
                  />
                  {/* Divider lines */}
                  <Line
                    x1={CX} y1={CY}
                    x2={CX + R_OUTER * Math.cos(toRad(-90 + i * ARC))}
                    y2={CY + R_OUTER * Math.sin(toRad(-90 + i * ARC))}
                    stroke="rgba(255,255,255,0.08)" strokeWidth={0.5}
                  />
                  {/* Icon */}
                  <SvgText
                    x={p.xi} y={p.yi + 5}
                    textAnchor="middle"
                    fontSize={11}
                    transform={`rotate(${p.rot}, ${p.xi}, ${p.yi})`}
                  >{sg.emoji}</SvgText>
                  {/* Label */}
                  <SvgText
                    x={p.x} y={p.y + 4}
                    textAnchor="middle"
                    fill={isW ? '#fff' : sg.col}
                    fillOpacity={isW ? 1 : 0.85}
                    fontSize={sg.label.length > 4 ? 7.5 : 9.5}
                    fontWeight="bold"
                    transform={`rotate(${p.rot}, ${p.x}, ${p.y})`}
                  >{sg.label}</SvgText>
                </G>
              );
            })}

            {/* Outer ring */}
            <Circle cx={CX} cy={CY} r={R_OUTER} fill="none" stroke="rgba(191,95,255,0.4)" strokeWidth={1.5} />
            {/* Spoke dots */}
            {Array.from({ length: N }).map((_, i) => {
              const a = -90 + i * ARC;
              const dx = CX + (R_OUTER - 2) * Math.cos(toRad(a));
              const dy = CY + (R_OUTER - 2) * Math.sin(toRad(a));
              return <Circle key={i} cx={dx} cy={dy} r={2} fill={SEGMENTS[i].col} fillOpacity={0.7} />;
            })}
            {/* Center hub — solid colors, no gradient refs (iOS compat) */}
            <Circle cx={CX} cy={CY} r={R_INNER} fill="#0d001a" stroke="rgba(191,95,255,0.5)" strokeWidth={2} />
            <Circle cx={CX} cy={CY} r={R_INNER - 4} fill="#110025" />
            <Circle cx={CX} cy={CY} r={R_INNER - 8} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
            <SvgText x={CX} y={CY - 5}  textAnchor="middle" fill="#fff"     fontSize={8} fontWeight="bold">CHIP</SvgText>
            <SvgText x={CX} y={CY + 6}  textAnchor="middle" fill="#bf5fff"  fontSize={6}>SOCIETY</SvgText>
          </Svg>
        </Animated.View>

        {/* Result card — shown after spin, before claim */}
        {showResult && seg && (
          <Animated.View style={[
            s.resultCard,
            { borderColor: `${seg.col}80`, transform: [{ scale: resultScale }] }
          ]}>
            <LinearGradient colors={[`${seg.col}28`, `${seg.col}06`]} style={StyleSheet.absoluteFill} />
            <Animated.View style={[s.resultGlow, { opacity: glowAnim, shadowColor: seg.col }]} />
            <Text style={s.resultEmoji}>{seg.emoji}</Text>
            <Text style={[s.resultAmount, { color: seg.col }]}>
              {seg.chips > 0
                ? `+${formatChips(seg.chips)} CHIPS`
                : seg.ticket
                ? '+1 SCRATCH TICKET'
                : seg.xp > 0
                ? `+${seg.xp} XP`
                : 'REWARD'}
            </Text>
            {!claimed ? (
              <TouchableOpacity style={[s.claimBtn, { borderColor: seg.col }]} onPress={handleClaim}>
                <LinearGradient colors={[`${seg.col}50`, `${seg.col}20`]} style={StyleSheet.absoluteFill} />
                <Ionicons name="checkmark-circle" size={16} color={seg.col} />
                <Text style={[s.claimBtnText, { color: seg.col }]}>CLAIM REWARD</Text>
              </TouchableOpacity>
            ) : (
              <View style={s.claimedRow}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={s.claimedText}>Added to your balance!</Text>
              </View>
            )}
          </Animated.View>
        )}

        {/* Confetti */}
        {confettiParticles.map((p, i) => (
          <Animated.View
            key={i}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: p.x, top: p.y,
              width: 8, height: 8,
              borderRadius: 2,
              backgroundColor: p.color,
              opacity: p.opacity,
              transform: [
                { translateX: p.vx * 0.01 },
                { translateY: p.ty },
                { scale: p.scale },
                { rotate: `${p.rot}deg` },
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
              : canClaimWheel
              ? ['#7700ff', '#bf5fff']
              : ['#1a1a2e', '#0d0d1a']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          />
          <Ionicons
            name={spinning ? 'time-outline' : 'refresh'}
            size={20} color="#fff" style={{ marginRight: 8 }}
          />
          <Text style={s.spinBtnText}>
            {spinning ? 'SPINNING…' : canClaimWheel ? 'SPIN THE WHEEL' : 'COME BACK LATER'}
          </Text>
        </TouchableOpacity>

        {/* Reward legend */}
        <View style={s.legendWrap}>
          <Text style={s.legendTitle}>POSSIBLE REWARDS</Text>
          <View style={s.legend}>
            {[...new Map(SEGMENTS.map(sg => [sg.label, sg])).values()].map(sg => (
              <View key={sg.label} style={[s.legendItem, { borderColor: `${sg.col}30`, backgroundColor: `${sg.col}10` }]}>
                <Text style={{ fontSize: 11 }}>{sg.emoji}</Text>
                <Text style={[s.legendText, { color: sg.col }]}>{sg.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050010' },
  glow1: { position: 'absolute', top: -60, left: -80, width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(191,95,255,0.07)' },
  glow2: { position: 'absolute', bottom: 60, right: -80, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(0,212,255,0.05)' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 16, paddingBottom: 6 },
  closeBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: colors.border },
  title: { color: '#fff', fontSize: 17, fontWeight: '900', fontFamily: 'Orbitron_900Black', letterSpacing: 2 },
  readyText: { color: colors.success, fontSize: 10, marginTop: 2 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  balanceText: { color: '#ffd700', fontSize: 13, fontWeight: '700' },
  pointerWrap: { alignItems: 'center', marginBottom: -10, zIndex: 10 },
  pointer: { width: 0, height: 0, borderLeftWidth: 10, borderRightWidth: 10, borderTopWidth: 20, borderStyle: 'solid', borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#ffffff' },
  pointerShadow: { width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 12, borderStyle: 'solid', borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: 'rgba(191,95,255,0.5)', alignSelf: 'center', marginTop: -6 },
  wheelAnim: { width: WHEEL_SIZE, height: WHEEL_SIZE, backgroundColor: 'transparent' },
  resultCard: {
    width: '88%', borderRadius: 18, borderWidth: 1.5,
    padding: 20, alignItems: 'center', gap: 10,
    overflow: 'hidden', marginTop: 10, marginBottom: 6,
    position: 'relative',
  },
  resultGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
  resultEmoji: { fontSize: 44 },
  resultAmount: { fontSize: 22, fontWeight: '900', fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  claimBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderRadius: 24, overflow: 'hidden',
    paddingHorizontal: 24, paddingVertical: 12,
  },
  claimBtnText: { fontSize: 13, fontWeight: '800', fontFamily: 'Orbitron_700Bold', letterSpacing: 1 },
  claimedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  claimedText: { color: colors.success, fontSize: 12, fontWeight: '600' },
  spinBtn: {
    width: '88%', height: 54, borderRadius: 14,
    overflow: 'hidden', flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 4, marginBottom: 16,
  },
  spinBtnDis: { opacity: 0.45 },
  spinBtnText: { color: '#fff', fontSize: 14, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 1 },
  legendWrap: { width: '88%', gap: 10, marginBottom: 8 },
  legendTitle: { color: colors.textDim, fontSize: 9, fontWeight: '700', letterSpacing: 2, textAlign: 'center' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 10, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 5 },
  legendText: { fontSize: 9, fontWeight: '700' },
});
