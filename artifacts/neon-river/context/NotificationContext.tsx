import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext, useCallback, useContext, useEffect, useRef, useState,
} from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotifCategory = 'tournament' | 'social' | 'reward' | 'gameplay' | 'system';
export type NotifPriority = 'high' | 'medium' | 'low';

export interface AppNotification {
  id: string;
  category: NotifCategory;
  priority: NotifPriority;
  title: string;
  message: string;
  createdAt: number;
  read: boolean;
  dismissed: boolean;
  actionRoute?: string;
  actionLabel?: string;
  icon: string;
  iconColor: string;
}

interface NotifContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  pushToken: string | null;
  addNotification: (n: Omit<AppNotification, 'id' | 'createdAt' | 'read' | 'dismissed'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
  clearAllRead: () => void;
  setPushToken: (token: string | null) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const NotifContext = createContext<NotifContextValue>({
  notifications: [],
  unreadCount: 0,
  pushToken: null,
  addNotification: () => {},
  markRead: () => {},
  markAllRead: () => {},
  dismiss: () => {},
  clearAllRead: () => {},
  setPushToken: () => {},
});

const STORAGE_KEY    = '@chipsociety_notifications_v1';
const LAST_OPEN_KEY  = '@chipsociety_last_open';
const PUSH_TOKEN_KEY = '@chipsociety_push_token_v1';

// ─── Returning-player auto-notifications ──────────────────────────────────────

function buildReturningNotifications(
  lastOpen: number,
  canClaimWheel: boolean,
  canClaimDaily: boolean,
  pendingAchievements: number,
  streakDays: number,
): Omit<AppNotification, 'id' | 'createdAt' | 'read' | 'dismissed'>[] {
  const away = Date.now() - lastOpen;
  const notifs: Omit<AppNotification, 'id' | 'createdAt' | 'read' | 'dismissed'>[] = [];

  if (canClaimWheel) {
    notifs.push({
      category: 'reward',
      priority: 'high',
      title: 'Daily Spin Ready',
      message: 'Your free spin is available. Spin to win up to 100K chips!',
      actionRoute: '/rewards/wheel',
      actionLabel: 'SPIN NOW',
      icon: 'radio-button-on',
      iconColor: '#bf5fff',
    });
  }

  if (canClaimDaily) {
    notifs.push({
      category: 'reward',
      priority: 'high',
      title: 'Daily Streak Reward',
      message: `Day ${streakDays + 1} bonus chips are waiting for you.`,
      actionRoute: '/rewards/streak',
      actionLabel: 'CLAIM',
      icon: 'flame',
      iconColor: '#ffd700',
    });
  }

  if (pendingAchievements > 0) {
    notifs.push({
      category: 'reward',
      priority: 'high',
      title: `${pendingAchievements} Achievement${pendingAchievements > 1 ? 's' : ''} Ready`,
      message: 'You have unclaimed achievement rewards waiting.',
      actionRoute: '/achievements',
      actionLabel: 'CLAIM',
      icon: 'trophy',
      iconColor: '#ffd700',
    });
  }

  if (away > 4 * 60 * 60 * 1000) {
    notifs.push({
      category: 'gameplay',
      priority: 'medium',
      title: 'Leaderboard Updated',
      message: 'The weekly leaderboard rankings have shifted. See where you stand.',
      actionRoute: '/(tabs)/play',
      actionLabel: 'VIEW',
      icon: 'podium',
      iconColor: '#00d4ff',
    });
  }

  return notifs;
}

// ─── Static seed notifications (shown on first install) ──────────────────────

const SEED_NOTIFICATIONS: Omit<AppNotification, 'id' | 'createdAt' | 'read' | 'dismissed'>[] = [
  {
    category: 'system',
    priority: 'high',
    title: 'Welcome to Chip Society',
    message: 'You start with 50,000 virtual chips. Head to the Play tab to start your first game.',
    actionRoute: '/(tabs)/play',
    actionLabel: 'PLAY NOW',
    icon: 'sparkles',
    iconColor: '#00d4ff',
  },
  {
    category: 'reward',
    priority: 'high',
    title: 'Daily Spin Ready',
    message: 'Your first free daily spin is waiting. Spin for a chance to win up to 100K chips!',
    actionRoute: '/rewards/wheel',
    actionLabel: 'SPIN NOW',
    icon: 'radio-button-on',
    iconColor: '#bf5fff',
  },
  {
    category: 'social',
    priority: 'low',
    title: 'Find Your Friends',
    message: 'Invite friends to play and grow your follower list. Check the Feed tab.',
    actionRoute: '/(tabs)/feed',
    actionLabel: 'EXPLORE',
    icon: 'people',
    iconColor: '#00d4ff',
  },
];

// ─── Provider ─────────────────────────────────────────────────────────────────

interface ProviderProps {
  children: React.ReactNode;
  canClaimWheel?: boolean;
  canClaimDaily?: boolean;
  pendingAchievements?: number;
  streakDays?: number;
}

export function NotificationProvider({
  children,
  canClaimWheel = false,
  canClaimDaily = false,
  pendingAchievements = 0,
  streakDays = 0,
}: ProviderProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [pushToken, setPushTokenState]    = useState<string | null>(null);
  const initialized = useRef(false);

  // Load notifications + push token from storage
  useEffect(() => {
    (async () => {
      try {
        const [raw, lastOpenRaw, savedToken] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(LAST_OPEN_KEY),
          AsyncStorage.getItem(PUSH_TOKEN_KEY),
        ]);

        const lastOpen = lastOpenRaw ? parseInt(lastOpenRaw, 10) : 0;
        const now = Date.now();

        if (savedToken) setPushTokenState(savedToken);

        let saved: AppNotification[] = raw ? JSON.parse(raw) : [];

        if (saved.length === 0) {
          const seeded = SEED_NOTIFICATIONS.map((n, i) => ({
            ...n,
            id: `seed_${i}_${now}`,
            createdAt: now - i * 60_000,
            read: false,
            dismissed: false,
          }));
          saved = seeded;
        } else if (lastOpen > 0) {
          const returning = buildReturningNotifications(
            lastOpen, canClaimWheel, canClaimDaily, pendingAchievements, streakDays,
          );
          const newNotifs: AppNotification[] = returning.map((n, i) => ({
            ...n,
            id: `ret_${now}_${i}`,
            createdAt: now - i * 1000,
            read: false,
            dismissed: false,
          }));
          const existingTitles = new Set(saved.map(s => s.title));
          const fresh = newNotifs.filter(n => !existingTitles.has(n.title));
          saved = [...fresh, ...saved].slice(0, 80);
        }

        // Prune dismissed older than 7 days
        const cutoff = now - 7 * 24 * 60 * 60 * 1000;
        saved = saved.filter(n => !n.dismissed || n.createdAt > cutoff);

        setNotifications(saved);
        await AsyncStorage.setItem(LAST_OPEN_KEY, String(now));
        initialized.current = true;
      } catch {
        initialized.current = true;
      }
    })();
  }, []);

  // Persist whenever notifications change (after init)
  useEffect(() => {
    if (!initialized.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notifications)).catch(() => {});
  }, [notifications]);

  const addNotification = useCallback(
    (n: Omit<AppNotification, 'id' | 'createdAt' | 'read' | 'dismissed'>) => {
      setNotifications(prev => [{
        ...n,
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        createdAt: Date.now(),
        read: false,
        dismissed: false,
      }, ...prev].slice(0, 80));
    },
    [],
  );

  const markRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, dismissed: true, read: true } : n));
  }, []);

  const clearAllRead = useCallback(() => {
    setNotifications(prev => prev.filter(n => !n.read));
  }, []);

  const setPushToken = useCallback((token: string | null) => {
    setPushTokenState(token);
    if (token) {
      AsyncStorage.setItem(PUSH_TOKEN_KEY, token).catch(() => {});
    } else {
      AsyncStorage.removeItem(PUSH_TOKEN_KEY).catch(() => {});
    }
  }, []);

  const unreadCount = notifications.filter(n => !n.read && !n.dismissed).length;

  return (
    <NotifContext.Provider value={{
      notifications: notifications.filter(n => !n.dismissed),
      unreadCount,
      pushToken,
      addNotification,
      markRead,
      markAllRead,
      dismiss,
      clearAllRead,
      setPushToken,
    }}>
      {children}
    </NotifContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotifContext);
}
