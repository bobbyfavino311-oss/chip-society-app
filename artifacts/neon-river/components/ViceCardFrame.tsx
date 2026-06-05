/**
 * ViceCardFrame — Minimal Miami Nights community card overlay.
 * Clean rounded rectangle with cyan dashed border + 5 dashed card slots.
 * Small neon flamingo on the left, small neon palm on the right.
 */
import React from 'react';
import { View } from 'react-native';
import Svg, { G, Path, Rect } from 'react-native-svg';

const PINK = '#FF2FAE';
const CYAN = '#00D4FF';
const PAD  = 8;   // outset from card surface edge
const SIDE = 56;  // extra canvas width on each side for ornaments

interface Props { width: number; height: number; }

// ─── Small neon flamingo ──────────────────────────────────────────────────────
function SmallFlamingo({ x, y }: { x: number; y: number }) {
  return (
    <G>
      <Path d={`M ${x-3} ${y} C ${x-3.5} ${y-7}, ${x-6} ${y-14}, ${x-5} ${y-22}`}
        stroke={PINK} strokeWidth={1.8} strokeLinecap="round" fill="none" strokeOpacity={0.90} />
      <Path d={`M ${x+1} ${y} C ${x+0.5} ${y-7}, ${x-1} ${y-13}, ${x-1} ${y-22}`}
        stroke={PINK} strokeWidth={1.8} strokeLinecap="round" fill="none" strokeOpacity={0.90} />
      <Path d={`M ${x-6} ${y-12} L ${x-3} ${y-11}`}
        stroke={PINK} strokeWidth={1.4} strokeLinecap="round" fill="none" strokeOpacity={0.80} />
      <Path d={`M ${x-9} ${y-26} C ${x-14} ${y-33}, ${x-2} ${y-40}, ${x+7} ${y-34} C ${x+13} ${y-28}, ${x+4} ${y-22}, ${x-5} ${y-22} Z`}
        stroke={PINK} strokeWidth={1.6} fill="none" strokeOpacity={0.90} />
      <Path d={`M ${x-9} ${y-30} C ${x-17} ${y-35}, ${x-18} ${y-27}, ${x-7} ${y-25}`}
        stroke={PINK} strokeWidth={1.2} fill="none" strokeOpacity={0.55} />
      <Path d={`M ${x+6} ${y-33} C ${x+14} ${y-41}, ${x+7} ${y-48}, ${x+11} ${y-55}`}
        stroke={PINK} strokeWidth={1.7} strokeLinecap="round" fill="none" strokeOpacity={0.90} />
      <Path d={`M ${x+11} ${y-55} C ${x+15} ${y-60}, ${x+19} ${y-58}, ${x+18} ${y-55} C ${x+17} ${y-52}, ${x+11} ${y-54}, ${x+11} ${y-55}`}
        stroke={PINK} strokeWidth={1.5} fill="none" strokeOpacity={0.90} />
      <Path d={`M ${x+18} ${y-56} C ${x+23} ${y-57.5}, ${x+24} ${y-55}, ${x+20} ${y-53.5}`}
        stroke={PINK} strokeWidth={1.3} strokeLinecap="round" fill="none" strokeOpacity={0.85} />
    </G>
  );
}

// ─── Small neon palm ──────────────────────────────────────────────────────────
function SmallPalm({ cx, baseY, h }: { cx: number; baseY: number; h: number }) {
  const crown = baseY - h;
  const tw = h * 0.52;
  return (
    <G>
      <Path d={`M ${cx} ${baseY} C ${cx-3} ${baseY-h*0.5}, ${cx-5} ${crown+h*0.12}, ${cx-5} ${crown}`}
        stroke={CYAN} strokeWidth={2.2} strokeLinecap="round" fill="none" strokeOpacity={0.80} />
      <Path d={`M ${cx-5} ${crown} C ${cx-5+tw*0.45} ${crown-tw*0.32}, ${cx-5+tw} ${crown+tw*0.05}, ${cx-5+tw} ${crown+tw*0.40}`}
        stroke={CYAN} strokeWidth={1.6} strokeLinecap="round" fill="none" strokeOpacity={0.75} />
      <Path d={`M ${cx-5} ${crown} C ${cx-5+tw*0.18} ${crown-tw*0.68}, ${cx-5+tw*0.5} ${crown-tw*0.90}, ${cx-5+tw*0.52} ${crown-tw*0.60}`}
        stroke={CYAN} strokeWidth={1.5} strokeLinecap="round" fill="none" strokeOpacity={0.72} />
      <Path d={`M ${cx-5} ${crown} C ${cx-5} ${crown-tw*0.80}, ${cx-5} ${crown-tw*1.08}, ${cx-5} ${crown-tw*0.92}`}
        stroke={CYAN} strokeWidth={1.5} strokeLinecap="round" fill="none" strokeOpacity={0.72} />
      <Path d={`M ${cx-5} ${crown} C ${cx-5-tw*0.18} ${crown-tw*0.68}, ${cx-5-tw*0.5} ${crown-tw*0.90}, ${cx-5-tw*0.52} ${crown-tw*0.60}`}
        stroke={CYAN} strokeWidth={1.5} strokeLinecap="round" fill="none" strokeOpacity={0.72} />
      <Path d={`M ${cx-5} ${crown} C ${cx-5-tw*0.45} ${crown-tw*0.32}, ${cx-5-tw} ${crown+tw*0.05}, ${cx-5-tw} ${crown+tw*0.40}`}
        stroke={CYAN} strokeWidth={1.6} strokeLinecap="round" fill="none" strokeOpacity={0.75} />
    </G>
  );
}

export default function ViceCardFrame({ width, height }: Props) {
  if (width === 0 || height === 0) return null;

  const fw = width  + PAD * 2;
  const fh = height + PAD * 2;

  const totalW = fw + SIDE * 2;
  const totalH = fh;

  // Card slot geometry — 5 slots with even gaps
  const CARD_GAP = 6;
  const SLOT_INSET = 10;
  const slotAreaW = width - SLOT_INSET * 2;
  const cardW = (slotAreaW - CARD_GAP * 4) / 5;
  const cardH = height - SLOT_INSET * 2;

  return (
    <View
      style={{
        position: 'absolute',
        top:    -PAD,
        left:   -(PAD + SIDE),
        width:  totalW,
        height: totalH,
        pointerEvents: 'none',
      }}
    >
      <Svg width={totalW} height={totalH} viewBox={`0 0 ${totalW} ${totalH}`}>

        {/* ── Outer soft glow border ──────────────────────────────────── */}
        <Rect
          x={SIDE + 2} y={2} width={fw - 4} height={fh - 4} rx={13}
          fill="none" stroke={CYAN} strokeWidth={3.5} strokeOpacity={0.12}
        />

        {/* ── Main rounded-rect frame — dashed cyan ───────────────────── */}
        <Rect
          x={SIDE + 5} y={5} width={fw - 10} height={fh - 10} rx={10}
          fill="none" stroke={CYAN} strokeWidth={1.5}
          strokeDasharray="7,5" strokeOpacity={0.78}
        />

        {/* ── 5 dashed card slot placeholders ─────────────────────────── */}
        {[0, 1, 2, 3, 4].map((i) => (
          <Rect
            key={i}
            x={SIDE + PAD + SLOT_INSET + i * (cardW + CARD_GAP)}
            y={PAD + SLOT_INSET}
            width={cardW}
            height={cardH}
            rx={5}
            fill="none"
            stroke={CYAN}
            strokeWidth={1.0}
            strokeDasharray="5,3"
            strokeOpacity={0.38}
          />
        ))}

        {/* ── Flamingo ornament — left of frame ───────────────────────── */}
        <SmallFlamingo x={SIDE - 10} y={fh - 4} />

        {/* ── Palm ornament — right of frame ──────────────────────────── */}
        <SmallPalm cx={SIDE + fw + 16} baseY={fh - 2} h={fh * 0.90} />

      </Svg>
    </View>
  );
}
