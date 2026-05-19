import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/colors';
import { useUser } from '@/context/UserContext';

export default function SignInScreen() {
  const { signIn } = useUser();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const shake = useRef(new Animated.Value(0)).current;

  const doShake = () => {
    Animated.sequence([
      Animated.timing(shake, { toValue: 8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 6,  duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0,  duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleSignIn = async () => {
    if (!username.trim() || loading) return;
    setLoading(true);
    setError('');
    const result = await signIn(username.trim());
    setLoading(false);
    if (result.success) {
      router.replace('/(tabs)');
    } else {
      setError(result.error ?? 'Sign in failed.');
      doShake();
    }
  };

  return (
    <View style={s.screen}>
      <LinearGradient
        colors={['#050010', '#0a0022', '#050010']}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

          <View style={s.header}>
            <Pressable style={s.backBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.6)" />
            </Pressable>
          </View>

          <View style={s.content}>
            <View style={s.logoMark}>
              <Text style={s.logoSymbol}>♠</Text>
            </View>
            <Text style={s.title}>WELCOME{'\n'}BACK</Text>
            <Text style={s.subtitle}>Sign in with your username to resume your game.</Text>

            <Animated.View style={[s.inputWrap, { transform: [{ translateX: shake }] }]}>
              <Ionicons name="person-outline" size={18} color="rgba(0,212,255,0.5)" />
              <TextInput
                style={s.input}
                placeholder="Username"
                placeholderTextColor="rgba(255,255,255,0.25)"
                value={username}
                onChangeText={val => { setUsername(val); setError(''); }}
                autoCapitalize="none"
                autoCorrect={false}
                onSubmitEditing={handleSignIn}
                returnKeyType="go"
              />
            </Animated.View>

            {error ? (
              <View style={s.errorRow}>
                <Ionicons name="warning-outline" size={14} color={colors.error} />
                <Text style={s.errorText}>{error}</Text>
              </View>
            ) : null}

            <Pressable
              style={({ pressed }) => [s.signinBtn, (!username.trim() || loading) && s.signinBtnDisabled, pressed && { opacity: 0.8 }]}
              onPress={handleSignIn}
              disabled={!username.trim() || loading}
            >
              <Text style={s.signinText}>{loading ? 'SIGNING IN...' : 'SIGN IN'}</Text>
              {!loading && <Ionicons name="arrow-forward" size={16} color={colors.primary} />}
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

            <View style={s.noteBox}>
              <Ionicons name="information-circle-outline" size={14} color="rgba(255,255,255,0.3)" />
              <Text style={s.noteText}>
                Accounts are stored locally on this device. Email/password login coming in a future update.
              </Text>
            </View>
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

  content: { flex: 1, paddingHorizontal: 28, paddingTop: 16, gap: 18 },

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

  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -10 },
  errorText: { fontSize: 12, color: colors.error },

  signinBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderRadius: 14, borderWidth: 1.5, borderColor: colors.primary,
    backgroundColor: 'rgba(0,212,255,0.12)', paddingVertical: 16,
  },
  signinBtnDisabled: { borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.04)' },
  signinText: { fontFamily: 'Orbitron_700Bold', fontSize: 13, color: colors.primary, letterSpacing: 2 },

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

  noteBox: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 12,
  },
  noteText: { flex: 1, fontSize: 11, color: 'rgba(255,255,255,0.3)', lineHeight: 16 },
});
