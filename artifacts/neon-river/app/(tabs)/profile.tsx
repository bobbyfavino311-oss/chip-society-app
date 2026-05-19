import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  Alert,
  Image,
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
import colors from '@/constants/colors';
import { useUser } from '@/context/UserContext';
import { useColors } from '@/hooks/useColors';
import { CASINO_AVATARS, getAvatar } from '@/components/CasinoAvatars';
import { useSoundSettings } from '@/context/SoundContext';

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
    fontFamily: 'Orbitron_700Bold',
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
          setMasterVolume, setEffectsVolume, toggleMute, toggleVibration } = useSoundSettings();

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
        <Row label="Vibration / Haptics" value={isVibrationEnabled} onToggle={toggleVibration}
          icon={isVibrationEnabled ? 'phone-portrait' : 'phone-portrait-outline'} />
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { profile, updateProfile, winRate } = useUser();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.username);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const rankColor = RANK_COLORS[profile.rank] ?? colors.primary;
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.background, colors.surfaceElevated, colors.background]}
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
              style={[styles.avatar, { borderColor: rankColor, shadowColor: rankColor }]}
              onPress={() => setShowAvatarPicker(p => !p)}
              activeOpacity={0.8}
            >
              {profile.avatarUri ? (
                <Image source={{ uri: profile.avatarUri }} style={styles.avatarImage} />
              ) : (
                getAvatar(profile.avatarIndex).render(82)
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cameraOverlay} onPress={pickAvatar}>
              <Ionicons name="camera" size={14} color={colors.background} />
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
                placeholderTextColor={colors.textDim}
                selectionColor={colors.primary}
              />
              <TouchableOpacity style={styles.saveBtn} onPress={saveName}>
                <Ionicons name="checkmark" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.nameRow} onPress={() => setEditing(true)}>
              <Text style={styles.username}>{profile.username}</Text>
              <Ionicons name="pencil" size={14} color={colors.textDim} style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          )}

          <View style={[styles.rankBadge, { borderColor: rankColor }]}>
            <Text style={[styles.rankText, { color: rankColor }]}>{profile.rank}</Text>
          </View>

          {/* Avatar picker grid */}
          {showAvatarPicker && (
            <View style={styles.avatarPickerWrap}>
              <Text style={styles.avatarPickerTitle}>CHOOSE AVATAR</Text>
              <View style={styles.avatarGrid}>
                {CASINO_AVATARS.map(av => {
                  const isSelected = !profile.avatarUri && profile.avatarIndex === av.id;
                  return (
                    <TouchableOpacity
                      key={av.id}
                      style={[
                        styles.avatarGridCell,
                        isSelected && { borderColor: av.accentColor, shadowColor: av.accentColor, shadowOpacity: 0.7, shadowRadius: 8 },
                      ]}
                      onPress={async () => {
                        await updateProfile({ avatarIndex: av.id, avatarUri: undefined });
                        setShowAvatarPicker(false);
                      }}
                      activeOpacity={0.75}
                    >
                      {av.render(48)}
                      {isSelected && (
                        <View style={[styles.avatarGridCheck, { backgroundColor: av.accentColor }]}>
                          <Ionicons name="checkmark" size={8} color="#050010" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity style={styles.closePickerBtn} onPress={() => setShowAvatarPicker(false)}>
                <Text style={styles.closePickerText}>DONE</Text>
              </TouchableOpacity>
            </View>
          )}
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
          <StatBox label="LEVEL" value={`Lv.${profile.level}`} color={colors.primary} />
          <StatBox label="WIN RATE" value={`${winRate}%`} color={colors.success} />
        </View>
        <View style={styles.statsGrid}>
          <StatBox label="WINS" value={profile.wins} color={colors.gold} />
          <StatBox label="LOSSES" value={profile.losses} color={colors.error} />
          <StatBox label="HANDS" value={profile.handsPlayed} />
        </View>

        <Text style={styles.sectionTitle}>CHIP BALANCE</Text>
        <View style={styles.chipCard}>
          <LinearGradient
            colors={['rgba(255,215,0,0.1)', 'transparent']}
            style={StyleSheet.absoluteFill}
          />
          <MaterialCommunityIcons name="poker-chip" size={40} color={colors.gold} />
          <Text style={[styles.chipAmount, { color: profile.chips < 5_000 ? '#ff4444' : profile.chips < 30_000 ? '#ffd700' : '#00d4aa' }]}>
            {profile.chips >= 1_000_000
              ? `${(profile.chips / 1_000_000).toFixed(1)}M`
              : profile.chips >= 1_000
              ? `${(profile.chips / 1_000).toFixed(0)}K`
              : profile.chips.toLocaleString()}
          </Text>
          <Text style={styles.chipLabel}>VIRTUAL CHIPS</Text>
        </View>

        <SoundSettingsCard />

        <Text style={styles.sectionTitle}>STREAK</Text>
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Ionicons name="flame" size={32} color={colors.warning} />
            <View>
              <Text style={styles.streakNum}>{profile.streakDays} Day Streak</Text>
              <Text style={styles.streakSub}>Login daily for bonus chips!</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

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
    fontFamily: 'Orbitron_700Bold',
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
  avatarPickerTitle: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: 'Orbitron_400Regular',
    textAlign: 'center',
    marginBottom: 12,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  avatarGridCell: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarGridCheck: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closePickerBtn: {
    marginTop: 12,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  closePickerText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: 'Orbitron_400Regular',
  },
});
