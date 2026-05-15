import React from 'react';
import Svg, { Circle, Path, Polygon, Rect, Ellipse, G, Line } from 'react-native-svg';

type AvatarProps = { size: number };

// ─── 16 Poker / Casino avatar illustrations ───────────────────────────────────

function SpadeAvatar({ size }: AvatarProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80">
      <Path
        d="M40 12 C40 12 18 26 18 40 C18 52 30 56 40 48 C50 56 62 52 62 40 C62 26 40 12 40 12Z"
        fill="#00d4ff"
      />
      <Path d="M36 48 L33 62 L47 62 L44 48Z" fill="#00d4ff" />
      <Rect x="28" y="60" width="24" height="5" rx="2" fill="#00d4ff" />
    </Svg>
  );
}

function HeartAvatar({ size }: AvatarProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80">
      <Path
        d="M40 62 C40 62 14 46 14 30 C14 20 22 14 30 18 C34 20 38 26 40 30 C42 26 46 20 50 18 C58 14 66 20 66 30 C66 46 40 62 40 62Z"
        fill="#ff0090"
      />
    </Svg>
  );
}

function DiamondGemAvatar({ size }: AvatarProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80">
      <Path d="M40 12 L64 36 L40 68 L16 36Z" fill="#00ffee" />
      <Path d="M40 12 L64 36 L40 30Z" fill="rgba(255,255,255,0.25)" />
      <Path d="M16 36 L40 30 L40 12Z" fill="rgba(0,0,0,0.15)" />
    </Svg>
  );
}

function ClubAvatar({ size }: AvatarProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80">
      <Circle cx="40" cy="28" r="12" fill="#00ff88" />
      <Circle cx="28" cy="44" r="12" fill="#00ff88" />
      <Circle cx="52" cy="44" r="12" fill="#00ff88" />
      <Rect x="36" y="52" width="8" height="16" rx="2" fill="#00ff88" />
      <Rect x="28" y="64" width="24" height="5" rx="2" fill="#00ff88" />
    </Svg>
  );
}

function PokerChipAvatar({ size }: AvatarProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80">
      <Circle cx="40" cy="40" r="28" fill="#1a0a00" stroke="#ffd700" strokeWidth="4" />
      <Circle cx="40" cy="40" r="20" fill="#cc2200" stroke="#ffd700" strokeWidth="2" />
      <Circle cx="40" cy="40" r="14" fill="#cc2200" stroke="#ffd700" strokeWidth="1.5" />
      <Rect x="37" y="12" width="6" height="10" rx="2" fill="#ffd700" />
      <Rect x="37" y="58" width="6" height="10" rx="2" fill="#ffd700" />
      <Rect x="12" y="37" width="10" height="6" rx="2" fill="#ffd700" />
      <Rect x="58" y="37" width="10" height="6" rx="2" fill="#ffd700" />
    </Svg>
  );
}

function CrownAvatar({ size }: AvatarProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80">
      <Path
        d="M12 56 L12 38 L26 50 L40 22 L54 50 L68 38 L68 56Z"
        fill="#ffd700"
        stroke="#ffa500"
        strokeWidth="2"
      />
      <Rect x="12" y="56" width="56" height="10" rx="3" fill="#ffd700" />
      <Circle cx="40" cy="22" r="5" fill="#ff0090" />
      <Circle cx="12" cy="38" r="4" fill="#ff0090" />
      <Circle cx="68" cy="38" r="4" fill="#ff0090" />
    </Svg>
  );
}

function SkullAvatar({ size }: AvatarProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80">
      <Ellipse cx="40" cy="36" rx="22" ry="24" fill="#bf5fff" />
      <Rect x="22" y="54" width="36" height="14" rx="4" fill="#bf5fff" />
      <Circle cx="31" cy="34" r="7" fill="#050010" />
      <Circle cx="49" cy="34" r="7" fill="#050010" />
      <Circle cx="31" cy="34" r="3" fill="#bf5fff" />
      <Circle cx="49" cy="34" r="3" fill="#bf5fff" />
      <Rect x="30" y="54" width="5" height="8" rx="1" fill="#050010" />
      <Rect x="37.5" y="54" width="5" height="8" rx="1" fill="#050010" />
      <Rect x="45" y="54" width="5" height="8" rx="1" fill="#050010" />
      <Path d="M34 47 L40 44 L46 47" stroke="#050010" strokeWidth="2" fill="none" />
    </Svg>
  );
}

function GhostAvatar({ size }: AvatarProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80">
      <Path
        d="M20 44 C20 26 28 14 40 14 C52 14 60 26 60 44 L60 64 L53 57 L46 64 L40 57 L34 64 L27 57 L20 64Z"
        fill="#00ffee"
        opacity={0.9}
      />
      <Ellipse cx="33" cy="38" rx="5" ry="6" fill="#050010" />
      <Ellipse cx="47" cy="38" rx="5" ry="6" fill="#050010" />
      <Circle cx="33" cy="38" r="2" fill="#00ffee" />
      <Circle cx="47" cy="38" r="2" fill="#00ffee" />
    </Svg>
  );
}

function FlameAvatar({ size }: AvatarProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80">
      <Path
        d="M40 66 C28 60 18 50 22 38 C24 32 30 34 32 38 C32 28 28 18 40 12 C42 24 40 28 44 38 C46 34 52 32 54 38 C58 50 52 60 40 66Z"
        fill="#ff6600"
      />
      <Path
        d="M40 60 C34 54 28 46 32 38 C34 34 36 36 36 40 C38 34 38 26 40 20 C42 32 40 34 42 40 C44 36 46 34 48 38 C52 46 46 54 40 60Z"
        fill="#ffcc00"
      />
    </Svg>
  );
}

function RobotAvatar({ size }: AvatarProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80">
      <Rect x="18" y="24" width="44" height="38" rx="6" fill="#0d1638" stroke="#00d4ff" strokeWidth="2" />
      <Circle cx="30" cy="38" r="7" fill="#050010" stroke="#00d4ff" strokeWidth="1.5" />
      <Circle cx="50" cy="38" r="7" fill="#050010" stroke="#00d4ff" strokeWidth="1.5" />
      <Circle cx="30" cy="38" r="3" fill="#00d4ff" />
      <Circle cx="50" cy="38" r="3" fill="#00d4ff" />
      <Rect x="26" y="51" width="28" height="7" rx="3" fill="#00d4ff" opacity={0.6} />
      <Rect x="30" y="53" width="6" height="3" rx="1" fill="#00d4ff" />
      <Rect x="38" y="53" width="6" height="3" rx="1" fill="#00d4ff" />
      <Rect x="46" y="53" width="6" height="3" rx="1" fill="#00d4ff" />
      <Line x1="40" y1="24" x2="40" y2="14" stroke="#00d4ff" strokeWidth="2.5" />
      <Circle cx="40" cy="12" r="4" fill="#00d4ff" />
    </Svg>
  );
}

function DiceAvatar({ size }: AvatarProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80">
      <Rect x="14" y="14" width="52" height="52" rx="10" fill="#0d1638" stroke="#ffd700" strokeWidth="3" />
      <Circle cx="27" cy="27" r="5" fill="#ffd700" />
      <Circle cx="53" cy="27" r="5" fill="#ffd700" />
      <Circle cx="27" cy="40" r="5" fill="#ffd700" />
      <Circle cx="53" cy="40" r="5" fill="#ffd700" />
      <Circle cx="27" cy="53" r="5" fill="#ffd700" />
      <Circle cx="40" cy="53" r="5" fill="#ffd700" />
      <Circle cx="53" cy="53" r="5" fill="#ffd700" />
    </Svg>
  );
}

function LightningAvatar({ size }: AvatarProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80">
      <Path
        d="M50 12 L28 44 L42 44 L30 68 L52 36 L38 36Z"
        fill="#ffee00"
        stroke="#ffa500"
        strokeWidth="1.5"
      />
    </Svg>
  );
}

function SharkAvatar({ size }: AvatarProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80">
      <Ellipse cx="40" cy="52" rx="26" ry="14" fill="#00d4ff" opacity={0.8} />
      <Path d="M40 52 L28 18 L52 18Z" fill="#00d4ff" />
      <Path d="M40 52 L28 18 L34 28Z" fill="rgba(255,255,255,0.25)" />
      <Ellipse cx="34" cy="50" rx="3" ry="2" fill="#050010" />
      <Path d="M30 56 L36 54 L32 58Z" fill="rgba(255,255,255,0.5)" />
      <Path d="M14 52 C14 52 18 42 26 40" stroke="rgba(255,255,255,0.3)" strokeWidth="2" fill="none" />
    </Svg>
  );
}

function SnakeAvatar({ size }: AvatarProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80">
      <Path
        d="M40 64 C24 64 14 54 14 44 C14 34 24 28 36 32 C48 36 52 28 52 20 C52 16 58 14 62 18 C66 22 66 30 58 36 C66 36 68 46 62 52 C56 58 48 64 40 64Z"
        fill="#00ff88"
        stroke="#00cc66"
        strokeWidth="1.5"
      />
      <Circle cx="62" cy="16" r="5" fill="#00ff88" />
      <Circle cx="60" cy="14" r="1.5" fill="#050010" />
      <Circle cx="64" cy="14" r="1.5" fill="#050010" />
      <Path d="M58 18 L62 22 L66 18" stroke="#ff2244" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function JokerAvatar({ size }: AvatarProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80">
      <Path d="M40 14 L30 32 L10 32 L26 44 L20 62 L40 50 L60 62 L54 44 L70 32 L50 32Z" fill="#bf5fff" />
      <Path d="M40 14 L36 26 L44 26Z" fill="#ff0090" />
      <Circle cx="30" cy="32" r="4" fill="#ff0090" />
      <Circle cx="50" cy="32" r="4" fill="#ff0090" />
      <Circle cx="40" cy="50" r="6" fill="#ff0090" />
      <Ellipse cx="40" cy="38" rx="8" ry="10" fill="#0d1638" stroke="#bf5fff" strokeWidth="1.5" />
      <Circle cx="37" cy="36" r="2" fill="#bf5fff" />
      <Circle cx="43" cy="36" r="2" fill="#bf5fff" />
      <Path d="M36 42 Q40 46 44 42" stroke="#bf5fff" strokeWidth="1.5" fill="none" />
    </Svg>
  );
}

function DragonAvatar({ size }: AvatarProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80">
      <Path
        d="M40 66 C26 66 14 56 14 44 C14 36 20 30 28 28 L22 16 L36 26 C37 26 38 26 40 26 C42 26 43 26 44 26 L58 16 L52 28 C60 30 66 36 66 44 C66 56 54 66 40 66Z"
        fill="#ff2244"
      />
      <Path d="M22 16 L28 28 L36 26Z" fill="#cc0000" />
      <Path d="M58 16 L52 28 L44 26Z" fill="#cc0000" />
      <Ellipse cx="32" cy="42" rx="6" ry="7" fill="#050010" />
      <Ellipse cx="48" cy="42" rx="6" ry="7" fill="#050010" />
      <Ellipse cx="32" cy="42" rx="3" ry="4" fill="#ffaa00" />
      <Ellipse cx="48" cy="42" rx="3" ry="4" fill="#ffaa00" />
      <Circle cx="32" cy="42" r="1.5" fill="#050010" />
      <Circle cx="48" cy="42" r="1.5" fill="#050010" />
      <Path d="M32 54 Q40 60 48 54" stroke="#ff6600" strokeWidth="2" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Avatar registry ──────────────────────────────────────────────────────────

export interface AvatarDef {
  id: number;
  name: string;
  accentColor: string;
  render: (size: number) => React.ReactElement;
}

export const CASINO_AVATARS: AvatarDef[] = [
  { id: 0,  name: 'Spade',   accentColor: '#00d4ff', render: s => <SpadeAvatar size={s} /> },
  { id: 1,  name: 'Heart',   accentColor: '#ff0090', render: s => <HeartAvatar size={s} /> },
  { id: 2,  name: 'Diamond', accentColor: '#00ffee', render: s => <DiamondGemAvatar size={s} /> },
  { id: 3,  name: 'Club',    accentColor: '#00ff88', render: s => <ClubAvatar size={s} /> },
  { id: 4,  name: 'Chip',    accentColor: '#ffd700', render: s => <PokerChipAvatar size={s} /> },
  { id: 5,  name: 'Crown',   accentColor: '#ffd700', render: s => <CrownAvatar size={s} /> },
  { id: 6,  name: 'Skull',   accentColor: '#bf5fff', render: s => <SkullAvatar size={s} /> },
  { id: 7,  name: 'Ghost',   accentColor: '#00ffee', render: s => <GhostAvatar size={s} /> },
  { id: 8,  name: 'Flame',   accentColor: '#ff6600', render: s => <FlameAvatar size={s} /> },
  { id: 9,  name: 'Robot',   accentColor: '#00d4ff', render: s => <RobotAvatar size={s} /> },
  { id: 10, name: 'Dice',    accentColor: '#ffd700', render: s => <DiceAvatar size={s} /> },
  { id: 11, name: 'Bolt',    accentColor: '#ffee00', render: s => <LightningAvatar size={s} /> },
  { id: 12, name: 'Shark',   accentColor: '#00d4ff', render: s => <SharkAvatar size={s} /> },
  { id: 13, name: 'Snake',   accentColor: '#00ff88', render: s => <SnakeAvatar size={s} /> },
  { id: 14, name: 'Joker',   accentColor: '#bf5fff', render: s => <JokerAvatar size={s} /> },
  { id: 15, name: 'Dragon',  accentColor: '#ff2244', render: s => <DragonAvatar size={s} /> },
];

export function getAvatar(index: number): AvatarDef {
  return CASINO_AVATARS[index % CASINO_AVATARS.length];
}
