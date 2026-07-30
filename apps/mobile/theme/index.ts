// theme/index.ts
import { colors, ColorScheme } from '../constants/color';
import { spacing, radius, shadows, tv, layout, timing, motion, interaction } from '../styles/designTokens';

export type AppTheme = {
  scheme: ColorScheme;
  colors: typeof colors.light;
  spacing: typeof spacing;
  radius: typeof radius;
  shadows: typeof shadows;
  tv: typeof tv;
  layout: typeof layout;
  timing: typeof timing;
  motion: typeof motion;
  interaction: typeof interaction;
};

export const getTheme = (scheme: ColorScheme): AppTheme => ({
  scheme,
  colors: colors[scheme],
  spacing,
  radius,
  shadows,
  tv,
  layout,
  timing,
  motion,
  interaction,
});
