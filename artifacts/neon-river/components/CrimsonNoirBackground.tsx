import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Defs,
  Ellipse,
  LinearGradient as SvgLinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

const { width: SW, height: SH } = Dimensions.get('screen');
const VW = SW;
const VH = SH;

// Palette
const CRIMSON  = '#D4002A';
const RUBY     = '#A0001C';
const BURGUNDY = '#3A0010';
const SMOKED   = '#650014';

export default function CrimsonNoirBackground() {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">

      {/* ── Layer 1: Near-black base — deep and rich ────────────────────────── */}
      <LinearGradient
        colors={['#0A0004', '#050505', '#070002', '#050505', '#0A0004']}
        locations={[0, 0.3, 0.5, 0.7, 1]}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* ── Layer 2: Crimson atmospheric tint from below ─────────────────────── */}
      <LinearGradient
        colors={['transparent', 'rgba(58,0,16,0.18)', 'rgba(42,0,10,0.22)', 'rgba(58,0,16,0.12)', 'transparent']}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* ── Layer 3: SVG flowing ribbon forms ───────────────────────────────── */}
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${VW} ${VH}`}
        style={StyleSheet.absoluteFillObject}
        preserveAspectRatio="xMidYMid slice"
      >
        <Defs>
          {/* ── Ambient glow fills ── */}
          <RadialGradient id="cnGlowTop" cx="30%" cy="15%" r="55%">
            <Stop offset="0"   stopColor={RUBY}    stopOpacity="0.20" />
            <Stop offset="0.6" stopColor={RUBY}    stopOpacity="0.05" />
            <Stop offset="1"   stopColor={RUBY}    stopOpacity="0"    />
          </RadialGradient>

          <RadialGradient id="cnGlowBR" cx="85%" cy="80%" r="60%">
            <Stop offset="0"   stopColor={CRIMSON} stopOpacity="0.18" />
            <Stop offset="0.5" stopColor={CRIMSON} stopOpacity="0.05" />
            <Stop offset="1"   stopColor={CRIMSON} stopOpacity="0"    />
          </RadialGradient>

          <RadialGradient id="cnGlowMid" cx="50%" cy="50%" r="45%">
            <Stop offset="0"   stopColor={BURGUNDY} stopOpacity="0.14" />
            <Stop offset="1"   stopColor={BURGUNDY} stopOpacity="0"    />
          </RadialGradient>

          {/* ── Ribbon gradient fills ── */}
          {/* Ribbon A — sweeps from upper-left to mid-right */}
          <SvgLinearGradient id="ribbonA" x1="0%" y1="0%" x2="100%" y2="60%">
            <Stop offset="0"   stopColor={CRIMSON} stopOpacity="0"    />
            <Stop offset="0.3" stopColor={SMOKED}  stopOpacity="0.30" />
            <Stop offset="0.6" stopColor={RUBY}    stopOpacity="0.18" />
            <Stop offset="1"   stopColor={CRIMSON} stopOpacity="0"    />
          </SvgLinearGradient>

          {/* Ribbon B — sweeps from lower-right to mid-left */}
          <SvgLinearGradient id="ribbonB" x1="100%" y1="100%" x2="0%" y2="40%">
            <Stop offset="0"   stopColor={CRIMSON} stopOpacity="0"    />
            <Stop offset="0.25" stopColor={RUBY}   stopOpacity="0.22" />
            <Stop offset="0.65" stopColor={SMOKED} stopOpacity="0.28" />
            <Stop offset="1"   stopColor={CRIMSON} stopOpacity="0"    />
          </SvgLinearGradient>

          {/* Ribbon C — central horizontal sweep */}
          <SvgLinearGradient id="ribbonC" x1="0%" y1="50%" x2="100%" y2="50%">
            <Stop offset="0"   stopColor={RUBY}    stopOpacity="0"    />
            <Stop offset="0.2" stopColor={RUBY}    stopOpacity="0.18" />
            <Stop offset="0.5" stopColor={SMOKED}  stopOpacity="0.12" />
            <Stop offset="0.8" stopColor={RUBY}    stopOpacity="0.18" />
            <Stop offset="1"   stopColor={RUBY}    stopOpacity="0"    />
          </SvgLinearGradient>

          {/* Ribbon D — upper-right accent */}
          <SvgLinearGradient id="ribbonD" x1="100%" y1="0%" x2="20%" y2="80%">
            <Stop offset="0"   stopColor={CRIMSON} stopOpacity="0"    />
            <Stop offset="0.3" stopColor={CRIMSON} stopOpacity="0.20" />
            <Stop offset="0.7" stopColor={RUBY}    stopOpacity="0.12" />
            <Stop offset="1"   stopColor={RUBY}    stopOpacity="0"    />
          </SvgLinearGradient>

          {/* Ellipse glow fill */}
          <RadialGradient id="ellipseGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0"   stopColor={CRIMSON} stopOpacity="0.12" />
            <Stop offset="0.5" stopColor={RUBY}    stopOpacity="0.05" />
            <Stop offset="1"   stopColor={RUBY}    stopOpacity="0"    />
          </RadialGradient>
        </Defs>

        {/* ── Ambient glow blooms ──────────────────────────────────────────── */}
        <Rect x={0} y={0} width={VW} height={VH} fill="url(#cnGlowTop)" />
        <Rect x={0} y={0} width={VW} height={VH} fill="url(#cnGlowBR)"  />
        <Rect x={0} y={0} width={VW} height={VH} fill="url(#cnGlowMid)" />

        {/* ────────────────────────────────────────────────────────────────────
            RIBBON A — main sweeping form, upper-left to lower-right
            A thick bezier ribbon: constructed from a closed filled path
            so it can carry a gradient fill
         ──────────────────────────────────────────────────────────────────── */}
        <Path
          d={`
            M ${VW * -0.10} ${VH * 0.18}
            C ${VW * 0.25} ${VH * 0.08},
              ${VW * 0.65} ${VH * 0.35},
              ${VW * 1.10} ${VH * 0.55}
            C ${VW * 1.10} ${VH * 0.55},
              ${VW * 1.10} ${VH * 0.75},
              ${VW * 1.10} ${VH * 0.75}
            C ${VW * 0.75} ${VH * 0.55},
              ${VW * 0.30} ${VH * 0.35},
              ${VW * -0.10} ${VH * 0.45}
            Z
          `}
          fill="url(#ribbonA)"
        />

        {/* ────────────────────────────────────────────────────────────────────
            RIBBON B — sweeping form from lower-right to upper-left
         ──────────────────────────────────────────────────────────────────── */}
        <Path
          d={`
            M ${VW * 1.12} ${VH * 0.62}
            C ${VW * 0.80} ${VH * 0.50},
              ${VW * 0.45} ${VH * 0.72},
              ${VW * -0.10} ${VH * 0.60}
            C ${VW * -0.10} ${VH * 0.60},
              ${VW * -0.10} ${VH * 0.82},
              ${VW * -0.10} ${VH * 0.82}
            C ${VW * 0.40} ${VH * 0.90},
              ${VW * 0.75} ${VH * 0.70},
              ${VW * 1.12} ${VH * 0.85}
            Z
          `}
          fill="url(#ribbonB)"
        />

        {/* ────────────────────────────────────────────────────────────────────
            RIBBON C — shallow horizontal ribbon across the middle
         ──────────────────────────────────────────────────────────────────── */}
        <Path
          d={`
            M ${VW * -0.05} ${VH * 0.43}
            C ${VW * 0.30} ${VH * 0.38},
              ${VW * 0.65} ${VH * 0.48},
              ${VW * 1.05} ${VH * 0.42}
            C ${VW * 1.05} ${VH * 0.52},
              ${VW * 0.70} ${VH * 0.58},
              ${VW * -0.05} ${VH * 0.53}
            Z
          `}
          fill="url(#ribbonC)"
        />

        {/* ────────────────────────────────────────────────────────────────────
            RIBBON D — upper-right accent ribbon, thinner
         ──────────────────────────────────────────────────────────────────── */}
        <Path
          d={`
            M ${VW * 1.08} ${VH * -0.02}
            C ${VW * 0.75} ${VH * 0.15},
              ${VW * 0.55} ${VH * 0.30},
              ${VW * 0.20} ${VH * 0.48}
            C ${VW * 0.22} ${VH * 0.54},
              ${VW * 0.30} ${VH * 0.52},
              ${VW * 0.35} ${VH * 0.50}
            C ${VW * 0.62} ${VH * 0.34},
              ${VW * 0.80} ${VH * 0.18},
              ${VW * 1.08} ${VH * 0.10}
            Z
          `}
          fill="url(#ribbonD)"
        />

        {/* ── Large translucent ellipses — depth layers ─────────────────────── */}
        {/* Central depth ellipse */}
        <Ellipse
          cx={VW * 0.50} cy={VH * 0.45}
          rx={VW * 0.65} ry={VH * 0.30}
          fill="url(#ellipseGlow)"
        />

        {/* Rotated ellipse — upper-left atmospheric bloom */}
        <Ellipse
          cx={VW * 0.10} cy={VH * 0.22}
          rx={VW * 0.60} ry={VH * 0.18}
          fill={RUBY} fillOpacity={0.06}
          transform={`rotate(-28, ${VW * 0.10}, ${VH * 0.22})`}
        />

        {/* Rotated ellipse — lower-right atmospheric bloom */}
        <Ellipse
          cx={VW * 0.92} cy={VH * 0.80}
          rx={VW * 0.55} ry={VH * 0.16}
          fill={CRIMSON} fillOpacity={0.05}
          transform={`rotate(22, ${VW * 0.92}, ${VH * 0.80})`}
        />

        {/* ── Fine ribbon highlight lines — silk sheen ─────────────────────── */}
        {/* Top ribbon highlight */}
        <Path
          d={`
            M ${VW * -0.05} ${VH * 0.19}
            C ${VW * 0.28} ${VH * 0.09},
              ${VW * 0.62} ${VH * 0.36},
              ${VW * 1.05} ${VH * 0.56}
          `}
          fill="none"
          stroke={RUBY} strokeWidth={0.8} strokeOpacity={0.20}
        />
        {/* Bottom ribbon highlight */}
        <Path
          d={`
            M ${VW * 1.05} ${VH * 0.63}
            C ${VW * 0.72} ${VH * 0.51},
              ${VW * 0.42} ${VH * 0.73},
              ${VW * -0.05} ${VH * 0.61}
          `}
          fill="none"
          stroke={CRIMSON} strokeWidth={0.6} strokeOpacity={0.18}
        />

        {/* ── Subtle top/bottom vignette ───────────────────────────────────── */}
        <Rect x={0} y={0}          width={VW} height={VH * 0.14} fill="rgba(5,0,2,0.58)" />
        <Rect x={0} y={VH * 0.86}  width={VW} height={VH * 0.14} fill="rgba(5,0,2,0.52)" />
      </Svg>
    </View>
  );
}
