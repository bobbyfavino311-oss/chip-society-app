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

type Phase = 'idle' | 'searching' | 'found';

const SEARCH_MESSAGES = [
  'Scanning active tables…',
  'Checking seat availability…',
  'Balancing player skill levels…',
  'Assigning your seat…',
  'Match ready!',
];

const FAKE_TABLES = [
  { id: '1', stakes: 'Casual 100/200',  players: '3/5', waitMs: 8,  color: '#00d4ff' },
  { id: '2', stakes: 'Mid Stakes 500/1K', players: '4/5', waitMs: 3, color: '#ffd700' },
  { id: '3', stakes: 'Beginner 25/50',  players: '2/5', waitMs: 15, color: '#00d4aa' },
  { id: '4', stakes: 'High Roller 5K/10K', players: '3/5', waitMs: 22, color: '#ff8800' },
];

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
    <Animated.View style={[styles.dot, { backgroundColor: color, transform: [{ scale: pulse }] }]} />
  );
}

export default function QuickMatchScreen() {
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<Phase>('idle');
  const [msgIdx, setMsgIdx] = useState(0);
  const foundScale = useRef(new Animated.Value(0)).current;
  const searchDots = useRef(new Animated.Value(0)).current;

  const onlinePlayers = useMemo(() => {
    const m = Math.floor(Date.now() / 60_000);
    return 2400 + ((m * 17 + 347) % 800);
  }, []);
  const activeTables = useMemo(() => Math.floor(onlinePlayers / 7), [onlinePlayers]);

  useEffect(() => {
    if (phase !== 'searching') return;
    Animated.loop(
      Animated.timing(searchDots, { toValue: 3, duration: 900, useNativeDriver: true })
    ).start();
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
  const cancel = () => { setPhase('idle'); searchDots.setValue(0); };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#071830', '#050010', '#001020']} style={StyleSheet.absoluteFill} />
      <View style={styles.glowTop} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 20 : 16) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>QUICK MATCH</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            { label: 'PLAYERS ONLINE', value: onlinePlayers.toLocaleString(), color: '#00d4ff' },
            { label: 'ACTIVE TABLES', value: activeTables.toString(), color: '#00d4aa' },
            { label: 'AVG WAIT', value: '<10s', color: colors.success },
          ].map(s => (
            <View key={s.label} style={styles.statCard}>
              <LinearGradient colors={[`${s.color}18`, 'transparent']} style={StyleSheet.absoluteFill} />
              <Text style={[styles.statVal, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* FIND MATCH or SEARCHING or FOUND */}
        {phase === 'idle' && (
          <TouchableOpacity style={styles.findBtn} onPress={startSearch} activeOpacity={0.85}>
            <LinearGradient colors={['#00d4ff', '#0055cc']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
            <Ionicons name="flash" size={24} color="#fff" style={{ marginRight: 10 }} />
            <Text style={styles.findBtnText}>FIND MATCH</Text>
          </TouchableOpacity>
        )}

        {phase === 'searching' && (
          <View style={styles.searchingBox}>
            <LinearGradient colors={['rgba(0,212,255,0.08)', 'transparent']} style={StyleSheet.absoluteFill} />
            <View style={styles.searchingDots}>
              {[0, 1, 2].map(i => (
                <SearchDot key={i} delay={i * 200} />
              ))}
            </View>
            <Text style={styles.searchingMsg}>{SEARCH_MESSAGES[msgIdx]}</Text>
            <TouchableOpacity onPress={cancel} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        )}

        {phase === 'found' && (
          <Animated.View style={[styles.foundBox, { transform: [{ scale: foundScale }] }]}>
            <LinearGradient colors={['rgba(0,212,255,0.15)', 'rgba(0,212,255,0.05)']} style={StyleSheet.absoluteFill} />
            <Text style={styles.foundEmoji}>⚡</Text>
            <Text style={styles.foundTitle}>MATCH FOUND!</Text>
            <Text style={styles.foundSub}>Loading table…</Text>
          </Animated.View>
        )}

        {/* Active tables to browse */}
        {phase === 'idle' && (
          <>
            <Text style={styles.sectionLabel}>ACTIVE TABLES</Text>
            {FAKE_TABLES.map(t => (
              <TouchableOpacity key={t.id} style={[styles.tableRow, { borderColor: `${t.color}44` }]} onPress={startSearch} activeOpacity={0.8}>
                <LinearGradient colors={[`${t.color}10`, 'transparent']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                <PulseDot color={t.color} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[styles.tableStakes, { color: t.color }]}>{t.stakes}</Text>
                  <Text style={styles.tablePlayers}>{t.players} players</Text>
                </View>
                <View style={styles.tableRight}>
                  <Text style={styles.tableWait}>~{t.waitMs}s wait</Text>
                  <View style={[styles.joinBtn, { backgroundColor: t.color }]}>
                    <Text style={styles.joinText}>JOIN</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
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
  return <Animated.View style={[styles.searchDot, { opacity: anim }]} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050010' },
  glowTop: { position: 'absolute', top: -60, left: 60, width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(0,212,255,0.07)' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: 'rgba(0,212,255,0.1)', borderWidth: 1, borderColor: 'rgba(0,212,255,0.2)' },
  title: { color: colors.text, fontSize: 18, fontWeight: '900', fontFamily: 'Orbitron_900Black', letterSpacing: 2 },
  scroll: { paddingHorizontal: 16, gap: 14 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 12, alignItems: 'center', overflow: 'hidden' },
  statVal: { fontSize: 18, fontWeight: '900', fontFamily: 'Orbitron_700Bold' },
  statLabel: { color: colors.textDim, fontSize: 8, letterSpacing: 1, marginTop: 3 },
  findBtn: { height: 60, borderRadius: 16, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  findBtnText: { color: '#fff', fontSize: 17, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 2 },
  searchingBox: { borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0,212,255,0.3)', padding: 28, alignItems: 'center', gap: 14, overflow: 'hidden' },
  searchingDots: { flexDirection: 'row', gap: 10 },
  searchDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#00d4ff' },
  searchingMsg: { color: colors.text, fontSize: 14, fontFamily: 'Orbitron_400Regular', letterSpacing: 1 },
  cancelBtn: { marginTop: 4, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  cancelText: { color: colors.textMuted, fontSize: 11, letterSpacing: 1 },
  foundBox: { borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0,212,255,0.5)', padding: 32, alignItems: 'center', gap: 10, overflow: 'hidden' },
  foundEmoji: { fontSize: 44 },
  foundTitle: { color: '#00d4ff', fontSize: 22, fontWeight: '900', fontFamily: 'Orbitron_900Black', letterSpacing: 2 },
  foundSub: { color: colors.textMuted, fontSize: 12 },
  sectionLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 2, fontFamily: 'Orbitron_400Regular' },
  tableRow: { borderRadius: 12, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, overflow: 'hidden' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  tableStakes: { fontSize: 13, fontWeight: '700', fontFamily: 'Orbitron_700Bold' },
  tablePlayers: { color: colors.textMuted, fontSize: 11 },
  tableRight: { alignItems: 'flex-end', gap: 4 },
  tableWait: { color: colors.textDim, fontSize: 10 },
  joinBtn: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  joinText: { color: '#050010', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
});
