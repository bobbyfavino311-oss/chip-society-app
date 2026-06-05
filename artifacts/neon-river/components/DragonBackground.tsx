/**
 * DragonBackground — Minimal Dragon Dynasty
 * Deep black/crimson atmosphere. Subtle embossed dragon (left),
 * prosperity coin (right), cloud motifs (top corners).
 * No giant art. Gameplay always first.
 */
import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
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

// ─── Traditional Chinese cloud (ruyi) motif ────────────────────────────────────
function CloudMotif({ x, y, scale = 1, flip = false, op = 0.22 }: {
  x: number; y: number; scale?: number; flip?: boolean; op?: number;
}) {
  const s = scale;
  const fx = flip ? -1 : 1;
  const color = '#8B0000';
  return (
    <G opacity={op}>
      <Path
        d={`M ${x} ${y}
          C ${x+fx*8*s} ${y-10*s}, ${x+fx*18*s} ${y-8*s}, ${x+fx*16*s} ${y}
          C ${x+fx*24*s} ${y-4*s}, ${x+fx*32*s} ${y+2*s}, ${x+fx*28*s} ${y+10*s}
          C ${x+fx*36*s} ${y+6*s}, ${x+fx*44*s} ${y+12*s}, ${x+fx*38*s} ${y+20*s}
          C ${x+fx*28*s} ${y+22*s}, ${x+fx*12*s} ${y+18*s}, ${x} ${y+20*s}`}
        stroke={color} strokeWidth={1.6*s} fill={color} fillOpacity={0.30} strokeOpacity={0.50}
        strokeLinejoin="round" strokeLinecap="round"
      />
      {/* Second cloud puff below */}
      <Path
        d={`M ${x+fx*10*s} ${y+20*s}
          C ${x+fx*16*s} ${y+28*s}, ${x+fx*26*s} ${y+26*s}, ${x+fx*30*s} ${y+34*s}
          C ${x+fx*36*s} ${y+30*s}, ${x+fx*44*s} ${y+35*s}, ${x+fx*40*s} ${y+44*s}
          C ${x+fx*30*s} ${y+46*s}, ${x+fx*18*s} ${y+42*s}, ${x+fx*10*s} ${y+44*s}`}
        stroke={color} strokeWidth={1.4*s} fill={color} fillOpacity={0.22} strokeOpacity={0.42}
        strokeLinejoin="round" strokeLinecap="round"
      />
    </G>
  );
}

// ─── Prosperity coin ──────────────────────────────────────────────────────────
function ProsperityCoin({ cx, cy, r, op = 0.14 }: {
  cx: number; cy: number; r: number; op?: number;
}) {
  const holeR = r * 0.28;
  const color = '#8B0000';
  const gold   = '#C89B3C';
  return (
    <G opacity={op}>
      {/* Outer ring */}
      <Circle cx={cx} cy={cy} r={r}
        fill={color} fillOpacity={0.35} stroke={gold} strokeWidth={1.5} strokeOpacity={0.55} />
      {/* Inner ring */}
      <Circle cx={cx} cy={cy} r={r * 0.78}
        fill="none" stroke={gold} strokeWidth={0.8} strokeOpacity={0.45} />
      {/* Square centre hole — simulated with 4 lines */}
      <Rect
        x={cx - holeR} y={cy - holeR}
        width={holeR * 2} height={holeR * 2}
        fill="#0D0000" stroke={gold} strokeWidth={1.2} strokeOpacity={0.60}
      />
      {/* 4 small tick marks around ring (cardinal positions) */}
      {[0, 90, 180, 270].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const mx = cx + Math.cos(rad) * r * 0.88;
        const my = cy + Math.sin(rad) * r * 0.88;
        const ix = cx + Math.cos(rad) * r * 0.72;
        const iy = cy + Math.sin(rad) * r * 0.72;
        return (
          <Path key={deg}
            d={`M ${mx} ${my} L ${ix} ${iy}`}
            stroke={gold} strokeWidth={1.2} strokeOpacity={0.50} />
        );
      })}
    </G>
  );
}

// ─── Simplified Chinese dragon silhouette ─────────────────────────────────────
// Coiling body, rendered as layered strokes for an embossed feel
const BODY = [
  'M 58 810',
  'C 12 760, 5 705, 28 650',
  'C 52 595, 120 588, 108 535',
  'C 96 482, 45 462, 70 415',
  'C 95 368, 148 362, 155 325',
  'C 162 288, 138 265, 158 245',
].join(' ');

// Scale arc rows — positions along the body for decorative scale arcs
const SCALE_ROWS = [
  { cx: 40, cy: 724, r: 20, a: -20 },
  { cx: 70, cy: 665, r: 18, a: 15 },
  { cx: 112, cy: 613, r: 17, a: -10 },
  { cx: 102, cy: 562, r: 16, a: 5 },
  { cx: 62, cy: 517, r: 15, a: -15 },
  { cx: 82, cy: 472, r: 14, a: 10 },
  { cx: 112, cy: 428, r: 13, a: -5 },
  { cx: 130, cy: 388, r: 12, a: 8 },
  { cx: 142, cy: 350, r: 11, a: -8 },
];

// Dragon head — horn + snout at top of body
function DragonHead({ x, y }: { x: number; y: number }) {
  const GOLD = '#C89B3C';
  const RED  = '#8B0000';
  return (
    <G opacity={0.38}>
      {/* Snout */}
      <Path d={`M ${x-18} ${y+8} C ${x-22} ${y-4}, ${x-8} ${y-14}, ${x+8} ${y-10} C ${x+18} ${y-6}, ${x+20} ${y+6}, ${x+10} ${y+12} Z`}
        fill={RED} fillOpacity={0.60} stroke={GOLD} strokeWidth={0.8} strokeOpacity={0.40} />
      {/* Left horn */}
      <Path d={`M ${x-10} ${y-10} C ${x-16} ${y-24}, ${x-8} ${y-36}, ${x-4} ${y-32}`}
        stroke={GOLD} strokeWidth={1.8} strokeLinecap="round" fill="none" strokeOpacity={0.50} />
      {/* Right horn */}
      <Path d={`M ${x+4} ${y-8} C ${x+10} ${y-22}, ${x+18} ${y-32}, ${x+14} ${y-28}`}
        stroke={GOLD} strokeWidth={1.8} strokeLinecap="round" fill="none" strokeOpacity={0.45} />
      {/* Whisker left */}
      <Path d={`M ${x-18} ${y+2} C ${x-36} ${y-8}, ${x-42} ${y+4}, ${x-38} ${y+12}`}
        stroke={RED} strokeWidth={1.2} strokeLinecap="round" fill="none" strokeOpacity={0.40} />
      {/* Eye glow */}
      <Circle cx={x-4} cy={y-2} r={4} fill={GOLD} fillOpacity={0.30} />
      <Circle cx={x-4} cy={y-2} r={2} fill={GOLD} fillOpacity={0.55} />
    </G>
  );
}

export default function DragonBackground() {
  const GOLD = '#C89B3C';
  const RED  = '#8B0000';
  const DARK = '#0D0000';

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Svg width={W} height={H} viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="xMidYMid meet">
        <Defs>
          <LinearGradient id="dbBg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%"   stopColor="#0A0000" stopOpacity="1" />
            <Stop offset="50%"  stopColor="#0E0101" stopOpacity="1" />
            <Stop offset="100%" stopColor="#080000" stopOpacity="1" />
          </LinearGradient>
          <RadialGradient id="dbDragonGlow" cx="22%" cy="72%" r="45%">
            <Stop offset="0%"   stopColor={RED} stopOpacity="0.18" />
            <Stop offset="100%" stopColor="#000000" stopOpacity="0.00" />
          </RadialGradient>
          <RadialGradient id="dbTopGlow" cx="50%" cy="0%" r="45%">
            <Stop offset="0%"   stopColor={RED} stopOpacity="0.10" />
            <Stop offset="100%" stopColor="#000000" stopOpacity="0.00" />
          </RadialGradient>
          <RadialGradient id="dbHeadGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%"   stopColor={GOLD} stopOpacity="0.20" />
            <Stop offset="100%" stopColor="#000000" stopOpacity="0.00" />
          </RadialGradient>
        </Defs>

        {/* Background */}
        <Rect x={0} y={0} width={VW} height={VH} fill="url(#dbBg)" />
        <Rect x={0} y={0} width={VW} height={VH} fill="url(#dbDragonGlow)" />
        <Rect x={0} y={0} width={VW} height={VH} fill="url(#dbTopGlow)" />

        {/* ── Top-left cloud motif ──────────────────────────────────────── */}
        <CloudMotif x={10} y={18} scale={1.0} op={0.28} />

        {/* ── Top-right cloud motif ─────────────────────────────────────── */}
        <CloudMotif x={VW - 10} y={18} scale={1.0} flip op={0.28} />

        {/* ── Dragon body — ambient shadow layer ───────────────────────── */}
        <Path d={BODY} stroke={DARK} strokeWidth={100} strokeLinecap="round"
          strokeLinejoin="round" fill="none" opacity={0.40} />

        {/* ── Dragon body — deep red fill ──────────────────────────────── */}
        <Path d={BODY} stroke={RED} strokeWidth={60} strokeLinecap="round"
          strokeLinejoin="round" fill="none" opacity={0.22} />

        {/* ── Dragon body — ridge line ─────────────────────────────────── */}
        <Path d={BODY} stroke="#B80000" strokeWidth={28} strokeLinecap="round"
          strokeLinejoin="round" fill="none" opacity={0.28} />

        {/* ── Dragon body — gold edge highlight ───────────────────────── */}
        <Path d={BODY} stroke={GOLD} strokeWidth={1.0} strokeLinecap="round"
          strokeLinejoin="round" fill="none" opacity={0.18} />

        {/* ── Scale arc rows ───────────────────────────────────────────── */}
        {SCALE_ROWS.map((sc, i) => (
          <G key={i} opacity={0.32}>
            {/* Outer arc */}
            <Path
              d={`M ${sc.cx - sc.r} ${sc.cy} A ${sc.r} ${sc.r * 0.55} 0 0 1 ${sc.cx + sc.r} ${sc.cy}`}
              fill={RED} fillOpacity={0.45}
              stroke={GOLD} strokeWidth={0.5} strokeOpacity={0.40}
            />
            {/* Inner arc (scale detail) */}
            <Path
              d={`M ${sc.cx - sc.r*0.55} ${sc.cy - 2} A ${sc.r*0.55} ${sc.r*0.32} 0 0 1 ${sc.cx + sc.r*0.55} ${sc.cy - 2}`}
              fill="none" stroke={RED} strokeWidth={0.6} strokeOpacity={0.50}
            />
          </G>
        ))}

        {/* ── Dragon head glow ─────────────────────────────────────────── */}
        <Ellipse cx={148} cy={265} rx={55} ry={38} fill="url(#dbHeadGlow)" />

        {/* ── Dragon head ──────────────────────────────────────────────── */}
        <DragonHead x={152} y={258} />

        {/* ── Dragon claw hints along body ────────────────────────────── */}
        {[
          { x: 26, y: 660, dir: -1 },
          { x: 30, y: 545, dir: 1 },
          { x: 55, y: 440, dir: -1 },
        ].map(({ x, y, dir }, i) => (
          <G key={i} opacity={0.28}>
            <Path d={`M ${x} ${y} L ${x + dir * 18} ${y + 12} M ${x} ${y} L ${x + dir * 14} ${y + 20} M ${x} ${y} L ${x + dir * 8} ${y + 22}`}
              stroke={GOLD} strokeWidth={1.2} strokeLinecap="round" fill="none" strokeOpacity={0.55} />
          </G>
        ))}

        {/* ── Prosperity coin — right side ─────────────────────────────── */}
        <ProsperityCoin cx={VW - 52} cy={VH * 0.62} r={44} op={0.18} />

        {/* ── Small secondary coin accent ──────────────────────────────── */}
        <ProsperityCoin cx={VW - 38} cy={VH * 0.38} r={24} op={0.12} />

        {/* ── Bottom vignette for gameplay readability ─────────────────── */}
        <Rect x={0} y={VH * 0.70} width={VW} height={VH * 0.30}
          fill="#000000" fillOpacity={0.20} />
      </Svg>
    </View>
  );
}
