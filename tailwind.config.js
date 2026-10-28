/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#21436A', dark: '#18324F' },
        mint: { DEFAULT: '#BCD8D4', light: '#EBF3F2' },
        ink: { DEFAULT: '#3A3A3A', muted: '#5B6470' },
      },
    },
  },
  plugins: [],
};
