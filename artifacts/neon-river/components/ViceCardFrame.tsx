/**
 * ViceCardFrame — Minimal Vice Nights community card overlay.
 * Cyan rounded-rect border + 5 dashed card slots.
 * Pink neon flamingo (left) + pink neon palm (right) at frame height.
 */
import React from 'react';
import { View } from 'react-native';
import Svg, { G, Path, Rect } from 'react-native-svg';

const PINK = '#FF2FAE';
const CYAN = '#00D4FF';
const PAD  = 8;    // outset from card surface
const SIDE = 64;   // extra canvas width on each side for ornaments
const OVERHANG = 18; // extra canvas height at top for flamingo head

interface Props { width: number; height: number; }

// ─── Scaled flamingo helper ────────────────────────────────────────────────────
// feet at (ox, oy), all coords * s, head rises ~55s units above oy
function Flamingo({ ox, oy, s, color = PINK, op = 1 }: {
  ox: number; oy: number; s: number; color?: string; op?: number;
}) {
  const p = (x: number, y: number) => `${(ox + x * s).toFixed(1)} ${(oy + y * s).toFixed(1)}`;
  const sw = Math.max(1.2, 1.8 * Math.min(s, 1.6));
  return (
    <G opacity={op}>
      <Path d={`M ${p(-2, 0)} C ${p(-2.5, -6)}, ${p(-5, -13)}, ${p(-4, -21)}`}
        stroke={color} strokeWidth={sw} strokeLinecap="round" fill="none" />
      <Path d={`M ${p(2, 0)} C ${p(1.5, -6)}, ${p(-0.5, -13)}, ${p(-0.5, -21)}`}
        stroke={color} strokeWidth={sw} strokeLinecap="round" fill="none" />
      <Path d={`M ${p(-5, -12)} L ${p(-2, -11)}`}
        stroke={color} strokeWidth={sw * 0.70} strokeLinecap="round" fill="none" />
      <Path d={`M ${p(-8, -25)} C ${p(-13, -32)}, ${p(-1, -39)}, ${p(7, -33)} C ${p(13, -27)}, ${p(4, -21)}, ${p(-4, -21)} Z`}
        stroke={color} strokeWidth={sw} fill="none" />
      <Path d={`M ${p(-8, -28)} C ${p(-16, -34)}, ${p(-17, -27)}, ${p(-6, -24)}`}
        stroke={color} strokeWidth={sw * 0.62} fill="none" strokeOpacity={0.65} />
      <Path d={`M ${p(6, -32)} C ${p(14, -39)}, ${p(7, -46)}, ${p(11, -53)}`}
        stroke={color} strokeWidth={sw} strokeLinecap="round" fill="none" />
      <Path d={`M ${p(11, -53)} C ${p(14, -58)}, ${p(19, -57)}, ${p(18, -53)} C ${p(17, -50)}, ${p(11, -52)}, ${p(11, -53)} Z`}
        stroke={color} strokeWidth={sw * 0.82} fill="none" />
      <Path d={`M ${p(18, -54)} C ${p(23, -55.5)}, ${p(24, -53)}, ${p(20, -52)}`}
        stroke={color} strokeWidth={sw * 0.72} strokeLinecap="round" fill="none" />
    </G>
  );
}

// ─── Scaled palm helper ────────────────────────────────────────────────────────
// trunk base at (cx, baseY), grows upward by h
function Palm({ cx, baseY, h, lean = 0, color = PINK, op = 1 }: {
  cx: number; baseY: number; h: number; lean?: number; color?: string; op?: number;
}) {
  const crown = baseY - h;
  const tw = h * 0.52;
  const lx = cx + lean;
  const sw = Math.max(1.2, h / 50);
  return (
    <G opacity={op}>
      <Path d={`M ${cx} ${baseY} C ${cx + lean * 0.35} ${baseY - h * 0.5}, ${lx - 2} ${crown + h * 0.12}, ${lx} ${crown}`}
        stroke={color} strokeWidth={sw} strokeLinecap="round" fill="none" />
      <Path d={`M ${lx} ${crown} C ${lx+tw*.44} ${crown-tw*.30}, ${lx+tw} ${crown+tw*.06}, ${lx+tw} ${crown+tw*.42}`}
        stroke={color} strokeWidth={sw * 0.65} strokeLinecap="round" fill="none" />
      <Path d={`M ${lx} ${crown} C ${lx+tw*.18} ${crown-tw*.66}, ${lx+tw*.48} ${crown-tw*.88}, ${lx+tw*.50} ${crown-tw*.58}`}
        stroke={color} strokeWidth={sw * 0.60} strokeLinecap="round" fill="none" />
      <Path d={`M ${lx} ${crown} C ${lx} ${crown-tw*.78}, ${lx} ${crown-tw*1.08}, ${lx} ${crown-tw*.92}`}
        stroke={color} strokeWidth={sw * 0.60} strokeLinecap="round" fill="none" />
      <Path d={`M ${lx} ${crown} C ${lx-tw*.18} ${crown-tw*.66}, ${lx-tw*.48} ${crown-tw*.88}, ${lx-tw*.50} ${crown-tw*.58}`}
        stroke={color} strokeWidth={sw * 0.60} strokeLinecap="round" fill="none" />
      <Path d={`M ${lx} ${crown} C ${lx-tw*.44} ${crown-tw*.30}, ${lx-tw} ${crown+tw*.06}, ${lx-tw} ${crown+tw*.42}`}
        stroke={color} strokeWidth={sw * 0.65} strokeLinecap="round" fill="none" />
    </G>
  );
}

export default function ViceCardFrame({ width, height }: Props) {
  if (width === 0 || height === 0) return null;

  const fw = width  + PAD * 2;
  const fh = height + PAD * 2;
  const totalW = fw + SIDE * 2;
  const totalH = fh + OVERHANG;

  // Flamingo scale: fit body+neck+head (≈55 norm units) into fh * 0.92
  const flamingoS = (fh * 0.92) / 55.0;
  // x position: feet placed so flamingo occupies left SIDE zone
  // flamingo body extends from ox-13s to ox+24s horizontally
  // We want ox+24*s ≤ SIDE → ox ≤ SIDE - 24*s
  const flamingoOX = Math.min(SIDE - 4, SIDE - 24 * flamingoS + 8);
  const flamingoOY = fh + OVERHANG - 4;

  // Palm: trunk base at right side, height fills frame
  const palmH  = fh * 0.88;
  const palmCX = SIDE + fw + 18;
  const palmBaseY = fh + OVERHANG - 4;

  // Card slot geometry
  const SLOT_INSET = 10;
  const CARD_GAP   = 6;
  const slotAreaW  = width - SLOT_INSET * 2;
  const cardSlotW  = (slotAreaW - CARD_GAP * 4) / 5;
  const cardSlotH  = height - SLOT_INSET * 2;

  return (
    <View
      style={{
        position: 'absolute',
        top:    -(PAD + OVERHANG),
        left:   -(PAD + SIDE),
        width:  totalW,
        height: totalH,
        pointerEvents: 'none',
      }}
    >
      <Svg width={totalW} height={totalH} viewBox={`0 0 ${totalW} ${totalH}`}>

        {/* ── Outer glow ──────────────────────────────────────────────── */}
        <Rect
          x={SIDE + 2} y={OVERHANG + 2} width={fw - 4} height={fh - 4} rx={13}
          fill="none" stroke={CYAN} strokeWidth={4} strokeOpacity={0.10}
        />

        {/* ── Main dashed cyan border ──────────────────────────────────── */}
        <Rect
          x={SIDE + 5} y={OVERHANG + 5} width={fw - 10} height={fh - 10} rx={10}
          fill="none" stroke={CYAN} strokeWidth={1.5}
          strokeDasharray="7,5" strokeOpacity={0.78}
        />

        {/* ── 5 dashed card slot placeholders ─────────────────────────── */}
        {[0, 1, 2, 3, 4].map((i) => (
          <Rect
            key={i}
            x={SIDE + PAD + SLOT_INSET + i * (cardSlotW + CARD_GAP)}
            y={OVERHANG + PAD + SLOT_INSET}
            width={cardSlotW}
            height={cardSlotH}
            rx={5}
            fill="none"
            stroke={CYAN}
            strokeWidth={1.0}
            strokeDasharray="5,3"
            strokeOpacity={0.38}
          />
        ))}

        {/* ── Pink flamingo — left of frame ────────────────────────────── */}
        <Flamingo
          ox={flamingoOX}
          oy={flamingoOY}
          s={flamingoS}
          color={PINK}
          op={0.88}
        />

        {/* ── Pink palm — right of frame ───────────────────────────────── */}
        <Palm
          cx={palmCX}
          baseY={palmBaseY}
          h={palmH}
          lean={-8}
          color={PINK}
          op={0.82}
        />

      </Svg>
    </View>
  );
}
