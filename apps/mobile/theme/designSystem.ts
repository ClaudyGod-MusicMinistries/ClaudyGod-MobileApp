/**
 * @deprecated Use `useAppTheme()` from `util/colorScheme` for all design values.
 * This file is kept only to avoid breaking any stale imports while migration completes.
 * All values below map to the canonical tokens in `styles/designTokens.ts`.
 */
import { radius, timing, interaction } from '../styles/designTokens';

export type ThemeVariant = 'light' | 'dark';

export const designSystem = {
  radius: {
    xs:   radius.xs,
    sm:   radius.sm,
    md:   radius.md,
    lg:   radius.lg,
    xl:   radius.xl,
    '2xl': radius.xxl,
    full: radius.pill,
  },
  timing,
  interaction,
  // These shadow aliases are zeroed — shadows are removed per design direction.
  shadows: {
    none: { shadowColor: '#000', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
    xs:   { shadowColor: '#000', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
    sm:   { shadowColor: '#000', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
    md:   { shadowColor: '#000', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
    lg:   { shadowColor: '#000', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
    xl:   { shadowColor: '#000', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
  },
  spacing: { 0: 0, 2: 2, 4: 4, 6: 6, 8: 8, 12: 12, 16: 16, 20: 20, 24: 24, 28: 28, 32: 32, 36: 36, 40: 40, 48: 48 },
  opacity: { 0: 0, 5: 0.05, 10: 0.1, 15: 0.15, 20: 0.2, 25: 0.25, 30: 0.3, 40: 0.4, 50: 0.5, 60: 0.6, 70: 0.7, 80: 0.8, 90: 0.9, 100: 1 },
  typography: {
    display:      { fontSize: 22, fontWeight: '700' as const, lineHeight: 28, letterSpacing: -0.3 },
    h1:           { fontSize: 19, fontWeight: '700' as const, lineHeight: 25, letterSpacing: -0.2 },
    h2:           { fontSize: 17, fontWeight: '700' as const, lineHeight: 22, letterSpacing: -0.1 },
    h3:           { fontSize: 15, fontWeight: '600' as const, lineHeight: 20, letterSpacing: 0 },
    body:         { fontSize: 13, fontWeight: '400' as const, lineHeight: 19, letterSpacing: 0 },
    bodyMedium:   { fontSize: 13, fontWeight: '500' as const, lineHeight: 19, letterSpacing: 0 },
    bodySemibold: { fontSize: 13, fontWeight: '600' as const, lineHeight: 19, letterSpacing: 0 },
    label:        { fontSize: 11, fontWeight: '600' as const, lineHeight: 15, letterSpacing: 0.1 },
    labelSmall:   { fontSize: 10, fontWeight: '600' as const, lineHeight: 13, letterSpacing: 0.2 },
    caption:      { fontSize: 10, fontWeight: '400' as const, lineHeight: 14, letterSpacing: 0.1 },
    captionSmall: { fontSize: 9,  fontWeight: '400' as const, lineHeight: 12, letterSpacing: 0.2 },
  },
  // containers: removed — hardcoded hex bypassed theme. Use theme.colors.surface / theme.colors.elevated.
  containers: {
    card:         { light: { padding: 14, borderRadius: radius.xl, backgroundColor: 'transparent' }, dark: { padding: 14, borderRadius: radius.xl, backgroundColor: 'transparent' } },
    cardElevated: { light: { padding: 14, borderRadius: radius.xl, backgroundColor: 'transparent' }, dark: { padding: 14, borderRadius: radius.xl, backgroundColor: 'transparent' } },
  },
};
