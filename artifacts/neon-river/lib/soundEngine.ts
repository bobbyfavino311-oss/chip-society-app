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

  // ── Fortune Cookie audio journey ────────────────────────────────────────────

  /**
   * cookieCrack — called when the cookie splits apart.
   * Crisp high-freq snap + mid crunch texture.
   * Native: repurposes fold.wav at high pitch rate for the snap impact.
   */
  cookieCrack(cookieType: 'standard' | 'golden' | 'dragon' = 'standard') {
    haptic(Haptics.ImpactFeedbackStyle.Heavy);
    if (_muted || !_fxEnabled) return;

    if (Platform.OS !== 'web') {
      play('fold', { rate: 1.85, volume: 0.80 });
      if (cookieType === 'dragon') play('allin', { rate: 1.6, volume: 0.40 });
      return;
    }

    // Web Audio — crack/snap
    noise(0.032, 0.42, 3500, 14000, 0);
    noise(0.072, 0.28, 500,  4500,  0.012);
    tone(160, 'sine', 0.055, 0.30, 0);
    if (cookieType !== 'standard') {
      // Golden / Dragon: extra resonant impact
      tone(90, 'sine', 0.18, cookieType === 'dragon' ? 0.25 : 0.14, 0.01);
      noise(0.06, cookieType === 'dragon' ? 0.18 : 0.10, 80, 700, 0.01);
    }
  },

  /**
   * fortuneRise — called as the fortune slip floats up.
   * Ascending pentatonic arpeggio + shimmer.
   */
  fortuneRise() {
    if (_muted || !_fxEnabled) return;

    if (Platform.OS !== 'web') {
      play('card_flip', { rate: 0.68, volume: 0.55 });
      return;
    }

    // Ascending pentatonic: C5 E5 G5 C6 E6
    const notes = [523, 659, 784, 1047, 1319];
    notes.forEach((freq, i) => {
      tone(freq, 'sine', 0.38, Math.max(0.04, 0.13 - i * 0.01), i * 0.092);
    });
    noise(0.28, 0.038, 4000, 10000, 0.04); // airy shimmer
  },

  /**
   * fortuneReward — called when the reward card appears.
   * Routes to tier-specific sound.
   */
  fortuneReward(tier: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY') {
    switch (tier) {
      case 'COMMON':    return SoundEngine._rewardCommon();
      case 'RARE':      return SoundEngine._rewardRare();
      case 'EPIC':      return SoundEngine._rewardEpic();
      case 'LEGENDARY': return SoundEngine._rewardLegendary();
    }
  },

  _rewardCommon() {
    hapticNotif(Haptics.NotificationFeedbackType.Success);
    if (_muted || !_fxEnabled) return;

    if (Platform.OS !== 'web') {
      // Distinct notification ping — never claim_sound or achievement_unlock
      play('notification', { volume: 0.82 });
      return;
    }

    // Single soft prosperity bell
    tone(1047, 'sine', 0.75, 0.22, 0);
    tone(2093, 'sine', 0.55, 0.09, 0.012);
    tone(523,  'sine', 0.40, 0.07, 0.020); // warm low resonance
  },

  _rewardRare() {
    hapticNotif(Haptics.NotificationFeedbackType.Success);
    if (_muted || !_fxEnabled) return;

    if (Platform.OS !== 'web') {
      // Chips landing + bright ping = unique RARE reveal
      play('chip_collect', { volume: 0.72 });
      setTimeout(() => play('notification', { rate: 1.08, volume: 0.58 }), 190);
      return;
    }

    // Bell + sparkle
    tone(1047, 'sine', 0.75, 0.22, 0);
    tone(2093, 'sine', 0.55, 0.11, 0.012);
    tone(1319, 'sine', 0.42, 0.16, 0.16);
    tone(1568, 'sine', 0.32, 0.12, 0.27);
    noise(0.22, 0.07, 5000, 13000, 0.08);
  },

  _rewardEpic() {
    hapticNotif(Haptics.NotificationFeedbackType.Success);
    if (_muted || !_fxEnabled) return;

    if (Platform.OS !== 'web') {
      // Level-up fanfare = EPIC upgrade feel — unique, not achievement/claim
      play('level_up', { volume: 0.88 });
      return;
    }

    // Jade gong + bell + sparkle cascade
    tone(220, 'sine', 1.50, 0.28, 0);     // gong body
    tone(440, 'sine', 1.10, 0.15, 0.022); // gong harmonic
    tone(880, 'sine', 0.65, 0.09, 0.05);  // gong overtone
    tone(1047,'sine', 0.72, 0.20, 0.20);  // bell strike
    tone(2093,'sine', 0.50, 0.09, 0.21);
    tone(1319,'sine', 0.40, 0.14, 0.32);  // sparkle note
    noise(0.32, 0.09, 3500, 11000, 0.16);
  },

  _rewardLegendary() {
    hapticNotif(Haptics.NotificationFeedbackType.Success);
    if (_muted || !_fxEnabled) return;

    if (Platform.OS !== 'web') {
      // Ceremonial peak: hand-win fanfare + level-up — completely unique, never claim_sound
      play('win', { volume: 0.90 });
      setTimeout(() => play('level_up', { rate: 0.86, volume: 0.58 }), 360);
      return;
    }

    // Full ceremonial prosperity sequence
    // Deep ceremonial gong
    tone(110, 'sine', 2.40, 0.32, 0);
    tone(220, 'sine', 1.90, 0.17, 0.02);
    tone(165, 'sine', 1.60, 0.11, 0.04);
    // Rising bell cascade
    tone(523, 'sine', 0.80, 0.20, 0.26);
    tone(659, 'sine', 0.72, 0.18, 0.38);
    tone(784, 'sine', 0.64, 0.16, 0.50);
    tone(1047,'sine', 0.62, 0.22, 0.62);
    tone(1319,'sine', 0.54, 0.18, 0.74);
    tone(1568,'sine', 0.46, 0.15, 0.86);
    tone(2093,'sine', 0.40, 0.12, 0.98);
    // Prosperity sparkle shower
    noise(0.55, 0.11, 5000, 15000, 0.32);
    noise(0.35, 0.08, 2000, 7000,  0.60);
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
