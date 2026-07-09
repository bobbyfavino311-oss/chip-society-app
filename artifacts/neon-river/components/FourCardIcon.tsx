import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import Svg, { G, Rect } from 'react-native-svg';

interface FourCardIconProps {
  size?: number;
  color?: string;
  glow?: boolean;
  style?: ViewStyle;
}

// Premium minimalist four-card mark — exactly 4 identical cards, evenly
// spaced, fanned only ~12° total. Center two stay near-vertical, outer two
// tilt slightly. Outline only, no fill, no decoration — reads instantly
// at small sizes as "four hole cards".
const CARD_W = 6.4;
const CARD_H = 10.4;
const CORNER = 1.5;
const STROKE = 1.3;

const CARDS = [
  { x: -7.2, rotate: -6 },
  { x: -2.4, rotate: -2 },
  { x: 2.4, rotate: 2 },
  { x: 7.2, rotate: 6 },
];

export default function FourCardIcon({ size = 32, color = '#7c3aed', glow = true, style }: FourCardIconProps) {
  return (
    <View
      style={[
        glow && { shadowColor: color, shadowOpacity: 0.4, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
        styles.wrap,
        style,
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <G>
          {CARDS.map((c, i) => (
            <G key={i} transform={`translate(${12 + c.x}, 12) rotate(${c.rotate})`}>
              <Rect
                x={-CARD_W / 2}
                y={-CARD_H / 2}
                width={CARD_W}
                height={CARD_H}
                rx={CORNER}
                fill="none"
                stroke={color}
                strokeWidth={STROKE}
              />
            </G>
          ))}
        </G>
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
