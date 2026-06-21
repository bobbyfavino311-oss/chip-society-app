/**
 * CHIP SOCIETY — Sound Generator
 * Generates all synthetic WAV SFX files for mobile + web.
 * Run: node scripts/src/gen-sounds.cjs
 *
 * Output: artifacts/neon-river/assets/sounds/<name>.wav
 * Sample rate: 22050 Hz, 16-bit, mono
 */

'use strict';
const fs   = require('fs');
const path = require('path');

const SR      = 22050;
const PEAK    = 32767;
const OUT_DIR = path.join(__dirname, '../../artifacts/neon-river/assets/sounds');

// ── WAV writer ─────────────────────────────────────────────────────────────────
function writeWav(name, samples) {
  const clamped = samples.map(s => Math.max(-1, Math.min(1, s)));
  const dataLen = clamped.length * 2;
  const buf     = Buffer.alloc(44 + dataLen);

  buf.write('RIFF',   0, 'ascii');
  buf.writeUInt32LE(36 + dataLen, 4);
  buf.write('WAVE',   8, 'ascii');
  buf.write('fmt ',  12, 'ascii');
  buf.writeUInt32LE(16,    16);
  buf.writeUInt16LE(1,     20); // PCM
  buf.writeUInt16LE(1,     22); // mono
  buf.writeUInt32LE(SR,    24);
  buf.writeUInt32LE(SR * 2, 28); // byte rate
  buf.writeUInt16LE(2,     32); // block align
  buf.writeUInt16LE(16,    34); // bits
  buf.write('data',  36, 'ascii');
  buf.writeUInt32LE(dataLen, 40);

  for (let i = 0; i < clamped.length; i++) {
    buf.writeInt16LE(Math.round(clamped[i] * PEAK), 44 + i * 2);
  }

  const outPath = path.join(OUT_DIR, `${name}.wav`);
  fs.writeFileSync(outPath, buf);
  console.log(`  ✓ ${name}.wav  (${(buf.length / 1024).toFixed(1)} KB)`);
}

// ── Synthesis helpers ──────────────────────────────────────────────────────────

function zeros(dur) { return new Float32Array(Math.ceil(dur * SR)); }

// Adds src into dst at offsetSeconds, clipped to dst length
function mix(dst, src, offsetSec = 0, gain = 1) {
  const off = Math.round(offsetSec * SR);
  for (let i = 0; i < src.length; i++) {
    const j = off + i;
    if (j >= 0 && j < dst.length) dst[j] += src[i] * gain;
  }
}

// ADSR envelope applied in-place
function adsr(samples, a, d, s, r) {
  const len = samples.length;
  const ai  = Math.round(a * SR);
  const di  = Math.round(d * SR);
  const ri  = Math.round(r * SR);
  const si  = Math.max(0, len - ai - di - ri);
  for (let i = 0; i < len; i++) {
    let env;
    if      (i < ai)          env = i / Math.max(1, ai);
    else if (i < ai + di)     env = 1 - (1 - s) * (i - ai) / Math.max(1, di);
    else if (i < ai + di + si) env = s;
    else {
      const ri2 = len - ai - di - si;
      env = s * Math.max(0, 1 - (i - ai - di - si) / Math.max(1, ri2));
    }
    samples[i] *= Math.max(0, env);
  }
  return samples;
}

// Sine oscillator with optional frequency sweep
function sine(dur, freq, amp, freqEnd) {
  const buf = new Float32Array(Math.ceil(dur * SR));
  for (let i = 0; i < buf.length; i++) {
    const t = i / SR;
    const f = freqEnd !== undefined
      ? freq * Math.pow(freqEnd / freq, t / dur)
      : freq;
    buf[i] = amp * Math.sin(2 * Math.PI * f * t);
  }
  return buf;
}

// Square wave oscillator
function square(dur, freq, amp) {
  const buf = new Float32Array(Math.ceil(dur * SR));
  for (let i = 0; i < buf.length; i++) {
    const t = i / SR;
    buf[i] = amp * (Math.sin(2 * Math.PI * freq * t) >= 0 ? 1 : -1);
  }
  return buf;
}

// White noise, band-limited with simple one-pole IIR filter
function noise(dur, amp, lopass = 1.0) {
  const buf  = new Float32Array(Math.ceil(dur * SR));
  let prev = 0;
  for (let i = 0; i < buf.length; i++) {
    const raw = (Math.random() * 2 - 1) * amp;
    prev = prev + lopass * (raw - prev);
    buf[i] = prev;
  }
  return buf;
}

// Highpass noise (subtract low-pass from original)
function hpnoise(dur, amp, hipass = 0.1) {
  const buf  = new Float32Array(Math.ceil(dur * SR));
  let prev = 0;
  for (let i = 0; i < buf.length; i++) {
    const raw = (Math.random() * 2 - 1);
    prev = prev + hipass * (raw - prev);
    buf[i] = (raw - prev) * amp;
  }
  return buf;
}

// Normalize to peak amplitude
function normalize(buf, targetPeak = 0.90) {
  let peak = 0;
  for (let i = 0; i < buf.length; i++) peak = Math.max(peak, Math.abs(buf[i]));
  if (peak < 0.001) return buf;
  const scale = targetPeak / peak;
  for (let i = 0; i < buf.length; i++) buf[i] *= scale;
  return buf;
}

// Bell tone with natural ring decay
function bell(freq, ringTime, amp) {
  const buf = sine(ringTime, freq, amp);
  adsr(buf, 0.003, 0.01, 0.7, ringTime - 0.013);
  return buf;
}

// Short transient click (for coins)
function click(freq, dur, amp) {
  const buf = sine(dur, freq, amp);
  adsr(buf, 0.001, dur * 0.3, 0.0, dur * 0.7);
  return buf;
}

// ── Sound definitions ──────────────────────────────────────────────────────────

function gen_prize_collect() {
  // Coin shower: 5 rising tonal clicks + sparkle shimmer
  const dur = 0.62;
  const out = zeros(dur);
  // Rising coin hits staggered in time
  const freqs  = [880, 1047, 1175, 1319, 1568];
  const offsets = [0, 0.06, 0.11, 0.16, 0.21];
  freqs.forEach((f, i) => {
    const c = click(f, 0.22, 0.52);
    mix(out, c, offsets[i]);
  });
  // Shimmer overtone noise
  const sh = hpnoise(0.38, 0.28, 0.04);
  adsr(sh, 0.005, 0.08, 0.3, 0.25);
  mix(out, sh, 0.08);
  // Warm resonant tail
  const tail = bell(440, 0.45, 0.25);
  mix(out, tail, 0.18);
  return normalize(out);
}

function gen_cookie_crack_common() {
  // Light snap + single soft bell (C6)
  const dur = 0.55;
  const out = zeros(dur);
  const crk = hpnoise(0.10, 0.70, 0.12);
  adsr(crk, 0.001, 0.04, 0.0, 0.055);
  mix(out, crk, 0);
  const b = bell(1047, 0.50, 0.45);
  mix(out, b, 0.02);
  return normalize(out);
}

function gen_cookie_crack_uncommon() {
  // Medium snap + E6 bell + green sparkle
  const dur = 0.62;
  const out = zeros(dur);
  const crk = hpnoise(0.12, 0.75, 0.10);
  adsr(crk, 0.001, 0.055, 0.0, 0.065);
  mix(out, crk, 0);
  const b1 = bell(1047, 0.52, 0.38);
  const b2 = bell(1319, 0.44, 0.30);
  mix(out, b1, 0.02);
  mix(out, b2, 0.04);
  const sp = hpnoise(0.22, 0.18, 0.025);
  adsr(sp, 0.003, 0.06, 0.2, 0.14);
  mix(out, sp, 0.06);
  return normalize(out);
}

function gen_cookie_crack_rare() {
  // Crisp crack + G6+C7 two-bell chord + blue shimmer
  const dur = 0.72;
  const out = zeros(dur);
  const crk = hpnoise(0.14, 0.80, 0.09);
  adsr(crk, 0.001, 0.06, 0.0, 0.08);
  mix(out, crk, 0);
  const b1 = bell(1568, 0.60, 0.40);
  const b2 = bell(2093, 0.50, 0.25);
  mix(out, b1, 0.02);
  mix(out, b2, 0.03);
  const sp = hpnoise(0.32, 0.22, 0.020);
  adsr(sp, 0.003, 0.07, 0.25, 0.22);
  mix(out, sp, 0.05);
  return normalize(out);
}

function gen_cookie_crack_epic() {
  // Deep thud + purple burst: rumble bass + G5+G6 chord + shimmer
  const dur = 0.90;
  const out = zeros(dur);
  // Low rumble body
  const rumble = sine(0.18, 150, 0.45);
  adsr(rumble, 0.002, 0.06, 0.2, 0.12);
  mix(out, rumble, 0);
  // Crack texture
  const crk = hpnoise(0.16, 0.78, 0.08);
  adsr(crk, 0.001, 0.07, 0.0, 0.09);
  mix(out, crk, 0);
  // Bells (G5 + G6)
  const b1 = bell(784, 0.75, 0.42);
  const b2 = bell(1568, 0.60, 0.28);
  mix(out, b1, 0.03);
  mix(out, b2, 0.04);
  // Purple shimmer
  const sp = hpnoise(0.45, 0.24, 0.018);
  adsr(sp, 0.004, 0.10, 0.28, 0.32);
  mix(out, sp, 0.06);
  return normalize(out);
}

function gen_cookie_crack_legendary() {
  // Gold shimmer: deep sub + thundercrack + 3-bell rising arpeggio
  const dur = 1.25;
  const out = zeros(dur);
  // Sub bass pulse
  const sub = sine(0.22, 80, 0.50);
  adsr(sub, 0.003, 0.10, 0.1, 0.11);
  mix(out, sub, 0);
  // Crack explosion
  const crk = hpnoise(0.18, 0.85, 0.07);
  adsr(crk, 0.001, 0.09, 0.0, 0.09);
  mix(out, crk, 0);
  // Rising 3-bell arpeggio (C5→G5→C6)
  [[523, 0.06], [784, 0.18], [1047, 0.32]].forEach(([f, t]) => {
    mix(out, bell(f, 0.85, 0.40), t);
  });
  // Gold shimmer
  const sp = hpnoise(0.60, 0.26, 0.015);
  adsr(sp, 0.006, 0.12, 0.30, 0.45);
  mix(out, sp, 0.08);
  return normalize(out);
}

function gen_cookie_crack_mythic() {
  // Jackpot: sub bass + explosive crack + 7-bell cascade + massive shimmer
  const dur = 1.80;
  const out = zeros(dur);
  // Deep sub pulse (two)
  const sub1 = sine(0.28, 55, 0.52);
  adsr(sub1, 0.002, 0.12, 0.08, 0.15);
  mix(out, sub1, 0);
  const sub2 = sine(0.20, 110, 0.35);
  adsr(sub2, 0.003, 0.10, 0.05, 0.10);
  mix(out, sub2, 0.01);
  // Explosive crack
  const crk = hpnoise(0.22, 0.90, 0.06);
  adsr(crk, 0.001, 0.12, 0.0, 0.10);
  mix(out, crk, 0);
  // 7-bell cascade (C5, E5, G5, C6, E6, G6, C7)
  const bellFreqs = [523, 659, 784, 1047, 1319, 1568, 2093];
  bellFreqs.forEach((f, i) => {
    mix(out, bell(f, 1.20 - i * 0.08, 0.42 - i * 0.02), 0.08 + i * 0.12);
  });
  // Massive pink/gold shimmer — two bursts
  const sp1 = hpnoise(0.80, 0.28, 0.013);
  adsr(sp1, 0.007, 0.15, 0.35, 0.60);
  mix(out, sp1, 0.10);
  const sp2 = hpnoise(0.60, 0.22, 0.016);
  adsr(sp2, 0.005, 0.12, 0.28, 0.45);
  mix(out, sp2, 0.55);
  return normalize(out);
}

// ── Cookie reveal sounds (longer, more musical, post-animation) ────────────────

function gen_cookie_reveal_common() {
  // Single warm bell (C6), clean and pure
  const dur = 0.65;
  const out = zeros(dur);
  mix(out, bell(1047, 0.62, 0.75), 0);
  // Soft overtone
  mix(out, bell(2093, 0.40, 0.18), 0.005);
  return normalize(out);
}

function gen_cookie_reveal_uncommon() {
  // Double bell (C6 + E6) — slightly richer
  const dur = 0.78;
  const out = zeros(dur);
  mix(out, bell(1047, 0.65, 0.60), 0);
  mix(out, bell(1319, 0.58, 0.45), 0.08);
  // Green shimmer
  const sp = hpnoise(0.25, 0.14, 0.028);
  adsr(sp, 0.003, 0.06, 0.2, 0.18);
  mix(out, sp, 0.06);
  return normalize(out);
}

function gen_cookie_reveal_rare() {
  // Blue shimmer: two-bell chord (G6+C7) + shimmer tail
  const dur = 0.95;
  const out = zeros(dur);
  mix(out, bell(1568, 0.78, 0.55), 0);
  mix(out, bell(2093, 0.65, 0.35), 0.01);
  mix(out, bell(1047, 0.72, 0.28), 0.05); // warm support
  const sp = hpnoise(0.45, 0.20, 0.022);
  adsr(sp, 0.004, 0.10, 0.28, 0.32);
  mix(out, sp, 0.07);
  return normalize(out);
}

function gen_cookie_reveal_epic() {
  // Purple magic: gong body (220 Hz) + ascending 3-bell + shimmer
  const dur = 1.20;
  const out = zeros(dur);
  // Deep gong
  const gong = sine(0.55, 220, 0.45);
  adsr(gong, 0.004, 0.12, 0.25, 0.38);
  mix(out, gong, 0);
  const gong2 = sine(0.45, 440, 0.25);
  adsr(gong2, 0.005, 0.10, 0.18, 0.30);
  mix(out, gong2, 0.02);
  // Bell cascade
  [[784, 0.10], [1047, 0.22], [1319, 0.35]].forEach(([f, t]) => {
    mix(out, bell(f, 0.72, 0.38), t);
  });
  const sp = hpnoise(0.55, 0.22, 0.018);
  adsr(sp, 0.005, 0.12, 0.30, 0.38);
  mix(out, sp, 0.12);
  return normalize(out);
}

function gen_cookie_reveal_legendary() {
  // Gold premium: full 5-note ascending arpeggio + sustained shimmer
  const dur = 1.85;
  const out = zeros(dur);
  // Warm bass pedal
  const bass = sine(0.80, 261, 0.30);
  adsr(bass, 0.008, 0.20, 0.20, 0.50);
  mix(out, bass, 0);
  // Rising arpeggio: C5 E5 G5 C6 E6
  const arpegg = [523, 659, 784, 1047, 1319];
  arpegg.forEach((f, i) => {
    mix(out, bell(f, 1.30 - i * 0.08, 0.45 - i * 0.01), i * 0.18);
  });
  // Gold shimmer wave
  const sp = hpnoise(0.90, 0.24, 0.014);
  adsr(sp, 0.008, 0.18, 0.32, 0.65);
  mix(out, sp, 0.25);
  return normalize(out);
}

function gen_cookie_reveal_mythic() {
  // Pink/gold jackpot: sub pulse + 8-bell cascade + two shimmer waves
  const dur = 2.50;
  const out = zeros(dur);
  // Majestic bass foundation
  const sub = sine(0.60, 82, 0.40);
  adsr(sub, 0.005, 0.18, 0.15, 0.40);
  mix(out, sub, 0);
  const bass = sine(0.90, 164, 0.30);
  adsr(bass, 0.008, 0.20, 0.18, 0.60);
  mix(out, bass, 0.02);
  // 8-bell cascade (C4 → C6 in pentatonic)
  const bells = [262, 330, 392, 523, 659, 784, 1047, 1319];
  bells.forEach((f, i) => {
    mix(out, bell(f, 2.0 - i * 0.12, 0.42 - i * 0.02), i * 0.20);
  });
  // First shimmer burst
  const sp1 = hpnoise(0.90, 0.26, 0.012);
  adsr(sp1, 0.008, 0.20, 0.35, 0.65);
  mix(out, sp1, 0.30);
  // Second shimmer burst (delayed)
  const sp2 = hpnoise(0.75, 0.22, 0.015);
  adsr(sp2, 0.006, 0.16, 0.28, 0.52);
  mix(out, sp2, 1.10);
  return normalize(out);
}

// ── Other new sounds ───────────────────────────────────────────────────────────

function gen_fortune_rise() {
  // Ascending pentatonic: C5 E5 G5 C6 E6 — floaty, airy feel
  const dur = 0.92;
  const out = zeros(dur);
  const notes = [523, 659, 784, 1047, 1319];
  notes.forEach((f, i) => {
    const b = bell(f, 0.55, 0.42 - i * 0.02);
    mix(out, b, i * 0.10);
  });
  // Airy shimmer
  const sp = hpnoise(0.55, 0.14, 0.020);
  adsr(sp, 0.005, 0.12, 0.25, 0.38);
  mix(out, sp, 0.08);
  return normalize(out);
}

function gen_lottery_scratch() {
  // Scratch texture: rough bandpass noise burst, 180ms
  const dur = 0.22;
  const out = zeros(dur);
  // Multiple layered noise scratches
  const n1 = hpnoise(0.12, 0.65, 0.08);
  adsr(n1, 0.001, 0.04, 0.3, 0.07);
  mix(out, n1, 0);
  const n2 = noise(0.10, 0.40, 0.15);
  adsr(n2, 0.001, 0.03, 0.25, 0.06);
  mix(out, n2, 0.01);
  // High-freq scratch texture
  const n3 = hpnoise(0.08, 0.30, 0.05);
  adsr(n3, 0.001, 0.02, 0.1, 0.05);
  mix(out, n3, 0.04);
  return normalize(out, 0.70); // slightly quieter for rapid repeat
}

function gen_lottery_reveal() {
  // 3-note rising fanfare + sparkle — lottery win reveal
  const dur = 0.90;
  const out = zeros(dur);
  // Rising 3-note (C5 → G5 → C6)
  [[523, 0.00], [784, 0.16], [1047, 0.32]].forEach(([f, t]) => {
    mix(out, bell(f, 0.72, 0.50), t);
  });
  // Quick sparkle
  const sp = hpnoise(0.40, 0.20, 0.022);
  adsr(sp, 0.003, 0.08, 0.25, 0.28);
  mix(out, sp, 0.30);
  return normalize(out);
}

function gen_tournament_win() {
  // Grand fanfare: bass pedal + 5-ascending fanfare + sustained shimmer
  const dur = 1.95;
  const out = zeros(dur);
  // Bass pedal
  const bass = sine(0.95, 130, 0.35);
  adsr(bass, 0.010, 0.25, 0.20, 0.55);
  mix(out, bass, 0);
  const bass2 = sine(0.80, 196, 0.22);
  adsr(bass2, 0.012, 0.22, 0.15, 0.45);
  mix(out, bass2, 0.04);
  // Triumphant 5-note rising fanfare (C5 E5 G5 C6 E6)
  const fanfare = [523, 659, 784, 1047, 1319];
  fanfare.forEach((f, i) => {
    const b = bell(f, 1.50 - i * 0.10, 0.52 - i * 0.02);
    mix(out, b, 0.05 + i * 0.22);
  });
  // Grand shimmer burst
  const sp1 = hpnoise(0.80, 0.28, 0.013);
  adsr(sp1, 0.008, 0.18, 0.35, 0.58);
  mix(out, sp1, 0.50);
  const sp2 = hpnoise(0.65, 0.22, 0.016);
  adsr(sp2, 0.006, 0.14, 0.28, 0.45);
  mix(out, sp2, 1.05);
  return normalize(out);
}

function gen_error() {
  // Descending buzz: sawtooth sweep 440→220 Hz + low noise thud
  const dur = 0.42;
  const out = zeros(dur);
  const buzz = square(dur, 440, 0.40);
  adsr(buzz, 0.002, 0.05, 0.5, 0.20);
  // Frequency "falling" effect: mix two pitches at different gains
  const buzz2 = square(dur * 0.6, 294, 0.35);
  adsr(buzz2, 0.001, 0.04, 0.35, 0.18);
  mix(out, buzz, 0);
  mix(out, buzz2, 0.12);
  // Low thud
  const thud = sine(0.14, 120, 0.45);
  adsr(thud, 0.001, 0.06, 0.0, 0.08);
  mix(out, thud, 0);
  return normalize(out);
}

function gen_bet_placed() {
  // Single chip click with satisfying mid thump
  const dur = 0.30;
  const out = zeros(dur);
  const thump = sine(0.12, 320, 0.55);
  adsr(thump, 0.001, 0.05, 0.0, 0.07);
  mix(out, thump, 0);
  const click2 = hpnoise(0.06, 0.42, 0.12);
  adsr(click2, 0.001, 0.02, 0.0, 0.04);
  mix(out, click2, 0);
  return normalize(out);
}

// ── Run generator ──────────────────────────────────────────────────────────────

const sounds = {
  prize_collect:          gen_prize_collect,
  cookie_crack_common:    gen_cookie_crack_common,
  cookie_crack_uncommon:  gen_cookie_crack_uncommon,
  cookie_crack_rare:      gen_cookie_crack_rare,
  cookie_crack_epic:      gen_cookie_crack_epic,
  cookie_crack_legendary: gen_cookie_crack_legendary,
  cookie_crack_mythic:    gen_cookie_crack_mythic,
  cookie_reveal_common:   gen_cookie_reveal_common,
  cookie_reveal_uncommon: gen_cookie_reveal_uncommon,
  cookie_reveal_rare:     gen_cookie_reveal_rare,
  cookie_reveal_epic:     gen_cookie_reveal_epic,
  cookie_reveal_legendary: gen_cookie_reveal_legendary,
  cookie_reveal_mythic:   gen_cookie_reveal_mythic,
  fortune_rise:           gen_fortune_rise,
  lottery_scratch:        gen_lottery_scratch,
  lottery_reveal:         gen_lottery_reveal,
  tournament_win:         gen_tournament_win,
  error:                  gen_error,
  bet_placed:             gen_bet_placed,
};

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

console.log('\n🎵  CHIP SOCIETY — generating sound assets...\n');
for (const [name, fn] of Object.entries(sounds)) {
  try {
    const samples = fn();
    writeWav(name, samples);
  } catch (e) {
    console.error(`  ✗ ${name}.wav — ${e.message}`);
  }
}
console.log('\nDone.\n');
