// styles/designTokens.ts
// Centralized design system tokens for spacing, radius, shadow, typography, and TV focus states.

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 36,
  xxxl: 44,
};

export const radius = {
  sm: 8,
  md: 10,
  lg: 14,
  xl: 18,
  pill: 14,
};

export const shadows = {
  card: {
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
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
  hero: 26,
  headline: 20,
  title: 15,
  body: 14,
  label: 12,
  caption: 10,
};

export const tv = {
  hitSlop: { top: 12, bottom: 12, left: 12, right: 12 },
  focusScale: 1.08,
  focusShadow: {
    shadowColor: '#8B5CF6',
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
  maxContentWidth: 1320,
  sectionGap: 22,
  sectionGapLarge: 28,
  headerVerticalPadding: 10,
  tabBarContentPadding: 128,
};
