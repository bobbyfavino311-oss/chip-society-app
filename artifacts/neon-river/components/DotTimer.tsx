import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import colors from '../constants/colors';

const DOT_COUNT = 8;

interface DotTimerProps {
  seconds: number;
  maxSeconds?: number;
  isActive?: boolean;
  size?: number;
  gap?: number;
}

function getColor(activeDots: number): string {
  if (activeDots >= 6) return colors.primary;
  if (activeDots >= 3) return colors.warning;
  return colors.secondary;
}

function Dot({ active, color, pulse }: { active: boolean; color: string; pulse: boolean }) {
  const anim = useRef(new Animated.Value(active ? 1 : 0.15)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: active ? 1 : 0.15,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [active]);

  useEffect(() => {
    if (!pulse || !active) {
      scaleAnim.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.4, duration: 280, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1,   duration: 280, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, active]);

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          backgroundColor: active ? color : colors.border,
          opacity: anim,
          transform: [{ scale: scaleAnim }],
          shadowColor: active ? color : 'transparent',
          shadowOpacity: active ? 0.9 : 0,
          shadowRadius: active ? 4 : 0,
          shadowOffset: { width: 0, height: 0 },
        },
      ]}
    />
  );
}

export default function DotTimer({
  seconds,
  maxSeconds = 30,
  isActive = false,
  size = 7,
  gap = 4,
}: DotTimerProps) {
  const activeDots = Math.max(0, Math.ceil((seconds / maxSeconds) * DOT_COUNT));
  const dotColor = getColor(activeDots);
  const isUrgent = activeDots <= 2;

  return (
    <View style={[styles.row, { gap }]}>
      {Array.from({ length: DOT_COUNT }).map((_, i) => (
        <View key={i} style={[styles.dotWrap, { width: size, height: size, borderRadius: size / 2 }]}>
          <Dot active={i < activeDots} color={dotColor} pulse={isUrgent && isActive && i < activeDots} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dotWrap: {
    overflow: 'visible',
  },
  dot: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
});
