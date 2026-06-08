/**
 * MasqueradeBackground — ROYAL MASQUERADE
 * Deep royal purple atmosphere with a central masquerade mask silhouette,
 * soft spotlight glow, elegant geometric lattice, and Art Nouveau corner flourishes.
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
} from 'react-native-svg';

const { width: W, height: H } = Dimensions.get('window');
const VW = 390;
const VH = 844;

const GOLD   = '#D4AF37';
const PURPLE = '#3D0070';

// ─── Art Nouveau corner flourish ─────────────────────────────────────────────
function CornerFlourish({ x, y, flipX = false, flipY = false }: {
  x: number; y: number; flipX?: boolean; flipY?: boolean;
}) {
  const sx = flipX ? -1 : 1;
  const sy = flipY ? -1 : 1;
  return (
    <G opacity={0.35}>
      {/* Main arm horizontal */}
      <Path
        d={`M ${x} ${y} C ${x + sx * 28} ${y + sy * 2}, ${x + sx * 46} ${y + sy * 14}, ${x + sx * 52} ${y + sy * 36}`}
        stroke={GOLD} strokeWidth={1.2} fill="none" strokeLinecap="round"
      />
      {/* Main arm vertical */}
      <Path
        d={`M ${x} ${y} C ${x + sx * 2} ${y + sy * 28}, ${x + sx * 14} ${y + sy * 46}, ${x + sx * 36} ${y + sy * 52}`}
        stroke={GOLD} strokeWidth={1.2} fill="none" strokeLinecap="round"
      />
      {/* Inner curl horizontal */}
      <Path
        d={`M ${x + sx * 14} ${y + sy * 4} C ${x + sx * 28} ${y + sy * 6}, ${x + sx * 34} ${y + sy * 16}, ${x + sx * 32} ${y + sy * 28}`}
        stroke={GOLD} strokeWidth={0.7} fill="none" strokeLinecap="round" strokeOpacity={0.6}
      />
      {/* Corner diamond pip */}
      <Path
        d={`M ${x} ${y - sy * 5} L ${x + sx * 5} ${y} L ${x} ${y + sy * 5} L ${x - sx * 5} ${y} Z`}
        fill={GOLD} opacity={0.55}
      />
    </G>
  );
}

// ─── Masquerade half-mask silhouette ─────────────────────────────────────────
function MasqueradeMask() {
  // Outer mask perimeter — Venetian half-mask covering upper face area
  const MASK =
    'M 60 430 ' +
    'C 60 340, 112 292, 165 292 ' +
    'L 225 292 ' +
    'C 278 292, 330 340, 330 430 ' +
    'C 330 472, 300 490, 268 482 ' +
    'C 248 492, 220 500, 195 500 ' +
    'C 170 500, 142 492, 122 482 ' +
    'C 90 490, 60 472, 60 430 Z';

  // Ornamental forehead crest (small fan above mask top)
  const CREST =
    'M 178 292 C 178 268, 168 252, 175 242 ' +
    'M 195 292 C 195 262, 195 248, 195 238 ' +
    'M 212 292 C 212 268, 222 252, 215 242';

  // Handle stick on right side
  const HANDLE =
    'M 330 445 C 336 460, 340 480, 344 510 C 348 540, 350 580, 346 620';

  return (
    <G opacity={0.48}>
      {/* Mask body fill — translucent deep purple */}
      <Path d={MASK} fill="#1A0040" fillOpacity={0.70} />

      {/* Left eye hole — filled dark to read as void */}
      <Ellipse cx={148} cy={387} rx={37} ry={25}
        fill="#090018" fillOpacity={0.90} />

      {/* Right eye hole */}
      <Ellipse cx={242} cy={387} rx={37} ry={25}
        fill="#090018" fillOpacity={0.90} />

      {/* Left eyebrow arch above left eye */}
      <Path d="M 111 370 C 128 348, 162 346, 186 362"
        stroke={GOLD} strokeWidth={1.0} fill="none" strokeLinecap="round" strokeOpacity={0.50} />

      {/* Right eyebrow arch */}
      <Path d="M 204 362 C 228 346, 262 348, 279 370"
        stroke={GOLD} strokeWidth={1.0} fill="none" strokeLinecap="round" strokeOpacity={0.50} />

      {/* Mask outline — gold stroke */}
      <Path d={MASK}
        stroke={GOLD} strokeWidth={1.4} fill="none" strokeOpacity={0.75} />

      {/* Eye hole outlines */}
      <Ellipse cx={148} cy={387} rx={37} ry={25}
        fill="none" stroke={GOLD} strokeWidth={0.9} strokeOpacity={0.50} />
      <Ellipse cx={242} cy={387} rx={37} ry={25}
        fill="none" stroke={GOLD} strokeWidth={0.9} strokeOpacity={0.50} />

      {/* Left eye corner filigree */}
      <Path d="M 111 387 C 104 384, 100 378, 103 372"
        stroke={GOLD} strokeWidth={0.8} fill="none" strokeOpacity={0.50} />
      <Path d="M 111 387 C 104 390, 100 396, 103 402"
        stroke={GOLD} strokeWidth={0.8} fill="none" strokeOpacity={0.50} />

      {/* Right eye corner filigree */}
      <Path d="M 279 387 C 286 384, 290 378, 287 372"
        stroke={GOLD} strokeWidth={0.8} fill="none" strokeOpacity={0.50} />
      <Path d="M 279 387 C 286 390, 290 396, 287 402"
        stroke={GOLD} strokeWidth={0.8} fill="none" strokeOpacity={0.50} />

      {/* Nose bridge ornament (centre, below eye holes) */}
      <Path d="M 176 412 C 185 420, 205 420, 214 412"
        stroke={GOLD} strokeWidth={0.8} fill="none" strokeOpacity={0.40} />

      {/* Forehead crest lines */}
      <Path d={CREST}
        stroke={GOLD} strokeWidth={0.9} fill="none" strokeLinecap="round" strokeOpacity={0.45} />

      {/* Crest top ornament */}
      <Circle cx={195} cy={236} r={4}
        fill="none" stroke={GOLD} strokeWidth={1.0} strokeOpacity={0.50} />
      <Circle cx={195} cy={236} r={1.5} fill={GOLD} opacity={0.60} />

      {/* Thin handle */}
      <Path d={HANDLE}
        stroke={GOLD} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeOpacity={0.35} />
      {/* Handle grip wrap */}
      {[470, 490, 510, 530, 550, 570, 590].map((y, i) => (
        <Path key={i}
          d={`M ${342 - i * 0.5} ${y} L ${346 + i * 0.2} ${y + 6}`}
          stroke={GOLD} strokeWidth={0.8} strokeOpacity={0.25} strokeLinecap="round" />
      ))}
    </G>
  );
}

// ─── Subtle geometric diamond lattice ────────────────────────────────────────
function DiamondLattice() {
  const cellW = 55;
  const cellH = 55;
  const cols = Math.ceil(VW / cellW) + 1;
  const rows = Math.ceil(VH / cellH) + 1;
  const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let row = -1; row < rows; row++) {
    for (let col = -1; col < cols; col++) {
      const ox = col * cellW + (row % 2 === 0 ? 0 : cellW / 2);
      const oy = row * cellH;
      lines.push({ x1: ox + cellW / 2, y1: oy, x2: ox + cellW, y2: oy + cellH / 2 });
      lines.push({ x1: ox + cellW, y1: oy + cellH / 2, x2: ox + cellW / 2, y2: oy + cellH });
      lines.push({ x1: ox + cellW / 2, y1: oy + cellH, x2: ox, y2: oy + cellH / 2 });
      lines.push({ x1: ox, y1: oy + cellH / 2, x2: ox + cellW / 2, y2: oy });
    }
  }
  return (
    <G opacity={0.055}>
      {lines.map((l, i) => (
        <Line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
          stroke={GOLD} strokeWidth={0.6} />
      ))}
    </G>
  );
}

export default function MasqueradeBackground() {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Svg
        width={W}
        height={H}
        viewBox={`0 0 ${VW} ${VH}`}
        preserveAspectRatio="xMidYMid slice"
      >
        <Defs>
          {/* Deep royal purple base */}
          <LinearGradient id="mqBg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%"   stopColor="#160028" stopOpacity="1" />
            <Stop offset="40%"  stopColor="#0C0018" stopOpacity="1" />
            <Stop offset="100%" stopColor="#100022" stopOpacity="1" />
          </LinearGradient>

          {/* Spotlight from upper-center — soft gold/white wash */}
          <RadialGradient id="mqSpotlight" cx="50%" cy="-5%" r="75%">
            <Stop offset="0%"   stopColor="#D4AF37" stopOpacity="0.12" />
            <Stop offset="45%"  stopColor="#8B40CC" stopOpacity="0.06" />
            <Stop offset="100%" stopColor="#000000" stopOpacity="0.00" />
          </RadialGradient>

          {/* Secondary soft glow — lower purple bloom */}
          <RadialGradient id="mqBloom" cx="50%" cy="100%" r="65%">
            <Stop offset="0%"   stopColor="#5B00A0" stopOpacity="0.18" />
            <Stop offset="100%" stopColor="#000000" stopOpacity="0.00" />
          </RadialGradient>

          {/* Center ambient for mask area */}
          <RadialGradient id="mqCenter" cx="50%" cy="52%" r="40%">
            <Stop offset="0%"   stopColor="#3D0070" stopOpacity="0.22" />
            <Stop offset="100%" stopColor="#000000" stopOpacity="0.00" />
          </RadialGradient>
        </Defs>

        {/* ── Base background ───────────────────────────────────────────── */}
        <Rect x={0} y={0} width={VW} height={VH} fill="url(#mqBg)" />
        <Rect x={0} y={0} width={VW} height={VH} fill="url(#mqSpotlight)" />
        <Rect x={0} y={0} width={VW} height={VH} fill="url(#mqBloom)" />
        <Rect x={0} y={0} width={VW} height={VH} fill="url(#mqCenter)" />

        {/* ── Subtle geometric diamond lattice ─────────────────────────── */}
        <DiamondLattice />

        {/* ── Horizontal atmosphere bands ───────────────────────────────── */}
        <Line x1={0} y1={VH * 0.32} x2={VW} y2={VH * 0.32}
          stroke={GOLD} strokeWidth={0.4} strokeOpacity={0.08} />
        <Line x1={0} y1={VH * 0.68} x2={VW} y2={VH * 0.68}
          stroke={GOLD} strokeWidth={0.4} strokeOpacity={0.08} />

        {/* ── Concentric oval frame around mask ────────────────────────── */}
        <Ellipse cx={VW / 2} cy={VH * 0.47} rx={175} ry={145}
          fill="none" stroke={PURPLE} strokeWidth={1} strokeOpacity={0.28} />
        <Ellipse cx={VW / 2} cy={VH * 0.47} rx={215} ry={180}
          fill="none" stroke={PURPLE} strokeWidth={0.6} strokeOpacity={0.18} />

        {/* ── Masquerade mask silhouette ────────────────────────────────── */}
        <MasqueradeMask />

        {/* ── Corner flourishes ─────────────────────────────────────────── */}
        <CornerFlourish x={16} y={16} />
        <CornerFlourish x={VW - 16} y={16} flipX />
        <CornerFlourish x={16} y={VH - 16} flipY />
        <CornerFlourish x={VW - 16} y={VH - 16} flipX flipY />

        {/* ── Left side gold accent line ────────────────────────────────── */}
        <Line x1={4} y1={VH * 0.22} x2={4} y2={VH * 0.78}
          stroke={GOLD} strokeWidth={1.0} strokeOpacity={0.18} />
        {/* ── Right side gold accent line ───────────────────────────────── */}
        <Line x1={VW - 4} y1={VH * 0.22} x2={VW - 4} y2={VH * 0.78}
          stroke={GOLD} strokeWidth={1.0} strokeOpacity={0.18} />

        {/* ── Bottom vignette for gameplay readability ──────────────────── */}
        <Rect x={0} y={VH * 0.62} width={VW} height={VH * 0.38}
          fill="#000000" fillOpacity={0.28} />

        {/* ── Top vignette ──────────────────────────────────────────────── */}
        <Rect x={0} y={0} width={VW} height={VH * 0.10}
          fill="#000000" fillOpacity={0.18} />
      </Svg>
    </View>
  );
}
