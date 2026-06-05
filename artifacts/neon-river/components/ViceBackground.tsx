/**
 * ViceBackground — cinematic Miami Vice poker table atmosphere
 * Render layers (back to front):
 *   Stars → Moon → City haze → Buildings (5 + silhouettes) →
 *   Neon sign rooflines → Windows → HOTEL sign → OCEAN DRIVE sign →
 *   Palm trees (3 layers) → Street → Sports car + reflection →
 *   Wet-pavement neon reflections
 */
import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient as SvgLinearGradient,
  Path,
  Polygon,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

const VW = 390;
const VH = 844;
const { width: W, height: H } = Dimensions.get('window');

const PINK  = '#FF2FAE';
const CYAN  = '#00E5FF';
const PURP  = '#7B00D4';
const GOLD  = '#FFB830';

// ─── Night sky stars ──────────────────────────────────────────────────────────
// Deterministic star field — no Math.random()
const STARS: { cx: number; cy: number; r: number; op: number }[] = [
  { cx:  18, cy:  22, r: 0.8, op: 0.7 }, { cx:  55, cy:  45, r: 0.6, op: 0.5 },
  { cx:  82, cy:  18, r: 0.9, op: 0.8 }, { cx: 110, cy:  60, r: 0.5, op: 0.4 },
  { cx: 140, cy:  30, r: 0.7, op: 0.6 }, { cx: 168, cy:  55, r: 0.6, op: 0.5 },
  { cx: 200, cy:  15, r: 0.9, op: 0.7 }, { cx: 235, cy:  40, r: 0.7, op: 0.6 },
  { cx: 265, cy:  22, r: 0.8, op: 0.8 }, { cx: 295, cy:  55, r: 0.5, op: 0.4 },
  { cx: 325, cy:  18, r: 0.7, op: 0.6 }, { cx: 358, cy:  42, r: 0.9, op: 0.7 },
  { cx:  35, cy:  80, r: 0.5, op: 0.4 }, { cx:  72, cy:  95, r: 0.7, op: 0.6 },
  { cx: 118, cy: 100, r: 0.6, op: 0.5 }, { cx: 155, cy:  85, r: 0.8, op: 0.7 },
  { cx: 188, cy: 105, r: 0.5, op: 0.4 }, { cx: 222, cy:  90, r: 0.7, op: 0.6 },
  { cx: 250, cy: 110, r: 0.6, op: 0.5 }, { cx: 285, cy:  80, r: 0.8, op: 0.7 },
  { cx: 315, cy: 100, r: 0.5, op: 0.4 }, { cx: 345, cy:  75, r: 0.7, op: 0.6 },
  { cx: 375, cy: 108, r: 0.6, op: 0.5 }, { cx:  10, cy: 130, r: 0.4, op: 0.3 },
  { cx:  48, cy: 145, r: 0.6, op: 0.5 }, { cx:  90, cy: 132, r: 0.5, op: 0.4 },
  { cx: 128, cy: 148, r: 0.4, op: 0.3 }, { cx: 178, cy: 138, r: 0.6, op: 0.5 },
  { cx: 210, cy: 150, r: 0.5, op: 0.4 }, { cx: 242, cy: 135, r: 0.4, op: 0.3 },
  { cx: 272, cy: 148, r: 0.6, op: 0.5 }, { cx: 308, cy: 140, r: 0.5, op: 0.4 },
  { cx: 348, cy: 130, r: 0.7, op: 0.6 }, { cx: 378, cy: 152, r: 0.4, op: 0.3 },
];

// ─── Palm frond generator ─────────────────────────────────────────────────────
// Returns SVG path string for one frond using a cubic bezier
function frond(
  cx: number, cy: number,
  dx1: number, dy1: number,
  dx2: number, dy2: number,
  ex: number, ey: number,
): string {
  return `M ${cx} ${cy} C ${cx + dx1} ${cy + dy1}, ${cx + dx2} ${cy + dy2}, ${cx + ex} ${cy + ey}`;
}

// Frond set for a dramatic Miami palm — 10 fronds
function palmFronds(cx: number, cy: number, L: number): string[] {
  return [
    frond(cx, cy,  L*.50, -L*.20,  L*1.10,  L*.00,  L*1.25,  L*.35), // E droop
    frond(cx, cy,  L*.38, -L*.55,  L*.90,  -L*.55,  L*1.05, -L*.18), // ENE
    frond(cx, cy,  L*.18, -L*.75,  L*.52,  -L*.98,  L*.60,  -L*.65), // NNE
    frond(cx, cy,  L*.04, -L*.85,  L*.08,  -L*1.08, L*.05,  -L*.95), // N tall
    frond(cx, cy, -L*.06, -L*.82,  L*.02,  -L*1.10,  L*.02, -L*.98), // N slight left
    frond(cx, cy, -L*.18, -L*.75, -L*.52,  -L*.98, -L*.60,  -L*.65), // NNW
    frond(cx, cy, -L*.38, -L*.55, -L*.90,  -L*.55, -L*1.05, -L*.18), // WNW
    frond(cx, cy, -L*.50, -L*.20, -L*1.10,  L*.00, -L*1.25,  L*.35), // W droop
    frond(cx, cy,  L*.55, -L*.05,  L*1.00,  L*.28,  L*1.15,  L*.55), // SE (low sweep)
    frond(cx, cy, -L*.55, -L*.05, -L*1.00,  L*.28, -L*1.15,  L*.55), // SW (low sweep)
  ];
}

// ─── Palm tree component ──────────────────────────────────────────────────────
interface PalmProps {
  x: number; baseY: number; crownY: number;
  frondLen?: number; trunkW?: number;
  color?: string; opacity?: number;
}
function PalmTree({ x, baseY, crownY, frondLen = 50, trunkW = 5, color = PINK, opacity = 1 }: PalmProps) {
  const mid = (baseY + crownY) / 2;
  const sway = 4; // slight curve in trunk
  const fronds = palmFronds(x, crownY, frondLen);
  return (
    <G opacity={opacity}>
      {/* Trunk — cubic bezier for natural curve */}
      <Path
        d={`M ${x - trunkW / 2} ${baseY} C ${x + sway} ${mid + 30}, ${x - sway} ${mid - 30}, ${x} ${crownY}`}
        stroke={color} strokeWidth={trunkW} strokeLinecap="round" fill="none" strokeOpacity={0.70}
      />
      {/* Secondary trunk highlight */}
      <Path
        d={`M ${x} ${baseY} C ${x + sway * .6} ${mid + 30}, ${x - sway * .4} ${mid - 30}, ${x + 1} ${crownY}`}
        stroke={color === PINK ? '#FF80D0' : '#80F2FF'} strokeWidth={1.2}
        strokeLinecap="round" fill="none" strokeOpacity={0.25}
      />
      {/* Fronds */}
      {fronds.map((d, i) => (
        <Path key={i} d={d}
          stroke={i % 3 === 0 ? color : i % 3 === 1 ? (color === PINK ? CYAN : PINK) : color}
          strokeWidth={i < 2 || i >= 8 ? 1.8 : 1.4}
          strokeLinecap="round" fill="none" strokeOpacity={0.78}
        />
      ))}
      {/* Crown knot */}
      <Circle cx={x} cy={crownY} r={trunkW * 0.6} fill={color} opacity={0.5} />
    </G>
  );
}

// ─── Neon tube text helper ────────────────────────────────────────────────────
// Creates the illusion of glowing neon tubing: dark outer + bright inner
function NeonSign({
  x, y, w, h, text1, text2, color1 = PINK, color2 = CYAN, rx = 4,
}: {
  x: number; y: number; w: number; h: number;
  text1: string; text2?: string;
  color1?: string; color2?: string; rx?: number;
}) {
  const mid = h / 2;
  return (
    <G>
      {/* Outer glow box */}
      <Rect x={x - 3} y={y - 3} width={w + 6} height={h + 6} rx={rx + 2}
        fill="none" stroke={color1} strokeWidth={0.5} strokeOpacity={0.15} />
      {/* Sign backing */}
      <Rect x={x} y={y} width={w} height={h} rx={rx}
        fill="#080010" fillOpacity={0.88} stroke={color1} strokeWidth={1.2} strokeOpacity={0.70} />
      {/* Inner tube line top */}
      <Rect x={x + 3} y={y + 2} width={w - 6} height={1} rx={0.5}
        fill={color1} fillOpacity={0.25} />
      {/* Inner tube line bottom */}
      <Rect x={x + 3} y={y + h - 3} width={w - 6} height={1} rx={0.5}
        fill={color1} fillOpacity={0.25} />
      {/* Text */}
      {text2 ? (
        <>
          <SvgText x={x + w / 2} y={y + mid * 0.72} fill={color1} fontSize={9}
            fontWeight="bold" textAnchor="middle" letterSpacing={2.5} opacity={0.95}>
            {text1}
          </SvgText>
          <SvgText x={x + w / 2} y={y + mid * 0.72 + 12} fill={color2} fontSize={11}
            fontWeight="bold" textAnchor="middle" letterSpacing={2.5} opacity={0.95}>
            {text2}
          </SvgText>
        </>
      ) : (
        <SvgText x={x + w / 2} y={y + mid + 4} fill={color1} fontSize={9}
          fontWeight="bold" textAnchor="middle" letterSpacing={2.5} opacity={0.95}>
          {text1}
        </SvgText>
      )}
    </G>
  );
}

// ─── HOTEL vertical neon sign ─────────────────────────────────────────────────
function HotelSign({ x, y }: { x: number; y: number }) {
  const letters = ['H', 'O', 'T', 'E', 'L'];
  const cellH = 22;
  const cellW = 20;
  const pad = 2;
  return (
    <G>
      {/* Outer frame */}
      <Rect x={x - 2} y={y - 2} width={cellW + 4} height={letters.length * (cellH + pad) + 4}
        rx={4} fill="#060010" fillOpacity={0.9}
        stroke={PINK} strokeWidth={1.5} strokeOpacity={0.80} />
      {/* Glow aura */}
      <Rect x={x - 5} y={y - 5} width={cellW + 10} height={letters.length * (cellH + pad) + 10}
        rx={7} fill="none" stroke={PINK} strokeWidth={0.5} strokeOpacity={0.20} />
      {letters.map((letter, i) => {
        const ly = y + i * (cellH + pad);
        return (
          <G key={i}>
            <Rect x={x} y={ly} width={cellW} height={cellH} rx={2}
              fill="rgba(255,47,174,0.10)" stroke={PINK} strokeWidth={0.8} strokeOpacity={0.55} />
            <SvgText x={x + cellW / 2} y={ly + cellH * 0.68} fill={PINK} fontSize={12}
              fontWeight="bold" textAnchor="middle" opacity={0.95}>
              {letter}
            </SvgText>
          </G>
        );
      })}
    </G>
  );
}

// ─── Art Deco building helper ─────────────────────────────────────────────────
interface Building {
  x: number; w: number; baseY: number;
  steps: { dx: number; y: number }[]; // each step: indent on each side, top y
  fill: string;
  neonColor?: string;
}
function ArtDecoBuilding({ bldg }: { bldg: Building }) {
  const { x, w, baseY, steps, fill, neonColor } = bldg;
  // Build polygon points for the stepped silhouette
  // Start at bottom-left, go up each step on the left, across top, down right steps, back to bottom-right
  let pts = `${x},${baseY}`;
  let curX = x;
  let curW = w;
  // Left side stepping up
  for (const step of steps) {
    pts += ` ${curX},${step.y} ${curX + step.dx},${step.y}`;
    curX += step.dx;
    curW -= step.dx * 2;
  }
  // Top
  pts += ` ${curX + curW},${steps[steps.length - 1].y}`;
  // Right side stepping down
  for (let i = steps.length - 1; i >= 0; i--) {
    const rightX = x + w - steps[i].dx;
    pts += ` ${rightX},${steps[i].y} ${rightX},${i > 0 ? steps[i - 1].y : baseY}`;
  }
  pts += ` ${x + w},${baseY}`;

  return (
    <G>
      <Polygon points={pts} fill={fill} />
      {neonColor && (
        // Neon outline on the crown edges only
        <Polygon points={pts} fill="none"
          stroke={neonColor} strokeWidth={0.8} strokeOpacity={0.45} />
      )}
    </G>
  );
}

// ─── Testarossa-style sports car ──────────────────────────────────────────────
function SportsCar({ x, y, flip = false }: { x: number; y: number; flip?: boolean }) {
  const sc = flip ? -1 : 1;
  const cx = flip ? x + 100 : x;

  // Body profile (all offsets from cx, cy = y)
  // Extremely low, wide supercar silhouette
  const body = [
    [0, 0],       // rear bottom
    [0, -10],     // rear top
    [12, -10],    // rear slope start
    [25, -19],    // roof start (rear edge)
    [55, -23],    // roof peak
    [80, -22],    // windshield top
    [90, -14],    // hood slope
    [100, -12],   // hood nose
    [104, -7],    // front lip
    [104, 0],     // front bottom
  ].map(([dx, dy]) => `${cx + dx * sc},${y + dy}`).join(' ');

  // Wheel arches
  const rearWheelCX = cx + 18 * sc;
  const frontWheelCX = cx + 86 * sc;

  return (
    <G>
      {/* Body */}
      <Polygon points={body} fill="#0A0018" stroke={PINK} strokeWidth={0.9} strokeOpacity={0.60} />
      {/* Side stripe */}
      <Path
        d={`M ${cx + 20 * sc} ${y - 8} L ${cx + 88 * sc} ${y - 11}`}
        stroke={CYAN} strokeWidth={0.6} strokeOpacity={0.40}
      />
      {/* Rear louvers (Testarossa signature) */}
      {[0, 3, 6].map(offset => (
        <Line key={offset}
          x1={cx + (2 + offset) * sc} y1={y - 10}
          x2={cx + (2 + offset) * sc} y2={y - 2}
          stroke={PINK} strokeWidth={0.7} strokeOpacity={0.50}
        />
      ))}
      {/* Windows */}
      <Path
        d={`M ${cx + 28 * sc} ${y - 18} L ${cx + 55 * sc} ${y - 22} L ${cx + 78 * sc} ${y - 21} L ${cx + 88 * sc} ${y - 13} Z`}
        fill="rgba(0,229,255,0.10)" stroke={CYAN} strokeWidth={0.6} strokeOpacity={0.35}
      />
      {/* Wheels */}
      <Circle cx={rearWheelCX} cy={y + 1} r={9} fill="#080014" stroke={PINK} strokeWidth={1.0} strokeOpacity={0.65} />
      <Circle cx={frontWheelCX} cy={y + 1} r={9} fill="#080014" stroke={PINK} strokeWidth={1.0} strokeOpacity={0.65} />
      {/* Wheel rims */}
      <Circle cx={rearWheelCX} cy={y + 1} r={5.5} fill="none" stroke={CYAN} strokeWidth={0.7} strokeOpacity={0.50} />
      <Circle cx={frontWheelCX} cy={y + 1} r={5.5} fill="none" stroke={CYAN} strokeWidth={0.7} strokeOpacity={0.50} />
      {/* Hub caps */}
      <Circle cx={rearWheelCX} cy={y + 1} r={2} fill={PINK} opacity={0.5} />
      <Circle cx={frontWheelCX} cy={y + 1} r={2} fill={PINK} opacity={0.5} />
      {/* Headlights */}
      {!flip && <Ellipse cx={cx + 102 * sc} cy={y - 4} rx={2} ry={3} fill={CYAN} opacity={0.75} />}
      {/* Tail lights */}
      {flip && <Ellipse cx={cx - 2} cy={y - 5} rx={3} ry={4} fill={PINK} opacity={0.80} />}
      {/* License plate */}
      <Rect x={cx + (40) * sc} y={y - 4} width={16} height={5} rx={1}
        fill="none" stroke={CYAN} strokeWidth={0.5} strokeOpacity={0.60} />
      {/* Neon underglow */}
      <Ellipse cx={cx + 52 * sc} cy={y + 5} rx={45} ry={4}
        fill={PINK} fillOpacity={0.08} />
    </G>
  );
}

// ─── Window light rows ────────────────────────────────────────────────────────
function Windows({ bx, by, bw, bh, rows, cols, colors }: {
  bx: number; by: number; bw: number; bh: number;
  rows: number; cols: number; colors: string[];
}) {
  const cellW = bw / (cols + 1);
  const cellH = bh / (rows + 1);
  const elements: React.ReactNode[] = [];
  for (let r = 1; r <= rows; r++) {
    for (let c = 1; c <= cols; c++) {
      const seed = r * 7 + c * 13;
      const lit = (seed % 5) !== 0;  // 80% lit
      if (!lit) continue;
      const color = colors[seed % colors.length];
      const cx = bx + c * cellW;
      const cy = by + r * cellH;
      elements.push(
        <Rect key={`${r}-${c}`} x={cx - 1.5} y={cy - 2} width={3} height={4} rx={0.5}
          fill={color} opacity={0.55} />
      );
    }
  }
  return <G>{elements}</G>;
}

// ─── Wet pavement reflection streak ───────────────────────────────────────────
function ReflectionStreak({ x, y, h, color, opacity }: {
  x: number; y: number; h: number; color: string; opacity: number;
}) {
  return (
    <Path
      d={`M ${x} ${y} C ${x + 2} ${y + h * 0.4}, ${x - 2} ${y + h * 0.7}, ${x + 1} ${y + h}`}
      stroke={color} strokeWidth={1.5} strokeLinecap="round"
      fill="none" strokeOpacity={opacity}
    />
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function ViceBackground() {
  // ── Building definitions ─────────────────────────────────────────────────
  const buildings: Building[] = [
    // Far-left tower
    {
      x: 15, w: 55, baseY: 700,
      steps: [
        { dx: 3,  y: 460 },
        { dx: 4,  y: 420 },
        { dx: 4,  y: 395 },
      ],
      fill: '#0C001C', neonColor: PURP,
    },
    // Left mid hotel (taller)
    {
      x: 68, w: 78, baseY: 700,
      steps: [
        { dx: 3,  y: 380 },
        { dx: 5,  y: 340 },
        { dx: 5,  y: 310 },
        { dx: 4,  y: 288 },
      ],
      fill: '#0D001F', neonColor: PINK,
    },
    // CENTER main Art Deco tower (tallest — landmark hotel)
    {
      x: 148, w: 94, baseY: 700,
      steps: [
        { dx: 4,  y: 295 },
        { dx: 6,  y: 260 },
        { dx: 6,  y: 232 },
        { dx: 5,  y: 210 },
        { dx: 6,  y: 193 },
      ],
      fill: '#0F0020', neonColor: PINK,
    },
    // Right mid hotel
    {
      x: 246, w: 76, baseY: 700,
      steps: [
        { dx: 4,  y: 345 },
        { dx: 5,  y: 308 },
        { dx: 5,  y: 278 },
        { dx: 4,  y: 260 },
      ],
      fill: '#0D0020', neonColor: CYAN,
    },
    // Far-right tower
    {
      x: 325, w: 52, baseY: 700,
      steps: [
        { dx: 3,  y: 470 },
        { dx: 4,  y: 435 },
        { dx: 3,  y: 408 },
      ],
      fill: '#0B001A', neonColor: PURP,
    },
  ];

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Svg
        width={W}
        height={H}
        viewBox={`0 0 ${VW} ${VH}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <Defs>
          {/* City haze — large radial behind buildings */}
          <RadialGradient id="cityHaze" cx="50%" cy="60%" r="60%">
            <Stop offset="0%"   stopColor="#8B004B" stopOpacity="0.28" />
            <Stop offset="40%"  stopColor={PURP}    stopOpacity="0.12" />
            <Stop offset="100%" stopColor="#000000"  stopOpacity="0.00" />
          </RadialGradient>
          {/* Horizon glow */}
          <RadialGradient id="horizonGlow" cx="50%" cy="80%" r="75%">
            <Stop offset="0%"   stopColor={PINK}   stopOpacity="0.22" />
            <Stop offset="50%"  stopColor={PURP}   stopOpacity="0.08" />
            <Stop offset="100%" stopColor="#000000" stopOpacity="0.00" />
          </RadialGradient>
          {/* Street wet surface gradient */}
          <SvgLinearGradient id="streetGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%"  stopColor="#0F001A" stopOpacity="0.85" />
            <Stop offset="100%" stopColor="#050010" stopOpacity="0.95" />
          </SvgLinearGradient>
          {/* Building top glow — pink */}
          <RadialGradient id="bldgGlowPink" cx="50%" cy="100%" r="80%">
            <Stop offset="0%"   stopColor={PINK}   stopOpacity="0.25" />
            <Stop offset="100%" stopColor={PINK}   stopOpacity="0.00" />
          </RadialGradient>
          {/* Building top glow — cyan */}
          <RadialGradient id="bldgGlowCyan" cx="50%" cy="100%" r="80%">
            <Stop offset="0%"   stopColor={CYAN}   stopOpacity="0.20" />
            <Stop offset="100%" stopColor={CYAN}   stopOpacity="0.00" />
          </RadialGradient>
          {/* Moon glow */}
          <RadialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%"   stopColor="#E8E0FF" stopOpacity="0.30" />
            <Stop offset="70%"  stopColor="#C0A0FF" stopOpacity="0.10" />
            <Stop offset="100%" stopColor="#000000" stopOpacity="0.00" />
          </RadialGradient>
        </Defs>

        {/* ── Stars ──────────────────────────────────────────────────────── */}
        {STARS.map((s, i) => (
          <Circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill="#E8E0FF" opacity={s.op} />
        ))}

        {/* ── Moon ───────────────────────────────────────────────────────── */}
        <Circle cx={345} cy={58} r={22} fill="url(#moonGlow)" />
        <Circle cx={345} cy={58} r={12} fill="#E8DFFF" opacity={0.18} />

        {/* ── Atmospheric haze ────────────────────────────────────────────── */}
        <Rect x={0} y={0} width={VW} height={VH} fill="url(#cityHaze)" />
        <Ellipse cx={VW / 2} cy={480} rx={260} ry={160} fill="url(#horizonGlow)" />

        {/* ── Buildings — back silhouettes ─────────────────────────────── */}
        {buildings.map((b, i) => (
          <ArtDecoBuilding key={i} bldg={b} />
        ))}

        {/* ── Building neon crown glow spots ───────────────────────────── */}
        {/* Center tower crown */}
        <Ellipse cx={195} cy={193} rx={52} ry={20} fill="url(#bldgGlowPink)" />
        {/* Left hotel crown */}
        <Ellipse cx={107} cy={288} rx={40} ry={16} fill="url(#bldgGlowPink)" />
        {/* Right hotel crown */}
        <Ellipse cx={284} cy={260} rx={40} ry={15} fill="url(#bldgGlowCyan)" />

        {/* ── Center tower spire ───────────────────────────────────────── */}
        <Line x1={195} y1={193} x2={195} y2={158}
          stroke={PINK} strokeWidth={1.8} strokeOpacity={0.70} strokeLinecap="round" />
        <Circle cx={195} cy={157} r={3} fill={PINK} opacity={0.85} />
        {/* Spire glow */}
        <Circle cx={195} cy={157} r={8} fill={PINK} opacity={0.12} />

        {/* Left hotel flagpole */}
        <Line x1={107} y1={288} x2={107} y2={265}
          stroke={PINK} strokeWidth={1.2} strokeOpacity={0.55} />
        <Circle cx={107} cy={264} r={2} fill={PINK} opacity={0.70} />

        {/* Right hotel ornament */}
        <Line x1={284} y1={260} x2={284} y2={240}
          stroke={CYAN} strokeWidth={1.2} strokeOpacity={0.55} />
        <Circle cx={284} cy={239} r={2} fill={CYAN} opacity={0.70} />

        {/* ── Building windows ─────────────────────────────────────────── */}
        <Windows bx={15}  by={460} bw={55} bh={240} rows={10} cols={3}
          colors={[PINK, 'rgba(255,47,174,0.6)', CYAN, 'rgba(0,229,255,0.6)']} />
        <Windows bx={68}  by={380} bw={78} bh={320} rows={14} cols={4}
          colors={[PINK, CYAN, PINK, 'rgba(255,47,174,0.5)']} />
        <Windows bx={148} by={295} bw={94} bh={405} rows={18} cols={5}
          colors={[PINK, PINK, CYAN, 'rgba(255,47,174,0.5)', CYAN]} />
        <Windows bx={246} by={345} bw={76} bh={355} rows={15} cols={4}
          colors={[CYAN, PINK, CYAN, 'rgba(0,229,255,0.5)']} />
        <Windows bx={325} by={470} bw={52} bh={230} rows={9} cols={3}
          colors={['rgba(0,229,255,0.6)', CYAN, PINK]} />

        {/* ── HOTEL vertical neon sign — left building ─────────────────── */}
        <HotelSign x={22} y={310} />

        {/* ── OCEAN DRIVE neon sign — upper right ──────────────────────── */}
        <NeonSign x={258} y={182} w={118} h={40}
          text1="OCEAN" text2="DRIVE" color1={GOLD} color2={PINK} rx={5} />

        {/* ── Additional: VICE CITY faint background sign ───────────────── */}
        <NeonSign x={108} y={248} w={80} h={28}
          text1="VICE CITY" color1="rgba(191,95,255,0.55)" rx={4} />

        {/* ── Palm trees — background layer (dimmer, smaller) ──────────── */}
        <PalmTree x={20}  baseY={690} crownY={555} frondLen={40} trunkW={3.5}
          color={PURP} opacity={0.40} />
        <PalmTree x={372} baseY={695} crownY={562} frondLen={38} trunkW={3}
          color={PURP} opacity={0.38} />

        {/* ── Palm trees — mid layer ────────────────────────────────────── */}
        <PalmTree x={45}  baseY={710} crownY={520} frondLen={52} trunkW={5}
          color={PINK} opacity={0.62} />
        <PalmTree x={350} baseY={710} crownY={522} frondLen={50} trunkW={4.5}
          color={CYAN} opacity={0.60} />

        {/* ── Palm trees — foreground (tallest, most vibrant) ───────────── */}
        <PalmTree x={5}   baseY={740} crownY={490} frondLen={60} trunkW={6}
          color={PINK} opacity={0.75} />
        <PalmTree x={390} baseY={740} crownY={485} frondLen={58} trunkW={5.5}
          color={CYAN} opacity={0.72} />

        {/* ── Street horizon line ──────────────────────────────────────── */}
        <Line x1={0} y1={700} x2={VW} y2={700}
          stroke={PINK} strokeWidth={1.2} strokeOpacity={0.35} />
        {/* Street neon edge glow */}
        <Rect x={0} y={700} width={VW} height={3}
          fill={PINK} fillOpacity={0.08} />

        {/* ── Wet pavement surface ─────────────────────────────────────── */}
        <Rect x={0} y={700} width={VW} height={VH - 700}
          fill="url(#streetGrad)" />

        {/* ── Sports car — center stage at street level ────────────────── */}
        <SportsCar x={218} y={700} flip={false} />

        {/* ── Wet street: building reflection streaks ───────────────────── */}
        {/* Center tower reflection */}
        <ReflectionStreak x={195} y={701} h={80} color={PINK} opacity={0.25} />
        <ReflectionStreak x={193} y={701} h={65} color={PINK} opacity={0.15} />
        <ReflectionStreak x={197} y={701} h={70} color={PURP} opacity={0.12} />
        {/* Left hotel reflection */}
        <ReflectionStreak x={107} y={701} h={55} color={PINK} opacity={0.18} />
        {/* Right hotel reflection */}
        <ReflectionStreak x={284} y={701} h={58} color={CYAN} opacity={0.18} />
        {/* Hotel sign reflection */}
        <ReflectionStreak x={32} y={701} h={45} color={PINK} opacity={0.22} />
        {/* Ocean Drive sign reflection */}
        <ReflectionStreak x={317} y={701} h={40} color={GOLD} opacity={0.18} />
        <ReflectionStreak x={330} y={701} h={38} color={PINK} opacity={0.14} />

        {/* ── Pavement puddle glows ─────────────────────────────────────── */}
        <Ellipse cx={195} cy={740} rx={55} ry={10} fill={PINK} fillOpacity={0.07} />
        <Ellipse cx={100} cy={760} rx={30} ry={6}  fill={PINK} fillOpacity={0.05} />
        <Ellipse cx={300} cy={755} rx={32} ry={7}  fill={CYAN} fillOpacity={0.05} />
        <Ellipse cx={50}  cy={780} rx={20} ry={5}  fill={PINK} fillOpacity={0.04} />
        <Ellipse cx={340} cy={775} rx={22} ry={5}  fill={CYAN} fillOpacity={0.04} />

        {/* ── Car reflection in wet pavement ───────────────────────────── */}
        <G opacity={0.22} transform={`scale(1,-1) translate(0,${-(700 * 2)})`}>
          <SportsCar x={218} y={700} flip={false} />
        </G>

        {/* ── Subtle horizontal scan-line atmosphere strips ─────────────── */}
        {[160, 240, 320, 420].map((yy, i) => (
          <Line key={i} x1={0} y1={yy} x2={VW} y2={yy}
            stroke={i % 2 === 0 ? PINK : CYAN}
            strokeWidth={0.4} strokeOpacity={0.06} />
        ))}
      </Svg>
    </View>
  );
}
