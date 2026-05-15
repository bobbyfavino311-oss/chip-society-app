import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '@/constants/colors';
import { useUser } from '@/context/UserContext';
import { SoundEngine } from '@/lib/soundEngine';
import { getAvatar } from '@/components/CasinoAvatars';

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

// ─── Animated logo ───────────────────────────────────────────────────────────

function ChipSocietyLogo() {
  const aceOpacity = useRef(new Animated.Value(1)).current;
  const socialOpacity = useRef(new Animated.Value(1)).current;
  const aceGlow = useRef(new Animated.Value(1)).current;
  const socialGlow = useRef(new Animated.Value(0.82)).current;
  const [acePink, setAcePink] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(aceGlow, { toValue: 0.82, duration: 2200, useNativeDriver: true }),
        Animated.timing(aceGlow, { toValue: 1, duration: 2200, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(socialGlow, { toValue: 1, duration: 2200, useNativeDriver: true }),
        Animated.timing(socialGlow, { toValue: 0.82, duration: 2200, useNativeDriver: true }),
      ])
    ).start();

    function flicker(anim: Animated.Value, cb: () => void) {
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.08, duration: 35, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.9, duration: 55, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.15, duration: 25, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 70, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 30, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 90, useNativeDriver: true }),
      ]).start(() => cb());
    }

    function scheduleNext() {
      const delay = 2500 + Math.random() * 4000;
      timeoutRef.current = setTimeout(() => {
        const doAce = Math.random() > 0.5;
        flicker(doAce ? aceOpacity : socialOpacity, () => {
          setAcePink(p => !p);
          scheduleNext();
        });
      }, delay);
    }

    scheduleNext();
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  const aceColor = acePink ? colors.secondary : colors.primary;
  const socialColor = acePink ? colors.primary : colors.secondary;

  return (
    <View style={logo.wrap}>
      {/* Crisp foreground letters with inline textShadow for neon glow */}
      <Animated.Text style={[logo.word, { color: aceColor, opacity: Animated.multiply(aceOpacity, aceGlow) }]} allowFontScaling={false}>
        Chip
      </Animated.Text>
      <Animated.Text style={[logo.word, { color: socialColor, opacity: Animated.multiply(socialOpacity, socialGlow) }]} allowFontScaling={false}>
        Society
      </Animated.Text>
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

const TRENDING_POSTS: TrendPost[] = [
  {
    id: '1',
    user: 'NightShark99',
    avatar: '♠',
    avatarColor: colors.primary,
    type: 'BIG WIN',
    typeColor: colors.success,
    content: 'Turned ♠A♠K into a Royal Flush on the river. 42K pot! 🔥',
    likes: 1240,
    pot: '42K',
  },
  {
    id: '2',
    user: 'VegasMirage',
    avatar: '♥',
    avatarColor: colors.secondary,
    type: 'BLUFF',
    typeColor: colors.accent,
    content: 'Triple-barrel bluff with 7-2 off on a paired board. They folded a set. 😈',
    likes: 887,
    pot: '18K',
  },
  {
    id: '3',
    user: 'NeonAce_',
    avatar: '♦',
    avatarColor: colors.gold,
    type: 'BAD BEAT',
    typeColor: colors.warning,
    content: 'Quad Aces cracked by a straight flush. The universe hates me.',
    likes: 2103,
    pot: '91K',
  },
];

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

// ─── Featured tournament card ─────────────────────────────────────────────────

function FeaturedTournament() {
  return (
    <View style={feat.card}>
      <LinearGradient
        colors={['#3a006a', '#1a0035', '#050010']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={feat.top}>
        <View style={feat.liveBadge}>
          <View style={feat.liveDot} />
          <Text style={feat.liveText}>REGISTERING</Text>
        </View>
        <Text style={feat.prizeLabel}>PRIZE POOL</Text>
        <Text style={feat.prize}>500K</Text>
      </View>
      <Text style={feat.name}>NEON CHAMPIONSHIP</Text>
      <Text style={feat.sub}>Sunday Night Special · No Limit Hold'em</Text>
      <View style={feat.meta}>
        <View style={feat.metaItem}>
          <Ionicons name="people" size={12} color={colors.textMuted} />
          <Text style={feat.metaText}>128 / 256</Text>
        </View>
        <View style={feat.metaItem}>
          <Ionicons name="time-outline" size={12} color={colors.textMuted} />
          <Text style={feat.metaText}>Starts in 3h 20m</Text>
        </View>
        <View style={feat.metaItem}>
          <Ionicons name="ticket" size={12} color={colors.textMuted} />
          <Text style={feat.metaText}>1,000 chips</Text>
        </View>
      </View>
      <TouchableOpacity style={feat.registerBtn} onPress={() => router.push('/tournaments' as any)} activeOpacity={0.85}>
        <Text style={feat.registerText}>VIEW TOURNAMENT</Text>
        <Ionicons name="chevron-forward" size={14} color={colors.background} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useUser();
  const rankColor = RANK_COLORS[profile.rank] ?? colors.primary;
  const buzzTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(
    useCallback(() => {
      function scheduleBuzz() {
        const delay = 7000 + Math.random() * 11000;
        buzzTimerRef.current = setTimeout(() => {
          SoundEngine.neonBuzz();
          scheduleBuzz();
        }, delay);
      }
      scheduleBuzz();
      return () => {
        if (buzzTimerRef.current) { clearTimeout(buzzTimerRef.current); buzzTimerRef.current = null; }
      };
    }, [])
  );

  const formatChips = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background, '#080020', colors.background]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Compact top profile bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + (Platform.OS === 'web' ? 20 : 0) }]}>
        <View style={[styles.topAvatar, { borderColor: rankColor }]}>
          {profile.avatarUri
            ? <Image source={{ uri: profile.avatarUri }} style={{ width: 34, height: 34, borderRadius: 17 }} />
            : getAvatar(profile.avatarIndex).render(34)
          }
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.topName}>{profile.username}</Text>
          <Text style={[styles.topRank, { color: rankColor }]}>{profile.rank}</Text>
        </View>
        <View style={styles.topChips}>
          <MaterialCommunityIcons name="poker-chip" size={14} color={colors.gold} />
          <Text style={styles.topChipsText}>{formatChips(profile.chips)}</Text>
        </View>
        <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push('/(tabs)/profile')}>
          <Ionicons name="settings-outline" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        <ChipSocietyLogo />

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

        {/* Trending now */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>TRENDING NOW</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/feed')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingRight: 16 }}
        >
          {TRENDING_POSTS.map(post => <TrendCard key={post.id} post={post} />)}
        </ScrollView>

        {/* Featured Tournament */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>FEATURED TOURNAMENT</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/tournaments')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        <FeaturedTournament />

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

const LOGO_SIZE = Math.min(62, width * 0.162);

const logo = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 4 },
  word: {
    fontFamily: 'Pacifico_400Regular',
    fontSize: LOGO_SIZE,
    lineHeight: LOGO_SIZE * 1.16,
    textShadowRadius: 20,
    textShadowOffset: { width: 0, height: 0 },
  },
  sub: {
    fontFamily: 'Orbitron_400Regular',
    fontSize: 9,
    color: colors.textMuted,
    letterSpacing: 4,
    marginTop: 12,
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
  potAmt: { color: colors.gold, fontSize: 15, fontWeight: '800', fontFamily: 'Orbitron_700Bold' },
  content: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  likeCount: { color: colors.textMuted, fontSize: 12 },
  timeAgo: { color: colors.textDim, fontSize: 11 },
});

const feat = StyleSheet.create({
  card: {
    borderRadius: colors.radiusLg, borderWidth: 1,
    borderColor: colors.borderBright, overflow: 'hidden', padding: 16, gap: 6,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,255,136,0.1)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(0,255,136,0.3)' },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.success },
  liveText: { color: colors.success, fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  prizeLabel: { color: colors.textDim, fontSize: 9, marginLeft: 'auto' },
  prize: { color: colors.gold, fontSize: 22, fontWeight: '800', fontFamily: 'Orbitron_700Bold' },
  name: { color: colors.text, fontSize: 18, fontWeight: '800', fontFamily: 'Orbitron_700Bold', letterSpacing: 1 },
  sub: { color: colors.textMuted, fontSize: 11 },
  meta: { flexDirection: 'row', gap: 14, marginTop: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: colors.textMuted, fontSize: 11 },
  registerBtn: {
    marginTop: 8, borderRadius: colors.radius, overflow: 'hidden',
    backgroundColor: colors.accent, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 12, gap: 6,
  },
  registerText: { color: colors.background, fontSize: 12, fontWeight: '800', fontFamily: 'Orbitron_700Bold', letterSpacing: 1 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  topAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surface, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  topAvatarText: { fontSize: 16, color: colors.primary },
  topName: { color: colors.text, fontSize: 13, fontWeight: '700' },
  topRank: { fontSize: 9, fontWeight: '600', letterSpacing: 0.5 },
  topChips: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,215,0,0.1)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(255,215,0,0.2)' },
  topChipsText: { color: colors.gold, fontSize: 12, fontWeight: '700' },
  settingsBtn: { padding: 4 },
  scroll: { paddingHorizontal: 16, gap: 16 },
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
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, borderRadius: colors.radius, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface, padding: 12, alignItems: 'center',
  },
  statVal: { fontSize: 20, fontWeight: '800', fontFamily: 'Orbitron_700Bold' },
  statLbl: { color: colors.textMuted, fontSize: 9, letterSpacing: 1.5, marginTop: 3, fontFamily: 'Orbitron_400Regular' },
});
