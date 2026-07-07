import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Modal, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { STAKE_TIERS, fmtBankroll, type StakeTier } from '@/lib/stakeConfig';

function fmtK(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

interface Props {
  visible:  boolean;
  chips:    number;
  onSelect: (tier: StakeTier) => void;
  onBack?:  () => void;
  title?:   string;
}

export default function StakeSelectModal({ visible, chips, onSelect, onBack, title = 'SELECT YOUR TABLE' }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onBack}>
      <View style={s.backdrop}>
        <View style={s.sheet}>
          <LinearGradient colors={['#10002a', '#070018', '#04000f']} style={StyleSheet.absoluteFill} />
          <LinearGradient
            colors={['rgba(0,212,255,0.06)', 'transparent', 'rgba(191,95,255,0.04)']}
            style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          />

          {/* Header */}
          <View style={s.header}>
            {onBack ? (
              <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.75}>
                <Ionicons name="chevron-back" size={20} color="rgba(0,212,255,0.7)" />
              </TouchableOpacity>
            ) : <View style={s.backBtn} />}

            <View style={s.titleBlock}>
              <Text style={s.title}>{title}</Text>
              <View style={s.balRow}>
                <Ionicons name="wallet-outline" size={11} color="rgba(255,215,0,0.55)" />
                <Text style={s.balText}>{fmtBankroll(chips)}</Text>
              </View>
            </View>

            <View style={s.backBtn} />
          </View>

          {/* Tier list */}
          <ScrollView
            style={s.scroll}
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {STAKE_TIERS.map((tier) => {
              const locked = chips < tier.minBuyIn;
              const shortfall = tier.minBuyIn - chips;

              return (
                <TouchableOpacity
                  key={tier.key}
                  style={[s.tierRow, locked && s.tierRowLocked, !locked && { borderColor: `${tier.color}30` }]}
                  onPress={locked ? undefined : () => onSelect(tier)}
                  activeOpacity={locked ? 1 : 0.78}
                  disabled={locked}
                >
                  {!locked && (
                    <LinearGradient
                      colors={[`${tier.color}12`, 'transparent']}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    />
                  )}

                  {/* Left: name + description */}
                  <View style={s.tierLeft}>
                    <View style={s.tierNameRow}>
                      {locked && (
                        <Ionicons name="lock-closed" size={11} color="rgba(255,255,255,0.18)" style={{ marginRight: 4 }} />
                      )}
                      <Text style={[s.tierName, locked ? s.tierNameLocked : { color: tier.color }]}>
                        {tier.label}
                      </Text>
                    </View>
                    <Text style={s.tierDesc}>{tier.description}</Text>
                  </View>

                  {/* Right: blinds + buy-in */}
                  <View style={s.tierRight}>
                    <View style={s.statRow}>
                      <Text style={s.statLabel}>BLINDS</Text>
                      <Text style={[s.statValue, locked ? s.statValueLocked : { color: tier.color }]}>
                        {fmtK(tier.smallBlind)}/{fmtK(tier.bigBlind)}
                      </Text>
                    </View>
                    <View style={s.statRow}>
                      <Text style={s.statLabel}>{locked ? 'NEED' : 'BUY-IN'}</Text>
                      <Text style={[s.statValueSm, locked && s.needText]}>
                        {locked
                          ? fmtBankroll(shortfall) + ' MORE'
                          : `${fmtK(tier.minBuyIn)}–${fmtK(tier.maxBuyIn)}`
                        }
                      </Text>
                    </View>
                  </View>

                  {/* Arrow */}
                  {!locked && (
                    <Ionicons name="chevron-forward" size={14} color={`${tier.color}80`} style={{ marginLeft: 4 }} />
                  )}
                </TouchableOpacity>
              );
            })}

            <Text style={s.note}>Select a stake that matches your bankroll.{'\n'}Higher stakes = bigger rewards.</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.82)', justifyContent: 'flex-end' },
  sheet:          {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    overflow: 'hidden', maxHeight: '90%',
    borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1,
    borderColor: 'rgba(0,212,255,0.18)',
  },

  header:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 14 },
  backBtn:        { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  titleBlock:     { flex: 1, alignItems: 'center', gap: 4 },
  title:          { fontSize: 13, fontFamily: 'Orbitron_900Black', color: '#fff', letterSpacing: 2.5 },
  balRow:         { flexDirection: 'row', alignItems: 'center', gap: 5 },
  balText:        { fontSize: 13, fontFamily: 'Inter_700Bold', color: 'rgba(255,215,0,0.8)' },

  scroll:         { flexShrink: 1 },
  scrollContent:  { paddingHorizontal: 14, paddingBottom: 30, gap: 8 },

  tierRow:        {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, borderRadius: 14, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
  },
  tierRowLocked:  { opacity: 0.42, backgroundColor: 'rgba(255,255,255,0.018)' },

  tierLeft:       { flex: 1, gap: 3 },
  tierNameRow:    { flexDirection: 'row', alignItems: 'center' },
  tierName:       { fontSize: 12, fontFamily: 'Orbitron_900Black', letterSpacing: 1 },
  tierNameLocked: { color: 'rgba(255,255,255,0.25)' },
  tierDesc:       { fontSize: 9, color: 'rgba(255,255,255,0.35)', fontFamily: 'Inter_400Regular', letterSpacing: 0.2 },

  tierRight:      { alignItems: 'flex-end', gap: 4 },
  statRow:        { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statLabel:      { fontSize: 8, fontFamily: 'Orbitron_700Bold', color: 'rgba(255,255,255,0.25)', letterSpacing: 1 },
  statValue:      { fontSize: 13, fontFamily: 'Inter_700Bold' },
  statValueLocked:{ color: 'rgba(255,255,255,0.22)' },
  statValueSm:    { fontSize: 10, fontFamily: 'Inter_700Bold', color: 'rgba(255,255,255,0.35)' },
  needText:       { color: '#ff5555' },

  note:           { fontSize: 9, color: 'rgba(255,255,255,0.22)', textAlign: 'center', lineHeight: 14, marginTop: 8 },
});
