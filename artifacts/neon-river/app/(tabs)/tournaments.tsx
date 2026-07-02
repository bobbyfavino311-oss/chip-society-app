import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
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
import { useColors } from '@/hooks/useColors';
import { useUser } from '@/context/UserContext';
import {
  TOURNAMENT_CONFIGS,
  TournamentType,
  TEXAS_TOURNAMENTS,
  SHORT_DECK_TOURNAMENTS,
  OMAHA_TOURNAMENTS,
  JOKER_TOURNAMENTS,
  getVariantBadge,
} from '@/constants/tournaments';
import TournamentLiveCard from '@/components/TournamentLiveCard';

type Tab = 'texas' | 'shortdeck' | 'omaha' | 'joker';

const TAB_LABELS: Record<Tab, string> = {
  texas: "TEXAS HOLD'EM",
  shortdeck: 'SHORT DECK',
  omaha: 'OMAHA',
  joker: 'JOKER',
};

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <View style={tab.wrap}>
      {(['texas', 'shortdeck', 'omaha', 'joker'] as Tab[]).map(t => {
        const isActive = active === t;
        const label = TAB_LABELS[t];
        const accent =
          t === 'texas' ? colors.primary :
          t === 'shortdeck' ? colors.secondary :
          getVariantBadge(t === 'omaha' ? 'omaha_holdem' : 'joker_holdem').color;
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

export default function TournamentsScreen() {
  const insets = useSafeAreaInsets();
  const dynColors = useColors();
  const { profile } = useUser();
  const [activeTab, setActiveTab] = useState<Tab>('texas');

  const tournamentList: TournamentType[] =
    activeTab === 'texas' ? TEXAS_TOURNAMENTS :
    activeTab === 'shortdeck' ? SHORT_DECK_TOURNAMENTS :
    activeTab === 'omaha' ? OMAHA_TOURNAMENTS :
    JOKER_TOURNAMENTS;

  return (
    <View style={[st.container, { backgroundColor: dynColors.background }]}>
      <LinearGradient
        colors={[dynColors.background, dynColors.surfaceElevated]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={[
          st.scroll,
          {
            paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 16),
            paddingBottom: insets.bottom + 100,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={st.headerRow}>
          <View>
            <Text style={st.pageTitle}>TOURNAMENTS</Text>
            <Text style={st.pageSub}>Live events · AI-filled · Virtual chips only</Text>
          </View>
          <View style={st.balanceBadge}>
            <Ionicons name="wallet-outline" size={12} color={colors.gold} />
            <Text style={st.balanceText}>
              {profile.chips >= 1_000_000
                ? `${(profile.chips / 1_000_000).toFixed(1)}M`
                : profile.chips >= 1_000
                ? `${Math.floor(profile.chips / 1_000)}K`
                : String(profile.chips)}
            </Text>
          </View>
        </View>

        {/* Live badge */}
        <View style={st.liveBadge}>
          <View style={st.liveDot} />
          <Text style={st.liveText}>LIVE · Tables fill with AI instantly · Start any time</Text>
        </View>

        {/* Tabs */}
        <TabBar active={activeTab} onChange={setActiveTab} />

        {/* Section label */}
        <Text style={st.sectionLabel}>
          {TAB_LABELS[activeTab]} EVENTS
        </Text>

        {/* Tournament cards */}
        {tournamentList.map(type => (
          <TournamentLiveCard
            key={type}
            config={TOURNAMENT_CONFIGS[type]}
            userChips={profile.chips}
          />
        ))}

        {/* Multiplayer teaser */}
        <View style={st.mpTeaser}>
          <Ionicons name="people-outline" size={16} color={colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={st.mpTitle}>MULTIPLAYER TOURNAMENTS</Text>
            <Text style={st.mpSub}>
              Real opponents, massive prize pools, live leaderboards — arriving with the
              multiplayer update.
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

const tab = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: 8 },
  btn: {
    flex: 1, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  label: {
    fontSize: 9, fontWeight: '800',
    fontFamily: 'Orbitron_700Bold', letterSpacing: 1.2,
    color: colors.textMuted,
  },
});

const st = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, gap: 14 },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  pageTitle: {
    color: colors.text, fontSize: 22,
    fontWeight: '800', fontFamily: 'Orbitron_900Black', letterSpacing: 3,
  },
  pageSub: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  balanceBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,215,0,0.1)', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.25)',
  },
  balanceText: {
    color: colors.gold, fontSize: 12,
    fontWeight: '700', fontFamily: 'Inter_700Bold',
  },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: 'rgba(0,232,135,0.08)', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 9,
    borderWidth: 1, borderColor: 'rgba(0,232,135,0.25)',
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#00e887' },
  liveText: { color: '#00e887', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  sectionLabel: {
    color: colors.textMuted, fontSize: 9,
    fontWeight: '700', letterSpacing: 2,
    fontFamily: 'Orbitron_400Regular',
  },
  mpTeaser: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderRadius: 12, borderWidth: 1,
    borderColor: `${colors.accent}33`, backgroundColor: `${colors.accent}08`, padding: 14,
  },
  mpTitle: {
    color: colors.accent, fontSize: 10, fontWeight: '800',
    fontFamily: 'Orbitron_700Bold', letterSpacing: 1.5,
  },
  mpSub: { color: colors.textMuted, fontSize: 11, marginTop: 3, lineHeight: 16 },
  footerNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 7,
    padding: 12, backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 10, borderWidth: 1, borderColor: colors.border,
  },
  footerText: { color: colors.textMuted, fontSize: 10, flex: 1, lineHeight: 15 },
});
