import { Stack } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import colors from '@/constants/colors';

export default function GameLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="practice" options={{ headerShown: false }} />
        <Stack.Screen name="tournament" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}
