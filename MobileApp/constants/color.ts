export const colors = {
  light: {
    background: '#F7F8FA',
    surface: '#FFFFFF',
    surfaceAlt: '#F1F5F9',
    text: {
      primary: '#0F172A',
      secondary: '#475569',
      accent: '#1D4ED8',
      inverse: '#FFFFFF',
    },
    primary: '#1D4ED8',
    secondary: '#0EA5E9',
    accent: '#60A5FA',
    border: '#E2E8F0',
    muted: '#F1F5F9',
    success: '#16A34A',
    warning: '#F59E0B',
    danger: '#DC2626',
    gradient: {
      primary: ['#1D4ED8', '#2563EB'],
      secondary: ['#FFFFFF', '#E2E8F0'],
    },
  },
  dark: {
    background: '#0B0F1A',
    surface: '#121827',
    surfaceAlt: '#161F33',
    text: {
      primary: '#F8FAFC',
      secondary: '#A7B0C0',
      accent: '#7FB3FF',
      inverse: '#0B0F1A',
    },
    primary: '#3B82F6',
    secondary: '#22D3EE',
    accent: '#60A5FA',
    border: '#1E293B',
    muted: '#0F172A',
    success: '#22C55E',
    warning: '#FBBF24',
    danger: '#F87171',
    gradient: {
      primary: ['#0B0F1A', '#1E3A8A'],
      secondary: ['#0F172A', '#1E293B'],
    },
  },
};

export type ColorScheme = 'light' | 'dark';
