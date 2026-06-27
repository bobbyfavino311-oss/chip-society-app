/**
 * TournamentLiveCard — premium live event card
 *
 * Displays an animated pulsing LIVE dot, auto-updating countdown,
 * large emoji icon, stats, and full-width ENTER TOURNAMENT button.
 * Safe to use anywhere — does NOT import PlayerSeat or ArcTimer.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/colors';
import { TournamentConfig, getPrizePool } from '@/constants/tournaments';

const { width } = Dimensions.get('window');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatChips(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function getNextStartSecs(config: TournamentConfig): number {
  const nowMs = Date.now();
  const intervalMs = config.scheduleIntervalMin * 60 * 1000;
  const offsetMs = config.scheduleOffsetMin * 60 * 1000;
  const shifted = nowMs - offsetMs;
  const elapsed = shifted % intervalMs;
  return Math.max(0, Math.floor((intervalMs - elapsed) / 1000));
}

function formatCountdown(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─── Animated pulsing dot ─────────────────────────────────────────────────────

function PulsingDot({ color }: { color: string }) {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  return (
    <View style={dot.wrap}>
      <Animated.View style={[dot.glow, { backgroundColor: color, opacity: pulse }]} />
      <View style={[dot.core, { backgroundColor: color }]} />
    </View>
  );
}

const dot = StyleSheet.create({
  wrap:  { width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  glow:  { position: 'absolute', width: 14, height: 14, borderRadius: 7 },
  core:  { width: 7, height: 7, borderRadius: 4 },
});

// ─── Rules modal ──────────────────────────────────────────────────────────────

function RulesModal({ visible, config, onClose }: {
  visible: boolean;
  config: TournamentConfig;
  onClose: () => void;
}) {
  const prizePool = getPrizePool(config);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={rm.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={rm.sheet} activeOpacity={1}>
          <LinearGradient colors={['#1a0030', '#0d001c', '#050010']} style={StyleSheet.absoluteFill} />
          <View style={[rm.accentBar, { backgroundColor: config.color }]} />

          <View style={rm.header}>
            <Text style={rm.emoji}>{config.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[rm.title, { color: config.color }]}>{config.name}</Text>
              <Text style={rm.format}>{config.format}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={rm.closeBtn}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
            <View style={rm.section}>
              <Text style={rm.sectionTitle}>TOURNAMENT RULES</Text>
              <RuleRow icon="trophy-outline" label="Format" value={config.format} />
              <RuleRow icon="people-outline" label="Players" value={`${config.numPlayers} (AI-filled)`} />
              <RuleRow icon="wallet-outline" label="Buy-in" value={formatChips(config.buyIn) + ' chips'} />
              <RuleRow icon="layers-outline" label="Starting Stack" value={formatChips(config.startingChips) + ' chips'} />
              <RuleRow icon="flash-outline" label="Blind Levels" value={`Every ${config.handsPerLevel} hands`} />
              <RuleRow icon="card-outline" label="Variant" value={config.variant === 'texas_holdem' ? "Texas Hold'em" : "Short Deck Hold'em"} />
            </View>

            <View style={rm.section}>
              <Text style={rm.sectionTitle}>PRIZE POOL</Text>
              <View style={rm.prizeTotal}>
                <Text style={rm.prizeTotalLabel}>TOTAL</Text>
                <Text style={[rm.prizeTotalAmt, { color: colors.gold }]}>{formatChips(prizePool)}</Text>
              </View>
              <Text style={[rm.prizeLabel, { color: config.color }]}>{config.prizeLabel}</Text>
            </View>

            <View style={rm.section}>
              <Text style={rm.sectionTitle}>ELIMINATION</Text>
              <Text style={rm.ruleText}>
                Freezeout format — no rebuys or add-ons. When your stack reaches zero, you are eliminated and your finishing position is locked.{'\n\n'}
                Prizes are credited instantly to your chip balance upon tournament completion.
              </Text>
            </View>

            {config.variant === 'short_deck_holdem' && (
              <View style={rm.section}>
                <Text style={rm.sectionTitle}>SHORT DECK RULES</Text>
                <Text style={rm.ruleText}>
                  Cards 2–5 are removed, leaving a 36-card deck.{'\n'}
                  Flush beats Full House.{'\n'}
                  Three of a Kind beats Straight.{'\n'}
                  Aces play both high and low for straights (A-6-7-8-9).
                </Text>
              </View>
            )}
          </ScrollView>

          <TouchableOpacity
            style={[rm.enterBtn, { backgroundColor: config.color }]}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={rm.enterBtnText}>GOT IT</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

function RuleRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={rm.ruleRow}>
      <Ionicons name={icon as any} size={13} color={colors.textDim} />
      <Text style={rm.ruleLabel}>{label}</Text>
      <Text style={rm.ruleVal}>{value}</Text>
    </View>
  );
}

const rm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    overflow: 'hidden', padding: 20, gap: 16,
    borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  accentBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 2 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emoji: { fontSize: 32 },
  title: { fontSize: 16, fontWeight: '900', fontFamily: 'Orbitron_900Black', letterSpacing: 1 },
  format: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  closeBtn: { padding: 4 },
  section: { gap: 10, marginBottom: 4 },
  sectionTitle: {
    color: colors.textMuted, fontSize: 9, fontWeight: '700',
    letterSpacing: 2, fontFamily: 'Orbitron_400Regular',
  },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ruleLabel: { color: colors.textDim, fontSize: 12, flex: 1 },
  ruleVal: { color: colors.text, fontSize: 12, fontWeight: '700' },
  prizeTotal: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  prizeTotalLabel: { color: colors.textMuted, fontSize: 10, letterSpacing: 1 },
  prizeTotalAmt: { fontSize: 22, fontWeight: '800', fontFamily: 'Inter_700Bold' },
  prizeLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  ruleText: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  enterBtn: {
    borderRadius: 50, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  enterBtnText: {
    color: colors.background, fontSize: 13, fontWeight: '900',
    fontFamily: 'Orbitron_700Bold', letterSpacing: 2,
  },
});

// ─── Main card ────────────────────────────────────────────────────────────────

interface Props {
  config: TournamentConfig;
  userChips: number;
  cardWidth?: number;
}

export default function TournamentLiveCard({ config, userChips, cardWidth }: Props) {
  const prizePool = getPrizePool(config);
  const canAfford = userChips >= config.buyIn;
  const [secsLeft, setSecsLeft] = useState(() => getNextStartSecs(config));
  const [rulesVisible, setRulesVisible] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setSecsLeft(getNextStartSecs(config));
    }, 1000);
    return () => clearInterval(id);
  }, [config]);

  const cw = cardWidth ?? width * 0.78;

  const handleEnter = () => {
    if (!canAfford) {
      Alert.alert(
        'Not Enough Chips',
        `You need ${formatChips(config.buyIn)} chips to enter.\n\nYour balance: ${formatChips(userChips)}`,
        [{ text: 'OK' }],
      );
      return;
    }
    Alert.alert(
      `Enter ${config.name}?`,
      `Buy-in: ${formatChips(config.buyIn)} chips\nPrize Pool: ${formatChips(prizePool)} chips\n\n${config.prizeLabel}\n\nAI bots will fill the remaining seats instantly.`,
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
    <>
      <View style={[st.card, { width: cw, borderColor: `${config.color}40` }]}>
        {/* Background */}
        <LinearGradient
          colors={['#130022', '#080016', '#050010']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        />
        <LinearGradient
          colors={[`${config.color}20`, `${config.color}08`, 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.7 }}
        />
        {/* Left accent */}
        <View style={[st.accentBar, { backgroundColor: config.color }]} />

        <View style={st.inner}>
          {/* ── Top row: LIVE + countdown ── */}
          <View style={st.topRow}>
            <View style={st.liveBadge}>
              <PulsingDot color={config.color} />
              <Text style={[st.liveText, { color: config.color }]}>LIVE</Text>
            </View>
            <View style={st.countdownWrap}>
              <Text style={st.countdownLabel}>NEXT IN</Text>
              <Text style={[st.countdown, { color: config.color }]}>{formatCountdown(secsLeft)}</Text>
            </View>
          </View>

          {/* ── Emoji icon ── */}
          <View style={[st.iconCircle, { borderColor: `${config.color}35`, backgroundColor: `${config.color}12` }]}>
            <Text style={st.emoji}>{config.emoji}</Text>
          </View>

          {/* ── Name + format ── */}
          <View style={st.nameBlock}>
            <Text style={[st.name, { color: config.color }]} numberOfLines={1}>{config.name}</Text>
            <Text style={st.format}>{config.format}</Text>
          </View>

          {/* ── Stats row ── */}
          <View style={st.statsRow}>
            <View style={st.stat}>
              <Text style={st.statLbl}>BUY-IN</Text>
              <Text style={[st.statVal, { color: canAfford ? config.color : colors.error }]}>
                {formatChips(config.buyIn)}
              </Text>
            </View>
            <View style={st.statDivider} />
            <View style={st.stat}>
              <Text style={st.statLbl}>SEATS</Text>
              <Text style={st.statVal}>{config.numPlayers}</Text>
            </View>
            <View style={st.statDivider} />
            <View style={st.stat}>
              <Text style={st.statLbl}>PRIZE POOL</Text>
              <Text style={[st.statVal, { color: colors.gold }]}>{formatChips(prizePool)}</Text>
            </View>
          </View>

          {/* ── Prize distribution ── */}
          <Text style={[st.prizeLabel, { color: `${config.color}99` }]}>{config.prizeLabel}</Text>

          {/* ── Action buttons ── */}
          <View style={st.actions}>
            <TouchableOpacity
              style={st.infoBtn}
              onPress={() => setRulesVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[st.enterBtn, !canAfford && st.enterBtnDisabled]}
              onPress={handleEnter}
              activeOpacity={0.85}
            >
              {canAfford && (
                <LinearGradient
                  colors={[config.color, `${config.color}cc`]}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                />
              )}
              <Ionicons
                name={canAfford ? 'trophy' : 'lock-closed'}
                size={13}
                color={canAfford ? colors.background : colors.textDim}
              />
              <Text style={[st.enterBtnText, !canAfford && st.enterBtnTextDisabled]}>
                {canAfford ? 'ENTER TOURNAMENT' : 'NEED MORE CHIPS'}
              </Text>
              {canAfford && (
                <Ionicons name="chevron-forward" size={13} color={colors.background} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <RulesModal
        visible={rulesVisible}
        config={config}
        onClose={() => setRulesVisible(false)}
      />
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  accentBar: { width: 4 },
  inner: { flex: 1, padding: 16, gap: 12 },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  liveText: {
    fontSize: 10, fontWeight: '900',
    fontFamily: 'Orbitron_700Bold', letterSpacing: 1.5,
  },
  countdownWrap: { alignItems: 'flex-end' },
  countdownLabel: {
    color: colors.textDim, fontSize: 7,
    fontWeight: '700', letterSpacing: 1.5,
  },
  countdown: {
    fontSize: 18, fontWeight: '800',
    fontFamily: 'Inter_700Bold', letterSpacing: 0.5,
  },

  iconCircle: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 1, alignSelf: 'center',
    alignItems: 'center', justifyContent: 'center',
  },
  emoji: { fontSize: 36 },

  nameBlock: { alignItems: 'center', gap: 4 },
  name: {
    fontSize: 17, fontWeight: '900',
    fontFamily: 'Orbitron_900Black', letterSpacing: 1.5,
    textAlign: 'center',
  },
  format: {
    color: colors.textMuted, fontSize: 11, textAlign: 'center',
  },

  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12, padding: 12,
  },
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.08)' },
  statLbl: {
    color: colors.textDim, fontSize: 7,
    fontWeight: '700', letterSpacing: 1.2,
  },
  statVal: {
    color: colors.text, fontSize: 15,
    fontWeight: '800', fontFamily: 'Inter_700Bold',
  },

  prizeLabel: {
    fontSize: 10, textAlign: 'center', letterSpacing: 0.5,
  },

  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoBtn: {
    width: 40, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  enterBtn: {
    flex: 1, height: 44, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 7, overflow: 'hidden',
  },
  enterBtnDisabled: {
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  enterBtnText: {
    color: colors.background, fontSize: 11,
    fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 1.2,
  },
  enterBtnTextDisabled: { color: colors.textDim },
});
