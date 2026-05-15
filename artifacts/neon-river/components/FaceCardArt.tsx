import React from 'react';
import Svg, { Circle, Ellipse, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';

interface FaceCardArtProps {
  value: 'J' | 'Q' | 'K' | 'A';
  isRed: boolean;
  size: number;
}

const SKIN = '#FDDBB4';
const SKIN_DARK = '#E8C99A';
const GOLD = '#DAA520';
const GOLD_LIGHT = '#FFD700';
const CREAM = '#FFF8E8';

function King({ isRed }: { isRed: boolean }) {
  const c = isRed ? '#C41818' : '#1a1a2e';
  const hair = isRed ? '#6B2D0E' : '#1C1007';

  return (
    <>
      {/* Crown base & points */}
      <Polygon points="10,22 13,10 18,18 25,6 32,18 37,10 40,22" fill={GOLD_LIGHT} />
      <Rect x="10" y="20" width="30" height="5" rx="1.5" fill={GOLD} />
      {/* Crown jewels */}
      <Circle cx="25" cy="11" r="3" fill="#FF4444" />
      <Circle cx="14" cy="16" r="1.8" fill="#4488FF" />
      <Circle cx="36" cy="16" r="1.8" fill="#44FF88" />
      {/* Hair behind face */}
      <Ellipse cx="25" cy="36" rx="14" ry="15" fill={hair} />
      {/* Face */}
      <Ellipse cx="25" cy="34" rx="12" ry="13" fill={SKIN} />
      {/* Eyebrows */}
      <Rect x="17" y="27" width="6" height="2" rx="1" fill={hair} />
      <Rect x="27" y="27" width="6" height="2" rx="1" fill={hair} />
      {/* Eyes */}
      <Ellipse cx="20" cy="32" rx="2.5" ry="2" fill="#fff" />
      <Ellipse cx="30" cy="32" rx="2.5" ry="2" fill="#fff" />
      <Circle cx="20" cy="32" r="1.5" fill={c} />
      <Circle cx="30" cy="32" r="1.5" fill={c} />
      <Circle cx="20.5" cy="31.5" r="0.5" fill="#fff" />
      <Circle cx="30.5" cy="31.5" r="0.5" fill="#fff" />
      {/* Nose */}
      <Ellipse cx="25" cy="37" rx="1.2" ry="1.8" fill={SKIN_DARK} opacity={0.5} />
      {/* Mustache */}
      <Path d="M17,41 Q21,38 25,41 Q29,38 33,41" fill={hair} strokeWidth={0} />
      <Ellipse cx="21" cy="40" rx="4" ry="1.5" fill={hair} />
      <Ellipse cx="29" cy="40" rx="4" ry="1.5" fill={hair} />
      {/* Beard */}
      <Path d="M14,44 Q13,52 25,58 Q37,52 36,44 Q30,50 25,51 Q20,50 14,44 Z" fill={hair} />
      {/* Robe body */}
      <Path d="M8,62 Q8,55 14,52 L36,52 Q42,55 42,62 L42,70 L8,70 Z" fill={c} opacity={0.9} />
      {/* Robe collar */}
      <Rect x="20" y="50" width="10" height="6" rx="2" fill={CREAM} />
      {/* Scepter/orb on robe */}
      <Circle cx="25" cy="60" r="4" fill={GOLD_LIGHT} opacity={0.6} />
      <SvgText x="25" y="63" textAnchor="middle" fontSize="5" fill={c} fontWeight="700">♔</SvgText>
    </>
  );
}

function Queen({ isRed }: { isRed: boolean }) {
  const c = isRed ? '#C41818' : '#1a1a2e';
  const hair = isRed ? '#8B1A1A' : '#2C1810';
  const dressColor = isRed ? '#C41818' : '#1a1a2e';

  return (
    <>
      {/* Hair volume behind face */}
      <Ellipse cx="25" cy="38" rx="15" ry="17" fill={hair} />
      {/* Side hair curls */}
      <Ellipse cx="11" cy="40" rx="5" ry="10" fill={hair} />
      <Ellipse cx="39" cy="40" rx="5" ry="10" fill={hair} />
      {/* Tiara */}
      <Path d="M12,26 L14,16 L19,22 L25,12 L31,22 L36,16 L38,26 Z" fill={GOLD_LIGHT} />
      <Rect x="12" y="24" width="26" height="4" rx="1.5" fill={GOLD} />
      {/* Tiara jewels */}
      <Circle cx="25" cy="14" r="3" fill="#FF44AA" />
      <Circle cx="17" cy="20" r="2" fill="#AA44FF" />
      <Circle cx="33" cy="20" r="2" fill="#44AAFF" />
      {/* Face */}
      <Ellipse cx="25" cy="37" rx="11" ry="13" fill={SKIN} />
      {/* Blush */}
      <Circle cx="16" cy="40" r="4" fill="#FF9999" opacity={0.35} />
      <Circle cx="34" cy="40" r="4" fill="#FF9999" opacity={0.35} />
      {/* Eyebrows — thin, arched */}
      <Path d="M17,29 Q20,27 23,29" stroke={hair} strokeWidth={1.5} fill="none" strokeLinecap="round" />
      <Path d="M27,29 Q30,27 33,29" stroke={hair} strokeWidth={1.5} fill="none" strokeLinecap="round" />
      {/* Eyes with lashes */}
      <Ellipse cx="20" cy="33" rx="3" ry="2.2" fill="#fff" />
      <Ellipse cx="30" cy="33" rx="3" ry="2.2" fill="#fff" />
      <Circle cx="20" cy="33" r="1.8" fill={c} />
      <Circle cx="30" cy="33" r="1.8" fill={c} />
      <Circle cx="20.6" cy="32.4" r="0.6" fill="#fff" />
      <Circle cx="30.6" cy="32.4" r="0.6" fill="#fff" />
      {/* Eyelashes top */}
      <Path d="M17,31 L17,29 M19,30.5 L19,28.5 M21,31 L21,29 M23,31.2 L23,29.5" stroke={hair} strokeWidth={1} fill="none" />
      <Path d="M27,31 L27,29.5 M29,30.5 L29,28.5 M31,31 L31,29 M33,31.2 L33,29.5" stroke={hair} strokeWidth={1} fill="none" />
      {/* Nose */}
      <Ellipse cx="25" cy="38" rx="1" ry="1.5" fill={SKIN_DARK} opacity={0.4} />
      {/* Lips */}
      <Path d="M20,43 Q25,47 30,43" fill="#FF6688" />
      <Path d="M20,43 Q22,41 25,43 Q28,41 30,43" fill="#FF4466" />
      {/* Necklace */}
      <Path d="M17,49 Q25,53 33,49" stroke={GOLD_LIGHT} strokeWidth={1.5} fill="none" />
      {/* Pearls */}
      {[17, 20, 23, 25, 27, 30, 33].map((x, i) => (
        <Circle key={i} cx={x} cy={i % 2 === 0 ? 49.5 : 51} r="1.2" fill={CREAM} />
      ))}
      {/* Dress body */}
      <Path d="M10,62 Q8,56 14,53 L36,53 Q42,56 40,62 L42,70 L8,70 Z" fill={dressColor} opacity={0.9} />
      {/* Dress rose */}
      <Circle cx="25" cy="61" r="4" fill="#FF4466" opacity={0.7} />
      <Circle cx="25" cy="61" r="2" fill="#FF6688" />
      <SvgText x="25" y="64" textAnchor="middle" fontSize="5" fill={CREAM} fontWeight="700">♕</SvgText>
    </>
  );
}

function Jack({ isRed }: { isRed: boolean }) {
  const c = isRed ? '#C41818' : '#1a1a2e';
  const hair = isRed ? '#5C2A0A' : '#1C1007';

  return (
    <>
      {/* Hat body */}
      <Path d="M12,28 L16,10 L25,6 L34,10 L38,28 Z" fill={c} />
      {/* Hat brim */}
      <Rect x="9" y="26" width="32" height="5" rx="2" fill={hair} />
      {/* Hat feather */}
      <Path d="M36,10 Q45,4 42,18 Q38,12 36,18" fill="#44AAFF" opacity={0.8} />
      {/* Hat band */}
      <Rect x="12" y="22" width="26" height="4" rx="1" fill={GOLD} opacity={0.8} />
      <Circle cx="25" cy="24" r="2" fill={GOLD_LIGHT} />
      {/* Hair below hat */}
      <Ellipse cx="25" cy="36" rx="13" ry="7" fill={hair} />
      {/* Face — younger, rounder */}
      <Ellipse cx="25" cy="39" rx="12" ry="13" fill={SKIN} />
      {/* Eyebrows */}
      <Rect x="17" y="33" width="5" height="1.8" rx="0.8" fill={hair} />
      <Rect x="28" y="33" width="5" height="1.8" rx="0.8" fill={hair} />
      {/* Eyes — bright, youthful */}
      <Ellipse cx="20" cy="38" rx="2.8" ry="2.5" fill="#fff" />
      <Ellipse cx="30" cy="38" rx="2.8" ry="2.5" fill="#fff" />
      <Circle cx="20" cy="38" r="2" fill={c} />
      <Circle cx="30" cy="38" r="2" fill={c} />
      <Circle cx="20.7" cy="37.3" r="0.7" fill="#fff" />
      <Circle cx="30.7" cy="37.3" r="0.7" fill="#fff" />
      {/* Nose */}
      <Ellipse cx="25" cy="43" rx="1.2" ry="1.8" fill={SKIN_DARK} opacity={0.4} />
      {/* Smile — youthful */}
      <Path d="M20,47 Q25,52 30,47" stroke="#AA6644" strokeWidth={1.5} fill="none" strokeLinecap="round" />
      {/* Collar/ruff */}
      <Path d="M13,53 Q25,58 37,53 L37,58 Q25,62 13,58 Z" fill={CREAM} />
      <Path d="M16,53 Q18,57 20,53 Q22,57 24,53 Q26,57 28,53 Q30,57 32,53 Q34,57 36,53" stroke="#CCBBAA" strokeWidth={0.8} fill="none" />
      {/* Tunic */}
      <Path d="M10,62 Q8,57 14,55 L36,55 Q42,57 40,62 L42,70 L8,70 Z" fill={c} opacity={0.9} />
      {/* Tunic emblem */}
      <SvgText x="25" y="66" textAnchor="middle" fontSize="6" fill={GOLD_LIGHT} fontWeight="700">♞</SvgText>
    </>
  );
}

function Ace({ isRed }: { isRed: boolean }) {
  const c = isRed ? '#C41818' : '#1a1a2e';
  const glow = isRed ? 'rgba(196,24,24,0.15)' : 'rgba(26,26,46,0.15)';
  return (
    <>
      {/* Outer glow ring */}
      <Circle cx="25" cy="36" r="20" fill={glow} />
      <Circle cx="25" cy="36" r="16" fill={glow} />
    </>
  );
}

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
