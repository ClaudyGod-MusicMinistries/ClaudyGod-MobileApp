export const spacing = {
  xxs: 4,
  xs:  8,
  sm:  12,
  md:  16,
  lg:  22,
  xl:  28,
  xxl: 36,
  xxxl: 48,
};

export const radius = {
  sm:  8,
  md:  12,
  lg:  14,
  xl:  20,
  xxl: 28,
  pill: 999,
};

export const shadows = {
  card: {
    shadowColor: '#000000',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  soft: {
    shadowColor: '#000000',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
};

export const blur = { glass: 12 };

export const typography = {
  hero:     22,
  headline: 19,
  title:    14,
  body:     13,
  label:    11,
  caption:  10,
};

export const tv = {
  hitSlop: { top: 14, bottom: 14, left: 14, right: 14 },
  focusScale: 1.04,
  focusShadow: {
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
};

export const layout = {
  compactPhoneGutter: 16,
  phoneGutter:        20,
  tabletGutter:       32,
  desktopGutter:      48,
  maxContentWidth:    1140,
  sectionGap:         28,
  sectionGapLarge:    40,
  headerVerticalPadding: 10,
  tabBarContentPadding:  136,
};

export * from '../theme/designSystem';
