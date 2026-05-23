/**
 * CHIP SOCIETY — Sound Engine
 *
 * Web:    Web Audio API (oscillators + noise) — cinematic casino style
 * Native: expo-av with bundled WAV files + haptics
 *
 * Volume / mute / FX state injected by SoundProvider via configure().
 * DO NOT touch background music here — only SFX.
 */

import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';

// ── Runtime config ────────────────────────────────────────────────────────────

let _volume    = 0.72;
let _muted     = false;
let _fxEnabled = true;   // SFX-specific toggle (separate from music / master mute)
let _vibration = true;

// ── Audio session setup (native) ─────────────────────────────────────────────

let _audioReady = false;
async function ensureAudio() {
  if (_audioReady) return;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
    _audioReady = true;
  } catch {}
}

// ── Static asset map ─────────────────────────────────────────────────────────

const ASSETS = {
  deal:               require('../assets/sounds/deal.wav'),
  chip_click:         require('../assets/sounds/chip_click.wav'),
  chip_collect:       require('../assets/sounds/chip_collect.wav'),
  fold:               require('../assets/sounds/fold.wav'),
  check:              require('../assets/sounds/check.wav'),
  call:               require('../assets/sounds/call.wav'),
  raise:              require('../assets/sounds/raise.wav'),
  allin:              require('../assets/sounds/allin.wav'),
  win:                require('../assets/sounds/win.wav'),
  lose:               require('../assets/sounds/lose.wav'),
  button:             require('../assets/sounds/button.wav'),
  notification:       require('../assets/sounds/notification.wav'),
  card_flip:          require('../assets/sounds/card_flip.wav'),
  achievement_unlock: require('../assets/sounds/achievement_unlock.wav'),
  level_up:           require('../assets/sounds/level_up.wav'),
  claim_sound:        require('../assets/sounds/claim_sound.mp3'),
} as const;

type SoundName = keyof typeof ASSETS;

function playNative(name: SoundName) {
  if (_muted || !_fxEnabled || _volume <= 0) return;
  void (async () => {
    try {
      await ensureAudio();
      const { sound } = await Audio.Sound.createAsync(ASSETS[name], {
        volume: Math.min(1, _volume),
        shouldPlay: true,
      });
      sound.setOnPlaybackStatusUpdate(status => {
        if (status.isLoaded && status.didJustFinish) {
          void sound.unloadAsync();
        }
      });
    } catch {}
  })();
}

// ── Web Audio helpers ─────────────────────────────────────────────────────────

let _ctx: AudioContext | null = null;

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
  } catch {
    return null;
  }
}

// Sine / oscillator layer with optional frequency glide
function tone(
  freq: number,
  type: OscillatorType,
  duration: number,
  vol = 0.3,
  delay = 0,
  freqEnd?: number,
  attack = 0.005,
) {
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime + delay;
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (freqEnd !== undefined) osc.frequency.exponentialRampToValueAtTime(freqEnd, t + duration);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(vol * _volume, t + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

// Band-pass filtered white noise burst
function noise(
  duration: number,
  vol  = 0.12,
  loFreq = 200,
  hiFreq = 3000,
  delay = 0,
  attack = 0.003,
) {
  const ctx = getCtx();
  if (!ctx) return;
  const sr  = ctx.sampleRate;
  const len = Math.ceil(sr * duration);
  const buf = ctx.createBuffer(1, len, sr);
  const d   = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src  = ctx.createBufferSource();
  src.buffer = buf;
  const filt = ctx.createBiquadFilter();
  filt.type = 'bandpass';
  filt.frequency.value = (loFreq + hiFreq) / 2;
  filt.Q.value = 1.0;
  const gain = ctx.createGain();
  const t = ctx.currentTime + delay;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(vol * _volume, t + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  src.connect(filt);
  filt.connect(gain);
  gain.connect(ctx.destination);
  src.start(t);
  src.stop(t + duration + 0.02);
}

// ── Haptic helpers ────────────────────────────────────────────────────────────

function haptic(style: Haptics.ImpactFeedbackStyle) {
  if (_vibration) void Haptics.impactAsync(style);
}
function hapticNotif(type: Haptics.NotificationFeedbackType) {
  if (_vibration) void Haptics.notificationAsync(type);
}
function hapticSel() {
  if (_vibration) void Haptics.selectionAsync();
}

// ── Guard: web SFX gated on both _muted and _fxEnabled ───────────────────────

function sfxOff() { return _muted || !_fxEnabled; }

// ── Public API ────────────────────────────────────────────────────────────────

export const SoundEngine = {

  configure(opts: {
    masterVolume?: number;
    effectsVolume?: number;
    muted?: boolean;
    vibration?: boolean;
    fxEnabled?: boolean;
  }) {
    if (opts.masterVolume !== undefined && opts.effectsVolume !== undefined) {
      _volume = opts.masterVolume * opts.effectsVolume;
    }
    if (opts.muted     !== undefined) _muted     = opts.muted;
    if (opts.vibration !== undefined) _vibration = opts.vibration;
    if (opts.fxEnabled !== undefined) _fxEnabled = opts.fxEnabled;
  },

  /** Standalone SFX on/off toggle — does NOT touch background music. */
  setFxEnabled(enabled: boolean) {
    _fxEnabled = enabled;
  },

  getFxEnabled() { return _fxEnabled; },

  // ── Card deal ──────────────────────────────────────────────────────────────
  // Fast casino card flick — crisp paper transient with bright tap
  deal() {
    haptic(Haptics.ImpactFeedbackStyle.Light);
    if (sfxOff()) return;
    if (Platform.OS !== 'web') { playNative('deal'); return; }
    // Paper flick transient
    noise(0.030, 0.26, 2500, 14000, 0,     0.001);
    // Body texture
    noise(0.055, 0.14, 400,  3500,  0.018, 0.004);
    // Bright surface tap
    tone(3200, 'sine', 0.022, 0.07, 0.003, undefined, 0.001);
    // Subtle landing thump
    tone(280, 'sine', 0.08, 0.06, 0.035, 180, 0.004);
  },

  // ── Chip click (bet / wheel tick) ─────────────────────────────────────────
  // Resonant clay poker chip — percussive with natural ring
  chip() {
    haptic(Haptics.ImpactFeedbackStyle.Light);
    if (sfxOff()) return;
    if (Platform.OS !== 'web') { playNative('chip_click'); return; }
    // Hard surface impact
    noise(0.016, 0.30, 1200, 9000, 0,     0.001);
    // Resonant fundamental
    tone(1700, 'sine', 0.14, 0.30, 0,     undefined, 0.002);
    // Bright overtone shimmer
    tone(3400, 'sine', 0.09, 0.14, 0.004, undefined, 0.002);
    // Clay body ring
    tone(850,  'sine', 0.20, 0.12, 0.006, undefined, 0.003);
  },

  // ── Chip collect ──────────────────────────────────────────────────────────
  // Stack of chips being swept in — satisfying cascade
  chipCollect() {
    haptic(Haptics.ImpactFeedbackStyle.Medium);
    if (sfxOff()) return;
    if (Platform.OS !== 'web') { playNative('chip_collect'); return; }
    tone(900,  'sine', 0.18, 0.22, 0,    1400, 0.004);
    noise(0.12, 0.12, 600, 4000, 0,      0.006);
    tone(1400, 'sine', 0.12, 0.14, 0.06, 900,  0.004);
    noise(0.08, 0.08, 1500, 6000, 0.08,  0.003);
  },

  // ── Check ─────────────────────────────────────────────────────────────────
  // Light tap — no bet, minimal action
  check() {
    hapticSel();
    if (sfxOff()) return;
    if (Platform.OS !== 'web') { playNative('check'); return; }
    noise(0.025, 0.12, 100, 900, 0,    0.002);
    tone(420, 'sine', 0.065, 0.12, 0,  undefined, 0.003);
    tone(560, 'sine', 0.045, 0.07, 0.02, undefined, 0.004);
  },

  // ── Fold ──────────────────────────────────────────────────────────────────
  // Soft card toss — resigned, quiet
  fold() {
    haptic(Haptics.ImpactFeedbackStyle.Light);
    if (sfxOff()) return;
    if (Platform.OS !== 'web') { playNative('fold'); return; }
    // Paper whisper
    noise(0.12, 0.14, 80,  1000, 0,    0.006);
    // Card settling
    noise(0.07, 0.08, 40,  400,  0.08, 0.010);
    // Soft thud
    tone(200, 'sine', 0.20, 0.12, 0.02, 130, 0.006);
  },

  // ── Call ──────────────────────────────────────────────────────────────────
  // Clean chip slide — composed, matching the raise
  call() {
    haptic(Haptics.ImpactFeedbackStyle.Medium);
    if (sfxOff()) return;
    if (Platform.OS !== 'web') { playNative('call'); return; }
    // Surface slide noise
    noise(0.035, 0.18, 600, 5000, 0,    0.004);
    // Two-chip click
    tone(1400, 'sine', 0.09, 0.22, 0,    undefined, 0.002);
    tone(1800, 'sine', 0.07, 0.15, 0.022, undefined, 0.002);
    noise(0.025, 0.10, 2000, 8000, 0.015, 0.002);
  },

  // ── Raise ─────────────────────────────────────────────────────────────────
  // Heavier, assertive chip stack impact — telegraphs aggression
  raise() {
    haptic(Haptics.ImpactFeedbackStyle.Medium);
    if (sfxOff()) return;
    if (Platform.OS !== 'web') { playNative('raise'); return; }
    // Heavy stack thud
    noise(0.030, 0.32, 200, 2000, 0,    0.002);
    tone(700,  'sine', 0.16, 0.24, 0,    undefined, 0.003);
    tone(1200, 'sine', 0.12, 0.20, 0.03, undefined, 0.003);
    tone(1900, 'sine', 0.09, 0.16, 0.06, undefined, 0.003);
    // Surface scatter
    noise(0.06, 0.16, 2000, 9000, 0.02, 0.002);
  },

  // ── All-in ────────────────────────────────────────────────────────────────
  // Dramatic chip slam — maximum impact, reverberant tail
  allin() {
    haptic(Haptics.ImpactFeedbackStyle.Heavy);
    if (sfxOff()) return;
    if (Platform.OS !== 'web') { playNative('allin'); return; }
    // Primary impact thud
    noise(0.040, 0.40, 80,  2000, 0,    0.001);
    // Chip scatter burst
    noise(0.035, 0.30, 500, 5000, 0.018, 0.002);
    // High scatter shimmer
    noise(0.028, 0.20, 2000, 10000, 0.035, 0.002);
    // Resonant body — cascade of descending tones
    tone(220, 'sine', 0.45, 0.28, 0,    160, 0.003);
    tone(340, 'sine', 0.38, 0.22, 0.04, 220, 0.003);
    tone(500, 'sine', 0.30, 0.18, 0.08, 320, 0.003);
    tone(780, 'sine', 0.22, 0.14, 0.12, 500, 0.003);
    // Reverb-like decay tail
    noise(0.24, 0.07, 200, 2000, 0.14, 0.020);
  },

  // ── Win ───────────────────────────────────────────────────────────────────
  // Premium 3-note ascending chime — elegant casino, NOT slot machine
  win() {
    hapticNotif(Haptics.NotificationFeedbackType.Success);
    if (sfxOff()) return;
    if (Platform.OS !== 'web') { playNative('win'); return; }
    // Clean ascending triad (E-A-E one octave up)
    tone(659,  'sine', 0.32, 0.24, 0,    undefined, 0.006);
    tone(880,  'sine', 0.30, 0.24, 0.18, undefined, 0.006);
    tone(1319, 'sine', 0.40, 0.22, 0.38, undefined, 0.006);
    // Subtle shimmer at the peak
    noise(0.05, 0.04, 3000, 10000, 0.40, 0.008);
    // Resonant decay tail — adds warmth
    tone(659,  'triangle', 0.55, 0.10, 0.55, undefined, 0.010);
    tone(1319, 'triangle', 0.50, 0.08, 0.68, undefined, 0.010);
  },

  // ── Lose ──────────────────────────────────────────────────────────────────
  // Descending tones — muted, respectful
  lose() {
    hapticNotif(Haptics.NotificationFeedbackType.Error);
    if (sfxOff()) return;
    if (Platform.OS !== 'web') { playNative('lose'); return; }
    tone(370, 'sine', 0.32, 0.20, 0,    undefined, 0.008);
    tone(294, 'sine', 0.32, 0.18, 0.18, undefined, 0.008);
    tone(220, 'sine', 0.38, 0.15, 0.38, undefined, 0.008);
    noise(0.05, 0.04, 80, 400, 0.42, 0.010);
  },

  // ── Card flip ─────────────────────────────────────────────────────────────
  // Crisp card reveal — faster transient than deal
  cardFlip() {
    hapticSel();
    if (sfxOff()) return;
    if (Platform.OS !== 'web') { playNative('card_flip'); return; }
    noise(0.038, 0.22, 1800, 12000, 0,     0.001);
    noise(0.050, 0.12, 300,  2500,  0.025, 0.005);
    tone(2600, 'sine', 0.025, 0.08, 0.004, undefined, 0.001);
  },

  // ── Button tap ────────────────────────────────────────────────────────────
  // Subtle premium UI click
  button() {
    hapticSel();
    if (sfxOff()) return;
    if (Platform.OS !== 'web') { playNative('button'); return; }
    noise(0.015, 0.12, 2500, 10000, 0,    0.001);
    tone(1600, 'sine', 0.038, 0.14, 0,    undefined, 0.002);
    tone(2200, 'sine', 0.025, 0.08, 0.006, undefined, 0.002);
  },

  // ── Notification ──────────────────────────────────────────────────────────
  // Clean two-note ping
  notification() {
    hapticNotif(Haptics.NotificationFeedbackType.Success);
    if (sfxOff()) return;
    if (Platform.OS !== 'web') { playNative('notification'); return; }
    tone(1047, 'sine', 0.10, 0.20, 0,    undefined, 0.005);
    tone(1319, 'sine', 0.09, 0.16, 0.10, undefined, 0.005);
  },

  // ── Achievement unlock ────────────────────────────────────────────────────
  achievementUnlock() {
    hapticNotif(Haptics.NotificationFeedbackType.Success);
    if (sfxOff()) return;
    if (Platform.OS !== 'web') { playNative('achievement_unlock'); return; }
    [523, 659, 784, 1047].forEach((f, i) => {
      tone(f, 'sine', 0.28, 0.20 + i * 0.01, i * 0.09, undefined, 0.005);
    });
    noise(0.10, 0.06, 2000, 8000, 0.34, 0.008);
  },

  // ── Level up ─────────────────────────────────────────────────────────────
  levelUp() {
    hapticNotif(Haptics.NotificationFeedbackType.Success);
    if (sfxOff()) return;
    if (Platform.OS !== 'web') { playNative('level_up'); return; }
    [261, 329, 392, 523, 659, 784].forEach((f, i) => {
      tone(f, 'sine', 0.32, 0.22, i * 0.09, undefined, 0.005);
    });
    noise(0.15, 0.08, 2000, 8000, 0.52, 0.010);
  },

  // ── Showdown ──────────────────────────────────────────────────────────────
  // Low cinematic tension hit — used at card reveal
  showdown() {
    haptic(Haptics.ImpactFeedbackStyle.Heavy);
    if (sfxOff()) return;
    if (Platform.OS !== 'web') return;
    tone(70,  'sine', 0.45, 0.22, 0,    50,  0.003);
    tone(130, 'sine', 0.40, 0.18, 0.05, 90,  0.004);
    noise(0.08, 0.14, 50,  600,  0,    0.004);
    noise(0.06, 0.08, 600, 2500, 0.12, 0.008);
  },

  // ── Neon buzz (ambient) ───────────────────────────────────────────────────
  neonBuzz() {
    if (Platform.OS !== 'web' || _muted || !_fxEnabled) return;
    const dur = 0.18 + Math.random() * 0.22;
    tone(60,  'sawtooth', dur, 0.055);
    tone(120, 'sawtooth', dur, 0.028);
    tone(240, 'sawtooth', dur * 0.6, 0.012);
    const cracks = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < cracks; i++) {
      const d   = Math.random() * (dur * 0.8);
      const len = 0.006 + Math.random() * 0.018;
      noise(len, 0.10 + Math.random() * 0.08, 1800, 14000, d);
    }
    if (Math.random() < 0.5) {
      tone(3200 + Math.random() * 1800, 'sine', 0.012, 0.04, Math.random() * dur * 0.5);
    }
  },

  // ── Claim reward ──────────────────────────────────────────────────────────
  /**
   * Pitch-shifted down 5 semitones (rate ≈ 0.749) — premium claim feel.
   * Uses expo-av on both native and web.
   */
  claim() {
    hapticNotif(Haptics.NotificationFeedbackType.Success);
    if (_muted || _volume <= 0) return;
    void (async () => {
      try {
        await ensureAudio();
        const { sound } = await Audio.Sound.createAsync(
          ASSETS.claim_sound,
          {
            shouldPlay:         true,
            volume:             Math.min(1, _volume),
            rate:               0.749,
            shouldCorrectPitch: false,
          },
        );
        sound.setOnPlaybackStatusUpdate(status => {
          if (status.isLoaded && status.didJustFinish) {
            void sound.unloadAsync();
          }
        });
      } catch {}
    })();
  },
};
