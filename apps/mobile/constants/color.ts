export const colors = {
  light: {
    // ── Backgrounds ──────────────────────────────────────────────────────────
    background:     '#FFFFFF',
    backgroundRgba: '255,255,255',
    surface:        '#F6F6F7',
    surfaceAlt:     '#EEEEEF',
    elevated:       '#FFFFFF',
    card:           '#F0F0F1',
    cardHover:      '#E6E6E8',
    inputBg:        '#F4F4F5',

    // ── Scheme-aware fills (replaces all `scheme==='dark' ? rgba(255,...) : rgba(0,...)` inline checks)
    subtleFill:       'rgba(0,0,0,0.04)',   // inactive chips, subtle row bg
    subtleFillMed:    'rgba(0,0,0,0.06)',   // slightly stronger fill
    subtleFillStrong: 'rgba(0,0,0,0.09)',   // hover / pressed state

    // ── Glass / overlay ───────────────────────────────────────────────────────
    glass:        'rgba(255,255,255,0.72)',
    glassStrong:  'rgba(255,255,255,0.94)',
    overlay:      'rgba(0,0,0,0.48)',
    overlayLight: 'rgba(0,0,0,0.24)',
    scrim:        'rgba(0,0,0,0.60)',
    mediaScrim:       'rgba(5,4,12,0.56)',
    mediaScrimStrong: 'rgba(5,4,12,0.94)',
    mediaControl:     'rgba(5,4,12,0.58)',
    mediaBorder:      'rgba(255,255,255,0.22)',
    mediaText:        '#FFFFFF',
    mediaTextMuted:   'rgba(255,255,255,0.76)',
    mediaTextSubtle:  'rgba(255,255,255,0.58)',
    liveSurface:      'rgba(220,38,38,0.94)',

    // ── Dividers / borders ────────────────────────────────────────────────────
    divider:      'rgba(0,0,0,0.07)',
    border:       'rgba(0,0,0,0.09)',
    borderStrong: 'rgba(0,0,0,0.16)',
    muted:        '#E8E8E9',
    shadow:       '#000000',

    // ── Text ─────────────────────────────────────────────────────────────────
    text:           '#0D0D0D',
    textSecondary:  '#4A4A4A',
    textMuted:      '#666671',
    text_primary:   '#0D0D0D',
    text_secondary: '#4A4A4A',
    text_accent:    '#6D28D9',
    textInverse:    '#FFFFFF',
    onPrimary:      '#FFFFFF',

    // ── Interactive controls ────────────────────────────────────────────────
    // These are deliberately separate from the decorative brand palette.
    // Form selection must retain WCAG-readable foreground/background contrast.
    controlSurface:            '#FFFFFF',
    controlBorder:             'rgba(0,0,0,0.16)',
    controlText:               '#4A4A4A',
    controlSelectedSurface:    '#6D28D9',
    controlSelectedBorder:     '#6D28D9',
    controlSelectedText:       '#FFFFFF',
    controlSelectedIconSurface:'rgba(255,255,255,0.16)',

    // ── Brand / semantic ──────────────────────────────────────────────────────
    primary:      '#7C3AED',
    secondary:    '#5B51E8',
    accent:       '#9061F9',
    accentAlt:    '#7C3AED',
    accentRgba:   '124,58,237',
    success:      '#16A34A',
    warning:      '#D97706',
    danger:       '#DC2626',
    info:         '#2563EB',

    // ── Primary tints ─────────────────────────────────────────────────────────
    primarySurface:     'rgba(124,58,237,0.07)',
    primaryBorder:      'rgba(124,58,237,0.18)',
    primaryFocusBorder: 'rgba(124,58,237,0.34)',

    // ── Semantic tints ────────────────────────────────────────────────────────
    dangerSurface: 'rgba(220,38,38,0.07)',
    dangerBorder:  'rgba(220,38,38,0.22)',
    successSurface: 'rgba(22,163,74,0.08)',
    successBorder:  'rgba(22,163,74,0.22)',
    warningSurface: 'rgba(217,119,6,0.06)',
    warningBorder:  'rgba(180,83,9,0.16)',
    infoSurface: 'rgba(37,99,235,0.08)',
    infoBorder:  'rgba(37,99,235,0.20)',

    // ── Tab bar ───────────────────────────────────────────────────────────────
    tabBarBg: 'rgba(28,18,48,0.97)',

    // ── Player ───────────────────────────────────────────────────────────────
    playerGlass: 'rgba(255,255,255,0.94)',
  },

  dark: {
    // ── Backgrounds ──────────────────────────────────────────────────────────
    // Matches brand/logo-master.svg's tile color — keep in sync with
    // app.config.js's splashBgColor/androidAdaptiveIconBgColor.
    background:     '#09090B',
    backgroundRgba: '9,9,11',
    surface:        '#121216',
    surfaceAlt:     '#18181D',
    elevated:       '#1C1C22',
    card:           '#15151A',
    cardHover:      '#202027',
    inputBg:        '#121216',

    // ── Scheme-aware fills ───────────────────────────────────────────────────
    subtleFill:       'rgba(255,255,255,0.05)',
    subtleFillMed:    'rgba(255,255,255,0.08)',
    subtleFillStrong: 'rgba(255,255,255,0.12)',

    // ── Glass / overlay ───────────────────────────────────────────────────────
    glass:        'rgba(18,18,22,0.78)',
    glassStrong:  'rgba(18,18,22,0.96)',
    overlay:      'rgba(0,0,0,0.72)',
    overlayLight: 'rgba(0,0,0,0.48)',
    scrim:        'rgba(0,0,0,0.80)',
    mediaScrim:       'rgba(5,4,12,0.62)',
    mediaScrimStrong: 'rgba(5,4,12,0.96)',
    mediaControl:     'rgba(5,4,12,0.64)',
    mediaBorder:      'rgba(255,255,255,0.22)',
    mediaText:        '#FFFFFF',
    mediaTextMuted:   'rgba(255,255,255,0.78)',
    mediaTextSubtle:  'rgba(255,255,255,0.62)',
    liveSurface:      'rgba(244,63,94,0.94)',

    // ── Dividers / borders ────────────────────────────────────────────────────
    divider:      'rgba(255,255,255,0.07)',
    border:       'rgba(255,255,255,0.09)',
    borderStrong: 'rgba(255,255,255,0.16)',
    muted:        '#232329',
    shadow:       '#000000',

    // ── Text ─────────────────────────────────────────────────────────────────
    text:           '#FAFAFA',
    textSecondary:  '#B5B5BE',
    textMuted:      '#A0A0AC',
    text_primary:   '#FAFAFA',
    text_secondary: '#B5B5BE',
    text_accent:    '#DDD3FF',
    textInverse:    '#111114',
    onPrimary:      '#FFFFFF',

    // ── Interactive controls ────────────────────────────────────────────────
    controlSurface:            '#121216',
    controlBorder:             'rgba(255,255,255,0.18)',
    controlText:               '#FAFAFA',
    controlSelectedSurface:    '#6D28D9',
    controlSelectedBorder:     '#A78BFA',
    controlSelectedText:       '#FFFFFF',
    controlSelectedIconSurface:'rgba(255,255,255,0.16)',

    // ── Brand / semantic ──────────────────────────────────────────────────────
    primary:      '#8B5CF6',
    secondary:    '#A78BFA',
    accent:       '#7C3AED',
    accentAlt:    '#9333EA',
    accentRgba:   '139,92,246',
    success:      '#22C55E',
    warning:      '#F59E0B',
    danger:       '#F43F5E',
    info:         '#60A5FA',

    // ── Primary tints ─────────────────────────────────────────────────────────
    primarySurface:     'rgba(139,92,246,0.07)',
    primaryBorder:      'rgba(139,92,246,0.18)',
    primaryFocusBorder: 'rgba(183,148,246,0.38)',

    // ── Semantic tints ────────────────────────────────────────────────────────
    dangerSurface: 'rgba(244,63,94,0.10)',
    dangerBorder:  'rgba(244,63,94,0.28)',
    successSurface: 'rgba(34,197,94,0.10)',
    successBorder:  'rgba(34,197,94,0.26)',
    warningSurface: 'rgba(245,158,11,0.06)',
    warningBorder:  'rgba(251,191,36,0.18)',
    infoSurface: 'rgba(96,165,250,0.10)',
    infoBorder:  'rgba(96,165,250,0.24)',

    // ── Tab bar ───────────────────────────────────────────────────────────────
    tabBarBg: 'rgba(20,20,24,0.98)',

    // ── Player ───────────────────────────────────────────────────────────────
    playerGlass: 'rgba(18,18,22,0.94)',
  },
};

export type ColorScheme = 'light' | 'dark';
