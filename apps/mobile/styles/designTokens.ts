// styles/designTokens.ts
// Centralized design system tokens for spacing, radius, shadow, typography, and TV focus states.

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 22,
  xl: 30,
  xxl: 38,
  xxxl: 46,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 16,
};

export const shadows = {
  card: {
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  soft: {
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
};

export const blur = {
  glass: 12,
};

export const typography = {
  hero: 28,
  headline: 22,
  title: 16,
  body: 15,
  label: 12,
  caption: 11,
};

export const tv = {
  hitSlop: { top: 12, bottom: 12, left: 12, right: 12 },
  focusScale: 1.08,
  focusShadow: {
    shadowColor: '#D2AF69',
    shadowOpacity: 0.34,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
};

export const layout = {
  compactPhoneGutter: 16,
  phoneGutter: 20,
  tabletGutter: 28,
  desktopGutter: 40,
  maxContentWidth: 1360,
  sectionGap: 24,
  sectionGapLarge: 30,
  headerVerticalPadding: 12,
  tabBarContentPadding: 132,
};
