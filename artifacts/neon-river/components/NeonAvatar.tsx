// ─── NeonAvatar — 30 individual avatar PNGs ───────────────────────────────────
// Each avatar is a separate 1024×1024 PNG cropped from the official reference
// image using ImageMagick. Full symbol, perfectly centered, no clipping.
// resizeMode="contain" ensures the whole badge is always visible.

import React, { useEffect, useRef } from 'react';
import { Animated, Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import {
  getNeonAvatar,
  NEON_RARITY_BORDER,
  NEON_RARITY_COLORS,
} from '@/constants/neonAvatars';

export interface NeonAvatarProps {
  avatarId?: number;
  size?: number;
  isLocked?: boolean;
  isEquipped?: boolean;
  style?: object;
}

// ─── Static asset map ─────────────────────────────────────────────────────────
// React Native requires static require() calls — no dynamic expressions.
const AVATAR_IMAGES: Record<number, ImageSourcePropType> = {
  1:  require('@/assets/avatars/avatar_1.png'),
  2:  require('@/assets/avatars/avatar_2.png'),
  3:  require('@/assets/avatars/avatar_3.png'),
  4:  require('@/assets/avatars/avatar_4.png'),
  5:  require('@/assets/avatars/avatar_5.png'),
  6:  require('@/assets/avatars/avatar_6.png'),
  7:  require('@/assets/avatars/avatar_7.png'),
  8:  require('@/assets/avatars/avatar_8.png'),
  9:  require('@/assets/avatars/avatar_9.png'),
  10: require('@/assets/avatars/avatar_10.png'),
  11: require('@/assets/avatars/avatar_11.png'),
  12: require('@/assets/avatars/avatar_12.png'),
  13: require('@/assets/avatars/avatar_13.png'),
  14: require('@/assets/avatars/avatar_14.png'),
  15: require('@/assets/avatars/avatar_15.png'),
  16: require('@/assets/avatars/avatar_16.png'),
  17: require('@/assets/avatars/avatar_17.png'),
  18: require('@/assets/avatars/avatar_18.png'),
  19: require('@/assets/avatars/avatar_19.png'),
  20: require('@/assets/avatars/avatar_20.png'),
  21: require('@/assets/avatars/avatar_21.png'),
  22: require('@/assets/avatars/avatar_22.png'),
  23: require('@/assets/avatars/avatar_23.png'),
  24: require('@/assets/avatars/avatar_24.png'),
  25: require('@/assets/avatars/avatar_25.png'),
  26: require('@/assets/avatars/avatar_26.png'),
  27: require('@/assets/avatars/avatar_27.png'),
  28: require('@/assets/avatars/avatar_28.png'),
  29: require('@/assets/avatars/avatar_29.png'),
  30: require('@/assets/avatars/avatar_30.png'),
};

// ─── Lock overlay ──────────────────────────────────────────────────────────────
function LockOverlay({ size, color, xpLabel }: { size: number; color: string; xpLabel?: string }) {
  const s = size * 0.30;
  return (
    <View style={[StyleSheet.absoluteFill, st.lockedOverlay]}>
      <Svg width={s} height={s * 1.2} viewBox="0 0 24 30">
        <Path
          d="M12,1 C8.7,1 6,3.7 6,7 L6,11 L4,11 C2.9,11 2,11.9 2,13 L2,27 C2,28.1 2.9,29 4,29 L20,29 C21.1,29 22,28.1 22,27 L22,13 C22,11.9 21.1,11 20,11 L18,11 L18,7 C18,3.7 15.3,1 12,1 Z M12,4 C13.7,4 15,5.3 15,7 L15,11 L9,11 L9,7 C9,5.3 10.3,4 12,4 Z"
          fill={color}
        />
      </Svg>
      {xpLabel ? (
        <Text style={[st.lockedXP, { fontSize: size * 0.09, color }]}>{xpLabel}</Text>
      ) : null}
    </View>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function NeonAvatar({
  avatarId = 1,
  size = 64,
  isLocked = false,
  isEquipped = false,
  style,
}: NeonAvatarProps) {
  const avatar      = getNeonAvatar(avatarId);
  const rarityColor = NEON_RARITY_COLORS[avatar.rarity];
  const borderWidth = NEON_RARITY_BORDER[avatar.rarity];
  const src         = AVATAR_IMAGES[avatarId] ?? AVATAR_IMAGES[1];

  const pulseAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (avatar.rarity === 'LEGENDARY') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1,   duration: 900, useNativeDriver: false }),
          Animated.timing(pulseAnim, { toValue: 0.6, duration: 900, useNativeDriver: false }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => { pulseAnim.stopAnimation(); };
  }, [avatar.rarity]);

  const glowOpacity = pulseAnim.interpolate({
    inputRange: [0.6, 1],
    outputRange: [
      0.18,
      avatar.rarity === 'LEGENDARY' ? 0.72
        : avatar.rarity === 'EPIC'  ? 0.44
        : 0.26,
    ],
  });

  const glowPad  = avatar.rarity === 'LEGENDARY' ? 18 : avatar.rarity === 'EPIC' ? 12 : 0;
  const glowSize = size + glowPad;

  const xpLabel = isLocked
    ? avatar.unlockXP >= 1000
      ? `${(avatar.unlockXP / 1000).toFixed(0)}K XP`
      : `${avatar.unlockXP} XP`
    : undefined;

  const inner = size - borderWidth * 2;

  return (
    <View style={[{ width: size, height: size }, style]}>

      {/* Animated glow halo — EPIC / LEGENDARY */}
      {glowPad > 0 && (
        <Animated.View style={{
          position: 'absolute',
          top:  -glowPad / 2, left: -glowPad / 2,
          width: glowSize, height: glowSize,
          borderRadius: glowSize / 2,
          backgroundColor: rarityColor,
          opacity: glowOpacity,
        }} />
      )}

      {/* Outer rarity border ring */}
      <View style={{
        width: size, height: size,
        borderRadius: size / 2,
        borderWidth,
        borderColor: isEquipped ? '#ffffff' : rarityColor,
        overflow: 'hidden',
        backgroundColor: '#050010',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Individual avatar PNG — full symbol, contain (no cropping) */}
        <Image
          source={src}
          style={{
            width: inner,
            height: inner,
            opacity: isLocked ? 0.18 : 1,
          }}
          resizeMode="contain"
        />

        {/* Lock overlay */}
        {isLocked && (
          <LockOverlay size={size} color={rarityColor} xpLabel={size >= 56 ? xpLabel : undefined} />
        )}
      </View>

      {/* Equipped indicator dot (outside the circular clip) */}
      {isEquipped && !isLocked && (
        <View style={[st.equippedDot, {
          width:        Math.max(8, size * 0.16),
          height:       Math.max(8, size * 0.16),
          borderRadius: Math.max(4, size * 0.08),
          bottom: size * 0.02,
          right:  size * 0.02,
        }]} />
      )}

    </View>
  );
}

const st = StyleSheet.create({
  lockedOverlay: {
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
    backgroundColor: '#00ff88',
    borderWidth: 1.5,
    borderColor: '#050010',
  },
});
