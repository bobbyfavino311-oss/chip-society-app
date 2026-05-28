// ─── NeonAvatar — 30 SVG neon symbol avatars ──────────────────────────────────
// Pure vector icons. No portraits. No photos. No emoji.
// Dark bg + double-pass neon glow + rarity border.

import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, Path, Rect, Line, G, Text as SvgText } from 'react-native-svg';
import {
  getNeonAvatar,
  NEON_RARITY_BORDER,
  NEON_RARITY_COLORS,
  NEON_RARITY_GLOW,
} from '@/constants/neonAvatars';

interface NeonAvatarProps {
  avatarId?: number;
  size?: number;
  isLocked?: boolean;
  isEquipped?: boolean;
  style?: object;
}

// ─── Icon renderer ─────────────────────────────────────────────────────────────
// Each icon: 100×100 viewBox, stroke-based, rendered twice (glow + core).

function GlowPath({ d, color, sw = 4, filled = false }: { d: string; color: string; sw?: number; filled?: boolean }) {
  return (
    <G>
      <Path d={d} stroke={color} strokeWidth={sw * 2.6} strokeOpacity={0.32}
        fill={filled ? color : 'none'} fillOpacity={filled ? 0.18 : 0}
        strokeLinecap="round" strokeLinejoin="round" />
      <Path d={d} stroke={color} strokeWidth={sw} strokeOpacity={1}
        fill={filled ? color : 'none'} fillOpacity={filled ? 0.9 : 0}
        strokeLinecap="round" strokeLinejoin="round" />
    </G>
  );
}

function GlowCircle({ cx, cy, r, color, sw = 3.5, filled = false }: {
  cx: number; cy: number; r: number; color: string; sw?: number; filled?: boolean;
}) {
  return (
    <G>
      <Circle cx={cx} cy={cy} r={r} stroke={color} strokeWidth={sw * 2.6} strokeOpacity={0.32}
        fill={filled ? color : 'none'} fillOpacity={filled ? 0.2 : 0} />
      <Circle cx={cx} cy={cy} r={r} stroke={color} strokeWidth={sw} strokeOpacity={1}
        fill={filled ? color : 'none'} fillOpacity={filled ? 0.85 : 0} />
    </G>
  );
}

function NeonIcon({ id, color }: { id: number; color: string }) {
  switch (id) {
    // ── 1 MARTINI GLASS ────────────────────────────────────────────────────────
    case 1: return (
      <G>
        <GlowPath color={color} sw={3.5}
          d="M 16,18 H 84 M 16,18 L 50,72 M 84,18 L 50,72 M 50,72 V 87 M 32,87 H 68" />
        <GlowPath color={color} sw={3} d="M 22,36 L 78,36" />
        <GlowCircle cx={70} cy={28} r={5} color={color} sw={3} filled />
        <GlowPath color={color} sw={2.5} d="M 63,22 L 70,33" />
      </G>
    );

    // ── 2 LIGHTNING BOLT ───────────────────────────────────────────────────────
    case 2: return (
      <G>
        <GlowPath color={color} sw={4} filled
          d="M 60,8 L 28,54 L 52,54 L 40,92 L 72,46 L 48,46 Z" />
      </G>
    );

    // ── 3 POKER CHIP ───────────────────────────────────────────────────────────
    case 3: return (
      <G>
        <GlowCircle cx={50} cy={50} r={40} color={color} sw={3.5} />
        <GlowCircle cx={50} cy={50} r={26} color={color} sw={3} />
        {[0,45,90,135,180,225,270,315].map(a => {
          const rad = (a * Math.PI) / 180;
          return (
            <GlowPath key={a} color={color} sw={3}
              d={`M ${50 + Math.cos(rad)*28},${50 + Math.sin(rad)*28} L ${50 + Math.cos(rad)*40},${50 + Math.sin(rad)*40}`} />
          );
        })}
      </G>
    );

    // ── 4 ACE CARD ─────────────────────────────────────────────────────────────
    case 4: return (
      <G>
        <GlowPath color={color} sw={3.5}
          d="M 24,10 Q 24,8 26,8 L 74,8 Q 76,8 76,10 L 76,90 Q 76,92 74,92 L 26,92 Q 24,92 24,90 Z" />
        <SvgText x="50" y="58" textAnchor="middle" fontSize="38" fontWeight="900"
          fill={color} fillOpacity={0.9} stroke={color} strokeWidth={0.5}
          fontFamily="serif">A</SvgText>
        <GlowPath color={color} sw={2.5}
          d="M 50,70 C 46,66 40,64 40,60 C 40,57 43,55 46,56 C 48,57 50,59 50,59 C 50,59 52,57 54,56 C 57,55 60,57 60,60 C 60,64 54,66 50,70 Z" />
        <GlowPath color={color} sw={2} d="M 50,70 V 78 M 44,78 H 56" />
      </G>
    );

    // ── 5 DICE STACK ───────────────────────────────────────────────────────────
    case 5: return (
      <G>
        <GlowPath color={color} sw={3.5}
          d="M 14,14 Q 14,11 17,11 L 57,11 Q 60,11 60,14 L 60,54 Q 60,57 57,57 L 17,57 Q 14,57 14,54 Z" />
        <GlowPath color={color} sw={3.5}
          d="M 40,40 Q 40,37 43,37 L 83,37 Q 86,37 86,40 L 86,80 Q 86,83 83,83 L 43,83 Q 40,83 40,80 Z" />
        <GlowCircle cx={24} cy={34} r={3.5} color={color} sw={2} filled />
        <GlowCircle cx={50} cy={22} r={3.5} color={color} sw={2} filled />
        <GlowCircle cx={56} cy={70} r={3.5} color={color} sw={2} filled />
        <GlowCircle cx={63} cy={62} r={3.5} color={color} sw={2} filled />
        <GlowCircle cx={70} cy={54} r={3.5} color={color} sw={2} filled />
      </G>
    );

    // ── 6 MOON PHASE ───────────────────────────────────────────────────────────
    case 6: return (
      <G>
        <GlowPath color={color} sw={4}
          d="M 50,12 C 76,12 88,28 88,50 C 88,72 76,88 50,88 C 62,80 70,66 70,50 C 70,34 62,20 50,12 Z" />
        <GlowCircle cx={72} cy={26} r={4} color={color} sw={2.5} filled />
        <GlowCircle cx={80} cy={40} r={3} color={color} sw={2} filled />
        <GlowCircle cx={80} cy={62} r={3.5} color={color} sw={2} filled />
      </G>
    );

    // ── 7 FIRE ─────────────────────────────────────────────────────────────────
    case 7: return (
      <G>
        <GlowPath color={color} sw={3.5} filled
          d="M 50,88 C 28,84 16,64 22,50 C 18,60 26,54 28,46 C 22,56 30,50 34,40 C 28,30 40,18 50,10 C 60,18 72,30 66,40 C 70,50 78,56 72,46 C 78,64 72,84 50,88 Z" />
        <GlowPath color={color} sw={2.5} filled
          d="M 50,75 C 38,72 32,60 36,52 C 38,58 44,56 46,50 C 50,58 54,62 50,75 Z" />
      </G>
    );

    // ── 8 CROWN ────────────────────────────────────────────────────────────────
    case 8: return (
      <G>
        <GlowPath color={color} sw={3.5}
          d="M 10,76 L 10,44 L 28,64 L 50,26 L 72,64 L 90,44 L 90,76 Z" />
        <GlowPath color={color} sw={3} d="M 10,65 H 90" />
        <GlowCircle cx={26} cy={70} r={4.5} color={color} sw={2.5} filled />
        <GlowCircle cx={50} cy={70} r={4.5} color={color} sw={2.5} filled />
        <GlowCircle cx={74} cy={70} r={4.5} color={color} sw={2.5} filled />
      </G>
    );

    // ── 9 NEON PALM ────────────────────────────────────────────────────────────
    case 9: return (
      <G>
        <GlowPath color={color} sw={3} d="M 50,90 C 47,72 53,60 50,32" />
        <GlowPath color={color} sw={3} d="M 50,32 C 40,24 22,17 14,8" />
        <GlowPath color={color} sw={3} d="M 50,32 C 60,24 78,17 86,8" />
        <GlowPath color={color} sw={3} d="M 50,32 C 34,20 16,28 8,35" />
        <GlowPath color={color} sw={3} d="M 50,32 C 66,20 84,28 92,35" />
        <GlowPath color={color} sw={2.5} d="M 50,32 C 48,18 50,6 50,4" />
      </G>
    );

    // ── 10 CASSETTE ────────────────────────────────────────────────────────────
    case 10: return (
      <G>
        <GlowPath color={color} sw={3.5}
          d="M 11,27 Q 9,25 9,27 L 9,73 Q 9,75 11,75 L 89,75 Q 91,75 91,73 L 91,27 Q 91,25 89,25 L 11,25 Z" />
        <GlowCircle cx={34} cy={51} r={13} color={color} sw={3} />
        <GlowCircle cx={66} cy={51} r={13} color={color} sw={3} />
        <GlowCircle cx={34} cy={51} r={5} color={color} sw={2.5} />
        <GlowCircle cx={66} cy={51} r={5} color={color} sw={2.5} />
        <GlowPath color={color} sw={2.5} d="M 14,30 H 86" />
        <GlowPath color={color} sw={2} d="M 47,47 H 53 L 53,55 H 47 Z" />
      </G>
    );

    // ── 11 FLAMINGO ────────────────────────────────────────────────────────────
    case 11: return (
      <G>
        <GlowCircle cx={50} cy={16} r={8} color={color} sw={3.5} />
        <GlowPath color={color} sw={3} d="M 44,12 L 38,16 L 40,20" />
        <GlowPath color={color} sw={4} d="M 50,24 C 44,34 38,42 40,54 C 42,62 48,68 50,78" />
        <GlowPath color={color} sw={3.5} d="M 40,54 C 56,52 68,56 74,64 C 78,70 72,76 66,74" />
        <GlowPath color={color} sw={3.5} d="M 50,78 V 92 L 42,96 M 50,86 L 58,90" />
      </G>
    );

    // ── 12 CHAMPAGNE ───────────────────────────────────────────────────────────
    case 12: return (
      <G>
        <GlowPath color={color} sw={3.5}
          d="M 40,22 C 38,30 34,56 36,72 L 64,72 C 66,56 62,30 60,22 Z" />
        <GlowPath color={color} sw={3} d="M 40,22 H 60" />
        <GlowPath color={color} sw={3.5} d="M 50,72 V 85 M 36,90 H 64" />
        <GlowCircle cx={50} cy={58} r={2.5} color={color} sw={2} filled />
        <GlowCircle cx={46} cy={48} r={2} color={color} sw={2} filled />
        <GlowCircle cx={54} cy={38} r={2} color={color} sw={2} filled />
        <GlowCircle cx={48} cy={32} r={1.5} color={color} sw={1.5} filled />
      </G>
    );

    // ── 13 SHARK FIN ───────────────────────────────────────────────────────────
    case 13: return (
      <G>
        <GlowPath color={color} sw={3.5}
          d="M 20,70 C 28,70 40,62 50,16 C 60,62 72,70 80,70 Z" />
        <GlowPath color={color} sw={3}
          d="M 5,74 C 16,70 26,78 37,74 C 48,70 58,78 69,74 C 80,70 90,78 101,74" />
        <GlowPath color={color} sw={2.5} d="M 28,62 L 12,68 M 30,68 L 8,72" />
      </G>
    );

    // ── 14 NEON ROSE ───────────────────────────────────────────────────────────
    case 14: return (
      <G>
        <GlowPath color={color} sw={3}
          d="M 50,18 C 56,28 66,30 62,22 C 72,28 70,40 62,40 C 70,50 62,56 50,48 C 38,56 30,50 38,40 C 30,40 28,28 38,22 C 34,30 44,28 50,18 Z" />
        <GlowPath color={color} sw={2.5}
          d="M 50,48 C 56,40 58,32 50,30 C 42,32 44,40 50,48 Z" />
        <GlowPath color={color} sw={3} d="M 50,56 V 86" />
        <GlowPath color={color} sw={2.5} d="M 50,68 C 40,62 32,68 34,76" />
        <GlowPath color={color} sw={2.5} d="M 50,72 C 60,66 68,72 66,80" />
      </G>
    );

    // ── 15 EIGHT BALL ──────────────────────────────────────────────────────────
    case 15: return (
      <G>
        <GlowCircle cx={50} cy={50} r={40} color={color} sw={3.5} />
        <Circle cx={62} cy={36} r={16} fill="white" fillOpacity={0.92} />
        <Circle cx={62} cy={36} r={16} stroke={color} strokeWidth={1.5} fill="none" strokeOpacity={0.5} />
        <SvgText x="62" y="42" textAnchor="middle" fontSize="18" fontWeight="900"
          fill="#050010" fontFamily="serif">8</SvgText>
      </G>
    );

    // ── 16 ANCHOR ──────────────────────────────────────────────────────────────
    case 16: return (
      <G>
        <GlowPath color={color} sw={3} d="M 26,28 H 74" />
        <GlowCircle cx={50} cy={22} r={9} color={color} sw={3.5} />
        <GlowPath color={color} sw={3.5} d="M 50,31 V 78" />
        <GlowPath color={color} sw={3.5}
          d="M 50,78 C 50,70 28,64 20,72 M 50,78 C 50,70 72,64 80,72" />
        <GlowCircle cx={50} cy={78} r={4} color={color} sw={2.5} />
      </G>
    );

    // ── 17 SUNSET GRID ─────────────────────────────────────────────────────────
    case 17: return (
      <G>
        <GlowPath color={color} sw={3.5} d="M 14,50 A 36,36 0 0 1 86,50" />
        {[-60,-36,-18,0,18,36,60].map((deg, i) => {
          const rad = ((deg - 90) * Math.PI) / 180;
          return <GlowPath key={i} color={color} sw={2.5}
            d={`M 50,50 L ${50 + Math.cos(rad)*36},${50 + Math.sin(rad)*36}`} />;
        })}
        <GlowPath color={color} sw={2.5} d="M 4,52 H 96" />
        {[60,68,76,84,91].map((y, i) => {
          const margin = i * 4;
          return <GlowPath key={y} color={color} sw={2}
            d={`M ${4 + margin},${y} H ${96 - margin}`} />;
        })}
        {[-3,-1.5,0,1.5,3].map((off, i) => (
          <GlowPath key={i} color={color} sw={1.5}
            d={`M ${50 + off * 8},52 L ${50 + off * 22},95`} />
        ))}
      </G>
    );

    // ── 18 SNAKE ───────────────────────────────────────────────────────────────
    case 18: return (
      <G>
        <GlowPath color={color} sw={4}
          d="M 50,78 C 26,78 12,64 14,50 C 16,36 30,28 44,32 C 58,36 64,50 56,60 C 48,70 34,68 28,60 C 22,52 26,42 34,40" />
        <GlowCircle cx={50} cy={78} r={7} color={color} sw={3.5} />
        <GlowPath color={color} sw={2.5} d="M 44,82 L 40,88 M 56,82 L 60,88" />
        <GlowCircle cx={45} cy={78} r={2.5} color={color} sw={2} filled />
        <GlowCircle cx={55} cy={78} r={2.5} color={color} sw={2} filled />
      </G>
    );

    // ── 19 KATANA ──────────────────────────────────────────────────────────────
    case 19: return (
      <G>
        <GlowPath color={color} sw={3.5}
          d="M 50,8 L 54,64 L 50,78 L 46,64 Z" />
        <GlowPath color={color} sw={3} d="M 35,66 H 65 L 63,73 H 37 Z" />
        <GlowPath color={color} sw={4} d="M 44,73 H 56 L 56,93 H 44 Z" />
        <GlowPath color={color} sw={2} d="M 44,77 H 56 M 44,82 H 56 M 44,87 H 56" />
        <GlowPath color={color} sw={2.5} d="M 46,60 L 52,22 M 50,46 L 46,26" />
      </G>
    );

    // ── 20 SKULL ───────────────────────────────────────────────────────────────
    case 20: return (
      <G>
        <GlowPath color={color} sw={3.5}
          d="M 18,56 A 32,36 0 1 1 82,56 L 76,68 L 62,68 L 62,80 L 38,80 L 38,68 L 24,68 Z" />
        <GlowCircle cx={36} cy={47} r={10} color={color} sw={3} filled />
        <GlowCircle cx={64} cy={47} r={10} color={color} sw={3} filled />
        <GlowPath color={color} sw={2.5} d="M 46,62 L 50,56 L 54,62" />
        <GlowPath color={color} sw={2.5} d="M 38,68 V 80 M 47,68 V 80 M 53,68 V 80 M 62,68 V 80" />
      </G>
    );

    // ── 21 SATURN ──────────────────────────────────────────────────────────────
    case 21: return (
      <G>
        <Path d="M 6,50 A 44,14 0 0 1 94,50" stroke={color} strokeWidth={3}
          strokeOpacity={0.35} fill="none" strokeLinecap="round" />
        <Path d="M 6,50 A 44,14 0 0 1 94,50" stroke={color} strokeWidth={3}
          strokeOpacity={0.9} fill="none" strokeLinecap="round" />
        <GlowCircle cx={50} cy={50} r={24} color={color} sw={3.5} />
        <Path d="M 6,50 A 44,14 0 0 0 94,50" stroke={color} strokeWidth={3.5}
          strokeOpacity={0.4} fill="none" strokeLinecap="round" />
        <Path d="M 6,50 A 44,14 0 0 0 94,50" stroke={color} strokeWidth={3.5}
          strokeOpacity={1} fill="none" strokeLinecap="round" />
      </G>
    );

    // ── 22 VINYL RECORD ────────────────────────────────────────────────────────
    case 22: return (
      <G>
        <GlowCircle cx={50} cy={50} r={42} color={color} sw={3.5} />
        <GlowCircle cx={50} cy={50} r={34} color={color} sw={2} />
        <GlowCircle cx={50} cy={50} r={26} color={color} sw={2} />
        <GlowCircle cx={50} cy={50} r={17} color={color} sw={3.5} filled />
        <GlowCircle cx={50} cy={50} r={5} color={color} sw={2.5} />
        <GlowPath color={color} sw={2} d="M 44,44 L 56,56 M 56,44 L 44,56" />
      </G>
    );

    // ── 23 SPORTS CAR ──────────────────────────────────────────────────────────
    case 23: return (
      <G>
        <GlowPath color={color} sw={3.5}
          d="M 5,64 L 5,54 C 8,42 24,32 40,30 C 50,28 62,30 70,34 L 90,42 L 95,52 L 95,64 Z" />
        <GlowPath color={color} sw={2.5}
          d="M 40,30 C 44,24 60,24 68,34 L 65,40 L 36,40 Z" />
        <GlowPath color={color} sw={2} d="M 5,52 H 90" />
        <GlowCircle cx={24} cy={64} r={13} color={color} sw={3.5} />
        <GlowCircle cx={24} cy={64} r={6} color={color} sw={2.5} />
        <GlowCircle cx={76} cy={64} r={13} color={color} sw={3.5} />
        <GlowCircle cx={76} cy={64} r={6} color={color} sw={2.5} />
      </G>
    );

    // ── 24 SCORPION ────────────────────────────────────────────────────────────
    case 24: return (
      <G>
        <Ellipse cx={50} cy={62} rx={12} ry={18} stroke={color} strokeWidth={3.5}
          strokeOpacity={0.9} fill="none" />
        <GlowCircle cx={50} cy={38} r={10} color={color} sw={3} />
        <GlowPath color={color} sw={3}
          d="M 50,40 C 56,22 76,16 78,32 L 76,38" />
        <GlowPath color={color} sw={2.5} d="M 76,38 L 84,28 L 80,24" />
        <GlowPath color={color} sw={2.5} d="M 38,44 C 26,36 18,26 24,18 M 24,18 L 16,14 M 24,18 L 20,24" />
        <GlowPath color={color} sw={2.5} d="M 62,44 C 74,36 82,26 76,18 M 76,18 L 84,14 M 76,18 L 80,24" />
        {[0,1,2].map(i => (
          <GlowPath key={i} color={color} sw={2}
            d={`M 38,${52+i*8} L 22,${48+i*8} M 62,${52+i*8} L 78,${48+i*8}`} />
        ))}
      </G>
    );

    // ── 25 DRAGON ──────────────────────────────────────────────────────────────
    case 25: return (
      <G>
        <GlowPath color={color} sw={3.5}
          d="M 50,20 C 42,28 30,26 24,20 C 20,30 22,42 30,46 L 26,54 C 32,56 38,52 42,48 C 44,54 46,60 50,64" />
        <GlowPath color={color} sw={3.5}
          d="M 50,20 C 58,28 70,26 76,20 C 80,30 78,42 70,46 L 74,54 C 68,56 62,52 58,48 C 56,54 54,60 50,64" />
        <GlowPath color={color} sw={3}
          d="M 50,64 C 44,72 36,78 30,84 M 50,64 C 56,72 64,78 70,84" />
        <GlowPath color={color} sw={3}
          d="M 50,20 C 44,10 40,6 36,8 M 50,20 C 56,10 60,6 64,8" />
        <GlowCircle cx={50} cy={20} r={5} color={color} sw={3} filled />
      </G>
    );

    // ── 26 HOURGLASS ───────────────────────────────────────────────────────────
    case 26: return (
      <G>
        <GlowPath color={color} sw={3.5}
          d="M 18,10 H 82 L 82,18 L 56,50 L 82,82 L 82,90 H 18 L 18,82 L 44,50 L 18,18 Z" />
        <GlowPath color={color} sw={3} filled
          d="M 22,20 L 78,20 L 54,48 L 46,48 Z" />
        <GlowPath color={color} sw={3} filled
          d="M 46,52 L 54,52 L 78,80 L 22,80 Z" />
      </G>
    );

    // ── 27 STARBURST ───────────────────────────────────────────────────────────
    case 27: return (
      <G>
        <GlowPath color={color} sw={3.5} filled
          d="M 50,6 L 56,36 L 82,18 L 64,43 L 94,50 L 64,57 L 82,82 L 56,64 L 50,94 L 44,64 L 18,82 L 36,57 L 6,50 L 36,43 L 18,18 L 44,36 Z" />
        <GlowCircle cx={50} cy={50} r={16} color={color} sw={3} />
      </G>
    );

    // ── 28 TIGER EYE ───────────────────────────────────────────────────────────
    case 28: return (
      <G>
        <GlowPath color={color} sw={3.5}
          d="M 10,50 C 14,28 30,14 50,14 C 70,14 86,28 90,50 C 86,72 70,86 50,86 C 30,86 14,72 10,50 Z" />
        <GlowCircle cx={50} cy={50} r={22} color={color} sw={3} />
        <GlowPath color={color} sw={4} filled
          d="M 50,28 C 54,36 54,64 50,72 C 46,64 46,36 50,28 Z" />
        <Circle cx={44} cy={40} r={5} fill="white" fillOpacity={0.6} />
      </G>
    );

    // ── 29 WOLF HEAD ───────────────────────────────────────────────────────────
    case 29: return (
      <G>
        <GlowPath color={color} sw={3.5}
          d="M 50,12 L 30,24 L 22,52 L 30,72 L 50,85 L 70,72 L 78,52 L 70,24 Z" />
        <GlowPath color={color} sw={3} d="M 30,24 L 22,8 L 40,18" />
        <GlowPath color={color} sw={3} d="M 70,24 L 78,8 L 60,18" />
        <GlowPath color={color} sw={3}
          d="M 36,42 L 40,38 L 44,42 L 40,46 Z" />
        <GlowPath color={color} sw={3}
          d="M 56,42 L 60,38 L 64,42 L 60,46 Z" />
        <GlowPath color={color} sw={2.5}
          d="M 46,60 L 50,54 L 54,60 C 54,65 46,65 46,60 Z" />
        <GlowPath color={color} sw={2.5}
          d="M 36,66 C 40,72 46,76 50,76 C 54,76 60,72 64,66" />
      </G>
    );

    // ── 30 CHERRY ──────────────────────────────────────────────────────────────
    case 30: return (
      <G>
        <GlowCircle cx={36} cy={64} r={18} color={color} sw={3.5} filled />
        <GlowCircle cx={64} cy={68} r={18} color={color} sw={3.5} filled />
        <GlowPath color={color} sw={3} d="M 36,46 C 40,30 52,20 56,10" />
        <GlowPath color={color} sw={3} d="M 64,50 C 62,36 58,24 56,10" />
        <GlowPath color={color} sw={2.5} d="M 36,46 C 44,40 54,42 64,50" />
        <GlowCircle cx={56} cy={10} r={4} color={color} sw={2.5} filled />
        <Circle cx={28} cy={58} r={6} fill="white" fillOpacity={0.35} />
        <Circle cx={56} cy={62} r={5} fill="white" fillOpacity={0.3} />
      </G>
    );

    default: return (
      <G>
        <GlowPath color={color} sw={4}
          d="M 50,8 L 56,36 L 82,18 L 64,43 L 94,50 L 64,57 L 82,82 L 56,64 L 50,94 L 44,64 L 18,82 L 36,57 L 6,50 L 36,43 L 18,18 L 44,36 Z" />
      </G>
    );
  }
}

// ─── Lock icon ─────────────────────────────────────────────────────────────────
function LockIcon({ size, color }: { size: number; color: string }) {
  const s = size * 0.35;
  return (
    <Svg width={s} height={s * 1.2} viewBox="0 0 24 30">
      <Path
        d="M12,1 C8.7,1 6,3.7 6,7 L6,11 L4,11 C2.9,11 2,11.9 2,13 L2,27 C2,28.1 2.9,29 4,29 L20,29 C21.1,29 22,28.1 22,27 L22,13 C22,11.9 21.1,11 20,11 L18,11 L18,7 C18,3.7 15.3,1 12,1 Z M12,4 C13.7,4 15,5.3 15,7 L15,11 L9,11 L9,7 C9,5.3 10.3,4 12,4 Z"
        fill={color}
      />
    </Svg>
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
  const avatar = getNeonAvatar(avatarId);
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
        : avatar.rarity === 'EPIC' ? 0.55
        : 0.35,
    ],
  });

  const glowSize = size + 12;

  return (
    <View style={[{ width: size, height: size }, style]}>

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

      <View
        style={{
          width: size,
          height: size,
          borderRadius,
          borderWidth,
          borderColor: isEquipped ? '#ffffff' : rarityColor,
          overflow: 'hidden',
          backgroundColor: '#050010',
        }}
      >
        <LinearGradient
          colors={[avatar.bgColor, '#050010']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />

        <Svg
          width={size - borderWidth * 2}
          height={size - borderWidth * 2}
          viewBox="0 0 100 100"
          style={{ opacity: isLocked ? 0.15 : 1 }}
        >
          <NeonIcon id={avatar.id} color={avatar.color} />
        </Svg>

        {isLocked && (
          <View style={[StyleSheet.absoluteFill, styles.lockedOverlay]}>
            <LockIcon size={size} color={rarityColor} />
            {size >= 56 && (
              <Text style={[styles.lockedXP, { fontSize: size * 0.09, color: rarityColor }]}>
                {avatar.unlockXP >= 1000
                  ? `${(avatar.unlockXP / 1000).toFixed(0)}K XP`
                  : `${avatar.unlockXP} XP`}
              </Text>
            )}
          </View>
        )}

        {isEquipped && !isLocked && (
          <View style={[styles.equippedDot, { borderColor: '#050010' }]} />
        )}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
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
    bottom: 5,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00ff88',
    borderWidth: 1.5,
  },
});
