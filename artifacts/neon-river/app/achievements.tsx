import { LinearGradient } from 'expo-linear-gradient';
import { formatChips } from '@/lib/multiplayerTypes';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  ALL_ACHIEVEMENTS,
  Achievement,
  AchievementCategory,
  RARITY_COLORS,
  RARITY_LABELS,
} from '@/lib/achievements';
import { useAchievements, achievementCompletion } from '@/context/AchievementContext';
import { useUser } from '@/context/UserContext';

const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  hands:     'POKER HANDS',
  milestone: 'MILESTONES',
  streak:    'STREAKS',
  bankroll:  'BANKROLL',
};
const CATEGORIES: AchievementCategory[] = ['hands', 'milestone', 'streak', 'bankroll'];

interface AchCardProps {
  ach: Achievement;
  unlocked: boolean;
  claimed: boolean;
  progress: number;          // 0-1 for count-based, -1 for non-count
  progressLabel?: string;    // e.g. "3 / 10" for hand achievements
  onClaim: () => void;
  claiming: boolean;
}

function AchCard({ ach, unlocked, claimed, progress, progressLabel, onClaim, claiming }: AchCardProps) {
  const color     = RARITY_COLORS[ach.rarity];
  const showClaim = unlocked && !claimed;
  const hasProgress = progress >= 0 && !unlocked;
  const pct = Math.min(progress, 1);

  return (
    <View style={[
      styles.card,
      unlocked && !claimed && { borderColor: `${color}66` },
      claimed               && { borderColor: `${color}33` },
      !unlocked             && styles.cardLocked,
    ]}>
      {unlocked && (
        <LinearGradient
          colors={[`${color}${claimed ? '08' : '12'}`, 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        />
      )}

      {/* Icon */}
      <View style={[
        styles.iconWrap,
        unlocked
          ? { backgroundColor: `${color}1a`, borderColor: `${color}55` }
          : styles.iconWrapLocked,
        claimed && { opacity: 0.7 },
      ]}>
        <Text style={[styles.iconText, !unlocked && { opacity: 0.2 }]}>{ach.icon}</Text>
        {!unlocked && !hasProgress && (
          <View style={styles.lockOverlay}>
            <Ionicons name="lock-closed" size={12} color="rgba(255,255,255,0.4)" />
          </View>
        )}
        {claimed && (
          <View style={[styles.lockOverlay, { backgroundColor: 'rgba(0,255,136,0.2)' }]}>
            <Ionicons name="checkmark" size={12} color="#00ff88" />
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={[styles.achName, unlocked ? { color } : styles.nameLocked]} numberOfLines={1}>
            {ach.name}
          </Text>
          <View style={[
            styles.rarityPill,
            { backgroundColor: unlocked ? `${color}20` : 'rgba(255,255,255,0.04)', borderColor: unlocked ? `${color}44` : 'rgba(255,255,255,0.1)' },
          ]}>
            <Text style={[styles.rarityPillText, { color: unlocked ? color : 'rgba(255,255,255,0.28)' }]}>
              {RARITY_LABELS[ach.rarity]}
            </Text>
          </View>
        </View>

        <Text style={[styles.achDesc, !unlocked && { opacity: 0.35 }]} numberOfLines={2}>
          {ach.description}
        </Text>

        {/* Progress bar for count-based locked achievements */}
        {hasProgress && (
          <View style={styles.progressWrap}>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={[color, `${color}88`]}
                style={[styles.progressFill, { width: `${pct * 100}%` }]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              />
            </View>
            <Text style={[styles.progressTxt, { color }]}>
              {progressLabel ?? `${Math.round(pct * 100)}%`}
            </Text>
          </View>
        )}

        {/* Reward row */}
        <View style={styles.rewardRow}>
          <Ionicons name="cash-outline" size={10} color={unlocked ? '#ffd700' : 'rgba(255,215,0,0.25)'} />
          <Text style={[styles.rewardText, !unlocked && { opacity: 0.35 }]}>
            {formatChips(ach.chipReward)} chips · {ach.xpReward} XP
          </Text>
        </View>

        {/* Claim button or claimed badge */}
        {showClaim && (
          <TouchableOpacity
            style={[styles.claimBtn, { borderColor: `${color}66`, backgroundColor: `${color}18` }]}
            onPress={onClaim}
            disabled={claiming}
            activeOpacity={0.8}
          >
            <Text style={[styles.claimBtnText, { color }]}>
              {claiming ? 'CLAIMING…' : 'CLAIM REWARD'}
            </Text>
            <Ionicons name="gift-outline" size={11} color={color} />
          </TouchableOpacity>
        )}
        {claimed && (
          <View style={styles.claimedBadge}>
            <Ionicons name="checkmark-circle" size={12} color="#00ff88" />
            <Text style={styles.claimedBadgeText}>CLAIMED</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const { unlockedIds, claimedIds, claim, totalWins, winStreak, handCounts } = useAchievements();
  const { profile } = useUser();
  const completion = achievementCompletion(unlockedIds);
  const [claiming, setClaiming] = useState<Set<string>>(new Set());

  const handleClaim = async (id: string) => {
    if (claiming.has(id)) return;
    setClaiming(prev => new Set(prev).add(id));
    await claim(id);
    setClaiming(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const getProgress = (ach: Achievement): number => {
    if (!ach.target) return -1;
    if (unlockedIds.has(ach.id)) return 1;
    switch (ach.category) {
      case 'hands':
        return (handCounts[ach.id] ?? 0) / ach.target;
      case 'milestone':
        if (ach.id.startsWith('wins_')) return totalWins / ach.target;
        break;
      case 'streak':
        if (ach.id.startsWith('streak_'))  return winStreak / ach.target;
        if (ach.id.startsWith('daily_'))   return profile.streakDays / ach.target;
        break;
      case 'bankroll':
        return profile.chips / ach.target;
    }
    return -1;
  };

  const getProgressLabel = (ach: Achievement): string | undefined => {
    if (ach.category === 'hands' && ach.target && !unlockedIds.has(ach.id)) {
      const count = handCounts[ach.id] ?? 0;
      return `${count} / ${ach.target}`;
    }
    return undefined;
  };

  const byCategory = useMemo(() => {
    const map: Record<AchievementCategory, Achievement[]> = { hands: [], milestone: [], streak: [], bankroll: [] };
    for (const ach of ALL_ACHIEVEMENTS) map[ach.category].push(ach);
    return map;
  }, []);

  const claimableCount = useMemo(
    () => ALL_ACHIEVEMENTS.filter(a => unlockedIds.has(a.id) && !claimedIds.has(a.id)).length,
    [unlockedIds, claimedIds]
  );

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#120030', '#050010', '#020d22', '#050010']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.3, y: 0 }} end={{ x: 0.7, y: 1 }}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#00d4ff" />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>ACHIEVEMENTS</Text>
          {claimableCount > 0 && (
            <View style={styles.claimableBadge}>
              <Text style={styles.claimableText}>{claimableCount} reward{claimableCount !== 1 ? 's' : ''} to claim</Text>
            </View>
          )}
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Overall progress */}
      <View style={styles.progressWrapOuter}>
        <View style={styles.progressBarOuter}>
          <LinearGradient
            colors={['#00d4ff', '#bf5fff']}
            style={[styles.progressFillOuter, { width: `${completion}%` }]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          />
        </View>
        <Text style={styles.progressLabel}>
          {unlockedIds.size} / {ALL_ACHIEVEMENTS.length} unlocked · {completion}% complete
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        {CATEGORIES.map(cat => (
          <View key={cat}>
            <Text style={styles.catTitle}>{CATEGORY_LABELS[cat]}</Text>
            {byCategory[cat].map(ach => (
              <AchCard
                key={ach.id}
                ach={ach}
                unlocked={unlockedIds.has(ach.id)}
                claimed={claimedIds.has(ach.id)}
                progress={getProgress(ach)}
                progressLabel={getProgressLabel(ach)}
                onClaim={() => handleClaim(ach.id)}
                claiming={claiming.has(ach.id)}
              />
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#050010' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
  },
  backBtn: {
    width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
    borderRadius: 18, backgroundColor: 'rgba(0,212,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(0,212,255,0.2)',
  },
  headerTitle: { fontFamily: 'Orbitron_700Bold', fontSize: 16, color: '#00d4ff', letterSpacing: 3 },
  claimableBadge: {
    backgroundColor: 'rgba(255,215,0,0.15)', borderRadius: 8, borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.35)', paddingHorizontal: 8, paddingVertical: 2, marginTop: 4,
  },
  claimableText: { color: '#ffd700', fontSize: 9, fontWeight: '700', fontFamily: 'Orbitron_400Regular', letterSpacing: 0.5 },
  progressWrapOuter: { paddingHorizontal: 20, paddingBottom: 10, gap: 6 },
  progressBarOuter: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  progressFillOuter: { height: '100%', borderRadius: 2 },
  progressLabel: { fontFamily: 'Orbitron_400Regular', fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: 1 },
  scroll: { paddingHorizontal: 14, gap: 6 },
  catTitle: {
    fontFamily: 'Orbitron_700Bold', fontSize: 10, color: 'rgba(255,255,255,0.3)',
    letterSpacing: 3, marginTop: 18, marginBottom: 6, marginLeft: 2,
  },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 14, borderWidth: 1,
    padding: 12, backgroundColor: 'rgba(255,255,255,0.025)', overflow: 'hidden', marginBottom: 2,
  },
  cardLocked: { borderColor: 'rgba(255,255,255,0.06)' },
  iconWrap: {
    width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, flexShrink: 0, position: 'relative',
  },
  iconWrapLocked: { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' },
  iconText: { fontSize: 24 },
  lockOverlay: {
    position: 'absolute', bottom: 0, right: 0, width: 18, height: 18, borderRadius: 9,
    backgroundColor: 'rgba(5,0,16,0.85)', alignItems: 'center', justifyContent: 'center',
  },
  info: { flex: 1, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  achName: { fontFamily: 'Orbitron_700Bold', fontSize: 11, letterSpacing: 0.5, flex: 1 },
  nameLocked: { color: 'rgba(255,255,255,0.28)' },
  rarityPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  rarityPillText: { fontFamily: 'Orbitron_400Regular', fontSize: 7, letterSpacing: 1 },
  achDesc: { fontFamily: 'Orbitron_400Regular', fontSize: 8.5, color: 'rgba(255,255,255,0.45)', lineHeight: 13, letterSpacing: 0.3 },
  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  progressBar: { flex: 1, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 1.5 },
  progressTxt: { fontFamily: 'Inter_700Bold', fontSize: 8, letterSpacing: 0.5, minWidth: 34, textAlign: 'right' },
  rewardRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  rewardText: { fontFamily: 'Orbitron_400Regular', fontSize: 8.5, color: 'rgba(255,215,0,0.55)', letterSpacing: 0.3, flex: 1 },
  claimBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: 8, borderWidth: 1, paddingVertical: 7, marginTop: 6,
  },
  claimBtnText: { fontFamily: 'Orbitron_700Bold', fontSize: 10, letterSpacing: 1.5 },
  claimedBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  claimedBadgeText: { color: '#00ff88', fontFamily: 'Orbitron_700Bold', fontSize: 9, letterSpacing: 1 },
});
