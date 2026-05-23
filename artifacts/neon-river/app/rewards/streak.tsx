import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState, useRef } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/colors';
import { useUser } from '@/context/UserContext';
import { formatChips } from '@/utils/chipColor';
import { SoundEngine } from '@/lib/soundEngine';

const STREAK_REWARDS = [
  { day: 1, chips:  5_000, label:  '5K', color: '#00d4aa' },
  { day: 2, chips: 10_000, label: '10K', color: '#00ccee' },
  { day: 3, chips: 15_000, label: '15K', color: '#00aaff' },
  { day: 4, chips: 20_000, label: '20K', color: '#5577ff' },
  { day: 5, chips: 25_000, label: '25K', color: '#bf5fff' },
  { day: 6, chips: 30_000, label: '30K', color: '#ff0090' },
  { day: 7, chips: 35_000, label: '35K', color: '#ffd700', special: true },
];

export default function StreakScreen() {
  const insets = useSafeAreaInsets();
  const { profile, canClaimDaily, claimDailyReward, dailyRewardAmount } = useUser();
  const [claiming, setClaiming] = useState(false);
  const [justClaimed, setJustClaimed] = useState(false);
  const [claimedAmount, setClaimedAmount] = useState(0);
  const claimScale = useRef(new Animated.Value(1)).current;
  const resultAnim = useRef(new Animated.Value(0)).current;

  const yesterday = new Date(Date.now() - 86_400_000).toDateString();
  const isOnStreak = profile.lastDailyReward === yesterday;
  const currentStreak = isOnStreak ? profile.streakDays : (canClaimDaily ? profile.streakDays : 0);
  const nextDay = Math.min((isOnStreak ? profile.streakDays + 1 : 1), 7);
  const todayClaimed = !canClaimDaily;

  const claim = async () => {
    if (!canClaimDaily || claiming) return;
    setClaiming(true);
    Animated.sequence([
      Animated.timing(claimScale, { toValue: 0.95, duration: 100, useNativeDriver: false }),
      Animated.timing(claimScale, { toValue: 1, duration: 100, useNativeDriver: false }),
    ]).start();
    const amount = await claimDailyReward();
    SoundEngine.claim();
    setClaimedAmount(amount);
    setJustClaimed(true);
    setClaiming(false);
    resultAnim.setValue(0);
    Animated.spring(resultAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: false }).start();
  };

  return (
    <View style={st.container}>
      <LinearGradient colors={['#051015', '#050010', '#0a0515']} style={StyleSheet.absoluteFill} />
      <View style={st.glowGold} />

      {/* Header */}
      <View style={[st.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 20 : 16) }]}>
        <TouchableOpacity onPress={() => router.back()} style={st.closeBtn} activeOpacity={0.7}>
          <Ionicons name="close" size={22} color={colors.textMuted} />
        </TouchableOpacity>
        <Text style={st.title}>DAILY STREAK</Text>
        <View style={[st.streakBadge, { borderColor: currentStreak > 0 ? 'rgba(255,215,0,0.4)' : colors.border }]}>
          <Text style={st.streakEmoji}>{currentStreak > 0 ? '🔥' : '⬜'}</Text>
          <Text style={[st.streakNum, { color: currentStreak > 0 ? '#ffd700' : colors.textDim }]}>{currentStreak}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[st.scroll, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>

        {/* Banner */}
        <View style={st.bannerRow}>
          <Text style={st.bannerTitle}>DAILY BONUS</Text>
          <Text style={st.bannerSub}>Play every day to keep your streak alive and earn bigger rewards</Text>
        </View>

        {/* 7-day grid */}
        <View style={st.grid}>
          {STREAK_REWARDS.map((sr) => {
            const isClaimed = sr.day <= (currentStreak > 0 ? profile.streakDays : 0) && todayClaimed
              ? sr.day <= profile.streakDays
              : sr.day < profile.streakDays;
            const isToday = sr.day === nextDay && canClaimDaily;
            const isFuture = sr.day > nextDay || (sr.day === nextDay && !canClaimDaily);
            const isClaimedToday = sr.day === profile.streakDays && todayClaimed;

            return (
              <View
                key={sr.day}
                style={[
                  st.dayCard,
                  isToday && { borderColor: `${sr.color}88` },
                  (isClaimed || isClaimedToday) && { borderColor: 'rgba(0,212,100,0.35)', opacity: 0.75 },
                  isFuture && { opacity: 0.4 },
                ]}
              >
                {isToday && <LinearGradient colors={[`${sr.color}20`, `${sr.color}06`]} style={StyleSheet.absoluteFill} />}
                {(isClaimed || isClaimedToday) && <LinearGradient colors={['rgba(0,212,100,0.08)', 'transparent']} style={StyleSheet.absoluteFill} />}

                <Text style={st.dayLabel}>DAY {sr.day}</Text>
                {sr.special && <Text style={st.specialBadge}>★</Text>}

                <Text style={[st.dayChips, { color: isToday ? sr.color : (isClaimed || isClaimedToday) ? colors.success : colors.textDim }]}>
                  {sr.label}
                </Text>

                <View style={[st.dayStatus, {
                  backgroundColor: isToday ? `${sr.color}22` :
                    (isClaimed || isClaimedToday) ? 'rgba(0,212,100,0.15)' :
                    'rgba(255,255,255,0.05)',
                }]}>
                  {(isClaimed || isClaimedToday)
                    ? <Ionicons name="checkmark" size={14} color={colors.success} />
                    : isToday
                    ? <Ionicons name="flash" size={12} color={sr.color} />
                    : <Text style={[st.dayStatusText, { color: colors.textDim }]}>—</Text>
                  }
                </View>
              </View>
            );
          })}
        </View>

        {/* Claim result */}
        {justClaimed && (
          <Animated.View style={[st.claimResult, { transform: [{ scale: resultAnim }] }]}>
            <LinearGradient colors={['rgba(255,215,0,0.15)', 'transparent']} style={StyleSheet.absoluteFill} />
            <Text style={st.claimResultEmoji}>🎁</Text>
            <Text style={st.claimResultTitle}>CLAIMED!</Text>
            <Text style={st.claimResultAmount}>+{formatChips(claimedAmount)} chips</Text>
          </Animated.View>
        )}

        {/* Claim button */}
        <Animated.View style={{ transform: [{ scale: claimScale }] }}>
          <TouchableOpacity
            style={[st.claimBtn, {
              opacity: canClaimDaily && !claiming ? 1 : 0.45,
              borderColor: canClaimDaily ? 'rgba(255,215,0,0.5)' : colors.border,
            }]}
            onPress={claim}
            disabled={!canClaimDaily || claiming}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={canClaimDaily ? ['#ffd700', '#ff8800'] : ['#333', '#222']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            />
            <Ionicons
              name={canClaimDaily ? 'gift' : 'time-outline'}
              size={22}
              color={canClaimDaily ? '#050010' : colors.textMuted}
              style={{ marginRight: 10 }}
            />
            <View>
              <Text style={[st.claimBtnTitle, { color: canClaimDaily ? '#050010' : colors.textMuted }]}>
                {canClaimDaily ? 'CLAIM TODAY\'S REWARD' : 'COME BACK TOMORROW'}
              </Text>
              {canClaimDaily && (
                <Text style={st.claimBtnSub}>+{formatChips(dailyRewardAmount)} chips · Day {nextDay} bonus</Text>
              )}
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Streak stats */}
        <View style={st.statsRow}>
          {[
            { label: 'CURRENT STREAK', value: `${profile.streakDays} days`, icon: '🔥' },
            { label: 'CHIPS TODAY', value: formatChips(dailyRewardAmount), icon: '💎' },
            { label: 'NEXT RESET', value: canClaimDaily ? 'Now!' : 'Tomorrow', icon: '⏱' },
          ].map(s => (
            <View key={s.label} style={st.statCard}>
              <LinearGradient colors={['rgba(255,215,0,0.06)', 'transparent']} style={StyleSheet.absoluteFill} />
              <Text style={st.statIcon}>{s.icon}</Text>
              <Text style={st.statValue}>{s.value}</Text>
              <Text style={st.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* VIP boost info */}
        {!profile.vipMember && (
          <View style={st.vipHint}>
            <LinearGradient colors={['rgba(255,0,144,0.08)', 'transparent']} style={StyleSheet.absoluteFill} />
            <Ionicons name="diamond" size={16} color="#ff0090" />
            <Text style={st.vipHintText}>VIP members earn +50% bonus chips on every daily reward</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050010' },
  glowGold: { position: 'absolute', top: -60, right: -60, width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(255,215,0,0.05)' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: colors.border },
  title: { color: colors.text, fontSize: 18, fontWeight: '900', fontFamily: 'Orbitron_900Black', letterSpacing: 2 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 12, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  streakEmoji: { fontSize: 16 },
  streakNum: { fontSize: 14, fontWeight: '900' },
  scroll: { paddingHorizontal: 16, gap: 16 },
  bannerRow: { gap: 4 },
  bannerTitle: { color: '#ffd700', fontSize: 16, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 1 },
  bannerSub: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  dayCard: {
    width: '30%', borderRadius: 12, borderWidth: 1, borderColor: colors.border,
    padding: 10, alignItems: 'center', gap: 5, overflow: 'hidden', position: 'relative',
  },
  dayLabel: { color: colors.textDim, fontSize: 8, fontWeight: '700', letterSpacing: 1 },
  specialBadge: { position: 'absolute', top: 4, right: 6, color: '#ffd700', fontSize: 10 },
  dayChips: { fontSize: 16, fontWeight: '900', fontFamily: 'Orbitron_700Bold' },
  dayStatus: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  dayStatusText: { fontSize: 14 },
  claimResult: { borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,215,0,0.4)', padding: 20, alignItems: 'center', gap: 6, overflow: 'hidden' },
  claimResultEmoji: { fontSize: 40 },
  claimResultTitle: { color: '#ffd700', fontSize: 20, fontWeight: '900', fontFamily: 'Orbitron_900Black', letterSpacing: 2 },
  claimResultAmount: { color: colors.success, fontSize: 22, fontWeight: '900', fontFamily: 'Orbitron_700Bold' },
  claimBtn: { height: 60, borderRadius: 16, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, borderWidth: 1 },
  claimBtnTitle: { fontSize: 14, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 1 },
  claimBtnSub: { color: 'rgba(5,0,16,0.6)', fontSize: 10, marginTop: 1 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 12, alignItems: 'center', gap: 3, overflow: 'hidden' },
  statIcon: { fontSize: 20 },
  statValue: { color: colors.text, fontSize: 13, fontWeight: '800' },
  statLabel: { color: colors.textDim, fontSize: 8, letterSpacing: 1, textAlign: 'center' },
  vipHint: { flexDirection: 'row', gap: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,0,144,0.25)', padding: 14, alignItems: 'flex-start', overflow: 'hidden' },
  vipHintText: { color: colors.textMuted, fontSize: 11, lineHeight: 17, flex: 1 },
});
