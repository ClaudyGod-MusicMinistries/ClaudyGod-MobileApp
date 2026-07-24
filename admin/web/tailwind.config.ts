import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{vue,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // All color values resolve through CSS custom properties defined per-theme
      // in src/assets/styles/main.css (:root = light, :root.dark = dark) so that
      // every existing `bg-primary`, `text-ink-soft`, `border-border` etc. call site
      // repaints under both themes with zero class-name changes anywhere else.
      colors: {
        bg: {
          1: 'rgb(var(--bg-1) / <alpha-value>)',
          2: 'rgb(var(--bg-2) / <alpha-value>)',
          3: 'rgb(var(--bg-3) / <alpha-value>)',
        },
        surface: {
          DEFAULT: 'rgb(var(--surface))',
          strong: 'rgb(var(--surface-strong))',
          // Replaces literal bg-white/N hover/elevation tricks scattered across the
          // UI kit — those invert to invisible-on-light-bg in a real light theme.
          hover: 'rgb(var(--surface-hover))',
        },
        primary: {
          DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
          soft: 'rgb(var(--primary-soft) / <alpha-value>)',
          muted: 'rgb(var(--primary-muted))',
        },
        ink: {
          DEFAULT: 'rgb(var(--ink) / <alpha-value>)',
          soft: 'rgb(var(--ink-soft) / <alpha-value>)',
          muted: 'rgb(var(--ink-muted) / <alpha-value>)',
        },
        border: {
          DEFAULT: 'rgb(var(--border))',
          strong: 'rgb(var(--border-strong))',
        },
        danger: { DEFAULT: 'rgb(var(--danger) / <alpha-value>)', muted: 'rgb(var(--danger-muted))' },
        success: { DEFAULT: 'rgb(var(--success) / <alpha-value>)', muted: 'rgb(var(--success-muted))' },
        amber: { DEFAULT: 'rgb(var(--amber) / <alpha-value>)', muted: 'rgb(var(--amber-muted))' },
        info: { DEFAULT: 'rgb(var(--info) / <alpha-value>)', muted: 'rgb(var(--info-muted))' },
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '22px',
      },
      fontFamily: {
        sans: ['"Aptos"', '"Segoe UI Variable"', '"SF Pro Text"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Aptos Display"', '"Aptos"', '"Segoe UI Variable"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        panel: '0 24px 70px rgba(0,0,0,0.32)',
        glow: '0 0 24px rgba(141,99,255,0.18)',
        'glow-sm': '0 0 12px rgba(141,99,255,0.12)',
      },
      backdropBlur: {
        xs: '4px',
      },
      // Named durations replace the ad hoc 0.15s/0.18s/0.2s scattered across
      // components: fast = hover/focus, base = panels/modals/dropdowns,
      // slow = reserved for the onboarding-tour spotlight/tooltip entrance only.
      transitionDuration: {
        fast: '120ms',
        base: '180ms',
        slow: '260ms',
      },
      transitionTimingFunction: {
        swift: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
} satisfies Config;
