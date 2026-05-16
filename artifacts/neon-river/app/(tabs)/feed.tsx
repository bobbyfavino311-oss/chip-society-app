import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useRef } from 'react';
import {
  FlatList,
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

// ─── Types & constants ────────────────────────────────────────────────────────

type PostType = 'WIN' | 'BLUFF' | 'BAD BEAT' | 'ALL-IN' | 'HIGHLIGHT';

const POST_TYPE_COLORS: Record<PostType, string> = {
  WIN: colors.success,
  BLUFF: colors.accent,
  'BAD BEAT': colors.warning,
  'ALL-IN': colors.secondary,
  HIGHLIGHT: colors.primary,
};

const POST_TYPE_ICONS: Record<PostType, React.ComponentProps<typeof Ionicons>['name']> = {
  WIN: 'trophy-outline',
  BLUFF: 'glasses-outline',
  'BAD BEAT': 'sad-outline',
  'ALL-IN': 'flame-outline',
  HIGHLIGHT: 'star-outline',
};

const ALL_POST_TYPES: PostType[] = ['WIN', 'BLUFF', 'BAD BEAT', 'ALL-IN', 'HIGHLIGHT'];
const MAX_CHARS = 280;

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

interface MePost {
  id: string;
  type: PostType;
  content: string;
  pot?: string;
  handRank?: string;
  likes: number;
  comments: number;
  timeAgo: string;
  repostedFrom?: string;
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
    content: 'Five-way all-in pre-flop. I had AA. Flopped a set. Turned quads. River was irrelevant.',
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

const INITIAL_MY_POSTS: MePost[] = [
  {
    id: 'mp1', type: 'WIN',
    content: 'Picked up Aces UTG, ran it up to a 3-way all-in and held. First Royal Flush of my career tonight. 🃏',
    pot: '24,800', handRank: 'Royal Flush', likes: 312, comments: 28, timeAgo: '3h',
  },
  {
    id: 'mp2', type: 'ALL-IN',
    content: 'Short-stacked on the bubble. Shoved A9s, got called by KK, hit an ace on the flop. Still alive. 🙏',
    pot: '9,600', handRank: 'Pair of Aces', likes: 144, comments: 19, timeAgo: '1d',
  },
  {
    id: 'mp3', type: 'BAD BEAT',
    content: 'Flopped a straight flush draw with the nut flush. Turn gave me the straight flush. River counterfeited everything somehow. Table erupted.',
    pot: '41,200', handRank: 'Straight Flush', likes: 876, comments: 104, timeAgo: '3d',
  },
];

const MY_REPOSTS: MePost[] = [
  {
    id: 'mr1', type: 'WIN',
    content: 'Royal Flush on the river. The whole table went silent. 🃏🔥 I just sat there and let it breathe.',
    pot: '42,400', handRank: 'Royal Flush', likes: 1240, comments: 87, timeAgo: '2h',
    repostedFrom: 'NightShark99',
  },
  {
    id: 'mr2', type: 'BLUFF',
    content: 'Check-raised the flop, barrel turned, went all-in river with air. They tanked for 3 minutes and folded top pair top kicker. 😤',
    pot: '33,600', likes: 1109, comments: 177, timeAgo: '1d',
    repostedFrom: 'PokerPhantom',
  },
  {
    id: 'mr3', type: 'HIGHLIGHT',
    content: 'Finished 3rd in the Neon Championship last night. 128-player field. Proud of the run. Thanks for the rail!',
    pot: '15,000', likes: 432, comments: 56, timeAgo: '12h',
    repostedFrom: 'MiamiDreams',
  },
];

const MY_LIKES: MePost[] = [
  {
    id: 'ml1', type: 'BAD BEAT',
    content: 'Quad Aces cracked by a straight flush. I need a moment. The odds of that happening are 0.000000001%.',
    pot: '91,000', handRank: 'Quad Aces', likes: 2103, comments: 318, timeAgo: '6h',
    repostedFrom: 'NeonAce_',
  },
  {
    id: 'ml2', type: 'ALL-IN',
    content: 'Five-way all-in pre-flop. I had AA. Flopped a set. Turned quads. River was irrelevant.',
    pot: '62,500', handRank: 'Quad Aces', likes: 1876, comments: 204, timeAgo: '8h',
    repostedFrom: 'ShadowKing',
  },
  {
    id: 'ml3', type: 'WIN',
    content: 'Won a 5-hour session grinding cash. Up 12 buy-ins. The patience game is everything.',
    pot: '48,000', likes: 789, comments: 63, timeAgo: '2d',
    repostedFrom: 'GlacierGhost',
  },
  {
    id: 'ml4', type: 'BLUFF',
    content: 'Triple-barrel bluffed with 7-2 offsuit on a KQ4 paired board. They had a set and they folded it. This is art.',
    pot: '18,200', handRank: '7-2 Offsuit', likes: 887, comments: 142, timeAgo: '4h',
    repostedFrom: 'VegasMirage',
  },
];

const FEED_TABS = [
  { id: 'trending',   label: 'Trending',     icon: 'flame' as const },
  { id: 'following',  label: 'Following',    icon: 'people' as const },
  { id: 'pots',       label: 'Biggest Pots', icon: 'cash' as const },
  { id: 'highlights', label: 'Highlights',   icon: 'star' as const },
  { id: 'me',         label: 'Me',           icon: 'person-circle' as const },
];

const ME_SUBTABS = [
  { id: 'posts', label: 'Posts', icon: 'create-outline' as const },
  { id: 'reposts', label: 'Reposts', icon: 'repeat' as const },
  { id: 'likes', label: 'Likes', icon: 'heart-outline' as const },
];

// ─── Compose Sheet (inline overlay — works on web & native) ──────────────────

interface ComposeSheetProps {
  visible: boolean;
  onClose: () => void;
  onPost: (post: MePost) => void;
  bottomInset: number;
}

function ComposeSheet({ visible, onClose, onPost, bottomInset }: ComposeSheetProps) {
  const { profile } = useUser();
  const [text, setText] = useState('');
  const [postType, setPostType] = useState<PostType>('WIN');
  const [pot, setPot] = useState('');
  const [handRank, setHandRank] = useState('');
  const [showOptionals, setShowOptionals] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const AVATAR_SYMBOLS = ['♠', '♥', '♦', '♣', '★'];
  const AVATAR_COLORS = [colors.primary, colors.secondary, colors.gold, colors.accent, colors.success];
  const avatarSymbol = AVATAR_SYMBOLS[profile.avatarIndex % AVATAR_SYMBOLS.length];
  const avatarColor = AVATAR_COLORS[profile.avatarIndex % AVATAR_COLORS.length];

  const remaining = MAX_CHARS - text.length;
  const canPost = text.trim().length > 0 && remaining >= 0;

  function handlePost() {
    if (!canPost) return;
    const newPost: MePost = {
      id: `up_${Date.now()}`,
      type: postType,
      content: text.trim(),
      pot: pot.trim() || undefined,
      handRank: handRank.trim() || undefined,
      likes: 0,
      comments: 0,
      timeAgo: 'just now',
    };
    onPost(newPost);
    setText('');
    setPot('');
    setHandRank('');
    setPostType('WIN');
    setShowOptionals(false);
    onClose();
  }

  function handleClose() {
    setText('');
    setPot('');
    setHandRank('');
    setPostType('WIN');
    setShowOptionals(false);
    onClose();
  }

  if (!visible) return null;

  const typeColor = POST_TYPE_COLORS[postType];

  return (
    <View style={compose.overlay} pointerEvents="box-none">
      {/* Dim backdrop — only occupies space ABOVE the sheet, never overlaps it */}
      <TouchableOpacity style={compose.backdrop} activeOpacity={1} onPress={handleClose} />

      {/* Sheet */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={compose.kvSheet}>
        <View style={[compose.sheet, { paddingBottom: bottomInset + 12 }]}>
          <LinearGradient colors={['#160030', '#080018']} style={StyleSheet.absoluteFill} />

          {/* Handle bar */}
          <View style={compose.handle} />

          {/* Top bar */}
          <View style={compose.topBar}>
            <TouchableOpacity style={compose.cancelBtn} onPress={handleClose}>
              <Text style={compose.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={compose.sheetTitle}>New Post</Text>
            <TouchableOpacity
              style={[compose.postBtn, !canPost && compose.postBtnDisabled]}
              onPress={handlePost}
            >
              <Text style={[compose.postBtnText, !canPost && compose.postBtnTextDisabled]}>Post</Text>
            </TouchableOpacity>
          </View>

          {/* Author row */}
          <View style={compose.authorRow}>
            <View style={[compose.avatar, { borderColor: avatarColor }]}>
              <Text style={[compose.avatarText, { color: avatarColor }]}>{avatarSymbol}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={compose.authorName}>{profile.username}</Text>
              <Text style={compose.authorHandle}>@{profile.username.toLowerCase().replace(/\s/g, '')}</Text>
            </View>
          </View>

          {/* Text input */}
          <TextInput
            ref={inputRef}
            style={compose.input}
            placeholder="What happened at the table?"
            placeholderTextColor={colors.textDim}
            multiline
            maxLength={MAX_CHARS + 10}
            value={text}
            onChangeText={setText}
            selectionColor={colors.primary}
            autoFocus={Platform.OS !== 'web'}
          />

          {/* Post type chips */}
          <Text style={compose.sectionLabel}>Tag your hand</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={compose.typeRow}>
            {ALL_POST_TYPES.map(t => {
              const active = postType === t;
              const c = POST_TYPE_COLORS[t];
              return (
                <TouchableOpacity
                  key={t}
                  style={[compose.typeChip, { borderColor: active ? c : `${c}40`, backgroundColor: active ? `${c}22` : 'transparent' }]}
                  onPress={() => setPostType(t)}
                >
                  <Ionicons name={POST_TYPE_ICONS[t]} size={12} color={active ? c : colors.textDim} />
                  <Text style={[compose.typeChipText, { color: active ? c : colors.textDim }]}>{t}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Optional hand stats toggle */}
          <TouchableOpacity style={compose.optionalToggle} onPress={() => setShowOptionals(v => !v)}>
            <Ionicons name="layers-outline" size={14} color={colors.primary} />
            <Text style={compose.optionalToggleText}>Add hand stats (optional)</Text>
            <Ionicons name={showOptionals ? 'chevron-up' : 'chevron-down'} size={14} color={colors.textDim} />
          </TouchableOpacity>

          {showOptionals && (
            <View style={compose.optionalFields}>
              <View style={compose.fieldRow}>
                <Ionicons name="layers" size={13} color={colors.gold} />
                <TextInput
                  style={compose.fieldInput}
                  placeholder="Pot size (e.g. 42,000)"
                  placeholderTextColor={colors.textDim}
                  value={pot}
                  onChangeText={setPot}
                  selectionColor={colors.primary}
                />
              </View>
              <View style={[compose.fieldRow, { marginTop: 8 }]}>
                <Ionicons name="card" size={13} color={colors.primary} />
                <TextInput
                  style={compose.fieldInput}
                  placeholder="Best hand (e.g. Full House)"
                  placeholderTextColor={colors.textDim}
                  value={handRank}
                  onChangeText={setHandRank}
                  selectionColor={colors.primary}
                />
              </View>
            </View>
          )}

          {/* Char counter + type preview */}
          <View style={compose.footer}>
            <View style={[compose.selectedType, { borderColor: `${typeColor}50`, backgroundColor: `${typeColor}15` }]}>
              <Ionicons name={POST_TYPE_ICONS[postType]} size={11} color={typeColor} />
              <Text style={[compose.selectedTypeText, { color: typeColor }]}>{postType}</Text>
            </View>
            <Text style={[compose.counter, remaining < 20 && { color: remaining < 0 ? colors.secondary : colors.warning }]}>
              {remaining}
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Post card (community feed) ───────────────────────────────────────────────

function PostCard({ post }: { post: FeedPost }) {
  const [liked, setLiked] = useState(false);
  const [reposted, setReposted] = useState(false);
  const typeColor = POST_TYPE_COLORS[post.type];

  return (
    <View style={card.wrap}>
      <LinearGradient colors={['#120025', '#080018']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
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
      <Text style={card.content}>{post.content}</Text>
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
      <View style={card.actions}>
        <TouchableOpacity style={card.actionBtn} onPress={() => setLiked(l => !l)}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={18} color={liked ? colors.secondary : colors.textMuted} />
          <Text style={[card.actionCount, liked && { color: colors.secondary }]}>{liked ? post.likes + 1 : post.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={card.actionBtn}>
          <Ionicons name="chatbubble-outline" size={16} color={colors.textMuted} />
          <Text style={card.actionCount}>{post.comments}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={card.actionBtn} onPress={() => setReposted(r => !r)}>
          <Ionicons name="repeat" size={18} color={reposted ? colors.success : colors.textMuted} />
          <Text style={[card.actionCount, reposted && { color: colors.success }]}>{reposted ? 'Reposted' : 'Repost'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[card.actionBtn, { marginLeft: 'auto' }]}>
          <Ionicons name="share-outline" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Me post card ─────────────────────────────────────────────────────────────

function MePostCard({ post, username, avatarSymbol, avatarColor, subTab }: {
  post: MePost; username: string; avatarSymbol: string; avatarColor: string; subTab: string;
}) {
  const [liked, setLiked] = useState(subTab === 'likes');
  const typeColor = POST_TYPE_COLORS[post.type];
  const isRepost = subTab === 'reposts' || subTab === 'likes';

  return (
    <View style={card.wrap}>
      <LinearGradient colors={['#120025', '#080018']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />

      {isRepost && post.repostedFrom && (
        <View style={meCard.repostBanner}>
          <Ionicons name={subTab === 'likes' ? 'heart' : 'repeat'} size={11} color={subTab === 'likes' ? colors.secondary : colors.success} />
          <Text style={[meCard.repostLabel, { color: subTab === 'likes' ? colors.secondary : colors.success }]}>
            {subTab === 'likes' ? 'You liked' : 'You reposted'} · @{post.repostedFrom}
          </Text>
        </View>
      )}

      <View style={card.header}>
        <View style={[card.avatar, { borderColor: isRepost ? colors.textDim : avatarColor }]}>
          <Text style={[card.avatarText, { color: isRepost ? colors.textDim : avatarColor }]}>
            {isRepost ? '♠' : avatarSymbol}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={card.username}>{isRepost ? (post.repostedFrom ?? username) : username}</Text>
          <Text style={card.handle}>
            {isRepost
              ? `@${(post.repostedFrom ?? username).toLowerCase().replace(/\s/g, '')}`
              : `@${username.toLowerCase().replace(/\s/g, '')}`} · {post.timeAgo}
          </Text>
        </View>
        <View style={[card.typeBadge, { backgroundColor: `${typeColor}18`, borderColor: `${typeColor}40` }]}>
          <Text style={[card.typeText, { color: typeColor }]}>{post.type}</Text>
        </View>
      </View>

      <Text style={card.content}>{post.content}</Text>

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

      <View style={card.actions}>
        <TouchableOpacity style={card.actionBtn} onPress={() => setLiked(l => !l)}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={18} color={liked ? colors.secondary : colors.textMuted} />
          <Text style={[card.actionCount, liked && { color: colors.secondary }]}>{liked ? post.likes + 1 : post.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={card.actionBtn}>
          <Ionicons name="chatbubble-outline" size={16} color={colors.textMuted} />
          <Text style={card.actionCount}>{post.comments}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={card.actionBtn}>
          <Ionicons name="repeat" size={18} color={colors.textMuted} />
          <Text style={card.actionCount}>Repost</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[card.actionBtn, { marginLeft: 'auto' }]}>
          <Ionicons name="share-outline" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Me section ───────────────────────────────────────────────────────────────

function MeSection({
  myPosts, bottomInset,
}: { myPosts: MePost[]; bottomInset: number }) {
  const { profile, winRate } = useUser();
  const [subTab, setSubTab] = useState<'posts' | 'reposts' | 'likes'>('posts');

  const AVATAR_SYMBOLS = ['♠', '♥', '♦', '♣', '★'];
  const AVATAR_COLORS = [colors.primary, colors.secondary, colors.gold, colors.accent, colors.success];
  const avatarSymbol = AVATAR_SYMBOLS[profile.avatarIndex % AVATAR_SYMBOLS.length];
  const avatarColor = AVATAR_COLORS[profile.avatarIndex % AVATAR_COLORS.length];

  const data = subTab === 'posts' ? myPosts : subTab === 'reposts' ? MY_REPOSTS : MY_LIKES;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomInset + 90 }}>
      {/* Profile header */}
      <View style={meCard.profileHeader}>
        <LinearGradient colors={['#1a0035', '#080018']} style={StyleSheet.absoluteFill} />
        <View style={meCard.avatarWrap}>
          <View style={[meCard.bigAvatar, { borderColor: avatarColor }]}>
            <Text style={[meCard.bigAvatarText, { color: avatarColor }]}>{avatarSymbol}</Text>
          </View>
          <LinearGradient colors={[`${avatarColor}40`, 'transparent']} style={meCard.avatarGlow} />
        </View>
        <View style={meCard.profileInfo}>
          <Text style={meCard.username}>{profile.username}</Text>
          <Text style={meCard.handle}>@{profile.username.toLowerCase().replace(/\s/g, '')}</Text>
          <View style={[meCard.rankBadge, { borderColor: `${colors.accent}60` }]}>
            <Ionicons name="star" size={10} color={colors.accent} />
            <Text style={meCard.rankText}>{profile.rank}</Text>
          </View>
        </View>
        <TouchableOpacity style={meCard.editBtn}>
          <Ionicons name="pencil-outline" size={14} color={colors.primary} />
          <Text style={meCard.editText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Stats strip */}
      <View style={meCard.statsStrip}>
        <View style={meCard.stat}>
          <Text style={meCard.statVal}>{myPosts.length}</Text>
          <Text style={meCard.statLabel}>Posts</Text>
        </View>
        <View style={meCard.statDivider} />
        <View style={meCard.stat}>
          <Text style={meCard.statVal}>{MY_REPOSTS.length}</Text>
          <Text style={meCard.statLabel}>Reposts</Text>
        </View>
        <View style={meCard.statDivider} />
        <View style={meCard.stat}>
          <Text style={meCard.statVal}>{MY_LIKES.length}</Text>
          <Text style={meCard.statLabel}>Likes</Text>
        </View>
        <View style={meCard.statDivider} />
        <View style={meCard.stat}>
          <Text style={[meCard.statVal, { color: colors.success }]}>{winRate}%</Text>
          <Text style={meCard.statLabel}>Win rate</Text>
        </View>
      </View>

      {/* Sub-tabs */}
      <View style={meCard.subTabBar}>
        {ME_SUBTABS.map(t => {
          const active = subTab === t.id;
          return (
            <TouchableOpacity
              key={t.id}
              style={meCard.subTab}
              onPress={() => setSubTab(t.id as typeof subTab)}
            >
              <Ionicons name={t.icon} size={14} color={active ? colors.primary : colors.textDim} />
              <Text style={[meCard.subTabText, active && meCard.subTabTextActive]}>{t.label}</Text>
              {active && <View style={meCard.subTabIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Posts list */}
      <View style={{ paddingHorizontal: 14, paddingTop: 12, gap: 12 }}>
        {data.length === 0 ? (
          <View style={meCard.empty}>
            <Ionicons name="albums-outline" size={36} color={colors.textDim} />
            <Text style={meCard.emptyText}>Nothing here yet</Text>
          </View>
        ) : (
          data.map(post => (
            <MePostCard
              key={post.id}
              post={post}
              username={profile.username}
              avatarSymbol={avatarSymbol}
              avatarColor={avatarColor}
              subTab={subTab}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<string>('trending');
  const [composeVisible, setComposeVisible] = useState(false);
  const [myPosts, setMyPosts] = useState<MePost[]>(INITIAL_MY_POSTS);

  const filteredPosts = ALL_POSTS.filter(p =>
    activeTab === 'trending' ? true : p.tab === activeTab
  );

  function handleNewPost(post: MePost) {
    setMyPosts(prev => [post, ...prev]);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.background, colors.surfaceElevated]} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 0) }]}>
        <Text style={styles.headerTitle}>FEED</Text>
        {activeTab !== 'me' && (
          <TouchableOpacity style={styles.newPostBtn} onPress={() => setComposeVisible(true)}>
            <Ionicons name="add" size={18} color={colors.primary} />
            <Text style={styles.newPostText}>Post</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Main tab bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBarScroll}
        contentContainerStyle={styles.tabBarContent}
      >
        {FEED_TABS.map(tab => {
          const active = activeTab === tab.id;
          const isMe = tab.id === 'me';
          const activeColor = isMe ? colors.secondary : colors.primary;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, active && [styles.tabActive, { borderColor: activeColor, backgroundColor: isMe ? 'rgba(255,0,144,0.12)' : 'rgba(0,212,255,0.12)' }]]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.75}
            >
              <Ionicons
                name={tab.icon}
                size={13}
                color={active ? activeColor : colors.textDim}
              />
              <Text style={[styles.tabText, active && { color: activeColor, fontWeight: '800' }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Content */}
      {activeTab === 'me' ? (
        <MeSection myPosts={myPosts} bottomInset={insets.bottom} />
      ) : (
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
      )}

      {/* Compose sheet */}
      <ComposeSheet
        visible={composeVisible}
        onClose={() => setComposeVisible(false)}
        onPost={handleNewPost}
        bottomInset={insets.bottom}
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

const compose = StyleSheet.create({
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 999, justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  kvSheet: { width: '100%' },
  sheet: {
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderWidth: 1, borderBottomWidth: 0, borderColor: colors.border,
    overflow: 'hidden', paddingTop: 8,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: colors.border, alignSelf: 'center', marginBottom: 4,
  },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  sheetTitle: {
    color: colors.text, fontSize: 15, fontWeight: '800',
    fontFamily: 'Orbitron_700Bold', letterSpacing: 1,
  },
  cancelBtn: { paddingVertical: 4, paddingHorizontal: 2 },
  cancelText: { color: colors.textDim, fontSize: 14, fontWeight: '600' },
  postBtn: {
    backgroundColor: colors.primary, borderRadius: 20,
    paddingHorizontal: 18, paddingVertical: 8,
  },
  postBtnDisabled: { backgroundColor: `${colors.primary}40` },
  postBtnText: { color: colors.background, fontSize: 13, fontWeight: '800' },
  postBtnTextDisabled: { color: `${colors.background}80` },
  authorRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.surface, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '700' },
  authorName: { color: colors.text, fontSize: 14, fontWeight: '700' },
  authorHandle: { color: colors.textDim, fontSize: 11, marginTop: 1 },
  input: {
    color: colors.text, fontSize: 16, lineHeight: 24,
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10,
    minHeight: 100, textAlignVertical: 'top',
  },
  sectionLabel: {
    color: colors.textDim, fontSize: 11, fontWeight: '700',
    letterSpacing: 1, paddingHorizontal: 16, marginBottom: 8,
  },
  typeRow: { paddingHorizontal: 16, gap: 8 },
  typeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7,
  },
  typeChipText: { fontSize: 11, fontWeight: '700' },
  optionalToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4,
  },
  optionalToggleText: { color: colors.primary, fontSize: 12, fontWeight: '600', flex: 1 },
  optionalFields: { paddingHorizontal: 16, paddingTop: 4 },
  fieldRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: colors.surface,
  },
  fieldInput: { flex: 1, color: colors.text, fontSize: 13 },
  footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: colors.border, marginTop: 12,
  },
  selectedType: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  selectedTypeText: { fontSize: 10, fontWeight: '800' },
  counter: { color: colors.textDim, fontSize: 13, fontWeight: '600' },
});

const meCard = StyleSheet.create({
  profileHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 20,
    overflow: 'hidden',
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  avatarWrap: { position: 'relative' },
  bigAvatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.surface, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  bigAvatarText: { fontSize: 30, fontWeight: '700' },
  avatarGlow: {
    position: 'absolute', top: -4, left: -4, right: -4, bottom: -4,
    borderRadius: 36,
  },
  profileInfo: { flex: 1, gap: 4 },
  username: { color: colors.text, fontSize: 17, fontWeight: '800' },
  handle: { color: colors.textDim, fontSize: 12 },
  rankBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', borderWidth: 1,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
    backgroundColor: `${colors.accent}10`,
  },
  rankText: { color: colors.accent, fontSize: 10, fontWeight: '700' },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: colors.primary,
    borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6,
  },
  editText: { color: colors.primary, fontSize: 11, fontWeight: '700' },
  statsStrip: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statVal: { color: colors.text, fontSize: 17, fontWeight: '800' },
  statLabel: { color: colors.textDim, fontSize: 10 },
  statDivider: { width: 1, height: 28, backgroundColor: colors.border },
  subTabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  subTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 12, position: 'relative',
  },
  subTabText: { color: colors.textDim, fontSize: 12, fontWeight: '600' },
  subTabTextActive: { color: colors.primary, fontWeight: '800' },
  subTabIndicator: {
    position: 'absolute', bottom: 0, left: '15%', right: '15%',
    height: 2, backgroundColor: colors.primary, borderRadius: 1,
  },
  repostBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 5, paddingBottom: 6,
  },
  repostLabel: { fontSize: 11, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyText: { color: colors.textDim, fontSize: 14 },
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
  tabBarScroll: { flexGrow: 0, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  tabBarContent: { paddingHorizontal: 12, gap: 8, flexDirection: 'row', alignItems: 'center' },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 13, paddingVertical: 8,
    borderRadius: 50, borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tabActive: {
    borderWidth: 1.5,
  },
  tabText: { color: colors.textDim, fontSize: 12, fontWeight: '600' },
});
