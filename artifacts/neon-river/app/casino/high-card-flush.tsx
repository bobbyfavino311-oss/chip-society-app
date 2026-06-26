/**
 * High Card Flush — Chip Society premium casino game
 * 7 cards vs dealer. Flush length wins. Pull back or raise before showdown.
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
  dealHighCardFlush, getBestFlush, getRaiseMultiplier,
  resolveHighCardFlush,
  FLUSH_BONUS_TABLE, SF_BONUS_TABLE,
  type HCFCard, type HCFPhase, type HCFResult,
} from '@/lib/highCardFlush';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) { const v = abs / 1_000_000_000; return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}B`; }
  if (abs >= 1_000_000)     { const v = abs / 1_000_000;     return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}M`; }
  if (abs >= 1_000)         { const v = abs / 1_000;         return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}K`; }
  return String(abs);
}
function sleep(ms: number) { return new Promise<void>(r => setTimeout(r, ms)); }
const SUIT_NAMES: Record<string, string> = { S: 'SPADES', H: 'HEARTS', D: 'DIAMONDS', C: 'CLUBS' };
const SUIT_COLOR: Record<string, string> = { H: '#ff4466', D: '#ff4466', S: '#00d4ff', C: '#00d4ff' };

// ─── Info Modal ───────────────────────────────────────────────────────────────
function InfoModal({ visible, onClose, accent }: { visible: boolean; onClose: () => void; accent: string }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={im.overlay}>
        <View style={im.sheet}>
          <LinearGradient colors={['#0d0025', '#050010']} style={StyleSheet.absoluteFill} />
          <View style={im.header}>
            <Text style={[im.title, { color: accent }]}>HIGH CARD FLUSH</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}><Ionicons name="close" size={22} color="rgba(255,255,255,0.55)" /></TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

            <Text style={im.section}>HOW IT WORKS</Text>
            <Text style={im.body}>You and the dealer each receive 7 cards. The winner has the longer flush (most cards of one suit). If flush lengths tie, the highest card in that suit wins — continuing card by card until a winner is found. Identical flushes push.</Text>

            <Text style={im.section}>DEALER QUALIFICATION</Text>
            <Text style={im.body}>Dealer must qualify with a Nine-high three-card flush or better.{'\n'}• Dealer does NOT qualify → Ante wins, Raise pushes.{'\n'}• Dealer qualifies → Flushes are compared.</Text>

            <Text style={im.section}>RAISE RULES</Text>
            <View style={im.table}>
              <View style={im.row}><Text style={im.lbl}>2 – 4 Suited Cards</Text><Text style={[im.val, { color: accent }]}>RAISE 1×</Text></View>
              <View style={im.row}><Text style={im.lbl}>5 Suited Cards</Text><Text style={[im.val, { color: accent }]}>RAISE 2×</Text></View>
              <View style={im.row}><Text style={im.lbl}>6 – 7 Suited Cards</Text><Text style={[im.val, { color: accent }]}>RAISE 3×</Text></View>
            </View>
            <Text style={im.body}>Folding forfeits the Ante. Bonus bets ALWAYS resolve, even after a fold.</Text>

            <Text style={im.section}>FLUSH BONUS</Text>
            <Text style={im.body}>Based on your longest flush, paid regardless of the dealer result.</Text>
            <View style={im.table}>
              {FLUSH_BONUS_TABLE.map(row => (
                <View key={row.label} style={im.row}>
                  <Text style={im.lbl}>{row.label}</Text>
                  <Text style={[im.val, { color: '#ffd700' }]}>{row.mult} : 1</Text>
                </View>
              ))}
              <View style={im.row}><Text style={im.lbl}>3 or fewer</Text><Text style={[im.val, { color: 'rgba(255,255,255,0.3)' }]}>—</Text></View>
            </View>

            <Text style={im.section}>STRAIGHT FLUSH BONUS</Text>
            <Text style={im.body}>Consecutive suited cards (Ace plays high or low). Best qualifying hand pays.</Text>
            <View style={im.table}>
              {SF_BONUS_TABLE.map(row => (
                <View key={row.label} style={im.row}>
                  <Text style={im.lbl}>{row.label}</Text>
                  <Text style={[im.val, { color: '#bf5fff' }]}>{row.mult.toLocaleString()} : 1</Text>
                </View>
              ))}
              <View style={im.row}><Text style={im.lbl}>Fewer than 3</Text><Text style={[im.val, { color: 'rgba(255,255,255,0.3)' }]}>—</Text></View>
            </View>

            <Text style={im.section}>ANTE &amp; RAISE PAYOUTS</Text>
            <View style={im.table}>
              <View style={im.row}><Text style={im.lbl}>Player wins</Text><Text style={[im.val, { color: '#00ff88' }]}>1 : 1</Text></View>
              <View style={im.row}><Text style={im.lbl}>Dealer wins</Text><Text style={[im.val, { color: '#ff4444' }]}>Lose</Text></View>
              <View style={im.row}><Text style={im.lbl}>Tie</Text><Text style={[im.val, { color: '#00d4ff' }]}>Push</Text></View>
              <View style={im.row}><Text style={im.lbl}>Dealer no qualify</Text><Text style={[im.val, { color: '#00ff88' }]}>Ante wins · Raise push</Text></View>
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
function BetCircle({ label, amount, active, pushed, folded, accent = '#ffd700' }: {
  label: string; amount: number; active: boolean; pushed?: boolean; folded?: boolean; accent?: string;
}) {
  const dim = 62;
  const dimColor = pushed ? '#aaa' : folded ? '#888' : active ? accent : `${accent}35`;
  const statusLabel = pushed ? 'PUSH' : folded ? 'FOLDED' : label;
  return (
    <View style={[bc.wrap, { width: dim, height: dim, borderRadius: dim / 2, borderColor: active && !pushed && !folded ? accent : 'rgba(255,255,255,0.15)' }]}>
      {active && !pushed && !folded && <LinearGradient colors={[`${accent}28`, 'transparent']} style={StyleSheet.absoluteFill} />}
      <Text style={[bc.lbl, { color: dimColor, fontSize: pushed || folded ? 6 : 6.5 }]}>{statusLabel}</Text>
      <Text style={[bc.amt, { color: dimColor, fontFamily: 'Inter_700Bold' }]}>{amount > 0 ? fmt(amount) : '—'}</Text>
    </View>
  );
}
const bc = StyleSheet.create({
  wrap: { borderWidth: 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', gap: 1 },
  lbl:  { fontWeight: '800', fontFamily: 'Orbitron_700Bold', letterSpacing: 0.5, textAlign: 'center' },
  amt:  { fontSize: 11, fontWeight: '900' },
});

// ─── Action button ────────────────────────────────────────────────────────────
function ActionBtn({ label, sub, onPress, disabled, accent = '#00d4ff', fill, danger }: {
  label: string; sub?: string; onPress: () => void;
  disabled?: boolean; accent?: string; fill?: boolean; danger?: boolean;
}) {
  const c = danger ? '#ff6644' : accent;
  return (
    <TouchableOpacity
      style={[ab.btn, { borderColor: `${c}65`, opacity: disabled ? 0.35 : 1 }, fill && { backgroundColor: `${c}18` }]}
      onPress={onPress} disabled={disabled} activeOpacity={0.75}
    >
      {fill && <LinearGradient colors={[`${c}20`, 'transparent']} style={StyleSheet.absoluteFill} />}
      <Text style={[ab.label, { color: c }]}>{label}</Text>
      {sub ? <Text style={ab.sub}>{sub}</Text> : null}
    </TouchableOpacity>
  );
}
const ab = StyleSheet.create({
  btn:   { flex: 1, borderWidth: 1.5, borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', gap: 3, overflow: 'hidden' },
  label: { fontSize: 12, fontWeight: '900', fontFamily: 'Orbitron_900Black', letterSpacing: 1.5 },
  sub:   { fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.5 },
});

// ─── Result row ───────────────────────────────────────────────────────────────
function ResultRow({ label, net, sub, skipped }: { label: string; net?: number; sub?: string; skipped?: boolean }) {
  if (skipped) return (
    <View style={rr.row}>
      <Text style={rr.label}>{label}</Text>
      <Text style={[rr.val, { color: 'rgba(255,255,255,0.2)' }]}>—</Text>
    </View>
  );
  const color = net === 0 ? '#00d4ff' : (net ?? 0) > 0 ? '#00ff88' : '#ff4444';
  return (
    <View style={rr.row}>
      <View>
        <Text style={rr.label}>{label}</Text>
        {sub ? <Text style={rr.sub}>{sub}</Text> : null}
      </View>
      <Text style={[rr.val, { color, fontFamily: 'Inter_700Bold' }]}>
        {net === 0 ? 'PUSH' : (net ?? 0) > 0 ? `+${fmt(net!)}` : `-${fmt(Math.abs(net!))}`}
      </Text>
    </View>
  );
}
const rr = StyleSheet.create({
  row:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 4 },
  label: { fontSize: 9, fontFamily: 'Orbitron_400Regular', letterSpacing: 1, color: 'rgba(255,255,255,0.4)' },
  sub:   { fontSize: 8, color: 'rgba(255,255,255,0.25)', marginTop: 1 },
  val:   { fontSize: 13, fontWeight: '900' },
});

// ─── Card fan ─────────────────────────────────────────────────────────────────
function CardFan({
  cards, faceDown, anims, flushSuit, revealCount, size = 'sm',
}: {
  cards: HCFCard[];
  faceDown?: boolean;
  anims: Animated.Value[];
  flushSuit?: string;
  revealCount?: number;
  size?: 'sm' | 'casino' | 'md';
}) {
  const count = cards.length || 7;
  const OVERLAP = size === 'casino' ? -11 : size === 'sm' ? -10 : -14;

  return (
    <View style={{ flexDirection: 'row', alignSelf: 'center' }}>
      {Array.from({ length: count }).map((_, i) => {
        const card = cards[i];
        const revealed = typeof revealCount === 'number' ? i < revealCount : !faceDown;
        const isFlushCard = flushSuit && card && card.suit === flushSuit;
        const anim = anims[i];
        return (
          <Animated.View
            key={i}
            style={[
              { marginRight: i < count - 1 ? OVERLAP : 0, zIndex: i },
              anim ? {
                opacity: anim,
                transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] }) }],
              } : undefined,
            ]}
          >
            <View style={isFlushCard ? { borderRadius: 6, borderWidth: 2, borderColor: SUIT_COLOR[card!.suit] ?? '#ffd700' } : undefined}>
              {card ? (
                <PlayingCard card={card} faceDown={!revealed} size={size} />
              ) : (
                <View style={{ width: size === 'casino' ? 37 : size === 'sm' ? 32 : 46, height: size === 'casino' ? 53 : size === 'sm' ? 46 : 64, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderStyle: 'dashed' }} />
              )}
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function HighCardFlushScreen() {
  const insets = useSafeAreaInsets();
  const { profile, addChips, removeChips } = useUser();
  const { theme } = useTableTheme();
  const { isMusicMuted, toggleMusicMute } = useSoundSettings();
  const accent  = theme.accentPrimary   || '#00D4C8';
  const accent2 = theme.accentSecondary || '#bf5fff';

  // ── Game state ────────────────────────────────────────────────────────────
  const BONUS_STEPS = [0, 250_000, 500_000, 750_000, 1_000_000] as const;
  type BonusIdx = 0 | 1 | 2 | 3 | 4;
  const [phase,           setPhase]           = useState<HCFPhase>('stake');
  const [stake,           setStake]           = useState<StakeTier | null>(null);
  const [ante,            setAnte]            = useState(0);
  const [flushBonusIdx,   setFlushBonusIdx]   = useState<BonusIdx>(0);
  const [sfBonusIdx,      setSfBonusIdx]      = useState<BonusIdx>(0);
  const [flushBonusBet,   setFlushBonusBet]   = useState(0);
  const [sfBonusBet,      setSfBonusBet]      = useState(0);
  const [playerCards,     setPlayerCards]     = useState<HCFCard[]>([]);
  const [dealerCards,     setDealerCards]     = useState<HCFCard[]>([]);
  const [dealerReveal,    setDealerReveal]    = useState(0);   // 0-7
  const [totalWagered,    setTotalWagered]    = useState(0);
  const [raiseMult,       setRaiseMult]       = useState<1|2|3>(1);
  const [folded,          setFolded]          = useState(false);
  const [result,          setResult]          = useState<HCFResult | null>(null);
  const [showInfo,        setShowInfo]        = useState(false);
  const [busy,            setBusy]            = useState(false);

  // ── Refs for async closures ───────────────────────────────────────────────
  const playerCardsRef  = useRef<HCFCard[]>([]);
  const dealerCardsRef  = useRef<HCFCard[]>([]);
  const foldedRef       = useRef(false);
  const raiseMultRef    = useRef<1|2|3>(1);
  const anteRef         = useRef(0);
  const flushBonusBetRef = useRef(0);
  const sfBonusBetRef   = useRef(0);
  const totalWageredRef = useRef(0);

  // ── Animations ─────────────────────────────────────────────────────────────
  const pAnims = useRef(Array.from({ length: 7 }, () => new Animated.Value(0))).current;
  const dAnims = useRef(Array.from({ length: 7 }, () => new Animated.Value(0))).current;
  const resultSlide   = useRef(new Animated.Value(30)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;

  function resetAnims() {
    [...pAnims, ...dAnims].forEach(a => a.setValue(0));
    resultSlide.setValue(30);
    resultOpacity.setValue(0);
  }

  function animCard(anim: Animated.Value, delay = 0) {
    return new Promise<void>(resolve => {
      Animated.sequence([
        Animated.delay(delay),
        Animated.spring(anim, { toValue: 1, tension: 90, friction: 9, useNativeDriver: true }),
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
    setAnte(tier.ante);            anteRef.current = tier.ante;
    setFlushBonusIdx(0); setFlushBonusBet(0); flushBonusBetRef.current = 0;
    setSfBonusIdx(0);    setSfBonusBet(0);    sfBonusBetRef.current = 0;
    setTotalWagered(0);            totalWageredRef.current = 0;
    setRaiseMult(1);               raiseMultRef.current = 1;
    setFolded(false);              foldedRef.current = false;
    setPlayerCards([]);            playerCardsRef.current = [];
    setDealerCards([]);            dealerCardsRef.current = [];
    setDealerReveal(0);
    setResult(null);
    resetAnims();
    setPhase('betting');
  }

  // ── Deal ──────────────────────────────────────────────────────────────────
  async function handleDeal() {
    if (!stake || busy) return;
    const curAnte = anteRef.current;
    const curFlushBonus = flushBonusBetRef.current;
    const curSFBonus = sfBonusBetRef.current;
    const total = curAnte + curFlushBonus + curSFBonus;
    if (profile.chips < total) return;

    setBusy(true);
    resetAnims();
    setDealerReveal(0);
    setResult(null);
    setFolded(false);  foldedRef.current = false;

    removeChips(total);
    totalWageredRef.current = total;
    setTotalWagered(total);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const { playerCards: pc, dealerCards: dc } = dealHighCardFlush();
    playerCardsRef.current = [...pc];
    dealerCardsRef.current = [...dc];
    setPlayerCards([...pc]);
    setDealerCards([...dc]);

    const mult = getRaiseMultiplier(getBestFlush(pc).length);
    raiseMultRef.current = mult;
    setRaiseMult(mult);

    // Stagger deal — player and dealer cards interleaved
    await Promise.all([
      ...pAnims.map((a, i) => animCard(a, i * 55)),
      ...dAnims.map((a, i) => animCard(a, i * 55 + 28)),
    ]);

    setBusy(false);
    setPhase('decision');
  }

  // ── Reveal dealer cards then resolve ──────────────────────────────────────
  async function runReveal(wasFolded: boolean) {
    setBusy(true);
    setPhase('reveal');

    for (let i = 1; i <= 7; i++) {
      await sleep(160);
      setDealerReveal(i);
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await sleep(400);

    const pc  = playerCardsRef.current;
    const dc  = dealerCardsRef.current;
    const ra  = raiseMultRef.current;
    const a   = anteRef.current;
    const fb  = flushBonusBetRef.current;
    const sb  = sfBonusBetRef.current;
    const tw  = totalWageredRef.current;

    if (pc.length < 7 || dc.length < 7) { setBusy(false); return; }

    const res = resolveHighCardFlush({
      playerCards: pc, dealerCards: dc,
      folded: wasFolded,
      ante: a, raiseMult: ra,
      flushBonusBet: fb, sfBonusBet: sb,
    });

    addChips(tw + res.netChips);
    if (Platform.OS !== 'web') {
      if (res.netChips > 0) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    setResult(res);
    animateResult();
    setBusy(false);
    setPhase('result');
  }

  // ── Fold ──────────────────────────────────────────────────────────────────
  async function handleFold() {
    if (busy) return;
    foldedRef.current = true;
    setFolded(true);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await runReveal(true);
  }

  // ── Raise ─────────────────────────────────────────────────────────────────
  async function handleRaise() {
    if (busy) return;
    const raiseAmt = raiseMultRef.current * anteRef.current;
    if (profile.chips < raiseAmt) return;
    removeChips(raiseAmt);
    totalWageredRef.current += raiseAmt;
    setTotalWagered(w => w + raiseAmt);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await runReveal(false);
  }

  // ── Next hand ─────────────────────────────────────────────────────────────
  function handleNextHand() {
    resetAnims();
    setTotalWagered(0);     totalWageredRef.current = 0;
    setPlayerCards([]);     playerCardsRef.current = [];
    setDealerCards([]);     dealerCardsRef.current = [];
    setDealerReveal(0);
    setFolded(false);       foldedRef.current = false;
    setResult(null);
    setBusy(false);
    setFlushBonusIdx(0); setFlushBonusBet(0);    flushBonusBetRef.current = 0;
    setSfBonusIdx(0);    setSfBonusBet(0);       sfBonusBetRef.current = 0;
    setPhase('betting');
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const playerFlush   = playerCards.length > 0 ? getBestFlush(playerCards) : null;
  const flushLen      = playerFlush?.length ?? 0;
  const curRaiseMult  = flushLen > 0 ? getRaiseMultiplier(flushLen) : 1;
  const anteAmt       = stake?.ante ?? 0;
  const dealCost      = anteAmt + flushBonusBet + sfBonusBet;
  const canAffordDeal = profile.chips >= dealCost;
  const canAffordRaise = profile.chips >= curRaiseMult * anteAmt;
  const isBusted      = profile.chips < (stake?.ante ?? 0);
  const inGame        = phase === 'decision' || phase === 'reveal';
  const showCards     = inGame || phase === 'result';

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
        title="HIGH CARD FLUSH"
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
          <Text style={[s.headerTitle, { color: accent }]}>HIGH CARD FLUSH</Text>
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

      {/* ── Main table area ─────────────────────────────────────────────── */}
      <View style={s.table}>

        {/* Dealer section */}
        <View style={s.dealerSection}>
          <Text style={s.areaLabel}>DEALER</Text>
          {showCards ? (
            <>
              <CardFan
                cards={dealerCards}
                anims={dAnims}
                revealCount={dealerReveal}
                size="md"
              />
              {phase === 'result' && result && (
                <View style={[s.qualBadge, {
                  backgroundColor: result.dealerQualified ? `${accent}20` : 'rgba(255,100,50,0.15)',
                  borderColor:     result.dealerQualified ? accent : '#ff6432',
                }]}>
                  <Text style={[s.qualText, { color: result.dealerQualified ? accent : '#ff6432' }]}>
                    {result.dealerQualified
                      ? `QUALIFIES — ${result.dealerFlush.length}-CARD ${SUIT_NAMES[result.dealerFlush.suit]}`
                      : 'DOES NOT QUALIFY'}
                  </Text>
                </View>
              )}
              {(phase === 'reveal' || phase === 'decision') && (
                <View style={[s.qualBadge, { borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.04)' }]}>
                  <Text style={s.qualText}>7 CARDS — FACE DOWN</Text>
                </View>
              )}
            </>
          ) : (
            <View style={s.emptyRow}>
              {Array.from({ length: 7 }).map((_, i) => (
                <View key={i} style={[s.cardSlot, { marginRight: i < 6 ? -11 : 0 }]} />
              ))}
            </View>
          )}
        </View>

        {/* Center divider with hand strength indicator */}
        {phase === 'decision' && playerFlush && (
          <View style={s.centerBadge}>
            <Text style={[s.centerBadgeText, { color: accent }]}>
              {flushLen}-CARD {SUIT_NAMES[playerFlush.suit]} FLUSH
            </Text>
            <Text style={s.centerBadgeSub}>
              RAISE {curRaiseMult}× · {fmt(curRaiseMult * anteAmt)}
            </Text>
          </View>
        )}
        {phase === 'result' && result && (
          <View style={s.centerBadge}>
            <Text style={[s.centerBadgeText, {
              color: result.netChips > 0 ? '#00ff88' : result.netChips < 0 ? '#ff4444' : '#00d4ff',
            }]}>
              {result.folded
                ? 'FOLDED'
                : result.comparison === 'player'
                  ? 'YOU WIN'
                  : result.comparison === 'dealer'
                    ? 'DEALER WINS'
                    : 'PUSH'}
            </Text>
            {result.playerFlush && (
              <Text style={s.centerBadgeSub}>
                {result.playerFlush.length}-CARD {SUIT_NAMES[result.playerFlush.suit]} vs {result.dealerFlush.length}-CARD {SUIT_NAMES[result.dealerFlush.suit]}
              </Text>
            )}
          </View>
        )}

        {/* Player section */}
        <View style={s.playerSection}>
          {showCards ? (
            <>
              <CardFan
                cards={playerCards}
                anims={pAnims}
                flushSuit={playerFlush?.suit}
                size="md"
              />
              <Text style={[s.areaLabel, { marginTop: 6 }]}>
                {phase === 'decision' && playerFlush
                  ? `YOUR HAND — ${flushLen}-CARD ${SUIT_NAMES[playerFlush.suit]} FLUSH`
                  : 'YOUR HAND'}
              </Text>
            </>
          ) : (
            <>
              <View style={s.emptyRow}>
                {Array.from({ length: 7 }).map((_, i) => (
                  <View key={i} style={[s.cardSlot, { marginRight: i < 6 ? -11 : 0 }]} />
                ))}
              </View>
              <Text style={s.areaLabel}>YOUR HAND</Text>
            </>
          )}

          {/* Balance row */}
          <View style={s.balanceRow}>
            <View style={s.chipDot} />
            <Text style={s.balanceAmt}>{fmt(profile.chips)}</Text>
          </View>
        </View>
      </View>

      {/* ── Bet circles ──────────────────────────────────────────────────── */}
      {phase !== 'stake' && (
        <View style={s.betRow}>
          <BetCircle
            label="FLUSH BONUS"
            amount={flushBonusBet}
            active={flushBonusBet > 0}
            pushed={phase === 'result' && result !== null && flushBonusBet > 0 && result.flushBonusMult === 0}
            accent="#ffd700"
          />
          <BetCircle
            label="ANTE"
            amount={anteAmt}
            active={phase !== 'result' || (result !== null && result.anteNet >= 0)}
            pushed={phase === 'result' && result !== null && result.anteNet === 0}
            accent={accent}
          />
          <BetCircle
            label={phase === 'betting' ? 'RAISE' : folded ? 'RAISE' : `RAISE ×${raiseMult}`}
            amount={phase === 'betting' ? 0 : folded ? 0 : raiseMult * anteAmt}
            active={phase !== 'betting' && !folded}
            pushed={phase === 'result' && result !== null && result.raiseNet === 0 && !folded}
            folded={folded && phase === 'result'}
            accent={accent}
          />
          <BetCircle
            label="SF BONUS"
            amount={sfBonusBet}
            active={sfBonusBet > 0}
            pushed={phase === 'result' && result !== null && sfBonusBet > 0 && result.sfBonusMult === 0}
            accent={accent2}
          />
        </View>
      )}

      {/* ── Action panel ─────────────────────────────────────────────────── */}
      <View style={[s.actionPanel, { paddingBottom: insets.bottom + 8 }]}>

        {/* BETTING phase */}
        {phase === 'betting' && (
          <>
            <View style={s.bonusToggles}>
              <TouchableOpacity
                onPress={() => {
                  const nextIdx = ((flushBonusIdx + 1) % 5) as BonusIdx;
                  const next = BONUS_STEPS[nextIdx];
                  setFlushBonusIdx(nextIdx); setFlushBonusBet(next); flushBonusBetRef.current = next;
                }}
                style={[s.bonusToggle, flushBonusBet > 0 && { borderColor: `${'#ffd700'}80`, backgroundColor: '#ffd70012' }]}
              >
                <Text style={[s.bonusToggleText, { color: flushBonusBet > 0 ? '#ffd700' : 'rgba(255,255,255,0.35)' }]}>
                  {flushBonusBet > 0 ? `✓ FLUSH BONUS  +${fmt(flushBonusBet)}` : 'ADD FLUSH BONUS  (optional)'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  const nextIdx = ((sfBonusIdx + 1) % 5) as BonusIdx;
                  const next = BONUS_STEPS[nextIdx];
                  setSfBonusIdx(nextIdx); setSfBonusBet(next); sfBonusBetRef.current = next;
                }}
                style={[s.bonusToggle, sfBonusBet > 0 && { borderColor: `${accent2}80`, backgroundColor: `${accent2}12` }]}
              >
                <Text style={[s.bonusToggleText, { color: sfBonusBet > 0 ? accent2 : 'rgba(255,255,255,0.35)' }]}>
                  {sfBonusBet > 0 ? `✓ SF BONUS  +${fmt(sfBonusBet)}` : 'ADD STRAIGHT FLUSH BONUS  (optional)'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={s.btnRow}>
              <ActionBtn
                label="DEAL"
                sub={canAffordDeal ? `Bet ${fmt(dealCost)} total` : 'Insufficient chips'}
                onPress={handleDeal}
                disabled={!canAffordDeal}
                accent={accent}
                fill
              />
            </View>
          </>
        )}

        {/* DECISION phase */}
        {phase === 'decision' && !busy && (
          <>
            <Text style={s.decisionLabel}>VIEW 7 CARDS · CHOOSE YOUR ACTION</Text>
            <View style={s.btnRow}>
              <ActionBtn
                label="FOLD"
                sub={`Forfeit ${fmt(anteAmt)} ante`}
                onPress={handleFold}
                accent="rgba(255,255,255,0.55)"
                danger
              />
              <ActionBtn
                label={`RAISE ×${curRaiseMult}`}
                sub={canAffordRaise ? `Add ${fmt(curRaiseMult * anteAmt)}` : 'Insufficient chips'}
                onPress={handleRaise}
                disabled={!canAffordRaise}
                accent={accent}
                fill
              />
            </View>
          </>
        )}

        {/* REVEAL spinner */}
        {phase === 'reveal' && (
          <View style={s.busyRow}>
            <Text style={[s.busyText, { color: `${accent}66` }]}>REVEALING DEALER...</Text>
          </View>
        )}

        {/* RESULT panel */}
        {phase === 'result' && result && (
          <Animated.View style={[s.resultPanel, { opacity: resultOpacity, transform: [{ translateY: resultSlide }] }]}>
            <LinearGradient colors={['rgba(0,0,0,0.65)', 'rgba(0,0,0,0.35)']} style={StyleSheet.absoluteFill} />
            <ResultRow
              label="ANTE"
              net={result.anteNet}
              sub={result.folded ? 'Folded' : result.dealerQualified ? undefined : 'Dealer no qualify'}
            />
            {!result.folded ? (
              <ResultRow
                label={`RAISE ×${result.raiseMult}`}
                net={result.raiseNet}
                sub={!result.dealerQualified ? 'Push — dealer no qualify' : undefined}
              />
            ) : (
              <ResultRow label="RAISE" skipped />
            )}
            {flushBonusBet > 0 ? (
              <ResultRow
                label="FLUSH BONUS"
                net={result.flushBonusNet}
                sub={result.flushBonusMult > 0 ? `${result.flushBonusMult}:1` : 'No qualifying flush'}
              />
            ) : null}
            {sfBonusBet > 0 ? (
              <ResultRow
                label="SF BONUS"
                net={result.sfBonusNet}
                sub={result.sfBonusMult > 0 ? `${result.sfBonusMult}:1` : 'No straight flush'}
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
  headerTitle:  { fontSize: 13, fontFamily: 'Orbitron_900Black', letterSpacing: 2 },
  headerSub:    { fontSize: 9, color: 'rgba(255,255,255,0.4)', fontFamily: 'Orbitron_400Regular', marginTop: 2 },
  headerRight:  { flexDirection: 'row', gap: 8 },
  iconBtn:      { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  iconBtnMuted: { opacity: 0.4 },

  table:         { flex: 1, paddingHorizontal: 14, justifyContent: 'space-between', paddingVertical: 6 },
  dealerSection: { alignItems: 'center', gap: 8 },
  playerSection: { alignItems: 'center', gap: 4 },
  areaLabel:     { fontSize: 8, fontFamily: 'Orbitron_400Regular', letterSpacing: 1.5, color: 'rgba(255,255,255,0.3)', textAlign: 'center' },

  qualBadge:   { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginTop: 2 },
  qualText:    { fontSize: 8, fontFamily: 'Orbitron_700Bold', letterSpacing: 1, textAlign: 'center', color: 'rgba(255,255,255,0.3)' },

  emptyRow:    { flexDirection: 'row', alignSelf: 'center' },
  cardSlot:    { width: 37, height: 53, borderRadius: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderStyle: 'dashed' },

  centerBadge:     { alignItems: 'center', paddingVertical: 4 },
  centerBadgeText: { fontSize: 13, fontFamily: 'Orbitron_900Black', letterSpacing: 1.5 },
  centerBadgeSub:  { fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 2, fontFamily: 'Orbitron_400Regular' },

  balanceRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  chipDot:     { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ffd700' },
  balanceAmt:  { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },

  betRow:      { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 8 },

  actionPanel: { backgroundColor: 'rgba(0,0,0,0.55)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)', paddingHorizontal: 14, paddingTop: 10, gap: 8 },
  bonusToggles:{ gap: 4 },
  bonusToggle: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, alignItems: 'center' },
  bonusToggleText: { fontSize: 10, fontFamily: 'Orbitron_700Bold', letterSpacing: 0.8 },
  btnRow:      { flexDirection: 'row', gap: 10 },
  decisionLabel: { fontSize: 8, fontFamily: 'Orbitron_400Regular', letterSpacing: 1, color: 'rgba(255,255,255,0.3)', textAlign: 'center' },
  busyRow:     { alignItems: 'center', paddingVertical: 8 },
  busyText:    { fontSize: 11, fontFamily: 'Orbitron_700Bold', letterSpacing: 2 },
  resultPanel: { borderRadius: 14, overflow: 'hidden', padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  netDivider:  { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 6 },
  netRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  netLabel:    { fontSize: 9, fontFamily: 'Orbitron_700Bold', letterSpacing: 2, color: 'rgba(255,255,255,0.5)' },
  netAmt:      { fontSize: 18, fontWeight: '900' },
});
