// ─── Avatar Select Screen — Neon Symbol Avatars ───────────────────────────────
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
const COLS      = 3;
const H_PAD     = 14;
const GAP       = 8;
const CARD_W    = Math.floor((Math.min(SCREEN_W, 420) - H_PAD * 2 - GAP * (COLS - 1)) / COLS);
const CARD_H    = CARD_W + 24;

const RARITY_FILTERS = ['ALL', 'COMMON', 'RARE', 'EPIC', 'LEGENDARY'] as const;
type RarityFilter = typeof RARITY_FILTERS[number];

const TIER_COUNT: Record<string, number> = {
  ALL:       NEON_AVATARS.length,
  COMMON:    NEON_AVATARS.filter(a => a.rarity === 'COMMON').length,
  RARE:      NEON_AVATARS.filter(a => a.rarity === 'RARE').length,
  EPIC:      NEON_AVATARS.filter(a => a.rarity === 'EPIC').length,
  LEGENDARY: NEON_AVATARS.filter(a => a.rarity === 'LEGENDARY').length,
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

  const preview    = getNeonAvatar(previewId) as NeonAvatarData;
  const unlocked   = isNeonAvatarUnlocked(preview, profile.xp);
  const isEquipped = profile.profileImageType === 'symbol'
    && (profile.symbolIndex ?? 0) === previewId;
  const rarityColor = NEON_RARITY_COLORS[preview.rarity];
  const xpPct = Math.min(1, preview.unlockXP > 0 ? profile.xp / preview.unlockXP : 1);

  const filtered = rarityFilter === 'ALL'
    ? NEON_AVATARS
    : NEON_AVATARS.filter(a => a.rarity === (rarityFilter as NeonRarity));

  function pulse() {
    Animated.sequence([
      Animated.timing(previewScale, { toValue: 0.93, duration: 70,  useNativeDriver: true }),
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
      <Animated.View
        style={[s.hero, { transform: [{ scale: previewScale }] }]}
      >
        <LinearGradient
          colors={[preview.bgColor + 'dd', '#050010']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        <NeonAvatarView avatarId={previewId} size={86} isEquipped={isEquipped} isLocked={!unlocked} />

        <View style={s.heroInfo}>
          <View style={[s.rarityBadge, { borderColor: rarityColor + '66', backgroundColor: rarityColor + '1a' }]}>
            <Text style={[s.rarityBadgeText, { color: rarityColor }]}>{preview.rarity}</Text>
          </View>

          <Text style={s.heroName}>{preview.name}</Text>

          {!unlocked ? (
            <View style={s.xpBlock}>
              <View style={s.xpBarBg}>
                <View style={[s.xpBarFill, { width: `${xpPct * 100}%` as `${number}%`, backgroundColor: rarityColor }]} />
              </View>
              <Text style={[s.xpLabel, { color: rarityColor + 'cc' }]}>
                {profile.xp.toLocaleString()} / {preview.unlockXP.toLocaleString()} XP
              </Text>
            </View>
          ) : (
            <Text style={[s.unlockText, { color: rarityColor + 'cc' }]}>
              {preview.unlockCondition}
            </Text>
          )}

          <TouchableOpacity
            style={[
              s.equipBtn,
              {
                borderColor: unlocked ? rarityColor : '#2a2a3a',
                backgroundColor: justEquipped
                  ? rarityColor + '44'
                  : unlocked
                  ? rarityColor + '1a'
                  : '#0a0a1a',
                opacity: !unlocked ? 0.5 : 1,
              },
            ]}
            onPress={handleEquip}
            disabled={!unlocked || isEquipped}
            activeOpacity={0.7}
          >
            <Text style={[s.equipBtnText, { color: unlocked ? rarityColor : '#334' }]}>
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
              style={[s.filterChip, { borderColor: active ? rc : '#1e1e38', backgroundColor: active ? rc + '22' : 'transparent' }]}
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

      {/* ── Avatar grid ── */}
      <FlatList
        data={filtered}
        keyExtractor={(item: NeonAvatarData) => String(item.id)}
        numColumns={COLS}
        contentContainerStyle={[s.grid, { paddingBottom: bottomInset }]}
        columnWrapperStyle={{ gap: GAP }}
        renderItem={({ item }: { item: NeonAvatarData }) => {
          const av       = item;
          const avLocked = !isNeonAvatarUnlocked(av, profile.xp);
          const avRC     = NEON_RARITY_COLORS[av.rarity];
          const selected = previewId === av.id;
          const equipped = profile.profileImageType === 'symbol' && profile.symbolIndex === av.id;

          return (
            <TouchableOpacity
              style={[
                s.tile,
                { width: CARD_W, height: CARD_H },
                selected && { borderColor: avRC, backgroundColor: avRC + '18' },
                !selected && { borderColor: '#1a1a38' },
              ]}
              onPress={() => handleSelect(av)}
              activeOpacity={0.7}
            >
              <NeonAvatarView
                avatarId={av.id}
                size={CARD_W - 16}
                isLocked={avLocked}
                isEquipped={equipped}
              />
              <Text
                style={[s.tileName, { color: selected ? avRC : '#556' }]}
                numberOfLines={1}
              >
                {av.name}
              </Text>

              {equipped && !avLocked && (
                <View style={[s.equippedBadge, { backgroundColor: '#00ff88' }]}>
                  <Ionicons name="checkmark" size={9} color="#000" />
                </View>
              )}

              {selected && (
                <View style={[s.selectedBar, { backgroundColor: avRC }]} />
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
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

  // ── Hero ────────────────────────────────────────────────────────────────────
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 14,
    overflow: 'hidden',
    marginBottom: 4,
    minHeight: 130,
  },
  heroInfo: {
    flex: 1,
    gap: 5,
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
  xpBlock: {
    gap: 4,
  },
  xpBarBg: {
    height: 4,
    backgroundColor: '#1a1a3a',
    borderRadius: 2,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 2,
  },
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

  // ── Filter ──────────────────────────────────────────────────────────────────
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    gap: 6,
    marginBottom: 8,
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

  // ── Grid ────────────────────────────────────────────────────────────────────
  grid: {
    paddingHorizontal: H_PAD,
    gap: GAP,
  },
  tile: {
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: '#0a0a22',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 4,
    paddingHorizontal: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  tileName: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 7,
    letterSpacing: 0.5,
    marginTop: 4,
    textAlign: 'center',
  },
  equippedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2.5,
    opacity: 0.9,
  },
});
