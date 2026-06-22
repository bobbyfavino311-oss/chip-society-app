import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop, Line, Circle, Path, Ellipse } from 'react-native-svg';

interface Props { width: number; height: number; }

const GOLD    = '#D4AF37';
const CHAMP   = '#E8D48A';
const PURPLE  = '#6B00C0';
const WHITE   = '#F5F0FF';

export default function MasqueradeCardFrame({ width: w, height: h }: Props) {
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
          {/* Top edge — gold hot at center */}
          <LinearGradient id="mqTopEdge" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0"    stopColor={GOLD}   stopOpacity="0"    />
            <Stop offset="0.15" stopColor={GOLD}   stopOpacity="0.55" />
            <Stop offset="0.40" stopColor={CHAMP}  stopOpacity="0.80" />
            <Stop offset="0.50" stopColor={WHITE}  stopOpacity="0.90" />
            <Stop offset="0.60" stopColor={CHAMP}  stopOpacity="0.80" />
            <Stop offset="0.85" stopColor={GOLD}   stopOpacity="0.55" />
            <Stop offset="1"    stopColor={GOLD}   stopOpacity="0"    />
          </LinearGradient>

          <LinearGradient id="mqBotEdge" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0"    stopColor={GOLD}   stopOpacity="0"    />
            <Stop offset="0.20" stopColor={GOLD}   stopOpacity="0.40" />
            <Stop offset="0.50" stopColor={CHAMP}  stopOpacity="0.60" />
            <Stop offset="0.80" stopColor={GOLD}   stopOpacity="0.40" />
            <Stop offset="1"    stopColor={GOLD}   stopOpacity="0"    />
          </LinearGradient>

          <LinearGradient id="mqSideEdge" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0"    stopColor={GOLD}   stopOpacity="0"    />
            <Stop offset="0.25" stopColor={GOLD}   stopOpacity="0.35" />
            <Stop offset="0.50" stopColor={CHAMP}  stopOpacity="0.48" />
            <Stop offset="0.75" stopColor={GOLD}   stopOpacity="0.35" />
            <Stop offset="1"    stopColor={GOLD}   stopOpacity="0"    />
          </LinearGradient>

          {/* Dark glass fill */}
          <LinearGradient id="mqFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0"   stopColor="#200040" stopOpacity="0.08" />
            <Stop offset="0.5" stopColor="#140028" stopOpacity="0.04" />
            <Stop offset="1"   stopColor="#0A0018" stopOpacity="0.02" />
          </LinearGradient>

          {/* Top sheen */}
          <LinearGradient id="mqSheen" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0"   stopColor={WHITE}  stopOpacity="0.07" />
            <Stop offset="0.5" stopColor={WHITE}  stopOpacity="0.02" />
            <Stop offset="1"   stopColor={WHITE}  stopOpacity="0"    />
          </LinearGradient>

          {/* Outer glow bloom */}
          <RadialGradient id="mqGlow" cx="50%" cy="50%" r="60%">
            <Stop offset="0"   stopColor={PURPLE} stopOpacity="0.10" />
            <Stop offset="1"   stopColor={PURPLE} stopOpacity="0"    />
          </RadialGradient>
        </Defs>

        {/* Outer ambient bloom */}
        <Rect x={-6} y={-6} width={w + 12} height={h + 12}
          rx={R_OUT + 4} ry={R_OUT + 4} fill="url(#mqGlow)" />

        {/* Dark glass fill */}
        <Rect x={PAD + 1} y={PAD + 1}
          width={w - (PAD + 1) * 2} height={h - (PAD + 1) * 2}
          rx={R_IN} ry={R_IN} fill="url(#mqFill)" />

        {/* Outer border — gold */}
        <Rect x={PAD} y={PAD}
          width={w - PAD * 2} height={h - PAD * 2}
          rx={R_OUT} ry={R_OUT}
          fill="none" stroke={GOLD} strokeWidth={1.3} strokeOpacity={0.60} />

        {/* Middle border — champagne */}
        <Rect x={PAD2} y={PAD2}
          width={w - PAD2 * 2} height={h - PAD2 * 2}
          rx={R_IN} ry={R_IN}
          fill="none" stroke={CHAMP} strokeWidth={0.6} strokeOpacity={0.28} />

        {/* Inner border — barely-there */}
        <Rect x={PAD3} y={PAD3}
          width={w - PAD3 * 2} height={h - PAD3 * 2}
          rx={R_IN2} ry={R_IN2}
          fill="none" stroke={WHITE} strokeWidth={0.35} strokeOpacity={0.12} />

        {/* Glowing edge bars */}
        <Rect x={PAD} y={PAD}           width={w - PAD * 2} height={2.0} fill="url(#mqTopEdge)" />
        <Rect x={PAD} y={h - PAD - 2.0} width={w - PAD * 2} height={2.0} fill="url(#mqBotEdge)" />
        <Rect x={PAD} y={PAD}           width={1.8} height={h - PAD * 2} fill="url(#mqSideEdge)" />
        <Rect x={w - PAD - 1.8} y={PAD} width={1.8} height={h - PAD * 2} fill="url(#mqSideEdge)" />

        {/* Inner sheen */}
        <Rect x={PAD + 2} y={PAD + 2}
          width={w - (PAD + 2) * 2} height={(h - PAD * 2) * 0.28}
          rx={R_IN} ry={R_IN} fill="url(#mqSheen)" />

        {/* Corner diamond accents */}
        {corners.map(([cx, cy], i) => (
          <React.Fragment key={i}>
            <Circle cx={cx} cy={cy} r={5} fill={GOLD} fillOpacity={0.10} />
            <Path
              d={`M ${cx} ${cy - 5.5} L ${cx + 4.5} ${cy} L ${cx} ${cy + 5.5} L ${cx - 4.5} ${cy} Z`}
              fill={GOLD} fillOpacity={0.30}
              stroke={CHAMP} strokeWidth={0.8} strokeOpacity={0.70}
            />
            <Circle cx={cx} cy={cy} r={1.4} fill={WHITE} fillOpacity={0.80} />
          </React.Fragment>
        ))}

        {/* Top center marker */}
        <Line x1={w / 2 - 10} y1={PAD + 1} x2={w / 2 + 10} y2={PAD + 1}
          stroke={WHITE} strokeWidth={1.0} strokeOpacity={0.42} />
        <Circle cx={w / 2} cy={PAD + 1} r={1.6} fill={WHITE} fillOpacity={0.65} />

        {/* Bottom center marker */}
        <Line x1={w / 2 - 8} y1={h - PAD - 1} x2={w / 2 + 8} y2={h - PAD - 1}
          stroke={GOLD} strokeWidth={0.8} strokeOpacity={0.35} />

        {/* Side mid ticks */}
        <Line x1={PAD + 1} y1={h / 2 - 5} x2={PAD + 1} y2={h / 2 + 5}
          stroke={GOLD} strokeWidth={0.9} strokeOpacity={0.40} />
        <Line x1={w - PAD - 1} y1={h / 2 - 5} x2={w - PAD - 1} y2={h / 2 + 5}
          stroke={GOLD} strokeWidth={0.9} strokeOpacity={0.40} />

        {/* Glass reflection arc */}
        <Ellipse cx={w / 2} cy={PAD + 7} rx={w * 0.30} ry={5}
          fill={WHITE} fillOpacity={0.04} />
      </Svg>
    </View>
  );
}
