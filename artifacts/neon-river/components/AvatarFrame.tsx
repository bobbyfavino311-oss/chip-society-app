import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { PremiumAvatar, RARITY_COLORS, RARITY_GLOW } from '@/constants/premiumAvatars';

interface AvatarFrameProps {
  avatar: PremiumAvatar;
  size?: number;
  showName?: boolean;
  showRarity?: boolean;
  isEquipped?: boolean;
  isLocked?: boolean;
  style?: object;
}

export default function AvatarFrame({
  avatar,
  size = 64,
  showName = false,
  showRarity = false,
  isEquipped = false,
  isLocked = false,
  style,
}: AvatarFrameProps) {
  const isLegendary = avatar.rarity === 'LEGENDARY';
  const glowAnim    = useRef(new Animated.Value(0.4)).current;
  const rotAnim     = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isLegendary) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1,   duration: 900,  useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 900,  useNativeDriver: false }),
      ])
    ).start();
    Animated.loop(
      Animated.timing(rotAnim, { toValue: 1, duration: 3000, useNativeDriver: false })
    ).start();
  }, [isLegendary]);

  const rarityColor  = isEquipped ? avatar.accentColor : RARITY_COLORS[avatar.rarity];
  const borderWidth  = avatar.rarity === 'LEGENDARY' ? 2.5 : avatar.rarity === 'EPIC' ? 2 : 1.5;
  const emojiSize    = size * 0.46;
  const fontSize     = Math.max(10, size * 0.18);

  // Legendary outer glow ring
  const glowSize     = size + 12;

  return (
    <View style={[{ alignItems: 'center', gap: 4 }, style]}>
      {/* Legendary pulsing glow ring */}
      {isLegendary && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: glowSize,
            height: glowSize,
            borderRadius: glowSize / 2,
            backgroundColor: avatar.accentColor,
            opacity: glowAnim,
            top: -(glowSize - size) / 2,
            left: -(glowSize - size) / 2,
            zIndex: 0,
          }}
        />
      )}

      {/* Avatar circle */}
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth,
            borderColor: isEquipped ? avatar.accentColor : rarityColor,
            ...(!isLegendary && {
              shadowColor: RARITY_GLOW[avatar.rarity],
              shadowOpacity: 1,
              shadowRadius: isEquipped ? 20 : 10,
              shadowOffset: { width: 0, height: 0 },
            }),
          },
        ]}
      >
        <LinearGradient
          colors={avatar.gradient}
          style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
        />

        {/* Holographic shimmer for Epic/Legendary */}
        {(avatar.rarity === 'EPIC' || avatar.rarity === 'LEGENDARY') && (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                borderRadius: size / 2,
                backgroundColor: avatar.accentColor,
                opacity: 0.08,
              },
            ]}
          />
        )}

        {/* Emoji portrait */}
        <Text
          style={{ fontSize: emojiSize, textAlign: 'center', lineHeight: size * 0.9 }}
          allowFontScaling={false}
        >
          {avatar.emoji}
        </Text>

        {/* Lock overlay */}
        {isLocked && (
          <View style={[StyleSheet.absoluteFill, styles.lockOverlay, { borderRadius: size / 2 }]}>
            <Text style={{ fontSize: size * 0.28 }}>🔒</Text>
          </View>
        )}

        {/* Equipped indicator */}
        {isEquipped && (
          <View style={[styles.equippedDot, { backgroundColor: avatar.accentColor }]} />
        )}
      </View>

      {/* Rarity badge */}
      {showRarity && (
        <View style={[styles.rarityBadge, { borderColor: rarityColor + '55', backgroundColor: rarityColor + '18' }]}>
          <Text style={[styles.rarityText, { color: rarityColor }]}>{avatar.rarity}</Text>
        </View>
      )}

      {/* Name */}
      {showName && (
        <Text
          style={[styles.name, { fontSize, color: isLocked ? '#444' : '#fff' }]}
          numberOfLines={2}
          allowFontScaling={false}
        >
          {avatar.name}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  equippedDot: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#050010',
  },
  rarityBadge: {
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  rarityText: {
    fontSize: 7,
    fontWeight: '900',
    fontFamily: 'Orbitron_700Bold',
    letterSpacing: 1,
  },
  name: {
    fontFamily: 'Orbitron_400Regular',
    textAlign: 'center',
    letterSpacing: 0.3,
    lineHeight: 14,
    maxWidth: 72,
  },
});
