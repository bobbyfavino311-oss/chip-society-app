/**
 * InGameChat — multiplayer in-game chat for poker variants.
 * Exports: useInGameChat, ChatBubble, GameChatIcon, GameChatPanel
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated, FlatList, KeyboardAvoidingView, Platform,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/colors';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  ts: number;
}

export interface BubbleEntry { text: string; id: string }

// ─── Constants ────────────────────────────────────────────────────────────────

export const QUICK_CHATS = [
  'Nice hand!', 'Good luck!', 'Well played.', 'Nice bluff.',
  "I should've folded.", 'Tough river.', 'All in!', 'GG!',
];

const MAX_MESSAGES = 25;
const BUBBLE_TTL   = 6000;
const SPAM_DELAY   = 2000;
const PANEL_H      = 310;

const PROFANITY_RE = /\b(fuck|shit|bitch|cunt|cock|crap|ass|piss|whore|slut|nigger|nigga|faggot|retard)\b/gi;
const clean = (t: string) => t.replace(PROFANITY_RE, m => '*'.repeat(m.length));

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useInGameChat() {
  const [messages,     setMessages]     = useState<ChatMessage[]>([]);
  const [panelOpen,    setPanelOpen]    = useState(false);
  const [unread,       setUnread]       = useState(0);
  const [muted,        setMuted]        = useState(false);
  const [presetsOnly,  setPresetsOnly]  = useState(false);
  const [input,        setInput]        = useState('');
  const [bubbles,      setBubbles]      = useState<Record<string, BubbleEntry>>({});
  const [latestToast,  setLatestToast]  = useState<TableToastEntry | undefined>(undefined);

  const lastSendMs = useRef(0);
  const lastText   = useRef('');
  const panelRef   = useRef(panelOpen);
  panelRef.current = panelOpen;

  const slideAnim = useRef(new Animated.Value(PANEL_H)).current;

  // ─── Open / close ──────────────────────────────────────────────────────────
  const openPanel = useCallback(() => {
    setPanelOpen(true);
    setUnread(0);
    Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }).start();
  }, [slideAnim]);

  const closePanel = useCallback(() => {
    Animated.timing(slideAnim, { toValue: PANEL_H, duration: 250, useNativeDriver: true }).start(() => {
      setPanelOpen(false);
    });
  }, [slideAnim]);

  // ─── Add message (internal) ────────────────────────────────────────────────
  const addMessage = useCallback((msg: ChatMessage) => {
    if (muted && msg.playerId !== 'me') return;

    setMessages(prev => {
      const next = [...prev, msg];
      return next.length > MAX_MESSAGES ? next.slice(next.length - MAX_MESSAGES) : next;
    });

    // Floating bubble above player seat + table toast
    const bubbleId = `${msg.playerId}-${msg.ts}`;
    setBubbles(prev => ({ ...prev, [msg.playerId]: { text: msg.text, id: bubbleId } }));
    setLatestToast({ id: bubbleId, senderName: msg.playerName, text: msg.text });
    setTimeout(() => {
      setBubbles(prev => {
        if (prev[msg.playerId]?.id !== bubbleId) return prev;
        const next = { ...prev };
        delete next[msg.playerId];
        return next;
      });
      setLatestToast(prev => (prev?.id === bubbleId ? undefined : prev));
    }, BUBBLE_TTL);

    if (!panelRef.current) setUnread(u => u + 1);
  }, [muted]);

  // ─── Send (from local player) ──────────────────────────────────────────────
  const sendMessage = useCallback((text: string) => {
    const now     = Date.now();
    const cleaned = clean(text.trim()).slice(0, 50);
    if (!cleaned) return;
    if (now - lastSendMs.current < SPAM_DELAY) return;
    if (cleaned === lastText.current) return;
    lastSendMs.current = now;
    lastText.current   = cleaned;
    addMessage({ id: `me-${now}`, playerId: 'me', playerName: 'You', text: cleaned, ts: now });
    setInput('');
  }, [addMessage]);

  // ─── Receive bot / opponent message ────────────────────────────────────────
  const receiveBotMessage = useCallback((playerId: string, playerName: string, text: string) => {
    addMessage({ id: `${playerId}-${Date.now()}`, playerId, playerName, text, ts: Date.now() });
  }, [addMessage]);

  return {
    messages, panelOpen, unread, muted, presetsOnly,
    input, setInput, setMuted, setPresetsOnly,
    openPanel, closePanel, slideAnim,
    sendMessage, receiveBotMessage, bubbles, latestToast,
  };
}

// ─── Shared bubble animation hook ─────────────────────────────────────────────

function useBubbleAnim(bubbleId: string | undefined) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(5)).current;
  const prevId     = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!bubbleId || bubbleId === prevId.current) return;
    prevId.current = bubbleId;
    opacity.setValue(0);
    translateY.setValue(5);
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity,    { toValue: 0, duration: 380, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -5, duration: 380, useNativeDriver: true }),
      ]).start();
    }, BUBBLE_TTL - 420);
    return () => clearTimeout(t);
  }, [bubbleId]);

  return { opacity, translateY };
}

// ─── ChatBubble — absolute-positioned above an AI seat ────────────────────────

export function ChatBubble({ bubble }: { bubble?: BubbleEntry }) {
  const { opacity, translateY } = useBubbleAnim(bubble?.id);
  if (!bubble) return null;
  return (
    <Animated.View style={[chat.bubble, { opacity, transform: [{ translateY }] }]}>
      <Text style={chat.bubbleText} numberOfLines={2}>{bubble.text}</Text>
    </Animated.View>
  );
}

// ─── PlayerChatBubble — inline bubble for the human player's area ─────────────

export function PlayerChatBubble({ bubble }: { bubble?: BubbleEntry }) {
  const { opacity, translateY } = useBubbleAnim(bubble?.id);
  if (!bubble) return null;
  return (
    <Animated.View style={[chat.playerBubble, { opacity, transform: [{ translateY }] }]}>
      <View style={chat.playerBubbleTail} />
      <Text style={chat.playerBubbleText} numberOfLines={2}>{bubble.text}</Text>
    </Animated.View>
  );
}

// ─── TableChatToast — brief message in the game center surface ────────────────

export interface TableToastEntry { id: string; senderName: string; text: string }

export function TableChatToast({ toast }: { toast?: TableToastEntry }) {
  const { opacity, translateY } = useBubbleAnim(toast?.id);
  if (!toast) return null;
  return (
    <Animated.View
      style={[chat.tableBubble, { opacity, transform: [{ translateY }] }]}
      pointerEvents="none"
    >
      <Text style={chat.tableBubbleName} numberOfLines={1}>{toast.senderName}</Text>
      <Text style={chat.tableBubbleText} numberOfLines={2}>{toast.text}</Text>
    </Animated.View>
  );
}

// ─── GameChatIcon — floating button with unread badge ─────────────────────────

export function GameChatIcon({
  unread, onPress,
}: { unread: number; onPress: () => void }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (unread === 0) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.15, duration: 500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1.0,  duration: 500, useNativeDriver: true }),
      ]),
      { iterations: 3 },
    );
    anim.start();
    return () => anim.stop();
  }, [unread]);

  return (
    <Animated.View style={{ transform: [{ scale: pulse }] }}>
      <TouchableOpacity style={chat.iconBtn} onPress={onPress} activeOpacity={0.8}>
        <Ionicons name="chatbubble-outline" size={18} color="#00d4ff" />
        {unread > 0 && (
          <View style={chat.badge}>
            <Text style={chat.badgeText}>{unread > 9 ? '9+' : unread}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── GameChatPanel — slide-up panel ───────────────────────────────────────────

export function GameChatPanel({
  messages, panelOpen, slideAnim, unread,
  muted, setMuted, presetsOnly, setPresetsOnly,
  input, setInput, sendMessage, onClose, onOpen,
}: {
  messages: ChatMessage[];
  panelOpen: boolean;
  slideAnim: Animated.Value;
  unread: number;
  muted: boolean;
  setMuted: (v: boolean) => void;
  presetsOnly: boolean;
  setPresetsOnly: (v: boolean) => void;
  input: string;
  setInput: (v: string) => void;
  sendMessage: (text: string) => void;
  onClose: () => void;
  onOpen: () => void;
}) {
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (panelOpen && messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length, panelOpen]);

  return (
    <>
      {/* Floating icon — always visible */}
      <View style={chat.iconWrap} pointerEvents="box-none">
        <GameChatIcon unread={unread} onPress={panelOpen ? onClose : onOpen} />
      </View>

      {/* Backdrop */}
      {panelOpen && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            onPress={onClose}
            activeOpacity={1}
          />
        </View>
      )}

      {/* Slide-up panel */}
      <Animated.View
        style={[chat.panel, { transform: [{ translateY: slideAnim }] }]}
        pointerEvents={panelOpen ? 'auto' : 'none'}
      >
        {/* Panel header */}
        <View style={chat.panelHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <Ionicons name="chatbubbles" size={14} color="#00d4ff" />
            <Text style={chat.panelTitle}>TABLE CHAT</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity
              onPress={() => setMuted(!muted)}
              style={[chat.headerBtn, muted && { borderColor: '#ff0090' }]}
            >
              <Ionicons
                name={muted ? 'volume-mute' : 'volume-high-outline'}
                size={13}
                color={muted ? '#ff0090' : 'rgba(255,255,255,0.4)'}
              />
              <Text style={[chat.headerBtnText, muted && { color: '#ff0090' }]}>
                {muted ? 'MUTED' : 'MUTE'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Ionicons name="chevron-down" size={18} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Message list */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          style={chat.msgList}
          contentContainerStyle={{ padding: 10, gap: 5 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={chat.emptyText}>No messages yet. Say hello!</Text>
          }
          renderItem={({ item }) => (
            <View style={[chat.msgRow, item.playerId === 'me' && chat.msgRowMe]}>
              <Text style={[chat.msgName, item.playerId === 'me' && { color: '#00d4ff' }]}>
                {item.playerName}
              </Text>
              <View style={[chat.msgBubble, item.playerId === 'me' && chat.msgBubbleMe]}>
                <Text style={chat.msgText}>{item.text}</Text>
              </View>
            </View>
          )}
        />

        {/* Quick chats */}
        <View style={chat.quickWrap}>
          {QUICK_CHATS.map(q => (
            <TouchableOpacity
              key={q}
              style={chat.quickBtn}
              onPress={() => sendMessage(q)}
              activeOpacity={0.75}
            >
              <Text style={chat.quickText}>{q}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Input row */}
        {!presetsOnly && (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={chat.inputRow}>
              <TextInput
                style={chat.input}
                placeholder="Type a message…"
                placeholderTextColor="rgba(255,255,255,0.25)"
                value={input}
                onChangeText={t => setInput(t.slice(0, 50))}
                maxLength={50}
                returnKeyType="send"
                onSubmitEditing={() => sendMessage(input)}
                blurOnSubmit={false}
              />
              <TouchableOpacity
                style={[chat.sendBtn, !input.trim() && { opacity: 0.35 }]}
                onPress={() => sendMessage(input)}
                disabled={!input.trim()}
                activeOpacity={0.8}
              >
                <Ionicons name="send" size={15} color="#050010" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}

        {/* Presets-only toggle */}
        <TouchableOpacity
          style={chat.presetsToggle}
          onPress={() => setPresetsOnly(!presetsOnly)}
        >
          <View style={[chat.presetsCheck, presetsOnly && { backgroundColor: '#00d4ff' }]}>
            {presetsOnly && <Ionicons name="checkmark" size={10} color="#050010" />}
          </View>
          <Text style={chat.presetsLabel}>Preset messages only</Text>
        </TouchableOpacity>
      </Animated.View>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const chat = StyleSheet.create({
  // Floating icon
  iconWrap: {
    position: 'absolute',
    right: 14,
    bottom: 210,
    zIndex: 40,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,20,35,0.90)',
    borderWidth: 1.5,
    borderColor: '#00d4ff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00d4ff',
    shadowOpacity: 0.55,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ff0090',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#050010',
  },
  badgeText: { fontSize: 8, fontWeight: '900', color: '#fff' },

  // Slide-up panel
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: PANEL_H,
    backgroundColor: 'rgba(4,0,14,0.95)',
    borderTopWidth: 1,
    borderTopColor: '#00d4ff55',
    zIndex: 45,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,212,255,0.12)',
  },
  panelTitle: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 11,
    letterSpacing: 2,
    color: '#00d4ff',
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerBtnText: {
    fontFamily: 'Orbitron_400Regular',
    fontSize: 8,
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.4)',
  },

  // Messages
  msgList: { flex: 1 },
  emptyText: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 20,
    fontFamily: 'Orbitron_400Regular',
    letterSpacing: 1,
  },
  msgRow: { gap: 2 },
  msgRowMe: { alignItems: 'flex-end' },
  msgName: {
    fontSize: 9,
    fontWeight: '700',
    color: '#bf5fff',
    fontFamily: 'Orbitron_400Regular',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  msgBubble: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    borderTopLeftRadius: 3,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: '80%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  msgBubbleMe: {
    backgroundColor: 'rgba(0,212,255,0.12)',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 3,
    borderColor: 'rgba(0,212,255,0.2)',
  },
  msgText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    lineHeight: 17,
  },

  // Quick chats
  quickWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 4,
  },
  quickBtn: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(0,212,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.22)',
  },
  quickText: {
    color: '#00d4ff',
    fontSize: 10,
    fontWeight: '600',
  },

  // Input
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 6,
  },
  input: {
    flex: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.25)',
    paddingHorizontal: 14,
    color: '#fff',
    fontSize: 13,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00d4ff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Presets toggle
  presetsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  presetsCheck: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: 'rgba(0,212,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetsLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
  },

  // Floating bubble above AI seat (absolute positioned within seat View)
  bubble: {
    position: 'absolute',
    top: -44,
    left: '50%',
    transform: [{ translateX: -45 }],
    width: 90,
    backgroundColor: 'rgba(4,0,14,0.92)',
    borderRadius: 8,
    borderTopLeftRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.35)',
    paddingHorizontal: 7,
    paddingVertical: 4,
    zIndex: 30,
  },
  bubbleText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 9,
    lineHeight: 13,
    textAlign: 'center',
  },

  // PlayerChatBubble — inline bubble above human player's cards
  playerBubble: {
    alignSelf: 'center',
    backgroundColor: 'rgba(4,0,14,0.92)',
    borderRadius: 10,
    borderBottomLeftRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    maxWidth: 220,
    marginBottom: 2,
    shadowColor: '#00d4ff',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  playerBubbleTail: {
    position: 'absolute',
    bottom: -6,
    left: 18,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(0,212,255,0.4)',
  },
  playerBubbleText: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
  },

  // TableChatToast — game center overlay near community cards
  tableBubble: {
    position: 'absolute',
    bottom: 8,
    right: 10,
    maxWidth: 130,
    backgroundColor: 'rgba(4,0,14,0.88)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.28)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    zIndex: 20,
    shadowColor: '#00d4ff',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 0 },
  },
  tableBubbleName: {
    color: '#00d4ff',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  tableBubbleText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    lineHeight: 14,
  },
});
