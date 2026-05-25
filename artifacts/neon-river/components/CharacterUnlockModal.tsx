// ─── CharacterUnlockModal — cinematic full-screen character reveal ─────────────
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Character, RARITY_COLORS } from '@/constants/characters';
import CHARACTER_IMAGES from '@/constants/characterImages';

interface CharacterUnlockModalProps {
  character: Character | null;
  visible: boolean;
  onClose: () => void;
}

export default function CharacterUnlockModal({
  character,
  visible,
  onClose,
}: CharacterUnlockModalProps) {
  const scaleAnim   = useRef(new Animated.Value(0.4)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const glowAnim    = useRef(new Animated.Value(0.3)).current;
  const titleAnim   = useRef(new Animated.Value(0)).current;
  const imgScaleAnim = useRef(new Animated.Value(1.08)).current;

  useEffect(() => {
    if (visible && character) {
      scaleAnim.setValue(0.4);
      opacityAnim.setValue(0);
      titleAnim.setValue(0);
      imgScaleAnim.setValue(1.1);

      Animated.sequence([
        Animated.parallel([
          Animated.spring(scaleAnim,    { toValue: 1,   friction: 5, tension: 60, useNativeDriver: true }),
          Animated.timing(opacityAnim,  { toValue: 1,   duration: 300, useNativeDriver: true }),
          Animated.timing(imgScaleAnim, { toValue: 1,   duration: 600, useNativeDriver: true }),
        ]),
        Animated.timing(titleAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1,   duration: 900, useNativeDriver: false }),
          Animated.timing(glowAnim, { toValue: 0.3, duration: 900, useNativeDriver: false }),
        ])
      ).start();
    }
  }, [visible, character]);

  if (!character) return null;

  const rarityColor = RARITY_COLORS[character.rarity];
  const img = CHARACTER_IMAGES[character.id];

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={styles.overlay}>
        {/* Dark cinematic backdrop */}
        <LinearGradient
          colors={['rgba(0,0,0,0.95)', 'rgba(5,0,16,0.98)', 'rgba(0,0,0,0.95)']}
          style={StyleSheet.absoluteFill}
        />

        {/* Rarity glow orb */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.glowRing,
            { backgroundColor: rarityColor, opacity: glowAnim },
          ]}
        />

        {/* Content */}
        <Animated.View
          style={[
            styles.content,
            { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* Unlock badge */}
          <Animated.View style={{ opacity: titleAnim, alignItems: 'center', marginBottom: 18 }}>
            <View style={[styles.unlockBadge, { borderColor: rarityColor + '88', backgroundColor: rarityColor + '1a' }]}>
              <Text style={[styles.unlockLabel, { color: rarityColor }]}>
                CHARACTER UNLOCKED
              </Text>
            </View>
          </Animated.View>

          {/* Portrait — large cinematic */}
          <View style={[styles.portraitWrap, { borderColor: rarityColor }]}>
            {/* Background gradient matching character */}
            <LinearGradient
              colors={[character.portraitColors[0], character.portraitColors[1], character.portraitColors[2]]}
              style={StyleSheet.absoluteFill}
            />

            {/* Portrait image with Ken Burns zoom */}
            {img ? (
              <Animated.Image
                source={img}
                style={[styles.portraitImg, { transform: [{ scale: imgScaleAnim }] }]}
                resizeMode="cover"
              />
            ) : null}

            {/* Bottom fade */}
            <LinearGradient
              colors={['transparent', 'rgba(5,0,16,0.55)']}
              style={styles.portraitBottomFade}
            />

            {/* Rarity glow at bottom edge */}
            <View style={[styles.rarityBar, { backgroundColor: rarityColor }]} />
          </View>

          {/* Rarity tag */}
          <View style={[styles.rarityTag, { borderColor: rarityColor + '66', backgroundColor: rarityColor + '1a' }]}>
            <Text style={[styles.rarityText, { color: rarityColor }]}>{character.rarity}</Text>
          </View>

          {/* Character name */}
          <Animated.Text style={[styles.characterName, { opacity: titleAnim }]}>
            {character.name}
          </Animated.Text>

          {/* Bio */}
          <Text style={styles.bio}>{character.bio}</Text>

          {/* CTA */}
          <TouchableOpacity
            style={[styles.equipBtn, { borderColor: rarityColor, backgroundColor: rarityColor + '22' }]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={[styles.equipBtnText, { color: rarityColor }]}>EQUIP NOW</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={onClose} activeOpacity={0.6}>
            <Text style={styles.skipText}>Save for later</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: 420,
    height: 420,
    borderRadius: 210,
    alignSelf: 'center',
    opacity: 0.12,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 28,
    gap: 0,
    width: '100%',
  },
  unlockBadge: {
    borderWidth: 1, borderRadius: 6,
    paddingHorizontal: 16, paddingVertical: 6,
  },
  unlockLabel: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 10,
    letterSpacing: 3,
  },
  portraitWrap: {
    width: 200,
    height: 240,
    borderRadius: 16,
    borderWidth: 2.5,
    overflow: 'hidden',
    backgroundColor: '#0a0020',
    position: 'relative',
  },
  portraitImg: {
    width: '100%',
    height: '100%',
  },
  portraitBottomFade: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 60,
  },
  rarityBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 3,
    opacity: 0.9,
  },
  rarityTag: {
    borderWidth: 1, borderRadius: 5,
    paddingHorizontal: 12, paddingVertical: 3,
    marginTop: 16,
  },
  rarityText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 9, letterSpacing: 2,
  },
  characterName: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 22,
    color: '#ffffff',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginTop: 10,
  },
  bio: {
    fontFamily: 'Orbitron_400Regular',
    fontSize: 10,
    color: '#7080a8',
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 10,
    maxWidth: 280,
  },
  equipBtn: {
    marginTop: 24,
    paddingHorizontal: 40, paddingVertical: 14,
    borderRadius: 30, borderWidth: 1.5,
  },
  equipBtnText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 13, letterSpacing: 3,
  },
  skipBtn: { marginTop: 14, paddingVertical: 8 },
  skipText: {
    color: '#445566',
    fontSize: 12,
    fontFamily: 'Orbitron_400Regular',
    letterSpacing: 1,
  },
});
