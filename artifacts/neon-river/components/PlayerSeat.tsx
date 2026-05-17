import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import PlayingCard from './PlayingCard';
import ArcTimer from './ArcTimer';
import { Card } from '../lib/pokerEngine';
import colors from '../constants/colors';

export type SeatStatus = 'active' | 'folded' | 'allIn' | 'empty' | 'winner';

const AVATARS = ['♠', '♥', '♦', '♣', '★'];
const AVATAR_COLORS = [colors.primary, colors.secondary, colors.accent, colors.gold, colors.success];

const ACTION_COLORS: Record<string, string> = {
  FOLD: '#ff4444',
  CHECK: '#00ff88',
  CALL: '#00d4ff',
  RAISE: '#bf5fff',
  'ALL IN': '#ff0090',
};

const AVATAR_SIZE = 30;
const ARC_SIZE = 44;

interface PlayerSeatProps {
  name: string;
  chips: number;
  holeCards: Card[];
  status: SeatStatus;
  isCurrentTurn: boolean;
  isDealer: boolean;
  isSmallBlind: boolean;
  isBigBlind: boolean;
  betInRound: number;
  timer: number;
  showCards: boolean;
  avatarIndex?: number;
  isHuman?: boolean;
  lastAction?: string;
  handName?: string;
}

export default function PlayerSeat({
  name,
  chips,
  holeCards,
  status,
  isCurrentTurn,
  isDealer,
  isSmallBlind,
  isBigBlind,
  betInRound,
  timer,
  showCards,
  avatarIndex = 0,
  isHuman = false,
  lastAction,
  handName,
}: PlayerSeatProps) {
  const isFolded = status === 'folded';
  const isAllIn = status === 'allIn';
  const isWinner = status === 'winner';
  const avatarColor = AVATAR_COLORS[avatarIndex % AVATAR_COLORS.length];
  const avatarSymbol = AVATARS[avatarIndex % AVATARS.length];

  const glowBorderColor = isWinner
    ? colors.gold
    : isCurrentTurn
    ? '#00d4ff'
    : isFolded
    ? 'rgba(255,255,255,0.12)'
    : avatarColor;

  const glowNeonColor = isWinner ? colors.gold : '#00d4ff';

  const glowPulse = useRef(new Animated.Value(0)).current;
  const glowLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isCurrentTurn) {
      glowLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(glowPulse, { toValue: 1, duration: 650, useNativeDriver: true }),
          Animated.timing(glowPulse, { toValue: 0.25, duration: 650, useNativeDriver: true }),
        ])
      );
      glowLoop.current.start();
    } else {
      glowLoop.current?.stop();
      glowPulse.setValue(0);
    }
    return () => { glowLoop.current?.stop(); };
  }, [isCurrentTurn]);

  const actionOpacity = useRef(new Animated.Value(0)).current;
  const actionTransY = useRef(new Animated.Value(6)).current;
  const prevAction = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (lastAction && lastAction !== prevAction.current) {
      prevAction.current = lastAction;
      actionOpacity.setValue(0);
      actionTransY.setValue(6);
      Animated.sequence([
        Animated.parallel([
          Animated.timing(actionOpacity, { toValue: 1, duration: 170, useNativeDriver: true }),
          Animated.timing(actionTransY, { toValue: 0, duration: 170, useNativeDriver: true }),
        ]),
        Animated.delay(1300),
        Animated.timing(actionOpacity, { toValue: 0, duration: 260, useNativeDriver: true }),
      ]).start();
    } else if (!lastAction) {
      prevAction.current = undefined;
      actionOpacity.setValue(0);
    }
  }, [lastAction]);

  const formatChips = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
  };

  return (
    <View style={[styles.container, isFolded && styles.foldedContainer]}>
      {/* Cards (face down for AI) */}
      <View style={styles.cardsRow}>
        {holeCards.length > 0 ? (
          holeCards.map((card, i) => (
            <PlayingCard
              key={i}
              card={card}
              faceDown={!(showCards && !isFolded) && !isHuman}
              size="sm"
              animated={false}
            />
          ))
        ) : (
          <>
            <PlayingCard faceDown size="sm" animated={false} />
            <PlayingCard faceDown size="sm" animated={false} />
          </>
        )}
      </View>

      {/* Avatar + arc timer */}
      <View style={styles.avatarArea}>
        {/* Outer neon glow pulse */}
        {(isCurrentTurn || isWinner) && (
          <Animated.View
            style={[
              styles.glowRing,
              {
                opacity: isWinner ? 1 : glowPulse,
                borderColor: glowNeonColor,
                shadowColor: glowNeonColor,
              },
            ]}
          />
        )}

        {/* Arc timer (only for AI when it's their turn) */}
        {isCurrentTurn && !isHuman && (
          <ArcTimer seconds={timer} maxSeconds={30} size={ARC_SIZE} strokeWidth={3.5} />
        )}

        {/* Avatar circle */}
        <View
          style={[
            styles.avatar,
            { borderColor: glowBorderColor },
            isCurrentTurn && { borderWidth: 2.5 },
            isWinner && { borderColor: colors.gold, borderWidth: 2.5 },
          ]}
        >
          <Text style={[styles.avatarText, { color: isFolded ? colors.textDim : avatarColor }]}>{avatarSymbol}</Text>
        </View>

        {/* Position badge */}
        {(isDealer || isSmallBlind || isBigBlind) && (
          <View
            style={[
              styles.posBadge,
              isDealer && styles.dealerBadge,
              isSmallBlind && styles.sbBadge,
              isBigBlind && styles.bbBadge,
            ]}
          >
            <Text style={styles.posBadgeText}>
              {isDealer ? 'D' : isSmallBlind ? 'SB' : 'BB'}
            </Text>
          </View>
        )}
      </View>

      {/* Action label */}
      {lastAction ? (
        <Animated.View
          style={[
            styles.actionLabel,
            {
              backgroundColor: `${ACTION_COLORS[lastAction] ?? colors.primary}22`,
              borderColor: ACTION_COLORS[lastAction] ?? colors.primary,
              opacity: actionOpacity,
              transform: [{ translateY: actionTransY }],
            },
          ]}
        >
          <Text style={[styles.actionText, { color: ACTION_COLORS[lastAction] ?? colors.primary }]}>
            {lastAction}
          </Text>
        </Animated.View>
      ) : (
        <View style={styles.actionPlaceholder} />
      )}

      {/* Name */}
      <Text style={[styles.name, isFolded && styles.fadedText]} numberOfLines={1}>
        {name}
      </Text>

      {/* Chips / status */}
      {isAllIn ? (
        <View style={styles.allInPill}>
          <Text style={styles.allInText}>ALL IN</Text>
        </View>
      ) : isWinner ? (
        <Text style={styles.winnerText}>WINNER!</Text>
      ) : (
        <Text style={[styles.chipsText, isFolded && styles.fadedText]}>
          {formatChips(chips)}
        </Text>
      )}

      {/* Hand name — shown at showdown for non-folded players */}
      {handName && !isFolded && (
        <Text style={[styles.handNameText, isWinner && { color: colors.gold }]} numberOfLines={1}>
          {handName}
        </Text>
      )}

      {/* Bet badge */}
      {betInRound > 0 && status !== 'folded' && (
        <View style={styles.betBadge}>
          <Text style={styles.betText}>{formatChips(betInRound)}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 92,
  },
  foldedContainer: {
    opacity: 0.38,
  },

  cardsRow: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: 4,
  },

  avatarArea: {
    width: ARC_SIZE,
    height: ARC_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowRing: {
    position: 'absolute',
    width: ARC_SIZE + 10,
    height: ARC_SIZE + 10,
    borderRadius: (ARC_SIZE + 10) / 2,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.surface,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '700',
  },
  posBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dealerBadge: { backgroundColor: colors.gold },
  sbBadge: { backgroundColor: colors.primary },
  bbBadge: { backgroundColor: colors.secondary },
  posBadgeText: {
    fontSize: 7,
    fontWeight: '900',
    color: colors.background,
    letterSpacing: 0.2,
  },

  actionLabel: {
    marginTop: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 42,
    alignItems: 'center',
  },
  actionPlaceholder: {
    height: 18,
    marginTop: 4,
  },
  actionText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  name: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: 84,
    marginTop: 2,
  },
  fadedText: {
    color: colors.textDim,
  },

  chipsText: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  allInPill: {
    marginTop: 3,
    backgroundColor: 'rgba(255,0,144,0.18)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.secondary,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  allInText: {
    color: colors.secondary,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  winnerText: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 1,
  },

  handNameText: {
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.3,
    textAlign: 'center',
    maxWidth: 88,
    marginTop: 1,
  },

  betBadge: {
    marginTop: 3,
    backgroundColor: 'rgba(0,212,255,0.14)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primaryDim,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  betText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '700',
  },
});
