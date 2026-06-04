/**
 * generate-avatars.mjs  —  CHIP SOCIETY neon avatar PNGs
 *
 * Art direction: LUXURY NEON CASINO COLLECTIBLES.
 * Think PokerStars / GTA Online Casino / Cyberpunk / Miami Vice.
 * NOT emoji, NOT cartoon, NOT clip art.
 *
 * Technique: mix of outline shapes (filled + CUT interior = neon tube),
 * precise proportions, strong silhouettes, controlled glow.
 * CUT (black) appears transparent against the dark component background.
 *
 * Run: node scripts/generate-avatars.mjs
 */

import sharp from 'sharp';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT  = resolve(__dirname, '..', 'artifacts', 'neon-river', 'assets', 'avatars');
const SIZE = 1024;
const CX = 512, CY = 512;
const BG  = 'transparent';
const CUT = '#000000';   // "transparent" — matches component dark background

// ── SVG wrapper with enhanced neon glow filter ─────────────────────────────

function wrap(defs, body) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <filter id="g" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="18" result="b1"/>
      <feGaussianBlur stdDeviation="6"  result="b2"/>
      <feMerge>
        <feMergeNode in="b1"/>
        <feMergeNode in="b1"/>
        <feMergeNode in="b2"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    ${defs || ''}
  </defs>
  <g filter="url(#g)">${body}</g>
</svg>`;
}

// ── 15 avatar definitions ──────────────────────────────────────────────────

const AVATARS = [

  // ── 1  MARTINI  ── thin elegant outline glass, neon-sign quality ──────────
  { id:1, name:'martini', color:'#00d4ff', defs:'', body: C => `
    <!-- Bowl: outer triangle filled, inner slightly smaller = thin wall -->
    <polygon points="164,184 860,184 512,686" fill="${C}"/>
    <polygon points="210,222 814,222 512,660" fill="${CUT}"/>
    <!-- Stem: hair-thin -->
    <rect x="505" y="684" width="14" height="166" rx="7" fill="${C}"/>
    <!-- Base: single thin bar -->
    <rect x="344" y="848" width="336" height="30" rx="15" fill="${C}"/>
    <!-- Olive pick: precise thin line -->
    <rect x="228" y="368" width="568" height="13" rx="6" fill="${C}"/>
    <!-- Olive: hollow ring on pick -->
    <circle cx="512" cy="374" r="56" fill="${C}"/>
    <circle cx="512" cy="374" r="30" fill="${CUT}"/>
    <circle cx="512" cy="374" r="11" fill="${C}"/>
    <!-- Rim accent: tiny dots at bowl top corners -->
    <circle cx="193"  cy="188" r="13" fill="${C}"/>
    <circle cx="831" cy="188" r="13" fill="${C}"/>
  `},

  // ── 2  PALM  ── elegant Miami palm, proper curved frond paths ─────────────
  { id:2, name:'palm', color:'#ff0090', defs:'', body: C => `
    <!-- Trunk: tapered elegant form, slight S-curve -->
    <path d="M487,876 C480,726 477,566 483,402 C487,320 491,252 494,210
             L530,210 C533,252 537,320 541,402 C547,566 544,726 537,876 Z"
          fill="${C}"/>
    <!-- Crown node -->
    <circle cx="512" cy="214" r="38" fill="${C}"/>
    <!-- Frond 1: arcs up-left (true bezier taper) -->
    <path d="M512,214 C498,148 470,92 396,52
             C436,94 470,150 512,218 Z" fill="${C}"/>
    <!-- Frond 2: arcs up-right -->
    <path d="M512,214 C526,148 554,92 628,52
             C588,94 554,150 512,218 Z" fill="${C}"/>
    <!-- Frond 3: sweeps left-wide -->
    <path d="M504,230 C454,190 380,164 252,158
             C332,168 392,208 504,272 Z" fill="${C}"/>
    <!-- Frond 4: sweeps right-wide -->
    <path d="M520,230 C570,190 644,164 772,158
             C692,168 632,208 520,272 Z" fill="${C}"/>
    <!-- Frond 5: droops lower-left -->
    <path d="M498,258 C442,242 358,256 230,320
             C314,282 394,280 498,312 Z" fill="${C}"/>
    <!-- Frond 6: droops lower-right -->
    <path d="M526,258 C582,242 666,256 794,320
             C710,282 630,280 526,312 Z" fill="${C}"/>
  `},

  // ── 3  DICE  ── premium 3D isometric casino die ───────────────────────────
  { id:3, name:'dice_stack', color:'#8b5cf6', defs:'', body: C => `
    <!-- Three-face isometric die: top (bright) / right (mid) / left (shadow) -->

    <!-- LEFT FACE — shadow side -->
    <polygon points="232,340 512,500 512,820 232,660" fill="${C}" opacity="0.52"/>

    <!-- RIGHT FACE — lit side -->
    <polygon points="792,340 512,500 512,820 792,660" fill="${C}" opacity="0.76"/>

    <!-- TOP FACE — fully lit -->
    <polygon points="512,180 792,340 512,500 232,340" fill="${C}"/>

    <!-- Sharp edge lines for 3D definition -->
    <line x1="512" y1="180" x2="512" y2="500" stroke="${C}" stroke-width="9" opacity="0.35"/>
    <line x1="512" y1="500" x2="232" y2="660" stroke="${C}" stroke-width="7" opacity="0.28"/>
    <line x1="512" y1="500" x2="792" y2="660" stroke="${C}" stroke-width="7" opacity="0.28"/>
    <line x1="512" y1="500" x2="512" y2="820" stroke="${C}" stroke-width="7" opacity="0.22"/>

    <!-- TOP FACE PIPS: 2 pips (diagonal across face) -->
    <!-- Pip positions mapped to iso top face -->
    <circle cx="406" cy="362" r="28" fill="${CUT}"/>
    <circle cx="618" cy="438" r="28" fill="${CUT}"/>

    <!-- RIGHT FACE PIPS: 5 (quincunx) -->
    <circle cx="648" cy="408" r="22" fill="${CUT}" opacity="0.85"/>
    <circle cx="736" cy="408" r="22" fill="${CUT}" opacity="0.85"/>
    <circle cx="692" cy="516" r="22" fill="${CUT}" opacity="0.85"/>
    <circle cx="648" cy="624" r="22" fill="${CUT}" opacity="0.85"/>
    <circle cx="736" cy="624" r="22" fill="${CUT}" opacity="0.85"/>

    <!-- LEFT FACE PIPS: 3 (diagonal) -->
    <circle cx="364" cy="410" r="20" fill="${CUT}" opacity="0.70"/>
    <circle cx="372" cy="526" r="20" fill="${CUT}" opacity="0.70"/>
    <circle cx="360" cy="642" r="20" fill="${CUT}" opacity="0.70"/>

    <!-- Corner vertex accents -->
    <circle cx="512" cy="180" r="14" fill="${C}"/>
    <circle cx="792" cy="340" r="14" fill="${C}"/>
    <circle cx="232" cy="340" r="14" fill="${C}"/>
    <circle cx="512" cy="820" r="14" fill="${C}"/>
  `},

  // ── 4  CASSETTE  ── refined 80s synthwave cassette ────────────────────────
  { id:4, name:'cassette', color:'#00d4ff', defs:'', body: C => `
    <!-- Body: outline rectangle (filled + cut interior) -->
    <rect x="134" y="298" width="756" height="428" rx="58" fill="${C}"/>
    <rect x="160" y="324" width="704" height="376" rx="44" fill="${CUT}"/>
    <!-- Label strip (bottom portion, filled) -->
    <rect x="164" y="494" width="696" height="176" rx="22" fill="${C}"/>
    <!-- Left spool assembly -->
    <circle cx="360" cy="466" r="150" fill="${C}"/>
    <circle cx="360" cy="466" r="114" fill="${CUT}"/>
    <circle cx="360" cy="466" r="60"  fill="${C}"/>
    <circle cx="360" cy="466" r="26"  fill="${CUT}"/>
    <!-- Right spool assembly -->
    <circle cx="664" cy="466" r="150" fill="${C}"/>
    <circle cx="664" cy="466" r="114" fill="${CUT}"/>
    <circle cx="664" cy="466" r="60"  fill="${C}"/>
    <circle cx="664" cy="466" r="26"  fill="${CUT}"/>
    <!-- Tape window slot -->
    <rect x="462" y="550" width="100" height="52" rx="16" fill="${CUT}"/>
    <!-- Corner screws -->
    <circle cx="186" cy="330" r="22" fill="${CUT}" opacity="0.62"/>
    <circle cx="838" cy="330" r="22" fill="${CUT}" opacity="0.62"/>
    <circle cx="186" cy="674" r="22" fill="${CUT}" opacity="0.62"/>
    <circle cx="838" cy="674" r="22" fill="${CUT}" opacity="0.62"/>
    <!-- Label decorative rule lines -->
    <rect x="210" y="534" width="604" height="10" rx="5" fill="${CUT}" opacity="0.38"/>
    <rect x="210" y="562" width="604" height="8"  rx="4" fill="${CUT}" opacity="0.26"/>
    <!-- Spool spoke marks on hub -->
    <rect x="342" y="457" width="36" height="18" rx="6" fill="${CUT}" opacity="0.48"/>
    <rect x="646" y="457" width="36" height="18" rx="6" fill="${CUT}" opacity="0.48"/>
  `},

  // ── 5  SATURN  ── elegant planet with thin glowing ring ───────────────────
  { id:5, name:'saturn', color:'#a855f7', defs:`
    <clipPath id="rb"><rect x="0" y="512" width="1024" height="512"/></clipPath>
    <clipPath id="rf"><rect x="0" y="0"   width="1024" height="512"/></clipPath>
  `, body: C => `
    <!-- Ring arc (behind planet — lower half) -->
    <ellipse cx="${CX}" cy="${CY}" rx="456" ry="106" fill="none"
             stroke="${C}" stroke-width="46" clip-path="url(#rb)"
             transform="rotate(-14 ${CX} ${CY})"/>
    <!-- Thin inner ring accent (behind) -->
    <ellipse cx="${CX}" cy="${CY}" rx="372" ry="84" fill="none"
             stroke="${C}" stroke-width="14" opacity="0.42" clip-path="url(#rb)"
             transform="rotate(-14 ${CX} ${CY})"/>
    <!-- Planet body -->
    <circle cx="${CX}" cy="${CY}" r="242" fill="${C}"/>
    <!-- Subtle equatorial band -->
    <ellipse cx="${CX}" cy="${CY}" rx="242" ry="52" fill="${CUT}" opacity="0.17"/>
    <!-- Northern latitude stripe (subtle) -->
    <ellipse cx="${CX}" cy="440" rx="220" ry="26" fill="${CUT}" opacity="0.10"/>
    <!-- Ring arc (in front of planet — upper half) -->
    <ellipse cx="${CX}" cy="${CY}" rx="456" ry="106" fill="none"
             stroke="${C}" stroke-width="46" clip-path="url(#rf)"
             transform="rotate(-14 ${CX} ${CY})"/>
    <ellipse cx="${CX}" cy="${CY}" rx="372" ry="84" fill="none"
             stroke="${C}" stroke-width="14" opacity="0.42" clip-path="url(#rf)"
             transform="rotate(-14 ${CX} ${CY})"/>
  `},

  // ── 6  VINYL  ── premium vinyl record ─────────────────────────────────────
  { id:6, name:'vinyl', color:'#ff1a6e', defs:'', body: C => `
    <!-- Outer disc ring (neon tube edge) -->
    <circle cx="${CX}" cy="${CY}" r="420" fill="none" stroke="${C}" stroke-width="54"/>
    <!-- Groove rings (progressively subtle) -->
    <circle cx="${CX}" cy="${CY}" r="362" fill="none" stroke="${C}" stroke-width="11" opacity="0.36"/>
    <circle cx="${CX}" cy="${CY}" r="314" fill="none" stroke="${C}" stroke-width="10" opacity="0.29"/>
    <circle cx="${CX}" cy="${CY}" r="268" fill="none" stroke="${C}" stroke-width="9"  opacity="0.23"/>
    <!-- Label disc (solid fill) -->
    <circle cx="${CX}" cy="${CY}" r="216" fill="${C}"/>
    <!-- Label concentric detail rings -->
    <circle cx="${CX}" cy="${CY}" r="194" fill="none" stroke="${CUT}" stroke-width="9" opacity="0.44"/>
    <circle cx="${CX}" cy="${CY}" r="178" fill="none" stroke="${CUT}" stroke-width="5" opacity="0.24"/>
    <!-- Spindle hole -->
    <circle cx="${CX}" cy="${CY}" r="41"  fill="${CUT}"/>
    <!-- Label shine highlight -->
    <ellipse cx="458" cy="432" rx="23" ry="52" fill="${CUT}" opacity="0.27"
             transform="rotate(-30 458 432)"/>
    <!-- A-side indicator -->
    <circle cx="${CX}" cy="312" r="15" fill="${CUT}" opacity="0.52"/>
  `},

  // ── 7  CHERRY  ── bold twin cherries with elegant stems ───────────────────
  { id:7, name:'cherry', color:'#ff3344', defs:'', body: C => `
    <!-- Left cherry -->
    <circle cx="300" cy="660" r="162" fill="${C}"/>
    <!-- Right cherry -->
    <circle cx="638" cy="654" r="162" fill="${C}"/>
    <!-- Stems: smooth curved paths -->
    <path d="M300,498 C308,422 360,358 512,304"
          stroke="${C}" stroke-width="50" fill="none" stroke-linecap="round"/>
    <path d="M638,492 C629,418 578,358 512,304"
          stroke="${C}" stroke-width="50" fill="none" stroke-linecap="round"/>
    <!-- Leaf (elegant rotated ellipse) -->
    <ellipse cx="452" cy="268" rx="98" ry="44" fill="${C}" transform="rotate(-36 452 268)"/>
    <!-- Shine highlights (CUT circles inside each cherry) -->
    <circle cx="262" cy="618" r="40" fill="${CUT}" opacity="0.34"/>
    <circle cx="598" cy="612" r="40" fill="${CUT}" opacity="0.34"/>
    <!-- Stem junction dot -->
    <circle cx="512" cy="304" r="22" fill="${C}"/>
  `},

  // ── 8  FLAMINGO  ── neon lounge-sign flamingo: thin elegant proportions ───
  { id:8, name:'flamingo', color:'#ff69b4', defs:'', body: C => `
    <!-- Long standing leg (thin, elegant) -->
    <path d="M544,876 L536,676 L518,576"
          stroke="${C}" stroke-width="30" fill="none" stroke-linecap="round"/>
    <!-- Foot: splayed toes -->
    <line x1="536" y1="876" x2="440" y2="916" stroke="${C}" stroke-width="22" stroke-linecap="round"/>
    <line x1="536" y1="876" x2="536" y2="924" stroke="${C}" stroke-width="22" stroke-linecap="round"/>
    <line x1="536" y1="876" x2="632" y2="914" stroke="${C}" stroke-width="22" stroke-linecap="round"/>
    <!-- Tucked leg -->
    <path d="M576,568 C598,610 614,646 614,654"
          stroke="${C}" stroke-width="22" fill="none" stroke-linecap="round"/>
    <!-- Body: compact elegant oval -->
    <ellipse cx="540" cy="448" rx="198" ry="136" fill="${C}" transform="rotate(-20 540 448)"/>
    <!-- Wing feather shadow line -->
    <ellipse cx="572" cy="438" rx="136" ry="78" fill="${CUT}" opacity="0.16" transform="rotate(-16 572 438)"/>
    <!-- Neck: thin elegant S-curve -->
    <path d="M408,352 C378,298 330,248 280,194"
          stroke="${C}" stroke-width="70" fill="none" stroke-linecap="round"/>
    <!-- Neck inner (creates tube / neon look) -->
    <path d="M408,352 C378,298 330,248 280,194"
          stroke="${CUT}" stroke-width="24" fill="none" stroke-linecap="round" opacity="0.26"/>
    <!-- Head -->
    <circle cx="266" cy="174" r="82" fill="${C}"/>
    <!-- Eye: precise -->
    <circle cx="290" cy="158" r="32" fill="${CUT}"/>
    <circle cx="290" cy="158" r="13" fill="${C}"/>
    <!-- Beak: thin hooked path -->
    <path d="M212,194 C174,232 162,278 182,312"
          stroke="${C}" stroke-width="44" fill="none" stroke-linecap="round"/>
    <circle cx="182" cy="312" r="25" fill="${C}"/>
  `},

  // ── 9  SUNSET  ── retro synthwave grid perspective ────────────────────────
  { id:9, name:'sunset', color:'#ff6b35', defs:'', body: C => `
    <!-- Sun: bold semicircle (hollow ring for neon tube look) -->
    <path d="M106,546 A406,406 0 0,1 918,546 Z" fill="${C}"/>
    <path d="M162,546 A350,350 0 0,1 862,546 Z" fill="${CUT}" opacity="0.20"/>
    <!-- Horizon line -->
    <rect x="94" y="528" width="836" height="50" rx="0" fill="${C}"/>
    <!-- Perspective grid lines converging to vanishing point (512, 556) -->
    <polygon points="94,780  512,556 286,780"  fill="${C}" opacity="0.72"/>
    <polygon points="930,780 512,556 738,780"  fill="${C}" opacity="0.72"/>
    <polygon points="94,908  512,556 160,908"  fill="${C}" opacity="0.48"/>
    <polygon points="930,908 512,556 864,908"  fill="${C}" opacity="0.48"/>
    <!-- Horizontal grid bars -->
    <rect x="108" y="638" width="808" height="36" fill="${C}" opacity="0.58"/>
    <rect x="130" y="716" width="764" height="32" fill="${C}" opacity="0.42"/>
    <rect x="156" y="792" width="712" height="28" fill="${C}" opacity="0.30"/>
    <rect x="182" y="862" width="660" height="24" fill="${C}" opacity="0.20"/>
  `},

  // ── 10  ACE  ── premium playing card ──────────────────────────────────────
  { id:10, name:'ace', color:'#ffd700', defs:'', body: C => `
    <!-- Card body: outline style (filled + cut interior = thin border) -->
    <rect x="264" y="136" width="496" height="752" rx="74" fill="${C}"/>
    <rect x="298" y="170" width="428" height="684" rx="60" fill="${CUT}"/>
    <!-- Large A glyph (solid, readable) -->
    <polygon points="372,772 512,232 652,772 608,772 512,302 416,772" fill="${C}"/>
    <!-- A crossbar (horizontal bar through middle of A) -->
    <rect x="438" y="570" width="148" height="50" fill="${C}"/>
    <!-- Crossbar inner cut (A gap) -->
    <rect x="456" y="578" width="112" height="34" fill="${CUT}"/>
    <!-- Top-left corner spade mark -->
    <circle cx="322" cy="198" r="17" fill="${C}"/>
    <circle cx="334" cy="198" r="17" fill="${C}"/>
    <rect x="322" y="196" width="30" height="26" rx="0" fill="${C}"/>
    <polygon points="328,222 342,242 316,242" fill="${C}"/>
    <!-- Bottom-right corner (rotated 180°) -->
    <circle cx="690" cy="826" r="17" fill="${C}"/>
    <circle cx="702" cy="826" r="17" fill="${C}"/>
    <rect x="672" y="806" width="30" height="26" rx="0" fill="${C}"/>
    <polygon points="696,806 710,786 684,786" fill="${C}"/>
    <!-- Centre spade suit below A (large, premium) -->
    <circle cx="472" cy="842" r="42" fill="${C}"/>
    <circle cx="552" cy="842" r="42" fill="${C}"/>
    <polygon points="512,776 556,850 468,850" fill="${C}"/>
    <rect x="503" y="876" width="18" height="28" fill="${C}"/>
    <rect x="482" y="902" width="60" height="14" rx="7" fill="${C}"/>
  `},

  // ── 11  HOURGLASS  ── elegant sand timer ──────────────────────────────────
  { id:11, name:'hourglass', color:'#bf5fff', defs:'', body: C => `
    <!-- Top cap bar -->
    <rect x="128" y="128" width="768" height="70" rx="35" fill="${C}"/>
    <!-- Bottom cap bar -->
    <rect x="128" y="826" width="768" height="70" rx="35" fill="${C}"/>
    <!-- Top funnel (filled) -->
    <polygon points="128,198 896,198 512,512" fill="${C}"/>
    <!-- Top funnel interior (outline effect) -->
    <polygon points="182,218 842,218 512,498" fill="${CUT}" opacity="0.90"/>
    <!-- Bottom funnel (filled) -->
    <polygon points="128,826 896,826 512,512" fill="${C}"/>
    <!-- Bottom funnel interior -->
    <polygon points="182,806 842,806 512,526" fill="${CUT}" opacity="0.90"/>
    <!-- Remaining sand in top (horizontal slices getting smaller) -->
    <rect x="370" y="428" width="276" height="26" rx="13" fill="${C}" opacity="0.74"/>
    <rect x="408" y="462" width="200" height="22" rx="11" fill="${C}" opacity="0.58"/>
    <rect x="448" y="494" width="120" height="18" rx="9"  fill="${C}" opacity="0.42"/>
    <!-- Sand pile in bottom (cone + flat base) -->
    <polygon points="366,734 512,526 658,734" fill="${C}" opacity="0.66"/>
    <rect x="348" y="730" width="328" height="36" rx="18" fill="${C}" opacity="0.74"/>
    <rect x="386" y="762" width="252" height="30" rx="15" fill="${C}" opacity="0.56"/>
    <!-- Waist thread dot -->
    <circle cx="512" cy="512" r="14" fill="${C}"/>
  `},

  // ── 12  DRAGON  ── aggressive side-profile: sharp horns, slit eye ─────────
  { id:12, name:'dragon', color:'#00ff88', defs:'', body: C => `
    <!-- Main skull mass — elongated, angular (not round) -->
    <ellipse cx="444" cy="446" rx="248" ry="214" fill="${C}"/>

    <!-- Elongated upper jaw / snout (right-facing) -->
    <path d="M652,390 C734,370 812,382 876,418 L876,454 C812,438 732,442 654,446 Z"
          fill="${C}"/>

    <!-- Lower jaw (slightly offset below) -->
    <path d="M642,452 C728,450 812,464 878,494 L878,458 C814,436 730,434 646,436 Z"
          fill="${C}" opacity="0.94"/>

    <!-- Prominent back horn (tall, tapered) -->
    <polygon points="286,292 258,80 362,264" fill="${C}"/>
    <!-- Front horn -->
    <polygon points="376,258 354,68 446,238" fill="${C}"/>

    <!-- Crest spines along skull top -->
    <polygon points="306,278 295,176 342,264" fill="${C}"/>
    <polygon points="350,248 342,148 388,236" fill="${C}"/>
    <polygon points="396,230 392,134 432,220" fill="${C}"/>

    <!-- Brow ridge (sharp angular line) -->
    <path d="M326,358 C356,312 402,298 458,308"
          stroke="${C}" stroke-width="28" fill="none" stroke-linecap="round"/>

    <!-- Eye socket (angular ellipse) -->
    <ellipse cx="408" cy="400" rx="80" ry="60" fill="${CUT}"/>
    <!-- Vertical slit pupil -->
    <ellipse cx="408" cy="400" rx="20" ry="54" fill="${C}"/>

    <!-- Nostril -->
    <ellipse cx="826" cy="420" rx="20" ry="13" fill="${CUT}" transform="rotate(-8 826 420)"/>

    <!-- Upper teeth (sharp triangles along snout bottom) -->
    <polygon points="700,448 718,496 736,448" fill="${C}"/>
    <polygon points="742,446 760,494 778,446" fill="${C}"/>
    <polygon points="784,440 802,488 820,440" fill="${C}"/>
    <polygon points="826,432 844,478 862,432" fill="${C}"/>

    <!-- Neck / throat scales (tapering chain) -->
    <ellipse cx="254" cy="582" rx="100" ry="68" fill="${C}"/>
    <ellipse cx="208" cy="672" rx="76"  ry="54" fill="${C}"/>
    <ellipse cx="178" cy="752" rx="58"  ry="44" fill="${C}"/>

    <!-- Scale texture line on neck -->
    <path d="M358,658 C316,706 286,756 272,808"
          stroke="${CUT}" stroke-width="14" fill="none" opacity="0.28"/>
  `},

  // ── 13  POKER CHIP  ── intricate 8-notch premium chip ─────────────────────
  { id:13, name:'poker_chip', color:'#bf5fff', defs:'', body: C => `
    <!-- Outer disc -->
    <circle cx="${CX}" cy="${CY}" r="434" fill="${C}"/>
    <!-- Outer edge ring cut -->
    <circle cx="${CX}" cy="${CY}" r="376" fill="${CUT}"/>
    <!-- 8 edge notch tabs (cardinal + diagonal) -->
    <rect x="476" y="82"  width="72" height="138" rx="14" fill="${C}"/>
    <rect x="476" y="804" width="72" height="138" rx="14" fill="${C}"/>
    <rect x="82"  y="476" width="138" height="72"  rx="14" fill="${C}"/>
    <rect x="804" y="476" width="138" height="72"  rx="14" fill="${C}"/>
    <!-- 45° tabs (rotated rects) -->
    <rect x="176" y="170" width="124" height="54" rx="14" fill="${C}" transform="rotate(45 238 197)"/>
    <rect x="724" y="170" width="124" height="54" rx="14" fill="${C}" transform="rotate(-45 786 197)"/>
    <rect x="176" y="800" width="124" height="54" rx="14" fill="${C}" transform="rotate(-45 238 827)"/>
    <rect x="724" y="800" width="124" height="54" rx="14" fill="${C}" transform="rotate(45 786 827)"/>
    <!-- Inner playing surface -->
    <circle cx="${CX}" cy="${CY}" r="292" fill="${C}"/>
    <!-- Inner ring channel -->
    <circle cx="${CX}" cy="${CY}" r="234" fill="${CUT}"/>
    <!-- Second inner ring accent -->
    <circle cx="${CX}" cy="${CY}" r="218" fill="${C}" opacity="0.28"/>
    <!-- Centre face -->
    <circle cx="${CX}" cy="${CY}" r="144" fill="${C}"/>
    <!-- Centre hole -->
    <circle cx="${CX}" cy="${CY}" r="52"  fill="${CUT}"/>
    <!-- Cross hairlines (decorative) -->
    <rect x="500" y="296" width="24" height="218" rx="6" fill="${CUT}" opacity="0.32"/>
    <rect x="296" y="500" width="218" height="24" rx="6" fill="${CUT}" opacity="0.32"/>
    <!-- Diagonal hairlines at 45° -->
    <rect x="500" y="296" width="24" height="218" rx="6" fill="${CUT}" opacity="0.18"
          transform="rotate(45 512 512)"/>
    <rect x="296" y="500" width="218" height="24" rx="6" fill="${CUT}" opacity="0.18"
          transform="rotate(45 512 512)"/>
  `},

  // ── 14  CHAMPAGNE  ── slender luxury flute, VIP Vegas energy ──────────────
  { id:14, name:'champagne', color:'#ffaa00', defs:'', body: C => `
    <!-- Ultra-slender flute bowl: thin walls via fill+cut -->
    <polygon points="450,756 574,756 626,158 398,158" fill="${C}"/>
    <polygon points="468,740 556,740 606,188 418,188" fill="${CUT}"/>
    <!-- Rim bar -->
    <rect x="392" y="146" width="240" height="42" rx="21" fill="${C}"/>
    <!-- Bubble chains (visible inside glass, elegant column) -->
    <circle cx="476" cy="670" r="15" fill="${C}"/>
    <circle cx="490" cy="564" r="14" fill="${C}"/>
    <circle cx="476" cy="460" r="13" fill="${C}"/>
    <circle cx="488" cy="360" r="12" fill="${C}"/>
    <circle cx="475" cy="264" r="11" fill="${C}"/>
    <circle cx="548" cy="622" r="14" fill="${C}"/>
    <circle cx="534" cy="518" r="13" fill="${C}"/>
    <circle cx="548" cy="416" r="12" fill="${C}"/>
    <circle cx="536" cy="316" r="11" fill="${C}"/>
    <!-- Hair-thin stem -->
    <rect x="505" y="754" width="14" height="144" rx="7" fill="${C}"/>
    <!-- Base: two-tier elegant foot -->
    <rect x="396" y="896" width="232" height="26" rx="13" fill="${C}"/>
    <rect x="430" y="874" width="164" height="24" rx="12" fill="${C}"/>
    <!-- Champagne fizz splash above rim (bubbles escaping upward) -->
    <circle cx="512" cy="118" r="26" fill="${C}"/>
    <circle cx="470" cy="100" r="18" fill="${C}"/>
    <circle cx="554" cy="102" r="18" fill="${C}"/>
    <circle cx="438" cy="84"  r="13" fill="${C}"/>
    <circle cx="586" cy="86"  r="13" fill="${C}"/>
    <circle cx="414" cy="70"  r="9"  fill="${C}"/>
    <circle cx="610" cy="72"  r="9"  fill="${C}"/>
    <circle cx="494" cy="76"  r="9"  fill="${C}"/>
    <circle cx="530" cy="74"  r="9"  fill="${C}"/>
  `},

  // ── 15  MOON  ── premium crescent with 4-point diamond stars ──────────────
  { id:15, name:'moon', color:'#a855f7', defs:`
    <mask id="crescent">
      <circle cx="${CX}" cy="${CY}" r="382" fill="white"/>
      <circle cx="672"  cy="482"  r="320" fill="black"/>
    </mask>
  `, body: C => `
    <!-- Crescent body -->
    <circle cx="${CX}" cy="${CY}" r="382" fill="${C}" mask="url(#crescent)"/>
    <!-- 4-point diamond stars (elegant, premium — not plain circles) -->
    <!-- Large star -->
    <polygon points="796,164 812,198 846,214 812,230 796,264 780,230 746,214 780,198"
             fill="${C}"/>
    <!-- Medium star -->
    <polygon points="844,356 857,382 883,395 857,408 844,434 831,408 805,395 831,382"
             fill="${C}"/>
    <!-- Small star -->
    <polygon points="868,528 878,549 899,559 878,569 868,590 858,569 837,559 858,549"
             fill="${C}"/>
    <!-- Small star -->
    <polygon points="814,688 824,709 845,719 824,729 814,750 804,729 783,719 804,709"
             fill="${C}"/>
    <!-- Tiny star -->
    <polygon points="718,810 726,826 742,834 726,842 718,858 710,842 694,834 710,826"
             fill="${C}"/>
    <!-- Accent micro-dots -->
    <circle cx="872" cy="256" r="11" fill="${C}"/>
    <circle cx="876" cy="446" r="9"  fill="${C}"/>
    <circle cx="848" cy="622" r="8"  fill="${C}"/>
  `},

];

// ── Generate PNGs ─────────────────────────────────────────────────────────────

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
