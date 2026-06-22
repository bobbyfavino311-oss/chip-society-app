import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useRef } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Ellipse, Line, Path, Polygon, Rect } from 'react-native-svg';

import { useTableTheme } from '@/context/TableThemeContext';
import { ALL_TABLE_THEMES, TableTheme, ThemeId } from '@/constants/tableThemes';

// ─── Dragon scale mini-preview ─────────────────────────────────────────────────
function DragonScalePreview({ size = 40 }: { size?: number }) {
  const s = size;
  const gold = '#C89B3C';
  const dark = '#0A0000';
  return (
    <Svg width={s} height={s} viewBox="0 0 40 40">
      <Polygon points="20,2 38,20 20,38 2,20" fill={dark} stroke={gold} strokeWidth={1.2} />
      <Polygon points="20,8 32,20 20,32 8,20" fill="none" stroke={gold} strokeWidth={0.7} strokeOpacity={0.5} />
      <Circle cx={20} cy={20} r={4} fill={gold} opacity={0.85} />
      <Line x1={20} y1={2} x2={20} y2={38} stroke={gold} strokeWidth={0.4} strokeOpacity={0.3} />
      <Line x1={2} y1={20} x2={38} y2={20} stroke={gold} strokeWidth={0.4} strokeOpacity={0.3} />
    </Svg>
  );
}

// ─── Neon mandala mini-preview ─────────────────────────────────────────────────
function NeonMandalaPreview({ size = 40 }: { size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={cx} cy={cy} r={r} stroke="#00d4ff" strokeWidth={1.2} fill="none" />
      <Circle cx={cx} cy={cy} r={r * 0.6} stroke="#ff0090" strokeWidth={0.9} fill="none" />
      <Circle cx={cx} cy={cy} r={r * 0.25} fill="#bf5fff" opacity={0.7} />
      {[0, 45, 90, 135].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <Line key={i}
            x1={cx + Math.cos(rad) * r * 0.2} y1={cy + Math.sin(rad) * r * 0.2}
            x2={cx + Math.cos(rad) * r * 0.85} y2={cy + Math.sin(rad) * r * 0.85}
            stroke="#00d4ff" strokeWidth={0.7} strokeOpacity={0.6} />
        );
      })}
    </Svg>
  );
}

// ─── Masquerade mask mini-preview ──────────────────────────────────────────────
function MasqueradePreview({ size = 40 }: { size?: number }) {
  const s = size;
  const cx = s / 2;
  const cy = s / 2 + 2;
  const gold = '#D4AF37';
  return (
    <Svg width={s} height={s} viewBox="0 0 40 40">
      {/* Mask outline */}
      <Path
        d="M 5 22 C 5 13, 10 8, 16 8 L 24 8 C 30 8, 35 13, 35 22 C 35 27, 32 29, 29 28 C 27 30, 23 32, 20 32 C 17 32, 13 30, 11 28 C 8 29, 5 27, 5 22 Z"
        fill="#1A0040" fillOpacity={0.8}
        stroke={gold} strokeWidth={1.2} strokeOpacity={0.85}
      />
      {/* Left eye */}
      <Ellipse cx={14} cy={19} rx={4.5} ry={3}
        fill="#090018" stroke={gold} strokeWidth={0.8} strokeOpacity={0.65} />
      {/* Right eye */}
      <Ellipse cx={26} cy={19} rx={4.5} ry={3}
        fill="#090018" stroke={gold} strokeWidth={0.8} strokeOpacity={0.65} />
      {/* Crest top */}
      <Circle cx={20} cy={6} r={1.5}
        fill="none" stroke={gold} strokeWidth={0.8} strokeOpacity={0.60} />
      <Line x1={20} y1={8} x2={20} y2={6}
        stroke={gold} strokeWidth={0.8} strokeOpacity={0.55} />
    </Svg>
  );
}

// ─── Sakura Garden mini-preview ────────────────────────────────────────────────
function SakuraGardenPreview({ size = 40 }: { size?: number }) {
  const pink = '#F4A8C0';
  const rose = '#E8627A';
  const plum = '#C4407C';
  const s = size;
  return (
    <Svg width={s} height={s} viewBox="0 0 40 40">
      {/* Branch */}
      <Path
        d="M 2 2 Q 14 14, 20 20 Q 26 26, 38 38"
        fill="none" stroke={plum} strokeWidth={1.5} strokeOpacity={0.55}
        strokeLinecap="round"
      />
      {/* Blossom clusters on branch */}
      {([[10, 10], [20, 20], [30, 30]] as [number,number][]).map(([cx, cy], i) => (
        <React.Fragment key={i}>
          <Circle cx={cx}     cy={cy}     r={3.0} fill={pink} fillOpacity={0.70} />
          <Circle cx={cx - 3} cy={cy}     r={2.2} fill={pink} fillOpacity={0.50} />
          <Circle cx={cx + 3} cy={cy}     r={2.2} fill={pink} fillOpacity={0.50} />
          <Circle cx={cx}     cy={cy - 3} r={2.2} fill={pink} fillOpacity={0.50} />
          <Circle cx={cx}     cy={cy + 3} r={2.2} fill={pink} fillOpacity={0.50} />
          <Circle cx={cx}     cy={cy}     r={0.8} fill={rose} fillOpacity={0.80} />
        </React.Fragment>
      ))}
      {/* Scattered petals */}
      <Ellipse cx={32} cy={8}  rx={3.5} ry={2} fill={pink} fillOpacity={0.35}
        transform="rotate(40, 32, 8)" />
      <Ellipse cx={8}  cy={30} rx={3}   ry={2} fill={pink} fillOpacity={0.30}
        transform="rotate(-30, 8, 30)" />
    </Svg>
  );
}

// ─── Theme card ───────────────────────────────────────────────────────────────
function ThemeCard({
  theme,
  isActive,
  onEquip,
}: {
  theme: TableTheme;
  isActive: boolean;
  onEquip: () => void;
}) {
  const pressAnim = useRef(new Animated.Value(1)).current;
  const isDragon      = theme.id === 'dragon_fortune';
  const isMasquerade  = theme.id === 'royal_masquerade';
  const isSakura      = theme.id === 'sakura_garden';

  // Derive accent colors from the theme itself
  const primary   = theme.accentPrimary;
  const secondary = theme.accentSecondary;

  function press() {
    Animated.sequence([
      Animated.timing(pressAnim, { toValue: 0.96, duration: 70, useNativeDriver: true }),
      Animated.spring(pressAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();
    onEquip();
  }

  const borderColor = isActive
    ? primary
    : `${primary}40`;

  const bgColors: [string, string, string] = isDragon
    ? ['#120000', '#0A0000', '#060000']
    : isMasquerade
    ? ['#140026', '#0C0018', '#080010']
    : isSakura
    ? ['#200814', '#160510', '#0E030C']
    : ['#0e0028', '#08001a', '#050010'];

  function Preview() {
    if (isDragon)     return <DragonScalePreview  size={42} />;
    if (isMasquerade) return <MasqueradePreview   size={42} />;
    if (isSakura)     return <SakuraGardenPreview  size={42} />;
    return <NeonMandalaPreview size={42} />;
  }

  return (
    <Animated.View style={{ transform: [{ scale: pressAnim }] }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={press}
        style={[
          s.card,
          { borderColor },
          isActive && {
            shadowColor: primary,
            shadowOpacity: 0.45,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 0 },
          },
        ]}
      >
        <LinearGradient colors={bgColors} style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />

        <View style={[s.cardAccentLine, { backgroundColor: borderColor, opacity: isActive ? 0.8 : 0.3 }]} />

        <View style={s.cardBody}>
          {/* Left — icon + palette */}
          <View style={s.cardLeft}>
            <View style={[s.iconRing, { borderColor: `${primary}55` }]}>
              <View style={[s.iconBg, { backgroundColor: theme.previewColors[0] }]}>
                <Preview />
              </View>
            </View>
            <View style={s.paletteRow}>
              {theme.previewColors.map((c, i) => (
                <View key={i} style={[s.paletteDot, { backgroundColor: c, borderColor: 'rgba(255,255,255,0.15)' }]} />
              ))}
            </View>
          </View>

          {/* Right — info */}
          <View style={s.cardRight}>
            <View style={s.nameRow}>
              <Text style={[s.themeName, { color: theme.textColor }]}>
                {theme.name}
              </Text>
              <View style={[s.rarityBadge, {
                borderColor: `${primary}66`,
                backgroundColor: `${primary}18`,
              }]}>
                <Text style={[s.rarityText, { color: primary }]}>
                  {theme.rarity}
                </Text>
              </View>
            </View>

            <Text style={s.themeTagline} numberOfLines={3}>
              {theme.tagline}
            </Text>

            {isActive ? (
              <View style={[s.equippedTag, { borderColor: primary }]}>
                <Ionicons name="checkmark-circle" size={12} color={primary} />
                <Text style={[s.equippedText, { color: primary }]}>EQUIPPED</Text>
              </View>
            ) : (
              <TouchableOpacity onPress={press} style={[s.equipBtn, { borderColor: `${primary}99` }]}>
                <LinearGradient
                  colors={[`${primary}30`, `${primary}10`]}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={[s.equipBtnText, { color: primary }]}>EQUIP</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {isActive && (
          <LinearGradient
            colors={['transparent', `${primary}0D`, 'transparent']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function TableThemesScreen() {
  const insets = useSafeAreaInsets();
  const { theme: activeTheme, setTheme } = useTableTheme();

  return (
    <View style={s.screen}>
      <LinearGradient
        colors={['#0a0018', '#050010', '#030008']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
          <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>TABLE THEMES</Text>
        <View style={{ width: 40 }} />
      </View>

      <Text style={s.headerSub}>Select a table theme. Applies to all game modes.</Text>

      <ScrollView
        contentContainerStyle={[s.list, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Active theme preview band */}
        <View style={[s.activePreview, { borderColor: `${activeTheme.accentPrimary}44` }]}>
          <LinearGradient
            colors={[`${activeTheme.accentPrimary}18`, 'transparent']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          />
          <Text style={s.activeLabel}>ACTIVE THEME</Text>
          <Text style={[s.activeName, { color: activeTheme.accentPrimary }]}>
            {activeTheme.name}
          </Text>
        </View>

        {/* Theme cards */}
        {ALL_TABLE_THEMES.map((t) => (
          <ThemeCard
            key={t.id}
            theme={t}
            isActive={t.id === activeTheme.id}
            onEquip={() => setTheme(t.id as ThemeId)}
          />
        ))}

        {/* Coming soon hint */}
        <View style={s.comingSoon}>
          <Text style={s.comingSoonLabel}>MORE THEMES COMING SOON</Text>
          <Text style={s.comingSoonSub}>Samurai Edge · Ice Palace · Golden Age</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#050010' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: {
    color: '#e8e8ff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 3,
    fontFamily: 'Orbitron_700Bold',
  },
  headerSub: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 20,
    marginTop: 2,
  },
  list: { paddingHorizontal: 16, gap: 16 },

  activePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    overflow: 'hidden',
    marginBottom: 4,
  },
  activeLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 9,
    letterSpacing: 2,
    fontFamily: 'Orbitron_400Regular',
  },
  activeName: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
    fontFamily: 'Orbitron_700Bold',
  },

  card: {
    borderRadius: 18,
    borderWidth: 1.5,
    overflow: 'hidden',
    elevation: 8,
  },
  cardAccentLine: { height: 2, width: '100%' },
  cardBody: { flexDirection: 'row', gap: 14, padding: 16 },
  cardLeft: { alignItems: 'center', gap: 10 },
  iconRing: {
    width: 60, height: 60,
    borderRadius: 12, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  iconBg: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  paletteRow: { flexDirection: 'row', gap: 5 },
  paletteDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1 },
  cardRight: { flex: 1, gap: 7 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  themeName: { fontSize: 14, fontWeight: '800', letterSpacing: 1.5, fontFamily: 'Orbitron_700Bold' },
  rarityBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 2 },
  rarityText: { fontSize: 8, fontWeight: '800', letterSpacing: 1.5, fontFamily: 'Orbitron_400Regular' },
  themeTagline: { color: 'rgba(255,255,255,0.45)', fontSize: 11, lineHeight: 16, letterSpacing: 0.2 },
  equippedTag: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start', borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  equippedText: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, fontFamily: 'Orbitron_700Bold' },
  equipBtn: {
    alignSelf: 'flex-start', borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 16, paddingVertical: 6, overflow: 'hidden',
  },
  equipBtnText: { fontSize: 10, fontWeight: '800', letterSpacing: 2, fontFamily: 'Orbitron_700Bold' },

  comingSoon: { alignItems: 'center', paddingVertical: 24, gap: 6 },
  comingSoonLabel: { color: 'rgba(255,255,255,0.2)', fontSize: 9, letterSpacing: 2.5, fontFamily: 'Orbitron_400Regular' },
  comingSoonSub: { color: 'rgba(255,255,255,0.14)', fontSize: 10, letterSpacing: 0.5 },
});
