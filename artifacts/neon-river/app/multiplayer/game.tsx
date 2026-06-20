import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, Dimensions, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMultiplayer } from '@/context/MultiplayerContext';
import { formatChips } from '@/lib/multiplayerTypes';
import type { Card, SeatView, ClientGameState } from '@/lib/multiplayerTypes';

const { width: SW } = Dimensions.get('window');

const SUIT_SYMBOLS: Record<string, string> = { S: '♠', H: '♥', D: '♦', C: '♣' };
const VALUE_LABELS: Record<number, string> = {
  2:'2',3:'3',4:'4',5:'5',6:'6',7:'7',8:'8',9:'9',
  10:'10',11:'J',12:'Q',13:'K',14:'A',
};
const RED_SUITS = new Set(['H', 'D']);

// ─── Card Component ───────────────────────────────────────────────────────────

function PokerCard({ card, faceDown = false, size = 'md' }: {
  card?: Card; faceDown?: boolean; size?: 'sm' | 'md' | 'lg';
}) {
  const dims = size === 'lg' ? { w: 52, h: 74, fz: 18, sfz: 12 }
    : size === 'sm' ? { w: 34, h: 48, fz: 13, sfz: 9 }
    : { w: 42, h: 60, fz: 16, sfz: 11 };

  if (faceDown || !card) {
    return (
      <View style={[styles.card, { width: dims.w, height: dims.h, backgroundColor: '#1a0040', borderColor: '#bf5fff40' }]}>
        <LinearGradient colors={['#2a0060', '#0d0030']} style={StyleSheet.absoluteFill} />
        <Text style={{ color: '#bf5fff', fontSize: dims.fz }}>★</Text>
      </View>
    );
  }

  const isRed = RED_SUITS.has(card.suit);
  const color = isRed ? '#ff4466' : '#e8e8e8';
  const sym = SUIT_SYMBOLS[card.suit] ?? card.suit;
  const val = VALUE_LABELS[card.value] ?? String(card.value);

  return (
    <View style={[styles.card, { width: dims.w, height: dims.h, backgroundColor: '#f8f4ff', borderColor: '#ddd' }]}>
      <Text style={{ color, fontSize: dims.fz, fontFamily: 'Inter_700Bold', lineHeight: dims.fz + 2 }}>{val}</Text>
      <Text style={{ color, fontSize: dims.sfz }}>{sym}</Text>
    </View>
  );
}

// ─── Opponent Seat ────────────────────────────────────────────────────────────

function OpponentSeat({ seat, gameState }: { seat: SeatView; gameState: ClientGameState }) {
  const isActive = seat.isTurn;
  const isFolded = seat.status === 'folded';
  const isAllin = seat.status === 'allin';
  const isDealer = seat.isDealer;
  const glow = isActive ? '#00d4ff' : 'transparent';

  const revealedCards = gameState.phase === 'showdown' && seat.revealedCards && seat.revealedCards.length > 0
    ? seat.revealedCards : null;

  return (
    <View style={[styles.oppSeat, { opacity: isFolded ? 0.35 : 1, borderColor: isActive ? '#00d4ff' : '#222' }]}>
      {isActive && <View style={[styles.activePulse, { borderColor: glow }]} />}
      <View style={styles.oppAvatar}>
        <LinearGradient
          colors={isActive ? ['#00d4ff', '#0088cc'] : ['#2a2a3a', '#1a1a2a']}
          style={styles.oppAvatarInner}
        >
          <Text style={[styles.oppAvatarText, { color: isActive ? '#000' : '#fff' }]}>
            {seat.username.slice(0, 2).toUpperCase()}
          </Text>
        </LinearGradient>
        {isDealer && <View style={styles.dealerBadge}><Text style={styles.dealerText}>D</Text></View>}
        {isAllin && <View style={styles.allinBadge}><Text style={styles.allinText}>ALL IN</Text></View>}
      </View>

      {/* Cards */}
      <View style={styles.oppCards}>
        {revealedCards ? (
          <>
            <PokerCard card={revealedCards[0]} size="sm" />
            <PokerCard card={revealedCards[1]} size="sm" />
          </>
        ) : (
          Array.from({ length: Math.max(0, seat.cardCount) }).map((_, i) => (
            <PokerCard key={i} faceDown size="sm" />
          ))
        )}
      </View>

      <Text style={styles.oppName} numberOfLines={1}>{seat.username}</Text>
      <Text style={styles.oppChips}>{formatChips(seat.chips)}</Text>

      {seat.currentBet > 0 && (
        <View style={styles.betChip}>
          <Text style={styles.betChipText}>{formatChips(seat.currentBet)}</Text>
        </View>
      )}

      {seat.revealedHand && (
        <View style={styles.handLabel}>
          <Text style={styles.handLabelText}>{seat.revealedHand}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Community Cards ──────────────────────────────────────────────────────────

function CommunityCards({ cards, phase }: { cards: Card[]; phase: string }) {
  return (
    <View style={styles.communityRow}>
      {[0, 1, 2, 3, 4].map(i => (
        <PokerCard key={i} card={cards[i]} faceDown={i >= cards.length} size="md" />
      ))}
    </View>
  );
}

// ─── Turn Timer ───────────────────────────────────────────────────────────────

function TurnTimer({ timeoutAt }: { timeoutAt: number | null }) {
  const [secondsLeft, setSecondsLeft] = useState(30);
  const anim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!timeoutAt) { setSecondsLeft(30); return; }
    const update = () => {
      const left = Math.max(0, Math.ceil((timeoutAt - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0) return;
      requestAnimationFrame(update);
    };
    const raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [timeoutAt]);

  useEffect(() => {
    if (!timeoutAt) return;
    Animated.timing(anim, { toValue: 0, duration: 30000, useNativeDriver: false }).start();
    return () => anim.setValue(1);
  }, [timeoutAt]);

  const color = secondsLeft <= 5 ? '#ff4444' : secondsLeft <= 10 ? '#ffcc00' : '#00d4ff';

  return (
    <View style={styles.timerRow}>
      <View style={styles.timerTrack}>
        <Animated.View style={[styles.timerBar, {
          width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          backgroundColor: color,
        }]} />
      </View>
      <Text style={[styles.timerText, { color }]}>{secondsLeft}s</Text>
    </View>
  );
}

// ─── Main Game Screen ─────────────────────────────────────────────────────────

export default function MultiplayerGame() {
  const { gameState, sendAction, leaveTable, tableId } = useMultiplayer();
  const [raiseAmount, setRaiseAmount] = useState(0);
  const [showRaise, setShowRaise] = useState(false);

  const gs: ClientGameState | null = gameState;

  useEffect(() => {
    if (!tableId) router.replace('/multiplayer/lobby' as any);
  }, [tableId]);

  useEffect(() => {
    if (gs) setRaiseAmount(gs.minRaise);
  }, [gs?.minRaise]);

  const handleLeave = () => {
    Alert.alert('Leave Table', 'Leave this table? You will be folded if in a hand.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: () => { leaveTable(); router.replace('/multiplayer/lobby' as any); } },
    ]);
  };

  const handleRaise = () => {
    sendAction('raise', raiseAmount);
    setShowRaise(false);
  };

  if (!gs) {
    return (
      <LinearGradient colors={['#050010', '#0a0020']} style={styles.root}>
        <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: '#444', fontFamily: 'Orbitron_400Regular', fontSize: 14 }}>JOINING TABLE...</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const mySeatData = gs.mySeat !== -1 ? gs.seats[gs.mySeat] : null;
  const opponents = gs.seats.filter((s, i) => s !== null && i !== gs.mySeat) as SeatView[];
  const canCheck = gs.isMyTurn && gs.callAmount === 0;
  const canCall = gs.isMyTurn && gs.callAmount > 0;
  const canRaise = gs.isMyTurn && gs.maxRaise > gs.callAmount;
  const phase = gs.phase.toUpperCase();

  const winners = gs.winners ?? [];
  const myWin = winners.find(w => w.seatIndex === gs.mySeat);

  return (
    <LinearGradient colors={['#050010', '#080018', '#050010']} style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleLeave} style={styles.leaveBtn}>
            <Text style={styles.leaveBtnText}>LEAVE</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.phaseText}>{phase}</Text>
            <Text style={styles.tableIdText}>#{gs.tableId.slice(-6).toUpperCase()}</Text>
          </View>
          <View style={styles.potDisplay}>
            <Text style={styles.potLabel}>POT</Text>
            <Text style={styles.potValue}>{formatChips(gs.pot)}</Text>
          </View>
        </View>

        {/* Opponents */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.oppsRow}
          style={styles.oppsScroll}
        >
          {opponents.length === 0 ? (
            <View style={styles.waitingBox}>
              <Text style={styles.waitingText}>
                {gs.phase === 'waiting'
                  ? 'Waiting for players to join...'
                  : 'You are the only player'}
              </Text>
            </View>
          ) : (
            opponents.map(opp => (
              <OpponentSeat key={opp.seatIndex} seat={opp} gameState={gs} />
            ))
          )}
        </ScrollView>

        {/* Community cards + blinds */}
        <View style={styles.tableCenter}>
          <View style={styles.blindsRow}>
            <Text style={styles.blindLabel}>SB {formatChips(gs.smallBlind)}</Text>
            <Text style={styles.blindLabel}>BB {formatChips(gs.bigBlind)}</Text>
          </View>
          <CommunityCards cards={gs.communityCards} phase={gs.phase} />
          {gs.phase === 'waiting' && (
            <Text style={styles.dealingText}>
              {gs.seats.filter(s => s !== null).length < 2
                ? 'Waiting for 2+ players...'
                : 'Hand starts soon...'}
            </Text>
          )}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* My hand */}
        {gs.phase !== 'waiting' && (
          <View style={styles.mySection}>
            <View style={styles.myInfo}>
              <View style={styles.myCards}>
                {gs.myCards.length > 0 ? (
                  gs.myCards.map((c, i) => <PokerCard key={i} card={c} size="lg" />)
                ) : (
                  <>
                    <PokerCard faceDown size="lg" />
                    <PokerCard faceDown size="lg" />
                  </>
                )}
              </View>
              <View style={styles.myStats}>
                <Text style={styles.myLabel}>MY CHIPS</Text>
                <Text style={styles.myChips}>{formatChips(mySeatData?.chips ?? 0)}</Text>
                {(mySeatData?.currentBet ?? 0) > 0 && (
                  <>
                    <Text style={styles.myLabel}>BET</Text>
                    <Text style={styles.myBet}>{formatChips(mySeatData!.currentBet)}</Text>
                  </>
                )}
                {mySeatData?.isDealer && <View style={styles.myDealerBadge}><Text style={styles.dealerText}>D</Text></View>}
              </View>
            </View>

            {/* Turn timer */}
            {gs.isMyTurn && gs.turnTimeoutAt && <TurnTimer timeoutAt={gs.turnTimeoutAt} />}

            {/* Winner banner */}
            {gs.phase === 'showdown' && myWin && (
              <View style={styles.winBanner}>
                <Text style={styles.winText}>YOU WIN {formatChips(myWin.amount)}! {myWin.handRank ?? ''}</Text>
              </View>
            )}

            {/* Action buttons */}
            {gs.isMyTurn && gs.phase !== 'showdown' ? (
              <View style={styles.actionsArea}>
                {showRaise ? (
                  <View style={styles.raiseArea}>
                    <Text style={styles.raiseLabel}>RAISE TO</Text>
                    <View style={styles.raiseRow}>
                      <TouchableOpacity
                        style={styles.raiseAdj}
                        onPress={() => setRaiseAmount(v => Math.max(gs.minRaise, v - gs.bigBlind))}
                      >
                        <Text style={styles.raiseAdjText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.raiseValue}>{formatChips(raiseAmount)}</Text>
                      <TouchableOpacity
                        style={styles.raiseAdj}
                        onPress={() => setRaiseAmount(v => Math.min(gs.maxRaise, v + gs.bigBlind))}
                      >
                        <Text style={styles.raiseAdjText}>+</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.raisePresets}>
                      {[2, 3, 4].map(mult => {
                        const val = Math.min(gs.maxRaise, gs.currentBet * mult);
                        return (
                          <TouchableOpacity key={mult} style={styles.presetBtn} onPress={() => setRaiseAmount(val)}>
                            <Text style={styles.presetText}>{mult}x</Text>
                          </TouchableOpacity>
                        );
                      })}
                      <TouchableOpacity style={styles.presetBtn} onPress={() => setRaiseAmount(gs.maxRaise)}>
                        <Text style={styles.presetText}>MAX</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.raiseActions}>
                      <TouchableOpacity style={styles.cancelRaiseBtn} onPress={() => setShowRaise(false)}>
                        <Text style={styles.cancelRaiseTxt}>BACK</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.confirmRaiseBtn} onPress={handleRaise}>
                        <LinearGradient colors={['#ff0090', '#cc0070']} style={styles.confirmRaiseGrad} start={{x:0,y:0}} end={{x:1,y:0}}>
                          <Text style={styles.confirmRaiseTxt}>RAISE {formatChips(raiseAmount)}</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.btnRow}>
                    <TouchableOpacity style={[styles.actionBtn, styles.foldBtn]} onPress={() => sendAction('fold')}>
                      <Text style={styles.foldText}>FOLD</Text>
                    </TouchableOpacity>

                    {canCheck && (
                      <TouchableOpacity style={[styles.actionBtn, styles.checkBtn]} onPress={() => sendAction('check')}>
                        <Text style={styles.checkText}>CHECK</Text>
                      </TouchableOpacity>
                    )}

                    {canCall && (
                      <TouchableOpacity style={[styles.actionBtn, styles.callBtn]} onPress={() => sendAction('call')}>
                        <LinearGradient colors={['#00d4ff', '#0088cc']} style={styles.actionGrad} start={{x:0,y:0}} end={{x:1,y:0}}>
                          <Text style={styles.callText}>CALL {formatChips(gs.callAmount)}</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    )}

                    {canRaise && (
                      <TouchableOpacity style={[styles.actionBtn, styles.raiseBtn]} onPress={() => setShowRaise(true)}>
                        <LinearGradient colors={['#ff0090', '#cc0070']} style={styles.actionGrad} start={{x:0,y:0}} end={{x:1,y:0}}>
                          <Text style={styles.raiseText}>RAISE</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity style={[styles.actionBtn, styles.allinBtn]} onPress={() => sendAction('allin')}>
                      <LinearGradient colors={['#bf5fff', '#7b2fff']} style={styles.actionGrad} start={{x:0,y:0}} end={{x:1,y:0}}>
                        <Text style={styles.raiseText}>ALL IN</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : gs.phase !== 'showdown' ? (
              <View style={styles.waitTurn}>
                <Text style={styles.waitTurnText}>
                  {gs.activeSeat !== -1 && gs.seats[gs.activeSeat]
                    ? `Waiting for ${gs.seats[gs.activeSeat]!.username}...`
                    : 'Waiting for action...'}
                </Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Action log */}
        <ScrollView
          style={styles.logScroll}
          contentContainerStyle={styles.logContent}
          showsVerticalScrollIndicator={false}
        >
          {gs.messages.slice(0, 6).map((msg, i) => (
            <Text key={i} style={[styles.logMsg,
              msg.type === 'result' ? { color: '#ffcc00' } :
              msg.type === 'info' ? { color: '#555' } : { color: '#888' }
            ]}>
              {msg.text}
            </Text>
          ))}
        </ScrollView>

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  leaveBtn: { borderWidth: 1, borderColor: '#ff444440', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  leaveBtnText: { color: '#ff4444', fontFamily: 'Orbitron_700Bold', fontSize: 10, letterSpacing: 1 },
  headerCenter: { alignItems: 'center' },
  phaseText: { color: '#00d4ff', fontFamily: 'Orbitron_700Bold', fontSize: 12, letterSpacing: 2 },
  tableIdText: { color: '#333', fontFamily: 'Orbitron_400Regular', fontSize: 9 },
  potDisplay: { alignItems: 'flex-end' },
  potLabel: { color: '#555', fontFamily: 'Orbitron_400Regular', fontSize: 9, letterSpacing: 1 },
  potValue: { color: '#ffcc00', fontFamily: 'Inter_700Bold', fontSize: 16 },

  oppsScroll: { maxHeight: 160, flexGrow: 0 },
  oppsRow: { paddingHorizontal: 16, gap: 10, alignItems: 'flex-start', paddingVertical: 8 },
  waitingBox: { flex: 1, alignItems: 'center', paddingVertical: 20, paddingHorizontal: 30 },
  waitingText: { color: '#444', fontFamily: 'Orbitron_400Regular', fontSize: 12, textAlign: 'center' },

  oppSeat: { alignItems: 'center', borderWidth: 1, borderRadius: 14, padding: 10, minWidth: 100, backgroundColor: 'rgba(255,255,255,0.02)' },
  activePulse: { position: 'absolute', top: -2, left: -2, right: -2, bottom: -2, borderRadius: 16, borderWidth: 2 },
  oppAvatar: { position: 'relative', marginBottom: 4 },
  oppAvatarInner: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  oppAvatarText: { fontFamily: 'Orbitron_700Bold', fontSize: 13 },
  dealerBadge: { position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: '#ffcc00', alignItems: 'center', justifyContent: 'center' },
  dealerText: { color: '#000', fontSize: 8, fontFamily: 'Orbitron_700Bold' },
  allinBadge: { position: 'absolute', bottom: -4, left: -8, right: -8, backgroundColor: '#ff0090', borderRadius: 4, alignItems: 'center' },
  allinText: { color: '#fff', fontSize: 7, fontFamily: 'Orbitron_700Bold' },
  oppCards: { flexDirection: 'row', gap: 3, marginBottom: 4 },
  oppName: { color: '#ccc', fontFamily: 'Orbitron_400Regular', fontSize: 9, letterSpacing: 0.5, maxWidth: 90, textAlign: 'center' },
  oppChips: { color: '#ffcc00', fontFamily: 'Inter_700Bold', fontSize: 12, marginTop: 2 },
  betChip: { marginTop: 4, backgroundColor: '#00d4ff20', borderWidth: 1, borderColor: '#00d4ff40', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  betChipText: { color: '#00d4ff', fontFamily: 'Inter_700Bold', fontSize: 10 },
  handLabel: { marginTop: 4, backgroundColor: '#ffcc0020', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  handLabelText: { color: '#ffcc00', fontFamily: 'Orbitron_400Regular', fontSize: 8 },

  tableCenter: { alignItems: 'center', paddingVertical: 10 },
  blindsRow: { flexDirection: 'row', gap: 20, marginBottom: 8 },
  blindLabel: { color: '#333', fontFamily: 'Orbitron_400Regular', fontSize: 9, letterSpacing: 1 },
  communityRow: { flexDirection: 'row', gap: 6 },
  dealingText: { marginTop: 10, color: '#444', fontFamily: 'Orbitron_400Regular', fontSize: 11, letterSpacing: 1 },

  divider: { height: 1, backgroundColor: '#ffffff08', marginVertical: 8 },

  mySection: { paddingHorizontal: 16 },
  myInfo: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 10 },
  myCards: { flexDirection: 'row', gap: 6 },
  myStats: { flex: 1 },
  myLabel: { color: '#444', fontFamily: 'Orbitron_400Regular', fontSize: 9, letterSpacing: 1 },
  myChips: { color: '#ffcc00', fontFamily: 'Inter_700Bold', fontSize: 18, marginBottom: 4 },
  myBet: { color: '#00d4ff', fontFamily: 'Inter_700Bold', fontSize: 14 },
  myDealerBadge: { marginTop: 4, width: 18, height: 18, borderRadius: 9, backgroundColor: '#ffcc00', alignItems: 'center', justifyContent: 'center' },

  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  timerTrack: { flex: 1, height: 4, backgroundColor: '#1a1a2a', borderRadius: 2, overflow: 'hidden' },
  timerBar: { height: 4, borderRadius: 2 },
  timerText: { fontFamily: 'Inter_700Bold', fontSize: 13, minWidth: 28, textAlign: 'right' },

  winBanner: { backgroundColor: '#ffcc0020', borderWidth: 1, borderColor: '#ffcc00', borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginBottom: 10 },
  winText: { color: '#ffcc00', fontFamily: 'Orbitron_700Bold', fontSize: 13, letterSpacing: 1.5 },

  actionsArea: { marginBottom: 8 },
  btnRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionBtn: { flex: 1, minWidth: 70, borderRadius: 10, overflow: 'hidden' },
  actionGrad: { paddingVertical: 13, alignItems: 'center' },
  foldBtn: { borderWidth: 1, borderColor: '#ff444440', paddingVertical: 13, alignItems: 'center', backgroundColor: 'rgba(255,68,68,0.1)' },
  foldText: { color: '#ff4444', fontFamily: 'Orbitron_700Bold', fontSize: 11, letterSpacing: 1 },
  checkBtn: { borderWidth: 1, borderColor: '#00ff8840', paddingVertical: 13, alignItems: 'center', backgroundColor: 'rgba(0,255,136,0.08)' },
  checkText: { color: '#00ff88', fontFamily: 'Orbitron_700Bold', fontSize: 11, letterSpacing: 1 },
  callBtn: {}, callText: { color: '#000', fontFamily: 'Orbitron_700Bold', fontSize: 11, letterSpacing: 1 },
  raiseBtn: {}, raiseText: { color: '#fff', fontFamily: 'Orbitron_700Bold', fontSize: 11, letterSpacing: 1 },
  allinBtn: {},

  raiseArea: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#ff009040' },
  raiseLabel: { color: '#888', fontFamily: 'Orbitron_400Regular', fontSize: 10, letterSpacing: 1, textAlign: 'center', marginBottom: 8 },
  raiseRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 10 },
  raiseAdj: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#333', alignItems: 'center', justifyContent: 'center' },
  raiseAdjText: { color: '#fff', fontSize: 18, fontFamily: 'Inter_700Bold' },
  raiseValue: { color: '#ff0090', fontFamily: 'Inter_700Bold', fontSize: 22, minWidth: 80, textAlign: 'center' },
  raisePresets: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 12 },
  presetBtn: { borderWidth: 1, borderColor: '#333', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  presetText: { color: '#888', fontFamily: 'Orbitron_700Bold', fontSize: 10 },
  raiseActions: { flexDirection: 'row', gap: 10 },
  cancelRaiseBtn: { flex: 1, borderWidth: 1, borderColor: '#333', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  cancelRaiseTxt: { color: '#555', fontFamily: 'Orbitron_700Bold', fontSize: 11 },
  confirmRaiseBtn: { flex: 2, borderRadius: 10, overflow: 'hidden' },
  confirmRaiseGrad: { paddingVertical: 12, alignItems: 'center' },
  confirmRaiseTxt: { color: '#fff', fontFamily: 'Orbitron_700Bold', fontSize: 11, letterSpacing: 1 },

  waitTurn: { paddingVertical: 12, alignItems: 'center' },
  waitTurnText: { color: '#444', fontFamily: 'Orbitron_400Regular', fontSize: 11, letterSpacing: 1 },

  logScroll: { flex: 1, paddingHorizontal: 16 },
  logContent: { paddingTop: 4, paddingBottom: 8, gap: 2 },
  logMsg: { fontFamily: 'Inter_400Regular', fontSize: 11, letterSpacing: 0.3 },

  card: {
    borderRadius: 6, borderWidth: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4,
  },
});
