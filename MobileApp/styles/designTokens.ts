// styles/designTokens.ts
// Centralized design system tokens for spacing, radius, shadow, typography, and TV focus states.

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  pill: 999,
};

export const shadows = {
  card: {
    shadowColor: '#0B1120',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  soft: {
    shadowColor: '#0B1120',
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
  hero: 28,
  headline: 20,
  title: 17,
  body: 14,
  label: 12,
  caption: 11,
};

export const tv = {
  hitSlop: { top: 12, bottom: 12, left: 12, right: 12 },
  focusScale: 1.06,
  focusShadow: {
    shadowColor: '#7C3AED',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
};

export const layout = {
  maxContentWidth: 1280, // helps on tablets/TV by clamping overly wide rows
};
