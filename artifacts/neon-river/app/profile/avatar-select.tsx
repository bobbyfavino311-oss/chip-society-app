// ─── Character Select Screen — Premium Portrait Cards ─────────────────────────
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState, useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
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
  CHARACTERS,
  RARITY_COLORS,
  getCharacter,
  isUnlocked,
  type Character,
  type Rarity,
} from '@/constants/characters';
import CHARACTER_IMAGES from '@/constants/characterImages';
import CharacterPortrait from '@/components/CharacterPortrait';
import CharacterUnlockModal from '@/components/CharacterUnlockModal';
import { useUser } from '@/context/UserContext';

const { width: SCREEN_W } = Dimensions.get('window');
const COLS = 2;
const H_PAD = 16;
const GAP = 10;
const CARD_W = Math.floor((Math.min(SCREEN_W, 420) - H_PAD * 2 - GAP) / COLS);
const IMG_H  = Math.round(CARD_W * 152 / 134); // match source portrait ratio 134:152
const INFO_H = 40;
const CARD_H = IMG_H + INFO_H;

const RARITY_FILTERS = ['ALL', 'COMMON', 'RARE', 'EPIC', 'LEGENDARY'] as const;
type RarityFilter = typeof RARITY_FILTERS[number];

const TIER_COLORS: Record<string, string> = {
  ALL:       '#6070a0',
  COMMON:    RARITY_COLORS.COMMON,
  RARE:      RARITY_COLORS.RARE,
  EPIC:      RARITY_COLORS.EPIC,
  LEGENDARY: RARITY_COLORS.LEGENDARY,
};

const TIER_COUNT: Record<string, number> = {
  ALL:       CHARACTERS.length,
  COMMON:    CHARACTERS.filter(c => c.rarity === 'COMMON').length,
  RARE:      CHARACTERS.filter(c => c.rarity === 'RARE').length,
  EPIC:      CHARACTERS.filter(c => c.rarity === 'EPIC').length,
  LEGENDARY: CHARACTERS.filter(c => c.rarity === 'LEGENDARY').length,
};

export default function CharacterSelectScreen() {
  const insets = useSafeAreaInsets();
  const { profile, updateProfile } = useUser();

  const [rarityFilter, setRarityFilter] = useState<RarityFilter>('ALL');
  const [previewId,    setPreviewId]    = useState<number>(profile.avatarIndex ?? 1);
  const [justEquipped, setJustEquipped] = useState(false);
  const [unlockChar,   setUnlockChar]   = useState<Character | null>(null);
  const [showUnlock,   setShowUnlock]   = useState(false);

  const previewScale = useRef(new Animated.Value(1)).current;

  const equippedChar  = getCharacter(profile.avatarIndex ?? 1);
  const previewChar   = getCharacter(previewId);
  const canUnlock     = isUnlocked(previewChar, profile.xp);
  const rarityColor   = RARITY_COLORS[previewChar.rarity];
  const xpPct         = Math.min(1, previewChar.unlockXP > 0 ? profile.xp / previewChar.unlockXP : 1);

  const filtered = useMemo(() =>
    CHARACTERS.filter(c =>
      rarityFilter === 'ALL' || c.rarity === (rarityFilter as Rarity)
    ),
  [rarityFilter]);

  function handleSelect(char: Character) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPreviewId(char.id);
    Animated.sequence([
      Animated.timing(previewScale, { toValue: 0.94, duration: 70,  useNativeDriver: true }),
      Animated.spring(previewScale,  { toValue: 1,    friction: 4,   useNativeDriver: true }),
    ]).start();
  }

  async function handleEquip() {
    if (!canUnlock) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await updateProfile({ avatarIndex: previewId });
    setJustEquipped(true);
    setTimeout(() => setJustEquipped(false), 1600);
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#050010' }}>
      <LinearGradient colors={['#0a0025', '#050010']} style={StyleSheet.absoluteFill} />

      {/* ── Header ── */}
      <View style={[s.header, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={s.title}>CHARACTERS</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* ── Preview hero ── */}
      <Animated.View style={[s.hero, { transform: [{ scale: previewScale }] }]}>
        <LinearGradient
          colors={[previewChar.portraitColors[0] + 'dd', '#050010']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />

        {/* Portrait */}
        <View style={[s.heroImgWrap, { borderColor: rarityColor }]}>
          {CHARACTER_IMAGES[previewChar.id] ? (
            <Image
              source={CHARACTER_IMAGES[previewChar.id]}
              style={s.heroImg}
              resizeMode="cover"
            />
          ) : null}
          {!canUnlock && (
            <LinearGradient
              colors={['rgba(5,0,16,0.0)', 'rgba(5,0,16,0.7)']}
              style={StyleSheet.absoluteFill}
            />
          )}
        </View>

        {/* Info panel */}
        <View style={s.heroInfo}>
          <View style={[s.rarityBadge, { borderColor: rarityColor + '66', backgroundColor: rarityColor + '1a' }]}>
            <Text style={[s.rarityBadgeText, { color: rarityColor }]}>{previewChar.rarity}</Text>
          </View>
          <Text style={s.heroName}>{previewChar.name}</Text>
          <Text style={s.heroBio} numberOfLines={3}>{previewChar.bio}</Text>

          {!canUnlock ? (
            <View style={s.xpBlock}>
              <View style={s.xpBarBg}>
                <View style={[s.xpBarFill, { width: `${xpPct * 100}%` as any, backgroundColor: rarityColor }]} />
              </View>
              <Text style={[s.xpLabel, { color: rarityColor + 'cc' }]}>
                {profile.xp.toLocaleString()} / {previewChar.unlockXP.toLocaleString()} XP
              </Text>
            </View>
          ) : (
            <Text style={[s.unlockText, { color: rarityColor + 'cc' }]}>
              ✓ {previewChar.unlockCondition}
            </Text>
          )}

          <TouchableOpacity
            style={[
              s.equipBtn,
              {
                borderColor: canUnlock ? rarityColor : '#2a2a3a',
                backgroundColor: justEquipped
                  ? rarityColor + '44'
                  : canUnlock
                  ? rarityColor + '1a'
                  : '#0a0a1a',
                opacity: !canUnlock ? 0.5 : 1,
              },
            ]}
            onPress={handleEquip}
            disabled={!canUnlock || previewId === (profile.avatarIndex ?? 1)}
            activeOpacity={0.7}
          >
            <Text style={[s.equipBtnText, { color: canUnlock ? rarityColor : '#334' }]}>
              {!canUnlock
                ? `LOCKED — ${(previewChar.unlockXP - profile.xp).toLocaleString()} XP`
                : previewId === (profile.avatarIndex ?? 1)
                ? '✓ EQUIPPED'
                : justEquipped
                ? '✓ EQUIPPED!'
                : 'EQUIP CHARACTER'}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* ── Rarity filter tabs ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filterRow}
        style={s.filterScroll}
      >
        {RARITY_FILTERS.map(r => {
          const active = rarityFilter === r;
          const rc = TIER_COLORS[r];
          return (
            <TouchableOpacity
              key={r}
              style={[s.filterChip, { borderColor: active ? rc : '#1e1e38', backgroundColor: active ? rc + '22' : 'transparent' }]}
              onPress={() => setRarityFilter(r)}
              activeOpacity={0.7}
            >
              <Text style={[s.filterText, { color: active ? rc : '#445' }]}>
                {r} · {TIER_COUNT[r]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Character portrait grid ── */}
      <FlatList
        data={filtered}
        keyExtractor={c => String(c.id)}
        numColumns={COLS}
        contentContainerStyle={s.grid}
        columnWrapperStyle={{ gap: GAP }}
        renderItem={({ item }) => {
          const locked   = !isUnlocked(item, profile.xp);
          const equipped = item.id === (profile.avatarIndex ?? 1);
          const selected = item.id === previewId;
          const rc       = RARITY_COLORS[item.rarity];

          return (
            <TouchableOpacity
              style={[
                s.card,
                {
                  width: CARD_W,
                  height: CARD_H,
                  borderColor: selected ? rc : equipped ? rc + '66' : '#14142a',
                  backgroundColor: selected ? rc + '0f' : '#08081a',
                },
              ]}
              onPress={() => handleSelect(item)}
              activeOpacity={0.78}
            >
              {/* Portrait image */}
              <View style={[s.cardImgWrap, { height: IMG_H }]}>
                {CHARACTER_IMAGES[item.id] ? (
                  <Image
                    source={CHARACTER_IMAGES[item.id]}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={{ flex: 1, backgroundColor: '#0a0020' }} />
                )}

                {/* Locked silhouette overlay */}
                {locked && (
                  <View style={s.lockedOverlay}>
                    <LinearGradient
                      colors={['rgba(5,0,16,0.55)', 'rgba(5,0,16,0.92)']}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={s.lockedContent}>
                      <Ionicons name="lock-closed" size={20} color={rc} />
                      <Text style={[s.lockedLabel, { color: rc }]}>LOCKED</Text>
                      <Text style={[s.lockedXP, { color: rc + 'aa' }]}>
                        {item.unlockXP >= 1000
                          ? `${(item.unlockXP / 1000).toFixed(0)}K XP`
                          : `${item.unlockXP} XP`}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Bottom gradient fade into card info */}
                {!locked && (
                  <LinearGradient
                    colors={['transparent', 'rgba(8,8,26,0.6)']}
                    style={s.imgBottomFade}
                  />
                )}

                {/* Equipped indicator */}
                {equipped && (
                  <View style={[s.equippedBadge, { backgroundColor: '#00ff88' }]}>
                    <Ionicons name="checkmark" size={9} color="#000" />
                  </View>
                )}

                {/* Rarity glow for Epic/Legendary */}
                {(item.rarity === 'EPIC' || item.rarity === 'LEGENDARY') && !locked && (
                  <View style={[s.rarityGlowBar, { backgroundColor: rc }]} />
                )}
              </View>

              {/* Card info */}
              <View style={s.cardInfo}>
                <Text style={[s.cardName, { color: locked ? '#2a2a40' : selected ? rc : '#8090b8' }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={[s.cardRarityDot, { backgroundColor: locked ? '#1a1a2a' : rc }]} />
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <CharacterUnlockModal
        character={unlockChar}
        visible={showUnlock}
        onClose={() => { setShowUnlock(false); setUnlockChar(null); }}
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
    backgroundColor: '#0f0f2a', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#1a1a40',
  },
  title: {
    fontFamily: 'Orbitron_700Bold', fontSize: 13,
    color: '#ffffff', letterSpacing: 4,
  },

  // ── Hero preview ────────────────────────────────────────────────────────────
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 14,
    overflow: 'hidden',
    marginBottom: 4,
  },
  heroImgWrap: {
    width: 84, height: Math.round(84 * 152 / 134),
    borderRadius: 10,
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: '#0a0020',
    flexShrink: 0,
  },
  heroImg: { width: '100%', height: '100%' },
  heroInfo: { flex: 1, gap: 5 },
  rarityBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1, borderRadius: 4,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  rarityBadgeText: { fontFamily: 'Orbitron_700Bold', fontSize: 7.5, letterSpacing: 1.5 },
  heroName: { fontFamily: 'Orbitron_700Bold', fontSize: 13, color: '#fff', letterSpacing: 0.3 },
  heroBio: { fontFamily: 'Orbitron_400Regular', fontSize: 8.5, color: '#5060a0', lineHeight: 13 },
  xpBlock: { gap: 3 },
  xpBarBg: { height: 3, backgroundColor: '#1a1a3a', borderRadius: 2, overflow: 'hidden' },
  xpBarFill: { height: '100%', borderRadius: 2 },
  xpLabel: { fontFamily: 'Orbitron_400Regular', fontSize: 7.5, letterSpacing: 0.3 },
  unlockText: { fontFamily: 'Orbitron_400Regular', fontSize: 8, letterSpacing: 0.3 },
  equipBtn: {
    paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 8, borderWidth: 1,
    alignItems: 'center', marginTop: 2,
  },
  equipBtnText: { fontFamily: 'Orbitron_700Bold', fontSize: 8.5, letterSpacing: 2 },

  // ── Filter tabs ─────────────────────────────────────────────────────────────
  filterScroll: { flexGrow: 0, marginBottom: 10 },
  filterRow: { paddingHorizontal: 16, gap: 8, paddingVertical: 2 },
  filterChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1,
  },
  filterText: { fontFamily: 'Orbitron_700Bold', fontSize: 7.5, letterSpacing: 1.5 },

  // ── Portrait cards ──────────────────────────────────────────────────────────
  grid: {
    paddingHorizontal: H_PAD,
    paddingBottom: 40,
    gap: GAP,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  cardImgWrap: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0a0020',
  },
  imgBottomFade: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 32,
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedContent: {
    alignItems: 'center',
    gap: 3,
  },
  lockedLabel: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 9,
    letterSpacing: 2,
  },
  lockedXP: {
    fontFamily: 'Orbitron_400Regular',
    fontSize: 8,
    letterSpacing: 0.5,
  },
  equippedBadge: {
    position: 'absolute',
    top: 6, right: 6,
    width: 16, height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rarityGlowBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 2,
    opacity: 0.8,
  },
  cardInfo: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardName: {
    fontFamily: 'Orbitron_400Regular',
    fontSize: 8,
    flex: 1,
    letterSpacing: 0.2,
  },
  cardRarityDot: {
    width: 6, height: 6,
    borderRadius: 3,
    marginLeft: 6,
    flexShrink: 0,
  },
});
