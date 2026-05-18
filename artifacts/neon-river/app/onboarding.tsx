import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@/context/UserContext';

const STARTING_CHIPS = 250_000;

function formatChips(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.floor(n / 1000)},${String(n % 1000).padStart(3, '0')}`;
  return String(n);
}

function ChipIcon({ size = 72, color = '#00d4ff' }: { size?: number; color?: string }) {
  const r = size / 2;
  const outerR = r - 2;
  const N = 8;
  const segLen = r * 0.15;
  const segs = Array.from({ length: N }, (_, i) => {
    const a = (i * (360 / N) - 90) * (Math.PI / 180);
    return {
      x1: r + outerR * Math.cos(a),
      y1: r + outerR * Math.sin(a),
      x2: r + (outerR - segLen) * Math.cos(a),
      y2: r + (outerR - segLen) * Math.sin(a),
    };
  });
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={r} cy={r} r={outerR} fill={`${color}22`} stroke={color} strokeWidth={2.5} />
      <Circle cx={r} cy={r} r={outerR * 0.72} fill={`${color}15`} stroke={color} strokeWidth={1.2} />
      <Circle cx={r} cy={r} r={outerR * 0.44} fill={`${color}20`} />
      {segs.map((s, i) => (
        <Line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      ))}
    </Svg>
  );
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { completeOnboarding, isLoaded, profile } = useUser();

  const [chipDisplay, setChipDisplay] = useState(0);
  const [phase, setPhase] = useState<'intro' | 'chips' | 'ready'>('intro');

  const fadeIn = useRef(new Animated.Value(0)).current;
  const chipScale = useRef(new Animated.Value(0.5)).current;
  const chipGlow = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isLoaded) return;
    if (!profile.isNewUser) {
      router.replace('/(tabs)');
      return;
    }

    Animated.timing(fadeIn, { toValue: 1, duration: 800, useNativeDriver: true }).start();

    const t1 = setTimeout(() => {
      setPhase('chips');
      Animated.parallel([
        Animated.spring(chipScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.timing(chipGlow, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]).start();

      // Animate chip counter
      const duration = 1800;
      const steps = 60;
      const interval = duration / steps;
      let step = 0;
      const counter = setInterval(() => {
        step++;
        const progress = step / steps;
        const eased = 1 - Math.pow(1 - progress, 3);
        setChipDisplay(Math.floor(STARTING_CHIPS * eased));
        if (step >= steps) {
          clearInterval(counter);
          setChipDisplay(STARTING_CHIPS);
          setPhase('ready');
          Animated.spring(btnScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }).start();
        }
      }, interval);
    }, 700);

    return () => clearTimeout(t1);
  }, [isLoaded]);

  const handleStart = async () => {
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0020', '#050010', '#000510']}
        style={StyleSheet.absoluteFill}
      />

      {/* Ambient glows */}
      <View style={[styles.glow, styles.glowPink]} />
      <View style={[styles.glow, styles.glowBlue]} />

      <Animated.View style={[styles.content, { opacity: fadeIn, paddingTop: insets.top + 40 }]}>

        {/* App icon + name */}
        <Image
          source={require('../assets/images/icon.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <View style={styles.logoRow}>
          <Text style={styles.logoLine1}>CHIP</Text>
          <Text style={styles.logoLine2}>SOCIETY</Text>
        </View>
        <Text style={styles.tagline}>TEXAS HOLD'EM POKER</Text>

        {/* Chip award section */}
        <Animated.View style={[styles.chipSection, { transform: [{ scale: chipScale }] }]}>
          <Animated.View style={[styles.chipGlowRing, {
            opacity: chipGlow,
            transform: [{ scale: chipGlow.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }],
          }]} />
          <ChipIcon size={100} color="#00d4ff" />
          <Text style={styles.chipLabel}>WELCOME BONUS</Text>
          <Text style={styles.chipAmount}>
            {phase === 'intro' ? '000,000' : formatChips(chipDisplay)}
          </Text>
          <Text style={styles.chipSub}>FREE VIRTUAL CHIPS</Text>
        </Animated.View>

        {/* Feature bullets */}
        <View style={styles.features}>
          {[
            { icon: 'card' as const, text: 'Full Texas Hold\'em · 5 difficulty AI bots' },
            { icon: 'trending-up' as const, text: 'Level up · Unlock ranks · Earn XP' },
            { icon: 'people' as const, text: 'Daily rewards · Streak bonuses' },
            { icon: 'shield-checkmark' as const, text: 'Virtual chips only · No real money' },
          ].map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Ionicons name={f.icon} size={14} color="#00d4ff" />
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          CHIP SOCIETY is a social poker game for entertainment only.{'\n'}
          Virtual chips have no real-money value and cannot be withdrawn.
        </Text>

        {/* CTA */}
        <Animated.View style={{ transform: [{ scale: btnScale }], width: '100%' }}>
          <TouchableOpacity
            style={styles.startBtn}
            onPress={handleStart}
            activeOpacity={0.85}
            disabled={phase !== 'ready'}
          >
            <LinearGradient
              colors={['#ff0090', '#cc00ff', '#00d4ff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons name="flash" size={22} color="#fff" style={{ marginRight: 10 }} />
            <Text style={styles.startBtnText}>START PLAYING</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: insets.bottom + 20 }} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050010' },
  content: {
    flex: 1, alignItems: 'center', paddingHorizontal: 28, gap: 20,
  },
  glow: {
    position: 'absolute', borderRadius: 999,
    ...(Platform.OS === 'web' ? {} : {}),
  },
  glowPink: {
    width: 320, height: 320, top: -60, right: -80,
    backgroundColor: 'rgba(255,0,144,0.08)',
  },
  glowBlue: {
    width: 280, height: 280, bottom: 80, left: -60,
    backgroundColor: 'rgba(0,212,255,0.07)',
  },

  logoImage: {
    width: 110, height: 110, borderRadius: 24,
    marginBottom: -4,
  },
  logoRow: { alignItems: 'center', gap: 0 },
  logoLine1: {
    fontSize: 52, fontWeight: '900', fontFamily: 'Orbitron_900Black',
    color: '#ff0090',
    letterSpacing: 8,
    textShadowColor: 'rgba(255,0,144,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  logoLine2: {
    fontSize: 52, fontWeight: '900', fontFamily: 'Orbitron_900Black',
    color: '#00d4ff',
    letterSpacing: 8,
    marginTop: -8,
    textShadowColor: 'rgba(0,212,255,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  tagline: {
    color: 'rgba(255,255,255,0.4)', fontSize: 10,
    fontFamily: 'Orbitron_400Regular', letterSpacing: 4,
    marginTop: -12,
  },

  chipSection: {
    alignItems: 'center', gap: 6, position: 'relative',
    paddingVertical: 8,
  },
  chipGlowRing: {
    position: 'absolute',
    width: 160, height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(0,212,255,0.12)',
    top: '50%', left: '50%',
    transform: [{ translateX: -80 }, { translateY: -80 }],
  },
  chipLabel: {
    color: 'rgba(255,255,255,0.5)', fontSize: 10,
    fontFamily: 'Orbitron_400Regular', letterSpacing: 3,
    marginTop: 4,
  },
  chipAmount: {
    color: '#00d4ff', fontSize: 42, fontWeight: '900',
    fontFamily: 'Orbitron_900Black', letterSpacing: 2,
    textShadowColor: 'rgba(0,212,255,0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  chipSub: {
    color: 'rgba(255,255,255,0.45)', fontSize: 11, letterSpacing: 2,
  },

  features: { gap: 8, width: '100%', paddingHorizontal: 4 },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(0,212,255,0.1)',
  },
  featureText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, flex: 1 },

  disclaimer: {
    color: 'rgba(255,255,255,0.25)', fontSize: 10,
    textAlign: 'center', lineHeight: 16,
  },

  startBtn: {
    height: 56, borderRadius: 28, overflow: 'hidden',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    width: '100%',
  },
  startBtnText: {
    color: '#fff', fontSize: 16, fontWeight: '900',
    fontFamily: 'Orbitron_700Bold', letterSpacing: 2,
  },
});
