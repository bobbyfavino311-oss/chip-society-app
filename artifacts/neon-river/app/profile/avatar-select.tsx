import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState, useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Platform,
  ScrollView,
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
  PREMIUM_AVATARS,
  AVATAR_CATEGORIES,
  RARITY_COLORS,
  AvatarCategory,
  PremiumAvatar,
  isAvatarUnlocked,
  getAvatar,
} from '@/constants/premiumAvatars';
import AvatarFrame from '@/components/AvatarFrame';
import { useUser } from '@/context/UserContext';

const { width: SCREEN_W } = Dimensions.get('window');
const COL = 3;
const CELL_W = Math.floor((Math.min(SCREEN_W, 420) - 32 - (COL - 1) * 10) / COL);

const ALL_CATEGORIES = ['All', ...AVATAR_CATEGORIES] as const;
const RARITY_FILTERS = ['All', 'COMMON', 'RARE', 'EPIC', 'LEGENDARY'] as const;
type RarityFilter = typeof RARITY_FILTERS[number];

export default function AvatarSelectScreen() {
  const insets = useSafeAreaInsets();
  const { profile, updateProfile } = useUser();

  const [selectedCategory, setSelectedCategory] = useState<typeof ALL_CATEGORIES[number]>('All');
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>('All');
  const [previewId, setPreviewId] = useState<number>(profile.avatarIndex);
  const [justEquipped, setJustEquipped] = useState(false);

  const previewScale = useRef(new Animated.Value(1)).current;

  const equippedAvatar  = getAvatar(profile.avatarIndex);
  const previewAvatar   = getAvatar(previewId);
  const isUnlocked      = isAvatarUnlocked(previewAvatar, profile.xp);
  const isPreviewing    = previewId !== profile.avatarIndex;

  const filteredAvatars = useMemo(() => {
    return PREMIUM_AVATARS.filter(a => {
      const catMatch = selectedCategory === 'All' || a.category === selectedCategory;
      const rarMatch = rarityFilter === 'All' || a.rarity === rarityFilter;
      return catMatch && rarMatch;
    });
  }, [selectedCategory, rarityFilter]);

  const handlePreview = (avatar: PremiumAvatar) => {
    void Haptics.selectionAsync();
    setPreviewId(avatar.id);
    setJustEquipped(false);
    Animated.sequence([
      Animated.timing(previewScale, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.spring(previewScale, { toValue: 1, tension: 160, friction: 8, useNativeDriver: true }),
    ]).start();
  };

  const handleEquip = async () => {
    if (!isUnlocked) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await updateProfile({ avatarIndex: previewId });
    setJustEquipped(true);
    Animated.sequence([
      Animated.timing(previewScale, { toValue: 1.12, duration: 120, useNativeDriver: true }),
      Animated.spring(previewScale, { toValue: 1, tension: 120, friction: 6, useNativeDriver: true }),
    ]).start();
  };

  const rarityColor = RARITY_COLORS[previewAvatar.rarity];
  const xpNeeded    = Math.max(0, previewAvatar.unlockXP - profile.xp);

  const renderAvatar = ({ item }: { item: PremiumAvatar }) => {
    const unlocked    = isAvatarUnlocked(item, profile.xp);
    const isEquipped  = item.id === profile.avatarIndex;
    const isPrev      = item.id === previewId;
    return (
      <TouchableOpacity
        style={[
          s.cell,
          isPrev && { borderColor: item.accentColor + 'aa', backgroundColor: item.accentColor + '12' },
        ]}
        onPress={() => handlePreview(item)}
        activeOpacity={0.75}
      >
        <AvatarFrame
          avatar={item}
          size={CELL_W - 20}
          isEquipped={isEquipped}
          isLocked={!unlocked}
          showRarity={true}
        />
        <Text
          style={[s.cellName, { color: unlocked ? '#ccc' : '#444' }]}
          numberOfLines={2}
          allowFontScaling={false}
        >
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.root}>
      <LinearGradient colors={['#0a0020', '#050010', '#050010']} style={StyleSheet.absoluteFill} />

      {/* Ambient glow blobs */}
      <View style={[s.glow, { top: -60, left: -60, backgroundColor: 'rgba(0,212,255,0.05)' }]} />
      <View style={[s.glow, { bottom: 80, right: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,0,144,0.05)' }]} />

      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 20 : 12) }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={colors.textMuted} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={s.headerTitle}>CHOOSE AVATAR</Text>
          <Text style={s.headerSub}>{PREMIUM_AVATARS.length} PORTRAITS AVAILABLE</Text>
        </View>
        <View style={{ width: 42 }} />
      </View>

      {/* Preview panel */}
      <View style={s.previewPanel}>
        <LinearGradient
          colors={[previewAvatar.gradient[0], previewAvatar.gradient[1], previewAvatar.gradient[2]]}
          style={[StyleSheet.absoluteFill, { opacity: 0.6 }]}
        />
        <Animated.View style={{ transform: [{ scale: previewScale }] }}>
          <AvatarFrame
            avatar={previewAvatar}
            size={100}
            isEquipped={!isPreviewing || justEquipped}
            isLocked={!isUnlocked}
          />
        </Animated.View>
        <View style={s.previewInfo}>
          <View style={[s.rarityPill, { borderColor: rarityColor + '55', backgroundColor: rarityColor + '18' }]}>
            <Text style={[s.rarityPillText, { color: rarityColor }]}>{previewAvatar.rarity}</Text>
          </View>
          <Text style={s.previewName}>{previewAvatar.name}</Text>
          <Text style={s.previewCategory}>{previewAvatar.category}</Text>
          {!isUnlocked && (
            <Text style={s.lockInfo}>🔒  Requires {previewAvatar.unlockXP.toLocaleString()} XP  ({xpNeeded.toLocaleString()} more)</Text>
          )}
        </View>
        <TouchableOpacity
          style={[
            s.equipBtn,
            {
              backgroundColor: isUnlocked ? previewAvatar.accentColor : 'rgba(255,255,255,0.06)',
              borderColor: isUnlocked ? previewAvatar.accentColor : 'rgba(255,255,255,0.12)',
              opacity: (profile.avatarIndex === previewId && !justEquipped) ? 0.5 : 1,
            },
          ]}
          onPress={handleEquip}
          disabled={!isUnlocked || (profile.avatarIndex === previewId)}
          activeOpacity={0.8}
        >
          <Ionicons
            name={justEquipped && profile.avatarIndex === previewId ? 'checkmark-circle' : 'shirt'}
            size={15}
            color={isUnlocked ? '#050010' : colors.textMuted}
          />
          <Text style={[s.equipBtnText, { color: isUnlocked ? '#050010' : colors.textMuted }]}>
            {justEquipped && profile.avatarIndex === previewId
              ? 'EQUIPPED'
              : profile.avatarIndex === previewId
                ? 'CURRENT'
                : isUnlocked
                  ? 'EQUIP'
                  : 'LOCKED'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.categoryBar}
        style={s.categoryScroll}
      >
        {ALL_CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[
              s.catChip,
              selectedCategory === cat && { borderColor: colors.primary + '99', backgroundColor: colors.primary + '18' },
            ]}
            onPress={() => setSelectedCategory(cat)}
            activeOpacity={0.7}
          >
            <Text style={[s.catChipText, selectedCategory === cat && { color: colors.primary }]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Rarity filter */}
      <View style={s.rarityBar}>
        {RARITY_FILTERS.map(r => {
          const col = r === 'All' ? '#888' : RARITY_COLORS[r as keyof typeof RARITY_COLORS];
          const active = rarityFilter === r;
          return (
            <TouchableOpacity
              key={r}
              style={[s.rarityChip, active && { borderColor: col, backgroundColor: col + '18' }]}
              onPress={() => setRarityFilter(r)}
              activeOpacity={0.7}
            >
              <Text style={[s.rarityChipText, { color: active ? col : '#666' }]}>{r}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Count */}
      <View style={s.countRow}>
        <Text style={s.countText}>{filteredAvatars.length} avatars</Text>
        <Text style={s.xpText}>Your XP: {profile.xp.toLocaleString()}</Text>
      </View>

      {/* Avatar grid */}
      <FlatList
        data={filteredAvatars}
        keyExtractor={a => String(a.id)}
        renderItem={renderAvatar}
        numColumns={COL}
        columnWrapperStyle={s.row}
        contentContainerStyle={[s.grid, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        initialNumToRender={18}
        maxToRenderPerBatch={12}
        windowSize={5}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050010' },
  glow: { position: 'absolute', width: 240, height: 240, borderRadius: 120 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: colors.border,
  },
  headerTitle: {
    color: '#fff', fontSize: 15, fontWeight: '900',
    fontFamily: 'Orbitron_900Black', letterSpacing: 2,
  },
  headerSub: {
    color: colors.textDim, fontSize: 8, letterSpacing: 2, marginTop: 2,
  },

  previewPanel: {
    marginHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    overflow: 'hidden',
    marginBottom: 12,
  },
  previewInfo: { flex: 1, gap: 4 },
  rarityPill: {
    alignSelf: 'flex-start',
    borderRadius: 5, borderWidth: 1,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  rarityPillText: {
    fontSize: 7, fontWeight: '900',
    fontFamily: 'Orbitron_700Bold', letterSpacing: 1.5,
  },
  previewName: {
    color: '#fff', fontSize: 14, fontWeight: '900',
    fontFamily: 'Orbitron_700Bold', letterSpacing: 0.5,
  },
  previewCategory: { color: colors.textDim, fontSize: 9, letterSpacing: 0.5 },
  lockInfo: { color: '#aa6600', fontSize: 8, marginTop: 2 },
  equipBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  equipBtnText: { fontSize: 10, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 1 },

  categoryScroll: { maxHeight: 40, marginBottom: 6 },
  categoryBar: { paddingHorizontal: 16, gap: 6 },
  catChip: {
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  catChipText: { fontSize: 9, color: '#888', fontWeight: '700', letterSpacing: 0.5 },

  rarityBar: {
    flexDirection: 'row', gap: 5, paddingHorizontal: 16, marginBottom: 8, flexWrap: 'wrap',
  },
  rarityChip: {
    borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 9, paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  rarityChipText: { fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },

  countRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 16, marginBottom: 8,
  },
  countText: { color: colors.textDim, fontSize: 9 },
  xpText: { color: colors.primary, fontSize: 9, fontFamily: 'Orbitron_400Regular' },

  grid: { paddingHorizontal: 16 },
  row: { gap: 10, marginBottom: 10 },
  cell: {
    width: CELL_W,
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  cellName: {
    fontSize: 8, textAlign: 'center',
    fontFamily: 'Orbitron_400Regular',
    letterSpacing: 0.2, lineHeight: 12,
  },
});
