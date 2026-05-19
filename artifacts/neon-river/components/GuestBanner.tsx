import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/colors';

interface GuestBannerProps {
  message?: string;
}

export function GuestBanner({ message = 'Create an account to save progress & unlock ranked mode' }: GuestBannerProps) {
  const slideIn = useRef(new Animated.Value(-60)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideIn, { toValue: 0,  duration: 400, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1,  duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[s.banner, { transform: [{ translateY: slideIn }], opacity }]}>
      <Ionicons name="alert-circle-outline" size={14} color={colors.secondary} />
      <Text style={s.message} numberOfLines={2}>{message}</Text>
      <Pressable style={s.cta} onPress={() => router.push('/auth/signup')}>
        <Text style={s.ctaText}>UPGRADE</Text>
      </Pressable>
    </Animated.View>
  );
}

export function GuestLockOverlay({ feature }: { feature: string }) {
  return (
    <View style={s.lockOverlay}>
      <View style={s.lockBox}>
        <Ionicons name="lock-closed" size={28} color={colors.secondary} />
        <Text style={s.lockTitle}>ACCOUNT REQUIRED</Text>
        <Text style={s.lockDesc}>{feature} is available to registered players only.</Text>
        <Pressable style={s.lockCta} onPress={() => router.push('/auth/signup')}>
          <Text style={s.lockCtaText}>CREATE FREE ACCOUNT</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/auth/signin')}>
          <Text style={s.lockSignIn}>Already have one? Sign in</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,0,144,0.1)',
    borderBottomWidth: 1, borderColor: 'rgba(255,0,144,0.25)',
    paddingHorizontal: 14, paddingVertical: 9,
  },
  message: { flex: 1, fontSize: 11, color: 'rgba(255,255,255,0.65)', lineHeight: 15 },
  cta: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
    backgroundColor: 'rgba(255,0,144,0.2)', borderWidth: 1, borderColor: 'rgba(255,0,144,0.4)',
  },
  ctaText: { fontFamily: 'Orbitron_700Bold', fontSize: 9, color: colors.secondary, letterSpacing: 1 },

  lockOverlay: {
    ...StyleSheet.absoluteFillObject, zIndex: 50,
    backgroundColor: 'rgba(5,0,16,0.92)', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32,
  },
  lockBox: {
    alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,0,144,0.25)',
    padding: 28,
  },
  lockTitle: { fontFamily: 'Orbitron_700Bold', fontSize: 14, color: colors.secondary, letterSpacing: 2 },
  lockDesc:  { fontSize: 13, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 19 },
  lockCta: {
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12,
    backgroundColor: 'rgba(0,212,255,0.12)',
    borderWidth: 1.5, borderColor: colors.primary, marginTop: 4,
  },
  lockCtaText: { fontFamily: 'Orbitron_700Bold', fontSize: 12, color: colors.primary, letterSpacing: 2 },
  lockSignIn: { fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 4 },
});
