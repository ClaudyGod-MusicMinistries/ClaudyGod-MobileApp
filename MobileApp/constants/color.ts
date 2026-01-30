export const colors = {
  light: {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    text: {
      primary: '#0B1221',
      secondary: '#4B5563',
      accent: '#1ED760',
      inverse: '#FFFFFF',
    },
    primary: '#1ED760', // Spotify‑style action green
    secondary: '#FF3B30', // YouTube‑style alert red
    accent: '#22D3EE', // Cyan for highlights
    border: '#E5E7EB',
    muted: '#EEF2F7',
    gradient: {
      primary: ['#1ED760', '#16A34A'],
      secondary: ['#FFFFFF', '#EEF2F7'],
    },
  },
  dark: {
    background: '#05060D',
    surface: '#0F1118',
    text: {
      primary: '#F8FAFC',
      secondary: '#A1A5B3',
      accent: '#1ED760',
      inverse: '#05060D',
    },
    primary: '#1ED760',
    secondary: '#FF3B30',
    accent: '#22D3EE',
    border: '#1F2937',
    muted: '#111827',
    gradient: {
      primary: ['#05060D', '#0F1118'],
      secondary: ['#0F1118', '#111827'],
    },
  },
};

export type ColorScheme = 'light' | 'dark';
