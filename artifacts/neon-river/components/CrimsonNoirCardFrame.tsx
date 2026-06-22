import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop, Line, Circle, Path, Ellipse } from 'react-native-svg';

interface CrimsonNoirCardFrameProps {
  width: number;
  height: number;
}

const CRIMSON = '#D4002A';
const RUBY    = '#A0001C';
const SILVER  = '#C8C8C8';
const WHITE   = '#F0F0F0';

export default function CrimsonNoirCardFrame({ width: w, height: h }: CrimsonNoirCardFrameProps) {
  if (w === 0 || h === 0) return null;

  const PAD   = 4;
  const PAD2  = 9;
  const PAD3  = 14;
  const R_OUT = 10;
  const R_IN  = 6;
  const R_IN2 = 3;

  const corners: [number, number][] = [
    [PAD + 8,       PAD + 8],
    [w - PAD - 8,   PAD + 8],
    [PAD + 8,       h - PAD - 8],
    [w - PAD - 8,   h - PAD - 8],
  ];

  return (
    <View style={[StyleSheet.absoluteFillObject, { zIndex: 10 }]} pointerEvents="none">
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Defs>
          {/* Top edge — crimson hot at center, fades to edges */}
          <LinearGradient id="cnTopEdge" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0"    stopColor={CRIMSON} stopOpacity="0"    />
            <Stop offset="0.15" stopColor={CRIMSON} stopOpacity="0.50" />
            <Stop offset="0.40" stopColor={RUBY}    stopOpacity="0.75" />
            <Stop offset="0.50" stopColor={SILVER}  stopOpacity="0.85" />
            <Stop offset="0.60" stopColor={RUBY}    stopOpacity="0.75" />
            <Stop offset="0.85" stopColor={CRIMSON} stopOpacity="0.50" />
            <Stop offset="1"    stopColor={CRIMSON} stopOpacity="0"    />
          </LinearGradient>

          {/* Bottom edge */}
          <LinearGradient id="cnBotEdge" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0"    stopColor={CRIMSON} stopOpacity="0"    />
            <Stop offset="0.20" stopColor={RUBY}    stopOpacity="0.40" />
            <Stop offset="0.50" stopColor={CRIMSON} stopOpacity="0.60" />
            <Stop offset="0.80" stopColor={RUBY}    stopOpacity="0.40" />
            <Stop offset="1"    stopColor={CRIMSON} stopOpacity="0"    />
          </LinearGradient>

          {/* Left/right edges */}
          <LinearGradient id="cnLeftEdge" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0"    stopColor={CRIMSON} stopOpacity="0"    />
            <Stop offset="0.25" stopColor={RUBY}    stopOpacity="0.35" />
            <Stop offset="0.50" stopColor={CRIMSON} stopOpacity="0.48" />
            <Stop offset="0.75" stopColor={RUBY}    stopOpacity="0.35" />
            <Stop offset="1"    stopColor={CRIMSON} stopOpacity="0"    />
          </LinearGradient>
          <LinearGradient id="cnRightEdge" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0"    stopColor={CRIMSON} stopOpacity="0"    />
            <Stop offset="0.25" stopColor={RUBY}    stopOpacity="0.35" />
            <Stop offset="0.50" stopColor={CRIMSON} stopOpacity="0.48" />
            <Stop offset="0.75" stopColor={RUBY}    stopOpacity="0.35" />
            <Stop offset="1"    stopColor={CRIMSON} stopOpacity="0"    />
          </LinearGradient>

          {/* Smoked glass interior fill */}
          <LinearGradient id="cnFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0"   stopColor="#1A0008" stopOpacity="0.08" />
            <Stop offset="0.4" stopColor="#0A0003" stopOpacity="0.05" />
            <Stop offset="1"   stopColor="#050005" stopOpacity="0.02" />
          </LinearGradient>

          {/* Top sheen — smoked glass reflection */}
          <LinearGradient id="cnSheen" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0"   stopColor={SILVER} stopOpacity="0.07" />
            <Stop offset="0.5" stopColor={SILVER} stopOpacity="0.02" />
            <Stop offset="1"   stopColor={SILVER} stopOpacity="0"    />
          </LinearGradient>

          {/* Outer glow — subtle crimson bloom around tray */}
          <RadialGradient id="cnGlow" cx="50%" cy="50%" r="60%">
            <Stop offset="0"   stopColor={RUBY}    stopOpacity="0.08" />
            <Stop offset="1"   stopColor={RUBY}    stopOpacity="0"    />
          </RadialGradient>
        </Defs>

        {/* ── Outer ambient bloom ────────────────────────────────────────────── */}
        <Rect
          x={-8} y={-8}
          width={w + 16} height={h + 16}
          rx={R_OUT + 6} ry={R_OUT + 6}
          fill="url(#cnGlow)"
        />

        {/* ── Smoked glass fill ─────────────────────────────────────────────── */}
        <Rect
          x={PAD + 1} y={PAD + 1}
          width={w - (PAD + 1) * 2} height={h - (PAD + 1) * 2}
          rx={R_IN} ry={R_IN}
          fill="url(#cnFill)"
        />

        {/* ── Outer border — crimson precision edge ─────────────────────────── */}
        <Rect
          x={PAD} y={PAD}
          width={w - PAD * 2} height={h - PAD * 2}
          rx={R_OUT} ry={R_OUT}
          fill="none"
          stroke={CRIMSON} strokeWidth={1.2} strokeOpacity={0.55}
        />

        {/* ── Middle border — ruby, thinner ─────────────────────────────────── */}
        <Rect
          x={PAD2} y={PAD2}
          width={w - PAD2 * 2} height={h - PAD2 * 2}
          rx={R_IN} ry={R_IN}
          fill="none"
          stroke={RUBY} strokeWidth={0.6} strokeOpacity={0.28}
        />

        {/* ── Inner border — barely-there ────────────────────────────────────── */}
        <Rect
          x={PAD3} y={PAD3}
          width={w - PAD3 * 2} height={h - PAD3 * 2}
          rx={R_IN2} ry={R_IN2}
          fill="none"
          stroke={SILVER} strokeWidth={0.35} strokeOpacity={0.10}
        />

        {/* ── Glowing edge bars ─────────────────────────────────────────────── */}
        <Rect x={PAD} y={PAD}           width={w - PAD * 2} height={2.0} fill="url(#cnTopEdge)" />
        <Rect x={PAD} y={h - PAD - 2.0} width={w - PAD * 2} height={2.0} fill="url(#cnBotEdge)" />
        <Rect x={PAD} y={PAD}           width={1.8}          height={h - PAD * 2} fill="url(#cnLeftEdge)" />
        <Rect x={w - PAD - 1.8} y={PAD} width={1.8}          height={h - PAD * 2} fill="url(#cnRightEdge)" />

        {/* ── Internal sheen — smoked glass top highlight ────────────────────── */}
        <Rect
          x={PAD + 2} y={PAD + 2}
          width={w - (PAD + 2) * 2} height={(h - PAD * 2) * 0.28}
          rx={R_IN} ry={R_IN}
          fill="url(#cnSheen)"
        />

        {/* ── Corner diamond accents ────────────────────────────────────────── */}
        {corners.map(([cx, cy], i) => (
          <React.Fragment key={i}>
            <Circle cx={cx} cy={cy} r={5.5} fill={CRIMSON} fillOpacity={0.10} />
            <Path
              d={`M ${cx} ${cy - 5.5} L ${cx + 4.5} ${cy} L ${cx} ${cy + 5.5} L ${cx - 4.5} ${cy} Z`}
              fill={RUBY} fillOpacity={0.25}
              stroke={CRIMSON} strokeWidth={0.8} strokeOpacity={0.65}
            />
            <Circle cx={cx} cy={cy} r={1.4} fill={SILVER} fillOpacity={0.75} />
          </React.Fragment>
        ))}

        {/* ── Top center marker ─────────────────────────────────────────────── */}
        <Line
          x1={w / 2 - 10} y1={PAD + 1}
          x2={w / 2 + 10} y2={PAD + 1}
          stroke={SILVER} strokeWidth={1.0} strokeOpacity={0.40}
        />
        <Circle cx={w / 2} cy={PAD + 1} r={1.6} fill={WHITE} fillOpacity={0.60} />

        {/* ── Bottom center marker ──────────────────────────────────────────── */}
        <Line
          x1={w / 2 - 8} y1={h - PAD - 1}
          x2={w / 2 + 8} y2={h - PAD - 1}
          stroke={CRIMSON} strokeWidth={0.8} strokeOpacity={0.35}
        />

        {/* ── Side mid-point ticks ──────────────────────────────────────────── */}
        <Line x1={PAD + 1} y1={h / 2 - 5} x2={PAD + 1} y2={h / 2 + 5}
          stroke={CRIMSON} strokeWidth={0.9} strokeOpacity={0.42} />
        <Line x1={w - PAD - 1} y1={h / 2 - 5} x2={w - PAD - 1} y2={h / 2 + 5}
          stroke={CRIMSON} strokeWidth={0.9} strokeOpacity={0.42} />

        {/* ── Internal glass reflection arc ─────────────────────────────────── */}
        <Ellipse
          cx={w / 2} cy={PAD + 7}
          rx={w * 0.30} ry={5}
          fill={SILVER} fillOpacity={0.04}
        />
      </Svg>
    </View>
  );
}
