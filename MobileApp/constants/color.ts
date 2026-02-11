export const colors = {
  light: {
    background: '#FFFFFF',
    surface: '#F7F5FB',
    surfaceAlt: '#F2EEF9',
    text: {
      primary: '#0B0B0E',
      secondary: '#4B5563',
      accent: '#6B21A8',
      inverse: '#FFFFFF',
    },
    primary: '#6B21A8',
    secondary: '#9333EA',
    accent: '#C084FC',
    border: '#E5E7EB',
    muted: '#F2EEF9',
    success: '#16A34A',
    warning: '#F59E0B',
    danger: '#DC2626',
    gradient: {
      primary: ['#6B21A8', '#7C3AED'],
      secondary: ['#FFFFFF', '#F3F4F6'],
    },
  },
  dark: {
    background: '#0A0A0F',
    surface: '#14111C',
    surfaceAlt: '#1B1626',
    text: {
      primary: '#FFFFFF',
      secondary: '#E5E7EB',
      accent: '#D8B4FE',
      inverse: '#0A0A0F',
    },
    primary: '#7C3AED',
    secondary: '#9333EA',
    accent: '#C084FC',
    border: '#2A2340',
    muted: '#13101A',
    success: '#22C55E',
    warning: '#FBBF24',
    danger: '#F87171',
    gradient: {
      primary: ['#0A0A0F', '#4C1D95'],
      secondary: ['#14111C', '#1B1626'],
    },
  },
};

export type ColorScheme = 'light' | 'dark';
