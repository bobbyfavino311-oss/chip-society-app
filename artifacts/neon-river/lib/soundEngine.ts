/**
 * CHIP SOCIETY — Sound Engine
 *
 * Web:    Web Audio API (oscillators + noise)
 * Native: expo-av with bundled WAV files + haptics
 *
 * Volume / mute state is injected by SoundProvider via configure().
 */

import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';

// ── Runtime config (set by SoundProvider) ────────────────────────────────────

let _volume = 0.72;
let _muted = false;
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

// ── Static asset map (Metro requires static require calls) ───────────────────

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
} as const;

type SoundName = keyof typeof ASSETS;

function playNative(name: SoundName) {
  if (_muted || _volume <= 0) return;
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

function tone(
  freq: number,
  type: OscillatorType,
  duration: number,
  vol = 0.3,
  delay = 0,
  freqEnd?: number,
) {
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (freqEnd !== undefined) osc.frequency.exponentialRampToValueAtTime(freqEnd, t + duration);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(vol * _volume, t + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duration + 0.01);
}

function noise(duration: number, vol = 0.12, loFreq = 200, hiFreq = 3000, delay = 0) {
  const ctx = getCtx();
  if (!ctx) return;
  const sr = ctx.sampleRate;
  const len = Math.ceil(sr * duration);
  const buf = ctx.createBuffer(1, len, sr);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filt = ctx.createBiquadFilter();
  filt.type = 'bandpass';
  filt.frequency.value = (loFreq + hiFreq) / 2;
  filt.Q.value = 0.7;
  const gain = ctx.createGain();
  const t = ctx.currentTime + delay;
  gain.gain.setValueAtTime(vol * _volume, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  src.connect(filt);
  filt.connect(gain);
  gain.connect(ctx.destination);
  src.start(t);
  src.stop(t + duration + 0.01);
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

// ── Public API ────────────────────────────────────────────────────────────────

export const SoundEngine = {
  /** Called by SoundProvider to sync volume / mute / vibration state. */
  configure(opts: {
    masterVolume?: number;
    effectsVolume?: number;
    muted?: boolean;
    vibration?: boolean;
  }) {
    if (opts.masterVolume !== undefined && opts.effectsVolume !== undefined) {
      _volume = opts.masterVolume * opts.effectsVolume;
    }
    if (opts.muted !== undefined) _muted = opts.muted;
    if (opts.vibration !== undefined) _vibration = opts.vibration;
  },

  deal() {
    haptic(Haptics.ImpactFeedbackStyle.Light);
    if (_muted) return;
    if (Platform.OS !== 'web') { playNative('deal'); return; }
    noise(0.07, 0.14, 600, 5000);
    noise(0.05, 0.09, 300, 2000, 0.04);
    tone(1800, 'sine', 0.04, 0.06, 0.01);
  },

  chip() {
    haptic(Haptics.ImpactFeedbackStyle.Light);
    if (_muted) return;
    if (Platform.OS !== 'web') { playNative('chip_click'); return; }
    tone(1100, 'sine', 0.07, 0.22);
    tone(1500, 'sine', 0.05, 0.12, 0.012);
    noise(0.04, 0.09, 1200, 6000);
  },

  chipCollect() {
    haptic(Haptics.ImpactFeedbackStyle.Medium);
    if (_muted) return;
    if (Platform.OS !== 'web') { playNative('chip_collect'); return; }
    tone(500, 'sine', 0.12, 0.18, 0, 900);
    noise(0.08, 0.07, 600, 3000);
  },

  check() {
    hapticSel();
    if (_muted) return;
    if (Platform.OS !== 'web') { playNative('check'); return; }
    noise(0.035, 0.09, 150, 700);
    tone(380, 'sine', 0.055, 0.10);
  },

  fold() {
    haptic(Haptics.ImpactFeedbackStyle.Light);
    if (_muted) return;
    if (Platform.OS !== 'web') { playNative('fold'); return; }
    tone(280, 'sine', 0.22, 0.22, 0, 160);
    noise(0.06, 0.07, 100, 600, 0.02);
  },

  call() {
    haptic(Haptics.ImpactFeedbackStyle.Medium);
    if (_muted) return;
    if (Platform.OS !== 'web') { playNative('call'); return; }
    tone(900, 'sine', 0.06, 0.18);
    tone(1100, 'sine', 0.05, 0.12, 0.015);
    noise(0.04, 0.07, 800, 3000);
  },

  raise() {
    haptic(Haptics.ImpactFeedbackStyle.Medium);
    if (_muted) return;
    if (Platform.OS !== 'web') { playNative('raise'); return; }
    tone(600, 'sine', 0.06, 0.18);
    tone(900, 'sine', 0.07, 0.20, 0.04);
    tone(1200, 'sine', 0.06, 0.16, 0.08);
    noise(0.05, 0.10, 800, 4000, 0.02);
  },

  allin() {
    haptic(Haptics.ImpactFeedbackStyle.Heavy);
    if (_muted) return;
    if (Platform.OS !== 'web') { playNative('allin'); return; }
    [350, 500, 680, 950, 1300].forEach((f, i) => {
      tone(f, 'sawtooth', 0.22, 0.13 + i * 0.015, i * 0.065, f * 1.06);
    });
    noise(0.15, 0.08, 300, 2000, 0.1);
  },

  win() {
    hapticNotif(Haptics.NotificationFeedbackType.Success);
    if (_muted) return;
    if (Platform.OS !== 'web') { playNative('win'); return; }
    [523, 659, 784, 1047, 1319].forEach((f, i) => {
      tone(f, 'sine', 0.28, 0.18 + i * 0.01, i * 0.11);
    });
    tone(1047, 'triangle', 0.45, 0.22, 0.58);
    tone(1319, 'sine', 0.5, 0.18, 0.72);
    noise(0.12, 0.06, 2000, 8000, 0.55);
  },

  lose() {
    hapticNotif(Haptics.NotificationFeedbackType.Error);
    if (_muted) return;
    if (Platform.OS !== 'web') { playNative('lose'); return; }
    tone(330, 'sine', 0.30, 0.20, 0, 200);
    tone(250, 'sine', 0.30, 0.18, 0.15, 160);
    tone(180, 'sine', 0.35, 0.15, 0.32, 120);
  },

  cardFlip() {
    hapticSel();
    if (_muted) return;
    if (Platform.OS !== 'web') { playNative('card_flip'); return; }
    noise(0.055, 0.18, 800, 6000);
    noise(0.04, 0.12, 300, 2000, 0.03);
    tone(2200, 'sine', 0.03, 0.07, 0.005);
  },

  button() {
    hapticSel();
    if (_muted) return;
    if (Platform.OS !== 'web') { playNative('button'); return; }
    tone(700, 'sine', 0.04, 0.12);
    noise(0.025, 0.06, 500, 3000);
  },

  notification() {
    hapticNotif(Haptics.NotificationFeedbackType.Success);
    if (_muted) return;
    if (Platform.OS !== 'web') { playNative('notification'); return; }
    tone(880, 'sine', 0.08, 0.18);
    tone(1100, 'sine', 0.07, 0.14, 0.09);
  },

  achievementUnlock() {
    hapticNotif(Haptics.NotificationFeedbackType.Success);
    if (_muted) return;
    if (Platform.OS !== 'web') { playNative('achievement_unlock'); return; }
    [523, 659, 784, 1047].forEach((f, i) => {
      tone(f, 'sawtooth', 0.22, 0.18 + i * 0.01, i * 0.08);
    });
    noise(0.10, 0.06, 1500, 6000, 0.3);
  },

  levelUp() {
    hapticNotif(Haptics.NotificationFeedbackType.Success);
    if (_muted) return;
    if (Platform.OS !== 'web') { playNative('level_up'); return; }
    [261, 329, 392, 523, 659, 784].forEach((f, i) => {
      tone(f, 'sawtooth', 0.30, 0.20, i * 0.085);
    });
    noise(0.15, 0.08, 2000, 8000, 0.50);
  },

  neonBuzz() {
    if (Platform.OS !== 'web' || _muted) return;
    const dur = 0.18 + Math.random() * 0.22;
    tone(60, 'sawtooth', dur, 0.055);
    tone(120, 'sawtooth', dur, 0.028);
    tone(240, 'sawtooth', dur * 0.6, 0.012);
    const cracks = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < cracks; i++) {
      const d = Math.random() * (dur * 0.8);
      const len = 0.006 + Math.random() * 0.018;
      noise(len, 0.10 + Math.random() * 0.08, 1800, 14000, d);
    }
    if (Math.random() < 0.5) {
      tone(3200 + Math.random() * 1800, 'sine', 0.012, 0.04, Math.random() * dur * 0.5);
    }
  },
};
