import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, FlatList, KeyboardAvoidingView, Platform,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '@/constants/colors';
import { useUser } from '@/context/UserContext';
import NeonAvatar from '@/components/NeonAvatar';
import { getMessages, sendMessage, type DMessage } from '@/lib/socialApi';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (diffDays === 0) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) return 'Yesterday ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ConversationScreen() {
  const { id, otherUsername, otherAvatarIndex } = useLocalSearchParams<{
    id: string; otherUsername?: string; otherAvatarIndex?: string;
  }>();
  const { profile } = useUser();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<DMessage>>(null);

  const [messages, setMessages] = useState<DMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');

  const avatarIndex = parseInt(otherAvatarIndex ?? '1', 10) || 1;

  const load = useCallback(async () => {
    if (!profile.playerId || !id) return;
    try {
      const msgs = await getMessages(profile.playerId, id);
      setMessages(msgs);
    } catch {
      /* silent — messages stay as-is */
    } finally {
      setLoading(false);
    }
  }, [profile.playerId, id]);

  useEffect(() => { void load(); }, [load]);

  // Listen for real-time DMs pushed via UserContext DM socket event
  const { onDmReceived } = useUser() as any;
  useEffect(() => {
    if (!onDmReceived) return;
    return onDmReceived((msg: any) => {
      if (msg.conversationId !== id) return;
      const newMsg: DMessage = {
        id: msg.messageId,
        conversationId: msg.conversationId,
        senderId: msg.senderId,
        text: msg.text,
        readAt: null,
        isReported: false,
        createdAt: msg.createdAt ?? new Date().toISOString(),
      };
      setMessages(prev => [...prev, newMsg]);
    });
  }, [id, onDmReceived]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 50);
    }
  }, [messages.length]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !profile.playerId || !id || sending) return;
    if (trimmed.length > 500) { setSendError('Message too long (max 500 chars)'); return; }

    setSendError('');
    setSending(true);
    const optimistic: DMessage = {
      id: `tmp-${Date.now()}`,
      conversationId: id,
      senderId: profile.playerId,
      text: trimmed,
      readAt: null,
      isReported: false,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    setText('');

    try {
      const saved = await sendMessage(profile.playerId, id, trimmed);
      setMessages(prev => prev.map(m => m.id === optimistic.id ? saved : m));
    } catch (e: any) {
      setSendError(e.message ?? 'Failed to send');
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      setText(trimmed);
    } finally {
      setSending(false);
    }
  };

  const isMine = (msg: DMessage) => msg.senderId === profile.playerId;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient colors={['#0a0020', '#050010']} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <NeonAvatar avatarId={avatarIndex} size={32} />
          <Text style={s.headerName}>{otherUsername ?? 'Player'}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Message list */}
        {loading ? (
          <View style={s.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={m => m.id}
            contentContainerStyle={{ padding: 14, gap: 8, paddingBottom: 8 }}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={s.center}>
                <Text style={s.emptyText}>No messages yet. Say hello!</Text>
              </View>
            }
            renderItem={({ item: m }) => {
              const mine = isMine(m);
              return (
                <View style={[s.bubbleRow, mine && s.bubbleRowMine]}>
                  {!mine && <NeonAvatar avatarId={avatarIndex} size={28} />}
                  <View style={[s.bubble, mine ? s.bubbleMine : s.bubbleOther]}>
                    <Text style={[s.bubbleText, mine && s.bubbleTextMine]}>{m.text}</Text>
                    <Text style={[s.bubbleTime, mine && s.bubbleTimeMine]}>{formatTime(m.createdAt)}</Text>
                  </View>
                </View>
              );
            }}
          />
        )}

        {/* Input bar */}
        <View style={[s.inputBar, { paddingBottom: insets.bottom + 8 }]}>
          {sendError ? (
            <Text style={s.sendError}>{sendError}</Text>
          ) : null}
          <View style={s.inputRow}>
            <TextInput
              style={s.input}
              value={text}
              onChangeText={t => { setText(t); setSendError(''); }}
              placeholder="Type a message…"
              placeholderTextColor={colors.textDim}
              multiline
              maxLength={500}
              selectionColor={colors.primary}
              returnKeyType="send"
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={[s.sendBtn, (!text.trim() || sending) && s.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!text.trim() || sending}
            >
              {sending
                ? <ActivityIndicator size="small" color="#000" />
                : <Ionicons name="send" size={18} color="#000" />
              }
            </TouchableOpacity>
          </View>
          <Text style={s.charCount}>{text.length}/500</Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerName: { color: colors.text, fontSize: 16, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: colors.textDim, fontSize: 14 },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, maxWidth: '80%' },
  bubbleRowMine: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  bubble: {
    borderRadius: 16, padding: 10, paddingBottom: 6,
    backgroundColor: `${colors.surface}cc`,
    borderWidth: 1, borderColor: colors.border,
  },
  bubbleOther: {
    backgroundColor: `${colors.surface}cc`,
    borderColor: colors.border,
  },
  bubbleMine: {
    backgroundColor: `${colors.primary}25`,
    borderColor: `${colors.primary}50`,
  },
  bubbleText: { color: colors.text, fontSize: 14, lineHeight: 20 },
  bubbleTextMine: { color: colors.text },
  bubbleTime: { color: colors.textDim, fontSize: 10, marginTop: 3, textAlign: 'right' },
  bubbleTimeMine: { textAlign: 'right' },
  inputBar: {
    borderTopWidth: 1, borderTopColor: colors.border,
    paddingHorizontal: 14, paddingTop: 10,
    backgroundColor: `${colors.background}f0`,
  },
  sendError: { color: '#ff4466', fontSize: 12, marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  input: {
    flex: 1, backgroundColor: colors.surface, borderRadius: 20,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 10,
    color: colors.text, fontSize: 14, maxHeight: 100,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: `${colors.primary}40` },
  charCount: { color: colors.textDim, fontSize: 10, textAlign: 'right', marginTop: 4 },
});
