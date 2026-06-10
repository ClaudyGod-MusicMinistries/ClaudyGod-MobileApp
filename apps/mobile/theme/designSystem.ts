/**
 * Design System - Global styling tokens for professional, world-class UI
 * Inspired by Spotify, YouTube, and premium streaming platforms
 */

export const designSystem = {
  // Shadows (elevated, modern, premium)
  shadows: {
    none: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    xs: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 1,
    },
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.16,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.24,
      shadowRadius: 24,
      elevation: 12,
    },
  },

  // Spacing scale (8px base unit)
  spacing: {
    0: 0,
    2: 2,
    4: 4,
    6: 6,
    8: 8,
    12: 12,
    16: 16,
    20: 20,
    24: 24,
    28: 28,
    32: 32,
    36: 36,
    40: 40,
    48: 48,
  },

  // Border radius (modern, consistent)
  radius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    full: 999,
  },

  // Opacity scale
  opacity: {
    0: 0,
    5: 0.05,
    10: 0.1,
    15: 0.15,
    20: 0.2,
    25: 0.25,
    30: 0.3,
    40: 0.4,
    50: 0.5,
    60: 0.6,
    70: 0.7,
    80: 0.8,
    90: 0.9,
    100: 1,
  },

  // Gradients (premium, music/video streaming inspired)
  gradients: {
    // Hero/featured
    hero: {
      default: ['#B794F6', '#7C3AED'],
      warm: ['#F59E0B', '#DC2626'],
      cool: ['#06B6D4', '#3B82F6'],
      vibrant: ['#EC4899', '#8B5CF6'],
    },
    // Card backgrounds
    card: {
      subtle: ['rgba(183, 148, 246, 0.05)', 'rgba(124, 58, 237, 0.03)'],
      soft: ['rgba(183, 148, 246, 0.08)', 'rgba(124, 58, 237, 0.06)'],
      medium: ['rgba(183, 148, 246, 0.12)', 'rgba(124, 58, 237, 0.08)'],
    },
    // Overlay effects
    overlay: {
      light: ['rgba(255, 255, 255, 0.15)', 'transparent'],
      dark: ['transparent', 'rgba(0, 0, 0, 0.3)'],
    },
  },

  // Typography scale
  typography: {
    // Display/Hero headlines
    display: {
      fontSize: 48,
      fontWeight: '700',
      lineHeight: 56,
      letterSpacing: -0.5,
    },
    h1: {
      fontSize: 36,
      fontWeight: '700',
      lineHeight: 44,
      letterSpacing: -0.3,
    },
    h2: {
      fontSize: 28,
      fontWeight: '700',
      lineHeight: 36,
      letterSpacing: -0.2,
    },
    h3: {
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 32,
      letterSpacing: 0,
    },
    // Body text
    body: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,
      letterSpacing: 0,
    },
    bodyMedium: {
      fontSize: 16,
      fontWeight: '500',
      lineHeight: 24,
      letterSpacing: 0,
    },
    bodySemibold: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 24,
      letterSpacing: 0,
    },
    // Labels
    label: {
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 20,
      letterSpacing: 0.1,
    },
    labelSmall: {
      fontSize: 12,
      fontWeight: '500',
      lineHeight: 16,
      letterSpacing: 0.2,
    },
    // Captions
    caption: {
      fontSize: 13,
      fontWeight: '400',
      lineHeight: 18,
      letterSpacing: 0.1,
    },
    captionSmall: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 16,
      letterSpacing: 0.2,
    },
  },

  // Animation timing functions (smooth, premium feel)
  timing: {
    fast: 150,
    base: 250,
    moderate: 350,
    slow: 500,
  },

  // Touch/interaction feedback
  interaction: {
    pressScale: 0.98,
    hoverOpacity: 0.8,
    activeOpacity: 0.7,
    disabledOpacity: 0.5,
  },

  // Container styles
  containers: {
    card: {
      light: {
        padding: 16,
        borderRadius: 16,
        backgroundColor: '#FCFAFF',
        borderColor: '#DDD3EE',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
      },
      dark: {
        padding: 16,
        borderRadius: 16,
        backgroundColor: '#171124',
        borderColor: '#2B223D',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
      },
    },
    cardElevated: {
      light: {
        padding: 16,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        borderColor: '#DDD3EE',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 4,
      },
      dark: {
        padding: 16,
        borderRadius: 16,
        backgroundColor: '#1B132A',
        borderColor: '#403253',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
      },
    },
    cardGlass: {
      light: {
        padding: 16,
        borderRadius: 16,
        backgroundColor: 'rgba(252, 250, 255, 0.7)',
        borderColor: 'rgba(221, 211, 238, 0.4)',
        borderWidth: 1,
        backdropFilter: 'blur(8px)',
      },
      dark: {
        padding: 16,
        borderRadius: 16,
        backgroundColor: 'rgba(23, 17, 36, 0.5)',
        borderColor: 'rgba(43, 34, 61, 0.4)',
        borderWidth: 1,
        backdropFilter: 'blur(8px)',
      },
    },
  },
};

export type ThemeVariant = 'light' | 'dark';
