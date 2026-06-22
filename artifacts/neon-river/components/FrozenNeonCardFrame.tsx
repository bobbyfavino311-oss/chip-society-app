import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop, Line, Circle, Path, Ellipse } from 'react-native-svg';

interface FrozenNeonCardFrameProps {
  width: number;
  height: number;
}

const CYAN  = '#00D9FF';
const ICE   = '#8FEFFF';
const WHITE = '#F5FCFF';

export default function FrozenNeonCardFrame({ width: w, height: h }: FrozenNeonCardFrameProps) {
  if (w === 0 || h === 0) return null;

  const PAD   = 4;
  const PAD2  = 9;
  const PAD3  = 14;
  const R_OUT = 10;
  const R_IN  = 7;
  const R_IN2 = 4;

  const corners: [number, number][] = [
    [PAD + 9,       PAD + 9],
    [w - PAD - 9,   PAD + 9],
    [PAD + 9,       h - PAD - 9],
    [w - PAD - 9,   h - PAD - 9],
  ];

  return (
    <View style={[StyleSheet.absoluteFillObject, { zIndex: 10 }]} pointerEvents="none">
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Defs>
          {/* Top illuminated edge — brightest at center */}
          <LinearGradient id="cfTopEdge" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0"    stopColor={CYAN}  stopOpacity="0"    />
            <Stop offset="0.15" stopColor={CYAN}  stopOpacity="0.55" />
            <Stop offset="0.40" stopColor={ICE}   stopOpacity="0.90" />
            <Stop offset="0.50" stopColor={WHITE} stopOpacity="1.00" />
            <Stop offset="0.60" stopColor={ICE}   stopOpacity="0.90" />
            <Stop offset="0.85" stopColor={CYAN}  stopOpacity="0.55" />
            <Stop offset="1"    stopColor={CYAN}  stopOpacity="0"    />
          </LinearGradient>

          {/* Bottom edge — slightly dimmer */}
          <LinearGradient id="cfBotEdge" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0"    stopColor={CYAN}  stopOpacity="0"    />
            <Stop offset="0.20" stopColor={CYAN}  stopOpacity="0.40" />
            <Stop offset="0.50" stopColor={ICE}   stopOpacity="0.65" />
            <Stop offset="0.80" stopColor={CYAN}  stopOpacity="0.40" />
            <Stop offset="1"    stopColor={CYAN}  stopOpacity="0"    />
          </LinearGradient>

          {/* Left/right edges */}
          <LinearGradient id="cfLeftEdge" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0"    stopColor={CYAN}  stopOpacity="0"    />
            <Stop offset="0.25" stopColor={CYAN}  stopOpacity="0.35" />
            <Stop offset="0.50" stopColor={ICE}   stopOpacity="0.50" />
            <Stop offset="0.75" stopColor={CYAN}  stopOpacity="0.35" />
            <Stop offset="1"    stopColor={CYAN}  stopOpacity="0"    />
          </LinearGradient>
          <LinearGradient id="cfRightEdge" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0"    stopColor={CYAN}  stopOpacity="0"    />
            <Stop offset="0.25" stopColor={CYAN}  stopOpacity="0.35" />
            <Stop offset="0.50" stopColor={ICE}   stopOpacity="0.50" />
            <Stop offset="0.75" stopColor={CYAN}  stopOpacity="0.35" />
            <Stop offset="1"    stopColor={CYAN}  stopOpacity="0"    />
          </LinearGradient>

          {/* Frosted glass fill — interior fill gradient */}
          <LinearGradient id="cfFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0"    stopColor={ICE}   stopOpacity="0.06" />
            <Stop offset="0.35" stopColor={CYAN}  stopOpacity="0.03" />
            <Stop offset="1"    stopColor={CYAN}  stopOpacity="0.01" />
          </LinearGradient>

          {/* Internal reflection — top highlight sheen */}
          <LinearGradient id="cfSheen" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0"   stopColor={WHITE} stopOpacity="0.09" />
            <Stop offset="0.5" stopColor={WHITE} stopOpacity="0.02" />
            <Stop offset="1"   stopColor={WHITE} stopOpacity="0"    />
          </LinearGradient>

          {/* Outer glow bloom — radial, centered */}
          <RadialGradient id="cfGlow" cx="50%" cy="50%" r="55%">
            <Stop offset="0"   stopColor={CYAN}  stopOpacity="0.10" />
            <Stop offset="1"   stopColor={CYAN}  stopOpacity="0"    />
          </RadialGradient>
        </Defs>

        {/* ── Outer ambient bloom ────────────────────────────────────────────── */}
        <Rect
          x={-6} y={-6}
          width={w + 12} height={h + 12}
          rx={R_OUT + 4} ry={R_OUT + 4}
          fill="url(#cfGlow)"
        />

        {/* ── Frosted glass fill ─────────────────────────────────────────────── */}
        <Rect
          x={PAD + 1} y={PAD + 1}
          width={w - (PAD + 1) * 2} height={h - (PAD + 1) * 2}
          rx={R_IN} ry={R_IN}
          fill="url(#cfFill)"
        />

        {/* ── Outer border — full cyan with rounded corners ─────────────────── */}
        <Rect
          x={PAD} y={PAD}
          width={w - PAD * 2} height={h - PAD * 2}
          rx={R_OUT} ry={R_OUT}
          fill="none"
          stroke={CYAN} strokeWidth={1.4} strokeOpacity={0.55}
        />

        {/* ── Middle border — ice blue, thinner ─────────────────────────────── */}
        <Rect
          x={PAD2} y={PAD2}
          width={w - PAD2 * 2} height={h - PAD2 * 2}
          rx={R_IN} ry={R_IN}
          fill="none"
          stroke={ICE} strokeWidth={0.7} strokeOpacity={0.28}
        />

        {/* ── Inner border — very subtle ────────────────────────────────────── */}
        <Rect
          x={PAD3} y={PAD3}
          width={w - PAD3 * 2} height={h - PAD3 * 2}
          rx={R_IN2} ry={R_IN2}
          fill="none"
          stroke={WHITE} strokeWidth={0.4} strokeOpacity={0.12}
        />

        {/* ── Edge glow bars ────────────────────────────────────────────────── */}
        {/* Top — brightest */}
        <Rect x={PAD} y={PAD}           width={w - PAD * 2} height={2.2} fill="url(#cfTopEdge)" />
        {/* Bottom */}
        <Rect x={PAD} y={h - PAD - 2.2} width={w - PAD * 2} height={2.2} fill="url(#cfBotEdge)" />
        {/* Left */}
        <Rect x={PAD} y={PAD}           width={2.0} height={h - PAD * 2} fill="url(#cfLeftEdge)" />
        {/* Right */}
        <Rect x={w - PAD - 2.0} y={PAD}  width={2.0} height={h - PAD * 2} fill="url(#cfRightEdge)" />

        {/* ── Internal sheen — top frosted-glass reflection ─────────────────── */}
        <Rect
          x={PAD + 2} y={PAD + 2}
          width={w - (PAD + 2) * 2} height={(h - PAD * 2) * 0.30}
          rx={R_IN} ry={R_IN}
          fill="url(#cfSheen)"
        />

        {/* ── Corner diamond accents ────────────────────────────────────────── */}
        {corners.map(([cx, cy], i) => (
          <React.Fragment key={i}>
            {/* Outer glow dot */}
            <Circle cx={cx} cy={cy} r={5} fill={CYAN} fillOpacity={0.12} />
            {/* Diamond shape */}
            <Path
              d={`M ${cx} ${cy - 6} L ${cx + 5} ${cy} L ${cx} ${cy + 6} L ${cx - 5} ${cy} Z`}
              fill={CYAN} fillOpacity={0.28}
              stroke={ICE} strokeWidth={0.8} strokeOpacity={0.65}
            />
            {/* Center dot */}
            <Circle cx={cx} cy={cy} r={1.5} fill={WHITE} fillOpacity={0.80} />
          </React.Fragment>
        ))}

        {/* ── Top center accent — notch marker ──────────────────────────────── */}
        <Line
          x1={w / 2 - 12} y1={PAD + 1}
          x2={w / 2 + 12} y2={PAD + 1}
          stroke={WHITE} strokeWidth={1.2} strokeOpacity={0.45}
        />
        {/* Small center dot on top edge */}
        <Circle cx={w / 2} cy={PAD + 1} r={1.8} fill={WHITE} fillOpacity={0.65} />

        {/* Bottom center accent */}
        <Line
          x1={w / 2 - 10} y1={h - PAD - 1}
          x2={w / 2 + 10} y2={h - PAD - 1}
          stroke={ICE} strokeWidth={0.9} strokeOpacity={0.35}
        />

        {/* ── Side mid-point ticks ──────────────────────────────────────────── */}
        <Line
          x1={PAD + 1} y1={h / 2 - 6}
          x2={PAD + 1} y2={h / 2 + 6}
          stroke={CYAN} strokeWidth={1.0} strokeOpacity={0.40}
        />
        <Line
          x1={w - PAD - 1} y1={h / 2 - 6}
          x2={w - PAD - 1} y2={h / 2 + 6}
          stroke={CYAN} strokeWidth={1.0} strokeOpacity={0.40}
        />

        {/* ── Top-edge inner reflection arc — machined glass effect ─────────── */}
        <Ellipse
          cx={w / 2} cy={PAD + 8}
          rx={w * 0.32} ry={6}
          fill={WHITE} fillOpacity={0.04}
        />
      </Svg>
    </View>
  );
}
