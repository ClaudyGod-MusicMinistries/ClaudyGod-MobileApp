export const colors = {
  light: {
    background: '#FFFFFF',
    surface: '#F7F7FB',
    text: {
      primary: '#0B0B0E',
      secondary: '#4B5563',
      accent: '#6B21A8',
      inverse: '#FFFFFF',
    },
    primary: '#6B21A8', // Purple brand
    secondary: '#9333EA',
    accent: '#C084FC',
    border: '#E5E7EB',
    muted: '#F2F3F7',
    gradient: {
      primary: ['#6B21A8', '#7C3AED'],
      secondary: ['#FFFFFF', '#F3F4F6'],
    },
  },
  dark: {
    background: '#000000',
    surface: '#111827',
    text: {
      primary: '#FFFFFF',
      secondary: '#E5E7EB',
      accent: '#D8B4FE',
      inverse: '#000000',
    },
    primary: '#6B21A8',
    secondary: '#9333EA',
    accent: '#C084FC',
    border: '#1F2937',
    muted: '#111827',
    gradient: {
      primary: ['#000000', '#6B21A8'],
      secondary: ['#1F2937', '#374151'],
    },
  },
};

export type ColorScheme = 'light' | 'dark';
