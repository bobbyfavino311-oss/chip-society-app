import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Achievement, RARITY_COLORS, RARITY_LABELS } from '@/lib/achievements';
import { useAchievements } from '@/context/AchievementContext';
import { SoundEngine } from '@/lib/soundEngine';

interface Props {
  achievement: Achievement;
  onDismiss: () => void;
}

export default function AchievementUnlockPopup({ achievement, onDismiss }: Props) {
  const insets = useSafeAreaInsets();
  const { claim } = useAchievements();
  const [claimed, setClaimed] = useState(false);

  const slideY  = useRef(new Animated.Value(-160)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale   = useRef(new Animated.Value(0.88)).current;
  const glow    = useRef(new Animated.Value(0)).current;
  const color   = RARITY_COLORS[achievement.rarity];

  const dismissAnim = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runDismiss = () => {
    if (dismissAnim.current) clearTimeout(dismissAnim.current);
    Animated.parallel([
      Animated.timing(slideY,  { toValue: -200, duration: 280, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0,    duration: 220, useNativeDriver: true }),
    ]).start(() => onDismiss());
  };

  useEffect(() => {
    SoundEngine.notification();

    Animated.parallel([
      Animated.spring(slideY, { toValue: 0, tension: 70, friction: 11, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(scale,  { toValue: 1, tension: 70, friction: 11, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1000, useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0, duration: 1000, useNativeDriver: false }),
      ])
    ).start();

    // Auto-dismiss after 7s (give player time to claim)
    dismissAnim.current = setTimeout(runDismiss, 7000);
    return () => { if (dismissAnim.current) clearTimeout(dismissAnim.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClaim = async () => {
    if (claimed) return;
    setClaimed(true);
    SoundEngine.chipCollect();
    await claim(achievement.id);
    // Dismiss after short "CLAIMED!" display
    if (dismissAnim.current) clearTimeout(dismissAnim.current);
    setTimeout(runDismiss, 900);
  };

  const glowR = glow.interpolate({ inputRange: [0, 1], outputRange: [6, 20] });
  const glowO = glow.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.85] });

  return (
    <Animated.View style={[
      styles.wrapper,
      { top: insets.top + 10, transform: [{ translateY: slideY }, { scale }], opacity },
    ]}>
      {/* Glow halo */}
      <Animated.View style={[
        styles.glowHalo,
        { borderColor: color, shadowColor: color, shadowRadius: glowR, opacity: glowO },
      ]} />

      <View style={[styles.card, { borderColor: color }]}>
        {/* Rarity label */}
        <View style={[styles.rarityBadge, { backgroundColor: `${color}1a`, borderColor: `${color}44` }]}>
          <Text style={[styles.rarityText, { color }]}>
            {RARITY_LABELS[achievement.rarity]} ACHIEVEMENT UNLOCKED
          </Text>
        </View>

        {/* Body */}
        <View style={styles.body}>
          <View style={[styles.iconBg, { backgroundColor: `${color}15`, borderColor: `${color}40` }]}>
            <Text style={styles.iconText}>{achievement.icon}</Text>
          </View>
          <View style={styles.details}>
            <Text style={[styles.achName, { color }]} numberOfLines={1}>{achievement.name}</Text>
            <Text style={styles.achDesc} numberOfLines={2}>{achievement.description}</Text>
            <View style={styles.rewardRow}>
              <Ionicons name="cash-outline" size={10} color="#ffd700" />
              <Text style={styles.rewardChip}>{achievement.chipReward.toLocaleString()} chips</Text>
              <Text style={styles.rewardXP}>+{achievement.xpReward} XP</Text>
            </View>
          </View>
        </View>

        {/* Claim / Claimed button */}
        {!claimed ? (
          <TouchableOpacity style={[styles.claimBtn, { borderColor: `${color}66`, backgroundColor: `${color}18` }]}
            onPress={handleClaim} activeOpacity={0.8}>
            <Text style={[styles.claimText, { color }]}>CLAIM REWARD</Text>
            <Ionicons name="gift-outline" size={14} color={color} />
          </TouchableOpacity>
        ) : (
          <View style={styles.claimedRow}>
            <Ionicons name="checkmark-circle" size={16} color="#00ff88" />
            <Text style={styles.claimedText}>CLAIMED!</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 12,
    right: 12,
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
    backgroundColor: '#080018',
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
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
    fontSize: 7.5,
    letterSpacing: 2,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexShrink: 0,
  },
  iconText: { fontSize: 24 },
  details: { flex: 1, gap: 3 },
  achName: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  achDesc: {
    fontFamily: 'Orbitron_400Regular',
    fontSize: 9,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 13,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  rewardChip: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 9,
    color: '#ffd700',
    flex: 1,
  },
  rewardXP: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 9,
    color: '#00d4ff',
  },
  claimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 10,
  },
  claimText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 11,
    letterSpacing: 2,
  },
  claimedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  claimedText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 12,
    color: '#00ff88',
    letterSpacing: 2,
  },
});
