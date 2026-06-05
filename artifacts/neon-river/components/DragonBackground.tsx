import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  G,
  Path,
  Polygon,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

const { width: W, height: H } = Dimensions.get('window');

// ─── Dragon spine — S-curve sweeping from top-center down the right side ──────
// All values as fractions of W / H so it scales across device sizes
const sx = (f: number) => f * W;
const sy = (f: number) => f * H;

const SPINE = [
  `M ${sx(0.62)} ${sy(0.02)}`,
  `C ${sx(0.95)} ${sy(0.07)}, ${sx(1.05)} ${sy(0.22)}, ${sx(0.96)} ${sy(0.34)}`,
  `C ${sx(0.87)} ${sy(0.46)}, ${sx(0.74)} ${sy(0.50)}, ${sx(0.82)} ${sy(0.63)}`,
  `C ${sx(0.90)} ${sy(0.76)}, ${sx(0.84)} ${sy(0.88)}, ${sx(0.70)} ${sy(0.96)}`,
].join(' ');

// Head region — roughly top-right quadrant
const HEAD_CX = sx(0.72);
const HEAD_CY = sy(0.06);

// ─── Chinese cloud formations ──────────────────────────────────────────────────
// Bottom-left cloud
const CLOUD_BL = [
  `M ${sx(0.00)} ${sy(0.92)}`,
  `C ${sx(0.04)} ${sy(0.84)}, ${sx(0.14)} ${sy(0.87)}, ${sx(0.12)} ${sy(0.93)}`,
  `C ${sx(0.18)} ${sy(0.89)}, ${sx(0.26)} ${sy(0.93)}, ${sx(0.22)} ${sy(0.98)}`,
  `C ${sx(0.28)} ${sy(0.95)}, ${sx(0.34)} ${sy(1.00)}, ${sx(0.26)} ${sy(1.04)}`,
  `L ${sx(0.00)} ${sy(1.04)} Z`,
].join(' ');

// Bottom-right cloud
const CLOUD_BR = [
  `M ${sx(1.00)} ${sy(0.88)}`,
  `C ${sx(0.96)} ${sy(0.82)}, ${sx(0.86)} ${sy(0.84)}, ${sx(0.88)} ${sy(0.90)}`,
  `C ${sx(0.82)} ${sy(0.87)}, ${sx(0.75)} ${sy(0.90)}, ${sx(0.78)} ${sy(0.96)}`,
  `C ${sx(0.72)} ${sy(0.93)}, ${sx(0.68)} ${sy(0.98)}, ${sx(0.74)} ${sy(1.02)}`,
  `L ${sx(1.00)} ${sy(1.02)} Z`,
].join(' ');

// ─── Scale shapes — overlapping diamond rows along the body ────────────────────
function scalePoints(
  cx: number, cy: number, w: number, h: number
): string {
  return `${cx},${cy - h} ${cx + w},${cy} ${cx},${cy + h} ${cx - w},${cy}`;
}

// Sample scales at key points along the spine
const SCALE_POSITIONS = [
  { cx: sx(0.78), cy: sy(0.12), w: 14, h: 9 },
  { cx: sx(0.92), cy: sy(0.20), w: 18, h: 11 },
  { cx: sx(0.97), cy: sy(0.28), w: 20, h: 13 },
  { cx: sx(0.93), cy: sy(0.35), w: 18, h: 12 },
  { cx: sx(0.86), cy: sy(0.43), w: 16, h: 10 },
  { cx: sx(0.80), cy: sy(0.50), w: 15, h: 9 },
  { cx: sx(0.83), cy: sy(0.58), w: 17, h: 11 },
  { cx: sx(0.88), cy: sy(0.65), w: 19, h: 12 },
  { cx: sx(0.89), cy: sy(0.73), w: 16, h: 10 },
  { cx: sx(0.84), cy: sy(0.80), w: 14, h: 9 },
  { cx: sx(0.78), cy: sy(0.87), w: 12, h: 8 },
  { cx: sx(0.73), cy: sy(0.93), w: 10, h: 7 },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function DragonBackground() {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          <RadialGradient id="headGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%"  stopColor="#8B0000" stopOpacity="0.35" />
            <Stop offset="100%" stopColor="#8B0000" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="eyeGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%"  stopColor="#C89B3C" stopOpacity="0.8" />
            <Stop offset="60%" stopColor="#8B0000" stopOpacity="0.4" />
            <Stop offset="100%" stopColor="#8B0000" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* ── Cloud formations ────────────────────────────────────────────── */}
        <Path d={CLOUD_BL} fill="#3B0000" fillOpacity={0.55} />
        <Path d={CLOUD_BL} fill="none" stroke="#8B0000" strokeWidth={0.8} strokeOpacity={0.4} />

        <Path d={CLOUD_BR} fill="#3B0000" fillOpacity={0.55} />
        <Path d={CLOUD_BR} fill="none" stroke="#8B0000" strokeWidth={0.8} strokeOpacity={0.4} />

        {/* ── Dragon body — shadow / ambient glow layer ───────────────────── */}
        <Path
          d={SPINE}
          stroke="#3B0000"
          strokeWidth={90}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity={0.28}
        />

        {/* ── Dragon body — main body layer ───────────────────────────────── */}
        <Path
          d={SPINE}
          stroke="#5a0000"
          strokeWidth={58}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity={0.40}
        />

        {/* ── Dragon body — ridgeline ─────────────────────────────────────── */}
        <Path
          d={SPINE}
          stroke="#8B0000"
          strokeWidth={28}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity={0.50}
        />

        {/* ── Dragon body — surface highlight ────────────────────────────── */}
        <Path
          d={SPINE}
          stroke="#C89B3C"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity={0.22}
        />

        {/* ── Scale diamond shapes along the body ────────────────────────── */}
        {SCALE_POSITIONS.map((sp, i) => (
          <G key={i}>
            <Polygon
              points={scalePoints(sp.cx, sp.cy, sp.w, sp.h)}
              fill="#1a0000"
              fillOpacity={0.6}
              stroke="#C89B3C"
              strokeWidth={0.6}
              strokeOpacity={0.3}
            />
            {/* Inner diamond */}
            <Polygon
              points={scalePoints(sp.cx, sp.cy, sp.w * 0.5, sp.h * 0.5)}
              fill="none"
              stroke="#8B0000"
              strokeWidth={0.4}
              strokeOpacity={0.4}
            />
          </G>
        ))}

        {/* ── Head region — atmospheric glow ─────────────────────────────── */}
        <Ellipse
          cx={HEAD_CX}
          cy={HEAD_CY}
          rx={sx(0.22)}
          ry={sy(0.09)}
          fill="url(#headGlow)"
        />

        {/* ── Dragon eye hints — faint gold ────────────────────────────────── */}
        <Circle cx={sx(0.68)} cy={sy(0.04)} r={8} fill="url(#eyeGlow)" opacity={0.65} />
        <Circle cx={sx(0.68)} cy={sy(0.04)} r={3} fill="#C89B3C" opacity={0.5} />

        {/* ── Subtle red lantern / orb accents on left ────────────────────── */}
        <Circle cx={sx(0.08)} cy={sy(0.22)} r={sx(0.025)} fill="#8B0000" fillOpacity={0.12} />
        <Circle cx={sx(0.08)} cy={sy(0.22)} r={sx(0.012)} fill="#C89B3C" fillOpacity={0.15} />

        <Circle cx={sx(0.05)} cy={sy(0.45)} r={sx(0.018)} fill="#8B0000" fillOpacity={0.10} />
        <Circle cx={sx(0.05)} cy={sy(0.45)} r={sx(0.008)} fill="#C89B3C" fillOpacity={0.12} />
      </Svg>
    </View>
  );
}
