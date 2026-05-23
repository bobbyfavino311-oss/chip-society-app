/**
 * CHIP SOCIETY — Music Engine v3
 *
 * Late-night luxury lounge groove — smooth, rhythmic, premium.
 * 85 BPM trap-inspired beat: 808 kick, subtle snare, hi-hats,
 * rolling bass groove. Never overpowers gameplay audio.
 *
 * Uses the Web Audio "lookahead scheduler" pattern for tight timing.
 * All sound is synthesized — no audio files needed.
 *
 * configure(opts)    — sync volume/mute from SoundContext.
 * play()             — start groove when a game begins.
 * stop()             — graceful fade-out.
 * setIntensity(lvl)  — shift groove energy based on game state.
 */

import { Platform } from 'react-native';

// ── Runtime state ─────────────────────────────────────────────────────────────

let _vol     = 0.40;
let _muted   = false;
let _session = 0;
let _active: number | null = null;
let _intensity: 'normal' | 'tense' | 'showdown' = 'normal';

// ── Scheduler state ───────────────────────────────────────────────────────────

const BPM            = 85;
const BEAT           = 60 / BPM;          // seconds per quarter note
const EIGHTH         = BEAT / 2;          // seconds per 8th note
const LOOKAHEAD_MS   = 50;               // setTimeout interval
const SCHEDULE_AHEAD = 0.13;             // how far ahead to schedule (seconds)

let _ctx:          AudioContext | null = null;
let _masterGain:   GainNode    | null = null;
let _nextNoteTime  = 0;
let _currentStep   = 0;   // 0..7 (eight 8th-note steps per bar)
let _schedTimer:   ReturnType<typeof setTimeout> | null = null;

// ── Pre-generated noise buffers (created once per play session) ───────────────

let _snareBuffer: AudioBuffer | null = null;
let _hihatBuffer: AudioBuffer | null = null;

// ── Internal AudioContext helper ──────────────────────────────────────────────

function getCtx(): AudioContext | null {
  if (Platform.OS !== 'web') return null;
  try {
    if (typeof window === 'undefined') return null;
    const Win = window as Window & {
      AudioContext?: typeof AudioContext;
      webkitAudioContext?: typeof AudioContext;
    };
    const Cls = Win.AudioContext ?? Win.webkitAudioContext;
    if (!Cls) return null;
    if (!_ctx) _ctx = new Cls();
    if (_ctx.state === 'suspended') void _ctx.resume();
    return _ctx;
  } catch { return null; }
}

// ── Percussion primitives ─────────────────────────────────────────────────────

/** 808-style kick: sine sweep 150 → 45 Hz, punchy but smooth */
function kick(ctx: AudioContext, dest: AudioNode, t: number, vol: number) {
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, t);
  osc.frequency.exponentialRampToValueAtTime(44, t + 0.38);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(vol * 0.88, t + 0.007);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.48);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(t);
  osc.stop(t + 0.50);
  osc.onended = () => { try { osc.disconnect(); gain.disconnect(); } catch {} };
}

/** Clap/snare: bandpass noise burst */
function snare(ctx: AudioContext, dest: AudioNode, t: number, vol: number) {
  if (!_snareBuffer) return;
  const src    = ctx.createBufferSource();
  src.buffer   = _snareBuffer;
  const filter = ctx.createBiquadFilter();
  filter.type  = 'bandpass';
  filter.frequency.value = 1100;
  filter.Q.value = 0.65;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol * 0.30, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  src.start(t);
  src.stop(t + 0.14);
  src.onended = () => { try { src.disconnect(); filter.disconnect(); gain.disconnect(); } catch {} };
}

/** Closed hi-hat: highpass noise burst */
function hihat(ctx: AudioContext, dest: AudioNode, t: number, vol: number) {
  if (!_hihatBuffer) return;
  const src    = ctx.createBufferSource();
  src.buffer   = _hihatBuffer;
  const filter = ctx.createBiquadFilter();
  filter.type  = 'highpass';
  filter.frequency.value = 7500;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol * 0.10, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.050);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  src.start(t);
  src.stop(t + 0.06);
  src.onended = () => { try { src.disconnect(); filter.disconnect(); gain.disconnect(); } catch {} };
}

/** Bass note: smooth sine, medium attack */
function bass(ctx: AudioContext, dest: AudioNode, t: number, freq: number, vol: number, dur: number) {
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(vol, t + 0.035);
  gain.gain.setValueAtTime(vol, t + dur - 0.07);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(t);
  osc.stop(t + dur + 0.01);
  osc.onended = () => { try { osc.disconnect(); gain.disconnect(); } catch {} };
}

// ── Beat pattern ──────────────────────────────────────────────────────────────
//
//  Step  Beat  Element
//   0     1    Kick + Hi-hat
//   1    1.5   Hi-hat (offbeat)
//   2     2    Snare + Hi-hat
//   3    2.5   Hi-hat (offbeat)
//   4     3    Kick + Hi-hat  (+ 2nd kick for tense)
//   5    3.5   Hi-hat (offbeat)
//   6     4    Snare + Hi-hat
//   7    4.5   Hi-hat (offbeat)  ← last 8th of bar
//
// Bass groove (D2 = 73.4 Hz, A1 = 55.0 Hz, E2 = 82.4 Hz):
//  Steps 0-3: D2 walking to A1
//  Steps 4-7: A1 walking back to D2

const BASS_FREQS = [73.4, 65.4, 55.0, 58.3, 55.0, 58.3, 65.4, 73.4] as const;

function scheduleStep(step: number, t: number) {
  const ctx = _ctx;
  const dest = _masterGain;
  if (!ctx || !dest) return;

  const vol = _muted ? 0 : 1;

  if (_intensity === 'showdown') {
    // Half-time feel: only kick on step 0, deep snare on step 4, no hi-hats
    if (step === 0) kick(ctx, dest, t, vol * 0.55);
    if (step === 4) snare(ctx, dest, t, vol * 0.22);
    // Sub-bass pulse every bar
    if (step === 0) bass(ctx, dest, t, 36.7, vol * 0.18, BEAT * 2);
    return;
  }

  // ── Kick (beats 1 and 3) ────────────────────────────────────────────────
  if (step === 0) kick(ctx, dest, t, vol * 0.55);
  if (step === 4) kick(ctx, dest, t, vol * (_intensity === 'tense' ? 0.62 : 0.50));

  // ── Snare (beats 2 and 4) ───────────────────────────────────────────────
  if (step === 2) snare(ctx, dest, t, vol * 0.85);
  if (step === 6) snare(ctx, dest, t, vol * 0.85);

  // ── Hi-hat pattern ───────────────────────────────────────────────────────
  // All 8th notes; downbeat hats slightly louder
  const hatVol = step % 2 === 0 ? 0.9 : 0.5;
  hihat(ctx, dest, t, vol * hatVol * (_intensity === 'tense' ? 1.25 : 1.0));

  // Ghost hi-hat triplet on tense (16th note before snare)
  if (_intensity === 'tense' && (step === 1 || step === 5)) {
    hihat(ctx, dest, t + EIGHTH * 0.5, vol * 0.25);
  }

  // ── Bass groove ──────────────────────────────────────────────────────────
  if (step % 2 === 0) {
    const freq = BASS_FREQS[step];
    const bVol = vol * (_intensity === 'tense' ? 0.20 : 0.16);
    bass(ctx, dest, t, freq, bVol, BEAT * 0.85);
  }
}

// ── Lookahead scheduler ───────────────────────────────────────────────────────

function runScheduler(sid: number) {
  if (_active !== sid) return;
  const ctx = getCtx();
  if (!ctx) return;

  while (_nextNoteTime < ctx.currentTime + SCHEDULE_AHEAD) {
    scheduleStep(_currentStep, _nextNoteTime);
    _nextNoteTime += EIGHTH;
    _currentStep   = (_currentStep + 1) % 8;
  }
  _schedTimer = setTimeout(() => runScheduler(sid), LOOKAHEAD_MS);
}

// ── Teardown ──────────────────────────────────────────────────────────────────

function teardown() {
  if (_schedTimer) { clearTimeout(_schedTimer); _schedTimer = null; }
  if (_masterGain) { try { _masterGain.disconnect(); } catch {} _masterGain = null; }
  _snareBuffer = null;
  _hihatBuffer = null;
  _active      = null;
}

// ── Public API ────────────────────────────────────────────────────────────────

export const MusicEngine = {

  configure(opts: { volume?: number; muted?: boolean }) {
    if (opts.volume !== undefined) _vol   = Math.max(0, Math.min(1, opts.volume));
    if (opts.muted  !== undefined) _muted = opts.muted;
    if (_masterGain && _ctx) {
      _masterGain.gain.setTargetAtTime(_muted ? 0 : _vol, _ctx.currentTime, 0.4);
    }
  },

  play() {
    if (_active !== null) return;
    if (_muted) return;
    const ctx = getCtx();
    if (!ctx) return;

    const sid = ++_session;
    _active = sid;
    _intensity = 'normal';
    _currentStep = 0;

    // Pre-generate noise buffers (reused every beat)
    const snareLen = Math.ceil(ctx.sampleRate * 0.15);
    _snareBuffer   = ctx.createBuffer(1, snareLen, ctx.sampleRate);
    const sd       = _snareBuffer.getChannelData(0);
    for (let i = 0; i < snareLen; i++) sd[i] = Math.random() * 2 - 1;

    const hihatLen = Math.ceil(ctx.sampleRate * 0.06);
    _hihatBuffer   = ctx.createBuffer(1, hihatLen, ctx.sampleRate);
    const hd       = _hihatBuffer.getChannelData(0);
    for (let i = 0; i < hihatLen; i++) hd[i] = Math.random() * 2 - 1;

    // Master gain — 3-second fade-in so groove enters smoothly
    _masterGain = ctx.createGain();
    _masterGain.gain.setValueAtTime(0, ctx.currentTime);
    _masterGain.gain.linearRampToValueAtTime(_vol, ctx.currentTime + 3.0);
    _masterGain.connect(ctx.destination);

    // Kick off the scheduler one beat from now (lets fade-in settle)
    _nextNoteTime = ctx.currentTime + BEAT;
    runScheduler(sid);
  },

  stop() {
    if (_active === null) return;
    if (_schedTimer) { clearTimeout(_schedTimer); _schedTimer = null; }
    // Smooth 1.5 s fade-out — groove trails off naturally
    if (_masterGain && _ctx) {
      _masterGain.gain.setTargetAtTime(0, _ctx.currentTime, 0.4);
    }
    const sid = _active;
    _active = null;
    setTimeout(() => { if (_active !== sid) teardown(); }, 2000);
  },

  setIntensity(level: 'normal' | 'tense' | 'showdown') {
    _intensity = level;
    if (!_masterGain || !_ctx) return;
    const t = _ctx.currentTime;
    const volMult = { normal: 1.00, tense: 1.18, showdown: 0.70 };
    if (!_muted) {
      _masterGain.gain.setTargetAtTime(_vol * volMult[level], t, 0.6);
    }
  },
};
