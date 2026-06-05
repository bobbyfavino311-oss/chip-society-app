import React from 'react';
import { View } from 'react-native';
import Svg, { G, Line, Path, Polygon, Rect } from 'react-native-svg';

const GOLD = '#C89B3C';
const CRIMSON = '#8B0000';
const CORNER = 18; // corner bracket arm length
const THICK = 1.8;
const THIN = 0.9;

function Corner({
  x, y, flipX = false, flipY = false,
}: {
  x: number; y: number; flipX?: boolean; flipY?: boolean;
}) {
  const sx = flipX ? -1 : 1;
  const sy = flipY ? -1 : 1;

  // L-bracket lines
  const hx2 = x + sx * CORNER;
  const vy2 = y + sy * CORNER;

  // Decorative diamond at the corner tip
  const dSize = 4;
  const dPts = `${x},${y - dSize} ${x + dSize},${y} ${x},${y + dSize} ${x - dSize},${y}`;

  // Inner step — a small notch inset from the bracket tip
  const STEP = 6;
  const IN = 4;

  return (
    <G>
      {/* Outer bracket — horizontal */}
      <Line x1={x} y1={y} x2={hx2} y2={y} stroke={GOLD} strokeWidth={THICK} strokeOpacity={0.85} />
      {/* Outer bracket — vertical */}
      <Line x1={x} y1={y} x2={x} y2={vy2} stroke={GOLD} strokeWidth={THICK} strokeOpacity={0.85} />

      {/* Inner step lines */}
      <Line x1={x + sx * STEP} y1={y + sy * IN} x2={hx2} y2={y + sy * IN}
        stroke={GOLD} strokeWidth={THIN} strokeOpacity={0.4} />
      <Line x1={x + sx * IN} y1={y + sy * STEP} x2={x + sx * IN} y2={vy2}
        stroke={GOLD} strokeWidth={THIN} strokeOpacity={0.4} />

      {/* Corner diamond ornament */}
      <Polygon points={dPts} fill={GOLD} fillOpacity={0.65} />
    </G>
  );
}

interface DragonCardFrameProps {
  width: number;
  height: number;
}

export default function DragonCardFrame({ width, height }: DragonCardFrameProps) {
  if (width === 0 || height === 0) return null;

  const PAD = 6; // inset from edge

  return (
    <View
      style={{
        position: 'absolute',
        top: -PAD - 2,
        left: -PAD - 2,
        right: -PAD - 2,
        bottom: -PAD - 2,
        pointerEvents: 'none',
      }}
    >
      <Svg
        width={width + (PAD + 2) * 2}
        height={height + (PAD + 2) * 2}
        viewBox={`0 0 ${width + (PAD + 2) * 2} ${height + (PAD + 2) * 2}`}
      >
        {/* Outer glow border — blood red */}
        <Rect
          x={PAD + 2}
          y={PAD + 2}
          width={width}
          height={height}
          rx={20}
          fill="none"
          stroke={CRIMSON}
          strokeWidth={1.2}
          strokeOpacity={0.45}
        />

        {/* Main gold border */}
        <Rect
          x={PAD + 4}
          y={PAD + 4}
          width={width - 4}
          height={height - 4}
          rx={18}
          fill="none"
          stroke={GOLD}
          strokeWidth={0.8}
          strokeOpacity={0.55}
          strokeDasharray="4,3"
        />

        {/* ── Corner ornaments ─────────────────────────────────────────── */}
        {/* Top-left */}
        <Corner x={PAD + 10} y={PAD + 10} />
        {/* Top-right */}
        <Corner x={width + PAD - 6} y={PAD + 10} flipX />
        {/* Bottom-left */}
        <Corner x={PAD + 10} y={height + PAD - 6} flipY />
        {/* Bottom-right */}
        <Corner x={width + PAD - 6} y={height + PAD - 6} flipX flipY />

        {/* Top center ornament — small diamond */}
        <Polygon
          points={`${(width + PAD * 2) / 2},${PAD + 4} ${(width + PAD * 2) / 2 + 5},${PAD + 9} ${(width + PAD * 2) / 2},${PAD + 14} ${(width + PAD * 2) / 2 - 5},${PAD + 9}`}
          fill={GOLD}
          fillOpacity={0.5}
        />

        {/* Bottom center ornament */}
        <Polygon
          points={`${(width + PAD * 2) / 2},${height + PAD - 2} ${(width + PAD * 2) / 2 + 5},${height + PAD + 3} ${(width + PAD * 2) / 2},${height + PAD + 8} ${(width + PAD * 2) / 2 - 5},${height + PAD + 3}`}
          fill={GOLD}
          fillOpacity={0.5}
        />
      </Svg>
    </View>
  );
}
