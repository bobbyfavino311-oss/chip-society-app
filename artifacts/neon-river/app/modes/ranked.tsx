import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { useUser, Rank } from '@/context/UserContext';

// RP thresholds per rank
const RANK_RP: Record<Rank, [number, number]> = {
  'Neon Bronze':   [0,     500],
  'Neon Silver':   [500,   1500],
  'Neon Gold':     [1500,  4000],
  'Neon Platinum': [4000,  10000],
  'Neon Diamond':  [10000, 25000],
  'Neon Elite':    [25000, 60000],
  'Neon Legend':   [60000, 60000],
};

const RANK_COLORS: Record<Rank, string> = {
  'Neon Bronze':   '#cd7f32',
  'Neon Silver':   '#a0a8c0',
  'Neon Gold':     '#ffd700',
  'Neon Platinum': '#a0f0ff',
  'Neon Diamond':  '#b8f0ff',
  'Neon Elite':    '#ff0090',
  'Neon Legend':   '#bf5fff',
};

const RANK_ICONS: Record<Rank, string> = {
  'Neon Bronze': '🥉', 'Neon Silver': '🥈', 'Neon Gold': '🥇',
  'Neon Platinum': '💎', 'Neon Diamond': '💠', 'Neon Elite': '⚡', 'Neon Legend': '👑',
};

type SearchPhase = 'idle' | 'searching' | 'found';

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

// Fake recent match history
function genHistory(wins: number, losses: number) {
  const results = [];
  const total = Math.min(5, wins + losses);
  let w = Math.min(wins, Math.ceil(total * 0.6));
  let l = total - w;
  while (results.length < total) {
    if (w > 0 && (l === 0 || Math.random() > 0.4)) {
      results.push({ result: 'WIN', rp: +30 });
      w--;
    } else {
      results.push({ result: 'LOSS', rp: -15 });
      l--;
    }
  }
  return results;
}

export default function RankedScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useUser();
  const [phase, setPhase] = useState<SearchPhase>('idle');
  const [msgIdx, setMsgIdx] = useState(0);
  const foundScale = useRef(new Animated.Value(0)).current;

  const rank = profile.rank;
  const rp = profile.rankedPoints;
  const rankColor = RANK_COLORS[rank];
  const [rpMin, rpMax] = RANK_RP[rank];
  const progress = rpMax > rpMin ? Math.min((rp - rpMin) / (rpMax - rpMin), 1) : 1;

  const history = useMemo(() => genHistory(profile.wins, profile.losses), [profile.wins, profile.losses]);

  const onlinePlayers = useMemo(() => {
    const m = Math.floor(Date.now() / 60_000);
    return 1800 + ((m * 13 + 211) % 600);
  }, []);

  const SEARCH_MSGS = ['Finding ranked opponents…', 'Matching skill levels…', 'Verifying rank eligibility…', 'Match ready!'];

  useEffect(() => {
    if (phase !== 'searching') return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    SEARCH_MSGS.forEach((_, i) => timers.push(setTimeout(() => setMsgIdx(i), i * 700)));
    timers.push(setTimeout(() => {
      setPhase('found');
      Animated.spring(foundScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }).start();
      setTimeout(() => router.replace('/game/practice'), 1400);
    }, 3200));
    return () => timers.forEach(clearTimeout);
  }, [phase]);

  return (
    <View style={s.container}>
      <LinearGradient colors={['#160820', '#050010', '#100020']} style={StyleSheet.absoluteFill} />
      <View style={[s.glowRank, { backgroundColor: `${rankColor}10` }]} />

      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 20 : 16) }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={rankColor} />
        </TouchableOpacity>
        <Text style={s.title}>RANKED</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>

        {/* Rank card */}
        <View style={[s.rankCard, { borderColor: `${rankColor}55` }]}>
          <LinearGradient colors={[`${rankColor}20`, `${rankColor}06`]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          <Text style={s.rankEmoji}>{RANK_ICONS[rank]}</Text>
          <Text style={[s.rankName, { color: rankColor }]}>{rank.toUpperCase()}</Text>
          <Text style={[s.rankRp, { color: rankColor }]}>{rp.toLocaleString()} RP</Text>
          {rank !== 'Neon Legend' && (
            <View style={s.rpBar}>
              <View style={[s.rpFill, { width: `${progress * 100}%` as any, backgroundColor: rankColor }]} />
            </View>
          )}
          {rank !== 'Neon Legend' && (
            <Text style={s.rpNext}>{rp}/{rpMax} RP to next rank</Text>
          )}
        </View>

        {/* RP gain/loss info */}
        <View style={s.rpInfoRow}>
          <View style={s.rpInfoCard}>
            <LinearGradient colors={['rgba(0,212,100,0.12)', 'transparent']} style={StyleSheet.absoluteFill} />
            <Ionicons name="arrow-up" size={16} color={colors.success} />
            <Text style={[s.rpInfoVal, { color: colors.success }]}>+30 RP</Text>
            <Text style={s.rpInfoLabel}>Per win</Text>
          </View>
          <View style={s.rpInfoCard}>
            <LinearGradient colors={['rgba(255,60,60,0.12)', 'transparent']} style={StyleSheet.absoluteFill} />
            <Ionicons name="arrow-down" size={16} color={colors.warning} />
            <Text style={[s.rpInfoVal, { color: colors.warning }]}>-15 RP</Text>
            <Text style={s.rpInfoLabel}>Per loss</Text>
          </View>
          <View style={s.rpInfoCard}>
            <LinearGradient colors={['rgba(0,212,255,0.1)', 'transparent']} style={StyleSheet.absoluteFill} />
            <Ionicons name="people" size={16} color={colors.primary} />
            <Text style={[s.rpInfoVal, { color: colors.primary }]}>{onlinePlayers.toLocaleString()}</Text>
            <Text style={s.rpInfoLabel}>Online now</Text>
          </View>
        </View>

        {/* Find match / searching / found */}
        {phase === 'idle' && (
          <TouchableOpacity style={[s.matchBtn, { borderColor: `${rankColor}55` }]} onPress={() => setPhase('searching')} activeOpacity={0.85}>
            <LinearGradient colors={[rankColor, `${rankColor}aa`]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
            <Ionicons name="trophy" size={22} color="#050010" style={{ marginRight: 10 }} />
            <Text style={s.matchBtnText}>FIND RANKED MATCH</Text>
          </TouchableOpacity>
        )}

        {phase === 'searching' && (
          <View style={[s.searchBox, { borderColor: `${rankColor}44` }]}>
            <LinearGradient colors={[`${rankColor}10`, 'transparent']} style={StyleSheet.absoluteFill} />
            <View style={s.searchDots}>
              {[0, 1, 2].map(i => <SearchDot key={i} delay={i * 200} />)}
            </View>
            <Text style={[s.searchMsg, { color: rankColor }]}>{SEARCH_MSGS[msgIdx]}</Text>
            <TouchableOpacity onPress={() => setPhase('idle')} style={s.cancelBtn}>
              <Text style={s.cancelText}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        )}

        {phase === 'found' && (
          <Animated.View style={[s.foundBox, { borderColor: `${rankColor}66`, transform: [{ scale: foundScale }] }]}>
            <LinearGradient colors={[`${rankColor}20`, `${rankColor}06`]} style={StyleSheet.absoluteFill} />
            <Text style={s.foundEmoji}>{RANK_ICONS[rank]}</Text>
            <Text style={[s.foundTitle, { color: rankColor }]}>MATCH FOUND!</Text>
            <Text style={s.foundSub}>Loading ranked table…</Text>
          </Animated.View>
        )}

        {/* Recent match history */}
        {history.length > 0 && (
          <>
            <Text style={s.sectionLabel}>RECENT MATCHES</Text>
            <View style={s.historyList}>
              {history.map((h, i) => (
                <View key={i} style={[s.historyRow, { borderColor: h.result === 'WIN' ? 'rgba(0,212,100,0.25)' : 'rgba(255,60,60,0.2)' }]}>
                  <LinearGradient
                    colors={h.result === 'WIN' ? ['rgba(0,212,100,0.08)', 'transparent'] : ['rgba(255,60,60,0.06)', 'transparent']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  />
                  <View style={[s.historyBadge, { backgroundColor: h.result === 'WIN' ? colors.success : colors.warning }]}>
                    <Text style={s.historyBadgeText}>{h.result}</Text>
                  </View>
                  <Text style={s.historyGame}>Texas Hold'em · AI Practice</Text>
                  <Text style={[s.historyRp, { color: h.result === 'WIN' ? colors.success : colors.warning }]}>
                    {h.rp > 0 ? '+' : ''}{h.rp} RP
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* All ranks ladder */}
        <Text style={s.sectionLabel}>RANK LADDER</Text>
        <View style={s.ladder}>
          {(Object.keys(RANK_COLORS) as Rank[]).map((r, i) => {
            const isActive = r === rank;
            const rc = RANK_COLORS[r];
            return (
              <View key={r} style={[s.ladderRow, isActive && { borderColor: `${rc}66` }]}>
                {isActive && <LinearGradient colors={[`${rc}18`, 'transparent']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />}
                <Text style={s.ladderIdx}>{i + 1}</Text>
                <Text style={s.ladderEmoji}>{RANK_ICONS[r]}</Text>
                <Text style={[s.ladderName, { color: isActive ? rc : colors.textMuted }]}>{r}</Text>
                {isActive && <View style={[s.activePip, { backgroundColor: rc }]} />}
                <Text style={[s.ladderRp, { color: isActive ? rc : colors.textDim }]}>{RANK_RP[r][0].toLocaleString()}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050010' },
  glowRank: { position: 'absolute', top: -40, right: -60, width: 300, height: 300, borderRadius: 150 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: colors.border },
  title: { color: colors.text, fontSize: 18, fontWeight: '900', fontFamily: 'Orbitron_900Black', letterSpacing: 2 },
  scroll: { paddingHorizontal: 16, gap: 14 },
  rankCard: { borderRadius: 20, borderWidth: 1.5, padding: 28, alignItems: 'center', gap: 6, overflow: 'hidden' },
  rankEmoji: { fontSize: 52 },
  rankName: { fontSize: 20, fontWeight: '900', fontFamily: 'Orbitron_900Black', letterSpacing: 2, marginTop: 4 },
  rankRp: { fontSize: 28, fontWeight: '900', fontFamily: 'Orbitron_700Bold' },
  rpBar: { width: '80%', height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden', marginTop: 6 },
  rpFill: { height: '100%', borderRadius: 3 },
  rpNext: { color: colors.textDim, fontSize: 11, marginTop: 2 },
  rpInfoRow: { flexDirection: 'row', gap: 10 },
  rpInfoCard: { flex: 1, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 14, alignItems: 'center', gap: 4, overflow: 'hidden' },
  rpInfoVal: { fontSize: 16, fontWeight: '900', fontFamily: 'Orbitron_700Bold' },
  rpInfoLabel: { color: colors.textDim, fontSize: 9, letterSpacing: 1 },
  matchBtn: { height: 60, borderRadius: 16, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  matchBtnText: { color: '#050010', fontSize: 16, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 2 },
  searchBox: { borderRadius: 16, borderWidth: 1, padding: 28, alignItems: 'center', gap: 14, overflow: 'hidden' },
  searchDots: { flexDirection: 'row', gap: 10 },
  searchDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#bf5fff' },
  searchMsg: { fontSize: 13, fontFamily: 'Orbitron_400Regular', letterSpacing: 0.5 },
  cancelBtn: { marginTop: 4, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  cancelText: { color: colors.textMuted, fontSize: 11, letterSpacing: 1 },
  foundBox: { borderRadius: 16, borderWidth: 1, padding: 32, alignItems: 'center', gap: 10, overflow: 'hidden' },
  foundEmoji: { fontSize: 44 },
  foundTitle: { fontSize: 22, fontWeight: '900', fontFamily: 'Orbitron_900Black', letterSpacing: 2 },
  foundSub: { color: colors.textMuted, fontSize: 12 },
  sectionLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 2, fontFamily: 'Orbitron_400Regular' },
  historyList: { gap: 8 },
  historyRow: { borderRadius: 10, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, overflow: 'hidden' },
  historyBadge: { borderRadius: 5, paddingHorizontal: 8, paddingVertical: 3 },
  historyBadgeText: { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  historyGame: { color: colors.textMuted, fontSize: 11, flex: 1 },
  historyRp: { fontSize: 13, fontWeight: '700' },
  ladder: { gap: 6 },
  ladderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: 'transparent', overflow: 'hidden' },
  ladderIdx: { color: colors.textDim, fontSize: 11, width: 14, textAlign: 'center' },
  ladderEmoji: { fontSize: 18 },
  ladderName: { flex: 1, fontSize: 12, fontWeight: '700' },
  activePip: { width: 6, height: 6, borderRadius: 3 },
  ladderRp: { fontSize: 11 },
});
