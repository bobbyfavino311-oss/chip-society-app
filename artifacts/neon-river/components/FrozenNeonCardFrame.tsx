import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop, Line, Circle, Path } from 'react-native-svg';

interface FrozenNeonCardFrameProps {
  width: number;
  height: number;
}

const CYAN  = '#00D9FF';
const ICE   = '#8FEFFF';
const WHITE = '#F5FCFF';

export default function FrozenNeonCardFrame({ width: w, height: h }: FrozenNeonCardFrameProps) {
  if (w === 0 || h === 0) return null;

  const PAD  = 5;
  const PAD2 = 9;

  // Corner accent diamond coordinates
  const corners: [number, number][] = [
    [PAD + 6,  PAD + 6],
    [w - PAD - 6, PAD + 6],
    [PAD + 6,  h - PAD - 6],
    [w - PAD - 6, h - PAD - 6],
  ];

  return (
    <View style={[StyleSheet.absoluteFillObject, { zIndex: 10 }]} pointerEvents="none">
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Defs>
          {/* Top edge — cyan illuminated bar */}
          <LinearGradient id="fnTopEdge" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0"   stopColor={CYAN} stopOpacity="0" />
            <Stop offset="0.25" stopColor={CYAN} stopOpacity="0.60" />
            <Stop offset="0.5" stopColor={ICE}  stopOpacity="0.80" />
            <Stop offset="0.75" stopColor={CYAN} stopOpacity="0.60" />
            <Stop offset="1"   stopColor={CYAN} stopOpacity="0" />
          </LinearGradient>
          {/* Bottom edge — slightly fainter */}
          <LinearGradient id="fnBotEdge" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0"   stopColor={CYAN} stopOpacity="0" />
            <Stop offset="0.3" stopColor={CYAN} stopOpacity="0.42" />
            <Stop offset="0.7" stopColor={CYAN} stopOpacity="0.42" />
            <Stop offset="1"   stopColor={CYAN} stopOpacity="0" />
          </LinearGradient>
          {/* Left/right edge gradients */}
          <LinearGradient id="fnLeftEdge" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0"   stopColor={CYAN} stopOpacity="0" />
            <Stop offset="0.3" stopColor={CYAN} stopOpacity="0.35" />
            <Stop offset="0.7" stopColor={CYAN} stopOpacity="0.35" />
            <Stop offset="1"   stopColor={CYAN} stopOpacity="0" />
          </LinearGradient>
          <LinearGradient id="fnRightEdge" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0"   stopColor={CYAN} stopOpacity="0" />
            <Stop offset="0.3" stopColor={CYAN} stopOpacity="0.35" />
            <Stop offset="0.7" stopColor={CYAN} stopOpacity="0.35" />
            <Stop offset="1"   stopColor={CYAN} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Outer border — frosted glass */}
        <Rect
          x={PAD} y={PAD}
          width={w - PAD * 2} height={h - PAD * 2}
          rx={7} ry={7}
          fill="none"
          stroke={CYAN} strokeWidth={1.2} strokeOpacity={0.45}
        />
        {/* Inner border — subtler */}
        <Rect
          x={PAD2} y={PAD2}
          width={w - PAD2 * 2} height={h - PAD2 * 2}
          rx={4} ry={4}
          fill="none"
          stroke={ICE} strokeWidth={0.5} strokeOpacity={0.22}
        />

        {/* Glowing edge bars */}
        <Rect x={PAD} y={PAD}          width={w - PAD * 2} height={1.8} fill="url(#fnTopEdge)" />
        <Rect x={PAD} y={h - PAD - 1.8} width={w - PAD * 2} height={1.8} fill="url(#fnBotEdge)" />
        <Rect x={PAD} y={PAD}           width={1.5} height={h - PAD * 2} fill="url(#fnLeftEdge)" />
        <Rect x={w - PAD - 1.5} y={PAD}  width={1.5} height={h - PAD * 2} fill="url(#fnRightEdge)" />

        {/* ── Corner diamond accents ── */}
        {corners.map(([cx, cy], i) => (
          <Path
            key={i}
            d={`M ${cx} ${cy - 5} L ${cx + 4} ${cy} L ${cx} ${cy + 5} L ${cx - 4} ${cy} Z`}
            fill={CYAN} fillOpacity={0.35}
            stroke={ICE} strokeWidth={0.6} strokeOpacity={0.5}
          />
        ))}

        {/* Center-top mid-edge tick mark */}
        <Line
          x1={w / 2 - 8} y1={PAD + 0.5}
          x2={w / 2 + 8} y2={PAD + 0.5}
          stroke={WHITE} strokeWidth={1} strokeOpacity={0.35}
        />
        {/* Center-bottom mid-edge tick mark */}
        <Line
          x1={w / 2 - 8} y1={h - PAD - 0.5}
          x2={w / 2 + 8} y2={h - PAD - 0.5}
          stroke={WHITE} strokeWidth={1} strokeOpacity={0.28}
        />

        {/* Inner frosted-glass sheen — very subtle */}
        <Rect
          x={PAD + 2} y={PAD + 2}
          width={w - (PAD + 2) * 2} height={(h - PAD * 2) * 0.35}
          rx={6} ry={6}
          fill={WHITE} fillOpacity={0.025}
        />
      </Svg>
    </View>
  );
}
