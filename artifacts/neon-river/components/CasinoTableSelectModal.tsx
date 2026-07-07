import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Modal, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CASINO_TABLE_LIMITS, fmtCasino, type CasinoTableLimit } from '@/lib/casinoTableLimits';

function fmtBalance(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${Math.floor(n / 1_000)}K`;
  return n.toLocaleString();
}

interface Props {
  visible:  boolean;
  chips:    number;
  onSelect: (limit: CasinoTableLimit) => void;
  onBack?:  () => void;
  title?:   string;
}

export default function CasinoTableSelectModal({
  visible, chips, onSelect, onBack, title = 'SELECT TABLE LIMIT',
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onBack}>
      <View style={s.backdrop}>
        <View style={s.sheet}>
          <LinearGradient colors={['#10002a', '#070018', '#04000f']} style={StyleSheet.absoluteFill} />
          <LinearGradient
            colors={['rgba(191,95,255,0.07)', 'transparent', 'rgba(255,0,144,0.04)']}
            style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          />

          {/* Header */}
          <View style={s.header}>
            {onBack ? (
              <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.75}>
                <Ionicons name="chevron-back" size={20} color="rgba(191,95,255,0.7)" />
              </TouchableOpacity>
            ) : <View style={s.backBtn} />}

            <View style={s.titleBlock}>
              <Text style={s.title}>{title}</Text>
              <View style={s.balRow}>
                <Ionicons name="wallet-outline" size={11} color="rgba(255,215,0,0.55)" />
                <Text style={s.balText}>{fmtBalance(chips)}</Text>
              </View>
            </View>

            <View style={s.backBtn} />
          </View>

          {/* Table list */}
          <ScrollView
            style={s.scroll}
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {CASINO_TABLE_LIMITS.map((limit) => {
              const locked = chips < limit.minBuyIn;
              const shortfall = limit.minBuyIn - chips;

              return (
                <TouchableOpacity
                  key={limit.key}
                  style={[s.row, locked && s.rowLocked, !locked && { borderColor: `${limit.color}30` }]}
                  onPress={locked ? undefined : () => onSelect(limit)}
                  activeOpacity={locked ? 1 : 0.78}
                  disabled={locked}
                >
                  {!locked && (
                    <LinearGradient
                      colors={[`${limit.color}12`, 'transparent']}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    />
                  )}

                  {/* Left: name + description */}
                  <View style={s.rowLeft}>
                    <View style={s.nameRow}>
                      {locked && (
                        <Ionicons name="lock-closed" size={11} color="rgba(255,255,255,0.18)" style={{ marginRight: 4 }} />
                      )}
                      <Text style={[s.rowName, locked ? s.rowNameLocked : { color: limit.color }]}>
                        {limit.label}
                      </Text>
                    </View>
                    <Text style={s.rowDesc}>{limit.description}</Text>
                  </View>

                  {/* Right: bet range + buy-in */}
                  <View style={s.rowRight}>
                    <View style={s.statRow}>
                      <Text style={s.statLabel}>BET</Text>
                      <Text style={[s.statValue, locked ? s.statLocked : { color: limit.color }]}>
                        {fmtCasino(limit.minBet)}–{fmtCasino(limit.maxBet)}
                      </Text>
                    </View>
                    <View style={s.statRow}>
                      <Text style={s.statLabel}>{locked ? 'NEED' : 'BUY-IN'}</Text>
                      <Text style={[s.statValueSm, locked && s.needText]}>
                        {locked
                          ? fmtBalance(shortfall) + ' MORE'
                          : `${fmtCasino(limit.minBuyIn)}–${fmtCasino(limit.maxBuyIn)}`
                        }
                      </Text>
                    </View>
                  </View>

                  {!locked && (
                    <Ionicons name="chevron-forward" size={14} color={`${limit.color}80`} style={{ marginLeft: 4 }} />
                  )}
                </TouchableOpacity>
              );
            })}

            <Text style={s.note}>
              Casino table limits are separate from poker stakes.{'\n'}
              Min Bet · Max Bet · Buy-In range shown above.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.82)', justifyContent: 'flex-end' },
  sheet:        {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    overflow: 'hidden', maxHeight: '90%',
    borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1,
    borderColor: 'rgba(191,95,255,0.18)',
  },
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 14 },
  backBtn:      { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  titleBlock:   { flex: 1, alignItems: 'center', gap: 4 },
  title:        { fontSize: 13, fontFamily: 'Orbitron_900Black', color: '#fff', letterSpacing: 2.5 },
  balRow:       { flexDirection: 'row', alignItems: 'center', gap: 5 },
  balText:      { fontSize: 13, fontFamily: 'Inter_700Bold', color: 'rgba(255,215,0,0.8)' },
  scroll:       { flexShrink: 1 },
  scrollContent:{ paddingHorizontal: 14, paddingBottom: 30, gap: 8 },
  row:          {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, borderRadius: 14, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)', overflow: 'hidden',
  },
  rowLocked:    { opacity: 0.42, backgroundColor: 'rgba(255,255,255,0.018)' },
  rowLeft:      { flex: 1, gap: 3 },
  nameRow:      { flexDirection: 'row', alignItems: 'center' },
  rowName:      { fontSize: 12, fontFamily: 'Orbitron_900Black', letterSpacing: 1 },
  rowNameLocked:{ color: 'rgba(255,255,255,0.25)' },
  rowDesc:      { fontSize: 9, color: 'rgba(255,255,255,0.35)', fontFamily: 'Inter_400Regular', letterSpacing: 0.2 },
  rowRight:     { alignItems: 'flex-end', gap: 4 },
  statRow:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statLabel:    { fontSize: 8, fontFamily: 'Orbitron_700Bold', color: 'rgba(255,255,255,0.25)', letterSpacing: 1 },
  statValue:    { fontSize: 13, fontFamily: 'Inter_700Bold' },
  statLocked:   { color: 'rgba(255,255,255,0.22)' },
  statValueSm:  { fontSize: 10, fontFamily: 'Inter_700Bold', color: 'rgba(255,255,255,0.35)' },
  needText:     { color: '#ff5555' },
  note:         { fontSize: 9, color: 'rgba(255,255,255,0.22)', textAlign: 'center', lineHeight: 14, marginTop: 8 },
});
