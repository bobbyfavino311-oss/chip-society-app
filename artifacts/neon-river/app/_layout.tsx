import {
  Orbitron_400Regular,
  Orbitron_700Bold,
  Orbitron_900Black,
  useFonts,
} from '@expo-google-fonts/orbitron';
import { Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import { Pacifico_400Regular } from '@expo-google-fonts/pacifico';
import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { Righteous_400Regular } from '@expo-google-fonts/righteous';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type * as NotificationsType from 'expo-notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router, Stack, useSegments } from 'expo-router';
import Constants from 'expo-constants';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { SafeAreaProvider } from 'react-native-safe-area-context';


import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ThemeProvider } from '@/context/ThemeContext';
import { UserProvider, useUser } from '@/context/UserContext';
import { TermsProvider, useTerms } from '@/context/TermsContext';
import { SoundProvider, useSoundSettings } from '@/context/SoundContext';
import { AchievementProvider, useAchievements } from '@/context/AchievementContext';
import { SocialProvider } from '@/context/SocialContext';
import { AISocialProvider } from '@/context/AISocialContext';
import { LiveFeedProvider } from '@/context/LiveFeedContext';
import { MultiplayerProvider } from '@/context/MultiplayerContext';
import { MissionsProvider } from '@/context/MissionsContext';
import MissionCompleteToast from '@/components/MissionCompleteToast';
import { NotificationProvider, useNotifications } from '@/context/NotificationContext';
import { TableThemeProvider } from '@/context/TableThemeContext';
import AchievementUnlockPopup from '@/components/AchievementUnlockPopup';
import TutorialOverlay from '@/components/TutorialOverlay';
import BonusNotificationModal from '@/components/BonusNotificationModal';
import ModerationModal from '@/components/ModerationModal';
import { SoundEngine, unlockAudio } from '@/lib/soundEngine';
import { MusicEngine } from '@/lib/musicEngine';
import { initializeRevenueCat, SubscriptionProvider } from '@/lib/revenuecat';
import { initializeSentry, reportError } from '@/lib/sentry';
import * as Updates from 'expo-updates';
import { subscribeServerNotifications, type ServerAppNotification } from '@/lib/appNotificationBus';


// expo-notifications removed Android support in Expo Go SDK 53+.
// Use a safe runtime require so the module doesn't crash on Android Expo Go.
// Using `any` avoids a TS2502 circular-type-annotation error from `typeof NotificationsType`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Notifications: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Notifications = require('expo-notifications');
} catch {
  // Not available on Android Expo Go — push notifications silently disabled
}

// ─── Foreground notification handler (must be set at module level) ─────────────
// Shows banner + plays sound + sets badge when a push arrives while app is open.
if (Platform.OS !== 'web' && Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

SplashScreen.preventAutoHideAsync();
// Hard failsafe: if JS crashes or fonts hang, splash hides after 5s so the
// user sees the error instead of an infinite frozen splash screen.
setTimeout(() => { SplashScreen.hideAsync().catch(() => {}); }, 5000);

initializeSentry();

try {
  initializeRevenueCat();
} catch (err: unknown) {
  console.warn("[RevenueCat] Init failed:", err instanceof Error ? err.message : String(err));
}

const queryClient = new QueryClient();

// ─── OTA update checker — checks on launch, reloads immediately if update ready ──
function UpdateChecker() {
  useEffect(() => {
    if (Platform.OS === 'web' || __DEV__) return;
    (async () => {
      try {
        const check = await Updates.checkForUpdateAsync();
        if (check.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch {
        // silently ignore — update check failure must never crash the app
      }
    })();
  }, []);
  return null;
}

// ─── Sound syncer — keeps SoundEngine in sync with SoundContext ───────────────

function SoundSyncer() {
  const { masterVolume, effectsVolume, isMuted, isVibrationEnabled, musicVolume, isMusicMuted } = useSoundSettings();
  React.useEffect(() => {
    // Prime the audio session on mount — enables playsInSilentModeIOS and
    // shouldDuckAndroid so the first sound plays without any gap on mobile.
    void unlockAudio();
  }, []);
  React.useEffect(() => {
    SoundEngine.configure({ masterVolume, effectsVolume, muted: isMuted, vibration: isVibrationEnabled });
  }, [masterVolume, effectsVolume, isMuted, isVibrationEnabled]);
  React.useEffect(() => {
    MusicEngine.configure({ volume: musicVolume, muted: isMusicMuted });
  }, [musicVolume, isMusicMuted]);
  return null;
}

// ─── Push notification setup ──────────────────────────────────────────────────
// Requests permission, registers the Expo push token, and wires up listeners
// for foreground notifications and user taps on notification banners.

const API_BASE = 'https://api-server-production-bbc2.up.railway.app/api';
const REWARD_REMINDER_IDS_KEY = '@chipsociety_reward_reminder_ids_v1';
const DAY_MS = 24 * 60 * 60 * 1000;

function nextLocalTime(hour: number, minute = 0): Date {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function wheelReminderDate(lastWheelSpin: string | null): Date {
  if (!lastWheelSpin) return nextLocalTime(10);
  const due = new Date(new Date(lastWheelSpin).getTime() + DAY_MS);
  if (due.getTime() <= Date.now()) return nextLocalTime(10);

  // Do not send reward reminders during typical sleeping hours.
  if (due.getHours() < 9) due.setHours(9, 0, 0, 0);
  if (due.getHours() >= 22) {
    due.setDate(due.getDate() + 1);
    due.setHours(9, 0, 0, 0);
  }
  return due;
}

function PushSetup() {
  const { addNotification, setPushToken, pushToken } = useNotifications();
  const { profile } = useUser();
  const [notificationsGranted, setNotificationsGranted] = useState(false);
  const notifListener = useRef<{ remove: () => void } | null>(null);
  const responseListener = useRef<{ remove: () => void } | null>(null);

  // Register push token with the server whenever we have both token + playerId
  useEffect(() => {
    if (!pushToken || !profile.playerId || Platform.OS === 'web') return;
    fetch(`${API_BASE}/players/${profile.playerId}/push-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: pushToken, platform: Platform.OS }),
    }).catch(() => {});
  }, [pushToken, profile.playerId]);

  useEffect(() => {
    // Bail out if expo-notifications is unavailable (Android Expo Go SDK 53+)
    if (Platform.OS === 'web' || !Notifications) return;

    let cancelled = false;

    (async () => {
      try {
        // Cast through `unknown` — PermissionResponse.granted is real at runtime but
        // the base type from 'expo' doesn't resolve in this project's module setup.
        const existing  = await Notifications.getPermissionsAsync()  as unknown as { granted: boolean };
        let granted     = existing.granted;

        if (!granted) {
          const requested = await Notifications.requestPermissionsAsync() as unknown as { granted: boolean };
          granted = requested.granted;
        }

        if (!granted || cancelled) return;
        setNotificationsGranted(true);

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('rewards', {
            name: 'Daily Rewards',
            importance: Notifications.AndroidImportance.HIGH,
            sound: 'default',
          });
        }

        // Get Expo push token — works on physical devices; silently fails on simulators
        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ??
          '032b69e0-c9ad-4a63-a6c2-045e621a99c6';
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId,
        }).catch(() => null);

        if (tokenData && !cancelled) {
          setPushToken(tokenData.data);
        }
      } catch {
        // Non-fatal — push is a nice-to-have, not a launch blocker
      }
    })();

    // Listener: push arrives while the app is in the foreground → add to in-app center
    notifListener.current = Notifications.addNotificationReceivedListener((notification: NotificationsType.Notification) => {
      const { title, body, data } = notification.request.content;
      if (!title) return;
      addNotification({
        id: notification.request.identifier,
        dedupeKey: typeof data?.dedupeKey === 'string' ? data.dedupeKey : notification.request.identifier,
        category: (data?.category as any) ?? 'system',
        priority:  (data?.priority as any) ?? 'medium',
        title:     title,
        message:   body ?? '',
        actionRoute:  data?.actionRoute as string | undefined,
        actionLabel:  data?.actionLabel as string | undefined,
        icon:      (data?.icon as string) ?? 'notifications',
        iconColor: (data?.iconColor as string) ?? '#00d4ff',
      });
    });

    // Listener: user taps a push notification → navigate to the action route
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response: NotificationsType.NotificationResponse) => {
      const data = response.notification.request.content.data;
      if (data?.actionRoute && typeof data.actionRoute === 'string') {
        router.push(data.actionRoute as any);
      }
    });

    // Handle a notification that launched the app from a fully closed state.
    void Notifications.getLastNotificationResponseAsync().then((response: NotificationsType.NotificationResponse | null) => {
      const actionRoute = response?.notification.request.content.data?.actionRoute;
      if (typeof actionRoute === 'string') {
        router.push(actionRoute as any);
        void Notifications.clearLastNotificationResponseAsync();
      }
    }).catch(() => {});

    return () => {
      cancelled = true;
      notifListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  // Keep exactly one scheduled reminder per daily reward. Whenever a reward is
  // claimed, its profile timestamp changes and the next reminder is rescheduled.
  useEffect(() => {
    if (
      Platform.OS === 'web' ||
      !Notifications ||
      !notificationsGranted ||
      !profile.playerId
    ) return;

    let cancelled = false;

    void (async () => {
      try {
        const stored = await AsyncStorage.getItem(REWARD_REMINDER_IDS_KEY);
        const previousIds = stored ? JSON.parse(stored) as string[] : [];
        await Promise.all(previousIds.map(id =>
          Notifications.cancelScheduledNotificationAsync(id).catch(() => {})
        ));
        if (cancelled) return;

        const channelId = Platform.OS === 'android' ? 'rewards' : undefined;
        const reminders = [
          {
            title: 'Your daily wheel spin is ready!',
            body: 'Spin the wheel and collect your daily reward.',
            route: '/rewards/wheel',
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: wheelReminderDate(profile.lastWheelSpin),
              channelId,
            },
          },
          {
            title: 'Your daily streak reward is ready!',
            body: 'Keep your streak alive and claim today’s reward.',
            route: '/rewards/streak',
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DAILY,
              hour: 9,
              minute: 0,
              channelId,
            },
          },
          {
            title: 'Your fortune cookie is ready to be cracked!',
            body: 'Claim your free daily cookie and reveal your fortune.',
            route: '/rewards/cookie',
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DAILY,
              hour: 12,
              minute: 0,
              channelId,
            },
          },
        ];

        const ids = await Promise.all(reminders.map(reminder =>
          Notifications.scheduleNotificationAsync({
            content: {
              title: reminder.title,
              body: reminder.body,
              sound: 'default',
              data: {
                category: 'reward',
                priority: 'high',
                actionRoute: reminder.route,
                actionLabel: 'CLAIM NOW',
              },
            },
            trigger: reminder.trigger,
          })
        ));

        if (cancelled) {
          await Promise.all(ids.map(id =>
            Notifications.cancelScheduledNotificationAsync(id).catch(() => {})
          ));
        } else {
          await AsyncStorage.setItem(REWARD_REMINDER_IDS_KEY, JSON.stringify(ids));
        }
      } catch {
        // Scheduling reminders must never block the app.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    notificationsGranted,
    profile.playerId,
    profile.lastWheelSpin,
    profile.lastDailyReward,
    profile.lastFreeCookie,
  ]);

  return null;
}

// ─── In-app notification sync ─────────────────────────────────────────────────

const LAST_LEVEL_KEY = '@chipsociety_notification_level_v1';

function serverNotificationToInput(n: ServerAppNotification) {
  const [kind, targetId] = n.reason.split(':');
  const isFollow = n.type === 'follow' || kind === 'social_follow';
  const isMessage = n.type === 'direct_message' || kind === 'direct_message';
  return {
    id: n.notificationId,
    dedupeKey: `server:${n.notificationId}`,
    category: 'social' as const,
    priority: 'medium' as const,
    title: n.title,
    message: n.message ?? '',
    createdAt: new Date(n.createdAt).getTime(),
    actionRoute: isFollow && targetId
      ? `/social/player-profile?id=${encodeURIComponent(targetId)}`
      : isMessage && targetId
        ? `/inbox/${encodeURIComponent(targetId)}`
        : '/(tabs)/feed?tab=me',
    actionLabel: isFollow ? 'VIEW PROFILE' : isMessage ? 'REPLY' : n.type === 'comment' ? 'VIEW COMMENT' : 'VIEW POST',
    icon: isFollow ? 'person-add' : n.type === 'comment' || isMessage ? 'chatbubble' : 'heart',
    iconColor: isFollow ? '#00d4ff' : n.type === 'comment' || isMessage ? '#bf5fff' : '#ff0090',
  };
}

function NotificationSync() {
  const {
    profile, canClaimWheel, canClaimDaily, canClaimFreeCookie,
  } = useUser();
  const { unlockedIds, claimedIds } = useAchievements();
  const {
    ready, addNotification, dismissByDedupePrefix,
  } = useNotifications();

  const playerId = profile.playerId;
  const pendingAchievementIds = [...unlockedIds].filter(id => !claimedIds.has(id)).sort();
  const pendingAchievements = pendingAchievementIds.length;
  const achievementCycle = pendingAchievementIds.join(',');
  const today = new Date().toDateString();

  // Reward notifications use one stable key per availability cycle. Clearing
  // one suppresses that exact cycle permanently; the next cycle gets a new key.
  useEffect(() => {
    if (!ready || !playerId) return;

    if (canClaimWheel) {
      const cycle = profile.lastWheelSpin ?? 'first';
      addNotification({
        id: `reward:wheel:${cycle}`,
        dedupeKey: `reward:wheel:${cycle}`,
        category: 'reward',
        priority: 'high',
        title: 'Daily Spin Ready',
        message: 'Your free spin is available. Spin to win up to 100K chips!',
        actionRoute: '/rewards/wheel',
        actionLabel: 'SPIN NOW',
        icon: 'radio-button-on',
        iconColor: '#bf5fff',
      });
    } else {
      dismissByDedupePrefix('reward:wheel:');
    }

    if (canClaimDaily) {
      addNotification({
        id: `reward:streak:${today}`,
        dedupeKey: `reward:streak:${today}`,
        category: 'reward',
        priority: 'high',
        title: 'Daily Streak Reward',
        message: `Day ${profile.streakDays + 1} bonus chips are waiting for you.`,
        actionRoute: '/rewards/streak',
        actionLabel: 'CLAIM',
        icon: 'flame',
        iconColor: '#ffd700',
      });
    } else {
      dismissByDedupePrefix('reward:streak:');
    }

    if (canClaimFreeCookie) {
      addNotification({
        id: `reward:cookie:${today}`,
        dedupeKey: `reward:cookie:${today}`,
        category: 'reward',
        priority: 'high',
        title: 'Fortune Cookie Ready',
        message: 'Your free daily fortune cookie is ready to be cracked.',
        actionRoute: '/rewards/cookie',
        actionLabel: 'CRACK NOW',
        icon: 'sparkles',
        iconColor: '#00d4ff',
      });
    } else {
      dismissByDedupePrefix('reward:cookie:');
    }

    if (pendingAchievements > 0) {
      addNotification({
        id: `achievements:${achievementCycle}`,
        dedupeKey: `achievements:${achievementCycle}`,
        category: 'reward',
        priority: 'high',
        title: `${pendingAchievements} Achievement${pendingAchievements > 1 ? 's' : ''} Ready`,
        message: 'You have unclaimed achievement rewards waiting.',
        actionRoute: '/achievements',
        actionLabel: 'CLAIM',
        icon: 'trophy',
        iconColor: '#ffd700',
      });
    } else {
      dismissByDedupePrefix('achievements:');
    }
  }, [
    ready, playerId, canClaimWheel, canClaimDaily, canClaimFreeCookie,
    profile.lastWheelSpin, profile.streakDays, today, pendingAchievements, achievementCycle,
    addNotification, dismissByDedupePrefix,
  ]);

  // Initialize the remembered level without notifying. Later increases create
  // one permanent notification for the newly reached level.
  useEffect(() => {
    if (!ready || !playerId) return;
    const key = `${LAST_LEVEL_KEY}_${playerId}`;
    void AsyncStorage.getItem(key).then(raw => {
      const previous = raw ? Number(raw) : profile.level;
      if (profile.level > previous) {
        addNotification({
          id: `level:${profile.level}`,
          dedupeKey: `level:${profile.level}`,
          category: 'gameplay',
          priority: 'high',
          title: `Level ${profile.level} Reached`,
          message: `You leveled up to ${profile.rank}. Keep playing to reach the next rank.`,
          actionRoute: '/(tabs)/profile',
          actionLabel: 'VIEW PROFILE',
          icon: 'trending-up',
          iconColor: '#00ff88',
        });
      }
      if (!raw || profile.level > previous) {
        return AsyncStorage.setItem(key, String(profile.level));
      }
    }).catch(() => {});
  }, [ready, playerId, profile.level, profile.rank, addNotification]);

  // Real-time social events arrive through the existing player socket. Polling
  // also recovers events created while the app was closed or offline.
  useEffect(() => {
    if (!ready || !playerId) return;
    const handle = (notification: ServerAppNotification) => {
      addNotification(serverNotificationToInput(notification));
      fetch(`${API_BASE}/players/${playerId}/notifications/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [notification.notificationId] }),
      }).catch(() => {});
    };
    const unsubscribe = subscribeServerNotifications(handle);

    const poll = async () => {
      try {
        const response = await fetch(`${API_BASE}/players/${playerId}/notifications`);
        if (!response.ok) return;
        const data = await response.json() as { notifications: ServerAppNotification[] };
        data.notifications
          .filter(n => !('read' in n) || !(n as ServerAppNotification & { read: boolean }).read)
          .filter(n => n.type === 'follow' || n.type === 'like' || n.type === 'comment')
          .forEach(handle);
      } catch {}
    };

    void poll();
    const timer = setInterval(() => { void poll(); }, 30_000);
    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, [ready, playerId, addNotification]);

  return null;
}

// ─── Auth gate — redirects new users to entry, and unaccepted terms to /terms ─

const AUTH_SEGMENTS = new Set(['entry', 'auth', 'terms']);

function GateController() {
  const { profile, isLoaded } = useUser();
  const { termsNeedsPrompt, termsLoaded } = useTerms();
  const segments = useSegments();

  useEffect(() => {
    if (!isLoaded || !termsLoaded) return;
    const seg0 = segments[0] as string | undefined;
    const inAuthFlow = AUTH_SEGMENTS.has(seg0 ?? '');
    if (inAuthFlow) return;

    if (profile.isNewUser) {
      // Brand-new account — start the onboarding flow (signup handles terms).
      router.replace('/entry');
    } else if (termsNeedsPrompt) {
      // Returning user whose stored terms version is older than TERMS_VERSION
      // (i.e., we published an update). Show terms once, then never again until
      // TERMS_VERSION is bumped again.
      router.replace('/terms');
    }
  }, [isLoaded, termsLoaded, profile.isNewUser, termsNeedsPrompt, segments]);

  return null;
}

// ─── Global achievement popup ─────────────────────────────────────────────────

function AchievementPopupRenderer() {
  const { pendingUnlock, dismissPending } = useAchievements();
  if (!pendingUnlock) return null;
  return <AchievementUnlockPopup achievement={pendingUnlock} onDismiss={dismissPending} />;
}

// ─── Casino bonus notification renderer ───────────────────────────────────────

function BonusNotificationRenderer() {
  const { pendingBonuses, dismissBonus } = useUser();
  const current = pendingBonuses[0] ?? null;
  return (
    <BonusNotificationModal
      notification={current}
      onDismiss={() => { if (current) dismissBonus(current.notificationId); }}
    />
  );
}

// ─── Moderation notification renderer ─────────────────────────────────────────

function ModerationModalRenderer() {
  const { pendingModeration, dismissModeration, signOut } = useUser();
  return (
    <ModerationModal
      event={pendingModeration}
      onDismiss={dismissModeration}
      onForceSignOut={() => { void signOut(); }}
    />
  );
}

// ─── Notification bridge — connects UserContext → NotificationProvider ────────

function NotificationBridge({ children }: { children: React.ReactNode }) {
  const { profile } = useUser();
  return (
    <NotificationProvider
      key={profile.playerId || 'anonymous'}
      playerId={profile.playerId || ''}
      isNewUser={profile.isNewUser}
    >
      {children}
    </NotificationProvider>
  );
}

// ─── Navigation stack ─────────────────────────────────────────────────────────

function RootLayoutNav() {
  return (
    <>
      <UpdateChecker />
      <SoundSyncer />
      <NotificationSync />
      <PushSetup />
      <GateController />
      <AchievementPopupRenderer />
      <MissionCompleteToast />
      <BonusNotificationRenderer />
      <ModerationModalRenderer />
      <TutorialOverlay />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="entry"         options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="auth/signup"      options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="auth/signin"      options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="auth/forgot-pin"  options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="profile/change-pin" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="terms"                    options={{ headerShown: false, animation: 'slide_from_bottom' }} />
        <Stack.Screen name="community-guidelines"  options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="(tabs)"        options={{ headerShown: false }} />
        <Stack.Screen
          name="game"
          options={{ headerShown: false, presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="achievements"  options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="notifications/index" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="rewards/wheel"    options={{ headerShown: false, animation: 'slide_from_bottom', presentation: 'modal' }} />
        <Stack.Screen name="rewards/scratch"  options={{ headerShown: false, animation: 'slide_from_bottom', presentation: 'modal' }} />
        <Stack.Screen name="rewards/streak"   options={{ headerShown: false, animation: 'slide_from_bottom', presentation: 'modal' }} />
        <Stack.Screen name="rewards/cookie"   options={{ headerShown: false, animation: 'slide_from_bottom', presentation: 'modal' }} />
        <Stack.Screen name="modes/quickmatch" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="modes/ranked"     options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="modes/tournament" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="modes/private"       options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="inbox"       options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="inbox/[id]"  options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="social/player-profile" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="profile/avatar-select" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="profile/photo-select"  options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="settings/table-themes" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen
          name="casino"
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="multiplayer/lobby"
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="multiplayer/game"
          options={{ headerShown: false, presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
        />
      </Stack>
    </>
  );
}

// ─── Root layout ──────────────────────────────────────────────────────────────

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Orbitron_400Regular,
    Orbitron_700Bold,
    Orbitron_900Black,
    Inter_400Regular,
    Inter_700Bold,
    Pacifico_400Regular,
    BebasNeue_400Regular,
    Righteous_400Regular,
  });

  // Hard timeout: if fonts haven't loaded within 6 s (e.g. slow CDN on first
  // Expo Go launch), proceed anyway rather than blocking the app indefinitely.
  const [fontTimeout, setFontTimeout] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setFontTimeout(true), 6000);
    return () => clearTimeout(t);
  }, []);

  const fontsReady = fontsLoaded || fontError || fontTimeout;

  useEffect(() => {
    if (fontsReady) SplashScreen.hideAsync();
  }, [fontsReady]);

  if (!fontsReady) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary onError={(error) => reportError(error)}>
        <ThemeProvider>
          <TableThemeProvider>
          <QueryClientProvider client={queryClient}>
            <SubscriptionProvider>
            <UserProvider>
              <TermsProvider>
                <SoundProvider>
                  <AchievementProvider>
                    <SocialProvider>
                      <AISocialProvider>
                      <LiveFeedProvider>
                      <MissionsProvider>
                      <MultiplayerProvider>
                      <NotificationBridge>
                        <GestureHandlerRootView style={{ flex: 1 }}>
                          <RootLayoutNav />
                        </GestureHandlerRootView>
                      </NotificationBridge>
                      </MultiplayerProvider>
                      </MissionsProvider>
                      </LiveFeedProvider>
                      </AISocialProvider>
                    </SocialProvider>
                  </AchievementProvider>
                </SoundProvider>
              </TermsProvider>
            </UserProvider>
            </SubscriptionProvider>
          </QueryClientProvider>
          </TableThemeProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
