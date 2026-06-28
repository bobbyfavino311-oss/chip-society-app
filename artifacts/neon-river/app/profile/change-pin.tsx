import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/colors';
import { useUser, getApiBase } from '@/context/UserContext';

type Phase = 'current' | 'new' | 'confirm' | 'done';

export default function ChangePinScreen() {
  const { profile } = useUser();
  const [phase, setPhase] = useState<Phase>('current');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin]         = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);

  const shakeX = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeX, { toValue:  10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue:  10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue:   0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const activePin = phase === 'current' ? currentPin : phase === 'new' ? newPin : confirmPin;
  const setActivePin = (val: string) => {
    setError('');
    if (phase === 'current') setCurrentPin(val);
    else if (phase === 'new') setNewPin(val);
    else setConfirmPin(val);
  };

  const handleKey = (key: string) => {
    if (key === '⌫') {
      setActivePin(activePin.slice(0, -1));
      return;
    }
    if (activePin.length >= 4) return;
    const next = activePin + key;
    setActivePin(next);

    if (next.length === 4) {
      setTimeout(() => advance(next), 120);
    }
  };

  const advance = async (pin: string) => {
    setError('');

    if (phase === 'current') {
      setPhase('new');
      return;
    }

    if (phase === 'new') {
      setPhase('confirm');
      return;
    }

    if (phase === 'confirm') {
      if (pin !== newPin) {
        setError("New PINs don't match. Start over.");
        shake();
        setNewPin('');
        setConfirmPin('');
        setPhase('new');
        return;
      }
      await submit(currentPin, newPin);
    }
  };

  async function submit(oldPin: string, nextPin: string) {
    setLoading(true);
    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/auth/change-pin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: profile.playerId,
          currentPin: oldPin,
          newPin:     nextPin,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error ?? 'Failed to change PIN.';
        setError(msg);
        shake();
        setCurrentPin('');
        setNewPin('');
        setConfirmPin('');
        setPhase('current');
      } else {
        setPhase('done');
      }
    } catch {
      setError('Network error. Please try again.');
      shake();
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setPhase('current');
    } finally {
      setLoading(false);
    }
  }

  const titles: Record<Phase, string> = {
    current: 'Enter Current PIN',
    new:     'Set New PIN',
    confirm: 'Confirm New PIN',
    done:    'PIN Changed!',
  };
  const subs: Record<Phase, string> = {
    current: 'Enter your existing 4-digit PIN to continue.',
    new:     'Choose a new 4-digit PIN.',
    confirm: 'Enter your new PIN one more time.',
    done:    'Your PIN has been updated successfully.',
  };

  if (phase === 'done') {
    return (
      <View style={s.screen}>
        <LinearGradient colors={['#050010', '#0a0022', '#050010']} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={s.safe}>
          <View style={s.header}>
            <TouchableOpacity style={s.back} onPress={() => router.back()} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
            <Text style={s.title}>CHANGE PIN</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={s.doneWrap}>
            <View style={s.doneIcon}>
              <Ionicons name="shield-checkmark" size={36} color={colors.success} />
            </View>
            <Text style={s.doneTitle}>PIN UPDATED</Text>
            <Text style={s.doneSub}>Your account PIN has been changed successfully.</Text>
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
        <View style={s.header}>
          <TouchableOpacity style={s.back} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
          <Text style={s.title}>CHANGE PIN</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Progress dots */}
        <View style={s.progress}>
          {(['current', 'new', 'confirm'] as Phase[]).map((p, i) => (
            <View key={p} style={[s.progDot, phase === p && s.progDotActive, i < (['current','new','confirm'] as Phase[]).indexOf(phase) && s.progDotDone]} />
          ))}
        </View>

        <View style={s.body}>
          <Text style={s.phaseTitle}>{titles[phase]}</Text>
          <Text style={s.phaseSub}>{subs[phase]}</Text>

          {/* PIN dots */}
          <Animated.View style={[s.dots, { transform: [{ translateX: shakeX }] }]}>
            {[0,1,2,3].map(i => (
              <View key={i} style={[s.dot, activePin.length > i && s.dotFilled]} />
            ))}
          </Animated.View>

          {error ? <Text style={s.error}>{error}</Text> : null}

          {/* Numpad */}
          <View style={s.numpad}>
            {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, idx) => {
              if (!k) return <View key={idx} style={s.numKey} />;
              const isBack = k === '⌫';
              return (
                <TouchableOpacity
                  key={idx}
                  style={[s.numKey, s.numKeyBtn, isBack && s.numKeyBack]}
                  onPress={() => !loading && handleKey(k)}
                  activeOpacity={0.65}
                  disabled={loading}
                >
                  <Text style={[s.numKeyText, isBack && s.numKeyBackText]}>{k}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={s.hint}>
            <Ionicons name="shield-checkmark-outline" size={13} color="rgba(0,212,255,0.4)" />
            <Text style={s.hintText}>PINs are hashed and never stored in plain text.</Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#050010' },
  safe:   { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: Platform.OS === 'web' ? 20 : 12, paddingBottom: 12,
  },
  back: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  title: { color: colors.text, fontFamily: 'Orbitron_700Bold', fontSize: 13, letterSpacing: 2 },

  progress: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 32 },
  progDot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  progDotActive:{ backgroundColor: colors.primary, borderColor: colors.primary },
  progDotDone:  { backgroundColor: colors.success, borderColor: colors.success },

  body:      { flex: 1, paddingHorizontal: 32, alignItems: 'center', gap: 16 },
  phaseTitle:{ color: colors.text, fontFamily: 'Orbitron_700Bold', fontSize: 20, textAlign: 'center', letterSpacing: 1 },
  phaseSub:  { color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', lineHeight: 19 },

  dots: { flexDirection: 'row', gap: 20, marginVertical: 8 },
  dot: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: 'rgba(0,212,255,0.3)',
    backgroundColor: 'transparent',
  },
  dotFilled: { backgroundColor: colors.primary, borderColor: colors.primary },

  error: { color: colors.error, fontSize: 12, textAlign: 'center', marginTop: -4 },

  numpad: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', width: '100%' },
  numKey:     { width: '28%', aspectRatio: 1.6, alignItems: 'center', justifyContent: 'center' },
  numKeyBtn:  { borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,212,255,0.2)', backgroundColor: 'rgba(0,212,255,0.06)' },
  numKeyBack: { borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.04)' },
  numKeyText: { fontSize: 22, color: '#fff', fontFamily: 'Orbitron_400Regular' },
  numKeyBackText: { fontSize: 20, color: 'rgba(255,255,255,0.5)' },

  hint: { flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 8 },
  hintText: { fontSize: 11, color: 'rgba(255,255,255,0.3)', lineHeight: 16 },

  doneWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 16 },
  doneIcon:  { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(0,255,136,0.1)', borderWidth: 2, borderColor: 'rgba(0,255,136,0.3)', alignItems: 'center', justifyContent: 'center' },
  doneTitle: { color: colors.success, fontFamily: 'Orbitron_900Black', fontSize: 22, letterSpacing: 3, textAlign: 'center' },
  doneSub:   { color: 'rgba(255,255,255,0.45)', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  doneBtn:   { width: '100%', height: 54, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  doneBtnText: { color: '#050010', fontFamily: 'Orbitron_700Bold', fontSize: 14, letterSpacing: 2 },
});
