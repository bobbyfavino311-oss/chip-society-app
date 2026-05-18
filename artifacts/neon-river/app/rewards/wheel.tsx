import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useRef, useState, useCallback } from 'react';
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path, Circle, G, Text as SvgText } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/colors';
import { useUser } from '@/context/UserContext';
import { formatChips } from '@/utils/chipColor';

// ─── Wheel config ─────────────────────────────────────────────────────────────
// Segments are ordered clockwise; segment i's center is at -90 + i*45 degrees.
const SEGMENTS = [
  { label: '5K',    reward: '5,000 chips',   chips: 5_000,    ticket: 0, vip: false, color: '#00d4ff', dim: '#003355', prob: 0.28 },
  { label: '10K',   reward: '10,000 chips',  chips: 10_000,   ticket: 0, vip: false, color: '#0099ee', dim: '#002244', prob: 0.20 },
  { label: 'TICKET',reward: 'Scratch Ticket',chips: 0,        ticket: 1, vip: false, color: '#bf5fff', dim: '#2a0055', prob: 0.16 },
  { label: '25K',   reward: '25,000 chips',  chips: 25_000,   ticket: 0, vip: false, color: '#00ccaa', dim: '#003330', prob: 0.14 },
  { label: '50K',   reward: '50,000 chips',  chips: 50_000,   ticket: 0, vip: false, color: '#ffd700', dim: '#332800', prob: 0.10 },
  { label: '100K',  reward: '100,000 chips', chips: 100_000,  ticket: 0, vip: false, color: '#ff8800', dim: '#331a00', prob: 0.07 },
  { label: 'VIP',   reward: 'VIP Day Pass',  chips: 0,        ticket: 0, vip: true,  color: '#ff0090', dim: '#330020', prob: 0.04 },
  { label: '500K!', reward: '500,000 chips', chips: 500_000,  ticket: 0, vip: false, color: '#ff2060', dim: '#330010', prob: 0.01 },
];

const N = SEGMENTS.length;
const ARC = 360 / N; // 45

function pickWinner(): number {
  const r = Math.random();
  let cum = 0;
  for (let i = 0; i < N; i++) {
    cum += SEGMENTS[i].prob;
    if (r <= cum) return i;
  }
  return 0;
}

// SVG wheel geometry
const CX = 150, CY = 150, R_OUTER = 138, R_INNER = 52, R_TEXT = 97;

function toRad(deg: number) { return (deg * Math.PI) / 180; }

function slicePath(i: number): string {
  // Segment i center at (-90 + i*ARC) degrees; spans ±ARC/2
  const start = -90 + i * ARC - ARC / 2;
  const end   = -90 + i * ARC + ARC / 2;
  const x1 = CX + R_OUTER * Math.cos(toRad(start));
  const y1 = CY + R_OUTER * Math.sin(toRad(start));
  const x2 = CX + R_OUTER * Math.cos(toRad(end));
  const y2 = CY + R_OUTER * Math.sin(toRad(end));
  // Inner arc (for donut effect)
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
  const { canClaimWheel, nextWheelIn, claimWheelSpin, profile } = useUser();

  const rotAnim  = useRef(new Animated.Value(0)).current;
  const totalRot = useRef(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const resultScale = useRef(new Animated.Value(0)).current;
  const glowAnim   = useRef(new Animated.Value(0.4)).current;

  const rotation = rotAnim.interpolate({
    inputRange:  [0, 360],
    outputRange: ['0deg', '360deg'],
    extrapolate: 'extend',
  });

  const spin = useCallback(() => {
    if (!canClaimWheel || spinning) return;
    const w = pickWinner();
    setWinner(w);
    setShowResult(false);
    setSpinning(true);

    // Rotation needed to bring segment w to the top (pointer at -90°, segment w center at -90 + w*ARC)
    const alignAngle = w === 0 ? 0 : 360 - w * ARC;
    const target = totalRot.current + 5 * 360 + alignAngle;
    totalRot.current = target;

    Animated.timing(rotAnim, {
      toValue: target,
      duration: 4200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(async () => {
      setSpinning(false);
      // Claim prize
      await claimWheelSpin(SEGMENTS[w].chips, SEGMENTS[w].ticket);
      // Reveal result
      setShowResult(true);
      resultScale.setValue(0);
      Animated.spring(resultScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: false }).start();
      // Glow pulse on winner
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 600, useNativeDriver: false }),
          Animated.timing(glowAnim, { toValue: 0.4, duration: 600, useNativeDriver: false }),
        ]), { iterations: 4 }
      ).start();
    });
  }, [canClaimWheel, spinning, rotAnim, claimWheelSpin, resultScale, glowAnim]);

  const seg = winner !== null ? SEGMENTS[winner] : null;

  return (
    <View style={s.container}>
      <LinearGradient colors={['#100018', '#050010', '#050010']} style={StyleSheet.absoluteFill} />
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

      {/* Wheel */}
      <View style={s.wheelWrap}>
        {/* Pointer */}
        <View style={s.pointer}>
          <View style={s.pointerArrow} />
        </View>

        {/* Spinning wheel */}
        <Animated.View style={[s.wheelAnim, { transform: [{ rotate: rotation }] }]}>
          <Svg width={300} height={300} viewBox="0 0 300 300">
            {SEGMENTS.map((seg, i) => {
              const pos = textPos(i);
              const isWinner = winner === i && showResult;
              return (
                <G key={i}>
                  <Path
                    d={slicePath(i)}
                    fill={isWinner ? seg.color : seg.dim}
                    stroke={isWinner ? seg.color : 'rgba(255,255,255,0.08)'}
                    strokeWidth={isWinner ? 2 : 0.5}
                  />
                  <SvgText
                    x={pos.x}
                    y={pos.y + 4}
                    textAnchor="middle"
                    fill={isWinner ? '#fff' : seg.color}
                    fontSize={seg.label.length > 4 ? 8 : 10}
                    fontWeight="bold"
                  >
                    {seg.label}
                  </SvgText>
                </G>
              );
            })}
            {/* Center circle */}
            <Circle cx={CX} cy={CY} r={R_INNER - 2} fill="#050010" stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
            <SvgText x={CX} y={CY - 6} textAnchor="middle" fill="#fff" fontSize={11} fontWeight="bold">CHIP</SvgText>
            <SvgText x={CX} y={CY + 8} textAnchor="middle" fill="#bf5fff" fontSize={9}>SOCIETY</SvgText>
          </Svg>
        </Animated.View>
      </View>

      {/* Prize result banner */}
      {showResult && seg && (
        <Animated.View style={[s.resultBanner, { borderColor: `${seg.color}88`, transform: [{ scale: resultScale }] }]}>
          <LinearGradient colors={[`${seg.color}25`, `${seg.color}08`]} style={StyleSheet.absoluteFill} />
          <Text style={s.resultEmoji}>{seg.vip ? '💎' : seg.ticket ? '🎫' : '🎉'}</Text>
          <Text style={[s.resultTitle, { color: seg.color }]}>{seg.reward.toUpperCase()}</Text>
          <Text style={s.resultSub}>
            {seg.chips > 0 ? `+${formatChips(seg.chips)} chips added` : seg.ticket ? '+1 scratch ticket added' : 'VIP access activated (24h)'}
          </Text>
        </Animated.View>
      )}

      {/* Balance display */}
      <View style={s.balanceRow}>
        <Ionicons name="logo-bitcoin" size={14} color="#ffd700" />
        <Text style={s.balanceText}>{formatChips(profile.chips)} chips</Text>
      </View>

      {/* Spin button */}
      <TouchableOpacity
        style={[s.spinBtn, { opacity: canClaimWheel && !spinning ? 1 : 0.45 }]}
        onPress={spin}
        disabled={!canClaimWheel || spinning}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={spinning ? ['#333', '#222'] : ['#bf5fff', '#7700ff']}
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
  glow1: { position: 'absolute', top: -80, left: -80, width: 320, height: 320, borderRadius: 160, backgroundColor: 'rgba(191,95,255,0.07)' },
  glow2: { position: 'absolute', bottom: 60, right: -80, width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(0,212,255,0.05)' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 16, paddingBottom: 12 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: colors.border },
  title: { color: colors.text, fontSize: 18, fontWeight: '900', fontFamily: 'Orbitron_900Black', letterSpacing: 2 },
  cooldown: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  wheelWrap: { width: 310, height: 310, alignItems: 'center', justifyContent: 'center' },
  pointer: { position: 'absolute', top: -2, zIndex: 10, alignItems: 'center' },
  pointerArrow: { width: 0, height: 0, borderLeftWidth: 9, borderRightWidth: 9, borderTopWidth: 20, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#ffffff', },
  wheelAnim: { width: 300, height: 300 },
  resultBanner: { width: '88%', borderRadius: 16, borderWidth: 1.5, padding: 18, alignItems: 'center', gap: 6, overflow: 'hidden', marginBottom: 8 },
  resultEmoji: { fontSize: 36 },
  resultTitle: { fontSize: 20, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 1 },
  resultSub: { color: colors.textMuted, fontSize: 12, textAlign: 'center' },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  balanceText: { color: '#ffd700', fontSize: 14, fontWeight: '700' },
  spinBtn: { width: '88%', height: 56, borderRadius: 16, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  spinBtnText: { color: '#fff', fontSize: 15, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 1 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', paddingHorizontal: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 7, height: 7, borderRadius: 3.5 },
  legendText: { fontSize: 9, fontWeight: '700' },
});
