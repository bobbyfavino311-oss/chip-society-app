import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Animated, Modal, Platform, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PlayingCard from '@/components/PlayingCard';
import { useUser } from '@/context/UserContext';
import { useSoundSettings } from '@/context/SoundContext';
import { MusicEngine } from '@/lib/musicEngine';
import colors from '@/constants/colors';
import type { Card, Suit } from '@/lib/pokerEngine';
import {
  createSixDeckShoe, handTotal,
  isBlackjack, isBust, dealerShouldHit, canSplit,
  SHOE_SIZE, RESHUFFLE_AT, fmt,
} from '@/lib/blackjackEngine';

// ─── Types ────────────────────────────────────────────────────────────────────
type BJPhase = 'betting' | 'player' | 'dealer' | 'result';
type HandOutcome = 'blackjack' | 'win' | 'push' | 'lose' | 'bust';

interface BJHand {
  cards: Card[];
  bet: number;
  originalBet: number;
  doubled: boolean;
  stood: boolean;
  busted: boolean;
}

interface HandResult {
  outcome: HandOutcome;
  net: number;
  explanation: string;
  playerTotal: number;
  isDoubled: boolean;
  originalBet: number;
}

interface BJResult {
  handResults: HandResult[];
  totalNet: number;
  headline: string;
  dealerTotal: number;
  dealerBusts: boolean;
  dealerBJ: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const MIN_BET      = 1_000;
const MAX_BET      = 500_000;
const QUICK_BETS   = [5_000, 25_000, 50_000, 100_000];
const DEALER_DELAY = 700;

const MUSIC_TRACKS = [
  { id: 'classic_casino',   label: 'Classic Casino' },
  { id: 'vegas_lounge',     label: 'Vegas Lounge' },
  { id: 'vice_nights',      label: 'Vice Nights Synthwave' },
  { id: 'four_dragons',     label: 'Four Dragons Ambience' },
  { id: 'high_roller_jazz', label: 'High Roller Jazz' },
  { id: 'midnight_casino',  label: 'Midnight Casino' },
  { id: 'neon_skyline',     label: 'Neon Skyline' },
] as const;
type TrackId = (typeof MUSIC_TRACKS)[number]['id'];

const TRACK_STORAGE_KEY = '@bj_music_track';

// ─── Pure helpers ─────────────────────────────────────────────────────────────
const VALUE_LABEL: Record<number, string> = {
  11: 'J', 12: 'Q', 13: 'K', 14: 'A',
};
const SUIT_SYMBOL: Record<Suit, string> = { S: '♠', H: '♥', D: '♦', C: '♣' };

function cardLabel(card: Card): string {
  return (VALUE_LABEL[card.value] ?? String(card.value)) + SUIT_SYMBOL[card.suit];
}

function handDisplay(hand: BJHand): string {
  if (hand.busted)             return 'BUST';
  if (isBlackjack(hand.cards)) return 'BJ';
  return String(handTotal(hand.cards));
}

function dealerDisplay(cards: Card[], revealed: boolean): string {
  if (!revealed) return '?';
  if (isBust(cards))       return 'BUST';
  if (isBlackjack(cards))  return 'BJ';
  return String(handTotal(cards));
}

function buildExplanation(
  outcome: HandOutcome,
  playerTotal: number,
  dealerTotal: number,
  dealerBusts: boolean,
  dealerBJ: boolean,
): string {
  switch (outcome) {
    case 'blackjack': return 'Natural Blackjack · Paid 3:2';
    case 'bust':      return `You drew to ${playerTotal}`;
    case 'push':      return `Your ${playerTotal} matched Dealer ${dealerTotal}`;
    case 'win':
      if (dealerBusts) return `Dealer busted with ${dealerTotal}`;
      return `${playerTotal} beats Dealer ${dealerTotal}`;
    case 'lose':
      if (dealerBJ)   return 'Dealer had Blackjack';
      if (dealerBusts) return `Dealer busted — you still lose (busted hand)`;
      return `Dealer ${dealerTotal} beats your ${playerTotal}`;
  }
}

// ─── Outcome colors ──────────────────────────────────────────────────────────
function outcomeColor(o: HandOutcome | string): string {
  if (o === 'blackjack')              return colors.gold;
  if (o === 'win')                    return colors.success;
  if (o === 'push' || o === 'PUSH')   return '#4da6ff';
  return colors.error;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ShoeIndicator({ dealt }: { dealt: number }) {
  const remaining = SHOE_SIZE - dealt;
  return (
    <View style={shoe.wrap}>
      <Text style={shoe.label}>SHOE</Text>
      <Text style={shoe.count}>{remaining}/{SHOE_SIZE}</Text>
    </View>
  );
}
const shoe = StyleSheet.create({
  wrap:  { alignItems: 'flex-end' },
  label: { fontSize: 7, fontFamily: 'Orbitron_700Bold', color: 'rgba(255,215,0,0.50)', letterSpacing: 1.5 },
  count: { fontSize: 11, fontFamily: 'Inter_700Bold', color: 'rgba(255,215,0,0.75)', marginTop: 1 },
});

function ScoreBadge({ label, bust, bj }: { label: string; bust?: boolean; bj?: boolean }) {
  const bg  = bj ? 'rgba(255,215,0,0.14)' : bust ? 'rgba(255,68,68,0.14)' : 'rgba(255,255,255,0.08)';
  const bdr = bj ? 'rgba(255,215,0,0.45)' : bust ? 'rgba(255,68,68,0.40)' : 'rgba(255,255,255,0.18)';
  const col = bj ? colors.gold : bust ? colors.error : '#fff';
  return (
    <View style={[sb.wrap, { backgroundColor: bg, borderColor: bdr }]}>
      <Text style={[sb.text, { color: col }]}>{label}</Text>
    </View>
  );
}
const sb = StyleSheet.create({
  wrap: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, borderWidth: 1, marginTop: 6 },
  text: { fontSize: 13, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
});

function ShufflingOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <View style={[StyleSheet.absoluteFillObject, { zIndex: 999, alignItems: 'center', justifyContent: 'center' }]}>
      <LinearGradient colors={['rgba(5,0,16,0.97)', 'rgba(10,0,30,0.97)']} style={StyleSheet.absoluteFillObject} />
      <Text style={sovl.title}>SHUFFLING SHOE</Text>
      <Text style={sovl.sub}>Six decks · 312 cards</Text>
    </View>
  );
}
const sovl = StyleSheet.create({
  title: { fontSize: 22, fontFamily: 'Orbitron_900Black', color: colors.gold, letterSpacing: 3, textAlign: 'center' },
  sub:   { fontSize: 11, fontFamily: 'Orbitron_400Regular', color: 'rgba(255,215,0,0.50)', letterSpacing: 2, marginTop: 8 },
});

// ─── Music panel modal ────────────────────────────────────────────────────────
function MusicPanel({
  visible, onClose, isMusicMuted, musicVolume,
  toggleMusicMute, setMusicVolume,
  selectedTrack, onSelectTrack,
}: {
  visible: boolean;
  onClose: () => void;
  isMusicMuted: boolean;
  musicVolume: number;
  toggleMusicMute: () => void;
  setMusicVolume: (v: number) => void;
  selectedTrack: TrackId;
  onSelectTrack: (id: TrackId) => void;
}) {
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={mp.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={mp.sheet}>
        <LinearGradient colors={['#14002a', '#0a0018']} style={StyleSheet.absoluteFill} />
        <View style={mp.handle} />

        <Text style={mp.title}>TABLE MUSIC</Text>

        {/* On / Off toggle */}
        <View style={mp.toggleRow}>
          <TouchableOpacity
            style={[mp.toggleBtn, !isMusicMuted && mp.toggleOn]}
            onPress={() => { if (isMusicMuted) toggleMusicMute(); }}
            activeOpacity={0.8}
          >
            <Text style={[mp.toggleText, !isMusicMuted && { color: '#fff' }]}>ON</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[mp.toggleBtn, isMusicMuted && mp.toggleOff]}
            onPress={() => { if (!isMusicMuted) toggleMusicMute(); }}
            activeOpacity={0.8}
          >
            <Text style={[mp.toggleText, isMusicMuted && { color: '#fff' }]}>OFF</Text>
          </TouchableOpacity>
        </View>

        {/* Volume */}
        <View style={mp.volRow}>
          <Text style={mp.volLabel}>VOLUME</Text>
          <TouchableOpacity style={mp.volBtn} onPress={() => setMusicVolume(Math.max(0, musicVolume - 0.1))} activeOpacity={0.7}>
            <Text style={mp.volBtnText}>-</Text>
          </TouchableOpacity>
          <View style={mp.volBarWrap}>
            {Array.from({ length: 10 }, (_, i) => (
              <View
                key={i}
                style={[mp.volSegment, { backgroundColor: i < Math.round(musicVolume * 10) ? colors.primary : 'rgba(255,255,255,0.12)' }]}
              />
            ))}
          </View>
          <TouchableOpacity style={mp.volBtn} onPress={() => setMusicVolume(Math.min(1, musicVolume + 0.1))} activeOpacity={0.7}>
            <Text style={mp.volBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Track list */}
        <Text style={mp.trackHeading}>SELECT TRACK</Text>
        <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
          {MUSIC_TRACKS.map(t => (
            <TouchableOpacity
              key={t.id}
              style={[mp.trackRow, selectedTrack === t.id && mp.trackRowActive]}
              onPress={() => onSelectTrack(t.id)}
              activeOpacity={0.8}
            >
              {selectedTrack === t.id && (
                <LinearGradient colors={[`${colors.primary}14`, 'transparent']} style={StyleSheet.absoluteFill} />
              )}
              <View style={[mp.trackDot, { backgroundColor: selectedTrack === t.id ? colors.primary : 'rgba(255,255,255,0.15)' }]} />
              <Text style={[mp.trackLabel, selectedTrack === t.id && { color: colors.primary }]}>{t.label}</Text>
              {selectedTrack === t.id && <Ionicons name="musical-notes" size={12} color={colors.primary} />}
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity style={mp.closeBtn} onPress={onClose} activeOpacity={0.8}>
          <Text style={mp.closeBtnText}>DONE</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}
const mp = StyleSheet.create({
  backdrop:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet:          { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.08)', gap: 14 },
  handle:         { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)', alignSelf: 'center', marginBottom: 4 },
  title:          { fontSize: 13, fontFamily: 'Orbitron_900Black', color: '#fff', letterSpacing: 3, textAlign: 'center' },
  toggleRow:      { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  toggleBtn:      { flex: 1, height: 38, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)' },
  toggleOn:       { backgroundColor: 'rgba(0,212,255,0.15)', borderColor: 'rgba(0,212,255,0.45)' },
  toggleOff:      { backgroundColor: 'rgba(255,68,68,0.12)', borderColor: 'rgba(255,68,68,0.35)' },
  toggleText:     { fontSize: 11, fontFamily: 'Orbitron_700Bold', color: 'rgba(255,255,255,0.35)', letterSpacing: 2 },
  volRow:         { flexDirection: 'row', alignItems: 'center', gap: 8 },
  volLabel:       { fontSize: 8, fontFamily: 'Orbitron_700Bold', color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, width: 52 },
  volBtn:         { width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  volBtnText:     { fontSize: 18, color: '#fff', fontFamily: 'Inter_700Bold', lineHeight: 22 },
  volBarWrap:     { flex: 1, flexDirection: 'row', gap: 3, alignItems: 'center' },
  volSegment:     { flex: 1, height: 12, borderRadius: 2 },
  trackHeading:   { fontSize: 8, fontFamily: 'Orbitron_700Bold', color: 'rgba(255,255,255,0.30)', letterSpacing: 2.5 },
  trackRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 6, overflow: 'hidden' },
  trackRowActive: { borderColor: 'rgba(0,212,255,0.30)' },
  trackDot:       { width: 8, height: 8, borderRadius: 4 },
  trackLabel:     { flex: 1, fontSize: 12, fontFamily: 'Orbitron_400Regular', color: 'rgba(255,255,255,0.55)', letterSpacing: 0.5 },
  closeBtn:       { height: 44, borderRadius: 13, backgroundColor: 'rgba(0,212,255,0.10)', borderWidth: 1, borderColor: 'rgba(0,212,255,0.30)', alignItems: 'center', justifyContent: 'center' },
  closeBtnText:   { fontSize: 11, fontFamily: 'Orbitron_700Bold', color: colors.primary, letterSpacing: 2 },
});

// ─── Per-hand result row ──────────────────────────────────────────────────────
function HandResultRow({ result, label }: { result: HandResult; label?: string }) {
  const col = outcomeColor(result.outcome);
  const outcomeText =
    result.outcome === 'blackjack' ? 'BLACKJACK' :
    result.outcome === 'win'       ? 'WIN' :
    result.outcome === 'push'      ? 'PUSH' :
    result.outcome === 'bust'      ? 'BUST' : 'LOSE';

  const netStr = result.outcome === 'push' ? 'Bet Returned'
    : result.net >= 0 ? `+${fmt(result.net)}` : `-${fmt(Math.abs(result.net))}`;

  return (
    <View style={[hrr.wrap, { borderColor: `${col}30` }]}>
      <LinearGradient colors={[`${col}0c`, 'transparent']} style={StyleSheet.absoluteFill} />
      <View style={hrr.top}>
        {label && <Text style={[hrr.label, { color: `${col}99` }]}>{label}</Text>}
        <Text style={[hrr.outcome, { color: col }]}>{outcomeText}</Text>
        <Text style={[hrr.net, { color: result.outcome === 'push' ? '#4da6ff' : result.net >= 0 ? colors.success : colors.error }]}>
          {netStr}
        </Text>
      </View>
      <Text style={hrr.explanation}>{result.explanation}</Text>
      {result.isDoubled && (
        <View style={hrr.doubleRow}>
          <Text style={hrr.doubleDetail}>Bet {fmt(result.originalBet)} + Double {fmt(result.originalBet)}</Text>
          {result.outcome === 'win' && (
            <Text style={hrr.doublePaid}>Total win {fmt(result.net)}</Text>
          )}
        </View>
      )}
    </View>
  );
}
const hrr = StyleSheet.create({
  wrap:        { borderRadius: 12, borderWidth: 1, overflow: 'hidden', padding: 12, gap: 5 },
  top:         { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label:       { fontSize: 8, fontFamily: 'Orbitron_700Bold', letterSpacing: 1.5 },
  outcome:     { fontSize: 12, fontFamily: 'Orbitron_700Bold', letterSpacing: 1, flex: 1 },
  net:         { fontSize: 14, fontFamily: 'Inter_700Bold' },
  explanation: { fontSize: 11, color: 'rgba(255,255,255,0.45)', fontFamily: 'Orbitron_400Regular' },
  doubleRow:   { flexDirection: 'row', gap: 10, marginTop: 2 },
  doubleDetail:{ fontSize: 10, color: 'rgba(255,215,0,0.55)', fontFamily: 'Inter_700Bold' },
  doublePaid:  { fontSize: 10, color: colors.success, fontFamily: 'Inter_700Bold' },
});

// ─── Dealer log line ──────────────────────────────────────────────────────────
function DealerLogLine({ entry }: { entry: string }) {
  return <Text style={dll.text}>{entry}</Text>;
}
const dll = StyleSheet.create({
  text: { fontSize: 10, fontFamily: 'Orbitron_400Regular', color: 'rgba(255,215,0,0.55)', letterSpacing: 0.5, textAlign: 'center' },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function BlackjackScreen() {
  const insets = useSafeAreaInsets();
  const { profile, addChips, removeChips, updateProfile } = useUser();
  const { isMusicMuted, toggleMusicMute, musicVolume, setMusicVolume } = useSoundSettings();

  // ── Music ─────────────────────────────────────────────────────────────────────
  const [showMusicPanel, setShowMusicPanel] = useState(false);
  const [selectedTrack, setSelectedTrack]   = useState<TrackId>('classic_casino');
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseRef  = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(TRACK_STORAGE_KEY).then(v => {
      if (v && MUSIC_TRACKS.find(t => t.id === v)) setSelectedTrack(v as TrackId);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    MusicEngine.configure({ muted: isMusicMuted, volume: musicVolume });
    MusicEngine.play();
    return () => { MusicEngine.stop(); };
  }, []);

  useEffect(() => {
    MusicEngine.configure({ muted: isMusicMuted, volume: musicVolume });
  }, [isMusicMuted, musicVolume]);

  useEffect(() => {
    if (pulseRef.current) { pulseRef.current.stop(); pulseRef.current = null; }
    if (!isMusicMuted) {
      const loop = Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 900, useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 900, useNativeDriver: false }),
      ]));
      pulseRef.current = loop;
      loop.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => { pulseRef.current?.stop(); };
  }, [isMusicMuted]);

  function handleSelectTrack(id: TrackId) {
    setSelectedTrack(id);
    AsyncStorage.setItem(TRACK_STORAGE_KEY, id).catch(() => {});
  }

  // ── Shoe ─────────────────────────────────────────────────────────────────────
  const shoeRef    = useRef<Card[]>(createSixDeckShoe());
  const shoePosRef = useRef(0);
  const [cardsDealt, setCardsDealt]   = useState(0);
  const [isShuffling, setIsShuffling] = useState(false);

  function drawCard(): Card {
    if (shoePosRef.current >= shoeRef.current.length) {
      shoeRef.current = createSixDeckShoe();
      shoePosRef.current = 0;
    }
    const card = shoeRef.current[shoePosRef.current++];
    setCardsDealt(prev => prev + 1);
    return card;
  }

  function checkAndReshuffle() {
    if (shoePosRef.current >= RESHUFFLE_AT) {
      shoeRef.current = createSixDeckShoe();
      shoePosRef.current = 0;
      setCardsDealt(0);
      setIsShuffling(true);
      setTimeout(() => setIsShuffling(false), 1800);
    }
  }

  // ── Game state ───────────────────────────────────────────────────────────────
  const dealerCardsRef = useRef<Card[]>([]);
  const playerHandsRef = useRef<BJHand[]>([]);

  const [phase,        setPhase]        = useState<BJPhase>('betting');
  const [dealerCards,  setDealerCards]  = useState<Card[]>([]);
  const [playerHands,  setPlayerHands]  = useState<BJHand[]>([]);
  const [activeIdx,    setActiveIdx]    = useState(0);
  const [holeRevealed, setHoleRevealed] = useState(false);
  const [result,       setResult]       = useState<BJResult | null>(null);
  const [dealerLog,    setDealerLog]    = useState<string[]>([]);
  const [exitConfirm,  setExitConfirm]  = useState(false);

  // ── Betting state ────────────────────────────────────────────────────────────
  const [bet,     setBet]     = useState(Math.min(10_000, profile.chips));
  const [lastBet, setLastBet] = useState(Math.min(10_000, profile.chips));

  // ─── Sync helpers ─────────────────────────────────────────────────────────────
  function syncDealerCards(cards: Card[]) { dealerCardsRef.current = cards; setDealerCards(cards); }
  function syncPlayerHands(hands: BJHand[]) { playerHandsRef.current = hands; setPlayerHands(hands); }
  function addLog(entry: string) { setDealerLog(prev => [...prev, entry]); }

  // ─── Results ──────────────────────────────────────────────────────────────────
  const computeResults = useCallback((finalDealerCards: Card[], hands: BJHand[]) => {
    const dealerBusts = isBust(finalDealerCards);
    const dealerTotal = handTotal(finalDealerCards);
    const dealerBJ    = isBlackjack(finalDealerCards);

    const handResults: HandResult[] = [];
    let totalNet = 0;
    let wins = 0;
    let losses = 0;

    for (const hand of hands) {
      const playerTotal = handTotal(hand.cards);
      const playerBJ    = isBlackjack(hand.cards);
      let outcome: HandOutcome;

      if (hand.busted) {
        outcome = 'bust';
        losses++;
      } else if (playerBJ && dealerBJ) {
        outcome = 'push';
        addChips(hand.bet);
      } else if (playerBJ) {
        outcome = 'blackjack';
        const payout = hand.bet + Math.floor(hand.originalBet * 1.5);
        addChips(payout);
        totalNet += Math.floor(hand.originalBet * 1.5);
        wins++;
      } else if (dealerBJ) {
        outcome = 'lose';
        losses++;
        totalNet -= hand.bet;
      } else if (dealerBusts) {
        outcome = 'win';
        addChips(hand.bet * 2);
        totalNet += hand.originalBet;
        wins++;
      } else if (playerTotal > dealerTotal) {
        outcome = 'win';
        addChips(hand.bet * 2);
        totalNet += hand.originalBet;
        wins++;
      } else if (playerTotal === dealerTotal) {
        outcome = 'push';
        addChips(hand.bet);
      } else {
        outcome = 'lose';
        losses++;
        totalNet -= hand.bet;
      }

      const net = outcome === 'blackjack' ? Math.floor(hand.originalBet * 1.5)
        : outcome === 'win'  ? hand.originalBet
        : outcome === 'push' ? 0
        : -hand.bet;

      handResults.push({
        outcome, net,
        explanation: buildExplanation(outcome, playerTotal, dealerTotal, dealerBusts, dealerBJ),
        playerTotal,
        isDoubled: hand.doubled,
        originalBet: hand.originalBet,
      });
    }

    updateProfile({
      handsPlayed: profile.handsPlayed + hands.length,
      wins:        profile.wins + wins,
      losses:      profile.losses + losses,
    });

    let headline = 'DEALER WINS';
    if (handResults.every(r => r.outcome === 'blackjack'))  headline = 'BLACKJACK';
    else if (handResults.every(r => r.outcome === 'push'))  headline = 'PUSH';
    else if (handResults.every(r => r.outcome === 'bust'))  headline = 'PLAYER BUSTS';
    else if (dealerBusts && handResults.some(r => !r.isDoubled || r.outcome !== 'bust')) headline = 'DEALER BUSTS';
    else if (handResults.some(r => r.outcome === 'win' || r.outcome === 'blackjack'))    headline = 'PLAYER WINS';

    MusicEngine.setIntensity(totalNet > 0 ? 'normal' : 'showdown');
    setResult({ handResults, totalNet, headline, dealerTotal, dealerBusts, dealerBJ });
    setPhase('result');

    if (totalNet > 0) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    else if (totalNet < 0) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  }, [addChips, updateProfile, profile.handsPlayed, profile.wins, profile.losses]);

  // ─── Dealer auto-play with log ────────────────────────────────────────────────
  function runDealerTurn(currentCards: Card[], hands: BJHand[]) {
    if (dealerShouldHit(currentCards)) {
      setTimeout(() => {
        const card = drawCard();
        const nextCards = [...currentCards, card];
        const nextTotal = handTotal(nextCards);
        syncDealerCards(nextCards);

        if (isBust(nextCards)) {
          addLog(`Dealer draws ${cardLabel(card)} · Busts with ${nextTotal}`);
        } else {
          addLog(`Dealer draws ${cardLabel(card)} · Now ${nextTotal}`);
        }

        runDealerTurn(nextCards, hands);
      }, DEALER_DELAY);
    } else {
      const total = handTotal(currentCards);
      if (isBust(currentCards)) {
        addLog(`Dealer busts with ${total}`);
      } else {
        addLog(`Dealer stands on ${total}`);
      }
      setTimeout(() => computeResults(currentCards, hands), 500);
    }
  }

  function startDealerTurn(hands: BJHand[], dCards: Card[]) {
    setHoleRevealed(true);
    setPhase('dealer');
    setDealerLog([]);

    const holeCard  = dCards[1];
    const knownCard = dCards[0];
    const revealedTotal = handTotal(dCards);

    addLog(`Dealer reveals ${cardLabel(holeCard)}`);
    setTimeout(() => {
      if (isBlackjack(dCards)) {
        addLog(`Dealer has Blackjack (${cardLabel(knownCard)} + ${cardLabel(holeCard)})`);
        setTimeout(() => computeResults(dCards, hands), 600);
      } else {
        addLog(`Dealer has ${revealedTotal}${revealedTotal < 17 ? ' · Hits' : ' · Stands'}`);
        runDealerTurn(dCards, hands);
      }
    }, 400);
  }

  // ─── Advance hand or go to dealer ────────────────────────────────────────────
  function advanceOrDealer(newHands: BJHand[], completedIdx: number) {
    syncPlayerHands(newHands);
    const nextIdx = completedIdx + 1;
    if (nextIdx < newHands.length) {
      setActiveIdx(nextIdx);
    } else {
      startDealerTurn(newHands, dealerCardsRef.current);
    }
  }

  // ─── Game actions ──────────────────────────────────────────────────────────────
  function handleDeal() {
    const actualBet = Math.min(bet, profile.chips);
    if (actualBet < MIN_BET || profile.chips < actualBet) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    removeChips(actualBet);
    setLastBet(actualBet);
    setDealerLog([]);
    checkAndReshuffle();
    MusicEngine.setIntensity('normal');

    const p1 = drawCard();
    const d1 = drawCard();
    const p2 = drawCard();
    const d2 = drawCard();

    const dCards = [d1, d2];
    const initialHand: BJHand = {
      cards: [p1, p2], bet: actualBet, originalBet: actualBet,
      doubled: false, stood: false, busted: false,
    };
    const hands = [initialHand];

    syncDealerCards(dCards);
    syncPlayerHands(hands);
    setActiveIdx(0);
    setHoleRevealed(false);
    setResult(null);

    const playerBJ = isBlackjack([p1, p2]);
    const dealerBJ = isBlackjack([d1, d2]);
    if (playerBJ || dealerBJ) {
      setTimeout(() => startDealerTurn(hands, dCards), 600);
    } else {
      setPhase('player');
    }
  }

  function handleHit() {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const card    = drawCard();
    const hand    = playerHandsRef.current[activeIdx];
    const newCards = [...hand.cards, card];
    const updatedHand: BJHand = { ...hand, cards: newCards, busted: isBust(newCards) };
    const newHands = playerHandsRef.current.map((h, i) => i === activeIdx ? updatedHand : h);

    if (updatedHand.busted || handTotal(newCards) === 21) {
      advanceOrDealer(newHands, activeIdx);
    } else {
      syncPlayerHands(newHands);
    }
  }

  function handleStand() {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const newHands = playerHandsRef.current.map((h, i) =>
      i === activeIdx ? { ...h, stood: true } : h
    );
    advanceOrDealer(newHands, activeIdx);
  }

  function handleDouble() {
    const hand = playerHandsRef.current[activeIdx];
    if (profile.chips < hand.bet) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    removeChips(hand.originalBet);
    const card     = drawCard();
    const newCards = [...hand.cards, card];
    const updatedHand: BJHand = {
      ...hand, cards: newCards,
      bet: hand.originalBet * 2,
      doubled: true, stood: true, busted: isBust(newCards),
    };
    const newHands = playerHandsRef.current.map((h, i) => i === activeIdx ? updatedHand : h);
    advanceOrDealer(newHands, activeIdx);
  }

  function handleSplit() {
    const hand = playerHandsRef.current[activeIdx];
    if (profile.chips < hand.bet || !canSplit(hand.cards)) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    removeChips(hand.originalBet);

    const c1 = drawCard();
    const c2 = drawCard();
    const bet1 = hand.originalBet;
    const hand1: BJHand = { cards: [hand.cards[0], c1], bet: bet1, originalBet: bet1, doubled: false, stood: false, busted: false };
    const hand2: BJHand = { cards: [hand.cards[1], c2], bet: bet1, originalBet: bet1, doubled: false, stood: false, busted: false };
    syncPlayerHands([hand1, hand2]);
    setActiveIdx(0);
  }

  function handleNewHand() {
    syncDealerCards([]);
    syncPlayerHands([]);
    setHoleRevealed(false);
    setResult(null);
    setDealerLog([]);
    setBet(Math.min(lastBet, profile.chips > 0 ? profile.chips : MIN_BET));
    checkAndReshuffle();
    MusicEngine.setIntensity('normal');
    setPhase('betting');
  }

  // ─── Derived ─────────────────────────────────────────────────────────────────
  const activeHand   = playerHands[activeIdx];
  const canDoubleNow = activeHand?.cards.length === 2 && !activeHand.doubled && profile.chips >= activeHand.originalBet;
  const canSplitNow  = activeHand?.cards.length === 2 && canSplit(activeHand.cards ?? []) && playerHands.length === 1 && profile.chips >= activeHand.originalBet;
  const isSplit      = playerHands.length === 2;

  const maxBet = Math.min(MAX_BET, profile.chips);
  function adjustBet(delta: number) {
    setBet(prev => Math.min(maxBet, Math.max(MIN_BET, prev + delta)));
  }

  function headlineColor(headline: string) {
    if (headline === 'BLACKJACK')   return colors.gold;
    if (headline === 'PLAYER WINS' || headline === 'DEALER BUSTS') return colors.success;
    if (headline === 'PUSH')        return '#4da6ff';
    return colors.error;
  }

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <LinearGradient
        colors={['#060010', '#0d0022', '#070015']}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={[s.glowTop,    { backgroundColor: 'rgba(0,212,255,0.05)' }]} />
      <View style={[s.glowBottom, { backgroundColor: 'rgba(255,215,0,0.04)' }]} />

      <ShufflingOverlay visible={isShuffling} />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View style={[s.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={s.iconBtn} onPress={() => setExitConfirm(true)}>
          <Ionicons name="close" size={20} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>

        <View style={s.titleBlock}>
          <Text style={s.titleText}>BLACKJACK</Text>
          <Text style={s.subtitleText}>SIX DECK SHOE</Text>
        </View>

        <View style={s.headerRight}>
          <Animated.View style={{ opacity: pulseAnim }}>
            <TouchableOpacity style={s.iconBtn} onPress={() => setShowMusicPanel(true)}>
              <Ionicons
                name={isMusicMuted ? 'musical-notes-outline' : 'musical-notes'}
                size={16}
                color={isMusicMuted ? 'rgba(255,255,255,0.28)' : colors.primary}
              />
            </TouchableOpacity>
          </Animated.View>
          <ShoeIndicator dealt={cardsDealt} />
        </View>
      </View>

      {/* ── Dealer zone ─────────────────────────────────────────────────────── */}
      <View style={s.dealerZone}>
        <Text style={s.zoneLabel}>DEALER</Text>
        <View style={s.cardsRow}>
          {dealerCards.map((card, i) => (
            <View key={i} style={s.cardSlot}>
              <PlayingCard card={card} faceDown={i === 1 && !holeRevealed} size="sm" />
            </View>
          ))}
          {dealerCards.length === 0 && (
            <View style={s.emptySlots}>
              {[0, 1].map(i => <View key={i} style={s.emptyCard} />)}
            </View>
          )}
        </View>
        {dealerCards.length > 0 && (
          <ScoreBadge
            label={dealerDisplay(dealerCards, holeRevealed)}
            bust={holeRevealed && isBust(dealerCards)}
            bj={holeRevealed && isBlackjack(dealerCards)}
          />
        )}
      </View>

      {/* ── Center divider ──────────────────────────────────────────────────── */}
      <View style={s.centerDivider}>
        <View style={s.divLine} />
        <View style={s.divDiamond} />
        <View style={s.divLine} />
      </View>

      {/* ── Player zone ─────────────────────────────────────────────────────── */}
      <View style={s.playerZone}>
        {isSplit ? (
          <View style={s.splitRow}>
            {playerHands.map((hand, idx) => (
              <View
                key={idx}
                style={[s.splitHand, phase === 'player' && activeIdx === idx && s.splitHandActive]}
              >
                <Text style={[s.handLabel, phase === 'player' && activeIdx === idx && { color: colors.primary }]}>
                  HAND {idx + 1}
                </Text>
                <View style={s.cardsRowSplit}>
                  {hand.cards.map((card, i) => (
                    <View key={i} style={s.cardSlot}><PlayingCard card={card} size="sm" /></View>
                  ))}
                </View>
                <ScoreBadge
                  label={handDisplay(hand)}
                  bust={hand.busted}
                  bj={isBlackjack(hand.cards)}
                />
                <Text style={s.handBetLabel}>{fmt(hand.originalBet)}</Text>
              </View>
            ))}
          </View>
        ) : (
          <>
            <Text style={s.zoneLabel}>PLAYER</Text>
            <View style={s.cardsRow}>
              {(playerHands[0]?.cards ?? []).map((card, i) => (
                <View key={i} style={s.cardSlot}><PlayingCard card={card} size="md" /></View>
              ))}
              {playerHands.length === 0 && (
                <View style={s.emptySlots}>
                  {[0, 1].map(i => <View key={i} style={s.emptyCard} />)}
                </View>
              )}
            </View>
            {playerHands[0] && (
              <ScoreBadge
                label={handDisplay(playerHands[0])}
                bust={playerHands[0].busted}
                bj={isBlackjack(playerHands[0].cards)}
              />
            )}
          </>
        )}
      </View>

      {/* ── Bottom controls ─────────────────────────────────────────────────── */}
      <View style={[s.controls, { paddingBottom: insets.bottom + 8 }]}>

        {/* BETTING */}
        {phase === 'betting' && (
          <View style={s.bettingPanel}>
            <Text style={s.bettingLabel}>PLACE YOUR BET</Text>
            <View style={s.betRow}>
              <TouchableOpacity style={s.betAdjBtn} onPress={() => adjustBet(-1_000)} activeOpacity={0.7}>
                <Text style={s.betAdjText}>-</Text>
              </TouchableOpacity>
              <View style={s.betDisplay}>
                <Text style={s.betAmount}>{fmt(bet)}</Text>
                <Text style={s.betChipsLabel}>chips</Text>
              </View>
              <TouchableOpacity style={s.betAdjBtn} onPress={() => adjustBet(1_000)} activeOpacity={0.7}>
                <Text style={s.betAdjText}>+</Text>
              </TouchableOpacity>
            </View>
            <View style={s.quickRow}>
              <TouchableOpacity style={s.quickBtn} onPress={() => setBet(MIN_BET)} activeOpacity={0.7}>
                <Text style={s.quickLabel}>MIN</Text>
              </TouchableOpacity>
              {QUICK_BETS.filter(b => b <= maxBet).map(b => (
                <TouchableOpacity key={b} style={[s.quickBtn, bet === b && s.quickBtnActive]} onPress={() => setBet(b)} activeOpacity={0.7}>
                  <Text style={[s.quickAmt, bet === b && { color: colors.primary }]}>{fmt(b)}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={s.quickBtn} onPress={() => setBet(maxBet)} activeOpacity={0.7}>
                <Text style={s.quickLabel}>MAX</Text>
              </TouchableOpacity>
              {lastBet > 0 && lastBet <= maxBet && (
                <TouchableOpacity style={s.quickBtn} onPress={() => setBet(lastBet)} activeOpacity={0.7}>
                  <Text style={s.quickLabel}>RPT</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={s.balanceText}>Balance  {fmt(profile.chips)}</Text>
            <TouchableOpacity
              style={[s.dealBtn, profile.chips < MIN_BET && s.dealBtnDisabled]}
              onPress={handleDeal}
              disabled={profile.chips < MIN_BET}
              activeOpacity={0.82}
            >
              <LinearGradient colors={['#1a4a00', '#2a7800']} style={StyleSheet.absoluteFill} />
              <Text style={s.dealText}>DEAL</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* PLAYER ACTIONS */}
        {phase === 'player' && (
          <View style={s.actionPanel}>
            <View style={s.betInfoRow}>
              <Text style={s.betInfoLabel}>BET</Text>
              <Text style={s.betInfoAmt}>{fmt(activeHand?.originalBet ?? 0)}</Text>
              <View style={s.betInfoSep} />
              <Text style={s.betInfoLabel}>BALANCE</Text>
              <Text style={s.betInfoAmt}>{fmt(profile.chips)}</Text>
            </View>
            <View style={s.actionRow}>
              <TouchableOpacity style={[s.actionBtn, { borderColor: 'rgba(255,68,68,0.45)' }]} onPress={handleStand} activeOpacity={0.8}>
                <LinearGradient colors={['rgba(50,0,0,0.7)', 'rgba(30,0,0,0.7)']} style={StyleSheet.absoluteFill} />
                <Text style={[s.actionText, { color: '#FF6B6B' }]}>STAND</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.actionBtn, { borderColor: 'rgba(0,212,255,0.45)' }]} onPress={handleHit} activeOpacity={0.8}>
                <LinearGradient colors={['rgba(0,60,100,0.7)', 'rgba(0,40,70,0.7)']} style={StyleSheet.absoluteFill} />
                <Text style={[s.actionText, { color: colors.primary }]}>HIT</Text>
              </TouchableOpacity>
              {canDoubleNow && (
                <TouchableOpacity style={[s.actionBtn, { borderColor: 'rgba(255,215,0,0.40)' }]} onPress={handleDouble} activeOpacity={0.8}>
                  <LinearGradient colors={['rgba(80,60,0,0.7)', 'rgba(50,40,0,0.7)']} style={StyleSheet.absoluteFill} />
                  <Text style={[s.actionText, { color: colors.gold }]}>DOUBLE</Text>
                </TouchableOpacity>
              )}
              {canSplitNow && (
                <TouchableOpacity style={[s.actionBtn, { borderColor: 'rgba(191,95,255,0.40)' }]} onPress={handleSplit} activeOpacity={0.8}>
                  <LinearGradient colors={['rgba(50,0,80,0.7)', 'rgba(35,0,60,0.7)']} style={StyleSheet.absoluteFill} />
                  <Text style={[s.actionText, { color: colors.accent }]}>SPLIT</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* DEALER TURN */}
        {phase === 'dealer' && (
          <View style={s.dealerTurnPanel}>
            <View style={s.dealerLogWrap}>
              {dealerLog.map((entry, i) => <DealerLogLine key={i} entry={entry} />)}
            </View>
          </View>
        )}

        {/* RESULT */}
        {phase === 'result' && result && (
          <ScrollView style={s.resultScroll} contentContainerStyle={s.resultPanel} showsVerticalScrollIndicator={false}>
            {/* Headline */}
            <View style={[s.headlineBadge, { borderColor: `${headlineColor(result.headline)}55` }]}>
              <LinearGradient colors={[`${headlineColor(result.headline)}18`, 'transparent']} style={StyleSheet.absoluteFill} />
              <Text style={[s.headlineText, { color: headlineColor(result.headline) }]}>{result.headline}</Text>
            </View>

            {/* Per-hand results */}
            {result.handResults.length === 1 ? (
              <HandResultRow result={result.handResults[0]} />
            ) : (
              result.handResults.map((r, i) => (
                <HandResultRow key={i} result={r} label={`HAND ${i + 1}`} />
              ))
            )}

            {/* Net total */}
            <View style={s.netRow}>
              <Text style={s.netLabel}>NET RESULT</Text>
              <Text style={[
                s.netText,
                result.totalNet > 0 ? { color: colors.success } :
                result.totalNet < 0 ? { color: colors.error } :
                { color: '#4da6ff' },
              ]}>
                {result.totalNet === 0 ? 'Bet Returned'
                  : (result.totalNet > 0 ? '+' : '') + fmt(result.totalNet)}
              </Text>
            </View>

            <Text style={s.balanceTextSm}>Balance  {fmt(profile.chips)}</Text>

            {/* Dealer log summary */}
            {dealerLog.length > 0 && (
              <View style={s.logSummary}>
                {dealerLog.map((e, i) => <DealerLogLine key={i} entry={e} />)}
              </View>
            )}

            <TouchableOpacity style={s.newHandBtn} onPress={handleNewHand} activeOpacity={0.82}>
              <LinearGradient colors={['#001a3a', '#003080']} style={StyleSheet.absoluteFill} />
              <Text style={s.newHandText}>NEW HAND</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>

      {/* ── Exit modal ──────────────────────────────────────────────────────── */}
      <Modal transparent visible={exitConfirm} animationType="fade" onRequestClose={() => setExitConfirm(false)}>
        <View style={em.overlay}>
          <View style={em.card}>
            <LinearGradient colors={['#120020', '#0a0015']} style={StyleSheet.absoluteFill} />
            <Text style={em.title}>LEAVE TABLE?</Text>
            <Text style={em.sub}>Your current bet will be forfeited if mid-hand.</Text>
            <View style={em.btns}>
              <TouchableOpacity style={em.cancelBtn} onPress={() => setExitConfirm(false)} activeOpacity={0.8}>
                <Text style={em.cancelText}>STAY</Text>
              </TouchableOpacity>
              <TouchableOpacity style={em.leaveBtn} onPress={() => router.back()} activeOpacity={0.8}>
                <Text style={em.leaveText}>LEAVE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Music panel ─────────────────────────────────────────────────────── */}
      <MusicPanel
        visible={showMusicPanel}
        onClose={() => setShowMusicPanel(false)}
        isMusicMuted={isMusicMuted}
        musicVolume={musicVolume}
        toggleMusicMute={toggleMusicMute}
        setMusicVolume={setMusicVolume}
        selectedTrack={selectedTrack}
        onSelectTrack={handleSelectTrack}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: '#060010' },
  glowTop:    { position: 'absolute', top: 0, left: 0, right: 0, height: 200, borderRadius: 100, opacity: 0.8 },
  glowBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 180, borderRadius: 100 },

  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10, gap: 8, zIndex: 10 },
  iconBtn:     { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' },
  titleBlock:  { flex: 1, alignItems: 'center' },
  titleText:   { fontSize: 18, fontFamily: 'Orbitron_900Black', color: '#fff', letterSpacing: 3 },
  subtitleText:{ fontSize: 8, fontFamily: 'Orbitron_400Regular', color: 'rgba(255,215,0,0.55)', letterSpacing: 2.5, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  dealerZone: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 8 },
  playerZone: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 8 },
  zoneLabel:  { fontSize: 9, fontFamily: 'Orbitron_700Bold', color: 'rgba(255,255,255,0.32)', letterSpacing: 3, marginBottom: 8 },

  cardsRow:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardsRowSplit:{ flexDirection: 'row', alignItems: 'center', gap: 3 },
  cardSlot:     { marginHorizontal: -2 },

  emptySlots: { flexDirection: 'row', gap: 8 },
  emptyCard:  { width: 50, height: 70, borderRadius: 7, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)', borderStyle: 'dashed' },

  centerDivider: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 32 },
  divLine:       { flex: 1, height: 1, backgroundColor: 'rgba(255,215,0,0.15)' },
  divDiamond:    { width: 8, height: 8, backgroundColor: 'rgba(255,215,0,0.30)', transform: [{ rotate: '45deg' }], marginHorizontal: 8 },

  splitRow:        { flexDirection: 'row', gap: 14, justifyContent: 'center', paddingHorizontal: 10 },
  splitHand:       { alignItems: 'center', padding: 10, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.02)' },
  splitHandActive: { borderColor: `rgba(0,212,255,0.50)`, backgroundColor: 'rgba(0,212,255,0.06)' },
  handLabel:       { fontSize: 8, fontFamily: 'Orbitron_700Bold', color: 'rgba(255,255,255,0.35)', letterSpacing: 2, marginBottom: 6 },
  handBetLabel:    { fontSize: 9, fontFamily: 'Inter_700Bold', color: 'rgba(255,215,0,0.55)', marginTop: 4 },

  controls: { paddingHorizontal: 14, paddingTop: 4 },

  bettingPanel:  { gap: 8 },
  bettingLabel:  { fontSize: 9, fontFamily: 'Orbitron_700Bold', color: 'rgba(255,255,255,0.32)', letterSpacing: 2.5, textAlign: 'center' },
  betRow:        { flexDirection: 'row', alignItems: 'center', gap: 14, justifyContent: 'center' },
  betAdjBtn:     { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(0,212,255,0.10)', borderWidth: 1, borderColor: 'rgba(0,212,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  betAdjText:    { fontSize: 22, color: colors.primary, fontFamily: 'Inter_700Bold', lineHeight: 26 },
  betDisplay:    { alignItems: 'center', minWidth: 100 },
  betAmount:     { fontSize: 30, fontFamily: 'Inter_700Bold', color: '#fff', letterSpacing: -0.5 },
  betChipsLabel: { fontSize: 9, fontFamily: 'Orbitron_400Regular', color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5, marginTop: -2 },
  quickRow:      { flexDirection: 'row', gap: 5, flexWrap: 'wrap', justifyContent: 'center' },
  quickBtn:      { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', alignItems: 'center', minWidth: 42 },
  quickBtnActive:{ backgroundColor: 'rgba(0,212,255,0.12)', borderColor: 'rgba(0,212,255,0.35)' },
  quickLabel:    { fontSize: 8, fontFamily: 'Orbitron_700Bold', color: 'rgba(255,255,255,0.40)', letterSpacing: 1 },
  quickAmt:      { fontSize: 10, fontFamily: 'Inter_700Bold', color: 'rgba(255,255,255,0.70)' },
  balanceText:   { fontSize: 10, fontFamily: 'Inter_700Bold', color: 'rgba(255,255,255,0.28)', textAlign: 'center' },
  dealBtn:       { height: 50, borderRadius: 15, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(0,200,0,0.45)' },
  dealBtnDisabled:{ opacity: 0.35 },
  dealText:      { fontSize: 16, fontFamily: 'Orbitron_900Black', color: '#fff', letterSpacing: 4 },

  actionPanel: { gap: 8 },
  betInfoRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' },
  betInfoLabel:{ fontSize: 8, fontFamily: 'Orbitron_700Bold', color: 'rgba(255,255,255,0.30)', letterSpacing: 1.5 },
  betInfoAmt:  { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#fff' },
  betInfoSep:  { width: 1, height: 12, backgroundColor: 'rgba(255,255,255,0.12)' },
  actionRow:   { flexDirection: 'row', gap: 7 },
  actionBtn:   { flex: 1, height: 52, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  actionText:  { fontSize: 10, fontFamily: 'Orbitron_700Bold', letterSpacing: 0.8 },

  dealerTurnPanel: { alignItems: 'center', gap: 4, paddingVertical: 8 },
  dealerLogWrap:   { gap: 3, alignItems: 'center' },

  resultScroll: { maxHeight: 320 },
  resultPanel:  { gap: 8, paddingBottom: 4 },
  headlineBadge:{ height: 52, borderRadius: 15, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  headlineText: { fontSize: 18, fontFamily: 'Orbitron_900Black', letterSpacing: 3 },
  netRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  netLabel:     { fontSize: 9, fontFamily: 'Orbitron_700Bold', color: 'rgba(255,255,255,0.35)', letterSpacing: 2 },
  netText:      { fontSize: 22, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  balanceTextSm:{ fontSize: 10, fontFamily: 'Inter_700Bold', color: 'rgba(255,255,255,0.25)', textAlign: 'right' },
  logSummary:   { gap: 2, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 10, backgroundColor: 'rgba(255,215,0,0.04)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.10)' },
  newHandBtn:   { height: 48, borderRadius: 15, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(0,100,255,0.45)', marginTop: 2 },
  newHandText:  { fontSize: 13, fontFamily: 'Orbitron_700Bold', color: '#6699ff', letterSpacing: 3 },
});

const em = StyleSheet.create({
  overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center', padding: 32 },
  card:      { width: '100%', borderRadius: 20, overflow: 'hidden', padding: 24, gap: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  title:     { fontSize: 16, fontFamily: 'Orbitron_900Black', color: '#fff', letterSpacing: 2, textAlign: 'center' },
  sub:       { fontSize: 11, color: 'rgba(255,255,255,0.40)', textAlign: 'center' },
  btns:      { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  cancelText:{ fontSize: 11, fontFamily: 'Orbitron_700Bold', color: 'rgba(255,255,255,0.60)', letterSpacing: 1.5 },
  leaveBtn:  { flex: 1, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,40,40,0.10)', borderWidth: 1, borderColor: 'rgba(255,40,40,0.30)', alignItems: 'center', justifyContent: 'center' },
  leaveText: { fontSize: 11, fontFamily: 'Orbitron_700Bold', color: '#FF6B6B', letterSpacing: 1.5 },
});
