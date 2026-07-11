import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Dimensions,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Pressable,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle, G, Line, Path } from 'react-native-svg';
import colors from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { useSoundSettings } from '@/context/SoundContext';
import { useColors } from '@/hooks/useColors';
import { useNotifications } from '@/context/NotificationContext';
import { MusicEngine } from '@/lib/musicEngine';
import { useAISocial } from '@/context/AISocialContext';
import { useLiveFeed } from '@/context/LiveFeedContext';
import { formatTimeAgo } from '@/lib/aiSocialEngine';
import NeonAvatar from '@/components/NeonAvatar';
import DailyMissionsPanel from '@/components/DailyMissionsPanel';

const { width } = Dimensions.get('window');

const RANK_COLORS: Record<string, string> = {
  'LOCAL':              'rgba(255,255,255,0.45)',
  'PLAYER':             '#00e887',
  'HIGH ROLLER':        '#00d4ff',
  'VIP':                '#00b8e6',
  'EXECUTIVE':          '#a0a8c0',
  'KINGPIN':            colors.gold,
  'CARTEL':             '#ffaa00',
  'SYNDICATE':          '#ff7700',
  'EMPIRE':             colors.secondary,
  'DYNASTY':            '#d070ff',
  'LEGEND':             colors.accent,
  'IMMORTAL':           '#ff5fff',
  'VICE ROYALTY':       '#ff2090',
  'CHIP SOCIETY ELITE': colors.accent,
};

// ─── Tournament Live Carousel ─────────────────────────────────────────────────

import {
  TOURNAMENT_CONFIGS,
  TournamentType,
} from '@/constants/tournaments';
import TournamentLiveCard from '@/components/TournamentLiveCard';

// Surface every poker variant directly on Home — no hidden tabs. Two events
// per variant (an entry-level event + a flagship/turbo event), grouped by
// variant so players immediately see the full lineup while scrolling.
const HOME_TOURNAMENTS: TournamentType[] = [
  'beginner', 'daily',                     // Traditional Hold'em · Championship
  'sd_lounge', 'sd_rush',                  // Short Deck Hold'em · Turbo
  'omaha_championship', 'omaha_highroller', // Omaha Hold'em · High Roller
  'joker_showdown', 'joker_jackpot',       // Joker Hold'em · Jackpot
];
const CARD_W = width * 0.78;
const CARD_GAP = 12;

function TournamentCarousel({ userChips }: { userChips: number }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={CARD_W + CARD_GAP}
      decelerationRate="fast"
      snapToAlignment="center"
      contentContainerStyle={{ gap: CARD_GAP, paddingRight: 16 }}
    >
      {HOME_TOURNAMENTS.map(type => (
        <TournamentLiveCard
          key={type}
          config={TOURNAMENT_CONFIGS[type]}
          userChips={userChips}
          cardWidth={CARD_W}
        />
      ))}
    </ScrollView>
  );
}

// ─── Early Access Tournaments banner + roadmap modal ─────────────────────────

function TournamentInfoModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const bullets = [
    'Every tournament is fully playable.',
    'AI players use realistic poker strategies.',
    'All chips, XP, achievements, statistics, and tournament winnings are permanent.',
    'Your tournament history, wins, and accomplishments will carry forward into future live tournaments.',
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={infoModal.overlay}>
        <TouchableOpacity style={infoModal.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[infoModal.card, { marginBottom: insets.bottom }]}>
          <LinearGradient colors={['#0d0020', '#050010']} style={StyleSheet.absoluteFill} />
          <View style={infoModal.topAccent} />

          <Text style={infoModal.title}>TOURNAMENT INFORMATION</Text>

          <ScrollView showsVerticalScrollIndicator={false} style={infoModal.scroll}>
            <Text style={infoModal.paragraph}>
              Chip Society is launching with AI-supported tournaments to ensure that every event starts instantly and provides a consistent competitive experience.
            </Text>
            <Text style={infoModal.paragraph}>
              As the player community grows, tournament seats will gradually transition from AI competitors to real players. Eventually, tournaments will become fully live multiplayer events without requiring any changes from you.
            </Text>

            <Text style={infoModal.sectionLabel}>DURING EARLY ACCESS</Text>
            <View style={infoModal.bulletList}>
              {bullets.map((b) => (
                <View key={b} style={infoModal.bulletRow}>
                  <View style={infoModal.bulletDot} />
                  <Text style={infoModal.bulletText}>{b}</Text>
                </View>
              ))}
            </View>

            <Text style={[infoModal.paragraph, { marginTop: 4 }]}>
              The goal is to guarantee full tournaments at any time of day while the community grows.
            </Text>
          </ScrollView>

          <TouchableOpacity style={infoModal.closeBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={infoModal.closeText}>CLOSE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function EarlyAccessBanner() {
  const [modalVisible, setModalVisible] = useState(false);
  return (
    <>
      <View style={eaBanner.wrap}>
        <LinearGradient
          colors={['rgba(0,212,255,0.08)', 'rgba(0,0,0,0.35)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        />
        <View style={eaBanner.iconWrap}>
          <Ionicons name="trophy-outline" size={17} color={colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={eaBanner.title}>EARLY ACCESS TOURNAMENTS</Text>
          <Text style={eaBanner.sub}>
            Tournament seats are currently filled with AI competitors while the community grows. Chips, XP, and progress always count.
          </Text>
          <TouchableOpacity onPress={() => setModalVisible(true)} activeOpacity={0.75} style={eaBanner.learnBtn}>
            <Text style={eaBanner.learnText}>How It Works</Text>
            <Ionicons name="chevron-forward" size={12} color={colors.accent} />
          </TouchableOpacity>
        </View>
      </View>
      <TournamentInfoModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </>
  );
}

const infoModal = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 22 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.78)' },
  card: {
    width: '100%', maxHeight: '78%', borderRadius: 20, overflow: 'hidden',
    paddingTop: 22, paddingHorizontal: 20, paddingBottom: 18,
    borderWidth: 1, borderColor: 'rgba(0,212,255,0.28)',
  },
  topAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: colors.accent },
  title: {
    color: colors.accent, fontSize: 15, fontWeight: '900', fontFamily: 'Orbitron_900Black',
    letterSpacing: 1, marginBottom: 14, textAlign: 'center',
  },
  scroll: { marginBottom: 16 },
  paragraph: { color: colors.text, fontSize: 12.5, lineHeight: 19, marginBottom: 12, opacity: 0.9 },
  sectionLabel: {
    color: colors.textMuted, fontSize: 10.5, fontWeight: '800', letterSpacing: 1,
    marginBottom: 8, marginTop: 2,
  },
  bulletList: { gap: 8, marginBottom: 4 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bulletDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.accent, marginTop: 6 },
  bulletText: { flex: 1, color: colors.text, fontSize: 12, lineHeight: 18, opacity: 0.9 },
  closeBtn: {
    borderRadius: 50, paddingVertical: 13, alignItems: 'center',
    backgroundColor: colors.accent,
  },
  closeText: { color: '#000', fontSize: 12.5, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 2 },
});

const eaBanner = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0,212,255,0.18)',
    paddingHorizontal: 14, paddingVertical: 12, overflow: 'hidden',
    minHeight: 74,
    shadowColor: '#00d4ff', shadowOpacity: 0.1, shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  iconWrap: {
    width: 32, height: 32, borderRadius: 16, marginTop: 1,
    borderWidth: 1, borderColor: 'rgba(0,212,255,0.35)',
    backgroundColor: 'rgba(0,212,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { color: colors.text, fontSize: 11, fontWeight: '800', fontFamily: 'Orbitron_700Bold', letterSpacing: 1 },
  sub: { color: colors.textMuted, fontSize: 10.5, marginTop: 3, lineHeight: 14 },
  learnBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    alignSelf: 'flex-start', marginTop: 7,
  },
  learnText: { color: colors.accent, fontSize: 10.5, fontWeight: '800', letterSpacing: 0.3 },
});

// ─── Quick Play inline launcher ──────────────────────────────────────────────

type TVariant = 'texas_holdem' | 'short_deck_holdem' | 'joker_holdem' | 'omaha_holdem';

type QpVariantDef = {
  key: TVariant; label: string; sub: string;
  color: string; gradient: [string, string];
  iconSet: 'ion' | 'mci'; iconName: string;
};

const QP_VARIANTS: QpVariantDef[] = [
  { key: 'texas_holdem',      label: "TRADITIONAL\nHOLD'EM",  sub: 'Classic 52-card poker',              color: '#00d4ff', gradient: ['#00d4ff', '#0066cc'], iconSet: 'ion', iconName: 'card-outline' },
  { key: 'short_deck_holdem', label: "SHORT\nDECK",           sub: '36-card · Flush beats Full House',   color: '#ff0090', gradient: ['#ff0090', '#cc0077'], iconSet: 'mci', iconName: 'cards' },
  { key: 'joker_holdem',      label: "JOKER\nHOLD'EM",        sub: '54-card deck · 2 wild Jokers',       color: '#ffd700', gradient: ['#ffd700', '#cc8800'], iconSet: 'ion', iconName: 'sparkles-outline' },
  { key: 'omaha_holdem',      label: "OMAHA\nHOLD'EM",        sub: '4 hole cards · Use exactly 2',      color: '#00ff88', gradient: ['#00ff88', '#00aa55'], iconSet: 'ion', iconName: 'grid-outline' },
];


// ─── Quick Play inline launcher ──────────────────────────────────────────────

/** Maps a chip count to the matching practice stake-tier key. */
function getAutoTierKey(chips: number): string {
  if (chips >= 10_000_000) return 'elite_plus';
  if (chips >=  5_000_000) return 'elite';
  if (chips >=  2_000_000) return 'vip';
  if (chips >=  1_000_000) return 'highroller';
  if (chips >=    500_000) return 'standard';
  if (chips >=    250_000) return 'low';
  if (chips >=    100_000) return 'micro';
  return 'starter';
}

const TIER_BLIND_LABELS: Record<string, string> = {
  starter:    '1K / 2K',
  micro:      '5K / 10K',
  low:        '10K / 20K',
  standard:   '25K / 50K',
  highroller: '50K / 100K',
  vip:        '100K / 200K',
  elite:      '250K / 500K',
  elite_plus: '500K / 1M',
};

function QuickPlayCard() {
  const { profile } = useUser();
  const [variant, setVariant] = useState<TVariant>('texas_holdem');
  const [seats, setSeats] = useState<4 | 5>(5);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const activeVariant   = QP_VARIANTS.find(v => v.key === variant) ?? QP_VARIANTS[0];
  const accentColor     = activeVariant.color;
  const gradientColors  = activeVariant.gradient;

  // Determine stake level from player's actual bankroll
  const tierKey    = getAutoTierKey(profile.chips);
  const blindLabel = TIER_BLIND_LABELS[tierKey];

  const handleStart = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.96, duration: 70, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start(() => {
      // Pass tier so practice.tsx uses matching blinds and bot stacks scale
      // to 50-200% of the player's bankroll (bankroll-matched opponents).
      router.push(`/game/practice?variant=${variant}&players=${seats}&tier=${tierKey}` as any);
    });
  };

  return (
    <View style={qp.card}>
      <LinearGradient
        colors={['rgba(16,5,34,0.97)', 'rgba(8,1,26,0.98)', 'rgba(5,1,14,0.99)']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
      />
      <LinearGradient
        colors={[`${accentColor}14`, 'transparent']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />

      {/* Header */}
      <View style={qp.header}>
        <Ionicons name="flash" size={16} color={accentColor} />
        <Text style={[qp.title, { color: accentColor }]}>QUICK PLAY</Text>
      </View>

      {/* Step 1 — Variant Carousel */}
      <Text style={qp.stepLabel}>SELECT VARIANT</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={qp.carouselContent}
        style={qp.carousel}
        decelerationRate="fast"
      >
        {QP_VARIANTS.map(v => {
          const isSel = variant === v.key;
          const iconEl = v.iconSet === 'mci'
            ? <MaterialCommunityIcons name={v.iconName as any} size={20} color={isSel ? v.color : colors.textMuted} />
            : <Ionicons name={v.iconName as any} size={20} color={isSel ? v.color : colors.textMuted} />;
          return (
            <TouchableOpacity
              key={v.key}
              style={[qp.variantCard, isSel && { borderColor: v.color, backgroundColor: `${v.color}12` }]}
              onPress={() => setVariant(v.key)}
              activeOpacity={0.8}
            >
              {isSel && <LinearGradient colors={[`${v.color}18`, 'transparent']} style={StyleSheet.absoluteFill} />}
              <View style={[qp.variantIconWrap, { borderColor: isSel ? `${v.color}55` : colors.border }]}>
                {iconEl}
              </View>
              <Text style={[qp.variantName, { color: isSel ? v.color : colors.textMuted }]} numberOfLines={2}>{v.label}</Text>
              <Text style={qp.variantSub} numberOfLines={2}>{v.sub}</Text>
              {isSel && <Ionicons name="checkmark-circle" size={14} color={v.color} style={qp.variantCheck} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Step 2 — Seat Count */}
      <Text style={qp.stepLabel}>TABLE SIZE</Text>
      <View style={qp.seatRow}>
        {([4, 5] as const).map(n => {
          const active = seats === n;
          return (
            <TouchableOpacity
              key={n}
              style={[qp.seatBtn, active && { borderColor: accentColor, backgroundColor: `${accentColor}15` }]}
              onPress={() => setSeats(n)}
              activeOpacity={0.8}
            >
              {active && (
                <LinearGradient colors={[`${accentColor}18`, 'transparent']} style={StyleSheet.absoluteFill} />
              )}
              <Text style={[qp.seatNum, { color: active ? accentColor : colors.textMuted }]}>{n}</Text>
              <Text style={[qp.seatLabel, { color: active ? accentColor : colors.textMuted }]}>PLAYERS</Text>
              <Text style={qp.seatSub}>You + {n - 1} AI bots</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Stake indicator — bankroll-matched blinds */}
      <View style={qp.stakeRow}>
        <Ionicons name="stats-chart" size={12} color={colors.textMuted} />
        <Text style={qp.stakeText}>
          AUTO-MATCHED STAKES · <Text style={{ color: accentColor }}>{blindLabel} BLINDS</Text>
        </Text>
      </View>

      {/* Step 3 — Start */}
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity style={qp.startBtn} onPress={handleStart} activeOpacity={0.9}>
          <LinearGradient
            colors={gradientColors}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          />
          <Ionicons name="flash" size={18} color="#050010" />
          <Text style={qp.startText}>START QUICK PLAY</Text>
          <Ionicons name="arrow-forward" size={16} color="#05001088" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ─── Animated logo ───────────────────────────────────────────────────────────

const LOGO_IMG      = require('@/assets/images/chip-society-logo.png') as number;
const SKYLINE_IMG   = require('@/assets/images/miami-skyline.png') as number;
const LOGO_IMG_W    = width * 0.84;
const LOGO_IMG_H    = LOGO_IMG_W * (576 / 1024); // native PNG aspect 1024×576

function ChipSocietyLogo() {
  const brightness  = useRef(new Animated.Value(1)).current;
  const timeoutRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(brightness, { toValue: 0.93, duration: 2000, useNativeDriver: true }),
        Animated.timing(brightness, { toValue: 1.0,  duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    function flicker() {
      Animated.sequence([
        Animated.timing(brightness, { toValue: 0.12, duration: 30,  useNativeDriver: true }),
        Animated.timing(brightness, { toValue: 0.88, duration: 55,  useNativeDriver: true }),
        Animated.timing(brightness, { toValue: 0.20, duration: 22,  useNativeDriver: true }),
        Animated.timing(brightness, { toValue: 1.0,  duration: 80,  useNativeDriver: true }),
      ]).start();
    }

    function scheduleNext() {
      const delay = 8000 + Math.random() * 12000;
      timeoutRef.current = setTimeout(() => { flicker(); scheduleNext(); }, delay);
    }
    scheduleNext();

    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  return (
    <View style={logo.wrap}>
      {/* Cyan + pink bloom radiate behind the logo */}
      <LinearGradient
        colors={['rgba(0,212,255,0.14)', 'rgba(0,212,255,0.05)', 'transparent']}
        style={logo.glowCyan}
        start={{ x: 0.5, y: 0.3 }} end={{ x: 0.5, y: 1 }}
      />
      <LinearGradient
        colors={['rgba(191,95,255,0.10)', 'transparent']}
        style={logo.glowPurple}
        start={{ x: 0.5, y: 0.2 }} end={{ x: 0.5, y: 1 }}
      />
      <Animated.Image
        source={LOGO_IMG}
        style={[logo.img, { opacity: brightness }]}
        resizeMode="contain"
      />
      <Text style={logo.sub} allowFontScaling={false}>SOCIAL POKER NETWORK</Text>
    </View>
  );
}

// ─── Trending post card (horizontal scroll) ──────────────────────────────────

interface TrendPost {
  id: string;
  user: string;
  avatar: string;
  avatarColor: string;
  avatarId?: number;
  type: string;
  typeColor: string;
  content: string;
  likes: number;
  pot?: string;
  timeAgo?: string;
}


// ─── Prize Wheel + Flame SVG icons ───────────────────────────────────────────

const RING_R    = 33;
const RING_W    = 0.8;
const RING_CIRC = 2 * Math.PI * RING_R;
const ARC_270   = RING_CIRC * 0.75;
const GAP_90    = RING_CIRC * 0.25;

function PrizeWheelIcon({ color, size = 36 }: { color: string; size?: number }) {
  const wedges = [
    { d: 'M 12 12 L 12 2.8 A 9.2 9.2 0 0 1 18.5 5.5 Z',   dim: false },
    { d: 'M 12 12 L 18.5 5.5 A 9.2 9.2 0 0 1 21.2 12 Z',   dim: true  },
    { d: 'M 12 12 L 21.2 12 A 9.2 9.2 0 0 1 18.5 18.5 Z',  dim: false },
    { d: 'M 12 12 L 18.5 18.5 A 9.2 9.2 0 0 1 12 21.2 Z',  dim: true  },
    { d: 'M 12 12 L 12 21.2 A 9.2 9.2 0 0 1 5.5 18.5 Z',   dim: false },
    { d: 'M 12 12 L 5.5 18.5 A 9.2 9.2 0 0 1 2.8 12 Z',    dim: true  },
    { d: 'M 12 12 L 2.8 12 A 9.2 9.2 0 0 1 5.5 5.5 Z',     dim: false },
    { d: 'M 12 12 L 5.5 5.5 A 9.2 9.2 0 0 1 12 2.8 Z',     dim: true  },
  ];
  const dividers: Array<[number, number]> = [
    [12, 2.8], [18.5, 5.5], [21.2, 12], [18.5, 18.5],
    [12, 21.2], [5.5, 18.5], [2.8, 12], [5.5, 5.5],
  ];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {wedges.map((w, i) => (
        <Path key={i} d={w.d} fill={color} opacity={w.dim ? 0.38 : 0.85} />
      ))}
      {dividers.map(([x, y], i) => (
        <Line key={i} x1={12} y1={12} x2={x} y2={y} stroke="rgba(5,1,14,0.5)" strokeWidth="0.5" />
      ))}
      <Circle cx="12" cy="12" r={9.2} stroke={color} strokeWidth="0.5" fill="none" opacity={0.55} />
      <Circle cx="12" cy="12" r="2.2" fill="rgba(5,1,14,0.8)" />
      <Circle cx="12" cy="12" r="1.3" fill={color} />
      <Path d="M 12 2.8 L 10.8 0.8 L 13.2 0.8 Z" fill={color} />
    </Svg>
  );
}

function FlameIcon({ color, size = 36 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 21.5 C8 21.5 5 18.5 5 14.5 C5 10.5 7.5 8.5 9 7 C9 9 10 10 11 10.5 C11 8 12 5 14 2.5 C14 7 12.5 9.5 15.5 11.5 C16 9.5 16.5 7.5 17 7 C17.5 10.5 19.5 12.5 19.5 16 C19.5 19.5 16.5 21.5 12 21.5 Z"
        fill={color}
        opacity={0.88}
      />
    </Svg>
  );
}

// ─── Reward quick-access row ───────────────────────────────────────────────────
function RewardRow() {
  const { canClaimWheel, nextWheelIn, canClaimDaily, profile } = useUser();
  const spinPress   = useRef(new Animated.Value(0)).current;
  const streakPress = useRef(new Animated.Value(0)).current;

  function pressIn(anim: Animated.Value)  { Animated.timing(anim, { toValue: 1, useNativeDriver: true, duration: 140, easing: Easing.out(Easing.quad) }).start(); }
  function pressOut(anim: Animated.Value) { Animated.timing(anim, { toValue: 0, useNativeDriver: true, duration: 200, easing: Easing.out(Easing.ease) }).start(); }

  const cards = [
    {
      key: 'spin', label: 'DAILY SPIN', canClaim: canClaimWheel,
      badgeText: `${Math.floor(nextWheelIn / 60)}h ${nextWheelIn % 60}m`,
      color: '#9955ee', iconColor: '#c890ff', cardTint: 'rgba(80,20,140,0.07)',
      route: '/rewards/wheel',
      progress: canClaimWheel ? 1 : Math.max(0, (1440 - nextWheelIn) / 1440),
      pressAnim: spinPress,
      renderIcon: (c: string) => <PrizeWheelIcon color={c} size={32} />,
    },
    {
      key: 'streak', label: 'STREAK', canClaim: canClaimDaily,
      badgeText: `DAY ${profile.streakDays || 1}`,
      color: '#ffaa00', iconColor: '#ffbc40', cardTint: 'rgba(120,70,0,0.05)',
      route: '/rewards/streak',
      progress: Math.min(1, ((profile.streakDays || 0) % 7) / 7),
      pressAnim: streakPress,
      renderIcon: (c: string) => <FlameIcon color={c} size={32} />,
    },
  ];

  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {cards.map(b => {
        const iconLift  = b.pressAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -4] });
        const pillLift  = b.pressAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -2] });
        const spotLight = b.pressAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [b.canClaim ? 0.06 : 0.03, b.canClaim ? 0.12 : 0.07],
        });
        return (
          <Pressable
            key={b.key} style={{ flex: 1 }}
            onPressIn={() => pressIn(b.pressAnim)}
            onPressOut={() => pressOut(b.pressAnim)}
            onPress={() => router.push(b.route as any)}
          >
            <View style={[rr.glassCard, { shadowColor: b.color, borderColor: `${b.color}22` }]}>
              <LinearGradient colors={['rgba(10,3,24,0.94)', 'rgba(7,2,18,0.96)']} style={StyleSheet.absoluteFill} />
              <LinearGradient colors={[`${b.color}16`, 'transparent']} style={StyleSheet.absoluteFill} start={{x:0.5,y:0}} end={{x:0.5,y:0.55}} />
            <View style={rr.floatArea}>

              {/* Arc + icon — lifts 4 px on press */}
              <Animated.View style={[rr.ringWrap, { transform: [{ translateY: iconLift }] }]}>
                {/* Soft spotlight — barely-visible accent disc, brightens on press */}
                <Animated.View style={[rr.spotlight, { backgroundColor: b.color, opacity: spotLight }]} />

                {/* 270° progress arc */}
                <Svg width={68} height={68} viewBox="0 0 76 76" style={{ position: 'absolute', top: 1, left: 1 }}>
                  <Circle
                    cx="38" cy="38" r={RING_R}
                    stroke={`${b.color}0e`} strokeWidth={RING_W}
                    fill="none" strokeLinecap="round"
                    strokeDasharray={[ARC_270, GAP_90]}
                    rotation={135} originX={38} originY={38}
                  />
                  <Circle
                    cx="38" cy="38" r={RING_R}
                    stroke={b.color} strokeWidth={RING_W * 3}
                    fill="none" strokeLinecap="round"
                    opacity={0.1}
                    strokeDasharray={[ARC_270 * b.progress, RING_CIRC - ARC_270 * b.progress]}
                    rotation={135} originX={38} originY={38}
                  />
                  <Circle
                    cx="38" cy="38" r={RING_R}
                    stroke={b.color} strokeWidth={RING_W}
                    fill="none" strokeLinecap="round"
                    strokeDasharray={[ARC_270 * b.progress, RING_CIRC - ARC_270 * b.progress]}
                    rotation={135} originX={38} originY={38}
                  />
                </Svg>

                {/* Floating icon */}
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                  {b.renderIcon(b.canClaim ? b.iconColor : `${b.color}60`)}
                </View>
              </Animated.View>

              {/* Label */}
              <Text style={[rr.label, { color: b.canClaim ? b.iconColor : 'rgba(255,255,255,0.5)' }]}>
                {b.label}
              </Text>
              {b.key === 'streak' && (
                <View style={{ alignItems: 'center', marginTop: -4 }}>
                  <Text style={{ color: b.iconColor, fontSize: 26, fontFamily: 'Inter_700Bold', lineHeight: 30 }}>
                    {profile.streakDays ?? 1}
                  </Text>
                  <Text style={{ color: b.color, fontSize: 8, letterSpacing: 1.5, fontFamily: 'Orbitron_400Regular' }}>
                    DAYS
                  </Text>
                </View>
              )}

              {/* Pill — lifts 2 px on press */}
              <Animated.View style={{ transform: [{ translateY: pillLift }] }}>
                {b.canClaim ? (
                  <View style={[rr.claimBtn, { borderColor: `${b.color}70` }]}>
                    <LinearGradient colors={[`${b.color}2a`, `${b.color}0e`]} style={StyleSheet.absoluteFill} />
                    <Text style={[rr.claimText, { color: b.iconColor }]}>CLAIM</Text>
                  </View>
                ) : (
                  <View style={rr.timerCapsule}>
                    <LinearGradient colors={['rgba(255,255,255,0.04)', 'rgba(0,0,0,0.22)']} style={StyleSheet.absoluteFill} />
                    <Text style={rr.timerText}>{b.badgeText}</Text>
                  </View>
                )}
              </Animated.View>

            </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function TrendCard({ post }: { post: TrendPost }) {
  const [liked, setLiked] = useState(false);
  const pressAnim = useRef(new Animated.Value(0)).current;
  function onPressIn() { Animated.spring(pressAnim, { toValue: 1, useNativeDriver: true, tension: 400, friction: 22 }).start(); }
  function onPressOut() { Animated.spring(pressAnim, { toValue: 0, useNativeDriver: true, tension: 250, friction: 22 }).start(); }
  const cardScale = pressAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.013] });

  return (
    <Pressable onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[trend.cardOuter, { transform: [{ scale: cardScale }] }]}>
      <View style={trend.card}>
      <LinearGradient
        colors={['rgba(16,5,34,0.97)', 'rgba(5,2,14,0.99)']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <LinearGradient
        colors={[`${post.typeColor}bb`, `${post.typeColor}44`, 'transparent']}
        style={trend.accentTop}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
      />
      <LinearGradient
        colors={[`${post.typeColor}20`, 'transparent']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 48 }}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
      />
      <View style={trend.header}>
        <NeonAvatar avatarId={post.avatarId ?? 1} size={40} />
        <View style={{ flex: 1 }}>
          <Text style={trend.username}>{post.user}</Text>
          <View style={[trend.typeBadge, { backgroundColor: `${post.typeColor}22`, borderColor: `${post.typeColor}44` }]}>
            <Text style={[trend.typeText, { color: post.typeColor }]}>{post.type}</Text>
          </View>
        </View>
        {post.pot && (
          <View style={trend.potBadge}>
            <Text style={trend.potLabel}>POT</Text>
            <Text style={trend.potAmt}>{post.pot}</Text>
          </View>
        )}
      </View>
      <Text style={trend.content} numberOfLines={3}>{post.content}</Text>
      <View style={trend.footer}>
        <TouchableOpacity style={trend.likeBtn} onPress={() => setLiked(l => !l)}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={14} color={liked ? colors.secondary : colors.textMuted} />
          <Text style={[trend.likeCount, liked && { color: colors.secondary }]}>
            {liked ? post.likes + 1 : post.likes}
          </Text>
        </TouchableOpacity>
        <Text style={trend.timeAgo}>{post.timeAgo ?? 'just now'}</Text>
      </View>
    </View>
      </Animated.View>
    </Pressable>
  );
}


// ─── Main screen ─────────────────────────────────────────────────────────────

export default function HomeScreen() {
  // ─── All hooks at the top, before any non-hook code ───────────────────────
  const insets = useSafeAreaInsets();
  const { profile, isLoaded } = useUser();
  const colors = useColors();
  const { isDark } = useTheme();
  const { isMusicMuted, toggleMusicMute } = useSoundSettings();
  const { unreadCount } = useNotifications();
  const { posts: aiPosts } = useAISocial();
  const { allPosts: livePosts } = useLiveFeed();
  const trendScrollRef = useRef<ScrollView>(null);
  const trendIndexRef = useRef(0);

  // ─── Effects ──────────────────────────────────────────────────────────────
  useEffect(() => {
    MusicEngine.play();
  }, []);

  useEffect(() => {
    if (isLoaded && profile.isNewUser) {
      router.replace('/onboarding');
    }
  }, [isLoaded, profile.isNewUser]);

  // Auto-scroll trending carousel every 3.5 s (dep on trendingPostCount — real posts + AI filler)
  const trendingPostCount = Math.min(8, livePosts.length + aiPosts.length);
  useEffect(() => {
    const CARD_W = width * 0.82 + 14;
    const timer = setInterval(() => {
      const postCount = trendingPostCount;
      if (!trendScrollRef.current || postCount < 2) return;
      trendIndexRef.current = (trendIndexRef.current + 1) % postCount;
      trendScrollRef.current.scrollTo({ x: trendIndexRef.current * CARD_W, animated: true });
    }, 3500);
    return () => clearInterval(timer);
  }, [trendingPostCount]);

  // ─── Derived values (must be before effects that reference them) ──────────
  const rankColor = RANK_COLORS[profile.rank] ?? colors.primary;
  const formatChips = (n: number): string => {
    const v = (x: number) => x % 1 === 0 ? x.toFixed(0) : x.toFixed(1);
    if (n >= 1_000_000_000) return `${v(n / 1_000_000_000)}B`;
    if (n >= 1_000_000)     return `${v(n / 1_000_000)}M`;
    if (n >= 1_000)         return `${v(n / 1_000)}K`;
    return String(n);
  };

  const TREND_TYPE_COLORS: Record<string, string> = {
    WIN: '#00ff88', BAD_BEAT: '#ff3355', 'BAD BEAT': '#ff3355', BLUFF: '#ffd700',
    JACKPOT: '#bf5fff', MILESTONE: '#00d4ff', TOURNEY: '#ff9900', GENERAL: colors.textMuted,
  };

  const realTrendPosts: TrendPost[] = [...livePosts]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8)
    .map(p => ({
      id: p.id,
      user: p.authorUsername,
      avatar: p.authorUsername[0]?.toUpperCase() ?? 'P',
      avatarColor: colors.primary,
      avatarId: p.authorAvatarIndex,
      type: p.tag,
      typeColor: TREND_TYPE_COLORS[p.tag] ?? colors.primary,
      content: p.content,
      likes: p.likeCount,
      pot: p.pot ?? undefined,
      timeAgo: formatTimeAgo(new Date(p.createdAt).getTime()),
    }));

  const aiTrendPosts: TrendPost[] = aiPosts.slice(0, 8).map((p, i) => ({
    id: p.id,
    user: p.personality.username,
    avatar: p.personality.avatarInitials[0],
    avatarColor: p.personality.avatarColor,
    avatarId: (i % 8) + 1,
    type: p.tag,
    typeColor: p.tagColor,
    content: p.content,
    likes: p.likes,
    pot: p.pot,
    timeAgo: p.timeAgo,
  }));

  // Real player posts always take priority — AI posts are filler used only to
  // top up the carousel when there aren't enough real posts to fill it.
  const trendingPosts: TrendPost[] = [
    ...realTrendPosts,
    ...aiTrendPosts.slice(0, Math.max(0, 8 - realTrendPosts.length)),
  ];

  // Hero height: covers status bar + logo section (logo image + subtitle + padding)
  const HERO_H = insets.top + 8 + LOGO_IMG_H + 52;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark
          ? [colors.background, '#080020', colors.background]
          : [colors.background, colors.surfaceElevated, colors.background]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* ── Miami skyline hero backdrop ─────────────────────────────────────── */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: HERO_H, zIndex: 0, overflow: 'hidden' }}>
        {/* City image: exact Miami skyline — sharp and prominent */}
        <Image
          source={SKYLINE_IMG}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.92 }}
          resizeMode="cover"
          blurRadius={1}
        />
        {/* Barely-there dark tint — lets the city breathe, keeps logo readable */}
        <LinearGradient
          colors={['rgba(3,0,12,0.20)', 'rgba(4,0,12,0.08)', 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        />
        {/* Miami purple/magenta haze — mirrors the neon city glow */}
        <LinearGradient
          colors={['rgba(55,5,100,0.28)', 'rgba(0,35,70,0.12)', 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        />
        {/* Bottom dissolve — skyline fades cleanly into background */}
        <LinearGradient
          colors={['transparent', 'rgba(5,0,16,0.55)', 'rgba(5,0,16,0.90)', '#050010']}
          locations={[0.0, 0.46, 0.74, 1.0]}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: HERO_H * 0.52 }}
          start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        />
      </View>

      {/* Top-left: music toggle */}
      <TouchableOpacity
        style={[styles.topLeft, { top: insets.top + (Platform.OS === 'web' ? 20 : 8), zIndex: 20 }]}
        onPress={toggleMusicMute}
        activeOpacity={0.8}
      >
        <View style={[styles.topIconBtn, { borderColor: isMusicMuted ? colors.border : `${colors.primary}60`, backgroundColor: colors.surface }]}>
          <Ionicons
            name={isMusicMuted ? 'musical-notes-outline' : 'musical-notes'}
            size={18}
            color={isMusicMuted ? colors.textMuted : colors.primary}
          />
        </View>
      </TouchableOpacity>

      {/* Top-right: notification bell */}
      <TouchableOpacity
        style={[styles.topCorner, { top: insets.top + (Platform.OS === 'web' ? 20 : 8), zIndex: 20 }]}
        onPress={() => router.push('/notifications' as any)}
        activeOpacity={0.8}
      >
        <View style={[
          styles.topIconBtn,
          {
            borderColor: unreadCount > 0 ? `${colors.primary}80` : colors.border,
            backgroundColor: colors.surface,
          },
        ]}>
          <Ionicons
            name={unreadCount > 0 ? 'notifications' : 'notifications-outline'}
            size={18}
            color={unreadCount > 0 ? colors.primary : colors.textMuted}
          />
        </View>
        {unreadCount > 0 && (
          <View style={[styles.notifBadge, { backgroundColor: '#ff0090', borderColor: colors.background }]}>
            <Text style={styles.notifBadgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 80, paddingTop: insets.top + 8 }]}
        showsVerticalScrollIndicator={false}
      >
        <ChipSocietyLogo />

        {/* 1 ─── Daily Rewards ─── */}
        <View style={styles.sectionRow}>
          <View style={styles.activeBadge}>
            <Ionicons name="diamond" size={11} color="rgba(160,130,255,0.90)" />
            <Text style={[styles.sectionTitle, { color: 'rgba(200,185,255,0.88)' }]}>DAILY REWARDS</Text>
          </View>
        </View>
        <RewardRow />

        {/* 2 ─── Trending Now ─── */}
        <View style={styles.sectionRow}>
          <View style={styles.activeBadge}>
            <Ionicons name="flame" size={13} color="#ff6040" />
            <Text style={[styles.sectionTitle, { color: 'rgba(255,215,205,0.88)' }]}>TRENDING NOW</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/feed')}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          ref={trendScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={width * 0.82 + 14}
          decelerationRate="fast"
          style={{ marginHorizontal: -16 }}
          contentContainerStyle={{ paddingLeft: 24, paddingRight: 24, paddingTop: 8, paddingBottom: 32, gap: 14 }}
        >
          {trendingPosts.map(post => <TrendCard key={post.id} post={post} />)}
        </ScrollView>

        {/* 3 ─── Daily Missions ─── */}
        <DailyMissionsPanel />

        {/* 4 ─── Quick Play ─── */}
        <QuickPlayCard />

        {/* 4 ─── Featured Tournaments ─── */}
        <View style={styles.sectionRow}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>TOURNAMENTS</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/tournaments')}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
          </TouchableOpacity>
        </View>
        <TournamentCarousel userChips={profile.chips} />
        <EarlyAccessBanner />

        {/* 5 ─── Player Stats ─── */}
        <View style={styles.sectionRow}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>YOUR STATS</Text>
          <Text style={[styles.seeAll, { color: colors.textDim }]}>{profile.rank}</Text>
        </View>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderColor: `${colors.success}30` }]}>
            <Text style={[styles.statVal, { color: colors.success }]}>{profile.wins}</Text>
            <Text style={styles.statLbl}>WINS</Text>
          </View>
          <View style={[styles.statCard, { borderColor: `${colors.primary}30` }]}>
            <Text style={[styles.statVal, { color: colors.primary }]}>{profile.handsPlayed}</Text>
            <Text style={styles.statLbl}>HANDS</Text>
          </View>
          <View style={[styles.statCard, { borderColor: `${colors.gold}30` }]}>
            <Text style={[styles.statVal, { color: colors.gold }]}>{formatChips(profile.chips)}</Text>
            <Text style={styles.statLbl}>CHIPS</Text>
          </View>
          <View style={[styles.statCard, { borderColor: `${rankColor}30` }]}>
            <Text style={[styles.statVal, { color: rankColor }]}>{profile.level}</Text>
            <Text style={styles.statLbl}>LEVEL</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────



const logo = StyleSheet.create({
  wrap: { alignItems: 'center', paddingTop: 0, paddingBottom: 14 },
  img: {
    width: LOGO_IMG_W,
    height: LOGO_IMG_H,
    marginBottom: 6,
  },
  sub: {
    fontFamily: 'Orbitron_400Regular',
    fontSize: 11,
    color: 'rgba(200,220,255,0.72)',
    letterSpacing: 7,
    marginTop: 4,
    width: LOGO_IMG_W,
    textAlign: 'center',
    textShadowColor: 'rgba(0,212,255,0.45)',
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 0 },
  },
  glowCyan: {
    position: 'absolute',
    width: LOGO_IMG_W,
    height: LOGO_IMG_H * 1.1,
    borderRadius: LOGO_IMG_W / 2,
    top: 0,
    left: 0,
  },
  glowPurple: {
    position: 'absolute',
    width: LOGO_IMG_W * 0.8,
    height: LOGO_IMG_H,
    borderRadius: LOGO_IMG_W * 0.4,
    top: 0,
    left: LOGO_IMG_W * 0.1,
  },
});

const trend = StyleSheet.create({
  cardOuter: {
    shadowColor: '#8833ff',
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  card: {
    width: width * 0.82,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    overflow: 'hidden',
    gap: 9,
  },
  accentTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 2 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surface, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '700' },
  username: { color: colors.text, fontSize: 13, fontWeight: '700' },
  typeBadge: {
    alignSelf: 'flex-start', borderRadius: 8, borderWidth: 1,
    paddingHorizontal: 7, paddingVertical: 2, marginTop: 3,
  },
  typeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.8, fontFamily: 'Orbitron_700Bold' },
  potBadge: { alignItems: 'center' },
  potLabel: { color: colors.textDim, fontSize: 8, letterSpacing: 1 },
  potAmt: { color: colors.gold, fontSize: 15, fontWeight: '800', fontFamily: 'Inter_700Bold' },
  content: { color: 'rgba(255,255,255,0.65)', fontSize: 12, lineHeight: 18 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  likeCount: { color: colors.textMuted, fontSize: 12 },
  timeAgo: { color: colors.textDim, fontSize: 11 },
});


const qp = StyleSheet.create({
  card: {
    borderRadius: 24, borderWidth: 1, borderColor: 'rgba(0,212,255,0.15)',
    overflow: 'hidden', padding: 18, gap: 14,
    shadowColor: '#00d4ff', shadowOpacity: 0.12, shadowRadius: 20,
    shadowOffset: { width: 0, height: 5 }, elevation: 7,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  title: {
    fontSize: 13, fontWeight: '800', letterSpacing: 2,
    fontFamily: 'Orbitron_700Bold',
  },
  stepLabel: {
    fontSize: 8, fontWeight: '700', letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.35)', fontFamily: 'Orbitron_400Regular',
  },
  carousel:       { marginHorizontal: -18, marginBottom: -4 },
  carouselContent: { paddingHorizontal: 18, gap: 9, flexDirection: 'row' },
  variantCard: {
    width: 138, borderRadius: 12, borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 11, overflow: 'hidden', position: 'relative',
  },
  variantIconWrap: {
    width: 36, height: 36, borderRadius: 9, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)', marginBottom: 8,
  },
  variantName: {
    fontSize: 9.5, fontWeight: '800', letterSpacing: 0.3,
    fontFamily: 'Orbitron_700Bold', lineHeight: 13, marginBottom: 4,
  },
  variantSub:   { color: 'rgba(255,255,255,0.32)', fontSize: 8.5, lineHeight: 12 },
  variantCheck: { position: 'absolute', top: 8, right: 8 },
  seatRow: { flexDirection: 'row', gap: 10 },
  seatBtn: {
    flex: 1, borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: 12, alignItems: 'center', gap: 2, overflow: 'hidden',
  },
  seatNum: { fontSize: 28, fontWeight: '900', fontFamily: 'Inter_700Bold', lineHeight: 32 },
  seatLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  seatSub: { color: 'rgba(255,255,255,0.35)', fontSize: 9, marginTop: 2 },
  stakeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 4, paddingVertical: 6, marginBottom: 4,
  },
  stakeText: {
    color: 'rgba(255,255,255,0.40)', fontSize: 10,
    fontFamily: 'Orbitron_700Bold', letterSpacing: 0.8,
  },
  startBtn: {
    borderRadius: 12, overflow: 'hidden',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, gap: 8,
  },
  startText: {
    color: '#050010', fontSize: 14, fontWeight: '900',
    letterSpacing: 1.5, fontFamily: 'Orbitron_700Bold',
  },
});

const rr = StyleSheet.create({
  glassCard: {
    borderRadius: 24, borderWidth: 1, overflow: 'hidden',
    height: '100%',
    shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 5 }, elevation: 8,
  },
  floatArea: {
    alignItems: 'center', flex: 1,
    justifyContent: 'space-evenly',
    paddingVertical: 10, paddingHorizontal: 8,
  },
  spotlight: {
    position: 'absolute', width: 62, height: 62, borderRadius: 31,
  },
  ringWrap: {
    width: 70, height: 70, alignItems: 'center', justifyContent: 'center',
  },
  label: {
    fontSize: 9, fontWeight: '800', letterSpacing: 1,
    fontFamily: 'Orbitron_700Bold',
  },
  timerCapsule: {
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1, borderColor: 'rgba(0,212,255,0.22)',
    overflow: 'hidden', minWidth: 76, alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  timerText: {
    fontSize: 9, fontWeight: '900', letterSpacing: 0.5,
    color: 'rgba(255,255,255,0.78)', fontFamily: 'Inter_700Bold',
  },
  claimBtn: {
    borderRadius: 12, paddingHorizontal: 18, paddingVertical: 8,
    borderWidth: 1, overflow: 'hidden', alignItems: 'center', minWidth: 76,
  },
  claimText: {
    fontSize: 10, fontWeight: '900', letterSpacing: 1.5,
    fontFamily: 'Orbitron_700Bold',
  },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  topCorner: {
    position: 'absolute', right: 16, zIndex: 10,
  },
  topLeft: {
    position: 'absolute', left: 16, zIndex: 10,
  },
  topIconBtn: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#00d4ff', shadowOpacity: 0.14, shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 }, elevation: 5,
  },
  notifBadge: {
    position: 'absolute', top: -2, right: -2,
    minWidth: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, paddingHorizontal: 3,
  },
  notifBadgeText: {
    color: '#fff', fontSize: 9, fontWeight: '900', lineHeight: 12,
  },
  scroll: { paddingHorizontal: 16, gap: 12 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 2, fontFamily: 'Orbitron_400Regular' },
  seeAll: { color: colors.primary, fontSize: 11, fontWeight: '600' },
  activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ff4455' },
  activeCount: { color: '#ff4455', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, borderRadius: 18, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    backgroundColor: 'rgba(5,1,14,0.88)', padding: 12, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 }, elevation: 4,
  },
  statVal: { fontSize: 20, fontWeight: '800', fontFamily: 'Inter_700Bold' },
  statLbl: { color: colors.textMuted, fontSize: 9, letterSpacing: 1.5, marginTop: 3, fontFamily: 'Orbitron_400Regular' },
});
