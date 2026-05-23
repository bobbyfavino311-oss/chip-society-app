/**
 * CHIP SOCIETY — Music Engine
 *
 * Cinematic heist-thriller atmosphere using Web Audio API.
 * All sine waves — zero sawtooth/retro electronics.
 * D-minor voicing: sub-bass rumble + dark pad + irregular heartbeat pulse.
 *
 * configure() — called by SoundContext whenever volume/mute settings change.
 * play()      — start music when a game begins.
 * stop()      — fade out and clean up.
 * setIntensity() — smoothly transition between mood layers.
 */

import { Platform } from 'react-native';

// ── Runtime state ─────────────────────────────────────────────────────────────

let _vol    = 0.40;
let _muted  = false;
let _session = 0;
let _active: number | null = null;

// ── Persistent Audio graph ────────────────────────────────────────────────────

let _ctx:    AudioContext     | null = null;
let _master: GainNode         | null = null;
let _filter: BiquadFilterNode | null = null;
let _padOscs: Array<{ osc: OscillatorNode; gainNode: GainNode }> = [];
let _pulseTimer: ReturnType<typeof setTimeout> | null = null;
let _swellTimer: ReturnType<typeof setTimeout> | null = null;

// ── D-minor cinematic voicing ─────────────────────────────────────────────────
//
//  D1  36.7 Hz — sub-bass rumble (felt more than heard)
//  D2  73.4 Hz — bass foundation
//  D2+ 74.0 Hz — slight chorus detune
//  F2  87.3 Hz — minor third (darkness)
//  A2 110.0 Hz — perfect fifth (changes to A♭2 103.8 Hz at showdown)
//  D3 146.8 Hz — octave breathe
//  D3+ 147.5 Hz — subtle chorus shimmer
//
const PADS = [
  { freq: 36.7,  baseGain: 0.09 }, // sub-bass
  { freq: 73.4,  baseGain: 0.13 }, // D2
  { freq: 74.0,  baseGain: 0.06 }, // D2 chorus
  { freq: 87.3,  baseGain: 0.07 }, // F2 (minor 3rd)
  { freq: 110.0, baseGain: 0.05 }, // A2 (5th) — swapped in showdown
  { freq: 146.8, baseGain: 0.04 }, // D3
  { freq: 147.5, baseGain: 0.03 }, // D3 chorus
] as const;

const FIFTH_IDX = 4; // index of the 5th — its frequency changes per intensity

// ── Internal helpers ──────────────────────────────────────────────────────────

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

function teardown() {
  if (_pulseTimer) { clearTimeout(_pulseTimer); _pulseTimer = null; }
  if (_swellTimer) { clearTimeout(_swellTimer); _swellTimer = null; }
  for (const { osc, gainNode } of _padOscs) {
    try { osc.stop(); osc.disconnect(); } catch {}
    try { gainNode.disconnect(); } catch {}
  }
  _padOscs = [];
  if (_filter) { try { _filter.disconnect(); } catch {} _filter = null; }
  if (_master) { try { _master.disconnect(); } catch {} _master = null; }
  _active = null;
}

/** Short bass impulse — used for heartbeat lub/dub */
function impulse(ctx: AudioContext, dest: AudioNode, freq: number, vol: number, dur: number, delay = 0) {
  const t   = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const g   = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(_muted ? 0 : vol, t + 0.025);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g);
  g.connect(dest);
  osc.start(t);
  osc.stop(t + dur + 0.02);
  osc.onended = () => { try { osc.disconnect(); g.disconnect(); } catch {} };
}

// ── Public API ────────────────────────────────────────────────────────────────

export const MusicEngine = {

  configure(opts: { volume?: number; muted?: boolean }) {
    if (opts.volume !== undefined) _vol   = Math.max(0, Math.min(1, opts.volume));
    if (opts.muted  !== undefined) _muted = opts.muted;
    if (_master && _ctx) {
      _master.gain.setTargetAtTime(_muted ? 0 : _vol, _ctx.currentTime, 0.5);
    }
  },

  play() {
    if (_active !== null) return;
    if (_muted) return;
    const ctx = getCtx();
    if (!ctx) return;

    const sid = ++_session;
    _active = sid;

    // Master gain — 8-second slow fade-in for cinematic entrance
    _master = ctx.createGain();
    _master.gain.setValueAtTime(0, ctx.currentTime);
    _master.gain.linearRampToValueAtTime(_vol, ctx.currentTime + 8);
    _master.connect(ctx.destination);

    // Dark low-pass filter — deliberately narrow for that underground-casino feel
    _filter = ctx.createBiquadFilter();
    _filter.type = 'lowpass';
    _filter.frequency.setValueAtTime(420, ctx.currentTime);
    _filter.Q.value = 0.6;
    _filter.connect(_master);

    // Very slow, barely perceptible filter breath — 0.04 Hz ≈ 25 s period
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 80; // ±80 Hz — subtle, not sweepy
    lfo.type = 'sine';
    lfo.frequency.value = 0.04;
    lfo.connect(lfoGain);
    lfoGain.connect(_filter.frequency);
    lfo.start();
    // Store lfo so teardown can stop it
    const lfoEntry = { osc: lfo, gainNode: lfoGain };

    // Build the D-minor pad oscillators
    _padOscs = [lfoEntry];
    for (const { freq, baseGain } of PADS) {
      const osc  = ctx.createOscillator();
      const g    = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      g.gain.value = baseGain;
      osc.connect(g);
      g.connect(_filter);
      osc.start();
      _padOscs.push({ osc, gainNode: g });
    }

    // ── Irregular heartbeat pulse (lub-dub pattern) ───────────────────────────
    const heartbeat = () => {
      if (_active !== sid) return;
      const c = getCtx();
      if (!c || !_master) return;
      // lub — primary beat
      impulse(c, _master, 58, 0.16, 0.22);
      // dub — softer echo, 155 ms later
      impulse(c, _master, 72, 0.09, 0.16, 0.155);
      // next heartbeat: 1050–1450 ms (irregular, like real tension)
      const next = 1050 + Math.random() * 400;
      _pulseTimer = setTimeout(heartbeat, next);
    };
    // First heartbeat after pads have had time to establish
    _pulseTimer = setTimeout(heartbeat, 3000);

    // ── Occasional sub-bass swell (Inception-style rumble) ───────────────────
    const swell = () => {
      if (_active !== sid) return;
      const c = getCtx();
      if (!c || !_master) return;
      const t = c.currentTime;
      const swellOsc  = c.createOscillator();
      const swellGain = c.createGain();
      swellOsc.type = 'sine';
      swellOsc.frequency.setValueAtTime(28, t);
      swellOsc.frequency.exponentialRampToValueAtTime(52, t + 5);
      swellGain.gain.setValueAtTime(0, t);
      swellGain.gain.linearRampToValueAtTime(_muted ? 0 : 0.12, t + 2.5);
      swellGain.gain.linearRampToValueAtTime(0, t + 8);
      swellOsc.connect(swellGain);
      swellGain.connect(_master);
      swellOsc.start(t);
      swellOsc.stop(t + 9);
      swellOsc.onended = () => { try { swellOsc.disconnect(); swellGain.disconnect(); } catch {} };
      // Next swell: 12–22 seconds
      _swellTimer = setTimeout(swell, 12000 + Math.random() * 10000);
    };
    _swellTimer = setTimeout(swell, 8000 + Math.random() * 6000);
  },

  stop() {
    if (_active === null) return;
    if (_pulseTimer) { clearTimeout(_pulseTimer); _pulseTimer = null; }
    if (_swellTimer) { clearTimeout(_swellTimer); _swellTimer = null; }
    // Graceful 2.5-second cinematic fade-out
    if (_master && _ctx) {
      _master.gain.setTargetAtTime(0, _ctx.currentTime, 0.7);
    }
    const sid = _active;
    _active = null;
    setTimeout(() => { if (_active !== sid) teardown(); }, 3000);
  },

  setIntensity(level: 'normal' | 'tense' | 'showdown') {
    if (!_filter || !_ctx) return;
    const t = _ctx.currentTime;

    // Filter frequency per mood
    const filterFreqs = { normal: 420, tense: 620, showdown: 300 };
    _filter.frequency.setTargetAtTime(filterFreqs[level], t, 1.2);

    // Master volume adjustment (subtle — never dominate SFX)
    if (_master && !_muted) {
      const volMult = { normal: 1.00, tense: 1.20, showdown: 0.80 };
      _master.gain.setTargetAtTime(_vol * volMult[level], t, 1.5);
    }

    // Fifth interval switch: perfect fifth (110 Hz) ↔ tritone (103.8 Hz)
    // Tritone = "devil's interval" — maximum cinematic dread for showdowns
    const fifthEntry = _padOscs[FIFTH_IDX + 1]; // +1 because [0] is the LFO
    if (fifthEntry) {
      const fifthFreqs = { normal: 110.0, tense: 110.0, showdown: 103.8 };
      fifthEntry.osc.frequency.setTargetAtTime(fifthFreqs[level], t, 0.8);
    }
  },
};
