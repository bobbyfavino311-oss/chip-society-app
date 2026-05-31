// ─── NeonAvatar — 30 SVG neon symbol avatars ──────────────────────────────────
// Each avatar is independently rendered from SVG path data.
// Perfect circles, centered symbols, no clipping, no neighboring artwork.
// Reference image used only to identify correct symbols — NOT for cropping.

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

// ─── Icon draw ops ─────────────────────────────────────────────────────────────
// viewBox 0 0 100 100. Every icon has an outer ring (r=44,sw=3) as first op.
// Double-pass rendering: glow layer (wide, low opacity) + core layer (sharp).
type PathOp = { t: 'p';   d: string; sw?: number; fill?: boolean };
type CircOp = { t: 'c';   cx: number; cy: number; r: number; sw?: number; fill?: boolean };
type TextOp = { t: 'txt'; x: number; y: number; text: string; size: number };
type Op = PathOp | CircOp | TextOp;

const I: Record<number, Op[]> = {

  // 1  MARTINI GLASS — rim + V-bowl + stem + base + pick + olive
  1: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 3 },
    { t: 'p', d: 'M10,18 H90',            sw: 5 },
    { t: 'p', d: 'M10,18 L50,74 L90,18',  sw: 5 },
    { t: 'p', d: 'M50,74 V86',            sw: 5 },
    { t: 'p', d: 'M32,86 H68',            sw: 5 },
    { t: 'p', d: 'M64,32 H76',            sw: 3 },
    { t: 'c', cx: 76, cy: 32, r: 5, sw: 3, fill: true },
  ],

  // 2  NEON PALM — curved trunk + 5 fronds
  2: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 3 },
    { t: 'p', d: 'M50,92 C48,76 46,60 48,38',  sw: 6 },
    { t: 'p', d: 'M48,38 C34,18 10,12 6,16',   sw: 4 },
    { t: 'p', d: 'M48,38 C38,20 18,20 12,28',  sw: 4 },
    { t: 'p', d: 'M48,38 C50,16 52,6 54,4',    sw: 4 },
    { t: 'p', d: 'M48,38 C60,20 78,20 84,28',  sw: 4 },
    { t: 'p', d: 'M48,38 C64,16 88,12 92,16',  sw: 4 },
  ],

  // 3  DICE STACK — two overlapping rounded squares + pips
  3: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 3 },
    { t: 'p', d: 'M14,10 Q10,10 10,14 L10,54 Q10,58 14,58 L58,58 Q62,58 62,54 L62,14 Q62,10 58,10 Z', sw: 4.5 },
    { t: 'p', d: 'M38,44 Q34,44 34,48 L34,86 Q34,90 38,90 L82,90 Q86,90 86,86 L86,48 Q86,44 82,44 Z', sw: 4.5 },
    { t: 'c', cx: 22, cy: 22, r: 4, sw: 2.5, fill: true },
    { t: 'c', cx: 36, cy: 32, r: 4, sw: 2.5, fill: true },
    { t: 'c', cx: 50, cy: 42, r: 4, sw: 2.5, fill: true },
    { t: 'c', cx: 48, cy: 58, r: 4, sw: 2.5, fill: true },
    { t: 'c', cx: 64, cy: 70, r: 4, sw: 2.5, fill: true },
    { t: 'c', cx: 70, cy: 82, r: 4, sw: 2.5, fill: true },
  ],

  // 4  CASSETTE TAPE — body + 2 reels + hubs + window
  4: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 3 },
    { t: 'p', d: 'M8,24 H92 V76 H8 Z',  sw: 4.5 },
    { t: 'c', cx: 30, cy: 50, r: 14,    sw: 4 },
    { t: 'c', cx: 70, cy: 50, r: 14,    sw: 4 },
    { t: 'c', cx: 30, cy: 50, r: 5.5,   sw: 3 },
    { t: 'c', cx: 70, cy: 50, r: 5.5,   sw: 3 },
    { t: 'p', d: 'M12,30 H88',          sw: 2 },
    { t: 'p', d: 'M46,40 V60 M54,40 V60', sw: 1.5 },
  ],

  // 5  LIGHTNING BOLT — filled Z-polygon
  5: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 3 },
    { t: 'p', d: 'M62,6 L26,52 L50,52 L38,94 L74,48 L50,48 Z', sw: 4, fill: true },
  ],

  // 6  FLAMINGO — egg body + S-neck + beak + leg + foot
  6: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 3 },
    { t: 'p', d: 'M36,60 C24,50 22,34 30,22 C38,10 54,10 62,22 C70,34 68,52 56,62 Z', sw: 4.5 },
    { t: 'p', d: 'M54,62 C58,74 64,82 60,90 C56,96 48,96 44,90', sw: 4.5 },
    { t: 'p', d: 'M44,90 C38,92 34,86 36,82',  sw: 3.5 },
    { t: 'p', d: 'M44,62 C42,72 40,82 38,92',  sw: 4 },
    { t: 'p', d: 'M30,92 L38,92 L42,98',       sw: 3.5 },
  ],

  // 7  CHAMPAGNE GLASS — tall flute + stem + base + bubbles
  7: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 3 },
    { t: 'p', d: 'M34,90 H66',  sw: 5 },
    { t: 'p', d: 'M50,90 V66',  sw: 5 },
    { t: 'p', d: 'M36,66 H64',  sw: 4.5 },
    { t: 'p', d: 'M36,66 C34,52 30,36 28,10 M64,66 C66,52 70,36 72,10 M28,10 H72', sw: 4.5 },
    { t: 'c', cx: 42, cy: 46, r: 3.5, sw: 2.5, fill: true },
    { t: 'c', cx: 52, cy: 30, r: 3,   sw: 2.5, fill: true },
    { t: 'c', cx: 44, cy: 16, r: 2.5, sw: 2,   fill: true },
  ],

  // 8  SHARK FIN — bold fin + waterline + wave
  8: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 3 },
    { t: 'p', d: 'M8,70 C26,70 36,52 44,28 C48,14 52,6 56,6 C60,10 70,36 78,60 C82,68 90,70 92,70', sw: 6 },
    { t: 'p', d: 'M6,70 H94',  sw: 4.5 },
    { t: 'p', d: 'M6,80 C16,76 24,84 36,80 C48,76 58,84 70,80 C82,76 88,82 94,78', sw: 3 },
  ],

  // 9  POKER CHIP — outer ring + 8 edge marks + inner ring
  9: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 3 },
    { t: 'c', cx: 50, cy: 50, r: 40, sw: 6 },
    { t: 'p', d: 'M50,10 V22 M50,78 V90 M10,50 H22 M78,50 H90 M21,21 L30,30 M79,21 L70,30 M21,79 L30,70 M79,79 L70,70', sw: 5 },
    { t: 'c', cx: 50, cy: 50, r: 24, sw: 4 },
  ],

  // 10 MOON PHASE — filled crescent + 2 stars
  10: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 3 },
    { t: 'p', d: 'M22,10 C58,10 78,26 78,50 C78,74 58,90 22,90 C42,82 56,68 56,50 C56,32 42,18 22,10 Z', sw: 4.5, fill: true },
    { t: 'c', cx: 80, cy: 22, r: 5,   sw: 3.5, fill: true },
    { t: 'c', cx: 88, cy: 44, r: 3.5, sw: 2.5, fill: true },
  ],

  // 11 NEON ROSE — petal ring + inner ring + stem + leaf
  11: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 3 },
    { t: 'p', d: 'M50,14 C64,10 76,20 76,34 C82,26 88,42 80,52 C90,58 84,72 72,72 C76,82 66,92 50,90 C34,92 24,82 28,72 C16,72 10,58 20,52 C12,42 18,26 24,34 C24,20 36,10 50,14 Z', sw: 4.5 },
    { t: 'c', cx: 50, cy: 50, r: 14, sw: 3.5 },
    { t: 'p', d: 'M50,90 V98',               sw: 4.5 },
    { t: 'p', d: 'M50,92 C44,94 34,90 30,84', sw: 3.5 },
  ],

  // 12 CHERRY — 2 filled berries + branching stems + shine
  12: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 3 },
    { t: 'c', cx: 28, cy: 68, r: 20, sw: 5, fill: true },
    { t: 'c', cx: 68, cy: 72, r: 20, sw: 5, fill: true },
    { t: 'p', d: 'M28,48 C30,28 42,16 50,8', sw: 4.5 },
    { t: 'p', d: 'M68,52 C66,30 56,16 50,8', sw: 4.5 },
    { t: 'p', d: 'M28,48 C40,40 56,42 68,52', sw: 4 },
    { t: 'c', cx: 36, cy: 64, r: 6, sw: 3.5 },
    { t: 'c', cx: 76, cy: 68, r: 6, sw: 3.5 },
  ],

  // 13 EIGHT BALL — outer ring + label circle + numeral 8
  13: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 3 },
    { t: 'c', cx: 50, cy: 50, r: 40, sw: 6 },
    { t: 'c', cx: 50, cy: 50, r: 20, sw: 4.5 },
    { t: 'txt', x: 50, y: 58, text: '8', size: 24 },
  ],

  // 14 SUNSET GRID — filled semicircle sun + horizon + receding grid
  14: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 3 },
    { t: 'p', d: 'M6,52 C6,26 26,8 50,8 C74,8 94,26 94,52 Z', sw: 4, fill: true },
    { t: 'p', d: 'M6,52 H94',  sw: 5 },
    { t: 'p', d: 'M6,64 H94',  sw: 3.5 },
    { t: 'p', d: 'M6,76 H94',  sw: 3 },
    { t: 'p', d: 'M6,88 H94',  sw: 2.5 },
    { t: 'p', d: 'M50,52 L6,88 M50,52 L24,88 M50,52 L50,88 M50,52 L76,88 M50,52 L94,88', sw: 2 },
  ],

  // 15 SNAKE — S-curve body + open mouth + forked tongue + eyes
  15: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 3 },
    { t: 'p', d: 'M50,22 C72,22 84,38 82,54 C80,70 58,74 50,84 C42,92 38,98 52,100 C66,102 74,90 74,78', sw: 6 },
    { t: 'p', d: 'M38,18 C38,24 44,26 50,26 C56,26 62,24 62,18', sw: 4.5 },
    { t: 'p', d: 'M44,15 L46,8 M56,15 L54,8', sw: 4 },
    { t: 'c', cx: 43, cy: 28, r: 3, sw: 2.5, fill: true },
    { t: 'c', cx: 57, cy: 28, r: 3, sw: 2.5, fill: true },
  ],

  // 16 KATANA — filled blade + guard + handle
  16: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 3 },
    { t: 'p', d: 'M18,84 L76,14 C80,10 86,10 88,14 C90,18 86,22 82,26 L18,84 Z', sw: 3, fill: true },
    { t: 'p', d: 'M22,80 L32,70', sw: 11 },
    { t: 'p', d: 'M12,90 L22,80', sw: 5 },
    { t: 'p', d: 'M8,94 C8,98 12,98 14,96 L22,84', sw: 3.5 },
  ],

  // 17 SKULL — dome + hollow eyes + jaw teeth
  17: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 3 },
    { t: 'p', d: 'M14,56 C14,30 30,10 50,10 C70,10 86,30 86,56 C86,72 78,84 68,88 L68,96 H32 L32,88 C22,84 14,72 14,56 Z', sw: 5 },
    { t: 'c', cx: 34, cy: 54, r: 12, sw: 4.5 },
    { t: 'c', cx: 66, cy: 54, r: 12, sw: 4.5 },
    { t: 'p', d: 'M38,88 V96 M50,88 V96 M62,88 V96', sw: 5 },
  ],

  // 18 SATURN — sphere + diagonal ring
  18: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 3 },
    { t: 'c', cx: 50, cy: 50, r: 22, sw: 6 },
    { t: 'p', d: 'M4,32 C20,12 80,86 96,66', sw: 6 },
  ],

  // 19 FIRE — 3 filled flame tongues
  19: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 3 },
    { t: 'p', d: 'M28,92 C14,84 12,68 20,56 C18,66 22,62 28,50 C26,62 32,60 38,44 C36,58 28,78 28,92 Z', sw: 3.5, fill: true },
    { t: 'p', d: 'M72,92 C72,78 64,58 62,44 C68,60 74,62 72,50 C78,62 82,66 80,56 C88,68 86,84 72,92 Z', sw: 3.5, fill: true },
    { t: 'p', d: 'M50,94 C34,88 22,72 28,56 C24,68 30,62 36,48 C32,62 40,60 44,40 C42,56 48,58 50,8 C52,58 58,56 56,40 C60,60 68,62 64,48 C70,62 76,68 72,56 C78,72 66,88 50,94 Z', sw: 4, fill: true },
  ],

  // 20 ACE CARD — card rectangle + large A + pip
  20: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 3 },
    { t: 'p', d: 'M18,8 Q16,8 16,10 L16,92 Q16,94 18,94 L82,94 Q84,94 84,92 L84,10 Q84,8 82,8 Z', sw: 4.5 },
    { t: 'txt', x: 50, y: 66, text: 'A', size: 56 },
    { t: 'p', d: 'M23,20 L27,12 L31,20 H23 M25,20 L27,26', sw: 2 },
  ],

  // 21 WOLF HEAD — angular polygon + ear spikes + eyes + muzzle
  21: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 3 },
    { t: 'p', d: 'M50,8 L26,20 L14,52 L24,76 L50,92 L76,76 L86,52 L74,20 Z', sw: 5 },
    { t: 'p', d: 'M26,20 L14,2 L34,14',  sw: 4.5 },
    { t: 'p', d: 'M74,20 L86,2 L66,14',  sw: 4.5 },
    { t: 'c', cx: 35, cy: 46, r: 9, sw: 4, fill: true },
    { t: 'c', cx: 65, cy: 46, r: 9, sw: 4, fill: true },
    { t: 'p', d: 'M44,62 C46,58 54,58 56,62 C54,66 46,66 44,62 Z', sw: 3, fill: true },
    { t: 'p', d: 'M36,74 C42,82 46,86 50,86 C54,86 58,82 64,74', sw: 3.5 },
  ],

  // 22 CROWN — W-crown silhouette + 3 gem dots
  22: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 3 },
    { t: 'p', d: 'M8,82 H92 V66 L72,40 L60,56 L50,24 L40,56 L28,40 L8,66 Z', sw: 5 },
    { t: 'c', cx: 28, cy: 44, r: 5, sw: 3.5, fill: true },
    { t: 'c', cx: 50, cy: 28, r: 5, sw: 3.5, fill: true },
    { t: 'c', cx: 72, cy: 44, r: 5, sw: 3.5, fill: true },
  ],

  // 23 VINYL RECORD — outer groove + 3 inner rings + centre dot
  23: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 3 },
    { t: 'c', cx: 50, cy: 50, r: 40, sw: 5.5 },
    { t: 'c', cx: 50, cy: 50, r: 28, sw: 2.5 },
    { t: 'c', cx: 50, cy: 50, r: 18, sw: 2.5 },
    { t: 'c', cx: 50, cy: 50, r: 10, sw: 3 },
    { t: 'c', cx: 50, cy: 50, r: 5,  sw: 3.5, fill: true },
  ],

  // 24 SPORTS CAR (FRONT VIEW) — hood + body + bumper + headlights + grille
  24: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 3 },
    { t: 'p', d: 'M22,36 Q24,24 50,22 Q76,24 78,36 L84,54 L16,54 Z', sw: 4 },
    { t: 'p', d: 'M14,54 L12,72 L88,72 L86,54 Z', sw: 4.5 },
    { t: 'p', d: 'M10,72 L12,84 L88,84 L90,72 Z', sw: 4 },
    { t: 'c', cx: 26, cy: 62, r: 10, sw: 4 },
    { t: 'c', cx: 74, cy: 62, r: 10, sw: 4 },
    { t: 'c', cx: 26, cy: 62, r: 4.5, sw: 3, fill: true },
    { t: 'c', cx: 74, cy: 62, r: 4.5, sw: 3, fill: true },
    { t: 'p', d: 'M40,62 H60 V70 H40 Z', sw: 2 },
  ],

  // 25 SCORPION — body + pincers + claws + legs + stinger tail
  25: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 3 },
    { t: 'c', cx: 50, cy: 46, r: 12, sw: 5 },
    { t: 'p', d: 'M38,42 C26,32 12,36 8,46 C12,56 26,52 38,50', sw: 4 },
    { t: 'p', d: 'M62,42 C74,32 88,36 92,46 C88,56 74,52 62,50', sw: 4 },
    { t: 'p', d: 'M8,46 L4,40 M8,46 L4,52',     sw: 3.5 },
    { t: 'p', d: 'M92,46 L96,40 M92,46 L96,52',  sw: 3.5 },
    { t: 'p', d: 'M42,54 L28,62 M44,60 L28,72',  sw: 2.5 },
    { t: 'p', d: 'M58,54 L72,62 M56,60 L72,72',  sw: 2.5 },
    { t: 'p', d: 'M50,58 C50,70 60,80 64,90 C68,98 62,102 58,96', sw: 4.5 },
    { t: 'p', d: 'M58,96 L53,88 M58,96 L64,88',  sw: 4.5 },
  ],

  // 26 DRAGON — Eastern dragon sinuous S-body + horns + eye
  26: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 3 },
    { t: 'p', d: 'M16,26 C16,14 28,8 38,14 C46,20 42,32 30,34 C22,36 14,42 14,52 C14,62 22,68 32,66 C42,64 50,56 52,46 C54,36 50,24 60,18 C70,12 82,16 86,26 C90,36 84,46 74,48 C64,50 56,58 58,68 C60,78 70,84 80,82 C90,80 94,70 90,62', sw: 5.5 },
    { t: 'c', cx: 20, cy: 22, r: 4.5, sw: 3, fill: true },
    { t: 'p', d: 'M12,24 L6,16', sw: 4 },
    { t: 'p', d: 'M24,14 L18,8',  sw: 4 },
  ],

  // 27 ANCHOR — ring + crossbar + shaft + curved hooks
  27: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 3 },
    { t: 'c', cx: 50, cy: 20, r: 11, sw: 5 },
    { t: 'p', d: 'M26,46 H74',   sw: 5.5 },
    { t: 'p', d: 'M50,30 V88',   sw: 5.5 },
    { t: 'p', d: 'M14,88 C14,66 30,64 50,88 C70,64 86,66 86,88', sw: 5.5 },
  ],

  // 28 HOURGLASS — two triangles + top/bottom bars + sand fill
  28: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 3 },
    { t: 'p', d: 'M12,8 H88 L50,50 L88,92 H12 L50,50 Z', sw: 5 },
    { t: 'p', d: 'M12,8 H88',  sw: 4.5 },
    { t: 'p', d: 'M12,92 H88', sw: 4.5 },
    { t: 'p', d: 'M16,16 C26,24 40,36 50,50', sw: 3, fill: true },
  ],

  // 29 COMPASS STAR — filled 8-point navigation star + centre ring
  29: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 3 },
    { t: 'p', d: 'M50,6 L54,44 L86,16 L58,46 L94,50 L58,54 L86,84 L54,56 L50,94 L46,56 L14,84 L42,54 L6,50 L42,46 L14,16 L46,44 Z', sw: 4, fill: true },
    { t: 'c', cx: 50, cy: 50, r: 9, sw: 3.5 },
  ],

  // 30 TIGER EYE — wide almond + iris ring + slit pupil + shine dot
  30: [
    { t: 'c', cx: 50, cy: 50, r: 44, sw: 3 },
    { t: 'p', d: 'M4,50 C16,16 84,16 96,50 C84,84 16,84 4,50 Z', sw: 5.5 },
    { t: 'c', cx: 50, cy: 50, r: 22, sw: 4.5 },
    { t: 'p', d: 'M50,28 C56,36 56,64 50,72 C44,64 44,36 50,28 Z', sw: 4, fill: true },
    { t: 'c', cx: 60, cy: 38, r: 5, sw: 3, fill: true },
  ],
};

// ─── Icon renderer ─────────────────────────────────────────────────────────────
// Double-pass: glow layer first (wide stroke, low opacity) then crisp core layer.
// All elements are direct react-native-svg primitives — no custom wrappers.
function NeonIcon({ id, color }: { id: number; color: string }) {
  const ops   = I[id] ?? I[29];
  const nodes: React.ReactNode[] = [];

  ops.forEach((op, i) => {
    if (op.t === 'p') {
      const sw  = op.sw ?? 4;
      const f   = op.fill ? color : 'none';
      const fo1 = op.fill ? 0.18 : 0;
      const fo2 = op.fill ? 0.92 : 0;
      nodes.push(
        <Path key={`g${i}`} d={op.d}
          stroke={color} strokeWidth={sw * 2.6} strokeOpacity={0.32}
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
      const fo1 = op.fill ? 0.20 : 0;
      const fo2 = op.fill ? 0.88 : 0;
      nodes.push(
        <Circle key={`g${i}`} cx={op.cx} cy={op.cy} r={op.r}
          stroke={color} strokeWidth={sw * 2.6} strokeOpacity={0.32}
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
  const avatar      = getNeonAvatar(avatarId);
  const rarityColor = NEON_RARITY_COLORS[avatar.rarity];
  const borderWidth = NEON_RARITY_BORDER[avatar.rarity];

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
      0.22,
      avatar.rarity === 'LEGENDARY' ? 0.80
        : avatar.rarity === 'EPIC'  ? 0.50
        : 0.32,
    ],
  });

  const glowSize = size + 14;
  const inner    = size - borderWidth * 2;
  const xpLabel  = isLocked
    ? avatar.unlockXP >= 1000
      ? `${(avatar.unlockXP / 1000).toFixed(0)}K XP`
      : `${avatar.unlockXP} XP`
    : undefined;

  return (
    <View style={[{ width: size, height: size }, style]}>

      {/* Epic / Legendary animated glow halo */}
      {(avatar.rarity === 'LEGENDARY' || avatar.rarity === 'EPIC') && (
        <Animated.View style={{
          position: 'absolute',
          top:    -(glowSize - size) / 2,
          left:   -(glowSize - size) / 2,
          width:   glowSize,
          height:  glowSize,
          borderRadius: glowSize / 2,
          backgroundColor: rarityColor,
          opacity: glowOpacity,
        }} />
      )}

      {/* Circular badge */}
      <View style={{
        width: size, height: size,
        borderRadius: size / 2,
        borderWidth,
        borderColor: isEquipped ? '#ffffff' : rarityColor,
        overflow: 'hidden',
        backgroundColor: '#050010',
      }}>

        {/* Subtle background gradient */}
        <LinearGradient
          colors={[avatar.bgColor, '#050010']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />

        {/* SVG icon — fills entire inner area */}
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
