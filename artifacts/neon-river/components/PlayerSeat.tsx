import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PlayingCard from './PlayingCard';
import DotTimer from './DotTimer';
import { Card } from '../lib/pokerEngine';
import colors from '../constants/colors';

export type SeatStatus = 'active' | 'folded' | 'allIn' | 'empty' | 'winner';

const AVATARS = ['♠', '♥', '♦', '♣', '★'];
const AVATAR_COLORS = [colors.primary, colors.secondary, colors.accent, colors.gold, colors.success];

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
}: PlayerSeatProps) {
  const isFolded = status === 'folded';
  const isAllIn = status === 'allIn';
  const isWinner = status === 'winner';
  const avatarSymbol = AVATARS[avatarIndex % AVATARS.length];
  const avatarColor = AVATAR_COLORS[avatarIndex % AVATAR_COLORS.length];

  const glowColor = isCurrentTurn ? colors.primary : isWinner ? colors.gold : 'transparent';

  const formatChips = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
  };

  return (
    <View style={[styles.container, isFolded && styles.foldedContainer]}>
      {isCurrentTurn && (
        <View style={[styles.turnGlow, { shadowColor: glowColor }]} />
      )}

      {isCurrentTurn && !isHuman && (
        <View style={styles.dotTimerRow}>
          <DotTimer seconds={timer} maxSeconds={30} isActive size={6} gap={3} />
        </View>
      )}

      <View style={[styles.avatarRow]}>
        <View
          style={[
            styles.avatar,
            { borderColor: isCurrentTurn ? glowColor : avatarColor },
            isCurrentTurn && { shadowColor: glowColor, shadowOpacity: 0.8, shadowRadius: 8 },
            isWinner && { borderColor: colors.gold },
          ]}
        >
          <Text style={[styles.avatarText, { color: avatarColor }]}>{avatarSymbol}</Text>
          {isFolded && (
            <View style={styles.foldedOverlay}>
              <Ionicons name="close" size={16} color={colors.error} />
            </View>
          )}
        </View>
      </View>

      <Text style={[styles.name, isFolded && styles.foldedText]} numberOfLines={1}>
        {name}
      </Text>

      <View style={styles.chipsRow}>
        {isAllIn ? (
          <Text style={styles.allInBadge}>ALL IN</Text>
        ) : isWinner ? (
          <Text style={styles.winnerBadge}>WINNER</Text>
        ) : (
          <Text style={[styles.chips, isFolded && styles.foldedText]}>
            {formatChips(chips)}
          </Text>
        )}
      </View>

      {betInRound > 0 && status !== 'folded' && (
        <View style={styles.betBadge}>
          <Text style={styles.betText}>{formatChips(betInRound)}</Text>
        </View>
      )}

      <View style={styles.cards}>
        {holeCards.length > 0 ? (
          holeCards.map((card, i) => (
            <PlayingCard
              key={i}
              card={card}
              faceDown={!showCards && !isHuman}
              size="md"
            />
          ))
        ) : (
          <>
            <PlayingCard faceDown size="md" />
            <PlayingCard faceDown size="md" />
          </>
        )}
      </View>

      <View style={styles.badges}>
        {isDealer && <Text style={styles.dealerBadge}>D</Text>}
        {isSmallBlind && <Text style={styles.sbBadge}>SB</Text>}
        {isBigBlind && <Text style={styles.bbBadge}>BB</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 90,
  },
  foldedContainer: {
    opacity: 0.4,
  },
  turnGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: colors.radius,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 12,
    elevation: 0,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
    overflow: 'hidden',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
  },
  foldedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotTimerRow: {
    marginBottom: 4,
    alignItems: 'center',
  },
  name: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: 80,
  },
  foldedText: {
    color: colors.textDim,
  },
  chipsRow: {
    marginTop: 2,
  },
  chips: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: '700',
  },
  allInBadge: {
    color: colors.secondary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  winnerBadge: {
    color: colors.gold,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  betBadge: {
    marginTop: 2,
    backgroundColor: 'rgba(0,212,255,0.15)',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: colors.primaryDim,
  },
  betText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '600',
  },
  cards: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 4,
  },
  badges: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 3,
  },
  dealerBadge: {
    backgroundColor: colors.gold,
    color: colors.background,
    fontSize: 8,
    fontWeight: '800',
    width: 16,
    height: 16,
    borderRadius: 8,
    textAlign: 'center',
    lineHeight: 16,
  },
  sbBadge: {
    backgroundColor: colors.primary,
    color: colors.background,
    fontSize: 7,
    fontWeight: '800',
    paddingHorizontal: 3,
    borderRadius: 4,
    lineHeight: 14,
  },
  bbBadge: {
    backgroundColor: colors.secondary,
    color: colors.background,
    fontSize: 7,
    fontWeight: '800',
    paddingHorizontal: 3,
    borderRadius: 4,
    lineHeight: 14,
  },
});
