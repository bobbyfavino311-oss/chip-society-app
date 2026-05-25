// ─── CharacterPortrait — SVG Human Portrait System ────────────────────────────
// Every character is a fully illustrated SVG portrait:
//   unique face shape, skin tone, hair style & color, eyes, clothing, accessories.
// NO emoji. NO initials. NO monograms. Real illustrated human characters.

import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';
import {
  Character,
  CharacterVisuals,
  RARITY_BORDER_WIDTH,
  RARITY_COLORS,
} from '@/constants/characters';

// ── Face coordinate map by shape (viewBox 0 0 80 80) ─────────────────────────
const FC: Record<string, { top: number; eyeY: number; noseY: number; mouthY: number; chinY: number }> = {
  oval:    { top: 13, eyeY: 33, noseY: 41, mouthY: 48, chinY: 55 },
  square:  { top: 13, eyeY: 34, noseY: 42, mouthY: 49, chinY: 55 },
  angular: { top: 12, eyeY: 33, noseY: 42, mouthY: 49, chinY: 57 },
  round:   { top: 11, eyeY: 35, noseY: 44, mouthY: 51, chinY: 59 },
  heart:   { top: 12, eyeY: 33, noseY: 41, mouthY: 48, chinY: 57 },
};

// ── Colour helpers ────────────────────────────────────────────────────────────
function darken(hex: string, amount = 0.25): string {
  if (!hex.startsWith('#') || hex.length < 7) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const f = 1 - amount;
  return `rgb(${Math.min(255, Math.round(r * f))},${Math.min(255, Math.round(g * f))},${Math.min(255, Math.round(b * f))})`;
}

function lipColour(skin: string): string {
  if (!skin.startsWith('#') || skin.length < 7) return '#b07060';
  const r = parseInt(skin.slice(1, 3), 16);
  const g = parseInt(skin.slice(3, 5), 16);
  const b = parseInt(skin.slice(5, 7), 16);
  return `rgb(${Math.min(255, r + 10)},${Math.round(g * 0.72)},${Math.round(b * 0.65)})`;
}

// ── Face shape paths ──────────────────────────────────────────────────────────
function getFacePath(s: string): string {
  switch (s) {
    case 'square':
      return 'M28,13 L52,13 C55,13 57,16 57,21 L57,46 C57,52 50,55 40,55 C30,55 23,52 23,46 L23,21 C23,16 25,13 28,13 Z';
    case 'angular':
      return 'M40,12 C52,10 60,20 59,31 C58,42 51,51 47,55 L40,57 L33,55 C29,51 22,42 21,31 C20,20 28,10 40,12 Z';
    case 'round':
      return 'M40,11 C57,11 62,23 62,37 C62,51 52,59 40,59 C28,59 18,51 18,37 C18,23 23,11 40,11 Z';
    case 'heart':
      return 'M40,12 C52,10 59,20 57,31 C55,42 49,50 45,53 L40,57 L35,53 C31,50 25,42 23,31 C21,20 28,10 40,12 Z';
    default:
      return 'M40,13 C53,13 57,24 57,35 C57,47 50,55 40,55 C30,55 23,47 23,35 C23,24 27,13 40,13 Z';
  }
}

function getEarPaths(shape: string): [string, string] {
  const rnd = shape === 'round';
  const lx = rnd ? 18 : 23;
  const rx = rnd ? 62 : 57;
  const ey = rnd ? 35 : 33;
  return [
    `M${lx},${ey - 2} C${lx - 6},${ey - 2} ${lx - 8},${ey + 2} ${lx - 8},${ey + 5} C${lx - 8},${ey + 9} ${lx - 6},${ey + 11} ${lx},${ey + 10}`,
    `M${rx},${ey - 2} C${rx + 6},${ey - 2} ${rx + 8},${ey + 2} ${rx + 8},${ey + 5} C${rx + 8},${ey + 9} ${rx + 6},${ey + 11} ${rx},${ey + 10}`,
  ];
}

// ── Hair — back layer (behind face) ──────────────────────────────────────────
function HairBack({ style, color }: { style: string; color: string }): React.ReactElement | null {
  if (style !== 'long') return null;
  return (
    <Path
      d="M14,65 C12,42 16,14 23,13 C24,8 30,4 40,4 C50,4 56,8 57,13 C64,14 68,42 66,65 Z"
      fill={color}
      opacity={0.95}
    />
  );
}

// ── Hair — front layer (covers forehead) ─────────────────────────────────────
function HairFront({ style, color, ft }: { style: string; color: string; ft: number }): React.ReactElement | null {
  if (style === 'bald') return null;
  switch (style) {
    case 'slicked':
      return <Path d={`M23,${ft} C24,7 31,3 40,3 C49,3 56,7 57,${ft} L55,${ft + 7} C52,${ft + 1} 46,${ft - 2} 40,${ft - 2} C34,${ft - 2} 28,${ft + 1} 25,${ft + 7} Z`} fill={color} />;

    case 'undercut':
      return <Path d={`M26,${ft} C27,6 33,2 40,2 C47,2 53,6 54,${ft} L53,${ft + 9} C50,${ft + 1} 46,${ft - 4} 40,${ft - 4} C34,${ft - 4} 30,${ft + 1} 27,${ft + 9} Z`} fill={color} />;

    case 'curly':
      return (
        <G>
          <Path d={`M19,${ft + 7} C17,11 21,2 27,3 C25,-1 32,-3 38,2 C36,-2 44,-2 44,2 C49,-1 56,0 54,3 C60,2 63,11 61,${ft + 7} C58,${ft} 52,${ft - 5} 46,${ft - 5} L40,${ft - 7} L34,${ft - 5} C28,${ft - 5} 22,${ft} 19,${ft + 7} Z`} fill={color} />
          <Path d={`M19,${ft + 4} C22,${ft + 1} 26,${ft + 3} 28,${ft + 1} C30,${ft - 1} 34,${ft + 1} 36,${ft - 1} C38,${ft - 3} 42,${ft - 3} 44,${ft - 1} C46,${ft + 1} 50,${ft - 1} 52,${ft + 1} C54,${ft + 3} 58,${ft + 1} 60,${ft + 4}`} stroke={darken(color, 0.2)} strokeWidth={0.7} fill="none" opacity={0.5} />
        </G>
      );

    case 'mohawk':
      return <Path d={`M36,${ft} C35,6 37,0 40,0 C43,0 45,6 44,${ft} L43,${ft + 8} C42,${ft + 2} 41,${ft - 1} 40,${ft - 1} C39,${ft - 1} 38,${ft + 2} 37,${ft + 8} Z`} fill={color} />;

    case 'long':
      return (
        <G>
          <Path d={`M23,${ft} C18,${ft} 15,22 16,44 L14,44 C13,22 18,${ft - 2} 23,${ft + 1} Z`} fill={color} />
          <Path d={`M57,${ft} C62,${ft} 65,22 64,44 L66,44 C67,22 62,${ft - 2} 57,${ft + 1} Z`} fill={color} />
          <Path d={`M23,${ft} C24,7 31,3 40,3 C49,3 56,7 57,${ft} L56,${ft + 6} C53,${ft} 47,${ft - 3} 40,${ft - 3} C33,${ft - 3} 27,${ft} 24,${ft + 6} Z`} fill={color} />
        </G>
      );

    case 'buzz':
      return <Path d={`M23,${ft} C23,8 27,5 40,5 C53,5 57,8 57,${ft} L57,${ft + 2} C57,9 53,6 40,6 C27,6 23,9 23,${ft + 2} Z`} fill={color} opacity={0.9} />;

    case 'waves':
      return (
        <G>
          <Path d={`M22,${ft + 1} C21,7 25,3 40,3 C55,3 59,7 58,${ft + 1} L56,${ft + 7} C53,${ft} 47,${ft - 4} 40,${ft - 4} C33,${ft - 4} 27,${ft} 24,${ft + 7} Z`} fill={color} />
          <Path d={`M26,${ft - 1} C30,${ft - 4} 34,${ft - 2} 38,${ft - 4} C42,${ft - 6} 46,${ft - 4} 50,${ft - 6} C54,${ft - 4} 56,${ft - 2} 58,${ft - 1}`} stroke={darken(color, 0.2)} strokeWidth={0.7} fill="none" opacity={0.6} />
        </G>
      );

    case 'dreads': {
      const xs = [25, 31, 37, 40, 43, 49, 55];
      return (
        <G>
          {xs.map((x, i) => (
            <Path key={i} d={`M${x - 2.5},${ft} C${x - 3.5},${ft - 5} ${x - 2.5},${ft - 11} ${x},${ft - 9} C${x + 2.5},${ft - 11} ${x + 3.5},${ft - 5} ${x + 2.5},${ft} Z`} fill={color} />
          ))}
          <Path d={`M23,${ft} C25,${ft - 3} 55,${ft - 3} 57,${ft}`} stroke={color} strokeWidth={3} fill="none" />
        </G>
      );
    }

    case 'ponytail':
      return (
        <G>
          <Path d={`M25,${ft + 1} C24,7 29,3 40,3 C51,3 56,7 55,${ft + 1} L53,${ft + 8} C50,${ft + 1} 46,${ft - 3} 40,${ft - 3} C34,${ft - 3} 30,${ft + 1} 27,${ft + 8} Z`} fill={color} />
          <Ellipse cx={40} cy={ft - 4} rx={7} ry={4} fill={color} />
        </G>
      );

    case 'bob':
      return <Path d={`M22,${ft + 1} C21,7 26,3 40,3 C54,3 59,7 58,${ft + 1} L57,43 C53,47 47,50 40,50 C33,50 27,47 23,43 Z`} fill={color} opacity={0.95} />;

    case 'fauxhawk':
      return <Path d={`M24,${ft + 5} C23,11 27,7 31,6 L34,4 C36,1 38,-1 40,-1 C42,-1 44,1 46,4 L49,6 C53,7 57,11 56,${ft + 5} L54,${ft + 10} C52,${ft + 2} 46,${ft - 2} 40,${ft - 2} C34,${ft - 2} 28,${ft + 2} 26,${ft + 10} Z`} fill={color} />;

    default:
      return null;
  }
}

// ── Neck ──────────────────────────────────────────────────────────────────────
function Neck({ chinY, skinTone }: { chinY: number; skinTone: string }): React.ReactElement {
  return <Path d={`M35,${chinY} L33,${chinY + 8} L47,${chinY + 8} L45,${chinY} Z`} fill={skinTone} />;
}

// ── Clothing ──────────────────────────────────────────────────────────────────
function Clothing({ style, color, chinY }: { style: string; color: string; chinY: number }): React.ReactElement {
  const by = chinY + 7;
  const dk = darken(color, 0.2);

  switch (style) {
    case 'suit':
    case 'blazer': {
      const shirtCol = style === 'blazer' ? '#909090' : '#d8d4ca';
      return (
        <G>
          <Path d={`M0,${by} L0,80 L80,80 L80,${by} L55,${by - 4} L48,${by} C44,${by + 4} 36,${by + 4} 32,${by} L25,${by - 4} Z`} fill={color} />
          <Path d={`M32,${by} L25,${by - 4} L20,${by + 4} L28,${by + 11} L36,${by + 9} Z`} fill={dk} />
          <Path d={`M48,${by} L55,${by - 4} L60,${by + 4} L52,${by + 11} L44,${by + 9} Z`} fill={dk} />
          <Path d={`M36,${by + 7} L44,${by + 7} L43,${by + 19} L40,${by + 21} L37,${by + 19} Z`} fill={shirtCol} opacity={0.9} />
          {style === 'suit' && (
            <Path d={`M38,${by + 7} L42,${by + 7} L41,${by + 19} L40,${by + 21} L39,${by + 19} Z`} fill="#6b1010" opacity={0.9} />
          )}
        </G>
      );
    }

    case 'leather_jacket':
      return (
        <G>
          <Path d={`M0,${by} L0,80 L80,80 L80,${by} L54,${by - 5} L48,${by - 1} C44,${by + 3} 36,${by + 3} 32,${by - 1} L26,${by - 5} Z`} fill={color} />
          <Path d={`M32,${by - 1} L26,${by - 5} L22,${by + 2} L30,${by + 10} Z`} fill={dk} />
          <Path d={`M48,${by - 1} L54,${by - 5} L58,${by + 2} L50,${by + 10} Z`} fill={dk} />
          <Line x1={40} y1={by + 1} x2={40} y2={80} stroke="#666" strokeWidth={0.8} opacity={0.55} />
          <Rect x={38.5} y={by + 1} width={3} height={2.5} rx={0.8} fill="#888" />
        </G>
      );

    case 'turtleneck':
      return (
        <G>
          <Path d={`M0,${by} L0,80 L80,80 L80,${by} L57,${by - 2} L50,${by + 2} C46,${by + 6} 34,${by + 6} 30,${by + 2} L23,${by - 2} Z`} fill={color} />
          <Path d={`M30,${by + 2} C30,${by - 2} 50,${by - 2} 50,${by + 2} L50,${by + 10} C50,${by + 12} 30,${by + 12} 30,${by + 10} Z`} fill={dk} />
        </G>
      );

    case 'hoodie':
      return (
        <G>
          <Path d={`M0,${by} L0,80 L80,80 L80,${by} L57,${by - 3} L51,${by + 1} C47,${by + 5} 33,${by + 5} 29,${by + 1} L23,${by - 3} Z`} fill={color} />
          <Path d={`M17,${chinY - 10} C12,${chinY - 6} 12,${by} 23,${by - 3} L23,${by - 1} C11,${by + 1} 10,${chinY - 4} 15,${chinY - 12} Z`} fill={dk} />
          <Path d={`M63,${chinY - 10} C68,${chinY - 6} 68,${by} 57,${by - 3} L57,${by - 1} C69,${by + 1} 70,${chinY - 4} 65,${chinY - 12} Z`} fill={dk} />
          <Path d={`M31,${by + 11} C31,${by + 9} 49,${by + 9} 49,${by + 11} L49,${by + 21} C49,${by + 23} 31,${by + 23} 31,${by + 21} Z`} fill={dk} opacity={0.55} />
        </G>
      );

    case 'open_shirt': {
      const shirt = '#b0a898';
      return (
        <G>
          <Path d={`M0,${by} L0,80 L80,80 L80,${by} L54,${by - 3} L46,${by + 1} C43,${by + 3} 37,${by + 3} 34,${by + 1} L26,${by - 3} Z`} fill={color} />
          <Path d={`M34,${by + 1} L26,${by - 3} L28,${by - 7} L36,${by + 2} Z`} fill={shirt} opacity={0.85} />
          <Path d={`M46,${by + 1} L54,${by - 3} L52,${by - 7} L44,${by + 2} Z`} fill={shirt} opacity={0.85} />
          <Path d={`M36,${by + 2} L44,${by + 2} L44,${by + 12} C42,${by + 11} 40,${by + 13} 38,${by + 11} Z`} fill={shirt} opacity={0.45} />
          <Circle cx={40} cy={by + 5} r={1.1} fill="#888" />
          <Circle cx={40} cy={by + 10} r={1.1} fill="#888" />
        </G>
      );
    }

    default:
      return <Path d={`M0,${by} L0,80 L80,80 L80,${by} Z`} fill={color} />;
  }
}

// ── Eyes ──────────────────────────────────────────────────────────────────────
function Eyes({ style, eyeColor, eyeY, browColor }: {
  style: string; eyeColor: string; eyeY: number; browColor: string;
}): React.ReactElement {
  const lx = 30, rx = 50;
  const sc = '#efece0';
  const szMap: Record<string, [number, number]> = {
    normal: [4.5, 2.8], wide: [5.0, 3.5], hooded: [4.5, 2.2], sharp: [5.5, 2.0], almond: [5.0, 2.5],
  };
  const [rxv, ryv] = szMap[style] ?? szMap.normal;
  const bw = (style === 'sharp' || style === 'hooded') ? 2.0 : 1.4;
  const ir = Math.min(2.2, ryv * 0.82);
  const pr = Math.min(1.3, ryv * 0.5);
  const by2 = eyeY - 6;

  return (
    <G>
      <Path d={`M${lx - 5},${by2} C${lx - 2},${by2 - 3} ${lx + 2},${by2 - 3} ${lx + 5},${by2}`} stroke={browColor} strokeWidth={bw} fill="none" strokeLinecap="round" />
      <Path d={`M${rx - 5},${by2} C${rx - 2},${by2 - 3} ${rx + 2},${by2 - 3} ${rx + 5},${by2}`} stroke={browColor} strokeWidth={bw} fill="none" strokeLinecap="round" />
      <Ellipse cx={lx} cy={eyeY} rx={rxv} ry={ryv} fill={sc} />
      <Circle cx={lx} cy={eyeY} r={ir} fill={eyeColor} />
      <Circle cx={lx} cy={eyeY} r={pr} fill="#080606" />
      <Circle cx={lx + 1} cy={eyeY - 0.8} r={0.7} fill="rgba(255,255,255,0.88)" />
      <Ellipse cx={rx} cy={eyeY} rx={rxv} ry={ryv} fill={sc} />
      <Circle cx={rx} cy={eyeY} r={ir} fill={eyeColor} />
      <Circle cx={rx} cy={eyeY} r={pr} fill="#080606" />
      <Circle cx={rx + 1} cy={eyeY - 0.8} r={0.7} fill="rgba(255,255,255,0.88)" />
      {(style === 'hooded' || style === 'sharp') && (
        <G>
          <Path d={`M${lx - rxv},${eyeY} C${lx - rxv * 0.4},${eyeY - ryv * 1.2} ${lx + rxv * 0.4},${eyeY - ryv * 1.2} ${lx + rxv},${eyeY}`} fill="rgba(0,0,0,0.2)" />
          <Path d={`M${rx - rxv},${eyeY} C${rx - rxv * 0.4},${eyeY - ryv * 1.2} ${rx + rxv * 0.4},${eyeY - ryv * 1.2} ${rx + rxv},${eyeY}`} fill="rgba(0,0,0,0.2)" />
        </G>
      )}
    </G>
  );
}

// ── Nose ──────────────────────────────────────────────────────────────────────
function Nose({ noseY }: { noseY: number }): React.ReactElement {
  return (
    <G>
      <Path d={`M40,${noseY - 5} C39,${noseY - 2} 37,${noseY + 1} 37,${noseY + 2} C38,${noseY + 4} 42,${noseY + 4} 43,${noseY + 2} C43,${noseY + 1} 41,${noseY - 2} 40,${noseY - 5}`} stroke="rgba(0,0,0,0.25)" strokeWidth={0.6} fill="none" />
      <Circle cx={37.5} cy={noseY + 3} r={1.3} fill="rgba(0,0,0,0.22)" />
      <Circle cx={42.5} cy={noseY + 3} r={1.3} fill="rgba(0,0,0,0.22)" />
    </G>
  );
}

// ── Mouth ─────────────────────────────────────────────────────────────────────
function Mouth({ mouthY, skin }: { mouthY: number; skin: string }): React.ReactElement {
  const lip = lipColour(skin);
  return (
    <G>
      <Path d={`M33,${mouthY} C35,${mouthY - 2} 38,${mouthY - 2} 40,${mouthY - 1} C42,${mouthY - 2} 45,${mouthY - 2} 47,${mouthY}`} stroke={lip} strokeWidth={0.9} fill="none" strokeLinecap="round" />
      <Path d={`M33,${mouthY} C36,${mouthY + 2} 44,${mouthY + 2} 47,${mouthY}`} stroke={lip} strokeWidth={1.2} fill={lip} fillOpacity={0.28} strokeLinecap="round" />
    </G>
  );
}

// ── Facial hair ───────────────────────────────────────────────────────────────
function FacialHair({ type, color, mouthY, chinY }: {
  type: string; color: string; mouthY: number; chinY: number;
}): React.ReactElement | null {
  if (type === 'none') return null;
  const op = 0.88;
  switch (type) {
    case 'stubble':
      return <Path d={`M27,${mouthY - 3} C26,${mouthY - 6} 28,${mouthY - 8} 30,${mouthY - 8} L50,${mouthY - 8} C52,${mouthY - 8} 54,${mouthY - 6} 53,${mouthY - 3} L53,${chinY - 3} C51,${chinY - 1} 46,${chinY + 1} 40,${chinY + 1} C34,${chinY + 1} 29,${chinY - 1} 27,${chinY - 3} Z`} fill={color} opacity={0.26} />;
    case 'mustache':
      return <Path d={`M30,${mouthY - 2} C32,${mouthY - 6} 38,${mouthY - 7} 40,${mouthY - 4} C42,${mouthY - 7} 48,${mouthY - 6} 50,${mouthY - 2} C47,${mouthY - 1} 43,${mouthY - 2} 40,${mouthY} C37,${mouthY - 2} 33,${mouthY - 1} 30,${mouthY - 2} Z`} fill={color} opacity={op} />;
    case 'goatee':
      return (
        <G>
          <Path d={`M33,${mouthY - 2} C35,${mouthY - 6} 45,${mouthY - 6} 47,${mouthY - 2} C44,${mouthY - 1} 40,${mouthY} 36,${mouthY - 1} Z`} fill={color} opacity={op} />
          <Path d={`M34,${mouthY + 1} C34,${chinY - 2} 36,${chinY} 40,${chinY} C44,${chinY} 46,${chinY - 2} 46,${mouthY + 1} C44,${mouthY} 40,${mouthY + 1} 36,${mouthY} Z`} fill={color} opacity={op} />
        </G>
      );
    case 'beard':
      return <Path d={`M22,${chinY - 10} C22,${mouthY - 3} 25,${mouthY + 1} 27,${mouthY + 2} L27,${chinY} C30,${chinY + 3} 35,${chinY + 4} 40,${chinY + 4} C45,${chinY + 4} 50,${chinY + 3} 53,${chinY} L53,${mouthY + 2} C55,${mouthY + 1} 58,${mouthY - 3} 58,${chinY - 10} C54,${chinY - 15} 46,${chinY - 17} 40,${chinY - 17} C34,${chinY - 17} 26,${chinY - 15} 22,${chinY - 10} Z`} fill={color} opacity={0.82} />;
    case 'full_beard':
      return <Path d={`M20,${chinY - 12} C19,${mouthY - 5} 22,${mouthY} 24,${mouthY + 1} L24,${chinY + 1} C27,${chinY + 5} 33,${chinY + 7} 40,${chinY + 7} C47,${chinY + 7} 53,${chinY + 5} 56,${chinY + 1} L56,${mouthY + 1} C58,${mouthY} 61,${mouthY - 5} 60,${chinY - 12} C55,${chinY - 17} 46,${chinY - 19} 40,${chinY - 19} C34,${chinY - 19} 25,${chinY - 17} 20,${chinY - 12} Z`} fill={color} opacity={0.88} />;
    default:
      return null;
  }
}

// ── Accessories ───────────────────────────────────────────────────────────────
function Accessories({ list, eyeY, clothingColor, chinY }: {
  list: string[]; eyeY: number; clothingColor: string; chinY: number;
}): React.ReactElement | null {
  if (list.length === 0) return null;
  const by = chinY + 7;
  const gold = '#ffd700';
  const fr = '#a87840';

  return (
    <G>
      {list.includes('glasses') && (
        <G>
          <Rect x={22} y={eyeY - 3.5} width={14} height={9} rx={2} fill="rgba(180,210,255,0.12)" stroke={fr} strokeWidth={0.9} />
          <Rect x={44} y={eyeY - 3.5} width={14} height={9} rx={2} fill="rgba(180,210,255,0.12)" stroke={fr} strokeWidth={0.9} />
          <Line x1={36} y1={eyeY + 1} x2={44} y2={eyeY + 1} stroke={fr} strokeWidth={0.9} />
          <Line x1={22} y1={eyeY + 1} x2={18} y2={eyeY + 3} stroke={fr} strokeWidth={0.8} />
          <Line x1={58} y1={eyeY + 1} x2={62} y2={eyeY + 3} stroke={fr} strokeWidth={0.8} />
        </G>
      )}
      {list.includes('sunglasses') && (
        <G>
          <Rect x={22} y={eyeY - 4} width={14} height={9} rx={3} fill="rgba(0,0,0,0.88)" stroke={fr} strokeWidth={1} />
          <Rect x={44} y={eyeY - 4} width={14} height={9} rx={3} fill="rgba(0,0,0,0.88)" stroke={fr} strokeWidth={1} />
          <Line x1={36} y1={eyeY + 0.5} x2={44} y2={eyeY + 0.5} stroke={fr} strokeWidth={1} />
          <Line x1={22} y1={eyeY + 0.5} x2={18} y2={eyeY + 2} stroke={fr} strokeWidth={0.8} />
          <Line x1={58} y1={eyeY + 0.5} x2={62} y2={eyeY + 2} stroke={fr} strokeWidth={0.8} />
        </G>
      )}
      {list.includes('cyberpunk_visor') && (
        <G>
          <Rect x={18} y={eyeY - 5} width={44} height={12} rx={6} fill="rgba(0,200,255,0.2)" stroke="#00d4ff" strokeWidth={1.2} />
          <Line x1={20} y1={eyeY - 1} x2={60} y2={eyeY - 1} stroke="#00d4ff" strokeWidth={0.4} opacity={0.5} />
          <Line x1={20} y1={eyeY + 2} x2={60} y2={eyeY + 2} stroke="#00d4ff" strokeWidth={0.4} opacity={0.35} />
          <Circle cx={20} cy={eyeY + 1} r={1.5} fill="#00d4ff" opacity={0.8} />
          <Circle cx={60} cy={eyeY + 1} r={1.5} fill="#00d4ff" opacity={0.8} />
        </G>
      )}
      {list.includes('earring') && (
        <G>
          <Circle cx={20} cy={eyeY + 9} r={2.5} fill={gold} />
          <Circle cx={20} cy={eyeY + 9} r={1.2} fill="#ffe566" />
        </G>
      )}
      {list.includes('chain') && (
        <Path d={`M28,${by + 2} C30,${by - 2} 36,${by - 4} 40,${by - 4} C44,${by - 4} 50,${by - 2} 52,${by + 2}`} stroke={gold} strokeWidth={2} fill="none" strokeLinecap="round" />
      )}
      {list.includes('fedora') && (
        <G>
          <Ellipse cx={40} cy={16} rx={24} ry={5} fill={clothingColor} opacity={0.95} />
          <Path d={`M24,16 C24,8 30,4 40,4 C50,4 56,8 56,16`} fill={darken(clothingColor, 0.1)} />
          <Path d={`M24,16 C24,14 56,14 56,16`} stroke="#33332a" strokeWidth={2} fill="none" opacity={0.6} />
        </G>
      )}
      {list.includes('snapback') && (
        <G>
          <Path d={`M24,15 C24,9 29,4 40,4 C51,4 56,9 56,15`} fill={clothingColor} opacity={0.95} />
          <Path d={`M20,15 C20,17 40,19 60,17 L60,15 C50,17 30,17 20,15 Z`} fill={darken(clothingColor, 0.15)} />
          <Rect x={33} y={3} width={14} height={3} rx={1} fill={darken(clothingColor, 0.2)} />
        </G>
      )}
      {list.includes('crown') && (
        <G>
          <Path d={`M22,12 L26,5 L32,11 L40,3 L48,11 L54,5 L58,12 L56,14 L24,14 Z`} fill={gold} />
          <Path d={`M22,12 L22,16 L58,16 L58,12`} fill="#e6a000" />
          <Circle cx={40} cy={5} r={2.2} fill="#ff0040" />
          <Circle cx={28} cy={8} r={1.5} fill="#00d4ff" />
          <Circle cx={52} cy={8} r={1.5} fill="#00d4ff" />
        </G>
      )}
      {list.includes('headset') && (
        <G>
          <Path d={`M17,34 C17,14 63,14 63,34`} stroke="#555" strokeWidth={2.5} fill="none" />
          <Circle cx={17} cy={34} r={7} fill={clothingColor} stroke="#444" strokeWidth={0.8} />
          <Circle cx={17} cy={34} r={4} fill="#2a2a2a" />
          <Circle cx={63} cy={34} r={7} fill={clothingColor} stroke="#444" strokeWidth={0.8} />
          <Circle cx={63} cy={34} r={4} fill="#2a2a2a" />
          <Path d={`M24,39 C22,44 18,48 18,52`} stroke="#555" strokeWidth={1.2} fill="none" />
          <Circle cx={18} cy={53} r={2} fill="#3a3a3a" />
        </G>
      )}
    </G>
  );
}

// ── Neon rim light ────────────────────────────────────────────────────────────
function NeonRim({ color, faceTop, chinY }: { color: string; faceTop: number; chinY: number }): React.ReactElement {
  const mid = (faceTop + chinY) / 2;
  return (
    <G>
      <Path d={`M0,${mid - 20} L0,${mid + 20} L28,${mid + 12} L28,${mid - 12} Z`} fill={color} opacity={0.07} />
      <Path d={`M23,${faceTop + 6} C22,${faceTop + 12} 22,${faceTop + 22} 24,${chinY - 8}`} stroke={color} strokeWidth={1.5} fill="none" opacity={0.2} />
    </G>
  );
}

// ── Lock SVG icon (no emoji) ──────────────────────────────────────────────────
function LockIcon({ size }: { size: number }): React.ReactElement {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={StyleSheet.absoluteFill}>
      <Rect x={4} y={11} width={16} height={12} rx={2.5} fill="rgba(255,255,255,0.45)" />
      <Path d={`M8,11 L8,7 C8,4.8 9.8,3 12,3 C14.2,3 16,4.8 16,7 L16,11`} stroke="rgba(255,255,255,0.45)" strokeWidth={2.2} fill="none" strokeLinecap="round" />
      <Circle cx={12} cy={17} r={2} fill="rgba(255,255,255,0.5)" />
    </Svg>
  );
}

// ── Main SVG face assembler ───────────────────────────────────────────────────
function CharacterFaceSVG({ visuals, size }: { visuals: CharacterVisuals; size: number }): React.ReactElement {
  const { faceShape, skinTone, hairStyle, hairColor, eyeStyle, eyeColor,
    facialHair, clothing, clothingColor, accessories, neonCast } = visuals;
  const c = FC[faceShape] ?? FC.oval;
  const fp = getFacePath(faceShape);
  const [earL, earR] = getEarPaths(faceShape);
  const skinShadow = darken(skinTone, 0.18);

  return (
    <Svg width={size} height={size} viewBox="0 0 80 80" style={StyleSheet.absoluteFill}>
      <HairBack style={hairStyle} color={hairColor} />
      <Path d={earL} fill={skinTone} stroke={skinShadow} strokeWidth={0.3} />
      <Path d={earR} fill={skinTone} stroke={skinShadow} strokeWidth={0.3} />
      <Neck chinY={c.chinY} skinTone={skinTone} />
      <Clothing style={clothing} color={clothingColor} chinY={c.chinY} />
      <Path d={fp} fill={skinTone} />
      <Path
        d={`M40,${c.top} C52,${c.top} 57,${c.top + 10} 57,${c.top + 22} L57,${c.top + 30} C57,${c.chinY - 5} 50,${c.chinY} 40,${c.chinY} Z`}
        fill="rgba(0,0,0,0.09)"
      />
      <NeonRim color={neonCast} faceTop={c.top} chinY={c.chinY} />
      <HairFront style={hairStyle} color={hairColor} ft={c.top} />
      <FacialHair type={facialHair} color={hairColor} mouthY={c.mouthY} chinY={c.chinY} />
      <Eyes style={eyeStyle} eyeColor={eyeColor} eyeY={c.eyeY} browColor={hairColor} />
      <Nose noseY={c.noseY} />
      <Mouth mouthY={c.mouthY} skin={skinTone} />
      <Accessories list={accessories} eyeY={c.eyeY} clothingColor={clothingColor} chinY={c.chinY} />
    </Svg>
  );
}

// ── CharacterPortrait ─────────────────────────────────────────────────────────
interface Props {
  character: Character;
  size?: number;
  showName?: boolean;
  showRarity?: boolean;
  isEquipped?: boolean;
  isLocked?: boolean;
  style?: object;
}

export default function CharacterPortrait({
  character, size = 64, showName = false, showRarity = false,
  isEquipped = false, isLocked = false, style,
}: Props): React.ReactElement {
  const isLegendary = character.rarity === 'LEGENDARY';
  const isEpic      = character.rarity === 'EPIC';
  const glowAnim    = useRef(new Animated.Value(0.35)).current;
  const scaleAnim   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isLegendary) return;
    Animated.loop(Animated.sequence([
      Animated.timing(glowAnim,  { toValue: 1,    duration: 900, useNativeDriver: false }),
      Animated.timing(glowAnim,  { toValue: 0.35, duration: 900, useNativeDriver: false }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.06, duration: 900, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
    ])).start();
  }, [isLegendary]);

  const rarityColor  = RARITY_COLORS[character.rarity];
  const accentColor  = character.accentColor;
  const borderColor  = isEquipped ? accentColor : rarityColor;
  const borderWidth  = RARITY_BORDER_WIDTH[character.rarity] + (isEquipped ? 1 : 0);
  const borderRadius = size * 0.18;
  const glowSize     = size + 16;
  const nameSize     = Math.max(8, size * 0.14);
  const raritySize   = Math.max(6, size * 0.10);

  return (
    <View style={[{ alignItems: 'center', gap: 4 }, style]}>
      {isLegendary && (
        <Animated.View pointerEvents="none" style={{
          position: 'absolute', width: glowSize, height: glowSize,
          borderRadius: glowSize * 0.22, backgroundColor: accentColor,
          opacity: glowAnim,
          top: -(glowSize - size) / 2, left: -(glowSize - size) / 2, zIndex: 0,
        }} />
      )}
      {isEpic && (
        <View pointerEvents="none" style={{
          position: 'absolute', width: glowSize - 6, height: glowSize - 6,
          borderRadius: (glowSize - 6) * 0.2, backgroundColor: accentColor,
          opacity: 0.22,
          top: -(glowSize - 6 - size) / 2, left: -(glowSize - 6 - size) / 2, zIndex: 0,
        }} />
      )}

      <Animated.View style={{
        width: size, height: size, borderRadius, borderWidth, borderColor,
        overflow: 'hidden',
        shadowColor: accentColor,
        shadowOpacity: isEquipped ? 0.9 : isLegendary ? 0.7 : isEpic ? 0.5 : 0.3,
        shadowRadius: isEquipped ? 18 : isLegendary ? 14 : isEpic ? 10 : 6,
        shadowOffset: { width: 0, height: 0 },
        transform: isLegendary ? [{ scale: scaleAnim }] : [],
        zIndex: 1,
      }}>
        <LinearGradient
          colors={character.portraitColors}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.3, y: 0 }}
          end={{ x: 0.7, y: 1 }}
        />
        {character.visuals && <CharacterFaceSVG visuals={character.visuals} size={size} />}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.38)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0.3 }}
          end={{ x: 0.5, y: 1 }}
          pointerEvents="none"
        />
        {isLocked && (
          <View style={[StyleSheet.absoluteFill, {
            borderRadius, backgroundColor: 'rgba(0,0,0,0.72)',
            alignItems: 'center', justifyContent: 'center',
          }]}>
            <LockIcon size={size} />
          </View>
        )}
        {isEquipped && (
          <View style={{
            position: 'absolute', bottom: size * 0.05, right: size * 0.05,
            width: size * 0.16, height: size * 0.16,
            borderRadius: size * 0.08,
            backgroundColor: '#00ff88',
            borderWidth: 1.5, borderColor: '#050010',
          }} />
        )}
      </Animated.View>

      {showRarity && (
        <View style={{
          borderRadius: 4, borderWidth: 1, paddingHorizontal: 5, paddingVertical: 1,
          borderColor: `${rarityColor}55`, backgroundColor: `${rarityColor}18`,
        }}>
          <Text style={{
            fontSize: raritySize, fontWeight: '900', fontFamily: 'Orbitron_700Bold',
            letterSpacing: 1, color: rarityColor,
          }} allowFontScaling={false}>{character.rarity}</Text>
        </View>
      )}

      {showName && (
        <Text style={{
          fontFamily: 'Orbitron_400Regular', textAlign: 'center',
          letterSpacing: 0.3, lineHeight: nameSize * 1.3,
          maxWidth: size * 1.2, fontSize: nameSize,
          color: isLocked ? '#444' : '#fff',
        }} numberOfLines={2} allowFontScaling={false}>{character.name}</Text>
      )}
    </View>
  );
}
