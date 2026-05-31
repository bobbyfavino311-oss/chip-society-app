// ─── NeonAvatar — 30 SVG neon symbol avatars ──────────────────────────────────
// Data-driven icons: path/circle specs rendered directly as native SVG primitives.
// No custom React component wrappers inside the Svg tree (react-native-svg iOS requirement).

import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, G, Text as SvgText } from 'react-native-svg';
import {
  getNeonAvatar,
  NEON_RARITY_BORDER,
  NEON_RARITY_COLORS,
} from '@/constants/neonAvatars';

export interface NeonAvatarProps {
  avatarId?: number;
  size?: number;
  isLocked?: boolean;
  isEquipped?: boolean;
  style?: object;
}

// ─── Icon data ─────────────────────────────────────────────────────────────────
// Each entry is an array of draw operations. Rendered with double-pass (glow + core).
// t:'p' = Path, t:'c' = Circle, t:'txt' = Text (special case, rendered once)
type PathOp  = { t: 'p';   d: string; sw?: number; fill?: boolean };
type CircOp  = { t: 'c';   cx: number; cy: number; r: number; sw?: number; fill?: boolean };
type TextOp  = { t: 'txt'; x: number; y: number; text: string; size: number };
type Op = PathOp | CircOp | TextOp;

const I: Record<number, Op[]> = {
  // ── 1  MARTINI — V INSIGNIA ───────────────────────────────────────────────────
  // Bold V-shape emblem. Cocktail culture encoded as pure geometry.
  1: [
    { t: 'p', d: 'M14,14 L50,84 L86,14', sw: 6 },
    { t: 'c', cx: 74, cy: 22, r: 5.5, sw: 3, fill: true },
  ],

  // ── 2  LIGHTNING — RANK RUNE ──────────────────────────────────────────────────
  // Single angular Z-stroke. Aggressive. Reads like an elite rank emblem.
  2: [
    { t: 'p', d: 'M66,8 L32,50 L58,50 L24,92', sw: 6 },
  ],

  // ── 3  POKER CHIP — CASINO CREST ─────────────────────────────────────────────
  // Championship ring: outer + inner ring, 4 cardinal marks, center jewel.
  3: [
    { t: 'c', cx: 50, cy: 50, r: 38, sw: 5 },
    { t: 'p', d: 'M50,12 V24', sw: 5 },
    { t: 'p', d: 'M50,76 V88', sw: 5 },
    { t: 'p', d: 'M12,50 H24', sw: 5 },
    { t: 'p', d: 'M76,50 H88', sw: 5 },
    { t: 'c', cx: 50, cy: 50, r: 14, sw: 4 },
    { t: 'c', cx: 50, cy: 50, r: 4,  sw: 3, fill: true },
  ],

  // ── 4  ACE CARD — DIAMOND MONOGRAM ───────────────────────────────────────────
  // Bold diamond + horizontal bar. Casino brand mark, not a playing card.
  4: [
    { t: 'p', d: 'M50,8 L86,50 L50,92 L14,50 Z', sw: 5.5 },
    { t: 'p', d: 'M28,50 H72', sw: 5 },
  ],

  // ── 5  DICE — DOUBLE DIAMOND ──────────────────────────────────────────────────
  // Two stacked rotated squares. Abstract luck geometry.
  5: [
    { t: 'p', d: 'M50,8 L78,36 L50,64 L22,36 Z', sw: 5 },
    { t: 'p', d: 'M50,36 L78,64 L50,92 L22,64 Z', sw: 5 },
    { t: 'c', cx: 50, cy: 36, r: 4, sw: 3, fill: true },
    { t: 'c', cx: 50, cy: 64, r: 4, sw: 3, fill: true },
  ],

  // ── 6  MOON PHASE — BOLD CRESCENT ────────────────────────────────────────────
  // Filled crescent arc. Mysterious. Reads like a premium brand mark.
  6: [
    { t: 'p', d: 'M30,12 C62,12 80,28 80,50 C80,72 62,88 30,88 C48,80 62,66 62,50 C62,34 48,20 30,12 Z', sw: 4.5, fill: true },
    { t: 'c', cx: 72, cy: 28, r: 4.5, sw: 3, fill: true },
    { t: 'c', cx: 82, cy: 46, r: 3.5, sw: 2.5, fill: true },
  ],

  // ── 7  FIRE — TRIPLE FLAME CREST ─────────────────────────────────────────────
  // Three angular spikes from a base line. Sharp crest, not cartoon flame.
  7: [
    { t: 'p', d: 'M14,82 H86', sw: 5 },
    { t: 'p', d: 'M50,82 L50,18', sw: 6 },
    { t: 'p', d: 'M22,82 L38,34', sw: 5 },
    { t: 'p', d: 'M78,82 L62,34', sw: 5 },
  ],

  // ── 8  CROWN — SKYLINE INSIGNIA ───────────────────────────────────────────────
  // Five vertical spikes of different heights from a base line.
  // Reads as a crown at any size. Architectural. VIP.
  8: [
    { t: 'p', d: 'M10,80 H90', sw: 5.5 },
    { t: 'p', d: 'M20,80 V58', sw: 5 },
    { t: 'p', d: 'M35,80 V42', sw: 5 },
    { t: 'p', d: 'M50,80 V22', sw: 5 },
    { t: 'p', d: 'M65,80 V42', sw: 5 },
    { t: 'p', d: 'M80,80 V58', sw: 5 },
  ],

  // ── 9  NEON PALM — RADIANT ARCS ──────────────────────────────────────────────
  // Five elegant arcs fanning from a base point. Miami resort emblem.
  9: [
    { t: 'p', d: 'M50,78 C42,58 18,36 8,12',  sw: 4.5 },
    { t: 'p', d: 'M50,78 C48,56 28,28 22,8',  sw: 4.5 },
    { t: 'p', d: 'M50,78 C50,54 50,28 50,8',  sw: 5.5 },
    { t: 'p', d: 'M50,78 C52,56 72,28 78,8',  sw: 4.5 },
    { t: 'p', d: 'M50,78 C58,58 82,36 92,12', sw: 4.5 },
    { t: 'p', d: 'M32,90 C40,84 60,84 68,90', sw: 4 },
  ],

  // ── 10 CASSETTE — RETRO TECH EMBLEM ──────────────────────────────────────────
  // Bold rectangle frame + two reel circles + hub dots.
  10: [
    { t: 'p', d: 'M8,24 H92 V76 H8 Z', sw: 5 },
    { t: 'c', cx: 32, cy: 50, r: 14, sw: 4.5 },
    { t: 'c', cx: 68, cy: 50, r: 14, sw: 4.5 },
    { t: 'c', cx: 32, cy: 50, r: 5,  sw: 3.5, fill: true },
    { t: 'c', cx: 68, cy: 50, r: 5,  sw: 3.5, fill: true },
  ],

  // ── 11 FLAMINGO — S-CURVE MARK ───────────────────────────────────────────────
  // Single bold S-curve. Abstract bird. Pure elegant line.
  11: [
    { t: 'p', d: 'M55,88 C55,70 72,62 74,48 C76,34 60,24 56,12 C54,6 58,2 62,4', sw: 6 },
    { t: 'p', d: 'M28,90 C36,82 55,82 55,88', sw: 4.5 },
    { t: 'c', cx: 62, cy: 4, r: 4, sw: 3, fill: true },
  ],

  // ── 12 CHAMPAGNE — CELEBRATION MARK ──────────────────────────────────────────
  // Flute silhouette + 3 bubble arcs. Luxury celebration crest.
  12: [
    { t: 'p', d: 'M38,88 H62', sw: 5 },
    { t: 'p', d: 'M42,88 C36,72 34,52 38,28 H62 C66,52 64,72 58,88', sw: 4.5 },
    { t: 'p', d: 'M62,28 C68,16 74,8 72,4', sw: 4 },
    { t: 'p', d: 'M62,28 C72,20 80,18 82,12', sw: 3.5 },
    { t: 'p', d: 'M62,28 C74,30 82,38 84,44', sw: 3.5 },
    { t: 'c', cx: 72, cy: 4,  r: 3.5, sw: 2.5, fill: true },
    { t: 'c', cx: 84, cy: 10, r: 3,   sw: 2.5, fill: true },
    { t: 'c', cx: 86, cy: 44, r: 3,   sw: 2.5, fill: true },
  ],

  // ── 13 SHARK FIN — CUT MARK ───────────────────────────────────────────────────
  // Bold angular fin silhouette above a clean horizon. Aggressive emblem.
  13: [
    { t: 'p', d: 'M12,68 C26,68 36,52 44,32 C48,20 52,10 56,8 C60,12 68,34 76,56 C80,66 86,68 88,68', sw: 5.5 },
    { t: 'p', d: 'M8,68 H92', sw: 5 },
  ],

  // ── 14 NEON ROSE — RADIAL MARK ───────────────────────────────────────────────
  // 8 bold radial strokes from center. Abstract bloom. Pure geometric identity.
  14: [
    { t: 'p', d: 'M50,14 V86', sw: 5 },
    { t: 'p', d: 'M14,50 H86', sw: 5 },
    { t: 'p', d: 'M22,22 L78,78', sw: 4.5 },
    { t: 'p', d: 'M78,22 L22,78', sw: 4.5 },
    { t: 'c', cx: 50, cy: 50, r: 10, sw: 4, fill: true },
  ],

  // ── 15 EIGHT BALL — TARGET MARK ───────────────────────────────────────────────
  // Large circle + filled center + 8 numeral. Bold, reads instantly.
  15: [
    { t: 'c', cx: 50, cy: 50, r: 38, sw: 5 },
    { t: 'c', cx: 50, cy: 50, r: 20, sw: 4, fill: true },
    { t: 'txt', x: 50, y: 57, text: '8', size: 22 },
  ],

  // ── 16 ANCHOR — MARITIME CREST ────────────────────────────────────────────────
  // Bold T-crossbar + vertical shaft + ring + curved arms. Iconic minimal.
  16: [
    { t: 'p', d: 'M28,22 H72', sw: 5.5 },
    { t: 'p', d: 'M50,22 V84', sw: 5.5 },
    { t: 'p', d: 'M20,84 C20,64 34,62 50,84 C66,62 80,64 80,84', sw: 5 },
    { t: 'c', cx: 50, cy: 30, r: 9,  sw: 4.5 },
  ],

  // ── 17 SUNSET GRID — RETRO PERSPECTIVE ───────────────────────────────────────
  // Vanishing point above horizon lines. Synthwave landscape compressed to a mark.
  17: [
    { t: 'p', d: 'M8,52 H92', sw: 5 },
    { t: 'p', d: 'M8,66 H92', sw: 3.5 },
    { t: 'p', d: 'M8,80 H92', sw: 3 },
    { t: 'p', d: 'M50,10 L8,52',  sw: 4 },
    { t: 'p', d: 'M50,10 L28,52', sw: 3.5 },
    { t: 'p', d: 'M50,10 L50,52', sw: 3.5 },
    { t: 'p', d: 'M50,10 L72,52', sw: 3.5 },
    { t: 'p', d: 'M50,10 L92,52', sw: 4 },
    { t: 'c', cx: 50, cy: 10, r: 5, sw: 3.5, fill: true },
  ],

  // ── 18 SNAKE — S-MARK ─────────────────────────────────────────────────────────
  // Bold S-curve + coiled tail. Sinuous threat. Pure abstract power.
  18: [
    { t: 'p', d: 'M26,86 C26,64 74,60 74,42 C74,24 26,20 26,8', sw: 6.5 },
    { t: 'c', cx: 26, cy: 86, r: 7, sw: 4.5 },
    { t: 'p', d: 'M18,6 C22,2 30,2 34,6', sw: 4 },
  ],

  // ── 19 KATANA — BLADE MARK ────────────────────────────────────────────────────
  // Long diagonal blade + short perpendicular guard. Weapon geometry, nothing more.
  19: [
    { t: 'p', d: 'M18,86 L82,14', sw: 5.5 },
    { t: 'p', d: 'M30,74 L50,56', sw: 9 },
    { t: 'c', cx: 82, cy: 14, r: 4.5, sw: 3.5, fill: true },
    { t: 'c', cx: 18, cy: 86, r: 4,   sw: 3, fill: true },
  ],

  // ── 20 SKULL — DEATH MARK ─────────────────────────────────────────────────────
  // Bold dome arch + two filled eye circles + jaw bar. Reads at any size.
  20: [
    { t: 'p', d: 'M18,56 C18,30 34,12 50,12 C66,12 82,30 82,56 C82,68 76,78 66,82 L66,90 H34 L34,82 C24,78 18,68 18,56 Z', sw: 5 },
    { t: 'c', cx: 36, cy: 50, r: 10, sw: 4, fill: true },
    { t: 'c', cx: 64, cy: 50, r: 10, sw: 4, fill: true },
    { t: 'p', d: 'M40,82 V90 M50,82 V90 M60,82 V90', sw: 4.5 },
  ],

  // ── 21 SATURN — PLANET RING ───────────────────────────────────────────────────
  // Bold planet circle + angled ring arc cutting through it. Space emblem.
  21: [
    { t: 'c', cx: 50, cy: 50, r: 24, sw: 5.5 },
    { t: 'p', d: 'M6,34 C20,18 80,80 94,64', sw: 5.5 },
  ],

  // ── 22 VINYL — GROOVE MARK ────────────────────────────────────────────────────
  // Three concentric rings + filled center dot. Music prestige emblem.
  22: [
    { t: 'c', cx: 50, cy: 50, r: 40, sw: 5 },
    { t: 'c', cx: 50, cy: 50, r: 26, sw: 4 },
    { t: 'c', cx: 50, cy: 50, r: 13, sw: 3.5 },
    { t: 'c', cx: 50, cy: 50, r: 5,  sw: 3.5, fill: true },
  ],

  // ── 23 SPORTS CAR — SPEED WEDGE ──────────────────────────────────────────────
  // Low horizontal wedge silhouette + two wheel circles. Racing insignia.
  23: [
    { t: 'p', d: 'M4,62 L22,36 L88,36 L96,62 Z', sw: 5 },
    { t: 'c', cx: 26, cy: 68, r: 13, sw: 5 },
    { t: 'c', cx: 74, cy: 68, r: 13, sw: 5 },
    { t: 'c', cx: 26, cy: 68, r: 5,  sw: 3.5, fill: true },
    { t: 'c', cx: 74, cy: 68, r: 5,  sw: 3.5, fill: true },
  ],

  // ── 24 SCORPION — STING MARK ──────────────────────────────────────────────────
  // Curved body + arched tail + stinger tip. Abstract threat crest.
  24: [
    { t: 'p', d: 'M18,72 C18,50 30,38 50,36 C70,34 82,46 82,58 C82,70 72,76 60,70', sw: 5 },
    { t: 'p', d: 'M60,70 C56,58 62,46 70,38 C76,32 78,22 72,12', sw: 4.5 },
    { t: 'p', d: 'M72,12 L68,20', sw: 5 },
    { t: 'c', cx: 50, cy: 36, r: 6.5, sw: 4, fill: true },
  ],

  // ── 25 DRAGON — WING MARK ─────────────────────────────────────────────────────
  // Two bold wing arcs sweeping down from a crown point. Power emblem.
  25: [
    { t: 'p', d: 'M50,18 L14,56 C8,70 14,82 28,80 C38,78 46,70 50,58', sw: 5.5 },
    { t: 'p', d: 'M50,18 L86,56 C92,70 86,82 72,80 C62,78 54,70 50,58', sw: 5.5 },
    { t: 'p', d: 'M50,18 V8', sw: 5 },
    { t: 'c', cx: 50, cy: 58, r: 6, sw: 4, fill: true },
    { t: 'c', cx: 50, cy: 8,  r: 5, sw: 3.5, fill: true },
  ],

  // ── 26 HOURGLASS — TIME MARK ──────────────────────────────────────────────────
  // Two bold triangles point-to-point. Clean. Geometric. Inevitable.
  26: [
    { t: 'p', d: 'M12,8 H88 L50,50 L88,92 H12 L50,50 Z', sw: 5.5 },
  ],

  // ── 27 STARBURST — PRESTIGE MARK ─────────────────────────────────────────────
  // Bold 8-point star + center jewel. Achievement emblem.
  27: [
    { t: 'p', d: 'M50,8 L58,38 L86,20 L68,46 L94,50 L68,54 L86,80 L58,62 L50,92 L42,62 L14,80 L32,54 L6,50 L32,46 L14,20 L42,38 Z', sw: 4.5 },
    { t: 'c', cx: 50, cy: 50, r: 9, sw: 4, fill: true },
  ],

  // ── 28 TIGER EYE — EYE MARK ───────────────────────────────────────────────────
  // Bold almond eye outline + filled vertical slit pupil. Predator emblem.
  28: [
    { t: 'p', d: 'M6,50 C20,20 80,20 94,50 C80,80 20,80 6,50 Z', sw: 5.5 },
    { t: 'p', d: 'M50,24 C54,34 54,66 50,76 C46,66 46,34 50,24 Z', sw: 5, fill: true },
  ],

  // ── 29 WOLF HEAD — PACK MARK ──────────────────────────────────────────────────
  // Bold angular head polygon + ear spikes + two filled eye circles.
  29: [
    { t: 'p', d: 'M50,10 L28,22 L18,54 L28,76 L50,88 L72,76 L82,54 L72,22 Z', sw: 5 },
    { t: 'p', d: 'M28,22 L16,4 L36,16',  sw: 5 },
    { t: 'p', d: 'M72,22 L84,4 L64,16',  sw: 5 },
    { t: 'c', cx: 37, cy: 48, r: 8, sw: 4, fill: true },
    { t: 'c', cx: 63, cy: 48, r: 8, sw: 4, fill: true },
  ],

  // ── 30 CHERRY — TWIN DOT MARK ─────────────────────────────────────────────────
  // Two bold filled circles + stems. Maximalist simplicity. Reads at 16px.
  30: [
    { t: 'c', cx: 32, cy: 66, r: 20, sw: 5, fill: true },
    { t: 'c', cx: 68, cy: 70, r: 20, sw: 5, fill: true },
    { t: 'p', d: 'M32,46 C34,28 48,18 52,8', sw: 4.5 },
    { t: 'p', d: 'M68,50 C66,32 58,20 52,8', sw: 4.5 },
    { t: 'p', d: 'M32,46 C42,40 58,42 68,50', sw: 4 },
  ],
};

// ─── Icon renderer ─────────────────────────────────────────────────────────────
// All elements are direct react-native-svg primitives — no custom component wrappers.
function NeonIcon({ id, color }: { id: number; color: string }) {
  const ops = I[id] ?? I[27];
  const nodes: React.ReactNode[] = [];

  ops.forEach((op, i) => {
    if (op.t === 'p') {
      const sw  = op.sw ?? 4;
      const f   = op.fill ? color : 'none';
      const fo1 = op.fill ? 0.18 : 0;
      const fo2 = op.fill ? 0.9  : 0;
      nodes.push(
        <Path key={`g${i}`} d={op.d}
          stroke={color} strokeWidth={sw * 2.6} strokeOpacity={0.35}
          fill={f} fillOpacity={fo1}
          strokeLinecap="round" strokeLinejoin="round" />,
        <Path key={`c${i}`} d={op.d}
          stroke={color} strokeWidth={sw} strokeOpacity={1}
          fill={f} fillOpacity={fo2}
          strokeLinecap="round" strokeLinejoin="round" />,
      );
    } else if (op.t === 'c') {
      const sw  = op.sw ?? 3.5;
      const f   = op.fill ? color : 'none';
      const fo1 = op.fill ? 0.2  : 0;
      const fo2 = op.fill ? 0.85 : 0;
      nodes.push(
        <Circle key={`g${i}`} cx={op.cx} cy={op.cy} r={op.r}
          stroke={color} strokeWidth={sw * 2.6} strokeOpacity={0.35}
          fill={f} fillOpacity={fo1} />,
        <Circle key={`c${i}`} cx={op.cx} cy={op.cy} r={op.r}
          stroke={color} strokeWidth={sw} strokeOpacity={1}
          fill={f} fillOpacity={fo2} />,
      );
    } else if (op.t === 'txt') {
      nodes.push(
        <SvgText key={`t${i}`}
          x={op.x} y={op.y} textAnchor="middle"
          fontSize={op.size} fontWeight="900"
          fill={color} fillOpacity={0.95}
          stroke={color} strokeWidth={0.5}
          fontFamily="serif">{op.text}</SvgText>,
      );
    }
  });

  return <G>{nodes}</G>;
}

// ─── Lock overlay ──────────────────────────────────────────────────────────────
function LockOverlay({ size, color, xpLabel }: { size: number; color: string; xpLabel?: string }) {
  const s = size * 0.32;
  return (
    <View style={[StyleSheet.absoluteFill, st.lockedOverlay]}>
      <Svg width={s} height={s * 1.2} viewBox="0 0 24 30">
        <Path
          d="M12,1 C8.7,1 6,3.7 6,7 L6,11 L4,11 C2.9,11 2,11.9 2,13 L2,27 C2,28.1 2.9,29 4,29 L20,29 C21.1,29 22,28.1 22,27 L22,13 C22,11.9 21.1,11 20,11 L18,11 L18,7 C18,3.7 15.3,1 12,1 Z M12,4 C13.7,4 15,5.3 15,7 L15,11 L9,11 L9,7 C9,5.3 10.3,4 12,4 Z"
          fill={color}
        />
      </Svg>
      {xpLabel ? (
        <Text style={[st.lockedXP, { fontSize: size * 0.09, color }]}>{xpLabel}</Text>
      ) : null}
    </View>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function NeonAvatar({
  avatarId = 1,
  size = 64,
  isLocked = false,
  isEquipped = false,
  style,
}: NeonAvatarProps) {
  const avatar       = getNeonAvatar(avatarId);
  const rarityColor  = NEON_RARITY_COLORS[avatar.rarity];
  const borderWidth  = NEON_RARITY_BORDER[avatar.rarity];
  const borderRadius = size * 0.22;

  const pulseAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (avatar.rarity === 'LEGENDARY') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1,   duration: 900, useNativeDriver: false }),
          Animated.timing(pulseAnim, { toValue: 0.6, duration: 900, useNativeDriver: false }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => { pulseAnim.stopAnimation(); };
  }, [avatar.rarity]);

  const glowOpacity = pulseAnim.interpolate({
    inputRange: [0.6, 1],
    outputRange: [
      0.25,
      avatar.rarity === 'LEGENDARY' ? 0.85
        : avatar.rarity === 'EPIC'  ? 0.55
        : 0.35,
    ],
  });

  const glowSize = size + 12;
  const inner    = size - borderWidth * 2;
  const xpLabel  = isLocked
    ? avatar.unlockXP >= 1000
      ? `${(avatar.unlockXP / 1000).toFixed(0)}K XP`
      : `${avatar.unlockXP} XP`
    : undefined;

  return (
    <View style={[{ width: size, height: size }, style]}>

      {/* Epic / Legendary outer glow halo */}
      {(avatar.rarity === 'LEGENDARY' || avatar.rarity === 'EPIC') && (
        <Animated.View
          style={{
            position: 'absolute',
            top:  -(glowSize - size) / 2,
            left: -(glowSize - size) / 2,
            width:  glowSize,
            height: glowSize,
            borderRadius: borderRadius + 6,
            backgroundColor: rarityColor,
            opacity: glowOpacity,
          }}
        />
      )}

      {/* Card */}
      <View style={{
        width: size, height: size,
        borderRadius, borderWidth,
        borderColor: isEquipped ? '#ffffff' : rarityColor,
        overflow: 'hidden',
        backgroundColor: '#050010',
      }}>

        {/* Background gradient */}
        <LinearGradient
          colors={[avatar.bgColor, '#050010']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />

        {/* Neon icon — absolutely positioned so it layers on top of gradient */}
        <Svg
          width={inner} height={inner}
          viewBox="0 0 100 100"
          style={{ position: 'absolute', top: 0, left: 0, opacity: isLocked ? 0.12 : 1 }}
        >
          <NeonIcon id={avatar.id} color={avatar.color} />
        </Svg>

        {/* Lock overlay */}
        {isLocked && (
          <LockOverlay size={size} color={rarityColor} xpLabel={size >= 56 ? xpLabel : undefined} />
        )}

        {/* Equipped dot */}
        {isEquipped && !isLocked && (
          <View style={[st.equippedDot, { borderColor: '#050010' }]} />
        )}
      </View>

    </View>
  );
}

const st = StyleSheet.create({
  lockedOverlay: {
    backgroundColor: 'rgba(5,0,16,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  lockedXP: {
    fontFamily: 'Orbitron_700Bold',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  equippedDot: {
    position: 'absolute',
    bottom: 5, right: 5,
    width: 8, height: 8,
    borderRadius: 4,
    backgroundColor: '#00ff88',
    borderWidth: 1.5,
  },
});
