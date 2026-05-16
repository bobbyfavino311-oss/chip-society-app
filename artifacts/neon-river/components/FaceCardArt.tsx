import React from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

interface FaceCardArtProps {
  value: 'J' | 'Q' | 'K';
  isRed: boolean;
  size: number;
}

// ─── Shared palette ────────────────────────────────────────────────────────
const SKIN   = '#F5D5A0';
const SKIN_D = '#C8964A';
const GOLD   = '#D4AF37';
const DARK   = '#111111';
const SILVER = '#C0C0C0';
const WHITE  = '#FFFFFF';

// ─────────────────────────────────────────────────────────────────────────────
// KING — Two-headed traditional king figure
// viewBox "0 0 50 70": top figure y=0..34, bottom = rotate(180,25,35)
// ─────────────────────────────────────────────────────────────────────────────
function KingFigure({ isRed }: { isRed: boolean }) {
  const robe = isRed ? '#C41E3A' : '#1A3070';
  const alt  = isRed ? '#1A3070' : '#C41E3A';

  return (
    <>
      {/* ── Crown — 5-prong ────────────────────────────────────── */}
      <Path
        d="M 11,8.5 L 11,6 L 15,1.5 L 18,6 L 22,3 L 25,0.5 L 28,3 L 32,6 L 35,1.5 L 39,6 L 39,8.5 Z"
        fill={GOLD} stroke={DARK} strokeWidth="0.6"
      />
      <Rect x="11" y="7.5" width="28" height="2.5" fill={GOLD} />
      <Circle cx="18"   cy="5"   r="2"   fill={alt}  stroke={DARK} strokeWidth="0.4" />
      <Circle cx="25"   cy="2.5" r="2.2" fill={alt}  stroke={DARK} strokeWidth="0.4" />
      <Circle cx="32"   cy="5"   r="2"   fill={alt}  stroke={DARK} strokeWidth="0.4" />
      <Path d="M 12,8.2 L 38,8.2" stroke="#EED848" strokeWidth="0.8" opacity="0.7" />

      {/* ── Side hair ──────────────────────────────────────────── */}
      <Path d="M 11,9.5 Q 8,13 8.5,21.5 Q 10,24.5 14,23.5 L 14.5,9.5 Z" fill={DARK} />
      <Path d="M 39,9.5 Q 42,13 41.5,21.5 Q 40,24.5 36,23.5 L 35.5,9.5 Z" fill={DARK} />

      {/* ── Face ───────────────────────────────────────────────── */}
      <Ellipse cx="25" cy="18" rx="11" ry="10" fill={SKIN} stroke={DARK} strokeWidth="0.5" />

      {/* Eyebrows */}
      <Path d="M 17.5,14 Q 20.5,12.5 23,13.5" stroke={DARK} strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <Path d="M 27,13.5 Q 29.5,12.5 32.5,14"  stroke={DARK} strokeWidth="1.3" fill="none" strokeLinecap="round" />

      {/* Eyes */}
      <Ellipse cx="20.5" cy="16.5" rx="2.8" ry="2"   fill={WHITE} stroke={DARK} strokeWidth="0.5" />
      <Ellipse cx="29.5" cy="16.5" rx="2.8" ry="2"   fill={WHITE} stroke={DARK} strokeWidth="0.5" />
      <Circle  cx="21"   cy="16.5" r="1.4"  fill={DARK} />
      <Circle  cx="30"   cy="16.5" r="1.4"  fill={DARK} />
      <Circle  cx="21.5" cy="15.9" r="0.5"  fill={WHITE} />
      <Circle  cx="30.5" cy="15.9" r="0.5"  fill={WHITE} />

      {/* Nose */}
      <Path d="M 23.5,18.5 Q 25,21 26.5,18.5" stroke={SKIN_D} strokeWidth="0.9" fill="none" strokeLinecap="round" />

      {/* Mustache */}
      <Path d="M 18.5,21.5 Q 21.5,24.5 25,23.5 Q 28.5,24.5 31.5,21.5" fill={DARK} />

      {/* Beard */}
      <Path
        d="M 15.5,22 Q 13,27 15,31 Q 20,34.5 25,34.5 Q 30,34.5 35,31 Q 37,27 34.5,22 Q 31,26.5 25,27 Q 19,26.5 15.5,22 Z"
        fill={DARK}
      />
      <Path d="M 18.5,25.5 Q 22,27 25,27"   stroke="#404040" strokeWidth="0.8" fill="none" />
      <Path d="M 25,27 Q 28,27 31.5,25.5"   stroke="#404040" strokeWidth="0.8" fill="none" />

      {/* ── Robe ───────────────────────────────────────────────── */}
      <Path
        d="M 13,26.5 Q 7.5,30 5.5,34.5 L 44.5,34.5 Q 42.5,30 37,26.5 Q 33,23 25,23 Q 17,23 13,26.5 Z"
        fill={robe} stroke={DARK} strokeWidth="0.5"
      />
      {/* White collar */}
      <Path d="M 19,23 L 25,30 L 31,23" fill={WHITE} stroke={DARK} strokeWidth="0.5" />
      {/* Gold epaulette trim */}
      <Path d="M 13,26.5 Q 7.5,30 5.5,34.5"   stroke={GOLD} strokeWidth="2" fill="none" strokeLinecap="round" />
      <Path d="M 37,26.5 Q 42.5,30 44.5,34.5" stroke={GOLD} strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Robe detail lines */}
      <Path d="M 5.5,34.5 L 13,28.5"  stroke={GOLD} strokeWidth="0.6" opacity="0.5" />
      <Path d="M 44.5,34.5 L 37,28.5" stroke={GOLD} strokeWidth="0.6" opacity="0.5" />

      {/* ── Sword (right side) ─────────────────────────────────── */}
      {/* Blade */}
      <Path d="M 38.5,9 L 37.5,9 L 37,26 L 38,26.5 L 39,26 Z" fill={SILVER} stroke="#888" strokeWidth="0.4" />
      {/* Cross guard */}
      <Rect x="34"  y="25.5" width="9.5" height="2.5" rx="1.2" fill={GOLD} stroke={DARK} strokeWidth="0.4" />
      {/* Grip */}
      <Rect x="37"  y="27.5" width="2.5" height="5.5" rx="1"   fill="#7A3010" stroke={DARK} strokeWidth="0.3" />
      {/* Pommel */}
      <Ellipse cx="38.25" cy="33.5" rx="2.5" ry="1.8" fill={GOLD} stroke={DARK} strokeWidth="0.3" />

      {/* ── Orb scepter (left side) ────────────────────────────── */}
      <Rect  x="10"   y="27"   width="2"   height="7.5" rx="1"   fill={GOLD} />
      <Circle cx="11"   cy="26"   r="3.5" fill={GOLD}  stroke={DARK} strokeWidth="0.4" />
      <Circle cx="11"   cy="26"   r="2.2" fill={alt} />
      <Circle cx="11"   cy="25.2" r="0.8" fill={WHITE} opacity="0.5" />
    </>
  );
}

function King({ isRed }: { isRed: boolean }) {
  return (
    <>
      <KingFigure isRed={isRed} />
      <G transform="rotate(180, 25, 35)">
        <KingFigure isRed={isRed} />
      </G>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// QUEEN — Two-headed traditional queen figure
// ─────────────────────────────────────────────────────────────────────────────
function QueenFigure({ isRed }: { isRed: boolean }) {
  const dress  = isRed ? '#C41E3A' : '#1A3070';
  const alt    = isRed ? '#1A3070' : '#C41E3A';
  const hairC  = isRed ? '#3A0818' : '#0A0A20';
  const hairHi = isRed ? '#882040' : '#222268';
  const lipC   = isRed ? '#CC2255' : '#882288';

  return (
    <>
      {/* ── Crown — rounded arch style ─────────────────────────── */}
      <Path
        d="M 12,8 L 12,5.5 Q 16,0.5 20,4.5 Q 22.5,0.5 25,0.5 Q 27.5,0.5 30,4.5 Q 34,0.5 38,5.5 L 38,8 Z"
        fill={GOLD} stroke={DARK} strokeWidth="0.5"
      />
      <Rect x="12" y="7" width="26" height="2.5" fill={GOLD} />
      <Circle cx="18.5" cy="4.5" r="2"   fill={alt} stroke={DARK} strokeWidth="0.4" />
      <Circle cx="25"   cy="2"   r="2.2" fill={alt} stroke={DARK} strokeWidth="0.4" />
      <Circle cx="31.5" cy="4.5" r="2"   fill={alt} stroke={DARK} strokeWidth="0.4" />
      <Path d="M 13,7.5 L 37,7.5" stroke="#EED848" strokeWidth="0.8" opacity="0.7" />

      {/* ── Long flowing hair ──────────────────────────────────── */}
      <Path d="M 13,8.5 Q 7.5,12 6.5,24 Q 7.5,32 11,34.5 L 14,8.5 Z"      fill={hairC} />
      <Path d="M 13.5,10 Q 9,14 8.5,22 Q 9,28 11.5,32"
            stroke={hairHi} strokeWidth="1.5" fill="none" opacity="0.6" strokeLinecap="round" />
      <Path d="M 37,8.5 Q 42.5,12 43.5,24 Q 42.5,32 39,34.5 L 36,8.5 Z"   fill={hairC} />
      <Path d="M 36.5,10 Q 41,14 41.5,22 Q 41,28 38.5,32"
            stroke={hairHi} strokeWidth="1.5" fill="none" opacity="0.6" strokeLinecap="round" />

      {/* ── Face ───────────────────────────────────────────────── */}
      <Ellipse cx="25" cy="17.5" rx="10.5" ry="9.5" fill={SKIN} stroke={DARK} strokeWidth="0.5" />

      {/* Cheek blush */}
      <Ellipse cx="17" cy="19" rx="3.5" ry="2" fill="#FF8888" opacity="0.22" />
      <Ellipse cx="33" cy="19" rx="3.5" ry="2" fill="#FF8888" opacity="0.22" />

      {/* Eyebrows */}
      <Path d="M 18.5,13 Q 20.5,11.5 23,12.5" stroke={DARK} strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <Path d="M 27,12.5 Q 29.5,11.5 31.5,13"  stroke={DARK} strokeWidth="1.2" fill="none" strokeLinecap="round" />

      {/* Eyes */}
      <Ellipse cx="20.5" cy="15.5" rx="2.8" ry="2.2" fill={WHITE} stroke={DARK} strokeWidth="0.5" />
      <Ellipse cx="29.5" cy="15.5" rx="2.8" ry="2.2" fill={WHITE} stroke={DARK} strokeWidth="0.5" />
      <Circle  cx="21"   cy="15.5" r="1.5"  fill={DARK} />
      <Circle  cx="30"   cy="15.5" r="1.5"  fill={DARK} />
      <Circle  cx="21.5" cy="14.8" r="0.5"  fill={WHITE} />
      <Circle  cx="30.5" cy="14.8" r="0.5"  fill={WHITE} />
      {/* Eyelash bar */}
      <Path d="M 18,13.5 L 23.3,13.5" stroke={DARK} strokeWidth="1.2" strokeLinecap="round" />
      <Path d="M 26.7,13.5 L 32,13.5"  stroke={DARK} strokeWidth="1.2" strokeLinecap="round" />

      {/* Nose */}
      <Path d="M 23.5,18 Q 25,20 26.5,18" stroke={SKIN_D} strokeWidth="0.8" fill="none" strokeLinecap="round" />

      {/* Lips */}
      <Path d="M 20,21.5 Q 22.5,24.5 25,23 Q 27.5,24.5 30,21.5" fill={lipC} />
      <Path d="M 20,21.5 Q 22.5,20 25,21.5 Q 27.5,20 30,21.5"   fill="#FF88AA" opacity="0.55" />
      <Ellipse cx="25" cy="21" rx="3" ry="0.8" fill={WHITE} opacity="0.2" />

      {/* ── Dress ──────────────────────────────────────────────── */}
      <Path
        d="M 11,27.5 Q 7,31 5,34.5 L 45,34.5 Q 43,31 39,27.5 Q 35,23 25,23 Q 15,23 11,27.5 Z"
        fill={dress} stroke={DARK} strokeWidth="0.5"
      />
      {/* Lace collar */}
      <Path d="M 19,23 L 25,29 L 31,23" fill={WHITE} stroke={DARK} strokeWidth="0.5" />
      {/* Necklace */}
      <Path d="M 17,23 Q 25,27 33,23" stroke={GOLD} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Gold trim */}
      <Path d="M 11,27.5 Q 7,31 5,34.5"   stroke={GOLD} strokeWidth="2" fill="none" strokeLinecap="round" />
      <Path d="M 39,27.5 Q 43,31 45,34.5" stroke={GOLD} strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* ── Flower (left hand) ─────────────────────────────────── */}
      <Rect   x="9"    y="29"   width="2"   height="6"   rx="1"   fill={GOLD} />
      <Circle cx="10"   cy="28"   r="3.5" fill={lipC}  stroke={DARK} strokeWidth="0.4" />
      <Circle cx="10"   cy="28"   r="2"   fill="#FFCCDD" opacity="0.7" />
      <Circle cx="10"   cy="28"   r="0.8" fill={GOLD} />
      <Circle cx="10"   cy="24.5" r="1.5" fill={lipC}  opacity="0.65" />
      <Circle cx="13.5" cy="28"   r="1.5" fill={lipC}  opacity="0.65" />
      <Circle cx="10"   cy="31.5" r="1.5" fill={lipC}  opacity="0.65" />
      <Circle cx="6.5"  cy="28"   r="1.5" fill={lipC}  opacity="0.65" />

      {/* ── Scepter (right hand) ───────────────────────────────── */}
      <Rect   x="39"   y="27"   width="2"   height="7.5" rx="1"   fill={GOLD} />
      <Circle cx="40"   cy="26"   r="3"   fill={GOLD}  stroke={DARK} strokeWidth="0.4" />
      <Circle cx="40"   cy="26"   r="1.8" fill={alt} />
      <Circle cx="40"   cy="25.2" r="0.6" fill={WHITE} opacity="0.5" />
    </>
  );
}

function Queen({ isRed }: { isRed: boolean }) {
  return (
    <>
      <QueenFigure isRed={isRed} />
      <G transform="rotate(180, 25, 35)">
        <QueenFigure isRed={isRed} />
      </G>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// JACK — Two-headed traditional knave figure
// ─────────────────────────────────────────────────────────────────────────────
function JackFigure({ isRed }: { isRed: boolean }) {
  const tabard  = isRed ? '#C41E3A' : '#1A3070';
  const hatC    = isRed ? '#1A3070' : '#C41E3A';
  const feather = isRed ? '#FF5577' : '#5599FF';
  const stripes = isRed ? '#FF8899' : '#6688FF';

  return (
    <>
      {/* ── Hat — flat brim + crown ─────────────────────────────── */}
      <Rect  x="8"   y="9.5" width="34" height="3"   rx="1.5" fill={DARK} />
      <Path d="M 12,9.5 Q 12,2 25,2 Q 38,2 38,9.5 Z" fill={hatC} stroke={DARK} strokeWidth="0.5" />
      <Rect  x="11"  y="8.5" width="28" height="1.8" fill={GOLD} />
      <Circle cx="25" cy="9.5" r="1.8" fill={GOLD} stroke={DARK} strokeWidth="0.3" />

      {/* ── Feather (right of hat) ─────────────────────────────── */}
      <Path d="M 36,9 Q 42,3 47,0.5 Q 44,5 45,10 Q 41,6.5 36,9"
            fill={feather} stroke={DARK} strokeWidth="0.4" />
      <Path d="M 36,9 Q 42,4 47,0.5" stroke={WHITE} strokeWidth="0.6" fill="none" opacity="0.5" />

      {/* ── Side hair ──────────────────────────────────────────── */}
      <Path d="M 12,12 Q 9,15 9.5,21.5 Q 11,24 14.5,23 L 14.5,12 Z" fill="#3A2010" />
      <Path d="M 38,12 Q 41,15 40.5,21.5 Q 39,24 35.5,23 L 35.5,12 Z" fill="#3A2010" />

      {/* ── Face — young, clean-shaven ─────────────────────────── */}
      <Ellipse cx="25" cy="18" rx="10.5" ry="9.5" fill={SKIN} stroke={DARK} strokeWidth="0.5" />

      {/* Eyebrows */}
      <Path d="M 18.5,14 Q 21,12.8 23.5,13.5" stroke={DARK} strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <Path d="M 26.5,13.5 Q 29,12.8 31.5,14"  stroke={DARK} strokeWidth="1.2" fill="none" strokeLinecap="round" />

      {/* Eyes */}
      <Ellipse cx="20.5" cy="16.5" rx="2.8" ry="2"   fill={WHITE} stroke={DARK} strokeWidth="0.5" />
      <Ellipse cx="29.5" cy="16.5" rx="2.8" ry="2"   fill={WHITE} stroke={DARK} strokeWidth="0.5" />
      <Circle  cx="21"   cy="16.5" r="1.4"  fill={DARK} />
      <Circle  cx="30"   cy="16.5" r="1.4"  fill={DARK} />
      <Circle  cx="21.5" cy="15.9" r="0.5"  fill={WHITE} />
      <Circle  cx="30.5" cy="15.9" r="0.5"  fill={WHITE} />

      {/* Nose */}
      <Path d="M 23.5,19 Q 25,21.5 26.5,19" stroke={SKIN_D} strokeWidth="0.9" fill="none" strokeLinecap="round" />

      {/* Mouth — slight smile */}
      <Path d="M 20.5,22.5 Q 24.5,25.5 29.5,22.5" stroke="#8A4030" strokeWidth="1.3" fill="none" strokeLinecap="round" />

      {/* ── Tabard ─────────────────────────────────────────────── */}
      <Path
        d="M 12.5,27 Q 7,31 5,34.5 L 45,34.5 Q 43,31 37.5,27 Q 33,23.5 25,23.5 Q 17,23.5 12.5,27 Z"
        fill={tabard} stroke={DARK} strokeWidth="0.5"
      />
      {/* White collar */}
      <Path d="M 19,23.5 L 25,30 L 31,23.5" fill={WHITE} stroke={DARK} strokeWidth="0.5" />
      {/* Gold trim */}
      <Path d="M 12.5,27 Q 7,31 5,34.5"   stroke={GOLD} strokeWidth="2" fill="none" strokeLinecap="round" />
      <Path d="M 37.5,27 Q 43,31 45,34.5" stroke={GOLD} strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Diagonal livery stripes */}
      <Path d="M 6.5,34.5 L 18,27.5"  stroke={stripes} strokeWidth="0.9" opacity="0.38" />
      <Path d="M 12,34.5 L 22,27.5"   stroke={stripes} strokeWidth="0.9" opacity="0.38" />
      <Path d="M 43.5,34.5 L 32,27.5" stroke={stripes} strokeWidth="0.9" opacity="0.38" />
      <Path d="M 38,34.5 L 28,27.5"   stroke={stripes} strokeWidth="0.9" opacity="0.38" />

      {/* ── Halberd / spear (right side) ───────────────────────── */}
      <Rect  x="37"  y="9"  width="2"   height="25.5" rx="1"   fill="#7A3010" stroke={DARK} strokeWidth="0.3" />
      <Path d="M 36.5,9 L 38,3 L 39.5,9 Z"            fill={SILVER} stroke={DARK} strokeWidth="0.4" />
      <Path d="M 39,12 Q 44,14 43,18 Q 44,16 40.5,15 Z" fill={SILVER} stroke={DARK} strokeWidth="0.4" />
      <Path d="M 37,12 Q 32,14 33,18 Q 32,16 35.5,15 Z" fill={SILVER} stroke={DARK} strokeWidth="0.4" opacity="0.6" />

      {/* ── Shield (left side) ─────────────────────────────────── */}
      <Path d="M 7.5,27 L 7.5,31.5 Q 7.5,34.5 11.5,34.5 Q 15.5,34.5 15.5,31.5 L 15.5,27 Z"
            fill={WHITE} stroke={DARK} strokeWidth="0.5" />
      {/* Shield cross design in suit color */}
      <Path d="M 7.5,30 L 15.5,30"   stroke={tabard} strokeWidth="1.4" />
      <Path d="M 11.5,27 L 11.5,34.5" stroke={tabard} strokeWidth="1.4" />
      <Circle cx="11.5" cy="30" r="1.5" fill={GOLD} />
    </>
  );
}

function Jack({ isRed }: { isRed: boolean }) {
  return (
    <>
      <JackFigure isRed={isRed} />
      <G transform="rotate(180, 25, 35)">
        <JackFigure isRed={isRed} />
      </G>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function FaceCardArt({ value, isRed, size }: FaceCardArtProps) {
  const h = Math.round(size * 1.4);
  return (
    <Svg width={size} height={h} viewBox="0 0 50 70">
      {value === 'K' && <King isRed={isRed} />}
      {value === 'Q' && <Queen isRed={isRed} />}
      {value === 'J' && <Jack isRed={isRed} />}
    </Svg>
  );
}
