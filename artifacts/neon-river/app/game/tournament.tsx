import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Animated, Dimensions, Modal, Platform, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BettingPanel from '@/components/BettingPanel';
import PlayingCard from '@/components/PlayingCard';
import PlayerSeat from '@/components/PlayerSeat';
import DotTimer from '@/components/DotTimer';
import colors from '@/constants/colors';
import { useUser } from '@/context/UserContext';
import { SoundEngine } from '@/lib/soundEngine';
import { getBestHand } from '@/lib/pokerEngine';
import { useTournamentGame, BLIND_LEVELS, Standing, Prize } from '@/hooks/useTournamentGame';

const { width } = Dimensions.get('window');
const SEAT_CX = Math.round(width / 2 - 36);

const HAND_COLORS: Record<string, string> = {
  'Royal Flush': '#ff0090', 'Straight Flush': '#ff0090', 'Four of a Kind': '#ff0090',
  'Full House': '#bf5fff', 'Flush': '#00d4ff', 'Straight': '#00d4ff',
  'Three of a Kind': '#ffd700', 'Two Pair': '#ffd700', 'One Pair': '#aaaacc', 'High Card': '#666688',
};

function formatChips(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
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
            ? <PlayingCard key={i} card={cards[i]} size="xl" />
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

// ─── Tournament HUD ───────────────────────────────────────────────────────────

function TournamentHUD({ blindLevel, sb, bb, activePlayers, handsPlayed, totalPrizePool, onExit }:
  { blindLevel: number; sb: number; bb: number; activePlayers: number; handsPlayed: number; totalPrizePool: number; onExit: () => void }) {
  return (
    <View style={hud.bar}>
      <TouchableOpacity onPress={onExit} style={hud.backBtn} activeOpacity={0.75}>
        <Ionicons name="chevron-back" size={18} color={colors.text} />
      </TouchableOpacity>
      <View style={hud.segment}>
        <Text style={hud.label}>LEVEL</Text>
        <Text style={hud.value}>{blindLevel}</Text>
      </View>
      <View style={hud.divider} />
      <View style={hud.segment}>
        <Text style={hud.label}>BLINDS</Text>
        <Text style={hud.value}>{sb}/{bb}</Text>
      </View>
      <View style={hud.divider} />
      <View style={hud.segment}>
        <Text style={hud.label}>LEFT</Text>
        <Text style={[hud.value, { color: activePlayers <= 2 ? colors.secondary : colors.primary }]}>{activePlayers}</Text>
      </View>
      <View style={hud.divider} />
      <View style={hud.segment}>
        <Text style={hud.label}>HAND</Text>
        <Text style={hud.value}>#{handsPlayed + 1}</Text>
      </View>
      <View style={hud.divider} />
      <View style={hud.segment}>
        <Text style={hud.label}>PRIZE</Text>
        <Text style={[hud.value, { color: colors.gold }]}>{formatChips(totalPrizePool)}</Text>
      </View>
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

function LobbyScreen({ numPlayers, setNumPlayers, onStart, prizes }:
  { numPlayers: 4 | 5 | 6; setNumPlayers: (n: 4 | 5 | 6) => void; onStart: () => void; prizes: Prize[] }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[lobby.screen, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#0d0030', '#050010']} style={StyleSheet.absoluteFill} />
      <TouchableOpacity onPress={() => router.back()} style={lobby.backBtn} activeOpacity={0.75}>
        <Ionicons name="chevron-back" size={20} color={colors.text} />
        <Text style={lobby.backText}>TOURNAMENTS</Text>
      </TouchableOpacity>
      <ScrollView contentContainerStyle={lobby.content} showsVerticalScrollIndicator={false}>
        <Text style={lobby.title}>AI TOURNAMENT</Text>
        <Text style={lobby.subtitle}>Texas Hold'em · Single Table</Text>

        <View style={lobby.section}>
          <Text style={lobby.sectionLabel}>TABLE SIZE</Text>
          <View style={lobby.sizeRow}>
            {([4, 5, 6] as const).map(n => (
              <TouchableOpacity
                key={n} style={[lobby.sizeBtn, numPlayers === n && lobby.sizeBtnActive]}
                onPress={() => setNumPlayers(n)} activeOpacity={0.8}
              >
                {numPlayers === n && (
                  <LinearGradient colors={[colors.accent, '#8833cc']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                )}
                <Text style={[lobby.sizeBtnNum, numPlayers === n && { color: colors.text }]}>{n}</Text>
                <Text style={[lobby.sizeBtnLabel, numPlayers === n && { color: 'rgba(255,255,255,0.8)' }]}>players</Text>
              </TouchableOpacity>
            ))}
          </View>
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
                <Text style={lobby.blindHands}>hands {i * 4 + 1}–{(i + 1) * 4}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={lobby.infoBox}>
          <Ionicons name="information-circle" size={16} color={colors.primary} />
          <Text style={lobby.infoText}>Buy-in: 1,500 chips · All AI opponents have mixed difficulty levels</Text>
        </View>

        <TouchableOpacity style={lobby.startBtn} onPress={onStart} activeOpacity={0.85}>
          <LinearGradient colors={[colors.accent, '#8833cc']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
          <Ionicons name="trophy" size={20} color={colors.text} />
          <Text style={lobby.startText}>START TOURNAMENT</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function TournamentScreen() {
  const { profile, recordWin, recordLoss } = useUser();
  const [numPlayers, setNumPlayers] = useState<4 | 5 | 6>(6);
  const [exitConfirm, setExitConfirm] = useState(false);
  const [humanElimOverlay, setHumanElimOverlay] = useState(false);

  const {
    gameState: state, tournament,
    startTournament, handleAction, nextHand,
    skipBotTurn, skipToShowdown, clearPendingEliminations,
  } = useTournamentGame(profile.username, numPlayers);

  const insets = useSafeAreaInsets();

  // Dynamic seat layout based on active AI count
  const aiPlayers = state.players.filter(p => !p.isHuman);
  const numAI = aiPlayers.length;

  const seatPositions = useMemo((): { [k: number]: object } => {
    if (numAI <= 1) return { 0: { left: SEAT_CX, top: '3%' } };
    if (numAI === 2) return { 0: { left: 6, top: '26%' }, 1: { right: 6, top: '26%' } };
    if (numAI === 3) return { 0: { left: 6, top: '26%' }, 1: { left: SEAT_CX, top: '3%' }, 2: { right: 6, top: '26%' } };
    if (numAI === 4) return { 0: { left: 6, bottom: '8%' }, 1: { left: 6, top: '26%' }, 2: { right: 6, top: '26%' }, 3: { right: 6, bottom: '8%' } };
    return { 0: { left: 6, bottom: '8%' }, 1: { left: 6, top: '26%' }, 2: { left: SEAT_CX, top: '3%' }, 3: { right: 6, top: '26%' }, 4: { right: 6, bottom: '8%' } };
  }, [numAI]);

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

  const prizes = useMemo(() => {
    if (numPlayers <= 3) return [
      { place: 1, pct: 60, amount: Math.round(numPlayers * 1500 * 0.6) },
      { place: 2, pct: 40, amount: Math.round(numPlayers * 1500 * 0.4) },
    ];
    return [
      { place: 1, pct: 50, amount: Math.round(numPlayers * 1500 * 0.5) },
      { place: 2, pct: 30, amount: Math.round(numPlayers * 1500 * 0.3) },
      { place: 3, pct: 20, amount: Math.round(numPlayers * 1500 * 0.2) },
    ];
  }, [numPlayers]);

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
    return <LobbyScreen numPlayers={numPlayers} setNumPlayers={setNumPlayers} onStart={startTournament} prizes={prizes} />;
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

      {/* Elimination overlay */}
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
          <Ionicons name="trending-up" size={14} color={colors.gold} />
          <Text style={styles.blindBannerText}>BLINDS UP · {tournament.smallBlind}/{tournament.bigBlind}</Text>
        </View>
      )}

      {/* Tournament HUD */}
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

      {/* Table */}
      <View style={styles.tableArea}>
        <LinearGradient
          colors={['#22003a', '#0e1a44', '#001a38', '#0e1a44', '#22003a']}
          style={styles.tableSurface}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.tableInner}>
            {chipAnims.map(({ pos, opacity }, i) => (
              <Animated.View key={`chip_${i}`} style={[styles.chipToken, { opacity, transform: [{ translateX: pos.x }, { translateY: pos.y }] }]} pointerEvents="none" />
            ))}
            {winAnims.map(({ pos, opacity }, i) => (
              <Animated.View key={`win_${i}`} style={[styles.chipTokenWin, { opacity, transform: [{ translateX: pos.x }, { translateY: pos.y }] }]} pointerEvents="none" />
            ))}

            {/* AI seats */}
            {aiPlayers.map((player, i) => {
              const pos = seatPositions[i] ?? { left: 0, top: '50%' };
              const isCurrentSeat = state.players[state.currentPlayerIndex]?.id === player.id;
              const isWinner = state.winnerIds.includes(player.id);
              return (
                <View key={player.id} style={[styles.aiSeat, pos as any]}>
                  <PlayerSeat
                    name={player.name} chips={player.chips} holeCards={player.holeCards}
                    status={isWinner ? 'winner' : player.status}
                    isCurrentTurn={isCurrentSeat} isDealer={player.isDealer}
                    isSmallBlind={player.isSmallBlind} isBigBlind={player.isBigBlind}
                    betInRound={player.betInRound} timer={state.timer}
                    showCards={state.showCards} avatarIndex={player.avatarIndex} isHuman={false}
                  />
                </View>
              );
            })}

            {/* Center column */}
            <View style={styles.centerCol}>
              {(state.pot > 0 || state.winnerPot > 0) && (
                state.sidePots.length > 1 ? (
                  <Animated.View style={[styles.sidePotRow, { transform: [{ scale: potPulse }] }]}>
                    {state.sidePots.map((sp, i) => (
                      <View key={i} style={styles.sidePotChip}>
                        <Text style={styles.sidePotLabel}>{i === 0 ? 'MAIN' : `SIDE ${i}`}</Text>
                        <Text style={styles.sidePotAmt}>{formatChips(sp.amount)}</Text>
                      </View>
                    ))}
                  </Animated.View>
                ) : (
                  <Animated.View style={[styles.potOnTable, { transform: [{ scale: potPulse }] }]}>
                    <Text style={styles.potOnTableLabel}>POT</Text>
                    <Text style={styles.potOnTableAmount}>{formatChips(state.pot > 0 ? state.pot : state.winnerPot)}</Text>
                  </Animated.View>
                )
              )}
              <CommunityCards cards={state.communityCards} holeCards={humanPlayer?.holeCards ?? []} />

              {humanPlayer && (
                <View style={styles.humanCardsOnTable}>
                  <View style={styles.humanHoleCards}>
                    {humanPlayer.holeCards.length > 0
                      ? humanPlayer.holeCards.map((card, i) => <PlayingCard key={i} card={card} faceDown={false} size="xl" />)
                      : <><PlayingCard faceDown size="xl" /><PlayingCard faceDown size="xl" /></>
                    }
                  </View>
                  {humanPlayer.status === 'folded' && (
                    <View style={styles.statusBadge}><Text style={[styles.statusText, { color: colors.error }]}>FOLDED</Text></View>
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

            {/* All-in runout */}
            {(() => {
              const nonFolded = state.players.filter(p => p.status !== 'folded');
              const allAllIn = nonFolded.length >= 2 && nonFolded.every(p => p.status === 'allIn');
              if (!allAllIn || isHandOver) return null;
              return (
                <View style={styles.allInOverlay}>
                  <Text style={styles.allInOverlayTitle}>ALL IN!</Text>
                  <Text style={styles.allInOverlaySub}>Running out the board…</Text>
                </View>
              );
            })()}

            {state.message !== '' && !isHandOver && (
              <View style={styles.messageBox}><Text style={styles.messageText}>{state.message}</Text></View>
            )}
          </View>
        </LinearGradient>

        {humanPlayer && (
          <View style={styles.playerStrip}>
            <View style={styles.playerStripLeft}>
              <View style={[styles.humanAvatar, { borderColor: isHumanTurn ? colors.primary : colors.border }]}>
                <Text style={styles.humanAvatarText}>♠</Text>
                {humanPlayer.isDealer && <View style={styles.dealerDot}><Text style={styles.dealerDotText}>D</Text></View>}
              </View>
              <View>
                <Text style={styles.humanName}>{humanPlayer.name}</Text>
                <Text style={styles.humanChips}>{formatChips(humanPlayer.chips)}</Text>
              </View>
              {humanPlayer.betInRound > 0 && (
                <View style={styles.betChip}><Text style={styles.betChipText}>{formatChips(humanPlayer.betInRound)}</Text></View>
              )}
            </View>
            {isHumanTurn && <DotTimer seconds={state.timer} maxSeconds={20} isActive size={9} gap={5} />}
          </View>
        )}
      </View>

      {/* Bottom panel */}
      {isHandOver ? (
        <View style={[styles.handoverPanel, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 8) }]}>
          <LinearGradient colors={['rgba(5,0,16,0)', 'rgba(5,0,16,0.98)']} style={StyleSheet.absoluteFill} />
          {state.winnerIds.length > 0 && state.winnerPot > 0 && (() => {
            const humanWon = state.winnerIds.includes('human');
            const share = Math.floor(state.winnerPot / Math.max(1, state.winnerIds.length));
            return (
              <View style={[styles.winnerBanner, humanWon && styles.winnerBannerHuman]}>
                <Ionicons name="trophy" size={20} color={humanWon ? colors.gold : colors.textDim} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.handoverMsg, humanWon && { color: colors.gold, fontSize: 18 }]}>{state.message || 'Hand complete!'}</Text>
                  {state.winnerHand !== '' && <Text style={styles.handoverHand}>{state.winnerHand}</Text>}
                </View>
                <View style={styles.potWonBadge}>
                  <Text style={[styles.potWonAmt, humanWon && { color: colors.gold }]}>+{formatChips(share)}</Text>
                  <Text style={styles.winnerBannerLabel}>CHIPS</Text>
                </View>
              </View>
            );
          })()}
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
          <TouchableOpacity style={styles.nextBtn} onPress={onNextHand} activeOpacity={0.85}>
            <LinearGradient colors={[colors.accent, '#8833cc']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
            <Ionicons name="play" size={16} color={colors.text} />
            <Text style={styles.nextBtnText}>NEXT HAND</Text>
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
          <Text style={styles.waitingText}>
            {humanPlayer?.status === 'folded' ? 'You folded — watching...'
              : isAllIn ? "You're ALL IN — watching the board run out..."
              : `${currentPlayer?.name ?? 'Opponent'} is thinking...`}
          </Text>
          <View style={styles.waitingActions}>
            {!isHumanTurn && humanPlayer?.status === 'active' && state.phase !== 'handover' && state.phase !== 'showdown' && state.phase !== 'idle' && (
              <TouchableOpacity style={styles.skipBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); skipBotTurn(); }} activeOpacity={0.75}>
                <Ionicons name="play-skip-forward" size={14} color={colors.textMuted} />
                <Text style={styles.skipText}>SKIP TURN</Text>
              </TouchableOpacity>
            )}
            {showRunItOut && (
              <TouchableOpacity style={[styles.skipBtn, styles.runItOutBtn]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); skipToShowdown(); }} activeOpacity={0.75}>
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

const hud = StyleSheet.create({
  bar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(10,0,30,0.95)',
    borderBottomWidth: 1, borderColor: colors.border,
    paddingHorizontal: 4, paddingVertical: 8,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center', marginRight: 4,
  },
  segment: { flex: 1, alignItems: 'center' },
  label: { color: colors.textMuted, fontSize: 8, fontWeight: '700', letterSpacing: 1 },
  value: { color: colors.text, fontSize: 11, fontWeight: '800', fontFamily: 'Orbitron_700Bold', marginTop: 1 },
  divider: { width: 1, height: 24, backgroundColor: colors.border },
});

const tbl = StyleSheet.create({
  communityArea: { alignItems: 'center', gap: 8 },
  communityCards: { flexDirection: 'row', gap: 6 },
  emptySlot: { width: 70, height: 98, borderRadius: 9, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)', borderStyle: 'dashed', backgroundColor: 'rgba(255,255,255,0.03)' },
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
  myPrize: { fontFamily: 'Orbitron_700Bold', fontSize: 22, color: colors.gold },
  list: { flex: 1, paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderColor: colors.border },
  rowHuman: { backgroundColor: 'rgba(0,212,255,0.05)', borderRadius: 10, paddingHorizontal: 8 },
  rowPlace: { fontSize: 18, fontWeight: '800', width: 36, textAlign: 'center' },
  rowName: { color: colors.text, fontSize: 14, fontWeight: '700' },
  rowHand: { color: colors.textMuted, fontSize: 11, marginTop: 1 },
  rowPrize: { fontFamily: 'Orbitron_700Bold', fontSize: 14, fontWeight: '800' },
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
  startText: { color: colors.text, fontFamily: 'Orbitron_700Bold', fontSize: 14, letterSpacing: 2 },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  tableArea: { flex: 1 },
  tableSurface: { flex: 1, margin: 8, borderRadius: 60, overflow: 'hidden', borderWidth: 3, borderColor: '#cc0088' },
  tableInner: { flex: 1, position: 'relative', alignItems: 'center', justifyContent: 'center', paddingBottom: '18%' },
  aiSeat: { position: 'absolute' },
  centerCol: { alignItems: 'center', gap: 16 },
  humanCardsOnTable: { alignItems: 'center', gap: 6 },
  humanHoleCards: { flexDirection: 'row', gap: 8 },
  statusBadge: { position: 'absolute', bottom: -10, alignSelf: 'center', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, backgroundColor: 'rgba(255,68,68,0.15)', borderWidth: 1, borderColor: colors.error },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  potOnTable: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)', alignItems: 'center' },
  potOnTableLabel: { color: colors.textMuted, fontSize: 8, fontWeight: '700', letterSpacing: 2 },
  potOnTableAmount: { color: colors.gold, fontSize: 20, fontWeight: '800', fontFamily: 'Orbitron_700Bold', lineHeight: 24 },
  sidePotRow: { flexDirection: 'row', gap: 6 },
  sidePotChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1, borderColor: 'rgba(191,95,255,0.4)', alignItems: 'center' },
  sidePotLabel: { color: colors.accent, fontSize: 7, fontWeight: '700', letterSpacing: 1 },
  sidePotAmt: { color: colors.text, fontSize: 11, fontWeight: '700' },
  chipToken: { position: 'absolute', width: 14, height: 14, borderRadius: 7, backgroundColor: colors.primary, borderWidth: 2, borderColor: 'rgba(0,212,255,0.6)', zIndex: 20 },
  chipTokenWin: { position: 'absolute', width: 16, height: 16, borderRadius: 8, backgroundColor: colors.gold, borderWidth: 2, borderColor: 'rgba(255,215,0,0.7)', zIndex: 20 },
  allInOverlay: { position: 'absolute', top: 12, alignSelf: 'center', backgroundColor: 'rgba(255,0,144,0.15)', borderRadius: 10, borderWidth: 1, borderColor: colors.secondary, paddingHorizontal: 16, paddingVertical: 6, alignItems: 'center' },
  allInOverlayTitle: { color: colors.secondary, fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  allInOverlaySub: { color: colors.textMuted, fontSize: 10 },
  messageBox: { position: 'absolute', bottom: 10, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 5 },
  messageText: { color: colors.textMuted, fontSize: 11 },
  playerStrip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(5,0,16,0.9)', borderTopWidth: 1, borderColor: colors.border },
  playerStripLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  humanAvatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  humanAvatarText: { fontSize: 16 },
  dealerDot: { position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  dealerDotText: { fontSize: 8, fontWeight: '900', color: colors.background },
  humanName: { color: colors.text, fontSize: 13, fontWeight: '700' },
  humanChips: { color: colors.gold, fontSize: 11, fontWeight: '600' },
  betChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: 'rgba(191,95,255,0.2)', borderWidth: 1, borderColor: colors.accent },
  betChipText: { color: colors.accent, fontSize: 11, fontWeight: '700' },
  handoverPanel: { paddingHorizontal: 16, paddingTop: 12, gap: 10, position: 'relative' },
  winnerBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: colors.border },
  winnerBannerHuman: { backgroundColor: 'rgba(255,215,0,0.08)', borderColor: 'rgba(255,215,0,0.3)' },
  handoverMsg: { color: colors.text, fontSize: 14, fontWeight: '700' },
  handoverHand: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  potWonBadge: { alignItems: 'center' },
  potWonAmt: { color: colors.text, fontSize: 16, fontWeight: '800' },
  winnerBannerLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '600' },
  deltasRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  deltaChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  deltaName: { color: colors.textMuted, fontSize: 9, fontWeight: '600' },
  deltaAmt: { fontSize: 11, fontWeight: '800' },
  nextBtn: { borderRadius: 50, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, overflow: 'hidden', marginBottom: 4 },
  nextBtnText: { color: colors.text, fontFamily: 'Orbitron_700Bold', fontSize: 13, letterSpacing: 2 },
  waitingPanel: { paddingHorizontal: 16, paddingTop: 12, gap: 8, alignItems: 'center' },
  waitingText: { color: colors.textMuted, fontSize: 12, textAlign: 'center' },
  waitingActions: { flexDirection: 'row', gap: 10 },
  skipBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: colors.border },
  skipText: { color: colors.textMuted, fontSize: 11, fontWeight: '600', letterSpacing: 1 },
  runItOutBtn: { borderColor: 'rgba(255,215,0,0.3)', backgroundColor: 'rgba(255,215,0,0.08)' },
  exitOverlay: { flex: 1, backgroundColor: 'rgba(5,0,16,0.82)', alignItems: 'center', justifyContent: 'center' },
  exitCard: { width: 280, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 28, alignItems: 'center', gap: 8 },
  exitTitle: { fontFamily: 'Orbitron_700Bold', fontSize: 18, color: colors.text, letterSpacing: 2 },
  exitSub: { color: colors.textMuted, fontSize: 12, textAlign: 'center', marginBottom: 8 },
  exitBtns: { flexDirection: 'row', gap: 12, marginTop: 4, alignSelf: 'stretch' },
  exitChoiceBtn: { flex: 1, paddingVertical: 13, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  exitYes: { backgroundColor: colors.secondary },
  exitNo: { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: colors.border },
  exitChoiceText: { color: colors.text, fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  blindBanner: { position: 'absolute', top: 80, alignSelf: 'center', zIndex: 50, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,215,0,0.15)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,215,0,0.4)', paddingHorizontal: 14, paddingVertical: 6 },
  blindBannerText: { color: colors.gold, fontSize: 11, fontWeight: '800', letterSpacing: 2 },
});
