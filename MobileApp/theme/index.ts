// theme/index.ts
import { colors, ColorScheme } from '../constants/color';
import { spacing, radius, shadows, typography, tv } from '../styles/designTokens';

export type AppTheme = {
  scheme: ColorScheme;
  colors: typeof colors.light;
  spacing: typeof spacing;
  radius: typeof radius;
  shadows: typeof shadows;
  typography: typeof typography;
  tv: typeof tv;
};

export const getTheme = (scheme: ColorScheme): AppTheme => ({
  scheme,
  colors: colors[scheme],
  spacing,
  radius,
  shadows,
  typography,
  tv,
});

