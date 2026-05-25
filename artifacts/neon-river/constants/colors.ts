export type ColorTheme = 'dark' | 'light';

const darkColors = {
  background: '#050010',
  surface: '#0f0020',
  surfaceElevated: '#180030',
  surfaceCard: '#1e0040',

  tableFelt: '#0d1638',
  tableRing: '#1a0040',
  tableBorder: '#cc0088',

  primary: '#00d4ff',
  primaryDim: 'rgba(0,212,255,0.2)',
  primaryGlow: 'rgba(0,212,255,0.4)',

  secondary: '#ff0090',
  secondaryDim: 'rgba(255,0,144,0.2)',
  secondaryGlow: 'rgba(255,0,144,0.4)',

  accent: '#bf5fff',
  accentDim: 'rgba(191,95,255,0.2)',
  accentGlow: 'rgba(191,95,255,0.4)',

  gold: '#ffd700',
  goldDim: '#b89a10',
  chrome: '#a0a8c0',

  text: '#ffffff',
  textMuted: '#8888aa',
  textDim: '#505068',

  cardBg: '#f2ead8',
  heartDiamond: '#d42020',
  spadeClub: '#1a1a30',

  success: '#00ff88',
  successDim: 'rgba(0,255,136,0.2)',
  error: '#ff4444',
  errorDim: 'rgba(255,68,68,0.2)',
  warning: '#ffaa00',

  border: '#25004a',
  borderBright: '#5500bb',

  radius: 12,
  radiusLg: 20,
  radiusSm: 8,
};

const lightColors = {
  background: '#F7F7FB',
  surface: '#FFFFFF',
  surfaceElevated: '#EFEFF6',
  surfaceCard: '#E8E8F2',

  tableFelt: '#0d1638',
  tableRing: '#1a0040',
  tableBorder: '#cc0088',

  primary: '#0088bb',
  primaryDim: 'rgba(0,136,187,0.12)',
  primaryGlow: 'rgba(0,136,187,0.28)',

  secondary: '#bf0060',
  secondaryDim: 'rgba(191,0,96,0.12)',
  secondaryGlow: 'rgba(191,0,96,0.28)',

  accent: '#7722cc',
  accentDim: 'rgba(119,34,204,0.12)',
  accentGlow: 'rgba(119,34,204,0.28)',

  gold: '#996600',
  goldDim: '#7a5200',
  chrome: '#6a6888',

  text: '#121212',
  textMuted: '#4F4F5E',
  textDim: '#7A7A8A',

  cardBg: '#f2ead8',
  heartDiamond: '#d42020',
  spadeClub: '#1a1a30',

  success: '#006633',
  successDim: 'rgba(0,102,51,0.12)',
  error: '#bb1111',
  errorDim: 'rgba(187,17,17,0.12)',
  warning: '#885500',

  border: '#D9D9E6',
  borderBright: '#7722cc',

  radius: 12,
  radiusLg: 20,
  radiusSm: 8,
};

export type Colors = typeof darkColors;

export function getColors(theme: ColorTheme): Colors {
  return theme === 'dark' ? darkColors : lightColors;
}

export default darkColors;
