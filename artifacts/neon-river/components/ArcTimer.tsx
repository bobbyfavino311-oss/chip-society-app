import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ArcTimerProps {
  seconds: number;
  maxSeconds?: number;
  size: number;
  strokeWidth?: number;
}

export default function ArcTimer({
  seconds,
  maxSeconds = 20,
  size,
  strokeWidth = 3.5,
}: ArcTimerProps) {
  const R = (size - strokeWidth) / 2;
  const C = 2 * Math.PI * R;

  const progress = useRef(
    new Animated.Value(Math.max(0, Math.min(1, seconds / maxSeconds)))
  ).current;

  useEffect(() => {
    const ratio = Math.max(0, Math.min(1, seconds / maxSeconds));
    Animated.timing(progress, {
      toValue: ratio,
      duration: 850,
      useNativeDriver: false,
    }).start();
  }, [seconds, maxSeconds]);

  const cx = size / 2;
  const cy = size / 2;
  const color =
    seconds > 10 ? '#00d4ff' : seconds > 5 ? '#ff0090' : '#ff3030';

  const dashOffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [C, 0],
  });

  return (
    <Svg
      width={size}
      height={size}
      style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}
    >
      <Circle
        cx={cx}
        cy={cy}
        r={R}
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={strokeWidth}
        fill="none"
      />
      <AnimatedCircle
        cx={cx}
        cy={cy}
        r={R}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={C}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
      />
    </Svg>
  );
}
