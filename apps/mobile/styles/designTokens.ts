// styles/designTokens.ts
// Centralized design system tokens for spacing, radius, shadow, typography, and TV focus states.

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
};

export const shadows = {
  card: {
    shadowColor: '#12092A',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  soft: {
    shadowColor: '#12092A',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
};

export const blur = {
  glass: 12,
};

export const typography = {
  hero: 30,
  headline: 24,
  title: 17,
  body: 16,
  label: 13,
  caption: 12,
};

export const tv = {
  hitSlop: { top: 12, bottom: 12, left: 12, right: 12 },
  focusScale: 1.08,
  focusShadow: {
    shadowColor: '#9A6BFF',
    shadowOpacity: 0.45,
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
  sectionGapLarge: 32,
  headerVerticalPadding: 16,
  tabBarContentPadding: 148,
};
