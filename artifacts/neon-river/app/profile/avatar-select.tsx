// ─── Avatar Select — Premium Circular Badge Gallery ───────────────────────────
// No filter tabs. 3-col grid of luxury casino collectible badges.
// Official sprite-sheet symbols from the reference image.

import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import colors from '@/constants/colors';
import {
  NEON_AVATARS,
  NEON_RARITY_COLORS,
  getNeonAvatar,
  isNeonAvatarUnlocked,
  type NeonAvatar as NeonAvatarData,
  type NeonRarity,
} from '@/constants/neonAvatars';
import NeonAvatarView from '@/components/NeonAvatar';
import { useUser } from '@/context/UserContext';

const { width: SCREEN_W } = Dimensions.get('window');
const COLS   = 3;
const H_PAD  = 20;
const USABLE = Math.min(SCREEN_W, 420) - H_PAD * 2;
const SLOT_W = Math.floor(USABLE / COLS);
const AV_SIZE = Math.min(SLOT_W - 24, 96);   // large, premium badge size

// Rarity ring colours per spec
const RARITY_RING: Record<NeonRarity, string> = {
  COMMON:    '#00d4ff',   // electric blue
  RARE:      '#8b5cf6',   // purple
  EPIC:      '#ff0090',   // hot pink
  LEGENDARY: '#ffd700',   // gold
};

export default function AvatarSelectScreen() {
  const insets = useSafeAreaInsets();
  const { profile, updateProfile } = useUser();

  const currentId = (profile.symbolIndex && profile.symbolIndex > 0)
    ? profile.symbolIndex
    : 1;

  const [previewId, setPreviewId]     = useState<number>(currentId);
  const [justEquipped, setJustEquipped] = useState(false);

  const previewScale = useRef(new Animated.Value(1)).current;

  const preview    = getNeonAvatar(previewId) as NeonAvatarData;
  const unlocked   = isNeonAvatarUnlocked(preview, profile.xp);
  const isEquipped = profile.profileImageType === 'symbol'
    && (profile.symbolIndex ?? 0) === previewId;
  const ringColor  = RARITY_RING[preview.rarity];
  const rarityColor = NEON_RARITY_COLORS[preview.rarity];
  const xpPct      = Math.min(1, preview.unlockXP > 0 ? profile.xp / preview.unlockXP : 1);

  function pulse() {
    Animated.sequence([
      Animated.timing(previewScale, { toValue: 0.93, duration: 70, useNativeDriver: true }),
      Animated.spring(previewScale, { toValue: 1, friction: 4,    useNativeDriver: true }),
    ]).start();
  }

  function handleSelect(av: NeonAvatarData) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPreviewId(av.id);
    pulse();
  }

  async function handleEquip() {
    if (!unlocked) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await updateProfile({ symbolIndex: previewId, profileImageType: 'symbol' });
    setJustEquipped(true);
    setTimeout(() => setJustEquipped(false), 1600);
  }

  // ── Render grid cell ──────────────────────────────────────────────────────
  function renderBadge({ item }: { item: NeonAvatarData }) {
    const avLocked  = !isNeonAvatarUnlocked(item, profile.xp);
    const rc        = RARITY_RING[item.rarity];
    const selected  = previewId === item.id;
    const equipped  = profile.profileImageType === 'symbol'
      && profile.symbolIndex === item.id;

    return (
      <TouchableOpacity
        style={[s.cell, { width: SLOT_W }]}
        onPress={() => handleSelect(item)}
        activeOpacity={0.75}
      >
        {/* Outer glow when selected */}
        {selected && (
          <View style={[s.selectedGlow, {
            width:  AV_SIZE + 24,
            height: AV_SIZE + 24,
            borderRadius: (AV_SIZE + 24) / 2,
            backgroundColor: rc,
          }]} />
        )}
        {/* Secondary selection ring */}
        {selected && (
          <View style={[s.selectedRing, {
            width:  AV_SIZE + 10,
            height: AV_SIZE + 10,
            borderRadius: (AV_SIZE + 10) / 2,
            borderColor: rc,
            shadowColor: rc,
          }]} />
        )}

        <NeonAvatarView
          avatarId={item.id}
          size={AV_SIZE}
          isLocked={avLocked}
          isEquipped={equipped}
        />

        <Text
          style={[s.badgeName, { color: selected ? rc : '#3a4060' }]}
          numberOfLines={1}
        >
          {item.name}
        </Text>

        {/* Rarity dot below name */}
        <View style={[s.rarityDot, { backgroundColor: rc, opacity: selected ? 1 : 0.35 }]} />
      </TouchableOpacity>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#050010' }}>

      {/* Deep space gradient background */}
      <LinearGradient
        colors={['#08001e', '#050010', '#010008']}
        style={StyleSheet.absoluteFill}
      />

      {/* Subtle radial glow behind hero */}
      <LinearGradient
        colors={[ringColor + '18', 'transparent']}
        style={[StyleSheet.absoluteFill, { top: 0, height: 260 }]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={[s.header, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={s.title}>COLLECTIONS</Text>
        <View style={{ width: 38 }} />
      </View>

      <FlatList
        data={NEON_AVATARS}
        keyExtractor={(item: NeonAvatarData) => String(item.id)}
        numColumns={COLS}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <>
            {/* ── Hero preview ───────────────────────────────────────────── */}
            <Animated.View
              style={[s.hero, { transform: [{ scale: previewScale }] }]}
            >
              {/* Large circular avatar */}
              <View style={s.heroAvatarWrap}>
                {/* Outer metallic glow ring */}
                <View style={[s.heroGlowRing, {
                  width:  132, height: 132,
                  borderRadius: 66,
                  borderColor: ringColor,
                  shadowColor: ringColor,
                }]} />
                {/* Second inner ring */}
                <View style={[s.heroInnerRing, {
                  width: 116, height: 116,
                  borderRadius: 58,
                  borderColor: ringColor + '55',
                }]} />
                <NeonAvatarView
                  avatarId={previewId}
                  size={108}
                  isEquipped={isEquipped}
                  isLocked={!unlocked}
                />
              </View>

              {/* Info panel */}
              <View style={s.heroInfo}>
                {/* Rarity badge */}
                <View style={[s.rarityBadge, {
                  borderColor: ringColor,
                  backgroundColor: ringColor + '20',
                }]}>
                  <Text style={[s.rarityBadgeText, { color: ringColor }]}>
                    {preview.rarity}
                  </Text>
                </View>

                <Text style={s.heroName}>{preview.name}</Text>

                {!unlocked ? (
                  <View style={s.xpBlock}>
                    <View style={s.xpBarBg}>
                      <View style={[s.xpBarFill, {
                        width: `${xpPct * 100}%` as `${number}%`,
                        backgroundColor: ringColor,
                      }]} />
                    </View>
                    <Text style={[s.xpLabel, { color: ringColor + 'cc' }]}>
                      {profile.xp.toLocaleString()} / {preview.unlockXP.toLocaleString()} XP
                    </Text>
                  </View>
                ) : (
                  <Text style={[s.unlockText, { color: ringColor + 'bb' }]}>
                    {preview.unlockCondition}
                  </Text>
                )}

                <TouchableOpacity
                  style={[s.equipBtn, {
                    borderColor: unlocked ? ringColor : '#1a1a36',
                    backgroundColor: justEquipped
                      ? ringColor + '40'
                      : unlocked ? ringColor + '18' : '#08081a',
                    opacity: !unlocked ? 0.4 : 1,
                  }]}
                  onPress={handleEquip}
                  disabled={!unlocked || isEquipped}
                  activeOpacity={0.7}
                >
                  <Text style={[s.equipBtnText, {
                    color: unlocked ? ringColor : '#2a2a50',
                  }]}>
                    {!unlocked
                      ? `LOCKED — ${(preview.unlockXP - profile.xp).toLocaleString()} XP`
                      : isEquipped ? '✓  EQUIPPED'
                      : justEquipped ? '✓  EQUIPPED!'
                      : 'EQUIP AVATAR'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* ── Gallery header ────────────────────────────────────────── */}
            <View style={s.galleryHeader}>
              <View style={[s.galleryDivider, { backgroundColor: '#1a1a3a' }]} />
              <Text style={s.galleryTitle}>BADGE COLLECTION</Text>
              <View style={[s.galleryDivider, { backgroundColor: '#1a1a3a' }]} />
            </View>
          </>
        )}
        renderItem={renderBadge}
        contentContainerStyle={[s.grid, { paddingBottom: insets.bottom + 32 }]}
      />
    </View>
  );
}

const s = StyleSheet.create({
  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#0d0d24',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#1a1a40',
  },
  title: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 13,
    color: '#ffffff',
    letterSpacing: 4,
  },

  // ── Hero ────────────────────────────────────────────────────────────────────
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 20,
    minHeight: 152,
  },
  heroAvatarWrap: {
    position: 'relative',
    width: 132, height: 132,
    alignItems: 'center', justifyContent: 'center',
  },
  heroGlowRing: {
    position: 'absolute',
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20,
    shadowOpacity: 1,
  },
  heroInnerRing: {
    position: 'absolute',
    borderWidth: 1,
  },
  heroInfo: {
    flex: 1,
    gap: 7,
  },
  rarityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  rarityBadgeText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 7.5,
    letterSpacing: 2.5,
  },
  heroName: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 15,
    color: '#ffffff',
    letterSpacing: 1,
    lineHeight: 20,
  },
  xpBlock: { gap: 4 },
  xpBarBg: {
    height: 3,
    backgroundColor: '#111130',
    borderRadius: 2,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  xpLabel: {
    fontSize: 8.5,
    fontFamily: 'Orbitron_700Bold',
    letterSpacing: 0.5,
  },
  unlockText: {
    fontSize: 8.5,
    fontFamily: 'Orbitron_700Bold',
    letterSpacing: 0.5,
    lineHeight: 13,
  },
  equipBtn: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 24,
    borderWidth: 1.5,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  equipBtnText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 8.5,
    letterSpacing: 1.5,
  },

  // ── Gallery divider ─────────────────────────────────────────────────────────
  galleryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: H_PAD,
    marginBottom: 16,
    gap: 10,
  },
  galleryDivider: {
    flex: 1,
    height: 1,
  },
  galleryTitle: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 8,
    color: '#2a2a50',
    letterSpacing: 3,
  },

  // ── Grid ────────────────────────────────────────────────────────────────────
  grid: {
    paddingHorizontal: H_PAD,
    paddingTop: 4,
  },
  cell: {
    alignItems: 'center',
    paddingVertical: 14,
    position: 'relative',
  },
  selectedGlow: {
    position: 'absolute',
    top: 14 - 12,
    opacity: 0.14,
  },
  selectedRing: {
    position: 'absolute',
    top: 14 - 5,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
    shadowOpacity: 1,
  },
  badgeName: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 6.5,
    letterSpacing: 0.4,
    marginTop: 8,
    textAlign: 'center',
    width: SLOT_W - 10,
  },
  rarityDot: {
    width: 4, height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
});
