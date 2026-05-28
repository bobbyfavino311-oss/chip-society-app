import React from 'react';
import Svg, { Circle } from 'react-native-svg';

export type ChipVariant = 'green' | 'red' | 'white' | 'gold' | 'cyan';

const FILL: Record<ChipVariant, string> = {
  green: '#22c55e',
  red:   '#ef4444',
  white: '#d0d8e8',
  gold:  '#ffd700',
  cyan:  '#00d4ff',
};

const DARK: Record<ChipVariant, string> = {
  green: '#14532d',
  red:   '#7f1d1d',
  white: '#4a5568',
  gold:  '#78350f',
  cyan:  '#0c4a6e',
};

// 8 dot cutouts evenly spaced in the outer ring
const N_DOTS = 8;
const DOT_RING_R = 8.8; // radius from center where dots sit
const DOT_R = 1.35;     // dot circle radius

const DOTS = Array.from({ length: N_DOTS }, (_, i) => {
  const angle = (i * (360 / N_DOTS) - 90) * (Math.PI / 180);
  return {
    cx: 12 + DOT_RING_R * Math.cos(angle),
    cy: 12 + DOT_RING_R * Math.sin(angle),
  };
});

interface ChipIconProps {
  variant?: ChipVariant;
  size?: number;
}

export default function ChipIcon({ variant = 'white', size = 22 }: ChipIconProps) {
  const fill = FILL[variant];
  const dark = DARK[variant];

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* Outer disc — forms the thick outer ring */}
      <Circle cx={12} cy={12} r={11} fill={fill} />

      {/* Dark separator band between outer ring and center */}
      <Circle cx={12} cy={12} r={7.6} fill={dark} />

      {/* Center disc */}
      <Circle cx={12} cy={12} r={6.6} fill={fill} />

      {/* Inner accent ring */}
      <Circle cx={12} cy={12} r={4.5} fill="none" stroke={dark} strokeWidth={0.9} strokeOpacity={0.55} />

      {/* 8 dot cutouts in the outer ring */}
      {DOTS.map((d, i) => (
        <Circle key={i} cx={d.cx} cy={d.cy} r={DOT_R} fill={dark} />
      ))}

      {/* Outer border */}
      <Circle cx={12} cy={12} r={11} fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth={1} />
    </Svg>
  );
}
