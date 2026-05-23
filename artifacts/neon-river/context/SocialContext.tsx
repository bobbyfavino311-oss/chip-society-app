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
}

const SocialContext = createContext<SocialContextValue | null>(null);

// ── Storage keys ──────────────────────────────────────────────────────────────

const KEY_FOLLOWING     = '@chipsociety_social_following_v1';
const KEY_LIKED         = '@chipsociety_social_liked_v1';
const KEY_REACTIONS     = '@chipsociety_social_reactions_v1';
const KEY_NOTIFICATIONS = '@chipsociety_social_notifications_v1';

// ── Seeded notifications (simulated social activity) ─────────────────────────

const SEED_NOTIFICATIONS: SocialNotification[] = [
  {
    id: 'sn1', type: 'follow', fromUser: 'NightShark99',
    message: 'NightShark99 started following you', timestamp: Date.now() - 12 * 60 * 1000, read: false,
  },
  {
    id: 'sn2', type: 'like', fromUser: 'VegasMirage',
    message: 'VegasMirage liked your post', timestamp: Date.now() - 45 * 60 * 1000, read: false,
  },
  {
    id: 'sn3', type: 'comment', fromUser: 'NeonWitch',
    message: 'NeonWitch commented: "Incredible hand! 🔥"', timestamp: Date.now() - 2 * 60 * 60 * 1000, read: false,
  },
  {
    id: 'sn4', type: 'reaction', fromUser: 'ShadowKing',
    message: 'ShadowKing reacted 👑 to your post', timestamp: Date.now() - 3 * 60 * 60 * 1000, read: true,
  },
  {
    id: 'sn5', type: 'follow', fromUser: 'PokerPhantom',
    message: 'PokerPhantom started following you', timestamp: Date.now() - 6 * 60 * 60 * 1000, read: true,
  },
];

// ── Provider ──────────────────────────────────────────────────────────────────

export function SocialProvider({ children }: { children: React.ReactNode }) {
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [myReactions, setMyReactions] = useState<Record<string, keyof PostReactions>>({});
  const [notifications, setNotifications] = useState<SocialNotification[]>(SEED_NOTIFICATIONS);
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

  const follow = useCallback((playerId: string, username: string) => {
    setFollowing(prev => new Set([...prev, playerId]));
    addNotif({
      type: 'follow',
      fromUser: username,
      message: `You followed ${username}`,
    });
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

  function addNotif(n: Omit<SocialNotification, 'id' | 'timestamp' | 'read'>) {
    const notif: SocialNotification = {
      ...n,
      id: `notif_${Date.now()}`,
      timestamp: Date.now(),
      read: false,
    };
    setNotifications(prev => [notif, ...prev].slice(0, 50));
  }

  const addNotification = useCallback(
    (n: Omit<SocialNotification, 'id' | 'timestamp' | 'read'>) => addNotif(n),
    [],
  );

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <SocialContext.Provider value={{
      following, likedPosts, myReactions, notifications, unreadCount,
      follow, unfollow, isFollowing,
      toggleLike, isLiked,
      setReaction, getReaction,
      markAllRead, addNotification,
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
