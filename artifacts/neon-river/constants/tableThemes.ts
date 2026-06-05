export type ThemeId = 'neon_default' | 'dragon_fortune' | 'midnight_beach';

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
  cardBackPattern: 'mandala' | 'dragon_scale' | 'midnight_beach';
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
  name: 'DRAGON FORTUNE',
  tagline: 'Enter the VIP Dragon Room. Black lacquer, gold leaf, and ancient fortune await those willing to risk everything.',
  rarity: 'LEGENDARY',

  bgGradient: ['#0D0000', '#080000', '#050000', '#080000', '#0D0000'],

  glowA: 'rgba(139,0,0,0.22)',
  glowB: 'rgba(200,155,60,0.10)',
  glowCenter: 'rgba(59,0,0,0.14)',

  tableSurfaceBg: 'rgba(6,0,0,0.88)',
  tableSurfaceBorder: 'rgba(200,155,60,0.55)',
  tableSurfaceShadow: '#C89B3C',
  tableCenterGlow: 'rgba(59,0,0,0.28)',

  cardBackBg: '#0A0000',
  cardBackAccent: '#C89B3C',
  cardBackPattern: 'dragon_scale',
  cardHighlightColor: '#C89B3C',

  chipTokenColor: '#C89B3C',
  chipWinTokenColor: '#EAE3D2',

  potBg: 'rgba(6,0,0,0.92)',
  potBorder: 'rgba(200,155,60,0.45)',
  potShadow: '#C89B3C',
  potLabelColor: 'rgba(200,155,60,0.65)',
  potAmountColor: '#C89B3C',

  foldAccent: '#5a0000',
  checkAccent: '#1F5E52',
  callAccent: '#1F5E52',
  raiseAccent: '#8B0000',
  allInAccent: '#C89B3C',

  accentPrimary: '#C89B3C',
  accentSecondary: '#8B0000',
  textColor: '#EAE3D2',

  winEffectStyle: 'gold_shimmer',
  winGoldColor: '#C89B3C',

  previewColors: ['#090909', '#8B0000', '#C89B3C'],
};

export const MIDNIGHT_BEACH: TableTheme = {
  id: 'midnight_beach',
  name: 'MIDNIGHT BEACH',
  tagline: 'Neon flamingos, tropical palms, and endless stars. A luxury synthwave poker room under the Miami sky.',
  rarity: 'LEGENDARY',

  bgGradient: ['#0E0025', '#080018', '#04050F', '#080018', '#0E0025'],

  glowA: 'rgba(255,47,174,0.25)',
  glowB: 'rgba(0,212,255,0.12)',
  glowCenter: 'rgba(100,0,160,0.10)',

  tableSurfaceBg: 'rgba(4,2,14,0.90)',
  tableSurfaceBorder: 'rgba(0,212,255,0.55)',
  tableSurfaceShadow: '#00D4FF',
  tableCenterGlow: 'rgba(255,47,174,0.05)',

  cardBackBg: '#050018',
  cardBackAccent: '#FF2FAE',
  cardBackPattern: 'midnight_beach',
  cardHighlightColor: '#00D4FF',

  chipTokenColor: '#00D4FF',
  chipWinTokenColor: '#FF2FAE',

  potBg: 'rgba(4,2,14,0.95)',
  potBorder: 'rgba(0,212,255,0.60)',
  potShadow: '#00D4FF',
  potLabelColor: 'rgba(0,212,255,0.75)',
  potAmountColor: '#FF2FAE',

  foldAccent: '#FF2FAE',
  checkAccent: '#00D4FF',
  callAccent: '#00D4FF',
  raiseAccent: '#7B5FFF',
  allInAccent: '#FFD700',

  accentPrimary: '#FF2FAE',
  accentSecondary: '#00D4FF',
  textColor: '#F8F0FF',

  winEffectStyle: 'neon_burst',
  winGoldColor: '#FF2FAE',

  previewColors: ['#04050F', '#FF2FAE', '#00D4FF'],
};

export const ALL_TABLE_THEMES: TableTheme[] = [NEON_DEFAULT, DRAGON_FORTUNE, MIDNIGHT_BEACH];
