/**
 * VercettiCardFrame — Minimal Art Deco neon pink double-line frame
 * Thin lines, tiny cyan corner accents, soft glow. No thick outlines.
 */
import React from 'react';
import { View } from 'react-native';
import Svg, { Defs, G, Line, RadialGradient, Rect, Stop, Path, Circle } from 'react-native-svg';

const PINK      = '#FF6EA0';
const PINK_DIM  = '#E0508A';
const CYAN      = '#00D4C8';
const PAD       = 12;
const R         = 18;   // outer corner radius

function CornerAccent({ x, y, sx = 1, sy = 1 }: { x:number; y:number; sx?:number; sy?:number }) {
  const L = 14;
  const G2 = 4;
  return (
    <G>
      {/* Outer L-bracket */}
      <Path
        d={`M ${x + sx * L} ${y} L ${x} ${y} L ${x} ${y + sy * L}`}
        fill="none" stroke={CYAN} strokeWidth={1.0} strokeOpacity={0.80}
        strokeLinecap="square"
      />
      {/* Inner L-bracket (offset inward) */}
      <Path
        d={`M ${x + sx * (L - G2)} ${y + sy * G2} L ${x + sx * G2} ${y + sy * G2} L ${x + sx * G2} ${y + sy * (L - G2)}`}
        fill="none" stroke={CYAN} strokeWidth={0.6} strokeOpacity={0.45}
        strokeLinecap="square"
      />
      {/* Tiny diamond pip at corner */}
      <Circle cx={x} cy={y} r={1.8} fill={PINK} fillOpacity={0.70} />
    </G>
  );
}

interface Props { width: number; height: number; }

export default function VercettiCardFrame({ width, height }: Props) {
  if (width === 0 || height === 0) return null;

  const fw = width  + PAD * 2;
  const fh = height + PAD * 2;

  // ── Double-line pink border offsets ──────────────────────────────────────
  const O1 = 4;   // outer pink line inset
  const O2 = 8;   // inner pink line inset
  const GAP = 3;  // gap between the two lines

  return (
    <View style={{
      position: 'absolute',
      top:    -PAD,
      left:   -PAD,
      right:  -PAD,
      bottom: -PAD,
      pointerEvents: 'none',
    }}>
      <Svg width={fw} height={fh} viewBox={`0 0 ${fw} ${fh}`}>
        <Defs>
          <RadialGradient id="vcGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%"   stopColor={PINK} stopOpacity={0.10} />
            <Stop offset="100%" stopColor={PINK} stopOpacity={0}    />
          </RadialGradient>
        </Defs>

        {/* Background glow */}
        <Rect x={0} y={0} width={fw} height={fh} rx={R + 4} fill="url(#vcGlow)" />

        {/* Outer pink border — main line */}
        <Rect
          x={O1} y={O1} width={fw - O1 * 2} height={fh - O1 * 2}
          rx={R} fill="none"
          stroke={PINK} strokeWidth={1.2} strokeOpacity={0.65}
        />

        {/* Inner pink border — secondary line */}
        <Rect
          x={O2} y={O2} width={fw - O2 * 2} height={fh - O2 * 2}
          rx={R - GAP} fill="none"
          stroke={PINK_DIM} strokeWidth={0.7} strokeOpacity={0.38}
        />

        {/* Very faint cyan fill tint between the two borders */}
        <Rect
          x={O1 + 0.6} y={O1 + 0.6}
          width={fw - (O1 + 0.6) * 2} height={fh - (O1 + 0.6) * 2}
          rx={R - 1}
          fill={CYAN} fillOpacity={0.012}
        />

        {/* Corner accents — small cyan L-brackets */}
        <CornerAccent x={O2 + 4} y={O2 + 4}  sx={ 1} sy={ 1} />
        <CornerAccent x={fw - O2 - 4} y={O2 + 4}  sx={-1} sy={ 1} />
        <CornerAccent x={O2 + 4} y={fh - O2 - 4} sx={ 1} sy={-1} />
        <CornerAccent x={fw - O2 - 4} y={fh - O2 - 4} sx={-1} sy={-1} />

        {/* Center top & bottom pink mid-marks */}
        <Line
          x1={fw / 2 - 6} y1={O1} x2={fw / 2 + 6} y2={O1}
          stroke={CYAN} strokeWidth={0.8} strokeOpacity={0.55}
        />
        <Line
          x1={fw / 2 - 6} y1={fh - O1} x2={fw / 2 + 6} y2={fh - O1}
          stroke={CYAN} strokeWidth={0.8} strokeOpacity={0.55}
        />

        {/* Side center marks */}
        <Line
          x1={O1} y1={fh / 2 - 5} x2={O1} y2={fh / 2 + 5}
          stroke={CYAN} strokeWidth={0.8} strokeOpacity={0.45}
        />
        <Line
          x1={fw - O1} y1={fh / 2 - 5} x2={fw - O1} y2={fh / 2 + 5}
          stroke={CYAN} strokeWidth={0.8} strokeOpacity={0.45}
        />
      </Svg>
    </View>
  );
}
