// ─── NeonAvatar — collectible scene avatars ─────────────────────────────────────
// Each avatar is a 1024×1024 AI-illustrated scene PNG.
// resizeMode="cover" fills the circular clip for a full-bleed portrait look.

import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import {
  getNeonAvatar,
  NEON_RARITY_BORDER,
  NEON_RARITY_COLORS,
} from '@/constants/neonAvatars';

// ─── Static PNG map — must be literal require() calls for Metro bundler ────────
// IDs 1-15: original set  |  IDs 16-30: premium vaporwave expansion
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AVATAR_IMAGES: Record<number, any> = {
  // Original 15
  1:  require('../assets/avatars/martini.png'),
  2:  require('../assets/avatars/palm.png'),
  3:  require('../assets/avatars/dice_stack.png'),
  4:  require('../assets/avatars/cassette.png'),
  5:  require('../assets/avatars/saturn.png'),
  6:  require('../assets/avatars/vinyl.png'),
  7:  require('../assets/avatars/cherry.png'),
  8:  require('../assets/avatars/flamingo.png'),
  9:  require('../assets/avatars/sunset.png'),
  10: require('../assets/avatars/ace.png'),
  11: require('../assets/avatars/hourglass.png'),
  12: require('../assets/avatars/dragon.png'),
  13: require('../assets/avatars/poker_chip.png'),
  14: require('../assets/avatars/champagne.png'),
  15: require('../assets/avatars/moon.png'),
  // Premium vaporwave expansion (16-30)
  16: require('../assets/avatars/yacht.png'),
  17: require('../assets/avatars/vice_skyline.png'),
  18: require('../assets/avatars/palm_paradise.png'),
  19: require('../assets/avatars/ferrari.png'),
  20: require('../assets/avatars/ocean_drive.png'),
  21: require('../assets/avatars/convertible.png'),
  22: require('../assets/avatars/synthwave_moon.png'),
  23: require('../assets/avatars/penthouse.png'),
  24: require('../assets/avatars/tiger.png'),
  25: require('../assets/avatars/royal_flush.png'),
  26: require('../assets/avatars/million_pot.png'),
  27: require('../assets/avatars/roulette.png'),
  28: require('../assets/avatars/casino_crown.png'),
  29: require('../assets/avatars/poker_king.png'),
  30: require('../assets/avatars/midnight_mirage.png'),
  // Collection 01 — Street Legends
  31: require('../assets/avatars/brass_knuckles.png'),
  // Collection 02 — High Roller Arsenal
  37: require('../assets/avatars/compact_pistol.png'),
  38: require('../assets/avatars/tactical_pistol.png'),
  39: require('../assets/avatars/smg.png'),
  40: require('../assets/avatars/compact_smg.png'),
  41: require('../assets/avatars/assault_rifle.png'),
  42: require('../assets/avatars/ak_platform.png'),
  44: require('../assets/avatars/sniper_rifle.png'),
  // Collection 03 — Chaos Collection
  45: require('../assets/avatars/frag_grenade.png'),
  46: require('../assets/avatars/flashbang.png'),
  47: require('../assets/avatars/smoke_grenade.png'),
  // Collection 04 — Utility Series (49-52)
  49: require('../assets/avatars/spray_can.png'),
  50: require('../assets/avatars/walkie_talkie.png'),
  51: require('../assets/avatars/radio_device.png'),
  52: require('../assets/avatars/camera_lens.png'),
  // Legendary Icon (53)
  53: require('../assets/avatars/golden_tiki.png'),
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
export interface NeonAvatarProps {
  avatarId?: number;
  size?: number;
  isLocked?: boolean;
  isEquipped?: boolean;
  style?: object;
}

export default function NeonAvatar({
  avatarId = 1,
  size = 64,
  isLocked = false,
  isEquipped = false,
  style,
}: NeonAvatarProps) {
  const safeId    = Math.min(53, Math.max(1, Math.round(avatarId || 1)));
  const avatar    = getNeonAvatar(safeId);
  const rarityColor = NEON_RARITY_COLORS[avatar.rarity];
  const borderWidth = NEON_RARITY_BORDER[avatar.rarity];

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

  const inner = Math.max(size - borderWidth * 2, 4);
  const source = AVATAR_IMAGES[safeId] ?? AVATAR_IMAGES[1];

  return (
    <View style={[{ width: size, height: size }, style]}>

      {/* Animated glow halo — EPIC / LEGENDARY only */}
      {glowPad > 0 && (
        <Animated.View style={{
          position: 'absolute',
          top:  -glowPad / 2,
          left: -glowPad / 2,
          width: glowSize,
          height: glowSize,
          borderRadius: glowSize / 2,
          backgroundColor: rarityColor,
          opacity: glowOpacity,
        }} />
      )}

      {/* Rarity border ring + circular clip */}
      <View style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth,
        borderColor: isEquipped ? '#ffffff' : rarityColor,
        overflow: 'hidden',
        backgroundColor: '#000000',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Scene avatar — cover fills the circular clip edge-to-edge */}
        <Image
          source={source}
          style={{
            width:  inner,
            height: inner,
            opacity: isLocked ? 0.15 : 1,
          }}
          resizeMode="cover"
        />

        {/* Lock overlay */}
        {isLocked && (
          <LockOverlay
            size={size}
            color={rarityColor}
            xpLabel={size >= 56 ? xpLabel : undefined}
          />
        )}
      </View>

      {/* Equipped indicator dot */}
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
