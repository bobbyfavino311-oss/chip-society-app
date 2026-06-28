import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
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
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/colors';
import { useUser, getApiBase } from '@/context/UserContext';

type Category = 'crash' | 'casino' | 'ui' | 'account' | 'performance' | 'other';

const CATEGORIES: { id: Category; label: string; icon: string }[] = [
  { id: 'crash',       label: 'Crash / Error',  icon: '💥' },
  { id: 'casino',      label: 'Casino Game',    icon: '🃏' },
  { id: 'ui',          label: 'UI / Visual',    icon: '🎨' },
  { id: 'account',     label: 'Account',        icon: '👤' },
  { id: 'performance', label: 'Performance',    icon: '⚡' },
  { id: 'other',       label: 'Other',          icon: '💬' },
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function BugReportModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { profile } = useUser();

  const [category, setCategory] = useState<Category>('other');
  const [title, setTitle]       = useState('');
  const [desc, setDesc]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]       = useState('');

  function reset() {
    setCategory('other');
    setTitle('');
    setDesc('');
    setLoading(false);
    setSubmitted(false);
    setError('');
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit() {
    if (!title.trim()) { setError('Please add a short title.'); return; }
    if (desc.trim().length < 10) { setError('Please describe the issue in more detail.'); return; }

    setLoading(true);
    setError('');

    const body = {
      category,
      title: title.trim(),
      description: desc.trim(),
      playerId: profile.playerId ?? null,
      username: profile.username ?? 'Anonymous',
      deviceInfo: {
        platform: Platform.OS,
        version:  Platform.Version,
      },
    };

    try {
      const r = await fetch(`${getApiBase()}/bug-reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error('Server error');
      setSubmitted(true);
    } catch {
      setError('Could not send report. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={handleClose} />

        <View style={[s.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <LinearGradient colors={['#120028', '#050010']} style={StyleSheet.absoluteFill} />

          {/* Handle */}
          <View style={s.handle} />

          {/* Header */}
          <View style={s.header}>
            <View style={s.headerLeft}>
              <Ionicons name="bug-outline" size={18} color={colors.secondary} />
              <Text style={s.headerTitle}>REPORT A BUG</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={s.closeBtn}>
              <Ionicons name="close" size={20} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          </View>

          {submitted ? (
            /* Success state */
            <View style={s.successWrap}>
              <View style={s.successIcon}>
                <Ionicons name="checkmark-circle" size={48} color={colors.success} />
              </View>
              <Text style={s.successTitle}>Report Sent</Text>
              <Text style={s.successSub}>
                Thanks for helping improve Chip Society.{'\n'}
                Our team will review this shortly.
              </Text>
              <TouchableOpacity style={s.doneBtn} onPress={handleClose}>
                <Text style={s.doneBtnText}>DONE</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={s.form}
            >
              {/* Category */}
              <Text style={s.label}>CATEGORY</Text>
              <View style={s.catGrid}>
                {CATEGORIES.map(c => {
                  const active = category === c.id;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[s.catBtn, active && s.catBtnActive]}
                      onPress={() => setCategory(c.id)}
                      activeOpacity={0.75}
                    >
                      {active && (
                        <LinearGradient
                          colors={['rgba(255,0,144,0.18)', 'transparent']}
                          style={StyleSheet.absoluteFill}
                        />
                      )}
                      <Text style={s.catIcon}>{c.icon}</Text>
                      <Text style={[s.catLabel, active && s.catLabelActive]}>{c.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Title */}
              <Text style={s.label}>TITLE</Text>
              <TextInput
                style={s.input}
                placeholder="Short summary of the issue…"
                placeholderTextColor="rgba(255,255,255,0.25)"
                value={title}
                onChangeText={setTitle}
                selectionColor={colors.secondary}
                maxLength={120}
              />

              {/* Description */}
              <Text style={s.label}>DESCRIPTION</Text>
              <TextInput
                style={[s.input, s.textarea]}
                placeholder="What happened? What did you expect? Steps to reproduce…"
                placeholderTextColor="rgba(255,255,255,0.25)"
                value={desc}
                onChangeText={setDesc}
                multiline
                numberOfLines={5}
                selectionColor={colors.secondary}
                textAlignVertical="top"
                maxLength={1000}
              />
              <Text style={s.charCount}>{desc.length}/1000</Text>

              {/* Player info auto-fill note */}
              <Text style={s.autoNote}>
                <Ionicons name="person-circle-outline" size={11} color="rgba(255,255,255,0.3)" />
                {' '}Sending as <Text style={{ color: 'rgba(255,255,255,0.55)' }}>{profile.username ?? 'Anonymous'}</Text>
                {' '}· {Platform.OS.toUpperCase()}
              </Text>

              {/* Error */}
              {error ? <Text style={s.errText}>{error}</Text> : null}

              {/* Submit */}
              <TouchableOpacity
                style={[s.submitBtn, loading && { opacity: 0.55 }]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['rgba(255,0,144,0.85)', 'rgba(191,0,100,0.85)']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                />
                {loading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={s.submitText}>SEND REPORT</Text>
                }
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)' },
  sheet:        { borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', maxHeight: '88%' },
  handle:       { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)', alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerLeft:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle:  { fontSize: 13, fontFamily: 'Orbitron_700Bold', color: '#fff', letterSpacing: 2 },
  closeBtn:     { padding: 4 },

  form:         { paddingHorizontal: 20, paddingBottom: 20, gap: 10 },
  label:        { fontSize: 9, fontFamily: 'Orbitron_700Bold', color: 'rgba(255,255,255,0.4)', letterSpacing: 2, marginBottom: 2, marginTop: 4 },

  catGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catBtn:       {
    width: '30.5%', borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)', paddingVertical: 10,
    alignItems: 'center', gap: 4, overflow: 'hidden',
  },
  catBtnActive: { borderColor: 'rgba(255,0,144,0.6)' },
  catIcon:      { fontSize: 18 },
  catLabel:     { fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: '600', textAlign: 'center' },
  catLabelActive: { color: colors.secondary },

  input:        {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 14,
  },
  textarea:     { minHeight: 110, paddingTop: 12 },
  charCount:    { fontSize: 10, color: 'rgba(255,255,255,0.25)', textAlign: 'right', marginTop: -6 },
  autoNote:     { fontSize: 10, color: 'rgba(255,255,255,0.28)', lineHeight: 16 },
  errText:      { fontSize: 12, color: '#ff4466', textAlign: 'center' },

  submitBtn:    {
    height: 48, borderRadius: 14, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  submitText:   { fontSize: 13, fontFamily: 'Orbitron_700Bold', color: '#fff', letterSpacing: 2 },

  successWrap:  { alignItems: 'center', gap: 12, paddingVertical: 40, paddingHorizontal: 24 },
  successIcon:  { marginBottom: 4 },
  successTitle: { fontSize: 20, fontFamily: 'Orbitron_700Bold', color: '#fff', letterSpacing: 2 },
  successSub:   { fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 20 },
  doneBtn:      {
    marginTop: 12, borderRadius: 14, borderWidth: 1.5,
    borderColor: colors.success, paddingHorizontal: 36, paddingVertical: 12,
  },
  doneBtnText:  { fontSize: 12, fontFamily: 'Orbitron_700Bold', color: colors.success, letterSpacing: 2 },
});
