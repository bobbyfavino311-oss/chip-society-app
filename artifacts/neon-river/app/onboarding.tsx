import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@/context/UserContext';

const WELCOME_CHIPS = 50_000;

function formatChips(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.floor(n / 1000)},${String(n % 1000).padStart(3, '0')}`;
  return String(n);
}

function ChipIcon({ size = 56, color = '#00d4ff' }: { size?: number; color?: string }) {
  const r = size / 2;
  const outerR = r - 1.5;
  const N = 8;
  const segLen = r * 0.14;
  const segs = Array.from({ length: N }, (_, i) => {
    const a = (i * (360 / N) - 90) * (Math.PI / 180);
    return {
      x1: r + outerR * Math.cos(a), y1: r + outerR * Math.sin(a),
      x2: r + (outerR - segLen) * Math.cos(a), y2: r + (outerR - segLen) * Math.sin(a),
    };
  });
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={r} cy={r} r={outerR} fill={`${color}18`} stroke={color} strokeWidth={2} />
      <Circle cx={r} cy={r} r={outerR * 0.68} fill={`${color}12`} stroke={color} strokeWidth={1} />
      <Circle cx={r} cy={r} r={outerR * 0.4} fill={`${color}18`} />
      {segs.map((s, i) => (
        <Line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={color} strokeWidth={2} strokeLinecap="round" />
      ))}
    </Svg>
  );
}

const FEATURES = [
  { icon: 'card'              as const, text: 'Full Texas Hold\'em · 5 AI difficulty levels' },
  { icon: 'trending-up'       as const, text: 'Earn XP · Level up · Unlock ranks' },
  { icon: 'trophy'            as const, text: 'Tournaments · Ranked mode · Daily missions' },
  { icon: 'shield-checkmark'  as const, text: 'Virtual chips only · No real money' },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { completeOnboarding, isLoaded, profile } = useUser();

  const [chipDisplay, setChipDisplay] = useState(0);
  const [ready, setReady] = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const chipScale = useRef(new Animated.Value(0.6)).current;
  const btnSlide  = useRef(new Animated.Value(40)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isLoaded) return;
    if (!profile.isNewUser) { router.replace('/(tabs)'); return; }

    Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }).start();

    const t1 = setTimeout(() => {
      Animated.spring(chipScale, { toValue: 1, tension: 55, friction: 9, useNativeDriver: true }).start();

      const duration = 1600;
      const steps = 50;
      let step = 0;
      const counter = setInterval(() => {
        step++;
        const eased = 1 - Math.pow(1 - step / steps, 3);
        setChipDisplay(Math.floor(WELCOME_CHIPS * eased));
        if (step >= steps) {
          clearInterval(counter);
          setChipDisplay(WELCOME_CHIPS);
          setReady(true);
          Animated.parallel([
            Animated.timing(btnSlide,   { toValue: 0, duration: 400, useNativeDriver: true }),
            Animated.timing(btnOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
          ]).start();
        }
      }, duration / steps);
    }, 500);

    return () => clearTimeout(t1);
  }, [isLoaded]);

  const handleEnter = async () => {
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  const btnBottom = insets.bottom + (Platform.OS === 'web' ? 20 : 16);

  return (
    <View style={s.root}>
      <LinearGradient colors={['#0c0022', '#050010', '#000515']} style={StyleSheet.absoluteFill} />

      {/* Subtle ambient glows */}
      <View style={[s.glow, s.glowA]} />
      <View style={[s.glow, s.glowB]} />

      {/* Scrollable content */}
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView
          contentContainerStyle={[
            s.scroll,
            { paddingTop: insets.top + (Platform.OS === 'web' ? 48 : 36), paddingBottom: btnBottom + 80 },
          ]}
          showsVerticalScrollIndicator={false}
          bounces
        >
          {/* Logo */}
          <View style={s.logoBlock}>
            <Image
              source={require('../assets/images/icon.png')}
              style={s.logoImg}
              resizeMode="contain"
            />
            <Text style={s.logoLine1}>CHIP</Text>
            <Text style={s.logoLine2}>SOCIETY</Text>
            <Text style={s.tagline}>TEXAS HOLD'EM POKER</Text>
          </View>

          {/* Welcome chip reward */}
          <Animated.View style={[s.chipBlock, { transform: [{ scale: chipScale }] }]}>
            <LinearGradient
              colors={['rgba(0,212,255,0.1)', 'rgba(0,212,255,0.03)']}
              style={s.chipCard}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <View style={s.chipCardBorder} />
              <Text style={s.chipEyebrow}>WELCOME BONUS</Text>
              <ChipIcon size={52} color="#00d4ff" />
              <Text style={s.chipAmount}>{formatChips(chipDisplay)}</Text>
              <Text style={s.chipSub}>FREE VIRTUAL CHIPS</Text>
            </LinearGradient>
          </Animated.View>

          {/* Feature list */}
          <View style={s.featureBlock}>
            {FEATURES.map((f, i) => (
              <View key={i} style={s.featureRow}>
                <View style={s.featureIcon}>
                  <Ionicons name={f.icon} size={15} color="#00d4ff" />
                </View>
                <Text style={s.featureText}>{f.text}</Text>
              </View>
            ))}
          </View>

          {/* Legal */}
          <Text style={s.legal}>
            CHIP SOCIETY is a social poker game for entertainment only.
            Virtual chips have no real-money value and cannot be withdrawn.
          </Text>
        </ScrollView>
      </Animated.View>

      {/* Fixed CTA — always visible at bottom */}
      <Animated.View
        style={[
          s.ctaFixed,
          {
            bottom: btnBottom,
            opacity: btnOpacity,
            transform: [{ translateY: btnSlide }],
          },
        ]}
        pointerEvents={ready ? 'auto' : 'none'}
      >
        <TouchableOpacity
          style={s.enterBtn}
          onPress={handleEnter}
          activeOpacity={0.88}
          disabled={!ready}
        >
          <LinearGradient
            colors={['#ff0090', '#cc00ff', '#00a8ff']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <Ionicons name="flash" size={20} color="#fff" style={{ marginRight: 10 }} />
          <Text style={s.enterBtnText}>ENTER CHIP SOCIETY</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050010' },

  glow: { position: 'absolute', borderRadius: 999 },
  glowA: { width: 200, height: 200, top: -40, right: -60, backgroundColor: 'rgba(255,0,144,0.06)' },
  glowB: { width: 180, height: 180, bottom: 120, left: -50, backgroundColor: 'rgba(0,212,255,0.05)' },

  scroll: {
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 28,
  },

  logoBlock: { alignItems: 'center', gap: 0 },
  logoImg: { width: 88, height: 88, borderRadius: 20, marginBottom: 6 },
  logoLine1: {
    fontSize: 44, fontWeight: '900', fontFamily: 'Orbitron_900Black',
    color: '#ff0090', letterSpacing: 6,
    textShadowColor: 'rgba(255,0,144,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  logoLine2: {
    fontSize: 44, fontWeight: '900', fontFamily: 'Orbitron_900Black',
    color: '#00d4ff', letterSpacing: 6, marginTop: -6,
    textShadowColor: 'rgba(0,212,255,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  tagline: {
    color: 'rgba(255,255,255,0.35)', fontSize: 9,
    fontFamily: 'Orbitron_400Regular', letterSpacing: 4,
    marginTop: 4,
  },

  chipBlock: { width: '100%' },
  chipCard: {
    borderRadius: 18, padding: 22, alignItems: 'center', gap: 8,
    position: 'relative', overflow: 'hidden',
  },
  chipCardBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18, borderWidth: 1, borderColor: 'rgba(0,212,255,0.25)',
  },
  chipEyebrow: {
    color: 'rgba(255,255,255,0.4)', fontSize: 9,
    fontFamily: 'Orbitron_400Regular', letterSpacing: 3,
  },
  chipAmount: {
    color: '#00d4ff', fontSize: 38, fontWeight: '900',
    fontFamily: 'Orbitron_900Black', letterSpacing: 2,
    textShadowColor: 'rgba(0,212,255,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  chipSub: {
    color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: 2,
  },

  featureBlock: { gap: 8, width: '100%' },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(0,212,255,0.1)',
  },
  featureIcon: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: 'rgba(0,212,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  featureText: {
    color: 'rgba(255,255,255,0.65)', fontSize: 12, flex: 1, lineHeight: 17,
  },

  legal: {
    color: 'rgba(255,255,255,0.2)', fontSize: 10,
    textAlign: 'center', lineHeight: 16, paddingHorizontal: 8,
  },

  ctaFixed: {
    position: 'absolute', left: 20, right: 20,
  },
  enterBtn: {
    height: 56, borderRadius: 28, overflow: 'hidden',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  enterBtnText: {
    color: '#fff', fontSize: 15, fontWeight: '900',
    fontFamily: 'Orbitron_700Bold', letterSpacing: 2,
  },
});
