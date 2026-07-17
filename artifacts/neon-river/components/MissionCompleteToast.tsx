import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/colors';
import { type ActiveMission, type MissionRarity, useMissions } from '@/context/MissionsContext';

// ── Spade icon ─────────────────────────────────────────────────────────────────

function SpadeIcon({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 2 C9.5 4.5 5 6 5 10 C5 13 7.5 14.5 10 14 C9 15.5 8 17 7 18 L17 18 C16 17 15 15.5 14 14 C16.5 14.5 19 13 19 10 C19 6 14.5 4.5 12 2 Z"
        fill={color}
      />
    </Svg>
  );
}

const RARITY_COLORS: Record<MissionRarity, string> = {
  common:    '#00d4ff',
  rare:      '#bf5fff',
  epic:      '#ff0090',
  legendary: '#ffd700',
};

const GOLD = '#ffd700';

// ── Sentinel ID used when showing the grand reward banner ──────────────────────
const GRAND_REWARD_ID = '__grand_reward__';

// ── Component ─────────────────────────────────────────────────────────────────

type Phase = 'banner' | 'icon';

export default function MissionCompleteToast() {
  const insets = useSafeAreaInsets();
  const {
    dailyMissions,
    pendingCompletions,
    clearPendingCompletion,
    pendingGrandReward,
    clearPendingGrandReward,
    claimGrandReward,
  } = useMissions();

  const [currentId, setCurrentId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('banner');

  // Banner animation values — useNativeDriver: true only (transforms + opacity)
  const bannerY       = useRef(new Animated.Value(-120)).current;
  const bannerOpacity = useRef(new Animated.Value(0)).current;
  const iconOpacity   = useRef(new Animated.Value(0)).current;
  const iconScale     = useRef(new Animated.Value(1)).current;

  const timers     = useRef<ReturnType<typeof setTimeout>[]>([]);
  const pulseLoop  = useRef<Animated.CompositeAnimation | null>(null);
  const isTapping  = useRef(false);
  // Track whether current notification is the grand reward
  const isGrandRef = useRef(false);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  // Hard-reset all anim values and state (auto-dismiss path)
  const fullReset = useCallback((id: string) => {
    clearTimers();
    pulseLoop.current?.stop();
    pulseLoop.current = null;
    isTapping.current = false;
    bannerY.setValue(-120);
    bannerOpacity.setValue(0);
    iconOpacity.setValue(0);
    iconScale.setValue(1);
    if (isGrandRef.current) {
      void claimGrandReward();
      clearPendingGrandReward();
    } else {
      clearPendingCompletion(id);
    }
    setCurrentId(null);
  }, [clearPendingCompletion, clearPendingGrandReward, claimGrandReward, bannerY, bannerOpacity, iconOpacity, iconScale]);

  // Tap: fast-exit, claim grand reward immediately, then navigate home
  const handleTap = useCallback(() => {
    if (!currentId || isTapping.current) return;
    isTapping.current = true;
    const id = currentId;
    clearTimers();
    pulseLoop.current?.stop();
    if (isGrandRef.current) {
      void claimGrandReward();
    }
    Animated.parallel([
      Animated.timing(bannerOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(iconOpacity,   { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      if (isGrandRef.current) {
        clearPendingGrandReward();
      } else {
        clearPendingCompletion(id);
      }
      setCurrentId(null);
      isTapping.current = false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.push('/(tabs)/' as any);
    });
  }, [currentId, bannerOpacity, iconOpacity, clearPendingCompletion, clearPendingGrandReward, claimGrandReward]);

  // Pick next: regular missions first, grand reward last
  useEffect(() => {
    if (currentId !== null) return;
    if (pendingCompletions.length > 0) {
      isGrandRef.current = false;
      setCurrentId(pendingCompletions[0]);
      setPhase('banner');
    } else if (pendingGrandReward) {
      isGrandRef.current = true;
      setCurrentId(GRAND_REWARD_ID);
      setPhase('banner');
    }
  }, [pendingCompletions, pendingGrandReward, currentId]);

  // Banner phase: slide in → hold 3.2 s → slide out → transition to icon
  useEffect(() => {
    if (phase !== 'banner' || !currentId) return;
    bannerY.setValue(-120);
    bannerOpacity.setValue(0);

    Animated.parallel([
      Animated.spring(bannerY,       { toValue: 0, useNativeDriver: true, tension: 70, friction: 13 }),
      Animated.timing(bannerOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();

    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(bannerY,       { toValue: -120, duration: 320, useNativeDriver: true }),
        Animated.timing(bannerOpacity, { toValue: 0,    duration: 280, useNativeDriver: true }),
      ]).start(() => {
        if (!isTapping.current) setPhase('icon');
      });
    }, 3200);

    timers.current.push(t);
    return () => clearTimeout(t);
  }, [phase, currentId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Icon phase: fade in → pulse → hold 2.6 s → fade out → done
  useEffect(() => {
    if (phase !== 'icon' || !currentId) return;
    const id = currentId;
    iconOpacity.setValue(0);
    iconScale.setValue(1);

    Animated.timing(iconOpacity, { toValue: 1, duration: 280, useNativeDriver: true }).start();

    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(iconScale, { toValue: 1.14, duration: 560, useNativeDriver: true }),
        Animated.timing(iconScale, { toValue: 0.94, duration: 560, useNativeDriver: true }),
      ])
    );
    pulseLoop.current.start();

    const t = setTimeout(() => {
      pulseLoop.current?.stop();
      Animated.timing(iconOpacity, { toValue: 0, duration: 420, useNativeDriver: true }).start(() => {
        fullReset(id);
      });
    }, 2600);

    timers.current.push(t);
    return () => {
      clearTimeout(t);
      pulseLoop.current?.stop();
    };
  }, [phase, currentId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!currentId) return null;

  const isGrand   = currentId === GRAND_REWARD_ID;
  const mission: ActiveMission | undefined = isGrand
    ? undefined
    : dailyMissions.find(m => m.id === currentId);
  const accent    = isGrand ? GOLD : (mission ? RARITY_COLORS[mission.rarity] : '#bf5fff');
  const top       = insets.top + 10;

  return (
    <>
      {/* ── Full glass banner ──────────────────────────────────────────── */}
      <Animated.View
        style={[
          s.bannerWrap,
          { top, opacity: bannerOpacity, transform: [{ translateY: bannerY }] },
          isGrand && s.grandShadow,
        ]}
        pointerEvents={phase === 'banner' ? 'box-none' : 'none'}
      >
        <Pressable onPress={handleTap} style={s.pressable}>
          <View style={[s.bannerCard, { borderColor: `${accent}55` }]}>
            {/* Dark smoked background */}
            <LinearGradient
              colors={isGrand
                ? ['rgba(18,10,2,0.98)', 'rgba(8,4,0,0.99)']
                : ['rgba(8,2,20,0.97)', 'rgba(3,0,10,0.99)']}
              style={StyleSheet.absoluteFill}
            />
            {/* Accent glow wash */}
            <LinearGradient
              colors={[`${accent}${isGrand ? '28' : '1c'}`, 'transparent']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            {/* Top thin glow line */}
            <View style={[s.topGlow, { backgroundColor: `${accent}99` }]} />

            <View style={s.bannerRow}>
              {/* Icon pill */}
              <View style={[s.iconPill, { borderColor: `${accent}55`, backgroundColor: `${accent}18` }]}>
                {isGrand
                  ? <Ionicons name="trophy" size={18} color={GOLD} />
                  : <SpadeIcon color={accent} size={17} />
                }
              </View>

              {/* Text stack */}
              <View style={s.textStack}>
                <Text style={[s.completedLabel, { color: accent }]}>
                  {isGrand ? 'ALL DAILY MISSIONS PASSED!' : 'MISSION PASSED!'}
                </Text>
                <Text style={s.missionName} numberOfLines={1}>
                  {isGrand ? 'Legendary Fortune Cookie Unlocked' : (mission?.title ?? '')}
                </Text>
                <Text style={s.tapHint}>Tap to Collect →</Text>
              </View>

              {/* Badge — rarity for missions, ★ for grand reward */}
              <View style={[s.rarBadge, { borderColor: `${accent}44`, backgroundColor: `${accent}18` }]}>
                {isGrand
                  ? <Text style={[s.rarText, { color: accent }]}>★</Text>
                  : <Text style={[s.rarText, { color: accent }]}>{mission?.rarity.toUpperCase()}</Text>
                }
              </View>
            </View>
          </View>
        </Pressable>
      </Animated.View>

      {/* ── Collapsed pulsing icon ─────────────────────────────────────── */}
      <Animated.View
        style={[
          s.iconWrap,
          { top, opacity: iconOpacity, transform: [{ scale: iconScale }] },
        ]}
        pointerEvents={phase === 'icon' ? 'auto' : 'none'}
      >
        <Pressable onPress={handleTap} hitSlop={12}>
          <View style={[s.iconCircle, { borderColor: `${accent}88`, backgroundColor: `${accent}22` }]}>
            <LinearGradient
              colors={[`${accent}40`, 'transparent']}
              style={StyleSheet.absoluteFill}
            />
            {isGrand
              ? <Ionicons name="trophy" size={20} color={GOLD} />
              : <SpadeIcon color={accent} size={20} />
            }
          </View>
        </Pressable>
      </Animated.View>
    </>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  bannerWrap: {
    position: 'absolute',
    left: 14, right: 14,
    zIndex: 9999,
    shadowColor: '#bf5fff',
    shadowOpacity: 0.28,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 6 },
    elevation: 22,
  },
  grandShadow: {
    shadowColor: '#ffd700',
    shadowOpacity: 0.40,
    shadowRadius: 28,
  },
  pressable: { borderRadius: 18 },
  bannerCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  topGlow: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 1,
    opacity: 0.8,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  iconPill: {
    width: 40, height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textStack: { flex: 1, gap: 1.5 },
  completedLabel: {
    fontSize: 8,
    fontWeight: '900',
    fontFamily: 'Orbitron_700Bold',
    letterSpacing: 1.2,
    opacity: 0.95,
  },
  missionName: {
    color: colors.text,
    fontSize: 12.5,
    fontWeight: '800',
    fontFamily: 'Orbitron_700Bold',
    letterSpacing: 0.2,
  },
  tapHint: {
    color: colors.textMuted,
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
  rarBadge: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderWidth: 1,
    flexShrink: 0,
  },
  rarText: {
    fontSize: 7.5,
    fontWeight: '900',
    fontFamily: 'Orbitron_700Bold',
    letterSpacing: 0.9,
  },
  iconWrap: {
    position: 'absolute',
    right: 16,
    zIndex: 9999,
    shadowColor: '#bf5fff',
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 22,
  },
  iconCircle: {
    width: 48, height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
