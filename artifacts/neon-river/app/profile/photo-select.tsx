// ─── Avatar Select Hub ─────────────────────────────────────────────────────────
// Central screen for choosing between a Neon Symbol Avatar or a Custom Photo.

import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useUser } from '@/context/UserContext';
import { getNeonAvatar, NEON_AVATARS, NEON_RARITY_COLORS } from '@/constants/neonAvatars';
import NeonAvatarView from '@/components/NeonAvatar';

export default function PhotoSelectScreen() {
  const insets = useSafeAreaInsets();
  const { profile, updateProfile } = useUser();
  const [busy, setBusy] = useState(false);

  const symbolId   = profile.symbolIndex && profile.symbolIndex > 0 ? profile.symbolIndex : 1;
  const avatar     = getNeonAvatar(symbolId);
  const isCustom   = profile.profileImageType === 'custom' && !!profile.avatarUri;
  const isSymbol   = !isCustom;
  const rarityColor = NEON_RARITY_COLORS[avatar.rarity];

  const launchPicker = async (source: 'gallery' | 'camera') => {
    if (Platform.OS !== 'web') {
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Camera access needed', 'Allow camera access in Settings to take a profile photo.');
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Library access needed', 'Allow photo library access in Settings to upload a profile photo.');
          return;
        }
      }
    }

    setBusy(true);
    try {
      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.85 })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.85,
          });

      if (!result.canceled && result.assets[0]) {
        await updateProfile({ avatarUri: result.assets[0].uri, profileImageType: 'custom' });
        router.back();
      }
    } catch {
      Alert.alert('Upload failed', 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const removeCustomPhoto = async () => {
    await updateProfile({ avatarUri: undefined, profileImageType: 'symbol' });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#0d0020', '#050010', '#0d0020']}
        style={StyleSheet.absoluteFill}
      />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.75}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>AVATAR</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* ── Current preview ────────────────────────────────────────────────── */}
      <View style={styles.previewArea}>
        <View style={[styles.previewFrame, { borderColor: isCustom ? '#ff0090' : rarityColor }]}>
          {isCustom ? (
            <Image source={{ uri: profile.avatarUri }} style={styles.previewImg} resizeMode="cover" />
          ) : (
            <NeonAvatarView avatarId={symbolId} size={164} />
          )}
        </View>
        <View style={[
          styles.activeBadge,
          { backgroundColor: isCustom ? '#ff009018' : '#00d4ff18', borderColor: isCustom ? '#ff009055' : '#00d4ff55' },
        ]}>
          <View style={[styles.activeDot, { backgroundColor: isCustom ? '#ff0090' : '#00d4ff' }]} />
          <Text style={[styles.activeBadgeText, { color: isCustom ? '#ff0090' : '#00d4ff' }]}>
            {isCustom ? 'CUSTOM PHOTO ACTIVE' : `${avatar.name.toUpperCase()} ACTIVE`}
          </Text>
        </View>
      </View>

      {/* ── Options ────────────────────────────────────────────────────────── */}
      <View style={styles.options}>

        {/* Neon Symbol Avatar */}
        <TouchableOpacity
          style={[styles.optionRow, isSymbol && styles.optionRowActive]}
          onPress={() => router.push('/profile/avatar-select')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['rgba(0,212,255,0.08)', 'transparent']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.optionIconWrap}>
            <NeonAvatarView avatarId={symbolId} size={36} />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>SELECT AN AVATAR</Text>
            <Text style={styles.optionSub}>Choose from {NEON_AVATARS.length} unique avatars</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="rgba(0,212,255,0.5)" />
        </TouchableOpacity>

        {/* Custom Photo */}
        <View style={[styles.uploadSection, isCustom && styles.uploadSectionActive]}>
          <LinearGradient
            colors={['rgba(255,0,144,0.06)', 'transparent']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.uploadHeader}>
            <Ionicons name="camera" size={20} color="#ff0090" />
            <View style={{ flex: 1 }}>
              <Text style={styles.uploadTitle}>CUSTOM PHOTO</Text>
              <Text style={styles.uploadSub}>Upload your own portrait — square crop</Text>
            </View>
          </View>

          <View style={styles.uploadBtnRow}>
            <TouchableOpacity
              style={styles.uploadBtn}
              onPress={() => launchPicker('gallery')}
              activeOpacity={0.8}
              disabled={busy}
            >
              <Ionicons name="images-outline" size={18} color="#ff0090" />
              <Text style={styles.uploadBtnLabel}>GALLERY</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.uploadBtn}
              onPress={() => launchPicker('camera')}
              activeOpacity={0.8}
              disabled={busy}
            >
              <Ionicons name="camera-outline" size={18} color="#ff0090" />
              <Text style={styles.uploadBtnLabel}>CAMERA</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.disclaimer}>
            Profile photos must follow community guidelines.
          </Text>
        </View>

        {isCustom && (
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={removeCustomPhoto}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={15} color="#ff4444" />
            <Text style={styles.removeText}>REMOVE CUSTOM PHOTO</Text>
          </TouchableOpacity>
        )}
      </View>

      {busy && (
        <View style={styles.busyOverlay}>
          <ActivityIndicator size="large" color="#ff0090" />
          <Text style={styles.busyText}>PROCESSING...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050010' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'Orbitron_700Bold', fontSize: 13, color: '#fff', letterSpacing: 2 },

  previewArea: { alignItems: 'center', paddingVertical: 20, gap: 12 },
  previewFrame: {
    width: 164,
    height: 164,
    borderRadius: 18,
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: '#0a0025',
  },
  previewImg: { width: '100%', height: '100%' },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  activeDot: { width: 6, height: 6, borderRadius: 3 },
  activeBadgeText: { fontFamily: 'Orbitron_700Bold', fontSize: 9, letterSpacing: 1.5 },

  options: { flex: 1, paddingHorizontal: 16, gap: 10 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
    overflow: 'hidden',
  },
  optionRowActive: { borderColor: 'rgba(0,212,255,0.35)' },
  optionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  optionContent: { flex: 1, gap: 3 },
  optionTitle: { fontFamily: 'Orbitron_700Bold', fontSize: 11, color: '#fff', letterSpacing: 1 },
  optionSub: {
    fontFamily: 'Orbitron_400Regular',
    fontSize: 9,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.5,
  },

  uploadSection: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 14,
    gap: 10,
    overflow: 'hidden',
  },
  uploadSectionActive: { borderColor: 'rgba(255,0,144,0.35)' },
  uploadHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  uploadTitle: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 11,
    color: '#fff',
    letterSpacing: 1,
    marginBottom: 3,
  },
  uploadSub: {
    fontFamily: 'Orbitron_400Regular',
    fontSize: 9,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.5,
  },
  uploadBtnRow: { flexDirection: 'row', gap: 10 },
  uploadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: 'rgba(255,0,144,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,0,144,0.3)',
  },
  uploadBtnLabel: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 10,
    color: '#ff0090',
    letterSpacing: 1.5,
  },
  disclaimer: {
    fontFamily: 'Orbitron_400Regular',
    fontSize: 8,
    color: 'rgba(255,255,255,0.25)',
    letterSpacing: 0.3,
    lineHeight: 13,
    textAlign: 'center',
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,68,68,0.3)',
    backgroundColor: 'rgba(255,68,68,0.06)',
  },
  removeText: { fontFamily: 'Orbitron_700Bold', fontSize: 10, color: '#ff4444', letterSpacing: 1.5 },
  busyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5,0,16,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  busyText: { fontFamily: 'Orbitron_700Bold', fontSize: 11, color: '#ff0090', letterSpacing: 2 },
});
