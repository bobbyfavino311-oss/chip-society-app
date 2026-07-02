/**
 * TournamentLiveCard v2 — premium live event card
 *
 * Centered poster layout: LIVE dot · icon · name · stats · ENTER.
 * ENTER navigates directly to /game/tournament (lobby+game screen).
 * No countdown timer. No emoji art — Ionicons only.
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
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/colors';
import { TournamentConfig, getPrizePool, getVariantBadge } from '@/constants/tournaments';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatChips(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.floor(n / 1_000)}K`;
  return String(n);
}

function getPaysTop(config: TournamentConfig): string {
  return config.prizeLabel.includes('3rd') ? 'PAYS TOP 3' : 'PAYS TOP 2';
}

// ─── Animated pulsing LIVE dot ────────────────────────────────────────────────

function PulsingDot({ color }: { color: string }) {
  const pulse = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1, duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulse, {
          toValue: 0.3, duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
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
  wrap: { width: 14, height: 14, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', width: 12, height: 12, borderRadius: 6 },
  core: { width: 6, height: 6, borderRadius: 3 },
});

// ─── Info / Rules modal ───────────────────────────────────────────────────────

function RulesModal({ visible, config, onClose }: {
  visible: boolean;
  config: TournamentConfig;
  onClose: () => void;
}) {
  const prizePool = getPrizePool(config);
  const payouts = config.prizeLabel.split('  ·  ').map(p => p.trim());

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={rm.overlay}>
        <TouchableOpacity style={rm.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={rm.sheet}>
          <LinearGradient colors={['#1a0030', '#0d001c', '#050010']} style={StyleSheet.absoluteFill} />
          <View style={[rm.topAccent, { backgroundColor: config.color }]} />

          {/* Header */}
          <View style={rm.header}>
            <View style={[rm.iconWrap, { borderColor: `${config.color}45`, backgroundColor: `${config.color}12` }]}>
              <Ionicons name={config.icon as any} size={20} color={config.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[rm.title, { color: config.color }]} numberOfLines={1}>{config.name}</Text>
              <Text style={rm.sub}>{config.format}</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={rm.body}>

            {/* Prize pool */}
            <View style={rm.section}>
              <Text style={rm.secLabel}>PRIZE POOL</Text>
              <Text style={[rm.prizeTotal, { color: colors.gold }]}>{formatChips(prizePool)} chips</Text>
              <View style={rm.payoutRow}>
                {payouts.map((p, i) => (
                  <View key={i} style={[rm.payoutChip, { borderColor: `${config.color}40`, backgroundColor: `${config.color}10` }]}>
                    <Text style={[rm.payoutText, { color: config.color }]}>{p}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Structure */}
            <View style={rm.section}>
              <Text style={rm.secLabel}>STRUCTURE</Text>
              <InfoRow icon="wallet-outline"     label="Buy-in"         value={`${formatChips(config.buyIn)} chips`} />
              <InfoRow icon="layers-outline"     label="Starting Stack" value={`${formatChips(config.startingChips)} chips`} />
              <InfoRow icon="people-outline"     label="Players"        value={`${config.numPlayers} (AI-filled)`} />
              <InfoRow icon="flash-outline"      label="Blind Levels"   value={`Every ${config.handsPerLevel} hands`} />
              <InfoRow
                icon="card-outline"
                label="Variant"
                value={
                  config.variant === 'texas_holdem' ? "Texas Hold'em" :
                  config.variant === 'short_deck_holdem' ? 'Short Deck' :
                  config.variant === 'omaha_holdem' ? "Omaha Hold'em" :
                  "Joker Hold'em"
                }
              />
            </View>

            {/* Rules */}
            <View style={rm.section}>
              <Text style={rm.secLabel}>RULES</Text>
              <Text style={rm.ruleText}>
                Freezeout format — no rebuys or add-ons. When your chips hit zero you are eliminated.
                {'\n\n'}
                Prizes credit instantly to your chip balance at the end of the tournament.
                {'\n\n'}
                AI bots fill remaining seats and the tournament starts immediately after you join.
              </Text>
            </View>

            {config.variant === 'short_deck_holdem' && (
              <View style={rm.section}>
                <Text style={rm.secLabel}>SHORT DECK RULES</Text>
                <Text style={rm.ruleText}>
                  Cards 2–5 removed → 36-card deck.{'\n'}
                  Flush beats Full House.{'\n'}
                  Three of a Kind beats Straight.{'\n'}
                  Aces play high and low (A-6-7-8-9 is the lowest straight).
                </Text>
              </View>
            )}

            {config.variant === 'omaha_holdem' && (
              <View style={rm.section}>
                <Text style={rm.secLabel}>OMAHA RULES</Text>
                <Text style={rm.ruleText}>
                  Each player is dealt 4 hole cards instead of 2.{'\n'}
                  You must use exactly 2 hole cards and exactly 3 community cards to make your best hand.{'\n'}
                  Standard hand rankings apply (Royal Flush high, High Card low).
                </Text>
              </View>
            )}

            {config.variant === 'joker_holdem' && (
              <View style={rm.section}>
                <Text style={rm.secLabel}>JOKER RULES</Text>
                <Text style={rm.ruleText}>
                  Two Jokers are added to the deck as wild cards.{'\n'}
                  A Joker can substitute for any card to make the best possible hand.{'\n'}
                  Standard hand rankings apply — five of a kind (via Joker) beats a Royal Flush.
                </Text>
              </View>
            )}

          </ScrollView>

          <TouchableOpacity
            style={[rm.okBtn, { backgroundColor: config.color }]}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={rm.okText}>GOT IT</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={rm.infoRow}>
      <Ionicons name={icon as any} size={13} color={colors.textDim} style={{ marginTop: 1 }} />
      <Text style={rm.infoLabel}>{label}</Text>
      <Text style={rm.infoVal}>{value}</Text>
    </View>
  );
}

const rm = StyleSheet.create({
  overlay:   { flex: 1, justifyContent: 'flex-end' },
  backdrop:  { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.75)' },
  sheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    overflow: 'hidden', paddingTop: 20, paddingHorizontal: 20, paddingBottom: 36,
    borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  topAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 2 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  iconWrap: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 14, fontWeight: '900', fontFamily: 'Orbitron_900Black', letterSpacing: 0.5 },
  sub:   { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  body:  { gap: 20, paddingBottom: 8 },
  section: { gap: 10 },
  secLabel: {
    color: colors.textMuted, fontSize: 9, fontWeight: '700',
    letterSpacing: 2, fontFamily: 'Orbitron_400Regular',
  },
  prizeTotal:  { fontSize: 24, fontWeight: '800', fontFamily: 'Inter_700Bold' },
  payoutRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  payoutChip:  { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  payoutText:  { fontSize: 12, fontWeight: '700' },
  infoRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoLabel:   { flex: 1, color: colors.textDim, fontSize: 12 },
  infoVal:     { color: colors.text, fontSize: 12, fontWeight: '700' },
  ruleText:    { color: colors.textMuted, fontSize: 12, lineHeight: 19 },
  okBtn: {
    borderRadius: 50, paddingVertical: 13,
    alignItems: 'center', marginTop: 16,
  },
  okText: {
    color: '#000', fontSize: 13,
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
  const variantBadge = getVariantBadge(config.variant);
  const [rulesVisible, setRulesVisible] = useState(false);
  const pressAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(pressAnim, { toValue: 0.975, useNativeDriver: Platform.OS !== 'web', speed: 60 }).start();
  const onPressOut = () =>
    Animated.spring(pressAnim, { toValue: 1, useNativeDriver: Platform.OS !== 'web', speed: 60 }).start();

  const handleEnter = () => {
    if (!canAfford) {
      Alert.alert(
        'Insufficient Chips',
        `You need ${formatChips(config.buyIn)} chips to enter this tournament.\n\nYour balance: ${formatChips(userChips)} chips`,
        [{ text: 'OK' }],
      );
      return;
    }
    // Navigate directly to the tournament lobby (no redundant Alert — lobby screen shows full details)
    router.push({
      pathname: '/game/tournament',
      params: { type: config.type },
    } as any);
  };

  return (
    <>
      <Animated.View
        style={[
          st.card,
          cardWidth ? { width: cardWidth } : undefined,
          { borderColor: `${config.color}35`, transform: [{ scale: pressAnim }] },
        ]}
      >
        {/* Backgrounds */}
        <LinearGradient
          colors={['#120020', '#080016', '#050010']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
        />
        <LinearGradient
          colors={[`${config.color}16`, `${config.color}05`, 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }}
        />
        {/* Top accent line */}
        <View style={[st.topLine, { backgroundColor: config.color }]} />

        <View style={st.inner}>

          {/* ── LIVE badge + variant badge ── */}
          <View style={st.liveRow}>
            <View style={[st.livePill, { borderColor: `${config.color}35`, backgroundColor: `${config.color}10` }]}>
              <PulsingDot color={config.color} />
              <Text style={[st.liveText, { color: config.color }]}>LIVE</Text>
            </View>
            <View style={[st.variantPill, { borderColor: `${variantBadge.color}40`, backgroundColor: `${variantBadge.color}12` }]}>
              <Ionicons name={variantBadge.icon as any} size={10} color={variantBadge.color} />
              <Text style={[st.variantText, { color: variantBadge.color }]}>{variantBadge.label}</Text>
            </View>
          </View>

          {/* ── Icon ── */}
          <View style={[st.iconCircle, { borderColor: `${config.color}40`, backgroundColor: `${config.color}12` }]}>
            <Ionicons name={config.icon as any} size={40} color={config.color} />
          </View>

          {/* ── Name — never wraps, auto-shrinks on native ── */}
          <Text
            style={[st.name, { color: config.color }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.72}
            ellipsizeMode="clip"
          >
            {config.name}
          </Text>

          {/* ── Format ── */}
          <Text style={st.format} numberOfLines={1}>{config.format}</Text>

          {/* ── Divider ── */}
          <View style={[st.divider, { backgroundColor: `${config.color}20` }]} />

          {/* ── Stats ── */}
          <View style={st.statsRow}>
            <View style={st.stat}>
              <Text style={st.statLabel}>BUY-IN</Text>
              <Text style={[st.statValue, { color: canAfford ? config.color : colors.error }]}>
                {formatChips(config.buyIn)}
              </Text>
            </View>
            <View style={[st.statSep, { backgroundColor: `${config.color}22` }]} />
            <View style={st.stat}>
              <Text style={st.statLabel}>PRIZE</Text>
              <Text style={[st.statValue, { color: colors.gold }]}>{formatChips(prizePool)}</Text>
            </View>
            <View style={[st.statSep, { backgroundColor: `${config.color}22` }]} />
            <View style={st.stat}>
              <Text style={st.statLabel}>SEATS</Text>
              <Text style={st.statValue}>{config.numPlayers}</Text>
            </View>
          </View>

          {/* ── Divider ── */}
          <View style={[st.divider, { backgroundColor: `${config.color}20` }]} />

          {/* ── Pays top ── */}
          <Text style={[st.paysTop, { color: `${config.color}88` }]}>{paysTop}</Text>

          {/* ── Actions ── */}
          <View style={st.actions}>
            {/* Info button */}
            <TouchableOpacity
              style={[st.infoBtn, { borderColor: `${config.color}28` }]}
              onPress={() => setRulesVisible(true)}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="information-circle-outline" size={19} color={colors.textMuted} />
            </TouchableOpacity>

            {/* ENTER */}
            <TouchableOpacity
              style={[st.enterBtn, !canAfford && st.enterBtnLocked]}
              onPress={handleEnter}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              activeOpacity={0.85}
            >
              {canAfford && (
                <LinearGradient
                  colors={[config.color, `${config.color}bb`]}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                />
              )}
              <Text style={[st.enterText, !canAfford && st.enterTextLocked]}>
                {canAfford ? 'ENTER' : 'NEED CHIPS'}
              </Text>
              {canAfford && <Ionicons name="chevron-forward" size={12} color="#000" />}
            </TouchableOpacity>
          </View>

        </View>
      </Animated.View>

      <RulesModal visible={rulesVisible} config={config} onClose={() => setRulesVisible(false)} />
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  topLine: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 2,
  },
  inner: {
    padding: 13,
    paddingBottom: 14,
    gap: 7,
    alignItems: 'center',
  },

  // LIVE
  liveRow:  { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  livePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 9, paddingVertical: 4,
  },
  liveText: {
    fontSize: 9, fontWeight: '900',
    fontFamily: 'Orbitron_700Bold', letterSpacing: 2,
  },
  variantPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  variantText: {
    fontSize: 8, fontWeight: '800',
    fontFamily: 'Orbitron_700Bold', letterSpacing: 1,
  },

  // Icon
  iconCircle: {
    width: 62, height: 62, borderRadius: 31,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },

  // Name — base 15px; adjustsFontSizeToFit handles native overflow
  name: {
    fontSize: 15,
    fontWeight: '900',
    fontFamily: 'Orbitron_900Black',
    letterSpacing: 1.2,
    textAlign: 'center',
    alignSelf: 'stretch',
  },

  format: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },

  // Divider
  divider: { height: 1, alignSelf: 'stretch' },

  // Stats row
  statsRow: {
    flexDirection: 'row', alignSelf: 'stretch', alignItems: 'center',
  },
  stat:      { flex: 1, alignItems: 'center', gap: 3 },
  statSep:   { width: 1, height: 26 },
  statLabel: {
    color: colors.textDim, fontSize: 8,
    fontWeight: '700', letterSpacing: 1.5,
  },
  statValue: {
    color: colors.text, fontSize: 15,
    fontWeight: '800', fontFamily: 'Inter_700Bold',
  },

  // Pays top
  paysTop: {
    fontSize: 10, fontWeight: '800',
    fontFamily: 'Orbitron_700Bold', letterSpacing: 1.5,
    textAlign: 'center',
  },

  // Actions row
  actions: {
    flexDirection: 'row', alignSelf: 'stretch',
    alignItems: 'center', gap: 8,
    marginTop: 2,
  },
  infoBtn: {
    width: 36, height: 32, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
  },
  enterBtn: {
    flex: 1, height: 32, borderRadius: 9,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 5, overflow: 'hidden',
  },
  enterBtnLocked: {
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  enterText: {
    color: '#000', fontSize: 11,
    fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 2,
  },
  enterTextLocked: { color: colors.textDim },
});
