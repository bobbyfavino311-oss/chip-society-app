import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { Card, isRedSuit, suitSymbol, valueLabel } from '../lib/pokerEngine';
import { SoundEngine } from '../lib/soundEngine';

interface PlayingCardProps {
  card?: Card;
  faceDown?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  highlighted?: boolean;
  animated?: boolean;
}

const SIZES = {
  sm:  { w: 32,  h: 46,  valFont: 14, suitFont: 11, radius: 6  },
  md:  { w: 46,  h: 64,  valFont: 20, suitFont: 15, radius: 8  },
  lg:  { w: 60,  h: 84,  valFont: 26, suitFont: 20, radius: 10 },
  xl:  { w: 76,  h: 106, valFont: 34, suitFont: 26, radius: 13 },
};

// ─── Circular mandala back pattern ────────────────────────────────────────────
function CardBack({ w, h, r }: { w: number; h: number; r: number }) {
  const cx = w / 2;
  const cy = h / 2;
  const maxR = Math.min(w, h) * 0.42;

  // 12 spokes radiating from center
  const spokes = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * 30 * Math.PI) / 180;
    return {
      x1: cx + Math.cos(angle) * maxR * 0.18,
      y1: cy + Math.sin(angle) * maxR * 0.18,
      x2: cx + Math.cos(angle) * maxR * 0.82,
      y2: cy + Math.sin(angle) * maxR * 0.82,
    };
  });

  return (
    <View style={[StyleSheet.absoluteFillObject, { borderRadius: r, overflow: 'hidden', backgroundColor: '#c0182a' }]}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        {/* Outer ring */}
        <Circle cx={cx} cy={cy} r={maxR} stroke="rgba(255,255,255,0.22)" strokeWidth={1.2} fill="none" />
        {/* Mid ring */}
        <Circle cx={cx} cy={cy} r={maxR * 0.7} stroke="rgba(255,255,255,0.18)" strokeWidth={0.9} fill="none" />
        {/* Inner ring */}
        <Circle cx={cx} cy={cy} r={maxR * 0.42} stroke="rgba(255,255,255,0.2)" strokeWidth={0.9} fill="none" />
        {/* Tiny center dot ring */}
        <Circle cx={cx} cy={cy} r={maxR * 0.16} stroke="rgba(255,255,255,0.28)" strokeWidth={0.8} fill="none" />
        {/* Spokes */}
        {spokes.map((s, i) => (
          <Line
            key={i}
            x1={s.x1} y1={s.y1}
            x2={s.x2} y2={s.y2}
            stroke="rgba(255,255,255,0.14)"
            strokeWidth={0.8}
          />
        ))}
        {/* 8 petal dots on mid ring */}
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i * 45 * Math.PI) / 180;
          return (
            <Circle
              key={i}
              cx={cx + Math.cos(a) * maxR * 0.7}
              cy={cy + Math.sin(a) * maxR * 0.7}
              r={maxR * 0.055}
              fill="rgba(255,255,255,0.3)"
            />
          );
        })}
        {/* Center dot */}
        <Circle cx={cx} cy={cy} r={maxR * 0.07} fill="rgba(255,255,255,0.35)" />
      </Svg>
      {/* Subtle border inset */}
      <View style={{
        position: 'absolute', top: 3, left: 3, right: 3, bottom: 3,
        borderRadius: r - 2, borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
      }} />
    </View>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function PlayingCard({
  card,
  faceDown = false,
  size = 'md',
  highlighted = false,
  animated: doAnimate = true,
}: PlayingCardProps) {
  const dim = SIZES[size];

  // ── Flip animation ───────────────────────────────────────────────────────
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
          toValue: 1, duration: 320, useNativeDriver: true,
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

  const frontRotateY = flipAnim.interpolate({
    inputRange: [0, 0.49, 0.5, 1],
    outputRange: ['90deg', '90deg', '0deg', '0deg'],
  });
  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 0.49, 0.5, 1],
    outputRange: [0, 0, 1, 1],
  });
  const backRotateY = flipAnim.interpolate({
    inputRange: [0, 0.49, 0.5, 1],
    outputRange: ['0deg', '-90deg', '-90deg', '-90deg'],
  });
  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 0.49, 0.5, 1],
    outputRange: [1, 1, 0, 0],
  });

  // ── Card face values ─────────────────────────────────────────────────────
  const isRed = card ? isRedSuit(card.suit) : false;
  const textColor = isRed ? '#e0132a' : '#111111';
  const val = card ? valueLabel(card.value) : '';
  const suit = card ? suitSymbol(card.suit) : '';

  const cardBase = { width: dim.w, height: dim.h, borderRadius: dim.radius };

  return (
    <View style={{ width: dim.w, height: dim.h }}>

      {/* ── Back face ──────────────────────────────────────────────────────── */}
      <View style={[StyleSheet.absoluteFillObject, { transform: [{ perspective: 1200 }] }]}>
        <Animated.View
          style={[
            cardBase,
            StyleSheet.absoluteFillObject,
            { opacity: backOpacity, transform: [{ rotateY: backRotateY }] },
          ]}
        >
          <CardBack w={dim.w} h={dim.h} r={dim.radius} />
        </Animated.View>
      </View>

      {/* ── Front face ─────────────────────────────────────────────────────── */}
      {card && (
        <View style={[StyleSheet.absoluteFillObject, { transform: [{ perspective: 1200 }] }]}>
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              { opacity: frontOpacity, transform: [{ rotateY: frontRotateY }] },
            ]}
          >
            {/* Outer cyan glow ring when highlighted */}
            {highlighted && (
              <View
                style={[
                  cardBase,
                  StyleSheet.absoluteFillObject,
                  styles.highlightOuter,
                ]}
              />
            )}
            <View
              style={[
                cardBase,
                styles.cardFront,
                highlighted && styles.highlightInner,
                StyleSheet.absoluteFillObject,
              ]}
            >
              {/* Large centered value */}
              <Text style={[styles.cardValue, { fontSize: dim.valFont, color: textColor }]}>
                {val}
              </Text>
              {/* Suit symbol below */}
              <Text style={[styles.cardSuit, { fontSize: dim.suitFont, color: textColor }]}>
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
  cardFront: {
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00C8FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
    gap: 1,
    borderWidth: 2,
    borderColor: 'rgba(66,207,255,0.25)',
  },
  highlightOuter: {
    shadowColor: '#00d4ff',
    shadowOpacity: 1,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
    borderWidth: 2.5,
    borderColor: 'rgba(0,212,255,0.55)',
    backgroundColor: 'transparent',
  },
  highlightInner: {
    shadowColor: '#00d4ff',
    shadowOpacity: 1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    borderWidth: 2,
    borderColor: '#00d4ff',
  },
  cardValue: {
    fontWeight: '800',
    lineHeight: undefined,
    includeFontPadding: false,
    textAlign: 'center',
  },
  cardSuit: {
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: undefined,
    includeFontPadding: false,
    marginTop: 1,
  },
});
