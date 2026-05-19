import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Achievement, RARITY_COLORS, RARITY_LABELS } from '@/lib/achievements';
import { SoundEngine } from '@/lib/soundEngine';

interface Props {
  achievement: Achievement;
  onDismiss: () => void;
}

export default function AchievementUnlockPopup({ achievement, onDismiss }: Props) {
  const insets = useSafeAreaInsets();
  const slideY = useRef(new Animated.Value(-140)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale  = useRef(new Animated.Value(0.85)).current;
  const glow   = useRef(new Animated.Value(0)).current;
  const color  = RARITY_COLORS[achievement.rarity];

  useEffect(() => {
    SoundEngine.notification();

    // Slide in
    Animated.parallel([
      Animated.spring(slideY, { toValue: 0, tension: 65, friction: 10, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 65, friction: 10, useNativeDriver: true }),
    ]).start();

    // Glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 900, useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0, duration: 900, useNativeDriver: false }),
      ])
    ).start();

    // Auto-dismiss after 3.5s
    const timer = setTimeout(() => dismiss(), 3500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(slideY, { toValue: -160, duration: 280, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onDismiss());
  };

  const glowRadius = glow.interpolate({ inputRange: [0, 1], outputRange: [8, 22] });
  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] });

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { top: insets.top + 12, transform: [{ translateY: slideY }, { scale }], opacity },
      ]}
    >
      <TouchableOpacity activeOpacity={0.9} onPress={dismiss}>
        {/* Glow halo */}
        <Animated.View style={[
          styles.glowHalo,
          { borderColor: color, shadowColor: color, shadowRadius: glowRadius, opacity: glowOpacity },
        ]} />

        <View style={[styles.card, { borderColor: color }]}>
          {/* Top label */}
          <View style={[styles.rarityBadge, { backgroundColor: `${color}22`, borderColor: `${color}55` }]}>
            <Text style={[styles.rarityText, { color }]}>
              {RARITY_LABELS[achievement.rarity]} ACHIEVEMENT UNLOCKED
            </Text>
          </View>

          {/* Icon + details */}
          <View style={styles.body}>
            <View style={[styles.iconBg, { backgroundColor: `${color}18`, borderColor: `${color}44` }]}>
              <Text style={styles.iconText}>{achievement.icon}</Text>
            </View>
            <View style={styles.details}>
              <Text style={[styles.achName, { color }]}>{achievement.name}</Text>
              <Text style={styles.achDesc} numberOfLines={2}>{achievement.description}</Text>
              <View style={styles.rewardRow}>
                <Text style={styles.rewardChip}>+{achievement.chipReward.toLocaleString()} chips</Text>
                <Text style={styles.rewardXP}>+{achievement.xpReward.toLocaleString()} XP</Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  glowHalo: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
  },
  card: {
    backgroundColor: '#09001e',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    gap: 10,
  },
  rarityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  rarityText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 8,
    letterSpacing: 2,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexShrink: 0,
  },
  iconText: {
    fontSize: 26,
  },
  details: {
    flex: 1,
    gap: 3,
  },
  achName: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 13,
    letterSpacing: 1,
  },
  achDesc: {
    fontFamily: 'Orbitron_400Regular',
    fontSize: 9,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.5,
    lineHeight: 14,
  },
  rewardRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  rewardChip: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 9,
    color: '#ffd700',
    letterSpacing: 0.5,
  },
  rewardXP: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 9,
    color: '#00d4ff',
    letterSpacing: 0.5,
  },
});
