export const colors = {
  light: {
    background: '#F9F7FE', backgroundRgba: '249,247,254', surface: '#FFFFFF', surfaceAlt: '#F3EFFD', elevated: '#FFFFFF',
    text: '#110A1F', textSecondary: '#625A78', textMuted: '#8D84A3', text_primary: '#110A1F', text_secondary: '#625A78', text_accent: '#6D28D9', textInverse: '#FFFFFF',
    primary: '#7C3AED', secondary: '#6366F1', accent: '#A78BFA', accentAlt: '#8B5CF6', accentRgba: '167,139,250',
    border: '#E5E0F4', borderStrong: '#D8CFF1', muted: '#F5F3F9', success: '#059669', warning: '#D97706', danger: '#DC2626', playerGlass: 'rgba(255,255,255,0.74)',
    gradient: { primary: ['#7C3AED', '#6D28D9'], secondary: ['#F9F7FE', '#F3EFFD'], player: ['#FFFFFF', '#F3EFFD', '#EDE7FB'], screen: ['#F9F7FE', '#F3EFFD', '#F9F7FE'], hero: ['rgba(124,58,237,0.22)', 'rgba(255,255,255,0.00)'] },
  },
  dark: {
    background: '#08050F', backgroundRgba: '8,5,15', surface: '#151020', surfaceAlt: '#211A31', elevated: '#1B1428',
    text: '#FAF7FF', textSecondary: '#BDB5D6', textMuted: '#8D84A3', text_primary: '#FAF7FF', text_secondary: '#BDB5D6', text_accent: '#D8CAFF', textInverse: '#130C22',
    primary: '#B794F6', secondary: '#C4B5FD', accent: '#A78BFA', accentAlt: '#8B5CF6', accentRgba: '167,139,250',
    border: '#342A47', borderStrong: '#4A3D64', muted: '#151020', success: '#10B981', warning: '#F59E0B', danger: '#EF4444', playerGlass: 'rgba(12,8,22,0.78)',
    gradient: { primary: ['#B794F6', '#7C3AED'], secondary: ['#151020', '#211A31'], player: ['rgba(34,25,55,0.98)', 'rgba(15,10,29,0.99)', 'rgba(7,5,13,1)'], screen: ['#08050F', '#0D0918', '#08050F'], hero: ['rgba(183,148,246,0.22)', 'rgba(8,5,15,0.00)'] },
  },
};
export type ColorScheme = 'light' | 'dark';
export const colors_light = colors.dark;
export const colors_dark = colors.light;
