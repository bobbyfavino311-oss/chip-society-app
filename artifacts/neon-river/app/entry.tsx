import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/colors';

const { width, height } = Dimensions.get('window');

export default function EntryScreen() {
  const fadeIn   = useRef(new Animated.Value(0)).current;
  const logoGlow = useRef(new Animated.Value(0.6)).current;
  const slideUp  = useRef(new Animated.Value(40)).current;
  const particle1 = useRef(new Animated.Value(0)).current;
  const particle2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(100),
      Animated.parallel([
        Animated.timing(fadeIn,   { toValue: 1,  duration: 800, useNativeDriver: true }),
        Animated.timing(slideUp,  { toValue: 0,  duration: 700, useNativeDriver: true }),
      ]),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(logoGlow, { toValue: 1,   duration: 1800, useNativeDriver: true }),
        Animated.timing(logoGlow, { toValue: 0.6, duration: 1800, useNativeDriver: true }),
      ])
    ).start();

    // Floating particle animations
    Animated.loop(
      Animated.sequence([
        Animated.timing(particle1, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(particle1, { toValue: 0, duration: 4000, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(particle2, { toValue: 1, duration: 5500, useNativeDriver: true }),
        Animated.timing(particle2, { toValue: 0, duration: 5500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={s.screen}>
      <LinearGradient
        colors={['#050010', '#0a0022', '#050010']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.3, y: 0 }} end={{ x: 0.7, y: 1 }}
      />

      {/* Ambient neon blobs */}
      <Animated.View style={[s.blob, s.blobCyan,   { opacity: particle1 }]} />
      <Animated.View style={[s.blob, s.blobPink,   { opacity: particle2 }]} />
      <Animated.View style={[s.blob, s.blobPurple, { opacity: logoGlow }]} />

      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <Animated.View style={[s.content, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>

          {/* Logo area */}
          <View style={s.logoArea}>
            <Animated.Text style={[s.logoSub, { opacity: logoGlow }]}>
              ♠ ♥ ♦ ♣
            </Animated.Text>
            <Animated.Text style={[s.logoMain, { opacity: logoGlow }]}>
              CHIP{'\n'}SOCIETY
            </Animated.Text>
            <Text style={s.logoTagline}>THE NEON TABLE</Text>
            <View style={s.divider}>
              <View style={s.dividerLine} />
              <View style={s.dividerDot} />
              <View style={s.dividerLine} />
            </View>
          </View>

          {/* Auth buttons */}
          <View style={s.buttons}>

            {/* PRIMARY: Create Account */}
            <Pressable style={({ pressed }) => [s.btnPrimary, pressed && s.btnPressed]} onPress={() => router.push('/auth/signup')}>
              <LinearGradient
                colors={['rgba(0,212,255,0.25)', 'rgba(0,212,255,0.08)']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              />
              <View style={s.btnInner}>
                <Ionicons name="person-add" size={18} color={colors.primary} />
                <Text style={s.btnPrimaryText}>CREATE ACCOUNT</Text>
              </View>
              <Text style={s.btnSub}>50,000 chips · full access</Text>
            </Pressable>

            {/* SECONDARY: Sign In */}
            <Pressable style={({ pressed }) => [s.btnSecondary, pressed && s.btnPressed]} onPress={() => router.push('/auth/signin')}>
              <View style={s.btnInner}>
                <Ionicons name="log-in-outline" size={18} color="rgba(255,255,255,0.8)" />
                <Text style={s.btnSecondaryText}>SIGN IN</Text>
              </View>
            </Pressable>

            {/* Social auth (coming soon) */}
            <View style={s.socialRow}>
              <View style={s.socialDividerLine} />
              <Text style={s.socialDividerText}>OR</Text>
              <View style={s.socialDividerLine} />
            </View>

            <View style={s.socialButtons}>
              <Pressable style={s.socialBtn}>
                <View style={s.socialBtnInner}>
                  <Text style={s.socialIcon}></Text>
                  <Text style={s.socialBtnText}>Apple</Text>
                </View>
                <View style={s.comingSoonBadge}><Text style={s.comingSoonText}>SOON</Text></View>
              </Pressable>
              <Pressable style={s.socialBtn}>
                <View style={s.socialBtnInner}>
                  <Text style={s.socialIcon}>G</Text>
                  <Text style={s.socialBtnText}>Google</Text>
                </View>
                <View style={s.comingSoonBadge}><Text style={s.comingSoonText}>SOON</Text></View>
              </Pressable>
            </View>

            {/* TERTIARY: Guest */}
            <Pressable style={({ pressed }) => [s.btnGuest, pressed && s.btnPressed]} onPress={() => router.push('/auth/guest')}>
              <View style={s.btnInner}>
                <Ionicons name="eye-outline" size={16} color={colors.secondary} />
                <Text style={s.btnGuestText}>CONTINUE AS GUEST</Text>
              </View>
              <Text style={s.btnGuestSub}>25,000 chips · limited access</Text>
            </Pressable>

          </View>

          {/* Footer */}
          <View style={s.footer}>
            <Text style={s.footerText}>Virtual chips only — no real money gambling</Text>
            <Text style={s.footerVersion}>v1.0 · Chip Society</Text>
          </View>

        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#050010' },
  safe:   { flex: 1 },
  content: { flex: 1, paddingHorizontal: 28, justifyContent: 'space-between', paddingTop: 20, paddingBottom: 8 },

  blob: { position: 'absolute', borderRadius: 999 },
  blobCyan:   { width: 260, height: 260, backgroundColor: 'rgba(0,212,255,0.06)',  top: -60, left: -80 },
  blobPink:   { width: 220, height: 220, backgroundColor: 'rgba(255,0,144,0.07)', bottom: 100, right: -60 },
  blobPurple: { width: 300, height: 300, backgroundColor: 'rgba(191,95,255,0.04)', top: height * 0.3, left: width * 0.2 },

  logoArea: { alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 24 : 20 },
  logoSub:  { fontSize: 20, color: 'rgba(0,212,255,0.5)', letterSpacing: 12, marginBottom: 10 },
  logoMain: {
    fontFamily: 'Orbitron_900Black',
    fontSize: 52,
    color: colors.primary,
    textAlign: 'center',
    lineHeight: 56,
    letterSpacing: 4,
    ...Platform.select({ ios: { shadowColor: colors.primary, shadowOpacity: 0.7, shadowRadius: 20, shadowOffset: { width: 0, height: 0 } } }),
  },
  logoTagline: {
    fontFamily: 'Orbitron_400Regular',
    fontSize: 10,
    color: colors.secondary,
    letterSpacing: 8,
    marginTop: 8,
    ...Platform.select({ ios: { shadowColor: colors.secondary, shadowOpacity: 0.8, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } } }),
  },
  divider: { flexDirection: 'row', alignItems: 'center', marginTop: 24, width: '60%', gap: 8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(0,212,255,0.2)' },
  dividerDot:  { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary },

  buttons: { gap: 10 },

  btnPrimary: {
    borderRadius: 14, borderWidth: 1.5, borderColor: colors.primary,
    paddingVertical: 16, paddingHorizontal: 20, overflow: 'hidden',
    ...Platform.select({ ios: { shadowColor: colors.primary, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 0 } } }),
  },
  btnSecondary: {
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 14, paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  btnGuest: {
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,0,144,0.35)',
    paddingVertical: 12, paddingHorizontal: 20,
    backgroundColor: 'rgba(255,0,144,0.05)',
    marginTop: 4,
  },
  btnPressed: { opacity: 0.75, transform: [{ scale: 0.985 }] },
  btnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnPrimaryText:   { fontFamily: 'Orbitron_700Bold', fontSize: 14, color: colors.primary, letterSpacing: 2 },
  btnSecondaryText: { fontFamily: 'Orbitron_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.8)', letterSpacing: 2 },
  btnGuestText:     { fontFamily: 'Orbitron_400Regular', fontSize: 12, color: colors.secondary, letterSpacing: 2 },
  btnSub:     { textAlign: 'center', fontSize: 10, color: 'rgba(0,212,255,0.5)', marginTop: 4, letterSpacing: 1 },
  btnGuestSub:{ textAlign: 'center', fontSize: 10, color: 'rgba(255,0,144,0.4)', marginTop: 3, letterSpacing: 1 },

  socialRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 2 },
  socialDividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  socialDividerText: { fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 2 },

  socialButtons: { flexDirection: 'row', gap: 10 },
  socialBtn: {
    flex: 1, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 12, paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center', opacity: 0.6, overflow: 'hidden',
  },
  socialBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  socialIcon: { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '700' },
  socialBtnText: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  comingSoonBadge: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: 'rgba(191,95,255,0.2)', borderRadius: 4, borderWidth: 1, borderColor: 'rgba(191,95,255,0.4)',
    paddingHorizontal: 4, paddingVertical: 1,
  },
  comingSoonText: { fontSize: 7, color: colors.accent, letterSpacing: 0.5 },

  footer: { alignItems: 'center', gap: 4, paddingBottom: 4 },
  footerText:    { fontSize: 10, color: 'rgba(255,255,255,0.25)', textAlign: 'center', letterSpacing: 0.5 },
  footerVersion: { fontSize: 9,  color: 'rgba(255,255,255,0.15)', letterSpacing: 1 },
});
