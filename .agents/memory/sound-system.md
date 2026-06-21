---
name: Sound system architecture
description: How SFX are generated, organized, and played across web + native in CHIP SOCIETY
---

# Sound System Architecture

## Engine
- `lib/soundEngine.ts` — singleton SoundEngine, all SFX via expo-av
- `lib/musicEngine.ts` — background music only (separate)
- `context/SoundContext.tsx` — master/effects/music volume + mute, persisted to AsyncStorage `@chipsociety_sound_settings`
- `_layout.tsx` SoundSyncer — calls `unlockAudio()` on mount, syncs settings to engines

## WAV Generator
- `scripts/src/gen-sounds.cjs` — Node.js script, generates all synthetic WAV files
- Run: `node scripts/src/gen-sounds.cjs` from workspace root
- Output: `artifacts/neon-river/assets/sounds/*.wav`
- Uses pure math synthesis (sine, noise, ADSR envelopes) — no external audio deps
- 22050 Hz, 16-bit, mono

## Sound file inventory (as of v2)
**Existing poker sounds:** deal, chip_click, chip_collect, fold, check, call, raise, allin, win, lose, card_flip, button, notification, achievement_unlock, level_up

**New dedicated sounds (generated):**
- `prize_collect.wav` — coin-shower sparkle for all reward claims
- `bet_placed.wav` — single chip thump for bets
- `lottery_scratch.wav` — rough scratch texture (called every 70ms during scratch)
- `lottery_reveal.wav` — 3-note fanfare when lottery result shows
- `tournament_win.wav` — grand 5-note fanfare
- `error.wav` — descending buzz for invalid actions
- `fortune_rise.wav` — ascending pentatonic for cookie slip float
- `cookie_crack_{common/uncommon/rare/epic/legendary/mythic}.wav` — per-tier crack sounds
- `cookie_reveal_{common/uncommon/rare/epic/legendary/mythic}.wav` — per-tier reward reveals

## Key rules
- NO pitch-shifting one WAV to fake another sound — each category has its own file
- `claim()` is deprecated — use `prizeCollect()` for all reward collections
- `lotteryScratch()` replaces `chip()` in scratch.tsx for the scratch gesture sound
- Web Audio API (`waTone`/`waNoise`) kept ONLY for `showdown()` and `neonBuzz()` (web-only atmosphere, no bundled asset)
- `claim_sound.mp3` removed from ASSETS — was potentially copyrighted, replaced by `prize_collect.wav`

## Mobile audio unlock
- `unlockAudio()` exported from soundEngine.ts
- Called in `SoundSyncer` on mount (before any user interaction)
- Sets `playsInSilentModeIOS: true` and `shouldDuckAndroid: true`
- Sufficient for expo-av on native; Web Audio API unlock still requires a user gesture (only used for non-critical atmosphere sounds)

**Why:** User reported sounds not working on mobile, cookie sounds were all pitch-shifted versions of the same file, and claim_sound.mp3 had copyright concerns.
