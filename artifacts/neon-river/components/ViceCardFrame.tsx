import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, Line, Path, Polygon, Rect } from 'react-native-svg';

const PINK  = '#FF2FAE';
const CYAN  = '#00E5FF';
const PAD   = 8;

// ─── Simplified palm tree icon ─────────────────────────────────────────────────
function MiniPalm({ size = 20, color = PINK }: { size?: number; color?: string }) {
  const cx = size / 2;
  const baseY = size;
  const crownY = size * 0.28;
  const L = size * 0.42;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Trunk */}
      <Path
        d={`M ${cx - 1} ${baseY} C ${cx + 2} ${(baseY + crownY) / 2}, ${cx - 2} ${(baseY + crownY) / 2}, ${cx} ${crownY}`}
        stroke={color} strokeWidth={2} strokeLinecap="round" fill="none" strokeOpacity={0.85}
      />
      {/* 5 fronds */}
      <Path d={`M ${cx} ${crownY} C ${cx + L * 0.4} ${crownY - L * 0.3}, ${cx + L} ${crownY}, ${cx + L} ${crownY + L * 0.3}`}
        stroke={color} strokeWidth={1.2} strokeLinecap="round" fill="none" strokeOpacity={0.8} />
      <Path d={`M ${cx} ${crownY} C ${cx + L * 0.2} ${crownY - L * 0.7}, ${cx + L * 0.5} ${crownY - L * 0.9}, ${cx + L * 0.55} ${crownY - L * 0.6}`}
        stroke={color} strokeWidth={1.2} strokeLinecap="round" fill="none" strokeOpacity={0.8} />
      <Path d={`M ${cx} ${crownY} C ${cx} ${crownY - L * 0.8}, ${cx + L * 0.1} ${crownY - L * 1.1}, ${cx} ${crownY - L}`}
        stroke={color} strokeWidth={1.2} strokeLinecap="round" fill="none" strokeOpacity={0.8} />
      <Path d={`M ${cx} ${crownY} C ${cx - L * 0.2} ${crownY - L * 0.7}, ${cx - L * 0.5} ${crownY - L * 0.9}, ${cx - L * 0.55} ${crownY - L * 0.6}`}
        stroke={color} strokeWidth={1.2} strokeLinecap="round" fill="none" strokeOpacity={0.8} />
      <Path d={`M ${cx} ${crownY} C ${cx - L * 0.4} ${crownY - L * 0.3}, ${cx - L} ${crownY}, ${cx - L} ${crownY + L * 0.3}`}
        stroke={color} strokeWidth={1.2} strokeLinecap="round" fill="none" strokeOpacity={0.8} />
    </Svg>
  );
}

// ─── Martini glass icon ────────────────────────────────────────────────────────
function MartiniGlass({ size = 32 }: { size?: number }) {
  const cx = size / 2;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Glass bowl — triangle */}
      <Path
        d={`M ${cx - size * 0.44} ${size * 0.12} L ${cx} ${size * 0.58} L ${cx + size * 0.44} ${size * 0.12} Z`}
        fill="none" stroke={CYAN} strokeWidth={1.2} strokeOpacity={0.8}
      />
      {/* Stem */}
      <Line x1={cx} y1={size * 0.58} x2={cx} y2={size * 0.88} stroke={CYAN} strokeWidth={1.2} strokeOpacity={0.8} />
      {/* Base */}
      <Line x1={cx - size * 0.22} y1={size * 0.88} x2={cx + size * 0.22} y2={size * 0.88}
        stroke={CYAN} strokeWidth={1.5} strokeOpacity={0.8} />
      {/* Olive */}
      <Circle cx={cx} cy={size * 0.38} r={size * 0.07} fill={PINK} opacity={0.8} />
      {/* Rim accent */}
      <Line x1={cx - size * 0.44} y1={size * 0.12} x2={cx + size * 0.44} y2={size * 0.12}
        stroke={PINK} strokeWidth={0.8} strokeOpacity={0.55} />
    </Svg>
  );
}

interface ViceCardFrameProps {
  width: number;
  height: number;
}

export default function ViceCardFrame({ width, height }: ViceCardFrameProps) {
  if (width === 0 || height === 0) return null;

  const fw = width  + (PAD + 2) * 2;
  const fh = height + (PAD + 2) * 2;
  const ox = PAD + 2;
  const oy = PAD + 2;

  return (
    <View
      style={{
        position: 'absolute',
        top: -(PAD + 2),
        left: -(PAD + 2),
        right: -(PAD + 2),
        bottom: -(PAD + 2),
        pointerEvents: 'none',
      }}
    >
      {/* Pink outer border */}
      <Svg width={fw} height={fh} viewBox={`0 0 ${fw} ${fh}`} style={StyleSheet.absoluteFillObject}>
        {/* Outer glow border — pink */}
        <Rect x={ox - 1} y={oy - 1} width={width + 2} height={height + 2}
          rx={22} fill="none" stroke={PINK} strokeWidth={2} strokeOpacity={0.55} />
        {/* Cyan dashed inner border */}
        <Rect x={ox + 4} y={oy + 4} width={width - 8} height={height - 8}
          rx={18} fill="none" stroke={CYAN} strokeWidth={0.8}
          strokeOpacity={0.40} strokeDasharray="5,4" />
        {/* Bottom left horizontal accent line */}
        <Line x1={ox + 8} y1={fh - oy - 6} x2={ox + 40} y2={fh - oy - 6}
          stroke={PINK} strokeWidth={0.8} strokeOpacity={0.45} />
        {/* Bottom right horizontal accent line */}
        <Line x1={fw - ox - 40} y1={fh - oy - 6} x2={fw - ox - 8} y2={fh - oy - 6}
          stroke={CYAN} strokeWidth={0.8} strokeOpacity={0.45} />
      </Svg>

      {/* "VICE CITY" neon sign at the top */}
      <View style={[styles.signRow, { top: -4, left: 0, right: 0 }]}>
        <View style={styles.signPill}>
          <Text style={styles.signText}>VICE CITY</Text>
        </View>
      </View>

      {/* Bottom corner palm trees */}
      <View style={[styles.palmBL]}>
        <MiniPalm size={22} color={PINK} />
      </View>
      <View style={[styles.palmBR]}>
        <MiniPalm size={22} color={CYAN} />
      </View>

      {/* Martini glass — right side mid-height */}
      <View style={[styles.martini, { top: height / 2 - 16 }]}>
        <MartiniGlass size={30} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  signRow: {
    position: 'absolute',
    alignItems: 'center',
  },
  signPill: {
    backgroundColor: 'rgba(5,3,20,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,47,174,0.65)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 4,
    shadowColor: '#FF2FAE',
    shadowOpacity: 0.55,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  signText: {
    color: '#FF2FAE',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 3,
    fontFamily: 'Orbitron_700Bold',
    textShadowColor: '#FF2FAE',
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 0 },
  },
  palmBL: {
    position: 'absolute',
    bottom: 4,
    left: 10,
  },
  palmBR: {
    position: 'absolute',
    bottom: 4,
    right: 10,
  },
  martini: {
    position: 'absolute',
    right: -6,
  },
});
