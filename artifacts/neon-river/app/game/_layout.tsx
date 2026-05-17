import { Stack } from 'expo-router';
import React from 'react';
import { Dimensions, View } from 'react-native';
import colors from '@/constants/colors';

export default function GameLayout() {
  const { width, height } = Dimensions.get('window');
  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="practice" options={{ headerShown: false }} />
        <Stack.Screen name="tournament" options={{ headerShown: false }} />
      </Stack>
      <View
        style={{
          pointerEvents: 'none',
          position: 'absolute',
          top: 0,
          left: 0,
          width,
          height,
          borderWidth: 2,
          borderColor: '#ff0090',
          shadowColor: '#ff0090',
          shadowOpacity: 0.8,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 0 },
          zIndex: 9999,
        }}
      />
    </View>
  );
}
