// ─── CharacterUnlockModal — cinematic new character reveal ────────────────────
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Character, RARITY_COLORS } from '@/constants/characters';
import CharacterPortrait from '@/components/CharacterPortrait';

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

  useEffect(() => {
    if (visible && character) {
      scaleAnim.setValue(0.4);
      opacityAnim.setValue(0);
      titleAnim.setValue(0);

      Animated.sequence([
        Animated.parallel([
          Animated.spring(scaleAnim,   { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]),
        Animated.timing(titleAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1,   duration: 800, useNativeDriver: false }),
          Animated.timing(glowAnim, { toValue: 0.3, duration: 800, useNativeDriver: false }),
        ])
      ).start();
    }
  }, [visible, character]);

  if (!character) return null;

  const rarityColor = RARITY_COLORS[character.rarity];

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={styles.overlay}>
        {/* Dark backdrop */}
        <LinearGradient
          colors={['rgba(0,0,0,0.92)', 'rgba(5,0,16,0.97)', 'rgba(0,0,0,0.92)']}
          style={StyleSheet.absoluteFill}
        />

        {/* Animated glow background ring */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.glowRing,
            {
              backgroundColor: character.accentColor,
              opacity: glowAnim,
            },
          ]}
        />

        {/* Content */}
        <Animated.View
          style={[
            styles.content,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Unlock label */}
          <Animated.View style={{ opacity: titleAnim, alignItems: 'center', marginBottom: 20 }}>
            <View style={[styles.unlockBadge, { borderColor: rarityColor + '88', backgroundColor: rarityColor + '22' }]}>
              <Text style={[styles.unlockLabel, { color: rarityColor }]}>
                NEW CHARACTER UNLOCKED
              </Text>
            </View>
          </Animated.View>

          {/* Portrait — large */}
          <CharacterPortrait
            character={character}
            size={160}
            isEquipped={false}
            isLocked={false}
          />

          {/* Rarity tag */}
          <View style={[styles.rarityTag, { borderColor: rarityColor + '66', backgroundColor: rarityColor + '22' }]}>
            <Text style={[styles.rarityText, { color: rarityColor }]}>{character.rarity}</Text>
          </View>

          {/* Character name */}
          <Text style={styles.characterName}>{character.name}</Text>

          {/* Bio */}
          <Text style={styles.bio}>{character.bio}</Text>

          {/* Equip / dismiss button */}
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
    width: 400,
    height: 400,
    borderRadius: 200,
    alignSelf: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 0,
  },
  unlockBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  unlockLabel: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 11,
    letterSpacing: 3,
    fontWeight: '900',
  },
  rarityTag: {
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 3,
    marginTop: 18,
  },
  rarityText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
  },
  characterName: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: 10,
  },
  bio: {
    fontFamily: 'Orbitron_400Regular',
    fontSize: 11,
    color: '#8090a8',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 10,
    maxWidth: 280,
  },
  equipBtn: {
    marginTop: 28,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 30,
    borderWidth: 1.5,
  },
  equipBtnText: {
    fontFamily: 'Orbitron_700Bold',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 3,
  },
  skipBtn: {
    marginTop: 14,
    paddingVertical: 8,
  },
  skipText: {
    color: '#445566',
    fontSize: 12,
    fontFamily: 'Orbitron_400Regular',
    letterSpacing: 1,
  },
});
