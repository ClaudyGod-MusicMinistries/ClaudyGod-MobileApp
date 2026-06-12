import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{vue,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          1: '#05040a',
          2: '#0d0c14',
          3: '#171523',
        },
        surface: {
          DEFAULT: 'rgba(12,10,20,0.86)',
          strong: 'rgba(18,16,28,0.94)',
        },
        primary: {
          DEFAULT: '#8d63ff',
          soft: '#c5b5ff',
          muted: 'rgba(141,99,255,0.14)',
        },
        ink: {
          DEFAULT: '#f7f4ff',
          soft: '#aaa3c5',
          muted: '#8b84a6',
        },
        border: {
          DEFAULT: 'rgba(141,99,255,0.14)',
          strong: 'rgba(141,99,255,0.28)',
        },
        danger: { DEFAULT: '#e16d6d', muted: 'rgba(225,109,109,0.14)' },
        success: { DEFAULT: '#34d399', muted: 'rgba(52,211,153,0.14)' },
        amber: { DEFAULT: '#f59e0b', muted: 'rgba(245,158,11,0.14)' },
        info: { DEFAULT: '#60a5fa', muted: 'rgba(96,165,250,0.14)' },
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
    },
  },
  plugins: [],
} satisfies Config;
