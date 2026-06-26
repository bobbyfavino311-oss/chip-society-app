import React, {
  createContext, useCallback, useContext, useEffect, useRef, useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PostReactions } from '@/lib/socialData';

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
  likedPosts: Set<string>;
  myReactions: Record<string, keyof PostReactions>;
  notifications: SocialNotification[];
  unreadCount: number;
  muted: Set<string>;
  blocked: Set<string>;
  reportedPosts: Set<string>;
}

interface SocialContextValue extends SocialState {
  follow: (playerId: string, username: string) => void;
  unfollow: (playerId: string) => void;
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

// ── Storage keys ──────────────────────────────────────────────────────────────

const KEY_FOLLOWING     = '@chipsociety_social_following_v1';
const KEY_LIKED         = '@chipsociety_social_liked_v1';
const KEY_REACTIONS     = '@chipsociety_social_reactions_v1';
const KEY_NOTIFICATIONS = '@chipsociety_social_notifications_v1';

// ── Seeded notifications (simulated social activity) ─────────────────────────

const SEED_NOTIFICATIONS: SocialNotification[] = [];

// ── Provider ──────────────────────────────────────────────────────────────────

export function SocialProvider({ children }: { children: React.ReactNode }) {
  const [following, setFollowing]     = useState<Set<string>>(new Set());
  const [likedPosts, setLikedPosts]   = useState<Set<string>>(new Set());
  const [myReactions, setMyReactions] = useState<Record<string, keyof PostReactions>>({});
  const [notifications, setNotifications] = useState<SocialNotification[]>(SEED_NOTIFICATIONS);
  const [muted, setMuted]             = useState<Set<string>>(new Set());
  const [blocked, setBlocked]         = useState<Set<string>>(new Set());
  const [reportedPosts, setReportedPosts] = useState<Set<string>>(new Set());
  const loaded = useRef(false);

  // ── Load from AsyncStorage ────────────────────────────────────────────────

  useEffect(() => {
    void (async () => {
      try {
        const [fRaw, lRaw, rRaw, nRaw] = await Promise.all([
          AsyncStorage.getItem(KEY_FOLLOWING),
          AsyncStorage.getItem(KEY_LIKED),
          AsyncStorage.getItem(KEY_REACTIONS),
          AsyncStorage.getItem(KEY_NOTIFICATIONS),
        ]);
        if (fRaw) setFollowing(new Set(JSON.parse(fRaw) as string[]));
        if (lRaw) setLikedPosts(new Set(JSON.parse(lRaw) as string[]));
        if (rRaw) setMyReactions(JSON.parse(rRaw) as Record<string, keyof PostReactions>);
        if (nRaw) setNotifications(JSON.parse(nRaw) as SocialNotification[]);
      } catch {}
      loaded.current = true;
    })();
  }, []);

  // ── Persist on change ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!loaded.current) return;
    void AsyncStorage.setItem(KEY_FOLLOWING, JSON.stringify([...following]));
  }, [following]);

  useEffect(() => {
    if (!loaded.current) return;
    void AsyncStorage.setItem(KEY_LIKED, JSON.stringify([...likedPosts]));
  }, [likedPosts]);

  useEffect(() => {
    if (!loaded.current) return;
    void AsyncStorage.setItem(KEY_REACTIONS, JSON.stringify(myReactions));
  }, [myReactions]);

  useEffect(() => {
    if (!loaded.current) return;
    void AsyncStorage.setItem(KEY_NOTIFICATIONS, JSON.stringify(notifications));
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

  const follow = useCallback((playerId: string, username: string) => {
    setFollowing(prev => new Set([...prev, playerId]));
    addNotif({ type: 'follow', fromUser: username, message: `You followed ${username}` });
  }, []);

  const unfollow = useCallback((playerId: string) => {
    setFollowing(prev => { const s = new Set(prev); s.delete(playerId); return s; });
  }, []);

  const isFollowing = useCallback((playerId: string) => following.has(playerId), [following]);

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

  // ── Mute ──────────────────────────────────────────────────────────────────

  const mute = useCallback((playerId: string, username: string) => {
    setMuted(prev => new Set([...prev, playerId]));
    setFollowing(prev => { const s = new Set(prev); s.delete(playerId); return s; });
    addNotif({ type: 'achievement', fromUser: username, message: `@${username} has been muted` });
  }, []);

  const unmute = useCallback((playerId: string) => {
    setMuted(prev => { const s = new Set(prev); s.delete(playerId); return s; });
  }, []);

  const isMuted = useCallback((playerId: string) => muted.has(playerId), [muted]);

  // ── Block ─────────────────────────────────────────────────────────────────

  const block = useCallback((playerId: string, username: string) => {
    setBlocked(prev => new Set([...prev, playerId]));
    setMuted(prev => new Set([...prev, playerId]));
    setFollowing(prev => { const s = new Set(prev); s.delete(playerId); return s; });
    addNotif({ type: 'achievement', fromUser: username, message: `@${username} has been blocked` });
  }, []);

  const unblock = useCallback((playerId: string) => {
    setBlocked(prev => { const s = new Set(prev); s.delete(playerId); return s; });
  }, []);

  const isBlocked = useCallback((playerId: string) => blocked.has(playerId), [blocked]);

  // ── Report ────────────────────────────────────────────────────────────────

  const reportPost = useCallback((postId: string, _reason: string) => {
    setReportedPosts(prev => new Set([...prev, postId]));
  }, []);

  const isReported = useCallback((postId: string) => reportedPosts.has(postId), [reportedPosts]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <SocialContext.Provider value={{
      following, likedPosts, myReactions, notifications, unreadCount,
      muted, blocked, reportedPosts,
      follow, unfollow, isFollowing,
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
