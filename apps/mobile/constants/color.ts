export const colors = {
  light: {
    background: '#F9F7FE',
    backgroundRgba: '249,247,254',
    surface: '#FFFFFF',
    surfaceAlt: '#F3EFFD',
    text: '#0F0A1A',
    textSecondary: '#6B677E',
    text_primary: '#0F0A1A',
    text_secondary: '#6B677E',
    text_accent: '#6D28D9',
    textInverse: '#FFFFFF',
    primary: '#7C3AED',
    secondary: '#6366F1',
    accent: '#A78BFA',
    accentAlt: '#8B5CF6',
    accentRgba: '167,139,250',
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
    backgroundRgba: '10,6,18',
    surface: '#1A1428',
    surfaceAlt: '#26212F',
    text: '#F5F3FF',
    textSecondary: '#B8B4D4',
    text_primary: '#F5F3FF',
    text_secondary: '#B8B4D4',
    text_accent: '#D8CAFF',
    textInverse: '#0A0612',
    primary: '#A78BFA',
    secondary: '#C4B5FD',
    accent: '#A78BFA',
    accentAlt: '#8B5CF6',
    accentRgba: '167,139,250',
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

// Export light mode colors for current theme (using dark mode as the app's light theme)
export const colors_light = colors.dark;
export const colors_dark = colors.light;
