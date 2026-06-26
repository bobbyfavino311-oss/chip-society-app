/**
 * Let It Ride — Chip Society premium casino game
 * Build a 5-card poker hand from 3 personal cards + 2 community cards.
 * Two withdrawal decisions reduce your exposure before community reveals.
 */
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
import StakeSelectModal from '@/components/StakeSelectModal';
import { useUser } from '@/context/UserContext';
import { useTableTheme } from '@/context/TableThemeContext';
import { useSoundSettings } from '@/context/SoundContext';
import { MusicEngine } from '@/lib/musicEngine';
import type { StakeTier } from '@/lib/stakeConfig';
import {
  dealLetItRide, evaluateLetItRide, resolveLetItRide,
  getMainMult, getBonusMult, BONUS_PAYOUTS,
  type LIRCard, type LIRPhase, type LIRResult,
} from '@/lib/letItRide';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) {
    const v = abs / 1_000_000_000;
    return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}B`;
  }
  if (abs >= 1_000_000) {
    const v = abs / 1_000_000;
    return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}M`;
  }
  if (abs >= 1_000) {
    const v = abs / 1_000;
    return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}K`;
  }
  return String(abs);
}
function sleep(ms: number) { return new Promise<void>(r => setTimeout(r, ms)); }

// ─── Paytable / Info Modal ────────────────────────────────────────────────────
function InfoModal({ visible, onClose, accent }: { visible: boolean; onClose: () => void; accent: string }) {
  const MAIN = [
    ['Royal Flush',      '1000 : 1'],
    ['Straight Flush',    '200 : 1'],
    ['Four of a Kind',     '50 : 1'],
    ['Full House',         '11 : 1'],
    ['Flush',               '8 : 1'],
    ['Straight',            '5 : 1'],
    ['Three of a Kind',     '3 : 1'],
    ['Two Pair',            '2 : 1'],
    ['Pair of 10s or Better','1 : 1'],
    ['Below Pair of 10s', 'LOSE'],
  ];
  const BONUS = [
    ['Royal Flush',    '20,000 : 1'],
    ['Straight Flush',  '2,000 : 1'],
    ['Four of a Kind',    '400 : 1'],
    ['Full House',        '200 : 1'],
    ['Flush',              '50 : 1'],
    ['Straight',           '25 : 1'],
    ['Three of a Kind',     '5 : 1'],
    ['Below Trips',         'LOSE'],
  ];
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={pt.overlay} activeOpacity={1} onPress={onClose}>
        <View style={pt.sheet}>
          <LinearGradient colors={['#0a0020', '#050010']} style={StyleSheet.absoluteFill} />
          <View style={pt.hdr}>
            <Text style={[pt.title, { color: accent }]}>LET IT RIDE</Text>
            <TouchableOpacity onPress={onClose} style={pt.close}>
              <Ionicons name="close" size={20} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520 }}>
            {/* How to play */}
            <View style={pt.section}>
              <Text style={[pt.sectionTitle, { color: accent }]}>HOW TO PLAY</Text>
              {[
                'Place three equal bets (1 · 2 · $) + optional Bonus Bet.',
                'Receive 3 personal cards + 2 face-down community cards.',
                'After seeing your cards: keep or pull back Bet 1.',
                'First community card revealed: keep or pull back Bet 2.',
                'Second community card revealed: Bet $ can never be withdrawn.',
                'Best 5-card hand is paid on all remaining active bets.',
                'Minimum winning hand: Pair of Tens or Better.',
              ].map((line, i) => (
                <View key={i} style={pt.bullet}>
                  <Text style={[pt.bulletDot, { color: accent }]}>·</Text>
                  <Text style={pt.bulletText}>{line}</Text>
                </View>
              ))}
            </View>

            {/* Main payout */}
            <View style={pt.section}>
              <Text style={[pt.sectionTitle, { color: accent }]}>MAIN PAYOUT (PER ACTIVE BET)</Text>
              {MAIN.map(([hand, pay]) => (
                <View key={hand} style={pt.payRow}>
                  <Text style={pt.payHand}>{hand}</Text>
                  <Text style={[pt.payAmt, { color: pay === 'LOSE' ? '#ff4444' : '#ffd700' }]}>{pay}</Text>
                </View>
              ))}
            </View>

            {/* Bonus payout */}
            <View style={pt.section}>
              <Text style={[pt.sectionTitle, { color: accent }]}>BONUS BET PAYOUT</Text>
              <Text style={pt.sectionNote}>Bonus Bet is independent. Three of a Kind or better wins.</Text>
              {BONUS.map(([hand, pay]) => (
                <View key={hand} style={pt.payRow}>
                  <Text style={pt.payHand}>{hand}</Text>
                  <Text style={[pt.payAmt, { color: pay === 'LOSE' ? '#ff4444' : '#bf5fff' }]}>{pay}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
const pt = StyleSheet.create({
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  sheet:       { borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', padding: 20, paddingBottom: 32 },
  hdr:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  title:       { fontSize: 14, fontWeight: '900', fontFamily: 'Orbitron_900Black', letterSpacing: 3 },
  close:       { padding: 4 },
  section:     { marginBottom: 14 },
  sectionTitle:{ fontSize: 9, fontWeight: '800', fontFamily: 'Orbitron_700Bold', letterSpacing: 2, marginBottom: 6 },
  sectionNote: { fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 6, lineHeight: 15 },
  bullet:      { flexDirection: 'row', gap: 6, marginBottom: 4 },
  bulletDot:   { fontSize: 13, lineHeight: 18 },
  bulletText:  { flex: 1, fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 17 },
  payRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  payHand:     { fontSize: 10, color: 'rgba(255,255,255,0.55)', fontFamily: 'Orbitron_400Regular', letterSpacing: 0.5 },
  payAmt:      { fontSize: 11, fontWeight: '800', fontFamily: 'Orbitron_700Bold' },
});

// ─── Bet circle ───────────────────────────────────────────────────────────────
function BetCircle({ label, amount, active, returned, accent = '#ffd700', small }: {
  label: string; amount: number; active: boolean; returned?: boolean; accent?: string; small?: boolean;
}) {
  const sz = small ? 62 : 74;
  return (
    <View style={[bcirc.wrap, { width: sz, height: sz, borderRadius: sz / 2, borderColor: returned ? 'rgba(255,255,255,0.12)' : active ? accent : `${accent}30` }]}>
      {active && !returned && <LinearGradient colors={[`${accent}30`, 'transparent']} style={StyleSheet.absoluteFill} />}
      <Text style={[bcirc.lbl, { color: returned ? 'rgba(255,255,255,0.25)' : active ? `${accent}cc` : `${accent}44`, fontSize: returned ? 6.5 : 7 }]}>
        {returned ? 'RETURNED' : label}
      </Text>
      <Text style={[bcirc.amt, { color: returned ? 'rgba(255,255,255,0.2)' : active ? accent : `${accent}40`, fontFamily: 'Inter_700Bold', fontSize: small ? 11 : 12 }]}>
        {returned ? fmt(amount) : amount > 0 ? fmt(amount) : '—'}
      </Text>
    </View>
  );
}
const bcirc = StyleSheet.create({
  wrap: { borderWidth: 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', gap: 1 },
  lbl:  { fontWeight: '800', fontFamily: 'Orbitron_700Bold', letterSpacing: 0.5, textAlign: 'center' },
  amt:  { fontWeight: '900' },
});

// ─── Action button ────────────────────────────────────────────────────────────
function ActionBtn({ label, sub, onPress, disabled, accent = '#00d4ff', fill, danger }: {
  label: string; sub?: string; onPress: () => void;
  disabled?: boolean; accent?: string; fill?: boolean; danger?: boolean;
}) {
  const c = danger ? '#ff6644' : accent;
  return (
    <TouchableOpacity
      style={[abt.btn, { borderColor: `${c}65`, opacity: disabled ? 0.35 : 1 }, fill && { backgroundColor: `${c}18` }]}
      onPress={onPress} disabled={disabled} activeOpacity={0.75}
    >
      {fill && <LinearGradient colors={[`${c}20`, 'transparent']} style={StyleSheet.absoluteFill} />}
      <Text style={[abt.label, { color: c }]}>{label}</Text>
      {sub ? <Text style={abt.sub}>{sub}</Text> : null}
    </TouchableOpacity>
  );
}
const abt = StyleSheet.create({
  btn:   { flex: 1, borderWidth: 1.5, borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', gap: 3, overflow: 'hidden' },
  label: { fontSize: 12, fontWeight: '900', fontFamily: 'Orbitron_900Black', letterSpacing: 1.5 },
  sub:   { fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.5 },
});

// ─── Card slot placeholder ────────────────────────────────────────────────────
function CardSlot({ size }: { size: 'md' | 'lg' }) {
  const dims = size === 'lg' ? { w: 60, h: 84 } : { w: 46, h: 64 };
  return (
    <View style={{
      width: dims.w, height: dims.h, borderRadius: 10,
      borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.10)',
      borderStyle: 'dashed', backgroundColor: 'rgba(255,255,255,0.03)',
    }} />
  );
}

// ─── Result row ───────────────────────────────────────────────────────────────
function ResultRow({ label, net, sub }: { label: string; net: number | 'returned'; sub?: string }) {
  const isReturned = net === 'returned';
  const color = isReturned ? 'rgba(255,255,255,0.35)' : net > 0 ? '#00ff88' : net < 0 ? '#ff4444' : '#00d4ff';
  const text  = isReturned ? 'RETURNED' : net > 0 ? `+${fmt(net)}` : net < 0 ? `-${fmt(Math.abs(net))}` : 'PUSH';
  return (
    <View style={rrow.row}>
      <View style={{ flex: 1 }}>
        <Text style={rrow.label}>{label}</Text>
        {sub ? <Text style={rrow.sub}>{sub}</Text> : null}
      </View>
      <Text style={[rrow.value, { color, fontFamily: 'Inter_700Bold' }]}>{text}</Text>
    </View>
  );
}
const rrow = StyleSheet.create({
  row:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  label: { fontSize: 9, fontFamily: 'Orbitron_400Regular', letterSpacing: 1, color: 'rgba(255,255,255,0.4)' },
  sub:   { fontSize: 8, color: 'rgba(255,255,255,0.25)', marginTop: 1 },
  value: { fontSize: 13, fontWeight: '900' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function LetItRideScreen() {
  const insets = useSafeAreaInsets();
  const { profile, addChips, removeChips } = useUser();
  const { theme } = useTableTheme();
  const { isMusicMuted, toggleMusicMute } = useSoundSettings();

  const accent  = theme.accentPrimary   || '#00D4C8';
  const accent2 = theme.accentSecondary || '#bf5fff';

  // ── Game state ────────────────────────────────────────────────────────────
  const [phase,         setPhase]         = useState<LIRPhase>('stake');
  const [stake,         setStake]         = useState<StakeTier | null>(null);
  const [ante,          setAnte]          = useState(0);
  const BONUS_STEPS = [0, 250_000, 500_000, 750_000, 1_000_000] as const;
  type BonusIdx = 0 | 1 | 2 | 3 | 4;
  const [bonusMult,     setBonusMult]     = useState<BonusIdx>(0);
  const [playerCards,   setPlayerCards]   = useState<LIRCard[]>([]);
  const [community,     setCommunity]     = useState<LIRCard[]>([]);
  const [communityReveal, setCommunityReveal] = useState(0);   // 0,1,2 cards revealed
  const [bet1Active,    setBet1Active]    = useState(true);
  const [bet2Active,    setBet2Active]    = useState(true);
  const [result,        setResult]        = useState<LIRResult | null>(null);
  const [totalWagered,  setTotalWagered]  = useState(0);
  const [showInfo,      setShowInfo]      = useState(false);
  const [busy,          setBusy]          = useState(false);

  // ── Refs for values read inside async closures (avoids stale state) ────────
  const playerCardsRef = useRef<LIRCard[]>([]);
  const communityRef   = useRef<LIRCard[]>([]);
  const bet1ActiveRef  = useRef(true);
  const bet2ActiveRef  = useRef(true);

  // ── Animations ─────────────────────────────────────────────────────────────
  const card0Anim  = useRef(new Animated.Value(0)).current;
  const card1Anim  = useRef(new Animated.Value(0)).current;
  const card2Anim  = useRef(new Animated.Value(0)).current;
  const comm0Anim  = useRef(new Animated.Value(0)).current;
  const comm1Anim  = useRef(new Animated.Value(0)).current;
  const resultSlide   = useRef(new Animated.Value(30)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;

  function resetAnims() {
    [card0Anim, card1Anim, card2Anim, comm0Anim, comm1Anim].forEach(a => a.setValue(0));
    resultSlide.setValue(30);
    resultOpacity.setValue(0);
  }

  function animateCard(anim: Animated.Value, delay = 0) {
    return new Promise<void>(resolve => {
      Animated.sequence([
        Animated.delay(delay),
        Animated.spring(anim, { toValue: 1, tension: 80, friction: 9, useNativeDriver: true }),
      ]).start(() => resolve());
    });
  }

  function animateResult() {
    Animated.parallel([
      Animated.timing(resultSlide,   { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(resultOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }

  // ── Music ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    MusicEngine.configure({ muted: isMusicMuted });
    MusicEngine.play();
    return () => MusicEngine.stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { MusicEngine.configure({ muted: isMusicMuted }); }, [isMusicMuted]);

  // ── Stake select ───────────────────────────────────────────────────────────
  function handleStakeSelect(tier: StakeTier) {
    setStake(tier);
    setAnte(tier.ante);
    setBonusMult(0);
    setTotalWagered(0);
    setBet1Active(true);      bet1ActiveRef.current = true;
    setBet2Active(true);      bet2ActiveRef.current = true;
    setPlayerCards([]);       playerCardsRef.current = [];
    setCommunity([]);         communityRef.current = [];
    setCommunityReveal(0);
    setResult(null);
    resetAnims();
    setPhase('betting');
  }

  // ── Deal ──────────────────────────────────────────────────────────────────
  const handleDeal = useCallback(async () => {
    if (!stake || busy) return;
    const bonusBet  = BONUS_STEPS[bonusMult];
    const totalBet  = 3 * ante + bonusBet;
    if (profile.chips < totalBet) return;

    setBusy(true);
    resetAnims();
    setBet1Active(true);
    setBet2Active(true);
    setResult(null);
    setCommunityReveal(0);

    removeChips(totalBet);
    setTotalWagered(totalBet);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const { playerCards: pc, communityCards: cc } = dealLetItRide();
    playerCardsRef.current = [...pc];
    communityRef.current   = [...cc];
    setPlayerCards([...pc]);
    setCommunity([...cc]);

    // Stagger card deal
    await Promise.all([
      animateCard(card0Anim, 0),
      animateCard(card1Anim, 120),
      animateCard(card2Anim, 240),
    ]);

    setBusy(false);
    setPhase('decision1');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stake, ante, bonusMult, profile.chips, busy]);

  // ── Decision 1 ─────────────────────────────────────────────────────────────
  async function handleTakeBack1() {
    if (busy) return;
    setBusy(true);
    addChips(ante);
    setTotalWagered(w => w - ante);
    bet1ActiveRef.current = false;
    setBet1Active(false);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await sleep(120);
    await revealCommunity1();
    setBusy(false);
  }

  async function handleLetItRide1() {
    if (busy) return;
    setBusy(true);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await revealCommunity1();
    setBusy(false);
  }

  async function revealCommunity1() {
    setCommunityReveal(1);
    await animateCard(comm0Anim, 0);
    setPhase('decision2');
  }

  // ── Decision 2 ─────────────────────────────────────────────────────────────
  async function handleTakeBack2() {
    if (busy) return;
    setBusy(true);
    addChips(ante);
    setTotalWagered(w => w - ante);
    bet2ActiveRef.current = false;
    setBet2Active(false);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await sleep(120);
    await revealCommunity2();
    setBusy(false);
  }

  async function handleLetItRide2() {
    if (busy) return;
    setBusy(true);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await revealCommunity2();
    setBusy(false);
  }

  async function revealCommunity2() {
    setCommunityReveal(2);
    await animateCard(comm1Anim, 0);
    await sleep(300);
    await resolveHand();
  }

  // ── Showdown ───────────────────────────────────────────────────────────────
  async function resolveHand() {
    const pc  = playerCardsRef.current;
    const cc  = communityRef.current;
    const b1  = bet1ActiveRef.current;
    const b2  = bet2ActiveRef.current;
    if (pc.length < 3 || cc.length < 2) return;
    const hand = evaluateLetItRide(
      [pc[0], pc[1], pc[2]],
      [cc[0], cc[1]],
    );
    const activeBets = 1 + (b1 ? 1 : 0) + (b2 ? 1 : 0);
    const bonusBet   = BONUS_STEPS[bonusMult];
    const res = resolveLetItRide({ hand, activeBets, ante, bonusBet });
    setResult(res);

    // Settle chips: return stakes + pay winnings on active bets
    const stakeAtRisk = activeBets * ante;
    const addBack = hand.mainMult > 0
      ? stakeAtRisk * (1 + hand.mainMult)          // stake back + profit
      : 0;                                          // lose — nothing back
    const bonusBack = bonusBet > 0 && hand.bonusMult > 0
      ? bonusBet * (1 + hand.bonusMult)
      : 0;
    addChips(addBack + bonusBack);

    if (Platform.OS !== 'web') {
      if (res.netChips > 0) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else                   Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    animateResult();
    setPhase('result');
    setBusy(false);
  }

  // ── Next hand ──────────────────────────────────────────────────────────────
  function handleNextHand() {
    resetAnims();
    setTotalWagered(0);
    setBet1Active(true);      bet1ActiveRef.current = true;
    setBet2Active(true);      bet2ActiveRef.current = true;
    setPlayerCards([]);       playerCardsRef.current = [];
    setCommunity([]);         communityRef.current = [];
    setCommunityReveal(0);
    setResult(null);
    setBusy(false);
    setPhase('betting');
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const bonusBet     = BONUS_STEPS[bonusMult];
  const totalBet     = 3 * ante + bonusBet;
  const canAfford    = profile.chips >= totalBet;
  const isBusted     = profile.chips < (stake?.ante ?? 0);
  const activeBets   = 1 + (bet1Active ? 1 : 0) + (bet2Active ? 1 : 0);
  const inGame       = phase === 'decision1' || phase === 'decision2' || phase === 'showdown';

  // Community card opacity helper
  const comm0Opacity = comm0Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const comm1Opacity = comm1Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <LinearGradient
        colors={[...theme.bgGradient] as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
      />

      {/* Stake modal */}
      <StakeSelectModal
        visible={phase === 'stake'}
        chips={profile.chips}
        title="LET IT RIDE"
        onBack={() => router.back()}
        onSelect={handleStakeSelect}
      />

      {/* Info modal */}
      <InfoModal visible={showInfo} onClose={() => setShowInfo(false)} accent={accent} />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={[s.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 16 : 10) }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={[s.headerTitle, { color: accent }]}>LET IT RIDE</Text>
          {stake && (
            <Text style={s.headerSub}>{stake.label} · {fmt(ante)} ANTE × 3</Text>
          )}
        </View>
        <View style={s.headerRight}>
          <TouchableOpacity onPress={() => setShowInfo(true)} style={[s.iconBtn, { borderColor: `${accent}50`, borderWidth: 1 }]} hitSlop={10}>
            <Ionicons name="information-circle-outline" size={20} color={`${accent}dd`} />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleMusicMute} style={[s.iconBtn, isMusicMuted && s.iconBtnMuted]} hitSlop={10}>
            <Ionicons name={isMusicMuted ? 'musical-notes-outline' : 'musical-notes'} size={18} color={isMusicMuted ? 'rgba(255,255,255,0.28)' : `${accent}dd`} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <View style={s.table}>

        {/* Community cards */}
        <View style={s.communityArea}>
          <Text style={s.areaLabel}>COMMUNITY</Text>
          <View style={s.communityRow}>
            {/* Community card 1 */}
            {communityReveal >= 1 ? (
              <Animated.View style={{ opacity: comm0Opacity, transform: [{ translateY: comm0Anim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }}>
                <PlayingCard card={{ suit: community[0]?.suit, value: community[0]?.value }} faceDown={false} size="md" animated />
              </Animated.View>
            ) : (
              inGame || phase === 'result'
                ? <PlayingCard card={{ suit: 'S', value: 2 }} faceDown={true} size="md" />
                : <CardSlot size="md" />
            )}
            {/* Community card 2 */}
            {communityReveal >= 2 ? (
              <Animated.View style={{ opacity: comm1Opacity, transform: [{ translateY: comm1Anim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }}>
                <PlayingCard card={{ suit: community[1]?.suit, value: community[1]?.value }} faceDown={false} size="md" animated />
              </Animated.View>
            ) : (
              inGame || phase === 'result'
                ? <PlayingCard card={{ suit: 'S', value: 2 }} faceDown={true} size="md" />
                : <CardSlot size="md" />
            )}
          </View>
        </View>

        {/* Hand name after showdown */}
        {phase === 'result' && result && (
          <Animated.View style={[s.handBanner, { opacity: resultOpacity, transform: [{ translateY: resultSlide.interpolate({ inputRange: [0, 30], outputRange: [0, 10] }) }] }]}>
            <Text style={[s.handName, { color: result.hand.qualifies ? '#ffd700' : '#ff4444' }]}>
              {result.hand.name.toUpperCase()}
            </Text>
            {result.hand.qualifies && (
              <Text style={s.handMult}>{result.hand.mainMult}:1</Text>
            )}
          </Animated.View>
        )}

        {/* Player cards */}
        <View style={s.playerArea}>
          <Text style={s.areaLabel}>YOUR HAND</Text>
          <View style={s.playerRow}>
            {[card0Anim, card1Anim, card2Anim].map((anim, i) => (
              <Animated.View
                key={i}
                style={{
                  opacity: anim,
                  transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
                }}
              >
                {playerCards[i] ? (
                  <PlayingCard
                    card={{ suit: playerCards[i].suit, value: playerCards[i].value }}
                    faceDown={false}
                    size="lg"
                    highlighted={phase === 'result' && result?.hand.qualifies}
                    animated
                  />
                ) : (
                  <CardSlot size="lg" />
                )}
              </Animated.View>
            ))}
          </View>

          {/* Player balance */}
          <View style={s.chipRow}>
            <View style={s.chipDot} />
            <Text style={[s.chipAmt, { fontFamily: 'Inter_700Bold' }]}>{fmt(profile.chips)}</Text>
          </View>
        </View>

        {/* Bet circles — $ · 2 · 1 · BONUS */}
        {phase !== 'stake' && (
          <View style={s.betRow}>
            {/* Bet $ — always stays */}
            <BetCircle label="BET $" amount={ante} active={true} accent="#ffd700" />
            {/* Bet 2 */}
            <BetCircle label="BET 2" amount={ante} active={bet2Active} returned={!bet2Active && phase !== 'decision2'} accent="#ffd700" />
            {/* Bet 1 */}
            <BetCircle label="BET 1" amount={ante} active={bet1Active} returned={!bet1Active} accent="#ffd700" />
            {/* Bonus */}
            <BetCircle
              label="BONUS"
              amount={bonusBet}
              active={bonusMult > 0}
              accent={accent2}
              small
            />
          </View>
        )}
      </View>

      {/* ── Action panel ───────────────────────────────────────────────── */}
      <View style={[s.actionPanel, { paddingBottom: insets.bottom + 8 }]}>

        {/* BETTING phase — Bonus toggle + DEAL button */}
        {phase === 'betting' && (
          <>
            <TouchableOpacity
              onPress={() => setBonusMult(m => ((m + 1) % 5) as BonusIdx)}
              style={[s.bonusToggle, bonusMult > 0 && { borderColor: `${accent2}80`, backgroundColor: `${accent2}12` }]}
            >
              <Text style={[s.bonusToggleText, { color: bonusMult > 0 ? accent2 : 'rgba(255,255,255,0.35)' }]}>
                {bonusMult > 0 ? `✓ BONUS BET  +${fmt(bonusBet)}` : 'ADD BONUS BET  (optional)'}
              </Text>
            </TouchableOpacity>
            <View style={s.btnRow}>
              <ActionBtn
                label="DEAL"
                sub={canAfford ? `Bet ${fmt(totalBet)} total` : 'Insufficient chips'}
                onPress={handleDeal}
                disabled={!canAfford}
                accent={accent}
                fill
              />
            </View>
          </>
        )}

        {/* Decision 1 — after seeing 3 cards */}
        {phase === 'decision1' && playerCards.length > 0 && !busy && (
          <>
            <Text style={s.decisionLabel}>DECISION · FIRST — BEFORE COMMUNITY 1</Text>
            <View style={s.btnRow}>
              <ActionBtn
                label="TAKE BACK"
                sub={`Recover ${fmt(ante)} · Bet 1`}
                onPress={handleTakeBack1}
                accent="rgba(255,255,255,0.55)"
                danger
              />
              <ActionBtn
                label="LET IT RIDE"
                sub={`Keep ${fmt(ante)} · Bet 1`}
                onPress={handleLetItRide1}
                accent={accent}
                fill
              />
            </View>
          </>
        )}

        {/* Decision 2 — after community card 1 revealed */}
        {phase === 'decision2' && !busy && (
          <>
            <Text style={s.decisionLabel}>DECISION · SECOND — BEFORE COMMUNITY 2</Text>
            <View style={s.btnRow}>
              <ActionBtn
                label="TAKE BACK"
                sub={`Recover ${fmt(ante)} · Bet 2`}
                onPress={handleTakeBack2}
                accent="rgba(255,255,255,0.55)"
                danger
              />
              <ActionBtn
                label="LET IT RIDE"
                sub={`Keep ${fmt(ante)} · Bet 2`}
                onPress={handleLetItRide2}
                accent={accent}
                fill
              />
            </View>
          </>
        )}

        {/* Dealing / revealing spinner */}
        {busy && phase !== 'result' && (
          <View style={s.busyRow}>
            <Text style={[s.busyText, { color: `${accent}66` }]}>
              {phase === 'decision2' ? 'REVEALING...' : 'DEALING...'}
            </Text>
          </View>
        )}

        {/* Result panel */}
        {phase === 'result' && result && (
          <Animated.View style={[s.resultPanel, { opacity: resultOpacity, transform: [{ translateY: resultSlide }] }]}>
            <LinearGradient colors={['rgba(0,0,0,0.65)', 'rgba(0,0,0,0.35)']} style={StyleSheet.absoluteFill} />

            {/* Bet $ always stays */}
            <ResultRow
              label="BET $"
              net={result.hand.mainMult > 0 ? result.ante * result.hand.mainMult : -result.ante}
              sub={result.hand.mainMult > 0 ? `${result.hand.mainMult}:1` : 'No qualifying hand'}
            />
            {/* Bet 2 */}
            <ResultRow
              label="BET 2"
              net={bet2Active
                ? (result.hand.mainMult > 0 ? result.ante * result.hand.mainMult : -result.ante)
                : 'returned'}
              sub={bet2Active && result.hand.mainMult > 0 ? `${result.hand.mainMult}:1` : undefined}
            />
            {/* Bet 1 */}
            <ResultRow
              label="BET 1"
              net={bet1Active
                ? (result.hand.mainMult > 0 ? result.ante * result.hand.mainMult : -result.ante)
                : 'returned'}
              sub={bet1Active && result.hand.mainMult > 0 ? `${result.hand.mainMult}:1` : undefined}
            />
            {/* Bonus */}
            {bonusBet > 0 && (
              <ResultRow
                label="BONUS BET"
                net={result.bonusNet}
                sub={result.hand.bonusMult > 0 ? `${result.hand.bonusMult}:1` : 'Below Three of a Kind'}
              />
            )}
            <View style={s.netDivider} />
            <View style={s.netRow}>
              <Text style={s.netLabel}>NET</Text>
              <Text style={[s.netAmt, {
                fontFamily: 'Inter_700Bold',
                color: result.netChips > 0 ? '#00ff88' : result.netChips < 0 ? '#ff4444' : '#00d4ff',
              }]}>
                {result.netChips > 0 ? `+${fmt(result.netChips)}` : result.netChips < 0 ? `-${fmt(Math.abs(result.netChips))}` : 'PUSH'}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Next hand */}
        {phase === 'result' && (
          <View style={s.btnRow}>
            <ActionBtn
              label={isBusted ? 'CHANGE STAKES' : 'NEXT HAND'}
              onPress={isBusted ? () => setPhase('stake') : handleNextHand}
              accent={accent}
              fill
            />
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:         { flex: 1 },

  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 8, gap: 8 },
  backBtn:      { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle:  { fontSize: 13, fontWeight: '900', fontFamily: 'Orbitron_900Black', letterSpacing: 2 },
  headerSub:    { fontSize: 9, color: 'rgba(255,255,255,0.35)', marginTop: 1, letterSpacing: 0.5 },
  headerRight:  { flexDirection: 'row', gap: 6 },
  iconBtn:      { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)' },
  iconBtnMuted: { backgroundColor: 'rgba(255,255,255,0.03)' },

  table:        { flex: 1, paddingHorizontal: 16, paddingVertical: 4, gap: 8, justifyContent: 'space-between' },

  communityArea:{ alignItems: 'center', gap: 6 },
  communityRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },

  handBanner:   { alignItems: 'center', gap: 2 },
  handName:     { fontSize: 16, fontWeight: '900', fontFamily: 'Orbitron_900Black', letterSpacing: 2 },
  handMult:     { fontSize: 9, fontFamily: 'Orbitron_700Bold', color: 'rgba(255,215,0,0.6)', letterSpacing: 1 },

  playerArea:   { alignItems: 'center', gap: 8 },
  playerRow:    { flexDirection: 'row', gap: 8, alignItems: 'center' },

  chipRow:      { flexDirection: 'row', alignItems: 'center', gap: 5 },
  chipDot:      { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ffd700', borderWidth: 2, borderColor: 'rgba(255,215,0,0.4)' },
  chipAmt:      { fontSize: 14, color: '#ffd700', letterSpacing: 0.5 },

  areaLabel:    { fontSize: 7, fontWeight: '800', fontFamily: 'Orbitron_700Bold', letterSpacing: 2, color: 'rgba(255,255,255,0.25)' },

  betRow:       { flexDirection: 'row', justifyContent: 'center', gap: 8, alignItems: 'center' },

  actionPanel:  { backgroundColor: 'rgba(0,0,0,0.55)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)', paddingHorizontal: 14, paddingTop: 10, gap: 8 },

  bonusToggle:  { borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  bonusToggleText: { fontSize: 10, fontFamily: 'Orbitron_700Bold', letterSpacing: 1.5 },

  decisionLabel:{ fontSize: 8, fontFamily: 'Orbitron_400Regular', letterSpacing: 2, color: 'rgba(255,255,255,0.3)', textAlign: 'center' },
  btnRow:       { flexDirection: 'row', gap: 8 },

  busyRow:      { alignItems: 'center', paddingVertical: 10 },
  busyText:     { fontSize: 9, fontFamily: 'Orbitron_400Regular', letterSpacing: 3 },

  resultPanel:  { borderRadius: 14, overflow: 'hidden', paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  netDivider:   { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 5 },
  netRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  netLabel:     { fontSize: 9, fontFamily: 'Orbitron_700Bold', letterSpacing: 2, color: 'rgba(255,255,255,0.45)' },
  netAmt:       { fontSize: 20, fontWeight: '900' },
});
