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
import { formatChips } from '@/utils/chipColor';

// ─── Prize config ──────────────────────────────────────────────────────────────
const PRIZES = [5_000, 10_000, 25_000, 50_000, 100_000, 250_000];
const PRIZE_LABELS = ['5K', '10K', '25K', '50K', '100K', '250K'];

interface ScratchCell {
  value: number;
  label: string;
  revealed: boolean;
}

function buildTicket(): { cells: ScratchCell[]; win: boolean; prize: number } {
  const win = Math.random() < 0.35;
  const cells: ScratchCell[] = [];
  let prize = 0;

  if (win) {
    // 3 matching cells in a random prize tier
    const tier = Math.floor(Math.random() * PRIZES.length);
    prize = PRIZES[tier];
    // Place 3 matching + 6 decoys
    const matchPositions = new Set<number>();
    while (matchPositions.size < 3) matchPositions.add(Math.floor(Math.random() * 9));
    for (let i = 0; i < 9; i++) {
      if (matchPositions.has(i)) {
        cells.push({ value: prize, label: PRIZE_LABELS[tier], revealed: false });
      } else {
        // Pick a different value
        let decoyIdx = tier;
        while (decoyIdx === tier) decoyIdx = Math.floor(Math.random() * PRIZES.length);
        cells.push({ value: PRIZES[decoyIdx], label: PRIZE_LABELS[decoyIdx], revealed: false });
      }
    }
  } else {
    // Ensure no 3 match
    const counts: Record<number, number> = {};
    for (let i = 0; i < 9; i++) {
      let tier = Math.floor(Math.random() * PRIZES.length);
      let attempts = 0;
      while ((counts[tier] ?? 0) >= 2 && attempts < 20) {
        tier = Math.floor(Math.random() * PRIZES.length);
        attempts++;
      }
      counts[tier] = (counts[tier] ?? 0) + 1;
      cells.push({ value: PRIZES[tier], label: PRIZE_LABELS[tier], revealed: false });
    }
  }

  // Count winners
  const valueCounts: Record<number, number> = {};
  cells.forEach(c => { valueCounts[c.value] = (valueCounts[c.value] ?? 0) + 1; });
  const actualWin = Object.entries(valueCounts).some(([, count]) => count >= 3);
  if (actualWin) {
    const winValue = Number(Object.entries(valueCounts).find(([, c]) => c >= 3)?.[0] ?? 0);
    prize = winValue;
  }

  return { cells, win: actualWin, prize };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ScratchScreen() {
  const insets = useSafeAreaInsets();
  const { profile, useScratchTicket, addChips } = useUser();

  const [ticket] = useState(() => buildTicket());
  const [cells, setCells] = useState<ScratchCell[]>(ticket.cells.map(c => ({ ...c })));
  const [gridLayout, setGridLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const resultScale = useRef(new Animated.Value(0)).current;

  // Per-cell animated opacities for the silver overlay
  const overlayAnims = useRef(Array.from({ length: 9 }, () => new Animated.Value(1))).current;

  const revealedCount = cells.filter(c => c.revealed).length;
  const allRevealed = revealedCount === 9;

  // Check for done when enough revealed
  useEffect(() => {
    if (allRevealed && !done) {
      setDone(true);
    }
  }, [allRevealed, done]);

  useEffect(() => {
    if (done && !claimed) {
      Animated.spring(resultScale, { toValue: 1, tension: 50, friction: 8, useNativeDriver: false }).start();
    }
  }, [done, claimed]);

  const revealCell = useCallback((index: number) => {
    setCells(prev => {
      if (prev[index].revealed) return prev;
      const next = [...prev];
      next[index] = { ...next[index], revealed: true };
      Animated.timing(overlayAnims[index], {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }).start();
      return next;
    });
  }, [overlayAnims]);

  const getCellFromTouch = useCallback((evt: GestureResponderEvent) => {
    if (gridLayout.width === 0) return -1;
    const { locationX, locationY } = evt.nativeEvent;
    const cellW = gridLayout.width / 3;
    const cellH = (gridLayout.height || gridLayout.width) / 3;
    const col = Math.floor(locationX / cellW);
    const row = Math.floor(locationY / cellH);
    if (col < 0 || col > 2 || row < 0 || row > 2) return -1;
    return row * 3 + col;
  }, [gridLayout]);

  const handleTouch = (evt: GestureResponderEvent) => {
    if (done) return;
    if (!started) setStarted(true);
    const idx = getCellFromTouch(evt);
    if (idx >= 0) revealCell(idx);
  };

  const revealAll = () => {
    cells.forEach((_, i) => revealCell(i));
  };

  const handleClaim = async () => {
    if (claimed) return;
    const ok = await useScratchTicket();
    if (ok && ticket.win && ticket.prize > 0) {
      addChips(ticket.prize);
    }
    setClaimed(true);
  };

  // Count matching cells for highlight
  const valueCounts: Record<string, number> = {};
  cells.forEach(c => { valueCounts[c.label] = (valueCounts[c.label] ?? 0) + 1; });
  const winLabel = ticket.win
    ? Object.entries(valueCounts).find(([, count]) => count >= 3)?.[0]
    : null;

  const CELL_COLORS = ['#00d4ff', '#0099ee', '#bf5fff', '#00ccaa', '#ffd700', '#ff8800'];

  return (
    <View style={sc.container}>
      <LinearGradient colors={['#0a1020', '#050010', '#100010']} style={StyleSheet.absoluteFill} />
      <View style={sc.glowBlue} />
      <View style={sc.glowPink} />

      {/* Header */}
      <View style={[sc.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 20 : 16) }]}>
        <TouchableOpacity onPress={() => router.back()} style={sc.closeBtn} activeOpacity={0.7}>
          <Ionicons name="close" size={22} color={colors.textMuted} />
        </TouchableOpacity>
        <Text style={sc.title}>SCRATCH & WIN</Text>
        <View style={sc.ticketBadge}>
          <Ionicons name="ticket" size={13} color="#bf5fff" />
          <Text style={sc.ticketCount}>×{profile.scratchTickets}</Text>
        </View>
      </View>

      {/* Subtitle */}
      <Text style={sc.subtitle}>MATCH 3 SYMBOLS TO WIN</Text>

      {/* Jackpot banner */}
      <View style={sc.jackpotBanner}>
        <LinearGradient colors={['rgba(255,215,0,0.12)', 'transparent']} style={StyleSheet.absoluteFill} />
        <Text style={sc.jackpotLabel}>WIN UP TO</Text>
        <Text style={sc.jackpotAmount}>250K</Text>
        <Text style={sc.jackpotLabel}>CHIPS</Text>
      </View>

      {/* Scratch grid */}
      <View
        style={sc.scratchArea}
        onLayout={e => setGridLayout(e.nativeEvent.layout)}
        onStartShouldSetResponder={() => !done}
        onMoveShouldSetResponder={() => !done}
        onResponderGrant={handleTouch}
        onResponderMove={handleTouch}
      >
        <LinearGradient colors={['rgba(0,212,255,0.06)', 'transparent']} style={StyleSheet.absoluteFill} />
        {cells.map((cell, i) => {
          const colorIdx = PRIZES.indexOf(cell.value);
          const cellColor = CELL_COLORS[colorIdx] ?? '#00d4ff';
          const isWinCell = winLabel !== null && cell.label === winLabel;
          return (
            <View key={i} style={[sc.cell, isWinCell && cell.revealed && { borderColor: `${cellColor}88` }]}>
              {/* Prize value behind overlay */}
              <View style={sc.prizeBack}>
                <Text style={[sc.prizeValue, { color: cellColor }]}>{cell.label}</Text>
                <Text style={sc.prizeUnit}>chips</Text>
                {isWinCell && cell.revealed && <View style={[sc.winGlow, { backgroundColor: `${cellColor}20` }]} />}
              </View>
              {/* Silver overlay */}
              <Animated.View
                style={[
                  sc.overlay,
                  { opacity: overlayAnims[i] },
                ]}
                pointerEvents="none"
              >
                <LinearGradient
                  colors={['#8892aa', '#6a7388', '#9aa0b4', '#6a7388']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                />
                <Text style={sc.overlayIcon}>🃏</Text>
              </Animated.View>
            </View>
          );
        })}
      </View>

      {/* Scratch hint */}
      {!started && !done && (
        <Text style={sc.hint}>← Drag your finger to scratch →</Text>
      )}

      {/* Reveal all button */}
      {!done && started && revealedCount < 9 && (
        <TouchableOpacity style={sc.revealBtn} onPress={revealAll} activeOpacity={0.8}>
          <Text style={sc.revealBtnText}>REVEAL ALL</Text>
        </TouchableOpacity>
      )}

      {/* Result */}
      {done && (
        <Animated.View style={[sc.resultBox, {
          borderColor: ticket.win ? 'rgba(255,215,0,0.5)' : 'rgba(255,255,255,0.1)',
          transform: [{ scale: resultScale }],
        }]}>
          <LinearGradient
            colors={ticket.win ? ['rgba(255,215,0,0.15)', 'rgba(255,215,0,0.05)'] : ['rgba(255,255,255,0.04)', 'transparent']}
            style={StyleSheet.absoluteFill}
          />
          {ticket.win ? (
            <>
              <Text style={sc.winEmoji}>🎉</Text>
              <Text style={sc.winTitle}>YOU WON!</Text>
              <Text style={sc.winAmount}>+{formatChips(ticket.prize)} CHIPS</Text>
            </>
          ) : (
            <>
              <Text style={sc.loseEmoji}>😤</Text>
              <Text style={sc.loseTitle}>NO MATCH</Text>
              <Text style={sc.loseSub}>Better luck next time!</Text>
            </>
          )}
          {!claimed && (
            <TouchableOpacity style={[sc.claimBtn, { backgroundColor: ticket.win ? '#ffd700' : colors.primary }]} onPress={handleClaim} activeOpacity={0.85}>
              <Text style={[sc.claimBtnText, { color: '#050010' }]}>{ticket.win ? 'COLLECT WINNINGS' : 'CLOSE'}</Text>
            </TouchableOpacity>
          )}
          {claimed && (
            <View style={sc.claimedRow}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={sc.claimedText}>Added to your balance</Text>
            </View>
          )}
        </Animated.View>
      )}

      {profile.scratchTickets === 0 && !done && (
        <Text style={sc.noTickets}>No tickets remaining — get more from the store or daily wheel</Text>
      )}

      <View style={{ height: insets.bottom + 16 }} />
    </View>
  );
}

const sc = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050010', alignItems: 'center', paddingHorizontal: 16 },
  glowBlue: { position: 'absolute', top: -50, left: -50, width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(0,212,255,0.05)' },
  glowPink: { position: 'absolute', bottom: 40, right: -60, width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(255,0,144,0.04)' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingBottom: 4 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: colors.border },
  title: { color: colors.text, fontSize: 16, fontWeight: '900', fontFamily: 'Orbitron_900Black', letterSpacing: 2 },
  ticketBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(191,95,255,0.15)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(191,95,255,0.3)', paddingHorizontal: 8, paddingVertical: 4 },
  ticketCount: { color: '#bf5fff', fontSize: 12, fontWeight: '800' },
  subtitle: { color: colors.textDim, fontSize: 10, letterSpacing: 2, fontWeight: '700', fontFamily: 'Orbitron_400Regular', marginVertical: 8 },
  jackpotBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)', paddingHorizontal: 16, paddingVertical: 8, marginBottom: 16, overflow: 'hidden' },
  jackpotLabel: { color: colors.textDim, fontSize: 10, letterSpacing: 1 },
  jackpotAmount: { color: '#ffd700', fontSize: 22, fontWeight: '900', fontFamily: 'Orbitron_700Bold' },
  scratchArea: { width: '100%', aspectRatio: 1, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0,212,255,0.2)', flexDirection: 'row', flexWrap: 'wrap', overflow: 'hidden', marginBottom: 12 },
  cell: { width: '33.33%', height: '33.33%', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.08)', position: 'relative', alignItems: 'center', justifyContent: 'center' },
  prizeBack: { alignItems: 'center', justifyContent: 'center', gap: 1 },
  prizeValue: { fontSize: 18, fontWeight: '900', fontFamily: 'Orbitron_700Bold' },
  prizeUnit: { color: colors.textDim, fontSize: 8 },
  winGlow: { ...StyleSheet.absoluteFillObject, borderRadius: 4 },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  overlayIcon: { fontSize: 22 },
  hint: { color: colors.textDim, fontSize: 11, marginBottom: 8 },
  revealBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  revealBtnText: { color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  resultBox: { width: '100%', borderRadius: 18, borderWidth: 1.5, padding: 24, alignItems: 'center', gap: 8, overflow: 'hidden' },
  winEmoji: { fontSize: 44 },
  winTitle: { color: '#ffd700', fontSize: 22, fontWeight: '900', fontFamily: 'Orbitron_900Black', letterSpacing: 2 },
  winAmount: { color: '#ffd700', fontSize: 28, fontWeight: '900', fontFamily: 'Orbitron_700Bold' },
  loseEmoji: { fontSize: 40 },
  loseTitle: { color: colors.textMuted, fontSize: 18, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 1 },
  loseSub: { color: colors.textDim, fontSize: 12 },
  claimBtn: { borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, marginTop: 4 },
  claimBtnText: { fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  claimedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  claimedText: { color: colors.success, fontSize: 12 },
  noTickets: { color: colors.textDim, fontSize: 11, textAlign: 'center', marginTop: 8, paddingHorizontal: 20 },
});
