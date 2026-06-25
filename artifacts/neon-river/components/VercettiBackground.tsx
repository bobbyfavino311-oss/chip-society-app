/**
 * VercettiBackground — Premium minimalist teal casino felt
 * Pure SVG + LinearGradient. No PNG, no photographs.
 * Atmosphere only — never competes with the cards.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Circle, Defs, Ellipse, Path, RadialGradient,
  Rect, Stop,
} from 'react-native-svg';

// ─── Colour tokens ─────────────────────────────────────────────────────────────
const TEAL_DEEP   = '#002830';
const TEAL_MID    = '#003540';
const TEAL_DARK   = '#001E2A';
const CYAN_SOFT   = '#00C8C0';
const PINK_NEON   = '#FF6EA0';
const PURPLE_SOFT = '#A040C8';

export default function VercettiBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* ── Base felt gradient ─────────────────────────────────────────── */}
      <LinearGradient
        colors={[TEAL_MID, TEAL_DEEP, TEAL_DARK, TEAL_MID, TEAL_DEEP]}
        locations={[0, 0.28, 0.5, 0.72, 1]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />

      {/* ── Subtle vector felt pattern ─────────────────────────────────── */}
      <Svg
        style={StyleSheet.absoluteFill}
        viewBox="0 0 390 844"
        preserveAspectRatio="xMidYMid slice"
      >
        <Defs>
          {/* Pink bloom — top-right */}
          <RadialGradient id="gPink" cx="80%" cy="12%" r="42%">
            <Stop offset="0%"   stopColor={PINK_NEON}   stopOpacity={0.10} />
            <Stop offset="100%" stopColor={PINK_NEON}   stopOpacity={0}    />
          </RadialGradient>
          {/* Cyan bloom — bottom-left */}
          <RadialGradient id="gCyan" cx="18%" cy="82%" r="48%">
            <Stop offset="0%"   stopColor={CYAN_SOFT}   stopOpacity={0.09} />
            <Stop offset="100%" stopColor={CYAN_SOFT}   stopOpacity={0}    />
          </RadialGradient>
          {/* Purple bloom — center */}
          <RadialGradient id="gPurple" cx="50%" cy="50%" r="35%">
            <Stop offset="0%"   stopColor={PURPLE_SOFT} stopOpacity={0.05} />
            <Stop offset="100%" stopColor={PURPLE_SOFT} stopOpacity={0}    />
          </RadialGradient>
          {/* Cyan bloom — top-left */}
          <RadialGradient id="gCyan2" cx="12%" cy="20%" r="36%">
            <Stop offset="0%"   stopColor={CYAN_SOFT}   stopOpacity={0.07} />
            <Stop offset="100%" stopColor={CYAN_SOFT}   stopOpacity={0}    />
          </RadialGradient>
        </Defs>

        {/* Bloom layers */}
        <Rect x={0} y={0} width={390} height={844} fill="url(#gPink)"   />
        <Rect x={0} y={0} width={390} height={844} fill="url(#gCyan)"   />
        <Rect x={0} y={0} width={390} height={844} fill="url(#gPurple)" />
        <Rect x={0} y={0} width={390} height={844} fill="url(#gCyan2)"  />

        {/* ── Large sweeping arcs — barely visible felt weave ────────── */}
        {/* Arc 1 — top-right quadrant */}
        <Path
          d="M 460 -60 Q 200 200, -80 320"
          fill="none" stroke={CYAN_SOFT} strokeWidth={80}
          strokeOpacity={0.028} strokeLinecap="round"
        />
        {/* Arc 2 — left edge sweep */}
        <Path
          d="M -40 100 Q 130 420, -20 750"
          fill="none" stroke={CYAN_SOFT} strokeWidth={60}
          strokeOpacity={0.024} strokeLinecap="round"
        />
        {/* Arc 3 — bottom sweep */}
        <Path
          d="M -60 900 Q 200 640, 480 780"
          fill="none" stroke={CYAN_SOFT} strokeWidth={70}
          strokeOpacity={0.022} strokeLinecap="round"
        />
        {/* Arc 4 — diagonal center */}
        <Path
          d="M 420 -20 Q 180 380, 420 800"
          fill="none" stroke={PINK_NEON} strokeWidth={50}
          strokeOpacity={0.018} strokeLinecap="round"
        />
        {/* Arc 5 — counter-diagonal */}
        <Path
          d="M -30 -20 Q 210 400, -30 860"
          fill="none" stroke={PINK_NEON} strokeWidth={40}
          strokeOpacity={0.016} strokeLinecap="round"
        />

        {/* ── Diagonal geometric waves ────────────────────────────────── */}
        {[0, 1, 2, 3, 4, 5].map(i => (
          <Path
            key={`wave-${i}`}
            d={`M ${-60 + i * 90} -20 Q ${40 + i * 70} 422, ${-80 + i * 95} 864`}
            fill="none" stroke={CYAN_SOFT} strokeWidth={1.2}
            strokeOpacity={0.055 - i * 0.006} strokeLinecap="round"
          />
        ))}

        {/* ── Large geometric circles — minimal Art Deco ──────────────── */}
        <Circle cx={195} cy={422} r={260} fill="none"
          stroke={CYAN_SOFT} strokeWidth={1} strokeOpacity={0.045} />
        <Circle cx={195} cy={422} r={185} fill="none"
          stroke={CYAN_SOFT} strokeWidth={0.7} strokeOpacity={0.035} />
        <Circle cx={195} cy={422} r={110} fill="none"
          stroke={PINK_NEON} strokeWidth={0.6} strokeOpacity={0.040} />

        {/* Top corner ring */}
        <Circle cx={390} cy={0} r={140} fill="none"
          stroke={PINK_NEON} strokeWidth={0.8} strokeOpacity={0.055} />
        <Circle cx={390} cy={0} r={220} fill="none"
          stroke={CYAN_SOFT} strokeWidth={0.6} strokeOpacity={0.035} />

        {/* Bottom corner ring */}
        <Circle cx={0} cy={844} r={160} fill="none"
          stroke={CYAN_SOFT} strokeWidth={0.8} strokeOpacity={0.050} />
        <Circle cx={0} cy={844} r={250} fill="none"
          stroke={CYAN_SOFT} strokeWidth={0.5} strokeOpacity={0.030} />

        {/* ── Minimal palm-frond silhouettes — barely visible ─────────── */}
        {/* Frond cluster — bottom-right corner */}
        <Path
          d="M 370 844 Q 280 700 180 640"
          fill="none" stroke={CYAN_SOFT} strokeWidth={18}
          strokeOpacity={0.020} strokeLinecap="round"
        />
        <Path
          d="M 390 780 Q 300 680 240 580"
          fill="none" stroke={CYAN_SOFT} strokeWidth={14}
          strokeOpacity={0.016} strokeLinecap="round"
        />
        <Path
          d="M 390 860 Q 340 740 320 620"
          fill="none" stroke={CYAN_SOFT} strokeWidth={10}
          strokeOpacity={0.014} strokeLinecap="round"
        />

        {/* Frond cluster — top-left corner */}
        <Path
          d="M 0 0 Q 80 130 170 160"
          fill="none" stroke={CYAN_SOFT} strokeWidth={16}
          strokeOpacity={0.018} strokeLinecap="round"
        />
        <Path
          d="M -10 60 Q 60 160 130 210"
          fill="none" stroke={CYAN_SOFT} strokeWidth={12}
          strokeOpacity={0.015} strokeLinecap="round"
        />

        {/* ── Elliptical center table highlight ──────────────────────── */}
        <Ellipse cx={195} cy={422} rx={280} ry={130} fill="none"
          stroke={CYAN_SOFT} strokeWidth={0.6} strokeOpacity={0.030}
          strokeDasharray="6,8"
        />

        {/* ── Horizontal neon horizon lines ──────────────────────────── */}
        <Path d="M 30 280 L 360 280" stroke={PINK_NEON}
          strokeWidth={0.5} strokeOpacity={0.055} />
        <Path d="M 30 564 L 360 564" stroke={PINK_NEON}
          strokeWidth={0.5} strokeOpacity={0.055} />
      </Svg>

      {/* ── Very subtle vignette darkening the very edges ─────────────── */}
      <LinearGradient
        colors={['rgba(0,20,26,0.55)', 'transparent', 'transparent', 'rgba(0,14,20,0.50)']}
        locations={[0, 0.25, 0.75, 1]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
    </View>
  );
}
