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
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/colors';
import { useUser, getApiBase } from '@/context/UserContext';
import { useSoundSettings } from '@/context/SoundContext';
import NeonAvatar from '@/components/NeonAvatar';
import { NEON_AVATARS, NEON_RARITY_COLORS } from '@/constants/neonAvatars';

function MusicToggle() {
  const { isMusicMuted, toggleMusicMute } = useSoundSettings();
  return (
    <TouchableOpacity style={mt.btn} onPress={toggleMusicMute} activeOpacity={0.75}>
      <Ionicons
        name={isMusicMuted ? 'musical-notes-outline' : 'musical-notes'}
        size={14}
        color={isMusicMuted ? 'rgba(255,255,255,0.35)' : colors.primary}
      />
    </TouchableOpacity>
  );
}
const mt = StyleSheet.create({
  btn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
});

const STARTER_AVATARS = NEON_AVATARS.filter(a => a.rarity === 'COMMON');
const STEPS = ['USERNAME', 'PIN', 'AVATAR', 'WELCOME'];

type ServerStatus = 'checking' | 'ok' | 'fail';
function useServerPing(): { status: ServerStatus; url: string } {
  const [status, setStatus] = useState<ServerStatus>('checking');
  const [url, setUrl] = useState('');
  useEffect(() => {
    let alive = true;
    const apiBase = getApiBase();
    const base = apiBase.replace(/\/api$/, '');
    setUrl(apiBase);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    fetch(`${base}/api/healthz`, { signal: controller.signal })
      .then(r => { if (alive) setStatus(r.ok ? 'ok' : 'fail'); })
      .catch(() => { if (alive) setStatus('fail'); })
      .finally(() => clearTimeout(timer));
    return () => { alive = false; controller.abort(); };
  }, []);
  return { status, url };
}

export default function SignupScreen() {
  const { registerAccount, checkUsernameAvailable } = useUser();
  const { status: serverStatus, url: serverUrl } = useServerPing();
  const [step, setStep] = useState(0);

  const [username, setUsername] = useState('');
  const [avatarIndex, setAvatarIndex] = useState(1);

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  const [inviteCode, setInviteCode] = useState('');
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle');
  const [inviteError, setInviteError] = useState('');
  const inviteDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinPhase, setPinPhase] = useState<'enter' | 'confirm'>('enter');
  const [pinError, setPinError] = useState('');

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
  }, [step, pinPhase]);

  useEffect(() => {
    if (step === 3) {
      Animated.timing(chipAnim, { toValue: 1, duration: 1200, useNativeDriver: false }).start();
    }
  }, [step]);

  const validateEmail = (val: string) => {
    if (!val) return '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Enter a valid email address.';
    return '';
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    setEmailError(validateEmail(val));
  };

  const validateUsername = (val: string) => {
    if (val.length < 3)  return 'At least 3 characters required.';
    if (val.length > 20) return 'Maximum 20 characters.';
    if (!/^[a-zA-Z0-9_]+$/.test(val)) return 'Only letters, numbers, underscores.';
    return '';
  };

  const handleInviteCodeChange = (val: string) => {
    setInviteCode(val);
    setInviteError('');
    if (!val.trim()) { setInviteStatus('idle'); return; }
    setInviteStatus('checking');
    if (inviteDebounce.current) clearTimeout(inviteDebounce.current);
    inviteDebounce.current = setTimeout(async () => {
      try {
        const r = await fetch(`${getApiBase()}/referrals/lookup?username=${encodeURIComponent(val.trim())}`);
        const d = await r.json() as { valid?: boolean };
        if (d.valid) {
          setInviteStatus('ok');
        } else {
          setInviteStatus('error');
          setInviteError('Invite code not found.');
        }
      } catch {
        setInviteStatus('error');
        setInviteError('Could not verify code — you can still continue.');
      }
    }, 600);
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
      try {
        const available = await checkUsernameAvailable(val);
        setUsernameStatus(available ? 'ok' : 'error');
        setUsernameError(available ? '' : 'Username already taken.');
      } catch {
        setUsernameStatus('error');
        setUsernameError('Could not reach server. Try again.');
      }
    }, 600);
  };

  const handlePinKey = (key: string) => {
    setPinError('');
    if (key === '⌫') {
      if (pinPhase === 'enter') setPin(p => p.slice(0, -1));
      else setConfirmPin(p => p.slice(0, -1));
      return;
    }
    if (pinPhase === 'enter') {
      if (pin.length < 4) setPin(p => p + key);
    } else {
      if (confirmPin.length < 4) setConfirmPin(p => p + key);
    }
  };

  const handleNext = async () => {
    if (step === 0) {
      const err = validateUsername(username);
      if (err || usernameStatus === 'error') return;
      if (usernameStatus !== 'ok' && usernameStatus !== 'idle') return;
      setStep(1);
    } else if (step === 1) {
      // PIN step
      const current = pinPhase === 'enter' ? pin : confirmPin;
      if (current.length !== 4) return;
      if (pinPhase === 'enter') {
        setPinPhase('confirm');
        return;
      }
      // Confirm
      if (pin !== confirmPin) {
        setPinError("PINs don't match. Try again.");
        setConfirmPin('');
        setPin('');
        setPinPhase('enter');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setLoading(true);
      setError('');
      const result = await registerAccount(username, pin, email.trim(), avatarIndex, inviteCode.trim() || undefined);
      setLoading(false);
      if (result.success) {
        setStep(3);
      } else {
        setError(result.error ?? 'Something went wrong.');
      }
    } else {
      router.replace('/terms');
    }
  };

  const handleBack = () => {
    if (step === 1 && pinPhase === 'confirm') {
      setPinPhase('enter');
      setConfirmPin('');
      setPinError('');
    } else if (step > 0) {
      setStep(s => s - 1);
      if (step === 1) { setPin(''); setConfirmPin(''); setPinPhase('enter'); setPinError(''); }
    } else {
      router.back();
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

  const currentPin = pinPhase === 'enter' ? pin : confirmPin;
  const pinReady   = currentPin.length === 4;
  const ctaReady   = step === 0
    ? (usernameStatus === 'ok')
    : step === 1
    ? pinReady
    : step === 2
    ? true
    : true;

  return (
    <View style={s.screen}>
      <LinearGradient colors={['#050010', '#0a0022', '#050010']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

          {/* Header */}
          <View style={s.header}>
            <Pressable style={s.backBtn} onPress={handleBack}>
              <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.6)" />
            </Pressable>
            <View style={s.stepIndicator}>
              {STEPS.map((_, i) => (
                <View key={i} style={[s.stepDot, i <= step && s.stepDotActive, i === step && s.stepDotCurrent]} />
              ))}
            </View>
            <MusicToggle />
          </View>

          <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
            <Animated.View style={{ opacity: fadeIn }}>

              {/* ── STEP 0: Username ── */}
              {step === 0 && (
                <View style={s.stepContent}>
                  <Text style={s.stepLabel}>STEP 1 OF 3</Text>
                  <Text style={s.stepTitle}>Choose Your{'\n'}Username</Text>
                  <Text style={s.stepDesc}>Your unique identity at the table. Choose wisely.</Text>

                  {/* Server status pill — informational only, never blocks flow */}
                  <View style={s.serverPill}>
                    <View style={[s.serverDot, serverStatus === 'ok' ? s.dotOk : serverStatus === 'fail' ? s.dotOffline : s.dotChecking]} />
                    <Text style={s.serverPillText}>
                      {serverStatus === 'ok' ? 'Server Connected' : serverStatus === 'fail' ? 'Offline — account saved locally' : 'Connecting…'}
                    </Text>
                  </View>

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
                    {usernameIcon && <Ionicons name={usernameIcon as any} size={20} color={usernameColor} />}
                  </View>
                  {usernameError ? (
                    <Text style={s.inputError}>{usernameError}</Text>
                  ) : usernameStatus === 'ok' ? (
                    <Text style={s.inputOk}>Username available!</Text>
                  ) : null}

                  <View style={s.rulesBox}>
                    <Text style={s.rulesTitle}>USERNAME RULES</Text>
                    {['3–20 characters', 'Letters, numbers, underscores only', 'No offensive or reserved names', 'Cannot be changed later'].map((r, i) => (
                      <View key={i} style={s.ruleRow}>
                        <View style={s.ruleDot} />
                        <Text style={s.ruleText}>{r}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Optional email for account recovery */}
                  <View style={s.emailSection}>
                    <Text style={s.emailLabel}>EMAIL <Text style={s.emailOptional}>(optional — for PIN recovery)</Text></Text>
                    <View style={[s.inputWrap, { borderColor: emailError ? colors.error : email ? colors.success : 'rgba(255,255,255,0.15)' }]}>
                      <TextInput
                        style={s.input}
                        placeholder="your@email.com"
                        placeholderTextColor="rgba(255,255,255,0.2)"
                        value={email}
                        onChangeText={handleEmailChange}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
                      />
                      {email.length > 0 && (
                        <Ionicons
                          name={emailError ? 'close-circle' : 'checkmark-circle'}
                          size={18}
                          color={emailError ? colors.error : colors.success}
                        />
                      )}
                    </View>
                    {emailError ? (
                      <Text style={s.inputError}>{emailError}</Text>
                    ) : (
                      <Text style={s.emailHint}>If you forget your PIN, we'll send a reset link here.</Text>
                    )}
                  </View>

                  {/* Optional invite code — bonus chips for referrer + referee */}
                  <View style={s.emailSection}>
                    <Text style={s.emailLabel}>INVITE CODE <Text style={s.emailOptional}>(optional — get a chip bonus)</Text></Text>
                    <View style={[s.inputWrap, { borderColor: inviteStatus === 'error' ? colors.error : inviteStatus === 'ok' ? colors.success : 'rgba(255,255,255,0.15)' }]}>
                      <TextInput
                        style={s.input}
                        placeholder="Friend's username"
                        placeholderTextColor="rgba(255,255,255,0.2)"
                        value={inviteCode}
                        onChangeText={handleInviteCodeChange}
                        autoCapitalize="none"
                        autoCorrect={false}
                        maxLength={20}
                      />
                      {inviteStatus === 'ok' && <Ionicons name="checkmark-circle" size={18} color={colors.success} />}
                      {inviteStatus === 'error' && <Ionicons name="close-circle" size={18} color={colors.error} />}
                    </View>
                    {inviteError ? (
                      <Text style={s.inputError}>{inviteError}</Text>
                    ) : inviteStatus === 'ok' ? (
                      <Text style={s.inputOk}>Valid code — you'll both get bonus chips!</Text>
                    ) : (
                      <Text style={s.emailHint}>Enter a friend's username to unlock a signup bonus for both of you.</Text>
                    )}
                  </View>
                </View>
              )}

              {/* ── STEP 1: PIN ── */}
              {step === 1 && (
                <View style={s.stepContent}>
                  <Text style={s.stepLabel}>STEP 2 OF 3</Text>
                  <Text style={s.stepTitle}>{pinPhase === 'enter' ? 'Set Your\nSecret PIN' : 'Confirm\nYour PIN'}</Text>
                  <Text style={s.stepDesc}>
                    {pinPhase === 'enter'
                      ? '4-digit PIN keeps your account secure. Never share it.'
                      : 'Enter your PIN one more time to confirm.'}
                  </Text>

                  {/* Dot indicators */}
                  <View style={s.pinDots}>
                    {[0,1,2,3].map(i => (
                      <View key={i} style={[s.pinDot, currentPin.length > i && s.pinDotFilled]} />
                    ))}
                  </View>

                  {pinError ? <Text style={s.pinError}>{pinError}</Text> : null}

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

                  <View style={s.pinHintBox}>
                    <Ionicons name="shield-checkmark-outline" size={13} color="rgba(0,212,255,0.5)" />
                    <Text style={s.pinHintText}>PIN is hashed and never stored in plain text.</Text>
                  </View>
                </View>
              )}

              {/* ── STEP 2: Avatar ── */}
              {step === 2 && (
                <View style={s.stepContent}>
                  <Text style={s.stepLabel}>STEP 3 OF 3</Text>
                  <Text style={s.stepTitle}>Pick Your{'\n'}Avatar</Text>
                  <Text style={s.stepDesc}>Your face at the table. More avatars unlock as you level up.</Text>

                  <View style={s.avatarGrid}>
                    {STARTER_AVATARS.map((av) => {
                      const rc = NEON_RARITY_COLORS[av.rarity];
                      const selected = avatarIndex === av.id;
                      return (
                        <Pressable
                          key={av.id}
                          style={[s.avatarTile, selected && { borderColor: rc, backgroundColor: `${rc}18` }]}
                          onPress={() => setAvatarIndex(av.id)}
                        >
                          <NeonAvatar avatarId={av.id} size={52} isEquipped={selected} />
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

              {/* ── STEP 3: Welcome ── */}
              {step === 3 && (
                <View style={s.stepContent}>
                  <View style={s.welcomeIconWrap}>
                    <View style={s.welcomeIcon}>
                      <Text style={s.welcomeIconText}>♠</Text>
                    </View>
                  </View>
                  <Text style={s.welcomeTitle}>WELCOME,{'\n'}{username.toUpperCase()}</Text>
                  <Text style={s.stepDesc}>Your account is ready. You're about to enter the table.</Text>

                  <View style={s.chipsCard}>
                    <Text style={s.chipsLabel}>STARTING BALANCE</Text>
                    <Text style={s.chipsAmount}>50,000</Text>
                    <Text style={s.chipsUnit}>VIRTUAL CHIPS</Text>
                  </View>

                  <View style={s.perksRow}>
                    {['Ranked Mode', 'Tournaments', 'Social Feed', 'PIN Security'].map(p => (
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
          {step !== 1 && (
            <View style={s.ctaArea}>
              <Pressable
                style={({ pressed }) => [s.cta, !ctaReady && s.ctaDisabled, pressed && { opacity: 0.8 }]}
                onPress={handleNext}
                disabled={loading || !ctaReady}
              >
                <Text style={s.ctaText}>
                  {loading ? 'CREATING ACCOUNT...' : step === 3 ? 'ENTER CHIP SOCIETY' : 'CONTINUE'}
                </Text>
                {!loading && <Ionicons name="arrow-forward" size={16} color={colors.primary} />}
              </Pressable>
            </View>
          )}

          {/* PIN step CTA */}
          {step === 1 && (
            <View style={s.ctaArea}>
              <Pressable
                style={({ pressed }) => [s.cta, !pinReady && s.ctaDisabled, pressed && { opacity: 0.8 }]}
                onPress={handleNext}
                disabled={!pinReady}
              >
                <Text style={s.ctaText}>
                  {pinPhase === 'enter' ? 'CONFIRM PIN' : 'SET PIN'}
                </Text>
                <Ionicons name="arrow-forward" size={16} color={colors.primary} />
              </Pressable>
            </View>
          )}

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

  // PIN
  pinDots: { flexDirection: 'row', justifyContent: 'center', gap: 18, marginVertical: 8 },
  pinDot: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: 'rgba(0,212,255,0.3)',
    backgroundColor: 'transparent',
  },
  pinDotFilled: { backgroundColor: colors.primary, borderColor: colors.primary },
  pinError: { fontSize: 12, color: colors.error, textAlign: 'center', marginTop: -6 },

  numpad: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    justifyContent: 'center', marginTop: 4,
  },
  numKey:     { width: '28%', aspectRatio: 1.6, alignItems: 'center', justifyContent: 'center' },
  numKeyBtn:  {
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,212,255,0.2)',
    backgroundColor: 'rgba(0,212,255,0.06)',
  },
  numKeyBack: { borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.04)' },
  numKeyText: { fontSize: 22, color: '#fff', fontFamily: 'Orbitron_400Regular', letterSpacing: 0 },
  numKeyBackText: { fontSize: 20, color: 'rgba(255,255,255,0.5)' },

  pinHintBox: {
    flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,212,255,0.04)', borderRadius: 8,
    borderWidth: 1, borderColor: 'rgba(0,212,255,0.12)', padding: 10,
  },
  pinHintText: { fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 16 },

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
  chipsAmount: { fontFamily: 'Inter_700Bold', fontSize: 38, color: '#ffd700', letterSpacing: 0 },
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

  emailSection: { gap: 6 },
  emailLabel:   { fontFamily: 'Orbitron_400Regular', fontSize: 8, color: colors.primary, letterSpacing: 2 },
  emailOptional:{ fontFamily: 'Inter_400Regular', fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'none', letterSpacing: 0 },
  emailHint:    { fontSize: 10, color: 'rgba(255,255,255,0.3)', lineHeight: 14 },

  serverPill: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 4,
  },
  serverDot: { width: 7, height: 7, borderRadius: 4 },
  dotOk:       { backgroundColor: '#00ff88' },
  dotFail:     { backgroundColor: '#ff4466' },
  dotOffline:  { backgroundColor: 'rgba(255,255,255,0.35)' },
  dotChecking: { backgroundColor: 'rgba(255,255,255,0.2)' },
  serverPillText: { fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5 },
});
