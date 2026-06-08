import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

interface TigerCardFrameProps {
  width: number;
  height: number;
}

export default function TigerCardFrame({ width: w, height: h }: TigerCardFrameProps) {
  if (w === 0 || h === 0) return null;

  const GOLD     = '#C8940A';
  const AMBER    = '#8B5E00';
  const PAD      = 6;
  const PAD2     = 10;
  const COIN_R   = 9;
  const corners: [number, number][] = [
    [PAD + COIN_R, PAD + COIN_R],
    [w - PAD - COIN_R, PAD + COIN_R],
    [PAD + COIN_R, h - PAD - COIN_R],
    [w - PAD - COIN_R, h - PAD - COIN_R],
  ];

  return (
    <View
      style={[StyleSheet.absoluteFillObject, { zIndex: 10 }]}
      pointerEvents="none"
    >
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Defs>
          <LinearGradient id="tfTopEdge" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0"   stopColor={GOLD} stopOpacity="0" />
            <Stop offset="0.3" stopColor={GOLD} stopOpacity="0.65" />
            <Stop offset="0.7" stopColor={GOLD} stopOpacity="0.65" />
            <Stop offset="1"   stopColor={GOLD} stopOpacity="0" />
          </LinearGradient>
          <LinearGradient id="tfBotEdge" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0"   stopColor={AMBER} stopOpacity="0" />
            <Stop offset="0.3" stopColor={AMBER} stopOpacity="0.50" />
            <Stop offset="0.7" stopColor={AMBER} stopOpacity="0.50" />
            <Stop offset="1"   stopColor={AMBER} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Outer border */}
        <Rect
          x={PAD} y={PAD} width={w - PAD * 2} height={h - PAD * 2}
          rx={6} ry={6}
          fill="none" stroke={GOLD} strokeWidth={1.2} strokeOpacity={0.55}
        />
        {/* Inner border */}
        <Rect
          x={PAD2} y={PAD2} width={w - PAD2 * 2} height={h - PAD2 * 2}
          rx={4} ry={4}
          fill="none" stroke={AMBER} strokeWidth={0.6} strokeOpacity={0.35}
        />

        {/* Gradient top edge bar */}
        <Rect x={PAD} y={PAD} width={w - PAD * 2} height={1.5}
          fill="url(#tfTopEdge)" />
        {/* Gradient bottom edge bar */}
        <Rect x={PAD} y={h - PAD - 1.5} width={w - PAD * 2} height={1.5}
          fill="url(#tfBotEdge)" />

        {/* Fortune coin corner ornaments */}
        {corners.map(([cx, cy], i) => (
          <React.Fragment key={i}>
            <Circle cx={cx} cy={cy} r={COIN_R}
              fill="rgba(10,6,0,0.70)" stroke={GOLD} strokeWidth={1.0} strokeOpacity={0.55} />
            <Circle cx={cx} cy={cy} r={COIN_R * 0.62}
              fill="none" stroke={GOLD} strokeWidth={0.5} strokeOpacity={0.35} />
            {/* Square hole */}
            <Rect
              x={cx - 3.5} y={cy - 3.5} width={7} height={7}
              fill="rgba(0,0,0,0.70)" stroke={GOLD} strokeWidth={0.6} strokeOpacity={0.45}
            />
          </React.Fragment>
        ))}

        {/* Center-top claw mark */}
        <Line x1={w / 2 - 8} y1={PAD + 2} x2={w / 2 - 4} y2={PAD + 7}
          stroke={GOLD} strokeWidth={1.0} strokeOpacity={0.30} strokeLinecap="round" />
        <Line x1={w / 2}     y1={PAD + 1} x2={w / 2}     y2={PAD + 7}
          stroke={GOLD} strokeWidth={1.2} strokeOpacity={0.35} strokeLinecap="round" />
        <Line x1={w / 2 + 8} y1={PAD + 2} x2={w / 2 + 4} y2={PAD + 7}
          stroke={GOLD} strokeWidth={1.0} strokeOpacity={0.30} strokeLinecap="round" />

        {/* Center-bottom claw mark */}
        <Line x1={w / 2 - 8} y1={h - PAD - 2} x2={w / 2 - 4} y2={h - PAD - 7}
          stroke={GOLD} strokeWidth={1.0} strokeOpacity={0.30} strokeLinecap="round" />
        <Line x1={w / 2}     y1={h - PAD - 1} x2={w / 2}     y2={h - PAD - 7}
          stroke={GOLD} strokeWidth={1.2} strokeOpacity={0.35} strokeLinecap="round" />
        <Line x1={w / 2 + 8} y1={h - PAD - 2} x2={w / 2 + 4} y2={h - PAD - 7}
          stroke={GOLD} strokeWidth={1.0} strokeOpacity={0.30} strokeLinecap="round" />

        {/* Diamond center pip top / bottom */}
        <Path
          d={`M ${w / 2} ${PAD - 3} L ${w / 2 + 4} ${PAD + 1} L ${w / 2} ${PAD + 5} L ${w / 2 - 4} ${PAD + 1} Z`}
          fill="none" stroke={GOLD} strokeWidth={0.7} strokeOpacity={0.28} />
        <Path
          d={`M ${w / 2} ${h - PAD + 3} L ${w / 2 + 4} ${h - PAD - 1} L ${w / 2} ${h - PAD - 5} L ${w / 2 - 4} ${h - PAD - 1} Z`}
          fill="none" stroke={GOLD} strokeWidth={0.7} strokeOpacity={0.28} />
      </Svg>
    </View>
  );
}
