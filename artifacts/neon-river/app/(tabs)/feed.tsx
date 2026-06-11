import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/colors';
import { useUser } from '@/context/UserContext';
import { useColors } from '@/hooks/useColors';
import { useSocial } from '@/context/SocialContext';
import { useAISocial } from '@/context/AISocialContext';
import type { AIPost } from '@/lib/aiSocialEngine';
import {
  SOCIAL_POSTS, MOCK_PLAYERS, LIVE_EVENTS, POKER_REACTIONS, POST_TAG_COLORS,
  AVATAR_SYMBOLS, AVATAR_COLORS, getLeaderboard,
  type SocialPost, type PostTag,
} from '@/lib/socialData';
import NeonAvatar from '@/components/NeonAvatar';
import { getNeonAvatar } from '@/constants/neonAvatars';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const POST_TYPE_ICONS: Record<PostTag, React.ComponentProps<typeof Ionicons>['name']> = {
  WIN:        'trophy-outline',
  BLUFF:      'glasses-outline',
  'BAD BEAT': 'sad-outline',
  'ALL-IN':   'flame-outline',
  HIGHLIGHT:  'star-outline',
  JACKPOT:    'gift-outline',
  'LEVEL UP': 'trending-up-outline',
  TOURNAMENT: 'medal-outline',
};

const MAX_CHARS = 280;
const ALL_TAGS: PostTag[] = ['WIN', 'BLUFF', 'BAD BEAT', 'ALL-IN', 'HIGHLIGHT', 'JACKPOT', 'TOURNAMENT'];

const FEED_TABS = [
  { id: 'trending',    label: 'Trending',     icon: 'flame' as const },
  { id: 'following',   label: 'Following',    icon: 'people' as const },
  { id: 'pots',        label: 'Biggest Pots', icon: 'cash' as const },
  { id: 'leaderboard', label: 'Leaderboard',  icon: 'podium' as const },
  { id: 'search',      label: 'Search',       icon: 'search' as const },
  { id: 'me',          label: 'Me',           icon: 'person-circle' as const },
];

const ME_SUBTABS = [
  { id: 'posts',   label: 'Posts',   icon: 'create-outline' as const },
  { id: 'reposts', label: 'Reposts', icon: 'repeat' as const },
  { id: 'likes',   label: 'Likes',   icon: 'heart-outline' as const },
];

// ─── Live Ticker ─────────────────────────────────────────────────────────────

function LiveTicker() {
  const [idx, setIdx] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const cycle = () => {
      Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: false }).start(() => {
        setIdx(i => (i + 1) % LIVE_EVENTS.length);
        Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: false }).start();
      });
    };
    const timer = setInterval(cycle, 3500);
    return () => clearInterval(timer);
  }, [opacity]);

  const ev = LIVE_EVENTS[idx];

  return (
    <View style={tickerStyle.wrap}>
      <View style={tickerStyle.dot} />
      <Text style={tickerStyle.label}>LIVE</Text>
      <Animated.Text style={[tickerStyle.text, { opacity, color: ev.color }]} numberOfLines={1}>
        {ev.text}
      </Animated.Text>
    </View>
  );
}

const tickerStyle = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  dot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: '#ff0090',
  },
  label: {
    color: '#ff0090', fontSize: 9, fontWeight: '800', letterSpacing: 1.5,
    fontFamily: 'Orbitron_700Bold',
  },
  text: { flex: 1, fontSize: 12, fontWeight: '600' },
});

// ─── Notification Bell ───────────────────────────────────────────────────────

function NotifBell({ onPress }: { onPress: () => void }) {
  const { unreadCount } = useSocial();
  return (
    <TouchableOpacity style={hdrStyle.bell} onPress={onPress}>
      <Ionicons name="notifications-outline" size={20} color={colors.textMuted} />
      {unreadCount > 0 && (
        <View style={hdrStyle.badge}>
          <Text style={hdrStyle.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const hdrStyle = StyleSheet.create({
  bell: { position: 'relative', padding: 4 },
  badge: {
    position: 'absolute', top: 0, right: 0,
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: '#ff0090', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
});

// ─── Notifications panel ──────────────────────────────────────────────────────

function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const { notifications, markAllRead } = useSocial();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    markAllRead();
  }, [markAllRead]);

  const NOTIF_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
    follow:      'person-add',
    like:        'heart',
    reaction:    'happy',
    comment:     'chatbubble',
    achievement: 'trophy',
  };
  const NOTIF_COLORS: Record<string, string> = {
    follow: '#00d4ff', like: '#ff0090', reaction: '#ffd700',
    comment: '#bf5fff', achievement: '#00ff88',
  };

  function timeStr(ts: number) {
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  return (
    <View style={[notifStyle.panel, { paddingTop: insets.top + 8 }]}>
      <LinearGradient colors={['#0e0025', '#050010']} style={StyleSheet.absoluteFill} />
      <View style={notifStyle.header}>
        <Text style={notifStyle.title}>NOTIFICATIONS</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={22} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={notifications}
        keyExtractor={n => n.id}
        contentContainerStyle={{ padding: 14, gap: 10 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: n }) => {
          const ic = NOTIF_ICONS[n.type] ?? 'notifications';
          const col = NOTIF_COLORS[n.type] ?? colors.primary;
          return (
            <View style={[notifStyle.row, !n.read && notifStyle.rowUnread]}>
              <View style={[notifStyle.icon, { backgroundColor: `${col}20`, borderColor: `${col}40` }]}>
                <Ionicons name={ic} size={14} color={col} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={notifStyle.msg}>{n.message}</Text>
                <Text style={notifStyle.time}>{timeStr(n.timestamp)}</Text>
              </View>
              {!n.read && <View style={notifStyle.unreadDot} />}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 48, gap: 10 }}>
            <Ionicons name="notifications-off-outline" size={36} color={colors.textDim} />
            <Text style={{ color: colors.textDim, fontSize: 13 }}>No notifications yet</Text>
          </View>
        }
      />
    </View>
  );
}

const notifStyle = StyleSheet.create({
  panel: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 900,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  title: {
    color: colors.primary, fontSize: 16, fontWeight: '800',
    fontFamily: 'Orbitron_700Bold', letterSpacing: 2,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1,
    borderColor: colors.border, padding: 12,
  },
  rowUnread: { borderColor: `${colors.primary}30`, backgroundColor: `${colors.primary}08` },
  icon: {
    width: 32, height: 32, borderRadius: 16, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  msg: { color: colors.text, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  time: { color: colors.textDim, fontSize: 11, marginTop: 2 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
});

// ─── Post Card ───────────────────────────────────────────────────────────────

function PostCard({ post }: { post: SocialPost }) {
  const { isFollowing, follow, unfollow, isLiked, toggleLike, setReaction, getReaction } = useSocial();
  const [showReactions, setShowReactions] = useState(false);
  const player = MOCK_PLAYERS.find(p => p.id === post.playerId);
  const typeColor = POST_TAG_COLORS[post.tag];
  const myReaction = getReaction(post.id);
  const liked = isLiked(post.id);
  const following = isFollowing(post.playerId);

  function handleFollow() {
    if (!player) return;
    if (following) unfollow(post.playerId);
    else follow(post.playerId, player.username);
  }

  return (
    <View style={cd.wrap}>
      <LinearGradient colors={['#120025', '#080018']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />

      {/* Header */}
      <View style={cd.header}>
        <TouchableOpacity
          style={cd.avatarWrap}
          onPress={() => router.push(`/social/player-profile?id=${post.playerId}`)}
        >
          <NeonAvatar avatarId={player?.avatarId ?? 1} size={44} />
          {player?.status === 'online' && <View style={cd.onlineDot} />}
          {player?.status === 'in_game' && <View style={[cd.onlineDot, { backgroundColor: '#ffd700' }]} />}
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <TouchableOpacity onPress={() => router.push(`/social/player-profile?id=${post.playerId}`)}>
            <Text style={cd.username}>{player?.username ?? 'Unknown'}</Text>
          </TouchableOpacity>
          <Text style={cd.handle}>{player?.handle ?? ''} · {post.timeAgo}</Text>
        </View>

        <View style={[cd.typeBadge, { backgroundColor: `${typeColor}18`, borderColor: `${typeColor}40` }]}>
          <Ionicons name={POST_TYPE_ICONS[post.tag]} size={9} color={typeColor} />
          <Text style={[cd.typeText, { color: typeColor }]}>{post.tag}</Text>
        </View>

        <TouchableOpacity
          style={[cd.followBtn, following && cd.followBtnActive]}
          onPress={handleFollow}
        >
          <Text style={[cd.followText, following && cd.followTextActive]}>
            {following ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <Text style={cd.content}>{post.content}</Text>

      {/* Stats chips */}
      {(post.pot || post.handRank) && (
        <View style={cd.statsRow}>
          {post.pot && (
            <View style={cd.statChip}>
              <Ionicons name="layers" size={10} color={colors.gold} />
              <Text style={cd.statText}>Pot: <Text style={{ color: colors.gold }}>{post.pot}</Text></Text>
            </View>
          )}
          {post.handRank && (
            <View style={cd.statChip}>
              <Ionicons name="card" size={10} color={colors.primary} />
              <Text style={cd.statText}><Text style={{ color: colors.primary }}>{post.handRank}</Text></Text>
            </View>
          )}
        </View>
      )}

      {/* Reactions strip */}
      {(showReactions || myReaction) && (
        <View style={cd.reactionsRow}>
          {POKER_REACTIONS.map(r => {
            const active = myReaction === r.key;
            const count = post.reactions[r.key] + (active ? 1 : 0);
            return (
              <TouchableOpacity
                key={r.key}
                style={[cd.reactionBtn, active && { backgroundColor: `${r.color}25`, borderColor: `${r.color}60` }]}
                onPress={() => setReaction(post.id, r.key)}
              >
                <Text style={cd.reactionEmoji}>{r.emoji}</Text>
                <Text style={[cd.reactionCount, active && { color: r.color }]}>{count}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Actions */}
      <View style={cd.actions}>
        <TouchableOpacity style={cd.actionBtn} onPress={() => toggleLike(post.id)}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={17} color={liked ? '#ff0090' : colors.textMuted} />
          <Text style={[cd.actionCount, liked && { color: '#ff0090' }]}>{liked ? post.likes + 1 : post.likes}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={cd.actionBtn}>
          <Ionicons name="chatbubble-outline" size={15} color={colors.textMuted} />
          <Text style={cd.actionCount}>{post.comments}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={cd.actionBtn} onPress={() => setShowReactions(v => !v)}>
          <Text style={{ fontSize: 14 }}>🔥</Text>
          <Text style={cd.actionCount}>React</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[cd.actionBtn, { marginLeft: 'auto' }]}>
          <Ionicons name="share-outline" size={17} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const cd = StyleSheet.create({
  wrap: {
    borderRadius: 16, borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden', padding: 14, gap: 10,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.surface, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700' },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#00ff88', borderWidth: 1.5, borderColor: '#080018',
  },
  username: { color: colors.text, fontSize: 13, fontWeight: '700' },
  handle: { color: colors.textDim, fontSize: 10, marginTop: 1 },
  typeBadge: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 3, flexDirection: 'row', alignItems: 'center', gap: 3 },
  typeText: { fontSize: 8, fontWeight: '800', letterSpacing: 0.3 },
  followBtn: {
    borderWidth: 1, borderColor: colors.primary, borderRadius: 14,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  followBtnActive: { backgroundColor: `${colors.primary}20`, borderColor: `${colors.primary}60` },
  followText: { color: colors.primary, fontSize: 10, fontWeight: '700' },
  followTextActive: { color: `${colors.primary}90` },
  content: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.surface, borderRadius: 6, borderWidth: 1,
    borderColor: colors.border, paddingHorizontal: 8, paddingVertical: 4,
  },
  statText: { color: colors.textMuted, fontSize: 11 },
  reactionsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  reactionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  reactionEmoji: { fontSize: 13 },
  reactionCount: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  actions: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingTop: 6, borderTopWidth: 1, borderTopColor: colors.border,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionCount: { color: colors.textMuted, fontSize: 12 },
});

// ─── Leaderboard Section ─────────────────────────────────────────────────────

const LB_CATS = [
  { id: 'chips' as const,       label: 'Chips',      icon: '💰' },
  { id: 'winrate' as const,     label: 'Win Rate',   icon: '🎯' },
  { id: 'pots' as const,        label: 'Biggest Pot',icon: '♠️' },
  { id: 'xp' as const,          label: 'XP Level',   icon: '⚡' },
  { id: 'tournaments' as const, label: 'Tourney Wins',icon: '🏆' },
];

function LeaderboardSection({ bottomInset }: { bottomInset: number }) {
  const [cat, setCat] = useState<typeof LB_CATS[number]['id']>('chips');
  const entries = getLeaderboard(cat).slice(0, 10);

  const medalColors = ['#ffd700', '#a0a8c0', '#cd7f32'];

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomInset + 100 }}>
      <View style={{ padding: 14, gap: 12 }}>
        <Text style={lb.sectionTitle}>GLOBAL LEADERBOARD</Text>

        {/* Category tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {LB_CATS.map(c => {
            const active = cat === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                style={[lb.catBtn, active && lb.catBtnActive]}
                onPress={() => setCat(c.id)}
              >
                <Text style={lb.catEmoji}>{c.icon}</Text>
                <Text style={[lb.catText, active && lb.catTextActive]}>{c.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Entries */}
        {entries.map((entry, i) => {
          const medal = i < 3 ? medalColors[i] : null;
          return (
            <TouchableOpacity
              key={entry.player.id}
              style={lb.row}
              onPress={() => router.push(`/social/player-profile?id=${entry.player.id}`)}
            >
              <LinearGradient
                colors={medal ? [`${medal}18`, 'transparent'] : ['transparent', 'transparent']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              />
              <View style={lb.rank}>
                {medal
                  ? <Text style={{ fontSize: 16 }}>{['🥇', '🥈', '🥉'][i]}</Text>
                  : <Text style={lb.rankNum}>{i + 1}</Text>
                }
              </View>
              <NeonAvatar avatarId={entry.player.avatarId ?? 1} size={34} />
              <View style={{ flex: 1 }}>
                <Text style={lb.username}>{entry.player.username}</Text>
                <Text style={lb.rankLabel}>{entry.player.rank}</Text>
              </View>
              <View style={[lb.statusDot, {
                backgroundColor: entry.player.status === 'online' ? '#00ff88'
                  : entry.player.status === 'in_game' ? '#ffd700' : colors.border,
              }]} />
              <Text style={[lb.value, medal ? { color: medal } : {}]}>{entry.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const lb = StyleSheet.create({
  sectionTitle: {
    color: colors.primary, fontSize: 12, fontWeight: '800',
    fontFamily: 'Orbitron_700Bold', letterSpacing: 3, marginBottom: 4,
  },
  catBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  catBtnActive: { borderColor: colors.primary, backgroundColor: `${colors.primary}15` },
  catEmoji: { fontSize: 13 },
  catText: { color: colors.textDim, fontSize: 11, fontWeight: '600' },
  catTextActive: { color: colors.primary, fontWeight: '800' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface, overflow: 'hidden',
  },
  rank: { width: 28, alignItems: 'center' },
  rankNum: { color: colors.textDim, fontSize: 14, fontWeight: '700' },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#0e0025', borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '700' },
  username: { color: colors.text, fontSize: 13, fontWeight: '700' },
  rankLabel: { color: colors.textDim, fontSize: 10, marginTop: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  value: { color: colors.gold, fontSize: 12, fontWeight: '700', textAlign: 'right', maxWidth: 110 },
});

// ─── Search Section ──────────────────────────────────────────────────────────

function SearchSection({ bottomInset }: { bottomInset: number }) {
  const [query, setQuery] = useState('');
  const { isFollowing, follow, unfollow } = useSocial();

  const results = query.trim().length === 0
    ? MOCK_PLAYERS
    : MOCK_PLAYERS.filter(p =>
        p.username.toLowerCase().includes(query.toLowerCase()) ||
        p.handle.toLowerCase().includes(query.toLowerCase()) ||
        p.rank.toLowerCase().includes(query.toLowerCase()),
      );

  const STATUS_LABEL: Record<string, string> = {
    online: 'Online', in_game: 'In Game', offline: 'Offline',
  };
  const STATUS_COLOR: Record<string, string> = {
    online: '#00ff88', in_game: '#ffd700', offline: colors.textDim,
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Search bar */}
      <View style={srch.inputWrap}>
        <Ionicons name="search" size={16} color={colors.textDim} />
        <TextInput
          style={srch.input}
          placeholder="Search players, ranks..."
          placeholderTextColor={colors.textDim}
          value={query}
          onChangeText={setQuery}
          selectionColor={colors.primary}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={16} color={colors.textDim} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={results}
        keyExtractor={p => p.id}
        contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: bottomInset + 100 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item: p }) => {
          const following = isFollowing(p.id);
          return (
            <TouchableOpacity
              style={srch.card}
              onPress={() => router.push(`/social/player-profile?id=${p.id}`)}
            >
              <LinearGradient colors={['#120025', '#080018']} style={StyleSheet.absoluteFill} />
              <NeonAvatar avatarId={p.avatarId ?? 1} size={38} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={srch.username}>{p.username}</Text>
                  <View style={[srch.statusDot, { backgroundColor: STATUS_COLOR[p.status] }]} />
                  <Text style={[srch.statusLabel, { color: STATUS_COLOR[p.status] }]}>
                    {STATUS_LABEL[p.status]}
                  </Text>
                </View>
                <Text style={srch.handle}>{p.handle} · {p.rank}</Text>
                <Text style={srch.chips}>{(p.chips / 1000).toFixed(0)}K chips · Lv.{p.level}</Text>
              </View>
              <TouchableOpacity
                style={[srch.followBtn, following && srch.followBtnActive]}
                onPress={() => following ? unfollow(p.id) : follow(p.id, p.username)}
              >
                <Text style={[srch.followText, following && srch.followTextActive]}>
                  {following ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const srch = StyleSheet.create({
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1,
    borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 10, margin: 14,
  },
  input: { flex: 1, color: colors.text, fontSize: 14 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, borderWidth: 1, borderColor: colors.border,
    padding: 12, overflow: 'hidden',
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#0e0025', borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '700' },
  username: { color: colors.text, fontSize: 14, fontWeight: '700' },
  handle: { color: colors.textDim, fontSize: 11, marginTop: 2 },
  chips: { color: colors.gold, fontSize: 11, marginTop: 1 },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusLabel: { fontSize: 10, fontWeight: '600' },
  followBtn: {
    borderWidth: 1, borderColor: colors.primary, borderRadius: 16,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  followBtnActive: { backgroundColor: `${colors.primary}20`, borderColor: `${colors.primary}50` },
  followText: { color: colors.primary, fontSize: 11, fontWeight: '700' },
  followTextActive: { color: `${colors.primary}80` },
});

// ─── Compose Sheet ───────────────────────────────────────────────────────────

interface MePost {
  id: string; tag: PostTag; content: string;
  pot?: string; handRank?: string; likes: number; comments: number;
  timeAgo: string; repostedFrom?: string;
}

function ComposeSheet({ visible, onClose, onPost, bottomInset }: {
  visible: boolean; onClose: () => void; onPost: (p: MePost) => void; bottomInset: number;
}) {
  const { profile } = useUser();
  const [text, setText] = useState('');
  const [postType, setPostType] = useState<PostTag>('WIN');
  const [pot, setPot] = useState('');
  const [hand, setHand] = useState('');
  const [showOpts, setShowOpts] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const meAvatarId = profile.symbolIndex && profile.symbolIndex > 0 ? profile.symbolIndex : 1;
  const remaining = MAX_CHARS - text.length;
  const canPost = text.trim().length > 0 && remaining >= 0;

  function handlePost() {
    if (!canPost) return;
    onPost({
      id: `up_${Date.now()}`, tag: postType, content: text.trim(),
      pot: pot.trim() || undefined, handRank: hand.trim() || undefined,
      likes: 0, comments: 0, timeAgo: 'just now',
    });
    setText(''); setPot(''); setHand(''); setPostType('WIN'); setShowOpts(false);
    onClose();
  }

  function reset() {
    setText(''); setPot(''); setHand(''); setPostType('WIN'); setShowOpts(false);
  }

  if (!visible) return null;
  const typeColor = POST_TAG_COLORS[postType];

  return (
    <View style={cmp.overlay} pointerEvents="box-none">
      <TouchableOpacity style={cmp.backdrop} activeOpacity={1} onPress={() => { reset(); onClose(); }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={cmp.kvSheet}>
        <View style={[cmp.sheet, { paddingBottom: bottomInset + 12 }]}>
          <LinearGradient colors={['#160030', '#080018']} style={StyleSheet.absoluteFill} />
          <View style={cmp.handle} />
          <View style={cmp.topBar}>
            <TouchableOpacity onPress={() => { reset(); onClose(); }}>
              <Text style={cmp.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={cmp.sheetTitle}>New Post</Text>
            <TouchableOpacity
              style={[cmp.postBtn, !canPost && cmp.postBtnDis]}
              onPress={handlePost}
            >
              <Text style={[cmp.postBtnText, !canPost && cmp.postBtnTextDis]}>Post</Text>
            </TouchableOpacity>
          </View>
          <View style={cmp.authorRow}>
            <NeonAvatar avatarId={meAvatarId} size={36} />
            <View>
              <Text style={cmp.authorName}>{profile.username}</Text>
              <Text style={cmp.authorHandle}>@{profile.username.toLowerCase().replace(/\s/g, '')}</Text>
            </View>
          </View>
          <TextInput
            ref={inputRef}
            style={cmp.input}
            placeholder="What happened at the table?"
            placeholderTextColor={colors.textDim}
            multiline maxLength={MAX_CHARS + 10}
            value={text} onChangeText={setText}
            selectionColor={colors.primary}
            autoFocus={Platform.OS !== 'web'}
          />
          <Text style={cmp.sectionLabel}>Tag your hand</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={cmp.typeRow}>
            {ALL_TAGS.map(t => {
              const active = postType === t;
              const c = POST_TAG_COLORS[t];
              return (
                <TouchableOpacity
                  key={t}
                  style={[cmp.typeChip, { borderColor: active ? c : `${c}40`, backgroundColor: active ? `${c}22` : 'transparent' }]}
                  onPress={() => setPostType(t)}
                >
                  <Ionicons name={POST_TYPE_ICONS[t]} size={11} color={active ? c : colors.textDim} />
                  <Text style={[cmp.typeChipText, { color: active ? c : colors.textDim }]}>{t}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity style={cmp.optToggle} onPress={() => setShowOpts(v => !v)}>
            <Ionicons name="layers-outline" size={13} color={colors.primary} />
            <Text style={cmp.optToggleText}>Add hand stats (optional)</Text>
            <Ionicons name={showOpts ? 'chevron-up' : 'chevron-down'} size={13} color={colors.textDim} />
          </TouchableOpacity>
          {showOpts && (
            <View style={cmp.optFields}>
              <View style={cmp.fieldRow}>
                <Ionicons name="layers" size={12} color={colors.gold} />
                <TextInput style={cmp.fieldInput} placeholder="Pot size (e.g. 42,000)"
                  placeholderTextColor={colors.textDim} value={pot} onChangeText={setPot} selectionColor={colors.primary} />
              </View>
              <View style={[cmp.fieldRow, { marginTop: 8 }]}>
                <Ionicons name="card" size={12} color={colors.primary} />
                <TextInput style={cmp.fieldInput} placeholder="Best hand (e.g. Full House)"
                  placeholderTextColor={colors.textDim} value={hand} onChangeText={setHand} selectionColor={colors.primary} />
              </View>
            </View>
          )}
          <View style={cmp.footer}>
            <View style={[cmp.selType, { borderColor: `${typeColor}50`, backgroundColor: `${typeColor}15` }]}>
              <Ionicons name={POST_TYPE_ICONS[postType]} size={10} color={typeColor} />
              <Text style={[cmp.selTypeText, { color: typeColor }]}>{postType}</Text>
            </View>
            <Text style={[cmp.counter, remaining < 20 && { color: remaining < 0 ? colors.secondary : colors.warning }]}>
              {remaining}
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const cmp = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999, justifyContent: 'flex-end' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
  kvSheet: { width: '100%' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, borderBottomWidth: 0, borderColor: colors.border, overflow: 'hidden', paddingTop: 8 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 4 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  sheetTitle: { color: colors.text, fontSize: 14, fontWeight: '800', fontFamily: 'Orbitron_700Bold', letterSpacing: 1 },
  cancelText: { color: colors.textDim, fontSize: 14, fontWeight: '600' },
  postBtn: { backgroundColor: colors.primary, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 7 },
  postBtnDis: { backgroundColor: `${colors.primary}40` },
  postBtnText: { color: colors.background, fontSize: 12, fontWeight: '800' },
  postBtnTextDis: { color: `${colors.background}70` },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surface, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 19, fontWeight: '700' },
  authorName: { color: colors.text, fontSize: 13, fontWeight: '700' },
  authorHandle: { color: colors.textDim, fontSize: 10 },
  input: { color: colors.text, fontSize: 15, lineHeight: 23, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, minHeight: 90, textAlignVertical: 'top' },
  sectionLabel: { color: colors.textDim, fontSize: 10, fontWeight: '700', letterSpacing: 1, paddingHorizontal: 16, marginBottom: 8 },
  typeRow: { paddingHorizontal: 16, gap: 8 },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  typeChipText: { fontSize: 10, fontWeight: '700' },
  optToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  optToggleText: { color: colors.primary, fontSize: 11, fontWeight: '600', flex: 1 },
  optFields: { paddingHorizontal: 16, paddingTop: 4 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: colors.surface },
  fieldInput: { flex: 1, color: colors.text, fontSize: 13 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border, marginTop: 12 },
  selType: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  selTypeText: { fontSize: 9, fontWeight: '800' },
  counter: { color: colors.textDim, fontSize: 12, fontWeight: '600' },
});

// ─── Me Section ──────────────────────────────────────────────────────────────

const MY_REPOSTS: MePost[] = [
  { id: 'mr1', tag: 'WIN', content: 'Royal Flush on the river. The whole table went silent. 🃏🔥', pot: '42,400', handRank: 'Royal Flush', likes: 1240, comments: 87, timeAgo: '2h', repostedFrom: 'NightShark99' },
  { id: 'mr2', tag: 'BLUFF', content: 'Check-raised the flop, barreled turn, went all-in river with air. They folded top pair. 😤', pot: '33,600', likes: 1109, comments: 177, timeAgo: '1d', repostedFrom: 'PokerPhantom' },
];
const MY_LIKES: MePost[] = [
  { id: 'ml1', tag: 'BAD BEAT', content: 'Quad Aces cracked by a straight flush. The odds are 0.000000001%.', pot: '91,000', handRank: 'Quad Aces', likes: 2103, comments: 318, timeAgo: '6h', repostedFrom: 'NeonAce_' },
  { id: 'ml2', tag: 'ALL-IN', content: 'Five-way all-in pre-flop. I had AA. Flopped a set. Turned quads.', pot: '62,500', handRank: 'Quad Aces', likes: 1876, comments: 204, timeAgo: '8h', repostedFrom: 'ShadowKing' },
];
const INITIAL_MY_POSTS: MePost[] = [
  { id: 'mp1', tag: 'WIN', content: 'Picked up Aces UTG, ran it up to a 3-way all-in and held. First Royal Flush of my career. 🃏', pot: '24,800', handRank: 'Royal Flush', likes: 312, comments: 28, timeAgo: '3h' },
  { id: 'mp2', tag: 'ALL-IN', content: 'Short-stacked on the bubble. Shoved A9s, got called by KK, hit an ace on the flop. Still alive. 🙏', pot: '9,600', handRank: 'Pair of Aces', likes: 144, comments: 19, timeAgo: '1d' },
];

function MeSection({ myPosts, onDeletePost, bottomInset }: { myPosts: MePost[]; onDeletePost: (id: string) => void; bottomInset: number }) {
  const { profile, winRate } = useUser();
  const { following, notifications } = useSocial();
  const [subTab, setSubTab] = useState<'posts' | 'reposts' | 'likes'>('posts');

  const meAvatarId = profile.symbolIndex && profile.symbolIndex > 0 ? profile.symbolIndex : 1;
  const neonCol = getNeonAvatar(meAvatarId).color;
  const avatarType = profile.profileImageType ?? 'symbol';
  const data = subTab === 'posts' ? myPosts : subTab === 'reposts' ? MY_REPOSTS : MY_LIKES;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomInset + 90 }}>
      {/* Profile mini-header */}
      <View style={me.profileHeader}>
        <LinearGradient colors={['#1a0035', '#080018']} style={StyleSheet.absoluteFill} />
        <View style={me.avatarWrap}>
          {avatarType === 'custom' && profile.avatarUri ? (
            <Image source={{ uri: profile.avatarUri }} style={[me.bigAvatar, { borderColor: colors.primary }]} />
          ) : (
            <NeonAvatar
              avatarId={profile.symbolIndex && profile.symbolIndex > 0 ? profile.symbolIndex : 1}
              size={60}
              isEquipped
            />
          )}
          <LinearGradient colors={[`${neonCol}40`, 'transparent']} style={me.glow} />
        </View>
        <View style={me.profileInfo}>
          <Text style={me.username}>{profile.username}</Text>
          <Text style={me.handle}>@{profile.username.toLowerCase().replace(/\s/g, '')}</Text>
          <View style={[me.rankBadge, { borderColor: `${colors.accent}60` }]}>
            <Ionicons name="star" size={9} color={colors.accent} />
            <Text style={me.rankText}>{profile.rank}</Text>
          </View>
        </View>
        <TouchableOpacity style={me.editBtn} onPress={() => router.push('/(tabs)/profile')}>
          <Ionicons name="pencil-outline" size={13} color={colors.primary} />
          <Text style={me.editText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Stats strip */}
      <View style={me.statsStrip}>
        <View style={me.stat}><Text style={me.statVal}>{myPosts.length}</Text><Text style={me.statLabel}>Posts</Text></View>
        <View style={me.statDiv} />
        <View style={me.stat}><Text style={me.statVal}>{following.size}</Text><Text style={me.statLabel}>Following</Text></View>
        <View style={me.statDiv} />
        <View style={me.stat}><Text style={[me.statVal, { color: colors.secondary }]}>{notifications.filter(n => !n.read).length}</Text><Text style={me.statLabel}>Notifs</Text></View>
        <View style={me.statDiv} />
        <View style={me.stat}><Text style={[me.statVal, { color: colors.success }]}>{winRate}%</Text><Text style={me.statLabel}>Win Rate</Text></View>
      </View>

      {/* Sub-tabs */}
      <View style={me.subTabBar}>
        {ME_SUBTABS.map(t => {
          const active = subTab === t.id;
          return (
            <TouchableOpacity key={t.id} style={me.subTab} onPress={() => setSubTab(t.id as typeof subTab)}>
              <Ionicons name={t.icon} size={13} color={active ? colors.primary : colors.textDim} />
              <Text style={[me.subTabText, active && me.subTabActive]}>{t.label}</Text>
              {active && <View style={me.indicator} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Posts */}
      <View style={{ paddingHorizontal: 14, paddingTop: 12, gap: 12 }}>
        {data.length === 0 ? (
          <View style={me.empty}>
            <Ionicons name="albums-outline" size={34} color={colors.textDim} />
            <Text style={me.emptyText}>Nothing here yet</Text>
          </View>
        ) : data.map(post => {
          const typeColor = POST_TAG_COLORS[post.tag];
          const isRepost = subTab === 'reposts' || subTab === 'likes';
          const isOwnPost = subTab === 'posts';
          return (
            <View key={post.id} style={me.postCard}>
              <LinearGradient colors={['#120025', '#080018']} style={StyleSheet.absoluteFill} />
              {isRepost && post.repostedFrom && (
                <View style={me.repostBanner}>
                  <Ionicons name={subTab === 'likes' ? 'heart' : 'repeat'} size={10} color={subTab === 'likes' ? colors.secondary : colors.success} />
                  <Text style={[me.repostLabel, { color: subTab === 'likes' ? colors.secondary : colors.success }]}>
                    {subTab === 'likes' ? 'You liked' : 'You reposted'} · @{post.repostedFrom}
                  </Text>
                </View>
              )}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <NeonAvatar avatarId={isRepost ? 4 : meAvatarId} size={28} />
                <View style={{ flex: 1 }}>
                  <Text style={me.postUser}>{isRepost ? post.repostedFrom : profile.username}</Text>
                  <Text style={me.postTime}>{post.timeAgo}</Text>
                </View>
                <View style={[cd.typeBadge, { backgroundColor: `${typeColor}18`, borderColor: `${typeColor}40` }]}>
                  <Text style={[cd.typeText, { color: typeColor }]}>{post.tag}</Text>
                </View>
                {isOwnPost && (
                  <TouchableOpacity onPress={() => onDeletePost(post.id)} style={me.deleteBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="trash-outline" size={13} color="rgba(255,80,80,0.5)" />
                  </TouchableOpacity>
                )}
              </View>
              <Text style={cd.content}>{post.content}</Text>
              <View style={cd.actions}>
                <View style={cd.actionBtn}>
                  <Ionicons name="heart-outline" size={16} color={colors.textMuted} />
                  <Text style={cd.actionCount}>{post.likes}</Text>
                </View>
                <View style={cd.actionBtn}>
                  <Ionicons name="chatbubble-outline" size={14} color={colors.textMuted} />
                  <Text style={cd.actionCount}>{post.comments}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const me = StyleSheet.create({
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 18, overflow: 'hidden', borderBottomWidth: 1, borderBottomColor: colors.border },
  avatarWrap: { position: 'relative' },
  bigAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.surface, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  bigAvatarText: { fontSize: 28, fontWeight: '700' },
  glow: { position: 'absolute', top: -4, left: -4, right: -4, bottom: -4, borderRadius: 34 },
  profileInfo: { flex: 1, gap: 4 },
  username: { color: colors.text, fontSize: 16, fontWeight: '800' },
  handle: { color: colors.textDim, fontSize: 11 },
  rankBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-start', borderWidth: 1, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, backgroundColor: `${colors.accent}10` },
  rankText: { color: colors.accent, fontSize: 9, fontWeight: '700' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: colors.primary, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6 },
  editText: { color: colors.primary, fontSize: 10, fontWeight: '700' },
  statsStrip: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statVal: { color: colors.text, fontSize: 16, fontWeight: '800' },
  statLabel: { color: colors.textDim, fontSize: 9 },
  statDiv: { width: 1, height: 26, backgroundColor: colors.border },
  subTabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  subTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 11, position: 'relative' },
  subTabText: { color: colors.textDim, fontSize: 11, fontWeight: '600' },
  subTabActive: { color: colors.primary, fontWeight: '800' },
  indicator: { position: 'absolute', bottom: 0, left: '15%', right: '15%', height: 2, backgroundColor: colors.primary, borderRadius: 1 },
  repostBanner: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingBottom: 5 },
  repostLabel: { fontSize: 10, fontWeight: '600' },
  postCard: { borderRadius: 14, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', padding: 12, gap: 8 },
  postAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.surface, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  postUser: { color: colors.text, fontSize: 12, fontWeight: '700' },
  postTime: { color: colors.textDim, fontSize: 10 },
  empty: { alignItems: 'center', paddingVertical: 44, gap: 10 },
  emptyText: { color: colors.textDim, fontSize: 13 },
  deleteBtn: { padding: 3 },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────

// ─── AI Post Mini-Card (for trending header strip) ────────────────────────────

function AIPostMiniCard({ post }: { post: AIPost }) {
  return (
    <View style={aiCardStyle.card}>
      <LinearGradient
        colors={['#120028', '#080018']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />
      <View style={[aiCardStyle.accentLine, { backgroundColor: post.tagColor }]} />
      {/* Header row */}
      <View style={aiCardStyle.header}>
        <NeonAvatar avatarId={post.personality.avatarId} size={32} />
        <View style={{ flex: 1 }}>
          <Text style={aiCardStyle.username} numberOfLines={1}>{post.personality.username}</Text>
          <Text style={aiCardStyle.timeAgo}>{post.timeAgo}</Text>
        </View>
        <View style={[aiCardStyle.tag, { backgroundColor: `${post.tagColor}20`, borderColor: `${post.tagColor}55` }]}>
          <Text style={[aiCardStyle.tagText, { color: post.tagColor }]}>{post.tag}</Text>
        </View>
      </View>
      {/* Content */}
      <Text style={aiCardStyle.content} numberOfLines={3}>{post.content}</Text>
      {/* Footer */}
      <View style={aiCardStyle.footer}>
        <Ionicons name="heart" size={11} color="rgba(255,0,144,0.7)" />
        <Text style={aiCardStyle.footerNum}>{post.likes >= 1000 ? `${(post.likes / 1000).toFixed(1)}K` : post.likes}</Text>
        {post.pot && (
          <>
            <Ionicons name="cash-outline" size={11} color="rgba(0,212,255,0.6)" style={{ marginLeft: 6 }} />
            <Text style={[aiCardStyle.footerNum, { color: 'rgba(0,212,255,0.7)' }]}>{post.pot}</Text>
          </>
        )}
      </View>
    </View>
  );
}

const aiCardStyle = StyleSheet.create({
  card: {
    width: 220, borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    padding: 12, gap: 8,
  },
  accentLine: { position: 'absolute', top: 0, left: 0, right: 0, height: 2 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: {
    width: 30, height: 30, borderRadius: 15,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 10, fontWeight: '800', fontFamily: 'Orbitron_700Bold' },
  username: { color: '#e0d4ff', fontSize: 11, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  timeAgo: { color: 'rgba(255,255,255,0.3)', fontSize: 9, marginTop: 1 },
  tag: { borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1 },
  tagText: { fontSize: 8, fontWeight: '800', letterSpacing: 0.6, fontFamily: 'Orbitron_700Bold' },
  content: { color: 'rgba(255,255,255,0.7)', fontSize: 11, lineHeight: 16 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  footerNum: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '600' },
});

// ─── AI Posts header strip (shown on Trending tab) ────────────────────────────

function AIPostsStrip({ posts }: { posts: AIPost[] }) {
  if (posts.length === 0) return null;
  return (
    <View style={stripStyle.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={stripStyle.scroll}
      >
        {posts.map(p => <AIPostMiniCard key={p.id} post={p} />)}
      </ScrollView>
    </View>
  );
}

const stripStyle = StyleSheet.create({
  wrap: { paddingTop: 10, paddingBottom: 4 },
  label: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, marginBottom: 8,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00ff88' },
  labelText: {
    color: 'rgba(255,255,255,0.35)', fontSize: 9, fontWeight: '800',
    letterSpacing: 1.5, fontFamily: 'Orbitron_400Regular',
  },
  scroll: { gap: 10, paddingHorizontal: 14 },
});

// ─── Main Feed Screen ─────────────────────────────────────────────────────────

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const cls = useColors();
  const [activeTab, setActiveTab] = useState('trending');
  const [composeVisible, setComposeVisible] = useState(false);
  const [myPosts, setMyPosts] = useState<MePost[]>(INITIAL_MY_POSTS);
  const [notifVisible, setNotifVisible] = useState(false);
  const { posts: aiPosts } = useAISocial();

  const filteredPosts = useCallback(() => {
    if (activeTab === 'trending') return SOCIAL_POSTS;
    return SOCIAL_POSTS.filter(p => p.tab === activeTab);
  }, [activeTab]);

  return (
    <View style={[ss.container, { backgroundColor: cls.background }]}>
      <LinearGradient colors={[cls.background, cls.surfaceElevated]} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={[ss.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 0) }]}>
        <Text style={ss.headerTitle}>FEED</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <NotifBell onPress={() => setNotifVisible(true)} />
          {activeTab !== 'me' && (
            <TouchableOpacity style={ss.newPostBtn} onPress={() => setComposeVisible(true)}>
              <Ionicons name="add" size={16} color={colors.primary} />
              <Text style={ss.newPostText}>Post</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Live ticker */}
      <LiveTicker />

      {/* Tab bar */}
      <View style={ss.tabBarOuter}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={ss.tabBarScroll}
          contentContainerStyle={ss.tabBarContent}
        >
          {FEED_TABS.map(tab => {
            const active = activeTab === tab.id;
            const isMe   = tab.id === 'me';
            const ac     = isMe ? colors.secondary : colors.primary;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  ss.tab,
                  active && {
                    borderColor: ac,
                    backgroundColor: isMe ? 'rgba(255,0,144,0.15)' : 'rgba(0,212,255,0.13)',
                    shadowColor: ac,
                    shadowOpacity: 0.55,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 0 },
                    elevation: 6,
                  },
                ]}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={active ? tab.icon : (tab.icon + '-outline') as typeof tab.icon}
                  size={13}
                  color={active ? ac : colors.textDim}
                />
                <Text style={[ss.tabText, active && { color: ac, fontWeight: '800', fontFamily: 'Orbitron_700Bold' }]}>
                  {tab.label}
                </Text>
                {active && <View style={[ss.tabDot, { backgroundColor: ac }]} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Content */}
      {activeTab === 'me' ? (
        <MeSection
          myPosts={myPosts}
          onDeletePost={(id) => setMyPosts(prev => prev.filter(p => p.id !== id))}
          bottomInset={insets.bottom}
        />
      ) : activeTab === 'leaderboard' ? (
        <LeaderboardSection bottomInset={insets.bottom} />
      ) : activeTab === 'search' ? (
        <SearchSection bottomInset={insets.bottom} />
      ) : (
        <FlatList
          data={filteredPosts()}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <PostCard post={item} />}
          ListHeaderComponent={activeTab === 'trending' ? <AIPostsStrip posts={aiPosts.slice(0, 6)} /> : null}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: insets.bottom + 90, gap: 12 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <ComposeSheet
        visible={composeVisible}
        onClose={() => setComposeVisible(false)}
        onPost={p => setMyPosts(prev => [p, ...prev])}
        bottomInset={insets.bottom}
      />

      {notifVisible && <NotificationsPanel onClose={() => setNotifVisible(false)} />}
    </View>
  );
}

const ss = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { color: colors.primary, fontSize: 20, fontWeight: '800', fontFamily: 'Orbitron_700Bold', letterSpacing: 3 },
  newPostBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: colors.primary, borderRadius: 20, paddingHorizontal: 11, paddingVertical: 6 },
  newPostText: { color: colors.primary, fontSize: 11, fontWeight: '700' },
  tabBarOuter: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  tabBarScroll: { flexGrow: 0 },
  tabBarContent: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    position: 'relative',
    minWidth: 70,
    justifyContent: 'center',
  },
  tabDot: {
    position: 'absolute',
    bottom: -1,
    left: '50%',
    width: 4,
    height: 4,
    borderRadius: 2,
    marginLeft: -2,
  },
  tabText: { color: colors.textDim, fontSize: 11, fontWeight: '600', letterSpacing: 0.2 },
});
