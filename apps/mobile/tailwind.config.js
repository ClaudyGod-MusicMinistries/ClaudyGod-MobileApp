/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}" // Add if you have a src folder
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // Streamer-inspired palette (dark-first) with light fallbacks
      colors: {
        primary: '#1ED760',      // Spotify-esque green for actions
        secondary: '#FF3B30',    // YouTube-inspired red for alerts/accents
        accent: '#22D3EE',       // Cyan for highlights and chips
        surface: '#0F1118',      // Card / panel background
        canvas: '#05060D',       // App background
        muted: '#1F2937',        // Muted surfaces/borders
        'muted-foreground': '#9CA3AF',
      },
      // Add custom font families if needed
      fontFamily: {
        'clash-display': ['ClashDisplay_700Bold', 'sans-serif'],
        'space-grotesk': ['SpaceGrotesk_400Regular', 'sans-serif'],
        'sora': ['Sora_500Medium', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
