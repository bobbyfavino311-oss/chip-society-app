import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/colors';

// ─── Mock data ────────────────────────────────────────────────────────────────

type PostType = 'WIN' | 'BLUFF' | 'BAD BEAT' | 'ALL-IN' | 'HIGHLIGHT';

const POST_TYPE_COLORS: Record<PostType, string> = {
  WIN: colors.success,
  BLUFF: colors.accent,
  'BAD BEAT': colors.warning,
  'ALL-IN': colors.secondary,
  HIGHLIGHT: colors.primary,
};

interface FeedPost {
  id: string;
  user: string;
  handle: string;
  avatar: string;
  avatarColor: string;
  type: PostType;
  content: string;
  pot?: string;
  handRank?: string;
  likes: number;
  comments: number;
  timeAgo: string;
  tab: 'following' | 'trending' | 'pots' | 'highlights';
}

const ALL_POSTS: FeedPost[] = [
  {
    id: '1', user: 'NightShark99', handle: '@nightshark99',
    avatar: '♠', avatarColor: colors.primary, type: 'WIN',
    content: 'Royal Flush on the river. The whole table went silent. 🃏🔥 I just sat there and let it breathe.',
    pot: '42,400', handRank: 'Royal Flush', likes: 1240, comments: 87, timeAgo: '2h',
    tab: 'trending',
  },
  {
    id: '2', user: 'VegasMirage', handle: '@vegasmirage',
    avatar: '♥', avatarColor: colors.secondary, type: 'BLUFF',
    content: 'Triple-barrel bluffed with 7-2 offsuit on a KQ4 paired board. They had a set and they folded it. This is art.',
    pot: '18,200', handRank: '7-2 Offsuit', likes: 887, comments: 142, timeAgo: '4h',
    tab: 'trending',
  },
  {
    id: '3', user: 'NeonAce_', handle: '@neonace_',
    avatar: '♦', avatarColor: colors.gold, type: 'BAD BEAT',
    content: 'Quad Aces cracked by a straight flush. I need a moment. The odds of that happening are 0.000000001%.',
    pot: '91,000', handRank: 'Quad Aces', likes: 2103, comments: 318, timeAgo: '6h',
    tab: 'pots',
  },
  {
    id: '4', user: 'ShadowKing', handle: '@shadowking',
    avatar: '♣', avatarColor: colors.accent, type: 'ALL-IN',
    content: 'Five-way all-in pre-flop. I had AA. Flopped a set. Turned quads. River was irrelevant. ',
    pot: '62,500', handRank: 'Quad Aces', likes: 1876, comments: 204, timeAgo: '8h',
    tab: 'pots',
  },
  {
    id: '5', user: 'MiamiDreams', handle: '@miamidreams',
    avatar: '★', avatarColor: colors.success, type: 'HIGHLIGHT',
    content: 'Finished 3rd in the Neon Championship last night. 128-player field. Proud of the run. Thanks for the rail!',
    pot: '15,000', likes: 432, comments: 56, timeAgo: '12h',
    tab: 'highlights',
  },
  {
    id: '6', user: 'BlazeFire77', handle: '@blazefire77',
    avatar: '♥', avatarColor: colors.warning, type: 'WIN',
    content: 'Coolered the table captain with KK vs QQ. He had 3-bet/4-bet/shoved and I snap called. GG.',
    pot: '28,800', handRank: 'Pair of Kings', likes: 654, comments: 91, timeAgo: '1d',
    tab: 'following',
  },
  {
    id: '7', user: 'PokerPhantom', handle: '@pokerphantom',
    avatar: '♠', avatarColor: colors.accent, type: 'BLUFF',
    content: 'Check-raised the flop, barrel turned, went all-in river with air. They tanked for 3 minutes and folded top pair top kicker. 😤',
    pot: '33,600', likes: 1109, comments: 177, timeAgo: '1d',
    tab: 'following',
  },
  {
    id: '8', user: 'GlacierGhost', handle: '@glacierghost',
    avatar: '♦', avatarColor: colors.primary, type: 'HIGHLIGHT',
    content: 'Won a 5-hour session grinding cash. Up 12 buy-ins. The patience game is everything.',
    pot: '48,000', likes: 789, comments: 63, timeAgo: '2d',
    tab: 'highlights',
  },
];

const TABS = [
  { id: 'trending', label: 'Trending' },
  { id: 'following', label: 'Following' },
  { id: 'pots', label: 'Biggest Pots' },
  { id: 'highlights', label: 'Highlights' },
];

// ─── Post card ────────────────────────────────────────────────────────────────

function PostCard({ post }: { post: FeedPost }) {
  const [liked, setLiked] = useState(false);
  const [reposted, setReposted] = useState(false);
  const typeColor = POST_TYPE_COLORS[post.type];

  return (
    <View style={card.wrap}>
      <LinearGradient
        colors={['#120025', '#080018']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Header */}
      <View style={card.header}>
        <View style={[card.avatar, { borderColor: post.avatarColor }]}>
          <Text style={[card.avatarText, { color: post.avatarColor }]}>{post.avatar}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={card.username}>{post.user}</Text>
          <Text style={card.handle}>{post.handle} · {post.timeAgo}</Text>
        </View>
        <View style={[card.typeBadge, { backgroundColor: `${typeColor}18`, borderColor: `${typeColor}40` }]}>
          <Text style={[card.typeText, { color: typeColor }]}>{post.type}</Text>
        </View>
      </View>

      {/* Content */}
      <Text style={card.content}>{post.content}</Text>

      {/* Hand stats */}
      {(post.pot || post.handRank) && (
        <View style={card.statsRow}>
          {post.pot && (
            <View style={card.statChip}>
              <Ionicons name="layers" size={10} color={colors.gold} />
              <Text style={card.statText}>Pot: <Text style={{ color: colors.gold }}>{post.pot}</Text></Text>
            </View>
          )}
          {post.handRank && (
            <View style={card.statChip}>
              <Ionicons name="card" size={10} color={colors.primary} />
              <Text style={card.statText}><Text style={{ color: colors.primary }}>{post.handRank}</Text></Text>
            </View>
          )}
        </View>
      )}

      {/* Actions */}
      <View style={card.actions}>
        <TouchableOpacity style={card.actionBtn} onPress={() => setLiked(l => !l)}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={18} color={liked ? colors.secondary : colors.textMuted} />
          <Text style={[card.actionCount, liked && { color: colors.secondary }]}>
            {liked ? post.likes + 1 : post.likes}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={card.actionBtn}>
          <Ionicons name="chatbubble-outline" size={16} color={colors.textMuted} />
          <Text style={card.actionCount}>{post.comments}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={card.actionBtn} onPress={() => setReposted(r => !r)}>
          <Ionicons name="repeat" size={18} color={reposted ? colors.success : colors.textMuted} />
          <Text style={[card.actionCount, reposted && { color: colors.success }]}>
            {reposted ? 'Reposted' : 'Repost'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[card.actionBtn, { marginLeft: 'auto' }]}>
          <Ionicons name="share-outline" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<string>('trending');

  const filteredPosts = ALL_POSTS.filter(p =>
    activeTab === 'trending' ? true : p.tab === activeTab
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background, '#080018']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 0) }]}>
        <Text style={styles.headerTitle}>FEED</Text>
        <TouchableOpacity style={styles.newPostBtn}>
          <Ionicons name="add" size={18} color={colors.primary} />
          <Text style={styles.newPostText}>Post</Text>
        </TouchableOpacity>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.label}
            </Text>
            {activeTab === tab.id && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Posts */}
      <FlatList
        data={filteredPosts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <PostCard post={item} />}
        contentContainerStyle={{
          paddingHorizontal: 14,
          paddingTop: 10,
          paddingBottom: insets.bottom + 90,
          gap: 12,
        }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const card = StyleSheet.create({
  wrap: {
    borderRadius: colors.radiusLg, borderWidth: 1,
    borderColor: colors.border, overflow: 'hidden', padding: 14, gap: 10,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.surface, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700' },
  username: { color: colors.text, fontSize: 14, fontWeight: '700' },
  handle: { color: colors.textDim, fontSize: 11, marginTop: 1 },
  typeBadge: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 3 },
  typeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  content: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.surface, borderRadius: 6, borderWidth: 1,
    borderColor: colors.border, paddingHorizontal: 8, paddingVertical: 4,
  },
  statText: { color: colors.textMuted, fontSize: 11 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingTop: 4, borderTopWidth: 1, borderTopColor: colors.border },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionCount: { color: colors.textMuted, fontSize: 12 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: {
    color: colors.primary, fontSize: 20, fontWeight: '800',
    fontFamily: 'Orbitron_700Bold', letterSpacing: 3,
  },
  newPostBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderColor: colors.primary, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  newPostText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1, alignItems: 'center', paddingVertical: 12, position: 'relative',
  },
  tabActive: {},
  tabText: { color: colors.textDim, fontSize: 11, fontWeight: '600' },
  tabTextActive: { color: colors.primary, fontWeight: '800' },
  tabIndicator: {
    position: 'absolute', bottom: 0, left: '20%', right: '20%',
    height: 2, backgroundColor: colors.primary, borderRadius: 1,
  },
});
