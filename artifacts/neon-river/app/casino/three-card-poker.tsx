import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useState, useCallback, useEffect } from 'react';
import {
  Modal, Platform, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import PlayingCard from '@/components/PlayingCard';
import CasinoTableSelectModal from '@/components/CasinoTableSelectModal';
import { useUser } from '@/context/UserContext';
import { useSoundSettings } from '@/context/SoundContext';
import { MusicEngine } from '@/lib/musicEngine';
import colors from '@/constants/colors';
import { type CasinoTableLimit } from '@/lib/casinoTableLimits';
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
const BONUS_STEPS = [0, 250_000, 500_000, 750_000, 1_000_000] as const;
type BonusIdx = 0 | 1 | 2 | 3 | 4;

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

// ─── Constants (unused chip list removed — ante is set by stake tier) ─────────

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
  const v = (x: number) => x % 1 === 0 ? x.toFixed(0) : x.toFixed(1);
  if (n >= 1_000_000_000) return `${v(n / 1_000_000_000)}B`;
  if (n >= 1_000_000)     return `${v(n / 1_000_000)}M`;
  if (n >= 1_000)         return `${v(n / 1_000)}K`;
  return String(n);
}
function fmtNet(n: number): string {
  if (n === 0) return 'PUSH';
  return (n > 0 ? '+' : '-') + fmt(Math.abs(n));
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

// ─── Side-bet circle (tappable, cycles 0→250K→500K→750K→1M→0) ───────────────
function SideBetCircle({
  label, amount, onCycle, disabled,
}: { label: string; amount: number; onCycle: () => void; disabled: boolean }) {
  const active = amount > 0;
  return (
    <TouchableOpacity onPress={onCycle} disabled={disabled} activeOpacity={0.75}>
      <View style={[circ.wrap, active && circ.active, disabled && !active && { opacity: 0.5 }]}>
        {active && <LinearGradient colors={['rgba(255,215,0,0.2)', 'transparent']} style={StyleSheet.absoluteFill} />}
        <Text style={circ.lbl} numberOfLines={2} adjustsFontSizeToFit>{label}</Text>
        <Text style={[circ.amt, active && circ.amtActive]}>{active ? fmt(amount) : '—'}</Text>
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

// ─── Result row ───────────────────────────────────────────────────────────────
type RowOutcome = 'win' | 'loss' | 'push' | 'none';

const OUTCOME_COLORS: Record<RowOutcome, string> = {
  win:  '#00ff88',
  loss: '#ff4444',
  push: '#00d4ff',
  none: 'rgba(255,255,255,0.22)',
};

function ResultRow({
  label, outcome, amount, sub, accent, isNet,
}: {
  label:   string;
  outcome: RowOutcome;
  amount?: number;
  sub?:    string;
  accent?: string;
  isNet?:  boolean;
}) {
  const color = accent ?? OUTCOME_COLORS[outcome];
  let valueText: string;
  if (isNet) {
    valueText = outcome === 'win' && amount ? `+${fmt(amount)}`
      : outcome === 'loss' && amount ? `-${fmt(amount)}`
      : 'PUSH';
  } else if (outcome === 'win' && amount !== undefined) {
    valueText = `+${fmt(amount)} WIN`;
  } else if (outcome === 'loss' && amount !== undefined) {
    valueText = `-${fmt(amount)} LOSS`;
  } else if (outcome === 'push') {
    valueText = 'PUSH';
  } else {
    valueText = 'NO BONUS';
  }

  return (
    <View style={[rr.row, isNet && rr.netRow]}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[rr.label, isNet && rr.netLabel]} numberOfLines={1}>{label}</Text>
        {sub ? <Text style={rr.sub} numberOfLines={1}>{sub}</Text> : null}
      </View>
      <Text style={[isNet ? rr.netValue : rr.value, { color }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{valueText}</Text>
    </View>
  );
}
const rr = StyleSheet.create({
  row:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  netRow:   { paddingTop: 6 },
  label:    { fontSize: 9, fontFamily: 'Orbitron_400Regular', letterSpacing: 1, color: 'rgba(255,255,255,0.4)' },
  netLabel: { fontSize: 9, fontFamily: 'Orbitron_700Bold', letterSpacing: 1.5, color: 'rgba(255,255,255,0.55)' },
  sub:      { fontSize: 8, color: 'rgba(255,255,255,0.25)', marginTop: 1 },
  value:    { fontSize: 13, fontWeight: '900', fontFamily: 'Orbitron_900Black' },
  netValue: { fontSize: 22, fontWeight: '900', fontFamily: 'Orbitron_900Black' },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function ThreeCardPokerScreen() {
  const insets = useSafeAreaInsets();
  const { profile, addChips, removeChips } = useUser();
  const { isMusicMuted, toggleMusicMute } = useSoundSettings();

  // ── Music: start on mount, stop on unmount, respect global mute ───────────
  useEffect(() => {
    MusicEngine.configure({ muted: isMusicMuted });
    MusicEngine.play();
    return () => { MusicEngine.stop(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    MusicEngine.configure({ muted: isMusicMuted });
  }, [isMusicMuted]);

  const [selectedTier,   setSelectedTier]   = useState<CasinoTableLimit | null>(null);

  const [phase,          setPhase]          = useState<Phase>('betting');
  const [ppMult,         setPpMult]         = useState<BonusIdx>(0);
  const [scMult,         setScMult]         = useState<BonusIdx>(0);
  const [playerCards,    setPlayerCards]    = useState<Card[]>([]);
  const [dealerCards,    setDealerCards]    = useState<Card[]>([]);
  const [dealerRevealed, setDealerRevealed] = useState(false);
  const [result,         setResult]         = useState<TCPResult | null>(null);
  const [lastAnte,       setLastAnte]       = useState(0);
  const [lastPpMult,     setLastPpMult]     = useState<BonusIdx>(0);
  const [lastScMult,     setLastScMult]     = useState<BonusIdx>(0);
  const [lastPpBet,      setLastPpBet]      = useState(0);
  const [lastScBet,      setLastScBet]      = useState(0);
  const [busy,           setBusy]           = useState(false);
  const [showPT,         setShowPT]         = useState(false);
  const [played,         setPlayed]         = useState(false);

  // Ante is always derived from the selected stake tier
  const anteBet = selectedTier?.minBet ?? 0;

  const ppBet         = BONUS_STEPS[ppMult];
  const scBet         = BONUS_STEPS[scMult];
  const dealCost      = anteBet + ppBet + scBet;
  // Always reserve one extra anteBet for the Play wager so the player
  // is never forced to fold simply because side bets consumed all chips.
  const totalRequired = dealCost + anteBet;
  const canDeal       = anteBet > 0 && profile.chips >= totalRequired && !busy;
  const canPlay       = !busy && profile.chips >= anteBet;

  // ── Cycle side-bet (fixed steps: 0 → 250K → 500K → 750K → 1M → 0) ──────────
  const cyclePP = useCallback(() => {
    if (phase !== 'betting' || busy) return;
    Haptics.selectionAsync();
    const next = ((ppMult + 1) % 5) as BonusIdx;
    const costIfNext = anteBet + BONUS_STEPS[next] + scBet + anteBet;
    setPpMult(next > 0 && costIfNext > profile.chips ? 0 : next);
  }, [phase, busy, ppMult, anteBet, scBet, profile.chips]);

  const cycleSC = useCallback(() => {
    if (phase !== 'betting' || busy) return;
    Haptics.selectionAsync();
    const next = ((scMult + 1) % 5) as BonusIdx;
    const costIfNext = anteBet + ppBet + BONUS_STEPS[next] + anteBet;
    setScMult(next > 0 && costIfNext > profile.chips ? 0 : next);
  }, [phase, busy, scMult, anteBet, ppBet, profile.chips]);

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
    setLastPpBet(ppBet);
    setLastScBet(scBet);
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

    const pEval = evaluateThreeCardHand(playerCards);
    const dEval = evaluateThreeCardHand(dealerCards);
    const ppM   = getPairPlusMultiplier(pEval.rank);

    let returnChips = 0;

    // Pair Plus resolves normally on fold
    let ppWin = 0;
    if (ppBet > 0 && ppM >= 0) {
      returnChips += ppBet + ppBet * ppM;
      ppWin = ppBet * ppM;
    } else if (ppBet > 0) {
      ppWin = -ppBet;
    }

    // 6 Card Bonus resolves normally on fold (best 5 of all 6 cards)
    let scEval: SixCardEval | null = null;
    let scWin = 0;
    if (scBet > 0) {
      scEval = evaluateSixCardBonus(playerCards, dealerCards);
      const scM = getSixCardBonusMultiplier(scEval.rank);
      scWin = scM >= 0 ? scBet * scM : -scBet;
      if (scM >= 0) returnChips += scBet + scBet * scM;
    }

    if (returnChips > 0) await addChips(returnChips);

    const netDelta = returnChips - (anteBet + ppBet + scBet);

    setResult({
      playerEval: pEval, dealerEval: dEval, sixCardEval: scEval,
      qualified: false, comparison: 'fold',
      mainWin: -anteBet, pairPlusWin: ppWin, anteBonusWin: 0,
      sixCardWin: scWin, netDelta,
    });
    // Reveal dealer only if 6CB was placed — player needs to see the combined hand
    setDealerRevealed(scBet > 0);
    setPlayed(false);
    setPhase('result');
    setBusy(false);
  }, [busy, anteBet, ppBet, scBet, playerCards, dealerCards, addChips]);

  // ── Rebet / New ───────────────────────────────────────────────────────────
  const handleRebet = useCallback(() => {
    setPpMult(lastPpMult);
    setScMult(lastScMult);
    setPhase('betting');
    setResult(null);
  }, [lastPpMult, lastScMult]);

  const handleNew = useCallback(() => {
    setPpMult(0);
    setScMult(0);
    setPhase('betting');
    setResult(null);
    setPlayerCards([]);
    setDealerCards([]);
  }, []);

  // ─── Render ──────────────────────────────────────────────────────────────────
  const pEvalLabel = playerCards.length > 0 ? evaluateThreeCardHand(playerCards).label : '';

  // 6CB winning card helper — identifies which cards form the bonus hand
  const scWinCards = result?.sixCardEval?.winningCards ?? [];
  function is6CBHighlight(c: Card): boolean {
    return scWinCards.some(w => w.suit === c.suit && w.value === c.value);
  }
  const show6CBHighlight = (result?.sixCardWin ?? 0) > 0 && lastScMult > 0;

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
        <View style={gs.headerRight}>
          <TouchableOpacity style={gs.iconBtn} onPress={toggleMusicMute} activeOpacity={0.75}>
            <Ionicons
              name={isMusicMuted ? 'musical-notes-outline' : 'musical-notes'}
              size={15}
              color={isMusicMuted ? 'rgba(255,255,255,0.22)' : '#00d4ff'}
            />
          </TouchableOpacity>
          <TouchableOpacity style={gs.ptBtn} onPress={() => setShowPT(true)}>
            <Text style={gs.ptBtnText}>TABLE</Text>
            <Ionicons name="information-circle-outline" size={13} color="rgba(255,215,0,0.6)" />
          </TouchableOpacity>
        </View>
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
              ? dealerCards.map((c, i) => (
                  <PlayingCard
                    key={i} card={c} faceDown={!dealerRevealed} size="lg" animated
                    highlighted={dealerRevealed && show6CBHighlight && is6CBHighlight(c)}
                  />
                ))
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
              amount={phase === 'betting' ? ppBet : lastPpBet}
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
              amount={phase === 'betting' ? scBet : lastScBet}
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
                  <PlayingCard
                    key={i} card={c} faceDown={false} size="lg" animated
                    highlighted={
                      show6CBHighlight
                        ? is6CBHighlight(c)
                        : (result?.comparison === 'player' || result?.comparison === 'tie')
                    }
                  />
                ))
              : [0,1,2].map(i => <PlayingCard key={i} faceDown size="lg" />)
            }
          </View>
          {pEvalLabel ? <Text style={gs.handLabel}>{pEvalLabel}</Text> : null}

          {/* Result breakdown */}
          {phase === 'result' && result && (() => {
            // ── Verdict derivation ──────────────────────────────────────
            const pLabel = result.playerEval.label;
            const dLabel = result.dealerEval.label;
            let verdictText: string;
            let verdictColor: string;
            let reasonText: string;
            if (result.comparison === 'fold') {
              verdictText = 'PLAYER FOLDED';
              verdictColor = '#ff4466';
              reasonText = 'Ante surrendered — hand ends';
            } else if (!result.qualified) {
              verdictText = 'DEALER DOES NOT QUALIFY';
              verdictColor = '#ffd700';
              reasonText = 'Dealer needs Q-high to qualify — ante returned';
            } else if (result.comparison === 'player') {
              verdictText = 'PLAYER WINS';
              verdictColor = '#00ff88';
              reasonText = `${pLabel} beats ${dLabel}`;
            } else if (result.comparison === 'dealer') {
              verdictText = 'DEALER WINS';
              verdictColor = '#ff4466';
              reasonText = `${dLabel} beats ${pLabel}`;
            } else {
              verdictText = 'PUSH';
              verdictColor = '#ffd700';
              reasonText = 'Equal hands — ante returned';
            }

            return (
            <View style={gs.resultPanel}>
              <LinearGradient colors={['rgba(0,0,0,0.82)', 'rgba(8,0,22,0.92)']} style={StyleSheet.absoluteFill} />

              {/* ── Hand comparison block ── */}
              <View style={gs.compBlock}>
                {/* Dealer row (hidden on fold unless dealer was revealed) */}
                {result.comparison !== 'fold' && (
                  <View style={gs.compHandRow}>
                    <Text style={gs.compSideLabel} numberOfLines={1}>DEALER</Text>
                    <Text style={[gs.compHandName, { color: result.comparison === 'dealer' ? '#ff6680' : 'rgba(255,255,255,0.55)' }]} numberOfLines={1}>
                      {dLabel}
                    </Text>
                  </View>
                )}

                {result.comparison !== 'fold' && (
                  <View style={gs.compVsDivider}>
                    <View style={gs.compVsLine} />
                    <Text style={gs.compVsText}>VS</Text>
                    <View style={gs.compVsLine} />
                  </View>
                )}

                {/* Player row */}
                <View style={gs.compHandRow}>
                  <Text style={gs.compSideLabel} numberOfLines={1}>YOU</Text>
                  <Text style={[gs.compHandName, { color: result.comparison === 'player' ? '#00ff88' : 'rgba(255,255,255,0.55)' }]} numberOfLines={1}>
                    {pLabel}
                  </Text>
                </View>

                {/* Verdict pill */}
                <View style={[gs.compVerdictPill, { borderColor: `${verdictColor}55`, backgroundColor: `${verdictColor}0f` }]}>
                  <Text style={[gs.compVerdictText, { color: verdictColor }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{verdictText}</Text>
                  <Text style={gs.compReasonText} numberOfLines={2}>{reasonText}</Text>
                </View>
              </View>

              <View style={gs.resultDivider} />

              {/* MAIN GAME */}
              <ResultRow
                label="MAIN GAME"
                outcome={
                  result.comparison === 'fold' ? 'loss'
                  : result.mainWin > 0 ? 'win'
                  : result.mainWin < 0 ? 'loss'
                  : 'push'
                }
                amount={
                  result.comparison === 'fold' ? lastAnte
                  : result.mainWin !== 0 ? Math.abs(result.mainWin)
                  : undefined
                }
              />

              {/* PAIR PLUS — only if bet was placed */}
              {lastPpBet > 0 && (
                <ResultRow
                  label="PAIR PLUS"
                  outcome={result.pairPlusWin > 0 ? 'win' : 'loss'}
                  amount={Math.abs(result.pairPlusWin) || lastPpBet}
                  sub={result.playerEval.label}
                />
              )}

              {/* ANTE BONUS — always shown when player played (not folded) */}
              {result.comparison !== 'fold' && (
                <ResultRow
                  label="ANTE BONUS"
                  outcome={result.anteBonusWin > 0 ? 'win' : 'none'}
                  amount={result.anteBonusWin > 0 ? result.anteBonusWin : undefined}
                  sub={result.anteBonusWin > 0 ? result.playerEval.label : undefined}
                  accent={result.anteBonusWin > 0 ? '#ffd700' : undefined}
                />
              )}

              {/* 6 CARD BONUS — only if bet was placed */}
              {lastScBet > 0 && (
                <ResultRow
                  label="6 CARD BONUS"
                  outcome={
                    result.comparison === 'fold' ? 'loss'
                    : result.sixCardWin > 0 ? 'win'
                    : 'loss'
                  }
                  amount={
                    result.comparison === 'fold'
                      ? lastScBet
                      : Math.abs(result.sixCardWin) || lastScBet
                  }
                  sub={result.comparison !== 'fold' ? (result.sixCardEval?.label ?? undefined) : undefined}
                  accent={result.sixCardWin > 0 ? '#bf5fff' : undefined}
                />
              )}

              <View style={gs.resultDivider} />

              {/* NET RESULT — large, prominent */}
              <ResultRow
                label="NET RESULT"
                outcome={result.netDelta > 0 ? 'win' : result.netDelta < 0 ? 'loss' : 'push'}
                amount={Math.abs(result.netDelta) || undefined}
                isNet
              />
            </View>
            );
          })()}
        </View>

        {/* ── BETTING CONTROLS ── */}
        {phase === 'betting' && selectedTier && (
          <View style={gs.controls}>
            {/* Table info banner */}
            <View style={[gs.tableBanner, { borderColor: `${selectedTier.color}35` }]}>
              <LinearGradient
                colors={[`${selectedTier.color}14`, 'transparent']}
                style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={[gs.tableTierName, { color: selectedTier.color }]}>{selectedTier.label} TABLE</Text>
                <Text style={gs.tableAnteInfo}>
                  MIN BET {fmt(anteBet)} · PAIR+ up to 1M · 6CB up to 1M
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedTier(null)} style={gs.changeTableBtn} activeOpacity={0.75}>
                <Text style={gs.changeTableText}>CHANGE</Text>
              </TouchableOpacity>
            </View>

            <Text style={gs.controlHint}>
              Tap PAIR PLUS or 6 CARD BONUS to add side bets · {fmt(anteBet)} reserved for Play
            </Text>

            <View style={gs.dealRow}>
              <View style={gs.balInfo}>
                <Ionicons name="wallet-outline" size={12} color="rgba(255,215,0,0.5)" />
                <Text style={gs.balText}>{fmt(profile.chips)}</Text>
                {!canDeal && anteBet > 0 && profile.chips < totalRequired && (
                  <Text style={gs.reserveWarn}>  need {fmt(totalRequired - profile.chips)} more</Text>
                )}
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
          <View style={gs.decisionBlock}>
            {/* Decision banner */}
            <View style={gs.decisionBanner}>
              <View style={gs.decisionPill}>
                <Text style={gs.decisionLabel}>YOUR MOVE</Text>
              </View>
              <Text style={gs.decisionHint}>
                Fold to surrender ante  ·  Play to match {fmt(lastAnte)} and face the dealer
              </Text>
            </View>

            <View style={gs.actionRow}>
              <TouchableOpacity style={gs.foldBtn} onPress={handleFold} disabled={busy} activeOpacity={0.85}>
                <Text style={gs.foldBtnLabel}>FOLD</Text>
                <Text style={gs.foldBtnSub}>−{fmt(lastAnte)}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[gs.playBtn, !canPlay && gs.playBtnOff]}
                onPress={handlePlay} disabled={!canPlay || busy} activeOpacity={0.85}
              >
                <LinearGradient
                  colors={canPlay ? ['#ffd700', '#c89b00'] : ['#2a2a2a', '#1a1a1a']}
                  style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                />
                <View style={{ alignItems: 'center' }}>
                  <Text style={[gs.playBtnText, !canPlay && { color: '#444' }]}>PLAY</Text>
                  <Text style={[gs.playBtnSub, !canPlay && { color: '#444' }]}>+{fmt(lastAnte)} WAGER</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── RESULT BUTTONS ── */}
        {phase === 'result' && (
          <View style={gs.actionRow}>
            {/* NEW HAND — secondary, dark outline */}
            <TouchableOpacity style={gs.newHandBtn} onPress={handleNew} activeOpacity={0.82}>
              <Text style={gs.newHandLabel}>NEW HAND</Text>
              <Text style={gs.newHandSub}>Choose new wagers</Text>
            </TouchableOpacity>
            {/* REBET — primary, gold */}
            <TouchableOpacity style={gs.playBtn} onPress={handleRebet} activeOpacity={0.85}>
              <LinearGradient colors={['#ffd700', '#c89b00']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
              <View style={{ alignItems: 'center', gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="refresh" size={13} color="#000" />
                  <Text style={gs.playBtnText}>REBET  {fmt(lastAnte + lastPpBet + lastScBet)}</Text>
                </View>
                <Text style={gs.playBtnSub}>Repeat last wager</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <PaytableModal visible={showPT} onClose={() => setShowPT(false)} />

      <CasinoTableSelectModal
        visible={selectedTier === null}
        chips={profile.chips}
        onSelect={(tier) => setSelectedTier(tier)}
        onBack={() => router.back()}
        title="SELECT YOUR TABLE"
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const gs = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#04001a' },
  scroll:      { paddingHorizontal: 14, gap: 10 },

  // Header
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 6 },
  backBtn:     { width: 70, flexDirection: 'row', alignItems: 'center' },
  tableTitle:  { fontSize: 9, fontWeight: '900', fontFamily: 'Orbitron_700Bold', color: 'rgba(255,215,0,0.85)', letterSpacing: 1.5, flex: 1, textAlign: 'center' },
  headerRight: { width: 70, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 },
  iconBtn:     { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  ptBtn:       { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ptBtnText:   { fontSize: 7, fontWeight: '800', fontFamily: 'Orbitron_700Bold', color: 'rgba(255,215,0,0.55)', letterSpacing: 1 },

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
  controls:          { gap: 10 },
  controlHint:       { fontSize: 9, color: 'rgba(255,255,255,0.2)', textAlign: 'center', lineHeight: 13 },
  dealRow:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  // Table tier banner
  tableBanner:       {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)', overflow: 'hidden', gap: 8,
  },
  tableTierName:     { fontSize: 10, fontFamily: 'Orbitron_900Black', letterSpacing: 1.5 },
  tableAnteInfo:     { fontSize: 8, fontFamily: 'Orbitron_400Regular', color: 'rgba(255,255,255,0.3)', marginTop: 2, letterSpacing: 0.3 },
  changeTableBtn:    { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 7, borderWidth: 1, borderColor: 'rgba(0,212,255,0.3)', backgroundColor: 'rgba(0,212,255,0.07)' },
  changeTableText:   { fontSize: 8, fontFamily: 'Orbitron_700Bold', color: 'rgba(0,212,255,0.8)', letterSpacing: 1 },
  balInfo:      { flexDirection: 'row', alignItems: 'center', gap: 5 },
  balText:      { fontSize: 15, fontWeight: '900', fontFamily: 'Orbitron_900Black', color: 'rgba(255,215,0,0.7)' },
  reserveWarn:  { fontSize: 10, color: '#ff4466', fontWeight: '700' },
  dealBtn:      { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 18, paddingVertical: 13, borderRadius: 13, overflow: 'hidden' },
  dealBtnOff:   { opacity: 0.55 },
  dealBtnText:  { fontSize: 12, fontWeight: '900', fontFamily: 'Orbitron_700Bold', color: '#000' },

  // Decision banner (action phase)
  decisionBlock:  { gap: 8 },
  decisionBanner: { alignItems: 'center', gap: 5 },
  decisionPill:   {
    paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20,
    backgroundColor: 'rgba(0,212,255,0.1)', borderWidth: 1, borderColor: 'rgba(0,212,255,0.3)',
  },
  decisionLabel:  { fontSize: 9, fontWeight: '900', fontFamily: 'Orbitron_700Bold', color: '#00d4ff', letterSpacing: 2 },
  decisionHint:   { fontSize: 9, color: 'rgba(255,255,255,0.28)', fontFamily: 'Orbitron_400Regular', textAlign: 'center', lineHeight: 14 },

  // Hand comparison block (top of result panel)
  compBlock:       { gap: 8 },
  compHandRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  compSideLabel:   { fontSize: 8, fontWeight: '800', fontFamily: 'Orbitron_700Bold', color: 'rgba(255,255,255,0.3)', letterSpacing: 0, minWidth: 52, flexShrink: 0 },
  compHandName:    { fontSize: 12, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 0, flex: 1, textAlign: 'right', flexShrink: 1 },
  compVsDivider:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  compVsLine:      { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  compVsText:      { fontSize: 7, fontWeight: '800', fontFamily: 'Orbitron_700Bold', color: 'rgba(255,255,255,0.18)', letterSpacing: 1 },
  compVerdictPill: {
    borderWidth: 1, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12,
    alignItems: 'center', gap: 3, marginTop: 2,
  },
  compVerdictText: { fontSize: 10, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 0.5 },
  compReasonText:  { fontSize: 8, color: 'rgba(255,255,255,0.35)', fontFamily: 'Orbitron_400Regular', textAlign: 'center', lineHeight: 12 },

  // Action / result buttons
  actionRow:    { flexDirection: 'row', gap: 10 },
  newHandBtn:   {
    flex: 1, paddingVertical: 14, borderRadius: 13, borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.35)', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,212,255,0.06)', gap: 3,
  },
  newHandLabel: { fontSize: 12, fontWeight: '900', fontFamily: 'Orbitron_700Bold', color: 'rgba(0,212,255,0.9)' },
  newHandSub:   { fontSize: 8, fontFamily: 'Orbitron_400Regular', color: 'rgba(0,212,255,0.4)' },
  foldBtn:      {
    flex: 1, paddingVertical: 14, borderRadius: 13, borderWidth: 1,
    borderColor: 'rgba(255,85,85,0.3)', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,85,85,0.06)', gap: 2,
  },
  foldBtnLabel: { fontSize: 12, fontWeight: '900', fontFamily: 'Orbitron_700Bold', color: 'rgba(255,120,120,0.85)' },
  foldBtnSub:   { fontSize: 9, fontFamily: 'Orbitron_400Regular', color: 'rgba(255,100,100,0.5)' },
  playBtn:      {
    flex: 2, paddingVertical: 14, borderRadius: 13, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  playBtnOff:   { opacity: 0.5 },
  playBtnText:  { fontSize: 13, fontWeight: '900', fontFamily: 'Orbitron_900Black', color: '#000' },
  playBtnSub:   { fontSize: 9, fontWeight: '700', fontFamily: 'Orbitron_700Bold', color: 'rgba(0,0,0,0.6)' },
});
