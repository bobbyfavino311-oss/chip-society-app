import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import colors from '@/constants/colors';

interface FounderBadgeProps {
  style?: StyleProp<ViewStyle>;
  /** Hide the label when the available surface only has room for the crown. */
  iconOnly?: boolean;
}

/** A compact, non-wrapping Founder identity marker for social surfaces. */
export default function FounderBadge({ style, iconOnly = false }: FounderBadgeProps) {
  return (
    <View
      accessible
      accessibilityLabel="Founder"
      style={[styles.badge, iconOnly && styles.iconOnly, style]}
    >
      <Text style={styles.icon}>👑</Text>
      {!iconOnly && <Text style={styles.label}>FOUNDER</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flexShrink: 0,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${colors.gold}80`,
    backgroundColor: `${colors.gold}18`,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  iconOnly: {
    paddingHorizontal: 3,
  },
  icon: {
    fontSize: 9,
    lineHeight: 12,
    flexShrink: 0,
  },
  label: {
    color: colors.gold,
    fontSize: 8,
    lineHeight: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    flexShrink: 0,
  },
});