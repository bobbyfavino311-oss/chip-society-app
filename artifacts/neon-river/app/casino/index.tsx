import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import {
  Platform, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCasino, DAILY_WIN_CAP } from '@/context/CasinoContext';
import colors from '@/constants/colors';

// ─── Locked game card ─────────────────────────────────────────────────────────
function LockedGame({ icon, name }: { icon: string; name: string }) {
  return (
    <View style={s.lockedGame}>
      <LinearGradient colors={['rgba(255,215,0,0.05)', 'transparent']} style={StyleSheet.absoluteFill} />
      <Ionicons name={icon as any} size={20} color="rgba(255,215,0,0.3)" />
      <Text style={s.lockedName}>{name}</Text>
      <View style={s.lockedBadge}>
        <Ionicons name="lock-closed-outline" size={8} color="rgba(255,215,0,0.3)" />
        <Text style={s.lockedBadgeText}>SOON</Text>
      </View>
    </View>
  );
}

const LOCKED_GAMES = [
  { icon: 'heart-outline',      name: 'BLACKJACK'    },
  { icon: 'radio-button-on',    name: 'ROULETTE'     },
  { icon: 'briefcase-outline',  name: 'BACCARAT'     },
  { icon: 'tv-outline',         name: 'VIDEO POKER'  },
  { icon: 'star-outline',       name: 'SLOTS'        },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CasinoLobbyScreen() {
  const insets   = useSafeAreaInsets();
  const { dailyWins, dailyWinCap, capReached } = useCasino();
  const pct = Math.min(1, dailyWins / dailyWinCap);

  function fmt(n: number) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
    return String(n);
  }

  return (
    <View style={s.container}>
      <LinearGradient
        colors={['#0c0800', '#050010', '#0c0800']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />

      {/* Ambient gold glow */}
      <View style={s.glowTop} pointerEvents="none" />

      <ScrollView
        contentContainerStyle={[s.scroll, {
          paddingTop:    insets.top + (Platform.OS === 'web' ? 20 : 16),
          paddingBottom: insets.bottom + 40,
        }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={colors.primary} />
            <Text style={s.backText}>BACK</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.title}>CASINO</Text>
        <Text style={s.sub}>Win chips against the house</Text>

        {/* Daily earnings */}
        <View style={s.capCard}>
          <LinearGradient colors={['rgba(255,215,0,0.12)', 'rgba(255,215,0,0.04)']} style={StyleSheet.absoluteFill} />
          <View style={s.capRow}>
            <Text style={s.capLabel}>TODAY'S CASINO WINS</Text>
            {capReached && (
              <View style={s.capBadge}>
                <Text style={s.capBadgeText}>CAP REACHED</Text>
              </View>
            )}
          </View>
          <Text style={s.capAmount}>{fmt(dailyWins)} / {fmt(dailyWinCap)}</Text>
          <View style={s.capBarBg}>
            <View style={[s.capBarFill, { width: `${Math.round(pct * 100)}%` as any }]} />
          </View>
          {capReached && (
            <Text style={s.capNote}>Daily chip limit reached · Wins now award XP until tomorrow</Text>
          )}
        </View>

        {/* Three Card Poker — active */}
        <Text style={s.sectionLabel}>AVAILABLE NOW</Text>
        <TouchableOpacity
          style={s.activeGame}
          onPress={() => router.push('/casino/three-card-poker' as any)}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['rgba(255,215,0,0.22)', 'rgba(180,120,0,0.1)', 'transparent']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          />
          {/* Gold neon top border */}
          <View style={s.activeTopBorder} />

          <View style={s.activeLeft}>
            <View style={s.activeIconWrap}>
              <Ionicons name="albums-outline" size={28} color="#ffd700" />
            </View>
            <View>
              <Text style={s.activeName}>THREE CARD POKER</Text>
              <Text style={s.activeSub}>Player vs Dealer · Classic casino rules</Text>
              <View style={s.activeDetails}>
                <Text style={s.activePill}>ANTE</Text>
                <Text style={s.activePill}>PAIR PLUS</Text>
                <Text style={s.activePill}>ANTE BONUS</Text>
              </View>
            </View>
          </View>
          <View style={s.activePlay}>
            <LinearGradient colors={['#ffd700', '#c89b00']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
            <Text style={s.activePlayText}>PLAY</Text>
            <Ionicons name="chevron-forward" size={14} color="#000" />
          </View>
        </TouchableOpacity>

        {/* Locked games */}
        <Text style={s.sectionLabel}>COMING SOON</Text>
        <View style={s.lockedGrid}>
          {LOCKED_GAMES.map(g => <LockedGame key={g.name} {...g} />)}
        </View>

        {/* Footer note */}
        <Text style={s.footer}>
          Virtual chips only · No real-money gambling · Daily win cap: {fmt(DAILY_WIN_CAP)} chips
        </Text>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#050010' },
  scroll:     { paddingHorizontal: 16, gap: 12 },
  glowTop:    {
    position: 'absolute', top: -60, left: '50%', width: 300, height: 300,
    marginLeft: -150, borderRadius: 150,
    backgroundColor: 'rgba(255,200,0,0.08)',
  },

  header:   { flexDirection: 'row', alignItems: 'center' },
  backBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4 },
  backText: { color: colors.primary, fontSize: 13, fontFamily: 'Orbitron_400Regular', letterSpacing: 1 },

  title:  { fontSize: 32, fontWeight: '900', fontFamily: 'Orbitron_900Black', color: '#ffd700', letterSpacing: 4 },
  sub:    { fontSize: 13, color: 'rgba(255,215,0,0.55)', marginTop: -6, marginBottom: 4 },

  // Daily cap card
  capCard:    { borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,215,0,0.22)', overflow: 'hidden', padding: 14, gap: 8 },
  capRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  capLabel:   { fontSize: 9, fontWeight: '700', fontFamily: 'Orbitron_700Bold', letterSpacing: 2, color: 'rgba(255,215,0,0.65)' },
  capBadge:   { backgroundColor: 'rgba(255,80,80,0.2)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  capBadgeText: { fontSize: 8, fontWeight: '900', color: '#ff6060', fontFamily: 'Orbitron_700Bold' },
  capAmount:  { fontSize: 20, fontWeight: '900', fontFamily: 'Orbitron_900Black', color: '#ffd700' },
  capBarBg:   { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,215,0,0.15)', overflow: 'hidden' },
  capBarFill: { height: '100%', borderRadius: 2, backgroundColor: '#ffd700' },
  capNote:    { fontSize: 10, color: 'rgba(255,100,100,0.7)', fontStyle: 'italic' },

  sectionLabel: {
    fontSize: 9, fontWeight: '700', fontFamily: 'Orbitron_700Bold',
    letterSpacing: 2.5, color: 'rgba(255,255,255,0.35)', marginTop: 6,
  },

  // Active game card
  activeGame: {
    borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,215,0,0.35)',
    overflow: 'hidden', padding: 16, flexDirection: 'row',
    alignItems: 'center', gap: 12,
  },
  activeTopBorder: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 2,
    backgroundColor: '#ffd700',
  },
  activeLeft:   { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  activeIconWrap: {
    width: 52, height: 52, borderRadius: 14, backgroundColor: 'rgba(255,215,0,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  activeName:   { fontSize: 14, fontWeight: '900', fontFamily: 'Orbitron_700Bold', color: '#ffd700' },
  activeSub:    { fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  activeDetails:{ flexDirection: 'row', gap: 4, marginTop: 6, flexWrap: 'wrap' },
  activePill:   {
    fontSize: 8, fontWeight: '800', fontFamily: 'Orbitron_400Regular', letterSpacing: 0.5,
    color: 'rgba(255,215,0,0.7)', backgroundColor: 'rgba(255,215,0,0.1)',
    borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2,
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.2)',
  },
  activePlay:   {
    width: 64, height: 64, borderRadius: 14, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  activePlayText: { fontSize: 9, fontWeight: '900', fontFamily: 'Orbitron_700Bold', color: '#000' },

  // Locked grid
  lockedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  lockedGame: {
    width: '31%', borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.1)', overflow: 'hidden',
    padding: 12, alignItems: 'center', gap: 6, opacity: 0.6,
  },
  lockedName: { fontSize: 8, fontWeight: '900', fontFamily: 'Orbitron_700Bold', color: 'rgba(255,215,0,0.4)', textAlign: 'center', letterSpacing: 0.5 },
  lockedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  lockedBadgeText: { fontSize: 7, fontWeight: '800', fontFamily: 'Orbitron_400Regular', color: 'rgba(255,215,0,0.3)', letterSpacing: 1 },

  footer: { fontSize: 10, color: 'rgba(255,255,255,0.2)', textAlign: 'center', paddingVertical: 8 },
});
