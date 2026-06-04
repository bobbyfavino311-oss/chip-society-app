import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import {
  Platform, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@/context/UserContext';
import { GuestBanner } from '@/components/GuestBanner';

// ─── Option row ───────────────────────────────────────────────────────────────
interface OptionDef {
  label: string;
  icon: string;
  sub?: string;
  onPress?: () => void;
  locked?: boolean;
}

function OptionRow({ opt, accent }: { opt: OptionDef; accent: string }) {
  if (opt.locked) {
    return (
      <View style={[or.row, or.rowLocked]}>
        <View style={or.iconWrap}>
          <Ionicons name="lock-closed-outline" size={13} color="rgba(255,255,255,0.18)" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={or.labelLocked}>{opt.label}</Text>
          {opt.sub && <Text style={or.sub}>{opt.sub}</Text>}
        </View>
        <View style={or.soonBadge}>
          <Text style={or.soonText}>SOON</Text>
        </View>
      </View>
    );
  }
  return (
    <TouchableOpacity style={[or.row, { borderColor: `${accent}35`, overflow: 'hidden' }]} onPress={opt.onPress} activeOpacity={0.8}>
      <LinearGradient colors={[`${accent}18`, 'transparent']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
      <View style={[or.iconWrap, { backgroundColor: `${accent}1a`, borderColor: `${accent}45` }]}>
        <Ionicons name={opt.icon as any} size={14} color={accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[or.label, { color: accent }]}>{opt.label}</Text>
        {opt.sub && <Text style={or.sub}>{opt.sub}</Text>}
      </View>
      <View style={[or.playBtn, { backgroundColor: `${accent}22`, borderColor: `${accent}55` }]}>
        <Ionicons name="play" size={11} color={accent} />
      </View>
    </TouchableOpacity>
  );
}

const or = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  rowLocked:   { opacity: 0.42, backgroundColor: 'rgba(255,255,255,0.015)' },
  iconWrap:    { width: 32, height: 32, borderRadius: 9, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  label:       { fontSize: 11, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 0.8 },
  labelLocked: { fontSize: 11, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 0.8, color: 'rgba(255,255,255,0.28)' },
  sub:         { fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 1 },
  soonBadge:   { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  soonText:    { fontSize: 8, fontWeight: '800', fontFamily: 'Orbitron_700Bold', letterSpacing: 1, color: 'rgba(255,255,255,0.2)' },
  playBtn:     { width: 28, height: 28, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});

// ─── Section card ─────────────────────────────────────────────────────────────
interface SectionCardProps {
  section: string;
  accent:  string;
  icon:    string;
  title:   string;
  lines:   string[];
  options: OptionDef[];
  locked?: boolean;
}

function SectionCard({ section, accent, icon, title, lines, options, locked }: SectionCardProps) {
  const borderColor = locked ? 'rgba(255,215,0,0.2)' : `${accent}38`;
  const topBar      = locked ? 'rgba(255,215,0,0.5)' : accent;
  const titleColor  = locked ? 'rgba(255,215,0,0.7)' : accent;

  return (
    <View style={sc.wrap}>
      <Text style={sc.sectionLabel}>{section}</Text>

      <View style={[sc.card, { borderColor }]}>
        <LinearGradient
          colors={locked ? ['rgba(255,215,0,0.06)', 'transparent'] : [`${accent}10`, 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        />
        <View style={[sc.topBar, { backgroundColor: topBar }]} />

        {/* Header */}
        <View style={sc.header}>
          <View style={[sc.iconWrap, { backgroundColor: `${accent}15`, borderColor: `${accent}40` }]}>
            <Ionicons name={icon as any} size={22} color={locked ? 'rgba(255,215,0,0.55)' : accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[sc.title, { color: titleColor }]}>{title}</Text>
            {lines.map((l, i) => <Text key={i} style={sc.line}>{l}</Text>)}
          </View>
        </View>

        {/* Divider */}
        <View style={sc.divider} />

        {/* Options / locked state */}
        {locked ? (
          <View style={sc.lockedRow}>
            <Ionicons name="lock-closed" size={20} color="rgba(255,215,0,0.35)" />
            <View>
              <Text style={sc.lockedTitle}>COMING SOON</Text>
              <Text style={sc.lockedSub}>Competitive tournaments arriving in a future update.</Text>
            </View>
          </View>
        ) : (
          <View style={sc.optList}>
            {options.map(o => <OptionRow key={o.label} opt={o} accent={accent} />)}
          </View>
        )}
      </View>
    </View>
  );
}

const sc = StyleSheet.create({
  wrap:         { marginBottom: 6 },
  sectionLabel: {
    fontSize: 9, fontWeight: '700', fontFamily: 'Orbitron_700Bold',
    letterSpacing: 2.5, color: 'rgba(255,255,255,0.32)',
    marginBottom: 10, marginTop: 8,
  },
  card:     { borderRadius: 18, borderWidth: 1, overflow: 'hidden', padding: 16, gap: 14 },
  topBar:   { position: 'absolute', top: 0, left: 0, right: 0, height: 2 },
  header:   { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconWrap: { width: 52, height: 52, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title:    { fontSize: 15, fontWeight: '900', fontFamily: 'Orbitron_900Black', letterSpacing: 0.8 },
  line:     { fontSize: 10, color: 'rgba(255,255,255,0.38)', marginTop: 2 },
  divider:  { height: 1, backgroundColor: 'rgba(255,255,255,0.07)' },
  optList:  { gap: 8 },
  lockedRow:  { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 6 },
  lockedTitle:{ fontSize: 13, fontWeight: '900', fontFamily: 'Orbitron_700Bold', color: 'rgba(255,215,0,0.5)', letterSpacing: 2 },
  lockedSub:  { fontSize: 10, color: 'rgba(255,255,255,0.28)', marginTop: 3 },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function PlayScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useUser();

  return (
    <View style={s.container}>
      <LinearGradient
        colors={['#050010', '#0a001e', '#050010']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />

      {profile.isGuest && (
        <GuestBanner message="Create a free account to save your progress and stats" />
      )}

      <ScrollView
        contentContainerStyle={[
          s.scroll,
          {
            paddingTop:    insets.top + (Platform.OS === 'web' ? 67 : 16),
            paddingBottom: insets.bottom + 90,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.pageTitle}>PLAY</Text>
        <Text style={s.pageSub}>Choose your game mode</Text>

        {/* ── TRADITIONAL HOLD'EM ─────────────────────────────────────── */}
        <SectionCard
          section="TRADITIONAL HOLD'EM"
          accent="#00d4ff"
          icon="card-outline"
          title="NO LIMIT HOLD'EM"
          lines={["52-card deck · Standard rankings", "Full House beats Flush"]}
          options={[
            {
              label: "AI PRACTICE",
              icon:  "game-controller-outline",
              sub:   "vs AI bots — fully offline",
              onPress: () => router.push('/game/practice?variant=texas_holdem&players=5' as any),
            },
            { label: "QUICK MATCH", icon: "flash-outline", sub: "Online matchmaking", locked: true },
            { label: "RANKED",      icon: "podium-outline", sub: "Competitive ladder",  locked: true },
          ]}
        />

        {/* ── SHORT DECK HOLD'EM ──────────────────────────────────────── */}
        <SectionCard
          section="SHORT DECK HOLD'EM"
          accent="#bf5fff"
          icon="layers-outline"
          title="SHORT DECK HOLD'EM"
          lines={["36-card deck · 6 through Ace only", "Flush beats Full House"]}
          options={[
            {
              label: "AI PRACTICE",
              icon:  "game-controller-outline",
              sub:   "vs AI bots — fully offline",
              onPress: () => router.push('/game/practice?variant=short_deck_holdem&players=5' as any),
            },
            { label: "QUICK MATCH", icon: "flash-outline", sub: "Online matchmaking", locked: true },
            { label: "RANKED",      icon: "podium-outline", sub: "Competitive ladder",  locked: true },
          ]}
        />

        {/* ── CASINO ──────────────────────────────────────────────────── */}
        <SectionCard
          section="CASINO"
          accent="#ffd700"
          icon="diamond-outline"
          title="THREE CARD POKER"
          lines={["Player vs Dealer · Queen High dealer qualify", "Win chips against the house"]}
          options={[
            {
              label: "PLAY THREE CARD",
              icon:  "albums-outline",
              sub:   "Ante · Pair Plus · Ante Bonus",
              onPress: () => router.push('/casino/three-card-poker' as any),
            },
            { label: "MORE GAMES", icon: "grid-outline", sub: "Blackjack, Roulette and more", locked: true },
          ]}
        />

        {/* ── TOURNAMENTS ─────────────────────────────────────────────── */}
        <SectionCard
          section="TOURNAMENTS"
          accent="#ffd700"
          icon="trophy-outline"
          title="TOURNAMENTS"
          lines={["Multi-table · Prize pools · Brackets"]}
          options={[]}
          locked
        />
      </ScrollView>
    </View>
  );
}

// ─── Root styles ──────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050010' },
  scroll:    { paddingHorizontal: 16 },
  pageTitle: {
    fontSize: 26, fontWeight: '900', fontFamily: 'Orbitron_900Black',
    color: '#fff', letterSpacing: 3, marginBottom: 4,
  },
  pageSub: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8 },
});
