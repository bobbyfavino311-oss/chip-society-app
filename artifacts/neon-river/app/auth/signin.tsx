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
import { useUser, getApiBase } from '@/context/UserContext';

type Phase = 'username' | 'pin';
type ServerStatus = 'checking' | 'ok' | 'fail';

function useServerPing(): { status: ServerStatus; url: string; retry: () => void } {
  const [status, setStatus] = useState<ServerStatus>('checking');
  const [url, setUrl] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    const apiBase = getApiBase();
    const base = apiBase.replace(/\/api$/, '');
    setUrl(apiBase);
    setStatus('checking');

    const controller = new AbortController();
    // 12 s timeout — Railway cold-start can take up to 10 s after idle
    const timer = setTimeout(() => controller.abort(), 12000);

    fetch(`${base}/api/healthz`, { signal: controller.signal })
      .then(r => { if (alive) setStatus(r.ok ? 'ok' : 'fail'); })
      .catch(() => {
        if (!alive) return;
        // On first failure, auto-retry once after 3 s in case of cold-start lag
        if (attempt < 1) {
          setTimeout(() => { if (alive) setAttempt(a => a + 1); }, 3000);
        } else {
          setStatus('fail');
        }
      })
      .finally(() => clearTimeout(timer));

    return () => { alive = false; controller.abort(); };
  }, [attempt]);

  const retry = () => { setStatus('checking'); setAttempt(a => a + 1); };
  return { status, url, retry };
}

export default function SignInScreen() {
  const { signIn } = useUser();
  const [phase, setPhase] = useState<Phase>('username');
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const shake = useRef(new Animated.Value(0)).current;
  const { status: serverStatus, url: serverUrl, retry: retryPing } = useServerPing();

  const doShake = () => {
    Animated.sequence([
      Animated.timing(shake, { toValue: 8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 6,  duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0,  duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleContinue = () => {
    if (!username.trim()) return;
    setError('');
    setPhase('pin');
  };

  const handlePinKey = (key: string) => {
    setError('');
    if (key === '⌫') { setPin(p => p.slice(0, -1)); return; }
    if (pin.length < 4) setPin(p => p + key);
  };

  const handleSignIn = async () => {
    if (pin.length !== 4 || loading) return;
    setLoading(true);
    setError('');
    const result = await signIn(username.trim(), pin);
    setLoading(false);
    if (result.success) {
      router.replace('/(tabs)');
    } else {
      const raw = result.error ?? 'Sign in failed.';
      if (raw.startsWith('ACCOUNT_BANNED::')) {
        const reason = raw.slice('ACCOUNT_BANNED::'.length);
        setError(`Account banned: ${reason}`);
      } else if (raw.startsWith('ACCOUNT_SUSPENDED::')) {
        const parts = raw.slice('ACCOUNT_SUSPENDED::'.length).split('::');
        const reason = parts[0] ?? 'Policy violation';
        const expiresAt = parts[1];
        if (expiresAt) {
          const exp = new Date(expiresAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
          setError(`Account suspended until ${exp}. Reason: ${reason}`);
        } else {
          setError(`Account suspended: ${reason}`);
        }
      } else {
        setError(raw);
      }
      doShake();
      setPin('');
    }
  };

  const handleBack = () => {
    if (phase === 'pin') {
      setPhase('username');
      setPin('');
      setError('');
    } else {
      router.back();
    }
  };

  return (
    <View style={s.screen}>
      <LinearGradient colors={['#050010', '#0a0022', '#050010']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

          <View style={s.header}>
            <Pressable style={s.backBtn} onPress={handleBack}>
              <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.6)" />
            </Pressable>
          </View>

          <View style={s.content}>
            {/* Server status pill — tap to retry when offline */}
            <TouchableOpacity
              style={s.serverPill}
              onPress={serverStatus !== 'ok' ? retryPing : undefined}
              activeOpacity={serverStatus !== 'ok' ? 0.7 : 1}
            >
              <View style={[s.serverDot, serverStatus === 'ok' ? s.dotOk : serverStatus === 'fail' ? s.dotOffline : s.dotChecking]} />
              <Text style={s.serverPillText}>
                {serverStatus === 'ok'
                  ? 'Server Connected'
                  : serverStatus === 'fail'
                    ? 'Tap to retry'
                    : 'Connecting…'}
              </Text>
            </TouchableOpacity>

            <View style={s.logoMark}>
              <Text style={s.logoSymbol}>♠</Text>
            </View>

            {/* ── Phase: Username ── */}
            {phase === 'username' && (
              <>
                <Text style={s.title}>WELCOME{'\n'}BACK</Text>
                <Text style={s.subtitle}>Enter your username to continue.</Text>

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
                    onSubmitEditing={handleContinue}
                    returnKeyType="next"
                  />
                </Animated.View>

                {error ? (
                  <View style={s.errorRow}>
                    <Ionicons name="warning-outline" size={14} color={colors.error} />
                    <Text style={s.errorText}>{error}</Text>
                  </View>
                ) : null}

                <Pressable
                  style={({ pressed }) => [s.mainBtn, !username.trim() && s.mainBtnDisabled, pressed && { opacity: 0.8 }]}
                  onPress={handleContinue}
                  disabled={!username.trim()}
                >
                  <Text style={s.mainBtnText}>CONTINUE</Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.primary} />
                </Pressable>

                <View style={s.divider}>
                  <View style={s.dividerLine} />
                  <Text style={s.dividerText}>OR</Text>
                  <View style={s.dividerLine} />
                </View>

                <Pressable style={s.createBtn} onPress={() => router.replace('/auth/signup')}>
                  <Text style={s.createText}>Create a new account</Text>
                  <Ionicons name="chevron-forward" size={14} color="rgba(0,212,255,0.5)" />
                </Pressable>

                <Pressable style={s.forgotBtn} onPress={() => router.push('/auth/forgot-pin' as any)}>
                  <Text style={s.forgotText}>Forgot PIN?</Text>
                </Pressable>
              </>
            )}

            {/* ── Phase: PIN ── */}
            {phase === 'pin' && (
              <>
                <Text style={s.title}>ENTER{'\n'}YOUR PIN</Text>
                <Text style={s.subtitle}>4-digit PIN for{'\n'}<Text style={{ color: colors.primary }}>{username}</Text></Text>

                {/* Dots */}
                <Animated.View style={[s.pinDots, { transform: [{ translateX: shake }] }]}>
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
                  style={({ pressed }) => [s.mainBtn, (pin.length !== 4 || loading) && s.mainBtnDisabled, pressed && { opacity: 0.8 }]}
                  onPress={handleSignIn}
                  disabled={pin.length !== 4 || loading}
                >
                  <Text style={s.mainBtnText}>{loading ? 'SIGNING IN...' : 'SIGN IN'}</Text>
                  {!loading && <Ionicons name="arrow-forward" size={16} color={colors.primary} />}
                </Pressable>
              </>
            )}
          </View>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#050010' },
  safe:   { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 8 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, paddingHorizontal: 28, paddingTop: 8, gap: 16 },

  logoMark: {
    width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(0,212,255,0.35)',
    backgroundColor: 'rgba(0,212,255,0.08)',
  },
  logoSymbol: { fontSize: 28, color: colors.primary },

  title: {
    fontFamily: 'Orbitron_900Black', fontSize: 34, color: colors.primary,
    lineHeight: 40, letterSpacing: 2,
  },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 18, marginTop: -8 },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(0,212,255,0.25)',
    backgroundColor: 'rgba(0,212,255,0.04)', paddingHorizontal: 14, paddingVertical: 14,
  },
  input: { flex: 1, fontSize: 15, color: '#fff', fontFamily: 'Orbitron_400Regular' },

  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -8 },
  errorText: { fontSize: 12, color: colors.error },

  mainBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderRadius: 14, borderWidth: 1.5, borderColor: colors.primary,
    backgroundColor: 'rgba(0,212,255,0.12)', paddingVertical: 16,
  },
  mainBtnDisabled: { borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.04)' },
  mainBtnText: { fontFamily: 'Orbitron_700Bold', fontSize: 13, color: colors.primary, letterSpacing: 2 },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  dividerText: { fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 2 },

  createBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 14, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(0,212,255,0.2)',
    backgroundColor: 'rgba(0,212,255,0.04)',
  },
  createText: { fontSize: 13, color: 'rgba(0,212,255,0.7)', letterSpacing: 1 },

  forgotBtn: { alignItems: 'center', paddingVertical: 6 },
  forgotText: { fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecorationLine: 'underline' },

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

  serverPill: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  serverDot: { width: 7, height: 7, borderRadius: 4 },
  dotOk:       { backgroundColor: '#00ff88' },
  dotFail:     { backgroundColor: '#ff4466' },
  dotOffline:  { backgroundColor: 'rgba(255,255,255,0.35)' },
  dotChecking: { backgroundColor: 'rgba(255,255,255,0.2)' },
  serverPillText: { fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5 },
});
