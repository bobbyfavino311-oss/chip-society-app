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
  // ── 1  MARTINI GLASS — geometric luxury cocktail emblem ───────────────────────
  // Inverted V bowl · olive dot · vertical stem · horizontal base
  1: [
    { t: 'p', d: 'M16,18 L50,78 L84,18', sw: 4.5 },
    { t: 'p', d: 'M50,78 V90', sw: 4 },
    { t: 'p', d: 'M34,90 H66', sw: 3.5 },
    { t: 'c', cx: 72, cy: 26, r: 5.5, sw: 3, fill: true },
  ],
  // ── 2  LIGHTNING BOLT — angular rank rune ─────────────────────────────────────
  // Single angular rune stroke — not filled, pure neon line glyph
  2: [
    { t: 'p', d: 'M64,8 L34,50 L54,50 L30,92', sw: 5 },
  ],
  // ── 3  POKER CHIP — casino brand mark ────────────────────────────────────────
  // Outer ring · inner ring · 4 cardinal tick marks · center jewel
  3: [
    { t: 'c', cx: 50, cy: 50, r: 38, sw: 4 },
    { t: 'c', cx: 50, cy: 50, r: 22, sw: 3 },
    { t: 'p', d: 'M50,12 V22', sw: 4 },
    { t: 'p', d: 'M50,78 V88', sw: 4 },
    { t: 'p', d: 'M12,50 H22', sw: 4 },
    { t: 'p', d: 'M78,50 H88', sw: 4 },
    { t: 'c', cx: 50, cy: 50, r: 5, sw: 3, fill: true },
  ],
  // ── 4  ACE CARD ───────────────────────────────────────────────────────────────
  4: [
    { t: 'p', d: 'M24,10 Q24,8 26,8 L74,8 Q76,8 76,10 L76,90 Q76,92 74,92 L26,92 Q24,92 24,90 Z', sw: 3.5 },
    { t: 'txt', x: 50, y: 58, text: 'A', size: 38 },
  ],
  // ── 5  DICE STACK ─────────────────────────────────────────────────────────────
  5: [
    { t: 'p', d: 'M14,14 Q14,11 17,11 L57,11 Q60,11 60,14 L60,54 Q60,57 57,57 L17,57 Q14,57 14,54 Z', sw: 3.5 },
    { t: 'p', d: 'M40,40 Q40,37 43,37 L83,37 Q86,37 86,40 L86,80 Q86,83 83,83 L43,83 Q40,83 40,80 Z', sw: 3.5 },
    { t: 'c', cx: 24, cy: 34, r: 3.5, sw: 2, fill: true },
    { t: 'c', cx: 50, cy: 22, r: 3.5, sw: 2, fill: true },
    { t: 'c', cx: 56, cy: 70, r: 3.5, sw: 2, fill: true },
    { t: 'c', cx: 63, cy: 62, r: 3.5, sw: 2, fill: true },
    { t: 'c', cx: 70, cy: 54, r: 3.5, sw: 2, fill: true },
  ],
  // ── 6  MOON PHASE ─────────────────────────────────────────────────────────────
  6: [
    { t: 'p', d: 'M50,12 C76,12 88,28 88,50 C88,72 76,88 50,88 C62,80 70,66 70,50 C70,34 62,20 50,12 Z', sw: 4 },
    { t: 'c', cx: 72, cy: 26, r: 4, sw: 2.5, fill: true },
    { t: 'c', cx: 80, cy: 40, r: 3, sw: 2,   fill: true },
    { t: 'c', cx: 80, cy: 62, r: 3.5, sw: 2, fill: true },
  ],
  // ── 7  FIRE ───────────────────────────────────────────────────────────────────
  7: [
    { t: 'p', d: 'M50,88 C28,84 16,64 22,50 C18,60 26,54 28,46 C22,56 30,50 34,40 C28,30 40,18 50,10 C60,18 72,30 66,40 C70,50 78,56 72,46 C78,64 72,84 50,88 Z', sw: 3.5, fill: true },
    { t: 'p', d: 'M50,75 C38,72 32,60 36,52 C38,58 44,56 46,50 C50,58 54,62 50,75 Z', sw: 2.5, fill: true },
  ],
  // ── 8  CROWN — heraldic VIP insignia ─────────────────────────────────────────
  // 3 sharp angular spikes from a clean base line · architectural, not cartoonish
  8: [
    { t: 'p', d: 'M10,78 H90', sw: 4.5 },
    { t: 'p', d: 'M10,78 L28,46', sw: 4 },
    { t: 'p', d: 'M50,78 L50,20', sw: 4 },
    { t: 'p', d: 'M90,78 L72,46', sw: 4 },
    { t: 'p', d: 'M28,46 L40,60', sw: 3.5 },
    { t: 'p', d: 'M72,46 L60,60', sw: 3.5 },
  ],
  // ── 9  NEON PALM — Miami luxury silhouette ────────────────────────────────────
  // Curved trunk + 4 elegant frond arcs from crown point — neon sign minimal
  9: [
    { t: 'p', d: 'M50,92 C48,72 46,54 50,26', sw: 4 },
    { t: 'p', d: 'M50,26 C38,12 16,10 8,6',   sw: 3.5 },
    { t: 'p', d: 'M50,26 C62,12 84,10 92,6',   sw: 3.5 },
    { t: 'p', d: 'M50,38 C36,26 18,28 10,32',  sw: 3 },
    { t: 'p', d: 'M50,38 C64,26 82,28 90,32',  sw: 3 },
  ],
  // ── 10 CASSETTE ───────────────────────────────────────────────────────────────
  10: [
    { t: 'p', d: 'M11,25 Q9,25 9,27 L9,73 Q9,75 11,75 L89,75 Q91,75 91,73 L91,27 Q91,25 89,25 Z', sw: 3.5 },
    { t: 'c', cx: 34, cy: 51, r: 13, sw: 3 },
    { t: 'c', cx: 66, cy: 51, r: 13, sw: 3 },
    { t: 'c', cx: 34, cy: 51, r: 5,  sw: 2.5 },
    { t: 'c', cx: 66, cy: 51, r: 5,  sw: 2.5 },
    { t: 'p', d: 'M14,30 H86', sw: 2.5 },
    { t: 'p', d: 'M47,47 H53 L53,55 H47 Z', sw: 2 },
  ],
  // ── 11 FLAMINGO ───────────────────────────────────────────────────────────────
  11: [
    { t: 'p', d: 'M50,14 C58,14 65,20 65,30 C65,42 55,48 50,56 C45,48 35,42 35,30 C35,20 42,14 50,14 Z', sw: 3.5 },
    { t: 'p', d: 'M50,56 C52,68 60,76 55,88', sw: 3 },
    { t: 'p', d: 'M50,56 C48,68 40,76 45,88', sw: 3 },
    { t: 'p', d: 'M45,88 H55', sw: 2.5 },
    { t: 'c', cx: 50, cy: 30, r: 8, sw: 3 },
  ],
  // ── 12 CHAMPAGNE ──────────────────────────────────────────────────────────────
  12: [
    { t: 'p', d: 'M38,88 H62 M50,88 V60 M32,60 H68 M38,60 C30,40 28,24 32,10 M62,60 C70,40 72,24 68,10 M32,10 H68', sw: 3 },
    { t: 'c', cx: 60, cy: 22, r: 5, sw: 2.5, fill: true },
    { t: 'c', cx: 65, cy: 34, r: 4, sw: 2,   fill: true },
    { t: 'c', cx: 55, cy: 14, r: 3, sw: 2,   fill: true },
  ],
  // ── 13 SHARK FIN ──────────────────────────────────────────────────────────────
  13: [
    { t: 'p', d: 'M8,72 C20,72 30,60 38,40 C44,24 48,14 52,10 C56,14 62,28 68,50 C72,64 78,72 92,72', sw: 4 },
    { t: 'p', d: 'M8,72 H92', sw: 3 },
    { t: 'p', d: 'M8,78 H92', sw: 2.5 },
    { t: 'p', d: 'M8,84 H92', sw: 2 },
  ],
  // ── 14 NEON ROSE ──────────────────────────────────────────────────────────────
  14: [
    { t: 'p', d: 'M50,50 C50,50 38,44 32,34 C26,24 30,10 42,12 C46,14 48,18 50,24 C52,18 54,14 58,12 C70,10 74,24 68,34 C62,44 50,50 50,50 Z', sw: 3, fill: true },
    { t: 'p', d: 'M50,50 C50,50 36,56 28,66 C20,76 22,90 34,88 C40,86 44,82 46,76 M50,50 C50,50 64,56 72,66 C80,76 78,90 66,88 C60,86 56,82 54,76', sw: 3, fill: true },
    { t: 'p', d: 'M50,50 V90', sw: 2.5 },
    { t: 'p', d: 'M44,70 C40,68 36,70 34,72', sw: 2 },
    { t: 'p', d: 'M56,70 C60,68 64,70 66,72', sw: 2 },
  ],
  // ── 15 EIGHT BALL ─────────────────────────────────────────────────────────────
  15: [
    { t: 'c', cx: 50, cy: 50, r: 40, sw: 3.5 },
    { t: 'c', cx: 50, cy: 50, r: 18, sw: 2.5 },
    { t: 'txt', x: 50, y: 58, text: '8', size: 22 },
  ],
  // ── 16 ANCHOR ─────────────────────────────────────────────────────────────────
  16: [
    { t: 'c', cx: 50, cy: 22, r: 10, sw: 3 },
    { t: 'p', d: 'M50,32 V82', sw: 3.5 },
    { t: 'p', d: 'M30,50 H70', sw: 3 },
    { t: 'p', d: 'M22,82 C22,68 36,68 50,82 C64,68 78,68 78,82', sw: 3 },
  ],
  // ── 17 SUNSET GRID ────────────────────────────────────────────────────────────
  17: [
    { t: 'p', d: 'M8,55 H92', sw: 2.5 }, { t: 'p', d: 'M8,65 H92', sw: 2.5 },
    { t: 'p', d: 'M8,75 H92', sw: 2.5 }, { t: 'p', d: 'M8,85 H92', sw: 2.5 },
    { t: 'p', d: 'M20,55 L14,92', sw: 2 }, { t: 'p', d: 'M33,55 L27,92', sw: 2 },
    { t: 'p', d: 'M50,55 L50,92', sw: 2 }, { t: 'p', d: 'M67,55 L73,92', sw: 2 },
    { t: 'p', d: 'M80,55 L86,92', sw: 2 },
    { t: 'p', d: 'M50,8 C30,8 8,30 8,55 C22,45 38,40 50,40 C62,40 78,45 92,55 C92,30 70,8 50,8 Z', sw: 3.5, fill: true },
  ],
  // ── 18 SNAKE ──────────────────────────────────────────────────────────────────
  18: [
    { t: 'p', d: 'M50,10 C70,10 82,24 80,40 C78,56 60,60 50,70 C40,80 36,92 50,92 C64,92 72,82 72,72', sw: 3.5 },
    { t: 'p', d: 'M42,10 C42,14 46,16 50,16 C54,16 58,14 58,10', sw: 2.5 },
    { t: 'p', d: 'M44,8 L46,4 M56,8 L54,4', sw: 2.5 },
    { t: 'c', cx: 44, cy: 18, r: 2.5, sw: 2, fill: true },
    { t: 'c', cx: 56, cy: 18, r: 2.5, sw: 2, fill: true },
  ],
  // ── 19 KATANA ─────────────────────────────────────────────────────────────────
  19: [
    { t: 'p', d: 'M18,82 L78,22', sw: 4 },
    { t: 'p', d: 'M78,22 L82,14 L90,10 L86,18 L78,22 Z', sw: 3, fill: true },
    { t: 'p', d: 'M18,82 L12,86 L10,92 L16,90 L18,82 Z', sw: 2.5 },
    { t: 'p', d: 'M28,72 L34,66', sw: 5 },
    { t: 'p', d: 'M22,78 L28,72', sw: 2 },
  ],
  // ── 20 SKULL ──────────────────────────────────────────────────────────────────
  20: [
    { t: 'p', d: 'M20,54 C20,34 34,16 50,16 C66,16 80,34 80,54 C80,68 74,78 66,82 L66,90 H34 L34,82 C26,78 20,68 20,54 Z', sw: 3.5 },
    { t: 'c', cx: 37, cy: 50, r: 10, sw: 3 },
    { t: 'c', cx: 63, cy: 50, r: 10, sw: 3 },
    { t: 'p', d: 'M42,82 V90 M50,82 V90 M58,82 V90', sw: 2.5 },
    { t: 'p', d: 'M40,68 C42,72 46,74 50,74 C54,74 58,72 60,68', sw: 2.5 },
  ],
  // ── 21 SATURN ─────────────────────────────────────────────────────────────────
  21: [
    { t: 'c', cx: 50, cy: 50, r: 22, sw: 3.5 },
    { t: 'p', d: 'M10,32 C18,16 82,84 90,68', sw: 3.5 },
    { t: 'c', cx: 50, cy: 50, r: 6,  sw: 2.5 },
  ],
  // ── 22 VINYL RECORD ───────────────────────────────────────────────────────────
  22: [
    { t: 'c', cx: 50, cy: 50, r: 40, sw: 3.5 },
    { t: 'c', cx: 50, cy: 50, r: 30, sw: 2 },
    { t: 'c', cx: 50, cy: 50, r: 20, sw: 2 },
    { t: 'c', cx: 50, cy: 50, r: 10, sw: 2 },
    { t: 'c', cx: 50, cy: 50, r: 5,  sw: 2.5, fill: true },
  ],
  // ── 23 SPORTS CAR ─────────────────────────────────────────────────────────────
  23: [
    { t: 'p', d: 'M6,62 L6,54 L24,38 L66,34 L86,42 L94,54 L94,66 L6,66 Z', sw: 3.5 },
    { t: 'p', d: 'M24,38 L30,22 L62,22 L66,34', sw: 2.5 },
    { t: 'c', cx: 26, cy: 66, r: 12, sw: 3 },
    { t: 'c', cx: 74, cy: 66, r: 12, sw: 3 },
    { t: 'c', cx: 26, cy: 66, r: 5,  sw: 2, fill: true },
    { t: 'c', cx: 74, cy: 66, r: 5,  sw: 2, fill: true },
    { t: 'p', d: 'M38,66 H62', sw: 2 },
  ],
  // ── 24 SCORPION ───────────────────────────────────────────────────────────────
  24: [
    { t: 'p', d: 'M50,42 C42,38 30,38 22,44 C14,50 12,60 18,66 C24,72 34,72 40,68', sw: 3 },
    { t: 'p', d: 'M50,42 C58,38 70,38 78,44 C86,50 88,60 82,66 C76,72 66,72 60,68', sw: 3 },
    { t: 'p', d: 'M40,68 C38,76 40,82 46,86 C50,88 54,86 58,82 C62,76 64,70 60,68', sw: 3 },
    { t: 'p', d: 'M58,82 C60,76 64,68 68,58 C72,48 72,38 68,30', sw: 2.5 },
    { t: 'p', d: 'M68,30 C66,24 62,22 64,16 C66,12 70,14 72,10', sw: 2.5 },
    { t: 'p', d: 'M38,52 L28,46 M38,58 L28,62', sw: 2 },
    { t: 'p', d: 'M62,52 L72,46 M62,58 L72,62', sw: 2 },
    { t: 'c', cx: 50, cy: 42, r: 8, sw: 2.5 },
    { t: 'c', cx: 44, cy: 38, r: 2.5, sw: 2, fill: true },
    { t: 'c', cx: 56, cy: 38, r: 2.5, sw: 2, fill: true },
  ],
  // ── 25 DRAGON ─────────────────────────────────────────────────────────────────
  25: [
    { t: 'p', d: 'M50,82 C36,82 22,72 16,60 C10,48 14,34 22,28 C28,24 36,24 42,28 C40,34 40,42 44,48 C46,52 48,54 50,54 C52,54 54,52 56,48 C60,42 60,34 58,28 C64,24 72,24 78,28 C86,34 90,48 84,60 C78,72 64,82 50,82 Z', sw: 3.5 },
    { t: 'c', cx: 38, cy: 36, r: 5, sw: 2.5 },
    { t: 'c', cx: 62, cy: 36, r: 5, sw: 2.5 },
    { t: 'p', d: 'M30,28 C28,20 24,14 20,10 M70,28 C72,20 76,14 80,10', sw: 2.5 },
    { t: 'p', d: 'M44,48 C42,60 44,70 50,74 C56,70 58,60 56,48', sw: 2, fill: true },
  ],
  // ── 26 HOURGLASS ──────────────────────────────────────────────────────────────
  26: [
    { t: 'p', d: 'M18,10 H82 L50,50 L82,90 H18 L50,50 Z', sw: 3.5 },
    { t: 'p', d: 'M18,10 H82', sw: 2.5 },
    { t: 'p', d: 'M18,90 H82', sw: 2.5 },
    { t: 'p', d: 'M22,18 C30,22 40,28 50,50 C60,28 70,22 78,18', sw: 2, fill: true },
  ],
  // ── 27 STARBURST ──────────────────────────────────────────────────────────────
  27: [
    { t: 'p', d: 'M50,8 L56,36 L82,18 L64,43 L94,50 L64,57 L82,82 L56,64 L50,92 L44,64 L18,82 L36,57 L6,50 L36,43 L18,18 L44,36 Z', sw: 4 },
    { t: 'c', cx: 50, cy: 50, r: 10, sw: 3, fill: true },
  ],
  // ── 28 TIGER EYE ──────────────────────────────────────────────────────────────
  28: [
    { t: 'p', d: 'M10,50 C14,28 30,14 50,14 C70,14 86,28 90,50 C86,72 70,86 50,86 C30,86 14,72 10,50 Z', sw: 3.5 },
    { t: 'c', cx: 50, cy: 50, r: 22, sw: 3 },
    { t: 'p', d: 'M50,28 C54,36 54,64 50,72 C46,64 46,36 50,28 Z', sw: 4, fill: true },
  ],
  // ── 29 WOLF HEAD ──────────────────────────────────────────────────────────────
  29: [
    { t: 'p', d: 'M50,12 L30,24 L22,52 L30,72 L50,85 L70,72 L78,52 L70,24 Z', sw: 3.5 },
    { t: 'p', d: 'M30,24 L22,8 L40,18', sw: 3 },
    { t: 'p', d: 'M70,24 L78,8 L60,18', sw: 3 },
    { t: 'p', d: 'M36,42 L40,38 L44,42 L40,46 Z', sw: 3 },
    { t: 'p', d: 'M56,42 L60,38 L64,42 L60,46 Z', sw: 3 },
    { t: 'p', d: 'M46,60 L50,54 L54,60 C54,65 46,65 46,60 Z', sw: 2.5 },
    { t: 'p', d: 'M36,66 C40,72 46,76 50,76 C54,76 60,72 64,66', sw: 2.5 },
  ],
  // ── 30 CHERRY ─────────────────────────────────────────────────────────────────
  30: [
    { t: 'c', cx: 36, cy: 64, r: 18, sw: 3.5, fill: true },
    { t: 'c', cx: 64, cy: 68, r: 18, sw: 3.5, fill: true },
    { t: 'p', d: 'M36,46 C40,30 52,20 56,10', sw: 3 },
    { t: 'p', d: 'M64,50 C62,36 58,24 56,10', sw: 3 },
    { t: 'p', d: 'M36,46 C44,40 54,42 64,50', sw: 2.5 },
    { t: 'c', cx: 56, cy: 10, r: 4, sw: 2.5, fill: true },
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
