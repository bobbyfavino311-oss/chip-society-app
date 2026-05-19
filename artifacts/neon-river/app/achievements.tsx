import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
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

const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  hands:     'POKER HANDS',
  milestone: 'MILESTONES',
  streak:    'STREAKS',
  bankroll:  'BANKROLL',
};

const CATEGORIES: AchievementCategory[] = ['hands', 'milestone', 'streak', 'bankroll'];

function AchCard({ ach, unlocked }: { ach: Achievement; unlocked: boolean }) {
  const color = RARITY_COLORS[ach.rarity];
  return (
    <View style={[
      styles.card,
      unlocked ? { borderColor: `${color}55` } : styles.cardLocked,
    ]}>
      {unlocked && (
        <LinearGradient
          colors={[`${color}10`, 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        />
      )}
      {/* Icon */}
      <View style={[
        styles.iconWrap,
        unlocked
          ? { backgroundColor: `${color}18`, borderColor: `${color}44` }
          : styles.iconWrapLocked,
      ]}>
        <Text style={[styles.iconText, !unlocked && { opacity: 0.25 }]}>
          {ach.icon}
        </Text>
        {!unlocked && (
          <View style={styles.lockOverlay}>
            <Ionicons name="lock-closed" size={14} color="rgba(255,255,255,0.4)" />
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={[styles.achName, unlocked ? { color } : styles.nameLocked]}
            numberOfLines={1}>
            {ach.name}
          </Text>
          <View style={[
            styles.rarityPill,
            { backgroundColor: unlocked ? `${color}22` : 'rgba(255,255,255,0.04)', borderColor: unlocked ? `${color}44` : 'rgba(255,255,255,0.1)' },
          ]}>
            <Text style={[styles.rarityPillText, { color: unlocked ? color : 'rgba(255,255,255,0.3)' }]}>
              {RARITY_LABELS[ach.rarity]}
            </Text>
          </View>
        </View>
        <Text style={[styles.achDesc, !unlocked && { opacity: 0.4 }]} numberOfLines={2}>
          {ach.description}
        </Text>
        <View style={styles.rewardRow}>
          <Ionicons name="cash-outline" size={10} color={unlocked ? '#ffd700' : 'rgba(255,215,0,0.3)'} />
          <Text style={[styles.rewardText, !unlocked && { opacity: 0.4 }]}>
            {ach.chipReward.toLocaleString()} chips · {ach.xpReward.toLocaleString()} XP
          </Text>
          {unlocked && (
            <View style={styles.checkBadge}>
              <Ionicons name="checkmark" size={10} color="#00ff88" />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const { unlockedIds, totalWins } = useAchievements();
  const completion = achievementCompletion(unlockedIds);

  const byCategory = useMemo(() => {
    const map: Record<AchievementCategory, Achievement[]> = {
      hands: [], milestone: [], streak: [], bankroll: [],
    };
    for (const ach of ALL_ACHIEVEMENTS) map[ach.category].push(ach);
    return map;
  }, []);

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
        <Text style={styles.headerTitle}>ACHIEVEMENTS</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Progress bar */}
      <View style={styles.progressWrap}>
        <View style={styles.progressBar}>
          <LinearGradient
            colors={['#00d4ff', '#bf5fff']}
            style={[styles.progressFill, { width: `${completion}%` }]}
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
              <AchCard key={ach.id} ach={ach} unlocked={unlockedIds.has(ach.id)} />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(0,212,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.2)',
  },
  headerTitle: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 16,
    color: '#00d4ff',
    letterSpacing: 3,
  },
  progressWrap: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    gap: 6,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressLabel: {
    fontFamily: 'Orbitron_400Regular',
    fontSize: 9,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1,
  },
  scroll: { paddingHorizontal: 14, gap: 6 },
  catTitle: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 10,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 3,
    marginTop: 18,
    marginBottom: 6,
    marginLeft: 2,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    overflow: 'hidden',
    marginBottom: 2,
  },
  cardLocked: {
    borderColor: 'rgba(255,255,255,0.07)',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexShrink: 0,
    position: 'relative',
  },
  iconWrapLocked: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  iconText: { fontSize: 24 },
  lockOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(5,0,16,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  achName: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 11,
    letterSpacing: 0.5,
    flex: 1,
  },
  nameLocked: { color: 'rgba(255,255,255,0.3)' },
  rarityPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  rarityPillText: {
    fontFamily: 'Orbitron_400Regular',
    fontSize: 7,
    letterSpacing: 1,
  },
  achDesc: {
    fontFamily: 'Orbitron_400Regular',
    fontSize: 8.5,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 13,
    letterSpacing: 0.3,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  rewardText: {
    fontFamily: 'Orbitron_400Regular',
    fontSize: 8.5,
    color: 'rgba(255,215,0,0.6)',
    letterSpacing: 0.3,
    flex: 1,
  },
  checkBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0,255,136,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
