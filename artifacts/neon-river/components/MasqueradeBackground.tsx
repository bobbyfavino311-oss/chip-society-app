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

const VIOLET   = '#8B00CC';
const PLUM     = '#4A0090';
const GOLD     = '#D4AF37';

export default function MasqueradeBackground() {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">

      {/* ── Layer 1: Deep black-purple base gradient ─────────────────────────── */}
      <LinearGradient
        colors={['#160030', '#0C001E', '#080014', '#0C001E', '#160030']}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* ── Layer 2: Diagonal violet depth wash ──────────────────────────────── */}
      <LinearGradient
        colors={['transparent', 'rgba(74,0,144,0.12)', 'transparent']}
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
          <RadialGradient id="mqGlowTop" cx="40%" cy="5%" r="60%">
            <Stop offset="0"   stopColor={VIOLET} stopOpacity="0.22" />
            <Stop offset="0.6" stopColor={PLUM}   stopOpacity="0.06" />
            <Stop offset="1"   stopColor={PLUM}   stopOpacity="0"    />
          </RadialGradient>

          <RadialGradient id="mqGlowMid" cx="55%" cy="50%" r="50%">
            <Stop offset="0"   stopColor={PLUM}   stopOpacity="0.12" />
            <Stop offset="1"   stopColor={PLUM}   stopOpacity="0"    />
          </RadialGradient>

          <RadialGradient id="mqGlowBL" cx="5%" cy="90%" r="55%">
            <Stop offset="0"   stopColor={VIOLET} stopOpacity="0.16" />
            <Stop offset="1"   stopColor={VIOLET} stopOpacity="0"    />
          </RadialGradient>

          <RadialGradient id="mqGlowTR" cx="95%" cy="10%" r="50%">
            <Stop offset="0"   stopColor={PLUM}   stopOpacity="0.14" />
            <Stop offset="1"   stopColor={PLUM}   stopOpacity="0"    />
          </RadialGradient>

          {/* Subtle gold centre bloom — the one masquerade hint */}
          <RadialGradient id="mqGold" cx="50%" cy="48%" r="35%">
            <Stop offset="0"   stopColor={GOLD}   stopOpacity="0.05" />
            <Stop offset="1"   stopColor={GOLD}   stopOpacity="0"    />
          </RadialGradient>

          {/* Frosted glass disk fills */}
          <RadialGradient id="diskA" cx="50%" cy="35%" r="50%">
            <Stop offset="0"   stopColor="#9B30FF" stopOpacity="0.10" />
            <Stop offset="0.5" stopColor={PLUM}   stopOpacity="0.04" />
            <Stop offset="1"   stopColor={PLUM}   stopOpacity="0"    />
          </RadialGradient>

          <RadialGradient id="diskB" cx="50%" cy="40%" r="50%">
            <Stop offset="0"   stopColor={VIOLET} stopOpacity="0.07" />
            <Stop offset="0.6" stopColor={PLUM}   stopOpacity="0.02" />
            <Stop offset="1"   stopColor={PLUM}   stopOpacity="0"    />
          </RadialGradient>

          <RadialGradient id="diskC" cx="50%" cy="50%" r="50%">
            <Stop offset="0"   stopColor={PLUM}   stopOpacity="0.06" />
            <Stop offset="1"   stopColor={PLUM}   stopOpacity="0"    />
          </RadialGradient>

          {/* Sheen — subtle top highlight */}
          <RadialGradient id="mqSheen" cx="50%" cy="10%" r="50%">
            <Stop offset="0"   stopColor="#F0E8FF" stopOpacity="0.06" />
            <Stop offset="1"   stopColor="#F0E8FF" stopOpacity="0"    />
          </RadialGradient>
        </Defs>

        {/* Ambient glow layers */}
        <Rect x={0} y={0} width={VW} height={VH} fill="url(#mqGlowTop)" />
        <Rect x={0} y={0} width={VW} height={VH} fill="url(#mqGlowMid)" />
        <Rect x={0} y={0} width={VW} height={VH} fill="url(#mqGlowBL)"  />
        <Rect x={0} y={0} width={VW} height={VH} fill="url(#mqGlowTR)"  />
        <Rect x={0} y={0} width={VW} height={VH} fill="url(#mqGold)"    />

        {/* ────────────────────────────────────────────────────────────────────
            FROSTED GLASS CIRCLES — large, overlapping, bleeding off screen
         ──────────────────────────────────────────────────────────────────── */}

        {/* Giant top-left hemisphere */}
        <Circle
          cx={VW * -0.05} cy={VH * 0.12}
          r={VW * 0.78}
          fill="url(#diskB)"
          stroke={PLUM} strokeWidth={0.5} strokeOpacity={0.10}
        />

        {/* Giant right hemisphere */}
        <Circle
          cx={VW * 1.05} cy={VH * 0.40}
          r={VW * 0.82}
          fill="url(#diskC)"
          stroke={VIOLET} strokeWidth={0.4} strokeOpacity={0.08}
        />

        {/* Large center-top glass disk */}
        <Circle
          cx={VW * 0.50} cy={VH * 0.10}
          r={VW * 0.64}
          fill="url(#diskA)"
          stroke={VIOLET} strokeWidth={0.6} strokeOpacity={0.12}
        />

        {/* Left-center disk */}
        <Circle
          cx={VW * 0.10} cy={VH * 0.54}
          r={VW * 0.54}
          fill="url(#diskB)"
          stroke={PLUM} strokeWidth={0.3} strokeOpacity={0.07}
        />

        {/* Bottom-right hemisphere */}
        <Circle
          cx={VW * 1.02} cy={VH * 0.90}
          r={VW * 0.72}
          fill="url(#diskA)"
          stroke={VIOLET} strokeWidth={0.5} strokeOpacity={0.10}
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
          cx={VW * 0.50} cy={VH * 0.92}
          r={VW * 0.44}
          fill="url(#diskB)"
          stroke={VIOLET} strokeWidth={0.3} strokeOpacity={0.05}
        />

        {/* Faint outer rings — ripple depth */}
        <Circle
          cx={VW * 0.50} cy={VH * 0.50}
          r={VW * 0.72}
          fill="none"
          stroke={PLUM} strokeWidth={0.4} strokeOpacity={0.05}
        />
        <Circle
          cx={VW * 0.50} cy={VH * 0.50}
          r={VW * 0.92}
          fill="none"
          stroke={VIOLET} strokeWidth={0.3} strokeOpacity={0.03}
        />

        {/* Frosted sheen arc — top */}
        <Ellipse
          cx={VW * 0.50} cy={VH * 0.06}
          rx={VW * 0.55} ry={VH * 0.20}
          fill="url(#mqSheen)"
        />

        {/* Vignettes */}
        <Rect x={0} y={0}          width={VW} height={VH * 0.12} fill="rgba(8,0,18,0.55)" />
        <Rect x={0} y={VH * 0.88}  width={VW} height={VH * 0.12} fill="rgba(8,0,18,0.50)" />
      </Svg>
    </View>
  );
}
