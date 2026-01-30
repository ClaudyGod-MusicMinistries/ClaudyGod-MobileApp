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
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
};

export const shadows = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  soft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
};

export const blur = {
  glass: 12,
};

export const typography = {
  hero: 32,
  headline: 24,
  title: 20,
  body: 16,
  label: 14,
  caption: 12,
};

export const tv = {
  hitSlop: { top: 12, bottom: 12, left: 12, right: 12 },
  focusScale: 1.06,
  focusShadow: {
    shadowColor: '#22D3EE',
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 14,
  },
};

export const layout = {
  maxContentWidth: 1280, // helps on tablets/TV by clamping overly wide rows
};

