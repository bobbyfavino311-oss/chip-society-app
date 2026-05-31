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
  // ── 1  MARTINI GLASS ──────────────────────────────────────────────────────────
  // Rim + V-bowl + stem + base + olive pick + olive
  1: [
    { t: 'p', d: 'M10,14 H90',         sw: 5 },
    { t: 'p', d: 'M10,14 L50,76 L90,14', sw: 5 },
    { t: 'p', d: 'M50,76 V88',          sw: 5 },
    { t: 'p', d: 'M30,88 H70',          sw: 5 },
    { t: 'p', d: 'M62,30 H76',          sw: 3.5 },
    { t: 'c', cx: 76, cy: 30, r: 5.5, sw: 3.5, fill: true },
  ],

  // ── 2  LIGHTNING BOLT ─────────────────────────────────────────────────────────
  // Classic Z-bolt polygon — filled solid, unmistakable at any size
  2: [
    { t: 'p', d: 'M64,4 L26,54 L50,54 L36,96 L74,46 L50,46 Z', sw: 4.5, fill: true },
  ],

  // ── 3  POKER CHIP ─────────────────────────────────────────────────────────────
  // Outer edge + 8 stripe marks + inner ring = instantly a chip
  3: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 6 },
    { t: 'p', d: 'M50,6 V18 M50,82 V94 M6,50 H18 M82,50 H94 M20,20 L28,28 M80,20 L72,28 M20,80 L28,72 M80,80 L72,72', sw: 5 },
    { t: 'c', cx: 50, cy: 50, r: 26, sw: 4 },
  ],

  // ── 4  ACE CARD ───────────────────────────────────────────────────────────────
  // Playing card rectangle + large A + corner pip
  4: [
    { t: 'p', d: 'M16,6 Q14,6 14,8 L14,94 Q14,96 16,96 L84,96 Q86,96 86,94 L86,8 Q86,6 84,6 Z', sw: 5 },
    { t: 'txt', x: 50, y: 68, text: 'A', size: 60 },
    { t: 'p', d: 'M22,18 L26,10 L30,18 H22 M24,18 L26,24', sw: 2 },
  ],

  // ── 5  DICE STACK ─────────────────────────────────────────────────────────────
  // Two overlapping rounded squares with pips — clearly two dice
  5: [
    { t: 'p', d: 'M16,4 Q12,4 12,8 L12,52 Q12,56 16,56 L60,56 Q64,56 64,52 L64,8 Q64,4 60,4 Z', sw: 5 },
    { t: 'p', d: 'M36,56 Q32,56 32,60 L32,92 Q32,96 36,96 L82,96 Q86,96 86,92 L86,60 Q86,56 82,56 Z', sw: 5 },
    { t: 'c', cx: 24, cy: 20, r: 4.5, sw: 2.5, fill: true },
    { t: 'c', cx: 38, cy: 30, r: 4.5, sw: 2.5, fill: true },
    { t: 'c', cx: 52, cy: 40, r: 4.5, sw: 2.5, fill: true },
    { t: 'c', cx: 48, cy: 68, r: 4.5, sw: 2.5, fill: true },
    { t: 'c', cx: 70, cy: 80, r: 4.5, sw: 2.5, fill: true },
  ],

  // ── 6  MOON PHASE ─────────────────────────────────────────────────────────────
  // Filled crescent + two star dots — pure, bold, unmistakable
  6: [
    { t: 'p', d: 'M24,8 C58,8 78,26 78,50 C78,74 58,92 24,92 C44,84 58,70 58,50 C58,30 44,16 24,8 Z', sw: 4.5, fill: true },
    { t: 'c', cx: 80, cy: 24, r: 5, sw: 3.5, fill: true },
    { t: 'c', cx: 88, cy: 46, r: 3.5, sw: 2.5, fill: true },
  ],

  // ── 7  FIRE ───────────────────────────────────────────────────────────────────
  // Three flame tongues — left, right, center tallest — filled solid
  7: [
    { t: 'p', d: 'M28,94 C14,86 12,68 20,56 C18,66 22,62 28,50 C26,62 32,60 38,42 C36,58 28,78 28,94 Z', sw: 3.5, fill: true },
    { t: 'p', d: 'M72,94 C72,78 64,58 62,42 C68,60 74,62 72,50 C78,62 82,66 80,56 C88,68 86,86 72,94 Z', sw: 3.5, fill: true },
    { t: 'p', d: 'M50,96 C34,90 22,74 28,56 C24,68 30,62 36,48 C32,62 40,60 44,40 C42,56 48,58 50,8 C52,58 58,56 56,40 C60,60 68,62 64,48 C70,62 76,68 72,56 C78,74 66,90 50,96 Z', sw: 4, fill: true },
  ],

  // ── 8  CROWN ──────────────────────────────────────────────────────────────────
  // Classic W-crown silhouette + band + three gem dots
  8: [
    { t: 'p', d: 'M8,84 H92 V68 L72,40 L60,58 L50,24 L40,58 L28,40 L8,68 Z', sw: 5 },
    { t: 'c', cx: 28, cy: 44, r: 5, sw: 3.5, fill: true },
    { t: 'c', cx: 50, cy: 28, r: 5, sw: 3.5, fill: true },
    { t: 'c', cx: 72, cy: 44, r: 5, sw: 3.5, fill: true },
  ],

  // ── 9  NEON PALM ──────────────────────────────────────────────────────────────
  // Curved trunk + 5 drooping fronds — classic neon palm sign
  9: [
    { t: 'p', d: 'M50,96 C48,78 44,62 46,36', sw: 6 },
    { t: 'p', d: 'M46,36 C32,16 8,10 4,14',  sw: 4 },
    { t: 'p', d: 'M46,36 C36,18 16,18 10,26', sw: 4 },
    { t: 'p', d: 'M46,36 C48,14 50,4 52,2',   sw: 4 },
    { t: 'p', d: 'M46,36 C58,18 76,18 82,26', sw: 4 },
    { t: 'p', d: 'M46,36 C62,14 86,10 90,14', sw: 4 },
  ],

  // ── 10 CASSETTE TAPE ──────────────────────────────────────────────────────────
  // Rectangle body + two reel circles + hub centres + tape window line
  10: [
    { t: 'p', d: 'M6,22 H94 V78 H6 Z', sw: 5 },
    { t: 'c', cx: 30, cy: 50, r: 15, sw: 4.5 },
    { t: 'c', cx: 70, cy: 50, r: 15, sw: 4.5 },
    { t: 'c', cx: 30, cy: 50, r: 6,  sw: 3.5 },
    { t: 'c', cx: 70, cy: 50, r: 6,  sw: 3.5 },
    { t: 'p', d: 'M10,28 H90', sw: 2.5 },
  ],

  // ── 11 FLAMINGO ───────────────────────────────────────────────────────────────
  // Egg body + S-neck + hooked beak + single standing leg + foot
  11: [
    { t: 'p', d: 'M36,60 C24,50 22,34 30,22 C38,10 54,10 62,22 C70,34 68,52 56,62 Z', sw: 5 },
    { t: 'p', d: 'M54,62 C60,72 66,80 62,88 C58,94 50,96 46,90', sw: 5 },
    { t: 'p', d: 'M46,90 C40,92 36,88 38,82', sw: 4 },
    { t: 'p', d: 'M44,62 C42,72 40,82 38,92', sw: 4.5 },
    { t: 'p', d: 'M30,92 L38,92 L42,98', sw: 4 },
  ],

  // ── 12 CHAMPAGNE GLASS ────────────────────────────────────────────────────────
  // Tall flute sides + stem + base + rising bubbles
  12: [
    { t: 'p', d: 'M34,92 H66', sw: 5 },
    { t: 'p', d: 'M50,92 V66', sw: 5 },
    { t: 'p', d: 'M36,66 H64', sw: 4.5 },
    { t: 'p', d: 'M36,66 C34,52 30,36 28,10 M64,66 C66,52 70,36 72,10 M28,10 H72', sw: 4.5 },
    { t: 'c', cx: 43, cy: 44, r: 3.5, sw: 2.5, fill: true },
    { t: 'c', cx: 52, cy: 28, r: 3,   sw: 2.5, fill: true },
    { t: 'c', cx: 44, cy: 16, r: 2.5, sw: 2,   fill: true },
  ],

  // ── 13 SHARK FIN ──────────────────────────────────────────────────────────────
  // Bold fin arc + flat horizon + two wave arcs below
  13: [
    { t: 'p', d: 'M6,70 C24,70 36,52 44,28 C48,14 52,6 56,6 C60,10 70,36 78,60 C82,68 90,70 94,70', sw: 6 },
    { t: 'p', d: 'M4,70 H96', sw: 5 },
    { t: 'p', d: 'M4,80 C14,76 22,84 32,80 C42,76 52,84 62,80 C72,76 82,84 96,80', sw: 3.5 },
  ],

  // ── 14 NEON ROSE ──────────────────────────────────────────────────────────────
  // Outer petal ring + inner petal ring + stem + leaf
  14: [
    { t: 'p', d: 'M50,14 C64,10 76,20 76,34 C82,26 88,40 80,50 C90,56 84,70 72,70 C76,82 66,92 52,90 C50,96 48,96 48,90 C34,92 24,82 28,70 C16,70 10,56 20,50 C12,40 18,26 24,34 C24,20 36,10 50,14 Z', sw: 4.5 },
    { t: 'c', cx: 50, cy: 48, r: 14, sw: 4 },
    { t: 'p', d: 'M50,90 V100', sw: 4.5 },
    { t: 'p', d: 'M50,92 C44,92 34,88 28,82', sw: 3.5 },
  ],

  // ── 15 EIGHT BALL ─────────────────────────────────────────────────────────────
  // Large outer ring + label ring + 8 — every pool player knows it instantly
  15: [
    { t: 'c', cx: 50, cy: 50, r: 46, sw: 6.5 },
    { t: 'c', cx: 50, cy: 50, r: 22, sw: 4.5 },
    { t: 'txt', x: 50, y: 58, text: '8', size: 26 },
  ],

  // ── 16 ANCHOR ─────────────────────────────────────────────────────────────────
  // Crossbar + shaft + ring + two curved hooks — classic maritime anchor
  16: [
    { t: 'p', d: 'M26,20 H74', sw: 6 },
    { t: 'p', d: 'M50,20 V88', sw: 6 },
    { t: 'p', d: 'M14,88 C14,66 30,64 50,88 C70,64 86,66 86,88', sw: 6 },
    { t: 'c', cx: 50, cy: 30, r: 12, sw: 5 },
    { t: 'p', d: 'M34,52 H66', sw: 4 },
  ],

  // ── 17 SUNSET GRID ────────────────────────────────────────────────────────────
  // Filled semicircle sun + horizon + receding grid lines — pure synthwave
  17: [
    { t: 'p', d: 'M4,54 C4,26 24,6 50,6 C76,6 96,26 96,54 Z', sw: 4.5, fill: true },
    { t: 'p', d: 'M4,54 H96', sw: 5 },
    { t: 'p', d: 'M4,66 H96', sw: 4 },
    { t: 'p', d: 'M4,78 H96', sw: 3 },
    { t: 'p', d: 'M4,90 H96', sw: 2.5 },
    { t: 'p', d: 'M50,54 L4,90 M50,54 L24,90 M50,54 L50,90 M50,54 L76,90 M50,54 L96,90', sw: 2.5 },
  ],

  // ── 18 SNAKE ──────────────────────────────────────────────────────────────────
  // S-curve coil + open mouth + forked tongue + two eye dots
  18: [
    { t: 'p', d: 'M50,20 C72,20 84,36 82,52 C80,68 58,72 50,82 C42,90 38,96 50,98 C64,100 74,90 74,78', sw: 6 },
    { t: 'p', d: 'M38,16 C38,22 44,24 50,24 C56,24 62,22 62,16', sw: 4.5 },
    { t: 'p', d: 'M43,14 L45,6 M57,14 L55,6', sw: 4 },
    { t: 'c', cx: 43, cy: 26, r: 3, sw: 2.5, fill: true },
    { t: 'c', cx: 57, cy: 26, r: 3, sw: 2.5, fill: true },
  ],

  // ── 19 KATANA (SWORD) ─────────────────────────────────────────────────────────
  // Thin filled blade + thick guard (tsuba) + wrapped handle
  19: [
    { t: 'p', d: 'M18,84 L76,14 C80,10 86,10 88,14 C90,18 86,22 82,26 L18,84 Z', sw: 3, fill: true },
    { t: 'p', d: 'M22,80 L32,70', sw: 11 },
    { t: 'p', d: 'M12,90 L22,80', sw: 5.5 },
    { t: 'p', d: 'M8,94 C8,98 12,98 14,96 L22,84', sw: 4 },
  ],

  // ── 20 SKULL ──────────────────────────────────────────────────────────────────
  // Dome outline + two hollow eye sockets + jaw teeth — classic skull
  20: [
    { t: 'p', d: 'M14,58 C14,30 30,8 50,8 C70,8 86,30 86,58 C86,74 78,84 68,88 L68,96 H32 L32,88 C22,84 14,74 14,58 Z', sw: 5 },
    { t: 'c', cx: 34, cy: 54, r: 12, sw: 4.5 },
    { t: 'c', cx: 66, cy: 54, r: 12, sw: 4.5 },
    { t: 'p', d: 'M38,88 V96 M50,88 V96 M62,88 V96', sw: 5 },
  ],

  // ── 21 SATURN PLANET ──────────────────────────────────────────────────────────
  // Bold sphere circle + diagonal ring arc cutting through — unmistakably Saturn
  21: [
    { t: 'c', cx: 50, cy: 50, r: 26, sw: 6 },
    { t: 'p', d: 'M2,30 C18,10 82,88 98,68', sw: 6 },
  ],

  // ── 22 VINYL RECORD ───────────────────────────────────────────────────────────
  // Outer groove ring + two inner groove rings + centre label dot
  22: [
    { t: 'c', cx: 50, cy: 50, r: 46, sw: 7 },
    { t: 'c', cx: 50, cy: 50, r: 32, sw: 3 },
    { t: 'c', cx: 50, cy: 50, r: 20, sw: 3 },
    { t: 'c', cx: 50, cy: 50, r: 8,  sw: 4, fill: true },
  ],

  // ── 23 SPORTS CAR ─────────────────────────────────────────────────────────────
  // Side-profile wedge body + cabin + two large wheels + hubs
  23: [
    { t: 'p', d: 'M2,68 L2,58 L20,40 L36,26 L72,26 L86,36 L98,54 L98,68 Z', sw: 5 },
    { t: 'p', d: 'M36,26 L40,18 L68,18 L72,26', sw: 4 },
    { t: 'c', cx: 24, cy: 68, r: 15, sw: 5.5 },
    { t: 'c', cx: 76, cy: 68, r: 15, sw: 5.5 },
    { t: 'c', cx: 24, cy: 68, r: 6,  sw: 3.5, fill: true },
    { t: 'c', cx: 76, cy: 68, r: 6,  sw: 3.5, fill: true },
  ],

  // ── 24 SCORPION ───────────────────────────────────────────────────────────────
  // Oval body + two pincer arms + claw tips + arched stinger tail
  24: [
    { t: 'c', cx: 50, cy: 44, r: 12, sw: 5.5 },
    { t: 'p', d: 'M38,40 C26,30 12,34 8,46 C12,56 26,52 38,48', sw: 4.5 },
    { t: 'p', d: 'M62,40 C74,30 88,34 92,46 C88,56 74,52 62,48', sw: 4.5 },
    { t: 'p', d: 'M8,46 L4,40 M8,46 L4,52', sw: 4 },
    { t: 'p', d: 'M92,46 L96,40 M92,46 L96,52', sw: 4 },
    { t: 'p', d: 'M50,56 C50,68 60,78 64,88 C68,96 64,100 58,96', sw: 4.5 },
    { t: 'p', d: 'M58,96 L54,88 M58,96 L64,90', sw: 4.5 },
  ],

  // ── 25 DRAGON ─────────────────────────────────────────────────────────────────
  // Muscular body outline + two horn spikes + glowing eyes + wing curves
  25: [
    { t: 'p', d: 'M50,84 C32,84 16,70 10,54 C4,38 8,22 20,16 C28,12 36,12 42,20 C40,30 40,42 46,48 L50,52 L54,48 C60,42 60,30 58,20 C64,12 72,12 80,16 C92,22 96,38 90,54 C84,70 68,84 50,84 Z', sw: 5 },
    { t: 'p', d: 'M32,20 C28,10 24,4 20,6',  sw: 4 },
    { t: 'p', d: 'M68,20 C72,10 76,4 80,6',  sw: 4 },
    { t: 'c', cx: 36, cy: 32, r: 6, sw: 4, fill: true },
    { t: 'c', cx: 64, cy: 32, r: 6, sw: 4, fill: true },
  ],

  // ── 26 HOURGLASS ──────────────────────────────────────────────────────────────
  // Two triangles point-to-point + top/bottom bars + falling sand fill
  26: [
    { t: 'p', d: 'M10,6 H90 L50,50 L90,94 H10 L50,50 Z', sw: 5 },
    { t: 'p', d: 'M10,6 H90', sw: 4.5 },
    { t: 'p', d: 'M10,94 H90', sw: 4.5 },
    { t: 'p', d: 'M14,16 C24,22 40,34 50,50', sw: 3, fill: true },
  ],

  // ── 27 STARBURST ──────────────────────────────────────────────────────────────
  // Filled 8-point star — bold, fills the space, reads at any size
  27: [
    { t: 'p', d: 'M50,4 L54,34 L82,16 L66,42 L96,50 L66,58 L82,84 L54,66 L50,96 L46,66 L18,84 L34,58 L4,50 L34,42 L18,16 L46,34 Z', sw: 5, fill: true },
  ],

  // ── 28 TIGER EYE ──────────────────────────────────────────────────────────────
  // Wide almond outline + iris ring + vertical slit pupil + shine dot
  28: [
    { t: 'p', d: 'M2,50 C16,14 84,14 98,50 C84,86 16,86 2,50 Z', sw: 5.5 },
    { t: 'c', cx: 50, cy: 50, r: 24, sw: 4.5 },
    { t: 'p', d: 'M50,26 C56,34 56,66 50,74 C44,66 44,34 50,26 Z', sw: 4, fill: true },
    { t: 'c', cx: 60, cy: 38, r: 4.5, sw: 3, fill: true },
  ],

  // ── 29 WOLF HEAD ──────────────────────────────────────────────────────────────
  // Angular polygon head + two ear spikes + filled eyes + nose + muzzle
  29: [
    { t: 'p', d: 'M50,6 L26,18 L14,52 L24,78 L50,94 L76,78 L86,52 L74,18 Z', sw: 5 },
    { t: 'p', d: 'M26,18 L14,0 L34,12',  sw: 4.5 },
    { t: 'p', d: 'M74,18 L86,0 L66,12',  sw: 4.5 },
    { t: 'c', cx: 36, cy: 46, r: 9, sw: 4, fill: true },
    { t: 'c', cx: 64, cy: 46, r: 9, sw: 4, fill: true },
    { t: 'p', d: 'M44,64 C46,60 54,60 56,64 C54,68 46,68 44,64 Z', sw: 3.5, fill: true },
    { t: 'p', d: 'M36,74 C42,82 46,86 50,86 C54,86 58,82 64,74', sw: 3.5 },
  ],

  // ── 30 COCKTAIL CHERRY ────────────────────────────────────────────────────────
  // Two large filled circles + branching stems — instantly two cherries
  30: [
    { t: 'c', cx: 30, cy: 68, r: 24, sw: 5.5, fill: true },
    { t: 'c', cx: 70, cy: 72, r: 24, sw: 5.5, fill: true },
    { t: 'p', d: 'M30,44 C32,26 44,14 50,6', sw: 5 },
    { t: 'p', d: 'M70,48 C68,28 56,14 50,6', sw: 5 },
    { t: 'p', d: 'M30,44 C42,36 58,38 70,48', sw: 4.5 },
    { t: 'c', cx: 38, cy: 68, r: 8, sw: 4 },
    { t: 'c', cx: 78, cy: 72, r: 8, sw: 4 },
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
