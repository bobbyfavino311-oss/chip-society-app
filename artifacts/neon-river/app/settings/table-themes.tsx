import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Ellipse, Line, Path, Rect } from 'react-native-svg';

import { useTableTheme } from '@/context/TableThemeContext';
import { ALL_TABLE_THEMES, TableTheme, ThemeId } from '@/constants/tableThemes';

// ─── Panoramic banner constants ────────────────────────────────────────────────
// viewBox 360×120 — 3:1 ratio renders full-width at ~118 px tall on device

const BW = 360, BH = 120;
const TX = 180, TY = 70;          // table ellipse center
const TRX = 140, TRY = 46;        // outer rim radii
const TFX = 133, TFY = 40;        // felt surface radii
// Community card slots (5 cards centered on table)
const CW = 18, CH = 26, CG = 5;   // card width, height, gap
const TOTAL_CW = 5 * CW + 4 * CG; // 110
const CSX = TX - TOTAL_CW / 2;    // start X = 125
const CSY = TY - CH / 2;          // start Y = 57

// ─── Shared table surface (oval + felt + card slots) ──────────────────────────
function TableSurface({ feltFill, rimColor, slotBorder }: {
  feltFill: string; rimColor: string; slotBorder: string;
}) {
  return (
    <>
      <Ellipse cx={TX} cy={TY} rx={TRX} ry={TRY}
        fill="none" stroke={rimColor} strokeWidth={1.5} strokeOpacity={0.65} />
      <Ellipse cx={TX} cy={TY} rx={TFX} ry={TFY} fill={feltFill} />
      <Ellipse cx={TX} cy={TY} rx={TFX * 0.58} ry={TFY * 0.52}
        fill="none" stroke={rimColor} strokeWidth={0.5} strokeOpacity={0.18} />
      {Array.from({ length: 5 }, (_, i) => (
        <Rect key={i}
          x={CSX + i * (CW + CG)} y={CSY}
          width={CW} height={CH} rx={3}
          fill="rgba(0,0,0,0.38)"
          stroke={slotBorder} strokeWidth={0.8} strokeOpacity={0.65}
        />
      ))}
    </>
  );
}

// ─── Per-theme panoramic banners ──────────────────────────────────────────────

function NeonDefaultBanner() {
  return (
    <Svg width="100%" height={BH} viewBox={`0 0 ${BW} ${BH}`} preserveAspectRatio="xMidYMid slice">
      <Rect x={0} y={0} width={BW} height={BH} fill="#060018" />
      {[60, 120, 180, 240, 300].map(x => (
        <Line key={`v${x}`} x1={x} y1={0} x2={x} y2={BH}
          stroke="#00d4ff" strokeWidth={0.3} strokeOpacity={0.12} />
      ))}
      {[30, 60, 90].map(y => (
        <Line key={`h${y}`} x1={0} y1={y} x2={BW} y2={y}
          stroke="#bf5fff" strokeWidth={0.3} strokeOpacity={0.10} />
      ))}
      <Circle cx={0} cy={BH} r={65} fill="#bf5fff" fillOpacity={0.10} />
      <Circle cx={BW} cy={0} r={55} fill="#00d4ff" fillOpacity={0.08} />
      <TableSurface feltFill="rgba(0,18,8,0.72)" rimColor="#ff0090" slotBorder="#00d4ff" />
    </Svg>
  );
}

function DragonFortuneBanner() {
  const scales: React.ReactElement[] = [];
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 13; col++) {
      const x = col * 30 + (row % 2) * 15 - 15;
      const y = row * 22 - 11;
      scales.push(
        <Path key={`${row}-${col}`}
          d={`M ${x+15},${y} L ${x+30},${y+11} L ${x+15},${y+22} L ${x},${y+11} Z`}
          fill="none" stroke="#C89B3C" strokeWidth={0.4} strokeOpacity={0.13}
        />
      );
    }
  }
  return (
    <Svg width="100%" height={BH} viewBox={`0 0 ${BW} ${BH}`} preserveAspectRatio="xMidYMid slice">
      <Rect x={0} y={0} width={BW} height={BH} fill="#0A0000" />
      {scales}
      <Circle cx={0} cy={BH} r={72} fill="#CC0000" fillOpacity={0.09} />
      <Circle cx={BW} cy={0} r={58} fill="#C89B3C" fillOpacity={0.07} />
      <TableSurface feltFill="rgba(16,0,0,0.86)" rimColor="#C89B3C" slotBorder="#C89B3C" />
    </Svg>
  );
}

function RoyalMasqueradeBanner() {
  const diag: React.ReactElement[] = [];
  for (let i = -2; i < 15; i++) {
    diag.push(
      <Line key={`a${i}`} x1={i * 28} y1={0} x2={i * 28 - 120} y2={BH}
        stroke="#D4AF37" strokeWidth={0.3} strokeOpacity={0.09} />,
      <Line key={`b${i}`} x1={i * 28} y1={0} x2={i * 28 + 120} y2={BH}
        stroke="#D4AF37" strokeWidth={0.3} strokeOpacity={0.09} />
    );
  }
  return (
    <Svg width="100%" height={BH} viewBox={`0 0 ${BW} ${BH}`} preserveAspectRatio="xMidYMid slice">
      <Rect x={0} y={0} width={BW} height={BH} fill="#0C0018" />
      {diag}
      <Circle cx={0} cy={BH} r={68} fill="#9B30FF" fillOpacity={0.10} />
      <Circle cx={BW} cy={0} r={58} fill="#D4AF37" fillOpacity={0.08} />
      <TableSurface feltFill="rgba(14,0,30,0.85)" rimColor="#D4AF37" slotBorder="#D4AF37" />
    </Svg>
  );
}

function SakuraBanner() {
  const petals: [number, number, number][] = [
    [38, 14, 0.26], [88, 7, 0.20], [18, 46, 0.22], [302, 18, 0.24],
    [328, 52, 0.20], [48, 88, 0.22], [312, 96, 0.20], [142, 9, 0.18],
    [258, 108, 0.22], [78, 102, 0.18], [20, 72, 0.16], [344, 82, 0.18],
  ];
  return (
    <Svg width="100%" height={BH} viewBox={`0 0 ${BW} ${BH}`} preserveAspectRatio="xMidYMid slice">
      <Rect x={0} y={0} width={BW} height={BH} fill="#150410" />
      <Path d="M 0 8 Q 55 28 85 40 Q 115 52 132 46"
        fill="none" stroke="#C4407C" strokeWidth={1.3} strokeOpacity={0.32} strokeLinecap="round" />
      <Path d="M 360 112 Q 305 90 275 80 Q 245 70 228 76"
        fill="none" stroke="#C4407C" strokeWidth={1.3} strokeOpacity={0.28} strokeLinecap="round" />
      {petals.map(([cx, cy, op], i) => (
        <Circle key={i} cx={cx} cy={cy} r={4.5} fill="#F4A8C0" fillOpacity={op} />
      ))}
      <Circle cx={0} cy={0} r={62} fill="#E8627A" fillOpacity={0.08} />
      <Circle cx={BW} cy={BH} r={58} fill="#C4407C" fillOpacity={0.08} />
      <TableSurface feltFill="rgba(20,4,16,0.85)" rimColor="#E8627A" slotBorder="#F4A8C0" />
    </Svg>
  );
}

function FrozenNeonBanner() {
  const diag: React.ReactElement[] = [];
  for (let x = 0; x <= BW + 80; x += 55) {
    diag.push(
      <Line key={x} x1={x} y1={0} x2={x - 70} y2={BH}
        stroke="#00D9FF" strokeWidth={0.35} strokeOpacity={0.14} />
    );
  }
  const snowflake = (cx: number, cy: number, r: number, color: string, op: number) =>
    [0, 30, 60, 90, 120, 150].map(deg => {
      const rad = deg * Math.PI / 180;
      return <Line key={deg}
        x1={cx} y1={cy}
        x2={cx + Math.cos(rad) * r} y2={cy + Math.sin(rad) * r}
        stroke={color} strokeWidth={0.55} strokeOpacity={op} />;
    });
  return (
    <Svg width="100%" height={BH} viewBox={`0 0 ${BW} ${BH}`} preserveAspectRatio="xMidYMid slice">
      <Rect x={0} y={0} width={BW} height={BH} fill="#05101C" />
      {diag}
      {snowflake(28, 18, 22, '#00D9FF', 0.22)}
      {snowflake(332, 102, 17, '#8FEFFF', 0.18)}
      {snowflake(8, 95, 12, '#00D9FF', 0.14)}
      <Circle cx={0} cy={0} r={68} fill="#00D9FF" fillOpacity={0.07} />
      <Circle cx={BW} cy={BH} r={58} fill="#00D9FF" fillOpacity={0.07} />
      <TableSurface feltFill="rgba(4,14,24,0.83)" rimColor="#00D9FF" slotBorder="#00D9FF" />
    </Svg>
  );
}

function CrimsonNoirBanner() {
  const silk: React.ReactElement[] = [];
  for (let x = -60; x <= BW + 60; x += 18) {
    silk.push(
      <Line key={x} x1={x} y1={0} x2={x - 120} y2={BH}
        stroke="#D4002A" strokeWidth={0.25} strokeOpacity={0.09} />
    );
  }
  return (
    <Svg width="100%" height={BH} viewBox={`0 0 ${BW} ${BH}`} preserveAspectRatio="xMidYMid slice">
      <Rect x={0} y={0} width={BW} height={BH} fill="#050003" />
      {silk}
      <Circle cx={0} cy={BH} r={72} fill="#D4002A" fillOpacity={0.08} />
      <Circle cx={BW} cy={0} r={58} fill="#A0001C" fillOpacity={0.07} />
      <TableSurface feltFill="rgba(8,2,6,0.90)" rimColor="#D4002A" slotBorder="#D4002A" />
    </Svg>
  );
}

function VercettiBanner() {
  function Palm({ x, flip }: { x: number; flip?: boolean }) {
    const s = flip ? -1 : 1;
    return (
      <>
        <Path d={`M ${x} 120 Q ${x - s * 2} 92 ${x} 72 Q ${x + s * 1} 52 ${x} 38`}
          fill="none" stroke="#003545" strokeWidth={3.5} strokeLinecap="round" />
        <Path d={`M ${x} 38 Q ${x - s * 14} 32 ${x - s * 24} 36`}
          fill="none" stroke="#00C8C0" strokeWidth={1.3} strokeLinecap="round" strokeOpacity={0.60} />
        <Path d={`M ${x} 38 Q ${x + s * 14} 32 ${x + s * 24} 36`}
          fill="none" stroke="#00C8C0" strokeWidth={1.3} strokeLinecap="round" strokeOpacity={0.60} />
        <Path d={`M ${x} 38 Q ${x - s * 6} 28 ${x - s * 8} 20`}
          fill="none" stroke="#00C8C0" strokeWidth={1.0} strokeLinecap="round" strokeOpacity={0.45} />
        <Path d={`M ${x} 38 Q ${x + s * 6} 28 ${x + s * 8} 20`}
          fill="none" stroke="#00C8C0" strokeWidth={1.0} strokeLinecap="round" strokeOpacity={0.45} />
        <Path d={`M ${x} 38 Q ${x - s * 18} 40 ${x - s * 30} 50`}
          fill="none" stroke="#00C8C0" strokeWidth={0.9} strokeLinecap="round" strokeOpacity={0.40} />
      </>
    );
  }
  return (
    <Svg width="100%" height={BH} viewBox={`0 0 ${BW} ${BH}`} preserveAspectRatio="xMidYMid slice">
      <Rect x={0} y={0} width={BW} height={BH} fill="#002530" />
      <Rect x={0} y={78} width={BW} height={2} fill="#FF6EA0" fillOpacity={0.18} />
      <Palm x={28} />
      <Palm x={332} flip />
      <Circle cx={0} cy={BH} r={58} fill="#FF6EA0" fillOpacity={0.07} />
      <Circle cx={BW} cy={BH} r={58} fill="#FF6EA0" fillOpacity={0.06} />
      <TableSurface feltFill="rgba(0,52,66,0.76)" rimColor="#FF6EA0" slotBorder="#FF6EA0" />
    </Svg>
  );
}

// ─── Short descriptions (one line each) ───────────────────────────────────────
const SHORT_DESC: Record<string, string> = {
  neon_default:     'Classic synthwave table.',
  dragon_fortune:   'Ancient crimson and gold VIP table.',
  royal_masquerade: 'Elegant Venetian casino theme.',
  sakura_garden:    'Minimal Japanese-inspired table.',
  frozen_neon:      'Arctic luxury casino table.',
  crimson_noir:     'Underground invitation-only noir room.',
  vercetti:         'Minimal tropical retro table.',
};

// ─── Theme card ───────────────────────────────────────────────────────────────
function ThemeCard({ theme, isActive, onEquip, index }: {
  theme: TableTheme;
  isActive: boolean;
  onEquip: () => void;
  index: number;
}) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 380, delay: index * 60, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 380, delay: index * 60, useNativeDriver: true }),
    ]).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const primary = theme.accentPrimary;
  const isLegendary = theme.rarity === 'LEGENDARY';

  function Banner() {
    switch (theme.id) {
      case 'dragon_fortune':   return <DragonFortuneBanner />;
      case 'royal_masquerade': return <RoyalMasqueradeBanner />;
      case 'sakura_garden':    return <SakuraBanner />;
      case 'frozen_neon':      return <FrozenNeonBanner />;
      case 'crimson_noir':     return <CrimsonNoirBanner />;
      case 'vercetti':         return <VercettiBanner />;
      default:                 return <NeonDefaultBanner />;
    }
  }

  return (
    <Animated.View style={[s.cardOuter, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={[s.card, { borderColor: isActive ? `${primary}55` : `${primary}20` }]}>

        {/* Panoramic preview banner */}
        <View style={[
          s.bannerWrap,
          isActive && {
            shadowColor: primary,
            shadowOpacity: 0.60,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 0 },
          },
        ]}>
          <Banner />
          {isActive && (
            <View style={[StyleSheet.absoluteFill, s.bannerActiveRing, { borderColor: `${primary}70` }]} />
          )}
        </View>

        {/* Info section */}
        <View style={s.cardInfo}>
          <View style={s.infoTop}>
            <View style={s.infoLeft}>
              <Text style={[s.themeName, { color: theme.textColor }]} numberOfLines={1}>
                {theme.name}
              </Text>
              <Text style={[s.rarityTag, { color: isLegendary ? primary : 'rgba(255,255,255,0.38)' }]}>
                {isLegendary ? '◆  LEGENDARY' : 'FREE'}
              </Text>
              <Text style={s.description} numberOfLines={1}>
                {SHORT_DESC[theme.id] ?? theme.tagline}
              </Text>
            </View>
            <View style={s.infoRight}>
              {isActive ? (
                <View style={[s.equippedBtn, {
                  backgroundColor: `${primary}1A`,
                  borderColor: `${primary}70`,
                  shadowColor: primary,
                  shadowOpacity: 0.35,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 0 },
                }]}>
                  <Ionicons name="checkmark" size={11} color={primary} />
                  <Text style={[s.equippedBtnText, { color: primary }]}>EQUIPPED</Text>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={onEquip}
                  style={[s.equipBtn, { borderColor: `${primary}50` }]}
                  activeOpacity={0.75}
                >
                  <Text style={[s.equipBtnText, { color: primary }]}>EQUIP</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

      </View>
    </Animated.View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function TableThemesScreen() {
  const insets = useSafeAreaInsets();
  const { theme: activeTheme, setTheme } = useTableTheme();

  return (
    <View style={s.screen}>
      <LinearGradient
        colors={['#09001E', '#050010', '#030008']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 14 }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
          <Ionicons name="chevron-back" size={21} color="rgba(255,255,255,0.55)" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>TABLE THEMES</Text>
        <View style={{ width: 40 }} />
      </View>

      <Text style={s.headerSub}>Applies to all game modes.</Text>

      <ScrollView
        contentContainerStyle={[s.list, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {ALL_TABLE_THEMES.map((t, i) => (
          <ThemeCard
            key={t.id}
            theme={t}
            isActive={t.id === activeTheme.id}
            onEquip={() => setTheme(t.id as ThemeId)}
            index={i}
          />
        ))}

        <View style={s.comingSoon}>
          <Text style={s.comingSoonLabel}>MORE THEMES COMING SOON</Text>
          <Text style={s.comingSoonSub}>Samurai Edge · Ice Palace · Golden Age</Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#050010' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: {
    color: '#e4e4ff',
    fontSize: 13,
    letterSpacing: 3.5,
    fontFamily: 'Orbitron_700Bold',
  },
  headerSub: {
    color: 'rgba(255,255,255,0.28)',
    fontSize: 11,
    textAlign: 'center',
    letterSpacing: 0.4,
    marginBottom: 22,
    marginTop: 2,
  },

  list: { paddingHorizontal: 16, gap: 22 },

  cardOuter: { borderRadius: 16, overflow: 'hidden' },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: '#0A0018',
  },

  bannerWrap: {
    width: '100%',
    overflow: 'hidden',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  bannerActiveRing: {
    borderRadius: 0,
    borderWidth: 1.5,
    pointerEvents: 'none',
  },

  cardInfo: {
    paddingHorizontal: 16,
    paddingTop: 13,
    paddingBottom: 14,
  },
  infoTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoLeft: {
    flex: 1,
    gap: 4,
  },
  infoRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  themeName: {
    fontSize: 14,
    letterSpacing: 1.8,
    fontFamily: 'Orbitron_700Bold',
  },
  rarityTag: {
    fontSize: 9,
    letterSpacing: 2,
    fontFamily: 'Orbitron_400Regular',
    marginTop: 1,
  },
  description: {
    color: 'rgba(255,255,255,0.38)',
    fontSize: 11,
    letterSpacing: 0.2,
    marginTop: 3,
  },

  equippedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 50,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  equippedBtnText: {
    fontSize: 9,
    letterSpacing: 1.8,
    fontFamily: 'Orbitron_700Bold',
  },

  equipBtn: {
    borderRadius: 50,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  equipBtnText: {
    fontSize: 9,
    letterSpacing: 2,
    fontFamily: 'Orbitron_700Bold',
  },

  comingSoon: { alignItems: 'center', paddingVertical: 28, gap: 6 },
  comingSoonLabel: {
    color: 'rgba(255,255,255,0.18)',
    fontSize: 9,
    letterSpacing: 2.5,
    fontFamily: 'Orbitron_400Regular',
  },
  comingSoonSub: {
    color: 'rgba(255,255,255,0.11)',
    fontSize: 10,
    letterSpacing: 0.4,
  },
});
