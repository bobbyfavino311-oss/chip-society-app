import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import {
  Alert,
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
import { useColors } from '@/hooks/useColors';
import { useUser } from '@/context/UserContext';
import {
  TOURNAMENT_CONFIGS,
  TournamentConfig,
  TournamentType,
  getPrizePool,
} from '@/constants/tournaments';
import { BLIND_LEVELS } from '@/hooks/useTournamentGame';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatChips(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`;
  return `${n}`;
}

// ─── Tournament type card ────────────────────────────────────────────────────

function TournamentTypeCard({ config, userChips }: { config: TournamentConfig; userChips: number }) {
  const prizePool = getPrizePool(config);
  const canAfford = userChips >= config.buyIn;
  const isHighRoller = config.type === 'highroller';


  return (
    <View style={[card.wrap, isHighRoller && card.wrapGold]}>
      <LinearGradient
        colors={[`${config.color}18`, `${config.color}06`, 'transparent']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={[card.accent, { backgroundColor: config.color }]} />

      {/* Header row */}
      <View style={card.headerRow}>
        <View style={[card.iconWrap, { borderColor: `${config.color}50`, backgroundColor: `${config.color}15` }]}>
          <Ionicons name={config.icon as any} size={20} color={config.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[card.name, { color: config.color }]}>{config.name}</Text>
          <Text style={card.subtitle}>{config.subtitle}</Text>
        </View>
        {isHighRoller && (
          <View style={card.vipBadge}>
            <Text style={card.vipText}>VIP</Text>
          </View>
        )}
      </View>

      {/* Stats row */}
      <View style={card.statsRow}>
        <View style={card.statItem}>
          <Text style={card.statLabel}>BUY-IN</Text>
          <Text style={[card.statValue, { color: canAfford ? colors.text : colors.error }]}>
            {formatChips(config.buyIn)}
          </Text>
        </View>
        <View style={card.statDivider} />
        <View style={card.statItem}>
          <Text style={card.statLabel}>PRIZE POOL</Text>
          <Text style={[card.statValue, { color: config.color }]}>{formatChips(prizePool)}</Text>
        </View>
        <View style={card.statDivider} />
        <View style={card.statItem}>
          <Text style={card.statLabel}>PLAYERS</Text>
          <Text style={card.statValue}>{config.numPlayers}</Text>
        </View>
        <View style={card.statDivider} />
        <View style={card.statItem}>
          <Text style={card.statLabel}>STACKS</Text>
          <Text style={card.statValue}>{formatChips(config.startingChips)}</Text>
        </View>
      </View>

      {/* Prize label */}
      <Text style={card.prizeLabel}>{config.prizeLabel}</Text>

      {/* Coming soon — locked */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, paddingVertical: 12, borderRadius: 10, borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.02)',
      }}>
        <Ionicons name="lock-closed-outline" size={13} color="rgba(255,255,255,0.25)" />
        <Text style={{
          color: 'rgba(255,255,255,0.25)', fontSize: 10, fontWeight: '800',
          fontFamily: 'Orbitron_700Bold', letterSpacing: 1.5,
        }}>COMING SOON</Text>
      </View>
    </View>
  );
}

// ─── Blind schedule preview ───────────────────────────────────────────────────

function BlindSchedule({ handsPerLevel }: { handsPerLevel: number }) {
  const levels = BLIND_LEVELS.slice(0, 4);
  return (
    <View style={blind.wrap}>
      <Text style={blind.title}>BLIND STRUCTURE (first 4 levels)</Text>
      <View style={blind.grid}>
        {levels.map((lvl, i) => (
          <View key={i} style={blind.row}>
            <Text style={blind.level}>LVL {i + 1}</Text>
            <Text style={blind.blinds}>{lvl.sb} / {lvl.bb}</Text>
            <Text style={blind.hands}>{handsPerLevel} hands</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

const TYPE_ORDER: TournamentType[] = ['beginner', 'sitandgo', 'turbo', 'highroller'];

export default function TournamentsScreen() {
  const insets = useSafeAreaInsets();
  const dynColors = useColors();
  const { profile } = useUser();

  return (
    <View style={[styles.container, { backgroundColor: dynColors.background }]}>
      <LinearGradient
        colors={[dynColors.background, dynColors.surfaceElevated]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 16), paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.pageTitle}>TOURNAMENTS</Text>
            <Text style={styles.pageSub}>Single-table · AI-filled · Virtual chips only</Text>
          </View>
          <View style={styles.balanceBadge}>
            <Ionicons name="wallet-outline" size={12} color={colors.gold} />
            <Text style={styles.balanceText}>{formatChips(profile.chips)}</Text>
          </View>
        </View>

        {/* Coming soon notice */}
        <View style={styles.betaNotice}>
          <Ionicons name="lock-closed-outline" size={14} color="rgba(255,215,0,0.65)" />
          <Text style={[styles.betaText, { color: 'rgba(255,215,0,0.65)' }]}>
            Tournaments are in development — launching soon
          </Text>
        </View>

        {/* Tournament type cards */}
        <Text style={styles.sectionLabel}>CHOOSE YOUR TOURNAMENT</Text>

        {TYPE_ORDER.map(type => (
          <TournamentTypeCard
            key={type}
            config={TOURNAMENT_CONFIGS[type]}
            userChips={profile.chips}
          />
        ))}

        {/* Blind structure reference */}
        <BlindSchedule handsPerLevel={4} />

        {/* Info footer */}
        <View style={styles.footerNote}>
          <Ionicons name="shield-checkmark-outline" size={13} color={colors.textMuted} />
          <Text style={styles.footerText}>
            All buy-ins and prizes are virtual chips only and have no real-world value.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const card = StyleSheet.create({
  wrap: {
    borderRadius: colors.radiusLg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    padding: 16,
    gap: 12,
    position: 'relative',
  },
  wrapGold: {
    borderColor: 'rgba(255,215,0,0.3)',
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'Orbitron_700Bold',
    letterSpacing: 1.5,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  vipBadge: {
    backgroundColor: 'rgba(255,215,0,0.15)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.4)',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  vipText: {
    color: colors.gold,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    padding: 10,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 1,
  },
  statValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'Inter_700Bold',
  },
  prizeLabel: {
    color: colors.textDim,
    fontSize: 10,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  insufficientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,68,68,0.08)',
    borderRadius: 8,
    padding: 8,
  },
  insufficientText: {
    color: colors.error,
    fontSize: 11,
    flex: 1,
  },
  playBtn: {
    borderRadius: 50,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    overflow: 'hidden',
    marginTop: 2,
  },
  playBtnDisabled: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  playBtnText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'Orbitron_700Bold',
    letterSpacing: 1.5,
  },
  playBtnTextDisabled: {
    color: colors.textDim,
  },
});

const blind = StyleSheet.create({
  wrap: {
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.02)',
    gap: 10,
  },
  title: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
  },
  grid: { gap: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  level: {
    color: colors.accent,
    fontSize: 9,
    fontWeight: '700',
    width: 44,
  },
  blinds: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    flex: 1,
  },
  hands: {
    color: colors.textMuted,
    fontSize: 10,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, gap: 14 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    fontFamily: 'Orbitron_900Black',
    letterSpacing: 3,
  },
  pageSub: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  balanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.25)',
  },
  balanceText: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  betaNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primaryDim,
    borderRadius: 10,
    padding: 10,
  },
  betaText: {
    color: colors.primary,
    fontSize: 11,
    flex: 1,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: 'Orbitron_400Regular',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  footerText: {
    color: colors.textMuted,
    fontSize: 10,
    flex: 1,
    lineHeight: 15,
  },
});
