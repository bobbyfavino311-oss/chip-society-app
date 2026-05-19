import {
  Orbitron_400Regular,
  Orbitron_700Bold,
  Orbitron_900Black,
  useFonts,
} from '@expo-google-fonts/orbitron';
import { Pacifico_400Regular } from '@expo-google-fonts/pacifico';
import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { Righteous_400Regular } from '@expo-google-fonts/righteous';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router, Stack, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ThemeProvider } from '@/context/ThemeContext';
import { UserProvider, useUser } from '@/context/UserContext';
import { TermsProvider, useTerms } from '@/context/TermsContext';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

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

// ─── Navigation stack ─────────────────────────────────────────────────────────

function RootLayoutNav() {
  return (
    <>
      <GateController />
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
        <Stack.Screen name="rewards/wheel"    options={{ headerShown: false, animation: 'slide_from_bottom', presentation: 'modal' }} />
        <Stack.Screen name="rewards/scratch"  options={{ headerShown: false, animation: 'slide_from_bottom', presentation: 'modal' }} />
        <Stack.Screen name="rewards/streak"   options={{ headerShown: false, animation: 'slide_from_bottom', presentation: 'modal' }} />
        <Stack.Screen name="modes/quickmatch" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="modes/ranked"     options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="modes/tournament" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="modes/private"    options={{ headerShown: false, animation: 'slide_from_right' }} />
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
    Pacifico_400Regular,
    BebasNeue_400Regular,
    Righteous_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <UserProvider>
              <TermsProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <KeyboardProvider>
                    <RootLayoutNav />
                  </KeyboardProvider>
                </GestureHandlerRootView>
              </TermsProvider>
            </UserProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
