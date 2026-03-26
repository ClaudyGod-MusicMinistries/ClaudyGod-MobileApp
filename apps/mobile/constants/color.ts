export const colors = {
  light: {
    background: '#F9F7FE',
    surface: '#FFFFFF',
    surfaceAlt: '#F3EFFD',
    text: {
      primary: '#0F0A1A',
      secondary: '#6B677E',
      accent: '#6D28D9',
      inverse: '#FFFFFF',
    },
    primary: '#7C3AED',
    secondary: '#6366F1',
    accent: '#A78BFA',
    border: '#E5E0F4',
    muted: '#F5F3F9',
    success: '#059669',
    warning: '#D97706',
    danger: '#DC2626',
    gradient: {
      primary: ['#7C3AED', '#6D28D9'],
      secondary: ['#F9F7FE', '#F3EFFD'],
    },
  },
  dark: {
    background: '#0A0612',
    surface: '#1A1428',
    surfaceAlt: '#26212F',
    text: {
      primary: '#F5F3FF',
      secondary: '#B8B4D4',
      accent: '#D8CAFF',
      inverse: '#0A0612',
    },
    primary: '#A78BFA',
    secondary: '#C4B5FD',
    accent: '#6D28D9',
    border: '#3D3851',
    muted: '#1A1428',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    gradient: {
      primary: ['#A78BFA', '#7C3AED'],
      secondary: ['#1A1428', '#26212F'],
    },
  },
};

export type ColorScheme = 'light' | 'dark';
