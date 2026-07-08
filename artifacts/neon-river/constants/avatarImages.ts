// ─── Avatar image map — literal require() calls required by Metro bundler ──────
// Shared by NeonAvatar.tsx (rendering) and _layout.tsx (preloading at startup).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AVATAR_IMAGES: Record<number, any> = {
  // Original 15
  1:  require('../assets/avatars/martini.jpg'),
  2:  require('../assets/avatars/palm.jpg'),
  3:  require('../assets/avatars/dice_stack.jpg'),
  4:  require('../assets/avatars/cassette.jpg'),
  5:  require('../assets/avatars/saturn.jpg'),
  6:  require('../assets/avatars/vinyl.jpg'),
  7:  require('../assets/avatars/cherry.jpg'),
  8:  require('../assets/avatars/flamingo.jpg'),
  9:  require('../assets/avatars/sunset.jpg'),
  10: require('../assets/avatars/ace.jpg'),
  11: require('../assets/avatars/hourglass.jpg'),
  12: require('../assets/avatars/dragon.jpg'),
  13: require('../assets/avatars/poker_chip.jpg'),
  14: require('../assets/avatars/champagne.jpg'),
  15: require('../assets/avatars/moon.jpg'),
  // Premium vaporwave expansion (16-30)
  16: require('../assets/avatars/yacht.jpg'),
  17: require('../assets/avatars/vice_skyline.jpg'),
  18: require('../assets/avatars/palm_paradise.jpg'),
  19: require('../assets/avatars/ferrari.jpg'),
  20: require('../assets/avatars/ocean_drive.jpg'),
  21: require('../assets/avatars/convertible.jpg'),
  22: require('../assets/avatars/synthwave_moon.jpg'),
  23: require('../assets/avatars/penthouse.jpg'),
  24: require('../assets/avatars/tiger.jpg'),
  25: require('../assets/avatars/royal_flush.jpg'),
  26: require('../assets/avatars/million_pot.jpg'),
  27: require('../assets/avatars/roulette.jpg'),
  28: require('../assets/avatars/casino_crown.jpg'),
  29: require('../assets/avatars/poker_king.jpg'),
  30: require('../assets/avatars/midnight_mirage.jpg'),
  // Collection 01 — Street Legends
  31: require('../assets/avatars/brass_knuckles.jpg'),
  // Collection 02 — High Roller Arsenal
  37: require('../assets/avatars/compact_pistol.jpg'),
  38: require('../assets/avatars/tactical_pistol.jpg'),
  39: require('../assets/avatars/smg.jpg'),
  40: require('../assets/avatars/compact_smg.jpg'),
  41: require('../assets/avatars/assault_rifle.jpg'),
  42: require('../assets/avatars/ak_platform.jpg'),
  44: require('../assets/avatars/sniper_rifle.jpg'),
  // Collection 03 — Chaos Collection
  45: require('../assets/avatars/frag_grenade.jpg'),
  46: require('../assets/avatars/flashbang.jpg'),
  47: require('../assets/avatars/smoke_grenade.jpg'),
  // Collection 04 — Utility Series (49-52)
  49: require('../assets/avatars/spray_can.jpg'),
  51: require('../assets/avatars/radio_device.jpg'),
  52: require('../assets/avatars/camera_lens.jpg'),
  // Legendary Icon (53)
  53: require('../assets/avatars/golden_tiki.jpg'),

  // ── Face Card Collection — Aces (54–57) ──────────────────────────────────────
  54: require('../assets/avatars/ace_spades.jpg'),
  55: require('../assets/avatars/ace_hearts.jpg'),
  56: require('../assets/avatars/ace_diamonds.jpg'),
  57: require('../assets/avatars/ace_clubs.jpg'),

  // ── Face Card Collection — Kings (58–61) ─────────────────────────────────────
  58: require('../assets/avatars/king_spades.jpg'),
  59: require('../assets/avatars/king_hearts.jpg'),
  60: require('../assets/avatars/king_diamonds.jpg'),
  61: require('../assets/avatars/king_clubs.jpg'),

  // ── Face Card Collection — Queens (62–65) ────────────────────────────────────
  62: require('../assets/avatars/queen_spades.jpg'),
  63: require('../assets/avatars/queen_hearts.jpg'),
  64: require('../assets/avatars/queen_diamonds.jpg'),
  65: require('../assets/avatars/queen_clubs.jpg'),

  // ── Face Card Collection — Jacks (66–69) ─────────────────────────────────────
  66: require('../assets/avatars/jack_spades.jpg'),
  67: require('../assets/avatars/jack_hearts.jpg'),
  68: require('../assets/avatars/jack_diamonds.jpg'),
  69: require('../assets/avatars/jack_clubs.jpg'),

  // ── Specials (70–71) ─────────────────────────────────────────────────────────
  70: require('../assets/avatars/joker.jpg'),
  71: require('../assets/avatars/razor_blade.jpg'),
};

export default AVATAR_IMAGES;
