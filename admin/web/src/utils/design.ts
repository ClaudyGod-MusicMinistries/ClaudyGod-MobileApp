/**
 * Centralized design system constants for the ClaudyGod admin panel.
 * Mirrors tailwind.config.ts tokens so TypeScript code can reference them
 * without magic strings.  Import what you need — no runtime cost.
 */

// ── Color palette ─────────────────────────────────────────────────────────────
export const colors = {
  // Backgrounds
  bg1: '#05040a',
  bg2: '#0d0c14',
  bg3: '#171523',
  // Surfaces (glassmorphism)
  surface: 'rgba(12,10,20,0.86)',
  surfaceStrong: 'rgba(18,16,28,0.94)',
  // Brand purple
  primary: '#8d63ff',
  primarySoft: '#c5b5ff',
  primaryMuted: 'rgba(141,99,255,0.14)',
  primaryRgb: '141,99,255',
  // Text
  ink: '#f7f4ff',
  inkSoft: '#aaa3c5',
  inkMuted: '#8b84a6',
  // Borders
  border: 'rgba(141,99,255,0.14)',
  borderStrong: 'rgba(141,99,255,0.28)',
  // Semantic
  danger:  '#e16d6d',  dangerMuted:  'rgba(225,109,109,0.14)',
  success: '#34d399',  successMuted: 'rgba(52,211,153,0.14)',
  amber:   '#f59e0b',  amberMuted:   'rgba(245,158,11,0.14)',
  info:    '#60a5fa',  infoMuted:    'rgba(96,165,250,0.14)',
} as const;

// ── Gradients (CSS strings) ───────────────────────────────────────────────────
export const gradients = {
  /** Violet CTA button — matches brand gradient */
  primaryCta: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
  /** Soft hover variant */
  primaryCtaHover: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
  /** Auth panel left side background */
  panelLeft: 'linear-gradient(160deg, #0a0614 0%, #160c32 38%, #1e0e45 65%, #0c0718 100%)',
  /** Gradient text span: brand headline highlight */
  heroText: 'linear-gradient(92deg, #c4b5fd 0%, #818cf8 55%, #8b5cf6 100%)',
  /** Top radial glow used on landing / auth panel */
  glowTop: 'radial-gradient(ellipse, rgba(124,58,237,0.34) 0%, transparent 70%)',
  /** Bottom radial glow */
  glowBottom: 'radial-gradient(ellipse, rgba(79,70,229,0.22) 0%, transparent 70%)',
  /** Side accent glow */
  glowSide: 'radial-gradient(ellipse, rgba(147,51,234,0.18) 0%, transparent 70%)',
  /** Vertical separator line */
  borderLine: 'linear-gradient(to bottom, transparent, rgba(141,99,255,0.30) 30%, rgba(141,99,255,0.30) 70%, transparent)',
} as const;

// ── Typography ────────────────────────────────────────────────────────────────
export const typography = {
  fontBody:    '"Inter", "Aptos", "Segoe UI Variable", "SF Pro Text", system-ui, sans-serif',
  fontDisplay: '"Aptos Display", "Aptos", "Segoe UI Variable", system-ui, sans-serif',
  sizes: {
    xs:   '0.75rem',
    sm:   '0.875rem',
    base: '1rem',
    lg:   '1.125rem',
    xl:   '1.25rem',
    '2xl':'1.5rem',
    hero: 'clamp(2.2rem, 3.5vw, 3rem)',
    landing: 'clamp(2.6rem, 4.2vw, 3.6rem)',
  },
} as const;

// ── Spacing & radius ──────────────────────────────────────────────────────────
export const radius = {
  sm:   '8px',
  md:   '12px',
  lg:   '16px',
  xl:   '22px',
  full: '9999px',
} as const;

// ── Shadow presets ────────────────────────────────────────────────────────────
export const shadows = {
  panel: '0 24px 70px rgba(0,0,0,0.32)',
  glow:  '0 0 24px rgba(141,99,255,0.18)',
  glowSm:'0 0 12px rgba(141,99,255,0.12)',
  card:  '0 8px 32px rgba(0,0,0,0.24)',
} as const;

// ── Reusable Tailwind class strings ──────────────────────────────────────────
// These are static strings safe to use in class bindings — they get picked up
// by Tailwind's content scanner at build time.
export const cls = {
  // Labels
  fieldLabel: 'text-xs font-semibold text-ink-muted uppercase tracking-wide',
  // Inputs (dark)
  inputDark: [
    'w-full border rounded-2xl text-sm py-3 px-4 transition-all duration-150',
    'bg-bg-1 border-border text-ink placeholder:text-ink-muted',
    'focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/25',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' '),
  // Cards
  cardDark:  'rounded-3xl border border-border bg-surface backdrop-blur-sm',
  cardGlass: 'rounded-3xl border border-border/60 backdrop-blur-md',
  // Badges
  badgePrimary: 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary-soft text-xs font-medium',
  badgeDanger:  'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-danger/10 border border-danger/20 text-danger text-xs font-medium',
  badgeSuccess: 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 border border-success/20 text-success text-xs font-medium',
  badgeAmber:   'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber/10 border border-amber/20 text-amber text-xs font-medium',
  // Dividers
  divider: 'h-px bg-border',
  // Role picker buttons
  roleBtn: 'flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all',
  roleBtnActive:   'bg-primary/15 border-primary/40 text-primary-soft',
  roleBtnInactive: 'bg-white/3 border-white/8 text-ink-muted hover:border-white/15 hover:text-ink-soft',
  // Link
  link: 'font-semibold text-primary-soft hover:text-primary transition-colors',
} as const;

// ── Semantic gradient-text helper (use in style binding) ─────────────────────
export const gradientText = (gradient: string) => ({
  background: gradient,
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
});
