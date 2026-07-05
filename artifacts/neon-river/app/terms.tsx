import React, { useRef, useState } from 'react';
import {
  Animated,
  Linking,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTerms } from '@/context/TermsContext';
import colors from '@/constants/colors';
import { TERMS_VERSION } from '@/lib/termsStorage';

const EFFECTIVE_DATE = 'July 4, 2026';
const SUPPORT_EMAIL = 'support@chipsociety.app';

// ─── Privacy Policy content ───────────────────────────────────────────────────

const PRIVACY_INTRO = `Welcome to Chip Society ("the App", "we", "our", or "us").\n\nThis Privacy Policy explains how we collect, use, store, and protect your information when you use the app.\n\nBy using Chip Society, you agree to this Privacy Policy.`;

const PRIVACY_SECTIONS = [
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
    title: "7. CHILDREN'S PRIVACY",
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

// ─── Terms of Service content ─────────────────────────────────────────────────

const TOS_INTRO = `Welcome to Chip Society ("Chip Society," "we," "our," or "us").\n\nThese Terms of Service ("Terms") govern your access to and use of the Chip Society mobile application, website, and all related services. By creating an account or using Chip Society, you acknowledge that you have read, understood, and agree to these Terms of Service and our Privacy Policy.\n\nIf you do not agree to these Terms, do not create an account or use the Service.`;

const TOS_SECTIONS = [
  {
    title: '1. ELIGIBILITY',
    body: `You must be at least seventeen (17) years old to create an account or use Chip Society.\n\nBy using the Service, you represent and warrant that:\n\n• You are at least 17 years of age.\n• You have the legal capacity to agree to these Terms.\n• You are not prohibited from using the Service under applicable law.`,
  },
  {
    title: '2. ABOUT CHIP SOCIETY',
    body: `Chip Society is a social poker and casino entertainment platform.\n\nThe application is intended solely for entertainment purposes.\n\nChip Society does not offer real-money gambling.\n\nChip Society does not allow players to wager real money against one another.\n\nAll gameplay uses virtual chips only.\n\nNo chips, rewards, or virtual items possess any real-world monetary value.`,
  },
  {
    title: '3. VIRTUAL CHIPS',
    body: `All chips inside Chip Society are virtual.\n\nVirtual chips:\n\n• Cannot be redeemed for cash.\n• Cannot be exchanged for real-world currency.\n• Cannot be transferred outside the game.\n• Cannot be sold.\n• Cannot be traded for value.\n\nChip Society retains ownership of all virtual currency.`,
  },
  {
    title: '4. VIRTUAL ITEMS',
    body: `The following items are virtual entertainment items only:\n\n• Fortune Cookies\n• Lottery Tickets\n• XP\n• Themes\n• Avatars\n• Tournament Rewards\n• Collectibles\n• Cosmetics\n• Badges\n• Achievements\n\nThese items:\n\n• Have no monetary value.\n• Cannot be redeemed.\n• Cannot be exchanged.\n• Cannot be transferred outside Chip Society.`,
  },
  {
    title: '5. PLAYER ACCOUNTS',
    body: `Each player is responsible for maintaining the security of their account.\n\nPlayers agree:\n\n• To provide accurate information.\n• To maintain account security.\n• Not to share login credentials.\n• Not to allow another individual to use their account.\n\nChip Society may suspend or terminate accounts involved in unauthorized sharing.`,
  },
  {
    title: '6. FAIR PLAY POLICY',
    body: `Players must compete honestly.\n\nThe following are prohibited:\n\n• Cheating\n• Chip dumping\n• Collusion\n• Multi-accounting\n• Automated play\n• Bots\n• Scripts\n• Exploits\n• Hacking\n• Memory editing\n• Reverse engineering\n• Unauthorized software\n• Network manipulation\n• Match fixing\n\nViolations may result in:\n\n• Warning\n• Chip removal\n• Tournament disqualification\n• Suspension\n• Permanent account termination`,
  },
  {
    title: '7. SOCIAL FEATURES',
    body: `Players are responsible for all content they create.\n\nThis includes:\n\n• Posts\n• Comments\n• Usernames\n• Chat messages\n• Profile biographies\n\nThe following content is prohibited:\n\n• Threats\n• Harassment\n• Hate speech\n• Illegal content\n• Copyright infringement\n• Spam\n• Malware\n• Fraud\n• Personal information belonging to others\n\nChip Society reserves the right to remove content or restrict accounts at its sole discretion.`,
  },
  {
    title: '8. MULTIPLAYER CONDUCT',
    body: `Players are expected to maintain respectful conduct during multiplayer gameplay.\n\nPlayers may not:\n\n• Intentionally stall games.\n• Abuse in-game chat.\n• Harass opponents.\n• Exploit gameplay mechanics.\n• Manipulate tournament outcomes.\n\nRepeated violations may result in chat restrictions or permanent account penalties.`,
  },
  {
    title: '9. AI OPPONENTS',
    body: `Certain game modes contain AI-controlled opponents.\n\nAI players exist solely for entertainment and practice purposes.\n\nAI opponents are not real users.`,
  },
  {
    title: '10. TOURNAMENTS',
    body: `Tournament prizes consist solely of virtual rewards.\n\nTournament chips are separate from a player's bankroll and have no real-world value.\n\nChip Society reserves the right to:\n\n• Modify tournament structures.\n• Adjust blind schedules.\n• Change prize pools.\n• Cancel tournaments.\n• Restart tournaments.\n• Remove players violating tournament rules.`,
  },
  {
    title: '11. PURCHASES',
    body: `If virtual purchases become available:\n\n• Purchases are final unless otherwise required by law.\n• Prices may change without notice.\n• Refunds are handled according to Apple App Store or Google Play policies.`,
  },
  {
    title: '12. INTELLECTUAL PROPERTY',
    body: `All Chip Society content is protected by intellectual property law.\n\nThis includes:\n\n• Logos\n• Artwork\n• Game designs\n• Audio\n• Animations\n• Themes\n• User Interface\n• Software\n• Branding\n\nNo content may be copied, reproduced, or distributed without written permission.`,
  },
  {
    title: '13. GAME UPDATES',
    body: `Chip Society may modify the Service at any time.\n\nThis includes:\n\n• Game balance\n• Rewards\n• Odds\n• Features\n• Poker variants\n• Casino games\n• Tournament structures\n• User Interface\n• Audio\n• Visual assets\n\nUpdates may occur without prior notice.`,
  },
  {
    title: '14. SERVICE AVAILABILITY',
    body: `Chip Society strives to provide uninterrupted service but cannot guarantee continuous availability.\n\nTemporary interruptions may occur due to:\n\n• Maintenance\n• Server upgrades\n• Technical issues\n• Internet outages\n• Security updates`,
  },
  {
    title: '15. ACCOUNT SUSPENSION OR TERMINATION',
    body: `Chip Society reserves the right to suspend or permanently terminate any account for violations of these Terms.\n\nReasons may include:\n\n• Cheating\n• Exploiting bugs\n• Offensive behavior\n• Fraud\n• Unauthorized software\n• Multiple account abuse\n• Illegal activity\n\nTermination may result in permanent loss of:\n\n• Chips\n• Tournament progress\n• Statistics\n• Cosmetics\n• Virtual items`,
  },
  {
    title: '16. DISCLAIMER',
    body: `Chip Society is provided "AS IS" and "AS AVAILABLE."\n\nTo the fullest extent permitted by law, Chip Society disclaims all warranties, express or implied, regarding uninterrupted service, accuracy, or fitness for a particular purpose.`,
  },
  {
    title: '17. LIMITATION OF LIABILITY',
    body: `To the maximum extent permitted by law, Chip Society shall not be liable for any indirect, incidental, consequential, special, or punitive damages arising from the use of the Service.`,
  },
  {
    title: '18. CHANGES TO THESE TERMS',
    body: `Chip Society may update these Terms periodically.\n\nIf material changes are made:\n\n• Players will be notified.\n• Updated Terms will be presented.\n• Continued use will require acceptance of the revised Terms.\n\nAcceptance will again be required only once for the new version.`,
  },
  {
    title: '19. CONTACT',
    body: `Questions regarding these Terms may be directed to:\n\n${SUPPORT_EMAIL}`,
  },
];

// ─── Document viewer modal ─────────────────────────────────────────────────────

interface DocModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  intro: string;
  sections: { title: string; body: string }[];
  accentColor: string;
}

function DocModal({ visible, onClose, title, intro, sections, accentColor }: DocModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[dm.screen, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={dm.header}>
          <View style={{ flex: 1 }}>
            <Text style={dm.label}>CHIP SOCIETY</Text>
            <Text style={[dm.title, { color: accentColor }]}>{title}</Text>
          </View>
          <TouchableOpacity style={dm.closeBtn} onPress={onClose} activeOpacity={0.75}>
            <Ionicons name="close" size={22} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>
        <View style={[dm.headerDivider, { backgroundColor: accentColor + '40' }]} />

        {/* Content */}
        <ScrollView
          style={dm.scroll}
          contentContainerStyle={[dm.scrollContent, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator
          indicatorStyle="white"
        >
          <View style={[dm.metaRow]}>
            <View style={[dm.badge, { borderColor: accentColor + '60', backgroundColor: accentColor + '18' }]}>
              <Text style={[dm.badgeText, { color: accentColor }]}>v{TERMS_VERSION}</Text>
            </View>
            <Text style={dm.dateText}>Effective {EFFECTIVE_DATE}</Text>
          </View>

          <Text style={dm.intro}>{intro}</Text>

          {sections.map((sec, i) => (
            <View key={i} style={dm.section}>
              <View style={dm.sectionHeader}>
                <View style={[dm.accent, { backgroundColor: accentColor }]} />
                <Text style={[dm.sectionTitle, { color: accentColor }]}>{sec.title}</Text>
              </View>
              <Text style={dm.sectionBody}>{sec.body}</Text>
            </View>
          ))}

          <View style={dm.endMarker}>
            <View style={[dm.endLine, { backgroundColor: accentColor + '44' }]} />
            <Text style={[dm.endText, { color: accentColor }]}>END OF DOCUMENT</Text>
            <View style={[dm.endLine, { backgroundColor: accentColor + '44' }]} />
          </View>

          <Text style={dm.contact}>
            Questions?{' '}
            <Text style={[dm.contactLink, { color: accentColor }]} onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}>
              {SUPPORT_EMAIL}
            </Text>
          </Text>
        </ScrollView>

        {/* Done button */}
        <View style={[dm.footer, { paddingBottom: insets.bottom + 8 }]}>
          <TouchableOpacity
            style={[dm.doneBtn, { borderColor: accentColor, backgroundColor: accentColor + '22' }]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle" size={18} color={accentColor} />
            <Text style={[dm.doneText, { color: accentColor }]}>DONE — RETURN TO AGREEMENT</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main terms screen ────────────────────────────────────────────────────────

export default function TermsScreen() {
  const { acceptTerms, declineTerms } = useTerms();
  const insets = useSafeAreaInsets();

  const [privacyOpen,  setPrivacyOpen]  = useState(false);
  const [tosOpen,      setTosOpen]      = useState(false);
  const [privacySeen,  setPrivacySeen]  = useState(false);
  const [tosSeen,      setTosSeen]      = useState(false);
  const [checked,      setChecked]      = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false);

  const glowAnim = useRef(new Animated.Value(0.5)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1,   duration: 1400, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.5, duration: 1400, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const openPrivacy = () => { setPrivacyOpen(true); setPrivacySeen(true); };
  const openTos     = () => { setTosOpen(true);     setTosSeen(true);     };

  const bothSeen = privacySeen && tosSeen;
  const btnActive = bothSeen && checked;

  const handleAccept = async () => {
    if (!btnActive || loading) return;
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

  return (
    <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
      <Animated.View style={[s.container, { opacity: fadeAnim }]}>

        {/* Header */}
        <View style={s.header}>
          <Animated.Text style={[s.logo, { opacity: glowAnim }]}>CHIP SOCIETY</Animated.Text>
          <Text style={s.title}>TERMS {'&'} PRIVACY AGREEMENT</Text>
          <View style={s.metaRow}>
            <View style={s.badge}><Text style={s.badgeText}>v{TERMS_VERSION}</Text></View>
            <Text style={s.effectiveDate}>Effective {EFFECTIVE_DATE}</Text>
          </View>
          <View style={s.divider} />
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={[s.scrollContent, { paddingBottom: 8 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Intro */}
          <Text style={s.intro}>
            Before continuing, please review both documents below. You must open and read each one before you can agree and continue.
          </Text>

          {/* Privacy Policy button */}
          <TouchableOpacity
            style={[s.docBtn, privacySeen && s.docBtnSeen]}
            onPress={openPrivacy}
            activeOpacity={0.8}
          >
            <View style={s.docBtnLeft}>
              <View style={[s.docIcon, { backgroundColor: 'rgba(0,212,255,0.14)', borderColor: 'rgba(0,212,255,0.35)' }]}>
                <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.docBtnTitle}>PRIVACY POLICY</Text>
                <Text style={s.docBtnSub}>How we collect and protect your data</Text>
              </View>
            </View>
            <View style={s.docBtnRight}>
              {privacySeen
                ? <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                : <Text style={[s.viewLabel, { color: colors.primary }]}>VIEW</Text>
              }
            </View>
          </TouchableOpacity>

          {/* Terms of Service button */}
          <TouchableOpacity
            style={[s.docBtn, tosSeen && s.docBtnSeen, { marginTop: 10 }]}
            onPress={openTos}
            activeOpacity={0.8}
          >
            <View style={s.docBtnLeft}>
              <View style={[s.docIcon, { backgroundColor: 'rgba(255,0,144,0.12)', borderColor: 'rgba(255,0,144,0.35)' }]}>
                <Ionicons name="document-text" size={20} color={colors.secondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.docBtnTitle}>TERMS OF SERVICE</Text>
                <Text style={s.docBtnSub}>Rules, conduct, and your rights</Text>
              </View>
            </View>
            <View style={s.docBtnRight}>
              {tosSeen
                ? <Ionicons name="checkmark-circle" size={22} color={colors.secondary} />
                : <Text style={[s.viewLabel, { color: colors.secondary }]}>VIEW</Text>
              }
            </View>
          </TouchableOpacity>

          {/* Progress hint */}
          {!bothSeen && (
            <Text style={s.hint}>
              {!privacySeen && !tosSeen
                ? '↑ Open both documents to continue'
                : !privacySeen
                  ? '↑ Open the Privacy Policy to continue'
                  : '↑ Open the Terms of Service to continue'}
            </Text>
          )}

          {/* Acknowledgement block */}
          {bothSeen && (
            <View style={s.ackBox}>
              <View style={s.ackHeader}>
                <Ionicons name="information-circle" size={16} color="rgba(255,255,255,0.5)" />
                <Text style={s.ackHeaderText}>USER ACKNOWLEDGEMENT</Text>
              </View>
              <Text style={s.ackText}>
                By agreeing, you confirm that:{'\n\n'}
                • You are at least 17 years old.{'\n'}
                • You have read and agree to the Chip Society Privacy Policy.{'\n'}
                • You have read and agree to the Terms of Service.{'\n'}
                • You understand that Chip Society is a social poker entertainment platform using virtual currency only.{'\n'}
                • You understand that chips, virtual items, tournament prizes, Fortune Cookies, achievements, and all other in-game rewards have no real-world monetary value.{'\n'}
                • You agree to follow the Community Guidelines, Fair Play Policy, and all future updates to these Terms.
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Sticky footer */}
        <View style={[s.footer, { paddingBottom: Platform.OS === 'ios' ? 4 : 12 }]}>
          <View style={s.footerGlow} />

          {/* Checkbox */}
          <Pressable
            style={s.checkRow}
            onPress={() => bothSeen && setChecked(v => !v)}
            disabled={!bothSeen}
          >
            <View style={[s.checkbox, checked && s.checkboxChecked, !bothSeen && s.checkboxDisabled]}>
              {checked && <Text style={s.checkmark}>✓</Text>}
            </View>
            <Text style={[s.checkLabel, !bothSeen && { opacity: 0.3 }]}>
              I have read and agree to both the Privacy Policy and Terms of Service
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
            <Text style={[s.acceptText, !btnActive && { opacity: 0.35 }]}>
              {loading ? 'ENTERING CHIP SOCIETY...' : 'I AGREE & CONTINUE'}
            </Text>
          </Pressable>

          <Pressable style={s.declineBtn} onPress={handleDecline}>
            <Text style={s.declineText}>
              {showDeclineConfirm ? 'CONFIRM DECLINE' : 'DECLINE'}
            </Text>
          </Pressable>
        </View>
      </Animated.View>

      {/* Document modals */}
      <DocModal
        visible={privacyOpen}
        onClose={() => setPrivacyOpen(false)}
        title="PRIVACY POLICY"
        intro={PRIVACY_INTRO}
        sections={PRIVACY_SECTIONS}
        accentColor={colors.primary}
      />
      <DocModal
        visible={tosOpen}
        onClose={() => setTosOpen(false)}
        title="TERMS OF SERVICE"
        intro={TOS_INTRO}
        sections={TOS_SECTIONS}
        accentColor={colors.secondary}
      />
    </SafeAreaView>
  );
}

// ─── Doc modal styles ─────────────────────────────────────────────────────────

const dm = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: colors.background },
  header:       { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, gap: 12 },
  label:        { fontFamily: 'Orbitron_400Regular', fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: 4, marginBottom: 4 },
  title:        { fontFamily: 'Orbitron_700Bold', fontSize: 16, letterSpacing: 1.5 },
  closeBtn:     { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  headerDivider:{ height: 1, marginHorizontal: 20 },
  scroll:       { flex: 1 },
  scrollContent:{ paddingHorizontal: 20, paddingTop: 16 },
  metaRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  badge:        { borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText:    { fontFamily: 'Orbitron_400Regular', fontSize: 9, letterSpacing: 1 },
  dateText:     { fontFamily: 'Orbitron_400Regular', fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.5 },
  intro:        { fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 20, marginBottom: 20 },
  section:      { marginBottom: 22 },
  sectionHeader:{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  accent:       { width: 3, height: 16, borderRadius: 2 },
  sectionTitle: { fontFamily: 'Orbitron_700Bold', fontSize: 10, letterSpacing: 1.5, flex: 1 },
  sectionBody:  { fontSize: 13, color: 'rgba(255,255,255,0.62)', lineHeight: 21 },
  endMarker:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 20 },
  endLine:      { flex: 1, height: 1 },
  endText:      { fontFamily: 'Orbitron_400Regular', fontSize: 9, letterSpacing: 3 },
  contact:      { textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 8 },
  contactLink:  { textDecorationLine: 'underline' },
  footer:       { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  doneBtn:      { height: 48, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5 },
  doneText:     { fontFamily: 'Orbitron_700Bold', fontSize: 12, letterSpacing: 1.5 },
});

// ─── Main screen styles ───────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen:      { flex: 1, backgroundColor: colors.background },
  container:   { flex: 1 },

  header:      { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 0 },
  logo: {
    fontFamily: 'Orbitron_900Black',
    fontSize: 11, color: colors.secondary, letterSpacing: 6,
    textAlign: 'center', marginBottom: 4,
  },
  title: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 17, color: colors.primary, letterSpacing: 2,
    textAlign: 'center', marginBottom: 8,
  },
  metaRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 },
  badge: {
    backgroundColor: 'rgba(0,212,255,0.12)', borderRadius: 6,
    borderWidth: 1, borderColor: 'rgba(0,212,255,0.3)',
    paddingHorizontal: 8, paddingVertical: 2,
  },
  badgeText:   { fontFamily: 'Orbitron_400Regular', fontSize: 9, color: colors.primary, letterSpacing: 1 },
  effectiveDate:{ fontFamily: 'Orbitron_400Regular', fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 },
  divider:     { height: 1, backgroundColor: 'rgba(0,212,255,0.18)', marginBottom: 0 },

  scroll:      { flex: 1 },
  scrollContent:{ paddingHorizontal: 20, paddingTop: 16 },

  intro:       { fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 20, marginBottom: 18, textAlign: 'center' },

  docBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)', padding: 14, gap: 12,
  },
  docBtnSeen: { borderColor: 'rgba(0,212,255,0.35)', backgroundColor: 'rgba(0,212,255,0.06)' },
  docBtnLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  docBtnRight: { alignItems: 'center', justifyContent: 'center', minWidth: 40 },
  docIcon: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  docBtnTitle: { fontFamily: 'Orbitron_700Bold', fontSize: 11, color: '#fff', letterSpacing: 1.5, marginBottom: 3 },
  docBtnSub:   { fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 15 },
  viewLabel:   { fontFamily: 'Orbitron_700Bold', fontSize: 10, letterSpacing: 1 },

  hint: {
    textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.3)',
    fontFamily: 'Orbitron_400Regular', letterSpacing: 0.5, marginTop: 14,
  },

  ackBox: {
    marginTop: 18, borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 14, gap: 8,
  },
  ackHeader:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ackHeaderText:{ fontFamily: 'Orbitron_700Bold', fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: 2 },
  ackText:     { fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 19 },

  footer: {
    paddingHorizontal: 20, paddingTop: 12,
    backgroundColor: 'rgba(5,0,16,0.97)',
    borderTopWidth: 1, borderTopColor: 'rgba(0,212,255,0.2)',
    gap: 10, position: 'relative',
  },
  footerGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 1,
    backgroundColor: colors.primary,
    ...Platform.select({ ios: { shadowColor: colors.primary, shadowOpacity: 0.8, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } } }),
  },

  checkRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  checkbox: {
    width: 22, height: 22, borderRadius: 5, borderWidth: 1.5,
    borderColor: 'rgba(0,212,255,0.4)', backgroundColor: 'rgba(0,212,255,0.06)',
    alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  checkboxChecked:  { borderColor: colors.primary, backgroundColor: 'rgba(0,212,255,0.18)' },
  checkboxDisabled: { borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.03)' },
  checkmark:   { color: colors.primary, fontSize: 13, fontWeight: '900' },
  checkLabel:  { flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 18 },

  declineWarning: {
    backgroundColor: 'rgba(255,68,68,0.08)', borderRadius: 8,
    borderWidth: 1, borderColor: 'rgba(255,68,68,0.3)', padding: 10,
  },
  declineWarningText:{ fontSize: 12, color: 'rgba(255,120,120,0.9)', textAlign: 'center', lineHeight: 17 },

  acceptBtn: {
    height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,212,255,0.15)', borderWidth: 1.5, borderColor: colors.primary,
    overflow: 'hidden', position: 'relative',
  },
  acceptBtnDisabled: { borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.04)' },
  acceptGlow:  { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,212,255,0.12)' },
  acceptText:  { fontFamily: 'Orbitron_700Bold', fontSize: 13, letterSpacing: 2, color: colors.primary },

  declineBtn:  { alignItems: 'center', paddingVertical: 6 },
  declineText: { fontSize: 12, color: 'rgba(255,255,255,0.3)', letterSpacing: 1 },
});
