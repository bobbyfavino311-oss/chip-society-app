import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '@/constants/colors';
import { useUser } from '@/context/UserContext';
import NeonAvatar from '@/components/NeonAvatar';
import { getConversations, type Conversation } from '@/lib/socialApi';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function InboxScreen() {
  const { profile } = useUser();
  const insets = useSafeAreaInsets();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!profile.playerId) return;
    setLoading(true);
    setError('');
    try {
      const data = await getConversations(profile.playerId);
      setConversations(data);
    } catch {
      setError('Could not load messages. Try again.');
    } finally {
      setLoading(false);
    }
  }, [profile.playerId]);

  useEffect(() => { void load(); }, [load]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient colors={['#0a0020', '#050010']} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Inbox</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={s.center}>
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={load}>
            <Text style={s.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : conversations.length === 0 ? (
        <View style={s.center}>
          <Ionicons name="chatbubbles-outline" size={48} color={colors.textDim} />
          <Text style={s.emptyText}>No messages yet</Text>
          <Text style={s.emptySubtext}>Search for players to start a conversation</Text>
          <TouchableOpacity style={s.searchBtn} onPress={() => router.push({ pathname: '/(tabs)/feed', params: { tab: 'search' } })}>
            <Text style={s.searchBtnText}>Find Players</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={c => c.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          onRefresh={load}
          refreshing={loading}
          renderItem={({ item: c }) => (
            <TouchableOpacity
              style={s.row}
              onPress={() => router.push(`/inbox/${c.id}?otherUsername=${encodeURIComponent(c.otherUsername)}&otherAvatarIndex=${c.otherAvatarIndex}`)}
            >
              <LinearGradient colors={['#100028', '#080015']} style={StyleSheet.absoluteFill} />
              <View style={s.avatarWrap}>
                <NeonAvatar avatarId={c.otherAvatarIndex} size={48} />
                {c.unread > 0 && (
                  <View style={s.badge}>
                    <Text style={s.badgeText}>{c.unread > 9 ? '9+' : c.unread}</Text>
                  </View>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <View style={s.rowTop}>
                  <Text style={[s.rowUsername, c.unread > 0 && s.unreadUsername]}>{c.otherUsername}</Text>
                  <Text style={s.rowTime}>{timeAgo(c.lastAt)}</Text>
                </View>
                <Text
                  style={[s.rowPreview, c.unread > 0 && s.unreadPreview]}
                  numberOfLines={1}
                >
                  {c.lastPreview || 'Start a conversation…'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { color: colors.text, fontSize: 18, fontWeight: '700', letterSpacing: 1 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { color: '#ff4466', fontSize: 14 },
  emptyText: { color: colors.text, fontSize: 16, fontWeight: '600', marginTop: 12 },
  emptySubtext: { color: colors.textDim, fontSize: 13, textAlign: 'center', paddingHorizontal: 32 },
  retryBtn: { borderWidth: 1, borderColor: colors.primary, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 8, marginTop: 4 },
  retryText: { color: colors.primary, fontWeight: '600' },
  searchBtn: { backgroundColor: `${colors.primary}20`, borderWidth: 1, borderColor: colors.primary, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 8, marginTop: 4 },
  searchBtnText: { color: colors.primary, fontWeight: '700' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 14, marginTop: 10, borderRadius: 14,
    borderWidth: 1, borderColor: colors.border, padding: 14, overflow: 'hidden',
  },
  avatarWrap: { position: 'relative' },
  badge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: colors.primary, borderRadius: 10, minWidth: 18, height: 18,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  badgeText: { color: '#000', fontSize: 10, fontWeight: '800' },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  rowUsername: { color: colors.text, fontSize: 14, fontWeight: '600' },
  unreadUsername: { color: colors.primary, fontWeight: '800' },
  rowTime: { color: colors.textDim, fontSize: 11 },
  rowPreview: { color: colors.textDim, fontSize: 13 },
  unreadPreview: { color: colors.text },
});
