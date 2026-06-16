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
        primary: '#B794F6',
        secondary: '#C4B5FD',
        accent: '#A78BFA',
        background: '#0A0A0A',
        surface: '#111111',
        card: '#1A1A1A',
        elevated: '#1E1E1E',
        muted: '#141414',
        'muted-foreground': '#7A7288',
        text: '#F5F5F5',
        'text-secondary': '#B8B0CC',
        'text-muted': '#7A7288',
        border: '#2A2A2A',
        'border-strong': '#383838',
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#F43F5E',
      },
      fontFamily: {
        'app': ['Manrope_400Regular', 'sans-serif'],
        'app-semibold': ['Manrope_600SemiBold', 'sans-serif'],
        'app-bold': ['Manrope_700Bold', 'sans-serif'],
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
        lg: 14,
        xl: 20,
        '2xl': 24,
        full: 999,
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
