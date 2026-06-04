import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useUser } from '@/context/UserContext';
import { GuestBanner } from '@/components/GuestBanner';
import type { Colors } from '@/constants/colors';

// ─── Styles ───────────────────────────────────────────────────────────────────
function createStyles(c: Colors) {
  return StyleSheet.create({
    container:   { flex: 1, backgroundColor: c.background },
    scroll:      { paddingHorizontal: 16, gap: 16 },
    pageTitle: {
      color: c.text, fontSize: 22, fontWeight: '800',
      fontFamily: 'Orbitron_900Black', letterSpacing: 3,
    },
    pageSub: { color: c.textMuted, fontSize: 13, marginTop: -6 },

    modeCard: {
      borderRadius: 20, borderWidth: 1, overflow: 'hidden', padding: 20, gap: 14,
    },
    modeHeader:  { flexDirection: 'row', alignItems: 'center', gap: 14 },
    modeIconWrap: {
      width: 52, height: 52, borderRadius: 16, borderWidth: 1,
      alignItems: 'center', justifyContent: 'center',
    },
    modeTitle: {
      fontSize: 17, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 1,
    },
    modeSubtitle: { fontSize: 11, marginTop: 2 },
    modeDesc:  { fontSize: 12, lineHeight: 18 },

    modeBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      borderRadius: 14, paddingVertical: 14, gap: 8, overflow: 'hidden',
    },
    modeBtnText: {
      fontSize: 12, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 1,
    },

    lockedCard: { opacity: 0.72 },
    lockedBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      borderRadius: 14, paddingVertical: 14, gap: 8,
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
      backgroundColor: 'rgba(255,255,255,0.03)',
    },
    lockedBtnText: {
      fontSize: 11, fontWeight: '900', fontFamily: 'Orbitron_700Bold',
      letterSpacing: 1, color: 'rgba(255,255,255,0.22)',
    },
    soonPill: {
      borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3,
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    },
    soonText: {
      fontSize: 8, fontWeight: '800', letterSpacing: 1, color: 'rgba(255,255,255,0.28)',
    },
  });
}

// ─── Mode card ────────────────────────────────────────────────────────────────
interface ModeCardProps {
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  color: string;
  btnLabel: string;
  locked?: boolean;
  onPress?: () => void;
}

function ModeCard({ icon, title, subtitle, description, color, btnLabel, locked, onPress }: ModeCardProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.modeCard, locked && styles.lockedCard, {
      borderColor: `${color}${locked ? '28' : '44'}`,
      backgroundColor: `${color}09`,
    }]}>
      <LinearGradient
        colors={[`${color}16`, `${color}06`, 'transparent']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />

      {/* Header */}
      <View style={styles.modeHeader}>
        <View style={[styles.modeIconWrap, {
          backgroundColor: `${color}1a`,
          borderColor: `${color}44`,
        }]}>
          <Ionicons name={icon as any} size={26} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.modeTitle, { color }]}>{title}</Text>
          <Text style={[styles.modeSubtitle, { color: `${color}99` }]}>{subtitle}</Text>
        </View>
        {locked && (
          <View style={styles.soonPill}>
            <Text style={styles.soonText}>SOON</Text>
          </View>
        )}
      </View>

      <Text style={[styles.modeDesc, { color: colors.textMuted }]}>{description}</Text>

      {/* Action button */}
      {locked ? (
        <View style={styles.lockedBtn}>
          <Ionicons name="lock-closed-outline" size={14} color="rgba(255,255,255,0.2)" />
          <Text style={styles.lockedBtnText}>COMING SOON</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.modeBtn}
          onPress={onPress}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[color, `${color}bb`]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          />
          <Ionicons name="flash" size={16} color="#000" />
          <Text style={[styles.modeBtnText, { color: '#000' }]}>{btnLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────────
export default function PlayScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useUser();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const goQuickPlay = () => router.push('/game/practice?variant=texas_holdem' as any);

  const goRanked = () => {
    Alert.alert(
      'RANKED MODE',
      'Ranked matchmaking is launching in an upcoming update.\n\nYour stats are already being tracked — you will be placed based on your current record when ranked goes live.',
      [
        { text: 'PLAY QUICK MATCH', onPress: goQuickPlay },
        { text: 'OK', style: 'cancel' },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background, '#0a001e', colors.background]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />

      {profile.isGuest && (
        <GuestBanner message="Create a free account to save your stats and progress" />
      )}

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 16), paddingBottom: insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>PLAY</Text>
        <Text style={styles.pageSub}>Choose your game mode</Text>

        <ModeCard
          icon="flash"
          title="QUICK PLAY"
          subtitle="Texas Hold'em · AI opponents"
          description="Jump into a full table against AI players. Practice your strategy, improve your reads, and earn XP — available offline, anytime."
          color="#00d4ff"
          btnLabel="PLAY NOW"
          onPress={goQuickPlay}
        />

        <ModeCard
          icon="podium"
          title="RANKED"
          subtitle="Competitive matchmaking"
          description="Compete against real players for ranking points, seasonal leaderboard placement, and exclusive Ranked-only rewards."
          color="#ff0090"
          btnLabel="FIND MATCH"
          onPress={goRanked}
        />

        <ModeCard
          icon="trophy"
          title="TOURNAMENTS"
          subtitle="Prize pools · Brackets · Glory"
          description="Multi-table tournaments with structured blind levels, prize pools up to 2M chips, and final table prestige."
          color="#ffd700"
          btnLabel="COMING SOON"
          locked
        />
      </ScrollView>
    </View>
  );
}
