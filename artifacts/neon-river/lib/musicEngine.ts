/**
 * CHIP SOCIETY — Music Engine
 *
 * Procedurally generates ambient synthwave music using Web Audio API.
 * Native iOS: silent for now (would need bundled audio file).
 *
 * Call configure() whenever volume/mute settings change.
 * Call play() when a game starts, stop() when it ends.
 * Call setIntensity() to transition between moods.
 */

import { Platform } from 'react-native';

// ── Runtime state ─────────────────────────────────────────────────────────────

let _vol     = 0.40;
let _muted   = false;

/** Non-null while music is playing. Increments on each play() to cancel stale pulses. */
let _session = 0;
let _active: number | null = null;

// ── Persistent Audio nodes ────────────────────────────────────────────────────

let _ctx:    AudioContext | null = null;
let _master: GainNode     | null = null;
let _filter: BiquadFilterNode | null = null;
let _lfo:    OscillatorNode | null = null;
let _padOscs: OscillatorNode[] = [];
let _pulseTimer: ReturnType<typeof setTimeout> | null = null;

// ── Pad configuration ─────────────────────────────────────────────────────────

const PADS = [
  { freq: 109.8, type: 'sawtooth' as OscillatorType, gain: 0.07 },
  { freq: 110.0, type: 'sawtooth' as OscillatorType, gain: 0.07 },
  { freq: 110.4, type: 'sawtooth' as OscillatorType, gain: 0.05 },
  { freq: 220.0, type: 'sine'     as OscillatorType, gain: 0.04 },
  { freq: 329.6, type: 'sine'     as OscillatorType, gain: 0.02 }, // E4 — adds tension
];

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
  for (const osc of _padOscs) { try { osc.stop(); osc.disconnect(); } catch {} }
  _padOscs = [];
  if (_lfo)    { try { _lfo.stop();     _lfo.disconnect();    } catch {} _lfo    = null; }
  if (_filter) { try { _filter.disconnect();                  } catch {} _filter = null; }
  if (_master) { try { _master.disconnect();                  } catch {} _master = null; }
  _active = null;
}

// ── Public API ────────────────────────────────────────────────────────────────

export const MusicEngine = {

  configure(opts: { volume?: number; muted?: boolean }) {
    if (opts.volume !== undefined) _vol   = Math.max(0, Math.min(1, opts.volume));
    if (opts.muted  !== undefined) _muted = opts.muted;
    if (_master && _ctx) {
      _master.gain.setTargetAtTime(_muted ? 0 : _vol, _ctx.currentTime, 0.4);
    }
  },

  play() {
    if (_active !== null) return; // already running
    if (_muted) return;
    const ctx = getCtx();
    if (!ctx) return;

    const sid = ++_session;
    _active = sid;

    // Master gain — slow fade-in over 5 seconds for subtle entrance
    _master = ctx.createGain();
    _master.gain.setValueAtTime(0, ctx.currentTime);
    _master.gain.linearRampToValueAtTime(_vol, ctx.currentTime + 5);
    _master.connect(ctx.destination);

    // Low-pass filter — muffled atmospheric texture
    _filter = ctx.createBiquadFilter();
    _filter.type = 'lowpass';
    _filter.frequency.setValueAtTime(480, ctx.currentTime);
    _filter.Q.value = 0.85;
    _filter.connect(_master);

    // Slow LFO to animate filter cutoff — 0.06 Hz ≈ 17 s period
    _lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 240; // ± 240 Hz sweep
    _lfo.type = 'sine';
    _lfo.frequency.value = 0.06;
    _lfo.connect(lfoGain);
    lfoGain.connect(_filter.frequency);
    _lfo.start();

    // Pad oscillators — thick, detuned drone
    _padOscs = [];
    for (const { freq, type, gain: gv } of PADS) {
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      osc.type           = type;
      osc.frequency.value = freq;
      g.gain.value       = gv;
      osc.connect(g);
      g.connect(_filter);
      osc.start();
      _padOscs.push(osc);
    }

    // Rhythmic bass pulse at ~80 BPM (750 ms)
    const pulse = () => {
      if (_active !== sid) return;
      const c = getCtx();
      if (!c || !_master) return;
      const t = c.currentTime;
      const bassOsc  = c.createOscillator();
      const bassGain = c.createGain();
      bassOsc.type = 'sine';
      bassOsc.frequency.value = 55; // A1
      bassGain.gain.setValueAtTime(0, t);
      bassGain.gain.linearRampToValueAtTime(_muted ? 0 : 0.13, t + 0.05);
      bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.50);
      bassOsc.connect(bassGain);
      bassGain.connect(_master);
      bassOsc.start(t);
      bassOsc.stop(t + 0.55);
      bassOsc.onended = () => { try { bassOsc.disconnect(); bassGain.disconnect(); } catch {} };
      _pulseTimer = setTimeout(pulse, 750);
    };
    // Delay first pulse while pads establish
    _pulseTimer = setTimeout(pulse, 1600);
  },

  stop() {
    if (_active === null) return;
    if (_pulseTimer) { clearTimeout(_pulseTimer); _pulseTimer = null; }
    // Graceful fade-out
    if (_master && _ctx) {
      _master.gain.setTargetAtTime(0, _ctx.currentTime, 0.5);
    }
    const sid = _active;
    _active = null;
    setTimeout(() => { if (_active !== sid) teardown(); }, 2200);
  },

  setIntensity(level: 'normal' | 'tense' | 'showdown') {
    if (!_filter || !_ctx || !_master) return;
    const t = _ctx.currentTime;
    const filterFreqs = { normal: 480,  tense: 980,  showdown: 260  };
    const gainMults   = { normal: 1.00, tense: 1.28, showdown: 0.72 };
    _filter.frequency.setTargetAtTime(filterFreqs[level], t, 0.9);
    if (!_muted) {
      _master.gain.setTargetAtTime(_vol * gainMults[level], t, 1.2);
    }
  },
};
