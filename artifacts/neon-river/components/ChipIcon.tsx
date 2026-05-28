import React from 'react';
import Svg, { Ellipse, Rect, Line, Path } from 'react-native-svg';

export type ChipVariant = 'green' | 'red' | 'white' | 'gold';

const PALETTE: Record<ChipVariant, { top: string; body: string; dark: string; stripe: string }> = {
  green: { top: '#22c55e', body: '#16a34a', dark: '#14532d', stripe: '#86efac' },
  red:   { top: '#ef4444', body: '#b91c1c', dark: '#7f1d1d', stripe: '#fca5a5' },
  white: { top: '#e2e8f0', body: '#94a3b8', dark: '#475569', stripe: '#f8fafc' },
  gold:  { top: '#ffd700', body: '#ca8a04', dark: '#78350f', stripe: '#fef08a' },
};

interface ChipIconProps {
  variant?: ChipVariant;
  size?: number;
}

export default function ChipIcon({ variant = 'white', size = 22 }: ChipIconProps) {
  const p = PALETTE[variant];

  // Fixed viewBox 24x24
  const cx = 12;
  const topY = 8;    // y center of top ellipse
  const botY = 17;   // y center of bottom ellipse
  const rx = 9;      // horizontal radius of ellipses
  const ry = 3.2;    // vertical radius (perspective squeeze)
  const midY = (topY + botY) / 2;

  // Left / right x edges of the stack body
  const lx = cx - rx;
  const rx2 = cx + rx;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* Stack body fill — the rectangular side of the chip stack */}
      <Rect x={lx} y={topY} width={rx * 2} height={botY - topY} fill={p.body} />

      {/* Mid-chip divider line */}
      <Line x1={lx} y1={midY} x2={rx2} y2={midY} stroke="#000" strokeWidth={0.8} strokeOpacity={0.35} />

      {/* Left and right vertical edges with dark color */}
      <Rect x={lx} y={topY} width={1.4} height={botY - topY} fill={p.dark} />
      <Rect x={rx2 - 1.4} y={topY} width={1.4} height={botY - topY} fill={p.dark} />

      {/* Bottom ellipse — underside of the chip stack */}
      <Ellipse cx={cx} cy={botY} rx={rx} ry={ry} fill={p.dark} stroke="#000" strokeWidth={1.3} />

      {/* Top face — top chip surface */}
      <Ellipse cx={cx} cy={topY} rx={rx} ry={ry} fill={p.top} stroke="#000" strokeWidth={1.5} />

      {/* Inner ring on top face */}
      <Ellipse cx={cx} cy={topY} rx={rx * 0.55} ry={ry * 0.55} fill="none" stroke={p.stripe} strokeWidth={0.9} strokeOpacity={0.75} />

      {/* Center dot */}
      <Ellipse cx={cx} cy={topY} rx={rx * 0.18} ry={ry * 0.18} fill={p.stripe} fillOpacity={0.7} />

      {/* Outline the stack sides explicitly */}
      <Path
        d={`M ${lx} ${topY} L ${lx} ${botY}`}
        stroke="#000" strokeWidth={1.4} strokeLinecap="round"
      />
      <Path
        d={`M ${rx2} ${topY} L ${rx2} ${botY}`}
        stroke="#000" strokeWidth={1.4} strokeLinecap="round"
      />
    </Svg>
  );
}
