/**
 * ViceBackground — Miami Vice / Ocean Drive night atmosphere
 * Reference: dark purple sky, palm silhouettes, crimson horizon glow,
 * HOTEL pink vertical sign, OCEAN DRIVE cyan sign, wet reflective pavement
 */
import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

const { width: W, height: H } = Dimensions.get('window');
const VW = 390;
const VH = 844;

// ─── Deterministic star generator ────────────────────────────────────────────
function buildStars(count: number) {
  const stars: { x: number; y: number; r: number; op: number }[] = [];
  let seed = 7;
  const rng = () => { seed = (seed * 1664525 + 1013904223) & 0x7fffffff; return seed / 0x7fffffff; };
  for (let i = 0; i < count; i++) {
    stars.push({
      x: rng() * VW,
      y: rng() * VH * 0.52,
      r: 0.4 + rng() * 0.8,
      op: 0.35 + rng() * 0.55,
    });
  }
  return stars;
}
const STARS = buildStars(90);

// ─── Single palm tree ─────────────────────────────────────────────────────────
function Palm({ cx, baseY, h, lean = 0, scale = 1, opacity = 1 }: {
  cx: number; baseY: number; h: number; lean?: number; scale?: number; opacity?: number;
}) {
  const crown = baseY - h;
  const tw = h * 0.55 * scale;
  return (
    <G opacity={opacity}>
      {/* Trunk */}
      <Path
        d={`M ${cx - 2} ${baseY} C ${cx + lean * 0.3} ${baseY - h * 0.5}, ${cx + lean - 3} ${crown + h * 0.15}, ${cx + lean} ${crown}`}
        stroke="#050008" strokeWidth={4 * scale} strokeLinecap="round" fill="none" strokeOpacity={0.95}
      />
      {/* Dark fronds */}
      <Path d={`M ${cx + lean} ${crown} C ${cx + lean + tw * 0.45} ${crown - tw * 0.35}, ${cx + lean + tw} ${crown + tw * 0.05}, ${cx + lean + tw} ${crown + tw * 0.45}`}
        stroke="#050008" strokeWidth={2.2 * scale} strokeLinecap="round" fill="none" strokeOpacity={0.9} />
      <Path d={`M ${cx + lean} ${crown} C ${cx + lean + tw * 0.2} ${crown - tw * 0.75}, ${cx + lean + tw * 0.55} ${crown - tw}, ${cx + lean + tw * 0.58} ${crown - tw * 0.65}`}
        stroke="#050008" strokeWidth={2 * scale} strokeLinecap="round" fill="none" strokeOpacity={0.9} />
      <Path d={`M ${cx + lean} ${crown} C ${cx + lean} ${crown - tw * 0.85}, ${cx + lean} ${crown - tw * 1.15}, ${cx + lean} ${crown - tw}`}
        stroke="#050008" strokeWidth={2 * scale} strokeLinecap="round" fill="none" strokeOpacity={0.9} />
      <Path d={`M ${cx + lean} ${crown} C ${cx + lean - tw * 0.2} ${crown - tw * 0.75}, ${cx + lean - tw * 0.55} ${crown - tw}, ${cx + lean - tw * 0.58} ${crown - tw * 0.65}`}
        stroke="#050008" strokeWidth={2 * scale} strokeLinecap="round" fill="none" strokeOpacity={0.9} />
      <Path d={`M ${cx + lean} ${crown} C ${cx + lean - tw * 0.45} ${crown - tw * 0.35}, ${cx + lean - tw} ${crown + tw * 0.05}, ${cx + lean - tw} ${crown + tw * 0.45}`}
        stroke="#050008" strokeWidth={2.2 * scale} strokeLinecap="round" fill="none" strokeOpacity={0.9} />
    </G>
  );
}

// ─── Vertical HOTEL sign ──────────────────────────────────────────────────────
function HotelSign({ x, y }: { x: number; y: number }) {
  const letters = ['H', 'O', 'T', 'E', 'L'];
  return (
    <G>
      <Rect x={x - 9} y={y} width={18} height={letters.length * 22 + 8} rx={3}
        fill="#020008" fillOpacity={0.88} stroke="#FF2FAE" strokeWidth={1.0} strokeOpacity={0.55} />
      {letters.map((l, i) => (
        <SvgText key={l} x={x} y={y + 20 + i * 22} fill="#FF2FAE" fontSize={14}
          fontWeight="bold" textAnchor="middle" opacity={0.90}>
          {l}
        </SvgText>
      ))}
    </G>
  );
}

// ─── OCEAN DRIVE neon sign ─────────────────────────────────────────────────────
function OceanDriveSign({ x, y }: { x: number; y: number }) {
  const w = 110; const h = 42;
  return (
    <G>
      <Rect x={x - 4} y={y - 4} width={w + 8} height={h + 8} rx={8}
        fill="none" stroke="#00E5FF" strokeWidth={0.5} strokeOpacity={0.22} />
      <Rect x={x} y={y} width={w} height={h} rx={5}
        fill="#040010" fillOpacity={0.92} stroke="#00E5FF" strokeWidth={1.4} strokeOpacity={0.80} />
      <Rect x={x + 3} y={y + 2} width={w - 6} height={1}
        fill="#00E5FF" fillOpacity={0.20} />
      <Rect x={x + 3} y={y + h - 3} width={w - 6} height={1}
        fill="#FF2FAE" fillOpacity={0.20} />
      <SvgText x={x + w / 2} y={y + 16} fill="#00E5FF" fontSize={11}
        fontWeight="bold" textAnchor="middle" letterSpacing={3} opacity={0.95}>
        OCEAN
      </SvgText>
      <SvgText x={x + w / 2} y={y + 31} fill="#FF2FAE" fontSize={12}
        fontWeight="bold" textAnchor="middle" letterSpacing={2.5} opacity={0.95}>
        DRIVE
      </SvgText>
    </G>
  );
}

// ─── Art-deco building silhouette ─────────────────────────────────────────────
function Buildings() {
  const bldgs = [
    { x: 30,  w: 35, h: 80 },
    { x: 68,  w: 50, h: 110 },
    { x: 122, w: 28, h: 65 },
    { x: 154, w: 55, h: 130 },
    { x: 213, w: 40, h: 95 },
    { x: 257, w: 60, h: 145 },
    { x: 322, w: 35, h: 90 },
    { x: 360, w: 30, h: 70 },
  ];
  const horizonY = VH * 0.62;
  return (
    <G>
      {bldgs.map((b, i) => (
        <Rect key={i} x={b.x} y={horizonY - b.h} width={b.w} height={b.h}
          fill="#04000A" fillOpacity={0.75} />
      ))}
      {/* Stepped Art Deco tops */}
      <Rect x={154} y={horizonY - 130} width={14} height={20} fill="#04000A" fillOpacity={0.75} />
      <Rect x={160} y={horizonY - 145} width={8} height={15} fill="#04000A" fillOpacity={0.75} />
      <Rect x={257} y={horizonY - 145} width={20} height={25} fill="#04000A" fillOpacity={0.75} />
      <Rect x={262} y={horizonY - 162} width={10} height={17} fill="#04000A" fillOpacity={0.75} />
    </G>
  );
}

export default function ViceBackground() {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Svg width={W} height={H} viewBox={`0 0 ${VW} ${VH}`}
        preserveAspectRatio="xMidYMid meet">
        <Defs>
          {/* Deep purple sky */}
          <LinearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%"   stopColor="#080015" stopOpacity="1" />
            <Stop offset="35%"  stopColor="#0E0030" stopOpacity="1" />
            <Stop offset="60%"  stopColor="#1A0040" stopOpacity="1" />
            <Stop offset="100%" stopColor="#050010" stopOpacity="1" />
          </LinearGradient>

          {/* Crimson-purple horizon glow */}
          <RadialGradient id="horizonGlow" cx="50%" cy="63%" r="60%">
            <Stop offset="0%"   stopColor="#9B0040" stopOpacity="0.70" />
            <Stop offset="20%"  stopColor="#660030" stopOpacity="0.45" />
            <Stop offset="50%"  stopColor="#3A0060" stopOpacity="0.22" />
            <Stop offset="100%" stopColor="#000000"  stopOpacity="0.00" />
          </RadialGradient>

          {/* Upper purple atmospheric glow */}
          <RadialGradient id="upperGlow" cx="50%" cy="15%" r="55%">
            <Stop offset="0%"   stopColor="#4B0080" stopOpacity="0.30" />
            <Stop offset="100%" stopColor="#000000"  stopOpacity="0.00" />
          </RadialGradient>

          {/* Wet pavement gradient */}
          <LinearGradient id="pavementGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%"   stopColor="#050010" stopOpacity="1" />
            <Stop offset="40%"  stopColor="#080018" stopOpacity="1" />
            <Stop offset="100%" stopColor="#020008" stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* ── Sky ────────────────────────────────────────────────────── */}
        <Rect x={0} y={0} width={VW} height={VH} fill="url(#skyGrad)" />
        <Rect x={0} y={0} width={VW} height={VH} fill="url(#upperGlow)" />
        <Rect x={0} y={0} width={VW} height={VH} fill="url(#horizonGlow)" />

        {/* ── Stars ──────────────────────────────────────────────────── */}
        {STARS.map((s, i) => (
          <Circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#FFFFFF" opacity={s.op} />
        ))}

        {/* ── Buildings ─────────────────────────────────────────────── */}
        <Buildings />

        {/* ── Window lights on buildings ─────────────────────────── */}
        {[
          { x: 75,  y: VH * 0.48 }, { x: 85,  y: VH * 0.52 },
          { x: 163, y: VH * 0.44 }, { x: 175, y: VH * 0.50 },
          { x: 270, y: VH * 0.42 }, { x: 282, y: VH * 0.47 }, { x: 294, y: VH * 0.42 },
          { x: 270, y: VH * 0.52 }, { x: 282, y: VH * 0.57 },
        ].map((w, i) => (
          <Rect key={i} x={w.x} y={w.y} width={4} height={3}
            fill={i % 2 === 0 ? '#FF2FAE' : '#00E5FF'} opacity={0.28} />
        ))}

        {/* ── HOTEL sign ─────────────────────────────────────────── */}
        <HotelSign x={22} y={280} />

        {/* ── OCEAN DRIVE sign ───────────────────────────────────── */}
        <OceanDriveSign x={262} y={195} />

        {/* ── Horizon glow line ──────────────────────────────────── */}
        <Line x1={0} y1={VH * 0.625} x2={VW} y2={VH * 0.625}
          stroke="#CC0060" strokeWidth={1.2} strokeOpacity={0.35} />

        {/* ── PALM TREES — back layer (small, faded) ─────────────── */}
        <Palm cx={45}  baseY={VH * 0.63} h={130} lean={-8}  scale={0.85} opacity={0.55} />
        <Palm cx={100} baseY={VH * 0.63} h={110} lean={5}   scale={0.80} opacity={0.50} />
        <Palm cx={160} baseY={VH * 0.63} h={120} lean={-4}  scale={0.80} opacity={0.48} />
        <Palm cx={240} baseY={VH * 0.63} h={105} lean={6}   scale={0.75} opacity={0.50} />
        <Palm cx={310} baseY={VH * 0.63} h={115} lean={-5}  scale={0.78} opacity={0.48} />
        <Palm cx={360} baseY={VH * 0.63} h={100} lean={4}   scale={0.72} opacity={0.45} />

        {/* ── PALM TREES — mid layer ─────────────────────────────── */}
        <Palm cx={18}  baseY={VH * 0.72} h={185} lean={-12} scale={1.0} opacity={0.80} />
        <Palm cx={80}  baseY={VH * 0.72} h={200} lean={8}   scale={1.0} opacity={0.85} />
        <Palm cx={190} baseY={VH * 0.72} h={175} lean={-6}  scale={0.95} opacity={0.78} />
        <Palm cx={280} baseY={VH * 0.72} h={195} lean={10}  scale={1.0} opacity={0.82} />
        <Palm cx={370} baseY={VH * 0.72} h={180} lean={-8}  scale={0.95} opacity={0.75} />

        {/* ── PALM TREES — foreground layer (large, dark) ────────── */}
        <Palm cx={0}   baseY={VH * 0.84} h={260} lean={-18} scale={1.3} opacity={0.92} />
        <Palm cx={130} baseY={VH * 0.84} h={290} lean={12}  scale={1.4} opacity={0.95} />
        <Palm cx={260} baseY={VH * 0.84} h={270} lean={-10} scale={1.3} opacity={0.90} />
        <Palm cx={390} baseY={VH * 0.84} h={255} lean={15}  scale={1.3} opacity={0.88} />

        {/* ── Wet pavement ───────────────────────────────────────── */}
        <Rect x={0} y={VH * 0.73} width={VW} height={VH * 0.27} fill="url(#pavementGrad)" />

        {/* ── Neon reflections in wet street ─────────────────────── */}
        {/* Hotel sign reflection */}
        <Path d="M 22 660 C 24 690, 20 715, 22 748"
          stroke="#FF2FAE" strokeWidth={1.2} strokeLinecap="round"
          fill="none" strokeOpacity={0.25} />
        {/* OCEAN DRIVE reflection */}
        <Path d="M 318 660 C 320 690, 316 715, 318 748"
          stroke="#00E5FF" strokeWidth={1.0} strokeLinecap="round"
          fill="none" strokeOpacity={0.22} />
        {/* Wide pink glow on pavement */}
        <Ellipse cx={195} cy={760} rx={200} ry={30}
          fill="#9B0040" fillOpacity={0.12} />
        {/* Cyan glow on pavement */}
        <Ellipse cx={300} cy={770} rx={120} ry={20}
          fill="#00E5FF" fillOpacity={0.06} />
        {/* Vertical reflection streaks */}
        {[40, 100, 160, 220, 280, 340].map((xr, i) => (
          <Line key={i} x1={xr} y1={680} x2={xr + (i % 2 === 0 ? 2 : -1)} y2={750}
            stroke={i % 3 === 0 ? '#FF2FAE' : '#00E5FF'} strokeWidth={0.6}
            strokeOpacity={0.12} />
        ))}

        {/* ── Overall darkness vignette ───────────────────────────── */}
        <Rect x={0} y={0} width={VW} height={VH} fill="#000000" fillOpacity={0.18} />
      </Svg>
    </View>
  );
}
