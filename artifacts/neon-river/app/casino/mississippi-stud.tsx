/**
 * Mississippi Stud — Chip Society premium casino game
 * 2 hole cards + 3 community cards = 5-card poker hand vs pay table.
 * Three street bets (1–3×) before each community reveal. No dealer competition.
 */
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
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
  dealMississippiStud, resolveMississippiStud,
  MS_PAYOUTS, TCB_PAYOUTS,
  type MSCard, type MSPhase, type MSResult,
} from '@/lib/mississippiStud';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) { const v = abs / 1_000_000_000; return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}B`; }
  if (abs >= 1_000_000)     { const v = abs / 1_000_000;     return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}M`; }
  if (abs >= 1_000)         { const v = abs / 1_000;         return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}K`; }
  return String(abs);
}
function sleep(ms: number) { return new Promise<void>(r => setTimeout(r, ms)); }

// ─── Info Modal ───────────────────────────────────────────────────────────────
function InfoModal({ visible, onClose, accent }: { visible: boolean; onClose: () => void; accent: string }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={im.overlay}>
        <View style={im.sheet}>
          <LinearGradient colors={['#0d0025', '#050010']} style={StyleSheet.absoluteFill} />
          <View style={im.header}>
            <Text style={[im.title, { color: accent }]}>MISSISSIPPI STUD</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}><Ionicons name="close" size={22} color="rgba(255,255,255,0.55)" /></TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

            <Text style={im.section}>HOW IT WORKS</Text>
            <Text style={im.body}>You receive 2 hole cards. Three community cards are dealt face-down. You and the community cards combine to make the best 5-card poker hand. There is no dealer — you are playing against the pay table. A pair of Jacks or better wins.</Text>

            <Text style={im.section}>BETTING SEQUENCE</Text>
            <Text style={im.body}>
              {'1. Place Ante\n'}
              {'2. View 2 hole cards → Fold or Bet 3rd Street (1×/2×/3×)\n'}
              {'3. Community card 1 revealed → Fold or Bet 4th Street (1×/2×/3×)\n'}
              {'4. Community card 2 revealed → Fold or Bet 5th Street (1×/2×/3×)\n'}
              {'5. Community card 3 revealed → Hand evaluated and paid'}
            </Text>

            <Text style={im.section}>FOLD RULES</Text>
            <Text style={im.body}>Folding immediately ends the hand and forfeits all bets placed so far. The Three Card Bonus (if placed) still resolves on the three community cards, which are all revealed on fold.</Text>

            <Text style={im.section}>STREET BETS</Text>
            <Text style={im.body}>Each street bet can be 1×, 2×, or 3× the Ante. Every active street bet earns the same pay table multiplier as the Ante. More bets on the table = bigger wins on strong hands.</Text>

            <Text style={im.section}>MAIN PAY TABLE</Text>
            <Text style={im.body}>Applied to Ante + all Street bets placed:</Text>
            <View style={im.table}>
              {MS_PAYOUTS.map(row => (
                <View key={row.hand} style={im.row}>
                  <Text style={im.lbl}>{row.hand}</Text>
                  <Text style={[im.val, {
                    color: row.mult === 'lose' ? '#ff4444'
                         : row.mult === 'push' ? '#00d4ff'
                         : '#ffd700',
                  }]}>
                    {row.mult === 'lose' ? 'LOSE' : row.mult === 'push' ? 'PUSH' : `${row.mult} : 1`}
                  </Text>
                </View>
              ))}
            </View>

            <Text style={im.section}>THREE CARD BONUS</Text>
            <Text style={im.body}>Optional side bet on the three community cards only. Resolves independently — wins even if you fold the main hand.</Text>
            <View style={im.table}>
              {TCB_PAYOUTS.map(row => (
                <View key={row.hand} style={im.row}>
                  <Text style={im.lbl}>{row.hand}</Text>
                  <Text style={[im.val, { color: '#bf5fff' }]}>{row.mult} : 1</Text>
                </View>
              ))}
              <View style={im.row}>
                <Text style={im.lbl}>High Card</Text>
                <Text style={[im.val, { color: '#ff4444' }]}>LOSE</Text>
              </View>
            </View>

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
const im = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  sheet:   { height: '88%', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', paddingHorizontal: 20, paddingTop: 20 },
  header:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title:   { fontSize: 13, fontFamily: 'Orbitron_900Black', letterSpacing: 2 },
  section: { fontSize: 9, fontFamily: 'Orbitron_700Bold', letterSpacing: 1.5, color: 'rgba(255,255,255,0.4)', marginTop: 18, marginBottom: 6 },
  body:    { fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 18 },
  table:   { gap: 2 },
  row:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  lbl:     { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  val:     { fontSize: 11, fontWeight: '800', fontFamily: 'Orbitron_700Bold' },
});

// ─── Bet circle ───────────────────────────────────────────────────────────────
function BetCircle({ label, amount, active, pushed, accent = '#ffd700', small }: {
  label: string; amount: number; active: boolean; pushed?: boolean; accent?: string; small?: boolean;
}) {
  const dim = small ? 60 : 70;
  const col = pushed ? '#aaaaaa' : active ? accent : `${accent}35`;
  return (
    <View style={[bc.wrap, { width: dim, height: dim, borderRadius: dim / 2, borderColor: active && !pushed ? accent : 'rgba(255,255,255,0.12)' }]}>
      {active && !pushed && <LinearGradient colors={[`${accent}28`, 'transparent']} style={StyleSheet.absoluteFill} />}
      <Text style={[bc.lbl, { color: col, fontSize: pushed ? 5.5 : small ? 6 : 6.5 }]}>{pushed ? 'PUSH' : label}</Text>
      <Text style={[bc.amt, { color: col, fontFamily: 'Inter_700Bold', fontSize: small ? 10 : 11 }]}>
        {amount > 0 ? fmt(amount) : '—'}
      </Text>
    </View>
  );
}
const bc = StyleSheet.create({
  wrap: { borderWidth: 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', gap: 1 },
  lbl:  { fontWeight: '800', fontFamily: 'Orbitron_700Bold', letterSpacing: 0.5, textAlign: 'center' },
  amt:  { fontWeight: '900' },
});

// ─── Action button ────────────────────────────────────────────────────────────
function ActionBtn({ label, sub, onPress, disabled, accent = '#00d4ff', fill, danger, flex }: {
  label: string; sub?: string; onPress: () => void;
  disabled?: boolean; accent?: string; fill?: boolean; danger?: boolean; flex?: number;
}) {
  const c = danger ? '#ff6644' : accent;
  return (
    <TouchableOpacity
      style={[ab.btn, { borderColor: `${c}65`, opacity: disabled ? 0.35 : 1, flex: flex ?? 1 }, fill && { backgroundColor: `${c}18` }]}
      onPress={onPress} disabled={disabled} activeOpacity={0.75}
    >
      {fill && <LinearGradient colors={[`${c}20`, 'transparent']} style={StyleSheet.absoluteFill} />}
      <Text style={[ab.label, { color: c }]}>{label}</Text>
      {sub ? <Text style={ab.sub}>{sub}</Text> : null}
    </TouchableOpacity>
  );
}
const ab = StyleSheet.create({
  btn:   { borderWidth: 1.5, borderRadius: 14, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', gap: 2, overflow: 'hidden' },
  label: { fontSize: 11, fontWeight: '900', fontFamily: 'Orbitron_900Black', letterSpacing: 1.2 },
  sub:   { fontSize: 8, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.5 },
});

// ─── Result row ───────────────────────────────────────────────────────────────
function ResultRow({ label, net, sub, skipped }: { label: string; net?: number; sub?: string; skipped?: boolean }) {
  if (skipped) return (
    <View style={rr.row}>
      <Text style={rr.label}>{label}</Text>
      <Text style={[rr.val, { color: 'rgba(255,255,255,0.2)', fontFamily: 'Inter_700Bold' }]}>—</Text>
    </View>
  );
  const color = net === 0 ? '#00d4ff' : (net ?? 0) > 0 ? '#00ff88' : '#ff4444';
  return (
    <View style={rr.row}>
      <View><Text style={rr.label}>{label}</Text>{sub ? <Text style={rr.sub}>{sub}</Text> : null}</View>
      <Text style={[rr.val, { color, fontFamily: 'Inter_700Bold' }]}>
        {net === 0 ? 'PUSH' : (net ?? 0) > 0 ? `+${fmt(net!)}` : `-${fmt(Math.abs(net!))}`}
      </Text>
    </View>
  );
}
const rr = StyleSheet.create({
  row:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 3 },
  label: { fontSize: 8.5, fontFamily: 'Orbitron_400Regular', letterSpacing: 1, color: 'rgba(255,255,255,0.4)' },
  sub:   { fontSize: 7.5, color: 'rgba(255,255,255,0.25)', marginTop: 1 },
  val:   { fontSize: 12, fontWeight: '900' },
});

// ─── Card slot placeholder ────────────────────────────────────────────────────
function CardSlot() {
  return (
    <View style={{ width: 46, height: 64, borderRadius: 8, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.09)', borderStyle: 'dashed' }} />
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function MississippiStudScreen() {
  const insets = useSafeAreaInsets();
  const { profile, addChips, removeChips } = useUser();
  const { theme } = useTableTheme();
  const { isMusicMuted, toggleMusicMute } = useSoundSettings();
  const accent  = theme.accentPrimary   || '#00D4C8';
  const accent2 = theme.accentSecondary || '#bf5fff';

  // ── Game state ────────────────────────────────────────────────────────────
  const [phase,         setPhase]         = useState<MSPhase>('stake');
  const [stake,         setStake]         = useState<StakeTier | null>(null);
  const BONUS_STEPS = [0, 250_000, 500_000, 750_000, 1_000_000] as const;
  type BonusIdx = 0 | 1 | 2 | 3 | 4;
  const [ante,           setAnte]          = useState(0);
  const [threeCardIdx,   setThreeCardIdx]  = useState<BonusIdx>(0);
  const [threeCardBet,   setThreeCardBet]  = useState(0);
  const [holeCards,     setHoleCards]     = useState<MSCard[]>([]);
  const [communityCards, setCommunityCards] = useState<MSCard[]>([]);
  const [commReveal,    setCommReveal]    = useState(0);   // 0-3 community cards face-up
  const [street3Bet,    setStreet3Bet]    = useState(0);
  const [street4Bet,    setStreet4Bet]    = useState(0);
  const [street5Bet,    setStreet5Bet]    = useState(0);
  const [totalWagered,  setTotalWagered]  = useState(0);
  const [folded,        setFolded]        = useState(false);
  const [foldStreet,    setFoldStreet]    = useState<3|4|5|null>(null);
  const [result,        setResult]        = useState<MSResult | null>(null);
  const [showInfo,      setShowInfo]      = useState(false);
  const [busy,          setBusy]          = useState(false);

  // ── Refs for async closures ───────────────────────────────────────────────
  const holeRef         = useRef<MSCard[]>([]);
  const communityRef    = useRef<MSCard[]>([]);
  const anteRef         = useRef(0);
  const threeCardRef    = useRef(0);
  const street3Ref      = useRef(0);
  const street4Ref      = useRef(0);
  const street5Ref      = useRef(0);
  const totalWageredRef = useRef(0);
  const foldedRef       = useRef(false);
  const foldStreetRef   = useRef<3|4|5|null>(null);

  // ── Animations ─────────────────────────────────────────────────────────────
  const hole0Anim     = useRef(new Animated.Value(0)).current;
  const hole1Anim     = useRef(new Animated.Value(0)).current;
  const comm0Anim     = useRef(new Animated.Value(0)).current;
  const comm1Anim     = useRef(new Animated.Value(0)).current;
  const comm2Anim     = useRef(new Animated.Value(0)).current;
  const resultSlide   = useRef(new Animated.Value(30)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;

  function resetAnims() {
    [hole0Anim, hole1Anim, comm0Anim, comm1Anim, comm2Anim].forEach(a => a.setValue(0));
    resultSlide.setValue(30); resultOpacity.setValue(0);
  }

  function animCard(anim: Animated.Value, delay = 0) {
    return new Promise<void>(resolve => {
      Animated.sequence([
        Animated.delay(delay),
        Animated.spring(anim, { toValue: 1, tension: 85, friction: 9, useNativeDriver: true }),
      ]).start(() => resolve());
    });
  }

  function animResult() {
    Animated.parallel([
      Animated.timing(resultSlide,   { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(resultOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }

  // ── Music ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    MusicEngine.configure({ muted: isMusicMuted }); MusicEngine.play();
    return () => MusicEngine.stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { MusicEngine.configure({ muted: isMusicMuted }); }, [isMusicMuted]);

  // ── Stake select ───────────────────────────────────────────────────────────
  function handleStakeSelect(tier: StakeTier) {
    setStake(tier);
    setAnte(tier.ante);              anteRef.current = tier.ante;
    setThreeCardIdx(0); setThreeCardBet(0);   threeCardRef.current = 0;
    setStreet3Bet(0);  setStreet4Bet(0);  setStreet5Bet(0);
    street3Ref.current = 0; street4Ref.current = 0; street5Ref.current = 0;
    setTotalWagered(0);              totalWageredRef.current = 0;
    setFolded(false);                foldedRef.current = false;
    setFoldStreet(null);             foldStreetRef.current = null;
    setHoleCards([]);                holeRef.current = [];
    setCommunityCards([]);           communityRef.current = [];
    setCommReveal(0);
    setResult(null);
    resetAnims();
    setPhase('betting');
  }

  // ── Deal ──────────────────────────────────────────────────────────────────
  async function handleDeal() {
    if (!stake || busy) return;
    const a  = anteRef.current;
    const tc = threeCardRef.current;
    const total = a + tc;
    if (profile.chips < total) return;

    setBusy(true);
    resetAnims();
    setCommReveal(0);
    setResult(null);
    foldedRef.current = false; setFolded(false);
    foldStreetRef.current = null; setFoldStreet(null);
    street3Ref.current = 0; street4Ref.current = 0; street5Ref.current = 0;
    setStreet3Bet(0); setStreet4Bet(0); setStreet5Bet(0);

    removeChips(total);
    totalWageredRef.current = total;
    setTotalWagered(total);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const { holeCards: hc, communityCards: cc } = dealMississippiStud();
    holeRef.current = [...hc];
    communityRef.current = [...cc];
    setHoleCards([...hc]);
    setCommunityCards([...cc]);

    // Stagger hole cards first, then community face-down
    await Promise.all([
      animCard(hole0Anim, 0),
      animCard(hole1Anim, 100),
      animCard(comm0Anim, 200),
      animCard(comm1Anim, 320),
      animCard(comm2Anim, 440),
    ]);

    setBusy(false);
    setPhase('street3');
  }

  // ── Reveal one community card ─────────────────────────────────────────────
  async function revealCommunityCard() {
    await sleep(200);
    setCommReveal(r => r + 1);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await sleep(350);
  }

  // ── Reveal all remaining community cards (for fold/showdown) ─────────────
  async function revealRemaining(currentReveal: number) {
    for (let i = currentReveal; i < 3; i++) {
      await sleep(180);
      setCommReveal(i + 1);
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await sleep(320);
    }
    await sleep(200);
  }

  // ── Resolve final hand ────────────────────────────────────────────────────
  function resolveHand() {
    const res = resolveMississippiStud({
      holeCards:      holeRef.current,
      communityCards: communityRef.current,
      folded:         foldedRef.current,
      foldStreet:     foldStreetRef.current,
      ante:           anteRef.current,
      street3Bet:     street3Ref.current,
      street4Bet:     street4Ref.current,
      street5Bet:     street5Ref.current,
      threeCardBet:   threeCardRef.current,
    });
    addChips(totalWageredRef.current + res.netChips);
    if (Platform.OS !== 'web') {
      if (res.netChips > 0) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    setResult(res);
    animResult();
    setBusy(false);
    setPhase('result');
  }

  // ── Fold ──────────────────────────────────────────────────────────────────
  async function handleFold(street: 3|4|5) {
    if (busy) return;
    setBusy(true);
    foldedRef.current = true;  setFolded(true);
    foldStreetRef.current = street; setFoldStreet(street);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Reveal all remaining community cards (for bonus resolution + drama)
    const currentReveal = street - 3;  // street3 → 0 revealed, street4 → 1, street5 → 2
    await revealRemaining(currentReveal);
    resolveHand();
  }

  // ── Place street bet and advance ──────────────────────────────────────────
  async function handleStreetBet(street: 3|4|5, mult: 1|2|3) {
    if (busy) return;
    const a = anteRef.current;
    const betAmt = mult * a;
    if (profile.chips < betAmt) return;

    setBusy(true);
    removeChips(betAmt);
    totalWageredRef.current += betAmt;
    setTotalWagered(w => w + betAmt);

    if (street === 3) { street3Ref.current = betAmt; setStreet3Bet(betAmt); }
    if (street === 4) { street4Ref.current = betAmt; setStreet4Bet(betAmt); }
    if (street === 5) { street5Ref.current = betAmt; setStreet5Bet(betAmt); }

    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (street === 5) {
      // Reveal final community card and resolve
      await revealCommunityCard();
      resolveHand();
    } else {
      // Reveal next community card and advance
      await revealCommunityCard();
      setBusy(false);
      setPhase(street === 3 ? 'street4' : 'street5');
    }
  }

  // ── Next hand ─────────────────────────────────────────────────────────────
  function handleNextHand() {
    resetAnims();
    setStreet3Bet(0);  setStreet4Bet(0);  setStreet5Bet(0);
    street3Ref.current = 0; street4Ref.current = 0; street5Ref.current = 0;
    setTotalWagered(0);     totalWageredRef.current = 0;
    setHoleCards([]);       holeRef.current = [];
    setCommunityCards([]);  communityRef.current = [];
    setCommReveal(0);
    setFolded(false);       foldedRef.current = false;
    setFoldStreet(null);    foldStreetRef.current = null;
    setResult(null);
    setBusy(false);
    setThreeCardBet(0);     threeCardRef.current = 0;
    setPhase('betting');
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const anteAmt     = stake?.ante ?? 0;
  const dealCost    = anteAmt + threeCardBet;
  const canDeal     = profile.chips >= dealCost;
  const isBusted    = profile.chips < (stake?.ante ?? 0);
  const showCards   = phase !== 'betting' && phase !== 'stake';
  const streetLabel = phase === 'street3' ? '3RD STREET' : phase === 'street4' ? '4TH STREET' : '5TH STREET';
  const currentStreetNum: 3|4|5 = phase === 'street3' ? 3 : phase === 'street4' ? 4 : 5;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <LinearGradient
        colors={[...theme.bgGradient] as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
      />

      <StakeSelectModal
        visible={phase === 'stake'}
        chips={profile.chips}
        title="MISSISSIPPI STUD"
        onBack={() => router.back()}
        onSelect={handleStakeSelect}
      />

      <InfoModal visible={showInfo} onClose={() => setShowInfo(false)} accent={accent} />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={[s.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 16 : 10) }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={[s.headerTitle, { color: accent }]}>MISSISSIPPI STUD</Text>
          {stake && <Text style={s.headerSub}>{stake.label} · {fmt(anteAmt)} ANTE</Text>}
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

        {/* Community cards section */}
        <View style={s.communitySection}>
          <Text style={s.areaLabel}>COMMUNITY</Text>
          <View style={s.cardRow}>
            {showCards ? (
              [comm0Anim, comm1Anim, comm2Anim].map((anim, i) => (
                <Animated.View key={i} style={{
                  opacity: anim,
                  transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] }) }],
                }}>
                  <PlayingCard
                    card={communityCards[i] ?? { suit: 'S', value: 2 }}
                    faceDown={commReveal <= i}
                    size="md"
                  />
                </Animated.View>
              ))
            ) : (
              [0, 1, 2].map(i => <CardSlot key={i} />)
            )}
          </View>
        </View>

        {/* Center status badge */}
        {(phase === 'street3' || phase === 'street4' || phase === 'street5') && !busy && (
          <View style={s.centerBadge}>
            <Text style={[s.centerBadgeText, { color: accent }]}>{streetLabel} DECISION</Text>
            <Text style={s.centerBadgeSub}>
              {phase === 'street3'
                ? 'See your 2 cards — choose your wager'
                : phase === 'street4'
                  ? `${commReveal} community card${commReveal !== 1 ? 's' : ''} shown`
                  : `${commReveal} community cards shown`}
            </Text>
          </View>
        )}
        {phase === 'result' && result && (
          <View style={s.centerBadge}>
            <Text style={[s.centerBadgeText, {
              color: result.netChips > 0 ? '#00ff88' : result.netChips < 0 ? '#ff4444' : '#00d4ff',
            }]}>
              {result.folded
                ? `FOLDED — ${result.foldStreet}RD STREET`
                : result.mainMult > 0
                  ? `${result.handName.toUpperCase()} — ${result.mainMult}:1`
                  : result.mainMult === 0
                    ? `${result.handName.toUpperCase()} — PUSH`
                    : result.handName.toUpperCase()}
            </Text>
            {!result.folded && result.mainMult < 0 && (
              <Text style={[s.centerBadgeSub, { color: '#ff4444' }]}>Below pair of 6s — no win</Text>
            )}
          </View>
        )}
        {busy && phase !== 'result' && (
          <View style={s.centerBadge}>
            <Text style={[s.centerBadgeText, { color: `${accent}55`, fontSize: 11 }]}>DEALING...</Text>
          </View>
        )}

        {/* Player hole cards section */}
        <View style={s.playerSection}>
          <View style={s.cardRow}>
            {showCards ? (
              [hole0Anim, hole1Anim].map((anim, i) => (
                <Animated.View key={i} style={{
                  opacity: anim,
                  transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
                }}>
                  <PlayingCard card={holeCards[i] ?? { suit: 'S', value: 2 }} faceDown={false} size="md" />
                </Animated.View>
              ))
            ) : (
              [0, 1].map(i => <CardSlot key={i} />)
            )}
          </View>
          <Text style={[s.areaLabel, { marginTop: 6 }]}>YOUR HAND</Text>
          <View style={s.balanceRow}>
            <View style={s.chipDot} />
            <Text style={s.balanceAmt}>{fmt(profile.chips)}</Text>
          </View>
        </View>
      </View>

      {/* ── Bet circles ──────────────────────────────────────────────────── */}
      {phase !== 'stake' && (
        <View style={s.betCirclesWrap}>
          {/* Row 1: 3-Card Bonus + Ante */}
          <View style={s.betRow1}>
            <BetCircle
              label="3-CARD BONUS"
              amount={threeCardBet}
              active={threeCardBet > 0}
              pushed={phase === 'result' && result !== null && threeCardBet > 0 && result.threeCardBonusMult === 0}
              accent={accent2}
              small
            />
            <BetCircle
              label="ANTE"
              amount={anteAmt}
              active={true}
              pushed={phase === 'result' && result !== null && result.anteNet === 0}
              accent={accent}
            />
          </View>
          {/* Row 2: Street bets */}
          <View style={s.betRow2}>
            <BetCircle
              label="3RD ST"
              amount={street3Bet}
              active={street3Bet > 0}
              pushed={phase === 'result' && result !== null && street3Bet > 0 && result.street3Net === 0}
              accent={accent}
              small
            />
            <BetCircle
              label="4TH ST"
              amount={street4Bet}
              active={street4Bet > 0}
              pushed={phase === 'result' && result !== null && street4Bet > 0 && result.street4Net === 0}
              accent={accent}
              small
            />
            <BetCircle
              label="5TH ST"
              amount={street5Bet}
              active={street5Bet > 0}
              pushed={phase === 'result' && result !== null && street5Bet > 0 && result.street5Net === 0}
              accent={accent}
              small
            />
          </View>
        </View>
      )}

      {/* ── Action panel ─────────────────────────────────────────────────── */}
      <View style={[s.actionPanel, { paddingBottom: insets.bottom + 8 }]}>

        {/* BETTING phase */}
        {phase === 'betting' && (
          <>
            <TouchableOpacity
              onPress={() => {
                const nextIdx = ((threeCardIdx + 1) % 5) as BonusIdx;
                const next = BONUS_STEPS[nextIdx];
                setThreeCardIdx(nextIdx); setThreeCardBet(next); threeCardRef.current = next;
              }}
              style={[s.bonusToggle, threeCardBet > 0 && { borderColor: `${accent2}80`, backgroundColor: `${accent2}12` }]}
            >
              <Text style={[s.bonusToggleText, { color: threeCardBet > 0 ? accent2 : 'rgba(255,255,255,0.35)' }]}>
                {threeCardBet > 0 ? `✓ THREE CARD BONUS  +${fmt(threeCardBet)}` : 'ADD THREE CARD BONUS  (optional)'}
              </Text>
            </TouchableOpacity>
            <View style={s.btnRow}>
              <ActionBtn
                label="DEAL"
                sub={canDeal ? `Ante ${fmt(dealCost)} total` : 'Insufficient chips'}
                onPress={handleDeal}
                disabled={!canDeal}
                accent={accent}
                fill
              />
            </View>
          </>
        )}

        {/* STREET DECISION phase */}
        {(phase === 'street3' || phase === 'street4' || phase === 'street5') && !busy && (
          <>
            <Text style={s.decisionLabel}>{streetLabel} · 1× 2× OR 3× ANTE · OR FOLD</Text>
            {/* Fold button */}
            <View style={s.btnRow}>
              <ActionBtn
                label="FOLD"
                sub="Forfeit placed bets"
                onPress={() => handleFold(currentStreetNum)}
                accent="rgba(255,255,255,0.55)"
                danger
              />
            </View>
            {/* Bet multiplier buttons */}
            <View style={s.btnRow}>
              {([1, 2, 3] as const).map(mult => (
                <ActionBtn
                  key={mult}
                  label={`BET ${mult}×`}
                  sub={profile.chips >= mult * anteAmt ? fmt(mult * anteAmt) : 'Low chips'}
                  onPress={() => handleStreetBet(currentStreetNum, mult)}
                  disabled={profile.chips < mult * anteAmt}
                  accent={accent}
                  fill={mult === 3}
                />
              ))}
            </View>
          </>
        )}

        {/* Busy / Dealing */}
        {busy && phase !== 'result' && (
          <View style={s.busyRow}>
            <Text style={[s.busyText, { color: `${accent}66` }]}>
              {phase === 'betting' ? 'DEALING...' : 'REVEALING...'}
            </Text>
          </View>
        )}

        {/* Result panel */}
        {phase === 'result' && result && (
          <Animated.View style={[s.resultPanel, { opacity: resultOpacity, transform: [{ translateY: resultSlide }] }]}>
            <LinearGradient colors={['rgba(0,0,0,0.65)', 'rgba(0,0,0,0.35)']} style={StyleSheet.absoluteFill} />
            <ResultRow label="ANTE" net={result.anteNet} />
            {street3Bet > 0 ? <ResultRow label="3RD STREET" net={result.street3Net} sub={result.mainMult > 0 ? `${result.mainMult}:1` : result.mainMult === 0 ? 'Push' : undefined} />
                            : <ResultRow label="3RD STREET" skipped />}
            {street4Bet > 0 ? <ResultRow label="4TH STREET" net={result.street4Net} />
                            : <ResultRow label="4TH STREET" skipped />}
            {street5Bet > 0 ? <ResultRow label="5TH STREET" net={result.street5Net} />
                            : <ResultRow label="5TH STREET" skipped />}
            {threeCardBet > 0 ? (
              <ResultRow
                label="THREE CARD BONUS"
                net={result.threeCardNet}
                sub={result.threeCardBonusMult > 0 ? `${result.threeCardBonusName} ${result.threeCardBonusMult}:1` : undefined}
              />
            ) : null}
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

        {/* NEXT HAND */}
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

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#050010' },
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 8, gap: 8 },
  backBtn:      { padding: 6 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle:  { fontSize: 12, fontFamily: 'Orbitron_900Black', letterSpacing: 1.5 },
  headerSub:    { fontSize: 9, color: 'rgba(255,255,255,0.4)', fontFamily: 'Orbitron_400Regular', marginTop: 2 },
  headerRight:  { flexDirection: 'row', gap: 8 },
  iconBtn:      { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  iconBtnMuted: { opacity: 0.4 },

  table:         { flex: 1, paddingHorizontal: 16, justifyContent: 'space-between', paddingVertical: 4 },
  communitySection: { alignItems: 'center', gap: 6 },
  playerSection: { alignItems: 'center', gap: 2 },
  cardRow:       { flexDirection: 'row', gap: 10, alignItems: 'center' },
  areaLabel:     { fontSize: 8, fontFamily: 'Orbitron_400Regular', letterSpacing: 1.5, color: 'rgba(255,255,255,0.3)', textAlign: 'center' },
  centerBadge:   { alignItems: 'center', paddingVertical: 2 },
  centerBadgeText: { fontSize: 12, fontFamily: 'Orbitron_900Black', letterSpacing: 1.2 },
  centerBadgeSub:  { fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 2, fontFamily: 'Orbitron_400Regular' },
  balanceRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  chipDot:       { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ffd700' },
  balanceAmt:    { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },

  betCirclesWrap: { paddingHorizontal: 14, gap: 6, paddingVertical: 6 },
  betRow1:       { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  betRow2:       { flexDirection: 'row', justifyContent: 'center', gap: 10 },

  actionPanel:   { backgroundColor: 'rgba(0,0,0,0.55)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)', paddingHorizontal: 14, paddingTop: 10, gap: 8 },
  bonusToggle:   { borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, alignItems: 'center' },
  bonusToggleText: { fontSize: 10, fontFamily: 'Orbitron_700Bold', letterSpacing: 0.8 },
  btnRow:        { flexDirection: 'row', gap: 8 },
  decisionLabel: { fontSize: 8, fontFamily: 'Orbitron_400Regular', letterSpacing: 0.8, color: 'rgba(255,255,255,0.3)', textAlign: 'center' },
  busyRow:       { alignItems: 'center', paddingVertical: 6 },
  busyText:      { fontSize: 11, fontFamily: 'Orbitron_700Bold', letterSpacing: 2 },
  resultPanel:   { borderRadius: 14, overflow: 'hidden', padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  netDivider:    { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 5 },
  netRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  netLabel:      { fontSize: 9, fontFamily: 'Orbitron_700Bold', letterSpacing: 2, color: 'rgba(255,255,255,0.5)' },
  netAmt:        { fontSize: 18, fontWeight: '900' },
});
