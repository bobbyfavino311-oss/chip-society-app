import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
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
  TEXAS_TOURNAMENTS,
  SHORT_DECK_TOURNAMENTS,
} from '@/constants/tournaments';
import { BLIND_LEVELS } from '@/hooks/useTournamentGame';

function formatChips(n: number): string {
  const v = (x: number) => (x % 1 === 0 ? x.toFixed(0) : x.toFixed(1));
  if (n >= 1_000_000_000) return `${v(n / 1_000_000_000)}B`;
  if (n >= 1_000_000) return `${v(n / 1_000_000)}M`;
  if (n >= 1_000) return `${v(n / 1_000)}K`;
  return String(n);
}

// ─── Tab pill ─────────────────────────────────────────────────────────────────

type Tab = 'texas' | 'shortdeck';

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <View style={tab.wrap}>
      {(['texas', 'shortdeck'] as Tab[]).map(t => {
        const isActive = active === t;
        const label = t === 'texas' ? "TEXAS HOLD'EM" : 'SHORT DECK';
        const accent = t === 'texas' ? colors.primary : colors.secondary;
        return (
          <TouchableOpacity
            key={t}
            style={[tab.btn, isActive && { borderColor: accent, backgroundColor: `${accent}15` }]}
            onPress={() => onChange(t)}
            activeOpacity={0.7}
          >
            {isActive && (
              <LinearGradient
                colors={[`${accent}22`, 'transparent']}
                style={StyleSheet.absoluteFill}
              />
            )}
            <Text style={[tab.label, isActive && { color: accent }]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Tournament card ──────────────────────────────────────────────────────────

function TournamentCard({ config, userChips }: { config: TournamentConfig; userChips: number }) {
  const prizePool = getPrizePool(config);
  const canAfford = userChips >= config.buyIn;
  const isHighRoller = config.type === 'highroller' || config.type === 'sd_royal';

  const handleEnter = () => {
    if (!canAfford) {
      Alert.alert(
        'Not Enough Chips',
        `You need ${formatChips(config.buyIn)} chips to enter this tournament.\n\nYour balance: ${formatChips(userChips)}`,
        [{ text: 'OK' }],
      );
      return;
    }
    Alert.alert(
      `Enter ${config.name}?`,
      `Buy-in: ${formatChips(config.buyIn)} chips\nPrize Pool: ${formatChips(prizePool)} chips\n\n${config.prizeLabel}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Enter Tournament',
          onPress: () =>
            router.push({ pathname: '/game/tournament', params: { type: config.type } } as any),
        },
      ],
    );
  };

  return (
    <View style={[cd.wrap, isHighRoller && { borderColor: `${config.color}55` }]}>
      <LinearGradient
        colors={[`${config.color}16`, `${config.color}06`, 'transparent']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={[cd.accent, { backgroundColor: config.color }]} />

      {/* Header */}
      <View style={cd.headerRow}>
        <View style={[cd.iconWrap, { borderColor: `${config.color}50`, backgroundColor: `${config.color}15` }]}>
          <Ionicons name={config.icon as any} size={20} color={config.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[cd.name, { color: config.color }]}>{config.name}</Text>
          <Text style={cd.subtitle}>{config.subtitle}</Text>
        </View>
        {isHighRoller && (
          <View style={cd.vipBadge}>
            <Text style={cd.vipText}>VIP</Text>
          </View>
        )}
      </View>

      {/* Stats */}
      <View style={cd.statsRow}>
        <View style={cd.statItem}>
          <Text style={cd.statLabel}>BUY-IN</Text>
          <Text style={[cd.statValue, { color: canAfford ? config.color : colors.error }]}>
            {formatChips(config.buyIn)}
          </Text>
        </View>
        <View style={cd.statDivider} />
        <View style={cd.statItem}>
          <Text style={cd.statLabel}>PRIZE POOL</Text>
          <Text style={[cd.statValue, { color: colors.gold }]}>{formatChips(prizePool)}</Text>
        </View>
        <View style={cd.statDivider} />
        <View style={cd.statItem}>
          <Text style={cd.statLabel}>PLAYERS</Text>
          <Text style={cd.statValue}>{config.numPlayers}</Text>
        </View>
        <View style={cd.statDivider} />
        <View style={cd.statItem}>
          <Text style={cd.statLabel}>STACKS</Text>
          <Text style={cd.statValue}>{formatChips(config.startingChips)}</Text>
        </View>
      </View>

      {/* Prize label */}
      <Text style={cd.prizeLabel}>{config.prizeLabel}</Text>

      {/* Enter button */}
      <TouchableOpacity
        style={[cd.enterBtn, !canAfford && cd.enterBtnDisabled]}
        onPress={handleEnter}
        activeOpacity={0.82}
      >
        {canAfford && (
          <LinearGradient
            colors={[config.color, `${config.color}99`]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        )}
        <Ionicons
          name={canAfford ? 'trophy' : 'lock-closed'}
          size={13}
          color={canAfford ? colors.background : colors.textDim}
        />
        <Text style={[cd.enterBtnText, !canAfford && cd.enterBtnTextDisabled]}>
          {canAfford ? `ENTER  ·  ${formatChips(config.buyIn)} CHIPS` : 'NOT ENOUGH CHIPS'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Blind schedule ───────────────────────────────────────────────────────────

function BlindSchedule() {
  const levels = BLIND_LEVELS.slice(0, 4);
  return (
    <View style={bl.wrap}>
      <Text style={bl.title}>BLIND STRUCTURE (first 4 levels)</Text>
      <View style={bl.grid}>
        {levels.map((lvl, i) => (
          <View key={i} style={bl.row}>
            <Text style={bl.level}>LVL {i + 1}</Text>
            <Text style={bl.blinds}>{lvl.sb} / {lvl.bb}</Text>
            <Text style={bl.info}>Antes start level 3</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function TournamentsScreen() {
  const insets = useSafeAreaInsets();
  const dynColors = useColors();
  const { profile } = useUser();
  const [activeTab, setActiveTab] = useState<Tab>('texas');

  const tournamentList: TournamentType[] =
    activeTab === 'texas' ? TEXAS_TOURNAMENTS : SHORT_DECK_TOURNAMENTS;

  return (
    <View style={[st.container, { backgroundColor: dynColors.background }]}>
      <LinearGradient
        colors={[dynColors.background, dynColors.surfaceElevated]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={[
          st.scroll,
          { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 16), paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={st.headerRow}>
          <View>
            <Text style={st.pageTitle}>TOURNAMENTS</Text>
            <Text style={st.pageSub}>Single-table · AI-filled · Virtual chips only</Text>
          </View>
          <View style={st.balanceBadge}>
            <Ionicons name="wallet-outline" size={12} color={colors.gold} />
            <Text style={st.balanceText}>{formatChips(profile.chips)}</Text>
          </View>
        </View>

        {/* Live badge */}
        <View style={st.liveBadge}>
          <View style={st.liveDot} />
          <Text style={st.liveText}>LIVE · AI-filled tables start instantly</Text>
        </View>

        {/* Tabs */}
        <TabBar active={activeTab} onChange={setActiveTab} />

        {/* Cards */}
        <Text style={st.sectionLabel}>
          {activeTab === 'texas' ? "TEXAS HOLD'EM" : 'SHORT DECK HOLD\'EM'}
        </Text>

        {tournamentList.map(type => (
          <TournamentCard
            key={type}
            config={TOURNAMENT_CONFIGS[type]}
            userChips={profile.chips}
          />
        ))}

        {/* Blind reference */}
        <BlindSchedule />

        {/* Multiplayer teaser */}
        <View style={st.mpTeaser}>
          <Ionicons name="people-outline" size={16} color={colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={st.mpTitle}>MULTIPLAYER TOURNAMENTS</Text>
            <Text style={st.mpSub}>
              Live events against real players with massive prize pools — arriving with the multiplayer update.
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={st.footerNote}>
          <Ionicons name="shield-checkmark-outline" size={13} color={colors.textMuted} />
          <Text style={st.footerText}>
            All buy-ins and prizes are virtual chips only and have no real-world value.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const tab = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  label: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: 'Orbitron_700Bold',
    letterSpacing: 1.2,
    color: colors.textMuted,
  },
});

const cd = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    padding: 16,
    gap: 12,
    position: 'relative',
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
    fontSize: 15,
    fontWeight: '800',
    fontFamily: 'Orbitron_700Bold',
    letterSpacing: 1.2,
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
  enterBtn: {
    borderRadius: 50,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    overflow: 'hidden',
  },
  enterBtnDisabled: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  enterBtnText: {
    color: colors.background,
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'Orbitron_700Bold',
    letterSpacing: 1.5,
  },
  enterBtnTextDisabled: {
    color: colors.textDim,
  },
});

const bl = StyleSheet.create({
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
  info: {
    color: colors.textMuted,
    fontSize: 10,
  },
});

const st = StyleSheet.create({
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
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(0,232,135,0.08)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: 'rgba(0,232,135,0.25)',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#00e887',
  },
  liveText: {
    color: '#00e887',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: 'Orbitron_400Regular',
  },
  mpTeaser: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${colors.accent}33`,
    backgroundColor: `${colors.accent}08`,
    padding: 14,
  },
  mpTitle: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'Orbitron_700Bold',
    letterSpacing: 1.5,
  },
  mpSub: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 3,
    lineHeight: 16,
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
