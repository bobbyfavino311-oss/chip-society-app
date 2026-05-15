import React from 'react';
import Svg, { Circle, Ellipse, Path, Rect, Text as SvgText } from 'react-native-svg';

interface FaceCardArtProps {
  value: 'J' | 'Q' | 'K' | 'A';
  isRed: boolean;
  size: number;
}

// ─── Miami Vice palette ────────────────────────────────────────────────────────
const SKIN       = '#D4A070';   // Miami tan
const SKIN_MID   = '#BA8850';   // face shadow
const SKIN_DARK  = '#9A6830';   // deep shadow / nose
const STUBBLE    = '#3C1A08';   // 3-day beard
const GOLD       = '#FFD700';   // gold jewelry
const GOLD_FRAME = '#C8A030';   // sunglass frames
const HAIR_SANDY = '#9B7030';   // dirty blonde (Jack)
const HAIR_DARK  = '#120A10';   // slicked dark (King)
const HAIR_RED   = '#7A1020';   // deep crimson (Queen red)
const HAIR_DARK2 = '#0A0A22';   // near-black (Queen black)

// ─── KING — The South Beach Godfather ────────────────────────────────────────
// Slicked salt-and-pepper hair, aviator shades, cigar, white suit, gold chain
function King({ isRed }: { isRed: boolean }) {
  const lensColor  = isRed ? '#FF1177' : '#00CCDD';
  const lensGlow   = isRed ? '#FF44AA' : '#22EEFF';
  const shirtColor = isRed ? '#FFAAC0' : '#88DDEE';
  const pocketColor = isRed ? '#FF2299' : '#00BBFF';

  return (
    <>
      {/* ── Slicked-back hair ── */}
      <Ellipse cx="25" cy="19" rx="15" ry="12" fill={HAIR_DARK} />
      {/* Wave texture */}
      <Path d="M11,19 Q17,12 25,15 Q33,12 39,19" stroke="#2A1818" strokeWidth="1.5" fill="none" />
      <Path d="M13,22 Q19,17 25,19 Q31,17 37,22" stroke="#2A1818" strokeWidth="1" fill="none" />
      {/* Silver temples — distinguished */}
      <Ellipse cx="12" cy="23" rx="2.8" ry="5" fill="#AAAAAA" opacity="0.5" />
      <Ellipse cx="38" cy="23" rx="2.8" ry="5" fill="#AAAAAA" opacity="0.5" />

      {/* ── Face ── */}
      <Ellipse cx="25" cy="35" rx="13" ry="15" fill={SKIN} />
      {/* Jaw shadow */}
      <Ellipse cx="25" cy="47" rx="12" ry="5" fill={SKIN_MID} opacity="0.35" />
      {/* 5 o'clock shadow */}
      <Ellipse cx="17" cy="40" rx="4.5" ry="6" fill={STUBBLE} opacity="0.16" />
      <Ellipse cx="33" cy="40" rx="4.5" ry="6" fill={STUBBLE} opacity="0.16" />
      <Ellipse cx="25" cy="46" rx="9.5" ry="5" fill={STUBBLE} opacity="0.2" />

      {/* ── Aviator sunglasses ── */}
      {/* Left lens */}
      <Ellipse cx="19" cy="32" rx="7.5" ry="5.5" fill={lensColor} opacity="0.9" />
      <Ellipse cx="16.5" cy="30" rx="2.5" ry="1.8" fill="#fff" opacity="0.28" />
      <Ellipse cx="19" cy="32" rx="7.5" ry="5.5" fill="none" stroke={GOLD_FRAME} strokeWidth="1.6" />
      {/* Right lens */}
      <Ellipse cx="31" cy="32" rx="7.5" ry="5.5" fill={lensColor} opacity="0.9" />
      <Ellipse cx="28.5" cy="30" rx="2.5" ry="1.8" fill="#fff" opacity="0.28" />
      <Ellipse cx="31" cy="32" rx="7.5" ry="5.5" fill="none" stroke={GOLD_FRAME} strokeWidth="1.6" />
      {/* Bridge */}
      <Path d="M26.5,31.5 Q28.5,30 30.5,31.5" stroke={GOLD_FRAME} strokeWidth="1.4" fill="none" />
      {/* Temple bars */}
      <Path d="M11.5,31.5 L8,30.5" stroke={GOLD_FRAME} strokeWidth="1.4" fill="none" />
      <Path d="M38.5,31.5 L42,30.5" stroke={GOLD_FRAME} strokeWidth="1.4" fill="none" />

      {/* ── Nose (just shadow) ── */}
      <Path d="M23.5,37 L23,42.5 Q25,44 27,42.5 L26.5,37" fill={SKIN_DARK} opacity="0.42" />

      {/* ── Cigar ── */}
      <Rect x="27.5" y="44.5" width="12" height="2.8" rx="1.4" fill="#C0A040" />
      <Rect x="27.5" y="44.5" width="2.5" height="2.8" rx="1" fill="#E0C050" />
      <Rect x="37" y="44.5" width="2.5" height="2.8" rx="1" fill="#A08030" />
      {/* Ember glow */}
      <Circle cx="40" cy="45.9" r="2" fill="#FF5500" opacity="0.8" />
      <Circle cx="40" cy="45.9" r="1" fill="#FFAA00" />
      {/* Lip clamp */}
      <Path d="M18,46 Q23,49 27,46" fill="#9A3A20" />

      {/* ── White power suit ── */}
      <Path d="M5,70 L12,52 L21,58 L25,64 L29,58 L38,52 L45,70 Z" fill="#F6F5F0" />
      {/* Lapel shading */}
      <Path d="M12,52 L20,61 L25,64" fill="none" stroke="#CCCCCC" strokeWidth="0.8" />
      <Path d="M38,52 L30,61 L25,64" fill="none" stroke="#CCCCCC" strokeWidth="0.8" />
      {/* Open-collar pastel shirt */}
      <Path d="M21,58 L25,70 L29,58 L25,64 Z" fill={shirtColor} opacity="0.9" />

      {/* ── Gold chain ── */}
      <Path d="M15,51 Q25,58 35,51" stroke={GOLD} strokeWidth="3" fill="none" strokeLinecap="round" />
      <Path d="M17.5,54 Q25,60 32.5,54" stroke={GOLD} strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.6" />
      {/* Chain pendant */}
      <Circle cx="25" cy="58.5" r="2.5" fill={GOLD} />
      <Circle cx="25" cy="58.5" r="1.3" fill={pocketColor} opacity="0.9" />

      {/* ── Pocket square ── */}
      <Path d="M11.5,59 L15.5,57.5 L15.5,63 L12,64.5 Z" fill={pocketColor} opacity="0.9" />
    </>
  );
}

// ─── QUEEN — The Miami Glamour Diva ──────────────────────────────────────────
// Huge 80s teased hair, dramatic makeup, statement earrings, shoulder-pad blazer
function Queen({ isRed }: { isRed: boolean }) {
  const lipColor     = isRed ? '#FF0066' : '#DD00FF';
  const lipHighlight = isRed ? '#FF66AA' : '#EE66FF';
  const blazerColor  = isRed ? '#FF1177' : '#9922CC';
  const blazerDark   = isRed ? '#CC0055' : '#7700AA';
  const eyeColor     = isRed ? '#FF44AA' : '#AA44FF';
  const hairColor    = isRed ? HAIR_RED : HAIR_DARK2;
  const hairHighlight = isRed ? '#AA2030' : '#222255';

  return (
    <>
      {/* ── Huge 80s teased hair ── */}
      {/* Wide base volume */}
      <Ellipse cx="25" cy="18" rx="19" ry="16" fill={hairColor} />
      {/* Side swoops */}
      <Ellipse cx="8"  cy="32" rx="7.5" ry="16" fill={hairColor} />
      <Ellipse cx="42" cy="32" rx="7.5" ry="16" fill={hairColor} />
      {/* Curl/wave texture at top */}
      <Path d="M8,10 Q13,4 20,8 Q22,3 25,6 Q28,3 30,8 Q37,4 42,10"
            stroke={hairHighlight} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <Path d="M6,17 Q9,10 12,17"  stroke={hairHighlight} strokeWidth="1.8" fill="none" />
      <Path d="M38,17 Q41,10 44,17" stroke={hairHighlight} strokeWidth="1.8" fill="none" />
      <Path d="M7,24 Q9,18 11,24"  stroke={hairHighlight} strokeWidth="1.4" fill="none" />
      <Path d="M39,24 Q41,18 43,24" stroke={hairHighlight} strokeWidth="1.4" fill="none" />
      {/* Highlight streak */}
      <Path d="M20,5 Q23,3 26,6" stroke={isRed ? '#FF6688' : '#5544AA'} strokeWidth="2" fill="none" opacity="0.5" />

      {/* ── Face ── */}
      <Ellipse cx="25" cy="37" rx="12.5" ry="14" fill={SKIN} />
      {/* Contouring */}
      <Ellipse cx="14.5" cy="40" rx="3" ry="6" fill={SKIN_MID} opacity="0.22" />
      <Ellipse cx="35.5" cy="40" rx="3" ry="6" fill={SKIN_MID} opacity="0.22" />

      {/* ── Eye makeup ── */}
      {/* Eyeshadow */}
      <Ellipse cx="19" cy="32" rx="5.5" ry="3.5" fill={eyeColor} opacity="0.5" />
      <Ellipse cx="31" cy="32" rx="5.5" ry="3.5" fill={eyeColor} opacity="0.5" />
      {/* Liner wing */}
      <Path d="M14,31 L12,29" stroke="#1A0820" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <Path d="M36,31 L38,29" stroke="#1A0820" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* Bold arched brows */}
      <Path d="M14.5,29 Q19,26 23,28"  stroke="#1A0820" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <Path d="M27,28 Q31,26 35.5,29" stroke="#1A0820" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      {/* Eyes */}
      <Ellipse cx="19" cy="33.5" rx="3.8" ry="3" fill="#fff" />
      <Ellipse cx="31" cy="33.5" rx="3.8" ry="3" fill="#fff" />
      <Circle cx="19" cy="33.5" r="2.4" fill="#180818" />
      <Circle cx="31" cy="33.5" r="2.4" fill="#180818" />
      <Circle cx="19" cy="33.5" r="1.4" fill={isRed ? '#500020' : '#100050'} />
      <Circle cx="31" cy="33.5" r="1.4" fill={isRed ? '#500020' : '#100050'} />
      <Circle cx="19.8" cy="32.7" r="0.8" fill="#fff" />
      <Circle cx="31.8" cy="32.7" r="0.8" fill="#fff" />
      {/* Upper lashes */}
      <Path d="M15.5,31.5 L14,29.5 M17,31 L16,29 M19,30.8 L18.8,28.8 M21,31 L21.5,29 M22.5,31.5 L23.5,29.5"
            stroke="#1A0820" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <Path d="M28.5,31 L28,29 M30,30.8 L30.5,28.8 M32,31 L32.5,29 M33.5,31.5 L34.5,29.5 M35,32 L36.5,30.5"
            stroke="#1A0820" strokeWidth="1.3" fill="none" strokeLinecap="round" />

      {/* Blush */}
      <Ellipse cx="13.5" cy="40" rx="5" ry="3.5" fill="#FF8888" opacity="0.3" />
      <Ellipse cx="36.5" cy="40" rx="5" ry="3.5" fill="#FF8888" opacity="0.3" />

      {/* Nose */}
      <Ellipse cx="25" cy="39" rx="1.5" ry="2" fill={SKIN_DARK} opacity="0.38" />

      {/* ── Hot pink lips ── */}
      <Path d="M18,44.5 Q22,49.5 32,44.5" fill={lipColor} />
      <Path d="M18,44.5 Q21,42 25,44.5 Q29,42 32,44.5" fill={lipHighlight} />
      <Ellipse cx="25" cy="44" rx="3" ry="0.9" fill="#fff" opacity="0.2" />

      {/* ── Statement hoop earrings ── */}
      <Circle cx="7"  cy="38" r="5.5" fill="none" stroke={GOLD} strokeWidth="2.5" />
      <Circle cx="43" cy="38" r="5.5" fill="none" stroke={GOLD} strokeWidth="2.5" />
      <Circle cx="7"  cy="42" r="1.5" fill={GOLD} />
      <Circle cx="43" cy="42" r="1.5" fill={GOLD} />

      {/* ── Power blazer with shoulder pads ── */}
      <Path d="M5,70 L11,52 L20,58 L25,65 L30,58 L39,52 L45,70 Z" fill={blazerColor} />
      {/* Shoulder pads — very 80s */}
      <Ellipse cx="10" cy="53" rx="7" ry="3.5" fill={blazerDark} />
      <Ellipse cx="40" cy="53" rx="7" ry="3.5" fill={blazerDark} />
      {/* Lapels */}
      <Path d="M11,52 L20,61 L25,65" fill="none" stroke={isRed ? '#FF88BB' : '#CC88FF'} strokeWidth="1" />
      <Path d="M39,52 L30,61 L25,65" fill="none" stroke={isRed ? '#FF88BB' : '#CC88FF'} strokeWidth="1" />
      {/* Blouse under */}
      <Path d="M20,58 L25,70 L30,58 L25,65 Z" fill="#FFF0F8" opacity="0.88" />

      {/* ── Gold statement necklace ── */}
      <Path d="M16,51 Q25,57 34,51" stroke={GOLD} strokeWidth="2" fill="none" strokeLinecap="round" />
      <Circle cx="25" cy="55.5" r="3.5" fill={GOLD} />
      <Circle cx="25" cy="55.5" r="2" fill={lipColor} />
      <Circle cx="19.5" cy="53"  r="2" fill={GOLD} />
      <Circle cx="30.5" cy="53"  r="2" fill={GOLD} />
    </>
  );
}

// ─── JACK — The Miami Vice Detective (Crockett vibes) ────────────────────────
// Sandy stubbled face, aviator shades, pastel blazer open collar, no tie, badge
function Jack({ isRed }: { isRed: boolean }) {
  const blazerColor = isRed ? '#FF8FAB' : '#5FD3D3';
  const blazerDark  = isRed ? '#DD4466' : '#2AACAC';
  const lensColor   = isRed ? '#FF2266' : '#00CCDD';
  const badgeColor  = isRed ? '#FF8FAB' : '#5FD3D3';

  return (
    <>
      {/* ── Sandy dirty-blonde hair ── */}
      <Ellipse cx="25" cy="19" rx="14" ry="11" fill={HAIR_SANDY} />
      {/* Hair down sides */}
      <Ellipse cx="12" cy="25" rx="3.5" ry="7" fill={HAIR_SANDY} />
      <Ellipse cx="38" cy="25" rx="3.5" ry="7" fill={HAIR_SANDY} />
      {/* Casual messy wave */}
      <Path d="M12,17 Q18,10 25,13 Q32,10 38,17" stroke="#7A5020" strokeWidth="2" fill="none" />
      <Path d="M23,12 Q25,9 28,12" stroke="#7A5020" strokeWidth="1.5" fill="none" />
      {/* Slight highlight streak — sun-bleached */}
      <Path d="M21,11 Q24,8 27,11" stroke="#DDB860" strokeWidth="1.5" fill="none" opacity="0.7" />

      {/* ── Face ── */}
      <Ellipse cx="25" cy="34" rx="13" ry="14.5" fill={SKIN} />
      {/* Jaw shadow */}
      <Ellipse cx="25" cy="47" rx="11" ry="5" fill={SKIN_MID} opacity="0.3" />

      {/* ── Heavy Crockett stubble ── */}
      <Ellipse cx="17" cy="39" rx="5" ry="6" fill={STUBBLE} opacity="0.18" />
      <Ellipse cx="33" cy="39" rx="5" ry="6" fill={STUBBLE} opacity="0.18" />
      <Ellipse cx="25" cy="45" rx="10" ry="5.5" fill={STUBBLE} opacity="0.22" />
      {/* Stubble dots */}
      {([
        [17,40],[19,43],[21,45],[23,46],[25,47],[27,46],[29,45],[31,43],[33,40],
        [18,37],[20,38],[30,38],[32,37],[22,44],[28,44],
      ] as [number,number][]).map(([cx, cy], i) => (
        <Circle key={i} cx={cx} cy={cy} r="0.65" fill={STUBBLE} opacity="0.45" />
      ))}

      {/* ── Round aviator sunglasses (wayfarer-ish) ── */}
      {/* Left lens */}
      <Ellipse cx="18.5" cy="31.5" rx="7.5" ry="6" fill={lensColor} opacity="0.88" />
      <Ellipse cx="16"  cy="29.5" rx="2.5" ry="1.8" fill="#fff" opacity="0.3" />
      <Ellipse cx="18.5" cy="31.5" rx="7.5" ry="6" fill="none" stroke={GOLD_FRAME} strokeWidth="1.7" />
      {/* Right lens */}
      <Ellipse cx="31.5" cy="31.5" rx="7.5" ry="6" fill={lensColor} opacity="0.88" />
      <Ellipse cx="29"  cy="29.5" rx="2.5" ry="1.8" fill="#fff" opacity="0.3" />
      <Ellipse cx="31.5" cy="31.5" rx="7.5" ry="6" fill="none" stroke={GOLD_FRAME} strokeWidth="1.7" />
      {/* Bridge */}
      <Path d="M26,31 L24,31" stroke={GOLD_FRAME} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      {/* Temple bars */}
      <Path d="M11,31 L8,30"  stroke={GOLD_FRAME} strokeWidth="1.4" fill="none" />
      <Path d="M39,31 L42,30" stroke={GOLD_FRAME} strokeWidth="1.4" fill="none" />

      {/* ── Nose ── */}
      <Path d="M23.5,36 L23,41 Q25,42.5 27,41 L26.5,36" fill={SKIN_DARK} opacity="0.38" />

      {/* ── Cocky half-smirk ── */}
      <Path d="M19,45.5 Q23.5,49 28,46" stroke="#8A3A20" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <Path d="M25.5,46 Q28,44.5 30,45.5" stroke="#8A3A20" strokeWidth="1.2" fill="none" strokeLinecap="round" />

      {/* ── Pastel blazer — NO tie, open collar ── */}
      <Path d="M5,70 L12,52 L21,58 L25,64 L29,58 L38,52 L45,70 Z" fill={blazerColor} />
      {/* Wide 80s lapels */}
      <Path d="M12,52 L21,62 L25,64" fill={blazerDark} />
      <Path d="M38,52 L29,62 L25,64" fill={blazerDark} />
      {/* Chest — open collar, no shirt */}
      <Path d="M21,58 L25,70 L29,58 L25,64 Z" fill={SKIN} opacity="0.55" />
      {/* Chest hair — very Crockett */}
      <Path d="M23,61 Q25,59 27,61" stroke="#9B7030" strokeWidth="1" fill="none" opacity="0.6" />
      <Path d="M22.5,63.5 Q25,61.5 27.5,63.5" stroke="#9B7030" strokeWidth="0.8" fill="none" opacity="0.5" />

      {/* ── Detective badge on lapel ── */}
      <Rect x="12" y="57" width="7" height="5" rx="1.5" fill={GOLD} />
      <Rect x="12.8" y="57.8" width="5.4" height="3.4" rx="1" fill="#DAA520" />
      <Circle cx="15.5" cy="59.5" r="1.2" fill={GOLD} />
      <SvgText x="15.5" y="62.5" textAnchor="middle" fontSize="1.8" fill="#fff" fontWeight="800">MIAMI</SvgText>
    </>
  );
}

// ─── ACE — Neon Miami Skyline ─────────────────────────────────────────────────
function Ace({ isRed }: { isRed: boolean }) {
  const glow  = isRed ? '#FF0066' : '#00CCFF';
  const glow2 = isRed ? '#FF44AA' : '#00FFCC';
  return (
    <>
      {/* Sky gradient glow */}
      <Ellipse cx="25" cy="50" rx="24" ry="22" fill={glow} opacity="0.07" />
      {/* Setting sun */}
      <Circle cx="25" cy="42" r="10" fill={isRed ? '#FF4400' : '#FF8800'} opacity="0.25" />
      <Circle cx="25" cy="42" r="6" fill={isRed ? '#FF6600' : '#FFAA00'} opacity="0.3" />
      {/* Horizon line */}
      <Path d="M4,48 L46,48" stroke={glow} strokeWidth="1" fill="none" opacity="0.5" />
      {/* Palm tree left */}
      <Rect x="9" y="34" width="2" height="16" rx="1" fill={glow2} opacity="0.7" />
      <Path d="M10,34 Q2,28 5,24 Q7,30 10,34" fill={glow2} opacity="0.7" />
      <Path d="M10,34 Q4,32 5,26 Q8,31 10,34" fill={glow2} opacity="0.5" />
      <Path d="M10,34 Q14,27 18,27 Q15,32 10,34" fill={glow2} opacity="0.7" />
      {/* Palm tree right */}
      <Rect x="39" y="34" width="2" height="16" rx="1" fill={glow2} opacity="0.7" />
      <Path d="M40,34 Q48,28 45,24 Q43,30 40,34" fill={glow2} opacity="0.7" />
      <Path d="M40,34 Q36,27 32,27 Q35,32 40,34" fill={glow2} opacity="0.7" />
      {/* City skyline silhouette */}
      <Path d="M4,55 L4,50 L8,50 L8,48 L10,48 L10,46 L12,46 L12,44 L14,44 L14,48 L16,48 L16,47 L18,47 L18,50 L20,50 L20,49 L22,49 L22,55 Z"
            fill={glow} opacity="0.35" />
      <Path d="M28,55 L28,50 L30,50 L30,49 L32,49 L32,47 L34,47 L34,48 L36,48 L36,44 L38,44 L38,46 L40,46 L40,48 L42,48 L42,50 L46,50 L46,55 Z"
            fill={glow} opacity="0.35" />
      {/* Neon reflections on water */}
      <Path d="M8,55 Q16,57 25,55 Q34,57 42,55" stroke={glow} strokeWidth="1.5" fill="none" opacity="0.3" strokeLinecap="round" />
      <Path d="M10,58 Q18,60 25,58 Q32,60 40,58" stroke={glow} strokeWidth="1" fill="none" opacity="0.2" strokeLinecap="round" />
      <Path d="M12,61 Q20,63 25,61 Q30,63 38,61" stroke={glow} strokeWidth="0.8" fill="none" opacity="0.15" strokeLinecap="round" />
    </>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function FaceCardArt({ value, isRed, size }: FaceCardArtProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 50 70">
      {value === 'K' && <King isRed={isRed} />}
      {value === 'Q' && <Queen isRed={isRed} />}
      {value === 'J' && <Jack isRed={isRed} />}
      {value === 'A' && <Ace isRed={isRed} />}
    </Svg>
  );
}
