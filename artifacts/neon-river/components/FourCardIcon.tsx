import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import Svg, { G, Path, Rect } from 'react-native-svg';

interface FourCardIconProps {
  size?: number;
  color?: string;
  glow?: boolean;
  style?: ViewStyle;
}

const CARD_W = 8;
const CARD_H = 12;
const CORNER = 1.6;
const STROKE = 1.4;

// Symmetric fan: two cards angled left, two angled right, drawn left→right
// so the rightmost card ends up on top ("front card").
const CARDS = [
  { x: -6, y: -3.6, rotate: -20 },
  { x: -2, y: -5.4, rotate: -7 },
  { x: 2, y: -5.4, rotate: 7 },
  { x: 6, y: -3.6, rotate: 20 },
];

export default function FourCardIcon({ size = 32, color = '#7c3aed', glow = true, style }: FourCardIconProps) {
  return (
    <View
      style={[
        glow && { shadowColor: color, shadowOpacity: 0.5, shadowRadius: 7, shadowOffset: { width: 0, height: 0 } },
        styles.wrap,
        style,
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <G>
          {CARDS.map((c, i) => {
            const isFront = i === CARDS.length - 1;
            return (
              <G key={i} transform={`translate(${12 + c.x}, ${12 + c.y}) rotate(${c.rotate})`}>
                <Rect
                  x={-CARD_W / 2}
                  y={-CARD_H / 2}
                  width={CARD_W}
                  height={CARD_H}
                  rx={CORNER}
                  fill={isFront ? `${color}14` : 'transparent'}
                  stroke={color}
                  strokeWidth={STROKE}
                />
                {isFront && (
                  <Path
                    d="M0,-2.7 C1.7,-1.3 2.8,-0.1 1.7,1.1 C1,1.8 0.2,1.6 0,0.9 C-0.2,1.6 -1,1.8 -1.7,1.1 C-2.8,-0.1 -1.7,-1.3 0,-2.7 Z M0,0.9 L0,2.6 M-0.8,2.6 L0.8,2.6"
                    stroke={color}
                    strokeWidth={0.7}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={0.85}
                  />
                )}
              </G>
            );
          })}
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
