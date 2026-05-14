import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '@/constants/colors';
import { useUser } from '@/context/UserContext';

const DAILY_REWARDS = [
  { day: 1, chips: 500, label: 'Day 1' },
  { day: 2, chips: 700, label: 'Day 2' },
  { day: 3, chips: 1000, label: 'Day 3' },
  { day: 4, chips: 1200, label: 'Day 4' },
  { day: 5, chips: 1500, label: 'Day 5' },
  { day: 6, chips: 2000, label: 'Day 6' },
  { day: 7, chips: 3000, label: 'Day 7 🎉', isBonus: true },
];

const MISSIONS = [
  { id: '1', title: 'Play 3 hands', reward: 200, icon: 'card-playing-outline' as const, progress: 0, total: 3 },
  { id: '2', title: 'Win a hand', reward: 500, icon: 'trophy-outline' as const, progress: 0, total: 1 },
  { id: '3', title: 'Go all-in', reward: 300, icon: 'flash-outline' as const, progress: 0, total: 1 },
  { id: '4', title: 'Fold 5 times', reward: 150, icon: 'hand-left-outline' as const, progress: 0, total: 5 },
];

export default function RewardsScreen() {
  const insets = useSafeAreaInsets();
  const { profile, claimDailyReward } = useUser();
  const [claimed, setClaimed] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(0);
  const [spinAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));

  const today = new Date().toDateString();
  const alreadyClaimed = profile.lastDailyReward === today;
  const streakDay = Math.min((profile.streakDays % 7) + 1, 7);

  const handleClaim = async () => {
    if (alreadyClaimed || claimed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    Animated.sequence([
      Animated.spring(pulseAnim, { toValue: 1.2, useNativeDriver: true }),
      Animated.spring(pulseAnim, { toValue: 1, useNativeDriver: true }),
    ]).start();

    const amount = await claimDailyReward();
    if (amount > 0) {
      setRewardAmount(amount);
      setClaimed(true);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background, '#0a0025', colors.background]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 16), paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.header}>DAILY REWARDS</Text>

        <View style={styles.streakCard}>
          <LinearGradient
            colors={['rgba(255,170,0,0.12)', 'transparent']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.streakHeader}>
            <Ionicons name="flame" size={28} color={colors.warning} />
            <Text style={styles.streakTitle}>{profile.streakDays} Day Streak</Text>
          </View>
          <Text style={styles.streakSub}>Login daily to earn bonus chips!</Text>

          <View style={styles.daysRow}>
            {DAILY_REWARDS.map((r) => {
              const isPast = r.day < streakDay;
              const isCurrent = r.day === streakDay;
              const isFuture = r.day > streakDay;
              return (
                <View
                  key={r.day}
                  style={[
                    styles.dayItem,
                    isPast && styles.dayPast,
                    isCurrent && styles.dayCurrent,
                    r.isBonus && styles.dayBonus,
                  ]}
                >
                  {isPast ? (
                    <Ionicons name="checkmark" size={14} color={colors.success} />
                  ) : (
                    <MaterialCommunityIcons
                      name="poker-chip"
                      size={14}
                      color={isCurrent ? colors.gold : colors.textDim}
                    />
                  )}
                  <Text style={[styles.dayChips, isCurrent && { color: colors.gold }, isPast && { color: colors.success }]}>
                    {r.chips >= 1000 ? `${r.chips / 1000}K` : r.chips}
                  </Text>
                  <Text style={[styles.dayLabel, isCurrent && styles.dayLabelCurrent]}>D{r.day}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={[styles.claimBtn, (alreadyClaimed || claimed) && styles.claimBtnDisabled]}
            onPress={handleClaim}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={
                alreadyClaimed || claimed
                  ? [colors.surface, colors.surface]
                  : [colors.gold, '#c8960a']
              }
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
            <MaterialCommunityIcons
              name="poker-chip"
              size={22}
              color={alreadyClaimed || claimed ? colors.textDim : colors.background}
            />
            <Text style={[styles.claimBtnText, (alreadyClaimed || claimed) && styles.claimBtnTextDisabled]}>
              {claimed
                ? `CLAIMED +${rewardAmount} CHIPS!`
                : alreadyClaimed
                ? 'ALREADY CLAIMED TODAY'
                : 'CLAIM DAILY REWARD'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.sectionTitle}>DAILY MISSIONS</Text>

        {MISSIONS.map(mission => (
          <View key={mission.id} style={styles.missionCard}>
            <LinearGradient
              colors={[colors.surface, colors.surfaceElevated]}
              style={StyleSheet.absoluteFill}
            />
            <View style={[styles.missionIcon, { backgroundColor: colors.accentDim }]}>
              <Ionicons name={mission.icon as any} size={22} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.missionTitle}>{mission.title}</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${(mission.progress / mission.total) * 100}%` }]} />
              </View>
              <Text style={styles.progressText}>{mission.progress}/{mission.total}</Text>
            </View>
            <View style={styles.missionReward}>
              <MaterialCommunityIcons name="poker-chip" size={14} color={colors.gold} />
              <Text style={styles.missionRewardText}>+{mission.reward}</Text>
            </View>
          </View>
        ))}

        <Text style={styles.sectionTitle}>VIP MEMBERSHIP</Text>
        <View style={styles.vipCard}>
          <LinearGradient
            colors={['rgba(191,95,255,0.15)', 'rgba(255,0,144,0.08)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.vipHeader}>
            <Ionicons name="diamond" size={28} color={colors.accent} />
            <Text style={styles.vipTitle}>NEON VIP</Text>
          </View>
          <Text style={styles.vipDesc}>
            Daily chip bonuses • Exclusive table skins • Premium card backs • VIP tournaments
          </Text>
          <TouchableOpacity style={styles.vipBtn}>
            <Text style={styles.vipBtnText}>COMING SOON</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: 16, gap: 14 },
  header: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 18,
    color: colors.primary,
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 4,
  },
  streakCard: {
    borderRadius: colors.radiusLg,
    borderWidth: 1,
    borderColor: 'rgba(255,170,0,0.3)',
    padding: 16,
    overflow: 'hidden',
  },
  streakHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  streakTitle: { color: colors.warning, fontSize: 18, fontWeight: '700', fontFamily: 'Orbitron_700Bold' },
  streakSub: { color: colors.textMuted, fontSize: 12, marginBottom: 14 },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  dayItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 2,
  },
  dayPast: { borderColor: colors.successDim, backgroundColor: 'rgba(0,255,136,0.05)' },
  dayCurrent: { borderColor: colors.gold, backgroundColor: 'rgba(255,215,0,0.08)' },
  dayBonus: { borderColor: colors.accent },
  dayChips: { color: colors.textMuted, fontSize: 9, fontWeight: '700' },
  dayLabel: { color: colors.textDim, fontSize: 8 },
  dayLabelCurrent: { color: colors.gold },
  claimBtn: {
    borderRadius: colors.radius,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  claimBtnDisabled: { opacity: 0.6 },
  claimBtnText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'Orbitron_700Bold',
    letterSpacing: 1,
  },
  claimBtnTextDisabled: { color: colors.textMuted },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: 'Orbitron_400Regular',
    marginTop: 4,
  },
  missionCard: {
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    overflow: 'hidden',
  },
  missionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missionTitle: { color: colors.text, fontSize: 13, fontWeight: '600', marginBottom: 6 },
  progressBar: { height: 4, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden', marginBottom: 3 },
  progressFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 2 },
  progressText: { color: colors.textDim, fontSize: 10 },
  missionReward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  missionRewardText: { color: colors.gold, fontSize: 12, fontWeight: '700' },
  vipCard: {
    borderRadius: colors.radiusLg,
    borderWidth: 1,
    borderColor: 'rgba(191,95,255,0.4)',
    padding: 20,
    overflow: 'hidden',
    gap: 10,
  },
  vipHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  vipTitle: { color: colors.accent, fontSize: 20, fontWeight: '800', fontFamily: 'Orbitron_700Bold', letterSpacing: 2 },
  vipDesc: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  vipBtn: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.accent,
    paddingVertical: 10,
    alignItems: 'center',
  },
  vipBtnText: { color: colors.accent, fontSize: 12, fontWeight: '700', letterSpacing: 1 },
});
