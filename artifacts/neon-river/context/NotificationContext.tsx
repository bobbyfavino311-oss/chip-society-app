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
  dedupeKey?: string;
  actionRoute?: string;
  actionLabel?: string;
  icon: string;
  iconColor: string;
}

export type AppNotificationInput =
  Omit<AppNotification, 'id' | 'createdAt' | 'read' | 'dismissed'> & {
    id?: string;
    createdAt?: number;
  };

interface NotifContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  ready: boolean;
  pushToken: string | null;
  addNotification: (n: AppNotificationInput) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
  clearAllRead: () => void;
  dismissByDedupePrefix: (prefix: string) => void;
  setPushToken: (token: string | null) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const NotifContext = createContext<NotifContextValue>({
  notifications: [],
  unreadCount: 0,
  ready: false,
  pushToken: null,
  addNotification: () => {},
  markRead: () => {},
  markAllRead: () => {},
  dismiss: () => {},
  clearAllRead: () => {},
  dismissByDedupePrefix: () => {},
  setPushToken: () => {},
});

const STORAGE_KEY    = '@chipsociety_notifications_v2';
const DISMISSED_KEY  = '@chipsociety_notification_dismissed_v2';
const WELCOME_KEY    = '@chipsociety_notification_welcome_v2';
const PUSH_TOKEN_KEY = '@chipsociety_push_token_v1';

// ─── Provider ─────────────────────────────────────────────────────────────────

interface ProviderProps {
  children: React.ReactNode;
  playerId: string;
  isNewUser: boolean;
}

export function NotificationProvider({
  children,
  playerId,
  isNewUser,
}: ProviderProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [dismissedKeys, setDismissedKeys] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);
  const [pushToken, setPushTokenState]    = useState<string | null>(null);
  const initialized = useRef(false);
  const storageKey = `${STORAGE_KEY}_${playerId || 'anonymous'}`;
  const dismissedStorageKey = `${DISMISSED_KEY}_${playerId || 'anonymous'}`;
  const welcomeKey = `${WELCOME_KEY}_${playerId || 'anonymous'}`;

  // Load notifications + push token from storage
  useEffect(() => {
    (async () => {
      try {
        const [raw, dismissedRaw, welcomeSeen, savedToken] = await Promise.all([
          AsyncStorage.getItem(storageKey),
          AsyncStorage.getItem(dismissedStorageKey),
          AsyncStorage.getItem(welcomeKey),
          AsyncStorage.getItem(PUSH_TOKEN_KEY),
        ]);

        const now = Date.now();

        if (savedToken) setPushTokenState(savedToken);

        let saved: AppNotification[] = raw ? JSON.parse(raw) : [];
        const removed = new Set<string>(dismissedRaw ? JSON.parse(dismissedRaw) : []);

        if (playerId && isNewUser && !welcomeSeen) {
          saved.unshift({
            id: `welcome:${playerId}`,
            dedupeKey: `welcome:${playerId}`,
            category: 'system',
            priority: 'high',
            title: 'Welcome to Chip Society',
            message: 'You start with 50,000 virtual chips. Head to the Play tab to start your first game.',
            actionRoute: '/(tabs)/play',
            actionLabel: 'PLAY NOW',
            icon: 'sparkles',
            iconColor: '#00d4ff',
            createdAt: now,
            read: false,
            dismissed: false,
          });
          await AsyncStorage.setItem(welcomeKey, '1');
        }

        setDismissedKeys(removed);
        setNotifications(saved.filter(n => !removed.has(n.dedupeKey ?? n.id)).slice(0, 80));
        initialized.current = true;
        setReady(true);
      } catch {
        initialized.current = true;
        setReady(true);
      }
    })();
  }, [storageKey, dismissedStorageKey, welcomeKey, playerId, isNewUser]);

  // Persist whenever notifications change (after init)
  useEffect(() => {
    if (!initialized.current) return;
    AsyncStorage.setItem(storageKey, JSON.stringify(notifications)).catch(() => {});
  }, [notifications, storageKey]);

  useEffect(() => {
    if (!initialized.current) return;
    AsyncStorage.setItem(dismissedStorageKey, JSON.stringify([...dismissedKeys])).catch(() => {});
  }, [dismissedKeys, dismissedStorageKey]);

  const addNotification = useCallback(
    (n: AppNotificationInput) => {
      const id = n.id ?? `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const key = n.dedupeKey ?? id;
      if (dismissedKeys.has(key)) return;
      setNotifications(prev => {
        if (prev.some(existing => (existing.dedupeKey ?? existing.id) === key)) return prev;
        return [{
          ...n,
          id,
          createdAt: n.createdAt ?? Date.now(),
          read: false,
          dismissed: false,
        }, ...prev].slice(0, 80);
      });
    },
    [dismissedKeys],
  );

  const markRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications(prev => {
      const target = prev.find(n => n.id === id);
      if (target) setDismissedKeys(keys => new Set(keys).add(target.dedupeKey ?? target.id));
      return prev.filter(n => n.id !== id);
    });
  }, []);

  const clearAllRead = useCallback(() => {
    setNotifications(prev => {
      const removed = prev.filter(n => n.read).map(n => n.dedupeKey ?? n.id);
      if (removed.length) setDismissedKeys(keys => new Set([...keys, ...removed]));
      return prev.filter(n => !n.read);
    });
  }, []);

  const dismissByDedupePrefix = useCallback((prefix: string) => {
    setNotifications(prev => {
      const removed = prev.filter(n => (n.dedupeKey ?? n.id).startsWith(prefix));
      if (removed.length) {
        setDismissedKeys(keys => new Set([...keys, ...removed.map(n => n.dedupeKey ?? n.id)]));
      }
      return prev.filter(n => !(n.dedupeKey ?? n.id).startsWith(prefix));
    });
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
      ready,
      pushToken,
      addNotification,
      markRead,
      markAllRead,
      dismiss,
      clearAllRead,
      dismissByDedupePrefix,
      setPushToken,
    }}>
      {children}
    </NotifContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotifContext);
}
