export type ThemeId = 'neon_default' | 'dragon_fortune' | 'royal_masquerade' | 'tiger_fortune' | 'sakura_garden';

export interface TableTheme {
  id: ThemeId;
  name: string;
  tagline: string;
  rarity: 'FREE' | 'LEGENDARY';

  bgGradient: readonly [string, string, string, string, string];

  glowA: string;
  glowB: string;
  glowCenter: string;

  tableSurfaceBg: string;
  tableSurfaceBorder: string;
  tableSurfaceShadow: string;
  tableCenterGlow: string;

  cardBackBg: string;
  cardBackAccent: string;
  cardBackPattern: 'mandala' | 'dragon_scale' | 'masquerade_veil' | 'tiger_claw' | 'sakura_blossom';
  cardHighlightColor: string;

  chipTokenColor: string;
  chipWinTokenColor: string;

  potBg: string;
  potBorder: string;
  potShadow: string;
  potLabelColor: string;
  potAmountColor: string;

  foldAccent: string;
  checkAccent: string;
  callAccent: string;
  raiseAccent: string;
  allInAccent: string;

  accentPrimary: string;
  accentSecondary: string;
  textColor: string;

  winEffectStyle: 'neon_burst' | 'gold_shimmer';
  winGoldColor: string;

  previewColors: [string, string, string];
}

export const NEON_DEFAULT: TableTheme = {
  id: 'neon_default',
  name: 'NEON DEFAULT',
  tagline: 'The original neon-synthwave table. Electric blue, hot pink, and deep violet.',
  rarity: 'FREE',

  bgGradient: ['#0a0028', '#05001a', '#030010', '#05001a', '#0a0028'],

  glowA: 'rgba(120,0,200,0.18)',
  glowB: 'rgba(0,180,220,0.13)',
  glowCenter: 'rgba(80,0,160,0.09)',

  tableSurfaceBg: 'rgba(0,0,8,0.55)',
  tableSurfaceBorder: 'rgba(220,0,210,0.30)',
  tableSurfaceShadow: '#FF00C8',
  tableCenterGlow: 'rgba(0,60,35,0.12)',

  cardBackBg: '#c0182a',
  cardBackAccent: 'rgba(255,255,255,0.22)',
  cardBackPattern: 'mandala',
  cardHighlightColor: '#00d4ff',

  chipTokenColor: '#00d4ff',
  chipWinTokenColor: '#ffd700',

  potBg: 'rgba(4,0,14,0.85)',
  potBorder: 'rgba(255,215,0,0.3)',
  potShadow: '#ffd700',
  potLabelColor: 'rgba(255,215,0,0.5)',
  potAmountColor: '#ffd700',

  foldAccent: '#ff4466',
  checkAccent: '#00d4ff',
  callAccent: '#22c55e',
  raiseAccent: '#bf5fff',
  allInAccent: '#ffd700',

  accentPrimary: '#00d4ff',
  accentSecondary: '#ff0090',
  textColor: '#e8e8ff',

  winEffectStyle: 'neon_burst',
  winGoldColor: '#ffd700',

  previewColors: ['#050010', '#00d4ff', '#ff0090'],
};

export const DRAGON_FORTUNE: TableTheme = {
  id: 'dragon_fortune',
  name: 'FOUR DRAGONS',
  tagline: 'Enter the VIP Dragon Room. Ancient crimson, gold leaf, and the power of four dragons await.',
  rarity: 'LEGENDARY',

  bgGradient: ['#1C0000', '#0E0000', '#080000', '#0E0000', '#1C0000'],

  glowA: 'rgba(180,0,0,0.28)',
  glowB: 'rgba(200,155,60,0.10)',
  glowCenter: 'rgba(100,0,0,0.18)',

  tableSurfaceBg: 'rgba(10,0,0,0.85)',
  tableSurfaceBorder: 'rgba(200,155,60,0.55)',
  tableSurfaceShadow: '#C89B3C',
  tableCenterGlow: 'rgba(100,0,0,0.20)',

  cardBackBg: '#0A0000',
  cardBackAccent: '#C89B3C',
  cardBackPattern: 'dragon_scale',
  cardHighlightColor: '#C89B3C',

  chipTokenColor: '#C89B3C',
  chipWinTokenColor: '#EAE3D2',

  potBg: 'rgba(10,0,0,0.90)',
  potBorder: 'rgba(200,155,60,0.45)',
  potShadow: '#C89B3C',
  potLabelColor: 'rgba(200,155,60,0.65)',
  potAmountColor: '#C89B3C',

  foldAccent: '#8B0000',
  checkAccent: '#1F5E52',
  callAccent: '#1F5E52',
  raiseAccent: '#CC0000',
  allInAccent: '#C89B3C',

  accentPrimary: '#C89B3C',
  accentSecondary: '#CC0000',
  textColor: '#EAE3D2',

  winEffectStyle: 'gold_shimmer',
  winGoldColor: '#C89B3C',

  previewColors: ['#160000', '#CC0000', '#C89B3C'],
};

export const ROYAL_MASQUERADE: TableTheme = {
  id: 'royal_masquerade',
  name: 'ROYAL MASQUERADE',
  tagline: 'A private VIP casino behind a Venetian masquerade ball. Mysterious, elegant, and exclusively yours.',
  rarity: 'LEGENDARY',

  bgGradient: ['#160028', '#0C0018', '#080010', '#0C0018', '#160028'],

  glowA: 'rgba(100,0,180,0.22)',
  glowB: 'rgba(212,175,55,0.08)',
  glowCenter: 'rgba(60,0,110,0.16)',

  tableSurfaceBg: 'rgba(10,0,24,0.85)',
  tableSurfaceBorder: 'rgba(212,175,55,0.48)',
  tableSurfaceShadow: '#D4AF37',
  tableCenterGlow: 'rgba(60,0,120,0.18)',

  cardBackBg: '#100020',
  cardBackAccent: '#D4AF37',
  cardBackPattern: 'masquerade_veil',
  cardHighlightColor: '#D4AF37',

  chipTokenColor: '#D4AF37',
  chipWinTokenColor: '#F5E6B0',

  potBg: 'rgba(10,0,24,0.92)',
  potBorder: 'rgba(212,175,55,0.42)',
  potShadow: '#D4AF37',
  potLabelColor: 'rgba(212,175,55,0.60)',
  potAmountColor: '#D4AF37',

  foldAccent: '#9B30FF',
  checkAccent: '#1F5E52',
  callAccent: '#1F5E52',
  raiseAccent: '#D4AF37',
  allInAccent: '#F5E6B0',

  accentPrimary: '#D4AF37',
  accentSecondary: '#9B30FF',
  textColor: '#F0E8FF',

  winEffectStyle: 'gold_shimmer',
  winGoldColor: '#D4AF37',

  previewColors: ['#12001E', '#9B30FF', '#D4AF37'],
};

export const TIGER_FORTUNE: TableTheme = {
  id: 'tiger_fortune',
  name: 'TIGER FORTUNE',
  tagline: 'Exclusive VIP high-stakes Asian casino. Black, gold, and the strength of the tiger.',
  rarity: 'LEGENDARY',

  bgGradient: ['#0E0900', '#080500', '#040300', '#080500', '#0E0900'],

  glowA: 'rgba(200,148,10,0.22)',
  glowB: 'rgba(139,94,0,0.10)',
  glowCenter: 'rgba(120,80,0,0.14)',

  tableSurfaceBg: 'rgba(8,5,0,0.88)',
  tableSurfaceBorder: 'rgba(200,148,10,0.52)',
  tableSurfaceShadow: '#C8940A',
  tableCenterGlow: 'rgba(100,60,0,0.18)',

  cardBackBg: '#090600',
  cardBackAccent: '#C8940A',
  cardBackPattern: 'tiger_claw',
  cardHighlightColor: '#C8940A',

  chipTokenColor: '#C8940A',
  chipWinTokenColor: '#F5DFA0',

  potBg: 'rgba(8,5,0,0.92)',
  potBorder: 'rgba(200,148,10,0.45)',
  potShadow: '#C8940A',
  potLabelColor: 'rgba(200,148,10,0.62)',
  potAmountColor: '#C8940A',

  foldAccent: '#8B2000',
  checkAccent: '#2A6040',
  callAccent: '#2A6040',
  raiseAccent: '#C8940A',
  allInAccent: '#F5DFA0',

  accentPrimary: '#C8940A',
  accentSecondary: '#8B5E00',
  textColor: '#F5DFA0',

  winEffectStyle: 'gold_shimmer',
  winGoldColor: '#C8940A',

  previewColors: ['#080500', '#8B5E00', '#C8940A'],
};

export const SAKURA_GARDEN: TableTheme = {
  id: 'sakura_garden',
  name: 'SAKURA GARDEN',
  tagline: 'Play beneath the cherry blossoms. Peaceful, graceful, and luxuriously elegant.',
  rarity: 'LEGENDARY',

  bgGradient: ['#200814', '#160510', '#0E030C', '#160510', '#200814'],

  glowA: 'rgba(232,98,122,0.20)',
  glowB: 'rgba(196,64,124,0.10)',
  glowCenter: 'rgba(180,60,120,0.12)',

  tableSurfaceBg: 'rgba(12,4,10,0.88)',
  tableSurfaceBorder: 'rgba(232,98,122,0.44)',
  tableSurfaceShadow: '#E8627A',
  tableCenterGlow: 'rgba(150,50,100,0.16)',

  cardBackBg: '#160410',
  cardBackAccent: '#F4A8C0',
  cardBackPattern: 'sakura_blossom',
  cardHighlightColor: '#F4A8C0',

  chipTokenColor: '#F4A8C0',
  chipWinTokenColor: '#FFE8F0',

  potBg: 'rgba(12,4,10,0.92)',
  potBorder: 'rgba(232,98,122,0.42)',
  potShadow: '#E8627A',
  potLabelColor: 'rgba(232,98,122,0.60)',
  potAmountColor: '#F4A8C0',

  foldAccent: '#A02050',
  checkAccent: '#2A7050',
  callAccent: '#2A7050',
  raiseAccent: '#E8627A',
  allInAccent: '#FFE8F0',

  accentPrimary: '#E8627A',
  accentSecondary: '#C4407C',
  textColor: '#FFE8F0',

  winEffectStyle: 'gold_shimmer',
  winGoldColor: '#F4A8C0',

  previewColors: ['#160510', '#C4407C', '#F4A8C0'],
};

export const ALL_TABLE_THEMES: TableTheme[] = [
  NEON_DEFAULT,
  DRAGON_FORTUNE,
  ROYAL_MASQUERADE,
  TIGER_FORTUNE,
  SAKURA_GARDEN,
];
