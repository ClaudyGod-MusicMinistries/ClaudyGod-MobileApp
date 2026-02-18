// styles/designTokens.ts
// Centralized design system tokens for spacing, radius, shadow, typography, and TV focus states.

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 26,
  pill: 999,
};

export const shadows = {
  card: {
    shadowColor: '#12092A',
    shadowOpacity: 0.2,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 12 },
    elevation: 9,
  },
  soft: {
    shadowColor: '#12092A',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
};

export const blur = {
  glass: 12,
};

export const typography = {
  hero: 24,
  headline: 18,
  title: 16,
  body: 13,
  label: 12,
  caption: 10,
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
  maxContentWidth: 1360, // helps on tablets/TV by clamping overly wide rows
};
