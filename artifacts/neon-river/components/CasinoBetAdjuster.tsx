import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fmtCasino, type CasinoTableLimit } from '../lib/casinoTableLimits';

interface Props {
  value: number;
  limit: CasinoTableLimit;
  onChange: (v: number) => void;
  label?: string;
  accent?: string;
  disabled?: boolean;
}

export default function CasinoBetAdjuster({
  value,
  limit,
  onChange,
  label = 'MAIN BET',
  accent = '#ffd700',
  disabled = false,
}: Props) {
  const inc    = limit.minBet;
  const canDec = !disabled && value > limit.minBet;
  const canInc = !disabled && value < limit.maxBet;

  return (
    <View style={s.container}>
      <Text style={[s.label, { color: `${accent}99` }]}>{label}</Text>

      <View style={s.row}>
        <TouchableOpacity
          style={[s.btn, { borderColor: `${accent}30` }, !canDec && s.btnDim]}
          onPress={() => { if (canDec) onChange(Math.max(limit.minBet, value - inc)); }}
          disabled={!canDec}
          activeOpacity={0.65}
          hitSlop={8}
        >
          <Ionicons name="remove" size={22} color={canDec ? accent : 'rgba(255,255,255,0.18)'} />
        </TouchableOpacity>

        <View style={[s.display, { borderColor: `${accent}45` }]}>
          <Text style={[s.amount, { color: accent, fontFamily: 'Inter_700Bold' }]}>
            {fmtCasino(value)}
          </Text>
        </View>

        <TouchableOpacity
          style={[s.btn, { borderColor: `${accent}30` }, !canInc && s.btnDim]}
          onPress={() => { if (canInc) onChange(Math.min(limit.maxBet, value + inc)); }}
          disabled={!canInc}
          activeOpacity={0.65}
          hitSlop={8}
        >
          <Ionicons name="add" size={22} color={canInc ? accent : 'rgba(255,255,255,0.18)'} />
        </TouchableOpacity>
      </View>

      <Text style={s.range}>
        MIN {fmtCasino(limit.minBet)}  ·  MAX {fmtCasino(limit.maxBet)}  ·  STEP {fmtCasino(inc)}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  label: {
    fontSize: 9,
    fontFamily: 'Orbitron_700Bold',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  btn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDim: { opacity: 0.28 },
  display: {
    paddingHorizontal: 26,
    paddingVertical: 10,
    borderRadius: 13,
    borderWidth: 1.5,
    minWidth: 110,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  amount: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  range: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 9,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 0.5,
  },
});
