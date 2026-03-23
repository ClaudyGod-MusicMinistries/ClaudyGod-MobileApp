export const colors = {
  light: {
    background: '#F3F0EA',
    surface: '#FFFFFF',
    surfaceAlt: '#EEE8DE',
    text: {
      primary: '#14191F',
      secondary: '#5F6972',
      accent: '#8D6A31',
      inverse: '#FBFBFA',
    },
    primary: '#C6A35E',
    secondary: '#5E7387',
    accent: '#D8C39B',
    border: '#DED6C7',
    muted: '#F5F0E6',
    success: '#1F8F57',
    warning: '#C98917',
    danger: '#C85858',
    gradient: {
      primary: ['#13181E', '#0B0F14'],
      secondary: ['#F7F3EC', '#ECE4D8'],
    },
  },
  dark: {
    background: '#07090C',
    surface: '#11161B',
    surfaceAlt: '#171D24',
    text: {
      primary: '#F5F1E8',
      secondary: '#9CA7B2',
      accent: '#DEC07F',
      inverse: '#0B0E12',
    },
    primary: '#D2AF69',
    secondary: '#61798E',
    accent: '#8EA1B2',
    border: '#252D35',
    muted: '#0D1217',
    success: '#2FB56B',
    warning: '#D49A25',
    danger: '#E16D6D',
    gradient: {
      primary: ['#13181D', '#0B0E13'],
      secondary: ['#171D24', '#11161B'],
    },
  },
};

export type ColorScheme = 'light' | 'dark';
