export type ThemeId = 'neon_default' | 'dragon_fortune' | 'royal_masquerade' | 'sakura_garden' | 'frozen_neon' | 'crimson_noir';

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
  cardBackPattern: 'mandala' | 'dragon_scale' | 'masquerade_veil' | 'sakura_blossom' | 'frozen_glass' | 'crimson_silk';
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

export const SAKURA_GARDEN: TableTheme = {
  id: 'sakura_garden',
  name: 'SAKURA',
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

export const FROZEN_NEON: TableTheme = {
  id: 'frozen_neon',
  name: 'FROZEN',
  tagline: 'A luxury arctic casino lit by pure cyan neon. Frosted glass, deep navy, and ice-blue light.',
  rarity: 'LEGENDARY',

  bgGradient: ['#0A1628', '#060E1C', '#030A14', '#060E1C', '#0A1628'],

  glowA: 'rgba(0,217,255,0.16)',
  glowB: 'rgba(143,239,255,0.08)',
  glowCenter: 'rgba(0,160,200,0.10)',

  tableSurfaceBg: 'rgba(4,10,20,0.82)',
  tableSurfaceBorder: 'rgba(0,217,255,0.36)',
  tableSurfaceShadow: '#00D9FF',
  tableCenterGlow: 'rgba(0,160,200,0.12)',

  cardBackBg: '#040D18',
  cardBackAccent: '#00D9FF',
  cardBackPattern: 'frozen_glass',
  cardHighlightColor: '#8FEFFF',

  chipTokenColor: '#00D9FF',
  chipWinTokenColor: '#F5FCFF',

  potBg: 'rgba(4,10,20,0.92)',
  potBorder: 'rgba(0,217,255,0.36)',
  potShadow: '#00D9FF',
  potLabelColor: 'rgba(143,239,255,0.55)',
  potAmountColor: '#8FEFFF',

  foldAccent: '#3E7A8C',
  checkAccent: '#00D9FF',
  callAccent: '#00B8A8',
  raiseAccent: '#8FEFFF',
  allInAccent: '#F5FCFF',

  accentPrimary: '#00D9FF',
  accentSecondary: '#8FEFFF',
  textColor: '#F5FCFF',

  winEffectStyle: 'neon_burst',
  winGoldColor: '#8FEFFF',

  previewColors: ['#08101E', '#00D9FF', '#8FEFFF'],
};

export const CRIMSON_NOIR: TableTheme = {
  id: 'crimson_noir',
  name: 'CRIMSON NOIR',
  tagline: 'An invitation-only underground poker room. Deep black, smoked glass, and hidden crimson light.',
  rarity: 'LEGENDARY',

  bgGradient: ['#0A0004', '#050505', '#070002', '#050505', '#0A0004'],

  glowA: 'rgba(160,0,28,0.22)',
  glowB: 'rgba(58,0,16,0.14)',
  glowCenter: 'rgba(101,0,20,0.12)',

  tableSurfaceBg: 'rgba(5,3,4,0.90)',
  tableSurfaceBorder: 'rgba(212,0,42,0.38)',
  tableSurfaceShadow: '#D4002A',
  tableCenterGlow: 'rgba(80,0,20,0.16)',

  cardBackBg: '#0A0003',
  cardBackAccent: '#D4002A',
  cardBackPattern: 'crimson_silk',
  cardHighlightColor: '#D4002A',

  chipTokenColor: '#D4002A',
  chipWinTokenColor: '#F0F0F0',

  potBg: 'rgba(5,3,4,0.94)',
  potBorder: 'rgba(212,0,42,0.38)',
  potShadow: '#D4002A',
  potLabelColor: 'rgba(212,0,42,0.55)',
  potAmountColor: '#F0F0F0',

  foldAccent: '#6B0018',
  checkAccent: '#A0001C',
  callAccent: '#285030',
  raiseAccent: '#D4002A',
  allInAccent: '#F0F0F0',

  accentPrimary: '#D4002A',
  accentSecondary: '#A0001C',
  textColor: '#F0E8E8',

  winEffectStyle: 'gold_shimmer',
  winGoldColor: '#D4002A',

  previewColors: ['#050505', '#A0001C', '#D4002A'],
};

export const ALL_TABLE_THEMES: TableTheme[] = [
  NEON_DEFAULT,
  DRAGON_FORTUNE,
  ROYAL_MASQUERADE,
  SAKURA_GARDEN,
  FROZEN_NEON,
  CRIMSON_NOIR,
];
