import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
  FlatList,
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
import {
  MOCK_PLAYERS, SOCIAL_POSTS, POST_TAG_COLORS, POKER_REACTIONS,
  type MockPlayer, type SocialPost,
} from '@/lib/socialData';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBig(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

const STATUS_LABEL: Record<string, string> = { online: 'Online', in_game: 'In Game', offline: 'Offline' };
const STATUS_COLOR: Record<string, string> = { online: '#00ff88', in_game: '#ffd700', offline: '#4a4060' };

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
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { isFollowing, follow, unfollow } = useSocial();

  const player: MockPlayer | undefined = MOCK_PLAYERS.find(p => p.id === id);
  const posts: SocialPost[] = SOCIAL_POSTS.filter(p => p.playerId === id);
  const following = isFollowing(id ?? '');

  if (!player) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.textDim }}>Player not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.primary }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function handleFollow() {
    if (following) unfollow(player!.id);
    else follow(player!.id, player!.username);
  }

  return (
    <View style={s.container}>
      {/* Banner */}
      <LinearGradient
        colors={[...player.bannerColors]}
        style={[s.banner, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 0) }]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      >
        {/* Back */}
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>

        {/* Avatar */}
        <View style={s.avatarWrap}>
          <View style={[s.avatar, { borderColor: player.avatarColor }]}>
            <Text style={[s.avatarText, { color: player.avatarColor }]}>{player.avatar}</Text>
          </View>
          <LinearGradient colors={[`${player.avatarColor}50`, 'transparent']} style={s.avatarGlow} />
        </View>

        {/* Names */}
        <Text style={s.username}>{player.username}</Text>
        <Text style={s.handle}>{player.handle}</Text>
        <Text style={s.bio}>{player.bio}</Text>

        {/* Status + rank row */}
        <View style={s.metaRow}>
          <View style={[s.statusPill, { backgroundColor: `${STATUS_COLOR[player.status]}20`, borderColor: `${STATUS_COLOR[player.status]}50` }]}>
            <View style={[s.statusDot, { backgroundColor: STATUS_COLOR[player.status] }]} />
            <Text style={[s.statusText, { color: STATUS_COLOR[player.status] }]}>{STATUS_LABEL[player.status]}</Text>
          </View>
          <View style={[s.rankPill, { borderColor: `${player.avatarColor}50`, backgroundColor: `${player.avatarColor}15` }]}>
            <Ionicons name="star" size={10} color={player.avatarColor} />
            <Text style={[s.rankText, { color: player.avatarColor }]}>{player.rank}</Text>
          </View>
          <Text style={s.levelText}>Lv.{player.level}</Text>
        </View>

        {/* Follow / message row */}
        <View style={s.actionRow}>
          <TouchableOpacity
            style={[s.followBtn, following && s.followBtnActive]}
            onPress={handleFollow}
          >
            <Ionicons
              name={following ? 'checkmark-circle' : 'person-add'}
              size={14}
              color={following ? `${colors.primary}90` : colors.primary}
            />
            <Text style={[s.followText, following && s.followTextActive]}>
              {following ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.msgBtn}>
            <Ionicons name="chatbubble-ellipses-outline" size={14} color={colors.textMuted} />
            <Text style={s.msgText}>Message</Text>
          </TouchableOpacity>
        </View>

        {/* Badges */}
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
            <Text style={s.socialVal}>{(player.followers / 1000).toFixed(1)}K</Text>
            <Text style={s.socialLabel}>Followers</Text>
          </View>
          <View style={s.socialDiv} />
          <View style={s.socialStat}>
            <Text style={s.socialVal}>{(player.following / 1000).toFixed(1)}K</Text>
            <Text style={s.socialLabel}>Following</Text>
          </View>
          <View style={s.socialDiv} />
          <View style={s.socialStat}>
            <Text style={s.socialVal}>{player.tournamentWins}</Text>
            <Text style={s.socialLabel}>Tourney Wins</Text>
          </View>
          <View style={s.socialDiv} />
          <View style={s.socialStat}>
            <Text style={s.socialVal}>{player.achievementCount}</Text>
            <Text style={s.socialLabel}>Achievements</Text>
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
            <StatItem label="BIGGEST POT" value={formatBig(player.biggestPot)} color={colors.secondary} icon="trophy" />
          </View>
        </View>

        {/* Recent posts */}
        {posts.length > 0 && (
          <View style={s.statsSection}>
            <Text style={s.sectionTitle}>RECENT POSTS</Text>
            <View style={{ gap: 10 }}>
              {posts.slice(0, 4).map(post => (
                <MiniPostCard key={post.id} post={post} />
              ))}
            </View>
          </View>
        )}

        {/* Similar players */}
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
                <View style={[s.simAvatar, { borderColor: p.avatarColor }]}>
                  <Text style={[s.simAvatarText, { color: p.avatarColor }]}>{p.avatar}</Text>
                </View>
                <Text style={s.simName}>{p.username}</Text>
                <Text style={s.simRank}>{p.rank}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050010' },
  banner: { paddingHorizontal: 20, paddingBottom: 20, alignItems: 'center', gap: 6 },
  backBtn: { position: 'absolute', top: 0, left: 16, padding: 8, alignSelf: 'flex-start' },
  avatarWrap: { position: 'relative', marginTop: 8 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#0e0025', borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 38, fontWeight: '700' },
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
  simCard: { width: 110, alignItems: 'center', borderRadius: 14, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', padding: 14, gap: 6 },
  simAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#0e0025', borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  simAvatarText: { fontSize: 20, fontWeight: '700' },
  simName: { color: colors.text, fontSize: 11, fontWeight: '700', textAlign: 'center' },
  simRank: { color: colors.textDim, fontSize: 9, textAlign: 'center' },
});
