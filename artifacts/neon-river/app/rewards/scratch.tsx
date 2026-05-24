import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Defs, Mask, Rect, Path, G, Circle as SvgCircle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import colors from '@/constants/colors';
import { useUser } from '@/context/UserContext';
import { SoundEngine } from '@/lib/soundEngine';
import { formatChips } from '@/utils/chipColor';

// ─── Ticket themes ────────────────────────────────────────────────────────────

interface TicketTheme {
  name: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  rarityColor: string;
  foilA: string;
  foilB: string;
  foilC: string;
  accent: string;
  border: string;
  icon: string;
}

const THEMES: TicketTheme[] = [
  { name: 'Neon Nights',        rarity: 'COMMON',    rarityColor: '#00d4ff', foilA: '#0a1830', foilB: '#152845', foilC: '#0d2040', accent: '#00d4ff', border: '#00d4ff40', icon: '🌃' },
  { name: 'Vice Jackpot',       rarity: 'RARE',      rarityColor: '#bf5fff', foilA: '#180030', foilB: '#280050', foilC: '#1e0040', accent: '#bf5fff', border: '#bf5fff50', icon: '🎰' },
  { name: 'Midnight Mirage',    rarity: 'RARE',      rarityColor: '#00ccaa', foilA: '#001a28', foilB: '#002a40', foilC: '#001f35', accent: '#00ccaa', border: '#00ccaa44', icon: '🌙' },
  { name: 'Diamond Rush',       rarity: 'EPIC',      rarityColor: '#80c0ff', foilA: '#081020', foilB: '#10183a', foilC: '#0c1430', accent: '#80c0ff', border: '#80c0ff44', icon: '💎' },
  { name: 'Tokyo Heat',         rarity: 'EPIC',      rarityColor: '#ff0090', foilA: '#200010', foilB: '#350020', foilC: '#280018', accent: '#ff0090', border: '#ff009050', icon: '🗼' },
  { name: 'Royal Flush Frenzy', rarity: 'LEGENDARY', rarityColor: '#ffd700', foilA: '#1a1200', foilB: '#2a1e00', foilC: '#201800', accent: '#ffd700', border: '#ffd70055', icon: '👑' },
];

const RARITY_ORDER = { COMMON: 0, RARE: 1, EPIC: 2, LEGENDARY: 3 };
const RARITY_BORDER_COLORS: Record<string, string> = {
  COMMON: '#00d4ff', RARE: '#bf5fff', EPIC: '#ff6600', LEGENDARY: '#ffd700',
};

// ─── Prize config ─────────────────────────────────────────────────────────────

const PRIZES     = [1_000, 2_000, 5_000, 10_000, 25_000, 50_000];
const PRIZE_LBL  = ['1K',  '2K',  '5K',  '10K',  '25K',  '50K'];
const PRIZE_COLS = ['#00d4ff', '#0099ee', '#bf5fff', '#00ccaa', '#ffd700', '#ff0090'];

interface ScratchCell { value: number; label: string; colorIdx: number }

function buildTicket(): { cells: ScratchCell[]; prize: number } {
  const win  = Math.random() < 0.38;
  const cells: ScratchCell[] = [];

  if (win) {
    const tier = Math.floor(Math.random() * PRIZES.length);
    const matchPos = new Set<number>();
    while (matchPos.size < 3) matchPos.add(Math.floor(Math.random() * 9));
    for (let i = 0; i < 9; i++) {
      if (matchPos.has(i)) {
        cells.push({ value: PRIZES[tier], label: PRIZE_LBL[tier], colorIdx: tier });
      } else {
        let d = tier;
        while (d === tier) d = Math.floor(Math.random() * PRIZES.length);
        cells.push({ value: PRIZES[d], label: PRIZE_LBL[d], colorIdx: d });
      }
    }
  } else {
    const counts: Record<number, number> = {};
    for (let i = 0; i < 9; i++) {
      let t = Math.floor(Math.random() * PRIZES.length), att = 0;
      while ((counts[t] ?? 0) >= 2 && att < 20) { t = Math.floor(Math.random() * PRIZES.length); att++; }
      counts[t] = (counts[t] ?? 0) + 1;
      cells.push({ value: PRIZES[t], label: PRIZE_LBL[t], colorIdx: t });
    }
  }

  const vc: Record<number, number> = {};
  cells.forEach(c => { vc[c.value] = (vc[c.value] ?? 0) + 1; });
  const match = Object.entries(vc).find(([, n]) => n >= 3);
  return { cells, prize: match ? Number(match[0]) : 0 };
}

// ─── SVG path helper ──────────────────────────────────────────────────────────

const BRUSH_R = Platform.OS === 'web' ? 22 : 32;

function buildPath(strokes: Array<Array<{ x: number; y: number }>>): string {
  return strokes
    .filter(s => s.length > 0)
    .map(s => {
      if (s.length === 1) return `M ${s[0].x.toFixed(1)} ${s[0].y.toFixed(1)} l 0.1 0`;
      return 'M ' + s.map((p, i) => `${i > 0 ? 'L ' : ''}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    })
    .join(' ');
}

// ─── Confetti particle ────────────────────────────────────────────────────────

interface Confetti { x: number; y: number; color: string; rot: number; ty: Animated.Value; op: Animated.Value }

function spawnConfetti(cx: number, cy: number): Confetti[] {
  const cols = ['#ffd700', '#00d4ff', '#ff0090', '#bf5fff', '#00ff88', '#ff6600'];
  return Array.from({ length: 20 }, (_, i) => {
    const ty = new Animated.Value(0);
    const op = new Animated.Value(1);
    Animated.parallel([
      Animated.timing(ty, { toValue: 100 + Math.random() * 80, duration: 1400, useNativeDriver: false }),
      Animated.timing(op, { toValue: 0, duration: 1400, useNativeDriver: false }),
    ]).start();
    return {
      x: cx + (Math.random() - 0.5) * 160,
      y: cy,
      color: cols[i % cols.length],
      rot: Math.random() * 360,
      ty, op,
    };
  });
}

// ─── Scratch spark (tiny animated circle at brush tip) ────────────────────────

function ScratchSpark({ x, y, color }: { x: number; y: number; color: string }) {
  const scale = useRef(new Animated.Value(0.5)).current;
  const op    = useRef(new Animated.Value(0.9)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, { toValue: 1.6, duration: 220, useNativeDriver: false }),
      Animated.timing(op,    { toValue: 0,   duration: 220, useNativeDriver: false }),
    ]).start();
  }, []);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: x - 8, top: y - 8, width: 16, height: 16,
        borderRadius: 8, backgroundColor: color,
        opacity: op, transform: [{ scale }],
      }}
    />
  );
}

// ─── Coverage tracker ─────────────────────────────────────────────────────────

const GRID = 22;

function computeCoverage(
  covered: Set<string>,
  x: number, y: number,
  tw: number, th: number,
): number {
  const cellW = tw / GRID, cellH = th / GRID;
  const br = Math.ceil(BRUSH_R / Math.min(cellW, cellH));
  const cx = Math.floor(x / cellW);
  const cy = Math.floor(y / cellH);
  for (let dx = -br; dx <= br; dx++) {
    for (let dy = -br; dy <= br; dy++) {
      const nx = cx + dx, ny = cy + dy;
      if (nx >= 0 && nx < GRID && ny >= 0 && ny < GRID)
        covered.add(`${nx},${ny}`);
    }
  }
  return covered.size / (GRID * GRID);
}

// ─── Main component ───────────────────────────────────────────────────────────

const { width: SCREEN_W } = Dimensions.get('window');
const TICKET_W = Math.min(SCREEN_W - 32, 360);
const TICKET_H = Math.round(TICKET_W * 0.66);

export default function ScratchScreen() {
  const insets   = useSafeAreaInsets();
  const { profile, useScratchTicket, addChips } = useUser();

  const [theme]       = useState<TicketTheme>(() => THEMES[Math.floor(Math.random() * THEMES.length)]);
  const [ticket]      = useState(buildTicket);
  const [svgW, setSvgW] = useState(TICKET_W);
  const [svgH, setSvgH] = useState(TICKET_H);

  // Refs used inside PanResponder callbacks to avoid stale closures
  const svgWRef       = useRef(TICKET_W);
  const svgHRef       = useRef(TICKET_H);
  const doneRef       = useRef(false);
  const hasTicketsRef = useRef(true);
  // Page-coordinate offset of the scratch grid (re-measured on each touch start)
  const gridRef       = useRef<View>(null);
  const gridOffsetRef = useRef({ x: 0, y: 0 });

  // Scratch state
  const strokesRef    = useRef<Array<Array<{ x: number; y: number }>>>([]);
  const currentRef    = useRef<Array<{ x: number; y: number }>>([]);
  const coveredRef    = useRef(new Set<string>());
  const [pathData,    setPathData]    = useState('');
  const [coverage,    setCoverage]    = useState(0);
  const [scratchTip,  setScratchTip]  = useState<{ x: number; y: number } | null>(null);
  const [sparks,      setSparks]      = useState<Array<{ id: number; x: number; y: number }>>([]);
  const sparkId       = useRef(0);
  const lastSoundRef  = useRef(0);
  const lastHapticRef = useRef(0);

  // Result state
  const [done,    setDone]    = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [confetti,setConfetti]= useState<Confetti[]>([]);
  const resultScale  = useRef(new Animated.Value(0)).current;
  const winPulse     = useRef(new Animated.Value(1)).current;
  const chipCount    = useRef(new Animated.Value(0)).current;
  const [displayChips, setDisplayChips] = useState(0);

  const won      = ticket.prize > 0;
  const canRevealAll = coverage >= 0.30;
  const hasTickets   = profile.scratchTickets > 0;

  // Keep refs in sync with state
  useEffect(() => { doneRef.current = done; }, [done]);
  useEffect(() => { hasTicketsRef.current = hasTickets; }, [hasTickets]);
  useEffect(() => { svgWRef.current = svgW; svgHRef.current = svgH; }, [svgW, svgH]);

  // Prevents parent ScrollView from stealing the scratch gesture
  const [scrollEnabled, setScrollEnabled] = useState(true);

  // Win label
  const vc: Record<string, number> = {};
  ticket.cells.forEach(c => { vc[c.label] = (vc[c.label] ?? 0) + 1; });
  const winLabel = won ? (Object.entries(vc).find(([, n]) => n >= 3)?.[0] ?? null) : null;

  // On done
  useEffect(() => {
    if (!done) return;
    Animated.spring(resultScale, { toValue: 1, tension: 55, friction: 7, useNativeDriver: false }).start();
    if (won) {
      setConfetti(spawnConfetti(SCREEN_W / 2, 200));
      Animated.loop(
        Animated.sequence([
          Animated.timing(winPulse, { toValue: 1.06, duration: 500, useNativeDriver: false }),
          Animated.timing(winPulse, { toValue: 1.0,  duration: 500, useNativeDriver: false }),
        ]),
        { iterations: 6 }
      ).start();
      Animated.timing(chipCount, { toValue: ticket.prize, duration: 1200, useNativeDriver: false }).start();
      chipCount.addListener(({ value }) => setDisplayChips(Math.round(value)));
    }
  }, [done]);

  // Measure the grid's page position so we can convert pageX/pageY → local coords
  const measureGrid = useCallback(() => {
    gridRef.current?.measure((_fx, _fy, _w, _h, px, py) => {
      gridOffsetRef.current = { x: px ?? 0, y: py ?? 0 };
    });
  }, []);

  // PanResponder — reads only refs so no stale-closure issues
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder:        () => !doneRef.current && hasTicketsRef.current,
      onMoveShouldSetPanResponder:         () => !doneRef.current && hasTicketsRef.current,
      onStartShouldSetPanResponderCapture: () => !doneRef.current && hasTicketsRef.current,
      onMoveShouldSetPanResponderCapture:  () => !doneRef.current && hasTicketsRef.current,

      onPanResponderGrant: (evt) => {
        setScrollEnabled(false);
        // Re-measure page position on every touch start (scroll offset may have changed)
        gridRef.current?.measure((_fx, _fy, _w, _h, px, py) => {
          gridOffsetRef.current = { x: px ?? 0, y: py ?? 0 };
        });
        const { pageX, pageY } = evt.nativeEvent;
        const x = Math.max(0, Math.min(pageX - gridOffsetRef.current.x, svgWRef.current));
        const y = Math.max(0, Math.min(pageY - gridOffsetRef.current.y, svgHRef.current));
        currentRef.current = [{ x, y }];
        setScratchTip({ x, y });
        void Haptics.selectionAsync();
      },

      onPanResponderMove: (evt) => {
        if (doneRef.current) return;
        const { pageX, pageY } = evt.nativeEvent;
        const x = Math.max(0, Math.min(pageX - gridOffsetRef.current.x, svgWRef.current));
        const y = Math.max(0, Math.min(pageY - gridOffsetRef.current.y, svgHRef.current));
        currentRef.current.push({ x, y });

        // Throttled sound
        const now = Date.now();
        if (now - lastSoundRef.current > 85) {
          SoundEngine.chip();
          lastSoundRef.current = now;
        }
        if (now - lastHapticRef.current > 55) {
          void Haptics.selectionAsync();
          lastHapticRef.current = now;
        }

        // Sparks
        if (Math.random() < 0.3) {
          const id = ++sparkId.current;
          setSparks(prev => [...prev.slice(-5), { id, x, y }]);
          setTimeout(() => setSparks(prev => prev.filter(s => s.id !== id)), 300);
        }

        setScratchTip({ x, y });

        // Coverage — uses refs so always reads current layout dimensions
        const cov = computeCoverage(coveredRef.current, x, y, svgWRef.current, svgHRef.current);
        setCoverage(cov);

        // Path update
        const data = buildPath([...strokesRef.current, currentRef.current]);
        setPathData(data);

        // Auto-done at 82%
        if (cov >= 0.82) {
          finishScratch();
        }
      },

      onPanResponderRelease: () => {
        setScrollEnabled(true);
        if (currentRef.current.length > 0) {
          strokesRef.current = [...strokesRef.current, currentRef.current];
          currentRef.current = [];
          setPathData(buildPath(strokesRef.current));
        }
        setScratchTip(null);
      },

      onPanResponderTerminate: () => {
        setScrollEnabled(true);
        if (currentRef.current.length > 0) {
          strokesRef.current = [...strokesRef.current, currentRef.current];
          currentRef.current = [];
          setPathData(buildPath(strokesRef.current));
        }
        setScratchTip(null);
      },
    })
  ).current;

  const finishScratch = useCallback(() => {
    if (done) return;
    // Fill remaining path
    const fullPath = `M 0 0 L ${svgW} 0 L ${svgW} ${svgH} L 0 ${svgH} Z`;
    setPathData(fullPath);
    setCoverage(1);
    setDone(true);
  }, [done, svgW, svgH]);

  const revealAll = useCallback(() => {
    finishScratch();
  }, [finishScratch]);

  const handleClaim = useCallback(async () => {
    if (claimed) return;
    setClaimed(true);
    if (won) await addChips(ticket.prize);
    SoundEngine.claim();
    await useScratchTicket();
  }, [claimed, won, ticket.prize, addChips, useScratchTicket]);

  return (
    <View style={st.root}>
      <LinearGradient colors={['#0a0020', '#050010', '#080018']} style={StyleSheet.absoluteFill} />
      <View style={st.glowLeft} />
      <View style={st.glowRight} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[st.scroll, { paddingTop: insets.top + (Platform.OS === 'web' ? 20 : 16) }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
      >
        {/* Header */}
        <View style={st.header}>
          <TouchableOpacity onPress={() => router.back()} style={st.closeBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={20} color={colors.textMuted} />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={st.title}>SCRATCH & WIN</Text>
            <Text style={st.subtitle}>MATCH 3 SYMBOLS TO WIN</Text>
          </View>
          <View style={[st.ticketBadge]}>
            <Text style={st.ticketIcon}>🎴</Text>
            <Text style={[st.ticketCount, { color: theme.accent }]}>×{profile.scratchTickets}</Text>
          </View>
        </View>

        {/* Ticket */}
        <View style={[st.ticketWrap, { borderColor: RARITY_BORDER_COLORS[theme.rarity] + '55' }]}>
          <LinearGradient
            colors={['rgba(255,255,255,0.04)', 'transparent']}
            style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
          />

          {/* Rarity + theme badge */}
          <View style={st.rarityRow}>
            <View style={[st.rarityBadge, { borderColor: theme.rarityColor + '55', backgroundColor: theme.rarityColor + '18' }]}>
              <Text style={[st.rarityText, { color: theme.rarityColor }]}>{theme.rarity}</Text>
            </View>
            <Text style={[st.themeName, { color: theme.accent }]}>{theme.icon}  {theme.name.toUpperCase()}</Text>
          </View>

          {/* Jackpot strip */}
          <View style={[st.jackpotStrip, { borderColor: theme.accent + '30' }]}>
            <LinearGradient
              colors={[theme.accent + '12', 'transparent', theme.accent + '12']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            />
            <Text style={st.jackpotLabel}>WIN UP TO</Text>
            <Text style={[st.jackpotAmt, { color: theme.accent }]}>50,000</Text>
            <Text style={st.jackpotLabel}>CHIPS</Text>
          </View>

          {/* Prize grid — visible underneath the foil */}
          <View
            ref={gridRef}
            style={[st.prizeGrid, { width: TICKET_W, height: TICKET_H }]}
            onLayout={e => {
              const { width, height } = e.nativeEvent.layout;
              setSvgW(width); setSvgH(height);
              // Measure page position after layout settles
              setTimeout(measureGrid, 80);
            }}
            {...panResponder.panHandlers}
          >
            {/* Prize cells */}
            {ticket.cells.map((cell, i) => {
              const col = PRIZE_COLS[cell.colorIdx];
              const isMatch = winLabel !== null && cell.label === winLabel;
              const col_ = i; void col_;
              return (
                <View key={i} style={[st.prizeCell, isMatch && { backgroundColor: col + '14', borderColor: col + '50' }]}>
                  <Text style={[st.prizeEmoji]}>{isMatch ? '✨' : '💠'}</Text>
                  <Text style={[st.prizeVal, { color: col }]}>{cell.label}</Text>
                  <Text style={st.prizeUnit}>chips</Text>
                </View>
              );
            })}

            {/* SVG foil overlay — scratched away by mask */}
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <Svg width={svgW} height={svgH} style={{ backgroundColor: 'transparent' }}>
                <Defs>
                  <Mask id="foilMask">
                    {/* White = show foil, Black = erase foil */}
                    <Rect x="0" y="0" width={svgW} height={svgH} fill="white" />
                    {pathData ? (
                      <Path
                        d={pathData}
                        stroke="black"
                        strokeWidth={BRUSH_R * 2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    ) : null}
                  </Mask>
                </Defs>

                {/* Foil layer */}
                <G mask="url(#foilMask)">
                  {/* Base foil */}
                  <Rect x="0" y="0" width={svgW} height={svgH} fill={theme.foilA} />

                  {/* Metallic gradient streaks */}
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Rect
                      key={i}
                      x={0}
                      y={(svgH / 8) * i}
                      width={svgW}
                      height={svgH / 8}
                      fill={i % 2 === 0 ? theme.foilB : theme.foilC}
                      opacity={0.8}
                    />
                  ))}

                  {/* Holographic diagonal shimmer */}
                  {Array.from({ length: 12 }).map((_, i) => (
                    <Path
                      key={i}
                      d={`M ${-svgH + i * (svgW / 5)} 0 L ${i * (svgW / 5)} ${svgH}`}
                      stroke={theme.accent}
                      strokeWidth={1.5}
                      strokeOpacity={0.12 + (i % 3) * 0.04}
                      fill="none"
                    />
                  ))}

                  {/* Foil text watermark */}
                  {Array.from({ length: 3 }).map((_, row) =>
                    Array.from({ length: 4 }).map((_, col) => (
                      <SvgCircle
                        key={`${row}-${col}`}
                        cx={(svgW / 4) * col + svgW / 8}
                        cy={(svgH / 3) * row + svgH / 6}
                        r={3}
                        fill={theme.accent}
                        fillOpacity={0.2}
                      />
                    ))
                  )}

                  {/* Foil edge vignette */}
                  <Rect x="0" y="0" width={svgW} height={svgH}
                    fill="none" stroke={theme.accent} strokeWidth={2} strokeOpacity={0.3} />
                </G>

                {/* Brush glow at current scratch tip */}
                {scratchTip && !done && (
                  <SvgCircle
                    cx={scratchTip.x} cy={scratchTip.y}
                    r={BRUSH_R + 6}
                    fill={theme.accent} fillOpacity={0.15}
                    stroke={theme.accent} strokeWidth={1.5} strokeOpacity={0.4}
                  />
                )}
              </Svg>
            </View>

            {/* Scratch sparks */}
            {sparks.map(s => (
              <ScratchSpark key={s.id} x={s.x} y={s.y} color={theme.accent} />
            ))}
          </View>

          {/* Progress + reveal all */}
          <View style={st.progressWrap}>
            <View style={st.progressTrack}>
              <Animated.View style={[st.progressFill, {
                width: `${Math.min(coverage * 100, 100)}%`,
                backgroundColor: theme.accent,
              }]} />
            </View>
            <Text style={[st.progressPct, { color: theme.accent }]}>
              {Math.round(Math.min(coverage * 100, 100))}%
            </Text>
          </View>

          {!done && (
            <View style={st.actionRow}>
              {canRevealAll ? (
                <TouchableOpacity
                  style={[st.revealBtn, { borderColor: theme.accent, backgroundColor: theme.accent + '18' }]}
                  onPress={revealAll}
                  activeOpacity={0.8}
                >
                  <Ionicons name="eye" size={13} color={theme.accent} />
                  <Text style={[st.revealBtnText, { color: theme.accent }]}>REVEAL ALL</Text>
                </TouchableOpacity>
              ) : (
                <Text style={[st.hintText, { color: theme.accent + '99' }]}>
                  ← Scratch to reveal your prizes →
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Confetti */}
        {confetti.map((p, i) => (
          <Animated.View
            key={i}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: p.x, top: p.y,
              width: 8, height: 8, borderRadius: 2,
              backgroundColor: p.color,
              opacity: p.op,
              transform: [{ translateY: p.ty }, { rotate: `${p.rot}deg` }],
            }}
          />
        ))}

        {/* Result card */}
        {done && (
          <Animated.View style={[
            st.resultCard,
            { borderColor: won ? '#ffd70080' : 'rgba(255,255,255,0.1)', transform: [{ scale: resultScale }] }
          ]}>
            <LinearGradient
              colors={won ? ['rgba(255,215,0,0.18)', 'rgba(255,215,0,0.04)'] : ['rgba(255,255,255,0.04)', 'transparent']}
              style={[StyleSheet.absoluteFill, { borderRadius: 18 }]}
            />

            {won ? (
              <>
                <Text style={st.resultEmoji}>🎉</Text>
                <Text style={st.winTitle}>YOU WON!</Text>
                <Animated.Text style={[st.winAmt, { transform: [{ scale: winPulse }] }]}>
                  +{formatChips(displayChips)} CHIPS
                </Animated.Text>
                <Text style={st.winSub}>{theme.icon}  {theme.name}</Text>
              </>
            ) : (
              <>
                <Text style={st.resultEmoji}>😤</Text>
                <Text style={st.loseTitle}>NO MATCH</Text>
                <Text style={st.loseSub}>Better luck next time!</Text>
              </>
            )}

            {!claimed ? (
              <TouchableOpacity
                style={[
                  st.claimBtn,
                  { backgroundColor: won ? '#ffd700' : 'rgba(255,255,255,0.09)', borderColor: won ? '#ffd700' : 'rgba(255,255,255,0.15)' }
                ]}
                onPress={handleClaim}
                activeOpacity={0.85}
              >
                <Text style={[st.claimText, { color: won ? '#050010' : colors.textMuted }]}>
                  {won ? '  COLLECT WINNINGS' : 'CLOSE'}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={st.claimedRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text style={st.claimedText}>
                  {won ? `+${formatChips(ticket.prize)} added to balance` : 'Ticket used'}
                </Text>
              </View>
            )}
          </Animated.View>
        )}

        {!hasTickets && !done && (
          <View style={st.noTicketCard}>
            <Text style={st.noTicketEmoji}>🎴</Text>
            <Text style={st.noTicketTitle}>NO TICKETS</Text>
            <Text style={st.noTicketSub}>Earn scratch tickets from the Daily Spin wheel</Text>
            <TouchableOpacity style={st.wheelBtn} onPress={() => router.push('/rewards/wheel')} activeOpacity={0.85}>
              <LinearGradient colors={['#7700ff', '#bf5fff']} style={StyleSheet.absoluteFill} />
              <Ionicons name="refresh" size={14} color="#fff" />
              <Text style={st.wheelBtnText}>GO TO DAILY SPIN</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: insets.bottom + 24 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050010' },
  glowLeft:  { position: 'absolute', top: -40, left: -60, width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(0,212,255,0.05)' },
  glowRight: { position: 'absolute', bottom: 60, right: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,0,144,0.05)' },
  scroll: { alignItems: 'center', paddingHorizontal: 16, gap: 16 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingBottom: 4 },
  closeBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: colors.border },
  title: { color: '#fff', fontSize: 16, fontWeight: '900', fontFamily: 'Orbitron_900Black', letterSpacing: 2 },
  subtitle: { color: colors.textDim, fontSize: 8, letterSpacing: 2, fontWeight: '700', marginTop: 2 },
  ticketBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(191,95,255,0.12)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(191,95,255,0.3)', paddingHorizontal: 10, paddingVertical: 5 },
  ticketIcon: { fontSize: 12 },
  ticketCount: { fontSize: 13, fontWeight: '800', fontFamily: 'Orbitron_700Bold' },

  ticketWrap: {
    width: '100%', borderRadius: 20, borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.02)',
    overflow: 'hidden', padding: 14, gap: 10,
  },
  rarityRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rarityBadge: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  rarityText: { fontSize: 8, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 2 },
  themeName: { fontSize: 10, fontWeight: '700', fontFamily: 'Orbitron_400Regular', letterSpacing: 1 },

  jackpotStrip: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 10, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 8, overflow: 'hidden' },
  jackpotLabel: { color: colors.textDim, fontSize: 9, letterSpacing: 1 },
  jackpotAmt: { fontSize: 20, fontWeight: '900', fontFamily: 'Orbitron_700Bold' },

  prizeGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  prizeCell: {
    width: '33.33%', height: '33.33%',
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center', gap: 2,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  prizeEmoji: { fontSize: 14 },
  prizeVal: { fontSize: 17, fontWeight: '900', fontFamily: 'Orbitron_700Bold' },
  prizeUnit: { color: colors.textDim, fontSize: 7, letterSpacing: 0.5 },

  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressTrack: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  progressPct: { fontSize: 10, fontWeight: '700', fontFamily: 'Orbitron_700Bold', minWidth: 32, textAlign: 'right' },

  actionRow: { alignItems: 'center', minHeight: 32, justifyContent: 'center' },
  revealBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 8 },
  revealBtnText: { fontSize: 10, fontWeight: '800', fontFamily: 'Orbitron_700Bold', letterSpacing: 1 },
  hintText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },

  resultCard: {
    width: '100%', borderRadius: 18, borderWidth: 1.5,
    padding: 24, alignItems: 'center', gap: 10, overflow: 'hidden',
  },
  resultEmoji: { fontSize: 44 },
  winTitle: { color: '#ffd700', fontSize: 22, fontWeight: '900', fontFamily: 'Orbitron_900Black', letterSpacing: 2 },
  winAmt: { color: '#ffd700', fontSize: 26, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 1 },
  winSub: { color: colors.textDim, fontSize: 10, letterSpacing: 1, marginTop: 2 },
  loseTitle: { color: colors.textMuted, fontSize: 18, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 1 },
  loseSub: { color: colors.textDim, fontSize: 12 },
  claimBtn: { borderRadius: 14, paddingHorizontal: 28, paddingVertical: 13, marginTop: 6, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 6, overflow: 'hidden' },
  claimText: { fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  claimedRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  claimedText: { color: colors.success, fontSize: 12 },

  noTicketCard: { width: '100%', borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(255,255,255,0.02)', padding: 28, alignItems: 'center', gap: 10 },
  noTicketEmoji: { fontSize: 40 },
  noTicketTitle: { color: colors.textMuted, fontSize: 16, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 2 },
  noTicketSub: { color: colors.textDim, fontSize: 12, textAlign: 'center' },
  wheelBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, overflow: 'hidden', paddingHorizontal: 20, paddingVertical: 12, marginTop: 8 },
  wheelBtnText: { color: '#fff', fontSize: 12, fontWeight: '800', fontFamily: 'Orbitron_700Bold', letterSpacing: 1 },
});
