import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useUser } from './UserContext';
import {
  type FeedPost, type FeedComment,
  getFeed, createPost as apiCreatePost, toggleLike, getComments, addComment, deleteFeedPost,
} from '@/lib/socialApi';

interface LiveFeedContextValue {
  allPosts:    FeedPost[];
  myPosts:     FeedPost[];
  loading:     boolean;
  refreshing:  boolean;
  refresh:     () => Promise<void>;
  likePost:    (postId: string) => void;
  commentOnPost:   (postId: string, text: string) => Promise<FeedComment | null>;
  getPostComments: (postId: string) => Promise<FeedComment[]>;
  publishPost: (data: { content: string; tag: string; pot?: string; handRank?: string }) => Promise<FeedPost | null>;
  deletePost:  (postId: string) => void;
}

const LiveFeedContext = createContext<LiveFeedContextValue>({
  allPosts: [], myPosts: [], loading: false, refreshing: false,
  refresh: async () => {},
  likePost: () => {},
  commentOnPost: async () => null,
  getPostComments: async () => [],
  publishPost: async () => null,
  deletePost: () => {},
});

const POLL_INTERVAL_MS = 30_000;

export function LiveFeedProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useUser();
  const playerId = profile?.playerId ?? '';

  const [allPosts, setAllPosts] = useState<FeedPost[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const pollerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const myPosts = allPosts.filter(p => p.authorId === playerId);

  const fetchPosts = useCallback(async (isRefresh = false) => {
    if (!playerId) return;
    try {
      if (isRefresh) setRefreshing(true);
      else if (allPosts.length === 0) setLoading(true);
      const posts = await getFeed(playerId, 'all');
      setAllPosts(posts);
    } catch {
      // silent — keep existing posts on network error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [playerId]);

  useEffect(() => {
    fetchPosts();
    pollerRef.current = setInterval(() => fetchPosts(), POLL_INTERVAL_MS);
    return () => { if (pollerRef.current) clearInterval(pollerRef.current); };
  }, [fetchPosts]);

  const refresh = useCallback(async () => { await fetchPosts(true); }, [fetchPosts]);

  const likePost = useCallback((postId: string) => {
    if (!playerId) return;
    setAllPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const liked = !p.likedByMe;
      return { ...p, likedByMe: liked, likeCount: p.likeCount + (liked ? 1 : -1) };
    }));
    toggleLike(playerId, postId).then(res => {
      setAllPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, likedByMe: res.liked, likeCount: res.likeCount } : p,
      ));
    }).catch(() => {
      setAllPosts(prev => prev.map(p => {
        if (p.id !== postId) return p;
        const liked = !p.likedByMe;
        return { ...p, likedByMe: liked, likeCount: p.likeCount + (liked ? 1 : -1) };
      }));
    });
  }, [playerId]);

  const commentOnPost = useCallback(async (postId: string, text: string): Promise<FeedComment | null> => {
    if (!playerId || !text.trim()) return null;
    try {
      const comment = await addComment(playerId, postId, text.trim());
      setAllPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p,
      ));
      return comment;
    } catch { return null; }
  }, [playerId]);

  const getPostComments = useCallback(async (postId: string): Promise<FeedComment[]> => {
    if (!playerId) return [];
    try { return await getComments(postId, playerId); }
    catch { return []; }
  }, [playerId]);

  const publishPost = useCallback(async (data: {
    content: string; tag: string; pot?: string; handRank?: string;
  }): Promise<FeedPost | null> => {
    if (!playerId) return null;
    const post = await apiCreatePost(playerId, {
      ...data,
      authorUsername:    profile?.username,
      authorAvatarIndex: profile?.symbolIndex ?? profile?.avatarIndex,
      authorRank:        profile?.rank,
    });
    if (post) {
      setAllPosts(prev => [post, ...prev]);
      // Re-fetch after a short delay so the DB write is reflected on pull-to-refresh
      setTimeout(() => { void fetchPosts(); }, 1500);
    }
    return post;
  }, [playerId, profile, fetchPosts]);

  const deletePost = useCallback((postId: string) => {
    setAllPosts(prev => prev.filter(p => p.id !== postId));
    if (playerId) deleteFeedPost(playerId, postId).catch(() => {});
  }, [playerId]);

  return (
    <LiveFeedContext.Provider value={{
      allPosts, myPosts, loading, refreshing,
      refresh, likePost, commentOnPost, getPostComments, publishPost, deletePost,
    }}>
      {children}
    </LiveFeedContext.Provider>
  );
}

export function useLiveFeed() { return useContext(LiveFeedContext); }
