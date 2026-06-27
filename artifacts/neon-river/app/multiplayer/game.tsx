import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Dimensions, Alert, ScrollView, Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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

const AVATAR_COLORS = [
  '#00d4ff','#ff0090','#bf5fff','#ffd700','#00ff88',
  '#ff6600','#00ccff','#ff44aa','#88ff44','#ffcc00',
  '#6644ff','#ff4488','#44ffcc','#ff8844','#44aaff',
];

function avatarColor(idx: number): string {
  return AVATAR_COLORS[idx % AVATAR_COLORS.length] ?? '#00d4ff';
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function PokerCard({ card, faceDown = false, size = 'md', highlight = false }: {
  card?: Card; faceDown?: boolean; size?: 'sm' | 'md' | 'lg'; highlight?: boolean;
}) {
  const dims = size === 'lg' ? { w: 56, h: 80, fz: 20, sfz: 13 }
    : size === 'sm' ? { w: 32, h: 46, fz: 12, sfz: 9 }
    : { w: 42, h: 60, fz: 15, sfz: 10 };

  if (faceDown || !card) {
    return (
      <View style={[g.card, { width: dims.w, height: dims.h, backgroundColor: '#1a0040', borderColor: '#bf5fff50' }]}>
        <LinearGradient colors={['#2a0060', '#0d0030']} style={StyleSheet.absoluteFill} />
        <Text style={{ color: '#bf5fff60', fontSize: dims.fz }}>★</Text>
      </View>
    );
  }

  const isRed = RED_SUITS.has(card.suit);
  const color = isRed ? '#ff4466' : '#dde8ff';
  const sym = SUIT_SYMBOLS[card.suit] ?? card.suit;
  const val = VALUE_LABELS[card.value] ?? String(card.value);

  return (
    <View style={[g.card, {
      width: dims.w, height: dims.h,
      backgroundColor: '#f0eeff',
      borderColor: highlight ? '#ffd700' : '#ccc',
      shadowColor: highlight ? '#ffd700' : 'transparent',
      shadowRadius: highlight ? 8 : 0,
      shadowOpacity: highlight ? 0.8 : 0,
      elevation: highlight ? 6 : 0,
    }]}>
      {highlight && <View style={[StyleSheet.absoluteFill, { backgroundColor: '#ffd70015', borderRadius: 7 }]} />}
      <Text style={{ color, fontSize: dims.fz, fontFamily: 'Inter_700Bold', lineHeight: dims.fz + 2 }}>{val}</Text>
      <Text style={{ color, fontSize: dims.sfz, lineHeight: dims.sfz + 2 }}>{sym}</Text>
    </View>
  );
}

// ─── Turn Timer Bar ────────────────────────────────────────────────────────────

function TurnTimer({ timeoutAt }: { timeoutAt: number | null }) {
  const [secondsLeft, setSecondsLeft] = useState(30);
  const widthAnim = useRef(new Animated.Value(1)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!timeoutAt) { setSecondsLeft(30); widthAnim.setValue(1); return; }
    animRef.current?.stop();
    const remaining = Math.max(0, (timeoutAt - Date.now()) / 1000);
    widthAnim.setValue(remaining / 30);
    animRef.current = Animated.timing(widthAnim, {
      toValue: 0,
      duration: remaining * 1000,
      useNativeDriver: false,
    });
    animRef.current.start();

    let raf: ReturnType<typeof setTimeout>;
    const update = () => {
      const left = Math.max(0, Math.ceil((timeoutAt - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left > 0) raf = setTimeout(update, 250);
    };
    update();
    return () => { clearTimeout(raf); animRef.current?.stop(); };
  }, [timeoutAt]);

  const urgent = secondsLeft <= 8;
  const color = secondsLeft <= 5 ? '#ff4444' : urgent ? '#ffcc00' : '#00d4ff';

  return (
    <View style={g.timerWrap}>
      <View style={g.timerTrack}>
        <Animated.View style={[g.timerFill, {
          width: widthAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          backgroundColor: color,
        }]} />
      </View>
      <Text style={[g.timerNum, { color }]}>{secondsLeft}s</Text>
    </View>
  );
}

// ─── Opponent Seat Bubble ──────────────────────────────────────────────────────

function SeatBubble({ seat, gameState, style }: {
  seat: SeatView; gameState: ClientGameState; style?: object;
}) {
  const isActive = seat.isTurn;
  const isFolded = seat.status === 'folded';
  const isAllin  = seat.status === 'allin';
  const color    = avatarColor(seat.avatarId);
  const initials = seat.username.slice(0, 2).toUpperCase();

  const revealedCards = gameState.phase === 'showdown' && seat.revealedCards?.length
    ? seat.revealedCards : null;

  return (
    <View style={[g.seatBubble, style, isFolded && g.seatFolded]}>
      {isActive && (
        <LinearGradient
          colors={[`${color}30`, 'transparent']}
          style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
        />
      )}
      <View style={[g.seatBorder, { borderColor: isActive ? color : '#2a2a3a' }]}>
        {/* Avatar circle */}
        <View style={[g.seatAvatar, { backgroundColor: `${color}25`, borderColor: `${color}80` }]}>
          <Text style={[g.seatInitials, { color }]}>{initials}</Text>
          {seat.isDealer && <View style={g.dealerDot}><Text style={g.dealerDotTxt}>D</Text></View>}
          {isAllin && <View style={g.allinTag}><Text style={g.allinTxt}>ALL IN</Text></View>}
        </View>

        {/* Cards */}
        <View style={g.seatCards}>
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

        {/* Name + chips */}
        <Text style={g.seatName} numberOfLines={1}>{seat.username}</Text>
        <Text style={[g.seatChips, { color: '#ffcc00' }]}>{formatChips(seat.chips)}</Text>

        {/* Bet chip */}
        {seat.currentBet > 0 && (
          <View style={[g.betPill, { borderColor: `${color}60` }]}>
            <Text style={[g.betPillTxt, { color }]}>{formatChips(seat.currentBet)}</Text>
          </View>
        )}

        {/* Hand label */}
        {seat.revealedHand && (
          <View style={g.handTag}>
            <Text style={g.handTagTxt}>{seat.revealedHand}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Oval Table Surface ────────────────────────────────────────────────────────

function TableSurface({ gs }: { gs: ClientGameState }) {
  const phase = gs.phase;
  const isWaiting = phase === 'waiting';

  return (
    <View style={g.tableOuter}>
      <LinearGradient
        colors={['#0a2e12', '#0d3a16', '#082510']}
        style={g.tableInner}
      >
        {/* Felt ring */}
        <View style={g.feltRing} />

        {/* Blinds */}
        <View style={g.blindsRow}>
          <Text style={g.blindTxt}>SB {formatChips(gs.smallBlind)}</Text>
          <Text style={g.blindTxt}>BB {formatChips(gs.bigBlind)}</Text>
        </View>

        {/* Community cards */}
        <View style={g.communityRow}>
          {[0,1,2,3,4].map(i => (
            <PokerCard key={i} card={gs.communityCards[i]} faceDown={i >= gs.communityCards.length} size="md" />
          ))}
        </View>

        {/* Pot */}
        {gs.pot > 0 && (
          <View style={g.potRow}>
            <Ionicons name="layers" size={11} color="#ffd700" />
            <Text style={g.potTxt}>{formatChips(gs.pot)}</Text>
          </View>
        )}

        {isWaiting && (
          <View style={g.waitingBox}>
            <Text style={g.waitingTxt}>
              {gs.seats.filter(Boolean).length < 2 ? 'Need 2+ players' : 'Hand starting soon...'}
            </Text>
            <TouchableOpacity
              style={g.codeBox}
              onPress={() => { Clipboard.setString(gs.tableId); }}
              activeOpacity={0.7}
            >
              <Text style={g.codeLabel}>SHARE CODE</Text>
              <Text style={g.codeValue}>{gs.tableId}</Text>
              <Ionicons name="copy-outline" size={11} color="#bf5fff" style={{ marginTop: 2 }} />
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MultiplayerGame() {
  const { gameState, sendAction, leaveTable, tableId } = useMultiplayer();
  const [raiseAmount, setRaiseAmount] = useState(0);
  const [showRaise, setShowRaise] = useState(false);
  const winAnim = useRef(new Animated.Value(0)).current;

  const gs: ClientGameState | null = gameState;

  useEffect(() => {
    if (!tableId) router.replace('/multiplayer/lobby' as any);
  }, [tableId]);

  useEffect(() => {
    if (gs) setRaiseAmount(gs.minRaise);
  }, [gs?.minRaise]);

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

  const handleLeave = () => {
    Alert.alert('Leave Table', 'Leave this table? You will be folded if in a hand.', [
      { text: 'Stay', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: () => {
        leaveTable();
        router.replace('/multiplayer/lobby' as any);
      }},
    ]);
  };

  if (!gs) {
    return (
      <LinearGradient colors={['#050010', '#0a0020']} style={g.root}>
        <SafeAreaView style={[g.safe, { alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={g.joiningTxt}>JOINING TABLE...</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const mySeat      = gs.mySeat !== -1 ? gs.seats[gs.mySeat] : null;
  const opponents   = gs.seats.filter((s, i) => s !== null && i !== gs.mySeat) as SeatView[];
  const canCheck    = gs.isMyTurn && gs.callAmount === 0;
  const canCall     = gs.isMyTurn && gs.callAmount > 0;
  const canRaise    = gs.isMyTurn && gs.maxRaise > 0;
  const phase       = gs.phase.toUpperCase();
  const myWin       = (gs.winners ?? []).find(w => w.seatIndex === gs.mySeat);

  const handleRaise = () => { sendAction('raise', raiseAmount); setShowRaise(false); };

  // Layout: top row (up to 4 opponents), table, my section
  // Split opponents into top-row (max 3) and side (up to 1 each side)
  const topOpps  = opponents.slice(0, Math.min(opponents.length, 3));
  const leftOpp  = opponents[3] ?? null;
  const rightOpp = opponents[4] ?? null;

  return (
    <LinearGradient colors={['#050010', '#080018', '#050010']} style={g.root}>
      <SafeAreaView style={g.safe} edges={['top', 'bottom']}>

        {/* ── Header ── */}
        <View style={g.header}>
          <TouchableOpacity style={g.leaveBtn} onPress={handleLeave}>
            <Ionicons name="exit-outline" size={16} color="#ff4444" />
            <Text style={g.leaveTxt}>LEAVE</Text>
          </TouchableOpacity>

          <View style={g.headerCenter}>
            <Text style={g.phaseTxt}>{phase}</Text>
            <Text style={g.tableIdTxt}>#{gs.tableId.slice(-6).toUpperCase()}</Text>
          </View>

          <View style={g.potBadge}>
            <Text style={g.potLabel}>POT</Text>
            <Text style={g.potBig}>{formatChips(gs.pot)}</Text>
          </View>
        </View>

        {/* ── Top opponents row ── */}
        <View style={g.topRow}>
          {topOpps.length === 0 ? (
            <View style={g.emptySeats}>
              <Text style={g.emptyTxt}>
                {gs.phase === 'waiting' ? 'Waiting for players...' : ''}
              </Text>
            </View>
          ) : (
            topOpps.map(opp => (
              <SeatBubble key={opp.seatIndex} seat={opp} gameState={gs} style={g.topSeat} />
            ))
          )}
        </View>

        {/* ── Middle: side seats + table ── */}
        <View style={g.middleRow}>
          <View style={g.sideCol}>
            {leftOpp && <SeatBubble seat={leftOpp} gameState={gs} />}
          </View>

          <TableSurface gs={gs} />

          <View style={g.sideCol}>
            {rightOpp && <SeatBubble seat={rightOpp} gameState={gs} />}
          </View>
        </View>

        {/* ── Divider ── */}
        <View style={g.divider} />

        {/* ── My section ── */}
        <View style={g.mySection}>

          {/* My hand + stats */}
          <View style={g.myRow}>
            <View style={g.myCards}>
              {gs.phase !== 'waiting' ? (
                gs.myCards.length > 0
                  ? gs.myCards.map((c, i) => <PokerCard key={i} card={c} size="lg" />)
                  : [0,1].map(i => <PokerCard key={i} faceDown size="lg" />)
              ) : (
                [0,1].map(i => <PokerCard key={i} faceDown size="lg" />)
              )}
            </View>

            <View style={g.myStats}>
              {mySeat?.isDealer && (
                <View style={g.myDealerBadge}><Text style={g.dealerDotTxt}>D</Text></View>
              )}
              <Text style={g.myName} numberOfLines={1}>{mySeat?.username ?? 'YOU'}</Text>
              <Text style={g.myChips}>{formatChips(mySeat?.chips ?? 0)}</Text>
              {(mySeat?.currentBet ?? 0) > 0 && (
                <View style={g.myBetRow}>
                  <Text style={g.myBetLabel}>BET </Text>
                  <Text style={g.myBetValue}>{formatChips(mySeat!.currentBet)}</Text>
                </View>
              )}
              {mySeat?.status === 'allin' && (
                <View style={[g.allinTag, { marginTop: 4 }]}><Text style={g.allinTxt}>ALL IN</Text></View>
              )}
            </View>
          </View>

          {/* Timer */}
          {gs.isMyTurn && gs.turnTimeoutAt && (
            <TurnTimer timeoutAt={gs.turnTimeoutAt} />
          )}

          {/* Win banner */}
          {myWin && (
            <Animated.View style={[g.winBanner, { opacity: winAnim }]}>
              <Ionicons name="trophy" size={16} color="#ffd700" />
              <Text style={g.winTxt}>YOU WIN {formatChips(myWin.amount)}!</Text>
              {myWin.handRank && <Text style={g.winHand}>{myWin.handRank}</Text>}
            </Animated.View>
          )}

          {/* Actions */}
          {gs.isMyTurn && gs.phase !== 'showdown' && gs.phase !== 'waiting' ? (
            showRaise ? (
              <View style={g.raisePanel}>
                <View style={g.raiseHeader}>
                  <Text style={g.raiseHeaderTxt}>RAISE AMOUNT</Text>
                  <TouchableOpacity onPress={() => setShowRaise(false)}>
                    <Ionicons name="close" size={18} color="#666" />
                  </TouchableOpacity>
                </View>
                <View style={g.raiseControls}>
                  <TouchableOpacity style={g.raiseAdj} onPress={() => setRaiseAmount(v => Math.max(gs.minRaise, v - gs.bigBlind))}>
                    <Text style={g.raiseAdjTxt}>−</Text>
                  </TouchableOpacity>
                  <Text style={g.raiseVal}>{formatChips(raiseAmount)}</Text>
                  <TouchableOpacity style={g.raiseAdj} onPress={() => setRaiseAmount(v => Math.min(gs.maxRaise, v + gs.bigBlind))}>
                    <Text style={g.raiseAdjTxt}>+</Text>
                  </TouchableOpacity>
                </View>
                <View style={g.presets}>
                  {[2, 3, 4].map(mult => {
                    const v = Math.min(gs.maxRaise, gs.bigBlind * mult * 2);
                    return (
                      <TouchableOpacity key={mult} style={g.presetBtn} onPress={() => setRaiseAmount(v)}>
                        <Text style={g.presetTxt}>{mult}x</Text>
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity style={[g.presetBtn, { borderColor: '#bf5fff50' }]} onPress={() => setRaiseAmount(gs.maxRaise)}>
                    <Text style={[g.presetTxt, { color: '#bf5fff' }]}>MAX</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={g.confirmRaise} onPress={handleRaise}>
                  <LinearGradient colors={['#ff0090', '#cc0070']} style={g.confirmRaiseGrad} start={{x:0,y:0}} end={{x:1,y:0}}>
                    <Text style={g.confirmRaiseTxt}>RAISE {formatChips(raiseAmount)}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={g.actionRow}>
                <TouchableOpacity style={g.foldBtn} onPress={() => sendAction('fold')}>
                  <Text style={g.foldTxt}>FOLD</Text>
                </TouchableOpacity>

                {canCheck && (
                  <TouchableOpacity style={g.checkBtn} onPress={() => sendAction('check')}>
                    <Text style={g.checkTxt}>CHECK</Text>
                  </TouchableOpacity>
                )}

                {canCall && (
                  <TouchableOpacity style={g.callBtn} onPress={() => sendAction('call')}>
                    <LinearGradient colors={['#00d4ff', '#0088cc']} style={g.btnGrad} start={{x:0,y:0}} end={{x:1,y:0}}>
                      <Text style={g.callTxt}>CALL{'\n'}{formatChips(gs.callAmount)}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}

                {canRaise && (
                  <TouchableOpacity style={g.raiseBtn} onPress={() => setShowRaise(true)}>
                    <LinearGradient colors={['#ff0090', '#cc0070']} style={g.btnGrad} start={{x:0,y:0}} end={{x:1,y:0}}>
                      <Text style={g.raiseTxt}>RAISE</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={g.allinBtn} onPress={() => sendAction('allin')}>
                  <LinearGradient colors={['#bf5fff', '#7b2fff']} style={g.btnGrad} start={{x:0,y:0}} end={{x:1,y:0}}>
                    <Text style={g.raiseTxt}>ALL IN</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )
          ) : gs.phase !== 'showdown' && gs.phase !== 'waiting' ? (
            <View style={g.waitRow}>
              <Ionicons name="time-outline" size={14} color="#444" />
              <Text style={g.waitTxt}>
                {gs.activeSeat !== -1 && gs.seats[gs.activeSeat]
                  ? `Waiting for ${gs.seats[gs.activeSeat]!.username}...`
                  : 'Waiting for action...'}
              </Text>
            </View>
          ) : null}
        </View>

        {/* ── Action log ── */}
        <ScrollView
          style={g.logScroll}
          contentContainerStyle={g.logContent}
          showsVerticalScrollIndicator={false}
        >
          {gs.messages.slice(0, 5).map((msg, i) => (
            <Text key={i} style={[g.logMsg,
              msg.type === 'result' ? { color: '#ffcc00' } :
              msg.type === 'info'   ? { color: '#444' }    : { color: '#555' }
            ]}>
              {msg.text}
            </Text>
          ))}
        </ScrollView>

      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const g = StyleSheet.create({
  root:     { flex: 1 },
  safe:     { flex: 1 },
  joiningTxt: { color: '#444', fontFamily: 'Orbitron_400Regular', fontSize: 14, letterSpacing: 1 },

  // Header
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8 },
  leaveBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#ff444430', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  leaveTxt:     { color: '#ff4444', fontFamily: 'Orbitron_700Bold', fontSize: 9, letterSpacing: 1 },
  headerCenter: { flex: 1, alignItems: 'center' },
  phaseTxt:     { color: '#00d4ff', fontFamily: 'Orbitron_700Bold', fontSize: 11, letterSpacing: 2 },
  tableIdTxt:   { color: '#2a2a3a', fontFamily: 'Orbitron_400Regular', fontSize: 8, marginTop: 1 },
  potBadge:     { alignItems: 'flex-end' },
  potLabel:     { color: '#555', fontFamily: 'Orbitron_400Regular', fontSize: 8, letterSpacing: 1 },
  potBig:       { color: '#ffcc00', fontFamily: 'Inter_700Bold', fontSize: 16 },

  // Seat layout
  topRow:     { flexDirection: 'row', justifyContent: 'center', paddingHorizontal: 8, gap: 6, minHeight: 110 },
  topSeat:    { flex: 1, maxWidth: 110 },
  emptySeats: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTxt:   { color: '#2a2a3a', fontFamily: 'Orbitron_400Regular', fontSize: 11 },

  middleRow:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 },
  sideCol:    { width: 100, alignItems: 'center' },

  // Seat bubble
  seatBubble:   { alignItems: 'center', borderRadius: 14, padding: 4, overflow: 'hidden' },
  seatFolded:   { opacity: 0.3 },
  seatBorder:   { alignItems: 'center', borderWidth: 1, borderRadius: 13, padding: 8, backgroundColor: 'rgba(255,255,255,0.02)', minWidth: 90 },
  seatAvatar:   { width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 4, position: 'relative' },
  seatInitials: { fontFamily: 'Orbitron_700Bold', fontSize: 12 },
  seatCards:    { flexDirection: 'row', gap: 3, marginBottom: 4 },
  seatName:     { color: '#bbb', fontFamily: 'Orbitron_400Regular', fontSize: 8, letterSpacing: 0.5, maxWidth: 80, textAlign: 'center' },
  seatChips:    { fontFamily: 'Inter_700Bold', fontSize: 12, marginTop: 1 },
  betPill:      { marginTop: 4, borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: 'rgba(0,212,255,0.1)' },
  betPillTxt:   { fontFamily: 'Inter_700Bold', fontSize: 9 },
  handTag:      { marginTop: 4, backgroundColor: '#ffcc0018', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  handTagTxt:   { color: '#ffcc00', fontFamily: 'Orbitron_400Regular', fontSize: 7 },
  dealerDot:    { position: 'absolute', top: -4, right: -4, width: 15, height: 15, borderRadius: 8, backgroundColor: '#ffd700', alignItems: 'center', justifyContent: 'center' },
  dealerDotTxt: { color: '#000', fontSize: 7, fontFamily: 'Orbitron_700Bold' },
  allinTag:     { position: 'absolute', bottom: -6, backgroundColor: '#ff0090', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
  allinTxt:     { color: '#fff', fontSize: 6, fontFamily: 'Orbitron_700Bold' },

  // Table surface
  tableOuter: { flex: 1, aspectRatio: 1.5, borderRadius: 80, overflow: 'hidden', borderWidth: 4, borderColor: '#3d1800', elevation: 8, shadowColor: '#000', shadowRadius: 12, shadowOpacity: 0.5, maxHeight: 180 },
  tableInner: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  feltRing:   { position: 'absolute', top: 8, left: 8, right: 8, bottom: 8, borderRadius: 72, borderWidth: 2, borderColor: '#1a5c2a50' },
  blindsRow:  { flexDirection: 'row', gap: 14 },
  blindTxt:   { color: '#1a5c2a', fontFamily: 'Orbitron_400Regular', fontSize: 8, letterSpacing: 0.5 },
  communityRow: { flexDirection: 'row', gap: 4 },
  potRow:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  potTxt:     { color: '#ffd700', fontFamily: 'Inter_700Bold', fontSize: 13 },
  waitingBox: { alignItems: 'center', gap: 6 },
  waitingTxt: { color: '#1a5c2a', fontFamily: 'Orbitron_400Regular', fontSize: 9, textAlign: 'center' },
  codeBox:    { alignItems: 'center', borderWidth: 1, borderColor: '#bf5fff40', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5, backgroundColor: 'rgba(191,95,255,0.08)' },
  codeLabel:  { color: '#bf5fff80', fontFamily: 'Orbitron_400Regular', fontSize: 7, letterSpacing: 1.5 },
  codeValue:  { color: '#bf5fff', fontFamily: 'Orbitron_700Bold', fontSize: 14, letterSpacing: 3 },

  divider:    { height: 1, backgroundColor: '#ffffff08', marginVertical: 6 },

  // My section
  mySection:  { paddingHorizontal: 14 },
  myRow:      { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 8 },
  myCards:    { flexDirection: 'row', gap: 6 },
  myStats:    { flex: 1 },
  myDealerBadge: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#ffd700', alignItems: 'center', justifyContent: 'center', marginBottom: 3 },
  myName:     { color: '#888', fontFamily: 'Orbitron_400Regular', fontSize: 9, letterSpacing: 0.5, marginBottom: 2 },
  myChips:    { color: '#ffcc00', fontFamily: 'Inter_700Bold', fontSize: 20 },
  myBetRow:   { flexDirection: 'row', alignItems: 'baseline', marginTop: 2 },
  myBetLabel: { color: '#555', fontFamily: 'Orbitron_400Regular', fontSize: 9 },
  myBetValue: { color: '#00d4ff', fontFamily: 'Inter_700Bold', fontSize: 14 },

  // Timer
  timerWrap:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  timerTrack: { flex: 1, height: 4, backgroundColor: '#111128', borderRadius: 2, overflow: 'hidden' },
  timerFill:  { height: 4, borderRadius: 2 },
  timerNum:   { fontFamily: 'Inter_700Bold', fontSize: 12, minWidth: 30, textAlign: 'right' },

  // Win banner
  winBanner:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#ffd70015', borderWidth: 1, borderColor: '#ffd70060', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 8, justifyContent: 'center' },
  winTxt:     { color: '#ffd700', fontFamily: 'Orbitron_700Bold', fontSize: 13, letterSpacing: 1 },
  winHand:    { color: '#ffcc00', fontFamily: 'Orbitron_400Regular', fontSize: 10 },

  // Action buttons
  actionRow:   { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 6 },
  foldBtn:     { flex: 1, minWidth: 60, paddingVertical: 13, alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: '#ff444440', backgroundColor: 'rgba(255,68,68,0.08)' },
  foldTxt:     { color: '#ff4444', fontFamily: 'Orbitron_700Bold', fontSize: 10, letterSpacing: 1 },
  checkBtn:    { flex: 1.2, paddingVertical: 13, alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: '#00ff8840', backgroundColor: 'rgba(0,255,136,0.07)' },
  checkTxt:    { color: '#00ff88', fontFamily: 'Orbitron_700Bold', fontSize: 10, letterSpacing: 1 },
  callBtn:     { flex: 1.4, borderRadius: 10, overflow: 'hidden' },
  raiseBtn:    { flex: 1.2, borderRadius: 10, overflow: 'hidden' },
  allinBtn:    { flex: 1, borderRadius: 10, overflow: 'hidden' },
  btnGrad:     { paddingVertical: 13, alignItems: 'center' },
  callTxt:     { color: '#000', fontFamily: 'Orbitron_700Bold', fontSize: 9, letterSpacing: 1, textAlign: 'center' },
  raiseTxt:    { color: '#fff', fontFamily: 'Orbitron_700Bold', fontSize: 10, letterSpacing: 1 },

  // Raise panel
  raisePanel:  { backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: '#ff009030', borderRadius: 14, padding: 14, marginBottom: 6 },
  raiseHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  raiseHeaderTxt: { color: '#888', fontFamily: 'Orbitron_400Regular', fontSize: 9, letterSpacing: 1 },
  raiseControls:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 10 },
  raiseAdj:    { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1a1a2a', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#333' },
  raiseAdjTxt: { color: '#fff', fontSize: 20, fontFamily: 'Inter_700Bold' },
  raiseVal:    { color: '#ff0090', fontFamily: 'Inter_700Bold', fontSize: 22, minWidth: 80, textAlign: 'center' },
  presets:     { flexDirection: 'row', gap: 8, marginBottom: 12 },
  presetBtn:   { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#333' },
  presetTxt:   { color: '#888', fontFamily: 'Orbitron_700Bold', fontSize: 10 },
  confirmRaise: { borderRadius: 10, overflow: 'hidden' },
  confirmRaiseGrad: { paddingVertical: 13, alignItems: 'center' },
  confirmRaiseTxt: { color: '#fff', fontFamily: 'Orbitron_700Bold', fontSize: 12, letterSpacing: 1 },

  // Wait
  waitRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 12, justifyContent: 'center' },
  waitTxt:   { color: '#444', fontFamily: 'Orbitron_400Regular', fontSize: 11 },

  // Card
  card: { borderRadius: 7, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },

  // Log
  logScroll:   { flex: 1, marginTop: 4 },
  logContent:  { paddingHorizontal: 14, paddingBottom: 8, gap: 2 },
  logMsg:      { fontSize: 10, fontFamily: 'Orbitron_400Regular', letterSpacing: 0.3 },
});
