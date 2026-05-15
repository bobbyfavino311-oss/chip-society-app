import React from 'react';
import Svg, { Circle, Ellipse, Path, Rect, Text as SvgText } from 'react-native-svg';

interface FaceCardArtProps {
  value: 'J' | 'Q' | 'K' | 'A';
  isRed: boolean;
  size: number;
}

// ─── Design tokens ────────────────────────────────────────────────────────────
const SKIN    = '#D4A070';  // Miami tan
const SKIN_SH = '#A07040';  // shadow/depth
const GOLD    = '#FFD700';
const GOLD_FR = '#B89020';  // sunglass frame

// ─── KING — South Beach Godfather ─────────────────────────────────────────────
// Bold aviator shades, slicked hair, gold chain, white suit, lit cigar
function King({ isRed }: { isRed: boolean }) {
  const lens    = isRed ? '#AA0044' : '#004499';
  const lensHi  = isRed ? '#FF2277' : '#22AAFF';
  const shirt   = isRed ? '#FFBBCC' : '#BBDDFF';

  return (
    <>
      {/* ── HAIR — single clean path silhouette ── */}
      <Path
        d="M 6,26 Q 5,2 25,2 Q 45,2 44,26 Q 41,33 37,33 L 13,33 Q 9,33 6,26 Z"
        fill="#120810"
      />
      {/* Sideburns */}
      <Rect x="5"  y="25" width="6" height="18" rx="3" fill="#120810" />
      <Rect x="39" y="25" width="6" height="18" rx="3" fill="#120810" />
      {/* Silver temples */}
      <Ellipse cx="8"  cy="29" rx="2.8" ry="5" fill="#AAAAAA" opacity="0.5" />
      <Ellipse cx="42" cy="29" rx="2.8" ry="5" fill="#AAAAAA" opacity="0.5" />
      {/* Hair gloss wave */}
      <Path d="M 15,6 Q 20,3 25,4 Q 30,3 35,6" stroke="#2A1828" strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* ── FACE ── */}
      <Ellipse cx="25" cy="38" rx="14" ry="15" fill={SKIN} />
      {/* Jaw / chin depth */}
      <Ellipse cx="25" cy="50" rx="11" ry="5.5" fill={SKIN_SH} opacity="0.45" />
      {/* Beard shadow — one bold shape */}
      <Path
        d="M 13,44 Q 10,55 25,58 Q 40,55 37,44 Q 31,50 25,51 Q 19,50 13,44 Z"
        fill="#3A1808" opacity="0.28"
      />

      {/* ── AVIATOR SUNGLASSES — teardrop paths ── */}
      {/* Left lens */}
      <Path d="M 7,31 Q 7,23 16.5,23 Q 26,23 26,31 Q 26,41 16.5,42 Q 7,41 7,31 Z" fill={lens} />
      {/* Lens glare triangle */}
      <Path d="M 10,24 L 15,24 L 9.5,31 Z" fill={lensHi} opacity="0.4" />
      {/* Left frame stroke */}
      <Path d="M 7,31 Q 7,23 16.5,23 Q 26,23 26,31 Q 26,41 16.5,42 Q 7,41 7,31 Z"
            fill="none" stroke={GOLD_FR} strokeWidth="2.5" />
      {/* Right lens */}
      <Path d="M 24,31 Q 24,23 33.5,23 Q 43,23 43,31 Q 43,41 33.5,42 Q 24,41 24,31 Z" fill={lens} />
      <Path d="M 27,24 L 32,24 L 26.5,31 Z" fill={lensHi} opacity="0.4" />
      <Path d="M 24,31 Q 24,23 33.5,23 Q 43,23 43,31 Q 43,41 33.5,42 Q 24,41 24,31 Z"
            fill="none" stroke={GOLD_FR} strokeWidth="2.5" />
      {/* Bridge */}
      <Path d="M 26,27 L 24,27" stroke={GOLD_FR} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Temple bars */}
      <Path d="M  7,29 L 3,27" stroke={GOLD_FR} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <Path d="M 43,29 L 47,27" stroke={GOLD_FR} strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* ── NOSE SHADOW ── */}
      <Ellipse cx="25" cy="45" rx="2.5" ry="3.5" fill={SKIN_SH} opacity="0.5" />

      {/* ── LIP + CIGAR ── */}
      <Path d="M 19,51 Q 23,54.5 28,51" fill="#8A3820" />
      <Rect x="27.5" y="49.5" width="13" height="3.5" rx="1.7" fill="#C8A840" />
      {/* Cigar band */}
      <Rect x="31"   y="49.5" width="2"  height="3.5" fill="#E8C850" />
      {/* Ember */}
      <Circle cx="41"  cy="51.2" r="2.5" fill="#FF5500" />
      <Circle cx="41"  cy="51.2" r="1.2" fill="#FFBB00" />

      {/* ── WHITE SUIT ── */}
      <Path d="M 2,70 L 10,52 L 20,59 L 25,65 L 30,59 L 40,52 L 48,70 Z" fill="#F0EEE8" />
      <Path d="M 10,52 L 19,62 L 25,65" fill="none" stroke="#C8C6C0" strokeWidth="1.5" />
      <Path d="M 40,52 L 31,62 L 25,65" fill="none" stroke="#C8C6C0" strokeWidth="1.5" />
      {/* Open collar shirt */}
      <Path d="M 20,59 L 25,70 L 30,59 L 25,65 Z" fill={shirt} />

      {/* ── GOLD CHAIN — thick + bold ── */}
      <Path d="M 14,53 Q 25,64 36,53" stroke={GOLD} strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* Second chain layer */}
      <Path d="M 16,55.5 Q 25,65 34,55.5" stroke={GOLD} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.5" />
    </>
  );
}

// ─── QUEEN — Miami Glamour Diva ───────────────────────────────────────────────
// Giant 80s hair, bold makeup, hoop earrings, power blazer, statement necklace
function Queen({ isRed }: { isRed: boolean }) {
  const hair    = isRed ? '#880020' : '#0A0A28';
  const hairHi  = isRed ? '#CC3050' : '#2222BB';
  const lip     = isRed ? '#FF0055' : '#CC00EE';
  const lipHi   = isRed ? '#FF55AA' : '#EE55FF';
  const blazer  = isRed ? '#EE1177' : '#8800CC';
  const blazerHi = isRed ? '#FF55AA' : '#BB55EE';
  const eyeS    = isRed ? '#FF44AA' : '#9944FF';

  return (
    <>
      {/* ── MASSIVE 80S HAIR — fills top of card ── */}
      {/* Main hair mass */}
      <Path
        d="M 1,55 Q 0,28 6,14 Q 10,3 25,2 Q 40,3 44,14 Q 50,28 49,55
           Q 44,44 41,41 L 9,41 Q 6,44 1,55 Z"
        fill={hair}
      />
      {/* Volume bumps at top */}
      <Ellipse cx="14" cy="8"  rx="6"  ry="8"  fill={hair} />
      <Ellipse cx="36" cy="8"  rx="6"  ry="8"  fill={hair} />
      {/* Side voluminous swoops */}
      <Ellipse cx="4"  cy="35" rx="5"  ry="14" fill={hair} />
      <Ellipse cx="46" cy="35" rx="5"  ry="14" fill={hair} />
      {/* Curl/wave highlights */}
      <Path d="M 4,18  Q 7,8  14,8"   stroke={hairHi} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.65" />
      <Path d="M 46,18 Q 43,8  36,8"  stroke={hairHi} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.65" />
      <Path d="M 2,32  Q 1,22  4,16"  stroke={hairHi} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.5" />
      <Path d="M 48,32 Q 49,22 46,16" stroke={hairHi} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.5" />
      <Path d="M 16,3  Q 20,1  25,2 Q 30,1 34,3" stroke={hairHi} strokeWidth="3" fill="none" opacity="0.6" />

      {/* ── FACE ── */}
      <Ellipse cx="25" cy="41" rx="13.5" ry="14" fill={SKIN} />
      {/* Cheek blush */}
      <Ellipse cx="14" cy="44" rx="5" ry="3.5" fill="#FF8888" opacity="0.28" />
      <Ellipse cx="36" cy="44" rx="5" ry="3.5" fill="#FF8888" opacity="0.28" />

      {/* ── EYE MAKEUP — bold color blocks ── */}
      <Ellipse cx="19" cy="35" rx="6" ry="4.5" fill={eyeS} opacity="0.55" />
      <Ellipse cx="31" cy="35" rx="6" ry="4.5" fill={eyeS} opacity="0.55" />

      {/* ── BROWS — thick, dramatic arch ── */}
      <Path d="M 13,32 Q 18,27.5 23,30" stroke="#180820" strokeWidth="3"   fill="none" strokeLinecap="round" />
      <Path d="M 27,30 Q 32,27.5 37,32" stroke="#180820" strokeWidth="3"   fill="none" strokeLinecap="round" />

      {/* ── EYES — clean & punchy ── */}
      <Ellipse cx="19" cy="36.5" rx="4.5" ry="3.5" fill="#fff" />
      <Ellipse cx="31" cy="36.5" rx="4.5" ry="3.5" fill="#fff" />
      <Circle cx="19" cy="36.5" r="2.8" fill="#180818" />
      <Circle cx="31" cy="36.5" r="2.8" fill="#180818" />
      <Circle cx="20" cy="35.6" r="1.1" fill="#fff" />
      <Circle cx="32" cy="35.6" r="1.1" fill="#fff" />
      {/* Bold lash bar + wing */}
      <Path d="M 14.5,33.8 L 23.5,33.8" stroke="#180820" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <Path d="M 26.5,33.8 L 35.5,33.8" stroke="#180820" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <Path d="M 14.5,33.8 L 11.5,30.5" stroke="#180820" strokeWidth="2"   fill="none" strokeLinecap="round" />
      <Path d="M 35.5,33.8 L 38.5,30.5" stroke="#180820" strokeWidth="2"   fill="none" strokeLinecap="round" />

      {/* ── NOSE ── */}
      <Ellipse cx="25" cy="42.5" rx="2" ry="2.8" fill={SKIN_SH} opacity="0.4" />

      {/* ── HOT LIPS — the star of the face ── */}
      <Path d="M 17.5,49 Q 22,54.5 32.5,49" fill={lip} />
      <Path d="M 17.5,49 Q 21,46 25,49 Q 29,46 32.5,49" fill={lipHi} />
      <Ellipse cx="25" cy="48.5" rx="4" ry="1.2" fill="#fff" opacity="0.2" />

      {/* ── HOOP EARRINGS — big and gold ── */}
      <Circle cx="6"  cy="43" r="7" fill="none" stroke={GOLD} strokeWidth="3.5" />
      <Circle cx="44" cy="43" r="7" fill="none" stroke={GOLD} strokeWidth="3.5" />

      {/* ── POWER BLAZER ── */}
      <Path d="M 2,70 L 10,54 L 20,60 L 25,67 L 30,60 L 40,54 L 48,70 Z" fill={blazer} />
      {/* Shoulder pads */}
      <Ellipse cx="9"  cy="56" rx="9" ry="4" fill={blazer} />
      <Ellipse cx="41" cy="56" rx="9" ry="4" fill={blazer} />
      <Path d="M 10,54 L 19,63 L 25,67" fill="none" stroke={blazerHi} strokeWidth="1.5" />
      <Path d="M 40,54 L 31,63 L 25,67" fill="none" stroke={blazerHi} strokeWidth="1.5" />
      {/* Blouse */}
      <Path d="M 20,60 L 25,70 L 30,60 L 25,67 Z" fill="#FFF0F8" />

      {/* ── STATEMENT NECKLACE ── */}
      <Path d="M 15,54 Q 25,62 35,54" stroke={GOLD} strokeWidth="3" fill="none" strokeLinecap="round" />
      <Circle cx="25" cy="61" r="5"   fill={GOLD} />
      <Circle cx="25" cy="61" r="3.2" fill={lip} />
      <Circle cx="25" cy="61" r="1.5" fill={GOLD} />
    </>
  );
}

// ─── JACK — Miami Vice Detective (Crockett energy) ────────────────────────────
// Sandy hair, big round shades, Crockett stubble, pastel blazer, no tie, badge
function Jack({ isRed }: { isRed: boolean }) {
  const blazer   = isRed ? '#FF8FAB' : '#5FCCCC';
  const blazerSh = isRed ? '#CC4466' : '#2AACAC';
  const lens     = isRed ? '#AA0033' : '#003388';
  const lensHi   = isRed ? '#FF3388' : '#33AAFF';

  return (
    <>
      {/* ── SANDY HAIR — single path ── */}
      <Path
        d="M 8,29 Q 7,3 25,3 Q 43,3 42,29 Q 40,36 36,36 L 14,36 Q 10,36 8,29 Z"
        fill="#9B7030"
      />
      {/* Side hair down */}
      <Rect x="7"  y="28" width="6" height="16" rx="3" fill="#9B7030" />
      <Rect x="37" y="28" width="6" height="16" rx="3" fill="#9B7030" />
      {/* Sun-bleached highlight */}
      <Path d="M 17,4 Q 22,1 25,2 Q 28,1 33,4"   stroke="#DDB860" strokeWidth="3"   fill="none" strokeLinecap="round" opacity="0.65" />
      <Path d="M 13,10 Q 15,5 19,7"               stroke="#DDB860" strokeWidth="2"   fill="none" strokeLinecap="round" opacity="0.4" />
      {/* Hair texture wave */}
      <Path d="M 13,14 Q 18,8 25,10 Q 32,8 37,14" stroke="#7A5020" strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* ── FACE ── */}
      <Ellipse cx="25" cy="40" rx="14" ry="15" fill={SKIN} />
      {/* Chin shadow */}
      <Ellipse cx="25" cy="52" rx="11" ry="5.5" fill={SKIN_SH} opacity="0.45" />
      {/* Heavy Crockett stubble — one solid shape */}
      <Path
        d="M 13,46 Q 10,57 25,60 Q 40,57 37,46 Q 31,52 25,53 Q 19,52 13,46 Z"
        fill="#3A1808" opacity="0.3"
      />
      {/* Upper lip mustache shadow */}
      <Ellipse cx="25" cy="50" rx="7" ry="3" fill="#3A1808" opacity="0.22" />

      {/* ── ROUND SUNGLASSES — wayfarer-ish ── */}
      {/* Left lens */}
      <Ellipse cx="17.5" cy="34" rx="9"   ry="7.5" fill={lens} />
      <Path d="M 12,28 L 17,28 L 11,34 Z"                fill={lensHi} opacity="0.4" />
      <Ellipse cx="17.5" cy="34" rx="9"   ry="7.5" fill="none" stroke={GOLD_FR} strokeWidth="2.5" />
      {/* Right lens */}
      <Ellipse cx="32.5" cy="34" rx="9"   ry="7.5" fill={lens} />
      <Path d="M 27,28 L 32,28 L 26,34 Z"                fill={lensHi} opacity="0.4" />
      <Ellipse cx="32.5" cy="34" rx="9"   ry="7.5" fill="none" stroke={GOLD_FR} strokeWidth="2.5" />
      {/* Bridge */}
      <Path d="M 26.5,32.5 L 23.5,32.5" stroke={GOLD_FR} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Temples */}
      <Path d="M  8.5,32 L  4,30" stroke={GOLD_FR} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <Path d="M 41.5,32 L 46,30" stroke={GOLD_FR} strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* ── NOSE ── */}
      <Ellipse cx="25" cy="45" rx="2.5" ry="4" fill={SKIN_SH} opacity="0.45" />

      {/* ── COCKY SMIRK ── */}
      <Path d="M 19,52 Q 24.5,57 31,53" stroke="#8A3820" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <Path d="M 27,54 Q 30,52 32,53"   stroke="#8A3820" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* ── PASTEL BLAZER — wide lapels, open collar ── */}
      <Path d="M 2,70 L 10,53 L 20,60 L 25,66 L 30,60 L 40,53 L 48,70 Z" fill={blazer} />
      {/* Wide dark lapels — very 80s */}
      <Path d="M 10,53 L 20,63 L 25,66" fill={blazerSh} />
      <Path d="M 40,53 L 30,63 L 25,66" fill={blazerSh} />
      {/* No shirt, open chest — Crockett signature */}
      <Path d="M 20,60 L 25,70 L 30,60 L 25,66 Z" fill={SKIN} opacity="0.65" />

      {/* ── DETECTIVE BADGE ── */}
      <Rect x="12" y="59" width="9" height="7" rx="2.5" fill={GOLD} />
      <Rect x="13" y="60" width="7" height="5" rx="1.5" fill="#DAA520" />
      <Circle cx="16.5" cy="62.5" r="2" fill={GOLD} />
      <SvgText x="16.5" y="65.5" textAnchor="middle" fontSize="2.5" fill="#fff" fontWeight="800">MPD</SvgText>
    </>
  );
}

// ─── ACE — Neon Miami Nightscape ──────────────────────────────────────────────
function Ace({ isRed }: { isRed: boolean }) {
  const neon  = isRed ? '#FF0066' : '#00CCFF';
  const neon2 = isRed ? '#FF8800' : '#00FFAA';
  return (
    <>
      {/* Sky glow */}
      <Ellipse cx="25" cy="48" rx="25" ry="25" fill={neon} opacity="0.06" />
      {/* Sunset/rise disc */}
      <Circle cx="25" cy="44" r="12" fill={isRed ? '#FF4400' : '#FF8800'} opacity="0.22" />
      <Circle cx="25" cy="44" r="7"  fill={isRed ? '#FF6600' : '#FFBB00'} opacity="0.28" />
      {/* Horizon */}
      <Path d="M 3,48 L 47,48" stroke={neon} strokeWidth="1.5" fill="none" opacity="0.6" />
      {/* Grid/road lines — very 80s synthwave */}
      <Path d="M 25,48 L 5,70"  stroke={neon} strokeWidth="0.8" fill="none" opacity="0.4" />
      <Path d="M 25,48 L 45,70" stroke={neon} strokeWidth="0.8" fill="none" opacity="0.4" />
      <Path d="M 25,48 L 25,70" stroke={neon} strokeWidth="0.8" fill="none" opacity="0.4" />
      <Path d="M 15,55 L 35,55" stroke={neon} strokeWidth="0.6" fill="none" opacity="0.35" />
      <Path d="M 11,61 L 39,61" stroke={neon} strokeWidth="0.6" fill="none" opacity="0.3" />
      <Path d="M  7,67 L 43,67" stroke={neon} strokeWidth="0.6" fill="none" opacity="0.25" />
      {/* Palm tree left */}
      <Rect x="9"  y="36" width="2.5" height="14" rx="1.2" fill={neon2} opacity="0.8" />
      <Path d="M 10.2,36 Q 1,30  3,23  Q 6,31 10.2,36"  fill={neon2} opacity="0.8" />
      <Path d="M 10.2,36 Q 1,33  2,25  Q 6,32 10.2,36"  fill={neon2} opacity="0.5" />
      <Path d="M 10.2,36 Q 16,28 20,27 Q 16,33 10.2,36" fill={neon2} opacity="0.8" />
      {/* Palm tree right */}
      <Rect x="38.5" y="36" width="2.5" height="14" rx="1.2" fill={neon2} opacity="0.8" />
      <Path d="M 39.8,36 Q 49,30 47,23 Q 44,31 39.8,36" fill={neon2} opacity="0.8" />
      <Path d="M 39.8,36 Q 34,28 30,27 Q 34,33 39.8,36" fill={neon2} opacity="0.8" />
      {/* Neon city silhouette */}
      <Path d="M 3,48 L 3,44 L 6,44 L 6,42 L 8,42 L 8,40 L 10,40 L 10,42 L 12,42 L 12,43 L 14,43 L 14,48 Z"
            fill={neon} opacity="0.38" />
      <Path d="M 36,48 L 36,43 L 38,43 L 38,42 L 40,42 L 40,40 L 42,40 L 42,42 L 44,42 L 44,44 L 47,44 L 47,48 Z"
            fill={neon} opacity="0.38" />
      {/* Water neon reflections */}
      <Path d="M 8,52  Q 18,54 25,52 Q 32,54 42,52" stroke={neon} strokeWidth="1.5" fill="none" opacity="0.35" strokeLinecap="round" />
      <Path d="M 10,57 Q 18,59 25,57 Q 32,59 40,57" stroke={neon} strokeWidth="1"   fill="none" opacity="0.25" strokeLinecap="round" />
      <Path d="M 12,62 Q 19,64 25,62 Q 31,64 38,62" stroke={neon} strokeWidth="0.8" fill="none" opacity="0.18" strokeLinecap="round" />
    </>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────
export default function FaceCardArt({ value, isRed, size }: FaceCardArtProps) {
  // viewBox is 50×70 (5:7); render at correct aspect ratio so nothing gets squished
  const h = Math.round(size * 1.4);
  return (
    <Svg width={size} height={h} viewBox="0 0 50 70">
      {value === 'K' && <King isRed={isRed} />}
      {value === 'Q' && <Queen isRed={isRed} />}
      {value === 'J' && <Jack isRed={isRed} />}
      {value === 'A' && <Ace isRed={isRed} />}
    </Svg>
  );
}
