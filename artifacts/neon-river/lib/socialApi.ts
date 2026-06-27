// ─── Social API helper ────────────────────────────────────────────────────────
// Thin wrapper around fetch for the social endpoints.
// Auth: pass playerId via x-player-id header.

function getBase(): string {
  const envUrl = process.env['EXPO_PUBLIC_API_URL'];
  if (envUrl) return envUrl;
  return 'https://api-server-production-bbc2.up.railway.app/api';
}

async function req<T>(
  path: string,
  playerId: string,
  opts: RequestInit = {},
): Promise<T> {
  const r = await fetch(`${getBase()}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'x-player-id': playerId,
      ...(opts.headers ?? {}),
    },
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({ error: r.statusText }));
    throw new Error((err as any).error ?? r.statusText);
  }
  return r.json() as Promise<T>;
}

// ── Search ────────────────────────────────────────────────────────────────────

export interface SearchPlayer {
  playerId: string;
  username: string;
  level: number;
  chips: number;
  avatarIndex: number;
  rank: string;
  status: string;
}

export async function searchPlayers(q: string): Promise<SearchPlayer[]> {
  const r = await fetch(`${getBase()}/social/search?q=${encodeURIComponent(q)}`);
  if (!r.ok) throw new Error('Search failed');
  const d = await r.json() as { players: SearchPlayer[] };
  return d.players;
}

// ── Follow ────────────────────────────────────────────────────────────────────

export async function followPlayer(playerId: string, targetId: string) {
  return req<{ ok: boolean }>(`/social/follow/${targetId}`, playerId, { method: 'POST' });
}

export async function unfollowPlayer(playerId: string, targetId: string) {
  return req<{ ok: boolean }>(`/social/follow/${targetId}`, playerId, { method: 'DELETE' });
}

export async function getFollowing(playerId: string): Promise<string[]> {
  const d = await req<{ following: string[] }>('/social/following', playerId);
  return d.following;
}

// ── Conversations ─────────────────────────────────────────────────────────────

export interface Conversation {
  id: string;
  otherId: string;
  otherUsername: string;
  otherAvatarIndex: number;
  lastPreview: string;
  lastAt: string | null;
  unread: number;
}

export async function getConversations(playerId: string): Promise<Conversation[]> {
  const d = await req<{ conversations: Conversation[] }>('/social/conversations', playerId);
  return d.conversations;
}

export async function startConversation(playerId: string, targetId: string): Promise<string> {
  const d = await req<{ conversationId: string }>('/social/conversations/start', playerId, {
    method: 'POST',
    body: JSON.stringify({ targetId }),
  });
  return d.conversationId;
}

// ── Messages ──────────────────────────────────────────────────────────────────

export interface DMessage {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  readAt: string | null;
  isReported: boolean;
  createdAt: string;
}

export async function getMessages(playerId: string, conversationId: string): Promise<DMessage[]> {
  const d = await req<{ messages: DMessage[] }>(`/social/conversations/${conversationId}/messages`, playerId);
  return d.messages;
}

export async function sendMessage(playerId: string, conversationId: string, text: string): Promise<DMessage> {
  const d = await req<{ message: DMessage }>(`/social/conversations/${conversationId}/messages`, playerId, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
  return d.message;
}

// ── Unread count ──────────────────────────────────────────────────────────────

export async function getUnreadCount(playerId: string): Promise<number> {
  const d = await req<{ unread: number }>('/social/inbox/unread', playerId);
  return d.unread;
}

// ── Player profile (public) ───────────────────────────────────────────────────

export interface PlayerProfile {
  playerId: string;
  username: string;
  level: number;
  chips: number;
  avatarIndex: number;
  rank: string;
  winRate: number;
  handsPlayed: number;
  status: string;
}

export async function getPlayerProfile(targetId: string): Promise<PlayerProfile | null> {
  const r = await fetch(`${getBase()}/social/players/${targetId}`);
  if (!r.ok) return null;
  const d = await r.json() as { player: PlayerProfile };
  return d.player;
}

// ── Block ─────────────────────────────────────────────────────────────────────

export async function blockPlayer(playerId: string, targetId: string) {
  return req<{ ok: boolean }>(`/social/block/${targetId}`, playerId, { method: 'POST' });
}

export async function unblockPlayer(playerId: string, targetId: string) {
  return req<{ ok: boolean }>(`/social/block/${targetId}`, playerId, { method: 'DELETE' });
}

export async function getBlocks(playerId: string): Promise<string[]> {
  const d = await req<{ blocks: string[] }>('/social/blocks', playerId);
  return d.blocks;
}

// ── Live Feed ──────────────────────────────────────────────────────────────────

export interface FeedPost {
  id:                string;
  authorId:          string;
  authorUsername:    string;
  authorAvatarIndex: number;
  authorRank:        string;
  content:           string;
  tag:               string;
  pot:               string | null;
  handRank:          string | null;
  likeCount:         number;
  commentCount:      number;
  likedByMe:         boolean;
  createdAt:         string | Date;
}

export interface FeedComment {
  id:                string;
  postId:            string;
  authorId:          string;
  authorUsername:    string;
  authorAvatarIndex: number;
  text:              string;
  createdAt:         string | Date;
}

export async function getFeed(
  playerId: string,
  tab: 'all' | 'trending' | 'me',
  cursor?: string,
): Promise<FeedPost[]> {
  const params = new URLSearchParams({ tab });
  if (cursor) params.set('cursor', cursor);
  const d = await req<{ posts: FeedPost[] }>(`/social/feed?${params}`, playerId);
  return d.posts;
}

export async function createPost(
  playerId: string,
  data: {
    content: string; tag: string; pot?: string; handRank?: string;
    authorUsername?: string; authorAvatarIndex?: number; authorRank?: string;
  },
): Promise<FeedPost> {
  const d = await req<{ post: FeedPost }>('/social/posts', playerId, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return d.post;
}

export async function toggleLike(
  playerId: string,
  postId: string,
): Promise<{ liked: boolean; likeCount: number }> {
  return req<{ liked: boolean; likeCount: number }>(
    `/social/posts/${postId}/like`, playerId, { method: 'POST' },
  );
}

export async function getComments(postId: string, playerId: string): Promise<FeedComment[]> {
  const d = await req<{ comments: FeedComment[] }>(`/social/posts/${postId}/comments`, playerId);
  return d.comments;
}

export async function addComment(
  playerId: string, postId: string, text: string,
): Promise<FeedComment> {
  const d = await req<{ comment: FeedComment }>(`/social/posts/${postId}/comments`, playerId, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
  return d.comment;
}

export async function deleteFeedPost(playerId: string, postId: string): Promise<void> {
  await req<{ ok: boolean }>(`/social/posts/${postId}`, playerId, { method: 'DELETE' });
}
