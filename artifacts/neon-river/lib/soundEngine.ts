/**
 * CHIP SOCIETY — Sound Engine  v2
 *
 * Every sound uses expo-av on ALL platforms (web + native) so behaviour is
 * identical everywhere.  The Web Audio API is kept ONLY for web-only ambient
 * atmosphere (showdown hit, neonBuzz).  It is NEVER used as a fallback for a
 * sound that has a bundled WAV asset.
 *
 * New in v2
 * ─────────
 * • 19 new dedicated WAV files — no more pitch-shifting one file for another
 * • unlockAudio() — call on first user tap to prime iOS / Android audio context
 * • prizeCollect() — distinct coin-shower sound (≠ chipCollect, ≠ achievement)
 * • lotteryScratch() — dedicated scratch texture
 * • lotteryReveal() — dedicated 3-note reveal fanfare
 * • tournamentWin() — grand fanfare
 * • error() — descending buzz
 * • betPlaced() — single chip thump
 * • All Fortune Cookie sounds now use dedicated WAV files on every platform
 *
 * Volume / mute state injected by SoundProvider via configure().
 * DO NOT touch background music here — only SFX.
 */

import * as Haptics from 'expo-haptics';
import { Audio }    from 'expo-av';

// ── Runtime config ─────────────────────────────────────────────────────────────

let _volume    = 0.72;
let _muted     = false;
let _fxEnabled = true;
let _vibration = true;

// ── Audio session ──────────────────────────────────────────────────────────────

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

/**
 * unlockAudio — call on the very first user interaction (e.g. first tap).
 * Primes the iOS / Android audio context so subsequent sounds play without
 * any delay.  Safe to call multiple times (no-ops after first call).
 */
export async function unlockAudio() {
  await ensureAudio();
}

// ── Asset map (static requires — Metro needs them at build time) ───────────────

const ASSETS = {
  // ── Poker table ──────────────────────────────────────────────────────────────
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
  card_flip:          require('../assets/sounds/card_flip.wav'),
  // ── UI ───────────────────────────────────────────────────────────────────────
  button:             require('../assets/sounds/button.wav'),
  notification:       require('../assets/sounds/notification.wav'),
  // ── Progression ──────────────────────────────────────────────────────────────
  achievement_unlock: require('../assets/sounds/achievement_unlock.wav'),
  level_up:           require('../assets/sounds/level_up.wav'),
  // ── Rewards (new, dedicated) ─────────────────────────────────────────────────
  prize_collect:      require('../assets/sounds/prize_collect.wav'),
  bet_placed:         require('../assets/sounds/bet_placed.wav'),
  // ── Lottery ──────────────────────────────────────────────────────────────────
  lottery_scratch:    require('../assets/sounds/lottery_scratch.wav'),
  lottery_reveal:     require('../assets/sounds/lottery_reveal.wav'),
  // ── Tournament ───────────────────────────────────────────────────────────────
  tournament_win:     require('../assets/sounds/tournament_win.wav'),
  // ── Feedback ─────────────────────────────────────────────────────────────────
  error:              require('../assets/sounds/error.wav'),
  // ── Fortune Cookie — crack (per tier) ────────────────────────────────────────
  cookie_crack_common:    require('../assets/sounds/cookie_crack_common.wav'),
  cookie_crack_uncommon:  require('../assets/sounds/cookie_crack_uncommon.wav'),
  cookie_crack_rare:      require('../assets/sounds/cookie_crack_rare.wav'),
  cookie_crack_epic:      require('../assets/sounds/cookie_crack_epic.wav'),
  cookie_crack_legendary: require('../assets/sounds/cookie_crack_legendary.wav'),
  cookie_crack_mythic:    require('../assets/sounds/cookie_crack_mythic.wav'),
  // ── Fortune Cookie — reward reveal (per tier) ────────────────────────────────
  cookie_reveal_common:    require('../assets/sounds/cookie_reveal_common.wav'),
  cookie_reveal_uncommon:  require('../assets/sounds/cookie_reveal_uncommon.wav'),
  cookie_reveal_rare:      require('../assets/sounds/cookie_reveal_rare.wav'),
  cookie_reveal_epic:      require('../assets/sounds/cookie_reveal_epic.wav'),
  cookie_reveal_legendary: require('../assets/sounds/cookie_reveal_legendary.wav'),
  cookie_reveal_mythic:    require('../assets/sounds/cookie_reveal_mythic.wav'),
  // ── Fortune Cookie — slip rise ───────────────────────────────────────────────
  fortune_rise:       require('../assets/sounds/fortune_rise.wav'),
} as const;

type SoundName = keyof typeof ASSETS;

// ── Core playback — expo-av on every platform ──────────────────────────────────

function play(name: SoundName, opts: { volume?: number } = {}) {
  if (_muted || !_fxEnabled || _volume <= 0) return;
  void (async () => {
    try {
      await ensureAudio();
      const { sound } = await Audio.Sound.createAsync(ASSETS[name], {
        volume:     Math.min(1, (opts.volume ?? 1) * _volume),
        shouldPlay: true,
      });
      sound.setOnPlaybackStatusUpdate(status => {
        if (status.isLoaded && status.didJustFinish) void sound.unloadAsync();
      });
    } catch {}
  })();
}

// ── Web Audio helpers — ONLY for atmosphere with no bundled asset ──────────────

let _ctx: AudioContext | null = null;
function getCtx(): AudioContext | null {
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
function waTone(freq: number, type: OscillatorType, duration: number, vol = 0.3, delay = 0, freqEnd?: number) {
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
function waNoise(duration: number, vol = 0.12, loFreq = 200, hiFreq = 3000, delay = 0) {
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

// ── Haptics ────────────────────────────────────────────────────────────────────

function haptic(style: Haptics.ImpactFeedbackStyle) {
  if (_vibration) void Haptics.impactAsync(style);
}
function hapticNotif(type: Haptics.NotificationFeedbackType) {
  if (_vibration) void Haptics.notificationAsync(type);
}
function hapticSel() {
  if (_vibration) void Haptics.selectionAsync();
}

// ── Public API ─────────────────────────────────────────────────────────────────

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

  // ── Poker table ──────────────────────────────────────────────────────────────

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

  betPlaced() {
    haptic(Haptics.ImpactFeedbackStyle.Medium);
    play('bet_placed');
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

  // ── UI ───────────────────────────────────────────────────────────────────────

  button() {
    hapticSel();
    play('button');
  },

  notification() {
    hapticNotif(Haptics.NotificationFeedbackType.Success);
    play('notification');
  },

  error() {
    hapticNotif(Haptics.NotificationFeedbackType.Error);
    play('error');
  },

  // ── Progression ──────────────────────────────────────────────────────────────

  achievementUnlock() {
    hapticNotif(Haptics.NotificationFeedbackType.Success);
    play('achievement_unlock');
  },

  levelUp() {
    hapticNotif(Haptics.NotificationFeedbackType.Success);
    play('level_up');
  },

  // ── Rewards ──────────────────────────────────────────────────────────────────

  /** Coin-shower collect sound — for daily rewards, wheel prizes, scratch payouts */
  prizeCollect() {
    hapticNotif(Haptics.NotificationFeedbackType.Success);
    play('prize_collect');
  },

  // ── Lottery ──────────────────────────────────────────────────────────────────

  lotteryScratch() {
    haptic(Haptics.ImpactFeedbackStyle.Light);
    play('lottery_scratch');
  },

  lotteryReveal() {
    hapticNotif(Haptics.NotificationFeedbackType.Success);
    play('lottery_reveal');
  },

  // ── Tournament ───────────────────────────────────────────────────────────────

  tournamentWin() {
    hapticNotif(Haptics.NotificationFeedbackType.Success);
    play('tournament_win');
  },

  // ── Web-only atmosphere (no bundled asset needed) ─────────────────────────────

  /** Low cinematic tension hit — web only */
  showdown() {
    haptic(Haptics.ImpactFeedbackStyle.Heavy);
    waTone(70,  'sine', 0.45, 0.22, 0,    50);
    waTone(130, 'sine', 0.40, 0.18, 0.05, 90);
    waNoise(0.08, 0.14, 50,  600,  0);
    waNoise(0.06, 0.08, 600, 2500, 0.12);
  },

  /** Ambient neon sign flicker — web only */
  neonBuzz() {
    if (_muted || !_fxEnabled) return;
    const dur = 0.18 + Math.random() * 0.22;
    waTone(60,  'sawtooth', dur, 0.055);
    waTone(120, 'sawtooth', dur, 0.028);
    waTone(240, 'sawtooth', dur * 0.6, 0.012);
    const cracks = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < cracks; i++) {
      waNoise(0.006 + Math.random() * 0.018, 0.10 + Math.random() * 0.08,
        1800, 14000, Math.random() * dur * 0.8);
    }
    if (Math.random() < 0.5)
      waTone(3200 + Math.random() * 1800, 'sine', 0.012, 0.04, Math.random() * dur * 0.5);
  },

  // ── Fortune Cookie ────────────────────────────────────────────────────────────

  /**
   * cookieCrack — called when the cookie splits apart.
   * Each tier has its own dedicated WAV file on every platform.
   */
  cookieCrack(tier: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'standard' | 'golden' | 'dragon' = 'common') {
    haptic(Haptics.ImpactFeedbackStyle.Heavy);
    if (_muted || !_fxEnabled) return;
    // Map legacy tier names
    const mapped =
      tier === 'standard' ? 'common' :
      tier === 'golden'   ? 'uncommon' :
      tier === 'dragon'   ? 'rare' :
      tier;
    const key = `cookie_crack_${mapped}` as SoundName;
    play(key);
  },

  /**
   * fortuneRise — called as the fortune slip floats up.
   * Uses the dedicated fortune_rise.wav on every platform.
   */
  fortuneRise() {
    if (_muted || !_fxEnabled) return;
    play('fortune_rise', { volume: 0.85 });
  },

  /**
   * fortuneReward — called when the reward card appears.
   * Routes to the tier-specific dedicated reveal WAV.
   */
  fortuneReward(tier: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC') {
    hapticNotif(Haptics.NotificationFeedbackType.Success);
    if (_muted || !_fxEnabled) return;
    const mapped = tier.toLowerCase() as 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
    const key = `cookie_reveal_${mapped}` as SoundName;
    play(key);
  },

  // Keep these for backward-compat (used nowhere new, but may be referenced)
  _rewardCommon()    { SoundEngine.fortuneReward('COMMON'); },
  _rewardUncommon()  { SoundEngine.fortuneReward('UNCOMMON'); },
  _rewardRare()      { SoundEngine.fortuneReward('RARE'); },
  _rewardEpic()      { SoundEngine.fortuneReward('EPIC'); },
  _rewardLegendary() { SoundEngine.fortuneReward('LEGENDARY'); },
  _rewardMythic()    { SoundEngine.fortuneReward('MYTHIC'); },

  /**
   * @deprecated Use prizeCollect() instead.
   * Kept for any call sites not yet migrated.
   */
  claim() {
    SoundEngine.prizeCollect();
  },
};
