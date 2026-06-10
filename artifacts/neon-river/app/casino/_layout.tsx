import { Stack } from 'expo-router';
import React from 'react';
import { CasinoProvider } from '@/context/CasinoContext';

export default function CasinoLayout() {
  return (
    <CasinoProvider>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="three-card-poker" options={{ animation: 'slide_from_bottom', presentation: 'fullScreenModal' }} />
        <Stack.Screen name="blackjack"        options={{ animation: 'slide_from_bottom', presentation: 'fullScreenModal' }} />
      </Stack>
    </CasinoProvider>
  );
}
