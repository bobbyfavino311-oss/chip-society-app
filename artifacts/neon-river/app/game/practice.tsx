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
import PlayerSeat from '@/components/PlayerSeat';
import DotTimer from '@/components/DotTimer';
import colors from '@/constants/colors';
import { useUser } from '@/context/UserContext';
import { useAchievements } from '@/context/AchievementContext';
import { AIDifficulty } from '@/lib/aiBot';
import { usePokerGame, TableConfig } from '@/hooks/usePokerGame';
import { SoundEngine } from '@/lib/soundEngine';
import { MusicEngine } from '@/lib/musicEngine';
import { getBestHand, describeHand } from '@/lib/pokerEngine';

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
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
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
}: {
  cards: any[];
  phase: string;
  holeCards: any[];
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
    ? getBestHand(holeCards, cards)
    : null;
  const handColor = handResult ? (HAND_COLORS[handResult.name] ?? colors.textMuted) : colors.textMuted;

  return (
    <View style={table.communityArea}>
      <View style={table.communityCards}>
        {[0, 1, 2, 3, 4].map(i =>
          cards[i]
            ? <PlayingCard key={i} card={cards[i]} faceDown={i >= revealedCount} size="lg" highlighted={
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

const SEAT_AVATARS = ['♠', '♥', '♦', '♣', '★'];
const SEAT_AVATAR_COLORS = [colors.primary, colors.secondary, '#bf5fff', colors.gold, colors.success];
const SEAT_ACTION_COLORS: Record<string, string> = {
  FOLD: '#ff4444', CHECK: '#00ff88', CALL: '#00d4ff', RAISE: '#bf5fff', 'ALL IN': '#ff0090',
};

function CompactAISeat({
  player, isCurrentTurn, isWinner, timer, showCards,
}: {
  player: any; isCurrentTurn: boolean; isWinner: boolean; timer: number; showCards?: boolean;
}) {
  const avatar = SEAT_AVATARS[player.avatarIndex % SEAT_AVATARS.length];
  const avatarColor = SEAT_AVATAR_COLORS[player.avatarIndex % SEAT_AVATAR_COLORS.length];
  const folded = player.status === 'folded';
  // Don't show FOLD as an action label — just dim the seat
  const showAction = player.lastAction && player.lastAction !== 'FOLD';
  const actionColor = showAction ? (SEAT_ACTION_COLORS[player.lastAction] ?? colors.textMuted) : null;

  return (
    <View style={[g.seat, folded && g.seatFolded]}>
      <View style={[
        g.avatarRing,
        isCurrentTurn && g.avatarRingActive,
        isWinner && g.avatarRingWinner,
      ]}>
        <Text style={[g.avatarSymbol, { color: folded ? colors.textMuted : avatarColor }]}>{avatar}</Text>
        {player.isDealer && <View style={g.posBadge}><Text style={g.posBadgeText}>D</Text></View>}
        {player.isSmallBlind && !player.isDealer && (
          <View style={[g.posBadge, { backgroundColor: colors.primary }]}><Text style={g.posBadgeText}>S</Text></View>
        )}
        {player.isBigBlind && !player.isDealer && (
          <View style={[g.posBadge, { backgroundColor: colors.secondary }]}><Text style={g.posBadgeText}>B</Text></View>
        )}
        {isWinner && (
          <View style={g.winnerRing} />
        )}
      </View>
      {isCurrentTurn && !folded && <DotTimer seconds={timer} maxSeconds={30} isActive size={4} gap={2} />}
      <Text style={[g.seatName, isWinner && g.seatNameWinner]} numberOfLines={1}>{player.name}</Text>
      <Text style={[g.seatChips, folded && g.dimText]}>{formatChips(player.chips)}</Text>
      {player.betInRound > 0 && !folded && (
        <Text style={g.betLabel}>{formatChips(player.betInRound)}</Text>
      )}
      {actionColor && (
        <View style={[g.actionBadge, { borderColor: actionColor, backgroundColor: `${actionColor}18` }]}>
          <Text style={[g.actionText, { color: actionColor }]}>{player.lastAction}</Text>
        </View>
      )}
      {/* Hole cards — face-down during play, revealed on showdown for non-folded players */}
      {player.holeCards.length > 0 && !folded && (
        <View style={g.holeCardRow}>
          {player.holeCards.map((card: any, i: number) => (
            <PlayingCard
              key={i}
              card={card}
              faceDown={!showCards}
              size="sm"
              animated={false}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const g = StyleSheet.create({
  seat: { alignItems: 'center', flex: 1, paddingHorizontal: 3, gap: 3 },
  seatFolded: { opacity: 0.25 },
  avatarRing: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarRingActive: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 1, shadowRadius: 12, shadowOffset: { width: 0, height: 0 },
  },
  avatarRingWinner: {
    borderColor: colors.gold,
    shadowColor: colors.gold,
    shadowOpacity: 1, shadowRadius: 14, shadowOffset: { width: 0, height: 0 },
  },
  winnerRing: {
    position: 'absolute', top: -4, left: -4, right: -4, bottom: -4,
    borderRadius: 28, borderWidth: 2, borderColor: colors.gold,
  },
  avatarSymbol: { fontSize: 22, lineHeight: 28 },
  posBadge: {
    position: 'absolute', bottom: -2, right: -2,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center',
  },
  posBadgeText: { fontSize: 7, fontWeight: '900', color: '#000' },
  seatName: { color: 'rgba(255,255,255,0.85)', fontSize: 10, fontWeight: '600', maxWidth: 68, textAlign: 'center' },
  seatNameWinner: { color: colors.gold, fontWeight: '700' },
  seatChips: { color: colors.text, fontSize: 10, fontWeight: '700', fontFamily: 'Orbitron_700Bold' },
  dimText: { color: colors.textMuted },
  betLabel: { color: colors.primary, fontSize: 9, fontWeight: '700' },
  actionBadge: { borderRadius: 4, borderWidth: 1, paddingHorizontal: 5, paddingVertical: 2 },
  actionText: { fontSize: 8, fontWeight: '700', letterSpacing: 0.5 },
  holeCardRow: { flexDirection: 'row', gap: 3, marginTop: 2 },
});

// ─── Main game screen ─────────────────────────────────────────────────────────

export default function PracticeScreen() {
  const { profile, recordWin, recordLoss } = useUser();
  const { tier } = useLocalSearchParams<{ tier?: string }>();
  const tableConfig = STAKE_CONFIGS[tier ?? ''] ?? STAKE_CONFIGS.casual;

  const [difficulty, setDifficulty] = useState<AIDifficulty>('casual');
  const [gameStarted, setGameStarted] = useState(false);
  const [exitConfirm, setExitConfirm] = useState(false);
  const [handCount, setHandCount] = useState(0);
  const [numPlayers, setNumPlayers] = useState(5);
  const [fxEnabled, setFxEnabled] = useState(true);

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
  );

  const insets = useSafeAreaInsets();

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
        Animated.delay(i * 55),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 80, useNativeDriver: true }),
          Animated.timing(pos.x, { toValue: tx, duration: 320, useNativeDriver: true }),
          Animated.timing(pos.y, { toValue: -18, duration: 320, useNativeDriver: true }),
        ]),
        Animated.timing(opacity, { toValue: 0, duration: 130, useNativeDriver: true }),
      ]);
    });
    Animated.parallel(anims).start();
    Animated.sequence([
      Animated.timing(potPulse, { toValue: 1.3, duration: 110, useNativeDriver: true }),
      Animated.timing(potPulse, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
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
  const { recordGameWin, recordGameLoss, onChipBalance } = useAchievements();

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
    const didWin = state.winnerIds.includes('human');
    if (didWin) {
      await recordWin(0);

      const human = state.players.find(p => p.isHuman);
      let handDesc = state.winnerHand ?? '';
      if (!handDesc && human && human.holeCards.length === 2) {
        const best = getBestHand(human.holeCards, state.communityCards);
        handDesc = describeHand(best);
      }
      const wasAllIn = human?.status === 'allIn' || isAllIn;
      recordGameWin(handDesc, wasAllIn, state.pot);
      onChipBalance((humanPlayer?.chips ?? 0) + state.winnerPot);
    } else {
      await recordLoss();
      recordGameLoss();
    }
    setHandCount(h => h + 1);
    continueAfterHand();
    SoundEngine.deal();
  };

  return (
    <View style={styles.screen}>
      {/* Layered atmospheric background */}
      <LinearGradient
        colors={['#120030', '#05001a', '#020d22', '#05001a', '#120030']}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
      />
      {/* Synthwave grid lines — subtle depth */}
      <View style={styles.gridOverlay} />
      {/* Ambient glow blobs */}
      <View style={styles.glowLeft} />
      <View style={styles.glowRight} />
      <View style={styles.glowCenter} />

      {/* Back button */}
      <TouchableOpacity
        style={[styles.backBtn, { top: insets.top + (Platform.OS === 'web' ? 20 : 10) }]}
        onPress={() => setExitConfirm(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="chevron-back" size={20} color={colors.text} />
      </TouchableOpacity>

      {/* Sound FX toggle — top right */}
      <TouchableOpacity
        style={[
          styles.fxBtn,
          { top: insets.top + (Platform.OS === 'web' ? 20 : 10) },
          fxEnabled && styles.fxBtnOn,
        ]}
        onPress={toggleFx}
        activeOpacity={0.75}
      >
        <Ionicons
          name={fxEnabled ? 'musical-notes' : 'musical-notes-outline'}
          size={17}
          color={fxEnabled ? colors.primary : colors.textDim}
        />
      </TouchableOpacity>

      {/* Phase label */}
      <View style={[styles.topBar, { paddingTop: insets.top + (Platform.OS === 'web' ? 52 : 42) }]}>
        {state.phase !== 'idle' && (
          <Text style={styles.phaseLabel}>
            {PHASE_LABELS[state.phase] ?? ''}
            {handCount > 0 && `  #${handCount + 1}`}
          </Text>
        )}
      </View>

      {/* Exit modal */}
      <Modal transparent visible={exitConfirm} animationType="fade" onRequestClose={() => setExitConfirm(false)}>
        <View style={styles.exitOverlay}>
          <View style={styles.exitCard}>
            <Text style={styles.exitTitle}>EXIT GAME?</Text>
            <Text style={styles.exitSub}>Your current hand will be lost.</Text>
            <View style={styles.exitBtns}>
              <TouchableOpacity
                style={[styles.exitChoiceBtn, styles.exitYes]}
                onPress={() => { setExitConfirm(false); setGameStarted(false); router.back(); }}
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

      {/* ── AI players row ── */}
      <View style={styles.aiRow}>
        {aiPlayers.map(player => (
          <CompactAISeat
            key={player.id}
            player={player}
            isCurrentTurn={state.players[state.currentPlayerIndex]?.id === player.id}
            isWinner={state.winnerIds.includes(player.id)}
            timer={state.timer}
            showCards={isHandOver && player.status !== 'folded'}
          />
        ))}
      </View>

      {/* ── Center game area ── */}
      <View style={styles.gameCenter}>
        {/* Chip fly animations */}
        {chipAnims.map(({ pos, opacity }, i) => (
          <Animated.View key={`c${i}`} style={[styles.chipToken, {
            opacity, transform: [{ translateX: pos.x }, { translateY: pos.y }],
          }]} />
        ))}
        {winAnims.map(({ pos, opacity }, i) => (
          <Animated.View key={`w${i}`} style={[styles.chipTokenWin, {
            opacity, transform: [{ translateX: pos.x }, { translateY: pos.y }],
          }]} />
        ))}

        {/* Pot / side pots */}
        {state.sidePots.length > 1 ? (
          <Animated.View style={[styles.sidePotRow, { transform: [{ scale: potPulse }] }]}>
            {state.sidePots.map((sp, i) => (
              <View key={i} style={styles.sidePotChip}>
                <Text style={styles.sidePotLabel}>{i === 0 ? 'MAIN' : `SIDE ${i}`}</Text>
                <Text style={styles.sidePotAmt}>{formatChips(sp.amount)}</Text>
              </View>
            ))}
          </Animated.View>
        ) : state.pot > 0 ? (
          <Animated.View style={[styles.potPill, { transform: [{ scale: potPulse }] }]}>
            <Text style={styles.potLabel}>POT</Text>
            <Text style={styles.potAmount}>{formatChips(state.pot)}</Text>
          </Animated.View>
        ) : null}

        {/* Subtle table surface — grounds the community cards */}
        <View style={styles.tableSurface}>
          <LinearGradient
            colors={['rgba(0,30,15,0.55)', 'rgba(0,20,10,0.7)', 'rgba(0,30,15,0.55)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
          />
          {/* Ambient edge glow */}
          <View style={styles.tableEdgeTop} />
          <View style={styles.tableEdgeBottom} />

          {/* Community cards */}
          <CommunityCards
            cards={state.communityCards}
            phase={state.phase}
            holeCards={humanPlayer?.holeCards ?? []}
          />
        </View>

        {/* All-in runout label */}
        {(() => {
          const nonFolded = state.players.filter(p => p.status !== 'folded');
          const allAllIn = nonFolded.length >= 2 && nonFolded.every(p => p.status === 'allIn');
          if (!allAllIn || isHandOver) return null;
          return (
            <View style={styles.allInOverlay}>
              <Text style={styles.allInOverlayTitle}>ALL IN</Text>
              <Text style={styles.allInOverlaySub}>Running out the board</Text>
            </View>
          );
        })()}

        {/* Status message */}
        {state.message !== '' && !isHandOver && (
          <View style={styles.messageBox}>
            <Text style={styles.messageText}>{state.message}</Text>
          </View>
        )}
      </View>

      {/* ── Human player row ── */}
      {humanPlayer && (
        <View style={styles.humanRow}>
          {/* Hole cards */}
          <View style={styles.humanCards}>
            {humanPlayer.holeCards.length > 0
              ? humanPlayer.holeCards.map((card, i) => (
                  <PlayingCard key={i} card={card} faceDown={false} size="lg" />
                ))
              : <><PlayingCard faceDown size="lg" /><PlayingCard faceDown size="lg" /></>
            }
          </View>

          {/* Player info block */}
          <View style={styles.humanInfo}>
            <View style={styles.humanInfoTop}>
              {/* Avatar — gold winner glow, not a badge */}
              <View style={[styles.humanAvatar, {
                borderColor: state.winnerIds.includes('human') ? colors.gold
                  : isHumanTurn ? colors.primary : colors.border,
                shadowColor: state.winnerIds.includes('human') ? colors.gold : colors.primary,
                shadowOpacity: state.winnerIds.includes('human') ? 1 : isHumanTurn ? 0.9 : 0,
                shadowRadius: state.winnerIds.includes('human') ? 16 : 10,
                shadowOffset: { width: 0, height: 0 },
              }]}>
                <Text style={[styles.humanAvatarText, state.winnerIds.includes('human') && { color: colors.gold }]}>♠</Text>
                {humanPlayer.isDealer && (
                  <View style={styles.dealerDot}><Text style={styles.dealerDotText}>D</Text></View>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.humanName, state.winnerIds.includes('human') && { color: colors.gold }]}>
                  {humanPlayer.name}
                </Text>
                <Text style={styles.humanChips}>{formatChips(humanPlayer.chips)}</Text>
              </View>
              {/* Turn timer — right of name */}
              {isHumanTurn && <DotTimer seconds={state.timer} maxSeconds={20} isActive size={8} gap={4} />}
            </View>
            <View style={styles.humanBadgeRow}>
              {humanPlayer.betInRound > 0 && (
                <View style={styles.betChip}>
                  <Text style={styles.betChipText}>{formatChips(humanPlayer.betInRound)}</Text>
                </View>
              )}
              {humanPlayer.lastAction && humanPlayer.lastAction !== 'FOLD' && (
                <View style={[styles.betChip, { borderColor: 'rgba(191,95,255,0.4)', backgroundColor: 'rgba(191,95,255,0.08)' }]}>
                  <Text style={[styles.betChipText, { color: '#bf5fff' }]}>{humanPlayer.lastAction}</Text>
                </View>
              )}
              {humanPlayer.status === 'folded' && (
                <Text style={styles.foldedText}>folded</Text>
              )}
              {humanPlayer.status === 'allIn' && (
                <View style={[styles.betChip, { borderColor: 'rgba(255,0,144,0.4)', backgroundColor: 'rgba(255,0,144,0.08)' }]}>
                  <Text style={[styles.betChipText, { color: colors.secondary }]}>ALL IN</Text>
                </View>
              )}
              {state.winnerIds.includes('human') && (
                <Text style={styles.winnerText}>Winner</Text>
              )}
            </View>
          </View>
        </View>
      )}

      {/* ── Bottom controls ── */}
      {isHandOver ? (
        <View style={[styles.handoverPanel, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 28 : 6) }]}>
          {state.winnerIds.length > 0 && state.winnerPot > 0 && (() => {
            const humanWon = state.winnerIds.includes('human');
            const isSplit = state.isSplitPot;
            const hasSidePots = state.sidePots.length > 1;
            const share = Math.floor(state.winnerPot / Math.max(1, state.winnerIds.length));
            const winnerName = state.players.find(p => state.winnerIds[0] === p.id);
            return (
              <>
                {/* Compact winner line — no heavy banner box */}
                <View style={styles.winnerLine}>
                  <Ionicons name="trophy" size={14} color={humanWon ? colors.gold : colors.textDim} />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={[styles.winnerLineName, humanWon && { color: colors.gold }]}>
                      {humanWon ? 'You won' : `${winnerName?.name ?? 'Opponent'} won`}
                      {!isSplit && <Text style={styles.winnerLineAmt}>  +{formatChips(share)}</Text>}
                    </Text>
                    {state.winnerHand !== '' && (
                      <Text style={styles.winnerLineHand}>{state.winnerHand}</Text>
                    )}
                  </View>
                  {isSplit && (
                    <Text style={styles.splitLabel}>{state.winnerIds.length}-way split</Text>
                  )}
                </View>
                {hasSidePots && (
                  <View style={styles.sidePotHandover}>
                    {state.sidePots.map((sp, i) => (
                      <View key={i} style={styles.sidePotHandoverRow}>
                        <Text style={styles.sidePotHandoverLabel}>{i === 0 ? 'MAIN' : `SIDE ${i}`}</Text>
                        <Text style={styles.sidePotHandoverAmt}>{formatChips(sp.amount)}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            );
          })()}
          {state.showCards && (() => {
            const showdownPlayers = state.players.filter(p => p.status !== 'folded');
            if (showdownPlayers.length < 2 || state.communityCards.length < 3) return null;
            return (
              <View style={styles.showdownPanel}>
                <Text style={styles.showdownPanelTitle}>SHOWDOWN</Text>
                {showdownPlayers.map(p => {
                  const hand = p.holeCards.length === 2 ? getBestHand(p.holeCards, state.communityCards) : null;
                  const isWinner = state.winnerIds.includes(p.id);
                  return (
                    <View key={p.id} style={[styles.showdownRow, isWinner && styles.showdownRowWin]}>
                      {isWinner ? <Ionicons name="trophy" size={9} color={colors.gold} /> : <View style={{ width: 9 }} />}
                      <Text style={[styles.showdownName, isWinner && { color: colors.gold }]}>{p.isHuman ? 'You' : p.name}</Text>
                      <Text style={[styles.showdownHand, isWinner && { color: colors.gold }]} numberOfLines={1}>
                        {hand ? describeHand(hand) : '—'}
                      </Text>
                    </View>
                  );
                })}
              </View>
            );
          })()}
          {/* Chip deltas — minimal, floating */}
          <View style={styles.deltasRow}>
            {state.players.filter(p => p.chipDelta !== 0).map(p => (
              <View key={p.id} style={styles.deltaChip}>
                <Text style={styles.deltaName}>{p.isHuman ? 'You' : p.name}</Text>
                <Text style={[styles.deltaAmt, { color: p.chipDelta > 0 ? colors.success : colors.error }]}>
                  {p.chipDelta > 0 ? '+' : ''}{formatChips(p.chipDelta)}
                </Text>
              </View>
            ))}
          </View>
          {isGameOver ? (
            <TouchableOpacity style={styles.nextBtn} onPress={() => setGameStarted(false)}>
              <Text style={[styles.nextBtnText, { color: colors.text }]}>BACK TO LOBBY</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.nextBtn} onPress={onHandOver} activeOpacity={0.85}>
              <LinearGradient
                colors={['rgba(0,150,180,0.5)', 'rgba(0,100,130,0.6)']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              />
              <Text style={styles.nextBtnText}>Next Hand</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
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
          <Text style={styles.waitingText}>
            {humanPlayer?.status === 'folded' ? 'You folded — watching...'
              : isAllIn ? "You're ALL IN — watching the board run out..."
              : `${currentPlayer?.name ?? 'Opponent'} is thinking...`}
          </Text>
          <View style={styles.waitingActions}>
            {!isHumanTurn && humanPlayer?.status === 'active'
              && state.phase !== 'handover' && state.phase !== 'showdown' && state.phase !== 'idle' && (
              <TouchableOpacity style={styles.skipBtn}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); skipBotTurn(); }}
                activeOpacity={0.75}>
                <Ionicons name="play-skip-forward" size={14} color={colors.textMuted} />
                <Text style={styles.skipText}>SKIP TURN</Text>
              </TouchableOpacity>
            )}
            {showRunItOut && (
              <TouchableOpacity style={[styles.skipBtn, styles.runItOutBtn]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); skipToShowdown(); }}
                activeOpacity={0.75}>
                <Ionicons name="flash" size={14} color={colors.gold} />
                <Text style={[styles.skipText, { color: colors.gold }]}>RUN IT OUT</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
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
  communityArea: { alignItems: 'center', gap: 10 },
  communityCards: { flexDirection: 'row', gap: 8 },
  emptySlot: {
    width: 56, height: 78, borderRadius: 7,
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
  screen: { flex: 1, backgroundColor: colors.background },

  // ── Background atmosphere ──────────────────────────────────────────────────
  gridOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    opacity: 0.018,
    backgroundColor: 'transparent',
  },
  glowLeft: {
    position: 'absolute', top: '30%', left: -90, width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(191,95,255,0.09)',
  },
  glowRight: {
    position: 'absolute', top: '42%', right: -90, width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(0,212,255,0.07)',
  },
  glowCenter: {
    position: 'absolute', top: '30%', left: '20%', right: '20%', height: 160, borderRadius: 80,
    backgroundColor: 'rgba(0,80,40,0.12)',
  },

  // ── Navigation ─────────────────────────────────────────────────────────────
  backBtn: {
    position: 'absolute', left: 12, zIndex: 20,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  fxBtn: {
    position: 'absolute', right: 12, zIndex: 20,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center', justifyContent: 'center',
  },
  fxBtnOn: {
    borderColor: 'rgba(0,212,255,0.45)',
    backgroundColor: 'rgba(0,212,255,0.08)',
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },

  // ── Phase label ────────────────────────────────────────────────────────────
  topBar: { alignItems: 'center', paddingBottom: 0 },
  phaseLabel: {
    color: 'rgba(255,255,255,0.35)', fontSize: 9, fontWeight: '600',
    letterSpacing: 4, fontFamily: 'Orbitron_400Regular',
  },

  // ── Exit modal ─────────────────────────────────────────────────────────────
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

  // ── AI players top row ─────────────────────────────────────────────────────
  aiRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 10, paddingBottom: 4,
  },

  // ── Center game area ───────────────────────────────────────────────────────
  gameCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },

  // Subtle table surface — grounds the community cards
  tableSurface: {
    alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    gap: 10,
  },
  tableEdgeTop: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  tableEdgeBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 1,
    backgroundColor: 'rgba(0,212,255,0.08)',
  },

  // ── Chip animations ────────────────────────────────────────────────────────
  chipToken: {
    position: 'absolute', width: 12, height: 12, borderRadius: 6,
    backgroundColor: colors.primary, borderWidth: 1.5, borderColor: 'rgba(0,212,255,0.7)', zIndex: 20,
  },
  chipTokenWin: {
    position: 'absolute', width: 14, height: 14, borderRadius: 7,
    backgroundColor: colors.gold, borderWidth: 1.5, borderColor: 'rgba(255,215,0,0.8)', zIndex: 20,
  },

  // ── Pot display ────────────────────────────────────────────────────────────
  sidePotRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  sidePotChip: {
    alignItems: 'center', backgroundColor: 'rgba(10,5,20,0.7)',
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,215,0,0.25)',
    paddingHorizontal: 10, paddingVertical: 3,
  },
  sidePotLabel: {
    color: colors.textMuted, fontSize: 7, fontWeight: '700',
    letterSpacing: 1.5, fontFamily: 'Orbitron_400Regular',
  },
  sidePotAmt: { color: colors.gold, fontSize: 13, fontWeight: '800', fontFamily: 'Orbitron_700Bold' },
  potPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(10,5,20,0.75)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.25)',
    paddingHorizontal: 14, paddingVertical: 5,
  },
  potLabel: { color: 'rgba(255,215,0,0.6)', fontSize: 8, fontWeight: '600', letterSpacing: 2, fontFamily: 'Orbitron_400Regular' },
  potAmount: { color: colors.gold, fontSize: 20, fontWeight: '800', fontFamily: 'Orbitron_700Bold', lineHeight: 24 },

  // ── All-in overlay ─────────────────────────────────────────────────────────
  allInOverlay: { alignItems: 'center', gap: 1 },
  allInOverlayTitle: {
    color: colors.secondary, fontSize: 15, fontWeight: '800',
    fontFamily: 'Orbitron_700Bold', letterSpacing: 4,
    textShadowColor: colors.secondary, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 12,
  },
  allInOverlaySub: { color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: '500', letterSpacing: 0.5 },

  // ── Status message ─────────────────────────────────────────────────────────
  messageBox: { alignItems: 'center' },
  messageText: {
    color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '500',
    paddingHorizontal: 12, paddingVertical: 3,
  },

  // ── Human player row ───────────────────────────────────────────────────────
  humanRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 8, gap: 12,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(5,0,20,0.6)',
  },
  humanCards: { flexDirection: 'row', gap: 5 },
  humanInfo: { flex: 1, gap: 4 },
  humanInfoTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  humanAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  humanAvatarText: { fontSize: 17, color: colors.primary },
  dealerDot: {
    position: 'absolute', bottom: -2, right: -2,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center',
  },
  dealerDotText: { fontSize: 7, fontWeight: '900', color: colors.background },
  humanName: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '700' },
  humanChips: { color: colors.gold, fontSize: 11, fontWeight: '600' },
  humanBadgeRow: { flexDirection: 'row', gap: 5, flexWrap: 'wrap', alignItems: 'center' },
  betChip: {
    backgroundColor: 'rgba(0,212,255,0.08)', borderRadius: 6,
    borderWidth: 1, borderColor: 'rgba(0,212,255,0.25)', paddingHorizontal: 7, paddingVertical: 2,
  },
  betChipText: { color: colors.primary, fontSize: 10, fontWeight: '600' },
  foldedText: { color: 'rgba(255,255,255,0.28)', fontSize: 10, fontStyle: 'italic' },
  winnerText: { color: colors.gold, fontSize: 11, fontWeight: '600', fontFamily: 'Orbitron_400Regular', letterSpacing: 1 },

  // ── Side pot in handover ───────────────────────────────────────────────────
  sidePotHandover: { width: '100%', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', overflow: 'hidden' },
  sidePotHandoverRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  sidePotHandoverLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 1, fontFamily: 'Orbitron_400Regular' },
  sidePotHandoverAmt: { color: colors.gold, fontSize: 12, fontWeight: '800', fontFamily: 'Orbitron_700Bold' },

  // ── Handover panel ─────────────────────────────────────────────────────────
  handoverPanel: {
    paddingHorizontal: 16, paddingTop: 6,
    alignItems: 'center', gap: 5,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(5,0,20,0.6)',
  },

  // Compact winner line (replaces heavy winnerBanner)
  winnerLine: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 6, width: '100%',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  winnerLineName: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '700' },
  winnerLineAmt: { color: colors.gold, fontSize: 13, fontWeight: '700' },
  winnerLineHand: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '500', marginTop: 1 },
  splitLabel: { color: colors.primary, fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },

  // Delta chips — minimal floating
  deltasRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, justifyContent: 'center' },
  deltaChip: { alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3 },
  deltaName: { color: 'rgba(255,255,255,0.35)', fontSize: 8, letterSpacing: 0.5 },
  deltaAmt: { fontSize: 11, fontWeight: '700', fontFamily: 'Orbitron_400Regular' },

  // Next hand button — sleek, compact
  nextBtn: {
    borderRadius: 10, overflow: 'hidden',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 8, paddingHorizontal: 20, gap: 6,
    borderWidth: 1, borderColor: 'rgba(0,212,255,0.3)', alignSelf: 'stretch',
  },
  nextBtnText: { color: colors.primary, fontSize: 12, fontWeight: '700', fontFamily: 'Orbitron_400Regular', letterSpacing: 1 },

  // ── Showdown ───────────────────────────────────────────────────────────────
  showdownPanel: { width: '100%', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  showdownPanelTitle: {
    color: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: '700', letterSpacing: 3,
    fontFamily: 'Orbitron_400Regular', textAlign: 'center', paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  showdownRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5,
    gap: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  showdownRowWin: { backgroundColor: 'rgba(255,215,0,0.05)' },
  showdownName: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700', width: 52, fontFamily: 'Orbitron_400Regular' },
  showdownHand: { color: 'rgba(255,255,255,0.4)', fontSize: 10, flex: 1 },

  // ── Waiting / watching panel ───────────────────────────────────────────────
  waitingPanel: {
    paddingHorizontal: 16, paddingTop: 8,
    alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', gap: 6,
    backgroundColor: 'rgba(5,0,20,0.5)',
  },
  waitingText: { color: 'rgba(255,255,255,0.35)', fontSize: 11, textAlign: 'center' },
  waitingActions: { flexDirection: 'row', gap: 10 },
  skipBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 7, paddingHorizontal: 14,
    borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  runItOutBtn: { borderColor: 'rgba(255,215,0,0.3)', backgroundColor: 'rgba(255,215,0,0.05)' },
  skipText: { color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: '600', letterSpacing: 1, fontFamily: 'Orbitron_400Regular' },
});
