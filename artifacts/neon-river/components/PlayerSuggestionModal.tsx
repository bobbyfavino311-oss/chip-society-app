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
import {
  getApiBase,
  getPlayerSessionToken,
  refreshPlayerSessionToken,
  useUser,
} from '@/context/UserContext';

interface Props {
  visible: boolean;
  onClose: () => void;
}

/**
 * Player-facing feedback form for improvement ideas.
 *
 * This intentionally uses a separate endpoint from bug reports so product
 * suggestions can be triaged independently from technical issues.
 */
export default function PlayerSuggestionModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { profile } = useUser();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  function reset() {
    setTitle('');
    setDescription('');
    setLoading(false);
    setSubmitted(false);
    setError('');
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit() {
    if (!title.trim()) {
      setError('Please add a short title.');
      return;
    }
    if (description.trim().length < 10) {
      setError('Please describe your idea in more detail.');
      return;
    }

    setLoading(true);
    setError('');

    const body = {
      title: title.trim(),
      description: description.trim(),
      playerId: profile.playerId ?? null,
      username: profile.username ?? 'Anonymous',
      deviceInfo: {
        platform: Platform.OS,
        version: Platform.Version,
      },
    };

    try {
      const sessionToken = await getPlayerSessionToken();
      if (!sessionToken) {
        setError('Please sign in again before sending a suggestion.');
        return;
      }
      const send = (token: string) => fetch(`${getApiBase()}/player-suggestions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });
      let response = await send(sessionToken);
      if (response.status === 401) {
        const refreshedToken = await refreshPlayerSessionToken();
        if (refreshedToken) response = await send(refreshedToken);
      }
      if (!response.ok) throw new Error('Server error');
      setSubmitted(true);
    } catch {
      setError('Could not send suggestion. Please try again.');
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

          <View style={s.handle} />

          <View style={s.header}>
            <View style={s.headerLeft}>
              <Ionicons name="bulb-outline" size={18} color={colors.secondary} />
              <Text style={s.headerTitle}>SHARE AN IDEA</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={s.closeBtn}>
              <Ionicons name="close" size={20} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          </View>

          {submitted ? (
            <View style={s.successWrap}>
              <View style={s.successIcon}>
                <Ionicons name="checkmark-circle" size={48} color={colors.success} />
              </View>
              <Text style={s.successTitle}>Idea Sent</Text>
              <Text style={s.successSub}>
                Thanks for helping shape Chip Society.{'\n'}
                Our team will review your idea shortly.
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
              <Text style={s.intro}>
                Have an idea that would make the table better? Tell us what you would love to see.
              </Text>

              <Text style={s.label}>TITLE</Text>
              <TextInput
                style={s.input}
                placeholder="A short title for your idea…"
                placeholderTextColor="rgba(255,255,255,0.25)"
                value={title}
                onChangeText={setTitle}
                selectionColor={colors.secondary}
                maxLength={120}
              />

              <Text style={s.label}>YOUR IDEA</Text>
              <TextInput
                style={[s.input, s.textarea]}
                placeholder="What would you improve? How would it make the game better…"
                placeholderTextColor="rgba(255,255,255,0.25)"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={5}
                selectionColor={colors.secondary}
                textAlignVertical="top"
                maxLength={1000}
              />
              <Text style={s.charCount}>{description.length}/1000</Text>

              <View style={s.autoNote}>
                <Ionicons name="person-circle-outline" size={11} color="rgba(255,255,255,0.3)" />
                <Text style={s.autoNoteText}>
                  {' '}Sending as <Text style={{ color: 'rgba(255,255,255,0.55)' }}>{profile.username ?? 'Anonymous'}</Text>
                  {' '}· {Platform.OS.toUpperCase()}
                </Text>
              </View>

              {error ? <Text style={s.errText}>{error}</Text> : null}

              <TouchableOpacity
                style={[s.submitBtn, loading && { opacity: 0.55 }]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['rgba(255,0,144,0.85)', 'rgba(191,0,100,0.85)']}
                  style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
                {loading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={s.submitText}>SEND IDEA</Text>
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
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)' },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    maxHeight: '88%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: {
    fontSize: 13,
    fontFamily: 'Orbitron_700Bold',
    color: '#fff',
    letterSpacing: 2,
  },
  closeBtn: { padding: 4 },
  form: { paddingHorizontal: 20, paddingBottom: 20, gap: 10 },
  intro: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 18,
    marginBottom: 2,
  },
  label: {
    fontSize: 9,
    fontFamily: 'Orbitron_700Bold',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2,
    marginBottom: 2,
    marginTop: 4,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 14,
  },
  textarea: { minHeight: 110, paddingTop: 12 },
  charCount: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.25)',
    textAlign: 'right',
    marginTop: -6,
  },
  autoNote: { flexDirection: 'row', alignItems: 'center', minHeight: 16 },
  autoNoteText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.28)',
    lineHeight: 16,
  },
  errText: { fontSize: 12, color: '#ff4466', textAlign: 'center' },
  submitBtn: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitText: {
    fontSize: 13,
    fontFamily: 'Orbitron_700Bold',
    color: '#fff',
    letterSpacing: 2,
  },
  successWrap: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  successIcon: { marginBottom: 4 },
  successTitle: {
    fontSize: 20,
    fontFamily: 'Orbitron_700Bold',
    color: '#fff',
    letterSpacing: 2,
  },
  successSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 20,
  },
  doneBtn: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.success,
    paddingHorizontal: 36,
    paddingVertical: 12,
  },
  doneBtnText: {
    fontSize: 12,
    fontFamily: 'Orbitron_700Bold',
    color: colors.success,
    letterSpacing: 2,
  },
});