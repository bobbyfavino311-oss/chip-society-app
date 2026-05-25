import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/colors';
import { useUser } from '@/context/UserContext';

const LOCKED = ['Ranked Mode', 'Tournaments', 'Social Posting', 'Leaderboards', 'Multiplayer', 'Long-term Save'];
const UNLOCKED = ['AI Practice', 'Quick Match UI', 'Chip Progression', 'Avatar Selection'];

export default function GuestScreen() {
  const { loginAsGuest } = useUser();
  const fadeIn = useRef(new Animated.Value(0)).current;
  const chipPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(chipPulse, { toValue: 1.04, duration: 1200, useNativeDriver: true }),
        Animated.timing(chipPulse, { toValue: 1,    duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleGuest = async () => {
    await loginAsGuest();
    router.replace('/terms');
  };

  return (
    <View style={s.screen}>
      <LinearGradient colors={['#050010', '#0a0022', '#050010']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <Animated.View style={[s.content, { opacity: fadeIn }]}>

          <View style={s.header}>
            <Pressable style={s.backBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.6)" />
            </Pressable>
          </View>

          <View style={s.main}>
            <View style={s.eyeIcon}>
              <Ionicons name="eye-outline" size={36} color={colors.secondary} />
            </View>
            <Text style={s.title}>GUEST MODE</Text>
            <Text style={s.subtitle}>Try Chip Society instantly — no account required.</Text>

            <Animated.View style={[s.chipsCard, { transform: [{ scale: chipPulse }] }]}>
              <Text style={s.chipsLabel}>GUEST STARTING BALANCE</Text>
              <Text style={s.chipsAmount}>25,000</Text>
              <Text style={s.chipsUnit}>VIRTUAL CHIPS</Text>
              <Text style={s.chipsNote}>Register for 50,000 chips</Text>
            </Animated.View>

            <View style={s.accessGrid}>
              <View style={s.accessCol}>
                <View style={s.accessHeader}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                  <Text style={[s.accessTitle, { color: colors.success }]}>AVAILABLE</Text>
                </View>
                {UNLOCKED.map(f => (
                  <View key={f} style={s.featureRow}>
                    <View style={[s.featureDot, { backgroundColor: colors.success }]} />
                    <Text style={s.featureText}>{f}</Text>
                  </View>
                ))}
              </View>
              <View style={s.accessDivider} />
              <View style={s.accessCol}>
                <View style={s.accessHeader}>
                  <Ionicons name="lock-closed" size={14} color={colors.error} />
                  <Text style={[s.accessTitle, { color: colors.error }]}>LOCKED</Text>
                </View>
                {LOCKED.map(f => (
                  <View key={f} style={s.featureRow}>
                    <Ionicons name="lock-closed" size={9} color="rgba(255,68,68,0.5)" />
                    <Text style={[s.featureText, { color: 'rgba(255,255,255,0.35)' }]}>{f}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={s.warningBox}>
              <Ionicons name="warning-outline" size={14} color="rgba(255,215,0,0.6)" />
              <Text style={s.warningText}>
                Guest progress is saved locally. Deleting the app will erase your data.
              </Text>
            </View>
          </View>

          <View style={s.ctaArea}>
            <Pressable style={({ pressed }) => [s.guestBtn, pressed && { opacity: 0.8 }]} onPress={handleGuest}>
              <Ionicons name="eye-outline" size={16} color={colors.secondary} />
              <Text style={s.guestBtnText}>CONTINUE AS GUEST</Text>
            </Pressable>
            <Pressable style={s.registerLink} onPress={() => router.replace('/auth/signup')}>
              <Text style={s.registerLinkText}>Create a free account instead →</Text>
            </Pressable>
          </View>

        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: '#050010' },
  safe:    { flex: 1 },
  content: { flex: 1 },
  header:  { paddingHorizontal: 16, paddingTop: 8 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  main: { flex: 1, paddingHorizontal: 24, gap: 16, paddingTop: 8 },

  eyeIcon: {
    width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,0,144,0.35)', backgroundColor: 'rgba(255,0,144,0.07)',
  },
  title: { fontFamily: 'Orbitron_900Black', fontSize: 32, color: colors.secondary, letterSpacing: 2 },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 18, marginTop: -8 },

  chipsCard: {
    borderRadius: 16, borderWidth: 1.5, borderColor: 'rgba(255,0,144,0.3)',
    backgroundColor: 'rgba(255,0,144,0.06)', padding: 18, alignItems: 'center', gap: 2,
  },
  chipsLabel:  { fontFamily: 'Orbitron_400Regular', fontSize: 8, color: 'rgba(255,0,144,0.6)', letterSpacing: 2 },
  chipsAmount: { fontFamily: 'Inter_700Bold', fontSize: 34, color: colors.secondary },
  chipsUnit:   { fontFamily: 'Orbitron_400Regular', fontSize: 8, color: 'rgba(255,0,144,0.5)', letterSpacing: 2 },
  chipsNote:   { fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 },

  accessGrid: {
    flexDirection: 'row', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 14,
  },
  accessCol:    { flex: 1, gap: 6 },
  accessDivider:{ width: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  accessHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  accessTitle:  { fontFamily: 'Orbitron_400Regular', fontSize: 8, letterSpacing: 2 },
  featureRow:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featureDot:   { width: 4, height: 4, borderRadius: 2 },
  featureText:  { fontSize: 11, color: 'rgba(255,255,255,0.6)' },

  warningBox: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: 'rgba(255,215,0,0.05)', borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.15)', padding: 12,
  },
  warningText: { flex: 1, fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 16 },

  ctaArea: { paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 12 : 20, paddingTop: 12, gap: 10 },
  guestBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 14, borderWidth: 1.5, borderColor: 'rgba(255,0,144,0.5)',
    backgroundColor: 'rgba(255,0,144,0.1)', paddingVertical: 16,
  },
  guestBtnText: { fontFamily: 'Orbitron_700Bold', fontSize: 13, color: colors.secondary, letterSpacing: 2 },
  registerLink: { alignItems: 'center', paddingVertical: 6 },
  registerLinkText: { fontSize: 12, color: 'rgba(0,212,255,0.5)', letterSpacing: 1 },
});
