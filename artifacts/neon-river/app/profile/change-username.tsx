import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/colors';
import { useUser } from '@/context/UserContext';

type Phase = 'form' | 'pin' | 'done';

const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

export default function ChangeUsernameScreen() {
  const { profile, changeUsername } = useUser();

  const [phase, setPhase]           = useState<Phase>('form');
  const [newUsername, setNewUsername] = useState('');
  const [pin, setPin]               = useState('');
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [nextEligibleAt, setNextEligibleAt] = useState<string | null>(null);

  const shakeX = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeIn.setValue(0);
    Animated.timing(fadeIn, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, [phase]);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeX, { toValue:  10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue:  8,  duration: 50, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue:   0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  // Derive 30-day cooldown info from profile
  const lastChangedAt = (profile as any).usernameChangedAt as string | undefined;
  const nextEligible  = lastChangedAt
    ? new Date(new Date(lastChangedAt).getTime() + 30 * 24 * 60 * 60 * 1000)
    : null;
  const canChange     = !nextEligible || Date.now() >= nextEligible.getTime();
  const nextDateLabel = nextEligible
    ? nextEligible.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  // Username validation (mirrors server rules)
  function validateLocal(u: string): string | null {
    const clean = u.replace(/^@/, '').trim();
    if (clean.length < 3 || clean.length > 15)   return 'Use 3–15 letters, numbers, or underscores.';
    if (!/^[a-zA-Z0-9_]+$/.test(clean))           return 'Use 3–15 letters, numbers, or underscores.';
    if (clean.startsWith('_') || clean.endsWith('_')) return 'Username cannot start or end with an underscore.';
    if (/__/.test(clean))                          return 'Username cannot contain consecutive underscores.';
    return null;
  }

  function handleContinue() {
    setError('');
    const clean = newUsername.replace(/^@/, '').trim();
    const err   = validateLocal(clean);
    if (err) { setError(err); shake(); return; }
    if (clean.toLowerCase() === profile.username.toLowerCase()) {
      setError('That is already your username.'); shake(); return;
    }
    setPhase('pin');
  }

  function handlePinKey(key: string) {
    setError('');
    if (key === '⌫') { setPin(p => p.slice(0, -1)); return; }
    if (pin.length < 4) {
      const next = pin + key;
      setPin(next);
      if (next.length === 4) setTimeout(() => handleSubmit(next), 120);
    }
  }

  async function handleSubmit(enteredPin: string) {
    setLoading(true);
    const clean  = newUsername.replace(/^@/, '').trim();
    const result = await changeUsername(clean, enteredPin);
    setLoading(false);

    if (result.success) {
      setPhase('done');
    } else {
      if (result.nextEligibleAt) {
        setNextEligibleAt(result.nextEligibleAt);
      }
      setError(result.error ?? 'Could not change username. Please try again.');
      shake();
      setPin('');
      // Return to form if it's a cooldown or uniqueness error
      if (result.nextEligibleAt || result.error?.includes('unavailable') || result.error?.includes('reserved')) {
        setPhase('form');
      }
    }
  }

  // ── Done screen ────────────────────────────────────────────────────────────
  if (phase === 'done') {
    return (
      <View style={s.screen}>
        <LinearGradient colors={['#050010', '#0a0022', '#050010']} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={s.safe}>
          <View style={s.header}>
            <TouchableOpacity style={s.back} onPress={() => router.back()} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
            <Text style={s.headerTitle}>CHANGE USERNAME</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={s.doneWrap}>
            <View style={s.doneIcon}>
              <Ionicons name="checkmark-circle" size={36} color={colors.success} />
            </View>
            <Text style={s.doneTitle}>USERNAME UPDATED</Text>
            <Text style={s.doneSub}>
              Your new username is{' '}
              <Text style={{ color: colors.primary, fontWeight: '700' }}>@{profile.username}</Text>.
              {'\n\n'}Use it the next time you sign in.
            </Text>
            <TouchableOpacity style={s.doneBtn} onPress={() => router.back()} activeOpacity={0.8}>
              <LinearGradient colors={[colors.success, '#00aa66']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
              <Text style={s.doneBtnText}>DONE</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={s.screen}>
      <LinearGradient colors={['#050010', '#0a0022', '#050010']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={s.safe}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.back} onPress={() => phase === 'pin' ? (setPhase('form'), setPin(''), setError('')) : router.back()} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>CHANGE USERNAME</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: fadeIn, gap: 20 }}>

            {/* ── Info card ─────────────────────────────────────────────────── */}
            <View style={s.infoCard}>
              <LinearGradient colors={['rgba(0,212,255,0.08)', 'transparent']} style={StyleSheet.absoluteFill} />
              <Ionicons name="information-circle-outline" size={18} color="rgba(0,212,255,0.6)" />
              <Text style={s.infoText}>
                Your username is your unique login credential. You may change it{' '}
                <Text style={{ color: colors.primary }}>once every 30 days</Text>.
              </Text>
            </View>

            {/* ── Current username ──────────────────────────────────────────── */}
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>CURRENT USERNAME</Text>
              <View style={[s.inputRow, s.lockedRow]}>
                <Ionicons name="at" size={14} color="rgba(0,212,255,0.45)" />
                <Text style={s.lockedText} numberOfLines={1}>{profile.username}</Text>
                <Ionicons name="lock-closed-outline" size={13} color="rgba(255,255,255,0.2)" />
              </View>
              {lastChangedAt && (
                <Text style={s.fieldHint}>
                  Last changed: {new Date(lastChangedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </Text>
              )}
              {!canChange && nextDateLabel && !nextEligibleAt && (
                <Text style={[s.fieldHint, { color: '#ffaa44' }]}>
                  Next eligible: {nextDateLabel}
                </Text>
              )}
              {nextEligibleAt && (
                <Text style={[s.fieldHint, { color: '#ffaa44' }]}>
                  Next eligible: {new Date(nextEligibleAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </Text>
              )}
            </View>

            {/* ── Phase: form ───────────────────────────────────────────────── */}
            {phase === 'form' && (
              <>
                <View style={s.fieldGroup}>
                  <Text style={s.fieldLabel}>NEW USERNAME</Text>
                  <Animated.View style={[s.inputRow, { transform: [{ translateX: shakeX }] }]}>
                    <Ionicons name="at" size={14} color="rgba(0,212,255,0.45)" />
                    <TextInput
                      style={s.textInput}
                      value={newUsername}
                      onChangeText={v => { setNewUsername(v.replace(/[^a-zA-Z0-9_@]/g, '')); setError(''); }}
                      placeholder="new_username"
                      placeholderTextColor="rgba(255,255,255,0.25)"
                      autoCapitalize="none"
                      autoCorrect={false}
                      maxLength={16}
                      returnKeyType="done"
                      onSubmitEditing={handleContinue}
                      editable={canChange}
                    />
                    <Text style={s.charCount}>{Math.max(0, 15 - newUsername.replace(/^@/, '').trim().length)}</Text>
                  </Animated.View>
                  <Text style={s.fieldHint}>3–15 characters. Letters, numbers, and underscores only.</Text>
                </View>

                {error ? (
                  <View style={s.errorRow}>
                    <Ionicons name="warning-outline" size={14} color={colors.error} />
                    <Text style={s.errorText}>{error}</Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={[s.btn, (!canChange || !newUsername.trim() || loading) && s.btnOff]}
                  onPress={handleContinue}
                  disabled={!canChange || !newUsername.trim() || loading}
                  activeOpacity={0.8}
                >
                  <Text style={s.btnText}>CONTINUE</Text>
                  <Ionicons name="arrow-forward" size={15} color={colors.primary} />
                </TouchableOpacity>

                {!canChange && (
                  <View style={s.blockedCard}>
                    <Ionicons name="time-outline" size={18} color="#ffaa44" />
                    <Text style={s.blockedText}>
                      Username changes are limited to once every 30 days. The restriction is enforced on our servers and cannot be bypassed by changing your device clock.
                    </Text>
                  </View>
                )}
              </>
            )}

            {/* ── Phase: pin ────────────────────────────────────────────────── */}
            {phase === 'pin' && (
              <>
                <View style={s.fieldGroup}>
                  <Text style={s.fieldLabel}>CONFIRM WITH YOUR PIN</Text>
                  <Text style={s.fieldHint}>Enter your current 4-digit PIN to authorise this change.</Text>
                </View>

                <Text style={s.changingTo}>
                  Changing to: <Text style={{ color: colors.primary }}>@{newUsername.replace(/^@/, '').trim()}</Text>
                </Text>

                {/* PIN dots */}
                <Animated.View style={[s.pinDots, { transform: [{ translateX: shakeX }] }]}>
                  {[0,1,2,3].map(i => (
                    <View key={i} style={[s.pinDot, pin.length > i && s.pinDotFilled]} />
                  ))}
                </Animated.View>

                {error ? (
                  <View style={s.errorRow}>
                    <Ionicons name="warning-outline" size={14} color={colors.error} />
                    <Text style={s.errorText}>{error}</Text>
                  </View>
                ) : null}

                {/* Numpad */}
                <View style={s.numpad}>
                  {KEYS.map((k, idx) => {
                    if (!k) return <View key={idx} style={s.numKey} />;
                    const isBack = k === '⌫';
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[s.numKey, s.numKeyBtn, isBack && s.numKeyBack]}
                        onPress={() => !loading && handlePinKey(k)}
                        disabled={loading}
                        activeOpacity={0.65}
                      >
                        <Text style={[s.numKeyText, isBack && s.numKeyBackText]}>{k}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={s.pinHint}>
                  <Ionicons name="shield-checkmark-outline" size={13} color="rgba(0,212,255,0.4)" />
                  <Text style={s.pinHintText}>PIN is verified securely and never stored in plain text.</Text>
                </View>
              </>
            )}

          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#050010' },
  safe:   { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'web' ? 20 : 12,
    paddingBottom: 12,
  },
  headerTitle: { color: '#fff', fontFamily: 'Orbitron_700Bold', fontSize: 12, letterSpacing: 2 },
  back: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },

  body: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 48, gap: 0 },

  infoCard: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0,212,255,0.18)',
    padding: 14, overflow: 'hidden', marginBottom: 8,
  },
  infoText: { flex: 1, color: 'rgba(255,255,255,0.45)', fontSize: 12, lineHeight: 18 },

  fieldGroup:  { gap: 8 },
  fieldLabel:  { color: 'rgba(255,255,255,0.35)', fontSize: 9, fontFamily: 'Orbitron_700Bold', letterSpacing: 1.5 },
  fieldHint:   { color: 'rgba(255,255,255,0.3)', fontSize: 10, lineHeight: 15 },

  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0,212,255,0.25)',
    backgroundColor: 'rgba(0,212,255,0.04)', paddingHorizontal: 14, paddingVertical: 13,
  },
  lockedRow: { borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.02)' },
  lockedText: { flex: 1, color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: '600' },
  textInput: { flex: 1, color: '#fff', fontSize: 15, fontFamily: 'Orbitron_400Regular' },
  charCount: { color: 'rgba(255,255,255,0.25)', fontSize: 10 },

  errorRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  errorText: { flex: 1, color: '#ff4466', fontSize: 12, lineHeight: 17 },

  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderRadius: 14, borderWidth: 1.5, borderColor: colors.primary,
    backgroundColor: 'rgba(0,212,255,0.12)', paddingVertical: 16,
  },
  btnOff: {
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  btnText: { fontFamily: 'Orbitron_700Bold', fontSize: 13, color: colors.primary, letterSpacing: 2 },

  blockedCard: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,170,68,0.25)',
    backgroundColor: 'rgba(255,170,68,0.06)', padding: 14,
  },
  blockedText: { flex: 1, color: 'rgba(255,170,68,0.75)', fontSize: 11, lineHeight: 17 },

  changingTo: {
    textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: 13,
    fontFamily: 'Orbitron_400Regular',
  },

  pinDots: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginVertical: 8 },
  pinDot: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: 'rgba(0,212,255,0.3)',
    backgroundColor: 'transparent',
  },
  pinDotFilled: { backgroundColor: colors.primary, borderColor: colors.primary },

  numpad: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  numKey:    { width: '28%', aspectRatio: 1.6, alignItems: 'center', justifyContent: 'center' },
  numKeyBtn: { borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,212,255,0.2)', backgroundColor: 'rgba(0,212,255,0.06)' },
  numKeyBack:{ borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.04)' },
  numKeyText:    { fontSize: 22, color: '#fff', fontFamily: 'Orbitron_400Regular' },
  numKeyBackText:{ fontSize: 20, color: 'rgba(255,255,255,0.5)' },

  pinHint: { flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  pinHintText: { fontSize: 11, color: 'rgba(255,255,255,0.3)', lineHeight: 16 },

  doneWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 18 },
  doneIcon:  {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(0,255,136,0.08)', borderWidth: 2, borderColor: 'rgba(0,255,136,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  doneTitle: { color: colors.success, fontFamily: 'Orbitron_900Black', fontSize: 20, letterSpacing: 3, textAlign: 'center' },
  doneSub:   { color: 'rgba(255,255,255,0.45)', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  doneBtn:   { width: '100%', height: 54, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  doneBtnText: { color: '#050010', fontFamily: 'Orbitron_700Bold', fontSize: 14, letterSpacing: 2 },
});
