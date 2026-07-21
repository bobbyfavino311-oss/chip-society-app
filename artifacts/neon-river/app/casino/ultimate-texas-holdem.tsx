import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated, Modal, Platform, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import PlayingCard from '@/components/PlayingCard';
import CasinoTableSelectModal from '@/components/CasinoTableSelectModal';
import { useUser } from '@/context/UserContext';
import { useSoundSettings } from '@/context/SoundContext';
import { useTableTheme } from '@/context/TableThemeContext';
import { MusicEngine } from '@/lib/musicEngine';
import colors from '@/constants/colors';
import { type CasinoTableLimit, buildBonusSteps } from '@/lib/casinoTableLimits';
import CasinoBetAdjuster from '@/components/CasinoBetAdjuster';
import {
  createUTHDeck, shuffleUTHDeck, dealUTHHands,
  resolveUTH, getLiveHandName,
  getBlindMultiplier, getTripsMultiplier,
  type UTHDeal, type UTHResult,
} from '@/lib/ultimateTexasHoldem';
import type { Card } from '@/lib/pokerEngine';

// ─── Types ────────────────────────────────────────────────────────────────────
type Phase = 'stake' | 'betting' | 'preflop' | 'flop' | 'turn_river' | 'showdown' | 'result';
const _BONUS_STEPS_FALLBACK: [0, number, number, number, number] = [0, 250_000, 500_000, 750_000, 1_000_000];
type TripsMult = 0 | 1 | 2 | 3 | 4;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number): string {
  const v = (x: number) => x % 1 === 0 ? x.toFixed(0) : x.toFixed(1);
  if (n >= 1_000_000_000) return `${v(n / 1_000_000_000)}B`;
  if (n >= 1_000_000)     return `${v(n / 1_000_000)}M`;
  if (n >= 1_000)         return `${v(n / 1_000)}K`;
  return String(n);
}
function fmtNet(n: number): string {
  if (n === 0) return 'PUSH';
  return (n > 0 ? '+' : '') + fmt(n);
}

function sleep(ms: number) {
  return new Promise<void>(r => setTimeout(r, ms));
}

// ─── Paytable ─────────────────────────────────────────────────────────────────
const BLIND_TABLE = [
  { hand: 'Royal Flush',    pays: '500 : 1' },
  { hand: 'Straight Flush', pays: '50 : 1'  },
  { hand: 'Four of a Kind', pays: '10 : 1'  },
  { hand: 'Full House',     pays: '3 : 1'   },
  { hand: 'Flush',          pays: '3 : 2'   },
  { hand: 'Straight',       pays: '1 : 1'   },
  { hand: 'Below Straight', pays: 'PUSH'    },
] as const;

const TRIPS_TABLE = [
  { hand: 'Royal Flush',      pays: '50 : 1' },
  { hand: 'Straight Flush',   pays: '40 : 1' },
  { hand: 'Four of a Kind',   pays: '30 : 1' },
  { hand: 'Full House',       pays: '8 : 1'  },
  { hand: 'Flush',            pays: '6 : 1'  },
  { hand: 'Straight',         pays: '5 : 1'  },
  { hand: 'Three of a Kind',  pays: '3 : 1'  },
  { hand: 'Below Three',      pays: 'LOSE'   },
] as const;

function PaytableModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={pm.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <TouchableOpacity style={pm.sheet} activeOpacity={1} onPress={() => {}}>
          <LinearGradient colors={['#0e002a', '#050010']} style={StyleSheet.absoluteFill} />
          <View style={pm.header}>
            <Text style={pm.title}>PAYTABLE</Text>
            <TouchableOpacity onPress={onClose} style={pm.closeBtn}>
              <Ionicons name="close" size={20} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            <Text style={pm.sectionTitle}>BLIND PAY TABLE</Text>
            <Text style={pm.sectionNote}>Pays when Player beats Dealer with Straight or better</Text>
            {BLIND_TABLE.map(r => (
              <View key={r.hand} style={pm.row}>
                <Text style={pm.handName}>{r.hand}</Text>
                <Text style={pm.handPays}>{r.pays}</Text>
              </View>
            ))}

            <Text style={[pm.sectionTitle, { marginTop: 18 }]}>TRIPS BONUS</Text>
            <Text style={pm.sectionNote}>Independent of Dealer's hand</Text>
            {TRIPS_TABLE.map(r => (
              <View key={r.hand} style={pm.row}>
                <Text style={pm.handName}>{r.hand}</Text>
                <Text style={pm.handPays}>{r.pays}</Text>
              </View>
            ))}

            <Text style={[pm.sectionTitle, { marginTop: 18 }]}>DEALER QUALIFICATION</Text>
            <Text style={[pm.sectionNote, { marginBottom: 6 }]}>
              Dealer must have Pair or better to qualify.{'\n'}
              If Dealer does not qualify — Ante Pushes. Play still pays. Blind resolves normally.
            </Text>
            <Text style={[pm.sectionTitle, { marginTop: 10 }]}>PLAY DECISIONS</Text>
            <View style={pm.row}><Text style={pm.handName}>Pre-Flop</Text><Text style={pm.handPays}>3× or 4×</Text></View>
            <View style={pm.row}><Text style={pm.handName}>Post-Flop</Text><Text style={pm.handPays}>2×</Text></View>
            <View style={pm.row}><Text style={pm.handName}>River</Text><Text style={pm.handPays}>1× or FOLD</Text></View>
            <View style={{ height: 30 }} />
          </ScrollView>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}
const pm = StyleSheet.create({
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  sheet:       { borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', maxHeight: '80%', padding: 20, gap: 10 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title:       { fontSize: 15, fontWeight: '900', fontFamily: 'Orbitron_900Black', color: '#00d4ff', letterSpacing: 3 },
  closeBtn:    { padding: 4 },
  sectionTitle:{ fontSize: 9, fontWeight: '800', fontFamily: 'Orbitron_700Bold', letterSpacing: 2, color: 'rgba(0,212,255,0.75)', marginTop: 6 },
  sectionNote: { fontSize: 9, color: 'rgba(255,255,255,0.3)', marginBottom: 4, lineHeight: 13 },
  row:         { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  handName:    { fontSize: 11, color: 'rgba(255,255,255,0.65)' },
  handPays:    { fontSize: 11, fontWeight: '800', fontFamily: 'Orbitron_700Bold', color: '#ffd700' },
});

// ─── Bet circle ───────────────────────────────────────────────────────────────
function BetCircle({ label, amount, active, accent = '#ffd700', small = false }: {
  label: string; amount: number; active: boolean; accent?: string; small?: boolean;
}) {
  const sz = small ? 62 : 72;
  return (
    <View style={[bc.wrap, { width: sz, height: sz, borderRadius: sz / 2, borderColor: active ? accent : `${accent}30` }]}>
      {active && <LinearGradient colors={[`${accent}25`, 'transparent']} style={StyleSheet.absoluteFill} />}
      <Text style={[bc.lbl, { color: active ? `${accent}bb` : `${accent}55`, fontSize: small ? 6 : 7 }]} numberOfLines={2} adjustsFontSizeToFit>
        {label}
      </Text>
      <Text style={[bc.amt, { color: active ? accent : `${accent}45`, fontSize: small ? 11 : 13 }]}>
        {amount > 0 ? fmt(amount) : '—'}
      </Text>
    </View>
  );
}

function TripsBetCircle({ mult, amount, onCycle, disabled }: {
  mult: TripsMult; amount: number; onCycle: () => void; disabled: boolean;
}) {
  const active = mult > 0;
  const accent = '#bf5fff';
  return (
    <TouchableOpacity onPress={onCycle} disabled={disabled} activeOpacity={0.75}>
      <View style={[bc.wrap, { width: 62, height: 62, borderRadius: 31, borderColor: active ? accent : `${accent}30` }]}>
        {active && <LinearGradient colors={[`${accent}30`, 'transparent']} style={StyleSheet.absoluteFill} />}
        <Text style={[bc.lbl, { color: active ? `${accent}bb` : `${accent}55`, fontSize: 6 }]} numberOfLines={2} adjustsFontSizeToFit>
          TRIPS
        </Text>
        <Text style={[bc.amt, { color: active ? accent : `${accent}45`, fontSize: 11 }]}>
          {active ? fmt(amount) : '—'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const bc = StyleSheet.create({
  wrap:     { borderWidth: 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', gap: 1 },
  lbl:      { fontWeight: '800', fontFamily: 'Orbitron_700Bold', letterSpacing: 0.5, textAlign: 'center', paddingHorizontal: 4 },
  amt:      { fontWeight: '900', fontFamily: 'Orbitron_900Black' },
  multBadge:{ fontSize: 7, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 0.5 },
});

// ─── Result row ───────────────────────────────────────────────────────────────
type RowOutcome = 'win' | 'loss' | 'push' | 'none';
const OUTCOME_COLORS: Record<RowOutcome, string> = {
  win:  '#00ff88',
  loss: '#ff4444',
  push: '#00d4ff',
  none: 'rgba(255,255,255,0.2)',
};

function ResultRow({ label, outcome, amount, sub, isNet }: {
  label: string; outcome: RowOutcome; amount?: number; sub?: string; isNet?: boolean;
}) {
  const color = OUTCOME_COLORS[outcome];
  let valueText: string;
  if (isNet) {
    valueText = outcome === 'win' && amount !== undefined ? `+${fmt(amount)}`
      : outcome === 'loss' && amount !== undefined ? `-${fmt(Math.abs(amount))}`
      : 'PUSH';
  } else if (outcome === 'win' && amount !== undefined) {
    valueText = `+${fmt(amount)}`;
  } else if (outcome === 'loss') {
    valueText = amount !== undefined ? `-${fmt(Math.abs(amount))}` : 'LOSS';
  } else if (outcome === 'push') {
    valueText = 'PUSH';
  } else {
    valueText = 'NO BET';
  }

  return (
    <View style={[rrr.row, isNet && rrr.netRow]}>
      <View style={{ flex: 1 }}>
        <Text style={[rrr.label, isNet && rrr.netLabel]}>{label}</Text>
        {sub ? <Text style={rrr.sub}>{sub}</Text> : null}
      </View>
      <Text style={[isNet ? rrr.netValue : rrr.value, { color }]}>{valueText}</Text>
    </View>
  );
}
const rrr = StyleSheet.create({
  row:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  netRow:   { paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', marginTop: 4 },
  label:    { fontSize: 9, fontFamily: 'Orbitron_400Regular', letterSpacing: 1, color: 'rgba(255,255,255,0.4)' },
  netLabel: { fontSize: 9, fontFamily: 'Orbitron_700Bold', letterSpacing: 1.5, color: 'rgba(255,255,255,0.6)' },
  sub:      { fontSize: 8, color: 'rgba(255,255,255,0.22)', marginTop: 1 },
  value:    { fontSize: 13, fontWeight: '900', fontFamily: 'Orbitron_900Black' },
  netValue: { fontSize: 22, fontWeight: '900', fontFamily: 'Orbitron_900Black' },
});

// ─── Card slot placeholder ─────────────────────────────────────────────────────
function CardSlot({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dims = { sm: [32,46], md: [46,64], lg: [60,84] }[size];
  return (
    <View style={{
      width: dims[0], height: dims[1], borderRadius: 8,
      borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)',
      borderStyle: 'dashed', backgroundColor: 'rgba(255,255,255,0.03)',
    }} />
  );
}

// ─── Live hand badge ──────────────────────────────────────────────────────────
const HAND_COLORS: Record<string, string> = {
  'ROYAL FLUSH':    '#ffd700',
  'STRAIGHT FLUSH': '#ff9900',
  'FOUR OF A KIND': '#ff6600',
  'FULL HOUSE':     '#bf5fff',
  'FLUSH':          '#00d4ff',
  'STRAIGHT':       '#00ff88',
  'THREE OF A KIND':'#00d4ff',
  'TWO PAIR':       '#ffffff',
  'ONE PAIR':       'rgba(255,255,255,0.6)',
  'HIGH CARD':      'rgba(255,255,255,0.35)',
};
function LiveHandBadge({ handName }: { handName: string }) {
  if (!handName) return null;
  const color = HAND_COLORS[handName] ?? 'rgba(255,255,255,0.4)';
  return (
    <View style={lh.badge}>
      <View style={[lh.dot, { backgroundColor: color }]} />
      <Text style={[lh.text, { color }]}>{handName}</Text>
    </View>
  );
}
const lh = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.45)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  dot:   { width: 6, height: 6, borderRadius: 3 },
  text:  { fontSize: 9, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 1.5 },
});

// ─── Action button ────────────────────────────────────────────────────────────
function ActionBtn({ label, sub, onPress, disabled, accent = '#00d4ff', fill }: {
  label: string; sub?: string; onPress: () => void; disabled?: boolean; accent?: string; fill?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[ab.btn, { borderColor: `${accent}60`, opacity: disabled ? 0.35 : 1 }, fill && { backgroundColor: `${accent}18` }]}
      onPress={onPress} disabled={disabled} activeOpacity={0.75}
    >
      <Text style={[ab.label, { color: accent }]}>{label}</Text>
      {sub ? <Text style={ab.sub}>{sub}</Text> : null}
    </TouchableOpacity>
  );
}
const ab = StyleSheet.create({
  btn:   { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 14, borderWidth: 1.5, minHeight: 52 },
  label: { fontFamily: 'Orbitron_700Bold', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  sub:   { fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 2, letterSpacing: 0.5 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function UltimateTexasHoldemScreen() {
  const insets   = useSafeAreaInsets();
  const { profile, addChips, removeChips } = useUser();
  const { isMusicMuted, toggleMusicMute } = useSoundSettings();
  const { theme } = useTableTheme();

  const accent  = theme.accentPrimary   || '#00d4ff';
  const accent2 = theme.accentSecondary || '#bf5fff';

  useEffect(() => {
    MusicEngine.configure({ muted: isMusicMuted });
    MusicEngine.play();
    return () => { MusicEngine.stop(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    MusicEngine.configure({ muted: isMusicMuted });
  }, [isMusicMuted]);

  // ── Core state ──────────────────────────────────────────────────────────────
  const [selectedTier,   setSelectedTier]   = useState<CasinoTableLimit | null>(null);
  const [ante,           setAnte]           = useState(0);
  const BONUS_STEPS: [0, number, number, number, number] = selectedTier
    ? buildBonusSteps(selectedTier)
    : _BONUS_STEPS_FALLBACK;
  const [phase,          setPhase]          = useState<Phase>('stake');
  const [deal,           setDeal]           = useState<UTHDeal | null>(null);
  const [communityCount, setCommunityCount] = useState(0);
  const [dealerRevealed, setDealerRevealed] = useState(false);
  const [playMult,       setPlayMult]       = useState(0);
  const [tripsMult,      setTripsMult]      = useState<TripsMult>(0);
  const [folded,         setFolded]         = useState(false);
  const [result,         setResult]         = useState<UTHResult | null>(null);
  const [busy,           setBusy]           = useState(false);
  const [showPT,         setShowPT]         = useState(false);
  const [resultAnim]                        = useState(new Animated.Value(0));
  const [handHistogram, setHandHistogram]   = useState({ handsPlayed: 0, wins: 0, netProfit: 0 });

  // ── Derived values ──────────────────────────────────────────────────────────
  const tripsBet   = BONUS_STEPS[tripsMult];
  const totalCost  = ante + ante + tripsBet; // ante + blind + trips upfront
  const canDeal    = ante > 0 && profile.chips >= totalCost && !busy;
  const liveCommunity = deal?.community.slice(0, communityCount) ?? [];
  const liveHandName  = deal
    ? getLiveHandName(deal.playerHole, liveCommunity)
    : '';

  // ── Trips cycle (only in betting phase) ─────────────────────────────────────
  const cycleTrips = useCallback(() => {
    if (phase !== 'betting' || busy) return;
    Haptics.selectionAsync();
    const next = ((tripsMult + 1) % 5) as TripsMult;
    const costIfNext = ante + ante + BONUS_STEPS[next];
    setTripsMult(next > 0 && costIfNext > profile.chips ? 0 : next);
  }, [phase, busy, tripsMult, ante, profile.chips]);

  // ── DEAL ─────────────────────────────────────────────────────────────────────
  const handleDeal = useCallback(async () => {
    if (!canDeal) return;
    setBusy(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Deduct ante + blind + trips
    await removeChips(totalCost);

    const deck   = shuffleUTHDeck(createUTHDeck());
    const hands  = dealUTHHands(deck);
    setDeal(hands);
    setCommunityCount(0);
    setDealerRevealed(false);
    setPlayMult(0);
    setFolded(false);
    setResult(null);

    setPhase('preflop');
    await sleep(350);
    setBusy(false);
  }, [canDeal, totalCost, removeChips]);

  // ── PRE-FLOP DECISION ────────────────────────────────────────────────────────
  const handlePreflop = useCallback(async (mult: 0 | 3 | 4) => {
    if (busy || !deal) return;
    if (mult > 0 && profile.chips < ante * mult) return; // balance guard
    setBusy(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (mult > 0) {
      setPlayMult(mult);
      await removeChips(ante * mult);
    }

    // Reveal flop (3 cards)
    setPhase('flop');
    for (let i = 1; i <= 3; i++) {
      await sleep(260);
      setCommunityCount(i);
    }

    if (mult > 0) {
      // Already played — reveal turn + river then showdown
      await sleep(400);
      for (let i = 4; i <= 5; i++) {
        await sleep(300);
        setCommunityCount(i);
      }
      await doShowdown(deal, mult, false);
    } else {
      // Checked — move to flop decision
      setPhase('flop');
      setBusy(false);
    }
  }, [busy, deal, ante, profile.chips, removeChips]);

  // ── FLOP DECISION ────────────────────────────────────────────────────────────
  const handleFlop = useCallback(async (mult: 0 | 2) => {
    if (busy || !deal) return;
    if (mult > 0 && profile.chips < ante * mult) return; // balance guard
    setBusy(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (mult > 0) {
      setPlayMult(mult);
      await removeChips(ante * mult);
    }

    // Reveal turn + river
    setPhase('turn_river');
    await sleep(300);
    setCommunityCount(4);
    await sleep(340);
    setCommunityCount(5);

    if (mult > 0) {
      await doShowdown(deal, mult, false);
    } else {
      // Checked again — move to river decision
      setPhase('turn_river');
      setBusy(false);
    }
  }, [busy, deal, ante, profile.chips, removeChips]);

  // ── RIVER DECISION ───────────────────────────────────────────────────────────
  const handleRiver = useCallback(async (mult: 0 | 1, fold: boolean) => {
    if (busy || !deal) return;
    if (!fold && mult > 0 && profile.chips < ante * mult) return; // balance guard
    setBusy(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (fold) {
      setFolded(true);
      await doShowdown(deal, 0, true);
    } else {
      setPlayMult(mult);
      await removeChips(ante * mult);
      await doShowdown(deal, mult, false);
    }
  }, [busy, deal, ante, profile.chips, removeChips]);

  // ── SHOWDOWN ──────────────────────────────────────────────────────────────────
  const doShowdown = useCallback(async (
    d: UTHDeal,
    pMult: number,
    fold: boolean,
  ) => {
    setPhase('showdown');
    await sleep(400);

    // Reveal dealer
    setDealerRevealed(true);
    await sleep(600);

    MusicEngine.configure({ intensity: 'showdown' } as any);

    const r = resolveUTH(
      d.playerHole,
      d.dealerHole,
      d.community,
      ante,
      pMult,
      tripsBet,
      fold,
    );
    setResult(r);

    // Add winnings back
    if (r.chipReturn > 0) {
      await addChips(r.chipReturn);
    }

    // Update histogram
    setHandHistogram(prev => ({
      handsPlayed: prev.handsPlayed + 1,
      wins: prev.wins + (r.comparison === 'player' ? 1 : 0),
      netProfit: prev.netProfit + r.chipReturn - totalCost - (fold ? 0 : ante * pMult),
    }));

    // Animate results in
    Animated.spring(resultAnim, { toValue: 1, tension: 45, friction: 8, useNativeDriver: true }).start();

    setPhase('result');
    setBusy(false);
  }, [ante, tripsBet, addChips, resultAnim, totalCost]);

  // ── NEW HAND ──────────────────────────────────────────────────────────────────
  const handleNewHand = useCallback(() => {
    resultAnim.setValue(0);
    setPhase('betting');
    setDeal(null);
    setCommunityCount(0);
    setDealerRevealed(false);
    setPlayMult(0);
    setTripsMult(0);
    setFolded(false);
    setResult(null);
    setBusy(false);
    MusicEngine.configure({ intensity: 'normal' } as any);
  }, [resultAnim]);

  // ── STAKE SELECT ──────────────────────────────────────────────────────────────
  function handleSelectTier(tier: CasinoTableLimit) {
    setSelectedTier(tier);
    setAnte(tier.minBet);
    setPhase('betting');
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  const bgGrad: [string, string, string] = theme.bgGradient
    ? [theme.bgGradient[0], theme.bgGradient[2], theme.bgGradient[4]] as [string,string,string]
    : ['#050010', '#0a001e', '#050010'];

  const dealerCards = deal?.dealerHole ?? [];
  const playerCards = deal?.playerHole ?? [];
  const community   = deal?.community  ?? [];

  const showPreflopBtns   = phase === 'preflop'    && !busy && playMult === 0;
  const showFlopBtns      = phase === 'flop'       && !busy && playMult === 0;
  const showRiverBtns     = phase === 'turn_river' && !busy && playMult === 0 && !folded;
  const inGame            = ['preflop','flop','turn_river','showdown','result'].includes(phase);

  // ── Affordability guards (chips already deducted for ante+blind+trips) ────────
  const canAfford = (mult: number) => profile.chips >= ante * mult;
  const playSubLabel = (mult: number) =>
    canAfford(mult) ? fmt(ante * mult) : 'INSUFFICIENT';

  // ── RESULT net calc for display ───────────────────────────────────────────────
  let totalNet = 0;
  let netOutcome: 'win' | 'loss' | 'push' = 'push';
  if (result) {
    totalNet = result.playNet + result.anteNet + result.blindNet + result.tripsNet;
    netOutcome = totalNet > 0 ? 'win' : totalNet < 0 ? 'loss' : 'push';
  }

  return (
    <View style={s.root}>
      <LinearGradient colors={bgGrad} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 16 : 8) }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        <View style={s.headerCenter}>
          <Text style={[s.headerTitle, { color: accent }]}>ULTIMATE HOLD'EM</Text>
          {selectedTier && (
            <Text style={s.headerSub}>{selectedTier.label} · MIN BET {fmt(ante)}</Text>
          )}
        </View>

        <View style={s.headerRight}>
          <TouchableOpacity onPress={() => setShowPT(true)} style={[s.iconBtn, { borderColor: `${accent}50`, borderWidth: 1 }]} hitSlop={10}>
            <Ionicons name="information-circle-outline" size={20} color={`${accent}dd`} />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleMusicMute} style={[s.iconBtn, isMusicMuted && s.iconBtnMuted]} hitSlop={10}>
            <Ionicons name={isMusicMuted ? 'musical-notes-outline' : 'musical-notes'} size={18} color={isMusicMuted ? 'rgba(255,255,255,0.28)' : `${accent}dd`} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── TABLE ──────────────────────────────────────────────────────────────── */}
      <View style={s.table}>

        {/* Dealer area */}
        <View style={s.dealerArea}>
          <Text style={s.areaLabel}>DEALER</Text>
          <View style={s.cardRow}>
            {[0, 1].map(i => (
              dealerCards[i]
                ? <PlayingCard key={i} card={dealerCards[i]} faceDown={!dealerRevealed} size="md" animated />
                : <CardSlot key={i} size="md" />
            ))}
          </View>
          {dealerRevealed && result && (
            <Text style={[s.handLabel, { color: result.dealerQualified ? '#ffd700' : 'rgba(255,255,255,0.35)' }]}>
              {result.dealerQualified ? result.dealerHand.name.toUpperCase() : 'DOES NOT QUALIFY'}
            </Text>
          )}
          {!dealerRevealed && inGame && (
            <Text style={s.qualNote}>Dealer qualifies with Pair or better</Text>
          )}
        </View>

        {/* Community cards */}
        <View style={s.communityArea}>
          <View style={s.communityRow}>
            {[0, 1, 2, 3, 4].map(i => (
              community[i] && i < communityCount
                ? <PlayingCard key={i} card={community[i]} size="md" animated />
                : <CardSlot key={i} size="md" />
            ))}
          </View>
        </View>

        {/* Player cards */}
        <View style={s.playerArea}>
          <View style={s.cardRow}>
            {[0, 1].map(i => (
              playerCards[i]
                ? <PlayingCard key={i} card={playerCards[i]} faceDown={false} size="lg" highlighted={result?.comparison === 'player'} animated />
                : <CardSlot key={i} size="lg" />
            ))}
          </View>

          {/* Chip balance — player station */}
          <View style={s.playerChipRow}>
            <View style={s.chipDot} />
            <Text style={[s.playerChipAmt, { fontFamily: 'Inter_700Bold' }]}>{fmt(profile.chips)}</Text>
            {handHistogram.handsPlayed > 0 && (
              <Text style={s.sessionStat}>{handHistogram.handsPlayed}H · {handHistogram.wins}W</Text>
            )}
          </View>

          {/* Hand evaluation — live while in game, final hand at result */}
          {phase !== 'betting' && phase !== 'stake' && liveHandName ? (
            <LiveHandBadge handName={liveHandName} />
          ) : (result && phase === 'result') ? (
            <Text style={[s.handLabel, { color: result.comparison === 'player' ? '#00ff88' : result.comparison === 'dealer' ? '#ff4444' : '#00d4ff' }]}>
              {result.playerHand.name.toUpperCase()}
            </Text>
          ) : null}

          <Text style={s.areaLabel}>YOU</Text>
        </View>

        {/* Bet circles */}
        <View style={s.betCirclesRow}>
          <TripsBetCircle
            mult={tripsMult}
            amount={tripsBet}
            onCycle={cycleTrips}
            disabled={phase !== 'betting' || busy}
          />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <BetCircle
              label="ANTE"
              amount={inGame || phase === 'betting' ? ante : 0}
              active={inGame || (phase === 'betting' && ante > 0)}
              accent="#ffd700"
            />
            <Text style={s.equalSign}>=</Text>
            <BetCircle
              label="BLIND"
              amount={inGame || phase === 'betting' ? ante : 0}
              active={inGame || (phase === 'betting' && ante > 0)}
              accent="#ffd700"
            />
          </View>

          <BetCircle
            label="PLAY"
            amount={playMult > 0 ? ante * playMult : 0}
            active={playMult > 0}
            accent={accent}
            small
          />
        </View>
      </View>

      {/* ── ACTION PANEL ───────────────────────────────────────────────────────── */}
      <View style={[s.actionPanel, { paddingBottom: insets.bottom + 8 }]}>

        {/* BETTING phase — DEAL button */}
        {phase === 'betting' && (
          <>
            {selectedTier && (
              <CasinoBetAdjuster
                value={ante}
                limit={selectedTier}
                onChange={setAnte}
                label="ANTE + BLIND"
                accent={accent}
              />
            )}
          <View style={s.btnRow}>
            <TouchableOpacity
              style={[s.dealBtn, !canDeal && { opacity: 0.4 }, { borderColor: `${accent}80`, backgroundColor: `${accent}14` }]}
              onPress={handleDeal}
              disabled={!canDeal}
              activeOpacity={0.8}
            >
              <LinearGradient colors={[`${accent}22`, 'transparent']} style={StyleSheet.absoluteFill} />
              <Text style={[s.dealBtnText, { color: accent }]}>DEAL</Text>
              {ante > 0 && (
                <Text style={s.dealBtnSub}>
                  {fmt(ante)} ANTE + {fmt(ante)} BLIND{tripsBet > 0 ? ` + ${fmt(tripsBet)} TRIPS` : ''}
                </Text>
              )}
            </TouchableOpacity>
          </View>
          </>
        )}

        {/* PRE-FLOP decision */}
        {showPreflopBtns && (
          <>
            <Text style={s.decisionLabel}>PRE-FLOP DECISION</Text>
            <View style={s.btnRow}>
              <ActionBtn label="CHECK"   onPress={() => handlePreflop(0)} accent="rgba(255,255,255,0.45)" />
              <ActionBtn label="PLAY 3×" sub={playSubLabel(3)} onPress={() => handlePreflop(3)} accent={accent}   fill disabled={!canAfford(3)} />
              <ActionBtn label="PLAY 4×" sub={playSubLabel(4)} onPress={() => handlePreflop(4)} accent="#00ff88" fill disabled={!canAfford(4)} />
            </View>
          </>
        )}

        {/* FLOP decision */}
        {showFlopBtns && (
          <>
            <Text style={s.decisionLabel}>FLOP DECISION</Text>
            <View style={s.btnRow}>
              <ActionBtn label="CHECK"   onPress={() => handleFlop(0)} accent="rgba(255,255,255,0.45)" />
              <ActionBtn label="PLAY 2×" sub={playSubLabel(2)} onPress={() => handleFlop(2)} accent={accent} fill disabled={!canAfford(2)} />
            </View>
          </>
        )}

        {/* RIVER decision */}
        {showRiverBtns && (
          <>
            <Text style={s.decisionLabel}>RIVER — FINAL DECISION</Text>
            <View style={s.btnRow}>
              <ActionBtn label="FOLD"    sub="Lose Ante + Blind" onPress={() => handleRiver(0, true)}  accent="#ff4444" />
              <ActionBtn label="PLAY 1×" sub={playSubLabel(1)}   onPress={() => handleRiver(1, false)} accent={accent}  fill disabled={!canAfford(1)} />
            </View>
          </>
        )}

        {/* Waiting / dealing animation text */}
        {busy && phase !== 'result' && (
          <View style={s.busyRow}>
            <Text style={[s.busyText, { color: `${accent}99` }]}>
              {phase === 'showdown' ? 'REVEALING DEALER...' : 'DEALING...'}
            </Text>
          </View>
        )}

        {/* RESULT panel */}
        {phase === 'result' && result && (
          <Animated.View style={[s.resultPanel, { opacity: resultAnim, transform: [{ translateY: resultAnim.interpolate({ inputRange: [0,1], outputRange: [30, 0] }) }] }]}>
            <View style={s.resultHeader}>
              <Text style={[s.resultTitle, { color: netOutcome === 'win' ? '#00ff88' : netOutcome === 'loss' ? '#ff4444' : '#00d4ff' }]}>
                {netOutcome === 'win' ? '✓ YOU WIN' : netOutcome === 'loss' ? '✗ YOU LOSE' : '= PUSH'}
              </Text>
              {!result.dealerQualified && (
                <View style={s.qualBadge}>
                  <Text style={s.qualBadgeText}>DEALER DID NOT QUALIFY · ANTE PUSHES</Text>
                </View>
              )}
            </View>

            {result.comparison !== 'folded' ? (
              <>
                <ResultRow
                  label="PLAY"
                  outcome={result.playNet > 0 ? 'win' : result.playNet < 0 ? 'loss' : 'push'}
                  amount={Math.abs(result.playNet)}
                  sub={`${playMult}× Ante`}
                />
                <ResultRow
                  label="ANTE"
                  outcome={result.anteNet > 0 ? 'win' : result.anteNet < 0 ? 'loss' : 'push'}
                  amount={Math.abs(result.anteNet)}
                  sub={result.dealerQualified ? undefined : 'Dealer not qualified — push'}
                />
                <ResultRow
                  label="BLIND"
                  outcome={result.blindNet > 0 ? 'win' : 'push'}
                  amount={result.blindNet > 0 ? result.blindNet : undefined}
                  sub={result.blindNet > 0
                    ? `${result.playerHand.name} · ${getBlindMultiplier(result.playerHand)}:1`
                    : result.comparison === 'player' ? 'Below Straight — push' : 'Push'}
                />
                {tripsBet > 0 && (
                  <ResultRow
                    label="TRIPS BONUS"
                    outcome={result.tripsNet > 0 ? 'win' : 'loss'}
                    amount={result.tripsNet > 0 ? result.tripsNet : tripsBet}
                    sub={result.tripsNet > 0
                      ? `${result.playerHand.name} · ${getTripsMultiplier(result.playerHand)}:1`
                      : 'No qualifying hand'}
                  />
                )}
              </>
            ) : (
              <>
                <ResultRow label="ANTE" outcome="loss" amount={ante} sub="Folded" />
                <ResultRow label="BLIND" outcome="loss" amount={ante} sub="Folded" />
                {tripsBet > 0 && (
                  <ResultRow
                    label="TRIPS BONUS"
                    outcome={result.tripsNet > 0 ? 'win' : 'loss'}
                    amount={result.tripsNet > 0 ? result.tripsNet : tripsBet}
                    sub={result.tripsNet > 0 ? result.playerHand.name : 'No qualifying hand'}
                  />
                )}
              </>
            )}

            <ResultRow
              label="TOTAL"
              outcome={netOutcome}
              amount={Math.abs(totalNet)}
              isNet
            />

            <TouchableOpacity
              style={[s.newHandBtn, { borderColor: `${accent}60`, backgroundColor: `${accent}12` }]}
              onPress={handleNewHand}
              activeOpacity={0.8}
            >
              <Text style={[s.newHandText, { color: accent }]}>NEXT HAND</Text>
              <Ionicons name="arrow-forward" size={14} color={accent} />
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      {/* Paytable modal */}
      <PaytableModal visible={showPT} onClose={() => setShowPT(false)} />

      {/* Stake select */}
      <CasinoTableSelectModal
        visible={phase === 'stake'}
        chips={profile.chips}
        title="ULTIMATE HOLD'EM"
        onBack={() => router.back()}
        onSelect={handleSelectTier}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#050010' },

  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 6, gap: 8 },
  backBtn:      { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle:  { fontSize: 13, fontWeight: '900', fontFamily: 'Orbitron_900Black', letterSpacing: 2 },
  headerSub:    { fontSize: 9, color: 'rgba(255,255,255,0.35)', marginTop: 1, letterSpacing: 0.5 },
  headerRight:  { flexDirection: 'row', gap: 6 },
  iconBtn:      { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)' },
  iconBtnMuted: { backgroundColor: 'rgba(255,255,255,0.03)' },

  sessionStat:  { fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.5 },

  table:        { flex: 1, paddingHorizontal: 14, paddingVertical: 2, gap: 4, justifyContent: 'space-between' },

  dealerArea:   { alignItems: 'center', gap: 4 },
  playerArea:   { alignItems: 'center', gap: 4 },
  communityArea:{ alignItems: 'center', gap: 4 },

  playerChipRow:{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 3 },
  chipDot:      { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ffd700', borderWidth: 2, borderColor: 'rgba(255,215,0,0.4)' },
  playerChipAmt:{ fontSize: 14, color: '#ffd700', letterSpacing: 0.5 },
  areaLabel:    { fontSize: 7, fontWeight: '800', fontFamily: 'Orbitron_700Bold', letterSpacing: 2, color: 'rgba(255,255,255,0.25)' },
  cardRow:      { flexDirection: 'row', gap: 8, alignItems: 'center' },
  communityRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  handLabel:    { fontSize: 9, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 1.5, marginTop: 2 },
  qualNote:     { fontSize: 8, color: 'rgba(255,255,255,0.22)', letterSpacing: 0.5 },

  handAnalyzer: { marginTop: 2 },

  betCirclesRow:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  equalSign:    { fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: '700' },

  actionPanel:  { backgroundColor: 'rgba(0,0,0,0.6)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)', paddingHorizontal: 14, paddingTop: 10, gap: 8 },

  decisionLabel:{ fontSize: 8, fontFamily: 'Orbitron_400Regular', letterSpacing: 2, color: 'rgba(255,255,255,0.3)', textAlign: 'center' },
  btnRow:       { flexDirection: 'row', gap: 8 },

  dealBtn:      { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 16, borderWidth: 2, overflow: 'hidden', gap: 3 },
  dealBtnText:  { fontFamily: 'Orbitron_900Black', fontSize: 18, fontWeight: '900', letterSpacing: 3 },
  dealBtnSub:   { fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.5 },

  busyRow:      { alignItems: 'center', paddingVertical: 8 },
  busyText:     { fontSize: 9, fontFamily: 'Orbitron_400Regular', letterSpacing: 3 },

  resultPanel:  { gap: 2, backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  resultHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  resultTitle:  { fontSize: 13, fontWeight: '900', fontFamily: 'Orbitron_900Black', letterSpacing: 2 },
  qualBadge:    { borderRadius: 6, backgroundColor: 'rgba(255,215,0,0.08)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.25)', paddingHorizontal: 6, paddingVertical: 2 },
  qualBadgeText:{ fontSize: 7, fontFamily: 'Orbitron_700Bold', color: 'rgba(255,215,0,0.7)', letterSpacing: 0.5 },

  newHandBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, marginTop: 4, overflow: 'hidden' },
  newHandText:  { fontFamily: 'Orbitron_700Bold', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
});
