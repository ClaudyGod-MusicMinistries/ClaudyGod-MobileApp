// styles/designTokens.ts
// Centralized mobile design tokens for a calmer premium streaming UI.

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 36,
  xxxl: 48,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 30,
  pill: 999,
};

export const shadows = {
  card: {
    shadowColor: '#000000',
    shadowOpacity: 0.28,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 18 },
    elevation: 12,
  },
  soft: {
    shadowColor: '#000000',
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  glow: {
    shadowColor: '#A78BFA',
    shadowOpacity: 0.24,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
};

export const blur = {
  glass: 18,
};

export const typography = {
  hero: 32,
  display: 25,
  headline: 21,
  title: 17,
  body: 14,
  label: 12,
  caption: 11,
};

export const tv = {
  hitSlop: { top: 12, bottom: 12, left: 12, right: 12 },
  focusScale: 1.06,
  focusShadow: {
    shadowColor: '#A78BFA',
    shadowOpacity: 0.34,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
};

export const layout = {
  compactPhoneGutter: 16,
  phoneGutter: 20,
  tabletGutter: 30,
  desktopGutter: 44,
  maxContentWidth: 1180,
  sectionGap: 24,
  sectionGapLarge: 32,
  headerVerticalPadding: 12,
  tabBarContentPadding: 132,
};
