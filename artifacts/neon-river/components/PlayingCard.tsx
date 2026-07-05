import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, Line, Path, Polygon, Rect } from 'react-native-svg';
import { Card, isRedSuit, suitSymbol, valueLabel } from '../lib/pokerEngine';
import { SoundEngine } from '../lib/soundEngine';
import { useTableTheme } from '../context/TableThemeContext';

interface PlayingCardProps {
  card?: Card;
  faceDown?: boolean;
  size?: 'sm' | 'casino' | 'md' | 'lg' | 'xl';
  highlighted?: boolean;
  animated?: boolean;
}

const SIZES = {
  sm:     { w: 32,  h: 46,  valFont: 14, suitFont: 11, radius: 6  },
  casino: { w: 37,  h: 53,  valFont: 16, suitFont: 13, radius: 7  },
  md:     { w: 46,  h: 64,  valFont: 20, suitFont: 15, radius: 8  },
  lg:     { w: 60,  h: 84,  valFont: 26, suitFont: 20, radius: 10 },
  xl:     { w: 76,  h: 106, valFont: 34, suitFont: 26, radius: 13 },
};

// ─── Neon mandala card back ────────────────────────────────────────────────────
function MandalaBack({ w, h, r }: { w: number; h: number; r: number }) {
  const cx = w / 2;
  const cy = h / 2;
  const maxR = Math.min(w, h) * 0.42;
  const spokes = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * 30 * Math.PI) / 180;
    return {
      x1: cx + Math.cos(angle) * maxR * 0.18,
      y1: cy + Math.sin(angle) * maxR * 0.18,
      x2: cx + Math.cos(angle) * maxR * 0.82,
      y2: cy + Math.sin(angle) * maxR * 0.82,
    };
  });
  return (
    <View style={[StyleSheet.absoluteFillObject, { borderRadius: r, overflow: 'hidden', backgroundColor: '#c0182a' }]}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Circle cx={cx} cy={cy} r={maxR} stroke="rgba(255,255,255,0.22)" strokeWidth={1.2} fill="none" />
        <Circle cx={cx} cy={cy} r={maxR * 0.7} stroke="rgba(255,255,255,0.18)" strokeWidth={0.9} fill="none" />
        <Circle cx={cx} cy={cy} r={maxR * 0.42} stroke="rgba(255,255,255,0.2)" strokeWidth={0.9} fill="none" />
        <Circle cx={cx} cy={cy} r={maxR * 0.16} stroke="rgba(255,255,255,0.28)" strokeWidth={0.8} fill="none" />
        {spokes.map((s, i) => (
          <Line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
            stroke="rgba(255,255,255,0.14)" strokeWidth={0.8} />
        ))}
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i * 45 * Math.PI) / 180;
          return (
            <Circle key={i}
              cx={cx + Math.cos(a) * maxR * 0.7}
              cy={cy + Math.sin(a) * maxR * 0.7}
              r={maxR * 0.055} fill="rgba(255,255,255,0.3)" />
          );
        })}
        <Circle cx={cx} cy={cy} r={maxR * 0.07} fill="rgba(255,255,255,0.35)" />
      </Svg>
      <View style={{ position: 'absolute', top: 3, left: 3, right: 3, bottom: 3,
        borderRadius: r - 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }} />
    </View>
  );
}

// ─── Dragon Fortune card back ──────────────────────────────────────────────────
function DragonScaleBack({ w, h, r }: { w: number; h: number; r: number }) {
  const gold = '#C89B3C';
  const goldFaint = 'rgba(200,155,60,0.28)';
  const goldDim   = 'rgba(200,155,60,0.14)';
  const cx = w / 2;
  const cy = h / 2;

  // Dragon scale lattice — diagonal diamond grid
  const cellW = w * 0.28;
  const cellH = h * 0.18;
  const scaleLines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  const cols = Math.ceil(w / cellW) + 2;
  const rows = Math.ceil(h / cellH) + 2;
  for (let row = -1; row < rows; row++) {
    for (let col = -1; col < cols; col++) {
      const ox = col * cellW + (row % 2 === 0 ? 0 : cellW / 2);
      const oy = row * cellH;
      // Diamond shape
      scaleLines.push({ x1: ox + cellW / 2, y1: oy, x2: ox + cellW, y2: oy + cellH / 2 });
      scaleLines.push({ x1: ox + cellW, y1: oy + cellH / 2, x2: ox + cellW / 2, y2: oy + cellH });
      scaleLines.push({ x1: ox + cellW / 2, y1: oy + cellH, x2: ox, y2: oy + cellH / 2 });
      scaleLines.push({ x1: ox, y1: oy + cellH / 2, x2: ox + cellW / 2, y2: oy });
    }
  }

  // Central medallion — concentric diamonds
  const med = Math.min(w, h) * 0.22;

  return (
    <View style={[StyleSheet.absoluteFillObject, { borderRadius: r, overflow: 'hidden', backgroundColor: '#0A0000' }]}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        {/* Scale lattice */}
        {scaleLines.map((l, i) => (
          <Line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            stroke={goldDim} strokeWidth={0.5} />
        ))}
        {/* Central medallion — outer diamond */}
        <Polygon
          points={`${cx},${cy - med} ${cx + med * 0.65},${cy} ${cx},${cy + med} ${cx - med * 0.65},${cy}`}
          fill="none" stroke={goldFaint} strokeWidth={1.0} />
        {/* Mid diamond */}
        <Polygon
          points={`${cx},${cy - med * 0.65} ${cx + med * 0.42},${cy} ${cx},${cy + med * 0.65} ${cx - med * 0.42},${cy}`}
          fill="none" stroke={gold} strokeWidth={0.8} strokeOpacity={0.6} />
        {/* Center dot */}
        <Circle cx={cx} cy={cy} r={med * 0.15} fill={gold} opacity={0.75} />
        {/* Corner accents */}
        <Circle cx={3} cy={3} r={1.5} fill={gold} opacity={0.4} />
        <Circle cx={w - 3} cy={3} r={1.5} fill={gold} opacity={0.4} />
        <Circle cx={3} cy={h - 3} r={1.5} fill={gold} opacity={0.4} />
        <Circle cx={w - 3} cy={h - 3} r={1.5} fill={gold} opacity={0.4} />
      </Svg>
      {/* Gold inset border */}
      <View style={{ position: 'absolute', top: 3, left: 3, right: 3, bottom: 3,
        borderRadius: r - 1, borderWidth: 1, borderColor: 'rgba(200,155,60,0.35)' }} />
    </View>
  );
}

// ─── Masquerade Veil card back ─────────────────────────────────────────────────
function MasqueradeVeilBack({ w, h, r }: { w: number; h: number; r: number }) {
  const gold     = '#D4AF37';
  const goldDim  = 'rgba(212,175,55,0.20)';
  const goldFaint= 'rgba(212,175,55,0.10)';
  const cx = w / 2;
  const cy = h / 2;

  // Diamond lattice
  const cellW = w * 0.30;
  const cellH = h * 0.20;
  const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  const cols = Math.ceil(w / cellW) + 2;
  const rows = Math.ceil(h / cellH) + 2;
  for (let row = -1; row < rows; row++) {
    for (let col = -1; col < cols; col++) {
      const ox = col * cellW + (row % 2 === 0 ? 0 : cellW / 2);
      const oy = row * cellH;
      lines.push({ x1: ox + cellW / 2, y1: oy, x2: ox + cellW, y2: oy + cellH / 2 });
      lines.push({ x1: ox + cellW, y1: oy + cellH / 2, x2: ox + cellW / 2, y2: oy + cellH });
      lines.push({ x1: ox + cellW / 2, y1: oy + cellH, x2: ox, y2: oy + cellH / 2 });
      lines.push({ x1: ox, y1: oy + cellH / 2, x2: ox + cellW / 2, y2: oy });
    }
  }

  const med = Math.min(w, h) * 0.22;

  return (
    <View style={[StyleSheet.absoluteFillObject, { borderRadius: r, overflow: 'hidden', backgroundColor: '#100020' }]}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        {lines.map((l, i) => (
          <Line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            stroke={goldFaint} strokeWidth={0.5} />
        ))}
        {/* Central diamond medallion */}
        <Polygon
          points={`${cx},${cy - med} ${cx + med * 0.65},${cy} ${cx},${cy + med} ${cx - med * 0.65},${cy}`}
          fill="none" stroke={goldDim} strokeWidth={1.0} />
        <Polygon
          points={`${cx},${cy - med * 0.65} ${cx + med * 0.42},${cy} ${cx},${cy + med * 0.65} ${cx - med * 0.42},${cy}`}
          fill="none" stroke={gold} strokeWidth={0.8} strokeOpacity={0.55} />
        {/* Tiny mask eye suggestions at center */}
        <Ellipse cx={cx - med * 0.18} cy={cy} rx={med * 0.12} ry={med * 0.08}
          fill="none" stroke={gold} strokeWidth={0.7} strokeOpacity={0.50} />
        <Ellipse cx={cx + med * 0.18} cy={cy} rx={med * 0.12} ry={med * 0.08}
          fill="none" stroke={gold} strokeWidth={0.7} strokeOpacity={0.50} />
        <Circle cx={cx} cy={cy} r={med * 0.06} fill={gold} opacity={0.65} />
        {/* Corner accents */}
        <Circle cx={3} cy={3} r={1.5} fill={gold} opacity={0.4} />
        <Circle cx={w - 3} cy={3} r={1.5} fill={gold} opacity={0.4} />
        <Circle cx={3} cy={h - 3} r={1.5} fill={gold} opacity={0.4} />
        <Circle cx={w - 3} cy={h - 3} r={1.5} fill={gold} opacity={0.4} />
      </Svg>
      <View style={{ position: 'absolute', top: 3, left: 3, right: 3, bottom: 3,
        borderRadius: r - 1, borderWidth: 1, borderColor: 'rgba(212,175,55,0.30)' }} />
    </View>
  );
}

// ─── Sakura Blossom card back ──────────────────────────────────────────────────
function SakuraBlossomBack({ w, h, r }: { w: number; h: number; r: number }) {
  const pink     = '#F4A8C0';
  const rose     = '#E8627A';
  const pinkDim  = 'rgba(244,168,192,0.20)';
  const pinkFaint= 'rgba(244,168,192,0.10)';
  const cx = w / 2;
  const cy = h / 2;
  const med = Math.min(w, h) * 0.24;

  // Scattered petal ellipses [cx, cy, rx, ry, angle, opacity]
  const petals: [number, number, number, number, number, number][] = [
    [cx - med * 1.4, cy - med * 1.1, 5, 3, 30,  0.18],
    [cx + med * 1.3, cy - med * 0.9, 5, 3, -40, 0.16],
    [cx - med * 1.1, cy + med * 1.0, 4, 2.5, 50, 0.14],
    [cx + med * 1.2, cy + med * 1.1, 5, 3, -25, 0.15],
    [cx - med * 0.3, cy - med * 1.6, 4, 2.5, 15, 0.14],
    [cx + med * 0.4, cy + med * 1.5, 5, 3, -55, 0.13],
    [5, 5, 3.5, 2, 20, 0.22], [w-5, 5, 3.5, 2, -20, 0.22],
    [5, h-5, 3.5, 2, -30, 0.22], [w-5, h-5, 3.5, 2, 30, 0.22],
  ];

  // 4-petal blossom ring around center
  const blossomOffsets: [number, number][] = [
    [0, -med], [med, 0], [0, med], [-med, 0],
  ];

  return (
    <View style={[StyleSheet.absoluteFillObject, { borderRadius: r, overflow: 'hidden', backgroundColor: '#160410' }]}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        {/* Scattered petals */}
        {petals.map(([pcx, pcy, prx, pry, ang, op], i) => (
          <Ellipse key={i} cx={pcx} cy={pcy} rx={prx} ry={pry}
            fill={pink} fillOpacity={op}
            transform={`rotate(${ang}, ${pcx}, ${pcy})`} />
        ))}
        {/* Outer blossom ring — petals */}
        {blossomOffsets.map(([ox, oy], i) => (
          <Ellipse key={`b${i}`}
            cx={cx + ox * 0.5} cy={cy + oy * 0.5}
            rx={med * 0.62} ry={med * 0.40}
            fill={pink} fillOpacity={0.22}
            transform={`rotate(${i * 90}, ${cx + ox * 0.5}, ${cy + oy * 0.5})`}
          />
        ))}
        {/* Inner medallion rings */}
        <Circle cx={cx} cy={cy} r={med * 0.75}
          fill="none" stroke={pinkDim} strokeWidth={1.0} />
        <Circle cx={cx} cy={cy} r={med * 0.48}
          fill="none" stroke={pinkFaint} strokeWidth={0.7} />
        {/* Center blossom */}
        {blossomOffsets.map(([ox, oy], i) => (
          <Ellipse key={`c${i}`}
            cx={cx + ox * 0.28} cy={cy + oy * 0.28}
            rx={med * 0.28} ry={med * 0.18}
            fill={pink} fillOpacity={0.35}
            transform={`rotate(${i * 90}, ${cx + ox * 0.28}, ${cy + oy * 0.28})`}
          />
        ))}
        <Circle cx={cx} cy={cy} r={med * 0.10}
          fill={rose} fillOpacity={0.65} />
      </Svg>
      {/* Rose inset border */}
      <View style={{ position: 'absolute', top: 3, left: 3, right: 3, bottom: 3,
        borderRadius: r - 1, borderWidth: 1, borderColor: 'rgba(232,98,122,0.28)' }} />
    </View>
  );
}

// ─── Frozen Glass card back ─────────────────────────────────────────────────────
function FrozenGlassBack({ w, h, r }: { w: number; h: number; r: number }) {
  const cyan     = '#00D9FF';
  const ice      = '#8FEFFF';
  const iceDim   = 'rgba(143,239,255,0.18)';
  const cyanDim  = 'rgba(0,217,255,0.12)';
  const cx = w / 2;
  const cy = h / 2;
  const med = Math.min(w, h) * 0.26;

  // Geometric lattice points — 8 directions
  const dirs: [number, number][] = [
    [0, -1], [0.707, -0.707], [1, 0], [0.707, 0.707],
    [0, 1], [-0.707, 0.707], [-1, 0], [-0.707, -0.707],
  ];

  return (
    <View style={[StyleSheet.absoluteFillObject, { borderRadius: r, overflow: 'hidden', backgroundColor: '#040D18' }]}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        {/* Outer frosted ring */}
        <Circle cx={cx} cy={cy} r={med * 1.45}
          fill="none" stroke={cyanDim} strokeWidth={1.2} />
        {/* Mid ring */}
        <Circle cx={cx} cy={cy} r={med * 1.0}
          fill="none" stroke={iceDim} strokeWidth={0.8} />
        {/* Inner ring */}
        <Circle cx={cx} cy={cy} r={med * 0.58}
          fill="none" stroke={cyanDim} strokeWidth={0.6} />

        {/* Spoke lines from center — geometric lattice */}
        {dirs.map(([dx, dy], i) => (
          <Line key={i}
            x1={cx} y1={cy}
            x2={cx + dx * med * 1.45}
            y2={cy + dy * med * 1.45}
            stroke={cyan} strokeWidth={0.4} strokeOpacity={0.18}
          />
        ))}

        {/* Corner tick marks on outer ring */}
        {[0, 1, 2, 3].map((i) => {
          const angle = (i * Math.PI) / 2;
          const bx = cx + Math.cos(angle) * med * 1.45;
          const by = cy + Math.sin(angle) * med * 1.45;
          const nx = -Math.sin(angle);
          const ny = Math.cos(angle);
          return (
            <Line key={`t${i}`}
              x1={bx - nx * 3} y1={by - ny * 3}
              x2={bx + nx * 3} y2={by + ny * 3}
              stroke={ice} strokeWidth={1.2} strokeOpacity={0.55}
            />
          );
        })}

        {/* Central diamond (rotated square) */}
        <Polygon
          points={`${cx},${cy - med * 0.42} ${cx + med * 0.42},${cy} ${cx},${cy + med * 0.42} ${cx - med * 0.42},${cy}`}
          fill="none" stroke={cyan} strokeWidth={0.9} strokeOpacity={0.50}
        />
        {/* Inner diamond */}
        <Polygon
          points={`${cx},${cy - med * 0.22} ${cx + med * 0.22},${cy} ${cx},${cy + med * 0.22} ${cx - med * 0.22},${cy}`}
          fill={cyan} fillOpacity={0.08}
          stroke={ice} strokeWidth={0.6} strokeOpacity={0.40}
        />

        {/* Center glow dot */}
        <Circle cx={cx} cy={cy} r={med * 0.09}
          fill={ice} fillOpacity={0.75} />
        <Circle cx={cx} cy={cy} r={med * 0.06}
          fill="#F5FCFF" fillOpacity={0.9} />

        {/* Corner accent dots at outer ring intersections */}
        {[0, 1, 2, 3].map((i) => {
          const angle = (i * Math.PI) / 2;
          return (
            <Circle key={`d${i}`}
              cx={cx + Math.cos(angle) * med * 1.0}
              cy={cy + Math.sin(angle) * med * 1.0}
              r={2.2}
              fill={ice} fillOpacity={0.45}
            />
          );
        })}
      </Svg>
      {/* Cyan inset border */}
      <View style={{ position: 'absolute', top: 3, left: 3, right: 3, bottom: 3,
        borderRadius: r - 1, borderWidth: 1, borderColor: 'rgba(0,217,255,0.28)' }} />
    </View>
  );
}

// ─── Card back router ──────────────────────────────────────────────────────────
// ─── Crimson Silk card back ─────────────────────────────────────────────────────
function CrimsonSilkBack({ w, h, r }: { w: number; h: number; r: number }) {
  const crimson  = '#D4002A';
  const ruby     = '#A0001C';
  const silver   = 'rgba(200,200,200,0.18)';
  const cx = w / 2;
  const cy = h / 2;
  const med = Math.min(w, h) * 0.26;

  return (
    <View style={[StyleSheet.absoluteFillObject, { borderRadius: r, overflow: 'hidden', backgroundColor: '#0A0003' }]}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        {/* Flowing ribbon A — upper-left to lower-right */}
        <Path
          d={`M ${-w * 0.1} ${h * 0.15}
              C ${w * 0.25} ${h * 0.05}, ${w * 0.65} ${h * 0.38}, ${w * 1.1} ${h * 0.55}
              C ${w * 1.1} ${h * 0.68}, ${w * 0.70} ${h * 0.46}, ${-w * 0.1} ${h * 0.32} Z`}
          fill={ruby} fillOpacity={0.22}
        />
        {/* Flowing ribbon B — lower-right to upper-left */}
        <Path
          d={`M ${w * 1.1} ${h * 0.58}
              C ${w * 0.72} ${h * 0.48}, ${w * 0.38} ${h * 0.70}, ${-w * 0.1} ${h * 0.60}
              C ${-w * 0.1} ${h * 0.74}, ${w * 0.35} ${h * 0.84}, ${w * 1.1} ${h * 0.80} Z`}
          fill={crimson} fillOpacity={0.16}
        />
        {/* Outer rings */}
        <Circle cx={cx} cy={cy} r={med * 1.4}
          fill="none" stroke={ruby} strokeWidth={0.8} strokeOpacity={0.28} />
        <Circle cx={cx} cy={cy} r={med * 0.95}
          fill="none" stroke={crimson} strokeWidth={0.6} strokeOpacity={0.22} />
        <Circle cx={cx} cy={cy} r={med * 0.52}
          fill="none" stroke={silver} strokeWidth={0.5} />

        {/* Cardinal spoke lines */}
        {([0, 1, 2, 3] as const).map((i) => {
          const angle = (i * Math.PI) / 2;
          return (
            <Line key={i}
              x1={cx} y1={cy}
              x2={cx + Math.cos(angle) * med * 1.4}
              y2={cy + Math.sin(angle) * med * 1.4}
              stroke={ruby} strokeWidth={0.4} strokeOpacity={0.22}
            />
          );
        })}

        {/* Central diamond */}
        <Polygon
          points={`${cx},${cy - med * 0.40} ${cx + med * 0.40},${cy} ${cx},${cy + med * 0.40} ${cx - med * 0.40},${cy}`}
          fill={ruby} fillOpacity={0.18}
          stroke={crimson} strokeWidth={0.9} strokeOpacity={0.55}
        />
        {/* Inner diamond */}
        <Polygon
          points={`${cx},${cy - med * 0.20} ${cx + med * 0.20},${cy} ${cx},${cy + med * 0.20} ${cx - med * 0.20},${cy}`}
          fill={crimson} fillOpacity={0.12}
          stroke={silver} strokeWidth={0.5}
        />

        {/* Cardinal tick marks on outer ring */}
        {([0, 1, 2, 3] as const).map((i) => {
          const angle = (i * Math.PI) / 2;
          const bx = cx + Math.cos(angle) * med * 1.4;
          const by = cy + Math.sin(angle) * med * 1.4;
          const nx = -Math.sin(angle);
          const ny = Math.cos(angle);
          return (
            <Line key={`t${i}`}
              x1={bx - nx * 3.5} y1={by - ny * 3.5}
              x2={bx + nx * 3.5} y2={by + ny * 3.5}
              stroke={silver} strokeWidth={1.2}
            />
          );
        })}

        {/* Centre dot */}
        <Circle cx={cx} cy={cy} r={med * 0.09} fill={ruby}    fillOpacity={0.80} />
        <Circle cx={cx} cy={cy} r={med * 0.05} fill="#F0E8E8" fillOpacity={0.90} />

        {/* Silver sheen — top highlight */}
        <Ellipse cx={cx} cy={h * 0.12} rx={w * 0.35} ry={h * 0.06}
          fill="rgba(200,200,200,0.05)" />
      </Svg>
      {/* Crimson inset border */}
      <View style={{ position: 'absolute', top: 3, left: 3, right: 3, bottom: 3,
        borderRadius: r - 1, borderWidth: 1, borderColor: 'rgba(212,0,42,0.30)' }} />
    </View>
  );
}

// ─── Joker card face ──────────────────────────────────────────────────────────
// Five-pointed star: outer R=40 inner R=17 centered at (50,50)
const STAR_POINTS = '50,10 59.99,36.26 88.04,37.64 66.17,55.25 73.51,82.36 50,67 26.49,82.36 33.83,55.25 11.96,37.64 40.01,36.26';
function JokerFace({ w, h }: { w: number; h: number }) {
  const size = Math.min(w, h) * 0.58;
  return (
    <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Polygon points={STAR_POINTS} fill="#111111" />
      </Svg>
    </View>
  );
}

function CardBack({ w, h, r }: { w: number; h: number; r: number }) {
  const { theme } = useTableTheme();
  if (theme.cardBackPattern === 'dragon_scale')    return <DragonScaleBack    w={w} h={h} r={r} />;
  if (theme.cardBackPattern === 'masquerade_veil') return <MasqueradeVeilBack w={w} h={h} r={r} />;
  if (theme.cardBackPattern === 'sakura_blossom')  return <SakuraBlossomBack  w={w} h={h} r={r} />;
  if (theme.cardBackPattern === 'frozen_glass')    return <FrozenGlassBack    w={w} h={h} r={r} />;
  if (theme.cardBackPattern === 'crimson_silk')    return <CrimsonSilkBack    w={w} h={h} r={r} />;
  return <MandalaBack w={w} h={h} r={r} />;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function PlayingCard({
  card,
  faceDown = false,
  size = 'md',
  highlighted = false,
  animated: doAnimate = true,
}: PlayingCardProps) {
  const dim = SIZES[size];

  // ── Flip animation ───────────────────────────────────────────────────────
  const flipAnim = useRef(new Animated.Value(faceDown || !card ? 0 : 1)).current;
  const prevFaceDown = useRef(faceDown);
  const prevCard = useRef(card);

  useEffect(() => {
    const wasFaceDown = prevFaceDown.current;
    const wasCard = prevCard.current;
    prevFaceDown.current = faceDown;
    prevCard.current = card;

    const isVisible = !faceDown && !!card;
    const wasVisible = !wasFaceDown && !!wasCard;

    if (isVisible && !wasVisible) {
      if (doAnimate) {
        SoundEngine.cardFlip();
        flipAnim.setValue(0);
        Animated.timing(flipAnim, {
          toValue: 1, duration: 320, useNativeDriver: true,
        }).start();
      } else {
        flipAnim.setValue(1);
      }
    } else if (!isVisible && wasVisible) {
      flipAnim.setValue(0);
    } else if (isVisible) {
      flipAnim.setValue(1);
    }
  }, [faceDown, card]);

  const frontRotateY = flipAnim.interpolate({
    inputRange: [0, 0.49, 0.5, 1],
    outputRange: ['90deg', '90deg', '0deg', '0deg'],
  });
  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 0.49, 0.5, 1],
    outputRange: [0, 0, 1, 1],
  });
  const backRotateY = flipAnim.interpolate({
    inputRange: [0, 0.49, 0.5, 1],
    outputRange: ['0deg', '-90deg', '-90deg', '-90deg'],
  });
  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 0.49, 0.5, 1],
    outputRange: [1, 1, 0, 0],
  });

  // ── Card face values ─────────────────────────────────────────────────────
  const isJokerCard = !!card && card.value === 0;
  const isRed = card && !isJokerCard ? isRedSuit(card.suit) : false;
  const textColor = isRed ? '#e0132a' : '#111111';
  const val = card && !isJokerCard ? valueLabel(card.value) : '';
  const suit = card && !isJokerCard ? suitSymbol(card.suit) : '';

  const cardBase = { width: dim.w, height: dim.h, borderRadius: dim.radius };

  return (
    <View style={{ width: dim.w, height: dim.h }}>

      {/* ── Back face ──────────────────────────────────────────────────────── */}
      <View style={[StyleSheet.absoluteFillObject, { transform: [{ perspective: 1200 }] }]}>
        <Animated.View
          style={[
            cardBase,
            StyleSheet.absoluteFillObject,
            { opacity: backOpacity, transform: [{ rotateY: backRotateY }] },
          ]}
        >
          <CardBack w={dim.w} h={dim.h} r={dim.radius} />
        </Animated.View>
      </View>

      {/* ── Front face ─────────────────────────────────────────────────────── */}
      {card && (
        <View style={[StyleSheet.absoluteFillObject, { transform: [{ perspective: 1200 }] }]}>
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              { opacity: frontOpacity, transform: [{ rotateY: frontRotateY }] },
            ]}
          >
            {/* Outer cyan glow ring when highlighted */}
            {highlighted && (
              <View
                style={[
                  cardBase,
                  StyleSheet.absoluteFillObject,
                  styles.highlightOuter,
                ]}
              />
            )}
            <View
              style={[
                cardBase,
                styles.cardFront,
                highlighted && styles.highlightInner,
                StyleSheet.absoluteFillObject,
              ]}
            >
              {isJokerCard ? (
                <JokerFace w={dim.w} h={dim.h} />
              ) : (
                <>
                  {/* Large centered value */}
                  <Text style={[styles.cardValue, { fontSize: dim.valFont, color: textColor }]}>
                    {val}
                  </Text>
                  {/* Suit symbol below */}
                  <Text style={[styles.cardSuit, { fontSize: dim.suitFont, color: textColor }]}>
                    {suit}
                  </Text>
                </>
              )}
            </View>
          </Animated.View>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  cardFront: {
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0050D4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
    gap: 1,
    borderWidth: 2,
    borderColor: 'rgba(0,102,255,0.32)',
  },
  highlightOuter: {
    shadowColor: '#00d4ff',
    shadowOpacity: 1,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
    borderWidth: 2.5,
    borderColor: 'rgba(0,212,255,0.55)',
    backgroundColor: 'transparent',
  },
  highlightInner: {
    shadowColor: '#00d4ff',
    shadowOpacity: 1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    borderWidth: 2,
    borderColor: '#00d4ff',
  },
  jokerGlow: {
    shadowColor: '#bf5fff',
    shadowOpacity: 0.9,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    borderColor: 'rgba(191,95,255,0.50)',
  },
  cardValue: {
    fontWeight: '800',
    lineHeight: undefined,
    includeFontPadding: false,
    textAlign: 'center',
  },
  cardSuit: {
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: undefined,
    includeFontPadding: false,
    marginTop: 1,
  },
});
