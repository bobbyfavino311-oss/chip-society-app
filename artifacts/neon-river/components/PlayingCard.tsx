import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, isRedSuit, suitSymbol, valueLabel } from '../lib/pokerEngine';
import colors from '../constants/colors';

interface PlayingCardProps {
  card?: Card;
  faceDown?: boolean;
  size?: 'sm' | 'md' | 'lg';
  highlighted?: boolean;
}

const SIZES = {
  sm: { w: 28, h: 40, font: 9, suit: 10 },
  md: { w: 38, h: 54, font: 13, suit: 14 },
  lg: { w: 52, h: 72, font: 17, suit: 18 },
};

export default function PlayingCard({ card, faceDown = false, size = 'md', highlighted = false }: PlayingCardProps) {
  const dim = SIZES[size];
  const isRed = card ? isRedSuit(card.suit) : false;
  const textColor = isRed ? colors.heartDiamond : colors.spadeClub;

  if (faceDown || !card) {
    return (
      <View style={[styles.card, { width: dim.w, height: dim.h }, styles.faceDown]}>
        <View style={styles.backPattern}>
          <View style={styles.backInner} />
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.card,
        { width: dim.w, height: dim.h },
        highlighted && styles.highlighted,
      ]}
    >
      <Text style={[styles.topLabel, { fontSize: dim.font, color: textColor }]}>
        {valueLabel(card.value)}
      </Text>
      <Text style={[styles.centerSuit, { fontSize: dim.suit, color: textColor }]}>
        {suitSymbol(card.suit)}
      </Text>
      <Text style={[styles.bottomLabel, { fontSize: dim.font, color: textColor }]}>
        {valueLabel(card.value)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  highlighted: {
    shadowColor: colors.gold,
    shadowOpacity: 0.8,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  faceDown: {
    backgroundColor: '#1a0040',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  backPattern: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a0040',
  },
  backInner: {
    width: '70%',
    height: '70%',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: colors.secondary,
    backgroundColor: '#110033',
  },
  topLabel: {
    position: 'absolute',
    top: 2,
    left: 3,
    fontWeight: '700',
    lineHeight: 13,
  },
  centerSuit: {
    fontWeight: '700',
  },
  bottomLabel: {
    position: 'absolute',
    bottom: 2,
    right: 3,
    fontWeight: '700',
    lineHeight: 13,
    transform: [{ rotate: '180deg' }],
  },
});
