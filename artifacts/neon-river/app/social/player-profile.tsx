import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { useSocial } from '@/context/SocialContext';
import { useUser } from '@/context/UserContext';
import NeonAvatar from '@/components/NeonAvatar';
import {
  MOCK_PLAYERS, SOCIAL_POSTS, POST_TAG_COLORS, POKER_REACTIONS,
  type MockPlayer, type SocialPost,
} from '@/lib/socialData';
import { getPlayerProfile, followPlayer, unfollowPlayer, type PlayerProfile, type FeedPost } from '@/lib/socialApi';
import { useLiveFeed } from '@/context/LiveFeedContext';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBig(n: number): string {
  const v = (x: number) => x % 1 === 0 ? x.toFixed(0) : x.toFixed(1);
  if (n >= 1_000_000) return v(n / 1_000_000) + 'M';
  if (n >= 1_000) return v(n / 1_000) + 'K';
  return String(n);
}

const STATUS_LABEL: Record<string, string> = { online: 'Online', in_game: 'In Game', offline: 'Offline' };
const STATUS_COLOR: Record<string, string> = { online: '#00ff88', in_game: '#ffd700', offline: '#4a4060' };

// ── Unified player shape (covers both mock and API players) ───────────────────

interface DisplayPlayer {
  id: string;
  username: string;
  handle: string;
  avatar?: string;
  avatarColor: string;
  avatarId: number;
  bannerColors: [string, string];
  rank: string;
  level: number;
  chips: number;
  winRate: number;
  handsPlayed: number;
  biggestPot: number;
  followers: number;
  following: number;
  achievementCount: number;
  status: string;
  badges: Array<{ id: string; label: string; icon: string; color: string }>;
  bio: string;
  isMock: boolean;
}

function mockToDisplay(p: MockPlayer): DisplayPlayer {
  return {
    id: p.id, username: p.username, handle: p.handle, avatar: p.avatar,
    avatarColor: p.avatarColor, avatarId: p.avatarId ?? 1,
    bannerColors: p.bannerColors, rank: p.rank, level: p.level,
    chips: p.chips, winRate: p.winRate, handsPlayed: p.handsPlayed,
    biggestPot: p.biggestPot, followers: p.followers, following: p.following,
    achievementCount: p.achievementCount, status: p.status,
    badges: p.badges, bio: p.bio, isMock: true,
  };
}

function apiToDisplay(p: PlayerProfile): DisplayPlayer {
  return {
    id: p.playerId, username: p.username,
    handle: `@${p.username.toLowerCase().replace(/\s+/g, '')}`,
    avatarColor: '#00d4ff', avatarId: p.avatarIndex ?? 1,
    bannerColors: ['#001a40', '#000d20'],
    rank: p.rank, level: p.level,
    chips: p.chips, winRate: p.winRate, handsPlayed: p.handsPlayed,
    biggestPot: 0, followers: p.followerCount ?? 0, following: p.followingCount ?? 0,
    achievementCount: 0, status: p.status,
    badges: [], bio: 'Chip Society player.', isMock: false,
  };
}

// ── Live Mini Post Card (real FeedPosts from server) ─────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

function LiveMiniPostCard({ post }: { post: FeedPost }) {
  const typeColor = POST_TAG_COLORS[post.tag as keyof typeof POST_TAG_COLORS] ?? '#00d4ff';
  return (
    <View style={pc.wrap}>
      <LinearGradient colors={['#120025', '#080018']} style={StyleSheet.absoluteFill} />
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: colors.primary, opacity: 0.45 }} />
      <View style={pc.top}>
        <View style={[pc.badge, { borderColor: `${typeColor}50`, backgroundColor: `${typeColor}15` }]}>
          <Text style={[pc.badgeText, { color: typeColor }]}>{post.tag}</Text>
        </View>
        <Text style={pc.time}>{relativeTime(typeof post.createdAt === 'string' ? post.createdAt : (post.createdAt as Date).toISOString())}</Text>
      </View>
      <Text style={pc.content}>{post.content}</Text>
      {post.pot && (
        <View style={pc.pot}>
          <Ionicons name="layers" size={9} color={colors.gold} />
          <Text style={pc.potText}>Pot: <Text style={{ color: colors.gold }}>{post.pot}</Text></Text>
        </View>
      )}
      <View style={pc.footer}>
        <View style={pc.stat}>
          <Ionicons name="heart" size={11} color={colors.secondary} />
          <Text style={pc.statText}>{post.likeCount}</Text>
        </View>
        <View style={pc.stat}>
          <Ionicons name="chatbubble" size={11} color={colors.textMuted} />
          <Text style={pc.statText}>{post.commentCount}</Text>
        </View>
      </View>
    </View>
  );
}

// ── Mini Post Card ────────────────────────────────────────────────────────────

function MiniPostCard({ post }: { post: SocialPost }) {
  const typeColor = POST_TAG_COLORS[post.tag];
  const totalReactions = POKER_REACTIONS.reduce((s, r) => s + post.reactions[r.key], 0);

  return (
    <View style={pc.wrap}>
      <LinearGradient colors={['#120025', '#080018']} style={StyleSheet.absoluteFill} />
      <View style={pc.top}>
        <View style={[pc.badge, { borderColor: `${typeColor}50`, backgroundColor: `${typeColor}15` }]}>
          <Text style={[pc.badgeText, { color: typeColor }]}>{post.tag}</Text>
        </View>
        <Text style={pc.time}>{post.timeAgo}</Text>
      </View>
      <Text style={pc.content}>{post.content}</Text>
      {post.pot && (
        <View style={pc.pot}>
          <Ionicons name="layers" size={9} color={colors.gold} />
          <Text style={pc.potText}>Pot: <Text style={{ color: colors.gold }}>{post.pot}</Text></Text>
        </View>
      )}
      <View style={pc.footer}>
        <View style={pc.stat}>
          <Ionicons name="heart" size={11} color={colors.secondary} />
          <Text style={pc.statText}>{post.likes}</Text>
        </View>
        <View style={pc.stat}>
          <Ionicons name="chatbubble" size={11} color={colors.textMuted} />
          <Text style={pc.statText}>{post.comments}</Text>
        </View>
        <View style={pc.stat}>
          <Text style={{ fontSize: 10 }}>🔥</Text>
          <Text style={pc.statText}>{totalReactions}</Text>
        </View>
      </View>
    </View>
  );
}

const pc = StyleSheet.create({
  wrap: { borderRadius: 12, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', padding: 12, gap: 8 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 3 },
  badgeText: { fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  time: { color: colors.textDim, fontSize: 10 },
  content: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  pot: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  potText: { color: colors.textMuted, fontSize: 11 },
  footer: { flexDirection: 'row', gap: 14, paddingTop: 4, borderTopWidth: 1, borderTopColor: colors.border },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { color: colors.textMuted, fontSize: 11 },
});

// ── Stat Row Item ─────────────────────────────────────────────────────────────

function StatItem({ label, value, color, icon }: { label: string; value: string; color?: string; icon?: React.ComponentProps<typeof Ionicons>['name'] }) {
  return (
    <View style={si.box}>
      {icon && <Ionicons name={icon} size={16} color={color ?? colors.textDim} />}
      <Text style={[si.value, color ? { color } : {}]}>{value}</Text>
      <Text style={si.label}>{label}</Text>
    </View>
  );
}

const si = StyleSheet.create({
  box: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 12, backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  value: { color: colors.text, fontSize: 18, fontWeight: '800', fontFamily: 'Inter_700Bold' },
  label: { color: colors.textDim, fontSize: 8, letterSpacing: 1, fontWeight: '600' },
});

// ── Main screen ───────────────────────────────────────────────────────────────

export default function PlayerProfileScreen() {
  const params = useLocalSearchParams<{
    id: string; username?: string; avatarIndex?: string; rank?: string;
  }>();
  const { id } = params;
  const insets = useSafeAreaInsets();
  const { isFollowing, follow, unfollow } = useSocial();
  const { profile: myProfile } = useUser();
  const { allPosts: liveFeedPosts } = useLiveFeed();

  // Build a minimal fallback player from URL params (passed by the live post card)
  function fallbackPlayer(): DisplayPlayer | null {
    if (!params.username) return null;
    return {
      id: id ?? '',
      username: params.username,
      handle: `@${params.username.toLowerCase().replace(/\s+/g, '')}`,
      avatarColor: '#00d4ff',
      avatarId: Number(params.avatarIndex ?? 1),
      bannerColors: ['#001a40', '#000d20'],
      rank: params.rank ?? 'Player',
      level: 1,
      chips: 0,
      winRate: 0,
      handsPlayed: 0,
      biggestPot: 0,
      followers: 0,
      following: 0,
      achievementCount: 0,
      status: 'offline',
      badges: [],
      bio: 'Chip Society player.',
      isMock: false,
    };
  }

  const [player, setPlayer] = useState<DisplayPlayer | null>(() => {
    const mock = MOCK_PLAYERS.find(p => p.id === id);
    return mock ? mockToDisplay(mock) : null;
  });
  const [loading, setLoading] = useState(!player);
  const [error, setError] = useState(false);
  const [followerDelta, setFollowerDelta] = useState(0);

  useEffect(() => {
    if (player || !id) return;
    setLoading(true);
    getPlayerProfile(id).then(p => {
      if (p) {
        setPlayer(apiToDisplay(p));
      } else {
        // API returned null — use URL-param fallback if available
        const fb = fallbackPlayer();
        if (fb) setPlayer(fb);
        else setError(true);
      }
    }).catch(() => {
      // Network/API error — use URL-param fallback if available
      const fb = fallbackPlayer();
      if (fb) setPlayer(fb);
      else setError(true);
    }).finally(() => setLoading(false));
  }, [id]);

  const posts: SocialPost[] = player?.isMock
    ? SOCIAL_POSTS.filter(p => p.playerId === id)
    : [];
  const realPosts: FeedPost[] = player?.isMock
    ? []
    : liveFeedPosts.filter(p => p.authorId === id);

  const following = isFollowing(id ?? '');

  function handleFollow() {
    if (!player) return;
    if (following) {
      unfollow(player.id);
      setFollowerDelta(d => d - 1);
      if (myProfile.playerId && !player.isMock) {
        unfollowPlayer(myProfile.playerId, player.id).catch(() => {});
      }
    } else {
      follow(player.id, player.username);
      setFollowerDelta(d => d + 1);
      if (myProfile.playerId && !player.isMock) {
        followPlayer(myProfile.playerId, player.id).catch(() => {});
      }
    }
  }

  if (loading) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={{ color: colors.textDim, marginTop: 12, fontSize: 12 }}>Loading profile…</Text>
      </View>
    );
  }

  if (!player || error) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center', gap: 16 }]}>
        <Ionicons name="person-outline" size={48} color={colors.textDim} />
        <Text style={{ color: colors.textDim, fontSize: 14 }}>Player not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={s.backPillBtn}>
          <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '700' }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusColor = STATUS_COLOR[player.status] ?? STATUS_COLOR.offline;

  return (
    <View style={s.container}>
      {/* Banner */}
      <LinearGradient
        colors={[...player.bannerColors]}
        style={[s.banner, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 0) }]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>

        <View style={s.avatarWrap}>
          <NeonAvatar avatarId={player.avatarId} size={72} />
          <LinearGradient colors={[`${player.avatarColor}50`, 'transparent']} style={s.avatarGlow} />
        </View>

        <Text style={s.username}>{player.username}</Text>
        <Text style={s.handle}>{player.handle}</Text>
        <Text style={s.bio}>{player.bio}</Text>

        <View style={s.metaRow}>
          <View style={[s.statusPill, { backgroundColor: `${statusColor}20`, borderColor: `${statusColor}50` }]}>
            <View style={[s.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[s.statusText, { color: statusColor }]}>{STATUS_LABEL[player.status] ?? 'Offline'}</Text>
          </View>
          <View style={[s.rankPill, { borderColor: `${player.avatarColor}50`, backgroundColor: `${player.avatarColor}15` }]}>
            <Ionicons name="star" size={10} color={player.avatarColor} />
            <Text style={[s.rankText, { color: player.avatarColor }]}>{player.rank}</Text>
          </View>
          <Text style={s.levelText}>Lv.{player.level}</Text>
        </View>

        <View style={s.actionRow}>
          <TouchableOpacity style={[s.followBtn, following && s.followBtnActive]} onPress={handleFollow}>
            <Ionicons name={following ? 'checkmark-circle' : 'person-add'} size={14} color={following ? `${colors.primary}90` : colors.primary} />
            <Text style={[s.followText, following && s.followTextActive]}>{following ? 'Following' : 'Follow'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.msgBtn}>
            <Ionicons name="chatbubble-ellipses-outline" size={14} color={colors.textMuted} />
            <Text style={s.msgText}>Message</Text>
          </TouchableOpacity>
        </View>

        {player.badges.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.badgeRow}>
            {player.badges.map(b => (
              <View key={b.id} style={[s.badge, { borderColor: `${b.color}50`, backgroundColor: `${b.color}15` }]}>
                <Text style={{ fontSize: 11 }}>{b.icon}</Text>
                <Text style={[s.badgeText, { color: b.color }]}>{b.label}</Text>
              </View>
            ))}
          </ScrollView>
        )}
      </LinearGradient>

      {/* Scrollable body */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 90, gap: 16, paddingTop: 16 }}
      >
        {/* Social counts */}
        <View style={s.socialRow}>
          <View style={s.socialStat}>
            <Text style={s.socialVal}>
              {(player.followers + followerDelta) >= 1000 ? `${((player.followers + followerDelta) / 1000).toFixed(1)}K` : (player.followers + followerDelta)}
            </Text>
            <Text style={s.socialLabel}>Followers</Text>
          </View>
          <View style={s.socialDiv} />
          <View style={s.socialStat}>
            <Text style={s.socialVal}>
              {player.following >= 1000 ? `${(player.following / 1000).toFixed(1)}K` : player.following}
            </Text>
            <Text style={s.socialLabel}>Following</Text>
          </View>
          <View style={s.socialDiv} />
          <View style={s.socialStat}>
            <Text style={[s.socialVal, { color: colors.gold }]}>{player.achievementCount}/26</Text>
            <Text style={s.socialLabel}>Achievements</Text>
          </View>
          <View style={s.socialDiv} />
          <View style={s.socialStat}>
            <Text style={[s.socialVal, { color: colors.success }]}>{player.winRate}%</Text>
            <Text style={s.socialLabel}>Win Rate</Text>
          </View>
        </View>

        {/* Stats grid */}
        <View style={s.statsSection}>
          <Text style={s.sectionTitle}>PLAYER STATS</Text>
          <View style={s.statsRow}>
            <StatItem label="CHIPS" value={formatBig(player.chips)} color={colors.gold} icon="layers" />
            <StatItem label="WIN RATE" value={`${player.winRate}%`} color={colors.success} icon="trending-up" />
          </View>
          <View style={s.statsRow}>
            <StatItem label="HANDS PLAYED" value={player.handsPlayed.toLocaleString()} icon="card" />
            {player.biggestPot > 0 && (
              <StatItem label="BIGGEST POT" value={formatBig(player.biggestPot)} color={colors.secondary} icon="trophy" />
            )}
          </View>
        </View>

        {/* Tournaments — COMING SOON */}
        <View style={s.statsSection}>
          <Text style={s.sectionTitle}>TOURNAMENTS</Text>
          <View style={s.comingSoonBox}>
            <LinearGradient colors={['#1a0035', '#080018']} style={StyleSheet.absoluteFill} />
            <Ionicons name="trophy-outline" size={28} color={`${colors.accent}60`} />
            <Text style={s.comingSoonTitle}>COMING SOON</Text>
            <Text style={s.comingSoonSub}>Tournament leaderboards and match history are launching soon.</Text>
          </View>
        </View>

        {/* Recent posts */}
        {(posts.length > 0 || realPosts.length > 0) && (
          <View style={s.statsSection}>
            <Text style={s.sectionTitle}>RECENT POSTS</Text>
            <View style={{ gap: 10 }}>
              {realPosts.slice(0, 4).map(post => (
                <LiveMiniPostCard key={post.id} post={post} />
              ))}
              {posts.slice(0, Math.max(0, 4 - realPosts.length)).map(post => (
                <MiniPostCard key={post.id} post={post} />
              ))}
            </View>
          </View>
        )}

        {/* Similar players (mock only) */}
        {player.isMock && (
          <View style={s.statsSection}>
            <Text style={s.sectionTitle}>SIMILAR PLAYERS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {MOCK_PLAYERS.filter(p => p.id !== player.id && p.rank === player.rank).slice(0, 4).map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={s.simCard}
                  onPress={() => router.replace(`/social/player-profile?id=${p.id}`)}
                >
                  <LinearGradient colors={['#120025', '#080018']} style={StyleSheet.absoluteFill} />
                  <NeonAvatar avatarId={p.avatarId ?? 1} size={40} />
                  <Text style={s.simName}>{p.username}</Text>
                  <Text style={s.simRank}>{p.rank}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050010' },
  banner: { paddingHorizontal: 20, paddingBottom: 20, alignItems: 'center', gap: 6 },
  backBtn: { position: 'absolute', top: 0, left: 16, padding: 8, alignSelf: 'flex-start' },
  backPillBtn: { borderWidth: 1, borderColor: colors.primary, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10 },
  avatarWrap: { position: 'relative', marginTop: 8 },
  avatarGlow: { position: 'absolute', top: -6, left: -6, right: -6, bottom: -6, borderRadius: 46 },
  username: { color: '#fff', fontSize: 22, fontWeight: '800', fontFamily: 'Orbitron_700Bold', letterSpacing: 1, marginTop: 4 },
  handle: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  bio: { color: 'rgba(255,255,255,0.6)', fontSize: 12, textAlign: 'center', lineHeight: 17, paddingHorizontal: 10 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 12, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '700' },
  rankPill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 12, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 4 },
  rankText: { fontSize: 10, fontWeight: '700' },
  levelText: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  followBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: colors.primary, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 9 },
  followBtnActive: { backgroundColor: `${colors.primary}20`, borderColor: `${colors.primary}60` },
  followText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  followTextActive: { color: `${colors.primary}80` },
  msgBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 9 },
  msgText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  badgeRow: { gap: 8, marginTop: 4 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 16, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  socialRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingVertical: 12 },
  socialStat: { flex: 1, alignItems: 'center', gap: 2 },
  socialVal: { color: colors.text, fontSize: 16, fontWeight: '800' },
  socialLabel: { color: colors.textDim, fontSize: 9 },
  socialDiv: { width: 1, height: 24, backgroundColor: colors.border },
  statsSection: { paddingHorizontal: 16, gap: 10 },
  sectionTitle: { color: colors.primary, fontSize: 10, fontWeight: '800', fontFamily: 'Orbitron_700Bold', letterSpacing: 2 },
  statsRow: { flexDirection: 'row', gap: 10 },
  comingSoonBox: { borderRadius: 14, borderWidth: 1, borderColor: `${colors.accent}30`, overflow: 'hidden', padding: 24, alignItems: 'center', gap: 8 },
  comingSoonTitle: { color: colors.accent, fontSize: 13, fontWeight: '800', fontFamily: 'Orbitron_700Bold', letterSpacing: 2 },
  comingSoonSub: { color: colors.textDim, fontSize: 11, textAlign: 'center', lineHeight: 16 },
  simCard: { width: 110, alignItems: 'center', borderRadius: 14, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', padding: 14, gap: 6 },
  simName: { color: colors.text, fontSize: 11, fontWeight: '700', textAlign: 'center' },
  simRank: { color: colors.textDim, fontSize: 9, textAlign: 'center' },
});
