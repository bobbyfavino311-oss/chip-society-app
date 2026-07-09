import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

interface AscendingBarsIconProps {
  size?: number;
  color?: string;
  glow?: boolean;
  style?: ViewStyle;
}

// Freestanding 4-bar ascending graph — NO box, NO tile, NO background fill,
// NO native View shadow (that renders as a rectangular blur = "black box").
// All glow lives purely inside the SVG as a radial gradient, so the only
// pixels drawn are the glow + the bars themselves. Fully transparent otherwise.
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
    <View style={[styles.wrap, style]}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {glow && (
          <Defs>
            <RadialGradient id="ambientGlow" cx="50%" cy="62%" r="65%">
              <Stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <Stop offset="55%" stopColor={color} stopOpacity={0.1} />
              <Stop offset="100%" stopColor={color} stopOpacity={0} />
            </RadialGradient>
          </Defs>
        )}
        {glow && <Circle cx={12} cy={12.5} r={11} fill="url(#ambientGlow)" />}
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
