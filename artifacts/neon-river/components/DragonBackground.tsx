/**
 * DragonBackground — FOUR DRAGONS
 * Rich deep crimson atmosphere with sweeping curved arcs,
 * large auspicious cloud puffs, and scattered diamond suit symbols.
 * Matches the reference screenshot aesthetic.
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

// ─── Large auspicious cloud puff ──────────────────────────────────────────────
function CloudPuff({
  cx, cy, rx, ry, op = 0.45,
}: { cx: number; cy: number; rx: number; ry: number; op?: number }) {
  const R = '#7A0000';
  return (
    <G opacity={op}>
      {/* Main blob */}
      <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={R} />
      {/* Lobe top-left */}
      <Ellipse cx={cx - rx * 0.55} cy={cy - ry * 0.50} rx={rx * 0.60} ry={ry * 0.55} fill={R} />
      {/* Lobe top-right */}
      <Ellipse cx={cx + rx * 0.45} cy={cy - ry * 0.40} rx={rx * 0.50} ry={ry * 0.48} fill={R} />
      {/* Lobe bottom */}
      <Ellipse cx={cx - rx * 0.20} cy={cy + ry * 0.60} rx={rx * 0.65} ry={ry * 0.45} fill={R} />
    </G>
  );
}

// ─── Diamond suit symbol ───────────────────────────────────────────────────────
function Diamond({ cx, cy, w, h, op = 0.22 }: {
  cx: number; cy: number; w: number; h: number; op?: number;
}) {
  const pts = `${cx},${cy - h / 2} ${cx + w / 2},${cy} ${cx},${cy + h / 2} ${cx - w / 2},${cy}`;
  return (
    <Path
      d={`M ${cx} ${cy - h / 2} L ${cx + w / 2} ${cy} L ${cx} ${cy + h / 2} L ${cx - w / 2} ${cy} Z`}
      fill="#5C0000"
      opacity={op}
    />
  );
}

// ─── Sweeping arc band ────────────────────────────────────────────────────────
// Creates the dramatic S-curve river of red flowing through the screen
const SWEEP_D =
  'M -30 160 C 80 100, 220 80, 320 220 C 420 360, 260 480, 320 640 C 380 800, 460 820, 500 860';

export default function DragonBackground() {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Svg
        width={W}
        height={H}
        viewBox={`0 0 ${VW} ${VH}`}
        preserveAspectRatio="xMidYMid slice"
      >
        <Defs>
          {/* Rich deep-red base gradient */}
          <LinearGradient id="fourDrBg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%"   stopColor="#1C0000" stopOpacity="1" />
            <Stop offset="40%"  stopColor="#0E0000" stopOpacity="1" />
            <Stop offset="100%" stopColor="#160000" stopOpacity="1" />
          </LinearGradient>

          {/* Radial ambient glow — center */}
          <RadialGradient id="fourDrCenter" cx="50%" cy="45%" r="55%">
            <Stop offset="0%"   stopColor="#5A0000" stopOpacity="0.30" />
            <Stop offset="100%" stopColor="#000000" stopOpacity="0.00" />
          </RadialGradient>

          {/* Top atmospheric glow */}
          <RadialGradient id="fourDrTop" cx="40%" cy="0%" r="50%">
            <Stop offset="0%"   stopColor="#8B0000" stopOpacity="0.20" />
            <Stop offset="100%" stopColor="#000000" stopOpacity="0.00" />
          </RadialGradient>

          {/* Sweep arc gradient — brighter red core */}
          <LinearGradient id="fourDrSweep" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%"   stopColor="#CC0000" stopOpacity="0.55" />
            <Stop offset="50%"  stopColor="#990000" stopOpacity="0.40" />
            <Stop offset="100%" stopColor="#660000" stopOpacity="0.25" />
          </LinearGradient>
        </Defs>

        {/* ── Base background ───────────────────────────────────────────── */}
        <Rect x={0} y={0} width={VW} height={VH} fill="url(#fourDrBg)" />
        <Rect x={0} y={0} width={VW} height={VH} fill="url(#fourDrCenter)" />
        <Rect x={0} y={0} width={VW} height={VH} fill="url(#fourDrTop)" />

        {/* ── Sweeping arc — thick curved band (background layer) ───────── */}
        <Path
          d={SWEEP_D}
          stroke="#440000"
          strokeWidth={180}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity={0.55}
        />
        {/* Sweep — mid layer */}
        <Path
          d={SWEEP_D}
          stroke="#880000"
          strokeWidth={90}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity={0.42}
        />
        {/* Sweep — bright ridge */}
        <Path
          d={SWEEP_D}
          stroke="#BB0000"
          strokeWidth={28}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity={0.35}
        />

        {/* ── Large cloud puffs — bottom left ──────────────────────────── */}
        <CloudPuff cx={-20} cy={VH - 80}  rx={120} ry={90}  op={0.55} />
        <CloudPuff cx={70}  cy={VH - 20}  rx={100} ry={75}  op={0.50} />
        <CloudPuff cx={-30} cy={VH - 200} rx={90}  ry={70}  op={0.40} />

        {/* ── Cloud puff — upper left ───────────────────────────────────── */}
        <CloudPuff cx={-40} cy={140} rx={110} ry={80} op={0.30} />
        <CloudPuff cx={40}  cy={200} rx={80}  ry={60} op={0.22} />

        {/* ── Small cloud accent — bottom right ────────────────────────── */}
        <CloudPuff cx={VW + 30} cy={VH - 60}  rx={90} ry={70} op={0.35} />
        <CloudPuff cx={VW - 20} cy={VH - 180} rx={60} ry={45} op={0.25} />

        {/* ── Diamond suit strip — right edge ──────────────────────────── */}
        {[80, 160, 240, 320, 400, 480, 560, 640, 720, 800].map((y, i) => (
          <Diamond
            key={i}
            cx={VW - 28}
            cy={y}
            w={22}
            h={30}
            op={i % 2 === 0 ? 0.28 : 0.16}
          />
        ))}
        {/* Second column offset */}
        {[120, 200, 280, 360, 440, 520, 600, 680, 760].map((y, i) => (
          <Diamond
            key={`b${i}`}
            cx={VW - 52}
            cy={y}
            w={16}
            h={22}
            op={0.12}
          />
        ))}

        {/* ── Concentric atmospheric circle — upper area ───────────────── */}
        <Circle cx={VW * 0.42} cy={VH * 0.25} r={200}
          fill="none" stroke="#5C0000" strokeWidth={0.8} strokeOpacity={0.20} />
        <Circle cx={VW * 0.42} cy={VH * 0.25} r={150}
          fill="none" stroke="#6B0000" strokeWidth={0.6} strokeOpacity={0.18} />
        <Circle cx={VW * 0.42} cy={VH * 0.25} r={100}
          fill="none" stroke="#7A0000" strokeWidth={0.5} strokeOpacity={0.15} />

        {/* ── Bottom vignette for gameplay readability ──────────────────── */}
        <Rect x={0} y={VH * 0.65} width={VW} height={VH * 0.35}
          fill="#000000" fillOpacity={0.25} />

        {/* ── Top vignette ──────────────────────────────────────────────── */}
        <Rect x={0} y={0} width={VW} height={VH * 0.12}
          fill="#000000" fillOpacity={0.15} />
      </Svg>
    </View>
  );
}
