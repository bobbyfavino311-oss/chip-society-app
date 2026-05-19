#!/usr/bin/env node
/**
 * Generates 80s synthwave-inspired poker sound effects for CHIP SOCIETY.
 * All sounds are built from retro waveforms: sawtooth, square, pulse.
 * Run with: node scripts/generateSounds.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '../artifacts/neon-river/assets/sounds');
const SR = 22050;
const pi2 = Math.PI * 2;

// ── WAV builder ───────────────────────────────────────────────────────────────
function makeWav(samples) {
  const n = samples.length;
  const dataBytes = n * 2;
  const buf = Buffer.alloc(44 + dataBytes);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + dataBytes, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(dataBytes, 40);
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }
  return buf;
}

function dur(ms) { return Math.ceil(SR * ms / 1000); }
function rnd() { return Math.random() * 2 - 1; }

// ── Retro waveforms ───────────────────────────────────────────────────────────

// Bandlimited sawtooth (80s synth character)
function saw(t, freq, harmonics = 12) {
  let s = 0;
  for (let n = 1; n <= harmonics; n++) s += Math.sin(pi2 * freq * n * t) * (n % 2 ? 1 : -1) / n;
  return s * (2 / Math.PI);
}

// Bandlimited square wave
function sqr(t, freq, harmonics = 10) {
  let s = 0;
  for (let n = 1; n <= harmonics * 2; n += 2) s += Math.sin(pi2 * freq * n * t) / n;
  return s * (4 / Math.PI);
}

// Pulse with PWM (classic 80s arpeggio)
function pulse(t, freq, duty = 0.25, harmonics = 10) {
  let s = duty - 0.5; // DC offset
  for (let n = 1; n <= harmonics; n++) {
    s += (2 / (n * Math.PI)) * Math.sin(Math.PI * n * duty) * Math.cos(pi2 * freq * n * t);
  }
  return Math.max(-1, Math.min(1, s * 1.6));
}

// Triangle
function tri(t, freq) {
  const p = (t * freq) % 1;
  return p < 0.5 ? 4 * p - 1 : 3 - 4 * p;
}

// Simple ADSR envelope
function adsr(t, attack, decay, sustain, release, total) {
  if (t < attack) return t / attack;
  if (t < attack + decay) return 1 - (1 - sustain) * ((t - attack) / decay);
  if (t < total - release) return sustain;
  return sustain * Math.max(0, 1 - (t - (total - release)) / release);
}

// ── Sound definitions ─────────────────────────────────────────────────────────

// Card deal: crisp sawtooth click with noise burst — retro card machine
function deal() {
  const ms = 95; const n = dur(ms);
  return Float32Array.from({ length: n }, (_, i) => {
    const t = i / SR;
    const env = Math.exp(-t * 42);
    const s = saw(t, 1800, 6) * 0.5 + rnd() * 0.35 + tri(t, 900) * 0.2;
    return env * s * 0.65;
  });
}

// Chip click: warm sawtooth thud — vintage arcade token drop
function chipClick() {
  const ms = 130; const n = dur(ms);
  return Float32Array.from({ length: n }, (_, i) => {
    const t = i / SR;
    const env = adsr(t, 0.003, 0.04, 0.3, 0.07, ms / 1000);
    const freq = 320 + 200 * Math.exp(-t * 30); // pitch drop
    const s = saw(t, freq, 8) * 0.6 + sqr(t, freq * 0.5, 6) * 0.25 + rnd() * 0.08;
    return env * s * 0.7;
  });
}

// Chip collect: 80s coin cascade arpeggio
function chipCollect() {
  const ms = 280; const n = dur(ms);
  const notes = [330, 415, 523, 659]; // E-G#-C-E minor arpeggio
  return Float32Array.from({ length: n }, (_, i) => {
    const t = i / SR;
    const noteIdx = Math.min(Math.floor(t / 0.062), notes.length - 1);
    const noteT = t - noteIdx * 0.062;
    const env = adsr(noteT, 0.003, 0.025, 0.35, 0.025, 0.06);
    const f = notes[noteIdx];
    const s = pulse(t, f, 0.25, 8) * 0.55 + tri(t, f * 2) * 0.2;
    // Rising shimmer noise
    const shimmer = Math.exp(-t * 4) * rnd() * 0.06;
    return env * s * 0.7 + shimmer;
  });
}

// Fold: downward sawtooth swipe — quick retro dismiss
function fold() {
  const ms = 110; const n = dur(ms);
  return Float32Array.from({ length: n }, (_, i) => {
    const t = i / SR;
    const progress = t / (ms / 1000);
    const env = Math.exp(-t * 18);
    const freq = 700 - 450 * progress;
    const s = saw(t, freq, 7) * 0.55 + rnd() * 0.3 + tri(t, freq * 0.5) * 0.15;
    return env * s * 0.55;
  });
}

// Check: short square tap — retro button press
function check() {
  const ms = 60; const n = dur(ms);
  return Float32Array.from({ length: n }, (_, i) => {
    const t = i / SR;
    const env = adsr(t, 0.002, 0.02, 0.2, 0.03, ms / 1000);
    const s = sqr(t, 480, 7) * 0.5 + rnd() * 0.12;
    return env * s * 0.5;
  });
}

// Call: two-token drop — crisp double thud
function call() {
  const ms = 160; const n = dur(ms);
  return Float32Array.from({ length: n }, (_, i) => {
    const t = i / SR;
    function chip(offset) {
      const dt = t - offset;
      if (dt < 0 || dt > 0.1) return 0;
      const e = adsr(dt, 0.002, 0.03, 0.2, 0.04, 0.1);
      const f = 350 + 180 * Math.exp(-dt * 35);
      return e * (saw(t, f, 8) * 0.55 + rnd() * 0.1) * 0.65;
    }
    return chip(0) + chip(0.065);
  });
}

// Raise: ascending three-chip cascade — satisfying arpeggio
function raise() {
  const ms = 220; const n = dur(ms);
  const offsets = [0, 0.058, 0.118];
  const freqs = [380, 480, 620];
  return Float32Array.from({ length: n }, (_, i) => {
    const t = i / SR;
    let s = 0;
    for (let k = 0; k < 3; k++) {
      const dt = t - offsets[k];
      if (dt < 0 || dt > 0.1) continue;
      const e = adsr(dt, 0.002, 0.03, 0.25, 0.04, 0.1);
      s += e * (saw(t, freqs[k], 7) * 0.5 + rnd() * 0.08) * 0.6;
    }
    return s;
  });
}

// All-in: dramatic 80s synth swell — cascading saw chord
function allIn() {
  const ms = 420; const n = dur(ms);
  const total = ms / 1000;
  const chord = [1.0, 1.25, 1.5, 1.875]; // power chord intervals
  return Float32Array.from({ length: n }, (_, i) => {
    const t = i / SR;
    const progress = t / total;
    const env = Math.min(t * 5, 1) * (1 - progress * 0.2);
    const rootFreq = 110 + 120 * progress * progress;
    let s = 0;
    for (const interval of chord) {
      const f = rootFreq * interval;
      // Slight pitch wobble (LFO)
      const wobble = 1 + Math.sin(pi2 * 5.5 * t) * 0.006;
      s += saw(t, f * wobble, 9) * 0.3;
    }
    // Noise swell  
    const noiseEnv = Math.min(t * 4, 1) * Math.exp(-Math.max(0, t - 0.2) * 3);
    s += rnd() * noiseEnv * 0.12;
    // High-freq shimmer on impact
    if (t < 0.06) s += Math.exp(-t * 80) * rnd() * 0.4;
    return env * s * 0.75;
  });
}

// Win: ascending 80s major arpeggio — classic victory jingle  
function win() {
  const ms = 600; const n = dur(ms);
  // C major pentatonic ascending: C4-E4-G4-B4-C5
  const notes = [261.63, 329.63, 392.0, 493.88, 523.25];
  const noteDur = 0.1;
  return Float32Array.from({ length: n }, (_, i) => {
    const t = i / SR;
    let s = 0;
    for (let k = 0; k < notes.length; k++) {
      const start = k * noteDur;
      const dt = t - start;
      if (dt < 0 || dt > 0.45) continue;
      const env = adsr(dt, 0.006, 0.05, 0.6, 0.12, 0.45);
      const f = notes[k];
      // Rich 80s pad: saw + pulse detuned slightly
      s += env * (
        saw(t, f, 10) * 0.35 +
        pulse(t, f * 1.003, 0.28, 8) * 0.3 +
        tri(t, f * 2) * 0.15
      ) * 0.55;
    }
    // Shimmer tail
    const shimmer = t > 0.38 ? Math.exp(-(t - 0.38) * 6) * rnd() * 0.05 : 0;
    return s + shimmer;
  });
}

// Lose: descending 80s minor chord — melancholy synth drop
function lose() {
  const ms = 500; const n = dur(ms);
  const notes = [329.63, 261.63, 207.65]; // E4-C4-G#3 descending minor
  const noteDur = 0.14;
  return Float32Array.from({ length: n }, (_, i) => {
    const t = i / SR;
    let s = 0;
    for (let k = 0; k < notes.length; k++) {
      const start = k * noteDur;
      const dt = t - start;
      if (dt < 0 || dt > 0.38) continue;
      const env = adsr(dt, 0.008, 0.06, 0.5, 0.12, 0.38);
      s += env * (saw(t, notes[k], 8) * 0.4 + tri(t, notes[k] * 0.5) * 0.2) * 0.55;
    }
    return s;
  });
}

// Button: short square tap — crisp UI click
function buttonTap() {
  const ms = 45; const n = dur(ms);
  return Float32Array.from({ length: n }, (_, i) => {
    const t = i / SR;
    const env = adsr(t, 0.001, 0.015, 0.15, 0.02, ms / 1000);
    return env * (sqr(t, 680, 6) * 0.5 + rnd() * 0.1) * 0.45;
  });
}

// Notification: neon double-chirp — 80s pager beep
function notification() {
  const ms = 200; const n = dur(ms);
  function chirp(t, offset) {
    const dt = t - offset;
    if (dt < 0 || dt > 0.08) return 0;
    const env = adsr(dt, 0.005, 0.015, 0.5, 0.025, 0.08);
    return env * (pulse(t, 880, 0.25, 8) * 0.55 + tri(t, 1320) * 0.25) * 0.55;
  }
  return Float32Array.from({ length: n }, (_, i) => {
    const t = i / SR;
    return chirp(t, 0) + chirp(t, 0.095);
  });
}

// Card flip: sawtooth swish — crisp paper edge
function cardFlip() {
  const ms = 75; const n = dur(ms);
  return Float32Array.from({ length: n }, (_, i) => {
    const t = i / SR;
    const env = Math.exp(-t * 48);
    const freq = 2800 - 1800 * (t / (ms / 1000));
    return env * (rnd() * 0.55 + saw(t, freq, 5) * 0.3 + tri(t, freq * 0.5) * 0.15) * 0.6;
  });
}

// Achievement unlock: ascending 80s arpeggio stab — premium feel
function achievementUnlock() {
  const ms = 480; const n = dur(ms);
  // Ascending major 7th: C4-E4-G4-B4 with echo
  const notes = [261.63, 329.63, 392.0, 493.88];
  const noteDur = 0.08;
  return Float32Array.from({ length: n }, (_, i) => {
    const t = i / SR;
    let s = 0;
    for (let k = 0; k < notes.length; k++) {
      const start = k * noteDur;
      const dt = t - start;
      if (dt < 0 || dt > 0.35) continue;
      const env = adsr(dt, 0.004, 0.04, 0.55, 0.1, 0.35);
      s += env * (
        pulse(t, notes[k], 0.3, 8) * 0.45 +
        saw(t, notes[k], 9) * 0.3 +
        tri(t, notes[k] * 2) * 0.1
      ) * 0.6;
    }
    // Trailing shimmer
    const shimmer = t > 0.3 ? Math.exp(-(t - 0.3) * 8) * rnd() * 0.06 : 0;
    return s + shimmer;
  });
}

// Level up: ascending octave fanfare — triumphant 80s stab
function levelUp() {
  const ms = 650; const n = dur(ms);
  const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 784.0]; // C-E-G-C-E-G
  const noteDur = 0.085;
  return Float32Array.from({ length: n }, (_, i) => {
    const t = i / SR;
    let s = 0;
    for (let k = 0; k < notes.length; k++) {
      const start = k * noteDur;
      const dt = t - start;
      if (dt < 0 || dt > 0.42) continue;
      const env = adsr(dt, 0.005, 0.05, 0.65, 0.1, 0.42);
      s += env * (
        saw(t, notes[k], 10) * 0.38 +
        pulse(t, notes[k] * 1.002, 0.25, 8) * 0.3 +
        tri(t, notes[k] * 2) * 0.12
      ) * 0.52;
    }
    return s;
  });
}

// ── Write files ───────────────────────────────────────────────────────────────
fs.mkdirSync(OUT_DIR, { recursive: true });

const sounds = {
  'deal.wav':               deal(),
  'chip_click.wav':         chipClick(),
  'chip_collect.wav':       chipCollect(),
  'fold.wav':               fold(),
  'check.wav':              check(),
  'call.wav':               call(),
  'raise.wav':              raise(),
  'allin.wav':              allIn(),
  'win.wav':                win(),
  'lose.wav':               lose(),
  'button.wav':             buttonTap(),
  'notification.wav':       notification(),
  'card_flip.wav':          cardFlip(),
  'achievement_unlock.wav': achievementUnlock(),
  'level_up.wav':           levelUp(),
};

for (const [name, samples] of Object.entries(sounds)) {
  const buf = makeWav(Array.from(samples));
  fs.writeFileSync(path.join(OUT_DIR, name), buf);
  console.log(`✓ ${name} (${(buf.length / 1024).toFixed(1)} KB)`);
}

console.log(`\n✅ ${Object.keys(sounds).length} synthwave sounds written to ${OUT_DIR}`);
