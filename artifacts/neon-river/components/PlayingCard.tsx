import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, isRedSuit, suitSymbol, valueLabel } from '../lib/pokerEngine';
import colors from '../constants/colors';

interface PlayingCardProps {
  card?: Card;
  faceDown?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  highlighted?: boolean;
}

const SIZES = {
  sm: { w: 30, h: 42, font: 10, suit: 11, radius: 4 },
  md: { w: 42, h: 58, font: 14, suit: 16, radius: 5 },
  lg: { w: 56, h: 78, font: 18, suit: 20, radius: 7 },
  xl: { w: 70, h: 98, font: 22, suit: 26, radius: 9 },
};

export default function PlayingCard({ card, faceDown = false, size = 'md', highlighted = false }: PlayingCardProps) {
  const dim = SIZES[size];
  const isRed = card ? isRedSuit(card.suit) : false;
  const textColor = isRed ? colors.heartDiamond : colors.spadeClub;

  if (faceDown || !card) {
    return (
      <View style={[styles.card, { width: dim.w, height: dim.h, borderRadius: dim.radius }, styles.faceDown]}>
        <View style={[styles.backOuter, { borderRadius: dim.radius - 2 }]}>
          <View style={styles.backDiamond}>
            <Text style={styles.backSymbol}>♠</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.card,
        { width: dim.w, height: dim.h, borderRadius: dim.radius },
        highlighted && styles.highlighted,
      ]}
    >
      <View style={styles.cornerTL}>
        <Text style={[styles.cornerVal, { fontSize: dim.font - 2, color: textColor }]}>
          {valueLabel(card.value)}
        </Text>
        <Text style={[styles.cornerSuit, { fontSize: dim.font - 4, color: textColor }]}>
          {suitSymbol(card.suit)}
        </Text>
      </View>

      <Text style={[styles.centerSuit, { fontSize: dim.suit, color: textColor }]}>
        {suitSymbol(card.suit)}
      </Text>

      <View style={styles.cornerBR}>
        <Text style={[styles.cornerVal, { fontSize: dim.font - 2, color: textColor, transform: [{ rotate: '180deg' }] }]}>
          {valueLabel(card.value)}
        </Text>
        <Text style={[styles.cornerSuit, { fontSize: dim.font - 4, color: textColor, transform: [{ rotate: '180deg' }] }]}>
          {suitSymbol(card.suit)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#f8f4ef',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  highlighted: {
    shadowColor: colors.gold,
    shadowOpacity: 0.9,
    shadowRadius: 12,
    borderWidth: 2,
    borderColor: colors.gold,
  },
  faceDown: {
    backgroundColor: '#1a0050',
    borderWidth: 1.5,
    borderColor: '#6600cc',
  },
  backOuter: {
    flex: 1,
    width: '88%',
    margin: 4,
    backgroundColor: '#120035',
    borderWidth: 1,
    borderColor: '#8800ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backDiamond: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  backSymbol: {
    fontSize: 18,
    color: '#6600cc',
    opacity: 0.6,
  },
  cornerTL: {
    position: 'absolute',
    top: 4,
    left: 5,
    alignItems: 'center',
  },
  cornerBR: {
    position: 'absolute',
    bottom: 4,
    right: 5,
    alignItems: 'center',
  },
  cornerVal: {
    fontWeight: '900',
    lineHeight: 18,
  },
  cornerSuit: {
    fontWeight: '700',
    lineHeight: 14,
  },
  centerSuit: {
    fontWeight: '700',
  },
});
