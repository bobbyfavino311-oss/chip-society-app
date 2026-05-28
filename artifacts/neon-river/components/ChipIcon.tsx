import React from 'react';
import Svg, { Circle, Line, Rect } from 'react-native-svg';

export type ChipVariant = 'green' | 'red' | 'white' | 'gold' | 'cyan';

const FILL: Record<ChipVariant, string> = {
  green: '#22c55e',
  red:   '#ef4444',
  white: '#d0d8e8',
  gold:  '#ffd700',
  cyan:  '#00d4ff',
};

const DARK: Record<ChipVariant, string> = {
  green: '#166534',
  red:   '#7f1d1d',
  white: '#8090a8',
  gold:  '#92400e',
  cyan:  '#0e6e8a',
};

// Chip face geometry
const CX = 11, CY = 11;
const R_OUT  = 9.5;  // outer edge of chip
const R_RING = 6.4;  // outer edge of center disc / inner edge of ring
const R_IN   = 4.8;  // inner accent ring

// 8 radial segment dividers at 45° intervals
const DIVIDERS = Array.from({ length: 8 }, (_, i) => {
  const a = ((i * 45) - 90) * (Math.PI / 180);
  return {
    x1: CX + R_RING * Math.cos(a),
    y1: CY + R_RING * Math.sin(a),
    x2: CX + (R_OUT - 0.5) * Math.cos(a),
    y2: CY + (R_OUT - 0.5) * Math.sin(a),
  };
});

// Stack bars to the right of the chip face
// 5 bars tapering narrower as they go down (perspective effect)
const BARS = [
  { y: 1.5,  x: 20.0, w: 12.5 },
  { y: 5.0,  x: 21.2, w: 10.8 },
  { y: 8.5,  x: 22.4, w: 9.1  },
  { y: 12.0, x: 23.6, w: 7.4  },
  { y: 15.5, x: 24.8, w: 5.7  },
];
const BAR_H  = 2.8;
const BAR_RX = 0.5;

interface ChipIconProps {
  variant?: ChipVariant;
  size?: number;
}

export default function ChipIcon({ variant = 'white', size = 22 }: ChipIconProps) {
  const fill = FILL[variant];
  const dark = DARK[variant];
  const barWidth = size * (33 / 22);  // maintain aspect ratio

  return (
    <Svg width={barWidth} height={size} viewBox="0 0 33 22">

      {/* ── Chip face ─────────────────────────────────────────── */}

      {/* Full chip disc */}
      <Circle cx={CX} cy={CY} r={R_OUT} fill={fill} />

      {/* Segment ring (slightly darker band) */}
      <Circle cx={CX} cy={CY} r={R_OUT}  fill="none" stroke={dark} strokeWidth={3.2} />

      {/* 8 radial dividers creating segments in the ring */}
      {DIVIDERS.map((d, i) => (
        <Line
          key={i}
          x1={d.x1} y1={d.y1}
          x2={d.x2} y2={d.y2}
          stroke="#000"
          strokeWidth={1.2}
          strokeLinecap="round"
        />
      ))}

      {/* Center disc (inner raised area) */}
      <Circle cx={CX} cy={CY} r={R_RING - 0.3} fill={fill} />

      {/* Inner accent ring */}
      <Circle cx={CX} cy={CY} r={R_IN} fill="none" stroke={dark} strokeWidth={0.9} strokeOpacity={0.8} />

      {/* Center dot */}
      <Circle cx={CX} cy={CY} r={1.4} fill={dark} fillOpacity={0.7} />

      {/* Outer border */}
      <Circle cx={CX} cy={CY} r={R_OUT} fill="none" stroke="#000" strokeWidth={1.4} />

      {/* Inner disc border */}
      <Circle cx={CX} cy={CY} r={R_RING - 0.3} fill="none" stroke="#000" strokeWidth={0.8} />

      {/* ── Stack bars (side view of chip stack) ─────────────── */}
      {BARS.map((b, i) => (
        <Rect
          key={i}
          x={b.x}
          y={b.y}
          width={b.w}
          height={BAR_H}
          rx={BAR_RX}
          fill={fill}
          stroke="#000"
          strokeWidth={0.9}
        />
      ))}

    </Svg>
  );
}
