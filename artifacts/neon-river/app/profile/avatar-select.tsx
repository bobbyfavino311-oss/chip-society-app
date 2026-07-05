// ─── Avatar Select — Premium Collectible Badge Gallery ────────────────────────
// First 9 free. Rest unlock by level. Small lock icon in corner; tap to see requirement.

import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Modal,
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

const TOTAL_AVATARS = NEON_AVATARS.length;

export default function AvatarSelectScreen() {
  const insets = useSafeAreaInsets();
  const { profile, updateProfile } = useUser();

  const currentId = (profile.symbolIndex && profile.symbolIndex > 0)
    ? profile.symbolIndex
    : 1;

  const [previewId, setPreviewId]         = useState<number>(currentId);
  const [justEquipped, setJustEquipped]   = useState(false);
  const [lockedModal, setLockedModal]     = useState<NeonAvatarData | null>(null);

  const previewScale = useRef(new Animated.Value(1)).current;

  const playerLevel = profile.level ?? 1;
  const preview     = getNeonAvatar(previewId) as NeonAvatarData;
  const unlocked    = isNeonAvatarUnlocked(preview, profile.xp, playerLevel);
  const isEquipped  = profile.profileImageType === 'symbol'
    && (profile.symbolIndex ?? 0) === previewId;
  const accentColor = preview.color;

  function pulse() {
    Animated.sequence([
      Animated.timing(previewScale, { toValue: 0.93, duration: 70, useNativeDriver: true }),
      Animated.spring(previewScale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
  }

  function handleSelect(av: NeonAvatarData) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const avUnlocked = isNeonAvatarUnlocked(av, profile.xp, playerLevel);
    if (!avUnlocked) {
      setLockedModal(av);
      return;
    }
    setPreviewId(av.id);
    pulse();
  }

  async function handleEquip() {
    if (!unlocked) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await updateProfile({ symbolIndex: previewId, avatarIndex: previewId, profileImageType: 'symbol' });
    setJustEquipped(true);
    setTimeout(() => setJustEquipped(false), 1600);
  }

  // ── Grid cell ──────────────────────────────────────────────────────────────
  function renderBadge({ item }: { item: NeonAvatarData }) {
    const avLocked  = !isNeonAvatarUnlocked(item, profile.xp, playerLevel);
    const ac        = item.color;
    const selected  = previewId === item.id;
    const equipped  = profile.profileImageType === 'symbol'
      && profile.symbolIndex === item.id;

    return (
      <TouchableOpacity
        style={[s.cell, { width: SLOT_W }]}
        onPress={() => handleSelect(item)}
        activeOpacity={avLocked ? 0.9 : 0.75}
      >
        {/* Selection ring */}
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
          {/* Dim overlay for locked */}
          {avLocked && (
            <View style={[StyleSheet.absoluteFill, s.lockedOverlay, { borderRadius: AV_SIZE / 2 }]} />
          )}

          <NeonAvatarView
            avatarId={item.id}
            size={AV_SIZE}
            isLocked={avLocked}
            isEquipped={equipped}
          />

          {/* Equipped — gold check */}
          {equipped && (
            <View style={[s.statusBadge, { backgroundColor: '#ffd700', borderColor: '#000', bottom: 1, right: 1 }]}>
              <Ionicons name="checkmark" size={8} color="#000" />
            </View>
          )}

          {/* Locked — small lock icon in corner */}
          {avLocked && !equipped && (
            <View style={[s.statusBadge, { backgroundColor: 'rgba(5,0,16,0.88)', borderColor: 'rgba(255,255,255,0.15)', bottom: 1, right: 1 }]}>
              <Ionicons name="lock-closed" size={7} color="rgba(255,255,255,0.55)" />
            </View>
          )}
        </View>

        <Text
          style={[s.badgeName, { color: avLocked ? '#28284a' : selected ? ac : '#3a3a60' }]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#050010' }}>

      <LinearGradient
        colors={['#0a001f', '#050010', '#010008']}
        style={StyleSheet.absoluteFill}
      />

      <LinearGradient
        colors={[accentColor + '1a', 'transparent']}
        style={[StyleSheet.absoluteFill, { height: 220 }]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Header */}
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

            <View style={s.heroInfo}>
              <Text style={s.heroName}>{preview.name}</Text>

              {!unlocked && (
                <View style={s.levelBadge}>
                  <Ionicons name="lock-closed" size={10} color="rgba(255,255,255,0.4)" />
                  <Text style={s.levelBadgeText}>{preview.unlockCondition}</Text>
                </View>
              )}

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
                <Text style={[s.equipBtnText, { color: unlocked ? accentColor : '#22225a' }]}>
                  {!unlocked
                    ? `LOCKED — ${preview.unlockCondition.toUpperCase()}`
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

      {/* Locked avatar tap → info modal */}
      <Modal
        visible={!!lockedModal}
        transparent
        animationType="fade"
        onRequestClose={() => setLockedModal(null)}
      >
        <TouchableOpacity
          style={s.modalOverlay}
          activeOpacity={1}
          onPress={() => setLockedModal(null)}
        >
          <View style={s.modalCard}>
            <LinearGradient
              colors={['#12002a', '#050010']}
              style={StyleSheet.absoluteFill}
            />
            <View style={[s.modalLockIcon, { borderColor: lockedModal ? lockedModal.color + '55' : '#333' }]}>
              <Ionicons name="lock-closed" size={28} color={lockedModal?.color ?? colors.primary} />
            </View>
            <Text style={s.modalAvatarName}>{lockedModal?.name}</Text>
            <Text style={s.modalRequirement}>{lockedModal?.unlockCondition}</Text>
            <Text style={s.modalCurrentLevel}>
              YOUR LEVEL: <Text style={{ color: colors.primary }}>{playerLevel}</Text>
              {lockedModal && lockedModal.unlockLevel > 0 && (
                <>
                  {'  '}·{'  '}
                  <Text style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {lockedModal.unlockLevel - playerLevel} LEVELS TO GO
                  </Text>
                </>
              )}
            </Text>
            <Text style={s.modalHint}>Keep playing to earn XP and level up!</Text>
            <TouchableOpacity style={s.modalBtn} onPress={() => setLockedModal(null)}>
              <Text style={s.modalBtnText}>GOT IT</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}

const s = StyleSheet.create({
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

  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 16,
    minHeight: 130,
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
    gap: 8,
  },
  heroName: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 14,
    color: '#ffffff',
    letterSpacing: 1,
    lineHeight: 19,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  levelBadgeText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 0.3,
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
  lockedOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(5,0,16,0.55)',
    zIndex: 1,
  },
  statusBadge: {
    position: 'absolute',
    width: 15, height: 15, borderRadius: 7.5,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 2,
  },
  badgeName: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 6.5,
    letterSpacing: 0.5,
    marginTop: 7,
    textAlign: 'center',
    width: SLOT_W - 8,
  },

  // Locked modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  modalCard: {
    width: '100%',
    maxWidth: 300,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    gap: 10,
  },
  modalLockIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  modalAvatarName: {
    fontFamily: 'Orbitron_900Black',
    fontSize: 16,
    color: '#fff',
    letterSpacing: 2,
    textAlign: 'center',
  },
  modalRequirement: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 12,
    color: colors.primary,
    letterSpacing: 1,
    textAlign: 'center',
  },
  modalCurrentLevel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  modalHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.25)',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 2,
  },
  modalBtn: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(0,212,255,0.4)',
    backgroundColor: 'rgba(0,212,255,0.07)',
  },
  modalBtnText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 11,
    color: colors.primary,
    letterSpacing: 2,
  },
});
