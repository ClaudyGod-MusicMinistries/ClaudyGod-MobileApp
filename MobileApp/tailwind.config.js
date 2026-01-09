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
      // Add your custom colors to match your design system
      colors: {
        primary: {
          50: '#fdf2f8',
          500: '#E1306C', // Your pink color
          600: '#be185d',
          700: '#9d174d',
        },
        purple: {
          500: '#8B5CF6', // Your purple color
          600: '#7C3AED',
        }
      },
      // Add custom font families if needed
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
        'work-sans': ['Work Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}