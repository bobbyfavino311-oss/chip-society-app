import React, { useRef, useState } from 'react';
import {
  Animated,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTerms } from '@/context/TermsContext';
import colors from '@/constants/colors';
import { TERMS_VERSION } from '@/lib/termsStorage';

const EFFECTIVE_DATE = 'May 19, 2025';
const SUPPORT_EMAIL = 'support@chipsociety.app';

const SECTIONS = [
  {
    title: '1. INFORMATION WE COLLECT',
    body: `We may collect:\n\n• Username\n• Profile avatar\n• Player ID\n• Virtual chip balances\n• Match history\n• Gameplay statistics\n• Tournament history\n• XP progression\n• Device information\n• IP address\n• Crash analytics\n• App performance data`,
  },
  {
    title: '2. HOW WE USE INFORMATION',
    body: `We use collected data to:\n\n• Operate gameplay systems\n• Save player progress\n• Store chip balances\n• Enable multiplayer matchmaking\n• Power tournaments and ranked modes\n• Improve app stability\n• Prevent cheating and exploits\n• Provide customer support\n• Deliver rewards and progression systems`,
  },
  {
    title: '3. VIRTUAL CURRENCY DISCLAIMER',
    body: `All chips, rewards, bonuses, and items inside Chip Society are VIRTUAL ONLY.\n\nVirtual chips:\n• Have NO real-world monetary value\n• Cannot be redeemed for cash\n• Cannot be exchanged outside the app\n• Exist solely for entertainment purposes\n\nChip Society does NOT support:\n• Real-money gambling\n• Cash prizes\n• Redeemable winnings`,
  },
  {
    title: '4. SOCIAL FEATURES',
    body: `Chip Society includes:\n• Player profiles\n• Social feed\n• Comments\n• Reactions\n• User-generated content\n\nPublic content may be visible to other players.\n\nUsers are responsible for content they post.`,
  },
  {
    title: '5. DATA SHARING',
    body: `We do NOT sell personal information.\n\nWe may use trusted third-party services including:\n• Cloud hosting\n• Authentication providers\n• Analytics systems\n• Apple App Store services\n\nThese providers only receive data necessary to operate the app.`,
  },
  {
    title: '6. DATA SECURITY',
    body: `We use reasonable security measures to protect user information.\n\nHowever, no online system is completely secure.`,
  },
  {
    title: '7. CHILDREN\'S PRIVACY',
    body: `Chip Society is rated 17+ and is not intended for users under 17 years old.\n\nWe do not knowingly collect personal information from children under 17.`,
  },
  {
    title: '8. ACCOUNT TERMINATION',
    body: `We reserve the right to:\n• Suspend accounts\n• Reset balances\n• Restrict access\n• Ban users\n\nfor:\n• Cheating\n• Exploits\n• Fraud\n• Harassment\n• Abuse of the platform`,
  },
  {
    title: '9. PUSH NOTIFICATIONS',
    body: `The app may send notifications regarding:\n• Daily rewards\n• Tournaments\n• Social activity\n• Promotions\n• Updates\n\nNotifications may be disabled in iPhone settings.`,
  },
  {
    title: '10. USER RIGHTS',
    body: `Users may request:\n• Account deletion\n• Data removal\n• Support assistance\n\nContact: ${SUPPORT_EMAIL}`,
  },
  {
    title: '11. POLICY UPDATES',
    body: `This Privacy Policy may be updated periodically.\n\nUsers may be required to re-accept future updates.`,
  },
  {
    title: '12. ENTERTAINMENT DISCLAIMER',
    body: `Chip Society is a social casino entertainment app only.\n\nNo real-money gambling exists inside the app.`,
  },
];

export default function TermsScreen() {
  const { acceptTerms, declineTerms } = useTerms();
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false);
  const glowAnim = useRef(new Animated.Value(0.5)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.5, duration: 1400, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const atBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 40;
    if (atBottom && !hasScrolledToEnd) setHasScrolledToEnd(true);
  };

  const handleAccept = async () => {
    if (!checked || loading) return;
    setLoading(true);
    try {
      await acceptTerms();
      router.replace('/(tabs)');
    } catch {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!showDeclineConfirm) { setShowDeclineConfirm(true); return; }
    await declineTerms();
    router.replace('/(tabs)');
  };

  const btnActive = checked && hasScrolledToEnd;

  return (
    <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
      <Animated.View style={[s.container, { opacity: fadeAnim }]}>

        {/* Header */}
        <View style={s.header}>
          <Animated.Text style={[s.logo, { opacity: glowAnim }]}>CHIP SOCIETY</Animated.Text>
          <Text style={s.title}>TERMS & PRIVACY AGREEMENT</Text>
          <View style={s.metaRow}>
            <View style={s.badge}><Text style={s.badgeText}>v{TERMS_VERSION}</Text></View>
            <Text style={s.effectiveDate}>Effective {EFFECTIVE_DATE}</Text>
          </View>
          <View style={s.divider} />
        </View>

        {/* Scrollable policy */}
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          onScroll={handleScroll}
          scrollEventThrottle={120}
          showsVerticalScrollIndicator={true}
          indicatorStyle="white"
        >
          <Text style={s.intro}>
            Welcome to Chip Society ("the App", "we", "our", or "us").{'\n\n'}
            This Privacy Policy explains how we collect, use, store, and protect your information when you use the app.{'\n\n'}
            By using Chip Society, you agree to this Privacy Policy.
          </Text>

          {SECTIONS.map((sec, i) => (
            <View key={i} style={s.section}>
              <View style={s.sectionHeader}>
                <View style={s.sectionAccent} />
                <Text style={s.sectionTitle}>{sec.title}</Text>
              </View>
              <Text style={s.sectionBody}>{sec.body}</Text>
            </View>
          ))}

          <View style={s.endMarker}>
            <View style={s.endLine} />
            <Text style={s.endText}>END OF POLICY</Text>
            <View style={s.endLine} />
          </View>

          <Text style={s.contactLine}>
            Questions?{' '}
            <Text style={s.contactLink} onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}>
              {SUPPORT_EMAIL}
            </Text>
          </Text>

          {!hasScrolledToEnd && (
            <Text style={s.scrollHint}>↓ Scroll to read the full agreement before accepting</Text>
          )}
        </ScrollView>

        {/* Sticky footer */}
        <View style={s.footer}>
          <View style={s.footerGlow} />

          {/* Checkbox row */}
          <Pressable
            style={s.checkRow}
            onPress={() => hasScrolledToEnd && setChecked(v => !v)}
            disabled={!hasScrolledToEnd}
          >
            <View style={[s.checkbox, checked && s.checkboxChecked, !hasScrolledToEnd && s.checkboxDisabled]}>
              {checked && <Text style={s.checkmark}>✓</Text>}
            </View>
            <Text style={[s.checkLabel, !hasScrolledToEnd && { opacity: 0.4 }]}>
              I have read and agree to the Terms & Privacy Policy
            </Text>
          </Pressable>

          {showDeclineConfirm && (
            <View style={s.declineWarning}>
              <Text style={s.declineWarningText}>
                You must accept to use Chip Society. Declining will exit the app setup.
              </Text>
            </View>
          )}

          {/* Accept button */}
          <Pressable
            style={[s.acceptBtn, !btnActive && s.acceptBtnDisabled]}
            onPress={handleAccept}
            disabled={!btnActive || loading}
          >
            <Animated.View style={[s.acceptGlow, { opacity: btnActive ? glowAnim : 0 }]} />
            <Text style={[s.acceptText, !btnActive && { opacity: 0.4 }]}>
              {loading ? 'ENTERING CHIP SOCIETY...' : 'ACCEPT & CONTINUE'}
            </Text>
          </Pressable>

          {/* Decline */}
          <Pressable style={s.declineBtn} onPress={handleDecline}>
            <Text style={s.declineText}>
              {showDeclineConfirm ? 'CONFIRM DECLINE' : 'DECLINE'}
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },

  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 0 },
  logo: {
    fontFamily: 'Orbitron_900Black',
    fontSize: 11,
    color: colors.secondary,
    letterSpacing: 6,
    textAlign: 'center',
    marginBottom: 4,
  },
  title: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 17,
    color: colors.primary,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 8,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 },
  badge: {
    backgroundColor: 'rgba(0,212,255,0.12)',
    borderRadius: 6, borderWidth: 1, borderColor: 'rgba(0,212,255,0.3)',
    paddingHorizontal: 8, paddingVertical: 2,
  },
  badgeText: { fontFamily: 'Orbitron_400Regular', fontSize: 9, color: colors.primary, letterSpacing: 1 },
  effectiveDate: { fontFamily: 'Orbitron_400Regular', fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 },
  divider: { height: 1, backgroundColor: 'rgba(0,212,255,0.18)', marginBottom: 0 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },

  intro: { fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 20, marginBottom: 20 },

  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  sectionAccent: { width: 3, height: 16, borderRadius: 2, backgroundColor: colors.secondary },
  sectionTitle: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 10,
    color: colors.primary,
    letterSpacing: 1.5,
    flex: 1,
  },
  sectionBody: { fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 20 },

  endMarker: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 20 },
  endLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,0,144,0.3)' },
  endText: { fontFamily: 'Orbitron_400Regular', fontSize: 9, color: colors.secondary, letterSpacing: 3 },

  contactLine: { textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8 },
  contactLink: { color: colors.primary, textDecorationLine: 'underline' },

  scrollHint: {
    textAlign: 'center', fontSize: 11,
    color: 'rgba(255,255,255,0.3)', marginTop: 8, marginBottom: 4,
    fontFamily: 'Orbitron_400Regular', letterSpacing: 0.5,
  },

  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 4 : 12,
    backgroundColor: 'rgba(5,0,16,0.97)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,212,255,0.2)',
    gap: 10,
    position: 'relative',
  },
  footerGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 1,
    backgroundColor: colors.primary,
    ...Platform.select({ ios: { shadowColor: colors.primary, shadowOpacity: 0.8, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } } }),
  },

  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  checkbox: {
    width: 22, height: 22, borderRadius: 5,
    borderWidth: 1.5, borderColor: 'rgba(0,212,255,0.4)',
    backgroundColor: 'rgba(0,212,255,0.06)',
    alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  checkboxChecked: {
    borderColor: colors.primary, backgroundColor: 'rgba(0,212,255,0.18)',
  },
  checkboxDisabled: { borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.03)' },
  checkmark: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  checkLabel: { flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 18 },

  declineWarning: {
    backgroundColor: 'rgba(255,68,68,0.08)',
    borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,68,68,0.3)',
    padding: 10,
  },
  declineWarningText: { fontSize: 12, color: 'rgba(255,120,120,0.9)', textAlign: 'center', lineHeight: 17 },

  acceptBtn: {
    height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,212,255,0.15)',
    borderWidth: 1.5, borderColor: colors.primary,
    overflow: 'hidden', position: 'relative',
  },
  acceptBtnDisabled: {
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  acceptGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,212,255,0.12)',
  },
  acceptText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 13, letterSpacing: 2, color: colors.primary,
  },

  declineBtn: { alignItems: 'center', paddingVertical: 6 },
  declineText: { fontSize: 12, color: 'rgba(255,255,255,0.3)', letterSpacing: 1 },
});
