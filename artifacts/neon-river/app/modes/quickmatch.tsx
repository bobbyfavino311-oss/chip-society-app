import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState, useMemo } from 'react';
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
import { STAKE_TIERS, StakeTierKey } from '@/lib/stakeConfig';
import { useUser } from '@/context/UserContext';

type Phase = 'idle' | 'searching' | 'found';

const SEARCH_MESSAGES = [
  'Scanning active tables…',
  'Checking seat availability…',
  'Matching stake level…',
  'Assigning your seat…',
  'Match ready!',
];

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`;
  return n.toLocaleString();
}

function getAutoTierKey(chips: number): StakeTierKey {
  if (chips >= 10_000_000) return 'elite_plus';
  if (chips >=  5_000_000) return 'elite';
  if (chips >=  2_000_000) return 'vip';
  if (chips >=  1_000_000) return 'highroller';
  if (chips >=    500_000) return 'standard';
  if (chips >=    250_000) return 'low';
  if (chips >=    100_000) return 'micro';
  return 'starter';
}

// Seed deterministic "active table" counts per tier from current minute
function seedTableCount(tierKey: string, salt: number): number {
  const h = (tierKey.charCodeAt(0) * 31 + salt) % 100;
  return 2 + (h % 4); // 2–5 players
}

function PulseDot({ color }: { color: string }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.5, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[s.dot, { backgroundColor: color, transform: [{ scale: pulse }] }]} />
  );
}

export default function QuickMatchScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useUser();
  const [phase, setPhase] = useState<Phase>('idle');
  const [msgIdx, setMsgIdx] = useState(0);
  const [selectedTierKey, setSelectedTierKey] = useState<StakeTierKey>(() =>
    getAutoTierKey(profile?.chips ?? 100_000)
  );
  const foundScale = useRef(new Animated.Value(0)).current;

  const selectedTier = STAKE_TIERS.find(t => t.key === selectedTierKey) ?? STAKE_TIERS[1];

  const onlinePlayers = useMemo(() => {
    const m = Math.floor(Date.now() / 60_000);
    return 2400 + ((m * 17 + 347) % 800);
  }, []);
  const activeTables = useMemo(() => Math.floor(onlinePlayers / 7), [onlinePlayers]);
  const minuteSalt = useMemo(() => Math.floor(Date.now() / 60_000), []);

  useEffect(() => {
    if (phase !== 'searching') return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    SEARCH_MESSAGES.forEach((_, i) => {
      timers.push(setTimeout(() => setMsgIdx(i), i * 600));
    });
    timers.push(setTimeout(() => {
      setPhase('found');
      Animated.spring(foundScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }).start();
      setTimeout(() => router.replace('/game/practice'), 1400);
    }, 3200));
    return () => timers.forEach(clearTimeout);
  }, [phase]);

  const startSearch = () => { setMsgIdx(0); setPhase('searching'); };
  const cancel = () => setPhase('idle');

  return (
    <View style={s.container}>
      <LinearGradient colors={['#071830', '#050010', '#001020']} style={StyleSheet.absoluteFill} />
      <View style={s.glowTop} />

      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 20 : 16) }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={s.title}>QUICK MATCH</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>

        {/* Stats row */}
        <View style={s.statsRow}>
          {[
            { label: 'PLAYERS ONLINE', value: onlinePlayers.toLocaleString(), color: '#00d4ff' },
            { label: 'ACTIVE TABLES',  value: activeTables.toString(),         color: '#00d4aa' },
            { label: 'AVG WAIT',       value: '<10s',                          color: colors.success },
          ].map(stat => (
            <View key={stat.label} style={s.statCard}>
              <LinearGradient colors={[`${stat.color}18`, 'transparent']} style={StyleSheet.absoluteFill} />
              <Text style={[s.statVal, { color: stat.color }]}>{stat.value}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Stake tier picker */}
        {phase === 'idle' && (
          <>
            <Text style={s.sectionLabel}>SELECT STAKE</Text>
            <View style={s.tierGrid}>
              {STAKE_TIERS.map(tier => {
                const active = selectedTierKey === tier.key;
                return (
                  <TouchableOpacity
                    key={tier.key}
                    style={[s.tierBtn, { borderColor: active ? tier.color : colors.border }]}
                    onPress={() => setSelectedTierKey(tier.key)}
                    activeOpacity={0.8}
                  >
                    {active && <LinearGradient colors={[`${tier.color}28`, 'transparent']} style={StyleSheet.absoluteFill} />}
                    <Text style={[s.tierLabel, { color: active ? tier.color : colors.text }]}>{tier.label}</Text>
                    <Text style={[s.tierBlinds, { color: active ? tier.color : colors.textDim }]}>
                      {fmt(tier.smallBlind)}/{fmt(tier.bigBlind)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Selected stake summary */}
            <View style={[s.summaryBox, { borderColor: `${selectedTier.color}44` }]}>
              <LinearGradient colors={[`${selectedTier.color}10`, 'transparent']} style={StyleSheet.absoluteFill} />
              <View style={s.summaryRow}>
                <View style={s.summaryItem}>
                  <Text style={[s.summaryVal, { color: selectedTier.color }]}>
                    {fmt(selectedTier.smallBlind)} / {fmt(selectedTier.bigBlind)}
                  </Text>
                  <Text style={s.summaryKey}>BLINDS</Text>
                </View>
                <View style={s.summaryDivider} />
                <View style={s.summaryItem}>
                  <Text style={[s.summaryVal, { color: selectedTier.color }]}>
                    {fmt(selectedTier.minBuyIn)}–{fmt(selectedTier.maxBuyIn)}
                  </Text>
                  <Text style={s.summaryKey}>BUY-IN RANGE</Text>
                </View>
              </View>
            </View>

            {/* FIND MATCH button */}
            <TouchableOpacity style={s.findBtn} onPress={startSearch} activeOpacity={0.85}>
              <LinearGradient colors={['#00d4ff', '#0055cc']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
              <Ionicons name="flash" size={24} color="#fff" style={{ marginRight: 10 }} />
              <Text style={s.findBtnText}>FIND {selectedTier.label} TABLE</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Searching state */}
        {phase === 'searching' && (
          <View style={s.searchingBox}>
            <LinearGradient colors={['rgba(0,212,255,0.08)', 'transparent']} style={StyleSheet.absoluteFill} />
            <View style={s.searchingDots}>
              {[0, 1, 2].map(i => <SearchDot key={i} delay={i * 200} />)}
            </View>
            <Text style={s.searchingTier}>{selectedTier.label}</Text>
            <Text style={s.searchingMsg}>{SEARCH_MESSAGES[msgIdx]}</Text>
            <TouchableOpacity onPress={cancel} style={s.cancelBtn}>
              <Text style={s.cancelText}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Found state */}
        {phase === 'found' && (
          <Animated.View style={[s.foundBox, { transform: [{ scale: foundScale }] }]}>
            <LinearGradient colors={['rgba(0,212,255,0.15)', 'rgba(0,212,255,0.05)']} style={StyleSheet.absoluteFill} />
            <Text style={s.foundEmoji}>⚡</Text>
            <Text style={s.foundTitle}>MATCH FOUND!</Text>
            <Text style={s.foundSub}>{selectedTier.label} · Loading table…</Text>
          </Animated.View>
        )}

        {/* Active tables by stake */}
        {phase === 'idle' && (
          <>
            <Text style={s.sectionLabel}>ACTIVE TABLES</Text>
            {STAKE_TIERS.map((tier, idx) => {
              const count = seedTableCount(tier.key, minuteSalt);
              const waitS = 5 + (idx * 3);
              return (
                <TouchableOpacity
                  key={tier.key}
                  style={[s.tableRow, { borderColor: `${tier.color}44` }]}
                  onPress={() => { setSelectedTierKey(tier.key); startSearch(); }}
                  activeOpacity={0.8}
                >
                  <LinearGradient colors={[`${tier.color}10`, 'transparent']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                  <PulseDot color={tier.color} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[s.tableStakes, { color: tier.color }]}>{tier.label}</Text>
                    <Text style={s.tableBlinds}>
                      Blinds: {fmt(tier.smallBlind)}/{fmt(tier.bigBlind)} · Buy-In: {fmt(tier.minBuyIn)}–{fmt(tier.maxBuyIn)}
                    </Text>
                  </View>
                  <View style={s.tableRight}>
                    <Text style={s.tablePlayers}>{count}/5</Text>
                    <Text style={s.tableWait}>~{waitS}s</Text>
                    <View style={[s.joinBtn, { backgroundColor: tier.color }]}>
                      <Text style={s.joinText}>JOIN</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function SearchDot({ delay }: { delay: number }) {
  const anim = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.3, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    }, delay);
  }, []);
  return <Animated.View style={[s.searchDot, { opacity: anim }]} />;
}

const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#050010' },
  glowTop:       { position: 'absolute', top: -60, left: 60, width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(0,212,255,0.07)' },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
  backBtn:       { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: 'rgba(0,212,255,0.1)', borderWidth: 1, borderColor: 'rgba(0,212,255,0.2)' },
  title:         { color: colors.text, fontSize: 18, fontWeight: '900', fontFamily: 'Orbitron_900Black', letterSpacing: 2 },
  scroll:        { paddingHorizontal: 16, gap: 14 },
  statsRow:      { flexDirection: 'row', gap: 10 },
  statCard:      { flex: 1, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 12, alignItems: 'center', overflow: 'hidden' },
  statVal:       { fontSize: 18, fontWeight: '900', fontFamily: 'Orbitron_700Bold' },
  statLabel:     { color: colors.textDim, fontSize: 8, letterSpacing: 1, marginTop: 3 },
  sectionLabel:  { color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 2, fontFamily: 'Orbitron_400Regular' },
  tierGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tierBtn:       { width: '23%', borderRadius: 10, borderWidth: 1, padding: 8, alignItems: 'center', gap: 3, overflow: 'hidden' },
  tierLabel:     { fontSize: 9, fontWeight: '900', fontFamily: 'Orbitron_700Bold', textAlign: 'center' },
  tierBlinds:    { fontSize: 8, textAlign: 'center' },
  summaryBox:    { borderRadius: 14, borderWidth: 1, padding: 14, overflow: 'hidden' },
  summaryRow:    { flexDirection: 'row', alignItems: 'center' },
  summaryItem:   { flex: 1, alignItems: 'center', gap: 3 },
  summaryVal:    { fontSize: 13, fontWeight: '800' },
  summaryKey:    { color: colors.textMuted, fontSize: 8, letterSpacing: 1 },
  summaryDivider:{ width: 1, height: 32, backgroundColor: colors.border },
  findBtn:       { height: 60, borderRadius: 16, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  findBtnText:   { color: '#fff', fontSize: 14, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 1.5 },
  searchingBox:  { borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0,212,255,0.3)', padding: 28, alignItems: 'center', gap: 12, overflow: 'hidden' },
  searchingDots: { flexDirection: 'row', gap: 10 },
  searchDot:     { width: 12, height: 12, borderRadius: 6, backgroundColor: '#00d4ff' },
  searchingTier: { color: '#00d4ff', fontSize: 14, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 2 },
  searchingMsg:  { color: colors.text, fontSize: 13, fontFamily: 'Orbitron_400Regular', letterSpacing: 1 },
  cancelBtn:     { marginTop: 4, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  cancelText:    { color: colors.textMuted, fontSize: 11, letterSpacing: 1 },
  foundBox:      { borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0,212,255,0.5)', padding: 32, alignItems: 'center', gap: 10, overflow: 'hidden' },
  foundEmoji:    { fontSize: 44 },
  foundTitle:    { color: '#00d4ff', fontSize: 22, fontWeight: '900', fontFamily: 'Orbitron_900Black', letterSpacing: 2 },
  foundSub:      { color: colors.textMuted, fontSize: 12 },
  tableRow:      { borderRadius: 12, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, overflow: 'hidden' },
  dot:           { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  tableStakes:   { fontSize: 12, fontWeight: '800', fontFamily: 'Orbitron_700Bold' },
  tableBlinds:   { color: colors.textMuted, fontSize: 10 },
  tableRight:    { alignItems: 'flex-end', gap: 3 },
  tablePlayers:  { color: colors.text, fontSize: 11, fontWeight: '700' },
  tableWait:     { color: colors.textDim, fontSize: 10 },
  joinBtn:       { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  joinText:      { color: '#050010', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
});
