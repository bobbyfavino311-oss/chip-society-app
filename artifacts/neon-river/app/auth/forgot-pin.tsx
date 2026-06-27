import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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

type Phase = 'username' | 'email' | 'pin' | 'confirm' | 'success';

export default function ForgotPinScreen() {
  const { forgotPin } = useUser();
  const [phase, setPhase]         = useState<Phase>('username');
  const [username, setUsername]   = useState('');
  const [email, setEmail]         = useState('');
  const [pin, setPin]             = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const shake  = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeIn.setValue(0);
    Animated.timing(fadeIn, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, [phase]);

  const doShake = () => {
    Animated.sequence([
      Animated.timing(shake, { toValue: 8,  duration: 55, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -8, duration: 55, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 5,  duration: 55, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -5, duration: 55, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0,  duration: 55, useNativeDriver: true }),
    ]).start();
  };

  const handlePinKey = (key: string) => {
    setError('');
    const isConfirm = phase === 'confirm';
    if (key === '⌫') {
      if (isConfirm) setConfirmPin(p => p.slice(0, -1));
      else setPin(p => p.slice(0, -1));
      return;
    }
    if (isConfirm) { if (confirmPin.length < 4) setConfirmPin(p => p + key); }
    else            { if (pin.length < 4)        setPin(p => p + key); }
  };

  const handleNext = async () => {
    setError('');
    if (phase === 'username') {
      if (!username.trim()) return;
      setPhase('email');
    } else if (phase === 'email') {
      setPhase('pin');
    } else if (phase === 'pin') {
      if (pin.length !== 4) return;
      setPhase('confirm');
    } else if (phase === 'confirm') {
      if (confirmPin.length !== 4) return;
      if (pin !== confirmPin) {
        setError("PINs don't match. Try again.");
        setPin('');
        setConfirmPin('');
        setPhase('pin');
        doShake();
        return;
      }
      setLoading(true);
      const result = await forgotPin(username.trim(), email.trim(), pin);
      setLoading(false);
      if (result.success) {
        setPhase('success');
      } else {
        setError(result.error ?? 'Could not reset PIN. Check your username and email.');
        setPin('');
        setConfirmPin('');
        setPhase('pin');
        doShake();
      }
    }
  };

  const handleBack = () => {
    setError('');
    if (phase === 'username') { router.back(); return; }
    if (phase === 'email')   { setPhase('username'); return; }
    if (phase === 'pin')     { setPhase('email'); return; }
    if (phase === 'confirm') { setConfirmPin(''); setPhase('pin'); return; }
    if (phase === 'success') { router.replace('/auth/signin'); }
  };

  const currentDots = phase === 'confirm' ? confirmPin : pin;

  return (
    <View style={s.screen}>
      <LinearGradient colors={['#050010', '#0a0022', '#050010']} style={StyleSheet.absoluteFill} />

      {/* Ambient blobs */}
      <View style={[s.blob, { backgroundColor: 'rgba(0,212,255,0.05)', top: -60, left: -60 }]} />
      <View style={[s.blob, { backgroundColor: 'rgba(191,95,255,0.04)', bottom: 80, right: -60 }]} />

      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

          {/* Header */}
          <View style={s.header}>
            {phase !== 'success' && (
              <Pressable style={s.backBtn} onPress={handleBack}>
                <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.6)" />
              </Pressable>
            )}
          </View>

          {/* Content */}
          <Animated.View style={[s.content, { opacity: fadeIn }]}>

            {/* ── USERNAME ── */}
            {phase === 'username' && (
              <>
                <View style={s.iconMark}>
                  <Ionicons name="key-outline" size={26} color={colors.primary} />
                </View>
                <Text style={s.title}>FORGOT{'\n'}YOUR PIN?</Text>
                <Text style={s.subtitle}>
                  Enter your username to start the PIN reset process.
                </Text>

                <Animated.View style={[s.inputWrap, { transform: [{ translateX: shake }] }]}>
                  <Ionicons name="person-outline" size={18} color="rgba(0,212,255,0.5)" />
                  <TextInput
                    style={s.input}
                    placeholder="Username"
                    placeholderTextColor="rgba(255,255,255,0.25)"
                    value={username}
                    onChangeText={v => { setUsername(v); setError(''); }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={handleNext}
                  />
                </Animated.View>

                {error ? <ErrorRow text={error} /> : null}

                <Pressable
                  style={({ pressed }) => [s.mainBtn, !username.trim() && s.mainBtnOff, pressed && { opacity: 0.8 }]}
                  onPress={handleNext}
                  disabled={!username.trim()}
                >
                  <Text style={s.mainBtnText}>CONTINUE</Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.primary} />
                </Pressable>

                <Pressable style={s.backLink} onPress={() => router.replace('/auth/signin')}>
                  <Text style={s.backLinkText}>Back to Sign In</Text>
                </Pressable>
              </>
            )}

            {/* ── EMAIL ── */}
            {phase === 'email' && (
              <>
                <View style={s.iconMark}>
                  <Ionicons name="mail-outline" size={26} color={colors.primary} />
                </View>
                <Text style={s.title}>RECOVERY{'\n'}EMAIL</Text>
                <Text style={s.subtitle}>
                  Enter the email linked to{' '}
                  <Text style={{ color: colors.primary }}>{username}</Text>.
                  {'\n'}Leave blank if you never set one.
                </Text>

                <View style={s.inputWrap}>
                  <Ionicons name="mail-outline" size={18} color="rgba(0,212,255,0.5)" />
                  <TextInput
                    style={s.input}
                    placeholder="Email (optional)"
                    placeholderTextColor="rgba(255,255,255,0.25)"
                    value={email}
                    onChangeText={v => { setEmail(v); setError(''); }}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={handleNext}
                  />
                </View>

                <View style={s.hintBox}>
                  <Ionicons name="information-circle-outline" size={14} color="rgba(0,212,255,0.45)" />
                  <Text style={s.hintText}>
                    If a recovery email was saved on your account, it must match exactly.
                  </Text>
                </View>

                {error ? <ErrorRow text={error} /> : null}

                <Pressable
                  style={({ pressed }) => [s.mainBtn, pressed && { opacity: 0.8 }]}
                  onPress={handleNext}
                >
                  <Text style={s.mainBtnText}>CONTINUE</Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.primary} />
                </Pressable>
              </>
            )}

            {/* ── NEW PIN / CONFIRM ── */}
            {(phase === 'pin' || phase === 'confirm') && (
              <>
                <View style={s.iconMark}>
                  <Ionicons name="lock-open-outline" size={26} color={colors.primary} />
                </View>
                <Text style={s.title}>
                  {phase === 'pin' ? 'SET NEW\nPIN' : 'CONFIRM\nNEW PIN'}
                </Text>
                <Text style={s.subtitle}>
                  {phase === 'pin'
                    ? `New 4-digit PIN for ${username}.`
                    : 'Enter the PIN one more time.'}
                </Text>

                <Animated.View style={[s.pinDots, { transform: [{ translateX: shake }] }]}>
                  {[0,1,2,3].map(i => (
                    <View key={i} style={[s.pinDot, currentDots.length > i && s.pinDotFilled]} />
                  ))}
                </Animated.View>

                {error ? <ErrorRow text={error} /> : null}

                <View style={s.numpad}>
                  {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, idx) => {
                    if (!k) return <View key={idx} style={s.numKey} />;
                    const isBack = k === '⌫';
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[s.numKey, s.numKeyBtn, isBack && s.numKeyBack]}
                        onPress={() => handlePinKey(k)}
                        activeOpacity={0.65}
                      >
                        <Text style={[s.numKeyText, isBack && s.numKeyBackText]}>{k}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Pressable
                  style={({ pressed }) => [
                    s.mainBtn,
                    (currentDots.length !== 4 || loading) && s.mainBtnOff,
                    pressed && { opacity: 0.8 },
                  ]}
                  onPress={handleNext}
                  disabled={currentDots.length !== 4 || loading}
                >
                  <Text style={s.mainBtnText}>
                    {loading ? 'RESETTING...' : phase === 'pin' ? 'NEXT' : 'RESET PIN'}
                  </Text>
                  {!loading && <Ionicons name="arrow-forward" size={16} color={colors.primary} />}
                </Pressable>
              </>
            )}

            {/* ── SUCCESS ── */}
            {phase === 'success' && (
              <>
                <View style={[s.iconMark, s.iconMarkSuccess]}>
                  <Ionicons name="checkmark-circle" size={30} color={colors.success} />
                </View>
                <Text style={[s.title, { color: colors.success }]}>PIN{'\n'}RESET!</Text>
                <Text style={s.subtitle}>
                  Your PIN has been updated for{' '}
                  <Text style={{ color: colors.primary }}>{username}</Text>.
                  Sign in with your new PIN to continue.
                </Text>

                <View style={s.successBox}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={colors.success} />
                  <Text style={s.successBoxText}>Account secured with new PIN</Text>
                </View>

                <Pressable
                  style={({ pressed }) => [s.mainBtn, s.mainBtnSuccess, pressed && { opacity: 0.8 }]}
                  onPress={() => router.replace('/auth/signin')}
                >
                  <Text style={[s.mainBtnText, { color: colors.success }]}>SIGN IN NOW</Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.success} />
                </Pressable>
              </>
            )}

          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function ErrorRow({ text }: { text: string }) {
  return (
    <View style={s.errorRow}>
      <Ionicons name="warning-outline" size={14} color={colors.error} />
      <Text style={s.errorText}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#050010' },
  safe:   { flex: 1 },
  blob:   { position: 'absolute', width: 280, height: 280, borderRadius: 140 },

  header: { paddingHorizontal: 16, paddingTop: 8, minHeight: 50 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  content: { flex: 1, paddingHorizontal: 28, paddingTop: 4, gap: 16 },

  iconMark: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(0,212,255,0.35)',
    backgroundColor: 'rgba(0,212,255,0.08)',
  },
  iconMarkSuccess: {
    borderColor: 'rgba(0,255,136,0.35)',
    backgroundColor: 'rgba(0,255,136,0.08)',
  },

  title: {
    fontFamily: 'Orbitron_900Black', fontSize: 32, color: colors.primary,
    lineHeight: 38, letterSpacing: 2, marginTop: 4,
  },
  subtitle: {
    fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 19,
  },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(0,212,255,0.25)',
    backgroundColor: 'rgba(0,212,255,0.04)', paddingHorizontal: 14, paddingVertical: 14,
  },
  input: { flex: 1, fontSize: 15, color: '#fff', fontFamily: 'Orbitron_400Regular' },

  hintBox: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: 'rgba(0,212,255,0.04)', borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(0,212,255,0.12)', padding: 12,
  },
  hintText: { flex: 1, fontSize: 11, color: 'rgba(255,255,255,0.38)', lineHeight: 16 },

  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -4 },
  errorText: { fontSize: 12, color: colors.error, flex: 1 },

  mainBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderRadius: 14, borderWidth: 1.5, borderColor: colors.primary,
    backgroundColor: 'rgba(0,212,255,0.12)', paddingVertical: 16,
  },
  mainBtnOff: {
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  mainBtnSuccess: {
    borderColor: colors.success,
    backgroundColor: 'rgba(0,255,136,0.08)',
  },
  mainBtnText: { fontFamily: 'Orbitron_700Bold', fontSize: 13, color: colors.primary, letterSpacing: 2 },

  backLink: { alignItems: 'center', paddingVertical: 4 },
  backLinkText: { fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecorationLine: 'underline' },

  // PIN
  pinDots: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginVertical: 4 },
  pinDot: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: 'rgba(0,212,255,0.3)',
    backgroundColor: 'transparent',
  },
  pinDotFilled: { backgroundColor: colors.primary, borderColor: colors.primary },

  numpad: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  numKey:     { width: '28%', aspectRatio: 1.6, alignItems: 'center', justifyContent: 'center' },
  numKeyBtn:  {
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,212,255,0.2)',
    backgroundColor: 'rgba(0,212,255,0.06)',
  },
  numKeyBack: { borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.04)' },
  numKeyText: { fontSize: 22, color: '#fff', fontFamily: 'Orbitron_400Regular' },
  numKeyBackText: { fontSize: 20, color: 'rgba(255,255,255,0.5)' },

  successBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(0,255,136,0.06)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(0,255,136,0.20)', padding: 14,
  },
  successBoxText: { fontSize: 13, color: colors.success, fontFamily: 'Orbitron_400Regular', letterSpacing: 0.5 },
});
