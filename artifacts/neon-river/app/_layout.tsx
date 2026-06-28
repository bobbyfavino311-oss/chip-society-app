import './global.css';
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
import { Asset } from 'expo-asset';
import * as Notifications from 'expo-notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router, Stack, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// ─── Foreground notification handler (must be set at module level) ─────────────
// Shows banner + plays sound + sets badge when a push arrives while app is open.
if (Platform.OS !== 'web') {
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

import AVATAR_IMAGES from '@/constants/avatarImages';
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
import { NotificationProvider, useNotifications } from '@/context/NotificationContext';
import { TableThemeProvider } from '@/context/TableThemeContext';
import AchievementUnlockPopup from '@/components/AchievementUnlockPopup';
import TutorialOverlay from '@/components/TutorialOverlay';
import BonusNotificationModal from '@/components/BonusNotificationModal';
import ModerationModal from '@/components/ModerationModal';
import { SoundEngine, unlockAudio } from '@/lib/soundEngine';
import { MusicEngine } from '@/lib/musicEngine';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

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

function PushSetup() {
  const { addNotification, setPushToken } = useNotifications();
  const notifListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') return;

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

        // Get Expo push token — works on physical devices; silently fails on simulators
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: 'chip-society',
        }).catch(() => null);

        if (tokenData && !cancelled) {
          setPushToken(tokenData.data);
        }
      } catch {
        // Non-fatal — push is a nice-to-have, not a launch blocker
      }
    })();

    // Listener: push arrives while the app is in the foreground → add to in-app center
    notifListener.current = Notifications.addNotificationReceivedListener(notification => {
      const { title, body, data } = notification.request.content;
      if (!title) return;
      addNotification({
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
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data?.actionRoute && typeof data.actionRoute === 'string') {
        router.push(data.actionRoute as any);
      }
    });

    return () => {
      cancelled = true;
      notifListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return null;
}

// ─── Auth gate — redirects new users to entry, and unaccepted terms to /terms ─

const AUTH_SEGMENTS = new Set(['entry', 'auth', 'terms']);

function GateController() {
  const { profile, isLoaded } = useUser();
  const { termsAccepted, termsLoaded } = useTerms();
  const segments = useSegments();

  useEffect(() => {
    if (!isLoaded || !termsLoaded) return;
    const seg0 = segments[0] as string | undefined;
    const inAuthFlow = AUTH_SEGMENTS.has(seg0 ?? '');
    if (inAuthFlow) return;

    if (profile.isNewUser) {
      router.replace('/entry');
    }
  }, [isLoaded, termsLoaded, profile.isNewUser, termsAccepted, segments]);

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
  const { canClaimWheel, canClaimDaily, profile } = useUser();
  const { unlockedIds, claimedIds } = useAchievements();
  const pendingAchievements = [...unlockedIds].filter(id => !claimedIds.has(id)).length;

  return (
    <NotificationProvider
      canClaimWheel={canClaimWheel}
      canClaimDaily={canClaimDaily}
      pendingAchievements={pendingAchievements}
      streakDays={profile.streakDays}
    >
      {children}
    </NotificationProvider>
  );
}

// ─── Navigation stack ─────────────────────────────────────────────────────────

function RootLayoutNav() {
  return (
    <>
      <SoundSyncer />
      <PushSetup />
      <GateController />
      <AchievementPopupRenderer />
      <BonusNotificationRenderer />
      <ModerationModalRenderer />
      <TutorialOverlay />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="entry"         options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="auth/signup"      options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="auth/signin"      options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="auth/forgot-pin"  options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="profile/change-pin" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="terms"         options={{ headerShown: false, animation: 'slide_from_bottom' }} />
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

  const [assetsReady, setAssetsReady] = useState(false);

  useEffect(() => {
    // Preload all avatar PNGs into the native image cache while the splash
    // screen is still showing — first render of any NeonAvatar is instant.
    Asset.loadAsync(Object.values(AVATAR_IMAGES))
      .catch(() => { /* non-fatal — graceful fallback to on-demand decode */ })
      .finally(() => setAssetsReady(true));
  }, []);

  useEffect(() => {
    if (fontsReady && assetsReady) SplashScreen.hideAsync();
  }, [fontsReady, assetsReady]);

  if (!fontsReady) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <ThemeProvider>
          <TableThemeProvider>
          <QueryClientProvider client={queryClient}>
            <UserProvider>
              <TermsProvider>
                <SoundProvider>
                  <AchievementProvider>
                    <SocialProvider>
                      <AISocialProvider>
                      <LiveFeedProvider>
                      <MultiplayerProvider>
                      <NotificationBridge>
                        <GestureHandlerRootView style={{ flex: 1 }}>
                          <KeyboardProvider>
                            <RootLayoutNav />
                          </KeyboardProvider>
                        </GestureHandlerRootView>
                      </NotificationBridge>
                      </MultiplayerProvider>
                      </LiveFeedProvider>
                      </AISocialProvider>
                    </SocialProvider>
                  </AchievementProvider>
                </SoundProvider>
              </TermsProvider>
            </UserProvider>
          </QueryClientProvider>
          </TableThemeProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
