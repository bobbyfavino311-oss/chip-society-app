/**
 * VercettiCardFrame — Miami Vice / 1980s tropical casino
 * Soft neon pink outer glow, thin rose-gold accent border,
 * subtle inner glow, elegant corner palm ornaments.
 */
import React from 'react';
import { View } from 'react-native';
import Svg, { Defs, G, Line, RadialGradient, Rect, Stop, Path } from 'react-native-svg';

const PINK      = '#FF6EA0';
const ROSE_GOLD = '#E8A0B0';
const CYAN      = '#00D4C8';
const PAD       = 10;
const CORNER    = 18;
const THICK     = 1.6;
const THIN      = 0.8;

function CornerAccent({ x, y, flipX = false, flipY = false }: {
  x: number; y: number; flipX?: boolean; flipY?: boolean;
}) {
  const sx = flipX ? -1 : 1;
  const sy = flipY ? -1 : 1;
  return (
    <G>
      <Line x1={x} y1={y} x2={x + sx * CORNER} y2={y}
        stroke={ROSE_GOLD} strokeWidth={THICK} strokeOpacity={0.80} />
      <Line x1={x} y1={y} x2={x} y2={y + sy * CORNER}
        stroke={ROSE_GOLD} strokeWidth={THICK} strokeOpacity={0.80} />
      <Line x1={x + sx * 6} y1={y + sy * 4} x2={x + sx * CORNER} y2={y + sy * 4}
        stroke={PINK} strokeWidth={THIN} strokeOpacity={0.45} />
      <Line x1={x + sx * 4} y1={y + sy * 6} x2={x + sx * 4} y2={y + sy * CORNER}
        stroke={PINK} strokeWidth={THIN} strokeOpacity={0.45} />
      <Path
        d={`M ${x + sx * 0} ${y + sy * 0} L ${x + sx * 5} ${y} L ${x} ${y + sy * 5} Z`}
        fill={ROSE_GOLD} fillOpacity={0.45}
      />
    </G>
  );
}

interface Props { width: number; height: number; }

export default function VercettiCardFrame({ width, height }: Props) {
  if (width === 0 || height === 0) return null;

  const fw = width  + PAD * 2;
  const fh = height + PAD * 2;
  const cx = fw / 2;
  const cy = fh / 2;

  const SLOT_INSET = 12;
  const CARD_GAP   = 6;
  const slotAreaW  = width - SLOT_INSET * 2;
  const cardSlotW  = (slotAreaW - CARD_GAP * 4) / 5;
  const cardSlotH  = height - SLOT_INSET * 2;

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
          <RadialGradient id="pinkGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={PINK} stopOpacity={0.18} />
            <Stop offset="100%" stopColor={PINK} stopOpacity={0} />
          </RadialGradient>
        </Defs>

        {/* Outer pink glow */}
        <Rect x={0} y={0} width={fw} height={fh} rx={16} fill="url(#pinkGlow)" />

        {/* Soft neon pink outer border */}
        <Rect x={2} y={2} width={fw - 4} height={fh - 4} rx={15}
          fill="none" stroke={PINK} strokeWidth={2.5} strokeOpacity={0.25} />

        {/* Rose-gold main border */}
        <Rect x={6} y={6} width={fw - 12} height={fh - 12} rx={12}
          fill="none" stroke={ROSE_GOLD} strokeWidth={1.4} strokeOpacity={0.72} />

        {/* Inner cyan accent */}
        <Rect x={10} y={10} width={fw - 20} height={fh - 20} rx={9}
          fill="none" stroke={CYAN} strokeWidth={0.6} strokeOpacity={0.22} />

        {/* 5 pink dashed card slot placeholders */}
        {[0, 1, 2, 3, 4].map((i) => (
          <Rect
            key={i}
            x={PAD + SLOT_INSET + i * (cardSlotW + CARD_GAP)}
            y={PAD + SLOT_INSET}
            width={cardSlotW}
            height={cardSlotH}
            rx={5}
            fill="none"
            stroke={PINK}
            strokeWidth={1.0}
            strokeDasharray="4,3"
            strokeOpacity={0.50}
          />
        ))}

        {/* Rose-gold corner accents */}
        <CornerAccent x={14}      y={14}      />
        <CornerAccent x={fw - 14} y={14}      flipX />
        <CornerAccent x={14}      y={fh - 14} flipY />
        <CornerAccent x={fw - 14} y={fh - 14} flipX flipY />

        {/* Centre top & bottom diamond pip */}
        <Path d={`M ${cx} 5 L ${cx + 5} 10 L ${cx} 15 L ${cx - 5} 10 Z`}
          fill={ROSE_GOLD} fillOpacity={0.55} />
        <Path d={`M ${cx} ${fh - 15} L ${cx + 5} ${fh - 10} L ${cx} ${fh - 5} L ${cx - 5} ${fh - 10} Z`}
          fill={ROSE_GOLD} fillOpacity={0.55} />

        {/* Side centre ticks */}
        <Line x1={5} y1={cy - 7} x2={5} y2={cy + 7}
          stroke={ROSE_GOLD} strokeWidth={THICK} strokeOpacity={0.40} />
        <Line x1={fw - 5} y1={cy - 7} x2={fw - 5} y2={cy + 7}
          stroke={ROSE_GOLD} strokeWidth={THICK} strokeOpacity={0.40} />
      </Svg>
    </View>
  );
}
