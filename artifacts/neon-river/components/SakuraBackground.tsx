import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

const { width: SW, height: SH } = Dimensions.get('screen');
const VW = SW;
const VH = SH;

const SAKURA  = '#F5A9C6';
const ROSE    = '#E88DB0';
const PLUM    = '#7A2050';

export default function SakuraBackground() {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">

      {/* ── Layer 1: Deep plum base gradient ────────────────────────────────── */}
      <LinearGradient
        colors={['#1E0818', '#130510', '#0C030A', '#130510', '#1E0818']}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* ── Layer 2: Diagonal rose depth wash ───────────────────────────────── */}
      <LinearGradient
        colors={['transparent', 'rgba(122,32,80,0.10)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* ── Layer 3: SVG frosted-glass circles ──────────────────────────────── */}
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${VW} ${VH}`}
        style={StyleSheet.absoluteFillObject}
        preserveAspectRatio="xMidYMid slice"
      >
        <Defs>
          {/* Ambient glow fills */}
          <RadialGradient id="skGlowTop" cx="42%" cy="5%" r="60%">
            <Stop offset="0"   stopColor={ROSE}   stopOpacity="0.22" />
            <Stop offset="0.6" stopColor={PLUM}   stopOpacity="0.06" />
            <Stop offset="1"   stopColor={PLUM}   stopOpacity="0"    />
          </RadialGradient>

          <RadialGradient id="skGlowMid" cx="55%" cy="50%" r="50%">
            <Stop offset="0"   stopColor={PLUM}   stopOpacity="0.10" />
            <Stop offset="1"   stopColor={PLUM}   stopOpacity="0"    />
          </RadialGradient>

          <RadialGradient id="skGlowBL" cx="5%" cy="88%" r="55%">
            <Stop offset="0"   stopColor={ROSE}   stopOpacity="0.15" />
            <Stop offset="1"   stopColor={ROSE}   stopOpacity="0"    />
          </RadialGradient>

          <RadialGradient id="skGlowTR" cx="94%" cy="12%" r="50%">
            <Stop offset="0"   stopColor={PLUM}   stopOpacity="0.12" />
            <Stop offset="1"   stopColor={PLUM}   stopOpacity="0"    />
          </RadialGradient>

          {/* Barely-there rose-gold center bloom */}
          <RadialGradient id="skGold" cx="50%" cy="47%" r="32%">
            <Stop offset="0"   stopColor={SAKURA} stopOpacity="0.05" />
            <Stop offset="1"   stopColor={SAKURA} stopOpacity="0"    />
          </RadialGradient>

          {/* Frosted glass disk fills */}
          <RadialGradient id="diskA" cx="50%" cy="35%" r="50%">
            <Stop offset="0"   stopColor={ROSE}   stopOpacity="0.10" />
            <Stop offset="0.5" stopColor={PLUM}   stopOpacity="0.04" />
            <Stop offset="1"   stopColor={PLUM}   stopOpacity="0"    />
          </RadialGradient>

          <RadialGradient id="diskB" cx="50%" cy="40%" r="50%">
            <Stop offset="0"   stopColor={SAKURA} stopOpacity="0.07" />
            <Stop offset="0.6" stopColor={PLUM}   stopOpacity="0.02" />
            <Stop offset="1"   stopColor={PLUM}   stopOpacity="0"    />
          </RadialGradient>

          <RadialGradient id="diskC" cx="50%" cy="50%" r="50%">
            <Stop offset="0"   stopColor={PLUM}   stopOpacity="0.06" />
            <Stop offset="1"   stopColor={PLUM}   stopOpacity="0"    />
          </RadialGradient>

          {/* Soft white sheen — rose quartz highlight */}
          <RadialGradient id="skSheen" cx="50%" cy="8%" r="50%">
            <Stop offset="0"   stopColor="#FFF0F8" stopOpacity="0.06" />
            <Stop offset="1"   stopColor="#FFF0F8" stopOpacity="0"    />
          </RadialGradient>
        </Defs>

        {/* Ambient glow layers */}
        <Rect x={0} y={0} width={VW} height={VH} fill="url(#skGlowTop)" />
        <Rect x={0} y={0} width={VW} height={VH} fill="url(#skGlowMid)" />
        <Rect x={0} y={0} width={VW} height={VH} fill="url(#skGlowBL)"  />
        <Rect x={0} y={0} width={VW} height={VH} fill="url(#skGlowTR)"  />
        <Rect x={0} y={0} width={VW} height={VH} fill="url(#skGold)"    />

        {/* ────────────────────────────────────────────────────────────────────
            FROSTED GLASS CIRCLES — large, overlapping, bleeding off screen
         ──────────────────────────────────────────────────────────────────── */}

        {/* Giant top-left hemisphere */}
        <Circle
          cx={VW * -0.05} cy={VH * 0.12}
          r={VW * 0.80}
          fill="url(#diskB)"
          stroke={PLUM} strokeWidth={0.5} strokeOpacity={0.10}
        />

        {/* Giant right hemisphere */}
        <Circle
          cx={VW * 1.06} cy={VH * 0.42}
          r={VW * 0.84}
          fill="url(#diskC)"
          stroke={ROSE} strokeWidth={0.4} strokeOpacity={0.08}
        />

        {/* Large center-top glass disk */}
        <Circle
          cx={VW * 0.50} cy={VH * 0.10}
          r={VW * 0.65}
          fill="url(#diskA)"
          stroke={ROSE} strokeWidth={0.6} strokeOpacity={0.12}
        />

        {/* Left-center disk */}
        <Circle
          cx={VW * 0.10} cy={VH * 0.55}
          r={VW * 0.55}
          fill="url(#diskB)"
          stroke={PLUM} strokeWidth={0.3} strokeOpacity={0.07}
        />

        {/* Bottom-right hemisphere */}
        <Circle
          cx={VW * 1.02} cy={VH * 0.90}
          r={VW * 0.74}
          fill="url(#diskA)"
          stroke={ROSE} strokeWidth={0.5} strokeOpacity={0.10}
        />

        {/* Deep center disk */}
        <Circle
          cx={VW * 0.50} cy={VH * 0.50}
          r={VW * 0.46}
          fill="url(#diskC)"
          stroke={PLUM} strokeWidth={0.35} strokeOpacity={0.06}
        />

        {/* Bottom-center smaller disk */}
        <Circle
          cx={VW * 0.50} cy={VH * 0.93}
          r={VW * 0.44}
          fill="url(#diskB)"
          stroke={ROSE} strokeWidth={0.3} strokeOpacity={0.05}
        />

        {/* Faint outer rings — rose quartz depth ripple */}
        <Circle
          cx={VW * 0.50} cy={VH * 0.50}
          r={VW * 0.72}
          fill="none"
          stroke={PLUM} strokeWidth={0.4} strokeOpacity={0.05}
        />
        <Circle
          cx={VW * 0.50} cy={VH * 0.50}
          r={VW * 0.94}
          fill="none"
          stroke={ROSE} strokeWidth={0.3} strokeOpacity={0.03}
        />

        {/* Rose quartz sheen arc — top */}
        <Ellipse
          cx={VW * 0.50} cy={VH * 0.06}
          rx={VW * 0.55} ry={VH * 0.20}
          fill="url(#skSheen)"
        />

        {/* Vignettes */}
        <Rect x={0} y={0}         width={VW} height={VH * 0.12} fill="rgba(12,3,10,0.55)" />
        <Rect x={0} y={VH * 0.88} width={VW} height={VH * 0.12} fill="rgba(12,3,10,0.50)" />
      </Svg>
    </View>
  );
}
