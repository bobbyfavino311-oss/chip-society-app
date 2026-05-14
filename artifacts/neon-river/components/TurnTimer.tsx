import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import colors from '../constants/colors';

interface TurnTimerProps {
  seconds: number;
  maxSeconds?: number;
  size?: number;
  isActive?: boolean;
}

export default function TurnTimer({ seconds, maxSeconds = 30, size = 48, isActive = false }: TurnTimerProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, seconds / maxSeconds));
  const strokeDashoffset = circumference * (1 - progress);

  const isUrgent = seconds <= 5;
  const isWarning = seconds <= 10;

  const strokeColor = isUrgent
    ? colors.secondary
    : isWarning
    ? colors.warning
    : colors.primary;

  useEffect(() => {
    if (!isUrgent || !isActive) {
      pulseAnim.setValue(1);
      return;
    }
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 300, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [isUrgent, isActive, pulseAnim]);

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <View style={[styles.webCircle, { borderColor: strokeColor, width: size - 4, height: size - 4, borderRadius: size / 2 }]}>
          <Text style={[styles.timerText, { color: strokeColor, fontSize: size * 0.3 }]}>{seconds}</Text>
        </View>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { width: size, height: size, transform: [{ scale: pulseAnim }] }]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={4}
          fill="transparent"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={4}
          fill="transparent"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90, ${size / 2}, ${size / 2})`}
        />
      </Svg>
      <Text style={[styles.timerText, { color: strokeColor, fontSize: size * 0.3 }]}>
        {seconds}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontWeight: '700',
    textAlign: 'center',
  },
  webCircle: {
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
