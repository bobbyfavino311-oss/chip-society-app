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
  const isDragon     = theme.id === 'dragon_fortune';
  const isMasquerade = theme.id === 'royal_masquerade';
  const isTiger      = theme.id === 'tiger_fortune';
  const isSakura     = theme.id === 'sakura_garden';

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
    ? { backgroundColor: 'rgba(6,0,0,0.97)',   borderTopColor: 'rgba(139,0,0,0.50)'     }
    : isMasquerade
    ? { backgroundColor: 'rgba(8,0,20,0.97)',  borderTopColor: 'rgba(180,140,40,0.28)'  }
    : isTiger
    ? { backgroundColor: 'rgba(6,4,0,0.97)',   borderTopColor: 'rgba(200,148,10,0.32)'  }
    : isSakura
    ? { backgroundColor: 'rgba(12,4,10,0.97)', borderTopColor: 'rgba(232,98,122,0.28)'  }
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
                    isDragon     && { backgroundColor: 'rgba(20,0,0,0.6)',  borderWidth: 1, borderColor: 'rgba(139,0,0,0.30)'    },
                    isMasquerade && { backgroundColor: 'rgba(16,0,36,0.6)', borderWidth: 1, borderColor: 'rgba(155,48,255,0.22)' },
                    isTiger      && { backgroundColor: 'rgba(18,12,0,0.6)',  borderWidth: 1, borderColor: 'rgba(200,148,10,0.22)' },
                    isSakura     && { backgroundColor: 'rgba(20,8,16,0.6)',  borderWidth: 1, borderColor: 'rgba(232,98,122,0.20)'  },
                  ]}
                  onPress={() => setRaiseAmount(clampRaise(b.amount))}
                  disabled={disabled}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.quickLabel,
                    isDragon     && { color: 'rgba(200,155,60,0.55)'  },
                    isMasquerade && { color: 'rgba(212,175,55,0.50)'  },
                    isTiger      && { color: 'rgba(200,148,10,0.50)'  },
                    isSakura     && { color: 'rgba(244,168,192,0.48)' },
                  ]}>
                    {b.label}
                  </Text>
                  <Text style={[
                    styles.quickAmt,
                    isDragon     && { color: '#EAE3D2' },
                    isMasquerade && { color: '#F0E8FF' },
                    isTiger      && { color: '#F5DFA0' },
                    isSakura     && { color: '#FFE8F0' },
                  ]}>
                    {fmt(b.amount)}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[
                  styles.quickBtn,
                  isDragon     ? { backgroundColor: 'rgba(50,0,0,0.5)',  borderWidth: 1, borderColor: 'rgba(139,0,0,0.45)'    }
                  : isMasquerade ? { backgroundColor: 'rgba(30,0,60,0.5)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.40)' }
                  : isTiger      ? { backgroundColor: 'rgba(40,28,0,0.5)',  borderWidth: 1, borderColor: 'rgba(200,148,10,0.45)' }
                  : isSakura     ? { backgroundColor: 'rgba(32,10,24,0.5)', borderWidth: 1, borderColor: 'rgba(232,98,122,0.42)'  }
                  : styles.quickAllIn,
                ]}
                onPress={() => setRaiseAmount(maxRaise)}
                disabled={disabled}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.quickLabel,
                  isDragon     ? { color: '#8B0000'  }
                  : isMasquerade ? { color: '#9B30FF'  }
                  : isTiger      ? { color: '#8B5E00'  }
                  : isSakura     ? { color: '#C4407C'  }
                  : { color: colors.secondary },
                ]}>
                  ALL IN
                </Text>
                <Text style={[
                  styles.quickAmt,
                  isDragon     ? { color: '#C89B3C' }
                  : isMasquerade ? { color: '#D4AF37' }
                  : isTiger      ? { color: '#C8940A' }
                  : isSakura     ? { color: '#F4A8C0' }
                  : { color: colors.secondary },
                ]}>
                  {fmt(maxRaise)}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Raise amount display */}
          {isDragon ? (
            <DragonRaiseLabel amount={fmt(raiseAmount)} />
          ) : isMasquerade ? (
            <View style={styles.sliderSection}>
              <View style={styles.raiseDisplay}>
                <Text style={[styles.raiseLabel, { color: 'rgba(212,175,55,0.50)', letterSpacing: 3 }]}>RAISE</Text>
                <Text style={[styles.raiseAmt, { color: '#D4AF37' }]}>{fmt(raiseAmount)}</Text>
              </View>
            </View>
          ) : isTiger ? (
            <View style={styles.sliderSection}>
              <View style={styles.raiseDisplay}>
                <Text style={[styles.raiseLabel, { color: 'rgba(200,148,10,0.50)', letterSpacing: 3 }]}>RAISE</Text>
                <Text style={[styles.raiseAmt, { color: '#C8940A' }]}>{fmt(raiseAmount)}</Text>
              </View>
            </View>
          ) : isSakura ? (
            <View style={styles.sliderSection}>
              <View style={styles.raiseDisplay}>
                <Text style={[styles.raiseLabel, { color: 'rgba(244,168,192,0.50)', letterSpacing: 3 }]}>RAISE</Text>
                <Text style={[styles.raiseAmt, { color: '#F4A8C0' }]}>{fmt(raiseAmount)}</Text>
              </View>
            </View>
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
                isDragon     && { backgroundColor: 'rgba(40,0,0,0.5)'  },
                isMasquerade && { backgroundColor: 'rgba(20,0,48,0.5)' },
                isTiger      && { backgroundColor: 'rgba(30,18,0,0.5)'  },
                isSakura     && { backgroundColor: 'rgba(24,6,18,0.5)'  },
              ]}
              onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
              {...panResponder.panHandlers}
            >
              {/* Fill */}
              <View style={[styles.sliderFill, { width: `${Math.round(sliderRatio * 100)}%` }]}>
                {isDragon ? (
                  <LinearGradient colors={['#3B0000', '#8B0000']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
                ) : isMasquerade ? (
                  <LinearGradient colors={['#3D0070', '#D4AF37']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
                ) : isTiger ? (
                  <LinearGradient colors={['#3A2200', '#C8940A']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
                ) : isSakura ? (
                  <LinearGradient colors={['#5A1030', '#F4A8C0']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
                ) : (
                  <LinearGradient colors={[colors.primary, colors.secondary]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
                )}
              </View>
              {/* Handle */}
              {isDragon ? (
                <View style={[styles.sliderHandle, { left: handleLeft }]}>
                  <DragonHandle />
                </View>
              ) : isMasquerade ? (
                <View style={[styles.sliderHandle, { left: handleLeft }]}>
                  <LinearGradient colors={['#9B30FF', '#D4AF37']} style={styles.handleGradient} />
                </View>
              ) : isTiger ? (
                <View style={[styles.sliderHandle, { left: handleLeft }]}>
                  <LinearGradient colors={['#8B5E00', '#C8940A']} style={styles.handleGradient} />
                </View>
              ) : isSakura ? (
                <View style={[styles.sliderHandle, { left: handleLeft }]}>
                  <LinearGradient colors={['#C4407C', '#F4A8C0']} style={styles.handleGradient} />
                </View>
              ) : (
                <View style={[styles.sliderHandle, { left: handleLeft }]}>
                  <LinearGradient colors={[colors.primary, '#0088cc']} style={styles.handleGradient} />
                </View>
              )}
            </View>

            <View style={styles.sliderLabels}>
              <Text style={[styles.sliderMin,
                isDragon     && { color: 'rgba(200,155,60,0.35)' },
                isMasquerade && { color: 'rgba(212,175,55,0.35)' },
                isTiger      && { color: 'rgba(200,148,10,0.35)' },
                isSakura     && { color: 'rgba(244,168,192,0.35)' },
              ]}>
                {fmt(minRaise)}
              </Text>
              <Text style={[styles.sliderMax,
                isDragon     && { color: 'rgba(200,155,60,0.35)' },
                isMasquerade && { color: 'rgba(212,175,55,0.35)' },
                isTiger      && { color: 'rgba(200,148,10,0.35)' },
                isSakura     && { color: 'rgba(244,168,192,0.35)' },
              ]}>
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
          style={[styles.actionBtn, isDragon ? dr.foldBtn : isMasquerade ? mq.foldBtn : isTiger ? tg.foldBtn : isSakura ? sk.foldBtn : styles.foldBtn]}
          onPress={onFold} disabled={disabled} activeOpacity={0.75}
        >
          <LinearGradient colors={['transparent','transparent']} style={StyleSheet.absoluteFill} />
          <Text style={[styles.foldText, isDragon && dr.foldText, isMasquerade && mq.foldText, isTiger && tg.foldText, isSakura && sk.foldText]}>FOLD</Text>
        </TouchableOpacity>

        {/* CHECK / CALL */}
        {canCheck ? (
          <TouchableOpacity
            style={[styles.actionBtn, isDragon ? dr.checkBtn : isMasquerade ? mq.checkBtn : isTiger ? tg.checkBtn : isSakura ? sk.checkBtn : styles.checkBtn]}
            onPress={onCheck} disabled={disabled} activeOpacity={0.75}
          >
            <LinearGradient colors={['transparent','transparent']} style={StyleSheet.absoluteFill} />
            <Text style={[styles.checkText, isDragon && dr.checkText, isMasquerade && mq.checkText, isTiger && tg.checkText, isSakura && sk.checkText]}>CHECK</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionBtn, isDragon ? dr.callBtn : isMasquerade ? mq.callBtn : isTiger ? tg.callBtn : isSakura ? sk.callBtn : styles.callBtn]}
            onPress={onCall} disabled={disabled} activeOpacity={0.75}
          >
            <LinearGradient colors={['transparent','transparent']} style={StyleSheet.absoluteFill} />
            <Text style={[styles.callText, isDragon && dr.callText, isMasquerade && mq.callText, isTiger && tg.callText, isSakura && sk.callText]}>
              CALL{'\n'}
              <Text style={[styles.callAmt, isDragon && dr.callAmt, isMasquerade && mq.callAmt, isTiger && tg.callAmt, isSakura && sk.callAmt]}>{fmt(callAmount)}</Text>
            </Text>
          </TouchableOpacity>
        )}

        {/* RAISE */}
        {canRaise && (
          <TouchableOpacity
            style={[styles.actionBtn, isDragon ? dr.raiseBtn : isMasquerade ? mq.raiseBtn : isTiger ? tg.raiseBtn : isSakura ? sk.raiseBtn : styles.raiseBtn]}
            onPress={() => onRaise(raiseAmount)} disabled={disabled} activeOpacity={0.75}
          >
            <LinearGradient colors={['transparent','transparent']} style={StyleSheet.absoluteFill} />
            <Text style={[styles.raiseText, isDragon && dr.raiseText, isMasquerade && mq.raiseText, isTiger && tg.raiseText, isSakura && sk.raiseText]}>
              RAISE{'\n'}
              <Text style={[styles.raiseInlineAmt, isDragon && dr.raiseInlineAmt, isMasquerade && mq.raiseInlineAmt, isTiger && tg.raiseInlineAmt, isSakura && sk.raiseInlineAmt]}>
                {fmt(raiseAmount)}
              </Text>
            </Text>
          </TouchableOpacity>
        )}

        {/* ALL IN */}
        {canAllIn && (
          <TouchableOpacity
            style={[styles.actionBtn, isDragon ? dr.allInBtn : isMasquerade ? mq.allInBtn : isTiger ? tg.allInBtn : isSakura ? sk.allInBtn : styles.allInBtn]}
            onPress={onAllIn} disabled={disabled} activeOpacity={0.75}
          >
            <LinearGradient colors={['transparent','transparent']} style={StyleSheet.absoluteFill} />
            <Text style={[styles.allInText, isDragon && dr.allInText, isMasquerade && mq.allInText, isTiger && tg.allInText, isSakura && sk.allInText]}>ALL{'\n'}IN</Text>
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

// ─── Sakura Garden overrides ───────────────────────────────────────────────────
const sk = StyleSheet.create({
  foldBtn: {
    backgroundColor: 'rgba(12,4,10,0.72)',
    borderWidth: 1.5,
    borderColor: 'rgba(160,32,80,0.55)',
    shadowColor: '#A02050',
  },
  foldText: { color: '#D05080' },

  checkBtn: {
    backgroundColor: 'rgba(12,4,10,0.72)',
    borderWidth: 1.5,
    borderColor: 'rgba(42,112,80,0.50)',
    shadowColor: '#2A7050',
  },
  checkText: { color: '#3AB870' },

  callBtn: {
    backgroundColor: 'rgba(12,4,10,0.72)',
    borderWidth: 1.5,
    borderColor: 'rgba(42,112,80,0.50)',
    shadowColor: '#2A7050',
  },
  callText: {
    color: '#FFE8F0',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
    fontFamily: 'Orbitron_400Regular',
  },
  callAmt: {
    color: '#3AB870',
    fontSize: 12,
    fontWeight: '900',
    fontFamily: 'Inter_700Bold',
  },

  raiseBtn: {
    backgroundColor: 'rgba(12,4,10,0.72)',
    borderWidth: 1.5,
    borderColor: 'rgba(232,98,122,0.55)',
    shadowColor: '#E8627A',
  },
  raiseText: {
    color: '#FFE8F0',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
    fontFamily: 'Orbitron_400Regular',
  },
  raiseInlineAmt: {
    color: '#F4A8C0',
    fontSize: 12,
    fontWeight: '900',
    fontFamily: 'Inter_700Bold',
  },

  allInBtn: {
    backgroundColor: 'rgba(12,4,10,0.72)',
    borderWidth: 1.5,
    borderColor: 'rgba(244,168,192,0.55)',
    shadowColor: '#F4A8C0',
    maxWidth: 60,
  },
  allInText: {
    color: '#F4A8C0',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
    fontFamily: 'Orbitron_700Bold',
    lineHeight: 14,
  },
});

// ─── Tiger Fortune overrides ───────────────────────────────────────────────────
const tg = StyleSheet.create({
  foldBtn: {
    backgroundColor: 'rgba(6,4,0,0.72)',
    borderWidth: 1.5,
    borderColor: 'rgba(139,46,0,0.55)',
    shadowColor: '#8B2E00',
  },
  foldText: { color: '#C05020' },

  checkBtn: {
    backgroundColor: 'rgba(6,4,0,0.72)',
    borderWidth: 1.5,
    borderColor: 'rgba(42,96,64,0.50)',
    shadowColor: '#2A6040',
  },
  checkText: { color: '#3A9060' },

  callBtn: {
    backgroundColor: 'rgba(6,4,0,0.72)',
    borderWidth: 1.5,
    borderColor: 'rgba(42,96,64,0.50)',
    shadowColor: '#2A6040',
  },
  callText: {
    color: '#F5DFA0',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
    fontFamily: 'Orbitron_400Regular',
  },
  callAmt: {
    color: '#3A9060',
    fontSize: 12,
    fontWeight: '900',
    fontFamily: 'Inter_700Bold',
  },

  raiseBtn: {
    backgroundColor: 'rgba(6,4,0,0.72)',
    borderWidth: 1.5,
    borderColor: 'rgba(200,148,10,0.55)',
    shadowColor: '#C8940A',
  },
  raiseText: {
    color: '#F5DFA0',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
    fontFamily: 'Orbitron_400Regular',
  },
  raiseInlineAmt: {
    color: '#C8940A',
    fontSize: 12,
    fontWeight: '900',
    fontFamily: 'Inter_700Bold',
  },

  allInBtn: {
    backgroundColor: 'rgba(6,4,0,0.72)',
    borderWidth: 1.5,
    borderColor: 'rgba(200,148,10,0.62)',
    shadowColor: '#C8940A',
    maxWidth: 60,
  },
  allInText: {
    color: '#C8940A',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
    fontFamily: 'Orbitron_700Bold',
    lineHeight: 14,
  },
});

// ─── Royal Masquerade overrides ───────────────────────────────────────────────
const mq = StyleSheet.create({
  foldBtn: {
    backgroundColor: 'rgba(8,0,20,0.72)',
    borderWidth: 1.5,
    borderColor: 'rgba(155,48,255,0.55)',
    shadowColor: '#9B30FF',
  },
  foldText: { color: '#C060FF' },

  checkBtn: {
    backgroundColor: 'rgba(8,0,20,0.72)',
    borderWidth: 1.5,
    borderColor: 'rgba(31,94,82,0.50)',
    shadowColor: '#1F5E52',
  },
  checkText: { color: '#2A8B70' },

  callBtn: {
    backgroundColor: 'rgba(8,0,20,0.72)',
    borderWidth: 1.5,
    borderColor: 'rgba(31,94,82,0.50)',
    shadowColor: '#1F5E52',
  },
  callText: {
    color: '#F0E8FF',
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
    backgroundColor: 'rgba(8,0,20,0.72)',
    borderWidth: 1.5,
    borderColor: 'rgba(212,175,55,0.55)',
    shadowColor: '#D4AF37',
  },
  raiseText: {
    color: '#F0E8FF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
    fontFamily: 'Orbitron_400Regular',
  },
  raiseInlineAmt: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: '900',
    fontFamily: 'Inter_700Bold',
  },

  allInBtn: {
    backgroundColor: 'rgba(8,0,20,0.72)',
    borderWidth: 1.5,
    borderColor: 'rgba(212,175,55,0.60)',
    shadowColor: '#D4AF37',
    maxWidth: 60,
  },
  allInText: {
    color: '#D4AF37',
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

