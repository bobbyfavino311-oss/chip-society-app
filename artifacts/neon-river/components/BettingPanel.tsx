import React, { useRef, useState } from 'react';
import {
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Ellipse, Line, Polygon, Rect } from 'react-native-svg';
import colors from '../constants/colors';
import { useTableTheme } from '../context/TableThemeContext';

// ─── Vice Nights button silhouette backgrounds ────────────────────────────────

function ViceFoldBg() {
  // South Beach city skyline silhouette at the bottom of the FOLD button
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 70 48" preserveAspectRatio="xMidYMax meet">
        {/* Silhouette buildings */}
        <Rect x={0}  y={26} width={8}  height={22} fill="#000" opacity={0.30} />
        <Rect x={9}  y={18} width={12} height={30} fill="#000" opacity={0.30} />
        <Rect x={22} y={30} width={7}  height={18} fill="#000" opacity={0.28} />
        <Rect x={30} y={20} width={10} height={28} fill="#000" opacity={0.30} />
        <Rect x={41} y={25} width={8}  height={23} fill="#000" opacity={0.28} />
        <Rect x={50} y={14} width={11} height={34} fill="#000" opacity={0.30} />
        <Rect x={62} y={28} width={8}  height={20} fill="#000" opacity={0.28} />
        {/* Palm silhouette */}
        <Path d="M 15 18 C 15 14, 15 10, 15 7" stroke="#FF2FAE" strokeWidth={1.2} strokeOpacity={0.40} />
        <Path d="M 15 7 C 20 5, 24 8, 24 11" stroke="#FF2FAE" strokeWidth={0.8} strokeOpacity={0.35} />
        <Path d="M 15 7 C 10 5, 6 8, 6 11" stroke="#FF2FAE" strokeWidth={0.8} strokeOpacity={0.35} />
        {/* Neon street glow */}
        <Line x1={0} y1={48} x2={70} y2={48} stroke="#FF2FAE" strokeWidth={0.8} strokeOpacity={0.20} />
      </Svg>
    </View>
  );
}

function ViceCallBg() {
  // Ocean neon reflection waves
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 70 48" preserveAspectRatio="xMidYMax meet">
        {/* Reflection wave lines */}
        <Path d="M 0 38 Q 17 34, 35 38 Q 52 42, 70 38" stroke="#00E5FF" strokeWidth={0.8} fill="none" strokeOpacity={0.28} />
        <Path d="M 0 42 Q 17 38, 35 42 Q 52 46, 70 42" stroke="#00E5FF" strokeWidth={0.6} fill="none" strokeOpacity={0.20} />
        <Path d="M 0 46 Q 17 42, 35 46 Q 52 50, 70 46" stroke="#00E5FF" strokeWidth={0.5} fill="none" strokeOpacity={0.15} />
        {/* Reflection streaks */}
        <Line x1={18} y1={30} x2={18} y2={48} stroke="#00E5FF" strokeWidth={0.6} strokeOpacity={0.18} />
        <Line x1={35} y1={28} x2={35} y2={48} stroke="#00E5FF" strokeWidth={0.8} strokeOpacity={0.22} />
        <Line x1={52} y1={30} x2={52} y2={48} stroke="#FF2FAE" strokeWidth={0.6} strokeOpacity={0.18} />
      </Svg>
    </View>
  );
}

function ViceRaiseBg() {
  // Sports car silhouette at bottom right
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 70 48" preserveAspectRatio="xMaxYMax meet">
        {/* Car body */}
        <Path d="M 18 38 L 18 32 L 24 28 L 42 27 L 50 31 L 56 31 L 56 38 Z"
          fill="#000" fillOpacity={0.35} />
        {/* Windshield */}
        <Path d="M 26 28 L 24 28 L 30 28 L 38 28 L 42 31 Z"
          fill="#6060AA" fillOpacity={0.20} />
        {/* Wheels */}
        <Circle cx={26} cy={38} r={4.5} fill="#000" fillOpacity={0.45} />
        <Circle cx={47} cy={38} r={4.5} fill="#000" fillOpacity={0.45} />
        {/* Tail glow */}
        <Ellipse cx={18} cy={33} rx={3} ry={2.5} fill="#FF2FAE" fillOpacity={0.50} />
        <Ellipse cx={18} cy={33} rx={8} ry={5} fill="#FF2FAE" fillOpacity={0.12} />
        {/* Street */}
        <Line x1={0} y1={44} x2={70} y2={44} stroke="#FF2FAE" strokeWidth={0.6} strokeOpacity={0.18} />
        {/* Neon underglow */}
        <Ellipse cx={37} cy={42} rx={22} ry={3} fill="#FF2FAE" fillOpacity={0.08} />
      </Svg>
    </View>
  );
}

function ViceAllInBg() {
  // Palm tree silhouettes flanking
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 70 48" preserveAspectRatio="xMidYMax meet">
        {/* Left palm */}
        <Path d="M 8 48 C 8 40, 9 32, 10 24" stroke="#FF2FAE" strokeWidth={1.8} strokeOpacity={0.35} strokeLinecap="round" />
        <Path d="M 10 24 C 16 20, 20 23, 20 27" stroke="#FF2FAE" strokeWidth={1.0} strokeOpacity={0.30} strokeLinecap="round" />
        <Path d="M 10 24 C 4 20, 1 23, 1 27" stroke="#FF2FAE" strokeWidth={1.0} strokeOpacity={0.30} strokeLinecap="round" />
        <Path d="M 10 24 C 11 18, 12 15, 11 12" stroke="#FF2FAE" strokeWidth={0.9} strokeOpacity={0.28} strokeLinecap="round" />
        {/* Right palm */}
        <Path d="M 62 48 C 62 40, 61 32, 60 24" stroke="#FF2FAE" strokeWidth={1.8} strokeOpacity={0.35} strokeLinecap="round" />
        <Path d="M 60 24 C 66 20, 70 23, 70 27" stroke="#FF2FAE" strokeWidth={1.0} strokeOpacity={0.30} strokeLinecap="round" />
        <Path d="M 60 24 C 54 20, 50 23, 50 27" stroke="#FF2FAE" strokeWidth={1.0} strokeOpacity={0.30} strokeLinecap="round" />
        <Path d="M 60 24 C 59 18, 58 15, 59 12" stroke="#FF2FAE" strokeWidth={0.9} strokeOpacity={0.28} strokeLinecap="round" />
        {/* Sun/glow circle center */}
        <Circle cx={35} cy={36} r={10} fill="#FFD700" fillOpacity={0.06} />
        <Circle cx={35} cy={36} r={6} fill="#FFD700" fillOpacity={0.08} />
      </Svg>
    </View>
  );
}

// ─── Vice Nights palm ornament ────────────────────────────────────────────────
function VicePalmOrnament({ color = '#FF2FAE' }: { color?: string }) {
  const S = 16;
  const cx = S / 2;
  const crownY = S * 0.25;
  const L = S * 0.35;
  return (
    <Svg width={S} height={S} viewBox={`0 0 ${S} ${S}`}>
      <Path d={`M ${cx-1} ${S} C ${cx+1} ${S*0.6}, ${cx-1} ${S*0.5}, ${cx} ${crownY}`}
        stroke={color} strokeWidth={2} strokeLinecap="round" fill="none" strokeOpacity={0.9} />
      <Path d={`M ${cx} ${crownY} C ${cx+L*0.4} ${crownY-L*0.4}, ${cx+L} ${crownY}, ${cx+L} ${crownY+L*0.4}`}
        stroke={color} strokeWidth={1} strokeLinecap="round" fill="none" strokeOpacity={0.85} />
      <Path d={`M ${cx} ${crownY} C ${cx+L*0.2} ${crownY-L*0.7}, ${cx+L*0.5} ${crownY-L}, ${cx+L*0.5} ${crownY-L*0.6}`}
        stroke={color} strokeWidth={1} strokeLinecap="round" fill="none" strokeOpacity={0.85} />
      <Path d={`M ${cx} ${crownY} C ${cx} ${crownY-L*0.8}, ${cx} ${crownY-L*1.1}, ${cx} ${crownY-L}`}
        stroke={color} strokeWidth={1} strokeLinecap="round" fill="none" strokeOpacity={0.85} />
      <Path d={`M ${cx} ${crownY} C ${cx-L*0.2} ${crownY-L*0.7}, ${cx-L*0.5} ${crownY-L}, ${cx-L*0.5} ${crownY-L*0.6}`}
        stroke={color} strokeWidth={1} strokeLinecap="round" fill="none" strokeOpacity={0.85} />
      <Path d={`M ${cx} ${crownY} C ${cx-L*0.4} ${crownY-L*0.4}, ${cx-L} ${crownY}, ${cx-L} ${crownY+L*0.4}`}
        stroke={color} strokeWidth={1} strokeLinecap="round" fill="none" strokeOpacity={0.85} />
    </Svg>
  );
}

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
    ? { backgroundColor: 'rgba(5,3,20,0.97)', borderTopColor: 'rgba(255,47,174,0.50)' }
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
                    isVice   && { backgroundColor: 'rgba(5,3,20,0.7)',  borderWidth: 1, borderColor: 'rgba(255,47,174,0.30)' },
                  ]}
                  onPress={() => setRaiseAmount(clampRaise(b.amount))}
                  disabled={disabled}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.quickLabel,
                    isDragon && { color: 'rgba(200,155,60,0.55)' },
                    isVice   && { color: 'rgba(0,229,255,0.55)' },
                  ]}>
                    {b.label}
                  </Text>
                  <Text style={[
                    styles.quickAmt,
                    isDragon && { color: '#EAE3D2' },
                    isVice   && { color: '#F2F2F2' },
                  ]}>
                    {fmt(b.amount)}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[
                  styles.quickBtn,
                  isDragon ? { backgroundColor: 'rgba(50,0,0,0.5)',   borderWidth: 1, borderColor: 'rgba(139,0,0,0.45)' }
                  : isVice   ? { backgroundColor: 'rgba(60,0,40,0.5)',  borderWidth: 1, borderColor: 'rgba(255,47,174,0.45)' }
                  : styles.quickAllIn,
                ]}
                onPress={() => setRaiseAmount(maxRaise)}
                disabled={disabled}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.quickLabel,
                  isDragon ? { color: '#8B0000'  } : isVice ? { color: '#FF2FAE' } : { color: colors.secondary },
                ]}>
                  ALL IN
                </Text>
                <Text style={[
                  styles.quickAmt,
                  isDragon ? { color: '#C89B3C'  } : isVice ? { color: '#ffd700' } : { color: colors.secondary },
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
            <View style={vn.raiseRow}>
              <VicePalmOrnament color="#FF2FAE" />
              <Text style={vn.raiseLabel}>RAISE</Text>
              <Text style={vn.raiseAmt}>{fmt(raiseAmount)}</Text>
              <VicePalmOrnament color="#00E5FF" />
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
                isDragon && { backgroundColor: 'rgba(40,0,0,0.5)' },
                isVice   && { backgroundColor: 'transparent' },
              ]}
              onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
              {...panResponder.panHandlers}
            >
              {/* Vice: full-width gradient track always visible (cyan→pink) */}
              {isVice && (
                <LinearGradient
                  colors={['#0088AA', '#00E5FF', '#CC00AA', '#FF2FAE']}
                  start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
                  style={[StyleSheet.absoluteFill, { borderRadius: 14, opacity: 0.28 }]}
                />
              )}
              {/* Fill */}
              <View style={[styles.sliderFill, { width: `${Math.round(sliderRatio * 100)}%` }]}>
                {isDragon ? (
                  <LinearGradient colors={['#3B0000', '#8B0000']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
                ) : isVice ? (
                  <LinearGradient colors={['#FF2FAE', '#00E5FF']}
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
              ) : isVice ? (
                <View style={[styles.sliderHandle, { left: handleLeft, overflow: 'visible',
                  shadowColor: '#FF2FAE', shadowOpacity: 0.8, shadowRadius: 8 }]}>
                  <VicePalmOrnament color="#FF2FAE" />
                </View>
              ) : (
                <View style={[styles.sliderHandle, { left: handleLeft }]}>
                  <LinearGradient colors={[colors.primary, '#0088cc']} style={styles.handleGradient} />
                </View>
              )}
            </View>

            <View style={styles.sliderLabels}>
              <Text style={[styles.sliderMin, isDragon && { color: 'rgba(200,155,60,0.35)' }]}>
                {fmt(minRaise)}
              </Text>
              <Text style={[styles.sliderMax, isDragon && { color: 'rgba(200,155,60,0.35)' }]}>
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
            colors={isDragon ? ['rgba(80,0,0,0.25)','rgba(30,0,0,0.15)']
              : ['transparent','transparent']}
            style={StyleSheet.absoluteFill}
          />
          {isVice && <ViceFoldBg />}
          <Text style={[styles.foldText, isDragon && dr.foldText, isVice && vn.foldText]}>FOLD</Text>
        </TouchableOpacity>

        {/* CHECK / CALL */}
        {canCheck ? (
          <TouchableOpacity
            style={[styles.actionBtn, isDragon ? dr.checkBtn : isVice ? vn.checkBtn : styles.checkBtn]}
            onPress={onCheck} disabled={disabled} activeOpacity={0.75}
          >
            <LinearGradient
              colors={isDragon ? ['rgba(15,50,40,0.35)','rgba(10,30,25,0.20)']
                : ['rgba(0,180,80,0.3)','rgba(0,120,50,0.15)']}
              style={StyleSheet.absoluteFill}
            />
            {isVice && <ViceCallBg />}
            <Text style={[styles.checkText, isDragon && dr.checkText, isVice && vn.checkText]}>CHECK</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionBtn, isDragon ? dr.callBtn : isVice ? vn.callBtn : styles.callBtn]}
            onPress={onCall} disabled={disabled} activeOpacity={0.75}
          >
            <LinearGradient
              colors={isDragon ? ['rgba(15,50,40,0.35)','rgba(10,30,25,0.20)']
                : ['rgba(0,180,80,0.3)','rgba(0,120,50,0.15)']}
              style={StyleSheet.absoluteFill}
            />
            {isVice && <ViceCallBg />}
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
              colors={isDragon ? ['rgba(30,20,0,0.40)','rgba(15,10,0,0.25)']
                : ['rgba(0,140,200,0.35)','rgba(0,80,140,0.18)']}
              style={StyleSheet.absoluteFill}
            />
            {isVice && <ViceRaiseBg />}
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
              colors={isDragon ? ['rgba(90,0,0,0.35)','rgba(40,0,0,0.20)']
                : ['rgba(180,0,100,0.35)','rgba(120,0,70,0.18)']}
              style={StyleSheet.absoluteFill}
            />
            {isVice && <ViceAllInBg />}
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

// ─── Vice Nights overrides ────────────────────────────────────────────────────
const vn = StyleSheet.create({
  raiseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 2,
  },
  raiseLabel: {
    color: '#FF2FAE',
    fontSize: 9,
    fontWeight: '700',
    fontStyle: 'italic',
    letterSpacing: 2,
    fontFamily: 'Inter_700Bold',
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

  // FOLD — solid hot pink/magenta (matches reference)
  foldBtn: {
    backgroundColor: '#A8004E',
    borderWidth: 1.5,
    borderColor: '#FF2FAE',
    shadowColor: '#FF2FAE',
    shadowOpacity: 0.60,
    shadowRadius: 10,
  },
  foldText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },

  // CHECK — solid teal (matches reference CALL button style)
  checkBtn: {
    backgroundColor: '#085C5C',
    borderWidth: 1.5,
    borderColor: '#00E5FF',
    shadowColor: '#00E5FF',
    shadowOpacity: 0.45,
    shadowRadius: 8,
  },
  checkText: { color: '#FFFFFF' },

  // CALL — solid teal (matches reference)
  callBtn: {
    backgroundColor: '#085C5C',
    borderWidth: 1.5,
    borderColor: '#00E5FF',
    shadowColor: '#00E5FF',
    shadowOpacity: 0.45,
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

  // RAISE — solid dark navy (matches reference)
  raiseBtn: {
    backgroundColor: '#18285A',
    borderWidth: 1.5,
    borderColor: '#6060FF',
    shadowColor: '#6060FF',
    shadowOpacity: 0.40,
    shadowRadius: 8,
  },
  raiseText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
    fontFamily: 'Orbitron_400Regular',
  },
  raiseInlineAmt: {
    color: '#FF2FAE',
    fontSize: 12,
    fontWeight: '900',
    fontFamily: 'Inter_700Bold',
  },

  // ALL IN — solid hot pink, gold text (matches reference)
  allInBtn: {
    backgroundColor: '#A8004E',
    borderWidth: 1.5,
    borderColor: '#FF2FAE',
    shadowColor: '#FF2FAE',
    shadowOpacity: 0.60,
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
