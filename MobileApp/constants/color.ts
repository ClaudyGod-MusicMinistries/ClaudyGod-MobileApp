export const colors = {
  light: {
    background: '#FFFFFF',
    surface: '#F8FAFC',
    text: {
      primary: '#000000',
      secondary: '#4B5563',
      accent: '#6B21A8',
      inverse: '#FFFFFF' // Add inverse text color for dark backgrounds
    },
    primary: '#6B21A8', // purple-900
    secondary: '#9333EA', // purple-700
    accent: '#A855F7', // purple-500 for better visibility
    border: '#D1D5DB',
    gradient: {
      primary: ['#6B21A8', '#7C3AED'],
      secondary: ['#FFFFFF', '#F3F4F6']
    }
  },
  dark: {
    background: '#000000',
    surface: '#111827',
    text: {
      primary: '#FFFFFF',
      secondary: '#E5E7EB', // Lighter gray for better contrast
      accent: '#D8B4FE', // Light purple for accent text
      inverse: '#000000' // Add inverse text color for light backgrounds
    },
    primary: '#6B21A8', // purple-900
    secondary: '#9333EA', // purple-700
    accent: '#C084FC', // Brighter purple for better visibility
    border: '#374151',
    gradient: {
      primary: ['#000000', '#6B21A8'],
      secondary: ['#1F2937', '#374151']
    }
  }
};

export type ColorScheme = 'light' | 'dark';