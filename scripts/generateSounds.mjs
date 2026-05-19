#!/usr/bin/env node
/**
 * Generates synthesized WAV poker sound effects for CHIP SOCIETY.
 * Run with: node scripts/generateSounds.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '../artifacts/neon-river/assets/sounds');

const SR = 22050;

// ── WAV builder ──────────────────────────────────────────────────────────────
function makeWav(samples) {
  const n = samples.length;
  const dataBytes = n * 2; // 16-bit
  const buf = Buffer.alloc(44 + dataBytes);

  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataBytes, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);        // PCM
  buf.writeUInt16LE(1, 22);        // mono
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);   // byteRate
  buf.writeUInt16LE(2, 32);        // blockAlign
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataBytes, 40);

  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }
  return buf;
}

function dur(ms) { return Math.ceil(SR * ms / 1000); }
function env(t, attack, decay) {
  return Math.min(t / attack, 1) * Math.exp(-Math.max(0, t - attack) / decay);
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const pi2 = Math.PI * 2;
function sine(t, freq) { return Math.sin(pi2 * freq * t); }
function rnd() { return Math.random() * 2 - 1; }

// ── Sound definitions ─────────────────────────────────────────────────────────

// Card deal: crisp high-pitched paper swish
function deal() {
  const n = dur(90);
  return Float32Array.from({ length: n }, (_, i) => {
    const t = i / SR;
    const e = Math.exp(-t * 38);
    return e * (rnd() * 0.35 + sine(t, 1600) * 0.55 + sine(t, 3200) * 0.12) * 0.7;
  });
}

// Chip click: sharp ceramic click
function chipClick() {
  const n = dur(110);
  return Float32Array.from({ length: n }, (_, i) => {
    const t = i / SR;
    const e = Math.exp(-t * 28);
    const tone = sine(t, 1100) * 0.6 + sine(t, 1600) * 0.3 + sine(t, 2200) * 0.1;
    return e * (rnd() * 0.2 + tone) * 0.75;
  });
}

// Chip collect: satisfying rising sweep
function chipCollect() {
  const n = dur(240);
  return Float32Array.from({ length: n }, (_, i) => {
    const t = i / SR;
    const progress = t / (n / SR);
    const e = Math.min(t * 12, 1) * Math.exp(-t * 6);
    const freq = 350 + 500 * progress;
    return e * (sine(t, freq) * 0.65 + sine(t, freq * 1.5) * 0.25 + rnd() * 0.1) * 0.7;
  });
}

// Fold: soft downward card swish
function fold() {
  const n = dur(120);
  return Float32Array.from({ length: n }, (_, i) => {
    const t = i / SR;
    const progress = t / (n / SR);
    const e = Math.exp(-t * 22);
    const freq = 900 - 600 * progress;
    return e * (rnd() * 0.45 + sine(t, freq) * 0.45 + sine(t, freq * 0.5) * 0.1) * 0.55;
  });
}

// Check: quiet wooden knock
function check() {
  const n = dur(65);
  return Float32Array.from({ length: n }, (_, i) => {
    const t = i / SR;
    const e = Math.exp(-t * 70);
    return e * (sine(t, 480) * 0.6 + sine(t, 280) * 0.3 + rnd() * 0.1) * 0.55;
  });
}

// Call: two-chip clink
function call() {
  const n = dur(150);
  return Float32Array.from({ length: n }, (_, i) => {
    const t = i / SR;
    const e1 = Math.exp(-t * 25);
    const e2 = Math.exp(-Math.max(0, t - 0.05) * 25);
    const c1 = e1 * (sine(t, 1200) * 0.7 + rnd() * 0.15) * 0.6;
    const c2 = t > 0.05 ? e2 * (sine(t, 1400) * 0.6 + rnd() * 0.15) * 0.55 : 0;
    return (c1 + c2) * 0.8;
  });
}

// Raise: three ascending chip clinks
function raise() {
  const n = dur(200);
  return Float32Array.from({ length: n }, (_, i) => {
    const t = i / SR;
    const offsets = [0, 0.055, 0.115];
    const freqs = [1100, 1350, 1650];
    let s = 0;
    for (let k = 0; k < 3; k++) {
      const dt = t - offsets[k];
      if (dt < 0) continue;
      s += Math.exp(-dt * 22) * (sine(t, freqs[k]) * 0.65 + rnd() * 0.12) * 0.55;
    }
    return s;
  });
}

// All-in: dramatic cascading chip sweep
function allIn() {
  const n = dur(380);
  return Float32Array.from({ length: n }, (_, i) => {
    const t = i / SR;
    const progress = t / (n / SR);
    const e = Math.min(t * 6, 1) * (1 - progress * 0.25);
    const sweep = sine(t, 180 + 400 * progress * progress) * 0.4;
    const harm = sine(t, (180 + 400 * progress * progress) * 1.5) * 0.2;
    const noise = rnd() * 0.12;
    // Chip rain: rapid random clicks
    const chipRain = Math.exp(-((t % 0.028) * 45)) * rnd() * 0.3;
    return e * (sweep + harm + noise + chipRain) * 0.8;
  });
}

// Win: ascending C-E-G-C arpeggio with shimmer
function win() {
  const notes = [261.63, 329.63, 392.0, 523.25];
  const noteDur = 0.11;
  const totalMs = 550;
  const n = dur(totalMs);
  return Float32Array.from({ length: n }, (_, i) => {
    const t = i / SR;
    let s = 0;
    for (let k = 0; k < notes.length; k++) {
      const start = k * noteDur;
      const dt = t - start;
      if (dt < 0 || dt > 0.38) continue;
      const e = Math.min(dt * 18, 1) * Math.exp(-dt * 7);
      s += e * (sine(t, notes[k]) * 0.5 + sine(t, notes[k] * 2) * 0.2 + sine(t, notes[k] * 3) * 0.08) * 0.55;
    }
    // Shimmer noise on win
    const shimmer = t > 0.3 ? Math.exp(-(t - 0.3) * 5) * rnd() * 0.06 : 0;
    return (s + shimmer);
  });
}

// Lose: descending somber tone
function lose() {
  const n = dur(450);
  return Float32Array.from({ length: n }, (_, i) => {
    const t = i / SR;
    const total = n / SR;
    const progress = t / total;
    const e = Math.min(t * 6, 1) * Math.exp(-t * 4);
    const freq1 = 330 - 100 * progress;
    const freq2 = 250 - 80 * progress;
    return e * (sine(t, freq1) * 0.45 + sine(t, freq2) * 0.35 + rnd() * 0.04) * 0.65;
  });
}

// Button press: crisp UI tap
function buttonTap() {
  const n = dur(45);
  return Float32Array.from({ length: n }, (_, i) => {
    const t = i / SR;
    const e = Math.exp(-t * 90);
    return e * (sine(t, 680) * 0.6 + sine(t, 1020) * 0.3 + rnd() * 0.08) * 0.45;
  });
}

// Notification: double neon chirp
function notification() {
  const n = dur(180);
  return Float32Array.from({ length: n }, (_, i) => {
    const t = i / SR;
    const chirp = (dt) => {
      if (dt < 0 || dt > 0.07) return 0;
      const e = Math.exp(-dt * 35);
      return e * (sine(t, 880) * 0.55 + sine(t, 1320) * 0.3) * 0.6;
    };
    return chirp(t) + chirp(t - 0.09);
  });
}

// Card flip: quick swoosh (community cards)
function cardFlip() {
  const n = dur(70);
  return Float32Array.from({ length: n }, (_, i) => {
    const t = i / SR;
    const e = Math.exp(-t * 50);
    return e * (rnd() * 0.5 + sine(t, 2400) * 0.3 + sine(t, 1200) * 0.2) * 0.6;
  });
}

// ── Write files ───────────────────────────────────────────────────────────────
fs.mkdirSync(OUT_DIR, { recursive: true });

const sounds = {
  'deal.wav':         deal(),
  'chip_click.wav':   chipClick(),
  'chip_collect.wav': chipCollect(),
  'fold.wav':         fold(),
  'check.wav':        check(),
  'call.wav':         call(),
  'raise.wav':        raise(),
  'allin.wav':        allIn(),
  'win.wav':          win(),
  'lose.wav':         lose(),
  'button.wav':       buttonTap(),
  'notification.wav': notification(),
  'card_flip.wav':    cardFlip(),
};

for (const [name, samples] of Object.entries(sounds)) {
  const buf = makeWav(Array.from(samples));
  fs.writeFileSync(path.join(OUT_DIR, name), buf);
  console.log(`✓ ${name} (${(buf.length / 1024).toFixed(1)} KB)`);
}

console.log(`\n✅ ${Object.keys(sounds).length} sounds written to ${OUT_DIR}`);
