/**
 * CHIP SOCIETY — Sound Engine
 *
 * All SFX use expo-av on EVERY platform (web + native) so the sounds are
 * always identical. Web Audio API is kept only for sounds that have no
 * bundled asset (neonBuzz, showdown).
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
let _fxEnabled = true;
let _vibration = true;

// ── Audio session ─────────────────────────────────────────────────────────────

let _audioReady = false;
async function ensureAudio() {
  if (_audioReady) return;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS:    true,
      staysActiveInBackground: false,
      shouldDuckAndroid:       true,
    });
    _audioReady = true;
  } catch {}
}

// ── Asset map (static requires — Metro needs them at build time) ───────────────

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

// ── Core playback — works on web AND native via expo-av ───────────────────────

function play(name: SoundName, opts: { rate?: number; volume?: number } = {}) {
  if (_muted || !_fxEnabled || _volume <= 0) return;
  void (async () => {
    try {
      await ensureAudio();
      const { sound } = await Audio.Sound.createAsync(ASSETS[name], {
        volume:             Math.min(1, (opts.volume ?? 1) * _volume),
        shouldPlay:         true,
        rate:               opts.rate ?? 1.0,
        shouldCorrectPitch: opts.rate !== undefined ? false : true,
      });
      sound.setOnPlaybackStatusUpdate(status => {
        if (status.isLoaded && status.didJustFinish) void sound.unloadAsync();
      });
    } catch {}
  })();
}

// ── Web Audio helpers (only used for sounds with NO bundled asset) ─────────────

let _ctx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  if (Platform.OS !== 'web') return null;
  try {
    if (typeof window === 'undefined') return null;
    const Win = window as Window & { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
    const Cls = Win.AudioContext ?? Win.webkitAudioContext;
    if (!Cls) return null;
    if (!_ctx) _ctx = new Cls();
    if (_ctx.state === 'suspended') void _ctx.resume();
    return _ctx;
  } catch { return null; }
}
function tone(freq: number, type: OscillatorType, duration: number, vol = 0.3, delay = 0, freqEnd?: number) {
  const ctx = getCtx(); if (!ctx) return;
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator(); const gain = ctx.createGain();
  osc.type = type; osc.frequency.setValueAtTime(freq, t);
  if (freqEnd !== undefined) osc.frequency.exponentialRampToValueAtTime(freqEnd, t + duration);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(vol * _volume, t + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain); gain.connect(ctx.destination); osc.start(t); osc.stop(t + duration + 0.02);
}
function noise(duration: number, vol = 0.12, loFreq = 200, hiFreq = 3000, delay = 0) {
  const ctx = getCtx(); if (!ctx) return;
  const sr = ctx.sampleRate; const len = Math.ceil(sr * duration);
  const buf = ctx.createBuffer(1, len, sr); const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource(); src.buffer = buf;
  const filt = ctx.createBiquadFilter(); filt.type = 'bandpass';
  filt.frequency.value = (loFreq + hiFreq) / 2; filt.Q.value = 1.0;
  const gain = ctx.createGain(); const t = ctx.currentTime + delay;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(vol * _volume, t + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  src.connect(filt); filt.connect(gain); gain.connect(ctx.destination);
  src.start(t); src.stop(t + duration + 0.02);
}

// ── Haptics ───────────────────────────────────────────────────────────────────

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

  configure(opts: {
    masterVolume?: number;
    effectsVolume?: number;
    muted?: boolean;
    vibration?: boolean;
    fxEnabled?: boolean;
  }) {
    if (opts.masterVolume !== undefined && opts.effectsVolume !== undefined)
      _volume = opts.masterVolume * opts.effectsVolume;
    if (opts.muted     !== undefined) _muted     = opts.muted;
    if (opts.vibration !== undefined) _vibration = opts.vibration;
    if (opts.fxEnabled !== undefined) _fxEnabled = opts.fxEnabled;
  },

  setFxEnabled(enabled: boolean) { _fxEnabled = enabled; },
  getFxEnabled()                 { return _fxEnabled; },

  deal() {
    haptic(Haptics.ImpactFeedbackStyle.Light);
    play('deal');
  },

  chip() {
    haptic(Haptics.ImpactFeedbackStyle.Light);
    play('chip_click');
  },

  chipCollect() {
    haptic(Haptics.ImpactFeedbackStyle.Medium);
    play('chip_collect');
  },

  check() {
    hapticSel();
    play('check');
  },

  fold() {
    haptic(Haptics.ImpactFeedbackStyle.Light);
    play('fold');
  },

  call() {
    haptic(Haptics.ImpactFeedbackStyle.Medium);
    play('call');
  },

  raise() {
    haptic(Haptics.ImpactFeedbackStyle.Medium);
    play('raise');
  },

  allin() {
    haptic(Haptics.ImpactFeedbackStyle.Heavy);
    play('allin');
  },

  win() {
    hapticNotif(Haptics.NotificationFeedbackType.Success);
    play('win');
  },

  lose() {
    hapticNotif(Haptics.NotificationFeedbackType.Error);
    play('lose');
  },

  cardFlip() {
    hapticSel();
    play('card_flip');
  },

  button() {
    hapticSel();
    play('button');
  },

  notification() {
    hapticNotif(Haptics.NotificationFeedbackType.Success);
    play('notification');
  },

  achievementUnlock() {
    hapticNotif(Haptics.NotificationFeedbackType.Success);
    play('achievement_unlock');
  },

  levelUp() {
    hapticNotif(Haptics.NotificationFeedbackType.Success);
    play('level_up');
  },

  // Low cinematic tension hit — Web Audio only (no bundled asset)
  showdown() {
    haptic(Haptics.ImpactFeedbackStyle.Heavy);
    if (_muted || !_fxEnabled) return;
    if (Platform.OS !== 'web') return;
    tone(70,  'sine', 0.45, 0.22, 0,    50);
    tone(130, 'sine', 0.40, 0.18, 0.05, 90);
    noise(0.08, 0.14, 50,  600,  0);
    noise(0.06, 0.08, 600, 2500, 0.12);
  },

  // Ambient neon buzz — Web Audio only (atmosphere, no bundled asset)
  neonBuzz() {
    if (Platform.OS !== 'web' || _muted || !_fxEnabled) return;
    const dur = 0.18 + Math.random() * 0.22;
    tone(60,  'sawtooth', dur, 0.055);
    tone(120, 'sawtooth', dur, 0.028);
    tone(240, 'sawtooth', dur * 0.6, 0.012);
    const cracks = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < cracks; i++) {
      noise(0.006 + Math.random() * 0.018, 0.10 + Math.random() * 0.08,
            1800, 14000, Math.random() * dur * 0.8);
    }
    if (Math.random() < 0.5)
      tone(3200 + Math.random() * 1800, 'sine', 0.012, 0.04, Math.random() * dur * 0.5);
  },

  /**
   * Reward claim — pitch-shifted −5 semitones for a distinct premium feel.
   * Uses expo-av on all platforms (already cross-platform).
   */
  claim() {
    hapticNotif(Haptics.NotificationFeedbackType.Success);
    if (_muted || _volume <= 0) return;
    void (async () => {
      try {
        await ensureAudio();
        const { sound } = await Audio.Sound.createAsync(ASSETS.claim_sound, {
          shouldPlay:         true,
          volume:             Math.min(1, _volume),
          rate:               0.749,
          shouldCorrectPitch: false,
        });
        sound.setOnPlaybackStatusUpdate(status => {
          if (status.isLoaded && status.didJustFinish) void sound.unloadAsync();
        });
      } catch {}
    })();
  },
};
