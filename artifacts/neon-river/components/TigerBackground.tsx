import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Circle,
  Defs,
  Line,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

const VW = 390;
const VH = 844;
const GOLD = '#C8940A';

export default function TigerBackground() {
  // Diagonal tiger stripes — dark amber at very low opacity
  const stripes: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = -5; i < 14; i++) {
    const x = i * 48 - 20;
    stripes.push({ x1: x, y1: 0, x2: x + 270, y2: VH });
  }

  // Fortune coin positions [cx, cy]
  const coins: [number, number][] = [
    [32, 58],
    [358, 58],
    [32, 786],
    [358, 786],
  ];

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* Base gradient — near-black with warm amber undertone */}
      <LinearGradient
        colors={['#0E0900', '#080500', '#040300', '#080500', '#0E0900']}
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
          {/* Gold top spotlight */}
          <RadialGradient id="tgTop" cx="50%" cy="0%" r="65%" fx="50%" fy="0%">
            <Stop offset="0" stopColor={GOLD} stopOpacity="0.20" />
            <Stop offset="1" stopColor={GOLD} stopOpacity="0" />
          </RadialGradient>
          {/* Warm center glow */}
          <RadialGradient id="tgCenter" cx="50%" cy="55%" r="38%" fx="50%" fy="55%">
            <Stop offset="0" stopColor="#7A4800" stopOpacity="0.14" />
            <Stop offset="1" stopColor="#7A4800" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Glows */}
        <Rect x={0} y={0} width={VW} height={VH} fill="url(#tgTop)" />
        <Rect x={0} y={0} width={VW} height={VH} fill="url(#tgCenter)" />

        {/* ── Tiger stripes ─────────────────────────────────────────────── */}
        {stripes.map((s, i) => (
          <Line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
            stroke={GOLD} strokeWidth={20} strokeOpacity={0.025} />
        ))}
        {/* Secondary thinner stripes offset */}
        {stripes.map((s, i) => (
          <Line key={`b${i}`}
            x1={s.x1 + 18} y1={s.y1}
            x2={s.x2 + 18} y2={s.y2}
            stroke={GOLD} strokeWidth={8} strokeOpacity={0.018} />
        ))}

        {/* ── Tiger head silhouette ─────────────────────────────────────── */}
        {/* Head */}
        <Path
          d="M 152 304 C 142 272, 158 248, 192 242 L 193 220 C 193 213, 200 208, 207 213 L 215 234 C 238 231, 258 242, 263 258 C 278 252, 286 263, 278 276 C 281 286, 280 302, 271 318 C 265 336, 247 356, 224 363 C 220 365, 216 365, 212 365 C 208 365, 203 365, 199 363 C 176 356, 158 336, 152 318 C 145 306, 143 298, 152 304 Z"
          fill="#080500" fillOpacity={0.50}
          stroke={GOLD} strokeWidth={1.0} strokeOpacity={0.20}
        />
        {/* Left ear */}
        <Path d="M 162 262 L 172 242 L 186 258 Z"
          fill="#080500" fillOpacity={0.45}
          stroke={GOLD} strokeWidth={0.8} strokeOpacity={0.16} />
        {/* Right ear */}
        <Path d="M 247 258 L 260 240 L 270 260 Z"
          fill="#080500" fillOpacity={0.45}
          stroke={GOLD} strokeWidth={0.8} strokeOpacity={0.16} />
        {/* Left eye */}
        <Path d="M 178 302 C 184 295, 196 295, 198 302 C 196 309, 184 309, 178 302 Z"
          fill="#1A0E00" fillOpacity={0.60}
          stroke={GOLD} strokeWidth={0.9} strokeOpacity={0.26} />
        {/* Right eye */}
        <Path d="M 222 302 C 226 295, 238 295, 240 302 C 238 309, 226 309, 222 302 Z"
          fill="#1A0E00" fillOpacity={0.60}
          stroke={GOLD} strokeWidth={0.9} strokeOpacity={0.26} />
        {/* Forehead stripes */}
        <Line x1={210} y1={249} x2={210} y2={268}
          stroke={GOLD} strokeWidth={3} strokeOpacity={0.13} strokeLinecap="round" />
        <Line x1={200} y1={253} x2={199} y2={271}
          stroke={GOLD} strokeWidth={2} strokeOpacity={0.10} strokeLinecap="round" />
        <Line x1={220} y1={253} x2={221} y2={271}
          stroke={GOLD} strokeWidth={2} strokeOpacity={0.10} strokeLinecap="round" />
        {/* Whiskers — left */}
        <Line x1={152} y1={322} x2={188} y2={326}
          stroke={GOLD} strokeWidth={0.8} strokeOpacity={0.11} strokeLinecap="round" />
        <Line x1={150} y1={330} x2={188} y2={332}
          stroke={GOLD} strokeWidth={0.8} strokeOpacity={0.11} strokeLinecap="round" />
        {/* Whiskers — right */}
        <Line x1={236} y1={326} x2={272} y2={322}
          stroke={GOLD} strokeWidth={0.8} strokeOpacity={0.11} strokeLinecap="round" />
        <Line x1={236} y1={332} x2={274} y2={330}
          stroke={GOLD} strokeWidth={0.8} strokeOpacity={0.11} strokeLinecap="round" />

        {/* ── Chinese cloud motifs — bottom ─────────────────────────────── */}
        <Path
          d="M 18 688 Q 32 673, 52 682 Q 58 661, 76 666 Q 86 651, 108 660 Q 118 644, 134 654 Q 140 638, 158 649 Q 158 669, 146 676 Q 150 690, 132 694 Q 122 706, 100 700 Q 79 710, 58 700 Q 37 708, 25 694 Q 10 688, 18 688 Z"
          fill="none" stroke={GOLD} strokeWidth={0.9} strokeOpacity={0.09}
        />
        <Path
          d="M 232 688 Q 246 673, 266 682 Q 272 661, 290 666 Q 300 651, 322 660 Q 332 644, 348 654 Q 354 638, 372 649 Q 372 669, 360 676 Q 364 690, 346 694 Q 336 706, 314 700 Q 293 710, 272 700 Q 251 708, 239 694 Q 224 688, 232 688 Z"
          fill="none" stroke={GOLD} strokeWidth={0.9} strokeOpacity={0.09}
        />

        {/* ── Fortune coins (circle + inner ring + square hole) ─────────── */}
        {coins.map(([cx, cy], i) => (
          <React.Fragment key={i}>
            <Circle cx={cx} cy={cy} r={15}
              fill="none" stroke={GOLD} strokeWidth={1.0} strokeOpacity={0.24} />
            <Circle cx={cx} cy={cy} r={10}
              fill="none" stroke={GOLD} strokeWidth={0.6} strokeOpacity={0.16} />
            <Rect
              x={cx - 5} y={cy - 5} width={10} height={10}
              fill="none" stroke={GOLD} strokeWidth={0.7} strokeOpacity={0.20}
            />
          </React.Fragment>
        ))}

        {/* ── Edge accent lines ─────────────────────────────────────────── */}
        <Line x1={8}   y1={200} x2={8}   y2={644} stroke={GOLD} strokeWidth={1.0} strokeOpacity={0.16} />
        <Line x1={13}  y1={220} x2={13}  y2={624} stroke={GOLD} strokeWidth={0.5} strokeOpacity={0.09} />
        <Line x1={382} y1={200} x2={382} y2={644} stroke={GOLD} strokeWidth={1.0} strokeOpacity={0.16} />
        <Line x1={377} y1={220} x2={377} y2={624} stroke={GOLD} strokeWidth={0.5} strokeOpacity={0.09} />

        {/* Top / bottom horizontal accents */}
        <Line x1={62}  y1={28}  x2={328} y2={28}  stroke={GOLD} strokeWidth={0.7} strokeOpacity={0.20} />
        <Line x1={62}  y1={816} x2={328} y2={816} stroke={GOLD} strokeWidth={0.7} strokeOpacity={0.20} />

        {/* Top & bottom vignettes */}
        <Rect x={0} y={0}       width={VW} height={110} fill="rgba(4,2,0,0.52)" />
        <Rect x={0} y={VH - 110} width={VW} height={110} fill="rgba(4,2,0,0.48)" />
      </Svg>
    </View>
  );
}
