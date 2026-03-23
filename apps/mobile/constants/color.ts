export const colors = {
  light: {
    background: '#F4F2FA',
    surface: '#FFFFFF',
    surfaceAlt: '#ECE8F8',
    text: {
      primary: '#171426',
      secondary: '#655F79',
      accent: '#785EE6',
      inverse: '#FBFAFF',
    },
    primary: '#7C59E6',
    secondary: '#64739A',
    accent: '#B59EFF',
    border: '#DBD5F0',
    muted: '#F0ECF9',
    success: '#1F8F57',
    warning: '#C98917',
    danger: '#C85858',
    gradient: {
      primary: ['#251845', '#100C1C'],
      secondary: ['#F9F7FE', '#EEE9FA'],
    },
  },
  dark: {
    background: '#06060B',
    surface: '#12121B',
    surfaceAlt: '#1A1927',
    text: {
      primary: '#F7F5FF',
      secondary: '#AAA5C4',
      accent: '#C4B2FF',
      inverse: '#0B0A12',
    },
    primary: '#8B5CF6',
    secondary: '#6677A0',
    accent: '#5A4A94',
    border: '#2A2840',
    muted: '#0E0D17',
    success: '#2FB56B',
    warning: '#D49A25',
    danger: '#E16D6D',
    gradient: {
      primary: ['#1D1435', '#08070F'],
      secondary: ['#1A1927', '#11111A'],
    },
  },
};

export type ColorScheme = 'light' | 'dark';
