// ─── NeonAvatarSymbol — 15 programmatic SVG neon avatar icons ─────────────────
// No PNGs. No external images. Always renders correctly.
// Each icon: viewBox="0 0 100 100", stroked neon art, transparent background.
// The NeonAvatar container provides dark bg + circular clip + rarity border ring.

import React from 'react';
import Svg, { Circle, Ellipse, Line, Path, Rect } from 'react-native-svg';

export interface SymbolProps {
  color: string;
  size: number;
}

// ── 1. MARTINI GLASS (cyan) ───────────────────────────────────────────────────
export function MartiniIcon({ color, size }: SymbolProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* V-shape glass body */}
      <Path d="M18,24 L82,24 L50,62 Z"
        stroke={color} strokeWidth="2.5" fill="none"
        strokeLinejoin="round" strokeLinecap="round" />
      {/* Stem */}
      <Line x1="50" y1="62" x2="50" y2="77"
        stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      {/* Base */}
      <Line x1="33" y1="77" x2="67" y2="77"
        stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      {/* Toothpick */}
      <Line x1="36" y1="14" x2="65" y2="25"
        stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      {/* Olive */}
      <Circle cx="50" cy="19" r="5.5" fill={color} />
      <Circle cx="52.5" cy="17" r="2" fill="rgba(0,0,0,0.4)" />
    </Svg>
  );
}

// ── 2. PALM TREE (pink) ───────────────────────────────────────────────────────
export function PalmIcon({ color, size }: SymbolProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* Trunk — curved upward */}
      <Path d="M46,84 C44,70 52,56 50,30"
        stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Frond — up-left */}
      <Path d="M50,32 C42,22 24,20 18,14"
        stroke={color} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      {/* Frond — up-right */}
      <Path d="M50,32 C58,22 76,20 82,14"
        stroke={color} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      {/* Frond — left */}
      <Path d="M50,34 C38,26 24,30 16,30"
        stroke={color} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      {/* Frond — right */}
      <Path d="M50,34 C62,26 76,30 84,30"
        stroke={color} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      {/* Frond — lower-left */}
      <Path d="M50,36 C40,34 28,42 24,46"
        stroke={color} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      {/* Frond — lower-right */}
      <Path d="M50,36 C60,34 72,42 76,46"
        stroke={color} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      {/* Coconut cluster */}
      <Circle cx="50" cy="35" r="3.5" fill={color} opacity="0.9" />
    </Svg>
  );
}

// ── 3. DICE STACK (purple) ────────────────────────────────────────────────────
export function DiceIcon({ color, size }: SymbolProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* Back die */}
      <Rect x="26" y="38" width="36" height="36" rx="5"
        stroke={color} strokeWidth="2" fill="rgba(5,0,16,0.85)" />
      <Circle cx="36" cy="48" r="2.8" fill={color} />
      <Circle cx="52" cy="48" r="2.8" fill={color} />
      <Circle cx="44" cy="56" r="2.8" fill={color} />
      <Circle cx="36" cy="64" r="2.8" fill={color} />
      <Circle cx="52" cy="64" r="2.8" fill={color} />
      {/* Front die */}
      <Rect x="38" y="26" width="36" height="36" rx="5"
        stroke={color} strokeWidth="2.2" fill="#050010" />
      {/* Two dots on front face (showing '2') */}
      <Circle cx="48" cy="36" r="3" fill={color} />
      <Circle cx="65" cy="53" r="3" fill={color} />
    </Svg>
  );
}

// ── 4. CASSETTE TAPE (cyan) ───────────────────────────────────────────────────
export function CassetteIcon({ color, size }: SymbolProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* Outer shell */}
      <Rect x="10" y="27" width="80" height="46" rx="5"
        stroke={color} strokeWidth="2.2" fill="none" />
      {/* Label / window recess */}
      <Rect x="20" y="35" width="60" height="22" rx="3"
        stroke={color} strokeWidth="1.5" fill="none" />
      {/* Left reel */}
      <Circle cx="34" cy="57" r="10" stroke={color} strokeWidth="2" fill="none" />
      <Circle cx="34" cy="57" r="4.5" fill={color} opacity="0.45" />
      {/* Right reel */}
      <Circle cx="66" cy="57" r="10" stroke={color} strokeWidth="2" fill="none" />
      <Circle cx="66" cy="57" r="4.5" fill={color} opacity="0.45" />
      {/* Tape path between reels */}
      <Path d="M34,47 Q50,43 66,47"
        stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Corner screws */}
      <Circle cx="18" cy="65" r="3" stroke={color} strokeWidth="1.4" fill="none" />
      <Circle cx="82" cy="65" r="3" stroke={color} strokeWidth="1.4" fill="none" />
    </Svg>
  );
}

// ── 5. SATURN PLANET (purple) ─────────────────────────────────────────────────
export function SaturnIcon({ color, size }: SymbolProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* Ring — back arc (above planet) */}
      <Path d="M14,52 A36,10 0 0 1 86,52"
        stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Planet — filled dark to occlude ring behind */}
      <Circle cx="50" cy="52" r="20" fill="#050010" />
      {/* Planet — neon outline */}
      <Circle cx="50" cy="52" r="20"
        stroke={color} strokeWidth="2.2" fill="none" />
      {/* Ring — front arc (below planet) */}
      <Path d="M14,52 A36,10 0 0 0 86,52"
        stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

// ── 6. VINYL RECORD (red/pink) ────────────────────────────────────────────────
export function VinylIcon({ color, size }: SymbolProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* Record outer edge */}
      <Circle cx="50" cy="50" r="40"
        stroke={color} strokeWidth="2.2" fill="none" />
      {/* Groove rings */}
      <Circle cx="50" cy="50" r="33"
        stroke={color} strokeWidth="1" fill="none" opacity="0.55" />
      <Circle cx="50" cy="50" r="26"
        stroke={color} strokeWidth="1" fill="none" opacity="0.55" />
      <Circle cx="50" cy="50" r="19"
        stroke={color} strokeWidth="1" fill="none" opacity="0.55" />
      {/* Center label */}
      <Circle cx="50" cy="50" r="13"
        stroke={color} strokeWidth="1.8" fill={color} opacity="0.18" />
      {/* Spindle */}
      <Circle cx="50" cy="50" r="4" fill={color} />
    </Svg>
  );
}

// ── 7. CHERRY (red) ───────────────────────────────────────────────────────────
export function CherryIcon({ color, size }: SymbolProps) {
  const green = '#00cc44';
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* Stems — Y shape */}
      <Path d="M36,57 C38,46 50,37 50,28"
        stroke={green} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <Path d="M63,53 C61,44 52,37 50,28"
        stroke={green} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      {/* Leaf */}
      <Ellipse cx="44" cy="35" rx="8" ry="3.5"
        transform="rotate(-35 44 35)"
        stroke={green} strokeWidth="1.8" fill="none" />
      {/* Left cherry — filled with subtle glow */}
      <Circle cx="36" cy="68" r="14"
        fill={color} opacity="0.22" />
      <Circle cx="36" cy="68" r="14"
        stroke={color} strokeWidth="2.2" fill="none" />
      <Circle cx="31" cy="63" r="4"
        fill="rgba(255,255,255,0.13)" />
      {/* Right cherry */}
      <Circle cx="63" cy="64" r="14"
        fill={color} opacity="0.22" />
      <Circle cx="63" cy="64" r="14"
        stroke={color} strokeWidth="2.2" fill="none" />
      <Circle cx="58" cy="59" r="4"
        fill="rgba(255,255,255,0.13)" />
    </Svg>
  );
}

// ── 8. FLAMINGO (pink) ────────────────────────────────────────────────────────
export function FlamingoIcon({ color, size }: SymbolProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* Body — rotated oval */}
      <Ellipse cx="50" cy="60" rx="13" ry="17"
        transform="rotate(-12 50 60)"
        fill={color} opacity="0.14" />
      <Ellipse cx="50" cy="60" rx="13" ry="17"
        transform="rotate(-12 50 60)"
        stroke={color} strokeWidth="2.2" fill="none" />
      {/* Long neck */}
      <Path d="M54,44 C58,36 66,28 68,22"
        stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Head */}
      <Circle cx="68" cy="18" r="7"
        fill={color} opacity="0.2" />
      <Circle cx="68" cy="18" r="7"
        stroke={color} strokeWidth="2.2" fill="none" />
      {/* Beak — curved downward */}
      <Path d="M74,21 C80,24 82,29 77,32"
        stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Eye */}
      <Circle cx="65" cy="16" r="2" fill={color} />
      {/* Leg with knee bend */}
      <Path d="M50,77 L48,87 L44,93"
        stroke={color} strokeWidth="2.5" fill="none"
        strokeLinecap="round" strokeLinejoin="round" />
      {/* Foot */}
      <Line x1="44" y1="93" x2="37" y2="93"
        stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="44" y1="93" x2="46" y2="97"
        stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ── 9. SUNSET GRID (orange) ───────────────────────────────────────────────────
export function SunsetIcon({ color, size }: SymbolProps) {
  const grid = '#00d4ff';
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* Sun — upper semicircle filled */}
      <Path d="M22,52 A28,28 0 0 1 78,52 Z"
        fill={color} opacity="0.28" />
      <Path d="M22,52 A28,28 0 0 1 78,52"
        stroke={color} strokeWidth="2.2" fill="none" />
      {/* Horizon line */}
      <Line x1="12" y1="52" x2="88" y2="52"
        stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Grid horizontals */}
      <Line x1="12" y1="60" x2="88" y2="60" stroke={grid} strokeWidth="1.2" opacity="0.85" />
      <Line x1="12" y1="68" x2="88" y2="68" stroke={grid} strokeWidth="1.1" opacity="0.75" />
      <Line x1="12" y1="76" x2="88" y2="76" stroke={grid} strokeWidth="1"   opacity="0.65" />
      <Line x1="12" y1="84" x2="88" y2="84" stroke={grid} strokeWidth="1"   opacity="0.55" />
      {/* Grid verticals — perspective from horizon center */}
      <Line x1="50" y1="52" x2="12" y2="88" stroke={grid} strokeWidth="1" opacity="0.75" />
      <Line x1="50" y1="52" x2="26" y2="88" stroke={grid} strokeWidth="1" opacity="0.75" />
      <Line x1="50" y1="52" x2="40" y2="88" stroke={grid} strokeWidth="1" opacity="0.75" />
      <Line x1="50" y1="52" x2="50" y2="88" stroke={grid} strokeWidth="1" opacity="0.75" />
      <Line x1="50" y1="52" x2="60" y2="88" stroke={grid} strokeWidth="1" opacity="0.75" />
      <Line x1="50" y1="52" x2="74" y2="88" stroke={grid} strokeWidth="1" opacity="0.75" />
      <Line x1="50" y1="52" x2="88" y2="88" stroke={grid} strokeWidth="1" opacity="0.75" />
    </Svg>
  );
}

// ── 10. ACE CARD (gold) ───────────────────────────────────────────────────────
export function AceIcon({ color, size }: SymbolProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* Card shape */}
      <Rect x="20" y="14" width="60" height="72" rx="6"
        stroke={color} strokeWidth="2.2" fill={color} opacity="0.09" />
      {/* Large 'A' — two diagonals + crossbar */}
      <Path d="M50,28 L36,72"
        stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
      <Path d="M50,28 L64,72"
        stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
      <Line x1="40" y1="56" x2="60" y2="56"
        stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      {/* Spade suit — small, below the A crossbar area */}
      <Path d="M50,64 C50,64 44,59 42,62 C40,65 44,67 50,72 C56,67 60,65 58,62 C56,59 50,64 50,64 Z"
        fill={color} opacity="0.75" />
      <Path d="M46,72 L54,72 L53,70 L47,70 Z"
        fill={color} opacity="0.75" />
    </Svg>
  );
}

// ── 11. HOURGLASS (purple) ────────────────────────────────────────────────────
export function HourglassIcon({ color, size }: SymbolProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* Top bar */}
      <Line x1="20" y1="14" x2="80" y2="14"
        stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      {/* Bottom bar */}
      <Line x1="20" y1="86" x2="80" y2="86"
        stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      {/* Left side */}
      <Path d="M20,14 L50,50 L20,86"
        stroke={color} strokeWidth="2.5" fill="none"
        strokeLinecap="round" strokeLinejoin="round" />
      {/* Right side */}
      <Path d="M80,14 L50,50 L80,86"
        stroke={color} strokeWidth="2.5" fill="none"
        strokeLinecap="round" strokeLinejoin="round" />
      {/* Sand top — mostly run out */}
      <Path d="M33,22 L67,22 L56,42 L44,42 Z"
        fill={color} opacity="0.24" />
      {/* Sand bottom — accumulated pile */}
      <Path d="M30,78 L70,78 L62,64 L38,64 Z"
        fill={color} opacity="0.52" />
      {/* Falling sand particles */}
      <Circle cx="50" cy="52" r="1.5" fill={color} opacity="0.85" />
      <Circle cx="50" cy="57" r="1.2" fill={color} opacity="0.65" />
      <Circle cx="50" cy="61" r="1"   fill={color} opacity="0.45" />
    </Svg>
  );
}

// ── 12. DRAGON (green) ────────────────────────────────────────────────────────
export function DragonIcon({ color, size }: SymbolProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* Head body outline */}
      <Path
        d="M30,44 C28,36 32,26 40,22 C52,16 66,20 72,30 C76,38 74,48 68,54 L60,60 L54,66 C48,70 40,68 34,62 C28,56 28,50 30,44 Z"
        fill={color} opacity="0.1" />
      <Path
        d="M30,44 C28,36 32,26 40,22 C52,16 66,20 72,30 C76,38 74,48 68,54 L60,60 L54,66 C48,70 40,68 34,62 C28,56 28,50 30,44 Z"
        stroke={color} strokeWidth="2.2" fill="none" />
      {/* Eye */}
      <Circle cx="58" cy="34" r="5"
        fill={color} opacity="0.22" />
      <Circle cx="58" cy="34" r="5"
        stroke={color} strokeWidth="1.8" fill="none" />
      <Circle cx="58" cy="34" r="2.5" fill={color} />
      {/* Nostril */}
      <Circle cx="70" cy="46" r="2" fill={color} opacity="0.75" />
      {/* Horn — back */}
      <Path d="M44,22 L40,8 L48,16"
        stroke={color} strokeWidth="2" fill="none"
        strokeLinecap="round" strokeLinejoin="round" />
      {/* Horn — front */}
      <Path d="M54,20 L52,6 L60,14"
        stroke={color} strokeWidth="2" fill="none"
        strokeLinecap="round" strokeLinejoin="round" />
      {/* Teeth */}
      <Line x1="58" y1="60" x2="56" y2="66"
        stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="64" y1="57" x2="64" y2="63"
        stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      {/* Scale lines */}
      <Path d="M36,48 C38,44 44,44 46,48"
        stroke={color} strokeWidth="1.4" fill="none" opacity="0.7" />
      <Path d="M42,58 C44,54 50,54 52,58"
        stroke={color} strokeWidth="1.4" fill="none" opacity="0.7" />
    </Svg>
  );
}

// ── 13. POKER CHIP (purple) ───────────────────────────────────────────────────
export function ChipIcon({ color, size }: SymbolProps) {
  const seg = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* Outer ring */}
      <Circle cx="50" cy="50" r="40"
        stroke={color} strokeWidth="2.2" fill="none" />
      {/* Inner ring */}
      <Circle cx="50" cy="50" r="28"
        stroke={color} strokeWidth="2" fill={color} opacity="0.1" />
      {/* Edge segment marks */}
      {seg.map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const cx = 50 + 34 * Math.cos(rad);
        const cy = 50 + 34 * Math.sin(rad);
        return (
          <Ellipse
            key={i}
            cx={cx} cy={cy} rx="5" ry="9"
            transform={`rotate(${deg} ${cx} ${cy})`}
            fill={i % 2 === 0 ? color : 'none'}
            stroke={color} strokeWidth="1.4"
            opacity={i % 2 === 0 ? 0.65 : 0.85}
          />
        );
      })}
      {/* Center disc */}
      <Circle cx="50" cy="50" r="14"
        stroke={color} strokeWidth="1.8" fill="none" />
      <Circle cx="50" cy="50" r="5"
        fill={color} opacity="0.8" />
    </Svg>
  );
}

// ── 14. CHAMPAGNE GLASS (gold) ────────────────────────────────────────────────
export function ChampagneIcon({ color, size }: SymbolProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* Flute bowl — tapers at bottom, wide at top */}
      <Path d="M38,16 L36,64 Q35,70 40,74 L60,74 Q65,70 64,64 L62,16 Z"
        fill={color} opacity="0.1"
        strokeLinejoin="round" />
      <Path d="M38,16 L36,64 Q35,70 40,74 L60,74 Q65,70 64,64 L62,16 Z"
        stroke={color} strokeWidth="2.2" fill="none"
        strokeLinejoin="round" />
      {/* Stem */}
      <Line x1="50" y1="74" x2="50" y2="86"
        stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      {/* Base */}
      <Line x1="35" y1="86" x2="65" y2="86"
        stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      {/* Bubbles rising */}
      <Circle cx="47" cy="64" r="2.5"
        stroke={color} strokeWidth="1.5" fill="none" opacity="0.8" />
      <Circle cx="53" cy="53" r="2"
        stroke={color} strokeWidth="1.5" fill="none" opacity="0.7" />
      <Circle cx="46" cy="42" r="2"
        stroke={color} strokeWidth="1.5" fill="none" opacity="0.6" />
      <Circle cx="54" cy="32" r="2"
        stroke={color} strokeWidth="1.5" fill="none" opacity="0.5" />
      {/* Fizz column */}
      <Line x1="50" y1="70" x2="50" y2="20"
        stroke={color} strokeWidth="1" opacity="0.25" strokeLinecap="round" />
    </Svg>
  );
}

// ── 15. MOON (purple) ─────────────────────────────────────────────────────────
export function MoonIcon({ color, size }: SymbolProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* Crescent: large circle minus offset inner circle → via path */}
      <Path d="M56,20 A30,30 0 1 0 56,80 A22,22 0 1 1 56,20 Z"
        fill={color} opacity="0.16" />
      <Path d="M56,20 A30,30 0 1 0 56,80 A22,22 0 1 1 56,20 Z"
        stroke={color} strokeWidth="2.5" fill="none" />
      {/* Stars */}
      <Circle cx="72" cy="28" r="2.8" fill={color} />
      <Circle cx="80" cy="46" r="2"   fill={color} opacity="0.85" />
      <Circle cx="74" cy="62" r="2.2" fill={color} opacity="0.75" />
    </Svg>
  );
}

// ── Icon registry ─────────────────────────────────────────────────────────────

export type AvatarIconId = 1|2|3|4|5|6|7|8|9|10|11|12|13|14|15;

type IconComponent = (props: SymbolProps) => React.ReactElement;

export const AVATAR_ICON_MAP: Record<AvatarIconId, IconComponent> = {
  1:  MartiniIcon,
  2:  PalmIcon,
  3:  DiceIcon,
  4:  CassetteIcon,
  5:  SaturnIcon,
  6:  VinylIcon,
  7:  CherryIcon,
  8:  FlamingoIcon,
  9:  SunsetIcon,
  10: AceIcon,
  11: HourglassIcon,
  12: DragonIcon,
  13: ChipIcon,
  14: ChampagneIcon,
  15: MoonIcon,
};

export function renderAvatarIcon(
  id: number,
  color: string,
  size: number,
): React.ReactElement {
  const safeId = (Math.min(15, Math.max(1, Math.round(id || 1)))) as AvatarIconId;
  const Icon = AVATAR_ICON_MAP[safeId];
  return <Icon color={color} size={size} />;
}
