// ─── Avatar image map — literal require() calls required by Metro bundler ──────
// Shared by NeonAvatar.tsx (rendering) and _layout.tsx (preloading at startup).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AVATAR_IMAGES: Record<number, any> = {
  // Original 15
  1:  require('../assets/avatars/martini.png'),
  2:  require('../assets/avatars/palm.png'),
  3:  require('../assets/avatars/dice_stack.png'),
  4:  require('../assets/avatars/cassette.png'),
  5:  require('../assets/avatars/saturn.png'),
  6:  require('../assets/avatars/vinyl.png'),
  7:  require('../assets/avatars/cherry.png'),
  8:  require('../assets/avatars/flamingo.png'),
  9:  require('../assets/avatars/sunset.png'),
  10: require('../assets/avatars/ace.png'),
  11: require('../assets/avatars/hourglass.png'),
  12: require('../assets/avatars/dragon.png'),
  13: require('../assets/avatars/poker_chip.png'),
  14: require('../assets/avatars/champagne.png'),
  15: require('../assets/avatars/moon.png'),
  // Premium vaporwave expansion (16-30)
  16: require('../assets/avatars/yacht.png'),
  17: require('../assets/avatars/vice_skyline.png'),
  18: require('../assets/avatars/palm_paradise.png'),
  19: require('../assets/avatars/ferrari.png'),
  20: require('../assets/avatars/ocean_drive.png'),
  21: require('../assets/avatars/convertible.png'),
  22: require('../assets/avatars/synthwave_moon.png'),
  23: require('../assets/avatars/penthouse.png'),
  24: require('../assets/avatars/tiger.png'),
  25: require('../assets/avatars/royal_flush.png'),
  26: require('../assets/avatars/million_pot.png'),
  27: require('../assets/avatars/roulette.png'),
  28: require('../assets/avatars/casino_crown.png'),
  29: require('../assets/avatars/poker_king.png'),
  30: require('../assets/avatars/midnight_mirage.png'),
  // Collection 01 — Street Legends
  31: require('../assets/avatars/brass_knuckles.png'),
  // Collection 02 — High Roller Arsenal
  37: require('../assets/avatars/compact_pistol.png'),
  38: require('../assets/avatars/tactical_pistol.png'),
  39: require('../assets/avatars/smg.png'),
  40: require('../assets/avatars/compact_smg.png'),
  41: require('../assets/avatars/assault_rifle.png'),
  42: require('../assets/avatars/ak_platform.png'),
  44: require('../assets/avatars/sniper_rifle.png'),
  // Collection 03 — Chaos Collection
  45: require('../assets/avatars/frag_grenade.png'),
  46: require('../assets/avatars/flashbang.png'),
  47: require('../assets/avatars/smoke_grenade.png'),
  // Collection 04 — Utility Series (49-52)
  49: require('../assets/avatars/spray_can.png'),
  51: require('../assets/avatars/radio_device.png'),
  52: require('../assets/avatars/camera_lens.png'),
  // Legendary Icon (53)
  53: require('../assets/avatars/golden_tiki.png'),

  // ── Face Card Collection — Aces (54–57) ──────────────────────────────────────
  54: require('../assets/avatars/ace_spades.png'),
  55: require('../assets/avatars/ace_hearts.png'),
  56: require('../assets/avatars/ace_diamonds.png'),
  57: require('../assets/avatars/ace_clubs.png'),

  // ── Face Card Collection — Kings (58–61) ─────────────────────────────────────
  58: require('../assets/avatars/king_spades.png'),
  59: require('../assets/avatars/king_hearts.png'),
  60: require('../assets/avatars/king_diamonds.png'),
  61: require('../assets/avatars/king_clubs.png'),

  // ── Face Card Collection — Queens (62–65) ────────────────────────────────────
  62: require('../assets/avatars/queen_spades.png'),
  63: require('../assets/avatars/queen_hearts.png'),
  64: require('../assets/avatars/queen_diamonds.png'),
  65: require('../assets/avatars/queen_clubs.png'),

  // ── Face Card Collection — Jacks (66–69) ─────────────────────────────────────
  66: require('../assets/avatars/jack_spades.png'),
  67: require('../assets/avatars/jack_hearts.png'),
  68: require('../assets/avatars/jack_diamonds.png'),
  69: require('../assets/avatars/jack_clubs.png'),

  // ── Specials (70–71) ─────────────────────────────────────────────────────────
  70: require('../assets/avatars/joker.png'),
  71: require('../assets/avatars/razor_blade.png'),
};

export default AVATAR_IMAGES;
