// ─── CharacterPortrait — Real portrait image renderer ─────────────────────────
// Displays cinematic character portrait photos with rarity effects.
// Locked characters show a silhouette overlay.
// NO SVG faces. NO initials. Real illustrated character art.

import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import CHARACTER_IMAGES from '@/constants/characterImages';
import {
  Character,
  RARITY_BORDER_WIDTH,
  RARITY_COLORS,
} from '@/constants/characters';

interface Props {
  character: Character;
  size?: number;
  isEquipped?: boolean;
  isLocked?: boolean;
  style?: object;
  customPhotoUri?: string;
}

function LockIcon({ size, color }: { size: number; color: string }) {
  const s = size * 0.38;
  return (
    <Svg width={s} height={s * 1.2} viewBox="0 0 24 30">
      <Path
        d="M12,1 C8.7,1 6,3.7 6,7 L6,11 L4,11 C2.9,11 2,11.9 2,13 L2,27 C2,28.1 2.9,29 4,29 L20,29 C21.1,29 22,28.1 22,27 L22,13 C22,11.9 21.1,11 20,11 L18,11 L18,7 C18,3.7 15.3,1 12,1 Z M12,4 C13.7,4 15,5.3 15,7 L15,11 L9,11 L9,7 C9,5.3 10.3,4 12,4 Z M12,17 C13.1,17 14,17.9 14,19 C14,19.7 13.6,20.4 13,20.8 L13,23 L11,23 L11,20.8 C10.4,20.4 10,19.7 10,19 C10,17.9 10.9,17 12,17 Z"
        fill={color}
      />
    </Svg>
  );
}

export default function CharacterPortrait({
  character,
  size = 64,
  isEquipped = false,
  isLocked = false,
  style,
  customPhotoUri,
}: Props) {
  const rarityColor  = RARITY_COLORS[character.rarity];
  const borderWidth  = RARITY_BORDER_WIDTH[character.rarity];
  const borderRadius = size * 0.14;

  // Legendary pulse animation
  const pulseAnim = useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    if (character.rarity === 'LEGENDARY') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1,   duration: 900,  useNativeDriver: false }),
          Animated.timing(pulseAnim, { toValue: 0.6, duration: 900, useNativeDriver: false }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [character.rarity]);

  const glowOpacity = pulseAnim.interpolate({
    inputRange: [0.6, 1],
    outputRange: [0.25, character.rarity === 'LEGENDARY' ? 0.85 : character.rarity === 'EPIC' ? 0.55 : 0.35],
  });

  const glowSize = size + 10;

  const img = CHARACTER_IMAGES[character.id];

  return (
    <View style={[{ width: size, height: size }, style]}>

      {/* Rarity glow halo behind the card */}
      {(character.rarity === 'LEGENDARY' || character.rarity === 'EPIC') && (
        <Animated.View
          style={{
            position: 'absolute',
            top: -(glowSize - size) / 2,
            left: -(glowSize - size) / 2,
            width: glowSize,
            height: glowSize,
            borderRadius: borderRadius + 6,
            backgroundColor: rarityColor,
            opacity: glowOpacity,
          }}
        />
      )}

      {/* Portrait frame */}
      <View
        style={{
          width: size,
          height: size,
          borderRadius,
          borderWidth,
          borderColor: isEquipped ? '#ffffff' : rarityColor,
          overflow: 'hidden',
          backgroundColor: '#050010',
        }}
      >
        {/* Portrait image */}
        {customPhotoUri && !isLocked ? (
          <Image
            source={{ uri: customPhotoUri }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : img ? (
          <Image
            source={img}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0a0025' }]} />
        )}

        {/* Legendary shimmer overlay */}
        {character.rarity === 'LEGENDARY' && !isLocked && (
          <LinearGradient
            colors={['transparent', `${rarityColor}22`, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        )}

        {/* Locked silhouette overlay */}
        {isLocked && (
          <View style={[StyleSheet.absoluteFill, styles.lockedOverlay]}>
            <LockIcon size={size} color={rarityColor} />
            {size >= 60 && (
              <Text style={[styles.lockedXP, { fontSize: size * 0.09, color: rarityColor }]}>
                {(character.unlockXP / 1000).toFixed(0)}K XP
              </Text>
            )}
          </View>
        )}

        {/* Equipped crown dot */}
        {isEquipped && !isLocked && (
          <View style={[styles.equippedDot, { borderColor: '#050010' }]} />
        )}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  lockedOverlay: {
    backgroundColor: 'rgba(5,0,16,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  lockedXP: {
    fontFamily: 'Orbitron_700Bold',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  equippedDot: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00ff88',
    borderWidth: 1.5,
  },
});
