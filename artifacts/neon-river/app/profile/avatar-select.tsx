// ─── Character Select Screen ─────────────────────────────────────────────────
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState, useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
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
import CharacterPortrait from '@/components/CharacterPortrait';
import CharacterUnlockModal from '@/components/CharacterUnlockModal';
import { useUser } from '@/context/UserContext';

const { width: SCREEN_W } = Dimensions.get('window');
const COL = 3;
const CELL_W = Math.floor((Math.min(SCREEN_W, 420) - 32 - (COL - 1) * 10) / COL);

const RARITY_FILTERS = ['All', 'COMMON', 'RARE', 'EPIC', 'LEGENDARY'] as const;
type RarityFilter = typeof RARITY_FILTERS[number];

const RARITY_LABEL_COLOR: Record<string, string> = {
  All:       '#8090a8',
  COMMON:    RARITY_COLORS.COMMON,
  RARE:      RARITY_COLORS.RARE,
  EPIC:      RARITY_COLORS.EPIC,
  LEGENDARY: RARITY_COLORS.LEGENDARY,
};

export default function CharacterSelectScreen() {
  const insets = useSafeAreaInsets();
  const { profile, updateProfile } = useUser();

  const [rarityFilter, setRarityFilter] = useState<RarityFilter>('All');
  const [previewId,    setPreviewId]    = useState<number>(profile.avatarIndex ?? 1);
  const [justEquipped, setJustEquipped] = useState(false);
  const [unlockChar,   setUnlockChar]   = useState<Character | null>(null);
  const [showUnlock,   setShowUnlock]   = useState(false);

  const previewScale = useRef(new Animated.Value(1)).current;

  const equippedChar  = getCharacter(profile.avatarIndex ?? 1);
  const previewChar   = getCharacter(previewId);
  const canUnlock     = isUnlocked(previewChar, profile.xp);
  const isPreviewing  = previewId !== (profile.avatarIndex ?? 1);

  const filtered = useMemo(() =>
    CHARACTERS.filter(c =>
      rarityFilter === 'All' || c.rarity === (rarityFilter as Rarity)
    ),
  [rarityFilter]);

  function handleSelect(char: Character) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPreviewId(char.id);
    Animated.sequence([
      Animated.timing(previewScale, { toValue: 0.92, duration: 80,  useNativeDriver: true }),
      Animated.spring(previewScale,  { toValue: 1,    friction: 4,   useNativeDriver: true }),
    ]).start();
  }

  async function handleEquip() {
    if (!canUnlock) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const wasNew = (profile.avatarIndex ?? 1) !== previewId;
    await updateProfile({ avatarIndex: previewId });
    setJustEquipped(true);
    setTimeout(() => setJustEquipped(false), 1400);
    if (wasNew && previewChar.unlockXP === 0) {
      // show unlock modal for newly equipped chars
    }
  }

  // Progress bar for XP
  const xpPct = Math.min(1, previewChar.unlockXP > 0 ? profile.xp / previewChar.unlockXP : 1);
  const rarityColor = RARITY_COLORS[previewChar.rarity];

  return (
    <View style={{ flex: 1, backgroundColor: '#050010' }}>
      <LinearGradient colors={['#0a0025', '#050010']} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>CHARACTERS</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Preview panel */}
      <View style={styles.previewPanel}>
        <LinearGradient
          colors={[previewChar.portraitColors[0] + 'cc', '#050010']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />

        <Animated.View style={{ transform: [{ scale: previewScale }] }}>
          <CharacterPortrait
            character={previewChar}
            size={108}
            isEquipped={previewId === (profile.avatarIndex ?? 1)}
            isLocked={!canUnlock}
          />
        </Animated.View>

        <View style={styles.previewInfo}>
          <View style={[styles.rarityPill, { borderColor: rarityColor + '66', backgroundColor: rarityColor + '22' }]}>
            <Text style={[styles.rarityPillText, { color: rarityColor }]}>{previewChar.rarity}</Text>
          </View>
          <Text style={styles.previewName}>{previewChar.name}</Text>
          <Text style={styles.previewBio} numberOfLines={2}>{previewChar.bio}</Text>

          {/* XP bar */}
          {!canUnlock ? (
            <View style={styles.xpWrap}>
              <View style={styles.xpBarBg}>
                <View style={[styles.xpBarFill, { width: `${xpPct * 100}%` as any, backgroundColor: rarityColor }]} />
              </View>
              <Text style={[styles.xpLabel, { color: rarityColor }]}>
                {profile.xp.toLocaleString()} / {previewChar.unlockXP.toLocaleString()} XP
              </Text>
            </View>
          ) : (
            <Text style={[styles.unlockCondition, { color: rarityColor + 'cc' }]}>
              ✓ {previewChar.unlockCondition}
            </Text>
          )}

          <TouchableOpacity
            style={[
              styles.equipBtn,
              {
                borderColor: canUnlock ? rarityColor : '#333',
                backgroundColor: justEquipped
                  ? rarityColor + '33'
                  : canUnlock
                  ? rarityColor + '22'
                  : '#111',
                opacity: !canUnlock ? 0.5 : 1,
              },
            ]}
            onPress={handleEquip}
            disabled={!canUnlock || previewId === (profile.avatarIndex ?? 1)}
            activeOpacity={0.7}
          >
            <Text style={[styles.equipBtnText, { color: canUnlock ? rarityColor : '#444' }]}>
              {!canUnlock
                ? `LOCKED — ${(previewChar.unlockXP - profile.xp).toLocaleString()} XP NEEDED`
                : previewId === (profile.avatarIndex ?? 1)
                ? '✓ EQUIPPED'
                : justEquipped
                ? '✓ EQUIPPED!'
                : 'EQUIP CHARACTER'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Rarity filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={styles.filterScroll}
      >
        {RARITY_FILTERS.map(r => {
          const active = rarityFilter === r;
          const rc = RARITY_LABEL_COLOR[r];
          return (
            <TouchableOpacity
              key={r}
              style={[
                styles.filterChip,
                { borderColor: active ? rc : '#2a2a40', backgroundColor: active ? rc + '22' : 'transparent' },
              ]}
              onPress={() => setRarityFilter(r)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, { color: active ? rc : '#556' }]}>
                {r === 'All' ? `ALL  ${CHARACTERS.length}` : `${r}  ${CHARACTERS.filter(c => c.rarity === r).length}`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Character grid */}
      <FlatList
        data={filtered}
        keyExtractor={c => String(c.id)}
        numColumns={COL}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={{ gap: 10 }}
        renderItem={({ item }) => {
          const locked    = !isUnlocked(item, profile.xp);
          const equipped  = item.id === (profile.avatarIndex ?? 1);
          const selected  = item.id === previewId;
          const rc        = RARITY_COLORS[item.rarity];

          return (
            <TouchableOpacity
              style={[
                styles.cell,
                {
                  width: CELL_W,
                  borderColor: selected ? rc : equipped ? rc + '77' : '#1a1a2e',
                  backgroundColor: selected ? rc + '12' : '#0a0a1e',
                },
              ]}
              onPress={() => handleSelect(item)}
              activeOpacity={0.75}
            >
              <CharacterPortrait
                character={item}
                size={CELL_W - 20}
                isEquipped={equipped}
                isLocked={locked}
              />
              <Text
                style={[styles.cellName, { color: locked ? '#334' : selected ? rc : '#7080a0' }]}
                numberOfLines={2}
              >
                {item.name}
              </Text>
              {locked && (
                <Text style={styles.cellXP}>
                  {(item.unlockXP / 1000).toFixed(0)}K XP
                </Text>
              )}
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

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 38, height: 38,
    borderRadius: 19,
    backgroundColor: '#0f0f2a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1a1a40',
  },
  title: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 13,
    color: '#ffffff',
    letterSpacing: 4,
  },
  previewPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
    overflow: 'hidden',
    marginBottom: 6,
  },
  previewInfo: {
    flex: 1,
    gap: 5,
  },
  rarityPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  rarityPillText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  previewName: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 13,
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  previewBio: {
    fontFamily: 'Orbitron_400Regular',
    fontSize: 9,
    color: '#6070a0',
    lineHeight: 14,
  },
  xpWrap: { gap: 3 },
  xpBarBg: {
    height: 3,
    backgroundColor: '#1a1a3a',
    borderRadius: 2,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  xpLabel: {
    fontFamily: 'Orbitron_400Regular',
    fontSize: 8,
    letterSpacing: 0.5,
  },
  unlockCondition: {
    fontFamily: 'Orbitron_400Regular',
    fontSize: 8,
    letterSpacing: 0.5,
  },
  equipBtn: {
    marginTop: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  equipBtnText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
  },
  filterScroll: { flexGrow: 0, marginBottom: 8 },
  filterRow: { paddingHorizontal: 16, gap: 8, paddingVertical: 4 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  grid: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 10,
  },
  cell: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
    gap: 6,
  },
  cellName: {
    fontFamily: 'Orbitron_400Regular',
    fontSize: 7.5,
    textAlign: 'center',
    letterSpacing: 0.3,
    lineHeight: 11,
  },
  cellXP: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 7,
    color: '#445566',
    letterSpacing: 0.5,
  },
});
