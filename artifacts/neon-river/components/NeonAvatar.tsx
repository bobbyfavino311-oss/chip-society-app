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
  1: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 2.5 },
    { t: 'p', d: 'M14,18 H86', sw: 3 },
    { t: 'p', d: 'M14,18 L50,72 L86,18', sw: 3 },
    { t: 'p', d: 'M50,72 V84', sw: 3 },
    { t: 'p', d: 'M36,84 H64', sw: 3.5 },
    { t: 'p', d: 'M64,32 H72', sw: 2.5 },
    { t: 'c', cx: 72, cy: 32, r: 4, sw: 2.5, fill: true },
  ],

  // ── 2  LIGHTNING BOLT ─────────────────────────────────────────────────────────
  2: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 2.5 },
    { t: 'p', d: 'M62,8 L28,52 L50,52 L38,92 L72,48 L50,48 Z', sw: 3, fill: true },
  ],

  // ── 3  POKER CHIP ─────────────────────────────────────────────────────────────
  3: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 2.5 },
    { t: 'c', cx: 50, cy: 50, r: 38, sw: 4 },
    { t: 'c', cx: 50, cy: 50, r: 28, sw: 2.5 },
    { t: 'p', d: 'M50,12 V22 M50,78 V88 M12,50 H22 M78,50 H88', sw: 4 },
    { t: 'p', d: 'M50,32 C50,22 36,24 36,34 C36,42 44,44 50,52 C56,44 64,42 64,34 C64,24 50,22 50,32 Z', sw: 2 },
    { t: 'p', d: 'M44,52 C44,56 56,56 56,52 L53,60 H47 Z', sw: 1.5 },
  ],

  // ── 4  ACE CARD ───────────────────────────────────────────────────────────────
  4: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 2.5 },
    { t: 'p', d: 'M20,12 Q18,12 18,14 L18,88 Q18,90 20,90 L80,90 Q82,90 82,88 L82,14 Q82,12 80,12 Z', sw: 3.5 },
    { t: 'txt', x: 50, y: 66, text: 'A', size: 52 },
    { t: 'p', d: 'M24,20 L28,14 L32,20 H24 M26,20 L28,26', sw: 1.5 },
  ],

  // ── 5  DICE STACK ─────────────────────────────────────────────────────────────
  5: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 2.5 },
    { t: 'p', d: 'M22,10 Q20,10 20,12 L20,50 Q20,52 22,52 L62,52 Q64,52 64,50 L64,12 Q64,10 62,10 Z', sw: 3.5 },
    { t: 'p', d: 'M36,52 Q34,52 34,54 L34,86 Q34,88 36,88 L78,88 Q80,88 80,86 L80,54 Q80,52 78,52 Z', sw: 3.5 },
    { t: 'c', cx: 30, cy: 22, r: 3.5, sw: 2, fill: true },
    { t: 'c', cx: 42, cy: 31, r: 3.5, sw: 2, fill: true },
    { t: 'c', cx: 54, cy: 40, r: 3.5, sw: 2, fill: true },
    { t: 'c', cx: 48, cy: 64, r: 3.5, sw: 2, fill: true },
    { t: 'c', cx: 66, cy: 76, r: 3.5, sw: 2, fill: true },
  ],

  // ── 6  MOON PHASE ─────────────────────────────────────────────────────────────
  6: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 2.5 },
    { t: 'p', d: 'M32,14 C64,14 80,28 80,50 C80,72 64,86 32,86 C50,78 62,66 62,50 C62,34 50,22 32,14 Z', sw: 3.5, fill: true },
    { t: 'c', cx: 76, cy: 24, r: 3.5, sw: 2.5, fill: true },
    { t: 'c', cx: 84, cy: 40, r: 2.5, sw: 2,   fill: true },
    { t: 'c', cx: 80, cy: 60, r: 3,   sw: 2,   fill: true },
  ],

  // ── 7  FIRE ───────────────────────────────────────────────────────────────────
  7: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 2.5 },
    { t: 'p', d: 'M30,86 C18,76 16,60 24,50 C22,58 26,54 30,44 C28,54 34,52 40,36 C38,50 34,68 30,86 Z', sw: 2.5, fill: true },
    { t: 'p', d: 'M70,86 C68,68 62,50 60,36 C66,52 72,54 68,44 C72,54 76,58 74,50 C82,60 82,76 70,86 Z', sw: 2.5, fill: true },
    { t: 'p', d: 'M50,90 C34,84 24,68 30,52 C28,62 34,58 38,46 C34,58 42,56 46,38 C44,52 50,54 50,12 C50,54 56,52 54,38 C58,56 66,58 62,46 C66,58 72,62 70,52 C76,68 66,84 50,90 Z', sw: 3, fill: true },
  ],

  // ── 8  CROWN ──────────────────────────────────────────────────────────────────
  8: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 2.5 },
    { t: 'p', d: 'M10,80 H90 V64 L72,38 L60,54 L50,26 L40,54 L28,38 L10,64 Z', sw: 3.5 },
    { t: 'c', cx: 28, cy: 42, r: 4,   sw: 2.5, fill: true },
    { t: 'c', cx: 50, cy: 30, r: 4,   sw: 2.5, fill: true },
    { t: 'c', cx: 72, cy: 42, r: 4,   sw: 2.5, fill: true },
  ],

  // ── 9  NEON PALM ──────────────────────────────────────────────────────────────
  9: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 2.5 },
    { t: 'p', d: 'M50,88 C48,72 44,58 46,36', sw: 4 },
    { t: 'p', d: 'M46,36 C34,18 14,14 8,18',  sw: 3 },
    { t: 'p', d: 'M46,36 C38,22 22,22 14,30', sw: 3 },
    { t: 'p', d: 'M46,36 C48,16 50,8 52,6',   sw: 3 },
    { t: 'p', d: 'M46,36 C56,22 70,22 78,30', sw: 3 },
    { t: 'p', d: 'M46,36 C60,18 80,14 86,18', sw: 3 },
    { t: 'c', cx: 38, cy: 90, r: 3.5, sw: 2.5, fill: true },
    { t: 'c', cx: 50, cy: 92, r: 3.5, sw: 2.5, fill: true },
    { t: 'c', cx: 62, cy: 90, r: 3.5, sw: 2.5, fill: true },
  ],

  // ── 10 CASSETTE TAPE ──────────────────────────────────────────────────────────
  10: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 2.5 },
    { t: 'p', d: 'M10,28 H90 V72 H10 Z', sw: 3.5 },
    { t: 'c', cx: 32, cy: 50, r: 13, sw: 3 },
    { t: 'c', cx: 68, cy: 50, r: 13, sw: 3 },
    { t: 'c', cx: 32, cy: 50, r: 5,  sw: 2.5 },
    { t: 'c', cx: 68, cy: 50, r: 5,  sw: 2.5 },
    { t: 'p', d: 'M14,32 H86', sw: 2 },
    { t: 'p', d: 'M46,38 V62 M54,38 V62', sw: 1.5 },
  ],

  // ── 11 FLAMINGO ───────────────────────────────────────────────────────────────
  11: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 2.5 },
    { t: 'p', d: 'M42,54 C32,48 26,34 30,24 C34,14 48,12 58,20 C68,28 66,44 56,52 Z', sw: 3.5 },
    { t: 'p', d: 'M54,52 C58,62 64,70 62,78 C60,84 54,86 50,82', sw: 3.5 },
    { t: 'p', d: 'M50,82 C44,84 40,80 40,76 C40,72 44,72 48,74', sw: 3 },
    { t: 'p', d: 'M46,54 C44,64 42,76 40,86', sw: 3 },
    { t: 'p', d: 'M34,86 L40,86 L44,92', sw: 2.5 },
  ],

  // ── 12 CHAMPAGNE GLASS ────────────────────────────────────────────────────────
  12: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 2.5 },
    { t: 'p', d: 'M34,88 H66', sw: 3.5 },
    { t: 'p', d: 'M50,88 V64', sw: 3.5 },
    { t: 'p', d: 'M36,64 H64', sw: 3 },
    { t: 'p', d: 'M36,64 C34,50 30,36 28,14 M64,64 C66,50 70,36 72,14 M28,14 H72', sw: 3 },
    { t: 'c', cx: 43, cy: 44, r: 3,   sw: 2, fill: true },
    { t: 'c', cx: 54, cy: 30, r: 2.5, sw: 2, fill: true },
    { t: 'c', cx: 46, cy: 20, r: 2,   sw: 2, fill: true },
    { t: 'c', cx: 58, cy: 48, r: 2.5, sw: 2, fill: true },
  ],

  // ── 13 SHARK FIN ──────────────────────────────────────────────────────────────
  13: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 2.5 },
    { t: 'p', d: 'M10,68 C26,68 36,52 44,30 C48,16 52,8 56,8 C60,12 68,36 76,58 C80,66 88,68 90,68', sw: 4.5 },
    { t: 'p', d: 'M8,68 H92', sw: 3.5 },
    { t: 'p', d: 'M8,76 C18,72 26,80 36,76 C46,72 54,80 64,76 C74,72 82,80 92,76', sw: 2.5 },
    { t: 'p', d: 'M8,84 C18,80 26,88 36,84 C46,80 54,88 64,84 C74,80 82,88 92,84', sw: 2 },
  ],

  // ── 14 NEON ROSE ──────────────────────────────────────────────────────────────
  14: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 2.5 },
    { t: 'p', d: 'M50,16 C62,12 74,20 74,32 C80,26 86,36 80,46 C88,50 84,64 74,64 C78,74 70,84 58,82 C58,88 54,92 50,92 C46,92 42,88 42,82 C30,84 22,74 26,64 C16,64 12,50 20,46 C14,36 20,26 26,32 C26,20 38,12 50,16 Z', sw: 3 },
    { t: 'p', d: 'M50,30 C58,26 66,32 64,40 C70,38 74,46 68,52 C72,58 66,64 60,62 C60,68 56,72 50,72 C44,72 40,68 40,62 C34,64 28,58 32,52 C26,46 30,38 36,40 C34,32 42,26 50,30 Z', sw: 2.5 },
    { t: 'p', d: 'M50,92 C48,96 46,100 46,100', sw: 2.5 },
    { t: 'p', d: 'M50,86 C44,88 34,88 30,84', sw: 2 },
  ],

  // ── 15 EIGHT BALL ─────────────────────────────────────────────────────────────
  15: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 2.5 },
    { t: 'c', cx: 50, cy: 50, r: 40, sw: 3.5 },
    { t: 'c', cx: 50, cy: 50, r: 20, sw: 3 },
    { t: 'txt', x: 50, y: 58, text: '8', size: 22 },
  ],

  // ── 16 ANCHOR ─────────────────────────────────────────────────────────────────
  16: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 2.5 },
    { t: 'p', d: 'M30,22 H70', sw: 4 },
    { t: 'p', d: 'M50,22 V84', sw: 4 },
    { t: 'p', d: 'M18,84 C18,64 32,62 50,84 C68,62 82,64 82,84', sw: 4 },
    { t: 'c', cx: 50, cy: 30, r: 9, sw: 3.5 },
    { t: 'p', d: 'M36,50 H64', sw: 3 },
  ],

  // ── 17 SUNSET GRID ────────────────────────────────────────────────────────────
  17: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 2.5 },
    { t: 'p', d: 'M8,52 C8,26 26,8 50,8 C74,8 92,26 92,52 Z', sw: 3.5, fill: true },
    { t: 'p', d: 'M8,52 H92', sw: 4 },
    { t: 'p', d: 'M8,64 H92', sw: 3 },
    { t: 'p', d: 'M8,76 H92', sw: 2.5 },
    { t: 'p', d: 'M8,88 H92', sw: 2 },
    { t: 'p', d: 'M50,52 L8,88 M50,52 L24,88 M50,52 L50,88 M50,52 L76,88 M50,52 L92,88', sw: 2 },
  ],

  // ── 18 SNAKE ──────────────────────────────────────────────────────────────────
  18: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 2.5 },
    { t: 'p', d: 'M50,18 C70,18 82,30 80,44 C78,58 60,62 50,70 C40,78 36,88 50,90 C62,92 72,84 72,74', sw: 4.5 },
    { t: 'p', d: 'M42,16 C42,20 46,22 50,22 C54,22 58,20 58,16', sw: 3 },
    { t: 'p', d: 'M45,14 L47,8 M55,14 L53,8', sw: 3 },
    { t: 'c', cx: 44, cy: 24, r: 2.5, sw: 2, fill: true },
    { t: 'c', cx: 56, cy: 24, r: 2.5, sw: 2, fill: true },
  ],

  // ── 19 KATANA (SWORD) ─────────────────────────────────────────────────────────
  19: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 2.5 },
    { t: 'p', d: 'M20,80 L76,14 C80,10 84,10 84,14 C84,18 80,18 76,22 L20,80 Z', sw: 2.5, fill: true },
    { t: 'p', d: 'M24,76 L32,68', sw: 8 },
    { t: 'p', d: 'M14,86 L24,76', sw: 4.5 },
    { t: 'p', d: 'M10,90 C10,94 14,94 16,92 L24,80', sw: 3 },
  ],

  // ── 20 SKULL ──────────────────────────────────────────────────────────────────
  20: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 2.5 },
    { t: 'p', d: 'M18,56 C18,32 32,12 50,12 C68,12 82,32 82,56 C82,70 76,80 66,84 L66,92 H34 L34,84 C24,80 18,70 18,56 Z', sw: 3.5 },
    { t: 'c', cx: 36, cy: 52, r: 10, sw: 3 },
    { t: 'c', cx: 64, cy: 52, r: 10, sw: 3 },
    { t: 'p', d: 'M40,84 V92 M50,84 V92 M60,84 V92', sw: 3.5 },
    { t: 'p', d: 'M38,68 C40,72 44,74 50,74 C56,74 60,72 62,68', sw: 2.5 },
  ],

  // ── 21 SATURN PLANET ──────────────────────────────────────────────────────────
  21: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 2.5 },
    { t: 'c', cx: 50, cy: 50, r: 22, sw: 4 },
    { t: 'p', d: 'M6,32 C14,16 86,84 94,68', sw: 4 },
    { t: 'c', cx: 50, cy: 50, r: 8, sw: 3 },
  ],

  // ── 22 VINYL RECORD ───────────────────────────────────────────────────────────
  22: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 2.5 },
    { t: 'c', cx: 50, cy: 50, r: 38, sw: 4 },
    { t: 'c', cx: 50, cy: 50, r: 28, sw: 2 },
    { t: 'c', cx: 50, cy: 50, r: 20, sw: 2 },
    { t: 'c', cx: 50, cy: 50, r: 14, sw: 2.5 },
    { t: 'c', cx: 50, cy: 50, r: 6,  sw: 3.5, fill: true },
  ],

  // ── 23 SPORTS CAR ─────────────────────────────────────────────────────────────
  23: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 2.5 },
    { t: 'p', d: 'M6,64 L6,56 L22,40 L36,28 L72,28 L84,36 L94,52 L94,64 Z', sw: 3.5 },
    { t: 'p', d: 'M36,28 L40,20 L66,20 L72,28', sw: 2.5 },
    { t: 'c', cx: 24, cy: 64, r: 13, sw: 3.5 },
    { t: 'c', cx: 76, cy: 64, r: 13, sw: 3.5 },
    { t: 'c', cx: 24, cy: 64, r: 5,  sw: 2.5, fill: true },
    { t: 'c', cx: 76, cy: 64, r: 5,  sw: 2.5, fill: true },
    { t: 'p', d: 'M37,50 H63 V42 H37 Z', sw: 2 },
  ],

  // ── 24 SCORPION ───────────────────────────────────────────────────────────────
  24: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 2.5 },
    { t: 'c', cx: 50, cy: 48, r: 10, sw: 3.5 },
    { t: 'p', d: 'M40,44 C28,36 16,38 12,48 C16,54 28,52 36,48', sw: 3 },
    { t: 'p', d: 'M60,44 C72,36 84,38 88,48 C84,54 72,52 64,48', sw: 3 },
    { t: 'p', d: 'M12,48 L8,44 M12,48 L8,52', sw: 2.5 },
    { t: 'p', d: 'M88,48 L92,44 M88,48 L92,52', sw: 2.5 },
    { t: 'p', d: 'M44,52 L30,58 M44,56 L28,66 M44,60 L34,72', sw: 2 },
    { t: 'p', d: 'M56,52 L70,58 M56,56 L72,66 M56,60 L66,72', sw: 2 },
    { t: 'p', d: 'M50,58 C50,68 58,76 62,84 C66,90 64,94 58,90', sw: 3 },
    { t: 'p', d: 'M58,90 L54,84 M58,90 L64,86', sw: 3 },
  ],

  // ── 25 DRAGON ─────────────────────────────────────────────────────────────────
  25: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 2.5 },
    { t: 'p', d: 'M50,80 C34,80 20,68 14,54 C8,40 12,26 22,20 C28,16 36,16 42,22 C40,30 40,40 46,46 L50,50 L54,46 C60,40 60,30 58,22 C64,16 72,16 78,20 C88,26 92,40 86,54 C80,68 66,80 50,80 Z', sw: 3.5 },
    { t: 'p', d: 'M34,22 C30,14 26,8 22,10', sw: 3 },
    { t: 'p', d: 'M66,22 C70,14 74,8 78,10', sw: 3 },
    { t: 'c', cx: 38, cy: 32, r: 4.5, sw: 2.5, fill: true },
    { t: 'c', cx: 62, cy: 32, r: 4.5, sw: 2.5, fill: true },
    { t: 'p', d: 'M22,40 C14,34 10,24 14,18', sw: 2.5 },
    { t: 'p', d: 'M78,40 C86,34 90,24 86,18', sw: 2.5 },
  ],

  // ── 26 HOURGLASS ──────────────────────────────────────────────────────────────
  26: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 2.5 },
    { t: 'p', d: 'M16,10 H84 L50,50 L84,90 H16 L50,50 Z', sw: 3.5 },
    { t: 'p', d: 'M16,10 H84', sw: 3 },
    { t: 'p', d: 'M16,90 H84', sw: 3 },
    { t: 'p', d: 'M22,18 C30,24 42,32 50,50', sw: 2, fill: true },
  ],

  // ── 27 STARBURST ──────────────────────────────────────────────────────────────
  27: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 2.5 },
    { t: 'p', d: 'M50,8 L54,36 L80,20 L64,44 L92,50 L64,56 L80,80 L54,64 L50,92 L46,64 L20,80 L36,56 L8,50 L36,44 L20,20 L46,36 Z', sw: 3.5, fill: true },
    { t: 'c', cx: 50, cy: 50, r: 10, sw: 3 },
  ],

  // ── 28 TIGER EYE ──────────────────────────────────────────────────────────────
  28: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 2.5 },
    { t: 'p', d: 'M6,50 C18,18 82,18 94,50 C82,82 18,82 6,50 Z', sw: 4 },
    { t: 'c', cx: 50, cy: 50, r: 22, sw: 3.5 },
    { t: 'p', d: 'M50,28 C56,36 56,64 50,72 C44,64 44,36 50,28 Z', sw: 3, fill: true },
    { t: 'c', cx: 58, cy: 38, r: 3.5, sw: 2.5, fill: true },
  ],

  // ── 29 WOLF HEAD ──────────────────────────────────────────────────────────────
  29: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 2.5 },
    { t: 'p', d: 'M50,10 L28,20 L18,50 L26,74 L50,90 L74,74 L82,50 L72,20 Z', sw: 3.5 },
    { t: 'p', d: 'M28,20 L18,4 L36,14', sw: 3 },
    { t: 'p', d: 'M72,20 L82,4 L64,14', sw: 3 },
    { t: 'c', cx: 36, cy: 46, r: 7, sw: 3, fill: true },
    { t: 'c', cx: 64, cy: 46, r: 7, sw: 3, fill: true },
    { t: 'p', d: 'M44,62 C46,58 54,58 56,62 C54,66 46,66 44,62 Z', sw: 2.5, fill: true },
    { t: 'p', d: 'M38,70 C42,76 46,80 50,80 C54,80 58,76 62,70', sw: 2.5 },
  ],

  // ── 30 COCKTAIL CHERRY ────────────────────────────────────────────────────────
  30: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 2.5 },
    { t: 'c', cx: 34, cy: 68, r: 18, sw: 3.5, fill: true },
    { t: 'c', cx: 66, cy: 72, r: 18, sw: 3.5, fill: true },
    { t: 'p', d: 'M34,50 C36,32 46,20 50,10', sw: 3.5 },
    { t: 'p', d: 'M66,54 C64,36 56,22 50,10', sw: 3.5 },
    { t: 'p', d: 'M34,50 C42,44 58,46 66,54', sw: 3 },
    { t: 'c', cx: 42, cy: 68, r: 6, sw: 3 },
    { t: 'c', cx: 74, cy: 72, r: 6, sw: 3 },
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
