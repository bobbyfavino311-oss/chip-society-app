import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useState, useCallback } from 'react';
import {
  Modal, Platform, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import PlayingCard from '@/components/PlayingCard';
import { useUser } from '@/context/UserContext';
import colors from '@/constants/colors';
import {
  createTCPDeck, shuffleTCPDeck, dealBiasedHands,
  evaluateThreeCardHand, tcpDealerQualifies, compareThreeCardHands,
  evaluateSixCardBonus,
  getPairPlusMultiplier, getAnteBonusMultiplier, getSixCardBonusMultiplier,
  type ThreeCardEval, type SixCardEval,
} from '@/lib/threeCardPoker';
import type { Card } from '@/lib/pokerEngine';

// ─── Types ────────────────────────────────────────────────────────────────────
type Phase   = 'betting' | 'action' | 'result';
type Mult    = 0 | 1 | 2;

interface TCPResult {
  playerEval:     ThreeCardEval;
  dealerEval:     ThreeCardEval;
  sixCardEval:    SixCardEval | null;
  qualified:      boolean;
  comparison:     'player' | 'dealer' | 'tie' | 'fold';
  mainWin:        number;   // net win/loss on ante+play (+ = won, - = lost)
  pairPlusWin:    number;   // net win/loss on pair plus
  anteBonusWin:   number;   // bonus payout (always ≥ 0)
  sixCardWin:     number;   // net win/loss on 6cb
  netDelta:       number;   // overall net chips change
}

// ─── Constants ────────────────────────────────────────────────────────────────
const BET_OPTIONS: number[] = [1_000, 5_000, 10_000, 25_000, 50_000, 100_000];

const PAYTABLE = {
  'PAIR PLUS': [
    { hand: 'Straight Flush', pays: '40 : 1' },
    { hand: 'Three of a Kind', pays: '30 : 1' },
    { hand: 'Straight',        pays: '6 : 1'  },
    { hand: 'Flush',           pays: '3 : 1'  },
    { hand: 'Pair',            pays: '1 : 1'  },
  ],
  'ANTE BONUS': [
    { hand: 'Straight Flush', pays: '5 : 1' },
    { hand: 'Three of a Kind', pays: '4 : 1' },
    { hand: 'Straight',        pays: '1 : 1' },
  ],
  '6 CARD BONUS': [
    { hand: 'Royal Flush',     pays: '1000 : 1' },
    { hand: 'Straight Flush',  pays: '200 : 1'  },
    { hand: 'Four of a Kind',  pays: '100 : 1'  },
    { hand: 'Full House',      pays: '20 : 1'   },
    { hand: 'Flush',           pays: '15 : 1'   },
    { hand: 'Straight',        pays: '10 : 1'   },
    { hand: 'Three of a Kind', pays: '7 : 1'    },
  ],
} as const;

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}
function fmtSigned(n: number): string {
  if (n === 0) return '—';
  return (n > 0 ? '+' : '') + fmt(Math.abs(n));
}

// ─── Paytable modal ───────────────────────────────────────────────────────────
function PaytableModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={pm.overlay} activeOpacity={1} onPress={onClose}>
        <View style={pm.sheet}>
          <LinearGradient colors={['#14002a', '#080018']} style={StyleSheet.absoluteFill} />
          <View style={pm.header}>
            <Text style={pm.title}>PAYTABLE</Text>
            <TouchableOpacity onPress={onClose} style={pm.closeBtn}>
              <Ionicons name="close" size={20} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {(Object.entries(PAYTABLE) as [string, readonly { hand: string; pays: string }[]][]).map(([section, rows]) => (
              <View key={section} style={pm.section}>
                <Text style={pm.sectionTitle}>{section}</Text>
                {rows.map(row => (
                  <View key={row.hand} style={pm.row}>
                    <Text style={pm.handName}>{row.hand}</Text>
                    <Text style={pm.handPays}>{row.pays}</Text>
                  </View>
                ))}
              </View>
            ))}
            <Text style={pm.note}>Dealer must have Queen High or better to qualify.{'\n'}6 Card Bonus uses best 5 of 6 combined cards.</Text>
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
const pm = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  sheet:        { borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', maxHeight: '80%', padding: 20, gap: 12 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title:        { fontSize: 16, fontWeight: '900', fontFamily: 'Orbitron_900Black', color: '#ffd700', letterSpacing: 3 },
  closeBtn:     { padding: 4 },
  section:      { gap: 6, marginBottom: 16 },
  sectionTitle: { fontSize: 10, fontWeight: '800', fontFamily: 'Orbitron_700Bold', letterSpacing: 2, color: 'rgba(255,215,0,0.7)', marginBottom: 4 },
  row:          { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  handName:     { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  handPays:     { fontSize: 12, fontWeight: '800', fontFamily: 'Orbitron_700Bold', color: '#ffd700' },
  note:         { fontSize: 9, color: 'rgba(255,255,255,0.3)', textAlign: 'center', lineHeight: 14, paddingBottom: 20 },
});

// ─── Betting circle (static ante / play display) ──────────────────────────────
function BetCircle({ label, amount, active }: { label: string; amount: number; active: boolean }) {
  return (
    <View style={[circ.wrap, active && circ.active]}>
      {active && <LinearGradient colors={['rgba(255,215,0,0.2)', 'transparent']} style={StyleSheet.absoluteFill} />}
      <Text style={circ.lbl} numberOfLines={2} adjustsFontSizeToFit>{label}</Text>
      <Text style={[circ.amt, active && circ.amtActive]}>{amount > 0 ? fmt(amount) : '—'}</Text>
    </View>
  );
}

// ─── Side-bet circle (tappable, cycles 0→1x→2x→0) ───────────────────────────
function SideBetCircle({
  label, mult, anteBet, onCycle, disabled,
}: { label: string; mult: Mult; anteBet: number; onCycle: () => void; disabled: boolean }) {
  const active = mult > 0;
  const amount = anteBet * mult;
  return (
    <TouchableOpacity onPress={onCycle} disabled={disabled} activeOpacity={0.75}>
      <View style={[circ.wrap, active && circ.active, disabled && !active && { opacity: 0.5 }]}>
        {active && <LinearGradient colors={['rgba(255,215,0,0.2)', 'transparent']} style={StyleSheet.absoluteFill} />}
        <Text style={circ.lbl} numberOfLines={2} adjustsFontSizeToFit>{label}</Text>
        <Text style={[circ.amt, active && circ.amtActive]}>{active ? fmt(amount) : '—'}</Text>
        {active && <Text style={circ.multBadge}>{mult}×</Text>}
      </View>
    </TouchableOpacity>
  );
}

const circ = StyleSheet.create({
  wrap:      {
    width: 76, height: 76, borderRadius: 38, borderWidth: 2,
    borderColor: 'rgba(255,215,0,0.25)', overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center', gap: 1,
  },
  active:    { borderColor: '#ffd700' },
  lbl:       { fontSize: 7, fontWeight: '800', fontFamily: 'Orbitron_700Bold', letterSpacing: 0.5, color: 'rgba(255,215,0,0.5)', textAlign: 'center', paddingHorizontal: 4 },
  amt:       { fontSize: 13, fontWeight: '900', fontFamily: 'Orbitron_900Black', color: 'rgba(255,215,0,0.4)' },
  amtActive: { color: '#ffd700' },
  multBadge: { fontSize: 7, fontWeight: '900', fontFamily: 'Orbitron_700Bold', color: 'rgba(255,215,0,0.6)', letterSpacing: 0.5 },
});

// ─── Chip preset button ───────────────────────────────────────────────────────
function ChipBtn({ value, selected, onPress, disabled }: { value: number; selected: boolean; onPress: () => void; disabled?: boolean }) {
  return (
    <TouchableOpacity
      style={[ch.btn, selected && ch.sel, disabled && { opacity: 0.3 }]}
      onPress={onPress} disabled={disabled} activeOpacity={0.75}
    >
      {selected && <LinearGradient colors={['#ffd700', '#c89b00']} style={StyleSheet.absoluteFill} />}
      <Text style={[ch.text, selected && ch.textSel]}>{fmt(value)}</Text>
    </TouchableOpacity>
  );
}
const ch = StyleSheet.create({
  btn:     { paddingHorizontal: 11, paddingVertical: 8, borderRadius: 9, borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)', overflow: 'hidden' },
  sel:     { borderColor: '#ffd700' },
  text:    { fontSize: 11, fontWeight: '800', fontFamily: 'Orbitron_700Bold', color: 'rgba(255,215,0,0.65)' },
  textSel: { color: '#000' },
});

// ─── Result row helper ────────────────────────────────────────────────────────
function ResultRow({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: string }) {
  const vc = value.startsWith('+') ? '#00ff88' : value.startsWith('-') ? '#ff5555' : '#aaa';
  return (
    <View style={rr.row}>
      <View>
        <Text style={rr.label}>{label}</Text>
        {sub ? <Text style={rr.sub}>{sub}</Text> : null}
      </View>
      <Text style={[rr.value, { color: highlight ?? vc }]}>{value}</Text>
    </View>
  );
}
const rr = StyleSheet.create({
  row:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingVertical: 5 },
  label: { fontSize: 9, fontFamily: 'Orbitron_400Regular', letterSpacing: 1, color: 'rgba(255,255,255,0.4)' },
  sub:   { fontSize: 8, color: 'rgba(255,255,255,0.25)', marginTop: 1 },
  value: { fontSize: 14, fontWeight: '900', fontFamily: 'Orbitron_900Black' },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function ThreeCardPokerScreen() {
  const insets = useSafeAreaInsets();
  const { profile, addChips, removeChips } = useUser();

  const [phase,          setPhase]          = useState<Phase>('betting');
  const [anteBet,        setAnteBet]        = useState(1_000);
  const [ppMult,         setPpMult]         = useState<Mult>(0);
  const [scMult,         setScMult]         = useState<Mult>(0);
  const [playerCards,    setPlayerCards]    = useState<Card[]>([]);
  const [dealerCards,    setDealerCards]    = useState<Card[]>([]);
  const [dealerRevealed, setDealerRevealed] = useState(false);
  const [result,         setResult]         = useState<TCPResult | null>(null);
  const [lastAnte,       setLastAnte]       = useState(1_000);
  const [lastPpMult,     setLastPpMult]     = useState<Mult>(0);
  const [lastScMult,     setLastScMult]     = useState<Mult>(0);
  const [busy,           setBusy]           = useState(false);
  const [showPT,         setShowPT]         = useState(false);
  const [played,         setPlayed]         = useState(false);

  const ppBet       = anteBet * ppMult;
  const scBet       = anteBet * scMult;
  const dealCost    = anteBet + ppBet + scBet;
  const canDeal     = anteBet >= 1_000 && profile.chips >= dealCost && !busy;
  const canPlay     = !busy && profile.chips >= anteBet;

  // ── Cycle side-bet multiplier ──────────────────────────────────────────────
  const cyclePP = useCallback(() => {
    if (phase !== 'betting' || busy) return;
    Haptics.selectionAsync();
    setPpMult(m => ((m + 1) % 3) as Mult);
  }, [phase, busy]);

  const cycleSC = useCallback(() => {
    if (phase !== 'betting' || busy) return;
    Haptics.selectionAsync();
    setScMult(m => ((m + 1) % 3) as Mult);
  }, [phase, busy]);

  // ── Deal ──────────────────────────────────────────────────────────────────
  const handleDeal = useCallback(async () => {
    if (!canDeal) return;
    setBusy(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await removeChips(dealCost);
    const deck   = shuffleTCPDeck(createTCPDeck());
    const hands  = dealBiasedHands(deck);
    setPlayerCards(hands.playerCards);
    setDealerCards(hands.dealerCards);
    setDealerRevealed(false);
    setResult(null);
    setPlayed(false);
    setLastAnte(anteBet);
    setLastPpMult(ppMult);
    setLastScMult(scMult);
    setPhase('action');
    setBusy(false);
  }, [canDeal, dealCost, anteBet, ppMult, scMult, removeChips]);

  // ── Play ──────────────────────────────────────────────────────────────────
  const handlePlay = useCallback(async () => {
    if (!canPlay) return;
    setBusy(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await removeChips(anteBet); // play wager

    const pEval   = evaluateThreeCardHand(playerCards);
    const dEval   = evaluateThreeCardHand(dealerCards);
    const qual    = tcpDealerQualifies(dealerCards);
    const cmp     = compareThreeCardHands(pEval, dEval);

    // ── Pair Plus ────────────────────────────────────────────────────────────
    const ppM   = getPairPlusMultiplier(pEval.rank);
    const ppWin = ppBet > 0 ? (ppM >= 0 ? ppBet * ppM : -ppBet) : 0;

    // ── Ante Bonus ────────────────────────────────────────────────────────────
    const abM         = getAnteBonusMultiplier(pEval.rank);
    const anteBonusWin = anteBet * abM;

    // ── Main game ─────────────────────────────────────────────────────────────
    let mainWin = 0;
    if (!qual) {
      mainWin = anteBet; // ante wins 1:1, play pushed back
    } else if (cmp === 'player') {
      mainWin = anteBet * 2; // ante + play each win 1:1
    } else if (cmp === 'tie') {
      mainWin = 0; // push — money returned
    } else {
      mainWin = -(anteBet * 2); // both ante and play lost
    }

    // ── Six Card Bonus ────────────────────────────────────────────────────────
    let scEval: SixCardEval | null = null;
    let scWin  = 0;
    if (scBet > 0) {
      scEval = evaluateSixCardBonus(playerCards, dealerCards);
      const scM = getSixCardBonusMultiplier(scEval.rank);
      scWin     = scM >= 0 ? scBet * scM : -scBet;
    }

    // ── Chip resolution ───────────────────────────────────────────────────────
    // totalPaidIn = dealCost (ante+pp+sc) + play wager (ante again) = 2*ante + pp + sc
    // Returns: returned bets + winnings
    let returnChips = 0;

    // Ante return
    if (!qual || cmp === 'player' || cmp === 'tie') {
      returnChips += anteBet; // ante returned (win or push)
    }
    if (cmp === 'player') returnChips += anteBet; // ante WIN 1:1

    // Play return
    if (!qual) {
      returnChips += anteBet; // play pushed back
    } else if (cmp === 'player') {
      returnChips += anteBet * 2; // play returned + win 1:1
    } else if (cmp === 'tie') {
      returnChips += anteBet; // play pushed back
    }

    // Ante bonus (always paid on qualifying hands)
    returnChips += anteBonusWin;

    // Pair Plus
    if (ppBet > 0) {
      if (ppM >= 0) returnChips += ppBet + ppBet * ppM; // bet returned + winnings
      // else pair plus lost — bet already removed at deal
    }

    // Six card bonus
    if (scBet > 0) {
      const scM = getSixCardBonusMultiplier(scEval!.rank);
      if (scM >= 0) returnChips += scBet + scBet * scM;
    }

    if (returnChips > 0) await addChips(returnChips);

    const netDelta = returnChips - (2 * anteBet + ppBet + scBet);

    setResult({
      playerEval: pEval, dealerEval: dEval, sixCardEval: scEval,
      qualified: qual, comparison: cmp,
      mainWin, pairPlusWin: ppWin, anteBonusWin, sixCardWin: scWin, netDelta,
    });
    setDealerRevealed(true);
    setPlayed(true);
    setPhase('result');
    if (netDelta > 0) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setBusy(false);
  }, [canPlay, anteBet, ppBet, scBet, playerCards, dealerCards, addChips, removeChips]);

  // ── Fold ──────────────────────────────────────────────────────────────────
  const handleFold = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const pEval  = evaluateThreeCardHand(playerCards);
    const dEval  = evaluateThreeCardHand(dealerCards);
    const ppM    = getPairPlusMultiplier(pEval.rank);

    let returnChips = 0;
    let ppWin = 0;
    if (ppBet > 0 && ppM >= 0) {
      returnChips += ppBet + ppBet * ppM;
      ppWin = ppBet * ppM;
    } else if (ppBet > 0) {
      ppWin = -ppBet;
    }

    if (returnChips > 0) await addChips(returnChips);

    // netDelta: lost ante + pp (if lost) + sc; gained ppWin if positive
    const netDelta = returnChips - (anteBet + ppBet + scBet);

    setResult({
      playerEval: pEval, dealerEval: dEval, sixCardEval: null,
      qualified: false, comparison: 'fold',
      mainWin: -anteBet, pairPlusWin: ppWin, anteBonusWin: 0,
      sixCardWin: scBet > 0 ? -scBet : 0, netDelta,
    });
    setDealerRevealed(true);
    setPlayed(false);
    setPhase('result');
    setBusy(false);
  }, [busy, anteBet, ppBet, scBet, playerCards, dealerCards, addChips]);

  // ── Rebet / New ───────────────────────────────────────────────────────────
  const handleRebet = useCallback(() => {
    setAnteBet(lastAnte);
    setPpMult(lastPpMult);
    setScMult(lastScMult);
    setPhase('betting');
    setResult(null);
  }, [lastAnte, lastPpMult, lastScMult]);

  const handleNew = useCallback(() => {
    setPhase('betting');
    setResult(null);
    setPlayerCards([]);
    setDealerCards([]);
  }, []);

  // ─── Render ──────────────────────────────────────────────────────────────────
  const pEvalLabel = playerCards.length > 0 ? evaluateThreeCardHand(playerCards).label : '';

  return (
    <View style={gs.container}>
      <LinearGradient colors={['#04001a', '#060020', '#020014']} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={['rgba(0,180,255,0.05)', 'transparent', 'rgba(255,0,144,0.04)']}
        style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />

      {/* ── HEADER ── */}
      <View style={[gs.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 20 : 10) }]}>
        <TouchableOpacity style={gs.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={gs.tableTitle}>THREE CARD POKER</Text>
        <TouchableOpacity style={gs.ptBtn} onPress={() => setShowPT(true)}>
          <Text style={gs.ptBtnText}>PAYTABLE</Text>
          <Ionicons name="information-circle-outline" size={13} color="rgba(255,215,0,0.6)" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[gs.scroll, { paddingBottom: insets.bottom + 16 }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={phase === 'result'}
      >
        {/* ── DEALER AREA ── */}
        <View style={gs.dealerArea}>
          <Text style={gs.areaLabel}>DEALER</Text>
          <View style={gs.cardRow}>
            {dealerCards.length > 0
              ? dealerCards.map((c, i) => <PlayingCard key={i} card={c} faceDown={!dealerRevealed} size="lg" animated />)
              : [0,1,2].map(i => <PlayingCard key={i} faceDown size="lg" />)
            }
          </View>
          {dealerRevealed && result && result.comparison !== 'fold' ? (
            <View style={[gs.qualBadge, result.qualified ? gs.qualYes : gs.qualNo]}>
              <Ionicons name={result.qualified ? 'checkmark-circle' : 'close-circle'} size={12}
                color={result.qualified ? '#00ff88' : '#ff5555'} />
              <Text style={[gs.qualText, { color: result.qualified ? '#00ff88' : '#ff5555' }]}>
                {result.qualified ? 'DEALER QUALIFIES' : 'NO QUALIFY — PLAY PUSHES'}
              </Text>
            </View>
          ) : (
            <Text style={gs.qualNote}>QUEEN HIGH OR BETTER TO QUALIFY</Text>
          )}
        </View>

        {/* ── TABLE ── */}
        <View style={gs.tableSection}>
          <LinearGradient colors={['transparent', 'rgba(255,215,0,0.14)', 'transparent']} style={gs.feltLine} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />

          {/* 4 betting circles */}
          <View style={gs.circleRow}>
            <SideBetCircle
              label={'PAIR\nPLUS'}
              mult={phase === 'betting' ? ppMult : lastPpMult}
              anteBet={phase === 'betting' ? anteBet : lastAnte}
              onCycle={cyclePP}
              disabled={phase !== 'betting'}
            />
            <BetCircle
              label="ANTE"
              amount={phase === 'betting' ? anteBet : lastAnte}
              active={anteBet > 0}
            />
            <BetCircle
              label="PLAY"
              amount={phase === 'action' || (phase === 'result' && played) ? lastAnte : 0}
              active={phase === 'action' || (phase === 'result' && played)}
            />
            <SideBetCircle
              label={'6 CARD\nBONUS'}
              mult={phase === 'betting' ? scMult : lastScMult}
              anteBet={phase === 'betting' ? anteBet : lastAnte}
              onCycle={cycleSC}
              disabled={phase !== 'betting'}
            />
          </View>

          <LinearGradient colors={['transparent', 'rgba(255,215,0,0.14)', 'transparent']} style={gs.feltLine} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
        </View>

        {/* ── PLAYER AREA ── */}
        <View style={gs.playerArea}>
          <View style={gs.cardRow}>
            {playerCards.length > 0
              ? playerCards.map((c, i) => (
                  <PlayingCard key={i} card={c} faceDown={false} size="lg" animated
                    highlighted={result?.comparison === 'player' || result?.comparison === 'tie'} />
                ))
              : [0,1,2].map(i => <PlayingCard key={i} faceDown size="lg" />)
            }
          </View>
          {pEvalLabel ? <Text style={gs.handLabel}>{pEvalLabel}</Text> : null}

          {/* Result breakdown */}
          {phase === 'result' && result && (
            <View style={gs.resultPanel}>
              <LinearGradient colors={['rgba(0,0,0,0.8)', 'rgba(8,0,20,0.9)']} style={StyleSheet.absoluteFill} />

              {result.comparison === 'fold' ? (
                <Text style={gs.foldLabel}>PLAYER FOLDED — ANTE LOST</Text>
              ) : (
                <Text style={gs.foldLabel}>
                  {result.qualified ? 'DEALER QUALIFIES' : 'DEALER DOES NOT QUALIFY'}
                </Text>
              )}

              <View style={gs.resultDivider} />

              <ResultRow
                label="MAIN GAME"
                value={result.comparison === 'fold'
                  ? `-${fmt(lastAnte)}`
                  : result.mainWin === 0 ? 'PUSH'
                  : fmtSigned(result.mainWin)}
              />

              {lastPpMult > 0 && (
                <ResultRow
                  label="PAIR PLUS"
                  value={fmtSigned(result.pairPlusWin)}
                  sub={result.playerEval.label}
                />
              )}

              {result.anteBonusWin > 0 && (
                <ResultRow
                  label="ANTE BONUS"
                  value={`+${fmt(result.anteBonusWin)}`}
                  sub={result.playerEval.label}
                  highlight="#ffd700"
                />
              )}

              {lastScMult > 0 && (
                <ResultRow
                  label="6 CARD BONUS"
                  value={result.comparison === 'fold' ? `-${fmt(lastAnte * lastScMult)}` : fmtSigned(result.sixCardWin)}
                  sub={result.sixCardEval?.label ?? '—'}
                  highlight={result.sixCardWin > 0 ? '#bf5fff' : undefined}
                />
              )}

              <View style={gs.resultDivider} />

              <ResultRow
                label="NET RESULT"
                value={fmtSigned(result.netDelta)}
                highlight={result.netDelta > 0 ? '#00ff88' : result.netDelta < 0 ? '#ff5555' : '#aaa'}
              />
            </View>
          )}
        </View>

        {/* ── BETTING CONTROLS ── */}
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

            <Text style={gs.controlHint}>
              Tap PAIR PLUS or 6 CARD BONUS circles to add side bets (1× or 2× ante)
            </Text>

            <View style={gs.dealRow}>
              <View style={gs.balInfo}>
                <Ionicons name="wallet-outline" size={12} color="rgba(255,215,0,0.5)" />
                <Text style={gs.balText}>{fmt(profile.chips)}</Text>
              </View>
              <TouchableOpacity
                style={[gs.dealBtn, !canDeal && gs.dealBtnOff]}
                onPress={handleDeal} disabled={!canDeal} activeOpacity={0.85}
              >
                <LinearGradient
                  colors={canDeal ? ['#ffd700', '#c89b00'] : ['#2a2a2a', '#1a1a1a']}
                  style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                />
                <Ionicons name="albums-outline" size={15} color={canDeal ? '#000' : '#444'} />
                <Text style={[gs.dealBtnText, !canDeal && { color: '#444' }]}>DEAL {fmt(dealCost)}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── ACTION BUTTONS ── */}
        {phase === 'action' && (
          <View style={gs.actionRow}>
            <TouchableOpacity style={gs.foldBtn} onPress={handleFold} disabled={busy} activeOpacity={0.85}>
              <Text style={gs.foldText}>FOLD</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[gs.playBtn, !canPlay && gs.playBtnOff]}
              onPress={handlePlay} disabled={!canPlay || busy} activeOpacity={0.85}
            >
              <LinearGradient
                colors={canPlay ? ['#ffd700', '#c89b00'] : ['#2a2a2a', '#1a1a1a']}
                style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              />
              <Ionicons name="flash" size={15} color={canPlay ? '#000' : '#444'} />
              <Text style={[gs.playBtnText, !canPlay && { color: '#444' }]}>PLAY +{fmt(lastAnte)}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── RESULT BUTTONS ── */}
        {phase === 'result' && (
          <View style={gs.actionRow}>
            <TouchableOpacity style={gs.foldBtn} onPress={handleNew} activeOpacity={0.85}>
              <Text style={gs.foldText}>NEW</Text>
            </TouchableOpacity>
            <TouchableOpacity style={gs.playBtn} onPress={handleRebet} activeOpacity={0.85}>
              <LinearGradient colors={['#ffd700', '#c89b00']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
              <Ionicons name="refresh" size={15} color="#000" />
              <Text style={gs.playBtnText}>REBET {fmt(lastAnte + lastAnte * lastPpMult + lastAnte * lastScMult)}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <PaytableModal visible={showPT} onClose={() => setShowPT(false)} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const gs = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#04001a' },
  scroll:      { paddingHorizontal: 14, gap: 10 },

  // Header
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 6 },
  backBtn:    { width: 70, flexDirection: 'row', alignItems: 'center' },
  tableTitle: { fontSize: 9, fontWeight: '900', fontFamily: 'Orbitron_700Bold', color: 'rgba(255,215,0,0.85)', letterSpacing: 1.5, flex: 1, textAlign: 'center' },
  ptBtn:      { width: 70, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 3 },
  ptBtnText:  { fontSize: 7, fontWeight: '800', fontFamily: 'Orbitron_700Bold', color: 'rgba(255,215,0,0.55)', letterSpacing: 1 },

  // Dealer
  dealerArea: { alignItems: 'center', gap: 8 },
  areaLabel:  { fontSize: 8, fontWeight: '700', fontFamily: 'Orbitron_700Bold', letterSpacing: 3, color: 'rgba(255,255,255,0.25)' },
  cardRow:    { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  qualNote:   { fontSize: 8, color: 'rgba(255,255,255,0.2)', fontFamily: 'Orbitron_400Regular', letterSpacing: 0.5, textAlign: 'center' },
  qualBadge:  { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  qualYes:    { borderColor: 'rgba(0,255,136,0.3)', backgroundColor: 'rgba(0,255,136,0.07)' },
  qualNo:     { borderColor: 'rgba(255,85,85,0.3)',  backgroundColor: 'rgba(255,85,85,0.07)'  },
  qualText:   { fontSize: 9, fontWeight: '800', fontFamily: 'Orbitron_700Bold', letterSpacing: 1 },

  // Table
  tableSection: { gap: 10 },
  feltLine:     { height: 1 },
  circleRow:    { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center' },

  // Player
  playerArea:  { alignItems: 'center', gap: 8 },
  handLabel:   { fontSize: 11, fontWeight: '900', fontFamily: 'Orbitron_700Bold', color: '#ffd700', letterSpacing: 2 },

  // Result panel
  resultPanel:  { width: '100%', borderRadius: 14, overflow: 'hidden', padding: 14, gap: 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  foldLabel:    { fontSize: 8, fontWeight: '700', fontFamily: 'Orbitron_700Bold', letterSpacing: 1.5, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },
  resultDivider:{ height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginVertical: 4 },

  // Betting controls
  controls:     { gap: 10 },
  controlLabel: { fontSize: 8, fontWeight: '700', fontFamily: 'Orbitron_700Bold', letterSpacing: 2, color: 'rgba(255,215,0,0.45)', textAlign: 'center' },
  controlHint:  { fontSize: 9, color: 'rgba(255,255,255,0.2)', textAlign: 'center', lineHeight: 13 },
  chipRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  dealRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  balInfo:      { flexDirection: 'row', alignItems: 'center', gap: 5 },
  balText:      { fontSize: 15, fontWeight: '900', fontFamily: 'Orbitron_900Black', color: 'rgba(255,215,0,0.7)' },
  dealBtn:      { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 18, paddingVertical: 13, borderRadius: 13, overflow: 'hidden' },
  dealBtnOff:   { opacity: 0.55 },
  dealBtnText:  { fontSize: 12, fontWeight: '900', fontFamily: 'Orbitron_700Bold', color: '#000' },

  // Action / result buttons (20% smaller than old implementation)
  actionRow:   { flexDirection: 'row', gap: 10 },
  foldBtn:     {
    flex: 1, paddingVertical: 13, borderRadius: 13, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  foldText:    { fontSize: 11, fontWeight: '900', fontFamily: 'Orbitron_700Bold', color: 'rgba(255,255,255,0.55)' },
  playBtn:     {
    flex: 2, paddingVertical: 13, borderRadius: 13, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7,
  },
  playBtnOff:  { opacity: 0.5 },
  playBtnText: { fontSize: 12, fontWeight: '900', fontFamily: 'Orbitron_700Bold', color: '#000' },
});
