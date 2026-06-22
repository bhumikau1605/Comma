export const lightColors = {
  bg: '#F7F4EF',
  card: '#FFFFFF',
  primary: '#1C1C1E',
  green: '#4A7C59',
  accent: '#E8956D',
  muted: '#8E8E93',
  border: '#ECEAE3',
  input: '#F0EDE6',
  danger: '#D94F4F',
  warn: '#E8A020',
  overlay: 'rgba(0,0,0,0.5)',
};

export const darkColors = {
  bg: '#0F0F0F',
  card: '#1C1C1E',
  primary: '#F2F2F7',
  green: '#5DB075',
  accent: '#E8956D',
  muted: '#636366',
  border: '#2C2C2E',
  input: '#2C2C2E',
  danger: '#FF453A',
  warn: '#FFD60A',
  overlay: 'rgba(0,0,0,0.7)',
};

export const R = { sm: 12, md: 18, lg: 24, xl: 32, full: 999 };

export const S = {
  sm: { shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  md: { shadowColor: '#000', shadowOpacity: 0.11, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  lg: { shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
};

// Default export for backward compat — screens import { C } from theme
export const C = lightColors;
