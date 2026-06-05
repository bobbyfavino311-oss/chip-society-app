/**
 * ViceBackground — Minimal Miami Nights
 * Plain dark navy, subtle glows, large neon flamingo (bottom-left),
 * large palm tree (bottom-right). No cityscape. No clutter.
 */
import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, {
  Defs,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

const { width: W, height: H } = Dimensions.get('window');
const VW = 390;
const VH = 844;

// ─── Large neon flamingo outline ──────────────────────────────────────────────
function NeonFlamingo({ x, y, s = 1, color = '#FF2FAE', op = 1 }: {
  x: number; y: number; s?: number; color?: string; op?: number;
}) {
  return (
    <G opacity={op}>
      {/* Left leg */}
      <Path d={`M ${x-3*s} ${y} C ${x-3.5*s} ${y-6*s}, ${x-5*s} ${y-12*s}, ${x-4*s} ${y-20*s}`}
        stroke={color} strokeWidth={2.2*s} strokeLinecap="round" fill="none" />
      {/* Right leg */}
      <Path d={`M ${x+1*s} ${y} C ${x+0.5*s} ${y-6*s}, ${x-0.5*s} ${y-12*s}, ${x-0.5*s} ${y-20*s}`}
        stroke={color} strokeWidth={2.2*s} strokeLinecap="round" fill="none" />
      {/* Knee bends */}
      <Path d={`M ${x-5*s} ${y-11*s} L ${x-2*s} ${y-10*s}`}
        stroke={color} strokeWidth={1.6*s} strokeLinecap="round" fill="none" />
      <Path d={`M ${x-0.5*s} ${y-11*s} L ${x+2*s} ${y-10.5*s}`}
        stroke={color} strokeWidth={1.6*s} strokeLinecap="round" fill="none" />
      {/* Body oval */}
      <Path d={`M ${x-8*s} ${y-24*s} C ${x-13*s} ${y-30*s}, ${x-2*s} ${y-37*s}, ${x+6*s} ${y-31*s} C ${x+12*s} ${y-25*s}, ${x+4*s} ${y-20*s}, ${x-4*s} ${y-20*s} Z`}
        stroke={color} strokeWidth={2*s} fill="none" />
      {/* Wing fold */}
      <Path d={`M ${x-8*s} ${y-28*s} C ${x-15*s} ${y-32*s}, ${x-16*s} ${y-25*s}, ${x-6*s} ${y-23*s}`}
        stroke={color} strokeWidth={1.5*s} fill="none" strokeOpacity={0.65} />
      {/* Neck S-curve */}
      <Path d={`M ${x+5*s} ${y-30*s} C ${x+13*s} ${y-37*s}, ${x+6*s} ${y-43*s}, ${x+10*s} ${y-49*s}`}
        stroke={color} strokeWidth={2*s} strokeLinecap="round" fill="none" />
      {/* Head */}
      <Path d={`M ${x+10*s} ${y-49*s} C ${x+13*s} ${y-54*s}, ${x+17*s} ${y-52*s}, ${x+16*s} ${y-49*s} C ${x+15*s} ${y-46*s}, ${x+10*s} ${y-48*s}, ${x+10*s} ${y-49*s}`}
        stroke={color} strokeWidth={1.8*s} fill="none" />
      {/* Beak */}
      <Path d={`M ${x+16*s} ${y-50*s} C ${x+21*s} ${y-51*s}, ${x+22*s} ${y-49*s}, ${x+18*s} ${y-47.5*s}`}
        stroke={color} strokeWidth={1.5*s} strokeLinecap="round" fill="none" />
    </G>
  );
}

// ─── Neon palm tree outline ────────────────────────────────────────────────────
function NeonPalm({ cx, baseY, h, lean = 0, color = '#00B4CC', op = 1, sw = 3 }: {
  cx: number; baseY: number; h: number; lean?: number;
  color?: string; op?: number; sw?: number;
}) {
  const crown = baseY - h;
  const tw = h * 0.52;
  return (
    <G opacity={op}>
      <Path d={`M ${cx} ${baseY} C ${cx+lean*0.3} ${baseY-h*0.5}, ${cx+lean-2} ${crown+h*0.12}, ${cx+lean} ${crown}`}
        stroke={color} strokeWidth={sw} strokeLinecap="round" fill="none" />
      <Path d={`M ${cx+lean} ${crown} C ${cx+lean+tw*0.45} ${crown-tw*0.35}, ${cx+lean+tw} ${crown+tw*0.05}, ${cx+lean+tw} ${crown+tw*0.45}`}
        stroke={color} strokeWidth={sw*0.65} strokeLinecap="round" fill="none" />
      <Path d={`M ${cx+lean} ${crown} C ${cx+lean+tw*0.2} ${crown-tw*0.72}, ${cx+lean+tw*0.52} ${crown-tw*0.95}, ${cx+lean+tw*0.55} ${crown-tw*0.62}`}
        stroke={color} strokeWidth={sw*0.6} strokeLinecap="round" fill="none" />
      <Path d={`M ${cx+lean} ${crown} C ${cx+lean} ${crown-tw*0.82}, ${cx+lean} ${crown-tw*1.12}, ${cx+lean} ${crown-tw*0.95}`}
        stroke={color} strokeWidth={sw*0.6} strokeLinecap="round" fill="none" />
      <Path d={`M ${cx+lean} ${crown} C ${cx+lean-tw*0.2} ${crown-tw*0.72}, ${cx+lean-tw*0.52} ${crown-tw*0.95}, ${cx+lean-tw*0.55} ${crown-tw*0.62}`}
        stroke={color} strokeWidth={sw*0.6} strokeLinecap="round" fill="none" />
      <Path d={`M ${cx+lean} ${crown} C ${cx+lean-tw*0.45} ${crown-tw*0.35}, ${cx+lean-tw} ${crown+tw*0.05}, ${cx+lean-tw} ${crown+tw*0.45}`}
        stroke={color} strokeWidth={sw*0.65} strokeLinecap="round" fill="none" />
    </G>
  );
}

export default function ViceBackground() {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Svg width={W} height={H} viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="xMidYMid meet">
        <Defs>
          <LinearGradient id="vbSky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%"   stopColor="#030510" stopOpacity="1" />
            <Stop offset="55%"  stopColor="#050A1C" stopOpacity="1" />
            <Stop offset="100%" stopColor="#030412" stopOpacity="1" />
          </LinearGradient>
          <RadialGradient id="vbPinkGlow" cx="18%" cy="88%" r="38%">
            <Stop offset="0%"   stopColor="#FF2FAE" stopOpacity="0.16" />
            <Stop offset="100%" stopColor="#000000"  stopOpacity="0.00" />
          </RadialGradient>
          <RadialGradient id="vbCyanGlow" cx="84%" cy="84%" r="36%">
            <Stop offset="0%"   stopColor="#00B4CC" stopOpacity="0.12" />
            <Stop offset="100%" stopColor="#000000"  stopOpacity="0.00" />
          </RadialGradient>
          <RadialGradient id="vbPurpleHorizon" cx="50%" cy="94%" r="55%">
            <Stop offset="0%"   stopColor="#3800A0" stopOpacity="0.22" />
            <Stop offset="100%" stopColor="#000000"  stopOpacity="0.00" />
          </RadialGradient>
        </Defs>

        {/* Background layers */}
        <Rect x={0} y={0} width={VW} height={VH} fill="url(#vbSky)" />
        <Rect x={0} y={0} width={VW} height={VH} fill="url(#vbPinkGlow)" />
        <Rect x={0} y={0} width={VW} height={VH} fill="url(#vbCyanGlow)" />
        <Rect x={0} y={0} width={VW} height={VH} fill="url(#vbPurpleHorizon)" />

        {/* Horizon accent lines */}
        <Path d={`M 0 ${VH*0.82} L ${VW} ${VH*0.82}`}
          stroke="#00B4CC" strokeWidth={0.8} strokeOpacity={0.18} />
        <Path d={`M 0 ${VH*0.825} L ${VW} ${VH*0.825}`}
          stroke="#FF2FAE" strokeWidth={0.5} strokeOpacity={0.10} />

        {/* ── Large decorative flamingo — bottom-left ─────────────── */}
        <NeonFlamingo x={68} y={VH} s={2.4} color="#FF2FAE" op={0.52} />

        {/* ── Large decorative palm trees — bottom-right ───────────── */}
        <NeonPalm cx={VW - 62} baseY={VH} h={230} lean={-18} color="#004860" op={0.70} sw={3} />
        <NeonPalm cx={VW - 28} baseY={VH} h={175} lean={22}  color="#003450" op={0.42} sw={2.2} />
      </Svg>
    </View>
  );
}
