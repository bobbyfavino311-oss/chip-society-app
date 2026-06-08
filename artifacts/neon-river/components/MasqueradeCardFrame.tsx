/**
 * MasqueradeCardFrame — ROYAL MASQUERADE community card overlay.
 * Thin double-gold border with elegant corner diamond ornaments
 * and plum dashed card slot placeholders.
 */
import React from 'react';
import { View } from 'react-native';
import Svg, { G, Line, Path, Polygon, Rect } from 'react-native-svg';

const GOLD   = '#D4AF37';
const PURPLE = '#6B00C0';
const PAD    = 8;
const CORNER = 18;
const THICK  = 1.6;
const THIN   = 0.8;

// ─── Elegant corner ornament ─────────────────────────────────────────────────
function Corner({ x, y, flipX = false, flipY = false }: {
  x: number; y: number; flipX?: boolean; flipY?: boolean;
}) {
  const sx = flipX ? -1 : 1;
  const sy = flipY ? -1 : 1;
  const dS = 4;

  return (
    <G>
      {/* Outer bracket */}
      <Line x1={x} y1={y} x2={x + sx * CORNER} y2={y}
        stroke={GOLD} strokeWidth={THICK} strokeOpacity={0.85} />
      <Line x1={x} y1={y} x2={x} y2={y + sy * CORNER}
        stroke={GOLD} strokeWidth={THICK} strokeOpacity={0.85} />
      {/* Inner offset line H */}
      <Line x1={x + sx * 5} y1={y + sy * 5} x2={x + sx * CORNER} y2={y + sy * 5}
        stroke={GOLD} strokeWidth={THIN} strokeOpacity={0.35} />
      {/* Inner offset line V */}
      <Line x1={x + sx * 5} y1={y + sy * 5} x2={x + sx * 5} y2={y + sy * CORNER}
        stroke={GOLD} strokeWidth={THIN} strokeOpacity={0.35} />
      {/* Diamond pip at corner point */}
      <Polygon
        points={`${x},${y - dS} ${x + sx * dS},${y} ${x},${y + dS} ${x - sx * dS},${y}`}
        fill={GOLD} fillOpacity={0.72}
      />
    </G>
  );
}

interface Props { width: number; height: number; }

export default function MasqueradeCardFrame({ width, height }: Props) {
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

        {/* ── Outer purple glow border ───────────────────────────────────── */}
        <Rect x={2} y={2} width={fw - 4} height={fh - 4} rx={14}
          fill="none" stroke={PURPLE} strokeWidth={3} strokeOpacity={0.20} />

        {/* ── Main gold border ──────────────────────────────────────────── */}
        <Rect x={5} y={5} width={fw - 10} height={fh - 10} rx={11}
          fill="none" stroke={GOLD} strokeWidth={1.4} strokeOpacity={0.78} />

        {/* ── Inner subtle border ───────────────────────────────────────── */}
        <Rect x={9} y={9} width={fw - 18} height={fh - 18} rx={8}
          fill="none" stroke={GOLD} strokeWidth={0.6} strokeOpacity={0.25} />

        {/* ── 5 plum dashed card slot placeholders ─────────────────────── */}
        {[0, 1, 2, 3, 4].map((i) => (
          <Rect
            key={i}
            x={PAD + SLOT_INSET + i * (cardSlotW + CARD_GAP)}
            y={PAD + SLOT_INSET}
            width={cardSlotW}
            height={cardSlotH}
            rx={5}
            fill="none"
            stroke={PURPLE}
            strokeWidth={1.0}
            strokeDasharray="4,3"
            strokeOpacity={0.50}
          />
        ))}

        {/* ── Corner ornaments ─────────────────────────────────────────── */}
        <Corner x={12}      y={12}      />
        <Corner x={fw - 12} y={12}      flipX />
        <Corner x={12}      y={fh - 12} flipY />
        <Corner x={fw - 12} y={fh - 12} flipX flipY />

        {/* ── Top centre diamond ────────────────────────────────────────── */}
        <Polygon
          points={`${cx},${4} ${cx + 5},${9} ${cx},${14} ${cx - 5},${9}`}
          fill={GOLD} fillOpacity={0.60}
        />

        {/* ── Bottom centre diamond ─────────────────────────────────────── */}
        <Polygon
          points={`${cx},${fh - 14} ${cx + 5},${fh - 9} ${cx},${fh - 4} ${cx - 5},${fh - 9}`}
          fill={GOLD} fillOpacity={0.60}
        />

        {/* ── Side centre ticks ────────────────────────────────────────── */}
        <Path d={`M 5 ${cy - 7} L 5 ${cy + 7}`}
          stroke={GOLD} strokeWidth={1.2} strokeOpacity={0.40} />
        <Path d={`M ${fw - 5} ${cy - 7} L ${fw - 5} ${cy + 7}`}
          stroke={GOLD} strokeWidth={1.2} strokeOpacity={0.40} />

      </Svg>
    </View>
  );
}
