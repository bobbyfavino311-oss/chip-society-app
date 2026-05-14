import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Alert,
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

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile, updateProfile, winRate } = useUser();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.username);

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

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background, '#0a0025', colors.background]}
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
          <View style={[styles.avatar, { borderColor: rankColor, shadowColor: rankColor }]}>
            <Text style={[styles.avatarText, { color: rankColor }]}>♠</Text>
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
          <Text style={styles.chipAmount}>{profile.chips.toLocaleString()}</Text>
          <Text style={styles.chipLabel}>VIRTUAL CHIPS</Text>
        </View>

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
  },
  avatarText: { fontSize: 42, fontWeight: '700' },
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
});
