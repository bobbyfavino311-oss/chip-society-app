/**
 * ViceCardFrame — Angular neon-pink frame overlay for the community card area.
 * Reference: octagonal black frame, dashed pink border, "Vice Nights" italic
 * script title, palm tree decorations at top corners of title band.
 */
import React from 'react';
import { View } from 'react-native';
import Svg, {
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

const PINK  = '#FF2FAE';
const CYAN  = '#00E5FF';
const CUT   = 14;  // corner clip amount (px)
const PAD   = 10;  // outset from card surface edge

interface Props { width: number; height: number; }

// ─── Small palm SVG ornament ──────────────────────────────────────────────────
function PalmOrnament({ x, y, flip = false }: { x: number; y: number; flip?: boolean }) {
  const s = flip ? -1 : 1;
  const trunk = `M ${x} ${y + 22} C ${x + s * 2} ${y + 14}, ${x + s * 1} ${y + 8}, ${x + s * 2} ${y}`;
  const f1 = `M ${x + s * 2} ${y} C ${x + s * 8} ${y - 4}, ${x + s * 14} ${y + 2}, ${x + s * 14} ${y + 8}`;
  const f2 = `M ${x + s * 2} ${y} C ${x + s * 4} ${y - 8}, ${x + s * 8} ${y - 12}, ${x + s * 8} ${y - 7}`;
  const f3 = `M ${x + s * 2} ${y} C ${x - s * 4} ${y - 4}, ${x - s * 8} ${y + 2}, ${x - s * 8} ${y + 8}`;
  return (
    <G>
      <Path d={trunk} stroke={PINK} strokeWidth={2.2} strokeLinecap="round" fill="none" strokeOpacity={0.90} />
      <Path d={f1} stroke={PINK} strokeWidth={1.3} strokeLinecap="round" fill="none" strokeOpacity={0.85} />
      <Path d={f2} stroke={CYAN} strokeWidth={1.2} strokeLinecap="round" fill="none" strokeOpacity={0.80} />
      <Path d={f3} stroke={CYAN} strokeWidth={1.2} strokeLinecap="round" fill="none" strokeOpacity={0.80} />
    </G>
  );
}

// ─── Clipped-corner polygon path ──────────────────────────────────────────────
function octPath(x: number, y: number, w: number, h: number, c: number) {
  return [
    `M ${x + c} ${y}`,
    `L ${x + w - c} ${y}`,
    `L ${x + w} ${y + c}`,
    `L ${x + w} ${y + h - c}`,
    `L ${x + w - c} ${y + h}`,
    `L ${x + c} ${y + h}`,
    `L ${x} ${y + h - c}`,
    `L ${x} ${y + c}`,
    'Z',
  ].join(' ');
}

export default function ViceCardFrame({ width, height }: Props) {
  if (width === 0 || height === 0) return null;

  const fw = width  + PAD * 2;
  const fh = height + PAD * 2;
  const cx = fw / 2;

  // title band sits ABOVE the card area — extra top overhang
  const TITLE_H = 36;
  const totalH  = fh + TITLE_H;

  return (
    <View
      style={{
        position: 'absolute',
        top:    -(PAD + TITLE_H),
        left:   -PAD,
        right:  -PAD,
        bottom: -PAD,
        pointerEvents: 'none',
      }}
    >
      <Svg width={fw} height={totalH} viewBox={`0 0 ${fw} ${totalH}`}>
        <Defs>
          <LinearGradient id="vcFrameGlow" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%"   stopColor={PINK} stopOpacity="0.0" />
            <Stop offset="35%"  stopColor={PINK} stopOpacity="0.55" />
            <Stop offset="65%"  stopColor={CYAN} stopOpacity="0.55" />
            <Stop offset="100%" stopColor={CYAN} stopOpacity="0.0" />
          </LinearGradient>
        </Defs>

        {/* ── Outer soft glow frame ─────────────────────────────────── */}
        <Path
          d={octPath(2, TITLE_H + 2, fw - 4, fh - 4, CUT + 4)}
          fill="none"
          stroke={PINK}
          strokeWidth={2.5}
          strokeOpacity={0.18}
        />

        {/* ── Main angular frame — dashed pink border ───────────────── */}
        <Path
          d={octPath(6, TITLE_H + 6, fw - 12, fh - 12, CUT)}
          fill="none"
          stroke={PINK}
          strokeWidth={1.6}
          strokeOpacity={0.85}
          strokeDasharray="5,4"
        />

        {/* ── Inner accent border — thinner cyan dash ───────────────── */}
        <Path
          d={octPath(10, TITLE_H + 10, fw - 20, fh - 20, CUT - 2)}
          fill="none"
          stroke={CYAN}
          strokeWidth={0.7}
          strokeOpacity={0.30}
          strokeDasharray="3,5"
        />

        {/* ── Title gradient line ───────────────────────────────────── */}
        <Line x1={20} y1={TITLE_H + 6} x2={fw - 20} y2={TITLE_H + 6}
          stroke="url(#vcFrameGlow)" strokeWidth={1.0} strokeOpacity={0.7} />

        {/* ── "Vice Nights" italic title ────────────────────────────── */}
        {/* Pink glow layer */}
        <SvgText
          x={cx} y={TITLE_H - 6}
          fill={PINK}
          fontSize={22}
          fontWeight="bold"
          fontStyle="italic"
          textAnchor="middle"
          letterSpacing={1.5}
          opacity={0.35}
        >
          Vice Nights
        </SvgText>
        {/* Main white-pink text */}
        <SvgText
          x={cx} y={TITLE_H - 7}
          fill="#FFCCE8"
          fontSize={22}
          fontWeight="bold"
          fontStyle="italic"
          textAnchor="middle"
          letterSpacing={1.5}
          opacity={0.95}
        >
          Vice Nights
        </SvgText>

        {/* ── Palm tree decorations flanking title ─────────────────── */}
        <PalmOrnament x={cx - 78} y={TITLE_H - 28} />
        <PalmOrnament x={cx + 68} y={TITLE_H - 28} flip />

        {/* ── Corner accent dots ────────────────────────────────────── */}
        {[
          [6, TITLE_H + 6], [fw - 6, TITLE_H + 6],
          [6, totalH - 6],  [fw - 6, totalH - 6],
        ].map(([px, py], i) => (
          <Path key={i}
            d={`M ${px - 5} ${py} L ${px} ${py - 5} L ${px + 5} ${py} L ${px} ${py + 5} Z`}
            fill={i < 2 ? PINK : CYAN} fillOpacity={0.65}
          />
        ))}
      </Svg>
    </View>
  );
}
