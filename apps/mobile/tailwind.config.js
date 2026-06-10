/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', 'dark'],
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#1ED760',
        secondary: '#FF3B30',
        accent: '#22D3EE',
        surface: '#0F1118',
        canvas: '#05060D',
        muted: '#1F2937',
        'muted-foreground': '#9CA3AF',
      },
      fontFamily: {
        'app': ['Manrope_400Regular', 'sans-serif'],
        'app-medium': ['Manrope_500Medium', 'sans-serif'],
        'app-semibold': ['Manrope_600SemiBold', 'sans-serif'],
      },
      spacing: {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24,
        '2xl': 32,
        '3xl': 48,
      },
      borderRadius: {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 20,
        '2xl': 24,
        full: 999,
      },
      elevation: {
        'none': '0 0 0 rgba(0,0,0,0)',
        'xs': '0 1px 2px rgba(0,0,0,0.12)',
        'sm': '0 2px 4px rgba(0,0,0,0.16)',
        'md': '0 4px 8px rgba(0,0,0,0.2)',
        'lg': '0 8px 16px rgba(0,0,0,0.25)',
        'xl': '0 12px 24px rgba(0,0,0,0.3)',
        '2xl': '0 16px 32px rgba(0,0,0,0.35)',
      },
      shadowColor: {
        'DEFAULT': 'rgba(0, 0, 0, 0.25)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(10px)' },
        },
        'slide-left': {
          '0%': { opacity: '0', transform: 'translateX(10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 300ms ease-out',
        'fade-out': 'fade-out 200ms ease-in',
        'slide-up': 'slide-up 300ms ease-out',
        'slide-down': 'slide-down 200ms ease-in',
        'slide-left': 'slide-left 300ms ease-out',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'scale-in': 'scale-in 250ms ease-out',
      },
    },
  },
  plugins: [],
}
