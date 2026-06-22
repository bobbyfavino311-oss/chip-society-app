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

// Use actual screen dimensions so the background is always full-bleed
const { width: SW, height: SH } = Dimensions.get('screen');
// Viewbox is based on screen size — no fixed 390/844
const VW = SW;
const VH = SH;

// Palette
const CYAN  = '#00D9FF';
const ICE   = '#8FEFFF';
const WHITE = '#F5FCFF';

export default function FrozenNeonBackground() {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">

      {/* ── Layer 1: Base navy-to-black gradient, full screen ───────────────── */}
      <LinearGradient
        colors={['#0B1A2E', '#06101E', '#030A14', '#040E1A', '#0B1A2E']}
        locations={[0, 0.2, 0.5, 0.8, 1]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* ── Layer 2: Diagonal depth tint — makes center slightly lighter ──── */}
      <LinearGradient
        colors={['transparent', 'rgba(0,80,120,0.10)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* ── Layer 3: SVG atmospheric elements — full 100% width/height ──────── */}
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${VW} ${VH}`}
        style={StyleSheet.absoluteFillObject}
        preserveAspectRatio="xMidYMid slice"
      >
        <Defs>
          {/* ── Ambient glow fills ── */}
          <RadialGradient id="glowTop" cx="50%" cy="5%" r="65%">
            <Stop offset="0"   stopColor={CYAN}  stopOpacity="0.20" />
            <Stop offset="0.5" stopColor={CYAN}  stopOpacity="0.06" />
            <Stop offset="1"   stopColor={CYAN}  stopOpacity="0"    />
          </RadialGradient>

          <RadialGradient id="glowMid" cx="50%" cy="50%" r="55%">
            <Stop offset="0"   stopColor={CYAN}  stopOpacity="0.09" />
            <Stop offset="1"   stopColor={CYAN}  stopOpacity="0"    />
          </RadialGradient>

          <RadialGradient id="glowBL" cx="0%" cy="100%" r="60%">
            <Stop offset="0"   stopColor={CYAN}  stopOpacity="0.16" />
            <Stop offset="1"   stopColor={CYAN}  stopOpacity="0"    />
          </RadialGradient>

          <RadialGradient id="glowTR" cx="100%" cy="0%" r="55%">
            <Stop offset="0"   stopColor={ICE}   stopOpacity="0.13" />
            <Stop offset="1"   stopColor={ICE}   stopOpacity="0"    />
          </RadialGradient>

          {/* ── Frosted glass disk fills ── */}
          {/* Bright disk — used for near-foreground circles */}
          <RadialGradient id="diskA" cx="50%" cy="35%" r="50%">
            <Stop offset="0"   stopColor={ICE}   stopOpacity="0.10" />
            <Stop offset="0.5" stopColor={CYAN}  stopOpacity="0.05" />
            <Stop offset="1"   stopColor={CYAN}  stopOpacity="0"    />
          </RadialGradient>

          {/* Softer disk — mid-ground circles */}
          <RadialGradient id="diskB" cx="50%" cy="40%" r="50%">
            <Stop offset="0"   stopColor={ICE}   stopOpacity="0.07" />
            <Stop offset="0.6" stopColor={CYAN}  stopOpacity="0.03" />
            <Stop offset="1"   stopColor={CYAN}  stopOpacity="0"    />
          </RadialGradient>

          {/* Very faint disk — deep-background circles */}
          <RadialGradient id="diskC" cx="50%" cy="50%" r="50%">
            <Stop offset="0"   stopColor={CYAN}  stopOpacity="0.05" />
            <Stop offset="1"   stopColor={CYAN}  stopOpacity="0"    />
          </RadialGradient>

          {/* Ellipse sheen — top-arc frosted highlight */}
          <RadialGradient id="sheen" cx="50%" cy="15%" r="50%">
            <Stop offset="0"   stopColor={WHITE} stopOpacity="0.06" />
            <Stop offset="1"   stopColor={WHITE} stopOpacity="0"    />
          </RadialGradient>
        </Defs>

        {/* ── Ambient glow rectangles ──────────────────────────────────────── */}
        <Rect x={0} y={0} width={VW} height={VH} fill="url(#glowTop)" />
        <Rect x={0} y={0} width={VW} height={VH} fill="url(#glowMid)" />
        <Rect x={0} y={0} width={VW} height={VH} fill="url(#glowBL)"  />
        <Rect x={0} y={0} width={VW} height={VH} fill="url(#glowTR)"  />

        {/* ────────────────────────────────────────────────────────────────────
            FROSTED GLASS CIRCLES
            These are deliberately oversized and placed partly off-screen so
            there is never a visible boundary. They overlap and fade softly.
         ──────────────────────────────────────────────────────────────────── */}

        {/* Giant top-left hemisphere — bleeds off top-left corner */}
        <Circle
          cx={VW * -0.05} cy={VH * 0.10}
          r={VW * 0.75}
          fill="url(#diskB)"
          stroke={CYAN} strokeWidth={0.5} strokeOpacity={0.10}
        />

        {/* Giant right hemisphere — bleeds off right edge */}
        <Circle
          cx={VW * 1.05} cy={VH * 0.38}
          r={VW * 0.80}
          fill="url(#diskC)"
          stroke={ICE} strokeWidth={0.4} strokeOpacity={0.07}
        />

        {/* Large center-top glass disk */}
        <Circle
          cx={VW * 0.50} cy={VH * 0.08}
          r={VW * 0.62}
          fill="url(#diskA)"
          stroke={CYAN} strokeWidth={0.6} strokeOpacity={0.12}
        />

        {/* Medium left-center disk */}
        <Circle
          cx={VW * 0.12} cy={VH * 0.52}
          r={VW * 0.52}
          fill="url(#diskB)"
          stroke={ICE} strokeWidth={0.3} strokeOpacity={0.07}
        />

        {/* Large bottom-right hemisphere — bleeds off bottom-right */}
        <Circle
          cx={VW * 1.02} cy={VH * 0.88}
          r={VW * 0.70}
          fill="url(#diskA)"
          stroke={CYAN} strokeWidth={0.5} strokeOpacity={0.10}
        />

        {/* Deep center disk — thin ring only, creates depth layer */}
        <Circle
          cx={VW * 0.50} cy={VH * 0.50}
          r={VW * 0.44}
          fill="url(#diskC)"
          stroke={CYAN} strokeWidth={0.35} strokeOpacity={0.06}
        />

        {/* Bottom-center smaller disk */}
        <Circle
          cx={VW * 0.48} cy={VH * 0.90}
          r={VW * 0.42}
          fill="url(#diskB)"
          stroke={ICE} strokeWidth={0.3} strokeOpacity={0.06}
        />

        {/* Faint outer ring — center — creates depth ripple */}
        <Circle
          cx={VW * 0.50} cy={VH * 0.50}
          r={VW * 0.70}
          fill="none"
          stroke={CYAN} strokeWidth={0.4} strokeOpacity={0.04}
        />
        <Circle
          cx={VW * 0.50} cy={VH * 0.50}
          r={VW * 0.90}
          fill="none"
          stroke={ICE}  strokeWidth={0.3} strokeOpacity={0.03}
        />

        {/* ── Frosted glass sheen — subtle top highlight arc ───────────────── */}
        <Ellipse
          cx={VW * 0.50} cy={VH * 0.05}
          rx={VW * 0.55} ry={VH * 0.22}
          fill="url(#sheen)"
        />

        {/* ── Top & bottom vignettes — keep UI readable ───────────────────── */}
        <Rect x={0} y={0}          width={VW} height={VH * 0.12} fill="rgba(3,8,16,0.50)" />
        <Rect x={0} y={VH * 0.88}  width={VW} height={VH * 0.12} fill="rgba(3,8,16,0.45)" />
      </Svg>
    </View>
  );
}
