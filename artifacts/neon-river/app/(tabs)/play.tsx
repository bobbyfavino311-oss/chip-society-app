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
  section?:    string;
  accent:      string;
  icon:        string;
  title:       string;
  lines:       string[];
  options:     OptionDef[];
  locked?:     boolean;
  onPress?:    () => void;
  lockedLabel?: string;
  lockedSub?:  string;
}

function SectionCard({ section, accent, icon, title, lines, options, locked, onPress, lockedLabel, lockedSub }: SectionCardProps) {
  const borderColor = locked ? 'rgba(255,215,0,0.2)' : `${accent}38`;
  const topBar      = locked ? 'rgba(255,215,0,0.5)' : accent;
  const titleColor  = locked ? 'rgba(255,215,0,0.7)' : accent;
  const isActive    = !!onPress && !locked;

  const cardContent = (
    <View style={[sc.card, { borderColor }, locked && sc.cardLocked]}>
      <LinearGradient
        colors={locked ? ['rgba(255,215,0,0.06)', 'transparent'] : [`${accent}10`, 'transparent']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />
      <View style={[sc.topBar, { backgroundColor: topBar }]} />

      {/* Header */}
      <View style={sc.header}>
        <View style={[sc.iconWrap, { backgroundColor: `${accent}15`, borderColor: `${accent}40` }]}>
          <Ionicons name={icon as any} size={19} color={locked ? 'rgba(255,215,0,0.45)' : accent} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[sc.title, { color: titleColor }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{title}</Text>
          {lines.map((l, i) => <Text key={i} style={sc.line}>{l}</Text>)}
        </View>
        {locked && (
          <View style={sc.soonBadge}>
            <Ionicons name="lock-closed" size={9} color="rgba(255,215,0,0.4)" />
            <Text style={sc.soonText}>SOON</Text>
          </View>
        )}
      </View>

      {/* Divider + options/locked row — only when there's content below */}
      {(options.length > 0 || locked) && (
        <>
          <View style={sc.divider} />
          {locked ? (
            <View style={sc.lockedRow}>
              <View style={{ flex: 1 }}>
                <Text style={sc.lockedTitle}>{lockedLabel ?? 'COMING SOON'}</Text>
                <Text style={sc.lockedSub}>{lockedSub ?? 'Arriving in a future update.'}</Text>
              </View>
            </View>
          ) : (
            <View style={sc.optList}>
              {options.map(o => <OptionRow key={o.label} opt={o} accent={accent} />)}
            </View>
          )}
        </>
      )}
    </View>
  );

  return (
    <View style={sc.wrap}>
      {section ? <Text style={sc.sectionLabel}>{section}</Text> : null}
      {isActive
        ? <TouchableOpacity onPress={onPress} activeOpacity={0.82}>{cardContent}</TouchableOpacity>
        : cardContent
      }
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
  card:       { borderRadius: 18, borderWidth: 1, overflow: 'hidden', padding: 16, gap: 14 },
  cardLocked: { opacity: 0.52 },
  topBar:     { position: 'absolute', top: 0, left: 0, right: 0, height: 2 },
  header:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconWrap:   { width: 40, height: 40, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title:      { fontSize: 13, fontWeight: '900', fontFamily: 'Orbitron_900Black', letterSpacing: 0, flexShrink: 1 },
  line:       { fontSize: 10, color: 'rgba(255,255,255,0.38)', marginTop: 2 },
  divider:    { height: 1, backgroundColor: 'rgba(255,255,255,0.07)' },
  optList:    { gap: 8 },
  actionBadge:{ width: 34, height: 34, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  soonBadge:  { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 7, backgroundColor: 'rgba(255,215,0,0.06)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.15)', flexShrink: 0 },
  soonText:   { fontSize: 7, fontWeight: '800', fontFamily: 'Orbitron_700Bold', color: 'rgba(255,215,0,0.4)', letterSpacing: 0.5 },
  lockedRow:  { paddingVertical: 4 },
  lockedTitle:{ fontSize: 11, fontWeight: '900', fontFamily: 'Orbitron_700Bold', color: 'rgba(255,215,0,0.5)', letterSpacing: 1.5 },
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
          lines={[
            "Player vs Dealer",
            "Dealer qualifies with Queen High or Better",
            "Win chips against the house",
          ]}
          options={[]}
          onPress={() => router.push('/casino/three-card-poker' as any)}
        />
        {/* ── MORE GAMES compact banner ───────────────────────────── */}
        <View style={mb.banner}>
          <View style={mb.left}>
            <Ionicons name="lock-closed" size={11} color="rgba(255,215,0,0.4)" />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={mb.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>MORE CASINO GAMES COMING SOON</Text>
              <Text style={mb.sub}>Additional casino experiences planned for future updates.</Text>
            </View>
          </View>
          <View style={mb.badge}>
            <Text style={mb.badgeText}>SOON</Text>
          </View>
        </View>

        {/* ── TOURNAMENTS ─────────────────────────────────────────────── */}
        <SectionCard
          section="TOURNAMENTS"
          accent="#ffd700"
          icon="trophy-outline"
          title="TOURNAMENTS"
          lines={["Tournament play will be available in a future update."]}
          options={[]}
          locked
          lockedLabel="TOURNAMENTS COMING SOON"
          lockedSub="Multi-table tournaments, prize pools, and brackets are on the way."
        />
      </ScrollView>
    </View>
  );
}

// ─── More Games compact banner styles ─────────────────────────────────────────
const mb = StyleSheet.create({
  banner:    {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.12)', backgroundColor: 'rgba(255,215,0,0.03)',
    marginBottom: 6, opacity: 0.55,
  },
  left:      { flexDirection: 'row', alignItems: 'center', gap: 9, flex: 1 },
  title:     { fontSize: 9, fontWeight: '800', fontFamily: 'Orbitron_700Bold', letterSpacing: 0, color: 'rgba(255,215,0,0.65)' },
  sub:       { fontSize: 8, color: 'rgba(255,255,255,0.3)', marginTop: 1 },
  badge:     { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, backgroundColor: 'rgba(255,215,0,0.07)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.15)' },
  badgeText: { fontSize: 7, fontWeight: '800', fontFamily: 'Orbitron_700Bold', letterSpacing: 1, color: 'rgba(255,215,0,0.4)' },
});

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
