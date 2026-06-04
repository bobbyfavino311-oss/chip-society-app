/**
 * generate-avatars.mjs  —  CHIP SOCIETY neon avatar PNGs
 *
 * Style: BOLD FILLED SILHOUETTES on a TRANSPARENT background.
 * Size:  1024×1024 (transparent PNG, no circle background baked in).
 * Cutouts inside icons use fill="#000000" — invisible against the component's
 * black backgroundColor, creating clean "holes" without extra SVG masks.
 *
 * Run: node scripts/generate-avatars.mjs
 */

import sharp from 'sharp';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT  = resolve(__dirname, '..', 'artifacts', 'neon-river', 'assets', 'avatars');
const SIZE = 1024;
const CX = 512, CY = 512;          // canvas centre
const BG  = 'transparent';          // no baked-in background
const CUT = '#000000';              // "transparent" cutout colour (matches component bg)

// ── SVG wrapper ────────────────────────────────────────────────────────────────

function wrap(defs, body) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <filter id="g" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="8" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    ${defs || ''}
  </defs>
  <g filter="url(#g)">${body}</g>
</svg>`;
}

// ── 15 avatar definitions ──────────────────────────────────────────────────────

const AVATARS = [

  // ── 1  MARTINI  ─────────────────────────────────────────────────────────────
  { id:1, name:'martini', color:'#00d4ff', defs:'', body: C => `
    <!-- Bowl: filled triangle -->
    <polygon points="155,215 869,215 512,705" fill="${C}"/>
    <!-- Stem -->
    <rect x="487" y="700" width="50" height="148" rx="22" fill="${C}"/>
    <!-- Base -->
    <rect x="336" y="844" width="352" height="66" rx="33" fill="${C}"/>
    <!-- Olive pick (thin slot cut into bowl) -->
    <rect x="188" y="304" width="560" height="28" rx="12" fill="${CUT}"/>
    <!-- Olive (filled circle on pick) -->
    <circle cx="484" cy="318" r="55" fill="${C}"/>
    <circle cx="484" cy="318" r="26" fill="${CUT}"/>
  ` },

  // ── 2  PALM  ────────────────────────────────────────────────────────────────
  { id:2, name:'palm', color:'#ff0090', defs:'', body: C => `
    <!-- Trunk (tapered rectangle) -->
    <path d="M475,860 C469,730 471,590 484,465
             C492,385 496,308 492,252 L536,252
             C532,308 536,385 544,465
             C557,590 559,730 553,860 Z" fill="${C}"/>
    <!-- Crown knob -->
    <circle cx="514" cy="268" r="46" fill="${C}"/>
    <!-- 5 fronds — ellipses rotated around crown centre (514,278) -->
    <ellipse cx="514" cy="188" rx="178" ry="52" fill="${C}" transform="rotate(0 514 278)"/>
    <ellipse cx="514" cy="188" rx="178" ry="52" fill="${C}" transform="rotate(65 514 278)"/>
    <ellipse cx="514" cy="188" rx="178" ry="52" fill="${C}" transform="rotate(-65 514 278)"/>
    <ellipse cx="514" cy="188" rx="188" ry="46" fill="${C}" transform="rotate(112 514 282)"/>
    <ellipse cx="514" cy="188" rx="188" ry="46" fill="${C}" transform="rotate(-112 514 282)"/>
  ` },

  // ── 3  DICE STACK  ──────────────────────────────────────────────────────────
  { id:3, name:'dice_stack', color:'#8b5cf6', defs:'', body: C => `
    <!-- Back die (offset upper-right, slightly smaller) -->
    <rect x="238" y="148" width="540" height="540" rx="76" fill="${C}" opacity="0.72"/>
    <!-- Front die (lower-left, bold) -->
    <rect x="154" y="336" width="568" height="568" rx="80" fill="${C}"/>
    <!-- Front die: quincunx pip pattern (5) -->
    <circle cx="308" cy="492" r="54" fill="${CUT}"/>
    <circle cx="490" cy="492" r="54" fill="${CUT}"/>
    <circle cx="399" cy="621" r="54" fill="${CUT}"/>
    <circle cx="308" cy="750" r="54" fill="${CUT}"/>
    <circle cx="490" cy="750" r="54" fill="${CUT}"/>
    <!-- Back die: 3 pips (diagonal) -->
    <circle cx="470" cy="218" r="42" fill="${CUT}" opacity="0.9"/>
    <circle cx="548" cy="316" r="42" fill="${CUT}" opacity="0.9"/>
    <circle cx="626" cy="416" r="42" fill="${CUT}" opacity="0.9"/>
  ` },

  // ── 4  CASSETTE  ────────────────────────────────────────────────────────────
  { id:4, name:'cassette', color:'#00d4ff', defs:'', body: C => `
    <!-- Body -->
    <rect x="148" y="278" width="728" height="468" rx="60" fill="${C}"/>
    <!-- Left spool hole -->
    <circle cx="370" cy="512" r="138" fill="${CUT}"/>
    <!-- Left spool hub -->
    <circle cx="370" cy="512" r="54"  fill="${C}"/>
    <!-- Right spool hole -->
    <circle cx="654" cy="512" r="138" fill="${CUT}"/>
    <!-- Right spool hub -->
    <circle cx="654" cy="512" r="54"  fill="${C}"/>
    <!-- Tape window slot (bottom centre) -->
    <rect x="456" y="660" width="112" height="62" rx="20" fill="${CUT}"/>
    <!-- Label divider line (bottom strip cut) -->
    <rect x="162" y="700" width="700" height="24" fill="${CUT}" opacity="0.55"/>
    <!-- Corner screws (small black dots reveal through) -->
    <circle cx="200" cy="308" r="18" fill="${CUT}" opacity="0.6"/>
    <circle cx="824" cy="308" r="18" fill="${CUT}" opacity="0.6"/>
    <circle cx="200" cy="716" r="18" fill="${CUT}" opacity="0.6"/>
    <circle cx="824" cy="716" r="18" fill="${CUT}" opacity="0.6"/>
  ` },

  // ── 5  SATURN  ──────────────────────────────────────────────────────────────
  { id:5, name:'saturn', color:'#a855f7', defs:`
    <clipPath id="rb"><rect x="0" y="${CY}" width="${SIZE}" height="${SIZE}"/></clipPath>
    <clipPath id="rf"><rect x="0" y="0"   width="${SIZE}" height="${CY}"/></clipPath>
  `, body: C => `
    <!-- Ring behind planet (lower arc only) -->
    <ellipse cx="${CX}" cy="${CY}" rx="432" ry="128" fill="none"
             stroke="${C}" stroke-width="90" clip-path="url(#rb)"
             transform="rotate(-18 ${CX} ${CY})"/>
    <!-- Planet body -->
    <circle cx="${CX}" cy="${CY}" r="238" fill="${C}"/>
    <!-- Ring in front of planet (upper arc only) -->
    <ellipse cx="${CX}" cy="${CY}" rx="432" ry="128" fill="none"
             stroke="${C}" stroke-width="90" clip-path="url(#rf)"
             transform="rotate(-18 ${CX} ${CY})"/>
  ` },

  // ── 6  VINYL  ───────────────────────────────────────────────────────────────
  { id:6, name:'vinyl', color:'#ff1a6e', defs:'', body: C => `
    <!-- Outer disc edge (thick stroke ring) -->
    <circle cx="${CX}" cy="${CY}" r="415" fill="none" stroke="${C}" stroke-width="56"/>
    <!-- Groove rings (subtle) -->
    <circle cx="${CX}" cy="${CY}" r="360" fill="none" stroke="${C}" stroke-width="16" opacity="0.4"/>
    <circle cx="${CX}" cy="${CY}" r="308" fill="none" stroke="${C}" stroke-width="14" opacity="0.4"/>
    <circle cx="${CX}" cy="${CY}" r="256" fill="none" stroke="${C}" stroke-width="12" opacity="0.4"/>
    <!-- Label circle (filled) -->
    <circle cx="${CX}" cy="${CY}" r="206" fill="${C}"/>
    <!-- Centre hole -->
    <circle cx="${CX}" cy="${CY}" r="46"  fill="${CUT}"/>
    <!-- Label shine mark -->
    <ellipse cx="460" cy="432" rx="22" ry="48" fill="${CUT}" opacity="0.35" transform="rotate(-30 460 432)"/>
  ` },

  // ── 7  CHERRY  ──────────────────────────────────────────────────────────────
  { id:7, name:'cherry', color:'#ff3344', defs:'', body: C => `
    <!-- Left cherry -->
    <circle cx="305" cy="650" r="164" fill="${C}"/>
    <!-- Right cherry -->
    <circle cx="638" cy="650" r="164" fill="${C}"/>
    <!-- Left stem (thick rounded path) -->
    <path d="M305,486 C312,418 360,360 512,306"
          stroke="${C}" stroke-width="58" fill="none" stroke-linecap="round"/>
    <!-- Right stem -->
    <path d="M638,486 C630,418 580,360 512,306"
          stroke="${C}" stroke-width="58" fill="none" stroke-linecap="round"/>
    <!-- Leaf -->
    <ellipse cx="454" cy="272" rx="88" ry="46" fill="${C}" transform="rotate(-32 454 272)"/>
    <!-- Cherry shine (left) -->
    <circle cx="268" cy="610" r="38" fill="${CUT}" opacity="0.38"/>
    <!-- Cherry shine (right) -->
    <circle cx="600" cy="610" r="38" fill="${CUT}" opacity="0.38"/>
  ` },

  // ── 8  FLAMINGO  ────────────────────────────────────────────────────────────
  { id:8, name:'flamingo', color:'#ff69b4', defs:'', body: C => `
    <!-- Body oval -->
    <ellipse cx="534" cy="418" rx="205" ry="152" fill="${C}" transform="rotate(-14 534 418)"/>
    <!-- Neck (thick stroke path, S-curve to head) -->
    <path d="M390,336 C365,290 315,252 278,205"
          stroke="${C}" stroke-width="92" fill="none" stroke-linecap="round"/>
    <!-- Head circle -->
    <circle cx="264" cy="174" r="82" fill="${C}"/>
    <!-- Beak (bent downward from head) -->
    <path d="M210,192 C175,228 164,268 180,294"
          stroke="${C}" stroke-width="58" fill="none" stroke-linecap="round"/>
    <!-- Beak hook tip -->
    <circle cx="180" cy="294" r="30" fill="${C}"/>
    <!-- Eye (black hole) -->
    <circle cx="285" cy="162" r="30" fill="${CUT}"/>
    <!-- Standing leg (one, thick) -->
    <line x1="545" y1="568" x2="525" y2="856"
          stroke="${C}" stroke-width="58" stroke-linecap="round"/>
    <!-- Foot — 3 toes -->
    <line x1="525" y1="856" x2="432" y2="892" stroke="${C}" stroke-width="44" stroke-linecap="round"/>
    <line x1="525" y1="856" x2="525" y2="902" stroke="${C}" stroke-width="44" stroke-linecap="round"/>
    <line x1="525" y1="856" x2="618" y2="890" stroke="${C}" stroke-width="44" stroke-linecap="round"/>
    <!-- Tucked leg (short, bent behind body) -->
    <path d="M570,558 C586,604 608,640 608,640"
          stroke="${C}" stroke-width="44" fill="none" stroke-linecap="round"/>
  ` },

  // ── 9  SUNSET  ──────────────────────────────────────────────────────────────
  { id:9, name:'sunset', color:'#ff6b35', defs:'', body: C => `
    <!-- Sun (filled semicircle) -->
    <path d="M118,558 A394,394 0 0,1 906,558 Z" fill="${C}"/>
    <!-- Inner sun ring (cutout) -->
    <path d="M176,558 A336,336 0 0,1 848,558 Z" fill="${CUT}" opacity="0.28"/>
    <!-- Horizon bar -->
    <rect x="102" y="540" width="820" height="56" rx="0" fill="${C}"/>
    <!-- Perspective grid — vanishing-point lines to (512,568) -->
    <polygon points="102,780 512,568 300,780"  fill="${C}" opacity="0.68"/>
    <polygon points="922,780 512,568 724,780"  fill="${C}" opacity="0.68"/>
    <polygon points="102,920 512,568 174,920"  fill="${C}" opacity="0.46"/>
    <polygon points="922,920 512,568 850,920"  fill="${C}" opacity="0.46"/>
    <!-- Horizontal grid bars below horizon -->
    <rect x="118" y="642" width="788" height="38" rx="0" fill="${C}" opacity="0.60"/>
    <rect x="142" y="722" width="740" height="34" rx="0" fill="${C}" opacity="0.44"/>
    <rect x="168" y="800" width="688" height="30" rx="0" fill="${C}" opacity="0.30"/>
  ` },

  // ── 10  ACE  ────────────────────────────────────────────────────────────────
  { id:10, name:'ace', color:'#ffd700', defs:'', body: C => `
    <!-- Card body -->
    <rect x="268" y="148" width="488" height="728" rx="68" fill="${C}"/>
    <!-- Large A — two diagonal legs (filled triangle pair) -->
    <polygon points="366,760 512,248 658,760 612,760 512,314 412,760" fill="${CUT}"/>
    <!-- A crossbar (rect cutout) -->
    <rect x="428" y="578" width="168" height="56" fill="${CUT}"/>
    <!-- Corner pip (top-left) -->
    <circle cx="308" cy="195" r="24" fill="${CUT}"/>
    <!-- Corner pip (bottom-right) -->
    <circle cx="716" cy="829" r="24" fill="${CUT}"/>
    <!-- Small spade at card top centre -->
    <!-- Spade left lobe -->
    <path d="M512,206 C488,185 452,196 452,218 C452,240 482,248 512,268"
          fill="${CUT}"/>
    <!-- Spade right lobe -->
    <path d="M512,206 C536,185 572,196 572,218 C572,240 542,248 512,268"
          fill="${CUT}"/>
    <!-- Spade tail -->
    <rect x="504" y="262" width="16" height="22" fill="${CUT}"/>
    <rect x="490" y="282" width="44" height="14" fill="${CUT}"/>
  ` },

  // ── 11  HOURGLASS  ──────────────────────────────────────────────────────────
  { id:11, name:'hourglass', color:'#bf5fff', defs:'', body: C => `
    <!-- Top cap -->
    <rect x="138" y="138" width="748" height="70" rx="35" fill="${C}"/>
    <!-- Bottom cap -->
    <rect x="138" y="816" width="748" height="70" rx="35" fill="${C}"/>
    <!-- Top funnel triangle -->
    <polygon points="138,208 886,208 512,512" fill="${C}"/>
    <!-- Bottom funnel triangle -->
    <polygon points="138,816 886,816 512,512" fill="${C}"/>
    <!-- Sand in top (horizontal lines cut into top triangle) -->
    <rect x="214" y="262" width="596" height="32" fill="${CUT}" opacity="0.62"/>
    <rect x="264" y="328" width="496" height="28" fill="${CUT}" opacity="0.50"/>
    <rect x="318" y="392" width="388" height="24" fill="${CUT}" opacity="0.38"/>
    <rect x="376" y="454" width="272" height="20" fill="${CUT}" opacity="0.28"/>
    <!-- Sand pile in bottom (small) -->
    <rect x="370" y="738" width="284" height="30" fill="${CUT}" opacity="0.58"/>
    <rect x="414" y="776" width="196" height="24" fill="${CUT}" opacity="0.44"/>
    <!-- Waist drip dot -->
    <circle cx="512" cy="528" r="18" fill="${C}"/>
  ` },

  // ── 12  DRAGON  ─────────────────────────────────────────────────────────────
  { id:12, name:'dragon', color:'#00ff88', defs:'', body: C => `
    <!-- Head circle -->
    <circle cx="512" cy="510" r="300" fill="${C}"/>
    <!-- Left horn -->
    <polygon points="310,252 254,88 390,220" fill="${C}"/>
    <!-- Right horn -->
    <polygon points="714,252 770,88 634,220" fill="${C}"/>
    <!-- Left eye socket (black) -->
    <circle cx="386" cy="436" r="72" fill="${CUT}"/>
    <!-- Left pupil slit (coloured) -->
    <ellipse cx="386" cy="436" rx="24" ry="50" fill="${C}"/>
    <!-- Right eye socket -->
    <circle cx="638" cy="436" r="72" fill="${CUT}"/>
    <!-- Right pupil slit -->
    <ellipse cx="638" cy="436" rx="24" ry="50" fill="${C}"/>
    <!-- Nostrils -->
    <ellipse cx="452" cy="574" rx="34" ry="22" fill="${CUT}" transform="rotate(-20 452 574)"/>
    <ellipse cx="572" cy="574" rx="34" ry="22" fill="${CUT}" transform="rotate(20 572 574)"/>
    <!-- Mouth slit (black bar) -->
    <rect x="330" y="632" width="364" height="44" rx="22" fill="${CUT}"/>
    <!-- Teeth (triangles in mouth area — coloured, pointing down) -->
    <polygon points="342,632 360,676 378,632" fill="${C}"/>
    <polygon points="390,632 408,676 426,632" fill="${C}"/>
    <polygon points="438,632 456,676 474,632" fill="${C}"/>
    <polygon points="486,632 504,676 522,632" fill="${C}"/>
    <polygon points="534,632 552,676 570,632" fill="${C}"/>
    <polygon points="582,632 600,676 618,632" fill="${C}"/>
    <polygon points="630,632 648,676 666,632" fill="${C}"/>
    <!-- Chin/jaw extension -->
    <ellipse cx="512" cy="700" rx="186" ry="96" fill="${C}"/>
  ` },

  // ── 13  POKER CHIP  ─────────────────────────────────────────────────────────
  { id:13, name:'poker_chip', color:'#bf5fff', defs:'', body: C => `
    <!-- Outer disc -->
    <circle cx="${CX}" cy="${CY}" r="428" fill="${C}"/>
    <!-- Outer edge ring (cut to show edge detail) -->
    <circle cx="${CX}" cy="${CY}" r="368" fill="${CUT}"/>
    <!-- 4 stripe tabs at cardinal points -->
    <rect x="476" y="84"  width="72" height="152" rx="16" fill="${C}"/>
    <rect x="476" y="788" width="72" height="152" rx="16" fill="${C}"/>
    <rect x="84"  y="476" width="152" height="72"  rx="16" fill="${C}"/>
    <rect x="788" y="476" width="152" height="72"  rx="16" fill="${C}"/>
    <!-- Inner disc (main face) -->
    <circle cx="${CX}" cy="${CY}" r="284" fill="${C}"/>
    <!-- Inner ring cutout -->
    <circle cx="${CX}" cy="${CY}" r="220" fill="${CUT}"/>
    <!-- Centre circle -->
    <circle cx="${CX}" cy="${CY}" r="136" fill="${C}"/>
    <!-- Centre dot -->
    <circle cx="${CX}" cy="${CY}" r="46"  fill="${CUT}"/>
    <!-- Cross lines inside centre ring (subtle decorative) -->
    <rect x="499" y="297" width="26" height="204" fill="${CUT}" opacity="0.4"/>
    <rect x="297" y="499" width="204" height="26"  fill="${CUT}" opacity="0.4"/>
  ` },

  // ── 14  CHAMPAGNE  ──────────────────────────────────────────────────────────
  { id:14, name:'champagne', color:'#ffaa00', defs:'', body: C => `
    <!-- Flute bowl (trapezoid: narrower at bottom, wider at top) -->
    <polygon points="428,758 596,758 634,188 390,188" fill="${C}"/>
    <!-- Rim (top bar) -->
    <rect x="374" y="174" width="276" height="56" rx="26" fill="${C}"/>
    <!-- Stem -->
    <rect x="491" y="756" width="42" height="136" rx="20" fill="${C}"/>
    <!-- Base -->
    <rect x="348" y="890" width="328" height="56" rx="26" fill="${C}"/>
    <!-- Bubbles (black circles inside bowl, spaced vertically) -->
    <circle cx="468" cy="668" r="30" fill="${CUT}" opacity="0.7"/>
    <circle cx="540" cy="570" r="30" fill="${CUT}" opacity="0.7"/>
    <circle cx="492" cy="472" r="28" fill="${CUT}" opacity="0.65"/>
    <circle cx="556" cy="376" r="26" fill="${CUT}" opacity="0.60"/>
    <circle cx="502" cy="288" r="24" fill="${CUT}" opacity="0.55"/>
  ` },

  // ── 15  MOON  ───────────────────────────────────────────────────────────────
  { id:15, name:'moon', color:'#a855f7', defs:`
    <mask id="crescent">
      <circle cx="${CX}" cy="${CY}" r="368" fill="white"/>
      <circle cx="648" cy="480" r="306" fill="black"/>
    </mask>
  `, body: C => `
    <!-- Crescent shape -->
    <circle cx="${CX}" cy="${CY}" r="368" fill="${C}" mask="url(#crescent)"/>
    <!-- Stars (simple filled circles) -->
    <circle cx="774" cy="188" r="34" fill="${C}"/>
    <circle cx="806" cy="340" r="24" fill="${C}"/>
    <circle cx="830" cy="520" r="19" fill="${C}"/>
    <circle cx="784" cy="668" r="26" fill="${C}"/>
    <circle cx="694" cy="790" r="16" fill="${C}"/>
    <!-- Star sparkle cross shapes -->
    <rect x="760" y="177" width="28" height="22" fill="${C}" transform="rotate(45 774 188)"/>
    <rect x="792" y="329" width="22" height="18" fill="${C}" transform="rotate(45 803 338)"/>
  ` },

];

// ── Generate ──────────────────────────────────────────────────────────────────

async function generate() {
  let ok = 0, fail = 0;
  for (const av of AVATARS) {
    const svgStr = wrap(av.defs, av.body(av.color));
    const buf    = Buffer.from(svgStr, 'utf8');
    try {
      await sharp(buf, { density: 144 })
        .resize(SIZE, SIZE)
        .png({ compressionLevel: 8 })
        .toFile(`${OUT}/${av.name}.png`);

      await sharp(buf, { density: 144 })
        .resize(SIZE, SIZE)
        .png({ compressionLevel: 8 })
        .toFile(`${OUT}/avatar_${av.id}.png`);

      console.log(`✓  ${String(av.id).padStart(2)} ${av.name.padEnd(14)} → ${av.name}.png + avatar_${av.id}.png`);
      ok++;
    } catch(e) {
      console.error(`✗  ${av.name}: ${e.message}`);
      fail++;
    }
  }
  console.log(`\nDone — ${ok} generated, ${fail} failed.`);
}

generate();
