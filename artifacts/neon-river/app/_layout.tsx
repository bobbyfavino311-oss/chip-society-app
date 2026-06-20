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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router, Stack, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AVATAR_IMAGES from '@/constants/avatarImages';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ThemeProvider } from '@/context/ThemeContext';
import { UserProvider, useUser } from '@/context/UserContext';
import { TermsProvider, useTerms } from '@/context/TermsContext';
import { SoundProvider, useSoundSettings } from '@/context/SoundContext';
import { AchievementProvider, useAchievements } from '@/context/AchievementContext';
import { SocialProvider } from '@/context/SocialContext';
import { AISocialProvider } from '@/context/AISocialContext';
import { MultiplayerProvider } from '@/context/MultiplayerContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { TableThemeProvider } from '@/context/TableThemeContext';
import AchievementUnlockPopup from '@/components/AchievementUnlockPopup';
import TutorialOverlay from '@/components/TutorialOverlay';
import { SoundEngine } from '@/lib/soundEngine';
import { MusicEngine } from '@/lib/musicEngine';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

// ─── Sound syncer — keeps SoundEngine in sync with SoundContext ───────────────

function SoundSyncer() {
  const { masterVolume, effectsVolume, isMuted, isVibrationEnabled, musicVolume, isMusicMuted } = useSoundSettings();
  React.useEffect(() => {
    SoundEngine.configure({ masterVolume, effectsVolume, muted: isMuted, vibration: isVibrationEnabled });
  }, [masterVolume, effectsVolume, isMuted, isVibrationEnabled]);
  React.useEffect(() => {
    MusicEngine.configure({ volume: musicVolume, muted: isMusicMuted });
  }, [musicVolume, isMusicMuted]);
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
    } else if (!termsAccepted) {
      router.replace('/terms');
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
      <GateController />
      <AchievementPopupRenderer />
      <TutorialOverlay />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="entry"         options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="auth/signup"   options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="auth/signin"   options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="auth/guest"    options={{ headerShown: false, animation: 'slide_from_right' }} />
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

  const [assetsReady, setAssetsReady] = useState(false);

  useEffect(() => {
    // Preload all avatar PNGs into the native image cache while the splash
    // screen is still showing — first render of any NeonAvatar is instant.
    Asset.loadAsync(Object.values(AVATAR_IMAGES))
      .catch(() => { /* non-fatal — graceful fallback to on-demand decode */ })
      .finally(() => setAssetsReady(true));
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && assetsReady) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError, assetsReady]);

  if (!fontsLoaded && !fontError) return null;

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
                      <MultiplayerProvider>
                      <NotificationBridge>
                        <GestureHandlerRootView style={{ flex: 1 }}>
                          <KeyboardProvider>
                            <RootLayoutNav />
                          </KeyboardProvider>
                        </GestureHandlerRootView>
                      </NotificationBridge>
                      </MultiplayerProvider>
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
