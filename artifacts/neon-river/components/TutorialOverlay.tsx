import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import colors from '@/constants/colors';
import { useUser } from '@/context/UserContext';

const { width: SW } = Dimensions.get('window');

// ─── Tutorial steps ───────────────────────────────────────────────────────────

interface Step {
  emoji: string;
  title: string;
  desc: string;
  accent: string;
  gradFrom: string;
  isFinal?: boolean;
}

const STEPS: Step[] = [
  {
    emoji: '♠',
    title: 'WELCOME TO\nCHIP SOCIETY',
    desc: 'The premium poker community.\nPlay, compete, and connect with players worldwide.',
    accent: '#00d4ff',
    gradFrom: '#001830',
  },
  {
    emoji: '💰',
    title: 'YOUR CHIP BALANCE',
    desc: 'You start with 50,000 chips. Win hands,\nclaim daily bonuses, and grow your stack.',
    accent: '#ffd700',
    gradFrom: '#1a1200',
  },
  {
    emoji: '🃏',
    title: 'SHARPEN YOUR GAME',
    desc: 'Challenge 4 AI opponents at 5 difficulty levels.\nPost your biggest wins to the social feed.',
    accent: '#bf5fff',
    gradFrom: '#140020',
  },
  {
    emoji: '📱',
    title: 'LIVE POKER FEED',
    desc: 'Share your biggest hands with the community.\nFollow players and grow your poker network.',
    accent: '#00ff88',
    gradFrom: '#001a0a',
  },
  {
    emoji: '🏆',
    title: 'RISE THE RANKS',
    desc: 'From Bronze to Legend.\nBuild your reputation on the live poker feed.',
    accent: '#ff0090',
    gradFrom: '#1a0010',
  },
  {
    emoji: '🎉',
    title: 'YOU\'RE READY!',
    desc: 'Your starter pack is waiting.\nJoin the community — good luck at the tables.',
    accent: '#ffd700',
    gradFrom: '#1a1200',
    isFinal: true,
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function TutorialOverlay() {
  const { profile, isLoaded, completeTutorial, addChips, addScratchTickets } = useUser();

  const [step, setStep]       = useState(0);
  const [visible, setVisible] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const bgOpacity   = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardScale   = useRef(new Animated.Value(0.88)).current;
  const dotPulse    = useRef(new Animated.Value(1)).current;

  // Show after login, only if tutorial not completed
  useEffect(() => {
    if (!isLoaded) return;
    if (!profile.tutorialCompleted && !profile.isNewUser) {
      setVisible(true);
      Animated.parallel([
        Animated.timing(bgOpacity,   { toValue: 1, duration: 450, useNativeDriver: false }),
        Animated.spring(cardScale,   { toValue: 1, tension: 55, friction: 8, useNativeDriver: false }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 380, useNativeDriver: false }),
      ]).start(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(dotPulse, { toValue: 1.4, duration: 600, useNativeDriver: false }),
            Animated.timing(dotPulse, { toValue: 1.0, duration: 600, useNativeDriver: false }),
          ]),
          { iterations: -1 }
        ).start();
      });
    }
  }, [isLoaded, profile.tutorialCompleted, profile.isNewUser]);

  const transitionCard = useCallback((nextStep: number) => {
    Animated.parallel([
      Animated.timing(cardOpacity, { toValue: 0,   duration: 160, useNativeDriver: false }),
      Animated.timing(cardScale,   { toValue: 0.94, duration: 160, useNativeDriver: false }),
    ]).start(() => {
      setStep(nextStep);
      cardScale.setValue(1.06);
      Animated.parallel([
        Animated.timing(cardOpacity, { toValue: 1, duration: 180, useNativeDriver: false }),
        Animated.spring(cardScale,   { toValue: 1, tension: 70, friction: 8, useNativeDriver: false }),
      ]).start();
    });
  }, [cardOpacity, cardScale]);

  const goNext = useCallback(() => {
    if (step >= STEPS.length - 1) return;
    transitionCard(step + 1);
  }, [step, transitionCard]);

  const dismiss = useCallback(async () => {
    Animated.parallel([
      Animated.timing(bgOpacity,   { toValue: 0, duration: 380, useNativeDriver: false }),
      Animated.timing(cardOpacity, { toValue: 0, duration: 300, useNativeDriver: false }),
      Animated.timing(cardScale,   { toValue: 0.9, duration: 300, useNativeDriver: false }),
    ]).start(() => setVisible(false));
  }, [bgOpacity, cardOpacity, cardScale]);

  const handleClaim = useCallback(async () => {
    if (claiming) return;
    setClaiming(true);
    await addChips(10_000);
    await addScratchTickets(1);
    await completeTutorial();
    await dismiss();
  }, [claiming, addChips, addScratchTickets, completeTutorial, dismiss]);

  const handleSkip = useCallback(async () => {
    await completeTutorial();
    await dismiss();
  }, [completeTutorial, dismiss]);

  if (!visible) return null;

  const curr    = STEPS[step];
  const isFinal = step === STEPS.length - 1;

  return (
    <Animated.View style={[st.overlay, { opacity: bgOpacity, pointerEvents: 'box-none' }]}>
      <Animated.View
        style={[st.card, { opacity: cardOpacity, transform: [{ scale: cardScale }], pointerEvents: 'auto' }]}
      >
        <LinearGradient
          colors={[curr.gradFrom, '#050010', '#050010']}
          style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
        />

        {/* Neon glow border */}
        <View style={[st.glowBorder, { borderColor: curr.accent, shadowColor: curr.accent }]} />

        {/* Skip */}
        {!isFinal && (
          <TouchableOpacity style={st.skipBtn} onPress={handleSkip} activeOpacity={0.7}>
            <Text style={st.skipText}>SKIP</Text>
          </TouchableOpacity>
        )}

        {/* Step counter */}
        <Text style={[st.stepNum, { color: curr.accent }]}>{step + 1} / {STEPS.length}</Text>

        {/* Icon ring */}
        <View style={[st.iconRing, { borderColor: curr.accent + '50', backgroundColor: curr.accent + '16' }]}>
          <Text style={st.iconEmoji}>{curr.emoji}</Text>
        </View>

        {/* Title */}
        <Text style={st.title}>{curr.title}</Text>

        {/* Description */}
        <Text style={st.desc}>{curr.desc}</Text>

        {/* Progress dots */}
        <View style={st.dotsRow}>
          {STEPS.map((_, i) => (
            <Animated.View
              key={i}
              style={[
                st.dot,
                i === step
                  ? [st.dotActive, { backgroundColor: curr.accent, transform: [{ scaleX: dotPulse }] }]
                  : {},
              ]}
            />
          ))}
        </View>

        {/* Reward preview on final step */}
        {isFinal && (
          <View style={st.rewardRow}>
            <View style={[st.rewardPill, { borderColor: '#ffd70040', backgroundColor: '#ffd70010' }]}>
              <Text style={st.rewardText}>💰  +10,000 CHIPS</Text>
            </View>
            <View style={[st.rewardPill, { borderColor: '#bf5fff40', backgroundColor: '#bf5fff10' }]}>
              <Text style={[st.rewardText, { color: '#bf5fff' }]}>🎴  +1 TICKET</Text>
            </View>
          </View>
        )}

        {/* CTA button */}
        <TouchableOpacity
          style={[st.ctaBtn, { borderColor: curr.accent, opacity: claiming ? 0.6 : 1 }]}
          onPress={isFinal ? handleClaim : goNext}
          activeOpacity={0.82}
          disabled={claiming}
        >
          <LinearGradient
            colors={[curr.accent + '35', curr.accent + '16']}
            style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
          />
          <Text style={[st.ctaText, { color: curr.accent }]}>
            {isFinal
              ? (claiming ? 'CLAIMING…' : '🎁  CLAIM STARTER PACK')
              : `NEXT  →`}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const CARD_W = Math.min(SW - 44, 340);

const st = StyleSheet.create({
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(2,0,14,0.86)',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 9999,
  },
  card: {
    width: CARD_W,
    borderRadius: 24,
    padding: 26,
    alignItems: 'center',
    gap: 14,
    overflow: 'hidden',
  },
  glowBorder: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 24, borderWidth: 1.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 14,
  },
  skipBtn: {
    position: 'absolute', top: 14, right: 14,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  skipText: { color: colors.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  stepNum: {
    fontSize: 9, fontWeight: '700', fontFamily: 'Orbitron_400Regular',
    letterSpacing: 1.5, alignSelf: 'flex-start',
  },
  iconRing: {
    width: 84, height: 84, borderRadius: 42,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
    marginVertical: 4,
  },
  iconEmoji: { fontSize: 36 },
  title: {
    color: '#ffffff',
    fontSize: 20, fontWeight: '900',
    fontFamily: 'Orbitron_900Black',
    letterSpacing: 1.5,
    textAlign: 'center', lineHeight: 26,
  },
  desc: {
    color: colors.textDim,
    fontSize: 13, textAlign: 'center',
    lineHeight: 21, fontWeight: '500',
  },
  dotsRow: { flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 2 },
  dot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  dotActive: { width: 20, height: 6, borderRadius: 3 },
  rewardRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  rewardPill: {
    borderRadius: 8, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  rewardText: {
    color: '#ffd700', fontSize: 10, fontWeight: '800',
    fontFamily: 'Orbitron_700Bold', letterSpacing: 0.5,
  },
  ctaBtn: {
    width: '100%', borderRadius: 14, borderWidth: 1.5,
    paddingVertical: 14, alignItems: 'center',
    overflow: 'hidden', marginTop: 2,
  },
  ctaText: { fontSize: 13, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 1 },
});
