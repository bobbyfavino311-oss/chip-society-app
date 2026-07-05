import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
import {
  Alert,
  Animated,
  Image,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import ChipAmount from '@/components/ChipAmount';
import colors from '@/constants/colors';
import { useUser, getXPForLevel } from '@/context/UserContext';
import { useColors } from '@/hooks/useColors';
import NeonAvatar from '@/components/NeonAvatar';
import BugReportModal from '@/components/BugReportModal';
import { useSoundSettings } from '@/context/SoundContext';
import { useAchievements, achievementCompletion } from '@/context/AchievementContext';
import { useSocial } from '@/context/SocialContext';
import { useTableTheme } from '@/context/TableThemeContext';
import { ALL_ACHIEVEMENTS } from '@/lib/achievements';

const RANK_COLORS: Record<string, string> = {
  'LOCAL':              'rgba(255,255,255,0.45)',
  'PLAYER':             '#00e887',
  'HIGH ROLLER':        '#00d4ff',
  'VIP':                '#00b8e6',
  'EXECUTIVE':          '#a0a8c0',
  'KINGPIN':            colors.gold,
  'CARTEL':             '#ffaa00',
  'SYNDICATE':          '#ff7700',
  'EMPIRE':             colors.secondary,
  'DYNASTY':            '#d070ff',
  'LEGEND':             colors.accent,
  'IMMORTAL':           '#ff5fff',
  'VICE ROYALTY':       '#ff2090',
  'CHIP SOCIETY ELITE': colors.accent,
};

type RankTheme = {
  cardBorder: string;
  gradColors: [string, string, string];
  numColor: string;
  barStart: string;
  barMid: string;
  barEnd: string;
  glowColor: string;
};
function getLevelCardTheme(rank: string): RankTheme {
  if (rank === 'CHIP SOCIETY ELITE') return { cardBorder:'#ffd700', gradColors:['rgba(255,215,0,0.18)','rgba(0,212,255,0.10)','transparent'], numColor:'#ffd700', barStart:'#ffd700', barMid:'#00d4ff', barEnd:'#ff0090', glowColor:'rgba(255,215,0,0.5)' };
  if (rank === 'VICE ROYALTY')       return { cardBorder:'#ff2090', gradColors:['rgba(255,32,144,0.20)','rgba(191,95,255,0.08)','transparent'], numColor:'#ff2090', barStart:'#ff2090', barMid:'#bf5fff', barEnd:'#7700ff', glowColor:'rgba(255,32,144,0.5)' };
  if (rank === 'IMMORTAL')           return { cardBorder:'#ff5fff', gradColors:['rgba(255,95,255,0.18)','rgba(255,0,144,0.06)','transparent'], numColor:'#ff5fff', barStart:'#ff5fff', barMid:'#ff0090', barEnd:'#bf5fff', glowColor:'rgba(255,95,255,0.5)' };
  if (rank === 'LEGEND')             return { cardBorder:'#00d4ff', gradColors:['rgba(0,212,255,0.16)','rgba(191,95,255,0.08)','transparent'], numColor:'#00d4ff', barStart:'#00d4ff', barMid:'#bf5fff', barEnd:'#ff0090', glowColor:'rgba(0,212,255,0.5)' };
  if (rank === 'DYNASTY')            return { cardBorder:'#d070ff', gradColors:['rgba(208,112,255,0.18)','rgba(119,0,255,0.08)','transparent'], numColor:'#d070ff', barStart:'#d070ff', barMid:'#bf5fff', barEnd:'#7700ff', glowColor:'rgba(208,112,255,0.5)' };
  if (rank === 'EMPIRE')             return { cardBorder:'#bf5fff', gradColors:['rgba(191,95,255,0.18)','rgba(119,0,255,0.08)','transparent'], numColor:'#bf5fff', barStart:'#ff0090', barMid:'#bf5fff', barEnd:'#7700ff', glowColor:'rgba(191,95,255,0.5)' };
  if (rank === 'SYNDICATE')          return { cardBorder:'#ff7700', gradColors:['rgba(255,119,0,0.16)','rgba(255,165,0,0.06)','transparent'], numColor:'#ff9900', barStart:'#ff7700', barMid:'#ffaa00', barEnd:'#ffd700', glowColor:'rgba(255,119,0,0.5)' };
  if (rank === 'CARTEL')             return { cardBorder:'#ffaa00', gradColors:['rgba(255,170,0,0.16)','rgba(255,215,0,0.06)','transparent'], numColor:'#ffaa00', barStart:'#ff7700', barMid:'#ffaa00', barEnd:'#ffd700', glowColor:'rgba(255,170,0,0.5)' };
  if (rank === 'KINGPIN')            return { cardBorder:'#ffd700', gradColors:['rgba(255,215,0,0.14)','rgba(255,170,0,0.06)','transparent'], numColor:'#ffd700', barStart:'#ffaa00', barMid:'#ffd700', barEnd:'#fff0a0', glowColor:'rgba(255,215,0,0.5)' };
  return { cardBorder:'#00d4ff', gradColors:['rgba(0,212,255,0.10)','rgba(255,0,144,0.06)','transparent'], numColor:'#00d4ff', barStart:'#ff0090', barMid:'#bf5fff', barEnd:'#00d4ff', glowColor:'rgba(0,212,255,0.4)' };
}

// ─── Neon section title ─────────────────────────────────────────────────────
function NeonSectionTitle({ label, color = '#00d4ff88' }: { label: string; color?: string }) {
  return (
    <View style={{ gap: 5, marginTop: 6 }}>
      <Text style={[styles.sectionTitle, { color: 'rgba(255,255,255,0.45)', letterSpacing: 3 }]}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ width: 28, height: 1, backgroundColor: color, borderRadius: 1 }} />
        <View style={{ width: 8, height: 1, backgroundColor: color, opacity: 0.4, borderRadius: 1 }} />
      </View>
    </View>
  );
}

// ─── Neon stat box ──────────────────────────────────────────────────────────
function formatBigNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function NeonStatBox({ label, value, accentColor }: { label: string; value: string | number; accentColor: string }) {
  return (
    <View style={[neonStat.box, { borderColor: accentColor + '35' }]}>
      <LinearGradient
        colors={[accentColor + '14', 'transparent']}
        style={StyleSheet.absoluteFill}
      />
      <Text style={[neonStat.value, { color: accentColor }]}>{value}</Text>
      <Text style={neonStat.label}>{label}</Text>
    </View>
  );
}
const neonStat = StyleSheet.create({
  box: {
    flex: 1, alignItems: 'center', paddingVertical: 11,
    backgroundColor: 'rgba(5,0,16,0.85)',
    borderRadius: 12, borderWidth: 1, overflow: 'hidden', gap: 3,
  },
  value: { fontSize: 21, fontWeight: '900', fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  label: { color: 'rgba(255,255,255,0.3)', fontSize: 7, letterSpacing: 2, fontFamily: 'Orbitron_400Regular', marginTop: 1 },
});


const snd = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  rowLabel: {
    flex: 1,
    fontFamily: 'Orbitron_400Regular',
    fontSize: 10,
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 1.5,
  },
  toggle: {
    width: 38,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleOn: {
    backgroundColor: 'rgba(0,212,255,0.18)',
    borderColor: 'rgba(0,212,255,0.45)',
  },
  toggleKnob: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  toggleKnobOn: {
    backgroundColor: '#00d4ff',
    alignSelf: 'flex-end',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  sliderLabel: {
    fontFamily: 'Orbitron_400Regular',
    fontSize: 9,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
    width: 90,
  },
  dotsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  dotActive: {
    backgroundColor: '#00d4ff',
  },
  sliderPct: {
    fontFamily: 'Orbitron_400Regular',
    fontSize: 9,
    color: 'rgba(0,212,255,0.7)',
    width: 30,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 4,
  },
});

// ─── Sound settings card ───────────────────────────────────────────────────────

function SoundSettingsCard() {
  const { masterVolume, effectsVolume, isMuted, isVibrationEnabled,
          setMasterVolume, setEffectsVolume, toggleMute, toggleVibration,
          musicVolume, isMusicMuted, setMusicVolume, toggleMusicMute } = useSoundSettings();

  const Row = ({ label, value, onToggle, icon }: {
    label: string; value: boolean; onToggle: () => void; icon: string;
  }) => (
    <TouchableOpacity style={snd.row} onPress={onToggle} activeOpacity={0.8}>
      <Ionicons name={icon as 'volume-high'} size={16} color={value ? '#00d4ff' : 'rgba(255,255,255,0.3)'} />
      <Text style={[snd.rowLabel, !value && { color: 'rgba(255,255,255,0.3)' }]}>{label}</Text>
      <View style={[snd.toggle, value && snd.toggleOn]}>
        <View style={[snd.toggleKnob, value && snd.toggleKnobOn]} />
      </View>
    </TouchableOpacity>
  );

  const SliderRow = ({ label, value, onChange, disabled }: {
    label: string; value: number; onChange: (v: number) => void; disabled?: boolean;
  }) => {
    const steps = [0, 0.25, 0.5, 0.75, 1];
    return (
      <View style={snd.sliderRow}>
        <Text style={[snd.sliderLabel, disabled && { opacity: 0.35 }]}>{label}</Text>
        <View style={snd.dotsRow}>
          {steps.map(s => (
            <TouchableOpacity
              key={s}
              disabled={disabled}
              onPress={() => onChange(s)}
              style={[snd.dot, value >= s && !disabled && snd.dotActive]}
            />
          ))}
        </View>
        <Text style={[snd.sliderPct, disabled && { opacity: 0.35 }]}>{Math.round(value * 100)}%</Text>
      </View>
    );
  };

  return (
    <View>
      <Text style={styles.sectionTitle}>AUDIO & HAPTICS</Text>
      <View style={styles.card}>
        <Row label="Sound Effects" value={!isMuted} onToggle={toggleMute}
          icon={isMuted ? 'volume-mute' : 'volume-high'} />
        <SliderRow label="Master Volume" value={masterVolume} onChange={setMasterVolume} disabled={isMuted} />
        <SliderRow label="Effects Volume" value={effectsVolume} onChange={setEffectsVolume} disabled={isMuted} />
        <View style={snd.divider} />
        <Row label="Table Music" value={!isMusicMuted} onToggle={toggleMusicMute}
          icon={isMusicMuted ? 'musical-note-outline' : 'musical-notes'} />
        <SliderRow label="Music Volume" value={musicVolume} onChange={setMusicVolume} disabled={isMusicMuted} />
        <View style={snd.divider} />
        <Row label="Vibration / Haptics" value={isVibrationEnabled} onToggle={toggleVibration}
          icon={isVibrationEnabled ? 'phone-portrait' : 'phone-portrait-outline'} />
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const { profile, updateProfile, winRate, signOut } = useUser();
  const { unlockedIds } = useAchievements();
  const { following } = useSocial();
  const socialFollowingCount = following.size;
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.username);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showBugReport, setShowBugReport] = useState(false);

  const claimedCount = achievementCompletion(unlockedIds);
  const { theme: tableTheme } = useTableTheme();

  const rankColor   = RANK_COLORS[profile.rank] ?? c.primary;
  const cardTheme   = getLevelCardTheme(profile.rank);
  const thisLevelXP = getXPForLevel(profile.level);
  const nextLevelXP = getXPForLevel(profile.level + 1);
  const xpProgress  = nextLevelXP > thisLevelXP
    ? Math.min(1, (profile.xp - thisLevelXP) / (nextLevelXP - thisLevelXP))
    : 1;

  // Glow pulse animation for level card
  const glowAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2200, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const saveName = async () => {
    if (name.trim().length === 0) return;
    await updateProfile({ username: name.trim() });
    setEditing(false);
  };

  const pickAvatar = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow photo library access to set an avatar.');
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      await updateProfile({ avatarUri: result.assets[0].uri });
    }
  };

  // Tournament stats derived values
  const hasTournamentData = profile.tournamentsPlayed > 0;
  const tournamentTotal = profile.tournamentsPlayed;
  const tournamentWinRate = tournamentTotal > 0
    ? Math.round((profile.tournamentWins / tournamentTotal) * 100)
    : 0;
  const tournamentProfit = profile.totalTournamentPrizesWon - profile.tournamentBuyInsSpent;
  const tournamentRoi = profile.tournamentBuyInsSpent > 0
    ? Math.round((tournamentProfit / profile.tournamentBuyInsSpent) * 100)
    : 0;

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <LinearGradient
        colors={[c.background, c.surfaceElevated, c.background]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 16), paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Text style={styles.header}>PLAYER PROFILE</Text>
          <TouchableOpacity style={styles.inboxBtn} onPress={() => router.push('/inbox')}>
            <Ionicons name="chatbubbles-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.avatarSection}>
          <View style={{ position: 'relative' }}>
            <TouchableOpacity
              onPress={() => router.push('/profile/photo-select')}
              activeOpacity={0.85}
            >
              {profile.profileImageType === 'custom' && profile.avatarUri ? (
                <View style={[styles.avatar, { borderColor: rankColor, shadowColor: rankColor }]}>
                  <Image source={{ uri: profile.avatarUri }} style={styles.avatarImage} />
                </View>
              ) : (
                <NeonAvatar
                  avatarId={profile.symbolIndex && profile.symbolIndex > 0 ? profile.symbolIndex : 1}
                  size={90}
                  isEquipped
                />
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.changeAvatarBtn} onPress={() => router.push('/profile/photo-select')}>
              <Ionicons name="color-palette" size={13} color="#050010" />
            </TouchableOpacity>
          </View>

          {editing ? (
            <View style={styles.editRow}>
              <TextInput
                style={styles.nameInput}
                value={name}
                onChangeText={setName}
                maxLength={20}
                autoFocus
                placeholderTextColor={c.textDim}
                selectionColor={c.primary}
              />
              <TouchableOpacity style={styles.saveBtn} onPress={saveName}>
                <Ionicons name="checkmark" size={20} color={c.primary} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.nameRow} onPress={() => setEditing(true)}>
              <Text style={[styles.username, { color: cardTheme.numColor, textShadowColor: cardTheme.glowColor, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 }]}>
                {profile.username}
              </Text>
              {profile.isFounder && (
                <View style={styles.founderBadge}>
                  <Text style={styles.founderBadgeText}>👑 FOUNDER</Text>
                </View>
              )}
              <Ionicons name="pencil" size={12} color={`${cardTheme.numColor}88`} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          )}

          <View style={[styles.rankBadge, { borderColor: cardTheme.cardBorder + '80', backgroundColor: cardTheme.cardBorder + '14' }]}>
            <Text style={[styles.rankText, { color: cardTheme.cardBorder, letterSpacing: 2.5 }]}>{profile.rank}</Text>
          </View>

        </View>

        {/* ── Level hero card — neon VIP card ────────────────── */}
        <Animated.View style={[
          styles.levelCard,
          {
            borderColor: cardTheme.cardBorder + '70',
            shadowColor: cardTheme.cardBorder,
            shadowOpacity: glowAnim.interpolate({ inputRange: [0,1], outputRange: [0.25, 0.6] }) as unknown as number,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 0 },
            elevation: 12,
          }
        ]}>
          <LinearGradient
            colors={cardTheme.gradColors}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          />

          {/* Corner accent lines */}
          <View style={{ position: 'absolute', top: 0, left: 0, width: 20, height: 2, backgroundColor: cardTheme.cardBorder, opacity: 0.7, borderTopLeftRadius: 14 }} />
          <View style={{ position: 'absolute', top: 0, left: 0, width: 2, height: 20, backgroundColor: cardTheme.cardBorder, opacity: 0.7, borderTopLeftRadius: 14 }} />
          <View style={{ position: 'absolute', bottom: 0, right: 0, width: 20, height: 2, backgroundColor: cardTheme.barEnd, opacity: 0.5, borderBottomRightRadius: 14 }} />
          <View style={{ position: 'absolute', bottom: 0, right: 0, width: 2, height: 20, backgroundColor: cardTheme.barEnd, opacity: 0.5, borderBottomRightRadius: 14 }} />

          <View style={styles.levelHeroRow}>
            {/* Big level number */}
            <View style={{ alignItems: 'center', justifyContent: 'center', width: 72 }}>
              <Text style={[styles.levelHeroNumber, { color: cardTheme.numColor, textShadowColor: cardTheme.glowColor, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 16 }]}>
                {profile.level}
              </Text>
              <Text style={{ fontSize: 7, fontFamily: 'Orbitron_400Regular', color: `${cardTheme.numColor}70`, letterSpacing: 2, marginTop: -4 }}>LEVEL</Text>
            </View>

            {/* Divider */}
            <View style={{ width: 1, height: 48, backgroundColor: `${cardTheme.cardBorder}30` }} />

            <View style={styles.levelHeroMeta}>
              {/* Rank */}
              <Text style={[styles.levelHeroRank, { color: cardTheme.numColor, textShadowColor: cardTheme.glowColor, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 }]}>
                {profile.rank}
              </Text>

              {/* Neon gradient progress bar */}
              <View style={styles.levelProgressRow}>
                <View style={styles.levelProgressTrack}>
                  <LinearGradient
                    colors={[cardTheme.barStart, cardTheme.barMid, cardTheme.barEnd]}
                    style={[styles.levelProgressFill, { width: `${Math.round(xpProgress * 100)}%` }]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  />
                </View>
                <Text style={[styles.levelProgressPct, { color: cardTheme.numColor + 'cc' }]}>
                  {Math.round(xpProgress * 100)}%
                </Text>
              </View>

              {/* Progress label */}
              <Text style={[styles.levelProgressSub, { color: `${cardTheme.barEnd}60`, letterSpacing: 2 }]}>
                NEXT LEVEL {profile.level + 1}
              </Text>
            </View>
          </View>
        </Animated.View>

        <NeonSectionTitle label="STATISTICS" color={`${cardTheme.barMid}aa`} />
        <View style={styles.statsGrid}>
          <NeonStatBox label="WIN RATE"  value={`${winRate}%`}         accentColor="#ff0090" />
          <NeonStatBox label="HANDS"     value={profile.handsPlayed}   accentColor="#00d4ff" />
        </View>
        <View style={styles.statsGrid}>
          <NeonStatBox label="WINS"      value={profile.wins}          accentColor="#ffd700" />
          <NeonStatBox label="LOSSES"    value={profile.losses}        accentColor="#ff4466" />
        </View>
        <View style={styles.statsGrid}>
          <NeonStatBox label="COOKIES OPENED" value={profile.cookiesOpened} accentColor="#D4A017" />
          <NeonStatBox label="XP"              value={profile.xp.toLocaleString()} accentColor="#bf5fff" />
        </View>

        {/* Tournament stats section — live */}
        <NeonSectionTitle label="TOURNAMENTS" color="rgba(191,95,255,0.8)" />
        <View style={styles.tournamentCard}>
          <LinearGradient
            colors={['rgba(191,95,255,0.08)', 'transparent']}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.tournamentRow}>
            <View style={styles.tournamentStat}>
              <Text style={[styles.tournamentValue, { color: '#ffd700' }]}>
                {profile.tournamentWins}
              </Text>
              <Text style={styles.tournamentLabel}>WINS</Text>
            </View>
            <View style={styles.tournamentDivider} />
            <View style={styles.tournamentStat}>
              <Text style={[styles.tournamentValue, { color: '#ff4466' }]}>
                {profile.tournamentLosses}
              </Text>
              <Text style={styles.tournamentLabel}>LOSSES</Text>
            </View>
            <View style={styles.tournamentDivider} />
            <View style={styles.tournamentStat}>
              <Text style={[styles.tournamentValue, { color: '#00d4ff' }]}>
                {tournamentTotal > 0 ? `${tournamentWinRate}%` : '--'}
              </Text>
              <Text style={styles.tournamentLabel}>WIN RATE</Text>
            </View>
          </View>

          <View style={styles.tournamentDividerH} />

          <View style={styles.tournamentRow}>
            <View style={styles.tournamentStat}>
              <Text style={[styles.tournamentValue, { color: '#00d4ff' }]}>
                {tournamentTotal}
              </Text>
              <Text style={styles.tournamentLabel}>ENTERED</Text>
            </View>
            <View style={styles.tournamentDivider} />
            <View style={styles.tournamentStat}>
              <Text style={[styles.tournamentValue, { color: '#bf5fff' }]}>
                {profile.bestTournamentFinish > 0 ? `#${profile.bestTournamentFinish}` : '--'}
              </Text>
              <Text style={styles.tournamentLabel}>BEST FINISH</Text>
            </View>
            <View style={styles.tournamentDivider} />
            <View style={styles.tournamentStat}>
              <Text style={[styles.tournamentValue, { color: '#00ff88', fontSize: 16 }]}>
                {profile.biggestTournamentPrize > 0
                  ? profile.biggestTournamentPrize >= 1_000_000
                    ? `${(profile.biggestTournamentPrize / 1_000_000).toFixed(1)}M`
                    : profile.biggestTournamentPrize >= 1_000
                      ? `${(profile.biggestTournamentPrize / 1_000).toFixed(0)}K`
                      : `${profile.biggestTournamentPrize}`
                  : '--'}
              </Text>
              <Text style={styles.tournamentLabel}>BEST PRIZE</Text>
            </View>
          </View>

          <View style={styles.tournamentDividerH} />

          <View style={styles.tournamentRow}>
            <View style={styles.tournamentStat}>
              <Text style={[styles.tournamentValue, { color: '#00d4ff' }]}>
                {profile.tournamentFinalTables}
              </Text>
              <Text style={styles.tournamentLabel}>FINAL TABLES</Text>
            </View>
            <View style={styles.tournamentDivider} />
            <View style={styles.tournamentStat}>
              <Text style={[styles.tournamentValue, { color: '#ffd700' }]}>
                {profile.itmFinishes}
              </Text>
              <Text style={styles.tournamentLabel}>ITM</Text>
            </View>
            <View style={styles.tournamentDivider} />
            <View style={styles.tournamentStat}>
              <Text style={[styles.tournamentValue, {
                color: tournamentProfit >= 0 ? '#00ff88' : '#ff4466', fontSize: 16,
              }]}>
                {tournamentProfit >= 0 ? '+' : '-'}{formatBigNumber(Math.abs(tournamentProfit))}
              </Text>
              <Text style={styles.tournamentLabel}>
                PROFIT{profile.tournamentBuyInsSpent > 0 ? ` · ${tournamentRoi >= 0 ? '+' : ''}${tournamentRoi}% ROI` : ''}
              </Text>
            </View>
          </View>

          {!hasTournamentData && (
            <View style={styles.tournamentEmpty}>
              <Ionicons name="trophy-outline" size={18} color="rgba(191,95,255,0.3)" />
              <Text style={styles.tournamentEmptyText}>
                Enter a tournament to start tracking your record
              </Text>
            </View>
          )}
        </View>

        <NeonSectionTitle label="SOCIAL" color="rgba(0,212,255,0.8)" />
        <View style={styles.statsGrid}>
          <NeonStatBox label="FOLLOWING"    value={socialFollowingCount} accentColor="#4488ff" />
          <NeonStatBox label="ACHIEVEMENTS" value={`${unlockedIds.size} / ${ALL_ACHIEVEMENTS.length}`} accentColor="#bf5fff" />
        </View>

        <NeonSectionTitle label="CHIP BALANCE" color="rgba(255,215,0,0.8)" />
        <View style={styles.chipCard}>
          <LinearGradient
            colors={['rgba(255,215,0,0.1)', 'transparent']}
            style={StyleSheet.absoluteFill}
          />
          <ChipAmount
            amount={profile.chips}
            variant={profile.chips < 5_000 ? 'red' : profile.chips < 30_000 ? 'gold' : 'green'}
            size="xl"
          />
          <Text style={styles.chipLabel}>VIRTUAL CHIPS</Text>
        </View>

        {/* Buy chips — navigates to the Chip Store (same packages as the Store tab) */}
        <TouchableOpacity
          style={styles.buyChipsBtn}
          activeOpacity={0.8}
          onPress={() => router.push('/(tabs)/store')}
        >
          <LinearGradient
            colors={['#00d4ff22', '#00d4ff11']}
            style={styles.buyChipsBtnGrad}
          >
            <Text style={styles.buyChipsIcon}>💎</Text>
            <Text style={styles.buyChipsTxt}>BUY CHIPS</Text>
          </LinearGradient>
        </TouchableOpacity>

        <SoundSettingsCard />

        {/* Table Themes */}
        <TouchableOpacity
          style={achStyles.row}
          activeOpacity={0.8}
          onPress={() => router.push('/settings/table-themes')}
        >
          <LinearGradient
            colors={tableTheme.id === 'dragon_fortune'
              ? ['rgba(200,155,60,0.12)', 'transparent']
              : ['rgba(0,212,255,0.10)', 'transparent']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          />
          <View style={[achStyles.iconWrap, {
            backgroundColor: tableTheme.id === 'dragon_fortune'
              ? 'rgba(200,155,60,0.12)' : 'rgba(0,212,255,0.10)',
          }]}>
            <View style={{ flexDirection: 'row', gap: 3, padding: 2 }}>
              {tableTheme.previewColors.map((col, i) => (
                <View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: col }} />
              ))}
            </View>
          </View>
          <View style={achStyles.achInfo}>
            <Text style={achStyles.achLabel}>TABLE THEMES</Text>
            <Text style={achStyles.achSub}>{tableTheme.name} · {tableTheme.rarity}</Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={tableTheme.id === 'dragon_fortune' ? 'rgba(200,155,60,0.6)' : 'rgba(0,212,255,0.5)'}
          />
        </TouchableOpacity>

        {/* Achievements link */}
        <TouchableOpacity
          style={achStyles.row}
          activeOpacity={0.8}
          onPress={() => router.push('/achievements')}
        >
          <LinearGradient
            colors={['rgba(191,95,255,0.12)', 'transparent']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          />
          <View style={achStyles.iconWrap}>
            <Text style={achStyles.icon}>🏆</Text>
          </View>
          <View style={achStyles.achInfo}>
            <Text style={achStyles.achLabel}>ACHIEVEMENTS</Text>
            <Text style={achStyles.achSub}>{unlockedIds.size} / {ALL_ACHIEVEMENTS.length} unlocked · {claimedCount}% complete</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="rgba(191,95,255,0.7)" />
        </TouchableOpacity>

        {/* Change PIN */}
        <TouchableOpacity
          style={achStyles.row}
          activeOpacity={0.8}
          onPress={() => router.push('/profile/change-pin')}
        >
          <LinearGradient
            colors={['rgba(0,212,255,0.10)', 'transparent']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          />
          <View style={[achStyles.iconWrap, { backgroundColor: 'rgba(0,212,255,0.10)' }]}>
            <Ionicons name="keypad-outline" size={20} color="rgba(0,212,255,0.85)" />
          </View>
          <View style={achStyles.achInfo}>
            <Text style={achStyles.achLabel}>CHANGE PIN</Text>
            <Text style={achStyles.achSub}>Update your 4-digit account PIN</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="rgba(0,212,255,0.5)" />
        </TouchableOpacity>

        {/* Invite Friends */}
        <TouchableOpacity
          style={achStyles.row}
          activeOpacity={0.8}
          onPress={async () => {
            try {
              await Share.share({
                message: `Join me on Chip Society! Use my invite code "${profile.username}" when you sign up and we'll both get a bonus chip stack. 🎰`,
              });
            } catch { /* user dismissed the share sheet — nothing to do */ }
          }}
        >
          <LinearGradient
            colors={['rgba(255,0,144,0.10)', 'transparent']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          />
          <View style={[achStyles.iconWrap, { backgroundColor: 'rgba(255,0,144,0.10)' }]}>
            <Ionicons name="share-social-outline" size={20} color="rgba(255,0,144,0.85)" />
          </View>
          <View style={achStyles.achInfo}>
            <Text style={achStyles.achLabel}>INVITE FRIENDS</Text>
            <Text style={achStyles.achSub}>Share your code · earn bonus chips together</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="rgba(255,0,144,0.5)" />
        </TouchableOpacity>

        {/* Community Guidelines */}
        <TouchableOpacity
          style={achStyles.row}
          activeOpacity={0.8}
          onPress={() => router.push('/community-guidelines')}
        >
          <LinearGradient
            colors={['rgba(0,232,135,0.10)', 'transparent']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          />
          <View style={[achStyles.iconWrap, { backgroundColor: 'rgba(0,232,135,0.10)' }]}>
            <Ionicons name="shield-checkmark-outline" size={20} color="rgba(0,232,135,0.85)" />
          </View>
          <View style={achStyles.achInfo}>
            <Text style={achStyles.achLabel}>COMMUNITY GUIDELINES</Text>
            <Text style={achStyles.achSub}>Fair play, conduct {'&'} platform rules</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="rgba(0,232,135,0.5)" />
        </TouchableOpacity>

        {/* Report a Bug */}
        <TouchableOpacity
          style={achStyles.row}
          activeOpacity={0.8}
          onPress={() => setShowBugReport(true)}
        >
          <LinearGradient
            colors={['rgba(255,100,50,0.10)', 'transparent']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          />
          <View style={[achStyles.iconWrap, { backgroundColor: 'rgba(255,100,50,0.10)' }]}>
            <Ionicons name="bug-outline" size={20} color="rgba(255,120,60,0.85)" />
          </View>
          <View style={achStyles.achInfo}>
            <Text style={achStyles.achLabel}>REPORT A BUG</Text>
            <Text style={achStyles.achSub}>Help us squash issues · goes to dev team</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="rgba(255,120,60,0.5)" />
        </TouchableOpacity>

        <NeonSectionTitle label="STREAK" color="rgba(255,150,50,0.8)" />
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Ionicons name="flame" size={32} color={c.warning} />
            <View>
              <Text style={styles.streakNum}>{profile.streakDays} Day Streak</Text>
              <Text style={styles.streakSub}>Login daily for bonus chips!</Text>
            </View>
          </View>
        </View>

        {/* Sign out */}
        <TouchableOpacity
          style={achStyles.signOutBtn}
          activeOpacity={0.8}
          onPress={() => setShowSignOutModal(true)}
        >
          <Ionicons name="log-out-outline" size={18} color="#ff4466" />
          <Text style={achStyles.signOutText}>SIGN OUT</Text>
        </TouchableOpacity>

      </ScrollView>

      <BugReportModal visible={showBugReport} onClose={() => setShowBugReport(false)} />

      {/* Sign-out confirmation modal */}
      <Modal
        visible={showSignOutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSignOutModal(false)}
      >
        <View style={achStyles.overlay}>
          <View style={achStyles.modalCard}>
            <Text style={achStyles.modalTitle}>SIGN OUT?</Text>
            <Text style={achStyles.modalBody}>Your progress is saved. You can sign back in at any time.</Text>
            <View style={achStyles.modalBtns}>
              <TouchableOpacity
                style={achStyles.cancelBtn}
                onPress={() => setShowSignOutModal(false)}
              >
                <Text style={achStyles.cancelText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={achStyles.confirmBtn}
                onPress={async () => {
                  setShowSignOutModal(false);
                  await signOut();
                }}
              >
                <Text style={achStyles.confirmText}>SIGN OUT</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const tiStyles = StyleSheet.create({
  subhead: {
    fontSize: 8, fontWeight: '800', fontFamily: 'Orbitron_700Bold',
    color: 'rgba(191,95,255,0.7)', letterSpacing: 1.5, marginBottom: 10,
  },
  bullet: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 7 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(191,95,255,0.6)' },
  bulletText: { fontSize: 11, color: 'rgba(255,255,255,0.75)', fontFamily: 'Inter_400Regular', flex: 1 },
});

const achStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(191,95,255,0.25)',
    backgroundColor: 'rgba(191,95,255,0.05)',
    padding: 16,
    overflow: 'hidden',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(191,95,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(191,95,255,0.3)',
  },
  icon: { fontSize: 22 },
  achInfo: { flex: 1 },
  achLabel: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 11,
    color: '#bf5fff',
    letterSpacing: 2,
  },
  achSub: {
    fontFamily: 'Orbitron_400Regular',
    fontSize: 9,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,68,102,0.3)',
    backgroundColor: 'rgba(255,68,102,0.06)',
    paddingVertical: 14,
    marginTop: 4,
    marginBottom: 8,
  },
  signOutText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 12,
    color: '#ff4466',
    letterSpacing: 2,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#09001e',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255,68,102,0.3)',
    padding: 28,
    width: '100%',
    maxWidth: 340,
    gap: 14,
  },
  modalTitle: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 18,
    color: '#ff4466',
    letterSpacing: 3,
    textAlign: 'center',
  },
  modalBody: {
    fontFamily: 'Orbitron_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 18,
    letterSpacing: 0.5,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1.5,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,68,102,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,68,102,0.5)',
    alignItems: 'center',
  },
  confirmText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 11,
    color: '#ff4466',
    letterSpacing: 1.5,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: 16, gap: 10 },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 8,
  },
  inboxBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: `${colors.primary}18`,
    borderWidth: 1, borderColor: `${colors.primary}40`,
    alignItems: 'center', justifyContent: 'center',
  },
  header: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 18,
    color: colors.primary,
    letterSpacing: 3,
    textAlign: 'center',
    flex: 1,
  },
  avatarSection: { alignItems: 'center', gap: 6 },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.surface,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 8,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  avatarText: { fontSize: 34, fontWeight: '700' },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  founderBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.12)', borderRadius: 6, borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.40)', paddingHorizontal: 6, paddingVertical: 2,
  },
  founderBadgeText: {
    color: '#FFD700', fontSize: 8, fontFamily: 'Orbitron_700Bold', letterSpacing: 1,
  },
  username: { color: colors.text, fontSize: 17, fontWeight: '700', fontFamily: 'Orbitron_700Bold' },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nameInput: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingVertical: 4,
    paddingHorizontal: 4,
    minWidth: 150,
  },
  saveBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
    backgroundColor: colors.surface,
  },
  rankText: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  // ── Level hero card ─────────────────────────────────────────
  levelCard: {
    backgroundColor: 'rgba(5,0,16,0.95)',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    overflow: 'hidden',
  },
  levelHeroRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  levelHeroNumber: {
    fontSize: 38,
    fontWeight: '900',
    fontFamily: 'Inter_700Bold',
    letterSpacing: -2,
    lineHeight: 40,
  },
  levelHeroMeta: { flex: 1, gap: 5 },
  levelHeroRank: {
    fontSize: 9,
    fontWeight: '900',
    fontFamily: 'Orbitron_900Black',
    letterSpacing: 2.5,
  },
  levelProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  levelProgressTrack: {
    flex: 1, height: 5, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.07)', overflow: 'hidden',
  },
  levelProgressFill: { height: '100%', borderRadius: 3 },
  levelProgressPct: {
    fontSize: 10, fontWeight: '700', fontFamily: 'Inter_700Bold',
    minWidth: 30, textAlign: 'right',
  },
  levelProgressSub: {
    fontSize: 7, color: 'rgba(255,255,255,0.2)',
    fontFamily: 'Orbitron_400Regular', letterSpacing: 2,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: 'Orbitron_400Regular',
    marginTop: 2,
  },
  statsGrid: { flexDirection: 'row', gap: 8 },
  // Tournament stats card
  tournamentCard: {
    backgroundColor: colors.surface,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: 'rgba(191,95,255,0.2)',
    padding: 10,
    gap: 8,
    overflow: 'hidden',
  },
  tournamentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  tournamentStat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  tournamentValue: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  tournamentLabel: {
    color: colors.textDim,
    fontSize: 8,
    letterSpacing: 1.5,
    fontFamily: 'Orbitron_400Regular',
    fontWeight: '600',
  },
  tournamentDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  tournamentDividerH: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginHorizontal: 4,
  },
  tournamentEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
    marginTop: 2,
  },
  tournamentEmptyText: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 9,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 0.3,
  },
  chipCard: {
    backgroundColor: colors.surface,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
    padding: 14,
    alignItems: 'center',
    gap: 3,
    overflow: 'hidden',
  },
  chipAmount: {
    color: colors.gold,
    fontSize: 26,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  chipLabel: { color: colors.textMuted, fontSize: 10, letterSpacing: 2, fontWeight: '600' },
  buyChipsBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 12,
    width: 200,
  },
  buyChipsBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.4)',
  },
  buyChipsIcon: { fontSize: 16 },
  buyChipsTxt: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 12,
    color: '#00d4ff',
    letterSpacing: 2,
  },
  streakNum: { color: colors.text, fontSize: 18, fontWeight: '700' },
  streakSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  avatarPickerWrap: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginTop: 6,
  },
  changeAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
});

const devStyles = StyleSheet.create({
  addChipsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.35)',
    backgroundColor: 'rgba(0,212,255,0.07)',
  },
  addChipsTxt: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 11,
    color: '#00d4ff',
    letterSpacing: 1.5,
  },
});

