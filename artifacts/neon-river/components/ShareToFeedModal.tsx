/**
 * ShareToFeedModal — post-game share sheet.
 * Appears after tournament results or big practice wins.
 * Calls useLiveFeed().publishPost internally — no props needed for the post.
 */
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/colors';
import { useLiveFeed } from '@/context/LiveFeedContext';
import type { PostTag } from '@/lib/socialData';

const TAGS: Array<{ id: PostTag; label: string; icon: string; color: string }> = [
  { id: 'WIN',        label: 'WIN',        icon: 'trophy-outline',       color: '#00e887' },
  { id: 'TOURNAMENT', label: 'TOURNAMENT', icon: 'medal-outline',         color: '#ffd700' },
  { id: 'ALL-IN',     label: 'ALL-IN',     icon: 'flame-outline',         color: '#ff6600' },
  { id: 'HIGHLIGHT',  label: 'HIGHLIGHT',  icon: 'star-outline',          color: '#00d4ff' },
  { id: 'BAD BEAT',   label: 'BAD BEAT',   icon: 'sad-outline',           color: '#ff4466' },
  { id: 'BLUFF',      label: 'BLUFF',      icon: 'glasses-outline',       color: '#bf5fff' },
];

const MAX = 280;

interface Props {
  visible: boolean;
  onClose: () => void;
  defaultContent: string;
  defaultTag: PostTag;
  pot?: string;
  handRank?: string;
}

export default function ShareToFeedModal({ visible, onClose, defaultContent, defaultTag, pot, handRank }: Props) {
  const { publishPost } = useLiveFeed();
  const [text, setText] = useState('');
  const [tag, setTag]   = useState<PostTag>(defaultTag);
  const [posting, setPosting] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Reset whenever the modal opens
  useEffect(() => {
    if (visible) {
      setText(defaultContent);
      setTag(defaultTag);
      setPosting(false);
      setDone(false);
      // Auto-focus after animation
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [visible]);

  const remaining = MAX - text.length;
  const canPost = text.trim().length > 0 && remaining >= 0 && !posting;

  const handlePost = async () => {
    if (!canPost) return;
    Keyboard.dismiss();
    setPosting(true);
    try {
      await publishPost({ content: text.trim(), tag, pot, handRank });
      setDone(true);
      setTimeout(() => onClose(), 900);
    } catch {
      setPosting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={st.overlay}>
          <TouchableOpacity style={st.backdrop} activeOpacity={1} onPress={onClose} />

          <View style={st.sheet}>
            <LinearGradient colors={['#1a0035', '#0e001f', '#050010']} style={StyleSheet.absoluteFill} />
            <View style={[st.topAccent, { backgroundColor: TAGS.find(t => t.id === tag)?.color ?? colors.primary }]} />

            {/* Handle */}
            <View style={st.handle} />

            {/* Header */}
            <View style={st.header}>
              <View style={st.headerLeft}>
                <Ionicons name="share-social-outline" size={18} color={colors.primary} />
                <Text style={st.headerTitle}>SHARE TO FEED</Text>
              </View>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Tag selector */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={st.tagRow}
            >
              {TAGS.map(t => {
                const active = tag === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[st.tagChip, active && { borderColor: t.color, backgroundColor: `${t.color}18` }]}
                    onPress={() => setTag(t.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name={t.icon as any} size={11} color={active ? t.color : colors.textMuted} />
                    <Text style={[st.tagLabel, active && { color: t.color, fontWeight: '800' }]}>{t.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Text area */}
            <View style={st.inputWrap}>
              {done ? (
                <View style={st.successBanner}>
                  <Ionicons name="checkmark-circle" size={22} color="#00e887" />
                  <Text style={st.successText}>Posted to feed!</Text>
                </View>
              ) : (
                <TextInput
                  ref={inputRef}
                  style={st.input}
                  value={text}
                  onChangeText={setText}
                  multiline
                  maxLength={MAX + 10}
                  placeholder="What happened at the table?"
                  placeholderTextColor={colors.textDim}
                  selectionColor={colors.primary}
                  keyboardAppearance="dark"
                  editable={!posting}
                />
              )}
            </View>

            {/* Hand rank / pot pills */}
            {(handRank || pot) && !done && (
              <View style={st.metaRow}>
                {handRank && (
                  <View style={st.metaPill}>
                    <Ionicons name="card-outline" size={11} color={colors.textDim} />
                    <Text style={st.metaText}>{handRank}</Text>
                  </View>
                )}
                {pot && (
                  <View style={st.metaPill}>
                    <Ionicons name="wallet-outline" size={11} color={colors.textDim} />
                    <Text style={st.metaText}>{pot} chips</Text>
                  </View>
                )}
              </View>
            )}

            {/* Footer */}
            {!done && (
              <View style={st.footer}>
                <Text style={[st.charCount, remaining < 20 && { color: remaining < 0 ? colors.error : '#ff9900' }]}>
                  {remaining}
                </Text>
                <View style={st.footerBtns}>
                  <TouchableOpacity style={st.skipBtn} onPress={onClose} activeOpacity={0.7}>
                    <Text style={st.skipText}>SKIP</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[st.shareBtn, !canPost && st.shareBtnDisabled]}
                    onPress={handlePost}
                    activeOpacity={0.85}
                  >
                    {canPost && (
                      <LinearGradient
                        colors={[colors.primary, '#0099cc']}
                        style={StyleSheet.absoluteFill}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      />
                    )}
                    {posting
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <>
                          <Ionicons name="paper-plane-outline" size={14} color={canPost ? '#000' : colors.textDim} />
                          <Text style={[st.shareText, !canPost && st.shareTextDisabled]}>POST</Text>
                        </>
                    }
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const st = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)' },
  sheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    overflow: 'hidden', paddingTop: 8, paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  topAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 2 },
  handle: {
    width: 38, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignSelf: 'center', marginBottom: 14,
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 14,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: {
    color: colors.text, fontSize: 12, fontWeight: '900',
    fontFamily: 'Orbitron_700Bold', letterSpacing: 1.5,
  },
  tagRow: { gap: 6, paddingRight: 4, marginBottom: 14 },
  tagChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  tagLabel: {
    color: colors.textMuted, fontSize: 9,
    fontWeight: '700', letterSpacing: 1,
  },
  inputWrap: {
    borderRadius: 14, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    minHeight: 100, padding: 12, marginBottom: 10,
  },
  input: {
    color: colors.text, fontSize: 15, lineHeight: 22,
    minHeight: 80, textAlignVertical: 'top',
  },
  successBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 24, justifyContent: 'center',
  },
  successText: {
    color: '#00e887', fontSize: 16,
    fontWeight: '700', fontFamily: 'Orbitron_700Bold',
  },
  metaRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  metaPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10,
    paddingHorizontal: 9, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  metaText: { color: colors.textDim, fontSize: 11 },
  footer: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  charCount: { color: colors.textDim, fontSize: 12, fontWeight: '600', width: 32 },
  footerBtns: { flexDirection: 'row', gap: 8, flex: 1, justifyContent: 'flex-end' },
  skipBtn: {
    paddingHorizontal: 16, paddingVertical: 11, borderRadius: 10,
    borderWidth: 1, borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  skipText: {
    color: colors.textMuted, fontSize: 11,
    fontWeight: '700', letterSpacing: 1.5,
  },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 11,
    borderRadius: 10, overflow: 'hidden', minWidth: 80,
    justifyContent: 'center',
  },
  shareBtnDisabled: {
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  shareText: {
    color: '#000', fontSize: 11,
    fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 1.5,
  },
  shareTextDisabled: { color: colors.textDim },
});
