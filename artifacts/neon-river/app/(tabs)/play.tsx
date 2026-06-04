import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useUser } from '@/context/UserContext';
import { GuestBanner } from '@/components/GuestBanner';
import type { Colors } from '@/constants/colors';

// ─── Types ────────────────────────────────────────────────────────────────────
type Variant = 'texas_holdem' | 'short_deck_holdem';
type SubMode = {
  id: string;
  variant?: Variant;
  players?: number;
  label: string;
  sub: string;
  icon: string;
  color: string;
  locked?: boolean;
  lockLabel?: string;
};

// ─── Mode data ────────────────────────────────────────────────────────────────
const QUICK_PLAY_MODES: SubMode[] = [
  { id: 'he4', variant: 'texas_holdem',      players: 4, label: "HOLD'EM",    sub: '4 Players',  icon: 'card',     color: '#00d4ff' },
  { id: 'he5', variant: 'texas_holdem',      players: 5, label: "HOLD'EM",    sub: '5 Players',  icon: 'card',     color: '#00d4ff' },
  { id: 'sd4', variant: 'short_deck_holdem', players: 4, label: 'SHORT DECK', sub: '4 Players',  icon: 'layers',   color: '#bf5fff' },
  { id: 'sd5', variant: 'short_deck_holdem', players: 5, label: 'SHORT DECK', sub: '5 Players',  icon: 'layers',   color: '#bf5fff' },
];

const RANKED_MODES: SubMode[] = [
  { id: 'rhe', label: "RANKED HOLD'EM",    sub: 'Competitive matchmaking', icon: 'podium',    color: '#ff0090', locked: true, lockLabel: 'SOON' },
  { id: 'rsd', label: 'RANKED SHORT DECK', sub: 'Competitive matchmaking', icon: 'podium',    color: '#ff0090', locked: true, lockLabel: 'SOON' },
];

// ─── Styles ───────────────────────────────────────────────────────────────────
function createStyles(c: Colors) {
  return StyleSheet.create({
    container:   { flex: 1, backgroundColor: c.background },
    scroll:      { paddingHorizontal: 16, gap: 12, paddingBottom: 16 },
    pageTitle: {
      color: c.text, fontSize: 22, fontWeight: '800',
      fontFamily: 'Orbitron_900Black', letterSpacing: 3,
    },
    pageSub:   { color: c.textMuted, fontSize: 13, marginTop: -6 },

    sectionLabel: {
      color: c.textMuted, fontSize: 9, fontWeight: '700',
      letterSpacing: 2.5, fontFamily: 'Orbitron_400Regular',
      marginTop: 4,
    },

    // 2-column grid for Quick Play
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    gridCard: {
      width: '47.5%', borderRadius: 16, borderWidth: 1,
      overflow: 'hidden', padding: 14, gap: 6,
    },
    gridIcon: {
      width: 36, height: 36, borderRadius: 10, borderWidth: 1,
      alignItems: 'center', justifyContent: 'center', marginBottom: 2,
    },
    gridTitle: { fontSize: 11, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 1 },
    gridSub:   { fontSize: 10 },
    gridCta: {
      marginTop: 4, flexDirection: 'row', alignItems: 'center',
      gap: 5, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10,
      overflow: 'hidden',
    },
    gridCtaText: { fontSize: 9, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 0.8 },

    // Full-width cards for Ranked / Casino / Tournaments
    modeRow: { flexDirection: 'row', gap: 10 },
    modeCard: {
      flex: 1, borderRadius: 14, borderWidth: 1,
      overflow: 'hidden', padding: 13, gap: 4,
      alignItems: 'flex-start',
    },
    modeLabel: { fontSize: 10, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 0.8 },
    modeSub:   { fontSize: 9 },
    modeLock: {
      marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 4,
      borderRadius: 6, paddingVertical: 5, paddingHorizontal: 8,
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
      backgroundColor: 'rgba(255,255,255,0.02)',
    },
    modeLockText: { fontSize: 8, fontWeight: '800', fontFamily: 'Orbitron_700Bold', letterSpacing: 1, color: 'rgba(255,255,255,0.25)' },

    // Tournaments locked banner
    tourneyBanner: {
      borderRadius: 16, borderWidth: 1, overflow: 'hidden',
      padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14,
    },
    tourneyIconWrap: {
      width: 44, height: 44, borderRadius: 12, borderWidth: 1,
      alignItems: 'center', justifyContent: 'center',
    },
    tourneyLabel: { fontSize: 14, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 1.5 },
    tourneySub:   { fontSize: 11, marginTop: 1 },
    tourneyLock: {
      marginTop: 8, alignSelf: 'flex-start', flexDirection: 'row',
      alignItems: 'center', gap: 6, borderRadius: 8,
      paddingVertical: 7, paddingHorizontal: 12,
      borderWidth: 1, borderColor: 'rgba(255,215,0,0.15)',
      backgroundColor: 'rgba(255,215,0,0.05)',
    },
    tourneyLockText: { fontSize: 9, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 1.5, color: 'rgba(255,215,0,0.45)' },

    // Casino active banner
    casinoBanner: {
      borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,215,0,0.35)',
      overflow: 'hidden', padding: 16, flexDirection: 'row',
      alignItems: 'center', gap: 12,
    },
    casinoTopBorder: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: '#ffd700' },
    casinoLeft:     { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
    casinoIconWrap: {
      width: 48, height: 48, borderRadius: 13, backgroundColor: 'rgba(255,215,0,0.12)',
      borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)',
      alignItems: 'center', justifyContent: 'center',
    },
    casinoTitle:   { fontSize: 15, fontWeight: '900', fontFamily: 'Orbitron_700Bold', color: '#ffd700' },
    casinoSub:     { fontSize: 10, color: 'rgba(255,215,0,0.55)', marginTop: 2 },
    casinoHint:    { fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 3 },
    casinoCta: {
      width: 60, height: 60, borderRadius: 13, overflow: 'hidden',
      alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 2,
    },
    casinoCtaText: { fontSize: 9, fontWeight: '900', fontFamily: 'Orbitron_700Bold', color: '#000' },
  });
}

// ─── Quick Play grid card ─────────────────────────────────────────────────────
function QuickPlayCard({ mode, styles }: { mode: SubMode; styles: ReturnType<typeof createStyles> }) {
  const { color, icon, label, sub, variant, players } = mode;
  const onPress = () => router.push(`/game/practice?variant=${variant}&players=${players}` as any);

  return (
    <TouchableOpacity
      style={[styles.gridCard, { borderColor: `${color}44`, backgroundColor: `${color}09` }]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      <LinearGradient colors={[`${color}18`, 'transparent']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <View style={[styles.gridIcon, { backgroundColor: `${color}1a`, borderColor: `${color}40` }]}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <Text style={[styles.gridTitle, { color }]}>{label}</Text>
      <Text style={[styles.gridSub, { color: `${color}99` }]}>{sub}</Text>
      <View style={styles.gridCta}>
        <LinearGradient colors={[color, `${color}cc`]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
        <Ionicons name="flash" size={11} color="#000" />
        <Text style={[styles.gridCtaText, { color: '#000' }]}>PLAY</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Locked mode card (Ranked / Casino) ──────────────────────────────────────
function LockedModeCard({ mode, styles }: { mode: SubMode; styles: ReturnType<typeof createStyles> }) {
  const { color, icon, label, sub, lockLabel } = mode;
  return (
    <View style={[styles.modeCard, { borderColor: `${color}20`, backgroundColor: `${color}06`, opacity: 0.7 }]}>
      <LinearGradient colors={[`${color}10`, 'transparent']} style={StyleSheet.absoluteFill} />
      <Ionicons name={icon as any} size={18} color={`${color}80`} />
      <Text style={[styles.modeLabel, { color: `${color}99` }]}>{label}</Text>
      <Text style={[styles.modeSub, { color: 'rgba(255,255,255,0.3)' }]}>{sub}</Text>
      <View style={styles.modeLock}>
        <Ionicons name="lock-closed-outline" size={9} color="rgba(255,255,255,0.2)" />
        <Text style={styles.modeLockText}>{lockLabel ?? 'SOON'}</Text>
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function PlayScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useUser();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background, '#0a001e', colors.background]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />

      {profile.isGuest && (
        <GuestBanner message="Create a free account to save your progress and stats" />
      )}

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 16), paddingBottom: insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>PLAY</Text>
        <Text style={styles.pageSub}>Choose your game mode</Text>

        {/* ── QUICK PLAY ─────────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>QUICK PLAY</Text>
        <View style={styles.grid}>
          {QUICK_PLAY_MODES.map(mode => (
            <QuickPlayCard key={mode.id} mode={mode} styles={styles} />
          ))}
        </View>

        {/* ── RANKED ─────────────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>RANKED</Text>
        <View style={styles.modeRow}>
          {RANKED_MODES.map(mode => (
            <LockedModeCard key={mode.id} mode={mode} styles={styles} />
          ))}
        </View>

        {/* ── CASINO ─────────────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>CASINO</Text>
        <TouchableOpacity
          style={styles.casinoBanner}
          onPress={() => router.push('/casino' as any)}
          activeOpacity={0.85}
        >
          <LinearGradient colors={['rgba(255,215,0,0.18)', 'rgba(140,90,0,0.08)', 'transparent']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          <View style={styles.casinoTopBorder} />
          <View style={styles.casinoLeft}>
            <View style={styles.casinoIconWrap}>
              <Ionicons name="diamond-outline" size={24} color="#ffd700" />
            </View>
            <View>
              <Text style={styles.casinoTitle}>CASINO</Text>
              <Text style={styles.casinoSub}>Win chips against the house</Text>
              <Text style={styles.casinoHint}>Three Card Poker · More games coming</Text>
            </View>
          </View>
          <View style={styles.casinoCta}>
            <LinearGradient colors={['#ffd700', '#c89b00']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
            <Text style={styles.casinoCtaText}>ENTER</Text>
            <Ionicons name="chevron-forward" size={14} color="#000" />
          </View>
        </TouchableOpacity>

        {/* ── TOURNAMENTS ────────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>TOURNAMENTS</Text>
        <View style={[styles.tourneyBanner, { borderColor: 'rgba(255,215,0,0.2)', backgroundColor: 'rgba(255,215,0,0.04)' }]}>
          <LinearGradient colors={['rgba(255,215,0,0.12)', 'transparent']} style={StyleSheet.absoluteFill} />
          <View style={[styles.tourneyIconWrap, { backgroundColor: 'rgba(255,215,0,0.1)', borderColor: 'rgba(255,215,0,0.25)' }]}>
            <Ionicons name="trophy-outline" size={22} color="rgba(255,215,0,0.6)" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.tourneyLabel, { color: 'rgba(255,215,0,0.7)' }]}>TOURNAMENTS</Text>
            <Text style={[styles.tourneySub, { color: 'rgba(255,255,255,0.35)' }]}>Multi-table · Prize pools · Brackets</Text>
            <View style={styles.tourneyLock}>
              <Ionicons name="lock-closed-outline" size={10} color="rgba(255,215,0,0.4)" />
              <Text style={styles.tourneyLockText}>COMPETITIVE SERIES — COMING SOON</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
