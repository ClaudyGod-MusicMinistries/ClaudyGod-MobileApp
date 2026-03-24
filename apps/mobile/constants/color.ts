export const colors = {
  light: {
    background: '#F6F4FB',
    surface: '#FFFFFF',
    surfaceAlt: '#F0ECFA',
    text: {
      primary: '#161223',
      secondary: '#66607B',
      accent: '#7E56FF',
      inverse: '#FCFBFF',
    },
    primary: '#7E56FF',
    secondary: '#64739A',
    accent: '#B4A0FF',
    border: '#DFD8F1',
    muted: '#F3EFFB',
    success: '#1D9159',
    warning: '#C78D18',
    danger: '#C95C5C',
    gradient: {
      primary: ['#241845', '#100B1D'],
      secondary: ['#FBFAFE', '#F0EBFA'],
    },
  },
  dark: {
    background: '#05040A',
    surface: '#11101A',
    surfaceAlt: '#191726',
    text: {
      primary: '#F7F4FF',
      secondary: '#AAA3C5',
      accent: '#C5B5FF',
      inverse: '#09070E',
    },
    primary: '#8D63FF',
    secondary: '#7082AE',
    accent: '#57478F',
    border: '#2A2740',
    muted: '#0D0C15',
    success: '#2FB46B',
    warning: '#D19825',
    danger: '#E16D6D',
    gradient: {
      primary: ['#1B1235', '#07060E'],
      secondary: ['#171523', '#0D0C14'],
    },
  },
};

export type ColorScheme = 'light' | 'dark';
