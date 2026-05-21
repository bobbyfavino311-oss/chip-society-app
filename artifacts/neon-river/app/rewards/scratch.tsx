import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  Animated,
  GestureResponderEvent,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/colors';
import { useUser } from '@/context/UserContext';
import { SoundEngine } from '@/lib/soundEngine';
import { formatChips } from '@/utils/chipColor';

// ─── Prize config — balanced economy ──────────────────────────────────────────
const PRIZES    = [1_000, 2_000, 5_000, 10_000, 25_000, 50_000];
const PRIZE_LBL = ['1K', '2K', '5K', '10K', '25K', '50K'];
const PRIZE_COLORS = ['#00d4ff', '#0099ee', '#bf5fff', '#00ccaa', '#ffd700', '#ff0090'];

interface ScratchCell { value: number; label: string; colorIdx: number; revealed: boolean; }

function buildTicket(): { cells: ScratchCell[]; prize: number } {
  const win = Math.random() < 0.35;
  const cells: ScratchCell[] = [];
  let prize = 0;

  if (win) {
    const tier = Math.floor(Math.random() * PRIZES.length);
    prize = PRIZES[tier];
    const matchPos = new Set<number>();
    while (matchPos.size < 3) matchPos.add(Math.floor(Math.random() * 9));
    for (let i = 0; i < 9; i++) {
      if (matchPos.has(i)) {
        cells.push({ value: prize, label: PRIZE_LBL[tier], colorIdx: tier, revealed: false });
      } else {
        let d = tier;
        while (d === tier) d = Math.floor(Math.random() * PRIZES.length);
        cells.push({ value: PRIZES[d], label: PRIZE_LBL[d], colorIdx: d, revealed: false });
      }
    }
  } else {
    // Guarantee no 3 match
    const counts: Record<number, number> = {};
    for (let i = 0; i < 9; i++) {
      let t = Math.floor(Math.random() * PRIZES.length);
      let att = 0;
      while ((counts[t] ?? 0) >= 2 && att < 20) { t = Math.floor(Math.random() * PRIZES.length); att++; }
      counts[t] = (counts[t] ?? 0) + 1;
      cells.push({ value: PRIZES[t], label: PRIZE_LBL[t], colorIdx: t, revealed: false });
    }
  }

  // Determine actual prize
  const vc: Record<number, number> = {};
  cells.forEach(c => { vc[c.value] = (vc[c.value] ?? 0) + 1; });
  const winEntry = Object.entries(vc).find(([, cnt]) => cnt >= 3);
  prize = winEntry ? Number(winEntry[0]) : 0;

  return { cells, prize };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ScratchScreen() {
  const insets = useSafeAreaInsets();
  const { profile, useScratchTicket, addChips } = useUser();

  const [ticket]     = useState(() => buildTicket());
  const [cells, setCells] = useState<ScratchCell[]>(ticket.cells.map(c => ({ ...c })));
  const [gridLayout, setGridLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [started, setStarted] = useState(false);
  const [done, setDone]       = useState(false);
  const [claimed, setClaimed] = useState(false);

  const overlayAnims = useRef(Array.from({ length: 9 }, () => new Animated.Value(1))).current;
  const resultScale  = useRef(new Animated.Value(0)).current;
  const lastRevealedRef = useRef<Set<number>>(new Set());

  const won  = ticket.prize > 0;
  const revealedCount = cells.filter(c => c.revealed).length;
  const allRevealed   = revealedCount === 9;

  useEffect(() => {
    if (allRevealed && !done) setDone(true);
  }, [allRevealed, done]);

  useEffect(() => {
    if (done && !claimed) {
      Animated.spring(resultScale, { toValue: 1, tension: 50, friction: 8, useNativeDriver: false }).start();
    }
  }, [done, claimed, resultScale]);

  const revealCell = useCallback((index: number) => {
    if (lastRevealedRef.current.has(index)) return;
    lastRevealedRef.current.add(index);

    setCells(prev => {
      if (prev[index].revealed) return prev;
      const next = [...prev];
      next[index] = { ...next[index], revealed: true };
      return next;
    });

    Animated.timing(overlayAnims[index], {
      toValue: 0, duration: 200, useNativeDriver: false,
    }).start();

    SoundEngine.chip();
  }, [overlayAnims]);

  const getCellIdx = useCallback((evt: GestureResponderEvent) => {
    if (gridLayout.width === 0) return -1;
    const { locationX, locationY } = evt.nativeEvent;
    const cw = gridLayout.width / 3;
    const ch = (gridLayout.height || gridLayout.width) / 3;
    const col = Math.floor(locationX / cw);
    const row = Math.floor(locationY / ch);
    if (col < 0 || col > 2 || row < 0 || row > 2) return -1;
    return row * 3 + col;
  }, [gridLayout]);

  const handleTouch = useCallback((evt: GestureResponderEvent) => {
    if (done) return;
    if (!started) setStarted(true);
    const idx = getCellIdx(evt);
    if (idx >= 0) revealCell(idx);
  }, [done, started, getCellIdx, revealCell]);

  const revealAll = () => {
    cells.forEach((_, i) => revealCell(i));
  };

  const handleClaim = async () => {
    if (claimed) return;
    setClaimed(true);
    if (won && ticket.prize > 0) {
      await addChips(ticket.prize);
      SoundEngine.chipCollect();
    }
    await useScratchTicket();
  };

  // Find winning label
  const vc: Record<string, number> = {};
  cells.forEach(c => { vc[c.label] = (vc[c.label] ?? 0) + 1; });
  const winLabel = won ? Object.entries(vc).find(([, cnt]) => cnt >= 3)?.[0] : null;

  const hasTickets = profile.scratchTickets > 0;

  return (
    <View style={sc.container}>
      <LinearGradient colors={['#080018', '#050010', '#0c0010']} style={StyleSheet.absoluteFill} />
      <View style={sc.glowBlue} />
      <View style={sc.glowPink} />

      {/* Header */}
      <View style={[sc.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 20 : 16) }]}>
        <TouchableOpacity onPress={() => router.back()} style={sc.closeBtn} activeOpacity={0.7}>
          <Ionicons name="close" size={22} color={colors.textMuted} />
        </TouchableOpacity>
        <Text style={sc.title}>SCRATCH & WIN</Text>
        <View style={sc.ticketBadge}>
          <Text style={sc.ticketIcon}>🎴</Text>
          <Text style={sc.ticketCount}>×{profile.scratchTickets}</Text>
        </View>
      </View>

      <Text style={sc.subtitle}>MATCH 3 TO WIN</Text>

      {/* Jackpot banner */}
      <View style={sc.jackpotBanner}>
        <LinearGradient colors={['rgba(255,215,0,0.1)', 'transparent']} style={StyleSheet.absoluteFill} />
        <Text style={sc.jackpotLabel}>WIN UP TO</Text>
        <Text style={sc.jackpotAmt}>50K</Text>
        <Text style={sc.jackpotLabel}>CHIPS</Text>
      </View>

      {/* Scratch grid */}
      <View
        style={sc.scratchArea}
        onLayout={e => setGridLayout(e.nativeEvent.layout)}
        onStartShouldSetResponder={() => !done && hasTickets}
        onMoveShouldSetResponder={()  => !done && hasTickets}
        onResponderGrant={handleTouch}
        onResponderMove={handleTouch}
      >
        {/* Grid neon border glow */}
        <LinearGradient
          colors={['rgba(0,212,255,0.04)', 'rgba(191,95,255,0.04)']}
          style={StyleSheet.absoluteFill}
        />
        {cells.map((cell, i) => {
          const cellColor = PRIZE_COLORS[cell.colorIdx] ?? '#00d4ff';
          const isWinCell = winLabel !== null && cell.label === winLabel;
          return (
            <View key={i} style={[
              sc.cell,
              isWinCell && cell.revealed && { borderColor: `${cellColor}66`, backgroundColor: `${cellColor}08` },
            ]}>
              {/* Prize value underneath */}
              <View style={sc.prizeBack}>
                <Text style={[sc.prizeValue, { color: cellColor }]}>{cell.label}</Text>
                <Text style={sc.prizeUnit}>chips</Text>
              </View>
              {/* Silver scratch overlay */}
              <Animated.View style={[sc.overlay, { opacity: overlayAnims[i] }]} pointerEvents="none">
                <LinearGradient
                  colors={['#6a7090', '#8890aa', '#9aa0b8', '#7a8098', '#6a7090']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                />
                {/* Holographic shimmer lines */}
                <LinearGradient
                  colors={['transparent', 'rgba(255,255,255,0.12)', 'transparent']}
                  style={[StyleSheet.absoluteFill, { transform: [{ rotate: '45deg' }] }]}
                />
                <Text style={sc.overlaySymbol}>🎴</Text>
              </Animated.View>
            </View>
          );
        })}
      </View>

      {/* Hint / progress */}
      {!started && !done && hasTickets && (
        <Text style={sc.hint}>← Drag to scratch →</Text>
      )}
      {started && !done && (
        <View style={sc.progressRow}>
          <View style={sc.progressBar}>
            <View style={[sc.progressFill, { width: `${(revealedCount / 9) * 100}%` }]} />
          </View>
          <TouchableOpacity style={sc.revealAllBtn} onPress={revealAll}>
            <Text style={sc.revealAllText}>REVEAL ALL</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* No tickets */}
      {!hasTickets && !done && (
        <Text style={sc.noTickets}>No tickets — earn them from the daily wheel</Text>
      )}

      {/* Result panel */}
      {done && (
        <Animated.View style={[
          sc.resultBox,
          { borderColor: won ? 'rgba(255,215,0,0.5)' : 'rgba(255,255,255,0.1)', transform: [{ scale: resultScale }] },
        ]}>
          <LinearGradient
            colors={won ? ['rgba(255,215,0,0.14)', 'rgba(255,215,0,0.04)'] : ['rgba(255,255,255,0.04)', 'transparent']}
            style={StyleSheet.absoluteFill}
          />
          {won ? (
            <>
              <Text style={sc.winEmoji}>🎉</Text>
              <Text style={sc.winTitle}>YOU WON!</Text>
              <Text style={sc.winAmt}>+{formatChips(ticket.prize)} CHIPS</Text>
            </>
          ) : (
            <>
              <Text style={sc.loseEmoji}>😤</Text>
              <Text style={sc.loseTitle}>NO MATCH</Text>
              <Text style={sc.loseSub}>Better luck next time!</Text>
            </>
          )}
          {!claimed ? (
            <TouchableOpacity
              style={[sc.claimBtn, { backgroundColor: won ? '#ffd700' : 'rgba(255,255,255,0.1)' }]}
              onPress={handleClaim} activeOpacity={0.85}
            >
              <Text style={[sc.claimText, { color: won ? '#050010' : colors.textMuted }]}>
                {won ? 'COLLECT WINNINGS' : 'CLOSE'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={sc.claimedRow}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={sc.claimedText}>
                {won ? `+${formatChips(ticket.prize)} added` : 'Ticket used'}
              </Text>
            </View>
          )}
        </Animated.View>
      )}

      <View style={{ height: insets.bottom + 16 }} />
    </View>
  );
}

const sc = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050010', alignItems: 'center', paddingHorizontal: 16 },
  glowBlue: { position: 'absolute', top: -40, left: -40, width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(0,212,255,0.04)' },
  glowPink: { position: 'absolute', bottom: 60, right: -50, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,0,144,0.04)' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingBottom: 4 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: colors.border },
  title: { color: colors.text, fontSize: 16, fontWeight: '900', fontFamily: 'Orbitron_900Black', letterSpacing: 2 },
  ticketBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(191,95,255,0.12)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(191,95,255,0.3)', paddingHorizontal: 10, paddingVertical: 5 },
  ticketIcon: { fontSize: 13 },
  ticketCount: { color: '#bf5fff', fontSize: 13, fontWeight: '800', fontFamily: 'Orbitron_700Bold' },
  subtitle: { color: colors.textDim, fontSize: 10, letterSpacing: 2.5, fontWeight: '700', fontFamily: 'Orbitron_400Regular', marginVertical: 6 },
  jackpotBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,215,0,0.25)', paddingHorizontal: 18, paddingVertical: 8, marginBottom: 14, overflow: 'hidden' },
  jackpotLabel: { color: colors.textDim, fontSize: 10, letterSpacing: 1 },
  jackpotAmt: { color: '#ffd700', fontSize: 22, fontWeight: '900', fontFamily: 'Orbitron_700Bold' },
  scratchArea: { width: '100%', aspectRatio: 1, borderRadius: 16, borderWidth: 1.5, borderColor: 'rgba(0,212,255,0.15)', flexDirection: 'row', flexWrap: 'wrap', overflow: 'hidden', marginBottom: 12 },
  cell: { width: '33.33%', height: '33.33%', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.07)', position: 'relative', alignItems: 'center', justifyContent: 'center' },
  prizeBack: { alignItems: 'center', justifyContent: 'center', gap: 2 },
  prizeValue: { fontSize: 20, fontWeight: '900', fontFamily: 'Orbitron_700Bold' },
  prizeUnit: { color: colors.textDim, fontSize: 8, letterSpacing: 0.5 },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  overlaySymbol: { fontSize: 26 },
  hint: { color: colors.textDim, fontSize: 11, marginBottom: 8, letterSpacing: 0.5 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%', marginBottom: 10 },
  progressBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2, backgroundColor: '#00d4ff' },
  revealAllBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  revealAllText: { color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  noTickets: { color: colors.textDim, fontSize: 11, textAlign: 'center', marginTop: 8 },
  resultBox: { width: '100%', borderRadius: 18, borderWidth: 1.5, padding: 24, alignItems: 'center', gap: 8, overflow: 'hidden' },
  winEmoji: { fontSize: 44 },
  winTitle: { color: '#ffd700', fontSize: 22, fontWeight: '900', fontFamily: 'Orbitron_900Black', letterSpacing: 2 },
  winAmt: { color: '#ffd700', fontSize: 26, fontWeight: '900', fontFamily: 'Orbitron_700Bold' },
  loseEmoji: { fontSize: 40 },
  loseTitle: { color: colors.textMuted, fontSize: 18, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 1 },
  loseSub: { color: colors.textDim, fontSize: 12 },
  claimBtn: { borderRadius: 12, paddingHorizontal: 28, paddingVertical: 13, marginTop: 4 },
  claimText: { fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  claimedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  claimedText: { color: colors.success, fontSize: 12, fontFamily: 'Orbitron_400Regular' },
});
