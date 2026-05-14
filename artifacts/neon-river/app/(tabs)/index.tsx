import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '@/constants/colors';
import { useUser } from '@/context/UserContext';

const { width } = Dimensions.get('window');

const RANK_COLORS: Record<string, string> = {
  'Neon Bronze': '#cd7f32',
  'Neon Silver': '#a0a8c0',
  'Neon Gold': colors.gold,
  'Neon Platinum': '#a0f0ff',
  'Neon Diamond': '#b8f0ff',
  'Neon Elite': colors.secondary,
  'Neon Legend': colors.accent,
};

function NeonTitle() {
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.4, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });

  return (
    <Animated.View style={{ opacity, alignItems: 'center' }}>
      <Text style={styles.titleNeon} allowFontScaling={false}>NEON</Text>
      <Text style={styles.titleRiver} allowFontScaling={false}>RIVER</Text>
      <Text style={styles.titleSub} allowFontScaling={false}>TEXAS HOLD'EM POKER</Text>
    </Animated.View>
  );
}

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
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start();
  const onPressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], flex: 1 }}>
      <TouchableOpacity
        onPress={locked ? undefined : onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={0.9}
        style={[styles.modeCard, { borderColor: color, opacity: locked ? 0.5 : 1 }]}
      >
        <LinearGradient
          colors={[`${color}22`, 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={[styles.modeIcon, { backgroundColor: `${color}20`, borderColor: `${color}40` }]}>
          <Ionicons name={icon} size={26} color={color} />
        </View>
        <Text style={[styles.modeTitle, { color }]}>{title}</Text>
        <Text style={styles.modeSub}>{subtitle}</Text>
        {badge && (
          <View style={[styles.badge, { backgroundColor: color }]}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
        {locked && (
          <View style={styles.lockOverlay}>
            <Ionicons name="lock-closed" size={16} color={colors.textMuted} />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function LobbyScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useUser();
  const rankColor = RANK_COLORS[profile.rank] ?? colors.primary;

  const formatChips = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toLocaleString();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background, '#0a0025', colors.background]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 16), paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <NeonTitle />

        <View style={styles.playerCard}>
          <LinearGradient
            colors={[colors.surface, colors.surfaceElevated]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.playerInfo}>
            <View style={[styles.playerAvatar, { borderColor: rankColor }]}>
              <Text style={styles.playerAvatarText}>♠</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.playerName}>{profile.username}</Text>
              <Text style={[styles.playerRank, { color: rankColor }]}>{profile.rank}</Text>
            </View>
            <View style={styles.chipBadge}>
              <MaterialCommunityIcons name="poker-chip" size={18} color={colors.gold} />
              <Text style={styles.chipCount}>{formatChips(profile.chips)}</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>Lv.{profile.level}</Text>
              <Text style={styles.statLabel}>LEVEL</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile.wins}</Text>
              <Text style={styles.statLabel}>WINS</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile.handsPlayed}</Text>
              <Text style={styles.statLabel}>HANDS</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>GAME MODES</Text>

        <TouchableOpacity
          style={styles.quickPlayBtn}
          onPress={() => router.push('/game/practice')}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[colors.primary, '#0088bb']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
          <Ionicons name="flash" size={24} color={colors.background} style={{ marginRight: 10 }} />
          <View>
            <Text style={styles.quickPlayTitle}>AI PRACTICE</Text>
            <Text style={styles.quickPlaySub}>Play vs intelligent bots</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={colors.background} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>

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

        <View style={styles.chatRow}>
          <Text style={styles.sectionTitle}>QUICK CHAT</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chatScroll}>
          {['Good hand.', 'All in!', 'Nice bluff.', 'No way!', 'Good game.', 'Lucky!'].map(msg => (
            <TouchableOpacity key={msg} style={styles.chatChip}>
              <Text style={styles.chatChipText}>{msg}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingHorizontal: 16,
    gap: 16,
  },
  titleNeon: {
    fontFamily: 'Orbitron_900Black',
    fontSize: 52,
    color: colors.primary,
    letterSpacing: 8,
    textShadowColor: colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    lineHeight: 56,
  },
  titleRiver: {
    fontFamily: 'Orbitron_900Black',
    fontSize: 52,
    color: colors.secondary,
    letterSpacing: 8,
    textShadowColor: colors.secondary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    lineHeight: 56,
  },
  titleSub: {
    fontFamily: 'Orbitron_400Regular',
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 4,
    marginTop: 4,
    marginBottom: 8,
  },
  playerCard: {
    borderRadius: colors.radiusLg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    padding: 16,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  playerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerAvatarText: {
    fontSize: 22,
    color: colors.primary,
  },
  playerName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Orbitron_700Bold',
  },
  playerRank: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: 2,
  },
  chipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  chipCount: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Orbitron_700Bold',
  },
  statLabel: {
    color: colors.textDim,
    fontSize: 9,
    letterSpacing: 1,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: 'Orbitron_400Regular',
  },
  quickPlayBtn: {
    borderRadius: colors.radius,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  quickPlayTitle: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'Orbitron_700Bold',
    letterSpacing: 1,
  },
  quickPlaySub: {
    color: 'rgba(5,0,16,0.6)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  modesGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  modeCard: {
    borderRadius: colors.radius,
    borderWidth: 1,
    padding: 14,
    minHeight: 110,
    overflow: 'hidden',
    position: 'relative',
  },
  modeIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  modeTitle: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Orbitron_700Bold',
    letterSpacing: 0.5,
  },
  modeSub: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 3,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    color: colors.background,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  lockOverlay: {
    position: 'absolute',
    bottom: 10,
    right: 10,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatScroll: {
    marginBottom: 4,
  },
  chatChip: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
    backgroundColor: colors.surface,
  },
  chatChipText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
});
