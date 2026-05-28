import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useRef, useMemo, useState } from 'react';
import {
  Animated,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useTheme } from '@/context/ThemeContext';
import type { Colors } from '@/constants/colors';
import { useUser } from '@/context/UserContext';
import { GuestBanner } from '@/components/GuestBanner';
import type { GameVariant } from '@/constants/gameVariants';
import { VARIANT_CONFIGS } from '@/constants/gameVariants';

// ─── Styles ───────────────────────────────────────────────────────────────────
function createStyles(c: Colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    scroll: { paddingHorizontal: 16, gap: 14 },
    pageTitle: { color: c.text, fontSize: 22, fontWeight: '800', fontFamily: 'Orbitron_900Black', letterSpacing: 3 },
    pageSub: { color: c.textMuted, fontSize: 13, marginTop: -6 },

    variantCard: {
      borderRadius: 18, borderWidth: 1, overflow: 'hidden',
      paddingVertical: 0, marginBottom: 2,
    },
    variantHeader: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10, gap: 12,
    },
    variantIconWrap: {
      width: 42, height: 42, borderRadius: 12, borderWidth: 1,
      alignItems: 'center', justifyContent: 'center',
    },
    variantTitle: {
      fontSize: 14, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 0.5,
    },
    variantDeckLabel: {
      fontSize: 10, marginTop: 2,
    },
    variantRankNote: {
      fontSize: 9, fontWeight: '700', letterSpacing: 0.8, marginTop: 1,
    },
    variantDivider: { height: 1, marginHorizontal: 16, opacity: 0.18 },
    variantActions: {
      flexDirection: 'row', padding: 12, gap: 8,
    },
    actionBtn: {
      flex: 1, borderRadius: 12, borderWidth: 1, overflow: 'hidden',
      paddingVertical: 12, alignItems: 'center', gap: 4,
    },
    actionBtnLabel: {
      fontSize: 9, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 0.8,
    },
    actionBtnSub: {
      fontSize: 8, fontWeight: '600',
    },
    rulesChip: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      paddingHorizontal: 16, paddingBottom: 14, paddingTop: 2,
    },
    rulesChipText: {
      fontSize: 9, fontWeight: '700', letterSpacing: 0.8,
    },

    actionBtnLocked: {
      borderColor: 'rgba(255,255,255,0.07)',
      backgroundColor: 'rgba(255,255,255,0.03)',
    },
    actionBtnLabelLocked: {
      color: 'rgba(255,255,255,0.2)',
    },
    soonChip: {
      borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2,
      backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    },
    soonText: {
      fontSize: 7, fontWeight: '800', letterSpacing: 0.8, color: 'rgba(255,255,255,0.25)',
    },

    sectionTitle: {
      color: c.textMuted, fontSize: 10, fontWeight: '700',
      letterSpacing: 2, fontFamily: 'Orbitron_400Regular', marginBottom: -4,
    },
    infoCard: {
      borderRadius: 12, borderWidth: 1, borderColor: c.primaryDim,
      padding: 14, flexDirection: 'row', alignItems: 'flex-start',
      gap: 10, overflow: 'hidden', backgroundColor: c.surface,
    },
    infoText: { color: c.textMuted, fontSize: 11, lineHeight: 17, flex: 1 },

    // Rules modal
    overlay: { flex: 1, backgroundColor: 'rgba(5,0,16,0.88)', justifyContent: 'flex-end' },
    rulesModal: {
      backgroundColor: '#0d0025', borderTopLeftRadius: 24, borderTopRightRadius: 24,
      borderWidth: 1, borderColor: '#ff009055', padding: 24, gap: 16,
    },
    rulesModalTitle: {
      color: '#ff0090', fontSize: 16, fontWeight: '900',
      fontFamily: 'Orbitron_700Bold', letterSpacing: 1, textAlign: 'center',
    },
    rulesModalSub: {
      color: '#bf5fff', fontSize: 11, textAlign: 'center', marginTop: -8,
    },
    ruleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    ruleDot: {
      width: 6, height: 6, borderRadius: 3, marginTop: 5,
    },
    ruleText: { color: '#ccc', fontSize: 12, lineHeight: 18, flex: 1 },
    ruleTextBold: { color: '#ff0090', fontWeight: '800' },
    dismissBtn: {
      borderRadius: 12, borderWidth: 1, borderColor: '#ff009066',
      backgroundColor: '#ff009022', paddingVertical: 14,
      alignItems: 'center', marginTop: 4,
    },
    dismissBtnText: {
      color: '#ff0090', fontSize: 12, fontWeight: '900',
      fontFamily: 'Orbitron_700Bold', letterSpacing: 1,
    },
  });
}

// ─── Short Deck Rules Modal ───────────────────────────────────────────────────
function ShortDeckRulesModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const cfg = VARIANT_CONFIGS.short_deck_holdem;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.rulesModal}>
          <Text style={styles.rulesModalTitle}>SHORT DECK HOLD'EM</Text>
          <Text style={styles.rulesModalSub}>6-Plus Hold'em · 36-card deck</Text>

          {cfg.rulesPoints.map((point, i) => {
            const isBold = point.includes('FLUSH BEATS');
            return (
              <View key={i} style={styles.ruleRow}>
                <View style={[styles.ruleDot, { backgroundColor: isBold ? '#ff0090' : '#bf5fff' }]} />
                {isBold ? (
                  <Text style={[styles.ruleText, styles.ruleTextBold]}>{point}</Text>
                ) : (
                  <Text style={styles.ruleText}>{point}</Text>
                )}
              </View>
            );
          })}

          <TouchableOpacity style={styles.dismissBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.dismissBtnText}>UNDERSTOOD</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Variant Card ─────────────────────────────────────────────────────────────
interface VariantCardProps {
  variant: GameVariant;
  onAIPractice: () => void;
  onRules?: () => void;
}

function VariantCard({ variant, onAIPractice, onRules }: VariantCardProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const cfg = VARIANT_CONFIGS[variant];
  const c = cfg.color;
  const a = cfg.accentColor;

  const scaleAI = useRef(new Animated.Value(1)).current;

  const pressIn  = (v: Animated.Value) => () => Animated.spring(v, { toValue: 0.95, useNativeDriver: true }).start();
  const pressOut = (v: Animated.Value) => () => Animated.spring(v, { toValue: 1, useNativeDriver: true }).start();

  return (
    <View style={[styles.variantCard, { borderColor: `${c}44` }]}>
      <LinearGradient
        colors={[`${c}14`, `${a}08`, 'transparent']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />

      {/* Header */}
      <View style={styles.variantHeader}>
        <View style={[styles.variantIconWrap, { backgroundColor: `${c}20`, borderColor: `${c}40` }]}>
          <Ionicons
            name={variant === 'short_deck_holdem' ? 'layers-outline' : 'card-outline'}
            size={22}
            color={c}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.variantTitle, { color: c }]}>{cfg.label.toUpperCase()}</Text>
          <Text style={[styles.variantDeckLabel, { color: colors.textMuted }]}>{cfg.deckLabel}</Text>
          <Text style={[styles.variantRankNote, { color: `${c}aa` }]}>{cfg.rankingNote}</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={[styles.variantDivider, { backgroundColor: c }]} />

      {/* Action buttons */}
      <View style={styles.variantActions}>

        {/* AI PRACTICE — open */}
        <Animated.View style={{ flex: 1, transform: [{ scale: scaleAI }] }}>
          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: `${c}55`, backgroundColor: `${c}10` }]}
            onPress={onAIPractice}
            onPressIn={pressIn(scaleAI)}
            onPressOut={pressOut(scaleAI)}
            activeOpacity={1}
          >
            <LinearGradient
              colors={[`${c}18`, 'transparent']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
            />
            <Ionicons name="flash" size={18} color={c} />
            <Text style={[styles.actionBtnLabel, { color: c }]}>AI PRACTICE</Text>
            <Text style={[styles.actionBtnSub, { color: `${c}99` }]}>Offline · Ready</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* QUICK MATCH — locked */}
        <View style={{ flex: 1 }}>
          <View style={[styles.actionBtn, styles.actionBtnLocked]}>
            <Ionicons name="lock-closed-outline" size={16} color="rgba(255,255,255,0.2)" />
            <Text style={[styles.actionBtnLabel, styles.actionBtnLabelLocked]}>QUICK MATCH</Text>
            <View style={styles.soonChip}>
              <Text style={styles.soonText}>SOON</Text>
            </View>
          </View>
        </View>

        {/* RANKED — locked */}
        <View style={{ flex: 1 }}>
          <View style={[styles.actionBtn, styles.actionBtnLocked]}>
            <Ionicons name="lock-closed-outline" size={16} color="rgba(255,255,255,0.2)" />
            <Text style={[styles.actionBtnLabel, styles.actionBtnLabelLocked]}>RANKED</Text>
            <View style={styles.soonChip}>
              <Text style={styles.soonText}>SOON</Text>
            </View>
          </View>
        </View>

      </View>

      {/* Rules chip for Short Deck */}
      {onRules && (
        <TouchableOpacity style={styles.rulesChip} onPress={onRules} activeOpacity={0.75}>
          <Ionicons name="information-circle-outline" size={13} color={`${c}cc`} />
          <Text style={[styles.rulesChipText, { color: `${c}cc` }]}>SHORT DECK RULES</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────────
export default function PlayScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useUser();
  const colors = useColors();
  const { isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [shortDeckRulesVisible, setShortDeckRulesVisible] = useState(false);

  const bgGradient = isDark
    ? ([colors.background, '#0a001e', colors.background] as const)
    : ([colors.background, colors.surfaceElevated, colors.background] as const);

  const goAIPractice = (variant: GameVariant) => {
    router.push(`/game/practice?variant=${variant}` as any);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={bgGradient}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />

      {profile.isGuest && (
        <GuestBanner message="Guest mode — create a free account to unlock Ranked & cloud saves" />
      )}

      <ShortDeckRulesModal
        visible={shortDeckRulesVisible}
        onClose={() => setShortDeckRulesVisible(false)}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 16), paddingBottom: insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>PLAY MODES</Text>
        <Text style={styles.pageSub}>Jump in and play</Text>

        <Text style={styles.sectionTitle}>TRADITIONAL HOLD'EM</Text>
        <VariantCard
          variant="texas_holdem"
          onAIPractice={() => goAIPractice('texas_holdem')}
        />

        <Text style={styles.sectionTitle}>SHORT DECK HOLD'EM</Text>
        <VariantCard
          variant="short_deck_holdem"
          onAIPractice={() => goAIPractice('short_deck_holdem')}
          onRules={() => setShortDeckRulesVisible(true)}
        />

        <View style={styles.infoCard}>
          <LinearGradient colors={[colors.primaryDim, 'transparent']} style={StyleSheet.absoluteFill} />
          <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
          <Text style={styles.infoText}>
            AI Practice is always available offline. Quick Match and Ranked are coming soon — tournament discovery is on the Home screen.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
