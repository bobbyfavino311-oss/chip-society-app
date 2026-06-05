/**
 * DragonCardFrame — Minimal Dragon Dynasty community card overlay.
 * Thin gold border, Chinese L-bracket corner ornaments,
 * red dashed card slot placeholders.
 */
import React from 'react';
import { View } from 'react-native';
import Svg, { G, Line, Path, Polygon, Rect } from 'react-native-svg';

const GOLD    = '#C89B3C';
const CRIMSON = '#8B0000';
const PAD     = 8;   // outset from card surface
const CORNER  = 20;  // corner bracket arm length
const THICK   = 1.8;
const THIN    = 0.9;

// ─── Chinese L-bracket corner ornament ───────────────────────────────────────
function Corner({ x, y, flipX = false, flipY = false }: {
  x: number; y: number; flipX?: boolean; flipY?: boolean;
}) {
  const sx = flipX ? -1 : 1;
  const sy = flipY ? -1 : 1;
  const hx2 = x + sx * CORNER;
  const vy2 = y + sy * CORNER;
  const STEP = 7;
  const IN   = 5;
  const dS   = 4.5;
  const dPts = `${x},${y - dS} ${x + dS},${y} ${x},${y + dS} ${x - dS},${y}`;

  return (
    <G>
      {/* Outer bracket */}
      <Line x1={x} y1={y} x2={hx2} y2={y}  stroke={GOLD} strokeWidth={THICK} strokeOpacity={0.88} />
      <Line x1={x} y1={y} x2={x}   y2={vy2} stroke={GOLD} strokeWidth={THICK} strokeOpacity={0.88} />
      {/* Inner step */}
      <Line x1={x + sx * STEP} y1={y + sy * IN} x2={hx2} y2={y + sy * IN}
        stroke={GOLD} strokeWidth={THIN} strokeOpacity={0.45} />
      <Line x1={x + sx * IN} y1={y + sy * STEP} x2={x + sx * IN} y2={vy2}
        stroke={GOLD} strokeWidth={THIN} strokeOpacity={0.45} />
      {/* Corner diamond */}
      <Polygon points={dPts} fill={GOLD} fillOpacity={0.70} />
    </G>
  );
}

interface Props { width: number; height: number; }

export default function DragonCardFrame({ width, height }: Props) {
  if (width === 0 || height === 0) return null;

  const fw = width  + PAD * 2;
  const fh = height + PAD * 2;
  const cx = fw / 2;
  const cy = fh / 2;

  // Card slot geometry — 5 slots with crimson dashes
  const SLOT_INSET = 12;
  const CARD_GAP   = 6;
  const slotAreaW  = width - SLOT_INSET * 2;
  const cardSlotW  = (slotAreaW - CARD_GAP * 4) / 5;
  const cardSlotH  = height - SLOT_INSET * 2;

  return (
    <View
      style={{
        position: 'absolute',
        top:    -PAD,
        left:   -PAD,
        right:  -PAD,
        bottom: -PAD,
        pointerEvents: 'none',
      }}
    >
      <Svg width={fw} height={fh} viewBox={`0 0 ${fw} ${fh}`}>

        {/* ── Outer glow — crimson ──────────────────────────────────────── */}
        <Rect x={2} y={2} width={fw - 4} height={fh - 4} rx={14}
          fill="none" stroke={CRIMSON} strokeWidth={3} strokeOpacity={0.22} />

        {/* ── Main gold border ──────────────────────────────────────────── */}
        <Rect x={5} y={5} width={fw - 10} height={fh - 10} rx={11}
          fill="none" stroke={GOLD} strokeWidth={1.4} strokeOpacity={0.75} />

        {/* ── Inner subtle border ───────────────────────────────────────── */}
        <Rect x={9} y={9} width={fw - 18} height={fh - 18} rx={8}
          fill="none" stroke={GOLD} strokeWidth={0.6} strokeOpacity={0.28} />

        {/* ── 5 red dashed card slot placeholders ──────────────────────── */}
        {[0, 1, 2, 3, 4].map((i) => (
          <Rect
            key={i}
            x={PAD + SLOT_INSET + i * (cardSlotW + CARD_GAP)}
            y={PAD + SLOT_INSET}
            width={cardSlotW}
            height={cardSlotH}
            rx={5}
            fill="none"
            stroke={CRIMSON}
            strokeWidth={1.1}
            strokeDasharray="5,3"
            strokeOpacity={0.58}
          />
        ))}

        {/* ── Chinese L-bracket corner ornaments ───────────────────────── */}
        <Corner x={12}      y={12}      />
        <Corner x={fw - 12} y={12}      flipX />
        <Corner x={12}      y={fh - 12} flipY />
        <Corner x={fw - 12} y={fh - 12} flipX flipY />

        {/* ── Top centre diamond ────────────────────────────────────────── */}
        <Polygon
          points={`${cx},${4} ${cx+6},${10} ${cx},${16} ${cx-6},${10}`}
          fill={GOLD} fillOpacity={0.55}
        />

        {/* ── Bottom centre diamond ─────────────────────────────────────── */}
        <Polygon
          points={`${cx},${fh-16} ${cx+6},${fh-10} ${cx},${fh-4} ${cx-6},${fh-10}`}
          fill={GOLD} fillOpacity={0.55}
        />

        {/* ── Side centre ticks (left + right) ─────────────────────────── */}
        <Path d={`M 5 ${cy - 8} L 5 ${cy + 8}`}
          stroke={GOLD} strokeWidth={1.4} strokeOpacity={0.45} />
        <Path d={`M ${fw - 5} ${cy - 8} L ${fw - 5} ${cy + 8}`}
          stroke={GOLD} strokeWidth={1.4} strokeOpacity={0.45} />

      </Svg>
    </View>
  );
}
