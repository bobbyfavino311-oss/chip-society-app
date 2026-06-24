import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Animated, Modal, Platform, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BettingPanel from '@/components/BettingPanel';
import PlayingCard from '@/components/PlayingCard';
import DotTimer from '@/components/DotTimer';
import colors from '@/constants/colors';
import { useUser } from '@/context/UserContext';
import { SoundEngine } from '@/lib/soundEngine';
import { getBestHand, describeHand } from '@/lib/pokerEngine';
import { useLocalSearchParams } from 'expo-router';
import { useTournamentGame, BLIND_LEVELS, Standing, Prize } from '@/hooks/useTournamentGame';
import { TOURNAMENT_CONFIGS, TournamentConfig, TournamentType } from '@/constants/tournaments';
import NeonAvatarSeat from '@/components/NeonAvatar';


const HAND_COLORS: Record<string, string> = {
  'Royal Flush': '#ff0090', 'Straight Flush': '#ff0090', 'Four of a Kind': '#ff0090',
  'Full House': '#bf5fff', 'Flush': '#00d4ff', 'Straight': '#00d4ff',
  'Three of a Kind': '#ffd700', 'Two Pair': '#ffd700', 'One Pair': '#aaaacc', 'High Card': '#666688',
};

function formatChips(n: number): string {
  const v = (x: number) => x % 1 === 0 ? x.toFixed(0) : x.toFixed(1);
  if (n >= 1_000_000_000) return `${v(n / 1_000_000_000)}B`;
  if (n >= 1_000_000)     return `${v(n / 1_000_000)}M`;
  if (n >= 1_000)         return `${v(n / 1_000)}K`;
  return String(n);
}

// ─── Community cards ──────────────────────────────────────────────────────────

function CommunityCards({ cards, holeCards }: { cards: any[]; holeCards: any[] }) {
  const handResult = cards.length > 0 && holeCards.length >= 2
    ? getBestHand(holeCards, cards) : null;
  const handColor = handResult ? (HAND_COLORS[handResult.name] ?? colors.textMuted) : colors.textMuted;
  return (
    <View style={tbl.communityArea}>
      <View style={tbl.communityCards}>
        {[0, 1, 2, 3, 4].map(i =>
          cards[i]
            ? <PlayingCard key={i} card={cards[i]} size="lg" />
            : <View key={i} style={tbl.emptySlot} />
        )}
      </View>
      {handResult && (
        <View style={[tbl.handBadge, { borderColor: handColor }]}>
          <Text style={[tbl.handBadgeText, { color: handColor }]}>
            {handResult.name.toUpperCase()}
          </Text>
        </View>
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
  player, isCurrentTurn, isWinner, timer, showCards,
}: {
  player: any; isCurrentTurn: boolean; isWinner: boolean; timer: number; showCards?: boolean;
}) {
  const folded = player.status === 'folded';
  const avatarId = player.avatarIndex > 0 ? player.avatarIndex : 1;

  return (
    <View style={[g.seat, folded && g.seatFolded]}>
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
      {player.holeCards.length > 0 && !folded && (
        <View style={g.holeCardRow}>
          {player.holeCards.map((card: any, i: number) => (
            <PlayingCard key={i} card={card} faceDown={!showCards} size="sm" animated={false} />
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
    backgroundColor: 'rgba(255,255,255,0.05)',
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
  avatarSymbol: { fontSize: 18, lineHeight: 22 },
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

// ─── Tournament HUD ───────────────────────────────────────────────────────────

function TournamentHUD({ blindLevel, sb, bb, activePlayers, handsPlayed, totalPrizePool, onExit }:
  { blindLevel: number; sb: number; bb: number; activePlayers: number; handsPlayed: number; totalPrizePool: number; onExit: () => void }) {
  return (
    <View style={hud.bar}>
      <TouchableOpacity onPress={onExit} style={hud.backBtn} activeOpacity={0.75}>
        <Ionicons name="chevron-back" size={18} color="rgba(255,255,255,0.55)" />
      </TouchableOpacity>
      <Text style={hud.pill}>
        <Text style={hud.pillDim}>LV </Text>{blindLevel}
        <Text style={hud.pillDim}>  ·  </Text>{sb}/{bb}
        <Text style={hud.pillDim}>  ·  </Text>
        <Text style={{ color: activePlayers <= 2 ? '#ff0090' : 'rgba(255,255,255,0.7)' }}>{activePlayers}</Text>
        <Text style={hud.pillDim}> left  ·  </Text>
        <Text style={{ color: '#ffd700' }}>{formatChips(totalPrizePool)}</Text>
      </Text>
      <Text style={hud.handNum}>#{handsPlayed + 1}</Text>
    </View>
  );
}

// ─── Elimination overlay ──────────────────────────────────────────────────────

function EliminationOverlay({ eliminations, prizes, onDismiss }:
  { eliminations: Standing[]; prizes: Prize[]; onDismiss: () => void }) {
  if (eliminations.length === 0) return null;
  const human = eliminations.find(e => e.isHuman);
  const bots = eliminations.filter(e => !e.isHuman);
  return (
    <Modal transparent visible animationType="fade">
      <View style={elim.overlay}>
        <View style={elim.card}>
          {human ? (
            <>
              <Text style={elim.icon}>💀</Text>
              <Text style={elim.titleBad}>ELIMINATED</Text>
              <Text style={elim.sub}>You finished in {ordinal(human.finishPlace)} place</Text>
              {human.prize > 0 && (
                <View style={elim.prizeRow}>
                  <Ionicons name="trophy" size={16} color={colors.gold} />
                  <Text style={elim.prizeText}>+{formatChips(human.prize)} chips</Text>
                </View>
              )}
            </>
          ) : (
            <>
              <Text style={elim.icon}>🃏</Text>
              <Text style={elim.titleGood}>BUSTED OUT</Text>
              {bots.map(e => (
                <Text key={e.id} style={elim.sub}>{e.name} finished {ordinal(e.finishPlace)}</Text>
              ))}
            </>
          )}
          <TouchableOpacity style={elim.btn} onPress={onDismiss} activeOpacity={0.85}>
            <Text style={elim.btnText}>{human ? 'SEE RESULTS' : 'CONTINUE'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Results screen ───────────────────────────────────────────────────────────

function ResultsScreen({ standings, prizes, myPlace, myPrize, onPlayAgain, onExit }:
  { standings: Standing[]; prizes: Prize[]; myPlace: number | null; myPrize: number | null; onPlayAgain: () => void; onExit: () => void }) {
  const insets = useSafeAreaInsets();
  const sorted = [...standings].sort((a, b) => a.finishPlace - b.finishPlace);
  return (
    <View style={[results.screen, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#1a0040', '#050010', '#050010']} style={StyleSheet.absoluteFill} />
      <View style={results.header}>
        <Text style={results.title}>TOURNAMENT</Text>
        <Text style={results.subtitle}>COMPLETE</Text>
      </View>
      {myPlace !== null && (
        <View style={[results.myResult, { borderColor: myPlace === 1 ? colors.gold : myPlace <= 3 ? colors.accent : colors.border }]}>
          <Text style={[results.myPlace, { color: myPlace === 1 ? colors.gold : myPlace === 2 ? colors.chrome : myPlace === 3 ? '#cd7f32' : colors.textMuted }]}>
            {ordinal(myPlace).toUpperCase()} PLACE
          </Text>
          {(myPrize ?? 0) > 0 ? (
            <Text style={results.myPrize}>+{formatChips(myPrize!)} CHIPS</Text>
          ) : (
            <Text style={[results.myPrize, { color: colors.textMuted, fontSize: 14 }]}>No prize this time</Text>
          )}
        </View>
      )}
      <ScrollView style={results.list} showsVerticalScrollIndicator={false}>
        {sorted.map(s => {
          const prize = prizes.find(p => p.place === s.finishPlace);
          const isFirst = s.finishPlace === 1;
          const isPaid = (prize?.amount ?? 0) > 0;
          return (
            <View key={s.id} style={[results.row, s.isHuman && results.rowHuman]}>
              <Text style={[results.rowPlace, { color: isFirst ? colors.gold : s.finishPlace === 2 ? colors.chrome : s.finishPlace === 3 ? '#cd7f32' : colors.textMuted }]}>
                {isFirst ? '🏆' : ordinal(s.finishPlace)}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={[results.rowName, s.isHuman && { color: colors.primary }]}>
                  {s.name}{s.isHuman ? ' (You)' : ''}
                </Text>
                <Text style={results.rowHand}>Hand #{s.eliminatedOnHand}</Text>
              </View>
              {isPaid && (
                <Text style={[results.rowPrize, { color: isFirst ? colors.gold : colors.accent }]}>
                  +{formatChips(prize!.amount)}
                </Text>
              )}
            </View>
          );
        })}
      </ScrollView>
      <View style={[results.btns, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={results.btnSecondary} onPress={onExit} activeOpacity={0.85}>
          <Text style={results.btnSecondaryText}>LOBBY</Text>
        </TouchableOpacity>
        <TouchableOpacity style={results.btnPrimary} onPress={onPlayAgain} activeOpacity={0.85}>
          <LinearGradient colors={[colors.accent, '#8833cc']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
          <Ionicons name="refresh" size={16} color={colors.text} />
          <Text style={results.btnPrimaryText}>PLAY AGAIN</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ordinal(n: number) {
  if (n === 1) return '1st';
  if (n === 2) return '2nd';
  if (n === 3) return '3rd';
  return `${n}th`;
}

// ─── Lobby ────────────────────────────────────────────────────────────────────

function LobbyScreen({ tConfig, userChips, onStart, prizes }:
  { tConfig: TournamentConfig; userChips: number; onStart: () => void; prizes: Prize[] }) {
  const insets = useSafeAreaInsets();
  const canAfford = userChips >= tConfig.buyIn;
  const handsPerLevel = tConfig.handsPerLevel;
  return (
    <View style={[lobby.screen, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#0d0030', '#050010']} style={StyleSheet.absoluteFill} />
      <TouchableOpacity onPress={() => router.back()} style={lobby.backBtn} activeOpacity={0.75}>
        <Ionicons name="chevron-back" size={20} color={colors.text} />
        <Text style={lobby.backText}>TOURNAMENTS</Text>
      </TouchableOpacity>
      <ScrollView contentContainerStyle={lobby.content} showsVerticalScrollIndicator={false}>
        <View style={[lobby.typeHeader, { borderColor: `${tConfig.color}40` }]}>
          <Ionicons name={tConfig.icon as any} size={28} color={tConfig.color} />
          <Text style={[lobby.title, { color: tConfig.color }]}>{tConfig.name}</Text>
        </View>
        <Text style={lobby.subtitle}>{tConfig.subtitle}</Text>
        <Text style={lobby.description}>{tConfig.description}</Text>

        {/* Buy-in + Balance */}
        <View style={[lobby.buyInCard, !canAfford && lobby.buyInCardError]}>
          <View style={lobby.buyInRow}>
            <Text style={lobby.buyInLabel}>TOURNAMENT BUY-IN</Text>
            <Text style={[lobby.buyInAmt, { color: canAfford ? colors.gold : colors.error }]}>
              {formatChips(tConfig.buyIn)} chips
            </Text>
          </View>
          <View style={lobby.buyInRow}>
            <Text style={lobby.buyInLabel}>YOUR BALANCE</Text>
            <Text style={[lobby.buyInAmt, { color: canAfford ? colors.success : colors.error }]}>
              {formatChips(userChips)} chips
            </Text>
          </View>
          {!canAfford && (
            <Text style={lobby.buyInError}>
              Not enough chips. You need {formatChips(tConfig.buyIn - userChips)} more.
            </Text>
          )}
        </View>

        <View style={lobby.section}>
          <Text style={lobby.sectionLabel}>PRIZE STRUCTURE</Text>
          <View style={lobby.prizeList}>
            {prizes.map(p => (
              <View key={p.place} style={lobby.prizeRow}>
                <Text style={lobby.prizePlace}>{ordinal(p.place).toUpperCase()}</Text>
                <View style={lobby.prizeBar}>
                  <View style={[lobby.prizeBarFill, { width: `${p.pct}%` as any, backgroundColor: p.place === 1 ? colors.gold : p.place === 2 ? colors.chrome : '#cd7f32' }]} />
                </View>
                <Text style={lobby.prizePct}>{p.pct}%</Text>
                <Text style={[lobby.prizeAmt, { color: p.place === 1 ? colors.gold : p.place === 2 ? colors.chrome : '#cd7f32' }]}>
                  {formatChips(p.amount)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={lobby.section}>
          <Text style={lobby.sectionLabel}>BLIND SCHEDULE</Text>
          <View style={lobby.blindsList}>
            {BLIND_LEVELS.map((lvl, i) => (
              <View key={i} style={lobby.blindRow}>
                <Text style={lobby.blindLevel}>LVL {i + 1}</Text>
                <Text style={lobby.blindAmt}>{lvl.sb} / {lvl.bb}</Text>
                <Text style={lobby.blindHands}>~{handsPerLevel} hands each</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={lobby.infoBox}>
          <Ionicons name="information-circle" size={16} color={colors.primary} />
          <Text style={lobby.infoText}>
            {tConfig.numPlayers} players total · {tConfig.numPlayers - 1} AI opponents · Mixed skill levels
          </Text>
        </View>

        <TouchableOpacity
          style={[lobby.startBtn, !canAfford && lobby.startBtnDisabled]}
          onPress={canAfford ? onStart : undefined}
          activeOpacity={canAfford ? 0.85 : 1}
        >
          {canAfford && (
            <LinearGradient colors={[tConfig.color, `${tConfig.color}99`]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
          )}
          <Ionicons name={canAfford ? 'trophy' : 'lock-closed'} size={20} color={canAfford ? colors.background : colors.textDim} />
          <Text style={[lobby.startText, !canAfford && lobby.startTextDisabled]}>
            {canAfford ? `ENTER · ${formatChips(tConfig.buyIn)} CHIPS` : 'NOT ENOUGH CHIPS'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function TournamentScreen() {
  const { profile, recordWin, recordLoss, removeChips, addChips } = useUser();
  const params = useLocalSearchParams<{ type?: string }>();
  const tType = ((params.type as TournamentType) in TOURNAMENT_CONFIGS ? params.type as TournamentType : 'sitandgo');
  const tConfig = TOURNAMENT_CONFIGS[tType];

  const [exitConfirm, setExitConfirm] = useState(false);
  const [humanElimOverlay, setHumanElimOverlay] = useState(false);
  const prizeAwardedRef = useRef(false);

  const {
    gameState: state, tournament,
    startTournament, handleAction, nextHand,
    skipBotTurn, skipToShowdown, clearPendingEliminations,
  } = useTournamentGame(profile.username, tConfig.numPlayers, {
    startingChips: tConfig.startingChips,
    buyIn: tConfig.buyIn,
    handsPerLevel: tConfig.handsPerLevel,
  });

  const insets = useSafeAreaInsets();

  const aiPlayers = state.players.filter(p => !p.isHuman);
  const numAI = aiPlayers.length;

  const seatVec = useMemo(() => {
    if (numAI <= 1) return [{ x: 0, y: -130 }, { x: 0, y: 140 }];
    if (numAI === 2) return [{ x: -140, y: 20 }, { x: 140, y: 20 }, { x: 0, y: 140 }];
    if (numAI === 3) return [{ x: -140, y: 20 }, { x: 0, y: -130 }, { x: 140, y: 20 }, { x: 0, y: 140 }];
    if (numAI === 4) return [{ x: -145, y: 70 }, { x: -90, y: -120 }, { x: 90, y: -120 }, { x: 145, y: 70 }, { x: 0, y: 140 }];
    return [{ x: -145, y: 70 }, { x: -145, y: -60 }, { x: 0, y: -130 }, { x: 145, y: -60 }, { x: 145, y: 70 }, { x: 0, y: 140 }];
  }, [numAI]);

  // Chip fly animations
  const N_CHIP = 4;
  const chipAnims = useRef(Array.from({ length: N_CHIP }, () => ({
    pos: new Animated.ValueXY({ x: 0, y: 0 }),
    opacity: new Animated.Value(0),
  }))).current;
  const winAnims = useRef(Array.from({ length: 6 }, () => ({
    pos: new Animated.ValueXY({ x: 0, y: -20 }),
    opacity: new Animated.Value(0),
  }))).current;
  const potPulse = useRef(new Animated.Value(1)).current;
  const prevPotRef = useRef(0);
  const prevPhaseRef = useRef('');

  useEffect(() => {
    if (state.pot <= prevPotRef.current) return;
    if (state.phase === 'idle' || state.phase === 'handover' || state.phase === 'showdown') { prevPotRef.current = 0; return; }
    const actor = state.players[state.currentPlayerIndex];
    const isHumanActor = actor?.isHuman ?? false;
    let vecIdx = seatVec.length - 1;
    if (!isHumanActor && actor) {
      const aiIdx = aiPlayers.findIndex(p => p.id === actor.id);
      vecIdx = aiIdx >= 0 ? Math.min(aiIdx, seatVec.length - 2) : 0;
    }
    const vec = seatVec[vecIdx];
    chipAnims.forEach(({ pos, opacity }, i) => { pos.setValue({ x: vec.x + (i - N_CHIP / 2 + 0.5) * 12, y: vec.y + (i % 2) * 6 }); opacity.setValue(0); });
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
    SoundEngine.chip();
    prevPotRef.current = state.pot;
  }, [state.pot, state.phase]);

  // Win animation
  useEffect(() => {
    if (state.phase !== 'handover') { prevPhaseRef.current = state.phase; return; }
    if (prevPhaseRef.current === 'handover') return;
    prevPhaseRef.current = 'handover';
    if (state.winnerIds.length === 0) return;
    const isHumanWin = state.winnerIds.includes('human');
    if (isHumanWin) { SoundEngine.win(); } else { SoundEngine.lose(); }
    const winnerId = state.winnerIds[0];
    const aiIdx = isHumanWin ? -1 : aiPlayers.findIndex(p => p.id === winnerId);
    const vecIdx = isHumanWin ? seatVec.length - 1 : Math.min(aiIdx < 0 ? 0 : aiIdx, seatVec.length - 2);
    const target = seatVec[vecIdx];
    winAnims.forEach(({ pos, opacity }) => { pos.setValue({ x: 0, y: -20 }); opacity.setValue(0); });
    Animated.parallel(
      winAnims.map(({ pos, opacity }, i) =>
        Animated.sequence([
          Animated.delay(i * 65 + 180),
          Animated.parallel([
            Animated.timing(opacity, { toValue: 1, duration: 80, useNativeDriver: true }),
            Animated.timing(pos, { toValue: { x: target.x * 0.55, y: target.y * 0.55 }, duration: 400, useNativeDriver: true }),
          ]),
          Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        ])
      )
    ).start();
  }, [state.phase]);

  // Handle elimination notifications
  useEffect(() => {
    if (tournament.pendingEliminations.length === 0) return;
    const humanElim = tournament.pendingEliminations.find(e => e.isHuman);
    if (humanElim) {
      recordLoss();
      setHumanElimOverlay(true);
    }
  }, [tournament.pendingEliminations]);

  // Award prize chips when tournament ends
  useEffect(() => {
    if (tournament.phase !== 'ended') { prizeAwardedRef.current = false; return; }
    if (prizeAwardedRef.current) return;
    prizeAwardedRef.current = true;
    const prize = tournament.myPrize ?? 0;
    const place = tournament.myPlace ?? 99;
    if (prize > 0) {
      if (place === 1) recordWin(prize);
      else addChips(prize);
    }
  }, [tournament.phase, tournament.myPrize, tournament.myPlace]);

  const prizes = useMemo(() => {
    const n = tConfig.numPlayers;
    const pool = n * tConfig.buyIn;
    if (n <= 3) return [
      { place: 1, pct: 70, amount: Math.round(pool * 0.7) },
      { place: 2, pct: 30, amount: Math.round(pool * 0.3) },
    ];
    return [
      { place: 1, pct: 50, amount: Math.round(pool * 0.5) },
      { place: 2, pct: 30, amount: Math.round(pool * 0.3) },
      { place: 3, pct: 20, amount: Math.round(pool * 0.2) },
    ];
  }, [tConfig]);

  const humanPlayer = state.players.find(p => p.isHuman);
  const isHumanTurn = state.players[state.currentPlayerIndex]?.isHuman ?? false;
  const isHandOver = state.phase === 'handover';
  const isHumanEliminated = tournament.phase === 'ended' && (tournament.myPlace ?? 99) > 1;
  const isAllIn = humanPlayer?.status === 'allIn';
  const canCheck = state.currentBet === 0 || (humanPlayer?.betInRound ?? 0) >= state.currentBet;
  const callAmount = Math.min((state.currentBet - (humanPlayer?.betInRound ?? 0)), humanPlayer?.chips ?? 0);
  const showRunItOut = isAllIn && state.phase !== 'idle' && state.phase !== 'handover' && state.phase !== 'showdown';
  const currentPlayer = state.players[state.currentPlayerIndex];

  const onNextHand = () => {
    if (tournament.pendingEliminations.length > 0) { clearPendingEliminations(); return; }
    nextHand();
  };

  // ── Lobby ──────────────────────────────────────────────────────────────────
  if (tournament.phase === 'idle') {
    const onStartWithDeduct = () => { removeChips(tConfig.buyIn); startTournament(); };
    return <LobbyScreen tConfig={tConfig} userChips={profile.chips} onStart={onStartWithDeduct} prizes={prizes} />;
  }

  // ── Results ────────────────────────────────────────────────────────────────
  if (tournament.phase === 'ended' && !tournament.pendingEliminations.some(e => e.isHuman)) {
    return (
      <ResultsScreen
        standings={tournament.standings}
        prizes={tournament.prizes}
        myPlace={tournament.myPlace}
        myPrize={tournament.myPrize}
        onPlayAgain={() => { startTournament(); }}
        onExit={() => router.back()}
      />
    );
  }

  // ── Game table ─────────────────────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      {/* Atmospheric background */}
      <LinearGradient
        colors={['#0a0028', '#05001a', '#030010', '#05001a', '#0a0028']}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.3, y: 0 }} end={{ x: 0.7, y: 1 }}
      />
      {/* Ambient glow blobs */}
      <View style={styles.glowPurple} />
      <View style={styles.glowCyan} />
      <View style={styles.glowCenter} />

      {/* Exit confirmation */}
      <Modal transparent visible={exitConfirm} animationType="fade" onRequestClose={() => setExitConfirm(false)}>
        <View style={styles.exitOverlay}>
          <View style={styles.exitCard}>
            <Text style={styles.exitTitle}>EXIT TOURNAMENT?</Text>
            <Text style={styles.exitSub}>You'll be removed from the tournament.</Text>
            <View style={styles.exitBtns}>
              <TouchableOpacity style={[styles.exitChoiceBtn, styles.exitYes]}
                onPress={() => { setExitConfirm(false); router.back(); }} activeOpacity={0.85}>
                <Text style={styles.exitChoiceText}>YES</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.exitChoiceBtn, styles.exitNo]}
                onPress={() => setExitConfirm(false)} activeOpacity={0.85}>
                <Text style={styles.exitChoiceText}>NO</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Elimination overlays */}
      {tournament.pendingEliminations.length > 0 && !humanElimOverlay && (
        <EliminationOverlay
          eliminations={tournament.pendingEliminations}
          prizes={tournament.prizes}
          onDismiss={() => { clearPendingEliminations(); nextHand(); }}
        />
      )}
      {humanElimOverlay && tournament.pendingEliminations.some(e => e.isHuman) && (
        <EliminationOverlay
          eliminations={tournament.pendingEliminations}
          prizes={tournament.prizes}
          onDismiss={() => { setHumanElimOverlay(false); clearPendingEliminations(); }}
        />
      )}

      {/* Blind level increase banner */}
      {tournament.blindJustIncreased && (
        <View style={styles.blindBanner} pointerEvents="none">
          <Ionicons name="trending-up" size={12} color="#ffd700" />
          <Text style={styles.blindBannerText}>BLINDS UP · {tournament.smallBlind}/{tournament.bigBlind}</Text>
        </View>
      )}

      {/* Tournament HUD — compact */}
      <View style={{ paddingTop: insets.top }}>
        <TournamentHUD
          blindLevel={tournament.blindLevel}
          sb={tournament.smallBlind}
          bb={tournament.bigBlind}
          activePlayers={tournament.activePlayers}
          handsPlayed={tournament.handsPlayed}
          totalPrizePool={tournament.totalPrizePool}
          onExit={() => setExitConfirm(true)}
        />
      </View>

      {/* AI players — minimal */}
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

      {/* Center — cards are the hero */}
      <View style={styles.gameCenter}>
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

        {/* Community card board — dark glass surface */}
        <View style={styles.tableSurface}>
          <View style={styles.tableCenterGlow} />
          <CommunityCards cards={state.communityCards} holeCards={humanPlayer?.holeCards ?? []} />
        </View>

        {/* Floating pot */}
        {state.sidePots.length > 1 ? (
          <Animated.View style={[styles.potFloat, { transform: [{ scale: potPulse }] }]}>
            <View style={styles.potSideRow}>
              {state.sidePots.map((sp, i) => (
                <View key={i} style={styles.potSideItem}>
                  <Text style={styles.potSideLabel}>{i === 0 ? 'MAIN' : `SIDE ${i}`}</Text>
                  <Text style={styles.potSideAmt}>{formatChips(sp.amount)}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        ) : state.pot > 0 ? (
          <Animated.View style={[styles.potFloat, { transform: [{ scale: potPulse }] }]}>
            <Text style={styles.potLabel}>POT</Text>
            <Text style={styles.potAmount}>{formatChips(state.pot)}</Text>
          </Animated.View>
        ) : null}

        {/* Action feed — fades automatically */}
        <ActionFeed message={state.message} isHandOver={isHandOver} />

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
          <View style={styles.humanCards}>
            {humanPlayer.holeCards.length > 0
              ? humanPlayer.holeCards.map((card, i) => (
                  <PlayingCard key={i} card={card} faceDown={false} size="lg" />
                ))
              : <><PlayingCard faceDown size="lg" /><PlayingCard faceDown size="lg" /></>
            }
          </View>
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
        <View style={[styles.handoverPanel, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 28 : 8) }]}>
          {state.winnerIds.length > 0 && state.winnerPot > 0 && (() => {
            const humanWon = state.winnerIds.includes('human');
            const isSplit = (state as any).isSplitPot ?? false;
            const hasSidePots = state.sidePots.length > 1;
            const share = Math.floor(state.winnerPot / Math.max(1, state.winnerIds.length));
            const winnerName = state.players.find(p => state.winnerIds[0] === p.id);
            return (
              <>
                <View style={styles.winnerLine}>
                  <Ionicons name="trophy" size={13} color={humanWon ? '#ffd700' : 'rgba(255,255,255,0.25)'} />
                  <Text style={[styles.winnerLineName, humanWon && { color: '#ffd700' }]}>
                    {'  '}{humanWon ? 'You won' : `${winnerName?.name ?? 'Opponent'} won`}
                    {!isSplit && <Text style={[styles.winnerLineAmt, { color: humanWon ? '#ffd700' : 'rgba(255,255,255,0.5)' }]}>{'  '}+{formatChips(share)}</Text>}
                  </Text>
                  {state.winnerHand !== '' && (
                    <Text style={styles.winnerLineHand}>{state.winnerHand}</Text>
                  )}
                  {isSplit && <Text style={styles.splitLabel}>{'  '}{state.winnerIds.length}-way split</Text>}
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
                {showdownPlayers.map(p => {
                  const hand = p.holeCards.length === 2 ? getBestHand(p.holeCards, state.communityCards) : null;
                  const isWinner = state.winnerIds.includes(p.id);
                  return (
                    <View key={p.id} style={[styles.showdownRow, isWinner && styles.showdownRowWin]}>
                      {isWinner ? <Ionicons name="trophy" size={9} color="#ffd700" /> : <View style={{ width: 9 }} />}
                      <Text style={[styles.showdownName, isWinner && { color: '#ffd700' }]}>{p.isHuman ? 'You' : p.name}</Text>
                      <Text style={[styles.showdownHand, isWinner && { color: '#ffd700' }]} numberOfLines={1}>
                        {hand ? describeHand(hand) : '—'}
                      </Text>
                    </View>
                  );
                })}
              </View>
            );
          })()}
          <View style={styles.deltasRow}>
            {state.players.filter(p => p.chipDelta !== 0).map(p => (
              <View key={p.id} style={styles.deltaChip}>
                <Text style={styles.deltaName}>{p.isHuman ? 'You' : p.name}</Text>
                <Text style={[styles.deltaAmt, { color: p.chipDelta > 0 ? '#00e887' : '#ff5555' }]}>
                  {p.chipDelta > 0 ? '+' : ''}{formatChips(p.chipDelta)}
                </Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.nextBtn} onPress={onNextHand} activeOpacity={0.85}>
            <LinearGradient
              colors={['rgba(0,150,180,0.4)', 'rgba(0,100,130,0.5)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            />
            <Text style={styles.nextBtnText}>Next Hand</Text>
            <Ionicons name="chevron-forward" size={14} color="#00d4ff" />
          </TouchableOpacity>
        </View>
      ) : isHumanTurn ? (
        <View style={{ paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) }}>
          <BettingPanel
            canCheck={canCheck} callAmount={callAmount}
            myChips={humanPlayer?.chips ?? 0} pot={state.pot}
            minRaise={state.minRaise} currentBet={state.currentBet}
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
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const hud = StyleSheet.create({
  bar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 8, gap: 4,
  },
  backBtn: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginRight: 4,
  },
  pill: {
    flex: 1, color: 'rgba(255,255,255,0.7)', fontSize: 11,
    fontWeight: '600', fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  pillDim: { color: 'rgba(255,255,255,0.28)', fontWeight: '400' },
  handNum: {
    color: 'rgba(255,255,255,0.28)', fontSize: 9,
    fontWeight: '600', letterSpacing: 1, fontFamily: 'Orbitron_400Regular',
    minWidth: 32, textAlign: 'right',
  },
});

const tbl = StyleSheet.create({
  communityArea: { alignItems: 'center', gap: 8 },
  communityCards: { flexDirection: 'row', gap: 8 },
  emptySlot: {
    width: 56, height: 78, borderRadius: 7,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    borderStyle: 'dashed', backgroundColor: 'rgba(0,0,0,0.25)',
  },
  handBadge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, borderWidth: 1.5, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', marginTop: 2 },
  handBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 2.5, fontFamily: 'Orbitron_700Bold' },
});

const elim = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(5,0,16,0.85)', alignItems: 'center', justifyContent: 'center' },
  card: { width: 280, backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 32, alignItems: 'center', gap: 10 },
  icon: { fontSize: 40 },
  titleBad: { fontFamily: 'Orbitron_700Bold', fontSize: 22, color: colors.error, letterSpacing: 2 },
  titleGood: { fontFamily: 'Orbitron_700Bold', fontSize: 22, color: colors.secondary, letterSpacing: 2 },
  sub: { color: colors.textMuted, fontSize: 13, textAlign: 'center' },
  prizeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  prizeText: { color: colors.gold, fontSize: 16, fontWeight: '700' },
  btn: { marginTop: 8, backgroundColor: colors.accent, borderRadius: 50, paddingHorizontal: 32, paddingVertical: 13, alignSelf: 'stretch', alignItems: 'center' },
  btnText: { color: colors.text, fontWeight: '800', letterSpacing: 1.5, fontSize: 13 },
});

const results = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { alignItems: 'center', paddingVertical: 24 },
  title: { fontFamily: 'Orbitron_700Bold', fontSize: 28, color: colors.text, letterSpacing: 4 },
  subtitle: { fontFamily: 'Orbitron_700Bold', fontSize: 14, color: colors.accent, letterSpacing: 6, marginTop: 2 },
  myResult: { marginHorizontal: 24, borderRadius: 16, borderWidth: 2, backgroundColor: 'rgba(255,255,255,0.05)', padding: 20, alignItems: 'center', gap: 6, marginBottom: 16 },
  myPlace: { fontFamily: 'Orbitron_700Bold', fontSize: 20, letterSpacing: 3 },
  myPrize: { fontFamily: 'Inter_700Bold', fontSize: 22, color: colors.gold },
  list: { flex: 1, paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderColor: colors.border },
  rowHuman: { backgroundColor: 'rgba(0,212,255,0.05)', borderRadius: 10, paddingHorizontal: 8 },
  rowPlace: { fontSize: 18, fontWeight: '800', width: 36, textAlign: 'center' },
  rowName: { color: colors.text, fontSize: 14, fontWeight: '700' },
  rowHand: { color: colors.textMuted, fontSize: 11, marginTop: 1 },
  rowPrize: { fontFamily: 'Inter_700Bold', fontSize: 14, fontWeight: '800' },
  btns: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 16 },
  btnSecondary: { flex: 1, paddingVertical: 14, borderRadius: 50, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  btnSecondaryText: { color: colors.textMuted, fontWeight: '700', letterSpacing: 1 },
  btnPrimary: { flex: 2, paddingVertical: 14, borderRadius: 50, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, overflow: 'hidden' },
  btnPrimaryText: { color: colors.text, fontWeight: '800', letterSpacing: 1.5 },
});

const lobby = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingVertical: 10 },
  backText: { color: colors.textMuted, fontSize: 12, fontWeight: '600', letterSpacing: 1 },
  content: { padding: 20, gap: 24, paddingBottom: 40 },
  title: { fontFamily: 'Orbitron_900Black', fontSize: 28, color: colors.text, letterSpacing: 4, textAlign: 'center' },
  subtitle: { color: colors.textMuted, fontSize: 13, textAlign: 'center', letterSpacing: 1, marginTop: -18 },
  section: { gap: 10 },
  sectionLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 2.5, fontFamily: 'Orbitron_400Regular' },
  sizeRow: { flexDirection: 'row', gap: 10 },
  sizeBtn: { flex: 1, paddingVertical: 16, borderRadius: 14, alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  sizeBtnActive: { borderColor: colors.accent },
  sizeBtnNum: { fontFamily: 'Orbitron_700Bold', fontSize: 22, color: colors.textMuted },
  sizeBtnLabel: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
  prizeList: { gap: 8 },
  prizeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  prizePlace: { color: colors.textMuted, fontSize: 10, fontWeight: '700', width: 36 },
  prizeBar: { flex: 1, height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
  prizeBarFill: { height: '100%', borderRadius: 3 },
  prizePct: { color: colors.textMuted, fontSize: 11, width: 32, textAlign: 'right' },
  prizeAmt: { fontWeight: '800', fontSize: 13, width: 48, textAlign: 'right' },
  blindsList: { gap: 6 },
  blindRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, borderBottomWidth: 1, borderColor: colors.border },
  blindLevel: { color: colors.accent, fontSize: 10, fontWeight: '700', width: 44 },
  blindAmt: { color: colors.text, fontSize: 13, fontWeight: '700', flex: 1 },
  blindHands: { color: colors.textMuted, fontSize: 10 },
  infoBox: { flexDirection: 'row', gap: 8, backgroundColor: colors.primaryDim, borderRadius: 10, padding: 12, alignItems: 'center' },
  infoText: { color: colors.primary, fontSize: 12, flex: 1, lineHeight: 18 },
  startBtn: { borderRadius: 50, paddingVertical: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, overflow: 'hidden' },
  startText: { color: colors.background, fontFamily: 'Orbitron_700Bold', fontSize: 14, letterSpacing: 2 },
  startTextDisabled: { color: colors.textDim },
  startBtnDisabled: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  typeHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'center',
    borderRadius: 14, borderWidth: 1, padding: 14, backgroundColor: 'rgba(255,255,255,0.03)',
  },
  description: { color: colors.textDim, fontSize: 12, textAlign: 'center', lineHeight: 18 },
  buyInCard: {
    borderRadius: 12, borderWidth: 1, borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.03)', padding: 14, gap: 8,
  },
  buyInCardError: { borderColor: 'rgba(255,68,68,0.4)', backgroundColor: 'rgba(255,68,68,0.06)' },
  buyInRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  buyInLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  buyInAmt: { fontSize: 14, fontWeight: '800', fontFamily: 'Inter_700Bold' },
  buyInError: { color: colors.error, fontSize: 11, textAlign: 'center' },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#050010' },

  // ── Background glows
  glowPurple: {
    position: 'absolute', top: '18%', left: -70, width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(110,0,170,0.07)',
  },
  glowCyan: {
    position: 'absolute', top: '45%', right: -60, width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(0,160,210,0.06)',
  },
  glowCenter: {
    position: 'absolute', top: '25%', left: '10%', right: '10%', height: 220, borderRadius: 110,
    backgroundColor: 'rgba(0,40,25,0.12)',
  },

  // ── AI row
  aiRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 6, paddingVertical: 4,
  },

  // ── Center game area
  gameCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },

  // ── Card board surface
  tableSurface: {
    alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(220,0,210,0.34)',
    backgroundColor: 'rgba(0,0,8,0.52)',
    shadowColor: '#FF00C8', shadowOpacity: 0.22, shadowRadius: 22, shadowOffset: { width: 0, height: 0 },
    overflow: 'hidden',
  },
  tableCenterGlow: {
    position: 'absolute', top: '10%', left: '5%', right: '5%', bottom: '10%',
    borderRadius: 14,
    backgroundColor: 'rgba(0,60,35,0.18)',
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
  humanArea: { alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingBottom: 4 },
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

  // ── Handover panel
  handoverPanel: {
    paddingHorizontal: 14, paddingTop: 10, gap: 8,
  },
  winnerLine: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  winnerLineName: { color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: '600', flex: 1 },
  winnerLineAmt: { fontWeight: '800', fontFamily: 'Inter_700Bold' },
  winnerLineHand: { color: 'rgba(255,255,255,0.3)', fontSize: 11, marginLeft: 16 },
  splitLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 10 },
  sidePotHandover: { width: '100%' },
  sidePotHandoverRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2,
  },
  sidePotHandoverLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  sidePotHandoverAmt: { color: '#ffd700', fontSize: 12, fontWeight: '800', fontFamily: 'Inter_700Bold' },
  showdownPanel: { gap: 3 },
  showdownRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 2 },
  showdownRowWin: {},
  showdownName: { color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: '600', width: 70 },
  showdownHand: { color: 'rgba(255,255,255,0.35)', fontSize: 10, flex: 1 },
  deltasRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  deltaChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  deltaName: { color: 'rgba(255,255,255,0.3)', fontSize: 9 },
  deltaAmt: { fontSize: 11, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderRadius: 10, overflow: 'hidden', paddingVertical: 10,
    backgroundColor: 'rgba(0,120,180,0.12)',
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(0,180,255,0.2)',
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
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  runItOutBtn: { backgroundColor: 'rgba(255,215,0,0.06)' },
  skipText: {
    color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: '600', letterSpacing: 1,
  },

  // ── Tournament-specific
  blindBanner: {
    position: 'absolute', top: 56, alignSelf: 'center', zIndex: 50,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,215,0,0.1)', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)',
    paddingHorizontal: 10, paddingVertical: 4,
  },
  blindBannerText: { color: '#ffd700', fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
});
