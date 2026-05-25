// ─── CharacterPortrait — cinematic styled portrait card ───────────────────────
// Renders a premium character as a gradient portrait with Orbitron monogram,
// cinematic light beam, SVG accents, and rarity glow. NO emoji.

import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Polygon, Rect } from 'react-native-svg';
import {
  Character,
  Rarity,
  RARITY_COLORS,
  RARITY_BORDER_WIDTH,
} from '@/constants/characters';

interface CharacterPortraitProps {
  character: Character;
  size?: number;
  showName?: boolean;
  showRarity?: boolean;
  isEquipped?: boolean;
  isLocked?: boolean;
  style?: object;
}

// SVG corner bracket decorations
function CornerAccents({ size, color }: { size: number; color: string }) {
  const s = size;
  const b = Math.max(3, s * 0.12); // bracket arm length
  const t = Math.max(0.7, s * 0.025); // stroke width
  return (
    <Svg width={s} height={s} style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* top-left */}
      <Line x1={0} y1={b} x2={0} y2={0} stroke={color} strokeWidth={t} opacity={0.7} />
      <Line x1={0} y1={0} x2={b} y2={0} stroke={color} strokeWidth={t} opacity={0.7} />
      {/* top-right */}
      <Line x1={s - b} y1={0} x2={s} y2={0} stroke={color} strokeWidth={t} opacity={0.7} />
      <Line x1={s} y1={0} x2={s} y2={b} stroke={color} strokeWidth={t} opacity={0.7} />
      {/* bottom-left */}
      <Line x1={0} y1={s - b} x2={0} y2={s} stroke={color} strokeWidth={t} opacity={0.7} />
      <Line x1={0} y1={s} x2={b} y2={s} stroke={color} strokeWidth={t} opacity={0.7} />
      {/* bottom-right */}
      <Line x1={s - b} y1={s} x2={s} y2={s} stroke={color} strokeWidth={t} opacity={0.7} />
      <Line x1={s} y1={s - b} x2={s} y2={s} stroke={color} strokeWidth={t} opacity={0.7} />
      {/* center bottom accent bar */}
      <Line
        x1={s * 0.3} y1={s - t * 1.5} x2={s * 0.7} y2={s - t * 1.5}
        stroke={color} strokeWidth={t * 1.5} opacity={0.5}
      />
    </Svg>
  );
}

// Diagonal light sweep — suggests cinematic studio lighting
function LightBeam({ size, color }: { size: number; color: string }) {
  const s = size;
  // A parallelogram from top-left quadrant sweeping diagonally
  const points = `${s * 0.05},0 ${s * 0.45},0 ${s * 0.28},${s} ${-s * 0.1},${s}`;
  return (
    <Svg width={s} height={s} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Polygon points={points} fill={color} opacity={0.055} />
    </Svg>
  );
}

// Small diamond pip used for epic/legendary
function DiamondPip({ size, color }: { size: number; color: string }) {
  const s = size * 0.06;
  const cx = size / 2;
  const cy = size * 0.18;
  const pts = `${cx},${cy - s} ${cx + s},${cy} ${cx},${cy + s} ${cx - s},${cy}`;
  return (
    <Svg width={size} height={size} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Polygon points={pts} fill={color} opacity={0.6} />
    </Svg>
  );
}

export default function CharacterPortrait({
  character,
  size = 64,
  showName = false,
  showRarity = false,
  isEquipped = false,
  isLocked = false,
  style,
}: CharacterPortraitProps) {
  const isLegendary = character.rarity === 'LEGENDARY';
  const isEpic      = character.rarity === 'EPIC';
  const glowAnim    = useRef(new Animated.Value(0.35)).current;
  const scaleAnim   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isLegendary) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim,  { toValue: 1,    duration: 900,  useNativeDriver: false }),
        Animated.timing(glowAnim,  { toValue: 0.35, duration: 900,  useNativeDriver: false }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.06, duration: 900,  useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1,    duration: 900,  useNativeDriver: true }),
      ])
    ).start();
  }, [isLegendary]);

  const rarityColor  = isEquipped ? character.accentColor : RARITY_COLORS[character.rarity];
  const borderWidth  = isEquipped ? RARITY_BORDER_WIDTH[character.rarity] + 1 : RARITY_BORDER_WIDTH[character.rarity];
  const borderRadius = size * 0.18;
  const glowSize     = size + 16;

  const initialsSize = size * 0.30;
  const nameSize     = Math.max(8, size * 0.14);
  const raritySize   = Math.max(6, size * 0.10);

  return (
    <View style={[{ alignItems: 'center', gap: 4 }, style]}>
      {/* Legendary outer glow ring — animated */}
      {isLegendary && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: glowSize,
            height: glowSize,
            borderRadius: glowSize * 0.22,
            backgroundColor: character.accentColor,
            opacity: glowAnim,
            top:  -(glowSize - size) / 2,
            left: -(glowSize - size) / 2,
            zIndex: 0,
          }}
        />
      )}

      {/* Epic outer glow — static */}
      {isEpic && !isLegendary && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: glowSize - 6,
            height: glowSize - 6,
            borderRadius: (glowSize - 6) * 0.2,
            backgroundColor: character.accentColor,
            opacity: 0.22,
            top:  -(glowSize - 6 - size) / 2,
            left: -(glowSize - 6 - size) / 2,
            zIndex: 0,
          }}
        />
      )}

      {/* Portrait card */}
      <Animated.View
        style={{
          width: size,
          height: size,
          borderRadius,
          borderWidth,
          borderColor: isEquipped ? character.accentColor : rarityColor,
          overflow: 'hidden',
          shadowColor: character.accentColor,
          shadowOpacity: isEquipped ? 0.9 : (isLegendary ? 0.7 : isEpic ? 0.5 : 0.3),
          shadowRadius: isEquipped ? 18 : isLegendary ? 14 : isEpic ? 10 : 6,
          shadowOffset: { width: 0, height: 0 },
          transform: isLegendary ? [{ scale: scaleAnim }] : [],
          zIndex: 1,
        }}
      >
        {/* Atmospheric background gradient */}
        <LinearGradient
          colors={character.portraitColors}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.3, y: 0 }}
          end={{ x: 0.7, y: 1 }}
        />

        {/* Cinematic diagonal light beam */}
        <LightBeam size={size} color={character.lightColor} />

        {/* Corner bracket decorations */}
        <CornerAccents size={size} color={character.accentColor} />

        {/* Diamond pip for Epic/Legendary */}
        {(isEpic || isLegendary) && (
          <DiamondPip size={size} color={character.accentColor} />
        )}

        {/* Top accent line */}
        <View
          style={{
            position: 'absolute',
            top: size * 0.08,
            left: size * 0.2,
            right: size * 0.2,
            height: 1,
            backgroundColor: character.accentColor,
            opacity: 0.35,
          }}
        />

        {/* Character monogram / initials */}
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
          <Text
            style={{
              fontSize: initialsSize,
              fontFamily: 'Orbitron_700Bold',
              color: character.accentColor,
              letterSpacing: initialsSize * 0.04,
              textShadowColor: character.accentColor,
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: size * 0.15,
              opacity: isLocked ? 0.25 : 1,
            }}
            allowFontScaling={false}
          >
            {character.initials}
          </Text>
        </View>

        {/* Subtle gradient overlay for depth */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.45)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0.3 }}
          end={{ x: 0.5, y: 1 }}
          pointerEvents="none"
        />

        {/* Lock overlay */}
        {isLocked && (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                borderRadius,
                backgroundColor: 'rgba(0,0,0,0.68)',
                alignItems: 'center',
                justifyContent: 'center',
              },
            ]}
          >
            <Text style={{ fontSize: size * 0.26 }}>🔒</Text>
          </View>
        )}

        {/* Equipped green dot */}
        {isEquipped && (
          <View
            style={{
              position: 'absolute',
              bottom: size * 0.05,
              right: size * 0.05,
              width: size * 0.16,
              height: size * 0.16,
              borderRadius: size * 0.08,
              backgroundColor: '#00ff88',
              borderWidth: 1.5,
              borderColor: '#050010',
            }}
          />
        )}
      </Animated.View>

      {/* Rarity badge */}
      {showRarity && (
        <View
          style={{
            borderRadius: 4,
            borderWidth: 1,
            paddingHorizontal: 5,
            paddingVertical: 1,
            borderColor: rarityColor + '55',
            backgroundColor: rarityColor + '18',
          }}
        >
          <Text
            style={{
              fontSize: raritySize,
              fontWeight: '900',
              fontFamily: 'Orbitron_700Bold',
              letterSpacing: 1,
              color: rarityColor,
            }}
            allowFontScaling={false}
          >
            {character.rarity}
          </Text>
        </View>
      )}

      {/* Name */}
      {showName && (
        <Text
          style={{
            fontFamily: 'Orbitron_400Regular',
            textAlign: 'center',
            letterSpacing: 0.3,
            lineHeight: nameSize * 1.3,
            maxWidth: size * 1.2,
            fontSize: nameSize,
            color: isLocked ? '#444' : '#fff',
          }}
          numberOfLines={2}
          allowFontScaling={false}
        >
          {character.name}
        </Text>
      )}
    </View>
  );
}
