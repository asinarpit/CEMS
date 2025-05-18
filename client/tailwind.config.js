/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#ff6b01',
        secondary: '#ffa047',
        dark: {
          100: '#1f1f1f',
          200: '#171717',
          300: '#0e0e0e',
        },
        light: {
          100: '#ffffff',
          200: '#f5f5f5',
          300: '#e5e5e5',
        },
      },
    },
  },
  plugins: [],
  darkMode: 'class',
} 