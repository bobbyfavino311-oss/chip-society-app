import React from 'react';
import {
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import colors from '@/constants/colors';

const EFFECTIVE_DATE = 'July 4, 2026';
const SUPPORT_EMAIL = 'support@chipsociety.app';

const SECTIONS = [
  {
    icon: 'dice' as const,
    color: colors.primary,
    title: 'RESPECT THE GAME',
    body: `Play fairly.\n\nDo not cheat, exploit bugs, collude with other players, use bots, or manipulate gameplay.`,
  },
  {
    icon: 'chatbubbles' as const,
    color: colors.secondary,
    title: 'SOCIAL FEATURES',
    body: `Chip Society allows players to communicate using text.\n\nPlayers are free to express themselves, including friendly banter and poker table trash talk.\n\nHowever, you may not use Chip Society to:\n\n• Threaten or encourage real-world violence.\n• Promote illegal activity.\n• Impersonate Chip Society staff.\n• Spam, scam, or repeatedly flood the platform.\n• Share another person's private or personal information without permission.\n\nChip Society does not allow images, videos, or file uploads within posts, comments, or private messages.`,
  },
  {
    icon: 'person-circle' as const,
    color: '#bf5fff',
    title: 'PLAYER ACCOUNTS',
    body: `Do not:\n\n• Sell accounts.\n• Share accounts.\n• Use multiple accounts to gain an unfair advantage.\n• Exploit bugs or glitches.`,
  },
  {
    icon: 'shield-checkmark' as const,
    color: '#00e887',
    title: 'FAIR PLAY',
    body: `Poker should be won through skill and strategy.\n\nThe use of cheats, automation, exploits, unauthorized software, chip dumping, collusion, or any attempt to gain an unfair advantage may result in account penalties, including permanent suspension.`,
  },
  {
    icon: 'warning' as const,
    color: '#ffaa00',
    title: 'ENFORCEMENT',
    body: `Violations of these Guidelines may result in:\n\n• Warning\n• Chat restriction\n• Suspension\n• Permanent account termination\n\nChip Society reserves the right to take action when necessary to protect the platform, its players, and the integrity of the game.`,
  },
  {
    icon: 'mail' as const,
    color: colors.primary,
    title: 'CONTACT',
    body: `Questions regarding these Community Guidelines may be directed to:\n\n${SUPPORT_EMAIL}`,
  },
];

export default function CommunityGuidelinesScreen() {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={s.screen} edges={['bottom']}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
          <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.overline}>CHIP SOCIETY</Text>
          <Text style={s.title}>COMMUNITY GUIDELINES</Text>
        </View>
      </View>
      <View style={s.headerDivider} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator
        indicatorStyle="white"
      >
        {/* Meta */}
        <View style={s.metaRow}>
          <View style={s.badge}><Text style={s.badgeText}>EFFECTIVE {EFFECTIVE_DATE}</Text></View>
        </View>

        {/* Intro */}
        <Text style={s.intro}>
          Welcome to Chip Society.{'\n\n'}
          Chip Society is built around competitive poker, social interaction, and fair play.{'\n\n'}
          By using Chip Society, you agree to follow these Community Guidelines.
        </Text>

        <View style={s.divider} />

        {SECTIONS.map((sec, i) => (
          <View key={i} style={s.section}>
            <View style={s.sectionHeader}>
              <View style={[s.iconWrap, { backgroundColor: sec.color + '22', borderColor: sec.color + '55' }]}>
                <Ionicons name={sec.icon} size={18} color={sec.color} />
              </View>
              <Text style={[s.sectionTitle, { color: sec.color }]}>{sec.title}</Text>
            </View>
            <View style={[s.sectionAccentLine, { backgroundColor: sec.color + '30' }]} />
            <Text style={s.sectionBody}>{sec.body}</Text>
            {i < SECTIONS.length - 1 && <View style={s.sectionDivider} />}
          </View>
        ))}

        {/* Footer contact */}
        <View style={s.contactBox}>
          <Ionicons name="mail-outline" size={16} color="rgba(255,255,255,0.3)" />
          <Text style={s.contactText}>
            Questions?{' '}
            <Text
              style={s.contactLink}
              onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
            >
              {SUPPORT_EMAIL}
            </Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 16, paddingBottom: 12, gap: 10,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  overline: {
    fontFamily: 'Orbitron_400Regular', fontSize: 9,
    color: 'rgba(255,255,255,0.3)', letterSpacing: 4, marginBottom: 3,
  },
  title: {
    fontFamily: 'Orbitron_700Bold', fontSize: 15,
    color: colors.primary, letterSpacing: 1.5,
  },
  headerDivider: { height: 1, backgroundColor: 'rgba(0,212,255,0.18)', marginHorizontal: 0 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 18 },

  metaRow: { flexDirection: 'row', marginBottom: 14 },
  badge: {
    backgroundColor: 'rgba(0,212,255,0.10)', borderRadius: 6,
    borderWidth: 1, borderColor: 'rgba(0,212,255,0.25)',
    paddingHorizontal: 10, paddingVertical: 3,
  },
  badgeText: { fontFamily: 'Orbitron_400Regular', fontSize: 9, color: colors.primary, letterSpacing: 1 },

  intro: { fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 21, marginBottom: 18 },

  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginBottom: 20 },

  section: { marginBottom: 4 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  iconWrap: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { fontFamily: 'Orbitron_700Bold', fontSize: 11, letterSpacing: 2, flex: 1 },
  sectionAccentLine: { height: 1, borderRadius: 1, marginBottom: 10 },
  sectionBody: { fontSize: 13, color: 'rgba(255,255,255,0.62)', lineHeight: 21, paddingLeft: 2 },
  sectionDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 20 },

  contactBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 24, padding: 14, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  contactText: { fontSize: 12, color: 'rgba(255,255,255,0.35)', flex: 1 },
  contactLink: { color: colors.primary, textDecorationLine: 'underline' },
});
