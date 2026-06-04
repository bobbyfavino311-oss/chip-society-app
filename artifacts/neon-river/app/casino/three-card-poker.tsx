import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useState, useCallback } from 'react';
import {
  Platform, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import PlayingCard from '@/components/PlayingCard';
import { useCasino } from '@/context/CasinoContext';
import { useUser } from '@/context/UserContext';
import colors from '@/constants/colors';
import {
  createTCPDeck, shuffleTCPDeck, evaluateThreeCardHand,
  tcpDealerQualifies, compareThreeCardHands,
  getPairPlusMultiplier, getAnteBonusMultiplier,
  type ThreeCardEval,
} from '@/lib/threeCardPoker';
import type { Card } from '@/lib/pokerEngine';

// ─── Types ────────────────────────────────────────────────────────────────────
type Phase = 'betting' | 'action' | 'result';

interface TCPResult {
  playerEval:       ThreeCardEval;
  dealerEval:       ThreeCardEval;
  qualified:        boolean;
  comparison:       'player' | 'dealer' | 'tie' | 'fold';
  pairPlusReturn:   number;
  anteBonusReturn:  number;
  mainReturn:       number;
  totalReturn:      number;
  netDelta:         number;
  cappedBy:         number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const BET_OPTIONS = [100, 500, 1_000, 2_500, 5_000, 10_000];

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}
function fmtSigned(n: number): string {
  if (n === 0) return '—';
  return (n > 0 ? '+' : '') + fmt(n);
}

// ─── Betting circle ───────────────────────────────────────────────────────────
function BetCircle({ label, amount, active }: { label: string; amount: number; active: boolean }) {
  return (
    <View style={[bc.wrap, active && bc.wrapActive]}>
      {active && (
        <LinearGradient colors={['rgba(255,215,0,0.22)', 'transparent']} style={StyleSheet.absoluteFill} />
      )}
      <Text style={bc.label}>{label}</Text>
      <Text style={[bc.amount, active && bc.amountActive]}>{amount > 0 ? fmt(amount) : '—'}</Text>
    </View>
  );
}
const bc = StyleSheet.create({
  wrap: {
    width: 84, height: 84, borderRadius: 42,
    borderWidth: 2, borderColor: 'rgba(255,215,0,0.25)',
    alignItems: 'center', justifyContent: 'center', gap: 2,
    overflow: 'hidden',
  },
  wrapActive: { borderColor: '#ffd700' },
  label:  { fontSize: 8, fontWeight: '800', fontFamily: 'Orbitron_700Bold', letterSpacing: 1, color: 'rgba(255,215,0,0.55)' },
  amount: { fontSize: 14, fontWeight: '900', fontFamily: 'Orbitron_900Black', color: 'rgba(255,215,0,0.45)' },
  amountActive: { color: '#ffd700' },
});

// ─── Chip selector ────────────────────────────────────────────────────────────
function ChipBtn({ value, selected, onPress, disabled }: { value: number; selected: boolean; onPress: () => void; disabled?: boolean }) {
  return (
    <TouchableOpacity
      style={[ch.btn, selected && ch.selected, disabled && { opacity: 0.35 }]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.75}
    >
      {selected && <LinearGradient colors={['#ffd700', '#c89b00']} style={StyleSheet.absoluteFill} />}
      <Text style={[ch.text, selected && ch.textSel]}>{fmt(value)}</Text>
    </TouchableOpacity>
  );
}
const ch = StyleSheet.create({
  btn:     { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)', overflow: 'hidden' },
  selected:{ borderColor: '#ffd700' },
  text:    { fontSize: 11, fontWeight: '800', fontFamily: 'Orbitron_700Bold', color: 'rgba(255,215,0,0.7)' },
  textSel: { color: '#000' },
});

// ─── Result breakdown ─────────────────────────────────────────────────────────
function ResultBreakdown({ result, anteBet, pairPlusBet }: { result: TCPResult; anteBet: number; pairPlusBet: number }) {
  const win = result.netDelta > 0;
  const lose = result.netDelta < 0;
  const netColor = win ? '#00ff88' : lose ? '#ff5555' : '#aaa';

  const dealerStr = result.comparison === 'fold'
    ? 'PLAYER FOLDED'
    : result.qualified ? 'DEALER QUALIFIES' : 'DEALER DOES NOT QUALIFY';

  return (
    <View style={rb.wrap}>
      <LinearGradient colors={['rgba(0,0,0,0.8)', 'rgba(10,0,25,0.9)']} style={StyleSheet.absoluteFill} />
      <Text style={rb.dealerStatus}>{dealerStr}</Text>

      {result.comparison !== 'fold' && (
        <View style={rb.row}>
          <Text style={rb.rowLabel}>MAIN GAME</Text>
          <Text style={[rb.rowVal, { color: result.mainReturn > 0 ? '#00ff88' : '#ff5555' }]}>
            {result.mainReturn > 0
              ? `+${fmt(result.mainReturn - anteBet * 2)} WIN`
              : result.mainReturn > 0 ? 'PUSH' : 'LOSS'}
          </Text>
        </View>
      )}

      {pairPlusBet > 0 && (
        <View style={rb.row}>
          <Text style={rb.rowLabel}>PAIR PLUS</Text>
          <Text style={[rb.rowVal, { color: result.pairPlusReturn > pairPlusBet ? '#00ff88' : result.pairPlusReturn > 0 ? '#aaa' : '#ff5555' }]}>
            {result.pairPlusReturn > 0
              ? `+${fmt(result.pairPlusReturn - pairPlusBet)}`
              : `-${fmt(pairPlusBet)}`}
          </Text>
        </View>
      )}

      {result.anteBonusReturn > 0 && (
        <View style={rb.row}>
          <Text style={rb.rowLabel}>ANTE BONUS</Text>
          <Text style={[rb.rowVal, { color: '#ffd700' }]}>+{fmt(result.anteBonusReturn)}</Text>
        </View>
      )}

      <View style={[rb.row, rb.netRow]}>
        <Text style={[rb.rowLabel, { color: '#fff', fontSize: 11 }]}>NET</Text>
        <Text style={[rb.rowVal, { color: netColor, fontSize: 16 }]}>{fmtSigned(result.netDelta)}</Text>
      </View>

      {result.cappedBy > 0 && (
        <Text style={rb.capNote}>🏦 Daily cap: {fmt(result.cappedBy)} converted to XP</Text>
      )}
    </View>
  );
}
const rb = StyleSheet.create({
  wrap:        { borderRadius: 14, overflow: 'hidden', padding: 14, gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  dealerStatus:{ fontSize: 9, fontWeight: '700', fontFamily: 'Orbitron_700Bold', letterSpacing: 1.5, color: 'rgba(255,255,255,0.45)', textAlign: 'center' },
  row:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel:    { fontSize: 9, fontFamily: 'Orbitron_400Regular', letterSpacing: 1, color: 'rgba(255,255,255,0.4)' },
  rowVal:      { fontSize: 13, fontWeight: '900', fontFamily: 'Orbitron_900Black' },
  netRow:      { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', marginTop: 4, paddingTop: 8 },
  capNote:     { fontSize: 9, color: 'rgba(255,215,0,0.55)', textAlign: 'center' },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function ThreeCardPokerScreen() {
  const insets = useSafeAreaInsets();
  const { profile, addChips, removeChips } = useUser();
  const { dailyWins, dailyWinCap, remainingCap, recordCasinoWin } = useCasino();

  const [phase,          setPhase]          = useState<Phase>('betting');
  const [anteBet,        setAnteBet]        = useState(1_000);
  const [pairPlusOn,     setPairPlusOn]     = useState(false);
  const [playerCards,    setPlayerCards]    = useState<Card[]>([]);
  const [dealerCards,    setDealerCards]    = useState<Card[]>([]);
  const [dealerRevealed, setDealerRevealed] = useState(false);
  const [result,         setResult]         = useState<TCPResult | null>(null);
  const [lastAnte,       setLastAnte]       = useState(1_000);
  const [lastPairPlus,   setLastPairPlus]   = useState(false);
  const [busy,           setBusy]           = useState(false);

  const pairPlusBet    = pairPlusOn ? anteBet : 0;
  const totalDealCost  = anteBet + pairPlusBet;
  const canDeal        = anteBet >= 100 && profile.chips >= totalDealCost && !busy;
  const canPlay        = !busy && profile.chips >= anteBet;

  // ── Deal ──────────────────────────────────────────────────────────────────
  const handleDeal = useCallback(async () => {
    if (!canDeal) return;
    setBusy(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await removeChips(totalDealCost);
    const deck  = shuffleTCPDeck(createTCPDeck());
    const pCards: Card[] = [deck[0]!, deck[2]!, deck[4]!];
    const dCards: Card[] = [deck[1]!, deck[3]!, deck[5]!];
    setPlayerCards(pCards);
    setDealerCards(dCards);
    setDealerRevealed(false);
    setResult(null);
    setLastAnte(anteBet);
    setLastPairPlus(pairPlusOn);
    setPhase('action');
    setBusy(false);
  }, [canDeal, totalDealCost, anteBet, pairPlusOn, removeChips]);

  // ── Play ──────────────────────────────────────────────────────────────────
  const handlePlay = useCallback(async () => {
    if (!canPlay) return;
    setBusy(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await removeChips(anteBet); // play wager

    const pEval = evaluateThreeCardHand(playerCards);
    const dEval = evaluateThreeCardHand(dealerCards);
    const qual  = tcpDealerQualifies(dealerCards);
    const cmp   = compareThreeCardHands(pEval, dEval);

    // Pair Plus
    const ppMul = getPairPlusMultiplier(pEval.rank);
    const pairPlusReturn = pairPlusBet > 0
      ? (ppMul >= 0 ? pairPlusBet * (1 + ppMul) : 0)
      : 0;

    // Ante Bonus (regardless of dealer outcome)
    const abMul          = getAnteBonusMultiplier(pEval.rank);
    const anteBonusReturn = anteBet * abMul;

    // Main game
    let mainReturn = 0;
    if (!qual) {
      mainReturn = anteBet * 2 + anteBet; // ante wins 1:1, play pushes
    } else if (cmp === 'player') {
      mainReturn = anteBet * 2 + anteBet * 2; // both win 1:1
    } else if (cmp === 'tie') {
      mainReturn = anteBet + anteBet; // both push
    }
    // else dealer wins → mainReturn stays 0

    const totalReturn = pairPlusReturn + anteBonusReturn + mainReturn;
    // total paid = anteBet (deal) + pairPlusBet (deal) + anteBet (play) = 2*ante + pp
    const grossNetWin = totalReturn - (2 * anteBet + pairPlusBet);

    let chipsToAdd = totalReturn;
    let cappedBy   = 0;
    if (grossNetWin > 0) {
      const { chipsAwarded, xpOnly } = await recordCasinoWin(grossNetWin);
      cappedBy   = xpOnly;
      chipsToAdd = totalReturn - xpOnly; // reduce by capped portion
    }

    if (chipsToAdd > 0) await addChips(chipsToAdd);

    setResult({
      playerEval: pEval, dealerEval: dEval,
      qualified: qual, comparison: cmp,
      pairPlusReturn, anteBonusReturn, mainReturn,
      totalReturn: chipsToAdd,
      netDelta: chipsToAdd - (2 * anteBet + pairPlusBet),
      cappedBy,
    });
    setDealerRevealed(true);
    setPhase('result');
    if (grossNetWin > 0) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setBusy(false);
  }, [canPlay, anteBet, pairPlusBet, playerCards, dealerCards, addChips, removeChips, recordCasinoWin]);

  // ── Fold ──────────────────────────────────────────────────────────────────
  const handleFold = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const pEval  = evaluateThreeCardHand(playerCards);
    const dEval  = evaluateThreeCardHand(dealerCards);
    const ppMul  = getPairPlusMultiplier(pEval.rank);
    const pairPlusReturn = pairPlusBet > 0
      ? (ppMul >= 0 ? pairPlusBet * (1 + ppMul) : 0)
      : 0;

    let cappedBy = 0;
    let chipsToAdd = pairPlusReturn;
    if (pairPlusReturn > pairPlusBet && pairPlusBet > 0) {
      const ppWin = pairPlusReturn - pairPlusBet;
      const { xpOnly } = await recordCasinoWin(ppWin);
      cappedBy   = xpOnly;
      chipsToAdd = pairPlusReturn - xpOnly;
    }
    if (chipsToAdd > 0) await addChips(chipsToAdd);

    setResult({
      playerEval: pEval, dealerEval: dEval,
      qualified: false, comparison: 'fold',
      pairPlusReturn: chipsToAdd,
      anteBonusReturn: 0, mainReturn: 0,
      totalReturn: chipsToAdd,
      netDelta: chipsToAdd - (anteBet + pairPlusBet),
      cappedBy,
    });
    setDealerRevealed(true);
    setPhase('result');
    setBusy(false);
  }, [busy, anteBet, pairPlusBet, playerCards, dealerCards, addChips, recordCasinoWin]);

  // ── Rebet / New Game ──────────────────────────────────────────────────────
  const handleRebet = useCallback(() => {
    setAnteBet(lastAnte);
    setPairPlusOn(lastPairPlus);
    setPhase('betting');
    setResult(null);
  }, [lastAnte, lastPairPlus]);

  const handleNewGame = useCallback(() => {
    setPhase('betting');
    setResult(null);
    setPlayerCards([]);
    setDealerCards([]);
  }, []);

  // ── Daily cap bar ─────────────────────────────────────────────────────────
  const capPct = Math.min(1, dailyWins / dailyWinCap);

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={gs.container}>
      {/* Table felt — layered gradients for depth */}
      <LinearGradient
        colors={['#04001a', '#060020', '#020014']}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(0,180,255,0.06)', 'transparent', 'rgba(255,0,144,0.05)']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />

      {/* Header */}
      <View style={[gs.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 20 : 12) }]}>
        <TouchableOpacity style={gs.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
          <Text style={gs.backText}>CASINO</Text>
        </TouchableOpacity>
        <Text style={gs.tableTitle}>THREE CARD POKER</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView
        contentContainerStyle={[gs.scroll, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={phase === 'result'}
      >
        {/* ── DEALER AREA ─────────────────────────────────────────────── */}
        <View style={gs.dealerArea}>
          <Text style={gs.areaLabel}>DEALER</Text>
          <View style={gs.cardRow}>
            {dealerCards.length > 0 ? (
              dealerCards.map((c, i) => (
                <PlayingCard key={i} card={c} faceDown={!dealerRevealed} size="lg" animated />
              ))
            ) : (
              [0, 1, 2].map(i => <PlayingCard key={i} faceDown size="lg" />)
            )}
          </View>
          <Text style={gs.qualNote}>DEALER MUST HAVE QUEEN HIGH OR BETTER</Text>
          {dealerRevealed && result && result.comparison !== 'fold' && (
            <View style={[gs.qualBadge, result.qualified ? gs.qualYes : gs.qualNo]}>
              <Ionicons name={result.qualified ? 'checkmark-circle' : 'close-circle'} size={13} color={result.qualified ? '#00ff88' : '#ff5555'} />
              <Text style={[gs.qualBadgeText, { color: result.qualified ? '#00ff88' : '#ff5555' }]}>
                {result.qualified ? 'QUALIFIES' : 'NO QUALIFY'}
              </Text>
            </View>
          )}
        </View>

        {/* ── TABLE ───────────────────────────────────────────────────── */}
        <View style={gs.tableSection}>
          {/* Felt line */}
          <LinearGradient
            colors={['transparent', 'rgba(255,215,0,0.15)', 'transparent']}
            style={gs.feltLine}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          />

          {/* Betting circles */}
          <View style={gs.circleRow}>
            <BetCircle label="PAIR PLUS" amount={pairPlusBet} active={pairPlusOn} />
            <BetCircle label="ANTE"      amount={anteBet}     active={anteBet > 0} />
            <BetCircle label="PLAY"      amount={phase === 'action' ? anteBet : 0} active={phase === 'action'} />
          </View>

          <LinearGradient
            colors={['transparent', 'rgba(255,215,0,0.15)', 'transparent']}
            style={gs.feltLine}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          />
        </View>

        {/* ── PLAYER AREA ─────────────────────────────────────────────── */}
        <View style={gs.playerArea}>
          <View style={gs.cardRow}>
            {playerCards.length > 0 ? (
              playerCards.map((c, i) => (
                <PlayingCard
                  key={i} card={c} faceDown={false} size="lg" animated
                  highlighted={result?.comparison === 'player' || result?.comparison === 'tie'}
                />
              ))
            ) : (
              [0, 1, 2].map(i => <PlayingCard key={i} faceDown size="lg" />)
            )}
          </View>
          {playerCards.length > 0 && (
            <Text style={gs.handLabel}>
              {evaluateThreeCardHand(playerCards).label}
            </Text>
          )}

          {/* Result breakdown */}
          {phase === 'result' && result && (
            <ResultBreakdown result={result} anteBet={lastAnte} pairPlusBet={lastPairPlus ? lastAnte : 0} />
          )}

          {/* Daily cap bar */}
          <View style={gs.capBar}>
            <Text style={gs.capBarLabel}>TODAY  {fmt(dailyWins)} / {fmt(dailyWinCap)}</Text>
            <View style={gs.capBarTrack}>
              <View style={[gs.capBarFill, { width: `${Math.round(capPct * 100)}%` as any }]} />
            </View>
          </View>
        </View>

        {/* ── BETTING CONTROLS ─────────────────────────────────────────── */}
        {phase === 'betting' && (
          <View style={gs.controls}>
            <Text style={gs.controlLabel}>SELECT ANTE</Text>
            <View style={gs.chipRow}>
              {BET_OPTIONS.map(v => (
                <ChipBtn
                  key={v} value={v} selected={anteBet === v}
                  onPress={() => { setAnteBet(v); Haptics.selectionAsync(); }}
                  disabled={profile.chips < v}
                />
              ))}
            </View>

            <TouchableOpacity
              style={[gs.ppToggle, pairPlusOn && gs.ppToggleOn]}
              onPress={() => { setPairPlusOn(p => !p); Haptics.selectionAsync(); }}
            >
              <LinearGradient
                colors={pairPlusOn ? ['rgba(255,215,0,0.2)', 'transparent'] : ['transparent', 'transparent']}
                style={StyleSheet.absoluteFill}
              />
              <View style={[gs.ppCheck, pairPlusOn && gs.ppCheckOn]}>
                {pairPlusOn && <Ionicons name="checkmark" size={11} color="#000" />}
              </View>
              <View>
                <Text style={[gs.ppLabel, pairPlusOn && { color: '#ffd700' }]}>
                  PAIR PLUS  {pairPlusOn ? `+${fmt(anteBet)}` : 'OFF'}
                </Text>
                <Text style={gs.ppSub}>Win based on your hand only</Text>
              </View>
            </TouchableOpacity>

            <View style={gs.actionRow}>
              <View style={gs.balanceInfo}>
                <Ionicons name="wallet-outline" size={13} color="rgba(255,215,0,0.5)" />
                <Text style={gs.balanceText}>{fmt(profile.chips)}</Text>
              </View>
              <TouchableOpacity
                style={[gs.dealBtn, !canDeal && gs.dealBtnDisabled]}
                onPress={handleDeal} disabled={!canDeal} activeOpacity={0.85}
              >
                <LinearGradient
                  colors={canDeal ? ['#ffd700', '#c89b00'] : ['#333', '#222']}
                  style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                />
                <Ionicons name="albums-outline" size={16} color={canDeal ? '#000' : '#555'} />
                <Text style={[gs.dealBtnText, !canDeal && { color: '#555' }]}>
                  DEAL  {fmt(totalDealCost)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── ACTION BUTTONS (fold / play) ─────────────────────────────── */}
        {phase === 'action' && (
          <View style={gs.actionBtns}>
            <TouchableOpacity style={gs.foldBtn} onPress={handleFold} disabled={busy} activeOpacity={0.85}>
              <Text style={gs.foldText}>FOLD</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[gs.playBtn, !canPlay && gs.playBtnDisabled]}
              onPress={handlePlay} disabled={!canPlay || busy} activeOpacity={0.85}
            >
              <LinearGradient
                colors={canPlay ? ['#ffd700', '#c89b00'] : ['#333', '#222']}
                style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              />
              <Ionicons name="flash" size={16} color={canPlay ? '#000' : '#555'} />
              <Text style={[gs.playBtnText, !canPlay && { color: '#555' }]}>
                PLAY  +{fmt(anteBet)}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── RESULT BUTTONS ───────────────────────────────────────────── */}
        {phase === 'result' && (
          <View style={gs.actionBtns}>
            <TouchableOpacity style={gs.foldBtn} onPress={handleNewGame} activeOpacity={0.85}>
              <Text style={gs.foldText}>NEW GAME</Text>
            </TouchableOpacity>
            <TouchableOpacity style={gs.playBtn} onPress={handleRebet} activeOpacity={0.85}>
              <LinearGradient colors={['#ffd700', '#c89b00']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
              <Ionicons name="refresh" size={16} color="#000" />
              <Text style={gs.playBtnText}>REBET  {fmt(lastAnte + (lastPairPlus ? lastAnte : 0))}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const gs = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#04001a' },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 8 },
  backBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, width: 80 },
  backText:   { color: colors.primary, fontSize: 11, fontFamily: 'Orbitron_400Regular', letterSpacing: 1 },
  tableTitle: { fontSize: 11, fontWeight: '900', fontFamily: 'Orbitron_700Bold', color: 'rgba(255,215,0,0.8)', letterSpacing: 2 },

  scroll: { paddingHorizontal: 16, gap: 10 },

  // Dealer area
  dealerArea: { alignItems: 'center', gap: 8 },
  areaLabel:  { fontSize: 9, fontWeight: '700', fontFamily: 'Orbitron_700Bold', letterSpacing: 3, color: 'rgba(255,255,255,0.3)' },
  cardRow:    { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  qualNote:   { fontSize: 8, color: 'rgba(255,255,255,0.2)', fontFamily: 'Orbitron_400Regular', letterSpacing: 0.5, textAlign: 'center' },
  qualBadge:  { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  qualYes:    { borderColor: 'rgba(0,255,136,0.3)', backgroundColor: 'rgba(0,255,136,0.08)' },
  qualNo:     { borderColor: 'rgba(255,85,85,0.3)',  backgroundColor: 'rgba(255,85,85,0.08)' },
  qualBadgeText: { fontSize: 10, fontWeight: '800', fontFamily: 'Orbitron_700Bold', letterSpacing: 1 },

  // Table section
  tableSection: { gap: 12 },
  feltLine:   { height: 1 },
  circleRow:  { flexDirection: 'row', justifyContent: 'center', gap: 16 },

  // Player area
  playerArea: { alignItems: 'center', gap: 8 },
  handLabel:  { fontSize: 11, fontWeight: '900', fontFamily: 'Orbitron_700Bold', color: '#ffd700', letterSpacing: 2 },

  // Daily cap bar
  capBar:      { width: '100%', gap: 4 },
  capBarLabel: { fontSize: 8, fontFamily: 'Orbitron_400Regular', letterSpacing: 1, color: 'rgba(255,215,0,0.4)', textAlign: 'right' },
  capBarTrack: { height: 3, borderRadius: 2, backgroundColor: 'rgba(255,215,0,0.1)', overflow: 'hidden' },
  capBarFill:  { height: '100%', borderRadius: 2, backgroundColor: 'rgba(255,215,0,0.6)' },

  // Betting controls
  controls:     { gap: 12 },
  controlLabel: { fontSize: 9, fontWeight: '700', fontFamily: 'Orbitron_700Bold', letterSpacing: 2, color: 'rgba(255,215,0,0.5)', textAlign: 'center' },
  chipRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },

  ppToggle:  { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,215,0,0.15)', overflow: 'hidden' },
  ppToggleOn:{ borderColor: 'rgba(255,215,0,0.4)' },
  ppCheck:   { width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  ppCheckOn: { backgroundColor: '#ffd700', borderColor: '#ffd700' },
  ppLabel:   { fontSize: 11, fontWeight: '800', fontFamily: 'Orbitron_700Bold', color: 'rgba(255,215,0,0.5)' },
  ppSub:     { fontSize: 9, color: 'rgba(255,255,255,0.3)' },

  actionRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  balanceInfo:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  balanceText:  { fontSize: 16, fontWeight: '900', fontFamily: 'Orbitron_900Black', color: 'rgba(255,215,0,0.7)' },

  dealBtn:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14, overflow: 'hidden' },
  dealBtnDisabled: { opacity: 0.6 },
  dealBtnText:{ fontSize: 13, fontWeight: '900', fontFamily: 'Orbitron_700Bold', color: '#000' },

  // Action / result buttons
  actionBtns: { flexDirection: 'row', gap: 10 },
  foldBtn:    {
    flex: 1, paddingVertical: 16, borderRadius: 14, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  foldText: { fontSize: 12, fontWeight: '900', fontFamily: 'Orbitron_700Bold', color: 'rgba(255,255,255,0.6)' },
  playBtn:  {
    flex: 2, paddingVertical: 16, borderRadius: 14, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8,
  },
  playBtnDisabled: { opacity: 0.5 },
  playBtnText: { fontSize: 13, fontWeight: '900', fontFamily: 'Orbitron_700Bold', color: '#000' },
});
