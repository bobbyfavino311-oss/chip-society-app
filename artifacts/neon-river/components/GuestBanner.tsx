import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
      Animated.timing(slideIn, { toValue: 0, duration: 400, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
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

interface GuestLockOverlayProps {
  feature: string;
  onDismiss: () => void;
}

export function GuestLockOverlay({ feature, onDismiss }: GuestLockOverlayProps) {
  const scale = useRef(new Animated.Value(0.88)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, tension: 65, friction: 8, useNativeDriver: false }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: false }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[s.lockOverlay, { opacity }]}>
      {/* Tap backdrop to dismiss */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />

      <Animated.View style={[s.lockBox, { transform: [{ scale }] }]}>
        <LinearGradient
          colors={['rgba(255,0,144,0.08)', 'rgba(0,212,255,0.04)']}
          style={[StyleSheet.absoluteFill, { borderRadius: 22 }]}
        />

        {/* Close button */}
        <TouchableOpacity style={s.closeBtn} onPress={onDismiss} activeOpacity={0.7}>
          <Ionicons name="close" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={s.lockIconWrap}>
          <Ionicons name="lock-closed" size={28} color={colors.secondary} />
        </View>

        <Text style={s.lockTitle}>CREATE AN ACCOUNT</Text>

        <Text style={s.lockDesc}>
          {feature} is available for registered players only.
        </Text>

        <View style={s.benefitList}>
          {['Host private games', 'Add friends & rivals', 'Save progress to cloud', 'Access social features', 'Compete in ranked play'].map(b => (
            <View key={b} style={s.benefitRow}>
              <Ionicons name="checkmark-circle" size={13} color={colors.primary} />
              <Text style={s.benefitText}>{b}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={s.lockCta} onPress={() => { onDismiss(); router.push('/auth/signup'); }} activeOpacity={0.85}>
          <LinearGradient colors={['#00d4ff', '#0044cc']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
          <Ionicons name="person-add" size={15} color="#fff" />
          <Text style={s.lockCtaText}>CREATE FREE ACCOUNT</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.signInBtn} onPress={() => { onDismiss(); router.push('/auth/signin'); }} activeOpacity={0.7}>
          <Text style={s.signInText}>Already have an account?  <Text style={{ color: colors.primary }}>Sign in</Text></Text>
        </TouchableOpacity>

      </Animated.View>
    </Animated.View>
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
    backgroundColor: 'rgba(5,0,16,0.88)', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 24,
  },
  lockBox: {
    width: '100%', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(15,5,30,0.96)',
    borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,0,144,0.22)',
    padding: 26, paddingTop: 36, overflow: 'hidden',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute', top: 12, right: 12,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  lockIconWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,0,144,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,0,144,0.3)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  lockTitle: {
    fontFamily: 'Orbitron_700Bold', fontSize: 15,
    color: '#fff', letterSpacing: 2, textAlign: 'center',
  },
  lockDesc: {
    fontSize: 12, color: 'rgba(255,255,255,0.5)',
    textAlign: 'center', lineHeight: 18,
  },
  benefitList: { alignSelf: 'stretch', gap: 6, marginVertical: 4 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  benefitText: { fontSize: 12, color: 'rgba(255,255,255,0.65)' },

  lockCta: {
    alignSelf: 'stretch', height: 48, borderRadius: 13,
    overflow: 'hidden', flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4,
  },
  lockCtaText: { fontFamily: 'Orbitron_700Bold', fontSize: 12, color: '#fff', letterSpacing: 1.5 },

  signInBtn: { paddingVertical: 4 },
  signInText: { fontSize: 11, color: 'rgba(255,255,255,0.38)', textAlign: 'center' },

  guestBtn: {
    alignSelf: 'stretch', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 11, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginTop: 2,
  },
  guestText: {
    fontFamily: 'Orbitron_700Bold', fontSize: 10,
    color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5,
  },
});
