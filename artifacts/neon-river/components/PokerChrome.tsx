// ─── Shared poker-table chrome ─────────────────────────────────────────────────
// Single source of truth for the visual language shared by AI Practice
// (app/game/practice.tsx) and Multiplayer (app/multiplayer/game.tsx), so both
// modes render through the same components/styles instead of drifting apart.

import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import PlayingCard from '@/components/PlayingCard';
import NeonAvatarSeat from '@/components/NeonAvatar';
import colors from '@/constants/colors';
import { getBestHandVariant } from '@/lib/pokerEngine';
import type { GameVariant } from '@/constants/gameVariants';
import { ChatBubble } from '@/components/InGameChat';
import type { BubbleEntry } from '@/components/InGameChat';

// ─── Shared constants ──────────────────────────────────────────────────────────

export const PHASE_LABELS: Record<string, string> = {
  preflop: 'PRE-FLOP',
  flop: 'FLOP',
  turn: 'TURN',
  river: 'RIVER',
  showdown: 'SHOWDOWN',
  waiting: 'WAITING',
};

export const HAND_COLORS: Record<string, string> = {
  'Royal Flush':    '#ff0090',
  'Straight Flush': '#ff0090',
  'Four of a Kind': '#ff0090',
  'Full House':     '#bf5fff',
  'Flush':          '#00d4ff',
  'Straight':       '#00d4ff',
  'Three of a Kind':'#ffd700',
  'Two Pair':       '#ffd700',
  'One Pair':       '#aaaacc',
  'High Card':      '#666688',
};

export function formatChips(n: number): string {
  const v = (x: number) => x % 1 === 0 ? x.toFixed(0) : x.toFixed(1);
  if (n >= 1_000_000_000) return `${v(n / 1_000_000_000)}B`;
  if (n >= 1_000_000)     return `${v(n / 1_000_000)}M`;
  if (n >= 1_000)         return `${v(n / 1_000)}K`;
  return String(n);
}

// ─── Community cards ──────────────────────────────────────────────────────────

export function CommunityCards({
  cards,
  phase,
  holeCards,
  variant = 'texas_holdem',
}: {
  cards: any[];
  phase: string;
  holeCards: any[];
  variant?: GameVariant;
}) {
  const [revealedCount, setRevealedCount] = useState(0);
  const prevLengthRef = useRef(0);

  useEffect(() => {
    const prev = prevLengthRef.current;
    const curr = cards.length;
    const ids: ReturnType<typeof setTimeout>[] = [];

    if (curr === 0) {
      prevLengthRef.current = 0;
      setRevealedCount(0);
    } else if (curr > prev) {
      for (let idx = prev; idx < curr; idx++) {
        const delay = (idx - prev) * 240;
        const id = setTimeout(() => {
          setRevealedCount(c => Math.max(c, idx + 1));
        }, delay);
        ids.push(id);
      }
      prevLengthRef.current = curr;
    }

    return () => ids.forEach(clearTimeout);
  }, [cards.length]);

  const hasComm = cards.length > 0;
  const hasHole = holeCards.length >= 2;
  const handResult = hasComm && hasHole
    ? getBestHandVariant(holeCards, cards, variant)
    : null;
  const handColor = handResult ? (HAND_COLORS[handResult.name] ?? colors.textMuted) : colors.textMuted;

  return (
    <View style={table.communityArea}>
      <View style={table.communityCards}>
        {[0, 1, 2, 3, 4].map(i =>
          cards[i]
            ? <PlayingCard key={i} card={cards[i]} faceDown={i >= revealedCount} size="md" highlighted={
                handResult != null && holeCards.length >= 2
              } />
            : <View key={i} style={table.emptySlot} />
        )}
      </View>
      {handResult && (
        <Text style={[table.handLabel, { color: handColor }]}>
          {handResult.name}
        </Text>
      )}
    </View>
  );
}

// ─── Action feed ────────────────────────────────────────────────────────────────

export function ActionFeed({ message, isHandOver }: { message: string; isHandOver: boolean }) {
  const [displayed, setDisplayed] = useState('');
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!message || isHandOver) {
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start();
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    setDisplayed(message);
    opacity.setValue(0);
    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    timerRef.current = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 700, useNativeDriver: true }).start();
    }, 2000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [message, isHandOver]);

  if (!displayed) return null;
  return (
    <Animated.Text style={[chrome.actionFeedText, { opacity }]}>{displayed}</Animated.Text>
  );
}

// ─── Circular countdown ring (replaces DotTimer for multiplayer avatar seats) ──

export function TimerRing({ timeoutAt, maxSeconds = 30, size = 44 }: {
  timeoutAt: number; maxSeconds?: number; size?: number;
}) {
  const [progress, setProgress] = useState(1);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulsingRef = useRef(false);
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    const update = () => setProgress(Math.min(1, Math.max(0, (timeoutAt - Date.now()) / 1000 / maxSeconds)));
    update();
    const id = setInterval(update, 100);
    return () => clearInterval(id);
  }, [timeoutAt, maxSeconds]);

  useEffect(() => {
    const secondsLeft = progress * maxSeconds;
    if (secondsLeft <= 3 && secondsLeft > 0 && !pulsingRef.current) {
      pulsingRef.current = true;
      pulseLoop.current = Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.13, duration: 280, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 280, useNativeDriver: true }),
      ]));
      pulseLoop.current.start();
    } else if ((secondsLeft > 3 || secondsLeft === 0) && pulsingRef.current) {
      pulsingRef.current = false;
      pulseLoop.current?.stop();
      pulseAnim.setValue(1);
    }
  }, [progress < 0.1, progress === 0]);

  const sw = 2.5;
  const r  = (size - sw * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - progress);
  const color = progress > 0.6 ? '#00d4ff' : progress > 0.35 ? '#ffcc00' : progress > 0.15 ? '#ff8800' : '#ff2200';

  return (
    <Animated.View style={{ position: 'absolute', top: 0, left: 0, transform: [{ scale: pulseAnim }] }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={sw} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={color} strokeWidth={sw} fill="none"
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation={-90} originX={size / 2} originY={size / 2}
        />
      </Svg>
    </Animated.View>
  );
}

// ─── Compact seat (top row) ────────────────────────────────────────────────────
// `player` is a normalized shape shared by AI bots and multiplayer opponents:
// { id, name, chips, avatarIndex, status, isDealer, isSmallBlind, isBigBlind, holeCards }
// `cardCount` — how many hole cards this seat holds (2 for most variants, 4 for Omaha).
// When provided and showCards is false, renders face-down placeholder cards so the
// player can see that an opponent is actively holding cards during the hand.

export function CompactAISeat({
  player, isCurrentTurn, isWinner, timer, timeoutAt, showCards, bubble, cardCount,
}: {
  player: any; isCurrentTurn: boolean; isWinner: boolean; timer?: number; timeoutAt?: number;
  showCards?: boolean; bubble?: BubbleEntry; cardCount?: number;
}) {
  const folded = player.status === 'folded';
  const avatarId = player.avatarIndex > 0 ? player.avatarIndex : 1;
  const showRing = isCurrentTurn && !folded && !!timeoutAt;
  // Use cardCount from prop; fall back to holeCards length if available
  const numCards = cardCount ?? (player.holeCards?.length ?? 0);
  const tightGap = numCards > 2; // 4-card Omaha hands use a tighter gap

  return (
    <View style={[seat.seat, folded && seat.seatFolded]}>
      <ChatBubble bubble={bubble} />
      {/* Ring container sized to the outer ring so the SVG is never clipped */}
      <View style={{ position: 'relative', width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
        <View style={[
          seat.avatarRing,
          isCurrentTurn && seat.avatarRingActive,
          isWinner && seat.avatarRingWinner,
        ]}>
          <NeonAvatarSeat avatarId={avatarId} size={30} />
          {player.isDealer && <View style={seat.posBadge}><Text style={seat.posBadgeText}>D</Text></View>}
          {player.isSmallBlind && !player.isDealer && (
            <View style={[seat.posBadge, { backgroundColor: 'rgba(0,212,255,0.2)', borderColor: '#00d4ff' }]}>
              <Text style={[seat.posBadgeText, { color: '#00d4ff' }]}>S</Text>
            </View>
          )}
          {player.isBigBlind && !player.isDealer && (
            <View style={[seat.posBadge, { backgroundColor: 'rgba(255,0,144,0.2)', borderColor: '#ff0090' }]}>
              <Text style={[seat.posBadgeText, { color: '#ff0090' }]}>B</Text>
            </View>
          )}
        </View>
        {showRing && <TimerRing timeoutAt={timeoutAt} maxSeconds={30} size={44} />}
      </View>
      <Text style={[seat.seatName, isWinner && seat.seatNameWinner]} numberOfLines={1}>{player.name}</Text>
      <Text style={[seat.seatChips, folded && seat.dimText]}>{formatChips(player.chips)}</Text>

      {/* Face-down cards during active hand */}
      {!showCards && !folded && numCards > 0 && (
        <View style={[seat.holeCardRow, tightGap && { gap: 1 }]}>
          {Array.from({ length: numCards }).map((_, i) => (
            <PlayingCard key={i} faceDown size="sm" animated={false} />
          ))}
        </View>
      )}

      {/* Revealed cards at showdown */}
      {showCards && player.holeCards && player.holeCards.length > 0 && (
        <View style={[seat.holeCardRow, tightGap && { gap: 1 }]}>
          {player.holeCards.map((card: any, i: number) => (
            <PlayingCard key={i} card={card} faceDown={false} size="sm" animated={false} />
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

export const seat = StyleSheet.create({
  seat: { alignItems: 'center', flex: 1, paddingHorizontal: 2, gap: 2 },
  seatFolded: { opacity: 0.2 },
  avatarRing: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarRingActive: {
    borderColor: 'rgba(0,212,255,0.65)',
    shadowColor: '#00d4ff',
    shadowOpacity: 1, shadowRadius: 16, shadowOffset: { width: 0, height: 0 },
  },
  avatarRingWinner: {
    borderColor: 'rgba(255,215,0,0.75)',
    shadowColor: '#ffd700',
    shadowOpacity: 1, shadowRadius: 20, shadowOffset: { width: 0, height: 0 },
  },
  posBadge: {
    position: 'absolute', bottom: -2, right: -2,
    width: 13, height: 13, borderRadius: 6.5,
    backgroundColor: 'rgba(255,215,0,0.2)',
    borderWidth: 1, borderColor: '#ffd700',
    alignItems: 'center', justifyContent: 'center',
  },
  posBadgeText: { fontSize: 6, fontWeight: '900', color: '#ffd700' },
  seatName: { color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: '500', maxWidth: 62, textAlign: 'center' },
  seatNameWinner: { color: '#ffd700' },
  seatChips: { color: 'rgba(255,255,255,0.85)', fontSize: 9, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  dimText: { color: 'rgba(255,255,255,0.2)' },
  holeCardRow: { flexDirection: 'row', gap: 2, marginTop: 1 },
});

export const table = StyleSheet.create({
  communityArea: { alignItems: 'center', gap: 6 },
  communityCards: { flexDirection: 'row', gap: 8 },
  emptySlot: {
    width: 44, height: 62, borderRadius: 6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  handLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.5,
    fontFamily: 'Orbitron_400Regular',
    opacity: 0.9,
    marginTop: 2,
  },
});

export const chrome = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#050010' },

  // ── Top controls
  topControls: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingBottom: 6, zIndex: 20,
  },
  topCenter: { flex: 1, alignItems: 'center' },
  iconBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  iconBtnOn: { backgroundColor: 'rgba(0,212,255,0.07)' },
  phaseLabel: {
    color: 'rgba(255,255,255,0.25)', fontSize: 9, fontWeight: '600',
    letterSpacing: 3, fontFamily: 'Orbitron_400Regular',
  },

  // ── Exit modal
  exitOverlay: { flex: 1, backgroundColor: 'rgba(5,0,16,0.88)', alignItems: 'center', justifyContent: 'center' },
  exitCard: {
    width: 280, borderRadius: 20, backgroundColor: 'rgba(18,0,48,0.95)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 28, alignItems: 'center', gap: 8,
  },
  exitTitle: { fontFamily: 'Orbitron_700Bold', fontSize: 16, color: colors.text, letterSpacing: 2 },
  exitSub: { color: colors.textMuted, fontSize: 12, textAlign: 'center', marginBottom: 8 },
  exitBtns: { flexDirection: 'row', gap: 12, marginTop: 4, alignSelf: 'stretch' },
  exitChoiceBtn: { flex: 1, paddingVertical: 12, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  exitYes: { backgroundColor: colors.secondary },
  exitNo: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  exitChoiceText: { color: colors.text, fontSize: 12, fontWeight: '700', letterSpacing: 1 },

  // ── Background glows
  glowPurple: {
    position: 'absolute', top: '10%', left: -90, width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(110,0,170,0.13)',
  },
  glowCyan: {
    position: 'absolute', top: '38%', right: -90, width: 280, height: 280, borderRadius: 140,
    backgroundColor: 'rgba(0,160,210,0.10)',
  },
  glowCenter: {
    position: 'absolute', top: '18%', left: '0%', right: '0%', height: 340, borderRadius: 170,
    backgroundColor: 'rgba(0,50,90,0.16)',
  },

  // ── AI row
  aiRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 8, paddingTop: 4, paddingBottom: 10,
  },

  // ── Center game area
  gameCenter: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 16, paddingTop: 24, paddingBottom: 20,
  },

  // ── Card board surface
  tableSurface: {
    alignItems: 'center',
    paddingHorizontal: 22, paddingVertical: 16,
    borderRadius: 22,
    borderWidth: 1, borderColor: 'rgba(220,0,210,0.30)',
    backgroundColor: 'rgba(0,0,8,0.55)',
    shadowColor: '#FF00C8', shadowOpacity: 0.20, shadowRadius: 22, shadowOffset: { width: 0, height: 0 },
    overflow: 'hidden',
  },
  tableCenterGlow: {
    position: 'absolute', top: '10%', left: '5%', right: '5%', bottom: '10%',
    borderRadius: 12,
    backgroundColor: 'rgba(0,60,35,0.12)',
  },

  // ── Chip animations
  chipToken: {
    position: 'absolute', width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#00d4ff', zIndex: 20,
  },
  chipTokenWin: {
    position: 'absolute', width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#ffd700', zIndex: 20,
  },

  // ── Floating pot capsule
  potFloat: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(4,0,14,0.85)',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 7,
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)',
    shadowColor: '#ffd700', shadowOpacity: 0.22, shadowRadius: 10, shadowOffset: { width: 0, height: 0 },
  },
  potLabel: {
    color: 'rgba(255,215,0,0.5)', fontSize: 8, fontWeight: '700',
    letterSpacing: 3, fontFamily: 'Orbitron_400Regular',
  },
  potAmount: {
    color: '#ffd700', fontSize: 18, fontWeight: '900',
    fontFamily: 'Inter_700Bold',
  },
  potSideRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  potSideItem: {
    alignItems: 'center', gap: 1,
    backgroundColor: 'rgba(4,0,14,0.85)',
    borderRadius: 14, paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.25)',
  },
  potSideLabel: {
    color: 'rgba(255,215,0,0.45)', fontSize: 7, fontWeight: '700',
    letterSpacing: 2, fontFamily: 'Orbitron_400Regular',
  },
  potSideAmt: {
    color: '#ffd700', fontSize: 13, fontWeight: '800',
    fontFamily: 'Inter_700Bold',
  },

  // ── Action feed
  actionFeedText: {
    color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '500',
    letterSpacing: 0.3, textAlign: 'center',
  },

  // ── All-in run
  allInRunText: {
    color: 'rgba(255,0,144,0.65)', fontSize: 10, fontWeight: '700',
    letterSpacing: 2, fontFamily: 'Orbitron_400Regular',
  },

  // ── Human area
  humanArea: { alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 22 },
  humanCards: { flexDirection: 'row', gap: 10 },
  humanStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    flexWrap: 'wrap', justifyContent: 'center',
  },
  humanDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.15)',
  },
  humanDotActive: {
    backgroundColor: '#00d4ff',
    shadowColor: '#00d4ff', shadowOpacity: 1, shadowRadius: 10, shadowOffset: { width: 0, height: 0 },
  },
  humanDotWinner: {
    backgroundColor: '#ffd700',
    shadowColor: '#ffd700', shadowOpacity: 1, shadowRadius: 12, shadowOffset: { width: 0, height: 0 },
  },
  humanName: { color: 'rgba(255,255,255,0.88)', fontSize: 12, fontWeight: '600' },
  humanChips: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  dimText: { opacity: 0.3 },
  dealerBadge: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: 'rgba(255,215,0,0.12)', borderWidth: 1, borderColor: '#ffd700',
    alignItems: 'center', justifyContent: 'center',
  },
  dealerBadgeText: { fontSize: 7, fontWeight: '900', color: '#ffd700' },
  allInBadge: {
    color: '#ff0090', fontSize: 9, fontWeight: '800',
    letterSpacing: 1, fontFamily: 'Orbitron_400Regular',
  },
  winBadge: {
    color: '#ffd700', fontSize: 9, fontWeight: '800',
    letterSpacing: 1, fontFamily: 'Orbitron_400Regular',
  },

  // ── Waiting panel
  waitingPanel: {
    paddingHorizontal: 16, paddingTop: 8,
    alignItems: 'center', gap: 8, minHeight: 56,
  },
  waitingActions: { flexDirection: 'row', gap: 10 },
  skipBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8,
  },
  runItOutBtn: { backgroundColor: 'rgba(255,215,0,0.06)' },
  skipText: {
    color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: '600', letterSpacing: 1,
  },
});
