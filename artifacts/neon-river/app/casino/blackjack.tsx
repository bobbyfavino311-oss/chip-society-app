import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useState, useRef, useCallback } from 'react';
import {
  Modal, Platform, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import PlayingCard from '@/components/PlayingCard';
import { useUser } from '@/context/UserContext';
import colors from '@/constants/colors';
import type { Card } from '@/lib/pokerEngine';
import {
  createSixDeckShoe, cardBJValue, handTotal,
  isBlackjack, isBust, dealerShouldHit, canSplit,
  SHOE_SIZE, RESHUFFLE_AT, fmt,
} from '@/lib/blackjackEngine';

// ─── Types ────────────────────────────────────────────────────────────────────
type BJPhase = 'betting' | 'player' | 'dealer' | 'result';

interface BJHand {
  cards: Card[];
  bet: number;
  doubled: boolean;
  stood: boolean;
  busted: boolean;
}

type HandOutcome = 'blackjack' | 'win' | 'push' | 'lose' | 'bust';

interface HandResult {
  outcome: HandOutcome;
  net: number;
}

interface BJResult {
  handResults: HandResult[];
  totalNet: number;
  headline: string;
  dealerBusts: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const MIN_BET        = 1_000;
const MAX_BET        = 500_000;
const QUICK_BETS     = [5_000, 25_000, 50_000, 100_000];
const DEALER_DELAY   = 700;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function handDisplay(hand: BJHand): string {
  if (hand.busted)              return 'BUST';
  if (isBlackjack(hand.cards))  return 'BJ';
  return String(handTotal(hand.cards));
}

function dealerDisplay(cards: Card[], revealed: boolean): string {
  if (!revealed) return '?';
  const t = handTotal(cards);
  if (t > 21)  return 'BUST';
  if (isBlackjack(cards)) return 'BJ';
  return String(t);
}

// ─── Sub-components ────────────────────────────────────────────────────────────

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
  const bg   = bj ? 'rgba(255,215,0,0.14)' : bust ? 'rgba(255,68,68,0.14)' : 'rgba(255,255,255,0.08)';
  const bdr  = bj ? 'rgba(255,215,0,0.45)' : bust ? 'rgba(255,68,68,0.40)' : 'rgba(255,255,255,0.18)';
  const col  = bj ? colors.gold : bust ? colors.error : '#fff';
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

// ─── Shuffling overlay ────────────────────────────────────────────────────────
function ShufflingOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <View style={[StyleSheet.absoluteFillObject, { zIndex: 999, alignItems: 'center', justifyContent: 'center' }]}>
      <LinearGradient colors={['rgba(5,0,16,0.96)', 'rgba(10,0,30,0.96)']} style={StyleSheet.absoluteFillObject} />
      <Text style={sh.title}>SHUFFLING SHOE</Text>
      <Text style={sh.sub}>Six decks · 312 cards</Text>
    </View>
  );
}
const sh = StyleSheet.create({
  title: { fontSize: 22, fontFamily: 'Orbitron_900Black', color: colors.gold, letterSpacing: 3, textAlign: 'center' },
  sub:   { fontSize: 11, fontFamily: 'Orbitron_400Regular', color: 'rgba(255,215,0,0.50)', letterSpacing: 2, marginTop: 8 },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function BlackjackScreen() {
  const insets = useSafeAreaInsets();
  const { profile, addChips, removeChips, updateProfile } = useUser();

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
  const dealerCardsRef  = useRef<Card[]>([]);
  const playerHandsRef  = useRef<BJHand[]>([]);

  const [phase,        setPhase]        = useState<BJPhase>('betting');
  const [dealerCards,  setDealerCards]  = useState<Card[]>([]);
  const [playerHands,  setPlayerHands]  = useState<BJHand[]>([]);
  const [activeIdx,    setActiveIdx]    = useState(0);
  const [holeRevealed, setHoleRevealed] = useState(false);
  const [result,       setResult]       = useState<BJResult | null>(null);
  const [exitConfirm,  setExitConfirm]  = useState(false);

  // ── Betting state ────────────────────────────────────────────────────────────
  const [bet,     setBet]     = useState(Math.min(10_000, profile.chips));
  const [lastBet, setLastBet] = useState(Math.min(10_000, profile.chips));

  // ─── Deal helpers ─────────────────────────────────────────────────────────────
  function syncDealerCards(cards: Card[]) {
    dealerCardsRef.current = cards;
    setDealerCards(cards);
  }

  function syncPlayerHands(hands: BJHand[]) {
    playerHandsRef.current = hands;
    setPlayerHands(hands);
  }

  // ─── Results ──────────────────────────────────────────────────────────────────
  const computeResults = useCallback((finalDealerCards: Card[], hands: BJHand[]) => {
    const dealerBusts  = isBust(finalDealerCards);
    const dealerTotal  = handTotal(finalDealerCards);
    const dealerBJ     = isBlackjack(finalDealerCards);

    const handResults: HandResult[] = [];
    let totalNet = 0;
    let wins = 0;
    let losses = 0;

    for (const hand of hands) {
      const playerTotal = handTotal(hand.cards);
      const playerBJ    = isBlackjack(hand.cards);

      if (hand.busted) {
        handResults.push({ outcome: 'bust', net: -hand.bet });
        losses++;
      } else if (playerBJ && dealerBJ) {
        // Push: return bet
        addChips(hand.bet);
        handResults.push({ outcome: 'push', net: 0 });
      } else if (playerBJ) {
        // Natural blackjack: 3:2
        const payout = hand.bet + Math.floor(hand.bet * 1.5);
        addChips(payout);
        handResults.push({ outcome: 'blackjack', net: Math.floor(hand.bet * 1.5) });
        totalNet += Math.floor(hand.bet * 1.5);
        wins++;
      } else if (dealerBJ) {
        // Dealer BJ, player no BJ: lose
        handResults.push({ outcome: 'lose', net: -hand.bet });
        losses++;
        totalNet -= hand.bet;
      } else if (dealerBusts) {
        addChips(hand.bet * 2);
        handResults.push({ outcome: 'win', net: hand.bet });
        totalNet += hand.bet;
        wins++;
      } else if (playerTotal > dealerTotal) {
        addChips(hand.bet * 2);
        handResults.push({ outcome: 'win', net: hand.bet });
        totalNet += hand.bet;
        wins++;
      } else if (playerTotal === dealerTotal) {
        addChips(hand.bet);
        handResults.push({ outcome: 'push', net: 0 });
      } else {
        handResults.push({ outcome: 'lose', net: -hand.bet });
        totalNet -= hand.bet;
        losses++;
      }
    }

    // Update profile stats
    const handsCount = hands.length;
    updateProfile({ handsPlayed: profile.handsPlayed + handsCount, wins: profile.wins + wins, losses: profile.losses + losses });

    // Headline
    let headline = 'DEALER WINS';
    if (handResults.every(r => r.outcome === 'blackjack'))  headline = 'BLACKJACK';
    else if (handResults.every(r => r.outcome === 'push'))  headline = 'PUSH';
    else if (handResults.every(r => r.outcome === 'bust'))  headline = 'PLAYER BUSTS';
    else if (dealerBusts && !handResults.every(r => r.outcome === 'bust')) headline = 'DEALER BUSTS';
    else if (handResults.some(r => r.outcome === 'win' || r.outcome === 'blackjack')) headline = 'PLAYER WINS';

    setResult({ handResults, totalNet, headline, dealerBusts });
    setPhase('result');

    if (totalNet > 0) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    else if (totalNet < 0) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  }, [addChips, updateProfile, profile.handsPlayed, profile.wins, profile.losses]);

  // ─── Dealer auto-play ─────────────────────────────────────────────────────────
  function runDealerTurn(currentCards: Card[], hands: BJHand[]) {
    if (dealerShouldHit(currentCards)) {
      setTimeout(() => {
        const card = drawCard();
        const nextCards = [...currentCards, card];
        syncDealerCards(nextCards);
        runDealerTurn(nextCards, hands);
      }, DEALER_DELAY);
    } else {
      setTimeout(() => computeResults(currentCards, hands), 400);
    }
  }

  function startDealerTurn(hands: BJHand[], dCards: Card[]) {
    setHoleRevealed(true);
    setPhase('dealer');
    runDealerTurn(dCards, hands);
  }

  // ─── Advance to next hand or dealer ──────────────────────────────────────────
  function advanceOrDealer(newHands: BJHand[], completedIdx: number) {
    syncPlayerHands(newHands);
    const nextIdx = completedIdx + 1;
    if (nextIdx < newHands.length) {
      setActiveIdx(nextIdx);
    } else {
      startDealerTurn(newHands, dealerCardsRef.current);
    }
  }

  // ─── Actions ──────────────────────────────────────────────────────────────────
  function handleDeal() {
    const actualBet = Math.min(bet, profile.chips);
    if (actualBet < MIN_BET || profile.chips < actualBet) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    removeChips(actualBet);
    setLastBet(actualBet);
    checkAndReshuffle();

    const p1 = drawCard();
    const d1 = drawCard();
    const p2 = drawCard();
    const d2 = drawCard();

    const dCards = [d1, d2];
    const initialHand: BJHand = { cards: [p1, p2], bet: actualBet, doubled: false, stood: false, busted: false };
    const hands = [initialHand];

    syncDealerCards(dCards);
    syncPlayerHands(hands);
    setActiveIdx(0);
    setHoleRevealed(false);
    setResult(null);

    // Natural blackjack check
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
    const card = drawCard();
    const hand = playerHandsRef.current[activeIdx];
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
    removeChips(hand.bet);
    const card = drawCard();
    const newCards = [...hand.cards, card];
    const updatedHand: BJHand = {
      ...hand, cards: newCards,
      bet: hand.bet * 2, doubled: true, stood: true,
      busted: isBust(newCards),
    };
    const newHands = playerHandsRef.current.map((h, i) => i === activeIdx ? updatedHand : h);
    advanceOrDealer(newHands, activeIdx);
  }

  function handleSplit() {
    const hand = playerHandsRef.current[activeIdx];
    if (profile.chips < hand.bet) return;
    if (!canSplit(hand.cards)) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    removeChips(hand.bet);

    const c1 = drawCard();
    const c2 = drawCard();
    const hand1: BJHand = { cards: [hand.cards[0], c1], bet: hand.bet, doubled: false, stood: false, busted: false };
    const hand2: BJHand = { cards: [hand.cards[1], c2], bet: hand.bet, doubled: false, stood: false, busted: false };

    syncPlayerHands([hand1, hand2]);
    setActiveIdx(0);
  }

  function handleNewHand() {
    syncDealerCards([]);
    syncPlayerHands([]);
    setHoleRevealed(false);
    setResult(null);
    setBet(Math.min(lastBet, profile.chips > 0 ? profile.chips : MIN_BET));
    checkAndReshuffle();
    setPhase('betting');
  }

  // ─── Derived ─────────────────────────────────────────────────────────────────
  const activeHand   = playerHands[activeIdx];
  const canDoubleNow = activeHand?.cards.length === 2 && !activeHand?.doubled && profile.chips >= activeHand?.bet;
  const canSplitNow  = activeHand?.cards.length === 2 && canSplit(activeHand?.cards ?? []) && playerHands.length === 1 && profile.chips >= activeHand?.bet;
  const isSplit      = playerHands.length === 2;

  // ─── Bet adjusters ────────────────────────────────────────────────────────────
  const maxBet       = Math.min(MAX_BET, profile.chips);
  function adjustBet(delta: number) {
    setBet(prev => Math.min(maxBet, Math.max(MIN_BET, prev + delta)));
  }

  // ─── Result color helpers ─────────────────────────────────────────────────────
  function resultColor(headline: string) {
    if (headline === 'BLACKJACK')   return colors.gold;
    if (headline === 'PLAYER WINS' || headline === 'DEALER BUSTS') return colors.success;
    if (headline === 'PUSH')        return '#ffcc44';
    return colors.error;
  }

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <LinearGradient
        colors={['#060010', '#0d0022', '#070015']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Subtle ambient glows */}
      <View style={[s.glowTop,    { backgroundColor: 'rgba(0,212,255,0.05)' }]} />
      <View style={[s.glowBottom, { backgroundColor: 'rgba(255,215,0,0.04)' }]} />

      <ShufflingOverlay visible={isShuffling} />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={[s.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={s.closeBtn} onPress={() => setExitConfirm(true)}>
          <Ionicons name="close" size={20} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>

        <View style={s.titleBlock}>
          <Text style={s.titleText}>BLACKJACK</Text>
          <Text style={s.subtitleText}>SIX DECK SHOE</Text>
        </View>

        <ShoeIndicator dealt={cardsDealt} />
      </View>

      {/* ── Dealer zone ────────────────────────────────────────────────────── */}
      <View style={s.dealerZone}>
        <Text style={s.zoneLabel}>DEALER</Text>
        <View style={s.cardsRow}>
          {dealerCards.map((card, i) => (
            <View key={i} style={s.cardSlot}>
              <PlayingCard
                card={card}
                faceDown={i === 1 && !holeRevealed}
                size="sm"
              />
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

      {/* ── Center divider ─────────────────────────────────────────────────── */}
      <View style={s.centerDivider}>
        <View style={s.divLine} />
        <View style={s.divDiamond} />
        <View style={s.divLine} />
      </View>

      {/* ── Player zone ────────────────────────────────────────────────────── */}
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
                    <View key={i} style={s.cardSlotSm}>
                      <PlayingCard card={card} size="sm" />
                    </View>
                  ))}
                </View>
                <ScoreBadge
                  label={handDisplay(hand)}
                  bust={hand.busted}
                  bj={isBlackjack(hand.cards)}
                />
                {/* Bet label per split hand */}
                <Text style={s.handBetLabel}>{fmt(hand.bet)}</Text>
              </View>
            ))}
          </View>
        ) : (
          <>
            <Text style={s.zoneLabel}>PLAYER</Text>
            <View style={s.cardsRow}>
              {(playerHands[0]?.cards ?? []).map((card, i) => (
                <View key={i} style={s.cardSlot}>
                  <PlayingCard card={card} size="md" />
                </View>
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
                bust={playerHands[0]?.busted}
                bj={isBlackjack(playerHands[0]?.cards ?? [])}
              />
            )}
          </>
        )}
      </View>

      {/* ── Bottom controls ─────────────────────────────────────────────────── */}
      <View style={[s.controls, { paddingBottom: insets.bottom + 8 }]}>

        {/* BETTING PHASE */}
        {phase === 'betting' && (
          <View style={s.bettingPanel}>
            <Text style={s.bettingLabel}>PLACE YOUR BET</Text>

            {/* Bet adjust row */}
            <View style={s.betRow}>
              <TouchableOpacity style={s.betAdjBtn} onPress={() => adjustBet(-1_000)} activeOpacity={0.7}>
                <Text style={s.betAdjText}>-</Text>
              </TouchableOpacity>

              <View style={s.betDisplay}>
                <Text style={s.betAmount}>{fmt(bet)}</Text>
                <Text style={s.betChips}>chips</Text>
              </View>

              <TouchableOpacity style={s.betAdjBtn} onPress={() => adjustBet(1_000)} activeOpacity={0.7}>
                <Text style={s.betAdjText}>+</Text>
              </TouchableOpacity>
            </View>

            {/* Quick bets */}
            <View style={s.quickRow}>
              <TouchableOpacity style={s.quickBtn} onPress={() => setBet(MIN_BET)} activeOpacity={0.7}>
                <Text style={s.quickLabel}>MIN</Text>
                <Text style={s.quickAmt}>{fmt(MIN_BET)}</Text>
              </TouchableOpacity>
              {QUICK_BETS.filter(b => b <= maxBet).map(b => (
                <TouchableOpacity key={b} style={[s.quickBtn, bet === b && s.quickBtnActive]} onPress={() => setBet(b)} activeOpacity={0.7}>
                  <Text style={[s.quickAmt, { letterSpacing: 0 }]}>{fmt(b)}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={s.quickBtn} onPress={() => setBet(maxBet)} activeOpacity={0.7}>
                <Text style={s.quickLabel}>MAX</Text>
              </TouchableOpacity>
              {lastBet > 0 && lastBet <= maxBet && (
                <TouchableOpacity style={s.quickBtn} onPress={() => setBet(lastBet)} activeOpacity={0.7}>
                  <Text style={s.quickLabel}>RPT</Text>
                  <Text style={s.quickAmt}>{fmt(lastBet)}</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Balance */}
            <Text style={s.balanceText}>Balance: {fmt(profile.chips)}</Text>

            {/* Deal button */}
            <TouchableOpacity
              style={[s.dealBtn, profile.chips < MIN_BET && s.dealBtnDisabled]}
              onPress={handleDeal}
              disabled={profile.chips < MIN_BET}
              activeOpacity={0.82}
            >
              <LinearGradient
                colors={['#1a4a00', '#2a7800']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              />
              <Text style={s.dealText}>DEAL</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* PLAYER ACTION PHASE */}
        {phase === 'player' && (
          <View style={s.actionPanel}>
            <View style={s.betInfoRow}>
              <Text style={s.betInfoLabel}>BET</Text>
              <Text style={s.betInfoAmt}>{fmt(activeHand?.bet ?? 0)}</Text>
              <Text style={s.betInfoLabel}>BALANCE</Text>
              <Text style={s.betInfoAmt}>{fmt(profile.chips)}</Text>
            </View>
            <View style={s.actionRow}>
              <TouchableOpacity style={[s.actionBtn, s.foldBtn]} onPress={handleStand} activeOpacity={0.8}>
                <LinearGradient colors={['rgba(50,0,0,0.7)', 'rgba(30,0,0,0.7)']} style={StyleSheet.absoluteFill} />
                <Text style={[s.actionText, { color: '#FF6B6B' }]}>STAND</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[s.actionBtn, s.hitBtn]} onPress={handleHit} activeOpacity={0.8}>
                <LinearGradient colors={['rgba(0,60,100,0.7)', 'rgba(0,40,70,0.7)']} style={StyleSheet.absoluteFill} />
                <Text style={[s.actionText, { color: colors.primary }]}>HIT</Text>
              </TouchableOpacity>

              {canDoubleNow && (
                <TouchableOpacity style={[s.actionBtn, s.doubleBtn]} onPress={handleDouble} activeOpacity={0.8}>
                  <LinearGradient colors={['rgba(80,60,0,0.7)', 'rgba(50,40,0,0.7)']} style={StyleSheet.absoluteFill} />
                  <Text style={[s.actionText, { color: colors.gold }]}>DOUBLE</Text>
                </TouchableOpacity>
              )}

              {canSplitNow && (
                <TouchableOpacity style={[s.actionBtn, s.splitBtn]} onPress={handleSplit} activeOpacity={0.8}>
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
            <View style={s.dealerPulse} />
            <Text style={s.dealerTurnText}>DEALER PLAYING</Text>
            <Text style={s.dealerTurnSub}>Drawing to 17...</Text>
          </View>
        )}

        {/* RESULT PHASE */}
        {phase === 'result' && result && (
          <View style={s.resultPanel}>
            <View style={[s.headlineBadge, { borderColor: `${resultColor(result.headline)}55` }]}>
              <LinearGradient
                colors={[`${resultColor(result.headline)}18`, 'transparent']}
                style={StyleSheet.absoluteFill}
              />
              <Text style={[s.headlineText, { color: resultColor(result.headline) }]}>
                {result.headline}
              </Text>
            </View>

            <Text style={[
              s.netText,
              result.totalNet > 0 ? { color: colors.success } :
              result.totalNet < 0 ? { color: colors.error } :
              { color: '#ffcc44' },
            ]}>
              {result.totalNet > 0 ? '+' : result.totalNet === 0 ? '' : '-'}
              {result.totalNet === 0 ? 'PUSH' : fmt(Math.abs(result.totalNet))}
            </Text>

            <Text style={s.newBalanceText}>Balance: {fmt(profile.chips)}</Text>

            <TouchableOpacity style={s.newHandBtn} onPress={handleNewHand} activeOpacity={0.82}>
              <LinearGradient colors={['#001a3a', '#003080']} style={StyleSheet.absoluteFill} />
              <Text style={s.newHandText}>NEW HAND</Text>
            </TouchableOpacity>
          </View>
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
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#060010' },
  glowTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 200, borderRadius: 100, opacity: 0.8 },
  glowBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 180, borderRadius: 100 },

  // Header
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10, gap: 8, zIndex: 10 },
  closeBtn:    { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' },
  titleBlock:  { flex: 1, alignItems: 'center' },
  titleText:   { fontSize: 18, fontFamily: 'Orbitron_900Black', color: '#fff', letterSpacing: 3 },
  subtitleText:{ fontSize: 8, fontFamily: 'Orbitron_400Regular', color: 'rgba(255,215,0,0.55)', letterSpacing: 2.5, marginTop: 2 },

  // Zones
  dealerZone:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 8 },
  playerZone:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 8 },
  zoneLabel:   { fontSize: 9, fontFamily: 'Orbitron_700Bold', color: 'rgba(255,255,255,0.32)', letterSpacing: 3, marginBottom: 8 },

  // Cards
  cardsRow:    { flexDirection: 'row', alignItems: 'center', flexWrap: 'nowrap', gap: 4 },
  cardsRowSplit:{ flexDirection: 'row', alignItems: 'center', gap: 3 },
  cardSlot:    { marginHorizontal: -2 },
  cardSlotSm:  { marginHorizontal: -2 },

  emptySlots:  { flexDirection: 'row', gap: 8 },
  emptyCard:   {
    width: 50, height: 70, borderRadius: 7,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderStyle: 'dashed',
  },

  // Center divider
  centerDivider: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 32, gap: 0 },
  divLine:       { flex: 1, height: 1, backgroundColor: 'rgba(255,215,0,0.15)' },
  divDiamond:    { width: 8, height: 8, backgroundColor: 'rgba(255,215,0,0.30)', transform: [{ rotate: '45deg' }], marginHorizontal: 8 },

  // Split
  splitRow:        { flexDirection: 'row', gap: 16, justifyContent: 'center', paddingHorizontal: 12 },
  splitHand:       { alignItems: 'center', padding: 10, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.02)' },
  splitHandActive: { borderColor: `${colors.primary}55`, backgroundColor: `rgba(0,212,255,0.06)` },
  handLabel:       { fontSize: 8, fontFamily: 'Orbitron_700Bold', color: 'rgba(255,255,255,0.35)', letterSpacing: 2, marginBottom: 6 },
  handBetLabel:    { fontSize: 9, fontFamily: 'Inter_700Bold', color: 'rgba(255,215,0,0.55)', marginTop: 4 },

  // Controls container
  controls:    { paddingHorizontal: 16, paddingTop: 4 },

  // Betting
  bettingPanel:  { gap: 10 },
  bettingLabel:  { fontSize: 9, fontFamily: 'Orbitron_700Bold', color: 'rgba(255,255,255,0.32)', letterSpacing: 2.5, textAlign: 'center' },
  betRow:        { flexDirection: 'row', alignItems: 'center', gap: 14, justifyContent: 'center' },
  betAdjBtn:     { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(0,212,255,0.10)', borderWidth: 1, borderColor: 'rgba(0,212,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  betAdjText:    { fontSize: 22, color: colors.primary, fontFamily: 'Inter_700Bold', lineHeight: 26 },
  betDisplay:    { alignItems: 'center', minWidth: 100 },
  betAmount:     { fontSize: 30, fontFamily: 'Inter_700Bold', color: '#fff', letterSpacing: -0.5 },
  betChips:      { fontSize: 9, fontFamily: 'Orbitron_400Regular', color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5, marginTop: -2 },
  quickRow:      { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center' },
  quickBtn:      { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', alignItems: 'center', minWidth: 46 },
  quickBtnActive:{ backgroundColor: 'rgba(0,212,255,0.12)', borderColor: 'rgba(0,212,255,0.35)' },
  quickLabel:    { fontSize: 8, fontFamily: 'Orbitron_700Bold', color: 'rgba(255,255,255,0.40)', letterSpacing: 1 },
  quickAmt:      { fontSize: 10, fontFamily: 'Inter_700Bold', color: 'rgba(255,255,255,0.70)' },
  balanceText:   { fontSize: 10, fontFamily: 'Inter_700Bold', color: 'rgba(255,255,255,0.28)', textAlign: 'center' },
  dealBtn:       { height: 52, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(0,200,0,0.45)' },
  dealBtnDisabled:{ opacity: 0.35 },
  dealText:      { fontSize: 16, fontFamily: 'Orbitron_900Black', color: '#fff', letterSpacing: 4 },

  // Action
  actionPanel:   { gap: 10 },
  betInfoRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center' },
  betInfoLabel:  { fontSize: 8, fontFamily: 'Orbitron_700Bold', color: 'rgba(255,255,255,0.30)', letterSpacing: 1.5 },
  betInfoAmt:    { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#fff' },
  actionRow:     { flexDirection: 'row', gap: 8 },
  actionBtn:     { flex: 1, height: 54, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  foldBtn:       { borderColor: 'rgba(255,68,68,0.45)' },
  hitBtn:        { borderColor: 'rgba(0,212,255,0.45)' },
  doubleBtn:     { borderColor: 'rgba(255,215,0,0.40)' },
  splitBtn:      { borderColor: 'rgba(191,95,255,0.40)' },
  actionText:    { fontSize: 11, fontFamily: 'Orbitron_700Bold', letterSpacing: 1 },

  // Dealer turn
  dealerTurnPanel: { alignItems: 'center', gap: 6, paddingVertical: 16 },
  dealerPulse:     { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gold, marginBottom: 4 },
  dealerTurnText:  { fontSize: 14, fontFamily: 'Orbitron_700Bold', color: colors.gold, letterSpacing: 3 },
  dealerTurnSub:   { fontSize: 10, color: 'rgba(255,215,0,0.45)', fontFamily: 'Orbitron_400Regular' },

  // Result
  resultPanel:    { gap: 10, alignItems: 'center' },
  headlineBadge:  { width: '100%', height: 56, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  headlineText:   { fontSize: 20, fontFamily: 'Orbitron_900Black', letterSpacing: 4 },
  netText:        { fontSize: 28, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  newBalanceText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: 'rgba(255,255,255,0.30)' },
  newHandBtn:     { width: '100%', height: 50, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(0,100,255,0.45)' },
  newHandText:    { fontSize: 14, fontFamily: 'Orbitron_700Bold', color: '#6699ff', letterSpacing: 3 },
});

// Exit modal
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
