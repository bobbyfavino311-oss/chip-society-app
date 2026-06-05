import React, { useRef, useState } from 'react';
import {
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Polygon } from 'react-native-svg';
import colors from '../constants/colors';
import { useTableTheme } from '../context/TableThemeContext';

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

// ─── Dragon raise label ornaments ─────────────────────────────────────────────
function DragonRaiseLabel({ amount }: { amount: string }) {
  const W = 28; const H = 16;
  const pts = `${W / 2},0 ${W},${H / 2} ${W / 2},${H} 0,${H / 2}`;
  return (
    <View style={dr.raiseRow}>
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Polygon points={pts} fill="none" stroke="#8B0000" strokeWidth={1} strokeOpacity={0.7} />
        <Polygon points={pts} fill="#3B0000" fillOpacity={0.6} />
      </Svg>
      <Text style={dr.raiseLabel}>RAISE</Text>
      <Text style={dr.raiseAmt}>{amount}</Text>
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Polygon points={pts} fill="none" stroke="#8B0000" strokeWidth={1} strokeOpacity={0.7} />
        <Polygon points={pts} fill="#3B0000" fillOpacity={0.6} />
      </Svg>
    </View>
  );
}

// ─── Dragon slider handle ─────────────────────────────────────────────────────
function DragonHandle() {
  const S = HANDLE_SIZE;
  return (
    <View style={{ width: S, height: S, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={S} height={S} viewBox="0 0 22 22">
        <Circle cx={11} cy={11} r={10} fill="#0A0000" stroke="#C89B3C" strokeWidth={1.5} strokeOpacity={0.8} />
        <Circle cx={11} cy={11} r={7} fill="none" stroke="#8B0000" strokeWidth={0.8} strokeOpacity={0.6} />
        <Circle cx={11} cy={11} r={3} fill="#C89B3C" fillOpacity={0.7} />
      </Svg>
    </View>
  );
}

// ─── Vice Nights raise label  🌴  RAISE  amount  🌴 ───────────────────────────
function ViceRaiseLabel({ amount }: { amount: string }) {
  return (
    <View style={vn.raiseRow}>
      <Svg width={22} height={26} viewBox="0 0 22 26">
        <Path d="M 11 26 C 12 20, 11 14, 12 9" stroke="#FF2FAE" strokeWidth={2} strokeLinecap="round" fill="none" />
        <Path d="M 12 9 C 15 6, 19 7, 19 11" stroke="#FF2FAE" strokeWidth={1.1} strokeLinecap="round" fill="none" />
        <Path d="M 12 9 C 13 4, 15 1, 15 4" stroke="#00E5FF" strokeWidth={0.9} strokeLinecap="round" fill="none" />
        <Path d="M 12 9 C 7 6, 3 7, 3 11" stroke="#00E5FF" strokeWidth={1.1} strokeLinecap="round" fill="none" />
      </Svg>
      <Text style={vn.raiseLabel}>RAISE</Text>
      <Text style={vn.raiseAmt}>{amount}</Text>
      <Svg width={22} height={26} viewBox="0 0 22 26">
        <Path d="M 11 26 C 10 20, 11 14, 10 9" stroke="#FF2FAE" strokeWidth={2} strokeLinecap="round" fill="none" />
        <Path d="M 10 9 C 7 6, 3 7, 3 11" stroke="#FF2FAE" strokeWidth={1.1} strokeLinecap="round" fill="none" />
        <Path d="M 10 9 C 9 4, 7 1, 7 4" stroke="#00E5FF" strokeWidth={0.9} strokeLinecap="round" fill="none" />
        <Path d="M 10 9 C 15 6, 19 7, 19 11" stroke="#00E5FF" strokeWidth={1.1} strokeLinecap="round" fill="none" />
      </Svg>
    </View>
  );
}

// ─── Vice Nights slider handle (palm-circle) ──────────────────────────────────
function ViceHandle() {
  const S = HANDLE_SIZE;
  return (
    <View style={{ width: S, height: S, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={S} height={S} viewBox="0 0 22 22">
        <Circle cx={11} cy={11} r={10} fill="#08001C" stroke="#FF2FAE" strokeWidth={1.8} strokeOpacity={0.92} />
        <Path d="M 11 19 C 12 16, 11 13, 12 10" stroke="#FF2FAE" strokeWidth={1.3} strokeLinecap="round" fill="none" />
        <Path d="M 12 10 C 15 7.5, 18 8.5, 18 11.5" stroke="#FF2FAE" strokeWidth={0.9} strokeLinecap="round" fill="none" />
        <Path d="M 12 10 C 10 6, 8 5.5, 9 8" stroke="#00E5FF" strokeWidth={0.8} strokeLinecap="round" fill="none" />
        <Path d="M 12 10 C 8 7.5, 5 8.5, 5 11.5" stroke="#00E5FF" strokeWidth={0.9} strokeLinecap="round" fill="none" />
      </Svg>
    </View>
  );
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
  const { theme } = useTableTheme();
  const isDragon = theme.id === 'dragon_fortune';
  const isVice   = theme.id === 'vice_nights';

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
    { label: 'POT',  amount: pot },
    { label: '2×',   amount: Math.floor(pot * 2) },
  ].filter((b) => b.amount >= minRaise && b.amount < maxRaise);

  // ── Per-theme container overrides ────────────────────────────────────────
  const containerStyle = isDragon
    ? { backgroundColor: 'rgba(6,0,0,0.97)',  borderTopColor: 'rgba(139,0,0,0.50)' }
    : isVice
    ? { backgroundColor: 'rgba(4,2,14,0.97)', borderTopColor: 'rgba(255,47,174,0.35)' }
    : {};

  return (
    <View style={[styles.container, containerStyle]}>
      {canRaise && (
        <>
          {/* Quick-bet presets */}
          {quickBets.length > 0 && (
            <View style={styles.quickRow}>
              {quickBets.map((b) => (
                <TouchableOpacity
                  key={b.label}
                  style={[
                    styles.quickBtn,
                    isDragon && { backgroundColor: 'rgba(20,0,0,0.6)', borderWidth: 1, borderColor: 'rgba(139,0,0,0.30)' },
                    isVice   && { backgroundColor: 'rgba(4,0,20,0.7)',  borderWidth: 1, borderColor: 'rgba(255,47,174,0.25)' },
                  ]}
                  onPress={() => setRaiseAmount(clampRaise(b.amount))}
                  disabled={disabled}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.quickLabel,
                    isDragon && { color: 'rgba(200,155,60,0.55)' },
                    isVice   && { color: 'rgba(0,229,255,0.50)' },
                  ]}>
                    {b.label}
                  </Text>
                  <Text style={[
                    styles.quickAmt,
                    isDragon && { color: '#EAE3D2' },
                    isVice   && { color: '#FFFFFF' },
                  ]}>
                    {fmt(b.amount)}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[
                  styles.quickBtn,
                  isDragon ? { backgroundColor: 'rgba(50,0,0,0.5)',   borderWidth: 1, borderColor: 'rgba(139,0,0,0.45)' }
                  : isVice  ? { backgroundColor: 'rgba(60,0,30,0.6)',  borderWidth: 1, borderColor: 'rgba(255,47,174,0.40)' }
                  : styles.quickAllIn,
                ]}
                onPress={() => setRaiseAmount(maxRaise)}
                disabled={disabled}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.quickLabel,
                  isDragon ? { color: '#8B0000' } : isVice ? { color: '#FF2FAE' } : { color: colors.secondary },
                ]}>
                  ALL IN
                </Text>
                <Text style={[
                  styles.quickAmt,
                  isDragon ? { color: '#C89B3C' } : isVice ? { color: '#FF2FAE' } : { color: colors.secondary },
                ]}>
                  {fmt(maxRaise)}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Raise amount display */}
          {isDragon ? (
            <DragonRaiseLabel amount={fmt(raiseAmount)} />
          ) : isVice ? (
            <ViceRaiseLabel amount={fmt(raiseAmount)} />
          ) : (
            <View style={styles.sliderSection}>
              <View style={styles.raiseDisplay}>
                <Text style={styles.raiseLabel}>RAISE</Text>
                <Text style={styles.raiseAmt}>{fmt(raiseAmount)}</Text>
              </View>
            </View>
          )}

          {/* Slider track */}
          <View style={styles.sliderSection}>
            <View
              style={[
                styles.sliderTrack,
                isDragon && { backgroundColor: 'rgba(40,0,0,0.5)' },
                isVice   && { backgroundColor: 'rgba(0,0,8,0.50)', overflow: 'hidden' },
              ]}
              onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
              {...panResponder.panHandlers}
            >
              {/* Fill */}
              {isVice ? (
                <View style={[styles.sliderFill, { width: '100%', opacity: 0.80 }]}>
                  <LinearGradient colors={['#00E5FF', '#FF2FAE']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
                </View>
              ) : (
                <View style={[styles.sliderFill, { width: `${Math.round(sliderRatio * 100)}%` }]}>
                  {isDragon ? (
                    <LinearGradient colors={['#3B0000', '#8B0000']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
                  ) : (
                    <LinearGradient colors={[colors.primary, colors.secondary]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
                  )}
                </View>
              )}
              {/* Handle */}
              {isDragon ? (
                <View style={[styles.sliderHandle, { left: handleLeft }]}>
                  <DragonHandle />
                </View>
              ) : isVice ? (
                <View style={[styles.sliderHandle, { left: handleLeft, shadowColor: '#FF2FAE' }]}>
                  <ViceHandle />
                </View>
              ) : (
                <View style={[styles.sliderHandle, { left: handleLeft }]}>
                  <LinearGradient colors={[colors.primary, '#0088cc']} style={styles.handleGradient} />
                </View>
              )}
            </View>

            <View style={styles.sliderLabels}>
              <Text style={[styles.sliderMin, isDragon && { color: 'rgba(200,155,60,0.35)' }, isVice && { color: 'rgba(0,229,255,0.45)' }]}>
                {fmt(minRaise)}
              </Text>
              <Text style={[styles.sliderMax, isDragon && { color: 'rgba(200,155,60,0.35)' }, isVice && { color: 'rgba(255,47,174,0.45)' }]}>
                {fmt(maxRaise)}
              </Text>
            </View>
          </View>
        </>
      )}

      {/* Action buttons */}
      <View style={styles.actionRow}>

        {/* FOLD */}
        <TouchableOpacity
          style={[styles.actionBtn, isDragon ? dr.foldBtn : isVice ? vn.foldBtn : styles.foldBtn]}
          onPress={onFold} disabled={disabled} activeOpacity={0.75}
        >
          <LinearGradient
            colors={['transparent','transparent']}
            style={StyleSheet.absoluteFill}
          />
          <Text style={[styles.foldText, isDragon && dr.foldText, isVice && vn.foldText]}>FOLD</Text>
        </TouchableOpacity>

        {/* CHECK / CALL */}
        {canCheck ? (
          <TouchableOpacity
            style={[styles.actionBtn, isDragon ? dr.checkBtn : isVice ? vn.checkBtn : styles.checkBtn]}
            onPress={onCheck} disabled={disabled} activeOpacity={0.75}
          >
            <LinearGradient
              colors={['transparent','transparent']}
              style={StyleSheet.absoluteFill}
            />
            <Text style={[styles.checkText, isDragon && dr.checkText, isVice && vn.checkText]}>CHECK</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionBtn, isDragon ? dr.callBtn : isVice ? vn.callBtn : styles.callBtn]}
            onPress={onCall} disabled={disabled} activeOpacity={0.75}
          >
            <LinearGradient
              colors={['transparent','transparent']}
              style={StyleSheet.absoluteFill}
            />
            <Text style={[styles.callText, isDragon && dr.callText, isVice && vn.callText]}>
              CALL{'\n'}
              <Text style={[styles.callAmt, isDragon && dr.callAmt, isVice && vn.callAmt]}>{fmt(callAmount)}</Text>
            </Text>
          </TouchableOpacity>
        )}

        {/* RAISE */}
        {canRaise && (
          <TouchableOpacity
            style={[styles.actionBtn, isDragon ? dr.raiseBtn : isVice ? vn.raiseBtn : styles.raiseBtn]}
            onPress={() => onRaise(raiseAmount)} disabled={disabled} activeOpacity={0.75}
          >
            <LinearGradient
              colors={['transparent','transparent']}
              style={StyleSheet.absoluteFill}
            />
            <Text style={[styles.raiseText, isDragon && dr.raiseText, isVice && vn.raiseText]}>
              RAISE{'\n'}
              <Text style={[styles.raiseInlineAmt, isDragon && dr.raiseInlineAmt, isVice && vn.raiseInlineAmt]}>
                {fmt(raiseAmount)}
              </Text>
            </Text>
          </TouchableOpacity>
        )}

        {/* ALL IN */}
        {canAllIn && (
          <TouchableOpacity
            style={[styles.actionBtn, isDragon ? dr.allInBtn : isVice ? vn.allInBtn : styles.allInBtn]}
            onPress={onAllIn} disabled={disabled} activeOpacity={0.75}
          >
            <LinearGradient
              colors={['transparent','transparent']}
              style={StyleSheet.absoluteFill}
            />
            <Text style={[styles.allInText, isDragon && dr.allInText, isVice && vn.allInText]}>ALL{'\n'}IN</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Default (neon) styles ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
    gap: 8,
    backgroundColor: 'rgba(3,0,12,0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,150,200,0.18)',
  },

  quickRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
  quickBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  quickAllIn: {
    backgroundColor: 'rgba(255,0,144,0.07)',
  },
  quickLabel: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 8,
    fontWeight: '600',
    letterSpacing: 0.5,
    fontFamily: 'Orbitron_400Regular',
  },
  quickAmt: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },

  sliderSection: { gap: 5 },
  raiseDisplay: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  raiseLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: 'Orbitron_400Regular',
  },
  raiseAmt: {
    color: '#ffd700',
    fontSize: 20,
    fontWeight: '900',
    fontFamily: 'Inter_700Bold',
    lineHeight: 24,
  },

  sliderTrack: {
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    overflow: 'visible',
    justifyContent: 'center',
  },
  sliderFill: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    borderRadius: 14,
    overflow: 'hidden',
    opacity: 0.55,
  },
  sliderHandle: {
    position: 'absolute',
    top: (28 - HANDLE_SIZE) / 2,
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    borderRadius: HANDLE_SIZE / 2,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOpacity: 0.7,
    shadowRadius: 6,
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
    paddingHorizontal: 2,
  },
  sliderMin: { color: 'rgba(255,255,255,0.22)', fontSize: 9, fontWeight: '500' },
  sliderMax: { color: 'rgba(255,255,255,0.22)', fontSize: 9, fontWeight: '500' },

  actionRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'stretch',
  },
  actionBtn: {
    flex: 1,
    borderRadius: 11,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },

  foldBtn: {
    backgroundColor: 'rgba(255,60,60,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,60,60,0.28)',
    shadowColor: '#ff3c3c',
  },
  foldText: {
    color: '#ff5555',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: 'Orbitron_400Regular',
  },

  checkBtn: {
    backgroundColor: 'rgba(0,200,100,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,200,100,0.28)',
    shadowColor: '#00c864',
  },
  checkText: {
    color: '#00e887',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: 'Orbitron_400Regular',
  },

  callBtn: {
    backgroundColor: 'rgba(0,200,100,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,200,100,0.28)',
    shadowColor: '#00c864',
  },
  callText: {
    color: '#00e887',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
    fontFamily: 'Orbitron_400Regular',
  },
  callAmt: {
    fontSize: 12,
    fontWeight: '900',
    fontFamily: 'Inter_700Bold',
  },

  raiseBtn: {
    backgroundColor: 'rgba(0,180,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,180,255,0.28)',
    shadowColor: '#00b4ff',
  },
  raiseText: {
    color: '#00d4ff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
    fontFamily: 'Orbitron_400Regular',
  },
  raiseInlineAmt: {
    fontSize: 12,
    fontWeight: '900',
    fontFamily: 'Inter_700Bold',
  },

  allInBtn: {
    backgroundColor: 'rgba(255,0,144,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,0,144,0.28)',
    shadowColor: '#ff0090',
    maxWidth: 60,
  },
  allInText: {
    color: '#ff0090',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
    fontFamily: 'Orbitron_700Bold',
    lineHeight: 14,
  },
});

// ─── Dragon Fortune overrides ─────────────────────────────────────────────────
const dr = StyleSheet.create({
  raiseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 2,
  },
  raiseLabel: {
    color: 'rgba(200,155,60,0.55)',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 3,
    fontFamily: 'Orbitron_400Regular',
  },
  raiseAmt: {
    color: '#C89B3C',
    fontSize: 20,
    fontWeight: '900',
    fontFamily: 'Inter_700Bold',
    lineHeight: 24,
  },

  foldBtn: {
    backgroundColor: 'rgba(8,0,0,0.7)',
    borderWidth: 1.5,
    borderColor: 'rgba(139,0,0,0.65)',
    shadowColor: '#8B0000',
  },
  foldText: { color: '#E53030' },

  checkBtn: {
    backgroundColor: 'rgba(8,0,0,0.7)',
    borderWidth: 1.5,
    borderColor: 'rgba(31,94,82,0.55)',
    shadowColor: '#1F5E52',
  },
  checkText: { color: '#2A8B70' },

  callBtn: {
    backgroundColor: 'rgba(8,0,0,0.7)',
    borderWidth: 1.5,
    borderColor: 'rgba(31,94,82,0.55)',
    shadowColor: '#1F5E52',
  },
  callText: {
    color: '#EAE3D2',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
    fontFamily: 'Orbitron_400Regular',
  },
  callAmt: {
    color: '#2A8B70',
    fontSize: 12,
    fontWeight: '900',
    fontFamily: 'Inter_700Bold',
  },

  raiseBtn: {
    backgroundColor: 'rgba(8,0,0,0.7)',
    borderWidth: 1.5,
    borderColor: 'rgba(200,155,60,0.50)',
    shadowColor: '#C89B3C',
  },
  raiseText: {
    color: '#EAE3D2',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
    fontFamily: 'Orbitron_400Regular',
  },
  raiseInlineAmt: {
    color: '#C89B3C',
    fontSize: 12,
    fontWeight: '900',
    fontFamily: 'Inter_700Bold',
  },

  allInBtn: {
    backgroundColor: 'rgba(8,0,0,0.7)',
    borderWidth: 1.5,
    borderColor: 'rgba(139,0,0,0.65)',
    shadowColor: '#8B0000',
    maxWidth: 60,
  },
  allInText: {
    color: '#E53030',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
    fontFamily: 'Orbitron_700Bold',
    lineHeight: 14,
  },
});

// ─── Vice Nights overrides ────────────────────────────────────────────────────
const vn = StyleSheet.create({
  raiseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  raiseLabel: {
    color: '#FF2FAE',
    fontSize: 9,
    fontWeight: '700',
    fontStyle: 'italic',
    letterSpacing: 2,
    fontFamily: 'Orbitron_400Regular',
    textShadowColor: '#FF2FAE',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 0 },
  },
  raiseAmt: {
    color: '#00E5FF',
    fontSize: 22,
    fontWeight: '900',
    fontFamily: 'Inter_700Bold',
    lineHeight: 26,
    textShadowColor: '#00E5FF',
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 0 },
  },

  foldBtn: {
    backgroundColor: '#A8004E',
    borderWidth: 1.5,
    borderColor: '#FF2FAE',
    shadowColor: '#FF2FAE',
    shadowOpacity: 0.65,
    shadowRadius: 10,
  },
  foldText: { color: '#FFFFFF', fontWeight: '900' },

  checkBtn: {
    backgroundColor: '#085C5C',
    borderWidth: 1.5,
    borderColor: '#00E5FF',
    shadowColor: '#00E5FF',
    shadowOpacity: 0.50,
    shadowRadius: 8,
  },
  checkText: { color: '#FFFFFF' },

  callBtn: {
    backgroundColor: '#085C5C',
    borderWidth: 1.5,
    borderColor: '#00E5FF',
    shadowColor: '#00E5FF',
    shadowOpacity: 0.50,
    shadowRadius: 8,
  },
  callText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
    fontFamily: 'Orbitron_400Regular',
  },
  callAmt: {
    color: '#00E5FF',
    fontSize: 12,
    fontWeight: '900',
    fontFamily: 'Inter_700Bold',
  },

  raiseBtn: {
    backgroundColor: '#18285A',
    borderWidth: 1.5,
    borderColor: '#6060FF',
    shadowColor: '#6060FF',
    shadowOpacity: 0.45,
    shadowRadius: 8,
  },
  raiseText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    fontStyle: 'italic',
    letterSpacing: 0.5,
    textAlign: 'center',
    fontFamily: 'Orbitron_400Regular',
  },
  raiseInlineAmt: {
    color: '#FF2FAE',
    fontSize: 12,
    fontWeight: '900',
    fontStyle: 'normal',
    fontFamily: 'Inter_700Bold',
  },

  allInBtn: {
    backgroundColor: '#A8004E',
    borderWidth: 1.5,
    borderColor: '#FF2FAE',
    shadowColor: '#FF2FAE',
    shadowOpacity: 0.65,
    shadowRadius: 10,
    maxWidth: 64,
  },
  allInText: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
    fontFamily: 'Orbitron_700Bold',
    lineHeight: 14,
    textShadowColor: '#FFD700',
    textShadowRadius: 4,
    textShadowOffset: { width: 0, height: 0 },
  },
});
