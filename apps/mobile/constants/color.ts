export const colors = {
  light: {
    background: '#F4F1FA',
    surface: '#FFFFFF',
    surfaceAlt: '#F1ECFA',
    text: {
      primary: '#141021',
      secondary: '#6A637E',
      accent: '#6D28D9',
      inverse: '#FFFFFF',
    },
    primary: '#6D28D9',
    secondary: '#8B5CF6',
    accent: '#C4B5FD',
    border: '#E7E0F3',
    muted: '#ECE6F7',
    success: '#16A34A',
    warning: '#F59E0B',
    danger: '#DC2626',
    gradient: {
      primary: ['#5B21B6', '#7C3AED'],
      secondary: ['#FFFFFF', '#ECE6F7'],
    },
  },
  dark: {
    background: '#06040D',
    surface: '#0F0B19',
    surfaceAlt: '#161126',
    text: {
      primary: '#F8F7FC',
      secondary: '#B7B1CC',
      accent: '#D8C5FF',
      inverse: '#08060F',
    },
    primary: '#9A6BFF',
    secondary: '#7C3AED',
    accent: '#C4B5FD',
    border: '#292042',
    muted: '#151024',
    success: '#22C55E',
    warning: '#FBBF24',
    danger: '#F87171',
    gradient: {
      primary: ['#090611', '#2A1255'],
      secondary: ['#0F0B19', '#161126'],
    },
  },
};

export type ColorScheme = 'light' | 'dark';
