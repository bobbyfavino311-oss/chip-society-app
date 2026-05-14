import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import colors from '../constants/colors';

interface BettingPanelProps {
  canCheck: boolean;
  callAmount: number;
  myChips: number;
  pot: number;
  minRaise: number;
  currentBet: number;
  onFold: () => void;
  onCheck: () => void;
  onCall: () => void;
  onRaise: (amount: number) => void;
  onAllIn: () => void;
  disabled?: boolean;
}

export default function BettingPanel({
  canCheck,
  callAmount,
  myChips,
  pot,
  minRaise,
  onFold,
  onCheck,
  onCall,
  onRaise,
  onAllIn,
  disabled = false,
}: BettingPanelProps) {
  const maxRaise = myChips;
  const defaultRaise = Math.min(myChips, Math.max(minRaise, Math.floor(pot * 0.75)));
  const [raiseAmount, setRaiseAmount] = useState(defaultRaise);

  const canRaise = myChips > callAmount && myChips > minRaise;
  const canAllIn = myChips > 0;

  const formatChips = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
  };

  const adjustRaise = (delta: number) => {
    setRaiseAmount(prev => Math.max(minRaise, Math.min(maxRaise, prev + delta)));
  };

  return (
    <View style={styles.container}>
      {canRaise && (
        <View style={styles.raiseRow}>
          <TouchableOpacity style={styles.adjustBtn} onPress={() => adjustRaise(-Math.max(minRaise, Math.floor(pot * 0.25)))}>
            <Text style={styles.adjustBtnText}>-</Text>
          </TouchableOpacity>
          <View style={styles.raiseDisplay}>
            <Text style={styles.raiseLabel}>RAISE</Text>
            <Text style={styles.raiseAmount}>{formatChips(raiseAmount)}</Text>
          </View>
          <TouchableOpacity style={styles.adjustBtn} onPress={() => adjustRaise(Math.max(minRaise, Math.floor(pot * 0.25)))}>
            <Text style={styles.adjustBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.quickAmounts}>
        {[0.5, 1, 2].map(mult => {
          const amt = Math.min(myChips, Math.floor(pot * mult));
          if (amt < minRaise) return null;
          return (
            <TouchableOpacity
              key={mult}
              style={styles.quickBtn}
              onPress={() => setRaiseAmount(amt)}
              disabled={disabled}
            >
              <Text style={styles.quickBtnText}>{mult}x pot</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.foldBtn]}
          onPress={onFold}
          disabled={disabled}
        >
          <Text style={styles.foldBtnText}>FOLD</Text>
        </TouchableOpacity>

        {canCheck ? (
          <TouchableOpacity
            style={[styles.actionBtn, styles.checkBtn]}
            onPress={onCheck}
            disabled={disabled}
          >
            <Text style={styles.checkBtnText}>CHECK</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionBtn, styles.callBtn]}
            onPress={onCall}
            disabled={disabled}
          >
            <Text style={styles.callBtnText}>
              CALL{'\n'}
              <Text style={styles.callAmount}>{formatChips(callAmount)}</Text>
            </Text>
          </TouchableOpacity>
        )}

        {canRaise && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.raiseBtn]}
            onPress={() => onRaise(raiseAmount)}
            disabled={disabled}
          >
            <Text style={styles.raiseBtnText}>
              RAISE{'\n'}
              <Text style={styles.raiseBtnAmount}>{formatChips(raiseAmount)}</Text>
            </Text>
          </TouchableOpacity>
        )}

        {canAllIn && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.allInBtn]}
            onPress={onAllIn}
            disabled={disabled}
          >
            <Text style={styles.allInBtnText}>ALL IN</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(5,0,16,0.95)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
  },
  raiseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    gap: 12,
  },
  adjustBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustBtnText: {
    color: colors.accent,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 22,
  },
  raiseDisplay: {
    alignItems: 'center',
    minWidth: 80,
  },
  raiseLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1,
  },
  raiseAmount: {
    color: colors.gold,
    fontSize: 20,
    fontWeight: '700',
  },
  quickAmounts: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  quickBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.accentDim,
    backgroundColor: colors.accentDim,
  },
  quickBtnText: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'stretch',
  },
  actionBtn: {
    flex: 1,
    borderRadius: colors.radiusSm,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  foldBtn: {
    backgroundColor: 'rgba(100,20,20,0.8)',
    borderWidth: 1,
    borderColor: colors.error,
  },
  foldBtnText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  checkBtn: {
    backgroundColor: 'rgba(0,60,40,0.8)',
    borderWidth: 1,
    borderColor: colors.success,
  },
  checkBtnText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  callBtn: {
    backgroundColor: 'rgba(0,60,40,0.8)',
    borderWidth: 1,
    borderColor: colors.success,
  },
  callBtnText: {
    color: colors.success,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
  },
  callAmount: {
    fontSize: 13,
    fontWeight: '800',
  },
  raiseBtn: {
    backgroundColor: 'rgba(0,60,80,0.8)',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  raiseBtnText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
  },
  raiseBtnAmount: {
    fontSize: 12,
    fontWeight: '800',
  },
  allInBtn: {
    backgroundColor: 'rgba(80,0,60,0.8)',
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  allInBtnText: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
