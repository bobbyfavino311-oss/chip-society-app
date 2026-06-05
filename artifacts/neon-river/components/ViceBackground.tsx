/**
 * ViceBackground — Miami Vice poker table atmosphere
 * Reference: warm magenta/orange sunset horizon, dominant dark palm silhouettes,
 * Art Deco hotel buildings, neon signs (HOTEL, OCEAN DRIVE), sports car lower-right.
 */
import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient as SvgLinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

const VW = 390;
const VH = 844;
const { width: W, height: H } = Dimensions.get('window');

// ─── Deterministic star field ─────────────────────────────────────────────────
const STARS: { cx: number; cy: number; r: number; op: number }[] = [
  { cx:  22, cy:  18, r: 0.8, op: 0.55 }, { cx:  58, cy:  35, r: 0.6, op: 0.45 },
  { cx:  88, cy:  14, r: 0.9, op: 0.60 }, { cx: 132, cy:  26, r: 0.7, op: 0.50 },
  { cx: 165, cy:  10, r: 0.8, op: 0.55 }, { cx: 205, cy:  30, r: 0.6, op: 0.45 },
  { cx: 245, cy:  18, r: 0.9, op: 0.60 }, { cx: 278, cy:  42, r: 0.7, op: 0.50 },
  { cx: 318, cy:  22, r: 0.8, op: 0.55 }, { cx: 355, cy:  15, r: 0.6, op: 0.45 },
  { cx:  40, cy:  55, r: 0.6, op: 0.40 }, { cx:  75, cy:  70, r: 0.5, op: 0.35 },
  { cx: 115, cy:  60, r: 0.7, op: 0.45 }, { cx: 150, cy:  80, r: 0.5, op: 0.35 },
  { cx: 195, cy:  68, r: 0.6, op: 0.40 }, { cx: 230, cy:  85, r: 0.5, op: 0.35 },
  { cx: 262, cy:  65, r: 0.7, op: 0.45 }, { cx: 302, cy:  75, r: 0.6, op: 0.40 },
  { cx: 340, cy:  58, r: 0.5, op: 0.35 }, { cx: 372, cy:  80, r: 0.6, op: 0.40 },
];

// ─── Palm frond path (cubic bezier) ──────────────────────────────────────────
function mkFrond(
  cx: number, cy: number,
  dx1: number, dy1: number,
  dx2: number, dy2: number,
  ex: number, ey: number,
): string {
  return `M ${cx} ${cy} C ${cx + dx1} ${cy + dy1}, ${cx + dx2} ${cy + dy2}, ${cx + ex} ${cy + ey}`;
}

// 11-frond palm — dark silhouette with subtle warm outline
function PalmSilhouette({
  x, baseY, crownY,
  L = 55, trunkW = 7,
  color = '#0E001C', strokeC = '#4A003A', opacity = 1,
}: {
  x: number; baseY: number; crownY: number;
  L?: number; trunkW?: number;
  color?: string; strokeC?: string; opacity?: number;
}) {
  const mid = (baseY + crownY) / 2;
  const sway = 5;
  const fronds = [
    mkFrond(x, crownY,  L*.50, -L*.18,  L*1.10,  L*.05,  L*1.28,  L*.40),
    mkFrond(x, crownY,  L*.38, -L*.52,  L*.90,  -L*.52,  L*1.08, -L*.15),
    mkFrond(x, crownY,  L*.20, -L*.72,  L*.55,  -L*.96,  L*.62,  -L*.62),
    mkFrond(x, crownY,  L*.06, -L*.84,  L*.10,  -L*1.08, L*.08,  -L*.96),
    mkFrond(x, crownY, -L*.02, -L*.82,  L*.00,  -L*1.10, L*.00,  -L*.98),
    mkFrond(x, crownY, -L*.18, -L*.72, -L*.52,  -L*.96, -L*.60,  -L*.62),
    mkFrond(x, crownY, -L*.38, -L*.52, -L*.90,  -L*.52, -L*1.08, -L*.15),
    mkFrond(x, crownY, -L*.50, -L*.18, -L*1.10,  L*.05, -L*1.28,  L*.40),
    mkFrond(x, crownY,  L*.55, -L*.06,  L*1.05,  L*.30,  L*1.20,  L*.58),
    mkFrond(x, crownY, -L*.55, -L*.06, -L*1.05,  L*.30, -L*1.20,  L*.58),
    mkFrond(x, crownY,  L*.25, -L*.88,  L*.40,  -L*.80,  L*.35,  -L*.55),
  ];
  return (
    <G opacity={opacity}>
      <Path
        d={`M ${x - trunkW / 2} ${baseY} C ${x + sway} ${mid + 25}, ${x - sway} ${mid - 25}, ${x} ${crownY}`}
        stroke={strokeC} strokeWidth={trunkW + 1} strokeLinecap="round" fill="none" strokeOpacity={0.80}
      />
      <Path
        d={`M ${x - trunkW / 2} ${baseY} C ${x + sway} ${mid + 25}, ${x - sway} ${mid - 25}, ${x} ${crownY}`}
        stroke={color} strokeWidth={trunkW} strokeLinecap="round" fill="none" strokeOpacity={1}
      />
      {fronds.map((d, i) => (
        <Path key={i} d={d}
          stroke={i % 4 === 0 ? strokeC : color}
          strokeWidth={i < 2 || i >= 8 ? trunkW * 0.40 : trunkW * 0.32}
          strokeLinecap="round" fill="none" strokeOpacity={0.92}
        />
      ))}
      <Circle cx={x} cy={crownY} r={trunkW * 0.9} fill={color} opacity={0.90} />
    </G>
  );
}

// ─── Testarossa-style car silhouette ─────────────────────────────────────────
function SportsCar({ x, y }: { x: number; y: number }) {
  // Very low, wide supercar — dark silhouette with pink/red tail glow
  const body = [
    [0,   0],   // rear bottom
    [0,  -9],   // rear top
    [10, -9],   // rear slope
    [22, -17],  // roof start
    [52, -22],  // roof peak
    [76, -21],  // windshield top
    [88, -13],  // hood
    [98, -10],  // hood tip
    [102, -5],  // front lip
    [102,  0],  // front bottom
  ].map(([dx, dy]) => `${x + dx},${y + dy}`).join(' ');

  return (
    <G>
      {/* Tail glow */}
      <Ellipse cx={x + 5} cy={y - 5} rx={8} ry={6} fill="#FF0040" opacity={0.55} />
      <Ellipse cx={x + 5} cy={y - 5} rx={18} ry={10} fill="#FF0040" opacity={0.15} />
      {/* Body fill */}
      <Path d={`M ${body.replace(/ /g, ' L ')} Z`} fill="#07000F" />
      {/* Body outline — subtle pink/magenta */}
      <Path d={`M ${body.replace(/ /g, ' L ')} Z`}
        fill="none" stroke="#FF2FAE" strokeWidth={0.7} strokeOpacity={0.50} />
      {/* Windshield */}
      <Path
        d={`M ${x + 25} ${y - 17} L ${x + 52} ${y - 21} L ${x + 75} ${y - 20} L ${x + 85} ${y - 12} Z`}
        fill="rgba(255,0,144,0.08)" stroke="#FF2FAE" strokeWidth={0.5} strokeOpacity={0.30}
      />
      {/* Rear louvers */}
      {[0, 3, 6, 9].map(o => (
        <Path key={o}
          d={`M ${x + 2 + o} ${y - 9} L ${x + 2 + o} ${y - 1}`}
          stroke="#FF2FAE" strokeWidth={0.6} strokeOpacity={0.35}
        />
      ))}
      {/* Rear wheel */}
      <Circle cx={x + 18} cy={y + 1} r={9} fill="#060010" stroke="#FF2FAE" strokeWidth={0.8} strokeOpacity={0.55} />
      <Circle cx={x + 18} cy={y + 1} r={5} fill="none" stroke="#FF2FAE" strokeWidth={0.5} strokeOpacity={0.40} />
      {/* Front wheel */}
      <Circle cx={x + 84} cy={y + 1} r={9} fill="#060010" stroke="#FF2FAE" strokeWidth={0.8} strokeOpacity={0.55} />
      <Circle cx={x + 84} cy={y + 1} r={5} fill="none" stroke="#FF2FAE" strokeWidth={0.5} strokeOpacity={0.40} />
      {/* License plate */}
      <Rect x={x + 38} y={y - 4} width={18} height={5} rx={1}
        fill="#080018" stroke="#00E5FF" strokeWidth={0.5} strokeOpacity={0.55} />
      <SvgText x={x + 47} y={y - 1} fill="#00E5FF" fontSize={3.5}
        fontWeight="bold" textAnchor="middle" opacity={0.80}>
        VICE CITY
      </SvgText>
      {/* Neon underglow */}
      <Ellipse cx={x + 51} cy={y + 6} rx={44} ry={4} fill="#FF2FAE" fillOpacity={0.10} />
    </G>
  );
}

// ─── Building polygon ─────────────────────────────────────────────────────────
function Building({
  x, w, baseY, steps, lightColor,
}: {
  x: number; w: number; baseY: number;
  steps: { dx: number; y: number }[];
  lightColor?: string;
}) {
  let pts = `${x},${baseY}`;
  let curX = x;
  let curW = w;
  for (const step of steps) {
    pts += ` ${curX},${step.y} ${curX + step.dx},${step.y}`;
    curX += step.dx;
    curW -= step.dx * 2;
  }
  pts += ` ${curX + curW},${steps[steps.length - 1].y}`;
  for (let i = steps.length - 1; i >= 0; i--) {
    const rx = x + w - steps[i].dx;
    pts += ` ${rx},${steps[i].y} ${rx},${i > 0 ? steps[i - 1].y : baseY}`;
  }
  pts += ` ${x + w},${baseY}`;
  return (
    <G>
      <Path d={`M ${pts.replace(/ /g, ' L ')} Z`} fill="#0C0018" />
      {lightColor && (
        <Path d={`M ${pts.replace(/ /g, ' L ')} Z`}
          fill="none" stroke={lightColor} strokeWidth={0.7} strokeOpacity={0.30} />
      )}
    </G>
  );
}

// ─── HOTEL vertical sign ──────────────────────────────────────────────────────
function HotelSign({ x, y }: { x: number; y: number }) {
  const letters = ['H', 'O', 'T', 'E', 'L'];
  const cW = 18; const cH = 20; const pad = 2;
  return (
    <G>
      <Rect x={x - 2} y={y - 2} width={cW + 4} height={letters.length * (cH + pad) + 4}
        rx={4} fill="#060010" fillOpacity={0.90}
        stroke="#FF2FAE" strokeWidth={1.2} strokeOpacity={0.75} />
      <Rect x={x - 5} y={y - 5} width={cW + 10} height={letters.length * (cH + pad) + 10}
        rx={6} fill="none" stroke="#FF2FAE" strokeWidth={0.4} strokeOpacity={0.18} />
      {letters.map((l, i) => (
        <G key={i}>
          <Rect x={x} y={y + i * (cH + pad)} width={cW} height={cH} rx={2}
            fill="rgba(255,47,174,0.12)" stroke="#FF2FAE" strokeWidth={0.7} strokeOpacity={0.50} />
          <SvgText x={x + cW / 2} y={y + i * (cH + pad) + cH * 0.68}
            fill="#FF2FAE" fontSize={11} fontWeight="bold" textAnchor="middle" opacity={0.95}>
            {l}
          </SvgText>
        </G>
      ))}
    </G>
  );
}

// ─── Neon sign (OCEAN / DRIVE) ────────────────────────────────────────────────
function OceanDriveSign({ x, y }: { x: number; y: number }) {
  const w = 110; const h = 42;
  return (
    <G>
      {/* Outer glow — cyan */}
      <Rect x={x - 4} y={y - 4} width={w + 8} height={h + 8} rx={8}
        fill="none" stroke="#00E5FF" strokeWidth={0.5} strokeOpacity={0.22} />
      {/* Sign box */}
      <Rect x={x} y={y} width={w} height={h} rx={5}
        fill="#040010" fillOpacity={0.90} stroke="#00E5FF" strokeWidth={1.4} strokeOpacity={0.80} />
      {/* Inner tube lines */}
      <Rect x={x + 3} y={y + 2} width={w - 6} height={1}
        fill="#00E5FF" fillOpacity={0.20} />
      <Rect x={x + 3} y={y + h - 3} width={w - 6} height={1}
        fill="#FF2FAE" fillOpacity={0.20} />
      {/* OCEAN — cyan */}
      <SvgText x={x + w / 2} y={y + 16} fill="#00E5FF" fontSize={11}
        fontWeight="bold" textAnchor="middle" letterSpacing={3} opacity={0.95}>
        OCEAN
      </SvgText>
      {/* DRIVE — pink */}
      <SvgText x={x + w / 2} y={y + 31} fill="#FF2FAE" fontSize={12}
        fontWeight="bold" textAnchor="middle" letterSpacing={2.5} opacity={0.95}>
        DRIVE
      </SvgText>
    </G>
  );
}

// ─── Window grid ──────────────────────────────────────────────────────────────
function WinGrid({ bx, by, bw, bh, rows, cols }: {
  bx: number; by: number; bw: number; bh: number; rows: number; cols: number;
}) {
  const cW = bw / (cols + 1);
  const cH = bh / (rows + 1);
  const els: React.ReactNode[] = [];
  for (let r = 1; r <= rows; r++) {
    for (let c = 1; c <= cols; c++) {
      const seed = r * 7 + c * 13;
      if (seed % 5 === 0) continue; // 20% dark
      const warm = seed % 3 === 0;
      const col = warm ? 'rgba(255,140,60,0.45)' : 'rgba(255,47,174,0.38)';
      els.push(
        <Rect key={`${r}${c}`} x={bx + c * cW - 1.5} y={by + r * cH - 2}
          width={3} height={4} rx={0.5} fill={col} />
      );
    }
  }
  return <G>{els}</G>;
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function ViceBackground() {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Svg width={W} height={H} viewBox={`0 0 ${VW} ${VH}`}
        preserveAspectRatio="xMidYMid meet">
        <Defs>
          {/* Crimson-red horizon glow — deep red sunset behind buildings */}
          <RadialGradient id="horizonWarm" cx="50%" cy="70%" r="68%">
            <Stop offset="0%"   stopColor="#AA1018" stopOpacity="0.75" />
            <Stop offset="15%"  stopColor="#CC2035" stopOpacity="0.55" />
            <Stop offset="38%"  stopColor="#7B0040" stopOpacity="0.30" />
            <Stop offset="68%"  stopColor="#3A0050" stopOpacity="0.12" />
            <Stop offset="100%" stopColor="#000000"  stopOpacity="0.00" />
          </RadialGradient>
          {/* Upper magenta sky tint */}
          <RadialGradient id="skyMagenta" cx="50%" cy="20%" r="70%">
            <Stop offset="0%"   stopColor="#4B0060" stopOpacity="0.35" />
            <Stop offset="100%" stopColor="#000000"  stopOpacity="0.00" />
          </RadialGradient>
          {/* Street wet surface */}
          <SvgLinearGradient id="street" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%"  stopColor="#110016" stopOpacity="0.92" />
            <Stop offset="100%" stopColor="#060010" stopOpacity="0.98" />
          </SvgLinearGradient>
          {/* Car area warm glow */}
          <RadialGradient id="carGlow" cx="75%" cy="85%" r="35%">
            <Stop offset="0%"   stopColor="#FF0040" stopOpacity="0.20" />
            <Stop offset="100%" stopColor="#000000"  stopOpacity="0.00" />
          </RadialGradient>
        </Defs>

        {/* ── Stars (above palm line) ────────────────────────────────── */}
        {STARS.map((s, i) => (
          <Circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill="#EEE0FF" opacity={s.op} />
        ))}

        {/* ── Atmospheric sky tints ──────────────────────────────────── */}
        <Rect x={0} y={0} width={VW} height={VH} fill="url(#skyMagenta)" />

        {/* ── Warm horizon glow — the dominant mood (orange/pink) ──── */}
        <Rect x={0} y={0} width={VW} height={VH} fill="url(#horizonWarm)" />

        {/* ── Buildings — Art Deco stepped silhouettes ────────────────
             They sit BEHIND the palms — visible only through gaps        */}
        {/* Center hotel (tallest) */}
        <Building x={148} w={94} baseY={670}
          steps={[{ dx:5, y:300 }, { dx:6, y:268 }, { dx:5, y:246 }, { dx:5, y:230 }]}
          lightColor="#FF2FAE" />
        {/* Left mid hotel */}
        <Building x={68} w={75} baseY={670}
          steps={[{ dx:4, y:358 }, { dx:5, y:322 }, { dx:4, y:300 }]}
          lightColor="#FF2FAE" />
        {/* Right mid hotel */}
        <Building x={248} w={72} baseY={670}
          steps={[{ dx:4, y:345 }, { dx:5, y:312 }, { dx:4, y:292 }]}
          lightColor="#00E5FF" />
        {/* Far buildings (very secondary) */}
        <Building x={20}  w={46} baseY={670} steps={[{ dx:3, y:420 }, { dx:3, y:398 }]} />
        <Building x={325} w={48} baseY={670} steps={[{ dx:3, y:428 }, { dx:3, y:408 }]} />

        {/* ── Building windows ─────────────────────────────────────── */}
        <WinGrid bx={68}  by={360} bw={75} bh={310} rows={12} cols={4} />
        <WinGrid bx={148} by={300} bw={94} bh={370} rows={15} cols={5} />
        <WinGrid bx={248} by={348} bw={72} bh={322} rows={12} cols={4} />

        {/* ── Building crown spires ─────────────────────────────────── */}
        <Path d={`M 195 230 L 195 198`} stroke="#FF2FAE" strokeWidth={1.5} strokeOpacity={0.65} />
        <Circle cx={195} cy={197} r={3} fill="#FF2FAE" opacity={0.80} />
        <Circle cx={195} cy={197} r={9} fill="#FF2FAE" opacity={0.12} />

        {/* ── HOTEL vertical sign — far left ───────────────────────── */}
        <HotelSign x={22} y={295} />

        {/* ── OCEAN DRIVE neon sign — upper right ──────────────────── */}
        <OceanDriveSign x={270} y={200} />

        {/* ── PALM TREES — THE DOMINANT VISUAL ELEMENT ─────────────── */}
        {/* The reference has a FOREST of dark silhouettes against warm sky */}

        {/* ── Deep background palms (barely visible, warmest silhouette) */}
        <PalmSilhouette x={50}  baseY={640} crownY={460} L={38} trunkW={5}
          color="#100018" strokeC="#3A0028" opacity={0.50} />
        <PalmSilhouette x={340} baseY={640} crownY={465} L={36} trunkW={5}
          color="#100018" strokeC="#3A0028" opacity={0.48} />
        <PalmSilhouette x={195} baseY={650} crownY={470} L={40} trunkW={5}
          color="#0E0016" strokeC="#360026" opacity={0.42} />

        {/* ── Mid-ground palms (middle depth) */}
        <PalmSilhouette x={25}  baseY={680} crownY={420} L={52} trunkW={7}
          color="#0C0016" strokeC="#420030" opacity={0.68} />
        <PalmSilhouette x={100} baseY={678} crownY={430} L={50} trunkW={6}
          color="#0C0016" strokeC="#420030" opacity={0.62} />
        <PalmSilhouette x={158} baseY={682} crownY={408} L={55} trunkW={7}
          color="#0C0016" strokeC="#3E002C" opacity={0.58} />
        <PalmSilhouette x={235} baseY={680} crownY={418} L={52} trunkW={6}
          color="#0C0016" strokeC="#380030" opacity={0.64} />
        <PalmSilhouette x={305} baseY={675} crownY={428} L={50} trunkW={6}
          color="#0C0016" strokeC="#420030" opacity={0.60} />
        <PalmSilhouette x={368} baseY={682} crownY={415} L={52} trunkW={7}
          color="#0C0016" strokeC="#420030" opacity={0.68} />

        {/* ── Foreground palms (largest, most dominant — frame the scene) */}
        <PalmSilhouette x={0}   baseY={710} crownY={375} L={65} trunkW={9}
          color="#080012" strokeC="#3C0030" opacity={0.85} />
        <PalmSilhouette x={70}  baseY={715} crownY={390} L={60} trunkW={8}
          color="#080012" strokeC="#3C002E" opacity={0.80} />
        <PalmSilhouette x={322} baseY={715} crownY={388} L={60} trunkW={8}
          color="#080012" strokeC="#3C002E" opacity={0.78} />
        <PalmSilhouette x={390} baseY={710} crownY={372} L={65} trunkW={9}
          color="#080012" strokeC="#3C0030" opacity={0.85} />

        {/* ── Horizon neon edge line ─────────────────────────────────── */}
        <Path d={`M 0 670 L ${VW} 670`}
          stroke="#FF2FAE" strokeWidth={1.0} strokeOpacity={0.28} />

        {/* ── Wet pavement ──────────────────────────────────────────── */}
        <Rect x={0} y={670} width={VW} height={VH - 670} fill="url(#street)" />

        {/* ── Car warm glow in lower-right ──────────────────────────── */}
        <Rect x={0} y={0} width={VW} height={VH} fill="url(#carGlow)" />

        {/* ── Sports car — lower right, prominent ───────────────────── */}
        <SportsCar x={240} y={690} />

        {/* ── Wet street reflections ────────────────────────────────── */}
        {/* Building center */}
        {[192, 195, 198].map((rx, i) => (
          <Path key={i}
            d={`M ${rx} 671 C ${rx + 2} ${700 + i * 10}, ${rx - 2} ${720 + i * 8}, ${rx + 1} ${750 + i * 5}`}
            stroke="#FF2FAE" strokeWidth={1.2} strokeLinecap="round"
            fill="none" strokeOpacity={0.20 - i * 0.05} />
        ))}
        {/* Hotel sign left */}
        <Path d="M 31 671 C 33 700, 29 725, 31 755"
          stroke="#FF2FAE" strokeWidth={1.0} strokeLinecap="round"
          fill="none" strokeOpacity={0.18} />
        {/* OCEAN DRIVE right — cyan reflection */}
        <Path d="M 325 671 C 327 698, 323 722, 325 748"
          stroke="#00E5FF" strokeWidth={1.0} strokeLinecap="round"
          fill="none" strokeOpacity={0.16} />
        {/* Car tail light */}
        <Path d="M 245 691 C 244 710, 246 728, 245 748"
          stroke="#FF0040" strokeWidth={2.0} strokeLinecap="round"
          fill="none" strokeOpacity={0.28} />

        {/* ── Puddle glows ──────────────────────────────────────────── */}
        <Ellipse cx={195} cy={730} rx={60} ry={9} fill="#FF2FAE" fillOpacity={0.07} />
        <Ellipse cx={260} cy={750} rx={40} ry={7} fill="#FF0040" fillOpacity={0.08} />
        <Ellipse cx={100} cy={745} rx={30} ry={6} fill="#FF2FAE" fillOpacity={0.05} />
        <Ellipse cx={320} cy={740} rx={28} ry={6} fill="#39FF14" fillOpacity={0.05} />

        {/* ── Subtle atmosphere haze strips ─────────────────────────── */}
        <Path d={`M 0 220 L ${VW} 220`}
          stroke="#CC0040" strokeWidth={0.4} strokeOpacity={0.06} />
        <Path d={`M 0 340 L ${VW} 340`}
          stroke="#CC0040" strokeWidth={0.4} strokeOpacity={0.05} />
      </Svg>
    </View>
  );
}
