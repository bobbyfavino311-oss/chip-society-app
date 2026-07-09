import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

interface AscendingBarsIconProps {
  size?: number;
  color?: string;
  glow?: boolean;
  style?: ViewStyle;
}

const BAR_W = 3.4;
const GAP = 1.6;
const CORNER = 1.2;
const STROKE = 1.4;
const BASE_Y = 18;
const HEIGHTS = [4, 8, 12, 16];

export default function AscendingBarsIcon({ size = 32, color = '#00d4ff', glow = true, style }: AscendingBarsIconProps) {
  const totalW = HEIGHTS.length * BAR_W + (HEIGHTS.length - 1) * GAP;
  const startX = (24 - totalW) / 2;

  return (
    <View
      style={[
        glow && { shadowColor: color, shadowOpacity: 0.5, shadowRadius: 7, shadowOffset: { width: 0, height: 0 } },
        styles.wrap,
        style,
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
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
              fill={isFirst ? color : 'transparent'}
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
  },
});
