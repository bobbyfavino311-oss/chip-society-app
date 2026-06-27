import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BettingPanel from '@/components/BettingPanel';
import PlayingCard from '@/components/PlayingCard';
import DotTimer from '@/components/DotTimer';
import colors from '@/constants/colors';
import { useUser } from '@/context/UserContext';
import { useAchievements } from '@/context/AchievementContext';
import { AIDifficulty } from '@/lib/aiBot';
import { usePokerGame, TableConfig } from '@/hooks/usePokerGame';
import { SoundEngine, unlockAudio } from '@/lib/soundEngine';
import { MusicEngine } from '@/lib/musicEngine';
import { getBestHandVariant, describeHand, isRedSuit, suitSymbol, valueLabel } from '@/lib/pokerEngine';
import type { GameVariant } from '@/constants/gameVariants';
import NeonAvatarSeat from '@/components/NeonAvatar';
import { useTableTheme } from '@/context/TableThemeContext';
import DragonBackground from '@/components/DragonBackground';
import DragonCardFrame from '@/components/DragonCardFrame';
import MasqueradeBackground from '@/components/MasqueradeBackground';
import MasqueradeCardFrame from '@/components/MasqueradeCardFrame';
import SakuraBackground from '@/components/SakuraBackground';
import SakuraCardFrame from '@/components/SakuraCardFrame';
import FrozenNeonBackground from '@/components/FrozenNeonBackground';
import FrozenNeonCardFrame from '@/components/FrozenNeonCardFrame';
import CrimsonNoirBackground from '@/components/CrimsonNoirBackground';
import CrimsonNoirCardFrame from '@/components/CrimsonNoirCardFrame';
import VercettiBackground from '@/components/VercettiBackground';
import VercettiCardFrame from '@/components/VercettiCardFrame';
import { useInGameChat, ChatBubble, GameChatPanel, PlayerChatBubble, TableChatToast, QUICK_CHATS } from '@/components/InGameChat';
import type { BubbleEntry } from '@/components/InGameChat';

// ─── Constants ────────────────────────────────────────────────────────────────

const DIFFICULTY_LABELS: Record<AIDifficulty, string> = {
  beginner: 'Beginner',
  casual: 'Casual',
  competitive: 'Competitive',
  shark: 'Shark',
  elite: 'Elite Pro',
};

const DIFFICULTY_COLORS: Record<AIDifficulty, string> = {
  beginner: colors.success,
  casual: colors.primary,
  competitive: colors.gold,
  shark: colors.warning,
  elite: colors.secondary,
};

const PHASE_LABELS: Record<string, string> = {
  preflop: 'PRE-FLOP',
  flop: 'FLOP',
  turn: 'TURN',
  river: 'RIVER',
  showdown: 'SHOWDOWN',
};

// ─── Stake tier → table config ────────────────────────────────────────────────
const STAKE_CONFIGS: Record<string, TableConfig> = {
  beginner:   { smallBlind:    25, bigBlind:    50, minBuyIn:     2_000 },
  casual:     { smallBlind:    50, bigBlind:   100, minBuyIn:     5_000 },
  mid:        { smallBlind:   250, bigBlind:   500, minBuyIn:    25_000 },
  highroller: { smallBlind: 2_500, bigBlind: 5_000, minBuyIn:   250_000 },
  elite:      { smallBlind:25_000, bigBlind:50_000, minBuyIn: 2_500_000 },
};

function getDiffDesc(d: AIDifficulty): string {
  return {
    beginner: 'Folds weak hands, rarely bluffs. Great for learning.',
    casual: 'Plays reasonably well with occasional bluffs.',
    competitive: 'Strategic play with solid betting patterns.',
    shark: 'Aggressive and calculating. Bluffs often.',
    elite: 'Near-optimal play. Only for experts.',
  }[d];
}

function formatChips(n: number): string {
  const v = (x: number) => x % 1 === 0 ? x.toFixed(0) : x.toFixed(1);
  if (n >= 1_000_000_000) return `${v(n / 1_000_000_000)}B`;
  if (n >= 1_000_000)     return `${v(n / 1_000_000)}M`;
  if (n >= 1_000)         return `${v(n / 1_000)}K`;
  return String(n);
}

// ─── Setup screen ─────────────────────────────────────────────────────────────

function SetupScreen({ onStart }: { onStart: (diff: AIDifficulty, numPlayers: number) => void }) {
  const [selected, setSelected] = useState<AIDifficulty>('casual');
  const [playerCount, setPlayerCount] = useState(5);
  const insets = useSafeAreaInsets();
  const col = DIFFICULTY_COLORS[selected];

  return (
    <View style={[setup.container, { paddingTop: insets.top + (Platform.OS === 'web' ? 20 : 20) }]}>
      <LinearGradient
        colors={[colors.background, '#0a0020', colors.background]}
        style={StyleSheet.absoluteFill}
      />
      <TouchableOpacity style={setup.backBtn} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color={colors.primary} />
        <Text style={setup.backText}>LOBBY</Text>
      </TouchableOpacity>
      <Text style={setup.title}>AI PRACTICE</Text>
      <Text style={setup.subtitle}>Choose your challenge</Text>
      <ScrollView contentContainerStyle={{ gap: 12, paddingHorizontal: 20, paddingBottom: 40 }}>
        {(Object.keys(DIFFICULTY_LABELS) as AIDifficulty[]).map(diff => {
          const isSelected = selected === diff;
          const c = DIFFICULTY_COLORS[diff];
          return (
            <TouchableOpacity
              key={diff}
              style={[setup.diffCard, isSelected && { borderColor: c }]}
              onPress={() => { setSelected(diff); Haptics.selectionAsync(); }}
              activeOpacity={0.85}
            >
              {isSelected && (
                <LinearGradient colors={[`${c}22`, 'transparent']} style={StyleSheet.absoluteFill} />
              )}
              <View>
                <Text style={[setup.diffName, isSelected && { color: c }]}>
                  {DIFFICULTY_LABELS[diff].toUpperCase()}
                </Text>
                <Text style={setup.diffDesc}>{getDiffDesc(diff)}</Text>
              </View>
              {isSelected && <Ionicons name="checkmark-circle" size={22} color={c} />}
            </TouchableOpacity>
          );
        })}

        {/* Player count picker */}
        <View style={setup.playerSection}>
          <Text style={setup.sectionLabel}>TABLE SIZE</Text>
          <View style={setup.playerCountRow}>
            {([4, 5] as const).map(n => {
              const active = playerCount === n;
              return (
                <TouchableOpacity
                  key={n}
                  style={[setup.playerCountBtn, active && { borderColor: col, backgroundColor: `${col}18` }]}
                  onPress={() => { setPlayerCount(n); Haptics.selectionAsync(); }}
                  activeOpacity={0.8}
                >
                  <Text style={[setup.playerCountNum, active && { color: col }]}>{n}</Text>
                  <Text style={setup.playerCountLabel}>players</Text>
                  <Text style={setup.playerCountSub}>You + {n - 1} bots</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity style={setup.startBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); onStart(selected, playerCount); }}>
          <LinearGradient colors={[colors.primary, '#0088bb']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
          <Ionicons name="flash" size={20} color={colors.background} />
          <Text style={setup.startText}>DEAL CARDS</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ─── Community cards ──────────────────────────────────────────────────────────

const HAND_COLORS: Record<string, string> = {
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

function CommunityCards({
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
  // Track how many cards have been revealed face-up so far
  const [revealedCount, setRevealedCount] = useState(0);
  const prevLengthRef = useRef(0);

  useEffect(() => {
    const prev = prevLengthRef.current;
    const curr = cards.length;
    const ids: ReturnType<typeof setTimeout>[] = [];

    if (curr === 0) {
      // New hand — reset immediately
      prevLengthRef.current = 0;
      setRevealedCount(0);
    } else if (curr > prev) {
      // New card(s) arrived — stagger reveal for only the new ones
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

// ─── Compact AI seat (top row) ────────────────────────────────────────────────

const SEAT_ACTION_COLORS: Record<string, string> = {
  FOLD: '#ff4444', CHECK: '#00ff88', CALL: '#00d4ff', RAISE: '#bf5fff', 'ALL IN': '#ff0090',
};

function ActionFeed({ message, isHandOver }: { message: string; isHandOver: boolean }) {
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
    <Animated.Text style={[styles.actionFeedText, { opacity }]}>{displayed}</Animated.Text>
  );
}

function CompactAISeat({
  player, isCurrentTurn, isWinner, timer, showCards, bubble,
}: {
  player: any; isCurrentTurn: boolean; isWinner: boolean; timer: number; showCards?: boolean;
  bubble?: BubbleEntry;
}) {
  const folded = player.status === 'folded';
  const avatarId = player.avatarIndex > 0 ? player.avatarIndex : 1;

  return (
    <View style={[g.seat, folded && g.seatFolded, { position: 'relative' }]}>
      <ChatBubble bubble={bubble} />
      <View style={[
        g.avatarRing,
        isCurrentTurn && g.avatarRingActive,
        isWinner && g.avatarRingWinner,
      ]}>
        <NeonAvatarSeat avatarId={avatarId} size={30} />
        {player.isDealer && <View style={g.posBadge}><Text style={g.posBadgeText}>D</Text></View>}
        {player.isSmallBlind && !player.isDealer && (
          <View style={[g.posBadge, { backgroundColor: 'rgba(0,212,255,0.2)', borderColor: '#00d4ff' }]}>
            <Text style={[g.posBadgeText, { color: '#00d4ff' }]}>S</Text>
          </View>
        )}
        {player.isBigBlind && !player.isDealer && (
          <View style={[g.posBadge, { backgroundColor: 'rgba(255,0,144,0.2)', borderColor: '#ff0090' }]}>
            <Text style={[g.posBadgeText, { color: '#ff0090' }]}>B</Text>
          </View>
        )}
      </View>
      {isCurrentTurn && !folded && <DotTimer seconds={timer} maxSeconds={30} isActive size={3} gap={2} />}
      <Text style={[g.seatName, isWinner && g.seatNameWinner]} numberOfLines={1}>{player.name}</Text>
      <Text style={[g.seatChips, folded && g.dimText]}>{formatChips(player.chips)}</Text>
      {player.holeCards.length > 0 && showCards && (
        <View style={g.holeCardRow}>
          {player.holeCards.map((card: any, i: number) => (
            <PlayingCard key={i} card={card} faceDown={false} size="sm" animated={false} />
          ))}
        </View>
      )}
    </View>
  );
}

const g = StyleSheet.create({
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

// ─── Main game screen ─────────────────────────────────────────────────────────

export default function PracticeScreen() {
  const { profile, recordWin, recordLoss, addChips, removeChips, updateProfile } = useUser();
  const { tier, variant: variantParam, players: playersParam } = useLocalSearchParams<{ tier?: string; variant?: string; players?: string }>();
  const tableConfig = STAKE_CONFIGS[tier ?? ''] ?? STAKE_CONFIGS.casual;
  const VALID_VARIANTS = new Set(['texas_holdem', 'short_deck_holdem', 'joker_holdem', 'omaha_holdem']);
  const gameVariant = (VALID_VARIANTS.has(variantParam ?? '') ? variantParam : 'texas_holdem') as import('@/constants/gameVariants').GameVariant;
  const initialPlayers = playersParam ? Math.max(4, Math.min(5, parseInt(playersParam, 10))) : 5;
  const autoStart = !!playersParam;

  const [difficulty, setDifficulty] = useState<AIDifficulty>('casual');
  const [gameStarted, setGameStarted] = useState(autoStart);
  const [exitConfirm, setExitConfirm] = useState(false);
  const [handCount, setHandCount] = useState(0);
  const [numPlayers, setNumPlayers] = useState(initialPlayers);
  const [fxEnabled, setFxEnabled]           = useState(true);
  const [showOmahaRules, setShowOmahaRules] = useState(false);

  // ── In-game chat ──────────────────────────────────────────────────────────
  const chat = useInGameChat();

  // ── Mounted guard — prevents async setState after router.back() ──────────
  const isMountedRef = useRef(true);
  useEffect(() => { isMountedRef.current = true; return () => { isMountedRef.current = false; }; }, []);

  // ── Re-prime iOS audio session on every game entry ────────────────────────
  useEffect(() => { void unlockAudio(); }, []);

  // ── Between-hand countdown ────────────────────────────────────────────────
  const [betweenSecs, setBetweenSecs]         = useState(10);
  const barAnim            = useRef(new Animated.Value(1)).current;
  const betweenIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onHandOverRef      = useRef<() => Promise<void>>(() => Promise.resolve());

  useEffect(() => {
    AsyncStorage.getItem('musicEnabled').then(v => {
      const enabled = v === null ? true : v === 'true';
      setFxEnabled(enabled);
      MusicEngine.configure({ muted: !enabled });
    }).catch(() => {});
  }, []);

  const toggleFx = useCallback(() => {
    const next = !fxEnabled;
    setFxEnabled(next);
    MusicEngine.configure({ muted: !next });
    AsyncStorage.setItem('musicEnabled', String(next)).catch(() => {});
    SoundEngine.button();
  }, [fxEnabled]);

  const { state, startNewHand, handleAction, skipBotTurn, skipToShowdown, continueAfterHand } = usePokerGame(
    difficulty,
    profile.username,
    profile.chips,
    numPlayers,
    tableConfig,
    gameVariant,
  );

  const insets = useSafeAreaInsets();
  const { theme } = useTableTheme();
  const isDragon      = theme.id === 'dragon_fortune';
  const isMasquerade  = theme.id === 'royal_masquerade';
  const isSakura      = theme.id === 'sakura_garden';
  const isFrozenNeon  = theme.id === 'frozen_neon';
  const isCrimsonNoir = theme.id === 'crimson_noir';
  const isVercetti    = theme.id === 'vercetti';
  const needsFrame    = isDragon || isMasquerade || isSakura || isFrozenNeon || isCrimsonNoir || isVercetti;
  const [tableLayout, setTableLayout] = useState({ w: 0, h: 0 });

  // ── Chip-fly animation refs — must be declared before any early return ─────
  const N_CHIP = 4;
  const numAI = numPlayers - 1;
  const seatVec =
    numAI === 3
      ? [{ x: -140, y: 20 }, { x: 0, y: -130 }, { x: 140, y: 20 }, { x: 0, y: 140 }]
      : numAI === 5
      ? [{ x: -145, y: 70 }, { x: -145, y: -60 }, { x: 0, y: -130 }, { x: 145, y: -60 }, { x: 145, y: 70 }, { x: 0, y: 140 }]
      : [{ x: -145, y: 70 }, { x: -90, y: -120 }, { x: 90, y: -120 }, { x: 145, y: 70 }, { x: 0, y: 140 }];
  const chipAnims = useRef(
    Array.from({ length: N_CHIP }, () => ({
      pos: new Animated.ValueXY({ x: 0, y: 0 }),
      opacity: new Animated.Value(0),
    }))
  ).current;
  const winAnims = useRef(
    Array.from({ length: 6 }, () => ({
      pos: new Animated.ValueXY({ x: 0, y: -20 }),
      opacity: new Animated.Value(0),
    }))
  ).current;
  const potPulse = useRef(new Animated.Value(1)).current;
  const prevPotRef = useRef(0);
  const prevPhaseRef = useRef('');

  // Fire bet-chip animation whenever pot grows
  useEffect(() => {
    if (state.pot <= prevPotRef.current) return;
    if (state.phase === 'idle' || state.phase === 'handover' || state.phase === 'showdown') {
      prevPotRef.current = 0;
      return;
    }
    const actor = state.players[state.currentPlayerIndex];
    const localAiPlayers = state.players.filter(p => !p.isHuman);
    const isHumanActor = actor?.isHuman ?? false;
    let vecIdx = 4;
    if (!isHumanActor && actor) {
      const aiIdx = localAiPlayers.findIndex(p => p.id === actor.id);
      vecIdx = aiIdx >= 0 ? Math.min(aiIdx, seatVec.length - 2) : 0;
    }
    const vec = seatVec[vecIdx];
    chipAnims.forEach(({ pos, opacity }, i) => {
      pos.setValue({ x: vec.x + (i - N_CHIP / 2 + 0.5) * 12, y: vec.y + (i % 2) * 6 });
      opacity.setValue(0);
    });
    const anims = chipAnims.map(({ pos, opacity }, i) => {
      const tx = (i - N_CHIP / 2 + 0.5) * 4;
      return Animated.sequence([
        Animated.delay(i * 85),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
          Animated.timing(pos.x, { toValue: tx, duration: 480, useNativeDriver: true }),
          Animated.timing(pos.y, { toValue: -18, duration: 480, useNativeDriver: true }),
        ]),
        Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true }),
      ]);
    });
    Animated.parallel(anims).start();
    // Pot pulse fires when first chip arrives (~480ms into movement)
    setTimeout(() => {
      Animated.sequence([
        Animated.timing(potPulse, { toValue: 1.25, duration: 120, useNativeDriver: true }),
        Animated.timing(potPulse, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }, 460);
    // Chip sound fires when first chip starts sliding (immediate — auditory lead)
    SoundEngine.chip();
    prevPotRef.current = state.pot;
  }, [state.pot, state.phase]);

  // Fire win-chip animation when hand ends
  useEffect(() => {
    if (state.phase !== 'handover') { prevPhaseRef.current = state.phase; return; }
    if (prevPhaseRef.current === 'handover') return;
    prevPhaseRef.current = 'handover';
    if (state.winnerIds.length === 0) return;
    const winnerId = state.winnerIds[0];
    const isHumanWin = winnerId === 'human';
    const localAiPlayers = state.players.filter(p => !p.isHuman);
    const aiIdx = isHumanWin ? -1 : localAiPlayers.findIndex(p => p.id === winnerId);
    const vecIdx = isHumanWin ? seatVec.length - 1 : Math.min(aiIdx < 0 ? 0 : aiIdx, seatVec.length - 2);
    const target = seatVec[vecIdx];
    winAnims.forEach(({ pos, opacity }) => { pos.setValue({ x: 0, y: -20 }); opacity.setValue(0); });
    const anims = winAnims.map(({ pos, opacity }, i) => {
      const tx = target.x + (i - 2.5) * 16;
      return Animated.sequence([
        Animated.delay(i * 65 + 180),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 90, useNativeDriver: true }),
          Animated.timing(pos.x, { toValue: tx, duration: 460, useNativeDriver: true }),
          Animated.timing(pos.y, { toValue: target.y, duration: 460, useNativeDriver: true }),
        ]),
        Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]);
    });
    Animated.parallel(anims).start();
    if (isHumanWin) SoundEngine.win(); else SoundEngine.lose();
    prevPotRef.current = 0;
  }, [state.phase, state.winnerIds]);

  // ── Achievement hooks (must be above every early return) ─────────────────
  const { recordGameWin, recordGameLoss, recordOmahaHand, onChipBalance } = useAchievements();

  // ── Ambient music — start when game begins, stop when it ends ────────────
  React.useEffect(() => {
    if (!gameStarted) { MusicEngine.stop(); return; }
    MusicEngine.play();
    return () => { MusicEngine.stop(); };
  }, [gameStarted]);

  React.useEffect(() => {
    if (!gameStarted) return;
    const isHandOver = state.phase === 'handover' || state.phase === 'showdown';
    const humanAllIn = state.players.find((p: { isHuman: boolean; status: string }) => p.isHuman)?.status === 'allIn';
    if (isHandOver) MusicEngine.setIntensity('showdown');
    else if (humanAllIn) MusicEngine.setIntensity('tense');
    else MusicEngine.setIntensity('normal');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStarted, state.phase, state.players]);

  // ── Auto-start when launched from Quick Play (players URL param provided) ─
  const autoStartFired = useRef(false);
  useEffect(() => {
    if (!autoStart || autoStartFired.current) return;
    autoStartFired.current = true;
    startNewHand(0, initialPlayers - 1);
    SoundEngine.deal();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Bot chat — AI players occasionally send quick chat messages ───────────
  const botChatRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!gameStarted || state.phase === 'idle' || state.phase === 'handover') return;
    const aiPlayerList = state.players.filter((p: any) => !p.isHuman && p.status !== 'folded');
    if (aiPlayerList.length === 0) return;
    const delay = 8000 + Math.random() * 20000; // 8-28 s
    botChatRef.current = setTimeout(() => {
      const sender = aiPlayerList[Math.floor(Math.random() * aiPlayerList.length)] as any;
      const msg    = QUICK_CHATS[Math.floor(Math.random() * QUICK_CHATS.length)];
      chat.receiveBotMessage(sender.id, sender.name, msg);
    }, delay);
    return () => { if (botChatRef.current) clearTimeout(botChatRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStarted, state.phase]);

  // ── Setup screen (early return — hooks are all above this) ────────────────
  if (!gameStarted) {
    return (
      <SetupScreen
        onStart={(diff, n) => {
          setDifficulty(diff);
          setNumPlayers(n);
          setGameStarted(true);
          startNewHand(0, n - 1);
          SoundEngine.deal();
        }}
      />
    );
  }

  const humanPlayer = state.players.find(p => p.isHuman);
  const aiPlayers = state.players.filter(p => !p.isHuman);
  const currentPlayer = state.players[state.currentPlayerIndex];
  const isHumanTurn = currentPlayer?.isHuman === true && humanPlayer?.status === 'active';
  const isAllIn = humanPlayer?.status === 'allIn';

  const callAmount = humanPlayer ? Math.max(0, state.currentBet - humanPlayer.betInRound) : 0;
  const canCheck = callAmount === 0;

  const isHandOver = state.phase === 'handover' || state.phase === 'showdown';
  const isGameOver = state.phase === 'idle' && state.message.includes('Not enough');

  const showRunItOut = isAllIn && !isHandOver && state.phase !== 'idle';

  const onHandOver = async () => {
    const humanDelta = humanPlayer?.chipDelta ?? 0;
    const finalHumanChips = humanPlayer?.chips ?? 0;
    const didWin = state.winnerIds.includes('human');

    if (didWin) {
      await recordWin(0);
      if (!isMountedRef.current) return;
      const human = state.players.find(p => p.isHuman);
      let handDesc = state.winnerHand ?? '';
      if (!handDesc && human && human.holeCards.length >= 2) {
        const best = getBestHandVariant(human.holeCards, state.communityCards, state.variant);
        handDesc = describeHand(best);
      }
      const wasAllIn = human?.status === 'allIn' || isAllIn;
      recordGameWin(handDesc, wasAllIn, state.pot, gameVariant);
      onChipBalance(finalHumanChips);
    } else {
      await recordLoss();
      if (!isMountedRef.current) return;
      recordGameLoss();
    }

    // Omaha stat tracking — every hand regardless of outcome
    if (gameVariant === 'omaha_holdem') {
      recordOmahaHand();
      const omahaUpdates: Parameters<typeof updateProfile>[0] = {
        omahaHandsPlayed: (profile.omahaHandsPlayed ?? 0) + 1,
      };
      if (didWin) {
        omahaUpdates.omahaWins = (profile.omahaWins ?? 0) + 1;
        omahaUpdates.omahaBiggestPot = Math.max(profile.omahaBiggestPot ?? 0, state.pot);
      } else {
        omahaUpdates.omahaLosses = (profile.omahaLosses ?? 0) + 1;
      }
      await updateProfile(omahaUpdates);
    }

    if (humanDelta > 0) {
      await addChips(humanDelta);
    } else if (humanDelta < 0) {
      await removeChips(-humanDelta);
    }
    if (!isMountedRef.current) return;

    setHandCount(h => h + 1);
    continueAfterHand();
    SoundEngine.deal();
  };

  // Always keep the ref current so the auto-timer calls the latest closure
  onHandOverRef.current = onHandOver;

  // 10-second neon countdown bar between hands; auto-advances when it reaches 0
  useEffect(() => {
    if (!isHandOver) {
      if (betweenIntervalRef.current) { clearInterval(betweenIntervalRef.current); betweenIntervalRef.current = null; }
      barAnim.stopAnimation();
      setBetweenSecs(10);
      barAnim.setValue(1);
      return;
    }
    setBetweenSecs(10);
    barAnim.setValue(1);
    Animated.timing(barAnim, { toValue: 0, duration: 10_000, useNativeDriver: false }).start();
    betweenIntervalRef.current = setInterval(() => {
      setBetweenSecs(s => {
        const next = s - 1;
        if (next <= 0) {
          clearInterval(betweenIntervalRef.current!);
          betweenIntervalRef.current = null;
          // Use setTimeout(0) to move the async call out of the state-updater
          setTimeout(() => {
            onHandOverRef.current().catch(() => {});
          }, 0);
          return 0;
        }
        return next;
      });
    }, 1_000);
    return () => {
      if (betweenIntervalRef.current) { clearInterval(betweenIntervalRef.current); betweenIntervalRef.current = null; }
      barAnim.stopAnimation();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHandOver]);

  return (
    <View style={styles.screen}>
      {/* Atmospheric background */}
      <LinearGradient
        colors={theme.bgGradient as [string, string, string, string, string]}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.3, y: 0 }} end={{ x: 0.7, y: 1 }}
      />
      {/* Ambient glow blobs — only for the default neon theme */}
      {!isDragon && !isMasquerade && !isSakura && !isFrozenNeon && !isCrimsonNoir && !isVercetti && (
        <>
          <View style={[styles.glowPurple, { backgroundColor: theme.glowA }]} />
          <View style={[styles.glowCyan,   { backgroundColor: theme.glowB }]} />
          <View style={[styles.glowCenter, { backgroundColor: theme.glowCenter }]} />
        </>
      )}

      {/* Theme atmospheric backgrounds */}
      {isDragon      && <DragonBackground />}
      {isMasquerade  && <MasqueradeBackground />}
      {isSakura      && <SakuraBackground />}
      {isFrozenNeon  && <FrozenNeonBackground />}
      {isCrimsonNoir && <CrimsonNoirBackground />}
      {isVercetti    && <VercettiBackground />}

      {/* Exit modal — animationType="none" avoids native-animation/navigation race on iOS */}
      <Modal transparent visible={exitConfirm} animationType="none" onRequestClose={() => setExitConfirm(false)}>
        <View style={styles.exitOverlay}>
          <View style={styles.exitCard}>
            <Text style={styles.exitTitle}>EXIT GAME?</Text>
            <Text style={styles.exitSub}>Your current hand will be lost.</Text>
            <View style={styles.exitBtns}>
              <TouchableOpacity
                style={[styles.exitChoiceBtn, styles.exitYes]}
                onPress={() => router.back()}
                activeOpacity={0.85}
              >
                <Text style={styles.exitChoiceText}>YES</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.exitChoiceBtn, styles.exitNo]}
                onPress={() => setExitConfirm(false)}
                activeOpacity={0.85}
              >
                <Text style={styles.exitChoiceText}>NO</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Omaha rules modal */}
      <Modal transparent visible={showOmahaRules} animationType="fade" onRequestClose={() => setShowOmahaRules(false)}>
        <View style={styles.exitOverlay}>
          <View style={[styles.exitCard, { maxWidth: 320, paddingHorizontal: 24, paddingVertical: 28 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={[styles.exitTitle, { fontSize: 15, letterSpacing: 3 }]}>OMAHA HOLD'EM</Text>
              <TouchableOpacity onPress={() => setShowOmahaRules(false)} hitSlop={12}>
                <Ionicons name="close" size={20} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            </View>
            {[
              'Each player receives 4 private hole cards.',
              'Five community cards are dealt face-up.',
              'You must use exactly 2 of your hole cards.',
              'You must use exactly 3 community cards.',
              'Standard poker hand rankings apply.',
              'Betting rounds: Pre-Flop · Flop · Turn · River.',
              'Best legal 5-card hand wins.',
            ].map((rule, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 9 }}>
                <Text style={{ color: '#00ff88', fontFamily: 'Orbitron_400Regular', fontSize: 9, lineHeight: 16 }}>▸</Text>
                <Text style={[styles.exitSub, { textAlign: 'left', fontSize: 12, lineHeight: 17, flex: 1 }]}>{rule}</Text>
              </View>
            ))}
          </View>
        </View>
      </Modal>

      {/* Top controls */}
      <View style={[styles.topControls, { paddingTop: insets.top + (Platform.OS === 'web' ? 20 : 10) }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => setExitConfirm(true)} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.55)" />
        </TouchableOpacity>
        <View style={styles.topCenter}>
          {state.phase !== 'idle' && (
            <Text style={styles.phaseLabel}>
              {PHASE_LABELS[state.phase] ?? ''}
              {handCount > 0 && `  ·  #${handCount + 1}`}
            </Text>
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {gameVariant === 'omaha_holdem' && (
            <TouchableOpacity style={styles.iconBtn} onPress={() => setShowOmahaRules(true)} activeOpacity={0.75}>
              <Ionicons name="information-circle-outline" size={18} color="#00ff88cc" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.iconBtn, fxEnabled && styles.iconBtnOn]}
            onPress={toggleFx}
            activeOpacity={0.75}
          >
            <Ionicons
              name={fxEnabled ? 'musical-notes' : 'musical-notes-outline'}
              size={16}
              color={fxEnabled ? '#00d4ff' : 'rgba(255,255,255,0.3)'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* AI players — minimal, close to top */}
      <View style={styles.aiRow}>
        {aiPlayers.map(player => (
          <CompactAISeat
            key={player.id}
            player={player}
            isCurrentTurn={state.players[state.currentPlayerIndex]?.id === player.id}
            isWinner={state.winnerIds.includes(player.id)}
            timer={state.timer}
            showCards={isHandOver && (gameVariant !== 'omaha_holdem' ? player.status !== 'folded' : state.winnerIds.includes(player.id))}
            bubble={chat.bubbles[player.id]}
          />
        ))}
      </View>

      {/* Center — cards are the hero */}
      <View style={styles.gameCenter}>
        {/* Chip fly animations */}
        {chipAnims.map(({ pos, opacity }, i) => (
          <Animated.View key={`c${i}`} style={[styles.chipToken, {
            backgroundColor: theme.chipTokenColor,
            opacity, transform: [{ translateX: pos.x }, { translateY: pos.y }],
          }]} />
        ))}
        {winAnims.map(({ pos, opacity }, i) => (
          <Animated.View key={`w${i}`} style={[styles.chipTokenWin, {
            backgroundColor: theme.chipWinTokenColor,
            opacity, transform: [{ translateX: pos.x }, { translateY: pos.y }],
          }]} />
        ))}

        {/* Community card board — dark glass surface (wrapped for Dragon/Vice frame) */}
        <View
          onLayout={needsFrame ? (e) => {
            const { width, height } = e.nativeEvent.layout;
            setTableLayout({ w: width, h: height });
          } : undefined}
          style={{ position: 'relative' }}
        >
          {isDragon && tableLayout.w > 0 && (
            <DragonCardFrame width={tableLayout.w} height={tableLayout.h} />
          )}
          {isMasquerade && tableLayout.w > 0 && (
            <MasqueradeCardFrame width={tableLayout.w} height={tableLayout.h} />
          )}
          {isSakura && tableLayout.w > 0 && (
            <SakuraCardFrame width={tableLayout.w} height={tableLayout.h} />
          )}
          {isFrozenNeon && tableLayout.w > 0 && (
            <FrozenNeonCardFrame width={tableLayout.w} height={tableLayout.h} />
          )}
          {isCrimsonNoir && tableLayout.w > 0 && (
            <CrimsonNoirCardFrame width={tableLayout.w} height={tableLayout.h} />
          )}
          {isVercetti && tableLayout.w > 0 && (
            <VercettiCardFrame width={tableLayout.w} height={tableLayout.h} />
          )}
        <View style={[styles.tableSurface, {
          borderColor: theme.tableSurfaceBorder,
          backgroundColor: theme.tableSurfaceBg,
          shadowColor: theme.tableSurfaceShadow,
        }]}>
          <View style={[styles.tableCenterGlow, { backgroundColor: theme.tableCenterGlow }]} />
          <CommunityCards
            cards={state.communityCards}
            phase={state.phase}
            holeCards={humanPlayer?.holeCards ?? []}
            variant={state.variant}
          />
        </View>
        </View>{/* end Dragon frame wrapper */}

        {/* Floating pot */}
        {state.sidePots.length > 1 ? (
          <Animated.View style={[styles.potFloat, {
            backgroundColor: theme.potBg,
            borderColor: theme.potBorder,
            shadowColor: theme.potShadow,
            transform: [{ scale: potPulse }],
          }]}>
            <View style={styles.potSideRow}>
              {state.sidePots.map((sp, i) => (
                <View key={i} style={[styles.potSideItem, {
                  backgroundColor: theme.potBg,
                  borderColor: theme.potBorder,
                }]}>
                  <Text style={[styles.potSideLabel, { color: theme.potLabelColor }]}>{i === 0 ? 'MAIN' : `SIDE ${i}`}</Text>
                  <Text style={[styles.potSideAmt,   { color: theme.potAmountColor }]}>{formatChips(sp.amount)}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        ) : state.pot > 0 ? (
          <Animated.View style={[styles.potFloat, {
            backgroundColor: theme.potBg,
            borderColor: theme.potBorder,
            shadowColor: theme.potShadow,
            transform: [{ scale: potPulse }],
          }]}>
            <Text style={[styles.potLabel,  { color: theme.potLabelColor  }]}>POT</Text>
            <Text style={[styles.potAmount, { color: theme.potAmountColor }]}>{formatChips(state.pot)}</Text>
          </Animated.View>
        ) : null}

        {/* Action feed — fades automatically */}
        <ActionFeed message={state.message} isHandOver={isHandOver} />

        {/* Table chat toast — recent message floats near community cards */}
        <TableChatToast toast={chat.latestToast} />

        {/* All-in runout */}
        {(() => {
          const nonFolded = state.players.filter(p => p.status !== 'folded');
          const allAllIn = nonFolded.length >= 2 && nonFolded.every(p => p.status === 'allIn');
          if (!allAllIn || isHandOver) return null;
          return <Text style={styles.allInRunText}>ALL IN — running board</Text>;
        })()}
      </View>

      {/* Human player area */}
      {humanPlayer && (
        <View style={styles.humanArea}>
          {/* Human player chat bubble — appears above their cards */}
          <PlayerChatBubble bubble={chat.bubbles['me']} />
          {/* Hole cards */}
          <View style={styles.humanCards}>
            {humanPlayer.holeCards.length > 0
              ? humanPlayer.holeCards.map((card, i) => (
                  <PlayingCard key={i} card={card} faceDown={false} size={humanPlayer.holeCards.length > 2 ? 'md' : 'lg'} />
                ))
              : <><PlayingCard faceDown size="lg" /><PlayingCard faceDown size="lg" /></>
            }
          </View>
          {/* Minimal info strip */}
          <View style={styles.humanStrip}>
            <View style={[
              styles.humanDot,
              isHumanTurn && styles.humanDotActive,
              state.winnerIds.includes('human') && styles.humanDotWinner,
            ]} />
            <Text style={[
              styles.humanName,
              state.winnerIds.includes('human') && { color: '#ffd700' },
              humanPlayer.status === 'folded' && styles.dimText,
            ]}>
              {humanPlayer.name}
            </Text>
            <Text style={[styles.humanChips, humanPlayer.status === 'folded' && styles.dimText]}>
              {formatChips(humanPlayer.chips)}
            </Text>
            {humanPlayer.isDealer && (
              <View style={styles.dealerBadge}><Text style={styles.dealerBadgeText}>D</Text></View>
            )}
            {isHumanTurn && <DotTimer seconds={state.timer} maxSeconds={20} isActive size={6} gap={3} />}
            {humanPlayer.status === 'allIn' && <Text style={styles.allInBadge}>ALL IN</Text>}
            {state.winnerIds.includes('human') && <Text style={styles.winBadge}>WIN</Text>}
          </View>
        </View>
      )}

      {/* Bottom controls */}
      {isHandOver ? (
        <ScrollView
          style={styles.handoverScroll}
          contentContainerStyle={[styles.handoverPanel, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 28 : 10) }]}
          showsVerticalScrollIndicator={false}
        >
          {(() => {
            const humanWonAnyPot = state.potResults.some(pr => !pr.isReturned && pr.winnerIds.includes('human'));
            const humanContrib  = state.playerContribs['human'] ?? 0;
            const humanNet      = humanPlayer?.chipDelta ?? 0;
            const humanReturned = state.returnedChips['human'] ?? 0;
            const humanCollected = humanNet + humanContrib; // total chips received from pots

            // Human's best hand at showdown
            const humanHand = state.showCards && humanPlayer && humanPlayer.holeCards.length >= 2 && state.communityCards.length >= 3
              ? getBestHandVariant(humanPlayer.holeCards, state.communityCards, state.variant)
              : null;
            const humanHandName = humanHand?.name ?? '';
            const humanHandDesc = humanHand ? describeHand(humanHand) : '';
            const handColor = HAND_COLORS[humanHandName] ?? '#ffd700';

            // All-in players (anyone who committed chips via all-in path)
            const allInPlayers = state.players.filter(p => {
              const contrib = state.playerContribs[p.id] ?? 0;
              return contrib > 0 && (p.status === 'allIn' || (state.potResults.length > 1 && contrib > 0));
            });
            const hasAllIns = state.potResults.length > 1 || allInPlayers.some(p => p.status === 'allIn');

            // Players with non-zero contribution for results table
            const resultPlayers = state.players
              .filter(p => (state.playerContribs[p.id] ?? 0) > 0 || p.chipDelta !== 0)
              .sort((a, b) => b.chipDelta - a.chipDelta);

            return (
              <>
                {/* ── Human hand result ─────────────────────────────────── */}
                {humanHand && (
                  <View style={styles.hoHandHeader}>
                    <Text style={[styles.hoHandRank, { color: handColor }]}>{humanHandName.toUpperCase()}</Text>
                    {humanHandDesc !== humanHandName && (
                      <Text style={styles.hoHandDesc}>{humanHandDesc}</Text>
                    )}
                    {/* Omaha "USED" breakdown — show which 2 hole + 3 board cards formed the hand */}
                    {gameVariant === 'omaha_holdem' && humanHand.usedHoleCards && humanHand.usedBoardCards && (
                      <View style={styles.omahaUsedRow}>
                        <Text style={styles.omahaUsedLabel}>USED</Text>
                        <View style={styles.omahaUsedCards}>
                          {humanHand.usedHoleCards.map((c, i) => (
                            <Text key={`uh${i}`} style={[styles.omahaUsedCard, { color: isRedSuit(c.suit) ? '#ff6666' : '#e8e8e8' }]}>
                              {valueLabel(c.value)}{suitSymbol(c.suit)}
                            </Text>
                          ))}
                          <Text style={styles.omahaUsedPlus}>+</Text>
                          {humanHand.usedBoardCards.map((c, i) => (
                            <Text key={`ub${i}`} style={[styles.omahaUsedCard, { color: isRedSuit(c.suit) ? '#ff6666' : '#e8e8e8' }]}>
                              {valueLabel(c.value)}{suitSymbol(c.suit)}
                            </Text>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                )}

                {/* ── Pot breakdown ─────────────────────────────────────── */}
                {state.potResults.length > 0 && (
                  <View style={styles.hoPotSection}>
                    {state.potResults.map((pr, i) => {
                      const humanWonThis = pr.winnerIds.includes('human');
                      const winnerNames  = pr.winnerIds
                        .map(id => { const p = state.players.find(pl => pl.id === id); return p ? (p.isHuman ? 'You' : p.name) : id; })
                        .join(' & ');
                      return (
                        <View key={i} style={[styles.hoPotRow, humanWonThis && !pr.isReturned && styles.hoPotRowWon]}>
                          <View style={styles.hoPotLeft}>
                            <Text style={styles.hoPotLabel}>{pr.label}</Text>
                            {pr.isReturned
                              ? <Text style={styles.hoPotReturnedTag}>RETURNED</Text>
                              : <Text style={[styles.hoPotWinner, humanWonThis && { color: '#ffd700' }]}>
                                  {humanWonThis ? 'YOU' : winnerNames}
                                </Text>
                            }
                            {pr.winnerHand !== '' && !pr.isReturned && (
                              <Text style={styles.hoPotHand}>{pr.winnerHand}</Text>
                            )}
                          </View>
                          <Text style={[styles.hoPotAmt, pr.isReturned && { color: 'rgba(255,255,255,0.35)' }, humanWonThis && !pr.isReturned && { color: '#ffd700' }]}>
                            {formatChips(pr.amount)}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* ── Human net summary ─────────────────────────────────── */}
                {humanContrib > 0 && (
                  <View style={styles.hoNetSection}>
                    <View style={styles.hoNetRow}>
                      <Text style={styles.hoNetLabel}>INVESTED</Text>
                      <Text style={styles.hoNetValue}>-{formatChips(humanContrib)}</Text>
                    </View>
                    {humanReturned > 0 && (
                      <View style={styles.hoNetRow}>
                        <Text style={styles.hoNetLabel}>RETURNED</Text>
                        <Text style={[styles.hoNetValue, { color: 'rgba(255,255,255,0.55)' }]}>+{formatChips(humanReturned)}</Text>
                      </View>
                    )}
                    {humanWonAnyPot && humanCollected > 0 && (
                      <View style={styles.hoNetRow}>
                        <Text style={styles.hoNetLabel}>COLLECTED</Text>
                        <Text style={[styles.hoNetValue, { color: 'rgba(255,255,255,0.7)' }]}>{formatChips(humanCollected)}</Text>
                      </View>
                    )}
                    <View style={[styles.hoNetRow, styles.hoNetRowFinal]}>
                      <Text style={[styles.hoNetLabel, { color: humanNet >= 0 ? '#00e887' : '#ff5555', fontFamily: 'Orbitron_700Bold', letterSpacing: 2 }]}>
                        {humanNet >= 0 ? 'NET PROFIT' : 'NET LOSS'}
                      </Text>
                      <Text style={[styles.hoNetFinalAmt, { color: humanNet >= 0 ? '#00e887' : '#ff5555' }]}>
                        {humanNet >= 0 ? '+' : ''}{formatChips(humanNet)}
                      </Text>
                    </View>
                  </View>
                )}

                {/* ── All-in contributions ──────────────────────────────── */}
                {hasAllIns && (() => {
                  const contrib = state.players.filter(p => (state.playerContribs[p.id] ?? 0) > 0);
                  if (contrib.length < 2) return null;
                  return (
                    <View style={styles.hoContribSection}>
                      <Text style={styles.hoSectionTitle}>ALL-IN CONTRIBUTIONS</Text>
                      {contrib.sort((a, b) => (state.playerContribs[b.id] ?? 0) - (state.playerContribs[a.id] ?? 0)).map(p => (
                        <View key={p.id} style={styles.hoContribRow}>
                          <Text style={[styles.hoContribName, p.isHuman && { color: 'rgba(255,255,255,0.85)' }]}>
                            {p.isHuman ? 'You' : p.name}
                          </Text>
                          <Text style={styles.hoContribAmt}>{formatChips(state.playerContribs[p.id] ?? 0)}</Text>
                        </View>
                      ))}
                    </View>
                  );
                })()}

                {/* ── Player results table ──────────────────────────────── */}
                {resultPlayers.length > 0 && (
                  <View style={styles.hoPlayersSection}>
                    <Text style={styles.hoSectionTitle}>PLAYER RESULTS</Text>
                    {resultPlayers.map(p => {
                      const wonPots = state.potResults.filter(pr => !pr.isReturned && pr.winnerIds.includes(p.id));
                      const hand = state.showCards && p.holeCards.length >= 2 && state.communityCards.length >= 3
                        ? getBestHandVariant(p.holeCards, state.communityCards, state.variant)
                        : null;
                      const isFolded = p.status === 'folded';
                      const delta = p.chipDelta;
                      const won = delta > 0;
                      return (
                        <View key={p.id} style={[styles.hoPlayerRow, won && styles.hoPlayerRowWon]}>
                          <View style={styles.hoPlayerLeft}>
                            <View style={styles.hoPlayerNameRow}>
                              {won
                                ? <Ionicons name="trophy" size={9} color="#ffd700" style={{ marginRight: 4 }} />
                                : <View style={{ width: 13 }} />
                              }
                              <Text style={[styles.hoPlayerName, won && { color: '#ffd700' }]}>
                                {p.isHuman ? 'You' : p.name}
                              </Text>
                            </View>
                            <Text style={styles.hoPlayerHandText} numberOfLines={1}>
                              {isFolded ? 'Folded' : (hand ? describeHand(hand) : '—')}
                            </Text>
                            {wonPots.map((pr, i) => (
                              <Text key={i} style={styles.hoPlayerPotTag}>Won {pr.label}</Text>
                            ))}
                          </View>
                          <Text style={[styles.hoPlayerDelta, { color: delta > 0 ? '#00e887' : '#ff5555' }]}>
                            {delta > 0 ? '+' : ''}{formatChips(delta)}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* ── Between-hand neon countdown bar ──────────────────── */}
                {!isGameOver && (
                  <View style={styles.countdownWrap}>
                    <View style={styles.countdownTrack}>
                      <Animated.View style={{ flex: barAnim, overflow: 'hidden' }}>
                        <LinearGradient
                          colors={['#00d4ff', '#bf5fff', '#ff0090']}
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                          style={{ flex: 1 }}
                        />
                      </Animated.View>
                      <Animated.View style={{ flex: barAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }} />
                    </View>
                    <Text style={styles.countdownLabel}>NEXT HAND IN {betweenSecs}…</Text>
                  </View>
                )}

                {/* ── Next Hand button ──────────────────────────────────── */}
                {isGameOver ? (
                  <TouchableOpacity style={styles.nextBtn} onPress={() => setGameStarted(false)}>
                    <Text style={[styles.nextBtnText, { color: colors.text }]}>BACK TO LOBBY</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.nextBtn}
                    onPress={() => {
                      if (betweenIntervalRef.current) { clearInterval(betweenIntervalRef.current); betweenIntervalRef.current = null; }
                      barAnim.stopAnimation();
                      void onHandOver();
                    }}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={['rgba(0,150,180,0.4)', 'rgba(0,100,130,0.5)']}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    />
                    <Text style={styles.nextBtnText}>Next Hand</Text>
                    <Ionicons name="chevron-forward" size={14} color="#00d4ff" />
                  </TouchableOpacity>
                )}
              </>
            );
          })()}
        </ScrollView>
      ) : isHumanTurn ? (
        <View style={{ paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) }}>
          <BettingPanel
            canCheck={canCheck}
            callAmount={callAmount}
            myChips={humanPlayer?.chips ?? 0}
            pot={state.pot}
            minRaise={state.minRaise}
            currentBet={state.currentBet}
            onFold={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); SoundEngine.fold(); handleAction('fold'); }}
            onCheck={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); SoundEngine.check(); handleAction('check'); }}
            onCall={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); SoundEngine.call(); handleAction('call'); }}
            onRaise={amt => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); SoundEngine.raise(); handleAction('raise', amt); }}
            onAllIn={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); SoundEngine.allin(); handleAction('allin'); }}
          />
        </View>
      ) : (
        <View style={[styles.waitingPanel, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 8) }]}>
          <View style={styles.waitingActions}>
            {!isHumanTurn && humanPlayer?.status === 'active'
              && state.phase !== 'handover' && state.phase !== 'showdown' && state.phase !== 'idle' && (
              <TouchableOpacity style={styles.skipBtn}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); skipBotTurn(); }}
                activeOpacity={0.75}>
                <Ionicons name="play-skip-forward" size={13} color="rgba(255,255,255,0.35)" />
                <Text style={styles.skipText}>SKIP</Text>
              </TouchableOpacity>
            )}
            {showRunItOut && (
              <TouchableOpacity style={[styles.skipBtn, styles.runItOutBtn]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); skipToShowdown(); }}
                activeOpacity={0.75}>
                <Ionicons name="flash" size={13} color="#ffd700" />
                <Text style={[styles.skipText, { color: '#ffd700' }]}>RUN IT OUT</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* In-game chat icon + slide-up panel */}
      <GameChatPanel
        messages={chat.messages}
        panelOpen={chat.panelOpen}
        slideAnim={chat.slideAnim}
        unread={chat.unread}
        muted={chat.muted}
        setMuted={chat.setMuted}
        presetsOnly={chat.presetsOnly}
        setPresetsOnly={chat.setPresetsOnly}
        input={chat.input}
        setInput={chat.setInput}
        sendMessage={chat.sendMessage}
        onOpen={chat.openPanel}
        onClose={chat.closePanel}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const setup = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 16, marginBottom: 24 },
  backText: { color: colors.primary, fontSize: 12, fontWeight: '700', fontFamily: 'Orbitron_400Regular', letterSpacing: 1 },
  title: { color: colors.primary, fontSize: 28, fontWeight: '800', fontFamily: 'Orbitron_900Black', letterSpacing: 3, textAlign: 'center', marginBottom: 4 },
  subtitle: { color: colors.textMuted, fontSize: 13, textAlign: 'center', marginBottom: 20 },
  diffCard: {
    borderRadius: colors.radius, borderWidth: 1, borderColor: colors.border,
    padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, overflow: 'hidden',
  },
  diffName: { color: colors.text, fontSize: 14, fontWeight: '700', fontFamily: 'Orbitron_700Bold', letterSpacing: 1, marginBottom: 4 },
  diffDesc: { color: colors.textMuted, fontSize: 12, maxWidth: 240 },
  startBtn: {
    borderRadius: colors.radius, overflow: 'hidden', flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 10, marginTop: 8,
  },
  startText: { color: colors.background, fontSize: 16, fontWeight: '800', fontFamily: 'Orbitron_700Bold', letterSpacing: 2 },
  playerSection: { gap: 8, marginTop: 4 },
  sectionLabel: {
    color: colors.textMuted, fontSize: 10, fontWeight: '700',
    letterSpacing: 2, fontFamily: 'Orbitron_400Regular',
  },
  playerCountRow: { flexDirection: 'row', gap: 10 },
  playerCountBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 14,
    borderRadius: colors.radius, borderWidth: 1.5,
    borderColor: colors.border, backgroundColor: colors.surface,
  },
  playerCountNum: {
    color: colors.textDim, fontSize: 24, fontWeight: '800',
    fontFamily: 'Orbitron_700Bold', lineHeight: 28,
  },
  playerCountLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '600', marginTop: 2 },
  playerCountSub: { color: colors.textMuted, fontSize: 9, marginTop: 1 },
});

const table = StyleSheet.create({
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

const styles = StyleSheet.create({
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

  // ── Handover scroll + panel
  handoverScroll: {
    maxHeight: 300, flexShrink: 1,
  },
  handoverPanel: {
    paddingHorizontal: 12, paddingTop: 8, gap: 7,
  },

  // Hand result header
  hoHandHeader: {
    alignItems: 'center', paddingVertical: 4,
  },
  hoHandRank: {
    fontSize: 17, fontWeight: '900', fontFamily: 'Orbitron_900Black', letterSpacing: 2,
  },
  hoHandDesc: {
    fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 1,
  },
  omahaUsedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, justifyContent: 'center',
  },
  omahaUsedLabel: {
    fontFamily: 'Orbitron_400Regular', fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: 2,
  },
  omahaUsedCards: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
  },
  omahaUsedCard: {
    fontFamily: 'Inter_700Bold', fontSize: 13, letterSpacing: 0.5,
  },
  omahaUsedPlus: {
    fontFamily: 'Inter_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginHorizontal: 4,
  },

  // Pot breakdown section
  hoPotSection: {
    gap: 3, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.07)',
    paddingHorizontal: 10, paddingVertical: 7,
  },
  hoPotRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 4, borderRadius: 6,
  },
  hoPotRowWon: {
    backgroundColor: 'rgba(255,215,0,0.05)',
    paddingHorizontal: 6,
  },
  hoPotLeft: { flex: 1, gap: 1 },
  hoPotLabel: {
    fontSize: 8, fontWeight: '800', letterSpacing: 2,
    fontFamily: 'Orbitron_400Regular', color: 'rgba(255,255,255,0.3)',
  },
  hoPotWinner: {
    fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.65)',
  },
  hoPotReturnedTag: {
    fontSize: 9, fontWeight: '700', letterSpacing: 1,
    color: 'rgba(255,255,255,0.3)', fontFamily: 'Orbitron_400Regular',
  },
  hoPotHand: {
    fontSize: 9, color: 'rgba(255,255,255,0.3)',
  },
  hoPotAmt: {
    fontSize: 14, fontWeight: '900', fontFamily: 'Inter_700Bold', color: '#ffd700',
  },

  // Net summary section
  hoNetSection: {
    borderRadius: 10, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.07)',
    paddingHorizontal: 10, paddingVertical: 6, gap: 4,
  },
  hoNetRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  hoNetRowFinal: {
    marginTop: 2, paddingTop: 5,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.1)',
  },
  hoNetLabel: {
    fontSize: 9, fontWeight: '700', letterSpacing: 1.5,
    fontFamily: 'Orbitron_400Regular', color: 'rgba(255,255,255,0.35)',
  },
  hoNetValue: {
    fontSize: 12, fontWeight: '700', fontFamily: 'Inter_700Bold', color: 'rgba(255,255,255,0.55)',
  },
  hoNetFinalAmt: {
    fontSize: 18, fontWeight: '900', fontFamily: 'Inter_700Bold',
  },

  // All-in contributions
  hoContribSection: { gap: 4 },
  hoSectionTitle: {
    fontSize: 8, fontWeight: '800', letterSpacing: 2, fontFamily: 'Orbitron_400Regular',
    color: 'rgba(255,255,255,0.2)', marginBottom: 1,
  },
  hoContribRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 2, paddingHorizontal: 6,
    borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.02)',
  },
  hoContribName: {
    fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.45)',
  },
  hoContribAmt: {
    fontSize: 11, fontWeight: '700', fontFamily: 'Inter_700Bold', color: 'rgba(255,255,255,0.55)',
  },

  // Player results
  hoPlayersSection: { gap: 3 },
  hoPlayerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 4, paddingHorizontal: 8, borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  hoPlayerRowWon: { backgroundColor: 'rgba(255,215,0,0.05)' },
  hoPlayerLeft: { flex: 1, gap: 1 },
  hoPlayerNameRow: { flexDirection: 'row', alignItems: 'center' },
  hoPlayerName: {
    fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.65)',
  },
  hoPlayerHandText: {
    fontSize: 9, color: 'rgba(255,255,255,0.3)', marginLeft: 13,
  },
  hoPlayerPotTag: {
    fontSize: 8, color: '#00d4ff', fontWeight: '600',
    letterSpacing: 0.5, marginLeft: 13,
  },
  hoPlayerDelta: {
    fontSize: 12, fontWeight: '800', fontFamily: 'Inter_700Bold',
  },

  countdownWrap: {
    alignItems: 'center', gap: 5, paddingHorizontal: 4, marginBottom: 6,
  },
  countdownTrack: {
    width: '100%', height: 3, flexDirection: 'row',
    borderRadius: 2, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  countdownLabel: {
    fontSize: 8, fontFamily: 'Orbitron_400Regular',
    color: 'rgba(255,255,255,0.28)', letterSpacing: 1.5,
  },

  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderRadius: 10, overflow: 'hidden', paddingVertical: 10,
    backgroundColor: 'rgba(0,120,180,0.12)',
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(0,180,255,0.2)',
    marginTop: 2,
  },
  nextBtnText: {
    color: '#00d4ff', fontSize: 12, fontWeight: '700',
    fontFamily: 'Orbitron_400Regular', letterSpacing: 1,
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
