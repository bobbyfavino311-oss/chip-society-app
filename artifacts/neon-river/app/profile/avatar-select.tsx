// ─── Avatar Select — Premium Collectible Badge Gallery ────────────────────────
// Luxury casino collectible feel. Miami nightlife 1980s aesthetic.
// No rarity labels — avatars displayed as a clean unified collection.

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
  getNeonAvatar,
  isNeonAvatarUnlocked,
  type NeonAvatar as NeonAvatarData,
} from '@/constants/neonAvatars';
import NeonAvatarView from '@/components/NeonAvatar';
import { useUser } from '@/context/UserContext';

const { width: SCREEN_W } = Dimensions.get('window');
const COLS   = 3;
const H_PAD  = 18;
const USABLE = Math.min(SCREEN_W, 420) - H_PAD * 2;
const SLOT_W = Math.floor(USABLE / COLS);
const AV_SIZE = Math.min(SLOT_W - 20, 90);

// Total avatar count — updates automatically as avatars are added
const TOTAL_AVATARS = NEON_AVATARS.length;

export default function AvatarSelectScreen() {
  const insets = useSafeAreaInsets();
  const { profile, updateProfile } = useUser();

  const currentId = (profile.symbolIndex && profile.symbolIndex > 0)
    ? profile.symbolIndex
    : 1;

  const [previewId, setPreviewId]       = useState<number>(currentId);
  const [justEquipped, setJustEquipped] = useState(false);

  const previewScale = useRef(new Animated.Value(1)).current;

  const preview    = getNeonAvatar(previewId) as NeonAvatarData;
  const unlocked   = isNeonAvatarUnlocked(preview, profile.xp);
  const isEquipped = profile.profileImageType === 'symbol'
    && (profile.symbolIndex ?? 0) === previewId;
  const accentColor = preview.color;

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

  // ── Grid cell ─────────────────────────────────────────────────────────────
  function renderBadge({ item }: { item: NeonAvatarData }) {
    const avLocked  = !isNeonAvatarUnlocked(item, profile.xp);
    const ac        = item.color;
    const selected  = previewId === item.id;
    const equipped  = profile.profileImageType === 'symbol'
      && profile.symbolIndex === item.id;

    return (
      <TouchableOpacity
        style={[s.cell, { width: SLOT_W }]}
        onPress={() => handleSelect(item)}
        activeOpacity={0.75}
      >
        {/* Selection ring — visible when selected */}
        <View style={[s.selectionRing, {
          width:  AV_SIZE + 8,
          height: AV_SIZE + 8,
          borderRadius: (AV_SIZE + 8) / 2,
          borderColor: ac,
          opacity: selected ? 1 : 0.18,
          shadowColor: ac,
          shadowRadius: selected ? 10 : 4,
          shadowOpacity: selected ? 0.9 : 0.3,
        }]} />

        {/* Avatar + status badge */}
        <View style={{ position: 'relative', width: AV_SIZE, height: AV_SIZE }}>
          <NeonAvatarView
            avatarId={item.id}
            size={AV_SIZE}
            isLocked={avLocked}
            isEquipped={equipped}
          />

          {/* Equipped indicator — gold check */}
          {equipped && (
            <View style={[s.statusBadge, {
              backgroundColor: '#ffd700',
              borderColor: '#000',
              bottom: 1, right: 1,
            }]}>
              <Ionicons name="checkmark" size={8} color="#000" />
            </View>
          )}

          {/* Locked indicator */}
          {avLocked && !equipped && (
            <View style={[s.statusBadge, {
              backgroundColor: '#0d0d22',
              borderColor: '#222244',
              bottom: 1, right: 1,
            }]}>
              <Ionicons name="lock-closed" size={7} color="#44446a" />
            </View>
          )}
        </View>

        <Text
          style={[s.badgeName, { color: selected ? ac : '#3a3a60' }]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#050010' }}>

      {/* Deep Miami night gradient */}
      <LinearGradient
        colors={['#0a001f', '#050010', '#010008']}
        style={StyleSheet.absoluteFill}
      />

      {/* Accent radial glow behind hero */}
      <LinearGradient
        colors={[accentColor + '1a', 'transparent']}
        style={[StyleSheet.absoluteFill, { height: 220 }]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={[s.header, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={s.title}>COLLECTIONS</Text>
          <Text style={s.subtitle}>Choose from {TOTAL_AVATARS} unique avatars</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <FlatList
        data={NEON_AVATARS}
        keyExtractor={(item: NeonAvatarData) => String(item.id)}
        numColumns={COLS}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <Animated.View
            style={[s.hero, { transform: [{ scale: previewScale }] }]}
          >
            {/* Avatar with double ring */}
            <View style={s.heroAvatarWrap}>
              <View style={[s.heroGlowRing, {
                width: 112, height: 112, borderRadius: 56,
                borderColor: accentColor,
                shadowColor: accentColor,
              }]} />
              <View style={[s.heroInnerRing, {
                width: 98, height: 98, borderRadius: 49,
                borderColor: accentColor + '44',
              }]} />
              <NeonAvatarView
                avatarId={previewId}
                size={90}
                isEquipped={isEquipped}
                isLocked={!unlocked}
              />
            </View>

            {/* Info panel */}
            <View style={s.heroInfo}>
              <Text style={s.heroName}>{preview.name}</Text>

              <TouchableOpacity
                style={[s.equipBtn, {
                  borderColor: unlocked ? accentColor : '#16163a',
                  backgroundColor: justEquipped
                    ? accentColor + '35'
                    : unlocked ? accentColor + '14' : '#07071a',
                  opacity: !unlocked ? 0.45 : 1,
                }]}
                onPress={handleEquip}
                disabled={!unlocked || isEquipped}
                activeOpacity={0.7}
              >
                <Text style={[s.equipBtnText, {
                  color: unlocked ? accentColor : '#22225a',
                }]}>
                  {!unlocked
                    ? `LOCKED  —  ${(preview.unlockXP - profile.xp).toLocaleString()} XP`
                    : isEquipped   ? '✓  EQUIPPED'
                    : justEquipped ? '✓  EQUIPPED!'
                    : 'EQUIP'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
        renderItem={renderBadge}
        contentContainerStyle={[s.grid, { paddingBottom: insets.bottom + 32 }]}
      />
    </View>
  );
}

const s = StyleSheet.create({
  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#0d0d24',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#1a1a3e',
  },
  title: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 12,
    color: '#ffffff',
    letterSpacing: 4,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 9,
    color: '#44446a',
    letterSpacing: 0.5,
    marginTop: 2,
  },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 16,
    minHeight: 122,
  },
  heroAvatarWrap: {
    position: 'relative',
    width: 112, height: 112,
    alignItems: 'center', justifyContent: 'center',
  },
  heroGlowRing: {
    position: 'absolute',
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 16,
    shadowOpacity: 1,
  },
  heroInnerRing: {
    position: 'absolute',
    borderWidth: 1,
  },
  heroInfo: {
    flex: 1,
    gap: 10,
  },
  heroName: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 14,
    color: '#ffffff',
    letterSpacing: 1,
    lineHeight: 19,
  },
  equipBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1.5,
    alignSelf: 'flex-start',
  },
  equipBtnText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 8,
    letterSpacing: 1.5,
  },

  // ── Grid ──────────────────────────────────────────────────────────────────
  grid: {
    paddingHorizontal: H_PAD,
    paddingTop: 8,
  },
  cell: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 2,
    position: 'relative',
    borderRadius: 12,
  },
  selectionRing: {
    position: 'absolute',
    top: 16 - 4,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 0 },
  },
  statusBadge: {
    position: 'absolute',
    width: 15, height: 15, borderRadius: 7.5,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeName: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 6.5,
    letterSpacing: 0.5,
    marginTop: 7,
    textAlign: 'center',
    width: SLOT_W - 8,
  },
});
