import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useRef } from 'react';
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/colors';
import { useUser } from '@/context/UserContext';
import { useColors } from '@/hooks/useColors';

const TABLE_STAKES = [
  { id: 'beginner',    name: 'BEGINNER',     blinds: '25 / 50',        minChips: 0,         minChipsLabel: 'Free',  color: '#00d4aa' },
  { id: 'casual',      name: 'CASUAL',       blinds: '100 / 200',      minChips: 5_000,     minChipsLabel: '5K',    color: '#00d4ff' },
  { id: 'mid',         name: 'MID STAKES',   blinds: '500 / 1,000',    minChips: 25_000,    minChipsLabel: '25K',   color: '#ffd700' },
  { id: 'highroller',  name: 'HIGH ROLLER',  blinds: '5,000 / 10,000', minChips: 250_000,   minChipsLabel: '250K',  color: '#ff8800' },
  { id: 'elite',       name: 'ELITE NEON',   blinds: '50K / 100K',     minChips: 2_500_000, minChipsLabel: '2.5M',  color: '#ff0090' },
];

const RANK_COLORS: Record<string, string> = {
  'Neon Bronze': '#cd7f32',
  'Neon Silver': '#a0a8c0',
  'Neon Gold': colors.gold,
  'Neon Platinum': '#a0f0ff',
  'Neon Diamond': '#b8f0ff',
  'Neon Elite': colors.secondary,
  'Neon Legend': colors.accent,
};

interface GameModeCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  color: string;
  onPress: () => void;
  badge?: string;
  locked?: boolean;
}

function GameModeCard({ icon, title, subtitle, color, onPress, badge, locked }: GameModeCardProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Animated.View style={[styles.modeCard, { transform: [{ scale }], borderColor: locked ? colors.border : `${color}55`, flex: 1 }]}>
      <TouchableOpacity onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} activeOpacity={1} style={{ flex: 1 }}>
        <LinearGradient
          colors={[`${color}18`, 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={[styles.modeIcon, { backgroundColor: `${color}20`, borderColor: `${color}40` }]}>
          <Ionicons name={icon} size={26} color={locked ? colors.textDim : color} />
        </View>
        <Text style={[styles.modeTitle, { color: locked ? colors.textDim : color }]}>{title}</Text>
        <Text style={styles.modeSub}>{subtitle}</Text>
        {badge && (
          <View style={[styles.badge, { backgroundColor: locked ? colors.border : color }]}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
        {locked && (
          <View style={styles.lockOverlay}>
            <Ionicons name="lock-closed" size={16} color={colors.textDim} />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function PlayScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { profile } = useUser();
  const rankColor = RANK_COLORS[profile.rank] ?? colors.primary;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.background, colors.surfaceElevated, colors.background]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 16), paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>SELECT MODE</Text>
        <Text style={styles.pageSub}>Choose how you want to play</Text>

        {/* AI Practice — primary CTA */}
        <TouchableOpacity
          style={styles.quickPlayBtn}
          onPress={() => router.push('/game/practice')}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[colors.primary, '#0055cc']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
          <Ionicons name="flash" size={28} color={colors.background} style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.quickPlayTitle}>AI PRACTICE</Text>
            <Text style={styles.quickPlaySub}>5 difficulty levels · Fully offline</Text>
          </View>
          <View style={styles.readyBadge}>
            <Text style={styles.readyText}>READY</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={colors.background} style={{ marginLeft: 8 }} />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>MORE MODES</Text>

        <View style={styles.modesGrid}>
          <GameModeCard
            icon="trophy"
            title="Ranked"
            subtitle="Climb the leaderboard"
            color={colors.gold}
            onPress={() => {}}
            badge="SOON"
            locked
          />
          <GameModeCard
            icon="people"
            title="Friends"
            subtitle="Private table"
            color={colors.secondary}
            onPress={() => {}}
            badge="SOON"
            locked
          />
        </View>

        <View style={styles.modesGrid}>
          <GameModeCard
            icon="flash"
            title="Quick Match"
            subtitle="Jump into a game"
            color={colors.accent}
            onPress={() => {}}
            badge="SOON"
            locked
          />
          <GameModeCard
            icon="ribbon"
            title="Tournament"
            subtitle="Neon championship"
            color={colors.success}
            onPress={() => {}}
            badge="SOON"
            locked
          />
        </View>

        {/* Table stakes */}
        <Text style={styles.sectionTitle}>TABLE STAKES</Text>
        <View style={styles.stakesGrid}>
          {TABLE_STAKES.map(t => {
            const canAfford = profile.chips >= t.minChips;
            return (
              <TouchableOpacity
                key={t.id}
                style={[styles.stakeRow, { borderColor: canAfford ? `${t.color}50` : colors.border, opacity: canAfford ? 1 : 0.5 }]}
                onPress={() => canAfford && router.push('/game/practice')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={canAfford ? [`${t.color}14`, 'transparent'] : ['transparent', 'transparent']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                />
                <View style={[styles.stakeDot, { backgroundColor: t.color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.stakeName, { color: canAfford ? t.color : colors.textDim }]}>{t.name}</Text>
                  <Text style={styles.stakeBlinds}>{t.blinds} blinds</Text>
                </View>
                <View style={styles.stakeRight}>
                  <Text style={styles.stakeMin}>min {t.minChipsLabel}</Text>
                  {!canAfford && <Ionicons name="lock-closed" size={12} color={colors.textDim} />}
                  {canAfford && <Ionicons name="chevron-forward" size={14} color={t.color} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Skill level info */}
        <View style={styles.infoCard}>
          <LinearGradient
            colors={['rgba(0,212,255,0.05)', 'transparent']}
            style={StyleSheet.absoluteFill}
          />
          <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
          <Text style={styles.infoText}>
            AI Practice is the perfect way to sharpen your game. Choose difficulty, play hands, and earn XP.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: 16, gap: 14 },
  pageTitle: {
    color: colors.text, fontSize: 22, fontWeight: '800',
    fontFamily: 'Orbitron_900Black', letterSpacing: 3,
  },
  pageSub: { color: colors.textMuted, fontSize: 13, marginTop: -8 },
  quickPlayBtn: {
    borderRadius: colors.radiusLg, overflow: 'hidden',
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 20, paddingHorizontal: 20,
  },
  quickPlayTitle: {
    color: colors.background, fontSize: 18, fontWeight: '800',
    fontFamily: 'Orbitron_700Bold', letterSpacing: 1,
  },
  quickPlaySub: { color: 'rgba(5,0,16,0.6)', fontSize: 11, marginTop: 2 },
  readyBadge: {
    backgroundColor: 'rgba(5,0,16,0.2)', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  readyText: { color: colors.background, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  sectionTitle: {
    color: colors.textMuted, fontSize: 10, fontWeight: '700',
    letterSpacing: 2, fontFamily: 'Orbitron_400Regular',
  },
  modesGrid: { flexDirection: 'row', gap: 12 },
  modeCard: {
    borderRadius: colors.radius, borderWidth: 1,
    padding: 14, minHeight: 120, overflow: 'hidden', position: 'relative',
  },
  modeIcon: {
    width: 44, height: 44, borderRadius: 12, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  modeTitle: { fontSize: 13, fontWeight: '700', fontFamily: 'Orbitron_700Bold', marginBottom: 2 },
  modeSub: { color: colors.textMuted, fontSize: 10 },
  badge: {
    position: 'absolute', top: 8, right: 8,
    borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2,
  },
  badgeText: { color: colors.background, fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  lockOverlay: { position: 'absolute', bottom: 8, right: 8 },
  infoCard: {
    borderRadius: colors.radius, borderWidth: 1, borderColor: colors.primaryDim,
    padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10, overflow: 'hidden',
  },
  infoText: { color: colors.textMuted, fontSize: 12, lineHeight: 18, flex: 1 },
  stakesGrid: { gap: 8 },
  stakeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 12,
    overflow: 'hidden', position: 'relative',
  },
  stakeDot: { width: 8, height: 8, borderRadius: 4 },
  stakeName: { fontSize: 12, fontWeight: '800', fontFamily: 'Orbitron_700Bold', letterSpacing: 0.5 },
  stakeBlinds: { color: colors.textMuted, fontSize: 11, marginTop: 1 },
  stakeRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stakeMin: { color: colors.textDim, fontSize: 10 },
});
