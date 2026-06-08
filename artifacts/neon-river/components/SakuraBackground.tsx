import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  Line,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

const VW = 390;
const VH = 844;
const PINK   = '#F4A8C0';
const ROSE   = '#E8627A';
const PLUM   = '#C4407C';

// ─── Single sakura petal (elongated ellipse, rotated) ─────────────────────────
function Petal({
  cx, cy, rx, ry, angle, opacity,
}: {
  cx: number; cy: number; rx: number; ry: number; angle: number; opacity: number;
}) {
  return (
    <Ellipse
      cx={cx} cy={cy} rx={rx} ry={ry}
      fill={PINK} fillOpacity={opacity}
      transform={`rotate(${angle}, ${cx}, ${cy})`}
    />
  );
}

// ─── Cherry blossom cluster (circle + 4 small circles around) ─────────────────
function Blossom({ cx, cy, r, opacity }: { cx: number; cy: number; r: number; opacity: number }) {
  const petR = r * 0.65;
  const offsets: [number, number][] = [
    [0, -r], [r, 0], [0, r], [-r, 0],
  ];
  return (
    <>
      <Circle cx={cx} cy={cy} r={r * 0.55}
        fill={PINK} fillOpacity={opacity * 0.80} />
      {offsets.map(([ox, oy], i) => (
        <Circle key={i} cx={cx + ox} cy={cy + oy} r={petR}
          fill={PINK} fillOpacity={opacity * 0.65} />
      ))}
    </>
  );
}

export default function SakuraBackground() {
  // Scattered fallen petals — [cx, cy, rx, ry, angle, opacity]
  const petals: [number, number, number, number, number, number][] = [
    [55,  160, 7, 4, 20,  0.18],
    [310, 195, 6, 3.5, -35, 0.14],
    [130, 320, 8, 4.5, 55,  0.12],
    [280, 380, 7, 4,  -20, 0.16],
    [70,  460, 6, 3.5, 40,  0.13],
    [340, 500, 8, 5,  -50, 0.15],
    [160, 570, 7, 4,   30, 0.12],
    [240, 640, 6, 3.5, -15, 0.14],
    [95,  700, 8, 4.5,  60, 0.11],
    [320, 730, 7, 4,  -40, 0.13],
    [195, 790, 6, 3.5,  25, 0.10],
    [50,  800, 7, 4,   45, 0.09],
    [370, 260, 6, 3.5, -25, 0.11],
    [210, 130, 7, 4,   65, 0.13],
    [145, 770, 6, 3.5, -55, 0.10],
  ];

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* Base gradient — deep plum/rose */}
      <LinearGradient
        colors={['#200814', '#160510', '#0E030C', '#160510', '#200814']}
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
          {/* Soft top-center glow — pink */}
          <RadialGradient id="skTop" cx="50%" cy="0%" r="65%" fx="50%" fy="0%">
            <Stop offset="0" stopColor={ROSE} stopOpacity="0.22" />
            <Stop offset="1" stopColor={ROSE} stopOpacity="0" />
          </RadialGradient>
          {/* Center ambient glow */}
          <RadialGradient id="skMid" cx="50%" cy="52%" r="40%" fx="50%" fy="52%">
            <Stop offset="0" stopColor={PLUM} stopOpacity="0.14" />
            <Stop offset="1" stopColor={PLUM} stopOpacity="0" />
          </RadialGradient>
          {/* Bottom soft glow */}
          <RadialGradient id="skBot" cx="50%" cy="100%" r="55%" fx="50%" fy="100%">
            <Stop offset="0" stopColor={ROSE} stopOpacity="0.16" />
            <Stop offset="1" stopColor={ROSE} stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Glows */}
        <Rect x={0} y={0} width={VW} height={VH} fill="url(#skTop)" />
        <Rect x={0} y={0} width={VW} height={VH} fill="url(#skMid)" />
        <Rect x={0} y={0} width={VW} height={VH} fill="url(#skBot)" />

        {/* ── Top-left branch silhouette ─────────────────────────────────── */}
        {/* Main branch curving from top-left */}
        <Path
          d="M -10 0 Q 40 60, 80 120 Q 100 160, 95 200"
          fill="none" stroke={PLUM} strokeWidth={2.5} strokeOpacity={0.30}
          strokeLinecap="round"
        />
        {/* Sub-branch right */}
        <Path
          d="M 55 90 Q 95 85, 130 100"
          fill="none" stroke={PLUM} strokeWidth={1.5} strokeOpacity={0.24}
          strokeLinecap="round"
        />
        {/* Sub-branch upward */}
        <Path
          d="M 30 50 Q 50 30, 75 25"
          fill="none" stroke={PLUM} strokeWidth={1.5} strokeOpacity={0.22}
          strokeLinecap="round"
        />
        {/* Blossoms on top-left branch */}
        <Blossom cx={80}  cy={120} r={6}   opacity={0.38} />
        <Blossom cx={95}  cy={200} r={5.5} opacity={0.30} />
        <Blossom cx={130} cy={100} r={5}   opacity={0.28} />
        <Blossom cx={75}  cy={25}  r={4.5} opacity={0.24} />
        <Blossom cx={55}  cy={90}  r={4}   opacity={0.22} />

        {/* ── Top-right branch silhouette ────────────────────────────────── */}
        <Path
          d="M 400 0 Q 355 55, 315 115 Q 295 155, 298 195"
          fill="none" stroke={PLUM} strokeWidth={2.5} strokeOpacity={0.30}
          strokeLinecap="round"
        />
        {/* Sub-branch left */}
        <Path
          d="M 335 88 Q 295 83, 260 98"
          fill="none" stroke={PLUM} strokeWidth={1.5} strokeOpacity={0.24}
          strokeLinecap="round"
        />
        {/* Sub-branch upward */}
        <Path
          d="M 360 48 Q 342 28, 318 22"
          fill="none" stroke={PLUM} strokeWidth={1.5} strokeOpacity={0.22}
          strokeLinecap="round"
        />
        {/* Blossoms on top-right branch */}
        <Blossom cx={315} cy={115} r={6}   opacity={0.38} />
        <Blossom cx={298} cy={195} r={5.5} opacity={0.30} />
        <Blossom cx={260} cy={98}  r={5}   opacity={0.28} />
        <Blossom cx={318} cy={22}  r={4.5} opacity={0.24} />
        <Blossom cx={335} cy={88}  r={4}   opacity={0.22} />

        {/* ── Bottom-left branch fragment ────────────────────────────────── */}
        <Path
          d="M -10 844 Q 45 810, 90 780 Q 120 760, 130 740"
          fill="none" stroke={PLUM} strokeWidth={2.0} strokeOpacity={0.20}
          strokeLinecap="round"
        />
        <Blossom cx={90}  cy={780} r={4.5} opacity={0.18} />
        <Blossom cx={130} cy={740} r={4}   opacity={0.15} />

        {/* ── Bottom-right branch fragment ───────────────────────────────── */}
        <Path
          d="M 400 844 Q 348 812, 302 782 Q 272 762, 262 742"
          fill="none" stroke={PLUM} strokeWidth={2.0} strokeOpacity={0.20}
          strokeLinecap="round"
        />
        <Blossom cx={302} cy={782} r={4.5} opacity={0.18} />
        <Blossom cx={262} cy={742} r={4}   opacity={0.15} />

        {/* ── Scattered fallen petals ────────────────────────────────────── */}
        {petals.map(([cx, cy, rx, ry, angle, opacity], i) => (
          <Petal key={i} cx={cx} cy={cy} rx={rx} ry={ry} angle={angle} opacity={opacity} />
        ))}

        {/* ── Subtle horizontal wave lines (Japanese-inspired) ───────────── */}
        {[280, 420, 560, 700].map((y, i) => (
          <Path
            key={i}
            d={`M 0 ${y} Q 65 ${y - 6}, 130 ${y} Q 195 ${y + 6}, 260 ${y} Q 325 ${y - 6}, 390 ${y}`}
            fill="none" stroke={PINK} strokeWidth={0.5} strokeOpacity={0.06}
          />
        ))}

        {/* ── Side accent lines ──────────────────────────────────────────── */}
        <Line x1={8}   y1={220} x2={8}   y2={620} stroke={PINK} strokeWidth={0.8} strokeOpacity={0.14} />
        <Line x1={382} y1={220} x2={382} y2={620} stroke={PINK} strokeWidth={0.8} strokeOpacity={0.14} />

        {/* ── Top & bottom horizontal accents ───────────────────────────── */}
        <Line x1={70}  y1={30}  x2={320} y2={30}  stroke={PINK} strokeWidth={0.6} strokeOpacity={0.18} />
        <Line x1={70}  y1={814} x2={320} y2={814} stroke={PINK} strokeWidth={0.6} strokeOpacity={0.18} />

        {/* ── Top & bottom vignettes ─────────────────────────────────────── */}
        <Rect x={0} y={0}        width={VW} height={110} fill="rgba(14,3,12,0.50)" />
        <Rect x={0} y={VH - 110} width={VW} height={110} fill="rgba(14,3,12,0.45)" />
      </Svg>
    </View>
  );
}
