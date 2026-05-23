import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path, Circle, G, Text as SvgText, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/colors';
import { useUser } from '@/context/UserContext';
import { SoundEngine } from '@/lib/soundEngine';
import { formatChips } from '@/utils/chipColor';

// ─── Wheel config ─────────────────────────────────────────────────────────────
const SEGMENTS = [
  { label: '2K',     reward: '2,000 chips',    chips: 2_000,   ticket: 0, xp: 0,   color: '#00d4ff', dim: '#002a40', prob: 0.28 },
  { label: '5K',     reward: '5,000 chips',    chips: 5_000,   ticket: 0, xp: 0,   color: '#0099ee', dim: '#001830', prob: 0.22 },
  { label: 'TICKET', reward: 'Scratch Ticket', chips: 0,       ticket: 1, xp: 0,   color: '#bf5fff', dim: '#1e0040', prob: 0.17 },
  { label: '10K',    reward: '10,000 chips',   chips: 10_000,  ticket: 0, xp: 0,   color: '#00ccaa', dim: '#002820', prob: 0.13 },
  { label: '+XP',    reward: '500 XP Boost',   chips: 0,       ticket: 0, xp: 500, color: '#00ff88', dim: '#002018', prob: 0.09 },
  { label: '25K',    reward: '25,000 chips',   chips: 25_000,  ticket: 0, xp: 0,   color: '#ffd700', dim: '#2a2000', prob: 0.06 },
  { label: '50K',    reward: '50,000 chips',   chips: 50_000,  ticket: 0, xp: 0,   color: '#ff8800', dim: '#2a1400', prob: 0.04 },
  { label: '100K!',  reward: '100,000 chips',  chips: 100_000, ticket: 0, xp: 0,   color: '#ff0090', dim: '#2a0018', prob: 0.01 },
];

const N = SEGMENTS.length;
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

const CX = 150, CY = 150, R_OUTER = 136, R_INNER = 46, R_TEXT = 96;

function toRad(deg: number) { return (deg * Math.PI) / 180; }

function slicePath(i: number): string {
  const start = -90 + i * ARC - ARC / 2;
  const end   = -90 + i * ARC + ARC / 2;
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
  const mid = -90 + i * ARC;
  return { x: CX + R_TEXT * Math.cos(toRad(mid)), y: CY + R_TEXT * Math.sin(toRad(mid)) };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function WheelScreen() {
  const insets = useSafeAreaInsets();
  const { canClaimWheel, nextWheelIn, claimWheelSpin, profile, updateProfile } = useUser();

  const rotAnim    = useRef(new Animated.Value(0)).current;
  const totalRot   = useRef(0);
  const [spinning, setSpinning]   = useState(false);
  const [winner,   setWinner]     = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const resultScale   = useRef(new Animated.Value(0)).current;
  const glowAnim      = useRef(new Animated.Value(0.3)).current;
  const pointerBounce = useRef(new Animated.Value(1)).current;

  // Tick sound during spin
  const tickInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const rotation = rotAnim.interpolate({
    inputRange:  [0, 360],
    outputRange: ['0deg', '360deg'],
    extrapolate: 'extend',
  });

  const stopTick = () => {
    if (tickInterval.current) {
      clearInterval(tickInterval.current);
      tickInterval.current = null;
    }
  };

  useEffect(() => () => stopTick(), []);

  const spin = useCallback(() => {
    if (!canClaimWheel || spinning) return;
    const w = pickWinner();
    setWinner(w);
    setShowResult(false);
    setSpinning(true);
    SoundEngine.button();

    // Tick sound — starts fast, slows as wheel decelerates
    let tickMs = 80;
    let elapsed = 0;
    stopTick();
    tickInterval.current = setInterval(() => {
      elapsed += tickMs;
      SoundEngine.chip();
      // Gradually slow tick
      if (elapsed > 2000) tickMs = 180;
      else if (elapsed > 3000) tickMs = 280;
      if (elapsed > 4200) stopTick();
    }, tickMs);

    const alignAngle = w === 0 ? 0 : 360 - w * ARC;
    const target = totalRot.current + 6 * 360 + alignAngle;
    totalRot.current = target;

    Animated.timing(rotAnim, {
      toValue: target,
      duration: 4500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(async () => {
      stopTick();
      setSpinning(false);
      const seg = SEGMENTS[w];
      await claimWheelSpin(seg.chips, seg.ticket);
      // Award XP if XP segment
      if (seg.xp > 0) {
        await updateProfile({ xp: profile.xp + seg.xp });
      }
      SoundEngine.win();
      // Pointer bounce — tactile landing feel
      Animated.sequence([
        Animated.timing(pointerBounce, { toValue: 1.6, duration: 100, useNativeDriver: false }),
        Animated.timing(pointerBounce, { toValue: 0.7, duration: 80,  useNativeDriver: false }),
        Animated.timing(pointerBounce, { toValue: 1.3, duration: 60,  useNativeDriver: false }),
        Animated.timing(pointerBounce, { toValue: 0.9, duration: 50,  useNativeDriver: false }),
        Animated.timing(pointerBounce, { toValue: 1.0, duration: 40,  useNativeDriver: false }),
      ]).start();
      setShowResult(true);
      resultScale.setValue(0);
      Animated.spring(resultScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: false }).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1,   duration: 500, useNativeDriver: false }),
          Animated.timing(glowAnim, { toValue: 0.3, duration: 500, useNativeDriver: false }),
        ]), { iterations: 6 }
      ).start();
    });
  }, [canClaimWheel, spinning, rotAnim, claimWheelSpin, resultScale, glowAnim, pointerBounce, profile.xp, updateProfile]);

  const seg = winner !== null ? SEGMENTS[winner] : null;

  return (
    <View style={s.container}>
      <LinearGradient colors={['#0e0020', '#050010', '#050010']} style={StyleSheet.absoluteFill} />
      {/* Ambient glows */}
      <View style={s.glow1} />
      <View style={s.glow2} />

      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 20 : 16) }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.closeBtn} activeOpacity={0.7}>
          <Ionicons name="close" size={22} color={colors.textMuted} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={s.title}>DAILY SPIN</Text>
          {!canClaimWheel && (
            <Text style={s.cooldown}>Next spin in {Math.floor(nextWheelIn / 60)}h {nextWheelIn % 60}m</Text>
          )}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Pointer */}
      <View style={s.pointerWrap}>
        <Animated.View style={[s.pointer, { transform: [{ scaleY: pointerBounce }] }]} />
      </View>

      {/* Spinning wheel */}
      <Animated.View style={[s.wheelAnim, { transform: [{ rotate: rotation }] }]}>
        <Svg width={310} height={310} viewBox="0 0 300 300">
          <Defs>
            <RadialGradient id="rim" cx="50%" cy="50%" r="50%">
              <Stop offset="82%" stopColor="rgba(255,255,255,0.0)" />
              <Stop offset="100%" stopColor="rgba(255,255,255,0.07)" />
            </RadialGradient>
          </Defs>
          {SEGMENTS.map((sg, i) => {
            const pos     = textPos(i);
            const isWin   = winner === i && showResult;
            const label   = sg.label;
            const small   = label.length > 4;
            return (
              <G key={i}>
                <Path
                  d={slicePath(i)}
                  fill={isWin ? sg.color : sg.dim}
                  stroke={sg.color}
                  strokeWidth={isWin ? 1.5 : 0.4}
                  strokeOpacity={isWin ? 0.9 : 0.3}
                />
                <SvgText
                  x={pos.x} y={pos.y + 5}
                  textAnchor="middle"
                  fill={isWin ? '#fff' : sg.color}
                  fillOpacity={isWin ? 1 : 0.8}
                  fontSize={small ? 8 : 11}
                  fontWeight="bold"
                >{label}</SvgText>
              </G>
            );
          })}
          {/* Rim overlay */}
          <Circle cx={CX} cy={CY} r={R_OUTER} fill="url(#rim)" />
          {/* Center hub */}
          <Circle cx={CX} cy={CY} r={R_INNER - 2} fill="#07001a"
            stroke="rgba(255,255,255,0.15)" strokeWidth={1.5} />
          <SvgText x={CX} y={CY - 6} textAnchor="middle" fill="#fff" fontSize={10} fontWeight="bold">CHIP</SvgText>
          <SvgText x={CX} y={CY + 7} textAnchor="middle" fill="#bf5fff" fontSize={8}>SOCIETY</SvgText>
        </Svg>
      </Animated.View>

      {/* Prize result */}
      {showResult && seg && (
        <Animated.View style={[s.resultBanner, { borderColor: `${seg.color}77`, transform: [{ scale: resultScale }] }]}>
          <LinearGradient colors={[`${seg.color}22`, `${seg.color}06`]} style={StyleSheet.absoluteFill} />
          <Text style={s.resultEmoji}>{seg.xp > 0 ? '✨' : seg.ticket ? '💎' : '🎉'}</Text>
          <Text style={[s.resultTitle, { color: seg.color }]}>{seg.reward.toUpperCase()}</Text>
          <Text style={s.resultSub}>
            {seg.chips > 0
              ? `+${formatChips(seg.chips)} added to your balance`
              : seg.ticket
              ? '+1 scratch ticket added to your account'
              : seg.xp > 0
              ? `+${seg.xp} XP added to your profile`
              : ''}
          </Text>
        </Animated.View>
      )}

      {/* Balance */}
      <View style={s.balanceRow}>
        <Ionicons name="logo-bitcoin" size={14} color="#ffd700" />
        <Text style={s.balanceText}>{formatChips(profile.chips)} chips</Text>
      </View>

      {/* Spin button */}
      <TouchableOpacity
        style={[s.spinBtn, { opacity: canClaimWheel && !spinning ? 1 : 0.4 }]}
        onPress={spin}
        disabled={!canClaimWheel || spinning}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={spinning ? ['#1a1a2e', '#0d0d1a'] : ['#7700ff', '#bf5fff']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        />
        <Ionicons name={spinning ? 'time-outline' : 'refresh'} size={22} color="#fff" style={{ marginRight: 10 }} />
        <Text style={s.spinBtnText}>
          {spinning ? 'SPINNING…' : canClaimWheel ? 'SPIN THE WHEEL' : 'COME BACK TOMORROW'}
        </Text>
      </TouchableOpacity>

      {/* Segment legend */}
      <View style={s.legend}>
        {SEGMENTS.map((sg, i) => (
          <View key={i} style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: sg.color }]} />
            <Text style={[s.legendText, { color: sg.color }]}>{sg.label}</Text>
          </View>
        ))}
      </View>

      <View style={{ height: insets.bottom + 16 }} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050010', alignItems: 'center' },
  glow1: { position: 'absolute', top: -60, left: -80, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(191,95,255,0.06)' },
  glow2: { position: 'absolute', bottom: 80, right: -80, width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(0,212,255,0.04)' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 16, paddingBottom: 8 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: colors.border },
  title: { color: colors.text, fontSize: 18, fontWeight: '900', fontFamily: 'Orbitron_900Black', letterSpacing: 2 },
  cooldown: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
  pointerWrap: { alignItems: 'center', marginBottom: -8, zIndex: 10 },
  pointer: { width: 0, height: 0, borderLeftWidth: 10, borderRightWidth: 10, borderTopWidth: 22, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#ffffff' },
  wheelAnim: { width: 310, height: 310 },
  resultBanner: { width: '88%', borderRadius: 16, borderWidth: 1.5, padding: 18, alignItems: 'center', gap: 6, overflow: 'hidden', marginTop: 4, marginBottom: 8 },
  resultEmoji: { fontSize: 36 },
  resultTitle: { fontSize: 18, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 1 },
  resultSub: { color: colors.textMuted, fontSize: 11, textAlign: 'center' },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  balanceText: { color: '#ffd700', fontSize: 14, fontWeight: '700' },
  spinBtn: { width: '88%', height: 56, borderRadius: 16, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  spinBtnText: { color: '#fff', fontSize: 15, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 1 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', paddingHorizontal: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 7, height: 7, borderRadius: 3.5 },
  legendText: { fontSize: 9, fontWeight: '700' },
});
