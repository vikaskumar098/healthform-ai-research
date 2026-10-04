/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fb',
          400: '#36abf7',
          500: '#0c8fe9',
          600: '#0270c7',
          700: '#0359a1',
          800: '#074c84',
          900: '#0c406e',
          950: '#082949',
        },
        deepIndigo: {
          50: '#f0f4ff',
          100: '#e0e8ff',
          200: '#c1d1ff',
          300: '#a3b9ff',
          400: '#849fff',
          500: '#657fff',
          600: '#475fff',
          700: '#2845ff',
          800: '#0a2cfe',
          900: '#0019e6',
        },
        medical: {
          slate: '#0f172a',
          emerald: '#059669',
          amber: '#d97706',
          rose: '#e11d48',
          indigo: '#4f46e5',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
