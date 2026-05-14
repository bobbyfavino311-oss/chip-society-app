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

// ─── Data ─────────────────────────────────────────────────────────────────────

type TStatus = 'registering' | 'live' | 'upcoming' | 'completed';

interface Tournament {
  id: string;
  name: string;
  subtitle: string;
  prizePool: string;
  buyin: string;
  players: number;
  maxPlayers: number;
  startsIn: string;
  status: TStatus;
  color: string;
  featured?: boolean;
}

const TOURNAMENTS: Tournament[] = [
  {
    id: '1',
    name: 'NEON CHAMPIONSHIP',
    subtitle: 'Sunday Night Special',
    prizePool: '500K',
    buyin: '1,000',
    players: 128,
    maxPlayers: 256,
    startsIn: '3h 20m',
    status: 'registering',
    color: colors.accent,
    featured: true,
  },
  {
    id: '2',
    name: 'MIDNIGHT GRIND',
    subtitle: 'Nightly Turbo',
    prizePool: '100K',
    buyin: '200',
    players: 64,
    maxPlayers: 64,
    startsIn: 'IN PROGRESS',
    status: 'live',
    color: colors.secondary,
  },
  {
    id: '3',
    name: 'BLUE CHIP OPEN',
    subtitle: 'Deep Stack · 6-Max',
    prizePool: '250K',
    buyin: '500',
    players: 12,
    maxPlayers: 128,
    startsIn: 'Tomorrow 8PM',
    status: 'upcoming',
    color: colors.primary,
  },
  {
    id: '4',
    name: 'NEON FREEROLL',
    subtitle: 'Free Entry · All Welcome',
    prizePool: '25K',
    buyin: 'FREE',
    players: 201,
    maxPlayers: 500,
    startsIn: '6h 45m',
    status: 'registering',
    color: colors.success,
  },
  {
    id: '5',
    name: 'HIGH ROLLER ELITE',
    subtitle: 'VIP Only · High Stakes',
    prizePool: '2M',
    buyin: '10,000',
    players: 8,
    maxPlayers: 32,
    startsIn: 'Saturday 10PM',
    status: 'upcoming',
    color: colors.gold,
  },
  {
    id: '6',
    name: 'NEON BRONZE CUP',
    subtitle: 'Bronze Rank Only',
    prizePool: '50K',
    buyin: '100',
    players: 256,
    maxPlayers: 256,
    startsIn: 'ENDED',
    status: 'completed',
    color: '#cd7f32',
  },
];

const STATUS_CONFIG: Record<TStatus, { label: string; color: string; bg: string }> = {
  registering: { label: 'REGISTERING', color: colors.success, bg: 'rgba(0,255,136,0.1)' },
  live: { label: 'LIVE NOW', color: colors.secondary, bg: 'rgba(255,0,144,0.1)' },
  upcoming: { label: 'UPCOMING', color: colors.primary, bg: 'rgba(0,212,255,0.1)' },
  completed: { label: 'ENDED', color: colors.textDim, bg: 'rgba(80,80,104,0.1)' },
};

// ─── Featured card ────────────────────────────────────────────────────────────

function FeaturedCard({ t }: { t: Tournament }) {
  const sc = STATUS_CONFIG[t.status];
  const pct = t.players / t.maxPlayers;

  return (
    <View style={feat.card}>
      <LinearGradient
        colors={['#2a0060', '#0d0028', '#050010']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={feat.topRow}>
        <View style={[feat.statusBadge, { backgroundColor: sc.bg, borderColor: `${sc.color}44` }]}>
          {t.status === 'live' && <View style={[feat.liveDot, { backgroundColor: sc.color }]} />}
          <Text style={[feat.statusText, { color: sc.color }]}>{sc.label}</Text>
        </View>
        <Text style={feat.prize}>{t.prizePool} <Text style={feat.prizeLabel}>CHIPS</Text></Text>
      </View>

      <Text style={feat.name}>{t.name}</Text>
      <Text style={feat.sub}>{t.subtitle}</Text>

      <View style={feat.metaRow}>
        <View style={feat.metaItem}>
          <Ionicons name="people" size={13} color={colors.textMuted} />
          <Text style={feat.metaText}>{t.players} / {t.maxPlayers}</Text>
        </View>
        <View style={feat.metaItem}>
          <Ionicons name="ticket" size={13} color={colors.textMuted} />
          <Text style={feat.metaText}>{t.buyin} buy-in</Text>
        </View>
        <View style={feat.metaItem}>
          <Ionicons name="time-outline" size={13} color={colors.textMuted} />
          <Text style={feat.metaText}>{t.startsIn}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={feat.progressBg}>
        <View style={[feat.progressFill, { width: `${Math.round(pct * 100)}%` as any, backgroundColor: t.color }]} />
      </View>
      <Text style={feat.progressLabel}>{Math.round(pct * 100)}% full</Text>

      <TouchableOpacity style={[feat.regBtn, { backgroundColor: t.color }]} activeOpacity={0.85}>
        <Ionicons name="trophy" size={15} color={colors.background} />
        <Text style={feat.regText}>
          {t.status === 'live' ? 'SPECTATE' : t.status === 'completed' ? 'VIEW RESULTS' : 'REGISTER'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── List card ────────────────────────────────────────────────────────────────

function TournamentRow({ t }: { t: Tournament }) {
  const sc = STATUS_CONFIG[t.status];
  const pct = t.players / t.maxPlayers;

  return (
    <View style={row.card}>
      <LinearGradient
        colors={[`${t.color}12`, 'transparent']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />
      <View style={[row.accent, { backgroundColor: t.color }]} />
      <View style={{ flex: 1, gap: 4 }}>
        <View style={row.nameRow}>
          <Text style={row.name} numberOfLines={1}>{t.name}</Text>
          <View style={[row.statusBadge, { backgroundColor: sc.bg, borderColor: `${sc.color}40` }]}>
            {t.status === 'live' && <View style={[row.liveDot, { backgroundColor: sc.color }]} />}
            <Text style={[row.statusText, { color: sc.color }]}>{sc.label}</Text>
          </View>
        </View>
        <Text style={row.sub}>{t.subtitle}</Text>
        <View style={row.metaRow}>
          <Text style={row.meta}>
            <Text style={{ color: t.color }}>{t.prizePool}</Text> pool
          </Text>
          <Text style={row.metaDot}>·</Text>
          <Text style={row.meta}>{t.buyin} buy-in</Text>
          <Text style={row.metaDot}>·</Text>
          <Text style={row.meta}>{t.players}/{t.maxPlayers} players</Text>
        </View>
        <View style={row.progressBg}>
          <View style={[row.progressFill, { width: `${Math.round(pct * 100)}%` as any, backgroundColor: t.color }]} />
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'registering', label: 'Open' },
  { id: 'live', label: 'Live' },
  { id: 'upcoming', label: 'Upcoming' },
];

export default function TournamentsScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState('all');

  const featured = TOURNAMENTS.find(t => t.featured);
  const listed = TOURNAMENTS.filter(t =>
    !t.featured && (filter === 'all' || t.status === filter)
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background, '#08001c']}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 16), paddingBottom: insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.pageTitle}>TOURNAMENTS</Text>
            <Text style={styles.pageSub}>{TOURNAMENTS.filter(t => t.status === 'registering').length} open for registration</Text>
          </View>
          <View style={styles.prizeHeaderBadge}>
            <Ionicons name="trophy" size={12} color={colors.gold} />
            <Text style={styles.prizeHeaderText}>Up to 2M</Text>
          </View>
        </View>

        {/* Featured */}
        {featured && (
          <>
            <Text style={styles.sectionLabel}>FEATURED</Text>
            <FeaturedCard t={featured} />
          </>
        )}

        {/* Filter */}
        <View style={styles.filterRow}>
          {FILTER_TABS.map(f => (
            <TouchableOpacity
              key={f.id}
              style={[styles.filterBtn, filter === f.id && styles.filterBtnActive]}
              onPress={() => setFilter(f.id)}
            >
              <Text style={[styles.filterText, filter === f.id && styles.filterTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>ALL TOURNAMENTS</Text>

        {listed.map(t => <TournamentRow key={t.id} t={t} />)}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const feat = StyleSheet.create({
  card: {
    borderRadius: colors.radiusLg, borderWidth: 1, borderColor: colors.borderBright,
    overflow: 'hidden', padding: 18, gap: 8,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  prize: { color: colors.gold, fontSize: 26, fontWeight: '800', fontFamily: 'Orbitron_700Bold' },
  prizeLabel: { color: colors.gold, fontSize: 12, fontWeight: '600' },
  name: { color: colors.text, fontSize: 20, fontWeight: '800', fontFamily: 'Orbitron_700Bold', letterSpacing: 1 },
  sub: { color: colors.textMuted, fontSize: 12 },
  metaRow: { flexDirection: 'row', gap: 16, marginTop: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { color: colors.textMuted, fontSize: 12 },
  progressBg: { height: 4, backgroundColor: colors.border, borderRadius: 2 },
  progressFill: { height: 4, borderRadius: 2 },
  progressLabel: { color: colors.textDim, fontSize: 10 },
  regBtn: {
    borderRadius: colors.radius, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 14, gap: 8, marginTop: 4,
  },
  regText: { color: colors.background, fontSize: 13, fontWeight: '800', fontFamily: 'Orbitron_700Bold', letterSpacing: 1 },
});

const row = StyleSheet.create({
  card: {
    borderRadius: colors.radius, borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  accent: { width: 3, height: '100%', borderRadius: 2, position: 'absolute', left: 0, top: 0, bottom: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { color: colors.text, fontSize: 13, fontWeight: '700', fontFamily: 'Orbitron_700Bold', flex: 1 },
  statusBadge: { borderRadius: 4, borderWidth: 1, paddingHorizontal: 5, paddingVertical: 2, flexDirection: 'row', alignItems: 'center', gap: 4 },
  liveDot: { width: 4, height: 4, borderRadius: 2 },
  statusText: { fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  sub: { color: colors.textMuted, fontSize: 11 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { color: colors.textDim, fontSize: 11 },
  metaDot: { color: colors.textDim, fontSize: 11 },
  progressBg: { height: 3, backgroundColor: colors.border, borderRadius: 2, marginTop: 2 },
  progressFill: { height: 3, borderRadius: 2 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: 16, gap: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pageTitle: { color: colors.text, fontSize: 22, fontWeight: '800', fontFamily: 'Orbitron_900Black', letterSpacing: 3 },
  pageSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  prizeHeaderBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,215,0,0.1)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,215,0,0.25)' },
  prizeHeaderText: { color: colors.gold, fontSize: 12, fontWeight: '700' },
  sectionLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 2, fontFamily: 'Orbitron_400Regular' },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterBtn: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  filterBtnActive: { borderColor: colors.primary, backgroundColor: 'rgba(0,212,255,0.1)' },
  filterText: { color: colors.textDim, fontSize: 12, fontWeight: '600' },
  filterTextActive: { color: colors.primary, fontWeight: '700' },
});
