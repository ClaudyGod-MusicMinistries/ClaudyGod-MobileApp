// ─── Spacing ──────────────────────────────────────────────────────────────────
export const spacing = {
  xxs:  4,
  xs:   8,
  sm:   12,
  md:   16,
  lg:   22,
  xl:   28,
  xxl:  36,
  xxxl: 48,
};

// ─── Border radius ────────────────────────────────────────────────────────────
export const radius = {
  xs:   6,    // subtle rounding on small tags
  sm:   8,    // small elements, badges
  md:   12,   // buttons, input fields, chips
  lg:   14,   // content cards
  card: 18,   // standard card/tile radius
  xl:   20,   // modal headers, feature cards
  xxl:  28,   // bottom sheets, large modals
  pill: 999,  // fully rounded / circle
};

// ─── Shadows ──────────────────────────────────────────────────────────────────
// Shadow color is always #000000; opacity carries the visual weight.
export const shadows = {
  none: {
    shadowColor:  '#000000',
    shadowOpacity: 0,
    shadowRadius:  0,
    shadowOffset:  { width: 0, height: 0 },
    elevation:     0,
  },
  sm: {
    shadowColor:  '#000000',
    shadowOpacity: 0.08,
    shadowRadius:  4,
    shadowOffset:  { width: 0, height: 2 },
    elevation:     2,
  },
  md: {
    shadowColor:  '#000000',
    shadowOpacity: 0.12,
    shadowRadius:  10,
    shadowOffset:  { width: 0, height: 4 },
    elevation:     4,
  },
  lg: {
    shadowColor:  '#000000',
    shadowOpacity: 0.18,
    shadowRadius:  18,
    shadowOffset:  { width: 0, height: 6 },
    elevation:     8,
  },
  xl: {
    shadowColor:  '#000000',
    shadowOpacity: 0.28,
    shadowRadius:  28,
    shadowOffset:  { width: 0, height: 10 },
    elevation:     14,
  },
  xxl: {
    shadowColor:  '#000000',
    shadowOpacity: 0.44,
    shadowRadius:  40,
    shadowOffset:  { width: 0, height: 14 },
    elevation:     24,
  },
  // Backward compat aliases
  card: {
    shadowColor:  '#000000',
    shadowOpacity: 0.08,
    shadowRadius:  4,
    shadowOffset:  { width: 0, height: 2 },
    elevation:     2,
  },
  soft: {
    shadowColor:  '#000000',
    shadowOpacity: 0.06,
    shadowRadius:  6,
    shadowOffset:  { width: 0, height: 2 },
    elevation:     2,
  },
};

// ─── Blur ────────────────────────────────────────────────────────────────────
export const blur = { glass: 12 };

// ─── Typography scale (numeric values only; use CustomText variant prop instead)
export const typography = {
  hero:     26,
  headline: 20,
  title:    15,
  body:     14,
  label:    12,
  caption:  11,
};

// ─── TV / focus ──────────────────────────────────────────────────────────────
export const tv = {
  hitSlop: { top: 14, bottom: 14, left: 14, right: 14 },
  focusScale: 1.04,
  focusShadow: {
    shadowColor:   '#8B5CF6',
    shadowOpacity: 0.18,
    shadowRadius:  12,
    shadowOffset:  { width: 0, height: 5 },
    elevation:     4,
  },
};

// ─── Layout ──────────────────────────────────────────────────────────────────
export const layout = {
  compactPhoneGutter:    16,
  phoneGutter:           20,
  tabletGutter:          32,
  desktopGutter:         48,
  maxContentWidth:       1140,
  sectionGap:            28,
  sectionGapLarge:       40,
  headerVerticalPadding: 10,
  tabBarContentPadding:  136,
};

export * from '../theme/designSystem';
