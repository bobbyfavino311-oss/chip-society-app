import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

interface AscendingBarsIconProps {
  size?: number;
  color?: string;
  glow?: boolean;
  style?: ViewStyle;
}

// Freestanding 4-bar ascending graph — no box, no tile, no background fill.
// A faint radial ambient glow floats behind the bars; the bars themselves
// are transparent/outline so the mark feels suspended, not boxed-in.
const BAR_W = 3;
const GAP = 1.9;
const CORNER = 1.1;
const STROKE = 1.2;
const BASE_Y = 17.5;
const HEIGHTS = [3.6, 6.4, 9.2, 12];

export default function AscendingBarsIcon({ size = 32, color = '#00d4ff', glow = true, style }: AscendingBarsIconProps) {
  const totalW = HEIGHTS.length * BAR_W + (HEIGHTS.length - 1) * GAP;
  const startX = (24 - totalW) / 2;

  return (
    <View
      style={[
        glow && { shadowColor: color, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } },
        styles.wrap,
        style,
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Defs>
          <RadialGradient id="ambientGlow" cx="50%" cy="62%" r="60%">
            <Stop offset="0%" stopColor={color} stopOpacity={0.22} />
            <Stop offset="55%" stopColor={color} stopOpacity={0.08} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={12} cy={12.5} r={11} fill="url(#ambientGlow)" />
        {HEIGHTS.map((h, i) => {
          const x = startX + i * (BAR_W + GAP);
          const y = BASE_Y - h;
          const isFirst = i === 0;
          return (
            <Rect
              key={i}
              x={x}
              y={y}
              width={BAR_W}
              height={h}
              rx={CORNER}
              fill={isFirst ? color : 'none'}
              stroke={color}
              strokeWidth={STROKE}
            />
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});
