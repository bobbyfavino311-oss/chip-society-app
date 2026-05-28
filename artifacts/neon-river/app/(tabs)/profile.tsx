import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
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
import { useUser } from '@/context/UserContext';
import { useColors } from '@/hooks/useColors';
import NeonAvatar from '@/components/NeonAvatar';
import { useSoundSettings } from '@/context/SoundContext';
import { useAchievements, achievementCompletion } from '@/context/AchievementContext';
import { useSocial } from '@/context/SocialContext';
import { ALL_ACHIEVEMENTS } from '@/lib/achievements';

const RANK_COLORS: Record<string, string> = {
  'Neon Bronze': '#cd7f32',
  'Neon Silver': '#a0a8c0',
  'Neon Gold': colors.gold,
  'Neon Platinum': '#a0f0ff',
  'Neon Diamond': '#b8f0ff',
  'Neon Elite': colors.secondary,
  'Neon Legend': colors.accent,
};

const RANK_ORDER = [
  'Neon Bronze', 'Neon Silver', 'Neon Gold', 'Neon Platinum',
  'Neon Diamond', 'Neon Elite', 'Neon Legend',
];
const RANK_XP = [0, 500, 1500, 4000, 10000, 25000, 60000];

function StatBox({ label, value, color = colors.text }: { label: string; value: string | number; color?: string }) {
  return (
    <View style={statStyles.box}>
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  box: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: colors.border,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  label: {
    color: colors.textDim,
    fontSize: 9,
    letterSpacing: 1,
    marginTop: 4,
    fontWeight: '600',
  },
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

  const claimedCount = achievementCompletion(unlockedIds);

  const rankColor = RANK_COLORS[profile.rank] ?? c.primary;
  const rankIdx = RANK_ORDER.indexOf(profile.rank);
  const nextRankXP = RANK_XP[rankIdx + 1] ?? profile.xp;
  const xpProgress = nextRankXP > 0
    ? Math.min(1, (profile.xp - RANK_XP[rankIdx]) / (nextRankXP - RANK_XP[rankIdx]))
    : 1;

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
  const hasTournamentData = profile.tournamentWins > 0 || profile.tournamentLosses > 0;
  const tournamentTotal = profile.tournamentWins + profile.tournamentLosses;
  const tournamentWinRate = tournamentTotal > 0
    ? Math.round((profile.tournamentWins / tournamentTotal) * 100)
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
        <Text style={styles.header}>PLAYER PROFILE</Text>

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
                  avatarId={profile.symbolIndex && profile.symbolIndex > 0 ? profile.symbolIndex : (profile.avatarIndex ? ((profile.avatarIndex - 1) % 30) + 1 : 1)}
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
              <Text style={styles.username}>{profile.username}</Text>
              <Ionicons name="pencil" size={14} color={c.textDim} style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          )}

          <View style={[styles.rankBadge, { borderColor: rankColor }]}>
            <Text style={[styles.rankText, { color: rankColor }]}>{profile.rank}</Text>
          </View>

        </View>

        <View style={styles.card}>
          <View style={styles.xpHeader}>
            <Text style={styles.xpLabel}>XP Progress</Text>
            <Text style={[styles.xpValue, { color: rankColor }]}>{profile.xp.toLocaleString()} XP</Text>
          </View>
          <View style={styles.xpBar}>
            <View style={[styles.xpFill, { width: `${xpProgress * 100}%`, backgroundColor: rankColor }]} />
          </View>
          {rankIdx < RANK_ORDER.length - 1 && (
            <Text style={styles.xpNext}>
              {(nextRankXP - profile.xp).toLocaleString()} XP to {RANK_ORDER[rankIdx + 1]}
            </Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>STATISTICS</Text>
        <View style={styles.statsGrid}>
          <StatBox label="LEVEL" value={`Lv.${profile.level}`} color={c.primary} />
          <StatBox label="WIN RATE" value={`${winRate}%`} color={c.success} />
        </View>
        <View style={styles.statsGrid}>
          <StatBox label="WINS" value={profile.wins} color={c.gold} />
          <StatBox label="LOSSES" value={profile.losses} color={c.error} />
          <StatBox label="HANDS" value={profile.handsPlayed} />
        </View>

        {/* Tournament stats section */}
        <Text style={styles.sectionTitle}>TOURNAMENTS</Text>
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
                {hasTournamentData ? `${tournamentWinRate}%` : '--'}
              </Text>
              <Text style={styles.tournamentLabel}>WIN RATE</Text>
            </View>
          </View>
          <View style={styles.tournamentRow}>
            <View style={styles.tournamentStat}>
              <Text style={[styles.tournamentValue, { color: '#bf5fff' }]}>
                {profile.bestTournamentFinish > 0 ? `#${profile.bestTournamentFinish}` : '--'}
              </Text>
              <Text style={styles.tournamentLabel}>BEST FINISH</Text>
            </View>
            <View style={styles.tournamentDivider} />
            <View style={[styles.tournamentStat, { flex: 2 }]}>
              <Text style={[styles.tournamentValue, { color: '#00ff88', fontSize: 18 }]}>
                {profile.biggestTournamentPrize > 0
                  ? profile.biggestTournamentPrize.toLocaleString('en-US')
                  : '--'}
              </Text>
              <Text style={styles.tournamentLabel}>BIGGEST PRIZE</Text>
            </View>
          </View>
          {!hasTournamentData && (
            <Text style={styles.tournamentEmpty}>
              Enter a tournament to track your results
            </Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>SOCIAL</Text>
        <View style={styles.statsGrid}>
          <StatBox label="FOLLOWING" value={socialFollowingCount} color={c.primary} />
          <StatBox label="ACHIEVEMENTS" value={claimedCount} color={c.accent} />
        </View>

        <Text style={styles.sectionTitle}>CHIP BALANCE</Text>
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

        <SoundSettingsCard />

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

        <Text style={styles.sectionTitle}>STREAK</Text>
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
  scroll: { paddingHorizontal: 16, gap: 14 },
  header: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 18,
    color: colors.primary,
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 8,
  },
  avatarSection: { alignItems: 'center', gap: 10 },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.surface,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  avatarText: { fontSize: 42, fontWeight: '700' },
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
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  username: { color: colors.text, fontSize: 22, fontWeight: '700', fontFamily: 'Orbitron_700Bold' },
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
    padding: 16,
  },
  xpHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  xpLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  xpValue: { fontSize: 12, fontWeight: '700' },
  xpBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpFill: { height: '100%', borderRadius: 3 },
  xpNext: { color: colors.textDim, fontSize: 10, marginTop: 6 },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: 'Orbitron_400Regular',
    marginTop: 4,
  },
  statsGrid: { flexDirection: 'row', gap: 8 },
  // Tournament stats card
  tournamentCard: {
    backgroundColor: colors.surface,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: 'rgba(191,95,255,0.2)',
    padding: 14,
    gap: 10,
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
    fontSize: 22,
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
  tournamentEmpty: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 9,
    fontFamily: 'Orbitron_400Regular',
    textAlign: 'center',
    letterSpacing: 0.5,
    paddingVertical: 4,
  },
  chipCard: {
    backgroundColor: colors.surface,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
    padding: 20,
    alignItems: 'center',
    gap: 4,
    overflow: 'hidden',
  },
  chipAmount: {
    color: colors.gold,
    fontSize: 32,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  chipLabel: { color: colors.textMuted, fontSize: 10, letterSpacing: 2, fontWeight: '600' },
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
