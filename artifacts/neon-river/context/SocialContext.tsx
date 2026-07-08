import React, {
  createContext, useCallback, useContext, useEffect, useRef, useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PostReactions } from '@/lib/socialData';
import { useUser } from '@/context/UserContext';
import { toggleRepost, getFollowingList, getMyReposts } from '@/lib/socialApi';

// ── Exported shared types ──────────────────────────────────────────────────────

export interface FollowingUser {
  id: string;
  username: string;
  avatarId: number;
  rank: string;
}

export interface RepostItem {
  postId: string;
  authorId: string;
  authorUsername: string;
  authorAvatarId: number;
  tag: string;
  content: string;
  pot?: string;
  handRank?: string;
  likeCount: number;
  commentCount: number;
  repostedAt: number; // ms timestamp
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SocialNotification {
  id: string;
  type: 'follow' | 'like' | 'reaction' | 'comment' | 'achievement';
  fromUser: string;
  message: string;
  timestamp: number;
  read: boolean;
}

interface SocialState {
  following: Set<string>;
  followingMeta: Record<string, FollowingUser>;
  myReposts: RepostItem[];
  likedPosts: Set<string>;
  myReactions: Record<string, keyof PostReactions>;
  notifications: SocialNotification[];
  unreadCount: number;
  muted: Set<string>;
  blocked: Set<string>;
  reportedPosts: Set<string>;
}

interface SocialContextValue extends SocialState {
  follow: (playerId: string, username: string, avatarId?: number, rank?: string) => void;
  unfollow: (playerId: string) => void;
  addRepost: (item: RepostItem) => void;
  removeRepost: (postId: string) => void;
  isReposted: (postId: string) => boolean;
  isFollowing: (playerId: string) => boolean;
  toggleLike: (postId: string) => void;
  isLiked: (postId: string) => boolean;
  setReaction: (postId: string, key: keyof PostReactions) => void;
  getReaction: (postId: string) => keyof PostReactions | null;
  markAllRead: () => void;
  addNotification: (n: Omit<SocialNotification, 'id' | 'timestamp' | 'read'>) => void;
  mute: (playerId: string, username: string) => void;
  unmute: (playerId: string) => void;
  isMuted: (playerId: string) => boolean;
  block: (playerId: string, username: string) => void;
  unblock: (playerId: string) => void;
  isBlocked: (playerId: string) => boolean;
  reportPost: (postId: string, reason: string) => void;
  isReported: (postId: string) => boolean;
}

const SocialContext = createContext<SocialContextValue | null>(null);

// ── Per-user storage keys ──────────────────────────────────────────────────────
// Keys are namespaced by playerId so switching accounts never leaks data.

const BASE_FOLLOWING      = '@chipsociety_social_following_v1';
const BASE_FOLLOWING_META = '@chipsociety_social_followingmeta_v1';
const BASE_MY_REPOSTS     = '@chipsociety_social_myreposts_v1';
const BASE_LIKED          = '@chipsociety_social_liked_v1';
const BASE_REACTIONS      = '@chipsociety_social_reactions_v1';
const BASE_NOTIFICATIONS  = '@chipsociety_social_notifications_v1';

function userKey(base: string, pid: string) {
  return pid ? `${base}_${pid}` : base;
}

const SEED_NOTIFICATIONS: SocialNotification[] = [];

// ── Provider ──────────────────────────────────────────────────────────────────

export function SocialProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useUser();
  const playerId = profile?.playerId ?? '';

  const [following, setFollowing]           = useState<Set<string>>(new Set());
  const [followingMeta, setFollowingMeta]   = useState<Record<string, FollowingUser>>({});
  const [myReposts, setMyReposts]           = useState<RepostItem[]>([]);
  const [likedPosts, setLikedPosts]         = useState<Set<string>>(new Set());
  const [myReactions, setMyReactions]       = useState<Record<string, keyof PostReactions>>({});
  const [notifications, setNotifications]   = useState<SocialNotification[]>(SEED_NOTIFICATIONS);
  const [muted, setMuted]                   = useState<Set<string>>(new Set());
  const [blocked, setBlocked]               = useState<Set<string>>(new Set());
  const [reportedPosts, setReportedPosts]   = useState<Set<string>>(new Set());

  const loaded       = useRef(false);
  const playerIdRef  = useRef(playerId);
  playerIdRef.current = playerId;

  // ── Reload from per-user AsyncStorage when account changes ────────────────

  useEffect(() => {
    // Sign-out: clear all social state
    if (!playerId) {
      setFollowing(new Set());
      setFollowingMeta({});
      setMyReposts([]);
      setLikedPosts(new Set());
      setMyReactions({});
      setNotifications(SEED_NOTIFICATIONS);
      setMuted(new Set());
      setBlocked(new Set());
      setReportedPosts(new Set());
      loaded.current = false;
      return;
    }

    // New user signed in — load their own data
    loaded.current = false;
    void (async () => {
      try {
        const [fRaw, fmRaw, rpRaw, lRaw, rRaw, nRaw] = await Promise.all([
          AsyncStorage.getItem(userKey(BASE_FOLLOWING, playerId)),
          AsyncStorage.getItem(userKey(BASE_FOLLOWING_META, playerId)),
          AsyncStorage.getItem(userKey(BASE_MY_REPOSTS, playerId)),
          AsyncStorage.getItem(userKey(BASE_LIKED, playerId)),
          AsyncStorage.getItem(userKey(BASE_REACTIONS, playerId)),
          AsyncStorage.getItem(userKey(BASE_NOTIFICATIONS, playerId)),
        ]);
        setFollowing(fRaw ? new Set(JSON.parse(fRaw) as string[]) : new Set());
        setFollowingMeta(fmRaw ? JSON.parse(fmRaw) as Record<string, FollowingUser> : {});
        setMyReposts(rpRaw ? JSON.parse(rpRaw) as RepostItem[] : []);
        setLikedPosts(lRaw ? new Set(JSON.parse(lRaw) as string[]) : new Set());
        setMyReactions(rRaw ? JSON.parse(rRaw) as Record<string, keyof PostReactions> : {});
        setNotifications(nRaw ? JSON.parse(nRaw) as SocialNotification[] : SEED_NOTIFICATIONS);
      } catch {}
      loaded.current = true;

      // Background server sync (runs after local data, server wins on conflicts)
      void (async () => {
        try {
          const [serverFollowing, serverReposts] = await Promise.all([
            getFollowingList(playerId),
            getMyReposts(playerId),
          ]);
          // Merge following metadata from server
          if (serverFollowing.length > 0 || true) {
            setFollowingMeta(prev => {
              const merged: Record<string, FollowingUser> = { ...prev };
              for (const u of serverFollowing) {
                merged[u.id] = { id: u.id, username: u.username, avatarId: u.avatarId, rank: u.rank };
              }
              return merged;
            });
            // Update following Set — keep locally-added mock player follows, add all server follows
            const serverIds = new Set(serverFollowing.map(u => u.id));
            setFollowing(prev => {
              const localMock = [...prev].filter(id => !id.match(/^[0-9a-f]{8}-/));
              return new Set([...serverIds, ...localMock]);
            });
          }
          // Reposts: server is authoritative
          setMyReposts(serverReposts.map(r => ({
            postId:        r.postId,
            authorId:      r.authorId,
            authorUsername: r.authorUsername,
            authorAvatarId: r.authorAvatarIndex,
            tag:           r.tag,
            content:       r.content,
            pot:           r.pot ?? undefined,
            handRank:      r.handRank ?? undefined,
            likeCount:     r.likeCount,
            commentCount:  r.commentCount,
            repostedAt:    new Date(r.repostedAt).getTime(),
          })));
        } catch {
          // Network unavailable — local cache is still loaded
        }
      })();
    })();
  }, [playerId]);

  // ── Persist on change (per-user keys) ─────────────────────────────────────

  useEffect(() => {
    if (!loaded.current || !playerIdRef.current) return;
    void AsyncStorage.setItem(userKey(BASE_FOLLOWING, playerIdRef.current), JSON.stringify([...following]));
  }, [following]);

  useEffect(() => {
    if (!loaded.current || !playerIdRef.current) return;
    void AsyncStorage.setItem(userKey(BASE_FOLLOWING_META, playerIdRef.current), JSON.stringify(followingMeta));
  }, [followingMeta]);

  useEffect(() => {
    if (!loaded.current || !playerIdRef.current) return;
    void AsyncStorage.setItem(userKey(BASE_MY_REPOSTS, playerIdRef.current), JSON.stringify(myReposts));
  }, [myReposts]);

  useEffect(() => {
    if (!loaded.current || !playerIdRef.current) return;
    void AsyncStorage.setItem(userKey(BASE_LIKED, playerIdRef.current), JSON.stringify([...likedPosts]));
  }, [likedPosts]);

  useEffect(() => {
    if (!loaded.current || !playerIdRef.current) return;
    void AsyncStorage.setItem(userKey(BASE_REACTIONS, playerIdRef.current), JSON.stringify(myReactions));
  }, [myReactions]);

  useEffect(() => {
    if (!loaded.current || !playerIdRef.current) return;
    void AsyncStorage.setItem(userKey(BASE_NOTIFICATIONS, playerIdRef.current), JSON.stringify(notifications));
  }, [notifications]);

  // ── Actions ───────────────────────────────────────────────────────────────

  function addNotif(n: Omit<SocialNotification, 'id' | 'timestamp' | 'read'>) {
    const notif: SocialNotification = {
      ...n,
      id: `notif_${Date.now()}`,
      timestamp: Date.now(),
      read: false,
    };
    setNotifications(prev => [notif, ...prev].slice(0, 50));
  }

  const follow = useCallback((pid: string, username: string, avatarId = 1, rank = '') => {
    setFollowing(prev => new Set([...prev, pid]));
    setFollowingMeta(prev => ({ ...prev, [pid]: { id: pid, username, avatarId, rank } }));
    addNotif({ type: 'follow', fromUser: username, message: `You followed ${username}` });
  }, []);

  const unfollow = useCallback((pid: string) => {
    setFollowing(prev => { const s = new Set(prev); s.delete(pid); return s; });
    setFollowingMeta(prev => { const m = { ...prev }; delete m[pid]; return m; });
  }, []);

  const addRepost = useCallback((item: RepostItem) => {
    setMyReposts(prev => [item, ...prev.filter(r => r.postId !== item.postId)]);
    if (playerIdRef.current) {
      toggleRepost(playerIdRef.current, item.postId).catch(() => {});
    }
  }, []);

  const removeRepost = useCallback((postId: string) => {
    setMyReposts(prev => prev.filter(r => r.postId !== postId));
    if (playerIdRef.current) {
      toggleRepost(playerIdRef.current, postId).catch(() => {});
    }
  }, []);

  const isReposted = useCallback((postId: string) => myReposts.some(r => r.postId === postId), [myReposts]);

  const isFollowing = useCallback((pid: string) => following.has(pid), [following]);

  const toggleLike = useCallback((postId: string) => {
    setLikedPosts(prev => {
      const s = new Set(prev);
      if (s.has(postId)) s.delete(postId); else s.add(postId);
      return s;
    });
  }, []);

  const isLiked = useCallback((postId: string) => likedPosts.has(postId), [likedPosts]);

  const setReaction = useCallback((postId: string, key: keyof PostReactions) => {
    setMyReactions(prev => {
      if (prev[postId] === key) {
        const n = { ...prev };
        delete n[postId];
        return n;
      }
      return { ...prev, [postId]: key };
    });
  }, []);

  const getReaction = useCallback(
    (postId: string): keyof PostReactions | null => myReactions[postId] ?? null,
    [myReactions],
  );

  const addNotification = useCallback(
    (n: Omit<SocialNotification, 'id' | 'timestamp' | 'read'>) => addNotif(n),
    [],
  );

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const mute = useCallback((pid: string, username: string) => {
    setMuted(prev => new Set([...prev, pid]));
    setFollowing(prev => { const s = new Set(prev); s.delete(pid); return s; });
    addNotif({ type: 'achievement', fromUser: username, message: `@${username} has been muted` });
  }, []);

  const unmute = useCallback((pid: string) => {
    setMuted(prev => { const s = new Set(prev); s.delete(pid); return s; });
  }, []);

  const isMuted = useCallback((pid: string) => muted.has(pid), [muted]);

  const block = useCallback((pid: string, username: string) => {
    setBlocked(prev => new Set([...prev, pid]));
    setMuted(prev => new Set([...prev, pid]));
    setFollowing(prev => { const s = new Set(prev); s.delete(pid); return s; });
    addNotif({ type: 'achievement', fromUser: username, message: `@${username} has been blocked` });
  }, []);

  const unblock = useCallback((pid: string) => {
    setBlocked(prev => { const s = new Set(prev); s.delete(pid); return s; });
  }, []);

  const isBlocked = useCallback((pid: string) => blocked.has(pid), [blocked]);

  const reportPost = useCallback((postId: string, _reason: string) => {
    setReportedPosts(prev => new Set([...prev, postId]));
  }, []);

  const isReported = useCallback((postId: string) => reportedPosts.has(postId), [reportedPosts]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <SocialContext.Provider value={{
      following, followingMeta, myReposts, likedPosts, myReactions, notifications, unreadCount,
      muted, blocked, reportedPosts,
      follow, unfollow, isFollowing,
      addRepost, removeRepost, isReposted,
      toggleLike, isLiked,
      setReaction, getReaction,
      markAllRead, addNotification,
      mute, unmute, isMuted,
      block, unblock, isBlocked,
      reportPost, isReported,
    }}>
      {children}
    </SocialContext.Provider>
  );
}

export function useSocial(): SocialContextValue {
  const ctx = useContext(SocialContext);
  if (!ctx) throw new Error('useSocial must be used inside SocialProvider');
  return ctx;
}
