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
import colors from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { useSoundSettings } from '@/context/SoundContext';
import { useColors } from '@/hooks/useColors';
import { useNotifications } from '@/context/NotificationContext';
import { getCharacter } from '@/constants/characters';
import CharacterPortrait from '@/components/CharacterPortrait';
import { MusicEngine } from '@/lib/musicEngine';
import { useAISocial } from '@/context/AISocialContext';

const { width } = Dimensions.get('window');

const RANK_COLORS: Record<string, string> = {
  'Neon Bronze': '#cd7f32',
  'Neon Silver': '#a0a8c0',
  'Neon Gold': colors.gold,
  'Neon Platinum': '#a0f0ff',
  'Neon Diamond': '#b8f0ff',
  'Neon Elite': colors.secondary,
  'Neon Legend': colors.accent,
};

// ─── Live tournament pool ─────────────────────────────────────────────────────

interface LiveTournament {
  id: string;
  name: string;
  style: string;
  prizePool: number;
  buyIn: number;
  totalSeats: number;
  filledSeats: number;
  status: 'registering' | 'live' | 'late';
  endTime: number;
  accentColor: string;
}

const T_NAMES = [
  'VICE CITY CLASSIC', 'MIDNIGHT SHOWDOWN', 'CHROME SERIES',
  'ROYAL CIRCUIT', 'LASER STACK OPEN', 'TURBO HEAT CUP',
  'AFTER HOURS OPEN', 'BLACK CARD INVITATIONAL', 'SIT & GO RUSH',
  'CYBER SUNDAY CLASSIC', 'VAPOR WAVE CUP', 'CHROME CITY SERIES',
  'ELECTRIC SUNSET OPEN', 'RETROWAVE SHOWDOWN', 'MIAMI NIGHT SPECIAL',
  'CIRCUIT BREAKER SERIES', 'PULSE CITY MASTERS', 'CHROME STALLION CUP',
  'DIGITAL DUSK CLASSIC', 'GRID IRON INVITATIONAL',
];
const T_STYLES = ["No Limit Hold'em", "Pot Limit Omaha", "Turbo Hold'em", 'Short Deck NL'];
const T_COLORS = [colors.primary, colors.secondary, colors.gold, '#00ff88', '#bf5fff'];
const T_PRIZES = [10000, 25000, 50000, 100000, 250000, 500000, 1000000];
const T_BUYINS = [100, 250, 500, 1000, 2500];
const T_SEATS = [64, 128, 256, 512];

function makeTournament(usedNames: Set<string>): LiveTournament {
  const pool = T_NAMES.filter(n => !usedNames.has(n));
  const nameList = pool.length > 0 ? pool : T_NAMES;
  const name = nameList[Math.floor(Math.random() * nameList.length)];
  const totalSeats = T_SEATS[Math.floor(Math.random() * T_SEATS.length)];
  const filledSeats = Math.floor(totalSeats * (0.2 + Math.random() * 0.75));
  const roll = Math.random();
  const status: LiveTournament['status'] = roll > 0.5 ? 'live' : roll > 0.25 ? 'registering' : 'late';
  return {
    id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
    name,
    style: T_STYLES[Math.floor(Math.random() * T_STYLES.length)],
    prizePool: T_PRIZES[Math.floor(Math.random() * T_PRIZES.length)],
    buyIn: T_BUYINS[Math.floor(Math.random() * T_BUYINS.length)],
    totalSeats,
    filledSeats,
    status,
    endTime: Date.now() + (4 + Math.floor(Math.random() * 56)) * 60_000,
    accentColor: T_COLORS[Math.floor(Math.random() * T_COLORS.length)],
  };
}

function initTournamentPool(): LiveTournament[] {
  const used = new Set<string>();
  return Array.from({ length: 6 }, () => {
    const t = makeTournament(used);
    used.add(t.name);
    return t;
  });
}

const STATUS_LABELS = { live: '● LIVE', registering: 'REGISTERING', late: 'LATE REG' };
const STATUS_COLORS = { live: '#ff4455', registering: colors.success, late: colors.gold };

function TournamentCard({ t }: { t: LiveTournament }) {
  const msLeft = Math.max(0, t.endTime - Date.now());
  const totalSec = Math.floor(msLeft / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const timeStr = h > 0
    ? `${h}h ${m.toString().padStart(2, '0')}m`
    : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  const fmtPrize = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return String(n);
  };
  const fmtBuy = (n: number) => n >= 1000 ? `${n / 1000}K` : String(n);

  const sc = STATUS_COLORS[t.status];
  const fillPct = Math.min(100, Math.round((t.filledSeats / t.totalSeats) * 100));
  const seatsLeft = t.totalSeats - t.filledSeats;
  const isLive = t.status === 'live';

  return (
    <TouchableOpacity
      style={[tc.card, { borderColor: `${t.accentColor}55` }]}
      onPress={() => router.push('/(tabs)/tournaments' as any)}
      activeOpacity={0.88}
    >
      {/* Deep gradient */}
      <LinearGradient
        colors={['#160028', '#080018', '#050010']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      {/* Accent glow at top-left */}
      <LinearGradient
        colors={[`${t.accentColor}28`, 'transparent']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.85, y: 0.65 }}
      />
      {/* Left color bar */}
      <View style={[tc.accentBar, { backgroundColor: t.accentColor }]} />

      <View style={tc.body}>
        {/* Status pill + countdown */}
        <View style={tc.topRow}>
          <View style={[tc.badge, { backgroundColor: `${sc}20`, borderColor: `${sc}50` }]}>
            {isLive && <View style={[tc.liveDot, { backgroundColor: sc }]} />}
            <Text style={[tc.badgeText, { color: sc }]}>{STATUS_LABELS[t.status]}</Text>
          </View>
          <Text style={tc.timeLeft}>{timeStr}</Text>
        </View>

        {/* Tournament name + game type */}
        <Text style={[tc.name, { color: t.accentColor }]} numberOfLines={2}>{t.name}</Text>
        <Text style={tc.variant}>{t.style}</Text>

        {/* Prize pool + seats remaining */}
        <View style={tc.prizeRow}>
          <View>
            <Text style={tc.subLabel}>PRIZE POOL</Text>
            <Text style={[tc.prize, { color: t.accentColor }]}>{fmtPrize(t.prizePool)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={tc.subLabel}>SEATS LEFT</Text>
            <Text style={tc.seats}>{seatsLeft}</Text>
          </View>
        </View>

        {/* Fill progress */}
        <View style={tc.barWrap}>
          <View style={[tc.barFill, { width: `${fillPct}%` as any, backgroundColor: t.accentColor }]} />
        </View>

        {/* Buy-in + Join button */}
        <View style={tc.bottomRow}>
          <Text style={tc.buyIn}>BUY-IN  {fmtBuy(t.buyIn)} chips</Text>
          <View style={[tc.joinBtn, { backgroundColor: t.accentColor }]}>
            <Text style={tc.joinText}>JOIN →</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
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
  type: string;
  typeColor: string;
  content: string;
  likes: number;
  pot?: string;
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
        <View style={[trend.avatar, { borderColor: post.avatarColor }]}>
          <Text style={[trend.avatarText, { color: post.avatarColor }]}>{post.avatar}</Text>
        </View>
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
        <Text style={trend.timeAgo}>2h ago</Text>
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
  const [tournaments, setTournaments] = useState<LiveTournament[]>(initTournamentPool);

  // ─── Effects ──────────────────────────────────────────────────────────────
  useEffect(() => {
    MusicEngine.play();
  }, []);

  useEffect(() => {
    if (isLoaded && profile.isNewUser) {
      router.replace('/onboarding');
    }
  }, [isLoaded, profile.isNewUser]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTournaments(prev => {
        const now = Date.now();
        const used = new Set(prev.map(t => t.name));
        return prev.map(t => {
          if (t.endTime <= now) {
            used.delete(t.name);
            const next = makeTournament(used);
            used.add(next.name);
            return next;
          }
          return { ...t };
        });
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ─── Derived values ────────────────────────────────────────────────────────
  const rankColor = RANK_COLORS[profile.rank] ?? colors.primary;

  const trendingPosts: TrendPost[] = aiPosts.slice(0, 5).map(p => ({
    id: p.id,
    user: p.personality.username,
    avatar: p.personality.avatarInitials[0],
    avatarColor: p.personality.avatarColor,
    type: p.tag,
    typeColor: p.tagColor,
    content: p.content,
    likes: p.likes,
    pot: p.pot,
  }));

  const formatChips = (n: number) => n.toLocaleString('en-US');

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
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        <ChipSocietyLogo />

        {/* ─── Rewards quick-access row ─── */}
        <RewardRow />

        {/* Quick Play CTA */}
        <TouchableOpacity
          style={styles.quickPlay}
          onPress={() => router.push('/game/practice')}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={[colors.primary, '#0055cc', '#8800ff']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
          <Ionicons name="flash" size={26} color="#fff" />
          <View style={{ flex: 1 }}>
            <Text style={styles.quickPlayTitle}>QUICK PLAY</Text>
            <Text style={styles.quickPlaySub}>AI Practice — Jump in instantly</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>

        {/* Live Tournaments — primary section, scrolling pool */}
        <View style={styles.sectionRow}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>LIVE TOURNAMENTS</Text>
          <View style={styles.activeBadge}>
            <View style={styles.activeDot} />
            <Text style={styles.activeCount}>{tournaments.length} ACTIVE</Text>
          </View>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={width * 0.80 + 12}
          decelerationRate="fast"
          snapToAlignment="start"
          contentContainerStyle={{ gap: 12, paddingRight: 16 }}
        >
          {tournaments.map(t => <TournamentCard key={t.id} t={t} />)}
        </ScrollView>

        {/* Trending Now — live AI social feed */}
        <View style={styles.sectionRow}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>TRENDING NOW</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/feed')}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingRight: 16 }}
        >
          {trendingPosts.map(post => <TrendCard key={post.id} post={post} />)}
        </ScrollView>

        {/* Stats snapshot */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statVal, { color: colors.success }]}>{profile.wins}</Text>
            <Text style={styles.statLbl}>WINS</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statVal, { color: colors.primary }]}>{profile.handsPlayed}</Text>
            <Text style={styles.statLbl}>HANDS</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statVal, { color: colors.gold }]}>Lv.{profile.level}</Text>
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

const tc = StyleSheet.create({
  card: {
    width: width * 0.80,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  accentBar: { width: 4 },
  body: { flex: 1, padding: 14, gap: 6 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: {
    borderRadius: 6, borderWidth: 1,
    paddingHorizontal: 7, paddingVertical: 3,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  liveDot: { width: 5, height: 5, borderRadius: 2.5 },
  badgeText: { fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  timeLeft: { color: colors.textMuted, fontSize: 10, fontFamily: 'Inter_700Bold' },
  name: {
    fontSize: 13, fontWeight: '800',
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.2, lineHeight: 17, marginTop: 2,
  },
  variant: { color: colors.textMuted, fontSize: 9 },
  prizeRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-end', marginTop: 2,
  },
  subLabel: { color: colors.textDim, fontSize: 7, letterSpacing: 1 },
  prize: { fontSize: 24, fontWeight: '800', fontFamily: 'Inter_700Bold', lineHeight: 28 },
  seats: { color: colors.text, fontSize: 18, fontWeight: '800', fontFamily: 'Inter_700Bold' },
  barWrap: { height: 3, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2 },
  barFill: { height: 3, borderRadius: 2 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  buyIn: { color: colors.textDim, fontSize: 9 },
  joinBtn: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 },
  joinText: { color: '#050010', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
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
  scroll: { paddingHorizontal: 16, gap: 16, paddingTop: 72 },
  quickPlay: {
    borderRadius: colors.radiusLg, overflow: 'hidden',
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 18, paddingHorizontal: 20, gap: 14,
  },
  quickPlayTitle: { color: '#fff', fontSize: 16, fontWeight: '800', fontFamily: 'Orbitron_700Bold', letterSpacing: 1 },
  quickPlaySub: { color: 'rgba(255,255,255,0.65)', fontSize: 11, marginTop: 2 },
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
