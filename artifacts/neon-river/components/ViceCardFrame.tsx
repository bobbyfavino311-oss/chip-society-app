/**
 * ViceCardFrame — community card area frame for Vice Nights theme
 * Reference: dark panel with dashed pink border, "Vice City" in large italic
 * script at top, palm trees + martini glass decorations, accent lines.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Line, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

const PINK = '#FF2FAE';
const CYAN = '#00E5FF';
const PAD  = 10;

// ─── Mini palm tree icon ──────────────────────────────────────────────────────
function MiniPalm({ size = 24, color = PINK }: { size?: number; color?: string }) {
  const cx = size / 2;
  const bY = size * 0.95;
  const cY = size * 0.25;
  const L  = size * 0.45;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Trunk */}
      <Path d={`M ${cx - 1} ${bY} C ${cx + 2} ${(bY + cY) / 2}, ${cx - 2} ${(bY + cY) / 2}, ${cx} ${cY}`}
        stroke={color} strokeWidth={2.2} strokeLinecap="round" fill="none" strokeOpacity={0.9} />
      {/* Fronds × 6 */}
      <Path d={`M ${cx} ${cY} C ${cx + L*.4} ${cY - L*.3}, ${cx + L} ${cY}, ${cx + L} ${cY + L*.3}`}
        stroke={color} strokeWidth={1.3} strokeLinecap="round" fill="none" strokeOpacity={0.85} />
      <Path d={`M ${cx} ${cY} C ${cx + L*.2} ${cY - L*.7}, ${cx + L*.5} ${cY - L}, ${cx + L*.55} ${cY - L*.6}`}
        stroke={color} strokeWidth={1.3} strokeLinecap="round" fill="none" strokeOpacity={0.85} />
      <Path d={`M ${cx} ${cY} C ${cx} ${cY - L*.85}, ${cx + L*.1} ${cY - L*1.1}, ${cx} ${cY - L}`}
        stroke={color} strokeWidth={1.3} strokeLinecap="round" fill="none" strokeOpacity={0.85} />
      <Path d={`M ${cx} ${cY} C ${cx - L*.2} ${cY - L*.7}, ${cx - L*.5} ${cY - L}, ${cx - L*.55} ${cY - L*.6}`}
        stroke={color} strokeWidth={1.3} strokeLinecap="round" fill="none" strokeOpacity={0.85} />
      <Path d={`M ${cx} ${cY} C ${cx - L*.4} ${cY - L*.3}, ${cx - L} ${cY}, ${cx - L} ${cY + L*.3}`}
        stroke={color} strokeWidth={1.3} strokeLinecap="round" fill="none" strokeOpacity={0.85} />
      <Path d={`M ${cx} ${cY} C ${cx + L*.55} ${cY - L*.05}, ${cx + L} ${cY + L*.28}, ${cx + L*1.18} ${cY + L*.55}`}
        stroke={color} strokeWidth={1.0} strokeLinecap="round" fill="none" strokeOpacity={0.70} />
    </Svg>
  );
}

// ─── Martini glass ────────────────────────────────────────────────────────────
function MartiniGlass({ size = 36 }: { size?: number }) {
  const cx = size / 2;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <RadialGradient id="mGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%"   stopColor={CYAN} stopOpacity="0.15" />
          <Stop offset="100%" stopColor={CYAN} stopOpacity="0.00" />
        </RadialGradient>
      </Defs>
      {/* Glow backdrop */}
      <Rect x={0} y={0} width={size} height={size} rx={size / 2} fill="url(#mGlow)" />
      {/* Glass rim top line */}
      <Line x1={cx - size * 0.44} y1={size * 0.12}
            x2={cx + size * 0.44} y2={size * 0.12}
        stroke={PINK} strokeWidth={0.8} strokeOpacity={0.55} />
      {/* Bowl triangle */}
      <Path
        d={`M ${cx - size * 0.44} ${size * 0.12} L ${cx} ${size * 0.56} L ${cx + size * 0.44} ${size * 0.12} Z`}
        fill="rgba(0,229,255,0.06)" stroke={CYAN} strokeWidth={1.3} strokeOpacity={0.82}
      />
      {/* Stem */}
      <Line x1={cx} y1={size * 0.56} x2={cx} y2={size * 0.88}
        stroke={CYAN} strokeWidth={1.3} strokeOpacity={0.82} />
      {/* Base */}
      <Line x1={cx - size * 0.22} y1={size * 0.88} x2={cx + size * 0.22} y2={size * 0.88}
        stroke={CYAN} strokeWidth={1.8} strokeOpacity={0.82} />
      {/* Olive */}
      <Circle cx={cx} cy={size * 0.36} r={size * 0.08} fill={PINK} opacity={0.90} />
      <Circle cx={cx} cy={size * 0.36} r={size * 0.04} fill="#FFF" opacity={0.40} />
    </Svg>
  );
}

// ─── Frame component ──────────────────────────────────────────────────────────
export default function ViceCardFrame({ width, height }: { width: number; height: number }) {
  if (width === 0 || height === 0) return null;

  const fw = width  + (PAD + 2) * 2;
  const fh = height + (PAD + 2) * 2;
  const ox = PAD + 2;
  const oy = PAD + 2;
  const rr = 22; // outer border radius

  return (
    <View
      style={{
        position: 'absolute',
        top:    -(PAD + 2),
        left:   -(PAD + 2),
        right:  -(PAD + 2),
        bottom: -(PAD + 2),
        pointerEvents: 'none',
      }}
    >
      {/* SVG border decorations */}
      <Svg width={fw} height={fh} viewBox={`0 0 ${fw} ${fh}`}
        style={StyleSheet.absoluteFillObject}>
        {/* Outer glow border */}
        <Rect x={ox - 2} y={oy - 2} width={width + 4} height={height + 4}
          rx={rr + 1} fill="none" stroke={PINK} strokeWidth={0.6} strokeOpacity={0.20} />
        {/* Main pink border */}
        <Rect x={ox} y={oy} width={width} height={height}
          rx={rr} fill="none" stroke={PINK} strokeWidth={2.0} strokeOpacity={0.70} />
        {/* Inner dashed cyan border */}
        <Rect x={ox + 5} y={oy + 5} width={width - 10} height={height - 10}
          rx={rr - 3} fill="none" stroke={PINK} strokeWidth={0.9}
          strokeOpacity={0.35} strokeDasharray="6,5" />

        {/* Bottom horizontal accent lines (left + right — matching reference) */}
        <Line x1={ox + 10} y1={fh - oy - 8} x2={ox + 52} y2={fh - oy - 8}
          stroke={PINK} strokeWidth={1.0} strokeOpacity={0.55} />
        <Line x1={ox + 10} y1={fh - oy - 4} x2={ox + 42} y2={fh - oy - 4}
          stroke={PINK} strokeWidth={0.6} strokeOpacity={0.30} />
        <Line x1={fw - ox - 52} y1={fh - oy - 8} x2={fw - ox - 10} y2={fh - oy - 8}
          stroke={CYAN} strokeWidth={1.0} strokeOpacity={0.55} />
        <Line x1={fw - ox - 42} y1={fh - oy - 4} x2={fw - ox - 10} y2={fh - oy - 4}
          stroke={CYAN} strokeWidth={0.6} strokeOpacity={0.30} />
      </Svg>

      {/* ── "Vice City" script label — top center, prominent ── */}
      <View style={styles.signRow}>
        <View style={styles.signBg}>
          <Text style={styles.viceCityText}>Vice Nights</Text>
        </View>
      </View>

      {/* ── Bottom corner palm trees ── */}
      <View style={styles.palmBL}>
        <MiniPalm size={26} color={PINK} />
      </View>
      <View style={styles.palmBR}>
        <MiniPalm size={26} color={CYAN} />
      </View>

      {/* ── Martini glass — right side ── */}
      <View style={[styles.martini, { top: height * 0.42 }]}>
        <MartiniGlass size={36} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  signRow: {
    position: 'absolute',
    top: -6,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  signBg: {
    backgroundColor: 'rgba(4,2,18,0.92)',
    borderWidth: 1.2,
    borderColor: 'rgba(255,47,174,0.70)',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 5,
    shadowColor: '#FF2FAE',
    shadowOpacity: 0.65,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  viceCityText: {
    color: '#FF2FAE',
    fontSize: 22,
    fontWeight: '800',
    fontStyle: 'italic',
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
    textShadowColor: '#FF2FAE',
    textShadowRadius: 14,
    textShadowOffset: { width: 0, height: 0 },
  },
  palmBL: {
    position: 'absolute',
    bottom: 5,
    left: 12,
  },
  palmBR: {
    position: 'absolute',
    bottom: 5,
    right: 12,
  },
  martini: {
    position: 'absolute',
    right: -4,
  },
});
