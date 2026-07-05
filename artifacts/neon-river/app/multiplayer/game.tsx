import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Alert, Clipboard, Modal, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMultiplayer } from '@/context/MultiplayerContext';
import { useUser } from '@/context/UserContext';
import { useInGameChat, GameChatPanel } from '@/components/InGameChat';
import { formatChips } from '@/lib/multiplayerTypes';
import type { SeatView, ClientGameState } from '@/lib/multiplayerTypes';
import PlayingCard from '@/components/PlayingCard';
import DotTimer from '@/components/DotTimer';
import BettingPanel from '@/components/BettingPanel';
import colors from '@/constants/colors';
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
import { chrome, seat as seatStyles, table, CompactAISeat, CommunityCards, ActionFeed, PHASE_LABELS } from '@/components/PokerChrome';

// ─── Compact dot timer driven by a timeoutAt timestamp ────────────────────────

function SeatTimerDots({ timeoutAt }: { timeoutAt: number }) {
  const [secondsLeft, setSecondsLeft] = useState(30);
  useEffect(() => {
    const update = () => setSecondsLeft(Math.max(0, Math.ceil((timeoutAt - Date.now()) / 1000)));
    update();
    const t = setInterval(update, 250);
    return () => clearInterval(t);
  }, [timeoutAt]);
  return <DotTimer seconds={secondsLeft} maxSeconds={30} isActive size={3} gap={2} />;
}

function BotCountdown() {
  const [secs, setSecs] = useState(8);
  useEffect(() => {
    if (secs <= 0) return;
    const t = setTimeout(() => setSecs(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secs]);
  return (
    <Text style={g.botCountdown}>
      {secs > 0 ? `AI players joining in ${secs}s…` : 'AI players joining…'}
    </Text>
  );
}

// Adapts a multiplayer SeatView into the normalized shape CompactAISeat expects
// (the same shape used for AI bots in app/game/practice.tsx).
function toChromePlayer(s: SeatView, gs: ClientGameState) {
  const revealed = gs.phase === 'showdown' && s.revealedCards?.length ? s.revealedCards : null;
  return {
    id: s.seatIndex,
    name: s.username,
    chips: s.chips,
    avatarIndex: s.avatarId,
    status: s.status === 'allin' ? 'allIn' : s.status === 'sitting_out' ? 'folded' : s.status,
    isDealer: s.isDealer,
    isSmallBlind: false,
    isBigBlind: false,
    holeCards: revealed ?? [],
  };
}

export default function MultiplayerGame() {
  const { gameState, sendAction, leaveTable, tableId, buyIn, chatMessages, sendChat, setSitOut: emitSitOut } = useMultiplayer();
  const { addChips, updateProfile, profile } = useUser();
  const { theme } = useTableTheme();
  const chat = useInGameChat();
  const [sitOutActive, setSitOutActive] = useState(false);
  const [exitConfirm, setExitConfirm] = useState(false);
  const winAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const isDragon      = theme.id === 'dragon_fortune';
  const isMasquerade  = theme.id === 'royal_masquerade';
  const isSakura      = theme.id === 'sakura_garden';
  const isFrozenNeon  = theme.id === 'frozen_neon';
  const isCrimsonNoir = theme.id === 'crimson_noir';
  const isVercetti    = theme.id === 'vercetti';
  const needsFrame    = isDragon || isMasquerade || isSakura || isFrozenNeon || isCrimsonNoir || isVercetti;
  const [tableLayout, setTableLayout] = useState({ w: 0, h: 0 });

  // Per-hand W/L tracking
  const prevWinnersKeyRef = useRef<string>('');
  const handsWonRef       = useRef(0);
  const handsLostRef      = useRef(0);
  const xpEarnedRef       = useRef(0);

  const gs: ClientGameState | null = gameState;

  useEffect(() => {
    if (!tableId) router.replace('/multiplayer/lobby' as any);
  }, [tableId]);

  // Detect new showdown results each hand
  useEffect(() => {
    if (!gs || gs.phase !== 'showdown' || !gs.winners || gs.winners.length === 0) return;
    const key = gs.winners.map(w => `${w.seatIndex}:${w.amount}`).join(',');
    if (key === prevWinnersKeyRef.current) return;
    prevWinnersKeyRef.current = key;

    const iWon = gs.winners.some(w => w.seatIndex === gs.mySeat);
    const myWinEntry = gs.winners.find(w => w.seatIndex === gs.mySeat);
    if (iWon && myWinEntry) {
      handsWonRef.current++;
      xpEarnedRef.current += 500 + Math.min(500, Math.floor(myWinEntry.amount / 200));
    } else if (gs.mySeat !== -1) {
      handsLostRef.current++;
      xpEarnedRef.current += 150;
    }
  }, [gs?.winners, gs?.phase]);

  useEffect(() => {
    if (gs?.winners && gs.winners.length > 0) {
      winAnim.setValue(0);
      Animated.sequence([
        Animated.timing(winAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(2000),
        Animated.timing(winAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    }
  }, [gs?.winners]);

  // ── Chat: receive incoming server messages ──────────────────────────────────
  const myUserId = profile.playerId ?? profile.username;
  const prevChatLenRef = useRef(0);
  useEffect(() => {
    if (chatMessages.length <= prevChatLenRef.current) return;
    const incoming = chatMessages.slice(prevChatLenRef.current);
    prevChatLenRef.current = chatMessages.length;
    for (const msg of incoming) {
      if (msg.playerId === myUserId) continue;
      chat.receiveBotMessage(msg.playerId, msg.playerName, msg.text);
    }
  }, [chatMessages]);

  const handleSendChat = (text: string) => {
    chat.sendMessage(text);
    sendChat(text);
  };

  const handleSitOut = () => {
    const next = !sitOutActive;
    setSitOutActive(next);
    emitSitOut(next);
  };

  const doLeave = async () => {
    const finalChips = gs?.mySeat !== undefined && gs.mySeat !== -1
      ? (gs.seats[gs.mySeat]?.chips ?? 0)
      : 0;
    if (finalChips > 0) {
      await addChips(finalChips);
    }
    const totalHands = handsWonRef.current + handsLostRef.current;
    if (totalHands > 0 || xpEarnedRef.current > 0) {
      const newXp = profile.xp + xpEarnedRef.current;
      await updateProfile({
        wins:         profile.wins + handsWonRef.current,
        losses:       profile.losses + handsLostRef.current,
        handsPlayed:  profile.handsPlayed + totalHands,
        xp:           newXp,
      });
    }
    leaveTable();
    router.replace('/multiplayer/lobby' as any);
  };

  if (!gs) {
    return (
      <View style={chrome.screen}>
        <LinearGradient
          colors={theme.bgGradient as [string, string, string, string, string]}
          locations={[0, 0.25, 0.5, 0.75, 1]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.3, y: 0 }} end={{ x: 0.7, y: 1 }}
        />
        <View style={[chrome.gameCenter, { alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={g.joiningTxt}>JOINING TABLE...</Text>
        </View>
      </View>
    );
  }

  const mySeat      = gs.mySeat !== -1 ? gs.seats[gs.mySeat] : null;
  const opponents   = gs.seats.filter((s, i) => s !== null && i !== gs.mySeat) as SeatView[];
  const canCheck    = gs.isMyTurn && gs.callAmount === 0;
  const myWin       = (gs.winners ?? []).find(w => w.seatIndex === gs.mySeat);
  const isMyTurnAndActive = gs.isMyTurn && gs.phase !== 'showdown' && gs.phase !== 'waiting';
  const isHandOver  = gs.phase === 'showdown';
  const isWaiting   = gs.phase === 'waiting';
  const needPlayers = gs.seats.filter(Boolean).length < 2;
  const latestMessage = gs.messages[0]?.text ?? '';
  const roomCode = gs.tableId.slice(-6).toUpperCase();

  return (
    <View style={chrome.screen}>
      {/* Atmospheric background */}
      <LinearGradient
        colors={theme.bgGradient as [string, string, string, string, string]}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.3, y: 0 }} end={{ x: 0.7, y: 1 }}
      />
      {!isDragon && !isMasquerade && !isSakura && !isFrozenNeon && !isCrimsonNoir && !isVercetti && (
        <>
          <View style={[chrome.glowPurple, { backgroundColor: theme.glowA }]} />
          <View style={[chrome.glowCyan,   { backgroundColor: theme.glowB }]} />
          <View style={[chrome.glowCenter, { backgroundColor: theme.glowCenter }]} />
        </>
      )}

      {isDragon      && <DragonBackground />}
      {isMasquerade  && <MasqueradeBackground />}
      {isSakura      && <SakuraBackground />}
      {isFrozenNeon  && <FrozenNeonBackground />}
      {isCrimsonNoir && <CrimsonNoirBackground />}
      {isVercetti    && <VercettiBackground />}

      {/* Leave-table confirm modal — mirrors practice.tsx exit modal exactly */}
      <Modal transparent visible={exitConfirm} animationType="none" onRequestClose={() => setExitConfirm(false)}>
        <View style={chrome.exitOverlay}>
          <View style={chrome.exitCard}>
            <Text style={chrome.exitTitle}>LEAVE TABLE?</Text>
            <Text style={chrome.exitSub}>You will be folded if you're in a hand.</Text>
            <View style={chrome.exitBtns}>
              <TouchableOpacity
                style={[chrome.exitChoiceBtn, chrome.exitYes]}
                onPress={() => { setExitConfirm(false); void doLeave(); }}
                activeOpacity={0.85}
              >
                <Text style={chrome.exitChoiceText}>YES</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[chrome.exitChoiceBtn, chrome.exitNo]}
                onPress={() => setExitConfirm(false)}
                activeOpacity={0.85}
              >
                <Text style={chrome.exitChoiceText}>NO</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Top controls — identical chrome to practice.tsx */}
      <View style={[chrome.topControls, { paddingTop: insets.top + (Platform.OS === 'web' ? 20 : 10) }]}>
        <TouchableOpacity style={chrome.iconBtn} onPress={() => setExitConfirm(true)} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.55)" />
        </TouchableOpacity>
        <View style={chrome.topCenter}>
          <Text style={chrome.phaseLabel}>
            {PHASE_LABELS[gs.phase] ?? gs.phase.toUpperCase()}
            {'  ·  #'}{roomCode}
          </Text>
          {buyIn != null && (
            <Text style={g.buyInTxt}>BUY-IN {formatChips(buyIn)}</Text>
          )}
        </View>
        <TouchableOpacity
          style={[chrome.iconBtn, sitOutActive && chrome.iconBtnOn]}
          onPress={handleSitOut}
          activeOpacity={0.75}
        >
          <Ionicons
            name={sitOutActive ? 'pause-circle' : 'pause-circle-outline'}
            size={18}
            color={sitOutActive ? '#ff0090' : 'rgba(255,255,255,0.3)'}
          />
        </TouchableOpacity>
      </View>

      {/* Opponents row — identical CompactAISeat used by practice.tsx */}
      <View style={chrome.aiRow}>
        {opponents.length === 0 ? (
          <View style={g.emptySeats}>
            <Text style={g.emptyTxt}>{isWaiting ? 'Waiting for players...' : ''}</Text>
          </View>
        ) : (
          opponents.map(opp => (
            <CompactAISeat
              key={opp.seatIndex}
              player={toChromePlayer(opp, gs)}
              isCurrentTurn={opp.isTurn}
              isWinner={(gs.winners ?? []).some(w => w.seatIndex === opp.seatIndex)}
              timeoutAt={opp.isTurn && gs.turnTimeoutAt ? gs.turnTimeoutAt : undefined}
              timer={0}
              showCards={isHandOver && !!opp.revealedCards?.length}
            />
          ))
        )}
      </View>

      {/* Center — table felt, identical structure to practice.tsx */}
      <View style={chrome.gameCenter}>
        <View
          onLayout={needsFrame ? (e) => {
            const { width, height } = e.nativeEvent.layout;
            setTableLayout({ w: width, h: height });
          } : undefined}
          style={{ position: 'relative' }}
        >
          {isDragon && tableLayout.w > 0 && <DragonCardFrame width={tableLayout.w} height={tableLayout.h} />}
          {isMasquerade && tableLayout.w > 0 && <MasqueradeCardFrame width={tableLayout.w} height={tableLayout.h} />}
          {isSakura && tableLayout.w > 0 && <SakuraCardFrame width={tableLayout.w} height={tableLayout.h} />}
          {isFrozenNeon && tableLayout.w > 0 && <FrozenNeonCardFrame width={tableLayout.w} height={tableLayout.h} />}
          {isCrimsonNoir && tableLayout.w > 0 && <CrimsonNoirCardFrame width={tableLayout.w} height={tableLayout.h} />}
          {isVercetti && tableLayout.w > 0 && <VercettiCardFrame width={tableLayout.w} height={tableLayout.h} />}
          <View style={[chrome.tableSurface, {
            borderColor: theme.tableSurfaceBorder,
            backgroundColor: theme.tableSurfaceBg,
            shadowColor: theme.tableSurfaceShadow,
          }]}>
            <View style={[chrome.tableCenterGlow, { backgroundColor: theme.tableCenterGlow }]} />
            <CommunityCards
              cards={gs.communityCards}
              phase={gs.phase}
              holeCards={gs.myCards}
              variant={gs.variant}
            />
            {isWaiting && (
              <View style={g.waitingBox}>
                <Text style={g.waitingTxt}>{needPlayers ? 'Waiting for players...' : 'Hand starting soon...'}</Text>
                {needPlayers && <BotCountdown />}
                <TouchableOpacity
                  style={g.codeBox}
                  onPress={() => { Clipboard.setString(roomCode); }}
                  activeOpacity={0.7}
                >
                  <Text style={g.codeLabel}>INVITE CODE</Text>
                  <Text style={g.codeValue}>{roomCode}</Text>
                  <Ionicons name="copy-outline" size={11} color="#bf5fff" style={{ marginTop: 2 }} />
                </TouchableOpacity>
                <Text style={g.codeHint}>Friends can join using this code in the lobby</Text>
              </View>
            )}
          </View>
        </View>

        {/* Floating pot — same normal-flow placement as practice.tsx */}
        {gs.pot > 0 && (
          <View style={[chrome.potFloat, {
            backgroundColor: theme.potBg,
            borderColor: theme.potBorder,
            shadowColor: theme.potShadow,
          }]}>
            <Text style={[chrome.potLabel,  { color: theme.potLabelColor  }]}>POT</Text>
            <Text style={[chrome.potAmount, { color: theme.potAmountColor }]}>{formatChips(gs.pot)}</Text>
          </View>
        )}

        {/* Action feed — fades automatically, same component as practice.tsx */}
        <ActionFeed message={latestMessage} isHandOver={isHandOver} />

        {/* Win banner */}
        {myWin && (
          <Animated.View style={[g.winBanner, { opacity: winAnim }]}>
            <Ionicons name="trophy" size={16} color="#ffd700" />
            <Text style={g.winTxt}>YOU WIN {formatChips(myWin.amount)}!</Text>
            {myWin.handRank && <Text style={g.winHand}>{myWin.handRank}</Text>}
          </Animated.View>
        )}
      </View>

      {/* Human player area — identical structure to practice.tsx */}
      <View style={chrome.humanArea}>
        <View style={chrome.humanCards}>
          {!isWaiting && gs.myCards.length > 0
            ? gs.myCards.map((c, i) => <PlayingCard key={i} card={c} size={gs.variant === 'omaha_holdem' ? 'md' : 'lg'} />)
            : Array.from({ length: gs.variant === 'omaha_holdem' ? 4 : 2 }, (_, i) => (
                <PlayingCard key={i} faceDown size={gs.variant === 'omaha_holdem' ? 'md' : 'lg'} />
              ))
          }
        </View>
        <View style={chrome.humanStrip}>
          <View style={[
            chrome.humanDot,
            gs.isMyTurn && chrome.humanDotActive,
            !!myWin && chrome.humanDotWinner,
          ]} />
          <Text style={[chrome.humanName, !!myWin && { color: '#ffd700' }]} numberOfLines={1}>
            {mySeat?.username ?? 'YOU'}
          </Text>
          <Text style={chrome.humanChips}>{formatChips(mySeat?.chips ?? 0)}</Text>
          {mySeat?.isDealer && (
            <View style={chrome.dealerBadge}><Text style={chrome.dealerBadgeText}>D</Text></View>
          )}
          {gs.isMyTurn && gs.turnTimeoutAt && <SeatTimerDots timeoutAt={gs.turnTimeoutAt} />}
          {mySeat?.status === 'allin' && <Text style={chrome.allInBadge}>ALL IN</Text>}
          {!!myWin && <Text style={chrome.winBadge}>WIN</Text>}
        </View>
      </View>

      {/* Bottom controls — docked flush to the bottom */}
      {isMyTurnAndActive ? (
        <View style={[g.panelDock, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) }]}>
          <BettingPanel
            canCheck={canCheck}
            callAmount={gs.callAmount}
            myChips={mySeat?.chips ?? 0}
            pot={gs.pot}
            minRaise={gs.minRaise}
            currentBet={gs.currentBet}
            onFold={() => sendAction('fold')}
            onCheck={() => sendAction('check')}
            onCall={() => sendAction('call')}
            onRaise={(amount) => sendAction('raise', amount)}
            onAllIn={() => sendAction('allin')}
          />
        </View>
      ) : (
        <View style={[chrome.waitingPanel, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 8) }]} />
      )}

      {/* Chat panel */}
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
        sendMessage={handleSendChat}
        onClose={chat.closePanel}
        onOpen={chat.openPanel}
      />
    </View>
  );
}

// ─── Multiplayer-only styles (not covered by the shared PokerChrome) ──────────

const g = StyleSheet.create({
  joiningTxt: { color: 'rgba(255,255,255,0.3)', fontFamily: 'Orbitron_400Regular', fontSize: 14, letterSpacing: 1 },
  buyInTxt:   { color: 'rgba(0,255,136,0.4)', fontFamily: 'Orbitron_400Regular', fontSize: 8, letterSpacing: 1, marginTop: 1, textAlign: 'center' },

  emptySeats: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTxt:   { color: 'rgba(255,255,255,0.15)', fontFamily: 'Orbitron_400Regular', fontSize: 11 },

  waitingBox: { alignItems: 'center', gap: 6, marginTop: 10 },
  waitingTxt: { color: 'rgba(255,255,255,0.4)', fontFamily: 'Orbitron_400Regular', fontSize: 9, textAlign: 'center' },
  codeBox:    { alignItems: 'center', borderWidth: 1, borderColor: 'rgba(191,95,255,0.4)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5, backgroundColor: 'rgba(191,95,255,0.08)' },
  codeLabel:  { color: 'rgba(191,95,255,0.8)', fontFamily: 'Orbitron_400Regular', fontSize: 7, letterSpacing: 1.5 },
  codeValue:  { color: '#bf5fff', fontFamily: 'Orbitron_700Bold', fontSize: 14, letterSpacing: 3 },
  codeHint:   { color: 'rgba(255,255,255,0.25)', fontFamily: 'Inter_400Regular', fontSize: 9, textAlign: 'center', marginTop: 2 },
  botCountdown: { color: '#00d4ff', fontFamily: 'Inter_400Regular', fontSize: 10, textAlign: 'center', opacity: 0.8 },

  winBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,215,0,0.08)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.4)', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, justifyContent: 'center' },
  winTxt:    { color: '#ffd700', fontFamily: 'Orbitron_700Bold', fontSize: 13, letterSpacing: 1 },
  winHand:   { color: '#ffcc00', fontFamily: 'Orbitron_400Regular', fontSize: 10 },

  panelDock: {
    backgroundColor: 'rgba(5,0,16,0.92)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
});
