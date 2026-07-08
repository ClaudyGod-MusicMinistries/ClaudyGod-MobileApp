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

    // ── Dividers / borders ────────────────────────────────────────────────────
    divider:      'rgba(0,0,0,0.07)',
    border:       'rgba(0,0,0,0.09)',
    borderStrong: 'rgba(0,0,0,0.16)',
    muted:        '#E8E8E9',
    shadow:       '#000000',

    // ── Text ─────────────────────────────────────────────────────────────────
    text:           '#0D0D0D',
    textSecondary:  '#4A4A4A',
    textMuted:      '#8A8A8A',
    text_primary:   '#0D0D0D',
    text_secondary: '#4A4A4A',
    text_accent:    '#6D28D9',
    textInverse:    '#FFFFFF',
    onPrimary:      '#FFFFFF',

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
    warningSurface: 'rgba(217,119,6,0.06)',
    warningBorder:  'rgba(180,83,9,0.16)',

    // ── Tab bar ───────────────────────────────────────────────────────────────
    tabBarBg: 'rgba(28,18,48,0.97)',

    // ── Player ───────────────────────────────────────────────────────────────
    playerGlass: 'rgba(255,255,255,0.94)',
  },

  dark: {
    // ── Backgrounds ──────────────────────────────────────────────────────────
    // Matches brand/logo-master.svg's tile color — keep in sync with
    // app.config.js's splashBgColor/androidAdaptiveIconBgColor.
    background:     '#1C1230',
    backgroundRgba: '28,18,48',
    surface:        '#0F0C18',
    surfaceAlt:     '#141020',
    elevated:       '#141020',
    card:           '#141020',
    cardHover:      '#1A1525',
    inputBg:        '#0F0C18',

    // ── Scheme-aware fills ───────────────────────────────────────────────────
    subtleFill:       'rgba(255,255,255,0.05)',
    subtleFillMed:    'rgba(255,255,255,0.08)',
    subtleFillStrong: 'rgba(255,255,255,0.12)',

    // ── Glass / overlay ───────────────────────────────────────────────────────
    glass:        'rgba(28,18,48,0.72)',
    glassStrong:  'rgba(28,18,48,0.94)',
    overlay:      'rgba(0,0,0,0.72)',
    overlayLight: 'rgba(0,0,0,0.48)',
    scrim:        'rgba(0,0,0,0.80)',

    // ── Dividers / borders ────────────────────────────────────────────────────
    divider:      'rgba(139,92,246,0.10)',
    border:       'rgba(255,255,255,0.08)',
    borderStrong: 'rgba(255,255,255,0.14)',
    muted:        '#0F0C18',
    shadow:       '#000000',

    // ── Text ─────────────────────────────────────────────────────────────────
    text:           '#F7F2FF',
    textSecondary:  '#B8B0CC',
    textMuted:      'rgba(247,242,255,0.42)',
    text_primary:   '#F7F2FF',
    text_secondary: '#B8B0CC',
    text_accent:    '#D8CAFF',
    textInverse:    '#1C1230',
    onPrimary:      '#FFFFFF',

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
    warningSurface: 'rgba(245,158,11,0.06)',
    warningBorder:  'rgba(251,191,36,0.18)',

    // ── Tab bar ───────────────────────────────────────────────────────────────
    tabBarBg: 'rgba(28,18,48,0.97)',

    // ── Player ───────────────────────────────────────────────────────────────
    playerGlass: 'rgba(28,18,48,0.92)',
  },
};

export type ColorScheme = 'light' | 'dark';
