import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import colors from '@/constants/colors';
import { type ActiveMission, type MissionRarity, useMissions } from '@/context/MissionsContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ── Spade SVG icon ─────────────────────────────────────────────────────────────

function SpadeIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 2 C9.5 4.5 5 6 5 10 C5 13 7.5 14.5 10 14 C9 15.5 8 17 7 18 L17 18 C16 17 15 15.5 14 14 C16.5 14.5 19 13 19 10 C19 6 14.5 4.5 12 2 Z"
        fill={color}
      />
    </Svg>
  );
}

// ── Rarity palette ─────────────────────────────────────────────────────────────

const RARITY: Record<MissionRarity, { color: string; label: string; glow: string }> = {
  common:    { color: '#00d4ff', label: 'COMMON',    glow: 'rgba(0,212,255,0.15)' },
  rare:      { color: '#bf5fff', label: 'RARE',      glow: 'rgba(191,95,255,0.15)' },
  epic:      { color: '#ff0090', label: 'EPIC',      glow: 'rgba(255,0,144,0.18)' },
  legendary: { color: '#ffd700', label: 'LEGENDARY', glow: 'rgba(255,215,0,0.18)' },
};

// ── Chip amount formatter ──────────────────────────────────────────────────────

function fmtChips(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000)     return `${Math.round(n / 1_000)}K`;
  return String(n);
}

// ── Mission card ───────────────────────────────────────────────────────────────

function MissionCard({ mission, onClaim }: { mission: ActiveMission; onClaim: () => void }) {
  const rar = RARITY[mission.rarity];
  const ratio = Math.min(1, mission.progress / mission.target);
  const barAnim = useRef(new Animated.Value(0)).current;
  const claimScale = useRef(new Animated.Value(1)).current;
  const isComplete = mission.progress >= mission.target;

  useEffect(() => {
    Animated.spring(barAnim, {
      toValue: ratio,
      useNativeDriver: false,
      tension: 60,
      friction: 12,
    }).start();
  }, [ratio]);

  const handleClaim = () => {
    Animated.sequence([
      Animated.timing(claimScale, { toValue: 0.92, duration: 70, useNativeDriver: true }),
      Animated.timing(claimScale, { toValue: 1,    duration: 120, useNativeDriver: true }),
    ]).start(onClaim);
  };

  return (
    <View style={[card.wrap, { borderColor: isComplete ? `${rar.color}55` : 'rgba(255,255,255,0.08)' }]}>
      {isComplete && (
        <LinearGradient
          colors={[rar.glow, 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        />
      )}

      {/* Top row */}
      <View style={card.topRow}>
        <View style={[card.iconWrap, { borderColor: `${rar.color}44`, backgroundColor: `${rar.color}12` }]}>
          <Ionicons name={mission.icon as any} size={16} color={rar.color} />
        </View>
        <View style={{ flex: 1, gap: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={card.title} numberOfLines={1}>{mission.title}</Text>
            <View style={[card.rarBadge, { backgroundColor: `${rar.color}22`, borderColor: `${rar.color}44` }]}>
              <Text style={[card.rarText, { color: rar.color }]}>{rar.label}</Text>
            </View>
          </View>
          <Text style={card.desc} numberOfLines={2}>{mission.description}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={card.barBg}>
        <Animated.View
          style={[
            card.barFill,
            {
              backgroundColor: isComplete ? rar.color : `${rar.color}cc`,
              width: barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            },
          ]}
        />
        {isComplete && (
          <View style={[card.barGlow, { backgroundColor: rar.color }]} />
        )}
      </View>

      {/* Bottom row: progress + reward + claim */}
      <View style={card.bottomRow}>
        <Text style={[card.progressText, { color: isComplete ? rar.color : colors.textMuted }]}>
          {mission.progress} / {mission.target}
          {isComplete && '  ✓'}
        </Text>
        <View style={card.rewardRow}>
          <MaterialCommunityIcons name="poker-chip" size={11} color={colors.gold ?? '#ffd700'} />
          <Text style={card.rewardChips}>{fmtChips(mission.chipReward)}</Text>
          <Text style={card.rewardSep}>·</Text>
          <Text style={card.rewardXP}>{mission.xpReward} XP</Text>
        </View>
        {mission.claimed ? (
          <View style={card.claimedBadge}>
            <Ionicons name="checkmark-circle" size={13} color={rar.color} />
            <Text style={[card.claimedText, { color: rar.color }]}>CLAIMED</Text>
          </View>
        ) : isComplete ? (
          <Animated.View style={{ transform: [{ scale: claimScale }] }}>
            <TouchableOpacity style={[card.claimBtn, { borderColor: rar.color, backgroundColor: `${rar.color}22` }]} onPress={handleClaim} activeOpacity={0.8}>
              <LinearGradient
                colors={[`${rar.color}30`, 'transparent']}
                style={StyleSheet.absoluteFill}
              />
              <Text style={[card.claimText, { color: rar.color }]}>CLAIM</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

const card = StyleSheet.create({
  wrap: {
    borderRadius: 14, borderWidth: 1, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 12, gap: 10,
  },
  topRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  iconWrap: {
    width: 34, height: 34, borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  title: { color: colors.text, fontSize: 12.5, fontWeight: '800', fontFamily: 'Orbitron_700Bold', letterSpacing: 0.3 },
  desc: { color: colors.textMuted, fontSize: 10.5, lineHeight: 14, marginTop: 1 },
  rarBadge: { borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, borderWidth: 1 },
  rarText: { fontSize: 7.5, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 0.8 },
  barBg: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.07)', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 2 },
  barGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: '100%', opacity: 0.3, borderRadius: 2 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressText: { fontSize: 10, fontWeight: '700', fontFamily: 'Orbitron_400Regular', letterSpacing: 0.3, minWidth: 40 },
  rewardRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 3 },
  rewardChips: { color: '#ffd700', fontSize: 10, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  rewardSep: { color: colors.textMuted, fontSize: 10 },
  rewardXP: { color: colors.textMuted, fontSize: 10, fontFamily: 'Inter_400Regular' },
  claimBtn: {
    borderRadius: 8, borderWidth: 1, overflow: 'hidden',
    paddingHorizontal: 14, paddingVertical: 5,
  },
  claimText: { fontSize: 10, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 1 },
  claimedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  claimedText: { fontSize: 9, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 0.8, opacity: 0.8 },
});

// ── Main panel ─────────────────────────────────────────────────────────────────

export default function DailyMissionsPanel() {
  const { dailyMissions, completedCount, claimMission } = useMissions();
  const [expanded, setExpanded] = useState(false);
  const chevronAnim = useRef(new Animated.Value(0)).current;
  const claimableCount = dailyMissions.filter(m => m.progress >= m.target && !m.claimed).length;
  const totalCount = dailyMissions.length;
  const overallRatio = totalCount > 0 ? completedCount / totalCount : 0;

  const toggle = () => {
    LayoutAnimation.configureNext({
      duration: 280,
      create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
      update: { type: LayoutAnimation.Types.easeInEaseOut },
      delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
    });
    setExpanded(e => !e);
    Animated.spring(chevronAnim, {
      toValue: expanded ? 0 : 1,
      useNativeDriver: true,
      tension: 70,
      friction: 12,
    }).start();
  };

  const handleClaim = useCallback((id: string) => {
    void claimMission(id);
  }, [claimMission]);

  const chevronRotate = chevronAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <View style={panel.wrap}>
      <LinearGradient
        colors={['rgba(14,4,32,0.95)', 'rgba(6,1,18,0.98)']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
      />
      <LinearGradient
        colors={['rgba(191,95,255,0.06)', 'transparent']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />

      {/* Header — always visible */}
      <Pressable style={panel.header} onPress={toggle}>
        <View style={panel.headerLeft}>
          <View style={panel.spadeWrap}>
            <SpadeIcon color="#bf5fff" size={16} />
          </View>
          <View>
            <Text style={panel.title}>DAILY MISSIONS</Text>
            <Text style={panel.subtitle}>Resets at midnight</Text>
          </View>
        </View>
        <View style={panel.headerRight}>
          {claimableCount > 0 && (
            <View style={panel.claimableBadge}>
              <Text style={panel.claimableText}>{claimableCount} READY</Text>
            </View>
          )}
          <Text style={panel.countText}>
            <Text style={{ color: completedCount === totalCount ? '#00e887' : '#bf5fff' }}>{completedCount}</Text>
            <Text style={{ color: colors.textMuted }}> / {totalCount}</Text>
          </Text>
          <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
            <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
          </Animated.View>
        </View>
      </Pressable>

      {/* Summary progress bar — always visible */}
      <View style={panel.summaryBar}>
        <View style={[panel.summaryFill, { width: `${overallRatio * 100}%` }]} />
        {completedCount === totalCount && totalCount > 0 && (
          <View style={panel.summaryGlow} />
        )}
      </View>

      {/* Expanded content */}
      {expanded && (
        <View style={panel.content}>
          {dailyMissions.map(m => (
            <MissionCard
              key={m.id}
              mission={m}
              onClaim={() => handleClaim(m.id)}
            />
          ))}
          {dailyMissions.every(m => m.claimed) && (
            <View style={panel.allDone}>
              <Ionicons name="checkmark-circle" size={22} color="#00e887" />
              <Text style={panel.allDoneText}>ALL MISSIONS COMPLETE</Text>
              <Text style={panel.allDoneSub}>New missions tomorrow</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const panel = StyleSheet.create({
  wrap: {
    borderRadius: 18, borderWidth: 1, borderColor: 'rgba(191,95,255,0.22)',
    overflow: 'hidden',
    shadowColor: '#bf5fff', shadowOpacity: 0.12, shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingTop: 13, paddingBottom: 10,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  spadeWrap: {
    width: 32, height: 32, borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(191,95,255,0.35)',
    backgroundColor: 'rgba(191,95,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  title: {
    color: colors.text, fontSize: 12, fontWeight: '900',
    fontFamily: 'Orbitron_700Bold', letterSpacing: 1,
  },
  subtitle: { color: colors.textMuted, fontSize: 9.5, marginTop: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  claimableBadge: {
    borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3,
    backgroundColor: 'rgba(0,232,135,0.15)', borderWidth: 1, borderColor: 'rgba(0,232,135,0.35)',
  },
  claimableText: {
    color: '#00e887', fontSize: 8, fontWeight: '900',
    fontFamily: 'Orbitron_700Bold', letterSpacing: 0.8,
  },
  countText: { fontSize: 12, fontWeight: '800', fontFamily: 'Orbitron_700Bold' },
  summaryBar: {
    height: 2, marginHorizontal: 14, marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 1, overflow: 'hidden',
  },
  summaryFill: {
    height: '100%', borderRadius: 1,
    backgroundColor: '#bf5fff',
  },
  summaryGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '100%',
    backgroundColor: '#00e887', opacity: 0.6,
  },
  content: { paddingHorizontal: 12, paddingBottom: 12, gap: 8 },
  allDone: {
    alignItems: 'center', paddingVertical: 18, gap: 6,
  },
  allDoneText: {
    color: '#00e887', fontSize: 13, fontWeight: '900',
    fontFamily: 'Orbitron_700Bold', letterSpacing: 1,
  },
  allDoneSub: { color: colors.textMuted, fontSize: 11 },
});
