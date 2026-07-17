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

const GOLD = '#ffd700';

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
            <TouchableOpacity
              style={[card.claimBtn, { borderColor: rar.color, backgroundColor: `${rar.color}22` }]}
              onPress={handleClaim}
              activeOpacity={0.8}
            >
              <LinearGradient colors={[`${rar.color}30`, 'transparent']} style={StyleSheet.absoluteFill} />
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

// ── Grand Reward reminder banner (always visible inside expanded panel) ────────

function GrandRewardReminder({
  completedCount,
  totalCount,
  available,
  claimed,
}: {
  completedCount: number;
  totalCount: number;
  available: boolean;
  claimed: boolean;
}) {
  // Brightness anim: brightens when reward becomes available, stays bright
  const glowAnim = useRef(new Animated.Value(available ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(glowAnim, {
      toValue: available ? 1 : 0,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [available]);

  const remaining = totalCount - completedCount;

  let bodyText: string;
  let bodyAccent: string | null = null;

  if (claimed) {
    bodyText = 'Legendary Fortune Cookie collected.';
  } else if (available) {
    bodyText = 'Legendary Fortune Cookie Ready to Claim!';
    bodyAccent = bodyText;
  } else if (remaining <= 2 && completedCount > 0) {
    bodyText = `Only ${remaining} Mission${remaining === 1 ? '' : 's'} Remaining!`;
  } else {
    bodyText = 'Complete all 5 Daily Missions and earn 1 Guaranteed Legendary Fortune Cookie.';
  }

  const borderOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.28, 0.72] });
  const glowLayerOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.05, 0.16] });
  const iconGlow = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  return (
    <View style={rmdr.outer}>
      {/* Gold ambient glow layer */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { borderRadius: 13, backgroundColor: GOLD, opacity: glowLayerOpacity }]}
        pointerEvents="none"
      />
      {/* Animated gold border */}
      <Animated.View
        style={[rmdr.border, { borderColor: GOLD, opacity: borderOpacity }]}
        pointerEvents="none"
      />

      <View style={rmdr.inner}>
        {/* Smoked glass base */}
        <LinearGradient
          colors={['rgba(18,10,0,0.96)', 'rgba(10,6,0,0.98)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        />
        <LinearGradient
          colors={[`${GOLD}14`, 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.6 }}
        />
        {/* Top gold line */}
        <View style={rmdr.topLine} />

        <View style={rmdr.row}>
          {/* Trophy / check icon */}
          <Animated.View style={[rmdr.iconWrap, { opacity: iconGlow }]}>
            {claimed
              ? <Ionicons name="checkmark-circle" size={20} color={GOLD} />
              : <Ionicons name="trophy" size={20} color={GOLD} />
            }
          </Animated.View>

          {/* Text column */}
          <View style={rmdr.textCol}>
            <Text style={rmdr.heading}>
              {claimed ? '✓ GRAND REWARD CLAIMED' : 'GRAND DAILY REWARD'}
            </Text>

            {/* Progress counter (not shown when claimed) */}
            {!claimed && (
              <View style={rmdr.progressRow}>
                {Array.from({ length: totalCount }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      rmdr.pip,
                      { backgroundColor: i < completedCount ? GOLD : 'rgba(255,215,0,0.18)' },
                    ]}
                  />
                ))}
                <Text style={rmdr.progressLabel}>
                  {completedCount} / {totalCount} Complete
                </Text>
              </View>
            )}

            {/* Body text */}
            <Text style={rmdr.body}>
              {bodyAccent
                ? <Text style={{ color: GOLD }}>{bodyAccent}</Text>
                : bodyText
              }
            </Text>

            {!claimed && (
              <Text style={rmdr.footer}>Available once per daily reset.</Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const rmdr = StyleSheet.create({
  outer: { borderRadius: 13 },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 13,
    borderWidth: 1,
  },
  inner: {
    borderRadius: 13,
    overflow: 'hidden',
    padding: 11,
    paddingHorizontal: 12,
  },
  topLine: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 1, backgroundColor: GOLD, opacity: 0.45,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  iconWrap: {
    width: 36, height: 36, borderRadius: 10,
    borderWidth: 1, borderColor: `${GOLD}44`,
    backgroundColor: `${GOLD}12`,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginTop: 1,
  },
  textCol: { flex: 1, gap: 4 },
  heading: {
    color: GOLD, fontSize: 9, fontWeight: '900',
    fontFamily: 'Orbitron_700Bold', letterSpacing: 1.1,
  },
  progressRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  pip: {
    width: 14, height: 4, borderRadius: 2,
  },
  progressLabel: {
    color: colors.textMuted, fontSize: 9,
    fontFamily: 'Inter_400Regular', marginLeft: 2,
  },
  body: {
    color: colors.text, fontSize: 11,
    lineHeight: 15,
  },
  footer: {
    color: colors.textMuted, fontSize: 9,
    fontFamily: 'Inter_400Regular',
  },
});

// ── Grand Reward card ──────────────────────────────────────────────────────────

function GrandRewardCard({
  available,
  claimed,
  onClaim,
}: {
  available: boolean;
  claimed: boolean;
  onClaim: () => void;
}) {
  const pulseAnim  = useRef(new Animated.Value(0)).current;
  const claimScale = useRef(new Animated.Value(1)).current;
  const pulseLoop  = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (available && !claimed) {
      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
        ])
      );
      pulseLoop.current.start();
    } else {
      pulseLoop.current?.stop();
      pulseAnim.setValue(0);
    }
    return () => pulseLoop.current?.stop();
  }, [available, claimed]);

  const handleClaim = () => {
    if (claimed) return;
    Animated.sequence([
      Animated.timing(claimScale, { toValue: 0.92, duration: 70, useNativeDriver: true }),
      Animated.timing(claimScale, { toValue: 1,    duration: 120, useNativeDriver: true }),
    ]).start(onClaim);
  };

  const borderOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.85] });
  const glowOpacity   = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.08, 0.22] });

  return (
    <View style={gr.outer}>
      {/* Animated pulsing glow background */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { borderRadius: 16, backgroundColor: GOLD, opacity: glowOpacity }]}
        pointerEvents="none"
      />

      {/* Gold border (animated opacity) */}
      <Animated.View
        style={[gr.border, { borderColor: GOLD, opacity: borderOpacity }]}
        pointerEvents="none"
      />

      {/* Card body */}
      <View style={gr.inner}>
        <LinearGradient
          colors={['rgba(20,12,0,0.98)', 'rgba(10,6,0,0.99)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        />
        <LinearGradient
          colors={[`${GOLD}20`, 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        />
        {/* Gold glow line at top */}
        <View style={gr.topLine} />

        <View style={gr.content}>
          {/* Left: trophy + labels */}
          <View style={gr.left}>
            <View style={gr.trophyWrap}>
              <Ionicons name="trophy" size={22} color={GOLD} />
            </View>
            <View style={{ gap: 3 }}>
              <Text style={gr.heading}>DAILY GRAND REWARD</Text>
              <Text style={gr.sub}>All 5 missions passed!</Text>
              <View style={gr.cookieRow}>
                <MaterialCommunityIcons name="cookie" size={13} color={GOLD} />
                <Text style={gr.cookieText}>1× Legendary Fortune Cookie</Text>
              </View>
              <Text style={gr.guarantee}>Guaranteed · No RNG</Text>
            </View>
          </View>

          {/* Right: claim / claimed */}
          <View style={gr.right}>
            {claimed ? (
              <View style={gr.claimedWrap}>
                <Ionicons name="checkmark-circle" size={16} color={GOLD} />
                <Text style={gr.claimedLabel}>CLAIMED</Text>
              </View>
            ) : (
              <Animated.View style={{ transform: [{ scale: claimScale }] }}>
                <TouchableOpacity
                  style={gr.claimBtn}
                  onPress={handleClaim}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[`${GOLD}50`, `${GOLD}20`]}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                  />
                  <Text style={gr.claimBtnText}>CLAIM</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const gr = StyleSheet.create({
  outer: {
    borderRadius: 16,
    marginTop: 4,
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  inner: {
    borderRadius: 16,
    overflow: 'hidden',
    padding: 14,
  },
  topLine: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 1.5, backgroundColor: GOLD, opacity: 0.55,
  },
  content: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  left: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  trophyWrap: {
    width: 44, height: 44, borderRadius: 13,
    borderWidth: 1.5, borderColor: `${GOLD}55`,
    backgroundColor: `${GOLD}15`,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  heading: {
    color: GOLD, fontSize: 9.5, fontWeight: '900',
    fontFamily: 'Orbitron_700Bold', letterSpacing: 1,
  },
  sub: {
    color: colors.text, fontSize: 11, fontWeight: '700',
    fontFamily: 'Orbitron_700Bold', letterSpacing: 0.3,
  },
  cookieRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  cookieText: {
    color: GOLD, fontSize: 10, fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  guarantee: {
    color: colors.textMuted, fontSize: 9,
    fontFamily: 'Inter_400Regular', marginTop: 1,
  },
  right: { flexShrink: 0, alignItems: 'center' },
  claimedWrap: { alignItems: 'center', gap: 3 },
  claimedLabel: {
    color: GOLD, fontSize: 8.5, fontWeight: '900',
    fontFamily: 'Orbitron_700Bold', letterSpacing: 0.8, opacity: 0.85,
  },
  claimBtn: {
    borderRadius: 10, borderWidth: 1.5, borderColor: `${GOLD}88`,
    overflow: 'hidden', paddingHorizontal: 16, paddingVertical: 9,
  },
  claimBtnText: {
    color: GOLD, fontSize: 11, fontWeight: '900',
    fontFamily: 'Orbitron_700Bold', letterSpacing: 1.2,
  },
});

// ── Main panel ─────────────────────────────────────────────────────────────────

export default function DailyMissionsPanel() {
  const {
    dailyMissions,
    completedCount,
    claimMission,
    grandRewardAvailable,
    grandRewardClaimed,
    claimGrandReward,
    debugFillAllComplete,
  } = useMissions();

  const [expanded, setExpanded] = useState(false);
  const chevronAnim = useRef(new Animated.Value(0)).current;

  const claimableCount    = dailyMissions.filter(m => m.progress >= m.target && !m.claimed).length;
  const totalCount        = dailyMissions.length;
  const allMissionsPassed = totalCount > 0 && dailyMissions.every(m => m.claimed);
  const overallRatio      = totalCount > 0 ? completedCount / totalCount : 0;

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

  const handleClaimGrand = useCallback(() => {
    void claimGrandReward();
  }, [claimGrandReward]);

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

      {/* Header — always visible; long-press title to fill all missions (dev testing) */}
      <Pressable style={panel.header} onPress={toggle} onLongPress={debugFillAllComplete}>
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
          {/* Grand Reward Ready badge (highest priority) */}
          {grandRewardAvailable && !grandRewardClaimed && (
            <View style={panel.grandBadge}>
              <Ionicons name="trophy" size={9} color={GOLD} />
              <Text style={panel.grandBadgeText}>GRAND REWARD</Text>
            </View>
          )}
          {/* Claimable missions badge (only when grand reward not pending) */}
          {!grandRewardAvailable && claimableCount > 0 && (
            <View style={panel.claimableBadge}>
              <Text style={panel.claimableText}>{claimableCount} READY</Text>
            </View>
          )}

          {/* Count / all-passed indicator */}
          {allMissionsPassed && grandRewardClaimed ? (
            <Text style={panel.allPassedText}>★★★★★</Text>
          ) : (
            <Text style={panel.countText}>
              <Text style={{ color: completedCount === totalCount ? '#00e887' : '#bf5fff' }}>
                {completedCount}
              </Text>
              <Text style={{ color: colors.textMuted }}> / {totalCount}</Text>
            </Text>
          )}

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
          {/* Grand Reward reminder — always shown at top of list */}
          <GrandRewardReminder
            completedCount={completedCount}
            totalCount={totalCount}
            available={grandRewardAvailable}
            claimed={grandRewardClaimed}
          />

          {dailyMissions.map(m => (
            <MissionCard
              key={m.id}
              mission={m}
              onClaim={() => handleClaim(m.id)}
            />
          ))}

          {/* Grand Reward card — shown once all 5 missions are claimed */}
          {allMissionsPassed && (
            <GrandRewardCard
              available={grandRewardAvailable}
              claimed={grandRewardClaimed}
              onClaim={handleClaimGrand}
            />
          )}

          {/* All-done footer */}
          {allMissionsPassed && grandRewardClaimed && (
            <View style={panel.allDone}>
              <Ionicons name="trophy" size={22} color={GOLD} />
              <Text style={panel.allPassedBig}>★★★★★ ALL MISSIONS PASSED ★★★★★</Text>
              <Text style={panel.allDoneSub}>Legendary Cookie collected · New missions tomorrow</Text>
            </View>
          )}
          {allMissionsPassed && !grandRewardClaimed && (
            <View style={panel.allDone}>
              <Ionicons name="checkmark-circle" size={22} color="#00e887" />
              <Text style={panel.allDoneText}>ALL MISSIONS PASSED!</Text>
              <Text style={panel.allDoneSub}>Claim your Grand Reward above</Text>
            </View>
          )}
          {!allMissionsPassed && completedCount === totalCount && (
            <View style={panel.allDone}>
              <Ionicons name="checkmark-circle" size={20} color="#00e887" />
              <Text style={panel.allDoneText}>ALL MISSIONS COMPLETE</Text>
              <Text style={panel.allDoneSub}>Claim rewards to unlock Grand Reward</Text>
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
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },

  // Grand Reward badge (gold)
  grandBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3,
    backgroundColor: 'rgba(255,215,0,0.12)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.40)',
  },
  grandBadgeText: {
    color: GOLD, fontSize: 7.5, fontWeight: '900',
    fontFamily: 'Orbitron_700Bold', letterSpacing: 0.8,
  },

  claimableBadge: {
    borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3,
    backgroundColor: 'rgba(0,232,135,0.15)', borderWidth: 1, borderColor: 'rgba(0,232,135,0.35)',
  },
  claimableText: {
    color: '#00e887', fontSize: 8, fontWeight: '900',
    fontFamily: 'Orbitron_700Bold', letterSpacing: 0.8,
  },

  countText: { fontSize: 12, fontWeight: '800', fontFamily: 'Orbitron_700Bold' },
  allPassedText: { color: GOLD, fontSize: 11, letterSpacing: 2 },

  summaryBar: {
    height: 2, marginHorizontal: 14, marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 1, overflow: 'hidden',
  },
  summaryFill: { height: '100%', borderRadius: 1, backgroundColor: '#bf5fff' },
  summaryGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '100%',
    backgroundColor: '#00e887', opacity: 0.6,
  },
  content: { paddingHorizontal: 12, paddingBottom: 12, gap: 8 },

  allDone: { alignItems: 'center', paddingVertical: 14, gap: 5 },
  allDoneText: {
    color: '#00e887', fontSize: 12, fontWeight: '900',
    fontFamily: 'Orbitron_700Bold', letterSpacing: 1,
  },
  allPassedBig: {
    color: GOLD, fontSize: 10, fontWeight: '900',
    fontFamily: 'Orbitron_700Bold', letterSpacing: 0.8, textAlign: 'center',
  },
  allDoneSub: { color: colors.textMuted, fontSize: 10.5, textAlign: 'center' },
});
