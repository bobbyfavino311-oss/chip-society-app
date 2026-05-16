import React, { useRef, useState } from 'react';
import {
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

const HANDLE_SIZE = 22;

const fmt = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

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
  const canRaise = myChips > callAmount && myChips >= minRaise;
  const canAllIn = myChips > 0;

  const defaultRaise = Math.min(myChips, Math.max(minRaise, Math.floor(pot * 0.75)));
  const [raiseAmount, setRaiseAmount] = useState(defaultRaise);
  const [trackWidth, setTrackWidth] = useState(280);

  const clampRaise = (n: number) =>
    Math.max(minRaise, Math.min(maxRaise, Math.round(n)));

  const setFromX = (x: number) => {
    if (trackWidth <= 0 || maxRaise <= minRaise) return;
    const ratio = Math.max(0, Math.min(1, x / trackWidth));
    setRaiseAmount(clampRaise(minRaise + ratio * (maxRaise - minRaise)));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => setFromX(e.nativeEvent.locationX),
      onPanResponderMove: (e) => setFromX(e.nativeEvent.locationX),
    })
  ).current;

  const sliderRatio =
    maxRaise > minRaise ? (raiseAmount - minRaise) / (maxRaise - minRaise) : 0;
  const handleLeft = sliderRatio * Math.max(0, trackWidth - HANDLE_SIZE);

  const quickBets = [
    { label: '½ POT', amount: Math.floor(pot * 0.5) },
    { label: 'POT', amount: pot },
    { label: '2×', amount: Math.floor(pot * 2) },
  ].filter((b) => b.amount >= minRaise && b.amount < maxRaise);

  return (
    <View style={styles.container}>
      {canRaise && (
        <>
          {/* Quick-bet presets */}
          {quickBets.length > 0 && (
            <View style={styles.quickRow}>
              {quickBets.map((b) => (
                <TouchableOpacity
                  key={b.label}
                  style={styles.quickBtn}
                  onPress={() => setRaiseAmount(clampRaise(b.amount))}
                  disabled={disabled}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickLabel}>{b.label}</Text>
                  <Text style={styles.quickAmt}>{fmt(b.amount)}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.quickBtn, styles.quickAllIn]}
                onPress={() => setRaiseAmount(maxRaise)}
                disabled={disabled}
                activeOpacity={0.7}
              >
                <Text style={[styles.quickLabel, { color: colors.secondary }]}>ALL IN</Text>
                <Text style={[styles.quickAmt, { color: colors.secondary }]}>{fmt(maxRaise)}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Raise amount display + slider */}
          <View style={styles.sliderSection}>
            <View style={styles.raiseDisplay}>
              <Text style={styles.raiseLabel}>RAISE</Text>
              <Text style={styles.raiseAmt}>{fmt(raiseAmount)}</Text>
            </View>

            <View
              style={styles.sliderTrack}
              onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
              {...panResponder.panHandlers}
            >
              {/* Fill */}
              <View style={[styles.sliderFill, { width: `${Math.round(sliderRatio * 100)}%` }]}>
                <LinearGradient
                  colors={[colors.primary, colors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </View>
              {/* Handle */}
              <View style={[styles.sliderHandle, { left: handleLeft }]}>
                <LinearGradient
                  colors={[colors.primary, '#0088cc']}
                  style={styles.handleGradient}
                />
              </View>
            </View>

            <View style={styles.sliderLabels}>
              <Text style={styles.sliderMin}>{fmt(minRaise)}</Text>
              <Text style={styles.sliderMax}>{fmt(maxRaise)}</Text>
            </View>
          </View>
        </>
      )}

      {/* Action buttons */}
      <View style={styles.actionRow}>
        {/* FOLD */}
        <TouchableOpacity
          style={[styles.actionBtn, styles.foldBtn]}
          onPress={onFold}
          disabled={disabled}
          activeOpacity={0.75}
        >
          <Text style={styles.foldText}>FOLD</Text>
        </TouchableOpacity>

        {/* CHECK / CALL */}
        {canCheck ? (
          <TouchableOpacity
            style={[styles.actionBtn, styles.checkBtn]}
            onPress={onCheck}
            disabled={disabled}
            activeOpacity={0.75}
          >
            <LinearGradient
              colors={['rgba(0,180,80,0.3)', 'rgba(0,120,50,0.15)']}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.checkText}>CHECK</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionBtn, styles.callBtn]}
            onPress={onCall}
            disabled={disabled}
            activeOpacity={0.75}
          >
            <LinearGradient
              colors={['rgba(0,180,80,0.3)', 'rgba(0,120,50,0.15)']}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.callText}>
              CALL{'\n'}
              <Text style={styles.callAmt}>{fmt(callAmount)}</Text>
            </Text>
          </TouchableOpacity>
        )}

        {/* RAISE */}
        {canRaise && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.raiseBtn]}
            onPress={() => onRaise(raiseAmount)}
            disabled={disabled}
            activeOpacity={0.75}
          >
            <LinearGradient
              colors={['rgba(0,140,200,0.35)', 'rgba(0,80,140,0.18)']}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.raiseText}>
              RAISE{'\n'}
              <Text style={styles.raiseInlineAmt}>{fmt(raiseAmount)}</Text>
            </Text>
          </TouchableOpacity>
        )}

        {/* ALL IN */}
        {canAllIn && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.allInBtn]}
            onPress={onAllIn}
            disabled={disabled}
            activeOpacity={0.75}
          >
            <LinearGradient
              colors={['rgba(180,0,100,0.35)', 'rgba(120,0,70,0.18)']}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.allInText}>ALL{'\n'}IN</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(5,0,16,0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,0,144,0.25)',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    gap: 8,
  },

  quickRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
  quickBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.3)',
    backgroundColor: 'rgba(0,212,255,0.06)',
  },
  quickAllIn: {
    borderColor: 'rgba(255,0,144,0.35)',
    backgroundColor: 'rgba(255,0,144,0.06)',
  },
  quickLabel: {
    color: colors.primary,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.8,
    fontFamily: 'Orbitron_400Regular',
  },
  quickAmt: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },

  sliderSection: {
    gap: 4,
  },
  raiseDisplay: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  raiseLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: 'Orbitron_400Regular',
  },
  raiseAmt: {
    color: colors.gold,
    fontSize: 22,
    fontWeight: '900',
    fontFamily: 'Orbitron_700Bold',
    lineHeight: 26,
  },

  sliderTrack: {
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'visible',
    justifyContent: 'center',
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 16,
    overflow: 'hidden',
    opacity: 0.7,
  },
  sliderHandle: {
    position: 'absolute',
    top: (32 - HANDLE_SIZE) / 2,
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    borderRadius: HANDLE_SIZE / 2,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOpacity: 0.8,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  handleGradient: {
    flex: 1,
    borderRadius: HANDLE_SIZE / 2,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  sliderMin: {
    color: colors.textDim,
    fontSize: 9,
    fontWeight: '600',
  },
  sliderMax: {
    color: colors.textDim,
    fontSize: 9,
    fontWeight: '600',
  },

  actionRow: {
    flexDirection: 'row',
    gap: 7,
    alignItems: 'stretch',
  },
  actionBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    borderWidth: 1,
    overflow: 'hidden',
  },

  foldBtn: {
    backgroundColor: 'rgba(120,20,20,0.7)',
    borderColor: 'rgba(255,68,68,0.6)',
  },
  foldText: {
    color: '#ff5555',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    fontFamily: 'Orbitron_700Bold',
  },

  checkBtn: {
    backgroundColor: 'rgba(0,50,30,0.7)',
    borderColor: 'rgba(0,255,120,0.5)',
  },
  checkText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    fontFamily: 'Orbitron_700Bold',
  },

  callBtn: {
    backgroundColor: 'rgba(0,50,30,0.7)',
    borderColor: 'rgba(0,255,120,0.5)',
  },
  callText: {
    color: colors.success,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
    fontFamily: 'Orbitron_700Bold',
  },
  callAmt: {
    fontSize: 13,
    fontWeight: '900',
  },

  raiseBtn: {
    backgroundColor: 'rgba(0,60,100,0.7)',
    borderColor: 'rgba(0,212,255,0.55)',
  },
  raiseText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textAlign: 'center',
    fontFamily: 'Orbitron_700Bold',
  },
  raiseInlineAmt: {
    fontSize: 12,
    fontWeight: '900',
  },

  allInBtn: {
    backgroundColor: 'rgba(100,0,60,0.7)',
    borderColor: 'rgba(255,0,144,0.6)',
    maxWidth: 64,
  },
  allInText: {
    color: colors.secondary,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
    fontFamily: 'Orbitron_700Bold',
    lineHeight: 14,
  },
});
