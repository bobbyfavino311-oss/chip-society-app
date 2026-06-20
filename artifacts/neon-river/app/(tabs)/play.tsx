import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, Modal, Platform, Pressable, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { useUser } from '@/context/UserContext';

// ─── Casino SVG icons ─────────────────────────────────────────────────────────

function ThreeCardPokerIcon({ size = 15, color = '#ffd700' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* Left card rotated into fan */}
      <G transform="rotate(-22, 12, 20)">
        <Rect x="6.5" y="4" width="11" height="16" rx="2"
          fill={`${color}20`} stroke={color} strokeWidth="1.3" />
      </G>
      {/* Right card rotated into fan */}
      <G transform="rotate(22, 12, 20)">
        <Rect x="6.5" y="4" width="11" height="16" rx="2"
          fill={`${color}20`} stroke={color} strokeWidth="1.3" />
      </G>
      {/* Center card — front */}
      <Rect x="6.5" y="4" width="11" height="16" rx="2"
        fill="#050010" stroke={color} strokeWidth="1.6" />
      {/* Diamond pip */}
      <Path d="M12 9 L14 12.5 L12 16 L10 12.5 Z" fill={color} />
    </Svg>
  );
}

function BlackjackIcon({ size = 15, color = '#ffd700' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* Back card (face card offset) */}
      <Rect x="9" y="3" width="12" height="17" rx="2"
        fill={`${color}18`} stroke={color} strokeWidth="1.3" />
      {/* Front card (ace) */}
      <Rect x="3" y="5" width="12" height="17" rx="2"
        fill="#050010" stroke={color} strokeWidth="1.6" />
      {/* "A" label */}
      <SvgText x="5.8" y="17" fontSize="10" fontWeight="bold" fill={color}>A</SvgText>
      {/* Spade — head (two curves + point) + stem */}
      <Path
        d="M9 8.5 C9 8.5 6 11 6 12.5 C6 13.6 7 14.2 8 13.6 C7.5 14.8 7 15.2 7 15.2 L11 15.2 C11 15.2 10.5 14.8 10 13.6 C11 14.2 12 13.6 12 12.5 C12 11 9 8.5 9 8.5Z"
        fill={color}
      />
    </Svg>
  );
}

// ─── Stake Tiers ──────────────────────────────────────────────────────────────

type StakeTier = 'MICRO' | 'LOW' | 'STANDARD' | 'HIGH_ROLLER' | 'VIP' | 'ELITE';

interface StakeDef {
  tier: StakeTier;
  label: string;
  blinds: string;
  minBuyIn: number;
  maxBuyIn: number;
  color: string;
}

const STAKES: StakeDef[] = [
  { tier: 'MICRO',       label: 'MICRO',       blinds: '25 / 50',      minBuyIn: 1_000,    maxBuyIn: 5_000,     color: '#00e887' },
  { tier: 'LOW',         label: 'LOW',         blinds: '100 / 200',    minBuyIn: 4_000,    maxBuyIn: 20_000,    color: '#00d4ff' },
  { tier: 'STANDARD',   label: 'STANDARD',    blinds: '500 / 1K',     minBuyIn: 20_000,   maxBuyIn: 100_000,   color: '#00d4ff' },
  { tier: 'HIGH_ROLLER', label: 'HIGH ROLLER', blinds: '2.5K / 5K',   minBuyIn: 100_000,  maxBuyIn: 500_000,   color: '#bf5fff' },
  { tier: 'VIP',         label: 'VIP',         blinds: '10K / 20K',    minBuyIn: 400_000,  maxBuyIn: 2_000_000, color: '#ffd700' },
  { tier: 'ELITE',       label: 'ELITE',       blinds: '50K / 100K',   minBuyIn: 2_000_000,maxBuyIn:10_000_000, color: '#ff0090' },
];

function formatChips(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K`;
  return n.toLocaleString();
}

function getAutoTier(chips: number): StakeTier {
  if (chips >= 2_000_000) return 'ELITE';
  if (chips >= 400_000)   return 'VIP';
  if (chips >= 100_000)   return 'HIGH_ROLLER';
  if (chips >= 20_000)    return 'STANDARD';
  if (chips >= 4_000)     return 'LOW';
  return 'MICRO';
}

// ─── Option row ───────────────────────────────────────────────────────────────
interface OptionDef {
  label: string;
  icon: string;
  iconNode?: React.ReactNode;
  sub?: string;
  onPress?: () => void;
  locked?: boolean;
}

function OptionRow({ opt, accent }: { opt: OptionDef; accent: string }) {
  if (opt.locked) {
    return (
      <View style={[or.row, or.rowLocked]}>
        <View style={or.iconWrap}>
          <Ionicons name="lock-closed-outline" size={13} color="rgba(255,255,255,0.18)" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={or.labelLocked}>{opt.label}</Text>
          {opt.sub && <Text style={or.sub}>{opt.sub}</Text>}
        </View>
        <View style={or.soonBadge}>
          <Text style={or.soonText}>SOON</Text>
        </View>
      </View>
    );
  }
  return (
    <TouchableOpacity style={[or.row, { borderColor: `${accent}35`, overflow: 'hidden' }]} onPress={opt.onPress} activeOpacity={0.8}>
      <LinearGradient colors={[`${accent}18`, 'transparent']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
      <View style={[or.iconWrap, { backgroundColor: `${accent}1a`, borderColor: `${accent}45` }]}>
        {opt.iconNode
          ? opt.iconNode
          : <Ionicons name={opt.icon as any} size={14} color={accent} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[or.label, { color: accent }]}>{opt.label}</Text>
        {opt.sub && <Text style={or.sub}>{opt.sub}</Text>}
      </View>
      <View style={[or.playBtn, { backgroundColor: `${accent}22`, borderColor: `${accent}55` }]}>
        <Ionicons name="play" size={11} color={accent} />
      </View>
    </TouchableOpacity>
  );
}

const or = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  rowLocked:   { opacity: 0.42, backgroundColor: 'rgba(255,255,255,0.015)' },
  iconWrap:    { width: 32, height: 32, borderRadius: 9, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  label:       { fontSize: 11, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 0.8 },
  labelLocked: { fontSize: 11, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 0.8, color: 'rgba(255,255,255,0.28)' },
  sub:         { fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 1 },
  soonBadge:   { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  soonText:    { fontSize: 8, fontWeight: '800', fontFamily: 'Orbitron_700Bold', letterSpacing: 1, color: 'rgba(255,255,255,0.2)' },
  playBtn:     { width: 28, height: 28, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});

// ─── Section card ─────────────────────────────────────────────────────────────
interface SectionCardProps {
  section?: string; accent: string; icon: string; title: string;
  lines: string[]; options: OptionDef[]; locked?: boolean;
  onPress?: () => void; lockedLabel?: string; lockedSub?: string;
}

function SectionCard({ section, accent, icon, title, lines, options, locked, onPress, lockedLabel, lockedSub }: SectionCardProps) {
  const borderColor = locked ? 'rgba(255,215,0,0.2)' : `${accent}38`;
  const topBar      = locked ? 'rgba(255,215,0,0.5)' : accent;
  const titleColor  = locked ? 'rgba(255,215,0,0.7)' : accent;
  const isActive    = !!onPress && !locked;

  const cardContent = (
    <View style={[sc.card, { borderColor }, locked && sc.cardLocked]}>
      <LinearGradient
        colors={locked ? ['rgba(255,215,0,0.06)', 'transparent'] : [`${accent}10`, 'transparent']}
        style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />
      <View style={[sc.topBar, { backgroundColor: topBar }]} />
      <View style={sc.header}>
        <View style={[sc.iconWrap, { backgroundColor: `${accent}15`, borderColor: `${accent}40` }]}>
          <Ionicons name={icon as any} size={19} color={locked ? 'rgba(255,215,0,0.45)' : accent} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[sc.title, { color: titleColor }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{title}</Text>
          {lines.map((l, i) => <Text key={i} style={sc.line}>{l}</Text>)}
        </View>
        {isActive && (
          <View style={[sc.actionBadge, { backgroundColor: `${accent}22`, borderColor: `${accent}55` }]}>
            <Ionicons name="play" size={14} color={accent} />
          </View>
        )}
        {locked && (
          <View style={sc.soonBadge}>
            <Ionicons name="lock-closed" size={9} color="rgba(255,215,0,0.4)" />
            <Text style={sc.soonText}>SOON</Text>
          </View>
        )}
      </View>
      {(options.length > 0 || locked) && (
        <>
          <View style={sc.divider} />
          {locked ? (
            <View style={sc.lockedRow}>
              <Text style={sc.lockedTitle}>{lockedLabel ?? 'COMING SOON'}</Text>
              <Text style={sc.lockedSub}>{lockedSub ?? 'Arriving in a future update.'}</Text>
            </View>
          ) : (
            <View style={sc.optList}>
              {options.map(o => <OptionRow key={o.label} opt={o} accent={accent} />)}
            </View>
          )}
        </>
      )}
    </View>
  );

  return (
    <View style={sc.wrap}>
      {section ? <Text style={sc.sectionLabel}>{section}</Text> : null}
      {isActive
        ? <TouchableOpacity onPress={onPress} activeOpacity={0.82}>{cardContent}</TouchableOpacity>
        : cardContent
      }
    </View>
  );
}

const sc = StyleSheet.create({
  wrap:         { marginBottom: 6 },
  sectionLabel: { fontSize: 9, fontWeight: '700', fontFamily: 'Orbitron_700Bold', letterSpacing: 2.5, color: 'rgba(255,255,255,0.32)', marginBottom: 10, marginTop: 8 },
  card:         { borderRadius: 18, borderWidth: 1, overflow: 'hidden', padding: 16, gap: 14 },
  cardLocked:   { opacity: 0.52 },
  topBar:       { position: 'absolute', top: 0, left: 0, right: 0, height: 2 },
  header:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconWrap:     { width: 40, height: 40, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title:        { fontSize: 13, fontWeight: '900', fontFamily: 'Orbitron_900Black', letterSpacing: 0, flexShrink: 1 },
  line:         { fontSize: 10, color: 'rgba(255,255,255,0.38)', marginTop: 2 },
  divider:      { height: 1, backgroundColor: 'rgba(255,255,255,0.07)' },
  optList:      { gap: 8 },
  actionBadge:  { width: 34, height: 34, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  soonBadge:    { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 7, backgroundColor: 'rgba(255,215,0,0.06)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.15)', flexShrink: 0 },
  soonText:     { fontSize: 7, fontWeight: '800', fontFamily: 'Orbitron_700Bold', color: 'rgba(255,215,0,0.4)', letterSpacing: 0.5 },
  lockedRow:    { paddingVertical: 4, gap: 4 },
  lockedTitle:  { fontSize: 11, fontWeight: '900', fontFamily: 'Orbitron_700Bold', color: 'rgba(255,215,0,0.5)', letterSpacing: 1.5 },
  lockedSub:    { fontSize: 10, color: 'rgba(255,255,255,0.28)' },
});

// ─── Quick Play Modal ─────────────────────────────────────────────────────────

type QpStep = 'opponent' | 'stakes' | 'matching';
type OpponentType = 'ai' | 'live';

function QuickPlayModal({ visible, variant, chips, onClose }: {
  visible: boolean; variant: string; chips: number; onClose: () => void;
}) {
  const [step, setStep]          = useState<QpStep>('opponent');
  const [opponent, setOpponent]  = useState<OpponentType>('ai');
  const [stake, setStake]        = useState<StakeDef | null>(null);
  const [dotCount, setDotCount]  = useState(0);
  const [found, setFound]        = useState(false);
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const glowAnim  = useRef(new Animated.Value(0)).current;

  const availableStakes = STAKES.filter(s => chips >= s.minBuyIn);

  useEffect(() => {
    if (!visible) {
      setStep('opponent'); setOpponent('ai'); setStake(null);
      setDotCount(0); setFound(false);
      scaleAnim.setValue(0.92);
      return;
    }
    Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 100, useNativeDriver: true }).start();
  }, [visible]);

  useEffect(() => {
    if (step !== 'matching') return;
    const dotTimer = setInterval(() => setDotCount(d => (d + 1) % 4), 500);
    const foundTimer = setTimeout(() => {
      setFound(true);
      clearInterval(dotTimer);
      Animated.loop(Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 420, useNativeDriver: true }),
      ])).start();
      setTimeout(() => {
        onClose();
        if (opponent === 'live') {
          router.push('/multiplayer/lobby' as any);
        } else {
          router.push(`/game/practice?variant=${variant}&players=5` as any);
        }
      }, 1000);
    }, 2400);
    return () => { clearInterval(dotTimer); clearTimeout(foundTimer); };
  }, [step]);

  if (!visible) return null;

  const autoTier = getAutoTier(chips);
  const color = stake?.color ?? STAKES.find(s => s.tier === autoTier)?.color ?? '#00d4ff';
  const dots = '.'.repeat(dotCount);

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <View style={qp.overlay}>
        <Animated.View style={[qp.card, { transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient colors={['#14002e', '#07001a']} style={StyleSheet.absoluteFill} />
          <View style={[qp.topBar, { backgroundColor: color }]} />

          {/* ── Step 1: Opponent type ── */}
          {step === 'opponent' && (
            <>
              <Text style={qp.heading}>WHO DO YOU WANT{'\n'}TO PLAY AGAINST?</Text>

              <TouchableOpacity
                style={[qp.opponentCard, opponent === 'ai' && qp.opponentCardActive, { borderColor: opponent === 'ai' ? '#00d4ff' : '#222' }]}
                onPress={() => setOpponent('ai')}
                activeOpacity={0.8}
              >
                {opponent === 'ai' && <LinearGradient colors={['#00d4ff15', 'transparent']} style={StyleSheet.absoluteFill} />}
                <Text style={qp.opponentEmoji}>🤖</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[qp.opponentTitle, opponent === 'ai' && { color: '#00d4ff' }]}>AI PLAYERS</Text>
                  <Text style={qp.opponentSub}>Fastest Match · Instant Game</Text>
                  <Text style={qp.opponentSub}>Fill remaining seats with bots</Text>
                </View>
                {opponent === 'ai' && <Ionicons name="checkmark-circle" size={20} color="#00d4ff" />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[qp.opponentCard, opponent === 'live' && qp.opponentCardActive, { borderColor: opponent === 'live' ? '#ff0090' : '#222' }]}
                onPress={() => setOpponent('live')}
                activeOpacity={0.8}
              >
                {opponent === 'live' && <LinearGradient colors={['#ff009015', 'transparent']} style={StyleSheet.absoluteFill} />}
                <Text style={qp.opponentEmoji}>🌎</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[qp.opponentTitle, opponent === 'live' && { color: '#ff0090' }]}>LIVE PLAYERS</Text>
                  <Text style={qp.opponentSub}>Search for real players</Text>
                  <Text style={qp.opponentSub}>Fill empty seats with AI if needed</Text>
                </View>
                {opponent === 'live' && <Ionicons name="checkmark-circle" size={20} color="#ff0090" />}
              </TouchableOpacity>

              <View style={qp.btnRow}>
                <TouchableOpacity style={qp.cancelBtn} onPress={onClose}>
                  <Text style={qp.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[qp.nextBtn, { backgroundColor: `${opponent === 'ai' ? '#00d4ff' : '#ff0090'}22`, borderColor: opponent === 'ai' ? '#00d4ff' : '#ff0090' }]}
                  onPress={() => setStep('stakes')}
                >
                  <Text style={[qp.nextText, { color: opponent === 'ai' ? '#00d4ff' : '#ff0090' }]}>SELECT STAKES</Text>
                  <Ionicons name="arrow-forward" size={14} color={opponent === 'ai' ? '#00d4ff' : '#ff0090'} />
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* ── Step 2: Stakes ── */}
          {step === 'stakes' && (
            <>
              <View style={qp.stakeHeader}>
                <Pressable onPress={() => setStep('opponent')} style={qp.backBtn}>
                  <Ionicons name="chevron-back" size={18} color="rgba(255,255,255,0.5)" />
                </Pressable>
                <Text style={qp.heading2}>SELECT TABLE STAKES</Text>
              </View>

              <Text style={qp.subText}>Only tables you can afford are shown.</Text>

              {availableStakes.length === 0 ? (
                <View style={qp.noStakesBox}>
                  <Text style={qp.noStakesText}>Not enough chips for any table.</Text>
                  <Text style={qp.noStakesSub}>Win more chips in AI Practice first.</Text>
                </View>
              ) : (
                <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                  {availableStakes.map(s => {
                    const active = stake?.tier === s.tier;
                    return (
                      <TouchableOpacity
                        key={s.tier}
                        style={[qp.stakeRow, active && { borderColor: s.color, backgroundColor: `${s.color}12` }]}
                        onPress={() => setStake(s)}
                        activeOpacity={0.8}
                      >
                        <View style={[qp.stakeTierBadge, { backgroundColor: `${s.color}18`, borderColor: `${s.color}50` }]}>
                          <Text style={[qp.stakeTierLabel, { color: s.color }]}>{s.label}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[qp.stakeBlinds, { color: active ? s.color : '#ccc' }]}>{s.blinds}</Text>
                          <Text style={qp.stakeBuyIn}>Buy-in: {formatChips(s.minBuyIn)} – {formatChips(s.maxBuyIn)}</Text>
                        </View>
                        {active && <Ionicons name="checkmark-circle" size={18} color={s.color} />}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

              <View style={qp.btnRow}>
                <TouchableOpacity style={qp.cancelBtn} onPress={onClose}>
                  <Text style={qp.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[qp.nextBtn, (!stake || availableStakes.length === 0) && qp.nextBtnDisabled]}
                  onPress={() => stake && setStep('matching')}
                  disabled={!stake}
                >
                  <Text style={qp.nextText}>FIND MATCH</Text>
                  <Ionicons name="flash" size={14} color={stake?.color ?? '#00d4ff'} />
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* ── Step 3: Matching ── */}
          {step === 'matching' && (
            <>
              {!found ? (
                <>
                  <View style={qp.searchIcon}>
                    <Ionicons name={opponent === 'ai' ? 'game-controller' : 'search'} size={28} color={color} />
                  </View>
                  <Text style={[qp.matchTitle, { color }]}>
                    {opponent === 'ai' ? 'STARTING GAME' : 'FINDING MATCH'}{dots}
                  </Text>
                  <View style={[qp.matchBadge, { borderColor: `${color}50`, backgroundColor: `${color}12` }]}>
                    <Ionicons name="layers" size={11} color={color} />
                    <Text style={[qp.matchBadgeLabel, { color }]}>{stake?.label ?? autoTier}</Text>
                    <Text style={qp.matchBadgeBlinds}>{stake?.blinds}</Text>
                  </View>
                  <Text style={qp.matchDesc}>
                    {opponent === 'ai' ? 'Seating AI players...' : 'Searching for live players near your bankroll...'}
                  </Text>
                  <View style={qp.playerRow}>
                    {[1,2,3,4,5].map(i => (
                      <View key={i} style={qp.playerSlot}>
                        <View style={[qp.playerDot, i === 3 && { backgroundColor: color }]} />
                        <Text style={qp.playerLabel}>{i === 3 ? 'You' : '...'}</Text>
                      </View>
                    ))}
                  </View>
                  <TouchableOpacity style={qp.cancelBtn} onPress={onClose}>
                    <Text style={qp.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Animated.View style={[qp.foundIcon, { opacity: glowAnim }]}>
                    <Ionicons name="checkmark-circle" size={44} color={color} />
                  </Animated.View>
                  <Text style={[qp.matchTitle, { color }]}>
                    {opponent === 'ai' ? 'GAME STARTING!' : 'MATCH FOUND!'}
                  </Text>
                  <Text style={qp.matchDesc}>Entering table{dots}</Text>
                </>
              )}
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const qp = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.88)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  card:       { width: '100%', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden', padding: 22, gap: 14 },
  topBar:     { position: 'absolute', top: 0, left: 0, right: 0, height: 2 },

  heading:    { fontSize: 16, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 1.5, color: '#fff', textAlign: 'center', lineHeight: 22 },
  heading2:   { fontSize: 13, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 1.5, color: '#fff', flex: 1 },
  subText:    { fontSize: 11, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: -6 },

  opponentCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1.5, borderRadius: 14, padding: 14,
    overflow: 'hidden',
  },
  opponentCardActive: { },
  opponentEmoji: { fontSize: 28 },
  opponentTitle:{ fontSize: 13, fontWeight: '900', fontFamily: 'Orbitron_700Bold', color: '#fff', letterSpacing: 0.5 },
  opponentSub:  { fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 1 },

  stakeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backBtn:     { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  stakeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderRadius: 12, borderColor: 'rgba(255,255,255,0.1)',
    padding: 12, marginBottom: 8,
  },
  stakeTierBadge:  { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  stakeTierLabel:  { fontFamily: 'Orbitron_700Bold', fontSize: 9, letterSpacing: 1 },
  stakeBlinds:     { fontFamily: 'Inter_700Bold', fontSize: 15 },
  stakeBuyIn:      { fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 },
  noStakesBox:     { paddingVertical: 20, alignItems: 'center', gap: 8 },
  noStakesText:    { fontFamily: 'Orbitron_700Bold', fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  noStakesSub:     { fontSize: 11, color: 'rgba(255,255,255,0.25)' },

  searchIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignSelf: 'center' },
  foundIcon:  { width: 64, height: 64, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  matchTitle: { fontSize: 15, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 2, textAlign: 'center' },
  matchBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'center' },
  matchBadgeLabel: { fontSize: 11, fontWeight: '800', fontFamily: 'Orbitron_700Bold', letterSpacing: 1 },
  matchBadgeBlinds:{ color: 'rgba(255,255,255,0.35)', fontSize: 10 },
  matchDesc:   { color: 'rgba(255,255,255,0.4)', fontSize: 12, textAlign: 'center' },
  playerRow:   { flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center' },
  playerSlot:  { alignItems: 'center', gap: 4 },
  playerDot:   { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.15)' },
  playerLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: '600' },

  btnRow:       { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn:    { flex: 1, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 12 },
  cancelText:   { color: 'rgba(255,255,255,0.35)', fontSize: 12 },
  nextBtn:      { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderWidth: 1, borderColor: '#00d4ff', borderRadius: 12, backgroundColor: 'rgba(0,212,255,0.1)' },
  nextBtnDisabled: { borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.03)' },
  nextText:     { fontFamily: 'Orbitron_700Bold', fontSize: 11, color: '#00d4ff', letterSpacing: 1 },
});

// ─── Private Table Modal ──────────────────────────────────────────────────────

function PrivateTableModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<'menu' | 'join'>('menu');
  const [code, setCode] = useState('');
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (!visible) { setMode('menu'); setCode(''); return; }
    Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 100, useNativeDriver: true }).start();
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <Pressable style={pt.overlay} onPress={onClose}>
        <Animated.View style={[pt.card, { transform: [{ scale: scaleAnim }] }]}>
          {/* Stop tap-through so tapping inside the card doesn't dismiss */}
          <Pressable onPress={e => e.stopPropagation()}>
          <LinearGradient colors={['#14002e', '#07001a']} style={StyleSheet.absoluteFill} />
          <View style={[pt.topBar, { backgroundColor: '#ff0090' }]} />

          {/* Header row with close button */}
          <View style={pt.headingRow}>
            <Text style={pt.heading}>PRIVATE TABLE</Text>
            <TouchableOpacity style={pt.xBtn} onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={20} color="rgba(255,255,255,0.55)" />
            </TouchableOpacity>
          </View>

          {mode === 'menu' && (
            <>
              <Text style={pt.sub}>Host or join a private game with friends.</Text>

              <TouchableOpacity
                style={pt.bigBtn}
                onPress={() => { onClose(); router.push('/multiplayer/lobby?mode=host' as any); }}
                activeOpacity={0.8}
              >
                <LinearGradient colors={['#bf5fff25', 'transparent']} style={StyleSheet.absoluteFill} />
                <Ionicons name="add-circle-outline" size={22} color="#bf5fff" />
                <View style={{ flex: 1 }}>
                  <Text style={[pt.bigBtnTitle, { color: '#bf5fff' }]}>CREATE TABLE</Text>
                  <Text style={pt.bigBtnSub}>Set stakes, seat count, and get a room code</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#bf5fff" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[pt.bigBtn, { borderColor: '#ff009040' }]}
                onPress={() => setMode('join')}
                activeOpacity={0.8}
              >
                <LinearGradient colors={['#ff009015', 'transparent']} style={StyleSheet.absoluteFill} />
                <Ionicons name="enter-outline" size={22} color="#ff0090" />
                <View style={{ flex: 1 }}>
                  <Text style={[pt.bigBtnTitle, { color: '#ff0090' }]}>JOIN TABLE</Text>
                  <Text style={pt.bigBtnSub}>Enter a room code from your host</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#ff0090" />
              </TouchableOpacity>

              <View style={pt.featuresRow}>
                {['Friends', 'Home Games', 'Streamers', 'Club Games'].map(f => (
                  <View key={f} style={pt.featureBadge}>
                    <Ionicons name="checkmark-circle" size={11} color="rgba(255,0,144,0.5)" />
                    <Text style={pt.featureText}>{f}</Text>
                  </View>
                ))}
              </View>

            </>
          )}

          {mode === 'join' && (
            <>
              <Pressable style={pt.backBtn} onPress={() => setMode('menu')}>
                <Ionicons name="chevron-back" size={18} color="rgba(255,255,255,0.5)" />
                <Text style={pt.backText}>Back</Text>
              </Pressable>

              <Text style={pt.sub}>Enter the room code from your host.</Text>

              <View style={pt.codeInputWrap}>
                {/* Simple letter buttons simulate code entry for now */}
                <Text style={pt.codeDisplay}>{code || 'CS____'}</Text>
              </View>

              <View style={pt.btnRow2}>
                <TouchableOpacity style={pt.cancelBtn} onPress={() => setMode('menu')}>
                  <Text style={pt.cancelTxt}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[pt.joinBtn, { opacity: code.length < 4 ? 0.4 : 1 }]}
                  onPress={() => { onClose(); router.push(`/multiplayer/lobby?code=${code}` as any); }}
                  disabled={code.length < 4}
                >
                  <Text style={pt.joinTxt}>JOIN</Text>
                  <Ionicons name="arrow-forward" size={14} color="#ff0090" />
                </TouchableOpacity>
              </View>

              <Text style={pt.codeSub}>Go to the lobby to create or join tables directly.</Text>
              <TouchableOpacity onPress={() => { onClose(); router.push('/multiplayer/lobby' as any); }}>
                <Text style={pt.lobbyLink}>Open Full Lobby →</Text>
              </TouchableOpacity>
            </>
          )}
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const pt = StyleSheet.create({
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.88)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  card:          { width: '100%', borderRadius: 22, borderWidth: 1, borderColor: '#ff009030', overflow: 'hidden', padding: 22, gap: 14 },
  topBar:        { position: 'absolute', top: 0, left: 0, right: 0, height: 2 },
  headingRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heading:       { fontSize: 18, fontWeight: '900', fontFamily: 'Orbitron_900Black', letterSpacing: 2, color: '#fff', flex: 1 },
  xBtn:          { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  sub:           { fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: -6 },
  bigBtn:        { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#bf5fff40', borderRadius: 14, padding: 16, overflow: 'hidden' },
  bigBtnTitle:   { fontFamily: 'Orbitron_700Bold', fontSize: 13, letterSpacing: 1 },
  bigBtnSub:     { fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 },
  featuresRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  featureBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, backgroundColor: 'rgba(255,0,144,0.06)', borderWidth: 1, borderColor: 'rgba(255,0,144,0.15)' },
  featureText:   { fontSize: 10, color: 'rgba(255,255,255,0.4)' },
  closeBtn:      { alignItems: 'center', paddingVertical: 8 },
  closeTxt:      { color: 'rgba(255,255,255,0.3)', fontSize: 12 },
  backBtn:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText:      { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  codeInputWrap: { alignItems: 'center', borderWidth: 1.5, borderColor: '#ff009060', borderRadius: 12, paddingVertical: 14, backgroundColor: 'rgba(255,0,144,0.06)' },
  codeDisplay:   { fontFamily: 'Orbitron_700Bold', fontSize: 28, color: '#ff0090', letterSpacing: 8 },
  btnRow2:       { flexDirection: 'row', gap: 10 },
  cancelBtn:     { flex: 1, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 12 },
  cancelTxt:     { color: 'rgba(255,255,255,0.35)', fontSize: 12 },
  joinBtn:       { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderWidth: 1, borderColor: '#ff0090', borderRadius: 12, backgroundColor: 'rgba(255,0,144,0.1)' },
  joinTxt:       { fontFamily: 'Orbitron_700Bold', fontSize: 11, color: '#ff0090', letterSpacing: 1 },
  codeSub:       { fontSize: 10, color: 'rgba(255,255,255,0.25)', textAlign: 'center' },
  lobbyLink:     { fontSize: 12, color: '#ff0090', textAlign: 'center', textDecorationLine: 'underline' },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function PlayScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useUser();
  const [qpVisible, setQpVisible]       = useState(false);
  const [qpVariant, setQpVariant]       = useState('texas_holdem');
  const [ptVisible, setPtVisible]       = useState(false);

  function openQuickPlay(variant: string) {
    setQpVariant(variant);
    setQpVisible(true);
  }

  const autoTier = getAutoTier(profile.chips);
  const autoStake = STAKES.find(s => s.tier === autoTier);

  return (
    <View style={s.container}>
      <LinearGradient
        colors={['#050010', '#0a001e', '#050010']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />


      <ScrollView
        contentContainerStyle={[s.scroll, {
          paddingTop:    insets.top + (Platform.OS === 'web' ? 67 : 16),
          paddingBottom: insets.bottom + 90,
        }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.pageTitle}>PLAY</Text>
        <Text style={s.pageSub}>Choose your game mode</Text>

        {/* ── TRADITIONAL HOLD'EM ─────────────────────────────────────── */}
        <SectionCard
          section="TRADITIONAL HOLD'EM"
          accent="#00d4ff"
          icon="card-outline"
          title="NO LIMIT HOLD'EM"
          lines={['52-card deck · Standard rankings', 'Full House beats Flush']}
          options={[
            {
              label:   'AI PRACTICE',
              icon:    'game-controller-outline',
              sub:     'vs AI bots — fully offline',
              onPress: () => router.push('/game/practice?variant=texas_holdem&players=5' as any),
            },
            {
              label:   'QUICK PLAY',
              icon:    'flash-outline',
              sub:     `Auto-matched to ${autoStake?.label ?? 'your bracket'} · ${autoStake?.blinds ?? ''}`,
              onPress: () => openQuickPlay('texas_holdem'),
            },
          ]}
        />

        {/* ── SHORT DECK HOLD'EM ──────────────────────────────────────── */}
        <SectionCard
          section="SHORT DECK HOLD'EM"
          accent="#bf5fff"
          icon="layers-outline"
          title="SHORT DECK HOLD'EM"
          lines={['36-card deck · 6 through Ace only', 'Flush beats Full House']}
          options={[
            {
              label:   'AI PRACTICE',
              icon:    'game-controller-outline',
              sub:     'vs AI bots — fully offline',
              onPress: () => router.push('/game/practice?variant=short_deck_holdem&players=5' as any),
            },
            {
              label:   'QUICK PLAY',
              icon:    'flash-outline',
              sub:     `Auto-matched to ${autoStake?.label ?? 'your bracket'} · ${autoStake?.blinds ?? ''}`,
              onPress: () => openQuickPlay('short_deck_holdem'),
            },
          ]}
        />

        {/* ── CASINO ──────────────────────────────────────────────────── */}
        <SectionCard
          section="CASINO"
          accent="#ffd700"
          icon="diamond-outline"
          title="CASINO GAMES"
          lines={['House games · Win chips against the dealer']}
          options={[
            {
              label:    'THREE CARD POKER',
              icon:     'card-outline',
              iconNode: <ThreeCardPokerIcon size={15} color="#ffd700" />,
              sub:      'Ante · Pair Plus · 6 Card Bonus',
              onPress:  () => router.push('/casino/three-card-poker' as any),
            },
            {
              label:    'BLACKJACK',
              icon:     'card-outline',
              iconNode: <BlackjackIcon size={15} color="#ffd700" />,
              sub:      'Six Deck · Beat the dealer',
              onPress:  () => router.push('/casino/blackjack' as any),
            },
            {
              label:  'MORE GAMES COMING SOON',
              icon:   'dice-outline',
              sub:    'New casino games are currently in development',
              locked: true,
            },
          ]}
        />

        {/* ── PRIVATE TABLE ────────────────────────────────────────────── */}
        <SectionCard
          section="MULTIPLAYER"
          accent="#ff0090"
          icon="lock-open-outline"
          title="PRIVATE TABLE"
          lines={['Host or join a game with friends', 'Custom stakes · Room codes']}
          options={[
            {
              label:   'CREATE TABLE',
              icon:    'add-circle-outline',
              sub:     'Set stakes + get a shareable room code',
              onPress: () => setPtVisible(true),
            },
            {
              label:   'JOIN TABLE',
              icon:    'enter-outline',
              sub:     'Enter a room code to join a friend\'s table',
              onPress: () => setPtVisible(true),
            },
            {
              label:   'OPEN LOBBY',
              icon:    'globe-outline',
              sub:     'Browse all public tables',
              onPress: () => router.push('/multiplayer/lobby' as any),
            },
          ]}
        />

        {/* ── TOURNAMENTS ─────────────────────────────────────────────── */}
        <SectionCard
          section="TOURNAMENTS"
          accent="#ffd700"
          icon="trophy-outline"
          title="TOURNAMENTS"
          lines={['Multi-table tournaments · Prize pools · Brackets']}
          options={[]}
          locked
          lockedLabel="TOURNAMENTS COMING SOON"
          lockedSub="Poker tournaments, prize pools, and brackets are on the way."
        />
      </ScrollView>

      <QuickPlayModal
        visible={qpVisible}
        variant={qpVariant}
        chips={profile.chips}
        onClose={() => setQpVisible(false)}
      />

      <PrivateTableModal
        visible={ptVisible}
        onClose={() => setPtVisible(false)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050010' },
  scroll:    { paddingHorizontal: 16 },
  pageTitle: { fontSize: 26, fontWeight: '900', fontFamily: 'Orbitron_900Black', color: '#fff', letterSpacing: 3, marginBottom: 4 },
  pageSub:   { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8 },
});
