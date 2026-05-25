import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export interface ClassicSymbol {
  id: number;
  label: string;
  symbol: string;
  color: string;
  bgColor: string;
}

export const CLASSIC_SYMBOLS: ClassicSymbol[] = [
  { id: 0, label: 'HEART',     symbol: '♥', color: '#ff0090', bgColor: '#200010' },
  { id: 1, label: 'SPADE',     symbol: '♠', color: '#00d4ff', bgColor: '#001020' },
  { id: 2, label: 'CLUB',      symbol: '♣', color: '#00ff88', bgColor: '#001810' },
  { id: 3, label: 'DIAMOND',   symbol: '♦', color: '#00aaff', bgColor: '#001020' },
  { id: 4, label: 'STAR',      symbol: '★', color: '#ffd700', bgColor: '#201800' },
  { id: 5, label: 'LIGHTNING', symbol: '⚡', color: '#ffee00', bgColor: '#1a1800' },
  { id: 6, label: 'CROWN',     symbol: '♔', color: '#bf5fff', bgColor: '#150020' },
  { id: 7, label: 'SKULL',     symbol: '☠', color: '#ff4444', bgColor: '#1a0000' },
  { id: 8, label: 'INFINITY',  symbol: '∞', color: '#00ffcc', bgColor: '#001a15' },
  { id: 9, label: 'OCTAGRAM',  symbol: '✦', color: '#ff8800', bgColor: '#1a0a00' },
];

interface SymbolPortraitProps {
  symbolIndex: number;
  size?: number;
  showGlow?: boolean;
}

export default function SymbolPortrait({ symbolIndex, size = 80, showGlow = false }: SymbolPortraitProps) {
  const sym = CLASSIC_SYMBOLS[symbolIndex] ?? CLASSIC_SYMBOLS[0];
  const borderRadius = size / 2;
  const fontSize = Math.round(size * 0.46);

  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius,
          borderColor: showGlow ? sym.color : `${sym.color}66`,
          borderWidth: showGlow ? 2.5 : 1.5,
          shadowColor: sym.color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: showGlow ? 0.9 : 0.5,
          shadowRadius: showGlow ? 14 : 6,
          elevation: showGlow ? 10 : 4,
        },
      ]}
    >
      <LinearGradient
        colors={[sym.bgColor, '#050010']}
        style={[StyleSheet.absoluteFill, { borderRadius }]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <Text
        style={[
          styles.symbol,
          {
            fontSize,
            color: sym.color,
            textShadowColor: sym.color,
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: showGlow ? 12 : 6,
          },
        ]}
      >
        {sym.symbol}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  symbol: {
    fontWeight: '700',
  },
});
