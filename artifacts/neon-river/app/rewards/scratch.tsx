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
import ChipIcon from '@/components/ChipIcon';

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
  const cells: ScratchCell[] = [];
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
  const vc: Record<number, number> = {};
  cells.forEach(c => { vc[c.value] = (vc[c.value] ?? 0) + 1; });
  const match = Object.entries(vc).find(([, n]) => n >= 3);
  return { cells, prize: match ? Number(match[0]) : 0 };
}

// ─── SVG path helper ──────────────────────────────────────────────────────────

const BRUSH_R = Platform.OS === 'web' ? 26 : 40;

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
  return Array.from({ length: 30 }, (_, i) => {
    const ty = new Animated.Value(0);
    const op = new Animated.Value(1);
    Animated.parallel([
      Animated.timing(ty, { toValue: 120 + Math.random() * 100, duration: 1600, useNativeDriver: false }),
      Animated.timing(op, { toValue: 0, duration: 1600, useNativeDriver: false }),
    ]).start();
    return {
      x: cx + (Math.random() - 0.5) * 200,
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
  const op    = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, { toValue: 2.0, duration: 260, useNativeDriver: false }),
      Animated.timing(op,    { toValue: 0,   duration: 260, useNativeDriver: false }),
    ]).start();
  }, []);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: x - 10, top: y - 10, width: 20, height: 20,
        borderRadius: 10, backgroundColor: color,
        opacity: op, transform: [{ scale }],
      }}
    />
  );
}

// ─── Per-cell coverage tracking ───────────────────────────────────────────────

const CELL_SUBGRID          = 10;
const CELL_REVEAL_THRESHOLD = 0.32;

function markPerCellCoverage(
  cellCovered: Set<string>[],
  x: number, y: number,
  svgW: number, svgH: number,
  brushR: number,
): number[] {
  const cellW = svgW / 3;
  const cellH = svgH / 3;
  const revealed: number[] = [];
  for (let ci = 0; ci < 3; ci++) {
    for (let cj = 0; cj < 3; cj++) {
      const idx   = cj * 3 + ci;
      const x0    = ci * cellW;
      const y0    = cj * cellH;
      const clx   = Math.max(x0, Math.min(x, x0 + cellW));
      const cly   = Math.max(y0, Math.min(y, y0 + cellH));
      const dist  = Math.sqrt((x - clx) ** 2 + (y - cly) ** 2);
      if (dist <= brushR + 6) {
        const lx  = x - x0;
        const ly  = y - y0;
        const sW  = cellW / CELL_SUBGRID;
        const sH  = cellH / CELL_SUBGRID;
        const br  = Math.ceil(brushR / Math.min(sW, sH));
        const cx  = Math.floor(lx / sW);
        const cy  = Math.floor(ly / sH);
        for (let dx = -br; dx <= br; dx++) {
          for (let dy = -br; dy <= br; dy++) {
            const nx = cx + dx, ny = cy + dy;
            if (nx >= 0 && nx < CELL_SUBGRID && ny >= 0 && ny < CELL_SUBGRID)
              cellCovered[idx].add(`${nx},${ny}`);
          }
        }
        const cov = cellCovered[idx].size / (CELL_SUBGRID * CELL_SUBGRID);
        if (cov >= CELL_REVEAL_THRESHOLD) revealed.push(idx);
      }
    }
  }
  return revealed;
}

// ─── Global coverage tracker ──────────────────────────────────────────────────

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
const TICKET_H = Math.round(TICKET_W * 0.9);

export default function ScratchScreen() {
  const insets   = useSafeAreaInsets();
  const { profile, useScratchTicket, consumeScratchTickets, addChips } = useUser();

  const [theme]       = useState<TicketTheme>(() => THEMES[Math.floor(Math.random() * THEMES.length)]);
  const [ticket]      = useState(buildTicket);
  const [svgW, setSvgW] = useState(TICKET_W);
  const [svgH, setSvgH] = useState(TICKET_H);

  const svgWRef       = useRef(TICKET_W);
  const svgHRef       = useRef(TICKET_H);
  const doneRef       = useRef(false);
  const hasTicketsRef = useRef(true);
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
  const sparkId          = useRef(0);
  const lastSoundRef     = useRef(0);
  const lastHapticRef    = useRef(0);
  const coveredStateRef  = useRef(0);

  // Per-cell reveal state
  const cellCoveredRef  = useRef<Set<string>[]>(Array.from({ length: 9 }, () => new Set()));
  const [revealedCells, setRevealedCells] = useState<boolean[]>(Array(9).fill(false));
  const revealedCellsRef = useRef<boolean[]>(Array(9).fill(false));
  const cellGlowAnims   = useRef(Array.from({ length: 9 }, () => new Animated.Value(0))).current;
  const [matchRevealCount, setMatchRevealCount] = useState(0);
  const matchRevealRef  = useRef(0);

  // Suspense / tension
  const flashAnim       = useRef(new Animated.Value(0)).current;
  const tensionPulse    = useRef(new Animated.Value(1)).current;
  const tensionLoopRef  = useRef<Animated.CompositeAnimation | null>(null);
  const tensionActiveRef = useRef(false);
  const suspensePendingRef = useRef(false);

  // Result state
  const [done,    setDone]    = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [confetti,setConfetti]= useState<Confetti[]>([]);
  const resultScale  = useRef(new Animated.Value(0)).current;
  const winPulse     = useRef(new Animated.Value(1)).current;
  const chipCount    = useRef(new Animated.Value(0)).current;
  const [displayChips, setDisplayChips] = useState(0);

  // ── Bulk scratch state ────────────────────────────────────────────────────
  type BulkPhase = 'idle' | 'animating' | 'summary';
  interface BulkResult {
    scratched: number; winners: number;
    totalChips: number; bestWin: number; isLegendary: boolean;
  }
  const [bulkPhase,  setBulkPhase]  = useState<BulkPhase>('idle');
  const [bulkResult, setBulkResult] = useState<BulkResult | null>(null);
  const [bulkFlash,  setBulkFlash]  = useState(0);          // ticking display number
  const bulkCardScale = useRef(new Animated.Value(0)).current;
  const bulkChipAnim  = useRef(new Animated.Value(0)).current;
  const [bulkChipDisplay, setBulkChipDisplay] = useState(0);
  const bulkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleScratchBulk = useCallback(async (n: number) => {
    const available = profile.scratchTickets;
    const count = Math.min(n, available);
    if (count <= 0) return;

    setBulkPhase('animating');
    setBulkFlash(0);
    bulkChipAnim.setValue(0);
    setBulkChipDisplay(0);

    // Simulate all tickets instantly
    let totalChips = 0, winners = 0, bestWin = 0;
    for (let i = 0; i < count; i++) {
      const t = buildTicket();
      if (t.prize > 0) { winners++; totalChips += t.prize; bestWin = Math.max(bestWin, t.prize); }
    }
    const isLegendary = bestWin >= PRIZES[PRIZES.length - 1];

    // Rapid flicker animation during animating phase
    let elapsed = 0;
    bulkIntervalRef.current = setInterval(() => {
      elapsed += 80;
      // Gradually approach real value — random within narrowing range
      const progress = Math.min(elapsed / 1600, 1);
      const noise = (1 - progress) * totalChips * 0.8;
      setBulkFlash(Math.round(totalChips * progress + (Math.random() - 0.5) * noise));
      if (elapsed >= 1600) {
        if (bulkIntervalRef.current) clearInterval(bulkIntervalRef.current);
      }
    }, 80);

    // After animation: award chips, consume tickets, show summary
    setTimeout(async () => {
      if (bulkIntervalRef.current) clearInterval(bulkIntervalRef.current);
      if (totalChips > 0) await addChips(totalChips);
      await consumeScratchTickets(count);
      SoundEngine.claim();
      const result: BulkResult = { scratched: count, winners, totalChips, bestWin, isLegendary };
      setBulkResult(result);
      bulkCardScale.setValue(0);
      setBulkPhase('summary');
      Animated.spring(bulkCardScale, { toValue: 1, tension: 55, friction: 7, useNativeDriver: false }).start();
      // Count up chip display
      bulkChipAnim.setValue(0);
      Animated.timing(bulkChipAnim, { toValue: totalChips, duration: 1200, useNativeDriver: false }).start();
      bulkChipAnim.addListener(({ value }) => setBulkChipDisplay(Math.round(value)));
      if (isLegendary) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1800);
  }, [profile.scratchTickets, addChips, consumeScratchTickets]);

  const won      = ticket.prize > 0;
  const canRevealAll = coverage >= 0.50;
  const hasTickets   = profile.scratchTickets > 0;

  const vc: Record<string, number> = {};
  ticket.cells.forEach(c => { vc[c.label] = (vc[c.label] ?? 0) + 1; });
  const winLabel = won ? (Object.entries(vc).find(([, n]) => n >= 3)?.[0] ?? null) : null;

  useEffect(() => { doneRef.current = done; }, [done]);
  useEffect(() => { hasTicketsRef.current = hasTickets; }, [hasTickets]);
  useEffect(() => { svgWRef.current = svgW; svgHRef.current = svgH; }, [svgW, svgH]);

  const [scrollEnabled, setScrollEnabled] = useState(true);

  // On done
  useEffect(() => {
    if (!done) return;
    tensionLoopRef.current?.stop();
    Animated.spring(resultScale, { toValue: 1, tension: 55, friction: 7, useNativeDriver: false }).start();
    if (won) {
      setConfetti(spawnConfetti(SCREEN_W / 2, 200));
      Animated.loop(
        Animated.sequence([
          Animated.timing(winPulse, { toValue: 1.08, duration: 500, useNativeDriver: false }),
          Animated.timing(winPulse, { toValue: 1.0,  duration: 500, useNativeDriver: false }),
        ]),
        { iterations: 8 }
      ).start();
      Animated.timing(chipCount, { toValue: ticket.prize, duration: 1400, useNativeDriver: false }).start();
      chipCount.addListener(({ value }) => setDisplayChips(Math.round(value)));
    }
  }, [done]);

  const measureGrid = useCallback(() => {
    gridRef.current?.measure((_fx, _fy, _w, _h, px, py) => {
      gridOffsetRef.current = { x: px ?? 0, y: py ?? 0 };
    });
  }, []);

  const finishScratch = useCallback(() => {
    if (doneRef.current) return;
    setCoverage(1);
    setDone(true);
  }, []);

  // Handle newly revealed cells — called from PanResponder to avoid stale state
  const handleCellReveal = useCallback((newlyRevealedIdx: number[]) => {
    const prev = revealedCellsRef.current;
    const next = [...prev];
    let anyNew = false;
    for (const idx of newlyRevealedIdx) {
      if (!next[idx]) {
        next[idx] = true;
        anyNew = true;
        // Cell glow flash
        const anim = cellGlowAnims[idx];
        Animated.sequence([
          Animated.timing(anim, { toValue: 1,   duration: 120, useNativeDriver: false }),
          Animated.timing(anim, { toValue: 0.25, duration: 700, useNativeDriver: false }),
        ]).start();
      }
    }
    if (!anyNew) return;

    revealedCellsRef.current = next;
    setRevealedCells([...next]);

    if (!winLabel) return;
    const matchCount = next.reduce((acc, revealed, i) => {
      if (revealed && ticket.cells[i].label === winLabel) return acc + 1;
      return acc;
    }, 0);

    if (matchCount > matchRevealRef.current) {
      matchRevealRef.current = matchCount;
      setMatchRevealCount(matchCount);

      if (matchCount === 1) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      if (matchCount === 2 && !tensionActiveRef.current) {
        tensionActiveRef.current = true;
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        const loop = Animated.loop(
          Animated.sequence([
            Animated.timing(tensionPulse, { toValue: 1.1,  duration: 350, useNativeDriver: false }),
            Animated.timing(tensionPulse, { toValue: 1.0,  duration: 350, useNativeDriver: false }),
          ])
        );
        tensionLoopRef.current = loop;
        loop.start();
        // Screen flash
        Animated.sequence([
          Animated.timing(flashAnim, { toValue: 0.35, duration: 80,  useNativeDriver: false }),
          Animated.timing(flashAnim, { toValue: 0,    duration: 400, useNativeDriver: false }),
        ]).start();
      }

      if (matchCount >= 3 && !suspensePendingRef.current) {
        suspensePendingRef.current = true;
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        // Big flash then dramatic pause
        Animated.sequence([
          Animated.timing(flashAnim, { toValue: 0.8,  duration: 60,  useNativeDriver: false }),
          Animated.timing(flashAnim, { toValue: 0.15, duration: 200, useNativeDriver: false }),
          Animated.timing(flashAnim, { toValue: 0.5,  duration: 80,  useNativeDriver: false }),
          Animated.timing(flashAnim, { toValue: 0,    duration: 500, useNativeDriver: false }),
        ]).start();
        setTimeout(() => finishScratch(), 1400);
      }
    }
  }, [winLabel, ticket.cells, finishScratch]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder:        () => !doneRef.current && hasTicketsRef.current,
      onMoveShouldSetPanResponder:         () => !doneRef.current && hasTicketsRef.current,
      onStartShouldSetPanResponderCapture: () => !doneRef.current && hasTicketsRef.current,
      onMoveShouldSetPanResponderCapture:  () => !doneRef.current && hasTicketsRef.current,

      onPanResponderGrant: (evt) => {
        setScrollEnabled(false);
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

        const now = Date.now();
        if (now - lastSoundRef.current > 70) {
          SoundEngine.chip();
          lastSoundRef.current = now;
        }
        if (now - lastHapticRef.current > 45) {
          void Haptics.selectionAsync();
          lastHapticRef.current = now;
        }

        // Lightweight sparks — low frequency to stay smooth
        if (Math.random() < 0.18) {
          const id = ++sparkId.current;
          setSparks(prev => [...prev.slice(-3), { id, x, y }]);
        }

        setScratchTip({ x, y });

        const cov = computeCoverage(coveredRef.current, x, y, svgWRef.current, svgHRef.current);
        // Throttle coverage state updates to reduce re-renders
        if (cov - coveredStateRef.current >= 0.02 || cov >= 1) {
          coveredStateRef.current = cov;
          setCoverage(cov);
        }

        const data = buildPath([...strokesRef.current, currentRef.current]);
        setPathData(data);

        // Per-cell reveal
        const nowRevealed = markPerCellCoverage(
          cellCoveredRef.current, x, y, svgWRef.current, svgHRef.current, BRUSH_R
        );
        if (nowRevealed.length > 0) handleCellReveal(nowRevealed);

        if (cov >= 0.75) finishScratch();
      },

      onPanResponderRelease: () => {
        setScrollEnabled(true);
        if (currentRef.current.length > 0) {
          strokesRef.current = [...strokesRef.current, currentRef.current];
          currentRef.current = [];
          setPathData(buildPath(strokesRef.current));
        }
        setScratchTip(null);
        setSparks([]);
      },

      onPanResponderTerminate: () => {
        setScrollEnabled(true);
        if (currentRef.current.length > 0) {
          strokesRef.current = [...strokesRef.current, currentRef.current];
          currentRef.current = [];
          setPathData(buildPath(strokesRef.current));
        }
        setScratchTip(null);
        setSparks([]);
      },
    })
  ).current;

  const revealAll = useCallback(() => { finishScratch(); }, [finishScratch]);

  const handleClaim = useCallback(async () => {
    if (claimed) return;
    setClaimed(true);
    if (won) await addChips(ticket.prize);
    SoundEngine.claim();
    await useScratchTicket();
  }, [claimed, won, ticket.prize, addChips, useScratchTicket]);

  // Match banner content
  const matchBannerText = matchRevealCount >= 3
    ? '🎰  WINNER WINNER  🎰'
    : matchRevealCount >= 2
      ? '⚡  ONE MORE!  ⚡'
      : matchRevealCount === 1
        ? `MATCH  1 / 3`
        : '';
  const matchBannerColor = matchRevealCount >= 3
    ? '#ffd700'
    : matchRevealCount >= 2
      ? '#ff0090'
      : theme.accent;

  return (
    <View style={st.root}>
      <LinearGradient colors={['#0a0020', '#050010', '#080018']} style={StyleSheet.absoluteFill} />
      <View style={st.glowLeft} />
      <View style={st.glowRight} />

      {/* Full-screen flash overlay */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: theme.accent, opacity: flashAnim, zIndex: 99 }]}
      />

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
            <Text style={st.title}>SCRATCH &amp; WIN</Text>
            <Text style={st.subtitle}>MATCH 3 SYMBOLS TO WIN</Text>
          </View>
          <View style={[st.ticketBadge]}>
            <Text style={st.ticketIcon}>🎴</Text>
            <Text style={[st.ticketCount, { color: theme.accent }]}>×{profile.scratchTickets}</Text>
          </View>
        </View>

        {/* ── Bulk scratch buttons (only when idle and has tickets) ─────────── */}
        {bulkPhase === 'idle' && hasTickets && (
          <View style={st.bulkRow}>
            <View style={st.bulkInventory}>
              <Text style={st.bulkInventoryIcon}>🎴</Text>
              <Text style={st.bulkInventoryNum}>{profile.scratchTickets}</Text>
              <Text style={st.bulkInventoryLbl}>AVAILABLE</Text>
            </View>
            <View style={st.bulkBtns}>
              {profile.scratchTickets >= 10 && (
                <TouchableOpacity
                  style={[st.bulkBtn, { borderColor: '#00d4ff66', backgroundColor: '#00d4ff10' }]}
                  onPress={() => handleScratchBulk(10)}
                  activeOpacity={0.8}
                >
                  <Text style={[st.bulkBtnText, { color: '#00d4ff' }]}>SCRATCH 10</Text>
                  <Text style={[st.bulkBtnSub, { color: '#00d4ff88' }]}>Quick open ×10</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[st.bulkBtn, { borderColor: '#ff009066', backgroundColor: '#ff009010', flex: 1 }]}
                onPress={() => handleScratchBulk(profile.scratchTickets)}
                activeOpacity={0.8}
              >
                <Text style={[st.bulkBtnText, { color: '#ff0090' }]}>SCRATCH ALL</Text>
                <Text style={[st.bulkBtnSub, { color: '#ff009088' }]}>Open all ×{profile.scratchTickets}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Bulk animating overlay ──────────────────────────────────────────── */}
        {bulkPhase === 'animating' && (
          <View style={[st.ticketWrap, { height: TICKET_H + 80, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }]}>
            <LinearGradient
              colors={['#0a0030', '#050018', '#0a0030']}
              style={StyleSheet.absoluteFill}
            />
            {/* Rapid flicker lines */}
            {Array.from({ length: 6 }).map((_, i) => (
              <View key={i} style={[st.bulkFlickerLine, { top: 20 + i * 38, opacity: 0.07 + (i % 2) * 0.04 }]} />
            ))}
            <Text style={st.bulkAnimTitle}>SCRATCHING TICKETS</Text>
            <Text style={st.bulkAnimNum}>{formatChips(bulkFlash)}</Text>
            <Text style={st.bulkAnimSub}>chips calculating…</Text>
            <View style={st.bulkAnimDots}>
              {[0,1,2,3,4].map(i => (
                <View key={i} style={[st.bulkAnimDot, { backgroundColor: i % 2 === 0 ? '#00d4ff' : '#ff0090' }]} />
              ))}
            </View>
          </View>
        )}

        {/* Match progress banner */}
        {matchRevealCount > 0 && !done && (
          <Animated.View style={[
            st.matchBanner,
            { borderColor: matchBannerColor + '60', backgroundColor: matchBannerColor + '14' },
            matchRevealCount >= 2 && { transform: [{ scale: tensionPulse }] },
          ]}>
            <Text style={[st.matchBannerText, { color: matchBannerColor }]}>
              {matchBannerText}
            </Text>
            <View style={st.matchPips}>
              {[0, 1, 2].map(i => (
                <View
                  key={i}
                  style={[
                    st.matchPip,
                    i < matchRevealCount && { backgroundColor: matchBannerColor, borderColor: matchBannerColor },
                  ]}
                />
              ))}
            </View>
          </Animated.View>
        )}

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

          {/* Prize grid */}
          <View
            ref={gridRef}
            style={[st.prizeGrid, { width: TICKET_W, height: TICKET_H }]}
            onLayout={e => {
              const { width, height } = e.nativeEvent.layout;
              setSvgW(width); setSvgH(height);
              setTimeout(measureGrid, 80);
            }}
            {...panResponder.panHandlers}
          >
            {/* Prize cells */}
            {ticket.cells.map((cell, i) => {
              const col     = PRIZE_COLS[cell.colorIdx];
              const isMatch = winLabel !== null && cell.label === winLabel;
              const isRevealed = revealedCells[i];
              return (
                <View key={i} style={[
                  st.prizeCell,
                  isMatch && isRevealed && { backgroundColor: col + '14', borderColor: col + '50' },
                ]}>
                  {/* Per-cell glow flash on reveal */}
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      StyleSheet.absoluteFill,
                      { backgroundColor: col, opacity: cellGlowAnims[i] },
                    ]}
                  />
                  <Text style={[st.prizeEmoji]}>
                    {isMatch && isRevealed ? '✨' : '💠'}
                  </Text>
                  <Text style={[st.prizeVal, { color: col }]}>{cell.label}</Text>
                  <Text style={st.prizeUnit}>chips</Text>
                </View>
              );
            })}

            {/* SVG foil overlay — hidden entirely once ticket is done */}
            {!done && <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <Svg width={svgW} height={svgH} style={{ backgroundColor: 'transparent' }}>
                <Defs>
                  <Mask id="foilMask">
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
                  <Rect x="0" y="0" width={svgW} height={svgH} fill={theme.foilA} />
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Rect
                      key={i}
                      x={0} y={(svgH / 8) * i}
                      width={svgW} height={svgH / 8}
                      fill={i % 2 === 0 ? theme.foilB : theme.foilC}
                      opacity={0.8}
                    />
                  ))}
                  {Array.from({ length: 14 }).map((_, i) => (
                    <Path
                      key={i}
                      d={`M ${-svgH + i * (svgW / 5.5)} 0 L ${i * (svgW / 5.5)} ${svgH}`}
                      stroke={theme.accent}
                      strokeWidth={1.5}
                      strokeOpacity={0.12 + (i % 3) * 0.04}
                      fill="none"
                    />
                  ))}
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
                  <Rect x="0" y="0" width={svgW} height={svgH}
                    fill="none" stroke={theme.accent} strokeWidth={2} strokeOpacity={0.3} />

                  {/* Scratch hint text (only when no scratching yet) */}
                  {pathData === '' && (
                    <>
                      <Rect x={svgW / 2 - 90} y={svgH / 2 - 18} width={180} height={36}
                        rx={8} fill="rgba(0,0,0,0.4)" />
                      <Path
                        d={`M ${svgW / 2 - 70} ${svgH / 2} Q ${svgW / 2} ${svgH / 2 - 14} ${svgW / 2 + 70} ${svgH / 2}`}
                        stroke={theme.accent} strokeWidth={2} fill="none" strokeOpacity={0.6}
                      />
                    </>
                  )}
                </G>

                {/* Brush glow ring at scratch tip */}
                {scratchTip && !done && (
                  <>
                    <SvgCircle
                      cx={scratchTip.x} cy={scratchTip.y}
                      r={BRUSH_R + 10}
                      fill={theme.accent} fillOpacity={0.08}
                      stroke={theme.accent} strokeWidth={2} strokeOpacity={0.5}
                    />
                    <SvgCircle
                      cx={scratchTip.x} cy={scratchTip.y}
                      r={BRUSH_R + 20}
                      fill="none"
                      stroke={theme.accent} strokeWidth={1} strokeOpacity={0.2}
                    />
                  </>
                )}
              </Svg>
            </View>}

            {/* Scratch sparks */}
            {sparks.map(s => (
              <ScratchSpark key={s.id} x={s.x} y={s.y} color={theme.accent} />
            ))}
          </View>

          {/* Progress bar */}
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
                  ← Scratch the silver foil to reveal →
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
                <Animated.View style={[st.winAmtRow, { transform: [{ scale: winPulse }] }]}>
                  <ChipIcon variant="green" size={28} />
                  <Text style={st.winAmt}>+{formatChips(displayChips)}</Text>
                </Animated.View>
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

        {/* ── Bulk summary card ──────────────────────────────────────────────── */}
        {bulkPhase === 'summary' && bulkResult && (
          <Animated.View style={[st.bulkSummaryCard, { transform: [{ scale: bulkCardScale }] }]}>
            <LinearGradient
              colors={bulkResult.isLegendary
                ? ['rgba(255,215,0,0.18)', 'rgba(255,215,0,0.04)']
                : ['rgba(0,212,255,0.12)', 'rgba(0,212,255,0.02)']}
              style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
            />

            {/* Title */}
            <View style={st.bulkSummaryHeader}>
              <Text style={st.bulkSummaryTitle}>LOTTERY RESULTS</Text>
              {bulkResult.isLegendary && (
                <View style={st.legendaryBadge}>
                  <Text style={st.legendaryBadgeText}>🏆 LEGENDARY WIN</Text>
                </View>
              )}
            </View>

            {/* Stats grid */}
            <View style={st.bulkStatsGrid}>
              <View style={st.bulkStatBox}>
                <Text style={st.bulkStatVal}>{bulkResult.scratched}</Text>
                <Text style={st.bulkStatLbl}>TICKETS{'\n'}SCRATCHED</Text>
              </View>
              <View style={[st.bulkStatBox, st.bulkStatBoxMid]}>
                <Text style={[st.bulkStatVal, { color: bulkResult.winners > 0 ? '#ffd700' : '#555' }]}>
                  {bulkResult.winners}
                </Text>
                <Text style={st.bulkStatLbl}>WINNING{'\n'}TICKETS</Text>
              </View>
              <View style={st.bulkStatBox}>
                <Text style={[st.bulkStatVal, { color: '#00ccaa', fontSize: bulkResult.bestWin >= 10000 ? 16 : 20 }]}>
                  {formatChips(bulkResult.bestWin)}
                </Text>
                <Text style={st.bulkStatLbl}>BEST{'\n'}SINGLE WIN</Text>
              </View>
            </View>

            {/* Main chip total */}
            <View style={st.bulkChipTotal}>
              <Text style={st.bulkChipLabel}>TOTAL CHIPS WON</Text>
              <Text style={[st.bulkChipAmount, { color: bulkResult.totalChips > 0 ? '#ffd700' : '#333' }]}>
                {bulkResult.totalChips > 0 ? `+${formatChips(bulkChipDisplay)}` : 'No wins this time'}
              </Text>
              {bulkResult.totalChips > 0 && (
                <Text style={st.bulkChipSub}>Added to your balance</Text>
              )}
            </View>

            {/* Social announcement for legendary win */}
            {bulkResult.isLegendary && (
              <View style={st.bulkAnnounce}>
                <LinearGradient
                  colors={['rgba(255,215,0,0.14)', 'rgba(255,215,0,0.06)']}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={st.bulkAnnounceIcon}>🌐</Text>
                <View style={{ flex: 1 }}>
                  <Text style={st.bulkAnnounceLbl}>GLOBAL ANNOUNCEMENT</Text>
                  <Text style={st.bulkAnnounceText}>
                    <Text style={{ color: '#ffd700' }}>{profile.username}</Text>
                    {` scratched ${bulkResult.scratched} tickets and won a `}
                    <Text style={{ color: '#ffd700' }}>Legendary Jackpot</Text>
                    {` worth ${formatChips(bulkResult.bestWin)} chips!`}
                  </Text>
                </View>
              </View>
            )}

            {/* Scratch more / done buttons */}
            <View style={st.bulkSummaryActions}>
              {profile.scratchTickets > 0 && (
                <TouchableOpacity
                  style={[st.bulkActionBtn, { borderColor: '#00d4ff44', backgroundColor: '#00d4ff0a' }]}
                  onPress={() => {
                    setBulkPhase('idle');
                    setBulkResult(null);
                    setBulkChipDisplay(0);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[st.bulkActionText, { color: '#00d4ff' }]}>
                    SCRATCH MORE ({profile.scratchTickets} left)
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[st.bulkActionBtn, { overflow: 'hidden' }]}
                onPress={() => router.back()}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={bulkResult.isLegendary ? ['#ffd700', '#ff9900'] : ['#bf5fff', '#7700ff']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                />
                <Text style={[st.bulkActionText, { color: '#050010', fontFamily: 'Orbitron_900Black' }]}>DONE</Text>
              </TouchableOpacity>
            </View>
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
  ticketCount: { fontSize: 13, fontWeight: '800', fontFamily: 'Inter_700Bold' },

  matchBanner: {
    width: '100%', borderRadius: 14, borderWidth: 1.5,
    paddingVertical: 12, paddingHorizontal: 20,
    alignItems: 'center', gap: 8,
  },
  matchBannerText: {
    fontSize: 16, fontWeight: '900', fontFamily: 'Orbitron_900Black', letterSpacing: 2,
  },
  matchPips: { flexDirection: 'row', gap: 10 },
  matchPip: {
    width: 14, height: 14, borderRadius: 7,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },

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
  jackpotAmt: { fontSize: 20, fontWeight: '900', fontFamily: 'Inter_700Bold' },

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
  prizeEmoji: { fontSize: 16 },
  prizeVal: { fontSize: 17, fontWeight: '900', fontFamily: 'Inter_700Bold' },
  prizeUnit: { color: colors.textDim, fontSize: 7, letterSpacing: 0.5 },

  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressTrack: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  progressPct: { fontSize: 10, fontWeight: '700', fontFamily: 'Inter_700Bold', minWidth: 32, textAlign: 'right' },

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
  winAmtRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  winAmt: { color: '#22c55e', fontSize: 28, fontWeight: '900', fontFamily: 'Orbitron_700Bold', letterSpacing: 1, textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },
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

  // ── Bulk scratch ──────────────────────────────────────────────────────────
  bulkRow: { width: '100%', gap: 10 },
  bulkInventory: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14, paddingVertical: 8,
  },
  bulkInventoryIcon: { fontSize: 16 },
  bulkInventoryNum:  { fontSize: 20, fontFamily: 'Inter_700Bold', color: '#fff', fontWeight: '900' },
  bulkInventoryLbl:  { fontSize: 8,  fontFamily: 'Orbitron_400Regular', color: '#555', letterSpacing: 1.5, marginLeft: 2 },
  bulkBtns:       { flexDirection: 'row', gap: 8 },
  bulkBtn: {
    flex: 1, borderRadius: 12, borderWidth: 1,
    paddingVertical: 11, paddingHorizontal: 12,
    alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  bulkBtnText: { fontSize: 11, fontFamily: 'Orbitron_900Black', fontWeight: '900', letterSpacing: 1.5 },
  bulkBtnSub:  { fontSize: 8,  fontFamily: 'Orbitron_400Regular', letterSpacing: 0.5 },

  bulkFlickerLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: '#00d4ff' },
  bulkAnimTitle: {
    color: 'rgba(255,255,255,0.35)', fontSize: 9,
    fontFamily: 'Orbitron_400Regular', letterSpacing: 3, marginBottom: 12,
  },
  bulkAnimNum: {
    color: '#00d4ff', fontSize: 44, fontFamily: 'Inter_700Bold',
    fontWeight: '900', letterSpacing: -1,
  },
  bulkAnimSub: {
    color: 'rgba(0,212,255,0.4)', fontSize: 10,
    fontFamily: 'Orbitron_400Regular', letterSpacing: 1, marginTop: 6,
  },
  bulkAnimDots: { flexDirection: 'row', gap: 6, marginTop: 20 },
  bulkAnimDot:  { width: 8, height: 8, borderRadius: 4 },

  bulkSummaryCard: {
    width: '100%', borderRadius: 20, borderWidth: 1.5,
    borderColor: 'rgba(0,212,255,0.25)',
    backgroundColor: 'rgba(5,0,16,0.97)',
    padding: 20, gap: 14, overflow: 'hidden',
  },
  bulkSummaryHeader: { alignItems: 'center', gap: 8 },
  bulkSummaryTitle: {
    color: '#fff', fontSize: 15, fontFamily: 'Orbitron_900Black',
    fontWeight: '900', letterSpacing: 2,
  },
  legendaryBadge: {
    borderRadius: 8, borderWidth: 1, borderColor: '#ffd70066',
    backgroundColor: '#ffd70018', paddingHorizontal: 14, paddingVertical: 5,
  },
  legendaryBadgeText: {
    color: '#ffd700', fontSize: 10, fontFamily: 'Orbitron_700Bold',
    letterSpacing: 1.5,
  },
  bulkStatsGrid: {
    flexDirection: 'row',
    borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
  },
  bulkStatBox: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, gap: 4,
  },
  bulkStatBoxMid: {
    borderLeftWidth: 1, borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  bulkStatVal: {
    color: '#fff', fontSize: 22, fontFamily: 'Inter_700Bold', fontWeight: '900',
  },
  bulkStatLbl: {
    color: '#444', fontSize: 7, fontFamily: 'Orbitron_400Regular',
    letterSpacing: 1, textAlign: 'center', lineHeight: 11,
  },
  bulkChipTotal: {
    alignItems: 'center', gap: 4,
    paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)',
  },
  bulkChipLabel: {
    color: '#555', fontSize: 8, fontFamily: 'Orbitron_400Regular',
    letterSpacing: 2,
  },
  bulkChipAmount: {
    fontSize: 32, fontFamily: 'Inter_700Bold', fontWeight: '900', letterSpacing: -1,
  },
  bulkChipSub: {
    color: 'rgba(255,255,255,0.25)', fontSize: 9,
    fontFamily: 'Orbitron_400Regular', letterSpacing: 0.5,
  },
  bulkAnnounce: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,215,0,0.30)',
    paddingVertical: 10, paddingHorizontal: 12, overflow: 'hidden',
  },
  bulkAnnounceIcon: { fontSize: 18 },
  bulkAnnounceLbl:  {
    color: '#ffd700', fontSize: 7, fontFamily: 'Orbitron_700Bold',
    letterSpacing: 2, marginBottom: 3,
  },
  bulkAnnounceText: {
    color: 'rgba(255,255,255,0.80)', fontSize: 10,
    fontFamily: 'Orbitron_400Regular', letterSpacing: 0.3, lineHeight: 15,
  },
  bulkSummaryActions: { gap: 8 },
  bulkActionBtn: {
    borderRadius: 12, height: 46,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'transparent',
  },
  bulkActionText: {
    fontSize: 12, fontFamily: 'Orbitron_700Bold',
    fontWeight: '900', letterSpacing: 1.5,
  },
});
