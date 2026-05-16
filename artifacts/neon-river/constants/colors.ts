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
  background: '#f2edff',
  surface: '#ffffff',
  surfaceElevated: '#ece4ff',
  surfaceCard: '#e4d8ff',

  tableFelt: '#0d1638',
  tableRing: '#1a0040',
  tableBorder: '#cc0088',

  primary: '#0099cc',
  primaryDim: 'rgba(0,153,204,0.2)',
  primaryGlow: 'rgba(0,153,204,0.35)',

  secondary: '#cc006e',
  secondaryDim: 'rgba(204,0,110,0.2)',
  secondaryGlow: 'rgba(204,0,110,0.35)',

  accent: '#8833dd',
  accentDim: 'rgba(136,51,221,0.2)',
  accentGlow: 'rgba(136,51,221,0.35)',

  gold: '#b8860b',
  goldDim: '#8a6308',
  chrome: '#6a6888',

  text: '#0d0020',
  textMuted: '#4e4070',
  textDim: '#8878a8',

  cardBg: '#f2ead8',
  heartDiamond: '#d42020',
  spadeClub: '#1a1a30',

  success: '#007a40',
  successDim: 'rgba(0,122,64,0.2)',
  error: '#cc2222',
  errorDim: 'rgba(204,34,34,0.2)',
  warning: '#aa6600',

  border: '#cbbef0',
  borderBright: '#8844dd',

  radius: 12,
  radiusLg: 20,
  radiusSm: 8,
};

export type Colors = typeof darkColors;

export function getColors(theme: ColorTheme): Colors {
  return theme === 'dark' ? darkColors : lightColors;
}

export default darkColors;
