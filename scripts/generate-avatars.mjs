/**
 * generate-avatars.mjs
 * Generates 15 clean individual neon avatar PNG files using SVG + sharp.
 * Each avatar is a 512×512 PNG: black circular background, neon stroke icon, transparent corners.
 *
 * Run: node scripts/generate-avatars.mjs
 */

import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '..', 'artifacts', 'neon-river', 'assets', 'avatars');
const SIZE = 512;

// ── SVG builder ────────────────────────────────────────────────────────────────

function buildSVG(color, defs, elements) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="5" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    ${defs || ''}
  </defs>
  <!-- Black circular background -->
  <circle cx="256" cy="256" r="256" fill="#000000"/>
  <!-- Neon icon -->
  <g filter="url(#glow)" stroke="${color}" fill="none"
     stroke-linecap="round" stroke-linejoin="round">
    ${elements}
  </g>
</svg>`;
}

// ── All 15 avatar definitions ──────────────────────────────────────────────────

const AVATARS = [

  // 1 ── MARTINI ── cyan ───────────────────────────────────────────────────────
  {
    id: 1, name: 'martini', color: '#00d4ff',
    defs: '',
    svg: `
      <!-- Rim line -->
      <line x1="118" y1="165" x2="394" y2="165" stroke-width="15"/>
      <!-- Left edge of glass -->
      <line x1="118" y1="165" x2="256" y2="325" stroke-width="15"/>
      <!-- Right edge of glass -->
      <line x1="394" y1="165" x2="256" y2="325" stroke-width="15"/>
      <!-- Stem -->
      <line x1="256" y1="325" x2="256" y2="390" stroke-width="15"/>
      <!-- Base -->
      <line x1="190" y1="390" x2="322" y2="390" stroke-width="15"/>
      <!-- Olive pick stick -->
      <line x1="178" y1="200" x2="315" y2="198" stroke-width="8"/>
      <!-- Olive (filled circle) -->
      <circle cx="246" cy="199" r="22" fill="#00d4ff" stroke-width="0"/>
    `,
  },

  // 2 ── PALM ── hot pink ──────────────────────────────────────────────────────
  {
    id: 2, name: 'palm', color: '#ff0090',
    defs: '',
    svg: `
      <!-- Trunk (slightly curved) -->
      <path d="M256,400 C265,360 244,320 242,278 C240,236 252,206 252,170" stroke-width="17" fill="none"/>
      <!-- Frond 1: top-left -->
      <path d="M251,172 C232,152 193,146 168,155" stroke-width="13" fill="none"/>
      <!-- Frond 2: top-right -->
      <path d="M255,168 C270,143 306,133 332,140" stroke-width="13" fill="none"/>
      <!-- Frond 3: mid-left -->
      <path d="M247,188 C217,182 188,200 172,224" stroke-width="12" fill="none"/>
      <!-- Frond 4: mid-right -->
      <path d="M265,185 C292,177 322,194 340,218" stroke-width="12" fill="none"/>
      <!-- Frond 5: lower-left drooping -->
      <path d="M246,207 C224,226 214,255 220,282" stroke-width="11" fill="none"/>
      <!-- Coconuts cluster at crown -->
      <circle cx="256" cy="182" r="13" fill="#ff0090" stroke-width="0"/>
      <circle cx="240" cy="174" r="11" fill="#ff0090" stroke-width="0"/>
      <circle cx="270" cy="177" r="11" fill="#ff0090" stroke-width="0"/>
    `,
  },

  // 3 ── DICE STACK ── purple ──────────────────────────────────────────────────
  {
    id: 3, name: 'dice_stack', color: '#8b5cf6',
    defs: '',
    svg: `
      <!-- Back die (slightly offset top-right, lower opacity) -->
      <rect x="152" y="122" width="204" height="204" rx="28" stroke-width="10" opacity="0.65" transform="rotate(6 254 224)"/>
      <!-- Front die (lower) -->
      <rect x="156" y="186" width="204" height="204" rx="28" stroke-width="14" transform="rotate(-5 258 288)"/>
      <!-- Front die dots — 4-corner pattern -->
      <circle cx="210" cy="234" r="17" fill="#8b5cf6" stroke-width="0"/>
      <circle cx="304" cy="234" r="17" fill="#8b5cf6" stroke-width="0"/>
      <circle cx="210" cy="336" r="17" fill="#8b5cf6" stroke-width="0"/>
      <circle cx="304" cy="336" r="17" fill="#8b5cf6" stroke-width="0"/>
      <!-- Back die dots — 3-diagonal (visible above front die) -->
      <circle cx="236" cy="150" r="12" fill="#8b5cf6" stroke-width="0" opacity="0.7"/>
      <circle cx="278" cy="165" r="12" fill="#8b5cf6" stroke-width="0" opacity="0.7"/>
    `,
  },

  // 4 ── CASSETTE ── cyan ──────────────────────────────────────────────────────
  {
    id: 4, name: 'cassette', color: '#00d4ff',
    defs: '',
    svg: `
      <!-- Main body -->
      <rect x="92" y="172" width="328" height="210" rx="20" stroke-width="14"/>
      <!-- Tape window (inner rectangle) -->
      <rect x="122" y="200" width="268" height="148" rx="12" stroke-width="9"/>
      <!-- Left spool (outer ring) -->
      <circle cx="190" cy="274" r="48" stroke-width="11"/>
      <!-- Left spool (inner hub) -->
      <circle cx="190" cy="274" r="21" stroke-width="8"/>
      <!-- Right spool (outer ring) -->
      <circle cx="322" cy="274" r="48" stroke-width="11"/>
      <!-- Right spool (inner hub) -->
      <circle cx="322" cy="274" r="21" stroke-width="8"/>
      <!-- Tape bridge between spools -->
      <line x1="238" y1="322" x2="274" y2="322" stroke-width="9"/>
      <!-- Label area line -->
      <line x1="132" y1="358" x2="380" y2="358" stroke-width="7" opacity="0.6"/>
      <!-- Corner screws -->
      <circle cx="118" cy="192" r="9" fill="#00d4ff" stroke-width="0"/>
      <circle cx="394" cy="192" r="9" fill="#00d4ff" stroke-width="0"/>
      <circle cx="118" cy="372" r="9" fill="#00d4ff" stroke-width="0"/>
      <circle cx="394" cy="372" r="9" fill="#00d4ff" stroke-width="0"/>
    `,
  },

  // 5 ── SATURN ── violet ──────────────────────────────────────────────────────
  {
    id: 5, name: 'saturn', color: '#a855f7',
    defs: `
      <clipPath id="planetClip">
        <circle cx="256" cy="256" r="97"/>
      </clipPath>
    `,
    svg: `
      <!-- Ring behind planet (clipped to not show on top of planet) -->
      <ellipse cx="256" cy="256" rx="168" ry="50" stroke-width="14" transform="rotate(-18 256 256)"/>
      <!-- Planet body (filled black to occlude ring behind it) -->
      <circle cx="256" cy="256" r="97" fill="#000000" stroke-width="0"/>
      <!-- Planet outline -->
      <circle cx="256" cy="256" r="97" stroke-width="16"/>
      <!-- Subtle atmospheric bands -->
      <line x1="162" y1="240" x2="350" y2="240" stroke-width="6" opacity="0.35" clip-path="url(#planetClip)"/>
      <line x1="162" y1="270" x2="350" y2="270" stroke-width="6" opacity="0.35" clip-path="url(#planetClip)"/>
      <!-- Ring in front of planet (top half) -->
      <path d="M88,256 A168,50 -18 0,1 424,256" stroke-width="14" transform="rotate(-18 256 256)" fill="none"/>
    `,
  },

  // 6 ── VINYL ── hot pink ─────────────────────────────────────────────────────
  {
    id: 6, name: 'vinyl', color: '#ff1a6e',
    defs: '',
    svg: `
      <!-- Outer record edge -->
      <circle cx="256" cy="256" r="162" stroke-width="14"/>
      <!-- Groove rings -->
      <circle cx="256" cy="256" r="142" stroke-width="4" opacity="0.45"/>
      <circle cx="256" cy="256" r="122" stroke-width="4" opacity="0.45"/>
      <circle cx="256" cy="256" r="102" stroke-width="4" opacity="0.45"/>
      <!-- Label circle -->
      <circle cx="256" cy="256" r="70" stroke-width="13"/>
      <!-- Center hole -->
      <circle cx="256" cy="256" r="18" fill="#ff1a6e" stroke-width="0"/>
      <!-- Shine highlight -->
      <line x1="198" y1="162" x2="162" y2="140" stroke-width="7" opacity="0.4"/>
    `,
  },

  // 7 ── CHERRY ── red ─────────────────────────────────────────────────────────
  {
    id: 7, name: 'cherry', color: '#ff3344',
    defs: '',
    svg: `
      <!-- Left cherry -->
      <circle cx="200" cy="312" r="60" stroke-width="14"/>
      <!-- Right cherry -->
      <circle cx="305" cy="318" r="60" stroke-width="14"/>
      <!-- Left stem going up to join point -->
      <path d="M200,252 C206,212 240,194 252,172" stroke-width="13" fill="none"/>
      <!-- Right stem going up to join point -->
      <path d="M305,258 C298,218 268,196 252,172" stroke-width="13" fill="none"/>
      <!-- Leaf on stem -->
      <path d="M252,172 C238,150 205,154 204,172 C204,190 234,190 252,172 Z"
            fill="none" stroke-width="11"/>
      <!-- Shine dots on cherries -->
      <circle cx="182" cy="292" r="10" fill="#ff3344" stroke-width="0"/>
      <circle cx="288" cy="298" r="10" fill="#ff3344" stroke-width="0"/>
    `,
  },

  // 8 ── FLAMINGO ── pink ──────────────────────────────────────────────────────
  {
    id: 8, name: 'flamingo', color: '#ff69b4',
    defs: '',
    svg: `
      <!-- Body oval -->
      <ellipse cx="264" cy="230" rx="80" ry="60" stroke-width="14" transform="rotate(-12 264 230)"/>
      <!-- Neck: curves from body up-left -->
      <path d="M212,188 C190,162 174,142 172,122" stroke-width="14" fill="none"/>
      <!-- Head -->
      <circle cx="172" cy="105" r="28" stroke-width="14"/>
      <!-- Beak (bent downward) -->
      <path d="M157,115 C138,128 132,144 142,154" stroke-width="10" fill="none"/>
      <!-- Standing leg -->
      <line x1="258" y1="290" x2="250" y2="400" stroke-width="14"/>
      <!-- Foot toes -->
      <line x1="250" y1="400" x2="212" y2="414" stroke-width="10"/>
      <line x1="250" y1="400" x2="250" y2="418" stroke-width="10"/>
      <line x1="250" y1="400" x2="282" y2="412" stroke-width="10"/>
      <!-- Tucked leg (bent up) -->
      <path d="M 278,278 C288,318 310,340 310,340" stroke-width="10" fill="none"/>
      <!-- Eye -->
      <circle cx="180" cy="100" r="7" fill="#ff69b4" stroke-width="0"/>
    `,
  },

  // 9 ── SUNSET ── orange ──────────────────────────────────────────────────────
  {
    id: 9, name: 'sunset', color: '#ff6b35',
    defs: '',
    svg: `
      <!-- Sun (semicircle, sitting on horizon) -->
      <path d="M118,292 A138,138 0 0,1 394,292" stroke-width="16" fill="none"/>
      <!-- Inner sun rings (glow) -->
      <path d="M144,292 A112,112 0 0,1 368,292" stroke-width="7" opacity="0.5" fill="none"/>
      <path d="M170,292 A86,86 0 0,1 342,292" stroke-width="5" opacity="0.35" fill="none"/>
      <!-- Horizon line -->
      <line x1="82" y1="292" x2="430" y2="292" stroke-width="13"/>
      <!-- Perspective grid: vanishing-point lines converging at (256,292) -->
      <line x1="82" y1="420" x2="256" y2="292" stroke-width="10" opacity="0.8"/>
      <line x1="160" y1="440" x2="256" y2="292" stroke-width="8" opacity="0.65"/>
      <line x1="352" y1="440" x2="256" y2="292" stroke-width="8" opacity="0.65"/>
      <line x1="430" y1="420" x2="256" y2="292" stroke-width="10" opacity="0.8"/>
      <!-- Horizontal grid rows below horizon -->
      <line x1="90" y1="336" x2="422" y2="336" stroke-width="8" opacity="0.6"/>
      <line x1="104" y1="380" x2="408" y2="380" stroke-width="7" opacity="0.45"/>
      <line x1="120" y1="424" x2="392" y2="424" stroke-width="6" opacity="0.3"/>
    `,
  },

  // 10 ── ACE ── gold ──────────────────────────────────────────────────────────
  {
    id: 10, name: 'ace', color: '#ffd700',
    defs: '',
    svg: `
      <!-- Card outline -->
      <rect x="148" y="102" width="220" height="308" rx="24" stroke-width="14"/>
      <!-- Big A (two legs + crossbar) -->
      <line x1="208" y1="362" x2="256" y2="172" stroke-width="18"/>
      <line x1="304" y1="362" x2="256" y2="172" stroke-width="18"/>
      <line x1="222" y1="296" x2="290" y2="296" stroke-width="14"/>
      <!-- Corner pip marks (top-left, bottom-right) -->
      <circle cx="170" cy="126" r="10" fill="#ffd700" stroke-width="0"/>
      <circle cx="342" cy="384" r="10" fill="#ffd700" stroke-width="0"/>
      <!-- Card suit indicator — simple spade shape -->
      <!-- Spade: inverted heart + stem -->
      <!-- Left lobe -->
      <path d="M256,138 C236,124 212,134 212,152 C212,170 234,174 256,188"
            fill="none" stroke-width="9"/>
      <!-- Right lobe -->
      <path d="M256,138 C276,124 300,134 300,152 C300,170 278,174 256,188"
            fill="none" stroke-width="9"/>
      <!-- Stem tip -->
      <line x1="256" y1="188" x2="256" y2="205" stroke-width="9"/>
      <line x1="238" y1="205" x2="274" y2="205" stroke-width="9"/>
    `,
  },

  // 11 ── HOURGLASS ── purple ──────────────────────────────────────────────────
  {
    id: 11, name: 'hourglass', color: '#bf5fff',
    defs: '',
    svg: `
      <!-- Top cap -->
      <line x1="112" y1="112" x2="400" y2="112" stroke-width="15"/>
      <!-- Bottom cap -->
      <line x1="112" y1="400" x2="400" y2="400" stroke-width="15"/>
      <!-- Left side: from top-left corner to waist to bottom-left corner -->
      <line x1="112" y1="112" x2="256" y2="256" stroke-width="15"/>
      <line x1="112" y1="400" x2="256" y2="256" stroke-width="15"/>
      <!-- Right side -->
      <line x1="400" y1="112" x2="256" y2="256" stroke-width="15"/>
      <line x1="400" y1="400" x2="256" y2="256" stroke-width="15"/>
      <!-- Sand lines (top half, nearly full) -->
      <line x1="148" y1="152" x2="364" y2="152" stroke-width="9" opacity="0.7"/>
      <line x1="170" y1="190" x2="342" y2="190" stroke-width="9" opacity="0.6"/>
      <line x1="196" y1="228" x2="316" y2="228" stroke-width="8" opacity="0.5"/>
      <!-- Sand pile (bottom half, small) -->
      <line x1="214" y1="368" x2="298" y2="368" stroke-width="9" opacity="0.65"/>
      <line x1="230" y1="350" x2="282" y2="350" stroke-width="7" opacity="0.5"/>
      <!-- Sand drip at waist -->
      <circle cx="256" cy="268" r="6" fill="#bf5fff" stroke-width="0"/>
    `,
  },

  // 12 ── DRAGON ── green ──────────────────────────────────────────────────────
  {
    id: 12, name: 'dragon', color: '#00ff88',
    defs: '',
    svg: `
      <!-- Dragon head outline -->
      <path d="M 130,268
               C 130,224 150,196 188,184
               C 218,174 252,178 272,168
               L 282,144 L 296,168
               C 336,164 368,186 378,222
               C 388,258 372,298 354,318
               L 336,342 L 316,326
               C 284,348 250,354 220,342
               C 184,328 158,306 142,282 Z"
            fill="none" stroke-width="14"/>
      <!-- Eye socket -->
      <circle cx="308" cy="218" r="26" stroke-width="12"/>
      <!-- Pupil (slit) -->
      <ellipse cx="312" cy="220" rx="7" ry="14" fill="#00ff88" stroke-width="0"/>
      <!-- Nostril -->
      <circle cx="358" cy="266" r="11" stroke-width="8"/>
      <!-- Top horns/spikes -->
      <path d="M 252,176 L 240,134 L 268,174" fill="none" stroke-width="10"/>
      <path d="M 284,168 L 288,126 L 308,166" fill="none" stroke-width="10"/>
      <!-- Mouth snarl -->
      <path d="M 138,282 C 150,310 172,330 200,338" fill="none" stroke-width="10"/>
      <!-- Fangs -->
      <line x1="152" y1="297" x2="158" y2="280" stroke-width="8"/>
      <line x1="170" y1="310" x2="175" y2="292" stroke-width="8"/>
      <!-- Scale texture hint on forehead -->
      <path d="M 210,198 C 218,192 228,196 222,204" fill="none" stroke-width="7" opacity="0.6"/>
      <path d="M 236,192 C 244,186 254,190 248,198" fill="none" stroke-width="7" opacity="0.6"/>
    `,
  },

  // 13 ── POKER CHIP ── purple ─────────────────────────────────────────────────
  {
    id: 13, name: 'poker_chip', color: '#bf5fff',
    defs: '',
    svg: `
      <!-- Outer edge circle -->
      <circle cx="256" cy="256" r="168" stroke-width="14"/>
      <!-- Outer edge inner ring -->
      <circle cx="256" cy="256" r="146" stroke-width="5" opacity="0.5"/>
      <!-- 4 stripe tabs at cardinal points (fills between rings) -->
      <rect x="238" y="84"  width="36" height="58" rx="7" fill="#bf5fff" stroke-width="0"/>
      <rect x="238" y="370" width="36" height="58" rx="7" fill="#bf5fff" stroke-width="0"/>
      <rect x="84"  y="238" width="58" height="36" rx="7" fill="#bf5fff" stroke-width="0"/>
      <rect x="370" y="238" width="58" height="36" rx="7" fill="#bf5fff" stroke-width="0"/>
      <!-- Inner circle -->
      <circle cx="256" cy="256" r="116" stroke-width="14"/>
      <!-- Inner ring -->
      <circle cx="256" cy="256" r="62"  stroke-width="12"/>
      <!-- Center dot -->
      <circle cx="256" cy="256" r="22"  fill="#bf5fff" stroke-width="0"/>
      <!-- Decorative cross lines inside inner ring -->
      <line x1="256" y1="196" x2="256" y2="318" stroke-width="8" opacity="0.45"/>
      <line x1="196" y1="256" x2="318" y2="256" stroke-width="8" opacity="0.45"/>
    `,
  },

  // 14 ── CHAMPAGNE ── amber ────────────────────────────────────────────────────
  {
    id: 14, name: 'champagne', color: '#ffaa00',
    defs: '',
    svg: `
      <!-- Left edge of flute bowl -->
      <line x1="256" y1="375" x2="214" y2="120" stroke-width="14"/>
      <!-- Right edge of flute bowl -->
      <line x1="256" y1="375" x2="298" y2="120" stroke-width="14"/>
      <!-- Top rim -->
      <line x1="214" y1="120" x2="298" y2="120" stroke-width="14"/>
      <!-- Stem -->
      <line x1="256" y1="375" x2="256" y2="420" stroke-width="14"/>
      <!-- Base -->
      <line x1="200" y1="420" x2="312" y2="420" stroke-width="14"/>
      <!-- Liquid line (fill level) -->
      <line x1="224" y1="185" x2="288" y2="185" stroke-width="8" opacity="0.6"/>
      <!-- Bubbles rising -->
      <circle cx="244" cy="312" r="9"  fill="none" stroke-width="8"/>
      <circle cx="258" cy="264" r="9"  fill="none" stroke-width="8"/>
      <circle cx="270" cy="220" r="8"  fill="none" stroke-width="7"/>
      <circle cx="248" cy="172" r="7"  fill="none" stroke-width="7"/>
      <circle cx="264" cy="150" r="6"  fill="none" stroke-width="6"/>
    `,
  },

  // 15 ── MOON ── violet ────────────────────────────────────────────────────────
  {
    id: 15, name: 'moon', color: '#a855f7',
    defs: `
      <mask id="crescentMask">
        <!-- White = visible area (large circle) -->
        <circle cx="256" cy="256" r="148" fill="white"/>
        <!-- Black = cut-out (overlapping circle offset right) -->
        <circle cx="316" cy="240" r="124" fill="black"/>
      </mask>
    `,
    svg: `
      <!-- Crescent shape via mask -->
      <circle cx="256" cy="256" r="148" fill="#a855f7" stroke-width="0" mask="url(#crescentMask)"/>
      <!-- Outline around the crescent (glow edge) -->
      <circle cx="256" cy="256" r="148" fill="none" stroke-width="14" mask="url(#crescentMask)"/>
      <!-- Stars scattered around the crescent -->
      <circle cx="148" cy="148" r="7"  fill="#a855f7" stroke-width="0"/>
      <circle cx="370" cy="160" r="8"  fill="#a855f7" stroke-width="0"/>
      <circle cx="388" cy="340" r="6"  fill="#a855f7" stroke-width="0"/>
      <circle cx="148" cy="375" r="7"  fill="#a855f7" stroke-width="0"/>
      <circle cx="115" cy="270" r="5"  fill="#a855f7" stroke-width="0"/>
      <circle cx="400" cy="256" r="4"  fill="#a855f7" stroke-width="0"/>
    `,
  },

];

// ── Generate all PNGs ──────────────────────────────────────────────────────────

async function generate() {
  let ok = 0;
  let fail = 0;

  for (const av of AVATARS) {
    const svgStr = buildSVG(av.color, av.defs, av.svg);
    const buf = Buffer.from(svgStr, 'utf8');

    try {
      // Named file (martini.png, palm.png, …)
      const namedPath = `${OUT}/${av.name}.png`;
      await sharp(buf, { density: 144 }).resize(512, 512).png({ compressionLevel: 8 }).toFile(namedPath);

      // Numbered file (avatar_1.png … avatar_15.png) — overwrites bad crop
      const numPath = `${OUT}/avatar_${av.id}.png`;
      await sharp(buf, { density: 144 }).resize(512, 512).png({ compressionLevel: 8 }).toFile(numPath);

      console.log(`✓  ${av.name.padEnd(14)} → ${av.name}.png + avatar_${av.id}.png`);
      ok++;
    } catch (e) {
      console.error(`✗  ${av.name}: ${e.message}`);
      fail++;
    }
  }

  console.log(`\nDone — ${ok} generated, ${fail} failed.`);
}

generate();
