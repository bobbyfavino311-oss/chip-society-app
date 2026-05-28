import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import ChipIcon, { ChipVariant } from './ChipIcon';
import { formatChips } from '@/utils/chipColor';

interface ChipAmountProps {
  amount: number;
  variant?: ChipVariant;
  prefix?: '+' | '-' | '';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: ViewStyle;
  showIcon?: boolean;
}

const SIZE_MAP = {
  sm: { font: 13, icon: 16, gap: 3 },
  md: { font: 18, icon: 20, gap: 4 },
  lg: { font: 24, icon: 26, gap: 5 },
  xl: { font: 32, icon: 34, gap: 6 },
};

const VARIANT_COLORS: Record<ChipVariant, string> = {
  green: '#22c55e',
  red:   '#ef4444',
  white: '#e2e8f0',
  gold:  '#ffd700',
  cyan:  '#00d4ff',
};

export default function ChipAmount({
  amount,
  variant = 'white',
  prefix = '',
  size = 'md',
  style,
  showIcon = true,
}: ChipAmountProps) {
  const d = SIZE_MAP[size];
  const color = VARIANT_COLORS[variant];
  const numStr = prefix + formatChips(amount);

  return (
    <View style={[styles.row, { gap: d.gap }, style]}>
      {showIcon && <ChipIcon variant={variant} size={d.icon} />}
      <Text
        style={[
          styles.amount,
          {
            fontSize: d.font,
            color,
            textShadowColor: 'rgba(0,0,0,0.8)',
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: 3,
          },
        ]}
      >
        {numStr}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amount: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '900',
    letterSpacing: 0,
  },
});
