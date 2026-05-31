// ─── NeonAvatar — official reference image sprite sheet ───────────────────────
// Crops the exact symbol from the approved 1536×1024 master sheet.
// Each icon is a square crop centered within its grid cell — no neighboring art.

import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
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

// ─── Sprite-sheet constants ────────────────────────────────────────────────────
// Source image: 1536 × 1024 px, 6 columns × 5 rows = 30 avatars
const SPRITE = require('@/assets/images/neon-avatars.png');
const IMG_W  = 1536;
const IMG_H  = 1024;
const COLS   = 6;
const ROWS   = 5;
const CELL_W = IMG_W / COLS;                // 256 px wide per cell
const CELL_H = IMG_H / ROWS;                // 204.8 px tall per cell
// Square crop: use the shorter dimension, centred horizontally in the wider cell
const CROP_SIDE = CELL_H;                   // 204.8 px — the crop square side
const CROP_X0   = (CELL_W - CROP_SIDE) / 2; // 25.6 px — horizontal offset to centre

// ─── Sprite renderer ───────────────────────────────────────────────────────────
// Clips a CROP_SIDE × CROP_SIDE region from the sheet for avatar `id`.
// The clipped region maps to a perfectly square display of `size × size`.
function SpriteAvatar({ id, size }: { id: number; size: number }) {
  const idx  = Math.max(0, Math.min(29, id - 1));
  const col  = idx % COLS;
  const row  = Math.floor(idx / COLS);

  // Scale so the square crop fills the display size exactly
  const scale = size / CROP_SIDE;
  const imgW  = IMG_W * scale;
  const imgH  = IMG_H * scale;

  // Offset: scroll the full image so the correct crop cell starts at (0, 0)
  const left = -(col * CELL_W + CROP_X0) * scale;
  const top  = -(row * CELL_H) * scale;

  return (
    <Image
      source={SPRITE}
      style={{ position: 'absolute', width: imgW, height: imgH, left, top }}
      resizeMode="cover"
    />
  );
}

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
      0.20,
      avatar.rarity === 'LEGENDARY' ? 0.75
        : avatar.rarity === 'EPIC'  ? 0.48
        : 0.28,
    ],
  });

  const glowPad = avatar.rarity === 'LEGENDARY' ? 18
    : avatar.rarity === 'EPIC' ? 12 : 0;
  const glowSize = size + glowPad;

  const xpLabel = isLocked
    ? avatar.unlockXP >= 1000
      ? `${(avatar.unlockXP / 1000).toFixed(0)}K XP`
      : `${avatar.unlockXP} XP`
    : undefined;

  return (
    <View style={[{ width: size, height: size }, style]}>

      {/* Outer animated glow halo — EPIC/LEGENDARY only */}
      {glowPad > 0 && (
        <Animated.View style={{
          position: 'absolute',
          top:    -glowPad / 2,
          left:   -glowPad / 2,
          width:   glowSize,
          height:  glowSize,
          borderRadius: glowSize / 2,
          backgroundColor: rarityColor,
          opacity: glowOpacity,
        }} />
      )}

      {/* Circular clip container */}
      <View style={{
        width: size, height: size,
        borderRadius: size / 2,
        borderWidth,
        borderColor: isEquipped ? '#ffffff' : rarityColor,
        overflow: 'hidden',
        backgroundColor: '#050010',
      }}>
        {/* Official sprite sheet crop */}
        <SpriteAvatar id={avatarId} size={size - borderWidth * 2} />

        {/* Dim + lock when locked */}
        {isLocked && (
          <>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(5,0,16,0.55)' }]} />
            <LockOverlay size={size} color={rarityColor} xpLabel={size >= 56 ? xpLabel : undefined} />
          </>
        )}
      </View>

      {/* Equipped indicator dot — outside the clip */}
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
