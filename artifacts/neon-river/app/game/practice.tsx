import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
import {
  Animated,
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
import { AIDifficulty } from '@/lib/aiBot';
import { usePokerGame } from '@/hooks/usePokerGame';

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
  handover: 'HAND COMPLETE',
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

function SetupScreen({ onStart }: { onStart: (diff: AIDifficulty) => void }) {
  const [selected, setSelected] = useState<AIDifficulty>('casual');
  const insets = useSafeAreaInsets();

  return (
    <View style={[setup.container, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 20) }]}>
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
          const col = DIFFICULTY_COLORS[diff];
          return (
            <TouchableOpacity
              key={diff}
              style={[setup.diffCard, isSelected && { borderColor: col }]}
              onPress={() => { setSelected(diff); Haptics.selectionAsync(); }}
              activeOpacity={0.85}
            >
              {isSelected && (
                <LinearGradient colors={[`${col}22`, 'transparent']} style={StyleSheet.absoluteFill} />
              )}
              <View>
                <Text style={[setup.diffName, isSelected && { color: col }]}>
                  {DIFFICULTY_LABELS[diff].toUpperCase()}
                </Text>
                <Text style={setup.diffDesc}>{getDiffDesc(diff)}</Text>
              </View>
              {isSelected && <Ionicons name="checkmark-circle" size={22} color={col} />}
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity style={setup.startBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); onStart(selected); }}>
          <LinearGradient colors={[colors.primary, '#0088bb']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
          <Ionicons name="flash" size={20} color={colors.background} />
          <Text style={setup.startText}>DEAL CARDS</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ─── Community cards ──────────────────────────────────────────────────────────

function CommunityCards({ cards, phase }: { cards: any[]; phase: string }) {
  return (
    <View style={table.communityArea}>
      <Text style={table.phaseLabel}>{PHASE_LABELS[phase] ?? ''}</Text>
      <View style={table.communityCards}>
        {[0, 1, 2, 3, 4].map(i => (
          <PlayingCard key={i} card={cards[i]} faceDown={!cards[i]} size="md" />
        ))}
      </View>
    </View>
  );
}

// ─── Main game screen ─────────────────────────────────────────────────────────

export default function PracticeScreen() {
  const { profile, recordWin, recordLoss } = useUser();
  const [difficulty, setDifficulty] = useState<AIDifficulty>('casual');
  const [gameStarted, setGameStarted] = useState(false);
  const [handCount, setHandCount] = useState(0);

  const { state, startNewHand, handleAction, skipBotTurn, skipToShowdown, continueAfterHand } = usePokerGame(
    difficulty,
    profile.username,
    profile.chips
  );

  const insets = useSafeAreaInsets();

  // ── Chip-fly animation refs — must be declared before any early return ─────
  const N_CHIP = 4;
  const SEAT_VEC = [
    { x: -145, y: 70 },
    { x: -90, y: -120 },
    { x: 90, y: -120 },
    { x: 145, y: 70 },
    { x: 0, y: 140 },
  ] as const;
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
      vecIdx = aiIdx >= 0 ? Math.min(aiIdx, 3) : 0;
    }
    const vec = SEAT_VEC[vecIdx];
    chipAnims.forEach(({ pos, opacity }, i) => {
      pos.setValue({ x: vec.x + (i - N_CHIP / 2 + 0.5) * 12, y: vec.y + (i % 2) * 6 });
      opacity.setValue(0);
    });
    const anims = chipAnims.map(({ pos, opacity }, i) =>
      Animated.sequence([
        Animated.delay(i * 55),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 80, useNativeDriver: true }),
          Animated.timing(pos, { toValue: { x: (i - N_CHIP / 2 + 0.5) * 4, y: -18 }, duration: 320, useNativeDriver: true }),
        ]),
        Animated.timing(opacity, { toValue: 0, duration: 130, useNativeDriver: true }),
      ])
    );
    Animated.parallel(anims).start();
    Animated.sequence([
      Animated.timing(potPulse, { toValue: 1.3, duration: 110, useNativeDriver: true }),
      Animated.timing(potPulse, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
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
    const vecIdx = isHumanWin ? 4 : Math.min(aiIdx < 0 ? 0 : aiIdx, 3);
    const target = SEAT_VEC[vecIdx];
    winAnims.forEach(({ pos, opacity }) => { pos.setValue({ x: 0, y: -20 }); opacity.setValue(0); });
    const anims = winAnims.map(({ pos, opacity }, i) =>
      Animated.sequence([
        Animated.delay(i * 65 + 180),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 90, useNativeDriver: true }),
          Animated.timing(pos, { toValue: { x: target.x + (i - 2.5) * 16, y: target.y }, duration: 460, useNativeDriver: true }),
        ]),
        Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      ])
    );
    Animated.parallel(anims).start();
    prevPotRef.current = 0;
  }, [state.phase, state.winnerIds]);

  // ── Setup screen (early return — hooks are all above this) ────────────────
  if (!gameStarted) {
    return (
      <SetupScreen
        onStart={diff => {
          setDifficulty(diff);
          setGameStarted(true);
          startNewHand(0);
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
    if (didWin) await recordWin(0);
    else await recordLoss();
    setHandCount(h => h + 1);
    continueAfterHand();
  };

  const seatPositions = [
    { left: 2, top: '56%' },
    { left: 34, top: '6%' },
    { right: 34, top: '6%' },
    { right: 2, top: '56%' },
  ] as const;

  return (
    <View style={styles.screen}>
      <LinearGradient colors={[colors.background, '#050015']} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 8) }]}>
        <TouchableOpacity style={styles.exitBtn} onPress={() => { setGameStarted(false); router.back(); }}>
          <Ionicons name="close" size={22} color={colors.textMuted} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>CHIP SOCIETY</Text>
          <Text style={styles.headerDiff}>{DIFFICULTY_LABELS[difficulty].toUpperCase()}</Text>
        </View>
        <Animated.View style={[styles.potBadge, { transform: [{ scale: potPulse }] }]}>
          <Text style={styles.potLabel}>POT</Text>
          <Text style={styles.potAmount}>{formatChips(state.pot)}</Text>
        </Animated.View>
      </View>

      {/* Table */}
      <View style={styles.tableArea}>
        <LinearGradient
          colors={['#22003a', '#0e1a44', '#001a38', '#0e1a44', '#22003a']}
          style={styles.tableSurface}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Miami neon trim rings */}
          <View style={styles.tableRingOuter} pointerEvents="none" />
          <View style={styles.tableRingInner} pointerEvents="none" />

          <View style={styles.tableInner}>
            {/* Bet chip tokens */}
            {chipAnims.map(({ pos, opacity }, i) => (
              <Animated.View
                key={`chip_${i}`}
                style={[styles.chipToken, { opacity, transform: [{ translateX: pos.x }, { translateY: pos.y }] }]}
                pointerEvents="none"
              />
            ))}
            {/* Win chip tokens */}
            {winAnims.map(({ pos, opacity }, i) => (
              <Animated.View
                key={`win_${i}`}
                style={[styles.chipTokenWin, { opacity, transform: [{ translateX: pos.x }, { translateY: pos.y }] }]}
                pointerEvents="none"
              />
            ))}

            {/* AI Players */}
            {aiPlayers.map((player, i) => {
              const pos = seatPositions[i] ?? { left: 0, top: '50%' };
              const isCurrentSeat = state.players[state.currentPlayerIndex]?.id === player.id;
              const isWinner = state.winnerIds.includes(player.id);
              return (
                <View key={player.id} style={[styles.aiSeat, pos as any]}>
                  <PlayerSeat
                    name={player.name}
                    chips={player.chips}
                    holeCards={player.holeCards}
                    status={isWinner ? 'winner' : player.status}
                    isCurrentTurn={isCurrentSeat}
                    isDealer={player.isDealer}
                    isSmallBlind={player.isSmallBlind}
                    isBigBlind={player.isBigBlind}
                    betInRound={player.betInRound}
                    timer={state.timer}
                    showCards={state.showCards}
                    avatarIndex={player.avatarIndex}
                    isHuman={false}
                  />
                </View>
              );
            })}

            {/* Center: community cards + human hole cards stacked vertically */}
            <View style={styles.centerCol}>
              <CommunityCards cards={state.communityCards} phase={state.phase} />

              {/* Human hole cards — on the table, centered below flop */}
              {humanPlayer && (
                <View style={styles.humanCardsOnTable}>
                  <View style={styles.humanHoleCards}>
                    {humanPlayer.holeCards.length > 0 ? (
                      humanPlayer.holeCards.map((card, i) => (
                        <PlayingCard key={i} card={card} faceDown={false} size="lg" />
                      ))
                    ) : (
                      <>
                        <PlayingCard faceDown size="lg" />
                        <PlayingCard faceDown size="lg" />
                      </>
                    )}
                  </View>
                  {/* Status overlays */}
                  {humanPlayer.status === 'folded' && (
                    <View style={styles.statusBadge}>
                      <Text style={[styles.statusText, { color: colors.error }]}>FOLDED</Text>
                    </View>
                  )}
                  {humanPlayer.status === 'allIn' && (
                    <View style={[styles.statusBadge, { backgroundColor: 'rgba(255,0,144,0.2)', borderColor: colors.secondary }]}>
                      <Text style={[styles.statusText, { color: colors.secondary }]}>ALL IN</Text>
                    </View>
                  )}
                  {state.winnerIds.includes('human') && (
                    <View style={[styles.statusBadge, { backgroundColor: 'rgba(255,215,0,0.2)', borderColor: colors.gold }]}>
                      <Text style={[styles.statusText, { color: colors.gold, fontSize: 14 }]}>WINNER!</Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Action message */}
            {state.message !== '' && (
              <View style={styles.messageBox}>
                <Text style={styles.messageText}>{state.message}</Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* Player info strip — name bottom-left, timer right */}
        {humanPlayer && (
          <View style={styles.playerStrip}>
            <View style={styles.playerStripLeft}>
              <View style={[styles.humanAvatar, { borderColor: isHumanTurn ? colors.primary : colors.border }]}>
                <Text style={styles.humanAvatarText}>♠</Text>
                {humanPlayer.isDealer && (
                  <View style={styles.dealerDot}><Text style={styles.dealerDotText}>D</Text></View>
                )}
              </View>
              <View>
                <Text style={styles.humanName}>{humanPlayer.name}</Text>
                <Text style={styles.humanChips}>{formatChips(humanPlayer.chips)}</Text>
              </View>
              {humanPlayer.betInRound > 0 && (
                <View style={styles.betChip}>
                  <Text style={styles.betChipText}>{formatChips(humanPlayer.betInRound)}</Text>
                </View>
              )}
            </View>
            {isHumanTurn && (
              <DotTimer seconds={state.timer} maxSeconds={30} isActive size={9} gap={5} />
            )}
          </View>
        )}
      </View>

      {/* Bottom panel */}
      {isHandOver ? (
        <View style={[styles.handoverPanel, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 8) }]}>
          <LinearGradient
            colors={['rgba(5,0,16,0)', 'rgba(5,0,16,0.98)']}
            style={StyleSheet.absoluteFill}
          />
          {/* Winner banner */}
          {state.winnerIds.length > 0 && state.winnerPot > 0 && (
            <View style={styles.winnerBanner}>
              <Ionicons name="trophy" size={18} color={colors.gold} />
              <Text style={styles.winnerBannerPot}>{formatChips(state.winnerPot)}</Text>
              <Text style={styles.winnerBannerLabel}>CHIPS WON</Text>
            </View>
          )}
          <Text style={styles.handoverMsg}>{state.message || 'Hand complete!'}</Text>
          {state.winnerHand !== '' && (
            <Text style={styles.handoverHand}>{state.winnerHand}</Text>
          )}
          {/* Per-player chip delta */}
          <View style={styles.deltasRow}>
            {state.players
              .filter(p => p.chipDelta !== 0)
              .map(p => (
                <View key={p.id} style={styles.deltaChip}>
                  <Text style={styles.deltaName}>{p.isHuman ? 'You' : p.name}</Text>
                  <Text style={[
                    styles.deltaAmt,
                    { color: p.chipDelta > 0 ? colors.success : colors.error }
                  ]}>
                    {p.chipDelta > 0 ? '+' : ''}{formatChips(p.chipDelta)}
                  </Text>
                </View>
              ))
            }
          </View>

          {isGameOver ? (
            <TouchableOpacity style={styles.nextBtn} onPress={() => setGameStarted(false)}>
              <Text style={[styles.nextBtnText, { color: colors.text }]}>BACK TO LOBBY</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.nextBtn} onPress={onHandOver} activeOpacity={0.85}>
              <LinearGradient
                colors={[colors.primary, '#0088bb']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
              <Ionicons name="play" size={16} color={colors.background} />
              <Text style={styles.nextBtnText}>NEXT HAND  #{handCount + 2}</Text>
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
            onFold={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); handleAction('fold'); }}
            onCheck={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleAction('check'); }}
            onCall={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); handleAction('call'); }}
            onRaise={amt => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); handleAction('raise', amt); }}
            onAllIn={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); handleAction('allin'); }}
          />
        </View>
      ) : (
        <View style={[styles.waitingPanel, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 8) }]}>
          <Text style={styles.waitingText}>
            {humanPlayer?.status === 'folded'
              ? 'You folded — watching...'
              : isAllIn
              ? "You're ALL IN — watching the board run out..."
              : `${currentPlayer?.name ?? 'Opponent'} is thinking...`}
          </Text>
          <View style={styles.waitingActions}>
            {/* Skip single bot turn (when it's an AI's turn and human is still active/waiting) */}
            {!isHumanTurn
              && humanPlayer?.status === 'active'
              && state.phase !== 'handover'
              && state.phase !== 'showdown'
              && state.phase !== 'idle' && (
              <TouchableOpacity
                style={styles.skipBtn}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); skipBotTurn(); }}
                activeOpacity={0.75}
              >
                <Ionicons name="play-skip-forward" size={14} color={colors.textMuted} />
                <Text style={styles.skipText}>SKIP TURN</Text>
              </TouchableOpacity>
            )}

            {/* Run it out / Skip to showdown (when human is all-in) */}
            {showRunItOut && (
              <TouchableOpacity
                style={[styles.skipBtn, styles.runItOutBtn]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); skipToShowdown(); }}
                activeOpacity={0.75}
              >
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
});

const table = StyleSheet.create({
  communityArea: { alignItems: 'center', gap: 4 },
  phaseLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 2 },
  communityCards: { flexDirection: 'row', gap: 4 },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  exitBtn: { padding: 8 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: colors.primary, fontSize: 14, fontWeight: '800', fontFamily: 'Orbitron_700Bold', letterSpacing: 3 },
  headerDiff: { color: colors.textDim, fontSize: 9, letterSpacing: 1, marginTop: 1 },
  potBadge: { alignItems: 'center' },
  potLabel: { color: colors.textDim, fontSize: 8, letterSpacing: 1 },
  potAmount: { color: colors.gold, fontSize: 16, fontWeight: '700', fontFamily: 'Orbitron_700Bold' },

  tableArea: { flex: 1 },
  tableSurface: {
    flex: 1, margin: 8, borderRadius: 60, overflow: 'hidden',
    borderWidth: 3, borderColor: '#cc0088',
  },
  tableRingOuter: {
    position: 'absolute', top: 6, left: 6, right: 6, bottom: 6,
    borderRadius: 56, borderWidth: 1.5, borderColor: 'rgba(204,0,136,0.35)',
  },
  tableRingInner: {
    position: 'absolute', top: 18, left: 18, right: 18, bottom: 18,
    borderRadius: 48, borderWidth: 1, borderColor: 'rgba(0,212,255,0.18)',
  },
  tableInner: { flex: 1, position: 'relative', alignItems: 'center', justifyContent: 'center' },

  chipToken: {
    position: 'absolute',
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: colors.primary,
    borderWidth: 2, borderColor: 'rgba(0,212,255,0.6)',
    zIndex: 20,
  },
  chipTokenWin: {
    position: 'absolute',
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: colors.gold,
    borderWidth: 2, borderColor: 'rgba(255,215,0,0.7)',
    zIndex: 20,
  },

  aiSeat: { position: 'absolute' },

  // Center column: community cards on top, human hole cards directly below
  centerCol: {
    alignItems: 'center',
    gap: 16,
  },

  // Human cards on the table (below community cards)
  humanCardsOnTable: {
    alignItems: 'center',
    gap: 6,
  },
  humanHoleCards: {
    flexDirection: 'row',
    gap: 8,
  },

  statusBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: 'rgba(255,68,68,0.2)',
    borderRadius: 8, borderWidth: 1, borderColor: colors.error,
    marginTop: 4,
  },
  statusText: {
    color: colors.error, fontSize: 11, fontWeight: '800', letterSpacing: 1,
  },

  messageBox: {
    position: 'absolute', bottom: 12, left: 0, right: 0, alignItems: 'center',
  },
  messageText: {
    color: colors.textMuted, fontSize: 11, fontWeight: '600',
    backgroundColor: 'rgba(5,0,16,0.75)',
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 20, overflow: 'hidden',
  },

  // Bottom strip inside tableArea — name left, timer right
  playerStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(37,0,74,0.6)',
    backgroundColor: 'rgba(5,0,16,0.6)',
  },
  playerStripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  humanAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.surface, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  humanAvatarText: { fontSize: 18, color: colors.primary },
  dealerDot: {
    position: 'absolute', bottom: -2, right: -2,
    width: 15, height: 15, borderRadius: 8,
    backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center',
  },
  dealerDotText: { fontSize: 8, fontWeight: '800', color: colors.background },
  humanName: { color: colors.text, fontSize: 13, fontWeight: '700' },
  humanChips: { color: colors.gold, fontSize: 12, fontWeight: '700' },
  betChip: {
    backgroundColor: 'rgba(0,212,255,0.12)', borderRadius: 8,
    borderWidth: 1, borderColor: colors.primaryDim,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  betChipText: { color: colors.primary, fontSize: 10, fontWeight: '700' },

  // Handover panel
  handoverPanel: {
    paddingHorizontal: 20, paddingTop: 12,
    alignItems: 'center', gap: 8, position: 'relative',
  },
  winnerBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,215,0,0.1)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)',
    paddingHorizontal: 16, paddingVertical: 8,
  },
  winnerBannerPot: { color: colors.gold, fontSize: 24, fontWeight: '800', fontFamily: 'Orbitron_700Bold' },
  winnerBannerLabel: { color: colors.gold, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  handoverMsg: { color: colors.text, fontSize: 15, fontWeight: '700', textAlign: 'center' },
  handoverHand: { color: colors.gold, fontSize: 16, fontWeight: '800', fontFamily: 'Orbitron_700Bold', textAlign: 'center' },
  deltasRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  deltaChip: {
    alignItems: 'center', backgroundColor: colors.surface, borderRadius: 8,
    borderWidth: 1, borderColor: colors.border, paddingHorizontal: 10, paddingVertical: 5,
  },
  deltaName: { color: colors.textDim, fontSize: 9, letterSpacing: 0.5 },
  deltaAmt: { fontSize: 13, fontWeight: '800', fontFamily: 'Orbitron_700Bold' },
  nextBtn: {
    borderRadius: colors.radius, overflow: 'hidden',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 15, paddingHorizontal: 32, gap: 10,
    borderWidth: 1, borderColor: colors.border, width: '100%',
  },
  nextBtnText: { color: colors.background, fontSize: 14, fontWeight: '800', fontFamily: 'Orbitron_700Bold', letterSpacing: 1 },

  // Waiting / watching panel
  waitingPanel: {
    paddingHorizontal: 20, paddingTop: 12,
    alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, gap: 10,
  },
  waitingText: { color: colors.textMuted, fontSize: 13, fontStyle: 'italic', textAlign: 'center' },
  waitingActions: { flexDirection: 'row', gap: 10 },
  skipBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 16,
    borderRadius: 20, borderWidth: 1, borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  runItOutBtn: {
    borderColor: 'rgba(255,215,0,0.4)',
    backgroundColor: 'rgba(255,215,0,0.07)',
  },
  skipText: { color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, fontFamily: 'Orbitron_400Regular' },
});
