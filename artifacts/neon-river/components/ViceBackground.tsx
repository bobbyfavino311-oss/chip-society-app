import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  Path,
  Polygon,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

// Fixed design canvas — scales to any device
const VW = 390;
const VH = 844;

const { width: W, height: H } = Dimensions.get('window');

const PINK  = '#FF2FAE';
const CYAN  = '#00E5FF';
const PURP  = '#6B00C8';

// ─── Palm frond paths from crown (cx, cy) ─────────────────────────────────────
function palmFronds(cx: number, cy: number, len: number): string[] {
  const L = len;
  // [cpX1, cpY1, cpX2, cpY2, endX, endY] all relative to (cx, cy)
  const frondDefs: number[][] = [
    [L * 0.35, -L * 0.50, L * 0.80, -L * 0.25, L * 0.95,  L * 0.10],   // E-droop
    [L * 0.18, -L * 0.65, L * 0.55, -L * 0.82, L * 0.62, -L * 0.55],   // NE
    [-L * 0.05, -L * 0.80, L * 0.05, -L * 1.00, 0,         -L * 0.90],  // N
    [-L * 0.18, -L * 0.65, -L * 0.55, -L * 0.82, -L * 0.62, -L * 0.55],// NW
    [-L * 0.35, -L * 0.50, -L * 0.80, -L * 0.25, -L * 0.95,  L * 0.10],// W-droop
    [L * 0.40, -L * 0.20, L * 0.75,  L * 0.15,  L * 0.85,  L * 0.40],  // SE
    [-L * 0.40, -L * 0.20, -L * 0.75,  L * 0.15, -L * 0.85, L * 0.40], // SW
  ];
  return frondDefs.map(([dx1, dy1, dx2, dy2, ex, ey]) =>
    `M ${cx} ${cy} C ${cx + dx1} ${cy + dy1}, ${cx + dx2} ${cy + dy2}, ${cx + ex} ${cy + ey}`
  );
}

// ─── Palm tree element ─────────────────────────────────────────────────────────
function PalmTree({
  x, baseY, crownY, frondLen = 38, opacity = 1, color = PINK,
}: {
  x: number; baseY: number; crownY: number; frondLen?: number; opacity?: number; color?: string;
}) {
  const fronds = palmFronds(x, crownY, frondLen);
  const trunkW = 4;
  return (
    <G opacity={opacity}>
      {/* Trunk — slightly curved */}
      <Path
        d={`M ${x - trunkW / 2} ${baseY} C ${x + 3} ${(baseY + crownY) / 2}, ${x - 3} ${(baseY + crownY) / 2}, ${x} ${crownY}`}
        stroke={color}
        strokeWidth={trunkW}
        strokeLinecap="round"
        fill="none"
        strokeOpacity={0.55}
      />
      {/* Fronds */}
      {fronds.map((d, i) => (
        <Path
          key={i}
          d={d}
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
          fill="none"
          strokeOpacity={0.65}
        />
      ))}
    </G>
  );
}

// ─── Sports car silhouette ─────────────────────────────────────────────────────
function SportsCar({ x, y }: { x: number; y: number }) {
  return (
    <G>
      {/* Body */}
      <Path
        d={`M ${x} ${y} L ${x + 14} ${y - 16} L ${x + 38} ${y - 20} L ${x + 58} ${y - 16} L ${x + 72} ${y} Z`}
        fill="#0A0014"
        stroke={PINK}
        strokeWidth={0.8}
        strokeOpacity={0.45}
      />
      {/* Windshield line */}
      <Line x1={x + 22} y1={y - 4} x2={x + 38} y2={y - 19} stroke={CYAN} strokeWidth={0.6} strokeOpacity={0.3} />
      {/* Wheels */}
      <Circle cx={x + 15} cy={y + 2} r={7} fill="#0A0014" stroke={PINK} strokeWidth={0.8} strokeOpacity={0.5} />
      <Circle cx={x + 57} cy={y + 2} r={7} fill="#0A0014" stroke={PINK} strokeWidth={0.8} strokeOpacity={0.5} />
      <Circle cx={x + 15} cy={y + 2} r={3} fill="none" stroke={CYAN} strokeWidth={0.5} strokeOpacity={0.4} />
      <Circle cx={x + 57} cy={y + 2} r={3} fill="none" stroke={CYAN} strokeWidth={0.5} strokeOpacity={0.4} />
      {/* License plate glow */}
      <Rect x={x + 28} y={y - 5} width={16} height={6} rx={1}
        fill="none" stroke={CYAN} strokeWidth={0.6} strokeOpacity={0.55} />
    </G>
  );
}

// ─── Building windows ──────────────────────────────────────────────────────────
function BuildingWindows({ bx, by, bw, bh, rows, cols, color }: {
  bx: number; by: number; bw: number; bh: number;
  rows: number; cols: number; color: string;
}) {
  const dots: { cx: number; cy: number; lit: boolean }[] = [];
  const cellW = bw / (cols + 1);
  const cellH = bh / (rows + 1);
  for (let r = 1; r <= rows; r++) {
    for (let c = 1; c <= cols; c++) {
      dots.push({
        cx: bx + c * cellW,
        cy: by + r * cellH,
        lit: Math.sin(r * 7 + c * 13) > 0.1, // deterministic "random" pattern
      });
    }
  }
  return (
    <G>
      {dots.filter(d => d.lit).map((d, i) => (
        <Circle key={i} cx={d.cx} cy={d.cy} r={1.2} fill={color} opacity={0.5} />
      ))}
    </G>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ViceBackground() {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Svg
        width={W}
        height={H}
        viewBox={`0 0 ${VW} ${VH}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <Defs>
          <RadialGradient id="horizonGlow" cx="50%" cy="100%" r="80%">
            <Stop offset="0%"  stopColor={PINK}  stopOpacity="0.20" />
            <Stop offset="50%" stopColor={PURP}  stopOpacity="0.10" />
            <Stop offset="100%" stopColor={PURP} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="hotelGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%"  stopColor={PINK} stopOpacity="0.18" />
            <Stop offset="100%" stopColor={PINK} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="streetWet" cx="50%" cy="0%" r="80%">
            <Stop offset="0%"  stopColor={PINK} stopOpacity="0.08" />
            <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* ── Horizon glow band ───────────────────────────────────────────── */}
        <Ellipse cx={VW / 2} cy={460} rx={220} ry={80} fill="url(#horizonGlow)" />

        {/* ── Building silhouettes ─────────────────────────────────────────── */}
        {/* Far-left building */}
        <Rect x={30}  y={490} width={55}  height={190} fill="#0D0018" />
        {/* Left building */}
        <Rect x={80}  y={440} width={65}  height={240} fill="#0E001C" />
        <Rect x={88}  y={415} width={49}  height={30}  fill="#0E001C" />

        {/* Main Art Deco hotel — center */}
        <Rect x={148} y={360} width={94}  height={320} fill="#100020" />
        <Rect x={158} y={330} width={74}  height={35}  fill="#100020" />
        <Rect x={168} y={300} width={54}  height={35}  fill="#100020" />
        <Rect x={179} y={275} width={32}  height={30}  fill="#100020" />
        {/* Spire */}
        <Line x1={195} y1={275} x2={195} y2={248} stroke={PINK} strokeWidth={1.5} strokeOpacity={0.55} />
        <Circle cx={195} cy={246} r={2.5} fill={PINK} opacity={0.7} />

        {/* Right building */}
        <Rect x={248} y={415} width={65}  height={265} fill="#0D001A" />
        <Rect x={255} y={390} width={51}  height={30}  fill="#0D001A" />

        {/* Far-right building */}
        <Rect x={318} y={480} width={48}  height={200} fill="#0C0016" />

        {/* ── Building windows ─────────────────────────────────────────────── */}
        <BuildingWindows bx={30}  by={490} bw={55}  bh={190} rows={8} cols={3} color={CYAN} />
        <BuildingWindows bx={80}  by={440} bw={65}  bh={240} rows={9} cols={3} color={PINK} />
        <BuildingWindows bx={148} by={360} bw={94}  bh={320} rows={12} cols={4} color={PINK} />
        <BuildingWindows bx={248} by={415} bw={65}  bh={265} rows={10} cols={3} color={CYAN} />
        <BuildingWindows bx={318} by={480} bw={48}  bh={200} rows={7}  cols={2} color={PINK} />

        {/* ── HOTEL vertical neon sign — left edge ────────────────────────── */}
        <Rect x={10} y={340} width={22} height={95} rx={3}
          fill="none" stroke={PINK} strokeWidth={1} strokeOpacity={0.65} />
        <SvgText
          x={21}
          y={425}
          fill={PINK}
          fontSize={9}
          fontWeight="bold"
          textAnchor="middle"
          letterSpacing={3}
          transform="rotate(-90, 21, 388)"
          opacity={0.80}
        >
          HOTEL
        </SvgText>

        {/* ── OCEAN DRIVE sign — upper right ──────────────────────────────── */}
        <Rect x={270} y={200} width={100} height={34} rx={4}
          fill="#0A0018" stroke={CYAN} strokeWidth={1.2} strokeOpacity={0.65} />
        <SvgText
          x={320}
          y={212}
          fill={CYAN}
          fontSize={7}
          fontWeight="bold"
          textAnchor="middle"
          letterSpacing={2}
          opacity={0.85}
        >
          OCEAN
        </SvgText>
        <SvgText
          x={320}
          y={226}
          fill={PINK}
          fontSize={8.5}
          fontWeight="bold"
          textAnchor="middle"
          letterSpacing={2.5}
          opacity={0.90}
        >
          DRIVE
        </SvgText>

        {/* ── Pink neon glow on hotel crown ───────────────────────────────── */}
        <Ellipse cx={195} cy={300} rx={60} ry={25} fill="url(#hotelGlow)" />

        {/* ── Palm trees ──────────────────────────────────────────────────── */}
        {/* Left background palm — dim */}
        <PalmTree x={28}  baseY={640} crownY={520} frondLen={34} opacity={0.45} color={PURP} />
        {/* Left foreground palm */}
        <PalmTree x={60}  baseY={660} crownY={510} frondLen={42} opacity={0.70} color={PINK} />
        {/* Right background palm */}
        <PalmTree x={360} baseY={640} crownY={515} frondLen={34} opacity={0.45} color={PURP} />
        {/* Right foreground palm */}
        <PalmTree x={330} baseY={660} crownY={505} frondLen={42} opacity={0.70} color={CYAN} />

        {/* ── Wet street — dark reflective surface ───────────────────────── */}
        <Rect x={0} y={680} width={VW} height={VH - 680} fill="#07000F" opacity={0.75} />

        {/* Street reflections — dim mirrored glow ellipses */}
        <Ellipse cx={195} cy={730} rx={60} ry={12} fill={PINK} opacity={0.07} />
        <Ellipse cx={100} cy={750} rx={30} ry={8}  fill={PINK} opacity={0.05} />
        <Ellipse cx={300} cy={745} rx={35} ry={9}  fill={CYAN} opacity={0.05} />

        {/* ── Sports car silhouette ────────────────────────────────────────── */}
        <SportsCar x={268} y={675} />

        {/* ── Subtle pink neon line along horizon ─────────────────────────── */}
        <Line x1={0} y1={680} x2={VW} y2={680}
          stroke={PINK} strokeWidth={0.8} strokeOpacity={0.25} />

        {/* ── Faint cyan horizontal accent line mid-screen ────────────────── */}
        <Line x1={0} y1={450} x2={VW} y2={450}
          stroke={CYAN} strokeWidth={0.5} strokeOpacity={0.10} />
      </Svg>
    </View>
  );
}
