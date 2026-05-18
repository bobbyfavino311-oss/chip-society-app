import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Alert,
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

type Tab = 'sitgo' | 'scheduled';

interface SNG {
  id: string;
  name: string;
  buyIn: number;
  players: number;
  maxPlayers: number;
  prize: number;
  color: string;
  speed: string;
}

interface Scheduled {
  id: string;
  name: string;
  buyIn: number;
  prize: number;
  startMs: number;
  registered: number;
  maxPlayers: number;
  color: string;
}

const SNGS: SNG[] = [
  { id: 'speed', name: 'SPEED SIT & GO', buyIn: 5_000, players: 4, maxPlayers: 6, prize: 30_000, color: '#00d4ff', speed: 'Turbo' },
  { id: 'classic', name: 'CLASSIC SIT & GO', buyIn: 25_000, players: 2, maxPlayers: 6, prize: 150_000, color: '#ffd700', speed: 'Classic' },
  { id: 'elite', name: 'ELITE SIT & GO', buyIn: 100_000, players: 1, maxPlayers: 6, prize: 600_000, color: '#ff0090', speed: 'Deep' },
];

function makeScheduled(): Scheduled[] {
  const now = Date.now();
  return [
    { id: 's1', name: 'NEON MIDNIGHT OPEN', buyIn: 50_000, prize: 500_000, startMs: now + 7_200_000, registered: 48, maxPlayers: 64, color: '#bf5fff' },
    { id: 's2', name: 'CYBER SUNDAY CLASSIC', buyIn: 10_000, prize: 1_000_000, startMs: now + 16_200_000, registered: 120, maxPlayers: 256, color: '#00d4ff' },
    { id: 's3', name: 'CHROME CITY SERIES', buyIn: 250_000, prize: 5_000_000, startMs: now + 86_400_000, registered: 22, maxPlayers: 128, color: '#ffd700' },
  ];
}

function formatChips(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return 'STARTING';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function FilledBar({ filled, total, color }: { filled: number; total: number; color: string }) {
  const pct = Math.min((filled / total) * 100, 100);
  return (
    <View style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden', flex: 1 }}>
      <View style={{ width: `${pct}%` as any, height: '100%', backgroundColor: color, borderRadius: 2 }} />
    </View>
  );
}

export default function TournamentScreen() {
  const insets = useSafeAreaInsets();
  const { profile, removeChips } = useUser();
  const [activeTab, setActiveTab] = useState<Tab>('sitgo');
  const [now, setNow] = useState(Date.now());
  const [registered, setRegistered] = useState<Set<string>>(new Set());
  const [launching, setLaunching] = useState(false);

  const scheduled = useMemo(makeScheduled, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(t);
  }, []);

  const handleSNG = (sng: SNG) => {
    if (profile.chips < sng.buyIn) {
      Alert.alert('Insufficient Chips', `You need ${formatChips(sng.buyIn)} chips to enter.`);
      return;
    }
    Alert.alert(
      `${sng.name}`,
      `Buy-in: ${formatChips(sng.buyIn)} chips\nPrize pool: ${formatChips(sng.prize)} chips\n\nJoin and start playing?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'JOIN', onPress: () => {
            removeChips(sng.buyIn);
            setLaunching(true);
            setTimeout(() => { setLaunching(false); router.replace('/game/practice'); }, 1600);
          }
        },
      ]
    );
  };

  const handleScheduled = (t: Scheduled) => {
    if (profile.chips < t.buyIn) {
      Alert.alert('Insufficient Chips', `You need ${formatChips(t.buyIn)} chips to register.`);
      return;
    }
    if (registered.has(t.id)) {
      Alert.alert('Already Registered', `You're already registered for ${t.name}.`);
      return;
    }
    Alert.alert(
      `Register for ${t.name}?`,
      `Buy-in: ${formatChips(t.buyIn)} chips\nPrize pool: ${formatChips(t.prize)}\nStarts in: ${formatCountdown(t.startMs - now)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'REGISTER', onPress: () => {
            removeChips(t.buyIn);
            setRegistered(prev => new Set([...prev, t.id]));
            Alert.alert('Registered!', `You're registered for ${t.name}. The tournament will begin ${formatCountdown(t.startMs - now)}.`);
          }
        },
      ]
    );
  };

  return (
    <View style={st.container}>
      <LinearGradient colors={['#100018', '#050010', '#000818']} style={StyleSheet.absoluteFill} />
      <View style={st.glowPurple} />

      {/* Header */}
      <View style={[st.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 20 : 16) }]}>
        <TouchableOpacity onPress={() => router.back()} style={st.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color="#bf5fff" />
        </TouchableOpacity>
        <Text style={st.title}>TOURNAMENTS</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={st.tabs}>
        {(['sitgo', 'scheduled'] as Tab[]).map(t => (
          <TouchableOpacity key={t} style={[st.tab, activeTab === t && st.tabActive]} onPress={() => setActiveTab(t)} activeOpacity={0.8}>
            {activeTab === t && <LinearGradient colors={['rgba(191,95,255,0.2)', 'transparent']} style={StyleSheet.absoluteFill} />}
            <Text style={[st.tabText, activeTab === t && st.tabTextActive]}>
              {t === 'sitgo' ? 'SIT & GO' : 'SCHEDULED'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {launching && (
        <View style={st.launchOverlay}>
          <LinearGradient colors={['rgba(191,95,255,0.95)', 'rgba(5,0,16,0.98)']} style={StyleSheet.absoluteFill} />
          <Text style={st.launchEmoji}>🏆</Text>
          <Text style={st.launchTitle}>TOURNAMENT STARTING</Text>
          <Text style={st.launchSub}>Loading your table…</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={[st.scroll, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
        {activeTab === 'sitgo' && (
          <>
            <Text style={st.sectionSub}>Fill a table, then play for the prize pool. Starts when full.</Text>
            {SNGS.map(sng => {
              const canAfford = profile.chips >= sng.buyIn;
              return (
                <TouchableOpacity
                  key={sng.id}
                  style={[st.sngCard, { borderColor: `${sng.color}44`, opacity: canAfford ? 1 : 0.6 }]}
                  onPress={() => handleSNG(sng)}
                  activeOpacity={0.8}
                >
                  <LinearGradient colors={[`${sng.color}14`, 'transparent']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                  <View style={st.sngTop}>
                    <View style={[st.speedBadge, { backgroundColor: `${sng.color}22`, borderColor: `${sng.color}55` }]}>
                      <Text style={[st.speedText, { color: sng.color }]}>{sng.speed}</Text>
                    </View>
                    <Text style={[st.sngName, { color: sng.color }]}>{sng.name}</Text>
                    {!canAfford && <Ionicons name="lock-closed" size={14} color={colors.textDim} />}
                  </View>
                  <View style={st.sngRow}>
                    <View style={st.sngStat}>
                      <Text style={st.sngStatLabel}>BUY-IN</Text>
                      <Text style={[st.sngStatVal, { color: sng.color }]}>{formatChips(sng.buyIn)}</Text>
                    </View>
                    <View style={st.sngStat}>
                      <Text style={st.sngStatLabel}>PRIZE POOL</Text>
                      <Text style={[st.sngStatVal, { color: '#ffd700' }]}>{formatChips(sng.prize)}</Text>
                    </View>
                    <View style={st.sngStat}>
                      <Text style={st.sngStatLabel}>PLAYERS</Text>
                      <Text style={st.sngStatVal}>{sng.players}/{sng.maxPlayers}</Text>
                    </View>
                  </View>
                  <View style={st.sngBottom}>
                    <FilledBar filled={sng.players} total={sng.maxPlayers} color={sng.color} />
                    <View style={[st.joinBtn, { backgroundColor: canAfford ? sng.color : colors.border }]}>
                      <Text style={[st.joinText, { color: canAfford ? '#050010' : colors.textDim }]}>JOIN</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {activeTab === 'scheduled' && (
          <>
            <Text style={st.sectionSub}>Register now. Chips deducted on registration.</Text>
            {scheduled.map(t => {
              const canAfford = profile.chips >= t.buyIn;
              const isReg = registered.has(t.id);
              const countdown = formatCountdown(t.startMs - now);
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[st.schedCard, { borderColor: isReg ? `${t.color}88` : `${t.color}44` }]}
                  onPress={() => handleScheduled(t)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={isReg ? [`${t.color}22`, `${t.color}08`] : [`${t.color}10`, 'transparent']}
                    style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  />
                  {isReg && (
                    <View style={[st.regBadge, { backgroundColor: t.color }]}>
                      <Text style={st.regBadgeText}>REGISTERED</Text>
                    </View>
                  )}
                  <Text style={[st.schedName, { color: t.color }]}>{t.name}</Text>
                  <View style={st.schedRow}>
                    <View style={st.sngStat}>
                      <Text style={st.sngStatLabel}>BUY-IN</Text>
                      <Text style={[st.sngStatVal, { color: t.color }]}>{formatChips(t.buyIn)}</Text>
                    </View>
                    <View style={st.sngStat}>
                      <Text style={st.sngStatLabel}>PRIZE POOL</Text>
                      <Text style={[st.sngStatVal, { color: '#ffd700' }]}>{formatChips(t.prize)}</Text>
                    </View>
                    <View style={st.sngStat}>
                      <Text style={st.sngStatLabel}>STARTS IN</Text>
                      <Text style={[st.sngStatVal, { color: colors.primary }]}>{countdown}</Text>
                    </View>
                  </View>
                  <View style={st.sngBottom}>
                    <FilledBar filled={t.registered} total={t.maxPlayers} color={t.color} />
                    <View style={[st.joinBtn, { backgroundColor: isReg ? colors.border : (canAfford ? t.color : colors.border) }]}>
                      <Text style={[st.joinText, { color: isReg ? colors.success : (canAfford ? '#050010' : colors.textDim) }]}>
                        {isReg ? '✓ IN' : 'ENTER'}
                      </Text>
                    </View>
                  </View>
                  <Text style={st.schedPlayers}>{t.registered}/{t.maxPlayers} registered</Text>
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050010' },
  glowPurple: { position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(191,95,255,0.07)' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: 'rgba(191,95,255,0.1)', borderWidth: 1, borderColor: 'rgba(191,95,255,0.25)' },
  title: { color: colors.text, fontSize: 18, fontWeight: '900', fontFamily: 'Orbitron_900Black', letterSpacing: 2 },
  tabs: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 4, borderRadius: 12, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', overflow: 'hidden' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#bf5fff' },
  tabText: { color: colors.textDim, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  tabTextActive: { color: '#bf5fff' },
  scroll: { paddingHorizontal: 16, paddingTop: 12, gap: 14 },
  sectionSub: { color: colors.textMuted, fontSize: 12 },
  sngCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12, overflow: 'hidden' },
  sngTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  speedBadge: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  speedText: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  sngName: { flex: 1, fontSize: 13, fontWeight: '800', fontFamily: 'Orbitron_700Bold' },
  sngRow: { flexDirection: 'row', gap: 0 },
  sngStat: { flex: 1, gap: 2 },
  sngStatLabel: { color: colors.textDim, fontSize: 9, letterSpacing: 1 },
  sngStatVal: { color: colors.text, fontSize: 14, fontWeight: '800' },
  sngBottom: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  joinBtn: { borderRadius: 6, paddingHorizontal: 14, paddingVertical: 6 },
  joinText: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  schedCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12, overflow: 'hidden', position: 'relative' },
  regBadge: { position: 'absolute', top: 0, right: 0, borderBottomLeftRadius: 10, borderTopRightRadius: 14, paddingHorizontal: 10, paddingVertical: 4 },
  regBadgeText: { color: '#050010', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  schedName: { fontSize: 14, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 0.5, paddingRight: 60 },
  schedRow: { flexDirection: 'row' },
  schedPlayers: { color: colors.textDim, fontSize: 10, marginTop: -4 },
  launchOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 99, alignItems: 'center', justifyContent: 'center', gap: 12 },
  launchEmoji: { fontSize: 64 },
  launchTitle: { color: '#fff', fontSize: 20, fontWeight: '900', fontFamily: 'Orbitron_900Black', letterSpacing: 2 },
  launchSub: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
});
