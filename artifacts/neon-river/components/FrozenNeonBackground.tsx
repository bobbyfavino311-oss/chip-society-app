import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  Line,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

const VW = 390;
const VH = 844;

const ICE   = '#8FEFFF';
const CYAN  = '#00D9FF';
const NAVY  = '#08101E';

export default function FrozenNeonBackground() {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* Base gradient — deep midnight navy */}
      <LinearGradient
        colors={['#0A1628', '#060E1C', '#030A14', '#060E1C', '#0A1628']}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <Svg
        width={VW}
        height={VH}
        viewBox={`0 0 ${VW} ${VH}`}
        style={StyleSheet.absoluteFillObject}
        preserveAspectRatio="xMidYMid slice"
      >
        <Defs>
          {/* Large top-center ice bloom */}
          <RadialGradient id="fnTop" cx="50%" cy="0%" r="70%" fx="50%" fy="0%">
            <Stop offset="0"   stopColor={CYAN}  stopOpacity="0.18" />
            <Stop offset="0.6" stopColor={ICE}   stopOpacity="0.05" />
            <Stop offset="1"   stopColor={NAVY}  stopOpacity="0" />
          </RadialGradient>
          {/* Center ambient — deep cyan */}
          <RadialGradient id="fnMid" cx="50%" cy="50%" r="42%" fx="50%" fy="50%">
            <Stop offset="0"   stopColor={CYAN}  stopOpacity="0.10" />
            <Stop offset="1"   stopColor={CYAN}  stopOpacity="0" />
          </RadialGradient>
          {/* Bottom-right corner bloom */}
          <RadialGradient id="fnBR" cx="90%" cy="100%" r="55%" fx="90%" fy="100%">
            <Stop offset="0"   stopColor={ICE}   stopOpacity="0.12" />
            <Stop offset="1"   stopColor={ICE}   stopOpacity="0" />
          </RadialGradient>
          {/* Top-left corner bloom */}
          <RadialGradient id="fnTL" cx="0%" cy="0%" r="50%" fx="0%" fy="0%">
            <Stop offset="0"   stopColor={CYAN}  stopOpacity="0.10" />
            <Stop offset="1"   stopColor={CYAN}  stopOpacity="0" />
          </RadialGradient>

          {/* Frosted glass circle fill — large translucent disk */}
          <RadialGradient id="glassCircle1" cx="50%" cy="50%" r="50%">
            <Stop offset="0"   stopColor={ICE}   stopOpacity="0.07" />
            <Stop offset="0.7" stopColor={CYAN}  stopOpacity="0.03" />
            <Stop offset="1"   stopColor={CYAN}  stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="glassCircle2" cx="50%" cy="50%" r="50%">
            <Stop offset="0"   stopColor={ICE}   stopOpacity="0.05" />
            <Stop offset="0.8" stopColor={CYAN}  stopOpacity="0.02" />
            <Stop offset="1"   stopColor={CYAN}  stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="glassCircle3" cx="50%" cy="50%" r="50%">
            <Stop offset="0"   stopColor={CYAN}  stopOpacity="0.06" />
            <Stop offset="1"   stopColor={CYAN}  stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Ambient glow layers */}
        <Rect x={0} y={0} width={VW} height={VH} fill="url(#fnTop)" />
        <Rect x={0} y={0} width={VW} height={VH} fill="url(#fnMid)" />
        <Rect x={0} y={0} width={VW} height={VH} fill="url(#fnBR)"  />
        <Rect x={0} y={0} width={VW} height={VH} fill="url(#fnTL)"  />

        {/* ── Massive frosted-glass circles ──────────────────────────────── */}
        {/* Large top-center disk */}
        <Circle cx={195} cy={-30} r={220}
          fill="url(#glassCircle1)"
          stroke={CYAN} strokeWidth={0.4} strokeOpacity={0.12} />

        {/* Mid-left overlapping disk */}
        <Circle cx={-40} cy={360} r={195}
          fill="url(#glassCircle2)"
          stroke={ICE} strokeWidth={0.3} strokeOpacity={0.08} />

        {/* Bottom-right disk */}
        <Circle cx={420} cy={780} r={210}
          fill="url(#glassCircle1)"
          stroke={CYAN} strokeWidth={0.4} strokeOpacity={0.10} />

        {/* Center overlapping disk */}
        <Circle cx={195} cy={422} r={160}
          fill="url(#glassCircle3)"
          stroke={CYAN} strokeWidth={0.25} strokeOpacity={0.07} />

        {/* Smaller accent disk — top right */}
        <Circle cx={360} cy={120} r={100}
          fill="none"
          stroke={ICE} strokeWidth={0.5} strokeOpacity={0.10} />

        {/* ── Thin concentric frosted rings ──────────────────────────────── */}
        <Circle cx={195} cy={422} r={240}
          fill="none" stroke={CYAN} strokeWidth={0.4} strokeOpacity={0.06} />
        <Circle cx={195} cy={422} r={300}
          fill="none" stroke={ICE}  strokeWidth={0.3} strokeOpacity={0.04} />

        {/* ── Subtle horizontal scan-lines — glassmorphism depth ──────────── */}
        {[180, 280, 380, 480, 580, 680].map((y, i) => (
          <Line key={i}
            x1={0} y1={y} x2={VW} y2={y}
            stroke={CYAN} strokeWidth={0.3} strokeOpacity={0.04}
          />
        ))}

        {/* ── Vertical accent lines — slim neon edges ─────────────────────── */}
        <Line x1={6}   y1={200} x2={6}   y2={640} stroke={CYAN} strokeWidth={0.6} strokeOpacity={0.12} />
        <Line x1={384} y1={200} x2={384} y2={640} stroke={CYAN} strokeWidth={0.6} strokeOpacity={0.12} />
        {/* Outer faint guides */}
        <Line x1={1}   y1={120} x2={1}   y2={724} stroke={ICE} strokeWidth={0.4} strokeOpacity={0.06} />
        <Line x1={389} y1={120} x2={389} y2={724} stroke={ICE} strokeWidth={0.4} strokeOpacity={0.06} />

        {/* ── Top/bottom horizontal accent bars ───────────────────────────── */}
        <Line x1={50} y1={28}  x2={340} y2={28}  stroke={CYAN} strokeWidth={0.7} strokeOpacity={0.18} />
        <Line x1={50} y1={816} x2={340} y2={816} stroke={CYAN} strokeWidth={0.7} strokeOpacity={0.18} />

        {/* Subtle diagonal lens flare — upper-right */}
        <Ellipse cx={340} cy={80} rx={80} ry={8}
          fill={ICE} fillOpacity={0.04}
          transform="rotate(-32, 340, 80)"
        />
        {/* Lower-left lens flare */}
        <Ellipse cx={55} cy={760} rx={70} ry={6}
          fill={ICE} fillOpacity={0.03}
          transform="rotate(-32, 55, 760)"
        />

        {/* ── Top & bottom vignettes ───────────────────────────────────────── */}
        <Rect x={0} y={0}        width={VW} height={100} fill="rgba(3,8,16,0.55)" />
        <Rect x={0} y={VH - 100} width={VW} height={100} fill="rgba(3,8,16,0.50)" />
      </Svg>
    </View>
  );
}
