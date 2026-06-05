/**
 * MidnightBeachBackground — Luxury synthwave poker room.
 * Dark navy sky, scattered stars, large pink flamingo (left),
 * dark navy palm (right), thin cyan horizon lines.
 */
import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

const { width: W, height: H } = Dimensions.get('window');
const VW = 390;
const VH = 844;

// ─── Deterministic tiny stars ─────────────────────────────────────────────────
function buildStars(count: number) {
  const stars: { x: number; y: number; r: number; op: number }[] = [];
  let seed = 97;
  const rng = () => { seed = (seed * 1664525 + 1013904223) & 0x7fffffff; return seed / 0x7fffffff; };
  for (let i = 0; i < count; i++) {
    stars.push({
      x:  rng() * VW,
      y:  rng() * VH * 0.55,
      r:  0.5 + rng() * 0.7,
      op: 0.20 + rng() * 0.35,
    });
  }
  return stars;
}
const STARS = buildStars(55);

// ─── Neon flamingo — thin pink line art ───────────────────────────────────────
function NeonFlamingo({ ox, oy, s = 1, color = '#FF2FAE', op = 1 }: {
  ox: number; oy: number; s?: number; color?: string; op?: number;
}) {
  const p = (x: number, y: number) => `${ox + x * s} ${oy + y * s}`;
  const sw = 2.0 * Math.min(s, 2.5);
  return (
    <G opacity={op}>
      <Path d={`M ${p(-2, 0)} C ${p(-2.5, -6)}, ${p(-5, -13)}, ${p(-4, -21)}`}
        stroke={color} strokeWidth={sw} strokeLinecap="round" fill="none" />
      <Path d={`M ${p(2, 0)} C ${p(1.5, -6)}, ${p(-0.5, -13)}, ${p(-0.5, -21)}`}
        stroke={color} strokeWidth={sw} strokeLinecap="round" fill="none" />
      <Path d={`M ${p(-5, -12)} L ${p(-2, -11)}`}
        stroke={color} strokeWidth={sw * 0.70} strokeLinecap="round" fill="none" />
      <Path d={`M ${p(-8, -25)} C ${p(-13, -32)}, ${p(-1, -39)}, ${p(7, -33)} C ${p(13, -27)}, ${p(4, -21)}, ${p(-4, -21)} Z`}
        stroke={color} strokeWidth={sw} fill="none" />
      <Path d={`M ${p(-8, -28)} C ${p(-16, -34)}, ${p(-17, -27)}, ${p(-6, -24)}`}
        stroke={color} strokeWidth={sw * 0.65} fill="none" strokeOpacity={0.70} />
      <Path d={`M ${p(6, -32)} C ${p(14, -39)}, ${p(7, -46)}, ${p(11, -53)}`}
        stroke={color} strokeWidth={sw} strokeLinecap="round" fill="none" />
      <Path d={`M ${p(11, -53)} C ${p(14, -58)}, ${p(19, -57)}, ${p(18, -53)} C ${p(17, -50)}, ${p(11, -52)}, ${p(11, -53)} Z`}
        stroke={color} strokeWidth={sw * 0.85} fill="none" />
      <Path d={`M ${p(18, -54)} C ${p(23, -55.5)}, ${p(24, -53)}, ${p(20, -52)}`}
        stroke={color} strokeWidth={sw * 0.75} strokeLinecap="round" fill="none" />
    </G>
  );
}

// ─── Neon palm tree — thin line art ───────────────────────────────────────────
function NeonPalm({ cx, baseY, h, lean = 0, color = '#004A64', op = 1, sw = 3 }: {
  cx: number; baseY: number; h: number; lean?: number;
  color?: string; op?: number; sw?: number;
}) {
  const crown = baseY - h;
  const tw = h * 0.52;
  const lx = cx + lean;
  return (
    <G opacity={op}>
      <Path d={`M ${cx} ${baseY} C ${cx + lean * 0.35} ${baseY - h * 0.5}, ${lx - 2} ${crown + h * 0.12}, ${lx} ${crown}`}
        stroke={color} strokeWidth={sw} strokeLinecap="round" fill="none" />
      <Path d={`M ${lx} ${crown} C ${lx + tw * 0.45} ${crown - tw * 0.32}, ${lx + tw} ${crown + tw * 0.06}, ${lx + tw} ${crown + tw * 0.42}`}
        stroke={color} strokeWidth={sw * 0.65} strokeLinecap="round" fill="none" />
      <Path d={`M ${lx} ${crown} C ${lx + tw * 0.18} ${crown - tw * 0.68}, ${lx + tw * 0.50} ${crown - tw * 0.90}, ${lx + tw * 0.52} ${crown - tw * 0.60}`}
        stroke={color} strokeWidth={sw * 0.60} strokeLinecap="round" fill="none" />
      <Path d={`M ${lx} ${crown} C ${lx} ${crown - tw * 0.80}, ${lx} ${crown - tw * 1.10}, ${lx} ${crown - tw * 0.93}`}
        stroke={color} strokeWidth={sw * 0.60} strokeLinecap="round" fill="none" />
      <Path d={`M ${lx} ${crown} C ${lx - tw * 0.18} ${crown - tw * 0.68}, ${lx - tw * 0.50} ${crown - tw * 0.90}, ${lx - tw * 0.52} ${crown - tw * 0.60}`}
        stroke={color} strokeWidth={sw * 0.60} strokeLinecap="round" fill="none" />
      <Path d={`M ${lx} ${crown} C ${lx - tw * 0.45} ${crown - tw * 0.32}, ${lx - tw} ${crown + tw * 0.06}, ${lx - tw} ${crown + tw * 0.42}`}
        stroke={color} strokeWidth={sw * 0.65} strokeLinecap="round" fill="none" />
    </G>
  );
}

export default function MidnightBeachBackground() {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Svg width={W} height={H} viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="xMidYMid meet">
        <Defs>
          <LinearGradient id="mbSky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%"   stopColor="#02030E" stopOpacity="1" />
            <Stop offset="50%"  stopColor="#040718" stopOpacity="1" />
            <Stop offset="100%" stopColor="#030410" stopOpacity="1" />
          </LinearGradient>
          <RadialGradient id="mbPurple" cx="50%" cy="40%" r="60%">
            <Stop offset="0%"   stopColor="#1A0040" stopOpacity="0.22" />
            <Stop offset="100%" stopColor="#000000"  stopOpacity="0.00" />
          </RadialGradient>
          <RadialGradient id="mbPinkFoot" cx="18%" cy="95%" r="30%">
            <Stop offset="0%"   stopColor="#FF2FAE" stopOpacity="0.10" />
            <Stop offset="100%" stopColor="#000000"  stopOpacity="0.00" />
          </RadialGradient>
        </Defs>

        {/* Background */}
        <Rect x={0} y={0} width={VW} height={VH} fill="url(#mbSky)" />
        <Rect x={0} y={0} width={VW} height={VH} fill="url(#mbPurple)" />
        <Rect x={0} y={0} width={VW} height={VH} fill="url(#mbPinkFoot)" />

        {/* ── Tiny scattered stars ──────────────────────────────────────── */}
        {STARS.map((s, i) => (
          <Circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#FFFFFF" opacity={s.op} />
        ))}

        {/* ── Vaporwave horizon lines ───────────────────────────────────── */}
        <Path d={`M 0 ${VH * 0.865} L ${VW} ${VH * 0.865}`}
          stroke="#00D4FF" strokeWidth={1.0} strokeOpacity={0.22} />
        <Path d={`M 0 ${VH * 0.875} L ${VW} ${VH * 0.875}`}
          stroke="#00D4FF" strokeWidth={0.6} strokeOpacity={0.14} />
        <Path d={`M 0 ${VH * 0.883} L ${VW} ${VH * 0.883}`}
          stroke="#FF2FAE" strokeWidth={0.5} strokeOpacity={0.10} />

        {/* ── Large neon flamingo — bottom-left ────────────────────────── */}
        <NeonFlamingo ox={72} oy={VH} s={2.3} color="#FF2FAE" op={0.55} />

        {/* ── Dark navy palm trees — bottom-right (background accent) ─── */}
        <NeonPalm cx={VW - 60} baseY={VH}  h={220} lean={-15} color="#003850" op={0.65} sw={3.0} />
        <NeonPalm cx={VW - 28} baseY={VH}  h={165} lean={22}  color="#002840" op={0.38} sw={2.0} />
      </Svg>
    </View>
  );
}
