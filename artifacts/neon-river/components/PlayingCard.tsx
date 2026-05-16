import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Card, isRedSuit, suitSymbol, valueLabel } from '../lib/pokerEngine';
import { SoundEngine } from '../lib/soundEngine';
import FaceCardArt from './FaceCardArt';
import colors from '../constants/colors';

interface PlayingCardProps {
  card?: Card;
  faceDown?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  highlighted?: boolean;
  animated?: boolean;
}

const SIZES = {
  sm: { w: 30, h: 42, cornerFont: 8, cornerSuit: 7, centerSuit: 14, radius: 4, artSize: 18 },
  md: { w: 42, h: 58, cornerFont: 10, cornerSuit: 9, centerSuit: 22, radius: 5, artSize: 26 },
  lg: { w: 56, h: 78, cornerFont: 13, cornerSuit: 11, centerSuit: 30, radius: 7, artSize: 36 },
  xl: { w: 70, h: 98, cornerFont: 16, cornerSuit: 14, centerSuit: 38, radius: 9, artSize: 48 },
};

const FACE_VALUES = new Set(['J', 'Q', 'K']);

export default function PlayingCard({
  card,
  faceDown = false,
  size = 'md',
  highlighted = false,
  animated: doAnimate = true,
}: PlayingCardProps) {
  const dim = SIZES[size];

  // ─── Flip animation ───────────────────────────────────────────────────────
  // flipAnim: 0 = back showing, 1 = front showing
  const flipAnim = useRef(new Animated.Value(faceDown || !card ? 0 : 1)).current;
  const prevFaceDown = useRef(faceDown);
  const prevCard = useRef(card);

  useEffect(() => {
    const wasFaceDown = prevFaceDown.current;
    const wasCard = prevCard.current;
    prevFaceDown.current = faceDown;
    prevCard.current = card;

    const isVisible = !faceDown && !!card;
    const wasVisible = !wasFaceDown && !!wasCard;

    if (isVisible && !wasVisible) {
      if (doAnimate) {
        SoundEngine.cardFlip();
        flipAnim.setValue(0);
        Animated.timing(flipAnim, {
          toValue: 1,
          duration: 340,
          useNativeDriver: true,
        }).start();
      } else {
        flipAnim.setValue(1);
      }
    } else if (!isVisible && wasVisible) {
      flipAnim.setValue(0);
    } else if (isVisible) {
      flipAnim.setValue(1);
    }
  }, [faceDown, card]);

  // Front interpolation: swings in from left (90→0 deg)
  const frontRotateY = flipAnim.interpolate({
    inputRange: [0, 0.49, 0.5, 1],
    outputRange: ['90deg', '90deg', '0deg', '0deg'],
  });
  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 0.49, 0.5, 1],
    outputRange: [0, 0, 1, 1],
  });
  // Back interpolation: swings out to right (0→-90 deg)
  const backRotateY = flipAnim.interpolate({
    inputRange: [0, 0.49, 0.5, 1],
    outputRange: ['0deg', '-90deg', '-90deg', '-90deg'],
  });
  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 0.49, 0.5, 1],
    outputRange: [1, 1, 0, 0],
  });

  // ─── Card content ─────────────────────────────────────────────────────────
  const isRed = card ? isRedSuit(card.suit) : false;
  const textColor = isRed ? colors.heartDiamond : colors.spadeClub;
  const val = card ? valueLabel(card.value) : '';
  const suit = card ? suitSymbol(card.suit) : '';
  const isFaceCard = FACE_VALUES.has(val);

  const cardStyle = [
    styles.card,
    { width: dim.w, height: dim.h, borderRadius: dim.radius },
    highlighted && styles.highlighted,
  ];

  return (
    <View style={{ width: dim.w, height: dim.h }}>
      {/* ── Back face ─────────────────────────────────────────────────────── */}
      {/* perspective must live in a non-animated View so useNativeDriver:true */}
      {/* only sees natively-supported animated properties (rotateY, opacity)  */}
      <View style={[StyleSheet.absoluteFillObject, { transform: [{ perspective: 1200 }] }]}>
        <Animated.View
          style={[
            cardStyle,
            styles.faceDown,
            StyleSheet.absoluteFillObject,
            { opacity: backOpacity, transform: [{ rotateY: backRotateY }] },
          ]}
        >
          <View style={[styles.backInner, { borderRadius: dim.radius - 2 }]}>
            <View style={styles.backDiamond}>
              <Text style={[styles.backSymbol, { fontSize: dim.centerSuit * 0.55 }]}>♠</Text>
            </View>
          </View>
        </Animated.View>
      </View>

      {/* ── Front face ────────────────────────────────────────────────────── */}
      {card && (
        <View style={[StyleSheet.absoluteFillObject, { transform: [{ perspective: 1200 }] }]}>
        <Animated.View
          style={[
            cardStyle,
            StyleSheet.absoluteFillObject,
            { opacity: frontOpacity, transform: [{ rotateY: frontRotateY }] },
          ]}
        >
          {/* Top-left corner */}
          <View style={styles.cornerTL}>
            <Text style={[styles.cornerVal, { fontSize: dim.cornerFont, color: textColor }]}>
              {val}
            </Text>
            <Text style={[styles.cornerSuit, { fontSize: dim.cornerSuit, color: textColor }]}>
              {suit}
            </Text>
          </View>

          {/* Center content */}
          <View style={styles.center}>
            {isFaceCard ? (
              <FaceCardArt
                value={val as 'J' | 'Q' | 'K'}
                isRed={isRed}
                size={dim.artSize}
              />
            ) : val === 'A' ? (
              <Text style={[styles.centerSuit, { fontSize: dim.centerSuit * 1.6, color: textColor }]}>
                {suit}
              </Text>
            ) : (
              <Text style={[styles.centerSuit, { fontSize: dim.centerSuit, color: textColor }]}>
                {suit}
              </Text>
            )}
          </View>

          {/* Bottom-right corner (rotated) */}
          <View style={styles.cornerBR}>
            <Text
              style={[
                styles.cornerVal,
                { fontSize: dim.cornerFont, color: textColor, transform: [{ rotate: '180deg' }] },
              ]}
            >
              {val}
            </Text>
            <Text
              style={[
                styles.cornerSuit,
                { fontSize: dim.cornerSuit, color: textColor, transform: [{ rotate: '180deg' }] },
              ]}
            >
              {suit}
            </Text>
          </View>
        </Animated.View>
        </View>
      )}
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
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
    overflow: 'hidden',
  },
  highlighted: {
    shadowColor: colors.gold,
    shadowOpacity: 0.9,
    shadowRadius: 14,
    borderWidth: 2,
    borderColor: colors.gold,
  },
  faceDown: {
    backgroundColor: '#18004a',
    borderWidth: 1.5,
    borderColor: '#5500cc',
  },
  backInner: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    backgroundColor: '#110035',
    borderWidth: 1,
    borderColor: '#7700ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backDiamond: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  backSymbol: {
    color: '#5500aa',
    opacity: 0.7,
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
    lineHeight: 13,
    marginTop: -2,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerSuit: {
    fontWeight: '700',
    textAlign: 'center',
  },
});
