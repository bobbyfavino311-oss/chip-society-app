/**
 * TournamentLiveCard v2 — premium live event card
 *
 * Clean poster layout: LIVE dot · icon · name · stats · ENTER.
 * No countdown (placeholder-free). No emoji art — uses Ionicons.
 * Safe to use anywhere — does NOT import PlayerSeat or ArcTimer.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatChips(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.floor(n / 1_000)}K`;
  return String(n);
}

function getPaysTop(config: TournamentConfig): string {
  return config.prizeLabel.includes('3rd') ? 'PAYS TOP 3' : 'PAYS TOP 2';
}

// ─── Animated pulsing dot ─────────────────────────────────────────────────────

function PulsingDot({ color }: { color: string }) {
  const pulse = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 950, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.35, duration: 950, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
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
  wrap:  { width: 14, height: 14, alignItems: 'center', justifyContent: 'center' },
  glow:  { position: 'absolute', width: 13, height: 13, borderRadius: 7 },
  core:  { width: 6, height: 6, borderRadius: 3 },
});

// ─── Rules modal ──────────────────────────────────────────────────────────────

function RulesModal({ visible, config, onClose }: {
  visible: boolean;
  config: TournamentConfig;
  onClose: () => void;
}) {
  const prizePool = getPrizePool(config);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={rm.overlay}>
        <TouchableOpacity style={rm.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={rm.sheet}>
          <LinearGradient colors={['#1a0030', '#0d001c', '#050010']} style={StyleSheet.absoluteFill} />
          <View style={[rm.topBar, { backgroundColor: config.color }]} />

          {/* Header */}
          <View style={rm.header}>
            <View style={[rm.headerIcon, { borderColor: `${config.color}50`, backgroundColor: `${config.color}15` }]}>
              <Ionicons name={config.icon as any} size={22} color={config.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[rm.title, { color: config.color }]}>{config.name}</Text>
              <Text style={rm.format}>{config.format}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={rm.closeBtn}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 440 }} contentContainerStyle={{ gap: 16 }}>
            {/* Prize pool */}
            <View style={rm.section}>
              <Text style={rm.sectionLabel}>PRIZE POOL</Text>
              <View style={rm.prizeRow}>
                <Text style={[rm.prizeTotal, { color: colors.gold }]}>{formatChips(prizePool)}</Text>
                <View style={rm.prizeBreakdown}>
                  {config.prizeLabel.split('  ·  ').map((p, i) => (
                    <Text key={i} style={[rm.prizeItem, { color: config.color }]}>{p.trim()}</Text>
                  ))}
                </View>
              </View>
            </View>

            {/* Structure */}
            <View style={rm.section}>
              <Text style={rm.sectionLabel}>TOURNAMENT STRUCTURE</Text>
              <RuleRow icon="wallet-outline"        label="Buy-in"          value={`${formatChips(config.buyIn)} chips`} />
              <RuleRow icon="layers-outline"        label="Starting Stack"  value={`${formatChips(config.startingChips)} chips`} />
              <RuleRow icon="people-outline"        label="Players"         value={`${config.numPlayers} (AI-filled)`} />
              <RuleRow icon="flash-outline"         label="Blind Levels"    value={`Every ${config.handsPerLevel} hands`} />
              <RuleRow icon="card-outline"          label="Variant"         value={config.variant === 'texas_holdem' ? "Texas Hold'em" : "Short Deck Hold'em"} />
              <RuleRow icon="git-branch-outline"    label="Format"          value={config.format} />
            </View>

            {/* Rules */}
            <View style={rm.section}>
              <Text style={rm.sectionLabel}>RULES</Text>
              <Text style={rm.ruleText}>
                Freezeout format — no rebuys or add-ons. When your chips reach zero you are eliminated and your finishing position is locked.{'\n\n'}
                Prizes credit instantly to your chip balance when the tournament ends.{'\n\n'}
                AI bots fill all remaining seats and start immediately after you join.
              </Text>
            </View>

            {config.variant === 'short_deck_holdem' && (
              <View style={rm.section}>
                <Text style={rm.sectionLabel}>SHORT DECK RULES</Text>
                <Text style={rm.ruleText}>
                  Cards 2–5 removed → 36-card deck.{'\n'}
                  Flush beats Full House.{'\n'}
                  Three of a Kind beats Straight.{'\n'}
                  Aces play high and low (A-6-7-8-9 is a straight).
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Footer button */}
          <TouchableOpacity
            style={[rm.okBtn, { backgroundColor: config.color }]}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={rm.okBtnText}>GOT IT</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  overlay:   { flex: 1, justifyContent: 'flex-end' },
  backdrop:  { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.72)' },
  sheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    overflow: 'hidden', padding: 20, paddingBottom: 36, gap: 16,
    borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  topBar:  { position: 'absolute', top: 0, left: 0, right: 0, height: 2 },
  header:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  title:   { fontSize: 15, fontWeight: '900', fontFamily: 'Orbitron_900Black', letterSpacing: 0.8 },
  format:  { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  closeBtn: { padding: 4 },

  section:    { gap: 8 },
  sectionLabel: {
    color: colors.textMuted, fontSize: 9,
    fontWeight: '700', letterSpacing: 2,
    fontFamily: 'Orbitron_400Regular',
  },
  prizeRow:       { gap: 6 },
  prizeTotal:     { fontSize: 26, fontWeight: '800', fontFamily: 'Inter_700Bold' },
  prizeBreakdown: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  prizeItem:      { fontSize: 12, fontWeight: '700' },

  ruleRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 2 },
  ruleLabel: { color: colors.textDim, fontSize: 12, flex: 1 },
  ruleVal:   { color: colors.text, fontSize: 12, fontWeight: '700' },
  ruleText:  { color: colors.textMuted, fontSize: 12, lineHeight: 19 },

  okBtn: {
    borderRadius: 50, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  okBtnText: {
    color: colors.background, fontSize: 13,
    fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 2,
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
  const paysTop = getPaysTop(config);
  const [rulesVisible, setRulesVisible] = useState(false);
  const pressScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(pressScale, { toValue: 0.975, useNativeDriver: true, speed: 50 }).start();
  const handlePressOut = () =>
    Animated.spring(pressScale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();

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
      `Buy-in: ${formatChips(config.buyIn)} chips\nPrize Pool: ${formatChips(prizePool)} chips\n\n${config.prizeLabel}\n\nAI bots fill the table and the game starts instantly.`,
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
      <Animated.View
        style={[
          st.card,
          cardWidth ? { width: cardWidth } : undefined,
          { borderColor: `${config.color}38`, transform: [{ scale: pressScale }] },
        ]}
      >
        {/* Backgrounds */}
        <LinearGradient
          colors={['#130022', '#080016', '#050010']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        />
        <LinearGradient
          colors={[`${config.color}18`, `${config.color}06`, 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
        />
        {/* Top accent line */}
        <View style={[st.topLine, { backgroundColor: config.color }]} />

        <View style={st.inner}>
          {/* ── LIVE badge (top-left, no countdown) ── */}
          <View style={st.liveRow}>
            <View style={[st.livePill, { borderColor: `${config.color}40`, backgroundColor: `${config.color}12` }]}>
              <PulsingDot color={config.color} />
              <Text style={[st.liveText, { color: config.color }]}>LIVE</Text>
            </View>
          </View>

          {/* ── Icon ── */}
          <View style={[st.iconCircle, { borderColor: `${config.color}45`, backgroundColor: `${config.color}14` }]}>
            <Ionicons name={config.icon as any} size={42} color={config.color} />
          </View>

          {/* ── Name (auto-shrinks to fit, never wraps) ── */}
          <Text
            style={[st.name, { color: config.color }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {config.name}
          </Text>

          {/* ── Format/subtitle ── */}
          <Text style={st.format}>{config.format}</Text>

          {/* ── Divider ── */}
          <View style={[st.divider, { backgroundColor: `${config.color}22` }]} />

          {/* ── Stats ── */}
          <View style={st.statsRow}>
            <View style={st.stat}>
              <Text style={st.statLbl}>BUY-IN</Text>
              <Text style={[st.statVal, { color: canAfford ? config.color : colors.error }]}>
                {formatChips(config.buyIn)}
              </Text>
            </View>
            <View style={[st.statDivider, { backgroundColor: `${config.color}25` }]} />
            <View style={st.stat}>
              <Text style={st.statLbl}>PRIZE</Text>
              <Text style={[st.statVal, { color: colors.gold }]}>{formatChips(prizePool)}</Text>
            </View>
            <View style={[st.statDivider, { backgroundColor: `${config.color}25` }]} />
            <View style={st.stat}>
              <Text style={st.statLbl}>SEATS</Text>
              <Text style={st.statVal}>{config.numPlayers}</Text>
            </View>
          </View>

          {/* ── Divider ── */}
          <View style={[st.divider, { backgroundColor: `${config.color}22` }]} />

          {/* ── Pays top ── */}
          <Text style={[st.paysTop, { color: `${config.color}99` }]}>{paysTop}</Text>

          {/* ── Actions: info + enter ── */}
          <View style={st.actions}>
            {/* Info button — lower left */}
            <TouchableOpacity
              style={[st.infoBtn, { borderColor: `${config.color}30` }]}
              onPress={() => setRulesVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="information-circle-outline" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            {/* ENTER button */}
            <TouchableOpacity
              style={[st.enterBtn, !canAfford && st.enterBtnDisabled]}
              onPress={handleEnter}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              activeOpacity={0.88}
            >
              {canAfford && (
                <LinearGradient
                  colors={[config.color, `${config.color}bb`]}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                />
              )}
              <Text style={[st.enterBtnText, !canAfford && st.enterBtnTextDisabled]}>
                {canAfford ? 'ENTER' : 'NEED CHIPS'}
              </Text>
              {canAfford && (
                <Ionicons name="arrow-forward" size={13} color={colors.background} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

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
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  topLine: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 2,
  },
  inner: {
    padding: 18,
    gap: 11,
    alignItems: 'center',
  },

  liveRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
  },
  livePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 20, borderWidth: 1,
    paddingHorizontal: 9, paddingVertical: 4,
  },
  liveText: {
    fontSize: 9, fontWeight: '900',
    fontFamily: 'Orbitron_700Bold', letterSpacing: 2,
  },

  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },

  name: {
    fontSize: 18, fontWeight: '900',
    fontFamily: 'Orbitron_900Black', letterSpacing: 1.5,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  format: {
    color: colors.textMuted, fontSize: 11,
    textAlign: 'center',
  },

  divider: {
    height: 1, alignSelf: 'stretch',
  },

  statsRow: {
    flexDirection: 'row', alignSelf: 'stretch',
    alignItems: 'center',
  },
  stat: { flex: 1, alignItems: 'center', gap: 5 },
  statDivider: { width: 1, height: 32 },
  statLbl: {
    color: colors.textDim, fontSize: 8,
    fontWeight: '700', letterSpacing: 1.5,
  },
  statVal: {
    color: colors.text, fontSize: 16,
    fontWeight: '800', fontFamily: 'Inter_700Bold',
  },

  paysTop: {
    fontSize: 10, fontWeight: '800',
    fontFamily: 'Orbitron_700Bold', letterSpacing: 1.5,
    textAlign: 'center',
  },

  actions: {
    flexDirection: 'row', alignSelf: 'stretch',
    alignItems: 'center', gap: 8,
  },
  infoBtn: {
    width: 40, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
  },
  enterBtn: {
    flex: 1, height: 38, borderRadius: 10,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6, overflow: 'hidden',
  },
  enterBtnDisabled: {
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  enterBtnText: {
    color: colors.background, fontSize: 12,
    fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 2,
  },
  enterBtnTextDisabled: { color: colors.textDim },
});
