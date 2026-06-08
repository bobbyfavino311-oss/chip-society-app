import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

interface SakuraCardFrameProps {
  width: number;
  height: number;
}

const PINK = '#F4A8C0';
const ROSE = '#E8627A';
const PLUM = '#C4407C';

// 4-petal blossom corner ornament
function CornerBlossom({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const offsets: [number, number][] = [[0, -r], [r, 0], [0, r], [-r, 0]];
  return (
    <>
      <Circle cx={cx} cy={cy} r={r * 0.55}
        fill={PINK} fillOpacity={0.55} />
      {offsets.map(([ox, oy], i) => (
        <Ellipse key={i}
          cx={cx + ox * 0.5} cy={cy + oy * 0.5}
          rx={r * 0.65} ry={r * 0.48}
          fill={PINK} fillOpacity={0.42}
          transform={`rotate(${i * 90}, ${cx + ox * 0.5}, ${cy + oy * 0.5})`}
        />
      ))}
      {/* Center dot */}
      <Circle cx={cx} cy={cy} r={r * 0.20}
        fill={ROSE} fillOpacity={0.70} />
    </>
  );
}

export default function SakuraCardFrame({ width: w, height: h }: SakuraCardFrameProps) {
  if (w === 0 || h === 0) return null;

  const PAD  = 6;
  const PAD2 = 10;
  const CR   = 8; // corner blossom radius

  const corners: [number, number][] = [
    [PAD + CR, PAD + CR],
    [w - PAD - CR, PAD + CR],
    [PAD + CR, h - PAD - CR],
    [w - PAD - CR, h - PAD - CR],
  ];

  return (
    <View
      style={[StyleSheet.absoluteFillObject, { zIndex: 10 }]}
      pointerEvents="none"
    >
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Defs>
          <LinearGradient id="skTopEdge" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0"   stopColor={ROSE} stopOpacity="0" />
            <Stop offset="0.3" stopColor={ROSE} stopOpacity="0.55" />
            <Stop offset="0.7" stopColor={ROSE} stopOpacity="0.55" />
            <Stop offset="1"   stopColor={ROSE} stopOpacity="0" />
          </LinearGradient>
          <LinearGradient id="skBotEdge" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0"   stopColor={PLUM} stopOpacity="0" />
            <Stop offset="0.3" stopColor={PLUM} stopOpacity="0.40" />
            <Stop offset="0.7" stopColor={PLUM} stopOpacity="0.40" />
            <Stop offset="1"   stopColor={PLUM} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Outer border */}
        <Rect
          x={PAD} y={PAD} width={w - PAD * 2} height={h - PAD * 2}
          rx={6} ry={6}
          fill="none" stroke={ROSE} strokeWidth={1.2} strokeOpacity={0.50}
        />
        {/* Inner border */}
        <Rect
          x={PAD2} y={PAD2} width={w - PAD2 * 2} height={h - PAD2 * 2}
          rx={4} ry={4}
          fill="none" stroke={PINK} strokeWidth={0.5} strokeOpacity={0.28}
        />

        {/* Gradient edge bars */}
        <Rect x={PAD} y={PAD} width={w - PAD * 2} height={1.5}
          fill="url(#skTopEdge)" />
        <Rect x={PAD} y={h - PAD - 1.5} width={w - PAD * 2} height={1.5}
          fill="url(#skBotEdge)" />

        {/* Corner blossom ornaments */}
        {corners.map(([cx, cy], i) => (
          <CornerBlossom key={i} cx={cx} cy={cy} r={CR} />
        ))}

        {/* Center-top petal accent */}
        <Path
          d={`M ${w / 2} ${PAD - 2} Q ${w / 2 - 5} ${PAD + 4} ${w / 2} ${PAD + 8} Q ${w / 2 + 5} ${PAD + 4} ${w / 2} ${PAD - 2} Z`}
          fill={PINK} fillOpacity={0.30}
        />
        {/* Center-bottom petal accent */}
        <Path
          d={`M ${w / 2} ${h - PAD + 2} Q ${w / 2 - 5} ${h - PAD - 4} ${w / 2} ${h - PAD - 8} Q ${w / 2 + 5} ${h - PAD - 4} ${w / 2} ${h - PAD + 2} Z`}
          fill={PINK} fillOpacity={0.30}
        />
      </Svg>
    </View>
  );
}
