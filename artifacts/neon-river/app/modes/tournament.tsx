import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import {
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
import {
  TOURNAMENT_CONFIGS,
  TournamentConfig,
  TournamentType,
  getPrizePool,
  getVariantBadge,
} from '@/constants/tournaments';

const TYPE_ORDER: TournamentType[] = [
  'beginner', 'sitandgo', 'turbo', 'daily', 'highroller', 'nightgrind', 'weekendmajor', 'deepstack', 'hyperturbo',
  'sd_lounge', 'sd_showdown', 'sd_rush', 'sd_royal',
  'omaha_championship', 'omaha_highroller',
  'joker_showdown', 'joker_jackpot',
];

function formatChips(n: number): string {
  const v = (x: number) => x % 1 === 0 ? x.toFixed(0) : x.toFixed(1);
  if (n >= 1_000_000_000) return `${v(n / 1_000_000_000)}B`;
  if (n >= 1_000_000)     return `${v(n / 1_000_000)}M`;
  if (n >= 1_000)         return `${v(n / 1_000)}K`;
  return String(n);
}

function TournamentCard({ config, userChips }: { config: TournamentConfig; userChips: number }) {
  const prizePool = getPrizePool(config);
  const canAfford = userChips >= config.buyIn;
  const variantBadge = getVariantBadge(config.variant);

  const handlePress = () => {
    router.push({ pathname: '/game/tournament', params: { type: config.type } } as any);
  };

  return (
    <TouchableOpacity
      style={[st.card, { borderColor: `${config.color}44` }]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={[`${config.color}14`, 'transparent']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={[st.accent, { backgroundColor: config.color }]} />

      <View style={st.cardTop}>
        <View style={[st.iconWrap, { borderColor: `${config.color}50`, backgroundColor: `${config.color}15` }]}>
          <Ionicons name={config.icon as any} size={18} color={config.color} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={[st.cardName, { color: config.color }]}>{config.name}</Text>
            <View style={[st.variantBadge, { borderColor: `${variantBadge.color}40`, backgroundColor: `${variantBadge.color}12` }]}>
              <Text style={[st.variantBadgeText, { color: variantBadge.color }]}>{variantBadge.label}</Text>
            </View>
          </View>
          <Text style={st.cardSub}>{config.subtitle}</Text>
        </View>
        {!canAfford && <Ionicons name="lock-closed" size={14} color={colors.textDim} />}
      </View>

      <View style={st.statsRow}>
        <View style={st.stat}>
          <Text style={st.statLabel}>BUY-IN</Text>
          <Text style={[st.statVal, { color: canAfford ? config.color : colors.error }]}>
            {formatChips(config.buyIn)}
          </Text>
        </View>
        <View style={st.statDivider} />
        <View style={st.stat}>
          <Text style={st.statLabel}>PRIZE POOL</Text>
          <Text style={[st.statVal, { color: colors.gold }]}>{formatChips(prizePool)}</Text>
        </View>
        <View style={st.statDivider} />
        <View style={st.stat}>
          <Text style={st.statLabel}>PLAYERS</Text>
          <Text style={st.statVal}>{config.numPlayers}</Text>
        </View>
        <View style={st.statDivider} />
        <View style={st.stat}>
          <Text style={st.statLabel}>STACKS</Text>
          <Text style={st.statVal}>{formatChips(config.startingChips)}</Text>
        </View>
      </View>

      <View style={[st.entryBtn, !canAfford && st.entryBtnDisabled]}>
        {canAfford && (
          <LinearGradient
            colors={[config.color, `${config.color}88`]}
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
        <Text style={[st.entryBtnText, !canAfford && st.entryBtnTextDisabled]}>
          {canAfford ? `ENTER · ${formatChips(config.buyIn)} CHIPS` : 'NOT ENOUGH CHIPS'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function TournamentModeScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useUser();

  return (
    <View style={st.container}>
      <LinearGradient colors={['#100018', '#050010', '#000818']} style={StyleSheet.absoluteFill} />
      <View style={st.glowPurple} />

      <View style={[st.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 20 : 16) }]}>
        <TouchableOpacity onPress={() => router.back()} style={st.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color="#bf5fff" />
        </TouchableOpacity>
        <Text style={st.title}>TOURNAMENTS</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={st.balanceRow}>
        <Ionicons name="wallet-outline" size={13} color={colors.gold} />
        <Text style={st.balanceLabel}>YOUR BALANCE</Text>
        <Text style={st.balanceAmt}>{formatChips(profile.chips)}</Text>
      </View>

      <ScrollView
        contentContainerStyle={[st.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={st.sectionSub}>
          AI-filled single-table tournaments · Buy-in deducted at lobby · Virtual chips only
        </Text>

        {TYPE_ORDER.map(type => (
          <TournamentCard
            key={type}
            config={TOURNAMENT_CONFIGS[type]}
            userChips={profile.chips}
          />
        ))}

        <View style={st.infoBox}>
          <Ionicons name="information-circle-outline" size={14} color={colors.primary} />
          <Text style={st.infoText}>
            Confirm entry in the lobby before chips are deducted. Prizes are awarded instantly to your balance when the tournament ends.
          </Text>
        </View>

        <View style={st.comingSoon}>
          <Ionicons name="timer-outline" size={16} color={colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={st.comingSoonTitle}>MULTIPLAYER TOURNAMENTS</Text>
            <Text style={st.comingSoonSub}>Live events, real opponents, and massive prize pools — coming with the multiplayer update.</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050010' },
  glowPurple: {
    position: 'absolute', top: -60, right: -60, width: 300, height: 300,
    borderRadius: 150, backgroundColor: 'rgba(191,95,255,0.07)',
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
  },
  backBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
    borderRadius: 20, backgroundColor: 'rgba(191,95,255,0.1)',
    borderWidth: 1, borderColor: 'rgba(191,95,255,0.25)',
  },
  title: { color: colors.text, fontSize: 18, fontWeight: '900', fontFamily: 'Orbitron_900Black', letterSpacing: 2 },
  balanceRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginHorizontal: 16, marginBottom: 6,
    backgroundColor: 'rgba(255,215,0,0.08)', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.2)',
  },
  balanceLabel: { color: colors.textMuted, fontSize: 11, flex: 1, letterSpacing: 1 },
  balanceAmt: { color: colors.gold, fontSize: 13, fontWeight: '800', fontFamily: 'Inter_700Bold' },
  scroll: { paddingHorizontal: 16, paddingTop: 4, gap: 14 },
  sectionSub: { color: colors.textMuted, fontSize: 11, lineHeight: 17 },
  card: {
    borderRadius: 16, borderWidth: 1, padding: 16, gap: 12, overflow: 'hidden', position: 'relative',
  },
  accent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  cardName: { fontSize: 14, fontWeight: '800', fontFamily: 'Orbitron_700Bold', letterSpacing: 1 },
  cardSub: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  variantBadge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2 },
  variantBadgeText: { fontSize: 8, fontWeight: '800', fontFamily: 'Orbitron_700Bold', letterSpacing: 1 },
  statsRow: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10, padding: 10, alignItems: 'center',
  },
  stat: { flex: 1, alignItems: 'center', gap: 3 },
  statDivider: { width: 1, height: 28, backgroundColor: colors.border },
  statLabel: { color: colors.textMuted, fontSize: 7, fontWeight: '700', letterSpacing: 1 },
  statVal: { color: colors.text, fontSize: 13, fontWeight: '800', fontFamily: 'Inter_700Bold' },
  entryBtn: {
    borderRadius: 50, paddingVertical: 12, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 7, overflow: 'hidden',
  },
  entryBtnDisabled: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  entryBtnText: {
    color: colors.background, fontSize: 11, fontWeight: '800',
    fontFamily: 'Orbitron_700Bold', letterSpacing: 1.5,
  },
  entryBtnTextDisabled: { color: colors.textDim },
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: colors.primaryDim, borderRadius: 10, padding: 12,
  },
  infoText: { color: colors.primary, fontSize: 11, flex: 1, lineHeight: 17 },
  comingSoon: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderRadius: 12, borderWidth: 1, borderColor: `${colors.accent}33`,
    backgroundColor: `${colors.accent}08`, padding: 14,
  },
  comingSoonTitle: {
    color: colors.accent, fontSize: 10, fontWeight: '800',
    fontFamily: 'Orbitron_700Bold', letterSpacing: 1.5,
  },
  comingSoonSub: { color: colors.textMuted, fontSize: 11, marginTop: 3, lineHeight: 16 },
});
