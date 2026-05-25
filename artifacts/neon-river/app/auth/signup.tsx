import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/colors';
import { useUser } from '@/context/UserContext';
import { CHARACTERS, RARITY_COLORS } from '@/constants/characters';
import CharacterPortrait from '@/components/CharacterPortrait';

const STARTER_CHARS = CHARACTERS.filter(c => c.rarity === 'COMMON').slice(0, 8);

const STEPS = ['USERNAME', 'AVATAR', 'WELCOME'];

export default function SignupScreen() {
  const { registerAccount, checkUsernameAvailable } = useUser();
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [avatarIndex, setAvatarIndex] = useState(0);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle');
  const [usernameError, setUsernameError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fadeIn  = useRef(new Animated.Value(0)).current;
  const chipAnim = useRef(new Animated.Value(0)).current;
  const checkDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fadeIn.setValue(0);
    Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [step]);

  useEffect(() => {
    if (step === 2) {
      Animated.timing(chipAnim, { toValue: 1, duration: 1200, useNativeDriver: false }).start();
    }
  }, [step]);

  const validateUsername = (val: string) => {
    if (val.length < 3)  return 'At least 3 characters required.';
    if (val.length > 20) return 'Maximum 20 characters.';
    if (!/^[a-zA-Z0-9_]+$/.test(val)) return 'Only letters, numbers, underscores.';
    return '';
  };

  const handleUsernameChange = (val: string) => {
    setUsername(val);
    setUsernameStatus('idle');
    const err = validateUsername(val);
    if (err) { setUsernameError(err); setUsernameStatus('error'); return; }
    setUsernameError('');
    setUsernameStatus('checking');
    if (checkDebounce.current) clearTimeout(checkDebounce.current);
    checkDebounce.current = setTimeout(async () => {
      const available = await checkUsernameAvailable(val);
      setUsernameStatus(available ? 'ok' : 'error');
      setUsernameError(available ? '' : 'Username already taken.');
    }, 600);
  };

  const handleNext = async () => {
    if (step === 0) {
      const err = validateUsername(username);
      if (err || usernameStatus === 'error') return;
      if (usernameStatus !== 'ok' && usernameStatus !== 'idle') return;
      setStep(1);
    } else if (step === 1) {
      setLoading(true);
      setError('');
      const result = await registerAccount(username, email, avatarIndex);
      setLoading(false);
      if (result.success) {
        setStep(2);
      } else {
        setError(result.error ?? 'Something went wrong.');
      }
    } else {
      router.replace('/terms');
    }
  };

  const usernameColor =
    usernameStatus === 'ok' ? colors.success :
    usernameStatus === 'error' ? colors.error :
    usernameStatus === 'checking' ? colors.accent :
    'rgba(255,255,255,0.2)';

  const usernameIcon =
    usernameStatus === 'ok' ? 'checkmark-circle' :
    usernameStatus === 'error' ? 'close-circle' :
    usernameStatus === 'checking' ? 'ellipsis-horizontal-circle' : null;

  const chipsDisplay = chipAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 50000] });

  return (
    <View style={s.screen}>
      <LinearGradient
        colors={['#050010', '#0a0022', '#050010']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

          {/* Header */}
          <View style={s.header}>
            <Pressable style={s.backBtn} onPress={() => step > 0 ? setStep(s2 => s2 - 1) : router.back()}>
              <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.6)" />
            </Pressable>
            <View style={s.stepIndicator}>
              {STEPS.map((_, i) => (
                <View key={i} style={[s.stepDot, i <= step && s.stepDotActive, i === step && s.stepDotCurrent]} />
              ))}
            </View>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
            <Animated.View style={{ opacity: fadeIn }}>

              {/* ── STEP 0: Username ── */}
              {step === 0 && (
                <View style={s.stepContent}>
                  <Text style={s.stepLabel}>STEP 1 OF 2</Text>
                  <Text style={s.stepTitle}>Choose Your{'\n'}Username</Text>
                  <Text style={s.stepDesc}>Your unique identity at the neon table. Choose wisely — it's permanent.</Text>

                  <View style={[s.inputWrap, { borderColor: usernameColor }]}>
                    <TextInput
                      style={s.input}
                      placeholder="Enter username"
                      placeholderTextColor="rgba(255,255,255,0.25)"
                      value={username}
                      onChangeText={handleUsernameChange}
                      autoCapitalize="none"
                      autoCorrect={false}
                      maxLength={20}
                    />
                    {usernameIcon && (
                      <Ionicons name={usernameIcon} size={20} color={usernameColor} />
                    )}
                  </View>
                  {usernameError ? (
                    <Text style={s.inputError}>{usernameError}</Text>
                  ) : usernameStatus === 'ok' ? (
                    <Text style={s.inputOk}>Username available!</Text>
                  ) : null}

                  <View style={s.inputWrap2}>
                    <TextInput
                      style={s.input}
                      placeholder="Email (optional — for recovery)"
                      placeholderTextColor="rgba(255,255,255,0.25)"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>

                  <View style={s.rulesBox}>
                    <Text style={s.rulesTitle}>USERNAME RULES</Text>
                    {[
                      '3–20 characters',
                      'Letters, numbers, underscores only',
                      'No offensive or reserved names',
                      'Cannot be changed later',
                    ].map((r, i) => (
                      <View key={i} style={s.ruleRow}>
                        <View style={s.ruleDot} />
                        <Text style={s.ruleText}>{r}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* ── STEP 1: Avatar ── */}
              {step === 1 && (
                <View style={s.stepContent}>
                  <Text style={s.stepLabel}>STEP 2 OF 2</Text>
                  <Text style={s.stepTitle}>Pick Your{'\n'}Avatar</Text>
                  <Text style={s.stepDesc}>Your face at the table. More avatars unlock as you level up.</Text>

                  <View style={s.avatarGrid}>
                    {STARTER_CHARS.map((char, i) => {
                      const rc = RARITY_COLORS[char.rarity];
                      const selected = avatarIndex === char.id;
                      return (
                        <Pressable
                          key={char.id}
                          style={[s.avatarTile, selected && { borderColor: rc, backgroundColor: `${rc}18` }]}
                          onPress={() => setAvatarIndex(char.id)}
                        >
                          <CharacterPortrait character={char} size={52} isEquipped={selected} />
                          {selected && (
                            <View style={[s.avatarCheck, { backgroundColor: rc }]}>
                              <Ionicons name="checkmark" size={10} color="#000" />
                            </View>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>

                  {error ? <Text style={s.errorText}>{error}</Text> : null}
                </View>
              )}

              {/* ── STEP 2: Welcome ── */}
              {step === 2 && (
                <View style={s.stepContent}>
                  <View style={s.welcomeIconWrap}>
                    <View style={s.welcomeIcon}>
                      <Text style={s.welcomeIconText}>♠</Text>
                    </View>
                  </View>
                  <Text style={s.welcomeTitle}>WELCOME,{'\n'}{username.toUpperCase()}</Text>
                  <Text style={s.stepDesc}>Your account is ready. You're about to enter the neon table.</Text>

                  <View style={s.chipsCard}>
                    <Text style={s.chipsLabel}>STARTING BALANCE</Text>
                    <Text style={s.chipsAmount}>50,000</Text>
                    <Text style={s.chipsUnit}>VIRTUAL CHIPS</Text>
                  </View>

                  <View style={s.perksRow}>
                    {['Ranked Mode', 'Tournaments', 'Social Feed', 'Cloud Save'].map(p => (
                      <View key={p} style={s.perkBadge}>
                        <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                        <Text style={s.perkText}>{p}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

            </Animated.View>
          </ScrollView>

          {/* CTA */}
          <View style={s.ctaArea}>
            <Pressable
              style={({ pressed }) => [
                s.cta,
                (step === 0 && (usernameStatus === 'error' || username.length < 3)) && s.ctaDisabled,
                pressed && { opacity: 0.8 },
              ]}
              onPress={handleNext}
              disabled={loading || (step === 0 && (usernameStatus === 'error' || username.length < 3))}
            >
              <Text style={s.ctaText}>
                {loading ? 'CREATING ACCOUNT...' : step === 2 ? 'ENTER CHIP SOCIETY' : 'CONTINUE'}
              </Text>
              {!loading && <Ionicons name="arrow-forward" size={16} color={colors.primary} />}
            </Pressable>
          </View>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#050010' },
  safe:   { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  stepIndicator: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  stepDot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.15)' },
  stepDotActive:  { backgroundColor: 'rgba(0,212,255,0.4)' },
  stepDotCurrent: { width: 24, backgroundColor: colors.primary },

  scroll: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 20 },
  stepContent: { gap: 16 },
  stepLabel: { fontFamily: 'Orbitron_400Regular', fontSize: 9, color: colors.secondary, letterSpacing: 3 },
  stepTitle: { fontFamily: 'Orbitron_700Bold', fontSize: 30, color: colors.primary, lineHeight: 36, letterSpacing: 1 },
  stepDesc:  { fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 19, marginTop: -4 },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 14, paddingVertical: 14,
  },
  inputWrap2: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.03)', paddingHorizontal: 14, paddingVertical: 12,
  },
  input: { flex: 1, fontSize: 15, color: '#fff', fontFamily: 'Orbitron_400Regular' },
  inputError: { fontSize: 11, color: colors.error, marginTop: -8 },
  inputOk:    { fontSize: 11, color: colors.success, marginTop: -8 },

  rulesBox: {
    backgroundColor: 'rgba(0,212,255,0.05)', borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(0,212,255,0.15)', padding: 14, gap: 6,
  },
  rulesTitle: { fontFamily: 'Orbitron_400Regular', fontSize: 8, color: colors.primary, letterSpacing: 2, marginBottom: 4 },
  ruleRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ruleDot:    { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary },
  ruleText:   { fontSize: 12, color: 'rgba(255,255,255,0.5)' },

  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', paddingVertical: 4 },
  avatarTile: {
    width: 80, height: 80, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)', position: 'relative',
  },
  avatarCheck: {
    position: 'absolute', bottom: -4, right: -4, width: 18, height: 18,
    borderRadius: 9, alignItems: 'center', justifyContent: 'center',
  },

  welcomeIconWrap: { alignItems: 'center', marginBottom: 8 },
  welcomeIcon: {
    width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.primary,
    backgroundColor: 'rgba(0,212,255,0.1)',
    ...Platform.select({ ios: { shadowColor: colors.primary, shadowOpacity: 0.6, shadowRadius: 16, shadowOffset: { width: 0, height: 0 } } }),
  },
  welcomeIconText: { fontSize: 36, color: colors.primary },
  welcomeTitle: {
    fontFamily: 'Orbitron_900Black', fontSize: 28, color: colors.primary,
    textAlign: 'center', lineHeight: 34, letterSpacing: 2,
  },

  chipsCard: {
    borderRadius: 16, borderWidth: 1.5, borderColor: 'rgba(255,215,0,0.3)',
    backgroundColor: 'rgba(255,215,0,0.06)', padding: 20, alignItems: 'center', gap: 4,
  },
  chipsLabel:  { fontFamily: 'Orbitron_400Regular', fontSize: 9, color: 'rgba(255,215,0,0.6)', letterSpacing: 3 },
  chipsAmount: { fontFamily: 'Inter_700Bold', fontSize: 38, color: colors.gold, letterSpacing: 0 },
  chipsUnit:   { fontFamily: 'Orbitron_400Regular', fontSize: 9, color: 'rgba(255,215,0,0.5)', letterSpacing: 3 },

  perksRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  perkBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    backgroundColor: 'rgba(0,255,136,0.08)', borderWidth: 1, borderColor: 'rgba(0,255,136,0.2)',
  },
  perkText: { fontSize: 11, color: colors.success },

  errorText: { fontSize: 12, color: colors.error, textAlign: 'center' },

  ctaArea: { paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 12 : 20, paddingTop: 12 },
  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderRadius: 14, borderWidth: 1.5, borderColor: colors.primary,
    backgroundColor: 'rgba(0,212,255,0.12)', paddingVertical: 16,
  },
  ctaDisabled: { borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.04)' },
  ctaText: { fontFamily: 'Orbitron_700Bold', fontSize: 13, color: colors.primary, letterSpacing: 2 },
});
