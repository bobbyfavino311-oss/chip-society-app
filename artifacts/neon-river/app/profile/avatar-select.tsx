// ─── Avatar Select Screen — Circular Neon Gallery ─────────────────────────────
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
const COLS    = 3;
const H_PAD   = 16;
const SLOT_W  = Math.floor((Math.min(SCREEN_W, 420) - H_PAD * 2) / COLS);
const AV_SIZE = Math.min(SLOT_W - 20, 88);

const RARITY_FILTERS = ['ALL', 'COMMON', 'RARE', 'EPIC', 'LEGENDARY'] as const;
type RarityFilter = typeof RARITY_FILTERS[number];

const TIER_COUNT: Record<string, number> = {
  ALL:       NEON_AVATARS.length,
  COMMON:    NEON_AVATARS.filter(a => a.rarity === 'COMMON').length,
  RARE:      NEON_AVATARS.filter(a => a.rarity === 'RARE').length,
  EPIC:      NEON_AVATARS.filter(a => a.rarity === 'EPIC').length,
  LEGENDARY: NEON_AVATARS.filter(a => a.rarity === 'LEGENDARY').length,
};

const RARITY_RING: Record<NeonRarity, string> = {
  COMMON:    '#00d4ff',
  RARE:      '#4080ff',
  EPIC:      '#d040ff',
  LEGENDARY: '#ffd700',
};

export default function AvatarSelectScreen() {
  const insets = useSafeAreaInsets();
  const { profile, updateProfile } = useUser();

  const currentId = profile.symbolIndex && profile.symbolIndex > 0
    ? profile.symbolIndex
    : 1;

  const [previewId, setPreviewId]       = useState<number>(currentId);
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>('ALL');
  const [justEquipped, setJustEquipped] = useState(false);

  const previewScale = useRef(new Animated.Value(1)).current;

  const preview     = getNeonAvatar(previewId) as NeonAvatarData;
  const unlocked    = isNeonAvatarUnlocked(preview, profile.xp);
  const isEquipped  = profile.profileImageType === 'symbol'
    && (profile.symbolIndex ?? 0) === previewId;
  const rarityColor = NEON_RARITY_COLORS[preview.rarity];
  const ringColor   = RARITY_RING[preview.rarity];
  const xpPct       = Math.min(1, preview.unlockXP > 0 ? profile.xp / preview.unlockXP : 1);

  const filtered = rarityFilter === 'ALL'
    ? NEON_AVATARS
    : NEON_AVATARS.filter(a => a.rarity === (rarityFilter as NeonRarity));

  function pulse() {
    Animated.sequence([
      Animated.timing(previewScale, { toValue: 0.94, duration: 70,  useNativeDriver: true }),
      Animated.spring(previewScale,  { toValue: 1,   friction: 4,   useNativeDriver: true }),
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

  const bottomInset = insets.bottom + 16;

  return (
    <View style={{ flex: 1, backgroundColor: '#050010' }}>
      <LinearGradient colors={['#0a0025', '#050010']} style={StyleSheet.absoluteFill} />

      {/* ── Header ── */}
      <View style={[s.header, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={s.title}>AVATAR SELECT</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* ── Hero preview ── */}
      <Animated.View style={[s.hero, { transform: [{ scale: previewScale }] }]}>
        {/* Subtle ambient gradient behind hero */}
        <LinearGradient
          colors={[ringColor + '28', 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Large circular avatar */}
        <View style={s.heroAvatarWrap}>
          {/* Outer glow ring */}
          <View style={[s.heroGlowRing, { borderColor: ringColor + '60', shadowColor: ringColor }]} />
          <NeonAvatarView avatarId={previewId} size={100} isEquipped={isEquipped} isLocked={!unlocked} />
        </View>

        {/* Info panel */}
        <View style={s.heroInfo}>
          <View style={[s.rarityBadge, { borderColor: rarityColor + '80', backgroundColor: rarityColor + '18' }]}>
            <Text style={[s.rarityBadgeText, { color: rarityColor }]}>{preview.rarity}</Text>
          </View>

          <Text style={s.heroName}>{preview.name}</Text>

          {!unlocked ? (
            <View style={s.xpBlock}>
              <View style={s.xpBarBg}>
                <View style={[s.xpBarFill, { width: `${xpPct * 100}%` as `${number}%`, backgroundColor: ringColor }]} />
              </View>
              <Text style={[s.xpLabel, { color: rarityColor + 'bb' }]}>
                {profile.xp.toLocaleString()} / {preview.unlockXP.toLocaleString()} XP
              </Text>
            </View>
          ) : (
            <Text style={[s.unlockText, { color: rarityColor + 'bb' }]}>
              {preview.unlockCondition}
            </Text>
          )}

          <TouchableOpacity
            style={[
              s.equipBtn,
              {
                borderColor: unlocked ? ringColor : '#2a2a3a',
                backgroundColor: justEquipped
                  ? ringColor + '40'
                  : unlocked ? ringColor + '18' : '#0a0a1a',
                opacity: !unlocked ? 0.5 : 1,
              },
            ]}
            onPress={handleEquip}
            disabled={!unlocked || isEquipped}
            activeOpacity={0.7}
          >
            <Text style={[s.equipBtnText, { color: unlocked ? ringColor : '#334' }]}>
              {!unlocked
                ? `LOCKED — ${(preview.unlockXP - profile.xp).toLocaleString()} XP`
                : isEquipped
                ? '✓ EQUIPPED'
                : justEquipped
                ? '✓ EQUIPPED!'
                : 'EQUIP AVATAR'}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* ── Rarity filter tabs ── */}
      <View style={s.filterRow}>
        {RARITY_FILTERS.map(r => {
          const active = rarityFilter === r;
          const rc = r === 'ALL' ? '#6070a0' : NEON_RARITY_COLORS[r as NeonRarity];
          return (
            <TouchableOpacity
              key={r}
              style={[s.filterChip, {
                borderColor: active ? rc : '#1e1e38',
                backgroundColor: active ? rc + '22' : 'transparent',
              }]}
              onPress={() => setRarityFilter(r)}
              activeOpacity={0.7}
            >
              <Text style={[s.filterText, { color: active ? rc : '#445' }]}>
                {r === 'ALL' ? 'ALL' : r.slice(0, 4)} · {TIER_COUNT[r]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Circular avatar gallery ── */}
      <FlatList
        data={filtered}
        keyExtractor={(item: NeonAvatarData) => String(item.id)}
        numColumns={COLS}
        contentContainerStyle={[s.grid, { paddingBottom: bottomInset }]}
        renderItem={({ item }: { item: NeonAvatarData }) => {
          const avLocked  = !isNeonAvatarUnlocked(item, profile.xp);
          const avRC      = RARITY_RING[item.rarity];
          const selected  = previewId === item.id;
          const equipped  = profile.profileImageType === 'symbol' && profile.symbolIndex === item.id;

          return (
            <TouchableOpacity
              style={s.cell}
              onPress={() => handleSelect(item)}
              activeOpacity={0.75}
            >
              {/* Selection glow ring — renders behind the avatar */}
              {selected && (
                <View style={[s.selectionRing, {
                  width:  AV_SIZE + 16,
                  height: AV_SIZE + 16,
                  borderRadius: (AV_SIZE + 16) / 2,
                  borderColor: avRC,
                  shadowColor: avRC,
                }]} />
              )}

              <NeonAvatarView
                avatarId={item.id}
                size={AV_SIZE}
                isLocked={avLocked}
                isEquipped={equipped}
              />

              {/* Equipped dot */}
              {equipped && !avLocked && (
                <View style={s.equippedDot}>
                  <Ionicons name="checkmark" size={8} color="#000" />
                </View>
              )}

              <Text
                style={[s.cellName, { color: selected ? avRC : '#4a5070' }]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  // ── Header ────────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#0f0f2a',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#1a1a40',
  },
  title: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 13,
    color: '#ffffff',
    letterSpacing: 4,
  },

  // ── Hero ──────────────────────────────────────────────────────────────────────
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 18,
    overflow: 'hidden',
    marginBottom: 6,
    minHeight: 140,
  },
  heroAvatarWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 116,
    height: 116,
  },
  heroGlowRing: {
    position: 'absolute',
    width: 116,
    height: 116,
    borderRadius: 58,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 16,
    shadowOpacity: 0.8,
  },
  heroInfo: {
    flex: 1,
    gap: 6,
  },
  rarityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  rarityBadgeText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 8,
    letterSpacing: 2,
  },
  heroName: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 15,
    color: '#ffffff',
    letterSpacing: 1,
  },
  xpBlock: { gap: 4 },
  xpBarBg: {
    height: 4,
    backgroundColor: '#1a1a3a',
    borderRadius: 2,
    overflow: 'hidden',
  },
  xpBarFill: { height: '100%', borderRadius: 2 },
  xpLabel: {
    fontSize: 9,
    fontFamily: 'Orbitron_700Bold',
    letterSpacing: 0.5,
  },
  unlockText: {
    fontSize: 9,
    fontFamily: 'Orbitron_700Bold',
    letterSpacing: 0.5,
  },
  equipBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  equipBtnText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 9,
    letterSpacing: 1.5,
  },

  // ── Filter ────────────────────────────────────────────────────────────────────
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    gap: 6,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 7.5,
    letterSpacing: 1,
  },

  // ── Circular gallery ──────────────────────────────────────────────────────────
  grid: {
    paddingHorizontal: H_PAD,
    paddingTop: 4,
  },
  cell: {
    width: SLOT_W,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  selectionRing: {
    position: 'absolute',
    top: 12 - 8,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    shadowOpacity: 0.9,
  },
  equippedDot: {
    position: 'absolute',
    top: 12 + AV_SIZE - 14,
    right: SLOT_W / 2 - AV_SIZE / 2 - 2,
    width: 14, height: 14,
    borderRadius: 7,
    backgroundColor: '#00ff88',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#050010',
  },
  cellName: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 7,
    letterSpacing: 0.5,
    marginTop: 7,
    textAlign: 'center',
    width: SLOT_W - 8,
  },
});
