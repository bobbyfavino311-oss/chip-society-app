import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { useSoundSettings } from '@/context/SoundContext';
import { useColors } from '@/hooks/useColors';
import { useNotifications } from '@/context/NotificationContext';
import { MusicEngine } from '@/lib/musicEngine';
import { useAISocial } from '@/context/AISocialContext';
import NeonAvatar from '@/components/NeonAvatar';

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

// ─── Tournament Preview Hub ────────────────────────────────────────────────────

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

interface TPreviewCard {
  id: string;
  emoji: string;
  name: string;
  color: string;
  badge: string;
  features: string[];
}

const PREVIEW_CARDS: TPreviewCard[] = [
  {
    id: '1', emoji: '🏆', name: 'CHIP SOCIETY CHAMPIONSHIP', color: colors.gold,
    badge: 'COMING SOON',
    features: ['Multi-table tournament', 'Championship events', 'Final table spotlight', 'Massive future prize pools'],
  },
  {
    id: '2', emoji: '⚡', name: 'TURBO SHOWDOWN', color: colors.primary,
    badge: 'IN DEVELOPMENT',
    features: ['Fast blind increases', 'Shorter tournament sessions', 'Faster action', 'Quick competitive play'],
  },
  {
    id: '3', emoji: '🐉', name: 'FOUR DRAGONS EVENT', color: colors.secondary,
    badge: 'COMING SOON',
    features: ['Four Dragons themed event', 'Limited-time format', 'Special rewards', 'Seasonal competition'],
  },
  {
    id: '4', emoji: '💰', name: 'HIGH ROLLER SERIES', color: '#bf5fff',
    badge: 'IN DEVELOPMENT',
    features: ['Elite stakes', 'Premium competition', 'Exclusive events', 'Large future prize pools'],
  },
  {
    id: '5', emoji: '🎭', name: 'SEASONAL EVENTS', color: '#00e887',
    badge: 'COMING SOON',
    features: ['Holiday events', 'Community competitions', 'Special game modes', 'Limited-time rewards'],
  },
];

function TournamentPreviewCard({ card }: { card: TPreviewCard }) {
  return (
    <View style={[tc.card, { borderColor: `${card.color}30` }]}>
      <LinearGradient
        colors={['#120020', '#080018', '#050010']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />
      <LinearGradient
        colors={[`${card.color}15`, 'transparent']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 0.9, y: 0.7 }}
      />
      <View style={[tc.accentBar, { backgroundColor: card.color }]} />
      <View style={tc.body}>
        <View style={tc.topRow}>
          <View style={[tc.badge, { backgroundColor: `${card.color}15`, borderColor: `${card.color}40` }]}>
            <Ionicons name="time-outline" size={8} color={card.color} />
            <Text style={[tc.badgeText, { color: card.color }]}>{card.badge}</Text>
          </View>
        </View>
        <Text style={tc.emoji}>{card.emoji}</Text>
        <Text style={[tc.name, { color: card.color }]} numberOfLines={2}>{card.name}</Text>
        <View style={tc.featureList}>
          {card.features.map((f, i) => (
            <View key={i} style={tc.featureRow}>
              <Ionicons name="chevron-forward" size={9} color={`${card.color}80`} />
              <Text style={tc.featureText}>{f}</Text>
            </View>
          ))}
        </View>
        <View style={[tc.comingSoonBar, { borderColor: `${card.color}30` }]}>
          <Ionicons name="lock-closed-outline" size={10} color={`${card.color}60`} />
          <Text style={[tc.comingSoonText, { color: `${card.color}70` }]}>ARRIVING IN A FUTURE UPDATE</Text>
        </View>
      </View>
    </View>
  );
}

function TournamentPreviewHub() {
  const [notified, setNotified] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('tournamentNotify').then(v => { if (v === '1') setNotified(true); });
  }, []);

  const handleNotify = async () => {
    setNotified(true);
    await AsyncStorage.setItem('tournamentNotify', '1');
  };

  return (
    <View style={tour.wrap}>
      {/* Main feature card */}
      <View style={tour.featCard}>
        <LinearGradient colors={['#1a0035', '#0a001f', '#050010']} style={StyleSheet.absoluteFill} />
        <LinearGradient colors={[`${colors.gold}18`, 'transparent']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        <View style={[tour.featBar, { backgroundColor: colors.gold }]} />
        <View style={tour.featBody}>
          <View style={tour.featBadgeRow}>
            <View style={tour.featBadge}>
              <Ionicons name="time-outline" size={9} color={colors.gold} />
              <Text style={tour.featBadgeText}>COMING SOON</Text>
            </View>
          </View>
          <Text style={tour.featEmoji}>🏆</Text>
          <Text style={tour.featTitle}>CHIP SOCIETY{'\n'}CHAMPIONSHIP</Text>
          <Text style={tour.featDesc}>
            Compete against players worldwide in multi-table poker tournaments featuring championship prize pools, final table action, and competitive events.
          </Text>
          {/* Notify button */}
          {notified ? (
            <View style={tour.notifiedRow}>
              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              <Text style={tour.notifiedText}>We'll notify you when tournaments launch.</Text>
            </View>
          ) : (
            <TouchableOpacity style={tour.notifyBtn} onPress={handleNotify} activeOpacity={0.8}>
              <LinearGradient colors={[`${colors.gold}25`, `${colors.gold}10`]} style={StyleSheet.absoluteFill} />
              <Ionicons name="notifications-outline" size={14} color={colors.gold} />
              <Text style={tour.notifyBtnText}>NOTIFY ME</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Horizontal preview cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={width * 0.72 + 12}
        decelerationRate="fast"
        snapToAlignment="start"
        contentContainerStyle={{ gap: 12, paddingRight: 16 }}
      >
        {PREVIEW_CARDS.map(c => <TournamentPreviewCard key={c.id} card={c} />)}
      </ScrollView>
    </View>
  );
}

// ─── Quick Play inline launcher ──────────────────────────────────────────────

/** Maps a chip count to the matching practice stake-tier key. */
function getAutoTierKey(chips: number): string {
  if (chips >= 2_500_000) return 'elite';
  if (chips >= 250_000)   return 'highroller';
  if (chips >= 25_000)    return 'mid';
  if (chips >= 5_000)     return 'casual';
  return 'beginner';
}

const TIER_BLIND_LABELS: Record<string, string> = {
  beginner:   '25 / 50',
  casual:     '50 / 100',
  mid:        '250 / 500',
  highroller: '2.5K / 5K',
  elite:      '25K / 50K',
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
        colors={['#120022', '#08001a', '#050010']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
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

function ChipSocietyLogo() {
  const aceOpacity  = useRef(new Animated.Value(1)).current;
  const socOpacity  = useRef(new Animated.Value(1)).current;
  const aceGlow     = useRef(new Animated.Value(1)).current;
  const socialGlow  = useRef(new Animated.Value(0.82)).current;
  const [acePink, setAcePink] = useState(false);
  const timeoutRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Slow alternating breathe between the two words
    Animated.loop(
      Animated.sequence([
        Animated.timing(aceGlow, { toValue: 0.82, duration: 2200, useNativeDriver: true }),
        Animated.timing(aceGlow, { toValue: 1,    duration: 2200, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(socialGlow, { toValue: 1,    duration: 2200, useNativeDriver: true }),
        Animated.timing(socialGlow, { toValue: 0.82, duration: 2200, useNativeDriver: true }),
      ])
    ).start();

    // Neon-tube stutter on one word at a time, then swap colors
    function flicker(anim: Animated.Value, cb: () => void) {
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.08, duration: 35, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.9,  duration: 55, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.15, duration: 25, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1,    duration: 70, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0,    duration: 30, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1,    duration: 90, useNativeDriver: true }),
      ]).start(() => cb());
    }

    function scheduleNext() {
      const delay = 2500 + Math.random() * 4000;
      timeoutRef.current = setTimeout(() => {
        const doAce = Math.random() > 0.5;
        flicker(doAce ? aceOpacity : socOpacity, () => {
          setAcePink(p => !p);
          scheduleNext();
        });
      }, delay);
    }
    scheduleNext();

    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  const chipColor = acePink ? colors.secondary : colors.primary;
  const socColor  = acePink ? colors.primary   : colors.secondary;

  return (
    <View style={logo.wrap}>
      <View style={logo.wordGroup}>
        <Animated.Text
          style={[
            logo.word,
            {
              color: chipColor,
              lineHeight: LOGO_LINE_HEIGHT,
              opacity: Animated.multiply(aceOpacity, aceGlow),
              textShadowColor: chipColor,
              textShadowRadius: 28,
              textShadowOffset: { width: 0, height: 0 },
            },
          ]}
          allowFontScaling={false}
        >
          Chip
        </Animated.Text>
        <Animated.Text
          style={[
            logo.word,
            {
              color: socColor,
              lineHeight: LOGO_LINE_HEIGHT,
              opacity: Animated.multiply(socOpacity, socialGlow),
              textShadowColor: socColor,
              textShadowRadius: 28,
              textShadowOffset: { width: 0, height: 0 },
            },
          ]}
          allowFontScaling={false}
        >
          Society
        </Animated.Text>
      </View>
      <Text style={logo.sub} allowFontScaling={false}>TEXAS HOLD'EM POKER</Text>
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


// ─── Reward quick-access row (Spin + Streak only — Scratch is in Store) ───────
function RewardRow() {
  const { canClaimWheel, nextWheelIn, canClaimDaily, profile } = useUser();
  const c = useColors();

  const buttons = [
    {
      icon: '🎡',
      label: 'DAILY SPIN',
      badge: canClaimWheel ? 'READY' : `${Math.floor(nextWheelIn / 60)}h ${nextWheelIn % 60}m`,
      badgeActive: canClaimWheel,
      color: '#bf5fff',
      route: '/rewards/wheel',
    },
    {
      icon: '🔥',
      label: 'STREAK',
      badge: canClaimDaily ? 'CLAIM' : `DAY ${profile.streakDays || 1}`,
      badgeActive: canClaimDaily,
      color: '#ffd700',
      route: '/rewards/streak',
    },
  ];

  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {buttons.map((b) => (
        <TouchableOpacity
          key={b.label}
          style={[
            {
              flex: 1, borderRadius: 14, borderWidth: 1, overflow: 'hidden',
              paddingVertical: 12, paddingHorizontal: 8,
              alignItems: 'center', gap: 5,
              backgroundColor: c.surface,
              borderColor: b.badgeActive ? `${b.color}55` : c.border,
            },
          ]}
          onPress={() => router.push(b.route as any)}
          activeOpacity={0.8}
        >
          {b.badgeActive && (
            <LinearGradient colors={[`${b.color}22`, 'transparent']} style={StyleSheet.absoluteFill} />
          )}
          <Text style={{ fontSize: 24 }}>{b.icon}</Text>
          <Text style={{ fontSize: 8, fontWeight: '800', letterSpacing: 0.8, color: b.badgeActive ? b.color : c.textMuted }}>
            {b.label}
          </Text>
          <View style={{ borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, backgroundColor: b.badgeActive ? b.color : c.surfaceElevated }}>
            <Text style={{ fontSize: 8, fontWeight: '900', letterSpacing: 0.5, color: b.badgeActive ? '#050010' : c.textMuted }}>
              {b.badge}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function TrendCard({ post }: { post: TrendPost }) {
  const [liked, setLiked] = useState(false);
  return (
    <View style={trend.card}>
      <LinearGradient
        colors={['#1a0035', '#0d0020']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
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
  );
}


// ─── Main screen ─────────────────────────────────────────────────────────────

export default function HomeScreen() {
  // ─── All hooks at the top, before any non-hook code ───────────────────────
  const insets = useSafeAreaInsets();
  const { profile, isLoaded } = useUser();
  const colors = useColors();
  const { isDark, toggleTheme } = useTheme();
  const { isMusicMuted, toggleMusicMute } = useSoundSettings();
  const { unreadCount } = useNotifications();
  const { posts: aiPosts } = useAISocial();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const dropAnim = useRef(new Animated.Value(0)).current;
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

  // Auto-scroll trending carousel every 3.5 s (dep on aiPosts.length — same signal)
  useEffect(() => {
    const CARD_W = width * 0.72 + 12;
    const timer = setInterval(() => {
      const postCount = Math.min(8, aiPosts.length);
      if (!trendScrollRef.current || postCount < 2) return;
      trendIndexRef.current = (trendIndexRef.current + 1) % postCount;
      trendScrollRef.current.scrollTo({ x: trendIndexRef.current * CARD_W, animated: true });
    }, 3500);
    return () => clearInterval(timer);
  }, [aiPosts.length]);

  // ─── Derived values (must be before effects that reference them) ──────────
  const rankColor = RANK_COLORS[profile.rank] ?? colors.primary;
  const formatChips = (n: number): string => {
    const v = (x: number) => x % 1 === 0 ? x.toFixed(0) : x.toFixed(1);
    if (n >= 1_000_000_000) return `${v(n / 1_000_000_000)}B`;
    if (n >= 1_000_000)     return `${v(n / 1_000_000)}M`;
    if (n >= 1_000)         return `${v(n / 1_000)}K`;
    return String(n);
  };

  const trendingPosts: TrendPost[] = aiPosts.slice(0, 8).map((p, i) => ({
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

  const openSettings = () => {
    setSettingsOpen(true);
    Animated.spring(dropAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 10 }).start();
  };
  const closeSettings = () => {
    Animated.timing(dropAnim, { toValue: 0, duration: 140, useNativeDriver: true }).start(() => setSettingsOpen(false));
  };

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

      {/* Backdrop to close settings when tapping outside */}
      {settingsOpen && (
        <TouchableOpacity
          style={[StyleSheet.absoluteFillObject, { zIndex: 5 }]}
          onPress={closeSettings}
          activeOpacity={1}
        />
      )}

      {/* Top-left: notification bell */}
      <TouchableOpacity
        style={[styles.topLeft, { top: insets.top + (Platform.OS === 'web' ? 20 : 8), zIndex: 20 }]}
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

      {/* Top-right: music + gear + avatar */}
      <View style={[styles.topCorner, { top: insets.top + (Platform.OS === 'web' ? 20 : 8), zIndex: 20 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {/* Music toggle */}
          <TouchableOpacity onPress={toggleMusicMute} activeOpacity={0.8}>
            <View style={[styles.topAvatar, { borderColor: isMusicMuted ? colors.border : colors.primary + '60', backgroundColor: colors.surface }]}>
              <Ionicons
                name={isMusicMuted ? 'musical-notes-outline' : 'musical-notes'}
                size={17}
                color={isMusicMuted ? colors.textMuted : colors.primary}
              />
            </View>
          </TouchableOpacity>
          {/* Settings gear */}
          <TouchableOpacity onPress={settingsOpen ? closeSettings : openSettings} activeOpacity={0.8}>
            <View style={[styles.topAvatar, { borderColor: settingsOpen ? colors.primary : colors.border, backgroundColor: colors.surface }]}>
              <Ionicons
                name={settingsOpen ? 'close' : 'settings-outline'}
                size={18}
                color={settingsOpen ? colors.primary : colors.textMuted}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Settings dropdown panel */}
        {settingsOpen && (
          <Animated.View
            style={[
              styles.settingsDropdown,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                opacity: dropAnim,
                transform: [{ translateY: dropAnim.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }) }],
              },
            ]}
          >
            {/* Profile row */}
            <TouchableOpacity
              style={styles.settingsItem}
              onPress={() => { closeSettings(); setTimeout(() => router.push('/(tabs)/profile'), 180); }}
              activeOpacity={0.7}
            >
              <Ionicons name="person-outline" size={18} color={colors.primary} />
              <Text style={[styles.settingsItemText, { color: colors.text }]}>Profile</Text>
              <Ionicons name="chevron-forward" size={15} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>

            <View style={[styles.settingsDivider, { backgroundColor: colors.border }]} />

            {/* Theme toggle row */}
            <View style={styles.settingsItem}>
              <Ionicons
                name={isDark ? 'moon-outline' : 'sunny-outline'}
                size={18}
                color={colors.accent}
              />
              <Text style={[styles.settingsItemText, { color: colors.text }]}>
                {isDark ? 'Dark Mode' : 'Light Mode'}
              </Text>
              <Switch
                value={!isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: `${colors.accent}55` }}
                thumbColor={!isDark ? colors.accent : colors.textMuted}
                style={{ marginLeft: 'auto', transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
              />
            </View>
          </Animated.View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 80, paddingTop: insets.top + 56 }]}
        showsVerticalScrollIndicator={false}
      >
        <ChipSocietyLogo />

        {/* 1 ─── Daily Rewards ─── */}
        <View style={styles.sectionRow}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>DAILY REWARDS</Text>
        </View>
        <RewardRow />

        {/* 2 ─── Trending Now ─── */}
        <View style={styles.sectionRow}>
          <View style={styles.activeBadge}>
            <View style={[styles.activeDot, { backgroundColor: colors.secondary }]} />
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>TRENDING NOW</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/feed')}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          ref={trendScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingRight: 16 }}
        >
          {trendingPosts.map(post => <TrendCard key={post.id} post={post} />)}
        </ScrollView>

        {/* 3 ─── Quick Play ─── */}
        <QuickPlayCard />

        {/* 4 ─── Featured Tournaments ─── */}
        <View style={styles.sectionRow}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>FEATURED TOURNAMENTS</Text>
          <View style={[styles.activeBadge, { borderColor: `${colors.gold}40`, backgroundColor: `${colors.gold}10` }]}>
            <Ionicons name="time-outline" size={9} color={colors.gold} />
            <Text style={[styles.activeCount, { color: colors.gold }]}>COMING SOON</Text>
          </View>
        </View>
        <Text style={tour.hubSub}>The next major feature coming to Chip Society.</Text>
        <TournamentPreviewHub />

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

const LOGO_SIZE = Math.min(46, width * 0.118);
// Web needs a forced line-height to keep the two Pacifico words snug;
// native uses the font's own metrics (forcing it clips the descender).
const LOGO_LINE_HEIGHT = Platform.select({ web: LOGO_SIZE * 1.12, default: undefined });

// ─── Tournament preview card styles ───────────────────────────────────────────
const tc = StyleSheet.create({
  card: {
    width: width * 0.72,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  accentBar: { width: 4 },
  body:      { flex: 1, padding: 14, gap: 8 },
  topRow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge: {
    borderRadius: 6, borderWidth: 1,
    paddingHorizontal: 6, paddingVertical: 2,
    flexDirection: 'row', alignItems: 'center', gap: 3,
  },
  badgeText:    { fontSize: 8, fontWeight: '800', letterSpacing: 0.4 },
  emoji:        { fontSize: 22, lineHeight: 28 },
  name: {
    fontSize: 13, fontWeight: '800',
    fontFamily: 'Orbitron_700Bold',
    letterSpacing: 0.2, lineHeight: 17,
  },
  featureList:  { gap: 4, marginTop: 2 },
  featureRow:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
  featureText:  { color: 'rgba(255,255,255,0.45)', fontSize: 10, lineHeight: 14, flex: 1 },
  comingSoonBar: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 7, borderWidth: 1,
    paddingHorizontal: 8, paddingVertical: 5, marginTop: 4,
  },
  comingSoonText: { fontSize: 8, fontWeight: '800', fontFamily: 'Orbitron_700Bold', letterSpacing: 0.8 },
});

// ─── Tournament hub wrapper styles ────────────────────────────────────────────
const tour = StyleSheet.create({
  wrap:     { gap: 12 },
  hubSub:   { color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: -8, marginBottom: 2 },

  featCard: {
    borderRadius: 18, borderWidth: 1, borderColor: `${colors.gold}35`,
    overflow: 'hidden', flexDirection: 'row',
  },
  featBar:  { width: 4, backgroundColor: colors.gold },
  featBody: { flex: 1, padding: 16, gap: 10 },
  featBadgeRow: { flexDirection: 'row' },
  featBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 6, borderWidth: 1,
    borderColor: `${colors.gold}40`, backgroundColor: `${colors.gold}15`,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  featBadgeText: { fontSize: 8, fontWeight: '800', fontFamily: 'Orbitron_700Bold', color: colors.gold, letterSpacing: 0.5 },
  featEmoji: { fontSize: 28, lineHeight: 34 },
  featTitle: {
    fontSize: 17, fontWeight: '900', fontFamily: 'Orbitron_900Black',
    color: colors.gold, letterSpacing: 0.5, lineHeight: 22,
  },
  featDesc:  { color: 'rgba(255,255,255,0.42)', fontSize: 12, lineHeight: 18 },

  notifyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 11, borderWidth: 1,
    borderColor: `${colors.gold}50`, overflow: 'hidden',
    paddingHorizontal: 14, paddingVertical: 10, alignSelf: 'flex-start',
  },
  notifyBtnText: {
    fontFamily: 'Orbitron_700Bold', fontSize: 11,
    color: colors.gold, letterSpacing: 1,
  },
  notifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  notifiedText: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
});

const logo = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 4 },
  wordGroup: { alignItems: 'center', paddingBottom: 22 },
  word: {
    fontFamily: 'Pacifico_400Regular',
    fontSize: LOGO_SIZE,
    color: '#e8f4ff',
  },
  sub: {
    fontFamily: 'Orbitron_400Regular',
    fontSize: 9,
    color: colors.textMuted,
    letterSpacing: 4,
  },
});

const trend = StyleSheet.create({
  card: {
    width: width * 0.72,
    borderRadius: colors.radiusLg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    overflow: 'hidden',
    gap: 8,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surface, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '700' },
  username: { color: colors.text, fontSize: 13, fontWeight: '700' },
  typeBadge: {
    alignSelf: 'flex-start', borderRadius: 4, borderWidth: 1,
    paddingHorizontal: 5, paddingVertical: 1, marginTop: 2,
  },
  typeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  potBadge: { alignItems: 'center' },
  potLabel: { color: colors.textDim, fontSize: 8, letterSpacing: 1 },
  potAmt: { color: colors.gold, fontSize: 15, fontWeight: '800', fontFamily: 'Inter_700Bold' },
  content: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  likeCount: { color: colors.textMuted, fontSize: 12 },
  timeAgo: { color: colors.textDim, fontSize: 11 },
});


const qp = StyleSheet.create({
  card: {
    borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden', padding: 18, gap: 14,
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
  settingsDropdown: {
    position: 'absolute',
    top: 50,
    right: 0,
    width: 224,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 14,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  settingsItemText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  settingsDivider: {
    height: 1,
    marginHorizontal: 12,
  },
  topAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.surface, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  scroll: { paddingHorizontal: 16, gap: 16 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 2, fontFamily: 'Orbitron_400Regular' },
  seeAll: { color: colors.primary, fontSize: 11, fontWeight: '600' },
  activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ff4455' },
  activeCount: { color: '#ff4455', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, borderRadius: colors.radius, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface, padding: 12, alignItems: 'center',
  },
  statVal: { fontSize: 20, fontWeight: '800', fontFamily: 'Inter_700Bold' },
  statLbl: { color: colors.textMuted, fontSize: 9, letterSpacing: 1.5, marginTop: 3, fontFamily: 'Orbitron_400Regular' },
});
