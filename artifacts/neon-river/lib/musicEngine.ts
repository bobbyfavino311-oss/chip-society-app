/**
 * CHIP SOCIETY — Music Engine
 *
 * Plays a looping audio file during gameplay using expo-av.
 * Works on both native iOS and Expo web.
 *
 * configure(opts)   — sync volume / mute from SoundContext.
 * play()            — load and start looping when a game begins.
 * stop()            — stop and unload cleanly when a game ends.
 * setIntensity(lvl) — subtle volume adjustment per game state.
 */

import { Audio } from 'expo-av';

// ── Asset (Metro requires a static require call) ──────────────────────────────

const MUSIC_ASSET = require('../assets/sounds/music_gameplay.mp3');

// ── Runtime state ─────────────────────────────────────────────────────────────

let _vol     = 0.40;
let _muted   = false;
let _sound:  Audio.Sound | null = null;
let _loading = false;

// ── Internal: set up iOS audio session ───────────────────────────────────────

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

// ── Public API ────────────────────────────────────────────────────────────────

export const MusicEngine = {

  /** Called by SoundContext whenever music volume or mute state changes. */
  configure(opts: { volume?: number; muted?: boolean }) {
    if (opts.volume !== undefined) _vol   = Math.max(0, Math.min(1, opts.volume));
    if (opts.muted  !== undefined) _muted = opts.muted;
    if (_sound) {
      void _sound.setVolumeAsync(_muted ? 0 : _vol).catch(() => {});
    }
  },

  /** Load and start the looping track. Fire-and-forget async. */
  play() {
    if (_sound || _loading) return;
    _loading = true;
    void (async () => {
      try {
        await ensureAudio();
        const { sound } = await Audio.Sound.createAsync(
          MUSIC_ASSET,
          {
            shouldPlay:  false,   // load first; rate must be set before first play
            isLooping:   false,   // manual loop so we can re-apply rate each cycle
            volume:      _muted ? 0 : _vol,
          },
        );

        // Helper: seek to start, re-apply rate, play — called on every loop cycle
        const startLoop = async () => {
          try {
            await sound.setPositionAsync(0);
            await sound.setRateAsync(0.75, false);
            await sound.setVolumeAsync(_muted ? 0 : _vol);
            await sound.playAsync();
          } catch {}
        };

        // Re-trigger the loop manually so rate persists across every cycle
        sound.setOnPlaybackStatusUpdate((status) => {
          if (!status.isLoaded) return;
          if (status.didJustFinish && _sound === sound) {
            void startLoop();
          }
        });

        await startLoop();
        _sound = sound;
      } catch {
        // Silently fail — music is non-critical
      } finally {
        _loading = false;
      }
    })();
  },

  /** Stop and unload the track. Safe to call even if not playing. */
  stop() {
    if (!_sound && !_loading) return;
    _loading = false;
    const s  = _sound;
    _sound   = null;
    if (s) {
      void (async () => {
        try {
          await s.stopAsync();
          await s.unloadAsync();
        } catch {}
      })();
    }
  },

  /**
   * Subtle volume shift per gameplay intensity.
   * With a real audio file we can't re-arrange the beat, but we can
   * pull the volume back during showdown for focus, or nudge it up
   * slightly on all-in moments.
   */
  setIntensity(level: 'normal' | 'tense' | 'showdown') {
    if (!_sound) return;
    const mult: Record<string, number> = {
      normal:   1.00,
      tense:    1.18,   // slightly louder on big pots
      showdown: 0.65,   // pull back so the reveal lands cleanly
    };
    const target = Math.min(1, _vol * mult[level]);
    void _sound.setVolumeAsync(_muted ? 0 : target).catch(() => {});
  },
};
