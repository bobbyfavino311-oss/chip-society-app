import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useRef, useMemo } from 'react';
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
import { GuestBanner, GuestLockOverlay } from '@/components/GuestBanner';

// ─── Table stakes ─────────────────────────────────────────────────────────────
const TABLE_STAKES = [
  { id: 'beginner',   name: 'BEGINNER',    blinds: '25 / 50',        minChips: 0,           minChipsLabel: 'Free',  color: '#00d4aa' },
  { id: 'casual',     name: 'CASUAL',      blinds: '50 / 100',       minChips: 5_000,       minChipsLabel: '5K',    color: '#00d4ff' },
  { id: 'mid',        name: 'MID STAKES',  blinds: '250 / 500',      minChips: 25_000,      minChipsLabel: '25K',   color: '#ffd700' },
  { id: 'highroller', name: 'HIGH ROLLER', blinds: '2,500 / 5,000',  minChips: 250_000,     minChipsLabel: '250K',  color: '#ff8800' },
  { id: 'elite',      name: 'ELITE NEON',  blinds: '25K / 50K',      minChips: 2_500_000,   minChipsLabel: '2.5M',  color: '#ff0090' },
];

// ─── Live mode card ────────────────────────────────────────────────────────────
interface LiveModeCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  color: string;
  stat: string;
  statIcon?: keyof typeof Ionicons.glyphMap;
  badge?: string;
  onPress: () => void;
}

function LiveModeCard({ icon, title, description, color, stat, statIcon, badge, onPress }: LiveModeCardProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn  = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}
        activeOpacity={1}
        style={[styles.modeCard, { borderColor: `${color}44` }]}
      >
        <LinearGradient
          colors={[`${color}16`, 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        />
        {/* Left color accent bar */}
        <View style={[styles.accentBar, { backgroundColor: color }]} />

        {/* Icon */}
        <View style={[styles.modeIconWrap, { backgroundColor: `${color}20`, borderColor: `${color}40` }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>

        {/* Content */}
        <View style={styles.modeContent}>
          <View style={styles.modeTitleRow}>
            <Text style={[styles.modeTitle, { color }]}>{title}</Text>
            {badge && (
              <View style={[styles.modeBadge, { backgroundColor: `${color}22`, borderColor: `${color}55` }]}>
                <Text style={[styles.modeBadgeText, { color }]}>{badge}</Text>
              </View>
            )}
          </View>
          <Text style={styles.modeDesc}>{description}</Text>
          <View style={styles.modeStatRow}>
            {statIcon && <Ionicons name={statIcon} size={10} color={color} />}
            <View style={[styles.statDot, { backgroundColor: color }]} />
            <Text style={[styles.modeStat, { color: `${color}cc` }]}>{stat}</Text>
          </View>
        </View>

        {/* Arrow */}
        <Ionicons name="chevron-forward" size={18} color={`${color}88`} />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────────
export default function PlayScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useUser();
  const [guestLockFeature, setGuestLockFeature] = React.useState<string | null>(null);

  const onlinePlayers = useMemo(() => {
    const m = Math.floor(Date.now() / 60_000);
    return 2400 + ((m * 17 + 347) % 800);
  }, []);

  const activeTables = useMemo(() => Math.floor(onlinePlayers / 7), [onlinePlayers]);

  const rankLabel = profile.rank;
  const rp = profile.rankedPoints;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background, '#0a001e', colors.background]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />

      {/* Guest banner */}
      {profile.isGuest && (
        <GuestBanner message="Guest mode — create a free account to unlock Ranked, Tournaments & cloud saves" />
      )}

      {/* Guest lock overlay */}
      {guestLockFeature && (
        <GuestLockOverlay feature={guestLockFeature} />
      )}

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 16), paddingBottom: insets.bottom + 90 },
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
            colors={['#00d4ff', '#0044cc']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          />
          <Ionicons name="flash" size={26} color="#050010" style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.quickPlayTitle}>AI PRACTICE</Text>
            <Text style={styles.quickPlaySub}>5 difficulty levels · Fully offline · No chips required</Text>
          </View>
          <View style={styles.readyBadge}>
            <Text style={styles.readyText}>READY</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#050010" style={{ marginLeft: 8 }} />
        </TouchableOpacity>

        {/* Live modes */}
        <Text style={styles.sectionTitle}>LIVE MODES</Text>

        <LiveModeCard
          icon="flash"
          title="QUICK MATCH"
          description="Instantly join an active table — real players or AI bots fill seats"
          color="#00d4ff"
          stat={`${onlinePlayers.toLocaleString()} online · ${activeTables} active tables`}
          onPress={() => profile.isGuest ? setGuestLockFeature('Quick Match') : router.push('/modes/quickmatch')}
        />

        <LiveModeCard
          icon="trophy"
          title="RANKED"
          description="Compete for Ranked Points and climb the leaderboard"
          color="#ffd700"
          stat={`${rankLabel} · ${rp.toLocaleString()} RP`}
          badge="COMPETITIVE"
          onPress={() => profile.isGuest ? setGuestLockFeature('Ranked Mode') : router.push('/modes/ranked')}
        />

        <LiveModeCard
          icon="ribbon"
          title="TOURNAMENTS"
          description="Sit & Go events and scheduled tournaments with prize pools"
          color="#bf5fff"
          stat="Sit & Go · Scheduled events · Big prize pools"
          badge="SIT & GO"
          onPress={() => profile.isGuest ? setGuestLockFeature('Tournaments') : router.push('/modes/tournament')}
        />

        <LiveModeCard
          icon="lock-open"
          title="PRIVATE TABLE"
          description="Create a room with an invite code, or join a friend's table"
          color="#ff0090"
          stat="Generate a code like NEON-742 · Invite friends"
          onPress={() => profile.isGuest ? setGuestLockFeature('Private Tables') : router.push('/modes/private')}
        />

        {/* Table stakes */}
        <Text style={styles.sectionTitle}>TABLE STAKES</Text>
        <View style={styles.stakesGrid}>
          {TABLE_STAKES.map(t => {
            const canAfford = profile.chips >= t.minChips;
            return (
              <TouchableOpacity
                key={t.id}
                style={[styles.stakeRow, { borderColor: canAfford ? `${t.color}50` : colors.border, opacity: canAfford ? 1 : 0.5 }]}
                onPress={() => canAfford && router.push(`/game/practice?tier=${t.id}` as any)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={canAfford ? [`${t.color}12`, 'transparent'] : ['transparent', 'transparent']}
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
                  {!canAfford
                    ? <Ionicons name="lock-closed" size={12} color={colors.textDim} />
                    : <Ionicons name="chevron-forward" size={14} color={t.color} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <LinearGradient colors={['rgba(0,212,255,0.05)', 'transparent']} style={StyleSheet.absoluteFill} />
          <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
          <Text style={styles.infoText}>
            AI Practice is always available offline. Live modes connect you to tables with real players and intelligent AI bots.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: 16, gap: 12 },
  pageTitle: { color: colors.text, fontSize: 22, fontWeight: '800', fontFamily: 'Orbitron_900Black', letterSpacing: 3 },
  pageSub: { color: colors.textMuted, fontSize: 13, marginTop: -6 },
  quickPlayBtn: {
    borderRadius: 16, overflow: 'hidden',
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 18, paddingHorizontal: 18,
  },
  quickPlayTitle: { color: '#050010', fontSize: 17, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 1 },
  quickPlaySub: { color: 'rgba(5,0,16,0.55)', fontSize: 10, marginTop: 2 },
  readyBadge: { backgroundColor: 'rgba(5,0,16,0.18)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  readyText: { color: '#050010', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  sectionTitle: { color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 2, fontFamily: 'Orbitron_400Regular', marginBottom: -4 },
  // Live mode cards
  modeCard: {
    borderRadius: 14, borderWidth: 1,
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingRight: 14,
    overflow: 'hidden', gap: 12,
  },
  accentBar: { width: 3, height: '100%', borderRadius: 2, marginLeft: 0, alignSelf: 'stretch' },
  modeIconWrap: { width: 46, height: 46, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  modeContent: { flex: 1, gap: 3 },
  modeTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modeTitle: { fontSize: 13, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 0.5 },
  modeBadge: { borderRadius: 4, borderWidth: 1, paddingHorizontal: 5, paddingVertical: 1 },
  modeBadgeText: { fontSize: 7, fontWeight: '900', letterSpacing: 1 },
  modeDesc: { color: colors.textMuted, fontSize: 10, lineHeight: 14 },
  modeStatRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  statDot: { width: 5, height: 5, borderRadius: 2.5 },
  modeStat: { fontSize: 10 },
  // Table stakes
  stakesGrid: { gap: 8 },
  stakeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11, overflow: 'hidden', position: 'relative' },
  stakeDot: { width: 8, height: 8, borderRadius: 4 },
  stakeName: { fontSize: 12, fontWeight: '800', fontFamily: 'Orbitron_700Bold', letterSpacing: 0.5 },
  stakeBlinds: { color: colors.textMuted, fontSize: 10, marginTop: 1 },
  stakeRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stakeMin: { color: colors.textDim, fontSize: 10 },
  // Info card
  infoCard: { borderRadius: 12, borderWidth: 1, borderColor: colors.primaryDim, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10, overflow: 'hidden' },
  infoText: { color: colors.textMuted, fontSize: 11, lineHeight: 17, flex: 1 },
});
