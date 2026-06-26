/**
 * Casino War — Chip Society premium game screen
 * Fastest casino game: one card each, instant result.
 */
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated, Modal, Platform, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import PlayingCard from '@/components/PlayingCard';
import StakeSelectModal from '@/components/StakeSelectModal';
import { useUser } from '@/context/UserContext';
import { useTableTheme } from '@/context/TableThemeContext';
import { useSoundSettings } from '@/context/SoundContext';
import { MusicEngine } from '@/lib/musicEngine';
import { STAKE_TIERS, type StakeTier } from '@/lib/stakeConfig';
import {
  dealCasinoWar, dealWarCards, resolveCasinoWar,
  type CWCard, type CWOutcome, type CWWarOutcome, type CWResult,
} from '@/lib/casinoWar';

// ─── Types ─────────────────────────────────────────────────────────────────────
type Phase =
  | 'stake'
  | 'betting'
  | 'dealing'
  | 'result'
  | 'war_choice'
  | 'war_dealing'
  | 'war_result';

// ─── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${(abs / 1_000_000_000 % 1 === 0 ? (abs / 1_000_000_000).toFixed(0) : (abs / 1_000_000_000).toFixed(1))}B`;
  if (abs >= 1_000_000)     return `${(abs / 1_000_000 % 1 === 0 ? (abs / 1_000_000).toFixed(0) : (abs / 1_000_000).toFixed(1))}M`;
  if (abs >= 1_000)         return `${(abs / 1_000 % 1 === 0 ? (abs / 1_000).toFixed(0) : (abs / 1_000).toFixed(1))}K`;
  return String(abs);
}
function sleep(ms: number) { return new Promise<void>(r => setTimeout(r, ms)); }

// ─── Paytable modal ────────────────────────────────────────────────────────────
function PaytableModal({ visible, onClose, accent }: { visible: boolean; onClose: () => void; accent: string }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={pm.overlay} activeOpacity={1} onPress={onClose}>
        <View style={pm.sheet}>
          <LinearGradient colors={['#0e002a', '#050010']} style={StyleSheet.absoluteFill} />
          <View style={pm.header}>
            <Text style={[pm.title, { color: accent }]}>HOW TO PLAY</Text>
            <TouchableOpacity onPress={onClose} style={pm.closeBtn}>
              <Ionicons name="close" size={20} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          </View>
          {[
            { h: 'PLAYER WINS',  d: "Your card beats Dealer's card — Ante pays 1:1" },
            { h: 'DEALER WINS',  d: "Dealer's card beats yours — Ante loses" },
            { h: 'TIE — WAR',    d: 'Matching ranks — choose SURRENDER or GO TO WAR' },
            { h: 'SURRENDER',    d: 'Lose only half your Ante. Round ends.' },
            { h: 'GO TO WAR',    d: "Place equal raise. One more card each:\n• You win — raise pays 1:1, original Ante pushes\n• Dealer wins — lose both bets\n• Tie again — raise pays 2:1 BONUS, Ante pushes" },
            { h: 'TIE BET',      d: 'Optional bet — pays 10:1 if initial cards tie.\nIndependent of war outcome.' },
            { h: 'CARD RANKING', d: "Ace is highest (14). 2 is lowest. Suits don't matter." },
          ].map(r => (
            <View key={r.h} style={pm.row}>
              <Text style={[pm.hand, { color: accent }]}>{r.h}</Text>
              <Text style={pm.desc}>{r.d}</Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
const pm = StyleSheet.create({
  overlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.82)', justifyContent: 'flex-end' },
  sheet:    { borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', padding: 20, gap: 10 },
  header:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  title:    { fontSize: 14, fontWeight: '900', fontFamily: 'Orbitron_900Black', letterSpacing: 3 },
  closeBtn: { padding: 4 },
  row:      { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)', paddingVertical: 8, gap: 3 },
  hand:     { fontSize: 9, fontWeight: '800', fontFamily: 'Orbitron_700Bold', letterSpacing: 1.5 },
  desc:     { fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 16 },
});

// ─── Bet circle ────────────────────────────────────────────────────────────────
function BetCircle({ label, amount, active, accent = '#ffd700', onPress, sub }: {
  label: string; amount: number; active: boolean; accent?: string; onPress?: () => void; sub?: string;
}) {
  const Wrap = onPress ? TouchableOpacity : View;
  return (
    <Wrap
      style={[bc.wrap, { borderColor: active ? accent : `${accent}30` }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {active && <LinearGradient colors={[`${accent}28`, 'transparent']} style={StyleSheet.absoluteFill} />}
      <Text style={[bc.lbl, { color: active ? `${accent}cc` : `${accent}55` }]}>{label}</Text>
      <Text style={[bc.amt, { color: active ? accent : `${accent}44`, fontFamily: 'Inter_700Bold' }]}>
        {amount > 0 ? fmt(amount) : '—'}
      </Text>
      {sub ? <Text style={[bc.sub, { color: active ? `${accent}88` : `${accent}33` }]}>{sub}</Text> : null}
    </Wrap>
  );
}
const bc = StyleSheet.create({
  wrap: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', gap: 1 },
  lbl:  { fontSize: 7, fontWeight: '800', fontFamily: 'Orbitron_700Bold', letterSpacing: 0.5, textAlign: 'center' },
  amt:  { fontSize: 13, fontWeight: '900' },
  sub:  { fontSize: 6.5, fontFamily: 'Orbitron_400Regular', letterSpacing: 0.5 },
});

// ─── Action button ─────────────────────────────────────────────────────────────
function ActionBtn({ label, sub, onPress, disabled, accent = '#00D4C8', fill }: {
  label: string; sub?: string; onPress: () => void; disabled?: boolean; accent?: string; fill?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[ab.btn, { borderColor: `${accent}70`, opacity: disabled ? 0.35 : 1 }, fill && { backgroundColor: `${accent}1a` }]}
      onPress={onPress} disabled={disabled} activeOpacity={0.75}
    >
      {fill && <LinearGradient colors={[`${accent}18`, 'transparent']} style={StyleSheet.absoluteFill} />}
      <Text style={[ab.label, { color: accent }]}>{label}</Text>
      {sub ? <Text style={ab.sub}>{sub}</Text> : null}
    </TouchableOpacity>
  );
}
const ab = StyleSheet.create({
  btn:   { flex: 1, borderWidth: 1.5, borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', gap: 3, overflow: 'hidden' },
  label: { fontSize: 13, fontWeight: '900', fontFamily: 'Orbitron_900Black', letterSpacing: 2 },
  sub:   { fontSize: 9, color: 'rgba(255,255,255,0.38)', letterSpacing: 0.5 },
});

// ─── Result row ────────────────────────────────────────────────────────────────
type RowOutcome = 'win' | 'loss' | 'push' | 'none';
function ResultRow({ label, outcome, amount, sub }: { label: string; outcome: RowOutcome; amount?: number; sub?: string }) {
  const color = outcome === 'win' ? '#00ff88' : outcome === 'loss' ? '#ff4444' : outcome === 'push' ? '#00d4ff' : 'rgba(255,255,255,0.2)';
  const sign  = outcome === 'win' ? '+' : outcome === 'loss' ? '-' : '';
  const text  = outcome === 'push' ? 'PUSH' : outcome === 'none' ? 'NO BET' : `${sign}${fmt(amount ?? 0)}`;
  return (
    <View style={rr.row}>
      <View style={{ flex: 1 }}>
        <Text style={rr.label}>{label}</Text>
        {sub ? <Text style={rr.sub}>{sub}</Text> : null}
      </View>
      <Text style={[rr.value, { color, fontFamily: 'Inter_700Bold' }]}>{text}</Text>
    </View>
  );
}
const rr = StyleSheet.create({
  row:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  label: { fontSize: 9, fontFamily: 'Orbitron_400Regular', letterSpacing: 1, color: 'rgba(255,255,255,0.4)' },
  sub:   { fontSize: 8, color: 'rgba(255,255,255,0.22)', marginTop: 1 },
  value: { fontSize: 14, fontWeight: '900' },
});

// ─── Card station ──────────────────────────────────────────────────────────────
function CardStation({ card, warCard, slideAnim, warSlideAnim, winner, label }: {
  card: CWCard | null;
  warCard?: CWCard | null;
  slideAnim: Animated.Value;
  warSlideAnim?: Animated.Value;
  winner?: boolean;
  label: string;
}) {
  return (
    <View style={cs.wrap}>
      <Text style={cs.label}>{label}</Text>
      <View style={cs.cardsRow}>
        {warCard && warSlideAnim ? (
          <Animated.View style={{
            transform: [{ translateY: warSlideAnim }],
            opacity: warSlideAnim.interpolate({ inputRange: [-60, 0], outputRange: [0, 1] }),
          }}>
            <PlayingCard card={{ suit: warCard.suit, value: warCard.value }} faceDown={false} size="lg" />
          </Animated.View>
        ) : null}
        <Animated.View style={[
          { transform: [{ translateY: slideAnim }] },
          winner && cs.winnerGlow,
        ]}>
          {card ? (
            <PlayingCard card={{ suit: card.suit, value: card.value }} faceDown={false} size="lg" />
          ) : (
            <View style={cs.placeholder} />
          )}
        </Animated.View>
      </View>
    </View>
  );
}
const cs = StyleSheet.create({
  wrap:        { alignItems: 'center', gap: 6 },
  label:       { fontSize: 8, fontWeight: '800', fontFamily: 'Orbitron_700Bold', letterSpacing: 2, color: 'rgba(255,255,255,0.35)' },
  cardsRow:    { flexDirection: 'row', gap: 8, alignItems: 'center' },
  placeholder: { width: 60, height: 84, borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.10)', borderStyle: 'dashed', backgroundColor: 'rgba(255,255,255,0.03)' },
  winnerGlow:  { shadowColor: '#ffd700', shadowOpacity: 0.8, shadowRadius: 14, shadowOffset: { width: 0, height: 0 } },
});

// ─── Main screen ───────────────────────────────────────────────────────────────
export default function CasinoWarScreen() {
  const insets = useSafeAreaInsets();
  const { profile, addChips, removeChips } = useUser();
  const { theme } = useTableTheme();
  const { isMusicMuted, toggleMusicMute } = useSoundSettings();

  const accent  = theme.accentPrimary   || '#FF6EA0';
  const accent2 = theme.accentSecondary || '#bf5fff';

  // ── Phase / game state ───────────────────────────────────────────────────────
  const [phase,         setPhase]         = useState<Phase>('stake');
  const [stake,         setStake]         = useState<StakeTier | null>(null);
  const BONUS_STEPS = [0, 250_000, 500_000, 750_000, 1_000_000] as const;
  type TieBetIdx = 0 | 1 | 2 | 3 | 4;
  const [ante,          setAnte]          = useState(0);
  const [tieBetMult,    setTieBetMult]    = useState<TieBetIdx>(0);
  const [deck,          setDeck]          = useState<CWCard[]>([]);
  const [playerCard,    setPlayerCard]    = useState<CWCard | null>(null);
  const [dealerCard,    setDealerCard]    = useState<CWCard | null>(null);
  const [warPlayerCard, setWarPlayerCard] = useState<CWCard | null>(null);
  const [warDealerCard, setWarDealerCard] = useState<CWCard | null>(null);
  const [outcome,       setOutcome]       = useState<CWOutcome | null>(null);
  const [result,        setResult]        = useState<CWResult | null>(null);
  const [winner,        setWinner]        = useState<'player' | 'dealer' | null>(null);
  const [paytable,      setPaytable]      = useState(false);
  /** Tracks total chips removed from balance this round — used for clean chip settlement */
  const [totalWagered,  setTotalWagered]  = useState(0);

  // ── Animations ──────────────────────────────────────────────────────────────
  const dealerSlide    = useRef(new Animated.Value(-80)).current;
  const playerSlide    = useRef(new Animated.Value(80)).current;
  const warDealerSlide = useRef(new Animated.Value(-60)).current;
  const warPlayerSlide = useRef(new Animated.Value(60)).current;
  const bannerScale    = useRef(new Animated.Value(0)).current;
  const bannerOpacity  = useRef(new Animated.Value(0)).current;
  const warScale       = useRef(new Animated.Value(0)).current;
  const resultSlide    = useRef(new Animated.Value(30)).current;
  const resultOpacity  = useRef(new Animated.Value(0)).current;

  function resetAnims() {
    dealerSlide.setValue(-80);
    playerSlide.setValue(80);
    warDealerSlide.setValue(-60);
    warPlayerSlide.setValue(60);
    bannerScale.setValue(0);
    bannerOpacity.setValue(0);
    warScale.setValue(0);
    resultSlide.setValue(30);
    resultOpacity.setValue(0);
  }

  function animateCards() {
    return new Promise<void>(resolve => {
      Animated.parallel([
        Animated.spring(dealerSlide, { toValue: 0, tension: 80, friction: 9, useNativeDriver: true }),
        Animated.spring(playerSlide, { toValue: 0, tension: 80, friction: 9, useNativeDriver: true }),
      ]).start(() => resolve());
    });
  }

  function animateWarCards() {
    return new Promise<void>(resolve => {
      Animated.parallel([
        Animated.spring(warDealerSlide, { toValue: 0, tension: 90, friction: 8, useNativeDriver: true }),
        Animated.spring(warPlayerSlide, { toValue: 0, tension: 90, friction: 8, useNativeDriver: true }),
      ]).start(() => resolve());
    });
  }

  function animateBanner() {
    return new Promise<void>(resolve => {
      Animated.parallel([
        Animated.spring(bannerScale, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
        Animated.timing(bannerOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start(() => resolve());
    });
  }

  function animateWarBanner() {
    return new Promise<void>(resolve => {
      Animated.sequence([
        Animated.spring(warScale, { toValue: 1.25, tension: 40, friction: 5, useNativeDriver: true }),
        Animated.spring(warScale, { toValue: 1.0,  tension: 80, friction: 8, useNativeDriver: true }),
      ]).start(() => resolve());
    });
  }

  function animateResult() {
    Animated.parallel([
      Animated.timing(resultSlide,   { toValue: 0, duration: 280, useNativeDriver: true }),
      Animated.timing(resultOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
    ]).start();
  }

  // ── Stake selection ──────────────────────────────────────────────────────────
  function handleStakeSelect(tier: StakeTier) {
    setStake(tier);
    setAnte(tier.ante);
    setTieBetMult(0);
    setTotalWagered(0);
    setPhase('betting');
    resetAnims();
    setPlayerCard(null); setDealerCard(null);
    setWarPlayerCard(null); setWarDealerCard(null);
    setOutcome(null); setResult(null); setWinner(null);
  }

  // ── Deal ─────────────────────────────────────────────────────────────────────
  const handleDeal = useCallback(async () => {
    if (!stake) return;
    const tieBet   = BONUS_STEPS[tieBetMult];
    const totalBet = ante + tieBet;
    if (profile.chips < totalBet) return;

    setPhase('dealing');
    resetAnims();
    setWarPlayerCard(null); setWarDealerCard(null); setResult(null);

    removeChips(totalBet);
    setTotalWagered(totalBet);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const { deck: remaining, playerCard: pc, dealerCard: dc, outcome: oc } = dealCasinoWar();
    setPlayerCard(pc);
    setDealerCard(dc);
    setDeck(remaining);
    setOutcome(oc);

    await animateCards();
    await sleep(300);

    if (oc === 'tie') {
      await animateBanner();
      setPhase('war_choice');
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      const res = resolveCasinoWar({ outcome: oc, ante, tieBet });
      setResult(res);
      setWinner(oc === 'player_wins' ? 'player' : 'dealer');
      // Return total wagered + net profit (handles win, loss, push cleanly)
      addChips(totalBet + res.netChips);
      setPhase('result');
      animateResult();
      if (Platform.OS !== 'web') {
        if (res.netChips > 0) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stake, ante, tieBetMult, profile.chips]);

  // ── War: Surrender ────────────────────────────────────────────────────────────
  const handleSurrender = useCallback(() => {
    if (!outcome) return;
    const tieBet = BONUS_STEPS[tieBetMult];
    const res = resolveCasinoWar({ outcome, isSurrender: true, ante, tieBet });
    setResult(res);
    setWinner(null);
    // Return: totalWagered + netChips
    // (netChips = -floor(ante/2) + tieBetNet, so player gets back half ante + tieBet win if any)
    addChips(totalWagered + res.netChips);
    setPhase('result');
    animateResult();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outcome, ante, tieBetMult, totalWagered]);

  // ── War: Go to War ────────────────────────────────────────────────────────────
  const handleGoToWar = useCallback(async () => {
    if (!outcome || !deck.length) return;
    // War raise = another ante
    if (profile.chips < ante) return;
    removeChips(ante);
    const newTotalWagered = totalWagered + ante;
    setTotalWagered(newTotalWagered);
    setPhase('war_dealing');
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    await animateWarBanner();

    const { warDealerCard: wdc, warPlayerCard: wpc, warOutcome: wo } = dealWarCards(deck);
    setWarDealerCard(wdc);
    setWarPlayerCard(wpc);

    await animateWarCards();
    await sleep(400);

    const tieBet = BONUS_STEPS[tieBetMult];
    const res = resolveCasinoWar({ outcome, warOutcome: wo, ante, tieBet });
    setResult(res);
    // Return: newTotalWagered + netChips (settles all bets cleanly)
    addChips(newTotalWagered + res.netChips);
    setWinner(wo === 'player_wins' || wo === 'war_tie' ? 'player' : 'dealer');
    setPhase('war_result');
    animateResult();
    if (Platform.OS !== 'web') {
      if (res.netChips > 0) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outcome, deck, ante, tieBetMult, totalWagered, profile.chips]);

  // ── Next hand ─────────────────────────────────────────────────────────────────
  function handleNextHand() {
    resetAnims();
    setTotalWagered(0);
    setPlayerCard(null); setDealerCard(null);
    setWarPlayerCard(null); setWarDealerCard(null);
    setOutcome(null); setResult(null); setWinner(null);
    setPhase('betting');
  }

  useEffect(() => {
    MusicEngine.configure({ muted: isMusicMuted });
    MusicEngine.play();
    return () => MusicEngine.stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    MusicEngine.configure({ muted: isMusicMuted });
  }, [isMusicMuted]);

  // ─── Derived ──────────────────────────────────────────────────────────────────
  const tieBet      = BONUS_STEPS[tieBetMult];
  const totalBet    = ante + tieBet;
  const canAfford   = profile.chips >= totalBet;
  const isBusted    = profile.chips < (stake?.ante ?? 0);
  const isDealing   = phase === 'dealing' || phase === 'war_dealing';
  const isResult    = phase === 'result' || phase === 'war_result';
  const isWarChoice = phase === 'war_choice';

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      {/* Background */}
      <LinearGradient
        colors={[...theme.bgGradient] as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
      />

      {/* Stake Modal */}
      <StakeSelectModal
        visible={phase === 'stake'}
        chips={profile.chips}
        title="CASINO WAR"
        onBack={() => router.back()}
        onSelect={handleStakeSelect}
      />

      {/* Paytable */}
      <PaytableModal visible={paytable} onClose={() => setPaytable(false)} accent={accent} />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={[s.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 16 : 10) }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        <View style={s.headerCenter}>
          <Text style={[s.headerTitle, { color: accent }]}>CASINO WAR</Text>
          {stake && (
            <Text style={s.headerSub}>{stake.label} · ANTE {fmt(stake.ante)}</Text>
          )}
        </View>

        <View style={s.headerRight}>
          <TouchableOpacity
            onPress={() => setPaytable(true)}
            style={[s.iconBtn, { borderColor: `${accent}50`, borderWidth: 1 }]}
            hitSlop={10}
          >
            <Ionicons name="information-circle-outline" size={20} color={`${accent}dd`} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={toggleMusicMute}
            style={[s.iconBtn, isMusicMuted && s.iconBtnMuted]}
            hitSlop={10}
          >
            <Ionicons
              name={isMusicMuted ? 'musical-notes-outline' : 'musical-notes'}
              size={18}
              color={isMusicMuted ? 'rgba(255,255,255,0.28)' : `${accent}dd`}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <View style={s.table}>

        {/* Dealer card */}
        <View style={s.stationWrap}>
          <CardStation
            label="DEALER"
            card={dealerCard}
            warCard={warDealerCard}
            slideAnim={dealerSlide}
            warSlideAnim={warDealerSlide}
            winner={winner === 'dealer'}
          />
        </View>

        {/* Center — VS / WAR banner / outcome */}
        <View style={s.centerZone}>
          {/* TIE / WAR banner */}
          {(isWarChoice || phase === 'war_dealing' || phase === 'war_result') && (
            <Animated.View style={[s.warBanner, {
              transform: [{ scale: isWarChoice ? bannerScale : warScale }],
              opacity: bannerOpacity,
            }]}>
              <LinearGradient colors={['#6600CC', '#FF0090']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
              <Text style={s.warText}>⚡ WAR ⚡</Text>
            </Animated.View>
          )}

          {/* Outcome banner (non-war hands only) */}
          {phase === 'result' && result && (
            <Animated.View style={[s.outcomeBanner, { transform: [{ translateY: resultSlide }], opacity: resultOpacity }]}>
              {result.netChips > 0
                ? <Text style={[s.outcomeText, { color: '#00ff88' }]}>YOU WIN  +{fmt(result.netChips)}</Text>
                : result.netChips < 0
                ? <Text style={[s.outcomeText, { color: '#ff4444' }]}>YOU LOSE  -{fmt(Math.abs(result.netChips))}</Text>
                : <Text style={[s.outcomeText, { color: '#00d4ff' }]}>PUSH</Text>
              }
            </Animated.View>
          )}

          {/* War result banner */}
          {phase === 'war_result' && result && (
            <Animated.View style={[s.outcomeBanner, { transform: [{ translateY: resultSlide }], opacity: resultOpacity }]}>
              {result.netChips > 0
                ? <Text style={[s.outcomeText, { color: '#00ff88' }]}>WAR WON  +{fmt(result.netChips)}</Text>
                : result.netChips < 0
                ? <Text style={[s.outcomeText, { color: '#ff4444' }]}>WAR LOST  -{fmt(Math.abs(result.netChips))}</Text>
                : <Text style={[s.outcomeText, { color: '#00d4ff' }]}>PUSH</Text>
              }
            </Animated.View>
          )}

          {/* VS divider */}
          {(phase === 'betting' || phase === 'dealing') && (
            <View style={s.vsDivider}>
              <View style={s.vsLine} />
              <Text style={s.vsText}>VS</Text>
              <View style={s.vsLine} />
            </View>
          )}
        </View>

        {/* Player card + balance */}
        <View style={s.playerStation}>
          <CardStation
            label="YOU"
            card={playerCard}
            warCard={warPlayerCard}
            slideAnim={playerSlide}
            warSlideAnim={warPlayerSlide}
            winner={winner === 'player'}
          />
          {/* Chip balance — player station */}
          <View style={s.playerChipRow}>
            <View style={s.chipDot} />
            <Text style={[s.playerChipAmt, { fontFamily: 'Inter_700Bold' }]}>{fmt(profile.chips)}</Text>
          </View>
        </View>
      </View>

      {/* ── Bottom controls ──────────────────────────────────────────────── */}
      <View style={[s.bottom, { paddingBottom: insets.bottom + 10 }]}>

        {/* Bet circles — always visible when in game (except dealing) */}
        {phase !== 'stake' && !isDealing && (
          <View style={s.circles}>
            <BetCircle
              label="TIE BET"
              amount={tieBet}
              active={tieBetMult > 0}
              accent={accent2}
              sub={phase === 'betting' ? 'TAP TO SET' : undefined}
              onPress={phase === 'betting' ? () => setTieBetMult(m => ((m + 1) % 5) as TieBetIdx) : undefined}
            />
            <BetCircle
              label="ANTE"
              amount={ante}
              active={true}
              accent="#ffd700"
            />
          </View>
        )}

        {/* Result breakdown */}
        {isResult && result && (
          <Animated.View style={[s.resultPanel, { transform: [{ translateY: resultSlide }], opacity: resultOpacity }]}>
            <LinearGradient colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.35)']} style={StyleSheet.absoluteFill} />
            <ResultRow
              label="ANTE"
              outcome={result.anteNet > 0 ? 'win' : result.anteNet < 0 ? 'loss' : 'push'}
              amount={Math.abs(result.anteNet)}
              sub={result.isSurrender ? 'Surrender — lose half' : undefined}
            />
            {result.tieBet > 0 && (
              <ResultRow
                label="TIE BET"
                outcome={result.tieBetNet > 0 ? 'win' : result.tieBetNet < 0 ? 'loss' : 'push'}
                amount={Math.abs(result.tieBetNet)}
                sub={result.tieBetNet > 0 ? '10:1 payout' : 'No matching ranks'}
              />
            )}
            {result.warNet !== 0 && (
              <ResultRow
                label={result.warOutcome === 'war_tie' ? 'WAR RAISE (2:1)' : 'WAR RAISE'}
                outcome={result.warNet > 0 ? 'win' : 'loss'}
                amount={Math.abs(result.warNet)}
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

        {/* Deal button */}
        {phase === 'betting' && (
          <View style={s.btnRow}>
            <ActionBtn
              label="DEAL"
              sub={canAfford ? `Bet ${fmt(totalBet)}` : 'Insufficient chips'}
              onPress={handleDeal}
              disabled={!canAfford || isBusted}
              accent={accent}
              fill
            />
          </View>
        )}

        {/* War options */}
        {isWarChoice && (
          <View style={s.btnRow}>
            <ActionBtn
              label="SURRENDER"
              sub={`Lose ${fmt(Math.floor(ante / 2))}`}
              onPress={handleSurrender}
              accent="rgba(255,255,255,0.55)"
            />
            <ActionBtn
              label="GO TO WAR"
              sub={`+${fmt(ante)} raise`}
              onPress={handleGoToWar}
              disabled={profile.chips < ante}
              accent={accent}
              fill
            />
          </View>
        )}

        {/* Dealing spinner text */}
        {isDealing && (
          <View style={s.dealingRow}>
            <Text style={[s.dealingText, { color: `${accent}66` }]}>DEALING...</Text>
          </View>
        )}

        {/* Next hand */}
        {isResult && (
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

// ─── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:         { flex: 1 },

  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 8, gap: 8 },
  backBtn:      { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle:  { fontSize: 14, fontWeight: '900', fontFamily: 'Orbitron_900Black', letterSpacing: 2 },
  headerSub:    { fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, marginTop: 2 },
  headerRight:  { flexDirection: 'row', gap: 6 },
  iconBtn:      { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)' },
  iconBtnMuted: { backgroundColor: 'rgba(255,255,255,0.03)' },

  table:        { flex: 1, justifyContent: 'space-evenly', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 4 },

  stationWrap:  { alignItems: 'center' },

  playerStation:{ alignItems: 'center', gap: 8 },
  playerChipRow:{ flexDirection: 'row', alignItems: 'center', gap: 5 },
  chipDot:      { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ffd700', borderWidth: 2, borderColor: 'rgba(255,215,0,0.4)' },
  playerChipAmt:{ fontSize: 14, color: '#ffd700', letterSpacing: 0.5 },

  centerZone:   { width: '100%', alignItems: 'center', minHeight: 56, justifyContent: 'center' },
  vsDivider:    { flexDirection: 'row', alignItems: 'center', gap: 10, width: '60%' },
  vsLine:       { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.10)' },
  vsText:       { fontSize: 10, fontWeight: '900', fontFamily: 'Orbitron_900Black', color: 'rgba(255,255,255,0.18)', letterSpacing: 2 },

  warBanner:    { borderRadius: 18, overflow: 'hidden', paddingHorizontal: 28, paddingVertical: 10 },
  warText:      { fontSize: 22, fontWeight: '900', fontFamily: 'Orbitron_900Black', color: '#fff', letterSpacing: 4 },

  outcomeBanner:{ alignItems: 'center' },
  outcomeText:  { fontSize: 18, fontWeight: '900', fontFamily: 'Orbitron_900Black', letterSpacing: 2 },

  bottom:       { paddingHorizontal: 16, gap: 10 },

  circles:      { flexDirection: 'row', justifyContent: 'center', gap: 20, paddingTop: 4 },

  resultPanel:  { borderRadius: 14, overflow: 'hidden', paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  netDivider:   { height: 1, backgroundColor: 'rgba(255,255,255,0.09)', marginVertical: 5 },
  netRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  netLabel:     { fontSize: 9, fontFamily: 'Orbitron_700Bold', letterSpacing: 2, color: 'rgba(255,255,255,0.45)' },
  netAmt:       { fontSize: 20, fontWeight: '900' },

  btnRow:       { flexDirection: 'row', gap: 10 },
  dealingRow:   { alignItems: 'center', paddingVertical: 12 },
  dealingText:  { fontSize: 10, fontFamily: 'Orbitron_400Regular', letterSpacing: 3 },
});
